import { a as getWebviewWindow, d as __VERSION__, i as getWebviewOrigin } from "../index.js";
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
* 判定桌面 wallpaper 是否被前台窗口完全覆盖（最大化窗口、独占全屏、Win+D 后的全屏应用等）。
* 任何 Win32 调用失败时返回 false（保持原透传行为，宁可多浪费 CPU 也不要误判导致壁纸失活）。
*/
var desktopObscureCheckLib = null;
var gfwFn = null;
var gwrFn = null;
var mfwFn = null;
var gmiFn = null;
var gcnFn = null;
async function isDesktopObscured() {
	if (process.platform !== "win32") return false;
	try {
		if (!desktopObscureCheckLib) desktopObscureCheckLib = await loadWin32Lib();
		if (!desktopObscureCheckLib) return false;
		if (!gfwFn) gfwFn = desktopObscureCheckLib.func("uintptr_t GetForegroundWindow()");
		if (!gwrFn) gwrFn = desktopObscureCheckLib.func("int32 GetWindowRect(uintptr_t hWnd, _Out_ void *lpRect)");
		if (!mfwFn) mfwFn = desktopObscureCheckLib.func("uintptr_t MonitorFromWindow(uintptr_t hwnd, uint32 dwFlags)");
		if (!gmiFn) gmiFn = desktopObscureCheckLib.func("int32 GetMonitorInfoW(uintptr_t hMonitor, _Out_ void *lpmi)");
		if (!gcnFn) gcnFn = desktopObscureCheckLib.func("int32 GetClassNameW(uintptr_t hWnd, void *lpClassName, int32 nMaxCount)");
		const fgRaw = gfwFn();
		if (!fgRaw || fgRaw === 0) return false;
		const fg = toBigInt(fgRaw);
		const clsBuf = Buffer.alloc(512);
		clsBuf.fill(0);
		const clsLen = gcnFn(fg, clsBuf, 256);
		if (clsLen > 0) {
			const cls = clsBuf.toString("utf16le", 0, clsLen * 2);
			if (cls === "Progman" || cls === "WorkerW") return false;
		}
		const miBuf = Buffer.alloc(40);
		miBuf.writeUInt32LE(40, 0);
		const monRaw = mfwFn(fg, 0);
		if (!monRaw || monRaw === 0) return false;
		const mon = toBigInt(monRaw);
		if (gmiFn(mon, miBuf) === 0) return false;
		const monLeft = miBuf.readInt32LE(20);
		const monTop = miBuf.readInt32LE(24);
		const monRight = miBuf.readInt32LE(28);
		const monBottom = miBuf.readInt32LE(32);
		const rectBuf = Buffer.alloc(16);
		if (gwrFn(fg, rectBuf) === 0) return false;
		const wLeft = rectBuf.readInt32LE(0);
		const wTop = rectBuf.readInt32LE(4);
		const wRight = rectBuf.readInt32LE(8);
		const wBottom = rectBuf.readInt32LE(12);
		return wLeft <= monLeft && wTop <= monTop && wRight >= monRight && wBottom >= monBottom;
	} catch {
		return false;
	}
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
		thickFrame: false,
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
			sandbox: true,
			backgroundThrottling: false
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
var obscureCheckTimer = null;
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
	let desktopObscured = false;
	const pollInterval = 40;
	obscureCheckTimer = setInterval(() => {
		isDesktopObscured().then((v) => {
			desktopObscured = v;
		});
	}, 250);
	mousePollTimer = setInterval(() => {
		if (wallpaperWindows.size === 0) return;
		if (!isDesktopForeground()) {
			lastCursorPos = {
				x: -1,
				y: -1
			};
			lastButtonStates = {
				left: false,
				right: false,
				middle: false
			};
			if (desktopObscured) return;
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
	}, pollInterval);
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
	if (obscureCheckTimer) {
		clearInterval(obscureCheckTimer);
		obscureCheckTimer = null;
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbHBhcGVyLUJxVXAzbjlsLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC91dGlscy93YWxscGFwZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBfZWxlY3Ryb24gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgX19WRVJTSU9OX18gfSBmcm9tICcuLi9fX1ZFUlNJT05fXyc7XG5pbXBvcnQgeyBnZXRXZWJ2aWV3T3JpZ2luLCBnZXRXZWJ2aWV3V2luZG93IH0gZnJvbSAnLi9lbGVjdHJvbi50cyc7XG5cbi8vIOWjgee6uOeql+WPoyBNYXDvvJpkaXNwbGF5SWQg4oaSIEJyb3dzZXJXaW5kb3dcbmNvbnN0IHdhbGxwYXBlcldpbmRvd3MgPSBuZXcgTWFwPG51bWJlciwgX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3c+KCk7XG5cbi8vIFdpbmRvd3Mg5LiT55So77yaa29mZmkg5bu26L+f5Yqg6L2977yI5LuFIFdpbmRvd3Mg5bmz5Y+w5L2/55So77yJXG5sZXQgd2luMzJMaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xubGV0IGtlcm5lbDMyTGliOiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykubG9hZD4gfCBudWxsID0gbnVsbDtcbmxldCBkd21MaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xuXG4vLyBrb2ZmaSDnsbvlnovlrprkuYnnvJPlrZjvvIjpgb/lhY3ph43lpI3ms6jlhozlr7zoh7QgRHVwbGljYXRlIHR5cGUgbmFtZSDplJnor6/vvIlcbmxldCBlbnVtV2luZG93c1Byb2NQcm90bzogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLnByb3RvPiB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkS29mZmkoKSB7XG4gIGNvbnN0IG1vZCA9IGF3YWl0IGltcG9ydCgna29mZmknKTtcbiAgLy8gQ0pTIOaooeWdl+WcqCBFU00g5Lit6YCa6L+HIGRlZmF1bHQg6K6/6ZeuIG1vZHVsZS5leHBvcnRzXG4gIHJldHVybiAobW9kIGFzIHsgZGVmYXVsdD86IHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykgfSkuZGVmYXVsdCA/PyBtb2Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRXaW4zMkxpYigpIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybiBudWxsO1xuICBpZiAoIXdpbjMyTGliKSB7XG4gICAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgICB3aW4zMkxpYiA9IGtvZmZpLmxvYWQoJ3VzZXIzMi5kbGwnKTtcbiAgfVxuICByZXR1cm4gd2luMzJMaWI7XG59XG5cbi8qKlxuICog5Yik5a6a5qGM6Z2iIHdhbGxwYXBlciDmmK/lkKbooqvliY3lj7Dnqpflj6Plrozlhajopobnm5bvvIjmnIDlpKfljJbnqpflj6PjgIHni6zljaDlhajlsY/jgIFXaW4rRCDlkI7nmoTlhajlsY/lupTnlKjnrYnvvInjgIJcbiAqIOS7u+S9lSBXaW4zMiDosIPnlKjlpLHotKXml7bov5Tlm54gZmFsc2XvvIjkv53mjIHljp/pgI/kvKDooYzkuLrvvIzlroHlj6/lpJrmtarotLkgQ1BVIOS5n+S4jeimgeivr+WIpOWvvOiHtOWjgee6uOWksea0u++8ieOAglxuICovXG5sZXQgZGVza3RvcE9ic2N1cmVDaGVja0xpYjogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLmxvYWQ+IHwgbnVsbCA9IG51bGw7XG5sZXQgZ2Z3Rm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ3dyRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgbWZ3Rm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ21pRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ2NuRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGlzRGVza3RvcE9ic2N1cmVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuIGZhbHNlO1xuICB0cnkge1xuICAgIGlmICghZGVza3RvcE9ic2N1cmVDaGVja0xpYikgZGVza3RvcE9ic2N1cmVDaGVja0xpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICAgIGlmICghZGVza3RvcE9ic2N1cmVDaGVja0xpYikgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghZ2Z3Rm4pIGdmd0ZuID0gZGVza3RvcE9ic2N1cmVDaGVja0xpYi5mdW5jKCd1aW50cHRyX3QgR2V0Rm9yZWdyb3VuZFdpbmRvdygpJyk7XG4gICAgaWYgKCFnd3JGbikgZ3dyRm4gPSBkZXNrdG9wT2JzY3VyZUNoZWNrTGliLmZ1bmMoJ2ludDMyIEdldFdpbmRvd1JlY3QodWludHB0cl90IGhXbmQsIF9PdXRfIHZvaWQgKmxwUmVjdCknKTtcbiAgICBpZiAoIW1md0ZuKSBtZndGbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygndWludHB0cl90IE1vbml0b3JGcm9tV2luZG93KHVpbnRwdHJfdCBod25kLCB1aW50MzIgZHdGbGFncyknKTtcbiAgICBpZiAoIWdtaUZuKSBnbWlGbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygnaW50MzIgR2V0TW9uaXRvckluZm9XKHVpbnRwdHJfdCBoTW9uaXRvciwgX091dF8gdm9pZCAqbHBtaSknKTtcbiAgICBpZiAoIWdjbkZuKSBnY25GbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygnaW50MzIgR2V0Q2xhc3NOYW1lVyh1aW50cHRyX3QgaFduZCwgdm9pZCAqbHBDbGFzc05hbWUsIGludDMyIG5NYXhDb3VudCknKTtcblxuICAgIGNvbnN0IGZnUmF3ID0gZ2Z3Rm4oKTtcbiAgICBpZiAoIWZnUmF3IHx8IGZnUmF3ID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgZmcgPSB0b0JpZ0ludChmZ1Jhdyk7XG5cbiAgICAvLyDmoYzpnaLoh6rouqvlnKjliY3lj7DvvJrmnKrpga7kvY9cbiAgICBjb25zdCBjbHNCdWYgPSBCdWZmZXIuYWxsb2MoNTEyKTtcbiAgICBjbHNCdWYuZmlsbCgwKTtcbiAgICBjb25zdCBjbHNMZW4gPSBnY25GbihmZywgY2xzQnVmLCAyNTYpO1xuICAgIGlmIChjbHNMZW4gPiAwKSB7XG4gICAgICBjb25zdCBjbHMgPSBjbHNCdWYudG9TdHJpbmcoJ3V0ZjE2bGUnLCAwLCBjbHNMZW4gKiAyKTtcbiAgICAgIGlmIChjbHMgPT09ICdQcm9nbWFuJyB8fCBjbHMgPT09ICdXb3JrZXJXJykgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIE1PTklUT1JJTkZPOiBEV09SRCBjYlNpemUoNCkgKyBSRUNUIHJjTW9uaXRvcigxNikgKyBSRUNUIHJjV29yaygxNikgKyBEV09SRCBkd0ZsYWdzKDQpID0gNDAgYnl0ZXNcbiAgICBjb25zdCBtaUJ1ZiA9IEJ1ZmZlci5hbGxvYyg0MCk7XG4gICAgbWlCdWYud3JpdGVVSW50MzJMRSg0MCwgMCk7XG4gICAgY29uc3QgbW9uUmF3ID0gbWZ3Rm4oZmcsIDAgLyogTU9OSVRPUl9ERUZBVUxUVE9OVUxMICovKTtcbiAgICBpZiAoIW1vblJhdyB8fCBtb25SYXcgPT09IDApIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBtb24gPSB0b0JpZ0ludChtb25SYXcpO1xuICAgIGlmIChnbWlGbihtb24sIG1pQnVmKSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIC8vIHJjV29yayDkvY3kuo4gcmNNb25pdG9yIOS5i+WQju+8iOWBj+enuyAyMO+8ie+8muacgOWkp+WMlueql+WPo+eahCBHZXRXaW5kb3dSZWN0IOetieS6jiByY1dvcmvvvIjkuI3lkKvku7vliqHmoI/vvInvvIxcbiAgICAvLyDnlKggcmNNb25pdG9yIOavlOWvueS8muaKiuacgOWkp+WMlueql+WPo+WIpOS4uuacqumBruaMoe+8jOaVheS7pSByY1dvcmsg5Li65YeGXG4gICAgY29uc3QgbW9uTGVmdCA9IG1pQnVmLnJlYWRJbnQzMkxFKDIwKTtcbiAgICBjb25zdCBtb25Ub3AgPSBtaUJ1Zi5yZWFkSW50MzJMRSgyNCk7XG4gICAgY29uc3QgbW9uUmlnaHQgPSBtaUJ1Zi5yZWFkSW50MzJMRSgyOCk7XG4gICAgY29uc3QgbW9uQm90dG9tID0gbWlCdWYucmVhZEludDMyTEUoMzIpO1xuXG4gICAgLy8gUkVDVDogbGVmdCg0KSArIHRvcCg0KSArIHJpZ2h0KDQpICsgYm90dG9tKDQpXG4gICAgY29uc3QgcmVjdEJ1ZiA9IEJ1ZmZlci5hbGxvYygxNik7XG4gICAgaWYgKGd3ckZuKGZnLCByZWN0QnVmKSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHdMZWZ0ID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSgwKTtcbiAgICBjb25zdCB3VG9wID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSg0KTtcbiAgICBjb25zdCB3UmlnaHQgPSByZWN0QnVmLnJlYWRJbnQzMkxFKDgpO1xuICAgIGNvbnN0IHdCb3R0b20gPSByZWN0QnVmLnJlYWRJbnQzMkxFKDEyKTtcblxuICAgIC8vIOWJjeWPsOeql+WPo+efqeW9ouWujOWFqOimhuebluWFtuaJgOWcqOaYvuekuuWZqOeahCByY1dvcmvvvIjlkKvmnIDlpKfljJbnqpflj6PvvInvvJrliKTlrprkuLrlrozlhajpga7mjKHmoYzpnaJcbiAgICByZXR1cm4gd0xlZnQgPD0gbW9uTGVmdCAmJiB3VG9wIDw9IG1vblRvcCAmJiB3UmlnaHQgPj0gbW9uUmlnaHQgJiYgd0JvdHRvbSA+PSBtb25Cb3R0b207XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIOS7jiBCdWZmZXIg6K+75Y+WIEhXTkQg5oyH6ZKI5YC8XG4gKiBFbGVjdHJvbiDnmoQgZ2V0TmF0aXZlV2luZG93SGFuZGxlIOWcqCA2NCDkvY3ns7vnu5/ov5Tlm54gOCDlrZfoioIgQnVmZmVy77yMMzIg5L2N6L+U5ZueIDQg5a2X6IqCXG4gKiDnu5/kuIDov5Tlm54gQmlnSW50IOmBv+WFjeeyvuW6pumXrumimFxuICovXG5mdW5jdGlvbiByZWFkSHduZChidWY6IEJ1ZmZlcik6IGJpZ2ludCB7XG4gIGlmIChidWYubGVuZ3RoIDw9IDQpIHtcbiAgICByZXR1cm4gQmlnSW50KGJ1Zi5yZWFkVUludDMyTEUoMCkpO1xuICB9XG4gIHJldHVybiBidWYucmVhZEJpZ1VJbnQ2NExFKDApO1xufVxuXG4vKipcbiAqIOWwhuWAvOi9rOaNouS4uiBCaWdJbnTvvIhrb2ZmaSDnmoQgdWludHB0cl90IOWcqCA2NCDkvY3ns7vnu5/ov5Tlm54gbnVtYmVyIOaIliBCaWdJbnTvvIlcbiAqL1xuZnVuY3Rpb24gdG9CaWdJbnQodjogYmlnaW50IHwgbnVtYmVyKTogYmlnaW50IHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSAnYmlnaW50JyA/IHYgOiBCaWdJbnQodik7XG59XG5cbi8qKlxuICog56aB55SoIFdpbjExIERXTSDpu5jorqTlnIbop5LvvIzpgb/lhY3lo4Hnurjnqpflj6PovrnnvJjooqvoo4HliIdcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGlzYWJsZVdpbmRvd1JvdW5kZWRDb3JuZXJzKGh3bmQ6IGJpZ2ludCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xuXG4gIHRyeSB7XG4gICAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgICBpZiAoIWR3bUxpYikgZHdtTGliID0ga29mZmkubG9hZCgnZHdtYXBpLmRsbCcpO1xuICAgIGNvbnN0IER3bVNldFdpbmRvd0F0dHJpYnV0ZSA9IGR3bUxpYi5mdW5jKCdsb25nIER3bVNldFdpbmRvd0F0dHJpYnV0ZSh1aW50cHRyX3QgaHduZCwgdWludDMyIGF0dHIsIHZvaWQgKnZhbHVlLCB1aW50MzIgY2JBdHRyaWJ1dGUpJyk7XG5cbiAgICBjb25zdCBEV01XQV9XSU5ET1dfQ09STkVSX1BSRUZFUkVOQ0UgPSAzMztcbiAgICBjb25zdCBEV01XQ1BfRE9OT1RST1VORCA9IDE7XG4gICAgY29uc3QgdmFsdWVCdWYgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgdmFsdWVCdWYud3JpdGVVSW50MzJMRShEV01XQ1BfRE9OT1RST1VORCwgMCk7XG4gICAgRHdtU2V0V2luZG93QXR0cmlidXRlKGh3bmQsIERXTVdBX1dJTkRPV19DT1JORVJfUFJFRkVSRU5DRSwgdmFsdWVCdWYsIDQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBGYWlsZWQgdG8gZGlzYWJsZSByb3VuZGVkIGNvcm5lcnM6JywgZSk7XG4gIH1cbn1cblxuLyoqXG4gKiDorr7nva7nqpflj6PkuLrml6DovrnmoYbjgIHml6DlnIbop5LjgIHpk7rmu6HniLbnqpflj6NcbiAqIOW/hemhu+WcqCBTZXRQYXJlbnQg5LmL5ZCO6LCD55So77yM6K6+572uIFdTX0NISUxEIOetieagt+W8j1xuICovXG5hc3luYyBmdW5jdGlvbiBzZXR1cFdpbmRvd1N0eWxlKGh3bmQ6IGJpZ2ludCwgcGFyZW50SHduZDogYmlnaW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG5cbiAgY29uc3QgbGliID0gYXdhaXQgbG9hZFdpbjMyTGliKCk7XG4gIGlmICghbGliKSByZXR1cm47XG5cbiAgY29uc3QgR2V0V2luZG93TG9uZ1B0clcgPSBsaWIuZnVuYygnaW50cHRyX3QgR2V0V2luZG93TG9uZ1B0clcodWludHB0cl90IGhXbmQsIGludDMyIG5JbmRleCknKTtcbiAgY29uc3QgU2V0V2luZG93TG9uZ1B0clcgPSBsaWIuZnVuYygnaW50cHRyX3QgU2V0V2luZG93TG9uZ1B0clcodWludHB0cl90IGhXbmQsIGludDMyIG5JbmRleCwgaW50cHRyX3QgZHdOZXdMb25nKScpO1xuICBjb25zdCBTZXRXaW5kb3dQb3MgPSBsaWIuZnVuYygnaW50MzIgU2V0V2luZG93UG9zKHVpbnRwdHJfdCBoV25kLCB1aW50cHRyX3QgaFduZEluc2VydEFmdGVyLCBpbnQzMiBYLCBpbnQzMiBZLCBpbnQzMiBjeCwgaW50MzIgY3ksIHVpbnQzMiB1RmxhZ3MpJyk7XG4gIGNvbnN0IEdldENsaWVudFJlY3QgPSBsaWIuZnVuYygnaW50MzIgR2V0Q2xpZW50UmVjdCh1aW50cHRyX3QgaFduZCwgX091dF8gdm9pZCAqbHBSZWN0KScpO1xuXG4gIGNvbnN0IEdXTF9TVFlMRSA9IC0xNjtcbiAgY29uc3QgR1dMX0VYU1RZTEUgPSAtMjA7XG5cbiAgLy8g56qX5Y+j5qC35byP5L2NXG4gIGNvbnN0IFdTX0NISUxEID0gMHg0MDAwMDAwMG47XG4gIGNvbnN0IFdTX1ZJU0lCTEUgPSAweDEwMDAwMDAwbjtcbiAgY29uc3QgV1NfQ0xJUFNJQkxJTkdTID0gMHgwNDAwMDAwMG47XG4gIGNvbnN0IFdTX0NMSVBDSElMRFJFTiA9IDB4MDIwMDAwMDBuO1xuICAvLyDpnIDopoHnp7vpmaTnmoTmoLflvI/vvJpXU19QT1BVUCB8IFdTX0JPUkRFUiB8IFdTX1RISUNLRlJBTUUgfCBXU19ETEdGUkFNRSB8IFdTX1NZU01FTlUg562JXG4gIGNvbnN0IHJlbW92ZU1hc2sgPSB+KDB4ODAwMDAwMDBuIHwgMHgwMDgwMDAwMG4gfCAweDAwMDQwMDAwbiB8IDB4MDBjMDAwMDBuIHwgMHgwMDA4MDAwMG4pO1xuXG4gIC8vIOaJqeWxleagt+W8j1xuICBjb25zdCBXU19FWF9UT09MV0lORE9XID0gMHgwMDAwMDA4MG47XG4gIGNvbnN0IFdTX0VYX05PQUNUSVZBVEUgPSAweDA4MDAwMDAwbjtcbiAgY29uc3QgV1NfRVhfQVBQV0lORE9XX01BU0sgPSB+MHgwMDA0MDAwMG47XG4gIGNvbnN0IFdTX0VYX0xBWUVSRURfTUFTSyA9IH4weDAwMDgwMDAwbjtcblxuICAvLyBTZXRXaW5kb3dQb3Mg5qCH5b+XXG4gIGNvbnN0IFNXUF9GUkFNRUNIQU5HRSA9IDB4MDAyMDtcbiAgY29uc3QgU1dQX1NIT1dXSU5ET1cgPSAweDAwNDA7XG4gIC8vIEhXTkRfQk9UVE9NID0gMe+8jOWwhueql+WPo+aUvuWIsCBaIOmhuuW6j+W6lemDqO+8iOWcqCBTSEVMTERMTF9EZWZWaWV3IOS5i+S4i++8iVxuICBjb25zdCBIV05EX0JPVFRPTSA9IDE7XG5cbiAgLy8gMS4g5L+u5pS556qX5Y+j5qC35byP77ya56e76Zmk5qCH6aKYL+i+ueahhu+8jOa3u+WKoCBXU19DSElMRO+8iFNldFBhcmVudCDlkI7miY3og73orr7nva7vvIlcbiAgY29uc3QgY3VycmVudFN0eWxlID0gQmlnSW50KEdldFdpbmRvd0xvbmdQdHJXKGh3bmQsIEdXTF9TVFlMRSkpO1xuICBsZXQgbmV3U3R5bGUgPSBjdXJyZW50U3R5bGUgJiByZW1vdmVNYXNrO1xuICBuZXdTdHlsZSA9IG5ld1N0eWxlIHwgV1NfQ0hJTEQgfCBXU19WSVNJQkxFIHwgV1NfQ0xJUFNJQkxJTkdTIHwgV1NfQ0xJUENISUxEUkVOO1xuICBTZXRXaW5kb3dMb25nUHRyVyhod25kLCBHV0xfU1RZTEUsIG5ld1N0eWxlKTtcblxuICAvLyAyLiDkv67mlLnmianlsZXmoLflvI9cbiAgY29uc3QgY3VycmVudEV4U3R5bGUgPSBCaWdJbnQoR2V0V2luZG93TG9uZ1B0clcoaHduZCwgR1dMX0VYU1RZTEUpKTtcbiAgbGV0IG5ld0V4U3R5bGUgPSAoY3VycmVudEV4U3R5bGUgJiBXU19FWF9BUFBXSU5ET1dfTUFTSykgJiBXU19FWF9MQVlFUkVEX01BU0s7XG4gIG5ld0V4U3R5bGUgPSBuZXdFeFN0eWxlIHwgV1NfRVhfVE9PTFdJTkRPVyB8IFdTX0VYX05PQUNUSVZBVEU7XG4gIFNldFdpbmRvd0xvbmdQdHJXKGh3bmQsIEdXTF9FWFNUWUxFLCBuZXdFeFN0eWxlKTtcblxuICAvLyAzLiDnpoHnlKjlnIbop5JcbiAgYXdhaXQgZGlzYWJsZVdpbmRvd1JvdW5kZWRDb3JuZXJzKGh3bmQpO1xuXG4gIC8vIDQuIOiOt+WPlueItueql+WPo+WuouaIt+WMuuWwuuWvuO+8jOmTuua7oVxuICBjb25zdCByZWN0QnVmID0gQnVmZmVyLmFsbG9jKDE2KTtcbiAgR2V0Q2xpZW50UmVjdChwYXJlbnRId25kLCByZWN0QnVmKTtcbiAgY29uc3QgcmVjdFJpZ2h0ID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSg4KTtcbiAgY29uc3QgcmVjdEJvdHRvbSA9IHJlY3RCdWYucmVhZEludDMyTEUoMTIpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUGFyZW50IGNsaWVudCByZWN0OiAke3JlY3RSaWdodH14JHtyZWN0Qm90dG9tfWApO1xuXG4gIC8vIDUuIOiwg+aVtOeql+WPo+S9jee9ruWSjOWwuuWvuO+8jOW5tuaUvuWIsCBaIOmhuuW6j+W6lemDqO+8iEhXTkRfQk9UVE9N77yJXG4gIC8vIOS4jeS9v+eUqCBTV1BfTk9aT1JERVLvvIzorqkgaFduZEluc2VydEFmdGVyID0gSFdORF9CT1RUT00g55Sf5pWIXG4gIC8vIOi/meagt+Wjgee6uOeql+WPo+WcqCBTSEVMTERMTF9EZWZWaWV377yI5qGM6Z2i5Zu+5qCH77yJ5LmL5LiLXG4gIFNldFdpbmRvd1Bvcyhod25kLCBIV05EX0JPVFRPTSwgMCwgMCwgcmVjdFJpZ2h0LCByZWN0Qm90dG9tLCBTV1BfRlJBTUVDSEFOR0UgfCBTV1BfU0hPV1dJTkRPVyk7XG59XG5cbi8qKlxuICog5p+l5om+5aOB57q45bGCIFdvcmtlcldcbiAqXG4gKiBXaW5kb3dzIDExIOS4iiAweDA1MkMg5Y+v6IO95LiN6Kem5Y+R5YiG6KOC77yM5L2GIFByb2dtYW4g5YaF6YOo6YCa5bi45bey5pyJ5LiA5LiqIFdvcmtlclcg5a2Q56qX5Y+jXG4gKiDvvIjnlKjkuo7lo4HnurjmuLLmn5PvvInjgILov5nkuKogV29ya2VyVyDlsLHmmK/miJHku6zopoEgU2V0UGFyZW50IOeahOebruagh+OAglxuICpcbiAqIOetlueVpe+8mlxuICogMS4g5YWI5ZyoIFByb2dtYW4g5YaF6YOo5p+l5om+IFdvcmtlclcg5a2Q56qX5Y+jXG4gKiAyLiDlpoLmnpzmib7kuI3liLDvvIzlj5HpgIEgMHgwNTJDIOinpuWPkeWIhuijgu+8jOWGjeWcqOmhtuWxgiBXb3JrZXJXIOS4reafpeaJvlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kV2FsbHBhcGVyV29ya2VyVyhcbiAgbGliOiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykubG9hZD4sXG4gIGtvZmZpOiB0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLFxuICBwcm9nbWFuOiBiaWdpbnRcbik6IFByb21pc2U8YmlnaW50IHwgbnVsbD4ge1xuICBjb25zdCBGaW5kV2luZG93RXhXID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBGaW5kV2luZG93RXhXKHVpbnRwdHJfdCBod25kUGFyZW50LCB1aW50cHRyX3QgaHduZENoaWxkQWZ0ZXIsIHN0cjE2IGxwc3pDbGFzcywgc3RyMTYgbHBzeldpbmRvdyknKTtcblxuICAvLyAxLiDlhYjlnKggUHJvZ21hbiDlhoXpg6jmn6Xmib4gV29ya2VyVyDlrZDnqpflj6PvvIhXaW5kb3dzIDExIOW4uOingeaDheWGte+8iVxuICBjb25zdCB3b3JrZXJXSW5Qcm9nbWFuUmF3ID0gRmluZFdpbmRvd0V4Vyhwcm9nbWFuLCAwLCAnV29ya2VyVycsIDApO1xuICBpZiAod29ya2VyV0luUHJvZ21hblJhdykge1xuICAgIGNvbnN0IHdvcmtlclcgPSB0b0JpZ0ludCh3b3JrZXJXSW5Qcm9nbWFuUmF3KTtcbiAgICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gRm91bmQgV29ya2VyVyBpbnNpZGUgUHJvZ21hbjogJHt3b3JrZXJXfWApO1xuICAgIHJldHVybiB3b3JrZXJXO1xuICB9XG5cbiAgLy8gMi4gUHJvZ21hbiDlhoXpg6jmsqHmnIkgV29ya2VyV++8jOWwneivleWPkemAgSAweDA1MkMg6Kem5Y+R5YiG6KOCXG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBObyBXb3JrZXJXIGluIFByb2dtYW4sIHNlbmRpbmcgMHgwNTJDIHRvIHRyaWdnZXIgc3BsaXQuLi4nKTtcbiAgY29uc3QgU2VuZE1lc3NhZ2VUaW1lb3V0VyA9IGxpYi5mdW5jKCdpbnRwdHJfdCBTZW5kTWVzc2FnZVRpbWVvdXRXKHVpbnRwdHJfdCBoV25kLCB1aW50MzIgbXNnLCB1aW50cHRyX3Qgd1BhcmFtLCBpbnRwdHJfdCBsUGFyYW0sIHVpbnQzMiBmdUZsYWdzLCB1aW50MzIgdVRpbWVvdXQsIF9PdXRfIGludHB0cl90ICpscGR3UmVzdWx0KScpO1xuICBjb25zdCByZXN1bHQgPSBbMG5dO1xuICBTZW5kTWVzc2FnZVRpbWVvdXRXKHByb2dtYW4sIDB4MDUyYywgMG4sIDBuLCAweDAwMDAsIDIwMDAsIHJlc3VsdCk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZW5kTWVzc2FnZVRpbWVvdXRXIDB4MDUyQyByZXN1bHQ6ICR7cmVzdWx0WzBdfWApO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMCkpO1xuXG4gIC8vIDMuIOWGjeasoeafpeaJviBQcm9nbWFuIOWGhemDqOeahCBXb3JrZXJXXG4gIGNvbnN0IHdvcmtlcldJblByb2dtYW5SYXcyID0gRmluZFdpbmRvd0V4Vyhwcm9nbWFuLCAwLCAnV29ya2VyVycsIDApO1xuICBpZiAod29ya2VyV0luUHJvZ21hblJhdzIpIHtcbiAgICBjb25zdCB3b3JrZXJXID0gdG9CaWdJbnQod29ya2VyV0luUHJvZ21hblJhdzIpO1xuICAgIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBGb3VuZCBXb3JrZXJXIGluc2lkZSBQcm9nbWFuIGFmdGVyIDB4MDUyQzogJHt3b3JrZXJXfWApO1xuICAgIHJldHVybiB3b3JrZXJXO1xuICB9XG5cbiAgLy8gNC4g5pyA5ZCO5Zue6YCA77ya5Zyo6aG25bGC56qX5Y+j5Lit5p+l5om+5LiN5ZCrIFNIRUxMRExMX0RlZlZpZXcg55qEIFdvcmtlcldcbiAgaWYgKCFlbnVtV2luZG93c1Byb2NQcm90bykge1xuICAgIGVudW1XaW5kb3dzUHJvY1Byb3RvID0ga29mZmkucHJvdG8oJ2Jvb2wgX19zdGRjYWxsIEVudW1XaW5kb3dzUHJvYyh1aW50cHRyX3QgaHduZCwgbG9uZyBsUGFyYW0pJyk7XG4gIH1cbiAgY29uc3QgRW51bVdpbmRvd3MgPSBsaWIuZnVuYygnYm9vbCBFbnVtV2luZG93cyhFbnVtV2luZG93c1Byb2MgKmNiLCBsb25nIGxQYXJhbSknKTtcblxuICBsZXQgZGVmVmlld1BhcmVudDogYmlnaW50IHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGZpbmRDYiA9ICh0b3BIYW5kbGVSYXc6IGJpZ2ludCB8IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IHRvcEhhbmRsZSA9IHRvQmlnSW50KHRvcEhhbmRsZVJhdyk7XG4gICAgY29uc3Qgc2hlbGxWaWV3ID0gRmluZFdpbmRvd0V4Vyh0b3BIYW5kbGUsIDAsICdTSEVMTERMTF9EZWZWaWV3JywgMCk7XG4gICAgaWYgKHNoZWxsVmlldykge1xuICAgICAgZGVmVmlld1BhcmVudCA9IHRvcEhhbmRsZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIGNvbnN0IGNiUmVnID0ga29mZmkucmVnaXN0ZXIoZmluZENiLCBrb2ZmaS5wb2ludGVyKGVudW1XaW5kb3dzUHJvY1Byb3RvKSk7XG4gIEVudW1XaW5kb3dzKGNiUmVnLCAwKTtcbiAga29mZmkudW5yZWdpc3RlcihjYlJlZyk7XG5cbiAgaWYgKCFkZWZWaWV3UGFyZW50KSB7XG4gICAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBTSEVMTERMTF9EZWZWaWV3IG5vdCBmb3VuZCcpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTSEVMTERMTF9EZWZWaWV3IHBhcmVudDogJHtkZWZWaWV3UGFyZW50fWApO1xuXG4gIGxldCBjdXJyZW50OiBiaWdpbnQgPSBkZWZWaWV3UGFyZW50O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICBjb25zdCBuZXh0UmF3ID0gRmluZFdpbmRvd0V4VygwLCBjdXJyZW50LCAnV29ya2VyVycsIDApO1xuICAgIGlmICghbmV4dFJhdykgYnJlYWs7XG4gICAgY29uc3QgbmV4dCA9IHRvQmlnSW50KG5leHRSYXcpO1xuICAgIGNvbnN0IGNoaWxkID0gRmluZFdpbmRvd0V4VyhuZXh0LCAwLCAnU0hFTExETExfRGVmVmlldycsIDApO1xuICAgIGlmICghY2hpbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBGb3VuZCB3YWxscGFwZXIgV29ya2VyVyAodG9wLWxldmVsKTogJHtuZXh0fWApO1xuICAgICAgcmV0dXJuIG5leHQ7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBuZXh0O1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBXYWxscGFwZXIgV29ya2VyVyBub3QgZm91bmQnKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogV2luZG93c++8muWwhuWjgee6uOeql+WPoyBTZXRQYXJlbnQg5Yiw5qGM6Z2i5aOB57q45bGCIFdvcmtlcldcbiAqXG4gKiDmraPnoa7mtYHnqIvvvIhXYWxscGFwZXIgRW5naW5lIOagh+WHhuWBmuazle+8ie+8mlxuICogMS4g5ZCRIFByb2dtYW4g5Y+R6YCBIDB4MDUyQyDmtojmga/vvIzop6blj5HliIboo4Llh7ogV29ya2VyV1xuICogMi4g5om+5Yiw5aOB57q45bGCIFdvcmtlclfvvIhTSEVMTERMTF9EZWZWaWV3IOeahOWFhOW8nyBXb3JrZXJX77yM5LiN5ZCrIERlZlZpZXfvvIlcbiAqIDMuIFNldFBhcmVudCDliLDov5nkuKogV29ya2VyV1xuICpcbiAqIOWIhuijguWQjuahjOmdouWbvuagh+Wxgu+8iFNIRUxMRExMX0RlZlZpZXfvvInlkozlo4HnurjlsYLvvIhXb3JrZXJX77yJ5piv5YWE5byf5YWz57O777yMXG4gKiDlo4HnurjlsYLlnKjlm77moIflsYLkuIvmlrnvvIznlKjmiLfnnIvliLDnmoTmmK/lo4HnurggKyDlm77moIflj6DliqBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gYXR0YWNoVG9EZXNrdG9wTGF5ZXIod2luOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xuXG4gIGNvbnN0IGxpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICBpZiAoIWxpYikgcmV0dXJuO1xuXG4gIGNvbnN0IGtvZmZpID0gYXdhaXQgbG9hZEtvZmZpKCk7XG4gIGNvbnN0IEZpbmRXaW5kb3dXID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBGaW5kV2luZG93VyhzdHIxNiBjbGFzc05hbWUsIHN0cjE2IHdpbmRvd05hbWUpJyk7XG4gIGNvbnN0IEZpbmRXaW5kb3dFeFcgPSBsaWIuZnVuYygndWludHB0cl90IEZpbmRXaW5kb3dFeFcodWludHB0cl90IGh3bmRQYXJlbnQsIHVpbnRwdHJfdCBod25kQ2hpbGRBZnRlciwgc3RyMTYgbHBzekNsYXNzLCBzdHIxNiBscHN6V2luZG93KScpO1xuICBjb25zdCBTZW5kTWVzc2FnZVRpbWVvdXRXID0gbGliLmZ1bmMoJ2ludHB0cl90IFNlbmRNZXNzYWdlVGltZW91dFcodWludHB0cl90IGhXbmQsIHVpbnQzMiBtc2csIHVpbnRwdHJfdCB3UGFyYW0sIGludHB0cl90IGxQYXJhbSwgdWludDMyIGZ1RmxhZ3MsIHVpbnQzMiB1VGltZW91dCwgX091dF8gaW50cHRyX3QgKmxwZHdSZXN1bHQpJyk7XG4gIGNvbnN0IFNldFBhcmVudCA9IGxpYi5mdW5jKCd1aW50cHRyX3QgU2V0UGFyZW50KHVpbnRwdHJfdCBoV25kQ2hpbGQsIHVpbnRwdHJfdCBoV25kTmV3UGFyZW50KScpO1xuXG4gIGlmICgha2VybmVsMzJMaWIpIHtcbiAgICBrZXJuZWwzMkxpYiA9IGtvZmZpLmxvYWQoJ2tlcm5lbDMyLmRsbCcpO1xuICB9XG4gIGNvbnN0IEdldExhc3RFcnJvciA9IGtlcm5lbDMyTGliLmZ1bmMoJ3VpbnQzMiBHZXRMYXN0RXJyb3IoKScpO1xuXG4gIC8vIOa1i+ivleeUqO+8muWcqCB3YWxscGFwZXIg5r+A5rS75pe26I635Y+W5LiA5qyhIEdldExhc3RFcnJvciDln7rnur9cblxuICBjb25zdCBod25kID0gcmVhZEh3bmQod2luLmdldE5hdGl2ZVdpbmRvd0hhbmRsZSgpKTtcbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIEF0dGFjaGluZyB3aW5kb3cgSFdORD0ke2h3bmR9YCk7XG5cbiAgLy8gMS4g5om+5YiwIFByb2dtYW5cbiAgY29uc3QgcHJvZ21hblJhdyA9IEZpbmRXaW5kb3dXKCdQcm9nbWFuJywgMCk7XG4gIGlmICghcHJvZ21hblJhdykge1xuICAgIGNvbnNvbGUud2FybignW3dhbGxwYXBlcl0gUHJvZ21hbiBub3QgZm91bmQnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvZ21hbiA9IHRvQmlnSW50KHByb2dtYW5SYXcpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUHJvZ21hbjogJHtwcm9nbWFufWApO1xuXG4gIC8vIDIuIOafpeaJvuWjgee6uOWxgiBXb3JrZXJXXG4gIGNvbnN0IHdvcmtlclcgPSBhd2FpdCBmaW5kV2FsbHBhcGVyV29ya2VyVyhsaWIsIGtvZmZpLCBwcm9nbWFuKTtcblxuICBpZiAoIXdvcmtlclcpIHtcbiAgICBjb25zb2xlLndhcm4oJ1t3YWxscGFwZXJdIFdvcmtlclcgbm90IGZvdW5kLCBhYm9ydCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZXRQYXJlbnQgdG8gV29ya2VyVzogJHt3b3JrZXJXfWApO1xuXG4gIC8vIDMuIFNldFBhcmVudCDliLAgV29ya2VyV1xuICBjb25zdCBwcmV2UGFyZW50ID0gU2V0UGFyZW50KGh3bmQsIHdvcmtlclcpO1xuICBjb25zdCBlcnIxID0gR2V0TGFzdEVycm9yKCk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZXRQYXJlbnQ6IHByZXY9JHtwcmV2UGFyZW50fSwgZXJyPSR7ZXJyMX1gKTtcblxuICAvLyA0LiBTZXRQYXJlbnQg5ZCO6K6+572u56qX5Y+j5qC35byPXG4gIGF3YWl0IHNldHVwV2luZG93U3R5bGUoaHduZCwgd29ya2VyVyk7XG59XG5cbi8qKlxuICog5p6E5bu65aOB57q456qX5Y+j5Yqg6L2955qEIFVSTO+8iOaQuuW4puS4juS4u+eql+WPo+ebuOWQjOeahCBlbGVjdHJvbiDlh63mja4gKyB3YWxscGFwZXI9MSDmoIforrDvvIlcbiAqL1xuZnVuY3Rpb24gYnVpbGRXYWxscGFwZXJVcmwoZGlzcGxheTogX2VsZWN0cm9uLkRpc3BsYXkpOiBzdHJpbmcge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKGdldFdlYnZpZXdPcmlnaW4oKSk7XG4gIHVybC5wYXRobmFtZSA9ICcvb2MvJztcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ21vZGUnLCAnZWxlY3Ryb24nKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3NoZWxsVmVyc2lvbicsIF9fVkVSU0lPTl9fKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uUG9ydCcsIGVsZWN0cm9uUG9ydC50b1N0cmluZygpKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uVG9rZW4nLCBnbG9iYWxUaGlzLmVsZWN0cm9uVG9rZW4pO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnd2FsbHBhcGVyJywgJzEnKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2Rpc3BsYXlJZCcsIFN0cmluZyhkaXNwbGF5LmlkKSk7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiDkuLrmjIflrprmmL7npLrlmajliJvlu7rlo4Hnurjnqpflj6PvvIjkuI3nq4vljbMgc2hvd++8iVxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxscGFwZXJXaW5kb3coZGlzcGxheTogX2VsZWN0cm9uLkRpc3BsYXkpOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyB7XG4gIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gZGlzcGxheS5ib3VuZHM7XG5cbiAgY29uc3QgYmFzZU9wdGlvbnM6IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93Q29uc3RydWN0b3JPcHRpb25zID0ge1xuICAgIHgsXG4gICAgeSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgZnJhbWU6IGZhbHNlLFxuICAgIC8vIEVsZWN0cm9uIOaXoOi+ueahhueql+WPo+m7mOiupCB0aGlja0ZyYW1lOiB0cnVl77yMV2luZG93cyDkvJrkv53nlZnkuI3lj6/op4HnmoTnvKnmlL7ovrnmoYbvvIjpnZ7lrqLmiLfljLrvvInjgIJcbiAgICAvLyBTZXRQYXJlbnQg5YiwIFdvcmtlclcg5ZCO5a6i5oi35Yy65LuN5q+U56qX5Y+j55+p5b2i5bCPIDdweO+8jOWjgee6uOW3puS+py/lj7Pkvqcv5bqV6YOo5Lya5ryP5Ye65qGM6Z2i6IOM5pmv44CCXG4gICAgdGhpY2tGcmFtZTogZmFsc2UsXG4gICAgc2hvdzogZmFsc2UsXG4gICAgc2tpcFRhc2tiYXI6IHRydWUsXG4gICAgaGFzU2hhZG93OiBmYWxzZSxcbiAgICBmb2N1c2FibGU6IGZhbHNlLFxuICAgIG1vdmFibGU6IGZhbHNlLFxuICAgIHJlc2l6YWJsZTogZmFsc2UsXG4gICAgbWluaW1pemFibGU6IGZhbHNlLFxuICAgIG1heGltaXphYmxlOiBmYWxzZSxcbiAgICBmdWxsc2NyZWVuYWJsZTogZmFsc2UsXG4gICAgd2ViUHJlZmVyZW5jZXM6IHtcbiAgICAgIGRldlRvb2xzOiBmYWxzZSxcbiAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2UsXG4gICAgICBjb250ZXh0SXNvbGF0aW9uOiB0cnVlLFxuICAgICAgc2FuZGJveDogdHJ1ZSxcbiAgICAgIC8vIOWjgee6uOeql+WPoyBTZXRQYXJlbnQg5YiwIFdvcmtlclcg5LmL5LiL77yMQ2hyb21pdW0g5Lya5oyJIGhpZGRlbiDlpITnkIblubbmioogckFGIOiKgua1geWIsCAxSHrvvIxcbiAgICAgIC8vIOWvvOiHtCBjYW52YXMudnVlIOeahCBkcmF3IOavj+enkuWPquiDvei3keS4gOasoeOAgeWNleW4p+imgeWBmuWujOaVtCA3IOWxgumHjee7mO+8jOinhuiniemZjeWIsCAxfjNmcHPjgIJcbiAgICAgIC8vIOWFs+aOiSBiYWNrZ3JvdW5kVGhyb3R0bGluZyDorqkgdmlzaWJpbGl0eVN0YXRlIOe7tOaMgSB2aXNpYmxl44CBckFGIOWbnuWIsCB+NjBIeuOAglxuICAgICAgLy8gd2FsbHBhcGVyIOWcuuaZr+S4i+aMgee7ree7mOWItuaYr+mihOacn+ihjOS4uu+8iFdhbGxwYXBlciBFbmdpbmUg5ZCM55CG77yJ77yMY2FudmFzLnZ1ZSDlt7LmnInoioLmtYHjgIJcbiAgICAgIGJhY2tncm91bmRUaHJvdHRsaW5nOiBmYWxzZSxcbiAgICB9LFxuICB9O1xuXG4gIC8vIG1hY09T77yadHlwZTogJ2Rlc2t0b3AnIOWwhueql+WPo+e9ruS6juahjOmdouWbvuagh+S4i+WxglxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICBiYXNlT3B0aW9ucy50eXBlID0gJ2Rlc2t0b3AnO1xuICAgIGJhc2VPcHRpb25zLmVuYWJsZUxhcmdlclRoYW5TY3JlZW4gPSB0cnVlO1xuICB9XG5cbiAgY29uc3Qgd2luID0gbmV3IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3coYmFzZU9wdGlvbnMpO1xuXG4gIHdpbi53ZWJDb250ZW50cy5vbignd2lsbC1uYXZpZ2F0ZScsIChldmVudCwgdXJsKSA9PiB7XG4gICAgaWYgKHVybC5zdGFydHNXaXRoKGdldFdlYnZpZXdPcmlnaW4oKSkpIHJldHVybjtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbCh1cmwpO1xuICB9KTtcbiAgd2luLndlYkNvbnRlbnRzLnNldFdpbmRvd09wZW5IYW5kbGVyKCh7IHVybCB9KSA9PiB7XG4gICAgZWxlY3Ryb24uc2hlbGwub3BlbkV4dGVybmFsKHVybCk7XG4gICAgcmV0dXJuIHsgYWN0aW9uOiAnZGVueScgfTtcbiAgfSk7XG5cbiAgd2luLmxvYWRVUkwoYnVpbGRXYWxscGFwZXJVcmwoZGlzcGxheSkpO1xuXG4gIHJldHVybiB3aW47XG59XG5cbi8qKlxuICog6K6+572u5aOB57q477ya5Li65omA5pyJ5pi+56S65Zmo5Yib5bu65aOB57q456qX5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRXYWxscGFwZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IGNhbmNlbFdhbGxwYXBlcigpO1xuXG4gIGNvbnN0IGRpc3BsYXlzID0gZWxlY3Ryb24uc2NyZWVuLmdldEFsbERpc3BsYXlzKCk7XG4gIGZvciAoY29uc3QgZGlzcGxheSBvZiBkaXNwbGF5cykge1xuICAgIGNvbnN0IHdpbiA9IGNyZWF0ZVdhbGxwYXBlcldpbmRvdyhkaXNwbGF5KTtcbiAgICB3YWxscGFwZXJXaW5kb3dzLnNldChkaXNwbGF5LmlkLCB3aW4pO1xuXG4gICAgLy8gV2luZG93c++8muWFiCBTZXRQYXJlbnQg5Yiw5qGM6Z2i5bGC77yM5YaNIHNob3dcbiAgICAvLyDov5nmoLfnqpflj6Pku47lh7rnlJ/lsLHmmK/moYzpnaLlsYLnmoTlrZDnqpflj6PvvIzkuI3kvJrooqsgV2luK0Qg5pyA5bCP5YyWXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIGF3YWl0IGF0dGFjaFRvRGVza3RvcExheWVyKHdpbik7XG4gICAgfVxuXG4gICAgd2luLnNob3dJbmFjdGl2ZSgpO1xuICB9XG5cbiAgLy8gV2luZG93c++8muWuieijhem8oOagh+mSqeWtkO+8jOi9rOWPkem8oOagh+S6i+S7tuWIsOWjgee6uOeql+WPo1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgIGF3YWl0IGluc3RhbGxNb3VzZUhvb2soKTtcbiAgICBhd2FpdCBpbnN0YWxsV2hlZWxIb29rKCk7XG4gIH1cbn1cblxuLyoqXG4gKiDlj5bmtojlo4HnurjvvJrplIDmr4HmiYDmnInlo4Hnurjnqpflj6NcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNhbmNlbFdhbGxwYXBlcigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8g5YWI5Y246L296byg5qCH6ZKp5a2QXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgYXdhaXQgdW5pbnN0YWxsTW91c2VIb29rKCk7XG4gIH1cblxuICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgaWYgKCF3aW4uaXNEZXN0cm95ZWQoKSkgd2luLmRlc3Ryb3koKTtcbiAgfVxuICB3YWxscGFwZXJXaW5kb3dzLmNsZWFyKCk7XG59XG5cbi8qKlxuICog5aSE55CG5pi+56S65Zmo5Y+Y5YyW77ya5aOB57q45r+A5rS75pe25Yqo5oCB5aKe5Yig44CB6YeN5o6S56qX5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVEaXNwbGF5Q2hhbmdlKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG5cbiAgY29uc3QgZGlzcGxheXMgPSBlbGVjdHJvbi5zY3JlZW4uZ2V0QWxsRGlzcGxheXMoKTtcbiAgY29uc3QgY3VycmVudElkcyA9IG5ldyBTZXQod2FsbHBhcGVyV2luZG93cy5rZXlzKCkpO1xuICBjb25zdCBuZXdJZHMgPSBuZXcgU2V0KGRpc3BsYXlzLm1hcCgoZCkgPT4gZC5pZCkpO1xuXG4gIGZvciAoY29uc3QgaWQgb2YgY3VycmVudElkcykge1xuICAgIGlmICghbmV3SWRzLmhhcyhpZCkpIHtcbiAgICAgIGNvbnN0IHdpbiA9IHdhbGxwYXBlcldpbmRvd3MuZ2V0KGlkKTtcbiAgICAgIGlmICh3aW4gJiYgIXdpbi5pc0Rlc3Ryb3llZCgpKSB3aW4uZGVzdHJveSgpO1xuICAgICAgd2FsbHBhcGVyV2luZG93cy5kZWxldGUoaWQpO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoY29uc3QgZGlzcGxheSBvZiBkaXNwbGF5cykge1xuICAgIGlmICghd2FsbHBhcGVyV2luZG93cy5oYXMoZGlzcGxheS5pZCkpIHtcbiAgICAgIGNvbnN0IHdpbiA9IGNyZWF0ZVdhbGxwYXBlcldpbmRvdyhkaXNwbGF5KTtcbiAgICAgIHdhbGxwYXBlcldpbmRvd3Muc2V0KGRpc3BsYXkuaWQsIHdpbik7XG5cbiAgICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICAgIGF3YWl0IGF0dGFjaFRvRGVza3RvcExheWVyKHdpbik7XG4gICAgICB9XG5cbiAgICAgIHdpbi5zaG93SW5hY3RpdmUoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd2luID0gd2FsbHBhcGVyV2luZG93cy5nZXQoZGlzcGxheS5pZCkhO1xuICAgICAgaWYgKCF3aW4uaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICBjb25zdCB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfSA9IGRpc3BsYXkuYm91bmRzO1xuICAgICAgICB3aW4uc2V0Qm91bmRzKHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiDojrflj5blvZPliY3lo4HnurjnirbmgIFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzV2FsbHBhcGVyQWN0aXZlKCk6IGJvb2xlYW4ge1xuICByZXR1cm4gd2FsbHBhcGVyV2luZG93cy5zaXplID4gMDtcbn1cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g6byg5qCH5LqL5Lu26YCP5LygXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyDlo4Hnurjnqpflj6PkvY3kuo7moYzpnaLlm77moIflsYLkuIvmlrnvvIzpu5jorqTmjqXmlLbkuI3liLDpvKDmoIfkuovku7bjgIJcbi8vIOmAmui/h+i9ruivoiBHZXRBc3luY0tleVN0YXRlICsgc2NyZWVuLmdldEN1cnNvclNjcmVlblBvaW50IOiOt+WPlum8oOagh+eKtuaAge+8jFxuLy8g55SoIHdlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50IOazqOWFpeWIsOWjgee6uOeql+WPo+OAglxuXG4vKipcbiAqIOWuieijhem8oOagh+S6i+S7tumAj+S8oFxuICpcbiAqIOaWueahiO+8mueUqCBHZXRBc3luY0tleVN0YXRlIOi9ruivoum8oOagh+aMiemUrueKtuaAgSArIHNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCDojrflj5bpvKDmoIfkvY3nva7vvIxcbiAqIOmAmui/hyBFbGVjdHJvbiB3ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCDms6jlhaXliLDlo4Hnurjnqpflj6PjgIJcbiAqXG4gKiDkuI3kvb/nlKggV0hfTU9VU0VfTEwg5YWo5bGA6ZKp5a2Q77yM5Zug5Li6IGtvZmZpIOWbnuiwg+WcqCBFbGVjdHJvbiDkuLvov5vnqIvmtojmga/lvqrnjq/kuK3ml6Dms5XooqvmraPnoa7osIPluqbjgIJcbiAqIOi9ruivouaWueahiOeugOWNleWPr+mdoO+8jOS4lOWFvOWuueinpuaRuOWxj++8iOinpuaRuOS8muiiq+ezu+e7n+i9rOS4uum8oOagh+eKtuaAge+8ieOAglxuICovXG5cbmxldCBtb3VzZVBvbGxUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbmxldCBvYnNjdXJlQ2hlY2tUaW1lcjogTm9kZUpTLlRpbWVvdXQgfCBudWxsID0gbnVsbDtcbmxldCBsYXN0Q3Vyc29yUG9zID0geyB4OiAtMSwgeTogLTEgfTtcbmxldCBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCBtaWRkbGU6IGZhbHNlIH07XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxNb3VzZUhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmIChtb3VzZVBvbGxUaW1lcikgcmV0dXJuO1xuXG4gIGNvbnN0IGxpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICBpZiAoIWxpYikgcmV0dXJuO1xuXG4gIGNvbnN0IEdldEFzeW5jS2V5U3RhdGUgPSBsaWIuZnVuYygnaW50MTYgR2V0QXN5bmNLZXlTdGF0ZShpbnQzMiB2S2V5KScpO1xuICBjb25zdCBHZXRGb3JlZ3JvdW5kV2luZG93ID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBHZXRGb3JlZ3JvdW5kV2luZG93KCknKTtcbiAgY29uc3QgR2V0Q2xhc3NOYW1lVyA9IGxpYi5mdW5jKCdpbnQzMiBHZXRDbGFzc05hbWVXKHVpbnRwdHJfdCBoV25kLCB2b2lkICpscENsYXNzTmFtZSwgaW50MzIgbk1heENvdW50KScpO1xuXG4gIC8vIOajgOafpeWJjeWPsOeql+WPo+aYr+WQpuaYr+ahjOmdou+8iFByb2dtYW4g5oiWIFdvcmtlclfvvIlcbiAgLy8g5Y+q5pyJ5qGM6Z2i5Zyo5YmN5Y+w5pe277yM5aOB57q45omN6ZyA6KaB5o6l5pS26byg5qCH5LqL5Lu2XG4gIGNvbnN0IGNsYXNzTmFtZUJ1ZiA9IEJ1ZmZlci5hbGxvYyg1MTIpO1xuICBjb25zdCBpc0Rlc2t0b3BGb3JlZ3JvdW5kID0gKCk6IGJvb2xlYW4gPT4ge1xuICAgIGNsYXNzTmFtZUJ1Zi5maWxsKDApO1xuICAgIGNvbnN0IGZnID0gR2V0Rm9yZWdyb3VuZFdpbmRvdygpO1xuICAgIGlmICghZmcgfHwgZmcgPT09IDBuKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbGVuID0gR2V0Q2xhc3NOYW1lVyhmZywgY2xhc3NOYW1lQnVmLCAyNTYpO1xuICAgIGlmIChsZW4gPD0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGNscyA9IGNsYXNzTmFtZUJ1Zi50b1N0cmluZygndXRmMTZsZScsIDAsIGxlbiAqIDIpO1xuICAgIHJldHVybiBjbHMgPT09ICdQcm9nbWFuJyB8fCBjbHMgPT09ICdXb3JrZXJXJztcbiAgfTtcblxuICAvLyDlvILmraXliKTlrprnmoTlkI7lj7Dpga7olL3nirbmgIHvvJrpu5jorqQgZmFsc2XvvIjmnKrpga7kvY/vvInvvIznlLHlrprml7blmajmr48gMjUwbXMg6LCD55SoIGlzRGVza3RvcE9ic2N1cmVkIOabtOaWsOOAglxuICAvLyDlvILmraXliKTlrprmnIkgfjI1MG1zIOW7tui/n+S4jeW9seWTjeS6pOS6kuaEn+efpe+8iOm8oOagh+mAj+S8oOeUseWJjeWPsOeKtuaAgeW/q+mAn+i3r+W+hOWGs+Wumu+8ieOAglxuICBsZXQgZGVza3RvcE9ic2N1cmVkID0gZmFsc2U7XG5cbiAgLy8gVktfTEJVVFRPTj0weDAxLCBWS19SQlVUVE9OPTB4MDIsIFZLX01CVVRUT049MHgwNFxuICBjb25zdCBwb2xsSW50ZXJ2YWwgPSA0MDsgLy8gfjI1ZnBzXG5cbiAgLy8g54us56uL5oWi6L2u6K+i77yaMjUwbXMg5LiA5qyh77yM5pu05pawIGRlc2t0b3BPYnNjdXJlZOOAglxuICAvLyDljZXni6zlvILmraXogIzkuI3msaHmn5PkuLvova7or6LoioLlpY/vvIxXaW4zMiDlpLHotKXml7bkv53mjIEgZmFsc2XvvIjmjInnlKjmiLfopoHmsYLlroHlj6/lpJrmtarotLkgQ1BV77yJ44CCXG4gIG9ic2N1cmVDaGVja1RpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIHZvaWQgaXNEZXNrdG9wT2JzY3VyZWQoKS50aGVuKCh2KSA9PiB7XG4gICAgICBkZXNrdG9wT2JzY3VyZWQgPSB2O1xuICAgIH0pO1xuICB9LCAyNTApO1xuXG4gIG1vdXNlUG9sbFRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGlmICh3YWxscGFwZXJXaW5kb3dzLnNpemUgPT09IDApIHJldHVybjtcblxuICAgIGlmICghaXNEZXNrdG9wRm9yZWdyb3VuZCgpKSB7XG4gICAgICAvLyDmoYzpnaLpnZ7liY3lj7DvvJrkv53nlZlcIuWbnuato1wi6K+t5LmJ77yM5rOo5YWlIG1vdXNlTW92ZSDliLDnqpflj6PkuK3lv4Pop6blj5EgY2FudmFzIOWbnuato+WKqOeUu++8jFxuICAgICAgLy8g5L2G5LuF5ZyoIHdhbGxwYXBlciDmnKrooqvliY3lj7Dnqpflj6Plrozlhajopobnm5bml7bmiafooYzjgILooqvpga7mjKHvvIjmnIDlpKfljJYv5YWo5bGP77yJ5pe255u05o6l5YGc5q2i6YCP5Lyg77yMXG4gICAgICAvLyDpgb/lhY3lkJEgaGlkZGVuIHdlYkNvbnRlbnRzIOaMgee7reazqOWFpSBnaG9zdCBtb3VzZU1vdmUg6Kem5Y+R5peg5oSP5LmJ55qE6YeN57uY44CCXG4gICAgICBsYXN0Q3Vyc29yUG9zID0geyB4OiAtMSwgeTogLTEgfTtcbiAgICAgIGxhc3RCdXR0b25TdGF0ZXMgPSB7IGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIG1pZGRsZTogZmFsc2UgfTtcbiAgICAgIGlmIChkZXNrdG9wT2JzY3VyZWQpIHJldHVybjtcbiAgICAgIGZvciAoY29uc3Qgd2luIG9mIHdhbGxwYXBlcldpbmRvd3MudmFsdWVzKCkpIHtcbiAgICAgICAgaWYgKHdpbi5pc0Rlc3Ryb3llZCgpKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgYm91bmRzID0gd2luLmdldEJvdW5kcygpO1xuICAgICAgICBjb25zdCBjZW50ZXJYID0gTWF0aC5mbG9vcihib3VuZHMud2lkdGggLyAyKTtcbiAgICAgICAgY29uc3QgY2VudGVyWSA9IE1hdGguZmxvb3IoYm91bmRzLmhlaWdodCAvIDIpO1xuICAgICAgICB3aW4ud2ViQ29udGVudHMuc2VuZElucHV0RXZlbnQoeyB0eXBlOiAnbW91c2VNb3ZlJywgeDogY2VudGVyWCwgeTogY2VudGVyWSB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyDor7vlj5bmjInplK7nirbmgIHvvIhHZXRBc3luY0tleVN0YXRlIOacgOmrmOS9jeS4uiAxIOihqOekuuaMieS4i++8iVxuICAgIGNvbnN0IGxlZnREb3duID0gKEdldEFzeW5jS2V5U3RhdGUoMHgwMSkgJiAweDgwMDApICE9PSAwO1xuICAgIGNvbnN0IHJpZ2h0RG93biA9IChHZXRBc3luY0tleVN0YXRlKDB4MDIpICYgMHg4MDAwKSAhPT0gMDtcbiAgICBjb25zdCBtaWRkbGVEb3duID0gKEdldEFzeW5jS2V5U3RhdGUoMHgwNCkgJiAweDgwMDApICE9PSAwO1xuXG4gICAgLy8g6I635Y+W6byg5qCH5L2N572uXG4gICAgY29uc3QgcG9zID0gZWxlY3Ryb24uc2NyZWVuLmdldEN1cnNvclNjcmVlblBvaW50KCk7XG5cbiAgICAvLyDmib7liLDpvKDmoIfmiYDlnKjmmL7npLrlmajnmoTlo4Hnurjnqpflj6NcbiAgICBsZXQgdGFyZ2V0V2luOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgPSBudWxsO1xuICAgIGZvciAoY29uc3Qgd2luIG9mIHdhbGxwYXBlcldpbmRvd3MudmFsdWVzKCkpIHtcbiAgICAgIGlmICh3aW4uaXNEZXN0cm95ZWQoKSkgY29udGludWU7XG4gICAgICBjb25zdCBib3VuZHMgPSB3aW4uZ2V0Qm91bmRzKCk7XG4gICAgICBpZiAocG9zLnggPj0gYm91bmRzLnggJiYgcG9zLnggPCBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJlxuICAgICAgICAgIHBvcy55ID49IGJvdW5kcy55ICYmIHBvcy55IDwgYm91bmRzLnkgKyBib3VuZHMuaGVpZ2h0KSB7XG4gICAgICAgIHRhcmdldFdpbiA9IHdpbjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXRXaW4pIHtcbiAgICAgIC8vIOm8oOagh+S4jeWcqOS7u+S9leWjgee6uOeql+WPo+S4iu+8jOabtOaWsOeKtuaAgeS9huS4jei9rOWPkVxuICAgICAgbGFzdEN1cnNvclBvcyA9IHBvcztcbiAgICAgIGxhc3RCdXR0b25TdGF0ZXMgPSB7IGxlZnQ6IGxlZnREb3duLCByaWdodDogcmlnaHREb3duLCBtaWRkbGU6IG1pZGRsZURvd24gfTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBib3VuZHMgPSB0YXJnZXRXaW4uZ2V0Qm91bmRzKCk7XG4gICAgY29uc3QgeCA9IHBvcy54IC0gYm91bmRzLng7XG4gICAgY29uc3QgeSA9IHBvcy55IC0gYm91bmRzLnk7XG5cbiAgICAvLyDpvKDmoIfnp7vliqhcbiAgICBpZiAocG9zLnggIT09IGxhc3RDdXJzb3JQb3MueCB8fCBwb3MueSAhPT0gbGFzdEN1cnNvclBvcy55KSB7XG4gICAgICB0YXJnZXRXaW4ud2ViQ29udGVudHMuc2VuZElucHV0RXZlbnQoeyB0eXBlOiAnbW91c2VNb3ZlJywgeCwgeSB9KTtcbiAgICB9XG5cbiAgICAvLyDlt6bplK5cbiAgICBpZiAobGVmdERvd24gIT09IGxhc3RCdXR0b25TdGF0ZXMubGVmdCkge1xuICAgICAgdGFyZ2V0V2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHtcbiAgICAgICAgdHlwZTogbGVmdERvd24gPyAnbW91c2VEb3duJyA6ICdtb3VzZVVwJyxcbiAgICAgICAgeCwgeSxcbiAgICAgICAgYnV0dG9uOiAnbGVmdCcsXG4gICAgICAgIGNsaWNrQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8g5Y+z6ZSuXG4gICAgaWYgKHJpZ2h0RG93biAhPT0gbGFzdEJ1dHRvblN0YXRlcy5yaWdodCkge1xuICAgICAgdGFyZ2V0V2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHtcbiAgICAgICAgdHlwZTogcmlnaHREb3duID8gJ21vdXNlRG93bicgOiAnbW91c2VVcCcsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGJ1dHRvbjogJ3JpZ2h0JyxcbiAgICAgICAgY2xpY2tDb3VudDogMSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyDkuK3plK5cbiAgICBpZiAobWlkZGxlRG93biAhPT0gbGFzdEJ1dHRvblN0YXRlcy5taWRkbGUpIHtcbiAgICAgIHRhcmdldFdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgIHR5cGU6IG1pZGRsZURvd24gPyAnbW91c2VEb3duJyA6ICdtb3VzZVVwJyxcbiAgICAgICAgeCwgeSxcbiAgICAgICAgYnV0dG9uOiAnbWlkZGxlJyxcbiAgICAgICAgY2xpY2tDb3VudDogMSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGxhc3RDdXJzb3JQb3MgPSBwb3M7XG4gICAgbGFzdEJ1dHRvblN0YXRlcyA9IHsgbGVmdDogbGVmdERvd24sIHJpZ2h0OiByaWdodERvd24sIG1pZGRsZTogbWlkZGxlRG93biB9O1xuICB9LCBwb2xsSW50ZXJ2YWwpO1xuXG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBNb3VzZSBwb2xsIHN0YXJ0ZWQgKDQwbXMgaW50ZXJ2YWwsIGRlc2t0b3Atb25seSknKTtcbn1cblxuLyoqXG4gKiDlronoo4XpvKDmoIfmu5rova7pgI/kvKBcbiAqXG4gKiDmu5rova7ml6Dms5XpgJrov4cgR2V0QXN5bmNLZXlTdGF0ZSDova7or6Lojrflj5bvvIjmmK/kuovku7bogIzpnZ7nirbmgIHvvInjgIJcbiAqIOaWueahiO+8mueUqCBSYXdJbnB1dCArIGhvb2tXaW5kb3dNZXNzYWdlKFdNX0lOUFVUKSArIEdldFJhd0lucHV0RGF0YeOAglxuICpcbiAqIOWFs+mUrueCue+8mlxuICogLSDnlKggUklERVZfSU5QVVRTSU5LIOazqOWGjCBSYXdJbnB1dCDliLDkuLvnqpflj6PvvIjljbPkvb/kuLvnqpflj6PkuI3lnKjliY3lj7DkuZ/mjqXmlLbovpPlhaXvvIlcbiAqIC0gTVNETiDmmI7noa7op4TlrpogUklERVZfTk9RVUVVRSDkuI3og73kuI4gUklERVZfSU5QVVRTSU5LIOe7hOWQiO+8jOaJgOS7peS6i+S7tuS8muS7pSBXTV9JTlBVVCDmipXpgJJcbiAqIC0gRWxlY3Ryb24g55qEIGhvb2tXaW5kb3dNZXNzYWdlIGNhbGxiYWNrIOWcqCBVSSDnur/nqIvlkIzmraXmiafooYzvvIjpgJrov4cgdjg6OkxvY2tlcu+8ie+8jFxuICogICBIUkFXSU5QVVQg5Y+l5p+E5ZyoIGNhbGxiYWNrIOacn+mXtOS7jeeEtuacieaViO+8jOWPr+S7peWuieWFqOiwg+eUqCBHZXRSYXdJbnB1dERhdGFcbiAqIC0gY2FsbGJhY2sg5Lit5YaN5qyh5qOA5p+l5YmN5Y+w56qX5Y+j5piv5ZCm5Li65qGM6Z2i77yIUHJvZ21hbi9Xb3JrZXJX77yJ77yM6YG/5YWN6Z2e5qGM6Z2i5Zy65pmv6K+v6Kem5Y+RXG4gKlxuICog5Li756qX5Y+j5rC46L+c5a2Y5Zyo77yIY2xvc2Ug6KKr5oum5oiq5Li6IGhpZGXvvInvvIzmmK/ms6jlhowgUmF3SW5wdXQg55qE55CG5oOz6L295L2T44CCXG4gKi9cbmxldCB3aGVlbEhvb2tJbnN0YWxsZWQgPSBmYWxzZTtcbmxldCB3aGVlbEhvb2tNYWluV2luOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyB8IG51bGwgPSBudWxsO1xubGV0IGdldFJhd0lucHV0RGF0YUZuOiAoKGhSYXdJbnB1dDogYmlnaW50LCB1aUNvbW1hbmQ6IG51bWJlciwgcERhdGE6IEJ1ZmZlciB8IG51bGwsIHBjYlNpemU6IEJ1ZmZlciwgY2JTaXplSGVhZGVyOiBudW1iZXIpID0+IG51bWJlcikgfCBudWxsID0gbnVsbDtcbmxldCBnZXRGb3JlZ3JvdW5kV2luZG93Rm46ICgoKSA9PiBiaWdpbnQpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ2V0Q2xhc3NOYW1lV0ZuOiAoKGhXbmQ6IGJpZ2ludCwgbHBDbGFzc05hbWU6IEJ1ZmZlciwgbk1heENvdW50OiBudW1iZXIpID0+IG51bWJlcikgfCBudWxsID0gbnVsbDtcbmNvbnN0IFdNX0lOUFVUID0gMHgwMEZGO1xuY29uc3QgUklEX0lOUFVUID0gMHgxMDAwMDAwMztcbmNvbnN0IFJJTV9UWVBFTU9VU0UgPSAwO1xuY29uc3QgUklfTU9VU0VfV0hFRUwgPSAweDA0MDA7XG5jb25zdCBSQVdJTlBVVEhFQURFUl9TSVpFID0gMjQ7XG5cbi8vIOWkjeeUqCBCdWZmZXIg6YG/5YWN5q+P5qyhIGNhbGxiYWNrIOWIhumFjVxuY29uc3QgcmF3SW5wdXREYXRhQnVmID0gQnVmZmVyLmFsbG9jKDEwMjQpO1xuY29uc3QgcmF3SW5wdXRTaXplQnVmID0gQnVmZmVyLmFsbG9jKDQpO1xuY29uc3QgY2xhc3NOYW1lQnVmV2hlZWwgPSBCdWZmZXIuYWxsb2MoNTEyKTtcblxuZnVuY3Rpb24gaXNEZXNrdG9wRm9yZWdyb3VuZEJ5V2luMzIoKTogYm9vbGVhbiB7XG4gIGlmICghZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuIHx8ICFnZXRDbGFzc05hbWVXRm4pIHJldHVybiBmYWxzZTtcbiAgY29uc3QgZmcgPSBnZXRGb3JlZ3JvdW5kV2luZG93Rm4oKTtcbiAgaWYgKCFmZyB8fCBmZyA9PT0gMG4pIHJldHVybiBmYWxzZTtcbiAgY2xhc3NOYW1lQnVmV2hlZWwuZmlsbCgwKTtcbiAgY29uc3QgbGVuID0gZ2V0Q2xhc3NOYW1lV0ZuKGZnLCBjbGFzc05hbWVCdWZXaGVlbCwgMjU2KTtcbiAgaWYgKGxlbiA8PSAwKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGNscyA9IGNsYXNzTmFtZUJ1ZldoZWVsLnRvU3RyaW5nKCd1dGYxNmxlJywgMCwgbGVuICogMik7XG4gIHJldHVybiBjbHMgPT09ICdQcm9nbWFuJyB8fCBjbHMgPT09ICdXb3JrZXJXJztcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFdoZWVsSG9vaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybjtcbiAgaWYgKHdoZWVsSG9va0luc3RhbGxlZCkgcmV0dXJuO1xuXG4gIGNvbnN0IG1haW5XaW4gPSBhd2FpdCBnZXRXZWJ2aWV3V2luZG93KCk7XG4gIGlmIChtYWluV2luLmlzRGVzdHJveWVkKCkpIHJldHVybjtcblxuICBjb25zdCBsaWIgPSBhd2FpdCBsb2FkV2luMzJMaWIoKTtcbiAgaWYgKCFsaWIpIHJldHVybjtcblxuICBjb25zdCBSZWdpc3RlclJhd0lucHV0RGV2aWNlcyA9IGxpYi5mdW5jKCd1aW50MzIgUmVnaXN0ZXJSYXdJbnB1dERldmljZXModm9pZCAqcFJhd0lucHV0RGV2aWNlcywgdWludDMyIHVpTnVtRGV2aWNlcywgdWludDMyIGNiU2l6ZSknKTtcbiAgZ2V0UmF3SW5wdXREYXRhRm4gPSBsaWIuZnVuYygndWludDMyIEdldFJhd0lucHV0RGF0YSh1aW50cHRyX3QgaFJhd0lucHV0LCB1aW50MzIgdWlDb21tYW5kLCB2b2lkICpwRGF0YSwgdm9pZCAqcGNiU2l6ZSwgdWludDMyIGNiU2l6ZUhlYWRlciknKTtcbiAgZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBHZXRGb3JlZ3JvdW5kV2luZG93KCknKTtcbiAgZ2V0Q2xhc3NOYW1lV0ZuID0gbGliLmZ1bmMoJ2ludDMyIEdldENsYXNzTmFtZVcodWludHB0cl90IGhXbmQsIHZvaWQgKmxwQ2xhc3NOYW1lLCBpbnQzMiBuTWF4Q291bnQpJyk7XG5cbiAgY29uc3Qga29mZmlGb3JFcnIgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgaWYgKCFrZXJuZWwzMkxpYikga2VybmVsMzJMaWIgPSBrb2ZmaUZvckVyci5sb2FkKCdrZXJuZWwzMi5kbGwnKTtcbiAgY29uc3QgR2V0TGFzdEVycm9yID0ga2VybmVsMzJMaWIuZnVuYygndWludDMyIEdldExhc3RFcnJvcigpJyk7XG5cbiAgY29uc3QgbWFpbkh3bmQgPSByZWFkSHduZChtYWluV2luLmdldE5hdGl2ZVdpbmRvd0hhbmRsZSgpKTtcblxuICAvLyBSQVdJTlBVVERFVklDRTogdXNVc2FnZVBhZ2UoMikgKyB1c1VzYWdlKDIpICsgZHdGbGFncyg0KSArIGh3bmRUYXJnZXQoOCkgPSAxNiBieXRlc1xuICBjb25zdCByaWQgPSBCdWZmZXIuYWxsb2MoMTYpO1xuICByaWQud3JpdGVVSW50MTZMRSgweDAxLCAwKTsgLy8gdXNVc2FnZVBhZ2UgPSBHZW5lcmljIERlc2t0b3BcbiAgcmlkLndyaXRlVUludDE2TEUoMHgwMiwgMik7IC8vIHVzVXNhZ2UgPSBNb3VzZVxuICByaWQud3JpdGVVSW50MzJMRSgweDAwMDAwMTAwLCA0KTsgLy8gUklERVZfSU5QVVRTSU5LIG9ubHlcbiAgcmlkLndyaXRlQmlnVUludDY0TEUobWFpbkh3bmQsIDgpOyAvLyBod25kVGFyZ2V0XG5cbiAgY29uc3Qgb2sgPSBSZWdpc3RlclJhd0lucHV0RGV2aWNlcyhyaWQsIDEsIDE2KTtcbiAgY29uc3QgZXJyID0gR2V0TGFzdEVycm9yKCk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBSZWdpc3RlclJhd0lucHV0RGV2aWNlczogb2s9JHtva30gZXJyPSR7ZXJyfWApO1xuICBpZiAob2sgPT09IDApIHtcbiAgICBjb25zb2xlLndhcm4oYFt3YWxscGFwZXJdIFJlZ2lzdGVyUmF3SW5wdXREZXZpY2VzIGZhaWxlZGApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHdoZWVsSG9va01haW5XaW4gPSBtYWluV2luO1xuICBsZXQgd2hlZWxFdmVudENvdW50ID0gMDtcblxuICBtYWluV2luLmhvb2tXaW5kb3dNZXNzYWdlKFdNX0lOUFVULCAod1BhcmFtOiBCdWZmZXIsIGxQYXJhbTogQnVmZmVyKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh3YWxscGFwZXJXaW5kb3dzLnNpemUgPT09IDApIHJldHVybjtcbiAgICAgIC8vIOWPquWcqOahjOmdouS4uuWJjeWPsOaXtui9rOWPkea7mui9ru+8iOS4jum8oOagh+mAj+S8oOS/neaMgeS4gOiHtO+8iVxuICAgICAgaWYgKCFpc0Rlc2t0b3BGb3JlZ3JvdW5kQnlXaW4zMigpKSByZXR1cm47XG4gICAgICBpZiAoIWdldFJhd0lucHV0RGF0YUZuKSByZXR1cm47XG5cbiAgICAgIC8vIGxQYXJhbSDmmK8gSFJBV0lOUFVUIOWPpeafhO+8iDY0IOS9jeezu+e7n+S4uiA4IOWtl+iKgu+8iVxuICAgICAgY29uc3QgaFJhd0lucHV0ID0gbFBhcmFtLmxlbmd0aCA+PSA4ID8gbFBhcmFtLnJlYWRCaWdVSW50NjRMRSgwKSA6IEJpZ0ludChsUGFyYW0ucmVhZFVJbnQzMkxFKDApKTtcblxuICAgICAgLy8g6LCD55SoIEdldFJhd0lucHV0RGF0YSDor7vlj5bmlbDmja5cbiAgICAgIHJhd0lucHV0U2l6ZUJ1Zi53cml0ZVVJbnQzMkxFKHJhd0lucHV0RGF0YUJ1Zi5sZW5ndGgsIDApO1xuICAgICAgY29uc3QgcmVzdWx0ID0gZ2V0UmF3SW5wdXREYXRhRm4oaFJhd0lucHV0LCBSSURfSU5QVVQsIHJhd0lucHV0RGF0YUJ1ZiwgcmF3SW5wdXRTaXplQnVmLCBSQVdJTlBVVEhFQURFUl9TSVpFKTtcblxuICAgICAgaWYgKHJlc3VsdCA9PT0gMCB8fCByZXN1bHQgPT09IDB4RkZGRkZGRkYpIHtcbiAgICAgICAgLy8g5LuF5Zyo5Yid5qyh5aSx6LSl5pe26K6w5b2V77yM6YG/5YWN5pel5b+X5Yi35bGPXG4gICAgICAgIGlmICh3aGVlbEV2ZW50Q291bnQgPT09IDApIHtcbiAgICAgICAgICBjb25zdCBsYXN0RXJyID0gR2V0TGFzdEVycm9yKCk7XG4gICAgICAgICAgY29uc29sZS53YXJuKGBbd2FsbHBhcGVyXSBHZXRSYXdJbnB1dERhdGEgZmFpbGVkOiByZXN1bHQ9JHtyZXN1bHR9IGVycj0ke2xhc3RFcnJ9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkd1R5cGUgPSByYXdJbnB1dERhdGFCdWYucmVhZFVJbnQzMkxFKDApO1xuICAgICAgaWYgKGR3VHlwZSAhPT0gUklNX1RZUEVNT1VTRSkgcmV0dXJuO1xuXG4gICAgICAvLyBSQVdNT1VTRSDntKfmjqUgUkFXSU5QVVRIRUFERVLvvJpcbiAgICAgIC8vICAgdXNGbGFncygwLTIpICsgcGFkZGluZygyLTQpICsgdWxCdXR0b25zIOiBlOWQiOS9kyg0LTgpICsgdWxSYXdCdXR0b25zKDgtMTIpICsgbExhc3RYKDEyLTE2KSArIGxMYXN0WSgxNi0yMCkgKyBkd0V4dHJhSW5mbygyMC0yNClcbiAgICAgIGNvbnN0IHVsQnV0dG9ucyA9IHJhd0lucHV0RGF0YUJ1Zi5yZWFkVUludDMyTEUoUkFXSU5QVVRIRUFERVJfU0laRSArIDQpO1xuICAgICAgY29uc3QgdXNCdXR0b25GbGFncyA9IHVsQnV0dG9ucyAmIDB4ZmZmZjtcblxuICAgICAgaWYgKCh1c0J1dHRvbkZsYWdzICYgUklfTU9VU0VfV0hFRUwpICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IHVzQnV0dG9uRGF0YVJhdyA9ICh1bEJ1dHRvbnMgPj4+IDE2KSAmIDB4ZmZmZjtcbiAgICAgICAgY29uc3QgZGVsdGEgPSB1c0J1dHRvbkRhdGFSYXcgPiAweDdmZmYgPyB1c0J1dHRvbkRhdGFSYXcgLSAweDEwMDAwIDogdXNCdXR0b25EYXRhUmF3O1xuXG4gICAgICAgIHdoZWVsRXZlbnRDb3VudCsrO1xuICAgICAgICBpZiAod2hlZWxFdmVudENvdW50IDw9IDMpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gV2hlZWwgZXZlbnQ6IGRlbHRhPSR7ZGVsdGF9IChjb3VudD0ke3doZWVsRXZlbnRDb3VudH0pYCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDovazlj5HliLDpvKDmoIfmiYDlnKjmmL7npLrlmajnmoTlo4Hnurjnqpflj6NcbiAgICAgICAgY29uc3QgcG9zID0gZWxlY3Ryb24uc2NyZWVuLmdldEN1cnNvclNjcmVlblBvaW50KCk7XG4gICAgICAgIGZvciAoY29uc3Qgd2luIG9mIHdhbGxwYXBlcldpbmRvd3MudmFsdWVzKCkpIHtcbiAgICAgICAgICBpZiAod2luLmlzRGVzdHJveWVkKCkpIGNvbnRpbnVlO1xuICAgICAgICAgIGNvbnN0IGJvdW5kcyA9IHdpbi5nZXRCb3VuZHMoKTtcbiAgICAgICAgICBpZiAocG9zLnggPj0gYm91bmRzLnggJiYgcG9zLnggPCBib3VuZHMueCArIGJvdW5kcy53aWR0aCAmJlxuICAgICAgICAgICAgICBwb3MueSA+PSBib3VuZHMueSAmJiBwb3MueSA8IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCkge1xuICAgICAgICAgICAgd2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHtcbiAgICAgICAgICAgICAgdHlwZTogJ21vdXNlV2hlZWwnLFxuICAgICAgICAgICAgICB4OiBwb3MueCAtIGJvdW5kcy54LFxuICAgICAgICAgICAgICB5OiBwb3MueSAtIGJvdW5kcy55LFxuICAgICAgICAgICAgICBkZWx0YVg6IDAsXG4gICAgICAgICAgICAgIGRlbHRhWTogZGVsdGEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1t3YWxscGFwZXJdIFdNX0lOUFVUIGNhbGxiYWNrIGVycm9yOicsIGUpO1xuICAgIH1cbiAgfSk7XG5cbiAgd2hlZWxIb29rSW5zdGFsbGVkID0gdHJ1ZTtcbiAgY29uc29sZS5sb2coJ1t3YWxscGFwZXJdIFdoZWVsIGhvb2sgaW5zdGFsbGVkIChXTV9JTlBVVCBob29rIG1vZGUpJyk7XG59XG5cbi8qKlxuICog5Y246L296byg5qCH6L2u6K+iXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHVuaW5zdGFsbE1vdXNlSG9vaygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybjtcbiAgaWYgKG1vdXNlUG9sbFRpbWVyKSB7XG4gICAgY2xlYXJJbnRlcnZhbChtb3VzZVBvbGxUaW1lcik7XG4gICAgbW91c2VQb2xsVGltZXIgPSBudWxsO1xuICB9XG4gIGlmIChvYnNjdXJlQ2hlY2tUaW1lcikge1xuICAgIGNsZWFySW50ZXJ2YWwob2JzY3VyZUNoZWNrVGltZXIpO1xuICAgIG9ic2N1cmVDaGVja1RpbWVyID0gbnVsbDtcbiAgfVxuICBsYXN0Q3Vyc29yUG9zID0geyB4OiAtMSwgeTogLTEgfTtcbiAgbGFzdEJ1dHRvblN0YXRlcyA9IHsgbGVmdDogZmFsc2UsIHJpZ2h0OiBmYWxzZSwgbWlkZGxlOiBmYWxzZSB9O1xuXG4gIC8vIOWNuOi9vea7mui9riBob29rXG4gIGlmICh3aGVlbEhvb2tNYWluV2luICYmICF3aGVlbEhvb2tNYWluV2luLmlzRGVzdHJveWVkKCkpIHtcbiAgICB0cnkge1xuICAgICAgd2hlZWxIb29rTWFpbldpbi51bmhvb2tXaW5kb3dNZXNzYWdlKFdNX0lOUFVUKTtcbiAgICB9IGNhdGNoIHt9XG4gIH1cbiAgd2hlZWxIb29rSW5zdGFsbGVkID0gZmFsc2U7XG4gIHdoZWVsSG9va01haW5XaW4gPSBudWxsO1xuICBnZXRSYXdJbnB1dERhdGFGbiA9IG51bGw7XG4gIGdldEZvcmVncm91bmRXaW5kb3dGbiA9IG51bGw7XG4gIGdldENsYXNzTmFtZVdGbiA9IG51bGw7XG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBNb3VzZSBwb2xsIHN0b3BwZWQnKTtcbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFLQSxJQUFNLG1DQUFtQixJQUFJLElBQXFDO0FBR2xFLElBQUksV0FBMkQ7QUFDL0QsSUFBSSxjQUE4RDtBQUNsRSxJQUFJLFNBQXlEO0FBRzdELElBQUksdUJBQXdFO0FBRTVFLGVBQWUsWUFBWTtDQUN6QixNQUFNLE1BQU0sTUFBTSxPQUFPO0NBRXpCLE9BQVEsSUFBNkMsV0FBVztBQUNsRTtBQUVBLGVBQWUsZUFBZTtDQUM1QixJQUFJLFFBQVEsYUFBYSxTQUFTLE9BQU87Q0FDekMsSUFBSSxDQUFDLFVBRUgsWUFBVyxNQURTLFVBQVUsRUFBQSxDQUNiLEtBQUssWUFBWTtDQUVwQyxPQUFPO0FBQ1Q7Ozs7O0FBTUEsSUFBSSx5QkFBeUU7QUFDN0UsSUFBSSxRQUFpRDtBQUNyRCxJQUFJLFFBQWlEO0FBQ3JELElBQUksUUFBaUQ7QUFDckQsSUFBSSxRQUFpRDtBQUNyRCxJQUFJLFFBQWlEO0FBRXJELGVBQWUsb0JBQXNDO0NBQ25ELElBQUksUUFBUSxhQUFhLFNBQVMsT0FBTztDQUN6QyxJ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