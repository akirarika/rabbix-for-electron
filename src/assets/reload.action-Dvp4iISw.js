import { join } from "path";
import { access } from "fs/promises";
import { exec } from "child_process";
import { u as useUpdaterStore } from "./updater.store-BWgWFoVH.js";
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
    throw context.reject("RELOAD_CANNOT_DETERMINE_USERNAME", {});
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
  exec(`"${launcherPath}" --wait=${waitSeconds}`, {
    detached: true,
    windowsHide: true,
    stdio: "ignore"
  }, (error) => {
    if (error) {
      logger.error("[reload.action.ts] Failed to launch rabbix-launcher.exe:", error);
    } else {
      logger.info("[reload.action.ts] Successfully launched rabbix-launcher.exe");
    }
  });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsb2FkLmFjdGlvbi1EdnA0aUlTdy5qcyIsInNvdXJjZXMiOlsiLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci9yZWxvYWQuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWNjZXNzIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgZXhlYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgdXNlVXBkYXRlclN0b3JlIH0gZnJvbSAnLi8kc3RvcmVzL3VwZGF0ZXIuc3RvcmUnO1xuXG5leHBvcnQgY29uc3QgbWV0YTogTWlsa2lvTWV0YSA9IHt9O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihcbiAgY29udGV4dDogTWlsa2lvQ29udGV4dCxcbikge1xuICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBIYW5kbGVyIGNhbGxlZCcpO1xuXG4gIGNvbnN0IHN0b3JlID0gYXdhaXQgdXNlVXBkYXRlclN0b3JlKCk7XG5cbiAgaWYgKCFzdG9yZS5zdGF0dXMudXBkYXRlQ29tcGxldGVkIHx8ICFzdG9yZS5zdGF0dXMud2FpdGluZ0ZvclJlc3RhcnQpIHtcbiAgICBsb2dnZXIuaW5mbygnW3JlbG9hZC5hY3Rpb24udHNdIE5vIHBlbmRpbmcgdXBkYXRlIG9yIHJlc3RhcnQgcmVxdWlyZWQnKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBtZXNzYWdlOiAnTm8gY29tcGxldGVkIHVwZGF0ZSB3YWl0aW5nIGZvciByZXN0YXJ0JyxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFzdG9yZS5zdGF0dXMuaW5zdGFsbFBhdGgpIHtcbiAgICBsb2dnZXIuZXJyb3IoJ1tyZWxvYWQuYWN0aW9uLnRzXSBJbnN0YWxsIHBhdGggaXMgbWlzc2luZycpO1xuICAgIHJldHVybiB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIG1lc3NhZ2U6ICdJbnN0YWxsIHBhdGggaXMgbWlzc2luZycsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHVzZXJuYW1lID0gcHJvY2Vzcy5lbnYuVVNFUk5BTUUgfHwgcHJvY2Vzcy5lbnYuVVNFUjtcbiAgaWYgKCF1c2VybmFtZSkge1xuICAgIGxvZ2dlci5lcnJvcignW3JlbG9hZC5hY3Rpb24udHNdIENhbm5vdCBkZXRlcm1pbmUgdXNlcm5hbWUnKTtcbiAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnUkVMT0FEX0NBTk5PVF9ERVRFUk1JTkVfVVNFUk5BTUUnLCB7fSk7XG4gIH1cblxuICBjb25zdCBsYXVuY2hlclBhdGggPSBqb2luKCdDOicsICdVc2VycycsIHVzZXJuYW1lLCAnQXBwRGF0YScsICdMb2NhbCcsICdyYWJiaXgnLCAncmFiYml4LWxhdW5jaGVyLmV4ZScpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgYWNjZXNzKGxhdW5jaGVyUGF0aCk7XG4gICAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBMYXVuY2hlciBleGlzdHMgYXQ6JywgbGF1bmNoZXJQYXRoKTtcbiAgfSBjYXRjaCB7XG4gICAgbG9nZ2VyLmVycm9yKCdbcmVsb2FkLmFjdGlvbi50c10gTGF1bmNoZXIgbm90IGZvdW5kIGF0OicsIGxhdW5jaGVyUGF0aCk7XG4gICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1JFTE9BRF9MQVVOQ0hFUl9OT1RfRk9VTkQnLCB7IHBhdGg6IGxhdW5jaGVyUGF0aCB9KTtcbiAgfVxuXG4gIGNvbnN0IHdhaXRTZWNvbmRzID0gNTtcblxuICBsb2dnZXIuaW5mbyhgW3JlbG9hZC5hY3Rpb24udHNdIExhdW5jaGluZyAke2xhdW5jaGVyUGF0aH0gd2l0aCAtLXdhaXQ9JHt3YWl0U2Vjb25kc31gKTtcblxuICBleGVjKGBcIiR7bGF1bmNoZXJQYXRofVwiIC0td2FpdD0ke3dhaXRTZWNvbmRzfWAsIHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICB3aW5kb3dzSGlkZTogdHJ1ZSxcbiAgICBzdGRpbzogJ2lnbm9yZScsXG4gIH0sIChlcnJvcikgPT4ge1xuICAgIGlmIChlcnJvcikge1xuICAgICAgbG9nZ2VyLmVycm9yKCdbcmVsb2FkLmFjdGlvbi50c10gRmFpbGVkIHRvIGxhdW5jaCByYWJiaXgtbGF1bmNoZXIuZXhlOicsIGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBTdWNjZXNzZnVsbHkgbGF1bmNoZWQgcmFiYml4LWxhdW5jaGVyLmV4ZScpO1xuICAgIH1cbiAgfSk7XG5cbiAgbG9nZ2VyLmluZm8oJ1tyZWxvYWQuYWN0aW9uLnRzXSBFeGl0aW5nIEVsZWN0cm9uIHByb2Nlc3MgaW4gNTAwbXMgdG8gYWxsb3cgbGF1bmNoZXIgdG8gc3RhcnQnKTtcblxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBwcm9jZXNzLmV4aXQoMCk7XG4gIH0sIDUwMCk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG1lc3NhZ2U6ICdSZWxhdW5jaCBpbml0aWF0ZWQnLFxuICB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBTU8sTUFBTSxPQUFtQixDQUFBO0FBRWhDLGVBQXNCLFFBQ3BCLFNBQ0E7QUFDQSxRQUFNLFNBQVMsUUFBUTtBQUN2QixTQUFPLEtBQUssbUNBQW1DO0FBRS9DLFFBQU0sUUFBUSxNQUFNLGdCQUFBO0FBRXBCLE1BQUksQ0FBQyxNQUFNLE9BQU8sbUJBQW1CLENBQUMsTUFBTSxPQUFPLG1CQUFtQjtBQUNwRSxXQUFPLEtBQUssMERBQTBEO0FBQ3RFLFdBQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxJQUFBO0FBQUEsRUFFYjtBQUVBLE1BQUksQ0FBQyxNQUFNLE9BQU8sYUFBYTtBQUM3QixXQUFPLE1BQU0sNENBQTRDO0FBQ3pELFdBQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxJQUFBO0FBQUEsRUFFYjtBQUVBLFFBQU0sV0FBVyxRQUFRLElBQUksWUFBWSxRQUFRLElBQUk7QUFDckQsTUFBSSxDQUFDLFVBQVU7QUFDYixXQUFPLE1BQU0sOENBQThDO0FBQzNELFVBQU0sUUFBUSxPQUFPLG9DQUFvQyxFQUFFO0FBQUEsRUFDN0Q7QUFFQSxRQUFNLGVBQWUsS0FBSyxNQUFNLFNBQVMsVUFBVSxXQUFXLFNBQVMsVUFBVSxxQkFBcUI7QUFFdEcsTUFBSTtBQUNGLFVBQU0sT0FBTyxZQUFZO0FBQ3pCLFdBQU8sS0FBSywwQ0FBMEMsWUFBWTtBQUFBLEVBQ3BFLFFBQVE7QUFDTixXQUFPLE1BQU0sNkNBQTZDLFlBQVk7QUFDdEUsVUFBTSxRQUFRLE9BQU8sNkJBQTZCLEVBQUUsTUFBTSxjQUFjO0FBQUEsRUFDMUU7QUFFQSxRQUFNLGNBQWM7QUFFcEIsU0FBTyxLQUFLLGdDQUFnQyxZQUFZLGdCQUFnQixXQUFXLEVBQUU7QUFFckYsT0FBSyxJQUFJLFlBQVksWUFBWSxXQUFXLElBQUk7QUFBQSxJQUM5QyxVQUFVO0FBQUEsSUFDVixhQUFhO0FBQUEsSUFDYixPQUFPO0FBQUEsRUFBQSxHQUNOLENBQUMsVUFBVTtBQUNaLFFBQUksT0FBTztBQUNULGFBQU8sTUFBTSw0REFBNEQsS0FBSztBQUFBLElBQ2hGLE9BQU87QUFDTCxhQUFPLEtBQUssOERBQThEO0FBQUEsSUFDNUU7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLEtBQUssaUZBQWlGO0FBRTdGLGFBQVcsTUFBTTtBQUNmLFlBQVEsS0FBSyxDQUFDO0FBQUEsRUFDaEIsR0FBRyxHQUFHO0FBRU4sU0FBTztBQUFBLElBQ0wsU0FBUztBQUFBLElBQ1QsU0FBUztBQUFBLEVBQUE7QUFFYjsifQ==
