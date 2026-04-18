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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlci5zdG9yZS1CNnNHOG92cC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWNjZXNzLCBta2RpciwgcmVhZGRpciwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlLCByZWFkRmlsZSB9IGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IGpvaW4sIGRpcm5hbWUgfSBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgdG1wZGlyIH0gZnJvbSAnb3MnO1xuXG4vLyA3emEuZXhlIOS9jeS6jiBwdWJsaWMvIOebruW9le+8jFZpdGUg5p6E5bu65ZCO5LiO5Li75YyF5ZCM57qn77yIZGlzdC8g5qC555uu5b2V77yJXG4vLyDmnKzmqKHlnZfmnoTlu7rlkI7kvY3kuo4gZGlzdC9hc3NldHMvIOS4i++8jOWboOatpOmcgOimgeWQkeS4iuS4gOe6p+afpeaJvlxuY29uc3QgbW9kdWxlRGlyID0gZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuY29uc3Qgc2V2ZW5aaXBTb3VyY2VQYXRoID0gam9pbihtb2R1bGVEaXIsICcuLicsICc3emEuZXhlJyk7XG5cbi8vIDd6YS5leGUg5peg5rOV55u05o6l5LuOIGFzYXIg5YaF6YOo5omn6KGM77yM6ZyA6KaB5YWI5aSN5Yi25Yiw5Li05pe255uu5b2VXG5hc3luYyBmdW5jdGlvbiBwcmVwYXJlU2V2ZW5aaXBFeGUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgdGVtcFNldmVuWmlwUGF0aCA9IGpvaW4odG1wZGlyKCksICdyYWJiaXhfN3phLmV4ZScpO1xuICBjb25zdCBkYXRhID0gYXdhaXQgcmVhZEZpbGUoc2V2ZW5aaXBTb3VyY2VQYXRoKTtcbiAgYXdhaXQgd3JpdGVGaWxlKHRlbXBTZXZlblppcFBhdGgsIGRhdGEpO1xuICByZXR1cm4gdGVtcFNldmVuWmlwUGF0aDtcbn1cblxuaW50ZXJmYWNlIExhdGVzdEpzb24ge1xuICB2ZXJzaW9uOiBzdHJpbmc7XG4gIHNwbGl0RmlsZXM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmdbXT47XG4gIHNwbGl0RmlsZUhhc2hlcz86IFJlY29yZDxzdHJpbmcsIHN0cmluZ1tdPjtcbn1cblxuLy8g5L2/55SoIHNlbXZlciDmoIflh4bmnK/or63vvJptYWpvcijkuLvniYjmnKwp44CBbWlub3Io5qyh6KaB54mI5pysKeOAgXBhdGNoKOS/ruiuoueJiOacrClcbnR5cGUgVXBkYXRlTGV2ZWwgPSAnbWFqb3InIHwgJ21pbm9yJyB8ICdwYXRjaCc7XG5cbmludGVyZmFjZSBVcGRhdGVTdGF0dXMge1xuICBhdXRvVXBkYXRlU3VwcG9ydGVkOiBib29sZWFuO1xuICB1cGRhdGVMZXZlbDogVXBkYXRlTGV2ZWwgfCBudWxsO1xuICB1cGRhdGVDb21wbGV0ZWQ6IGJvb2xlYW47XG4gIHVwZGF0ZWQ6IGJvb2xlYW47XG4gIHdhaXRpbmdGb3JSZXN0YXJ0OiBib29sZWFuO1xuICBjdXJyZW50VmVyc2lvbjogc3RyaW5nO1xuICByZW1vdGVWZXJzaW9uOiBzdHJpbmcgfCBudWxsO1xuICBpbnN0YWxsUGF0aDogc3RyaW5nIHwgbnVsbDtcbiAgbWVzc2FnZTogc3RyaW5nO1xuICBlcnJvcjogc3RyaW5nIHwgbnVsbDtcbiAgZm9yY2VVcGRhdGU6IGJvb2xlYW47XG4gIHB1Ymxpc2hEYXRlOiBudW1iZXI7XG59XG5cbmNvbnN0IGdsb2JhbFVwZGF0ZVN0YXR1czogVXBkYXRlU3RhdHVzID0ge1xuICBhdXRvVXBkYXRlU3VwcG9ydGVkOiBmYWxzZSxcbiAgdXBkYXRlTGV2ZWw6IG51bGwsXG4gIHVwZGF0ZUNvbXBsZXRlZDogZmFsc2UsXG4gIHVwZGF0ZWQ6IGZhbHNlLFxuICB3YWl0aW5nRm9yUmVzdGFydDogZmFsc2UsXG4gIGN1cnJlbnRWZXJzaW9uOiAnJyxcbiAgcmVtb3RlVmVyc2lvbjogbnVsbCxcbiAgaW5zdGFsbFBhdGg6IG51bGwsXG4gIG1lc3NhZ2U6ICdJZGxlJyxcbiAgZXJyb3I6IG51bGwsXG4gIGZvcmNlVXBkYXRlOiBmYWxzZSxcbiAgcHVibGlzaERhdGU6IDAsXG59O1xuXG5mdW5jdGlvbiB1cGRhdGVTdGF0dXMoc3RhdHVzOiBQYXJ0aWFsPFVwZGF0ZVN0YXR1cz4pOiB2b2lkIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN0YXR1cykgYXMgQXJyYXk8a2V5b2YgVXBkYXRlU3RhdHVzPjtcbiAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgIChnbG9iYWxVcGRhdGVTdGF0dXMgYXMgYW55KVtrZXldID0gc3RhdHVzW2tleV07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlVXBkYXRlclN0b3JlKCkge1xuICBjb25zb2xlLmxvZygnW3VwZGF0ZXIuc3RvcmUudHNdIENyZWF0aW5nIHVwZGF0ZXIgc3RvcmUgaW5zdGFuY2UnKTtcblxuICBjb25zdCBpbnN0YW5jZSA9IHtcbiAgICBnZXQgc3RhdHVzKCkge1xuICAgICAgcmV0dXJuIGdsb2JhbFVwZGF0ZVN0YXR1cztcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzKHN0YXR1czogUGFydGlhbDxVcGRhdGVTdGF0dXM+KTogdm9pZCB7XG4gICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc3RhdHVzKSBhcyBBcnJheTxrZXlvZiBVcGRhdGVTdGF0dXM+O1xuICAgICAgZm9yIChjb25zdCBrZXkgb2Yga2V5cykge1xuICAgICAgICAoZ2xvYmFsVXBkYXRlU3RhdHVzIGFzIGFueSlba2V5XSA9IHN0YXR1c1trZXldO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBhc3luYyBkb3dubG9hZEFuZEluc3RhbGwoY29udGV4dDogYW55LCBjdXJyZW50VmVyc2lvbjogc3RyaW5nLCBsYXRlc3RKc29uOiBMYXRlc3RKc29uLCBhY3RpdmVTb3VyY2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgbG9nZ2VyID0gY29udGV4dC5sb2dnZXI7XG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIFN0YXJ0aW5nIGRvd25sb2FkIGFuZCBpbnN0YWxsIHByb2Nlc3MnKTtcblxuICAgICAgY29uc3QgcmVtb3RlVmVyc2lvbiA9IGxhdGVzdEpzb24udmVyc2lvbjtcblxuICAgICAgY29uc3QgcmFiYml4RGlyID0gam9pbignQzonLCAnVXNlcnMnLCBwcm9jZXNzLmVudi5VU0VSTkFNRSB8fCBwcm9jZXNzLmVudi5VU0VSIHx8ICcnLCAnQXBwRGF0YScsICdMb2NhbCcsICdyYWJiaXgnKTtcbiAgICAgIGNvbnN0IHRhcmdldFZlcnNpb25EaXIgPSBqb2luKHJhYmJpeERpciwgYHYke3JlbW90ZVZlcnNpb259YCk7XG5cbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gVGFyZ2V0IHZlcnNpb24gZGlyZWN0b3J5OicsIHRhcmdldFZlcnNpb25EaXIpO1xuXG4gICAgICBjb25zdCBzcGxpdEZpbGVzID0gbGF0ZXN0SnNvbi5zcGxpdEZpbGVzPy5bJ3dpbjMyLXg2NCddO1xuICAgICAgaWYgKCFzcGxpdEZpbGVzIHx8IHNwbGl0RmlsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGxvZ2dlci5lcnJvcignW3VwZGF0ZXIuc3RvcmUudHNdIE5vIHdpbjMyLXg2NCBzcGxpdCBmaWxlcyBmb3VuZCcpO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9OT19TUExJVF9GSUxFUycsIHt9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgc3BsaXRIYXNoZXMgPSBsYXRlc3RKc29uLnNwbGl0RmlsZUhhc2hlcz8uWyd3aW4zMi14NjQnXSB8fCBbXTtcbiAgICAgIGNvbnN0IGRvd25sb2FkZWRQYXJ0czogVWludDhBcnJheVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzcGxpdEZpbGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHNwbGl0RmlsZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBleHBlY3RlZEhhc2ggPSBzcGxpdEhhc2hlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IGZ1bGxVcmwgPSBgJHthY3RpdmVTb3VyY2V9JHtmaWxlUGF0aH1gO1xuXG4gICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gRG93bmxvYWRpbmcgcGFydCAke2luZGV4ICsgMX0gb2YgJHtzcGxpdEZpbGVzLmxlbmd0aH06YCwgZmlsZVBhdGgpO1xuICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgIG1lc3NhZ2U6IGBEb3dubG9hZGluZyB1cGRhdGUuLi5gLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQrKykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGZ1bGxVcmwsIHtcbiAgICAgICAgICAgICAgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDEyMDAwMCksXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICAgICAgICBsYXN0RXJyb3IgPSBgSFRUUCAke3Jlc3BvbnNlLnN0YXR1c31gO1xuICAgICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IDIpIHtcbiAgICAgICAgICAgICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEhUVFAgZXJyb3IsIHJldHJ5aW5nIGluIDVzLi4uJyk7XG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0RPV05MT0FEX0ZBSUxFRCcsIHtcbiAgICAgICAgICAgICAgICBwYXJ0SW5kZXg6IGluZGV4ICsgMSxcbiAgICAgICAgICAgICAgICBlcnJvcjogbGFzdEVycm9yLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KGF3YWl0IHJlc3BvbnNlLmFycmF5QnVmZmVyKCkpO1xuXG4gICAgICAgICAgICBpZiAoZXhwZWN0ZWRIYXNoKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGFjdHVhbEhhc2ggPSBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoZGF0YSkuZGlnZXN0KCdoZXgnKTtcbiAgICAgICAgICAgICAgaWYgKGFjdHVhbEhhc2gudG9Mb3dlckNhc2UoKSAhPT0gZXhwZWN0ZWRIYXNoLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9IQVNIX01JU01BVENIJywge1xuICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IGV4cGVjdGVkSGFzaCxcbiAgICAgICAgICAgICAgICAgIGFjdHVhbDogYWN0dWFsSGFzaCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkb3dubG9hZGVkUGFydHMucHVzaChkYXRhKTtcbiAgICAgICAgICAgIGxhc3RFcnJvciA9IG51bGw7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIFBhcnQgJHtpbmRleCArIDF9IGRvd25sb2FkZWQgc3VjY2Vzc2Z1bGx5YCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgaWYgKGVycm9yICYmIHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgJyRtaWxraW9SZWplY3QnIGluIGVycm9yKSB7XG4gICAgICAgICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkIGZhaWxlZDogJHtsYXN0RXJyb3IgfHwgJ1Vua25vd24gZXJyb3InfWAsXG4gICAgICAgICAgICAgICAgZXJyb3I6IFN0cmluZyhlcnJvciksXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RFcnJvciA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gRG93bmxvYWQgYXR0ZW1wdCAke2F0dGVtcHQgKyAxfSBmYWlsZWQ6YCwgbGFzdEVycm9yKTtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikge1xuICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxhc3RFcnJvcikge1xuICAgICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWQgZmFpbGVkOiAke2xhc3RFcnJvcn1gLFxuICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9ET1dOTE9BRF9GQUlMRUQnLCB7XG4gICAgICAgICAgICBwYXJ0SW5kZXg6IGluZGV4ICsgMSxcbiAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBBbGwgcGFydHMgZG93bmxvYWRlZCwgbWVyZ2luZy4uLicpO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ01lcmdpbmcgZmlsZXMuLi4nLFxuICAgICAgfSk7XG5cbiAgICAgIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkZWRQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbExlbmd0aCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lcmdlZEFyY2hpdmUgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbmd0aCk7XG4gICAgICBsZXQgbWVyZ2VPZmZzZXQgPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb3dubG9hZGVkUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWVyZ2VkQXJjaGl2ZS5zZXQoZG93bmxvYWRlZFBhcnRzW2ldISwgbWVyZ2VPZmZzZXQpO1xuICAgICAgICBtZXJnZU9mZnNldCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcERpciA9IGpvaW4ocmFiYml4RGlyLCAnLnRtcF91cGRhdGUnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGF3YWl0IG1rZGlyKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCB0ZW1wQXJjaGl2ZVBhdGggPSBqb2luKHRlbXBEaXIsICd1cGRhdGUuN3onKTtcbiAgICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wQXJjaGl2ZVBhdGgsIG1lcmdlZEFyY2hpdmUpO1xuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEV4dHJhY3RpbmcgYXJjaGl2ZS4uLicpO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ0V4dHJhY3RpbmcuLi4nLFxuICAgICAgfSk7XG5cbiAgICAgIGxldCBzZXZlblppcEV4ZVBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIOWwhiA3emEuZXhlIOS7jiBhc2FyIOS4reWkjeWItuWIsOS4tOaXtuebruW9le+8iGFzYXIg5YaF55qE5LqM6L+b5Yi25paH5Lu25peg5rOV55u05o6l5omn6KGM77yJXG4gICAgICAgIHNldmVuWmlwRXhlUGF0aCA9IGF3YWl0IHByZXBhcmVTZXZlblppcEV4ZSgpO1xuXG4gICAgICAgIC8vIOS9v+eUqCA3emEuZXhlIOino+WOiyA3eiDlvZLmoaNcbiAgICAgICAgLy8geDog6Kej5Y6L5bm25L+d55WZ55uu5b2V57uT5p6EXG4gICAgICAgIC8vIC1vOiDovpPlh7rnm67lvZXvvIjms6jmhI8gLW8g5LiO6Lev5b6E5LmL6Ze05rKh5pyJ56m65qC877yJXG4gICAgICAgIC8vIC15OiDopobnm5blt7LmnInmlofku7bkuI3or6Lpl65cbiAgICAgICAgLy8gLWFvYTog5peg5o+Q56S66KaG55uW5omA5pyJXG4gICAgICAgIGV4ZWNTeW5jKGBcIiR7c2V2ZW5aaXBFeGVQYXRofVwiIHggXCIke3RlbXBBcmNoaXZlUGF0aH1cIiAtb1wiJHt0ZW1wRGlyfVwiIC15IC1hb2FgLCB7XG4gICAgICAgICAgc3RkaW86ICdwaXBlJyxcbiAgICAgICAgICB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgIG1lc3NhZ2U6IGBFeHRyYWN0aW9uIGZhaWxlZDogJHtlcnJvck1zZ31gLFxuICAgICAgICAgIGVycm9yOiBlcnJvck1zZyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0VYVFJBQ1RJT05fRkFJTEVEJywgeyBlcnJvcjogZXJyb3JNc2cgfSk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICAvLyDmuIXnkIbkuLTml7YgN3phLmV4ZSDlkozlvZLmoaPmlofku7ZcbiAgICAgICAgaWYgKHNldmVuWmlwRXhlUGF0aCkge1xuICAgICAgICAgIHRyeSB7IGF3YWl0IHJtKHNldmVuWmlwRXhlUGF0aCwgeyBmb3JjZTogdHJ1ZSB9KTsgfSBjYXRjaCB7fVxuICAgICAgICB9XG4gICAgICAgIHRyeSB7IGF3YWl0IHJtKHRlbXBBcmNoaXZlUGF0aCwgeyBmb3JjZTogdHJ1ZSB9KTsgfSBjYXRjaCB7fVxuICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBhY2Nlc3ModGFyZ2V0VmVyc2lvbkRpcik7XG4gICAgICAgIGF3YWl0IHJtKHRhcmdldFZlcnNpb25EaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgY29uc3QgZXh0cmFjdGVkRW50cmllcyA9IGF3YWl0IHJlYWRkaXIodGVtcERpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pO1xuICAgICAgbGV0IHNvdXJjZURpciA9IHRlbXBEaXI7XG5cbiAgICAgIGlmIChleHRyYWN0ZWRFbnRyaWVzLmxlbmd0aCA9PT0gMSAmJiBleHRyYWN0ZWRFbnRyaWVzWzBdIS5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgIHNvdXJjZURpciA9IGpvaW4odGVtcERpciwgZXh0cmFjdGVkRW50cmllc1swXSEubmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gTW92aW5nIGV4dHJhY3RlZCBmaWxlcyB0byB0YXJnZXQgZGlyZWN0b3J5OicsIHRhcmdldFZlcnNpb25EaXIpO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ0luc3RhbGxpbmcuLi4nLFxuICAgICAgfSk7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJlbmFtZShzb3VyY2VEaXIsIHRhcmdldFZlcnNpb25EaXIpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgYXdhaXQgcm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgSW5zdGFsbGF0aW9uIGZhaWxlZDogJHtlcnJvck1zZ31gLFxuICAgICAgICAgIGVycm9yOiBlcnJvck1zZyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0lOU1RBTExfRkFJTEVEJywgeyBlcnJvcjogZXJyb3JNc2cgfSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgYXdhaXQgaW5zdGFuY2UuY2xlYW51cE9sZFZlcnNpb25zKHJhYmJpeERpciwgY3VycmVudFZlcnNpb24sIHJlbW90ZVZlcnNpb24pO1xuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIFVwZGF0ZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5LCB2ZXJzaW9uOicsIHJlbW90ZVZlcnNpb24pO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ1VwZGF0ZSBzdWNjZXNzZnVsJyxcbiAgICAgICAgdXBkYXRlQ29tcGxldGVkOiB0cnVlLFxuICAgICAgICB1cGRhdGVkOiB0cnVlLFxuICAgICAgICB3YWl0aW5nRm9yUmVzdGFydDogdHJ1ZSxcbiAgICAgICAgaW5zdGFsbFBhdGg6IHRhcmdldFZlcnNpb25EaXIsXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2xlYW51cE9sZFZlcnNpb25zKHJhYmJpeERpcjogc3RyaW5nLCBjdXJyZW50VmVyc2lvbjogc3RyaW5nLCBsYXRlc3RWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ2xlYW5pbmcgdXAgb2xkIHZlcnNpb25zJyk7XG4gICAgICBjb25zdCBjdXJyZW50VmVyc2lvbkRpciA9IGB2JHtjdXJyZW50VmVyc2lvbi5zdGFydHNXaXRoKCd2JykgPyBjdXJyZW50VmVyc2lvbi5zbGljZSgxKSA6IGN1cnJlbnRWZXJzaW9ufWA7XG4gICAgICBjb25zdCBsYXRlc3RWZXJzaW9uRGlyID0gYHYke2xhdGVzdFZlcnNpb24uc3RhcnRzV2l0aCgndicpID8gbGF0ZXN0VmVyc2lvbi5zbGljZSgxKSA6IGxhdGVzdFZlcnNpb259YDtcblxuICAgICAgbGV0IGVudHJpZXM6IHN0cmluZ1tdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIocmFiYml4RGlyKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoIWVudHJ5LnN0YXJ0c1dpdGgoJ3YnKSkgY29udGludWU7XG4gICAgICAgIGlmIChlbnRyeSA9PT0gY3VycmVudFZlcnNpb25EaXIgfHwgZW50cnkgPT09IGxhdGVzdFZlcnNpb25EaXIpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9sZFZlcnNpb25QYXRoID0gam9pbihyYWJiaXhEaXIsIGVudHJ5KTtcbiAgICAgICAgY29uc3QgdGVtcE5hbWUgPSBgLmRlbF8ke3RpbWVzdGFtcH1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gO1xuICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IGpvaW4ocmFiYml4RGlyLCB0ZW1wTmFtZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCByZW5hbWUob2xkVmVyc2lvblBhdGgsIHRlbXBQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJtKHRlbXBQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxubGV0IGluc3RhbmNlUHJvbWlzZTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlVXBkYXRlclN0b3JlPiB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlVXBkYXRlclN0b3JlKCkge1xuICBpZiAoIWluc3RhbmNlUHJvbWlzZSkgaW5zdGFuY2VQcm9taXNlID0gY3JlYXRlVXBkYXRlclN0b3JlKCk7XG4gIHJldHVybiBpbnN0YW5jZVByb21pc2U7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBU0EsTUFBTSxZQUFZLFFBQVEsY0FBYyxZQUFZLEdBQUcs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
