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
  webview.hide();
  return {};
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvc2UuYWN0aW9uLUNONUNrQkVjLmpzIiwic291cmNlcyI6WyIuLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvY2xvc2UuYWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuaW1wb3J0IHsgZ2V0V2Vidmlld1dpbmRvdyB9IGZyb20gJy4uLy4uL3V0aWxzL2VsZWN0cm9uLnRzJztcblxuZXhwb3J0IGNvbnN0IG1ldGE6IE1pbGtpb01ldGEgPSB7fTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoY29udGV4dDogTWlsa2lvQ29udGV4dCwgcGFyYW1zOiB7fSkge1xuICBjb25zdCB3ZWJ2aWV3ID0gYXdhaXQgZ2V0V2Vidmlld1dpbmRvdygpO1xuICB3ZWJ2aWV3LmhpZGUoKTtcblxuICByZXR1cm4ge307XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUdPLE1BQU0sT0FBbUIsQ0FBQTtBQUVoQyxlQUFzQixRQUFRLFNBQXdCLFFBQVk7QUFDaEUsUUFBTSxVQUFVLE1BQU0saUJBQUE7QUFDdEIsVUFBUSxLQUFBO0FBRVIsU0FBTyxDQUFBO0FBQ1Q7In0=
