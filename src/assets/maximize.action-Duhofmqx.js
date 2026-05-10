import { a as getWebviewWindow } from "../index.js";
import "node:http";
import "fs/promises";
import "path";
import "fs";
import "url";
import "node:process";
const meta = {};
async function handler(context, params) {
  const webview = await getWebviewWindow();
  if (webview.isMaximized()) {
    webview.unmaximize();
  } else {
    webview.maximize();
  }
  return { isMaximized: webview.isMaximized() };
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF4aW1pemUuYWN0aW9uLUR1aG9mbXF4LmpzIiwic291cmNlcyI6WyIuLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWF4aW1pemUuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgZ2V0V2Vidmlld1dpbmRvdyB9IGZyb20gJy4uLy4uL3V0aWxzL2VsZWN0cm9uLnRzJztcblxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoY29udGV4dDogTWlsa2lvQ29udGV4dCwgcGFyYW1zOiB7fSkge1xuICBjb25zdCB3ZWJ2aWV3ID0gYXdhaXQgZ2V0V2Vidmlld1dpbmRvdygpO1xuICBpZiAod2Vidmlldy5pc01heGltaXplZCgpKSB7XG4gICAgd2Vidmlldy51bm1heGltaXplKCk7XG4gIH0gZWxzZSB7XG4gICAgd2Vidmlldy5tYXhpbWl6ZSgpO1xuICB9XG5cbiAgcmV0dXJuIHsgaXNNYXhpbWl6ZWQ6IHdlYnZpZXcuaXNNYXhpbWl6ZWQoKSB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFHTyxNQUFNLE9BQW1CLENBQUE7QUFFaEMsZUFBc0IsUUFBUSxTQUF3QixRQUFZO0FBQ2hFLFFBQU0sVUFBVSxNQUFNLGlCQUFBO0FBQ3RCLE1BQUksUUFBUSxlQUFlO0FBQ3pCLFlBQVEsV0FBQTtBQUFBLEVBQ1YsT0FBTztBQUNMLFlBQVEsU0FBQTtBQUFBLEVBQ1Y7QUFFQSxTQUFPLEVBQUUsYUFBYSxRQUFRLGNBQVk7QUFDNUM7In0=
