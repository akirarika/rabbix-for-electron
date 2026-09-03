import { n as getWebviewWindow, s as __VERSION__, t as getWebviewOrigin } from "../index.js";
//#region app/utils/wallpaper.ts
var wallpaperWindows = /* @__PURE__ */ new Map();
var win32Lib = null;
var kernel32Lib = null;
var dwmLib = null;
var enumWindowsProcProto = null;
async function loadKoffi() {
	const mod = await import("koffi");
	return mod.default ?? mod;
}
async function loadWin32Lib() {
	if (process.platform !== "win32") return null;
	if (!win32Lib) win32Lib = (await loadKoffi()).load("user32.dll");
	return win32Lib;
}
/**
* 从 Buffer 读取 HWND 指针值
* Electron 的 getNativeWindowHandle 在 64 位系统返回 8 字节 Buffer，32 位返回 4 字节
* 统一返回 BigInt 避免精度问题
*/
function readHwnd(buf) {
	if (buf.length <= 4) return BigInt(buf.readUInt32LE(0));
	return buf.readBigUInt64LE(0);
}
/**
* 将值转换为 BigInt（koffi 的 uintptr_t 在 64 位系统返回 number 或 BigInt）
*/
function toBigInt(v) {
	return typeof v === "bigint" ? v : BigInt(v);
}
/**
* 禁用 Win11 DWM 默认圆角，避免壁纸窗口边缘被裁切
*/
async function disableWindowRoundedCorners(hwnd) {
	if (process.platform !== "win32") return;
	try {
		const koffi = await loadKoffi();
		if (!dwmLib) dwmLib = koffi.load("dwmapi.dll");
		const DwmSetWindowAttribute = dwmLib.func("long DwmSetWindowAttribute(uintptr_t hwnd, uint32 attr, void *value, uint32 cbAttribute)");
		const DWMWA_WINDOW_CORNER_PREFERENCE = 33;
		const DWMWCP_DONOTROUND = 1;
		const valueBuf = Buffer.alloc(4);
		valueBuf.writeUInt32LE(DWMWCP_DONOTROUND, 0);
		DwmSetWindowAttribute(hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, valueBuf, 4);
	} catch (e) {
		console.warn("[wallpaper] Failed to disable rounded corners:", e);
	}
}
/**
* 设置窗口为无边框、无圆角、铺满父窗口
* 必须在 SetParent 之后调用，设置 WS_CHILD 等样式
*/
async function setupWindowStyle(hwnd, parentHwnd) {
	if (process.platform !== "win32") return;
	const lib = await loadWin32Lib();
	if (!lib) return;
	const GetWindowLongPtrW = lib.func("intptr_t GetWindowLongPtrW(uintptr_t hWnd, int32 nIndex)");
	const SetWindowLongPtrW = lib.func("intptr_t SetWindowLongPtrW(uintptr_t hWnd, int32 nIndex, intptr_t dwNewLong)");
	const SetWindowPos = lib.func("int32 SetWindowPos(uintptr_t hWnd, uintptr_t hWndInsertAfter, int32 X, int32 Y, int32 cx, int32 cy, uint32 uFlags)");
	const GetClientRect = lib.func("int32 GetClientRect(uintptr_t hWnd, _Out_ void *lpRect)");
	const GWL_STYLE = -16;
	const GWL_EXSTYLE = -20;
	const removeMask = -2160852993n;
	const HWND_BOTTOM = 1;
	let newStyle = BigInt(GetWindowLongPtrW(hwnd, GWL_STYLE)) & removeMask;
	newStyle = newStyle | 1442840576n;
	SetWindowLongPtrW(hwnd, GWL_STYLE, newStyle);
	let newExStyle = BigInt(GetWindowLongPtrW(hwnd, GWL_EXSTYLE)) & -786433n;
	newExStyle = newExStyle | 134217856n;
	SetWindowLongPtrW(hwnd, GWL_EXSTYLE, newExStyle);
	await disableWindowRoundedCorners(hwnd);
	const rectBuf = Buffer.alloc(16);
	GetClientRect(parentHwnd, rectBuf);
	const rectRight = rectBuf.readInt32LE(8);
	const rectBottom = rectBuf.readInt32LE(12);
	console.log(`[wallpaper] Parent client rect: ${rectRight}x${rectBottom}`);
	SetWindowPos(hwnd, HWND_BOTTOM, 0, 0, rectRight, rectBottom, 96);
}
/**
* 查找壁纸层 WorkerW
*
* Windows 11 上 0x052C 可能不触发分裂，但 Progman 内部通常已有一个 WorkerW 子窗口
* （用于壁纸渲染）。这个 WorkerW 就是我们要 SetParent 的目标。
*
* 策略：
* 1. 先在 Progman 内部查找 WorkerW 子窗口
* 2. 如果找不到，发送 0x052C 触发分裂，再在顶层 WorkerW 中查找
*/
async function findWallpaperWorkerW(lib, koffi, progman) {
	const FindWindowExW = lib.func("uintptr_t FindWindowExW(uintptr_t hwndParent, uintptr_t hwndChildAfter, str16 lpszClass, str16 lpszWindow)");
	const workerWInProgmanRaw = FindWindowExW(progman, 0, "WorkerW", 0);
	if (workerWInProgmanRaw) {
		const workerW = toBigInt(workerWInProgmanRaw);
		console.log(`[wallpaper] Found WorkerW inside Progman: ${workerW}`);
		return workerW;
	}
	console.log("[wallpaper] No WorkerW in Progman, sending 0x052C to trigger split...");
	const SendMessageTimeoutW = lib.func("intptr_t SendMessageTimeoutW(uintptr_t hWnd, uint32 msg, uintptr_t wParam, intptr_t lParam, uint32 fuFlags, uint32 uTimeout, _Out_ intptr_t *lpdwResult)");
	const result = [0n];
	SendMessageTimeoutW(progman, 1324, 0n, 0n, 0, 2e3, result);
	console.log(`[wallpaper] SendMessageTimeoutW 0x052C result: ${result[0]}`);
	await new Promise((resolve) => setTimeout(resolve, 200));
	const workerWInProgmanRaw2 = FindWindowExW(progman, 0, "WorkerW", 0);
	if (workerWInProgmanRaw2) {
		const workerW = toBigInt(workerWInProgmanRaw2);
		console.log(`[wallpaper] Found WorkerW inside Progman after 0x052C: ${workerW}`);
		return workerW;
	}
	if (!enumWindowsProcProto) enumWindowsProcProto = koffi.proto("bool __stdcall EnumWindowsProc(uintptr_t hwnd, long lParam)");
	const EnumWindows = lib.func("bool EnumWindows(EnumWindowsProc *cb, long lParam)");
	let defViewParent = null;
	const findCb = (topHandleRaw) => {
		const topHandle = toBigInt(topHandleRaw);
		if (FindWindowExW(topHandle, 0, "SHELLDLL_DefView", 0)) {
			defViewParent = topHandle;
			return false;
		}
		return true;
	};
	const cbReg = koffi.register(findCb, koffi.pointer(enumWindowsProcProto));
	EnumWindows(cbReg, 0);
	koffi.unregister(cbReg);
	if (!defViewParent) {
		console.warn("[wallpaper] SHELLDLL_DefView not found");
		return null;
	}
	console.log(`[wallpaper] SHELLDLL_DefView parent: ${defViewParent}`);
	let current = defViewParent;
	for (let i = 0; i < 32; i++) {
		const nextRaw = FindWindowExW(0, current, "WorkerW", 0);
		if (!nextRaw) break;
		const next = toBigInt(nextRaw);
		if (!FindWindowExW(next, 0, "SHELLDLL_DefView", 0)) {
			console.log(`[wallpaper] Found wallpaper WorkerW (top-level): ${next}`);
			return next;
		}
		current = next;
	}
	console.warn("[wallpaper] Wallpaper WorkerW not found");
	return null;
}
/**
* Windows：将壁纸窗口 SetParent 到桌面壁纸层 WorkerW
*
* 正确流程（Wallpaper Engine 标准做法）：
* 1. 向 Progman 发送 0x052C 消息，触发分裂出 WorkerW
* 2. 找到壁纸层 WorkerW（SHELLDLL_DefView 的兄弟 WorkerW，不含 DefView）
* 3. SetParent 到这个 WorkerW
*
* 分裂后桌面图标层（SHELLDLL_DefView）和壁纸层（WorkerW）是兄弟关系，
* 壁纸层在图标层下方，用户看到的是壁纸 + 图标叠加
*/
async function attachToDesktopLayer(win) {
	if (process.platform !== "win32") return;
	const lib = await loadWin32Lib();
	if (!lib) return;
	const koffi = await loadKoffi();
	const FindWindowW = lib.func("uintptr_t FindWindowW(str16 className, str16 windowName)");
	lib.func("uintptr_t FindWindowExW(uintptr_t hwndParent, uintptr_t hwndChildAfter, str16 lpszClass, str16 lpszWindow)");
	lib.func("intptr_t SendMessageTimeoutW(uintptr_t hWnd, uint32 msg, uintptr_t wParam, intptr_t lParam, uint32 fuFlags, uint32 uTimeout, _Out_ intptr_t *lpdwResult)");
	const SetParent = lib.func("uintptr_t SetParent(uintptr_t hWndChild, uintptr_t hWndNewParent)");
	if (!kernel32Lib) kernel32Lib = koffi.load("kernel32.dll");
	const GetLastError = kernel32Lib.func("uint32 GetLastError()");
	const hwnd = readHwnd(win.getNativeWindowHandle());
	console.log(`[wallpaper] Attaching window HWND=${hwnd}`);
	const progmanRaw = FindWindowW("Progman", 0);
	if (!progmanRaw) {
		console.warn("[wallpaper] Progman not found");
		return;
	}
	const progman = toBigInt(progmanRaw);
	console.log(`[wallpaper] Progman: ${progman}`);
	const workerW = await findWallpaperWorkerW(lib, koffi, progman);
	if (!workerW) {
		console.warn("[wallpaper] WorkerW not found, abort");
		return;
	}
	console.log(`[wallpaper] SetParent to WorkerW: ${workerW}`);
	const prevParent = SetParent(hwnd, workerW);
	const err1 = GetLastError();
	console.log(`[wallpaper] SetParent: prev=${prevParent}, err=${err1}`);
	await setupWindowStyle(hwnd, workerW);
}
/**
* 构建壁纸窗口加载的 URL（携带与主窗口相同的 electron 凭据 + wallpaper=1 标记）
*/
function buildWallpaperUrl(display) {
	const url = new URL(getWebviewOrigin());
	url.pathname = "/oc/";
	url.searchParams.set("mode", "electron");
	url.searchParams.set("shellVersion", __VERSION__);
	url.searchParams.set("electronPort", electronPort.toString());
	url.searchParams.set("electronToken", globalThis.electronToken);
	url.searchParams.set("wallpaper", "1");
	url.searchParams.set("displayId", String(display.id));
	return url.toString();
}
/**
* 为指定显示器创建壁纸窗口（不立即 show）
*/
function createWallpaperWindow(display) {
	const { x, y, width, height } = display.bounds;
	const baseOptions = {
		x,
		y,
		width,
		height,
		frame: false,
		show: false,
		skipTaskbar: true,
		hasShadow: false,
		focusable: false,
		movable: false,
		resizable: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		webPreferences: {
			devTools: false,
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true
		}
	};
	if (process.platform === "darwin") {
		baseOptions.type = "desktop";
		baseOptions.enableLargerThanScreen = true;
	}
	const win = new electron.BrowserWindow(baseOptions);
	win.webContents.on("will-navigate", (event, url) => {
		if (url.startsWith(getWebviewOrigin())) return;
		event.preventDefault();
		electron.shell.openExternal(url);
	});
	win.webContents.setWindowOpenHandler(({ url }) => {
		electron.shell.openExternal(url);
		return { action: "deny" };
	});
	win.loadURL(buildWallpaperUrl(display));
	return win;
}
/**
* 设置壁纸：为所有显示器创建壁纸窗口
*/
async function setWallpaper() {
	await cancelWallpaper();
	const displays = electron.screen.getAllDisplays();
	for (const display of displays) {
		const win = createWallpaperWindow(display);
		wallpaperWindows.set(display.id, win);
		if (process.platform === "win32") await attachToDesktopLayer(win);
		win.showInactive();
	}
	if (process.platform === "win32") {
		await installMouseHook();
		await installWheelHook();
	}
}
/**
* 取消壁纸：销毁所有壁纸窗口
*/
async function cancelWallpaper() {
	if (process.platform === "win32") await uninstallMouseHook();
	for (const win of wallpaperWindows.values()) if (!win.isDestroyed()) win.destroy();
	wallpaperWindows.clear();
}
/**
* 处理显示器变化：壁纸激活时动态增删、重排窗口
*/
async function handleDisplayChange() {
	if (wallpaperWindows.size === 0) return;
	const displays = electron.screen.getAllDisplays();
	const currentIds = new Set(wallpaperWindows.keys());
	const newIds = new Set(displays.map((d) => d.id));
	for (const id of currentIds) if (!newIds.has(id)) {
		const win = wallpaperWindows.get(id);
		if (win && !win.isDestroyed()) win.destroy();
		wallpaperWindows.delete(id);
	}
	for (const display of displays) if (!wallpaperWindows.has(display.id)) {
		const win = createWallpaperWindow(display);
		wallpaperWindows.set(display.id, win);
		if (process.platform === "win32") await attachToDesktopLayer(win);
		win.showInactive();
	} else {
		const win = wallpaperWindows.get(display.id);
		if (!win.isDestroyed()) {
			const { x, y, width, height } = display.bounds;
			win.setBounds({
				x,
				y,
				width,
				height
			});
		}
	}
}
/**
* 获取当前壁纸状态
*/
function isWallpaperActive() {
	return wallpaperWindows.size > 0;
}
/**
* 安装鼠标事件透传
*
* 方案：用 GetAsyncKeyState 轮询鼠标按键状态 + screen.getCursorScreenPoint 获取鼠标位置，
* 通过 Electron webContents.sendInputEvent 注入到壁纸窗口。
*
* 不使用 WH_MOUSE_LL 全局钩子，因为 koffi 回调在 Electron 主进程消息循环中无法被正确调度。
* 轮询方案简单可靠，且兼容触摸屏（触摸会被系统转为鼠标状态）。
*/
var mousePollTimer = null;
var lastCursorPos = {
	x: -1,
	y: -1
};
var lastButtonStates = {
	left: false,
	right: false,
	middle: false
};
async function installMouseHook() {
	if (process.platform !== "win32") return;
	if (mousePollTimer) return;
	const lib = await loadWin32Lib();
	if (!lib) return;
	const GetAsyncKeyState = lib.func("int16 GetAsyncKeyState(int32 vKey)");
	const GetForegroundWindow = lib.func("uintptr_t GetForegroundWindow()");
	const GetClassNameW = lib.func("int32 GetClassNameW(uintptr_t hWnd, void *lpClassName, int32 nMaxCount)");
	const classNameBuf = Buffer.alloc(512);
	const isDesktopForeground = () => {
		classNameBuf.fill(0);
		const fg = GetForegroundWindow();
		if (!fg || fg === 0n) return false;
		const len = GetClassNameW(fg, classNameBuf, 256);
		if (len <= 0) return false;
		const cls = classNameBuf.toString("utf16le", 0, len * 2);
		return cls === "Progman" || cls === "WorkerW";
	};
	mousePollTimer = setInterval(() => {
		if (wallpaperWindows.size === 0) return;
		if (!isDesktopForeground()) {
			for (const win of wallpaperWindows.values()) {
				if (win.isDestroyed()) continue;
				const bounds = win.getBounds();
				const centerX = Math.floor(bounds.width / 2);
				const centerY = Math.floor(bounds.height / 2);
				win.webContents.sendInputEvent({
					type: "mouseMove",
					x: centerX,
					y: centerY
				});
			}
			lastCursorPos = {
				x: -1,
				y: -1
			};
			lastButtonStates = {
				left: false,
				right: false,
				middle: false
			};
			return;
		}
		const leftDown = (GetAsyncKeyState(1) & 32768) !== 0;
		const rightDown = (GetAsyncKeyState(2) & 32768) !== 0;
		const middleDown = (GetAsyncKeyState(4) & 32768) !== 0;
		const pos = electron.screen.getCursorScreenPoint();
		let targetWin = null;
		for (const win of wallpaperWindows.values()) {
			if (win.isDestroyed()) continue;
			const bounds = win.getBounds();
			if (pos.x >= bounds.x && pos.x < bounds.x + bounds.width && pos.y >= bounds.y && pos.y < bounds.y + bounds.height) {
				targetWin = win;
				break;
			}
		}
		if (!targetWin) {
			lastCursorPos = pos;
			lastButtonStates = {
				left: leftDown,
				right: rightDown,
				middle: middleDown
			};
			return;
		}
		const bounds = targetWin.getBounds();
		const x = pos.x - bounds.x;
		const y = pos.y - bounds.y;
		if (pos.x !== lastCursorPos.x || pos.y !== lastCursorPos.y) targetWin.webContents.sendInputEvent({
			type: "mouseMove",
			x,
			y
		});
		if (leftDown !== lastButtonStates.left) targetWin.webContents.sendInputEvent({
			type: leftDown ? "mouseDown" : "mouseUp",
			x,
			y,
			button: "left",
			clickCount: 1
		});
		if (rightDown !== lastButtonStates.right) targetWin.webContents.sendInputEvent({
			type: rightDown ? "mouseDown" : "mouseUp",
			x,
			y,
			button: "right",
			clickCount: 1
		});
		if (middleDown !== lastButtonStates.middle) targetWin.webContents.sendInputEvent({
			type: middleDown ? "mouseDown" : "mouseUp",
			x,
			y,
			button: "middle",
			clickCount: 1
		});
		lastCursorPos = pos;
		lastButtonStates = {
			left: leftDown,
			right: rightDown,
			middle: middleDown
		};
	}, 40);
	console.log("[wallpaper] Mouse poll started (40ms interval, desktop-only)");
}
/**
* 安装鼠标滚轮透传
*
* 滚轮无法通过 GetAsyncKeyState 轮询获取（是事件而非状态）。
* 方案：用 RawInput + hookWindowMessage(WM_INPUT) + GetRawInputData。
*
* 关键点：
* - 用 RIDEV_INPUTSINK 注册 RawInput 到主窗口（即使主窗口不在前台也接收输入）
* - MSDN 明确规定 RIDEV_NOQUEUE 不能与 RIDEV_INPUTSINK 组合，所以事件会以 WM_INPUT 投递
* - Electron 的 hookWindowMessage callback 在 UI 线程同步执行（通过 v8::Locker），
*   HRAWINPUT 句柄在 callback 期间仍然有效，可以安全调用 GetRawInputData
* - callback 中再次检查前台窗口是否为桌面（Progman/WorkerW），避免非桌面场景误触发
*
* 主窗口永远存在（close 被拦截为 hide），是注册 RawInput 的理想载体。
*/
var wheelHookInstalled = false;
var wheelHookMainWin = null;
var getRawInputDataFn = null;
var getForegroundWindowFn = null;
var getClassNameWFn = null;
var WM_INPUT = 255;
var RID_INPUT = 268435459;
var RIM_TYPEMOUSE = 0;
var RAWINPUTHEADER_SIZE = 24;
var rawInputDataBuf = Buffer.alloc(1024);
var rawInputSizeBuf = Buffer.alloc(4);
var classNameBufWheel = Buffer.alloc(512);
function isDesktopForegroundByWin32() {
	if (!getForegroundWindowFn || !getClassNameWFn) return false;
	const fg = getForegroundWindowFn();
	if (!fg || fg === 0n) return false;
	classNameBufWheel.fill(0);
	const len = getClassNameWFn(fg, classNameBufWheel, 256);
	if (len <= 0) return false;
	const cls = classNameBufWheel.toString("utf16le", 0, len * 2);
	return cls === "Progman" || cls === "WorkerW";
}
async function installWheelHook() {
	if (process.platform !== "win32") return;
	if (wheelHookInstalled) return;
	const mainWin = await getWebviewWindow();
	if (mainWin.isDestroyed()) return;
	const lib = await loadWin32Lib();
	if (!lib) return;
	const RegisterRawInputDevices = lib.func("uint32 RegisterRawInputDevices(void *pRawInputDevices, uint32 uiNumDevices, uint32 cbSize)");
	getRawInputDataFn = lib.func("uint32 GetRawInputData(uintptr_t hRawInput, uint32 uiCommand, void *pData, void *pcbSize, uint32 cbSizeHeader)");
	getForegroundWindowFn = lib.func("uintptr_t GetForegroundWindow()");
	getClassNameWFn = lib.func("int32 GetClassNameW(uintptr_t hWnd, void *lpClassName, int32 nMaxCount)");
	const koffiForErr = await loadKoffi();
	if (!kernel32Lib) kernel32Lib = koffiForErr.load("kernel32.dll");
	const GetLastError = kernel32Lib.func("uint32 GetLastError()");
	const mainHwnd = readHwnd(mainWin.getNativeWindowHandle());
	const rid = Buffer.alloc(16);
	rid.writeUInt16LE(1, 0);
	rid.writeUInt16LE(2, 2);
	rid.writeUInt32LE(256, 4);
	rid.writeBigUInt64LE(mainHwnd, 8);
	const ok = RegisterRawInputDevices(rid, 1, 16);
	const err = GetLastError();
	console.log(`[wallpaper] RegisterRawInputDevices: ok=${ok} err=${err}`);
	if (ok === 0) {
		console.warn(`[wallpaper] RegisterRawInputDevices failed`);
		return;
	}
	wheelHookMainWin = mainWin;
	let wheelEventCount = 0;
	mainWin.hookWindowMessage(WM_INPUT, (wParam, lParam) => {
		try {
			if (wallpaperWindows.size === 0) return;
			if (!isDesktopForegroundByWin32()) return;
			if (!getRawInputDataFn) return;
			const hRawInput = lParam.length >= 8 ? lParam.readBigUInt64LE(0) : BigInt(lParam.readUInt32LE(0));
			rawInputSizeBuf.writeUInt32LE(rawInputDataBuf.length, 0);
			const result = getRawInputDataFn(hRawInput, RID_INPUT, rawInputDataBuf, rawInputSizeBuf, RAWINPUTHEADER_SIZE);
			if (result === 0 || result === 4294967295) {
				if (wheelEventCount === 0) {
					const lastErr = GetLastError();
					console.warn(`[wallpaper] GetRawInputData failed: result=${result} err=${lastErr}`);
				}
				return;
			}
			if (rawInputDataBuf.readUInt32LE(0) !== RIM_TYPEMOUSE) return;
			const ulButtons = rawInputDataBuf.readUInt32LE(28);
			if ((ulButtons & 1024) !== 0) {
				const usButtonDataRaw = ulButtons >>> 16 & 65535;
				const delta = usButtonDataRaw > 32767 ? usButtonDataRaw - 65536 : usButtonDataRaw;
				wheelEventCount++;
				if (wheelEventCount <= 3) console.log(`[wallpaper] Wheel event: delta=${delta} (count=${wheelEventCount})`);
				const pos = electron.screen.getCursorScreenPoint();
				for (const win of wallpaperWindows.values()) {
					if (win.isDestroyed()) continue;
					const bounds = win.getBounds();
					if (pos.x >= bounds.x && pos.x < bounds.x + bounds.width && pos.y >= bounds.y && pos.y < bounds.y + bounds.height) {
						win.webContents.sendInputEvent({
							type: "mouseWheel",
							x: pos.x - bounds.x,
							y: pos.y - bounds.y,
							deltaX: 0,
							deltaY: delta
						});
						break;
					}
				}
			}
		} catch (e) {
			console.error("[wallpaper] WM_INPUT callback error:", e);
		}
	});
	wheelHookInstalled = true;
	console.log("[wallpaper] Wheel hook installed (WM_INPUT hook mode)");
}
/**
* 卸载鼠标轮询
*/
async function uninstallMouseHook() {
	if (process.platform !== "win32") return;
	if (mousePollTimer) {
		clearInterval(mousePollTimer);
		mousePollTimer = null;
	}
	lastCursorPos = {
		x: -1,
		y: -1
	};
	lastButtonStates = {
		left: false,
		right: false,
		middle: false
	};
	if (wheelHookMainWin && !wheelHookMainWin.isDestroyed()) try {
		wheelHookMainWin.unhookWindowMessage(WM_INPUT);
	} catch {}
	wheelHookInstalled = false;
	wheelHookMainWin = null;
	getRawInputDataFn = null;
	getForegroundWindowFn = null;
	getClassNameWFn = null;
	console.log("[wallpaper] Mouse poll stopped");
}
//#endregion
export { cancelWallpaper, handleDisplayChange, isWallpaperActive, setWallpaper };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbHBhcGVyLUJibGkwMGhTLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC91dGlscy93YWxscGFwZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBfZWxlY3Ryb24gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgX19WRVJTSU9OX18gfSBmcm9tICcuLi9fX1ZFUlNJT05fXyc7XG5pbXBvcnQgeyBnZXRXZWJ2aWV3T3JpZ2luLCBnZXRXZWJ2aWV3V2luZG93IH0gZnJvbSAnLi9lbGVjdHJvbi50cyc7XG5cbi8vIOWjgee6uOeql+WPoyBNYXDvvJpkaXNwbGF5SWQg4oaSIEJyb3dzZXJXaW5kb3dcbmNvbnN0IHdhbGxwYXBlcldpbmRvd3MgPSBuZXcgTWFwPG51bWJlciwgX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3c+KCk7XG5cbi8vIFdpbmRvd3Mg5LiT55So77yaa29mZmkg5bu26L+f5Yqg6L2977yI5LuFIFdpbmRvd3Mg5bmz5Y+w5L2/55So77yJXG5sZXQgd2luMzJMaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xubGV0IGtlcm5lbDMyTGliOiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykubG9hZD4gfCBudWxsID0gbnVsbDtcbmxldCBkd21MaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xuXG4vLyBrb2ZmaSDnsbvlnovlrprkuYnnvJPlrZjvvIjpgb/lhY3ph43lpI3ms6jlhozlr7zoh7QgRHVwbGljYXRlIHR5cGUgbmFtZSDplJnor6/vvIlcbmxldCBlbnVtV2luZG93c1Byb2NQcm90bzogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLnByb3RvPiB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkS29mZmkoKSB7XG4gIGNvbnN0IG1vZCA9IGF3YWl0IGltcG9ydCgna29mZmknKTtcbiAgLy8gQ0pTIOaooeWdl+WcqCBFU00g5Lit6YCa6L+HIGRlZmF1bHQg6K6/6ZeuIG1vZHVsZS5leHBvcnRzXG4gIHJldHVybiAobW9kIGFzIHsgZGVmYXVsdD86IHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykgfSkuZGVmYXVsdCA/PyBtb2Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRXaW4zMkxpYigpIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybiBudWxsO1xuICBpZiAoIXdpbjMyTGliKSB7XG4gICAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgICB3aW4zMkxpYiA9IGtvZmZpLmxvYWQoJ3VzZXIzMi5kbGwnKTtcbiAgfVxuICByZXR1cm4gd2luMzJMaWI7XG59XG5cbi8qKlxuICog5LuOIEJ1ZmZlciDor7vlj5YgSFdORCDmjIfpkojlgLxcbiAqIEVsZWN0cm9uIOeahCBnZXROYXRpdmVXaW5kb3dIYW5kbGUg5ZyoIDY0IOS9jeezu+e7n+i/lOWbniA4IOWtl+iKgiBCdWZmZXLvvIwzMiDkvY3ov5Tlm54gNCDlrZfoioJcbiAqIOe7n+S4gOi/lOWbniBCaWdJbnQg6YG/5YWN57K+5bqm6Zeu6aKYXG4gKi9cbmZ1bmN0aW9uIHJlYWRId25kKGJ1ZjogQnVmZmVyKTogYmlnaW50IHtcbiAgaWYgKGJ1Zi5sZW5ndGggPD0gNCkge1xuICAgIHJldHVybiBCaWdJbnQoYnVmLnJlYWRVSW50MzJMRSgwKSk7XG4gIH1cbiAgcmV0dXJuIGJ1Zi5yZWFkQmlnVUludDY0TEUoMCk7XG59XG5cbi8qKlxuICog5bCG5YC86L2s5o2i5Li6IEJpZ0ludO+8iGtvZmZpIOeahCB1aW50cHRyX3Qg5ZyoIDY0IOS9jeezu+e7n+i/lOWbniBudW1iZXIg5oiWIEJpZ0ludO+8iVxuICovXG5mdW5jdGlvbiB0b0JpZ0ludCh2OiBiaWdpbnQgfCBudW1iZXIpOiBiaWdpbnQge1xuICByZXR1cm4gdHlwZW9mIHYgPT09ICdiaWdpbnQnID8gdiA6IEJpZ0ludCh2KTtcbn1cblxuLyoqXG4gKiDnpoHnlKggV2luMTEgRFdNIOm7mOiupOWchuinku+8jOmBv+WFjeWjgee6uOeql+WPo+i+uee8mOiiq+ijgeWIh1xuICovXG5hc3luYyBmdW5jdGlvbiBkaXNhYmxlV2luZG93Um91bmRlZENvcm5lcnMoaHduZDogYmlnaW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBrb2ZmaSA9IGF3YWl0IGxvYWRLb2ZmaSgpO1xuICAgIGlmICghZHdtTGliKSBkd21MaWIgPSBrb2ZmaS5sb2FkKCdkd21hcGkuZGxsJyk7XG4gICAgY29uc3QgRHdtU2V0V2luZG93QXR0cmlidXRlID0gZHdtTGliLmZ1bmMoJ2xvbmcgRHdtU2V0V2luZG93QXR0cmlidXRlKHVpbnRwdHJfdCBod25kLCB1aW50MzIgYXR0ciwgdm9pZCAqdmFsdWUsIHVpbnQzMiBjYkF0dHJpYnV0ZSknKTtcblxuICAgIGNvbnN0IERXTVdBX1dJTkRPV19DT1JORVJfUFJFRkVSRU5DRSA9IDMzO1xuICAgIGNvbnN0IERXTVdDUF9ET05PVFJPVU5EID0gMTtcbiAgICBjb25zdCB2YWx1ZUJ1ZiA9IEJ1ZmZlci5hbGxvYyg0KTtcbiAgICB2YWx1ZUJ1Zi53cml0ZVVJbnQzMkxFKERXTVdDUF9ET05PVFJPVU5ELCAwKTtcbiAgICBEd21TZXRXaW5kb3dBdHRyaWJ1dGUoaHduZCwgRFdNV0FfV0lORE9XX0NPUk5FUl9QUkVGRVJFTkNFLCB2YWx1ZUJ1ZiwgNCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLndhcm4oJ1t3YWxscGFwZXJdIEZhaWxlZCB0byBkaXNhYmxlIHJvdW5kZWQgY29ybmVyczonLCBlKTtcbiAgfVxufVxuXG4vKipcbiAqIOiuvue9rueql+WPo+S4uuaXoOi+ueahhuOAgeaXoOWchuinkuOAgemTuua7oeeItueql+WPo1xuICog5b+F6aG75ZyoIFNldFBhcmVudCDkuYvlkI7osIPnlKjvvIzorr7nva4gV1NfQ0hJTEQg562J5qC35byPXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNldHVwV2luZG93U3R5bGUoaHduZDogYmlnaW50LCBwYXJlbnRId25kOiBiaWdpbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybjtcblxuICBjb25zdCBsaWIgPSBhd2FpdCBsb2FkV2luMzJMaWIoKTtcbiAgaWYgKCFsaWIpIHJldHVybjtcblxuICBjb25zdCBHZXRXaW5kb3dMb25nUHRyVyA9IGxpYi5mdW5jKCdpbnRwdHJfdCBHZXRXaW5kb3dMb25nUHRyVyh1aW50cHRyX3QgaFduZCwgaW50MzIgbkluZGV4KScpO1xuICBjb25zdCBTZXRXaW5kb3dMb25nUHRyVyA9IGxpYi5mdW5jKCdpbnRwdHJfdCBTZXRXaW5kb3dMb25nUHRyVyh1aW50cHRyX3QgaFduZCwgaW50MzIgbkluZGV4LCBpbnRwdHJfdCBkd05ld0xvbmcpJyk7XG4gIGNvbnN0IFNldFdpbmRvd1BvcyA9IGxpYi5mdW5jKCdpbnQzMiBTZXRXaW5kb3dQb3ModWludHB0cl90IGhXbmQsIHVpbnRwdHJfdCBoV25kSW5zZXJ0QWZ0ZXIsIGludDMyIFgsIGludDMyIFksIGludDMyIGN4LCBpbnQzMiBjeSwgdWludDMyIHVGbGFncyknKTtcbiAgY29uc3QgR2V0Q2xpZW50UmVjdCA9IGxpYi5mdW5jKCdpbnQzMiBHZXRDbGllbnRSZWN0KHVpbnRwdHJfdCBoV25kLCBfT3V0XyB2b2lkICpscFJlY3QpJyk7XG5cbiAgY29uc3QgR1dMX1NUWUxFID0gLTE2O1xuICBjb25zdCBHV0xfRVhTVFlMRSA9IC0yMDtcblxuICAvLyDnqpflj6PmoLflvI/kvY1cbiAgY29uc3QgV1NfQ0hJTEQgPSAweDQwMDAwMDAwbjtcbiAgY29uc3QgV1NfVklTSUJMRSA9IDB4MTAwMDAwMDBuO1xuICBjb25zdCBXU19DTElQU0lCTElOR1MgPSAweDA0MDAwMDAwbjtcbiAgY29uc3QgV1NfQ0xJUENISUxEUkVOID0gMHgwMjAwMDAwMG47XG4gIC8vIOmcgOimgeenu+mZpOeahOagt+W8j++8mldTX1BPUFVQIHwgV1NfQk9SREVSIHwgV1NfVEhJQ0tGUkFNRSB8IFdTX0RMR0ZSQU1FIHwgV1NfU1lTTUVOVSDnrYlcbiAgY29uc3QgcmVtb3ZlTWFzayA9IH4oMHg4MDAwMDAwMG4gfCAweDAwODAwMDAwbiB8IDB4MDAwNDAwMDBuIHwgMHgwMGMwMDAwMG4gfCAweDAwMDgwMDAwbik7XG5cbiAgLy8g5omp5bGV5qC35byPXG4gIGNvbnN0IFdTX0VYX1RPT0xXSU5ET1cgPSAweDAwMDAwMDgwbjtcbiAgY29uc3QgV1NfRVhfTk9BQ1RJVkFURSA9IDB4MDgwMDAwMDBuO1xuICBjb25zdCBXU19FWF9BUFBXSU5ET1dfTUFTSyA9IH4weDAwMDQwMDAwbjtcbiAgY29uc3QgV1NfRVhfTEFZRVJFRF9NQVNLID0gfjB4MDAwODAwMDBuO1xuXG4gIC8vIFNldFdpbmRvd1BvcyDmoIflv5dcbiAgY29uc3QgU1dQX0ZSQU1FQ0hBTkdFID0gMHgwMDIwO1xuICBjb25zdCBTV1BfU0hPV1dJTkRPVyA9IDB4MDA0MDtcbiAgLy8gSFdORF9CT1RUT00gPSAx77yM5bCG56qX5Y+j5pS+5YiwIFog6aG65bqP5bqV6YOo77yI5ZyoIFNIRUxMRExMX0RlZlZpZXcg5LmL5LiL77yJXG4gIGNvbnN0IEhXTkRfQk9UVE9NID0gMTtcblxuICAvLyAxLiDkv67mlLnnqpflj6PmoLflvI/vvJrnp7vpmaTmoIfpopgv6L655qGG77yM5re75YqgIFdTX0NISUxE77yIU2V0UGFyZW50IOWQjuaJjeiDveiuvue9ru+8iVxuICBjb25zdCBjdXJyZW50U3R5bGUgPSBCaWdJbnQoR2V0V2luZG93TG9uZ1B0clcoaHduZCwgR1dMX1NUWUxFKSk7XG4gIGxldCBuZXdTdHlsZSA9IGN1cnJlbnRTdHlsZSAmIHJlbW92ZU1hc2s7XG4gIG5ld1N0eWxlID0gbmV3U3R5bGUgfCBXU19DSElMRCB8IFdTX1ZJU0lCTEUgfCBXU19DTElQU0lCTElOR1MgfCBXU19DTElQQ0hJTERSRU47XG4gIFNldFdpbmRvd0xvbmdQdHJXKGh3bmQsIEdXTF9TVFlMRSwgbmV3U3R5bGUpO1xuXG4gIC8vIDIuIOS/ruaUueaJqeWxleagt+W8j1xuICBjb25zdCBjdXJyZW50RXhTdHlsZSA9IEJpZ0ludChHZXRXaW5kb3dMb25nUHRyVyhod25kLCBHV0xfRVhTVFlMRSkpO1xuICBsZXQgbmV3RXhTdHlsZSA9IChjdXJyZW50RXhTdHlsZSAmIFdTX0VYX0FQUFdJTkRPV19NQVNLKSAmIFdTX0VYX0xBWUVSRURfTUFTSztcbiAgbmV3RXhTdHlsZSA9IG5ld0V4U3R5bGUgfCBXU19FWF9UT09MV0lORE9XIHwgV1NfRVhfTk9BQ1RJVkFURTtcbiAgU2V0V2luZG93TG9uZ1B0clcoaHduZCwgR1dMX0VYU1RZTEUsIG5ld0V4U3R5bGUpO1xuXG4gIC8vIDMuIOemgeeUqOWchuinklxuICBhd2FpdCBkaXNhYmxlV2luZG93Um91bmRlZENvcm5lcnMoaHduZCk7XG5cbiAgLy8gNC4g6I635Y+W54i256qX5Y+j5a6i5oi35Yy65bC65a+477yM6ZO65ruhXG4gIGNvbnN0IHJlY3RCdWYgPSBCdWZmZXIuYWxsb2MoMTYpO1xuICBHZXRDbGllbnRSZWN0KHBhcmVudEh3bmQsIHJlY3RCdWYpO1xuICBjb25zdCByZWN0UmlnaHQgPSByZWN0QnVmLnJlYWRJbnQzMkxFKDgpO1xuICBjb25zdCByZWN0Qm90dG9tID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSgxMik7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBQYXJlbnQgY2xpZW50IHJlY3Q6ICR7cmVjdFJpZ2h0fXgke3JlY3RCb3R0b219YCk7XG5cbiAgLy8gNS4g6LCD5pW056qX5Y+j5L2N572u5ZKM5bC65a+477yM5bm25pS+5YiwIFog6aG65bqP5bqV6YOo77yISFdORF9CT1RUT03vvIlcbiAgLy8g5LiN5L2/55SoIFNXUF9OT1pPUkRFUu+8jOiuqSBoV25kSW5zZXJ0QWZ0ZXIgPSBIV05EX0JPVFRPTSDnlJ/mlYhcbiAgLy8g6L+Z5qC35aOB57q456qX5Y+j5ZyoIFNIRUxMRExMX0RlZlZpZXfvvIjmoYzpnaLlm77moIfvvInkuYvkuItcbiAgU2V0V2luZG93UG9zKGh3bmQsIEhXTkRfQk9UVE9NLCAwLCAwLCByZWN0UmlnaHQsIHJlY3RCb3R0b20sIFNXUF9GUkFNRUNIQU5HRSB8IFNXUF9TSE9XV0lORE9XKTtcbn1cblxuLyoqXG4gKiDmn6Xmib7lo4HnurjlsYIgV29ya2VyV1xuICpcbiAqIFdpbmRvd3MgMTEg5LiKIDB4MDUyQyDlj6/og73kuI3op6blj5HliIboo4LvvIzkvYYgUHJvZ21hbiDlhoXpg6jpgJrluLjlt7LmnInkuIDkuKogV29ya2VyVyDlrZDnqpflj6NcbiAqIO+8iOeUqOS6juWjgee6uOa4suafk++8ieOAgui/meS4qiBXb3JrZXJXIOWwseaYr+aIkeS7rOimgSBTZXRQYXJlbnQg55qE55uu5qCH44CCXG4gKlxuICog562W55Wl77yaXG4gKiAxLiDlhYjlnKggUHJvZ21hbiDlhoXpg6jmn6Xmib4gV29ya2VyVyDlrZDnqpflj6NcbiAqIDIuIOWmguaenOaJvuS4jeWIsO+8jOWPkemAgSAweDA1MkMg6Kem5Y+R5YiG6KOC77yM5YaN5Zyo6aG25bGCIFdvcmtlclcg5Lit5p+l5om+XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGZpbmRXYWxscGFwZXJXb3JrZXJXKFxuICBsaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPixcbiAga29mZmk6IHR5cGVvZiBpbXBvcnQoJ2tvZmZpJyksXG4gIHByb2dtYW46IGJpZ2ludFxuKTogUHJvbWlzZTxiaWdpbnQgfCBudWxsPiB7XG4gIGNvbnN0IEZpbmRXaW5kb3dFeFcgPSBsaWIuZnVuYygndWludHB0cl90IEZpbmRXaW5kb3dFeFcodWludHB0cl90IGh3bmRQYXJlbnQsIHVpbnRwdHJfdCBod25kQ2hpbGRBZnRlciwgc3RyMTYgbHBzekNsYXNzLCBzdHIxNiBscHN6V2luZG93KScpO1xuXG4gIC8vIDEuIOWFiOWcqCBQcm9nbWFuIOWGhemDqOafpeaJviBXb3JrZXJXIOWtkOeql+WPo++8iFdpbmRvd3MgMTEg5bi46KeB5oOF5Ya177yJXG4gIGNvbnN0IHdvcmtlcldJblByb2dtYW5SYXcgPSBGaW5kV2luZG93RXhXKHByb2dtYW4sIDAsICdXb3JrZXJXJywgMCk7XG4gIGlmICh3b3JrZXJXSW5Qcm9nbWFuUmF3KSB7XG4gICAgY29uc3Qgd29ya2VyVyA9IHRvQmlnSW50KHdvcmtlcldJblByb2dtYW5SYXcpO1xuICAgIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBGb3VuZCBXb3JrZXJXIGluc2lkZSBQcm9nbWFuOiAke3dvcmtlcld9YCk7XG4gICAgcmV0dXJuIHdvcmtlclc7XG4gIH1cblxuICAvLyAyLiBQcm9nbWFuIOWGhemDqOayoeaciSBXb3JrZXJX77yM5bCd6K+V5Y+R6YCBIDB4MDUyQyDop6blj5HliIboo4JcbiAgY29uc29sZS5sb2coJ1t3YWxscGFwZXJdIE5vIFdvcmtlclcgaW4gUHJvZ21hbiwgc2VuZGluZyAweDA1MkMgdG8gdHJpZ2dlciBzcGxpdC4uLicpO1xuICBjb25zdCBTZW5kTWVzc2FnZVRpbWVvdXRXID0gbGliLmZ1bmMoJ2ludHB0cl90IFNlbmRNZXNzYWdlVGltZW91dFcodWludHB0cl90IGhXbmQsIHVpbnQzMiBtc2csIHVpbnRwdHJfdCB3UGFyYW0sIGludHB0cl90IGxQYXJhbSwgdWludDMyIGZ1RmxhZ3MsIHVpbnQzMiB1VGltZW91dCwgX091dF8gaW50cHRyX3QgKmxwZHdSZXN1bHQpJyk7XG4gIGNvbnN0IHJlc3VsdCA9IFswbl07XG4gIFNlbmRNZXNzYWdlVGltZW91dFcocHJvZ21hbiwgMHgwNTJjLCAwbiwgMG4sIDB4MDAwMCwgMjAwMCwgcmVzdWx0KTtcbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFNlbmRNZXNzYWdlVGltZW91dFcgMHgwNTJDIHJlc3VsdDogJHtyZXN1bHRbMF19YCk7XG5cbiAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7XG5cbiAgLy8gMy4g5YaN5qyh5p+l5om+IFByb2dtYW4g5YaF6YOo55qEIFdvcmtlcldcbiAgY29uc3Qgd29ya2VyV0luUHJvZ21hblJhdzIgPSBGaW5kV2luZG93RXhXKHByb2dtYW4sIDAsICdXb3JrZXJXJywgMCk7XG4gIGlmICh3b3JrZXJXSW5Qcm9nbWFuUmF3Mikge1xuICAgIGNvbnN0IHdvcmtlclcgPSB0b0JpZ0ludCh3b3JrZXJXSW5Qcm9nbWFuUmF3Mik7XG4gICAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIEZvdW5kIFdvcmtlclcgaW5zaWRlIFByb2dtYW4gYWZ0ZXIgMHgwNTJDOiAke3dvcmtlcld9YCk7XG4gICAgcmV0dXJuIHdvcmtlclc7XG4gIH1cblxuICAvLyA0LiDmnIDlkI7lm57pgIDvvJrlnKjpobblsYLnqpflj6PkuK3mn6Xmib7kuI3lkKsgU0hFTExETExfRGVmVmlldyDnmoQgV29ya2VyV1xuICBpZiAoIWVudW1XaW5kb3dzUHJvY1Byb3RvKSB7XG4gICAgZW51bVdpbmRvd3NQcm9jUHJvdG8gPSBrb2ZmaS5wcm90bygnYm9vbCBfX3N0ZGNhbGwgRW51bVdpbmRvd3NQcm9jKHVpbnRwdHJfdCBod25kLCBsb25nIGxQYXJhbSknKTtcbiAgfVxuICBjb25zdCBFbnVtV2luZG93cyA9IGxpYi5mdW5jKCdib29sIEVudW1XaW5kb3dzKEVudW1XaW5kb3dzUHJvYyAqY2IsIGxvbmcgbFBhcmFtKScpO1xuXG4gIGxldCBkZWZWaWV3UGFyZW50OiBiaWdpbnQgfCBudWxsID0gbnVsbDtcbiAgY29uc3QgZmluZENiID0gKHRvcEhhbmRsZVJhdzogYmlnaW50IHwgbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgdG9wSGFuZGxlID0gdG9CaWdJbnQodG9wSGFuZGxlUmF3KTtcbiAgICBjb25zdCBzaGVsbFZpZXcgPSBGaW5kV2luZG93RXhXKHRvcEhhbmRsZSwgMCwgJ1NIRUxMRExMX0RlZlZpZXcnLCAwKTtcbiAgICBpZiAoc2hlbGxWaWV3KSB7XG4gICAgICBkZWZWaWV3UGFyZW50ID0gdG9wSGFuZGxlO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgY29uc3QgY2JSZWcgPSBrb2ZmaS5yZWdpc3RlcihmaW5kQ2IsIGtvZmZpLnBvaW50ZXIoZW51bVdpbmRvd3NQcm9jUHJvdG8pKTtcbiAgRW51bVdpbmRvd3MoY2JSZWcsIDApO1xuICBrb2ZmaS51bnJlZ2lzdGVyKGNiUmVnKTtcblxuICBpZiAoIWRlZlZpZXdQYXJlbnQpIHtcbiAgICBjb25zb2xlLndhcm4oJ1t3YWxscGFwZXJdIFNIRUxMRExMX0RlZlZpZXcgbm90IGZvdW5kJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFNIRUxMRExMX0RlZlZpZXcgcGFyZW50OiAke2RlZlZpZXdQYXJlbnR9YCk7XG5cbiAgbGV0IGN1cnJlbnQ6IGJpZ2ludCA9IGRlZlZpZXdQYXJlbnQ7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgMzI7IGkrKykge1xuICAgIGNvbnN0IG5leHRSYXcgPSBGaW5kV2luZG93RXhXKDAsIGN1cnJlbnQsICdXb3JrZXJXJywgMCk7XG4gICAgaWYgKCFuZXh0UmF3KSBicmVhaztcbiAgICBjb25zdCBuZXh0ID0gdG9CaWdJbnQobmV4dFJhdyk7XG4gICAgY29uc3QgY2hpbGQgPSBGaW5kV2luZG93RXhXKG5leHQsIDAsICdTSEVMTERMTF9EZWZWaWV3JywgMCk7XG4gICAgaWYgKCFjaGlsZCkge1xuICAgICAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIEZvdW5kIHdhbGxwYXBlciBXb3JrZXJXICh0b3AtbGV2ZWwpOiAke25leHR9YCk7XG4gICAgICByZXR1cm4gbmV4dDtcbiAgICB9XG4gICAgY3VycmVudCA9IG5leHQ7XG4gIH1cblxuICBjb25zb2xlLndhcm4oJ1t3YWxscGFwZXJdIFdhbGxwYXBlciBXb3JrZXJXIG5vdCBmb3VuZCcpO1xuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBXaW5kb3dz77ya5bCG5aOB57q456qX5Y+jIFNldFBhcmVudCDliLDmoYzpnaLlo4HnurjlsYIgV29ya2VyV1xuICpcbiAqIOato+ehrua1geeoi++8iFdhbGxwYXBlciBFbmdpbmUg5qCH5YeG5YGa5rOV77yJ77yaXG4gKiAxLiDlkJEgUHJvZ21hbiDlj5HpgIEgMHgwNTJDIOa2iOaBr++8jOinpuWPkeWIhuijguWHuiBXb3JrZXJXXG4gKiAyLiDmib7liLDlo4HnurjlsYIgV29ya2VyV++8iFNIRUxMRExMX0RlZlZpZXcg55qE5YWE5byfIFdvcmtlclfvvIzkuI3lkKsgRGVmVmlld++8iVxuICogMy4gU2V0UGFyZW50IOWIsOi/meS4qiBXb3JrZXJXXG4gKlxuICog5YiG6KOC5ZCO5qGM6Z2i5Zu+5qCH5bGC77yIU0hFTExETExfRGVmVmlld++8ieWSjOWjgee6uOWxgu+8iFdvcmtlclfvvInmmK/lhYTlvJ/lhbPns7vvvIxcbiAqIOWjgee6uOWxguWcqOWbvuagh+WxguS4i+aWue+8jOeUqOaIt+eci+WIsOeahOaYr+Wjgee6uCArIOWbvuagh+WPoOWKoFxuICovXG5hc3luYyBmdW5jdGlvbiBhdHRhY2hUb0Rlc2t0b3BMYXllcih3aW46IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG5cbiAgY29uc3QgbGliID0gYXdhaXQgbG9hZFdpbjMyTGliKCk7XG4gIGlmICghbGliKSByZXR1cm47XG5cbiAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgY29uc3QgRmluZFdpbmRvd1cgPSBsaWIuZnVuYygndWludHB0cl90IEZpbmRXaW5kb3dXKHN0cjE2IGNsYXNzTmFtZSwgc3RyMTYgd2luZG93TmFtZSknKTtcbiAgY29uc3QgRmluZFdpbmRvd0V4VyA9IGxpYi5mdW5jKCd1aW50cHRyX3QgRmluZFdpbmRvd0V4Vyh1aW50cHRyX3QgaHduZFBhcmVudCwgdWludHB0cl90IGh3bmRDaGlsZEFmdGVyLCBzdHIxNiBscHN6Q2xhc3MsIHN0cjE2IGxwc3pXaW5kb3cpJyk7XG4gIGNvbnN0IFNlbmRNZXNzYWdlVGltZW91dFcgPSBsaWIuZnVuYygnaW50cHRyX3QgU2VuZE1lc3NhZ2VUaW1lb3V0Vyh1aW50cHRyX3QgaFduZCwgdWludDMyIG1zZywgdWludHB0cl90IHdQYXJhbSwgaW50cHRyX3QgbFBhcmFtLCB1aW50MzIgZnVGbGFncywgdWludDMyIHVUaW1lb3V0LCBfT3V0XyBpbnRwdHJfdCAqbHBkd1Jlc3VsdCknKTtcbiAgY29uc3QgU2V0UGFyZW50ID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBTZXRQYXJlbnQodWludHB0cl90IGhXbmRDaGlsZCwgdWludHB0cl90IGhXbmROZXdQYXJlbnQpJyk7XG5cbiAgaWYgKCFrZXJuZWwzMkxpYikge1xuICAgIGtlcm5lbDMyTGliID0ga29mZmkubG9hZCgna2VybmVsMzIuZGxsJyk7XG4gIH1cbiAgY29uc3QgR2V0TGFzdEVycm9yID0ga2VybmVsMzJMaWIuZnVuYygndWludDMyIEdldExhc3RFcnJvcigpJyk7XG5cbiAgLy8g5rWL6K+V55So77ya5ZyoIHdhbGxwYXBlciDmv4DmtLvml7bojrflj5bkuIDmrKEgR2V0TGFzdEVycm9yIOWfuue6v1xuXG4gIGNvbnN0IGh3bmQgPSByZWFkSHduZCh3aW4uZ2V0TmF0aXZlV2luZG93SGFuZGxlKCkpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gQXR0YWNoaW5nIHdpbmRvdyBIV05EPSR7aHduZH1gKTtcblxuICAvLyAxLiDmib7liLAgUHJvZ21hblxuICBjb25zdCBwcm9nbWFuUmF3ID0gRmluZFdpbmRvd1coJ1Byb2dtYW4nLCAwKTtcbiAgaWYgKCFwcm9nbWFuUmF3KSB7XG4gICAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBQcm9nbWFuIG5vdCBmb3VuZCcpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwcm9nbWFuID0gdG9CaWdJbnQocHJvZ21hblJhdyk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBQcm9nbWFuOiAke3Byb2dtYW59YCk7XG5cbiAgLy8gMi4g5p+l5om+5aOB57q45bGCIFdvcmtlcldcbiAgY29uc3Qgd29ya2VyVyA9IGF3YWl0IGZpbmRXYWxscGFwZXJXb3JrZXJXKGxpYiwga29mZmksIHByb2dtYW4pO1xuXG4gIGlmICghd29ya2VyVykge1xuICAgIGNvbnNvbGUud2FybignW3dhbGxwYXBlcl0gV29ya2VyVyBub3QgZm91bmQsIGFib3J0Jyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFNldFBhcmVudCB0byBXb3JrZXJXOiAke3dvcmtlcld9YCk7XG5cbiAgLy8gMy4gU2V0UGFyZW50IOWIsCBXb3JrZXJXXG4gIGNvbnN0IHByZXZQYXJlbnQgPSBTZXRQYXJlbnQoaHduZCwgd29ya2VyVyk7XG4gIGNvbnN0IGVycjEgPSBHZXRMYXN0RXJyb3IoKTtcbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFNldFBhcmVudDogcHJldj0ke3ByZXZQYXJlbnR9LCBlcnI9JHtlcnIxfWApO1xuXG4gIC8vIDQuIFNldFBhcmVudCDlkI7orr7nva7nqpflj6PmoLflvI9cbiAgYXdhaXQgc2V0dXBXaW5kb3dTdHlsZShod25kLCB3b3JrZXJXKTtcbn1cblxuLyoqXG4gKiDmnoTlu7rlo4Hnurjnqpflj6PliqDovb3nmoQgVVJM77yI5pC65bim5LiO5Li756qX5Y+j55u45ZCM55qEIGVsZWN0cm9uIOWHreaNriArIHdhbGxwYXBlcj0xIOagh+iusO+8iVxuICovXG5mdW5jdGlvbiBidWlsZFdhbGxwYXBlclVybChkaXNwbGF5OiBfZWxlY3Ryb24uRGlzcGxheSk6IHN0cmluZyB7XG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoZ2V0V2Vidmlld09yaWdpbigpKTtcbiAgdXJsLnBhdGhuYW1lID0gJy9vYy8nO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnbW9kZScsICdlbGVjdHJvbicpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnc2hlbGxWZXJzaW9uJywgX19WRVJTSU9OX18pO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnZWxlY3Ryb25Qb3J0JywgZWxlY3Ryb25Qb3J0LnRvU3RyaW5nKCkpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnZWxlY3Ryb25Ub2tlbicsIGdsb2JhbFRoaXMuZWxlY3Ryb25Ub2tlbik7XG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KCd3YWxscGFwZXInLCAnMScpO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnZGlzcGxheUlkJywgU3RyaW5nKGRpc3BsYXkuaWQpKTtcbiAgcmV0dXJuIHVybC50b1N0cmluZygpO1xufVxuXG4vKipcbiAqIOS4uuaMh+WumuaYvuekuuWZqOWIm+W7uuWjgee6uOeql+WPo++8iOS4jeeri+WNsyBzaG9377yJXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdhbGxwYXBlcldpbmRvdyhkaXNwbGF5OiBfZWxlY3Ryb24uRGlzcGxheSk6IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93IHtcbiAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH0gPSBkaXNwbGF5LmJvdW5kcztcblxuICBjb25zdCBiYXNlT3B0aW9uczogX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3dDb25zdHJ1Y3Rvck9wdGlvbnMgPSB7XG4gICAgeCxcbiAgICB5LFxuICAgIHdpZHRoLFxuICAgIGhlaWdodCxcbiAgICBmcmFtZTogZmFsc2UsXG4gICAgc2hvdzogZmFsc2UsXG4gICAgc2tpcFRhc2tiYXI6IHRydWUsXG4gICAgaGFzU2hhZG93OiBmYWxzZSxcbiAgICBmb2N1c2FibGU6IGZhbHNlLFxuICAgIG1vdmFibGU6IGZhbHNlLFxuICAgIHJlc2l6YWJsZTogZmFsc2UsXG4gICAgbWluaW1pemFibGU6IGZhbHNlLFxuICAgIG1heGltaXphYmxlOiBmYWxzZSxcbiAgICBmdWxsc2NyZWVuYWJsZTogZmFsc2UsXG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIGRldlRvb2xzOiBmYWxzZSxcbiAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2UsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgc2FuZGJveDogdHJ1ZSxcbiAgICB9LFxuICB9O1xuXG4gIC8vIG1hY09T77yadHlwZTogJ2Rlc2t0b3AnIOWwhueql+WPo+e9ruS6juahjOmdouWbvuagh+S4i+WxglxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICBiYXNlT3B0aW9ucy50eXBlID0gJ2Rlc2t0b3AnO1xuICAgIGJhc2VPcHRpb25zLmVuYWJsZUxhcmdlclRoYW5TY3JlZW4gPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgd2luID0gbmV3IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3coYmFzZU9wdGlvbnMpO1xuXG4gIHdpbi53ZWJDb250ZW50cy5vbignd2lsbC1uYXZpZ2F0ZScsIChldmVudCwgdXJsKSA9PiB7XG4gICAgaWYgKHVybC5zdGFydHNXaXRoKGdldFdlYnZpZXdPcmlnaW4oKSkpIHJldHVybjtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbCh1cmwpO1xuICB9KTtcbiAgd2luLndlYkNvbnRlbnRzLnNldFdpbmRvd09wZW5IYW5kbGVyKCh7IHVybCB9KSA9PiB7XG4gICAgZWxlY3Ryb24uc2hlbGwub3BlbkV4dGVybmFsKHVybCk7XG4gICAgcmV0dXJuIHsgYWN0aW9uOiAnZGVueScgfTtcbiAgfSk7XG5cbiAgd2luLmxvYWRVUkwoYnVpbGRXYWxscGFwZXJVcmwoZGlzcGxheSkpO1xuXG4gIHJldHVybiB3aW47XG59XG5cbi8qKlxuICog6K6+572u5aOB57q477ya5Li65omA5pyJ5pi+56S65Zmo5Yib5bu65aOB57q456qX5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRXYWxscGFwZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGNhbmNlbFdhbGxwYXBlcigpO1xuXG4gIGNvbnN0IGRpc3BsYXlzID0gZWxlY3Ryb24uc2NyZWVuLmdldEFsbERpc3BsYXlzKCk7XG4gIGZvciAoY29uc3QgZGlzcGxheSBvZiBkaXNwbGF5cykge1xuICAgIGNvbnN0IHdpbiA9IGNyZWF0ZVdhbGxwYXBlcldpbmRvdyhkaXNwbGF5KTtcbiAgICB3YWxscGFwZXJXaW5kb3dzLnNldChkaXNwbGF5LmlkLCB3aW4pO1xuXG4gICAgLy8gV2luZG93c++8muWFiCBTZXRQYXJlbnQg5Yiw5qGM6Z2i5bGC77yM5YaNIHNob3dcbiAgICAvLyDov5nmoLfnqpflj6Pku47lh7rnlJ/lsLHmmK/moYzpnaLlsYLnmoTlrZDnqpflj6PvvIzkuI3kvJrooqsgV2luK0Qg5pyA5bCP5YyWXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIGF3YWl0IGF0dGFjaFRvRGVza3RvcExheWVyKHdpbik7XG4gICAgfVxuXG4gICAgd2luLnNob3dJbmFjdGl2ZSgpO1xuICB9XG5cbiAgLy8gV2luZG93c++8muWuieijhem8oOagh+mSqeWtkO+8jOi9rOWPkem8oOagh+S6i+S7tuWIsOWjgee6uOeql+WPo1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgIGF3YWl0IGluc3RhbGxNb3VzZUhvb2soKTtcbiAgICBhd2FpdCBpbnN0YWxsV2hlZWxIb29rKCk7XG4gIH1cbn1cblxuLyoqXG4gKiDlj5bmtojlo4HnurjvvJrplIDmr4HmiYDmnInlo4Hnurjnqpflj6NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbmNlbFdhbGxwYXBlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8g5YWI5Y246L296byg5qCH6ZKp5a2QXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgYXdhaXQgdW5pbnN0YWxsTW91c2VIb29rKCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgaWYgKCF3aW4uaXNEZXN0cm95ZWQoKSkgd2luLmRlc3Ryb3koKTtcbiAgfVxuICB3YWxscGFwZXJXaW5kb3dzLmNsZWFyKCk7XG59XG5cbi8qKlxuICog5aSE55CG5pi+56S65Zmo5Y+Y5YyW77ya5aOB57q45r+A5rS75pe25Yqo5oCB5aKe5Yig44CB6YeN5o6S56qX5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVEaXNwbGF5Q2hhbmdlKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgZGlzcGxheXMgPSBlbGVjdHJvbi5zY3JlZW4uZ2V0QWxsRGlzcGxheXMoKTtcbiAgY29uc3QgY3VycmVudElkcyA9IG5ldyBTZXQod2FsbHBhcGVyV2luZG93cy5rZXlzKCkpO1xuICBjb25zdCBuZXdJZHMgPSBuZXcgU2V0KGRpc3BsYXlzLm1hcCgoZCkgPT4gZC5pZCkpO1xuXG4gIGZvciAoY29uc3QgaWQgb2YgY3VycmVudElkcykge1xuICAgIGlmICghbmV3SWRzLmhhcyhpZCkpIHtcbiAgICAgIGNvbnN0IHdpbiA9IHdhbGxwYXBlcldpbmRvd3MuZ2V0KGlkKTtcbiAgICAgIGlmICh3aW4gJiYgIXdpbi5pc0Rlc3Ryb3llZCgpKSB3aW4uZGVzdHJveSgpO1xuICAgICAgd2FsbHBhcGVyV2luZG93cy5kZWxldGUoaWQpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgZGlzcGxheSBvZiBkaXNwbGF5cykge1xuICAgIGlmICghd2FsbHBhcGVyV2luZG93cy5oYXMoZGlzcGxheS5pZCkpIHtcbiAgICAgIGNvbnN0IHdpbiA9IGNyZWF0ZVdhbGxwYXBlcldpbmRvdyhkaXNwbGF5KTtcbiAgICAgIHdhbGxwYXBlcldpbmRvd3Muc2V0KGRpc3BsYXkuaWQsIHdpbik7XG5cbiAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIGF3YWl0IGF0dGFjaFRvRGVza3RvcExheWVyKHdpbik7XG4gICAgICB9XG5cbiAgICAgIHdpbi5zaG93SW5hY3RpdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd2luID0gd2FsbHBhcGVyV2luZG93cy5nZXQoZGlzcGxheS5pZCkhO1xuICAgICAgaWYgKCF3aW4uaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfSA9IGRpc3BsYXkuYm91bmRzO1xuICAgICAgICB3aW4uc2V0Qm91bmRzKHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiDojrflj5blvZPliY3lo4HnurjnirbmgIFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzV2FsbHBhcGVyQWN0aXZlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gd2FsbHBhcGVyV2luZG93cy5zaXplID4gMDtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g6byg5qCH5LqL5Lu26YCP5LygXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyDlo4Hnurjnqpflj6PkvY3kuo7moYzpnaLlm77moIflsYLkuIvmlrnvvIzpu5jorqTmjqXmlLbkuI3liLDpvKDmoIfkuovku7bjgIJcbi8vIOmAmui/h+i9ruivoiBHZXRBc3luY0tleVN0YXRlICsgc2NyZWVuLmdldEN1cnNvclNjcmVlblBvaW50IOiOt+WPlum8oOagh+eKtuaAge+8jFxuLy8g55SoIHdlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50IOazqOWFpeWIsOWjgee6uOeql+WPo+OAglxuXG4vKipcbiAqIOWuieijhem8oOagh+S6i+S7tumAj+S8oFxuICpcbiAqIOaWueahiO+8mueUqCBHZXRBc3luY0tleVN0YXRlIOi9ruivoum8oOagh+aMiemUrueKtuaAgSArIHNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCDojrflj5bpvKDmoIfkvY3nva7vvIxcbiAqIOmAmui/hyBFbGVjdHJvbiB3ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCDms6jlhaXliLDlo4Hnurjnqpflj6PjgIJcbiAqXG4gKiDkuI3kvb/nlKggV0hfTU9VU0VfTEwg5YWo5bGA6ZKp5a2Q77yM5Zug5Li6IGtvZmZpIOWbnuiwg+WcqCBFbGVjdHJvbiDkuLvov5vnqIvmtojmga/lvqrnjq/kuK3ml6Dms5XooqvmraPnoa7osIPluqbjgIJcbiAqIOi9ruivouaWueahiOeugOWNleWPr+mdoO+8jOS4lOWFvOWuueinpuaRuOWxj++8iOinpuaRuOS8muiiq+ezu+e7n+i9rOS4uum8oOagh+eKtuaAge+8ieOAglxuICovXG5cbmxldCBtb3VzZVBvbGxUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0Q3Vyc29yUG9zID0geyB4OiAtMSwgeTogLTEgfTtcbmxldCBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCBtaWRkbGU6IGZhbHNlIH07XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxNb3VzZUhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmIChtb3VzZVBvbGxUaW1lcikgcmV0dXJuO1xuXG4gIGNvbnN0IGxpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICBpZiAoIWxpYikgcmV0dXJuO1xuXG4gIGNvbnN0IEdldEFzeW5jS2V5U3RhdGUgPSBsaWIuZnVuYygnaW50MTYgR2V0QXN5bmNLZXlTdGF0ZShpbnQzMiB2S2V5KScpO1xuICBjb25zdCBHZXRGb3JlZ3JvdW5kV2luZG93ID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBHZXRGb3JlZ3JvdW5kV2luZG93KCknKTtcbiAgY29uc3QgR2V0Q2xhc3NOYW1lVyA9IGxpYi5mdW5jKCdpbnQzMiBHZXRDbGFzc05hbWVXKHVpbnRwdHJfdCBoV25kLCB2b2lkICpscENsYXNzTmFtZSwgaW50MzIgbk1heENvdW50KScpO1xuXG4gIC8vIOajgOafpeWJjeWPsOeql+WPo+aYr+WQpuaYr+ahjOmdou+8iFByb2dtYW4g5oiWIFdvcmtlclfvvIlcbiAgLy8g5Y+q5pyJ5qGM6Z2i5Zyo5YmN5Y+w5pe277yM5aOB57q45omN6ZyA6KaB5o6l5pS26byg5qCH5LqL5Lu2XG4gIGNvbnN0IGNsYXNzTmFtZUJ1ZiA9IEJ1ZmZlci5hbGxvYyg1MTIpO1xuICBjb25zdCBpc0Rlc2t0b3BGb3JlZ3JvdW5kID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgIGNsYXNzTmFtZUJ1Zi5maWxsKDApO1xuICAgIGNvbnN0IGZnID0gR2V0Rm9yZWdyb3VuZFdpbmRvdygpO1xuICAgIGlmICghZmcgfHwgZmcgPT09IDBuKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbGVuID0gR2V0Q2xhc3NOYW1lVyhmZywgY2xhc3NOYW1lQnVmLCAyNTYpO1xuICAgIGlmIChsZW4gPD0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGNscyA9IGNsYXNzTmFtZUJ1Zi50b1N0cmluZygndXRmMTZsZScsIDAsIGxlbiAqIDIpO1xuICAgIHJldHVybiBjbHMgPT09ICdQcm9nbWFuJyB8fCBjbHMgPT09ICdXb3JrZXJXJztcbiAgfTtcblxuICAvLyBWS19MQlVUVE9OPTB4MDEsIFZLX1JCVVRUT049MHgwMiwgVktfTUJVVFRPTj0weDA0XG4gIGNvbnN0IHBvbGxJbnRlcnZhbCA9IDQwOyAvLyB+MjVmcHNcblxuICBtb3VzZVBvbGxUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG5cbiAgICAvLyDmoYzpnaLkuI3lnKjliY3lj7Dml7bvvIzlo4Hnurjooqvpga7mjKHvvIzlhbPpl63kuqTkupJcbiAgICBpZiAoIWlzRGVza3RvcEZvcmVncm91bmQoKSkge1xuICAgICAgLy8g5rOo5YWlIG1vdXNlTW92ZSDliLDnqpflj6PkuK3lv4PvvIzop6blj5EgY2FudmFzLnZ1ZSDnmoTlm57mraPliqjnlLtcbiAgICAgIC8vIOWvueW6lCBQUE9DIOS4rSBvbk1vdXNlTGVhdmUg5oqKIHRhcmdldE1vdXNlWC9ZIOiuvuS4uiAwIOeahOihjOS4uu+8jFxuICAgICAgLy8gY2FudmFzLnZ1ZSDnmoTlvLnnsKfpmLvlsLzmqKHlnovkvJrlubPmu5HmioogY3VycmVudE1vdXNlWC9ZIOi/h+a4oeWIsCAwXG4gICAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICh3aW4uaXNEZXN0cm95ZWQoKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IHdpbi5nZXRCb3VuZHMoKTtcbiAgICAgICAgY29uc3QgY2VudGVyWCA9IE1hdGguZmxvb3IoYm91bmRzLndpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IGNlbnRlclkgPSBNYXRoLmZsb29yKGJvdW5kcy5oZWlnaHQgLyAyKTtcbiAgICAgICAgd2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHsgdHlwZTogJ21vdXNlTW92ZScsIHg6IGNlbnRlclgsIHk6IGNlbnRlclkgfSk7XG4gICAgICB9XG4gICAgICAvLyDph43nva7nirbmgIHvvIzpgb/lhY3kuIvmrKHliIfmjaLliLDliY3lj7Dml7bkuqfnlJ/or6/op6blj5HnmoQgZG93bi91cFxuICAgICAgbGFzdEN1cnNvclBvcyA9IHsgeDogLTEsIHk6IC0xIH07XG4gICAgICBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCBtaWRkbGU6IGZhbHNlIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8g6K+75Y+W5oyJ6ZSu54q25oCB77yIR2V0QXN5bmNLZXlTdGF0ZSDmnIDpq5jkvY3kuLogMSDooajnpLrmjInkuIvvvIlcbiAgICBjb25zdCBsZWZ0RG93biA9IChHZXRBc3luY0tleVN0YXRlKDB4MDEpICYgMHg4MDAwKSAhPT0gMDtcbiAgICBjb25zdCByaWdodERvd24gPSAoR2V0QXN5bmNLZXlTdGF0ZSgweDAyKSAmIDB4ODAwMCkgIT09IDA7XG4gICAgY29uc3QgbWlkZGxlRG93biA9IChHZXRBc3luY0tleVN0YXRlKDB4MDQpICYgMHg4MDAwKSAhPT0gMDtcblxuICAgIC8vIOiOt+WPlum8oOagh+S9jee9rlxuICAgIGNvbnN0IHBvcyA9IGVsZWN0cm9uLnNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCgpO1xuXG4gICAgLy8g5om+5Yiw6byg5qCH5omA5Zyo5pi+56S65Zmo55qE5aOB57q456qX5Y+jXG4gICAgbGV0IHRhcmdldFdpbjogX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICBpZiAod2luLmlzRGVzdHJveWVkKCkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgYm91bmRzID0gd2luLmdldEJvdW5kcygpO1xuICAgICAgaWYgKHBvcy54ID49IGJvdW5kcy54ICYmIHBvcy54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICBwb3MueSA+PSBib3VuZHMueSAmJiBwb3MueSA8IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCkge1xuICAgICAgICB0YXJnZXRXaW4gPSB3aW47XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGFyZ2V0V2luKSB7XG4gICAgICAvLyDpvKDmoIfkuI3lnKjku7vkvZXlo4Hnurjnqpflj6PkuIrvvIzmm7TmlrDnirbmgIHkvYbkuI3ovazlj5FcbiAgICAgIGxhc3RDdXJzb3JQb3MgPSBwb3M7XG4gICAgICBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBsZWZ0RG93biwgcmlnaHQ6IHJpZ2h0RG93biwgbWlkZGxlOiBtaWRkbGVEb3duIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm91bmRzID0gdGFyZ2V0V2luLmdldEJvdW5kcygpO1xuICAgIGNvbnN0IHggPSBwb3MueCAtIGJvdW5kcy54O1xuICAgIGNvbnN0IHkgPSBwb3MueSAtIGJvdW5kcy55O1xuXG4gICAgLy8g6byg5qCH56e75YqoXG4gICAgaWYgKHBvcy54ICE9PSBsYXN0Q3Vyc29yUG9zLnggfHwgcG9zLnkgIT09IGxhc3RDdXJzb3JQb3MueSkge1xuICAgICAgdGFyZ2V0V2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHsgdHlwZTogJ21vdXNlTW92ZScsIHgsIHkgfSk7XG4gICAgfVxuXG4gICAgLy8g5bem6ZSuXG4gICAgaWYgKGxlZnREb3duICE9PSBsYXN0QnV0dG9uU3RhdGVzLmxlZnQpIHtcbiAgICAgIHRhcmdldFdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgIHR5cGU6IGxlZnREb3duID8gJ21vdXNlRG93bicgOiAnbW91c2VVcCcsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGJ1dHRvbjogJ2xlZnQnLFxuICAgICAgICBjbGlja0NvdW50OiAxLFxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIOWPs+mUrlxuICAgIGlmIChyaWdodERvd24gIT09IGxhc3RCdXR0b25TdGF0ZXMucmlnaHQpIHtcbiAgICAgIHRhcmdldFdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgIHR5cGU6IHJpZ2h0RG93biA/ICdtb3VzZURvd24nIDogJ21vdXNlVXAnLFxuICAgICAgICB4LCB5LFxuICAgICAgICBidXR0b246ICdyaWdodCcsXG4gICAgICAgIGNsaWNrQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8g5Lit6ZSuXG4gICAgaWYgKG1pZGRsZURvd24gIT09IGxhc3RCdXR0b25TdGF0ZXMubWlkZGxlKSB7XG4gICAgICB0YXJnZXRXaW4ud2ViQ29udGVudHMuc2VuZElucHV0RXZlbnQoe1xuICAgICAgICB0eXBlOiBtaWRkbGVEb3duID8gJ21vdXNlRG93bicgOiAnbW91c2VVcCcsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGJ1dHRvbjogJ21pZGRsZScsXG4gICAgICAgIGNsaWNrQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsYXN0Q3Vyc29yUG9zID0gcG9zO1xuICAgIGxhc3RCdXR0b25TdGF0ZXMgPSB7IGxlZnQ6IGxlZnREb3duLCByaWdodDogcmlnaHREb3duLCBtaWRkbGU6IG1pZGRsZURvd24gfTtcbiAgfSwgcG9sbEludGVydmFsKTtcblxuICBjb25zb2xlLmxvZygnW3dhbGxwYXBlcl0gTW91c2UgcG9sbCBzdGFydGVkICg0MG1zIGludGVydmFsLCBkZXNrdG9wLW9ubHkpJyk7XG59XG5cbi8qKlxuICog5a6J6KOF6byg5qCH5rua6L2u6YCP5LygXG4gKlxuICog5rua6L2u5peg5rOV6YCa6L+HIEdldEFzeW5jS2V5U3RhdGUg6L2u6K+i6I635Y+W77yI5piv5LqL5Lu26ICM6Z2e54q25oCB77yJ44CCXG4gKiDmlrnmoYjvvJrnlKggUmF3SW5wdXQgKyBob29rV2luZG93TWVzc2FnZShXTV9JTlBVVCkgKyBHZXRSYXdJbnB1dERhdGHjgIJcbiAqXG4gKiDlhbPplK7ngrnvvJpcbiAqIC0g55SoIFJJREVWX0lOUFVUU0lOSyDms6jlhowgUmF3SW5wdXQg5Yiw5Li756qX5Y+j77yI5Y2z5L2/5Li756qX5Y+j5LiN5Zyo5YmN5Y+w5Lmf5o6l5pS26L6T5YWl77yJXG4gKiAtIE1TRE4g5piO56Gu6KeE5a6aIFJJREVWX05PUVVFVUUg5LiN6IO95LiOIFJJREVWX0lOUFVUU0lOSyDnu4TlkIjvvIzmiYDku6Xkuovku7bkvJrku6UgV01fSU5QVVQg5oqV6YCSXG4gKiAtIEVsZWN0cm9uIOeahCBob29rV2luZG93TWVzc2FnZSBjYWxsYmFjayDlnKggVUkg57q/56iL5ZCM5q2l5omn6KGM77yI6YCa6L+HIHY4OjpMb2NrZXLvvInvvIxcbiAqICAgSFJBV0lOUFVUIOWPpeafhOWcqCBjYWxsYmFjayDmnJ/pl7Tku43nhLbmnInmlYjvvIzlj6/ku6XlronlhajosIPnlKggR2V0UmF3SW5wdXREYXRhXG4gKiAtIGNhbGxiYWNrIOS4reWGjeasoeajgOafpeWJjeWPsOeql+WPo+aYr+WQpuS4uuahjOmdou+8iFByb2dtYW4vV29ya2VyV++8ie+8jOmBv+WFjemdnuahjOmdouWcuuaZr+ivr+inpuWPkVxuICpcbiAqIOS4u+eql+WPo+awuOi/nOWtmOWcqO+8iGNsb3NlIOiiq+aLpuaIquS4uiBoaWRl77yJ77yM5piv5rOo5YaMIFJhd0lucHV0IOeahOeQhuaDs+i9veS9k+OAglxuICovXG5sZXQgd2hlZWxIb29rSW5zdGFsbGVkID0gZmFsc2U7XG5sZXQgd2hlZWxIb29rTWFpbldpbjogX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsID0gbnVsbDtcbmxldCBnZXRSYXdJbnB1dERhdGFGbjogKChoUmF3SW5wdXQ6IGJpZ2ludCwgdWlDb21tYW5kOiBudW1iZXIsIHBEYXRhOiBCdWZmZXIgfCBudWxsLCBwY2JTaXplOiBCdWZmZXIsIGNiU2l6ZUhlYWRlcjogbnVtYmVyKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuOiAoKCkgPT4gYmlnaW50KSB8IG51bGwgPSBudWxsO1xubGV0IGdldENsYXNzTmFtZVdGbjogKChoV25kOiBiaWdpbnQsIGxwQ2xhc3NOYW1lOiBCdWZmZXIsIG5NYXhDb3VudDogbnVtYmVyKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5jb25zdCBXTV9JTlBVVCA9IDB4MDBGRjtcbmNvbnN0IFJJRF9JTlBVVCA9IDB4MTAwMDAwMDM7XG5jb25zdCBSSU1fVFlQRU1PVVNFID0gMDtcbmNvbnN0IFJJX01PVVNFX1dIRUVMID0gMHgwNDAwO1xuY29uc3QgUkFXSU5QVVRIRUFERVJfU0laRSA9IDI0O1xuXG4vLyDlpI3nlKggQnVmZmVyIOmBv+WFjeavj+asoSBjYWxsYmFjayDliIbphY1cbmNvbnN0IHJhd0lucHV0RGF0YUJ1ZiA9IEJ1ZmZlci5hbGxvYygxMDI0KTtcbmNvbnN0IHJhd0lucHV0U2l6ZUJ1ZiA9IEJ1ZmZlci5hbGxvYyg0KTtcbmNvbnN0IGNsYXNzTmFtZUJ1ZldoZWVsID0gQnVmZmVyLmFsbG9jKDUxMik7XG5cbmZ1bmN0aW9uIGlzRGVza3RvcEZvcmVncm91bmRCeVdpbjMyKCk6IGJvb2xlYW4ge1xuICBpZiAoIWdldEZvcmVncm91bmRXaW5kb3dGbiB8fCAhZ2V0Q2xhc3NOYW1lV0ZuKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGZnID0gZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuKCk7XG4gIGlmICghZmcgfHwgZmcgPT09IDBuKSByZXR1cm4gZmFsc2U7XG4gIGNsYXNzTmFtZUJ1ZldoZWVsLmZpbGwoMCk7XG4gIGNvbnN0IGxlbiA9IGdldENsYXNzTmFtZVdGbihmZywgY2xhc3NOYW1lQnVmV2hlZWwsIDI1Nik7XG4gIGlmIChsZW4gPD0gMCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbHMgPSBjbGFzc05hbWVCdWZXaGVlbC50b1N0cmluZygndXRmMTZsZScsIDAsIGxlbiAqIDIpO1xuICByZXR1cm4gY2xzID09PSAnUHJvZ21hbicgfHwgY2xzID09PSAnV29ya2VyVyc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxXaGVlbEhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmICh3aGVlbEhvb2tJbnN0YWxsZWQpIHJldHVybjtcblxuICBjb25zdCBtYWluV2luID0gYXdhaXQgZ2V0V2Vidmlld1dpbmRvdygpO1xuICBpZiAobWFpbldpbi5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XG5cbiAgY29uc3QgbGliID0gYXdhaXQgbG9hZFdpbjMyTGliKCk7XG4gIGlmICghbGliKSByZXR1cm47XG5cbiAgY29uc3QgUmVnaXN0ZXJSYXdJbnB1dERldmljZXMgPSBsaWIuZnVuYygndWludDMyIFJlZ2lzdGVyUmF3SW5wdXREZXZpY2VzKHZvaWQgKnBSYXdJbnB1dERldmljZXMsIHVpbnQzMiB1aU51bURldmljZXMsIHVpbnQzMiBjYlNpemUpJyk7XG4gIGdldFJhd0lucHV0RGF0YUZuID0gbGliLmZ1bmMoJ3VpbnQzMiBHZXRSYXdJbnB1dERhdGEodWludHB0cl90IGhSYXdJbnB1dCwgdWludDMyIHVpQ29tbWFuZCwgdm9pZCAqcERhdGEsIHZvaWQgKnBjYlNpemUsIHVpbnQzMiBjYlNpemVIZWFkZXIpJyk7XG4gIGdldEZvcmVncm91bmRXaW5kb3dGbiA9IGxpYi5mdW5jKCd1aW50cHRyX3QgR2V0Rm9yZWdyb3VuZFdpbmRvdygpJyk7XG4gIGdldENsYXNzTmFtZVdGbiA9IGxpYi5mdW5jKCdpbnQzMiBHZXRDbGFzc05hbWVXKHVpbnRwdHJfdCBoV25kLCB2b2lkICpscENsYXNzTmFtZSwgaW50MzIgbk1heENvdW50KScpO1xuXG4gIGNvbnN0IGtvZmZpRm9yRXJyID0gYXdhaXQgbG9hZEtvZmZpKCk7XG4gIGlmICgha2VybmVsMzJMaWIpIGtlcm5lbDMyTGliID0ga29mZmlGb3JFcnIubG9hZCgna2VybmVsMzIuZGxsJyk7XG4gIGNvbnN0IEdldExhc3RFcnJvciA9IGtlcm5lbDMyTGliLmZ1bmMoJ3VpbnQzMiBHZXRMYXN0RXJyb3IoKScpO1xuXG4gIGNvbnN0IG1haW5Id25kID0gcmVhZEh3bmQobWFpbldpbi5nZXROYXRpdmVXaW5kb3dIYW5kbGUoKSk7XG5cbiAgLy8gUkFXSU5QVVRERVZJQ0U6IHVzVXNhZ2VQYWdlKDIpICsgdXNVc2FnZSgyKSArIGR3RmxhZ3MoNCkgKyBod25kVGFyZ2V0KDgpID0gMTYgYnl0ZXNcbiAgY29uc3QgcmlkID0gQnVmZmVyLmFsbG9jKDE2KTtcbiAgcmlkLndyaXRlVUludDE2TEUoMHgwMSwgMCk7IC8vIHVzVXNhZ2VQYWdlID0gR2VuZXJpYyBEZXNrdG9wXG4gIHJpZC53cml0ZVVJbnQxNkxFKDB4MDIsIDIpOyAvLyB1c1VzYWdlID0gTW91c2VcbiAgcmlkLndyaXRlVUludDMyTEUoMHgwMDAwMDEwMCwgNCk7IC8vIFJJREVWX0lOUFVUU0lOSyBvbmx5XG4gIHJpZC53cml0ZUJpZ1VJbnQ2NExFKG1haW5Id25kLCA4KTsgLy8gaHduZFRhcmdldFxuXG4gIGNvbnN0IG9rID0gUmVnaXN0ZXJSYXdJbnB1dERldmljZXMocmlkLCAxLCAxNik7XG4gIGNvbnN0IGVyciA9IEdldExhc3RFcnJvcigpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUmVnaXN0ZXJSYXdJbnB1dERldmljZXM6IG9rPSR7b2t9IGVycj0ke2Vycn1gKTtcbiAgaWYgKG9rID09PSAwKSB7XG4gICAgY29uc29sZS53YXJuKGBbd2FsbHBhcGVyXSBSZWdpc3RlclJhd0lucHV0RGV2aWNlcyBmYWlsZWRgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGVlbEhvb2tNYWluV2luID0gbWFpbldpbjtcbiAgbGV0IHdoZWVsRXZlbnRDb3VudCA9IDA7XG5cbiAgbWFpbldpbi5ob29rV2luZG93TWVzc2FnZShXTV9JTlBVVCwgKHdQYXJhbTogQnVmZmVyLCBsUGFyYW06IEJ1ZmZlcikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG4gICAgICAvLyDlj6rlnKjmoYzpnaLkuLrliY3lj7Dml7bovazlj5Hmu5rova7vvIjkuI7pvKDmoIfpgI/kvKDkv53mjIHkuIDoh7TvvIlcbiAgICAgIGlmICghaXNEZXNrdG9wRm9yZWdyb3VuZEJ5V2luMzIoKSkgcmV0dXJuO1xuICAgICAgaWYgKCFnZXRSYXdJbnB1dERhdGFGbikgcmV0dXJuO1xuXG4gICAgICAvLyBsUGFyYW0g5pivIEhSQVdJTlBVVCDlj6Xmn4TvvIg2NCDkvY3ns7vnu5/kuLogOCDlrZfoioLvvIlcbiAgICAgIGNvbnN0IGhSYXdJbnB1dCA9IGxQYXJhbS5sZW5ndGggPj0gOCA/IGxQYXJhbS5yZWFkQmlnVUludDY0TEUoMCkgOiBCaWdJbnQobFBhcmFtLnJlYWRVSW50MzJMRSgwKSk7XG5cbiAgICAgIC8vIOiwg+eUqCBHZXRSYXdJbnB1dERhdGEg6K+75Y+W5pWw5o2uXG4gICAgICByYXdJbnB1dFNpemVCdWYud3JpdGVVSW50MzJMRShyYXdJbnB1dERhdGFCdWYubGVuZ3RoLCAwKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdldFJhd0lucHV0RGF0YUZuKGhSYXdJbnB1dCwgUklEX0lOUFVULCByYXdJbnB1dERhdGFCdWYsIHJhd0lucHV0U2l6ZUJ1ZiwgUkFXSU5QVVRIRUFERVJfU0laRSk7XG5cbiAgICAgIGlmIChyZXN1bHQgPT09IDAgfHwgcmVzdWx0ID09PSAweEZGRkZGRkZGKSB7XG4gICAgICAgIC8vIOS7heWcqOWIneasoeWksei0peaXtuiusOW9le+8jOmBv+WFjeaXpeW/l+WIt+Wxj1xuICAgICAgICBpZiAod2hlZWxFdmVudENvdW50ID09PSAwKSB7XG4gICAgICAgICAgY29uc3QgbGFzdEVyciA9IEdldExhc3RFcnJvcigpO1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW3dhbGxwYXBlcl0gR2V0UmF3SW5wdXREYXRhIGZhaWxlZDogcmVzdWx0PSR7cmVzdWx0fSBlcnI9JHtsYXN0RXJyfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZHdUeXBlID0gcmF3SW5wdXREYXRhQnVmLnJlYWRVSW50MzJMRSgwKTtcbiAgICAgIGlmIChkd1R5cGUgIT09IFJJTV9UWVBFTU9VU0UpIHJldHVybjtcblxuICAgICAgLy8gUkFXTU9VU0Ug57Sn5o6lIFJBV0lOUFVUSEVBREVS77yaXG4gICAgICAvLyAgIHVzRmxhZ3MoMC0yKSArIHBhZGRpbmcoMi00KSArIHVsQnV0dG9ucyDogZTlkIjkvZMoNC04KSArIHVsUmF3QnV0dG9ucyg4LTEyKSArIGxMYXN0WCgxMi0xNikgKyBsTGFzdFkoMTYtMjApICsgZHdFeHRyYUluZm8oMjAtMjQpXG4gICAgICBjb25zdCB1bEJ1dHRvbnMgPSByYXdJbnB1dERhdGFCdWYucmVhZFVJbnQzMkxFKFJBV0lOUFVUSEVBREVSX1NJWkUgKyA0KTtcbiAgICAgIGNvbnN0IHVzQnV0dG9uRmxhZ3MgPSB1bEJ1dHRvbnMgJiAweGZmZmY7XG5cbiAgICAgIGlmICgodXNCdXR0b25GbGFncyAmIFJJX01PVVNFX1dIRUVMKSAhPT0gMCkge1xuICAgICAgICBjb25zdCB1c0J1dHRvbkRhdGFSYXcgPSAodWxCdXR0b25zID4+PiAxNikgJiAweGZmZmY7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdXNCdXR0b25EYXRhUmF3ID4gMHg3ZmZmID8gdXNCdXR0b25EYXRhUmF3IC0gMHgxMDAwMCA6IHVzQnV0dG9uRGF0YVJhdztcblxuICAgICAgICB3aGVlbEV2ZW50Q291bnQrKztcbiAgICAgICAgaWYgKHdoZWVsRXZlbnRDb3VudCA8PSAzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFdoZWVsIGV2ZW50OiBkZWx0YT0ke2RlbHRhfSAoY291bnQ9JHt3aGVlbEV2ZW50Q291bnR9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L2s5Y+R5Yiw6byg5qCH5omA5Zyo5pi+56S65Zmo55qE5aOB57q456qX5Y+jXG4gICAgICAgIGNvbnN0IHBvcyA9IGVsZWN0cm9uLnNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCgpO1xuICAgICAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICAgICAgaWYgKHdpbi5pc0Rlc3Ryb3llZCgpKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBib3VuZHMgPSB3aW4uZ2V0Qm91bmRzKCk7XG4gICAgICAgICAgaWYgKHBvcy54ID49IGJvdW5kcy54ICYmIHBvcy54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICAgICAgcG9zLnkgPj0gYm91bmRzLnkgJiYgcG9zLnkgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpIHtcbiAgICAgICAgICAgIHdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdtb3VzZVdoZWVsJyxcbiAgICAgICAgICAgICAgeDogcG9zLnggLSBib3VuZHMueCxcbiAgICAgICAgICAgICAgeTogcG9zLnkgLSBib3VuZHMueSxcbiAgICAgICAgICAgICAgZGVsdGFYOiAwLFxuICAgICAgICAgICAgICBkZWx0YVk6IGRlbHRhLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbd2FsbHBhcGVyXSBXTV9JTlBVVCBjYWxsYmFjayBlcnJvcjonLCBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHdoZWVsSG9va0luc3RhbGxlZCA9IHRydWU7XG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBXaGVlbCBob29rIGluc3RhbGxlZCAoV01fSU5QVVQgaG9vayBtb2RlKScpO1xufVxuXG4vKipcbiAqIOWNuOi9vem8oOagh+i9ruivolxuICovXG5hc3luYyBmdW5jdGlvbiB1bmluc3RhbGxNb3VzZUhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmIChtb3VzZVBvbGxUaW1lcikge1xuICAgIGNsZWFySW50ZXJ2YWwobW91c2VQb2xsVGltZXIpO1xuICAgIG1vdXNlUG9sbFRpbWVyID0gbnVsbDtcbiAgfVxuICBsYXN0Q3Vyc29yUG9zID0geyB4OiAtMSwgeTogLTEgfTtcbiAgbGFzdEJ1dHRvblN0YXRlcyA9IHsgbGVmdDogZmFsc2UsIHJpZ2h0OiBmYWxzZSwgbWlkZGxlOiBmYWxzZSB9O1xuXG4gIC8vIOWNuOi9vea7mui9riBob29rXG4gIGlmICh3aGVlbEhvb2tNYWluV2luICYmICF3aGVlbEhvb2tNYWluV2luLmlzRGVzdHJveWVkKCkpIHtcbiAgICB0cnkge1xuICAgICAgd2hlZWxIb29rTWFpbldpbi51bmhvb2tXaW5kb3dNZXNzYWdlKFdNX0lOUFVUKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgd2hlZWxIb29rSW5zdGFsbGVkID0gZmFsc2U7XG4gIHdoZWVsSG9va01haW5XaW4gPSBudWxsO1xuICBnZXRSYXdJbnB1dERhdGFGbiA9IG51bGw7XG4gIGdldEZvcmVncm91bmRXaW5kb3dGbiA9IG51bGw7XG4gIGdldENsYXNzTmFtZVdGbiA9IG51bGw7XG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBNb3VzZSBwb2xsIHN0b3BwZWQnKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFLQSxJQUFNLG1DQUFtQixJQUFJLElBQXFDO0FBR2xFLElBQUksV0FBMkQ7QUFDL0QsSUFBSSxjQUE4RDtBQUNsRSxJQUFJLFNBQXlEO0FBRzdELElBQUksdUJBQXdFO0FBRTVFLGVBQWUsWUFBWTtDQUN6QixNQUFNLE1BQU0sTUFBTSxPQUFPO0NBRXpCLE9BQVEsSUFBNkMsV0FBVztBQUNsRTtBQUVBLGVBQWUsZUFBZTtDQUM1QixJQUFJLFFBQVEsYUFBYSxTQUFTLE9BQU87Q0FDekMsSUFBSSxDQUFDLFVBRUgsWUFBVyxNQURTLFVBQVUsRUFBQSxDQUNiLEtBQUssWUFBWTtDQUVwQyxPQUFPO0FBQ1Q7Ozs7OztBQU9BLFNBQVMsU0FBUyxLQUFxQjtDQUNyQyxJQUFJLElBQUksVUFBVSxHQUNoQixPQUFPLE9BQU8sSUFBSSxhQUFhLENBQUMsQ0FBQztDQUVuQyxPQUFPLElBQUksZ0JBQWdCLENBQUM7QUFDOUI7Ozs7QUFLQSxTQUFTLFNBQVMsR0FBNEI7Q0FDNUMsT0FBTyxPQUFPLE1BQU0sV0FBVyxJQUFJLE9BQU8sQ0FBQztBQUM3Qzs7OztBQUtBLGVBQWUsNEJBQTRCLE1BQTZCO0NBQ3RFLElBQUksUUFBUSxhQUFhLFNBQVM7Q0FFbEMsSUFBSTtFQUNGLE1BQU0sUUFBUSxNQUFNLFVBQVU7RUFDOUIsSUFBSSxDQUFDLFFBQVEsU0FBUyxNQUFNLEtBQUssWUFBWTtFQUM3QyxNQUFNLHdCQUF3QixPQUFPLEtBQUssMEZBQTBGO0VBRXBJLE1BQU0saUNB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