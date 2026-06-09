import { resolve, normalize } from "node:path";
import { homedir } from "node:os";
const meta = {};
async function handler(context, params) {
  context.logger.info("端点请求参数 (validate-path.action.ts)", JSON.stringify(params));
  const absPath = resolve(params.path);
  const home = homedir();
  const platform = process.platform;
  let allowed = false;
  if (platform === "win32") {
    const homeNorm = normalize(home).toLowerCase();
    const pathNorm = normalize(absPath).toLowerCase();
    if (pathNorm.startsWith(homeNorm + "\\") || pathNorm === homeNorm) {
      allowed = true;
    } else if (!pathNorm.startsWith("c:\\")) {
      allowed = true;
    }
  } else if (platform === "linux") {
    const homeNorm = normalize(home);
    const pathNorm = normalize(absPath);
    if (pathNorm.startsWith(homeNorm + "/") || pathNorm === homeNorm) {
      allowed = true;
    } else if (pathNorm.startsWith("/mnt/") && pathNorm !== "/mnt") {
      allowed = true;
    }
  } else if (platform === "darwin") {
    const homeNorm = normalize(home);
    const pathNorm = normalize(absPath);
    if (pathNorm.startsWith(homeNorm + "/") || pathNorm === homeNorm) {
      allowed = true;
    } else if (pathNorm.startsWith("/Volumes/") && pathNorm !== "/Volumes") {
      allowed = true;
    }
  } else {
    allowed = true;
  }
  if (!allowed) {
    throw context.reject("BACKUP_PATH_NOT_ALLOWED", { path: absPath });
  }
  return { valid: true };
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGUtcGF0aC5hY3Rpb24tWElTTWVmUEMuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC9tb2R1bGVzL2JhY2t1cC92YWxpZGF0ZS1wYXRoLmFjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyByZXNvbHZlLCBub3JtYWxpemUgfSBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSAnbm9kZTpvcyc7XHJcbmltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcclxuXHJcbnR5cGUgUGFyYW1zID0ge1xyXG4gIHBhdGg6IHN0cmluZztcclxufTtcclxuXHJcbnR5cGUgUmVzdWx0ID0ge1xyXG4gIHZhbGlkOiBib29sZWFuO1xyXG59O1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoY29udGV4dDogTWlsa2lvQ29udGV4dCwgcGFyYW1zOiBQYXJhbXMpOiBQcm9taXNlPFJlc3VsdD4ge1xyXG4gIGNvbnRleHQubG9nZ2VyLmluZm8oJ+err+eCueivt+axguWPguaVsCAodmFsaWRhdGUtcGF0aC5hY3Rpb24udHMpJywgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XHJcblxyXG4gIGNvbnN0IGFic1BhdGggPSByZXNvbHZlKHBhcmFtcy5wYXRoKTtcclxuICBjb25zdCBob21lID0gaG9tZWRpcigpO1xyXG4gIGNvbnN0IHBsYXRmb3JtID0gcHJvY2Vzcy5wbGF0Zm9ybTtcclxuXHJcbiAgbGV0IGFsbG93ZWQgPSBmYWxzZTtcclxuXHJcbiAgaWYgKHBsYXRmb3JtID09PSAnd2luMzInKSB7XHJcbiAgICAvLyBXaW5kb3dzOiBDIOebmOWPquWFgeiuuCBob21lIOebruW9leWGhe+8m+WFtuS7luebmOaXoOmZkOWItlxyXG4gICAgY29uc3QgaG9tZU5vcm0gPSBub3JtYWxpemUoaG9tZSkudG9Mb3dlckNhc2UoKTtcclxuICAgIGNvbnN0IHBhdGhOb3JtID0gbm9ybWFsaXplKGFic1BhdGgpLnRvTG93ZXJDYXNlKCk7XHJcbiAgICBpZiAocGF0aE5vcm0uc3RhcnRzV2l0aChob21lTm9ybSArICdcXFxcJykgfHwgcGF0aE5vcm0gPT09IGhvbWVOb3JtKSB7XHJcbiAgICAgIGFsbG93ZWQgPSB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICghcGF0aE5vcm0uc3RhcnRzV2l0aCgnYzpcXFxcJykpIHtcclxuICAgICAgYWxsb3dlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSBlbHNlIGlmIChwbGF0Zm9ybSA9PT0gJ2xpbnV4Jykge1xyXG4gICAgLy8gTGludXg6IGhvbWUg55uu5b2V5YaFIOaIliAvbW50LyDlrZDnm67lvZXvvIjkuI3og73nm7TmjqXlpIfku70gL21udO+8iVxyXG4gICAgY29uc3QgaG9tZU5vcm0gPSBub3JtYWxpemUoaG9tZSk7XHJcbiAgICBjb25zdCBwYXRoTm9ybSA9IG5vcm1hbGl6ZShhYnNQYXRoKTtcclxuICAgIGlmIChwYXRoTm9ybS5zdGFydHNXaXRoKGhvbWVOb3JtICsgJy8nKSB8fCBwYXRoTm9ybSA9PT0gaG9tZU5vcm0pIHtcclxuICAgICAgYWxsb3dlZCA9IHRydWU7XHJcbiAgICB9IGVsc2UgaWYgKHBhdGhOb3JtLnN0YXJ0c1dpdGgoJy9tbnQvJykgJiYgcGF0aE5vcm0gIT09ICcvbW50Jykge1xyXG4gICAgICBhbGxvd2VkID0gdHJ1ZTtcclxuICAgIH1cclxuICB9IGVsc2UgaWYgKHBsYXRmb3JtID09PSAnZGFyd2luJykge1xyXG4gICAgLy8gbWFjT1M6IGhvbWUg55uu5b2V5YaFIOaIliAvVm9sdW1lcy8g5a2Q55uu5b2V77yI5LiN6IO955u05o6l5aSH5Lu9IC9Wb2x1bWVz77yJXHJcbiAgICBjb25zdCBob21lTm9ybSA9IG5vcm1hbGl6ZShob21lKTtcclxuICAgIGNvbnN0IHBhdGhOb3JtID0gbm9ybWFsaXplKGFic1BhdGgpO1xyXG4gICAgaWYgKHBhdGhOb3JtLnN0YXJ0c1dpdGgoaG9tZU5vcm0gKyAnLycpIHx8IHBhdGhOb3JtID09PSBob21lTm9ybSkge1xyXG4gICAgICBhbGxvd2VkID0gdHJ1ZTtcclxuICAgIH0gZWxzZSBpZiAocGF0aE5vcm0uc3RhcnRzV2l0aCgnL1ZvbHVtZXMvJykgJiYgcGF0aE5vcm0gIT09ICcvVm9sdW1lcycpIHtcclxuICAgICAgYWxsb3dlZCA9IHRydWU7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIOacquefpeW5s+WPsO+8jOm7mOiupOWFgeiuuFxyXG4gICAgYWxsb3dlZCA9IHRydWU7XHJcbiAgfVxyXG5cclxuICBpZiAoIWFsbG93ZWQpIHtcclxuICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdCQUNLVVBfUEFUSF9OT1RfQUxMT1dFRCcsIHsgcGF0aDogYWJzUGF0aCB9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiB7IHZhbGlkOiB0cnVlIH07XHJcbn1cclxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSU8sTUFBTSxPQUFtQixDQUFBO0FBVWhDLGVBQXNCLFFBQVEsU0FBd0IsUUFBaUM7QUFDckYsVUFBUSxPQUFPLEtBQUssb0NBQW9DLEtBQUssVUFBVSxNQUFNLENBQUM7QUFFOUUsUUFBTSxVQUFVLFFBQVEsT0FBTyxJQUFJO0FBQ25DLFFBQU0sT0FBTyxRQUFBO0FBQ2IsUUFBTSxXQUFXLFFBQVE7QUFFekIsTUFBSSxVQUFVO0FBRWQsTUFBSSxhQUFhLFNBQVM7QUFFeEIsVUFBTSxXQUFXLFVBQVUsSUFBSSxFQUFFLFlBQUE7QUFDakMsVUFBTSxXQUFXLFVBQVUsT0FBTyxFQUFFLFlBQUE7QUFDcEMsUUFBSSxTQUFTLFdBQVcsV0FBVyxJQUFJLEtBQUssYUFBYSxVQUFVO0FBQ2pFLGdCQUFVO0FBQUEsSUFDWixXQUFXLENBQUMsU0FBUyxXQUFXLE1BQU0sR0FBRztBQUN2QyxnQkFBVTtBQUFBLElBQ1o7QUFBQSxFQUNGLFdBQVcsYUFBYSxTQUFTO0FBRS9CLFVBQU0sV0FBVyxVQUFVLElBQUk7QUFDL0IsVUFBTSxXQUFXLFVBQVUsT0FBTztBQUNsQyxRQUFJLFNBQVMsV0FBVyxXQUFXLEdBQUcsS0FBSyxhQUFhLFVBQVU7QUFDaEUsZ0JBQVU7QUFBQSxJQUNaLFdBQVcsU0FBUyxXQUFXLE9BQU8sS0FBSyxhQUFhLFFBQVE7QUFDOUQsZ0JBQVU7QUFBQSxJQUNaO0FBQUEsRUFDRixXQUFXLGFBQWEsVUFBVTtBQUVoQyxVQUFNLFdBQVcsVUFBVSxJQUFJO0FBQy9CLFVBQU0sV0FBVyxVQUFVLE9BQU87QUFDbEMsUUFBSSxTQUFTLFdBQVcsV0FBVyxHQUFHLEtBQUssYUFBYSxVQUFVO0FBQ2hFLGdCQUFVO0FBQUEsSUFDWixXQUFXLFNBQVMsV0FBVyxXQUFXLEtBQUssYUFBYSxZQUFZO0FBQ3RFLGdCQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0YsT0FBTztBQUVMLGNBQVU7QUFBQSxFQUNaO0FBRUEsTUFBSSxDQUFDLFNBQVM7QUFDWixVQUFNLFFBQVEsT0FBTywyQkFBMkIsRUFBRSxNQUFNLFNBQVM7QUFBQSxFQUNuRTtBQUVBLFNBQU8sRUFBRSxPQUFPLEtBQUE7QUFDbEI7In0=
