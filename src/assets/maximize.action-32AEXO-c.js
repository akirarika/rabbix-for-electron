import { g as getWebview } from "../index.js";
import "node:http";
import "fs";
import "path";
import "url";
import "node:process";
const meta = {};
async function handler(context, params) {
  const webview = await getWebview();
  if (webview.isMaximized()) {
    webview.unmaximize();
  } else {
    webview.maximize();
  }
  return {};
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF4aW1pemUuYWN0aW9uLTMyQUVYTy1jLmpzIiwic291cmNlcyI6WyIuLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWF4aW1pemUuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgZ2V0V2VidmlldyB9IGZyb20gJy4uLy4uL3V0aWxzL2VsZWN0cm9uLnRzJztcblxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoY29udGV4dDogTWlsa2lvQ29udGV4dCwgcGFyYW1zOiB7fSkge1xuICBjb25zdCB3ZWJ2aWV3ID0gYXdhaXQgZ2V0V2VidmlldygpO1xuICBpZiAod2Vidmlldy5pc01heGltaXplZCgpKSB7XG4gICAgd2Vidmlldy51bm1heGltaXplKCk7XG4gIH0gZWxzZSB7XG4gICAgd2Vidmlldy5tYXhpbWl6ZSgpO1xuICB9XG5cbiAgcmV0dXJuIHt9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUdPLE1BQU0sT0FBbUIsQ0FBQTtBQUVoQyxlQUFzQixRQUFRLFNBQXdCLFFBQVk7QUFDaEUsUUFBTSxVQUFVLE1BQU0sV0FBQTtBQUN0QixNQUFJLFFBQVEsZUFBZTtBQUN6QixZQUFRLFdBQUE7QUFBQSxFQUNWLE9BQU87QUFDTCxZQUFRLFNBQUE7QUFBQSxFQUNWO0FBRUEsU0FBTyxDQUFBO0FBQ1Q7In0=
