import { join } from "path";
import { access } from "fs/promises";
import { spawn } from "child_process";
import { u as useUpdaterStore } from "./updater.store-DCsnZOfe.js";
import "crypto";
const meta = {};
async function handler(context) {
  const logger = context.logger;
  logger.info("[reload.action.ts] Handler called");
  const store = await useUpdaterStore();
  if (!store.status.updateCompleted || !store.status.waitingForRestart) {
    logger.info("[reload.action.ts] No pending update or restart required");
    return {
      success: false,
      message: "No completed update waiting for restart"
    };
  }
  if (!store.status.installPath) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsb2FkLmFjdGlvbi1Cb2E4c1FJUi5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci9yZWxvYWQuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWNjZXNzIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgc3Bhd24gfSBmcm9tICdjaGlsZF9wcm9jZXNzJztcbmltcG9ydCB7IHVzZVVwZGF0ZXJTdG9yZSB9IGZyb20gJy4vJHN0b3Jlcy91cGRhdGVyLnN0b3JlJztcblxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoY29udGV4dDogTWlsa2lvQ29udGV4dCkge1xuICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBIYW5kbGVyIGNhbGxlZCcpO1xuXG4gIGNvbnN0IHN0b3JlID0gYXdhaXQgdXNlVXBkYXRlclN0b3JlKCk7XG5cbiAgaWYgKCFzdG9yZS5zdGF0dXMudXBkYXRlQ29tcGxldGVkIHx8ICFzdG9yZS5zdGF0dXMud2FpdGluZ0ZvclJlc3RhcnQpIHtcbiAgICBsb2dnZXIuaW5mbygnW3JlbG9hZC5hY3Rpb24udHNdIE5vIHBlbmRpbmcgdXBkYXRlIG9yIHJlc3RhcnQgcmVxdWlyZWQnKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnTm8gY29tcGxldGVkIHVwZGF0ZSB3YWl0aW5nIGZvciByZXN0YXJ0JyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFzdG9yZS5zdGF0dXMuaW5zdGFsbFBhdGgpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1tyZWxvYWQuYWN0aW9uLnRzXSBJbnN0YWxsIHBhdGggaXMgbWlzc2luZycpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdJbnN0YWxsIHBhdGggaXMgbWlzc2luZycsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHVzZXJuYW1lID0gcHJvY2Vzcy5lbnYuVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUjtcbiAgaWYgKCF1c2VybmFtZSkge1xuICAgIGxvZ2dlci5lcnJvcignW3JlbG9hZC5hY3Rpb24udHNdIENhbm5vdCBkZXRlcm1pbmUgdXNlcm5hbWUnKTtcbiAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnUkVMT0FEX0NBTk5PVF9ERVRFUk1JTkVfVVNFUk5BTUUnLCB1bmRlZmluZWQpO1xuICB9XG5cbiAgY29uc3QgbGF1bmNoZXJQYXRoID0gam9pbignQzonLCAnVXNlcnMnLCB1c2VybmFtZSwgJ0FwcERhdGEnLCAnTG9jYWwnLCAncmFiYml4JywgJ3JhYmJpeC1sYXVuY2hlci5leGUnKTtcblxuICB0cnkge1xuICAgIGF3YWl0IGFjY2VzcyhsYXVuY2hlclBhdGgpO1xuICAgIGxvZ2dlci5pbmZvKCdbcmVsb2FkLmFjdGlvbi50c10gTGF1bmNoZXIgZXhpc3RzIGF0OicsIGxhdW5jaGVyUGF0aCk7XG4gIH0gY2F0Y2gge1xuICAgIGxvZ2dlci5lcnJvcignW3JlbG9hZC5hY3Rpb24udHNdIExhdW5jaGVyIG5vdCBmb3VuZCBhdDonLCBsYXVuY2hlclBhdGgpO1xuICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdSRUxPQURfTEFVTkNIRVJfTk9UX0ZPVU5EJywgeyBwYXRoOiBsYXVuY2hlclBhdGggfSk7XG4gIH1cblxuICBjb25zdCB3YWl0U2Vjb25kcyA9IDU7XG5cbiAgbG9nZ2VyLmluZm8oYFtyZWxvYWQuYWN0aW9uLnRzXSBMYXVuY2hpbmcgJHtsYXVuY2hlclBhdGh9IHdpdGggLS13YWl0PSR7d2FpdFNlY29uZHN9YCk7XG5cbiAgY29uc3QgY2hpbGRQcm9jZXNzID0gc3Bhd24oYFwiJHtsYXVuY2hlclBhdGh9XCJgLCBbYC0td2FpdD0ke3dhaXRTZWNvbmRzfWBdLCB7XG4gICAgZGV0YWNoZWQ6IHRydWUsXG4gICAgd2luZG93c0hpZGU6IHRydWUsXG4gICAgc3RkaW86ICdpZ25vcmUnLFxuICAgIHNoZWxsOiB0cnVlLFxuICB9KTtcblxuICBjaGlsZFByb2Nlc3Mub24oJ2Vycm9yJywgKGVycm9yOiBFcnJvcikgPT4ge1xuICAgIGxvZ2dlci5lcnJvcignW3JlbG9hZC5hY3Rpb24udHNdIEZhaWxlZCB0byBsYXVuY2ggcmFiYml4LWxhdW5jaGVyLmV4ZTonLCBlcnJvcik7XG4gIH0pO1xuXG4gIGNoaWxkUHJvY2Vzcy51bnJlZigpO1xuXG4gIGxvZ2dlci5pbmZvKCdbcmVsb2FkLmFjdGlvbi50c10gU3VjY2Vzc2Z1bGx5IGluaXRpYXRlZCByYWJiaXgtbGF1bmNoZXIuZXhlIGxhdW5jaCcpO1xuXG4gIGxvZ2dlci5pbmZvKCdbcmVsb2FkLmFjdGlvbi50c10gRXhpdGluZyBFbGVjdHJvbiBwcm9jZXNzIGluIDUwMG1zIHRvIGFsbG93IGxhdW5jaGVyIHRvIHN0YXJ0Jyk7XG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgcHJvY2Vzcy5leGl0KDApO1xuICB9LCA1MDApO1xuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBtZXNzYWdlOiAnUmVsYXVuY2ggaW5pdGlhdGVkJyxcbiAgfTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQU1PLE1BQU0sT0FBbUIsQ0FBQTtBQUVoQyxlQUFzQixRQUFRLFNBQXdCO0FBQ3BELFFBQU0sU0FBUyxRQUFRO0FBQ3ZCLFNBQU8sS0FBSyxtQ0FBbUM7QUFFL0MsUUFBTSxRQUFRLE1BQU0sZ0JBQUE7QUFFcEIsTUFBSSxDQUFDLE1BQU0sT0FBTyxtQkFBbUIsQ0FBQyxNQUFNLE9BQU8sbUJBQW1CO0FBQ3BFLFdBQU8sS0FBSywwREFBMEQ7QUFDdEUsV0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLElBQUE7QUFBQSxFQUViO0FBRUEsTUFBSSxDQUFDLE1BQU0sT0FBTyxhQUFhO0FBQzdCLFdBQU8sTUFBTSw0Q0FBNEM7QUFDekQsV0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLElBQUE7QUFBQSxFQUViO0FBRUEsUUFBTSxXQUFXLFFBQVEsSUFBSSxZQUFZLFFBQVEsSUFBSTtBQUNyRCxNQUFJLENBQUMsVUFBVTtBQUNiLFdBQU8sTUFBTSw4Q0FBOEM7QUFDM0QsVUFBTSxRQUFRLE9BQU8sb0NBQW9DLE1BQVM7QUFBQSxFQUNwRTtBQUVBLFFBQU0sZUFBZSxLQUFLLE1BQU0sU0FBUyxVQUFVLFdBQVcsU0FBUyxVQUFVLHFCQUFxQjtBQUV0RyxNQUFJO0FBQ0YsVUFBTSxPQUFPLFlBQVk7QUFDekIsV0FBTyxLQUFLLDBDQUEwQyxZQUFZO0FBQUEsRUFDcEUsUUFBUTtBQUNOLFdBQU8sTUFBTSw2Q0FBNkMsWUFBWTtBQUN0RSxVQUFNLFFBQVEsT0FBTyw2QkFBNkIsRUFBRSxNQUFNLGNBQWM7QUFBQSxFQUMxRTtBQUVBLFFBQU0sY0FBYztBQUVwQixTQUFPLEtBQUssZ0NBQWdDLFlBQVksZ0JBQWdCLFdBQVcsRUFBRTtBQUVyRixRQUFNLGVBQWUsTUFBTSxJQUFJLFlBQVksS0FBSyxDQUFDLFVBQVUsV0FBVyxFQUFFLEdBQUc7QUFBQSxJQUN6RSxVQUFVO0FBQUEsSUFDVixhQUFhO0FBQUEsSUFDYixPQUFPO0FBQUEsSUFDUCxPQUFPO0FBQUEsRUFBQSxDQUNSO0FBRUQsZUFBYSxHQUFHLFNBQVMsQ0FBQyxVQUFpQjtBQUN6QyxXQUFPLE1BQU0sNERBQTRELEtBQUs7QUFBQSxFQUNoRixDQUFDO0FBRUQsZUFBYSxNQUFBO0FBRWIsU0FBTyxLQUFLLHNFQUFzRTtBQUVsRixTQUFPLEtBQUssaUZBQWlGO0FBRTdGLGFBQVcsTUFBTTtBQUNmLFlBQVEsS0FBSyxDQUFDO0FBQUEsRUFDaEIsR0FBRyxHQUFHO0FBRU4sU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsU0FBUztBQUFBLEVBQUE7QUFFYjsifQ==
