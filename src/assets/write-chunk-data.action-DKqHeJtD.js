import { mkdir, writeFile, access } from "node:fs/promises";
import { join, resolve, parse } from "node:path";
const meta = {
  methods: ["POST"],
  typeSafety: false
};
function getBackupDir(backupId, sourcePath) {
  const absSource = resolve(sourcePath);
  const rootDir = parse(absSource).root;
  return join(rootDir, ".rabbix", "backups", backupId);
}
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function handler(context, params) {
  let backupId = params.backupId;
  let sourcePath = params.sourcePath;
  let chunkIndex = params.chunkIndex;
  if (!backupId || chunkIndex === void 0 || !sourcePath) {
    const url = new URL(context.http.request.url);
    backupId = url.searchParams.get("backupId") ?? void 0;
    sourcePath = url.searchParams.get("sourcePath") ?? void 0;
    chunkIndex = url.searchParams.get("chunkIndex") !== null ? Number(url.searchParams.get("chunkIndex")) : void 0;
  }
  if (!backupId || chunkIndex === void 0 || !sourcePath) {
    context.logger.error("缺少 backupId、sourcePath 或 chunkIndex (write-chunk-data.action.ts)");
    throw context.reject("BACKUP_READ_FILE_NOT_FOUND", void 0);
  }
  context.logger.info("端点请求参数 (write-chunk-data.action.ts)", `backupId=${backupId}, chunkIndex=${chunkIndex}, hasData=${params.data !== void 0}`);
  const backupDir = getBackupDir(backupId, sourcePath);
  if (!await exists(backupDir)) {
    await mkdir(backupDir, { recursive: true });
  }
  let data;
  if (params.data) {
    data = Buffer.from(params.data, "base64");
  } else {
    const body = context.http.request.body;
    if (Buffer.isBuffer(body)) {
      data = body;
    } else if (ArrayBuffer.isView(body)) {
      data = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
    } else if (body instanceof ArrayBuffer) {
      data = Buffer.from(body);
    } else if (body instanceof Uint8Array) {
      data = Buffer.from(body);
    } else {
      if (body && typeof body === "object" && typeof body.getReader === "function") {
        const reader = body.getReader();
        const chunks = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        data = Buffer.concat(chunks);
      } else if (typeof body === "string") {
        data = Buffer.from(body, "binary");
      } else {
        context.logger.error("无法解析请求体 (write-chunk-data.action.ts)", `type=${typeof body}`);
        throw context.reject("BACKUP_READ_FILE_FAILED", void 0);
      }
    }
  }
  const chunkFileName = `chunk-${chunkIndex}.dat`;
  const chunkFilePath = join(backupDir, chunkFileName);
  await writeFile(chunkFilePath, data);
  const result = { filePath: chunkFilePath, size: data.length };
  context.logger.info("端点请求结果 (write-chunk-data.action.ts)", `chunkFileName=${chunkFileName}, size=${data.length}`);
  return result;
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JpdGUtY2h1bmstZGF0YS5hY3Rpb24tREtxSGVKdEQuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC9tb2R1bGVzL2JhY2t1cC93cml0ZS1jaHVuay1kYXRhLmFjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBhY2Nlc3MsIG1rZGlyLCB3cml0ZUZpbGUgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcbmltcG9ydCB7IHJlc29sdmUsIGpvaW4sIHBhcnNlIH0gZnJvbSAnbm9kZTpwYXRoJztcbmltcG9ydCB0eXBlIHsgTWlsa2lvQ29udGV4dCwgTWlsa2lvTWV0YSB9IGZyb20gJy4uLy4uLy4uLy5taWxraW8vZGVjbGFyZXMudHMnO1xuXG5leHBvcnQgY29uc3QgbWV0YTogTWlsa2lvTWV0YSA9IHtcbiAgbWV0aG9kczogWydQT1NUJ10sXG4gIHR5cGVTYWZldHk6IGZhbHNlLFxufTtcblxudHlwZSBQYXJhbXMgPSB7XG4gIGJhY2t1cElkPzogc3RyaW5nO1xuICBzb3VyY2VQYXRoPzogc3RyaW5nO1xuICBjaHVua0luZGV4PzogbnVtYmVyO1xuICBkYXRhPzogYW55OyAvLyBiYXNlNjRcbn07XG5cbnR5cGUgUmVzdWx0ID0ge1xuICBmaWxlUGF0aDogc3RyaW5nO1xuICBzaXplOiBudW1iZXI7XG59O1xuXG5mdW5jdGlvbiBnZXRCYWNrdXBEaXIoYmFja3VwSWQ6IHN0cmluZywgc291cmNlUGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgYWJzU291cmNlID0gcmVzb2x2ZShzb3VyY2VQYXRoKTtcbiAgY29uc3Qgcm9vdERpciA9IHBhcnNlKGFic1NvdXJjZSkucm9vdDtcbiAgcmV0dXJuIGpvaW4ocm9vdERpciwgJy5yYWJiaXgnLCAnYmFja3VwcycsIGJhY2t1cElkKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhpc3RzKHBhdGg6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGF3YWl0IGFjY2VzcyhwYXRoKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGNvbnRleHQ6IE1pbGtpb0NvbnRleHQsIHBhcmFtczogUGFyYW1zKTogUHJvbWlzZTxSZXN1bHQ+IHtcbiAgbGV0IGJhY2t1cElkID0gcGFyYW1zLmJhY2t1cElkO1xuICBsZXQgc291cmNlUGF0aCA9IHBhcmFtcy5zb3VyY2VQYXRoO1xuICBsZXQgY2h1bmtJbmRleCA9IHBhcmFtcy5jaHVua0luZGV4O1xuXG4gIGlmICghYmFja3VwSWQgfHwgY2h1bmtJbmRleCA9PT0gdW5kZWZpbmVkIHx8ICFzb3VyY2VQYXRoKSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChjb250ZXh0Lmh0dHAucmVxdWVzdC51cmwpO1xuICAgIGJhY2t1cElkID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2JhY2t1cElkJykgPz8gdW5kZWZpbmVkO1xuICAgIHNvdXJjZVBhdGggPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnc291cmNlUGF0aCcpID8/IHVuZGVmaW5lZDtcbiAgICBjaHVua0luZGV4ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2NodW5rSW5kZXgnKSAhPT0gbnVsbCA/IE51bWJlcih1cmwuc2VhcmNoUGFyYW1zLmdldCgnY2h1bmtJbmRleCcpKSA6IHVuZGVmaW5lZDtcbiAgfVxuXG4gIGlmICghYmFja3VwSWQgfHwgY2h1bmtJbmRleCA9PT0gdW5kZWZpbmVkIHx8ICFzb3VyY2VQYXRoKSB7XG4gICAgY29udGV4dC5sb2dnZXIuZXJyb3IoJ+e8uuWwkSBiYWNrdXBJZOOAgXNvdXJjZVBhdGgg5oiWIGNodW5rSW5kZXggKHdyaXRlLWNodW5rLWRhdGEuYWN0aW9uLnRzKScpO1xuICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdCQUNLVVBfUkVBRF9GSUxFX05PVF9GT1VORCcsIHVuZGVmaW5lZCk7XG4gIH1cblxuICBjb250ZXh0LmxvZ2dlci5pbmZvKCfnq6/ngrnor7fmsYLlj4LmlbAgKHdyaXRlLWNodW5rLWRhdGEuYWN0aW9uLnRzKScsIGBiYWNrdXBJZD0ke2JhY2t1cElkfSwgY2h1bmtJbmRleD0ke2NodW5rSW5kZXh9LCBoYXNEYXRhPSR7cGFyYW1zLmRhdGEgIT09IHVuZGVmaW5lZH1gKTtcblxuICBjb25zdCBiYWNrdXBEaXIgPSBnZXRCYWNrdXBEaXIoYmFja3VwSWQsIHNvdXJjZVBhdGgpO1xuICBpZiAoIShhd2FpdCBleGlzdHMoYmFja3VwRGlyKSkpIHtcbiAgICBhd2FpdCBta2RpcihiYWNrdXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9XG5cbiAgbGV0IGRhdGE6IEJ1ZmZlcjtcblxuICBpZiAocGFyYW1zLmRhdGEpIHtcbiAgICBkYXRhID0gQnVmZmVyLmZyb20ocGFyYW1zLmRhdGEsICdiYXNlNjQnKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBib2R5ID0gY29udGV4dC5odHRwLnJlcXVlc3QuYm9keTtcbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKGJvZHkpKSB7XG4gICAgICBkYXRhID0gYm9keTtcbiAgICB9IGVsc2UgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhib2R5KSkge1xuICAgICAgZGF0YSA9IEJ1ZmZlci5mcm9tKGJvZHkuYnVmZmVyLCBib2R5LmJ5dGVPZmZzZXQsIGJvZHkuYnl0ZUxlbmd0aCk7XG4gICAgfSBlbHNlIGlmIChib2R5IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIGRhdGEgPSBCdWZmZXIuZnJvbShib2R5KTtcbiAgICB9IGVsc2UgaWYgKGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICBkYXRhID0gQnVmZmVyLmZyb20oYm9keSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChib2R5ICYmIHR5cGVvZiBib2R5ID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgKGJvZHkgYXMgYW55KS5nZXRSZWFkZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY29uc3QgcmVhZGVyID0gKGJvZHkgYXMgUmVhZGFibGVTdHJlYW0pLmdldFJlYWRlcigpO1xuICAgICAgICBjb25zdCBjaHVua3M6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICAgICAgaWYgKGRvbmUpIGJyZWFrO1xuICAgICAgICAgIGlmICh2YWx1ZSkgY2h1bmtzLnB1c2godmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEgPSBCdWZmZXIuY29uY2F0KGNodW5rcyk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBkYXRhID0gQnVmZmVyLmZyb20oYm9keSwgJ2JpbmFyeScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29udGV4dC5sb2dnZXIuZXJyb3IoJ+aXoOazleino+aekOivt+axguS9kyAod3JpdGUtY2h1bmstZGF0YS5hY3Rpb24udHMpJywgYHR5cGU9JHt0eXBlb2YgYm9keX1gKTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ0JBQ0tVUF9SRUFEX0ZJTEVfRkFJTEVEJywgdW5kZWZpbmVkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBjaHVua0ZpbGVOYW1lID0gYGNodW5rLSR7Y2h1bmtJbmRleH0uZGF0YDtcbiAgY29uc3QgY2h1bmtGaWxlUGF0aCA9IGpvaW4oYmFja3VwRGlyLCBjaHVua0ZpbGVOYW1lKTtcbiAgYXdhaXQgd3JpdGVGaWxlKGNodW5rRmlsZVBhdGgsIGRhdGEpO1xuXG4gIGNvbnN0IHJlc3VsdCA9IHsgZmlsZVBhdGg6IGNodW5rRmlsZVBhdGgsIHNpemU6IGRhdGEubGVuZ3RoIH07XG4gIGNvbnRleHQubG9nZ2VyLmluZm8oJ+err+eCueivt+axgue7k+aenCAod3JpdGUtY2h1bmstZGF0YS5hY3Rpb24udHMpJywgYGNodW5rRmlsZU5hbWU9JHtjaHVua0ZpbGVOYW1lfSwgc2l6ZT0ke2RhdGEubGVuZ3RofWApO1xuXG4gIHJldHVybiByZXN1bHQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJTyxNQUFNLE9BQW1CO0FBQUEsRUFDOUIsU0FBUyxDQUFDLE1BQU07QUFBQSxFQUNoQixZQUFZO0FBQ2Q7QUFjQSxTQUFTLGFBQWEsVUFBa0IsWUFBNEI7QUFDbEUsUUFBTSxZQUFZLFFBQVEsVUFBVTtBQUNwQyxRQUFNLFVBQVUsTUFBTSxTQUFTLEVBQUU7QUFDakMsU0FBTyxLQUFLLFNBQVMsV0FBVyxXQUFXLFFBQVE7QUFDckQ7QUFFQSxlQUFlLE9BQU8sTUFBZ0M7QUFDcEQsTUFBSTtBQUNGLFVBQU0sT0FBTyxJQUFJO0FBQ2pCLFdBQU87QUFBQSxFQUNULFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsZUFBc0IsUUFBUSxTQUF3QixRQUFpQztBQUNyRixNQUFJLFdBQVcsT0FBTztBQUN0QixNQUFJLGFBQWEsT0FBTztBQUN4QixNQUFJLGFBQWEsT0FBTztBQUV4QixNQUFJLENBQUMsWUFBWSxlQUFlLFVBQWEsQ0FBQyxZQUFZO0FBQ3hELFVBQU0sTUFBTSxJQUFJLElBQUksUUFBUSxLQUFLLFFBQVEsR0FBRztBQUM1QyxlQUFXLElBQUksYUFBYSxJQUFJLFVBQVUsS0FBSztBQUMvQyxpQkFBYSxJQUFJLGFBQWEsSUFBSSxZQUFZLEtBQUs7QUFDbkQsaUJBQWEsSUFBSSxhQUFhLElBQUksWUFBWSxNQUFNLE9BQU8sT0FBTyxJQUFJLGFBQWEsSUFBSSxZQUFZLENBQUMsSUFBSTtBQUFBLEVBQzFHO0FBRUEsTUFBSSxDQUFDLFlBQVksZUFBZSxVQUFhLENBQUMsWUFBWTtBQUN4RCxZQUFRLE9BQU8sTUFBTSxrRUFBa0U7QUFDdkYsVUFBTSxRQUFRLE9BQU8sOEJBQThCLE1BQVM7QUFBQSxFQUM5RDtBQUVBLFVBQVEsT0FBTyxLQUFLLHVDQUF1QyxZQUFZLFFBQVEsZ0JBQWdCLFVBQVUsYUFBYSxPQUFPLFNBQVMsTUFBUyxFQUFFO0FBRWpKLFFBQU0sWUFBWSxhQUFhLFVBQVUsVUFBVTtBQUNuRCxNQUFJLENBQUUsTUFBTSxPQUFPLFNBQVMsR0FBSTtBQUM5QixVQUFNLE1BQU0sV0FBVyxFQUFFLFdBQVcsTUFBTTtBQUFBLEVBQzVDO0FBRUEsTUFBSTtBQUVKLE1BQUksT0FBTyxNQUFNO0FBQ2YsV0FBTyxPQUFPLEtBQUssT0FBTyxNQUFNLFFBQVE7QUFBQSxFQUMxQyxPQUFPO0FBQ0wsVUFBTSxPQUFPLFFBQVEsS0FBSyxRQUFRO0FBQ2xDLFFBQUksT0FBTyxTQUFTLElBQUksR0FBRztBQUN6QixhQUFPO0FBQUEsSUFDVCxXQUFXLFlBQVksT0FBTyxJQUFJLEdBQUc7QUFDbkMsYUFBTyxPQUFPLEtBQUssS0FBSyxRQUFRLEtBQUssWUFBWSxLQUFLLFVBQVU7QUFBQSxJQUNsRSxXQUFXLGdCQUFnQixhQUFhO0FBQ3RDLGFBQU8sT0FBTyxLQUFLLElBQUk7QUFBQSxJQUN6QixXQUFXLGdCQUFnQixZQUFZO0FBQ3JDLGFBQU8sT0FBTyxLQUFLLElBQUk7QUFBQSxJQUN6QixPQUFPO0FBQ0wsVUFBSSxRQUFRLE9BQU8sU0FBUyxZQUFZLE9BQVEsS0FBYSxjQUFjLFlBQVk7QUFDckYsY0FBTSxTQUFVLEtBQXdCLFVBQUE7QUFDeEMsY0FBTSxTQUF1QixDQUFBO0FBQzdCLGVBQU8sTUFBTTtBQUNYLGdCQUFNLEVBQUUsTUFBTSxNQUFBLElBQVUsTUFBTSxPQUFPLEtBQUE7QUFDckMsY0FBSSxLQUFNO0FBQ1YsY0FBSSxNQUFPLFFBQU8sS0FBSyxLQUFLO0FBQUEsUUFDOUI7QUFDQSxlQUFPLE9BQU8sT0FBTyxNQUFNO0FBQUEsTUFDN0IsV0FBVyxPQUFPLFNBQVMsVUFBVTtBQUNuQyxlQUFPLE9BQU8sS0FBSyxNQUFNLFFBQVE7QUFBQSxNQUNuQyxPQUFPO0FBQ0wsZ0JBQVEsT0FBTyxNQUFNLHdDQUF3QyxRQUFRLE9BQU8sSUFBSSxFQUFFO0FBQ2xGLGNBQU0sUUFBUSxPQUFPLDJCQUEyQixNQUFTO0FBQUEsTUFDM0Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUVBLFFBQU0sZ0JBQWdCLFNBQVMsVUFBVTtBQUN6QyxRQUFNLGdCQUFnQixLQUFLLFdBQVcsYUFBYTtBQUNuRCxRQUFNLFVBQVUsZUFBZSxJQUFJO0FBRW5DLFFBQU0sU0FBUyxFQUFFLFVBQVUsZUFBZSxNQUFNLEtBQUssT0FBQTtBQUNyRCxVQUFRLE9BQU8sS0FBSyx1Q0FBdUMsaUJBQWlCLGFBQWEsVUFBVSxLQUFLLE1BQU0sRUFBRTtBQUVoSCxTQUFPO0FBQ1Q7In0=
