import { execFile } from "node:child_process";
import { access } from "node:fs/promises";
import { join, resolve, parse } from "node:path";
import { u as useElectronStates } from "../index.js";
import "node:http";
import "fs/promises";
import "path";
import "fs";
import "url";
import "node:crypto";
import "node:process";
function runCommandWithOutput(file, args, options) {
  return new Promise((resolve2, reject) => {
    execFile(file, args, { ...options, encoding: "utf-8" }, (error, stdout) => {
      if (error) reject(error);
      else resolve2(stdout);
    });
  });
}
const meta = {};
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
function formatDate(date, time) {
  const [y, m, d] = date.split("-");
  return `${y}年${m}月${d}日 ${time}`;
}
async function handler(context, params) {
  context.logger.info("端点请求参数 (list-versions.action.ts)", JSON.stringify(params));
  const backupDir = getBackupDir(params.backupId, params.sourcePath);
  const archivePath = join(backupDir, "backup.zpaq");
  if (!await exists(archivePath)) {
    context.logger.info("本地归档文件不存在 (list-versions.action.ts)", archivePath);
    return { versions: [], totalCount: 0, filterOptions: { years: [], months: [], days: [] } };
  }
  const electronStates = await useElectronStates();
  const exePath = electronStates.states.zpaqfranzExePath;
  if (!await exists(exePath)) {
    context.logger.error("zpaqfranz.exe 不存在 (list-versions.action.ts)", exePath);
    throw context.reject("BACKUP_ZPAQFRANZ_FAILED", { exePath });
  }
  let output;
  try {
    output = await runCommandWithOutput(exePath, ["i", archivePath]);
  } catch (e) {
    context.logger.error("zpaqfranz 列出版本失败 (list-versions.action.ts)", JSON.stringify(e));
    throw context.reject("BACKUP_ZPAQFRANZ_FAILED", { error: JSON.stringify(e) });
  }
  const allVersions = [];
  const lines = output.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*V(\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(:\d{2})?)/);
    if (match) {
      allVersions.push({
        version: parseInt(match[1], 10),
        date: formatDate(match[2], match[3])
      });
    }
  }
  const totalCount = allVersions.length;
  const yearSet = /* @__PURE__ */ new Set();
  const monthSet = /* @__PURE__ */ new Set();
  const daySet = /* @__PURE__ */ new Set();
  for (const v of allVersions) {
    const y = v.date.slice(0, 4);
    const m = v.date.slice(5, 7);
    const d = v.date.slice(8, 10);
    yearSet.add(y);
    if (!params.year || params.year === y) {
      monthSet.add(m);
      if (!params.month || params.month === m) {
        daySet.add(d);
      }
    }
  }
  const filterOptions = {
    years: [...yearSet].sort(),
    months: [...monthSet].sort(),
    days: [...daySet].sort()
  };
  let versions = allVersions;
  if (params.year || params.month || params.day) {
    versions = allVersions.filter((v) => {
      const y = v.date.slice(0, 4);
      const m = v.date.slice(5, 7);
      const d = v.date.slice(8, 10);
      if (params.year && y !== params.year) return false;
      if (params.month && m !== params.month) return false;
      if (params.day && d !== params.day) return false;
      return true;
    });
  }
  context.logger.info("端点请求结果 (list-versions.action.ts)", JSON.stringify({ total: totalCount, filtered: versions.length }));
  return { versions, totalCount, filterOptions };
}
export {
  handler,
  meta
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC12ZXJzaW9ucy5hY3Rpb24tQkUyMXJEVFUuanMiLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC9tb2R1bGVzL2JhY2t1cC9saXN0LXZlcnNpb25zLmFjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjRmlsZSwgdHlwZSBFeGVjRmlsZU9wdGlvbnMgfSBmcm9tICdub2RlOmNoaWxkX3Byb2Nlc3MnO1xyXG5pbXBvcnQgeyBhY2Nlc3MgfSBmcm9tICdub2RlOmZzL3Byb21pc2VzJztcclxuaW1wb3J0IHsgcmVzb2x2ZSwgam9pbiwgcGFyc2UgfSBmcm9tICdub2RlOnBhdGgnO1xyXG5pbXBvcnQgdHlwZSB7IE1pbGtpb0NvbnRleHQsIE1pbGtpb01ldGEgfSBmcm9tICcuLi8uLi8uLi8ubWlsa2lvL2RlY2xhcmVzLnRzJztcclxuaW1wb3J0IHsgdXNlRWxlY3Ryb25TdGF0ZXMgfSBmcm9tICcuLi8uLi91dGlscy9lbGVjdHJvbi1zdGF0ZXMudHMnO1xyXG5cclxuZnVuY3Rpb24gcnVuQ29tbWFuZFdpdGhPdXRwdXQoZmlsZTogc3RyaW5nLCBhcmdzOiBzdHJpbmdbXSwgb3B0aW9ucz86IEV4ZWNGaWxlT3B0aW9ucyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGV4ZWNGaWxlKGZpbGUsIGFyZ3MsIHsgLi4ub3B0aW9ucywgZW5jb2Rpbmc6ICd1dGYtOCcgfSwgKGVycm9yLCBzdGRvdXQpID0+IHtcclxuICAgICAgaWYgKGVycm9yKSByZWplY3QoZXJyb3IpO1xyXG4gICAgICBlbHNlIHJlc29sdmUoc3Rkb3V0KTtcclxuICAgIH0pO1xyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgbWV0YTogTWlsa2lvTWV0YSA9IHt9O1xyXG5cclxudHlwZSBWZXJzaW9uSXRlbSA9IHtcclxuICB2ZXJzaW9uOiBudW1iZXI7XHJcbiAgZGF0ZTogc3RyaW5nO1xyXG59O1xyXG5cclxudHlwZSBGaWx0ZXJPcHRpb25zID0ge1xyXG4gIHllYXJzOiBzdHJpbmdbXTtcclxuICBtb250aHM6IHN0cmluZ1tdO1xyXG4gIGRheXM6IHN0cmluZ1tdO1xyXG59O1xyXG5cclxudHlwZSBQYXJhbXMgPSB7XHJcbiAgYmFja3VwSWQ6IHN0cmluZztcclxuICBzb3VyY2VQYXRoOiBzdHJpbmc7XHJcbiAgeWVhcj86IHN0cmluZztcclxuICBtb250aD86IHN0cmluZztcclxuICBkYXk/OiBzdHJpbmc7XHJcbn07XHJcblxyXG50eXBlIFJlc3VsdCA9IHtcclxuICB2ZXJzaW9uczogVmVyc2lvbkl0ZW1bXTtcclxuICB0b3RhbENvdW50OiBudW1iZXI7XHJcbiAgZmlsdGVyT3B0aW9uczogRmlsdGVyT3B0aW9ucztcclxufTtcclxuXHJcbmZ1bmN0aW9uIGdldEJhY2t1cERpcihiYWNrdXBJZDogc3RyaW5nLCBzb3VyY2VQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gIGNvbnN0IGFic1NvdXJjZSA9IHJlc29sdmUoc291cmNlUGF0aCk7XHJcbiAgY29uc3Qgcm9vdERpciA9IHBhcnNlKGFic1NvdXJjZSkucm9vdDtcclxuICByZXR1cm4gam9pbihyb290RGlyLCAnLnJhYmJpeCcsICdiYWNrdXBzJywgYmFja3VwSWQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBleGlzdHMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGFjY2VzcyhwYXRoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlOiBzdHJpbmcsIHRpbWU6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgW3ksIG0sIGRdID0gZGF0ZS5zcGxpdCgnLScpO1xyXG4gIHJldHVybiBgJHt5feW5tCR7bX3mnIgke2R95pelICR7dGltZX1gO1xyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihjb250ZXh0OiBNaWxraW9Db250ZXh0LCBwYXJhbXM6IFBhcmFtcyk6IFByb21pc2U8UmVzdWx0PiB7XHJcbiAgY29udGV4dC5sb2dnZXIuaW5mbygn56uv54K56K+35rGC5Y+C5pWwIChsaXN0LXZlcnNpb25zLmFjdGlvbi50cyknLCBKU09OLnN0cmluZ2lmeShwYXJhbXMpKTtcclxuXHJcbiAgY29uc3QgYmFja3VwRGlyID0gZ2V0QmFja3VwRGlyKHBhcmFtcy5iYWNrdXBJZCwgcGFyYW1zLnNvdXJjZVBhdGgpO1xyXG4gIGNvbnN0IGFyY2hpdmVQYXRoID0gam9pbihiYWNrdXBEaXIsICdiYWNrdXAuenBhcScpO1xyXG5cclxuICBpZiAoIShhd2FpdCBleGlzdHMoYXJjaGl2ZVBhdGgpKSkge1xyXG4gICAgY29udGV4dC5sb2dnZXIuaW5mbygn5pys5Zyw5b2S5qGj5paH5Lu25LiN5a2Y5ZyoIChsaXN0LXZlcnNpb25zLmFjdGlvbi50cyknLCBhcmNoaXZlUGF0aCk7XHJcbiAgICByZXR1cm4geyB2ZXJzaW9uczogW10sIHRvdGFsQ291bnQ6IDAsIGZpbHRlck9wdGlvbnM6IHsgeWVhcnM6IFtdLCBtb250aHM6IFtdLCBkYXlzOiBbXSB9IH07XHJcbiAgfVxyXG5cclxuICBjb25zdCBlbGVjdHJvblN0YXRlcyA9IGF3YWl0IHVzZUVsZWN0cm9uU3RhdGVzKCk7XHJcbiAgY29uc3QgZXhlUGF0aCA9IGVsZWN0cm9uU3RhdGVzLnN0YXRlcy56cGFxZnJhbnpFeGVQYXRoO1xyXG4gIGlmICghKGF3YWl0IGV4aXN0cyhleGVQYXRoKSkpIHtcclxuICAgIGNvbnRleHQubG9nZ2VyLmVycm9yKCd6cGFxZnJhbnouZXhlIOS4jeWtmOWcqCAobGlzdC12ZXJzaW9ucy5hY3Rpb24udHMpJywgZXhlUGF0aCk7XHJcbiAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnQkFDS1VQX1pQQVFGUkFOWl9GQUlMRUQnLCB7IGV4ZVBhdGggfSk7XHJcbiAgfVxyXG5cclxuICBsZXQgb3V0cHV0OiBzdHJpbmc7XHJcbiAgdHJ5IHtcclxuICAgIG91dHB1dCA9IGF3YWl0IHJ1bkNvbW1hbmRXaXRoT3V0cHV0KGV4ZVBhdGgsIFsnaScsIGFyY2hpdmVQYXRoXSk7XHJcbiAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICBjb250ZXh0LmxvZ2dlci5lcnJvcignenBhcWZyYW56IOWIl+WHuueJiOacrOWksei0pSAobGlzdC12ZXJzaW9ucy5hY3Rpb24udHMpJywgSlNPTi5zdHJpbmdpZnkoZSkpO1xyXG4gICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ0JBQ0tVUF9aUEFRRlJBTlpfRkFJTEVEJywgeyBlcnJvcjogSlNPTi5zdHJpbmdpZnkoZSkgfSk7XHJcbiAgfVxyXG5cclxuICBjb25zdCBhbGxWZXJzaW9uczogVmVyc2lvbkl0ZW1bXSA9IFtdO1xyXG4gIGNvbnN0IGxpbmVzID0gb3V0cHV0LnNwbGl0KCdcXG4nKTtcclxuICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgIGNvbnN0IG1hdGNoID0gbGluZS5tYXRjaCgvXlxccypWKFxcZCspXFxzKyhcXGR7NH0tXFxkezJ9LVxcZHsyfSlcXHMrKFxcZHsyfTpcXGR7Mn0oOlxcZHsyfSk/KS8pO1xyXG4gICAgaWYgKG1hdGNoKSB7XHJcbiAgICAgIGFsbFZlcnNpb25zLnB1c2goe1xyXG4gICAgICAgIHZlcnNpb246IHBhcnNlSW50KG1hdGNoWzFdISwgMTApLFxyXG4gICAgICAgIGRhdGU6IGZvcm1hdERhdGUobWF0Y2hbMl0hLCBtYXRjaFszXSEpLFxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IHRvdGFsQ291bnQgPSBhbGxWZXJzaW9ucy5sZW5ndGg7XHJcblxyXG4gIGNvbnN0IHllYXJTZXQgPSBuZXcgU2V0PHN0cmluZz4oKTtcclxuICBjb25zdCBtb250aFNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gIGNvbnN0IGRheVNldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG5cclxuICBmb3IgKGNvbnN0IHYgb2YgYWxsVmVyc2lvbnMpIHtcclxuICAgIGNvbnN0IHkgPSB2LmRhdGUuc2xpY2UoMCwgNCk7XHJcbiAgICBjb25zdCBtID0gdi5kYXRlLnNsaWNlKDUsIDcpO1xyXG4gICAgY29uc3QgZCA9IHYuZGF0ZS5zbGljZSg4LCAxMCk7XHJcbiAgICB5ZWFyU2V0LmFkZCh5KTtcclxuICAgIGlmICghcGFyYW1zLnllYXIgfHwgcGFyYW1zLnllYXIgPT09IHkpIHtcclxuICAgICAgbW9udGhTZXQuYWRkKG0pO1xyXG4gICAgICBpZiAoIXBhcmFtcy5tb250aCB8fCBwYXJhbXMubW9udGggPT09IG0pIHtcclxuICAgICAgICBkYXlTZXQuYWRkKGQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjb25zdCBmaWx0ZXJPcHRpb25zOiBGaWx0ZXJPcHRpb25zID0ge1xyXG4gICAgeWVhcnM6IFsuLi55ZWFyU2V0XS5zb3J0KCksXHJcbiAgICBtb250aHM6IFsuLi5tb250aFNldF0uc29ydCgpLFxyXG4gICAgZGF5czogWy4uLmRheVNldF0uc29ydCgpLFxyXG4gIH07XHJcblxyXG4gIGxldCB2ZXJzaW9ucyA9IGFsbFZlcnNpb25zO1xyXG4gIGlmIChwYXJhbXMueWVhciB8fCBwYXJhbXMubW9udGggfHwgcGFyYW1zLmRheSkge1xyXG4gICAgdmVyc2lvbnMgPSBhbGxWZXJzaW9ucy5maWx0ZXIoKHYpID0+IHtcclxuICAgICAgY29uc3QgeSA9IHYuZGF0ZS5zbGljZSgwLCA0KTtcclxuICAgICAgY29uc3QgbSA9IHYuZGF0ZS5zbGljZSg1LCA3KTtcclxuICAgICAgY29uc3QgZCA9IHYuZGF0ZS5zbGljZSg4LCAxMCk7XHJcbiAgICAgIGlmIChwYXJhbXMueWVhciAmJiB5ICE9PSBwYXJhbXMueWVhcikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBpZiAocGFyYW1zLm1vbnRoICYmIG0gIT09IHBhcmFtcy5tb250aCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICBpZiAocGFyYW1zLmRheSAmJiBkICE9PSBwYXJhbXMuZGF5KSByZXR1cm4gZmFsc2U7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBjb250ZXh0LmxvZ2dlci5pbmZvKCfnq6/ngrnor7fmsYLnu5PmnpwgKGxpc3QtdmVyc2lvbnMuYWN0aW9uLnRzKScsIEpTT04uc3RyaW5naWZ5KHsgdG90YWw6IHRvdGFsQ291bnQsIGZpbHRlcmVkOiB2ZXJzaW9ucy5sZW5ndGggfSkpO1xyXG4gIHJldHVybiB7IHZlcnNpb25zLCB0b3RhbENvdW50LCBmaWx0ZXJPcHRpb25zIH07XHJcbn1cclxuIl0sIm5hbWVzIjpbInJlc29sdmUiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBTUEsU0FBUyxxQkFBcUIsTUFBYyxNQUFnQixTQUE0QztBQUN0RyxTQUFPLElBQUksUUFBUSxDQUFDQSxVQUFTLFdBQVc7QUFDdEMsYUFBUyxNQUFNLE1BQU0sRUFBRSxHQUFHLFNBQVMsVUFBVSxRQUFBLEdBQVcsQ0FBQyxPQUFPLFdBQVc7QUFDekUsVUFBSSxjQUFjLEtBQUs7QUFBQSxVQUNsQkEsVUFBUSxNQUFNO0FBQUEsSUFDckIsQ0FBQztBQUFBLEVBQ0gsQ0FBQztBQUNIO0FBRU8sTUFBTSxPQUFtQixDQUFBO0FBMkJoQyxTQUFTLGFBQWEsVUFBa0IsWUFBNEI7QUFDbEUsUUFBTSxZQUFZLFFBQVEsVUFBVTtBQUNwQyxRQUFNLFVBQVUsTUFBTSxTQUFTLEVBQUU7QUFDakMsU0FBTyxLQUFLLFNBQVMsV0FBVyxXQUFXLFFBQVE7QUFDckQ7QUFFQSxlQUFlLE9BQU8sTUFBZ0M7QUFDcEQsTUFBSTtBQUNGLFVBQU0sT0FBTyxJQUFJO0FBQ2pCLFdBQU87QUFBQSxFQUNULFFBQVE7QUFDTixXQUFPO0FBQUEsRUFDVDtBQUNGO0FBRUEsU0FBUyxXQUFXLE1BQWMsTUFBc0I7QUFDdEQsUUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLElB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
