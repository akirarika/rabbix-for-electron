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
  progress: "",
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
          message: `Downloading update...`,
          progress: `Downloading ${index + 1}/${splitFiles.length}`
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
        message: "Merging files...",
        progress: "Merging"
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
        message: "Extracting...",
        progress: "Extracting"
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
        message: "Installing...",
        progress: "Installing"
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
        progress: "",
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlci5zdG9yZS1CV2dXRm9WSC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWNjZXNzLCBta2RpciwgcmVhZGRpciwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuXG5pbnRlcmZhY2UgTGF0ZXN0SnNvbiB7XG4gIHZlcnNpb246IHN0cmluZztcbiAgc3BsaXRGaWxlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPjtcbiAgc3BsaXRGaWxlSGFzaGVzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nW10+O1xufVxuXG4vLyDkvb/nlKggc2VtdmVyIOagh+WHhuacr+ivre+8mm1ham9yKOS4u+eJiOacrCnjgIFtaW5vcijmrKHopoHniYjmnKwp44CBcGF0Y2go5L+u6K6i54mI5pysKVxudHlwZSBVcGRhdGVMZXZlbCA9ICdtYWpvcicgfCAnbWlub3InIHwgJ3BhdGNoJztcblxuaW50ZXJmYWNlIFVwZGF0ZVN0YXR1cyB7XG4gIGF1dG9VcGRhdGVTdXBwb3J0ZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZUxldmVsOiBVcGRhdGVMZXZlbCB8IG51bGw7XG4gIHVwZGF0ZUNvbXBsZXRlZDogYm9vbGVhbjtcbiAgdXBkYXRlZDogYm9vbGVhbjtcbiAgd2FpdGluZ0ZvclJlc3RhcnQ6IGJvb2xlYW47XG4gIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmc7XG4gIHJlbW90ZVZlcnNpb246IHN0cmluZyB8IG51bGw7XG4gIGluc3RhbGxQYXRoOiBzdHJpbmcgfCBudWxsO1xuICBtZXNzYWdlOiBzdHJpbmc7XG4gIHByb2dyZXNzOiBzdHJpbmc7XG4gIGVycm9yOiBzdHJpbmcgfCBudWxsO1xuICBmb3JjZVVwZGF0ZTogYm9vbGVhbjtcbiAgcHVibGlzaERhdGU6IG51bWJlcjtcbn1cblxuY29uc3QgZ2xvYmFsVXBkYXRlU3RhdHVzOiBVcGRhdGVTdGF0dXMgPSB7XG4gIGF1dG9VcGRhdGVTdXBwb3J0ZWQ6IGZhbHNlLFxuICB1cGRhdGVMZXZlbDogbnVsbCxcbiAgdXBkYXRlQ29tcGxldGVkOiBmYWxzZSxcbiAgdXBkYXRlZDogZmFsc2UsXG4gIHdhaXRpbmdGb3JSZXN0YXJ0OiBmYWxzZSxcbiAgY3VycmVudFZlcnNpb246ICcnLFxuICByZW1vdGVWZXJzaW9uOiBudWxsLFxuICBpbnN0YWxsUGF0aDogbnVsbCxcbiAgbWVzc2FnZTogJ0lkbGUnLFxuICBwcm9ncmVzczogJycsXG4gIGVycm9yOiBudWxsLFxuICBmb3JjZVVwZGF0ZTogZmFsc2UsXG4gIHB1Ymxpc2hEYXRlOiAwLFxufTtcblxuZnVuY3Rpb24gdXBkYXRlU3RhdHVzKHN0YXR1czogUGFydGlhbDxVcGRhdGVTdGF0dXM+KTogdm9pZCB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzdGF0dXMpIGFzIEFycmF5PGtleW9mIFVwZGF0ZVN0YXR1cz47XG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAoZ2xvYmFsVXBkYXRlU3RhdHVzIGFzIGFueSlba2V5XSA9IHN0YXR1c1trZXldO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZXJTdG9yZSgpIHtcbiAgY29uc29sZS5sb2coJ1t1cGRhdGVyLnN0b3JlLnRzXSBDcmVhdGluZyB1cGRhdGVyIHN0b3JlIGluc3RhbmNlJyk7XG5cbiAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgZ2V0IHN0YXR1cygpIHtcbiAgICAgIHJldHVybiBnbG9iYWxVcGRhdGVTdGF0dXM7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN0YXR1cykgYXMgQXJyYXk8a2V5b2YgVXBkYXRlU3RhdHVzPjtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgZG93bmxvYWRBbmRJbnN0YWxsKGNvbnRleHQ6IGFueSwgY3VycmVudFZlcnNpb246IHN0cmluZywgbGF0ZXN0SnNvbjogTGF0ZXN0SnNvbiwgYWN0aXZlU291cmNlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBTdGFydGluZyBkb3dubG9hZCBhbmQgaW5zdGFsbCBwcm9jZXNzJyk7XG5cbiAgICAgIGNvbnN0IHJlbW90ZVZlcnNpb24gPSBsYXRlc3RKc29uLnZlcnNpb247XG5cbiAgICAgIGNvbnN0IHJhYmJpeERpciA9IGpvaW4oJ0M6JywgJ1VzZXJzJywgcHJvY2Vzcy5lbnYuVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUiB8fCAnJywgJ0FwcERhdGEnLCAnTG9jYWwnLCAncmFiYml4Jyk7XG4gICAgICBjb25zdCB0YXJnZXRWZXJzaW9uRGlyID0gam9pbihyYWJiaXhEaXIsIGB2JHtyZW1vdGVWZXJzaW9ufWApO1xuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIFRhcmdldCB2ZXJzaW9uIGRpcmVjdG9yeTonLCB0YXJnZXRWZXJzaW9uRGlyKTtcblxuICAgICAgY29uc3Qgc3BsaXRGaWxlcyA9IGxhdGVzdEpzb24uc3BsaXRGaWxlcz8uWyd3aW4zMi14NjQnXTtcbiAgICAgIGlmICghc3BsaXRGaWxlcyB8fCBzcGxpdEZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ1t1cGRhdGVyLnN0b3JlLnRzXSBObyB3aW4zMi14NjQgc3BsaXQgZmlsZXMgZm91bmQnKTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfTk9fU1BMSVRfRklMRVMnLCB7fSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNwbGl0SGFzaGVzID0gbGF0ZXN0SnNvbi5zcGxpdEZpbGVIYXNoZXM/Llsnd2luMzIteDY0J10gfHwgW107XG4gICAgICBjb25zdCBkb3dubG9hZGVkUGFydHM6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc3BsaXRGaWxlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBzcGxpdEZpbGVzW2luZGV4XTtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRIYXNoID0gc3BsaXRIYXNoZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBmdWxsVXJsID0gYCR7YWN0aXZlU291cmNlfSR7ZmlsZVBhdGh9YDtcblxuICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIERvd25sb2FkaW5nIHBhcnQgJHtpbmRleCArIDF9IG9mICR7c3BsaXRGaWxlcy5sZW5ndGh9OmAsIGZpbGVQYXRoKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWRpbmcgdXBkYXRlLi4uYCxcbiAgICAgICAgICBwcm9ncmVzczogYERvd25sb2FkaW5nICR7aW5kZXggKyAxfS8ke3NwbGl0RmlsZXMubGVuZ3RofWAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBsYXN0RXJyb3I6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gICAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goZnVsbFVybCwge1xuICAgICAgICAgICAgICBzaWduYWw6IEFib3J0U2lnbmFsLnRpbWVvdXQoMTIwMDAwKSxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgICAgIGxhc3RFcnJvciA9IGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzfWA7XG4gICAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikge1xuICAgICAgICAgICAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gSFRUUCBlcnJvciwgcmV0cnlpbmcgaW4gNXMuLi4nKTtcbiAgICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfRE9XTkxPQURfRkFJTEVEJywge1xuICAgICAgICAgICAgICAgIHBhcnRJbmRleDogaW5kZXggKyAxLFxuICAgICAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSk7XG5cbiAgICAgICAgICAgIGlmIChleHBlY3RlZEhhc2gpIHtcbiAgICAgICAgICAgICAgY29uc3QgYWN0dWFsSGFzaCA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpLnVwZGF0ZShkYXRhKS5kaWdlc3QoJ2hleCcpO1xuICAgICAgICAgICAgICBpZiAoYWN0dWFsSGFzaC50b0xvd2VyQ2FzZSgpICE9PSBleHBlY3RlZEhhc2gudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0hBU0hfTUlTTUFUQ0gnLCB7XG4gICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWRIYXNoLFxuICAgICAgICAgICAgICAgICAgYWN0dWFsOiBhY3R1YWxIYXNoLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRvd25sb2FkZWRQYXJ0cy5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgbGFzdEVycm9yID0gbnVsbDtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gUGFydCAke2luZGV4ICsgMX0gZG93bmxvYWRlZCBzdWNjZXNzZnVsbHlgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBpZiAoZXJyb3IgJiYgdHlwZW9mIGVycm9yID09PSAnb2JqZWN0JyAmJiAnJG1pbGtpb1JlamVjdCcgaW4gZXJyb3IpIHtcbiAgICAgICAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWQgZmFpbGVkOiAke2xhc3RFcnJvciB8fCAnVW5rbm93biBlcnJvcid9YCxcbiAgICAgICAgICAgICAgICBlcnJvcjogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdEVycm9yID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBEb3dubG9hZCBhdHRlbXB0ICR7YXR0ZW1wdCArIDF9IGZhaWxlZDpgLCBsYXN0RXJyb3IpO1xuICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCAyKSB7XG4gICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobGFzdEVycm9yKSB7XG4gICAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBEb3dubG9hZCBmYWlsZWQ6ICR7bGFzdEVycm9yfWAsXG4gICAgICAgICAgICBlcnJvcjogbGFzdEVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0RPV05MT0FEX0ZBSUxFRCcsIHtcbiAgICAgICAgICAgIHBhcnRJbmRleDogaW5kZXggKyAxLFxuICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEFsbCBwYXJ0cyBkb3dubG9hZGVkLCBtZXJnaW5nLi4uJyk7XG4gICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICBtZXNzYWdlOiAnTWVyZ2luZyBmaWxlcy4uLicsXG4gICAgICAgIHByb2dyZXNzOiAnTWVyZ2luZycsXG4gICAgICB9KTtcblxuICAgICAgbGV0IHRvdGFsTGVuZ3RoID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG93bmxvYWRlZFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoICs9IGRvd25sb2FkZWRQYXJ0c1tpXSEubGVuZ3RoO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkWmlwID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xuICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkZWRQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZXJnZWRaaXAuc2V0KGRvd25sb2FkZWRQYXJ0c1tpXSEsIG9mZnNldCk7XG4gICAgICAgIG9mZnNldCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcERpciA9IGpvaW4ocmFiYml4RGlyLCAnLnRtcF91cGRhdGUnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGF3YWl0IG1rZGlyKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCB0ZW1wWmlwUGF0aCA9IGpvaW4odGVtcERpciwgJ3VwZGF0ZS56aXAnKTtcbiAgICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wWmlwUGF0aCwgbWVyZ2VkWmlwKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBFeHRyYWN0aW5nIGFyY2hpdmUuLi4nKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdFeHRyYWN0aW5nLi4uJyxcbiAgICAgICAgcHJvZ3Jlc3M6ICdFeHRyYWN0aW5nJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBleGVjU3luYyhgcG93ZXJzaGVsbCAtTm9Qcm9maWxlIC1Ob25JbnRlcmFjdGl2ZSAtQ29tbWFuZCBcIkV4cGFuZC1BcmNoaXZlIC1MaXRlcmFsUGF0aCAnJHt0ZW1wWmlwUGF0aH0nIC1EZXN0aW5hdGlvblBhdGggJyR7dGVtcERpcn0nIC1Gb3JjZVwiYCwge1xuICAgICAgICAgIHN0ZGlvOiAncGlwZScsXG4gICAgICAgIH0pO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgYXdhaXQgcm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgRXh0cmFjdGlvbiBmYWlsZWQ6ICR7ZXJyb3JNc2d9YCxcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9FWFRSQUNUSU9OX0ZBSUxFRCcsIHsgZXJyb3I6IGVycm9yTXNnIH0pO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCBybSh0ZW1wWmlwUGF0aCwgeyBmb3JjZTogdHJ1ZSB9KTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYWNjZXNzKHRhcmdldFZlcnNpb25EaXIpO1xuICAgICAgICBhd2FpdCBybSh0YXJnZXRWZXJzaW9uRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGNvbnN0IGV4dHJhY3RlZEVudHJpZXMgPSBhd2FpdCByZWFkZGlyKHRlbXBEaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIGxldCBzb3VyY2VEaXIgPSB0ZW1wRGlyO1xuXG4gICAgICBpZiAoZXh0cmFjdGVkRW50cmllcy5sZW5ndGggPT09IDEgJiYgZXh0cmFjdGVkRW50cmllc1swXSEuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICBzb3VyY2VEaXIgPSBqb2luKHRlbXBEaXIsIGV4dHJhY3RlZEVudHJpZXNbMF0hLm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIE1vdmluZyBleHRyYWN0ZWQgZmlsZXMgdG8gdGFyZ2V0IGRpcmVjdG9yeTonLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdJbnN0YWxsaW5nLi4uJyxcbiAgICAgICAgcHJvZ3Jlc3M6ICdJbnN0YWxsaW5nJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZW5hbWUoc291cmNlRGlyLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYEluc3RhbGxhdGlvbiBmYWlsZWQ6ICR7ZXJyb3JNc2d9YCxcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9JTlNUQUxMX0ZBSUxFRCcsIHsgZXJyb3I6IGVycm9yTXNnIH0pO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGF3YWl0IGluc3RhbmNlLmNsZWFudXBPbGRWZXJzaW9ucyhyYWJiaXhEaXIsIGN1cnJlbnRWZXJzaW9uLCByZW1vdGVWZXJzaW9uKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBVcGRhdGUgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSwgdmVyc2lvbjonLCByZW1vdGVWZXJzaW9uKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdVcGRhdGUgc3VjY2Vzc2Z1bCcsXG4gICAgICAgIHByb2dyZXNzOiAnJyxcbiAgICAgICAgdXBkYXRlQ29tcGxldGVkOiB0cnVlLFxuICAgICAgICB1cGRhdGVkOiB0cnVlLFxuICAgICAgICB3YWl0aW5nRm9yUmVzdGFydDogdHJ1ZSxcbiAgICAgICAgaW5zdGFsbFBhdGg6IHRhcmdldFZlcnNpb25EaXIsXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2xlYW51cE9sZFZlcnNpb25zKHJhYmJpeERpcjogc3RyaW5nLCBjdXJyZW50VmVyc2lvbjogc3RyaW5nLCBsYXRlc3RWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ2xlYW5pbmcgdXAgb2xkIHZlcnNpb25zJyk7XG4gICAgICBjb25zdCBjdXJyZW50VmVyc2lvbkRpciA9IGB2JHtjdXJyZW50VmVyc2lvbi5zdGFydHNXaXRoKCd2JykgPyBjdXJyZW50VmVyc2lvbi5zbGljZSgxKSA6IGN1cnJlbnRWZXJzaW9ufWA7XG4gICAgICBjb25zdCBsYXRlc3RWZXJzaW9uRGlyID0gYHYke2xhdGVzdFZlcnNpb24uc3RhcnRzV2l0aCgndicpID8gbGF0ZXN0VmVyc2lvbi5zbGljZSgxKSA6IGxhdGVzdFZlcnNpb259YDtcblxuICAgICAgbGV0IGVudHJpZXM6IHN0cmluZ1tdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIocmFiYml4RGlyKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoIWVudHJ5LnN0YXJ0c1dpdGgoJ3YnKSkgY29udGludWU7XG4gICAgICAgIGlmIChlbnRyeSA9PT0gY3VycmVudFZlcnNpb25EaXIgfHwgZW50cnkgPT09IGxhdGVzdFZlcnNpb25EaXIpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9sZFZlcnNpb25QYXRoID0gam9pbihyYWJiaXhEaXIsIGVudHJ5KTtcbiAgICAgICAgY29uc3QgdGVtcE5hbWUgPSBgLmRlbF8ke3RpbWVzdGFtcH1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gO1xuICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IGpvaW4ocmFiYml4RGlyLCB0ZW1wTmFtZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCByZW5hbWUob2xkVmVyc2lvblBhdGgsIHRlbXBQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJtKHRlbXBQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxubGV0IGluc3RhbmNlUHJvbWlzZTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlVXBkYXRlclN0b3JlPiB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlVXBkYXRlclN0b3JlKCkge1xuICBpZiAoIWluc3RhbmNlUHJvbWlzZSkgaW5zdGFuY2VQcm9taXNlID0gY3JlYXRlVXBkYXRlclN0b3JlKCk7XG4gIHJldHVybiBpbnN0YW5jZVByb21pc2U7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQThCQSxNQUFNLHFCQUFtQztBQUFBLEVBQ3ZDLHFCQUFxQjtBQUFBLEVBQ3JCLGFBQWE7QUFBQSxFQUNiLGlCQUFpQjtBQUFBLEVBQ2pCLFNBQVM7QUFBQSxFQUNULG1CQUFtQjtBQUFBLEVBQ25CLGdCQUFnQjtBQUFBLEVBQ2hCLGVBQWU7QUFBQSxFQUNmLGFBQWE7QUFBQSxFQUNiLFNBQVM7QUFBQSxFQUNULFVBQVU7QUFBQSxFQUNWLE9BQU87QUFBQSxFQUNQLGFBQWE7QUFBQSxFQUNiLGFBQWE7QUFDZjtBQUVBLFNBQVMsYUFBYSxRQUFxQztBQUN6RCxRQUFNLE9BQU8sT0FBTyxLQUFL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
