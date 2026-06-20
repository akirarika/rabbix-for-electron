import { readdir, rename, rm, mkdir, writeFile, access } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { u as useElectronStates } from "../index.js";
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
      try {
        const electronStates = await useElectronStates();
        const sevenZipExePath = electronStates.states.sevenZipExePath;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlci5zdG9yZS1QaTVNQVNoQy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWNjZXNzLCBta2RpciwgcmVhZGRpciwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgdXNlRWxlY3Ryb25TdGF0ZXMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9lbGVjdHJvbi1zdGF0ZXMudHMnO1xuXG50eXBlIFVwZGF0ZUxldmVsID0gJ21ham9yJyB8ICdtaW5vcicgfCAncGF0Y2gnO1xuXG5pbnRlcmZhY2UgVXBkYXRlU3RhdHVzIHtcbiAgYXV0b1VwZGF0ZVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgdXBkYXRlTGV2ZWw6IFVwZGF0ZUxldmVsIHwgbnVsbDtcbiAgdXBkYXRlQ29tcGxldGVkOiBib29sZWFuO1xuICB1cGRhdGVkOiBib29sZWFuO1xuICB3YWl0aW5nRm9yUmVzdGFydDogYm9vbGVhbjtcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgcmVtb3RlVmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgaW5zdGFsbFBhdGg6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIGZvcmNlVXBkYXRlOiBib29sZWFuO1xuICBwdWJsaXNoRGF0ZTogbnVtYmVyO1xuICBpc0NoZWNraW5nOiBib29sZWFuO1xufVxuXG5jb25zdCBnbG9iYWxVcGRhdGVTdGF0dXM6IFVwZGF0ZVN0YXR1cyA9IHtcbiAgYXV0b1VwZGF0ZVN1cHBvcnRlZDogZmFsc2UsXG4gIHVwZGF0ZUxldmVsOiBudWxsLFxuICB1cGRhdGVDb21wbGV0ZWQ6IGZhbHNlLFxuICB1cGRhdGVkOiBmYWxzZSxcbiAgd2FpdGluZ0ZvclJlc3RhcnQ6IGZhbHNlLFxuICBjdXJyZW50VmVyc2lvbjogJycsXG4gIHJlbW90ZVZlcnNpb246IG51bGwsXG4gIGluc3RhbGxQYXRoOiBudWxsLFxuICBtZXNzYWdlOiAnSWRsZScsXG4gIGVycm9yOiBudWxsLFxuICBmb3JjZVVwZGF0ZTogZmFsc2UsXG4gIHB1Ymxpc2hEYXRlOiAwLFxuICBpc0NoZWNraW5nOiBmYWxzZSxcbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc3RhdHVzKSBhcyBBcnJheTxrZXlvZiBVcGRhdGVTdGF0dXM+O1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVVcGRhdGVyU3RvcmUoKSB7XG4gIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ3JlYXRpbmcgdXBkYXRlciBzdG9yZSBpbnN0YW5jZScpO1xuXG4gIGNvbnN0IGluc3RhbmNlID0ge1xuICAgIGdldCBzdGF0dXMoKSB7XG4gICAgICByZXR1cm4gZ2xvYmFsVXBkYXRlU3RhdHVzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXMoc3RhdHVzOiBQYXJ0aWFsPFVwZGF0ZVN0YXR1cz4pOiB2b2lkIHtcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzdGF0dXMpIGFzIEFycmF5PGtleW9mIFVwZGF0ZVN0YXR1cz47XG4gICAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgICAgIChnbG9iYWxVcGRhdGVTdGF0dXMgYXMgYW55KVtrZXldID0gc3RhdHVzW2tleV07XG4gICAgICB9XG4gICAgfSxcblxuICAgIGFzeW5jIGRvd25sb2FkQW5kSW5zdGFsbChcbiAgICAgIGNvbnRleHQ6IGFueSxcbiAgICAgIGN1cnJlbnRWZXJzaW9uOiBzdHJpbmcsXG4gICAgICByZW1vdGVWZXJzaW9uOiBzdHJpbmcsXG4gICAgICBzcGxpdEZpbGVzOiBzdHJpbmdbXSxcbiAgICAgIHNwbGl0RmlsZUhhc2hlczogc3RyaW5nW10sXG4gICAgICBiYXNlVXJsOiBzdHJpbmcsXG4gICAgICByYWJiaXhEaXI6IHN0cmluZyxcbiAgICAgIHRhcmdldFZlcnNpb25EaXI6IHN0cmluZyxcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBTdGFydGluZyBkb3dubG9hZCBhbmQgaW5zdGFsbCBwcm9jZXNzJyk7XG5cbiAgICAgIGlmIChzcGxpdEZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsb2dnZXIuZXJyb3IoJ1t1cGRhdGVyLnN0b3JlLnRzXSBObyBzcGxpdCBmaWxlcyBwcm92aWRlZCcpO1xuICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9OT19TUExJVF9GSUxFUycsIHt9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG93bmxvYWRlZFBhcnRzOiBVaW50OEFycmF5W10gPSBbXTtcblxuICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHNwbGl0RmlsZXMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGZpbGVQYXRoID0gc3BsaXRGaWxlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IGV4cGVjdGVkSGFzaCA9IHNwbGl0RmlsZUhhc2hlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IGZ1bGxVcmwgPSBgJHtiYXNlVXJsfSR7ZmlsZVBhdGh9YDtcblxuICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIERvd25sb2FkaW5nIHBhcnQgJHtpbmRleCArIDF9IG9mICR7c3BsaXRGaWxlcy5sZW5ndGh9OmAsIGZpbGVQYXRoKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWRpbmcgdXBkYXRlLi4uYCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGxhc3RFcnJvcjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgICAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCAzOyBhdHRlbXB0KyspIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChmdWxsVXJsLCB7XG4gICAgICAgICAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCgxMjAwMDApLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgICAgICAgbGFzdEVycm9yID0gYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YDtcbiAgICAgICAgICAgICAgaWYgKGF0dGVtcHQgPCAyKSB7XG4gICAgICAgICAgICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBIVFRQIGVycm9yLCByZXRyeWluZyBpbiA1cy4uLicpO1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9ET1dOTE9BRF9GQUlMRUQnLCB7XG4gICAgICAgICAgICAgICAgcGFydEluZGV4OiBpbmRleCArIDEsXG4gICAgICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKTtcblxuICAgICAgICAgICAgaWYgKGV4cGVjdGVkSGFzaCkge1xuICAgICAgICAgICAgICBjb25zdCBhY3R1YWxIYXNoID0gY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGRhdGEpLmRpZ2VzdCgnaGV4Jyk7XG4gICAgICAgICAgICAgIGlmIChhY3R1YWxIYXNoLnRvTG93ZXJDYXNlKCkgIT09IGV4cGVjdGVkSGFzaC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfSEFTSF9NSVNNQVRDSCcsIHtcbiAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBleHBlY3RlZEhhc2gsXG4gICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbEhhc2gsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZG93bmxvYWRlZFBhcnRzLnB1c2goZGF0YSk7XG4gICAgICAgICAgICBsYXN0RXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBQYXJ0ICR7aW5kZXggKyAxfSBkb3dubG9hZGVkIHN1Y2Nlc3NmdWxseWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvciAmJiB0eXBlb2YgZXJyb3IgPT09ICdvYmplY3QnICYmICckbWlsa2lvUmVqZWN0JyBpbiBlcnJvcikge1xuICAgICAgICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBEb3dubG9hZCBmYWlsZWQ6ICR7bGFzdEVycm9yIHx8ICdVbmtub3duIGVycm9yJ31gLFxuICAgICAgICAgICAgICAgIGVycm9yOiBTdHJpbmcoZXJyb3IpLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYXN0RXJyb3IgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIERvd25sb2FkIGF0dGVtcHQgJHthdHRlbXB0ICsgMX0gZmFpbGVkOmAsIGxhc3RFcnJvcik7XG4gICAgICAgICAgICBpZiAoYXR0ZW1wdCA8IDIpIHtcbiAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgNTAwMCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsYXN0RXJyb3IpIHtcbiAgICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkIGZhaWxlZDogJHtsYXN0RXJyb3J9YCxcbiAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfRE9XTkxPQURfRkFJTEVEJywge1xuICAgICAgICAgICAgcGFydEluZGV4OiBpbmRleCArIDEsXG4gICAgICAgICAgICBlcnJvcjogbGFzdEVycm9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gQWxsIHBhcnRzIGRvd25sb2FkZWQsIG1lcmdpbmcuLi4nKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdNZXJnaW5nIGZpbGVzLi4uJyxcbiAgICAgIH0pO1xuXG4gICAgICBsZXQgdG90YWxMZW5ndGggPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb3dubG9hZGVkUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG90YWxMZW5ndGggKz0gZG93bmxvYWRlZFBhcnRzW2ldIS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBjb25zdCBtZXJnZWRBcmNoaXZlID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xuICAgICAgbGV0IG1lcmdlT2Zmc2V0ID0gMDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG93bmxvYWRlZFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1lcmdlZEFyY2hpdmUuc2V0KGRvd25sb2FkZWRQYXJ0c1tpXSEsIG1lcmdlT2Zmc2V0KTtcbiAgICAgICAgbWVyZ2VPZmZzZXQgKz0gZG93bmxvYWRlZFBhcnRzW2ldIS5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRlbXBEaXIgPSBqb2luKHJhYmJpeERpciwgJy50bXBfdXBkYXRlJyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICB9IGNhdGNoIHt9XG4gICAgICBhd2FpdCBta2Rpcih0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcblxuICAgICAgY29uc3QgdGVtcEFyY2hpdmVQYXRoID0gam9pbih0ZW1wRGlyLCAndXBkYXRlLjd6Jyk7XG4gICAgICBhd2FpdCB3cml0ZUZpbGUodGVtcEFyY2hpdmVQYXRoLCBtZXJnZWRBcmNoaXZlKTtcblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBFeHRyYWN0aW5nIGFyY2hpdmUuLi4nKTtcbiAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgIG1lc3NhZ2U6ICdFeHRyYWN0aW5nLi4uJyxcbiAgICAgIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBlbGVjdHJvblN0YXRlcyA9IGF3YWl0IHVzZUVsZWN0cm9uU3RhdGVzKCk7XG4gICAgICAgIGNvbnN0IHNldmVuWmlwRXhlUGF0aCA9IGVsZWN0cm9uU3RhdGVzLnN0YXRlcy5zZXZlblppcEV4ZVBhdGg7XG5cbiAgICAgICAgZXhlY1N5bmMoYFwiJHtzZXZlblppcEV4ZVBhdGh9XCIgeCBcIiR7dGVtcEFyY2hpdmVQYXRofVwiIC1vXCIke3RlbXBEaXJ9XCIgLXkgLWFvYWAsIHtcbiAgICAgICAgICBzdGRpbzogJ3BpcGUnLFxuICAgICAgICAgIHdpbmRvd3NIaWRlOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYEV4dHJhY3Rpb24gZmFpbGVkOiAke2Vycm9yTXNnfWAsXG4gICAgICAgICAgZXJyb3I6IGVycm9yTXNnLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfRVhUUkFDVElPTl9GQUlMRUQnLCB7IGVycm9yOiBlcnJvck1zZyB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcm0odGVtcEFyY2hpdmVQYXRoLCB7IGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFjY2Vzcyh0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgICAgYXdhaXQgcm0odGFyZ2V0VmVyc2lvbkRpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBjb25zdCBleHRyYWN0ZWRFbnRyaWVzID0gYXdhaXQgcmVhZGRpcih0ZW1wRGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBsZXQgc291cmNlRGlyID0gdGVtcERpcjtcblxuICAgICAgaWYgKGV4dHJhY3RlZEVudHJpZXMubGVuZ3RoID09PSAxICYmIGV4dHJhY3RlZEVudHJpZXNbMF0hLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgc291cmNlRGlyID0gam9pbih0ZW1wRGlyLCBleHRyYWN0ZWRFbnRyaWVzWzBdIS5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBNb3ZpbmcgZXh0cmFjdGVkIGZpbGVzIHRvIHRhcmdldCBkaXJlY3Rvcnk6JywgdGFyZ2V0VmVyc2lvbkRpcik7XG4gICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICBtZXNzYWdlOiAnSW5zdGFsbGluZy4uLicsXG4gICAgICB9KTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcmVuYW1lKHNvdXJjZURpciwgdGFyZ2V0VmVyc2lvbkRpcik7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBhd2FpdCBybSh0ZW1wRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgIG1lc3NhZ2U6IGBJbnN0YWxsYXRpb24gZmFpbGVkOiAke2Vycm9yTXNnfWAsXG4gICAgICAgICAgZXJyb3I6IGVycm9yTXNnLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfSU5TVEFMTF9GQUlMRUQnLCB7IGVycm9yOiBlcnJvck1zZyB9KTtcbiAgICAgIH1cblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIFVwZGF0ZSBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5LCB2ZXJzaW9uOicsIHJlbW90ZVZlcnNpb24pO1xuICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgbWVzc2FnZTogJ1VwZGF0ZSBzdWNjZXNzZnVsJyxcbiAgICAgICAgdXBkYXRlQ29tcGxldGVkOiB0cnVlLFxuICAgICAgICB1cGRhdGVkOiB0cnVlLFxuICAgICAgICB3YWl0aW5nRm9yUmVzdGFydDogdHJ1ZSxcbiAgICAgICAgaW5zdGFsbFBhdGg6IHRhcmdldFZlcnNpb25EaXIsXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2xlYW51cE9sZFZlcnNpb25zKHJhYmJpeERpcjogc3RyaW5nLCBjdXJyZW50VmVyc2lvbjogc3RyaW5nLCBsYXRlc3RWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ2xlYW5pbmcgdXAgb2xkIHZlcnNpb25zJyk7XG4gICAgICBjb25zdCBjdXJyZW50VmVyc2lvbkRpciA9IGB2JHtjdXJyZW50VmVyc2lvbi5zdGFydHNXaXRoKCd2JykgPyBjdXJyZW50VmVyc2lvbi5zbGljZSgxKSA6IGN1cnJlbnRWZXJzaW9ufWA7XG4gICAgICBjb25zdCBsYXRlc3RWZXJzaW9uRGlyID0gYHYke2xhdGVzdFZlcnNpb24uc3RhcnRzV2l0aCgndicpID8gbGF0ZXN0VmVyc2lvbi5zbGljZSgxKSA6IGxhdGVzdFZlcnNpb259YDtcblxuICAgICAgbGV0IGVudHJpZXM6IHN0cmluZ1tdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIocmFiYml4RGlyKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoIWVudHJ5LnN0YXJ0c1dpdGgoJ3YnKSkgY29udGludWU7XG4gICAgICAgIGlmIChlbnRyeSA9PT0gY3VycmVudFZlcnNpb25EaXIgfHwgZW50cnkgPT09IGxhdGVzdFZlcnNpb25EaXIpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9sZFZlcnNpb25QYXRoID0gam9pbihyYWJiaXhEaXIsIGVudHJ5KTtcbiAgICAgICAgY29uc3QgdGVtcE5hbWUgPSBgLmRlbF8ke3RpbWVzdGFtcH1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gO1xuICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IGpvaW4ocmFiYml4RGlyLCB0ZW1wTmFtZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCByZW5hbWUob2xkVmVyc2lvblBhdGgsIHRlbXBQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJtKHRlbXBQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxubGV0IGluc3RhbmNlUHJvbWlzZTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlVXBkYXRlclN0b3JlPiB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlVXBkYXRlclN0b3JlKCkge1xuICBpZiAoIWluc3RhbmNlUHJvbWlzZSkgaW5zdGFuY2VQcm9taXNlID0gY3JlYXRlVXBkYXRlclN0b3JlKCk7XG4gIHJldHVybiBpbnN0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
