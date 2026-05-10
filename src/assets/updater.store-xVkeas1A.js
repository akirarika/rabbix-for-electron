import { readdir, rename, rm, mkdir, writeFile, access, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { tmpdir } from "os";
const moduleDir = dirname(fileURLToPath(import.meta.url));
const sevenZipSourcePath = join(moduleDir, "..", "7za.exe");
async function prepareSevenZipExe() {
  const tempSevenZipPath = join(tmpdir(), "rabbix_7za.exe");
  const data = await readFile(sevenZipSourcePath);
  await writeFile(tempSevenZipPath, data);
  return tempSevenZipPath;
}
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
  publishDate: 0,
  isChecking: false
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
    async downloadAndInstall(context, currentVersion, remoteVersion, splitFiles, splitFileHashes, baseUrl, rabbixDir, targetVersionDir) {
      const logger = context.logger;
      logger.info("[updater.store.ts] Starting download and install process");
      if (splitFiles.length === 0) {
        logger.error("[updater.store.ts] No split files provided");
        throw context.reject("UPDATER_NO_SPLIT_FILES", {});
      }
      const downloadedParts = [];
      for (let index = 0; index < splitFiles.length; index++) {
        const filePath = splitFiles[index];
        const expectedHash = splitFileHashes[index];
        const fullUrl = `${baseUrl}${filePath}`;
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
      const mergedArchive = new Uint8Array(totalLength);
      let mergeOffset = 0;
      for (let i = 0; i < downloadedParts.length; i++) {
        mergedArchive.set(downloadedParts[i], mergeOffset);
        mergeOffset += downloadedParts[i].length;
      }
      const tempDir = join(rabbixDir, ".tmp_update");
      try {
        await rm(tempDir, { recursive: true, force: true });
      } catch {
      }
      await mkdir(tempDir, { recursive: true });
      const tempArchivePath = join(tempDir, "update.7z");
      await writeFile(tempArchivePath, mergedArchive);
      logger.info("[updater.store.ts] Extracting archive...");
      updateStatus({
        message: "Extracting..."
      });
      let sevenZipExePath;
      try {
        sevenZipExePath = await prepareSevenZipExe();
        execSync(`"${sevenZipExePath}" x "${tempArchivePath}" -o"${tempDir}" -y -aoa`, {
          stdio: "pipe",
          windowsHide: true
        });
      } catch (error) {
        await rm(tempDir, { recursive: true, force: true });
        const errorMsg = error instanceof Error ? error.message : String(error);
        updateStatus({
          message: `Extraction failed: ${errorMsg}`,
          error: errorMsg
        });
        throw context.reject("UPDATER_EXTRACTION_FAILED", { error: errorMsg });
      } finally {
        if (sevenZipExePath) {
          try {
            await rm(sevenZipExePath, { force: true });
          } catch {
          }
        }
        try {
          await rm(tempArchivePath, { force: true });
        } catch {
        }
      }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlci5zdG9yZS14VmtlYXMxQS5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWNjZXNzLCBta2RpciwgcmVhZGRpciwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlLCByZWFkRmlsZSB9IGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IGpvaW4sIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgdG1wZGlyIH0gZnJvbSAnb3MnO1xuXG5jb25zdCBtb2R1bGVEaXIgPSBkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSk7XG5jb25zdCBzZXZlblppcFNvdXJjZVBhdGggPSBqb2luKG1vZHVsZURpciwgJy4uJywgJzd6YS5leGUnKTtcblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZVNldmVuWmlwRXhlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IHRlbXBTZXZlblppcFBhdGggPSBqb2luKHRtcGRpcigpLCAncmFiYml4Xzd6YS5leGUnKTtcbiAgY29uc3QgZGF0YSA9IGF3YWl0IHJlYWRGaWxlKHNldmVuWmlwU291cmNlUGF0aCk7XG4gIGF3YWl0IHdyaXRlRmlsZSh0ZW1wU2V2ZW5aaXBQYXRoLCBkYXRhKTtcbiAgcmV0dXJuIHRlbXBTZXZlblppcFBhdGg7XG59XG5cbnR5cGUgVXBkYXRlTGV2ZWwgPSAnbWFqb3InIHwgJ21pbm9yJyB8ICdwYXRjaCc7XG5cbmludGVyZmFjZSBVcGRhdGVTdGF0dXMge1xuICBhdXRvVXBkYXRlU3VwcG9ydGVkOiBib29sZWFuO1xuICB1cGRhdGVMZXZlbDogVXBkYXRlTGV2ZWwgfCBudWxsO1xuICB1cGRhdGVDb21wbGV0ZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZWQ6IGJvb2xlYW47XG4gIHdhaXRpbmdGb3JSZXN0YXJ0OiBib29sZWFuO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICByZW1vdGVWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBpbnN0YWxsUGF0aDogc3RyaW5nIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgZm9yY2VVcGRhdGU6IGJvb2xlYW47XG4gIHB1Ymxpc2hEYXRlOiBudW1iZXI7XG4gIGlzQ2hlY2tpbmc6IGJvb2xlYW47XG59XG5cbmNvbnN0IGdsb2JhbFVwZGF0ZVN0YXR1czogVXBkYXRlU3RhdHVzID0ge1xuICBhdXRvVXBkYXRlU3VwcG9ydGVkOiBmYWxzZSxcbiAgdXBkYXRlTGV2ZWw6IG51bGwsXG4gIHVwZGF0ZUNvbXBsZXRlZDogZmFsc2UsXG4gIHVwZGF0ZWQ6IGZhbHNlLFxuICB3YWl0aW5nRm9yUmVzdGFydDogZmFsc2UsXG4gIGN1cnJlbnRWZXJzaW9uOiAnJyxcbiAgcmVtb3RlVmVyc2lvbjogbnVsbCxcbiAgaW5zdGFsbFBhdGg6IG51bGwsXG4gIG1lc3NhZ2U6ICdJZGxlJyxcbiAgZXJyb3I6IG51bGwsXG4gIGZvcmNlVXBkYXRlOiBmYWxzZSxcbiAgcHVibGlzaERhdGU6IDAsXG4gIGlzQ2hlY2tpbmc6IGZhbHNlLFxufTtcblxuZnVuY3Rpb24gdXBkYXRlU3RhdHVzKHN0YXR1czogUGFydGlhbDxVcGRhdGVTdGF0dXM+KTogdm9pZCB7XG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzdGF0dXMpIGFzIEFycmF5PGtleW9mIFVwZGF0ZVN0YXR1cz47XG4gIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAoZ2xvYmFsVXBkYXRlU3RhdHVzIGFzIGFueSlba2V5XSA9IHN0YXR1c1trZXldO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZXJTdG9yZSgpIHtcbiAgY29uc29sZS5sb2coJ1t1cGRhdGVyLnN0b3JlLnRzXSBDcmVhdGluZyB1cGRhdGVyIHN0b3JlIGluc3RhbmNlJyk7XG5cbiAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgZ2V0IHN0YXR1cygpIHtcbiAgICAgIHJldHVybiBnbG9iYWxVcGRhdGVTdGF0dXM7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN0YXR1cykgYXMgQXJyYXk8a2V5b2YgVXBkYXRlU3RhdHVzPjtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgZG93bmxvYWRBbmRJbnN0YWxsKFxuICAgICAgY29udGV4dDogYW55LFxuICAgICAgY3VycmVudFZlcnNpb246IHN0cmluZyxcbiAgICAgIHJlbW90ZVZlcnNpb246IHN0cmluZyxcbiAgICAgIHNwbGl0RmlsZXM6IHN0cmluZ1tdLFxuICAgICAgc3BsaXRGaWxlSGFzaGVzOiBzdHJpbmdbXSxcbiAgICAgIGJhc2VVcmw6IHN0cmluZyxcbiAgICAgIHJhYmJpeERpcjogc3RyaW5nLFxuICAgICAgdGFyZ2V0VmVyc2lvbkRpcjogc3RyaW5nLFxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIFN0YXJ0aW5nIGRvd25sb2FkIGFuZCBpbnN0YWxsIHByb2Nlc3MnKTtcblxuICAgICAgaWYgKHNwbGl0RmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignW3VwZGF0ZXIuc3RvcmUudHNdIE5vIHNwbGl0IGZpbGVzIHByb3ZpZGVkJyk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX05PX1NQTElUX0ZJTEVTJywge30pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkb3dubG9hZGVkUGFydHM6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuXG4gICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgc3BsaXRGaWxlcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSBzcGxpdEZpbGVzW2luZGV4XTtcbiAgICAgICAgY29uc3QgZXhwZWN0ZWRIYXNoID0gc3BsaXRGaWxlSGFzaGVzW2luZGV4XTtcbiAgICAgICAgY29uc3QgZnVsbFVybCA9IGAke2Jhc2VVcmx9JHtmaWxlUGF0aH1gO1xuXG4gICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gRG93bmxvYWRpbmcgcGFydCAke2luZGV4ICsgMX0gb2YgJHtzcGxpdEZpbGVzLmxlbmd0aH06YCwgZmlsZVBhdGgpO1xuICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgIG1lc3NhZ2U6IGBEb3dubG9hZGluZyB1cGRhdGUuLi5gLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQrKykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGZ1bGxVcmwsIHtcbiAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDEyMDAwMCksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBsYXN0RXJyb3IgPSBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IDIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEhUVFAgZXJyb3IsIHJldHJ5aW5nIGluIDVzLi4uJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0RPV05MT0FEX0ZBSUxFRCcsIHtcbiAgICAgICAgICAgICAgICBwYXJ0SW5kZXg6IGluZGV4ICsgMSxcbiAgICAgICAgICAgICAgICBlcnJvcjogbGFzdEVycm9yLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpO1xuXG4gICAgICAgICAgICBpZiAoZXhwZWN0ZWRIYXNoKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFjdHVhbEhhc2ggPSBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoZGF0YSkuZGlnZXN0KCdoZXgnKTtcbiAgICAgICAgICAgICAgaWYgKGFjdHVhbEhhc2gudG9Mb3dlckNhc2UoKSAhPT0gZXhwZWN0ZWRIYXNoLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9IQVNIX01JU01BVENIJywge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkSGFzaCxcbiAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsSGFzaCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb3dubG9hZGVkUGFydHMucHVzaChkYXRhKTtcbiAgICAgICAgICAgIGxhc3RFcnJvciA9IG51bGw7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIFBhcnQgJHtpbmRleCArIDF9IGRvd25sb2FkZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJyRtaWxraW9SZWplY3QnIGluIGVycm9yKSB7XG4gICAgICAgICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkIGZhaWxlZDogJHtsYXN0RXJyb3IgfHwgJ1Vua25vd24gZXJyb3InfWAsXG4gICAgICAgICAgICAgICAgZXJyb3I6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RFcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gRG93bmxvYWQgYXR0ZW1wdCAke2F0dGVtcHQgKyAxfSBmYWlsZWQ6YCwgbGFzdEVycm9yKTtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikge1xuICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxhc3RFcnJvcikge1xuICAgICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWQgZmFpbGVkOiAke2xhc3RFcnJvcn1gLFxuICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9ET1dOTE9BRF9GQUlMRUQnLCB7XG4gICAgICAgICAgICBwYXJ0SW5kZXg6IGluZGV4ICsgMSxcbiAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBBbGwgcGFydHMgZG93bmxvYWRlZCwgbWVyZ2luZy4uLicpO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ01lcmdpbmcgZmlsZXMuLi4nLFxuICAgICAgfSk7XG5cbiAgICAgIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkZWRQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbExlbmd0aCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lcmdlZEFyY2hpdmUgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbmd0aCk7XG4gICAgICBsZXQgbWVyZ2VPZmZzZXQgPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb3dubG9hZGVkUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWVyZ2VkQXJjaGl2ZS5zZXQoZG93bmxvYWRlZFBhcnRzW2ldISwgbWVyZ2VPZmZzZXQpO1xuICAgICAgICBtZXJnZU9mZnNldCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcERpciA9IGpvaW4ocmFiYml4RGlyLCAnLnRtcF91cGRhdGUnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGF3YWl0IG1rZGlyKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCB0ZW1wQXJjaGl2ZVBhdGggPSBqb2luKHRlbXBEaXIsICd1cGRhdGUuN3onKTtcbiAgICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wQXJjaGl2ZVBhdGgsIG1lcmdlZEFyY2hpdmUpO1xuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEV4dHJhY3RpbmcgYXJjaGl2ZS4uLicpO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ0V4dHJhY3RpbmcuLi4nLFxuICAgICAgfSk7XG5cbiAgICAgIGxldCBzZXZlblppcEV4ZVBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNldmVuWmlwRXhlUGF0aCA9IGF3YWl0IHByZXBhcmVTZXZlblppcEV4ZSgpO1xuXG4gICAgICAgIGV4ZWNTeW5jKGBcIiR7c2V2ZW5aaXBFeGVQYXRofVwiIHggXCIke3RlbXBBcmNoaXZlUGF0aH1cIiAtb1wiJHt0ZW1wRGlyfVwiIC15IC1hb2FgLCB7XG4gICAgICAgICAgc3RkaW86ICdwaXBlJyxcbiAgICAgICAgICB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgIG1lc3NhZ2U6IGBFeHRyYWN0aW9uIGZhaWxlZDogJHtlcnJvck1zZ31gLFxuICAgICAgICAgIGVycm9yOiBlcnJvck1zZyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0VYVFJBQ1RJT05fRkFJTEVEJywgeyBlcnJvcjogZXJyb3JNc2cgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoc2V2ZW5aaXBFeGVQYXRoKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHJtKHNldmVuWmlwRXhlUGF0aCwgeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBybSh0ZW1wQXJjaGl2ZVBhdGgsIHsgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgYWNjZXNzKHRhcmdldFZlcnNpb25EaXIpO1xuICAgICAgICBhd2FpdCBybSh0YXJnZXRWZXJzaW9uRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGNvbnN0IGV4dHJhY3RlZEVudHJpZXMgPSBhd2FpdCByZWFkZGlyKHRlbXBEaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KTtcbiAgICAgIGxldCBzb3VyY2VEaXIgPSB0ZW1wRGlyO1xuXG4gICAgICBpZiAoZXh0cmFjdGVkRW50cmllcy5sZW5ndGggPT09IDEgJiYgZXh0cmFjdGVkRW50cmllc1swXSEuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICBzb3VyY2VEaXIgPSBqb2luKHRlbXBEaXIsIGV4dHJhY3RlZEVudHJpZXNbMF0hLm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIE1vdmluZyBleHRyYWN0ZWQgZmlsZXMgdG8gdGFyZ2V0IGRpcmVjdG9yeTonLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdJbnN0YWxsaW5nLi4uJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZW5hbWUoc291cmNlRGlyLCB0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYEluc3RhbGxhdGlvbiBmYWlsZWQ6ICR7ZXJyb3JNc2d9YCxcbiAgICAgICAgICBlcnJvcjogZXJyb3JNc2csXG4gICAgICAgIH0pO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9JTlNUQUxMX0ZBSUxFRCcsIHsgZXJyb3I6IGVycm9yTXNnIH0pO1xuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gVXBkYXRlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHksIHZlcnNpb246JywgcmVtb3RlVmVyc2lvbik7XG4gICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICBtZXNzYWdlOiAnVXBkYXRlIHN1Y2Nlc3NmdWwnLFxuICAgICAgICB1cGRhdGVDb21wbGV0ZWQ6IHRydWUsXG4gICAgICAgIHVwZGF0ZWQ6IHRydWUsXG4gICAgICAgIHdhaXRpbmdGb3JSZXN0YXJ0OiB0cnVlLFxuICAgICAgICBpbnN0YWxsUGF0aDogdGFyZ2V0VmVyc2lvbkRpcixcbiAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhc3luYyBjbGVhbnVwT2xkVmVyc2lvbnMocmFiYml4RGlyOiBzdHJpbmcsIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsIGxhdGVzdFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc29sZS5sb2coJ1t1cGRhdGVyLnN0b3JlLnRzXSBDbGVhbmluZyB1cCBvbGQgdmVyc2lvbnMnKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRWZXJzaW9uRGlyID0gYHYke2N1cnJlbnRWZXJzaW9uLnN0YXJ0c1dpdGgoJ3YnKSA/IGN1cnJlbnRWZXJzaW9uLnNsaWNlKDEpIDogY3VycmVudFZlcnNpb259YDtcbiAgICAgIGNvbnN0IGxhdGVzdFZlcnNpb25EaXIgPSBgdiR7bGF0ZXN0VmVyc2lvbi5zdGFydHNXaXRoKCd2JykgPyBsYXRlc3RWZXJzaW9uLnNsaWNlKDEpIDogbGF0ZXN0VmVyc2lvbn1gO1xuXG4gICAgICBsZXQgZW50cmllczogc3RyaW5nW107XG4gICAgICB0cnkge1xuICAgICAgICBlbnRyaWVzID0gYXdhaXQgcmVhZGRpcihyYWJiaXhEaXIpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGlmICghZW50cnkuc3RhcnRzV2l0aCgndicpKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGVudHJ5ID09PSBjdXJyZW50VmVyc2lvbkRpciB8fCBlbnRyeSA9PT0gbGF0ZXN0VmVyc2lvbkRpcikgY29udGludWU7XG5cbiAgICAgICAgY29uc3Qgb2xkVmVyc2lvblBhdGggPSBqb2luKHJhYmJpeERpciwgZW50cnkpO1xuICAgICAgICBjb25zdCB0ZW1wTmFtZSA9IGAuZGVsXyR7dGltZXN0YW1wfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDgpfWA7XG4gICAgICAgIGNvbnN0IHRlbXBQYXRoID0gam9pbihyYWJiaXhEaXIsIHRlbXBOYW1lKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJlbmFtZShvbGRWZXJzaW9uUGF0aCwgdGVtcFBhdGgpO1xuICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcm0odGVtcFBhdGgsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfVxuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5sZXQgaW5zdGFuY2VQcm9taXNlOiBSZXR1cm5UeXBlPHR5cGVvZiBjcmVhdGVVcGRhdGVyU3RvcmU+IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VVcGRhdGVyU3RvcmUoKSB7XG4gIGlmICghaW5zdGFuY2VQcm9taXNlKSBpbnN0YW5jZVByb21pc2UgPSBjcmVhdGVVcGRhdGVyU3RvcmUoKTtcbiAgcmV0dXJuIGluc3RhbmNlUHJvbWlzZTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFPQSxNQUFNLFlBQVksUUFBUSxjQUFjLFlBQVksR0FBRyxDQUFDO0FBQ3hELE1BQU0scUJBQXFCLEtBQUssV0FBVyxNQUFNLFNBQVM7QUFFMUQsZUFBZSxxQkFBc0M7QUFDbkQsUUFBTSxtQkFBbUIsS0FBSyxPQUFBLEdBQVUsZ0JBQWdCO0FBQ3hELFFBQU0sT0FBTyxNQUFNLFNBQVMsa0JBQWtCO0FBQzlDLFFBQU0sVUFBVSxrQkFBa0IsSUFBSTtBQUN0QyxTQUFPO0FBQ1Q7QUFvQkEsTUFBTSxxQkFBbUM7QUFBQSxFQUN2QyxxQkFBcUI7QUFBQSxFQUNyQixhQUFhO0FBQUEsRUFDYixpQkFBaUI7QUFBQSxFQUNqQixTQUFTO0FBQUEsRUFDVCxtQkFBbUI7QUFBQSxFQUNuQixnQkFBZ0I7QUFBQSxFQUNoQixlQUFlO0FBQUEs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
