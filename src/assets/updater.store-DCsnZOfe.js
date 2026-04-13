import { readdir, rename, rm, mkdir, writeFile, access } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";
const globalUpdateStatus = {
  autoUpdateSupported: false,
  updateLevel: null,
  updateCompleted: false,
  updated: false,
  waitingForRestart: false,
  currentVersion: "",
  remoteVersion: null,
  installPath: null,
  message: "Idle",
  error: null,
  forceUpdate: false,
  publishDate: 0
};
function updateStatus(status) {
  const keys = Object.keys(status);
  for (const key of keys) {
    globalUpdateStatus[key] = status[key];
  }
}
async function createUpdaterStore() {
  console.log("[updater.store.ts] Creating updater store instance");
  const instance = {
    get status() {
      return globalUpdateStatus;
    },
    updateStatus(status) {
      const keys = Object.keys(status);
      for (const key of keys) {
        globalUpdateStatus[key] = status[key];
      }
    },
    async downloadAndInstall(context, currentVersion, latestJson, activeSource) {
      const logger = context.logger;
      logger.info("[updater.store.ts] Starting download and install process");
      const remoteVersion = latestJson.version;
      const rabbixDir = join("C:", "Users", process.env.USERNAME || process.env.USER || "", "AppData", "Local", "rabbix");
      const targetVersionDir = join(rabbixDir, `v${remoteVersion}`);
      logger.info("[updater.store.ts] Target version directory:", targetVersionDir);
      const splitFiles = latestJson.splitFiles?.["win32-x64"];
      if (!splitFiles || splitFiles.length === 0) {
        logger.error("[updater.store.ts] No win32-x64 split files found");
        throw context.reject("UPDATER_NO_SPLIT_FILES", {});
      }
      const splitHashes = latestJson.splitFileHashes?.["win32-x64"] || [];
      const downloadedParts = [];
      for (let index = 0; index < splitFiles.length; index++) {
        const filePath = splitFiles[index];
        const expectedHash = splitHashes[index];
        const fullUrl = `${activeSource}${filePath}`;
        logger.info(`[updater.store.ts] Downloading part ${index + 1} of ${splitFiles.length}:`, filePath);
        updateStatus({
          message: `Downloading update...`
        });
        let lastError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch(fullUrl, {
              signal: AbortSignal.timeout(12e4)
            });
            if (!response.ok) {
              lastError = `HTTP ${response.status}`;
              if (attempt < 2) {
                logger.info("[updater.store.ts] HTTP error, retrying in 5s...");
                await new Promise((resolve) => setTimeout(resolve, 5e3));
                continue;
              }
              throw context.reject("UPDATER_DOWNLOAD_FAILED", {
                partIndex: index + 1,
                error: lastError
              });
            }
            const data = new Uint8Array(await response.arrayBuffer());
            if (expectedHash) {
              const actualHash = createHash("sha256").update(data).digest("hex");
              if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) {
                throw context.reject("UPDATER_HASH_MISMATCH", {
                  expected: expectedHash,
                  actual: actualHash
                });
              }
            }
            downloadedParts.push(data);
            lastError = null;
            logger.info(`[updater.store.ts] Part ${index + 1} downloaded successfully`);
            break;
          } catch (error) {
            if (error && typeof error === "object" && "$milkioReject" in error) {
              updateStatus({
                message: `Download failed: ${lastError || "Unknown error"}`,
                error: String(error)
              });
              throw error;
            }
            lastError = error instanceof Error ? error.message : String(error);
            logger.info(`[updater.store.ts] Download attempt ${attempt + 1} failed:`, lastError);
            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 5e3));
            }
          }
        }
        if (lastError) {
          updateStatus({
            message: `Download failed: ${lastError}`,
            error: lastError
          });
          throw context.reject("UPDATER_DOWNLOAD_FAILED", {
            partIndex: index + 1,
            error: lastError
          });
        }
      }
      logger.info("[updater.store.ts] All parts downloaded, merging...");
      updateStatus({
        message: "Merging files..."
      });
      let totalLength = 0;
      for (let i = 0; i < downloadedParts.length; i++) {
        totalLength += downloadedParts[i].length;
      }
      const mergedZip = new Uint8Array(totalLength);
      let offset = 0;
      for (let i = 0; i < downloadedParts.length; i++) {
        mergedZip.set(downloadedParts[i], offset);
        offset += downloadedParts[i].length;
      }
      const tempDir = join(rabbixDir, ".tmp_update");
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
      }
      await mkdir(tempDir, { recursive: true });
      const tempZipPath = join(tempDir, "update.zip");
      await writeFile(tempZipPath, mergedZip);
      logger.info("[updater.store.ts] Extracting archive...");
      updateStatus({
        message: "Extracting..."
      });
      try {
        execSync(`powershell -NoProfile -NonInteractive -Command "Expand-Archive -LiteralPath '${tempZipPath}' -DestinationPath '${tempDir}' -Force"`, {
          stdio: "pipe"
        });
      } catch (error) {
        await rm(tempDir, { recursive: true, force: true });
        const errorMsg = error instanceof Error ? error.message : String(error);
        updateStatus({
          message: `Extraction failed: ${errorMsg}`,
          error: errorMsg
        });
        throw context.reject("UPDATER_EXTRACTION_FAILED", { error: errorMsg });
      }
      await rm(tempZipPath, { force: true });
      try {
        await access(targetVersionDir);
        await rm(targetVersionDir, { recursive: true, force: true });
      } catch {
      }
      const extractedEntries = await readdir(tempDir, { withFileTypes: true });
      let sourceDir = tempDir;
      if (extractedEntries.length === 1 && extractedEntries[0].isDirectory()) {
        sourceDir = join(tempDir, extractedEntries[0].name);
      }
      logger.info("[updater.store.ts] Moving extracted files to target directory:", targetVersionDir);
      updateStatus({
        message: "Installing..."
      });
      try {
        await rename(sourceDir, targetVersionDir);
      } catch (error) {
        await rm(tempDir, { recursive: true, force: true });
        const errorMsg = error instanceof Error ? error.message : String(error);
        updateStatus({
          message: `Installation failed: ${errorMsg}`,
          error: errorMsg
        });
        throw context.reject("UPDATER_INSTALL_FAILED", { error: errorMsg });
      }
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
      }
      await instance.cleanupOldVersions(rabbixDir, currentVersion, remoteVersion);
      logger.info("[updater.store.ts] Update completed successfully, version:", remoteVersion);
      updateStatus({
        message: "Update successful",
        updateCompleted: true,
        updated: true,
        waitingForRestart: true,
        installPath: targetVersionDir
      });
    },
    async cleanupOldVersions(rabbixDir, currentVersion, latestVersion) {
      console.log("[updater.store.ts] Cleaning up old versions");
      const currentVersionDir = `v${currentVersion.startsWith("v") ? currentVersion.slice(1) : currentVersion}`;
      const latestVersionDir = `v${latestVersion.startsWith("v") ? latestVersion.slice(1) : latestVersion}`;
      let entries;
      try {
        entries = await readdir(rabbixDir);
      } catch {
        return;
      }
      const timestamp = Date.now();
      for (const entry of entries) {
        if (!entry.startsWith("v")) continue;
        if (entry === currentVersionDir || entry === latestVersionDir) continue;
        const oldVersionPath = join(rabbixDir, entry);
        const tempName = `.del_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
        const tempPath = join(rabbixDir, tempName);
        try {
          await rename(oldVersionPath, tempPath);
        } catch {
          continue;
        }
        try {
          await rm(tempPath, { recursive: true, force: true });
        } catch {
        }
      }
    }
  };
  return instance;
}
let instancePromise = null;
function useUpdaterStore() {
  if (!instancePromise) instancePromise = createUpdaterStore();
  return instancePromise;
}
export {
  useUpdaterStore as u
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlci5zdG9yZS1EQ3NuWk9mZS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWNjZXNzLCBta2RpciwgcmVhZGRpciwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5pbnRlcmZhY2UgTGF0ZXN0SnNvbiB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgc3BsaXRGaWxlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPjtcbiAgc3BsaXRGaWxlSGFzaGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG4vLyDkvb/nlKggc2VtdmVyIOagh+WHhuacr+ivre+8mm1ham9yKOS4u+eJiOacrCnjgIFtaW5vcijmrKHopoHniYjmnKwp44CBcGF0Y2go5L+u6K6i54mI5pysKVxudHlwZSBVcGRhdGVMZXZlbCA9ICdtYWpvcicgfCAnbWlub3InIHwgJ3BhdGNoJztcblxuaW50ZXJmYWNlIFVwZGF0ZVN0YXR1cyB7XG4gIGF1dG9VcGRhdGVTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZUxldmVsOiBVcGRhdGVMZXZlbCB8IG51bGw7XG4gIHVwZGF0ZUNvbXBsZXRlZDogYm9vbGVhbjtcbiAgdXBkYXRlZDogYm9vbGVhbjtcbiAgd2FpdGluZ0ZvclJlc3RhcnQ6IGJvb2xlYW47XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIHJlbW90ZVZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGluc3RhbGxQYXRoOiBzdHJpbmcgfCBudWxsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIGVycm9yOiBzdHJpbmcgfCBudWxsO1xuICBmb3JjZVVwZGF0ZTogYm9vbGVhbjtcbiAgcHVibGlzaERhdGU6IG51bWJlcjtcbn1cblxuY29uc3QgZ2xvYmFsVXBkYXRlU3RhdHVzOiBVcGRhdGVTdGF0dXMgPSB7XG4gIGF1dG9VcGRhdGVTdXBwb3J0ZWQ6IGZhbHNlLFxuICB1cGRhdGVMZXZlbDogbnVsbCxcbiAgdXBkYXRlQ29tcGxldGVkOiBmYWxzZSxcbiAgdXBkYXRlZDogZmFsc2UsXG4gIHdhaXRpbmdGb3JSZXN0YXJ0OiBmYWxzZSxcbiAgY3VycmVudFZlcnNpb246ICcnLFxuICByZW1vdGVWZXJzaW9uOiBudWxsLFxuICBpbnN0YWxsUGF0aDogbnVsbCxcbiAgbWVzc2FnZTogJ0lkbGUnLFxuICBlcnJvcjogbnVsbCxcbiAgZm9yY2VVcGRhdGU6IGZhbHNlLFxuICBwdWJsaXNoRGF0ZTogMCxcbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc3RhdHVzKSBhcyBBcnJheTxrZXlvZiBVcGRhdGVTdGF0dXM+O1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVVcGRhdGVyU3RvcmUoKSB7XG4gIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ3JlYXRpbmcgdXBkYXRlciBzdG9yZSBpbnN0YW5jZScpO1xuXG4gIGNvbnN0IGluc3RhbmNlID0ge1xuICAgIGdldCBzdGF0dXMoKSB7XG4gICAgICByZXR1cm4gZ2xvYmFsVXBkYXRlU3RhdHVzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXMoc3RhdHVzOiBQYXJ0aWFsPFVwZGF0ZVN0YXR1cz4pOiB2b2lkIHtcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzdGF0dXMpIGFzIEFycmF5PGtleW9mIFVwZGF0ZVN0YXR1cz47XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgIChnbG9iYWxVcGRhdGVTdGF0dXMgYXMgYW55KVtrZXldID0gc3RhdHVzW2tleV07XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGRvd25sb2FkQW5kSW5zdGFsbChjb250ZXh0OiBhbnksIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsIGxhdGVzdEpzb246IExhdGVzdEpzb24sIGFjdGl2ZVNvdXJjZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gU3RhcnRpbmcgZG93bmxvYWQgYW5kIGluc3RhbGwgcHJvY2VzcycpO1xuXG4gICAgICBjb25zdCByZW1vdGVWZXJzaW9uID0gbGF0ZXN0SnNvbi52ZXJzaW9uO1xuXG4gICAgICBjb25zdCByYWJiaXhEaXIgPSBqb2luKCdDOicsICdVc2VycycsIHByb2Nlc3MuZW52LlVTRVJOQU1FIHx8IHByb2Nlc3MuZW52LlVTRVIgfHwgJycsICdBcHBEYXRhJywgJ0xvY2FsJywgJ3JhYmJpeCcpO1xuICAgICAgY29uc3QgdGFyZ2V0VmVyc2lvbkRpciA9IGpvaW4ocmFiYml4RGlyLCBgdiR7cmVtb3RlVmVyc2lvbn1gKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBUYXJnZXQgdmVyc2lvbiBkaXJlY3Rvcnk6JywgdGFyZ2V0VmVyc2lvbkRpcik7XG5cbiAgICAgIGNvbnN0IHNwbGl0RmlsZXMgPSBsYXRlc3RKc29uLnNwbGl0RmlsZXM/Llsnd2luMzIteDY0J107XG4gICAgICBpZiAoIXNwbGl0RmlsZXMgfHwgc3BsaXRGaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdbdXBkYXRlci5zdG9yZS50c10gTm8gd2luMzIteDY0IHNwbGl0IGZpbGVzIGZvdW5kJyk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX05PX1NQTElUX0ZJTEVTJywge30pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzcGxpdEhhc2hlcyA9IGxhdGVzdEpzb24uc3BsaXRGaWxlSGFzaGVzPy5bJ3dpbjMyLXg2NCddIHx8IFtdO1xuICAgICAgY29uc3QgZG93bmxvYWRlZFBhcnRzOiBVaW50OEFycmF5W10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHNwbGl0RmlsZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gc3BsaXRGaWxlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkSGFzaCA9IHNwbGl0SGFzaGVzW2luZGV4XTtcbiAgICAgICAgY29uc3QgZnVsbFVybCA9IGAke2FjdGl2ZVNvdXJjZX0ke2ZpbGVQYXRofWA7XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBEb3dubG9hZGluZyBwYXJ0ICR7aW5kZXggKyAxfSBvZiAke3NwbGl0RmlsZXMubGVuZ3RofTpgLCBmaWxlUGF0aCk7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkaW5nIHVwZGF0ZS4uLmAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZnVsbFVybCwge1xuICAgICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTIwMDAwKSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGxhc3RFcnJvciA9IGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWA7XG4gICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gSFRUUCBlcnJvciwgcmV0cnlpbmcgaW4gNXMuLi4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfRE9XTkxPQURfRkFJTEVEJywge1xuICAgICAgICAgICAgICAgIHBhcnRJbmRleDogaW5kZXggKyAxLFxuICAgICAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSk7XG5cbiAgICAgICAgICAgIGlmIChleHBlY3RlZEhhc2gpIHtcbiAgICAgICAgICAgICAgY29uc3QgYWN0dWFsSGFzaCA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShkYXRhKS5kaWdlc3QoJ2hleCcpO1xuICAgICAgICAgICAgICBpZiAoYWN0dWFsSGFzaC50b0xvd2VyQ2FzZSgpICE9PSBleHBlY3RlZEhhc2gudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0hBU0hfTUlTTUFUQ0gnLCB7XG4gICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRIYXNoLFxuICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWxIYXNoLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvd25sb2FkZWRQYXJ0cy5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgbGFzdEVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gUGFydCAke2luZGV4ICsgMX0gZG93bmxvYWRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgJiYgdHlwZW9mIGVycm9yID09PSAnb2JqZWN0JyAmJiAnJG1pbGtpb1JlamVjdCcgaW4gZXJyb3IpIHtcbiAgICAgICAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWQgZmFpbGVkOiAke2xhc3RFcnJvciB8fCAnVW5rbm93biBlcnJvcid9YCxcbiAgICAgICAgICAgICAgICBlcnJvcjogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdEVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBEb3dubG9hZCBhdHRlbXB0ICR7YXR0ZW1wdCArIDF9IGZhaWxlZDpgLCBsYXN0RXJyb3IpO1xuICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCAyKSB7XG4gICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGFzdEVycm9yKSB7XG4gICAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBEb3dubG9hZCBmYWlsZWQ6ICR7bGFzdEVycm9yfWAsXG4gICAgICAgICAgICBlcnJvcjogbGFzdEVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0RPV05MT0FEX0ZBSUxFRCcsIHtcbiAgICAgICAgICAgIHBhcnRJbmRleDogaW5kZXggKyAxLFxuICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEFsbCBwYXJ0cyBkb3dubG9hZGVkLCBtZXJnaW5nLi4uJyk7XG4gICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICBtZXNzYWdlOiAnTWVyZ2luZyBmaWxlcy4uLicsXG4gICAgICB9KTtcblxuICAgICAgbGV0IHRvdGFsTGVuZ3RoID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG93bmxvYWRlZFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoICs9IGRvd25sb2FkZWRQYXJ0c1tpXSEubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkWmlwID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xuICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkZWRQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZXJnZWRaaXAuc2V0KGRvd25sb2FkZWRQYXJ0c1tpXSEsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcERpciA9IGpvaW4ocmFiYml4RGlyLCAnLnRtcF91cGRhdGUnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGF3YWl0IG1rZGlyKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCB0ZW1wWmlwUGF0aCA9IGpvaW4odGVtcERpciwgJ3VwZGF0ZS56aXAnKTtcbiAgICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wWmlwUGF0aCwgbWVyZ2VkWmlwKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBFeHRyYWN0aW5nIGFyY2hpdmUuLi4nKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdFeHRyYWN0aW5nLi4uJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBleGVjU3luYyhgcG93ZXJzaGVsbCAtTm9Qcm9maWxlIC1Ob25JbnRlcmFjdGl2ZSAtQ29tbWFuZCBcIkV4cGFuZC1BcmNoaXZlIC1MaXRlcmFsUGF0aCAnJHt0ZW1wWmlwUGF0aH0nIC1EZXN0aW5hdGlvblBhdGggJyR7dGVtcERpcn0nIC1Gb3JjZVwiYCwge1xuICAgICAgICAgIHN0ZGlvOiAncGlwZScsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgYXdhaXQgcm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgRXh0cmFjdGlvbiBmYWlsZWQ6ICR7ZXJyb3JNc2d9YCxcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9FWFRSQUNUSU9OX0ZBSUxFRCcsIHsgZXJyb3I6IGVycm9yTXNnIH0pO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBybSh0ZW1wWmlwUGF0aCwgeyBmb3JjZTogdHJ1ZSB9KTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYWNjZXNzKHRhcmdldFZlcnNpb25EaXIpO1xuICAgICAgICBhd2FpdCBybSh0YXJnZXRWZXJzaW9uRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGNvbnN0IGV4dHJhY3RlZEVudHJpZXMgPSBhd2FpdCByZWFkZGlyKHRlbXBEaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIGxldCBzb3VyY2VEaXIgPSB0ZW1wRGlyO1xuXG4gICAgICBpZiAoZXh0cmFjdGVkRW50cmllcy5sZW5ndGggPT09IDEgJiYgZXh0cmFjdGVkRW50cmllc1swXSEuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICBzb3VyY2VEaXIgPSBqb2luKHRlbXBEaXIsIGV4dHJhY3RlZEVudHJpZXNbMF0hLm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIE1vdmluZyBleHRyYWN0ZWQgZmlsZXMgdG8gdGFyZ2V0IGRpcmVjdG9yeTonLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdJbnN0YWxsaW5nLi4uJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZW5hbWUoc291cmNlRGlyLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYEluc3RhbGxhdGlvbiBmYWlsZWQ6ICR7ZXJyb3JNc2d9YCxcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9JTlNUQUxMX0ZBSUxFRCcsIHsgZXJyb3I6IGVycm9yTXNnIH0pO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGF3YWl0IGluc3RhbmNlLmNsZWFudXBPbGRWZXJzaW9ucyhyYWJiaXhEaXIsIGN1cnJlbnRWZXJzaW9uLCByZW1vdGVWZXJzaW9uKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBVcGRhdGUgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSwgdmVyc2lvbjonLCByZW1vdGVWZXJzaW9uKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdVcGRhdGUgc3VjY2Vzc2Z1bCcsXG4gICAgICAgIHVwZGF0ZUNvbXBsZXRlZDogdHJ1ZSxcbiAgICAgICAgdXBkYXRlZDogdHJ1ZSxcbiAgICAgICAgd2FpdGluZ0ZvclJlc3RhcnQ6IHRydWUsXG4gICAgICAgIGluc3RhbGxQYXRoOiB0YXJnZXRWZXJzaW9uRGlyLFxuICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFzeW5jIGNsZWFudXBPbGRWZXJzaW9ucyhyYWJiaXhEaXI6IHN0cmluZywgY3VycmVudFZlcnNpb246IHN0cmluZywgbGF0ZXN0VmVyc2lvbjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zb2xlLmxvZygnW3VwZGF0ZXIuc3RvcmUudHNdIENsZWFuaW5nIHVwIG9sZCB2ZXJzaW9ucycpO1xuICAgICAgY29uc3QgY3VycmVudFZlcnNpb25EaXIgPSBgdiR7Y3VycmVudFZlcnNpb24uc3RhcnRzV2l0aCgndicpID8gY3VycmVudFZlcnNpb24uc2xpY2UoMSkgOiBjdXJyZW50VmVyc2lvbn1gO1xuICAgICAgY29uc3QgbGF0ZXN0VmVyc2lvbkRpciA9IGB2JHtsYXRlc3RWZXJzaW9uLnN0YXJ0c1dpdGgoJ3YnKSA/IGxhdGVzdFZlcnNpb24uc2xpY2UoMSkgOiBsYXRlc3RWZXJzaW9ufWA7XG5cbiAgICAgIGxldCBlbnRyaWVzOiBzdHJpbmdbXTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGVudHJpZXMgPSBhd2FpdCByZWFkZGlyKHJhYmJpeERpcik7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpO1xuXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgaWYgKCFlbnRyeS5zdGFydHNXaXRoKCd2JykpIGNvbnRpbnVlO1xuICAgICAgICBpZiAoZW50cnkgPT09IGN1cnJlbnRWZXJzaW9uRGlyIHx8IGVudHJ5ID09PSBsYXRlc3RWZXJzaW9uRGlyKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvbGRWZXJzaW9uUGF0aCA9IGpvaW4ocmFiYml4RGlyLCBlbnRyeSk7XG4gICAgICAgIGNvbnN0IHRlbXBOYW1lID0gYC5kZWxfJHt0aW1lc3RhbXB9XyR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgOCl9YDtcbiAgICAgICAgY29uc3QgdGVtcFBhdGggPSBqb2luKHJhYmJpeERpciwgdGVtcE5hbWUpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcmVuYW1lKG9sZFZlcnNpb25QYXRoLCB0ZW1wUGF0aCk7XG4gICAgICAgIH0gY2F0Y2gge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBybSh0ZW1wUGF0aCwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmxldCBpbnN0YW5jZVByb21pc2U6IFJldHVyblR5cGU8dHlwZW9mIGNyZWF0ZVVwZGF0ZXJTdG9yZT4gfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIHVzZVVwZGF0ZXJTdG9yZSgpIHtcbiAgaWYgKCFpbnN0YW5jZVByb21pc2UpIGluc3RhbmNlUHJvbWlzZSA9IGNyZWF0ZVVwZGF0ZXJTdG9yZSgpO1xuICByZXR1cm4gaW5zdGFuY2VQcm9taXNlO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUE2QkEsTUFBTSxxQkFBbUM7QUFBQSxFQUN2QyxxQkFBcUI7QUFBQSxFQUNyQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixTQUFTO0FBQUEsRUFDVCxtQkFBbUI7QUFBQSxFQUNuQixnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUEsRUFDZixhQUFhO0FBQUEsRUFDYixTQUFTO0FBQUEsRUFDVCxPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsRUFDYixhQUFhO0FBQ2Y7QUFFQSxTQUFTLGFBQWEsUUFBcUM7QUFDekQsUUFBTSxPQUFPLE9BQU8sS0FBSyxNQUFNO0FBQy9CLGFBQVcsT0FBTyxNQUFNO0FBQ3JCLHVCQUEyQixHQUFHLElBQUksT0FBTyxHQUFHO0FBQUEsRUFDL0M7QUFDRjtBQUVBLGVBQWUscUJBQXFCO0FBQ2xDLFVBQVEsSUFBSSxvREFBb0Q7QUFFaEUsUUFBTSxXQUFXO0FBQUEsSUFDZixJQUFJLFNBQVM7QUFDWCxhQUFPO0FBQUEsSUFDVDtBQUFBLElBRUEsYUFBYSxRQUFxQztBQUNoRCxZQUFNLE9BQU8sT0FBTyxLQUFLLE1BQU07QUFDL0IsaUJBQVcsT0FBTyxN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
