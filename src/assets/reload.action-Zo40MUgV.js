import { join } from "path";
import { access } from "fs/promises";
import { spawn } from "child_process";
import { u as useUpdaterStore } from "./updater.store-Pi5MAShC.js";
import "crypto";
import "../index.js";
import "node:http";
import "fs";
import "url";
import "node:crypto";
import "node:process";
const meta = {};
async function handler(context, params) {
  const logger = context.logger;
  logger.info("[reload.action.ts] Handler called");
  const store = await useUpdaterStore();
  if (!params.force && (!store.status.updateCompleted || !store.status.waitingForRestart)) {
    logger.info("[reload.action.ts] No pending update or restart required");
    return {
      success: false,
      message: "No completed update waiting for restart"
    };
  }
  if (!params.force && !store.status.installPath) {
    logger.error("[reload.action.ts] Install path is missing");
    return {
      success: false,
      message: "Install path is missing"
    };
  }
  const username = process.env.USERNAME || process.env.USER;
  if (!username) {
    logger.error("[reload.action.ts] Cannot determine username");
    throw context.reject("RELOAD_CANNOT_DETERMINE_USERNAME", void 0);
  }
  const launcherPath = join("C:", "Users", username, "AppData", "Local", "rabbix", "rabbix-launcher.exe");
  try {
    await access(launcherPath);
    logger.info("[reload.action.ts] Launcher exists at:", launcherPath);
  } catch {
    logger.error("[reload.action.ts] Launcher not found at:", launcherPath);
    throw context.reject("RELOAD_LAUNCHER_NOT_FOUND", { path: launcherPath });
  }
  const waitSeconds = 5;
  logger.info(`[reload.action.ts] Launching ${launcherPath} with --wait=${waitSeconds}`);
  const childProcess = spawn(`"${launcherPath}"`, [`--wait=${waitSeconds}`], {
    detached: true,
    windowsHide: true,
    stdio: "ignore",
    shell: true
  });
  childProcess.on("error", (error) => {
    logger.error("[reload.action.ts] Failed to launch rabbix-launcher.exe:", error);
  });
  childProcess.unref();
  logger.info("[reload.action.ts] Successfully initiated rabbix-launcher.exe launch");
  logger.info("[reload.action.ts] Exiting Electron process in 500ms to allow launcher to start");
  setTimeout(() => {
    process.exit(0);
  }, 500);
  return {
    success: true,
    message: "Relaunch initiated"
  };
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsb2FkLmFjdGlvbi1abzQwTVVnVi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci9yZWxvYWQuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWNjZXNzIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IHVzZVVwZGF0ZXJTdG9yZSB9IGZyb20gJy4vJHN0b3Jlcy91cGRhdGVyLnN0b3JlJztcblxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcblxudHlwZSBQYXJhbXMgPSB7XG4gIGZvcmNlPzogYm9vbGVhbjtcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGNvbnRleHQ6IE1pbGtpb0NvbnRleHQsIHBhcmFtczogUGFyYW1zKSB7XG4gIGNvbnN0IGxvZ2dlciA9IGNvbnRleHQubG9nZ2VyO1xuICBsb2dnZXIuaW5mbygnW3JlbG9hZC5hY3Rpb24udHNdIEhhbmRsZXIgY2FsbGVkJyk7XG5cbiAgY29uc3Qgc3RvcmUgPSBhd2FpdCB1c2VVcGRhdGVyU3RvcmUoKTtcblxuICBpZiAoIXBhcmFtcy5mb3JjZSAmJiAoIXN0b3JlLnN0YXR1cy51cGRhdGVDb21wbGV0ZWQgfHwgIXN0b3JlLnN0YXR1cy53YWl0aW5nRm9yUmVzdGFydCkpIHtcbiAgICBsb2dnZXIuaW5mbygnW3JlbG9hZC5hY3Rpb24udHNdIE5vIHBlbmRpbmcgdXBkYXRlIG9yIHJlc3RhcnQgcmVxdWlyZWQnKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnTm8gY29tcGxldGVkIHVwZGF0ZSB3YWl0aW5nIGZvciByZXN0YXJ0JyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFwYXJhbXMuZm9yY2UgJiYgIXN0b3JlLnN0YXR1cy5pbnN0YWxsUGF0aCkge1xuICAgIGxvZ2dlci5lcnJvcignW3JlbG9hZC5hY3Rpb24udHNdIEluc3RhbGwgcGF0aCBpcyBtaXNzaW5nJyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgbWVzc2FnZTogJ0luc3RhbGwgcGF0aCBpcyBtaXNzaW5nJyxcbiAgICB9O1xuICB9XG5cbiAgY29uc3QgdXNlcm5hbWUgPSBwcm9jZXNzLmVudi5VU0VSTkFNRSB8fCBwcm9jZXNzLmVudi5VU0VSO1xuICBpZiAoIXVzZXJuYW1lKSB7XG4gICAgbG9nZ2VyLmVycm9yKCdbcmVsb2FkLmFjdGlvbi50c10gQ2Fubm90IGRldGVybWluZSB1c2VybmFtZScpO1xuICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdSRUxPQURfQ0FOTk9UX0RFVEVSTUlORV9VU0VSTkFNRScsIHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb25zdCBsYXVuY2hlclBhdGggPSBqb2luKCdDOicsICdVc2VycycsIHVzZXJuYW1lLCAnQXBwRGF0YScsICdMb2NhbCcsICdyYWJiaXgnLCAncmFiYml4LWxhdW5jaGVyLmV4ZScpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgYWNjZXNzKGxhdW5jaGVyUGF0aCk7XG4gICAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBMYXVuY2hlciBleGlzdHMgYXQ6JywgbGF1bmNoZXJQYXRoKTtcbiAgfSBjYXRjaCB7XG4gICAgbG9nZ2VyLmVycm9yKCdbcmVsb2FkLmFjdGlvbi50c10gTGF1bmNoZXIgbm90IGZvdW5kIGF0OicsIGxhdW5jaGVyUGF0aCk7XG4gICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1JFTE9BRF9MQVVOQ0hFUl9OT1RfRk9VTkQnLCB7IHBhdGg6IGxhdW5jaGVyUGF0aCB9KTtcbiAgfVxuXG4gIGNvbnN0IHdhaXRTZWNvbmRzID0gNTtcblxuICBsb2dnZXIuaW5mbyhgW3JlbG9hZC5hY3Rpb24udHNdIExhdW5jaGluZyAke2xhdW5jaGVyUGF0aH0gd2l0aCAtLXdhaXQ9JHt3YWl0U2Vjb25kc31gKTtcblxuICBjb25zdCBjaGlsZFByb2Nlc3MgPSBzcGF3bihgXCIke2xhdW5jaGVyUGF0aH1cImAsIFtgLS13YWl0PSR7d2FpdFNlY29uZHN9YF0sIHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICBzdGRpbzogJ2lnbm9yZScsXG4gICAgc2hlbGw6IHRydWUsXG4gIH0pO1xuXG4gIGNoaWxkUHJvY2Vzcy5vbignZXJyb3InLCAoZXJyb3I6IEVycm9yKSA9PiB7XG4gICAgbG9nZ2VyLmVycm9yKCdbcmVsb2FkLmFjdGlvbi50c10gRmFpbGVkIHRvIGxhdW5jaCByYWJiaXgtbGF1bmNoZXIuZXhlOicsIGVycm9yKTtcbiAgfSk7XG5cbiAgY2hpbGRQcm9jZXNzLnVucmVmKCk7XG5cbiAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBTdWNjZXNzZnVsbHkgaW5pdGlhdGVkIHJhYmJpeC1sYXVuY2hlci5leGUgbGF1bmNoJyk7XG5cbiAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBFeGl0aW5nIEVsZWN0cm9uIHByb2Nlc3MgaW4gNTAwbXMgdG8gYWxsb3cgbGF1bmNoZXIgdG8gc3RhcnQnKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH0sIDUwMCk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG1lc3NhZ2U6ICdSZWxhdW5jaCBpbml0aWF0ZWQnLFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTU8sTUFBTSxPQUFtQixDQUFBO0FBTWhDLGVBQXNCLFFBQVEsU0FBd0IsUUFBZ0I7QUFDcEUsUUFBTSxTQUFTLFFBQVE7QUFDdkIsU0FBTyxLQUFLLG1DQUFtQztBQUUvQyxRQUFNLFFBQVEsTUFBTSxnQkFBQTtBQUVwQixNQUFJLENBQUMsT0FBTyxVQUFVLENBQUMsTUFBTSxPQUFPLG1CQUFtQixDQUFDLE1BQU0sT0FBTyxvQkFBb0I7QUFDdkYsV0FBTyxLQUFLLDBEQUEwRDtBQUN0RSxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxTQUFTO0FBQUEsSUFBQTtBQUFBLEVBRWI7QUFFQSxNQUFJLENBQUMsT0FBTyxTQUFTLENBQUMsTUFBTSxPQUFPLGFBQWE7QUFDOUMsV0FBTyxNQUFNLDRDQUE0QztBQUN6RCxXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsTUFDVCxTQUFTO0FBQUEsSUFBQTtBQUFBLEVBRWI7QUFFQSxRQUFNLFdBQVcsUUFBUSxJQUFJLFlBQVksUUFBUSxJQUFJO0FBQ3JELE1BQUksQ0FBQyxVQUFVO0FBQ2IsV0FBTyxNQUFNLDhDQUE4QztBQUMzRCxVQUFNLFFBQVEsT0FBTyxvQ0FBb0MsTUFBUztBQUFBLEVBQ3BFO0FBRUEsUUFBTSxlQUFlLEtBQUssTUFBTSxTQUFTLFVBQVUsV0FBVyxTQUFTLFVBQVUscUJBQXFCO0FBRXRHLE1BQUk7QUFDRixVQUFNLE9BQU8sWUFBWTtBQUN6QixXQUFPLEtBQUssMENBQTBDLFlBQVk7QUFBQSxFQUNwRSxRQUFRO0FBQ04sV0FBTyxNQUFNLDZDQUE2QyxZQUFZO0FBQ3RFLFVBQU0sUUFBUSxPQUFPLDZCQUE2QixFQUFFLE1BQU0sY0FBYztBQUFBLEVBQzFFO0FBRUEsUUFBTSxjQUFjO0FBRXBCLFNBQU8sS0FBSyxnQ0FBZ0MsWUFBWSxnQkFBZ0IsV0FBVyxFQUFFO0FBRXJGLFFBQU0sZUFBZSxNQUFNLElBQUksWUFBWSxLQUFLLENBQUMsVUFBVSxXQUFXLEVBQUUsR0FBRztBQUFBLElBQ3pFLFVBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQSxJQUNiLE9BQU87QUFBQSxJQUNQLE9BQU87QUFBQSxFQUFBLENBQ1I7QUFFRCxlQUFhLEdBQUcsU0FBUyxDQUFDLFVBQWlCO0FBQ3pDLFdBQU8sTUFBTSw0REFBNEQsS0FBSztBQUFBLEVBQ2hGLENBQUM7QUFFRCxlQUFhLE1BQUE7QUFFYixTQUFPLEtBQUssc0VBQXNFO0FBRWxGLFNBQU8sS0FBSyxpRkFBaUY7QUFFN0YsYUFBVyxNQUFNO0FBQ2YsWUFBUSxLQUFLLENBQUM7QUFBQSxFQUNoQixHQUFHLEdBQUc7QUFFTixTQUFPO0FBQUEsSUFDTCxTQUFTO0FBQUEsSUFDVCxTQUFTO0FBQUEsRUFBQTtBQUViOyJ9
