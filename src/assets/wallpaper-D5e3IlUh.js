import { c as __VERSION__, n as getWebviewOrigin, r as getWebviewWindow } from "../index.js";
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

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FsbHBhcGVyLUQ1ZTNJbFVoLmpzIiwibmFtZXMiOltdLCJzb3VyY2VzIjpbIi4uLy4uL2FwcC91dGlscy93YWxscGFwZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgKiBhcyBfZWxlY3Ryb24gZnJvbSAnZWxlY3Ryb24nO1xuaW1wb3J0IHsgX19WRVJTSU9OX18gfSBmcm9tICcuLi9fX1ZFUlNJT05fXyc7XG5pbXBvcnQgeyBnZXRXZWJ2aWV3T3JpZ2luLCBnZXRXZWJ2aWV3V2luZG93IH0gZnJvbSAnLi9lbGVjdHJvbi50cyc7XG5cbi8vIOWjgee6uOeql+WPoyBNYXDvvJpkaXNwbGF5SWQg4oaSIEJyb3dzZXJXaW5kb3dcbmNvbnN0IHdhbGxwYXBlcldpbmRvd3MgPSBuZXcgTWFwPG51bWJlciwgX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3c+KCk7XG5cbi8vIFdpbmRvd3Mg5LiT55So77yaa29mZmkg5bu26L+f5Yqg6L2977yI5LuFIFdpbmRvd3Mg5bmz5Y+w5L2/55So77yJXG5sZXQgd2luMzJMaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xubGV0IGtlcm5lbDMyTGliOiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykubG9hZD4gfCBudWxsID0gbnVsbDtcbmxldCBkd21MaWI6IFJldHVyblR5cGU8dHlwZW9mIGltcG9ydCgna29mZmknKS5sb2FkPiB8IG51bGwgPSBudWxsO1xuXG4vLyBrb2ZmaSDnsbvlnovlrprkuYnnvJPlrZjvvIjpgb/lhY3ph43lpI3ms6jlhozlr7zoh7QgRHVwbGljYXRlIHR5cGUgbmFtZSDplJnor6/vvIlcbmxldCBlbnVtV2luZG93c1Byb2NQcm90bzogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLnByb3RvPiB8IG51bGwgPSBudWxsO1xuXG5hc3luYyBmdW5jdGlvbiBsb2FkS29mZmkoKSB7XG4gIGNvbnN0IG1vZCA9IGF3YWl0IGltcG9ydCgna29mZmknKTtcbiAgLy8gQ0pTIOaooeWdl+WcqCBFU00g5Lit6YCa6L+HIGRlZmF1bHQg6K6/6ZeuIG1vZHVsZS5leHBvcnRzXG4gIHJldHVybiAobW9kIGFzIHsgZGVmYXVsdD86IHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykgfSkuZGVmYXVsdCA/PyBtb2Q7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRXaW4zMkxpYigpIHtcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gIT09ICd3aW4zMicpIHJldHVybiBudWxsO1xuICBpZiAoIXdpbjMyTGliKSB7XG4gICAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgICB3aW4zMkxpYiA9IGtvZmZpLmxvYWQoJ3VzZXIzMi5kbGwnKTtcbiAgfVxuICByZXR1cm4gd2luMzJMaWI7XG59XG5cbi8qKlxuICog5Yik5a6a5qGM6Z2iIHdhbGxwYXBlciDmmK/lkKbooqvliY3lj7Dnqpflj6Plrozlhajopobnm5bvvIjmnIDlpKfljJbnqpflj6PjgIHni6zljaDlhajlsY/jgIFXaW4rRCDlkI7nmoTlhajlsY/lupTnlKjnrYnvvInjgIJcbiAqIOS7u+S9lSBXaW4zMiDosIPnlKjlpLHotKXml7bov5Tlm54gZmFsc2XvvIjkv53mjIHljp/pgI/kvKDooYzkuLrvvIzlroHlj6/lpJrmtarotLkgQ1BVIOS5n+S4jeimgeivr+WIpOWvvOiHtOWjgee6uOWksea0u++8ieOAglxuICovXG5sZXQgZGVza3RvcE9ic2N1cmVDaGVja0xpYjogUmV0dXJuVHlwZTx0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLmxvYWQ+IHwgbnVsbCA9IG51bGw7XG5sZXQgZ2Z3Rm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ3dyRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgbWZ3Rm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ21pRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ2NuRm46ICgoLi4uYXJnczogdW5rbm93bltdKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5cbmFzeW5jIGZ1bmN0aW9uIGlzRGVza3RvcE9ic2N1cmVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuIGZhbHNlO1xuICB0cnkge1xuICAgIGlmICghZGVza3RvcE9ic2N1cmVDaGVja0xpYikgZGVza3RvcE9ic2N1cmVDaGVja0xpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICAgIGlmICghZGVza3RvcE9ic2N1cmVDaGVja0xpYikgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghZ2Z3Rm4pIGdmd0ZuID0gZGVza3RvcE9ic2N1cmVDaGVja0xpYi5mdW5jKCd1aW50cHRyX3QgR2V0Rm9yZWdyb3VuZFdpbmRvdygpJyk7XG4gICAgaWYgKCFnd3JGbikgZ3dyRm4gPSBkZXNrdG9wT2JzY3VyZUNoZWNrTGliLmZ1bmMoJ2ludDMyIEdldFdpbmRvd1JlY3QodWludHB0cl90IGhXbmQsIF9PdXRfIHZvaWQgKmxwUmVjdCknKTtcbiAgICBpZiAoIW1md0ZuKSBtZndGbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygndWludHB0cl90IE1vbml0b3JGcm9tV2luZG93KHVpbnRwdHJfdCBod25kLCB1aW50MzIgZHdGbGFncyknKTtcbiAgICBpZiAoIWdtaUZuKSBnbWlGbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygnaW50MzIgR2V0TW9uaXRvckluZm9XKHVpbnRwdHJfdCBoTW9uaXRvciwgX091dF8gdm9pZCAqbHBtaSknKTtcbiAgICBpZiAoIWdjbkZuKSBnY25GbiA9IGRlc2t0b3BPYnNjdXJlQ2hlY2tMaWIuZnVuYygnaW50MzIgR2V0Q2xhc3NOYW1lVyh1aW50cHRyX3QgaFduZCwgdm9pZCAqbHBDbGFzc05hbWUsIGludDMyIG5NYXhDb3VudCknKTtcblxuICAgIGNvbnN0IGZnUmF3ID0gZ2Z3Rm4oKTtcbiAgICBpZiAoIWZnUmF3IHx8IGZnUmF3ID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgZmcgPSB0b0JpZ0ludChmZ1Jhdyk7XG5cbiAgICAvLyDmoYzpnaLoh6rouqvlnKjliY3lj7DvvJrmnKrpga7kvY9cbiAgICBjb25zdCBjbHNCdWYgPSBCdWZmZXIuYWxsb2MoNTEyKTtcbiAgICBjbHNCdWYuZmlsbCgwKTtcbiAgICBjb25zdCBjbHNMZW4gPSBnY25GbihmZywgY2xzQnVmLCAyNTYpO1xuICAgIGlmIChjbHNMZW4gPiAwKSB7XG4gICAgICBjb25zdCBjbHMgPSBjbHNCdWYudG9TdHJpbmcoJ3V0ZjE2bGUnLCAwLCBjbHNMZW4gKiAyKTtcbiAgICAgIGlmIChjbHMgPT09ICdQcm9nbWFuJyB8fCBjbHMgPT09ICdXb3JrZXJXJykgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIE1PTklUT1JJTkZPOiBEV09SRCBjYlNpemUoNCkgKyBSRUNUIHJjTW9uaXRvcigxNikgKyBSRUNUIHJjV29yaygxNikgKyBEV09SRCBkd0ZsYWdzKDQpID0gNDAgYnl0ZXNcbiAgICBjb25zdCBtaUJ1ZiA9IEJ1ZmZlci5hbGxvYyg0MCk7XG4gICAgbWlCdWYud3JpdGVVSW50MzJMRSg0MCwgMCk7XG4gICAgY29uc3QgbW9uUmF3ID0gbWZ3Rm4oZmcsIDAgLyogTU9OSVRPUl9ERUZBVUxUVE9OVUxMICovKTtcbiAgICBpZiAoIW1vblJhdyB8fCBtb25SYXcgPT09IDApIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBtb24gPSB0b0JpZ0ludChtb25SYXcpO1xuICAgIGlmIChnbWlGbihtb24sIG1pQnVmKSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIC8vIHJjV29yayDkvY3kuo4gcmNNb25pdG9yIOS5i+WQju+8iOWBj+enuyAyMO+8ie+8muacgOWkp+WMlueql+WPo+eahCBHZXRXaW5kb3dSZWN0IOetieS6jiByY1dvcmvvvIjkuI3lkKvku7vliqHmoI/vvInvvIxcbiAgICAvLyDnlKggcmNNb25pdG9yIOavlOWvueS8muaKiuacgOWkp+WMlueql+WPo+WIpOS4uuacqumBruaMoe+8jOaVheS7pSByY1dvcmsg5Li65YeGXG4gICAgY29uc3QgbW9uTGVmdCA9IG1pQnVmLnJlYWRJbnQzMkxFKDIwKTtcbiAgICBjb25zdCBtb25Ub3AgPSBtaUJ1Zi5yZWFkSW50MzJMRSgyNCk7XG4gICAgY29uc3QgbW9uUmlnaHQgPSBtaUJ1Zi5yZWFkSW50MzJMRSgyOCk7XG4gICAgY29uc3QgbW9uQm90dG9tID0gbWlCdWYucmVhZEludDMyTEUoMzIpO1xuXG4gICAgLy8gUkVDVDogbGVmdCg0KSArIHRvcCg0KSArIHJpZ2h0KDQpICsgYm90dG9tKDQpXG4gICAgY29uc3QgcmVjdEJ1ZiA9IEJ1ZmZlci5hbGxvYygxNik7XG4gICAgaWYgKGd3ckZuKGZnLCByZWN0QnVmKSA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHdMZWZ0ID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSgwKTtcbiAgICBjb25zdCB3VG9wID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSg0KTtcbiAgICBjb25zdCB3UmlnaHQgPSByZWN0QnVmLnJlYWRJbnQzMkxFKDgpO1xuICAgIGNvbnN0IHdCb3R0b20gPSByZWN0QnVmLnJlYWRJbnQzMkxFKDEyKTtcblxuICAgIC8vIOWJjeWPsOeql+WPo+efqeW9ouWujOWFqOimhuebluWFtuaJgOWcqOaYvuekuuWZqOeahCByY1dvcmvvvIjlkKvmnIDlpKfljJbnqpflj6PvvInvvJrliKTlrprkuLrlrozlhajpga7mjKHmoYzpnaJcbiAgICByZXR1cm4gd0xlZnQgPD0gbW9uTGVmdCAmJiB3VG9wIDw9IG1vblRvcCAmJiB3UmlnaHQgPj0gbW9uUmlnaHQgJiYgd0JvdHRvbSA+PSBtb25Cb3R0b207XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIOS7jiBCdWZmZXIg6K+75Y+WIEhXTkQg5oyH6ZKI5YC8XG4gKiBFbGVjdHJvbiDnmoQgZ2V0TmF0aXZlV2luZG93SGFuZGxlIOWcqCA2NCDkvY3ns7vnu5/ov5Tlm54gOCDlrZfoioIgQnVmZmVy77yMMzIg5L2N6L+U5ZueIDQg5a2X6IqCXG4gKiDnu5/kuIDov5Tlm54gQmlnSW50IOmBv+WFjeeyvuW6pumXrumimFxuICovXG5mdW5jdGlvbiByZWFkSHduZChidWY6IEJ1ZmZlcik6IGJpZ2ludCB7XG4gIGlmIChidWYubGVuZ3RoIDw9IDQpIHtcbiAgICByZXR1cm4gQmlnSW50KGJ1Zi5yZWFkVUludDMyTEUoMCkpO1xuICB9XG4gIHJldHVybiBidWYucmVhZEJpZ1VJbnQ2NExFKDApO1xufVxuXG4vKipcbiAqIOWwhuWAvOi9rOaNouS4uiBCaWdJbnTvvIhrb2ZmaSDnmoQgdWludHB0cl90IOWcqCA2NCDkvY3ns7vnu5/ov5Tlm54gbnVtYmVyIOaIliBCaWdJbnTvvIlcbiAqL1xuZnVuY3Rpb24gdG9CaWdJbnQodjogYmlnaW50IHwgbnVtYmVyKTogYmlnaW50IHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSAnYmlnaW50JyA/IHYgOiBCaWdJbnQodik7XG59XG5cbi8qKlxuICog56aB55SoIFdpbjExIERXTSDpu5jorqTlnIbop5LvvIzpgb/lhY3lo4Hnurjnqpflj6PovrnnvJjooqvoo4HliIdcbiAqL1xuYXN5bmMgZnVuY3Rpb24gZGlzYWJsZVdpbmRvd1JvdW5kZWRDb3JuZXJzKGh3bmQ6IGJpZ2ludCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xuXG4gIHRyeSB7XG4gICAgY29uc3Qga29mZmkgPSBhd2FpdCBsb2FkS29mZmkoKTtcbiAgICBpZiAoIWR3bUxpYikgZHdtTGliID0ga29mZmkubG9hZCgnZHdtYXBpLmRsbCcpO1xuICAgIGNvbnN0IER3bVNldFdpbmRvd0F0dHJpYnV0ZSA9IGR3bUxpYi5mdW5jKCdsb25nIER3bVNldFdpbmRvd0F0dHJpYnV0ZSh1aW50cHRyX3QgaHduZCwgdWludDMyIGF0dHIsIHZvaWQgKnZhbHVlLCB1aW50MzIgY2JBdHRyaWJ1dGUpJyk7XG5cbiAgICBjb25zdCBEV01XQV9XSU5ET1dfQ09STkVSX1BSRUZFUkVOQ0UgPSAzMztcbiAgICBjb25zdCBEV01XQ1BfRE9OT1RST1VORCA9IDE7XG4gICAgY29uc3QgdmFsdWVCdWYgPSBCdWZmZXIuYWxsb2MoNCk7XG4gICAgdmFsdWVCdWYud3JpdGVVSW50MzJMRShEV01XQ1BfRE9OT1RST1VORCwgMCk7XG4gICAgRHdtU2V0V2luZG93QXR0cmlidXRlKGh3bmQsIERXTVdBX1dJTkRPV19DT1JORVJfUFJFRkVSRU5DRSwgdmFsdWVCdWYsIDQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBGYWlsZWQgdG8gZGlzYWJsZSByb3VuZGVkIGNvcm5lcnM6JywgZSk7XG4gIH1cbn1cblxuLyoqXG4gKiDorr7nva7nqpflj6PkuLrml6DovrnmoYbjgIHml6DlnIbop5LjgIHpk7rmu6HniLbnqpflj6NcbiAqIOW/hemhu+WcqCBTZXRQYXJlbnQg5LmL5ZCO6LCD55So77yM6K6+572uIFdTX0NISUxEIOetieagt+W8j1xuICovXG5hc3luYyBmdW5jdGlvbiBzZXR1cFdpbmRvd1N0eWxlKGh3bmQ6IGJpZ2ludCwgcGFyZW50SHduZDogYmlnaW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG5cbiAgY29uc3QgbGliID0gYXdhaXQgbG9hZFdpbjMyTGliKCk7XG4gIGlmICghbGliKSByZXR1cm47XG5cbiAgY29uc3QgR2V0V2luZG93TG9uZ1B0clcgPSBsaWIuZnVuYygnaW50cHRyX3QgR2V0V2luZG93TG9uZ1B0clcodWludHB0cl90IGhXbmQsIGludDMyIG5JbmRleCknKTtcbiAgY29uc3QgU2V0V2luZG93TG9uZ1B0clcgPSBsaWIuZnVuYygnaW50cHRyX3QgU2V0V2luZG93TG9uZ1B0clcodWludHB0cl90IGhXbmQsIGludDMyIG5JbmRleCwgaW50cHRyX3QgZHdOZXdMb25nKScpO1xuICBjb25zdCBTZXRXaW5kb3dQb3MgPSBsaWIuZnVuYygnaW50MzIgU2V0V2luZG93UG9zKHVpbnRwdHJfdCBoV25kLCB1aW50cHRyX3QgaFduZEluc2VydEFmdGVyLCBpbnQzMiBYLCBpbnQzMiBZLCBpbnQzMiBjeCwgaW50MzIgY3ksIHVpbnQzMiB1RmxhZ3MpJyk7XG4gIGNvbnN0IEdldENsaWVudFJlY3QgPSBsaWIuZnVuYygnaW50MzIgR2V0Q2xpZW50UmVjdCh1aW50cHRyX3QgaFduZCwgX091dF8gdm9pZCAqbHBSZWN0KScpO1xuXG4gIGNvbnN0IEdXTF9TVFlMRSA9IC0xNjtcbiAgY29uc3QgR1dMX0VYU1RZTEUgPSAtMjA7XG5cbiAgLy8g56qX5Y+j5qC35byP5L2NXG4gIGNvbnN0IFdTX0NISUxEID0gMHg0MDAwMDAwMG47XG4gIGNvbnN0IFdTX1ZJU0lCTEUgPSAweDEwMDAwMDAwbjtcbiAgY29uc3QgV1NfQ0xJUFNJQkxJTkdTID0gMHgwNDAwMDAwMG47XG4gIGNvbnN0IFdTX0NMSVBDSElMRFJFTiA9IDB4MDIwMDAwMDBuO1xuICAvLyDpnIDopoHnp7vpmaTnmoTmoLflvI/vvJpXU19QT1BVUCB8IFdTX0JPUkRFUiB8IFdTX1RISUNLRlJBTUUgfCBXU19ETEdGUkFNRSB8IFdTX1NZU01FTlUg562JXG4gIGNvbnN0IHJlbW92ZU1hc2sgPSB+KDB4ODAwMDAwMDBuIHwgMHgwMDgwMDAwMG4gfCAweDAwMDQwMDAwbiB8IDB4MDBjMDAwMDBuIHwgMHgwMDA4MDAwMG4pO1xuXG4gIC8vIOaJqeWxleagt+W8j1xuICBjb25zdCBXU19FWF9UT09MV0lORE9XID0gMHgwMDAwMDA4MG47XG4gIGNvbnN0IFdTX0VYX05PQUNUSVZBVEUgPSAweDA4MDAwMDAwbjtcbiAgY29uc3QgV1NfRVhfQVBQV0lORE9XX01BU0sgPSB+MHgwMDA0MDAwMG47XG4gIGNvbnN0IFdTX0VYX0xBWUVSRURfTUFTSyA9IH4weDAwMDgwMDAwbjtcblxuICAvLyBTZXRXaW5kb3dQb3Mg5qCH5b+XXG4gIGNvbnN0IFNXUF9GUkFNRUNIQU5HRSA9IDB4MDAyMDtcbiAgY29uc3QgU1dQX1NIT1dXSU5ET1cgPSAweDAwNDA7XG4gIC8vIEhXTkRfQk9UVE9NID0gMe+8jOWwhueql+WPo+aUvuWIsCBaIOmhuuW6j+W6lemDqO+8iOWcqCBTSEVMTERMTF9EZWZWaWV3IOS5i+S4i++8iVxuICBjb25zdCBIV05EX0JPVFRPTSA9IDE7XG5cbiAgLy8gMS4g5L+u5pS556qX5Y+j5qC35byP77ya56e76Zmk5qCH6aKYL+i+ueahhu+8jOa3u+WKoCBXU19DSElMRO+8iFNldFBhcmVudCDlkI7miY3og73orr7nva7vvIlcbiAgY29uc3QgY3VycmVudFN0eWxlID0gQmlnSW50KEdldFdpbmRvd0xvbmdQdHJXKGh3bmQsIEdXTF9TVFlMRSkpO1xuICBsZXQgbmV3U3R5bGUgPSBjdXJyZW50U3R5bGUgJiByZW1vdmVNYXNrO1xuICBuZXdTdHlsZSA9IG5ld1N0eWxlIHwgV1NfQ0hJTEQgfCBXU19WSVNJQkxFIHwgV1NfQ0xJUFNJQkxJTkdTIHwgV1NfQ0xJUENISUxEUkVOO1xuICBTZXRXaW5kb3dMb25nUHRyVyhod25kLCBHV0xfU1RZTEUsIG5ld1N0eWxlKTtcblxuICAvLyAyLiDkv67mlLnmianlsZXmoLflvI9cbiAgY29uc3QgY3VycmVudEV4U3R5bGUgPSBCaWdJbnQoR2V0V2luZG93TG9uZ1B0clcoaHduZCwgR1dMX0VYU1RZTEUpKTtcbiAgbGV0IG5ld0V4U3R5bGUgPSAoY3VycmVudEV4U3R5bGUgJiBXU19FWF9BUFBXSU5ET1dfTUFTSykgJiBXU19FWF9MQVlFUkVEX01BU0s7XG4gIG5ld0V4U3R5bGUgPSBuZXdFeFN0eWxlIHwgV1NfRVhfVE9PTFdJTkRPVyB8IFdTX0VYX05PQUNUSVZBVEU7XG4gIFNldFdpbmRvd0xvbmdQdHJXKGh3bmQsIEdXTF9FWFNUWUxFLCBuZXdFeFN0eWxlKTtcblxuICAvLyAzLiDnpoHnlKjlnIbop5JcbiAgYXdhaXQgZGlzYWJsZVdpbmRvd1JvdW5kZWRDb3JuZXJzKGh3bmQpO1xuXG4gIC8vIDQuIOiOt+WPlueItueql+WPo+WuouaIt+WMuuWwuuWvuO+8jOmTuua7oVxuICBjb25zdCByZWN0QnVmID0gQnVmZmVyLmFsbG9jKDE2KTtcbiAgR2V0Q2xpZW50UmVjdChwYXJlbnRId25kLCByZWN0QnVmKTtcbiAgY29uc3QgcmVjdFJpZ2h0ID0gcmVjdEJ1Zi5yZWFkSW50MzJMRSg4KTtcbiAgY29uc3QgcmVjdEJvdHRvbSA9IHJlY3RCdWYucmVhZEludDMyTEUoMTIpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUGFyZW50IGNsaWVudCByZWN0OiAke3JlY3RSaWdodH14JHtyZWN0Qm90dG9tfWApO1xuXG4gIC8vIDUuIOiwg+aVtOeql+WPo+S9jee9ruWSjOWwuuWvuO+8jOW5tuaUvuWIsCBaIOmhuuW6j+W6lemDqO+8iEhXTkRfQk9UVE9N77yJXG4gIC8vIOS4jeS9v+eUqCBTV1BfTk9aT1JERVLvvIzorqkgaFduZEluc2VydEFmdGVyID0gSFdORF9CT1RUT00g55Sf5pWIXG4gIC8vIOi/meagt+Wjgee6uOeql+WPo+WcqCBTSEVMTERMTF9EZWZWaWV377yI5qGM6Z2i5Zu+5qCH77yJ5LmL5LiLXG4gIFNldFdpbmRvd1Bvcyhod25kLCBIV05EX0JPVFRPTSwgMCwgMCwgcmVjdFJpZ2h0LCByZWN0Qm90dG9tLCBTV1BfRlJBTUVDSEFOR0UgfCBTV1BfU0hPV1dJTkRPVyk7XG59XG5cbi8qKlxuICog5p+l5om+5aOB57q45bGCIFdvcmtlcldcbiAqXG4gKiBXaW5kb3dzIDExIOS4iiAweDA1MkMg5Y+v6IO95LiN6Kem5Y+R5YiG6KOC77yM5L2GIFByb2dtYW4g5YaF6YOo6YCa5bi45bey5pyJ5LiA5LiqIFdvcmtlclcg5a2Q56qX5Y+jXG4gKiDvvIjnlKjkuo7lo4HnurjmuLLmn5PvvInjgILov5nkuKogV29ya2VyVyDlsLHmmK/miJHku6zopoEgU2V0UGFyZW50IOeahOebruagh+OAglxuICpcbiAqIOetlueVpe+8mlxuICogMS4g5YWI5ZyoIFByb2dtYW4g5YaF6YOo5p+l5om+IFdvcmtlclcg5a2Q56qX5Y+jXG4gKiAyLiDlpoLmnpzmib7kuI3liLDvvIzlj5HpgIEgMHgwNTJDIOinpuWPkeWIhuijgu+8jOWGjeWcqOmhtuWxgiBXb3JrZXJXIOS4reafpeaJvlxuICovXG5hc3luYyBmdW5jdGlvbiBmaW5kV2FsbHBhcGVyV29ya2VyVyhcbiAgbGliOiBSZXR1cm5UeXBlPHR5cGVvZiBpbXBvcnQoJ2tvZmZpJykubG9hZD4sXG4gIGtvZmZpOiB0eXBlb2YgaW1wb3J0KCdrb2ZmaScpLFxuICBwcm9nbWFuOiBiaWdpbnRcbik6IFByb21pc2U8YmlnaW50IHwgbnVsbD4ge1xuICBjb25zdCBGaW5kV2luZG93RXhXID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBGaW5kV2luZG93RXhXKHVpbnRwdHJfdCBod25kUGFyZW50LCB1aW50cHRyX3QgaHduZENoaWxkQWZ0ZXIsIHN0cjE2IGxwc3pDbGFzcywgc3RyMTYgbHBzeldpbmRvdyknKTtcblxuICAvLyAxLiDlhYjlnKggUHJvZ21hbiDlhoXpg6jmn6Xmib4gV29ya2VyVyDlrZDnqpflj6PvvIhXaW5kb3dzIDExIOW4uOingeaDheWGte+8iVxuICBjb25zdCB3b3JrZXJXSW5Qcm9nbWFuUmF3ID0gRmluZFdpbmRvd0V4Vyhwcm9nbWFuLCAwLCAnV29ya2VyVycsIDApO1xuICBpZiAod29ya2VyV0luUHJvZ21hblJhdykge1xuICAgIGNvbnN0IHdvcmtlclcgPSB0b0JpZ0ludCh3b3JrZXJXSW5Qcm9nbWFuUmF3KTtcbiAgICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gRm91bmQgV29ya2VyVyBpbnNpZGUgUHJvZ21hbjogJHt3b3JrZXJXfWApO1xuICAgIHJldHVybiB3b3JrZXJXO1xuICB9XG5cbiAgLy8gMi4gUHJvZ21hbiDlhoXpg6jmsqHmnIkgV29ya2VyV++8jOWwneivleWPkemAgSAweDA1MkMg6Kem5Y+R5YiG6KOCXG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBObyBXb3JrZXJXIGluIFByb2dtYW4sIHNlbmRpbmcgMHgwNTJDIHRvIHRyaWdnZXIgc3BsaXQuLi4nKTtcbiAgY29uc3QgU2VuZE1lc3NhZ2VUaW1lb3V0VyA9IGxpYi5mdW5jKCdpbnRwdHJfdCBTZW5kTWVzc2FnZVRpbWVvdXRXKHVpbnRwdHJfdCBoV25kLCB1aW50MzIgbXNnLCB1aW50cHRyX3Qgd1BhcmFtLCBpbnRwdHJfdCBsUGFyYW0sIHVpbnQzMiBmdUZsYWdzLCB1aW50MzIgdVRpbWVvdXQsIF9PdXRfIGludHB0cl90ICpscGR3UmVzdWx0KScpO1xuICBjb25zdCByZXN1bHQgPSBbMG5dO1xuICBTZW5kTWVzc2FnZVRpbWVvdXRXKHByb2dtYW4sIDB4MDUyYywgMG4sIDBuLCAweDAwMDAsIDIwMDAsIHJlc3VsdCk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZW5kTWVzc2FnZVRpbWVvdXRXIDB4MDUyQyByZXN1bHQ6ICR7cmVzdWx0WzBdfWApO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDIwMCkpO1xuXG4gIC8vIDMuIOWGjeasoeafpeaJviBQcm9nbWFuIOWGhemDqOeahCBXb3JrZXJXXG4gIGNvbnN0IHdvcmtlcldJblByb2dtYW5SYXcyID0gRmluZFdpbmRvd0V4Vyhwcm9nbWFuLCAwLCAnV29ya2VyVycsIDApO1xuICBpZiAod29ya2VyV0luUHJvZ21hblJhdzIpIHtcbiAgICBjb25zdCB3b3JrZXJXID0gdG9CaWdJbnQod29ya2VyV0luUHJvZ21hblJhdzIpO1xuICAgIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBGb3VuZCBXb3JrZXJXIGluc2lkZSBQcm9nbWFuIGFmdGVyIDB4MDUyQzogJHt3b3JrZXJXfWApO1xuICAgIHJldHVybiB3b3JrZXJXO1xuICB9XG5cbiAgLy8gNC4g5pyA5ZCO5Zue6YCA77ya5Zyo6aG25bGC56qX5Y+j5Lit5p+l5om+5LiN5ZCrIFNIRUxMRExMX0RlZlZpZXcg55qEIFdvcmtlcldcbiAgaWYgKCFlbnVtV2luZG93c1Byb2NQcm90bykge1xuICAgIGVudW1XaW5kb3dzUHJvY1Byb3RvID0ga29mZmkucHJvdG8oJ2Jvb2wgX19zdGRjYWxsIEVudW1XaW5kb3dzUHJvYyh1aW50cHRyX3QgaHduZCwgbG9uZyBsUGFyYW0pJyk7XG4gIH1cbiAgY29uc3QgRW51bVdpbmRvd3MgPSBsaWIuZnVuYygnYm9vbCBFbnVtV2luZG93cyhFbnVtV2luZG93c1Byb2MgKmNiLCBsb25nIGxQYXJhbSknKTtcblxuICBsZXQgZGVmVmlld1BhcmVudDogYmlnaW50IHwgbnVsbCA9IG51bGw7XG4gIGNvbnN0IGZpbmRDYiA9ICh0b3BIYW5kbGVSYXc6IGJpZ2ludCB8IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IHRvcEhhbmRsZSA9IHRvQmlnSW50KHRvcEhhbmRsZVJhdyk7XG4gICAgY29uc3Qgc2hlbGxWaWV3ID0gRmluZFdpbmRvd0V4Vyh0b3BIYW5kbGUsIDAsICdTSEVMTERMTF9EZWZWaWV3JywgMCk7XG4gICAgaWYgKHNoZWxsVmlldykge1xuICAgICAgZGVmVmlld1BhcmVudCA9IHRvcEhhbmRsZTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIGNvbnN0IGNiUmVnID0ga29mZmkucmVnaXN0ZXIoZmluZENiLCBrb2ZmaS5wb2ludGVyKGVudW1XaW5kb3dzUHJvY1Byb3RvKSk7XG4gIEVudW1XaW5kb3dzKGNiUmVnLCAwKTtcbiAga29mZmkudW5yZWdpc3RlcihjYlJlZyk7XG5cbiAgaWYgKCFkZWZWaWV3UGFyZW50KSB7XG4gICAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBTSEVMTERMTF9EZWZWaWV3IG5vdCBmb3VuZCcpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTSEVMTERMTF9EZWZWaWV3IHBhcmVudDogJHtkZWZWaWV3UGFyZW50fWApO1xuXG4gIGxldCBjdXJyZW50OiBiaWdpbnQgPSBkZWZWaWV3UGFyZW50O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDMyOyBpKyspIHtcbiAgICBjb25zdCBuZXh0UmF3ID0gRmluZFdpbmRvd0V4VygwLCBjdXJyZW50LCAnV29ya2VyVycsIDApO1xuICAgIGlmICghbmV4dFJhdykgYnJlYWs7XG4gICAgY29uc3QgbmV4dCA9IHRvQmlnSW50KG5leHRSYXcpO1xuICAgIGNvbnN0IGNoaWxkID0gRmluZFdpbmRvd0V4VyhuZXh0LCAwLCAnU0hFTExETExfRGVmVmlldycsIDApO1xuICAgIGlmICghY2hpbGQpIHtcbiAgICAgIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBGb3VuZCB3YWxscGFwZXIgV29ya2VyVyAodG9wLWxldmVsKTogJHtuZXh0fWApO1xuICAgICAgcmV0dXJuIG5leHQ7XG4gICAgfVxuICAgIGN1cnJlbnQgPSBuZXh0O1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdbd2FsbHBhcGVyXSBXYWxscGFwZXIgV29ya2VyVyBub3QgZm91bmQnKTtcbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogV2luZG93c++8muWwhuWjgee6uOeql+WPoyBTZXRQYXJlbnQg5Yiw5qGM6Z2i5aOB57q45bGCIFdvcmtlcldcbiAqXG4gKiDmraPnoa7mtYHnqIvvvIhXYWxscGFwZXIgRW5naW5lIOagh+WHhuWBmuazle+8ie+8mlxuICogMS4g5ZCRIFByb2dtYW4g5Y+R6YCBIDB4MDUyQyDmtojmga/vvIzop6blj5HliIboo4Llh7ogV29ya2VyV1xuICogMi4g5om+5Yiw5aOB57q45bGCIFdvcmtlclfvvIhTSEVMTERMTF9EZWZWaWV3IOeahOWFhOW8nyBXb3JrZXJX77yM5LiN5ZCrIERlZlZpZXfvvIlcbiAqIDMuIFNldFBhcmVudCDliLDov5nkuKogV29ya2VyV1xuICpcbiAqIOWIhuijguWQjuahjOmdouWbvuagh+Wxgu+8iFNIRUxMRExMX0RlZlZpZXfvvInlkozlo4HnurjlsYLvvIhXb3JrZXJX77yJ5piv5YWE5byf5YWz57O777yMXG4gKiDlo4HnurjlsYLlnKjlm77moIflsYLkuIvmlrnvvIznlKjmiLfnnIvliLDnmoTmmK/lo4HnurggKyDlm77moIflj6DliqBcbiAqL1xuYXN5bmMgZnVuY3Rpb24gYXR0YWNoVG9EZXNrdG9wTGF5ZXIod2luOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xuXG4gIGNvbnN0IGxpYiA9IGF3YWl0IGxvYWRXaW4zMkxpYigpO1xuICBpZiAoIWxpYikgcmV0dXJuO1xuXG4gIGNvbnN0IGtvZmZpID0gYXdhaXQgbG9hZEtvZmZpKCk7XG4gIGNvbnN0IEZpbmRXaW5kb3dXID0gbGliLmZ1bmMoJ3VpbnRwdHJfdCBGaW5kV2luZG93VyhzdHIxNiBjbGFzc05hbWUsIHN0cjE2IHdpbmRvd05hbWUpJyk7XG4gIGNvbnN0IEZpbmRXaW5kb3dFeFcgPSBsaWIuZnVuYygndWludHB0cl90IEZpbmRXaW5kb3dFeFcodWludHB0cl90IGh3bmRQYXJlbnQsIHVpbnRwdHJfdCBod25kQ2hpbGRBZnRlciwgc3RyMTYgbHBzekNsYXNzLCBzdHIxNiBscHN6V2luZG93KScpO1xuICBjb25zdCBTZW5kTWVzc2FnZVRpbWVvdXRXID0gbGliLmZ1bmMoJ2ludHB0cl90IFNlbmRNZXNzYWdlVGltZW91dFcodWludHB0cl90IGhXbmQsIHVpbnQzMiBtc2csIHVpbnRwdHJfdCB3UGFyYW0sIGludHB0cl90IGxQYXJhbSwgdWludDMyIGZ1RmxhZ3MsIHVpbnQzMiB1VGltZW91dCwgX091dF8gaW50cHRyX3QgKmxwZHdSZXN1bHQpJyk7XG4gIGNvbnN0IFNldFBhcmVudCA9IGxpYi5mdW5jKCd1aW50cHRyX3QgU2V0UGFyZW50KHVpbnRwdHJfdCBoV25kQ2hpbGQsIHVpbnRwdHJfdCBoV25kTmV3UGFyZW50KScpO1xuXG4gIGlmICgha2VybmVsMzJMaWIpIHtcbiAgICBrZXJuZWwzMkxpYiA9IGtvZmZpLmxvYWQoJ2tlcm5lbDMyLmRsbCcpO1xuICB9XG4gIGNvbnN0IEdldExhc3RFcnJvciA9IGtlcm5lbDMyTGliLmZ1bmMoJ3VpbnQzMiBHZXRMYXN0RXJyb3IoKScpO1xuXG4gIC8vIOa1i+ivleeUqO+8muWcqCB3YWxscGFwZXIg5r+A5rS75pe26I635Y+W5LiA5qyhIEdldExhc3RFcnJvciDln7rnur9cblxuICBjb25zdCBod25kID0gcmVhZEh3bmQod2luLmdldE5hdGl2ZVdpbmRvd0hhbmRsZSgpKTtcbiAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIEF0dGFjaGluZyB3aW5kb3cgSFdORD0ke2h3bmR9YCk7XG5cbiAgLy8gMS4g5om+5YiwIFByb2dtYW5cbiAgY29uc3QgcHJvZ21hblJhdyA9IEZpbmRXaW5kb3dXKCdQcm9nbWFuJywgMCk7XG4gIGlmICghcHJvZ21hblJhdykge1xuICAgIGNvbnNvbGUud2FybignW3dhbGxwYXBlcl0gUHJvZ21hbiBub3QgZm91bmQnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvZ21hbiA9IHRvQmlnSW50KHByb2dtYW5SYXcpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUHJvZ21hbjogJHtwcm9nbWFufWApO1xuXG4gIC8vIDIuIOafpeaJvuWjgee6uOWxgiBXb3JrZXJXXG4gIGNvbnN0IHdvcmtlclcgPSBhd2FpdCBmaW5kV2FsbHBhcGVyV29ya2VyVyhsaWIsIGtvZmZpLCBwcm9nbWFuKTtcblxuICBpZiAoIXdvcmtlclcpIHtcbiAgICBjb25zb2xlLndhcm4oJ1t3YWxscGFwZXJdIFdvcmtlclcgbm90IGZvdW5kLCBhYm9ydCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZXRQYXJlbnQgdG8gV29ya2VyVzogJHt3b3JrZXJXfWApO1xuXG4gIC8vIDMuIFNldFBhcmVudCDliLAgV29ya2VyV1xuICBjb25zdCBwcmV2UGFyZW50ID0gU2V0UGFyZW50KGh3bmQsIHdvcmtlclcpO1xuICBjb25zdCBlcnIxID0gR2V0TGFzdEVycm9yKCk7XG4gIGNvbnNvbGUubG9nKGBbd2FsbHBhcGVyXSBTZXRQYXJlbnQ6IHByZXY9JHtwcmV2UGFyZW50fSwgZXJyPSR7ZXJyMX1gKTtcblxuICAvLyA0LiBTZXRQYXJlbnQg5ZCO6K6+572u56qX5Y+j5qC35byPXG4gIGF3YWl0IHNldHVwV2luZG93U3R5bGUoaHduZCwgd29ya2VyVyk7XG59XG5cbi8qKlxuICog5p6E5bu65aOB57q456qX5Y+j5Yqg6L2955qEIFVSTO+8iOaQuuW4puS4juS4u+eql+WPo+ebuOWQjOeahCBlbGVjdHJvbiDlh63mja4gKyB3YWxscGFwZXI9MSDmoIforrDvvIlcbiAqL1xuZnVuY3Rpb24gYnVpbGRXYWxscGFwZXJVcmwoZGlzcGxheTogX2VsZWN0cm9uLkRpc3BsYXkpOiBzdHJpbmcge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKGdldFdlYnZpZXdPcmlnaW4oKSk7XG4gIHVybC5wYXRobmFtZSA9ICcvb2MvJztcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ21vZGUnLCAnZWxlY3Ryb24nKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3NoZWxsVmVyc2lvbicsIF9fVkVSU0lPTl9fKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uUG9ydCcsIGVsZWN0cm9uUG9ydC50b1N0cmluZygpKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uVG9rZW4nLCBnbG9iYWxUaGlzLmVsZWN0cm9uVG9rZW4pO1xuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnd2FsbHBhcGVyJywgJzEnKTtcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2Rpc3BsYXlJZCcsIFN0cmluZyhkaXNwbGF5LmlkKSk7XG4gIHJldHVybiB1cmwudG9TdHJpbmcoKTtcbn1cblxuLyoqXG4gKiDkuLrmjIflrprmmL7npLrlmajliJvlu7rlo4Hnurjnqpflj6PvvIjkuI3nq4vljbMgc2hvd++8iVxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxscGFwZXJXaW5kb3coZGlzcGxheTogX2VsZWN0cm9uLkRpc3BsYXkpOiBfZWxlY3Ryb24uQnJvd3NlcldpbmRvdyB7XG4gIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gZGlzcGxheS5ib3VuZHM7XG5cbiAgY29uc3QgYmFzZU9wdGlvbnM6IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93Q29uc3RydWN0b3JPcHRpb25zID0ge1xuICAgIHgsXG4gICAgeSxcbiAgICB3aWR0aCxcbiAgICBoZWlnaHQsXG4gICAgZnJhbWU6IGZhbHNlLFxuICAgIHNob3c6IGZhbHNlLFxuICAgIHNraXBUYXNrYmFyOiB0cnVlLFxuICAgIGhhc1NoYWRvdzogZmFsc2UsXG4gICAgZm9jdXNhYmxlOiBmYWxzZSxcbiAgICBtb3ZhYmxlOiBmYWxzZSxcbiAgICByZXNpemFibGU6IGZhbHNlLFxuICAgIG1pbmltaXphYmxlOiBmYWxzZSxcbiAgICBtYXhpbWl6YWJsZTogZmFsc2UsXG4gICAgZnVsbHNjcmVlbmFibGU6IGZhbHNlLFxuICAgIHdlYlByZWZlcmVuY2VzOiB7XG4gICAgICBkZXZUb29sczogZmFsc2UsXG4gICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxuICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgIHNhbmRib3g6IHRydWUsXG4gICAgICAvLyDlo4Hnurjnqpflj6MgU2V0UGFyZW50IOWIsCBXb3JrZXJXIOS5i+S4i++8jENocm9taXVtIOS8muaMiSBoaWRkZW4g5aSE55CG5bm25oqKIHJBRiDoioLmtYHliLAgMUh677yMXG4gICAgICAvLyDlr7zoh7QgY2FudmFzLnZ1ZSDnmoQgZHJhdyDmr4/np5Llj6rog73ot5HkuIDmrKHjgIHljZXluKfopoHlgZrlrozmlbQgNyDlsYLph43nu5jvvIzop4bop4npmY3liLAgMX4zZnBz44CCXG4gICAgICAvLyDlhbPmjokgYmFja2dyb3VuZFRocm90dGxpbmcg6K6pIHZpc2liaWxpdHlTdGF0ZSDnu7TmjIEgdmlzaWJsZeOAgXJBRiDlm57liLAgfjYwSHrjgIJcbiAgICAgIC8vIHdhbGxwYXBlciDlnLrmma/kuIvmjIHnu63nu5jliLbmmK/pooTmnJ/ooYzkuLrvvIhXYWxscGFwZXIgRW5naW5lIOWQjOeQhu+8ie+8jGNhbnZhcy52dWUg5bey5pyJ6IqC5rWB44CCXG4gICAgICBiYWNrZ3JvdW5kVGhyb3R0bGluZzogZmFsc2UsXG4gICAgfSxcbiAgfTtcblxuICAvLyBtYWNPU++8mnR5cGU6ICdkZXNrdG9wJyDlsIbnqpflj6Pnva7kuo7moYzpnaLlm77moIfkuIvlsYJcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XG4gICAgYmFzZU9wdGlvbnMudHlwZSA9ICdkZXNrdG9wJztcbiAgICBiYXNlT3B0aW9ucy5lbmFibGVMYXJnZXJUaGFuU2NyZWVuID0gdHJ1ZTtcbiAgfVxuXG4gIGNvbnN0IHdpbiA9IG5ldyBlbGVjdHJvbi5Ccm93c2VyV2luZG93KGJhc2VPcHRpb25zKTtcblxuICB3aW4ud2ViQ29udGVudHMub24oJ3dpbGwtbmF2aWdhdGUnLCAoZXZlbnQsIHVybCkgPT4ge1xuICAgIGlmICh1cmwuc3RhcnRzV2l0aChnZXRXZWJ2aWV3T3JpZ2luKCkpKSByZXR1cm47XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBlbGVjdHJvbi5zaGVsbC5vcGVuRXh0ZXJuYWwodXJsKTtcbiAgfSk7XG4gIHdpbi53ZWJDb250ZW50cy5zZXRXaW5kb3dPcGVuSGFuZGxlcigoeyB1cmwgfSkgPT4ge1xuICAgIGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbCh1cmwpO1xuICAgIHJldHVybiB7IGFjdGlvbjogJ2RlbnknIH07XG4gIH0pO1xuXG4gIHdpbi5sb2FkVVJMKGJ1aWxkV2FsbHBhcGVyVXJsKGRpc3BsYXkpKTtcblxuICByZXR1cm4gd2luO1xufVxuXG4vKipcbiAqIOiuvue9ruWjgee6uO+8muS4uuaJgOacieaYvuekuuWZqOWIm+W7uuWjgee6uOeql+WPo1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0V2FsbHBhcGVyKCk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBjYW5jZWxXYWxscGFwZXIoKTtcblxuICBjb25zdCBkaXNwbGF5cyA9IGVsZWN0cm9uLnNjcmVlbi5nZXRBbGxEaXNwbGF5cygpO1xuICBmb3IgKGNvbnN0IGRpc3BsYXkgb2YgZGlzcGxheXMpIHtcbiAgICBjb25zdCB3aW4gPSBjcmVhdGVXYWxscGFwZXJXaW5kb3coZGlzcGxheSk7XG4gICAgd2FsbHBhcGVyV2luZG93cy5zZXQoZGlzcGxheS5pZCwgd2luKTtcblxuICAgIC8vIFdpbmRvd3PvvJrlhYggU2V0UGFyZW50IOWIsOahjOmdouWxgu+8jOWGjSBzaG93XG4gICAgLy8g6L+Z5qC356qX5Y+j5LuO5Ye655Sf5bCx5piv5qGM6Z2i5bGC55qE5a2Q56qX5Y+j77yM5LiN5Lya6KKrIFdpbitEIOacgOWwj+WMllxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgICBhd2FpdCBhdHRhY2hUb0Rlc2t0b3BMYXllcih3aW4pO1xuICAgIH1cblxuICAgIHdpbi5zaG93SW5hY3RpdmUoKTtcbiAgfVxuXG4gIC8vIFdpbmRvd3PvvJrlronoo4XpvKDmoIfpkqnlrZDvvIzovazlj5HpvKDmoIfkuovku7bliLDlo4Hnurjnqpflj6NcbiAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICBhd2FpdCBpbnN0YWxsTW91c2VIb29rKCk7XG4gICAgYXdhaXQgaW5zdGFsbFdoZWVsSG9vaygpO1xuICB9XG59XG5cbi8qKlxuICog5Y+W5raI5aOB57q477ya6ZSA5q+B5omA5pyJ5aOB57q456qX5Y+jXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjYW5jZWxXYWxscGFwZXIoKTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIOWFiOWNuOi9vem8oOagh+mSqeWtkFxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgIGF3YWl0IHVuaW5zdGFsbE1vdXNlSG9vaygpO1xuICB9XG5cbiAgZm9yIChjb25zdCB3aW4gb2Ygd2FsbHBhcGVyV2luZG93cy52YWx1ZXMoKSkge1xuICAgIGlmICghd2luLmlzRGVzdHJveWVkKCkpIHdpbi5kZXN0cm95KCk7XG4gIH1cbiAgd2FsbHBhcGVyV2luZG93cy5jbGVhcigpO1xufVxuXG4vKipcbiAqIOWkhOeQhuaYvuekuuWZqOWPmOWMlu+8muWjgee6uOa/gOa0u+aXtuWKqOaAgeWinuWIoOOAgemHjeaOkueql+WPo1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlRGlzcGxheUNoYW5nZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHdhbGxwYXBlcldpbmRvd3Muc2l6ZSA9PT0gMCkgcmV0dXJuO1xuXG4gIGNvbnN0IGRpc3BsYXlzID0gZWxlY3Ryb24uc2NyZWVuLmdldEFsbERpc3BsYXlzKCk7XG4gIGNvbnN0IGN1cnJlbnRJZHMgPSBuZXcgU2V0KHdhbGxwYXBlcldpbmRvd3Mua2V5cygpKTtcbiAgY29uc3QgbmV3SWRzID0gbmV3IFNldChkaXNwbGF5cy5tYXAoKGQpID0+IGQuaWQpKTtcblxuICBmb3IgKGNvbnN0IGlkIG9mIGN1cnJlbnRJZHMpIHtcbiAgICBpZiAoIW5ld0lkcy5oYXMoaWQpKSB7XG4gICAgICBjb25zdCB3aW4gPSB3YWxscGFwZXJXaW5kb3dzLmdldChpZCk7XG4gICAgICBpZiAod2luICYmICF3aW4uaXNEZXN0cm95ZWQoKSkgd2luLmRlc3Ryb3koKTtcbiAgICAgIHdhbGxwYXBlcldpbmRvd3MuZGVsZXRlKGlkKTtcbiAgICB9XG4gIH1cblxuICBmb3IgKGNvbnN0IGRpc3BsYXkgb2YgZGlzcGxheXMpIHtcbiAgICBpZiAoIXdhbGxwYXBlcldpbmRvd3MuaGFzKGRpc3BsYXkuaWQpKSB7XG4gICAgICBjb25zdCB3aW4gPSBjcmVhdGVXYWxscGFwZXJXaW5kb3coZGlzcGxheSk7XG4gICAgICB3YWxscGFwZXJXaW5kb3dzLnNldChkaXNwbGF5LmlkLCB3aW4pO1xuXG4gICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBhd2FpdCBhdHRhY2hUb0Rlc2t0b3BMYXllcih3aW4pO1xuICAgICAgfVxuXG4gICAgICB3aW4uc2hvd0luYWN0aXZlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdpbiA9IHdhbGxwYXBlcldpbmRvd3MuZ2V0KGRpc3BsYXkuaWQpITtcbiAgICAgIGlmICghd2luLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH0gPSBkaXNwbGF5LmJvdW5kcztcbiAgICAgICAgd2luLnNldEJvdW5kcyh7IHgsIHksIHdpZHRoLCBoZWlnaHQgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICog6I635Y+W5b2T5YmN5aOB57q454q25oCBXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1dhbGxwYXBlckFjdGl2ZSgpOiBib29sZWFuIHtcbiAgcmV0dXJuIHdhbGxwYXBlcldpbmRvd3Muc2l6ZSA+IDA7XG59XG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIOm8oOagh+S6i+S7tumAj+S8oFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8g5aOB57q456qX5Y+j5L2N5LqO5qGM6Z2i5Zu+5qCH5bGC5LiL5pa577yM6buY6K6k5o6l5pS25LiN5Yiw6byg5qCH5LqL5Lu244CCXG4vLyDpgJrov4fova7or6IgR2V0QXN5bmNLZXlTdGF0ZSArIHNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCDojrflj5bpvKDmoIfnirbmgIHvvIxcbi8vIOeUqCB3ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCDms6jlhaXliLDlo4Hnurjnqpflj6PjgIJcblxuLyoqXG4gKiDlronoo4XpvKDmoIfkuovku7bpgI/kvKBcbiAqXG4gKiDmlrnmoYjvvJrnlKggR2V0QXN5bmNLZXlTdGF0ZSDova7or6LpvKDmoIfmjInplK7nirbmgIEgKyBzY3JlZW4uZ2V0Q3Vyc29yU2NyZWVuUG9pbnQg6I635Y+W6byg5qCH5L2N572u77yMXG4gKiDpgJrov4cgRWxlY3Ryb24gd2ViQ29udGVudHMuc2VuZElucHV0RXZlbnQg5rOo5YWl5Yiw5aOB57q456qX5Y+j44CCXG4gKlxuICog5LiN5L2/55SoIFdIX01PVVNFX0xMIOWFqOWxgOmSqeWtkO+8jOWboOS4uiBrb2ZmaSDlm57osIPlnKggRWxlY3Ryb24g5Li76L+b56iL5raI5oGv5b6q546v5Lit5peg5rOV6KKr5q2j56Gu6LCD5bqm44CCXG4gKiDova7or6LmlrnmoYjnroDljZXlj6/pnaDvvIzkuJTlhbzlrrnop6bmkbjlsY/vvIjop6bmkbjkvJrooqvns7vnu5/ovazkuLrpvKDmoIfnirbmgIHvvInjgIJcbiAqL1xuXG5sZXQgbW91c2VQb2xsVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5sZXQgb2JzY3VyZUNoZWNrVGltZXI6IE5vZGVKUy5UaW1lb3V0IHwgbnVsbCA9IG51bGw7XG5sZXQgbGFzdEN1cnNvclBvcyA9IHsgeDogLTEsIHk6IC0xIH07XG5sZXQgbGFzdEJ1dHRvblN0YXRlcyA9IHsgbGVmdDogZmFsc2UsIHJpZ2h0OiBmYWxzZSwgbWlkZGxlOiBmYWxzZSB9O1xuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsTW91c2VIb29rKCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xuICBpZiAobW91c2VQb2xsVGltZXIpIHJldHVybjtcblxuICBjb25zdCBsaWIgPSBhd2FpdCBsb2FkV2luMzJMaWIoKTtcbiAgaWYgKCFsaWIpIHJldHVybjtcblxuICBjb25zdCBHZXRBc3luY0tleVN0YXRlID0gbGliLmZ1bmMoJ2ludDE2IEdldEFzeW5jS2V5U3RhdGUoaW50MzIgdktleSknKTtcbiAgY29uc3QgR2V0Rm9yZWdyb3VuZFdpbmRvdyA9IGxpYi5mdW5jKCd1aW50cHRyX3QgR2V0Rm9yZWdyb3VuZFdpbmRvdygpJyk7XG4gIGNvbnN0IEdldENsYXNzTmFtZVcgPSBsaWIuZnVuYygnaW50MzIgR2V0Q2xhc3NOYW1lVyh1aW50cHRyX3QgaFduZCwgdm9pZCAqbHBDbGFzc05hbWUsIGludDMyIG5NYXhDb3VudCknKTtcblxuICAvLyDmo4Dmn6XliY3lj7Dnqpflj6PmmK/lkKbmmK/moYzpnaLvvIhQcm9nbWFuIOaIliBXb3JrZXJX77yJXG4gIC8vIOWPquacieahjOmdouWcqOWJjeWPsOaXtu+8jOWjgee6uOaJjemcgOimgeaOpeaUtum8oOagh+S6i+S7tlxuICBjb25zdCBjbGFzc05hbWVCdWYgPSBCdWZmZXIuYWxsb2MoNTEyKTtcbiAgY29uc3QgaXNEZXNrdG9wRm9yZWdyb3VuZCA9ICgpOiBib29sZWFuID0+IHtcbiAgICBjbGFzc05hbWVCdWYuZmlsbCgwKTtcbiAgICBjb25zdCBmZyA9IEdldEZvcmVncm91bmRXaW5kb3coKTtcbiAgICBpZiAoIWZnIHx8IGZnID09PSAwbikgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGxlbiA9IEdldENsYXNzTmFtZVcoZmcsIGNsYXNzTmFtZUJ1ZiwgMjU2KTtcbiAgICBpZiAobGVuIDw9IDApIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBjbHMgPSBjbGFzc05hbWVCdWYudG9TdHJpbmcoJ3V0ZjE2bGUnLCAwLCBsZW4gKiAyKTtcbiAgICByZXR1cm4gY2xzID09PSAnUHJvZ21hbicgfHwgY2xzID09PSAnV29ya2VyVyc7XG4gIH07XG5cbiAgLy8g5byC5q2l5Yik5a6a55qE5ZCO5Y+w6YGu6JS954q25oCB77ya6buY6K6kIGZhbHNl77yI5pyq6YGu5L2P77yJ77yM55Sx5a6a5pe25Zmo5q+PIDI1MG1zIOiwg+eUqCBpc0Rlc2t0b3BPYnNjdXJlZCDmm7TmlrDjgIJcbiAgLy8g5byC5q2l5Yik5a6a5pyJIH4yNTBtcyDlu7bov5/kuI3lvbHlk43kuqTkupLmhJ/nn6XvvIjpvKDmoIfpgI/kvKDnlLHliY3lj7DnirbmgIHlv6vpgJ/ot6/lvoTlhrPlrprvvInjgIJcbiAgbGV0IGRlc2t0b3BPYnNjdXJlZCA9IGZhbHNlO1xuXG4gIC8vIFZLX0xCVVRUT049MHgwMSwgVktfUkJVVFRPTj0weDAyLCBWS19NQlVUVE9OPTB4MDRcbiAgY29uc3QgcG9sbEludGVydmFsID0gNDA7IC8vIH4yNWZwc1xuXG4gIC8vIOeLrOeri+aFoui9ruivou+8mjI1MG1zIOS4gOasoe+8jOabtOaWsCBkZXNrdG9wT2JzY3VyZWTjgIJcbiAgLy8g5Y2V54us5byC5q2l6ICM5LiN5rGh5p+T5Li76L2u6K+i6IqC5aWP77yMV2luMzIg5aSx6LSl5pe25L+d5oyBIGZhbHNl77yI5oyJ55So5oi36KaB5rGC5a6B5Y+v5aSa5rWq6LS5IENQVe+8ieOAglxuICBvYnNjdXJlQ2hlY2tUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICB2b2lkIGlzRGVza3RvcE9ic2N1cmVkKCkudGhlbigodikgPT4ge1xuICAgICAgZGVza3RvcE9ic2N1cmVkID0gdjtcbiAgICB9KTtcbiAgfSwgMjUwKTtcblxuICBtb3VzZVBvbGxUaW1lciA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG5cbiAgICBpZiAoIWlzRGVza3RvcEZvcmVncm91bmQoKSkge1xuICAgICAgLy8g5qGM6Z2i6Z2e5YmN5Y+w77ya5L+d55WZXCLlm57mraNcIuivreS5ie+8jOazqOWFpSBtb3VzZU1vdmUg5Yiw56qX5Y+j5Lit5b+D6Kem5Y+RIGNhbnZhcyDlm57mraPliqjnlLvvvIxcbiAgICAgIC8vIOS9huS7heWcqCB3YWxscGFwZXIg5pyq6KKr5YmN5Y+w56qX5Y+j5a6M5YWo6KaG55uW5pe25omn6KGM44CC6KKr6YGu5oyh77yI5pyA5aSn5YyWL+WFqOWxj++8ieaXtuebtOaOpeWBnOatoumAj+S8oO+8jFxuICAgICAgLy8g6YG/5YWN5ZCRIGhpZGRlbiB3ZWJDb250ZW50cyDmjIHnu63ms6jlhaUgZ2hvc3QgbW91c2VNb3ZlIOinpuWPkeaXoOaEj+S5ieeahOmHjee7mOOAglxuICAgICAgbGFzdEN1cnNvclBvcyA9IHsgeDogLTEsIHk6IC0xIH07XG4gICAgICBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBmYWxzZSwgcmlnaHQ6IGZhbHNlLCBtaWRkbGU6IGZhbHNlIH07XG4gICAgICBpZiAoZGVza3RvcE9ic2N1cmVkKSByZXR1cm47XG4gICAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICAgIGlmICh3aW4uaXNEZXN0cm95ZWQoKSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGJvdW5kcyA9IHdpbi5nZXRCb3VuZHMoKTtcbiAgICAgICAgY29uc3QgY2VudGVyWCA9IE1hdGguZmxvb3IoYm91bmRzLndpZHRoIC8gMik7XG4gICAgICAgIGNvbnN0IGNlbnRlclkgPSBNYXRoLmZsb29yKGJvdW5kcy5oZWlnaHQgLyAyKTtcbiAgICAgICAgd2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHsgdHlwZTogJ21vdXNlTW92ZScsIHg6IGNlbnRlclgsIHk6IGNlbnRlclkgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8g6K+75Y+W5oyJ6ZSu54q25oCB77yIR2V0QXN5bmNLZXlTdGF0ZSDmnIDpq5jkvY3kuLogMSDooajnpLrmjInkuIvvvIlcbiAgICBjb25zdCBsZWZ0RG93biA9IChHZXRBc3luY0tleVN0YXRlKDB4MDEpICYgMHg4MDAwKSAhPT0gMDtcbiAgICBjb25zdCByaWdodERvd24gPSAoR2V0QXN5bmNLZXlTdGF0ZSgweDAyKSAmIDB4ODAwMCkgIT09IDA7XG4gICAgY29uc3QgbWlkZGxlRG93biA9IChHZXRBc3luY0tleVN0YXRlKDB4MDQpICYgMHg4MDAwKSAhPT0gMDtcblxuICAgIC8vIOiOt+WPlum8oOagh+S9jee9rlxuICAgIGNvbnN0IHBvcyA9IGVsZWN0cm9uLnNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCgpO1xuXG4gICAgLy8g5om+5Yiw6byg5qCH5omA5Zyo5pi+56S65Zmo55qE5aOB57q456qX5Y+jXG4gICAgbGV0IHRhcmdldFdpbjogX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsID0gbnVsbDtcbiAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICBpZiAod2luLmlzRGVzdHJveWVkKCkpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgYm91bmRzID0gd2luLmdldEJvdW5kcygpO1xuICAgICAgaWYgKHBvcy54ID49IGJvdW5kcy54ICYmIHBvcy54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICBwb3MueSA+PSBib3VuZHMueSAmJiBwb3MueSA8IGJvdW5kcy55ICsgYm91bmRzLmhlaWdodCkge1xuICAgICAgICB0YXJnZXRXaW4gPSB3aW47XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGFyZ2V0V2luKSB7XG4gICAgICAvLyDpvKDmoIfkuI3lnKjku7vkvZXlo4Hnurjnqpflj6PkuIrvvIzmm7TmlrDnirbmgIHkvYbkuI3ovazlj5FcbiAgICAgIGxhc3RDdXJzb3JQb3MgPSBwb3M7XG4gICAgICBsYXN0QnV0dG9uU3RhdGVzID0geyBsZWZ0OiBsZWZ0RG93biwgcmlnaHQ6IHJpZ2h0RG93biwgbWlkZGxlOiBtaWRkbGVEb3duIH07XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYm91bmRzID0gdGFyZ2V0V2luLmdldEJvdW5kcygpO1xuICAgIGNvbnN0IHggPSBwb3MueCAtIGJvdW5kcy54O1xuICAgIGNvbnN0IHkgPSBwb3MueSAtIGJvdW5kcy55O1xuXG4gICAgLy8g6byg5qCH56e75YqoXG4gICAgaWYgKHBvcy54ICE9PSBsYXN0Q3Vyc29yUG9zLnggfHwgcG9zLnkgIT09IGxhc3RDdXJzb3JQb3MueSkge1xuICAgICAgdGFyZ2V0V2luLndlYkNvbnRlbnRzLnNlbmRJbnB1dEV2ZW50KHsgdHlwZTogJ21vdXNlTW92ZScsIHgsIHkgfSk7XG4gICAgfVxuXG4gICAgLy8g5bem6ZSuXG4gICAgaWYgKGxlZnREb3duICE9PSBsYXN0QnV0dG9uU3RhdGVzLmxlZnQpIHtcbiAgICAgIHRhcmdldFdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgIHR5cGU6IGxlZnREb3duID8gJ21vdXNlRG93bicgOiAnbW91c2VVcCcsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGJ1dHRvbjogJ2xlZnQnLFxuICAgICAgICBjbGlja0NvdW50OiAxLFxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIOWPs+mUrlxuICAgIGlmIChyaWdodERvd24gIT09IGxhc3RCdXR0b25TdGF0ZXMucmlnaHQpIHtcbiAgICAgIHRhcmdldFdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgIHR5cGU6IHJpZ2h0RG93biA/ICdtb3VzZURvd24nIDogJ21vdXNlVXAnLFxuICAgICAgICB4LCB5LFxuICAgICAgICBidXR0b246ICdyaWdodCcsXG4gICAgICAgIGNsaWNrQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG4gICAgLy8g5Lit6ZSuXG4gICAgaWYgKG1pZGRsZURvd24gIT09IGxhc3RCdXR0b25TdGF0ZXMubWlkZGxlKSB7XG4gICAgICB0YXJnZXRXaW4ud2ViQ29udGVudHMuc2VuZElucHV0RXZlbnQoe1xuICAgICAgICB0eXBlOiBtaWRkbGVEb3duID8gJ21vdXNlRG93bicgOiAnbW91c2VVcCcsXG4gICAgICAgIHgsIHksXG4gICAgICAgIGJ1dHRvbjogJ21pZGRsZScsXG4gICAgICAgIGNsaWNrQ291bnQ6IDEsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsYXN0Q3Vyc29yUG9zID0gcG9zO1xuICAgIGxhc3RCdXR0b25TdGF0ZXMgPSB7IGxlZnQ6IGxlZnREb3duLCByaWdodDogcmlnaHREb3duLCBtaWRkbGU6IG1pZGRsZURvd24gfTtcbiAgfSwgcG9sbEludGVydmFsKTtcblxuICBjb25zb2xlLmxvZygnW3dhbGxwYXBlcl0gTW91c2UgcG9sbCBzdGFydGVkICg0MG1zIGludGVydmFsLCBkZXNrdG9wLW9ubHkpJyk7XG59XG5cbi8qKlxuICog5a6J6KOF6byg5qCH5rua6L2u6YCP5LygXG4gKlxuICog5rua6L2u5peg5rOV6YCa6L+HIEdldEFzeW5jS2V5U3RhdGUg6L2u6K+i6I635Y+W77yI5piv5LqL5Lu26ICM6Z2e54q25oCB77yJ44CCXG4gKiDmlrnmoYjvvJrnlKggUmF3SW5wdXQgKyBob29rV2luZG93TWVzc2FnZShXTV9JTlBVVCkgKyBHZXRSYXdJbnB1dERhdGHjgIJcbiAqXG4gKiDlhbPplK7ngrnvvJpcbiAqIC0g55SoIFJJREVWX0lOUFVUU0lOSyDms6jlhowgUmF3SW5wdXQg5Yiw5Li756qX5Y+j77yI5Y2z5L2/5Li756qX5Y+j5LiN5Zyo5YmN5Y+w5Lmf5o6l5pS26L6T5YWl77yJXG4gKiAtIE1TRE4g5piO56Gu6KeE5a6aIFJJREVWX05PUVVFVUUg5LiN6IO95LiOIFJJREVWX0lOUFVUU0lOSyDnu4TlkIjvvIzmiYDku6Xkuovku7bkvJrku6UgV01fSU5QVVQg5oqV6YCSXG4gKiAtIEVsZWN0cm9uIOeahCBob29rV2luZG93TWVzc2FnZSBjYWxsYmFjayDlnKggVUkg57q/56iL5ZCM5q2l5omn6KGM77yI6YCa6L+HIHY4OjpMb2NrZXLvvInvvIxcbiAqICAgSFJBV0lOUFVUIOWPpeafhOWcqCBjYWxsYmFjayDmnJ/pl7Tku43nhLbmnInmlYjvvIzlj6/ku6XlronlhajosIPnlKggR2V0UmF3SW5wdXREYXRhXG4gKiAtIGNhbGxiYWNrIOS4reWGjeasoeajgOafpeWJjeWPsOeql+WPo+aYr+WQpuS4uuahjOmdou+8iFByb2dtYW4vV29ya2VyV++8ie+8jOmBv+WFjemdnuahjOmdouWcuuaZr+ivr+inpuWPkVxuICpcbiAqIOS4u+eql+WPo+awuOi/nOWtmOWcqO+8iGNsb3NlIOiiq+aLpuaIquS4uiBoaWRl77yJ77yM5piv5rOo5YaMIFJhd0lucHV0IOeahOeQhuaDs+i9veS9k+OAglxuICovXG5sZXQgd2hlZWxIb29rSW5zdGFsbGVkID0gZmFsc2U7XG5sZXQgd2hlZWxIb29rTWFpbldpbjogX2VsZWN0cm9uLkJyb3dzZXJXaW5kb3cgfCBudWxsID0gbnVsbDtcbmxldCBnZXRSYXdJbnB1dERhdGFGbjogKChoUmF3SW5wdXQ6IGJpZ2ludCwgdWlDb21tYW5kOiBudW1iZXIsIHBEYXRhOiBCdWZmZXIgfCBudWxsLCBwY2JTaXplOiBCdWZmZXIsIGNiU2l6ZUhlYWRlcjogbnVtYmVyKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5sZXQgZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuOiAoKCkgPT4gYmlnaW50KSB8IG51bGwgPSBudWxsO1xubGV0IGdldENsYXNzTmFtZVdGbjogKChoV25kOiBiaWdpbnQsIGxwQ2xhc3NOYW1lOiBCdWZmZXIsIG5NYXhDb3VudDogbnVtYmVyKSA9PiBudW1iZXIpIHwgbnVsbCA9IG51bGw7XG5jb25zdCBXTV9JTlBVVCA9IDB4MDBGRjtcbmNvbnN0IFJJRF9JTlBVVCA9IDB4MTAwMDAwMDM7XG5jb25zdCBSSU1fVFlQRU1PVVNFID0gMDtcbmNvbnN0IFJJX01PVVNFX1dIRUVMID0gMHgwNDAwO1xuY29uc3QgUkFXSU5QVVRIRUFERVJfU0laRSA9IDI0O1xuXG4vLyDlpI3nlKggQnVmZmVyIOmBv+WFjeavj+asoSBjYWxsYmFjayDliIbphY1cbmNvbnN0IHJhd0lucHV0RGF0YUJ1ZiA9IEJ1ZmZlci5hbGxvYygxMDI0KTtcbmNvbnN0IHJhd0lucHV0U2l6ZUJ1ZiA9IEJ1ZmZlci5hbGxvYyg0KTtcbmNvbnN0IGNsYXNzTmFtZUJ1ZldoZWVsID0gQnVmZmVyLmFsbG9jKDUxMik7XG5cbmZ1bmN0aW9uIGlzRGVza3RvcEZvcmVncm91bmRCeVdpbjMyKCk6IGJvb2xlYW4ge1xuICBpZiAoIWdldEZvcmVncm91bmRXaW5kb3dGbiB8fCAhZ2V0Q2xhc3NOYW1lV0ZuKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGZnID0gZ2V0Rm9yZWdyb3VuZFdpbmRvd0ZuKCk7XG4gIGlmICghZmcgfHwgZmcgPT09IDBuKSByZXR1cm4gZmFsc2U7XG4gIGNsYXNzTmFtZUJ1ZldoZWVsLmZpbGwoMCk7XG4gIGNvbnN0IGxlbiA9IGdldENsYXNzTmFtZVdGbihmZywgY2xhc3NOYW1lQnVmV2hlZWwsIDI1Nik7XG4gIGlmIChsZW4gPD0gMCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjbHMgPSBjbGFzc05hbWVCdWZXaGVlbC50b1N0cmluZygndXRmMTZsZScsIDAsIGxlbiAqIDIpO1xuICByZXR1cm4gY2xzID09PSAnUHJvZ21hbicgfHwgY2xzID09PSAnV29ya2VyVyc7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxXaGVlbEhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmICh3aGVlbEhvb2tJbnN0YWxsZWQpIHJldHVybjtcblxuICBjb25zdCBtYWluV2luID0gYXdhaXQgZ2V0V2Vidmlld1dpbmRvdygpO1xuICBpZiAobWFpbldpbi5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XG5cbiAgY29uc3QgbGliID0gYXdhaXQgbG9hZFdpbjMyTGliKCk7XG4gIGlmICghbGliKSByZXR1cm47XG5cbiAgY29uc3QgUmVnaXN0ZXJSYXdJbnB1dERldmljZXMgPSBsaWIuZnVuYygndWludDMyIFJlZ2lzdGVyUmF3SW5wdXREZXZpY2VzKHZvaWQgKnBSYXdJbnB1dERldmljZXMsIHVpbnQzMiB1aU51bURldmljZXMsIHVpbnQzMiBjYlNpemUpJyk7XG4gIGdldFJhd0lucHV0RGF0YUZuID0gbGliLmZ1bmMoJ3VpbnQzMiBHZXRSYXdJbnB1dERhdGEodWludHB0cl90IGhSYXdJbnB1dCwgdWludDMyIHVpQ29tbWFuZCwgdm9pZCAqcERhdGEsIHZvaWQgKnBjYlNpemUsIHVpbnQzMiBjYlNpemVIZWFkZXIpJyk7XG4gIGdldEZvcmVncm91bmRXaW5kb3dGbiA9IGxpYi5mdW5jKCd1aW50cHRyX3QgR2V0Rm9yZWdyb3VuZFdpbmRvdygpJyk7XG4gIGdldENsYXNzTmFtZVdGbiA9IGxpYi5mdW5jKCdpbnQzMiBHZXRDbGFzc05hbWVXKHVpbnRwdHJfdCBoV25kLCB2b2lkICpscENsYXNzTmFtZSwgaW50MzIgbk1heENvdW50KScpO1xuXG4gIGNvbnN0IGtvZmZpRm9yRXJyID0gYXdhaXQgbG9hZEtvZmZpKCk7XG4gIGlmICgha2VybmVsMzJMaWIpIGtlcm5lbDMyTGliID0ga29mZmlGb3JFcnIubG9hZCgna2VybmVsMzIuZGxsJyk7XG4gIGNvbnN0IEdldExhc3RFcnJvciA9IGtlcm5lbDMyTGliLmZ1bmMoJ3VpbnQzMiBHZXRMYXN0RXJyb3IoKScpO1xuXG4gIGNvbnN0IG1haW5Id25kID0gcmVhZEh3bmQobWFpbldpbi5nZXROYXRpdmVXaW5kb3dIYW5kbGUoKSk7XG5cbiAgLy8gUkFXSU5QVVRERVZJQ0U6IHVzVXNhZ2VQYWdlKDIpICsgdXNVc2FnZSgyKSArIGR3RmxhZ3MoNCkgKyBod25kVGFyZ2V0KDgpID0gMTYgYnl0ZXNcbiAgY29uc3QgcmlkID0gQnVmZmVyLmFsbG9jKDE2KTtcbiAgcmlkLndyaXRlVUludDE2TEUoMHgwMSwgMCk7IC8vIHVzVXNhZ2VQYWdlID0gR2VuZXJpYyBEZXNrdG9wXG4gIHJpZC53cml0ZVVJbnQxNkxFKDB4MDIsIDIpOyAvLyB1c1VzYWdlID0gTW91c2VcbiAgcmlkLndyaXRlVUludDMyTEUoMHgwMDAwMDEwMCwgNCk7IC8vIFJJREVWX0lOUFVUU0lOSyBvbmx5XG4gIHJpZC53cml0ZUJpZ1VJbnQ2NExFKG1haW5Id25kLCA4KTsgLy8gaHduZFRhcmdldFxuXG4gIGNvbnN0IG9rID0gUmVnaXN0ZXJSYXdJbnB1dERldmljZXMocmlkLCAxLCAxNik7XG4gIGNvbnN0IGVyciA9IEdldExhc3RFcnJvcigpO1xuICBjb25zb2xlLmxvZyhgW3dhbGxwYXBlcl0gUmVnaXN0ZXJSYXdJbnB1dERldmljZXM6IG9rPSR7b2t9IGVycj0ke2Vycn1gKTtcbiAgaWYgKG9rID09PSAwKSB7XG4gICAgY29uc29sZS53YXJuKGBbd2FsbHBhcGVyXSBSZWdpc3RlclJhd0lucHV0RGV2aWNlcyBmYWlsZWRgKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB3aGVlbEhvb2tNYWluV2luID0gbWFpbldpbjtcbiAgbGV0IHdoZWVsRXZlbnRDb3VudCA9IDA7XG5cbiAgbWFpbldpbi5ob29rV2luZG93TWVzc2FnZShXTV9JTlBVVCwgKHdQYXJhbTogQnVmZmVyLCBsUGFyYW06IEJ1ZmZlcikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAod2FsbHBhcGVyV2luZG93cy5zaXplID09PSAwKSByZXR1cm47XG4gICAgICAvLyDlj6rlnKjmoYzpnaLkuLrliY3lj7Dml7bovazlj5Hmu5rova7vvIjkuI7pvKDmoIfpgI/kvKDkv53mjIHkuIDoh7TvvIlcbiAgICAgIGlmICghaXNEZXNrdG9wRm9yZWdyb3VuZEJ5V2luMzIoKSkgcmV0dXJuO1xuICAgICAgaWYgKCFnZXRSYXdJbnB1dERhdGFGbikgcmV0dXJuO1xuXG4gICAgICAvLyBsUGFyYW0g5pivIEhSQVdJTlBVVCDlj6Xmn4TvvIg2NCDkvY3ns7vnu5/kuLogOCDlrZfoioLvvIlcbiAgICAgIGNvbnN0IGhSYXdJbnB1dCA9IGxQYXJhbS5sZW5ndGggPj0gOCA/IGxQYXJhbS5yZWFkQmlnVUludDY0TEUoMCkgOiBCaWdJbnQobFBhcmFtLnJlYWRVSW50MzJMRSgwKSk7XG5cbiAgICAgIC8vIOiwg+eUqCBHZXRSYXdJbnB1dERhdGEg6K+75Y+W5pWw5o2uXG4gICAgICByYXdJbnB1dFNpemVCdWYud3JpdGVVSW50MzJMRShyYXdJbnB1dERhdGFCdWYubGVuZ3RoLCAwKTtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGdldFJhd0lucHV0RGF0YUZuKGhSYXdJbnB1dCwgUklEX0lOUFVULCByYXdJbnB1dERhdGFCdWYsIHJhd0lucHV0U2l6ZUJ1ZiwgUkFXSU5QVVRIRUFERVJfU0laRSk7XG5cbiAgICAgIGlmIChyZXN1bHQgPT09IDAgfHwgcmVzdWx0ID09PSAweEZGRkZGRkZGKSB7XG4gICAgICAgIC8vIOS7heWcqOWIneasoeWksei0peaXtuiusOW9le+8jOmBv+WFjeaXpeW/l+WIt+Wxj1xuICAgICAgICBpZiAod2hlZWxFdmVudENvdW50ID09PSAwKSB7XG4gICAgICAgICAgY29uc3QgbGFzdEVyciA9IEdldExhc3RFcnJvcigpO1xuICAgICAgICAgIGNvbnNvbGUud2FybihgW3dhbGxwYXBlcl0gR2V0UmF3SW5wdXREYXRhIGZhaWxlZDogcmVzdWx0PSR7cmVzdWx0fSBlcnI9JHtsYXN0RXJyfWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZHdUeXBlID0gcmF3SW5wdXREYXRhQnVmLnJlYWRVSW50MzJMRSgwKTtcbiAgICAgIGlmIChkd1R5cGUgIT09IFJJTV9UWVBFTU9VU0UpIHJldHVybjtcblxuICAgICAgLy8gUkFXTU9VU0Ug57Sn5o6lIFJBV0lOUFVUSEVBREVS77yaXG4gICAgICAvLyAgIHVzRmxhZ3MoMC0yKSArIHBhZGRpbmcoMi00KSArIHVsQnV0dG9ucyDogZTlkIjkvZMoNC04KSArIHVsUmF3QnV0dG9ucyg4LTEyKSArIGxMYXN0WCgxMi0xNikgKyBsTGFzdFkoMTYtMjApICsgZHdFeHRyYUluZm8oMjAtMjQpXG4gICAgICBjb25zdCB1bEJ1dHRvbnMgPSByYXdJbnB1dERhdGFCdWYucmVhZFVJbnQzMkxFKFJBV0lOUFVUSEVBREVSX1NJWkUgKyA0KTtcbiAgICAgIGNvbnN0IHVzQnV0dG9uRmxhZ3MgPSB1bEJ1dHRvbnMgJiAweGZmZmY7XG5cbiAgICAgIGlmICgodXNCdXR0b25GbGFncyAmIFJJX01PVVNFX1dIRUVMKSAhPT0gMCkge1xuICAgICAgICBjb25zdCB1c0J1dHRvbkRhdGFSYXcgPSAodWxCdXR0b25zID4+PiAxNikgJiAweGZmZmY7XG4gICAgICAgIGNvbnN0IGRlbHRhID0gdXNCdXR0b25EYXRhUmF3ID4gMHg3ZmZmID8gdXNCdXR0b25EYXRhUmF3IC0gMHgxMDAwMCA6IHVzQnV0dG9uRGF0YVJhdztcblxuICAgICAgICB3aGVlbEV2ZW50Q291bnQrKztcbiAgICAgICAgaWYgKHdoZWVsRXZlbnRDb3VudCA8PSAzKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYFt3YWxscGFwZXJdIFdoZWVsIGV2ZW50OiBkZWx0YT0ke2RlbHRhfSAoY291bnQ9JHt3aGVlbEV2ZW50Q291bnR9KWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6L2s5Y+R5Yiw6byg5qCH5omA5Zyo5pi+56S65Zmo55qE5aOB57q456qX5Y+jXG4gICAgICAgIGNvbnN0IHBvcyA9IGVsZWN0cm9uLnNjcmVlbi5nZXRDdXJzb3JTY3JlZW5Qb2ludCgpO1xuICAgICAgICBmb3IgKGNvbnN0IHdpbiBvZiB3YWxscGFwZXJXaW5kb3dzLnZhbHVlcygpKSB7XG4gICAgICAgICAgaWYgKHdpbi5pc0Rlc3Ryb3llZCgpKSBjb250aW51ZTtcbiAgICAgICAgICBjb25zdCBib3VuZHMgPSB3aW4uZ2V0Qm91bmRzKCk7XG4gICAgICAgICAgaWYgKHBvcy54ID49IGJvdW5kcy54ICYmIHBvcy54IDwgYm91bmRzLnggKyBib3VuZHMud2lkdGggJiZcbiAgICAgICAgICAgICAgcG9zLnkgPj0gYm91bmRzLnkgJiYgcG9zLnkgPCBib3VuZHMueSArIGJvdW5kcy5oZWlnaHQpIHtcbiAgICAgICAgICAgIHdpbi53ZWJDb250ZW50cy5zZW5kSW5wdXRFdmVudCh7XG4gICAgICAgICAgICAgIHR5cGU6ICdtb3VzZVdoZWVsJyxcbiAgICAgICAgICAgICAgeDogcG9zLnggLSBib3VuZHMueCxcbiAgICAgICAgICAgICAgeTogcG9zLnkgLSBib3VuZHMueSxcbiAgICAgICAgICAgICAgZGVsdGFYOiAwLFxuICAgICAgICAgICAgICBkZWx0YVk6IGRlbHRhLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdbd2FsbHBhcGVyXSBXTV9JTlBVVCBjYWxsYmFjayBlcnJvcjonLCBlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHdoZWVsSG9va0luc3RhbGxlZCA9IHRydWU7XG4gIGNvbnNvbGUubG9nKCdbd2FsbHBhcGVyXSBXaGVlbCBob29rIGluc3RhbGxlZCAoV01fSU5QVVQgaG9vayBtb2RlKScpO1xufVxuXG4vKipcbiAqIOWNuOi9vem8oOagh+i9ruivolxuICovXG5hc3luYyBmdW5jdGlvbiB1bmluc3RhbGxNb3VzZUhvb2soKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInKSByZXR1cm47XG4gIGlmIChtb3VzZVBvbGxUaW1lcikge1xuICAgIGNsZWFySW50ZXJ2YWwobW91c2VQb2xsVGltZXIpO1xuICAgIG1vdXNlUG9sbFRpbWVyID0gbnVsbDtcbiAgfVxuICBpZiAob2JzY3VyZUNoZWNrVGltZXIpIHtcbiAgICBjbGVhckludGVydmFsKG9ic2N1cmVDaGVja1RpbWVyKTtcbiAgICBvYnNjdXJlQ2hlY2tUaW1lciA9IG51bGw7XG4gIH1cbiAgbGFzdEN1cnNvclBvcyA9IHsgeDogLTEsIHk6IC0xIH07XG4gIGxhc3RCdXR0b25TdGF0ZXMgPSB7IGxlZnQ6IGZhbHNlLCByaWdodDogZmFsc2UsIG1pZGRsZTogZmFsc2UgfTtcblxuICAvLyDljbjovb3mu5rova4gaG9va1xuICBpZiAod2hlZWxIb29rTWFpbldpbiAmJiAhd2hlZWxIb29rTWFpbldpbi5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgdHJ5IHtcbiAgICAgIHdoZWVsSG9va01haW5XaW4udW5ob29rV2luZG93TWVzc2FnZShXTV9JTlBVVCk7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIHdoZWVsSG9va0luc3RhbGxlZCA9IGZhbHNlO1xuICB3aGVlbEhvb2tNYWluV2luID0gbnVsbDtcbiAgZ2V0UmF3SW5wdXREYXRhRm4gPSBudWxsO1xuICBnZXRGb3JlZ3JvdW5kV2luZG93Rm4gPSBudWxsO1xuICBnZXRDbGFzc05hbWVXRm4gPSBudWxsO1xuICBjb25zb2xlLmxvZygnW3dhbGxwYXBlcl0gTW91c2UgcG9sbCBzdG9wcGVkJyk7XG59XG4iXSwibWFwcGluZ3MiOiI7O0FBS0EsSUFBTSxtQ0FBbUIsSUFBSSxJQUFxQztBQUdsRSxJQUFJLFdBQTJEO0FBQy9ELElBQUksY0FBOEQ7QUFDbEUsSUFBSSxTQUF5RDtBQUc3RCxJQUFJLHVCQUF3RTtBQUU1RSxlQUFlLFlBQVk7Q0FDekIsTUFBTSxNQUFNLE1BQU0sT0FBTztDQUV6QixPQUFRLElBQTZDLFdBQVc7QUFDbEU7QUFFQSxlQUFlLGVBQWU7Q0FDNUIsSUFBSSxRQUFRLGFBQWEsU0FBUyxPQUFPO0NBQ3pDLElBQUksQ0FBQyxVQUVILFlBQVcsTUFEUyxVQUFVLEVBQUEsQ0FDYixLQUFLLFlBQVk7Q0FFcEMsT0FBTztBQUNUOzs7OztBQU1BLElBQUkseUJBQXlFO0FBQzdFLElBQUksUUFBaUQ7QUFDckQsSUFBSSxRQUFpRDtBQUNyRCxJQUFJLFFBQWlEO0FBQ3JELElBQUksUUFBaUQ7QUFDckQsSUFBSSxRQUFpRDtBQUVyRCxlQUFlLG9CQUFzQztDQUNuRCxJQUFJLFFBQVEsYUFBYSxTQUFTLE9BQU87Q0FDekMsSUFBSTtFQUNGLElBQUksQ0FBQyx3QkFBd0IseUJBQXlCLE1BQU0sYUFBYTtFQUN6RSxJQUFJLENBQUMsd0JBQXdCLE9BQU87RUFDcEMsSUFBSSxDQUFDLE9BQU8sUUFBUSx1QkFBdUIsS0FBSyxpQ0FBaUM7RUFDakYsSUFBSSxDQUFDLE9BQU8sUUFBUSx1QkFBdUIsS0FBSyx5REFBeUQ7RUFDekcsSUFBSSxDQUFDLE9BQU8sUUFBUSx1QkFBdUIsS0FBSyw2REFBNkQ7RUFDN0csSUFBSSxDQUFDLE9BQU8sUUFBUSx1QkFBdUIsS0FBSyw2REFBNkQ7RUFDN0csSUFBSSxDQUFD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