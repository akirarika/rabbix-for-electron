#!/usr/bin/env node
import { r as __toESM } from "./assets/rolldown-runtime-C7HZzL1F.js";
import * as http from "node:http";
import { access, mkdir, readFile, rename, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { existsSync, readdirSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { execFileSync, spawn } from "child_process";
import { createHash } from "crypto";
import { createRequire } from "module";
import { timingSafeEqual } from "node:crypto";
import { env } from "node:process";
//#region app/__VERSION__.ts
var __VERSION__ = "1039.2.396843";
//#endregion
//#region app/utils/electron-states.ts
/**
* 计算默认窗口尺寸：以屏幕可用区最短边的 85% 作为高度，按 16:9 计算宽度，
* 上限 1920×1080；若超出可用区则等比缩小以保证窗口完整可见，最后在可用区内居中。
*/
function computeDefaultWindowBounds(workArea) {
	const MAX_WIDTH = 1920;
	const MAX_HEIGHT = 1080;
	const targetDimension = Math.min(workArea.width, workArea.height) * .85;
	let width = targetDimension * (16 / 9);
	let height = targetDimension;
	if (width > MAX_WIDTH) width = MAX_WIDTH;
	if (height > MAX_HEIGHT) height = MAX_HEIGHT;
	const fitScale = Math.min(1, workArea.width / width, workArea.height / height);
	width = Math.floor(width * fitScale);
	height = Math.floor(height * fitScale);
	const x = Math.floor((workArea.width - width) / 2) + (workArea.x ?? 0);
	const y = Math.floor((workArea.height - height) / 2) + (workArea.y ?? 0);
	return {
		width,
		height,
		x,
		y
	};
}
async function createElectronStates() {
	console.log("[electron-states.ts] createElectronStates called, initializing...");
	const userDataPath = join(electron.app.getPath("userData"), "AppData");
	const publicPath = join(dirname(fileURLToPath(import.meta.url)));
	const zpaqfranzExePath = join(publicPath, "zpaqfranz.exe");
	const sevenZipExePath = join(publicPath, "7za.exe");
	const filePath = join(userDataPath, "states.json");
	console.log("[electron-states.ts] File path resolved:", filePath);
	try {
		await mkdir(join(filePath, ".."), { recursive: true });
	} catch {}
	let loadedFromFile = false;
	let currentStates = {
		webviewWindowWidth: 1534,
		webviewWindowHeight: 864,
		webviewWindowIsMaximized: false,
		launchAtStartup: electron.app.isPackaged,
		runInBackground: false,
		wallpaperEnabled: false,
		userDataPath,
		publicPath,
		zpaqfranzExePath,
		sevenZipExePath
	};
	try {
		const content = await readFile(filePath, "utf-8");
		currentStates = JSON.parse(content);
		loadedFromFile = true;
		console.log("[electron-states.ts] Loaded states from file:", JSON.stringify(currentStates));
	} catch {
		console.log("[electron-states.ts] States file not found, calculating default window size...");
		await electron.app.whenReady();
		const workArea = electron.screen.getPrimaryDisplay().workAreaSize;
		console.log(`[electron-states.ts] Screen work area: ${workArea.width}x${workArea.height}`);
		const defaultBounds = computeDefaultWindowBounds(workArea);
		currentStates.webviewWindowWidth = defaultBounds.width;
		currentStates.webviewWindowHeight = defaultBounds.height;
		currentStates.webviewWindowX = defaultBounds.x;
		currentStates.webviewWindowY = defaultBounds.y;
		currentStates.webviewWindowIsMaximized = false;
		console.log(`[electron-states.ts] Final window size: ${currentStates.webviewWindowWidth}x${currentStates.webviewWindowHeight}, position: ${currentStates.webviewWindowX},${currentStates.webviewWindowY}, maximized: ${currentStates.webviewWindowIsMaximized}`);
		console.log("[electron-states.ts] Creating states file with calculated values...");
		await writeFile(filePath, JSON.stringify(currentStates, null, 2), "utf-8");
		console.log("[electron-states.ts] States file created successfully");
	}
	currentStates.userDataPath = userDataPath;
	currentStates.publicPath = publicPath;
	currentStates.zpaqfranzExePath = zpaqfranzExePath;
	currentStates.sevenZipExePath = sevenZipExePath;
	currentStates.launchAtStartup = currentStates.launchAtStartup ?? false;
	currentStates.runInBackground = currentStates.runInBackground ?? false;
	currentStates.wallpaperEnabled = currentStates.wallpaperEnabled ?? false;
	let saveTimeout = null;
	const saveToFile = async () => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		console.log("[electron-states.ts] Saving states to file:", JSON.stringify(currentStates));
		await writeFile(filePath, JSON.stringify(currentStates, null, 2), "utf-8");
		console.log("[electron-states.ts] States saved successfully");
	};
	const debouncedSave = async () => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		console.log("[electron-states.ts] Debounced save scheduled, 300ms delay...");
		saveTimeout = setTimeout(async () => {
			await saveToFile();
		}, 300);
	};
	const syncSave = () => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}
		console.log("[electron-states.ts] Sync saving states to file (process exit):", JSON.stringify(currentStates));
		writeFileSync(filePath, JSON.stringify(currentStates, null, 2), "utf-8");
	};
	console.log("[electron-states.ts] Setting up process exit handlers...");
	const cleanupFns = [];
	if (typeof process !== "undefined") {
		const onExit = () => {
			console.log("[electron-states.ts] Process exit signal received");
			syncSave();
		};
		process.on("exit", onExit);
		cleanupFns.push(() => process.off("exit", onExit));
		if (process.platform === "win32") {
			const onSiglTerm = () => {
				console.log("[electron-states.ts] Windows SIGTERM received");
				syncSave();
			};
			process.on("SIGTERM", onSiglTerm);
			cleanupFns.push(() => process.off("SIGTERM", onSiglTerm));
			const onSiglInt = () => {
				console.log("[electron-states.ts] Windows SIGINT received");
				syncSave();
			};
			process.on("SIGINT", onSiglInt);
			cleanupFns.push(() => process.off("SIGINT", onSiglInt));
		}
	}
	if (typeof electron !== "undefined" && electron.app) {
		if (loadedFromFile) await electron.app.whenReady();
		const onWillQuit = () => {
			console.log("[electron-states.ts] Electron will-quit event received");
		};
		electron.app.on("will-quit", onWillQuit);
		cleanupFns.push(() => electron.app.off("will-quit", onWillQuit));
		const onBeforeQuit = () => {
			console.log("[electron-states.ts] Electron before-quit event received");
			syncSave();
		};
		electron.app.on("before-quit", onBeforeQuit);
		cleanupFns.push(() => electron.app.off("before-quit", onBeforeQuit));
	}
	const set = (partial) => {
		console.log("[electron-states.ts] set called with:", JSON.stringify(partial));
		currentStates = {
			...currentStates,
			...partial
		};
		console.log("[electron-states.ts] states after merge:", JSON.stringify(currentStates));
		debouncedSave();
	};
	const instance = {
		get states() {
			return currentStates;
		},
		set
	};
	console.log("[electron-states.ts] createElectronStates completed, instance created");
	return instance;
}
var instancePromise = null;
function useElectronStates() {
	if (!instancePromise) instancePromise = createElectronStates();
	return instancePromise;
}
//#endregion
//#region app/utils/launcher.ts
var APP_USER_MODEL_ID = "link.kecream.app";
var LAUNCHER_EXE_NAME = "rabbix-launcher.exe";
var LAUNCHER_PID_PREFIX = "--launcher-pid=";
var LAUNCHER_DOWNLOAD_URL = "https://storage-0000.kecream.cn/rabbix/rabbix-launcher.exe";
var LATEST_JSON_BASE_URLS = ["https://zh-cn.electron.app.kecream.cn", "https://storage-0000.kecream.cn/rabbix"];
var UPGRADE_REQUEST_FILENAME = ".upgrade-request";
var RESTART_REQUEST_FILENAME = ".restart-request";
var LAUNCHER_MARKER_FILENAME = ".launcher";
function getRabbixDir() {
	if (process.env.RABBIX_DIR_OVERRIDE) return process.env.RABBIX_DIR_OVERRIDE;
	const username = process.env.USERNAME || process.env.USER;
	if (!username) return "";
	return join("C:", "Users", username, "AppData", "Local", "rabbix");
}
function parseLauncherPid(argv) {
	for (const arg of argv) {
		if (!arg.startsWith(LAUNCHER_PID_PREFIX)) continue;
		const pid = Number.parseInt(arg.slice(15), 10);
		if (Number.isInteger(pid) && pid > 0) return pid;
	}
	return null;
}
function getInstalledLauncherPath() {
	if (process.platform !== "win32" || !electron.app.isPackaged) return null;
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return null;
	const launcherPath = join(rabbixDir, LAUNCHER_EXE_NAME);
	return existsSync(launcherPath) ? launcherPath : null;
}
function isLocalLauncherCurrent(marker, diskHash) {
	if (!marker || !diskHash) return false;
	return marker.trim().toLowerCase() === diskHash.trim().toLowerCase();
}
function pickDirectLaunchMessage(locale) {
	const normalized = locale.toLowerCase();
	if (normalized === "zh" || normalized === "zh-cn" || normalized === "zh-sg" || normalized.startsWith("zh-hans")) return {
		title: "兔箱",
		message: "需要使用启动器进行启动 (rabbix-launcher.exe)"
	};
	return {
		title: "Rabbix",
		message: "Please start the application using the launcher (rabbix-launcher.exe)"
	};
}
async function sha256File(path) {
	try {
		const content = await readFile(path);
		return createHash("sha256").update(content).digest("hex");
	} catch {
		return null;
	}
}
function spawnLauncherDetached(launcherPath) {
	spawn(launcherPath, [], {
		detached: true,
		windowsHide: true,
		stdio: "ignore"
	}).unref();
}
async function repairLauncher() {
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return false;
	const launcherPath = join(rabbixDir, LAUNCHER_EXE_NAME);
	const markerPath = join(rabbixDir, LAUNCHER_MARKER_FILENAME);
	const diskHash = await sha256File(launcherPath);
	let marker = null;
	try {
		marker = await readFile(markerPath, "utf-8");
	} catch {}
	if (diskHash && isLocalLauncherCurrent(marker, diskHash)) {
		spawnLauncherDetached(launcherPath);
		return true;
	}
	let remoteHash = null;
	let fetchedAny = false;
	for (const baseUrl of LATEST_JSON_BASE_URLS) try {
		const response = await fetch(`${baseUrl}/latest.json`, { signal: AbortSignal.timeout(8e3) });
		if (!response.ok) continue;
		const json = await response.json();
		fetchedAny = true;
		if (typeof json.launcherHash === "string" && json.launcherHash.length > 0) {
			remoteHash = json.launcherHash;
			break;
		}
	} catch {
		continue;
	}
	if (!fetchedAny) return false;
	if (remoteHash && diskHash && remoteHash.toLowerCase() === diskHash.toLowerCase()) {
		try {
			await writeFile(markerPath, diskHash, "utf-8");
		} catch {}
		spawnLauncherDetached(launcherPath);
		return true;
	}
	try {
		await mkdir(rabbixDir, { recursive: true });
		const response = await fetch(LAUNCHER_DOWNLOAD_URL, { signal: AbortSignal.timeout(6e4) });
		if (!response.ok) return false;
		const data = Buffer.from(await response.arrayBuffer());
		const newHash = createHash("sha256").update(data).digest("hex");
		if (remoteHash) {
			if (newHash.toLowerCase() !== remoteHash.toLowerCase()) return false;
		} else console.warn("[launcher] latest.json lacks launcherHash, skipping hash verification");
		const tempPath = join(rabbixDir, "rabbix-launcher.exe.download");
		await writeFile(tempPath, data);
		if (existsSync(launcherPath)) await rename(launcherPath, `${launcherPath}.old`).catch(() => {});
		await rename(tempPath, launcherPath);
		await writeFile(markerPath, newHash, "utf-8").catch(() => {});
		spawnLauncherDetached(launcherPath);
		return true;
	} catch {
		return false;
	}
}
async function startKoffiWatch(pid) {
	try {
		const mod = await import("koffi");
		if (!(mod.default ?? mod).load("kernel32.dll").func("void *OpenProcess(uint32 access, bool inherit, uint32 pid)")(1048576, false, pid)) {
			electron.app.exit(0);
			return true;
		}
		const koffiEntry = createRequire(import.meta.url).resolve("koffi");
		const waitSliceMs = 200;
		const stopFlag = new Int32Array(new SharedArrayBuffer(4));
		process.once("exit", () => {
			Atomics.store(stopFlag, 0, 1);
		});
		const { Worker } = await import("worker_threads");
		const worker = new Worker(`
      const { parentPort, workerData } = require('worker_threads');
      try {
        const koffi = require(workerData.koffiEntry);
        const kernel32 = koffi.load('kernel32.dll');
        const openProcess = kernel32.func('void *OpenProcess(uint32 access, bool inherit, uint32 pid)');
        const waitForSingleObject = kernel32.func('uint32 WaitForSingleObject(void *handle, uint32 ms)');
        const stopFlag = new Int32Array(workerData.stopFlagBuffer);
        const WAIT_TIMEOUT = 0x102;
        const handle = openProcess(0x00100000, false, workerData.pid);
        if (!handle) {
          parentPort.postMessage('gone');
        } else {
          for (;;) {
            const result = waitForSingleObject(handle, workerData.waitSliceMs);
            if (result !== WAIT_TIMEOUT) {
              parentPort.postMessage('gone');
              break;
            }
            if (Atomics.load(stopFlag, 0) === 1) break;
          }
        }
      } catch (error) {
        parentPort.postMessage('error');
      }
      `, {
			eval: true,
			workerData: {
				pid,
				koffiEntry,
				stopFlagBuffer: stopFlag.buffer,
				waitSliceMs
			}
		});
		worker.unref();
		worker.on("message", (message) => {
			if (message === "gone") electron.app.exit(0);
		});
		return true;
	} catch {
		return false;
	}
}
function startFallbackWatch(pid) {
	let missingCount = 0;
	const timer = setInterval(() => {
		let alive = true;
		try {
			process.kill(pid, 0);
		} catch {
			alive = false;
		}
		if (!alive) {
			missingCount += 1;
			if (missingCount >= 2) {
				clearInterval(timer);
				electron.app.exit(0);
			}
			return;
		}
		missingCount = 0;
		try {
			const match = (execFileSync("tasklist", [
				"/FI",
				`PID eq ${pid}`,
				"/FO",
				"CSV",
				"/NH"
			], {
				encoding: "utf-8",
				windowsHide: true
			}).trim().split("\n")[0] ?? "").match(/^"([^"]+)"/);
			if (match?.[1] && match[1].toLowerCase() !== "rabbix-launcher.exe") {
				clearInterval(timer);
				electron.app.exit(0);
			}
		} catch {}
	}, 1e4);
	timer.unref();
}
function watchLauncherProcess(pid) {
	startKoffiWatch(pid).then((started) => {
		if (!started) startFallbackWatch(pid);
	});
}
function watchUpgradeRequest() {
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return;
	const markerPath = join(rabbixDir, UPGRADE_REQUEST_FILENAME);
	setInterval(() => {
		(async () => {
			let targetVersion = "";
			try {
				const content = JSON.parse(await readFile(markerPath, "utf-8"));
				if (typeof content.version === "string") targetVersion = content.version;
			} catch {
				return;
			}
			if (!targetVersion || targetVersion === "1039.2.396843") return;
			await rm(markerPath, { force: true }).catch(() => {});
			electron.app.quit();
		})();
	}, 8e3).unref();
}
function listVersionDirNames(dir) {
	let names = [];
	try {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (!entry.name.startsWith("v") || !entry.isDirectory()) continue;
			const version = entry.name.slice(1);
			if (!/^\d+(\.\d+)*([-+][0-9A-Za-z.-]+)?$/.test(version)) continue;
			names.push(version);
		}
	} catch {
		return [];
	}
	return names;
}
function compareNumericVersions(a, b) {
	const left = a.replace(/[-+].*$/, "").split(".");
	const right = b.replace(/[-+].*$/, "").split(".");
	const length = Math.max(left.length, right.length);
	for (let i = 0; i < length; i += 1) {
		const l = Number.parseInt(left[i] ?? "0", 10);
		const r = Number.parseInt(right[i] ?? "0", 10);
		if (l > r) return 1;
		if (l < r) return -1;
	}
	return 0;
}
function findActiveVersion(rabbixDir) {
	let best = null;
	for (const version of listVersionDirNames(rabbixDir)) {
		if (!existsSync(join(rabbixDir, `v${version}`, "rabbix.exe"))) continue;
		if (!best || compareNumericVersions(version, best) > 0) best = version;
	}
	return best;
}
function findStagedUpdate() {
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return {
		ready: false,
		version: null
	};
	const active = findActiveVersion(rabbixDir);
	const staging = join(rabbixDir, ".staging");
	let best = null;
	for (const version of listVersionDirNames(staging)) {
		if (!existsSync(join(staging, `v${version}`, "rabbix.exe"))) continue;
		if (active && compareNumericVersions(version, active) <= 0) continue;
		if (!best || compareNumericVersions(version, best) > 0) best = version;
	}
	return {
		ready: best !== null,
		version: best
	};
}
var stagedUpdateCache = {
	ready: false,
	version: null
};
function getStagedUpdate() {
	return stagedUpdateCache;
}
function startStagedUpdatePolling() {
	const refresh = () => {
		try {
			stagedUpdateCache = findStagedUpdate();
		} catch {}
	};
	refresh();
	setInterval(refresh, 6e4).unref();
}
async function requestLauncherRestart() {
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return false;
	try {
		const tmp = join(rabbixDir, `${RESTART_REQUEST_FILENAME}.tmp`);
		await writeFile(tmp, JSON.stringify({ requestedAt: Date.now() }), "utf-8");
		await rename(tmp, join(rabbixDir, RESTART_REQUEST_FILENAME));
		return true;
	} catch {
		return false;
	}
}
async function applyWindowRelaunchProperties(window) {
	if (process.platform !== "win32") return;
	try {
		const mod = await import("koffi");
		const koffi = mod.default ?? mod;
		const ptrSize = process.arch === "x64" ? 8 : 4;
		const getStore = koffi.load("shell32.dll").func("long __stdcall SHGetPropertyStoreForWindow(uintptr_t hwnd, void *riid, void **ppv)");
		const iid = Buffer.from([
			235,
			142,
			109,
			136,
			242,
			140,
			70,
			68,
			141,
			2,
			205,
			186,
			29,
			189,
			207,
			153
		]);
		const ppv = Buffer.alloc(ptrSize);
		const hwndBuf = window.getNativeWindowHandle();
		if (getStore(hwndBuf.length <= 4 ? hwndBuf.readUInt32LE(0) : hwndBuf.readBigUInt64LE(0), iid, ppv) !== 0) return;
		const storePtr = koffi.decode(ppv, 0, "void *");
		if (!storePtr) return;
		const vtable = koffi.decode(storePtr, 0, "void *");
		if (!vtable) return;
		const releasePtr = koffi.decode(vtable, 2 * ptrSize, "void *");
		const setValuePtr = koffi.decode(vtable, 6 * ptrSize, "void *");
		const commitPtr = koffi.decode(vtable, 7 * ptrSize, "void *");
		const releaseProto = koffi.proto("__stdcall", "IPropertyStore_Release", "uint32", ["void *"]);
		const setValueProto = koffi.proto("__stdcall", "IPropertyStore_SetValue", "long", [
			"void *",
			"void *",
			"void *"
		]);
		const commitProto = koffi.proto("__stdcall", "IPropertyStore_Commit", "long", ["void *"]);
		const GUID = koffi.struct("WindowPropGUID", {
			data1: "uint32",
			data2: "uint16",
			data3: "uint16",
			data4: koffi.array("uint8", 8)
		});
		const PROPERTYKEY = koffi.struct("WindowPropKEY", {
			fmtid: GUID,
			pid: "uint32"
		});
		const PROPVARIANT = koffi.struct("WindowPropVARIANT", {
			vt: "uint16",
			wReserved1: "uint16",
			wReserved2: "uint16",
			wReserved3: "uint16",
			pwszVal: "str16"
		});
		const VT_LPWSTR = 31;
		const fmtid = {
			data1: 2672568405,
			data2: 40825,
			data3: 19257,
			data4: [
				168,
				208,
				225,
				212,
				45,
				225,
				213,
				243
			]
		};
		const rabbixDir = getRabbixDir();
		const launcherPath = join(rabbixDir, LAUNCHER_EXE_NAME);
		const iconPath = join(rabbixDir, "favicon.ico");
		const locale = electron.app.getLocale().toLowerCase();
		const appName = locale === "zh" || locale === "zh-cn" || locale === "zh-sg" || locale.startsWith("zh-hans") ? "兔箱" : "Rabbix";
		const entries = [
			[5, APP_USER_MODEL_ID],
			[2, `"${launcherPath}"`],
			[4, appName],
			[3, `${iconPath},0`]
		];
		for (const [pid, value] of entries) {
			const key = koffi.alloc(PROPERTYKEY, 1);
			koffi.encode(key, PROPERTYKEY, {
				fmtid,
				pid
			});
			const pv = koffi.alloc(PROPVARIANT, 1);
			koffi.encode(pv, PROPVARIANT, {
				vt: VT_LPWSTR,
				wReserved1: 0,
				wReserved2: 0,
				wReserved3: 0,
				pwszVal: value
			});
			koffi.call(setValuePtr, setValueProto, storePtr, key, pv);
			koffi.free(key);
			koffi.free(pv);
		}
		koffi.call(commitPtr, commitProto, storePtr);
		koffi.call(releasePtr, releaseProto, storePtr);
	} catch {}
}
//#endregion
//#region app/utils/electron.ts
var mainWindow = null;
var tray = null;
var MIN_WINDOW_WIDTH = 1280;
var MIN_WINDOW_HEIGHT = 640;
var AUTO_FULLSCREEN_THRESHOLD_WIDTH = 1536;
var AUTO_FULLSCREEN_THRESHOLD_HEIGHT = 768;
var LAUNCH_HIDDEN_ARG = "--hidden";
function isLaunchedHidden(runInBackground) {
	if (process.argv.includes("--hidden")) return true;
	if (process.platform === "darwin") return runInBackground && electron.app.getLoginItemSettings().wasOpenedAtLogin === true;
	return false;
}
async function createElectronApp() {
	if (process.platform === "win32") electron.app.setAppUserModelId(APP_USER_MODEL_ID);
	if (process.platform === "win32" && electron.app.isPackaged && !process.argv.includes("--focus-only")) {
		const launcherPid = parseLauncherPid(process.argv);
		if (launcherPid === null) {
			if (await repairLauncher()) {
				electron.app.exit(0);
				return;
			}
			await electron.app.whenReady();
			const { title, message } = pickDirectLaunchMessage(electron.app.getLocale());
			await electron.dialog.showMessageBox({
				type: "error",
				title,
				message,
				buttons: ["OK"]
			});
			electron.app.exit(0);
			return;
		}
		watchLauncherProcess(launcherPid);
		watchUpgradeRequest();
		startStagedUpdatePolling();
	}
	if (!electron.app.requestSingleInstanceLock()) {
		electron.app.quit();
		return;
	}
	electron.app.on("second-instance", async () => {
		if (!mainWindow || mainWindow.isDestroyed()) {
			await __createWindow();
			return;
		}
		mainWindow.show();
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	});
	if ((await import("./assets/electron-squirrel-startup-BJbSY7lE.js").then((m) => /* @__PURE__ */ __toESM(m.default, 1))).default) {
		electron.app.quit();
		return;
	}
	electron.app.whenReady().then(async () => {
		await useElectronStates();
		await __syncLoginItemSettings();
		await __createTray();
		await __createWindow();
		const { handleDisplayChange, setWallpaper } = await import("./assets/wallpaper-D5e3IlUh.js");
		electron.screen.on("display-added", () => handleDisplayChange());
		electron.screen.on("display-removed", () => handleDisplayChange());
		electron.screen.on("display-metrics-changed", () => handleDisplayChange());
		if ((await useElectronStates()).states.wallpaperEnabled) {
			console.log("[electron] Restoring wallpaper on startup");
			try {
				await setWallpaper();
			} catch (e) {
				console.warn("[electron] Failed to restore wallpaper:", e);
			}
		}
		electron.app.on("activate", async () => {
			if (electron.BrowserWindow.getAllWindows().length === 0) await __createWindow();
		});
	});
	electron.app.on("window-all-closed", () => {});
}
function getWebviewOrigin() {
	if (electron.app.isPackaged) return "https://app.kecream.cn/";
	if (process.env.FORCE_PROD_ORIGIN === "1") return "https://app.kecream.cn/";
	return "http://localhost:9003/";
}
var webviewWindowResolvers = Promise.withResolvers();
function getWebviewWindow() {
	return webviewWindowResolvers.promise;
}
async function __createWindow() {
	const electronStates = await useElectronStates();
	const savedStates = electronStates.states;
	console.log(`[electron] Loaded window state from states: ${JSON.stringify(savedStates)}`);
	try {
		await mkdir(savedStates.userDataPath, { recursive: true });
	} catch {}
	const iconPath = join(savedStates.publicPath, "favicon.png");
	let windowIcon;
	try {
		await access(iconPath);
		windowIcon = electron.nativeImage.createFromPath(iconPath);
	} catch {
		windowIcon = electron.nativeImage.createEmpty();
	}
	const windowWidth = savedStates.webviewWindowWidth;
	const windowHeight = savedStates.webviewWindowHeight;
	const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize;
	const screenTooSmall = screenWidth < AUTO_FULLSCREEN_THRESHOLD_WIDTH || screenHeight < AUTO_FULLSCREEN_THRESHOLD_HEIGHT;
	const startMaximized = savedStates.webviewWindowIsMaximized || screenTooSmall;
	console.log(`[electron] Window size: ${windowWidth}x${windowHeight}, screen: ${screenWidth}x${screenHeight}, maximized: ${startMaximized}`);
	if (startMaximized) {
		mainWindow = new electron.BrowserWindow({
			width: screenWidth,
			height: screenHeight,
			minWidth: MIN_WINDOW_WIDTH,
			minHeight: MIN_WINDOW_HEIGHT,
			show: false,
			frame: false,
			icon: windowIcon,
			webPreferences: {
				devTools: true,
				nodeIntegration: false,
				contextIsolation: true,
				sandbox: true,
				autoplayPolicy: "no-user-gesture-required"
			}
		});
		mainWindow.maximize();
	} else mainWindow = new electron.BrowserWindow({
		width: Math.floor(windowWidth),
		height: Math.floor(windowHeight),
		minWidth: MIN_WINDOW_WIDTH,
		minHeight: MIN_WINDOW_HEIGHT,
		x: savedStates.webviewWindowX,
		y: savedStates.webviewWindowY,
		show: false,
		frame: false,
		icon: windowIcon,
		webPreferences: {
			devTools: true,
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: true,
			autoplayPolicy: "no-user-gesture-required"
		}
	});
	mainWindow.webContents.on("will-navigate", (event, url) => {
		if (url.startsWith(getWebviewOrigin())) return;
		event.preventDefault();
		electron.shell.openExternal(url);
	});
	mainWindow.webContents.setWindowOpenHandler(({ url }) => {
		electron.shell.openExternal(url);
		return { action: "deny" };
	});
	applyWindowRelaunchProperties(mainWindow);
	const url = new URL(getWebviewOrigin());
	url.searchParams.set("mode", "electron");
	url.searchParams.set("shellVersion", __VERSION__);
	url.searchParams.set("electronPort", electronPort.toString());
	url.searchParams.set("electronToken", globalThis.electronToken);
	console.log(`[electron] Loading webview URL`);
	globalThis.__lastLoadURL = url.toString();
	mainWindow.loadURL(url.toString());
	mainWindow.webContents.on("before-input-event", (_event, input) => {
		if (input.key === "F12") mainWindow.webContents.toggleDevTools();
	});
	mainWindow.webContents.on("did-finish-load", () => {
		mainWindow.webContents.setZoomFactor(1);
		mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
	});
	await new Promise((resolve) => {
		const timeoutId = setTimeout(() => resolve(true), 5e3);
		mainWindow.webContents.on("did-finish-load", () => {
			clearTimeout(timeoutId);
			setTimeout(() => resolve(true), 500);
		});
	});
	if (!isLaunchedHidden(electronStates.states.runInBackground)) mainWindow.show();
	const saveWindowState = () => {
		if (!mainWindow) return;
		if (mainWindow.isMaximized()) {
			const bounds = mainWindow.getNormalBounds();
			electronStates.set({
				webviewWindowIsMaximized: true,
				webviewWindowWidth: bounds.width,
				webviewWindowHeight: bounds.height,
				webviewWindowX: bounds.x,
				webviewWindowY: bounds.y
			});
		} else {
			const bounds = mainWindow.getBounds();
			electronStates.set({
				webviewWindowIsMaximized: false,
				webviewWindowWidth: bounds.width,
				webviewWindowHeight: bounds.height,
				webviewWindowX: bounds.x,
				webviewWindowY: bounds.y
			});
		}
	};
	mainWindow.on("resize", () => {
		if (mainWindow && !mainWindow.isMaximized()) saveWindowState();
	});
	mainWindow.on("move", () => {
		if (mainWindow && !mainWindow.isMaximized()) saveWindowState();
	});
	mainWindow.on("maximize", () => {
		saveWindowState();
	});
	mainWindow.on("unmaximize", () => {
		setTimeout(() => {
			if (!mainWindow || mainWindow.isDestroyed()) return;
			const bounds = mainWindow.getBounds();
			const workArea = electron.screen.getDisplayMatching(bounds).workArea;
			if (bounds.width >= workArea.width * .95 && bounds.height >= workArea.height * .95) mainWindow.setBounds(computeDefaultWindowBounds(workArea));
			saveWindowState();
		}, 0);
	});
	mainWindow.on("close", (event) => {
		event.preventDefault();
		mainWindow.hide();
	});
	webviewWindowResolvers.resolve(mainWindow);
}
async function __createTray() {
	const i18n = {
		"zh-cn": {
			showWindow: "打开",
			quit: "退出"
		},
		"zh-sg": {
			showWindow: "打开",
			quit: "退出"
		},
		"zh-tw": {
			showWindow: "顯示",
			quit: "退出"
		},
		"zh-hk": {
			showWindow: "顯示",
			quit: "退出"
		},
		ja: {
			showWindow: "表示",
			quit: "終了"
		},
		ko: {
			showWindow: "창 표시",
			quit: "종료"
		}
	};
	const locale = electron.app.getLocale().toLowerCase();
	const t = i18n[locale] || {
		showWindow: "Show Window",
		quit: "Quit"
	};
	console.log(`[electron] System locale: ${locale}, using translations: ${JSON.stringify(t)}`);
	const electronStates = await useElectronStates();
	const iconPath = join(electronStates.states.publicPath, "tray.png");
	const iconBWPath = join(electronStates.states.publicPath, "tray-bw.png");
	let trayIcon;
	try {
		if (process.platform === "darwin") {
			await access(iconBWPath);
			trayIcon = electron.nativeImage.createFromPath(iconBWPath);
			const isRetina = electron.screen.getPrimaryDisplay().scaleFactor >= 2;
			const targetSize = isRetina ? 36 : 18;
			console.log(`[electron] macOS detected, resizing tray icon to ${targetSize}x${targetSize} (Retina: ${isRetina})`);
			trayIcon = trayIcon.resize({
				width: targetSize,
				height: targetSize
			});
		} else {
			await access(iconPath);
			trayIcon = electron.nativeImage.createFromPath(iconPath);
		}
	} catch {
		trayIcon = electron.nativeImage.createEmpty();
	}
	tray = new electron.Tray(trayIcon);
	const contextMenu = electron.Menu.buildFromTemplate([
		{
			label: t.showWindow,
			click: async () => {
				if (!mainWindow || mainWindow.isDestroyed()) {
					await __createWindow();
					return;
				}
				mainWindow.show();
				if (mainWindow.isMinimized()) mainWindow.restore();
				mainWindow.focus();
			}
		},
		{ type: "separator" },
		{
			label: t.quit,
			click: () => {
				electron.app.exit(0);
			}
		}
	]);
	tray.setToolTip("Kecream");
	tray.setContextMenu(contextMenu);
	tray.on("click", async () => {
		if (!mainWindow || mainWindow.isDestroyed()) {
			await __createWindow();
			return;
		}
		mainWindow.show();
		if (mainWindow.isMinimized()) mainWindow.restore();
		mainWindow.focus();
	});
}
async function __syncLoginItemSettings() {
	const { launchAtStartup, runInBackground } = (await useElectronStates()).states;
	const options = {
		openAtLogin: launchAtStartup,
		openAsHidden: launchAtStartup && runInBackground,
		args: launchAtStartup && runInBackground ? [LAUNCH_HIDDEN_ARG] : []
	};
	const launcherPath = getInstalledLauncherPath();
	if (launcherPath) options.path = launcherPath;
	electron.app.setLoginItemSettings(options);
}
//#endregion
//#region ../../node_modules/milkio/index.js
function headersToJSON(headers) {
	const json = {};
	for (const [key, value] of headers.entries()) json[key] = value;
	return json;
}
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function mergeDeep(target, source) {
	const merged = { ...target };
	for (const key in source) {
		if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
		const sourceValue = source[key];
		const targetValue = target[key];
		if (Object.prototype.hasOwnProperty.call(target, key)) {
			if (isPlainObject(targetValue) && isPlainObject(sourceValue)) merged[key] = mergeDeep(targetValue, sourceValue);
		} else merged[key] = sourceValue;
	}
	return merged;
}
var isoDatePattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?)(Z|[+-]\d{2}:?\d{2})?$/;
function tryParseDate(str) {
	const len = str.length;
	if (len >= 20 && len <= 32 && str.charCodeAt(0) >= 48 && str.charCodeAt(0) <= 57 && str.indexOf("T") !== -1) {
		const match = isoDatePattern.exec(str);
		if (match !== null) {
			const datePart = match[1];
			const tzPart = match[2];
			if (datePart === void 0) return null;
			if (tzPart !== void 0) {
				const normalizedTz = tzPart.length === 5 && tzPart.charAt(3) !== ":" ? `${tzPart.slice(0, 3)}:${tzPart.slice(3)}` : tzPart;
				return new Date(datePart + normalizedTz);
			}
			return /* @__PURE__ */ new Date(datePart + "Z");
		}
	}
	return null;
}
function reviveJSONParse(json) {
	if (json === null || json === void 0) return json;
	if (typeof json === "object") {
		if (json instanceof Date) return json;
		if (Array.isArray(json)) {
			const len = json.length;
			for (let i = 0; i < len; i++) {
				const v = json[i];
				if (typeof v === "string") {
					const d = tryParseDate(v);
					if (d !== null) json[i] = d;
				} else if (typeof v === "object" && v !== null) reviveJSONParse(v);
			}
			return json;
		}
		const obj = json;
		for (const key in obj) {
			if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
			const v = obj[key];
			if (typeof v === "string") {
				const d = tryParseDate(v);
				if (d !== null) obj[key] = d;
			} else if (typeof v === "object" && v !== null) reviveJSONParse(v);
		}
		return json;
	}
	if (typeof json === "string") {
		const d = tryParseDate(json);
		if (d !== null) return d;
	}
	return json;
}
function __initExecuter(generated, runtime) {
	const __execute = async (routeSchema, options) => {
		const type = options.path.endsWith("~") ? "stream" : "action";
		const executeId = options.createdExecuteId;
		let headers;
		if (!(options.headers instanceof Headers)) if (typeof options.headers?.get === "function" && !(options.headers instanceof Headers)) headers = options.headers;
		else {
			headers = new Headers({ ...options.headers });
			if (!("toJSON" in headers)) headers.toJSON = () => headersToJSON(headers);
		}
		else {
			headers = options.headers;
			if (!("toJSON" in headers)) headers.toJSON = () => headersToJSON(headers);
		}
		const finales = [];
		const onFinally = (handler) => finales.unshift(handler);
		let params;
		if (options.paramsType === "raw") {
			params = options.params;
			if (typeof params === "undefined") params = {};
		} else if (!options.params || options.params === "" || options.params === "{}") params = {};
		else if (headers.get("content-type")?.startsWith("application/json")) {
			try {
				params = reviveJSONParse(JSON.parse(options.params));
			} catch (error) {
				throw reject("PARAMS_TYPE_NOT_SUPPORTED", {
					expected: "json",
					contentType: headers.get("content-type") ?? null,
					params: options.params.slice(0, 4096)
				});
			}
			if (typeof params === "undefined") params = {};
		} else if (headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) try {
			const formData = new URLSearchParams(options.params);
			params = {};
			formData.forEach((value, key) => params[key] = value);
		} catch (error) {
			throw reject("PARAMS_TYPE_NOT_SUPPORTED", {
				expected: "form-urlencoded",
				contentType: headers.get("content-type") ?? null,
				params: options.params.slice(0, 4096)
			});
		}
		else if (options.params.startsWith("{")) try {
			params = reviveJSONParse(JSON.parse(options.params));
		} catch (error) {
			throw reject("PARAMS_TYPE_NOT_SUPPORTED", {
				expected: "json",
				contentType: headers.get("content-type") ?? null,
				params: options.params.slice(0, 4096)
			});
		}
		else throw reject("PARAMS_TYPE_NOT_SUPPORTED", {
			expected: "json",
			contentType: headers.get("content-type") ?? null,
			params: options.params.slice(0, 4096)
		});
		if (typeof params !== "object" || Array.isArray(params)) throw reject("PARAMS_TYPE_NOT_SUPPORTED", {
			expected: "json",
			contentType: headers.get("content-type") ?? null,
			params: (typeof options.params === "string" ? options.params : JSON.stringify(options.params)).slice(0, 4096)
		});
		if ("$milkioGenerateParams" in params && params.$milkioGenerateParams === "enable") {
			if (!runtime.develop) throw reject("NOT_DEVELOP_MODE", "This feature must be in cookbook to use.");
			delete params.$milkioGenerateParams;
			let paramsRand = routeSchema.randomParams();
			if (paramsRand === void 0 || paramsRand === null) paramsRand = {};
			params = mergeDeep(params, paramsRand);
			options.createdLogger.debug("✨ the generated params:", JSON.stringify(params));
		}
		if (!options.context?.http?.notFound && options.context?.http?.params?.string) options.context.http.params.parsed = params;
		if (!options.context) options.context = {};
		const ctx = options.context;
		ctx.develop = runtime.develop;
		ctx.path = options.path;
		ctx.routeType = type;
		ctx.logger = options.createdLogger;
		ctx.emit = runtime.emit;
		ctx.emitAnyApproved = runtime.emitAnyApproved;
		ctx.emitAllApproved = runtime.emitAllApproved;
		ctx.executeId = options.createdExecuteId;
		ctx.config = runtime.runtime.config;
		ctx.typia = generated.typiaSchema;
		ctx.call = (module, params) => __call(ctx, module, params);
		ctx.onFinally = onFinally;
		ctx._ = runtime;
		ctx.reject = reject;
		ctx.raise = raise;
		const results = { value: void 0 };
		const module = routeSchema.module;
		const meta = module?.meta ? module?.meta : {};
		if (options.context.http?.request?.method !== void 0) {
			if (!(meta?.methods ?? ["POST"]).includes(options.context.http.request.method)) throw reject("METHOD_NOT_ALLOWED", void 0);
		}
		if (meta?.typeSafety === void 0 || meta.typeSafety === true || Array.isArray(meta.typeSafety) && meta.typeSafety.includes("params")) {
			const validation = routeSchema.validateParams(params);
			if (!validation.success) throw reject("PARAMS_TYPE_INCORRECT", {
				...validation.errors[0],
				message: `The value '${validation.errors[0].path}' is '${validation.errors[0].value}', which does not meet '${validation.errors[0].expected}' requirements.`
			});
		}
		if (runtime._hasEmitHandlers?.("milkio:executeBefore") ?? true) await runtime.emit("milkio:executeBefore", {
			executeId: options.createdExecuteId,
			logger: options.createdLogger,
			path: options.path,
			meta,
			context: options.context,
			reject,
			raise
		});
		results.value = await module.handler(options.context, params);
		let emptyResult = false;
		if (results.value === void 0 || results.value === null || results.value === "") {
			emptyResult = true;
			results.value = {};
		} else if (Array.isArray(results.value) || typeof results.value !== "object") throw reject("REQUEST_FAIL", "The return type of the handler must be an 'object', which is currently an '${typeof typeof results.value}'.");
		if (runtime._hasEmitHandlers?.("milkio:executeAfter") ?? true) await runtime.emit("milkio:executeAfter", {
			executeId: options.createdExecuteId,
			logger: options.createdLogger,
			path: options.path,
			meta,
			context: options.context,
			results,
			reject,
			raise
		});
		return {
			executeId,
			headers,
			params,
			results,
			context: options.context,
			meta,
			type,
			emptyResult,
			finales
		};
	};
	const __call = async (context, module, params) => {
		const { handler } = await module;
		return handler(context, params);
	};
	return {
		__call,
		__execute
	};
}
var RESOLVED_PROMISE = Promise.resolve();
function __initEventManager() {
	const handlers = /* @__PURE__ */ new Map();
	const indexed = /* @__PURE__ */ new Map();
	let _version = 0;
	return {
		on: (key, handler) => {
			_version++;
			handlers.set(handler, key);
			if (key === "*") {
				if (indexed.has("*") === false) indexed.set("*", /* @__PURE__ */ new Set());
				indexed.get("*").add(handler);
			} else {
				if (indexed.has(key) === false) indexed.set(key, /* @__PURE__ */ new Set());
				indexed.get(key).add(handler);
			}
			return () => {
				handlers.delete(handler);
				if (key === "*") {
					const wildcardSet = indexed.get("*");
					if (wildcardSet) wildcardSet.delete(handler);
				} else {
					const set = indexed.get(key);
					if (set) set.delete(handler);
				}
			};
		},
		off: (key, handler) => {
			_version++;
			if (key === "*") {
				const wildcardSet = indexed.get("*");
				if (!wildcardSet) return;
				handlers.delete(handler);
				wildcardSet.delete(handler);
			} else {
				const set = indexed.get(key);
				if (!set) return;
				handlers.delete(handler);
				set.delete(handler);
			}
		},
		emit: (key, value) => {
			const h = indexed.get(key);
			const wildcardHandlers = indexed.get("*");
			if (!wildcardHandlers && !h) return RESOLVED_PROMISE;
			if (wildcardHandlers && h) return (async () => {
				for (const handler of wildcardHandlers) await handler({
					key,
					value
				});
				for (const handler of h) await handler(value);
			})();
			if (wildcardHandlers) return (async () => {
				for (const handler of wildcardHandlers) await handler({
					key,
					value
				});
			})();
			return (async () => {
				for (const handler of h) await handler(value);
			})();
		},
		_hasEmitHandlers: (key) => {
			return indexed.has(key) || indexed.has("*");
		},
		get _version() {
			return _version;
		},
		emitAnyApproved: async (key, value) => {
			const wildcardHandlers = indexed.get("*");
			let accepted = false;
			if (wildcardHandlers) {
				for (const handler of wildcardHandlers) if (await handler({
					key,
					value
				}) === true) accepted = true;
			}
			const h = indexed.get(key);
			if (h) {
				for (const handler of h) if (await handler(value) === true) accepted = true;
			}
			return accepted;
		},
		emitAllApproved: async (key, value) => {
			const wildcardHandlers = indexed.get("*");
			let approved = true;
			if (wildcardHandlers) {
				for (const handler of wildcardHandlers) if (await handler({
					key,
					value
				}) !== true) approved = false;
			}
			const h = indexed.get(key);
			if (h) {
				for (const handler of h) if (await handler(value) !== true) approved = false;
			}
			return approved;
		}
	};
}
var ENCODING = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var ENCODING_LEN = ENCODING.length;
var __fastIdPool = /* @__PURE__ */ new Uint8Array(256);
var __fastIdPoolIndex = 256;
var __fastIdCounter = 0;
function __createId() {
	if (__fastIdPoolIndex + 16 > 256) {
		crypto.getRandomValues(__fastIdPool);
		__fastIdPoolIndex = 0;
	}
	let id = Date.now().toString(36).padStart(8, "0");
	for (let i = 0; i < 6; i++) id += ENCODING.charAt(__fastIdPool[__fastIdPoolIndex++] % ENCODING_LEN);
	const counter = __fastIdCounter++;
	for (let i = 0; i < 10; i++) {
		const mix = counter + __fastIdPool[__fastIdPoolIndex++ % 256] & 65535;
		id += ENCODING.charAt(mix % ENCODING_LEN);
	}
	return id;
}
function defineDefaultExecuteIdGenerator() {
	return __createId;
}
async function createWorld(generated, configSchema, options) {
	const executeId = options.executeId ?? defineDefaultExecuteIdGenerator();
	const config = await configSchema.get();
	const runtime = {
		request: /* @__PURE__ */ new Map(),
		config
	};
	const eventManager = __initEventManager();
	if (options.accessKey) options.ignorePathLevel = options.ignorePathLevel ? options.ignorePathLevel + 1 : 1;
	const _ = {
		...options,
		executeId,
		runtime,
		on: eventManager.on,
		off: eventManager.off,
		emit: eventManager.emit,
		emitAnyApproved: eventManager.emitAnyApproved,
		emitAllApproved: eventManager.emitAllApproved,
		_hasEmitHandlers: eventManager._hasEmitHandlers,
		_emitHandlersVersion: eventManager._version
	};
	const listener = __initListener(generated, _, __initExecuter(generated, _));
	const world = {
		_,
		on: eventManager.on,
		off: eventManager.off,
		emit: eventManager.emit,
		emitAnyApproved: eventManager.emitAnyApproved,
		emitAllApproved: eventManager.emitAllApproved,
		listener,
		config,
		isTestMode: config?.mode === "test"
	};
	runtime.app = world;
	if (Array.isArray(options.bootstraps)) for (const bootstrap of options.bootstraps) await bootstrap(world);
	await Promise.all(generated.handlerSchema.loadHandlers(world));
	const routeKeys = Object.keys(generated.routeSchema);
	const rawPaths = generated.rawSchema?.rawPaths ? Array.from(generated.rawSchema.rawPaths) : [];
	const allRoutes = [...routeKeys, ...rawPaths];
	console.log(`
△ Routes:
    ${allRoutes.join(`
    `)}
  A total of ${allRoutes.length} routes.`);
	console.log(`
△ Server: http://localhost:${options.port}`);
	return world;
}
async function sendCookbookEvent(runtime, event) {}
function fastTimestamp() {
	const d = /* @__PURE__ */ new Date();
	return `(${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")})`;
}
var defaultInserting = (log) => {
	log[0] = `
${log[0]}`;
	console.log(...log);
	return true;
};
function createLogger(runtime, path, executeId) {
	const logger = {};
	const logs = [];
	const tags = /* @__PURE__ */ new Map();
	const inserting = runtime.onLoggerInserting || defaultInserting;
	const hasSubmitting = !!runtime.onLoggerSubmitting;
	const isDevelop = runtime.develop;
	logger._ = {
		logs,
		tags,
		submit: (context) => {
			if (!runtime.onLoggerSubmitting) return;
			return runtime.onLoggerSubmitting(context, logs, tags);
		}
	};
	const __tagPush = (key, value) => {
		tags.set(key, value);
	};
	const __logPush = (log) => {
		if (!inserting(log)) return log;
		if (hasSubmitting) logs.push([...log]);
		if (isDevelop) sendCookbookEvent(runtime, {
			type: "milkio@logger",
			log
		});
		return log;
	};
	logger.setTag = __tagPush;
	logger.setLog = (...log) => __logPush(log);
	const getNow = fastTimestamp;
	logger.debug = (description, ...params) => __logPush([
		"(debug)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	logger.info = (description, ...params) => __logPush([
		"(info)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	logger.warn = (description, ...params) => __logPush([
		"(warn)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	logger.error = (description, ...params) => __logPush([
		"(error)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	logger.request = (description, ...params) => __logPush([
		"(request)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	logger.response = (description, ...params) => __logPush([
		"(response)",
		path,
		executeId,
		getNow(),
		`
${description}`,
		...params
	]);
	return logger;
}
var Trie = class {
	root;
	cache;
	constructor() {
		this.root = new TrieNode();
		this.cache = /* @__PURE__ */ new Map();
	}
	add(path, value) {
		const parts = path.replace(/^\/+|\/+$/g, "").split("/").filter((p) => p !== "");
		let currentNode = this.root;
		if (parts.length === 0) {
			currentNode.value = value;
			this.cache.set(path, value);
			return;
		}
		for (const part of parts) {
			if (!currentNode.children.has(part)) currentNode.children.set(part, new TrieNode());
			currentNode = currentNode.children.get(part);
		}
		currentNode.value = value;
		this.cache.set(path, value);
	}
	get(path) {
		const cached = this.cache.get(path);
		if (cached !== void 0) return cached;
		const parts = path.replace(/^\/+|\/+$/g, "").split("/").filter((p) => p !== "");
		let currentNode = this.root;
		for (const part of parts) {
			if (!currentNode.children.has(part)) return null;
			currentNode = currentNode.children.get(part);
		}
		const result = currentNode.value;
		if (result !== null) this.cache.set(path, result);
		return result;
	}
	getByParts(parts) {
		let currentNode = this.root;
		for (const part of parts) {
			if (!currentNode.children.has(part)) return null;
			currentNode = currentNode.children.get(part);
		}
		return currentNode.value;
	}
	has(path) {
		return this.get(path) !== null;
	}
};
var TrieNode = class {
	children;
	value;
	constructor() {
		this.children = /* @__PURE__ */ new Map();
		this.value = null;
	}
};
function buildCorsHeaders(cors, origin) {
	const result = {};
	if (cors?.corsAllowMethods) result["Access-Control-Allow-Methods"] = cors.corsAllowMethods.join(", ");
	if (cors?.corsAllowHeaders) result["Access-Control-Allow-Headers"] = cors.corsAllowHeaders.join(", ");
	if (cors?.corsMaxAge !== void 0) result["Access-Control-Max-Age"] = String(cors.corsMaxAge);
	if (cors?.corsAllowOrigin && cors.corsAllowOrigin.length > 0) {
		const isWildcard = cors.corsAllowOrigin.includes("*");
		if (cors.corsAllowCredentials) {
			if (origin && (isWildcard || cors.corsAllowOrigin.includes(origin))) {
				result["Access-Control-Allow-Origin"] = origin;
				result["Vary"] = "Origin";
				result["Access-Control-Allow-Credentials"] = "true";
			}
		} else if (isWildcard) result["Access-Control-Allow-Origin"] = "*";
		else if (origin && cors.corsAllowOrigin.includes(origin)) {
			result["Access-Control-Allow-Origin"] = origin;
			result["Vary"] = "Origin";
		}
	}
	if (cors?.corsExposeHeaders && cors.corsExposeHeaders.length > 0) result["Access-Control-Expose-Headers"] = cors.corsExposeHeaders.join(", ");
	return result;
}
function sanitizeExecuteId(executeId) {
	return (typeof executeId === "string" ? executeId : "").replace(/[^A-Za-z0-9_-]/g, "");
}
function __initListener(generated, runtime, executer) {
	const port = runtime.port;
	const trie = new Trie();
	const cors = {
		corsAllowMethods: ["POST", "OPTIONS"],
		corsAllowHeaders: ["Content-Type", "Authorization"],
		corsMaxAge: 0,
		...runtime.http?.cors
	};
	const corsHeadersCache = /* @__PURE__ */ new Map();
	const MAX_CORS_HEADERS_CACHE_SIZE = 1024;
	const getCorsHeaders = (origin) => {
		const key = origin ?? "";
		let cached = corsHeadersCache.get(key);
		if (cached !== void 0) return cached;
		if (corsHeadersCache.size >= MAX_CORS_HEADERS_CACHE_SIZE) corsHeadersCache.clear();
		cached = buildCorsHeaders(cors, origin);
		corsHeadersCache.set(key, cached);
		return cached;
	};
	const defaultResponseHeaders = {
		"Cache-Control": "no-store",
		"Content-Type": "application/json"
	};
	const defaultMergedHeaders = {
		...getCorsHeaders(null),
		...defaultResponseHeaders
	};
	const emptyResultPrefix = "{\"data\":{},\"executeId\":\"";
	const resultPrefix = "{\"data\":";
	const idSuffix = "\",\"success\":true}";
	const fastPathResponse = {
		body: "",
		status: 200,
		headers: defaultMergedHeaders
	};
	let cachedNoEmitHandlers = true;
	let lastEmitHandlersVersion = -1;
	const checkNoEmitHandlers = () => {
		const v = runtime._emitHandlersVersion;
		if (v !== lastEmitHandlersVersion) {
			lastEmitHandlersVersion = v;
			cachedNoEmitHandlers = !runtime._hasEmitHandlers?.("milkio:executeBefore") && !runtime._hasEmitHandlers?.("milkio:executeAfter") && !runtime._hasEmitHandlers?.("milkio:httpRequest") && !runtime._hasEmitHandlers?.("milkio:httpResponse") && !runtime._hasEmitHandlers?.("milkio:httpNotFound");
		}
		return cachedNoEmitHandlers;
	};
	const hasOnLoggerSubmitting = !!runtime.onLoggerSubmitting;
	const noopLogger = {
		_: {
			logs: [],
			tags: /* @__PURE__ */ new Map(),
			submit: () => {}
		},
		setTag: () => {},
		setLog: (..._log) => ({}),
		debug: (_description, ..._params) => ({}),
		info: (_description, ..._params) => ({}),
		warn: (_description, ..._params) => ({}),
		error: (_description, ..._params) => ({}),
		request: (_description, ..._params) => ({}),
		response: (_description, ..._params) => ({})
	};
	const baseContextProto = {
		reject,
		develop: runtime.develop,
		logger: noopLogger,
		emit: runtime.emit,
		emitAnyApproved: runtime.emitAnyApproved,
		emitAllApproved: runtime.emitAllApproved,
		config: runtime.runtime.config,
		typia: generated.typiaSchema,
		onFinally: () => {},
		_: runtime,
		call(module, p) {
			return executer.__call(this, module, p);
		}
	};
	let cachedRouteSchema = null;
	let cachedPathString = null;
	let cachedValidateParams = null;
	let cachedHandler = null;
	let cachedSkipValidation = false;
	const fetch = async (options) => {
		const MAX_BODY_SIZE = 10 * 1024 * 1024;
		const tooLarge = () => reject("REQUEST_TOO_LARGE", { maxBodySize: MAX_BODY_SIZE });
		const readBodyText = async () => {
			const preRead = options.request.__bodyText;
			if (preRead !== void 0) {
				if (typeof preRead === "string" && preRead.length > MAX_BODY_SIZE) throw tooLarge();
				return preRead;
			}
			const contentLength = Number(options.request.headers.get("content-length") ?? "0");
			if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE) throw tooLarge();
			if (!options.request.body) return "";
			const reader = options.request.body.getReader();
			const decoder = new TextDecoder();
			let text = "";
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					text += decoder.decode(value, { stream: true });
					if (text.length > MAX_BODY_SIZE) {
						await reader.cancel().catch(() => {});
						throw tooLarge();
					}
				}
				text += decoder.decode();
			} finally {
				reader.releaseLock();
			}
			return text;
		};
		const origin = options.request.__origin ?? options.request.headers.get("Origin");
		if (options.request.method === "OPTIONS") return new Response(void 0, { headers: getCorsHeaders(origin) });
		const pathname = options.request.__pathname ?? new URL(options.request.url).pathname;
		if (pathname.endsWith("/generate_204")) {
			const corsHeaders = getCorsHeaders(origin);
			return new Response(null, {
				status: 204,
				headers: {
					Server: "milkio",
					...corsHeaders,
					"Cache-Control": "no-store",
					"Content-Type": `text/plain; time=${Date.now()}`
				}
			});
		}
		const prePathArray = options.request.__pathArray;
		let pathString;
		let pathArray;
		if (!runtime.accessKey && (!runtime.ignorePathLevel || runtime.ignorePathLevel === 0)) {
			pathString = pathname;
			pathArray = prePathArray ?? pathname.substring(1).split("/");
		} else {
			pathArray = prePathArray ?? pathname.substring(1).split("/");
			if (runtime.accessKey && pathArray.at(0) !== runtime.accessKey) {
				const corsHeaders = getCorsHeaders(origin);
				if (options.rawResponse) return {
					__rawResponse: true,
					body: "",
					status: 403,
					headers: corsHeaders
				};
				return new Response(void 0, {
					status: 403,
					headers: corsHeaders
				});
			}
			if (runtime.ignorePathLevel !== void 0 && runtime.ignorePathLevel !== 0) pathArray = pathArray.slice(runtime.ignorePathLevel);
			pathString = `/${pathArray.join("/")}`;
		}
		const bodyText = options.request.__bodyText;
		const ip = runtime.realIp ? runtime.realIp(options.request.headers) : "::1";
		if (options.envMode === "test" && pathString.startsWith("/$event/")) {
			const base64Name = decodeURIComponent(pathString.slice(8));
			let eventName;
			try {
				if (typeof atob !== "undefined") eventName = atob(base64Name);
				else if (typeof Buffer !== "undefined") eventName = Buffer.from(base64Name, "base64").toString();
				else throw new Error("No base64 decoder available");
			} catch {
				const corsHeaders = getCorsHeaders(origin);
				const body = JSON.stringify({
					success: false,
					code: "PARAMS_TYPE_NOT_SUPPORTED",
					reject: { expected: "valid base64 event name" }
				});
				if (options.rawResponse) return {
					__rawResponse: true,
					body,
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json"
					}
				};
				return new Response(body, {
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json"
					}
				});
			}
			let eventData = void 0;
			const rawBody = await readBodyText();
			if (rawBody && rawBody !== "" && rawBody !== "{}") try {
				eventData = reviveJSONParse(JSON.parse(rawBody));
			} catch {
				const corsHeaders = getCorsHeaders(origin);
				const body = JSON.stringify({
					success: false,
					code: "PARAMS_TYPE_NOT_SUPPORTED",
					reject: { expected: "json" }
				});
				if (options.rawResponse) return {
					__rawResponse: true,
					body,
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json"
					}
				};
				return new Response(body, {
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json"
					}
				});
			}
			const executeId = __createId();
			const jsonHeaders = {
				...getCorsHeaders(origin),
				"Content-Type": "application/json",
				"Cache-Control": "no-store"
			};
			if (eventData && typeof eventData === "object" && !Array.isArray(eventData) && !("context" in eventData)) {
				const context = {};
				context.reject = reject;
				context.raise = raise;
				context.develop = runtime.develop;
				context.executeId = executeId;
				context.path = pathString;
				context.emit = runtime.emit;
				context.emitAnyApproved = runtime.emitAnyApproved;
				context.emitAllApproved = runtime.emitAllApproved;
				context._ = runtime;
				context.config = runtime.runtime.config;
				context.typia = generated.typiaSchema;
				context.call = (module, params) => executer.__call(context, module, params);
				context.onFinally = () => {};
				const logger = createLogger(runtime, pathString, executeId);
				context.logger = logger;
				context.http = {
					ip,
					params: {
						string: rawBody ?? "",
						parsed: eventData
					},
					request: options.request
				};
				context.headers = options.request.headers;
				eventData.context = context;
				const emitHttpResponse = (success) => {
					if (runtime._hasEmitHandlers?.("milkio:httpResponse") ?? true) return runtime.emit("milkio:httpResponse", {
						executeId,
						logger,
						path: pathString,
						http: context.http,
						headers: options.request.headers,
						context,
						success,
						reject,
						raise
					});
				};
				try {
					if (runtime._hasEmitHandlers?.("milkio:executeBefore") ?? true) await runtime.emit("milkio:executeBefore", {
						executeId,
						logger,
						path: pathString,
						meta: {},
						context,
						reject,
						raise
					});
					await runtime.emit(eventName, eventData);
				} catch (emitError) {
					const errResult = exceptionHandler(executeId, logger, emitError);
					const errBody = JSON.stringify(errResult);
					try {
						await emitHttpResponse(false);
					} catch {}
					if (options.rawResponse) return {
						__rawResponse: true,
						body: errBody,
						status: 200,
						headers: jsonHeaders
					};
					return new Response(errBody, {
						status: 200,
						headers: jsonHeaders
					});
				}
				try {
					await emitHttpResponse(true);
				} catch {}
			} else try {
				await runtime.emit(eventName, eventData);
			} catch (emitError) {
				const errResult = exceptionHandler(executeId, noopLogger, emitError);
				const errBody = JSON.stringify(errResult);
				if (options.rawResponse) return {
					__rawResponse: true,
					body: errBody,
					status: 200,
					headers: jsonHeaders
				};
				return new Response(errBody, {
					status: 200,
					headers: jsonHeaders
				});
			}
			const body = `{"data":${JSON.stringify(eventData ?? {}, (key, value) => key === "context" ? void 0 : value)},"executeId":"${executeId}","success":true}`;
			if (options.rawResponse) return {
				__rawResponse: true,
				body,
				status: 200,
				headers: jsonHeaders
			};
			return new Response(body, {
				status: 200,
				headers: jsonHeaders
			});
		}
		if (options.rawResponse && !origin && checkNoEmitHandlers()) {
			if (options.request.__isAction !== false) {
				let routeSchema = options.routeSchema;
				if (!routeSchema) if (pathString === cachedPathString && cachedRouteSchema) routeSchema = cachedRouteSchema;
				else {
					routeSchema = trie.get(pathString);
					if (routeSchema !== null) {
						cachedRouteSchema = routeSchema;
						cachedPathString = pathString;
					} else {
						routeSchema = generated.routeSchema?.[pathString];
						if (routeSchema === void 0) {} else {
							if (typeof routeSchema.module !== "function") routeSchema.module = await routeSchema.module;
							else routeSchema.module = await routeSchema.module();
							trie.add(pathString, routeSchema);
							cachedRouteSchema = routeSchema;
							cachedPathString = pathString;
						}
					}
				}
				if (routeSchema && routeSchema.type === "action") {
					let validateParams = cachedValidateParams;
					let handler = cachedHandler;
					let skipValidation = cachedSkipValidation;
					if (routeSchema !== cachedRouteSchema) {
						validateParams = routeSchema.validateParams;
						handler = routeSchema.module.handler;
						const meta = routeSchema.module?.meta;
						skipValidation = meta?.typeSafety === false || Array.isArray(meta?.typeSafety) && !meta.typeSafety.includes("params");
						cachedValidateParams = validateParams;
						cachedHandler = handler;
						cachedSkipValidation = skipValidation;
					}
					const executeId = __createId();
					const body = await readBodyText();
					let params;
					let paramsOk = true;
					if (!body || body === "" || body === "{}") params = {};
					else try {
						params = reviveJSONParse(JSON.parse(body));
						if (typeof params === "undefined") params = {};
					} catch {
						paramsOk = false;
					}
					if (paramsOk && params !== null && typeof params === "object" && !Array.isArray(params)) {
						if (options.envMode === "test" || !("$milkioGenerateParams" in params)) {
							if (!skipValidation) {
								if (!validateParams(params).success) paramsOk = false;
							}
							if (paramsOk) {
								const context = Object.create(baseContextProto);
								context.path = pathString;
								context.routeType = "action";
								context.executeId = executeId;
								context.http = {
									url: pathname,
									ip,
									path: {
										string: pathString,
										array: pathArray
									},
									params: {
										string: body,
										parsed: params
									},
									request: options.request,
									response: fastPathResponse,
									cors
								};
								context.headers = options.request.headers;
								try {
									const result = await handler(context, params);
									if (result === void 0 || result === null || result === "") return {
										__rawResponse: true,
										body: emptyResultPrefix + executeId + idSuffix,
										status: 200,
										headers: defaultMergedHeaders
									};
									else if (!Array.isArray(result) && typeof result === "object") return {
										__rawResponse: true,
										body: resultPrefix + JSON.stringify(result) + ",\"executeId\":\"" + executeId + idSuffix,
										status: 200,
										headers: defaultMergedHeaders
									};
								} catch {}
							}
						}
					}
				}
			}
		}
		const corsHeaders = getCorsHeaders(origin);
		const executeId = sanitizeExecuteId(runtime?.executeId ? await runtime.executeId(options.request.headers) : __createId()) || __createId();
		const anyEmitHandlers = !checkNoEmitHandlers();
		const logger = createLogger(runtime, pathString, executeId);
		if (anyEmitHandlers) runtime.runtime.request.set(executeId, { logger });
		const baseHeaders = origin ? {
			...corsHeaders,
			...defaultResponseHeaders
		} : defaultMergedHeaders;
		let finales = [];
		const response = {
			body: "",
			status: 200,
			headers: { ...baseHeaders }
		};
		const isRawPath = generated.rawSchema?.rawPaths?.has(pathString) ?? false;
		const http = {
			url: pathname,
			ip,
			path: {
				string: pathString,
				array: pathArray
			},
			params: {
				string: isRawPath ? "" : await readBodyText(),
				parsed: void 0
			},
			request: options.request,
			response,
			cors
		};
		const context = {
			reject,
			raise
		};
		try {
			if (runtime._hasEmitHandlers?.("milkio:httpRequest") ?? true) await runtime.emit("milkio:httpRequest", {
				executeId,
				logger,
				path: http.path.string,
				http,
				reject,
				raise
			});
			if (options.envMode !== "test" && http.path.string.includes("$")) {
				await runtime.emit("milkio:httpNotFound", {
					executeId,
					logger,
					path: http.path.string,
					http,
					reject,
					raise
				});
				throw reject("NOT_FOUND", { path: http.path.string });
			}
			if (isRawPath) {
				const rawRoute = generated.rawSchema.routes[pathString];
				if (!rawRoute) {
					await runtime.emit("milkio:httpNotFound", {
						executeId,
						logger,
						path: http.path.string,
						http,
						reject,
						raise
					});
					throw reject("NOT_FOUND", { path: http.path.string });
				}
				let module = rawRoute.module;
				if (typeof module === "function") {
					module = await module();
					rawRoute.module = module;
				}
				const meta = module?.meta ?? {};
				context.http = http;
				context.headers = http.request.headers;
				context.develop = runtime.develop;
				context.path = pathString;
				context.routeType = "raw";
				context.logger = logger;
				context.emit = runtime.emit;
				context.emitAnyApproved = runtime.emitAnyApproved;
				context.emitAllApproved = runtime.emitAllApproved;
				context.executeId = executeId;
				context.config = runtime.runtime.config;
				context.typia = generated.typiaSchema;
				context.call = (mod, params) => executer.__call(context, mod, params);
				context.onFinally = (handler) => finales.unshift(handler);
				context._ = runtime;
				const handlerRequest = bodyText !== void 0 ? new Request(options.request.url, {
					method: options.request.method,
					headers: options.request.headers,
					body: bodyText || null,
					signal: options.request.signal
				}) : options.request;
				const results = { value: void 0 };
				if (runtime._hasEmitHandlers?.("milkio:executeBefore") ?? true) await runtime.emit("milkio:executeBefore", {
					executeId,
					logger,
					path: pathString,
					meta,
					context,
					reject,
					raise
				});
				const rawResponse = await module.handler(context, handlerRequest);
				results.value = rawResponse;
				if (runtime._hasEmitHandlers?.("milkio:executeAfter") ?? true) await runtime.emit("milkio:executeAfter", {
					executeId,
					logger,
					path: pathString,
					meta,
					context,
					results,
					reject,
					raise
				});
				const finalHeaders = new Headers(rawResponse.headers);
				for (const [k, v] of Object.entries(corsHeaders)) if (!finalHeaders.has(k)) finalHeaders.set(k, v);
				if (runtime._hasEmitHandlers?.("milkio:httpResponse") ?? true) await runtime.emit("milkio:httpResponse", {
					executeId,
					logger,
					path: http.path.string,
					http,
					headers: http.request.headers,
					context,
					success: true,
					reject,
					raise
				});
				if (finales.length > 0) for (const handler of finales) try {
					await handler();
				} catch (error) {
					logger.error("An error occurred inside onFinally.", error);
				}
				if (hasOnLoggerSubmitting) await logger._.submit(context);
				if (anyEmitHandlers) runtime.runtime.request.delete(executeId);
				return new Response(rawResponse.body, {
					status: rawResponse.status,
					statusText: rawResponse.statusText,
					headers: finalHeaders
				});
			}
			if (!options.request.headers.get("Accept")?.startsWith("text/event-stream")) {
				let routeSchema = options.routeSchema;
				if (!routeSchema) {
					if (pathString === cachedPathString && cachedRouteSchema) routeSchema = cachedRouteSchema;
					else if (http.path.string.includes("$")) {
						routeSchema = trie.get(http.path.string);
						if (routeSchema === null) {
							routeSchema = generated.routeSchema?.[http.path.string];
							if (routeSchema === void 0) {
								await runtime.emit("milkio:httpNotFound", {
									executeId,
									logger,
									path: http.path.string,
									http,
									reject,
									raise
								});
								throw reject("NOT_FOUND", { path: http.path.string });
							}
							if (typeof routeSchema.module !== "function") routeSchema.module = await routeSchema.module;
							else routeSchema.module = await routeSchema.module();
							trie.add(http.path.string, routeSchema);
						}
					} else {
						routeSchema = trie.get(http.path.string);
						if (routeSchema === null) {
							routeSchema = generated.routeSchema?.[http.path.string];
							if (routeSchema === void 0) {
								await runtime.emit("milkio:httpNotFound", {
									executeId,
									logger,
									path: http.path.string,
									http,
									reject,
									raise
								});
								throw reject("NOT_FOUND", { path: http.path.string });
							}
							if (typeof routeSchema.module !== "function") routeSchema.module = await routeSchema.module;
							else routeSchema.module = await routeSchema.module();
							trie.add(http.path.string, routeSchema);
						}
						cachedRouteSchema = routeSchema;
						cachedPathString = pathString;
					}
					if (routeSchema.type !== "action") throw reject("UNACCEPTABLE", {
						expected: "stream",
						message: `Not acceptable, the Accept in the request header should be "text/event-stream". If you are using the "@milkio/stargate" package, please add \`type: "stream"\` to the execute options.`
					});
				}
				context.http = http;
				context.headers = http.request.headers;
				context.routeType = "action";
				const executed = await executer.__execute(routeSchema, {
					createdExecuteId: executeId,
					createdLogger: logger,
					path: http.path.string,
					headers: options.request.headers,
					context,
					params: http.params.string,
					paramsType: "string",
					paramsContentType: "json"
				});
				finales = executed.finales;
				if (response.body === "" && executed.results.value !== void 0) if (executed.emptyResult) response.body = `{"data":{},"executeId":"${executeId}","success":true}`;
				else response.body = `{"data":${JSON.stringify(executed.results.value)},"executeId":"${executeId}","success":true}`;
				if (runtime._hasEmitHandlers?.("milkio:httpResponse") ?? true) await runtime.emit("milkio:httpResponse", {
					executeId,
					logger,
					path: http.path.string,
					http,
					headers: http.request.headers,
					context: executed.context,
					success: true,
					reject,
					raise
				});
				if (finales.length > 0) for (const handler of finales) try {
					await handler();
				} catch (error) {
					logger.error("An error occurred inside onFinally.", error);
				}
				if (hasOnLoggerSubmitting) await logger._.submit(context);
				if (anyEmitHandlers) runtime.runtime.request.delete(executeId);
				if (options.rawResponse) return {
					__rawResponse: true,
					body: response.body,
					status: response.status,
					headers: response.headers
				};
				return new Response(response.body, response);
			} else {
				let routeSchema = options.routeSchema;
				if (!routeSchema) {
					routeSchema = trie.get(http.path.string);
					if (http.path.string.includes("$") || !http.path.string.endsWith("~") || routeSchema === null) {
						routeSchema = generated.routeSchema?.[http.path.string];
						if (routeSchema === void 0) {
							await runtime.emit("milkio:httpNotFound", {
								executeId,
								logger,
								path: http.path.string,
								http,
								reject,
								raise
							});
							throw reject("NOT_FOUND", { path: http.path.string });
						}
						if (typeof routeSchema.module !== "function") routeSchema.module = await routeSchema.module;
						else routeSchema.module = await routeSchema.module();
						trie.add(http.path.string, routeSchema);
					}
					if (routeSchema.type !== "stream") throw reject("UNACCEPTABLE", {
						expected: "stream",
						message: `Not acceptable, the Accept in the request header should be "application/json". If you are using the "@milkio/stargate" package, please remove \`type: "stream"\` to the execute options.`
					});
				}
				let streamClosed = false;
				const handleClose = async () => {
					if (streamClosed) return;
					streamClosed = true;
					for (const handler of finales) try {
						await handler();
					} catch (error) {
						logger.error("An error occurred inside onFinally.", error);
					}
					if (hasOnLoggerSubmitting) await logger._.submit(context);
					if (anyEmitHandlers) runtime.runtime.request.delete(executeId);
				};
				context.http = http;
				context.headers = http.request.headers;
				context.routeType = "stream";
				const executed = await executer.__execute(routeSchema, {
					createdExecuteId: executeId,
					createdLogger: logger,
					path: http.path.string,
					headers: options.request.headers,
					context,
					params: http.params.string,
					paramsType: "string"
				});
				finales = executed.finales;
				response.headers = {
					...response.headers,
					...buildCorsHeaders(http.cors, origin)
				};
				let stream;
				let control;
				if (typeof Bun !== "undefined") stream = new ReadableStream({
					type: "direct",
					async pull(controller) {
						control = controller;
						try {
							controller.write(`data:@${JSON.stringify({
								success: true,
								data: void 0,
								executeId
							})}

`);
							for await (const value of executed.results.value) if (!options.request.signal.aborted) {
								const result = JSON.stringify([null, value]);
								controller.write(`data:${result}

`);
							} else {
								executed.results.value.return(void 0);
								await handleClose();
								controller.close();
							}
						} catch (error) {
							const exception = exceptionHandler(executeId, logger, error);
							const result = {};
							result[exception.code] = exception.reject;
							controller.write(`data:${JSON.stringify([result, null])}

`);
						}
						await new Promise((resolve) => setTimeout(resolve, 0));
						await handleClose();
						controller.close();
					},
					async cancel() {
						await handleClose();
						control.close();
					}
				});
				else stream = new ReadableStream({
					async pull(controller) {
						control = controller;
						try {
							controller.enqueue(`data:@${JSON.stringify({
								success: true,
								data: void 0,
								executeId
							})}

`);
							for await (const value of executed.results.value) if (!options.request.signal?.aborted) {
								const result = JSON.stringify([null, value]);
								controller.enqueue(`data:${result}

`);
							} else {
								executed.results.value.return(void 0);
								await handleClose();
								controller.close();
							}
						} catch (error) {
							const exception = exceptionHandler(executeId, logger, error);
							const result = {};
							result[exception.code] = exception.reject;
							controller.enqueue(`data:${JSON.stringify([result, null])}

`);
						}
						await handleClose();
						await new Promise((resolve) => setTimeout(resolve, 0));
						controller.close();
					},
					async cancel() {
						await handleClose();
						control.close();
					}
				});
				response.body = stream;
				response.headers = {
					...response.headers,
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache"
				};
				await runtime.emit("milkio:httpResponse", {
					executeId,
					logger,
					path: http.path.string,
					http,
					headers: http.request.headers,
					context: executed.context,
					success: true,
					reject,
					raise
				});
				return new Response(response.body, response);
			}
		} catch (error) {
			const results = { value: exceptionHandler(executeId, logger, error) };
			if (results.value !== void 0) response.body = JSON.stringify(results.value);
			response.headers = {
				...response.headers,
				...corsHeaders
			};
			await runtime.emit("milkio:httpResponse", {
				executeId,
				logger,
				path: http.path.string,
				http,
				headers: http.request.headers,
				context,
				success: false,
				reject,
				raise
			});
			if (finales.length > 0) for (const handler of finales) try {
				await handler();
			} catch (e) {
				logger.error("An error occurred inside onFinally.", e);
			}
			if (hasOnLoggerSubmitting) await logger._.submit(context);
			if (anyEmitHandlers) runtime.runtime.request.delete(executeId);
			if (options.rawResponse) return {
				__rawResponse: true,
				body: response.body,
				status: response.status,
				headers: response.headers
			};
			return new Response(response.body, response);
		}
	};
	const streamClosers = /* @__PURE__ */ new Map();
	const handleMessage = async (port, options) => {
		if (typeof options === "string") {
			if (options === "PING") port.postMessage("PONG");
			if (options.startsWith("CLOSE_STREAM:")) {
				const executeId = options.substring(13);
				const streamCloser = streamClosers.get(executeId);
				if (streamCloser) {
					streamCloser.generator.return(void 0);
					streamCloser.handleClose("stream");
				}
			}
			return;
		}
		let routeSchema = trie.get(options.path);
		if (routeSchema === null) {
			routeSchema = generated.routeSchema?.[options.path];
			if (routeSchema === void 0) throw reject("NOT_FOUND", { path: options.path });
			if (typeof routeSchema.module !== "function") routeSchema.module = await routeSchema.module;
			else routeSchema.module = await routeSchema.module();
			trie.add(options.path, routeSchema);
		}
		const headers = new Headers(options.headers);
		const params = options.params ?? {};
		const logger = createLogger(runtime, options.path, options.executeId);
		let finales = [];
		const http = new Proxy({}, {
			get: (target, property) => {
				if (property === "notFound") return true;
			},
			set: () => {
				throw reject("UNACCEPTABLE", {
					expected: "context.http",
					message: "This request was invoked through the execute method. Since no actual request was generated, the HTTP methods under the context cannot be accessed."
				});
			}
		});
		const handleClose = async (type) => {
			if (type === "stream") streamClosers.delete(options.executeId);
			for (const handler of finales) try {
				await handler();
			} catch (error) {
				logger.error("An error occurred inside onFinally.", error);
			}
			await logger._.submit(context);
			runtime.runtime.request.delete(options.executeId);
		};
		const context = {
			http,
			headers,
			routeType: routeSchema.type,
			reject,
			raise
		};
		try {
			if (routeSchema.type === "action") {
				const executed = await executer.__execute(routeSchema, {
					createdExecuteId: options.executeId,
					createdLogger: logger,
					path: options.path,
					headers,
					context,
					params,
					paramsType: "raw"
				});
				finales = executed.finales;
				await handleClose("action");
				if (executed.emptyResult) port.postMessage({
					executeId: options.executeId,
					success: true,
					data: void 0
				});
				else port.postMessage({
					executeId: options.executeId,
					success: true,
					data: executed.results.value
				});
			}
			if (routeSchema.type === "stream") {
				const executed = await executer.__execute(routeSchema, {
					createdExecuteId: options.executeId,
					createdLogger: logger,
					path: options.path,
					headers,
					context,
					params,
					paramsType: "raw"
				});
				finales = executed.finales;
				try {
					port.postMessage({
						success: true,
						data: void 0,
						executeId: options.executeId,
						done: false
					});
					streamClosers.set(options.executeId, {
						generator: executed.results.value,
						handleClose
					});
					for await (const value of executed.results.value) {
						const data = {
							success: true,
							data: [null, value],
							executeId: options.executeId,
							done: false
						};
						port.postMessage(data);
					}
					port.postMessage({
						success: true,
						data: void 0,
						executeId: options.executeId,
						done: true
					});
				} catch (error) {
					const exception = exceptionHandler(options.executeId, logger, error);
					const result = {};
					result[exception.code] = exception.reject;
					port.postMessage({
						success: true,
						data: [result, null],
						executeId: options.executeId,
						done: true
					});
				}
				await handleClose("stream");
			}
		} catch (error) {
			const result = exceptionHandler(options.executeId, logger, error);
			await logger._.submit(context);
			port.postMessage({
				success: false,
				data: void 0,
				error: result,
				executeId: options.executeId,
				done: true
			});
		}
	};
	return {
		port,
		fetch,
		handleMessage
	};
}
function reject(code, data) {
	const error = {
		$milkioReject: true,
		code,
		data
	};
	if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(error);
	return error;
}
function raise(obj) {
	const code = Object.keys(obj)[0];
	if (code === void 0) throw new Error("raise() requires an object with at least one key as the rejection code");
	const error = {
		$milkioReject: true,
		code,
		data: obj[code]
	};
	if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(error);
	return error;
}
function exceptionHandler(executeId, logger, error) {
	if (error instanceof Error && "viteServer" in globalThis) try {
		globalThis.viteServer.ssrFixStacktrace(error);
	} catch {}
	const name = error?.code ?? error?.name ?? error?.constructor?.name ?? "Unnamed Exception";
	if (error?.$milkioReject === true) if (error.code === "NOT_FOUND") logger.info(name, error?.data?.path ?? "Unknown path");
	else {
		const stack = (error?.stack ?? "").split(`
`).slice(2).join(`
`);
		logger.warn(name, `
${JSON.stringify(error?.data)}`, `
${stack}
`);
	}
	else try {
		const stack = error?.stack ?? "";
		logger.error(name, `
${JSON.stringify(error?.data)}`, `
${stack}
`);
	} catch (_) {
		logger.error(name, `
${error?.toString()}`, `
${error?.stack}
`);
	}
	let result;
	if (error?.$milkioReject === true) result = {
		success: false,
		code: error.code,
		reject: error.data,
		executeId
	};
	else result = {
		success: false,
		code: "INTERNAL_SERVER_ERROR",
		reject: void 0,
		executeId
	};
	return result;
}
//#endregion
//#region .milkio/config-schema.ts
var mode = "test";
var configSchema = { get: async () => {
	return { mode };
} };
//#endregion
//#region .milkio/typia-schema.ts
var typia_schema_default = {};
//#endregion
//#region ../../node_modules/typia/lib/internal/_jsonStringifyString.mjs
/**
* In the past, name of `typia` was `typescript-json`, and supported JSON
* serialization by wrapping `fast-json-stringify. `typescript-json`was a helper
* library of`fast-json-stringify`, which can skip manual JSON schema definition
* just by putting pure TypeScript type.
*
* This `$string` function is a part of `fast-json-stringify` at that time, and
* still being used in `typia` for the string serialization.
*
* @reference https://github.com/fastify/fast-json-stringify/blob/master/lib/serializer.js
* @blog https://dev.to/samchon/good-bye-typescript-is-ancestor-of-typia-20000x-faster-validator-49fi
*/
var _jsonStringifyString = (str) => {
	const len = str.length;
	let result = "";
	let last = -1;
	let point = 255;
	for (var i = 0; i < len; i++) {
		point = str.charCodeAt(i);
		if (point < 32) return JSON.stringify(str);
		if (point >= 55296 && point <= 57343) return JSON.stringify(str);
		if (point === 34 || point === 92) {
			last === -1 && (last = 0);
			result += str.slice(last, i) + "\\";
			last = i;
		}
	}
	return last === -1 && "\"" + str + "\"" || "\"" + result + str.slice(last) + "\"";
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_validateReport.mjs
var _validateReport = (array) => {
	const isAncestor = (ancestor, descendant) => descendant === ancestor || descendant.startsWith(`${ancestor}.`) || descendant.startsWith(`${ancestor}[`);
	const reportable = (path) => {
		if (array.length === 0) return true;
		const last = array[array.length - 1].path;
		return isAncestor(path, last) === false && isAncestor(last, path) === false;
	};
	return (exceptable, error) => {
		if (exceptable && reportable(error.path)) {
			if (error.value === void 0) error.description ??= [
				"The value at this path is `undefined`.",
				"",
				`Please fill the \`${error.expected}\` typed value next time.`
			].join("\n");
			array.push(error);
		}
		return false;
	};
};
//#endregion
//#region .milkio/transpiled/routes/modules__indexTaction/2yctkoj6c2vmd/schema.ts
var schema_default$16 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/index.action-DuD1rF0o.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "string" === typeof input.message;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("message" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["string" === typeof input.message || _report(_exceptionable, {
			path: _path + ".message",
			expected: "string",
			value: input.message
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"message":${_jsonStringifyString(input.message)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__window__closeTaction/976cxxqulhwa/schema.ts
var schema_default$15 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/close.action-DVNkT4te.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => "{}";
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__window__get_stateTaction/1ifpi7p1e6mct/schema.ts
var schema_default$14 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/get-state.action-DjcwUzIb.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.isMaximized && "boolean" === typeof input.isMinimized;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("isMaximized" === key || "isMinimized" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.isMaximized || _report(_exceptionable, {
			path: _path + ".isMaximized",
			expected: "boolean",
			value: input.isMaximized
		}), "boolean" === typeof input.isMinimized || _report(_exceptionable, {
			path: _path + ".isMinimized",
			expected: "boolean",
			value: input.isMinimized
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"isMaximized":${String(input.isMaximized)},"isMinimized":${String(input.isMinimized)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__window__maximizeTaction/3f85oecwhgtjj/schema.ts
var schema_default$13 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/maximize.action-B_eBD1bP.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.isMaximized;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("isMaximized" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.isMaximized || _report(_exceptionable, {
			path: _path + ".isMaximized",
			expected: "boolean",
			value: input.isMaximized
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"isMaximized":${String(input.isMaximized)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__window__minimizeTaction/70qsbjemkqr2/schema.ts
var schema_default$12 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/minimize.action-ClRXcBAO.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => "{}";
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__wallpaper__cancelTaction/1xixxnvywewnr/schema.ts
var schema_default$11 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/cancel.action-DTW-YjSY.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.isWallpaper;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("isWallpaper" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.isWallpaper || _report(_exceptionable, {
			path: _path + ".isWallpaper",
			expected: "boolean",
			value: input.isWallpaper
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"isWallpaper":${String(input.isWallpaper)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__wallpaper__setTaction/gauarh36z7ut/schema.ts
var schema_default$10 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/set.action-Fxzhv64i.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.isWallpaper;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("isWallpaper" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.isWallpaper || _report(_exceptionable, {
			path: _path + ".isWallpaper",
			expected: "boolean",
			value: input.isWallpaper
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"isWallpaper":${String(input.isWallpaper)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_decimal.mjs
var _decimalDecompose = (value) => {
	if (Number.isFinite(value) === false) return null;
	const [mantissa = "0", exponentText = "0"] = value.toString().split("e");
	const negative = mantissa.startsWith("-");
	const unsigned = negative ? mantissa.slice(1) : mantissa;
	const point = unsigned.indexOf(".");
	const decimals = point === -1 ? 0 : unsigned.length - point - 1;
	const digits = BigInt(unsigned.replace(".", ""));
	return {
		coefficient: negative ? -digits : digits,
		exponent: Number(exponentText) - decimals
	};
};
var _decimalDivide = (value, divisor) => {
	const dividend = _decimalDecompose(value);
	if (dividend === null || divisor.coefficient === BigInt(0)) return null;
	const exponent = dividend.exponent - divisor.exponent;
	return exponent >= 0 ? {
		numerator: dividend.coefficient * _decimalPower(exponent),
		denominator: divisor.coefficient
	} : {
		numerator: dividend.coefficient,
		denominator: divisor.coefficient * _decimalPower(-exponent)
	};
};
var _decimalIntegerStep = (value) => {
	const decimal = _decimalDecompose(value);
	if (decimal === null || decimal.coefficient <= BigInt(0)) return null;
	if (decimal.exponent >= 0) return {
		coefficient: decimal.coefficient * _decimalPower(decimal.exponent),
		exponent: 0
	};
	const denominator = _decimalPower(-decimal.exponent);
	return {
		coefficient: decimal.coefficient / _decimalGcd(decimal.coefficient, denominator),
		exponent: 0
	};
};
var _decimalToNumber = (value) => Number(`${value.coefficient}e${value.exponent}`);
var _decimalPower = (exponent) => BigInt(10) ** BigInt(exponent);
var _decimalGcd = (x, y) => {
	while (y !== BigInt(0)) [x, y] = [y, x % y];
	return x < BigInt(0) ? -x : x;
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_isMultipleOf.mjs
var _isMultipleOf = (value, multipleOf) => {
	const divisor = _decimalDecompose(multipleOf);
	if (divisor === null || divisor.coefficient <= BigInt(0)) return false;
	const ratio = _decimalDivide(value, divisor);
	return ratio !== null && ratio.numerator % ratio.denominator === BigInt(0);
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomMultiple.mjs
var _randomMultiple = (props) => {
	const step = props.integer ? _decimalIntegerStep(props.multipleOf) : _decimalDecompose(props.multipleOf);
	if (step === null || step.coefficient <= BigInt(0)) throw new Error("The multipleOf value must be a positive finite number.");
	const lower = _decimalDivide(props.minimum, step);
	const upper = _decimalDivide(props.maximum, step);
	if (lower === null || upper === null) throw new Error("The random number range must be finite.");
	const minimum = lowerBound(lower, props.exclusiveMinimum);
	const maximum = upperBound(upper, props.exclusiveMaximum);
	if (minimum > maximum) throw new Error("The range does not contain a multipleOf value.");
	const selected = randomBigint(minimum, maximum);
	const candidates = unique([
		selected,
		minimum,
		maximum,
		clamp(BigInt(0), minimum, maximum),
		clamp(BigInt(1), minimum, maximum),
		clamp(BigInt(-1), minimum, maximum),
		...nearby(selected, minimum, maximum)
	]);
	for (const coefficient of candidates) {
		const value = _decimalToNumber({
			coefficient: step.coefficient * coefficient,
			exponent: step.exponent
		});
		if (isValid(props, value)) return value;
	}
	const aligned = findRepresentableIntegerMultiple(props);
	if (aligned !== null) return aligned;
	const decimalAligned = findRepresentableDecimalMultiple(props, step);
	if (decimalAligned !== null) return decimalAligned;
	throw new Error("The range does not contain a representable multipleOf value.");
};
var isValid = (props, value) => Number.isFinite(value) && (props.integer === false || Number.isInteger(value)) && (props.exclusiveMinimum ? value > props.minimum : value >= props.minimum) && (props.exclusiveMaximum ? value < props.maximum : value <= props.maximum) && _isMultipleOf(value, props.multipleOf);
var findRepresentableDecimalMultiple = (props, step) => {
	const limit = BigInt("999999999999999");
	for (let exponent = -324; exponent <= 308; ++exponent) {
		const unit = {
			coefficient: BigInt(1),
			exponent
		};
		const lower = _decimalDivide(props.minimum, unit);
		const upper = _decimalDivide(props.maximum, unit);
		if (lower === null || upper === null) return null;
		const coefficientMinimum = max(-limit, lowerBound(lower, props.exclusiveMinimum));
		const coefficientMaximum = min(limit, upperBound(upper, props.exclusiveMaximum));
		if (coefficientMinimum > coefficientMaximum) continue;
		const coefficientStep = decimalCoefficientStep(step, exponent);
		const minimum = lowerBound({
			numerator: coefficientMinimum,
			denominator: coefficientStep
		}, false);
		const maximum = upperBound({
			numerator: coefficientMaximum,
			denominator: coefficientStep
		}, false);
		if (minimum > maximum) continue;
		const selected = randomBigint(minimum, maximum);
		for (const quotient of unique([
			selected,
			minimum,
			maximum,
			clamp(BigInt(0), minimum, maximum),
			...nearby(selected, minimum, maximum)
		])) {
			const value = _decimalToNumber({
				coefficient: coefficientStep * quotient,
				exponent
			});
			if (isValid(props, value)) return value;
		}
	}
	return null;
};
var decimalCoefficientStep = (step, exponent) => {
	const difference = exponent - step.exponent;
	if (difference >= 0) {
		const power = _decimalPower(difference);
		return step.coefficient / _decimalGcd(step.coefficient, power);
	}
	return step.coefficient * _decimalPower(-difference);
};
var findRepresentableIntegerMultiple = (props) => {
	const step = _decimalIntegerStep(props.multipleOf);
	if (step === null) return null;
	const unit = {
		coefficient: BigInt(1),
		exponent: 0
	};
	const lower = _decimalDivide(props.minimum, unit);
	const upper = _decimalDivide(props.maximum, unit);
	if (lower === null || upper === null) return null;
	const minimum = lowerBound(lower, props.exclusiveMinimum);
	const maximum = upperBound(upper, props.exclusiveMaximum);
	if (minimum > maximum) return null;
	if (minimum <= BigInt(0) && maximum >= BigInt(0)) return 0;
	const candidate = minimum > BigInt(0) ? findPositiveAligned(minimum, maximum, step.coefficient) : (() => {
		const magnitude = findPositiveAligned(-maximum, -minimum, step.coefficient);
		return magnitude === null ? null : -magnitude;
	})();
	if (candidate === null) return null;
	const value = Number(candidate);
	return isValid(props, value) ? value : null;
};
var findPositiveAligned = (minimum, maximum, integerStep) => {
	const first = bitLength(minimum) - 1;
	const last = bitLength(maximum) - 1;
	for (let exponent = first; exponent <= last; ++exponent) {
		const bandMinimum = max(minimum, BigInt(1) << BigInt(exponent));
		const bandMaximum = min(maximum, (BigInt(1) << BigInt(exponent + 1)) - BigInt(1));
		const quantum = exponent <= 52 ? BigInt(1) : BigInt(1) << BigInt(exponent - 52);
		const alignedStep = integerStep / _decimalGcd(integerStep, quantum) * quantum;
		const lower = lowerBound({
			numerator: bandMinimum,
			denominator: alignedStep
		}, false);
		const upper = upperBound({
			numerator: bandMaximum,
			denominator: alignedStep
		}, false);
		if (lower <= upper) return randomBigint(lower, upper) * alignedStep;
	}
	return null;
};
var bitLength = (value) => value.toString(2).length;
var min = (x, y) => x < y ? x : y;
var max = (x, y) => x > y ? x : y;
var lowerBound = (ratio, exclusive) => {
	const quotient = ratio.numerator / ratio.denominator;
	const remainder = ratio.numerator % ratio.denominator;
	return quotient + (remainder > BigInt(0) ? BigInt(1) : BigInt(0)) + (exclusive && remainder === BigInt(0) ? BigInt(1) : BigInt(0));
};
var upperBound = (ratio, exclusive) => {
	const quotient = ratio.numerator / ratio.denominator;
	const remainder = ratio.numerator % ratio.denominator;
	return quotient - (remainder < BigInt(0) ? BigInt(1) : BigInt(0)) - (exclusive && remainder === BigInt(0) ? BigInt(1) : BigInt(0));
};
var randomBigint = (minimum, maximum) => {
	const scale = BigInt(1) << BigInt(53);
	const sample = BigInt(Math.min(Number(scale - BigInt(1)), Math.floor(Math.max(0, Math.random()) * Number(scale))));
	return minimum + (maximum - minimum + BigInt(1)) * sample / scale;
};
var clamp = (value, minimum, maximum) => value < minimum ? minimum : value > maximum ? maximum : value;
var nearby = (selected, minimum, maximum) => {
	const output = [];
	for (let distance = BigInt(1); distance <= BigInt(32); ++distance) {
		if (selected - distance >= minimum) output.push(selected - distance);
		if (selected + distance <= maximum) output.push(selected + distance);
	}
	return output;
};
var unique = (values) => [...new Set(values)];
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomInteger.mjs
var _randomInteger = (schema) => {
	const lower = getLowerBoundary(schema);
	const upper = getUpperBoundary(schema);
	const minimum = lower?.value ?? (upper === null ? 0 : upper.value - 100);
	const maximum = upper?.value ?? (lower === null ? 100 : lower.value + 100);
	if (minimum > maximum) throw new Error("Minimum value is greater than maximum value.");
	return schema.multipleOf === void 0 ? scalar({
		minimum,
		maximum
	}) : _randomMultiple({
		minimum,
		maximum,
		multipleOf: schema.multipleOf,
		exclusiveMinimum: lower?.exclusive ?? false,
		exclusiveMaximum: upper?.exclusive ?? false,
		integer: true
	});
};
var scalar = (props) => {
	const minimum = Math.ceil(props.minimum);
	const maximum = Math.floor(props.maximum);
	if (minimum > maximum) throw new Error("The integer range is empty.");
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};
var getLowerBoundary = (schema) => {
	const selected = selectBoundary(schema.minimum === void 0 ? null : {
		value: schema.minimum,
		exclusive: false
	}, schema.exclusiveMinimum === void 0 ? null : {
		value: schema.exclusiveMinimum,
		exclusive: true
	}, Math.max);
	if (selected === null) return null;
	return {
		value: selected.exclusive ? Math.floor(selected.value) + 1 : Math.ceil(selected.value),
		exclusive: false
	};
};
var getUpperBoundary = (schema) => {
	const selected = selectBoundary(schema.maximum === void 0 ? null : {
		value: schema.maximum,
		exclusive: false
	}, schema.exclusiveMaximum === void 0 ? null : {
		value: schema.exclusiveMaximum,
		exclusive: true
	}, Math.min);
	if (selected === null) return null;
	return {
		value: selected.exclusive ? Math.ceil(selected.value) - 1 : Math.floor(selected.value),
		exclusive: false
	};
};
var selectBoundary = (x, y, compare) => {
	if (x === null) return y;
	if (y === null) return x;
	if (x.value === y.value) return {
		value: x.value,
		exclusive: x.exclusive || y.exclusive
	};
	return compare(x.value, y.value) === x.value ? x : y;
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomString.mjs
var DEFAULT_MIN_LENGTH = 5;
var DEFAULT_RANGE = 5;
var _randomString = (props) => {
	const minimum = props.minLength ?? Math.min(props.maxLength ?? DEFAULT_MIN_LENGTH, DEFAULT_MIN_LENGTH);
	const length = _randomInteger({
		type: "integer",
		minimum,
		maximum: props.maxLength ?? minimum + DEFAULT_RANGE
	});
	return new Array(length).fill(0).map(() => ALPHABETS[random$1()]).join("");
};
var ALPHABETS = "abcdefghijklmnopqrstuvwxyz";
var random$1 = () => _randomInteger({
	type: "integer",
	minimum: 0,
	maximum: 25
});
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__delete_fileTaction/5j9rrnc7cgpv/schema.ts
var schema_default$9 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/delete-file.action-64ioAtaK.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.projectDir && "string" === typeof input.relativeDir && "string" === typeof input.fileName;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("projectDir" === key || "relativeDir" === key || "fileName" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"string" === typeof input.projectDir || _report(_exceptionable, {
				path: _path + ".projectDir",
				expected: "string",
				value: input.projectDir
			}),
			"string" === typeof input.relativeDir || _report(_exceptionable, {
				path: _path + ".relativeDir",
				expected: "string",
				value: input.relativeDir
			}),
			"string" === typeof input.fileName || _report(_exceptionable, {
				path: _path + ".fileName",
				expected: "string",
				value: input.fileName
			})
		].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({
			projectDir: (_generator?.string ?? _randomString)({ type: "string" }),
			relativeDir: (_generator?.string ?? _randomString)({ type: "string" }),
			fileName: (_generator?.string ?? _randomString)({ type: "string" })
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.success;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("success" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.success || _report(_exceptionable, {
			path: _path + ".success",
			expected: "boolean",
			value: input.success
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"success":${String(input.success)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__existsTaction/19mgirs7ss43e/schema.ts
var schema_default$8 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/exists.action-CaVXoJv_.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.projectDir && "string" === typeof input.relativeDir && "string" === typeof input.fileName;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("projectDir" === key || "relativeDir" === key || "fileName" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"string" === typeof input.projectDir || _report(_exceptionable, {
				path: _path + ".projectDir",
				expected: "string",
				value: input.projectDir
			}),
			"string" === typeof input.relativeDir || _report(_exceptionable, {
				path: _path + ".relativeDir",
				expected: "string",
				value: input.relativeDir
			}),
			"string" === typeof input.fileName || _report(_exceptionable, {
				path: _path + ".fileName",
				expected: "string",
				value: input.fileName
			})
		].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({
			projectDir: (_generator?.string ?? _randomString)({ type: "string" }),
			relativeDir: (_generator?.string ?? _randomString)({ type: "string" }),
			fileName: (_generator?.string ?? _randomString)({ type: "string" })
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.exists;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("exists" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.exists || _report(_exceptionable, {
			path: _path + ".exists",
			expected: "boolean",
			value: input.exists
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"exists":${String(input.exists)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_jsonStringifyArray.mjs
/**
* Serializes the elements of an array the way ECMAScript `JSON.stringify` does.
*
* `SerializeJSONArray` walks index `0` to `LengthOfArrayLike(value) - 1` and
* writes `null` wherever the element serializes to `undefined`. Neither
* `Array.prototype.map` nor `Array.prototype.join` reproduces that:
*
* - `map` never visits a hole and leaves one behind, and `join` renders a hole as
*   empty text, so a sparse array joined into malformed text such as `[,1]`. A
*   hole exists at runtime whatever the element type declares, so this is not
*   an `any` concern.
* - `join` renders a mapped `undefined` as empty text too, which is what an `any`
*   or `unknown` element holding a function, a symbol, or a `toJSON` that
*   returns nothing serializes to.
*
* The length is converted with `ToLength` and read once, which is both what
* `JSON.stringify` does and what `Array.prototype.every` - the traversal
* typia's own array checkers emit - does, so the checker and the serializer
* walk one index range rather than two that merely usually coincide.
*
* @param elements Array being serialized.
* @param mapper Serializer of one element, emitted by the transform.
* @returns Comma separated element text, without the enclosing brackets.
* @internal
*/
var _jsonStringifyArray = (elements, mapper) => {
	const length = Math.min(Math.max(Math.trunc(elements.length) || 0, 0), Number.MAX_SAFE_INTEGER);
	let output = "";
	for (let i = 0; i < length; ++i) {
		const elem = elements[i];
		const text = elem === void 0 ? void 0 : mapper(elem, i);
		output += (i === 0 ? "" : ",") + (text === void 0 ? "null" : text);
	}
	return output;
};
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__list_directoryTaction/21md1t7840jt2/schema.ts
var schema_default$7 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/list-directory.action-BBhaEdCQ.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.projectDir && "string" === typeof input.relativeDir;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("projectDir" === key || "relativeDir" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["string" === typeof input.projectDir || _report(_exceptionable, {
			path: _path + ".projectDir",
			expected: "string",
			value: input.projectDir
		}), "string" === typeof input.relativeDir || _report(_exceptionable, {
			path: _path + ".relativeDir",
			expected: "string",
			value: input.relativeDir
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({
			projectDir: (_generator?.string ?? _randomString)({ type: "string" }),
			relativeDir: (_generator?.string ?? _randomString)({ type: "string" })
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => Array.isArray(input.entries) && input.entries.every((elem) => "object" === typeof elem && null !== elem && _io1(elem));
		const _io1 = (input) => "string" === typeof input.name && "boolean" === typeof input.isDir;
		const _po0 = (input) => {
			if (Array.isArray(input.entries)) (() => input.entries.forEach((elem) => {
				if ("object" === typeof elem && null !== elem) _po1(elem);
			}))();
			for (const key of Object.keys(input)) {
				if ("entries" === key) continue;
				delete input[key];
			}
		};
		const _po1 = (input) => {
			for (const key of Object.keys(input)) {
				if ("name" === key || "isDir" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [(Array.isArray(input.entries) || _report(_exceptionable, {
			path: _path + ".entries",
			expected: "{ name: string; isDir: boolean; }[]",
			value: input.entries
		})) && input.entries.map((elem, _index2) => ("object" === typeof elem && null !== elem || _report(_exceptionable, {
			path: _path + ".entries[" + _index2 + "]",
			expected: "{ name: string; isDir: boolean; }",
			value: elem
		})) && _vo1(elem, _path + ".entries[" + _index2 + "]", _exceptionable) || _report(_exceptionable, {
			path: _path + ".entries[" + _index2 + "]",
			expected: "{ name: string; isDir: boolean; }",
			value: elem
		})).every((flag) => flag) || _report(_exceptionable, {
			path: _path + ".entries",
			expected: "{ name: string; isDir: boolean; }[]",
			value: input.entries
		})].every((flag) => flag);
		const _vo1 = (input, _path, _exceptionable = true) => ["string" === typeof input.name || _report(_exceptionable, {
			path: _path + ".name",
			expected: "string",
			value: input.name
		}), "boolean" === typeof input.isDir || _report(_exceptionable, {
			path: _path + ".isDir",
			expected: "boolean",
			value: input.isDir
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"entries":${`[${_jsonStringifyArray(input.entries, (elem) => _so1(elem))}]`}}`;
			const _so1 = (input) => `{"name":${_jsonStringifyString(input.name)},"isDir":${String(input.isDir)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__pick_directoryTaction/1koor3kurigal/schema.ts
var schema_default$6 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/pick-directory.action-Cq0QkacO.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => null === input.path || "string" === typeof input.path;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("path" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [null === input.path || "string" === typeof input.path || _report(_exceptionable, {
			path: _path + ".path",
			expected: "(null | string)",
			value: input.path
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"path":${null !== input.path ? _jsonStringifyString(input.path) : "null"}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__read_fileTaction/8tcuz7u0873y/schema.ts
var schema_default$5 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/read-file.action-BE9CktaA.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.projectDir && "string" === typeof input.relativeDir && "string" === typeof input.fileName;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("projectDir" === key || "relativeDir" === key || "fileName" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"string" === typeof input.projectDir || _report(_exceptionable, {
				path: _path + ".projectDir",
				expected: "string",
				value: input.projectDir
			}),
			"string" === typeof input.relativeDir || _report(_exceptionable, {
				path: _path + ".relativeDir",
				expected: "string",
				value: input.relativeDir
			}),
			"string" === typeof input.fileName || _report(_exceptionable, {
				path: _path + ".fileName",
				expected: "string",
				value: input.fileName
			})
		].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({
			projectDir: (_generator?.string ?? _randomString)({ type: "string" }),
			relativeDir: (_generator?.string ?? _randomString)({ type: "string" }),
			fileName: (_generator?.string ?? _randomString)({ type: "string" })
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => null === input.content || "string" === typeof input.content;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("content" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [null === input.content || "string" === typeof input.content || _report(_exceptionable, {
			path: _path + ".content",
			expected: "(null | string)",
			value: input.content
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"content":${null !== input.content ? _jsonStringifyString(input.content) : "null"}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomPick.mjs
var _randomPick = (array) => array[random(array)];
var random = (array) => _randomInteger({
	type: "integer",
	minimum: 0,
	maximum: array.length - 1
});
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__write_fileTaction/24ffy28hv4chl/schema.ts
var schema_default$4 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/write-file.action-yJldL-zR.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.projectDir && "string" === typeof input.relativeDir && "string" === typeof input.fileName && "string" === typeof input.content && ("base64" === input.encoding || "utf8" === input.encoding);
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("projectDir" === key || "relativeDir" === key || "fileName" === key || "content" === key || "encoding" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"string" === typeof input.projectDir || _report(_exceptionable, {
				path: _path + ".projectDir",
				expected: "string",
				value: input.projectDir
			}),
			"string" === typeof input.relativeDir || _report(_exceptionable, {
				path: _path + ".relativeDir",
				expected: "string",
				value: input.relativeDir
			}),
			"string" === typeof input.fileName || _report(_exceptionable, {
				path: _path + ".fileName",
				expected: "string",
				value: input.fileName
			}),
			"string" === typeof input.content || _report(_exceptionable, {
				path: _path + ".content",
				expected: "string",
				value: input.content
			}),
			"base64" === input.encoding || "utf8" === input.encoding || _report(_exceptionable, {
				path: _path + ".encoding",
				expected: "(\"base64\" | \"utf8\")",
				value: input.encoding
			})
		].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({
			projectDir: (_generator?.string ?? _randomString)({ type: "string" }),
			relativeDir: (_generator?.string ?? _randomString)({ type: "string" }),
			fileName: (_generator?.string ?? _randomString)({ type: "string" }),
			content: (_generator?.string ?? _randomString)({ type: "string" }),
			encoding: _randomPick([() => "base64", () => "utf8"])()
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.success;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("success" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.success || _report(_exceptionable, {
			path: _path + ".success",
			expected: "boolean",
			value: input.success
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"success":${String(input.success)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__launcher__restartTaction/w21pflqo0huq/schema.ts
var schema_default$3 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/restart.action-Bv6ZI8Mb.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.success;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("success" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.success || _report(_exceptionable, {
			path: _path + ".success",
			expected: "boolean",
			value: input.success
		})].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"success":${String(input.success)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__desktop_setting__getTaction/2ln4oh37tii7/schema.ts
var schema_default$2 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/get.action-QzjiCte6.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => true;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) delete input[key];
		};
		const _vo0 = (input, _path, _exceptionable = true) => true;
		const __is = (input) => "object" === typeof input && null !== input && false === Array.isArray(input) && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input && false === Array.isArray(input) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Params",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(params),
	randomParams: () => (() => {
		const _ro0 = (_recursive = false, _depth = 0) => ({});
		return (generator) => {
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.launchAtStartup && "boolean" === typeof input.runInBackground && "boolean" === typeof input.isWallpaper && "boolean" === typeof input.updateReady && (null === input.stagedVersion || "string" === typeof input.stagedVersion);
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("launchAtStartup" === key || "runInBackground" === key || "isWallpaper" === key || "updateReady" === key || "stagedVersion" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"boolean" === typeof input.launchAtStartup || _report(_exceptionable, {
				path: _path + ".launchAtStartup",
				expected: "boolean",
				value: input.launchAtStartup
			}),
			"boolean" === typeof input.runInBackground || _report(_exceptionable, {
				path: _path + ".runInBackground",
				expected: "boolean",
				value: input.runInBackground
			}),
			"boolean" === typeof input.isWallpaper || _report(_exceptionable, {
				path: _path + ".isWallpaper",
				expected: "boolean",
				value: input.isWallpaper
			}),
			"boolean" === typeof input.updateReady || _report(_exceptionable, {
				path: _path + ".updateReady",
				expected: "boolean",
				value: input.updateReady
			}),
			null === input.stagedVersion || "string" === typeof input.stagedVersion || _report(_exceptionable, {
				path: _path + ".stagedVersion",
				expected: "(null | string)",
				value: input.stagedVersion
			})
		].every((flag) => flag);
		const __is = (input) => "object" === typeof input && null !== input && _io0(input);
		let errors;
		let _report;
		const __validate = (input) => {
			if (false === __is(input)) {
				errors = [];
				_report = _validateReport(errors);
				((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				})) && _vo0(input, _path + "", true) || _report(true, {
					path: _path + "",
					expected: "Result",
					value: input
				}))(input, "$input", true);
				const success = 0 === errors.length;
				return success ? {
					success,
					data: input
				} : {
					success,
					errors,
					data: input
				};
			}
			return {
				success: true,
				data: input
			};
		};
		const __prune = (input) => {
			if ("object" === typeof input && null !== input) _po0(input);
			return input;
		};
		return (input) => {
			const result = __validate(input);
			if (result.success) __prune(input);
			return result;
		};
	})()(results),
	resultsToJSON: (results) => {
		return (() => {
			const _so0 = (input) => `{"launchAtStartup":${String(input.launchAtStartup)},"runInBackground":${String(input.runInBackground)},"isWallpaper":${String(input.isWallpaper)},"updateReady":${String(input.updateReady)},"stagedVersion":${null !== input.stagedVersion ? _jsonStringifyString(input.stagedVersion) : "null"}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomBoolean.mjs
var _randomBoolean = () => Math.random() < .5;
//#endregion
//#region .milkio/index.ts
var generated = {
	meta: void 0,
	context: void 0,
	rejectCode: void 0,
	events: void 0,
	typiaSchema: typia_schema_default,
	routeSchema: {
		"/": schema_default$16,
		"/window/close": schema_default$15,
		"/window/get-state": schema_default$14,
		"/window/maximize": schema_default$13,
		"/window/minimize": schema_default$12,
		"/wallpaper/cancel": schema_default$11,
		"/wallpaper/set": schema_default$10,
		"/local-file/delete-file": schema_default$9,
		"/local-file/exists": schema_default$8,
		"/local-file/list-directory": schema_default$7,
		"/local-file/pick-directory": schema_default$6,
		"/local-file/read-file": schema_default$5,
		"/local-file/write-file": schema_default$4,
		"/launcher/restart": schema_default$3,
		"/desktop-setting/get": schema_default$2,
		"/desktop-setting/set-launch-at-startup": {
			type: "action",
			types: void 0,
			module: () => import("./assets/set-launch-at-startup.action-D7cW5DL4.js"),
			validateParams: (params) => (() => {
				const _io0 = (input) => "boolean" === typeof input.launchAtStartup;
				const _po0 = (input) => {
					for (const key of Object.keys(input)) {
						if ("launchAtStartup" === key) continue;
						delete input[key];
					}
				};
				const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.launchAtStartup || _report(_exceptionable, {
					path: _path + ".launchAtStartup",
					expected: "boolean",
					value: input.launchAtStartup
				})].every((flag) => flag);
				const __is = (input) => "object" === typeof input && null !== input && _io0(input);
				let errors;
				let _report;
				const __validate = (input) => {
					if (false === __is(input)) {
						errors = [];
						_report = _validateReport(errors);
						((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
							path: _path + "",
							expected: "Params",
							value: input
						})) && _vo0(input, _path + "", true) || _report(true, {
							path: _path + "",
							expected: "Params",
							value: input
						}))(input, "$input", true);
						const success = 0 === errors.length;
						return success ? {
							success,
							data: input
						} : {
							success,
							errors,
							data: input
						};
					}
					return {
						success: true,
						data: input
					};
				};
				const __prune = (input) => {
					if ("object" === typeof input && null !== input) _po0(input);
					return input;
				};
				return (input) => {
					const result = __validate(input);
					if (result.success) __prune(input);
					return result;
				};
			})()(params),
			randomParams: () => (() => {
				const _ro0 = (_recursive = false, _depth = 0) => ({ launchAtStartup: (_generator?.boolean ?? _randomBoolean)() });
				let _generator;
				return (generator) => {
					_generator = generator;
					return _ro0();
				};
			})()(),
			validateResults: (results) => (() => {
				const _io0 = (input) => "boolean" === typeof input.launchAtStartup;
				const _po0 = (input) => {
					for (const key of Object.keys(input)) {
						if ("launchAtStartup" === key) continue;
						delete input[key];
					}
				};
				const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.launchAtStartup || _report(_exceptionable, {
					path: _path + ".launchAtStartup",
					expected: "boolean",
					value: input.launchAtStartup
				})].every((flag) => flag);
				const __is = (input) => "object" === typeof input && null !== input && _io0(input);
				let errors;
				let _report;
				const __validate = (input) => {
					if (false === __is(input)) {
						errors = [];
						_report = _validateReport(errors);
						((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
							path: _path + "",
							expected: "Result",
							value: input
						})) && _vo0(input, _path + "", true) || _report(true, {
							path: _path + "",
							expected: "Result",
							value: input
						}))(input, "$input", true);
						const success = 0 === errors.length;
						return success ? {
							success,
							data: input
						} : {
							success,
							errors,
							data: input
						};
					}
					return {
						success: true,
						data: input
					};
				};
				const __prune = (input) => {
					if ("object" === typeof input && null !== input) _po0(input);
					return input;
				};
				return (input) => {
					const result = __validate(input);
					if (result.success) __prune(input);
					return result;
				};
			})()(results),
			resultsToJSON: (results) => {
				return (() => {
					const _so0 = (input) => `{"launchAtStartup":${String(input.launchAtStartup)}}`;
					return (input) => _so0(input);
				})()(results);
			}
		},
		"/desktop-setting/set-run-in-background": {
			type: "action",
			types: void 0,
			module: () => import("./assets/set-run-in-background.action-BzGkZazI.js"),
			validateParams: (params) => (() => {
				const _io0 = (input) => "boolean" === typeof input.runInBackground;
				const _po0 = (input) => {
					for (const key of Object.keys(input)) {
						if ("runInBackground" === key) continue;
						delete input[key];
					}
				};
				const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.runInBackground || _report(_exceptionable, {
					path: _path + ".runInBackground",
					expected: "boolean",
					value: input.runInBackground
				})].every((flag) => flag);
				const __is = (input) => "object" === typeof input && null !== input && _io0(input);
				let errors;
				let _report;
				const __validate = (input) => {
					if (false === __is(input)) {
						errors = [];
						_report = _validateReport(errors);
						((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
							path: _path + "",
							expected: "Params",
							value: input
						})) && _vo0(input, _path + "", true) || _report(true, {
							path: _path + "",
							expected: "Params",
							value: input
						}))(input, "$input", true);
						const success = 0 === errors.length;
						return success ? {
							success,
							data: input
						} : {
							success,
							errors,
							data: input
						};
					}
					return {
						success: true,
						data: input
					};
				};
				const __prune = (input) => {
					if ("object" === typeof input && null !== input) _po0(input);
					return input;
				};
				return (input) => {
					const result = __validate(input);
					if (result.success) __prune(input);
					return result;
				};
			})()(params),
			randomParams: () => (() => {
				const _ro0 = (_recursive = false, _depth = 0) => ({ runInBackground: (_generator?.boolean ?? _randomBoolean)() });
				let _generator;
				return (generator) => {
					_generator = generator;
					return _ro0();
				};
			})()(),
			validateResults: (results) => (() => {
				const _io0 = (input) => "boolean" === typeof input.runInBackground;
				const _po0 = (input) => {
					for (const key of Object.keys(input)) {
						if ("runInBackground" === key) continue;
						delete input[key];
					}
				};
				const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.runInBackground || _report(_exceptionable, {
					path: _path + ".runInBackground",
					expected: "boolean",
					value: input.runInBackground
				})].every((flag) => flag);
				const __is = (input) => "object" === typeof input && null !== input && _io0(input);
				let errors;
				let _report;
				const __validate = (input) => {
					if (false === __is(input)) {
						errors = [];
						_report = _validateReport(errors);
						((input, _path, _exceptionable = true) => ("object" === typeof input && null !== input || _report(true, {
							path: _path + "",
							expected: "Result",
							value: input
						})) && _vo0(input, _path + "", true) || _report(true, {
							path: _path + "",
							expected: "Result",
							value: input
						}))(input, "$input", true);
						const success = 0 === errors.length;
						return success ? {
							success,
							data: input
						} : {
							success,
							errors,
							data: input
						};
					}
					return {
						success: true,
						data: input
					};
				};
				const __prune = (input) => {
					if ("object" === typeof input && null !== input) _po0(input);
					return input;
				};
				return (input) => {
					const result = __validate(input);
					if (result.success) __prune(input);
					return result;
				};
			})()(results),
			resultsToJSON: (results) => {
				return (() => {
					const _so0 = (input) => `{"runInBackground":${String(input.runInBackground)}}`;
					return (input) => _so0(input);
				})()(results);
			}
		}
	},
	rawSchema: {
		rawPaths: /* @__PURE__ */ new Set([]),
		routes: {}
	},
	handlerSchema: { loadHandlers: (world) => [] }
};
//#endregion
//#region app/bootstrap/electron-token/index.ts
/**
* Electron 通信令牌校验
* Electron 主进程启动时生成随机 token，通过 URL 参数传递给渲染进程。
* 渲染进程（embed Worker）每次请求必须携带 X-Electron-Token 头部，
* 如果不匹配则拒绝访问，防止其他网页嗅探到本地端口后直接调用 Electron 端点。
*/
var loadElectronToken = async (world) => {
	world.on("milkio:httpRequest", async (event) => {
		const token = event.http.request.headers.get("X-Electron-Token");
		if (token && timingSafeEqual(Buffer.from(token), Buffer.from(globalThis.electronToken))) return;
		throw event.reject("REQUEST_TIMEOUT", {
			message: "锟斤拷",
			timeout: -1
		});
	});
};
//#endregion
//#region index.ts
async function create(options) {
	await createElectronApp();
	return await createWorld(generated, configSchema, {
		...options,
		port: globalThis.electronPort ?? 9006,
		bootstraps: [loadElectronToken],
		http: { cors: {
			corsAllowCredentials: true,
			corsAllowMethods: [
				"OPTIONS",
				"GET",
				"POST"
			],
			corsAllowHeaders: [
				"Content-Type",
				"Authorization",
				"Milkio-Timestamp",
				"Milkio-Client-Version",
				"X-Electron-Token"
			],
			corsAllowOrigin: [
				"https://kecream.cn",
				"https://kecream.link",
				"https://app.kecream.cn",
				"https://app.kecream.link",
				"http://localhost:9003"
			],
			corsMaxAge: 7200
		} }
	});
}
//#endregion
//#region .milkio/run.ts
async function bootstrap() {
	const world = await create({
		port: 9006,
		develop: Boolean(env.COOKBOOK_BASE_URL),
		fetchEnv: (key) => env[key] ?? void 0
	});
	http.createServer((req, res) => {
		const bodyChunks = [];
		req.on("data", (chunk) => {
			bodyChunks.push(chunk);
		});
		req.on("end", () => {
			const method = req.method ?? "GET";
			const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : null;
			const bodyText = body ? Buffer.from(body).toString("utf-8") : "";
			const reqUrl = req.url ?? "/";
			const fullUrl = `${req.encrypted ? "https" : "http"}://${req.headers.host ?? "localhost"}${reqUrl}`;
			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) {
				if (value === void 0) continue;
				if (Array.isArray(value)) for (const v of value) headers.append(key, v);
				else headers.set(key, value);
			}
			const isStream = req.headers.accept?.startsWith("text/event-stream");
			const signal = isStream ? (() => {
				const ac = new AbortController();
				res.on("close", () => {
					ac.abort();
				});
				return ac.signal;
			})() : void 0;
			const request = new Request(fullUrl, {
				method,
				headers,
				body: method !== "GET" && method !== "HEAD" ? body : void 0,
				signal
			});
			const qIndex = reqUrl.indexOf("?");
			const pathname = qIndex >= 0 ? reqUrl.substring(0, qIndex) : reqUrl;
			request.__bodyText = bodyText;
			request.__pathname = pathname;
			request.__pathArray = pathname.length > 1 ? pathname.substring(1).split("/") : [];
			request.__origin = req.headers.origin ?? null;
			request.__isAction = !isStream;
			world.listener.fetch({
				request,
				env,
				envMode: env.VITE_MODE ?? "test",
				rawResponse: true
			}).then((response) => {
				if (response.__rawResponse) {
					res.writeHead(response.status, response.headers);
					const resBody = response.body;
					if (typeof resBody === "string") res.end(Buffer.from(resBody, "utf-8"));
					else if (resBody instanceof Uint8Array || Buffer.isBuffer(resBody)) res.end(resBody);
					else if (resBody instanceof ArrayBuffer) res.end(Buffer.from(resBody));
					else if (resBody instanceof Blob) {
						resBody.arrayBuffer().then((ab) => {
							res.end(Buffer.from(ab));
						});
						return;
					} else if (resBody != null) res.end(resBody);
					else res.end();
					return;
				}
				const resHeaders = {};
				for (const [key, value] of response.headers) if (key in resHeaders) {
					const existing = resHeaders[key];
					if (Array.isArray(existing)) existing.push(value);
					else resHeaders[key] = [existing, value];
				} else resHeaders[key] = value;
				res.writeHead(response.status, resHeaders);
				if (response.body != null && req.method !== "HEAD") {
					const reader = response.body.getReader();
					const pump = () => reader.read().then(({ done, value }) => {
						if (done) {
							res.end();
							return;
						}
						res.write(value);
						return pump();
					});
					pump();
				} else res.end();
			}).catch((error) => {
				console.error(error);
				if (!res.headersSent) res.writeHead(500);
				res.end("Internal Server Error");
			});
		});
	}).listen(world.listener.port);
}
bootstrap();
//#endregion
export { getStagedUpdate as a, __VERSION__ as c, getInstalledLauncherPath as i, getWebviewOrigin as n, requestLauncherRestart as o, getWebviewWindow as r, useElectronStates as s, LAUNCH_HIDDEN_ARG as t };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6WyJyYW5kb20iXSwic291cmNlcyI6WyIuLi9hcHAvX19WRVJTSU9OX18udHMiLCIuLi9hcHAvdXRpbHMvZWxlY3Ryb24tc3RhdGVzLnRzIiwiLi4vYXBwL3V0aWxzL2xhdW5jaGVyLnRzIiwiLi4vYXBwL3V0aWxzL2VsZWN0cm9uLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL21pbGtpby9pbmRleC5qcyIsIi4uLy5taWxraW8vY29uZmlnLXNjaGVtYS50cyIsIi4uLy5taWxraW8vdHlwaWEtc2NoZW1hLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeVN0cmluZy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydC5tanMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2luZGV4VGFjdGlvbi8yeWN0a29qNmMydm1kL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24vOTc2Y3h4cXVsaHdhL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uLzFpZnBpN3AxZTZtY3Qvc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbi8zZjg1b2Vjd2hndGpqL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24vNzBxc2JqZW1rcXIyL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uLzF4aXh4bnZ5d2V3bnIvc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24vZ2F1YXJoMzZ6N3V0L3NjaGVtYS50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX2RlY2ltYWwubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9faXNNdWx0aXBsZU9mLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbU11bHRpcGxlLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbUludGVnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nLm1qcyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uLzVqOXJybmM3Y2dwdi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24vMTltZ2lyczdzczQzZS9zY2hlbWEudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5QXJyYXkubWpzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24vMjFtZDF0Nzg0MGp0Mi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbi8xa29vcjNrdXJpZ2FsL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbi84dGN1ejd1MDg3M3kvc2NoZW1hLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tUGljay5tanMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uLzI0ZmZ5MjhodjRjaGwvc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb24vdzIxcGZscW8waHVxL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uLzJsbjRvaDM3dGlpNy9zY2hlbWEudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21Cb29sZWFuLm1qcyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uLzIyMjFjczBsamJ0dzgvc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24vdWM0ZXMyOTJ4NGFuL3NjaGVtYS50cyIsIi4uLy5taWxraW8vcm91dGUtc2NoZW1hLnRzIiwiLi4vLm1pbGtpby9yYXctc2NoZW1hLnRzIiwiLi4vLm1pbGtpby9oYW5kbGVyLXNjaGVtYS50cyIsIi4uLy5taWxraW8vaW5kZXgudHMiLCIuLi9hcHAvYm9vdHN0cmFwL2VsZWN0cm9uLXRva2VuL2luZGV4LnRzIiwiLi4vaW5kZXgudHMiLCIuLi8ubWlsa2lvL3J1bi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgX19WRVJTSU9OX18gPSAnMTAzOS4yLjM5Njg0Myc7XG4iLCJpbXBvcnQgeyB3cml0ZUZpbGUsIHJlYWRGaWxlLCBta2RpciB9IGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcblxuaW50ZXJmYWNlIEVsZWN0cm9uU3RhdGVzIHtcbiAgLyoqXG4gICAqIOeUqOaIt+aVsOaNrui3r+W+hFxuICAgKi9cbiAgdXNlckRhdGFQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDlhazlhbHot6/lvoRcbiAgICovXG4gIHB1YmxpY1BhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIHpwYXFmcmFuei5leGUg6Lev5b6EXG4gICAqL1xuICB6cGFxZnJhbnpFeGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiA3emEuZXhlIOi3r+W+hFxuICAgKi9cbiAgc2V2ZW5aaXBFeGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOWuveW6plxuICAgKi9cbiAgd2Vidmlld1dpbmRvd1dpZHRoOiBudW1iZXI7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOmrmOW6plxuICAgKi9cbiAgd2Vidmlld1dpbmRvd0hlaWdodDogbnVtYmVyO1xuICAvKipcbiAgICog572R6aG16KeG5Zu+56qX5Y+jOiBY5Z2Q5qCHXG4gICAqL1xuICB3ZWJ2aWV3V2luZG93WD86IG51bWJlcjtcbiAgLyoqXG4gICAqIOe9kemhteinhuWbvueql+WPozogWeWdkOagh1xuICAgKi9cbiAgd2Vidmlld1dpbmRvd1k/OiBudW1iZXI7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOaYr+WQpuacgOWkp+WMllxuICAgKi9cbiAgd2Vidmlld1dpbmRvd0lzTWF4aW1pemVkOiBib29sZWFuO1xuICAvKipcbiAgICog5byA5py65ZCv5YqoXG4gICAqL1xuICBsYXVuY2hBdFN0YXJ0dXA6IGJvb2xlYW47XG4gIC8qKlxuICAgKiDlkK/liqjlkI7lnKjlkI7lj7Dov5DooYzkuI3mmL7npLrkuLvliqjnlYzpnaJcbiAgICovXG4gIHJ1bkluQmFja2dyb3VuZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIOWjgee6uOWKn+iDveaYr+WQpuWQr+eUqO+8iOWQr+WKqOaXtuiHquWKqOaBouWkjeWjgee6uOeKtuaAge+8iVxuICAgKi9cbiAgd2FsbHBhcGVyRW5hYmxlZDogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiDorqHnrpfpu5jorqTnqpflj6PlsLrlr7jvvJrku6XlsY/luZXlj6/nlKjljLrmnIDnn63ovrnnmoQgODUlIOS9nOS4uumrmOW6pu+8jOaMiSAxNjo5IOiuoeeul+WuveW6pu+8jFxuICog5LiK6ZmQIDE5MjDDlzEwODDvvJvoi6XotoXlh7rlj6/nlKjljLrliJnnrYnmr5TnvKnlsI/ku6Xkv53or4Hnqpflj6PlrozmlbTlj6/op4HvvIzmnIDlkI7lnKjlj6/nlKjljLrlhoXlsYXkuK3jgIJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVEZWZhdWx0V2luZG93Qm91bmRzKHdvcmtBcmVhOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyB4PzogbnVtYmVyOyB5PzogbnVtYmVyIH0pOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyB4OiBudW1iZXI7IHk6IG51bWJlciB9IHtcbiAgY29uc3QgTUFYX1dJRFRIID0gMTkyMDtcbiAgY29uc3QgTUFYX0hFSUdIVCA9IDEwODA7XG5cbiAgY29uc3Qgc2hvcnRlc3RTaWRlID0gTWF0aC5taW4od29ya0FyZWEud2lkdGgsIHdvcmtBcmVhLmhlaWdodCk7XG4gIGNvbnN0IHRhcmdldERpbWVuc2lvbiA9IHNob3J0ZXN0U2lkZSAqIDAuODU7XG5cbiAgbGV0IHdpZHRoID0gdGFyZ2V0RGltZW5zaW9uICogKDE2IC8gOSk7XG4gIGxldCBoZWlnaHQgPSB0YXJnZXREaW1lbnNpb247XG5cbiAgaWYgKHdpZHRoID4gTUFYX1dJRFRIKSB3aWR0aCA9IE1BWF9XSURUSDtcbiAgaWYgKGhlaWdodCA+IE1BWF9IRUlHSFQpIGhlaWdodCA9IE1BWF9IRUlHSFQ7XG5cbiAgY29uc3QgZml0U2NhbGUgPSBNYXRoLm1pbigxLCB3b3JrQXJlYS53aWR0aCAvIHdpZHRoLCB3b3JrQXJlYS5oZWlnaHQgLyBoZWlnaHQpO1xuICB3aWR0aCA9IE1hdGguZmxvb3Iod2lkdGggKiBmaXRTY2FsZSk7XG4gIGhlaWdodCA9IE1hdGguZmxvb3IoaGVpZ2h0ICogZml0U2NhbGUpO1xuXG4gIC8vIOWKoOS4iuWPr+eUqOWMuuWOn+eCue+8muWJr+Wxj+WPr+eUqOWMuuS7jiAoeCx5KSDotbfnrpfvvIzlkKbliJnnqpflj6PkvJrooqvmkYbliLDkuLvlsY/lnZDmoIfns7vph4xcbiAgY29uc3QgeCA9IE1hdGguZmxvb3IoKHdvcmtBcmVhLndpZHRoIC0gd2lkdGgpIC8gMikgKyAod29ya0FyZWEueCA/PyAwKTtcbiAgY29uc3QgeSA9IE1hdGguZmxvb3IoKHdvcmtBcmVhLmhlaWdodCAtIGhlaWdodCkgLyAyKSArICh3b3JrQXJlYS55ID8/IDApO1xuXG4gIHJldHVybiB7IHdpZHRoLCBoZWlnaHQsIHgsIHkgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRWxlY3Ryb25TdGF0ZXMoKTogUHJvbWlzZTxFbGVjdHJvblN0YXRlc0luc3RhbmNlPiB7XG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBjcmVhdGVFbGVjdHJvblN0YXRlcyBjYWxsZWQsIGluaXRpYWxpemluZy4uLicpO1xuXG4gIGNvbnN0IHVzZXJEYXRhUGF0aCA9IGpvaW4oZWxlY3Ryb24uYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyksICdBcHBEYXRhJyk7XG4gIGNvbnN0IHB1YmxpY1BhdGggPSBqb2luKGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKSk7XG4gIGNvbnN0IHpwYXFmcmFuekV4ZVBhdGggPSBqb2luKHB1YmxpY1BhdGgsICd6cGFxZnJhbnouZXhlJyk7XG4gIGNvbnN0IHNldmVuWmlwRXhlUGF0aCA9IGpvaW4ocHVibGljUGF0aCwgJzd6YS5leGUnKTtcbiAgY29uc3QgZmlsZVBhdGggPSBqb2luKHVzZXJEYXRhUGF0aCwgJ3N0YXRlcy5qc29uJyk7XG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBGaWxlIHBhdGggcmVzb2x2ZWQ6JywgZmlsZVBhdGgpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgbWtkaXIoam9pbihmaWxlUGF0aCwgJy4uJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9IGNhdGNoIHt9XG5cbiAgLy8g5bCd6K+V5LuO5paH5Lu25Yqg6L295bey5L+d5a2Y55qE54q25oCBXG4gIGxldCBsb2FkZWRGcm9tRmlsZSA9IGZhbHNlO1xuICBsZXQgY3VycmVudFN0YXRlczogRWxlY3Ryb25TdGF0ZXMgPSB7XG4gICAgd2Vidmlld1dpbmRvd1dpZHRoOiAxNTM0LFxuICAgIHdlYnZpZXdXaW5kb3dIZWlnaHQ6IDg2NCxcbiAgICB3ZWJ2aWV3V2luZG93SXNNYXhpbWl6ZWQ6IGZhbHNlLFxuICAgIC8vIOWuieijheeJiOmmluasoeWQr+WKqOm7mOiupOW8gOWQr+W8gOacuuWQr+WKqO+8jOeUqOaIt+aJi+WKqOWFs+mXreWQjueUsSBzdGF0ZXMuanNvbiDmjIHkuYXljJbkuLogZmFsc2XvvJtcbiAgICAvLyDlvIDlj5HkuI7mtYvor5Xlrp7kvovvvIjpnZ7miZPljIXvvInkuI3lhpnlhaXns7vnu5/oh6rlkK/pobnvvIzpgb/lhY3msaHmn5PlvIDlj5HmnLrnmoTlkK/liqjliJfooahcbiAgICBsYXVuY2hBdFN0YXJ0dXA6IGVsZWN0cm9uLmFwcC5pc1BhY2thZ2VkLFxuICAgIHJ1bkluQmFja2dyb3VuZDogZmFsc2UsXG4gICAgd2FsbHBhcGVyRW5hYmxlZDogZmFsc2UsXG4gICAgdXNlckRhdGFQYXRoLFxuICAgIHB1YmxpY1BhdGgsXG4gICAgenBhcWZyYW56RXhlUGF0aCxcbiAgICBzZXZlblppcEV4ZVBhdGgsXG4gIH07XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEZpbGUoZmlsZVBhdGgsICd1dGYtOCcpO1xuICAgIGN1cnJlbnRTdGF0ZXMgPSBKU09OLnBhcnNlKGNvbnRlbnQpIGFzIEVsZWN0cm9uU3RhdGVzO1xuICAgIGxvYWRlZEZyb21GaWxlID0gdHJ1ZTtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gTG9hZGVkIHN0YXRlcyBmcm9tIGZpbGU6JywgSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlcykpO1xuICB9IGNhdGNoIHtcbiAgICAvLyDmlofku7bkuI3lrZjlnKjvvIzpppbmrKHliJ3lp4vljJbvvJrmjInlsY/luZXlj6/nlKjljLrorqHnrpfpu5jorqTlsLrlr7jvvIzpu5jorqTku6Xnqpflj6PljJblkK/liqhcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gU3RhdGVzIGZpbGUgbm90IGZvdW5kLCBjYWxjdWxhdGluZyBkZWZhdWx0IHdpbmRvdyBzaXplLi4uJyk7XG5cbiAgICAvLyDnrYnlvoUgRWxlY3Ryb24gYXBwIOWHhuWkh+Wwsee7quWQjuaJjeiDveiOt+WPluWxj+W5leWwuuWvuFxuICAgIGF3YWl0IGVsZWN0cm9uLmFwcC53aGVuUmVhZHkoKTtcbiAgICBjb25zdCBwcmltYXJ5RGlzcGxheSA9IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpO1xuICAgIGNvbnN0IHdvcmtBcmVhID0gcHJpbWFyeURpc3BsYXkud29ya0FyZWFTaXplO1xuICAgIGNvbnNvbGUubG9nKGBbZWxlY3Ryb24tc3RhdGVzLnRzXSBTY3JlZW4gd29yayBhcmVhOiAke3dvcmtBcmVhLndpZHRofXgke3dvcmtBcmVhLmhlaWdodH1gKTtcblxuICAgIGNvbnN0IGRlZmF1bHRCb3VuZHMgPSBjb21wdXRlRGVmYXVsdFdpbmRvd0JvdW5kcyh3b3JrQXJlYSk7XG4gICAgY3VycmVudFN0YXRlcy53ZWJ2aWV3V2luZG93V2lkdGggPSBkZWZhdWx0Qm91bmRzLndpZHRoO1xuICAgIGN1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd0hlaWdodCA9IGRlZmF1bHRCb3VuZHMuaGVpZ2h0O1xuICAgIGN1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd1ggPSBkZWZhdWx0Qm91bmRzLng7XG4gICAgY3VycmVudFN0YXRlcy53ZWJ2aWV3V2luZG93WSA9IGRlZmF1bHRCb3VuZHMueTtcbiAgICBjdXJyZW50U3RhdGVzLndlYnZpZXdXaW5kb3dJc01heGltaXplZCA9IGZhbHNlO1xuXG4gICAgY29uc29sZS5sb2coYFtlbGVjdHJvbi1zdGF0ZXMudHNdIEZpbmFsIHdpbmRvdyBzaXplOiAke2N1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd1dpZHRofXgke2N1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd0hlaWdodH0sIHBvc2l0aW9uOiAke2N1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd1h9LCR7Y3VycmVudFN0YXRlcy53ZWJ2aWV3V2luZG93WX0sIG1heGltaXplZDogJHtjdXJyZW50U3RhdGVzLndlYnZpZXdXaW5kb3dJc01heGltaXplZH1gKTtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gQ3JlYXRpbmcgc3RhdGVzIGZpbGUgd2l0aCBjYWxjdWxhdGVkIHZhbHVlcy4uLicpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlcywgbnVsbCwgMiksICd1dGYtOCcpO1xuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTdGF0ZXMgZmlsZSBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpO1xuICB9XG5cbiAgY3VycmVudFN0YXRlcy51c2VyRGF0YVBhdGggPSB1c2VyRGF0YVBhdGg7XG4gIGN1cnJlbnRTdGF0ZXMucHVibGljUGF0aCA9IHB1YmxpY1BhdGg7XG4gIGN1cnJlbnRTdGF0ZXMuenBhcWZyYW56RXhlUGF0aCA9IHpwYXFmcmFuekV4ZVBhdGg7XG4gIGN1cnJlbnRTdGF0ZXMuc2V2ZW5aaXBFeGVQYXRoID0gc2V2ZW5aaXBFeGVQYXRoO1xuICBjdXJyZW50U3RhdGVzLmxhdW5jaEF0U3RhcnR1cCA9IGN1cnJlbnRTdGF0ZXMubGF1bmNoQXRTdGFydHVwID8/IGZhbHNlO1xuICBjdXJyZW50U3RhdGVzLnJ1bkluQmFja2dyb3VuZCA9IGN1cnJlbnRTdGF0ZXMucnVuSW5CYWNrZ3JvdW5kID8/IGZhbHNlO1xuICBjdXJyZW50U3RhdGVzLndhbGxwYXBlckVuYWJsZWQgPSBjdXJyZW50U3RhdGVzLndhbGxwYXBlckVuYWJsZWQgPz8gZmFsc2U7XG5cbiAgbGV0IHNhdmVUaW1lb3V0OiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IHNhdmVUb0ZpbGUgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKHNhdmVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2F2ZVRpbWVvdXQpO1xuICAgICAgc2F2ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gU2F2aW5nIHN0YXRlcyB0byBmaWxlOicsIEpTT04uc3RyaW5naWZ5KGN1cnJlbnRTdGF0ZXMpKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGN1cnJlbnRTdGF0ZXMsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gU3RhdGVzIHNhdmVkIHN1Y2Nlc3NmdWxseScpO1xuICB9O1xuXG4gIGNvbnN0IGRlYm91bmNlZFNhdmUgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKHNhdmVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2F2ZVRpbWVvdXQpO1xuICAgICAgc2F2ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gRGVib3VuY2VkIHNhdmUgc2NoZWR1bGVkLCAzMDBtcyBkZWxheS4uLicpO1xuICAgIHNhdmVUaW1lb3V0ID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzYXZlVG9GaWxlKCk7XG4gICAgfSwgMzAwKTtcbiAgfTtcblxuICBjb25zdCBzeW5jU2F2ZSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoc2F2ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dChzYXZlVGltZW91dCk7XG4gICAgICBzYXZlVGltZW91dCA9IG51bGw7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTeW5jIHNhdmluZyBzdGF0ZXMgdG8gZmlsZSAocHJvY2VzcyBleGl0KTonLCBKU09OLnN0cmluZ2lmeShjdXJyZW50U3RhdGVzKSk7XG4gICAgd3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlcywgbnVsbCwgMiksICd1dGYtOCcpO1xuICB9O1xuXG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTZXR0aW5nIHVwIHByb2Nlc3MgZXhpdCBoYW5kbGVycy4uLicpO1xuICBjb25zdCBjbGVhbnVwRm5zOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBvbkV4aXQgPSAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gUHJvY2VzcyBleGl0IHNpZ25hbCByZWNlaXZlZCcpO1xuICAgICAgc3luY1NhdmUoKTtcbiAgICB9O1xuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCBvbkV4aXQpO1xuICAgIGNsZWFudXBGbnMucHVzaCgoKSA9PiBwcm9jZXNzLm9mZignZXhpdCcsIG9uRXhpdCkpO1xuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIGNvbnN0IG9uU2lnbFRlcm0gPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBXaW5kb3dzIFNJR1RFUk0gcmVjZWl2ZWQnKTtcbiAgICAgICAgc3luY1NhdmUoKTtcbiAgICAgIH07XG4gICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgb25TaWdsVGVybSk7XG4gICAgICBjbGVhbnVwRm5zLnB1c2goKCkgPT4gcHJvY2Vzcy5vZmYoJ1NJR1RFUk0nLCBvblNpZ2xUZXJtKSk7XG5cbiAgICAgIGNvbnN0IG9uU2lnbEludCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIFdpbmRvd3MgU0lHSU5UIHJlY2VpdmVkJyk7XG4gICAgICAgIHN5bmNTYXZlKCk7XG4gICAgICB9O1xuICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgb25TaWdsSW50KTtcbiAgICAgIGNsZWFudXBGbnMucHVzaCgoKSA9PiBwcm9jZXNzLm9mZignU0lHSU5UJywgb25TaWdsSW50KSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiBlbGVjdHJvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZWxlY3Ryb24uYXBwKSB7XG4gICAgLy8g5aaC5p6c5piv5LuO5paH5Lu25Yqg6L2955qE54q25oCB77yM6ZyA6KaB562J5b6FIGFwcCByZWFkee+8m+WmguaenOaYr+mmluasoeWIneWni+WMlu+8jOS4iumdouW3sue7j+etieW+hei/h+S6hlxuICAgIGlmIChsb2FkZWRGcm9tRmlsZSkge1xuICAgICAgYXdhaXQgZWxlY3Ryb24uYXBwLndoZW5SZWFkeSgpO1xuICAgIH1cbiAgICBjb25zdCBvbldpbGxRdWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIEVsZWN0cm9uIHdpbGwtcXVpdCBldmVudCByZWNlaXZlZCcpO1xuICAgIH07XG4gICAgZWxlY3Ryb24uYXBwLm9uKCd3aWxsLXF1aXQnLCBvbldpbGxRdWl0KTtcbiAgICBjbGVhbnVwRm5zLnB1c2goKCkgPT4gZWxlY3Ryb24uYXBwLm9mZignd2lsbC1xdWl0Jywgb25XaWxsUXVpdCkpO1xuXG4gICAgY29uc3Qgb25CZWZvcmVRdWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIEVsZWN0cm9uIGJlZm9yZS1xdWl0IGV2ZW50IHJlY2VpdmVkJyk7XG4gICAgICBzeW5jU2F2ZSgpO1xuICAgIH07XG4gICAgZWxlY3Ryb24uYXBwLm9uKCdiZWZvcmUtcXVpdCcsIG9uQmVmb3JlUXVpdCk7XG4gICAgY2xlYW51cEZucy5wdXNoKCgpID0+IGVsZWN0cm9uLmFwcC5vZmYoJ2JlZm9yZS1xdWl0Jywgb25CZWZvcmVRdWl0KSk7XG4gIH1cblxuICBjb25zdCBzZXQgPSAocGFydGlhbDogUGFydGlhbDxFbGVjdHJvblN0YXRlcz4pOiB2b2lkID0+IHtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gc2V0IGNhbGxlZCB3aXRoOicsIEpTT04uc3RyaW5naWZ5KHBhcnRpYWwpKTtcbiAgICBjdXJyZW50U3RhdGVzID0geyAuLi5jdXJyZW50U3RhdGVzLCAuLi5wYXJ0aWFsIH07XG4gICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIHN0YXRlcyBhZnRlciBtZXJnZTonLCBKU09OLnN0cmluZ2lmeShjdXJyZW50U3RhdGVzKSk7XG4gICAgZGVib3VuY2VkU2F2ZSgpO1xuICB9O1xuXG4gIGNvbnN0IGluc3RhbmNlOiBFbGVjdHJvblN0YXRlc0luc3RhbmNlID0ge1xuICAgIGdldCBzdGF0ZXMoKSB7XG4gICAgICByZXR1cm4gY3VycmVudFN0YXRlcztcbiAgICB9LFxuICAgIHNldCxcbiAgfTtcblxuICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gY3JlYXRlRWxlY3Ryb25TdGF0ZXMgY29tcGxldGVkLCBpbnN0YW5jZSBjcmVhdGVkJyk7XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5sZXQgaW5zdGFuY2VQcm9taXNlOiBQcm9taXNlPEVsZWN0cm9uU3RhdGVzSW5zdGFuY2U+IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VFbGVjdHJvblN0YXRlcygpOiBQcm9taXNlPEVsZWN0cm9uU3RhdGVzSW5zdGFuY2U+IHtcbiAgaWYgKCFpbnN0YW5jZVByb21pc2UpIHtcbiAgICBpbnN0YW5jZVByb21pc2UgPSBjcmVhdGVFbGVjdHJvblN0YXRlcygpO1xuICB9XG4gIHJldHVybiBpbnN0YW5jZVByb21pc2U7XG59XG5cbmludGVyZmFjZSBFbGVjdHJvblN0YXRlc0luc3RhbmNlIHtcbiAgc3RhdGVzOiBFbGVjdHJvblN0YXRlcztcbiAgc2V0OiAocGFydGlhbDogUGFydGlhbDxFbGVjdHJvblN0YXRlcz4pID0+IHZvaWQ7XG59XG4iLCJpbXBvcnQgeyBleGVjRmlsZVN5bmMsIHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XHJcbmltcG9ydCB7IGNyZWF0ZUhhc2ggfSBmcm9tICdjcnlwdG8nO1xyXG5pbXBvcnQgeyBleGlzdHNTeW5jLCByZWFkZGlyU3luYyB9IGZyb20gJ2ZzJztcclxuaW1wb3J0IHsgbWtkaXIsIHJlYWRGaWxlLCByZW5hbWUsIHJtLCB3cml0ZUZpbGUgfSBmcm9tICdmcy9wcm9taXNlcyc7XHJcbmltcG9ydCB7IGNyZWF0ZVJlcXVpcmUgfSBmcm9tICdtb2R1bGUnO1xyXG5pbXBvcnQgeyBqb2luIH0gZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IF9fVkVSU0lPTl9fIH0gZnJvbSAnLi4vX19WRVJTSU9OX18nO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFQUF9VU0VSX01PREVMX0lEID0gJ2xpbmsua2VjcmVhbS5hcHAnO1xyXG5leHBvcnQgY29uc3QgRk9DVVNfT05MWV9BUkcgPSAnLS1mb2N1cy1vbmx5JztcclxuZXhwb3J0IGNvbnN0IExBVU5DSEVSX0VYRV9OQU1FID0gJ3JhYmJpeC1sYXVuY2hlci5leGUnO1xyXG5jb25zdCBMQVVOQ0hFUl9QSURfUFJFRklYID0gJy0tbGF1bmNoZXItcGlkPSc7XHJcbi8vIOmDqOe9suS6i+Wunu+8muS4u+iKgueCue+8iEVkZ2VPbmXvvInlj6rmiZjnrqEgbGF0ZXN0Lmpzb24g5LiO5YiG5Y2377yMbGF1bmNoZXIvdW5pbnN0YWxsZXIg5LiA5b6L5LuO5aSH55So6IqC54K55LiL6L29XHJcbmV4cG9ydCBjb25zdCBMQVVOQ0hFUl9ET1dOTE9BRF9VUkwgPSAnaHR0cHM6Ly9zdG9yYWdlLTAwMDAua2VjcmVhbS5jbi9yYWJiaXgvcmFiYml4LWxhdW5jaGVyLmV4ZSc7XHJcbmV4cG9ydCBjb25zdCBMQVRFU1RfSlNPTl9CQVNFX1VSTFMgPSBbJ2h0dHBzOi8vemgtY24uZWxlY3Ryb24uYXBwLmtlY3JlYW0uY24nLCAnaHR0cHM6Ly9zdG9yYWdlLTAwMDAua2VjcmVhbS5jbi9yYWJiaXgnXTtcclxuY29uc3QgVVBHUkFERV9SRVFVRVNUX0ZJTEVOQU1FID0gJy51cGdyYWRlLXJlcXVlc3QnO1xyXG5jb25zdCBSRVNUQVJUX1JFUVVFU1RfRklMRU5BTUUgPSAnLnJlc3RhcnQtcmVxdWVzdCc7XHJcbmNvbnN0IExBVU5DSEVSX01BUktFUl9GSUxFTkFNRSA9ICcubGF1bmNoZXInO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFJhYmJpeERpcigpOiBzdHJpbmcge1xyXG4gIGlmIChwcm9jZXNzLmVudi5SQUJCSVhfRElSX09WRVJSSURFKSByZXR1cm4gcHJvY2Vzcy5lbnYuUkFCQklYX0RJUl9PVkVSUklERTtcclxuICBjb25zdCB1c2VybmFtZSA9IHByb2Nlc3MuZW52LlVTRVJOQU1FIHx8IHByb2Nlc3MuZW52LlVTRVI7XHJcbiAgaWYgKCF1c2VybmFtZSkgcmV0dXJuICcnO1xyXG4gIHJldHVybiBqb2luKCdDOicsICdVc2VycycsIHVzZXJuYW1lLCAnQXBwRGF0YScsICdMb2NhbCcsICdyYWJiaXgnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTGF1bmNoZXJQaWQoYXJndjogc3RyaW5nW10pOiBudW1iZXIgfCBudWxsIHtcclxuICBmb3IgKGNvbnN0IGFyZyBvZiBhcmd2KSB7XHJcbiAgICBpZiAoIWFyZy5zdGFydHNXaXRoKExBVU5DSEVSX1BJRF9QUkVGSVgpKSBjb250aW51ZTtcclxuICAgIGNvbnN0IHBpZCA9IE51bWJlci5wYXJzZUludChhcmcuc2xpY2UoTEFVTkNIRVJfUElEX1BSRUZJWC5sZW5ndGgpLCAxMCk7XHJcbiAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcihwaWQpICYmIHBpZCA+IDApIHJldHVybiBwaWQ7XHJcbiAgfVxyXG4gIHJldHVybiBudWxsO1xyXG59XHJcblxyXG4vLyDnmbvlvZXpobnlv4XpobvmjIflkJHluLjpqbvlkK/liqjlmajogIzpnZ7niYjmnKznm67lvZXph4znmoTmnKzkvZPvvJvlkK/liqjlmajkuI3lrZjlnKjml7bov5Tlm54gbnVsbO+8jOiwg+eUqOaWueWbnumAgOm7mOiupOihjOS4ulxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5zdGFsbGVkTGF1bmNoZXJQYXRoKCk6IHN0cmluZyB8IG51bGwge1xyXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtICE9PSAnd2luMzInIHx8ICFlbGVjdHJvbi5hcHAuaXNQYWNrYWdlZCkgcmV0dXJuIG51bGw7XHJcbiAgY29uc3QgcmFiYml4RGlyID0gZ2V0UmFiYml4RGlyKCk7XHJcbiAgaWYgKCFyYWJiaXhEaXIpIHJldHVybiBudWxsO1xyXG4gIGNvbnN0IGxhdW5jaGVyUGF0aCA9IGpvaW4ocmFiYml4RGlyLCBMQVVOQ0hFUl9FWEVfTkFNRSk7XHJcbiAgcmV0dXJuIGV4aXN0c1N5bmMobGF1bmNoZXJQYXRoKSA/IGxhdW5jaGVyUGF0aCA6IG51bGw7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRSZXBhaXJMYXVuY2hlcihhcmd2OiBzdHJpbmdbXSk6IGJvb2xlYW4ge1xyXG4gIGlmIChhcmd2LmluY2x1ZGVzKEZPQ1VTX09OTFlfQVJHKSkgcmV0dXJuIGZhbHNlO1xyXG4gIHJldHVybiBwYXJzZUxhdW5jaGVyUGlkKGFyZ3YpID09PSBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNMb2NhbExhdW5jaGVyQ3VycmVudChtYXJrZXI6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQsIGRpc2tIYXNoOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XHJcbiAgaWYgKCFtYXJrZXIgfHwgIWRpc2tIYXNoKSByZXR1cm4gZmFsc2U7XHJcbiAgcmV0dXJuIG1hcmtlci50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gZGlza0hhc2gudHJpbSgpLnRvTG93ZXJDYXNlKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBwaWNrRGlyZWN0TGF1bmNoTWVzc2FnZShsb2NhbGU6IHN0cmluZyk6IHsgdGl0bGU6IHN0cmluZzsgbWVzc2FnZTogc3RyaW5nIH0ge1xyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSBsb2NhbGUudG9Mb3dlckNhc2UoKTtcclxuICBjb25zdCBjaGluZXNlID0gbm9ybWFsaXplZCA9PT0gJ3poJyB8fCBub3JtYWxpemVkID09PSAnemgtY24nIHx8IG5vcm1hbGl6ZWQgPT09ICd6aC1zZycgfHwgbm9ybWFsaXplZC5zdGFydHNXaXRoKCd6aC1oYW5zJyk7XHJcbiAgaWYgKGNoaW5lc2UpIHJldHVybiB7IHRpdGxlOiAn5YWU566xJywgbWVzc2FnZTogJ+mcgOimgeS9v+eUqOWQr+WKqOWZqOi/m+ihjOWQr+WKqCAocmFiYml4LWxhdW5jaGVyLmV4ZSknIH07XHJcbiAgcmV0dXJuIHsgdGl0bGU6ICdSYWJiaXgnLCBtZXNzYWdlOiAnUGxlYXNlIHN0YXJ0IHRoZSBhcHBsaWNhdGlvbiB1c2luZyB0aGUgbGF1bmNoZXIgKHJhYmJpeC1sYXVuY2hlci5leGUpJyB9O1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzaGEyNTZGaWxlKHBhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgcmVhZEZpbGUocGF0aCk7XHJcbiAgICByZXR1cm4gY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKGNvbnRlbnQpLmRpZ2VzdCgnaGV4Jyk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICByZXR1cm4gbnVsbDtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNwYXduTGF1bmNoZXJEZXRhY2hlZChsYXVuY2hlclBhdGg6IHN0cmluZyk6IHZvaWQge1xyXG4gIGNvbnN0IGNoaWxkID0gc3Bhd24obGF1bmNoZXJQYXRoLCBbXSwgeyBkZXRhY2hlZDogdHJ1ZSwgd2luZG93c0hpZGU6IHRydWUsIHN0ZGlvOiAnaWdub3JlJyB9KTtcclxuICBjaGlsZC51bnJlZigpO1xyXG59XHJcblxyXG4vLyDkv67lpI3ot6/lvoTvvJrmnKrluKYgLS1sYXVuY2hlci1waWQg5ZCv5Yqo5pe277yM56Gu5L+d5pys5Zyw5ZCv5Yqo5Zmo5Li65pyA5paw5ZCO55Sx5a6D6YeN5paw5ouJ6LW35pys5L2T44CCXHJcbi8vIOi/lOWbniB0cnVlIOihqOekuuW3siBzcGF3biDlkK/liqjlmajvvIjosIPnlKjmlrnlupTnq4vljbPpgIDlh7rvvInvvJtmYWxzZSDooajnpLrml6Dms5Xnoa7orqTmiJbkv67lpI3lpLHotKXvvIjosIPnlKjmlrnotbDlhZzlupXlvLnnqpfvvInjgIJcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlcGFpckxhdW5jaGVyKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGNvbnN0IHJhYmJpeERpciA9IGdldFJhYmJpeERpcigpO1xyXG4gIGlmICghcmFiYml4RGlyKSByZXR1cm4gZmFsc2U7XHJcbiAgY29uc3QgbGF1bmNoZXJQYXRoID0gam9pbihyYWJiaXhEaXIsIExBVU5DSEVSX0VYRV9OQU1FKTtcclxuICBjb25zdCBtYXJrZXJQYXRoID0gam9pbihyYWJiaXhEaXIsIExBVU5DSEVSX01BUktFUl9GSUxFTkFNRSk7XHJcblxyXG4gIGNvbnN0IGRpc2tIYXNoID0gYXdhaXQgc2hhMjU2RmlsZShsYXVuY2hlclBhdGgpO1xyXG4gIGxldCBtYXJrZXI6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIHRyeSB7XHJcbiAgICBtYXJrZXIgPSBhd2FpdCByZWFkRmlsZShtYXJrZXJQYXRoLCAndXRmLTgnKTtcclxuICB9IGNhdGNoIHt9XHJcblxyXG4gIC8vIOacrOWcsOagh+iusOWRveS4re+8muemu+e6v+S5n+WPr+ebtOaOpeeUqOWQr+WKqOWZqOaLiei1t1xyXG4gIGlmIChkaXNrSGFzaCAmJiBpc0xvY2FsTGF1bmNoZXJDdXJyZW50KG1hcmtlciwgZGlza0hhc2gpKSB7XHJcbiAgICBzcGF3bkxhdW5jaGVyRGV0YWNoZWQobGF1bmNoZXJQYXRoKTtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgbGV0IHJlbW90ZUhhc2g6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIGxldCBmZXRjaGVkQW55ID0gZmFsc2U7XHJcbiAgZm9yIChjb25zdCBiYXNlVXJsIG9mIExBVEVTVF9KU09OX0JBU0VfVVJMUykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgJHtiYXNlVXJsfS9sYXRlc3QuanNvbmAsIHsgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDgwMDApIH0pO1xyXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSBjb250aW51ZTtcclxuICAgICAgY29uc3QganNvbiA9IChhd2FpdCByZXNwb25zZS5qc29uKCkpIGFzIHsgbGF1bmNoZXJIYXNoPzogdW5rbm93biB9O1xyXG4gICAgICBmZXRjaGVkQW55ID0gdHJ1ZTtcclxuICAgICAgaWYgKHR5cGVvZiBqc29uLmxhdW5jaGVySGFzaCA9PT0gJ3N0cmluZycgJiYganNvbi5sYXVuY2hlckhhc2gubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHJlbW90ZUhhc2ggPSBqc29uLmxhdW5jaGVySGFzaDtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG4gIH1cclxuICBpZiAoIWZldGNoZWRBbnkpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgaWYgKHJlbW90ZUhhc2ggJiYgZGlza0hhc2ggJiYgcmVtb3RlSGFzaC50b0xvd2VyQ2FzZSgpID09PSBkaXNrSGFzaC50b0xvd2VyQ2FzZSgpKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBhd2FpdCB3cml0ZUZpbGUobWFya2VyUGF0aCwgZGlza0hhc2gsICd1dGYtOCcpO1xyXG4gICAgfSBjYXRjaCB7fVxyXG4gICAgc3Bhd25MYXVuY2hlckRldGFjaGVkKGxhdW5jaGVyUGF0aCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBhd2FpdCBta2RpcihyYWJiaXhEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChMQVVOQ0hFUl9ET1dOTE9BRF9VUkwsIHsgc2lnbmFsOiBBYm9ydFNpZ25hbC50aW1lb3V0KDYwMDAwKSB9KTtcclxuICAgIGlmICghcmVzcG9uc2Uub2spIHJldHVybiBmYWxzZTtcclxuICAgIGNvbnN0IGRhdGEgPSBCdWZmZXIuZnJvbShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKTtcclxuICAgIGNvbnN0IG5ld0hhc2ggPSBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoZGF0YSkuZGlnZXN0KCdoZXgnKTtcclxuICAgIGlmIChyZW1vdGVIYXNoKSB7XHJcbiAgICAgIGlmIChuZXdIYXNoLnRvTG93ZXJDYXNlKCkgIT09IHJlbW90ZUhhc2gudG9Mb3dlckNhc2UoKSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8g5pen54mIIGxhdGVzdC5qc29uIOWPr+iDveayoeaciSBsYXVuY2hlckhhc2gg5a2X5q6177yM5q2k5pe25LuF5L6d6LWWIEhUVFBTIOS/neaKpOS8oOi+k1xyXG4gICAgICBjb25zb2xlLndhcm4oJ1tsYXVuY2hlcl0gbGF0ZXN0Lmpzb24gbGFja3MgbGF1bmNoZXJIYXNoLCBza2lwcGluZyBoYXNoIHZlcmlmaWNhdGlvbicpO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdGVtcFBhdGggPSBqb2luKHJhYmJpeERpciwgJ3JhYmJpeC1sYXVuY2hlci5leGUuZG93bmxvYWQnKTtcclxuICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wUGF0aCwgZGF0YSk7XHJcbiAgICBpZiAoZXhpc3RzU3luYyhsYXVuY2hlclBhdGgpKSB7XHJcbiAgICAgIC8vIOato+WcqOi/kOihjOeahCBleGUg5Y+v5Lul6YeN5ZG95ZCN5L2G5LiN6IO96KaG55uW77yM5YWI5pS55ZCN6K6p5L2N77ybLm9sZCDmrovnlZnnlLHlkK/liqjlmajkuIvmrKHlkK/liqjmuIXnkIZcclxuICAgICAgYXdhaXQgcmVuYW1lKGxhdW5jaGVyUGF0aCwgYCR7bGF1bmNoZXJQYXRofS5vbGRgKS5jYXRjaCgoKSA9PiB7fSk7XHJcbiAgICB9XHJcbiAgICBhd2FpdCByZW5hbWUodGVtcFBhdGgsIGxhdW5jaGVyUGF0aCk7XHJcbiAgICBhd2FpdCB3cml0ZUZpbGUobWFya2VyUGF0aCwgbmV3SGFzaCwgJ3V0Zi04JykuY2F0Y2goKCkgPT4ge30pO1xyXG4gICAgc3Bhd25MYXVuY2hlckRldGFjaGVkKGxhdW5jaGVyUGF0aCk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0S29mZmlXYXRjaChwaWQ6IG51bWJlcik6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBpbXBvcnQoJ2tvZmZpJyk7XHJcbiAgICBjb25zdCBrb2ZmaSA9IChtb2QgYXMgeyBkZWZhdWx0PzogdHlwZW9mIGltcG9ydCgna29mZmknKSB9KS5kZWZhdWx0ID8/IG1vZDtcclxuICAgIGNvbnN0IGtlcm5lbDMyID0ga29mZmkubG9hZCgna2VybmVsMzIuZGxsJyk7XHJcbiAgICBjb25zdCBvcGVuUHJvY2VzcyA9IGtlcm5lbDMyLmZ1bmMoJ3ZvaWQgKk9wZW5Qcm9jZXNzKHVpbnQzMiBhY2Nlc3MsIGJvb2wgaW5oZXJpdCwgdWludDMyIHBpZCknKTtcclxuICAgIGNvbnN0IFNZTkNIUk9OSVpFID0gMHgwMDEwMDAwMDtcclxuICAgIGNvbnN0IGhhbmRsZSA9IG9wZW5Qcm9jZXNzKFNZTkNIUk9OSVpFLCBmYWxzZSwgcGlkKTtcclxuICAgIGlmICghaGFuZGxlKSB7XHJcbiAgICAgIC8vIOWPpeafhOWPluS4jeWIsOivtOaYjuWQr+WKqOWZqOW3sumAgOWHuu+8jOacrOS9k+W/hemhu+eri+WNs+maj+S5i+mAgOWHulxyXG4gICAgICBlbGVjdHJvbi5hcHAuZXhpdCgwKTtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBjb25zdCBrb2ZmaUVudHJ5ID0gY3JlYXRlUmVxdWlyZShpbXBvcnQubWV0YS51cmwpLnJlc29sdmUoJ2tvZmZpJyk7XHJcblxyXG4gICAgLy8g562J5b6F5b+F6aG75YiG5om56L+b6KGM77yaRWxlY3Ryb24g6YCA5Ye65pe25LyaIGpvaW4g5pys57q/56iL77yM6Iul57q/56iL5YGc5ZyoIFdhaXRGb3JTaW5nbGVPYmplY3Qg55qE5peg6ZmQ562J5b6F6YeM77yMXHJcbiAgICAvLyBqb2luIOawuOS4jei/lOWbnu+8jOS4u+i/m+eoi+S8muW4puedgOWFqOmDqOWtkOi/m+eoi+S4gOi1t+a7nueVmeOAgnN0b3BGbGFnIOWcqOS4u+i/m+eoi+mAgOWHuuaXtue9ruS9je+8jOiuqeacrOi9rueri+WNs+aUtuaJi+OAglxyXG4gICAgY29uc3Qgd2FpdFNsaWNlTXMgPSAyMDA7XHJcbiAgICBjb25zdCBzdG9wRmxhZyA9IG5ldyBJbnQzMkFycmF5KG5ldyBTaGFyZWRBcnJheUJ1ZmZlcig0KSk7XHJcbiAgICBwcm9jZXNzLm9uY2UoJ2V4aXQnLCAoKSA9PiB7XHJcbiAgICAgIEF0b21pY3Muc3RvcmUoc3RvcEZsYWcsIDAsIDEpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgeyBXb3JrZXIgfSA9IGF3YWl0IGltcG9ydCgnd29ya2VyX3RocmVhZHMnKTtcclxuICAgIGNvbnN0IHdvcmtlciA9IG5ldyBXb3JrZXIoXHJcbiAgICAgIGBcclxuICAgICAgY29uc3QgeyBwYXJlbnRQb3J0LCB3b3JrZXJEYXRhIH0gPSByZXF1aXJlKCd3b3JrZXJfdGhyZWFkcycpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGtvZmZpID0gcmVxdWlyZSh3b3JrZXJEYXRhLmtvZmZpRW50cnkpO1xyXG4gICAgICAgIGNvbnN0IGtlcm5lbDMyID0ga29mZmkubG9hZCgna2VybmVsMzIuZGxsJyk7XHJcbiAgICAgICAgY29uc3Qgb3BlblByb2Nlc3MgPSBrZXJuZWwzMi5mdW5jKCd2b2lkICpPcGVuUHJvY2Vzcyh1aW50MzIgYWNjZXNzLCBib29sIGluaGVyaXQsIHVpbnQzMiBwaWQpJyk7XHJcbiAgICAgICAgY29uc3Qgd2FpdEZvclNpbmdsZU9iamVjdCA9IGtlcm5lbDMyLmZ1bmMoJ3VpbnQzMiBXYWl0Rm9yU2luZ2xlT2JqZWN0KHZvaWQgKmhhbmRsZSwgdWludDMyIG1zKScpO1xyXG4gICAgICAgIGNvbnN0IHN0b3BGbGFnID0gbmV3IEludDMyQXJyYXkod29ya2VyRGF0YS5zdG9wRmxhZ0J1ZmZlcik7XHJcbiAgICAgICAgY29uc3QgV0FJVF9USU1FT1VUID0gMHgxMDI7XHJcbiAgICAgICAgY29uc3QgaGFuZGxlID0gb3BlblByb2Nlc3MoMHgwMDEwMDAwMCwgZmFsc2UsIHdvcmtlckRhdGEucGlkKTtcclxuICAgICAgICBpZiAoIWhhbmRsZSkge1xyXG4gICAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSgnZ29uZScpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBmb3IgKDs7KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHdhaXRGb3JTaW5nbGVPYmplY3QoaGFuZGxlLCB3b3JrZXJEYXRhLndhaXRTbGljZU1zKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCAhPT0gV0FJVF9USU1FT1VUKSB7XHJcbiAgICAgICAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSgnZ29uZScpO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChBdG9taWNzLmxvYWQoc3RvcEZsYWcsIDApID09PSAxKSBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgcGFyZW50UG9ydC5wb3N0TWVzc2FnZSgnZXJyb3InKTtcclxuICAgICAgfVxyXG4gICAgICBgLFxyXG4gICAgICB7IGV2YWw6IHRydWUsIHdvcmtlckRhdGE6IHsgcGlkLCBrb2ZmaUVudHJ5LCBzdG9wRmxhZ0J1ZmZlcjogc3RvcEZsYWcuYnVmZmVyLCB3YWl0U2xpY2VNcyB9IH0sXHJcbiAgICApO1xyXG4gICAgd29ya2VyLnVucmVmKCk7XHJcbiAgICB3b3JrZXIub24oJ21lc3NhZ2UnLCAobWVzc2FnZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgIGlmIChtZXNzYWdlID09PSAnZ29uZScpIGVsZWN0cm9uLmFwcC5leGl0KDApO1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0YXJ0RmFsbGJhY2tXYXRjaChwaWQ6IG51bWJlcik6IHZvaWQge1xyXG4gIGxldCBtaXNzaW5nQ291bnQgPSAwO1xyXG4gIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgbGV0IGFsaXZlID0gdHJ1ZTtcclxuICAgIHRyeSB7XHJcbiAgICAgIHByb2Nlc3Mua2lsbChwaWQsIDApO1xyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIGFsaXZlID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBpZiAoIWFsaXZlKSB7XHJcbiAgICAgIC8vIOi/nue7reS4pOasoee8uuWkseaJjemAgOWHuu+8jOinhOmBv+WNleasoeaOoua1i+W8guW4uOWvvOiHtOivr+adgFxyXG4gICAgICBtaXNzaW5nQ291bnQgKz0gMTtcclxuICAgICAgaWYgKG1pc3NpbmdDb3VudCA+PSAyKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XHJcbiAgICAgICAgZWxlY3Ryb24uYXBwLmV4aXQoMCk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbWlzc2luZ0NvdW50ID0gMDtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNGaWxlU3luYygndGFza2xpc3QnLCBbJy9GSScsIGBQSUQgZXEgJHtwaWR9YCwgJy9GTycsICdDU1YnLCAnL05IJ10sIHsgZW5jb2Rpbmc6ICd1dGYtOCcsIHdpbmRvd3NIaWRlOiB0cnVlIH0pO1xyXG4gICAgICBjb25zdCBmaXJzdExpbmUgPSBvdXRwdXQudHJpbSgpLnNwbGl0KCdcXG4nKVswXSA/PyAnJztcclxuICAgICAgY29uc3QgbWF0Y2ggPSBmaXJzdExpbmUubWF0Y2goL15cIihbXlwiXSspXCIvKTtcclxuICAgICAgLy8g5ZCN5a2X5Y+W5LiN5Yiw6KeG5Li65a2Y5rS777yb5Y+W5Yiw5LiU5LiN5piv5ZCv5Yqo5Zmo6K+05piOIFBJRCDlt7LooqvlpI3nlKhcclxuICAgICAgaWYgKG1hdGNoPy5bMV0gJiYgbWF0Y2hbMV0udG9Mb3dlckNhc2UoKSAhPT0gTEFVTkNIRVJfRVhFX05BTUUpIHtcclxuICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcclxuICAgICAgICBlbGVjdHJvbi5hcHAuZXhpdCgwKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCB7fVxyXG4gIH0sIDEwMDAwKTtcclxuICB0aW1lci51bnJlZigpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gd2F0Y2hMYXVuY2hlclByb2Nlc3MocGlkOiBudW1iZXIpOiB2b2lkIHtcclxuICB2b2lkIHN0YXJ0S29mZmlXYXRjaChwaWQpLnRoZW4oKHN0YXJ0ZWQpID0+IHtcclxuICAgIGlmICghc3RhcnRlZCkgc3RhcnRGYWxsYmFja1dhdGNoKHBpZCk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB3YXRjaFVwZ3JhZGVSZXF1ZXN0KCk6IHZvaWQge1xyXG4gIGNvbnN0IHJhYmJpeERpciA9IGdldFJhYmJpeERpcigpO1xyXG4gIGlmICghcmFiYml4RGlyKSByZXR1cm47XHJcbiAgY29uc3QgbWFya2VyUGF0aCA9IGpvaW4ocmFiYml4RGlyLCBVUEdSQURFX1JFUVVFU1RfRklMRU5BTUUpO1xyXG4gIGNvbnN0IHRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgdm9pZCAoYXN5bmMgKCkgPT4ge1xyXG4gICAgICBsZXQgdGFyZ2V0VmVyc2lvbiA9ICcnO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKGF3YWl0IHJlYWRGaWxlKG1hcmtlclBhdGgsICd1dGYtOCcpKSBhcyB7IHZlcnNpb24/OiB1bmtub3duIH07XHJcbiAgICAgICAgaWYgKHR5cGVvZiBjb250ZW50LnZlcnNpb24gPT09ICdzdHJpbmcnKSB0YXJnZXRWZXJzaW9uID0gY29udGVudC52ZXJzaW9uO1xyXG4gICAgICB9IGNhdGNoIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgLy8g55uu5qCH54mI5pys5LiO6Ieq6Lqr5LiA6Ie05pe25oyJ5q6L55WZ5aSE55CG77yM5LiN6YCA5Ye6XHJcbiAgICAgIGlmICghdGFyZ2V0VmVyc2lvbiB8fCB0YXJnZXRWZXJzaW9uID09PSBfX1ZFUlNJT05fXykgcmV0dXJuO1xyXG4gICAgICBhd2FpdCBybShtYXJrZXJQYXRoLCB7IGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHt9KTtcclxuICAgICAgZWxlY3Ryb24uYXBwLnF1aXQoKTtcclxuICAgIH0pKCk7XHJcbiAgfSwgODAwMCk7XHJcbiAgdGltZXIudW5yZWYoKTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgU3RhZ2VkVXBkYXRlID0ge1xyXG4gIHJlYWR5OiBib29sZWFuO1xyXG4gIHZlcnNpb246IHN0cmluZyB8IG51bGw7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBsaXN0VmVyc2lvbkRpck5hbWVzKGRpcjogc3RyaW5nKTogc3RyaW5nW10ge1xyXG4gIGxldCBuYW1lczogc3RyaW5nW10gPSBbXTtcclxuICB0cnkge1xyXG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiByZWFkZGlyU3luYyhkaXIsIHsgd2l0aEZpbGVUeXBlczogdHJ1ZSB9KSkge1xyXG4gICAgICBpZiAoIWVudHJ5Lm5hbWUuc3RhcnRzV2l0aCgndicpIHx8ICFlbnRyeS5pc0RpcmVjdG9yeSgpKSBjb250aW51ZTtcclxuICAgICAgY29uc3QgdmVyc2lvbiA9IGVudHJ5Lm5hbWUuc2xpY2UoMSk7XHJcbiAgICAgIC8vIOWFgeiuuCBzZW12ZXIg55qE6aKE5Y+R5biDL+aehOW7uuWQjue8gO+8iOWmgiAxLjIuMy1iZXRhLjHvvInvvIzkuI4ga2VybmVsIOeahCBzZW12ZXIg6Kej5p6Q5Y+j5b6E5a+56b2QXHJcbiAgICAgIGlmICghL15cXGQrKFxcLlxcZCspKihbLStdWzAtOUEtWmEtei4tXSspPyQvLnRlc3QodmVyc2lvbikpIGNvbnRpbnVlO1xyXG4gICAgICBuYW1lcy5wdXNoKHZlcnNpb24pO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIFtdO1xyXG4gIH1cclxuICByZXR1cm4gbmFtZXM7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBhcmVOdW1lcmljVmVyc2lvbnMoYTogc3RyaW5nLCBiOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIC8vIOWPquavlOi+g+S4u+eJiOacrOaute+8m+mihOWPkeW4gy/mnoTlu7rlkI7nvIDkuI3lj4LkuI7mr5TovoPvvIjlvZPliY3lj5HluIPlj7fkuLrnuq/mlbDlrZfvvIzkuI3kvJrop6blj5Hor6XliIbmlK/vvIlcclxuICBjb25zdCBsZWZ0ID0gYS5yZXBsYWNlKC9bLStdLiokLywgJycpLnNwbGl0KCcuJyk7XHJcbiAgY29uc3QgcmlnaHQgPSBiLnJlcGxhY2UoL1stK10uKiQvLCAnJykuc3BsaXQoJy4nKTtcclxuICBjb25zdCBsZW5ndGggPSBNYXRoLm1heChsZWZ0Lmxlbmd0aCwgcmlnaHQubGVuZ3RoKTtcclxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICBjb25zdCBsID0gTnVtYmVyLnBhcnNlSW50KGxlZnRbaV0gPz8gJzAnLCAxMCk7XHJcbiAgICBjb25zdCByID0gTnVtYmVyLnBhcnNlSW50KHJpZ2h0W2ldID8/ICcwJywgMTApO1xyXG4gICAgaWYgKGwgPiByKSByZXR1cm4gMTtcclxuICAgIGlmIChsIDwgcikgcmV0dXJuIC0xO1xyXG4gIH1cclxuICByZXR1cm4gMDtcclxufVxyXG5cclxuLy8gYWN0aXZlIOeJiOacrO+8mueJiOacrOebruW9leS4reWPt+acgOWkp+OAgeS4lOebruW9leWGheWQqyByYWJiaXguZXhlIOeahOmCo+S4qlxyXG5mdW5jdGlvbiBmaW5kQWN0aXZlVmVyc2lvbihyYWJiaXhEaXI6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xyXG4gIGxldCBiZXN0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcclxuICBmb3IgKGNvbnN0IHZlcnNpb24gb2YgbGlzdFZlcnNpb25EaXJOYW1lcyhyYWJiaXhEaXIpKSB7XHJcbiAgICBpZiAoIWV4aXN0c1N5bmMoam9pbihyYWJiaXhEaXIsIGB2JHt2ZXJzaW9ufWAsICdyYWJiaXguZXhlJykpKSBjb250aW51ZTtcclxuICAgIGlmICghYmVzdCB8fCBjb21wYXJlTnVtZXJpY1ZlcnNpb25zKHZlcnNpb24sIGJlc3QpID4gMCkgYmVzdCA9IHZlcnNpb247XHJcbiAgfVxyXG4gIHJldHVybiBiZXN0O1xyXG59XHJcblxyXG4vLyDlkK/liqjlmajlkI7lj7DpooTkuIvovb3lrozmiJDlkI7kvJrlnKggLnN0YWdpbmcvdjx4PiDokL3kuIvlt7Lop6PljovnmoTniYjmnKzvvJtcclxuLy8g6L+Z6YeM5om+5Ye644CM5bey5bCx57uq5LiU6auY5LqOIGFjdGl2ZeOAjeeahOacgOmrmOeJiOacrO+8jOS+m+WJjeerr+WxleekuuOAjOmHjeWQr+abtOaWsOOAjVxyXG5leHBvcnQgZnVuY3Rpb24gZmluZFN0YWdlZFVwZGF0ZSgpOiBTdGFnZWRVcGRhdGUge1xyXG4gIGNvbnN0IHJhYmJpeERpciA9IGdldFJhYmJpeERpcigpO1xyXG4gIGlmICghcmFiYml4RGlyKSByZXR1cm4geyByZWFkeTogZmFsc2UsIHZlcnNpb246IG51bGwgfTtcclxuICBjb25zdCBhY3RpdmUgPSBmaW5kQWN0aXZlVmVyc2lvbihyYWJiaXhEaXIpO1xyXG4gIGNvbnN0IHN0YWdpbmcgPSBqb2luKHJhYmJpeERpciwgJy5zdGFnaW5nJyk7XHJcbiAgbGV0IGJlc3Q6IHN0cmluZyB8IG51bGwgPSBudWxsO1xyXG4gIGZvciAoY29uc3QgdmVyc2lvbiBvZiBsaXN0VmVyc2lvbkRpck5hbWVzKHN0YWdpbmcpKSB7XHJcbiAgICBpZiAoIWV4aXN0c1N5bmMoam9pbihzdGFnaW5nLCBgdiR7dmVyc2lvbn1gLCAncmFiYml4LmV4ZScpKSkgY29udGludWU7XHJcbiAgICBpZiAoYWN0aXZlICYmIGNvbXBhcmVOdW1lcmljVmVyc2lvbnModmVyc2lvbiwgYWN0aXZlKSA8PSAwKSBjb250aW51ZTtcclxuICAgIGlmICghYmVzdCB8fCBjb21wYXJlTnVtZXJpY1ZlcnNpb25zKHZlcnNpb24sIGJlc3QpID4gMCkgYmVzdCA9IHZlcnNpb247XHJcbiAgfVxyXG4gIHJldHVybiB7IHJlYWR5OiBiZXN0ICE9PSBudWxsLCB2ZXJzaW9uOiBiZXN0IH07XHJcbn1cclxuXHJcbmxldCBzdGFnZWRVcGRhdGVDYWNoZTogU3RhZ2VkVXBkYXRlID0geyByZWFkeTogZmFsc2UsIHZlcnNpb246IG51bGwgfTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGFnZWRVcGRhdGUoKTogU3RhZ2VkVXBkYXRlIHtcclxuICByZXR1cm4gc3RhZ2VkVXBkYXRlQ2FjaGU7XHJcbn1cclxuXHJcbi8vIOavj+WIhumSn+mHjeaJq+S4gOasoeWQr+WKqOWZqOebruW9le+8muWQjuWPsOmihOS4i+i9veWujOaIkOS8muWcqCAuc3RhZ2luZyDkuIvmlrDlop7niYjmnKznm67lvZVcclxuZXhwb3J0IGZ1bmN0aW9uIHN0YXJ0U3RhZ2VkVXBkYXRlUG9sbGluZygpOiB2b2lkIHtcclxuICBjb25zdCByZWZyZXNoID0gKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgc3RhZ2VkVXBkYXRlQ2FjaGUgPSBmaW5kU3RhZ2VkVXBkYXRlKCk7XHJcbiAgICB9IGNhdGNoIHt9XHJcbiAgfTtcclxuICByZWZyZXNoKCk7XHJcbiAgY29uc3QgdGltZXIgPSBzZXRJbnRlcnZhbChyZWZyZXNoLCA2MF8wMDApO1xyXG4gIHRpbWVyLnVucmVmKCk7XHJcbn1cclxuXHJcbi8vIOWGmSAucmVzdGFydC1yZXF1ZXN0IOivt+axguWQr+WKqOWZqOeri+WNs+WIh+WIsOW3suaaguWtmOeJiOacrOW5tumHjeWQr+acrOS9k+OAglxyXG4vLyDlhYjlhpnkuLTml7bmlofku7blho0gcmVuYW1l77yM6YG/5YWN5ZCv5Yqo5Zmo6K+75Yiw56m65paH5Lu2XHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1ZXN0TGF1bmNoZXJSZXN0YXJ0KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xyXG4gIGNvbnN0IHJhYmJpeERpciA9IGdldFJhYmJpeERpcigpO1xyXG4gIGlmICghcmFiYml4RGlyKSByZXR1cm4gZmFsc2U7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHRtcCA9IGpvaW4ocmFiYml4RGlyLCBgJHtSRVNUQVJUX1JFUVVFU1RfRklMRU5BTUV9LnRtcGApO1xyXG4gICAgYXdhaXQgd3JpdGVGaWxlKHRtcCwgSlNPTi5zdHJpbmdpZnkoeyByZXF1ZXN0ZWRBdDogRGF0ZS5ub3coKSB9KSwgJ3V0Zi04Jyk7XHJcbiAgICBhd2FpdCByZW5hbWUodG1wLCBqb2luKHJhYmJpeERpciwgUkVTVEFSVF9SRVFVRVNUX0ZJTEVOQU1FKSk7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxuICB9IGNhdGNoIHtcclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcbn1cclxuXHJcbi8vIOmAmui/h+eql+WPo+WxnuaAp+aKiuS7u+WKoeagj+WbuuWumumhuemHjeaMh+WIsOWQr+WKqOWZqO+8jOS9v+i3qOeJiOacrOWbuuWumuS7jeeEtuacieaViOOAglxyXG4vLyDku7vkvZXkuIDmraXlpLHotKXpg73pnZnpu5jpmY3nuqfvvJrlsZ7mgKfnvLrlpLHlj6rmmK/lm7rlrprpobnkvZPpqozpmY3nuqfvvIzkuI3lvbHlk43lkK/liqjjgIJcclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFwcGx5V2luZG93UmVsYXVuY2hQcm9wZXJ0aWVzKHdpbmRvdzogeyBnZXROYXRpdmVXaW5kb3dIYW5kbGUoKTogQnVmZmVyIH0pOiBQcm9taXNlPHZvaWQ+IHtcclxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSAhPT0gJ3dpbjMyJykgcmV0dXJuO1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBtb2QgPSBhd2FpdCBpbXBvcnQoJ2tvZmZpJyk7XHJcbiAgICBjb25zdCBrb2ZmaSA9IChtb2QgYXMgeyBkZWZhdWx0PzogdHlwZW9mIGltcG9ydCgna29mZmknKSB9KS5kZWZhdWx0ID8/IG1vZDtcclxuICAgIGNvbnN0IHB0clNpemUgPSBwcm9jZXNzLmFyY2ggPT09ICd4NjQnID8gOCA6IDQ7XHJcblxyXG4gICAgY29uc3Qgc2hlbGwzMiA9IGtvZmZpLmxvYWQoJ3NoZWxsMzIuZGxsJyk7XHJcbiAgICBjb25zdCBnZXRTdG9yZSA9IHNoZWxsMzIuZnVuYygnbG9uZyBfX3N0ZGNhbGwgU0hHZXRQcm9wZXJ0eVN0b3JlRm9yV2luZG93KHVpbnRwdHJfdCBod25kLCB2b2lkICpyaWlkLCB2b2lkICoqcHB2KScpO1xyXG5cclxuICAgIC8vIElJRF9JUHJvcGVydHlTdG9yZSB7ODg2RDhFRUItOENGMi00NDQ2LThEMDItQ0RCQTFEQkRDRjk5fSDnmoTlhoXlrZjlrZfoioLluo9cclxuICAgIGNvbnN0IGlpZCA9IEJ1ZmZlci5mcm9tKFsweGViLCAweDhlLCAweDZkLCAweDg4LCAweGYyLCAweDhjLCAweDQ2LCAweDQ0LCAweDhkLCAweDAyLCAweGNkLCAweGJhLCAweDFkLCAweGJkLCAweGNmLCAweDk5XSk7XHJcbiAgICBjb25zdCBwcHYgPSBCdWZmZXIuYWxsb2MocHRyU2l6ZSk7XHJcbiAgICBjb25zdCBod25kQnVmID0gd2luZG93LmdldE5hdGl2ZVdpbmRvd0hhbmRsZSgpO1xyXG4gICAgY29uc3QgaHduZCA9IGh3bmRCdWYubGVuZ3RoIDw9IDQgPyBod25kQnVmLnJlYWRVSW50MzJMRSgwKSA6IGh3bmRCdWYucmVhZEJpZ1VJbnQ2NExFKDApO1xyXG4gICAgaWYgKGdldFN0b3JlKGh3bmQsIGlpZCwgcHB2KSAhPT0gMCkgcmV0dXJuO1xyXG5cclxuICAgIGNvbnN0IHN0b3JlUHRyID0ga29mZmkuZGVjb2RlKHBwdiwgMCwgJ3ZvaWQgKicpIGFzIHVua25vd247XHJcbiAgICBpZiAoIXN0b3JlUHRyKSByZXR1cm47XHJcbiAgICBjb25zdCB2dGFibGUgPSBrb2ZmaS5kZWNvZGUoc3RvcmVQdHIsIDAsICd2b2lkIConKSBhcyB1bmtub3duO1xyXG4gICAgaWYgKCF2dGFibGUpIHJldHVybjtcclxuICAgIC8vIElQcm9wZXJ0eVN0b3JlIOiZmuihqO+8mlF1ZXJ5SW50ZXJmYWNlL0FkZFJlZi9SZWxlYXNlL0dldENvdW50L0dldEF0L0dldFZhbHVlL1NldFZhbHVlL0NvbW1pdFxyXG4gICAgY29uc3QgcmVsZWFzZVB0ciA9IGtvZmZpLmRlY29kZSh2dGFibGUsIDIgKiBwdHJTaXplLCAndm9pZCAqJykgYXMgdW5rbm93bjtcclxuICAgIGNvbnN0IHNldFZhbHVlUHRyID0ga29mZmkuZGVjb2RlKHZ0YWJsZSwgNiAqIHB0clNpemUsICd2b2lkIConKSBhcyB1bmtub3duO1xyXG4gICAgY29uc3QgY29tbWl0UHRyID0ga29mZmkuZGVjb2RlKHZ0YWJsZSwgNyAqIHB0clNpemUsICd2b2lkIConKSBhcyB1bmtub3duO1xyXG4gICAgY29uc3QgcmVsZWFzZVByb3RvID0ga29mZmkucHJvdG8oJ19fc3RkY2FsbCcsICdJUHJvcGVydHlTdG9yZV9SZWxlYXNlJywgJ3VpbnQzMicsIFsndm9pZCAqJ10pO1xyXG4gICAgY29uc3Qgc2V0VmFsdWVQcm90byA9IGtvZmZpLnByb3RvKCdfX3N0ZGNhbGwnLCAnSVByb3BlcnR5U3RvcmVfU2V0VmFsdWUnLCAnbG9uZycsIFsndm9pZCAqJywgJ3ZvaWQgKicsICd2b2lkIConXSk7XHJcbiAgICBjb25zdCBjb21taXRQcm90byA9IGtvZmZpLnByb3RvKCdfX3N0ZGNhbGwnLCAnSVByb3BlcnR5U3RvcmVfQ29tbWl0JywgJ2xvbmcnLCBbJ3ZvaWQgKiddKTtcclxuXHJcbiAgICBjb25zdCBHVUlEID0ga29mZmkuc3RydWN0KCdXaW5kb3dQcm9wR1VJRCcsIHsgZGF0YTE6ICd1aW50MzInLCBkYXRhMjogJ3VpbnQxNicsIGRhdGEzOiAndWludDE2JywgZGF0YTQ6IGtvZmZpLmFycmF5KCd1aW50OCcsIDgpIH0pO1xyXG4gICAgY29uc3QgUFJPUEVSVFlLRVkgPSBrb2ZmaS5zdHJ1Y3QoJ1dpbmRvd1Byb3BLRVknLCB7IGZtdGlkOiBHVUlELCBwaWQ6ICd1aW50MzInIH0pO1xyXG4gICAgLy8gVlRfTFBXU1RSIOWeiyBQUk9QVkFSSUFOVO+8mjQg5LiqIHVpbnQxNiDlkI7ntKfot58gOCDlrZfoioLlr7npvZDnmoTlrr3lrZfnrKbkuLLmjIfpkohcclxuICAgIGNvbnN0IFBST1BWQVJJQU5UID0ga29mZmkuc3RydWN0KCdXaW5kb3dQcm9wVkFSSUFOVCcsIHsgdnQ6ICd1aW50MTYnLCB3UmVzZXJ2ZWQxOiAndWludDE2Jywgd1Jlc2VydmVkMjogJ3VpbnQxNicsIHdSZXNlcnZlZDM6ICd1aW50MTYnLCBwd3N6VmFsOiAnc3RyMTYnIH0pO1xyXG4gICAgY29uc3QgVlRfTFBXU1RSID0gMzE7XHJcbiAgICAvLyBQS0VZIOeahCBmbXRpZCB7OUY0QzI4NTUtOUY3OS00QjM5LUE4RDAtRTFENDJERTFENUYzfVxyXG4gICAgY29uc3QgZm10aWQgPSB7IGRhdGExOiAweDlmNGMyODU1LCBkYXRhMjogMHg5Zjc5LCBkYXRhMzogMHg0YjM5LCBkYXRhNDogWzB4YTgsIDB4ZDAsIDB4ZTEsIDB4ZDQsIDB4MmQsIDB4ZTEsIDB4ZDUsIDB4ZjNdIH07XHJcblxyXG4gICAgY29uc3QgcmFiYml4RGlyID0gZ2V0UmFiYml4RGlyKCk7XHJcbiAgICBjb25zdCBsYXVuY2hlclBhdGggPSBqb2luKHJhYmJpeERpciwgTEFVTkNIRVJfRVhFX05BTUUpO1xyXG4gICAgY29uc3QgaWNvblBhdGggPSBqb2luKHJhYmJpeERpciwgJ2Zhdmljb24uaWNvJyk7XHJcbiAgICBjb25zdCBsb2NhbGUgPSBlbGVjdHJvbi5hcHAuZ2V0TG9jYWxlKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIGNvbnN0IGFwcE5hbWUgPSBsb2NhbGUgPT09ICd6aCcgfHwgbG9jYWxlID09PSAnemgtY24nIHx8IGxvY2FsZSA9PT0gJ3poLXNnJyB8fCBsb2NhbGUuc3RhcnRzV2l0aCgnemgtaGFucycpID8gJ+WFlOeusScgOiAnUmFiYml4JztcclxuXHJcbiAgICBjb25zdCBlbnRyaWVzOiBBcnJheTxbbnVtYmVyLCBzdHJpbmddPiA9IFtcclxuICAgICAgWzUsIEFQUF9VU0VSX01PREVMX0lEXSxcclxuICAgICAgWzIsIGBcIiR7bGF1bmNoZXJQYXRofVwiYF0sXHJcbiAgICAgIFs0LCBhcHBOYW1lXSxcclxuICAgICAgWzMsIGAke2ljb25QYXRofSwwYF0sXHJcbiAgICBdO1xyXG4gICAgZm9yIChjb25zdCBbcGlkLCB2YWx1ZV0gb2YgZW50cmllcykge1xyXG4gICAgICBjb25zdCBrZXkgPSBrb2ZmaS5hbGxvYyhQUk9QRVJUWUtFWSwgMSk7XHJcbiAgICAgIGtvZmZpLmVuY29kZShrZXksIFBST1BFUlRZS0VZLCB7IGZtdGlkLCBwaWQgfSk7XHJcbiAgICAgIGNvbnN0IHB2ID0ga29mZmkuYWxsb2MoUFJPUFZBUklBTlQsIDEpO1xyXG4gICAgICBrb2ZmaS5lbmNvZGUocHYsIFBST1BWQVJJQU5ULCB7IHZ0OiBWVF9MUFdTVFIsIHdSZXNlcnZlZDE6IDAsIHdSZXNlcnZlZDI6IDAsIHdSZXNlcnZlZDM6IDAsIHB3c3pWYWw6IHZhbHVlIH0pO1xyXG4gICAgICBrb2ZmaS5jYWxsKHNldFZhbHVlUHRyLCBzZXRWYWx1ZVByb3RvLCBzdG9yZVB0ciwga2V5LCBwdik7XHJcbiAgICAgIGtvZmZpLmZyZWUoa2V5KTtcclxuICAgICAga29mZmkuZnJlZShwdik7XHJcbiAgICB9XHJcbiAgICBrb2ZmaS5jYWxsKGNvbW1pdFB0ciwgY29tbWl0UHJvdG8sIHN0b3JlUHRyKTtcclxuICAgIGtvZmZpLmNhbGwocmVsZWFzZVB0ciwgcmVsZWFzZVByb3RvLCBzdG9yZVB0cik7XHJcbiAgfSBjYXRjaCB7fVxyXG59XHJcbiIsImltcG9ydCB0eXBlICogYXMgX2VsZWN0cm9uIGZyb20gJ2VsZWN0cm9uJztcclxuaW1wb3J0IHsgbWtkaXIsIGFjY2VzcyB9IGZyb20gJ2ZzL3Byb21pc2VzJztcclxuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBfX1ZFUlNJT05fXyB9IGZyb20gJy4uL19fVkVSU0lPTl9fJztcclxuaW1wb3J0IHsgdXNlRWxlY3Ryb25TdGF0ZXMsIGNvbXB1dGVEZWZhdWx0V2luZG93Qm91bmRzIH0gZnJvbSAnLi9lbGVjdHJvbi1zdGF0ZXMnO1xyXG5pbXBvcnQgeyBBUFBfVVNFUl9NT0RFTF9JRCwgRk9DVVNfT05MWV9BUkcsIGFwcGx5V2luZG93UmVsYXVuY2hQcm9wZXJ0aWVzLCBnZXRJbnN0YWxsZWRMYXVuY2hlclBhdGgsIHBhcnNlTGF1bmNoZXJQaWQsIHBpY2tEaXJlY3RMYXVuY2hNZXNzYWdlLCByZXBhaXJMYXVuY2hlciwgc3RhcnRTdGFnZWRVcGRhdGVQb2xsaW5nLCB3YXRjaExhdW5jaGVyUHJvY2Vzcywgd2F0Y2hVcGdyYWRlUmVxdWVzdCB9IGZyb20gJy4vbGF1bmNoZXIudHMnO1xyXG5cclxubGV0IG1haW5XaW5kb3c6IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCA9IG51bGw7XHJcbmxldCB0cmF5OiBfZWxlY3Ryb24uVHJheSB8IG51bGwgPSBudWxsO1xyXG5cclxuY29uc3QgTUlOX1dJTkRPV19XSURUSCA9IDEyODA7XHJcbmNvbnN0IE1JTl9XSU5ET1dfSEVJR0hUID0gNjQwO1xyXG5jb25zdCBBVVRPX0ZVTExTQ1JFRU5fVEhSRVNIT0xEX1dJRFRIID0gMTUzNjtcclxuY29uc3QgQVVUT19GVUxMU0NSRUVOX1RIUkVTSE9MRF9IRUlHSFQgPSA3Njg7XHJcblxyXG4vLyDnmbvlvZXpobnlnKhcIuW8gOacuuWQr+WKqCArIOe9ruS6juWQjuWPsFwi5pe25pC65bim55qE5ZG95Luk6KGM5Y+C5pWw77yM55So5LqO5Yy65YiG55m75b2V6Ieq5ZCv5LiO5omL5Yqo5ZCv5YqoXHJcbmV4cG9ydCBjb25zdCBMQVVOQ0hfSElEREVOX0FSRyA9ICctLWhpZGRlbic7XHJcblxyXG4vLyDlj6rmnInnmbvlvZXpobnpmpDol4/lkK/liqjml7bnqpflj6PmiY3kuI3mmL7npLrvvJvnlKjmiLfmiYvliqjlkK/liqjkuIDlvovmmL7npLrnqpflj6PjgIJcclxuLy8gV2luZG93cy9MaW51eCDnmoTnmbvlvZXpobnpgJrov4flj4LmlbDmoIforrDvvJttYWNPUyDnmoTnmbvlvZXpobnnu48gb3BlbkFzSGlkZGVuIOmakOiXj+WQr+WKqO+8jOS4jee7j+i/h+WRveS7pOihjOWPguaVsOOAglxyXG5mdW5jdGlvbiBpc0xhdW5jaGVkSGlkZGVuKHJ1bkluQmFja2dyb3VuZDogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG4gIGlmIChwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoTEFVTkNIX0hJRERFTl9BUkcpKSByZXR1cm4gdHJ1ZTtcclxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHJldHVybiBydW5JbkJhY2tncm91bmQgJiYgZWxlY3Ryb24uYXBwLmdldExvZ2luSXRlbVNldHRpbmdzKCkud2FzT3BlbmVkQXRMb2dpbiA9PT0gdHJ1ZTtcclxuICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVFbGVjdHJvbkFwcCgpIHtcclxuICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykgZWxlY3Ryb24uYXBwLnNldEFwcFVzZXJNb2RlbElkKEFQUF9VU0VSX01PREVMX0lEKTtcclxuXHJcbiAgLy8g5ZCv5Yqo5Zmo5a6I5Y2r5LuF5Zyo5omT5YyF5ZCO55qEIFdpbmRvd3Mg5LiK5ZCv55So77ybZGV2L2UyZe+8iGlzUGFja2FnZWQ9ZmFsc2XvvInkuI4gLS1mb2N1cy1vbmx5IOS4gOW+i+i3s+i/h1xyXG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInICYmIGVsZWN0cm9uLmFwcC5pc1BhY2thZ2VkICYmICFwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoRk9DVVNfT05MWV9BUkcpKSB7XHJcbiAgICBjb25zdCBsYXVuY2hlclBpZCA9IHBhcnNlTGF1bmNoZXJQaWQocHJvY2Vzcy5hcmd2KTtcclxuICAgIGlmIChsYXVuY2hlclBpZCA9PT0gbnVsbCkge1xyXG4gICAgICAvLyDml6AgLS1sYXVuY2hlci1waWQgPSDml6flkK/liqjlmajmi4notbfmiJbnm7TmjqXlj4zlh7vvvJrlhYjkv67lpI3lkK/liqjlmajlho3nlLHlroPluKYgcGlkIOmHjeaWsOaLiei1t1xyXG4gICAgICBjb25zdCByZXBhaXJlZCA9IGF3YWl0IHJlcGFpckxhdW5jaGVyKCk7XHJcbiAgICAgIGlmIChyZXBhaXJlZCkge1xyXG4gICAgICAgIGVsZWN0cm9uLmFwcC5leGl0KDApO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICBhd2FpdCBlbGVjdHJvbi5hcHAud2hlblJlYWR5KCk7XHJcbiAgICAgIGNvbnN0IHsgdGl0bGUsIG1lc3NhZ2UgfSA9IHBpY2tEaXJlY3RMYXVuY2hNZXNzYWdlKGVsZWN0cm9uLmFwcC5nZXRMb2NhbGUoKSk7XHJcbiAgICAgIGF3YWl0IGVsZWN0cm9uLmRpYWxvZy5zaG93TWVzc2FnZUJveCh7IHR5cGU6ICdlcnJvcicsIHRpdGxlLCBtZXNzYWdlLCBidXR0b25zOiBbJ09LJ10gfSk7XHJcbiAgICAgIGVsZWN0cm9uLmFwcC5leGl0KDApO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB3YXRjaExhdW5jaGVyUHJvY2VzcyhsYXVuY2hlclBpZCk7XHJcbiAgICB3YXRjaFVwZ3JhZGVSZXF1ZXN0KCk7XHJcbiAgICBzdGFydFN0YWdlZFVwZGF0ZVBvbGxpbmcoKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IGdvdFRoZUxvY2sgPSBlbGVjdHJvbi5hcHAucmVxdWVzdFNpbmdsZUluc3RhbmNlTG9jaygpO1xyXG4gIGlmICghZ290VGhlTG9jaykge1xyXG4gICAgZWxlY3Ryb24uYXBwLnF1aXQoKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGVsZWN0cm9uLmFwcC5vbignc2Vjb25kLWluc3RhbmNlJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgaWYgKCFtYWluV2luZG93IHx8IG1haW5XaW5kb3cuaXNEZXN0cm95ZWQoKSkge1xyXG4gICAgICBhd2FpdCBfX2NyZWF0ZVdpbmRvdygpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBtYWluV2luZG93LnNob3coKTtcclxuICAgIGlmIChtYWluV2luZG93LmlzTWluaW1pemVkKCkpIG1haW5XaW5kb3cucmVzdG9yZSgpO1xyXG4gICAgbWFpbldpbmRvdy5mb2N1cygpO1xyXG4gIH0pO1xyXG5cclxuICBpZiAoKGF3YWl0IGltcG9ydCgnZWxlY3Ryb24tc3F1aXJyZWwtc3RhcnR1cCcpKS5kZWZhdWx0KSB7XHJcbiAgICBlbGVjdHJvbi5hcHAucXVpdCgpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgZWxlY3Ryb24uYXBwLndoZW5SZWFkeSgpLnRoZW4oYXN5bmMgKCkgPT4ge1xyXG4gICAgYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcclxuICAgIGF3YWl0IF9fc3luY0xvZ2luSXRlbVNldHRpbmdzKCk7XHJcbiAgICBhd2FpdCBfX2NyZWF0ZVRyYXkoKTtcclxuICAgIGF3YWl0IF9fY3JlYXRlV2luZG93KCk7XHJcblxyXG4gICAgLy8g5aOB57q477ya55uR5ZCs5pi+56S65Zmo5Y+Y5YyW77yM5Yqo5oCB5aKe5Yig5aOB57q456qX5Y+jXHJcbiAgICBjb25zdCB7IGhhbmRsZURpc3BsYXlDaGFuZ2UsIHNldFdhbGxwYXBlciB9ID0gYXdhaXQgaW1wb3J0KCcuL3dhbGxwYXBlci50cycpO1xyXG4gICAgZWxlY3Ryb24uc2NyZWVuLm9uKCdkaXNwbGF5LWFkZGVkJywgKCkgPT4gaGFuZGxlRGlzcGxheUNoYW5nZSgpKTtcclxuICAgIGVsZWN0cm9uLnNjcmVlbi5vbignZGlzcGxheS1yZW1vdmVkJywgKCkgPT4gaGFuZGxlRGlzcGxheUNoYW5nZSgpKTtcclxuICAgIGVsZWN0cm9uLnNjcmVlbi5vbignZGlzcGxheS1tZXRyaWNzLWNoYW5nZWQnLCAoKSA9PiBoYW5kbGVEaXNwbGF5Q2hhbmdlKCkpO1xyXG5cclxuICAgIC8vIOWQr+WKqOaXtuiHquWKqOaBouWkjeWjgee6uOeKtuaAge+8iOWmguaenOS4iuasoemAgOWHuuaXtuWjgee6uOWkhOS6juWQr+eUqOeKtuaAge+8iVxyXG4gICAgY29uc3QgZWxlY3Ryb25TdGF0ZXMgPSBhd2FpdCB1c2VFbGVjdHJvblN0YXRlcygpO1xyXG4gICAgaWYgKGVsZWN0cm9uU3RhdGVzLnN0YXRlcy53YWxscGFwZXJFbmFibGVkKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb25dIFJlc3RvcmluZyB3YWxscGFwZXIgb24gc3RhcnR1cCcpO1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IHNldFdhbGxwYXBlcigpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdbZWxlY3Ryb25dIEZhaWxlZCB0byByZXN0b3JlIHdhbGxwYXBlcjonLCBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGVsZWN0cm9uLmFwcC5vbignYWN0aXZhdGUnLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgIGlmIChlbGVjdHJvbi5Ccm93c2VyV2luZG93LmdldEFsbFdpbmRvd3MoKS5sZW5ndGggPT09IDApIGF3YWl0IF9fY3JlYXRlV2luZG93KCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgZWxlY3Ryb24uYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcclxuICAgIC8vIOeql+WPo+WFs+mXreWPquaYr+makOiXj++8jOi/m+eoi+S/neaMgei/kOihjFxyXG4gIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2Vidmlld09yaWdpbigpOiBzdHJpbmcge1xyXG4gIGlmIChlbGVjdHJvbi5hcHAuaXNQYWNrYWdlZCkgcmV0dXJuICdodHRwczovL2FwcC5rZWNyZWFtLmNuLyc7XHJcbiAgaWYgKHByb2Nlc3MuZW52LkZPUkNFX1BST0RfT1JJR0lOID09PSAnMScpIHJldHVybiAnaHR0cHM6Ly9hcHAua2VjcmVhbS5jbi8nO1xyXG4gIHJldHVybiAnaHR0cDovL2xvY2FsaG9zdDo5MDAzLyc7XHJcbn1cclxuXHJcbmxldCB3ZWJ2aWV3V2luZG93UmVzb2x2ZXJzID0gUHJvbWlzZS53aXRoUmVzb2x2ZXJzPF9lbGVjdHJvbi5Ccm93c2VyV2luZG93PigpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFdlYnZpZXdXaW5kb3coKTogUHJvbWlzZTxfZWxlY3Ryb24uQnJvd3NlcldpbmRvdz4ge1xyXG4gIHJldHVybiB3ZWJ2aWV3V2luZG93UmVzb2x2ZXJzLnByb21pc2U7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIF9fY3JlYXRlV2luZG93KCkge1xyXG4gIGNvbnN0IGVsZWN0cm9uU3RhdGVzID0gYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcclxuICBjb25zdCBzYXZlZFN0YXRlcyA9IGVsZWN0cm9uU3RhdGVzLnN0YXRlcztcclxuICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uXSBMb2FkZWQgd2luZG93IHN0YXRlIGZyb20gc3RhdGVzOiAke0pTT04uc3RyaW5naWZ5KHNhdmVkU3RhdGVzKX1gKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IG1rZGlyKHNhdmVkU3RhdGVzLnVzZXJEYXRhUGF0aCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XHJcbiAgfSBjYXRjaCB7fVxyXG5cclxuICBjb25zdCBpY29uUGF0aCA9IGpvaW4oc2F2ZWRTdGF0ZXMucHVibGljUGF0aCwgJ2Zhdmljb24ucG5nJyk7XHJcbiAgbGV0IHdpbmRvd0ljb246IF9lbGVjdHJvbi5OYXRpdmVJbWFnZTtcclxuICB0cnkge1xyXG4gICAgYXdhaXQgYWNjZXNzKGljb25QYXRoKTtcclxuICAgIHdpbmRvd0ljb24gPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tUGF0aChpY29uUGF0aCk7XHJcbiAgfSBjYXRjaCB7XHJcbiAgICB3aW5kb3dJY29uID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRW1wdHkoKTtcclxuICB9XHJcblxyXG4gIC8vIOeql+WPo+WwuuWvuOW3suWcqCBlbGVjdHJvbi1zdGF0ZXMudHMg5Lit5qC55o2u5bGP5bmV5bC65a+46K6h566X5a6M5oiQXHJcbiAgY29uc3Qgd2luZG93V2lkdGggPSBzYXZlZFN0YXRlcy53ZWJ2aWV3V2luZG93V2lkdGg7XHJcbiAgY29uc3Qgd2luZG93SGVpZ2h0ID0gc2F2ZWRTdGF0ZXMud2Vidmlld1dpbmRvd0hlaWdodDtcclxuICAvLyDlsY/luZXlj6/nlKjljLrku7vkuIDmlrnlkJHlsI/kuo7pmIjlgLzljbPop4bkuLrlsY/luZXov4flsI/vvIznqpflj6PljJbkvZPpqozlpKrlt67vvIznm7TmjqXku6XlhajlsY/vvIjmnIDlpKfljJbvvInmiZPlvIBcclxuICBjb25zdCBwcmltYXJ5RGlzcGxheSA9IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpO1xyXG4gIGNvbnN0IHsgd2lkdGg6IHNjcmVlbldpZHRoLCBoZWlnaHQ6IHNjcmVlbkhlaWdodCB9ID0gcHJpbWFyeURpc3BsYXkud29ya0FyZWFTaXplO1xyXG4gIGNvbnN0IHNjcmVlblRvb1NtYWxsID0gc2NyZWVuV2lkdGggPCBBVVRPX0ZVTExTQ1JFRU5fVEhSRVNIT0xEX1dJRFRIIHx8IHNjcmVlbkhlaWdodCA8IEFVVE9fRlVMTFNDUkVFTl9USFJFU0hPTERfSEVJR0hUO1xyXG4gIGNvbnN0IHN0YXJ0TWF4aW1pemVkID0gc2F2ZWRTdGF0ZXMud2Vidmlld1dpbmRvd0lzTWF4aW1pemVkIHx8IHNjcmVlblRvb1NtYWxsO1xyXG4gIGNvbnNvbGUubG9nKGBbZWxlY3Ryb25dIFdpbmRvdyBzaXplOiAke3dpbmRvd1dpZHRofXgke3dpbmRvd0hlaWdodH0sIHNjcmVlbjogJHtzY3JlZW5XaWR0aH14JHtzY3JlZW5IZWlnaHR9LCBtYXhpbWl6ZWQ6ICR7c3RhcnRNYXhpbWl6ZWR9YCk7XHJcblxyXG4gIGlmIChzdGFydE1heGltaXplZCkge1xyXG4gICAgLy8g5YWo5bGP5qih5byP77ya56qX5Y+j5aGr5ruh5bGP5bmV5bm25pyA5aSn5YyWXHJcbiAgICBtYWluV2luZG93ID0gbmV3IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3coe1xyXG4gICAgICB3aWR0aDogc2NyZWVuV2lkdGgsXHJcbiAgICAgIGhlaWdodDogc2NyZWVuSGVpZ2h0LFxyXG4gICAgICBtaW5XaWR0aDogTUlOX1dJTkRPV19XSURUSCxcclxuICAgICAgbWluSGVpZ2h0OiBNSU5fV0lORE9XX0hFSUdIVCxcclxuICAgICAgc2hvdzogZmFsc2UsXHJcbiAgICAgIGZyYW1lOiBmYWxzZSxcclxuICAgICAgaWNvbjogd2luZG93SWNvbixcclxuICAgICAgd2ViUHJlZmVyZW5jZXM6IHtcclxuICAgICAgICBkZXZUb29sczogdHJ1ZSxcclxuICAgICAgICBub2RlSW50ZWdyYXRpb246IGZhbHNlLFxyXG4gICAgICAgIGNvbnRleHRJc29sYXRpb246IHRydWUsXHJcbiAgICAgICAgc2FuZGJveDogdHJ1ZSxcclxuICAgICAgICAvLyBFbGVjdHJvbiDnq6/nu5Xov4fmtY/op4jlmajoh6rliqjmkq3mlL7nrZbnlaXvvIzml6DpnIDnlKjmiLfkuqTkupLljbPlj6/mkq3mlL7pn7PpopFcclxuICAgICAgICBhdXRvcGxheVBvbGljeTogJ25vLXVzZXItZ2VzdHVyZS1yZXF1aXJlZCcsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICAgIG1haW5XaW5kb3cubWF4aW1pemUoKTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8g5pmu6YCa56qX5Y+j5qih5byP77ya5L2/55So6K6h566X5aW955qE5bC65a+4XHJcbiAgICBtYWluV2luZG93ID0gbmV3IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3coe1xyXG4gICAgICB3aWR0aDogTWF0aC5mbG9vcih3aW5kb3dXaWR0aCksXHJcbiAgICAgIGhlaWdodDogTWF0aC5mbG9vcih3aW5kb3dIZWlnaHQpLFxyXG4gICAgICBtaW5XaWR0aDogTUlOX1dJTkRPV19XSURUSCxcclxuICAgICAgbWluSGVpZ2h0OiBNSU5fV0lORE9XX0hFSUdIVCxcclxuICAgICAgeDogc2F2ZWRTdGF0ZXMud2Vidmlld1dpbmRvd1gsXHJcbiAgICAgIHk6IHNhdmVkU3RhdGVzLndlYnZpZXdXaW5kb3dZLFxyXG4gICAgICBzaG93OiBmYWxzZSxcclxuICAgICAgZnJhbWU6IGZhbHNlLFxyXG4gICAgICBpY29uOiB3aW5kb3dJY29uLFxyXG4gICAgICB3ZWJQcmVmZXJlbmNlczoge1xyXG4gICAgICAgIGRldlRvb2xzOiB0cnVlLFxyXG4gICAgICAgIG5vZGVJbnRlZ3JhdGlvbjogZmFsc2UsXHJcbiAgICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcclxuICAgICAgICBzYW5kYm94OiB0cnVlLFxyXG4gICAgICAgIC8vIEVsZWN0cm9uIOerr+e7lei/h+a1j+iniOWZqOiHquWKqOaSreaUvuetlueVpe+8jOaXoOmcgOeUqOaIt+S6pOS6kuWNs+WPr+aSreaUvumfs+mikVxyXG4gICAgICAgIGF1dG9wbGF5UG9saWN5OiAnbm8tdXNlci1nZXN0dXJlLXJlcXVpcmVkJyxcclxuICAgICAgfSxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8g5oum5oiq5Li756qX5Y+j5YaF55qE5a+86Iiq77ya6Z2e5ZCM5rqQ6ZO+5o6l55So57O757uf5rWP6KeI5Zmo5omT5byAXHJcbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignd2lsbC1uYXZpZ2F0ZScsIChldmVudCwgdXJsKSA9PiB7XHJcbiAgICBpZiAodXJsLnN0YXJ0c1dpdGgoZ2V0V2Vidmlld09yaWdpbigpKSkgcmV0dXJuO1xyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbCh1cmwpO1xyXG4gIH0pO1xyXG5cclxuICAvLyDmi6bmiKrmlrDnqpflj6PmiZPlvIDvvIh3aW5kb3cub3BlbuOAgXRhcmdldD1cIl9ibGFua1wi77yJ77yM55So57O757uf5rWP6KeI5Zmo5omT5byAXHJcbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5zZXRXaW5kb3dPcGVuSGFuZGxlcigoeyB1cmwgfSkgPT4ge1xyXG4gICAgZWxlY3Ryb24uc2hlbGwub3BlbkV4dGVybmFsKHVybCk7XHJcbiAgICByZXR1cm4geyBhY3Rpb246ICdkZW55JyB9O1xyXG4gIH0pO1xyXG5cclxuICAvLyDku7vliqHmoI/lm7rlrprpobnot6jniYjmnKzlhbzlrrnvvJrnqpflj6PlsZ7mgKfnu5/kuIAgQVVNSUQg5bm25oqKIFJlbGF1bmNoQ29tbWFuZCDmjIflkJHnqLPlrprlhaXlj6MgcmFiYml4LWxhdW5jaGVyLmV4ZVxyXG4gIHZvaWQgYXBwbHlXaW5kb3dSZWxhdW5jaFByb3BlcnRpZXMobWFpbldpbmRvdyk7XHJcblxyXG4gIGNvbnN0IHVybCA9IG5ldyBVUkwoZ2V0V2Vidmlld09yaWdpbigpKTtcclxuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnbW9kZScsICdlbGVjdHJvbicpO1xyXG4gIHVybC5zZWFyY2hQYXJhbXMuc2V0KCdzaGVsbFZlcnNpb24nLCBfX1ZFUlNJT05fXyk7XHJcbiAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uUG9ydCcsIGVsZWN0cm9uUG9ydC50b1N0cmluZygpKTtcclxuICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnZWxlY3Ryb25Ub2tlbicsIGdsb2JhbFRoaXMuZWxlY3Ryb25Ub2tlbik7XHJcbiAgY29uc29sZS5sb2coYFtlbGVjdHJvbl0gTG9hZGluZyB3ZWJ2aWV3IFVSTGApO1xyXG4gIChnbG9iYWxUaGlzIGFzIHsgX19sYXN0TG9hZFVSTD86IHN0cmluZyB9KS5fX2xhc3RMb2FkVVJMID0gdXJsLnRvU3RyaW5nKCk7XHJcbiAgbWFpbldpbmRvdy5sb2FkVVJMKHVybC50b1N0cmluZygpKTtcclxuXHJcbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignYmVmb3JlLWlucHV0LWV2ZW50JywgKF9ldmVudCwgaW5wdXQpID0+IHtcclxuICAgIGlmIChpbnB1dC5rZXkgPT09ICdGMTInKSBtYWluV2luZG93IS53ZWJDb250ZW50cy50b2dnbGVEZXZUb29scygpO1xyXG4gIH0pO1xyXG5cclxuICBtYWluV2luZG93LndlYkNvbnRlbnRzLm9uKCdkaWQtZmluaXNoLWxvYWQnLCAoKSA9PiB7XHJcbiAgICBtYWluV2luZG93IS53ZWJDb250ZW50cy5zZXRab29tRmFjdG9yKDEpO1xyXG4gICAgbWFpbldpbmRvdyEud2ViQ29udGVudHMuc2V0VmlzdWFsWm9vbUxldmVsTGltaXRzKDEsIDEpO1xyXG4gIH0pO1xyXG5cclxuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xyXG4gICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKHRydWUpLCA1MDAwKTtcclxuICAgIG1haW5XaW5kb3chLndlYkNvbnRlbnRzLm9uKCdkaWQtZmluaXNoLWxvYWQnLCAoKSA9PiB7XHJcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xyXG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUodHJ1ZSksIDUwMCk7XHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgaWYgKCFpc0xhdW5jaGVkSGlkZGVuKGVsZWN0cm9uU3RhdGVzLnN0YXRlcy5ydW5JbkJhY2tncm91bmQpKSB7XHJcbiAgICBtYWluV2luZG93LnNob3coKTtcclxuICB9XHJcblxyXG4gIGNvbnN0IHNhdmVXaW5kb3dTdGF0ZSA9ICgpID0+IHtcclxuICAgIGlmICghbWFpbldpbmRvdykgcmV0dXJuO1xyXG4gICAgaWYgKG1haW5XaW5kb3cuaXNNYXhpbWl6ZWQoKSkge1xyXG4gICAgICBjb25zdCBib3VuZHMgPSBtYWluV2luZG93LmdldE5vcm1hbEJvdW5kcygpO1xyXG4gICAgICBlbGVjdHJvblN0YXRlcy5zZXQoe1xyXG4gICAgICAgIHdlYnZpZXdXaW5kb3dJc01heGltaXplZDogdHJ1ZSxcclxuICAgICAgICB3ZWJ2aWV3V2luZG93V2lkdGg6IGJvdW5kcy53aWR0aCxcclxuICAgICAgICB3ZWJ2aWV3V2luZG93SGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxyXG4gICAgICAgIHdlYnZpZXdXaW5kb3dYOiBib3VuZHMueCxcclxuICAgICAgICB3ZWJ2aWV3V2luZG93WTogYm91bmRzLnksXHJcbiAgICAgIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc3QgYm91bmRzID0gbWFpbldpbmRvdy5nZXRCb3VuZHMoKTtcclxuICAgICAgZWxlY3Ryb25TdGF0ZXMuc2V0KHtcclxuICAgICAgICB3ZWJ2aWV3V2luZG93SXNNYXhpbWl6ZWQ6IGZhbHNlLFxyXG4gICAgICAgIHdlYnZpZXdXaW5kb3dXaWR0aDogYm91bmRzLndpZHRoLFxyXG4gICAgICAgIHdlYnZpZXdXaW5kb3dIZWlnaHQ6IGJvdW5kcy5oZWlnaHQsXHJcbiAgICAgICAgd2Vidmlld1dpbmRvd1g6IGJvdW5kcy54LFxyXG4gICAgICAgIHdlYnZpZXdXaW5kb3dZOiBib3VuZHMueSxcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgbWFpbldpbmRvdy5vbigncmVzaXplJywgKCkgPT4ge1xyXG4gICAgaWYgKG1haW5XaW5kb3cgJiYgIW1haW5XaW5kb3cuaXNNYXhpbWl6ZWQoKSkge1xyXG4gICAgICBzYXZlV2luZG93U3RhdGUoKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgbWFpbldpbmRvdy5vbignbW92ZScsICgpID0+IHtcclxuICAgIGlmIChtYWluV2luZG93ICYmICFtYWluV2luZG93LmlzTWF4aW1pemVkKCkpIHtcclxuICAgICAgc2F2ZVdpbmRvd1N0YXRlKCk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIG1haW5XaW5kb3cub24oJ21heGltaXplJywgKCkgPT4ge1xyXG4gICAgc2F2ZVdpbmRvd1N0YXRlKCk7XHJcbiAgfSk7XHJcblxyXG4gIG1haW5XaW5kb3cub24oJ3VubWF4aW1pemUnLCAoKSA9PiB7XHJcbiAgICAvLyDov5jljp/lkI7oi6Xnqpflj6PlsLrlr7jmjqXov5Hmu6HlsY/vvIzliJnlm57okL3liLDpu5jorqTliJ3lp4vlsLrlr7jvvIzpgb/lhY3ov5jljp/liLDkuI7mnIDlpKfljJblh6DkuY7ml6Dlt67liKvnmoTnirbmgIFcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICBpZiAoIW1haW5XaW5kb3cgfHwgbWFpbldpbmRvdy5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XHJcbiAgICAgIGNvbnN0IGJvdW5kcyA9IG1haW5XaW5kb3cuZ2V0Qm91bmRzKCk7XHJcbiAgICAgIGNvbnN0IHdvcmtBcmVhID0gZWxlY3Ryb24uc2NyZWVuLmdldERpc3BsYXlNYXRjaGluZyhib3VuZHMpLndvcmtBcmVhO1xyXG4gICAgICBpZiAoYm91bmRzLndpZHRoID49IHdvcmtBcmVhLndpZHRoICogMC45NSAmJiBib3VuZHMuaGVpZ2h0ID49IHdvcmtBcmVhLmhlaWdodCAqIDAuOTUpIHtcclxuICAgICAgICBtYWluV2luZG93LnNldEJvdW5kcyhjb21wdXRlRGVmYXVsdFdpbmRvd0JvdW5kcyh3b3JrQXJlYSkpO1xyXG4gICAgICB9XHJcbiAgICAgIHNhdmVXaW5kb3dTdGF0ZSgpO1xyXG4gICAgfSwgMCk7XHJcbiAgfSk7XHJcblxyXG4gIG1haW5XaW5kb3cub24oJ2Nsb3NlJywgKGV2ZW50KSA9PiB7XHJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgbWFpbldpbmRvdyEuaGlkZSgpO1xyXG4gIH0pO1xyXG5cclxuICB3ZWJ2aWV3V2luZG93UmVzb2x2ZXJzLnJlc29sdmUobWFpbldpbmRvdyk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIF9fY3JlYXRlVHJheSgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICBjb25zdCBpMThuOiBSZWNvcmQ8c3RyaW5nLCB7IHNob3dXaW5kb3c6IHN0cmluZzsgcXVpdDogc3RyaW5nIH0+ID0ge1xyXG4gICAgJ3poLWNuJzogeyBzaG93V2luZG93OiAn5omT5byAJywgcXVpdDogJ+mAgOWHuicgfSxcclxuICAgICd6aC1zZyc6IHsgc2hvd1dpbmRvdzogJ+aJk+W8gCcsIHF1aXQ6ICfpgIDlh7onIH0sXHJcbiAgICAnemgtdHcnOiB7IHNob3dXaW5kb3c6ICfpoa/npLonLCBxdWl0OiAn6YCA5Ye6JyB9LFxyXG4gICAgJ3poLWhrJzogeyBzaG93V2luZG93OiAn6aGv56S6JywgcXVpdDogJ+mAgOWHuicgfSxcclxuICAgIGphOiB7IHNob3dXaW5kb3c6ICfooajnpLonLCBxdWl0OiAn57WC5LqGJyB9LFxyXG4gICAga286IHsgc2hvd1dpbmRvdzogJ+ywvSDtkZzsi5wnLCBxdWl0OiAn7KKF66OMJyB9LFxyXG4gIH07XHJcblxyXG4gIGNvbnN0IGxvY2FsZSA9IGVsZWN0cm9uLmFwcC5nZXRMb2NhbGUoKS50b0xvd2VyQ2FzZSgpO1xyXG4gIGNvbnN0IHQgPSBpMThuW2xvY2FsZV0gfHwgeyBzaG93V2luZG93OiAnU2hvdyBXaW5kb3cnLCBxdWl0OiAnUXVpdCcgfTtcclxuICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uXSBTeXN0ZW0gbG9jYWxlOiAke2xvY2FsZX0sIHVzaW5nIHRyYW5zbGF0aW9uczogJHtKU09OLnN0cmluZ2lmeSh0KX1gKTtcclxuXHJcbiAgY29uc3QgZWxlY3Ryb25TdGF0ZXMgPSBhd2FpdCB1c2VFbGVjdHJvblN0YXRlcygpO1xyXG4gIGNvbnN0IGljb25QYXRoID0gam9pbihlbGVjdHJvblN0YXRlcy5zdGF0ZXMucHVibGljUGF0aCwgJ3RyYXkucG5nJyk7XHJcbiAgY29uc3QgaWNvbkJXUGF0aCA9IGpvaW4oZWxlY3Ryb25TdGF0ZXMuc3RhdGVzLnB1YmxpY1BhdGgsICd0cmF5LWJ3LnBuZycpO1xyXG4gIGxldCB0cmF5SWNvbjogX2VsZWN0cm9uLk5hdGl2ZUltYWdlO1xyXG4gIHRyeSB7XHJcbiAgICAvLyDlnKggbWFjT1Mg5LiK77yM6ZyA6KaB5bCG5omY55uY5Zu+5qCH57yp5pS+5Yiw5ZCI6YCC55qE5bC65a+4XHJcbiAgICAvLyBtYWNPUyDoj5zljZXmoI/miZjnm5jlm77moIfnmoTmoIflh4blsLrlr7jmmK8gMTh4MTgg5YOP57Sg77yIQDF477yJ5oiWIDM2eDM2IOWDj+e0oO+8iEAyeCDnlKjkuo4gUmV0aW5hIOWxj+W5le+8iVxyXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICdkYXJ3aW4nKSB7XHJcbiAgICAgIGF3YWl0IGFjY2VzcyhpY29uQldQYXRoKTtcclxuICAgICAgdHJheUljb24gPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tUGF0aChpY29uQldQYXRoKTtcclxuICAgICAgY29uc3QgaXNSZXRpbmEgPSBlbGVjdHJvbi5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKS5zY2FsZUZhY3RvciA+PSAyO1xyXG4gICAgICBjb25zdCB0YXJnZXRTaXplID0gaXNSZXRpbmEgPyAzNiA6IDE4O1xyXG4gICAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uXSBtYWNPUyBkZXRlY3RlZCwgcmVzaXppbmcgdHJheSBpY29uIHRvICR7dGFyZ2V0U2l6ZX14JHt0YXJnZXRTaXplfSAoUmV0aW5hOiAke2lzUmV0aW5hfSlgKTtcclxuICAgICAgdHJheUljb24gPSB0cmF5SWNvbi5yZXNpemUoeyB3aWR0aDogdGFyZ2V0U2l6ZSwgaGVpZ2h0OiB0YXJnZXRTaXplIH0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXdhaXQgYWNjZXNzKGljb25QYXRoKTtcclxuICAgICAgdHJheUljb24gPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tUGF0aChpY29uUGF0aCk7XHJcbiAgICB9XHJcbiAgfSBjYXRjaCB7XHJcbiAgICB0cmF5SWNvbiA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUVtcHR5KCk7XHJcbiAgfVxyXG4gIHRyYXkgPSBuZXcgZWxlY3Ryb24uVHJheSh0cmF5SWNvbik7XHJcbiAgY29uc3QgY29udGV4dE1lbnUgPSBlbGVjdHJvbi5NZW51LmJ1aWxkRnJvbVRlbXBsYXRlKFtcclxuICAgIHtcclxuICAgICAgbGFiZWw6IHQuc2hvd1dpbmRvdyxcclxuICAgICAgY2xpY2s6IGFzeW5jICgpID0+IHtcclxuICAgICAgICBpZiAoIW1haW5XaW5kb3cgfHwgbWFpbldpbmRvdy5pc0Rlc3Ryb3llZCgpKSB7XHJcbiAgICAgICAgICBhd2FpdCBfX2NyZWF0ZVdpbmRvdygpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBtYWluV2luZG93LnNob3coKTtcclxuICAgICAgICBpZiAobWFpbldpbmRvdy5pc01pbmltaXplZCgpKSBtYWluV2luZG93LnJlc3RvcmUoKTtcclxuICAgICAgICBtYWluV2luZG93LmZvY3VzKCk7XHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9LFxyXG4gICAge1xyXG4gICAgICBsYWJlbDogdC5xdWl0LFxyXG4gICAgICBjbGljazogKCkgPT4ge1xyXG4gICAgICAgIGVsZWN0cm9uLmFwcC5leGl0KDApO1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICBdKTtcclxuICB0cmF5LnNldFRvb2xUaXAoJ0tlY3JlYW0nKTtcclxuICB0cmF5LnNldENvbnRleHRNZW51KGNvbnRleHRNZW51KTtcclxuICB0cmF5Lm9uKCdjbGljaycsIGFzeW5jICgpID0+IHtcclxuICAgIGlmICghbWFpbldpbmRvdyB8fCBtYWluV2luZG93LmlzRGVzdHJveWVkKCkpIHtcclxuICAgICAgYXdhaXQgX19jcmVhdGVXaW5kb3coKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbWFpbldpbmRvdy5zaG93KCk7XHJcbiAgICBpZiAobWFpbldpbmRvdy5pc01pbmltaXplZCgpKSBtYWluV2luZG93LnJlc3RvcmUoKTtcclxuICAgIG1haW5XaW5kb3cuZm9jdXMoKTtcclxuICB9KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gX19zeW5jTG9naW5JdGVtU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgY29uc3QgZWxlY3Ryb25TdGF0ZXMgPSBhd2FpdCB1c2VFbGVjdHJvblN0YXRlcygpO1xyXG4gIGNvbnN0IHsgbGF1bmNoQXRTdGFydHVwLCBydW5JbkJhY2tncm91bmQgfSA9IGVsZWN0cm9uU3RhdGVzLnN0YXRlcztcclxuXHJcbiAgY29uc3Qgb3B0aW9uczogUGFyYW1ldGVyczx0eXBlb2YgZWxlY3Ryb24uYXBwLnNldExvZ2luSXRlbVNldHRpbmdzPlswXSA9IHtcclxuICAgIG9wZW5BdExvZ2luOiBsYXVuY2hBdFN0YXJ0dXAsXHJcbiAgICBvcGVuQXNIaWRkZW46IGxhdW5jaEF0U3RhcnR1cCAmJiBydW5JbkJhY2tncm91bmQsXHJcbiAgICBhcmdzOiBsYXVuY2hBdFN0YXJ0dXAgJiYgcnVuSW5CYWNrZ3JvdW5kID8gW0xBVU5DSF9ISURERU5fQVJHXSA6IFtdLFxyXG4gIH07XHJcbiAgLy8g55m75b2V6aG55oyH5ZCR5bi46am75ZCv5Yqo5Zmo6ICM6Z2e54mI5pys55uu5b2V6YeM55qE5pys5L2T77yM5L+d6K+B5byA5py66Ieq5ZCv5ZCM5qC357uP6L+H5pu05paw5LiO5a6I5Y2r5rWB56iL77ybXHJcbiAgLy8g5pen55So5oi355qE55m75b2V6aG55Zyo6aaW5qyh5Lul5paw5pys5L2T5ZCv5Yqo5pe26ZqP5pys5qyh6LCD55So6Ieq5Yqo6L+B56e7XHJcbiAgY29uc3QgbGF1bmNoZXJQYXRoID0gZ2V0SW5zdGFsbGVkTGF1bmNoZXJQYXRoKCk7XHJcbiAgaWYgKGxhdW5jaGVyUGF0aCkgb3B0aW9ucy5wYXRoID0gbGF1bmNoZXJQYXRoO1xyXG4gIGVsZWN0cm9uLmFwcC5zZXRMb2dpbkl0ZW1TZXR0aW5ncyhvcHRpb25zKTtcclxufVxyXG4iLCIvLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvcGFydC50c1xuZnVuY3Rpb24gcGFydChoYW5kbGVyKSB7XG4gIHJldHVybiBoYW5kbGVyKCk7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdHlwZS1zYWZldHkvaW5kZXgudHNcbmZ1bmN0aW9uIHR5cGVTYWZldHkodmFsdWUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAoKSA9PiAoeyAkbWlsa2lvVHlwZTogXCJ0eXBlLXNhZmV0eVwiLCB2YWx1ZSB9KVxuICB9O1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL2NvbmZpZy9pbmRleC50c1xuZnVuY3Rpb24gY29uZmlnKGNvbmZpZykge1xuICByZXR1cm4gY29uZmlnO1xufVxuZnVuY3Rpb24gZW52VG9TdHJpbmcodmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICByZXR1cm4gYCR7dmFsdWV9YDtcbn1cbmZ1bmN0aW9uIGVudlRvTnVtYmVyKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgcmV0dXJuIE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xufVxuZnVuY3Rpb24gZW52VG9Cb29sZWFuKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSBcInRydWVcIilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKHZhbHVlID09PSBcImZhbHNlXCIpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAodmFsdWUgPT09IFwiXCIpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICByZXR1cm4gQm9vbGVhbih2YWx1ZSk7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvaGVhZGVycy10by1qc29uLnRzXG5mdW5jdGlvbiBoZWFkZXJzVG9KU09OKGhlYWRlcnMpIHtcbiAgY29uc3QganNvbiA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBoZWFkZXJzLmVudHJpZXMoKSkge1xuICAgIGpzb25ba2V5XSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBqc29uO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvbWVyZ2UtZGVlcC50c1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cbmZ1bmN0aW9uIG1lcmdlRGVlcCh0YXJnZXQsIHNvdXJjZSkge1xuICBjb25zdCBtZXJnZWQgPSB7IC4uLnRhcmdldCB9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpXG4gICAgICBjb250aW51ZTtcbiAgICBjb25zdCBzb3VyY2VWYWx1ZSA9IHNvdXJjZVtrZXldO1xuICAgIGNvbnN0IHRhcmdldFZhbHVlID0gdGFyZ2V0W2tleV07XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIGtleSkpIHtcbiAgICAgIGlmIChpc1BsYWluT2JqZWN0KHRhcmdldFZhbHVlKSAmJiBpc1BsYWluT2JqZWN0KHNvdXJjZVZhbHVlKSkge1xuICAgICAgICBtZXJnZWRba2V5XSA9IG1lcmdlRGVlcCh0YXJnZXRWYWx1ZSwgc291cmNlVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBtZXJnZWRba2V5XSA9IHNvdXJjZVZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VkO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvcmV2aXZlLWpzb24tcGFyc2UudHNcbnZhciBpc29EYXRlUGF0dGVybiA9IC9eKFxcZHs0fS1cXGR7Mn0tXFxkezJ9VFxcZHsyfTpcXGR7Mn06XFxkezJ9KD86XFwuXFxkezEsM30pPykoWnxbKy1dXFxkezJ9Oj9cXGR7Mn0pPyQvO1xuZnVuY3Rpb24gdHJ5UGFyc2VEYXRlKHN0cikge1xuICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuICBpZiAobGVuID49IDIwICYmIGxlbiA8PSAzMiAmJiBzdHIuY2hhckNvZGVBdCgwKSA+PSA0OCAmJiBzdHIuY2hhckNvZGVBdCgwKSA8PSA1NyAmJiBzdHIuaW5kZXhPZihcIlRcIikgIT09IC0xKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBpc29EYXRlUGF0dGVybi5leGVjKHN0cik7XG4gICAgaWYgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBkYXRlUGFydCA9IG1hdGNoWzFdO1xuICAgICAgY29uc3QgdHpQYXJ0ID0gbWF0Y2hbMl07XG4gICAgICBpZiAoZGF0ZVBhcnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICBpZiAodHpQYXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFR6ID0gdHpQYXJ0Lmxlbmd0aCA9PT0gNSAmJiB0elBhcnQuY2hhckF0KDMpICE9PSBcIjpcIiA/IGAke3R6UGFydC5zbGljZSgwLCAzKX06JHt0elBhcnQuc2xpY2UoMyl9YCA6IHR6UGFydDtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVQYXJ0ICsgbm9ybWFsaXplZFR6KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgRGF0ZShkYXRlUGFydCArIFwiWlwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiByZXZpdmVKU09OUGFyc2UoanNvbikge1xuICBpZiAoanNvbiA9PT0gbnVsbCB8fCBqc29uID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGpzb247XG4gIGlmICh0eXBlb2YganNvbiA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChqc29uIGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiBqc29uO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICBjb25zdCBsZW4gPSBqc29uLmxlbmd0aDtcbiAgICAgIGZvciAobGV0IGkgPSAwO2kgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCB2ID0ganNvbltpXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29uc3QgZCA9IHRyeVBhcnNlRGF0ZSh2KTtcbiAgICAgICAgICBpZiAoZCAhPT0gbnVsbClcbiAgICAgICAgICAgIGpzb25baV0gPSBkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSBcIm9iamVjdFwiICYmIHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXZpdmVKU09OUGFyc2Uodik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBqc29uO1xuICAgIH1cbiAgICBjb25zdCBvYmogPSBqc29uO1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIGNvbnN0IHYgPSBvYmpba2V5XTtcbiAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBjb25zdCBkID0gdHJ5UGFyc2VEYXRlKHYpO1xuICAgICAgICBpZiAoZCAhPT0gbnVsbClcbiAgICAgICAgICBvYmpba2V5XSA9IGQ7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSBcIm9iamVjdFwiICYmIHYgIT09IG51bGwpIHtcbiAgICAgICAgcmV2aXZlSlNPTlBhcnNlKHYpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBpZiAodHlwZW9mIGpzb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBkID0gdHJ5UGFyc2VEYXRlKGpzb24pO1xuICAgIGlmIChkICE9PSBudWxsKVxuICAgICAgcmV0dXJuIGQ7XG4gIH1cbiAgcmV0dXJuIGpzb247XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby9leGVjdXRlL2luZGV4LnRzXG5mdW5jdGlvbiBfX2luaXRFeGVjdXRlcihnZW5lcmF0ZWQsIHJ1bnRpbWUpIHtcbiAgY29uc3QgX19leGVjdXRlID0gYXN5bmMgKHJvdXRlU2NoZW1hLCBvcHRpb25zKSA9PiB7XG4gICAgY29uc3QgdHlwZSA9IG9wdGlvbnMucGF0aC5lbmRzV2l0aChcIn5cIikgPyBcInN0cmVhbVwiIDogXCJhY3Rpb25cIjtcbiAgICBjb25zdCBleGVjdXRlSWQgPSBvcHRpb25zLmNyZWF0ZWRFeGVjdXRlSWQ7XG4gICAgbGV0IGhlYWRlcnM7XG4gICAgaWYgKCEob3B0aW9ucy5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5oZWFkZXJzPy5nZXQgPT09IFwiZnVuY3Rpb25cIiAmJiAhKG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpKSB7XG4gICAgICAgIGhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWFkZXJzID0gbmV3IEhlYWRlcnMoe1xuICAgICAgICAgIC4uLm9wdGlvbnMuaGVhZGVyc1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCEoXCJ0b0pTT05cIiBpbiBoZWFkZXJzKSlcbiAgICAgICAgICBoZWFkZXJzLnRvSlNPTiA9ICgpID0+IGhlYWRlcnNUb0pTT04oaGVhZGVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnM7XG4gICAgICBpZiAoIShcInRvSlNPTlwiIGluIGhlYWRlcnMpKVxuICAgICAgICBoZWFkZXJzLnRvSlNPTiA9ICgpID0+IGhlYWRlcnNUb0pTT04oaGVhZGVycyk7XG4gICAgfVxuICAgIGNvbnN0IGZpbmFsZXMgPSBbXTtcbiAgICBjb25zdCBvbkZpbmFsbHkgPSAoaGFuZGxlcikgPT4gZmluYWxlcy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgIGxldCBwYXJhbXM7XG4gICAgaWYgKG9wdGlvbnMucGFyYW1zVHlwZSA9PT0gXCJyYXdcIikge1xuICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbXM7XG4gICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgcGFyYW1zID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghb3B0aW9ucy5wYXJhbXMgfHwgb3B0aW9ucy5wYXJhbXMgPT09IFwiXCIgfHwgb3B0aW9ucy5wYXJhbXMgPT09IFwie31cIikge1xuICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH0gZWxzZSBpZiAoaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi9qc29uXCIpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcGFyYW1zID0gcmV2aXZlSlNPTlBhcnNlKEpTT04ucGFyc2Uob3B0aW9ucy5wYXJhbXMpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyByZWplY3QoXCJQQVJBTVNfVFlQRV9OT1RfU1VQUE9SVEVEXCIsIHsgZXhwZWN0ZWQ6IFwianNvblwiLCBjb250ZW50VHlwZTogaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikgPz8gbnVsbCwgcGFyYW1zOiBvcHRpb25zLnBhcmFtcy5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH0gZWxzZSBpZiAoaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIikpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMob3B0aW9ucy5wYXJhbXMpO1xuICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHBhcmFtc1trZXldID0gdmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRocm93IHJlamVjdChcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgeyBleHBlY3RlZDogXCJmb3JtLXVybGVuY29kZWRcIiwgY29udGVudFR5cGU6IGhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpID8/IG51bGwsIHBhcmFtczogb3B0aW9ucy5wYXJhbXMuc2xpY2UoMCwgNDA5NikgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXJhbXMuc3RhcnRzV2l0aChcIntcIikpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwYXJhbXMgPSByZXZpdmVKU09OUGFyc2UoSlNPTi5wYXJzZShvcHRpb25zLnBhcmFtcykpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRocm93IHJlamVjdChcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgeyBleHBlY3RlZDogXCJqc29uXCIsIGNvbnRlbnRUeXBlOiBoZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKSA/PyBudWxsLCBwYXJhbXM6IG9wdGlvbnMucGFyYW1zLnNsaWNlKDAsIDQwOTYpIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyByZWplY3QoXCJQQVJBTVNfVFlQRV9OT1RfU1VQUE9SVEVEXCIsIHsgZXhwZWN0ZWQ6IFwianNvblwiLCBjb250ZW50VHlwZTogaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikgPz8gbnVsbCwgcGFyYW1zOiBvcHRpb25zLnBhcmFtcy5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXJhbXMgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShwYXJhbXMpKVxuICAgICAgdGhyb3cgcmVqZWN0KFwiUEFSQU1TX1RZUEVfTk9UX1NVUFBPUlRFRFwiLCB7IGV4cGVjdGVkOiBcImpzb25cIiwgY29udGVudFR5cGU6IGhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpID8/IG51bGwsIHBhcmFtczogKHR5cGVvZiBvcHRpb25zLnBhcmFtcyA9PT0gXCJzdHJpbmdcIiA/IG9wdGlvbnMucGFyYW1zIDogSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5wYXJhbXMpKS5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICBpZiAoXCIkbWlsa2lvR2VuZXJhdGVQYXJhbXNcIiBpbiBwYXJhbXMgJiYgcGFyYW1zLiRtaWxraW9HZW5lcmF0ZVBhcmFtcyA9PT0gXCJlbmFibGVcIikge1xuICAgICAgaWYgKCFydW50aW1lLmRldmVsb3ApXG4gICAgICAgIHRocm93IHJlamVjdChcIk5PVF9ERVZFTE9QX01PREVcIiwgXCJUaGlzIGZlYXR1cmUgbXVzdCBiZSBpbiBjb29rYm9vayB0byB1c2UuXCIpO1xuICAgICAgZGVsZXRlIHBhcmFtcy4kbWlsa2lvR2VuZXJhdGVQYXJhbXM7XG4gICAgICBsZXQgcGFyYW1zUmFuZCA9IHJvdXRlU2NoZW1hLnJhbmRvbVBhcmFtcygpO1xuICAgICAgaWYgKHBhcmFtc1JhbmQgPT09IHVuZGVmaW5lZCB8fCBwYXJhbXNSYW5kID09PSBudWxsKVxuICAgICAgICBwYXJhbXNSYW5kID0ge307XG4gICAgICBwYXJhbXMgPSBtZXJnZURlZXAocGFyYW1zLCBwYXJhbXNSYW5kKTtcbiAgICAgIG9wdGlvbnMuY3JlYXRlZExvZ2dlci5kZWJ1ZyhcIuKcqCB0aGUgZ2VuZXJhdGVkIHBhcmFtczpcIiwgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5jb250ZXh0Py5odHRwPy5ub3RGb3VuZCAmJiBvcHRpb25zLmNvbnRleHQ/Lmh0dHA/LnBhcmFtcz8uc3RyaW5nKVxuICAgICAgb3B0aW9ucy5jb250ZXh0Lmh0dHAucGFyYW1zLnBhcnNlZCA9IHBhcmFtcztcbiAgICBpZiAoIW9wdGlvbnMuY29udGV4dClcbiAgICAgIG9wdGlvbnMuY29udGV4dCA9IHt9O1xuICAgIGNvbnN0IGN0eCA9IG9wdGlvbnMuY29udGV4dDtcbiAgICBjdHguZGV2ZWxvcCA9IHJ1bnRpbWUuZGV2ZWxvcDtcbiAgICBjdHgucGF0aCA9IG9wdGlvbnMucGF0aDtcbiAgICBjdHgucm91dGVUeXBlID0gdHlwZTtcbiAgICBjdHgubG9nZ2VyID0gb3B0aW9ucy5jcmVhdGVkTG9nZ2VyO1xuICAgIGN0eC5lbWl0ID0gcnVudGltZS5lbWl0O1xuICAgIGN0eC5lbWl0QW55QXBwcm92ZWQgPSBydW50aW1lLmVtaXRBbnlBcHByb3ZlZDtcbiAgICBjdHguZW1pdEFsbEFwcHJvdmVkID0gcnVudGltZS5lbWl0QWxsQXBwcm92ZWQ7XG4gICAgY3R4LmV4ZWN1dGVJZCA9IG9wdGlvbnMuY3JlYXRlZEV4ZWN1dGVJZDtcbiAgICBjdHguY29uZmlnID0gcnVudGltZS5ydW50aW1lLmNvbmZpZztcbiAgICBjdHgudHlwaWEgPSBnZW5lcmF0ZWQudHlwaWFTY2hlbWE7XG4gICAgY3R4LmNhbGwgPSAobW9kdWxlLCBwYXJhbXMpID0+IF9fY2FsbChjdHgsIG1vZHVsZSwgcGFyYW1zKTtcbiAgICBjdHgub25GaW5hbGx5ID0gb25GaW5hbGx5O1xuICAgIGN0eC5fID0gcnVudGltZTtcbiAgICBjdHgucmVqZWN0ID0gcmVqZWN0O1xuICAgIGN0eC5yYWlzZSA9IHJhaXNlO1xuICAgIGNvbnN0IHJlc3VsdHMgPSB7IHZhbHVlOiB1bmRlZmluZWQgfTtcbiAgICBjb25zdCBtb2R1bGUgPSByb3V0ZVNjaGVtYS5tb2R1bGU7XG4gICAgY29uc3QgbWV0YSA9IG1vZHVsZT8ubWV0YSA/IG1vZHVsZT8ubWV0YSA6IHt9O1xuICAgIGlmIChvcHRpb25zLmNvbnRleHQuaHR0cD8ucmVxdWVzdD8ubWV0aG9kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGFsbG93TWV0aG9kcyA9IG1ldGE/Lm1ldGhvZHMgPz8gW1wiUE9TVFwiXTtcbiAgICAgIGlmICghYWxsb3dNZXRob2RzLmluY2x1ZGVzKG9wdGlvbnMuY29udGV4dC5odHRwLnJlcXVlc3QubWV0aG9kKSlcbiAgICAgICAgdGhyb3cgcmVqZWN0KFwiTUVUSE9EX05PVF9BTExPV0VEXCIsIHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIGlmIChtZXRhPy50eXBlU2FmZXR5ID09PSB1bmRlZmluZWQgfHwgbWV0YS50eXBlU2FmZXR5ID09PSB0cnVlIHx8IEFycmF5LmlzQXJyYXkobWV0YS50eXBlU2FmZXR5KSAmJiBtZXRhLnR5cGVTYWZldHkuaW5jbHVkZXMoXCJwYXJhbXNcIikpIHtcbiAgICAgIGNvbnN0IHZhbGlkYXRpb24gPSByb3V0ZVNjaGVtYS52YWxpZGF0ZVBhcmFtcyhwYXJhbXMpO1xuICAgICAgaWYgKCF2YWxpZGF0aW9uLnN1Y2Nlc3MpXG4gICAgICAgIHRocm93IHJlamVjdChcIlBBUkFNU19UWVBFX0lOQ09SUkVDVFwiLCB7IC4uLnZhbGlkYXRpb24uZXJyb3JzWzBdLCBtZXNzYWdlOiBgVGhlIHZhbHVlICcke3ZhbGlkYXRpb24uZXJyb3JzWzBdLnBhdGh9JyBpcyAnJHt2YWxpZGF0aW9uLmVycm9yc1swXS52YWx1ZX0nLCB3aGljaCBkb2VzIG5vdCBtZWV0ICcke3ZhbGlkYXRpb24uZXJyb3JzWzBdLmV4cGVjdGVkfScgcmVxdWlyZW1lbnRzLmAgfSk7XG4gICAgfVxuICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIpID8/IHRydWUpIHtcbiAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIsIHsgZXhlY3V0ZUlkOiBvcHRpb25zLmNyZWF0ZWRFeGVjdXRlSWQsIGxvZ2dlcjogb3B0aW9ucy5jcmVhdGVkTG9nZ2VyLCBwYXRoOiBvcHRpb25zLnBhdGgsIG1ldGEsIGNvbnRleHQ6IG9wdGlvbnMuY29udGV4dCwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICB9XG4gICAgcmVzdWx0cy52YWx1ZSA9IGF3YWl0IG1vZHVsZS5oYW5kbGVyKG9wdGlvbnMuY29udGV4dCwgcGFyYW1zKTtcbiAgICBsZXQgZW1wdHlSZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAocmVzdWx0cy52YWx1ZSA9PT0gdW5kZWZpbmVkIHx8IHJlc3VsdHMudmFsdWUgPT09IG51bGwgfHwgcmVzdWx0cy52YWx1ZSA9PT0gXCJcIikge1xuICAgICAgZW1wdHlSZXN1bHQgPSB0cnVlO1xuICAgICAgcmVzdWx0cy52YWx1ZSA9IHt9O1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShyZXN1bHRzLnZhbHVlKSB8fCB0eXBlb2YgcmVzdWx0cy52YWx1ZSAhPT0gXCJvYmplY3RcIikge1xuICAgICAgdGhyb3cgcmVqZWN0KFwiUkVRVUVTVF9GQUlMXCIsIFwiVGhlIHJldHVybiB0eXBlIG9mIHRoZSBoYW5kbGVyIG11c3QgYmUgYW4gJ29iamVjdCcsIHdoaWNoIGlzIGN1cnJlbnRseSBhbiAnJHt0eXBlb2YgdHlwZW9mIHJlc3VsdHMudmFsdWV9Jy5cIik7XG4gICAgfVxuICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIikgPz8gdHJ1ZSkge1xuICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmV4ZWN1dGVBZnRlclwiLCB7IGV4ZWN1dGVJZDogb3B0aW9ucy5jcmVhdGVkRXhlY3V0ZUlkLCBsb2dnZXI6IG9wdGlvbnMuY3JlYXRlZExvZ2dlciwgcGF0aDogb3B0aW9ucy5wYXRoLCBtZXRhLCBjb250ZXh0OiBvcHRpb25zLmNvbnRleHQsIHJlc3VsdHMsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgfVxuICAgIHJldHVybiB7IGV4ZWN1dGVJZCwgaGVhZGVycywgcGFyYW1zLCByZXN1bHRzLCBjb250ZXh0OiBvcHRpb25zLmNvbnRleHQsIG1ldGEsIHR5cGUsIGVtcHR5UmVzdWx0LCBmaW5hbGVzIH07XG4gIH07XG4gIGNvbnN0IF9fY2FsbCA9IGFzeW5jIChjb250ZXh0LCBtb2R1bGUsIHBhcmFtcykgPT4ge1xuICAgIGNvbnN0IHsgaGFuZGxlciB9ID0gYXdhaXQgbW9kdWxlO1xuICAgIHJldHVybiBoYW5kbGVyKGNvbnRleHQsIHBhcmFtcyk7XG4gIH07XG4gIHJldHVybiB7XG4gICAgX19jYWxsLFxuICAgIF9fZXhlY3V0ZVxuICB9O1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL2V2ZW50L2luZGV4LnRzXG52YXIgUkVTT0xWRURfUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZSgpO1xuZnVuY3Rpb24gX19pbml0RXZlbnRNYW5hZ2VyKCkge1xuICBjb25zdCBoYW5kbGVycyA9IG5ldyBNYXA7XG4gIGNvbnN0IGluZGV4ZWQgPSBuZXcgTWFwO1xuICBsZXQgX3ZlcnNpb24gPSAwO1xuICBjb25zdCBldmVudE1hbmFnZXIgPSB7XG4gICAgb246IChrZXksIGhhbmRsZXIpID0+IHtcbiAgICAgIF92ZXJzaW9uKys7XG4gICAgICBoYW5kbGVycy5zZXQoaGFuZGxlciwga2V5KTtcbiAgICAgIGlmIChrZXkgPT09IFwiKlwiKSB7XG4gICAgICAgIGlmIChpbmRleGVkLmhhcyhcIipcIikgPT09IGZhbHNlKSB7XG4gICAgICAgICAgaW5kZXhlZC5zZXQoXCIqXCIsIG5ldyBTZXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdpbGRjYXJkU2V0ID0gaW5kZXhlZC5nZXQoXCIqXCIpO1xuICAgICAgICB3aWxkY2FyZFNldC5hZGQoaGFuZGxlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaW5kZXhlZC5oYXMoa2V5KSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBpbmRleGVkLnNldChrZXksIG5ldyBTZXQpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNldCA9IGluZGV4ZWQuZ2V0KGtleSk7XG4gICAgICAgIHNldC5hZGQoaGFuZGxlcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICBoYW5kbGVycy5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgIGlmIChrZXkgPT09IFwiKlwiKSB7XG4gICAgICAgICAgY29uc3Qgd2lsZGNhcmRTZXQgPSBpbmRleGVkLmdldChcIipcIik7XG4gICAgICAgICAgaWYgKHdpbGRjYXJkU2V0KSB7XG4gICAgICAgICAgICB3aWxkY2FyZFNldC5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHNldCA9IGluZGV4ZWQuZ2V0KGtleSk7XG4gICAgICAgICAgaWYgKHNldCkge1xuICAgICAgICAgICAgc2V0LmRlbGV0ZShoYW5kbGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfSxcbiAgICBvZmY6IChrZXksIGhhbmRsZXIpID0+IHtcbiAgICAgIF92ZXJzaW9uKys7XG4gICAgICBpZiAoa2V5ID09PSBcIipcIikge1xuICAgICAgICBjb25zdCB3aWxkY2FyZFNldCA9IGluZGV4ZWQuZ2V0KFwiKlwiKTtcbiAgICAgICAgaWYgKCF3aWxkY2FyZFNldClcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIGhhbmRsZXJzLmRlbGV0ZShoYW5kbGVyKTtcbiAgICAgICAgd2lsZGNhcmRTZXQuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgc2V0ID0gaW5kZXhlZC5nZXQoa2V5KTtcbiAgICAgICAgaWYgKCFzZXQpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBoYW5kbGVycy5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgIHNldC5kZWxldGUoaGFuZGxlcik7XG4gICAgICB9XG4gICAgfSxcbiAgICBlbWl0OiAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgY29uc3QgaCA9IGluZGV4ZWQuZ2V0KGtleSk7XG4gICAgICBjb25zdCB3aWxkY2FyZEhhbmRsZXJzID0gaW5kZXhlZC5nZXQoXCIqXCIpO1xuICAgICAgaWYgKCF3aWxkY2FyZEhhbmRsZXJzICYmICFoKVxuICAgICAgICByZXR1cm4gUkVTT0xWRURfUFJPTUlTRTtcbiAgICAgIGlmICh3aWxkY2FyZEhhbmRsZXJzICYmIGgpIHtcbiAgICAgICAgcmV0dXJuIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIoeyBrZXksIHZhbHVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaCkge1xuICAgICAgICAgICAgYXdhaXQgaGFuZGxlcih2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuICAgICAgfVxuICAgICAgaWYgKHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgcmV0dXJuIChhc3luYyAoKSA9PiB7XG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIoeyBrZXksIHZhbHVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaCkge1xuICAgICAgICAgIGF3YWl0IGhhbmRsZXIodmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgIH0sXG4gICAgX2hhc0VtaXRIYW5kbGVyczogKGtleSkgPT4ge1xuICAgICAgcmV0dXJuIGluZGV4ZWQuaGFzKGtleSkgfHwgaW5kZXhlZC5oYXMoXCIqXCIpO1xuICAgIH0sXG4gICAgZ2V0IF92ZXJzaW9uKCkge1xuICAgICAgcmV0dXJuIF92ZXJzaW9uO1xuICAgIH0sXG4gICAgZW1pdEFueUFwcHJvdmVkOiBhc3luYyAoa2V5LCB2YWx1ZSkgPT4ge1xuICAgICAgY29uc3Qgd2lsZGNhcmRIYW5kbGVycyA9IGluZGV4ZWQuZ2V0KFwiKlwiKTtcbiAgICAgIGxldCBhY2NlcHRlZCA9IGZhbHNlO1xuICAgICAgaWYgKHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgICBpZiAoYXdhaXQgaGFuZGxlcih7IGtleSwgdmFsdWUgfSkgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGFjY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGggPSBpbmRleGVkLmdldChrZXkpO1xuICAgICAgaWYgKGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGgpIHtcbiAgICAgICAgICBpZiAoYXdhaXQgaGFuZGxlcih2YWx1ZSkgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGFjY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2NlcHRlZDtcbiAgICB9LFxuICAgIGVtaXRBbGxBcHByb3ZlZDogYXN5bmMgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgIGNvbnN0IHdpbGRjYXJkSGFuZGxlcnMgPSBpbmRleGVkLmdldChcIipcIik7XG4gICAgICBsZXQgYXBwcm92ZWQgPSB0cnVlO1xuICAgICAgaWYgKHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIHdpbGRjYXJkSGFuZGxlcnMpIHtcbiAgICAgICAgICBpZiAoYXdhaXQgaGFuZGxlcih7IGtleSwgdmFsdWUgfSkgIT09IHRydWUpIHtcbiAgICAgICAgICAgIGFwcHJvdmVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBoID0gaW5kZXhlZC5nZXQoa2V5KTtcbiAgICAgIGlmIChoKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBoKSB7XG4gICAgICAgICAgaWYgKGF3YWl0IGhhbmRsZXIodmFsdWUpICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBhcHByb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGFwcHJvdmVkO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGV2ZW50TWFuYWdlcjtcbn1cbi8vIHBhY2thZ2VzL21pbGtpby9mbG93L2luZGV4LnRzXG5mdW5jdGlvbiBjcmVhdGVGbG93KCkge1xuICBsZXQgc3RhdHVzID0gXCJwZW5kaW5nXCI7XG4gIGNvbnN0IGZsb3dzID0gW107XG4gIGNvbnN0IGl0ZXJhdG9yID0ge1xuICAgIGVtaXQ6IChmbG93KSA9PiB7XG4gICAgICBpZiAoZmxvd3MuYXQoLTEpPy5ibGFuayA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBpdGVtID0gZmxvd3MuYXQoLTEpO1xuICAgICAgICBpdGVtLmJsYW5rID0gZmFsc2U7XG4gICAgICAgIGl0ZW0ucmVzb2x2ZShmbG93KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gUHJvbWlzZS53aXRoUmVzb2x2ZXJzKCk7XG4gICAgICAgIHJlc29sdmVycy5yZXNvbHZlKGZsb3cpO1xuICAgICAgICBmbG93cy5wdXNoKHsgLi4ucmVzb2x2ZXJzLCBibGFuazogZmFsc2UgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICAuLi57XG4gICAgICBhc3luYyBuZXh0KCkge1xuICAgICAgICBpZiAoc3RhdHVzICE9PSBcInBlbmRpbmdcIilcbiAgICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlLCB2YWx1ZTogbnVsbCB9O1xuICAgICAgICBpZiAoZmxvd3MubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgY29uc3QgcmVzb2x2ZXJzID0gUHJvbWlzZS53aXRoUmVzb2x2ZXJzKCk7XG4gICAgICAgICAgZmxvd3MucHVzaCh7IC4uLnJlc29sdmVycywgYmxhbms6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZmxvdyA9IGZsb3dzLmF0KDApO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmbG93LnByb21pc2U7XG4gICAgICAgIGZsb3dzLnNoaWZ0KCk7XG4gICAgICAgIHJldHVybiB7IGRvbmU6IHN0YXR1cyAhPT0gXCJwZW5kaW5nXCIsIHZhbHVlOiByZXN1bHQgfTtcbiAgICAgIH0sXG4gICAgICBhc3luYyByZXR1cm4oKSB7XG4gICAgICAgIHN0YXR1cyA9IFwicmVzb2x2ZWRcIjtcbiAgICAgICAgZm9yIChjb25zdCBmbG93IG9mIGZsb3dzKSB7XG4gICAgICAgICAgZmxvdy5ibGFuayA9IGZhbHNlO1xuICAgICAgICAgIGZsb3cucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGRvbmU6IHRydWUsIHZhbHVlOiBudWxsIH07XG4gICAgICB9LFxuICAgICAgYXN5bmMgdGhyb3coZXJyKSB7XG4gICAgICAgIHN0YXR1cyA9IFwicmVqZWN0ZWRcIjtcbiAgICAgICAgaWYgKGZsb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVycyA9IFByb21pc2Uud2l0aFJlc29sdmVycygpO1xuICAgICAgICAgIGZsb3dzLnB1c2goeyAuLi5yZXNvbHZlcnMsIGJsYW5rOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoY29uc3QgZmxvdyBvZiBmbG93cykge1xuICAgICAgICAgIGZsb3cuYmxhbmsgPSBmYWxzZTtcbiAgICAgICAgICBmbG93LnJlamVjdChlcnIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGRvbmU6IHRydWUsIHZhbHVlOiBudWxsIH07XG4gICAgICB9XG4gICAgfSxcbiAgICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuICByZXR1cm4gaXRlcmF0b3I7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvY3JlYXRlLWlkLnRzXG52YXIgRU5DT0RJTkcgPSBcIjAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG52YXIgRU5DT0RJTkdfTEVOID0gRU5DT0RJTkcubGVuZ3RoO1xudmFyIF9fZmFzdElkUG9vbCA9IG5ldyBVaW50OEFycmF5KDI1Nik7XG52YXIgX19mYXN0SWRQb29sSW5kZXggPSAyNTY7XG52YXIgX19mYXN0SWRDb3VudGVyID0gMDtcbmZ1bmN0aW9uIF9fY3JlYXRlSWQoKSB7XG4gIGlmIChfX2Zhc3RJZFBvb2xJbmRleCArIDE2ID4gMjU2KSB7XG4gICAgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhfX2Zhc3RJZFBvb2wpO1xuICAgIF9fZmFzdElkUG9vbEluZGV4ID0gMDtcbiAgfVxuICBjb25zdCB0cyA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpLnBhZFN0YXJ0KDgsIFwiMFwiKTtcbiAgbGV0IGlkID0gdHM7XG4gIGZvciAobGV0IGkgPSAwO2kgPCA2OyBpKyspIHtcbiAgICBpZCArPSBFTkNPRElORy5jaGFyQXQoX19mYXN0SWRQb29sW19fZmFzdElkUG9vbEluZGV4KytdICUgRU5DT0RJTkdfTEVOKTtcbiAgfVxuICBjb25zdCBjb3VudGVyID0gX19mYXN0SWRDb3VudGVyKys7XG4gIGZvciAobGV0IGkgPSAwO2kgPCAxMDsgaSsrKSB7XG4gICAgY29uc3QgbWl4ID0gY291bnRlciArIF9fZmFzdElkUG9vbFtfX2Zhc3RJZFBvb2xJbmRleCsrICUgMjU2XSAmIDY1NTM1O1xuICAgIGlkICs9IEVOQ09ESU5HLmNoYXJBdChtaXggJSBFTkNPRElOR19MRU4pO1xuICB9XG4gIHJldHVybiBpZDtcbn1cblxuLy8gcGFja2FnZXMvbWlsa2lvL2V4ZWN1dGUvZXhlY3V0ZS1pZC1nZW5lcmF0b3IudHNcbmZ1bmN0aW9uIGRlZmluZURlZmF1bHRFeGVjdXRlSWRHZW5lcmF0b3IoKSB7XG4gIHJldHVybiBfX2NyZWF0ZUlkO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vd29ybGQvaW5kZXgudHNcbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVdvcmxkKGdlbmVyYXRlZCwgY29uZmlnU2NoZW1hLCBvcHRpb25zKSB7XG4gIGNvbnN0IGV4ZWN1dGVJZCA9IG9wdGlvbnMuZXhlY3V0ZUlkID8/IGRlZmluZURlZmF1bHRFeGVjdXRlSWRHZW5lcmF0b3IoKTtcbiAgY29uc3QgY29uZmlnID0gYXdhaXQgY29uZmlnU2NoZW1hLmdldCgpO1xuICBjb25zdCBydW50aW1lID0ge1xuICAgIHJlcXVlc3Q6IG5ldyBNYXAsXG4gICAgY29uZmlnXG4gIH07XG4gIGNvbnN0IGV2ZW50TWFuYWdlciA9IF9faW5pdEV2ZW50TWFuYWdlcigpO1xuICBpZiAob3B0aW9ucy5hY2Nlc3NLZXkpXG4gICAgb3B0aW9ucy5pZ25vcmVQYXRoTGV2ZWwgPSBvcHRpb25zLmlnbm9yZVBhdGhMZXZlbCA/IG9wdGlvbnMuaWdub3JlUGF0aExldmVsICsgMSA6IDE7XG4gIGNvbnN0IF8gPSB7XG4gICAgLi4ub3B0aW9ucyxcbiAgICBleGVjdXRlSWQsXG4gICAgcnVudGltZSxcbiAgICBvbjogZXZlbnRNYW5hZ2VyLm9uLFxuICAgIG9mZjogZXZlbnRNYW5hZ2VyLm9mZixcbiAgICBlbWl0OiBldmVudE1hbmFnZXIuZW1pdCxcbiAgICBlbWl0QW55QXBwcm92ZWQ6IGV2ZW50TWFuYWdlci5lbWl0QW55QXBwcm92ZWQsXG4gICAgZW1pdEFsbEFwcHJvdmVkOiBldmVudE1hbmFnZXIuZW1pdEFsbEFwcHJvdmVkLFxuICAgIF9oYXNFbWl0SGFuZGxlcnM6IGV2ZW50TWFuYWdlci5faGFzRW1pdEhhbmRsZXJzLFxuICAgIF9lbWl0SGFuZGxlcnNWZXJzaW9uOiBldmVudE1hbmFnZXIuX3ZlcnNpb25cbiAgfTtcbiAgY29uc3QgZXhlY3V0ZXIgPSBfX2luaXRFeGVjdXRlcihnZW5lcmF0ZWQsIF8pO1xuICBjb25zdCBsaXN0ZW5lciA9IF9faW5pdExpc3RlbmVyKGdlbmVyYXRlZCwgXywgZXhlY3V0ZXIpO1xuICBjb25zdCB3b3JsZCA9IHtcbiAgICBfLFxuICAgIG9uOiBldmVudE1hbmFnZXIub24sXG4gICAgb2ZmOiBldmVudE1hbmFnZXIub2ZmLFxuICAgIGVtaXQ6IGV2ZW50TWFuYWdlci5lbWl0LFxuICAgIGVtaXRBbnlBcHByb3ZlZDogZXZlbnRNYW5hZ2VyLmVtaXRBbnlBcHByb3ZlZCxcbiAgICBlbWl0QWxsQXBwcm92ZWQ6IGV2ZW50TWFuYWdlci5lbWl0QWxsQXBwcm92ZWQsXG4gICAgbGlzdGVuZXIsXG4gICAgY29uZmlnLFxuICAgIGlzVGVzdE1vZGU6IGNvbmZpZz8ubW9kZSA9PT0gXCJ0ZXN0XCJcbiAgfTtcbiAgcnVudGltZS5hcHAgPSB3b3JsZDtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ib290c3RyYXBzKSkge1xuICAgIGZvciAoY29uc3QgYm9vdHN0cmFwIG9mIG9wdGlvbnMuYm9vdHN0cmFwcykge1xuICAgICAgYXdhaXQgYm9vdHN0cmFwKHdvcmxkKTtcbiAgICB9XG4gIH1cbiAgYXdhaXQgUHJvbWlzZS5hbGwoZ2VuZXJhdGVkLmhhbmRsZXJTY2hlbWEubG9hZEhhbmRsZXJzKHdvcmxkKSk7XG4gIGNvbnN0IHJvdXRlS2V5cyA9IE9iamVjdC5rZXlzKGdlbmVyYXRlZC5yb3V0ZVNjaGVtYSk7XG4gIGNvbnN0IHJhd1BhdGhzID0gZ2VuZXJhdGVkLnJhd1NjaGVtYT8ucmF3UGF0aHMgPyBBcnJheS5mcm9tKGdlbmVyYXRlZC5yYXdTY2hlbWEucmF3UGF0aHMpIDogW107XG4gIGNvbnN0IGFsbFJvdXRlcyA9IFsuLi5yb3V0ZUtleXMsIC4uLnJhd1BhdGhzXTtcbiAgY29uc29sZS5sb2coYFxu4pazIFJvdXRlczpcbiAgICAke2FsbFJvdXRlcy5qb2luKGBcbiAgICBgKX1cbiAgQSB0b3RhbCBvZiAke2FsbFJvdXRlcy5sZW5ndGh9IHJvdXRlcy5gKTtcbiAgY29uc29sZS5sb2coYFxu4pazIFNlcnZlcjogaHR0cDovL2xvY2FsaG9zdDoke29wdGlvbnMucG9ydH1gKTtcbiAgcmV0dXJuIHdvcmxkO1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3R5cGlhL2luZGV4LnRzXG5mdW5jdGlvbiB0eXBpYShpbml0KSB7XG4gIHJldHVybiBpbml0O1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL3NlbmQtY29va2Jvb2stZXZlbnQudHNcbmFzeW5jIGZ1bmN0aW9uIHNlbmRDb29rYm9va0V2ZW50KHJ1bnRpbWUsIGV2ZW50KSB7fVxuXG4vLyBwYWNrYWdlcy9taWxraW8vbG9nZ2VyL2luZGV4LnRzXG5mdW5jdGlvbiBmYXN0VGltZXN0YW1wKCkge1xuICBjb25zdCBkID0gbmV3IERhdGU7XG4gIHJldHVybiBgKCR7ZC5nZXRGdWxsWWVhcigpfS0ke1N0cmluZyhkLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCBcIjBcIil9LSR7U3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIil9ICR7U3RyaW5nKGQuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfToke1N0cmluZyhkLmdldE1pbnV0ZXMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfToke1N0cmluZyhkLmdldFNlY29uZHMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfSlgO1xufVxudmFyIGRlZmF1bHRJbnNlcnRpbmcgPSAobG9nKSA9PiB7XG4gIGxvZ1swXSA9IGBcbiR7bG9nWzBdfWA7XG4gIGNvbnNvbGUubG9nKC4uLmxvZyk7XG4gIHJldHVybiB0cnVlO1xufTtcbmZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihydW50aW1lLCBwYXRoLCBleGVjdXRlSWQpIHtcbiAgY29uc3QgbG9nZ2VyID0ge307XG4gIGNvbnN0IGxvZ3MgPSBbXTtcbiAgY29uc3QgdGFncyA9IG5ldyBNYXA7XG4gIGNvbnN0IGluc2VydGluZyA9IHJ1bnRpbWUub25Mb2dnZXJJbnNlcnRpbmcgfHwgZGVmYXVsdEluc2VydGluZztcbiAgY29uc3QgaGFzU3VibWl0dGluZyA9ICEhcnVudGltZS5vbkxvZ2dlclN1Ym1pdHRpbmc7XG4gIGNvbnN0IGlzRGV2ZWxvcCA9IHJ1bnRpbWUuZGV2ZWxvcDtcbiAgbG9nZ2VyLl8gPSB7XG4gICAgbG9ncyxcbiAgICB0YWdzLFxuICAgIHN1Ym1pdDogKGNvbnRleHQpID0+IHtcbiAgICAgIGlmICghcnVudGltZS5vbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHJldHVybiBydW50aW1lLm9uTG9nZ2VyU3VibWl0dGluZyhjb250ZXh0LCBsb2dzLCB0YWdzKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IF9fdGFnUHVzaCA9IChrZXksIHZhbHVlKSA9PiB7XG4gICAgdGFncy5zZXQoa2V5LCB2YWx1ZSk7XG4gIH07XG4gIGNvbnN0IF9fbG9nUHVzaCA9IChsb2cpID0+IHtcbiAgICBpZiAoIWluc2VydGluZyhsb2cpKVxuICAgICAgcmV0dXJuIGxvZztcbiAgICBpZiAoaGFzU3VibWl0dGluZylcbiAgICAgIGxvZ3MucHVzaChbLi4ubG9nXSk7XG4gICAgaWYgKGlzRGV2ZWxvcClcbiAgICAgIHNlbmRDb29rYm9va0V2ZW50KHJ1bnRpbWUsIHsgdHlwZTogXCJtaWxraW9AbG9nZ2VyXCIsIGxvZyB9KTtcbiAgICByZXR1cm4gbG9nO1xuICB9O1xuICBsb2dnZXIuc2V0VGFnID0gX190YWdQdXNoO1xuICBsb2dnZXIuc2V0TG9nID0gKC4uLmxvZykgPT4gX19sb2dQdXNoKGxvZyk7XG4gIGNvbnN0IGdldE5vdyA9IGZhc3RUaW1lc3RhbXA7XG4gIGxvZ2dlci5kZWJ1ZyA9IChkZXNjcmlwdGlvbiwgLi4ucGFyYW1zKSA9PiBfX2xvZ1B1c2goW1wiKGRlYnVnKVwiLCBwYXRoLCBleGVjdXRlSWQsIGdldE5vdygpLCBgXG4ke2Rlc2NyaXB0aW9ufWAsIC4uLnBhcmFtc10pO1xuICBsb2dnZXIuaW5mbyA9IChkZXNjcmlwdGlvbiwgLi4ucGFyYW1zKSA9PiBfX2xvZ1B1c2goW1wiKGluZm8pXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIGxvZ2dlci53YXJuID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIod2FybilcIiwgcGF0aCwgZXhlY3V0ZUlkLCBnZXROb3coKSwgYFxuJHtkZXNjcmlwdGlvbn1gLCAuLi5wYXJhbXNdKTtcbiAgbG9nZ2VyLmVycm9yID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIoZXJyb3IpXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIGxvZ2dlci5yZXF1ZXN0ID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIocmVxdWVzdClcIiwgcGF0aCwgZXhlY3V0ZUlkLCBnZXROb3coKSwgYFxuJHtkZXNjcmlwdGlvbn1gLCAuLi5wYXJhbXNdKTtcbiAgbG9nZ2VyLnJlc3BvbnNlID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIocmVzcG9uc2UpXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIHJldHVybiBsb2dnZXI7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vc3RlcC9pbmRleC50c1xuZnVuY3Rpb24gY3JlYXRlU3RlcCgpIHtcbiAgY29uc3Qgc3RlcENvbnRyb2xsZXIgPSB7XG4gICAgJG1pbGtpb1R5cGU6IFwic3RlcFwiLFxuICAgIF9zdGVwczogW10sXG4gICAgc3RlcChoYW5kbGVyKSB7XG4gICAgICBzdGVwQ29udHJvbGxlci5fc3RlcHMucHVzaChoYW5kbGVyKTtcbiAgICAgIHJldHVybiBzdGVwQ29udHJvbGxlcjtcbiAgICB9LFxuICAgIGFzeW5jIHJ1bigpIHtcbiAgICAgIGxldCBzdGFnZSA9IHt9O1xuICAgICAgZm9yIChjb25zdCBzdGVwIG9mIHN0ZXBDb250cm9sbGVyLl9zdGVwcykge1xuICAgICAgICBzdGFnZSA9IHsgLi4uc3RhZ2UsIC4uLmF3YWl0IHN0ZXAoc3RhZ2UpIH07XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHN0YWdlKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gc3RhZ2Vba2V5XTtcbiAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aChcIl9cIikpXG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuICByZXR1cm4gc3RlcENvbnRyb2xsZXI7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvdHJpZS50c1xuY2xhc3MgVHJpZSB7XG4gIHJvb3Q7XG4gIGNhY2hlO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnJvb3QgPSBuZXcgVHJpZU5vZGU7XG4gICAgdGhpcy5jYWNoZSA9IG5ldyBNYXA7XG4gIH1cbiAgYWRkKHBhdGgsIHZhbHVlKSB7XG4gICAgY29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpLnNwbGl0KFwiL1wiKS5maWx0ZXIoKHApID0+IHAgIT09IFwiXCIpO1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IHRoaXMucm9vdDtcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjdXJyZW50Tm9kZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5jYWNoZS5zZXQocGF0aCwgdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgIGlmICghY3VycmVudE5vZGUuY2hpbGRyZW4uaGFzKHBhcnQpKSB7XG4gICAgICAgIGN1cnJlbnROb2RlLmNoaWxkcmVuLnNldChwYXJ0LCBuZXcgVHJpZU5vZGUpO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5jaGlsZHJlbi5nZXQocGFydCk7XG4gICAgfVxuICAgIGN1cnJlbnROb2RlLnZhbHVlID0gdmFsdWU7XG4gICAgdGhpcy5jYWNoZS5zZXQocGF0aCwgdmFsdWUpO1xuICB9XG4gIGdldChwYXRoKSB7XG4gICAgY29uc3QgY2FjaGVkID0gdGhpcy5jYWNoZS5nZXQocGF0aCk7XG4gICAgaWYgKGNhY2hlZCAhPT0gdW5kZWZpbmVkKVxuICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICBjb25zdCBwYXJ0cyA9IHBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywgXCJcIikuc3BsaXQoXCIvXCIpLmZpbHRlcigocCkgPT4gcCAhPT0gXCJcIik7XG4gICAgbGV0IGN1cnJlbnROb2RlID0gdGhpcy5yb290O1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgaWYgKCFjdXJyZW50Tm9kZS5jaGlsZHJlbi5oYXMocGFydCkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLmNoaWxkcmVuLmdldChwYXJ0KTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gY3VycmVudE5vZGUudmFsdWU7XG4gICAgaWYgKHJlc3VsdCAhPT0gbnVsbClcbiAgICAgIHRoaXMuY2FjaGUuc2V0KHBhdGgsIHJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBnZXRCeVBhcnRzKHBhcnRzKSB7XG4gICAgbGV0IGN1cnJlbnROb2RlID0gdGhpcy5yb290O1xuICAgIGZvciAoY29uc3QgcGFydCBvZiBwYXJ0cykge1xuICAgICAgaWYgKCFjdXJyZW50Tm9kZS5jaGlsZHJlbi5oYXMocGFydCkpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5jaGlsZHJlbi5nZXQocGFydCk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50Tm9kZS52YWx1ZTtcbiAgfVxuICBoYXMocGF0aCkge1xuICAgIHJldHVybiB0aGlzLmdldChwYXRoKSAhPT0gbnVsbDtcbiAgfVxufVxuXG5jbGFzcyBUcmllTm9kZSB7XG4gIGNoaWxkcmVuO1xuICB2YWx1ZTtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jaGlsZHJlbiA9IG5ldyBNYXA7XG4gICAgdGhpcy52YWx1ZSA9IG51bGw7XG4gIH1cbn1cblxuLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL2J1aWxkLWNvcnMtaGVhZGVycy50c1xuZnVuY3Rpb24gYnVpbGRDb3JzSGVhZGVycyhjb3JzLCBvcmlnaW4pIHtcbiAgY29uc3QgcmVzdWx0ID0ge307XG4gIGlmIChjb3JzPy5jb3JzQWxsb3dNZXRob2RzKVxuICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHNcIl0gPSBjb3JzLmNvcnNBbGxvd01ldGhvZHMuam9pbihcIiwgXCIpO1xuICBpZiAoY29ycz8uY29yc0FsbG93SGVhZGVycylcbiAgICByZXN1bHRbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzXCJdID0gY29ycy5jb3JzQWxsb3dIZWFkZXJzLmpvaW4oXCIsIFwiKTtcbiAgaWYgKGNvcnM/LmNvcnNNYXhBZ2UgIT09IHVuZGVmaW5lZClcbiAgICByZXN1bHRbXCJBY2Nlc3MtQ29udHJvbC1NYXgtQWdlXCJdID0gU3RyaW5nKGNvcnMuY29yc01heEFnZSk7XG4gIGlmIChjb3JzPy5jb3JzQWxsb3dPcmlnaW4gJiYgY29ycy5jb3JzQWxsb3dPcmlnaW4ubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGlzV2lsZGNhcmQgPSBjb3JzLmNvcnNBbGxvd09yaWdpbi5pbmNsdWRlcyhcIipcIik7XG4gICAgaWYgKGNvcnMuY29yc0FsbG93Q3JlZGVudGlhbHMpIHtcbiAgICAgIGlmIChvcmlnaW4gJiYgKGlzV2lsZGNhcmQgfHwgY29ycy5jb3JzQWxsb3dPcmlnaW4uaW5jbHVkZXMob3JpZ2luKSkpIHtcbiAgICAgICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCJdID0gb3JpZ2luO1xuICAgICAgICByZXN1bHRbXCJWYXJ5XCJdID0gXCJPcmlnaW5cIjtcbiAgICAgICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIl0gPSBcInRydWVcIjtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzV2lsZGNhcmQpIHtcbiAgICAgICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luXCJdID0gXCIqXCI7XG4gICAgICB9IGVsc2UgaWYgKG9yaWdpbiAmJiBjb3JzLmNvcnNBbGxvd09yaWdpbi5pbmNsdWRlcyhvcmlnaW4pKSB7XG4gICAgICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiXSA9IG9yaWdpbjtcbiAgICAgICAgcmVzdWx0W1wiVmFyeVwiXSA9IFwiT3JpZ2luXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChjb3JzPy5jb3JzRXhwb3NlSGVhZGVycyAmJiBjb3JzLmNvcnNFeHBvc2VIZWFkZXJzLmxlbmd0aCA+IDApXG4gICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtRXhwb3NlLUhlYWRlcnNcIl0gPSBjb3JzLmNvcnNFeHBvc2VIZWFkZXJzLmpvaW4oXCIsIFwiKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL3Nhbml0aXplLWV4ZWN1dGUtaWQudHNcbmZ1bmN0aW9uIHNhbml0aXplRXhlY3V0ZUlkKGV4ZWN1dGVJZCkge1xuICBjb25zdCB2YWx1ZSA9IHR5cGVvZiBleGVjdXRlSWQgPT09IFwic3RyaW5nXCIgPyBleGVjdXRlSWQgOiBcIlwiO1xuICByZXR1cm4gdmFsdWUucmVwbGFjZSgvW15BLVphLXowLTlfLV0vZywgXCJcIik7XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby9saXN0ZW5lci9pbmRleC50c1xuZnVuY3Rpb24gX19pbml0TGlzdGVuZXIoZ2VuZXJhdGVkLCBydW50aW1lLCBleGVjdXRlcikge1xuICBjb25zdCBwb3J0ID0gcnVudGltZS5wb3J0O1xuICBjb25zdCB0cmllID0gbmV3IFRyaWU7XG4gIGNvbnN0IGNvcnMgPSB7IGNvcnNBbGxvd01ldGhvZHM6IFtcIlBPU1RcIiwgXCJPUFRJT05TXCJdLCBjb3JzQWxsb3dIZWFkZXJzOiBbXCJDb250ZW50LVR5cGVcIiwgXCJBdXRob3JpemF0aW9uXCJdLCBjb3JzTWF4QWdlOiAwLCAuLi5ydW50aW1lLmh0dHA/LmNvcnMgfTtcbiAgY29uc3QgY29yc0hlYWRlcnNDYWNoZSA9IG5ldyBNYXA7XG4gIGNvbnN0IE1BWF9DT1JTX0hFQURFUlNfQ0FDSEVfU0laRSA9IDEwMjQ7XG4gIGNvbnN0IGdldENvcnNIZWFkZXJzID0gKG9yaWdpbikgPT4ge1xuICAgIGNvbnN0IGtleSA9IG9yaWdpbiA/PyBcIlwiO1xuICAgIGxldCBjYWNoZWQgPSBjb3JzSGVhZGVyc0NhY2hlLmdldChrZXkpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgaWYgKGNvcnNIZWFkZXJzQ2FjaGUuc2l6ZSA+PSBNQVhfQ09SU19IRUFERVJTX0NBQ0hFX1NJWkUpXG4gICAgICBjb3JzSGVhZGVyc0NhY2hlLmNsZWFyKCk7XG4gICAgY2FjaGVkID0gYnVpbGRDb3JzSGVhZGVycyhjb3JzLCBvcmlnaW4pO1xuICAgIGNvcnNIZWFkZXJzQ2FjaGUuc2V0KGtleSwgY2FjaGVkKTtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9O1xuICBjb25zdCBkZWZhdWx0UmVzcG9uc2VIZWFkZXJzID0ge1xuICAgIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIsXG4gICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgfTtcbiAgY29uc3QgZGVmYXVsdE1lcmdlZEhlYWRlcnMgPSB7IC4uLmdldENvcnNIZWFkZXJzKG51bGwpLCAuLi5kZWZhdWx0UmVzcG9uc2VIZWFkZXJzIH07XG4gIGNvbnN0IGVtcHR5UmVzdWx0UHJlZml4ID0gJ3tcImRhdGFcIjp7fSxcImV4ZWN1dGVJZFwiOlwiJztcbiAgY29uc3QgcmVzdWx0UHJlZml4ID0gJ3tcImRhdGFcIjonO1xuICBjb25zdCBpZFN1ZmZpeCA9ICdcIixcInN1Y2Nlc3NcIjp0cnVlfSc7XG4gIGNvbnN0IGZhc3RQYXRoUmVzcG9uc2UgPSB7IGJvZHk6IFwiXCIsIHN0YXR1czogMjAwLCBoZWFkZXJzOiBkZWZhdWx0TWVyZ2VkSGVhZGVycyB9O1xuICBsZXQgY2FjaGVkTm9FbWl0SGFuZGxlcnMgPSB0cnVlO1xuICBsZXQgbGFzdEVtaXRIYW5kbGVyc1ZlcnNpb24gPSAtMTtcbiAgY29uc3QgY2hlY2tOb0VtaXRIYW5kbGVycyA9ICgpID0+IHtcbiAgICBjb25zdCB2ID0gcnVudGltZS5fZW1pdEhhbmRsZXJzVmVyc2lvbjtcbiAgICBpZiAodiAhPT0gbGFzdEVtaXRIYW5kbGVyc1ZlcnNpb24pIHtcbiAgICAgIGxhc3RFbWl0SGFuZGxlcnNWZXJzaW9uID0gdjtcbiAgICAgIGNhY2hlZE5vRW1pdEhhbmRsZXJzID0gIXJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmV4ZWN1dGVCZWZvcmVcIikgJiYgIXJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmV4ZWN1dGVBZnRlclwiKSAmJiAhcnVudGltZS5faGFzRW1pdEhhbmRsZXJzPy4oXCJtaWxraW86aHR0cFJlcXVlc3RcIikgJiYgIXJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSAmJiAhcnVudGltZS5faGFzRW1pdEhhbmRsZXJzPy4oXCJtaWxraW86aHR0cE5vdEZvdW5kXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY2FjaGVkTm9FbWl0SGFuZGxlcnM7XG4gIH07XG4gIGNvbnN0IGhhc09uTG9nZ2VyU3VibWl0dGluZyA9ICEhcnVudGltZS5vbkxvZ2dlclN1Ym1pdHRpbmc7XG4gIGNvbnN0IG5vb3BMb2dnZXIgPSB7XG4gICAgXzogeyBsb2dzOiBbXSwgdGFnczogbmV3IE1hcCwgc3VibWl0OiAoKSA9PiB7fSB9LFxuICAgIHNldFRhZzogKCkgPT4ge30sXG4gICAgc2V0TG9nOiAoLi4uX2xvZykgPT4gKHt9KSxcbiAgICBkZWJ1ZzogKF9kZXNjcmlwdGlvbiwgLi4uX3BhcmFtcykgPT4gKHt9KSxcbiAgICBpbmZvOiAoX2Rlc2NyaXB0aW9uLCAuLi5fcGFyYW1zKSA9PiAoe30pLFxuICAgIHdhcm46IChfZGVzY3JpcHRpb24sIC4uLl9wYXJhbXMpID0+ICh7fSksXG4gICAgZXJyb3I6IChfZGVzY3JpcHRpb24sIC4uLl9wYXJhbXMpID0+ICh7fSksXG4gICAgcmVxdWVzdDogKF9kZXNjcmlwdGlvbiwgLi4uX3BhcmFtcykgPT4gKHt9KSxcbiAgICByZXNwb25zZTogKF9kZXNjcmlwdGlvbiwgLi4uX3BhcmFtcykgPT4gKHt9KVxuICB9O1xuICBjb25zdCBiYXNlQ29udGV4dFByb3RvID0ge1xuICAgIHJlamVjdCxcbiAgICBkZXZlbG9wOiBydW50aW1lLmRldmVsb3AsXG4gICAgbG9nZ2VyOiBub29wTG9nZ2VyLFxuICAgIGVtaXQ6IHJ1bnRpbWUuZW1pdCxcbiAgICBlbWl0QW55QXBwcm92ZWQ6IHJ1bnRpbWUuZW1pdEFueUFwcHJvdmVkLFxuICAgIGVtaXRBbGxBcHByb3ZlZDogcnVudGltZS5lbWl0QWxsQXBwcm92ZWQsXG4gICAgY29uZmlnOiBydW50aW1lLnJ1bnRpbWUuY29uZmlnLFxuICAgIHR5cGlhOiBnZW5lcmF0ZWQudHlwaWFTY2hlbWEsXG4gICAgb25GaW5hbGx5OiAoKSA9PiB7fSxcbiAgICBfOiBydW50aW1lLFxuICAgIGNhbGwobW9kdWxlLCBwKSB7XG4gICAgICByZXR1cm4gZXhlY3V0ZXIuX19jYWxsKHRoaXMsIG1vZHVsZSwgcCk7XG4gICAgfVxuICB9O1xuICBsZXQgY2FjaGVkUm91dGVTY2hlbWEgPSBudWxsO1xuICBsZXQgY2FjaGVkUGF0aFN0cmluZyA9IG51bGw7XG4gIGxldCBjYWNoZWRWYWxpZGF0ZVBhcmFtcyA9IG51bGw7XG4gIGxldCBjYWNoZWRIYW5kbGVyID0gbnVsbDtcbiAgbGV0IGNhY2hlZFNraXBWYWxpZGF0aW9uID0gZmFsc2U7XG4gIGNvbnN0IGZldGNoID0gYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgICBjb25zdCBNQVhfQk9EWV9TSVpFID0gMTAgKiAxMDI0ICogMTAyNDtcbiAgICBjb25zdCB0b29MYXJnZSA9ICgpID0+IHJlamVjdChcIlJFUVVFU1RfVE9PX0xBUkdFXCIsIHsgbWF4Qm9keVNpemU6IE1BWF9CT0RZX1NJWkUgfSk7XG4gICAgY29uc3QgcmVhZEJvZHlUZXh0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHJlUmVhZCA9IG9wdGlvbnMucmVxdWVzdC5fX2JvZHlUZXh0O1xuICAgICAgaWYgKHByZVJlYWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodHlwZW9mIHByZVJlYWQgPT09IFwic3RyaW5nXCIgJiYgcHJlUmVhZC5sZW5ndGggPiBNQVhfQk9EWV9TSVpFKVxuICAgICAgICAgIHRocm93IHRvb0xhcmdlKCk7XG4gICAgICAgIHJldHVybiBwcmVSZWFkO1xuICAgICAgfVxuICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IE51bWJlcihvcHRpb25zLnJlcXVlc3QuaGVhZGVycy5nZXQoXCJjb250ZW50LWxlbmd0aFwiKSA/PyBcIjBcIik7XG4gICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKGNvbnRlbnRMZW5ndGgpICYmIGNvbnRlbnRMZW5ndGggPiBNQVhfQk9EWV9TSVpFKVxuICAgICAgICB0aHJvdyB0b29MYXJnZSgpO1xuICAgICAgaWYgKCFvcHRpb25zLnJlcXVlc3QuYm9keSlcbiAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICBjb25zdCByZWFkZXIgPSBvcHRpb25zLnJlcXVlc3QuYm9keS5nZXRSZWFkZXIoKTtcbiAgICAgIGNvbnN0IGRlY29kZXIgPSBuZXcgVGV4dERlY29kZXI7XG4gICAgICBsZXQgdGV4dCA9IFwiXCI7XG4gICAgICB0cnkge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IHsgZG9uZSwgdmFsdWUgfSA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgICAgICAgaWYgKGRvbmUpXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB0ZXh0ICs9IGRlY29kZXIuZGVjb2RlKHZhbHVlLCB7IHN0cmVhbTogdHJ1ZSB9KTtcbiAgICAgICAgICBpZiAodGV4dC5sZW5ndGggPiBNQVhfQk9EWV9TSVpFKSB7XG4gICAgICAgICAgICBhd2FpdCByZWFkZXIuY2FuY2VsKCkuY2F0Y2goKCkgPT4ge30pO1xuICAgICAgICAgICAgdGhyb3cgdG9vTGFyZ2UoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGV4dCArPSBkZWNvZGVyLmRlY29kZSgpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgcmVhZGVyLnJlbGVhc2VMb2NrKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9O1xuICAgIGNvbnN0IG9yaWdpbiA9IG9wdGlvbnMucmVxdWVzdC5fX29yaWdpbiA/PyBvcHRpb25zLnJlcXVlc3QuaGVhZGVycy5nZXQoXCJPcmlnaW5cIik7XG4gICAgaWYgKG9wdGlvbnMucmVxdWVzdC5tZXRob2QgPT09IFwiT1BUSU9OU1wiKSB7XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwge1xuICAgICAgICBoZWFkZXJzOiBnZXRDb3JzSGVhZGVycyhvcmlnaW4pXG4gICAgICB9KTtcbiAgICB9XG4gICAgY29uc3QgcGF0aG5hbWUgPSBvcHRpb25zLnJlcXVlc3QuX19wYXRobmFtZSA/PyBuZXcgVVJMKG9wdGlvbnMucmVxdWVzdC51cmwpLnBhdGhuYW1lO1xuICAgIGlmIChwYXRobmFtZS5lbmRzV2l0aChcIi9nZW5lcmF0ZV8yMDRcIikpIHtcbiAgICAgIGNvbnN0IGNvcnNIZWFkZXJzID0gZ2V0Q29yc0hlYWRlcnMob3JpZ2luKTtcbiAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge1xuICAgICAgICBzdGF0dXM6IDIwNCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIFNlcnZlcjogXCJtaWxraW9cIixcbiAgICAgICAgICAuLi5jb3JzSGVhZGVycyxcbiAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1zdG9yZVwiLFxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IGB0ZXh0L3BsYWluOyB0aW1lPSR7RGF0ZS5ub3coKX1gXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBwcmVQYXRoQXJyYXkgPSBvcHRpb25zLnJlcXVlc3QuX19wYXRoQXJyYXk7XG4gICAgbGV0IHBhdGhTdHJpbmc7XG4gICAgbGV0IHBhdGhBcnJheTtcbiAgICBpZiAoIXJ1bnRpbWUuYWNjZXNzS2V5ICYmICghcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgfHwgcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgPT09IDApKSB7XG4gICAgICBwYXRoU3RyaW5nID0gcGF0aG5hbWU7XG4gICAgICBwYXRoQXJyYXkgPSBwcmVQYXRoQXJyYXkgPz8gcGF0aG5hbWUuc3Vic3RyaW5nKDEpLnNwbGl0KFwiL1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aEFycmF5ID0gcHJlUGF0aEFycmF5ID8/IHBhdGhuYW1lLnN1YnN0cmluZygxKS5zcGxpdChcIi9cIik7XG4gICAgICBpZiAocnVudGltZS5hY2Nlc3NLZXkgJiYgcGF0aEFycmF5LmF0KDApICE9PSBydW50aW1lLmFjY2Vzc0tleSkge1xuICAgICAgICBjb25zdCBjb3JzSGVhZGVycyA9IGdldENvcnNIZWFkZXJzKG9yaWdpbik7XG4gICAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKVxuICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IFwiXCIsIHN0YXR1czogNDAzLCBoZWFkZXJzOiBjb3JzSGVhZGVycyB9O1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHVuZGVmaW5lZCwge1xuICAgICAgICAgIHN0YXR1czogNDAzLFxuICAgICAgICAgIGhlYWRlcnM6IGNvcnNIZWFkZXJzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHJ1bnRpbWUuaWdub3JlUGF0aExldmVsICE9PSB1bmRlZmluZWQgJiYgcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgIT09IDApXG4gICAgICAgIHBhdGhBcnJheSA9IHBhdGhBcnJheS5zbGljZShydW50aW1lLmlnbm9yZVBhdGhMZXZlbCk7XG4gICAgICBwYXRoU3RyaW5nID0gYC8ke3BhdGhBcnJheS5qb2luKFwiL1wiKX1gO1xuICAgIH1cbiAgICBjb25zdCBib2R5VGV4dCA9IG9wdGlvbnMucmVxdWVzdC5fX2JvZHlUZXh0O1xuICAgIGNvbnN0IGlwID0gcnVudGltZS5yZWFsSXAgPyBydW50aW1lLnJlYWxJcChvcHRpb25zLnJlcXVlc3QuaGVhZGVycykgOiBcIjo6MVwiO1xuICAgIGlmIChvcHRpb25zLmVudk1vZGUgPT09IFwidGVzdFwiICYmIHBhdGhTdHJpbmcuc3RhcnRzV2l0aChcIi8kZXZlbnQvXCIpKSB7XG4gICAgICBjb25zdCBiYXNlNjROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhTdHJpbmcuc2xpY2UoOCkpO1xuICAgICAgbGV0IGV2ZW50TmFtZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXRvYiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGV2ZW50TmFtZSA9IGF0b2IoYmFzZTY0TmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGV2ZW50TmFtZSA9IEJ1ZmZlci5mcm9tKGJhc2U2NE5hbWUsIFwiYmFzZTY0XCIpLnRvU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYmFzZTY0IGRlY29kZXIgYXZhaWxhYmxlXCIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgY29uc3QgY29yc0hlYWRlcnMgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgICAgICBjb25zdCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiBmYWxzZSwgY29kZTogXCJQQVJBTVNfVFlQRV9OT1RfU1VQUE9SVEVEXCIsIHJlamVjdDogeyBleHBlY3RlZDogXCJ2YWxpZCBiYXNlNjQgZXZlbnQgbmFtZVwiIH0gfSk7XG4gICAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKVxuICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHksIHN0YXR1czogMjAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IH07XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UoYm9keSwgeyBzdGF0dXM6IDIwMCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVycywgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBldmVudERhdGEgPSB1bmRlZmluZWQ7XG4gICAgICBjb25zdCByYXdCb2R5ID0gYXdhaXQgcmVhZEJvZHlUZXh0KCk7XG4gICAgICBpZiAocmF3Qm9keSAmJiByYXdCb2R5ICE9PSBcIlwiICYmIHJhd0JvZHkgIT09IFwie31cIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV2ZW50RGF0YSA9IHJldml2ZUpTT05QYXJzZShKU09OLnBhcnNlKHJhd0JvZHkpKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29uc3QgY29yc0hlYWRlcnMgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgICAgICAgIGNvbnN0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBjb2RlOiBcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgcmVqZWN0OiB7IGV4cGVjdGVkOiBcImpzb25cIiB9IH0pO1xuICAgICAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKVxuICAgICAgICAgICAgcmV0dXJuIHsgX19yYXdSZXNwb25zZTogdHJ1ZSwgYm9keSwgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0gfTtcbiAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0gfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGV4ZWN1dGVJZCA9IF9fY3JlYXRlSWQoKTtcbiAgICAgIGNvbnN0IGNvcnNIZWFkZXJzID0gZ2V0Q29yc0hlYWRlcnMob3JpZ2luKTtcbiAgICAgIGNvbnN0IGpzb25IZWFkZXJzID0geyAuLi5jb3JzSGVhZGVycywgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIgfTtcbiAgICAgIGlmIChldmVudERhdGEgJiYgdHlwZW9mIGV2ZW50RGF0YSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShldmVudERhdGEpICYmICEoXCJjb250ZXh0XCIgaW4gZXZlbnREYXRhKSkge1xuICAgICAgICBjb25zdCBjb250ZXh0ID0ge307XG4gICAgICAgIGNvbnRleHQucmVqZWN0ID0gcmVqZWN0O1xuICAgICAgICBjb250ZXh0LnJhaXNlID0gcmFpc2U7XG4gICAgICAgIGNvbnRleHQuZGV2ZWxvcCA9IHJ1bnRpbWUuZGV2ZWxvcDtcbiAgICAgICAgY29udGV4dC5leGVjdXRlSWQgPSBleGVjdXRlSWQ7XG4gICAgICAgIGNvbnRleHQucGF0aCA9IHBhdGhTdHJpbmc7XG4gICAgICAgIGNvbnRleHQuZW1pdCA9IHJ1bnRpbWUuZW1pdDtcbiAgICAgICAgY29udGV4dC5lbWl0QW55QXBwcm92ZWQgPSBydW50aW1lLmVtaXRBbnlBcHByb3ZlZDtcbiAgICAgICAgY29udGV4dC5lbWl0QWxsQXBwcm92ZWQgPSBydW50aW1lLmVtaXRBbGxBcHByb3ZlZDtcbiAgICAgICAgY29udGV4dC5fID0gcnVudGltZTtcbiAgICAgICAgY29udGV4dC5jb25maWcgPSBydW50aW1lLnJ1bnRpbWUuY29uZmlnO1xuICAgICAgICBjb250ZXh0LnR5cGlhID0gZ2VuZXJhdGVkLnR5cGlhU2NoZW1hO1xuICAgICAgICBjb250ZXh0LmNhbGwgPSAobW9kdWxlLCBwYXJhbXMpID0+IGV4ZWN1dGVyLl9fY2FsbChjb250ZXh0LCBtb2R1bGUsIHBhcmFtcyk7XG4gICAgICAgIGNvbnRleHQub25GaW5hbGx5ID0gKCkgPT4ge307XG4gICAgICAgIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihydW50aW1lLCBwYXRoU3RyaW5nLCBleGVjdXRlSWQpO1xuICAgICAgICBjb250ZXh0LmxvZ2dlciA9IGxvZ2dlcjtcbiAgICAgICAgY29udGV4dC5odHRwID0ge1xuICAgICAgICAgIGlwLFxuICAgICAgICAgIHBhcmFtczogeyBzdHJpbmc6IHJhd0JvZHkgPz8gXCJcIiwgcGFyc2VkOiBldmVudERhdGEgfSxcbiAgICAgICAgICByZXF1ZXN0OiBvcHRpb25zLnJlcXVlc3RcbiAgICAgICAgfTtcbiAgICAgICAgY29udGV4dC5oZWFkZXJzID0gb3B0aW9ucy5yZXF1ZXN0LmhlYWRlcnM7XG4gICAgICAgIGV2ZW50RGF0YS5jb250ZXh0ID0gY29udGV4dDtcbiAgICAgICAgY29uc3QgZW1pdEh0dHBSZXNwb25zZSA9IChzdWNjZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBwYXRoU3RyaW5nLCBodHRwOiBjb250ZXh0Lmh0dHAsIGhlYWRlcnM6IG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzLCBjb250ZXh0LCBzdWNjZXNzLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAocnVudGltZS5faGFzRW1pdEhhbmRsZXJzPy4oXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiKSA/PyB0cnVlKSB7XG4gICAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBwYXRoU3RyaW5nLCBtZXRhOiB7fSwgY29udGV4dCwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KGV2ZW50TmFtZSwgZXZlbnREYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZW1pdEVycm9yKSB7XG4gICAgICAgICAgY29uc3QgZXJyUmVzdWx0ID0gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZW1pdEVycm9yKTtcbiAgICAgICAgICBjb25zdCBlcnJCb2R5ID0gSlNPTi5zdHJpbmdpZnkoZXJyUmVzdWx0KTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgZW1pdEh0dHBSZXNwb25zZShmYWxzZSk7XG4gICAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKVxuICAgICAgICAgICAgcmV0dXJuIHsgX19yYXdSZXNwb25zZTogdHJ1ZSwgYm9keTogZXJyQm9keSwgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH07XG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShlcnJCb2R5LCB7IHN0YXR1czogMjAwLCBoZWFkZXJzOiBqc29uSGVhZGVycyB9KTtcbiAgICAgICAgfVxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IGVtaXRIdHRwUmVzcG9uc2UodHJ1ZSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KGV2ZW50TmFtZSwgZXZlbnREYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZW1pdEVycm9yKSB7XG4gICAgICAgICAgY29uc3QgZXJyUmVzdWx0ID0gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIG5vb3BMb2dnZXIsIGVtaXRFcnJvcik7XG4gICAgICAgICAgY29uc3QgZXJyQm9keSA9IEpTT04uc3RyaW5naWZ5KGVyclJlc3VsdCk7XG4gICAgICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiBlcnJCb2R5LCBzdGF0dXM6IDIwMCwgaGVhZGVyczoganNvbkhlYWRlcnMgfTtcbiAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGVyckJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBib2R5ID0gYHtcImRhdGFcIjoke0pTT04uc3RyaW5naWZ5KGV2ZW50RGF0YSA/PyB7fSwgKGtleSwgdmFsdWUpID0+IGtleSA9PT0gXCJjb250ZXh0XCIgPyB1bmRlZmluZWQgOiB2YWx1ZSl9LFwiZXhlY3V0ZUlkXCI6XCIke2V4ZWN1dGVJZH1cIixcInN1Y2Nlc3NcIjp0cnVlfWA7XG4gICAgICBpZiAob3B0aW9ucy5yYXdSZXNwb25zZSlcbiAgICAgICAgcmV0dXJuIHsgX19yYXdSZXNwb25zZTogdHJ1ZSwgYm9keSwgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH07XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH0pO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5yYXdSZXNwb25zZSAmJiAhb3JpZ2luICYmIGNoZWNrTm9FbWl0SGFuZGxlcnMoKSkge1xuICAgICAgY29uc3QgX19pc0FjdGlvbiA9IG9wdGlvbnMucmVxdWVzdC5fX2lzQWN0aW9uO1xuICAgICAgaWYgKF9faXNBY3Rpb24gIT09IGZhbHNlKSB7XG4gICAgICAgIGxldCByb3V0ZVNjaGVtYSA9IG9wdGlvbnMucm91dGVTY2hlbWE7XG4gICAgICAgIGlmICghcm91dGVTY2hlbWEpIHtcbiAgICAgICAgICBpZiAocGF0aFN0cmluZyA9PT0gY2FjaGVkUGF0aFN0cmluZyAmJiBjYWNoZWRSb3V0ZVNjaGVtYSkge1xuICAgICAgICAgICAgcm91dGVTY2hlbWEgPSBjYWNoZWRSb3V0ZVNjaGVtYTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcm91dGVTY2hlbWEgPSB0cmllLmdldChwYXRoU3RyaW5nKTtcbiAgICAgICAgICAgIGlmIChyb3V0ZVNjaGVtYSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICBjYWNoZWRSb3V0ZVNjaGVtYSA9IHJvdXRlU2NoZW1hO1xuICAgICAgICAgICAgICBjYWNoZWRQYXRoU3RyaW5nID0gcGF0aFN0cmluZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gZ2VuZXJhdGVkLnJvdXRlU2NoZW1hPy5bcGF0aFN0cmluZ107XG4gICAgICAgICAgICAgIGlmIChyb3V0ZVNjaGVtYSA9PT0gdW5kZWZpbmVkKSB7fSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgICAgcm91dGVTY2hlbWEubW9kdWxlID0gYXdhaXQgcm91dGVTY2hlbWEubW9kdWxlO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgICAgICAgICAgIHRyaWUuYWRkKHBhdGhTdHJpbmcsIHJvdXRlU2NoZW1hKTtcbiAgICAgICAgICAgICAgICBjYWNoZWRSb3V0ZVNjaGVtYSA9IHJvdXRlU2NoZW1hO1xuICAgICAgICAgICAgICAgIGNhY2hlZFBhdGhTdHJpbmcgPSBwYXRoU3RyaW5nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyb3V0ZVNjaGVtYSAmJiByb3V0ZVNjaGVtYS50eXBlID09PSBcImFjdGlvblwiKSB7XG4gICAgICAgICAgbGV0IHZhbGlkYXRlUGFyYW1zID0gY2FjaGVkVmFsaWRhdGVQYXJhbXM7XG4gICAgICAgICAgbGV0IGhhbmRsZXIgPSBjYWNoZWRIYW5kbGVyO1xuICAgICAgICAgIGxldCBza2lwVmFsaWRhdGlvbiA9IGNhY2hlZFNraXBWYWxpZGF0aW9uO1xuICAgICAgICAgIGlmIChyb3V0ZVNjaGVtYSAhPT0gY2FjaGVkUm91dGVTY2hlbWEpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlUGFyYW1zID0gcm91dGVTY2hlbWEudmFsaWRhdGVQYXJhbXM7XG4gICAgICAgICAgICBoYW5kbGVyID0gcm91dGVTY2hlbWEubW9kdWxlLmhhbmRsZXI7XG4gICAgICAgICAgICBjb25zdCBtZXRhID0gcm91dGVTY2hlbWEubW9kdWxlPy5tZXRhO1xuICAgICAgICAgICAgc2tpcFZhbGlkYXRpb24gPSBtZXRhPy50eXBlU2FmZXR5ID09PSBmYWxzZSB8fCBBcnJheS5pc0FycmF5KG1ldGE/LnR5cGVTYWZldHkpICYmICFtZXRhLnR5cGVTYWZldHkuaW5jbHVkZXMoXCJwYXJhbXNcIik7XG4gICAgICAgICAgICBjYWNoZWRWYWxpZGF0ZVBhcmFtcyA9IHZhbGlkYXRlUGFyYW1zO1xuICAgICAgICAgICAgY2FjaGVkSGFuZGxlciA9IGhhbmRsZXI7XG4gICAgICAgICAgICBjYWNoZWRTa2lwVmFsaWRhdGlvbiA9IHNraXBWYWxpZGF0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBleGVjdXRlSWQgPSBfX2NyZWF0ZUlkKCk7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5VGV4dCgpO1xuICAgICAgICAgIGxldCBwYXJhbXM7XG4gICAgICAgICAgbGV0IHBhcmFtc09rID0gdHJ1ZTtcbiAgICAgICAgICBpZiAoIWJvZHkgfHwgYm9keSA9PT0gXCJcIiB8fCBib2R5ID09PSBcInt9XCIpIHtcbiAgICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBwYXJhbXMgPSByZXZpdmVKU09OUGFyc2UoSlNPTi5wYXJzZShib2R5KSk7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSBcInVuZGVmaW5lZFwiKVxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAgIHBhcmFtc09rID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwYXJhbXNPayAmJiBwYXJhbXMgIT09IG51bGwgJiYgdHlwZW9mIHBhcmFtcyA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShwYXJhbXMpKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5lbnZNb2RlID09PSBcInRlc3RcIiB8fCAhKFwiJG1pbGtpb0dlbmVyYXRlUGFyYW1zXCIgaW4gcGFyYW1zKSkge1xuICAgICAgICAgICAgICBpZiAoIXNraXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlUGFyYW1zKHBhcmFtcyk7XG4gICAgICAgICAgICAgICAgaWYgKCF2YWxpZGF0aW9uLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICAgIHBhcmFtc09rID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChwYXJhbXNPaykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBPYmplY3QuY3JlYXRlKGJhc2VDb250ZXh0UHJvdG8pO1xuICAgICAgICAgICAgICAgIGNvbnRleHQucGF0aCA9IHBhdGhTdHJpbmc7XG4gICAgICAgICAgICAgICAgY29udGV4dC5yb3V0ZVR5cGUgPSBcImFjdGlvblwiO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZXhlY3V0ZUlkID0gZXhlY3V0ZUlkO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuaHR0cCA9IHtcbiAgICAgICAgICAgICAgICAgIHVybDogcGF0aG5hbWUsXG4gICAgICAgICAgICAgICAgICBpcCxcbiAgICAgICAgICAgICAgICAgIHBhdGg6IHsgc3RyaW5nOiBwYXRoU3RyaW5nLCBhcnJheTogcGF0aEFycmF5IH0sXG4gICAgICAgICAgICAgICAgICBwYXJhbXM6IHsgc3RyaW5nOiBib2R5LCBwYXJzZWQ6IHBhcmFtcyB9LFxuICAgICAgICAgICAgICAgICAgcmVxdWVzdDogb3B0aW9ucy5yZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgcmVzcG9uc2U6IGZhc3RQYXRoUmVzcG9uc2UsXG4gICAgICAgICAgICAgICAgICBjb3JzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmhlYWRlcnMgPSBvcHRpb25zLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihjb250ZXh0LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgaWYgKHJlc3VsdCA9PT0gdW5kZWZpbmVkIHx8IHJlc3VsdCA9PT0gbnVsbCB8fCByZXN1bHQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgX19yYXdSZXNwb25zZTogdHJ1ZSwgYm9keTogZW1wdHlSZXN1bHRQcmVmaXggKyBleGVjdXRlSWQgKyBpZFN1ZmZpeCwgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGRlZmF1bHRNZXJnZWRIZWFkZXJzIH07XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFBcnJheS5pc0FycmF5KHJlc3VsdCkgJiYgdHlwZW9mIHJlc3VsdCA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiByZXN1bHRQcmVmaXggKyBKU09OLnN0cmluZ2lmeShyZXN1bHQpICsgJyxcImV4ZWN1dGVJZFwiOlwiJyArIGV4ZWN1dGVJZCArIGlkU3VmZml4LCBzdGF0dXM6IDIwMCwgaGVhZGVyczogZGVmYXVsdE1lcmdlZEhlYWRlcnMgfTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY29yc0hlYWRlcnMgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgIGNvbnN0IHJhd0V4ZWN1dGVJZCA9IHJ1bnRpbWU/LmV4ZWN1dGVJZCA/IGF3YWl0IHJ1bnRpbWUuZXhlY3V0ZUlkKG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzKSA6IF9fY3JlYXRlSWQoKTtcbiAgICBjb25zdCBleGVjdXRlSWQgPSBzYW5pdGl6ZUV4ZWN1dGVJZChyYXdFeGVjdXRlSWQpIHx8IF9fY3JlYXRlSWQoKTtcbiAgICBjb25zdCBhbnlFbWl0SGFuZGxlcnMgPSAhY2hlY2tOb0VtaXRIYW5kbGVycygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihydW50aW1lLCBwYXRoU3RyaW5nLCBleGVjdXRlSWQpO1xuICAgIGlmIChhbnlFbWl0SGFuZGxlcnMpXG4gICAgICBydW50aW1lLnJ1bnRpbWUucmVxdWVzdC5zZXQoZXhlY3V0ZUlkLCB7IGxvZ2dlciB9KTtcbiAgICBjb25zdCBiYXNlSGVhZGVycyA9IG9yaWdpbiA/IHsgLi4uY29yc0hlYWRlcnMsIC4uLmRlZmF1bHRSZXNwb25zZUhlYWRlcnMgfSA6IGRlZmF1bHRNZXJnZWRIZWFkZXJzO1xuICAgIGxldCBmaW5hbGVzID0gW107XG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7IC4uLmJhc2VIZWFkZXJzIH1cbiAgICB9O1xuICAgIGNvbnN0IGlzUmF3UGF0aCA9IGdlbmVyYXRlZC5yYXdTY2hlbWE/LnJhd1BhdGhzPy5oYXMocGF0aFN0cmluZykgPz8gZmFsc2U7XG4gICAgY29uc3QgaHR0cCA9IHtcbiAgICAgIHVybDogcGF0aG5hbWUsXG4gICAgICBpcCxcbiAgICAgIHBhdGg6IHsgc3RyaW5nOiBwYXRoU3RyaW5nLCBhcnJheTogcGF0aEFycmF5IH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgc3RyaW5nOiBpc1Jhd1BhdGggPyBcIlwiIDogYXdhaXQgcmVhZEJvZHlUZXh0KCksXG4gICAgICAgIHBhcnNlZDogdW5kZWZpbmVkXG4gICAgICB9LFxuICAgICAgcmVxdWVzdDogb3B0aW9ucy5yZXF1ZXN0LFxuICAgICAgcmVzcG9uc2UsXG4gICAgICBjb3JzXG4gICAgfTtcbiAgICBjb25zdCBjb250ZXh0ID0geyByZWplY3QsIHJhaXNlIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhhc0h0dHBSZXF1ZXN0SGFuZGxlcnMgPSBydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpodHRwUmVxdWVzdFwiKSA/PyB0cnVlO1xuICAgICAgaWYgKGhhc0h0dHBSZXF1ZXN0SGFuZGxlcnMpXG4gICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVxdWVzdFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgaWYgKG9wdGlvbnMuZW52TW9kZSAhPT0gXCJ0ZXN0XCIgJiYgaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikpIHtcbiAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICB0aHJvdyByZWplY3QoXCJOT1RfRk9VTkRcIiwgeyBwYXRoOiBodHRwLnBhdGguc3RyaW5nIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGlzUmF3UGF0aCkge1xuICAgICAgICBjb25zdCByYXdSb3V0ZSA9IGdlbmVyYXRlZC5yYXdTY2hlbWEucm91dGVzW3BhdGhTdHJpbmddO1xuICAgICAgICBpZiAoIXJhd1JvdXRlKSB7XG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICAgIHRocm93IHJlamVjdChcIk5PVF9GT1VORFwiLCB7IHBhdGg6IGh0dHAucGF0aC5zdHJpbmcgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1vZHVsZSA9IHJhd1JvdXRlLm1vZHVsZTtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIG1vZHVsZSA9IGF3YWl0IG1vZHVsZSgpO1xuICAgICAgICAgIHJhd1JvdXRlLm1vZHVsZSA9IG1vZHVsZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtZXRhID0gbW9kdWxlPy5tZXRhID8/IHt9O1xuICAgICAgICBjb250ZXh0Lmh0dHAgPSBodHRwO1xuICAgICAgICBjb250ZXh0LmhlYWRlcnMgPSBodHRwLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgY29udGV4dC5kZXZlbG9wID0gcnVudGltZS5kZXZlbG9wO1xuICAgICAgICBjb250ZXh0LnBhdGggPSBwYXRoU3RyaW5nO1xuICAgICAgICBjb250ZXh0LnJvdXRlVHlwZSA9IFwicmF3XCI7XG4gICAgICAgIGNvbnRleHQubG9nZ2VyID0gbG9nZ2VyO1xuICAgICAgICBjb250ZXh0LmVtaXQgPSBydW50aW1lLmVtaXQ7XG4gICAgICAgIGNvbnRleHQuZW1pdEFueUFwcHJvdmVkID0gcnVudGltZS5lbWl0QW55QXBwcm92ZWQ7XG4gICAgICAgIGNvbnRleHQuZW1pdEFsbEFwcHJvdmVkID0gcnVudGltZS5lbWl0QWxsQXBwcm92ZWQ7XG4gICAgICAgIGNvbnRleHQuZXhlY3V0ZUlkID0gZXhlY3V0ZUlkO1xuICAgICAgICBjb250ZXh0LmNvbmZpZyA9IHJ1bnRpbWUucnVudGltZS5jb25maWc7XG4gICAgICAgIGNvbnRleHQudHlwaWEgPSBnZW5lcmF0ZWQudHlwaWFTY2hlbWE7XG4gICAgICAgIGNvbnRleHQuY2FsbCA9IChtb2QsIHBhcmFtcykgPT4gZXhlY3V0ZXIuX19jYWxsKGNvbnRleHQsIG1vZCwgcGFyYW1zKTtcbiAgICAgICAgY29udGV4dC5vbkZpbmFsbHkgPSAoaGFuZGxlcikgPT4gZmluYWxlcy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgICAgICBjb250ZXh0Ll8gPSBydW50aW1lO1xuICAgICAgICBjb25zdCBoYW5kbGVyUmVxdWVzdCA9IGJvZHlUZXh0ICE9PSB1bmRlZmluZWQgPyBuZXcgUmVxdWVzdChvcHRpb25zLnJlcXVlc3QudXJsLCB7XG4gICAgICAgICAgbWV0aG9kOiBvcHRpb25zLnJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgIGJvZHk6IGJvZHlUZXh0IHx8IG51bGwsXG4gICAgICAgICAgc2lnbmFsOiBvcHRpb25zLnJlcXVlc3Quc2lnbmFsXG4gICAgICAgIH0pIDogb3B0aW9ucy5yZXF1ZXN0O1xuICAgICAgICBjb25zdCByZXN1bHRzID0geyB2YWx1ZTogdW5kZWZpbmVkIH07XG4gICAgICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIpID8/IHRydWUpIHtcbiAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBwYXRoU3RyaW5nLCBtZXRhLCBjb250ZXh0LCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJhd1Jlc3BvbnNlID0gYXdhaXQgbW9kdWxlLmhhbmRsZXIoY29udGV4dCwgaGFuZGxlclJlcXVlc3QpO1xuICAgICAgICByZXN1bHRzLnZhbHVlID0gcmF3UmVzcG9uc2U7XG4gICAgICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIikgPz8gdHJ1ZSkge1xuICAgICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogcGF0aFN0cmluZywgbWV0YSwgY29udGV4dCwgcmVzdWx0cywgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaW5hbEhlYWRlcnMgPSBuZXcgSGVhZGVycyhyYXdSZXNwb25zZS5oZWFkZXJzKTtcbiAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoY29yc0hlYWRlcnMpKSB7XG4gICAgICAgICAgaWYgKCFmaW5hbEhlYWRlcnMuaGFzKGspKVxuICAgICAgICAgICAgZmluYWxIZWFkZXJzLnNldChrLCB2KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNIdHRwUmVzcG9uc2VIYW5kbGVycyA9IHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaGFzSHR0cFJlc3BvbnNlSGFuZGxlcnMpXG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCBoZWFkZXJzOiBodHRwLnJlcXVlc3QuaGVhZGVycywgY29udGV4dCwgc3VjY2VzczogdHJ1ZSwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBmaW5hbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoXCJBbiBlcnJvciBvY2N1cnJlZCBpbnNpZGUgb25GaW5hbGx5LlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYXNPbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgIHJ1bnRpbWUucnVudGltZS5yZXF1ZXN0LmRlbGV0ZShleGVjdXRlSWQpO1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHJhd1Jlc3BvbnNlLmJvZHksIHtcbiAgICAgICAgICBzdGF0dXM6IHJhd1Jlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiByYXdSZXNwb25zZS5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGZpbmFsSGVhZGVyc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5yZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiQWNjZXB0XCIpPy5zdGFydHNXaXRoKFwidGV4dC9ldmVudC1zdHJlYW1cIikpIHtcbiAgICAgICAgbGV0IHJvdXRlU2NoZW1hID0gb3B0aW9ucy5yb3V0ZVNjaGVtYTtcbiAgICAgICAgaWYgKCFyb3V0ZVNjaGVtYSkge1xuICAgICAgICAgIGlmIChwYXRoU3RyaW5nID09PSBjYWNoZWRQYXRoU3RyaW5nICYmIGNhY2hlZFJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgICByb3V0ZVNjaGVtYSA9IGNhY2hlZFJvdXRlU2NoZW1hO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikpIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gdHJpZS5nZXQoaHR0cC5wYXRoLnN0cmluZyk7XG4gICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEgPSBnZW5lcmF0ZWQucm91dGVTY2hlbWE/LltodHRwLnBhdGguc3RyaW5nXTtcbiAgICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86aHR0cE5vdEZvdW5kXCIsIHsgZXhlY3V0ZUlkLCBsb2dnZXIsIHBhdGg6IGh0dHAucGF0aC5zdHJpbmcsIGh0dHAsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiTk9UX0ZPVU5EXCIsIHsgcGF0aDogaHR0cC5wYXRoLnN0cmluZyB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgICAgICAgICB0cmllLmFkZChodHRwLnBhdGguc3RyaW5nLCByb3V0ZVNjaGVtYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gdHJpZS5nZXQoaHR0cC5wYXRoLnN0cmluZyk7XG4gICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEgPSBnZW5lcmF0ZWQucm91dGVTY2hlbWE/LltodHRwLnBhdGguc3RyaW5nXTtcbiAgICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86aHR0cE5vdEZvdW5kXCIsIHsgZXhlY3V0ZUlkLCBsb2dnZXIsIHBhdGg6IGh0dHAucGF0aC5zdHJpbmcsIGh0dHAsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiTk9UX0ZPVU5EXCIsIHsgcGF0aDogaHR0cC5wYXRoLnN0cmluZyB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgICAgICAgICB0cmllLmFkZChodHRwLnBhdGguc3RyaW5nLCByb3V0ZVNjaGVtYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWNoZWRSb3V0ZVNjaGVtYSA9IHJvdXRlU2NoZW1hO1xuICAgICAgICAgICAgY2FjaGVkUGF0aFN0cmluZyA9IHBhdGhTdHJpbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyb3V0ZVNjaGVtYS50eXBlICE9PSBcImFjdGlvblwiKVxuICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiVU5BQ0NFUFRBQkxFXCIsIHsgZXhwZWN0ZWQ6IFwic3RyZWFtXCIsIG1lc3NhZ2U6IGBOb3QgYWNjZXB0YWJsZSwgdGhlIEFjY2VwdCBpbiB0aGUgcmVxdWVzdCBoZWFkZXIgc2hvdWxkIGJlIFwidGV4dC9ldmVudC1zdHJlYW1cIi4gSWYgeW91IGFyZSB1c2luZyB0aGUgXCJAbWlsa2lvL3N0YXJnYXRlXCIgcGFja2FnZSwgcGxlYXNlIGFkZCBcXGB0eXBlOiBcInN0cmVhbVwiXFxgIHRvIHRoZSBleGVjdXRlIG9wdGlvbnMuYCB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0Lmh0dHAgPSBodHRwO1xuICAgICAgICBjb250ZXh0LmhlYWRlcnMgPSBodHRwLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgY29udGV4dC5yb3V0ZVR5cGUgPSBcImFjdGlvblwiO1xuICAgICAgICBjb25zdCBleGVjdXRlZCA9IGF3YWl0IGV4ZWN1dGVyLl9fZXhlY3V0ZShyb3V0ZVNjaGVtYSwge1xuICAgICAgICAgIGNyZWF0ZWRFeGVjdXRlSWQ6IGV4ZWN1dGVJZCxcbiAgICAgICAgICBjcmVhdGVkTG9nZ2VyOiBsb2dnZXIsXG4gICAgICAgICAgcGF0aDogaHR0cC5wYXRoLnN0cmluZyxcbiAgICAgICAgICBoZWFkZXJzOiBvcHRpb25zLnJlcXVlc3QuaGVhZGVycyxcbiAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgIHBhcmFtczogaHR0cC5wYXJhbXMuc3RyaW5nLFxuICAgICAgICAgIHBhcmFtc1R5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgcGFyYW1zQ29udGVudFR5cGU6IFwianNvblwiXG4gICAgICAgIH0pO1xuICAgICAgICBmaW5hbGVzID0gZXhlY3V0ZWQuZmluYWxlcztcbiAgICAgICAgaWYgKHJlc3BvbnNlLmJvZHkgPT09IFwiXCIgJiYgZXhlY3V0ZWQucmVzdWx0cy52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKGV4ZWN1dGVkLmVtcHR5UmVzdWx0KSB7XG4gICAgICAgICAgICByZXNwb25zZS5ib2R5ID0gYHtcImRhdGFcIjp7fSxcImV4ZWN1dGVJZFwiOlwiJHtleGVjdXRlSWR9XCIsXCJzdWNjZXNzXCI6dHJ1ZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZS5ib2R5ID0gYHtcImRhdGFcIjoke0pTT04uc3RyaW5naWZ5KGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUpfSxcImV4ZWN1dGVJZFwiOlwiJHtleGVjdXRlSWR9XCIsXCJzdWNjZXNzXCI6dHJ1ZX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNIdHRwUmVzcG9uc2VIYW5kbGVycyA9IHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaGFzSHR0cFJlc3BvbnNlSGFuZGxlcnMpXG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCBoZWFkZXJzOiBodHRwLnJlcXVlc3QuaGVhZGVycywgY29udGV4dDogZXhlY3V0ZWQuY29udGV4dCwgc3VjY2VzczogdHJ1ZSwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBmaW5hbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoXCJBbiBlcnJvciBvY2N1cnJlZCBpbnNpZGUgb25GaW5hbGx5LlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYXNPbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgIHJ1bnRpbWUucnVudGltZS5yZXF1ZXN0LmRlbGV0ZShleGVjdXRlSWQpO1xuICAgICAgICBpZiAob3B0aW9ucy5yYXdSZXNwb25zZSkge1xuICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IHJlc3BvbnNlLmJvZHksIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLCBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShyZXNwb25zZS5ib2R5LCByZXNwb25zZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcm91dGVTY2hlbWEgPSBvcHRpb25zLnJvdXRlU2NoZW1hO1xuICAgICAgICBpZiAoIXJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgcm91dGVTY2hlbWEgPSB0cmllLmdldChodHRwLnBhdGguc3RyaW5nKTtcbiAgICAgICAgICBpZiAoaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikgfHwgIWh0dHAucGF0aC5zdHJpbmcuZW5kc1dpdGgoXCJ+XCIpIHx8IHJvdXRlU2NoZW1hID09PSBudWxsKSB7XG4gICAgICAgICAgICByb3V0ZVNjaGVtYSA9IGdlbmVyYXRlZC5yb3V0ZVNjaGVtYT8uW2h0dHAucGF0aC5zdHJpbmddO1xuICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICAgICAgICB0aHJvdyByZWplY3QoXCJOT1RfRk9VTkRcIiwgeyBwYXRoOiBodHRwLnBhdGguc3RyaW5nIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiByb3V0ZVNjaGVtYS5tb2R1bGUgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEubW9kdWxlID0gYXdhaXQgcm91dGVTY2hlbWEubW9kdWxlO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICByb3V0ZVNjaGVtYS5tb2R1bGUgPSBhd2FpdCByb3V0ZVNjaGVtYS5tb2R1bGUoKTtcbiAgICAgICAgICAgIHRyaWUuYWRkKGh0dHAucGF0aC5zdHJpbmcsIHJvdXRlU2NoZW1hKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJvdXRlU2NoZW1hLnR5cGUgIT09IFwic3RyZWFtXCIpXG4gICAgICAgICAgICB0aHJvdyByZWplY3QoXCJVTkFDQ0VQVEFCTEVcIiwgeyBleHBlY3RlZDogXCJzdHJlYW1cIiwgbWVzc2FnZTogYE5vdCBhY2NlcHRhYmxlLCB0aGUgQWNjZXB0IGluIHRoZSByZXF1ZXN0IGhlYWRlciBzaG91bGQgYmUgXCJhcHBsaWNhdGlvbi9qc29uXCIuIElmIHlvdSBhcmUgdXNpbmcgdGhlIFwiQG1pbGtpby9zdGFyZ2F0ZVwiIHBhY2thZ2UsIHBsZWFzZSByZW1vdmUgXFxgdHlwZTogXCJzdHJlYW1cIlxcYCB0byB0aGUgZXhlY3V0ZSBvcHRpb25zLmAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0cmVhbUNsb3NlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBoYW5kbGVDbG9zZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBpZiAoc3RyZWFtQ2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIHN0cmVhbUNsb3NlZCA9IHRydWU7XG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGZpbmFsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcIkFuIGVycm9yIG9jY3VycmVkIGluc2lkZSBvbkZpbmFsbHkuXCIsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGhhc09uTG9nZ2VyU3VibWl0dGluZylcbiAgICAgICAgICAgIGF3YWl0IGxvZ2dlci5fLnN1Ym1pdChjb250ZXh0KTtcbiAgICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgICAgcnVudGltZS5ydW50aW1lLnJlcXVlc3QuZGVsZXRlKGV4ZWN1dGVJZCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnRleHQuaHR0cCA9IGh0dHA7XG4gICAgICAgIGNvbnRleHQuaGVhZGVycyA9IGh0dHAucmVxdWVzdC5oZWFkZXJzO1xuICAgICAgICBjb250ZXh0LnJvdXRlVHlwZSA9IFwic3RyZWFtXCI7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVkID0gYXdhaXQgZXhlY3V0ZXIuX19leGVjdXRlKHJvdXRlU2NoZW1hLCB7XG4gICAgICAgICAgY3JlYXRlZEV4ZWN1dGVJZDogZXhlY3V0ZUlkLFxuICAgICAgICAgIGNyZWF0ZWRMb2dnZXI6IGxvZ2dlcixcbiAgICAgICAgICBwYXRoOiBodHRwLnBhdGguc3RyaW5nLFxuICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgcGFyYW1zOiBodHRwLnBhcmFtcy5zdHJpbmcsXG4gICAgICAgICAgcGFyYW1zVHlwZTogXCJzdHJpbmdcIlxuICAgICAgICB9KTtcbiAgICAgICAgZmluYWxlcyA9IGV4ZWN1dGVkLmZpbmFsZXM7XG4gICAgICAgIHJlc3BvbnNlLmhlYWRlcnMgPSB7IC4uLnJlc3BvbnNlLmhlYWRlcnMsIC4uLmJ1aWxkQ29yc0hlYWRlcnMoaHR0cC5jb3JzLCBvcmlnaW4pIH07XG4gICAgICAgIGxldCBzdHJlYW07XG4gICAgICAgIGxldCBjb250cm9sO1xuICAgICAgICBpZiAodHlwZW9mIEJ1biAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHN0cmVhbSA9IG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgICAgICAgICB0eXBlOiBcImRpcmVjdFwiLFxuICAgICAgICAgICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2wgPSBjb250cm9sbGVyO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIud3JpdGUoYGRhdGE6QCR7SlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB1bmRlZmluZWQsIGV4ZWN1dGVJZCB9KX1cblxuYCk7XG4gICAgICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCB2YWx1ZSBvZiBleGVjdXRlZC5yZXN1bHRzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnN0cmluZ2lmeShbbnVsbCwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci53cml0ZShgZGF0YToke3Jlc3VsdH1cblxuYCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBleGVjdXRlZC5yZXN1bHRzLnZhbHVlLnJldHVybih1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVDbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VwdGlvbiA9IGV4Y2VwdGlvbkhhbmRsZXIoZXhlY3V0ZUlkLCBsb2dnZXIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICByZXN1bHRbZXhjZXB0aW9uLmNvZGVdID0gZXhjZXB0aW9uLnJlamVjdDtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyLndyaXRlKGBkYXRhOiR7SlNPTi5zdHJpbmdpZnkoW3Jlc3VsdCwgbnVsbF0pfVxuXG5gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAwKSk7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyBjYW5jZWwoKSB7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgIGNvbnRyb2wuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJlYW0gPSBuZXcgUmVhZGFibGVTdHJlYW0oe1xuICAgICAgICAgICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2wgPSBjb250cm9sbGVyO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShgZGF0YTpAJHtKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHVuZGVmaW5lZCwgZXhlY3V0ZUlkIH0pfVxuXG5gKTtcbiAgICAgICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHZhbHVlIG9mIGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZXF1ZXN0LnNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnN0cmluZ2lmeShbbnVsbCwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGBkYXRhOiR7cmVzdWx0fVxuXG5gKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUucmV0dXJuKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhjZXB0aW9uID0gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgIHJlc3VsdFtleGNlcHRpb24uY29kZV0gPSBleGNlcHRpb24ucmVqZWN0O1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShgZGF0YToke0pTT04uc3RyaW5naWZ5KFtyZXN1bHQsIG51bGxdKX1cblxuYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlQ2xvc2UoKTtcbiAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMCkpO1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXN5bmMgY2FuY2VsKCkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVDbG9zZSgpO1xuICAgICAgICAgICAgICBjb250cm9sLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IHN0cmVhbTtcbiAgICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHsgLi4ucmVzcG9uc2UuaGVhZGVycywgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLCBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiIH07XG4gICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVzcG9uc2VcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogaHR0cC5wYXRoLnN0cmluZywgaHR0cCwgaGVhZGVyczogaHR0cC5yZXF1ZXN0LmhlYWRlcnMsIGNvbnRleHQ6IGV4ZWN1dGVkLmNvbnRleHQsIHN1Y2Nlc3M6IHRydWUsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UocmVzcG9uc2UuYm9keSwgcmVzcG9uc2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0ge1xuICAgICAgICB2YWx1ZTogZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpXG4gICAgICB9O1xuICAgICAgaWYgKHJlc3VsdHMudmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IEpTT04uc3RyaW5naWZ5KHJlc3VsdHMudmFsdWUpO1xuICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHsgLi4ucmVzcG9uc2UuaGVhZGVycywgLi4uY29yc0hlYWRlcnMgfTtcbiAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVzcG9uc2VcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogaHR0cC5wYXRoLnN0cmluZywgaHR0cCwgaGVhZGVyczogaHR0cC5yZXF1ZXN0LmhlYWRlcnMsIGNvbnRleHQsIHN1Y2Nlc3M6IGZhbHNlLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgZmluYWxlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFwiQW4gZXJyb3Igb2NjdXJyZWQgaW5zaWRlIG9uRmluYWxseS5cIiwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzT25Mb2dnZXJTdWJtaXR0aW5nKVxuICAgICAgICBhd2FpdCBsb2dnZXIuXy5zdWJtaXQoY29udGV4dCk7XG4gICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICBydW50aW1lLnJ1bnRpbWUucmVxdWVzdC5kZWxldGUoZXhlY3V0ZUlkKTtcbiAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IHJlc3BvbnNlLmJvZHksIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLCBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHJlc3BvbnNlLmJvZHksIHJlc3BvbnNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHN0cmVhbUNsb3NlcnMgPSBuZXcgTWFwO1xuICBjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKHBvcnQsIG9wdGlvbnMpID0+IHtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGlmIChvcHRpb25zID09PSBcIlBJTkdcIikge1xuICAgICAgICBwb3J0LnBvc3RNZXNzYWdlKFwiUE9OR1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChvcHRpb25zLnN0YXJ0c1dpdGgoXCJDTE9TRV9TVFJFQU06XCIpKSB7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVJZCA9IG9wdGlvbnMuc3Vic3RyaW5nKFwiQ0xPU0VfU1RSRUFNOlwiLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHN0cmVhbUNsb3NlciA9IHN0cmVhbUNsb3NlcnMuZ2V0KGV4ZWN1dGVJZCk7XG4gICAgICAgIGlmIChzdHJlYW1DbG9zZXIpIHtcbiAgICAgICAgICBzdHJlYW1DbG9zZXIuZ2VuZXJhdG9yLnJldHVybih1bmRlZmluZWQpO1xuICAgICAgICAgIHN0cmVhbUNsb3Nlci5oYW5kbGVDbG9zZShcInN0cmVhbVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgcm91dGVTY2hlbWEgPSB0cmllLmdldChvcHRpb25zLnBhdGgpO1xuICAgIGlmIChyb3V0ZVNjaGVtYSA9PT0gbnVsbCkge1xuICAgICAgcm91dGVTY2hlbWEgPSBnZW5lcmF0ZWQucm91dGVTY2hlbWE/LltvcHRpb25zLnBhdGhdO1xuICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhyb3cgcmVqZWN0KFwiTk9UX0ZPVU5EXCIsIHsgcGF0aDogb3B0aW9ucy5wYXRoIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiByb3V0ZVNjaGVtYS5tb2R1bGUgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgcm91dGVTY2hlbWEubW9kdWxlID0gYXdhaXQgcm91dGVTY2hlbWEubW9kdWxlO1xuICAgICAgZWxzZVxuICAgICAgICByb3V0ZVNjaGVtYS5tb2R1bGUgPSBhd2FpdCByb3V0ZVNjaGVtYS5tb2R1bGUoKTtcbiAgICAgIHRyaWUuYWRkKG9wdGlvbnMucGF0aCwgcm91dGVTY2hlbWEpO1xuICAgIH1cbiAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICBjb25zdCBwYXJhbXMgPSBvcHRpb25zLnBhcmFtcyA/PyB7fTtcbiAgICBjb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIocnVudGltZSwgb3B0aW9ucy5wYXRoLCBvcHRpb25zLmV4ZWN1dGVJZCk7XG4gICAgbGV0IGZpbmFsZXMgPSBbXTtcbiAgICBjb25zdCBodHRwID0gbmV3IFByb3h5KHt9LCB7XG4gICAgICBnZXQ6ICh0YXJnZXQsIHByb3BlcnR5KSA9PiB7XG4gICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gXCJub3RGb3VuZFwiKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9LFxuICAgICAgc2V0OiAoKSA9PiB7XG4gICAgICAgIHRocm93IHJlamVjdChcIlVOQUNDRVBUQUJMRVwiLCB7IGV4cGVjdGVkOiBcImNvbnRleHQuaHR0cFwiLCBtZXNzYWdlOiBcIlRoaXMgcmVxdWVzdCB3YXMgaW52b2tlZCB0aHJvdWdoIHRoZSBleGVjdXRlIG1ldGhvZC4gU2luY2Ugbm8gYWN0dWFsIHJlcXVlc3Qgd2FzIGdlbmVyYXRlZCwgdGhlIEhUVFAgbWV0aG9kcyB1bmRlciB0aGUgY29udGV4dCBjYW5ub3QgYmUgYWNjZXNzZWQuXCIgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgY29uc3QgaGFuZGxlQ2xvc2UgPSBhc3luYyAodHlwZSkgPT4ge1xuICAgICAgaWYgKHR5cGUgPT09IFwic3RyZWFtXCIpXG4gICAgICAgIHN0cmVhbUNsb3NlcnMuZGVsZXRlKG9wdGlvbnMuZXhlY3V0ZUlkKTtcbiAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBmaW5hbGVzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgaGFuZGxlcigpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGxvZ2dlci5lcnJvcihcIkFuIGVycm9yIG9jY3VycmVkIGluc2lkZSBvbkZpbmFsbHkuXCIsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgcnVudGltZS5ydW50aW1lLnJlcXVlc3QuZGVsZXRlKG9wdGlvbnMuZXhlY3V0ZUlkKTtcbiAgICB9O1xuICAgIGNvbnN0IGNvbnRleHQgPSB7IGh0dHAsIGhlYWRlcnMsIHJvdXRlVHlwZTogcm91dGVTY2hlbWEudHlwZSwgcmVqZWN0LCByYWlzZSB9O1xuICAgIHRyeSB7XG4gICAgICBpZiAocm91dGVTY2hlbWEudHlwZSA9PT0gXCJhY3Rpb25cIikge1xuICAgICAgICBjb25zdCBleGVjdXRlZCA9IGF3YWl0IGV4ZWN1dGVyLl9fZXhlY3V0ZShyb3V0ZVNjaGVtYSwge1xuICAgICAgICAgIGNyZWF0ZWRFeGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLFxuICAgICAgICAgIGNyZWF0ZWRMb2dnZXI6IGxvZ2dlcixcbiAgICAgICAgICBwYXRoOiBvcHRpb25zLnBhdGgsXG4gICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICBwYXJhbXNUeXBlOiBcInJhd1wiXG4gICAgICAgIH0pO1xuICAgICAgICBmaW5hbGVzID0gZXhlY3V0ZWQuZmluYWxlcztcbiAgICAgICAgYXdhaXQgaGFuZGxlQ2xvc2UoXCJhY3Rpb25cIik7XG4gICAgICAgIGlmIChleGVjdXRlZC5lbXB0eVJlc3VsdCkge1xuICAgICAgICAgIHBvcnQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgZXhlY3V0ZUlkOiBvcHRpb25zLmV4ZWN1dGVJZCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB1bmRlZmluZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwb3J0LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGV4ZWN1dGVJZDogb3B0aW9ucy5leGVjdXRlSWQsXG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgZGF0YTogZXhlY3V0ZWQucmVzdWx0cy52YWx1ZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocm91dGVTY2hlbWEudHlwZSA9PT0gXCJzdHJlYW1cIikge1xuICAgICAgICBjb25zdCBleGVjdXRlZCA9IGF3YWl0IGV4ZWN1dGVyLl9fZXhlY3V0ZShyb3V0ZVNjaGVtYSwge1xuICAgICAgICAgIGNyZWF0ZWRFeGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLFxuICAgICAgICAgIGNyZWF0ZWRMb2dnZXI6IGxvZ2dlcixcbiAgICAgICAgICBwYXRoOiBvcHRpb25zLnBhdGgsXG4gICAgICAgICAgaGVhZGVycyxcbiAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgIHBhcmFtcyxcbiAgICAgICAgICBwYXJhbXNUeXBlOiBcInJhd1wiXG4gICAgICAgIH0pO1xuICAgICAgICBmaW5hbGVzID0gZXhlY3V0ZWQuZmluYWxlcztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwb3J0LnBvc3RNZXNzYWdlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdW5kZWZpbmVkLCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiBmYWxzZSB9KTtcbiAgICAgICAgICBzdHJlYW1DbG9zZXJzLnNldChvcHRpb25zLmV4ZWN1dGVJZCwgeyBnZW5lcmF0b3I6IGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUsIGhhbmRsZUNsb3NlIH0pO1xuICAgICAgICAgIGZvciBhd2FpdCAoY29uc3QgdmFsdWUgb2YgZXhlY3V0ZWQucmVzdWx0cy52YWx1ZSkge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogW251bGwsIHZhbHVlXSwgZXhlY3V0ZUlkOiBvcHRpb25zLmV4ZWN1dGVJZCwgZG9uZTogZmFsc2UgfTtcbiAgICAgICAgICAgIHBvcnQucG9zdE1lc3NhZ2UoZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBvcnQucG9zdE1lc3NhZ2UoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB1bmRlZmluZWQsIGV4ZWN1dGVJZDogb3B0aW9ucy5leGVjdXRlSWQsIGRvbmU6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc3QgZXhjZXB0aW9uID0gZXhjZXB0aW9uSGFuZGxlcihvcHRpb25zLmV4ZWN1dGVJZCwgbG9nZ2VyLCBlcnJvcik7XG4gICAgICAgICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgICAgICAgcmVzdWx0W2V4Y2VwdGlvbi5jb2RlXSA9IGV4Y2VwdGlvbi5yZWplY3Q7XG4gICAgICAgICAgcG9ydC5wb3N0TWVzc2FnZSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IFtyZXN1bHQsIG51bGxdLCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKFwic3RyZWFtXCIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBleGNlcHRpb25IYW5kbGVyKG9wdGlvbnMuZXhlY3V0ZUlkLCBsb2dnZXIsIGVycm9yKTtcbiAgICAgIGF3YWl0IGxvZ2dlci5fLnN1Ym1pdChjb250ZXh0KTtcbiAgICAgIHBvcnQucG9zdE1lc3NhZ2UoeyBzdWNjZXNzOiBmYWxzZSwgZGF0YTogdW5kZWZpbmVkLCBlcnJvcjogcmVzdWx0LCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiB0cnVlIH0pO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBwb3J0LFxuICAgIGZldGNoLFxuICAgIGhhbmRsZU1lc3NhZ2VcbiAgfTtcbn1cbi8vIHBhY2thZ2VzL21pbGtpby9leGNlcHRpb24vaW5kZXgudHNcbmZ1bmN0aW9uIHJlamVjdChjb2RlLCBkYXRhKSB7XG4gIGNvbnN0IGVycm9yID0geyAkbWlsa2lvUmVqZWN0OiB0cnVlLCBjb2RlLCBkYXRhIH07XG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIilcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnJvcik7XG4gIHJldHVybiBlcnJvcjtcbn1cbmZ1bmN0aW9uIHJhaXNlKG9iaikge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgY29uc3QgY29kZSA9IGtleXNbMF07XG4gIGlmIChjb2RlID09PSB1bmRlZmluZWQpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicmFpc2UoKSByZXF1aXJlcyBhbiBvYmplY3Qgd2l0aCBhdCBsZWFzdCBvbmUga2V5IGFzIHRoZSByZWplY3Rpb24gY29kZVwiKTtcbiAgY29uc3QgcmVqZWN0RGF0YSA9IG9ialtjb2RlXTtcbiAgY29uc3QgZXJyb3IgPSB7ICRtaWxraW9SZWplY3Q6IHRydWUsIGNvZGUsIGRhdGE6IHJlamVjdERhdGEgfTtcbiAgaWYgKHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycm9yKTtcbiAgcmV0dXJuIGVycm9yO1xufVxuZnVuY3Rpb24gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgXCJ2aXRlU2VydmVyXCIgaW4gZ2xvYmFsVGhpcykge1xuICAgIHRyeSB7XG4gICAgICBnbG9iYWxUaGlzLnZpdGVTZXJ2ZXIuc3NyRml4U3RhY2t0cmFjZShlcnJvcik7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIGNvbnN0IG5hbWUgPSBlcnJvcj8uY29kZSA/PyBlcnJvcj8ubmFtZSA/PyBlcnJvcj8uY29uc3RydWN0b3I/Lm5hbWUgPz8gXCJVbm5hbWVkIEV4Y2VwdGlvblwiO1xuICBpZiAoZXJyb3I/LiRtaWxraW9SZWplY3QgPT09IHRydWUpIHtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gXCJOT1RfRk9VTkRcIikge1xuICAgICAgbG9nZ2VyLmluZm8obmFtZSwgZXJyb3I/LmRhdGE/LnBhdGggPz8gXCJVbmtub3duIHBhdGhcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YWNrID0gKGVycm9yPy5zdGFjayA/PyBcIlwiKS5zcGxpdChgXG5gKS5zbGljZSgyKS5qb2luKGBcbmApO1xuICAgICAgbG9nZ2VyLndhcm4obmFtZSwgYFxuJHtKU09OLnN0cmluZ2lmeShlcnJvcj8uZGF0YSl9YCwgYFxuJHtzdGFja31cbmApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhY2sgPSBlcnJvcj8uc3RhY2sgPz8gXCJcIjtcbiAgICAgIGxvZ2dlci5lcnJvcihuYW1lLCBgXG4ke0pTT04uc3RyaW5naWZ5KGVycm9yPy5kYXRhKX1gLCBgXG4ke3N0YWNrfVxuYCk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgbG9nZ2VyLmVycm9yKG5hbWUsIGBcbiR7ZXJyb3I/LnRvU3RyaW5nKCl9YCwgYFxuJHtlcnJvcj8uc3RhY2t9XG5gKTtcbiAgICB9XG4gIH1cbiAgbGV0IHJlc3VsdDtcbiAgaWYgKGVycm9yPy4kbWlsa2lvUmVqZWN0ID09PSB0cnVlKVxuICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGNvZGU6IGVycm9yLmNvZGUsIHJlamVjdDogZXJyb3IuZGF0YSwgZXhlY3V0ZUlkIH07XG4gIGVsc2VcbiAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IGZhbHNlLCBjb2RlOiBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLCByZWplY3Q6IHVuZGVmaW5lZCwgZXhlY3V0ZUlkIH07XG4gIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnQge1xuICBfX2luaXRFdmVudE1hbmFnZXIsXG4gIF9faW5pdEV4ZWN1dGVyLFxuICBfX2luaXRMaXN0ZW5lcixcbiAgY29uZmlnLFxuICBjcmVhdGVGbG93LFxuICBjcmVhdGVMb2dnZXIsXG4gIGNyZWF0ZVN0ZXAsXG4gIGNyZWF0ZVdvcmxkLFxuICBlbnZUb0Jvb2xlYW4sXG4gIGVudlRvTnVtYmVyLFxuICBlbnZUb1N0cmluZyxcbiAgZXhjZXB0aW9uSGFuZGxlcixcbiAgcGFydCxcbiAgcmFpc2UsXG4gIHJlamVjdCxcbiAgdHlwZVNhZmV0eSxcbiAgdHlwaWFcbn07XG5cbi8vIyBkZWJ1Z0lkPTg2NDYwOTIwNUI5Q0I1Q0Q2NDc1NkUyMTY0NzU2RTIxXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV3b2dJQ0oyWlhKemFXOXVJam9nTXl3S0lDQWljMjkxY21ObGN5STZJRnNpTGk0dmRYUnBiSE12Y0dGeWRDNTBjeUlzSUNJdUxpOTBlWEJsTFhOaFptVjBlUzlwYm1SbGVDNTBjeUlzSUNJdUxpOWpiMjVtYVdjdmFXNWtaWGd1ZEhNaUxDQWlMaTR2ZFhScGJITXZhR1ZoWkdWeWN5MTBieTFxYzI5dUxuUnpJaXdnSWk0dUwzVjBhV3h6TDIxbGNtZGxMV1JsWlhBdWRITWlMQ0FpTGk0dmRYUnBiSE12Y21WMmFYWmxMV3B6YjI0dGNHRnljMlV1ZEhNaUxDQWlMaTR2WlhobFkzVjBaUzlwYm1SbGVDNTBjeUlzSUNJdUxpOWxkbVZ1ZEM5cGJtUmxlQzUwY3lJc0lDSXVMaTltYkc5M0wybHVaR1Y0TG5Seklpd2dJaTR1TDNWMGFXeHpMMk55WldGMFpTMXBaQzUwY3lJc0lDSXVMaTlsZUdWamRYUmxMMlY0WldOMWRHVXRhV1F0WjJWdVpYSmhkRzl5TG5Seklpd2dJaTR1TDNkdmNteGtMMmx1WkdWNExuUnpJaXdnSWk0dUwzUjVjR2xoTDJsdVpHVjRMblJ6SWl3Z0lpNHVMM1YwYVd4ekwzTmxibVF0WTI5dmEySnZiMnN0WlhabGJuUXVkSE1pTENBaUxpNHZiRzluWjJWeUwybHVaR1Y0TG5Seklpd2dJaTR1TDNOMFpYQXZhVzVrWlhndWRITWlMQ0FpTGk0dmRYUnBiSE12ZEhKcFpTNTBjeUlzSUNJdUxpOTFkR2xzY3k5aWRXbHNaQzFqYjNKekxXaGxZV1JsY25NdWRITWlMQ0FpTGk0dmRYUnBiSE12YzJGdWFYUnBlbVV0WlhobFkzVjBaUzFwWkM1MGN5SXNJQ0l1TGk5c2FYTjBaVzVsY2k5cGJtUmxlQzUwY3lJc0lDSXVMaTlsZUdObGNIUnBiMjR2YVc1a1pYZ3VkSE1pWFN3S0lDQWljMjkxY21ObGMwTnZiblJsYm5RaU9pQmJDaUFnSUNBaVpYaHdiM0owSUdaMWJtTjBhVzl1SUhCaGNuUThWQ0JsZUhSbGJtUnpJQ2dwSUQwK0lIVnVhMjV2ZDI0K0tHaGhibVJzWlhJNklGUXBPaUJTWlhSMWNtNVVlWEJsUEZRK0lIdGNiaUFnY21WMGRYSnVJR2hoYm1Sc1pYSW9LU0JoY3lCMWJtdHViM2R1SUdGeklGSmxkSFZ5YmxSNWNHVThWRDQ3WEc1OVhHNGlMQW9nSUNBZ0ltVjRjRzl5ZENCMGVYQmxJRlI1Y0dWVFlXWmxkSGs4Vm1Gc2RXVWdaWGgwWlc1a2N5QlNaV052Y21ROFlXNTVMQ0JoYm5rK1BpQTlJQ2gyWVd4MVpUb2dWbUZzZFdVcElEMCtJRlI1Y0dWVFlXWmxkSGxXWVd4MVpUdGNibHh1Wlhod2IzSjBJR2x1ZEdWeVptRmpaU0JVZVhCbFUyRm1aWFI1Vm1Gc2RXVWdlMXh1SUNCMGVYQmxPaUE4Vkhsd1pTQmxlSFJsYm1SeklGSmxZMjl5WkR4aGJua3NJR0Z1ZVQ0K0tDa2dQVDRnVkhsd1pUdGNibjFjYmx4dVpYaHdiM0owSUdsdWRHVnlabUZqWlNCVWVYQmxVMkZtWlhSNVZIbHdaVHhVZVhCbElHVjRkR1Z1WkhNZ1VtVmpiM0prUEdGdWVTd2dZVzU1UGo0Z2UxeHVJQ0FrYldsc2EybHZWSGx3WlRvZ1hDSjBlWEJsTFhOaFptVjBlVndpTzF4dUlDQjJZV3gxWlRvZ1ZIbHdaVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlIUjVjR1ZUWVdabGRIazhWbUZzZFdVZ1pYaDBaVzVrY3lCU1pXTnZjbVE4WVc1NUxDQmhibmsrUGloMllXeDFaVG9nVm1Gc2RXVXBPaUJVZVhCbFUyRm1aWFI1Vm1Gc2RXVWdlMXh1SUNCeVpYUjFjbTRnZTF4dUlDQWdJSFI1Y0dVNklDZ3BJRDArSUNoN0lDUnRhV3hyYVc5VWVYQmxPaUJjSW5SNWNHVXRjMkZtWlhSNVhDSXNJSFpoYkhWbElIMHBMRnh1SUNCOUlHRnpJR0Z1ZVR0Y2JuMWNiaUlzQ2lBZ0lDQWlaWGh3YjNKMElHWjFibU4wYVc5dUlHTnZibVpwWnp4RGIyNW1hV2RVSUdWNGRHVnVaSE1nUTI5dVptbG5QaWhqYjI1bWFXYzZJRU52Ym1acFoxUXBPaUJEYjI1bWFXZFVJSHRjYmlBZ2NtVjBkWEp1SUdOdmJtWnBaenRjYm4xY2JseHVaWGh3YjNKMElIUjVjR1VnUTI5dVptbG5JRDBnS0cxdlpHVTZJSE4wY21sdVp5a2dQVDRnVUhKdmJXbHpaVHhTWldOdmNtUThjM1J5YVc1bkxDQjFibXR1YjNkdVBqNGdmQ0JTWldOdmNtUThjM1J5YVc1bkxDQjFibXR1YjNkdVBqdGNibHh1Wlhod2IzSjBJR2x1ZEdWeVptRmpaU0JEYjI1bWFXZEZiblpwY205dWJXVnVkSE04VkNCbGVIUmxibVJ6SUVOdmJtWnBaejRnZTF4dUlDQmJhMlY1T2lCemRISnBibWRkT2lBb1pXNTJPaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK0tTQTlQaUJRWVhKMGFXRnNQRUYzWVdsMFpXUThVbVYwZFhKdVZIbHdaVHhVUGo0K0lId2dVSEp2YldselpUeFFZWEowYVdGc1BFRjNZV2wwWldROFVtVjBkWEp1Vkhsd1pUeFVQajQrUGp0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR1Z1ZGxSdlUzUnlhVzVuS0haaGJIVmxPaUJ6ZEhKcGJtY2dmQ0J1ZFcxaVpYSWdmQ0IxYm1SbFptbHVaV1FzSUdSbFptRjFiSFJXWVd4MVpUb2djM1J5YVc1bktTQjdYRzRnSUdsbUlDaDJZV3gxWlNBOVBUMGdkVzVrWldacGJtVmtLU0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJSEpsZEhWeWJpQmdKSHQyWVd4MVpYMWdPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1pXNTJWRzlPZFcxaVpYSW9kbUZzZFdVNklITjBjbWx1WnlCOElIVnVaR1ZtYVc1bFpDd2daR1ZtWVhWc2RGWmhiSFZsT2lCdWRXMWlaWElwSUh0Y2JpQWdhV1lnS0haaGJIVmxJRDA5UFNCMWJtUmxabWx1WldRcElISmxkSFZ5YmlCa1pXWmhkV3gwVm1Gc2RXVTdYRzVjYmlBZ2NtVjBkWEp1SUU1MWJXSmxjaTV3WVhKelpVbHVkQ2gyWVd4MVpTd2dNVEFwTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdaVzUyVkc5Q2IyOXNaV0Z1S0haaGJIVmxPaUJ6ZEhKcGJtY2dmQ0J1ZFcxaVpYSWdmQ0IxYm1SbFptbHVaV1FzSUdSbFptRjFiSFJXWVd4MVpUb2dZbTl2YkdWaGJpa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BUMDlJRndpZEhKMVpWd2lLU0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb2RtRnNkV1VnUFQwOUlGd2labUZzYzJWY0lpa2djbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJR2xtSUNoMllXeDFaU0E5UFQwZ1hDSmNJaWtnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaDFibVJsWm1sdVpXUWdQVDA5SUhaaGJIVmxLU0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJSEpsZEhWeWJpQkNiMjlzWldGdUtIWmhiSFZsS1R0Y2JuMWNiaUlzQ2lBZ0lDQWlaWGh3YjNKMElHWjFibU4wYVc5dUlHaGxZV1JsY25OVWIwcFRUMDRvYUdWaFpHVnljem9nU0dWaFpHVnljeWtnZTF4dUlDQmpiMjV6ZENCcWMyOXVPaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK0lEMGdlMzA3WEc0Z0lHWnZjaUFvWTI5dWMzUWdXMnRsZVN3Z2RtRnNkV1ZkSUc5bUlDaG9aV0ZrWlhKeklHRnpJR0Z1ZVNrdVpXNTBjbWxsY3lncEtTQjdYRzRnSUNBZ2FuTnZibHRyWlhsZElEMGdkbUZzZFdVN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdwemIyNDdYRzU5WEc0aUxBb2dJQ0FnSW1aMWJtTjBhVzl1SUdselVHeGhhVzVQWW1wbFkzUW9kbUZzZFdVNklHRnVlU2s2SUhaaGJIVmxJR2x6SUZKbFkyOXlaRHh6ZEhKcGJtY3NJR0Z1ZVQ0Z2UxeHVJQ0J5WlhSMWNtNGdkSGx3Wlc5bUlIWmhiSFZsSUQwOVBTQmNJbTlpYW1WamRGd2lJQ1ltSUhaaGJIVmxJQ0U5UFNCdWRXeHNJQ1ltSUNGQmNuSmhlUzVwYzBGeWNtRjVLSFpoYkhWbEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUcxbGNtZGxSR1ZsY0R4VUlHVjRkR1Z1WkhNZ1VtVmpiM0prUEhOMGNtbHVaeXdnWVc1NVBpd2dWU0JsZUhSbGJtUnpJRkpsWTI5eVpEeHpkSEpwYm1jc0lHRnVlVDQrS0hSaGNtZGxkRG9nVkN3Z2MyOTFjbU5sT2lCVktUb2dWQ0I3WEc0Z0lHTnZibk4wSUcxbGNtZGxaQ0E5SUhzZ0xpNHVkR0Z5WjJWMElIMDdYRzVjYmlBZ1ptOXlJQ2hqYjI1emRDQnJaWGtnYVc0Z2MyOTFjbU5sS1NCN1hHNGdJQ0FnYVdZZ0tDRlBZbXBsWTNRdWNISnZkRzkwZVhCbExtaGhjMDkzYmxCeWIzQmxjblI1TG1OaGJHd29jMjkxY21ObExDQnJaWGtwS1NCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE52ZFhKalpWWmhiSFZsSUQwZ2MyOTFjbU5sVzJ0bGVWMDdYRzRnSUNBZ1kyOXVjM1FnZEdGeVoyVjBWbUZzZFdVZ1BTQjBZWEpuWlhSYmEyVjVJR0Z6SUd0bGVXOW1JRlJkTzF4dVhHNGdJQ0FnYVdZZ0tFOWlhbVZqZEM1d2NtOTBiM1I1Y0dVdWFHRnpUM2R1VUhKdmNHVnlkSGt1WTJGc2JDaDBZWEpuWlhRc0lHdGxlU2twSUh0Y2JpQWdJQ0FnSUdsbUlDaHBjMUJzWVdsdVQySnFaV04wS0hSaGNtZGxkRlpoYkhWbEtTQW1KaUJwYzFCc1lXbHVUMkpxWldOMEtITnZkWEpqWlZaaGJIVmxLU2tnZTF4dUlDQWdJQ0FnSUNCdFpYSm5aV1JiYTJWNUlHRnpJR3RsZVc5bUlGUWdKaUJyWlhsdlppQlZYU0E5SUcxbGNtZGxSR1ZsY0NoMFlYSm5aWFJXWVd4MVpTd2djMjkxY21ObFZtRnNkV1VwSUdGeklHRnVlVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0tHMWxjbWRsWkNCaGN5QmhibmtwVzJ0bGVWMGdQU0J6YjNWeVkyVldZV3gxWlR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnYldWeVoyVmtJR0Z6SUZRZ0ppQlZPMXh1ZlZ4dUlpd0tJQ0FnSUNKamIyNXpkQ0JwYzI5RVlYUmxVR0YwZEdWeWJpQTlJQzllS0Z4Y1pIczBmUzFjWEdSN01uMHRYRnhrZXpKOVZGeGNaSHN5ZlRwY1hHUjdNbjA2WEZ4a2V6SjlLRDg2WEZ3dVhGeGtlekVzTTMwcFB5a29XbnhiS3kxZFhGeGtleko5T2o5Y1hHUjdNbjBwUHlRdk8xeHVYRzVtZFc1amRHbHZiaUIwY25sUVlYSnpaVVJoZEdVb2MzUnlPaUJ6ZEhKcGJtY3BPaUJFWVhSbElId2diblZzYkNCN1hHNGdJQ0FnWTI5dWMzUWdiR1Z1SUQwZ2MzUnlMbXhsYm1kMGFEdGNiaUFnSUNCcFppQW9iR1Z1SUQ0OUlESXdJQ1ltSUd4bGJpQThQU0F6TWlBbUppQnpkSEl1WTJoaGNrTnZaR1ZCZENnd0tTQStQU0F3ZURNd0lDWW1JSE4wY2k1amFHRnlRMjlrWlVGMEtEQXBJRHc5SURCNE16a2dKaVlnYzNSeUxtbHVaR1Y0VDJZb0oxUW5LU0FoUFQwZ0xURXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV0YwWTJnZ1BTQnBjMjlFWVhSbFVHRjBkR1Z5Ymk1bGVHVmpLSE4wY2lrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h0WVhSamFDQWhQVDBnYm5Wc2JDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdGMFpWQmhjblFnUFNCdFlYUmphRnN4WFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIUjZVR0Z5ZENBOUlHMWhkR05vV3pKZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUmhkR1ZRWVhKMElEMDlQU0IxYm1SbFptbHVaV1FwSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjZVR0Z5ZENBaFBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdibTl5YldGc2FYcGxaRlI2SUQwZ2RIcFFZWEowTG14bGJtZDBhQ0E5UFQwZ05TQW1KaUIwZWxCaGNuUXVZMmhoY2tGMEtETXBJQ0U5UFNCY0lqcGNJaUEvSUdBa2UzUjZVR0Z5ZEM1emJHbGpaU2d3TENBektYMDZKSHQwZWxCaGNuUXVjMnhwWTJVb015bDlZQ0E2SUhSNlVHRnlkRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVSaGRHVW9aR0YwWlZCaGNuUWdLeUJ1YjNKdFlXeHBlbVZrVkhvcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJFWVhSbEtHUmhkR1ZRWVhKMElDc2dKMW9uS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdiblZzYkR0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJSEpsZG1sMlpVcFRUMDVRWVhKelpUeFVQaWhxYzI5dU9pQlVLVG9nVkNCN1hHNGdJQ0FnYVdZZ0tHcHpiMjRnUFQwOUlHNTFiR3dnZkh3Z2FuTnZiaUE5UFQwZ2RXNWtaV1pwYm1Wa0tTQnlaWFIxY200Z2FuTnZianRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JR3B6YjI0Z1BUMDlJQ2R2WW1wbFkzUW5LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHFjMjl1SUdsdWMzUmhibU5sYjJZZ1JHRjBaU2tnY21WMGRYSnVJR3B6YjI0N1hHNGdJQ0FnSUNBZ0lHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtHcHpiMjRwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnNaVzRnUFNCcWMyOXVMbXhsYm1kMGFEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdPeUJwSUR3Z2JHVnVPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCMklEMGdhbk52Ymx0cFhUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JSFlnUFQwOUlDZHpkSEpwYm1jbktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1FnUFNCMGNubFFZWEp6WlVSaGRHVW9kaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hrSUNFOVBTQnVkV3hzS1NCcWMyOXVXMmxkSUQwZ1pEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQjJJRDA5UFNBbmIySnFaV04wSnlBbUppQjJJQ0U5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkbWwyWlVwVFQwNVFZWEp6WlNoMktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdhbk52Ymp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdlltb2dQU0JxYzI5dUlHRnpJRkpsWTI5eVpEeHpkSEpwYm1jc0lIVnVhMjV2ZDI0K08xeHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR3RsZVNCcGJpQnZZbW9wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaFQySnFaV04wTG5CeWIzUnZkSGx3WlM1b1lYTlBkMjVRY205d1pYSjBlUzVqWVd4c0tHOWlhaXdnYTJWNUtTa2dZMjl1ZEdsdWRXVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0IySUQwZ2IySnFXMnRsZVYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhZZ1BUMDlJQ2R6ZEhKcGJtY25LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaQ0E5SUhSeWVWQmhjbk5sUkdGMFpTaDJLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1pDQWhQVDBnYm5Wc2JDa2diMkpxVzJ0bGVWMGdQU0JrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdkaUE5UFQwZ0oyOWlhbVZqZENjZ0ppWWdkaUFoUFQwZ2JuVnNiQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRtbDJaVXBUVDA1UVlYSnpaU2gyS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYW5OdmJqdGNiaUFnSUNCOVhHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCcWMyOXVJRDA5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa0lEMGdkSEo1VUdGeWMyVkVZWFJsS0dwemIyNHBPMXh1SUNBZ0lDQWdJQ0JwWmlBb1pDQWhQVDBnYm5Wc2JDa2djbVYwZFhKdUlHUWdZWE1nWVc1NU8xeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdhbk52Ymp0Y2JuMGlMQW9nSUNBZ0ltbHRjRzl5ZENCMGVYQmxJSHNnU1ZaaGJHbGtZWFJwYjI0Z2ZTQm1jbTl0SUZ3aWRIbHdhV0ZjSWp0Y2JtbHRjRzl5ZENCN0lISmxhbVZqZEN3Z2NtRnBjMlVnZlNCbWNtOXRJRndpTGk0dmFXNWtaWGd1ZEhOY0lqdGNibWx0Y0c5eWRDQjBlWEJsSUhzZ0pHTnZiblJsZUhRc0lDUnRaWFJoTENCTWIyZG5aWElzSUZKbGMzVnNkSE1zSUVkbGJtVnlZWFJsWkVsdWFYUWdmU0JtY205dElGd2lMaTR2YVc1a1pYZ3VkSE5jSWp0Y2JtbHRjRzl5ZENCN0lHaGxZV1JsY25OVWIwcFRUMDRnZlNCbWNtOXRJRndpTGk0dmRYUnBiSE12YUdWaFpHVnljeTEwYnkxcWMyOXVMblJ6WENJN1hHNXBiWEJ2Y25RZ2V5QnRaWEpuWlVSbFpYQWdmU0JtY205dElGd2lMaTR2ZFhScGJITXZiV1Z5WjJVdFpHVmxjQzUwYzF3aU8xeHVhVzF3YjNKMElIc2djbVYyYVhabFNsTlBUbEJoY25ObElIMGdabkp2YlNCY0lpNHVMM1YwYVd4ekwzSmxkbWwyWlMxcWMyOXVMWEJoY25ObExuUnpYQ0k3WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCZlgybHVhWFJGZUdWamRYUmxjaWhuWlc1bGNtRjBaV1E2SUVkbGJtVnlZWFJsWkVsdWFYUXNJSEoxYm5ScGJXVTZJR0Z1ZVNrZ2UxeHVJQ0FnSUdOdmJuTjBJRjlmWlhobFkzVjBaU0E5SUdGemVXNWpJQ2hjYmlBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFNklHRnVlU3hjYmlBZ0lDQWdJQ0FnYjNCMGFXOXVjem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZM0psWVhSbFpFVjRaV04xZEdWSlpEb2djM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTNKbFlYUmxaRXh2WjJkbGNqb2dURzluWjJWeU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFEb2djM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYUdWaFpHVnljem9nVW1WamIzSmtQSE4wY21sdVp5d2djM1J5YVc1blBpQjhJRWhsWVdSbGNuTTdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwT2lCaGJua2dmQ0IxYm1SbFptbHVaV1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndZWEpoYlhORGIyNTBaVzUwVkhsd1pUODZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdmU0FtSUNoY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpPaUJTWldOdmNtUThZVzU1TENCaGJuaytPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE5VZVhCbE9pQmNJbkpoZDF3aU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjhJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnlZVzF6T2lCemRISnBibWM3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzFSNWNHVTZJRndpYzNSeWFXNW5YQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdLU3hjYmlBZ0lDQXBPaUJRY205dGFYTmxQSHNnWlhobFkzVjBaVWxrT2lCemRISnBibWM3SUdobFlXUmxjbk02SUVobFlXUmxjbk03SUhCaGNtRnRjem9nVW1WamIzSmtQR0Z1ZVN3Z2RXNXJibTkzYmo0N0lISmxjM1ZzZEhNNklGSmxjM1ZzZEhNOFlXNTVQanNnWTI5dWRHVjRkRG9nSkdOdmJuUmxlSFE3SUcxbGRHRTZJRkpsWVdSdmJteDVQQ1J0WlhSaFBqc2dkSGx3WlRvZ1hDSmhZM1JwYjI1Y0lpQjhJRndpYzNSeVpXRnRYQ0k3SUdWdGNIUjVVbVZ6ZFd4ME9pQmliMjlzWldGdU95Qm1hVzVoYkdWek9pQkJjbkpoZVR3b0tTQTlQaUIyYjJsa0lId2dVSEp2YldselpUeDJiMmxrUGo0Z2ZUNGdQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IwZVhCbElEMGdiM0IwYVc5dWN5NXdZWFJvTG1WdVpITlhhWFJvS0Z3aWZsd2lLU0EvSUZ3aWMzUnlaV0Z0WENJZ09pQmNJbUZqZEdsdmJsd2lPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxlR1ZqZFhSbFNXUTZJSE4wY21sdVp5QTlJRzl3ZEdsdmJuTXVZM0psWVhSbFpFVjRaV04xZEdWSlpEdGNiaUFnSUNBZ0lDQWdiR1YwSUdobFlXUmxjbk02SUVobFlXUmxjbk03WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hLRzl3ZEdsdmJuTXVhR1ZoWkdWeWN5QnBibk4wWVc1alpXOW1JRWhsWVdSbGNuTXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJUZFhCd2IzSjBJR3hwWjJoMGQyVnBaMmgwSUdobFlXUmxjbk1nY0hKdmVIa2dkMmwwYUNCblpYUW9LU0J0WlhSb2IyUmNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ0tHOXdkR2x2Ym5NdWFHVmhaR1Z5Y3lCaGN5QmhibmtwUHk1blpYUWdQVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpQW1KaUFoS0c5d2RHbHZibk11YUdWaFpHVnljeUJwYm5OMFlXNWpaVzltSUVobFlXUmxjbk1wS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3lBOUlHOXdkR2x2Ym5NdWFHVmhaR1Z5Y3lCaGN5QjFibXR1YjNkdUlHRnpJRWhsWVdSbGNuTTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVTJ0cGNDQjBiMHBUVDA0Z1ptOXlJR3hwWjJoMGQyVnBaMmgwSUhCeWIzaDVJQzBnYm05MElHNWxaV1JsWkNCcGJpQklWRlJRSUhKbGNYVmxjM1FnY0dGMGFGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCQWRITXRhV2R1YjNKbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3lBOUlHNWxkeUJJWldGa1pYSnpLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xpNHViM0IwYVc5dWN5NW9aV0ZrWlhKekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaEtGd2lkRzlLVTA5T1hDSWdhVzRnYUdWaFpHVnljeWtwSUNob1pXRmtaWEp6SUdGeklHRnVlU2t1ZEc5S1UwOU9JRDBnS0NrZ1BUNGdhR1ZoWkdWeWMxUnZTbE5QVGlob1pXRmtaWEp6S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHaGxZV1JsY25NZ1BTQnZjSFJwYjI1ekxtaGxZV1JsY25NN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lTaGNJblJ2U2xOUFRsd2lJR2x1SUdobFlXUmxjbk1wS1NBb2FHVmhaR1Z5Y3lCaGN5QmhibmtwTG5SdlNsTlBUaUE5SUNncElEMCtJR2hsWVdSbGNuTlViMHBUVDA0b2FHVmhaR1Z5Y3lrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQm1hVzVoYkdWek9pQkJjbkpoZVR4aGJuaytJRDBnVzEwN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUc5dVJtbHVZV3hzZVNBOUlDaG9ZVzVrYkdWeU9pQmhibmtwSUQwK0lHWnBibUZzWlhNdWRXNXphR2xtZENob1lXNWtiR1Z5S1R0Y2JseHVJQ0FnSUNBZ0lDQnNaWFFnY0dGeVlXMXpPaUJTWldOdmNtUThZVzU1TENCMWJtdHViM2R1UGp0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVjR0Z5WVcxelZIbHdaU0E5UFQwZ1hDSnlZWGRjSWlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpJRDBnYjNCMGFXOXVjeTV3WVhKaGJYTTdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlIQmhjbUZ0Y3lBOVBUMGdYQ0oxYm1SbFptbHVaV1JjSWlrZ2NHRnlZVzF6SUQwZ2UzMDdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JVzl3ZEdsdmJuTXVjR0Z5WVcxeklIeDhJRzl3ZEdsdmJuTXVjR0Z5WVcxeklEMDlQU0JjSWx3aUlIeDhJRzl3ZEdsdmJuTXVjR0Z5WVcxeklEMDlQU0JjSW50OVhDSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTWdQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvYUdWaFpHVnljeTVuWlhRb1hDSmpiMjUwWlc1MExYUjVjR1ZjSWlrL0xuTjBZWEowYzFkcGRHZ29YQ0poY0hCc2FXTmhkR2x2Ymk5cWMyOXVYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnlZVzF6SUQwZ2NtVjJhWFpsU2xOUFRsQmhjbk5sS0VwVFQwNHVjR0Z5YzJVb2IzQjBhVzl1Y3k1d1lYSmhiWE1wS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUNobGNuSnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCeVpXcGxZM1FvWENKUVFWSkJUVk5mVkZsUVJWOU9UMVJmVTFWUVVFOVNWRVZFWENJc0lIc2daWGh3WldOMFpXUTZJRndpYW5OdmJsd2lMQ0JqYjI1MFpXNTBWSGx3WlRvZ2FHVmhaR1Z5Y3k1blpYUW9YQ0pqYjI1MFpXNTBMWFI1Y0dWY0lpa2dQejhnYm5Wc2JDd2djR0Z5WVcxek9pQnZjSFJwYjI1ekxuQmhjbUZ0Y3k1emJHbGpaU2d3TENBME1EazJLU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQndZWEpoYlhNZ1BUMDlJRndpZFc1a1pXWnBibVZrWENJcElIQmhjbUZ0Y3lBOUlIdDlPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaG9aV0ZrWlhKekxtZGxkQ2hjSW1OdmJuUmxiblF0ZEhsd1pWd2lLVDh1YzNSaGNuUnpWMmwwYUNoY0ltRndjR3hwWTJGMGFXOXVMM2d0ZDNkM0xXWnZjbTB0ZFhKc1pXNWpiMlJsWkZ3aUtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHWnZjbTFFWVhSaElEMGdibVYzSUZWU1RGTmxZWEpqYUZCaGNtRnRjeWh2Y0hScGIyNXpMbkJoY21GdGN5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjeUE5SUh0OU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNKdFJHRjBZUzVtYjNKRllXTm9LQ2gyWVd4MVpTd2dhMlY1S1NBOVBpQndZWEpoYlhOYmEyVjVYU0E5SUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdOaGRHTm9JQ2hsY25KdmNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pRUVZKQlRWTmZWRmxRUlY5T1QxUmZVMVZRVUU5U1ZFVkVYQ0lzSUhzZ1pYaHdaV04wWldRNklGd2labTl5YlMxMWNteGxibU52WkdWa1hDSXNJR052Ym5SbGJuUlVlWEJsT2lCb1pXRmtaWEp6TG1kbGRDaGNJbU52Ym5SbGJuUXRkSGx3WlZ3aUtTQS9QeUJ1ZFd4c0xDQndZWEpoYlhNNklHOXdkR2x2Ym5NdWNHRnlZVzF6TG5Oc2FXTmxLREFzSURRd09UWXBJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvYjNCMGFXOXVjeTV3WVhKaGJYTXVjM1JoY25SelYybDBhQ2hjSW50Y0lpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTWdQU0J5WlhacGRtVktVMDlPVUdGeWMyVW9TbE5QVGk1d1lYSnpaU2h2Y0hScGIyNXpMbkJoY21GdGN5a3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dLR1Z5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJSEpsYW1WamRDaGNJbEJCVWtGTlUxOVVXVkJGWDA1UFZGOVRWVkJRVDFKVVJVUmNJaXdnZXlCbGVIQmxZM1JsWkRvZ1hDSnFjMjl1WENJc0lHTnZiblJsYm5SVWVYQmxPaUJvWldGa1pYSnpMbWRsZENoY0ltTnZiblJsYm5RdGRIbHdaVndpS1NBL1B5QnVkV3hzTENCd1lYSmhiWE02SUc5d2RHbHZibk11Y0dGeVlXMXpMbk5zYVdObEtEQXNJRFF3T1RZcElIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lISmxhbVZqZENoY0lsQkJVa0ZOVTE5VVdWQkZYMDVQVkY5VFZWQlFUMUpVUlVSY0lpd2dleUJsZUhCbFkzUmxaRG9nWENKcWMyOXVYQ0lzSUdOdmJuUmxiblJVZVhCbE9pQm9aV0ZrWlhKekxtZGxkQ2hjSW1OdmJuUmxiblF0ZEhsd1pWd2lLU0EvUHlCdWRXeHNMQ0J3WVhKaGJYTTZJRzl3ZEdsdmJuTXVjR0Z5WVcxekxuTnNhV05sS0RBc0lEUXdPVFlwSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjR0Z5WVcxeklDRTlQU0JjSW05aWFtVmpkRndpSUh4OElFRnljbUY1TG1selFYSnlZWGtvY0dGeVlXMXpLU2tnZEdoeWIzY2djbVZxWldOMEtGd2lVRUZTUVUxVFgxUlpVRVZmVGs5VVgxTlZVRkJQVWxSRlJGd2lMQ0I3SUdWNGNHVmpkR1ZrT2lCY0ltcHpiMjVjSWl3Z1kyOXVkR1Z1ZEZSNWNHVTZJR2hsWVdSbGNuTXVaMlYwS0Z3aVkyOXVkR1Z1ZEMxMGVYQmxYQ0lwSUQ4L0lHNTFiR3dzSUhCaGNtRnRjem9nS0hSNWNHVnZaaUJ2Y0hScGIyNXpMbkJoY21GdGN5QTlQVDBnWENKemRISnBibWRjSWlBL0lHOXdkR2x2Ym5NdWNHRnlZVzF6SURvZ1NsTlBUaTV6ZEhKcGJtZHBabmtvYjNCMGFXOXVjeTV3WVhKaGJYTXBLUzV6YkdsalpTZ3dMQ0EwTURrMktTQjlLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2lKRzFwYkd0cGIwZGxibVZ5WVhSbFVHRnlZVzF6WENJZ2FXNGdjR0Z5WVcxeklDWW1JSEJoY21GdGN5NGtiV2xzYTJsdlIyVnVaWEpoZEdWUVlYSmhiWE1nUFQwOUlGd2laVzVoWW14bFhDSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY25WdWRHbHRaUzVrWlhabGJHOXdLU0IwYUhKdmR5QnlaV3BsWTNRb1hDSk9UMVJmUkVWV1JVeFBVRjlOVDBSRlhDSXNJRndpVkdocGN5Qm1aV0YwZFhKbElHMTFjM1FnWW1VZ2FXNGdZMjl2YTJKdmIyc2dkRzhnZFhObExsd2lLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUmxiR1YwWlNCd1lYSmhiWE11SkcxcGJHdHBiMGRsYm1WeVlYUmxVR0Z5WVcxek8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElIQmhjbUZ0YzFKaGJtUWdQU0J5YjNWMFpWTmphR1Z0WVM1eVlXNWtiMjFRWVhKaGJYTW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h3WVhKaGJYTlNZVzVrSUQwOVBTQjFibVJsWm1sdVpXUWdmSHdnY0dGeVlXMXpVbUZ1WkNBOVBUMGdiblZzYkNrZ2NHRnlZVzF6VW1GdVpDQTlJSHQ5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxeklEMGdiV1Z5WjJWRVpXVndLSEJoY21GdGN5d2djR0Z5WVcxelVtRnVaQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnZjSFJwYjI1ekxtTnlaV0YwWldSTWIyZG5aWEl1WkdWaWRXY29YQ0xpbktnZ2RHaGxJR2RsYm1WeVlYUmxaQ0J3WVhKaGJYTTZYQ0lzSUVwVFQwNHVjM1J5YVc1bmFXWjVLSEJoY21GdGN5a3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hiM0IwYVc5dWN5NWpiMjUwWlhoMFB5NW9kSFJ3UHk1dWIzUkdiM1Z1WkNBbUppQnZjSFJwYjI1ekxtTnZiblJsZUhRL0xtaDBkSEEvTG5CaGNtRnRjejh1YzNSeWFXNW5LU0J2Y0hScGIyNXpMbU52Ym5SbGVIUXVhSFIwY0M1d1lYSmhiWE11Y0dGeWMyVmtJRDBnY0dGeVlXMXpPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hiM0IwYVc5dWN5NWpiMjUwWlhoMEtTQnZjSFJwYjI1ekxtTnZiblJsZUhRZ1BTQjdmVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZM1I0SUQwZ2IzQjBhVzl1Y3k1amIyNTBaWGgwTzF4dUlDQWdJQ0FnSUNCamRIZ3VaR1YyWld4dmNDQTlJSEoxYm5ScGJXVXVaR1YyWld4dmNEdGNiaUFnSUNBZ0lDQWdZM1I0TG5CaGRHZ2dQU0J2Y0hScGIyNXpMbkJoZEdnN1hHNGdJQ0FnSUNBZ0lHTjBlQzV5YjNWMFpWUjVjR1VnUFNCMGVYQmxPMXh1SUNBZ0lDQWdJQ0JqZEhndWJHOW5aMlZ5SUQwZ2IzQjBhVzl1Y3k1amNtVmhkR1ZrVEc5bloyVnlPMXh1SUNBZ0lDQWdJQ0JqZEhndVpXMXBkQ0E5SUhKMWJuUnBiV1V1WlcxcGREdGNiaUFnSUNBZ0lDQWdZM1I0TG1WdGFYUkJibmxCY0hCeWIzWmxaQ0E5SUhKMWJuUnBiV1V1WlcxcGRFRnVlVUZ3Y0hKdmRtVmtPMXh1SUNBZ0lDQWdJQ0JqZEhndVpXMXBkRUZzYkVGd2NISnZkbVZrSUQwZ2NuVnVkR2x0WlM1bGJXbDBRV3hzUVhCd2NtOTJaV1E3WEc0Z0lDQWdJQ0FnSUdOMGVDNWxlR1ZqZFhSbFNXUWdQU0J2Y0hScGIyNXpMbU55WldGMFpXUkZlR1ZqZFhSbFNXUTdYRzRnSUNBZ0lDQWdJR04wZUM1amIyNW1hV2NnUFNCeWRXNTBhVzFsTG5KMWJuUnBiV1V1WTI5dVptbG5PMXh1SUNBZ0lDQWdJQ0JqZEhndWRIbHdhV0VnUFNCblpXNWxjbUYwWldRdWRIbHdhV0ZUWTJobGJXRTdYRzRnSUNBZ0lDQWdJR04wZUM1allXeHNJRDBnS0cxdlpIVnNaVG9nWVc1NUxDQndZWEpoYlhNNklHRnVlU2tnUFQ0Z1gxOWpZV3hzS0dOMGVDd2diVzlrZFd4bExDQndZWEpoYlhNcE8xeHVJQ0FnSUNBZ0lDQmpkSGd1YjI1R2FXNWhiR3g1SUQwZ2IyNUdhVzVoYkd4NU8xeHVJQ0FnSUNBZ0lDQmpkSGd1WHlBOUlISjFiblJwYldVN1hHNGdJQ0FnSUNBZ0lHTjBlQzV5WldwbFkzUWdQU0J5WldwbFkzUTdYRzRnSUNBZ0lDQWdJR04wZUM1eVlXbHpaU0E5SUhKaGFYTmxPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEpsYzNWc2RITTZJRkpsYzNWc2RITThZVzU1UGlBOUlIc2dkbUZzZFdVNklIVnVaR1ZtYVc1bFpDQjlPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzF2WkhWc1pTQTlJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV1YwWVNBOUlDaHRiMlIxYkdVL0xtMWxkR0VnUHlCdGIyUjFiR1UvTG0xbGRHRWdPaUI3ZlNrZ1lYTWdkVzVyYm05M2JpQmhjeUJTWldGa2IyNXNlVHdrYldWMFlUNDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tHOXdkR2x2Ym5NdVkyOXVkR1Y0ZEM1b2RIUndQeTV5WlhGMVpYTjBQeTV0WlhSb2IyUWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdZV3hzYjNkTlpYUm9iMlJ6SUQwZ2JXVjBZVDh1YldWMGFHOWtjeUEvUHlCYlhDSlFUMU5VWENKZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmhiR3h2ZDAxbGRHaHZaSE11YVc1amJIVmtaWE1vYjNCMGFXOXVjeTVqYjI1MFpYaDBMbWgwZEhBdWNtVnhkV1Z6ZEM1dFpYUm9iMlFwS1NCMGFISnZkeUJ5WldwbFkzUW9YQ0pOUlZSSVQwUmZUazlVWDBGTVRFOVhSVVJjSWl3Z2RXNWtaV1pwYm1Wa0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHRaWFJoUHk1MGVYQmxVMkZtWlhSNUlEMDlQU0IxYm1SbFptbHVaV1FnZkh3Z2JXVjBZUzUwZVhCbFUyRm1aWFI1SUQwOVBTQjBjblZsSUh4OElDaEJjbkpoZVM1cGMwRnljbUY1S0cxbGRHRXVkSGx3WlZOaFptVjBlU2tnSmlZZ2JXVjBZUzUwZVhCbFUyRm1aWFI1TG1sdVkyeDFaR1Z6S0Z3aWNHRnlZVzF6WENJcEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2FXUmhkR2x2YmlBOUlISnZkWFJsVTJOb1pXMWhMblpoYkdsa1lYUmxVR0Z5WVcxektIQmhjbUZ0Y3lrZ1lYTWdTVlpoYkdsa1lYUnBiMjQ4WVc1NVBqdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hkbUZzYVdSaGRHbHZiaTV6ZFdOalpYTnpLU0IwYUhKdmR5QnlaV3BsWTNRb1hDSlFRVkpCVFZOZlZGbFFSVjlKVGtOUFVsSkZRMVJjSWl3Z2V5QXVMaTRvZG1Gc2FXUmhkR2x2YmlCaGN5QmhibmtwTG1WeWNtOXljMXN3WFN3Z2JXVnpjMkZuWlRvZ1lGUm9aU0IyWVd4MVpTQW5KSHNvZG1Gc2FXUmhkR2x2YmlCaGN5QmhibmtwTG1WeWNtOXljMXN3WFM1d1lYUm9mU2NnYVhNZ0p5UjdLSFpoYkdsa1lYUnBiMjRnWVhNZ1lXNTVLUzVsY25KdmNuTmJNRjB1ZG1Gc2RXVjlKeXdnZDJocFkyZ2daRzlsY3lCdWIzUWdiV1ZsZENBbkpIc29kbUZzYVdSaGRHbHZiaUJoY3lCaGJua3BMbVZ5Y205eWMxc3dYUzVsZUhCbFkzUmxaSDBuSUhKbGNYVnBjbVZ0Wlc1MGN5NWdJSDBwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdhV1lnS0hKMWJuUnBiV1V1WDJoaGMwVnRhWFJJWVc1a2JHVnljejh1S0Z3aWJXbHNhMmx2T21WNFpXTjFkR1ZDWldadmNtVmNJaWtnUHo4Z2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbVY0WldOMWRHVkNaV1p2Y21WY0lpd2dleUJsZUdWamRYUmxTV1E2SUc5d2RHbHZibk11WTNKbFlYUmxaRVY0WldOMWRHVkpaQ3dnYkc5bloyVnlPaUJ2Y0hScGIyNXpMbU55WldGMFpXUk1iMmRuWlhJc0lIQmhkR2c2SUc5d2RHbHZibk11Y0dGMGFDd2diV1YwWVN3Z1kyOXVkR1Y0ZERvZ2IzQjBhVzl1Y3k1amIyNTBaWGgwTENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MGN5NTJZV3gxWlNBOUlHRjNZV2wwSUcxdlpIVnNaUzVvWVc1a2JHVnlLRzl3ZEdsdmJuTXVZMjl1ZEdWNGRDd2djR0Z5WVcxektUdGNibHh1SUNBZ0lDQWdJQ0JzWlhRZ1pXMXdkSGxTWlhOMWJIUWdQU0JtWVd4elpUdGNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMzVnNkSE11ZG1Gc2RXVWdQVDA5SUhWdVpHVm1hVzVsWkNCOGZDQnlaWE4xYkhSekxuWmhiSFZsSUQwOVBTQnVkV3hzSUh4OElISmxjM1ZzZEhNdWRtRnNkV1VnUFQwOUlGd2lYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Z0Y0hSNVVtVnpkV3gwSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxjM1ZzZEhNdWRtRnNkV1VnUFNCN2ZUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtISmxjM1ZzZEhNdWRtRnNkV1VwSUh4OElIUjVjR1Z2WmlCeVpYTjFiSFJ6TG5aaGJIVmxJQ0U5UFNCY0ltOWlhbVZqZEZ3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pTUlZGVlJWTlVYMFpCU1V4Y0lpd2dYQ0pVYUdVZ2NtVjBkWEp1SUhSNWNHVWdiMllnZEdobElHaGhibVJzWlhJZ2JYVnpkQ0JpWlNCaGJpQW5iMkpxWldOMEp5d2dkMmhwWTJnZ2FYTWdZM1Z5Y21WdWRHeDVJR0Z1SUNja2UzUjVjR1Z2WmlCMGVYQmxiMllnY21WemRXeDBjeTUyWVd4MVpYMG5MbHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeWRXNTBhVzFsTGw5b1lYTkZiV2wwU0dGdVpHeGxjbk0vTGloY0ltMXBiR3RwYnpwbGVHVmpkWFJsUVdaMFpYSmNJaWtnUHo4Z2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbVY0WldOMWRHVkJablJsY2x3aUxDQjdJR1Y0WldOMWRHVkpaRG9nYjNCMGFXOXVjeTVqY21WaGRHVmtSWGhsWTNWMFpVbGtMQ0JzYjJkblpYSTZJRzl3ZEdsdmJuTXVZM0psWVhSbFpFeHZaMmRsY2l3Z2NHRjBhRG9nYjNCMGFXOXVjeTV3WVhSb0xDQnRaWFJoTENCamIyNTBaWGgwT2lCdmNIUnBiMjV6TG1OdmJuUmxlSFFzSUhKbGMzVnNkSE1zSUhKbGFtVmpkQ3dnY21GcGMyVWdmU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2V5QmxlR1ZqZFhSbFNXUXNJR2hsWVdSbGNuTXNJSEJoY21GdGN5d2djbVZ6ZFd4MGN5d2dZMjl1ZEdWNGREb2diM0IwYVc5dWN5NWpiMjUwWlhoMExDQnRaWFJoTENCMGVYQmxMQ0JsYlhCMGVWSmxjM1ZzZEN3Z1ptbHVZV3hsY3lCOU8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0JmWDJOaGJHd2dQU0JoYzNsdVl5QW9ZMjl1ZEdWNGREb2dKR052Ym5SbGVIUXNJRzF2WkhWc1pUb2dleUJ0WlhSaE9pQmhibmtzSUdoaGJtUnNaWEk2SUdGdWVTQjlMQ0J3WVhKaGJYTS9PaUJoYm5rcE9pQlFjbTl0YVhObFBHRnVlVDRnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCN0lHaGhibVJzWlhJZ2ZTQTlJR0YzWVdsMElHMXZaSFZzWlR0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdoaGJtUnNaWElvWTI5dWRHVjRkQ3dnY0dGeVlXMXpLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdjbVYwZFhKdUlIdGNiaUFnSUNBZ0lDQWdYMTlqWVd4c0xGeHVJQ0FnSUNBZ0lDQmZYMlY0WldOMWRHVXNYRzRnSUNBZ2ZUdGNibjBpTEFvZ0lDQWdJbWx0Y0c5eWRDQjBlWEJsSUhzZ0pHTnZiblJsZUhRc0lFTnZiblJsZUhSSWRIUndMQ0JTWlhOMWJIUnpMQ0JNYjJkblpYSXNJQ1J0WlhSaElIMGdabkp2YlNCY0lpNHVMMmx1WkdWNExuUnpYQ0k3WEc1Y2JtVjRjRzl5ZENCcGJuUmxjbVpoWTJVZ0pHVjJaVzUwY3lCN1hHNGdJQ0FnWENJcVhDSTZJSHNnYTJWNU9pQnJaWGx2WmlBa1pYWmxiblJ6TENCMllXeDFaVG9nWVc1NUlIMDdYRzRnSUNBZ1hDSnRhV3hyYVc4NmFIUjBjRkpsY1hWbGMzUmNJam9nZXlCbGVHVmpkWFJsU1dRNklITjBjbWx1WnpzZ2NHRjBhRG9nYzNSeWFXNW5PeUJzYjJkblpYSTZJRXh2WjJkbGNqc2dhSFIwY0RvZ1EyOXVkR1Y0ZEVoMGRIQThVbVZqYjNKa1BITjBjbWx1Wnl3Z1lXNTVQajRnZlR0Y2JpQWdJQ0JjSW0xcGJHdHBienBvZEhSd1VtVnpjRzl1YzJWY0lqb2dleUJsZUdWamRYUmxTV1E2SUhOMGNtbHVaenNnY0dGMGFEb2djM1J5YVc1bk95QnNiMmRuWlhJNklFeHZaMmRsY2pzZ2FIUjBjRG9nUTI5dWRHVjRkRWgwZEhBOFVtVmpiM0prUEhOMGNtbHVaeXdnWVc1NVBqNDdJR052Ym5SbGVIUTZJQ1JqYjI1MFpYaDBPeUJ6ZFdOalpYTnpPaUJpYjI5c1pXRnVJSDA3WEc0Z0lDQWdYQ0p0YVd4cmFXODZhSFIwY0U1dmRFWnZkVzVrWENJNklIc2daWGhsWTNWMFpVbGtPaUJ6ZEhKcGJtYzdJSEJoZEdnNklITjBjbWx1WnpzZ2JHOW5aMlZ5T2lCTWIyZG5aWEk3SUdoMGRIQTZJRU52Ym5SbGVIUklkSFJ3UEZKbFkyOXlaRHh6ZEhKcGJtY3NJR0Z1ZVQ0K0lIMDdYRzRnSUNBZ1hDSnRhV3hyYVc4NlpYaGxZM1YwWlVKbFptOXlaVndpT2lCN0lHVjRaV04xZEdWSlpEb2djM1J5YVc1bk95QndZWFJvT2lCemRISnBibWM3SUd4dloyZGxjam9nVEc5bloyVnlPeUJ0WlhSaE9pQWtiV1YwWVRzZ1kyOXVkR1Y0ZERvZ0pHTnZiblJsZUhRZ2ZUdGNiaUFnSUNCY0ltMXBiR3RwYnpwbGVHVmpkWFJsUVdaMFpYSmNJam9nZXlCbGVHVmpkWFJsU1dRNklITjBjbWx1WnpzZ2NHRjBhRG9nYzNSeWFXNW5PeUJzYjJkblpYSTZJRXh2WjJkbGNqc2diV1YwWVRvZ0pHMWxkR0U3SUdOdmJuUmxlSFE2SUNSamIyNTBaWGgwT3lCeVpYTjFiSFJ6T2lCU1pYTjFiSFJ6UEdGdWVUNGdmVHRjYm4xY2JseHVZMjl1YzNRZ1VrVlRUMHhXUlVSZlVGSlBUVWxUUlNBOUlGQnliMjFwYzJVdWNtVnpiMngyWlNncE8xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdYMTlwYm1sMFJYWmxiblJOWVc1aFoyVnlLQ2tnZTF4dUlDQWdJR052Ym5OMElHaGhibVJzWlhKeklEMGdibVYzSUUxaGNEd29aWFpsYm5RNklHRnVlU2tnUFQ0Z2RtOXBaQ3dnYzNSeWFXNW5QaWdwTzF4dUlDQWdJR052Ym5OMElHbHVaR1Y0WldRZ1BTQnVaWGNnVFdGd1BITjBjbWx1Wnl3Z1UyVjBQQ2hsZG1WdWREb2dZVzU1S1NBOVBpQlFjbTl0YVhObFBIWnZhV1FnZkNCaWIyOXNaV0Z1UGlCOElIWnZhV1FnZkNCaWIyOXNaV0Z1UGo0b0tUdGNiaUFnSUNCc1pYUWdYM1psY25OcGIyNGdQU0F3TzF4dVhHNGdJQ0FnWTI5dWMzUWdaWFpsYm5STllXNWhaMlZ5SUQwZ2UxeHVJQ0FnSUNBZ0lDQnZiam9nUEV0bGVTQmxlSFJsYm1SeklHdGxlVzltSUNSbGRtVnVkSE1zSUVoaGJtUnNaWElnWlhoMFpXNWtjeUFvWlhabGJuUTZJQ1JsZG1WdWRITmJTMlY1WFNrZ1BUNGdVSEp2YldselpUeDJiMmxrSUh3Z1ltOXZiR1ZoYmo0Z2ZDQjJiMmxrSUh3Z1ltOXZiR1ZoYmo0b2EyVjVPaUJMWlhrc0lHaGhibVJzWlhJNklFaGhibVJzWlhJcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOTJaWEp6YVc5dUt5czdYRzRnSUNBZ0lDQWdJQ0FnSUNCb1lXNWtiR1Z5Y3k1elpYUW9hR0Z1Wkd4bGNpd2dhMlY1SUdGeklITjBjbWx1WnlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2EyVjVJRDA5UFNBbktpY3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2FXNWtaWGhsWkM1b1lYTW9KeW9uS1NBOVBUMGdabUZzYzJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVc1a1pYaGxaQzV6WlhRb0p5b25MQ0J1WlhjZ1UyVjBLQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0IzYVd4a1kyRnlaRk5sZENBOUlHbHVaR1Y0WldRdVoyVjBLQ2NxSnlraE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIZHBiR1JqWVhKa1UyVjBMbUZrWkNob1lXNWtiR1Z5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dsdVpHVjRaV1F1YUdGektHdGxlU0JoY3lCemRISnBibWNwSUQwOVBTQm1ZV3h6WlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwYm1SbGVHVmtMbk5sZENoclpYa2dZWE1nYzNSeWFXNW5MQ0J1WlhjZ1UyVjBLQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J6WlhRZ1BTQnBibVJsZUdWa0xtZGxkQ2hyWlhrZ1lYTWdjM1J5YVc1bktTRTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjMlYwTG1Ga1pDaG9ZVzVrYkdWeUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9ZVzVrYkdWeWN5NWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR3RsZVNBOVBUMGdKeW9uS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIZHBiR1JqWVhKa1UyVjBJRDBnYVc1a1pYaGxaQzVuWlhRb0p5b25LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSGRwYkdSallYSmtVMlYwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCM2FXeGtZMkZ5WkZObGRDNWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J6WlhRZ1BTQnBibVJsZUdWa0xtZGxkQ2hyWlhrZ1lYTWdjM1J5YVc1bktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tITmxkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzJWMExtUmxiR1YwWlNob1lXNWtiR1Z5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMDdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUc5bVpqb2dQRXRsZVNCbGVIUmxibVJ6SUd0bGVXOW1JQ1JsZG1WdWRITXNJRWhoYm1Sc1pYSWdaWGgwWlc1a2N5QW9aWFpsYm5RNklDUmxkbVZ1ZEhOYlMyVjVYU2tnUFQ0Z2RtOXBaRDRvYTJWNU9pQkxaWGtzSUdoaGJtUnNaWEk2SUVoaGJtUnNaWElwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5MlpYSnphVzl1S3lzN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2EyVjVJRDA5UFNBbktpY3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjNhV3hrWTJGeVpGTmxkQ0E5SUdsdVpHVjRaV1F1WjJWMEtDY3FKeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRjNhV3hrWTJGeVpGTmxkQ2tnY21WMGRYSnVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hoYm1Sc1pYSnpMbVJsYkdWMFpTaG9ZVzVrYkdWeUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjNhV3hrWTJGeVpGTmxkQzVrWld4bGRHVW9hR0Z1Wkd4bGNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSE5sZENBOUlHbHVaR1Y0WldRdVoyVjBLR3RsZVNCaGN5QnpkSEpwYm1jcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doYzJWMEtTQnlaWFIxY200N1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHRnVaR3hsY25NdVpHVnNaWFJsS0doaGJtUnNaWElwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhObGRDNWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lHVnRhWFE2SUR4TFpYa2daWGgwWlc1a2N5QnJaWGx2WmlBa1pYWmxiblJ6TENCV1lXeDFaU0JsZUhSbGJtUnpJQ1JsZG1WdWRITmJTMlY1WFQ0b2EyVjVPaUJMWlhrc0lIWmhiSFZsT2lCV1lXeDFaU2s2SUZCeWIyMXBjMlU4ZG05cFpENGdQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2FDQTlJR2x1WkdWNFpXUXVaMlYwS0d0bGVTQmhjeUJ6ZEhKcGJtY3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZDJsc1pHTmhjbVJJWVc1a2JHVnljeUE5SUdsdVpHVjRaV1F1WjJWMEtDY3FKeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVhkcGJHUmpZWEprU0dGdVpHeGxjbk1nSmlZZ0lXZ3BJSEpsZEhWeWJpQlNSVk5QVEZaRlJGOVFVazlOU1ZORk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kMmxzWkdOaGNtUklZVzVrYkdWeWN5QW1KaUJvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUNoaGMzbHVZeUFvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2FHRnVaR3hsY2lCdlppQjNhV3hrWTJGeVpFaGhibVJzWlhKektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCb1lXNWtiR1Z5S0hzZ2EyVjVMQ0IyWVd4MVpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdoaGJtUnNaWElnYjJZZ2FDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2FHRnVaR3hsY2loMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlLU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZDJsc1pHTmhjbVJJWVc1a2JHVnljeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFvWVhONWJtTWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdoaGJtUnNaWElnYjJZZ2QybHNaR05oY21SSVlXNWtiR1Z5Y3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnYUdGdVpHeGxjaWg3SUd0bGVTd2dkbUZzZFdVZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUtTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnS0dGemVXNWpJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR2hoYm1Sc1pYSWdiMllnYUNFcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdhR0Z1Wkd4bGNpaDJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrb0tUdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ0FnWDJoaGMwVnRhWFJJWVc1a2JHVnljem9nS0d0bGVUb2djM1J5YVc1bktUb2dZbTl2YkdWaGJpQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2FXNWtaWGhsWkM1b1lYTW9hMlY1S1NCOGZDQnBibVJsZUdWa0xtaGhjeWduS2ljcE8xeHVJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0JuWlhRZ1gzWmxjbk5wYjI0b0tTQjdJSEpsZEhWeWJpQmZkbVZ5YzJsdmJqc2dmU3hjYmlBZ0lDQWdJQ0FnWlcxcGRFRnVlVUZ3Y0hKdmRtVmtPaUJoYzNsdVl5QThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdKR1YyWlc1MGN5d2dWbUZzZFdVZ1pYaDBaVzVrY3lBa1pYWmxiblJ6VzB0bGVWMCtLR3RsZVRvZ1MyVjVMQ0IyWVd4MVpUb2dWbUZzZFdVcE9pQlFjbTl0YVhObFBHSnZiMnhsWVc0K0lEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhkcGJHUmpZWEprU0dGdVpHeGxjbk1nUFNCcGJtUmxlR1ZrTG1kbGRDZ25LaWNwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdiR1YwSUdGalkyVndkR1ZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZDJsc1pHTmhjbVJJWVc1a2JHVnljeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2FHRnVaR3hsY2lCdlppQjNhV3hrWTJGeVpFaGhibVJzWlhKektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDZ29ZWGRoYVhRZ2FHRnVaR3hsY2loN0lHdGxlU3dnZG1Gc2RXVWdmU2twSUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaFkyTmxjSFJsWkNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2dnUFNCcGJtUmxlR1ZrTG1kbGRDaHJaWGtnWVhNZ2MzUnlhVzVuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JvWVc1a2JHVnlJRzltSUdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0haaGJIVmxLU2tnUFQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGalkyVndkR1ZrSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQmhZMk5sY0hSbFpEdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ0FnWlcxcGRFRnNiRUZ3Y0hKdmRtVmtPaUJoYzNsdVl5QThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdKR1YyWlc1MGN5d2dWbUZzZFdVZ1pYaDBaVzVrY3lBa1pYWmxiblJ6VzB0bGVWMCtLR3RsZVRvZ1MyVjVMQ0IyWVd4MVpUb2dWbUZzZFdVcE9pQlFjbTl0YVhObFBHSnZiMnhsWVc0K0lEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhkcGJHUmpZWEprU0dGdVpHeGxjbk1nUFNCcGJtUmxlR1ZrTG1kbGRDZ25LaWNwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdiR1YwSUdGd2NISnZkbVZrSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gzYVd4a1kyRnlaRWhoYm1Sc1pYSnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCb1lXNWtiR1Z5SUc5bUlIZHBiR1JqWVhKa1NHRnVaR3hsY25NcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0hzZ2EyVjVMQ0IyWVd4MVpTQjlLU2tnSVQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGd2NISnZkbVZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2dnUFNCcGJtUmxlR1ZrTG1kbGRDaHJaWGtnWVhNZ2MzUnlhVzVuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JvWVc1a2JHVnlJRzltSUdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0haaGJIVmxLU2tnSVQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGd2NISnZkbVZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdZWEJ3Y205MlpXUTdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdmVHRjYmx4dUlDQWdJSEpsZEhWeWJpQmxkbVZ1ZEUxaGJtRm5aWEk3WEc1OVhHNGlMQW9nSUNBZ0ltVjRjRzl5ZENCMGVYQmxJRTFwYkd0cGIwWnNiM2M4VkN3Z1ZGSmxkSFZ5YmlBOUlHRnVlU3dnVkU1bGVIUWdQU0JoYm5rK0lEMGdlMXh1SUNCbGJXbDBPaUFvWm14dmR6b2dWQ2tnUFQ0Z2RtOXBaRHRjYmlBZ1cxTjViV0p2YkM1aGMzbHVZMGwwWlhKaGRHOXlYVG9nS0NrZ1BUNGdUV2xzYTJsdlJteHZkenhVUGp0Y2JpQWdibVY0ZENndUxpNWJkbUZzZFdWZE9pQmJYU0I4SUZ0VVRtVjRkRjBwT2lCUWNtOXRhWE5sUEVsMFpYSmhkRzl5VW1WemRXeDBQRlFzSUZSU1pYUjFjbTQrUGp0Y2JpQWdjbVYwZFhKdUtDazZJRkJ5YjIxcGMyVThTWFJsY21GMGIzSlNaWE4xYkhROFZDd2dWRkpsZEhWeWJqNCtPMXh1SUNCMGFISnZkeWhsY25KdmNqb2dZVzU1S1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHhVTENCVVVtVjBkWEp1UGo0N1hHNTlPMXh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWTNKbFlYUmxSbXh2ZHp4VVBpZ3BPaUJOYVd4cmFXOUdiRzkzUEZRK0lIdGNiaUFnYkdWMElITjBZWFIxY3pvZ1hDSndaVzVrYVc1blhDSWdmQ0JjSW5KbGMyOXNkbVZrWENJZ2ZDQmNJbkpsYW1WamRHVmtYQ0lnUFNCY0luQmxibVJwYm1kY0lqdGNiaUFnWTI5dWMzUWdabXh2ZDNNNklFRnljbUY1UEh0Y2JpQWdJQ0JpYkdGdWF6b2dZbTl2YkdWaGJqdGNiaUFnSUNCd2NtOXRhWE5sT2lCUWNtOXRhWE5sUEZRK08xeHVJQ0FnSUhKbGMyOXNkbVU2SUNoMllXeDFaVDg2SUZRZ2ZDQlFjbTl0YVhObFRHbHJaVHhVUGlrZ1BUNGdkbTlwWkR0Y2JpQWdJQ0J5WldwbFkzUTZJQ2h5WldGemIyNC9PaUJoYm5rcElEMCtJSFp2YVdRN1hHNGdJSDArSUQwZ1cxMDdYRzVjYmlBZ1kyOXVjM1FnYVhSbGNtRjBiM0lnUFNCN1hHNGdJQ0FnWlcxcGREb2dLR1pzYjNjNklGUXBJRDArSUh0Y2JpQWdJQ0FnSUdsbUlDaG1iRzkzY3k1aGRDZ3RNU2svTG1Kc1lXNXJJRDA5UFNCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2wwWlcwZ1BTQm1iRzkzY3k1aGRDZ3RNU2toTzF4dUlDQWdJQ0FnSUNCcGRHVnRMbUpzWVc1cklEMGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lHbDBaVzB1Y21WemIyeDJaU2htYkc5M0tUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnY21WemIyeDJaWEp6SUQwZ1VISnZiV2x6WlM1M2FYUm9VbVZ6YjJ4MlpYSnpQRlErS0NrN1hHNGdJQ0FnSUNBZ0lISmxjMjlzZG1WeWN5NXlaWE52YkhabEtHWnNiM2NwTzF4dUlDQWdJQ0FnSUNCbWJHOTNjeTV3ZFhOb0tIc2dMaTR1Y21WemIyeDJaWEp6TENCaWJHRnVhem9nWm1Gc2MyVWdmU0JoY3lCaGJua3BPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMHNYRzRnSUNBZ0xpNHVLSHRjYmlBZ0lDQWdJR0Z6ZVc1aklHNWxlSFFvS1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHhVUGo0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYzNSaGRIVnpJQ0U5UFNCY0luQmxibVJwYm1kY0lpa2djbVYwZFhKdUlIc2daRzl1WlRvZ2RISjFaU3dnZG1Gc2RXVTZJRzUxYkd3Z2ZUdGNiaUFnSUNBZ0lDQWdhV1lnS0dac2IzZHpMbXhsYm1kMGFDQTlQVDBnTUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmxjMjlzZG1WeWN5QTlJRkJ5YjIxcGMyVXVkMmwwYUZKbGMyOXNkbVZ5Y3p4VVBpZ3BPMXh1SUNBZ0lDQWdJQ0FnSUdac2IzZHpMbkIxYzJnb2V5QXVMaTV5WlhOdmJIWmxjbk1zSUdKc1lXNXJPaUIwY25WbElIMGdZWE1nWVc1NUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqYjI1emRDQm1iRzkzSUQwZ1pteHZkM011WVhRb01Da2hPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhRZ1BTQmhkMkZwZENCbWJHOTNMbkJ5YjIxcGMyVTdYRzRnSUNBZ0lDQWdJR1pzYjNkekxuTm9hV1owS0NrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCN0lHUnZibVU2SUhOMFlYUjFjeUFoUFQwZ1hDSndaVzVrYVc1blhDSXNJSFpoYkhWbE9pQnlaWE4xYkhRZ2ZUdGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQmhjM2x1WXlCeVpYUjFjbTRvS1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHgyYjJsa1BqNGdlMXh1SUNBZ0lDQWdJQ0J6ZEdGMGRYTWdQU0JjSW5KbGMyOXNkbVZrWENJN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdabXh2ZHlCdlppQm1iRzkzY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJR1pzYjNjdVlteGhibXNnUFNCbVlXeHpaVHRjYmlBZ0lDQWdJQ0FnSUNCbWJHOTNMbkpsYzI5c2RtVW9kVzVrWldacGJtVmtLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZXlCa2IyNWxPaUIwY25WbExDQjJZV3gxWlRvZ2JuVnNiQ0I5TzF4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUdGemVXNWpJSFJvY205M0tHVnljam9nWVc1NUtUb2dVSEp2YldselpUeEpkR1Z5WVhSdmNsSmxjM1ZzZER4MmIybGtQajRnZTF4dUlDQWdJQ0FnSUNCemRHRjBkWE1nUFNCY0luSmxhbVZqZEdWa1hDSTdYRzRnSUNBZ0lDQWdJR2xtSUNobWJHOTNjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE52YkhabGNuTWdQU0JRY205dGFYTmxMbmRwZEdoU1pYTnZiSFpsY25NOFZENG9LVHRjYmlBZ0lDQWdJQ0FnSUNCbWJHOTNjeTV3ZFhOb0tIc2dMaTR1Y21WemIyeDJaWEp6TENCaWJHRnVhem9nZEhKMVpTQjlJR0Z6SUdGdWVTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCbWJHOTNJRzltSUdac2IzZHpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ1pteHZkeTVpYkdGdWF5QTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJR1pzYjNjdWNtVnFaV04wS0dWeWNpazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSHNnWkc5dVpUb2dkSEoxWlN3Z2RtRnNkV1U2SUc1MWJHd2dmVHRjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU0J6WVhScGMyWnBaWE1nUVhONWJtTkpkR1Z5WVhSdmNqeDFibXR1YjNkdVBpa3NYRzRnSUNBZ1cxTjViV0p2YkM1aGMzbHVZMGwwWlhKaGRHOXlYU2dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0FnSUgwc1hHNGdJSDA3WEc1Y2JpQWdjbVYwZFhKdUlHbDBaWEpoZEc5eUlHRnpJRTFwYkd0cGIwWnNiM2M4VkQ0N1hHNTlYRzRpTEFvZ0lDQWdJbU52Ym5OMElFVk9RMDlFU1U1SElEMGdYQ0l3TVRJek5EVTJOemc1UVVKRFJFVkdSMGhKU2t0TVRVNVBVRkZTVTFSVlZsZFlXVnBoWW1Oa1pXWm5hR2xxYTJ4dGJtOXdjWEp6ZEhWMmQzaDVlbHdpTzF4dVkyOXVjM1FnUlU1RFQwUkpUa2RmVEVWT0lEMGdSVTVEVDBSSlRrY3ViR1Z1WjNSb08xeHVYRzVzWlhRZ1gxOW1ZWE4wU1dSUWIyOXNJRDBnYm1WM0lGVnBiblE0UVhKeVlYa29NalUyS1R0Y2JteGxkQ0JmWDJaaGMzUkpaRkJ2YjJ4SmJtUmxlQ0E5SURJMU5qdGNibXhsZENCZlgyWmhjM1JKWkVOdmRXNTBaWElnUFNBd08xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdYMTlqY21WaGRHVkpaQ2dwT2lCemRISnBibWNnZTF4dUlDQWdJR2xtSUNoZlgyWmhjM1JKWkZCdmIyeEpibVJsZUNBcklERTJJRDRnTWpVMktTQjdYRzRnSUNBZ0lDQWdJR055ZVhCMGJ5NW5aWFJTWVc1a2IyMVdZV3gxWlhNb1gxOW1ZWE4wU1dSUWIyOXNLVHRjYmlBZ0lDQWdJQ0FnWDE5bVlYTjBTV1JRYjI5c1NXNWtaWGdnUFNBd08xeHVJQ0FnSUgxY2JpQWdJQ0F2THlEbGlZMGdPQ0RsclpmbnJLWTZJT2FYdHVtWHRPYUlzeUJpWVhObE16YnZ2SWhFWVhSbExtNXZkeWdwTG5SdlUzUnlhVzVuS0RNMktTRG1tNy9rdTZNZ1FtbG5TVzUwNzd5TWZqRXdNSGdnNXB1MDViK3I3N3lKWEc0Z0lDQWdZMjl1YzNRZ2RITWdQU0JFWVhSbExtNXZkeWdwTG5SdlUzUnlhVzVuS0RNMktTNXdZV1JUZEdGeWRDZzRMQ0JjSWpCY0lpazdYRzRnSUNBZ0x5OGc1YTJYNTZ5bTVMaXk1b3U4NW82bDVwdS81THVqSUVGeWNtRjVMbVp5YjIwZ0t5QnFiMmx1Nzd5TTZZRy81WVdONXBXdzU3dUU1WWlHNllXTlhHNGdJQ0FnYkdWMElHbGtJRDBnZEhNN1hHNGdJQ0FnTHk4ZzVMaXQ2WmUwSURZZzVhMlg1NnltT2lEbnVxL3Btby9tbkxwY2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Ec2dhU0E4SURZN0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCcFpDQXJQU0JGVGtOUFJFbE9SeTVqYUdGeVFYUW9YMTltWVhOMFNXUlFiMjlzVzE5ZlptRnpkRWxrVUc5dmJFbHVaR1Y0S3l0ZElTQWxJRVZPUTA5RVNVNUhYMHhGVGlrN1hHNGdJQ0FnZlZ4dUlDQWdJQzh2SU9XUWppQXhNQ0RsclpmbnJLWTZJT2l1b2VhVnNPV1pxQ0FySU9tYWorYWN1dWEzdCtXUWlGeHVJQ0FnSUdOdmJuTjBJR052ZFc1MFpYSWdQU0JmWDJaaGMzUkpaRU52ZFc1MFpYSXJLenRjYmlBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTURzZ2FTQThJREV3T3lCcEt5c3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV2w0SUQwZ0tHTnZkVzUwWlhJZ0t5QmZYMlpoYzNSSlpGQnZiMnhiWDE5bVlYTjBTV1JRYjI5c1NXNWtaWGdyS3lBbElESTFObDBoS1NBbUlEQjRSa1pHUmp0Y2JpQWdJQ0FnSUNBZ2FXUWdLejBnUlU1RFQwUkpUa2N1WTJoaGNrRjBLRzFwZUNBbElFVk9RMDlFU1U1SFgweEZUaWs3WEc0Z0lDQWdmVnh1SUNBZ0lISmxkSFZ5YmlCcFpEdGNibjFjYmlJc0NpQWdJQ0FpYVcxd2IzSjBJSHNnWDE5amNtVmhkR1ZKWkNCOUlHWnliMjBnWENJdUxpOTFkR2xzY3k5amNtVmhkR1V0YVdRdWRITmNJanRjYmx4dVpYaHdiM0owSUhSNWNHVWdSWGhsWTNWMFpVbGtSMlZ1WlhKaGRHOXlJRDBnS0dobFlXUmxjbk0vT2lCSVpXRmtaWEp6S1NBOVBpQnpkSEpwYm1jZ2ZDQlFjbTl0YVhObFBITjBjbWx1Wno0N1hHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQmtaV1pwYm1WRVpXWmhkV3gwUlhobFkzVjBaVWxrUjJWdVpYSmhkRzl5S0NrZ2UxeHVJQ0J5WlhSMWNtNGdYMTlqY21WaGRHVkpaRHRjYm4xY2JpSXNDaUFnSUNBaWFXMXdiM0owSUhzZ2RIbHdaU0FrZEhsd1pYTXNJRjlmYVc1cGRFeHBjM1JsYm1WeUxDQmZYMmx1YVhSRmVHVmpkWFJsY2l3Z1gxOXBibWwwUlhabGJuUk5ZVzVoWjJWeUxDQjBlWEJsSUVWNFpXTjFkR1ZKWkN3Z2RIbHdaU0JNYjJkblpYSXNJSFI1Y0dVZ1RXbDRhVzRzSUhSNWNHVWdSMlZ1WlhKaGRHVmtTVzVwZEN3Z2RIbHdaU0JRYVc1bkxDQjBlWEJsSUV4dloyZGxjbE4xWW0xcGRIUnBibWRJWVc1a2JHVnlMQ0IwZVhCbElFeHZaMmRsY2tsdWMyVnlkR2x1WjBoaGJtUnNaWElzSUhSNWNHVWdRMjl5YzBOdmJtWnBaeUI5SUdaeWIyMGdYQ0l1TGk5cGJtUmxlQzUwYzF3aU8xeHVhVzF3YjNKMElIc2daR1ZtYVc1bFJHVm1ZWFZzZEVWNFpXTjFkR1ZKWkVkbGJtVnlZWFJ2Y2lCOUlHWnliMjBnWENJdUxpOWxlR1ZqZFhSbEwyVjRaV04xZEdVdGFXUXRaMlZ1WlhKaGRHOXlMblJ6WENJN1hHNWNibVY0Y0c5eWRDQnBiblJsY21aaFkyVWdUV2xzYTJsdlNXNXBkQ0I3WEc0Z0lDQWdjRzl5ZERvZ2JuVnRZbVZ5TzF4dUlDQWdJR1JsZG1Wc2IzQTZJR0p2YjJ4bFlXNDdYRzRnSUNBZ1ptVjBZMmhGYm5ZL09pQW9hMlY1T2lCemRISnBibWNwSUQwK0lITjBjbWx1WnlCOElIVnVaR1ZtYVc1bFpEdGNiaUFnSUNCaFkyTmxjM05MWlhrL09pQnpkSEpwYm1jN1hHNGdJQ0FnYUhSMGNEODZJSHRjYmlBZ0lDQWdJQ0FnWTI5eWN6ODZJRU52Y25ORGIyNW1hV2M3WEc0Z0lDQWdmVHRjYmlBZ0lDQnBaMjV2Y21WUVlYUm9UR1YyWld3L09pQnVkVzFpWlhJN1hHNGdJQ0FnY21WaGJFbHdQem9nS0dobFlXUmxjbk02SUVobFlXUmxjbk1wSUQwK0lITjBjbWx1Wnp0Y2JpQWdJQ0JsZUdWamRYUmxTV1EvT2lBb2FHVmhaR1Z5Y3pvZ1NHVmhaR1Z5Y3lrZ1BUNGdjM1J5YVc1bklId2dVSEp2YldselpUeHpkSEpwYm1jK08xeHVJQ0FnSUc5dVRHOW5aMlZ5VTNWaWJXbDBkR2x1Wno4NklFeHZaMmRsY2xOMVltMXBkSFJwYm1kSVlXNWtiR1Z5TzF4dUlDQWdJRzl1VEc5bloyVnlTVzV6WlhKMGFXNW5Qem9nVEc5bloyVnlTVzV6WlhKMGFXNW5TR0Z1Wkd4bGNqdGNiaUFnSUNCaWIyOTBjM1J5WVhCelB6b2dRWEp5WVhrOEtIZHZjbXhrT2lCaGJua3BJRDArSUZCeWIyMXBjMlU4ZG05cFpENGdmQ0IyYjJsa1BqdGNibjFjYmx4dVpYaHdiM0owSUhSNWNHVWdUV2xzYTJsdlVuVnVkR2x0WlVsdWFYUThWQ0JsZUhSbGJtUnpJRTFwYkd0cGIwbHVhWFErSUQwZ1RXbDRhVzQ4WEc0Z0lDQWdWQ3hjYmlBZ0lDQjdYRzRnSUNBZ0lDQWdJR1Y0WldOMWRHVkpaRG9nS0dobFlXUmxjbk02SUVobFlXUmxjbk1wSUQwK0lITjBjbWx1WnlCOElGQnliMjFwYzJVOGMzUnlhVzVuUGp0Y2JpQWdJQ0FnSUNBZ2NuVnVkR2x0WlRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WeGRXVnpkRG9nVFdGd1BFVjRaV04xZEdWSlpDd2dleUJzYjJkblpYSTZJRXh2WjJkbGNpQjlQanRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibVpwWnpvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBDUjBlWEJsYzF0Y0ltZGxibVZ5WVhSbFpGd2lYVnRjSW1OdmJtWnBaMU5qYUdWdFlWd2lYVDQrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZWEJ3T2lCaGJuazdYRzRnSUNBZ0lDQWdJSDA3WEc0Z0lDQWdJQ0FnSUc5dU9pQkJkMkZwZEdWa1BGSmxkSFZ5YmxSNWNHVThkSGx3Wlc5bUlGOWZhVzVwZEVWMlpXNTBUV0Z1WVdkbGNqNCtXMXdpYjI1Y0lsMDdYRzRnSUNBZ0lDQWdJRzltWmpvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBIUjVjR1Z2WmlCZlgybHVhWFJGZG1WdWRFMWhibUZuWlhJK1BsdGNJbTltWmx3aVhUdGNiaUFnSUNBZ0lDQWdaVzFwZERvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBIUjVjR1Z2WmlCZlgybHVhWFJGZG1WdWRFMWhibUZuWlhJK1BsdGNJbVZ0YVhSY0lsMDdYRzRnSUNBZ0lDQWdJR1Z0YVhSQmJubEJjSEJ5YjNabFpEb2dRWGRoYVhSbFpEeFNaWFIxY201VWVYQmxQSFI1Y0dWdlppQmZYMmx1YVhSRmRtVnVkRTFoYm1GblpYSStQbHRjSW1WdGFYUkJibmxCY0hCeWIzWmxaRndpWFR0Y2JpQWdJQ0FnSUNBZ1pXMXBkRUZzYkVGd2NISnZkbVZrT2lCQmQyRnBkR1ZrUEZKbGRIVnlibFI1Y0dVOGRIbHdaVzltSUY5ZmFXNXBkRVYyWlc1MFRXRnVZV2RsY2o0K1cxd2laVzFwZEVGc2JFRndjSEp2ZG1Wa1hDSmRPMXh1SUNBZ0lDQWdJQ0JmYUdGelJXMXBkRWhoYm1Sc1pYSnpPaUJCZDJGcGRHVmtQRkpsZEhWeWJsUjVjR1U4ZEhsd1pXOW1JRjlmYVc1cGRFVjJaVzUwVFdGdVlXZGxjajQrVzF3aVgyaGhjMFZ0YVhSSVlXNWtiR1Z5YzF3aVhUdGNiaUFnSUNBZ0lDQWdYMlZ0YVhSSVlXNWtiR1Z5YzFabGNuTnBiMjQ2SUc1MWJXSmxjanRjYmlBZ0lDQjlYRzQrTzF4dVhHNWxlSEJ2Y25RZ1lYTjVibU1nWm5WdVkzUnBiMjRnWTNKbFlYUmxWMjl5YkdROFRXbHNhMmx2VDNCMGFXOXVjeUJsZUhSbGJtUnpJRTFwYkd0cGIwbHVhWFErS0dkbGJtVnlZWFJsWkRvZ1IyVnVaWEpoZEdWa1NXNXBkQ3dnWTI5dVptbG5VMk5vWlcxaE9pQjdJR2RsZERvZ0tDa2dQVDRnVUhKdmJXbHpaVHhTWldOdmNtUThZVzU1TENCaGJuaytQaUI5TENCdmNIUnBiMjV6T2lCTmFXeHJhVzlQY0hScGIyNXpLVG9nVUhKdmJXbHpaVHhOYVd4cmFXOVhiM0pzWkR4SFpXNWxjbUYwWldSSmJtbDBMQ0JOYVd4cmFXOVBjSFJwYjI1elBqNGdlMXh1SUNBZ0lHTnZibk4wSUdWNFpXTjFkR1ZKWkNBOUlHOXdkR2x2Ym5NdVpYaGxZM1YwWlVsa0lEOC9JR1JsWm1sdVpVUmxabUYxYkhSRmVHVmpkWFJsU1dSSFpXNWxjbUYwYjNJb0tUdGNiaUFnSUNCamIyNXpkQ0JqYjI1bWFXY2dQU0JoZDJGcGRDQmpiMjVtYVdkVFkyaGxiV0V1WjJWMEtDazdYRzVjYmlBZ0lDQmpiMjV6ZENCeWRXNTBhVzFsSUQwZ2UxeHVJQ0FnSUNBZ0lDQnlaWEYxWlhOME9pQnVaWGNnVFdGd0tDa3NYRzRnSUNBZ0lDQWdJR052Ym1acFp5eGNiaUFnSUNCOUlHRnpJRTFwYkd0cGIxSjFiblJwYldWSmJtbDBQRTFwYkd0cGIwOXdkR2x2Ym5NK1cxd2ljblZ1ZEdsdFpWd2lYVHRjYmx4dUlDQWdJR052Ym5OMElHVjJaVzUwVFdGdVlXZGxjaUE5SUY5ZmFXNXBkRVYyWlc1MFRXRnVZV2RsY2lncE8xeHVYRzRnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVZV05qWlhOelMyVjVLU0J2Y0hScGIyNXpMbWxuYm05eVpWQmhkR2hNWlhabGJDQTlJRzl3ZEdsdmJuTXVhV2R1YjNKbFVHRjBhRXhsZG1Wc0lEOGdiM0IwYVc5dWN5NXBaMjV2Y21WUVlYUm9UR1YyWld3Z0t5QXhJRG9nTVR0Y2JseHVJQ0FnSUdOdmJuTjBJRjg2SUUxcGJHdHBiMUoxYm5ScGJXVkpibWwwUEUxcGJHdHBiMDl3ZEdsdmJuTStJRDBnZTF4dUlDQWdJQ0FnSUNBdUxpNXZjSFJwYjI1ekxGeHVJQ0FnSUNBZ0lDQmxlR1ZqZFhSbFNXUXNYRzRnSUNBZ0lDQWdJSEoxYm5ScGJXVXNYRzRnSUNBZ0lDQWdJRzl1T2lCbGRtVnVkRTFoYm1GblpYSXViMjRzWEc0Z0lDQWdJQ0FnSUc5bVpqb2daWFpsYm5STllXNWhaMlZ5TG05bVppeGNiaUFnSUNBZ0lDQWdaVzFwZERvZ1pYWmxiblJOWVc1aFoyVnlMbVZ0YVhRc1hHNGdJQ0FnSUNBZ0lHVnRhWFJCYm5sQmNIQnliM1psWkRvZ1pYWmxiblJOWVc1aFoyVnlMbVZ0YVhSQmJubEJjSEJ5YjNabFpDeGNiaUFnSUNBZ0lDQWdaVzFwZEVGc2JFRndjSEp2ZG1Wa09pQmxkbVZ1ZEUxaGJtRm5aWEl1WlcxcGRFRnNiRUZ3Y0hKdmRtVmtMRnh1SUNBZ0lDQWdJQ0JmYUdGelJXMXBkRWhoYm1Sc1pYSnpPaUJsZG1WdWRFMWhibUZuWlhJdVgyaGhjMFZ0YVhSSVlXNWtiR1Z5Y3l4Y2JpQWdJQ0FnSUNBZ1gyVnRhWFJJWVc1a2JHVnljMVpsY25OcGIyNDZJR1YyWlc1MFRXRnVZV2RsY2k1ZmRtVnljMmx2Yml4Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdaWGhsWTNWMFpYSWdQU0JmWDJsdWFYUkZlR1ZqZFhSbGNpaG5aVzVsY21GMFpXUXNJRjhwTzF4dUlDQWdJR052Ym5OMElHeHBjM1JsYm1WeUlEMGdYMTlwYm1sMFRHbHpkR1Z1WlhJb1oyVnVaWEpoZEdWa0xDQmZMQ0JsZUdWamRYUmxjaWs3WEc1Y2JpQWdJQ0F2THlCSmJtbDBhV0ZzYVhwbElIUm9aU0JoY0hCY2JpQWdJQ0JqYjI1emRDQjNiM0pzWkNBOUlIdGNiaUFnSUNBZ0lDQWdYeXhjYmlBZ0lDQWdJQ0FnTHk4Z1pYWmxiblFnYldGdVlXZGxjbHh1SUNBZ0lDQWdJQ0J2YmpvZ1pYWmxiblJOWVc1aFoyVnlMbTl1TEZ4dUlDQWdJQ0FnSUNCdlptWTZJR1YyWlc1MFRXRnVZV2RsY2k1dlptWXNYRzRnSUNBZ0lDQWdJR1Z0YVhRNklHVjJaVzUwVFdGdVlXZGxjaTVsYldsMExGeHVJQ0FnSUNBZ0lDQmxiV2wwUVc1NVFYQndjbTkyWldRNklHVjJaVzUwVFdGdVlXZGxjaTVsYldsMFFXNTVRWEJ3Y205MlpXUXNYRzRnSUNBZ0lDQWdJR1Z0YVhSQmJHeEJjSEJ5YjNabFpEb2daWFpsYm5STllXNWhaMlZ5TG1WdGFYUkJiR3hCY0hCeWIzWmxaQ3hjYmlBZ0lDQWdJQ0FnTHk4Z2JHbHpkR1Z1WlhKY2JpQWdJQ0FnSUNBZ2JHbHpkR1Z1WlhJc1hHNGdJQ0FnSUNBZ0lDOHZJR1oxYm1OMGFXOXVYRzRnSUNBZ0lDQWdJR052Ym1acFp5eGNiaUFnSUNBZ0lDQWdhWE5VWlhOMFRXOWtaVG9nS0dOdmJtWnBaeUJoY3lCU1pXTnZjbVE4WVc1NUxDQmhibmsrS1Q4dWJXOWtaU0E5UFQwZ1hDSjBaWE4wWENJc1hHNGdJQ0FnZlR0Y2JseHVJQ0FnSUhKMWJuUnBiV1V1WVhCd0lEMGdkMjl5YkdRN1hHNWNiaUFnSUNCcFppQW9RWEp5WVhrdWFYTkJjbkpoZVNodmNIUnBiMjV6TG1KdmIzUnpkSEpoY0hNcEtTQjdYRzRnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnWW05dmRITjBjbUZ3SUc5bUlHOXdkR2x2Ym5NdVltOXZkSE4wY21Gd2N5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnWW05dmRITjBjbUZ3S0hkdmNteGtJR0Z6SUUxcGJHdHBiMWR2Y214a1BFZGxibVZ5WVhSbFpFbHVhWFFzSUUxcGJHdHBiMDl3ZEdsdmJuTStLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJSDFjYmx4dUlDQWdJR0YzWVdsMElGQnliMjFwYzJVdVlXeHNLR2RsYm1WeVlYUmxaQzVvWVc1a2JHVnlVMk5vWlcxaExteHZZV1JJWVc1a2JHVnljeWgzYjNKc1pDa3BPMXh1WEc0Z0lDQWdZMjl1YzNRZ2NtOTFkR1ZMWlhseklEMGdUMkpxWldOMExtdGxlWE1vWjJWdVpYSmhkR1ZrTG5KdmRYUmxVMk5vWlcxaElHRnpJRkpsWTI5eVpEeHpkSEpwYm1jc0lHRnVlVDRwTzF4dUlDQWdJR052Ym5OMElISmhkMUJoZEdoek9pQkJjbkpoZVR4emRISnBibWMrSUQwZ1oyVnVaWEpoZEdWa0xuSmhkMU5qYUdWdFlUOHVjbUYzVUdGMGFITWdQeUJCY25KaGVTNW1jbTl0S0dkbGJtVnlZWFJsWkM1eVlYZFRZMmhsYldFdWNtRjNVR0YwYUhNZ1lYTWdVMlYwUEhOMGNtbHVaejRwSURvZ1cxMDdYRzRnSUNBZ1kyOXVjM1FnWVd4c1VtOTFkR1Z6SUQwZ1d5NHVMbkp2ZFhSbFMyVjVjeXdnTGk0dWNtRjNVR0YwYUhOZE8xeHVJQ0FnSUdOdmJuTnZiR1V1Ykc5bktHQmNYRzdpbHJNZ1VtOTFkR1Z6T2x4Y2JpQWdJQ0FrZTJGc2JGSnZkWFJsY3k1cWIybHVLRndpWEZ4dUlDQWdJRndpS1gxY1hHNGdJRUVnZEc5MFlXd2diMllnSkh0aGJHeFNiM1YwWlhNdWJHVnVaM1JvZlNCeWIzVjBaWE11WUNrN1hHNGdJQ0FnWTI5dWMyOXNaUzVzYjJjb1lGeGNidUtXc3lCVFpYSjJaWEk2SUdoMGRIQTZMeTlzYjJOaGJHaHZjM1E2Skh0dmNIUnBiMjV6TG5CdmNuUjlZQ2s3WEc1Y2JpQWdJQ0J5WlhSMWNtNGdkMjl5YkdRZ1lYTWdUV2xzYTJsdlYyOXliR1E4UjJWdVpYSmhkR1ZrU1c1cGRDd2dUV2xzYTJsdlQzQjBhVzl1Y3o0N1hHNTlYRzVjYm1WNGNHOXlkQ0JwYm5SbGNtWmhZMlVnVFdsc2EybHZWMjl5YkdROFIyVnVaWEpoZEdWa0lHVjRkR1Z1WkhNZ1IyVnVaWEpoZEdWa1NXNXBkQ3dnVFdsc2EybHZUM0IwYVc5dWN5QmxlSFJsYm1SeklFMXBiR3RwYjBsdWFYUWdQU0JOYVd4cmFXOUpibWwwUGlCN1hHNGdJQ0FnWHpvZ1RXbHNhMmx2VW5WdWRHbHRaVWx1YVhROFRXbHNhMmx2VDNCMGFXOXVjejQ3WEc0Z0lDQWdMeThnWlhabGJuUWdiV0Z1WVdkbGNseHVJQ0FnSUc5dU9pQThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdSMlZ1WlhKaGRHVmtXMXdpWlhabGJuUnpYQ0pkTENCSVlXNWtiR1Z5SUdWNGRHVnVaSE1nS0dWMlpXNTBPaUJIWlc1bGNtRjBaV1JiWENKbGRtVnVkSE5jSWwxYlMyVjVYU2tnUFQ0Z2RtOXBaRDRvYTJWNU9pQkxaWGtzSUdoaGJtUnNaWEk2SUVoaGJtUnNaWElwSUQwK0lDZ29LU0E5UGlCMmIybGtLVHRjYmlBZ0lDQnZabVk2SUR4TFpYa2daWGgwWlc1a2N5QnJaWGx2WmlCSFpXNWxjbUYwWldSYlhDSmxkbVZ1ZEhOY0lsMHNJRWhoYm1Sc1pYSWdaWGgwWlc1a2N5QW9aWFpsYm5RNklFZGxibVZ5WVhSbFpGdGNJbVYyWlc1MGMxd2lYVnRMWlhsZEtTQTlQaUIyYjJsa1BpaHJaWGs2SUV0bGVTd2dhR0Z1Wkd4bGNqb2dTR0Z1Wkd4bGNpa2dQVDRnZG05cFpEdGNiaUFnSUNCbGJXbDBPaUE4UzJWNUlHVjRkR1Z1WkhNZ2EyVjViMllnUjJWdVpYSmhkR1ZrVzF3aVpYWmxiblJ6WENKZExDQldZV3gxWlNCbGVIUmxibVJ6SUVkbGJtVnlZWFJsWkZ0Y0ltVjJaVzUwYzF3aVhWdExaWGxkUGloclpYazZJRXRsZVN3Z2RtRnNkV1U2SUZaaGJIVmxLU0E5UGlCUWNtOXRhWE5sUEhadmFXUStPMXh1SUNBZ0lHVnRhWFJCYm5sQmNIQnliM1psWkRvZ1BFdGxlU0JsZUhSbGJtUnpJR3RsZVc5bUlFZGxibVZ5WVhSbFpGdGNJbVYyWlc1MGMxd2lYU3dnVm1Gc2RXVWdaWGgwWlc1a2N5QkhaVzVsY21GMFpXUmJYQ0psZG1WdWRITmNJbDFiUzJWNVhUNG9hMlY1T2lCTFpYa3NJSFpoYkhWbE9pQldZV3gxWlNrZ1BUNGdVSEp2YldselpUeGliMjlzWldGdVBqdGNiaUFnSUNCbGJXbDBRV3hzUVhCd2NtOTJaV1E2SUR4TFpYa2daWGgwWlc1a2N5QnJaWGx2WmlCSFpXNWxjbUYwWldSYlhDSmxkbVZ1ZEhOY0lsMHNJRlpoYkhWbElHVjRkR1Z1WkhNZ1IyVnVaWEpoZEdWa1cxd2laWFpsYm5SelhDSmRXMHRsZVYwK0tHdGxlVG9nUzJWNUxDQjJZV3gxWlRvZ1ZtRnNkV1VwSUQwK0lGQnliMjFwYzJVOFltOXZiR1ZoYmo0N1hHNGdJQ0FnY0dsdVp6b2dLRzl3ZEdsdmJuTS9PaUI3SUhScGJXVnZkWFEvT2lCdWRXMWlaWElnZlNrZ1BUNGdVSEp2YldselpUeFFhVzVuUGp0Y2JpQWdJQ0F2THlCc2FYTjBaVzVsY2x4dUlDQWdJR3hwYzNSbGJtVnlPaUJCZDJGcGRHVmtQRkpsZEhWeWJsUjVjR1U4ZEhsd1pXOW1JRjlmYVc1cGRFeHBjM1JsYm1WeVBqNDdYRzRnSUNBZ1kyOXVabWxuT2lCU1pXRmtiMjVzZVR4QmQyRnBkR1ZrUEZKbGRIVnlibFI1Y0dVOEpIUjVjR1Z6VzF3aVkyOXVabWxuVTJOb1pXMWhYQ0pkVzF3aVoyVjBYQ0pkUGo0K08xeHVJQ0FnSUdselZHVnpkRTF2WkdVNklHSnZiMnhsWVc0N1hHNTlYRzRpTEFvZ0lDQWdJbVY0Y0c5eWRDQm1kVzVqZEdsdmJpQjBlWEJwWVR4VWVYQnBZVWx1YVhSVUlHVjRkR1Z1WkhNZ1ZIbHdhV0ZKYm1sMFBpaHBibWwwT2lCVWVYQnBZVWx1YVhSVUtUb2dWSGx3YVdFOFZIbHdhV0ZKYm1sMFZENGdlMXh1SUNCeVpYUjFjbTRnYVc1cGRDQmhjeUIxYm10dWIzZHVJR0Z6SUZSNWNHbGhQRlI1Y0dsaFNXNXBkRlErTzF4dWZWeHVYRzVsZUhCdmNuUWdkSGx3WlNCVWVYQnBZVWx1YVhRZ1BTQW9LU0E5UGlCU1pXTnZjbVE4VUhKdmNHVnlkSGxMWlhrc0lIVnVhMjV2ZDI0K0lId2dVSEp2YldselpUeFNaV052Y21ROFVISnZjR1Z5ZEhsTFpYa3NJSFZ1YTI1dmQyNCtQanRjYmx4dVpYaHdiM0owSUhSNWNHVWdWSGx3YVdFOFZIbHdhV0ZKYm1sMFZDQmxlSFJsYm1SeklGUjVjR2xoU1c1cGRENGdQU0JVZVhCcFlVbHVhWFJVTzF4dUlpd0tJQ0FnSUNKcGJYQnZjblFnZEhsd1pTQjdJRXh2Wnl3Z1RXbHNhMmx2U1c1cGRDd2dUV2xzYTJsdlVuVnVkR2x0WlVsdWFYUWdmU0JtY205dElGd2lMaTR2YVc1a1pYZ3VkSE5jSWp0Y2JseHVhVzUwWlhKbVlXTmxJRU52YjJ0aWIyOXJSWFpsYm5RZ2UxeHVJQ0IwZVhCbE9pQmNJbTFwYkd0cGIwQnNiMmRuWlhKY0lqdGNiaUFnYkc5bk9pQk1iMmM3WEc1OVhHNWNibVY0Y0c5eWRDQmhjM2x1WXlCbWRXNWpkR2x2YmlCelpXNWtRMjl2YTJKdmIydEZkbVZ1ZENoeWRXNTBhVzFsT2lCTmFXeHJhVzlTZFc1MGFXMWxTVzVwZER4TmFXeHJhVzlKYm1sMFBpd2daWFpsYm5RNklFTnZiMnRpYjI5clJYWmxiblFwSUh0Y2JpQWdMeThnZEhKNUlIdGNiaUFnTHk4Z0lDQmpiMjV6ZENCeVpYTndiMjV6WlNBOUlHRjNZV2wwSUdabGRHTm9LR0JvZEhSd09pOHZiRzlqWVd4b2IzTjBPaVI3Y25WdWRHbHRaUzVqYjI5clltOXZheTVqYjI5clltOXZhMUJ2Y25SOUx5UmhZM1JwYjI1Z0xDQjdYRzRnSUM4dklDQWdJQ0J0WlhSb2IyUTZJRndpVUU5VFZGd2lMRnh1SUNBdkx5QWdJQ0FnYUdWaFpHVnljem9nZTF4dUlDQXZMeUFnSUNBZ0lDQmNJa052Ym5SbGJuUXRWSGx3WlZ3aU9pQmNJbUZ3Y0d4cFkyRjBhVzl1TDJwemIyNWNJaXhjYmlBZ0x5OGdJQ0FnSUgwc1hHNGdJQzh2SUNBZ0lDQmliMlI1T2lCS1UwOU9Mbk4wY21sdVoybG1lU2hsZG1WdWRDa3NYRzRnSUM4dklDQWdmU2s3WEc0Z0lDOHZJQ0FnYVdZZ0tDRnlaWE53YjI1elpTNXZheWtnZTF4dUlDQXZMeUFnSUNBZ1kyOXVjMjlzWlM1c2IyY29YQ0piUTA5UFMwSlBUMHRkWENJc0lHRjNZV2wwSUhKbGMzQnZibk5sTG5SbGVIUW9LU2s3WEc0Z0lDOHZJQ0FnSUNCamIyNXpiMnhsTG14dlp5aGNJbHREVDA5TFFrOVBTMTFjSWl3Z1hDSkpjeUJEYjI5clltOXZheUJqYkc5elpXUS9JRlJvWlhKbElHbHpJR0Z1SUdGaWJtOXliV0ZzYVhSNUlHbHVJSFJvWlNCamIyMXRkVzVwWTJGMGFXOXVJSGRwZEdnZ1EyOXZhMkp2YjJzdVhDSXBPMXh1SUNBdkx5QWdJSDFjYmlBZ0x5OGdmU0JqWVhSamFDQW9aWEp5YjNJcElIdGNiaUFnTHk4Z0lDQmpiMjV6YjJ4bExteHZaeWhjSWx0RFQwOUxRazlQUzExY0lpd2daWEp5YjNJcE8xeHVJQ0F2THlBZ0lHTnZibk52YkdVdWJHOW5LRndpVzBOUFQwdENUMDlMWFZ3aUxDQmNJa2x6SUVOdmIydGliMjlySUdOc2IzTmxaRDhnVkdobGNtVWdhWE1nWVc0Z1lXSnViM0p0WVd4cGRIa2dhVzRnZEdobElHTnZiVzExYm1sallYUnBiMjRnZDJsMGFDQkRiMjlyWW05dmF5NWNJaWs3WEc0Z0lDOHZJSDFjYm4xY2JpSXNDaUFnSUNBaWFXMXdiM0owSUhSNWNHVWdleUFrWTI5dWRHVjRkQ3dnVFdsc2EybHZTVzVwZEN3Z1RXbHNhMmx2VW5WdWRHbHRaVWx1YVhRZ2ZTQm1jbTl0SUZ3aUxpNHZhVzVrWlhndWRITmNJanRjYm1sdGNHOXlkQ0I3SUhObGJtUkRiMjlyWW05dmEwVjJaVzUwSUgwZ1puSnZiU0JjSWk0dUwzVjBhV3h6TDNObGJtUXRZMjl2YTJKdmIyc3RaWFpsYm5RdWRITmNJanRjYmx4dVpYaHdiM0owSUhSNWNHVWdURzluSUQwZ1cxd2lLR1JsWW5WbktWd2lJSHdnWENJb2FXNW1ieWxjSWlCOElGd2lLSGRoY200cFhDSWdmQ0JjSWlobGNuSnZjaWxjSWlCOElGd2lLSEpsY1hWbGMzUXBYQ0lnZkNCY0lpaHlaWE53YjI1elpTbGNJaXdnYzNSeWFXNW5JQzhxSUdWNFpXTjFkR1ZKWkNBcUx5d2djM1J5YVc1bkxDQnpkSEpwYm1jc0lITjBjbWx1Wnl3Z0xpNHVRWEp5WVhrOGRXNXJibTkzYmo1ZE8xeHVYRzVsZUhCdmNuUWdhVzUwWlhKbVlXTmxJRXh2WjJkbGNpQjdYRzRnSUNBZ1h6b2dlMXh1SUNBZ0lDQWdJQ0JzYjJkek9pQkJjbkpoZVR4TWIyYytPMXh1SUNBZ0lDQWdJQ0IwWVdkek9pQk5ZWEE4YzNSeWFXNW5MQ0IxYm10dWIzZHVQanRjYmlBZ0lDQWdJQ0FnYzNWaWJXbDBPaUFvWTI5dWRHVjRkRG9nSkdOdmJuUmxlSFFwSUQwK0lGQnliMjFwYzJVOGRtOXBaRDRnZkNCMmIybGtPMXh1SUNBZ0lIMDdYRzRnSUNBZ2MyVjBWR0ZuT2lBb2EyVjVPaUJ6ZEhKcGJtY3NJSFpoYkhWbE9pQjFibXR1YjNkdUtTQTlQaUIyYjJsa08xeHVJQ0FnSUhObGRFeHZaem9nS0M0dUxteHZaem9nVEc5bktTQTlQaUIyYjJsa08xeHVJQ0FnSUdSbFluVm5PaUFvWkdWelkzSnBjSFJwYjI0NklITjBjbWx1Wnl3Z0xpNHVjR0Z5WVcxek9pQkJjbkpoZVR4MWJtdHViM2R1UGlrZ1BUNGdURzluTzF4dUlDQWdJR2x1Wm04NklDaGtaWE5qY21sd2RHbHZiam9nYzNSeWFXNW5MQ0F1TGk1d1lYSmhiWE02SUVGeWNtRjVQSFZ1YTI1dmQyNCtLU0E5UGlCTWIyYzdYRzRnSUNBZ2QyRnliam9nS0dSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbkJoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJRXh2Wnp0Y2JpQWdJQ0JsY25KdmNqb2dLR1JsYzJOeWFYQjBhVzl1T2lCemRISnBibWNzSUM0dUxuQmhjbUZ0Y3pvZ1FYSnlZWGs4ZFc1cmJtOTNiajRwSUQwK0lFeHZaenRjYmlBZ0lDQnlaWEYxWlhOME9pQW9aR1Z6WTNKcGNIUnBiMjQ2SUhOMGNtbHVaeXdnTGk0dWNHRnlZVzF6T2lCQmNuSmhlVHgxYm10dWIzZHVQaWtnUFQ0Z1RHOW5PMXh1SUNBZ0lISmxjM0J2Ym5ObE9pQW9aR1Z6WTNKcGNIUnBiMjQ2SUhOMGNtbHVaeXdnTGk0dWNHRnlZVzF6T2lCQmNuSmhlVHgxYm10dWIzZHVQaWtnUFQ0Z1RHOW5PMXh1ZlZ4dVhHNWxlSEJ2Y25RZ2RIbHdaU0JNYjJkblpYSkpibk5sY25ScGJtZElZVzVrYkdWeUlEMGdLR3h2WnpvZ1RHOW5LU0E5UGlCaWIyOXNaV0Z1TzF4dVhHNWxlSEJ2Y25RZ2RIbHdaU0JNYjJkblpYSlRkV0p0YVhSMGFXNW5TR0Z1Wkd4bGNpQTlJQ2hqYjI1MFpYaDBPaUFrWTI5dWRHVjRkQ3dnYkc5bmN6b2dRWEp5WVhrOFRHOW5QaXdnZEdGbmN6b2dUV0Z3UEhOMGNtbHVaeXdnZFc1cmJtOTNiajRwSUQwK0lGQnliMjFwYzJVOGRtOXBaRDRnZkNCMmIybGtPMXh1WEc1bWRXNWpkR2x2YmlCbVlYTjBWR2x0WlhOMFlXMXdLQ2s2SUhOMGNtbHVaeUI3WEc0Z0lDQWdZMjl1YzNRZ1pDQTlJRzVsZHlCRVlYUmxLQ2s3WEc0Z0lDQWdjbVYwZFhKdUlHQW9KSHRrTG1kbGRFWjFiR3haWldGeUtDbDlMU1I3VTNSeWFXNW5LR1F1WjJWMFRXOXVkR2dvS1NBcklERXBMbkJoWkZOMFlYSjBLRElzSUZ3aU1Gd2lLWDB0Skh0VGRISnBibWNvWkM1blpYUkVZWFJsS0NrcExuQmhaRk4wWVhKMEtESXNJRndpTUZ3aUtYMGdKSHRUZEhKcGJtY29aQzVuWlhSSWIzVnljeWdwS1M1d1lXUlRkR0Z5ZENneUxDQmNJakJjSWlsOU9pUjdVM1J5YVc1bktHUXVaMlYwVFdsdWRYUmxjeWdwS1M1d1lXUlRkR0Z5ZENneUxDQmNJakJjSWlsOU9pUjdVM1J5YVc1bktHUXVaMlYwVTJWamIyNWtjeWdwS1M1d1lXUlRkR0Z5ZENneUxDQmNJakJjSWlsOUtXQTdYRzU5WEc1Y2JpOHZJRkJ5WlMxamNtVmhkR1ZrSUdSbFptRjFiSFFnYVc1elpYSjBhVzVuSUdoaGJtUnNaWElnTFNCemFHRnlaV1FnWVdOeWIzTnpJR0ZzYkNCc2IyZG5aWEp6WEc1amIyNXpkQ0JrWldaaGRXeDBTVzV6WlhKMGFXNW5JRDBnS0d4dlp6b2dURzluS1RvZ1ltOXZiR1ZoYmlBOVBpQjdYRzRnSUNBZ2JHOW5XekJkSUQwZ1lGeGNiaVI3Ykc5bld6QmRmV0FnWVhNZ1lXNTVPMXh1SUNBZ0lHTnZibk52YkdVdWJHOW5LQzR1TG14dlp5azdYRzRnSUNBZ2NtVjBkWEp1SUhSeWRXVTdYRzU5TzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1kzSmxZWFJsVEc5bloyVnlQRTFwYkd0cGIxSjFiblJwYldVZ1pYaDBaVzVrY3lCTmFXeHJhVzlTZFc1MGFXMWxTVzVwZER4TmFXeHJhVzlTZFc1MGFXMWxTVzVwZER4TmFXeHJhVzlKYm1sMFBqNGdQU0JOYVd4cmFXOVNkVzUwYVcxbFNXNXBkRHhOYVd4cmFXOUpibWwwUGo0b2NuVnVkR2x0WlRvZ1RXbHNhMmx2VW5WdWRHbHRaU3dnY0dGMGFEb2djM1J5YVc1bkxDQmxlR1ZqZFhSbFNXUTZJSE4wY21sdVp5azZJRXh2WjJkbGNpQjdYRzRnSUNBZ1kyOXVjM1FnYkc5bloyVnlJRDBnZTMwZ1lYTWdURzluWjJWeU8xeHVYRzRnSUNBZ1kyOXVjM1FnYkc5bmN6b2dRWEp5WVhrOFRHOW5QaUE5SUZ0ZE8xeHVJQ0FnSUdOdmJuTjBJSFJoWjNNNklFMWhjRHh6ZEhKcGJtY3NJSFZ1YTI1dmQyNCtJRDBnYm1WM0lFMWhjQ2dwTzF4dVhHNGdJQ0FnWTI5dWMzUWdhVzV6WlhKMGFXNW5JRDBnY25WdWRHbHRaUzV2Ymt4dloyZGxja2x1YzJWeWRHbHVaeUI4ZkNCa1pXWmhkV3gwU1c1elpYSjBhVzVuTzF4dUlDQWdJR052Ym5OMElHaGhjMU4xWW0xcGRIUnBibWNnUFNBaElYSjFiblJwYldVdWIyNU1iMmRuWlhKVGRXSnRhWFIwYVc1bk8xeHVJQ0FnSUdOdmJuTjBJR2x6UkdWMlpXeHZjQ0E5SUhKMWJuUnBiV1V1WkdWMlpXeHZjRHRjYmx4dUlDQWdJR3h2WjJkbGNpNWZJRDBnZTF4dUlDQWdJQ0FnSUNCc2IyZHpMRnh1SUNBZ0lDQWdJQ0IwWVdkekxGeHVJQ0FnSUNBZ0lDQnpkV0p0YVhRNklDaGpiMjUwWlhoME9pQWtZMjl1ZEdWNGRDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGeWRXNTBhVzFsTG05dVRHOW5aMlZ5VTNWaWJXbDBkR2x1WnlrZ2NtVjBkWEp1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlISjFiblJwYldVdWIyNU1iMmRuWlhKVGRXSnRhWFIwYVc1bktHTnZiblJsZUhRc0lHeHZaM01zSUhSaFozTXBPMXh1SUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JqYjI1emRDQmZYM1JoWjFCMWMyZ2dQU0FvYTJWNU9pQnpkSEpwYm1jc0lIWmhiSFZsT2lCMWJtdHViM2R1S1RvZ2RtOXBaQ0E5UGlCN1hHNGdJQ0FnSUNBZ0lIUmhaM011YzJWMEtHdGxlU3dnZG1Gc2RXVXBPMXh1SUNBZ0lIMDdYRzRnSUNBZ1kyOXVjM1FnWDE5c2IyZFFkWE5vSUQwZ0tHeHZaem9nVEc5bktUb2dURzluSUQwK0lIdGNiaUFnSUNBZ0lDQWdhV1lnS0NGcGJuTmxjblJwYm1jb2JHOW5LU2tnY21WMGRYSnVJR3h2Wnp0Y2JpQWdJQ0FnSUNBZ2FXWWdLR2hoYzFOMVltMXBkSFJwYm1jcElHeHZaM011Y0hWemFDaGJMaTR1Ykc5blhTazdYRzRnSUNBZ0lDQWdJR2xtSUNocGMwUmxkbVZzYjNBcElIWnZhV1FnYzJWdVpFTnZiMnRpYjI5clJYWmxiblFvY25WdWRHbHRaU3dnZXlCMGVYQmxPaUJjSW0xcGJHdHBiMEJzYjJkblpYSmNJaXdnYkc5bklIMHBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdiRzluTzF4dUlDQWdJSDA3WEc1Y2JpQWdJQ0JzYjJkblpYSXVjMlYwVkdGbklEMGdYMTkwWVdkUWRYTm9PMXh1SUNBZ0lHeHZaMmRsY2k1elpYUk1iMmNnUFNBb0xpNHViRzluT2lCTWIyY3BJRDArSUY5ZmJHOW5VSFZ6YUNoc2IyY3BPMXh1WEc0Z0lDQWdZMjl1YzNRZ1oyVjBUbTkzSUQwZ1ptRnpkRlJwYldWemRHRnRjRHRjYmx4dUlDQWdJR3h2WjJkbGNpNWtaV0oxWnlBOUlDaGtaWE5qY21sd2RHbHZiam9nYzNSeWFXNW5MQ0F1TGk1d1lYSmhiWE02SUVGeWNtRjVQSFZ1YTI1dmQyNCtLU0E5UGlCZlgyeHZaMUIxYzJnb1cxd2lLR1JsWW5WbktWd2lMQ0J3WVhSb0xDQmxlR1ZqZFhSbFNXUXNJR2RsZEU1dmR5Z3BMQ0JnWEZ4dUpIdGtaWE5qY21sd2RHbHZibjFnTENBdUxpNXdZWEpoYlhOZEtUdGNiaUFnSUNCc2IyZG5aWEl1YVc1bWJ5QTlJQ2hrWlhOamNtbHdkR2x2YmpvZ2MzUnlhVzVuTENBdUxpNXdZWEpoYlhNNklFRnljbUY1UEhWdWEyNXZkMjQrS1NBOVBpQmZYMnh2WjFCMWMyZ29XMXdpS0dsdVptOHBYQ0lzSUhCaGRHZ3NJR1Y0WldOMWRHVkpaQ3dnWjJWMFRtOTNLQ2tzSUdCY1hHNGtlMlJsYzJOeWFYQjBhVzl1ZldBc0lDNHVMbkJoY21GdGMxMHBPMXh1SUNBZ0lHeHZaMmRsY2k1M1lYSnVJRDBnS0dSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbkJoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJRjlmYkc5blVIVnphQ2hiWENJb2QyRnliaWxjSWl3Z2NHRjBhQ3dnWlhobFkzVjBaVWxrTENCblpYUk9iM2NvS1N3Z1lGeGNiaVI3WkdWelkzSnBjSFJwYjI1OVlDd2dMaTR1Y0dGeVlXMXpYU2s3WEc0Z0lDQWdiRzluWjJWeUxtVnljbTl5SUQwZ0tHUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TG5CaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUY5ZmJHOW5VSFZ6YUNoYlhDSW9aWEp5YjNJcFhDSXNJSEJoZEdnc0lHVjRaV04xZEdWSlpDd2daMlYwVG05M0tDa3NJR0JjWEc0a2UyUmxjMk55YVhCMGFXOXVmV0FzSUM0dUxuQmhjbUZ0YzEwcE8xeHVJQ0FnSUd4dloyZGxjaTV5WlhGMVpYTjBJRDBnS0dSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbkJoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJRjlmYkc5blVIVnphQ2hiWENJb2NtVnhkV1Z6ZENsY0lpd2djR0YwYUN3Z1pYaGxZM1YwWlVsa0xDQm5aWFJPYjNjb0tTd2dZRnhjYmlSN1pHVnpZM0pwY0hScGIyNTlZQ3dnTGk0dWNHRnlZVzF6WFNrN1hHNGdJQ0FnYkc5bloyVnlMbkpsYzNCdmJuTmxJRDBnS0dSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbkJoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJRjlmYkc5blVIVnphQ2hiWENJb2NtVnpjRzl1YzJVcFhDSXNJSEJoZEdnc0lHVjRaV04xZEdWSlpDd2daMlYwVG05M0tDa3NJR0JjWEc0a2UyUmxjMk55YVhCMGFXOXVmV0FzSUM0dUxuQmhjbUZ0YzEwcE8xeHVYRzRnSUNBZ2NtVjBkWEp1SUd4dloyZGxjanRjYm4xY2JpSXNDaUFnSUNBaVpYaHdiM0owSUdsdWRHVnlabUZqWlNCVGRHVndjenhUZEdGblpWUWdaWGgwWlc1a2N5QlNaV052Y21ROFlXNTVMQ0JoYm5rK1BpQjdYRzRnSUhOMFpYQTZJRk4wWlhCR2RXNWpkR2x2Ymp4VGRHRm5aVlErTzF4dUlDQnlkVzQ2SUNncElEMCtJRkJ5YjIxcGMyVThVbVZ0YjNabFh6eFRkR0ZuWlZRK1BqdGNibjFjYmx4dWRIbHdaU0JTWlcxdmRtVmZQRlErSUQwZ2UxeHVJQ0JiU3lCcGJpQnJaWGx2WmlCVUlHRnpJRXNnWlhoMFpXNWtjeUJnWHlSN2MzUnlhVzVuZldBZ1B5QnVaWFpsY2lBNklFdGRPaUJVVzB0ZE8xeHVmVHRjYmx4dWRIbHdaU0JVYjBWdGNIUjVUMkpxWldOMFBGUStJRDBnVkNCbGVIUmxibVJ6SUhWdVpHVm1hVzVsWkNCOElHNTFiR3dnZkNCdVpYWmxjaUEvSUh0OUlEb2dWQ0JsZUhSbGJtUnpJRzlpYW1WamRDQS9JRlFnT2lCN2ZUdGNibHh1Wlhod2IzSjBJSFI1Y0dVZ1UzUmxjRVoxYm1OMGFXOXVQRk4wWVdkbFZDQmxlSFJsYm1SeklGSmxZMjl5WkR4aGJua3NJR0Z1ZVQ0K0lEMGdQRWhoYm1Sc1pYSlVJR1Y0ZEdWdVpITWdLSE4wWVdkbE9pQlNaV0ZrYjI1c2VUeFRkR0ZuWlZRK0tTQTlQaUJTWldOdmNtUThZVzU1TENCaGJuaytJSHdnVUhKdmJXbHpaVHhTWldOdmNtUThZVzU1TENCaGJuaytQajRvYUdGdVpHeGxjam9nU0dGdVpHeGxjbFFwSUQwK0lGTjBaWEJ6UEVGM1lXbDBaV1E4VTNSaFoyVlVQaUFtSUZSdlJXMXdkSGxQWW1wbFkzUThRWGRoYVhSbFpEeFNaWFIxY201VWVYQmxQRWhoYm1Sc1pYSlVQajQrUGp0Y2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHTnlaV0YwWlZOMFpYQW9LVG9nVTNSbGNITThlMzArSUh0Y2JpQWdZMjl1YzNRZ2MzUmxjRU52Ym5SeWIyeHNaWElnUFNCN1hHNGdJQ0FnSkcxcGJHdHBiMVI1Y0dVNklGd2ljM1JsY0Z3aUxGeHVJQ0FnSUY5emRHVndjem9nVzEwZ1lYTWdRWEp5WVhrOEtITjBZV2RsT2lCaGJua3BJRDArSUZCeWIyMXBjMlU4WVc1NVBqNHNYRzRnSUNBZ2MzUmxjQ2hvWVc1a2JHVnlPaUFvYzNSaFoyVTZJR0Z1ZVNrZ1BUNGdVSEp2YldselpUeGhibmsrS1NCN1hHNGdJQ0FnSUNCemRHVndRMjl1ZEhKdmJHeGxjaTVmYzNSbGNITXVjSFZ6YUNob1lXNWtiR1Z5S1R0Y2JpQWdJQ0FnSUhKbGRIVnliaUJ6ZEdWd1EyOXVkSEp2Ykd4bGNqdGNiaUFnSUNCOUxGeHVJQ0FnSUdGemVXNWpJSEoxYmlncElIdGNiaUFnSUNBZ0lHeGxkQ0J6ZEdGblpTQTlJSHQ5TzF4dUlDQWdJQ0FnWm05eUlDaGpiMjV6ZENCemRHVndJRzltSUhOMFpYQkRiMjUwY205c2JHVnlMbDl6ZEdWd2N5a2dlMXh1SUNBZ0lDQWdJQ0J6ZEdGblpTQTlJSHNnTGk0dWMzUmhaMlVzSUM0dUxpaGhkMkZwZENCemRHVndLSE4wWVdkbEtTa2dmVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJR052Ym5OMElISmxjM1ZzZERvZ1VtVmpiM0prUEdGdWVTd2dZVzU1UGlBOUlIdDlPMXh1SUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JyWlhrZ2FXNGdjM1JoWjJVcElIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2RtRnNkV1VnUFNBb2MzUmhaMlVnWVhNZ1lXNTVLVnRyWlhsZE8xeHVJQ0FnSUNBZ0lDQnBaaUFvSVd0bGVTNXpkR0Z5ZEhOWGFYUm9LRndpWDF3aUtTa2djbVZ6ZFd4MFcydGxlVjBnUFNCMllXeDFaVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQWdJSEpsZEhWeWJpQnlaWE4xYkhRN1hHNGdJQ0FnZlN4Y2JpQWdmVHRjYmlBZ2NtVjBkWEp1SUhOMFpYQkRiMjUwY205c2JHVnlJR0Z6SUdGdWVTQmhjeUJUZEdWd2N6eDdmVDQ3WEc1OVhHNGlMQW9nSUNBZ0ltVjRjRzl5ZENCamJHRnpjeUJVY21sbFBGUStJSHRjYmlBZ0lDQndjbWwyWVhSbElISnZiM1E2SUZSeWFXVk9iMlJsUEZRK08xeHVJQ0FnSUhCeWFYWmhkR1VnWTJGamFHVTZJRTFoY0R4emRISnBibWNzSUZRZ2ZDQnVkV3hzUGp0Y2JseHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxuSnZiM1FnUFNCdVpYY2dWSEpwWlU1dlpHVW9LVHRjYmlBZ0lDQWdJQ0FnZEdocGN5NWpZV05vWlNBOUlHNWxkeUJOWVhBb0tUdGNiaUFnSUNCOVhHNWNiaUFnSUNCaFpHUW9jR0YwYURvZ2MzUnlhVzVuTENCMllXeDFaVG9nVkNrNklIWnZhV1FnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J3WVhKMGN5QTlJSEJoZEdoY2JpQWdJQ0FnSUNBZ0lDQWdJQzV5WlhCc1lXTmxLQzllWEZ3dkszeGNYQzhySkM5bkxDQmNJbHdpS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbk53YkdsMEtGd2lMMXdpS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVpwYkhSbGNpZ29jQ2tnUFQ0Z2NDQWhQVDBnWENKY0lpazdYRzRnSUNBZ0lDQWdJR3hsZENCamRYSnlaVzUwVG05a1pTQTlJSFJvYVhNdWNtOXZkRHRjYmlBZ0lDQWdJQ0FnYVdZZ0tIQmhjblJ6TG14bGJtZDBhQ0E5UFQwZ01Da2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kzVnljbVZ1ZEU1dlpHVXVkbUZzZFdVZ1BTQjJZV3gxWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSFJvYVhNdVkyRmphR1V1YzJWMEtIQmhkR2dzSUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5Ymp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJSEJoY25RZ2IyWWdjR0Z5ZEhNcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hZM1Z5Y21WdWRFNXZaR1V1WTJocGJHUnlaVzR1YUdGektIQmhjblFwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kzVnljbVZ1ZEU1dlpHVXVZMmhwYkdSeVpXNHVjMlYwS0hCaGNuUXNJRzVsZHlCVWNtbGxUbTlrWlNncEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJR04xY25KbGJuUk9iMlJsSUQwZ1kzVnljbVZ1ZEU1dlpHVXVZMmhwYkdSeVpXNHVaMlYwS0hCaGNuUXBJVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCamRYSnlaVzUwVG05a1pTNTJZV3gxWlNBOUlIWmhiSFZsTzF4dUlDQWdJQ0FnSUNCMGFHbHpMbU5oWTJobExuTmxkQ2h3WVhSb0xDQjJZV3gxWlNrN1hHNGdJQ0FnZlZ4dVhHNGdJQ0FnWjJWMEtIQmhkR2c2SUhOMGNtbHVaeWs2SUZRZ2ZDQnVkV3hzSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWTJGamFHVmtJRDBnZEdocGN5NWpZV05vWlM1blpYUW9jR0YwYUNrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hqWVdOb1pXUWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2NtVjBkWEp1SUdOaFkyaGxaRHRjYmx4dUlDQWdJQ0FnSUNCamIyNXpkQ0J3WVhKMGN5QTlJSEJoZEdoY2JpQWdJQ0FnSUNBZ0lDQWdJQzV5WlhCc1lXTmxLQzllWEZ3dkszeGNYQzhySkM5bkxDQmNJbHdpS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbk53YkdsMEtGd2lMMXdpS1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMbVpwYkhSbGNpZ29jQ2tnUFQ0Z2NDQWhQVDBnWENKY0lpazdYRzRnSUNBZ0lDQWdJR3hsZENCamRYSnlaVzUwVG05a1pTQTlJSFJvYVhNdWNtOXZkRHRjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCd1lYSjBJRzltSUhCaGNuUnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVdOMWNuSmxiblJPYjJSbExtTm9hV3hrY21WdUxtaGhjeWh3WVhKMEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ1kzVnljbVZ1ZEU1dlpHVWdQU0JqZFhKeVpXNTBUbTlrWlM1amFHbHNaSEpsYmk1blpYUW9jR0Z5ZENraE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJR052Ym5OMElISmxjM1ZzZENBOUlHTjFjbkpsYm5ST2IyUmxMblpoYkhWbE8xeHVJQ0FnSUNBZ0lDQnBaaUFvY21WemRXeDBJQ0U5UFNCdWRXeHNLU0IwYUdsekxtTmhZMmhsTG5ObGRDaHdZWFJvTENCeVpYTjFiSFFwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnY21WemRXeDBPMXh1SUNBZ0lIMWNibHh1SUNBZ0lHZGxkRUo1VUdGeWRITW9jR0Z5ZEhNNklITjBjbWx1WjF0ZEtUb2dWQ0I4SUc1MWJHd2dlMXh1SUNBZ0lDQWdJQ0JzWlhRZ1kzVnljbVZ1ZEU1dlpHVWdQU0IwYUdsekxuSnZiM1E3WEc0Z0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2NHRnlkQ0J2WmlCd1lYSjBjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGamRYSnlaVzUwVG05a1pTNWphR2xzWkhKbGJpNW9ZWE1vY0dGeWRDa3BJSEpsZEhWeWJpQnVkV3hzTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZM1Z5Y21WdWRFNXZaR1VnUFNCamRYSnlaVzUwVG05a1pTNWphR2xzWkhKbGJpNW5aWFFvY0dGeWRDa2hPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJqZFhKeVpXNTBUbTlrWlM1MllXeDFaVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQm9ZWE1vY0dGMGFEb2djM1J5YVc1bktUb2dZbTl2YkdWaGJpQjdYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQjBhR2x6TG1kbGRDaHdZWFJvS1NBaFBUMGdiblZzYkR0Y2JpQWdJQ0I5WEc1OVhHNWNibU5zWVhOeklGUnlhV1ZPYjJSbFBGUStJSHRjYmlBZ0lDQmphR2xzWkhKbGJqb2dUV0Z3UEhOMGNtbHVaeXdnVkhKcFpVNXZaR1U4VkQ0K08xeHVJQ0FnSUhaaGJIVmxPaUJVSUh3Z2JuVnNiRHRjYmx4dUlDQWdJR052Ym5OMGNuVmpkRzl5S0NrZ2UxeHVJQ0FnSUNBZ0lDQjBhR2x6TG1Ob2FXeGtjbVZ1SUQwZ2JtVjNJRTFoY0NncE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG5aaGJIVmxJRDBnYm5Wc2JEdGNiaUFnSUNCOVhHNTlYRzRpTEFvZ0lDQWdJbWx0Y0c5eWRDQjBlWEJsSUhzZ1EyOXljME52Ym1acFp5QjlJR1p5YjIwZ1hDSXVMaTlwYm1SbGVDNTBjMXdpTzF4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1luVnBiR1JEYjNKelNHVmhaR1Z5Y3loamIzSnpPaUJEYjNKelEyOXVabWxuSUh3Z2RXNWtaV1pwYm1Wa0xDQnZjbWxuYVc0L09pQnpkSEpwYm1jZ2ZDQnVkV3hzS1RvZ1VtVmpiM0prUEhOMGNtbHVaeXdnYzNSeWFXNW5QaUI3WEc0Z0lDQWdZMjl1YzNRZ2NtVnpkV3gwT2lCU1pXTnZjbVE4YzNSeWFXNW5MQ0J6ZEhKcGJtYytJRDBnZTMwN1hHNGdJQ0FnYVdZZ0tHTnZjbk0vTG1OdmNuTkJiR3h2ZDAxbGRHaHZaSE1wSUhKbGMzVnNkRnRjSWtGalkyVnpjeTFEYjI1MGNtOXNMVUZzYkc5M0xVMWxkR2h2WkhOY0lsMGdQU0JqYjNKekxtTnZjbk5CYkd4dmQwMWxkR2h2WkhNdWFtOXBiaWhjSWl3Z1hDSXBPMXh1SUNBZ0lHbG1JQ2hqYjNKelB5NWpiM0p6UVd4c2IzZElaV0ZrWlhKektTQnlaWE4xYkhSYlhDSkJZMk5sYzNNdFEyOXVkSEp2YkMxQmJHeHZkeTFJWldGa1pYSnpYQ0pkSUQwZ1kyOXljeTVqYjNKelFXeHNiM2RJWldGa1pYSnpMbXB2YVc0b1hDSXNJRndpS1R0Y2JpQWdJQ0JwWmlBb1kyOXljejh1WTI5eWMwMWhlRUZuWlNBaFBUMGdkVzVrWldacGJtVmtLU0J5WlhOMWJIUmJYQ0pCWTJObGMzTXRRMjl1ZEhKdmJDMU5ZWGd0UVdkbFhDSmRJRDBnVTNSeWFXNW5LR052Y25NdVkyOXljMDFoZUVGblpTazdYRzRnSUNBZ2FXWWdLR052Y25NL0xtTnZjbk5CYkd4dmQwOXlhV2RwYmlBbUppQmpiM0p6TG1OdmNuTkJiR3h2ZDA5eWFXZHBiaTVzWlc1bmRHZ2dQaUF3S1NCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdselYybHNaR05oY21RZ1BTQmpiM0p6TG1OdmNuTkJiR3h2ZDA5eWFXZHBiaTVwYm1Oc2RXUmxjeWhjSWlwY0lpazdYRzRnSUNBZ0lDQWdJR2xtSUNoamIzSnpMbU52Y25OQmJHeHZkME55WldSbGJuUnBZV3h6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCWGFHVnVJR055WldSbGJuUnBZV3h6T2lCMGNuVmxMQ0IwYUdVZ2MzQmxZeUJtYjNKaWFXUnpJRUZqWTJWemN5MURiMjUwY205c0xVRnNiRzkzTFU5eWFXZHBiam9nS2k1Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUVWamFHOGdkR2hsSUhKbGNYVmxjM1FnYjNKcFoybHVJR2x1YzNSbFlXUWdLSGRwYkdSallYSmtJRzFsWVc1eklGd2lZV3hzYjNjZ1lXNTVJRzl5YVdkcGJsd2lLUzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h2Y21sbmFXNGdKaVlnS0dselYybHNaR05oY21RZ2ZId2dZMjl5Y3k1amIzSnpRV3hzYjNkUGNtbG5hVzR1YVc1amJIVmtaWE1vYjNKcFoybHVLU2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYTjFiSFJiWENKQlkyTmxjM010UTI5dWRISnZiQzFCYkd4dmR5MVBjbWxuYVc1Y0lsMGdQU0J2Y21sbmFXNDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6ZFd4MFcxd2lWbUZ5ZVZ3aVhTQTlJRndpVDNKcFoybHVYQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBXMXdpUVdOalpYTnpMVU52Ym5SeWIyd3RRV3hzYjNjdFEzSmxaR1Z1ZEdsaGJITmNJbDBnUFNCY0luUnlkV1ZjSWp0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hwYzFkcGJHUmpZWEprS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwVzF3aVFXTmpaWE56TFVOdmJuUnliMnd0UVd4c2IzY3RUM0pwWjJsdVhDSmRJRDBnWENJcVhDSTdYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnYVdZZ0tHOXlhV2RwYmlBbUppQmpiM0p6TG1OdmNuTkJiR3h2ZDA5eWFXZHBiaTVwYm1Oc2RXUmxjeWh2Y21sbmFXNHBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBXMXdpUVdOalpYTnpMVU52Ym5SeWIyd3RRV3hzYjNjdFQzSnBaMmx1WENKZElEMGdiM0pwWjJsdU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjM1ZzZEZ0Y0lsWmhjbmxjSWwwZ1BTQmNJazl5YVdkcGJsd2lPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaGpiM0p6UHk1amIzSnpSWGh3YjNObFNHVmhaR1Z5Y3lBbUppQmpiM0p6TG1OdmNuTkZlSEJ2YzJWSVpXRmtaWEp6TG14bGJtZDBhQ0ErSURBcElISmxjM1ZzZEZ0Y0lrRmpZMlZ6Y3kxRGIyNTBjbTlzTFVWNGNHOXpaUzFJWldGa1pYSnpYQ0pkSUQwZ1kyOXljeTVqYjNKelJYaHdiM05sU0dWaFpHVnljeTVxYjJsdUtGd2lMQ0JjSWlrN1hHNGdJQ0FnY21WMGRYSnVJSEpsYzNWc2REdGNibjBpTEFvZ0lDQWdJbVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnpZVzVwZEdsNlpVVjRaV04xZEdWSlpDaGxlR1ZqZFhSbFNXUTZJSE4wY21sdVp5QjhJSFZ1WkdWbWFXNWxaQ2s2SUhOMGNtbHVaeUI3WEc0Z0lHTnZibk4wSUhaaGJIVmxJRDBnZEhsd1pXOW1JR1Y0WldOMWRHVkpaQ0E5UFQwZ1hDSnpkSEpwYm1kY0lpQS9JR1Y0WldOMWRHVkpaQ0E2SUZ3aVhDSTdYRzRnSUhKbGRIVnliaUIyWVd4MVpTNXlaWEJzWVdObEtDOWJYa0V0V21FdGVqQXRPVjh0WFM5bkxDQmNJbHdpS1R0Y2JuMWNiaUlzQ2lBZ0lDQWlhVzF3YjNKMElIc2dZM0psWVhSbFRHOW5aMlZ5TENCbGVHTmxjSFJwYjI1SVlXNWtiR1Z5TENCeVpXcGxZM1FzSUhKaGFYTmxJSDBnWm5KdmJTQmNJaTR1TDJsdVpHVjRMblJ6WENJN1hHNXBiWEJ2Y25RZ2RIbHdaU0I3SUUxcGVHbHVMQ0JIWlc1bGNtRjBaV1JKYm1sMExDQWtkSGx3WlhNc0lFTnZiblJsZUhSSWRIUndMQ0JOYVd4cmFXOVNaWE53YjI1elpWSmxhbVZqZEN3Z1VtVnpkV3gwY3l3Z1RXbHNhMmx2VW1WemNHOXVjMlZUZFdOalpYTnpMQ0JEYjNKelEyOXVabWxuTENCTWIyZG5aWElzSUV4dlp5QjlJR1p5YjIwZ1hDSXVMaTlwYm1SbGVDNTBjMXdpTzF4dWFXMXdiM0owSUhSNWNHVWdleUJmWDJsdWFYUkZlR1ZqZFhSbGNpQjlJR1p5YjIwZ1hDSXVMaTlsZUdWamRYUmxMMmx1WkdWNExuUnpYQ0k3WEc1cGJYQnZjblFnZXlCZlgyTnlaV0YwWlVsa0lIMGdabkp2YlNCY0lpNHVMM1YwYVd4ekwyTnlaV0YwWlMxcFpDNTBjMXdpTzF4dWFXMXdiM0owSUhzZ1ZISnBaU0I5SUdaeWIyMGdYQ0l1TGk5MWRHbHNjeTkwY21sbExuUnpYQ0k3WEc1cGJYQnZjblFnZXlCaWRXbHNaRU52Y25OSVpXRmtaWEp6SUgwZ1puSnZiU0JjSWk0dUwzVjBhV3h6TDJKMWFXeGtMV052Y25NdGFHVmhaR1Z5Y3k1MGMxd2lPMXh1YVcxd2IzSjBJSHNnY21WMmFYWmxTbE5QVGxCaGNuTmxJSDBnWm5KdmJTQmNJaTR1TDNWMGFXeHpMM0psZG1sMlpTMXFjMjl1TFhCaGNuTmxMblJ6WENJN1hHNXBiWEJ2Y25RZ2V5QnpZVzVwZEdsNlpVVjRaV04xZEdWSlpDQjlJR1p5YjIwZ1hDSXVMaTkxZEdsc2N5OXpZVzVwZEdsNlpTMWxlR1ZqZFhSbExXbGtMblJ6WENJN1hHNWNibVY0Y0c5eWRDQjBlWEJsSUUxcGJHdHBiMGgwZEhCU1pYRjFaWE4wSUQwZ1VtVnhkV1Z6ZER0Y2JseHVaWGh3YjNKMElIUjVjR1VnVFdsc2EybHZTSFIwY0ZKbGMzQnZibk5sSUQwZ1RXbDRhVzQ4WEc0Z0lDQWdVbVZ6Y0c5dWMyVkpibWwwTEZ4dUlDQWdJSHRjYmlBZ0lDQWdJQ0FnWW05a2VUb2djM1J5YVc1bklId2dVbVZoWkdGaWJHVlRkSEpsWVcwOFZXbHVkRGhCY25KaGVUNGdmQ0JWYVc1ME9FRnljbUY1SUh3Z1FYSnlZWGxDZFdabVpYSWdmQ0JDYkc5aUlId2diblZzYkR0Y2JpQWdJQ0FnSUNBZ2MzUmhkSFZ6T2lCdWRXMWlaWEk3WEc0Z0lDQWdJQ0FnSUdobFlXUmxjbk02SUZKbFkyOXlaRHh6ZEhKcGJtY3NJSE4wY21sdVp6NDdYRzRnSUNBZ2ZWeHVQanRjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUY5ZmFXNXBkRXhwYzNSbGJtVnlLR2RsYm1WeVlYUmxaRG9nUjJWdVpYSmhkR1ZrU1c1cGRDd2djblZ1ZEdsdFpUb2dZVzU1TENCbGVHVmpkWFJsY2pvZ1VtVjBkWEp1Vkhsd1pUeDBlWEJsYjJZZ1gxOXBibWwwUlhobFkzVjBaWEkrS1NCN1hHNGdJQ0FnWTI5dWMzUWdjRzl5ZENBOUlISjFiblJwYldVdWNHOXlkRHRjYmlBZ0lDQmpiMjV6ZENCMGNtbGxJRDBnYm1WM0lGUnlhV1U4WVc1NVBpZ3BPMXh1SUNBZ0lDOHZJRkJ5WlMxamIyMXdkWFJsSUdSbFptRjFiSFFnUTA5U1V5QmpiMjVtYVdjZ1lXNWtJR05oWTJobElHaGxZV1JsY25NZ2NHVnlJRzl5YVdkcGJseHVJQ0FnSUdOdmJuTjBJR052Y25NNklFTnZjbk5EYjI1bWFXY2dQU0I3SUdOdmNuTkJiR3h2ZDAxbGRHaHZaSE02SUZ0Y0lsQlBVMVJjSWl3Z1hDSlBVRlJKVDA1VFhDSmRMQ0JqYjNKelFXeHNiM2RJWldGa1pYSnpPaUJiWENKRGIyNTBaVzUwTFZSNWNHVmNJaXdnWENKQmRYUm9iM0pwZW1GMGFXOXVYQ0pkTENCamIzSnpUV0Y0UVdkbE9pQXdMQ0F1TGk1eWRXNTBhVzFsTG1oMGRIQS9MbU52Y25NZ2ZUdGNiaUFnSUNCamIyNXpkQ0JqYjNKelNHVmhaR1Z5YzBOaFkyaGxJRDBnYm1WM0lFMWhjRHh6ZEhKcGJtY3NJRkpsWTI5eVpEeHpkSEpwYm1jc0lITjBjbWx1Wno0K0tDazdYRzRnSUNBZ1kyOXVjM1FnVFVGWVgwTlBVbE5mU0VWQlJFVlNVMTlEUVVOSVJWOVRTVnBGSUQwZ01UQXlORHRjYmlBZ0lDQmpiMjV6ZENCblpYUkRiM0p6U0dWaFpHVnljeUE5SUNodmNtbG5hVzQ2SUhOMGNtbHVaeUI4SUc1MWJHd3BPaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK0lEMCtJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhMlY1SUQwZ2IzSnBaMmx1SUQ4L0lGd2lYQ0k3WEc0Z0lDQWdJQ0FnSUd4bGRDQmpZV05vWldRZ1BTQmpiM0p6U0dWaFpHVnljME5oWTJobExtZGxkQ2hyWlhrcE8xeHVJQ0FnSUNBZ0lDQnBaaUFvWTJGamFHVmtJQ0U5UFNCMWJtUmxabWx1WldRcElISmxkSFZ5YmlCallXTm9aV1E3WEc0Z0lDQWdJQ0FnSUdsbUlDaGpiM0p6U0dWaFpHVnljME5oWTJobExuTnBlbVVnUGowZ1RVRllYME5QVWxOZlNFVkJSRVZTVTE5RFFVTklSVjlUU1ZwRktTQmpiM0p6U0dWaFpHVnljME5oWTJobExtTnNaV0Z5S0NrN1hHNGdJQ0FnSUNBZ0lHTmhZMmhsWkNBOUlHSjFhV3hrUTI5eWMwaGxZV1JsY25Nb1kyOXljeXdnYjNKcFoybHVLVHRjYmlBZ0lDQWdJQ0FnWTI5eWMwaGxZV1JsY25ORFlXTm9aUzV6WlhRb2EyVjVMQ0JqWVdOb1pXUXBPMXh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZMkZqYUdWa08xeHVJQ0FnSUgwN1hHNGdJQ0FnTHk4Z1VISmxMV052YlhCMWRHVWdaR1ZtWVhWc2RDQnlaWE53YjI1elpTQm9aV0ZrWlhKeklDaDNhWFJvYjNWMElHOXlhV2RwYmkxemNHVmphV1pwWXlCRFQxSlRLVnh1SUNBZ0lHTnZibk4wSUdSbFptRjFiSFJTWlhOd2IyNXpaVWhsWVdSbGNuTTZJRkpsWTI5eVpEeHpkSEpwYm1jc0lITjBjbWx1Wno0Z1BTQjdYRzRnSUNBZ0lDQWdJRndpUTJGamFHVXRRMjl1ZEhKdmJGd2lPaUJjSW01dkxYTjBiM0psWENJc1hHNGdJQ0FnSUNBZ0lGd2lRMjl1ZEdWdWRDMVVlWEJsWENJNklGd2lZWEJ3YkdsallYUnBiMjR2YW5OdmJsd2lMRnh1SUNBZ0lIMDdYRzRnSUNBZ0x5OGdVSEpsTFdOdmJYQjFkR1VnYldWeVoyVmtJR2hsWVdSbGNuTWdabTl5SUc1MWJHd2diM0pwWjJsdUlDaHRiM04wSUdOdmJXMXZiaUJqWVhObEtWeHVJQ0FnSUdOdmJuTjBJR1JsWm1GMWJIUk5aWEpuWldSSVpXRmtaWEp6T2lCU1pXTnZjbVE4YzNSeWFXNW5MQ0J6ZEhKcGJtYytJRDBnZXlBdUxpNW5aWFJEYjNKelNHVmhaR1Z5Y3lodWRXeHNLU3dnTGk0dVpHVm1ZWFZzZEZKbGMzQnZibk5sU0dWaFpHVnljeUI5TzF4dVhHNGdJQ0FnTHk4Z1VISmxMV0ZzYkc5allYUmxJSEpsYzNCdmJuTmxJSFJsYlhCc1lYUmxJSEJoY25SeklHWnZjaUJHWVhOMElGQmhkR2hjYmlBZ0lDQmpiMjV6ZENCbGJYQjBlVkpsYzNWc2RGQnlaV1pwZUNBOUlDZDdYQ0prWVhSaFhDSTZlMzBzWENKbGVHVmpkWFJsU1dSY0lqcGNJaWM3WEc0Z0lDQWdZMjl1YzNRZ2NtVnpkV3gwVUhKbFptbDRJRDBnSjN0Y0ltUmhkR0ZjSWpvbk8xeHVJQ0FnSUdOdmJuTjBJR2xrVTNWbVptbDRJRDBnSjF3aUxGd2ljM1ZqWTJWemMxd2lPblJ5ZFdWOUp6dGNiaUFnSUNBdkx5QlRhR0Z5WldRZ2NtVnpjRzl1YzJVZ2IySnFaV04wSUdadmNpQkdZWE4wSUZCaGRHZ2dLR2hoYm1Sc1pYSWdjbVYwZFhKdWN5QnlaWE4xYkhRZ1pHbHlaV04wYkhrc0lHNWxkbVZ5SUcxdlpHbG1hV1Z6SUhKbGMzQnZibk5sS1Z4dUlDQWdJR052Ym5OMElHWmhjM1JRWVhSb1VtVnpjRzl1YzJVZ1BTQjdJR0p2WkhrNklGd2lYQ0lzSUhOMFlYUjFjem9nTWpBd0xDQm9aV0ZrWlhKek9pQmtaV1poZFd4MFRXVnlaMlZrU0dWaFpHVnljeUI5TzF4dVhHNGdJQ0FnTHk4Z1JIbHVZVzFwWXlCamFHVmpheUJtYjNJZ1pYWmxiblFnYUdGdVpHeGxjbk1nZDJsMGFDQjJaWEp6YVc5dUxXSmhjMlZrSUdOaFkyaHBibWRjYmlBZ0lDQnNaWFFnWTJGamFHVmtUbTlGYldsMFNHRnVaR3hsY25NZ1BTQjBjblZsTzF4dUlDQWdJR3hsZENCc1lYTjBSVzFwZEVoaGJtUnNaWEp6Vm1WeWMybHZiaUE5SUMweE8xeHVJQ0FnSUdOdmJuTjBJR05vWldOclRtOUZiV2wwU0dGdVpHeGxjbk1nUFNBb0tUb2dZbTl2YkdWaGJpQTlQaUI3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSFlnUFNCeWRXNTBhVzFsTGw5bGJXbDBTR0Z1Wkd4bGNuTldaWEp6YVc5dU8xeHVJQ0FnSUNBZ0lDQnBaaUFvZGlBaFBUMGdiR0Z6ZEVWdGFYUklZVzVrYkdWeWMxWmxjbk5wYjI0cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUd4aGMzUkZiV2wwU0dGdVpHeGxjbk5XWlhKemFXOXVJRDBnZGp0Y2JpQWdJQ0FnSUNBZ0lDQWdJR05oWTJobFpFNXZSVzFwZEVoaGJtUnNaWEp6SUQxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBaGNuVnVkR2x0WlM1ZmFHRnpSVzFwZEVoaGJtUnNaWEp6UHk0b1hDSnRhV3hyYVc4NlpYaGxZM1YwWlVKbFptOXlaVndpS1NBbUpseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDRnlkVzUwYVcxbExsOW9ZWE5GYldsMFNHRnVaR3hsY25NL0xpaGNJbTFwYkd0cGJ6cGxlR1ZqZFhSbFFXWjBaWEpjSWlrZ0ppWmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWhjblZ1ZEdsdFpTNWZhR0Z6UlcxcGRFaGhibVJzWlhKelB5NG9YQ0p0YVd4cmFXODZhSFIwY0ZKbGNYVmxjM1JjSWlrZ0ppWmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWhjblZ1ZEdsdFpTNWZhR0Z6UlcxcGRFaGhibVJzWlhKelB5NG9YQ0p0YVd4cmFXODZhSFIwY0ZKbGMzQnZibk5sWENJcElDWW1YRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJWEoxYm5ScGJXVXVYMmhoYzBWdGFYUklZVzVrYkdWeWN6OHVLRndpYldsc2EybHZPbWgwZEhCT2IzUkdiM1Z1WkZ3aUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZMkZqYUdWa1RtOUZiV2wwU0dGdVpHeGxjbk03WEc0Z0lDQWdmVHRjYmlBZ0lDQmpiMjV6ZENCb1lYTlBia3h2WjJkbGNsTjFZbTFwZEhScGJtY2dQU0FoSVhKMWJuUnBiV1V1YjI1TWIyZG5aWEpUZFdKdGFYUjBhVzVuTzF4dVhHNGdJQ0FnTHk4Z1UyaGhjbVZrSUc1dkxXOXdJR3h2WjJkbGNpQm1iM0lnWm1GemRDQndZWFJvSUNoMWMyVmtJSGRvWlc0Z2JtOGdaWFpsYm5RZ2FHRnVaR3hsY25NcFhHNGdJQ0FnWTI5dWMzUWdibTl2Y0V4dloyZGxjam9nVEc5bloyVnlJRDBnZTF4dUlDQWdJQ0FnSUNCZk9pQjdJR3h2WjNNNklGdGRJR0Z6SUdGdWVTd2dkR0ZuY3pvZ2JtVjNJRTFoY0R4emRISnBibWNzSUhWdWEyNXZkMjQrS0Nrc0lITjFZbTFwZERvZ0tDa2dQVDRnZXlCOUlIMHNYRzRnSUNBZ0lDQWdJSE5sZEZSaFp6b2dLQ2tnUFQ0Z2V5QjlMRnh1SUNBZ0lDQWdJQ0J6WlhSTWIyYzZJQ2d1TGk1ZmJHOW5PaUJNYjJjcElEMCtJQ2g3ZlNCaGN5Qk1iMmNwTEZ4dUlDQWdJQ0FnSUNCa1pXSjFaem9nS0Y5a1pYTmpjbWx3ZEdsdmJqb2djM1J5YVc1bkxDQXVMaTVmY0dGeVlXMXpPaUJCY25KaGVUeDFibXR1YjNkdVBpa2dQVDRnS0h0OUlHRnpJRXh2Wnlrc1hHNGdJQ0FnSUNBZ0lHbHVabTg2SUNoZlpHVnpZM0pwY0hScGIyNDZJSE4wY21sdVp5d2dMaTR1WDNCaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUNoN2ZTQmhjeUJNYjJjcExGeHVJQ0FnSUNBZ0lDQjNZWEp1T2lBb1gyUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TGw5d1lYSmhiWE02SUVGeWNtRjVQSFZ1YTI1dmQyNCtLU0E5UGlBb2UzMGdZWE1nVEc5bktTeGNiaUFnSUNBZ0lDQWdaWEp5YjNJNklDaGZaR1Z6WTNKcGNIUnBiMjQ2SUhOMGNtbHVaeXdnTGk0dVgzQmhjbUZ0Y3pvZ1FYSnlZWGs4ZFc1cmJtOTNiajRwSUQwK0lDaDdmU0JoY3lCTWIyY3BMRnh1SUNBZ0lDQWdJQ0J5WlhGMVpYTjBPaUFvWDJSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbDl3WVhKaGJYTTZJRUZ5Y21GNVBIVnVhMjV2ZDI0K0tTQTlQaUFvZTMwZ1lYTWdURzluS1N4Y2JpQWdJQ0FnSUNBZ2NtVnpjRzl1YzJVNklDaGZaR1Z6WTNKcGNIUnBiMjQ2SUhOMGNtbHVaeXdnTGk0dVgzQmhjbUZ0Y3pvZ1FYSnlZWGs4ZFc1cmJtOTNiajRwSUQwK0lDaDdmU0JoY3lCTWIyY3BMRnh1SUNBZ0lIMDdYRzVjYmlBZ0lDQXZMeUJRY21VdFkzSmxZWFJsSUdKaGMyVWdZMjl1ZEdWNGRDQndjbTkwYjNSNWNHVWdabTl5SUVaaGMzUWdVR0YwYUNBb2MyaGhjbVZrSUdsdGJYVjBZV0pzWlNCd2NtOXdaWEowYVdWektWeHVJQ0FnSUM4dklHQmpZV3hzWUNCcGN5QmtaV1pwYm1Wa0lHOXVJSEJ5YjNSdmRIbHdaU0IwYnlCaGRtOXBaQ0JqY21WaGRHbHVaeUJoSUdOc2IzTjFjbVVnY0dWeUlISmxjWFZsYzNSY2JpQWdJQ0JqYjI1emRDQmlZWE5sUTI5dWRHVjRkRkJ5YjNSdk9pQmhibmtnUFNCN1hHNGdJQ0FnSUNBZ0lISmxhbVZqZEN4Y2JpQWdJQ0FnSUNBZ1pHVjJaV3h2Y0RvZ2NuVnVkR2x0WlM1a1pYWmxiRzl3TEZ4dUlDQWdJQ0FnSUNCc2IyZG5aWEk2SUc1dmIzQk1iMmRuWlhJc1hHNGdJQ0FnSUNBZ0lHVnRhWFE2SUhKMWJuUnBiV1V1WlcxcGRDeGNiaUFnSUNBZ0lDQWdaVzFwZEVGdWVVRndjSEp2ZG1Wa09pQnlkVzUwYVcxbExtVnRhWFJCYm5sQmNIQnliM1psWkN4Y2JpQWdJQ0FnSUNBZ1pXMXBkRUZzYkVGd2NISnZkbVZrT2lCeWRXNTBhVzFsTG1WdGFYUkJiR3hCY0hCeWIzWmxaQ3hjYmlBZ0lDQWdJQ0FnWTI5dVptbG5PaUJ5ZFc1MGFXMWxMbkoxYm5ScGJXVXVZMjl1Wm1sbkxGeHVJQ0FnSUNBZ0lDQjBlWEJwWVRvZ1oyVnVaWEpoZEdWa0xuUjVjR2xoVTJOb1pXMWhMRnh1SUNBZ0lDQWdJQ0J2YmtacGJtRnNiSGs2SUNncElEMCtJSHNnZlN4Y2JpQWdJQ0FnSUNBZ1h6b2djblZ1ZEdsdFpTeGNiaUFnSUNBZ0lDQWdZMkZzYkNodGIyUjFiR1U2SUdGdWVTd2djRG9nWVc1NUtTQjdJSEpsZEhWeWJpQmxlR1ZqZFhSbGNpNWZYMk5oYkd3b2RHaHBjeXdnYlc5a2RXeGxMQ0J3S1RzZ2ZTeGNiaUFnSUNCOU8xeHVYRzRnSUNBZ0x5OGdTRzkwSUhCaGRHZ2dZMkZqYUdVNklIQnlaUzF5WlhOdmJIWmxJSFJvWlNCdGIzTjBJR052YlcxdmJpQnliM1YwWlZ4dUlDQWdJR3hsZENCallXTm9aV1JTYjNWMFpWTmphR1Z0WVRvZ1lXNTVJRDBnYm5Wc2JEdGNiaUFnSUNCc1pYUWdZMkZqYUdWa1VHRjBhRk4wY21sdVp6b2djM1J5YVc1bklId2diblZzYkNBOUlHNTFiR3c3WEc0Z0lDQWdMeThnUTJGamFHVWdkbUZzYVdSaGRHVlFZWEpoYlhNZ1lXNWtJR2hoYm1Sc1pYSWdjbVZtWlhKbGJtTmxjeUIwYnlCaGRtOXBaQ0J3Y205d1pYSjBlU0JzYjI5cmRYQnpYRzRnSUNBZ2JHVjBJR05oWTJobFpGWmhiR2xrWVhSbFVHRnlZVzF6T2lCaGJua2dQU0J1ZFd4c08xeHVJQ0FnSUd4bGRDQmpZV05vWldSSVlXNWtiR1Z5T2lCaGJua2dQU0J1ZFd4c08xeHVJQ0FnSUd4bGRDQmpZV05vWldSVGEybHdWbUZzYVdSaGRHbHZiam9nWW05dmJHVmhiaUE5SUdaaGJITmxPMXh1WEc0Z0lDQWdZMjl1YzNRZ1ptVjBZMmdnUFNCaGMzbHVZeUFvYjNCMGFXOXVjem9nZTF4dUlDQWdJQ0FnSUNCeVpYRjFaWE4wT2lCTmFXeHJhVzlJZEhSd1VtVnhkV1Z6ZER0Y2JpQWdJQ0FnSUNBZ1pXNTJUVzlrWlQ4NklITjBjbWx1Wnp0Y2JpQWdJQ0FnSUNBZ1pXNTJQem9nVW1WamIzSmtQR0Z1ZVN3Z1lXNTVQanRjYmlBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFL09pQmhibms3WEc0Z0lDQWdJQ0FnSUhKaGQxSmxjM0J2Ym5ObFB6b2dZbTl2YkdWaGJqdGNiaUFnSUNCOUtUb2dVSEp2YldselpUeFNaWE53YjI1elpUNGdQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0JOUVZoZlFrOUVXVjlUU1ZwRklEMGdNVEFnS2lBeE1ESTBJQ29nTVRBeU5EdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2RHOXZUR0Z5WjJVZ1BTQW9LU0E5UGlCeVpXcGxZM1FvWENKU1JWRlZSVk5VWDFSUFQxOU1RVkpIUlZ3aUxDQjdJRzFoZUVKdlpIbFRhWHBsT2lCTlFWaGZRazlFV1Y5VFNWcEZJSDBwTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J5WldGa1FtOWtlVlJsZUhRZ1BTQmhjM2x1WXlBb0tUb2dVSEp2YldselpUeHpkSEpwYm1jK0lEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhCeVpWSmxZV1FnUFNBb2IzQjBhVzl1Y3k1eVpYRjFaWE4wSUdGeklHRnVlU2t1WDE5aWIyUjVWR1Y0ZER0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNod2NtVlNaV0ZrSUNFOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhCeVpWSmxZV1FnUFQwOUlGd2ljM1J5YVc1blhDSWdKaVlnY0hKbFVtVmhaQzVzWlc1bmRHZ2dQaUJOUVZoZlFrOUVXVjlUU1ZwRktTQjBhSEp2ZHlCMGIyOU1ZWEpuWlNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCd2NtVlNaV0ZrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5dWRHVnVkRXhsYm1kMGFDQTlJRTUxYldKbGNpaHZjSFJwYjI1ekxuSmxjWFZsYzNRdWFHVmhaR1Z5Y3k1blpYUW9YQ0pqYjI1MFpXNTBMV3hsYm1kMGFGd2lLU0EvUHlCY0lqQmNJaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvVG5WdFltVnlMbWx6Um1sdWFYUmxLR052Ym5SbGJuUk1aVzVuZEdncElDWW1JR052Ym5SbGJuUk1aVzVuZEdnZ1BpQk5RVmhmUWs5RVdWOVRTVnBGS1NCMGFISnZkeUIwYjI5TVlYSm5aU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGdmNIUnBiMjV6TG5KbGNYVmxjM1F1WW05a2VTa2djbVYwZFhKdUlGd2lYQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpXRmtaWElnUFNCdmNIUnBiMjV6TG5KbGNYVmxjM1F1WW05a2VTNW5aWFJTWldGa1pYSW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSbFkyOWtaWElnUFNCdVpYY2dWR1Y0ZEVSbFkyOWtaWElvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR3hsZENCMFpYaDBJRDBnWENKY0lqdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkMmhwYkdVZ0tIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2V5QmtiMjVsTENCMllXeDFaU0I5SUQwZ1lYZGhhWFFnY21WaFpHVnlMbkpsWVdRb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUnZibVVwSUdKeVpXRnJPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMFpYaDBJQ3M5SUdSbFkyOWtaWEl1WkdWamIyUmxLSFpoYkhWbExDQjdJSE4wY21WaGJUb2dkSEoxWlNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUmxlSFF1YkdWdVozUm9JRDRnVFVGWVgwSlBSRmxmVTBsYVJTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NtVmhaR1Z5TG1OaGJtTmxiQ2dwTG1OaGRHTm9LQ2dwSUQwK0lIdDlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lIUnZiMHhoY21kbEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RHVjRkQ0FyUFNCa1pXTnZaR1Z5TG1SbFkyOWtaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JtYVc1aGJHeDVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WldGa1pYSXVjbVZzWldGelpVeHZZMnNvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCMFpYaDBPMXh1SUNBZ0lDQWdJQ0I5TzF4dVhHNGdJQ0FnSUNBZ0lDOHZJRlZ6WlNCd2NtVXRjR0Z6YzJWa0lHOXlhV2RwYmlCbWNtOXRJR0ZrWVhCMFpYSWdkRzhnWVhadmFXUWdhR1ZoWkdWeWN5NW5aWFFvS1NCallXeHNYRzRnSUNBZ0lDQWdJR052Ym5OMElHOXlhV2RwYmlBOUlDaHZjSFJwYjI1ekxuSmxjWFZsYzNRZ1lYTWdZVzU1S1M1ZlgyOXlhV2RwYmlBL1B5QnZjSFJwYjI1ekxuSmxjWFZsYzNRdWFHVmhaR1Z5Y3k1blpYUW9YQ0pQY21sbmFXNWNJaWs3WEc1Y2JpQWdJQ0FnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNXRaWFJvYjJRZ1BUMDlJRndpVDFCVVNVOU9VMXdpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUZKbGMzQnZibk5sS0hWdVpHVm1hVzVsWkN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHaGxZV1JsY25NNklHZGxkRU52Y25OSVpXRmtaWEp6S0c5eWFXZHBiaWtzWEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDOHZJRlZ6WlNCd2NtVXRjR0Z5YzJWa0lIQmhkR2h1WVcxbElHRnVaQ0J3WVhSb1FYSnlZWGtnYVdZZ1lYWmhhV3hoWW14bElDaG1jbTl0SUdGa1lYQjBaWElwTENCdmRHaGxjbmRwYzJVZ2NHRnljMlZjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdjR0YwYUc1aGJXVWdQU0FvYjNCMGFXOXVjeTV5WlhGMVpYTjBJR0Z6SUdGdWVTa3VYMTl3WVhSb2JtRnRaU0EvUHlCdVpYY2dWVkpNS0c5d2RHbHZibk11Y21WeGRXVnpkQzUxY213cExuQmhkR2h1WVcxbE8xeHVJQ0FnSUNBZ0lDQnBaaUFvY0dGMGFHNWhiV1V1Wlc1a2MxZHBkR2dvWENJdloyVnVaWEpoZEdWZk1qQTBYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmpiM0p6U0dWaFpHVnljeUE5SUdkbGRFTnZjbk5JWldGa1pYSnpLRzl5YVdkcGJpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lGSmxjM0J2Ym5ObEtHNTFiR3dzSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRHRjBkWE02SURJd05DeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9aV0ZrWlhKek9pQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUZObGNuWmxjam9nWENKdGFXeHJhVzljSWl4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMaTR1WTI5eWMwaGxZV1JsY25Nc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRndpUTJGamFHVXRRMjl1ZEhKdmJGd2lPaUJjSW01dkxYTjBiM0psWENJc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRndpUTI5dWRHVnVkQzFVZVhCbFhDSTZJR0IwWlhoMEwzQnNZV2x1T3lCMGFXMWxQU1I3UkdGMFpTNXViM2NvS1gxZ0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEJ5WlZCaGRHaEJjbkpoZVNBOUlDaHZjSFJwYjI1ekxuSmxjWFZsYzNRZ1lYTWdZVzU1S1M1ZlgzQmhkR2hCY25KaGVUdGNiaUFnSUNBZ0lDQWdiR1YwSUhCaGRHaFRkSEpwYm1jNklITjBjbWx1Wnp0Y2JpQWdJQ0FnSUNBZ2JHVjBJSEJoZEdoQmNuSmhlVG9nYzNSeWFXNW5XMTA3WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hjblZ1ZEdsdFpTNWhZMk5sYzNOTFpYa2dKaVlnS0NGeWRXNTBhVzFsTG1sbmJtOXlaVkJoZEdoTVpYWmxiQ0I4ZkNCeWRXNTBhVzFsTG1sbmJtOXlaVkJoZEdoTVpYWmxiQ0E5UFQwZ01Da3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIQmhkR2hUZEhKcGJtY2dQU0J3WVhSb2JtRnRaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIQmhkR2hCY25KaGVTQTlJSEJ5WlZCaGRHaEJjbkpoZVNBL1B5QndZWFJvYm1GdFpTNXpkV0p6ZEhKcGJtY29NU2t1YzNCc2FYUW9YQ0l2WENJcE8xeHVJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFFRnljbUY1SUQwZ2NISmxVR0YwYUVGeWNtRjVJRDgvSUhCaGRHaHVZVzFsTG5OMVluTjBjbWx1WnlneEtTNXpjR3hwZENoY0lpOWNJaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY25WdWRHbHRaUzVoWTJObGMzTkxaWGtnSmlZZ2NHRjBhRUZ5Y21GNUxtRjBLREFwSUNFOVBTQnlkVzUwYVcxbExtRmpZMlZ6YzB0bGVTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHTnZjbk5JWldGa1pYSnpJRDBnWjJWMFEyOXljMGhsWVdSbGNuTW9iM0pwWjJsdUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYjNCMGFXOXVjeTV5WVhkU1pYTndiMjV6WlNrZ2NtVjBkWEp1SUhzZ1gxOXlZWGRTWlhOd2IyNXpaVG9nZEhKMVpTd2dZbTlrZVRvZ1hDSmNJaXdnYzNSaGRIVnpPaUEwTURNc0lHaGxZV1JsY25NNklHTnZjbk5JWldGa1pYSnpJSDBnWVhNZ1lXNTVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnVW1WemNHOXVjMlVvZFc1a1pXWnBibVZrTENCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wWVhSMWN6b2dOREF6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9aV0ZrWlhKek9pQmpiM0p6U0dWaFpHVnljeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5ZFc1MGFXMWxMbWxuYm05eVpWQmhkR2hNWlhabGJDQWhQVDBnZFc1a1pXWnBibVZrSUNZbUlISjFiblJwYldVdWFXZHViM0psVUdGMGFFeGxkbVZzSUNFOVBTQXdLU0J3WVhSb1FYSnlZWGtnUFNCd1lYUm9RWEp5WVhrdWMyeHBZMlVvY25WdWRHbHRaUzVwWjI1dmNtVlFZWFJvVEdWMlpXd3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NHRjBhRk4wY21sdVp5QTlJR0F2Skh0d1lYUm9RWEp5WVhrdWFtOXBiaWhjSWk5Y0lpbDlZRHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDOHZJRkJ5WlMxeVpXRmtJR0p2WkhrZ2RHVjRkQ0JwWmlCaGRtRnBiR0ZpYkdVZ0tHWnliMjBnWVdSaGNIUmxjaWtzSUc5MGFHVnlkMmx6WlNCMWMyVWdZWE41Ym1NZ2NtVnhkV1Z6ZEM1MFpYaDBLQ2xjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZbTlrZVZSbGVIUWdQU0FvYjNCMGFXOXVjeTV5WlhGMVpYTjBJR0Z6SUdGdWVTa3VYMTlpYjJSNVZHVjRkRHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhWEFnUFNCeWRXNTBhVzFsTG5KbFlXeEpjQ0EvSUhKMWJuUnBiV1V1Y21WaGJFbHdLRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNW9aV0ZrWlhKektTQTZJRndpT2pveFhDSTdYRzVjYmlBZ0lDQWdJQ0FnTHk4ZzVyV0w2SytWNTQ2djVhS0Q1TGlMNTVxRUlDUmxkbVZ1ZENEbnE2L25ncm52dkpycGdKcm92NGNnWW1GelpUWTBJT2U4bHVlZ2dlZWFoT1M2aStTN3R1V1FqZWlucHVXUGtlUzZpK1M3dGx4dUlDQWdJQ0FnSUNCcFppQW9iM0IwYVc5dWN5NWxiblpOYjJSbElEMDlQU0JjSW5SbGMzUmNJaUFtSmlCd1lYUm9VM1J5YVc1bkxuTjBZWEowYzFkcGRHZ29YQ0l2SkdWMlpXNTBMMXdpS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdZbUZ6WlRZMFRtRnRaU0E5SUdSbFkyOWtaVlZTU1VOdmJYQnZibVZ1ZENod1lYUm9VM1J5YVc1bkxuTnNhV05sS0RncEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUd4bGRDQmxkbVZ1ZEU1aGJXVTZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnNVlXODVhNjU1TGlONVpDTTZMK1E2S0dNNXBlMjc3eWE1THlZNVlXSTVMMi81NVNvSUdGMGIyTHZ2SXpsbTU3cGdJRGxpTEFnUW5WbVptVnlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hSNWNHVnZaaUJoZEc5aUlDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWMlpXNTBUbUZ0WlNBOUlHRjBiMklvWW1GelpUWTBUbUZ0WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaDBlWEJsYjJZZ1FuVm1abVZ5SUNFOVBTQmNJblZ1WkdWbWFXNWxaRndpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1YyWlc1MFRtRnRaU0E5SUVKMVptWmxjaTVtY205dEtHSmhjMlUyTkU1aGJXVXNJRndpWW1GelpUWTBYQ0lwTG5SdlUzUnlhVzVuS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2JtVjNJRVZ5Y205eUtGd2lUbThnWW1GelpUWTBJR1JsWTI5a1pYSWdZWFpoYVd4aFlteGxYQ0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHTnZjbk5JWldGa1pYSnpJRDBnWjJWMFEyOXljMGhsWVdSbGNuTW9iM0pwWjJsdUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCaWIyUjVJRDBnU2xOUFRpNXpkSEpwYm1kcFpua29leUJ6ZFdOalpYTnpPaUJtWVd4elpTd2dZMjlrWlRvZ1hDSlFRVkpCVFZOZlZGbFFSVjlPVDFSZlUxVlFVRTlTVkVWRVhDSXNJSEpsYW1WamREb2dleUJsZUhCbFkzUmxaRG9nWENKMllXeHBaQ0JpWVhObE5qUWdaWFpsYm5RZ2JtRnRaVndpSUgwZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0c5d2RHbHZibk11Y21GM1VtVnpjRzl1YzJVcElISmxkSFZ5YmlCN0lGOWZjbUYzVW1WemNHOXVjMlU2SUhSeWRXVXNJR0p2Wkhrc0lITjBZWFIxY3pvZ01qQXdMQ0JvWldGa1pYSnpPaUI3SUM0dUxtTnZjbk5JWldGa1pYSnpMQ0JjSWtOdmJuUmxiblF0Vkhsd1pWd2lPaUJjSW1Gd2NHeHBZMkYwYVc5dUwycHpiMjVjSWlCOUlIMGdZWE1nWVc1NU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dVbVZ6Y0c5dWMyVW9ZbTlrZVN3Z2V5QnpkR0YwZFhNNklESXdNQ3dnYUdWaFpHVnljem9nZXlBdUxpNWpiM0p6U0dWaFpHVnljeXdnWENKRGIyNTBaVzUwTFZSNWNHVmNJam9nWENKaGNIQnNhV05oZEdsdmJpOXFjMjl1WENJZ2ZTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJR1YyWlc1MFJHRjBZVG9nWVc1NUlEMGdkVzVrWldacGJtVmtPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY21GM1FtOWtlU0E5SUdGM1lXbDBJSEpsWVdSQ2IyUjVWR1Y0ZENncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tISmhkMEp2WkhrZ0ppWWdjbUYzUW05a2VTQWhQVDBnWENKY0lpQW1KaUJ5WVhkQ2IyUjVJQ0U5UFNCY0ludDlYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGNua2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbGRtVnVkRVJoZEdFZ1BTQnlaWFpwZG1WS1UwOU9VR0Z5YzJVb1NsTlBUaTV3WVhKelpTaHlZWGRDYjJSNUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JqWVhSamFDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR052Y25OSVpXRmtaWEp6SUQwZ1oyVjBRMjl5YzBobFlXUmxjbk1vYjNKcFoybHVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWW05a2VTQTlJRXBUVDA0dWMzUnlhVzVuYVdaNUtIc2djM1ZqWTJWemN6b2dabUZzYzJVc0lHTnZaR1U2SUZ3aVVFRlNRVTFUWDFSWlVFVmZUazlVWDFOVlVGQlBVbFJGUkZ3aUxDQnlaV3BsWTNRNklIc2daWGh3WldOMFpXUTZJRndpYW5OdmJsd2lJSDBnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmNIUnBiMjV6TG5KaGQxSmxjM0J2Ym5ObEtTQnlaWFIxY200Z2V5QmZYM0poZDFKbGMzQnZibk5sT2lCMGNuVmxMQ0JpYjJSNUxDQnpkR0YwZFhNNklESXdNQ3dnYUdWaFpHVnljem9nZXlBdUxpNWpiM0p6U0dWaFpHVnljeXdnWENKRGIyNTBaVzUwTFZSNWNHVmNJam9nWENKaGNIQnNhV05oZEdsdmJpOXFjMjl1WENJZ2ZTQjlJR0Z6SUdGdWVUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCU1pYTndiMjV6WlNoaWIyUjVMQ0I3SUhOMFlYUjFjem9nTWpBd0xDQm9aV0ZrWlhKek9pQjdJQzR1TG1OdmNuTklaV0ZrWlhKekxDQmNJa052Ym5SbGJuUXRWSGx3WlZ3aU9pQmNJbUZ3Y0d4cFkyRjBhVzl1TDJwemIyNWNJaUI5SUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaWGhsWTNWMFpVbGtJRDBnWDE5amNtVmhkR1ZKWkNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdZMjl5YzBobFlXUmxjbk1nUFNCblpYUkRiM0p6U0dWaFpHVnljeWh2Y21sbmFXNHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYW5OdmJraGxZV1JsY25NZ1BTQjdJQzR1TG1OdmNuTklaV0ZrWlhKekxDQmNJa052Ym5SbGJuUXRWSGx3WlZ3aU9pQmNJbUZ3Y0d4cFkyRjBhVzl1TDJwemIyNWNJaXdnWENKRFlXTm9aUzFEYjI1MGNtOXNYQ0k2SUZ3aWJtOHRjM1J2Y21WY0lpQjlPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeURvaDZybGlxam1zNmpsaGFVZ1kyOXVkR1Y0ZENEaWdKUWdaWFpsYm5RZzVwV3c1bzJ1NUxpdDU3cW01YTZhNUwrWDVvaVE1NXFFSUdOdmJuUmxlSFFnNVkrQzVwV3c1cGVnNXJPVjU1U3g1YVNXNllPbzVMeWc1WStDNzd5TTU1U3g1cHlONVlxaDU2dXY2S0dsNVlXbzQ0Q0NYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5RGt1STRnWVdOMGFXOXVJT2FKcCtpaGpPUy9uZWFNZ2VTNGdPaUh0Tys4bXVhZWhPVzd1dVd1ak9hVnRPZWFoQ0JqYjI1MFpYaDA3N3lJYkc5bloyVnlMMk52Ym1acFp5OTBlWEJwWVM5allXeHNJT2V0aWUrOGllKzhqT1c1dHVpbnB1V1BrVnh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdiV2xzYTJsdk9tVjRaV04xZEdWQ1pXWnZjbVVnTHlCdGFXeHJhVzg2YUhSMGNGSmxjM0J2Ym5ObElPUzZpK1M3dHUrOGpPUzl2eUJpYjI5MGMzUnlZWEFnNVkrdjVMdWw1ck9vNVlXbElHUmlMM0psWkdseklPZXRpZWlEdmVXS20rT0FnbHh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1YyWlc1MFJHRjBZU0FtSmlCMGVYQmxiMllnWlhabGJuUkVZWFJoSUQwOVBTQmNJbTlpYW1WamRGd2lJQ1ltSUNGQmNuSmhlUzVwYzBGeWNtRjVLR1YyWlc1MFJHRjBZU2tnSmlZZ0lTaGNJbU52Ym5SbGVIUmNJaUJwYmlCbGRtVnVkRVJoZEdFcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1kyOXVkR1Y0ZERvZ1lXNTVJRDBnZTMwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1eVpXcGxZM1FnUFNCeVpXcGxZM1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzV5WVdselpTQTlJSEpoYVhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdVpHVjJaV3h2Y0NBOUlISjFiblJwYldVdVpHVjJaV3h2Y0R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1WNFpXTjFkR1ZKWkNBOUlHVjRaV04xZEdWSlpEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuQmhkR2dnUFNCd1lYUm9VM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdVpXMXBkQ0E5SUhKMWJuUnBiV1V1WlcxcGREdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtVnRhWFJCYm5sQmNIQnliM1psWkNBOUlISjFiblJwYldVdVpXMXBkRUZ1ZVVGd2NISnZkbVZrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1WlcxcGRFRnNiRUZ3Y0hKdmRtVmtJRDBnY25WdWRHbHRaUzVsYldsMFFXeHNRWEJ3Y205MlpXUTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNWZJRDBnY25WdWRHbHRaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbU52Ym1acFp5QTlJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNWpiMjVtYVdjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1MGVYQnBZU0E5SUdkbGJtVnlZWFJsWkM1MGVYQnBZVk5qYUdWdFlUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtTmhiR3dnUFNBb2JXOWtkV3hsT2lCaGJua3NJSEJoY21GdGN6b2dZVzU1S1NBOVBpQmxlR1ZqZFhSbGNpNWZYMk5oYkd3b1kyOXVkR1Y0ZEN3Z2JXOWtkV3hsTENCd1lYSmhiWE1wTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1YjI1R2FXNWhiR3g1SUQwZ0tDa2dQVDRnZTMwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYkc5bloyVnlJRDBnWTNKbFlYUmxURzluWjJWeUtISjFiblJwYldVc0lIQmhkR2hUZEhKcGJtY3NJR1Y0WldOMWRHVkpaQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVzYjJkblpYSWdQU0JzYjJkblpYSTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNW9kSFJ3SUQwZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwY0N4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxek9pQjdJSE4wY21sdVp6b2djbUYzUW05a2VTQS9QeUJjSWx3aUxDQndZWEp6WldRNklHVjJaVzUwUkdGMFlTQjlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYRjFaWE4wT2lCdmNIUnBiMjV6TG5KbGNYVmxjM1FzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1obFlXUmxjbk1nUFNCdmNIUnBiMjV6TG5KbGNYVmxjM1F1YUdWaFpHVnljenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JsZG1WdWRFUmhkR0V1WTI5dWRHVjRkQ0E5SUdOdmJuUmxlSFE3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JsYldsMFNIUjBjRkpsYzNCdmJuTmxJRDBnS0hOMVkyTmxjM002SUdKdmIyeGxZVzRwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tISjFiblJwYldVdVgyaGhjMFZ0YVhSSVlXNWtiR1Z5Y3o4dUtGd2liV2xzYTJsdk9taDBkSEJTWlhOd2IyNXpaVndpS1NBL1B5QjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnY25WdWRHbHRaUzVsYldsMEtGd2liV2xzYTJsdk9taDBkSEJTWlhOd2IyNXpaVndpTENCN0lHVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQndZWFJvT2lCd1lYUm9VM1J5YVc1bkxDQm9kSFJ3T2lCamIyNTBaWGgwTG1oMGRIQXNJR2hsWVdSbGNuTTZJRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxDQmpiMjUwWlhoMExDQnpkV05qWlhOekxDQnlaV3BsWTNRc0lISmhhWE5sSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJT1dGaU9pbnB1V1BrU0JsZUdWamRYUmxRbVZtYjNKbDc3eUlZbTl2ZEhOMGNtRndJT2F6cU9XRnBTQmtZaTl5WldScGMrKzhpZSs4ak9TNmkrUzd0dVdraE9lUWh1V3VqT2FJa09XUWp1V0dqZWlucHVXUGtWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCb2RIUndVbVZ6Y0c5dWMyWHZ2SWpwaDRybWxMN292NTdtanFYdnZJbnZ2SXprdUk0Z1lXTjBhVzl1SU9lYWhPZVVuK1dSdmVXUnFPYWNuK1MvbmVhTWdlUzRnT2lIdE9PQWdseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NuVnVkR2x0WlM1ZmFHRnpSVzFwZEVoaGJtUnNaWEp6UHk0b1hDSnRhV3hyYVc4NlpYaGxZM1YwWlVKbFptOXlaVndpS1NBL1B5QjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0J5ZFc1MGFXMWxMbVZ0YVhRb1hDSnRhV3hyYVc4NlpYaGxZM1YwWlVKbFptOXlaVndpTENCN0lHVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQndZWFJvT2lCd1lYUm9VM1J5YVc1bkxDQnRaWFJoT2lCN2ZTd2dZMjl1ZEdWNGRDd2djbVZxWldOMExDQnlZV2x6WlNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCeWRXNTBhVzFsTG1WdGFYUW9aWFpsYm5ST1lXMWxMQ0JsZG1WdWRFUmhkR0VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dWdGFYUkZjbkp2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmxjbkpTWlhOMWJIUWdQU0JsZUdObGNIUnBiMjVJWVc1a2JHVnlLR1Y0WldOMWRHVkpaQ3dnYkc5bloyVnlMQ0JsYldsMFJYSnliM0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSkNiMlI1SUQwZ1NsTlBUaTV6ZEhKcGJtZHBabmtvWlhKeVVtVnpkV3gwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkSEo1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJR1Z0YVhSSWRIUndVbVZ6Y0c5dWMyVW9abUZzYzJVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdOaGRHTm9JSHQ5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h2Y0hScGIyNXpMbkpoZDFKbGMzQnZibk5sS1NCeVpYUjFjbTRnZXlCZlgzSmhkMUpsYzNCdmJuTmxPaUIwY25WbExDQmliMlI1T2lCbGNuSkNiMlI1TENCemRHRjBkWE02SURJd01Dd2dhR1ZoWkdWeWN6b2dhbk52YmtobFlXUmxjbk1nZlNCaGN5Qmhibms3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dVbVZ6Y0c5dWMyVW9aWEp5UW05a2VTd2dleUJ6ZEdGMGRYTTZJREl3TUN3Z2FHVmhaR1Z5Y3pvZ2FuTnZia2hsWVdSbGNuTWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnWlcxcGRFaDBkSEJTWlhOd2IyNXpaU2gwY25WbEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR05oZEdOb0lIdDlYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJSEoxYm5ScGJXVXVaVzFwZENobGRtVnVkRTVoYldVc0lHVjJaVzUwUkdGMFlTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JqWVhSamFDQW9aVzFwZEVWeWNtOXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdWeWNsSmxjM1ZzZENBOUlHVjRZMlZ3ZEdsdmJraGhibVJzWlhJb1pYaGxZM1YwWlVsa0xDQnViMjl3VEc5bloyVnlMQ0JsYldsMFJYSnliM0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSkNiMlI1SUQwZ1NsTlBUaTV6ZEhKcGJtZHBabmtvWlhKeVVtVnpkV3gwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0c5d2RHbHZibk11Y21GM1VtVnpjRzl1YzJVcElISmxkSFZ5YmlCN0lGOWZjbUYzVW1WemNHOXVjMlU2SUhSeWRXVXNJR0p2WkhrNklHVnlja0p2Wkhrc0lITjBZWFIxY3pvZ01qQXdMQ0JvWldGa1pYSnpPaUJxYzI5dVNHVmhaR1Z5Y3lCOUlHRnpJR0Z1ZVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJTWlhOd2IyNXpaU2hsY25KQ2IyUjVMQ0I3SUhOMFlYUjFjem9nTWpBd0xDQm9aV0ZrWlhKek9pQnFjMjl1U0dWaFpHVnljeUI5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHSnZaSGtnUFNCZ2Uxd2laR0YwWVZ3aU9pUjdTbE5QVGk1emRISnBibWRwWm5rb1pYWmxiblJFWVhSaElEOC9JSHQ5TENBb2EyVjVMQ0IyWVd4MVpTa2dQVDRnYTJWNUlEMDlQU0JjSW1OdmJuUmxlSFJjSWlBL0lIVnVaR1ZtYVc1bFpDQTZJSFpoYkhWbEtYMHNYQ0psZUdWamRYUmxTV1JjSWpwY0lpUjdaWGhsWTNWMFpVbGtmVndpTEZ3aWMzVmpZMlZ6YzF3aU9uUnlkV1Y5WUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmNIUnBiMjV6TG5KaGQxSmxjM0J2Ym5ObEtTQnlaWFIxY200Z2V5QmZYM0poZDFKbGMzQnZibk5sT2lCMGNuVmxMQ0JpYjJSNUxDQnpkR0YwZFhNNklESXdNQ3dnYUdWaFpHVnljem9nYW5OdmJraGxZV1JsY25NZ2ZTQmhjeUJoYm5rN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUZKbGMzQnZibk5sS0dKdlpIa3NJSHNnYzNSaGRIVnpPaUF5TURBc0lHaGxZV1JsY25NNklHcHpiMjVJWldGa1pYSnpJSDBwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdMeThnUFQwOVBUMGdSa0ZUVkNCUVFWUklJR1p2Y2lCamIyMXRiMjRnWVdOMGFXOXVJSEpsY1hWbGMzUnpJRDA5UFQwOVhHNGdJQ0FnSUNBZ0lDOHZJRk5yYVhBZ2JHOW5aMlZ5TENCeVpYRjFaWE4wSUcxaGNDd2dZVzVrSUcxdmMzUWdiMkpxWldOMElHTnlaV0YwYVc5dUlIZG9aVzQ2WEc0Z0lDQWdJQ0FnSUM4dklDMGdjbUYzVW1WemNHOXVjMlVnYlc5a1pTQW9ZV1JoY0hSbGNpbGNiaUFnSUNBZ0lDQWdMeThnTFNCT2J5QnZjbWxuYVc0Z2FHVmhaR1Z5SUNodWJ5QkRUMUpUSUc1bFpXUmxaQ2xjYmlBZ0lDQWdJQ0FnTHk4Z0xTQk9ieUJsZG1WdWRDQm9ZVzVrYkdWeWN5QnlaV2RwYzNSbGNtVmtJQ2hrZVc1aGJXbGpJR05vWldOcktWeHVJQ0FnSUNBZ0lDQXZMeUF0SUU1dmRDQmhJSE4wY21WaGJTQnlaWEYxWlhOMFhHNGdJQ0FnSUNBZ0lHbG1JQ2h2Y0hScGIyNXpMbkpoZDFKbGMzQnZibk5sSUNZbUlDRnZjbWxuYVc0Z0ppWWdZMmhsWTJ0T2IwVnRhWFJJWVc1a2JHVnljeWdwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmZYMmx6UVdOMGFXOXVJRDBnS0c5d2RHbHZibk11Y21WeGRXVnpkQ0JoY3lCaGJua3BMbDlmYVhOQlkzUnBiMjQ3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvWDE5cGMwRmpkR2x2YmlBaFBUMGdabUZzYzJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJTWlhOdmJIWmxJSEp2ZFhSbElITmphR1Z0WVNCM2FYUm9JR2h2ZENCallXTm9aVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR3hsZENCeWIzVjBaVk5qYUdWdFlTQTlJRzl3ZEdsdmJuTXVjbTkxZEdWVFkyaGxiV0U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRnliM1YwWlZOamFHVnRZU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY0dGMGFGTjBjbWx1WnlBOVBUMGdZMkZqYUdWa1VHRjBhRk4wY21sdVp5QW1KaUJqWVdOb1pXUlNiM1YwWlZOamFHVnRZU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFZ1BTQmpZV05vWldSU2IzVjBaVk5qYUdWdFlUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZFhSbFUyTm9aVzFoSUQwZ2RISnBaUzVuWlhRb2NHRjBhRk4wY21sdVp5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ0lUMDlJRzUxYkd3cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWVdOb1pXUlNiM1YwWlZOamFHVnRZU0E5SUhKdmRYUmxVMk5vWlcxaE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR05oWTJobFpGQmhkR2hUZEhKcGJtY2dQU0J3WVhSb1UzUnlhVzVuTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeWIzVjBaVk5qYUdWdFlTQTlJR2RsYm1WeVlYUmxaQzV5YjNWMFpWTmphR1Z0WVQ4dVczQmhkR2hUZEhKcGJtZGRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHliM1YwWlZOamFHVnRZU0E5UFQwZ2RXNWtaV1pwYm1Wa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRFF3TkNBdElHWmhiR3dnZEdoeWIzVm5hQ0IwYnlCemJHOTNJSEJoZEdnZ1ptOXlJSEJ5YjNCbGNpQmxjbkp2Y2lCb1lXNWtiR2x1WjF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElDRTlQU0JjSW1aMWJtTjBhVzl1WENJcElISnZkWFJsVTJOb1pXMWhMbTF2WkhWc1pTQTlJR0YzWVdsMElISnZkWFJsVTJOb1pXMWhMbTF2WkhWc1pUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pXeHpaU0J5YjNWMFpWTmphR1Z0WVM1dGIyUjFiR1VnUFNCaGQyRnBkQ0J5YjNWMFpWTmphR1Z0WVM1dGIyUjFiR1VvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKcFpTNWhaR1FvY0dGMGFGTjBjbWx1Wnl3Z2NtOTFkR1ZUWTJobGJXRXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpZV05vWldSU2IzVjBaVk5qYUdWdFlTQTlJSEp2ZFhSbFUyTm9aVzFoTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWVdOb1pXUlFZWFJvVTNSeWFXNW5JRDBnY0dGMGFGTjBjbWx1Wnp0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ0ppWWdjbTkxZEdWVFkyaGxiV0V1ZEhsd1pTQTlQVDBnWENKaFkzUnBiMjVjSWlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCVmMyVWdZMkZqYUdWa0lHWjFibU4wYVc5dUlISmxabVZ5Wlc1alpYTWdkMmhsYmlCb2FYUjBhVzVuSUhSb1pTQnpZVzFsSUhKdmRYUmxYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUd4bGRDQjJZV3hwWkdGMFpWQmhjbUZ0Y3lBOUlHTmhZMmhsWkZaaGJHbGtZWFJsVUdGeVlXMXpPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCc1pYUWdhR0Z1Wkd4bGNpQTlJR05oWTJobFpFaGhibVJzWlhJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR3hsZENCemEybHdWbUZzYVdSaGRHbHZiaUE5SUdOaFkyaGxaRk5yYVhCV1lXeHBaR0YwYVc5dU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NtOTFkR1ZUWTJobGJXRWdJVDA5SUdOaFkyaGxaRkp2ZFhSbFUyTm9aVzFoS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMllXeHBaR0YwWlZCaGNtRnRjeUE5SUhKdmRYUmxVMk5vWlcxaExuWmhiR2xrWVhSbFVHRnlZVzF6TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYUdGdVpHeGxjaUE5SUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlM1b1lXNWtiR1Z5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdiV1YwWVNBOUlISnZkWFJsVTJOb1pXMWhMbTF2WkhWc1pUOHViV1YwWVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOcmFYQldZV3hwWkdGMGFXOXVJRDBnYldWMFlUOHVkSGx3WlZOaFptVjBlU0E5UFQwZ1ptRnNjMlVnZkh3Z0tFRnljbUY1TG1selFYSnlZWGtvYldWMFlUOHVkSGx3WlZOaFptVjBlU2tnSmlZZ0lXMWxkR0V1ZEhsd1pWTmhabVYwZVM1cGJtTnNkV1JsY3loY0luQmhjbUZ0YzF3aUtTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpZV05vWldSV1lXeHBaR0YwWlZCaGNtRnRjeUE5SUhaaGJHbGtZWFJsVUdGeVlXMXpPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMkZqYUdWa1NHRnVaR3hsY2lBOUlHaGhibVJzWlhJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCallXTm9aV1JUYTJsd1ZtRnNhV1JoZEdsdmJpQTlJSE5yYVhCV1lXeHBaR0YwYVc5dU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pYaGxZM1YwWlVsa0lEMGdYMTlqY21WaGRHVkpaQ2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCaWIyUjVJRDBnWVhkaGFYUWdjbVZoWkVKdlpIbFVaWGgwS0NrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1VHRnljMlVnY0dGeVlXMXpYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUd4bGRDQndZWEpoYlhNNklHRnVlVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJSEJoY21GdGMwOXJJRDBnZEhKMVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmliMlI1SUh4OElHSnZaSGtnUFQwOUlGd2lYQ0lnZkh3Z1ltOWtlU0E5UFQwZ1hDSjdmVndpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE1nUFNCN2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxeklEMGdjbVYyYVhabFNsTlBUbEJoY25ObEtFcFRUMDR1Y0dGeWMyVW9ZbTlrZVNrcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnY0dGeVlXMXpJRDA5UFNCY0luVnVaR1ZtYVc1bFpGd2lLU0J3WVhKaGJYTWdQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1kyRjBZMmdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzA5cklEMGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY0dGeVlXMXpUMnNnSmlZZ2NHRnlZVzF6SUNFOVBTQnVkV3hzSUNZbUlIUjVjR1Z2WmlCd1lYSmhiWE1nUFQwOUlGd2liMkpxWldOMFhDSWdKaVlnSVVGeWNtRjVMbWx6UVhKeVlYa29jR0Z5WVcxektTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVTJ0cGNDQWtiV2xzYTJsdlIyVnVaWEpoZEdWUVlYSmhiWE1nYVc0Z2RHVnpkQ0J0YjJSbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9iM0IwYVc5dWN5NWxiblpOYjJSbElEMDlQU0JjSW5SbGMzUmNJaUI4ZkNBaEtGd2lKRzFwYkd0cGIwZGxibVZ5WVhSbFVHRnlZVzF6WENJZ2FXNGdjR0Z5WVcxektTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklGWmhiR2xrWVhSbElIQmhjbUZ0Y3lCM2FHVnVJSFI1Y0dWVFlXWmxkSGtnYVhNZ1pXNWhZbXhsWkZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doYzJ0cGNGWmhiR2xrWVhScGIyNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2RtRnNhV1JoZEdsdmJpQTlJSFpoYkdsa1lYUmxVR0Z5WVcxektIQmhjbUZ0Y3lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hkbUZzYVdSaGRHbHZiaTV6ZFdOalpYTnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QldZV3hwWkdGMGFXOXVJR1poYVd4bFpDQXRJR1poYkd3Z2RHaHliM1ZuYUNCMGJ5QnpiRzkzSUhCaGRHaGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJoY21GdGMwOXJJRDBnWm1Gc2MyVTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY0dGeVlXMXpUMnNwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1FuVnBiR1FnYldsdWFXMWhiQ0JqYjI1MFpYaDBJSFZ6YVc1bklIQnliM1J2ZEhsd1pTQm1iM0lnYzJoaGNtVmtJSEJ5YjNCbGNuUnBaWE5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1kyOXVkR1Y0ZERvZ1lXNTVJRDBnVDJKcVpXTjBMbU55WldGMFpTaGlZWE5sUTI5dWRHVjRkRkJ5YjNSdktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1d1lYUm9JRDBnY0dGMGFGTjBjbWx1Wnp0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzV5YjNWMFpWUjVjR1VnUFNCY0ltRmpkR2x2Ymx3aU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1WNFpXTjFkR1ZKWkNBOUlHVjRaV04xZEdWSlpEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1b2RIUndJRDBnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RYSnNPaUJ3WVhSb2JtRnRaU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsd0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0YwYURvZ2V5QnpkSEpwYm1jNklIQmhkR2hUZEhKcGJtY3NJR0Z5Y21GNU9pQndZWFJvUVhKeVlYa2dmU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjem9nZXlCemRISnBibWM2SUdKdlpIa3NJSEJoY25ObFpEb2djR0Z5WVcxeklIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhGMVpYTjBPaUJ2Y0hScGIyNXpMbkpsY1hWbGMzUXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhOd2IyNXpaVG9nWm1GemRGQmhkR2hTWlhOd2IyNXpaU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmNuTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdWFHVmhaR1Z5Y3lBOUlHOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhRZ1BTQmhkMkZwZENCb1lXNWtiR1Z5S0dOdmJuUmxlSFFzSUhCaGNtRnRjeWs3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5WlhOMWJIUWdQVDA5SUhWdVpHVm1hVzVsWkNCOGZDQnlaWE4xYkhRZ1BUMDlJRzUxYkd3Z2ZId2djbVZ6ZFd4MElEMDlQU0JjSWx3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUhzZ1gxOXlZWGRTWlhOd2IyNXpaVG9nZEhKMVpTd2dZbTlrZVRvZ1pXMXdkSGxTWlhOMWJIUlFjbVZtYVhnZ0t5QmxlR1ZqZFhSbFNXUWdLeUJwWkZOMVptWnBlQ3dnYzNSaGRIVnpPaUF5TURBc0lHaGxZV1JsY25NNklHUmxabUYxYkhSTlpYSm5aV1JJWldGa1pYSnpJSDBnWVhNZ1lXNTVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJR2xtSUNnaFFYSnlZWGt1YVhOQmNuSmhlU2h5WlhOMWJIUXBJQ1ltSUhSNWNHVnZaaUJ5WlhOMWJIUWdQVDA5SUZ3aWIySnFaV04wWENJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZXlCZlgzSmhkMUpsYzNCdmJuTmxPaUIwY25WbExDQmliMlI1T2lCeVpYTjFiSFJRY21WbWFYZ2dLeUJLVTA5T0xuTjBjbWx1WjJsbWVTaHlaWE4xYkhRcElDc2dKeXhjSW1WNFpXTjFkR1ZKWkZ3aU9sd2lKeUFySUdWNFpXTjFkR1ZKWkNBcklHbGtVM1ZtWm1sNExDQnpkR0YwZFhNNklESXdNQ3dnYUdWaFpHVnljem9nWkdWbVlYVnNkRTFsY21kbFpFaGxZV1JsY25NZ2ZTQmhjeUJoYm5rN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCSmJuWmhiR2xrSUhKbGMzVnNkQ0IwZVhCbElDMGdabUZzYkNCMGFISnZkV2RvSUhSdklITnNiM2NnY0dGMGFGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRWhoYm1Sc1pYSWdkR2h5WlhjZ0xTQm1ZV3hzSUhSb2NtOTFaMmdnZEc4Z2MyeHZkeUJ3WVhSb0lHWnZjaUJ3Y205d1pYSWdaWEp5YjNJZ2FHRnVaR3hwYm1kY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDOHZJRDA5UFQwOUlGTk1UMWNnVUVGVVNDQTlQVDA5UFZ4dUlDQWdJQ0FnSUNCamIyNXpkQ0JqYjNKelNHVmhaR1Z5Y3lBOUlHZGxkRU52Y25OSVpXRmtaWEp6S0c5eWFXZHBiaWs3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEpoZDBWNFpXTjFkR1ZKWkNBOUlISjFiblJwYldVL0xtVjRaV04xZEdWSlpDQS9JR0YzWVdsMElISjFiblJwYldVdVpYaGxZM1YwWlVsa0tHOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6S1NBNklGOWZZM0psWVhSbFNXUW9LVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdaWGhsWTNWMFpVbGtJRDBnYzJGdWFYUnBlbVZGZUdWamRYUmxTV1FvY21GM1JYaGxZM1YwWlVsa0tTQjhmQ0JmWDJOeVpXRjBaVWxrS0NrN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUdGdWVVVnRhWFJJWVc1a2JHVnljeUE5SUNGamFHVmphMDV2UlcxcGRFaGhibVJzWlhKektDazdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiRzluWjJWeUlEMGdZM0psWVhSbFRHOW5aMlZ5S0hKMWJuUnBiV1VzSUhCaGRHaFRkSEpwYm1jc0lHVjRaV04xZEdWSlpDazdYRzRnSUNBZ0lDQWdJR2xtSUNoaGJubEZiV2wwU0dGdVpHeGxjbk1wSUhKMWJuUnBiV1V1Y25WdWRHbHRaUzV5WlhGMVpYTjBMbk5sZENobGVHVmpkWFJsU1dRc0lIc2diRzluWjJWeUlIMHBPMXh1SUNBZ0lDQWdJQ0F2THlCUWNtVXRZMjl0Y0hWMFpTQmlZWE5sSUdobFlXUmxjbk1nWm05eUlIUm9hWE1nY21WeGRXVnpkQ0FvUTA5U1V5QXJJR1JsWm1GMWJIUnpLVnh1SUNBZ0lDQWdJQ0JqYjI1emRDQmlZWE5sU0dWaFpHVnljem9nVW1WamIzSmtQSE4wY21sdVp5d2djM1J5YVc1blBpQTlJRzl5YVdkcGJpQS9JSHNnTGk0dVkyOXljMGhsWVdSbGNuTXNJQzR1TG1SbFptRjFiSFJTWlhOd2IyNXpaVWhsWVdSbGNuTWdmU0E2SUdSbFptRjFiSFJOWlhKblpXUklaV0ZrWlhKek8xeHVYRzRnSUNBZ0lDQWdJR3hsZENCbWFXNWhiR1Z6T2lCQmNuSmhlVHdvS1NBOVBpQjJiMmxrSUh3Z1VISnZiV2x6WlR4MmIybGtQajRnUFNCYlhUdGNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE53YjI1elpUb2dUV2xzYTJsdlNIUjBjRkpsYzNCdmJuTmxJRDBnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZbTlrZVRvZ1hDSmNJaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lITjBZWFIxY3pvZ01qQXdMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3pvZ2V5QXVMaTVpWVhObFNHVmhaR1Z5Y3lCOUxGeHVJQ0FnSUNBZ0lDQjlPMXh1WEc0Z0lDQWdJQ0FnSUM4dklFTm9aV05ySUdsbUlIUm9hWE1nYVhNZ1lTQnlZWGNnY205MWRHVWc0b0NVSUhKaGR5QnliM1YwWlhNZ1lubHdZWE56SUdGamRHbHZiaTl6ZEhKbFlXMGdiRzluYVdOY2JpQWdJQ0FnSUNBZ0x5OGdZVzVrSUd4bGRDQjBhR1VnYUdGdVpHeGxjaUJ2ZDI0Z2RHaGxJR1oxYkd3Z1VtVnhkV1Z6ZEM5U1pYTndiMjV6WlNCc2FXWmxZM2xqYkdVdVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUdselVtRjNVR0YwYUNBOUlHZGxibVZ5WVhSbFpDNXlZWGRUWTJobGJXRS9MbkpoZDFCaGRHaHpQeTVvWVhNb2NHRjBhRk4wY21sdVp5a2dQejhnWm1Gc2MyVTdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhSFIwY0RvZ1EyOXVkR1Y0ZEVoMGRIQWdQU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjFjbXc2SUhCaGRHaHVZVzFsSUdGeklHRnVlU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lHbHdMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2NHRjBhRG9nZXlCemRISnBibWM2SUhCaGRHaFRkSEpwYm1jZ1lYTWdhMlY1YjJZZ0pIUjVjR1Z6VzF3aVoyVnVaWEpoZEdWa1hDSmRXMXdpY205MWRHVlRZMmhsYldGY0lsMHNJR0Z5Y21GNU9pQndZWFJvUVhKeVlYa2dmU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0Y3pvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRVp2Y2lCeVlYY2djbTkxZEdWekxDQmtiMjRuZENCamIyNXpkVzFsSUhSb1pTQnlaWEYxWlhOMElHSnZaSGtnNG9DVUlIUm9aU0JvWVc1a2JHVnlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnYm1WbFpITWdhWFFnYVc1MFlXTjBMaUJVYUdVZ1ltOWtlU0IzYVd4c0lHSmxJSEJoYzNObFpDQjJhV0VnZEdobElGSmxjWFZsYzNRZ2IySnFaV04wTGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMGNtbHVaem9nYVhOU1lYZFFZWFJvSUQ4Z1hDSmNJaUE2SUNoaGQyRnBkQ0J5WldGa1FtOWtlVlJsZUhRb0tTa3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0Z5YzJWa09pQjFibVJsWm1sdVpXUXNYRzRnSUNBZ0lDQWdJQ0FnSUNCOUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WeGRXVnpkRG9nYjNCMGFXOXVjeTV5WlhGMVpYTjBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpjRzl1YzJVc1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjNKekxGeHVJQ0FnSUNBZ0lDQjlPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR052Ym5SbGVIUTZJR0Z1ZVNBOUlIc2djbVZxWldOMExDQnlZV2x6WlNCOU8xeHVJQ0FnSUNBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnUTJobFkyc2dhV1lnWlcxcGRDQm9ZWE1nYUdGdVpHeGxjbk1nWW1WbWIzSmxJR0YzWVdsMGFXNW5YRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JvWVhOSWRIUndVbVZ4ZFdWemRFaGhibVJzWlhKeklEMGdjblZ1ZEdsdFpTNWZhR0Z6UlcxcGRFaGhibVJzWlhKelB5NG9YQ0p0YVd4cmFXODZhSFIwY0ZKbGNYVmxjM1JjSWlrZ1B6OGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob1lYTklkSFJ3VW1WeGRXVnpkRWhoYm1Sc1pYSnpLU0JoZDJGcGRDQnlkVzUwYVcxbExtVnRhWFFvWENKdGFXeHJhVzg2YUhSMGNGSmxjWFZsYzNSY0lpd2dleUJsZUdWamRYUmxTV1FzSUd4dloyZGxjaXdnY0dGMGFEb2dhSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3NJR2gwZEhBc0lISmxhbVZqZEN3Z2NtRnBjMlVnZlNrN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklPbWRuaUIwWlhOMElPZU9yK1dpZytTNGkrYUxwdWFJcWlBa1pYaHdiM0owY3lEbGhvWHBnNmpvdDYvbHZvUmNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHZjSFJwYjI1ekxtVnVkazF2WkdVZ0lUMDlJRndpZEdWemRGd2lJQ1ltSUNob2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1WnlrdWFXNWpiSFZrWlhNb1hDSWtYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnY25WdWRHbHRaUzVsYldsMEtGd2liV2xzYTJsdk9taDBkSEJPYjNSR2IzVnVaRndpTENCN0lHVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQndZWFJvT2lCb2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1Wnl3Z2FIUjBjQ3dnY21WcVpXTjBMQ0J5WVdselpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnlaV3BsWTNRb1hDSk9UMVJmUms5VlRrUmNJaXdnZXlCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeUI5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnUFQwOVBUMGdVa0ZYSUZCQlZFZ2dQVDA5UFQxY2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZKaGR5QnliM1YwWlhNZ2NtVmpaV2wyWlNCaElHNWhkR2wyWlNCU1pYRjFaWE4wSUdGdVpDQnlaWFIxY200Z1lTQnVZWFJwZG1VZ1VtVnpjRzl1YzJVdVhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCVWFHVjVJR0o1Y0dGemN5QjBlWEJwWVNCMllXeHBaR0YwYVc5dUxDQktVMDlPSUhObGNtbGhiR2w2WVhScGIyNHNJR0Z1WkNCemRHRnlaMkYwWlM1Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZWelpTQmpZWE5sT2lCVFUwVWdjR0Z6YzNSb2NtOTFaMmdnS0dVdVp5NGdUM0JsYmtGSklIQnliM2g1S1N3Z2QyVmlhRzl2YTNNc0lHSnBibUZ5ZVM1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNocGMxSmhkMUJoZEdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVlYZFNiM1YwWlNBOUlHZGxibVZ5WVhSbFpDNXlZWGRUWTJobGJXRXVjbTkxZEdWelczQmhkR2hUZEhKcGJtZGRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGNtRjNVbTkxZEdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdjblZ1ZEdsdFpTNWxiV2wwS0Z3aWJXbHNhMmx2T21oMGRIQk9iM1JHYjNWdVpGd2lMQ0I3SUdWNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeXdnYUhSMGNDd2djbVZxWldOMExDQnlZV2x6WlNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2djbVZxWldOMEtGd2lUazlVWDBaUFZVNUVYQ0lzSUhzZ2NHRjBhRG9nYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRXhoZW5rdGJHOWhaQ0J0YjJSMWJHVWdiMjRnWm1seWMzUWdZV05qWlhOekxDQjBhR1Z1SUdOaFkyaGxYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdiR1YwSUcxdlpIVnNaVG9nWVc1NUlEMGdjbUYzVW05MWRHVXViVzlrZFd4bE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdiVzlrZFd4bElEMDlQU0JjSW1aMWJtTjBhVzl1WENJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYlc5a2RXeGxJRDBnWVhkaGFYUWdiVzlrZFd4bEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKaGQxSnZkWFJsTG0xdlpIVnNaU0E5SUcxdlpIVnNaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdiV1YwWVNBOUlHMXZaSFZzWlQ4dWJXVjBZU0EvUHlCN2ZUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUVOdmJuTjBjblZqZENCbWRXeHNJR052Ym5SbGVIUWdLSEpoZHlCa2IyVnpiaWQwSUdkdklIUm9jbTkxWjJnZ1gxOWxlR1ZqZFhSbExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJSE52SUhkbElITmxkQ0JoYkd3Z1ptbGxiR1J6SUcxaGJuVmhiR3g1SUdobGNtVXBYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNW9kSFJ3SUQwZ2FIUjBjRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbWhsWVdSbGNuTWdQU0JvZEhSd0xuSmxjWFZsYzNRdWFHVmhaR1Z5Y3p0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1SbGRtVnNiM0FnUFNCeWRXNTBhVzFsTG1SbGRtVnNiM0E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzV3WVhSb0lEMGdjR0YwYUZOMGNtbHVaenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbkp2ZFhSbFZIbHdaU0E5SUZ3aWNtRjNYQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVzYjJkblpYSWdQU0JzYjJkblpYSTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNWxiV2wwSUQwZ2NuVnVkR2x0WlM1bGJXbDBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVaVzFwZEVGdWVVRndjSEp2ZG1Wa0lEMGdjblZ1ZEdsdFpTNWxiV2wwUVc1NVFYQndjbTkyWldRN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1bGJXbDBRV3hzUVhCd2NtOTJaV1FnUFNCeWRXNTBhVzFsTG1WdGFYUkJiR3hCY0hCeWIzWmxaRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbVY0WldOMWRHVkpaQ0E5SUdWNFpXTjFkR1ZKWkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1OdmJtWnBaeUE5SUhKMWJuUnBiV1V1Y25WdWRHbHRaUzVqYjI1bWFXYzdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNTBlWEJwWVNBOUlHZGxibVZ5WVhSbFpDNTBlWEJwWVZOamFHVnRZVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbU5oYkd3Z1BTQW9iVzlrT2lCaGJua3NJSEJoY21GdGN6b2dZVzU1S1NBOVBpQmxlR1ZqZFhSbGNpNWZYMk5oYkd3b1kyOXVkR1Y0ZEN3Z2JXOWtMQ0J3WVhKaGJYTXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXViMjVHYVc1aGJHeDVJRDBnS0doaGJtUnNaWEk2SUdGdWVTa2dQVDRnWm1sdVlXeGxjeTUxYm5Ob2FXWjBLR2hoYm1Sc1pYSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVYeUE5SUhKMWJuUnBiV1U3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkpaaUJoWkdGd2RHVnlJSEJ5WlMxeVpXRmtJSFJvWlNCaWIyUjVJQ2hpYjJSNVZHVjRkQ0J6WlhRcExDQnlaV052Ym5OMGNuVmpkQ0JoWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1VtVnhkV1Z6ZENCM2FYUm9JSFJvWlNCaWIyUjVJSEpsTFdsdWFtVmpkR1ZrSUhOdklIUm9aU0JvWVc1a2JHVnlJR05oYmlCeVpXRmtJR2wwTGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFOTBhR1Z5ZDJselpTd2dkR2hsSUc5eWFXZHBibUZzSUhKbGNYVmxjM1FnWW05a2VTQnBjeUJ6ZEdsc2JDQnBiblJoWTNRZ0tIZGxJSE5yYVhCd1pXUmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJ5WldGa2FXNW5JR2wwSUdGaWIzWmxJR1p2Y2lCeVlYY2djR0YwYUhNcExseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdoaGJtUnNaWEpTWlhGMVpYTjBPaUJTWlhGMVpYTjBJRDBnWW05a2VWUmxlSFFnSVQwOUlIVnVaR1ZtYVc1bFpGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0EvSUc1bGR5QlNaWEYxWlhOMEtHOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1MWNtd3NJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRzFsZEdodlpEb2diM0IwYVc5dWN5NXlaWEYxWlhOMExtMWxkR2h2WkN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdobFlXUmxjbk02SUc5d2RHbHZibk11Y21WeGRXVnpkQzVvWldGa1pYSnpMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZbTlrZVRvZ1ltOWtlVlJsZUhRZ2ZId2diblZzYkN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOcFoyNWhiRG9nYjNCMGFXOXVjeTV5WlhGMVpYTjBMbk5wWjI1aGJDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdPaUJ2Y0hScGIyNXpMbkpsY1hWbGMzUTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhSek9pQlNaWE4xYkhSelBHRnVlVDRnUFNCN0lIWmhiSFZsT2lCMWJtUmxabWx1WldRZ2ZUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeWRXNTBhVzFsTGw5b1lYTkZiV2wwU0dGdVpHeGxjbk0vTGloY0ltMXBiR3RwYnpwbGVHVmpkWFJsUW1WbWIzSmxYQ0lwSUQ4L0lIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbVY0WldOMWRHVkNaV1p2Y21WY0lpd2dleUJsZUdWamRYUmxTV1FzSUd4dloyZGxjaXdnY0dGMGFEb2djR0YwYUZOMGNtbHVaeXdnYldWMFlTd2dZMjl1ZEdWNGRDd2djbVZxWldOMExDQnlZV2x6WlNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlZWGRTWlhOd2IyNXpaVG9nVW1WemNHOXVjMlVnUFNCaGQyRnBkQ0J0YjJSMWJHVXVhR0Z1Wkd4bGNpaGpiMjUwWlhoMExDQm9ZVzVrYkdWeVVtVnhkV1Z6ZENrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwY3k1MllXeDFaU0E5SUhKaGQxSmxjM0J2Ym5ObE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hKMWJuUnBiV1V1WDJoaGMwVnRhWFJJWVc1a2JHVnljejh1S0Z3aWJXbHNhMmx2T21WNFpXTjFkR1ZCWm5SbGNsd2lLU0EvUHlCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRjNZV2wwSUhKMWJuUnBiV1V1WlcxcGRDaGNJbTFwYkd0cGJ6cGxlR1ZqZFhSbFFXWjBaWEpjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2NHRjBhRk4wY21sdVp5d2diV1YwWVN3Z1kyOXVkR1Y0ZEN3Z2NtVnpkV3gwY3l3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJCY0hCc2VTQkRUMUpUSUdobFlXUmxjbk1nZEc4Z2RHaGxJSEpoZHlCeVpYTndiMjV6WlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1pwYm1Gc1NHVmhaR1Z5Y3lBOUlHNWxkeUJJWldGa1pYSnpLSEpoZDFKbGMzQnZibk5sTG1obFlXUmxjbk1wTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ1cyc3NJSFpkSUc5bUlFOWlhbVZqZEM1bGJuUnlhV1Z6S0dOdmNuTklaV0ZrWlhKektTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JV1pwYm1Gc1NHVmhaR1Z5Y3k1b1lYTW9heWtwSUdacGJtRnNTR1ZoWkdWeWN5NXpaWFFvYXl3Z2RpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdhR0Z6U0hSMGNGSmxjM0J2Ym5ObFNHRnVaR3hsY25NZ1BTQnlkVzUwYVcxbExsOW9ZWE5GYldsMFNHRnVaR3hsY25NL0xpaGNJbTFwYkd0cGJ6cG9kSFJ3VW1WemNHOXVjMlZjSWlrZ1B6OGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9hR0Z6U0hSMGNGSmxjM0J2Ym5ObFNHRnVaR3hsY25NcElHRjNZV2wwSUhKMWJuUnBiV1V1WlcxcGRDaGNJbTFwYkd0cGJ6cG9kSFJ3VW1WemNHOXVjMlZjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lHaDBkSEFzSUdobFlXUmxjbk02SUdoMGRIQXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxDQmpiMjUwWlhoMExDQnpkV05qWlhOek9pQjBjblZsTENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdVblZ1SUc5dVJtbHVZV3hzZVNCb1lXNWtiR1Z5Y3lBb1lXWjBaWElnYUhSMGNGSmxjM0J2Ym5ObExDQnRZWFJqYUdsdVp5QmhZM1JwYjI0Z2NHRjBhQ0J2Y21SbGNtbHVaeWxjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1ptbHVZV3hsY3k1c1pXNW5kR2dnUGlBd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2FHRnVaR3hsY2lCdlppQm1hVzVoYkdWektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBjbmtnZXlCaGQyRnBkQ0JvWVc1a2JHVnlLQ2s3SUgwZ1kyRjBZMmdnS0dWeWNtOXlLU0I3SUd4dloyZGxjaTVsY25KdmNpaGNJa0Z1SUdWeWNtOXlJRzlqWTNWeWNtVmtJR2x1YzJsa1pTQnZia1pwYm1Gc2JIa3VYQ0lzSUdWeWNtOXlLVHNnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHaGhjMDl1VEc5bloyVnlVM1ZpYldsMGRHbHVaeWtnWVhkaGFYUWdiRzluWjJWeUxsOHVjM1ZpYldsMEtHTnZiblJsZUhRZ1lYTWdZVzU1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9ZVzU1UlcxcGRFaGhibVJzWlhKektTQnlkVzUwYVcxbExuSjFiblJwYldVdWNtVnhkV1Z6ZEM1a1pXeGxkR1VvWlhobFkzVjBaVWxrS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCdVpYY2dVbVZ6Y0c5dWMyVW9jbUYzVW1WemNHOXVjMlV1WW05a2VTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRHRjBkWE02SUhKaGQxSmxjM0J2Ym5ObExuTjBZWFIxY3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1JoZEhWelZHVjRkRG9nY21GM1VtVnpjRzl1YzJVdWMzUmhkSFZ6VkdWNGRDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYUdWaFpHVnljem9nWm1sdVlXeElaV0ZrWlhKekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JVzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxtZGxkQ2hjSWtGalkyVndkRndpS1Q4dWMzUmhjblJ6VjJsMGFDaGNJblJsZUhRdlpYWmxiblF0YzNSeVpXRnRYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdZV04wYVc5dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJSEp2ZFhSbFUyTm9aVzFoSUQwZ2IzQjBhVzl1Y3k1eWIzVjBaVk5qYUdWdFlUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVhKdmRYUmxVMk5vWlcxaEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFaHZkQ0J3WVhSb09pQmphR1ZqYXlCemFXNW5iR1V0Wlc1MGNua2dZMkZqYUdVZ1ptbHljM1JjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEJoZEdoVGRISnBibWNnUFQwOUlHTmhZMmhsWkZCaGRHaFRkSEpwYm1jZ0ppWWdZMkZqYUdWa1VtOTFkR1ZUWTJobGJXRXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZFhSbFUyTm9aVzFoSUQwZ1kyRmphR1ZrVW05MWRHVlRZMmhsYldFN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvS0doMGRIQXVjR0YwYUM1emRISnBibWNnWVhNZ2MzUnlhVzVuS1M1cGJtTnNkV1JsY3loY0lpUmNJaWtwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKdmRYUmxVMk5vWlcxaElEMGdkSEpwWlM1blpYUW9hSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hKdmRYUmxVMk5vWlcxaElEMDlQU0J1ZFd4c0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFZ1BTQm5aVzVsY21GMFpXUXVjbTkxZEdWVFkyaGxiV0UvTGx0b2RIUndMbkJoZEdndWMzUnlhVzVuWFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ1BUMDlJSFZ1WkdWbWFXNWxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQnlkVzUwYVcxbExtVnRhWFFvWENKdGFXeHJhVzg2YUhSMGNFNXZkRVp2ZFc1a1hDSXNJSHNnWlhobFkzVjBaVWxrTENCc2IyZG5aWElzSUhCaGRHZzZJR2gwZEhBdWNHRjBhQzV6ZEhKcGJtY2dZWE1nYzNSeWFXNW5MQ0JvZEhSd0xDQnlaV3BsWTNRc0lISmhhWE5sSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pPVDFSZlJrOVZUa1JjSWl3Z2V5QndZWFJvT2lCb2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1WnlCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQnliM1YwWlZOamFHVnRZUzV0YjJSMWJHVWdJVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpa2djbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISnBaUzVoWkdRb2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lISnZkWFJsVTJOb1pXMWhLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKdmRYUmxVMk5vWlcxaElEMGdkSEpwWlM1blpYUW9hSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hKdmRYUmxVMk5vWlcxaElEMDlQU0J1ZFd4c0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFZ1BTQm5aVzVsY21GMFpXUXVjbTkxZEdWVFkyaGxiV0UvTGx0b2RIUndMbkJoZEdndWMzUnlhVzVuWFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ1BUMDlJSFZ1WkdWbWFXNWxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQnlkVzUwYVcxbExtVnRhWFFvWENKdGFXeHJhVzg2YUhSMGNFNXZkRVp2ZFc1a1hDSXNJSHNnWlhobFkzVjBaVWxrTENCc2IyZG5aWElzSUhCaGRHZzZJR2gwZEhBdWNHRjBhQzV6ZEhKcGJtY2dZWE1nYzNSeWFXNW5MQ0JvZEhSd0xDQnlaV3BsWTNRc0lISmhhWE5sSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pPVDFSZlJrOVZUa1JjSWl3Z2V5QndZWFJvT2lCb2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1WnlCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQnliM1YwWlZOamFHVnRZUzV0YjJSMWJHVWdJVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpa2djbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISnBaUzVoWkdRb2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lISnZkWFJsVTJOb1pXMWhLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUZWd1pHRjBaU0JvYjNRZ2NHRjBhQ0JqWVdOb1pWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyRmphR1ZrVW05MWRHVlRZMmhsYldFZ1BTQnliM1YwWlZOamFHVnRZVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR05oWTJobFpGQmhkR2hUZEhKcGJtY2dQU0J3WVhSb1UzUnlhVzVuTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEp2ZFhSbFUyTm9aVzFoTG5SNWNHVWdJVDA5SUZ3aVlXTjBhVzl1WENJcElIUm9jbTkzSUhKbGFtVmpkQ2hjSWxWT1FVTkRSVkJVUVVKTVJWd2lMQ0I3SUdWNGNHVmpkR1ZrT2lCY0luTjBjbVZoYlZ3aUxDQnRaWE56WVdkbE9pQmdUbTkwSUdGalkyVndkR0ZpYkdVc0lIUm9aU0JCWTJObGNIUWdhVzRnZEdobElISmxjWFZsYzNRZ2FHVmhaR1Z5SUhOb2IzVnNaQ0JpWlNCY0luUmxlSFF2WlhabGJuUXRjM1J5WldGdFhDSXVJRWxtSUhsdmRTQmhjbVVnZFhOcGJtY2dkR2hsSUZ3aVFHMXBiR3RwYnk5emRHRnlaMkYwWlZ3aUlIQmhZMnRoWjJVc0lIQnNaV0Z6WlNCaFpHUWdYRnhnZEhsd1pUb2dYQ0p6ZEhKbFlXMWNJbHhjWUNCMGJ5QjBhR1VnWlhobFkzVjBaU0J2Y0hScGIyNXpMbUFnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNW9kSFJ3SUQwZ2FIUjBjRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbWhsWVdSbGNuTWdQU0JvZEhSd0xuSmxjWFZsYzNRdWFHVmhaR1Z5Y3p0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG5KdmRYUmxWSGx3WlNBOUlGd2lZV04wYVc5dVhDSTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmxlR1ZqZFhSbFpDQTlJR0YzWVdsMElHVjRaV04xZEdWeUxsOWZaWGhsWTNWMFpTaHliM1YwWlZOamFHVnRZU3dnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpjbVZoZEdWa1JYaGxZM1YwWlVsa09pQmxlR1ZqZFhSbFNXUXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOeVpXRjBaV1JNYjJkblpYSTZJR3h2WjJkbGNpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFEb2dhSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdobFlXUmxjbk02SUc5d2RHbHZibk11Y21WeGRXVnpkQzVvWldGa1pYSnpJR0Z6SUVobFlXUmxjbk1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJoY21GdGN6b2dhSFIwY0M1d1lYSmhiWE11YzNSeWFXNW5MRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE5VZVhCbE9pQmNJbk4wY21sdVoxd2lMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE5EYjI1MFpXNTBWSGx3WlRvZ1hDSnFjMjl1WENJc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabWx1WVd4bGN5QTlJR1Y0WldOMWRHVmtMbVpwYm1Gc1pYTTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NtVnpjRzl1YzJVdVltOWtlU0E5UFQwZ1hDSmNJaUFtSmlCbGVHVmpkWFJsWkM1eVpYTjFiSFJ6TG5aaGJIVmxJQ0U5UFNCMWJtUmxabWx1WldRcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHVjRaV04xZEdWa0xtVnRjSFI1VW1WemRXeDBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhOd2IyNXpaUzVpYjJSNUlEMGdZSHRjSW1SaGRHRmNJanA3ZlN4Y0ltVjRaV04xZEdWSlpGd2lPbHdpSkh0bGVHVmpkWFJsU1dSOVhDSXNYQ0p6ZFdOalpYTnpYQ0k2ZEhKMVpYMWdPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemNHOXVjMlV1WW05a2VTQTlJR0I3WENKa1lYUmhYQ0k2Skh0S1UwOU9Mbk4wY21sdVoybG1lU2hsZUdWamRYUmxaQzV5WlhOMWJIUnpMblpoYkhWbEtYMHNYQ0psZUdWamRYUmxTV1JjSWpwY0lpUjdaWGhsWTNWMFpVbGtmVndpTEZ3aWMzVmpZMlZ6YzF3aU9uUnlkV1Y5WUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2hoYzBoMGRIQlNaWE53YjI1elpVaGhibVJzWlhKeklEMGdjblZ1ZEdsdFpTNWZhR0Z6UlcxcGRFaGhibVJzWlhKelB5NG9YQ0p0YVd4cmFXODZhSFIwY0ZKbGMzQnZibk5sWENJcElEOC9JSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR2hoYzBoMGRIQlNaWE53YjI1elpVaGhibVJzWlhKektTQmhkMkZwZENCeWRXNTBhVzFsTG1WdGFYUW9YQ0p0YVd4cmFXODZhSFIwY0ZKbGMzQnZibk5sWENJc0lIc2daWGhsWTNWMFpVbGtMQ0JzYjJkblpYSXNJSEJoZEdnNklHaDBkSEF1Y0dGMGFDNXpkSEpwYm1jZ1lYTWdjM1J5YVc1bkxDQm9kSFJ3TENCb1pXRmtaWEp6T2lCb2RIUndMbkpsY1hWbGMzUXVhR1ZoWkdWeWN5d2dZMjl1ZEdWNGREb2daWGhsWTNWMFpXUXVZMjl1ZEdWNGRDd2djM1ZqWTJWemN6b2dkSEoxWlN3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2htYVc1aGJHVnpMbXhsYm1kMGFDQStJREFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JvWVc1a2JHVnlJRzltSUdacGJtRnNaWE1wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdhR0Z1Wkd4bGNpZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JqWVhSamFDQW9aWEp5YjNJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JzYjJkblpYSXVaWEp5YjNJb1hDSkJiaUJsY25KdmNpQnZZMk4xY25KbFpDQnBibk5wWkdVZ2IyNUdhVzVoYkd4NUxsd2lMQ0JsY25KdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYUdGelQyNU1iMmRuWlhKVGRXSnRhWFIwYVc1bktTQmhkMkZwZENCc2IyZG5aWEl1WHk1emRXSnRhWFFvWTI5dWRHVjRkQ0JoY3lCaGJua3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoaGJubEZiV2wwU0dGdVpHeGxjbk1wSUhKMWJuUnBiV1V1Y25WdWRHbHRaUzV5WlhGMVpYTjBMbVJsYkdWMFpTaGxlR1ZqZFhSbFNXUXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmNIUnBiMjV6TG5KaGQxSmxjM0J2Ym5ObEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUI3SUY5ZmNtRjNVbVZ6Y0c5dWMyVTZJSFJ5ZFdVc0lHSnZaSGs2SUhKbGMzQnZibk5sTG1KdlpIa3NJSE4wWVhSMWN6b2djbVZ6Y0c5dWMyVXVjM1JoZEhWekxDQm9aV0ZrWlhKek9pQnlaWE53YjI1elpTNW9aV0ZrWlhKeklIMGdZWE1nWVc1NU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRkpsYzNCdmJuTmxLSEpsYzNCdmJuTmxMbUp2WkhrZ1lYTWdRbTlrZVVsdWFYUWdmQ0J1ZFd4c0xDQnlaWE53YjI1elpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklITjBjbVZoYlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUd4bGRDQnliM1YwWlZOamFHVnRZU0E5SUc5d2RHbHZibk11Y205MWRHVlRZMmhsYldFN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLQ0Z5YjNWMFpWTmphR1Z0WVNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNWMFpWTmphR1Z0WVNBOUlIUnlhV1V1WjJWMEtHaDBkSEF1Y0dGMGFDNXpkSEpwYm1jZ1lYTWdjM1J5YVc1bktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaG9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5a3VhVzVqYkhWa1pYTW9YQ0lrWENJcElIeDhJQ0VvYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNwTG1WdVpITlhhWFJvS0Z3aWZsd2lLU0I4ZkNCeWIzVjBaVk5qYUdWdFlTQTlQVDBnYm5Wc2JDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkxZEdWVFkyaGxiV0VnUFNCblpXNWxjbUYwWldRdWNtOTFkR1ZUWTJobGJXRS9MbHRvZEhSd0xuQmhkR2d1YzNSeWFXNW5YVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeWIzVjBaVk5qYUdWdFlTQTlQVDBnZFc1a1pXWnBibVZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbWgwZEhCT2IzUkdiM1Z1WkZ3aUxDQjdJR1Y0WldOMWRHVkpaQ3dnYkc5bloyVnlMQ0J3WVhSb09pQm9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5d2dhSFIwY0N3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCeVpXcGxZM1FvWENKT1QxUmZSazlWVGtSY0lpd2dleUJ3WVhSb09pQm9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5QjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnY205MWRHVlRZMmhsYldFdWJXOWtkV3hsSUNFOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlNBOUlHRjNZV2wwSUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwY21sbExtRmtaQ2hvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeXdnY205MWRHVlRZMmhsYldFcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5YjNWMFpWTmphR1Z0WVM1MGVYQmxJQ0U5UFNCY0luTjBjbVZoYlZ3aUtTQjBhSEp2ZHlCeVpXcGxZM1FvWENKVlRrRkRRMFZRVkVGQ1RFVmNJaXdnZXlCbGVIQmxZM1JsWkRvZ1hDSnpkSEpsWVcxY0lpd2diV1Z6YzJGblpUb2dZRTV2ZENCaFkyTmxjSFJoWW14bExDQjBhR1VnUVdOalpYQjBJR2x1SUhSb1pTQnlaWEYxWlhOMElHaGxZV1JsY2lCemFHOTFiR1FnWW1VZ1hDSmhjSEJzYVdOaGRHbHZiaTlxYzI5dVhDSXVJRWxtSUhsdmRTQmhjbVVnZFhOcGJtY2dkR2hsSUZ3aVFHMXBiR3RwYnk5emRHRnlaMkYwWlZ3aUlIQmhZMnRoWjJVc0lIQnNaV0Z6WlNCeVpXMXZkbVVnWEZ4Z2RIbHdaVG9nWENKemRISmxZVzFjSWx4Y1lDQjBieUIwYUdVZ1pYaGxZM1YwWlNCdmNIUnBiMjV6TG1BZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElITjBjbVZoYlVOc2IzTmxaQ0E5SUdaaGJITmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHaGhibVJzWlVOc2IzTmxJRDBnWVhONWJtTWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2MzUnlaV0Z0UTJ4dmMyVmtLU0J5WlhSMWNtNDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMGNtVmhiVU5zYjNObFpDQTlJSFJ5ZFdVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnYUdGdVpHeGxjaUJ2WmlCbWFXNWhiR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGNua2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJR2hoYm1Sc1pYSW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dLR1Z5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkc5bloyVnlMbVZ5Y205eUtGd2lRVzRnWlhKeWIzSWdiMk5qZFhKeVpXUWdhVzV6YVdSbElHOXVSbWx1WVd4c2VTNWNJaXdnWlhKeWIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob1lYTlBia3h2WjJkbGNsTjFZbTFwZEhScGJtY3BJR0YzWVdsMElHeHZaMmRsY2k1ZkxuTjFZbTFwZENoamIyNTBaWGgwSUdGeklHRnVlU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hoYm5sRmJXbDBTR0Z1Wkd4bGNuTXBJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNXlaWEYxWlhOMExtUmxiR1YwWlNobGVHVmpkWFJsU1dRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMDdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbWgwZEhBZ1BTQm9kSFJ3TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1YUdWaFpHVnljeUE5SUdoMGRIQXVjbVZ4ZFdWemRDNW9aV0ZrWlhKek8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdWNtOTFkR1ZVZVhCbElEMGdYQ0p6ZEhKbFlXMWNJanRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1Y0WldOMWRHVmtJRDBnWVhkaGFYUWdaWGhsWTNWMFpYSXVYMTlsZUdWamRYUmxLSEp2ZFhSbFUyTm9aVzFoTENCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR055WldGMFpXUkZlR1ZqZFhSbFNXUTZJR1Y0WldOMWRHVkpaQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kzSmxZWFJsWkV4dloyZGxjam9nYkc5bloyVnlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3pvZ2IzQjBhVzl1Y3k1eVpYRjFaWE4wTG1obFlXUmxjbk1nWVhNZ1NHVmhaR1Z5Y3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpPaUJvZEhSd0xuQmhjbUZ0Y3k1emRISnBibWNzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzFSNWNHVTZJRndpYzNSeWFXNW5YQ0lzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1ptbHVZV3hsY3lBOUlHVjRaV04xZEdWa0xtWnBibUZzWlhNN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdVM1J5WldGdElIQmhkR2c2SUdOeVpXRjBaU0J1WlhjZ2FHVmhaR1Z5Y3lCdlltcGxZM1FnZEc4Z1lYWnZhV1FnY0c5c2JIVjBhVzVuSUhOb1lYSmxaQ0JrWldaaGRXeDBUV1Z5WjJWa1NHVmhaR1Z5YzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGMzQnZibk5sTG1obFlXUmxjbk1nUFNCN0lDNHVMbkpsYzNCdmJuTmxMbWhsWVdSbGNuTXNJQzR1TG1KMWFXeGtRMjl5YzBobFlXUmxjbk1vYUhSMGNDNWpiM0p6TENCdmNtbG5hVzRwSUgwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdRSFJ6TFdsbmJtOXlaVG9nWW5WdVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJSE4wY21WaGJUb2dVbVZoWkdGaWJHVlRkSEpsWVcwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdRSFJ6TFdsbmJtOXlaVG9nWW5WdVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJR052Ym5SeWIydzZJRkpsWVdSaFlteGxVM1J5WldGdFJHbHlaV04wUTI5dWRISnZiR3hsY2lCOElGSmxZV1JoWW14bFUzUnlaV0Z0UkdWbVlYVnNkRU52Ym5SeWIyeHNaWEk3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkFkSE10YVdkdWIzSmxPaUJpZFc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlFSjFiaUFoUFQwZ1hDSjFibVJsWm1sdVpXUmNJaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJBZEhNdGFXZHViM0psT2lCaWRXNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzNSeVpXRnRJRDBnYm1WM0lGSmxZV1JoWW14bFUzUnlaV0Z0S0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSNWNHVTZJRndpWkdseVpXTjBYQ0lzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCQWRITXRhV2R1YjNKbE9pQmlkVzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0Z6ZVc1aklIQjFiR3dvWTI5dWRISnZiR3hsY2pvZ1VtVmhaR0ZpYkdWVGRISmxZVzFFYVhKbFkzUkRiMjUwY205c2JHVnlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkSEp2YkNBOUlHTnZiblJ5YjJ4c1pYSTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKNUlIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkSEp2Ykd4bGNpNTNjbWwwWlNoZ1pHRjBZVHBBSkh0S1UwOU9Mbk4wY21sdVoybG1lU2g3SUhOMVkyTmxjM002SUhSeWRXVXNJR1JoZEdFNklIVnVaR1ZtYVc1bFpDd2daWGhsWTNWMFpVbGtJSDBnYzJGMGFYTm1hV1Z6SUUxcGJHdHBiMUpsYzNCdmJuTmxVM1ZqWTJWemN6eGhibmsrS1gxY1hHNWNYRzVnS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlHRjNZV2wwSUNoamIyNXpkQ0IyWVd4MVpTQnZaaUJsZUdWamRYUmxaQzV5WlhOMWJIUnpMblpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1emFXZHVZV3d1WVdKdmNuUmxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmxjM1ZzZERvZ2MzUnlhVzVuSUQwZ1NsTlBUaTV6ZEhKcGJtZHBabmtvVzI1MWJHd3NJSFpoYkhWbFhTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkSEp2Ykd4bGNpNTNjbWwwWlNoZ1pHRjBZVG9rZTNKbGMzVnNkSDFjWEc1Y1hHNWdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaWGhsWTNWMFpXUXVjbVZ6ZFd4MGN5NTJZV3gxWlM1eVpYUjFjbTRvZFc1a1pXWnBibVZrS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQm9ZVzVrYkdWRGJHOXpaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyeHNaWEl1WTJ4dmMyVW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdZMkYwWTJnZ0tHVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1Y0WTJWd2RHbHZiaUE5SUdWNFkyVndkR2x2YmtoaGJtUnNaWElvWlhobFkzVjBaVWxrTENCc2IyZG5aWElzSUdWeWNtOXlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtVnpkV3gwT2lCaGJua2dQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBXMlY0WTJWd2RHbHZiaTVqYjJSbFhTQTlJR1Y0WTJWd2RHbHZiaTV5WldwbFkzUTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ4c1pYSXVkM0pwZEdVb1lHUmhkR0U2Skh0S1UwOU9Mbk4wY21sdVoybG1lU2hiY21WemRXeDBMQ0J1ZFd4c1hTbDlYRnh1WEZ4dVlDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRjNZV2wwSUc1bGR5QlFjbTl0YVhObEtDaHlaWE52YkhabEtTQTlQaUJ6WlhSVWFXMWxiM1YwS0hKbGMyOXNkbVVzSURBcEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQm9ZVzVrYkdWRGJHOXpaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ4c1pYSXVZMnh2YzJVb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhjM2x1WXlCallXNWpaV3dvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2FHRnVaR3hsUTJ4dmMyVW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBjbTlzTG1Oc2IzTmxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR0Z6SUdGdWVTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z2JtOWtaUzVxY3lCdmNpQnZkR2hsY25OY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnUUhSekxXbG5ibTl5WlRvZ1luVnVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMGNtVmhiU0E5SUc1bGR5QlNaV0ZrWVdKc1pWTjBjbVZoYlNoN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkFkSE10YVdkdWIzSmxPaUJpZFc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGemVXNWpJSEIxYkd3b1kyOXVkSEp2Ykd4bGNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMndnUFNCamIyNTBjbTlzYkdWeU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMnhzWlhJdVpXNXhkV1YxWlNoZ1pHRjBZVHBBSkh0S1UwOU9Mbk4wY21sdVoybG1lU2g3SUhOMVkyTmxjM002SUhSeWRXVXNJR1JoZEdFNklIVnVaR1ZtYVc1bFpDd2daWGhsWTNWMFpVbGtJSDBnYzJGMGFYTm1hV1Z6SUUxcGJHdHBiMUpsYzNCdmJuTmxVM1ZqWTJWemN6eGhibmsrS1gxY1hHNWNYRzVnS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlHRjNZV2wwSUNoamIyNXpkQ0IyWVd4MVpTQnZaaUJsZUdWamRYUmxaQzV5WlhOMWJIUnpMblpoYkhWbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1emFXZHVZV3cvTG1GaWIzSjBaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhRNklITjBjbWx1WnlBOUlFcFRUMDR1YzNSeWFXNW5hV1o1S0Z0dWRXeHNMQ0IyWVd4MVpWMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ4c1pYSXVaVzV4ZFdWMVpTaGdaR0YwWVRva2UzSmxjM1ZzZEgxY1hHNWNYRzVnS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWlhobFkzVjBaV1F1Y21WemRXeDBjeTUyWVd4MVpTNXlaWFIxY200b2RXNWtaV1pwYm1Wa0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0JvWVc1a2JHVkRiRzl6WlNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMnhzWlhJdVkyeHZjMlVvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dLR1Z5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdWNFkyVndkR2x2YmlBOUlHVjRZMlZ3ZEdsdmJraGhibVJzWlhJb1pYaGxZM1YwWlVsa0xDQnNiMmRuWlhJc0lHVnljbTl5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdjbVZ6ZFd4ME9pQmhibmtnUFNCN2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwVzJWNFkyVndkR2x2Ymk1amIyUmxYU0E5SUdWNFkyVndkR2x2Ymk1eVpXcGxZM1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyeHNaWEl1Wlc1eGRXVjFaU2hnWkdGMFlUb2tlMHBUVDA0dWMzUnlhVzVuYVdaNUtGdHlaWE4xYkhRc0lHNTFiR3hkS1gxY1hHNWNYRzVnS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdhR0Z1Wkd4bFEyeHZjMlVvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCdVpYY2dVSEp2YldselpTZ29jbVZ6YjJ4MlpTa2dQVDRnYzJWMFZHbHRaVzkxZENoeVpYTnZiSFpsTENBd0tTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRISnZiR3hsY2k1amJHOXpaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGemVXNWpJR05oYm1ObGJDZ3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0JvWVc1a2JHVkRiRzl6WlNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyd3VZMnh2YzJVb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1lYTWdZVzU1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE53YjI1elpTNWliMlI1SUQwZ2MzUnlaV0Z0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklGTjBjbVZoYlNCd1lYUm9PaUJqY21WaGRHVWdibVYzSUdobFlXUmxjbk1nZEc4Z1lYWnZhV1FnY0c5c2JIVjBhVzVuSUhOb1lYSmxaQ0J2WW1wbFkzUmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE53YjI1elpTNW9aV0ZrWlhKeklEMGdleUF1TGk1eVpYTndiMjV6WlM1b1pXRmtaWEp6TENCY0lrTnZiblJsYm5RdFZIbHdaVndpT2lCY0luUmxlSFF2WlhabGJuUXRjM1J5WldGdFhDSXNJRndpUTJGamFHVXRRMjl1ZEhKdmJGd2lPaUJjSW01dkxXTmhZMmhsWENJZ2ZUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElISjFiblJwYldVdVpXMXBkQ2hjSW0xcGJHdHBienBvZEhSd1VtVnpjRzl1YzJWY0lpd2dleUJsZUdWamRYUmxTV1FzSUd4dloyZGxjaXdnY0dGMGFEb2dhSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3NJR2gwZEhBc0lHaGxZV1JsY25NNklHaDBkSEF1Y21WeGRXVnpkQzVvWldGa1pYSnpMQ0JqYjI1MFpYaDBPaUJsZUdWamRYUmxaQzVqYjI1MFpYaDBMQ0J6ZFdOalpYTnpPaUIwY25WbExDQnlaV3BsWTNRc0lISmhhWE5sSUgwcE8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJTWlhOd2IyNXpaU2h5WlhOd2IyNXpaUzVpYjJSNUxDQnlaWE53YjI1elpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lIMGdZMkYwWTJnZ0tHVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhSek9pQlNaWE4xYkhSelBFMXBiR3RwYjFKbGMzQnZibk5sVW1WcVpXTjBQaUE5SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMllXeDFaVG9nWlhoalpYQjBhVzl1U0dGdVpHeGxjaWhsZUdWamRYUmxTV1FzSUd4dloyZGxjaXdnWlhKeWIzSXBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhSekxuWmhiSFZsSUNFOVBTQjFibVJsWm1sdVpXUXBJSEpsYzNCdmJuTmxMbUp2WkhrZ1BTQktVMDlPTG5OMGNtbHVaMmxtZVNoeVpYTjFiSFJ6TG5aaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRVZ5Y205eUlIQmhkR2c2SUdOeVpXRjBaU0J1WlhjZ2FHVmhaR1Z5Y3lCMGJ5QmhkbTlwWkNCd2IyeHNkWFJwYm1jZ2MyaGhjbVZrSUc5aWFtVmpkRnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVnpjRzl1YzJVdWFHVmhaR1Z5Y3lBOUlIc2dMaTR1Y21WemNHOXVjMlV1YUdWaFpHVnljeXdnTGk0dVkyOXljMGhsWVdSbGNuTWdmVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHRjNZV2wwSUhKMWJuUnBiV1V1WlcxcGRDaGNJbTFwYkd0cGJ6cG9kSFJ3VW1WemNHOXVjMlZjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lHaDBkSEFzSUdobFlXUmxjbk02SUdoMGRIQXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxDQmpiMjUwWlhoMExDQnpkV05qWlhOek9pQm1ZV3h6WlN3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SUZKMWJpQnZia1pwYm1Gc2JIa2dhR0Z1Wkd4bGNuTWdaWFpsYmlCdmJpQmxjbkp2Y2lBb2FXMXdiM0owWVc1MElHWnZjaUJ5WVhjZ2NtOTFkR1Z6SUhkb1pYSmxYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QjBhR1VnYUdGdVpHeGxjaUJ0WVhrZ2FHRjJaU0J5WldkcGMzUmxjbVZrSUdOc1pXRnVkWEFnZG1saElHTnZiblJsZUhRdWIyNUdhVzVoYkd4NUlHSmxabTl5WlNCMGFISnZkMmx1WnlsY2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNobWFXNWhiR1Z6TG14bGJtZDBhQ0ErSURBcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR2hoYm1Sc1pYSWdiMllnWm1sdVlXeGxjeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBjbmtnZXlCaGQyRnBkQ0JvWVc1a2JHVnlLQ2s3SUgwZ1kyRjBZMmdnS0dVcElIc2diRzluWjJWeUxtVnljbTl5S0Z3aVFXNGdaWEp5YjNJZ2IyTmpkWEp5WldRZ2FXNXphV1JsSUc5dVJtbHVZV3hzZVM1Y0lpd2daU2s3SUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYUdGelQyNU1iMmRuWlhKVGRXSnRhWFIwYVc1bktTQmhkMkZwZENCc2IyZG5aWEl1WHk1emRXSnRhWFFvWTI5dWRHVjRkQ0JoY3lCaGJua3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR0Z1ZVVWdGFYUklZVzVrYkdWeWN5a2djblZ1ZEdsdFpTNXlkVzUwYVcxbExuSmxjWFZsYzNRdVpHVnNaWFJsS0dWNFpXTjFkR1ZKWkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2IzQjBhVzl1Y3k1eVlYZFNaWE53YjI1elpTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjdJRjlmY21GM1VtVnpjRzl1YzJVNklIUnlkV1VzSUdKdlpIazZJSEpsYzNCdmJuTmxMbUp2Wkhrc0lITjBZWFIxY3pvZ2NtVnpjRzl1YzJVdWMzUmhkSFZ6TENCb1pXRmtaWEp6T2lCeVpYTndiMjV6WlM1b1pXRmtaWEp6SUgwZ1lYTWdZVzU1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlNaWE53YjI1elpTaHlaWE53YjI1elpTNWliMlI1SUdGeklFSnZaSGxKYm1sMElId2diblZzYkN3Z2NtVnpjRzl1YzJVcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZUdGNibHh1SUNBZ0lHTnZibk4wSUhOMGNtVmhiVU5zYjNObGNuTTZJRTFoY0R4emRISnBibWNzSUhzZ1oyVnVaWEpoZEc5eU9pQkJjM2x1WTBkbGJtVnlZWFJ2Y2pzZ2FHRnVaR3hsUTJ4dmMyVTZJR0Z1ZVNCOVBpQTlJRzVsZHlCTllYQW9LVHRjYmlBZ0lDQmpiMjV6ZENCb1lXNWtiR1ZOWlhOellXZGxJRDBnWVhONWJtTWdLRnh1SUNBZ0lDQWdJQ0J3YjNKME9pQjdJSEJ2YzNSTlpYTnpZV2RsS0cxbGMzTmhaMlU2SUdGdWVTazZJSFp2YVdRZ2ZTeGNiaUFnSUNBZ0lDQWdiM0IwYVc5dWN6cGNiaUFnSUNBZ0lDQWdJQ0FnSUh3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHVjRaV04xZEdWSlpEb2djM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhkR2c2SUhOMGNtbHVaenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTS9PaUJTWldOdmNtUThZVzU1TENCaGJuaytPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdSbGNuTS9PaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK08xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmQ0J6ZEhKcGJtY3NYRzRnSUNBZ0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2IzQjBhVzl1Y3lBOVBUMGdYQ0p6ZEhKcGJtZGNJaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0c5d2RHbHZibk1nUFQwOUlGd2lVRWxPUjF3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjRzl5ZEM1d2IzTjBUV1Z6YzJGblpTaGNJbEJQVGtkY0lpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2IzQjBhVzl1Y3k1emRHRnlkSE5YYVhSb0tGd2lRMHhQVTBWZlUxUlNSVUZOT2x3aUtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHVjRaV04xZEdWSlpDQTlJRzl3ZEdsdmJuTXVjM1ZpYzNSeWFXNW5LRndpUTB4UFUwVmZVMVJTUlVGTk9sd2lMbXhsYm1kMGFDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2MzUnlaV0Z0UTJ4dmMyVnlJRDBnYzNSeVpXRnRRMnh2YzJWeWN5NW5aWFFvWlhobFkzVjBaVWxrS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jM1J5WldGdFEyeHZjMlZ5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wY21WaGJVTnNiM05sY2k1blpXNWxjbUYwYjNJdWNtVjBkWEp1S0hWdVpHVm1hVzVsWkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wY21WaGJVTnNiM05sY2k1b1lXNWtiR1ZEYkc5elpTaGNJbk4wY21WaGJWd2lLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTQ3WEc0Z0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2JHVjBJSEp2ZFhSbFUyTm9aVzFoSUQwZ2RISnBaUzVuWlhRb2IzQjBhVzl1Y3k1d1lYUm9LVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tISnZkWFJsVTJOb1pXMWhJRDA5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnliM1YwWlZOamFHVnRZU0E5SUdkbGJtVnlZWFJsWkM1eWIzVjBaVk5qYUdWdFlUOHVXMjl3ZEdsdmJuTXVjR0YwYUYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NtOTFkR1ZUWTJobGJXRWdQVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUhKbGFtVmpkQ2hjSWs1UFZGOUdUMVZPUkZ3aUxDQjdJSEJoZEdnNklHOXdkR2x2Ym5NdWNHRjBhQ0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJQ0U5UFNCY0ltWjFibU4wYVc5dVhDSXBJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaU0E5SUdGM1lXbDBJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHVnNjMlVnY205MWRHVlRZMmhsYldFdWJXOWtkV3hsSUQwZ1lYZGhhWFFnY205MWRHVlRZMmhsYldFdWJXOWtkV3hsS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0IwY21sbExtRmtaQ2h2Y0hScGIyNXpMbkJoZEdnc0lISnZkWFJsVTJOb1pXMWhLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUdobFlXUmxjbk1nUFNCdVpYY2dTR1ZoWkdWeWN5aHZjSFJwYjI1ekxtaGxZV1JsY25NcE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCd1lYSmhiWE1nUFNCdmNIUnBiMjV6TG5CaGNtRnRjeUEvUHlCN2ZUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2JHOW5aMlZ5SUQwZ1kzSmxZWFJsVEc5bloyVnlLSEoxYm5ScGJXVXNJRzl3ZEdsdmJuTXVjR0YwYUN3Z2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRcE8xeHVJQ0FnSUNBZ0lDQnNaWFFnWm1sdVlXeGxjem9nUVhKeVlYazhLQ2tnUFQ0Z2RtOXBaQ0I4SUZCeWIyMXBjMlU4ZG05cFpENCtJRDBnVzEwN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FIUjBjQ0E5SUc1bGR5QlFjbTk0ZVNoY2JpQWdJQ0FnSUNBZ0lDQWdJSHQ5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2RsZERvZ0tIUmhjbWRsZEN3Z2NISnZjR1Z5ZEhrcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEJ5YjNCbGNuUjVJRDA5UFNCY0ltNXZkRVp2ZFc1a1hDSXBJSEpsZEhWeWJpQjBjblZsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjMlYwT2lBb0tTQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUm9jbTkzSUhKbGFtVmpkQ2hjSWxWT1FVTkRSVkJVUVVKTVJWd2lMQ0I3SUdWNGNHVmpkR1ZrT2lCY0ltTnZiblJsZUhRdWFIUjBjRndpTENCdFpYTnpZV2RsT2lCY0lsUm9hWE1nY21WeGRXVnpkQ0IzWVhNZ2FXNTJiMnRsWkNCMGFISnZkV2RvSUhSb1pTQmxlR1ZqZFhSbElHMWxkR2h2WkM0Z1UybHVZMlVnYm04Z1lXTjBkV0ZzSUhKbGNYVmxjM1FnZDJGeklHZGxibVZ5WVhSbFpDd2dkR2hsSUVoVVZGQWdiV1YwYUc5a2N5QjFibVJsY2lCMGFHVWdZMjl1ZEdWNGRDQmpZVzV1YjNRZ1ltVWdZV05qWlhOelpXUXVYQ0lnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTeGNiaUFnSUNBZ0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lDazdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdhR0Z1Wkd4bFEyeHZjMlVnUFNCaGMzbHVZeUFvZEhsd1pUb2dYQ0poWTNScGIyNWNJaUI4SUZ3aWMzUnlaV0Z0WENJcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbElEMDlQU0JjSW5OMGNtVmhiVndpS1NCemRISmxZVzFEYkc5elpYSnpMbVJsYkdWMFpTaHZjSFJwYjI1ekxtVjRaV04xZEdWSlpDazdYRzRnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHaGhibVJzWlhJZ2IyWWdabWx1WVd4bGN5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElHaGhibVJzWlhJb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR05oZEdOb0lDaGxjbkp2Y2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JzYjJkblpYSXVaWEp5YjNJb1hDSkJiaUJsY25KdmNpQnZZMk4xY25KbFpDQnBibk5wWkdVZ2IyNUdhVzVoYkd4NUxsd2lMQ0JsY25KdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdiRzluWjJWeUxsOHVjM1ZpYldsMEtHTnZiblJsZUhRZ1lYTWdZVzU1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNXlaWEYxWlhOMExtUmxiR1YwWlNodmNIUnBiMjV6TG1WNFpXTjFkR1ZKWkNrN1hHNGdJQ0FnSUNBZ0lIMDdYRzVjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZMjl1ZEdWNGRDQTlJSHNnYUhSMGNEb2dhSFIwY0N3Z2FHVmhaR1Z5Y3l3Z2NtOTFkR1ZVZVhCbE9pQnliM1YwWlZOamFHVnRZUzUwZVhCbExDQnlaV3BsWTNRc0lISmhhWE5sSUgwN1hHNWNiaUFnSUNBZ0lDQWdkSEo1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeWIzVjBaVk5qYUdWdFlTNTBlWEJsSUQwOVBTQmNJbUZqZEdsdmJsd2lLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaWGhsWTNWMFpXUWdQU0JoZDJGcGRDQmxlR1ZqZFhSbGNpNWZYMlY0WldOMWRHVW9jbTkxZEdWVFkyaGxiV0VzSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZM0psWVhSbFpFVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOeVpXRjBaV1JNYjJkblpYSTZJR3h2WjJkbGNpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFEb2diM0IwYVc5dWN5NXdZWFJvTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9aV0ZrWlhKekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzFSNWNHVTZJRndpY21GM1hDSXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm1sdVlXeGxjeUE5SUdWNFpXTjFkR1ZrTG1acGJtRnNaWE03WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0JvWVc1a2JHVkRiRzl6WlNoY0ltRmpkR2x2Ymx3aUtUdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNobGVHVmpkWFJsWkM1bGJYQjBlVkpsYzNWc2RDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd2IzSjBMbkJ2YzNSTlpYTnpZV2RsS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRXTmpaWE56T2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR0YwWVRvZ2RXNWtaV1pwYm1Wa0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiM0owTG5CdmMzUk5aWE56WVdkbEtIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkV05qWlhOek9pQjBjblZsTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWkdGMFlUb2daWGhsWTNWMFpXUXVjbVZ6ZFd4MGN5NTJZV3gxWlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEp2ZFhSbFUyTm9aVzFoTG5SNWNHVWdQVDA5SUZ3aWMzUnlaV0Z0WENJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGVHVmpkWFJsWkNBOUlHRjNZV2wwSUdWNFpXTjFkR1Z5TGw5ZlpYaGxZM1YwWlNoeWIzVjBaVk5qYUdWdFlTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamNtVmhkR1ZrUlhobFkzVjBaVWxrT2lCdmNIUnBiMjV6TG1WNFpXTjFkR1ZKWkN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZM0psWVhSbFpFeHZaMmRsY2pvZ2JHOW5aMlZ5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndZWFJvT2lCdmNIUnBiMjV6TG5CaGRHZ3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdobFlXUmxjbk1zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJoY21GdGN5eGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpWSGx3WlRvZ1hDSnlZWGRjSWl4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm1hVzVoYkdWeklEMGdaWGhsWTNWMFpXUXVabWx1WVd4bGN6dGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJ2Y25RdWNHOXpkRTFsYzNOaFoyVW9leUJ6ZFdOalpYTnpPaUIwY25WbExDQmtZWFJoT2lCMWJtUmxabWx1WldRc0lHVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNJR1J2Ym1VNklHWmhiSE5sSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEhKbFlXMURiRzl6WlhKekxuTmxkQ2h2Y0hScGIyNXpMbVY0WldOMWRHVkpaQ3dnZXlCblpXNWxjbUYwYjNJNklHVjRaV04xZEdWa0xuSmxjM1ZzZEhNdWRtRnNkV1VzSUdoaGJtUnNaVU5zYjNObElIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdZWGRoYVhRZ0tHTnZibk4wSUhaaGJIVmxJRzltSUdWNFpXTjFkR1ZrTG5KbGMzVnNkSE11ZG1Gc2RXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUmhkR0VnUFNCN0lITjFZMk5sYzNNNklIUnlkV1VzSUdSaGRHRTZJRnR1ZFd4c0xDQjJZV3gxWlYwc0lHVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNJR1J2Ym1VNklHWmhiSE5sSUgwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd2IzSjBMbkJ2YzNSTlpYTnpZV2RsS0dSaGRHRXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJ2Y25RdWNHOXpkRTFsYzNOaFoyVW9leUJ6ZFdOalpYTnpPaUIwY25WbExDQmtZWFJoT2lCMWJtUmxabWx1WldRc0lHVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNJR1J2Ym1VNklIUnlkV1VnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmpZWFJqYUNBb1pYSnliM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pYaGpaWEIwYVc5dUlEMGdaWGhqWlhCMGFXOXVTR0Z1Wkd4bGNpaHZjSFJwYjI1ekxtVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQmxjbkp2Y2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmxjM1ZzZERvZ1lXNTVJRDBnZTMwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RGdGxlR05sY0hScGIyNHVZMjlrWlYwZ1BTQmxlR05sY0hScGIyNHVjbVZxWldOME8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3YjNKMExuQnZjM1JOWlhOellXZGxLSHNnYzNWalkyVnpjem9nZEhKMVpTd2daR0YwWVRvZ1czSmxjM1ZzZEN3Z2JuVnNiRjBzSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc0lHUnZibVU2SUhSeWRXVWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJR2hoYm1Sc1pVTnNiM05sS0Z3aWMzUnlaV0Z0WENJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOUlHTmhkR05vSUNobGNuSnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtVnpkV3gwSUQwZ1pYaGpaWEIwYVc5dVNHRnVaR3hsY2lodmNIUnBiMjV6TG1WNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCbGNuSnZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCc2IyZG5aWEl1WHk1emRXSnRhWFFvWTI5dWRHVjRkQ0JoY3lCaGJua3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NHOXlkQzV3YjNOMFRXVnpjMkZuWlNoN0lITjFZMk5sYzNNNklHWmhiSE5sTENCa1lYUmhPaUIxYm1SbFptbHVaV1FzSUdWeWNtOXlPaUJ5WlhOMWJIUXNJR1Y0WldOMWRHVkpaRG9nYjNCMGFXOXVjeTVsZUdWamRYUmxTV1FzSUdSdmJtVTZJSFJ5ZFdVZ2ZTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdjbVYwZFhKdUlIdGNiaUFnSUNBZ0lDQWdjRzl5ZEN4Y2JpQWdJQ0FnSUNBZ1ptVjBZMmdzWEc0Z0lDQWdJQ0FnSUdoaGJtUnNaVTFsYzNOaFoyVXNYRzRnSUNBZ2ZUdGNibjFjYmlJc0NpQWdJQ0FpYVcxd2IzSjBJSFI1Y0dVZ2V5Qk5hV3hyYVc5U1pYTndiMjV6WlZKbGFtVmpkQ3dnVEc5bloyVnlJSDBnWm5KdmJTQmNJaTR1TDJsdVpHVjRMblJ6WENJN1hHNWNibVY0Y0c5eWRDQnBiblJsY21aaFkyVWdKSEpsYW1WamRFTnZaR1VnZTF4dUlDQWdJRkpGVVZWRlUxUmZSa0ZKVERvZ1lXNTVPMXh1SUNBZ0lFNVBWRjlFUlZaRlRFOVFYMDFQUkVVNklITjBjbWx1Wnp0Y2JpQWdJQ0JTUlZGVlJWTlVYMVJKVFVWUFZWUTZJSHNnZEdsdFpXOTFkRG9nYm5WdFltVnlPeUJ0WlhOellXZGxPaUJ6ZEhKcGJtY2dmVHRjYmlBZ0lDQk9UMVJmUms5VlRrUTZJSHNnY0dGMGFEb2djM1J5YVc1bklIMDdYRzRnSUNBZ1VFRlNRVTFUWDFSWlVFVmZTVTVEVDFKU1JVTlVPaUI3SUhCaGRHZzZJSE4wY21sdVp6c2daWGh3WldOMFpXUTZJSE4wY21sdVp6c2dkbUZzZFdVNklHRnVlVHNnYldWemMyRm5aVG9nYzNSeWFXNW5JSDBnZkNCdWRXeHNPMXh1SUNBZ0lGSkZVMVZNVkZOZlZGbFFSVjlKVGtOUFVsSkZRMVE2SUhzZ2NHRjBhRG9nYzNSeWFXNW5PeUJsZUhCbFkzUmxaRG9nYzNSeWFXNW5PeUIyWVd4MVpUb2dZVzU1T3lCdFpYTnpZV2RsT2lCemRISnBibWNnZlNCOElHNTFiR3c3WEc0Z0lDQWdWVTVCUTBORlVGUkJRa3hGT2lCN0lHVjRjR1ZqZEdWa09pQnpkSEpwYm1jN0lHMWxjM05oWjJVNklITjBjbWx1WnlCOU8xeHVJQ0FnSUZCQlVrRk5VMTlVV1ZCRlgwNVBWRjlUVlZCUVQxSlVSVVE2SUhzZ1pYaHdaV04wWldRNklITjBjbWx1WnpzZ1kyOXVkR1Z1ZEZSNWNHVTZJSE4wY21sdVp5QjhJRzUxYkd3N0lIQmhjbUZ0Y3pvZ2MzUnlhVzVuSUgwN1hHNGdJQ0FnVWtWVFZVeFVVMTlVV1ZCRlgwNVBWRjlUVlZCUVQxSlVSVVE2SUhzZ1pYaHdaV04wWldRNklITjBjbWx1WnlCOU8xeHVJQ0FnSUVsT1ZFVlNUa0ZNWDFORlVsWkZVbDlGVWxKUFVqb2dkVzVrWldacGJtVmtPMXh1SUNBZ0lFMUZWRWhQUkY5T1QxUmZRVXhNVDFkRlJEb2dkVzVrWldacGJtVmtPMXh1SUNBZ0lFNUZWRmRQVWt0ZlJWSlNUMUk2SUhWdVpHVm1hVzVsWkR0Y2JuMWNibHh1THk4Z2NtVnFaV04wT2lEbWk1TG51NTNub0lIbHZhTGx2SS92dkl6bnJLemt1SURrdUtybGo0TG1sYkRsdjRYcG9idm1tSy9sclpmbnJLYmt1TEx2dklqbWk1TG51NTNub0lIdnZJbnZ2SXpuckt6a3Vvemt1S3JsajRMbWxiRG1tSy9saGJma3ZaUG5tb1RwbEpub3I2L21sYkRtamE1Y2JpOHZJT2F6cU9hRWorKzhtdWFoaHVhZXR1V0doZW1EcU9lYWhDQnlaV3BsWTNRZzVMMi81NVNvNWE2OTVwMis1N0c3NVo2TDc3eU01NVNvNW9pMzVMNm5JR052Ym5SbGVIUXVjbVZxWldOMElPZWFoT1M0cGVhZ3ZPZXh1K1dlaStlVXNTQmtaV05zWVhKbGN5NTBjeURrdUszbm1vUWdUV2xzYTJsdlVtVnFaV04wUm5WdVkzUnBiMjRnNW8rUTVMNmJYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdjbVZxWldOMEtHTnZaR1U2SUhOMGNtbHVaeXdnWkdGMFlUODZJR0Z1ZVNrNklFMXBiR3RwYjFKbGFtVmpkRVZ5Y205eVBHRnVlU3dnWVc1NVBpQjdYRzRnSUNBZ1kyOXVjM1FnWlhKeWIzSWdQU0I3SUNSdGFXeHJhVzlTWldwbFkzUTZJSFJ5ZFdVc0lHTnZaR1VzSUdSaGRHRWdmU0JoY3lCTmFXeHJhVzlTWldwbFkzUkZjbkp2Y2p4aGJua3NJR0Z1ZVQ0N1hHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCRmNuSnZjaTVqWVhCMGRYSmxVM1JoWTJ0VWNtRmpaU0E5UFQwZ1hDSm1kVzVqZEdsdmJsd2lLU0JGY25KdmNpNWpZWEIwZFhKbFUzUmhZMnRVY21GalpTaGxjbkp2Y2lrN1hHNGdJQ0FnY21WMGRYSnVJR1Z5Y205eU8xeHVmVnh1WEc0dkx5QnlZV2x6WlRvZzVhKzU2TEdoNWIyaTVieVA3N3lNNUx5ZzVZV2w1TGlBNUxpcUlIc2c1b3VTNTd1ZDU2Q0JPaURwbEpub3I2L21sYkRtamE0Z2ZTRGxyN25vc2FIdnZJemxzSWJwbEpub3I2L2xrSkhrdUlybWlwdmxoN3J2dklqbnNidmt2THdnWjI5c1lXNW5JT2VhaE9hWXZ1VzhqK21VbWVpdnIrV2toT2VRaHUrOGlWeHVMeThnNXJPbzVvU1A3N3lhNXFHRzVwNjI1WWFGNllPbzU1cUVJSEpoYVhObElPUzl2K2VVcU9XdXZlYWR2dWV4dStXZWkrKzhqT2VVcU9hSXQrUytweUJqYjI1MFpYaDBMbkpoYVhObElPZWFoT1M0cGVhZ3ZPZXh1K1dlaStlVXNTQmtaV05zWVhKbGN5NTBjeURrdUszbm1vUWdUV2xzYTJsdlVtRnBjMlZHZFc1amRHbHZiaURtajVEa3ZwdGNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQnlZV2x6WlNodlltbzZJRkpsWTI5eVpEeHpkSEpwYm1jc0lHRnVlVDRwT2lCTmFXeHJhVzlTWldwbFkzUkZjbkp2Y2p4aGJua3NJR0Z1ZVQ0Z2UxeHVJQ0FnSUdOdmJuTjBJR3RsZVhNZ1BTQlBZbXBsWTNRdWEyVjVjeWh2WW1vcE8xeHVJQ0FnSUdOdmJuTjBJR052WkdVZ1BTQnJaWGx6V3pCZE8xeHVJQ0FnSUdsbUlDaGpiMlJsSUQwOVBTQjFibVJsWm1sdVpXUXBJSFJvY205M0lHNWxkeUJGY25KdmNpaGNJbkpoYVhObEtDa2djbVZ4ZFdseVpYTWdZVzRnYjJKcVpXTjBJSGRwZEdnZ1lYUWdiR1ZoYzNRZ2IyNWxJR3RsZVNCaGN5QjBhR1VnY21WcVpXTjBhVzl1SUdOdlpHVmNJaWs3WEc0Z0lDQWdZMjl1YzNRZ2NtVnFaV04wUkdGMFlTQTlJRzlpYWx0amIyUmxYVHRjYmlBZ0lDQmpiMjV6ZENCbGNuSnZjaUE5SUhzZ0pHMXBiR3RwYjFKbGFtVmpkRG9nZEhKMVpTd2dZMjlrWlN3Z1pHRjBZVG9nY21WcVpXTjBSR0YwWVNCOUlHRnpJRTFwYkd0cGIxSmxhbVZqZEVWeWNtOXlQR0Z1ZVN3Z1lXNTVQanRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JRVZ5Y205eUxtTmhjSFIxY21WVGRHRmphMVJ5WVdObElEMDlQU0JjSW1aMWJtTjBhVzl1WENJcElFVnljbTl5TG1OaGNIUjFjbVZUZEdGamExUnlZV05sS0dWeWNtOXlLVHRjYmlBZ0lDQnlaWFIxY200Z1pYSnliM0k3WEc1OVhHNWNibVY0Y0c5eWRDQjBlWEJsSUUxcGJHdHBiMUpsYW1WamRFVnljbTl5UEVOdlpHVWdaWGgwWlc1a2N5QnJaWGx2WmlBa2NtVnFaV04wUTI5a1pTQTlJR3RsZVc5bUlDUnlaV3BsWTNSRGIyUmxMQ0JTWldwbFkzUkVZWFJoSUdWNGRHVnVaSE1nSkhKbGFtVmpkRU52WkdWYlEyOWtaVjBnUFNBa2NtVnFaV04wUTI5a1pWdERiMlJsWFQ0Z1BTQjdJR052WkdVNklFTnZaR1U3SUdSaGRHRTZJRkpsYW1WamRFUmhkR0U3SUhOMFlXTnJPaUJ6ZEhKcGJtYzdJQ1J0YVd4cmFXOVNaV3BsWTNRNklIUnlkV1VnZlR0Y2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHVjRZMlZ3ZEdsdmJraGhibVJzWlhJb1pYaGxZM1YwWlVsa09pQnpkSEpwYm1jc0lHeHZaMmRsY2pvZ1RHOW5aMlZ5TENCbGNuSnZjam9nVFdsc2EybHZVbVZxWldOMFJYSnliM0k4WVc1NUxDQmhibmsrSUh3Z1lXNTVLVG9nVFdsc2EybHZVbVZ6Y0c5dWMyVlNaV3BsWTNRZ2UxeHVJQ0FnSUdsbUlDaGxjbkp2Y2lCcGJuTjBZVzVqWlc5bUlFVnljbTl5SUNZbUlGd2lkbWwwWlZObGNuWmxjbHdpSUdsdUlHZHNiMkpoYkZSb2FYTXBJSHRjYmlBZ0lDQWdJQ0FnZEhKNUlIc2dLR2RzYjJKaGJGUm9hWE1nWVhNZ1lXNTVLUzUyYVhSbFUyVnlkbVZ5TG5OemNrWnBlRk4wWVdOcmRISmhZMlVvWlhKeWIzSXBPeUI5SUdOaGRHTm9JSHQ5WEc0Z0lDQWdmVnh1SUNBZ0lHTnZibk4wSUc1aGJXVWdQU0JsY25KdmNqOHVZMjlrWlNBL1B5Qmxjbkp2Y2o4dWJtRnRaU0EvUHlCbGNuSnZjajh1WTI5dWMzUnlkV04wYjNJL0xtNWhiV1VnUHo4Z1hDSlZibTVoYldWa0lFVjRZMlZ3ZEdsdmJsd2lPMXh1WEc0Z0lDQWdhV1lnS0dWeWNtOXlQeTRrYldsc2EybHZVbVZxWldOMElEMDlQU0IwY25WbEtTQjdYRzRnSUNBZ0lDQWdJQzh2SU9taWhPYWNuK1dHaGVlYWhPUzRtdVdLb2VhTGt1ZTduZSs4aU9ldHZ1V1FqZWFYb09hVmlPT0FnZVdQZ3VhVnNPbVVtZWl2citPQWdVNVBWRjlHVDFWT1JDRG5yWW52dklubmxLZ2dkMkZ5Ymk5cGJtWnZJT2l1c09XOWxlKzhqRnh1SUNBZ0lDQWdJQ0F2THlEa3VJM2t1cWZubEo4Z1pYSnliM0lnNXBlbDViK1g3N3lNNllHLzVZV041YVNXNllPbzVwZWc1cFdJNksrMzVyR0M3N3lJNTRpczZKbXI1b21yNW8rUDU2Mko3N3lKNXJHaDVwK1Q2WlNaNksrdjVaR0s2SzJtNDRDQ1hHNGdJQ0FnSUNBZ0lHbG1JQ2hsY25KdmNpNWpiMlJsSUQwOVBTQmNJazVQVkY5R1QxVk9SRndpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JzYjJkblpYSXVhVzVtYnlodVlXMWxMQ0JsY25KdmNqOHVaR0YwWVQ4dWNHRjBhQ0EvUHlCY0lsVnVhMjV2ZDI0Z2NHRjBhRndpS1R0Y2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElITjBZV05ySUQwZ0tHVnljbTl5UHk1emRHRmpheUEvUHlCY0lsd2lLUzV6Y0d4cGRDaGNJbHhjYmx3aUtTNXpiR2xqWlNneUtTNXFiMmx1S0Z3aVhGeHVYQ0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdiRzluWjJWeUxuZGhjbTRvYm1GdFpTd2dZRnhjYmlSN1NsTlBUaTV6ZEhKcGJtZHBabmtvWlhKeWIzSS9MbVJoZEdFcGZXQXNJR0JjWEc0a2UzTjBZV05yZlZ4Y2JtQXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdkSEo1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElITjBZV05ySUQwZ1pYSnliM0kvTG5OMFlXTnJJRDgvSUZ3aVhDSTdYRzRnSUNBZ0lDQWdJQ0FnSUNCc2IyZG5aWEl1WlhKeWIzSW9ibUZ0WlN3Z1lGeGNiaVI3U2xOUFRpNXpkSEpwYm1kcFpua29aWEp5YjNJL0xtUmhkR0VwZldBc0lHQmNYRzRrZTNOMFlXTnJmVnhjYm1BcE8xeHVJQ0FnSUNBZ0lDQjlJR05oZEdOb0lDaGZLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnNiMmRuWlhJdVpYSnliM0lvYm1GdFpTd2dZRnhjYmlSN1pYSnliM0kvTG5SdlUzUnlhVzVuS0NsOVlDd2dZRnhjYmlSN1pYSnliM0kvTG5OMFlXTnJmVnhjYm1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZWeHVYRzRnSUNBZ2JHVjBJSEpsYzNWc2REb2dUV2xzYTJsdlVtVnpjRzl1YzJWU1pXcGxZM1E3WEc1Y2JpQWdJQ0JwWmlBb1pYSnliM0kvTGlSdGFXeHJhVzlTWldwbFkzUWdQVDA5SUhSeWRXVXBJSEpsYzNWc2RDQTlJSHNnYzNWalkyVnpjem9nWm1Gc2MyVXNJR052WkdVNklHVnljbTl5TG1OdlpHVXNJSEpsYW1WamREb2daWEp5YjNJdVpHRjBZU3dnWlhobFkzVjBaVWxrSUgwN1hHNGdJQ0FnWld4elpTQnlaWE4xYkhRZ1BTQjdJSE4xWTJObGMzTTZJR1poYkhObExDQmpiMlJsT2lCY0lrbE9WRVZTVGtGTVgxTkZVbFpGVWw5RlVsSlBVbHdpTENCeVpXcGxZM1E2SUhWdVpHVm1hVzVsWkN3Z1pYaGxZM1YwWlVsa0lIMDdYRzVjYmlBZ0lDQnlaWFIxY200Z2NtVnpkV3gwTzF4dWZWeHVJZ29nSUYwc0NpQWdJbTFoY0hCcGJtZHpJam9nSWp0QlFVRlBMRk5CUVZNc1NVRkJOa0lzUTBGQlF5eFRRVUV5UWp0QlFVRkJMRVZCUTNaRkxFOUJRVThzVVVGQlVUdEJRVUZCT3p0QlExVldMRk5CUVZNc1ZVRkJNRU1zUTBGQlF5eFBRVUVyUWp0QlFVRkJMRVZCUTNoR0xFOUJRVTg3UVVGQlFTeEpRVU5NTEUxQlFVMHNUMEZCVHl4RlFVRkZMR0ZCUVdFc1pVRkJaU3hOUVVGTk8wRkJRVUVzUlVGRGJrUTdRVUZCUVRzN1FVTmtTeXhUUVVGVExFMUJRVGhDTEVOQlFVTXNVVUZCTUVJN1FVRkJRU3hGUVVOMlJTeFBRVUZQTzBGQlFVRTdRVUZUUml4VFFVRlRMRmRCUVZjc1EwRkJReXhQUVVGdlF5eGpRVUZ6UWp0QlFVRkJMRVZCUTNCR0xFbEJRVWtzVlVGQlZUdEJRVUZCTEVsQlFWY3NUMEZCVHp0QlFVRkJMRVZCUldoRExFOUJRVThzUjBGQlJ6dEJRVUZCTzBGQlIwd3NVMEZCVXl4WFFVRlhMRU5CUVVNc1QwRkJNa0lzWTBGQmMwSTdRVUZCUVN4RlFVTXpSU3hKUVVGSkxGVkJRVlU3UVVGQlFTeEpRVUZYTEU5QlFVODdRVUZCUVN4RlFVVm9ReXhQUVVGUExFOUJRVThzVTBGQlV5eFBRVUZQTEVWQlFVVTdRVUZCUVR0QlFVY3pRaXhUUVVGVExGbEJRVmtzUTBGQlF5eFBRVUZ2UXl4alFVRjFRanRCUVVGQkxFVkJRM1JHTEVsQlFVa3NWVUZCVlR0QlFVRkJMRWxCUVZFc1QwRkJUenRCUVVGQkxFVkJSVGRDTEVsQlFVa3NWVUZCVlR0QlFVRkJMRWxCUVZNc1QwRkJUenRCUVVGQkxFVkJSVGxDTEVsQlFVa3NWVUZCVlR0QlFVRkJMRWxCUVVrc1QwRkJUenRCUVVGQkxFVkJSWHBDTEVsQlFXdENMRlZCUVdRN1FVRkJRU3hKUVVGeFFpeFBRVUZQTzBGQlFVRXNSVUZGYUVNc1QwRkJUeXhSUVVGUkxFdEJRVXM3UVVGQlFUczdRVU12UW1Zc1UwRkJVeXhoUVVGaExFTkJRVU1zVTBGQmEwSTdRVUZCUVN4RlFVTTVReXhOUVVGTkxFOUJRU3RDTEVOQlFVTTdRVUZCUVN4RlFVTjBReXhaUVVGWkxFdEJRVXNzVlVGQlZ5eFJRVUZuUWl4UlFVRlJMRWRCUVVjN1FVRkJRU3hKUVVOeVJDeExRVUZMTEU5QlFVODdRVUZCUVN4RlFVTmtPMEZCUVVFc1JVRkRRU3hQUVVGUE8wRkJRVUU3T3p0QlEweFVMRk5CUVZNc1lVRkJZU3hEUVVGRExFOUJRVEJETzBGQlFVRXNSVUZETDBRc1QwRkJUeXhQUVVGUExGVkJRVlVzV1VGQldTeFZRVUZWTEZGQlFWRXNRMEZCUXl4TlFVRk5MRkZCUVZFc1MwRkJTenRCUVVGQk8wRkJSM0pGTEZOQlFWTXNVMEZCZFVVc1EwRkJReXhSUVVGWExGRkJRV003UVVGQlFTeEZRVU12Unl4TlFVRk5MRk5CUVZNc1MwRkJTeXhQUVVGUE8wRkJRVUVzUlVGRk0wSXNWMEZCVnl4UFFVRlBMRkZCUVZFN1FVRkJRU3hKUVVONFFpeEpRVUZKTEVOQlFVTXNUMEZCVHl4VlFVRlZMR1ZCUVdVc1MwRkJTeXhSUVVGUkxFZEJRVWM3UVVGQlFTeE5RVUZITzBGQlFVRXNTVUZGZUVRc1RVRkJUU3hqUVVGakxFOUJRVTg3UVVGQlFTeEpRVU16UWl4TlFVRk5MR05CUVdNc1QwRkJUenRCUVVGQkxFbEJSVE5DTEVsQlFVa3NUMEZCVHl4VlFVRlZMR1ZCUVdVc1MwRkJTeXhSUVVGUkxFZEJRVWNzUjBGQlJ6dEJRVUZCTEUxQlEzSkVMRWxCUVVrc1kwRkJZeXhYUVVGWExFdEJRVXNzWTBGQll5eFhRVUZYTEVkQlFVYzdRVUZCUVN4UlFVTTFSQ3hQUVVGUExFOUJRVFJDTEZWQlFWVXNZVUZCWVN4WFFVRlhPMEZCUVVFc1RVRkRka1U3UVVGQlFTeEpRVU5HTEVWQlFVODdRVUZCUVN4TlFVTktMRTlCUVdVc1QwRkJUenRCUVVGQk8wRkJRVUVzUlVGRk0wSTdRVUZCUVN4RlFVVkJMRTlCUVU4N1FVRkJRVHM3TzBGRGRFSlVMRWxCUVUwc2FVSkJRV2xDTzBGQlJYWkNMRk5CUVZNc1dVRkJXU3hEUVVGRExFdEJRVEJDTzBGQlFVRXNSVUZETlVNc1RVRkJUU3hOUVVGTkxFbEJRVWs3UVVGQlFTeEZRVU5vUWl4SlFVRkpMRTlCUVU4c1RVRkJUU3hQUVVGUExFMUJRVTBzU1VGQlNTeFhRVUZYTEVOQlFVTXNTMEZCU3l4TlFVRlJMRWxCUVVrc1YwRkJWeXhEUVVGRExFdEJRVXNzVFVGQlVTeEpRVUZKTEZGQlFWRXNSMEZCUnl4TlFVRk5MRWxCUVVrN1FVRkJRU3hKUVVNM1J5eE5RVUZOTEZGQlFWRXNaVUZCWlN4TFFVRkxMRWRCUVVjN1FVRkJRU3hKUVVOeVF5eEpRVUZKTEZWQlFWVXNUVUZCVFR0QlFVRkJMRTFCUTJoQ0xFMUJRVTBzVjBGQlZ5eE5RVUZOTzBGQlFVRXNUVUZEZGtJc1RVRkJUU3hUUVVGVExFMUJRVTA3UVVGQlFTeE5RVU55UWl4SlFVRkpMR0ZCUVdFN1FVRkJRU3hSUVVGWExFOUJRVTg3UVVGQlFTeE5RVU51UXl4SlFVRkpMRmRCUVZjc1YwRkJWenRCUVVGQkxGRkJRM1JDTEUxQlFVMHNaVUZCWlN4UFFVRlBMRmRCUVZjc1MwRkJTeXhQUVVGUExFOUJRVThzUTBGQlF5eE5RVUZOTEUxQlFVMHNSMEZCUnl4UFFVRlBMRTFCUVUwc1IwRkJSeXhEUVVGRExFdEJRVXNzVDBGQlR5eE5RVUZOTEVOQlFVTXNUVUZCVFR0QlFVRkJMRkZCUTNCSUxFOUJRVThzU1VGQlNTeExRVUZMTEZkQlFWY3NXVUZCV1R0QlFVRkJMRTFCUXpORE8wRkJRVUVzVFVGRFFTeFBRVUZQTEVsQlFVa3NTMEZCU3l4WFFVRlhMRWRCUVVjN1FVRkJRU3hKUVVOc1F6dEJRVUZCTEVWQlEwbzdRVUZCUVN4RlFVTkJMRTlCUVU4N1FVRkJRVHRCUVVkS0xGTkJRVk1zWlVGQmEwSXNRMEZCUXl4TlFVRlpPMEZCUVVFc1JVRkRNME1zU1VGQlNTeFRRVUZUTEZGQlFWRXNVMEZCVXp0QlFVRkJMRWxCUVZjc1QwRkJUenRCUVVGQkxFVkJRMmhFTEVsQlFVa3NUMEZCVHl4VFFVRlRMRlZCUVZVN1FVRkJRU3hKUVVNeFFpeEpRVUZKTEdkQ1FVRm5RanRCUVVGQkxFMUJRVTBzVDBGQlR6dEJRVUZCTEVsQlEycERMRWxCUVVrc1RVRkJUU3hSUVVGUkxFbEJRVWtzUjBGQlJ6dEJRVUZCTEUxQlEzSkNMRTFCUVUwc1RVRkJUU3hMUVVGTE8wRkJRVUVzVFVGRGFrSXNVMEZCVXl4SlFVRkpMRVZCUVVjc1NVRkJTU3hMUVVGTExFdEJRVXM3UVVGQlFTeFJRVU14UWl4TlFVRk5MRWxCUVVrc1MwRkJTenRCUVVGQkxGRkJRMllzU1VGQlNTeFBRVUZQTEUxQlFVMHNWVUZCVlR0QlFVRkJMRlZCUTNaQ0xFMUJRVTBzU1VGQlNTeGhRVUZoTEVOQlFVTTdRVUZCUVN4VlFVTjRRaXhKUVVGSkxFMUJRVTA3UVVGQlFTeFpRVUZOTEV0QlFVc3NTMEZCU3p0QlFVRkJMRkZCUXpsQ0xFVkJRVThzVTBGQlNTeFBRVUZQTEUxQlFVMHNXVUZCV1N4TlFVRk5MRTFCUVUwN1FVRkJRU3hWUVVNMVF5eG5Ra0ZCWjBJc1EwRkJRenRCUVVGQkxGRkJRM0pDTzBGQlFVRXNUVUZEU2p0QlFVRkJMRTFCUTBFc1QwRkJUenRCUVVGQkxFbEJRMWc3UVVGQlFTeEpRVU5CTEUxQlFVMHNUVUZCVFR0QlFVRkJMRWxCUTFvc1YwRkJWeXhQUVVGUExFdEJRVXM3UVVGQlFTeE5RVU51UWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhWUVVGVkxHVkJRV1VzUzBGQlN5eExRVUZMTEVkQlFVYzdRVUZCUVN4UlFVRkhPMEZCUVVFc1RVRkRja1FzVFVGQlRTeEpRVUZKTEVsQlFVazdRVUZCUVN4TlFVTmtMRWxCUVVrc1QwRkJUeXhOUVVGTkxGVkJRVlU3UVVGQlFTeFJRVU4yUWl4TlFVRk5MRWxCUVVrc1lVRkJZU3hEUVVGRE8wRkJRVUVzVVVGRGVFSXNTVUZCU1N4TlFVRk5PMEZCUVVFc1ZVRkJUU3hKUVVGSkxFOUJRVTg3UVVGQlFTeE5RVU12UWl4RlFVRlBMRk5CUVVrc1QwRkJUeXhOUVVGTkxGbEJRVmtzVFVGQlRTeE5RVUZOTzBGQlFVRXNVVUZETlVNc1owSkJRV2RDTEVOQlFVTTdRVUZCUVN4TlFVTnlRanRCUVVGQkxFbEJRMG83UVVGQlFTeEpRVU5CTEU5QlFVODdRVUZCUVN4RlFVTllPMEZCUVVFc1JVRkRRU3hKUVVGSkxFOUJRVThzVTBGQlV5eFZRVUZWTzBGQlFVRXNTVUZETVVJc1RVRkJUU3hKUVVGSkxHRkJRV0VzU1VGQlNUdEJRVUZCTEVsQlF6TkNMRWxCUVVrc1RVRkJUVHRCUVVGQkxFMUJRVTBzVDBGQlR6dEJRVUZCTEVWQlF6TkNPMEZCUVVFc1JVRkRRU3hQUVVGUE8wRkJRVUU3T3p0QlF5OURTaXhUUVVGVExHTkJRV01zUTBGQlF5eFhRVUV3UWl4VFFVRmpPMEZCUVVFc1JVRkRia1VzVFVGQlRTeFpRVUZaTEU5QlEyUXNZVUZEUVN4WlFXbENLMDg3UVVGQlFTeEpRVU12VHl4TlFVRk5MRTlCUVU4c1VVRkJVU3hMUVVGTExGTkJRVk1zUjBGQlJ5eEpRVUZKTEZkQlFWYzdRVUZCUVN4SlFVTnlSQ3hOUVVGTkxGbEJRVzlDTEZGQlFWRTdRVUZCUVN4SlFVTnNReXhKUVVGSk8wRkJRVUVzU1VGRFNpeEpRVUZKTEVWQlFVVXNVVUZCVVN4dFFrRkJiVUlzVlVGQlZUdEJRVUZCTEUxQlJYWkRMRWxCUVVrc1QwRkJVU3hSUVVGUkxGTkJRV2xDTEZGQlFWRXNZMEZCWXl4RlFVRkZMRkZCUVZFc2JVSkJRVzFDTEZWQlFWVTdRVUZCUVN4UlFVTTVSaXhWUVVGVkxGRkJRVkU3UVVGQlFTeE5RVVYwUWl4RlFVRlBPMEZCUVVFc1VVRkZTQ3hWUVVGVkxFbEJRVWtzVVVGQlVUdEJRVUZCTEdGQlEyWXNVVUZCVVR0QlFVRkJMRkZCUTJZc1EwRkJRenRCUVVGQkxGRkJRMFFzU1VGQlNTeEZRVUZGTEZsQlFWazdRVUZCUVN4VlFVRlhMRkZCUVdkQ0xGTkJRVk1zVFVGQlRTeGpRVUZqTEU5QlFVODdRVUZCUVR0QlFVRkJMRWxCUlhwR0xFVkJRVTg3UVVGQlFTeE5RVU5JTEZWQlFWVXNVVUZCVVR0QlFVRkJMRTFCUTJ4Q0xFbEJRVWtzUlVGQlJTeFpRVUZaTzBGQlFVRXNVVUZCVnl4UlFVRm5RaXhUUVVGVExFMUJRVTBzWTBGQll5eFBRVUZQTzBGQlFVRTdRVUZCUVN4SlFVZHlSaXhOUVVGTkxGVkJRWE5DTEVOQlFVTTdRVUZCUVN4SlFVTTNRaXhOUVVGTkxGbEJRVmtzUTBGQlF5eFpRVUZwUWl4UlFVRlJMRkZCUVZFc1QwRkJUenRCUVVGQkxFbEJSVE5FTEVsQlFVazdRVUZCUVN4SlFVTktMRWxCUVVrc1VVRkJVU3hsUVVGbExFOUJRVTg3UVVGQlFTeE5RVU01UWl4VFFVRlRMRkZCUVZFN1FVRkJRU3hOUVVOcVFpeEpRVUZKTEU5QlFVOHNWMEZCVnp0QlFVRkJMRkZCUVdFc1UwRkJVeXhEUVVGRE8wRkJRVUVzU1VGRGFrUXNSVUZCVHp0QlFVRkJMRTFCUTBnc1NVRkJTU3hEUVVGRExGRkJRVkVzVlVGQlZTeFJRVUZSTEZkQlFWY3NUVUZCVFN4UlFVRlJMRmRCUVZjc1RVRkJUVHRCUVVGQkxGRkJRM0pGTEZOQlFWTXNRMEZCUXp0QlFVRkJMRTFCUTJRc1JVRkJUeXhUUVVGSkxGRkJRVkVzU1VGQlNTeGpRVUZqTEVkQlFVY3NWMEZCVnl4clFrRkJhMElzUjBGQlJ6dEJRVUZCTEZGQlEzQkZMRWxCUVVrN1FVRkJRU3hWUVVOQkxGTkJRVk1zWjBKQlFXZENMRXRCUVVzc1RVRkJUU3hSUVVGUkxFMUJRVTBzUTBGQlF6dEJRVUZCTEZWQlEzSkVMRTlCUVU4c1QwRkJUenRCUVVGQkxGVkJRMW9zVFVGQlRTeFBRVUZQTERaQ1FVRTJRaXhGUVVGRkxGVkJRVlVzVVVGQlVTeGhRVUZoTEZGQlFWRXNTVUZCU1N4alFVRmpMRXRCUVVzc1RVRkJUU3hSUVVGUkxGRkJRVkVzVDBGQlR5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RlFVRkZMRU5CUVVNN1FVRkJRVHRCUVVGQkxGRkJSVE5LTEVsQlFVa3NUMEZCVHl4WFFVRlhPMEZCUVVFc1ZVRkJZU3hUUVVGVExFTkJRVU03UVVGQlFTeE5RVU5xUkN4RlFVRlBMRk5CUVVrc1VVRkJVU3hKUVVGSkxHTkJRV01zUjBGQlJ5eFhRVUZYTEcxRFFVRnRReXhIUVVGSE8wRkJRVUVzVVVGRGNrWXNTVUZCU1R0QlFVRkJMRlZCUTBFc1RVRkJUU3hYUVVGWExFbEJRVWtzWjBKQlFXZENMRkZCUVZFc1RVRkJUVHRCUVVGQkxGVkJRMjVFTEZOQlFWTXNRMEZCUXp0QlFVRkJMRlZCUTFZc1UwRkJVeXhSUVVGUkxFTkJRVU1zVDBGQlR5eFJRVUZSTEU5QlFVOHNUMEZCVHl4TFFVRkxPMEZCUVVFc1ZVRkRkRVFzVDBGQlR5eFBRVUZQTzBGQlFVRXNWVUZEV2l4TlFVRk5MRTlCUVU4c05rSkJRVFpDTEVWQlFVVXNWVUZCVlN4dFFrRkJiVUlzWVVGQllTeFJRVUZSTEVsQlFVa3NZMEZCWXl4TFFVRkxMRTFCUVUwc1VVRkJVU3hSUVVGUkxFOUJRVThzVFVGQlRTeEhRVUZITEVsQlFVa3NSVUZCUlN4RFFVRkRPMEZCUVVFN1FVRkJRU3hOUVVVeFN5eEZRVUZQTEZOQlFVa3NVVUZCVVN4UFFVRlBMRmRCUVZjc1IwRkJSeXhIUVVGSE8wRkJRVUVzVVVGRGRrTXNTVUZCU1R0QlFVRkJMRlZCUTBFc1UwRkJVeXhuUWtGQlowSXNTMEZCU3l4TlFVRk5MRkZCUVZFc1RVRkJUU3hEUVVGRE8wRkJRVUVzVlVGRGNrUXNUMEZCVHl4UFFVRlBPMEZCUVVFc1ZVRkRXaXhOUVVGTkxFOUJRVThzTmtKQlFUWkNMRVZCUVVVc1ZVRkJWU3hSUVVGUkxHRkJRV0VzVVVGQlVTeEpRVUZKTEdOQlFXTXNTMEZCU3l4TlFVRk5MRkZCUVZFc1VVRkJVU3hQUVVGUExFMUJRVTBzUjBGQlJ5eEpRVUZKTEVWQlFVVXNRMEZCUXp0QlFVRkJPMEZCUVVFc1RVRkZMMG9zUlVGRFN6dEJRVUZCTEZGQlEwUXNUVUZCVFN4UFFVRlBMRFpDUVVFMlFpeEZRVUZGTEZWQlFWVXNVVUZCVVN4aFFVRmhMRkZCUVZFc1NVRkJTU3hqUVVGakxFdEJRVXNzVFVGQlRTeFJRVUZSTEZGQlFWRXNUMEZCVHl4TlFVRk5MRWRCUVVjc1NVRkJTU3hGUVVGRkxFTkJRVU03UVVGQlFUdEJRVUZCTzBGQlFVRXNTVUZITDBvc1NVRkJTU3hQUVVGUExGZEJRVmNzV1VGQldTeE5RVUZOTEZGQlFWRXNUVUZCVFR0QlFVRkJMRTFCUVVjc1RVRkJUU3hQUVVGUExEWkNRVUUyUWl4RlFVRkZMRlZCUVZVc1VVRkJVU3hoUVVGaExGRkJRVkVzU1VGQlNTeGpRVUZqTEV0QlFVc3NUVUZCVFN4VFFVRlRMRTlCUVU4c1VVRkJVU3hYUVVGWExGZEJRVmNzVVVGQlVTeFRRVUZUTEV0QlFVc3NWVUZCVlN4UlFVRlJMRTFCUVUwc1IwRkJSeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEZRVUZGTEVOQlFVTTdRVUZCUVN4SlFVTjRVaXhKUVVGSkxESkNRVUV5UWl4VlFVRlZMRTlCUVU4c01FSkJRVEJDTEZWQlFWVTdRVUZCUVN4TlFVTm9SaXhKUVVGSkxFTkJRVU1zVVVGQlVUdEJRVUZCTEZGQlFWTXNUVUZCVFN4UFFVRlBMRzlDUVVGdlFpd3dRMEZCTUVNN1FVRkJRU3hOUVVOcVJ5eFBRVUZQTEU5QlFVODdRVUZCUVN4TlFVTmtMRWxCUVVrc1lVRkJZU3haUVVGWkxHRkJRV0U3UVVGQlFTeE5RVU14UXl4SlFVRkpMR1ZCUVdVc1lVRkJZU3hsUVVGbE8wRkJRVUVzVVVGQlRTeGhRVUZoTEVOQlFVTTdRVUZCUVN4TlFVTnVSU3hUUVVGVExGVkJRVlVzVVVGQlVTeFZRVUZWTzBGQlFVRXNUVUZEY2tNc1VVRkJVU3hqUVVGakxFMUJRVTBzTWtKQlFUSkNMRXRCUVVzc1ZVRkJWU3hOUVVGTkxFTkJRVU03UVVGQlFTeEpRVU5xUmp0QlFVRkJMRWxCUTBFc1NVRkJTU3hEUVVGRExGRkJRVkVzVTBGQlV5eE5RVUZOTEZsQlFWa3NVVUZCVVN4VFFVRlRMRTFCUVUwc1VVRkJVVHRCUVVGQkxFMUJRVkVzVVVGQlVTeFJRVUZSTEV0QlFVc3NUMEZCVHl4VFFVRlRPMEZCUVVFc1NVRkZjRWdzU1VGQlNTeERRVUZETEZGQlFWRTdRVUZCUVN4TlFVRlRMRkZCUVZFc1ZVRkJWU3hEUVVGRE8wRkJRVUVzU1VGRGVrTXNUVUZCVFN4TlFVRk5MRkZCUVZFN1FVRkJRU3hKUVVOd1FpeEpRVUZKTEZWQlFWVXNVVUZCVVR0QlFVRkJMRWxCUTNSQ0xFbEJRVWtzVDBGQlR5eFJRVUZSTzBGQlFVRXNTVUZEYmtJc1NVRkJTU3haUVVGWk8wRkJRVUVzU1VGRGFFSXNTVUZCU1N4VFFVRlRMRkZCUVZFN1FVRkJRU3hKUVVOeVFpeEpRVUZKTEU5QlFVOHNVVUZCVVR0QlFVRkJMRWxCUTI1Q0xFbEJRVWtzYTBKQlFXdENMRkZCUVZFN1FVRkJRU3hKUVVNNVFpeEpRVUZKTEd0Q1FVRnJRaXhSUVVGUk8wRkJRVUVzU1VGRE9VSXNTVUZCU1N4WlFVRlpMRkZCUVZFN1FVRkJRU3hKUVVONFFpeEpRVUZKTEZOQlFWTXNVVUZCVVN4UlFVRlJPMEZCUVVFc1NVRkROMElzU1VGQlNTeFJRVUZSTEZWQlFWVTdRVUZCUVN4SlFVTjBRaXhKUVVGSkxFOUJRVThzUTBGQlF5eFJRVUZoTEZkQlFXZENMRTlCUVU4c1MwRkJTeXhSUVVGUkxFMUJRVTA3UVVGQlFTeEpRVU51UlN4SlFVRkpMRmxCUVZrN1FVRkJRU3hKUVVOb1FpeEpRVUZKTEVsQlFVazdRVUZCUVN4SlFVTlNMRWxCUVVrc1UwRkJVenRCUVVGQkxFbEJRMklzU1VGQlNTeFJRVUZSTzBGQlFVRXNTVUZGV2l4TlFVRk5MRlZCUVhkQ0xFVkJRVVVzVDBGQlR5eFZRVUZWTzBGQlFVRXNTVUZGYWtRc1RVRkJUU3hUUVVGVExGbEJRVms3UVVGQlFTeEpRVU16UWl4TlFVRk5MRTlCUVZFc1VVRkJVU3hQUVVGUExGRkJRVkVzVDBGQlR5eERRVUZETzBGQlFVRXNTVUZGTjBNc1NVRkJTU3hSUVVGUkxGRkJRVkVzVFVGQlRTeFRRVUZUTEZkQlFWY3NWMEZCVnp0QlFVRkJMRTFCUTNKRUxFMUJRVTBzWlVGQlpTeE5RVUZOTEZkQlFWY3NRMEZCUXl4TlFVRk5PMEZCUVVFc1RVRkROME1zU1VGQlNTeERRVUZETEdGQlFXRXNVMEZCVXl4UlFVRlJMRkZCUVZFc1MwRkJTeXhSUVVGUkxFMUJRVTA3UVVGQlFTeFJRVUZITEUxQlFVMHNUMEZCVHl4elFrRkJjMElzVTBGQlV6dEJRVUZCTEVsQlEycElPMEZCUVVFc1NVRkZRU3hKUVVGSkxFMUJRVTBzWlVGQlpTeGhRVUZoTEV0QlFVc3NaVUZCWlN4UlFVRlRMRTFCUVUwc1VVRkJVU3hMUVVGTExGVkJRVlVzUzBGQlN5eExRVUZMTEZkQlFWY3NVMEZCVXl4UlFVRlJMRWRCUVVrN1FVRkJRU3hOUVVOMFNTeE5RVUZOTEdGQlFXRXNXVUZCV1N4bFFVRmxMRTFCUVUwN1FVRkJRU3hOUVVOd1JDeEpRVUZKTEVOQlFVTXNWMEZCVnp0QlFVRkJMRkZCUVZNc1RVRkJUU3hQUVVGUExIbENRVUY1UWl4TFFVRk5MRmRCUVcxQ0xFOUJRVThzU1VGQlNTeFRRVUZUTEdOQlFXVXNWMEZCYlVJc1QwRkJUeXhIUVVGSExHRkJRV01zVjBGQmJVSXNUMEZCVHl4SFFVRkhMR2REUVVGcFF5eFhRVUZ0UWl4UFFVRlBMRWRCUVVjc01FSkJRVEJDTEVOQlFVTTdRVUZCUVN4SlFVTm9VenRCUVVGQkxFbEJSVUVzU1VGQlNTeFJRVUZSTEcxQ1FVRnRRaXh6UWtGQmMwSXNTMEZCU3l4TlFVRk5PMEZCUVVFc1RVRkROVVFzVFVGQlRTeFJRVUZSTEV0QlFVc3NkMEpCUVhkQ0xFVkJRVVVzVjBGQlZ5eFJRVUZSTEd0Q1FVRnJRaXhSUVVGUkxGRkJRVkVzWlVGQlpTeE5RVUZOTEZGQlFWRXNUVUZCVFN4TlFVRk5MRk5CUVZNc1VVRkJVU3hUUVVGVExGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNTVUZEZUV3N1FVRkJRU3hKUVVWQkxGRkJRVkVzVVVGQlVTeE5RVUZOTEU5QlFVOHNVVUZCVVN4UlFVRlJMRk5CUVZNc1RVRkJUVHRCUVVGQkxFbEJSVFZFTEVsQlFVa3NZMEZCWXp0QlFVRkJMRWxCUTJ4Q0xFbEJRVWtzVVVGQlVTeFZRVUZWTEdGQlFXRXNVVUZCVVN4VlFVRlZMRkZCUVZFc1VVRkJVU3hWUVVGVkxFbEJRVWs3UVVGQlFTeE5RVU12UlN4alFVRmpPMEZCUVVFc1RVRkRaQ3hSUVVGUkxGRkJRVkVzUTBGQlF6dEJRVUZCTEVsQlEzSkNMRVZCUVU4c1UwRkJTU3hOUVVGTkxGRkJRVkVzVVVGQlVTeExRVUZMTEV0QlFVc3NUMEZCVHl4UlFVRlJMRlZCUVZVc1ZVRkJWVHRCUVVGQkxFMUJRekZGTEUxQlFVMHNUMEZCVHl4blFrRkJaMElzTmtkQlFUWkhPMEZCUVVFc1NVRkRPVWs3UVVGQlFTeEpRVVZCTEVsQlFVa3NVVUZCVVN4dFFrRkJiVUlzY1VKQlFYRkNMRXRCUVVzc1RVRkJUVHRCUVVGQkxFMUJRek5FTEUxQlFVMHNVVUZCVVN4TFFVRkxMSFZDUVVGMVFpeEZRVUZGTEZkQlFWY3NVVUZCVVN4clFrRkJhMElzVVVGQlVTeFJRVUZSTEdWQlFXVXNUVUZCVFN4UlFVRlJMRTFCUVUwc1RVRkJUU3hUUVVGVExGRkJRVkVzVTBGQlV5eFRRVUZUTEZGQlFWRXNUVUZCVFN4RFFVRkRPMEZCUVVFc1NVRkRhRTA3UVVGQlFTeEpRVVZCTEU5QlFVOHNSVUZCUlN4WFFVRlhMRk5CUVZNc1VVRkJVU3hUUVVGVExGTkJRVk1zVVVGQlVTeFRRVUZUTEUxQlFVMHNUVUZCVFN4aFFVRmhMRkZCUVZFN1FVRkJRVHRCUVVGQkxFVkJSemRITEUxQlFVMHNVMEZCVXl4UFFVRlBMRk5CUVcxQ0xGRkJRWEZETEZkQlFTdENPMEZCUVVFc1NVRkRla2NzVVVGQlVTeFpRVUZaTEUxQlFVMDdRVUZCUVN4SlFVTXhRaXhQUVVGUExGRkJRVkVzVTBGQlV5eE5RVUZOTzBGQlFVRTdRVUZCUVN4RlFVZHNReXhQUVVGUE8wRkJRVUVzU1VGRFNEdEJRVUZCTEVsQlEwRTdRVUZCUVN4RlFVTktPMEZCUVVFN08wRkRiRXBLTEVsQlFVMHNiVUpCUVcxQ0xGRkJRVkVzVVVGQlVUdEJRVVZzUXl4VFFVRlRMR3RDUVVGclFpeEhRVUZITzBGQlFVRXNSVUZEYWtNc1RVRkJUU3hYUVVGWExFbEJRVWs3UVVGQlFTeEZRVU55UWl4TlFVRk5MRlZCUVZVc1NVRkJTVHRCUVVGQkxFVkJRM0JDTEVsQlFVa3NWMEZCVnp0QlFVRkJMRVZCUldZc1RVRkJUU3hsUVVGbE8wRkJRVUVzU1VGRGFrSXNTVUZCU1N4RFFVRXJSeXhMUVVGVkxGbEJRWEZDTzBGQlFVRXNUVUZET1VrN1FVRkJRU3hOUVVOQkxGTkJRVk1zU1VGQlNTeFRRVUZUTEVkQlFXRTdRVUZCUVN4TlFVTnVReXhKUVVGSkxGRkJRVkVzUzBGQlN6dEJRVUZCTEZGQlEySXNTVUZCU1N4UlFVRlJMRWxCUVVrc1IwRkJSeXhOUVVGTkxFOUJRVTg3UVVGQlFTeFZRVU0xUWl4UlFVRlJMRWxCUVVrc1MwRkJTeXhKUVVGSkxFZEJRVXM3UVVGQlFTeFJRVU01UWp0QlFVRkJMRkZCUTBFc1RVRkJUU3hqUVVGakxGRkJRVkVzU1VGQlNTeEhRVUZITzBGQlFVRXNVVUZEYmtNc1dVRkJXU3hKUVVGSkxFOUJRVTg3UVVGQlFTeE5RVU16UWl4RlFVRlBPMEZCUVVFc1VVRkRTQ3hKUVVGSkxGRkJRVkVzU1VGQlNTeEhRVUZoTEUxQlFVMHNUMEZCVHp0QlFVRkJMRlZCUTNSRExGRkJRVkVzU1VGQlNTeExRVUZsTEVsQlFVa3NSMEZCU3p0QlFVRkJMRkZCUTNoRE8wRkJRVUVzVVVGRFFTeE5RVUZOTEUxQlFVMHNVVUZCVVN4SlFVRkpMRWRCUVdFN1FVRkJRU3hSUVVOeVF5eEpRVUZKTEVsQlFVa3NUMEZCVHp0QlFVRkJPMEZCUVVFc1RVRkhia0lzVDBGQlR5eE5RVUZOTzBGQlFVRXNVVUZEVkN4VFFVRlRMRTlCUVU4c1QwRkJUenRCUVVGQkxGRkJRM1pDTEVsQlFVa3NVVUZCVVN4TFFVRkxPMEZCUVVFc1ZVRkRZaXhOUVVGTkxHTkJRV01zVVVGQlVTeEpRVUZKTEVkQlFVYzdRVUZCUVN4VlFVTnVReXhKUVVGSkxHRkJRV0U3UVVGQlFTeFpRVU5pTEZsQlFWa3NUMEZCVHl4UFFVRlBPMEZCUVVFc1ZVRkRPVUk3UVVGQlFTeFJRVU5LTEVWQlFVODdRVUZCUVN4VlFVTklMRTFCUVUwc1RVRkJUU3hSUVVGUkxFbEJRVWtzUjBGQllUdEJRVUZCTEZWQlEzSkRMRWxCUVVrc1MwRkJTenRCUVVGQkxGbEJRMHdzU1VGQlNTeFBRVUZQTEU5QlFVODdRVUZCUVN4VlFVTjBRanRCUVVGQk8wRkJRVUU3UVVGQlFUdEJRVUZCTEVsQlNWb3NTMEZCU3l4RFFVRXlSU3hMUVVGVkxGbEJRWEZDTzBGQlFVRXNUVUZETTBjN1FVRkJRU3hOUVVOQkxFbEJRVWtzVVVGQlVTeExRVUZMTzBGQlFVRXNVVUZEWWl4TlFVRk5MR05CUVdNc1VVRkJVU3hKUVVGSkxFZEJRVWM3UVVGQlFTeFJRVU51UXl4SlFVRkpMRU5CUVVNN1FVRkJRU3hWUVVGaE8wRkJRVUVzVVVGRGJFSXNVMEZCVXl4UFFVRlBMRTlCUVU4N1FVRkJRU3hSUVVOMlFpeFpRVUZaTEU5QlFVOHNUMEZCVHp0QlFVRkJMRTFCUXpsQ0xFVkJRVTg3UVVGQlFTeFJRVU5JTEUxQlFVMHNUVUZCVFN4UlFVRlJMRWxCUVVrc1IwRkJZVHRCUVVGQkxGRkJRM0pETEVsQlFVa3NRMEZCUXp0QlFVRkJMRlZCUVVzN1FVRkJRU3hSUVVOV0xGTkJRVk1zVDBGQlR5eFBRVUZQTzBGQlFVRXNVVUZEZGtJc1NVRkJTU3hQUVVGUExFOUJRVTg3UVVGQlFUdEJRVUZCTzBGQlFVRXNTVUZITVVJc1RVRkJUU3hEUVVGM1JDeExRVUZWTEZWQlFXZERPMEZCUVVFc1RVRkRjRWNzVFVGQlRTeEpRVUZKTEZGQlFWRXNTVUZCU1N4SFFVRmhPMEZCUVVFc1RVRkRia01zVFVGQlRTeHRRa0ZCYlVJc1VVRkJVU3hKUVVGSkxFZEJRVWM3UVVGQlFTeE5RVU40UXl4SlFVRkpMRU5CUVVNc2IwSkJRVzlDTEVOQlFVTTdRVUZCUVN4UlFVRkhMRTlCUVU4N1FVRkJRU3hOUVVWd1F5eEpRVUZKTEc5Q1FVRnZRaXhIUVVGSE8wRkJRVUVzVVVGRGRrSXNVVUZCVVN4WlFVRlpPMEZCUVVFc1ZVRkRhRUlzVjBGQlZ5eFhRVUZYTEd0Q1FVRnJRanRCUVVGQkxGbEJRM0JETEUxQlFVMHNVVUZCVVN4RlFVRkZMRXRCUVVzc1RVRkJUU3hEUVVGRE8wRkJRVUVzVlVGRGFFTTdRVUZCUVN4VlFVTkJMRmRCUVZjc1YwRkJWeXhIUVVGSE8wRkJRVUVzV1VGRGNrSXNUVUZCVFN4UlFVRlJMRXRCUVVzN1FVRkJRU3hWUVVOMlFqdEJRVUZCTEZkQlEwUTdRVUZCUVN4TlFVTlFPMEZCUVVFc1RVRkZRU3hKUVVGSkxHdENRVUZyUWp0QlFVRkJMRkZCUTJ4Q0xGRkJRVkVzV1VGQldUdEJRVUZCTEZWQlEyaENMRmRCUVZjc1YwRkJWeXhyUWtGQmEwSTdRVUZCUVN4WlFVTndReXhOUVVGTkxGRkJRVkVzUlVGQlJTeExRVUZMTEUxQlFVMHNRMEZCUXp0QlFVRkJMRlZCUTJoRE8wRkJRVUVzVjBGRFJEdEJRVUZCTEUxQlExQTdRVUZCUVN4TlFVVkJMRkZCUVZFc1dVRkJXVHRCUVVGQkxGRkJRMmhDTEZkQlFWY3NWMEZCVnl4SFFVRkpPMEZCUVVFc1ZVRkRkRUlzVFVGQlRTeFJRVUZSTEV0QlFVczdRVUZCUVN4UlFVTjJRanRCUVVGQkxGTkJRMFE3UVVGQlFUdEJRVUZCTEVsQlJWQXNhMEpCUVd0Q0xFTkJRVU1zVVVGQmVVSTdRVUZCUVN4TlFVTjRReXhQUVVGUExGRkJRVkVzU1VGQlNTeEhRVUZITEV0QlFVc3NVVUZCVVN4SlFVRkpMRWRCUVVjN1FVRkJRVHRCUVVGQkxGRkJSVEZETEZGQlFWRXNSMEZCUnp0QlFVRkJMRTFCUVVVc1QwRkJUenRCUVVGQk8wRkJRVUVzU1VGRGVFSXNhVUpCUVdsQ0xFOUJRVGhFTEV0QlFWVXNWVUZCYlVNN1FVRkJRU3hOUVVONFNDeE5RVUZOTEcxQ1FVRnRRaXhSUVVGUkxFbEJRVWtzUjBGQlJ6dEJRVUZCTEUxQlEzaERMRWxCUVVrc1YwRkJWenRCUVVGQkxFMUJRMllzU1VGQlNTeHJRa0ZCYTBJN1FVRkJRU3hSUVVOc1FpeFhRVUZYTEZkQlFWY3NhMEpCUVd0Q08wRkJRVUVzVlVGRGNFTXNTVUZCU3l4TlFVRk5MRkZCUVZFc1JVRkJSU3hMUVVGTExFMUJRVTBzUTBGQlF5eE5RVUZQTEUxQlFVMDdRVUZCUVN4WlFVTXhReXhYUVVGWE8wRkJRVUVzVlVGRFpqdEJRVUZCTEZGQlEwbzdRVUZCUVN4TlFVTktPMEZCUVVFc1RVRkZRU3hOUVVGTkxFbEJRVWtzVVVGQlVTeEpRVUZKTEVkQlFXRTdRVUZCUVN4TlFVTnVReXhKUVVGSkxFZEJRVWM3UVVGQlFTeFJRVU5JTEZkQlFWY3NWMEZCVnl4SFFVRkhPMEZCUVVFc1ZVRkRja0lzU1VGQlN5eE5RVUZOTEZGQlFWRXNTMEZCU3l4TlFVRlBMRTFCUVUwN1FVRkJRU3haUVVOcVF5eFhRVUZYTzBGQlFVRXNWVUZEWmp0QlFVRkJMRkZCUTBvN1FVRkJRU3hOUVVOS08wRkJRVUVzVFVGRFFTeFBRVUZQTzBGQlFVRTdRVUZCUVN4SlFVVllMR2xDUVVGcFFpeFBRVUU0UkN4TFFVRlZMRlZCUVcxRE8wRkJRVUVzVFVGRGVFZ3NUVUZCVFN4dFFrRkJiVUlzVVVGQlVTeEpRVUZKTEVkQlFVYzdRVUZCUVN4TlFVTjRReXhKUVVGSkxGZEJRVmM3UVVGQlFTeE5RVU5tTEVsQlFVa3NhMEpCUVd0Q08wRkJRVUVzVVVGRGJFSXNWMEZCVnl4WFFVRlhMR3RDUVVGclFqdEJRVUZCTEZWQlEzQkRMRWxCUVVzc1RVRkJUU3hSUVVGUkxFVkJRVVVzUzBGQlN5eE5RVUZOTEVOQlFVTXNUVUZCVHl4TlFVRk5PMEZCUVVFc1dVRkRNVU1zVjBGQlZ6dEJRVUZCTEZWQlEyWTdRVUZCUVN4UlFVTktPMEZCUVVFc1RVRkRTanRCUVVGQkxFMUJSVUVzVFVGQlRTeEpRVUZKTEZGQlFWRXNTVUZCU1N4SFFVRmhPMEZCUVVFc1RVRkRia01zU1VGQlNTeEhRVUZITzBGQlFVRXNVVUZEU0N4WFFVRlhMRmRCUVZjc1IwRkJSenRCUVVGQkxGVkJRM0pDTEVsQlFVc3NUVUZCVFN4UlFVRlJMRXRCUVVzc1RVRkJUeXhOUVVGTk8wRkJRVUVzV1VGRGFrTXNWMEZCVnp0QlFVRkJMRlZCUTJZN1FVRkJRU3hSUVVOS08wRkJRVUVzVFVGRFNqdEJRVUZCTEUxQlEwRXNUMEZCVHp0QlFVRkJPMEZCUVVFc1JVRkZaanRCUVVGQkxFVkJSVUVzVDBGQlR6dEJRVUZCT3p0QlEzWkpTaXhUUVVGVExGVkJRV0VzUjBGQmEwSTdRVUZCUVN4RlFVTTNReXhKUVVGSkxGTkJRVGhETzBGQlFVRXNSVUZEYkVRc1RVRkJUU3hSUVV0RUxFTkJRVU03UVVGQlFTeEZRVVZPTEUxQlFVMHNWMEZCVnp0QlFVRkJMRWxCUTJZc1RVRkJUU3hEUVVGRExGTkJRVms3UVVGQlFTeE5RVU5xUWl4SlFVRkpMRTFCUVUwc1IwRkJSeXhGUVVGRkxFZEJRVWNzVlVGQlZTeE5RVUZOTzBGQlFVRXNVVUZEYUVNc1RVRkJUU3hQUVVGUExFMUJRVTBzUjBGQlJ5eEZRVUZGTzBGQlFVRXNVVUZEZUVJc1MwRkJTeXhSUVVGUk8wRkJRVUVzVVVGRFlpeExRVUZMTEZGQlFWRXNTVUZCU1R0QlFVRkJMRkZCUTJwQ08wRkJRVUVzVFVGRFJpeEZRVUZQTzBGQlFVRXNVVUZEVEN4TlFVRk5MRmxCUVZrc1VVRkJVU3hqUVVGcFFqdEJRVUZCTEZGQlF6TkRMRlZCUVZVc1VVRkJVU3hKUVVGSk8wRkJRVUVzVVVGRGRFSXNUVUZCVFN4TFFVRkxMRXRCUVVzc1YwRkJWeXhQUVVGUExFMUJRVTBzUTBGQlVUdEJRVUZCTzBGQlFVRTdRVUZCUVN4UFFVZG9SRHRCUVVGQkxGZEJRMGtzUzBGQlNTeEhRVUVyUWp0QlFVRkJMRkZCUTNaRExFbEJRVWtzVjBGQlZ6dEJRVUZCTEZWQlFWY3NUMEZCVHl4RlFVRkZMRTFCUVUwc1RVRkJUU3hQUVVGUExFdEJRVXM3UVVGQlFTeFJRVU16UkN4SlFVRkpMRTFCUVUwc1YwRkJWeXhIUVVGSE8wRkJRVUVzVlVGRGRFSXNUVUZCVFN4WlFVRlpMRkZCUVZFc1kwRkJhVUk3UVVGQlFTeFZRVU16UXl4TlFVRk5MRXRCUVVzc1MwRkJTeXhYUVVGWExFOUJRVThzUzBGQlN5eERRVUZSTzBGQlFVRXNVVUZEYWtRN1FVRkJRU3hSUVVOQkxFMUJRVTBzVDBGQlR5eE5RVUZOTEVkQlFVY3NRMEZCUXp0QlFVRkJMRkZCUTNaQ0xFMUJRVTBzVTBGQlV5eE5RVUZOTEV0QlFVczdRVUZCUVN4UlFVTXhRaXhOUVVGTkxFMUJRVTA3UVVGQlFTeFJRVU5hTEU5QlFVOHNSVUZCUlN4TlFVRk5MRmRCUVZjc1YwRkJWeXhQUVVGUExFOUJRVTg3UVVGQlFUdEJRVUZCTEZkQlJTOURMRTlCUVUwc1IwRkJhME03UVVGQlFTeFJRVU0xUXl4VFFVRlRPMEZCUVVFc1VVRkRWQ3hYUVVGWExGRkJRVkVzVDBGQlR6dEJRVUZCTEZWQlEzaENMRXRCUVVzc1VVRkJVVHRCUVVGQkxGVkJRMklzUzBGQlN5eFJRVUZSTEZOQlFWTTdRVUZCUVN4UlFVTjRRanRCUVVGQkxGRkJRMEVzVDBGQlR5eEZRVUZGTEUxQlFVMHNUVUZCVFN4UFFVRlBMRXRCUVVzN1FVRkJRVHRCUVVGQkxGZEJSVGRDTEUxQlFVc3NRMEZCUXl4TFFVRjVRenRCUVVGQkxGRkJRMjVFTEZOQlFWTTdRVUZCUVN4UlFVTlVMRWxCUVVrc1RVRkJUU3hYUVVGWExFZEJRVWM3UVVGQlFTeFZRVU4wUWl4TlFVRk5MRmxCUVZrc1VVRkJVU3hqUVVGcFFqdEJRVUZCTEZWQlF6TkRMRTFCUVUwc1MwRkJTeXhMUVVGTExGZEJRVmNzVDBGQlR5eExRVUZMTEVOQlFWRTdRVUZCUVN4UlFVTnFSRHRCUVVGQkxGRkJRMEVzVjBGQlZ5eFJRVUZSTEU5QlFVODdRVUZCUVN4VlFVTjRRaXhMUVVGTExGRkJRVkU3UVVGQlFTeFZRVU5pTEV0QlFVc3NUMEZCVHl4SFFVRkhPMEZCUVVFc1VVRkRha0k3UVVGQlFTeFJRVU5CTEU5QlFVOHNSVUZCUlN4TlFVRk5MRTFCUVUwc1QwRkJUeXhMUVVGTE8wRkJRVUU3UVVGQlFTeEpRVVZ5UXp0QlFVRkJMRXRCUTBNc1QwRkJUeXhqUVVGakxFZEJRVWM3UVVGQlFTeE5RVU4yUWl4UFFVRlBPMEZCUVVFN1FVRkJRU3hGUVVWWU8wRkJRVUVzUlVGRlFTeFBRVUZQTzBGQlFVRTdPMEZEY0VWVUxFbEJRVTBzVjBGQlZ6dEJRVU5xUWl4SlFVRk5MR1ZCUVdVc1UwRkJVenRCUVVVNVFpeEpRVUZKTEdWQlFXVXNTVUZCU1N4WFFVRlhMRWRCUVVjN1FVRkRja01zU1VGQlNTeHZRa0ZCYjBJN1FVRkRlRUlzU1VGQlNTeHJRa0ZCYTBJN1FVRkZaaXhUUVVGVExGVkJRVlVzUjBGQlZ6dEJRVUZCTEVWQlEycERMRWxCUVVrc2IwSkJRVzlDTEV0QlFVc3NTMEZCU3p0QlFVRkJMRWxCUXpsQ0xFOUJRVThzWjBKQlFXZENMRmxCUVZrN1FVRkJRU3hKUVVOdVF5eHZRa0ZCYjBJN1FVRkJRU3hGUVVONFFqdEJRVUZCTEVWQlJVRXNUVUZCVFN4TFFVRkxMRXRCUVVzc1NVRkJTU3hGUVVGRkxGTkJRVk1zUlVGQlJTeEZRVUZGTEZOQlFWTXNSMEZCUnl4SFFVRkhPMEZCUVVFc1JVRkZiRVFzU1VGQlNTeExRVUZMTzBGQlFVRXNSVUZGVkN4VFFVRlRMRWxCUVVrc1JVRkJSeXhKUVVGSkxFZEJRVWNzUzBGQlN6dEJRVUZCTEVsQlEzaENMRTFCUVUwc1UwRkJVeXhQUVVGUExHRkJRV0VzZFVKQlFYZENMRmxCUVZrN1FVRkJRU3hGUVVNelJUdEJRVUZCTEVWQlJVRXNUVUZCVFN4VlFVRlZPMEZCUVVFc1JVRkRhRUlzVTBGQlV5eEpRVUZKTEVWQlFVY3NTVUZCU1N4SlFVRkpMRXRCUVVzN1FVRkJRU3hKUVVONlFpeE5RVUZOTEUxQlFVOHNWVUZCVlN4aFFVRmhMSE5DUVVGelFpeFBRVUZUTzBGQlFVRXNTVUZEYmtVc1RVRkJUU3hUUVVGVExFOUJRVThzVFVGQlRTeFpRVUZaTzBGQlFVRXNSVUZETlVNN1FVRkJRU3hGUVVOQkxFOUJRVTg3UVVGQlFUczdPMEZEZEVKS0xGTkJRVk1zSzBKQlFTdENMRWRCUVVjN1FVRkJRU3hGUVVOb1JDeFBRVUZQTzBGQlFVRTdPenRCUTJsRFZDeGxRVUZ6UWl4WFFVRTJReXhEUVVGRExGZEJRVEJDTEdOQlFYZEVMRk5CUVRSRk8wRkJRVUVzUlVGRE9VNHNUVUZCVFN4WlFVRlpMRkZCUVZFc1lVRkJZU3huUTBGQlowTTdRVUZCUVN4RlFVTjJSU3hOUVVGTkxGTkJRVk1zVFVGQlRTeGhRVUZoTEVsQlFVazdRVUZCUVN4RlFVVjBReXhOUVVGTkxGVkJRVlU3UVVGQlFTeEpRVU5hTEZOQlFWTXNTVUZCU1R0QlFVRkJMRWxCUTJJN1FVRkJRU3hGUVVOS08wRkJRVUVzUlVGRlFTeE5RVUZOTEdWQlFXVXNiVUpCUVcxQ08wRkJRVUVzUlVGRmVFTXNTVUZCU1N4UlFVRlJPMEZCUVVFc1NVRkJWeXhSUVVGUkxHdENRVUZyUWl4UlFVRlJMR3RDUVVGclFpeFJRVUZSTEd0Q1FVRnJRaXhKUVVGSk8wRkJRVUVzUlVGRmVrY3NUVUZCVFN4SlFVRnpRenRCUVVGQkxFOUJRM0pETzBGQlFVRXNTVUZEU0R0QlFVRkJMRWxCUTBFN1FVRkJRU3hKUVVOQkxFbEJRVWtzWVVGQllUdEJRVUZCTEVsQlEycENMRXRCUVVzc1lVRkJZVHRCUVVGQkxFbEJRMnhDTEUxQlFVMHNZVUZCWVR0QlFVRkJMRWxCUTI1Q0xHbENRVUZwUWl4aFFVRmhPMEZCUVVFc1NVRkRPVUlzYVVKQlFXbENMR0ZCUVdFN1FVRkJRU3hKUVVNNVFpeHJRa0ZCYTBJc1lVRkJZVHRCUVVGQkxFbEJReTlDTEhOQ1FVRnpRaXhoUVVGaE8wRkJRVUVzUlVGRGRrTTdRVUZCUVN4RlFVVkJMRTFCUVUwc1YwRkJWeXhsUVVGbExGZEJRVmNzUTBGQlF6dEJRVUZCTEVWQlF6VkRMRTFCUVUwc1YwRkJWeXhsUVVGbExGZEJRVmNzUjBGQlJ5eFJRVUZSTzBGQlFVRXNSVUZIZEVRc1RVRkJUU3hSUVVGUk8wRkJRVUVzU1VGRFZqdEJRVUZCTEVsQlJVRXNTVUZCU1N4aFFVRmhPMEZCUVVFc1NVRkRha0lzUzBGQlN5eGhRVUZoTzBGQlFVRXNTVUZEYkVJc1RVRkJUU3hoUVVGaE8wRkJRVUVzU1VGRGJrSXNhVUpCUVdsQ0xHRkJRV0U3UVVGQlFTeEpRVU01UWl4cFFrRkJhVUlzWVVGQllUdEJRVUZCTEVsQlJUbENPMEZCUVVFc1NVRkZRVHRCUVVGQkxFbEJRMEVzV1VGQllTeFJRVUUyUWl4VFFVRlRPMEZCUVVFc1JVRkRka1E3UVVGQlFTeEZRVVZCTEZGQlFWRXNUVUZCVFR0QlFVRkJMRVZCUldRc1NVRkJTU3hOUVVGTkxGRkJRVkVzVVVGQlVTeFZRVUZWTEVkQlFVYzdRVUZCUVN4SlFVTnVReXhYUVVGWExHRkJRV0VzVVVGQlVTeFpRVUZaTzBGQlFVRXNUVUZEZUVNc1RVRkJUU3hWUVVGVkxFdEJRV3RFTzBGQlFVRXNTVUZEZEVVN1FVRkJRU3hGUVVOS08wRkJRVUVzUlVGRlFTeE5RVUZOTEZGQlFWRXNTVUZCU1N4VlFVRlZMR05CUVdNc1lVRkJZU3hMUVVGTExFTkJRVU03UVVGQlFTeEZRVVUzUkN4TlFVRk5MRmxCUVZrc1QwRkJUeXhMUVVGTExGVkJRVlVzVjBGQmEwTTdRVUZCUVN4RlFVTXhSU3hOUVVGTkxGZEJRVEJDTEZWQlFWVXNWMEZCVnl4WFFVRlhMRTFCUVUwc1MwRkJTeXhWUVVGVkxGVkJRVlVzVVVGQmRVSXNTVUZCU1N4RFFVRkRPMEZCUVVFc1JVRkRNMGdzVFVGQlRTeFpRVUZaTEVOQlFVTXNSMEZCUnl4WFFVRlhMRWRCUVVjc1VVRkJVVHRCUVVGQkxFVkJRelZETEZGQlFWRXNTVUZCU1R0QlFVRkJPMEZCUVVFc1RVRkJiMElzVlVGQlZTeExRVUZMTzBGQlFVRXNTMEZCVVR0QlFVRkJMR1ZCUVcxQ0xGVkJRVlVzWjBKQlFXZENPMEZCUVVFc1JVRkRjRWNzVVVGQlVTeEpRVUZKTzBGQlFVRXNOa0pCUVdkRExGRkJRVkVzVFVGQlRUdEJRVUZCTEVWQlJURkVMRTlCUVU4N1FVRkJRVHM3UVVOdVIwb3NVMEZCVXl4TFFVRnRReXhEUVVGRExFMUJRWEZETzBGQlFVRXNSVUZEZGtZc1QwRkJUenRCUVVGQk96dEJRMDFVTEdWQlFYTkNMR2xDUVVGcFFpeERRVUZETEZOQlFYZERMRTlCUVhOQ096czdRVU5yUW5SSExGTkJRVk1zWVVGQllTeEhRVUZYTzBGQlFVRXNSVUZETjBJc1RVRkJUU3hKUVVGSkxFbEJRVWs3UVVGQlFTeEZRVU5rTEU5QlFVOHNTVUZCU1N4RlFVRkZMRmxCUVZrc1MwRkJTeXhQUVVGUExFVkJRVVVzVTBGQlV5eEpRVUZKTEVOQlFVTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1IwRkJSeXhMUVVGTExFOUJRVThzUlVGQlJTeFJRVUZSTEVOQlFVTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1IwRkJSeXhMUVVGTExFOUJRVThzUlVGQlJTeFRRVUZUTEVOQlFVTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1IwRkJSeXhMUVVGTExFOUJRVThzUlVGQlJTeFhRVUZYTEVOQlFVTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1IwRkJSeXhMUVVGTExFOUJRVThzUlVGQlJTeFhRVUZYTEVOQlFVTXNSVUZCUlN4VFFVRlRMRWRCUVVjc1IwRkJSenRCUVVGQk8wRkJTV3BRTEVsQlFVMHNiVUpCUVcxQ0xFTkJRVU1zVVVGQmMwSTdRVUZCUVN4RlFVTTFReXhKUVVGSkxFdEJRVXM3UVVGQlFTeEZRVUZMTEVsQlFVazdRVUZCUVN4RlFVTnNRaXhSUVVGUkxFbEJRVWtzUjBGQlJ5eEhRVUZITzBGQlFVRXNSVUZEYkVJc1QwRkJUenRCUVVGQk8wRkJSMG9zVTBGQlV5eFpRVUZ2U0N4RFFVRkRMRk5CUVhkQ0xFMUJRV01zVjBGQk1rSTdRVUZCUVN4RlFVTnNUU3hOUVVGTkxGTkJRVk1zUTBGQlF6dEJRVUZCTEVWQlJXaENMRTFCUVUwc1QwRkJiVUlzUTBGQlF6dEJRVUZCTEVWQlF6RkNMRTFCUVUwc1QwRkJOa0lzU1VGQlNUdEJRVUZCTEVWQlJYWkRMRTFCUVUwc1dVRkJXU3hSUVVGUkxIRkNRVUZ4UWp0QlFVRkJMRVZCUXk5RExFMUJRVTBzWjBKQlFXZENMRU5CUVVNc1EwRkJReXhSUVVGUk8wRkJRVUVzUlVGRGFFTXNUVUZCVFN4WlFVRlpMRkZCUVZFN1FVRkJRU3hGUVVVeFFpeFBRVUZQTEVsQlFVazdRVUZCUVN4SlFVTlFPMEZCUVVFc1NVRkRRVHRCUVVGQkxFbEJRMEVzVVVGQlVTeERRVUZETEZsQlFYTkNPMEZCUVVFc1RVRkRNMElzU1VGQlNTeERRVUZETEZGQlFWRTdRVUZCUVN4UlFVRnZRanRCUVVGQkxFMUJRMnBETEU5QlFVOHNVVUZCVVN4dFFrRkJiVUlzVTBGQlV5eE5RVUZOTEVsQlFVazdRVUZCUVR0QlFVRkJMRVZCUlRkRU8wRkJRVUVzUlVGRlFTeE5RVUZOTEZsQlFWa3NRMEZCUXl4TFFVRmhMRlZCUVhsQ08wRkJRVUVzU1VGRGNrUXNTMEZCU3l4SlFVRkpMRXRCUVVzc1MwRkJTenRCUVVGQk8wRkJRVUVzUlVGRmRrSXNUVUZCVFN4WlFVRlpMRU5CUVVNc1VVRkJhMEk3UVVGQlFTeEpRVU5xUXl4SlFVRkpMRU5CUVVNc1ZVRkJWU3hIUVVGSE8wRkJRVUVzVFVGQlJ5eFBRVUZQTzBGQlFVRXNTVUZETlVJc1NVRkJTVHRCUVVGQkxFMUJRV1VzUzBGQlN5eExRVUZMTEVOQlFVTXNSMEZCUnl4SFFVRkhMRU5CUVVNN1FVRkJRU3hKUVVOeVF5eEpRVUZKTzBGQlFVRXNUVUZCWjBJc2EwSkJRV3RDTEZOQlFWTXNSVUZCUlN4TlFVRk5MR2xDUVVGcFFpeEpRVUZKTEVOQlFVTTdRVUZCUVN4SlFVTTNSU3hQUVVGUE8wRkJRVUU3UVVGQlFTeEZRVWRZTEU5QlFVOHNVMEZCVXp0QlFVRkJMRVZCUTJoQ0xFOUJRVThzVTBGQlV5eEpRVUZKTEZGQlFXRXNWVUZCVlN4SFFVRkhPMEZCUVVFc1JVRkZPVU1zVFVGQlRTeFRRVUZUTzBGQlFVRXNSVUZGWml4UFFVRlBMRkZCUVZFc1EwRkJReXhuUWtGQmQwSXNWMEZCTWtJc1ZVRkJWU3hEUVVGRExGZEJRVmNzVFVGQlRTeFhRVUZYTEU5QlFVOHNSMEZCUnp0QlFVRkJMRVZCUVVzc1pVRkJaU3hIUVVGSExFMUJRVTBzUTBGQlF6dEJRVUZCTEVWQlEyeEtMRTlCUVU4c1QwRkJUeXhEUVVGRExHZENRVUYzUWl4WFFVRXlRaXhWUVVGVkxFTkJRVU1zVlVGQlZTeE5RVUZOTEZkQlFWY3NUMEZCVHl4SFFVRkhPMEZCUVVFc1JVRkJTeXhsUVVGbExFZEJRVWNzVFVGQlRTeERRVUZETzBGQlFVRXNSVUZEYUVvc1QwRkJUeXhQUVVGUExFTkJRVU1zWjBKQlFYZENMRmRCUVRKQ0xGVkJRVlVzUTBGQlF5eFZRVUZWTEUxQlFVMHNWMEZCVnl4UFFVRlBMRWRCUVVjN1FVRkJRU3hGUVVGTExHVkJRV1VzUjBGQlJ5eE5RVUZOTEVOQlFVTTdRVUZCUVN4RlFVTm9TaXhQUVVGUExGRkJRVkVzUTBGQlF5eG5Ra0ZCZDBJc1YwRkJNa0lzVlVGQlZTeERRVUZETEZkQlFWY3NUVUZCVFN4WFFVRlhMRTlCUVU4c1IwRkJSenRCUVVGQkxFVkJRVXNzWlVGQlpTeEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVRkJMRVZCUTJ4S0xFOUJRVThzVlVGQlZTeERRVUZETEdkQ1FVRjNRaXhYUVVFeVFpeFZRVUZWTEVOQlFVTXNZVUZCWVN4TlFVRk5MRmRCUVZjc1QwRkJUeXhIUVVGSE8wRkJRVUVzUlVGQlN5eGxRVUZsTEVkQlFVY3NUVUZCVFN4RFFVRkRPMEZCUVVFc1JVRkRkRW9zVDBGQlR5eFhRVUZYTEVOQlFVTXNaMEpCUVhkQ0xGZEJRVEpDTEZWQlFWVXNRMEZCUXl4alFVRmpMRTFCUVUwc1YwRkJWeXhQUVVGUExFZEJRVWM3UVVGQlFTeEZRVUZMTEdWQlFXVXNSMEZCUnl4TlFVRk5MRU5CUVVNN1FVRkJRU3hGUVVWNFNpeFBRVUZQTzBGQlFVRTdPMEZEYWtWS0xGTkJRVk1zVlVGQlZTeEhRVUZqTzBGQlFVRXNSVUZEZEVNc1RVRkJUU3hwUWtGQmFVSTdRVUZCUVN4SlFVTnlRaXhoUVVGaE8wRkJRVUVzU1VGRFlpeFJRVUZSTEVOQlFVTTdRVUZCUVN4SlFVTlVMRWxCUVVrc1EwRkJReXhUUVVGMVF6dEJRVUZCTEUxQlF6RkRMR1ZCUVdVc1QwRkJUeXhMUVVGTExFOUJRVTg3UVVGQlFTeE5RVU5zUXl4UFFVRlBPMEZCUVVFN1FVRkJRU3hUUVVWSUxFbEJRVWNzUjBGQlJ6dEJRVUZCTEUxQlExWXNTVUZCU1N4UlFVRlJMRU5CUVVNN1FVRkJRU3hOUVVOaUxGZEJRVmNzVVVGQlVTeGxRVUZsTEZGQlFWRTdRVUZCUVN4UlFVTjRReXhSUVVGUkxFdEJRVXNzVlVGQlZ5eE5RVUZOTEV0QlFVc3NTMEZCU3l4RlFVRkhPMEZCUVVFc1RVRkROME03UVVGQlFTeE5RVU5CTEUxQlFVMHNVMEZCTWtJc1EwRkJRenRCUVVGQkxFMUJRMnhETEZkQlFWY3NUMEZCVHl4UFFVRlBPMEZCUVVFc1VVRkRka0lzVFVGQlRTeFJRVUZUTEUxQlFXTTdRVUZCUVN4UlFVTTNRaXhKUVVGSkxFTkJRVU1zU1VGQlNTeFhRVUZYTEVkQlFVYzdRVUZCUVN4VlFVRkhMRTlCUVU4c1QwRkJUenRCUVVGQkxFMUJRekZETzBGQlFVRXNUVUZEUVN4UFFVRlBPMEZCUVVFN1FVRkJRU3hGUVVWWU8wRkJRVUVzUlVGRFFTeFBRVUZQTzBGQlFVRTdPMEZEYkVOR0xFMUJRVTBzUzBGQlVUdEJRVUZCTEVWQlExUTdRVUZCUVN4RlFVTkJPMEZCUVVFc1JVRkZVaXhYUVVGWExFZEJRVWM3UVVGQlFTeEpRVU5XTEV0QlFVc3NUMEZCVHl4SlFVRkpPMEZCUVVFc1NVRkRhRUlzUzBGQlN5eFJRVUZSTEVsQlFVazdRVUZCUVR0QlFVRkJMRVZCUjNKQ0xFZEJRVWNzUTBGQlF5eE5RVUZqTEU5QlFXZENPMEZCUVVFc1NVRkRPVUlzVFVGQlRTeFJRVUZSTEV0QlExUXNVVUZCVVN4alFVRmpMRVZCUVVVc1JVRkRlRUlzVFVGQlRTeEhRVUZITEVWQlExUXNUMEZCVHl4RFFVRkRMRTFCUVUwc1RVRkJUU3hGUVVGRk8wRkJRVUVzU1VGRE0wSXNTVUZCU1N4alFVRmpMRXRCUVVzN1FVRkJRU3hKUVVOMlFpeEpRVUZKTEUxQlFVMHNWMEZCVnl4SFFVRkhPMEZCUVVFc1RVRkRjRUlzV1VGQldTeFJRVUZSTzBGQlFVRXNUVUZEY0VJc1MwRkJTeXhOUVVGTkxFbEJRVWtzVFVGQlRTeExRVUZMTzBGQlFVRXNUVUZETVVJN1FVRkJRU3hKUVVOS08wRkJRVUVzU1VGRFFTeFhRVUZYTEZGQlFWRXNUMEZCVHp0QlFVRkJMRTFCUTNSQ0xFbEJRVWtzUTBGQlF5eFpRVUZaTEZOQlFWTXNTVUZCU1N4SlFVRkpMRWRCUVVjN1FVRkJRU3hSUVVOcVF5eFpRVUZaTEZOQlFWTXNTVUZCU1N4TlFVRk5MRWxCUVVrc1VVRkJWVHRCUVVGQkxFMUJRMnBFTzBGQlFVRXNUVUZEUVN4alFVRmpMRmxCUVZrc1UwRkJVeXhKUVVGSkxFbEJRVWs3UVVGQlFTeEpRVU12UXp0QlFVRkJMRWxCUTBFc1dVRkJXU3hSUVVGUk8wRkJRVUVzU1VGRGNFSXNTMEZCU3l4TlFVRk5MRWxCUVVrc1RVRkJUU3hMUVVGTE8wRkJRVUU3UVVGQlFTeEZRVWM1UWl4SFFVRkhMRU5CUVVNc1RVRkJkMEk3UVVGQlFTeEpRVU40UWl4TlFVRk5MRk5CUVZNc1MwRkJTeXhOUVVGTkxFbEJRVWtzU1VGQlNUdEJRVUZCTEVsQlEyeERMRWxCUVVrc1YwRkJWenRCUVVGQkxFMUJRVmNzVDBGQlR6dEJRVUZCTEVsQlJXcERMRTFCUVUwc1VVRkJVU3hMUVVOVUxGRkJRVkVzWTBGQll5eEZRVUZGTEVWQlEzaENMRTFCUVUwc1IwRkJSeXhGUVVOVUxFOUJRVThzUTBGQlF5eE5RVUZOTEUxQlFVMHNSVUZCUlR0QlFVRkJMRWxCUXpOQ0xFbEJRVWtzWTBGQll5eExRVUZMTzBGQlFVRXNTVUZEZGtJc1YwRkJWeXhSUVVGUkxFOUJRVTg3UVVGQlFTeE5RVU4wUWl4SlFVRkpMRU5CUVVNc1dVRkJXU3hUUVVGVExFbEJRVWtzU1VGQlNTeEhRVUZITzBGQlFVRXNVVUZEYWtNc1QwRkJUenRCUVVGQkxFMUJRMWc3UVVGQlFTeE5RVU5CTEdOQlFXTXNXVUZCV1N4VFFVRlRMRWxCUVVrc1NVRkJTVHRCUVVGQkxFbEJReTlETzBGQlFVRXNTVUZEUVN4TlFVRk5MRk5CUVZNc1dVRkJXVHRCUVVGQkxFbEJRek5DTEVsQlFVa3NWMEZCVnp0QlFVRkJMRTFCUVUwc1MwRkJTeXhOUVVGTkxFbEJRVWtzVFVGQlRTeE5RVUZOTzBGQlFVRXNTVUZEYUVRc1QwRkJUenRCUVVGQk8wRkJRVUVzUlVGSFdDeFZRVUZWTEVOQlFVTXNUMEZCTWtJN1FVRkJRU3hKUVVOc1F5eEpRVUZKTEdOQlFXTXNTMEZCU3p0QlFVRkJMRWxCUTNaQ0xGZEJRVmNzVVVGQlVTeFBRVUZQTzBGQlFVRXNUVUZEZEVJc1NVRkJTU3hEUVVGRExGbEJRVmtzVTBGQlV5eEpRVUZKTEVsQlFVazdRVUZCUVN4UlFVRkhMRTlCUVU4N1FVRkJRU3hOUVVNMVF5eGpRVUZqTEZsQlFWa3NVMEZCVXl4SlFVRkpMRWxCUVVrN1FVRkJRU3hKUVVNdlF6dEJRVUZCTEVsQlEwRXNUMEZCVHl4WlFVRlpPMEZCUVVFN1FVRkJRU3hGUVVkMlFpeEhRVUZITEVOQlFVTXNUVUZCZFVJN1FVRkJRU3hKUVVOMlFpeFBRVUZQTEV0QlFVc3NTVUZCU1N4SlFVRkpMRTFCUVUwN1FVRkJRVHRCUVVWc1F6dEJRVUZCTzBGQlJVRXNUVUZCVFN4VFFVRlpPMEZCUVVFc1JVRkRaRHRCUVVGQkxFVkJRMEU3UVVGQlFTeEZRVVZCTEZkQlFWY3NSMEZCUnp0QlFVRkJMRWxCUTFZc1MwRkJTeXhYUVVGWExFbEJRVWs3UVVGQlFTeEpRVU53UWl4TFFVRkxMRkZCUVZFN1FVRkJRVHRCUVVWeVFqczdPMEZEZEVWUExGTkJRVk1zWjBKQlFXZENMRU5CUVVNc1RVRkJPRUlzVVVGQlowUTdRVUZCUVN4RlFVTXpSeXhOUVVGTkxGTkJRV2xETEVOQlFVTTdRVUZCUVN4RlFVTjRReXhKUVVGSkxFMUJRVTA3UVVGQlFTeEpRVUZyUWl4UFFVRlBMR3REUVVGclF5eExRVUZMTEdsQ1FVRnBRaXhMUVVGTExFbEJRVWs3UVVGQlFTeEZRVU53Unl4SlFVRkpMRTFCUVUwN1FVRkJRU3hKUVVGclFpeFBRVUZQTEd0RFFVRnJReXhMUVVGTExHbENRVUZwUWl4TFFVRkxMRWxCUVVrN1FVRkJRU3hGUVVOd1J5eEpRVUZKTEUxQlFVMHNaVUZCWlR0QlFVRkJMRWxCUVZjc1QwRkJUeXcwUWtGQk5FSXNUMEZCVHl4TFFVRkxMRlZCUVZVN1FVRkJRU3hGUVVNM1JpeEpRVUZKTEUxQlFVMHNiVUpCUVcxQ0xFdEJRVXNzWjBKQlFXZENMRk5CUVZNc1IwRkJSenRCUVVGQkxFbEJRekZFTEUxQlFVMHNZVUZCWVN4TFFVRkxMR2RDUVVGblFpeFRRVUZUTEVkQlFVYzdRVUZCUVN4SlFVTndSQ3hKUVVGSkxFdEJRVXNzYzBKQlFYTkNPMEZCUVVFc1RVRkhNMElzU1VGQlNTeFhRVUZYTEdOQlFXTXNTMEZCU3l4blFrRkJaMElzVTBGQlV5eE5RVUZOTEVsQlFVazdRVUZCUVN4UlFVTnFSU3hQUVVGUExHbERRVUZwUXp0QlFVRkJMRkZCUTNoRExFOUJRVThzVlVGQlZUdEJRVUZCTEZGQlEycENMRTlCUVU4c2MwTkJRWE5ETzBGQlFVRXNUVUZEYWtRN1FVRkJRU3hKUVVOS0xFVkJRVTg3UVVGQlFTeE5RVU5JTEVsQlFVa3NXVUZCV1R0QlFVRkJMRkZCUTFvc1QwRkJUeXhwUTBGQmFVTTdRVUZCUVN4TlFVTTFReXhGUVVGUExGTkJRVWtzVlVGQlZTeExRVUZMTEdkQ1FVRm5RaXhUUVVGVExFMUJRVTBzUjBGQlJ6dEJRVUZCTEZGQlEzaEVMRTlCUVU4c2FVTkJRV2xETzBGQlFVRXNVVUZEZUVNc1QwRkJUeXhWUVVGVk8wRkJRVUVzVFVGRGNrSTdRVUZCUVR0QlFVRkJMRVZCUlZJN1FVRkJRU3hGUVVOQkxFbEJRVWtzVFVGQlRTeHhRa0ZCY1VJc1MwRkJTeXhyUWtGQmEwSXNVMEZCVXp0QlFVRkJMRWxCUVVjc1QwRkJUeXh0UTBGQmJVTXNTMEZCU3l4clFrRkJhMElzUzBGQlN5eEpRVUZKTzBGQlFVRXNSVUZETlVrc1QwRkJUenRCUVVGQk96czdRVU16UWtvc1UwRkJVeXhwUWtGQmFVSXNRMEZCUXl4WFFVRjFRenRCUVVGQkxFVkJRM1pGTEUxQlFVMHNVVUZCVVN4UFFVRlBMR05CUVdNc1YwRkJWeXhaUVVGWk8wRkJRVUVzUlVGRE1VUXNUMEZCVHl4TlFVRk5MRkZCUVZFc2JVSkJRVzFDTEVWQlFVVTdRVUZCUVRzN08wRkRhMEp5UXl4VFFVRlRMR05CUVdNc1EwRkJReXhYUVVFd1FpeFRRVUZqTEZWQlFUWkRPMEZCUVVFc1JVRkRhRWdzVFVGQlRTeFBRVUZQTEZGQlFWRTdRVUZCUVN4RlFVTnlRaXhOUVVGTkxFOUJRVThzU1VGQlNUdEJRVUZCTEVWQlJXcENMRTFCUVUwc1QwRkJiVUlzUlVGQlJTeHJRa0ZCYTBJc1EwRkJReXhSUVVGUkxGTkJRVk1zUjBGQlJ5eHJRa0ZCYTBJc1EwRkJReXhuUWtGQlowSXNaVUZCWlN4SFFVRkhMRmxCUVZrc1RVRkJUU3hSUVVGUkxFMUJRVTBzUzBGQlN6dEJRVUZCTEVWQlF6VktMRTFCUVUwc2JVSkJRVzFDTEVsQlFVazdRVUZCUVN4RlFVTTNRaXhOUVVGTkxEaENRVUU0UWp0QlFVRkJMRVZCUTNCRExFMUJRVTBzYVVKQlFXbENMRU5CUVVNc1YwRkJhMFE3UVVGQlFTeEpRVU4wUlN4TlFVRk5MRTFCUVUwc1ZVRkJWVHRCUVVGQkxFbEJRM1JDTEVsQlFVa3NVMEZCVXl4cFFrRkJhVUlzU1VGQlNTeEhRVUZITzBGQlFVRXNTVUZEY2tNc1NVRkJTU3hYUVVGWE8wRkJRVUVzVFVGQlZ5eFBRVUZQTzBGQlFVRXNTVUZEYWtNc1NVRkJTU3hwUWtGQmFVSXNVVUZCVVR0QlFVRkJMRTFCUVRaQ0xHbENRVUZwUWl4TlFVRk5PMEZCUVVFc1NVRkRha1lzVTBGQlV5eHBRa0ZCYVVJc1RVRkJUU3hOUVVGTk8wRkJRVUVzU1VGRGRFTXNhVUpCUVdsQ0xFbEJRVWtzUzBGQlN5eE5RVUZOTzBGQlFVRXNTVUZEYUVNc1QwRkJUenRCUVVGQk8wRkJRVUVzUlVGSFdDeE5RVUZOTEhsQ1FVRnBSRHRCUVVGQkxFbEJRMjVFTEdsQ1FVRnBRanRCUVVGQkxFbEJRMnBDTEdkQ1FVRm5RanRCUVVGQkxFVkJRM0JDTzBGQlFVRXNSVUZGUVN4TlFVRk5MSFZDUVVFclF5eExRVUZMTEdWQlFXVXNTVUZCU1N4TlFVRk5MSFZDUVVGMVFqdEJRVUZCTEVWQlJ6RkhMRTFCUVUwc2IwSkJRVzlDTzBGQlFVRXNSVUZETVVJc1RVRkJUU3hsUVVGbE8wRkJRVUVzUlVGRGNrSXNUVUZCVFN4WFFVRlhPMEZCUVVFc1JVRkZha0lzVFVGQlRTeHRRa0ZCYlVJc1JVRkJSU3hOUVVGTkxFbEJRVWtzVVVGQlVTeExRVUZMTEZOQlFWTXNjVUpCUVhGQ08wRkJRVUVzUlVGSGFFWXNTVUZCU1N4MVFrRkJkVUk3UVVGQlFTeEZRVU16UWl4SlFVRkpMREJDUVVFd1FqdEJRVUZCTEVWQlF6bENMRTFCUVUwc2MwSkJRWE5DTEUxQlFXVTdRVUZCUVN4SlFVTjJReXhOUVVGTkxFbEJRVWtzVVVGQlVUdEJRVUZCTEVsQlEyeENMRWxCUVVrc1RVRkJUU3g1UWtGQmVVSTdRVUZCUVN4TlFVTXZRaXd3UWtGQk1FSTdRVUZCUVN4TlFVTXhRaXgxUWtGRFNTeERRVUZETEZGQlFWRXNiVUpCUVcxQ0xITkNRVUZ6UWl4TFFVTnNSQ3hEUVVGRExGRkJRVkVzYlVKQlFXMUNMSEZDUVVGeFFpeExRVU5xUkN4RFFVRkRMRkZCUVZFc2JVSkJRVzFDTEc5Q1FVRnZRaXhMUVVOb1JDeERRVUZETEZGQlFWRXNiVUpCUVcxQ0xIRkNRVUZ4UWl4TFFVTnFSQ3hEUVVGRExGRkJRVkVzYlVKQlFXMUNMSEZDUVVGeFFqdEJRVUZCTEVsQlEzcEVPMEZCUVVFc1NVRkRRU3hQUVVGUE8wRkJRVUU3UVVGQlFTeEZRVVZZTEUxQlFVMHNkMEpCUVhkQ0xFTkJRVU1zUTBGQlF5eFJRVUZSTzBGQlFVRXNSVUZIZUVNc1RVRkJUU3hoUVVGeFFqdEJRVUZCTEVsQlEzWkNMRWRCUVVjc1JVRkJSU3hOUVVGTkxFTkJRVU1zUjBGQlZTeE5RVUZOTEVsQlFVa3NTMEZCZDBJc1VVRkJVU3hOUVVGTkxFZEJRVWs3UVVGQlFTeEpRVU14UlN4UlFVRlJMRTFCUVUwN1FVRkJRU3hKUVVOa0xGRkJRVkVzU1VGQlNTeFZRVUZsTEVOQlFVTTdRVUZCUVN4SlFVTTFRaXhQUVVGUExFTkJRVU1zYVVKQlFYbENMR0ZCUVRaQ0xFTkJRVU03UVVGQlFTeEpRVU12UkN4TlFVRk5MRU5CUVVNc2FVSkJRWGxDTEdGQlFUWkNMRU5CUVVNN1FVRkJRU3hKUVVNNVJDeE5RVUZOTEVOQlFVTXNhVUpCUVhsQ0xHRkJRVFpDTEVOQlFVTTdRVUZCUVN4SlFVTTVSQ3hQUVVGUExFTkJRVU1zYVVKQlFYbENMR0ZCUVRaQ0xFTkJRVU03UVVGQlFTeEpRVU12UkN4VFFVRlRMRU5CUVVNc2FVSkJRWGxDTEdGQlFUWkNMRU5CUVVNN1FVRkJRU3hKUVVOcVJTeFZRVUZWTEVOQlFVTXNhVUpCUVhsQ0xHRkJRVFpDTEVOQlFVTTdRVUZCUVN4RlFVTjBSVHRCUVVGQkxFVkJTVUVzVFVGQlRTeHRRa0ZCZDBJN1FVRkJRU3hKUVVNeFFqdEJRVUZCTEVsQlEwRXNVMEZCVXl4UlFVRlJPMEZCUVVFc1NVRkRha0lzVVVGQlVUdEJRVUZCTEVsQlExSXNUVUZCVFN4UlFVRlJPMEZCUVVFc1NVRkRaQ3hwUWtGQmFVSXNVVUZCVVR0QlFVRkJMRWxCUTNwQ0xHbENRVUZwUWl4UlFVRlJPMEZCUVVFc1NVRkRla0lzVVVGQlVTeFJRVUZSTEZGQlFWRTdRVUZCUVN4SlFVTjRRaXhQUVVGUExGVkJRVlU3UVVGQlFTeEpRVU5xUWl4WFFVRlhMRTFCUVUwN1FVRkJRU3hKUVVOcVFpeEhRVUZITzBGQlFVRXNTVUZEU0N4SlFVRkpMRU5CUVVNc1VVRkJZU3hIUVVGUk8wRkJRVUVzVFVGQlJTeFBRVUZQTEZOQlFWTXNUMEZCVHl4TlFVRk5MRkZCUVZFc1EwRkJRenRCUVVGQk8wRkJRVUVzUlVGRGRFVTdRVUZCUVN4RlFVZEJMRWxCUVVrc2IwSkJRWGxDTzBGQlFVRXNSVUZETjBJc1NVRkJTU3h0UWtGQmEwTTdRVUZCUVN4RlFVVjBReXhKUVVGSkxIVkNRVUUwUWp0QlFVRkJMRVZCUTJoRExFbEJRVWtzWjBKQlFYRkNPMEZCUVVFc1JVRkRla0lzU1VGQlNTeDFRa0ZCWjBNN1FVRkJRU3hGUVVWd1F5eE5RVUZOTEZGQlFWRXNUMEZCVHl4WlFVMUpPMEZCUVVFc1NVRkRja0lzVFVGQlRTeG5Ra0ZCWjBJc1MwRkJTeXhQUVVGUE8wRkJRVUVzU1VGRGJFTXNUVUZCVFN4WFFVRlhMRTFCUVUwc1QwRkJUeXh4UWtGQmNVSXNSVUZCUlN4aFFVRmhMR05CUVdNc1EwRkJRenRCUVVGQkxFbEJRMnBHTEUxQlFVMHNaVUZCWlN4WlFVRTJRanRCUVVGQkxFMUJRemxETEUxQlFVMHNWVUZCVnl4UlFVRlJMRkZCUVdkQ08wRkJRVUVzVFVGRGVrTXNTVUZCU1N4WlFVRlpMRmRCUVZjN1FVRkJRU3hSUVVOMlFpeEpRVUZKTEU5QlFVOHNXVUZCV1N4WlFVRlpMRkZCUVZFc1UwRkJVenRCUVVGQkxGVkJRV1VzVFVGQlRTeFRRVUZUTzBGQlFVRXNVVUZEYkVZc1QwRkJUenRCUVVGQkxFMUJRMWc3UVVGQlFTeE5RVU5CTEUxQlFVMHNaMEpCUVdkQ0xFOUJRVThzVVVGQlVTeFJRVUZSTEZGQlFWRXNTVUZCU1N4blFrRkJaMElzUzBGQlN5eEhRVUZITzBGQlFVRXNUVUZEYWtZc1NVRkJTU3hQUVVGUExGTkJRVk1zWVVGQllTeExRVUZMTEdkQ1FVRm5RanRCUVVGQkxGRkJRV1VzVFVGQlRTeFRRVUZUTzBGQlFVRXNUVUZEY0VZc1NVRkJTU3hEUVVGRExGRkJRVkVzVVVGQlVUdEJRVUZCTEZGQlFVMHNUMEZCVHp0QlFVRkJMRTFCUTJ4RExFMUJRVTBzVTBGQlV5eFJRVUZSTEZGQlFWRXNTMEZCU3l4VlFVRlZPMEZCUVVFc1RVRkRPVU1zVFVGQlRTeFZRVUZWTEVsQlFVazdRVUZCUVN4TlFVTndRaXhKUVVGSkxFOUJRVTg3UVVGQlFTeE5RVU5ZTEVsQlFVazdRVUZCUVN4UlFVTkJMRTlCUVU4c1RVRkJUVHRCUVVGQkxGVkJRMVFzVVVGQlVTeE5RVUZOTEZWQlFWVXNUVUZCVFN4UFFVRlBMRXRCUVVzN1FVRkJRU3hWUVVNeFF5eEpRVUZKTzBGQlFVRXNXVUZCVFR0QlFVRkJMRlZCUTFZc1VVRkJVU3hSUVVGUkxFOUJRVThzVDBGQlR5eEZRVUZGTEZGQlFWRXNTMEZCU3l4RFFVRkRPMEZCUVVFc1ZVRkRPVU1zU1VGQlNTeExRVUZMTEZOQlFWTXNaVUZCWlR0QlFVRkJMRmxCUXpkQ0xFMUJRVTBzVDBGQlR5eFBRVUZQTEVWQlFVVXNUVUZCVFN4TlFVRk5MRVZCUVVVN1FVRkJRU3haUVVOd1F5eE5RVUZOTEZOQlFWTTdRVUZCUVN4VlFVTnVRanRCUVVGQkxGRkJRMG83UVVGQlFTeFJRVU5CTEZGQlFWRXNVVUZCVVN4UFFVRlBPMEZCUVVFc1owSkJRM3BDTzBGQlFVRXNVVUZEUlN4UFFVRlBMRmxCUVZrN1FVRkJRVHRCUVVGQkxFMUJSWFpDTEU5QlFVODdRVUZCUVR0QlFVRkJMRWxCU1Znc1RVRkJUU3hUUVVGVkxGRkJRVkVzVVVGQlowSXNXVUZCV1N4UlFVRlJMRkZCUVZFc1VVRkJVU3hKUVVGSkxGRkJRVkU3UVVGQlFTeEpRVVY0Uml4SlFVRkpMRkZCUVZFc1VVRkJVU3hYUVVGWExGZEJRVmM3UVVGQlFTeE5RVU4wUXl4UFFVRlBMRWxCUVVrc1UwRkJVeXhYUVVGWE8wRkJRVUVzVVVGRE0wSXNVMEZCVXl4bFFVRmxMRTFCUVUwN1FVRkJRU3hOUVVOc1F5eERRVUZETzBGQlFVRXNTVUZEVER0QlFVRkJMRWxCUjBFc1RVRkJUU3hYUVVGWkxGRkJRVkVzVVVGQlowSXNZMEZCWXl4SlFVRkpMRWxCUVVrc1VVRkJVU3hSUVVGUkxFZEJRVWNzUlVGQlJUdEJRVUZCTEVsQlEzSkdMRWxCUVVrc1UwRkJVeXhUUVVGVExHVkJRV1VzUjBGQlJ6dEJRVUZCTEUxQlEzQkRMRTFCUVUwc1kwRkJZeXhsUVVGbExFMUJRVTA3UVVGQlFTeE5RVU42UXl4UFFVRlBMRWxCUVVrc1UwRkJVeXhOUVVGTk8wRkJRVUVzVVVGRGRFSXNVVUZCVVR0QlFVRkJMRkZCUTFJc1UwRkJVenRCUVVGQkxGVkJRMHdzVVVGQlVUdEJRVUZCTEdGQlEwdzdRVUZCUVN4VlFVTklMR2xDUVVGcFFqdEJRVUZCTEZWQlEycENMR2RDUVVGblFpeHZRa0ZCYjBJc1MwRkJTeXhKUVVGSk8wRkJRVUVzVVVGRGFrUTdRVUZCUVN4TlFVTktMRU5CUVVNN1FVRkJRU3hKUVVOTU8wRkJRVUVzU1VGRlFTeE5RVUZOTEdWQlFXZENMRkZCUVZFc1VVRkJaMEk3UVVGQlFTeEpRVU01UXl4SlFVRkpPMEZCUVVFc1NVRkRTaXhKUVVGSk8wRkJRVUVzU1VGRFNpeEpRVUZKTEVOQlFVTXNVVUZCVVN4alFVRmpMRU5CUVVNc1VVRkJVU3h0UWtGQmJVSXNVVUZCVVN4dlFrRkJiMElzU1VGQlNUdEJRVUZCTEUxQlEyNUdMR0ZCUVdFN1FVRkJRU3hOUVVOaUxGbEJRVmtzWjBKQlFXZENMRk5CUVZNc1ZVRkJWU3hEUVVGRExFVkJRVVVzVFVGQlRTeEhRVUZITzBGQlFVRXNTVUZETDBRc1JVRkJUenRCUVVGQkxFMUJRMGdzV1VGQldTeG5Ra0ZCWjBJc1UwRkJVeXhWUVVGVkxFTkJRVU1zUlVGQlJTeE5RVUZOTEVkQlFVYzdRVUZCUVN4TlFVTXpSQ3hKUVVGSkxGRkJRVkVzWVVGQllTeFZRVUZWTEVkQlFVY3NRMEZCUXl4TlFVRk5MRkZCUVZFc1YwRkJWenRCUVVGQkxGRkJRelZFTEUxQlFVMHNZMEZCWXl4bFFVRmxMRTFCUVUwN1FVRkJRU3hSUVVONlF5eEpRVUZKTEZGQlFWRTdRVUZCUVN4VlFVRmhMRTlCUVU4c1JVRkJSU3hsUVVGbExFMUJRVTBzVFVGQlRTeEpRVUZKTEZGQlFWRXNTMEZCU3l4VFFVRlRMRmxCUVZrN1FVRkJRU3hSUVVOdVJ5eFBRVUZQTEVsQlFVa3NVMEZCVXl4WFFVRlhPMEZCUVVFc1ZVRkRNMElzVVVGQlVUdEJRVUZCTEZWQlExSXNVMEZCVXp0QlFVRkJMRkZCUTJJc1EwRkJRenRCUVVGQkxFMUJRMHc3UVVGQlFTeE5RVU5CTEVsQlFVa3NVVUZCVVN4dlFrRkJiMElzWVVGQllTeFJRVUZSTEc5Q1FVRnZRanRCUVVGQkxGRkJRVWNzV1VGQldTeFZRVUZWTEUxQlFVMHNVVUZCVVN4bFFVRmxPMEZCUVVFc1RVRkRMMGdzWVVGQllTeEpRVUZKTEZWQlFWVXNTMEZCU3l4SFFVRkhPMEZCUVVFN1FVRkJRU3hKUVVsMlF5eE5RVUZOTEZkQlFWa3NVVUZCVVN4UlFVRm5RanRCUVVGQkxFbEJRekZETEUxQlFVMHNTMEZCU3l4UlFVRlJMRk5CUVZNc1VVRkJVU3hQUVVGUExGRkJRVkVzVVVGQlVTeFBRVUZQTEVsQlFVazdRVUZCUVN4SlFVZDBSU3hKUVVGSkxGRkJRVkVzV1VGQldTeFZRVUZWTEZkQlFWY3NWMEZCVnl4VlFVRlZMRWRCUVVjN1FVRkJRU3hOUVVOcVJTeE5RVUZOTEdGQlFXRXNiVUpCUVcxQ0xGZEJRVmNzVFVGQlRTeERRVUZETEVOQlFVTTdRVUZCUVN4TlFVTjZSQ3hKUVVGSk8wRkJRVUVzVFVGRFNpeEpRVUZKTzBGQlFVRXNVVUZGUVN4SlFVRkpMRTlCUVU4c1UwRkJVeXhoUVVGaE8wRkJRVUVzVlVGRE4wSXNXVUZCV1N4TFFVRkxMRlZCUVZVN1FVRkJRU3hSUVVNdlFpeEZRVUZQTEZOQlFVa3NUMEZCVHl4WFFVRlhMR0ZCUVdFN1FVRkJRU3hWUVVOMFF5eFpRVUZaTEU5QlFVOHNTMEZCU3l4WlFVRlpMRkZCUVZFc1JVRkJSU3hUUVVGVE8wRkJRVUVzVVVGRE0wUXNSVUZCVHp0QlFVRkJMRlZCUTBnc1RVRkJUU3hKUVVGSkxFMUJRVTBzTmtKQlFUWkNPMEZCUVVFN1FVRkJRU3hSUVVWdVJDeE5RVUZOTzBGQlFVRXNVVUZEU2l4TlFVRk5MR05CUVdNc1pVRkJaU3hOUVVGTk8wRkJRVUVzVVVGRGVrTXNUVUZCVFN4UFFVRlBMRXRCUVVzc1ZVRkJWU3hGUVVGRkxGTkJRVk1zVDBGQlR5eE5RVUZOTERaQ1FVRTJRaXhSUVVGUkxFVkJRVVVzVlVGQlZTd3dRa0ZCTUVJc1JVRkJSU3hEUVVGRE8wRkJRVUVzVVVGRGJFa3NTVUZCU1N4UlFVRlJPMEZCUVVFc1ZVRkJZU3hQUVVGUExFVkJRVVVzWlVGQlpTeE5RVUZOTEUxQlFVMHNVVUZCVVN4TFFVRkxMRk5CUVZNc1MwRkJTeXhoUVVGaExHZENRVUZuUWl4dFFrRkJiVUlzUlVGQlJUdEJRVUZCTEZGQlF6RkpMRTlCUVU4c1NVRkJTU3hUUVVGVExFMUJRVTBzUlVGQlJTeFJRVUZSTEV0QlFVc3NVMEZCVXl4TFFVRkxMR0ZCUVdFc1owSkJRV2RDTEcxQ1FVRnRRaXhGUVVGRkxFTkJRVU03UVVGQlFUdEJRVUZCTEUxQlJ6bEhMRWxCUVVrc1dVRkJhVUk3UVVGQlFTeE5RVU55UWl4TlFVRk5MRlZCUVZVc1RVRkJUU3hoUVVGaE8wRkJRVUVzVFVGRGJrTXNTVUZCU1N4WFFVRlhMRmxCUVZrc1RVRkJUU3haUVVGWkxFMUJRVTA3UVVGQlFTeFJRVU12UXl4SlFVRkpPMEZCUVVFc1ZVRkRRU3haUVVGWkxHZENRVUZuUWl4TFFVRkxMRTFCUVUwc1QwRkJUeXhEUVVGRE8wRkJRVUVzVlVGRGFrUXNUVUZCVFR0QlFVRkJMRlZCUTBvc1RVRkJUU3hqUVVGakxHVkJRV1VzVFVGQlRUdEJRVUZCTEZWQlEzcERMRTFCUVUwc1QwRkJUeXhMUVVGTExGVkJRVlVzUlVGQlJTeFRRVUZUTEU5QlFVOHNUVUZCVFN3MlFrRkJOa0lzVVVGQlVTeEZRVUZGTEZWQlFWVXNUMEZCVHl4RlFVRkZMRU5CUVVNN1FVRkJRU3hWUVVNdlJ5eEpRVUZKTEZGQlFWRTdRVUZCUVN4WlFVRmhMRTlCUVU4c1JVRkJSU3hsUVVGbExFMUJRVTBzVFVGQlRTeFJRVUZSTEV0QlFVc3NVMEZCVXl4TFFVRkxMR0ZCUVdFc1owSkJRV2RDTEcxQ1FVRnRRaXhGUVVGRk8wRkJRVUVzVlVGRE1Va3NUMEZCVHl4SlFVRkpMRk5CUVZNc1RVRkJUU3hGUVVGRkxGRkJRVkVzUzBGQlN5eFRRVUZUTEV0QlFVc3NZVUZCWVN4blFrRkJaMElzYlVKQlFXMUNMRVZCUVVVc1EwRkJRenRCUVVGQk8wRkJRVUVzVFVGRmJFZzdRVUZCUVN4TlFVVkJMRTFCUVUwc1dVRkJXU3hYUVVGWE8wRkJRVUVzVFVGRE4wSXNUVUZCVFN4alFVRmpMR1ZCUVdVc1RVRkJUVHRCUVVGQkxFMUJRM3BETEUxQlFVMHNZMEZCWXl4TFFVRkxMR0ZCUVdFc1owSkJRV2RDTEc5Q1FVRnZRaXhwUWtGQmFVSXNWMEZCVnp0QlFVRkJMRTFCUzNSSExFbEJRVWtzWVVGQllTeFBRVUZQTEdOQlFXTXNXVUZCV1N4RFFVRkRMRTFCUVUwc1VVRkJVU3hUUVVGVExFdEJRVXNzUlVGQlJTeGhRVUZoTEZsQlFWazdRVUZCUVN4UlFVTjBSeXhOUVVGTkxGVkJRV1VzUTBGQlF6dEJRVUZCTEZGQlEzUkNMRkZCUVZFc1UwRkJVenRCUVVGQkxGRkJRMnBDTEZGQlFWRXNVVUZCVVR0QlFVRkJMRkZCUTJoQ0xGRkJRVkVzVlVGQlZTeFJRVUZSTzBGQlFVRXNVVUZETVVJc1VVRkJVU3haUVVGWk8wRkJRVUVzVVVGRGNFSXNVVUZCVVN4UFFVRlBPMEZCUVVFc1VVRkRaaXhSUVVGUkxFOUJRVThzVVVGQlVUdEJRVUZCTEZGQlEzWkNMRkZCUVZFc2EwSkJRV3RDTEZGQlFWRTdRVUZCUVN4UlFVTnNReXhSUVVGUkxHdENRVUZyUWl4UlFVRlJPMEZCUVVFc1VVRkRiRU1zVVVGQlVTeEpRVUZKTzBGQlFVRXNVVUZEV2l4UlFVRlJMRk5CUVZNc1VVRkJVU3hSUVVGUk8wRkJRVUVzVVVGRGFrTXNVVUZCVVN4UlFVRlJMRlZCUVZVN1FVRkJRU3hSUVVNeFFpeFJRVUZSTEU5QlFVOHNRMEZCUXl4UlFVRmhMRmRCUVdkQ0xGTkJRVk1zVDBGQlR5eFRRVUZUTEZGQlFWRXNUVUZCVFR0QlFVRkJMRkZCUTNCR0xGRkJRVkVzV1VGQldTeE5RVUZOTzBGQlFVRXNVVUZETVVJc1RVRkJUU3hUUVVGVExHRkJRV0VzVTBGQlV5eFpRVUZaTEZOQlFWTTdRVUZCUVN4UlFVTXhSQ3hSUVVGUkxGTkJRVk03UVVGQlFTeFJRVU5xUWl4UlFVRlJMRTlCUVU4N1FVRkJRU3hWUVVOWU8wRkJRVUVzVlVGRFFTeFJRVUZSTEVWQlFVVXNVVUZCVVN4WFFVRlhMRWxCUVVrc1VVRkJVU3hWUVVGVk8wRkJRVUVzVlVGRGJrUXNVMEZCVXl4UlFVRlJPMEZCUVVFc1VVRkRja0k3UVVGQlFTeFJRVU5CTEZGQlFWRXNWVUZCVlN4UlFVRlJMRkZCUVZFN1FVRkJRU3hSUVVOc1F5eFZRVUZWTEZWQlFWVTdRVUZCUVN4UlFVVndRaXhOUVVGTkxHMUNRVUZ0UWl4RFFVRkRMRmxCUVhGQ08wRkJRVUVzVlVGRE0wTXNTVUZCU1N4UlFVRlJMRzFDUVVGdFFpeHhRa0ZCY1VJc1MwRkJTeXhOUVVGTk8wRkJRVUVzV1VGRE0wUXNUMEZCVHl4UlFVRlJMRXRCUVVzc2RVSkJRWFZDTEVWQlFVVXNWMEZCVnl4UlFVRlJMRTFCUVUwc1dVRkJXU3hOUVVGTkxGRkJRVkVzVFVGQlRTeFRRVUZUTEZGQlFWRXNVVUZCVVN4VFFVRlRMRk5CUVZNc1UwRkJVeXhSUVVGUkxFMUJRVTBzUTBGQlF6dEJRVUZCTEZWQlF6ZExPMEZCUVVFN1FVRkJRU3hSUVVkS0xFbEJRVWs3UVVGQlFTeFZRVWRCTEVsQlFVa3NVVUZCVVN4dFFrRkJiVUlzYzBKQlFYTkNMRXRCUVVzc1RVRkJUVHRCUVVGQkxGbEJRelZFTEUxQlFVMHNVVUZCVVN4TFFVRkxMSGRDUVVGM1FpeEZRVUZGTEZkQlFWY3NVVUZCVVN4TlFVRk5MRmxCUVZrc1RVRkJUU3hEUVVGRExFZEJRVWNzVTBGQlV5eFJRVUZSTEUxQlFVMHNRMEZCUXp0QlFVRkJMRlZCUTNoSU8wRkJRVUVzVlVGRFFTeE5RVUZOTEZGQlFWRXNTMEZCU3l4WFFVRlhMRk5CUVZNN1FVRkJRU3hWUVVONlF5eFBRVUZQTEZkQlFWYzdRVUZCUVN4VlFVTm9RaXhOUVVGTkxGbEJRVmtzYVVKQlFXbENMRmRCUVZjc1VVRkJVU3hUUVVGVE8wRkJRVUVzVlVGREwwUXNUVUZCVFN4VlFVRlZMRXRCUVVzc1ZVRkJWU3hUUVVGVE8wRkJRVUVzVlVGRGVFTXNTVUZCU1R0QlFVRkJMRmxCUTBFc1RVRkJUU3hwUWtGQmFVSXNTMEZCU3p0QlFVRkJMRmxCUXpsQ0xFMUJRVTA3UVVGQlFTeFZRVU5TTEVsQlFVa3NVVUZCVVR0QlFVRkJMRmxCUVdFc1QwRkJUeXhGUVVGRkxHVkJRV1VzVFVGQlRTeE5RVUZOTEZOQlFWTXNVVUZCVVN4TFFVRkxMRk5CUVZNc1dVRkJXVHRCUVVGQkxGVkJRM2hITEU5QlFVOHNTVUZCU1N4VFFVRlRMRk5CUVZNc1JVRkJSU3hSUVVGUkxFdEJRVXNzVTBGQlV5eFpRVUZaTEVOQlFVTTdRVUZCUVR0QlFVRkJMRkZCUjNSRkxFbEJRVWs3UVVGQlFTeFZRVU5CTEUxQlFVMHNhVUpCUVdsQ0xFbEJRVWs3UVVGQlFTeFZRVU0zUWl4TlFVRk5PMEZCUVVFc1RVRkRXaXhGUVVGUE8wRkJRVUVzVVVGRFNDeEpRVUZKTzBGQlFVRXNWVUZEUVN4TlFVRk5MRkZCUVZFc1MwRkJTeXhYUVVGWExGTkJRVk03UVVGQlFTeFZRVU42UXl4UFFVRlBMRmRCUVZjN1FVRkJRU3hWUVVOb1FpeE5RVUZOTEZsQlFWa3NhVUpCUVdsQ0xGZEJRVmNzV1VGQldTeFRRVUZUTzBGQlFVRXNWVUZEYmtVc1RVRkJUU3hWUVVGVkxFdEJRVXNzVlVGQlZTeFRRVUZUTzBGQlFVRXNWVUZEZUVNc1NVRkJTU3hSUVVGUk8wRkJRVUVzV1VGQllTeFBRVUZQTEVWQlFVVXNaVUZCWlN4TlFVRk5MRTFCUVUwc1UwRkJVeXhSUVVGUkxFdEJRVXNzVTBGQlV5eFpRVUZaTzBGQlFVRXNWVUZEZUVjc1QwRkJUeXhKUVVGSkxGTkJRVk1zVTBGQlV5eEZRVUZGTEZGQlFWRXNTMEZCU3l4VFFVRlRMRmxCUVZrc1EwRkJRenRCUVVGQk8wRkJRVUU3UVVGQlFTeE5RVWt4UlN4TlFVRk5MRTlCUVU4c1YwRkJWeXhMUVVGTExGVkJRVlVzWVVGQllTeERRVUZETEVkQlFVY3NRMEZCUXl4TFFVRkxMRlZCUVZVc1VVRkJVU3haUVVGWkxGbEJRVmtzUzBGQlN5eHJRa0ZCYTBJN1FVRkJRU3hOUVVNdlNDeEpRVUZKTEZGQlFWRTdRVUZCUVN4UlFVRmhMRTlCUVU4c1JVRkJSU3hsUVVGbExFMUJRVTBzVFVGQlRTeFJRVUZSTEV0QlFVc3NVMEZCVXl4WlFVRlpPMEZCUVVFc1RVRkRMMFlzVDBGQlR5eEpRVUZKTEZOQlFWTXNUVUZCVFN4RlFVRkZMRkZCUVZFc1MwRkJTeXhUUVVGVExGbEJRVmtzUTBGQlF6dEJRVUZCTEVsQlEyNUZPMEZCUVVFc1NVRlJRU3hKUVVGSkxGRkJRVkVzWlVGQlpTeERRVUZETEZWQlFWVXNiMEpCUVc5Q0xFZEJRVWM3UVVGQlFTeE5RVU42UkN4TlFVRk5MR0ZCUVdNc1VVRkJVU3hSUVVGblFqdEJRVUZCTEUxQlF6VkRMRWxCUVVrc1pVRkJaU3hQUVVGUE8wRkJRVUVzVVVGRmRFSXNTVUZCU1N4alFVRmpMRkZCUVZFN1FVRkJRU3hSUVVNeFFpeEpRVUZKTEVOQlFVTXNZVUZCWVR0QlFVRkJMRlZCUTJRc1NVRkJTU3hsUVVGbExHOUNRVUZ2UWl4dFFrRkJiVUk3UVVGQlFTeFpRVU4wUkN4alFVRmpPMEZCUVVFc1ZVRkRiRUlzUlVGQlR6dEJRVUZCTEZsQlEwZ3NZMEZCWXl4TFFVRkxMRWxCUVVrc1ZVRkJWVHRCUVVGQkxGbEJRMnBETEVsQlFVa3NaMEpCUVdkQ0xFMUJRVTA3UVVGQlFTeGpRVU4wUWl4dlFrRkJiMEk3UVVGQlFTeGpRVU53UWl4dFFrRkJiVUk3UVVGQlFTeFpRVU4yUWl4RlFVRlBPMEZCUVVFc1kwRkRTQ3hqUVVGakxGVkJRVlVzWTBGQll6dEJRVUZCTEdOQlEzUkRMRWxCUVVrc1owSkJRV2RDTEZkQlFWY3NRMEZGTDBJc1JVRkJUenRCUVVGQkxHZENRVU5JTEVsQlFVa3NUMEZCVHl4WlFVRlpMRmRCUVZjN1FVRkJRU3hyUWtGQldTeFpRVUZaTEZOQlFWTXNUVUZCVFN4WlFVRlpPMEZCUVVFc1owSkJRMmhHTzBGQlFVRXNPRUpCUVZrc1UwRkJVeXhOUVVGTkxGbEJRVmtzVDBGQlR6dEJRVUZCTEdkQ1FVTnVSQ3hMUVVGTExFbEJRVWtzV1VGQldTeFhRVUZYTzBGQlFVRXNaMEpCUTJoRExHOUNRVUZ2UWp0QlFVRkJMR2RDUVVOd1FpeHRRa0ZCYlVJN1FVRkJRVHRCUVVGQk8wRkJRVUU3UVVGQlFTeFJRVWx1UXp0QlFVRkJMRkZCUlVFc1NVRkJTU3hsUVVGbExGbEJRVmtzVTBGQlV5eFZRVUZWTzBGQlFVRXNWVUZGT1VNc1NVRkJTU3hwUWtGQmFVSTdRVUZCUVN4VlFVTnlRaXhKUVVGSkxGVkJRVlU3UVVGQlFTeFZRVU5rTEVsQlFVa3NhVUpCUVdsQ08wRkJRVUVzVlVGRGNrSXNTVUZCU1N4blFrRkJaMElzYlVKQlFXMUNPMEZCUVVFc1dVRkRia01zYVVKQlFXbENMRmxCUVZrN1FVRkJRU3haUVVNM1FpeFZRVUZWTEZsQlFWa3NUMEZCVHp0QlFVRkJMRmxCUXpkQ0xFMUJRVTBzVDBGQlR5eFpRVUZaTEZGQlFWRTdRVUZCUVN4WlFVTnFReXhwUWtGQmFVSXNUVUZCVFN4bFFVRmxMRk5CUVZVc1RVRkJUU3hSUVVGUkxFMUJRVTBzVlVGQlZTeExRVUZMTEVOQlFVTXNTMEZCU3l4WFFVRlhMRk5CUVZNc1VVRkJVVHRCUVVGQkxGbEJRM0pJTEhWQ1FVRjFRanRCUVVGQkxGbEJRM1pDTEdkQ1FVRm5RanRCUVVGQkxGbEJRMmhDTEhWQ1FVRjFRanRCUVVGQkxGVkJRek5DTzBGQlFVRXNWVUZGUVN4TlFVRk5MRmxCUVZrc1YwRkJWenRCUVVGQkxGVkJRemRDTEUxQlFVMHNUMEZCVHl4TlFVRk5MR0ZCUVdFN1FVRkJRU3hWUVVkb1F5eEpRVUZKTzBGQlFVRXNWVUZEU2l4SlFVRkpMRmRCUVZjN1FVRkJRU3hWUVVObUxFbEJRVWtzUTBGQlF5eFJRVUZSTEZOQlFWTXNUVUZCVFN4VFFVRlRMRTFCUVUwN1FVRkJRU3haUVVOMlF5eFRRVUZUTEVOQlFVTTdRVUZCUVN4VlFVTmtMRVZCUVU4N1FVRkJRU3haUVVOSUxFbEJRVWs3UVVGQlFTeGpRVU5CTEZOQlFWTXNaMEpCUVdkQ0xFdEJRVXNzVFVGQlRTeEpRVUZKTEVOQlFVTTdRVUZCUVN4alFVTjZReXhKUVVGSkxFOUJRVThzVjBGQlZ6dEJRVUZCTEdkQ1FVRmhMRk5CUVZNc1EwRkJRenRCUVVGQkxHTkJReTlETEUxQlFVMDdRVUZCUVN4alFVTktMRmRCUVZjN1FVRkJRVHRCUVVGQk8wRkJRVUVzVlVGSmJrSXNTVUZCU1N4WlFVRlpMRmRCUVZjc1VVRkJVU3hQUVVGUExGZEJRVmNzV1VGQldTeERRVUZETEUxQlFVMHNVVUZCVVN4TlFVRk5MRWRCUVVjN1FVRkJRU3haUVVWeVJpeEpRVUZKTEZGQlFWRXNXVUZCV1N4VlFVRlZMRVZCUVVVc01rSkJRVEpDTEZOQlFWTTdRVUZCUVN4alFVVndSU3hKUVVGSkxFTkJRVU1zWjBKQlFXZENPMEZCUVVFc1owSkJRMnBDTEUxQlFVMHNZVUZCWVN4bFFVRmxMRTFCUVUwN1FVRkJRU3huUWtGRGVFTXNTVUZCU1N4RFFVRkRMRmRCUVZjc1UwRkJVenRCUVVGQkxHdENRVVZ5UWl4WFFVRlhPMEZCUVVFc1owSkJRMlk3UVVGQlFTeGpRVU5LTzBGQlFVRXNZMEZGUVN4SlFVRkpMRlZCUVZVN1FVRkJRU3huUWtGRlZpeE5RVUZOTEZWQlFXVXNUMEZCVHl4UFFVRlBMR2RDUVVGblFqdEJRVUZCTEdkQ1FVTnVSQ3hSUVVGUkxFOUJRVTg3UVVGQlFTeG5Ra0ZEWml4UlFVRlJMRmxCUVZrN1FVRkJRU3huUWtGRGNFSXNVVUZCVVN4WlFVRlpPMEZCUVVFc1owSkJRM0JDTEZGQlFWRXNUMEZCVHp0QlFVRkJMR3RDUVVOWUxFdEJRVXM3UVVGQlFTeHJRa0ZEVER0QlFVRkJMR3RDUVVOQkxFMUJRVTBzUlVGQlJTeFJRVUZSTEZsQlFWa3NUMEZCVHl4VlFVRlZPMEZCUVVFc2EwSkJRemRETEZGQlFWRXNSVUZCUlN4UlFVRlJMRTFCUVUwc1VVRkJVU3hQUVVGUE8wRkJRVUVzYTBKQlEzWkRMRk5CUVZNc1VVRkJVVHRCUVVGQkxHdENRVU5xUWl4VlFVRlZPMEZCUVVFc2EwSkJRMVk3UVVGQlFTeG5Ra0ZEU2p0QlFVRkJMR2RDUVVOQkxGRkJRVkVzVlVGQlZTeFJRVUZSTEZGQlFWRTdRVUZCUVN4blFrRkZiRU1zU1VGQlNUdEJRVUZCTEd0Q1FVTkJMRTFCUVUwc1UwRkJVeXhOUVVGTkxGRkJRVkVzVTBGQlV5eE5RVUZOTzBGQlFVRXNhMEpCUlRWRExFbEJRVWtzVjBGQlZ5eGhRVUZoTEZkQlFWY3NVVUZCVVN4WFFVRlhMRWxCUVVrN1FVRkJRU3h2UWtGRE1VUXNUMEZCVHl4RlFVRkZMR1ZCUVdVc1RVRkJUU3hOUVVGTkxHOUNRVUZ2UWl4WlFVRlpMRlZCUVZVc1VVRkJVU3hMUVVGTExGTkJRVk1zY1VKQlFYRkNPMEZCUVVFc2EwSkJRemRJTEVWQlFVOHNVMEZCU1N4RFFVRkRMRTFCUVUwc1VVRkJVU3hOUVVGTkxFdEJRVXNzVDBGQlR5eFhRVUZYTEZWQlFWVTdRVUZCUVN4dlFrRkROMFFzVDBGQlR5eEZRVUZGTEdWQlFXVXNUVUZCVFN4TlFVRk5MR1ZCUVdVc1MwRkJTeXhWUVVGVkxFMUJRVTBzU1VGQlNTeHRRa0ZCYlVJc1dVRkJXU3hWUVVGVkxGRkJRVkVzUzBGQlN5eFRRVUZUTEhGQ1FVRnhRanRCUVVGQkxHdENRVU53U3p0QlFVRkJMR3RDUVVWR0xFMUJRVTA3UVVGQlFTeGpRVWRhTzBGQlFVRXNXVUZEU2p0QlFVRkJMRlZCUTBvN1FVRkJRU3hSUVVOS08wRkJRVUVzVFVGRFNqdEJRVUZCTEVsQlEwbzdRVUZCUVN4SlFVZEJMRTFCUVUwc1kwRkJZeXhsUVVGbExFMUJRVTA3UVVGQlFTeEpRVU42UXl4TlFVRk5MR1ZCUVdVc1UwRkJVeXhaUVVGWkxFMUJRVTBzVVVGQlVTeFZRVUZWTEZGQlFWRXNVVUZCVVN4UFFVRlBMRWxCUVVrc1YwRkJWenRCUVVGQkxFbEJRM2hITEUxQlFVMHNXVUZCV1N4clFrRkJhMElzV1VGQldTeExRVUZMTEZkQlFWYzdRVUZCUVN4SlFVTm9SU3hOUVVGTkxHdENRVUZyUWl4RFFVRkRMRzlDUVVGdlFqdEJRVUZCTEVsQlJUZERMRTFCUVUwc1UwRkJVeXhoUVVGaExGTkJRVk1zV1VGQldTeFRRVUZUTzBGQlFVRXNTVUZETVVRc1NVRkJTVHRCUVVGQkxFMUJRV2xDTEZGQlFWRXNVVUZCVVN4UlFVRlJMRWxCUVVrc1YwRkJWeXhGUVVGRkxFOUJRVThzUTBGQlF6dEJRVUZCTEVsQlJYUkZMRTFCUVUwc1kwRkJjME1zVTBGQlV5eExRVUZMTEdkQ1FVRm5RaXgxUWtGQmRVSXNTVUZCU1R0QlFVRkJMRWxCUlhKSExFbEJRVWtzVlVGQk5rTXNRMEZCUXp0QlFVRkJMRWxCUld4RUxFMUJRVTBzVjBGQkswSTdRVUZCUVN4TlFVTnFReXhOUVVGTk8wRkJRVUVzVFVGRFRpeFJRVUZSTzBGQlFVRXNUVUZEVWl4VFFVRlRMRXRCUVVzc1dVRkJXVHRCUVVGQkxFbEJRemxDTzBGQlFVRXNTVUZKUVN4TlFVRk5MRmxCUVZrc1ZVRkJWU3hYUVVGWExGVkJRVlVzU1VGQlNTeFZRVUZWTEV0QlFVczdRVUZCUVN4SlFVVndSU3hOUVVGTkxFOUJRVzlDTzBGQlFVRXNUVUZEZEVJc1MwRkJTenRCUVVGQkxFMUJRMHc3UVVGQlFTeE5RVU5CTEUxQlFVMHNSVUZCUlN4UlFVRlJMRmxCUVhkRUxFOUJRVThzVlVGQlZUdEJRVUZCTEUxQlEzcEdMRkZCUVZFN1FVRkJRU3hSUVVkS0xGRkJRVkVzV1VGQldTeExRVUZOTEUxQlFVMHNZVUZCWVR0QlFVRkJMRkZCUXpkRExGRkJRVkU3UVVGQlFTeE5RVU5hTzBGQlFVRXNUVUZEUVN4VFFVRlRMRkZCUVZFN1FVRkJRU3hOUVVOcVFqdEJRVUZCTEUxQlEwRTdRVUZCUVN4SlFVTktPMEZCUVVFc1NVRkZRU3hOUVVGTkxGVkJRV1VzUlVGQlJTeFJRVUZSTEUxQlFVMDdRVUZCUVN4SlFVTnlReXhKUVVGSk8wRkJRVUVzVFVGRlFTeE5RVUZOTEhsQ1FVRjVRaXhSUVVGUkxHMUNRVUZ0UWl4dlFrRkJiMElzUzBGQlN6dEJRVUZCTEUxQlEyNUdMRWxCUVVrN1FVRkJRU3hSUVVGM1FpeE5RVUZOTEZGQlFWRXNTMEZCU3l4elFrRkJjMElzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4TFFVRkxMRXRCUVVzc1VVRkJhMElzVFVGQlRTeFJRVUZSTEUxQlFVMHNRMEZCUXp0QlFVRkJMRTFCUjJwS0xFbEJRVWtzVVVGQlVTeFpRVUZaTEZWQlFWY3NTMEZCU3l4TFFVRkxMRTlCUVd0Q0xGTkJRVk1zUjBGQlJ5eEhRVUZITzBGQlFVRXNVVUZETVVVc1RVRkJUU3hSUVVGUkxFdEJRVXNzZFVKQlFYVkNMRVZCUVVVc1YwRkJWeXhSUVVGUkxFMUJRVTBzUzBGQlN5eExRVUZMTEZGQlFXdENMRTFCUVUwc1VVRkJVU3hOUVVGTkxFTkJRVU03UVVGQlFTeFJRVU4wU0N4TlFVRk5MRTlCUVU4c1lVRkJZU3hGUVVGRkxFMUJRVTBzUzBGQlN5eExRVUZMTEU5QlFXbENMRU5CUVVNN1FVRkJRU3hOUVVOc1JUdEJRVUZCTEUxQlRVRXNTVUZCU1N4WFFVRlhPMEZCUVVFc1VVRkRXQ3hOUVVGTkxGZEJRVmNzVlVGQlZTeFZRVUZWTEU5QlFVODdRVUZCUVN4UlFVTTFReXhKUVVGSkxFTkJRVU1zVlVGQlZUdEJRVUZCTEZWQlExZ3NUVUZCVFN4UlFVRlJMRXRCUVVzc2RVSkJRWFZDTEVWQlFVVXNWMEZCVnl4UlFVRlJMRTFCUVUwc1MwRkJTeXhMUVVGTExGRkJRV3RDTEUxQlFVMHNVVUZCVVN4TlFVRk5MRU5CUVVNN1FVRkJRU3hWUVVOMFNDeE5RVUZOTEU5QlFVOHNZVUZCWVN4RlFVRkZMRTFCUVUwc1MwRkJTeXhMUVVGTExFOUJRV2xDTEVOQlFVTTdRVUZCUVN4UlFVTnNSVHRCUVVGQkxGRkJSVUVzU1VGQlNTeFRRVUZqTEZOQlFWTTdRVUZCUVN4UlFVTXpRaXhKUVVGSkxFOUJRVThzVjBGQlZ5eFpRVUZaTzBGQlFVRXNWVUZET1VJc1UwRkJVeXhOUVVGTkxFOUJRVTg3UVVGQlFTeFZRVU4wUWl4VFFVRlRMRk5CUVZNN1FVRkJRU3hSUVVOMFFqdEJRVUZCTEZGQlEwRXNUVUZCVFN4UFFVRlBMRkZCUVZFc1VVRkJVU3hEUVVGRE8wRkJRVUVzVVVGSk9VSXNVVUZCVVN4UFFVRlBPMEZCUVVFc1VVRkRaaXhSUVVGUkxGVkJRVlVzUzBGQlN5eFJRVUZSTzBGQlFVRXNVVUZETDBJc1VVRkJVU3hWUVVGVkxGRkJRVkU3UVVGQlFTeFJRVU14UWl4UlFVRlJMRTlCUVU4N1FVRkJRU3hSUVVObUxGRkJRVkVzV1VGQldUdEJRVUZCTEZGQlEzQkNMRkZCUVZFc1UwRkJVenRCUVVGQkxGRkJRMnBDTEZGQlFWRXNUMEZCVHl4UlFVRlJPMEZCUVVFc1VVRkRka0lzVVVGQlVTeHJRa0ZCYTBJc1VVRkJVVHRCUVVGQkxGRkJRMnhETEZGQlFWRXNhMEpCUVd0Q0xGRkJRVkU3UVVGQlFTeFJRVU5zUXl4UlFVRlJMRmxCUVZrN1FVRkJRU3hSUVVOd1FpeFJRVUZSTEZOQlFWTXNVVUZCVVN4UlFVRlJPMEZCUVVFc1VVRkRha01zVVVGQlVTeFJRVUZSTEZWQlFWVTdRVUZCUVN4UlFVTXhRaXhSUVVGUkxFOUJRVThzUTBGQlF5eExRVUZWTEZkQlFXZENMRk5CUVZNc1QwRkJUeXhUUVVGVExFdEJRVXNzVFVGQlRUdEJRVUZCTEZGQlF6bEZMRkZCUVZFc1dVRkJXU3hEUVVGRExGbEJRV2xDTEZGQlFWRXNVVUZCVVN4UFFVRlBPMEZCUVVFc1VVRkROMFFzVVVGQlVTeEpRVUZKTzBGQlFVRXNVVUZOV2l4TlFVRk5MR2xDUVVFd1FpeGhRVUZoTEZsQlEzWkRMRWxCUVVrc1VVRkJVU3hSUVVGUkxGRkJRVkVzUzBGQlN6dEJRVUZCTEZWQlF5OUNMRkZCUVZFc1VVRkJVU3hSUVVGUk8wRkJRVUVzVlVGRGVFSXNVMEZCVXl4UlFVRlJMRkZCUVZFN1FVRkJRU3hWUVVONlFpeE5RVUZOTEZsQlFWazdRVUZCUVN4VlFVTnNRaXhSUVVGUkxGRkJRVkVzVVVGQlVUdEJRVUZCTEZGQlF6VkNMRU5CUVVNc1NVRkRReXhSUVVGUk8wRkJRVUVzVVVGRlpDeE5RVUZOTEZWQlFYZENMRVZCUVVVc1QwRkJUeXhWUVVGVk8wRkJRVUVzVVVGRmFrUXNTVUZCU1N4UlFVRlJMRzFDUVVGdFFpeHpRa0ZCYzBJc1MwRkJTeXhOUVVGTk8wRkJRVUVzVlVGRE5VUXNUVUZCVFN4UlFVRlJMRXRCUVVzc2QwSkJRWGRDTEVWQlFVVXNWMEZCVnl4UlFVRlJMRTFCUVUwc1dVRkJXU3hOUVVGTkxGTkJRVk1zVVVGQlVTeE5RVUZOTEVOQlFVTTdRVUZCUVN4UlFVTndTRHRCUVVGQkxGRkJSVUVzVFVGQlRTeGpRVUYzUWl4TlFVRk5MRTlCUVU4c1VVRkJVU3hUUVVGVExHTkJRV003UVVGQlFTeFJRVU14UlN4UlFVRlJMRkZCUVZFN1FVRkJRU3hSUVVWb1FpeEpRVUZKTEZGQlFWRXNiVUpCUVcxQ0xIRkNRVUZ4UWl4TFFVRkxMRTFCUVUwN1FVRkJRU3hWUVVNelJDeE5RVUZOTEZGQlFWRXNTMEZCU3l4MVFrRkJkVUlzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4WlFVRlpMRTFCUVUwc1UwRkJVeXhUUVVGVExGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNVVUZETlVnN1FVRkJRU3hSUVVkQkxFMUJRVTBzWlVGQlpTeEpRVUZKTEZGQlFWRXNXVUZCV1N4UFFVRlBPMEZCUVVFc1VVRkRjRVFzV1VGQldTeEhRVUZITEUxQlFVMHNUMEZCVHl4UlFVRlJMRmRCUVZjc1IwRkJSenRCUVVGQkxGVkJRemxETEVsQlFVa3NRMEZCUXl4aFFVRmhMRWxCUVVrc1EwRkJRenRCUVVGQkxGbEJRVWNzWVVGQllTeEpRVUZKTEVkQlFVY3NRMEZCUXp0QlFVRkJMRkZCUTI1RU8wRkJRVUVzVVVGRlFTeE5RVUZOTERCQ1FVRXdRaXhSUVVGUkxHMUNRVUZ0UWl4eFFrRkJjVUlzUzBGQlN6dEJRVUZCTEZGQlEzSkdMRWxCUVVrN1FVRkJRU3hWUVVGNVFpeE5RVUZOTEZGQlFWRXNTMEZCU3l4MVFrRkJkVUlzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4TFFVRkxMRXRCUVVzc1VVRkJhMElzVFVGQlRTeFRRVUZUTEV0QlFVc3NVVUZCVVN4VFFVRlRMRk5CUVZNc1UwRkJVeXhOUVVGTkxGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNVVUZITVUwc1NVRkJTU3hSUVVGUkxGTkJRVk1zUjBGQlJ6dEJRVUZCTEZWQlEzQkNMRmRCUVZjc1YwRkJWeXhUUVVGVE8wRkJRVUVzV1VGRE0wSXNTVUZCU1R0QlFVRkJMR05CUVVVc1RVRkJUU3hSUVVGUk8wRkJRVUVzWTBGQlN5eFBRVUZQTEU5QlFVODdRVUZCUVN4alFVRkZMRTlCUVU4c1RVRkJUU3gxUTBGQmRVTXNTMEZCU3p0QlFVRkJPMEZCUVVFc1ZVRkRkRWM3UVVGQlFTeFJRVU5LTzBGQlFVRXNVVUZGUVN4SlFVRkpPMEZCUVVFc1ZVRkJkVUlzVFVGQlRTeFBRVUZQTEVWQlFVVXNUMEZCVHl4UFFVRmpPMEZCUVVFc1VVRkRMMFFzU1VGQlNUdEJRVUZCTEZWQlFXbENMRkZCUVZFc1VVRkJVU3hSUVVGUkxFOUJRVThzVTBGQlV6dEJRVUZCTEZGQlJUZEVMRTlCUVU4c1NVRkJTU3hUUVVGVExGbEJRVmtzVFVGQlRUdEJRVUZCTEZWQlEyeERMRkZCUVZFc1dVRkJXVHRCUVVGQkxGVkJRM0JDTEZsQlFWa3NXVUZCV1R0QlFVRkJMRlZCUTNoQ0xGTkJRVk03UVVGQlFTeFJRVU5pTEVOQlFVTTdRVUZCUVN4TlFVTk1PMEZCUVVFc1RVRkZRU3hKUVVGSkxFTkJRVU1zVVVGQlVTeFJRVUZSTEZGQlFWRXNTVUZCU1N4UlFVRlJMRWRCUVVjc1YwRkJWeXh0UWtGQmJVSXNSMEZCUnp0QlFVRkJMRkZCUlhwRkxFbEJRVWtzWTBGQll5eFJRVUZSTzBGQlFVRXNVVUZETVVJc1NVRkJTU3hEUVVGRExHRkJRV0U3UVVGQlFTeFZRVVZrTEVsQlFVa3NaVUZCWlN4dlFrRkJiMElzYlVKQlFXMUNPMEZCUVVFc1dVRkRkRVFzWTBGQll6dEJRVUZCTEZWQlEyeENMRVZCUVU4c1UwRkJTeXhMUVVGTExFdEJRVXNzVDBGQmEwSXNVMEZCVXl4SFFVRkhMRWRCUVVjN1FVRkJRU3haUVVOdVJDeGpRVUZqTEV0QlFVc3NTVUZCU1N4TFFVRkxMRXRCUVVzc1RVRkJaMEk3UVVGQlFTeFpRVU5xUkN4SlFVRkpMR2RDUVVGblFpeE5RVUZOTzBGQlFVRXNZMEZEZEVJc1kwRkJZeXhWUVVGVkxHTkJRV01zUzBGQlN5eExRVUZMTzBGQlFVRXNZMEZEYUVRc1NVRkJTU3huUWtGQlowSXNWMEZCVnp0QlFVRkJMR2RDUVVNelFpeE5RVUZOTEZGQlFWRXNTMEZCU3l4MVFrRkJkVUlzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4TFFVRkxMRXRCUVVzc1VVRkJhMElzVFVGQlRTeFJRVUZSTEUxQlFVMHNRMEZCUXp0QlFVRkJMR2RDUVVOMFNDeE5RVUZOTEU5QlFVOHNZVUZCWVN4RlFVRkZMRTFCUVUwc1MwRkJTeXhMUVVGTExFOUJRV2xDTEVOQlFVTTdRVUZCUVN4alFVTnNSVHRCUVVGQkxHTkJRMEVzU1VGQlNTeFBRVUZQTEZsQlFWa3NWMEZCVnp0QlFVRkJMR2RDUVVGWkxGbEJRVmtzVTBGQlV5eE5RVUZOTEZsQlFWazdRVUZCUVN4alFVTm9SanRCUVVGQkxEUkNRVUZaTEZOQlFWTXNUVUZCVFN4WlFVRlpMRTlCUVU4N1FVRkJRU3hqUVVOdVJDeExRVUZMTEVsQlFVa3NTMEZCU3l4TFFVRkxMRkZCUVd0Q0xGZEJRVmM3UVVGQlFTeFpRVU53UkR0QlFVRkJMRlZCUTBvc1JVRkJUenRCUVVGQkxGbEJRMGdzWTBGQll5eExRVUZMTEVsQlFVa3NTMEZCU3l4TFFVRkxMRTFCUVdkQ08wRkJRVUVzV1VGRGFrUXNTVUZCU1N4blFrRkJaMElzVFVGQlRUdEJRVUZCTEdOQlEzUkNMR05CUVdNc1ZVRkJWU3hqUVVGakxFdEJRVXNzUzBGQlN6dEJRVUZCTEdOQlEyaEVMRWxCUVVrc1owSkJRV2RDTEZkQlFWYzdRVUZCUVN4blFrRkRNMElzVFVGQlRTeFJRVUZSTEV0QlFVc3NkVUpCUVhWQ0xFVkJRVVVzVjBGQlZ5eFJRVUZSTEUxQlFVMHNTMEZCU3l4TFFVRkxMRkZCUVd0Q0xFMUJRVTBzVVVGQlVTeE5RVUZOTEVOQlFVTTdRVUZCUVN4blFrRkRkRWdzVFVGQlRTeFBRVUZQTEdGQlFXRXNSVUZCUlN4TlFVRk5MRXRCUVVzc1MwRkJTeXhQUVVGcFFpeERRVUZETzBGQlFVRXNZMEZEYkVVN1FVRkJRU3hqUVVOQkxFbEJRVWtzVDBGQlR5eFpRVUZaTEZkQlFWYzdRVUZCUVN4blFrRkJXU3haUVVGWkxGTkJRVk1zVFVGQlRTeFpRVUZaTzBGQlFVRXNZMEZEYUVZN1FVRkJRU3cwUWtGQldTeFRRVUZUTEUxQlFVMHNXVUZCV1N4UFFVRlBPMEZCUVVFc1kwRkRia1FzUzBGQlN5eEpRVUZKTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhYUVVGWE8wRkJRVUVzV1VGRGNFUTdRVUZCUVN4WlFVVkJMRzlDUVVGdlFqdEJRVUZCTEZsQlEzQkNMRzFDUVVGdFFqdEJRVUZCTzBGQlFVRXNWVUZIZGtJc1NVRkJTU3haUVVGWkxGTkJRVk03UVVGQlFTeFpRVUZWTEUxQlFVMHNUMEZCVHl4blFrRkJaMElzUlVGQlJTeFZRVUZWTEZWQlFWVXNVMEZCVXl4NVRFRkJlVXdzUTBGQlF6dEJRVUZCTEZGQlF6ZFNPMEZCUVVFc1VVRkZRU3hSUVVGUkxFOUJRVTg3UVVGQlFTeFJRVU5tTEZGQlFWRXNWVUZCVlN4TFFVRkxMRkZCUVZFN1FVRkJRU3hSUVVNdlFpeFJRVUZSTEZsQlFWazdRVUZCUVN4UlFVVndRaXhOUVVGTkxGZEJRVmNzVFVGQlRTeFRRVUZUTEZWQlFWVXNZVUZCWVR0QlFVRkJMRlZCUTI1RUxHdENRVUZyUWp0QlFVRkJMRlZCUTJ4Q0xHVkJRV1U3UVVGQlFTeFZRVU5tTEUxQlFVMHNTMEZCU3l4TFFVRkxPMEZCUVVFc1ZVRkRhRUlzVTBGQlV5eFJRVUZSTEZGQlFWRTdRVUZCUVN4VlFVTjZRanRCUVVGQkxGVkJRMEVzVVVGQlVTeExRVUZMTEU5QlFVODdRVUZCUVN4VlFVTndRaXhaUVVGWk8wRkJRVUVzVlVGRFdpeHRRa0ZCYlVJN1FVRkJRU3hSUVVOMlFpeERRVUZETzBGQlFVRXNVVUZEUkN4VlFVRlZMRk5CUVZNN1FVRkJRU3hSUVVWdVFpeEpRVUZKTEZOQlFWTXNVMEZCVXl4TlFVRk5MRk5CUVZNc1VVRkJVU3hWUVVGVkxGZEJRVmM3UVVGQlFTeFZRVU01UkN4SlFVRkpMRk5CUVZNc1lVRkJZVHRCUVVGQkxGbEJRM1JDTEZOQlFWTXNUMEZCVHl3eVFrRkJNa0k3UVVGQlFTeFZRVU12UXl4RlFVRlBPMEZCUVVFc1dVRkRTQ3hUUVVGVExFOUJRVThzVjBGQlZ5eExRVUZMTEZWQlFWVXNVMEZCVXl4UlFVRlJMRXRCUVVzc2EwSkJRV3RDTzBGQlFVRTdRVUZCUVN4UlFVVXhSanRCUVVGQkxGRkJSVUVzVFVGQlRTd3dRa0ZCTUVJc1VVRkJVU3h0UWtGQmJVSXNjVUpCUVhGQ0xFdEJRVXM3UVVGQlFTeFJRVU55Uml4SlFVRkpPMEZCUVVFc1ZVRkJlVUlzVFVGQlRTeFJRVUZSTEV0QlFVc3NkVUpCUVhWQ0xFVkJRVVVzVjBGQlZ5eFJRVUZSTEUxQlFVMHNTMEZCU3l4TFFVRkxMRkZCUVd0Q0xFMUJRVTBzVTBGQlV5eExRVUZMTEZGQlFWRXNVMEZCVXl4VFFVRlRMRk5CUVZNc1UwRkJVeXhUUVVGVExFMUJRVTBzVVVGQlVTeE5RVUZOTEVOQlFVTTdRVUZCUVN4UlFVVTFUaXhKUVVGSkxGRkJRVkVzVTBGQlV5eEhRVUZITzBGQlFVRXNWVUZEY0VJc1YwRkJWeXhYUVVGWExGTkJRVk03UVVGQlFTeFpRVU16UWl4SlFVRkpPMEZCUVVFc1kwRkRRU3hOUVVGTkxGRkJRVkU3UVVGQlFTeGpRVU5vUWl4UFFVRlBMRTlCUVU4N1FVRkJRU3hqUVVOYUxFOUJRVThzVFVGQlRTeDFRMEZCZFVNc1MwRkJTenRCUVVGQk8wRkJRVUVzVlVGRmFrVTdRVUZCUVN4UlFVTktPMEZCUVVFc1VVRkZRU3hKUVVGSk8wRkJRVUVzVlVGQmRVSXNUVUZCVFN4UFFVRlBMRVZCUVVVc1QwRkJUeXhQUVVGak8wRkJRVUVzVVVGREwwUXNTVUZCU1R0QlFVRkJMRlZCUVdsQ0xGRkJRVkVzVVVGQlVTeFJRVUZSTEU5QlFVOHNVMEZCVXp0QlFVRkJMRkZCUXpkRUxFbEJRVWtzVVVGQlVTeGhRVUZoTzBGQlFVRXNWVUZEY2tJc1QwRkJUeXhGUVVGRkxHVkJRV1VzVFVGQlRTeE5RVUZOTEZOQlFWTXNUVUZCVFN4UlFVRlJMRk5CUVZNc1VVRkJVU3hUUVVGVExGTkJRVk1zVVVGQlVUdEJRVUZCTEZGQlF6RkhPMEZCUVVFc1VVRkRRU3hQUVVGUExFbEJRVWtzVTBGQlV5eFRRVUZUTEUxQlFYbENMRkZCUVZFN1FVRkJRU3hOUVVOc1JTeEZRVUZQTzBGQlFVRXNVVUZGU0N4SlFVRkpMR05CUVdNc1VVRkJVVHRCUVVGQkxGRkJRekZDTEVsQlFVa3NRMEZCUXl4aFFVRmhPMEZCUVVFc1ZVRkRaQ3hqUVVGakxFdEJRVXNzU1VGQlNTeExRVUZMTEV0QlFVc3NUVUZCWjBJN1FVRkJRU3hWUVVOcVJDeEpRVUZMTEV0QlFVc3NTMEZCU3l4UFFVRnJRaXhUUVVGVExFZEJRVWNzUzBGQlN5eERRVUZGTEV0QlFVc3NTMEZCU3l4UFFVRnJRaXhUUVVGVExFZEJRVWNzUzBGQlN5eG5Ra0ZCWjBJc1RVRkJUVHRCUVVGQkxGbEJRMjVJTEdOQlFXTXNWVUZCVlN4alFVRmpMRXRCUVVzc1MwRkJTenRCUVVGQkxGbEJRMmhFTEVsQlFVa3NaMEpCUVdkQ0xGZEJRVmM3UVVGQlFTeGpRVU16UWl4TlFVRk5MRkZCUVZFc1MwRkJTeXgxUWtGQmRVSXNSVUZCUlN4WFFVRlhMRkZCUVZFc1RVRkJUU3hMUVVGTExFdEJRVXNzVVVGQmEwSXNUVUZCVFN4UlFVRlJMRTFCUVUwc1EwRkJRenRCUVVGQkxHTkJRM1JJTEUxQlFVMHNUMEZCVHl4aFFVRmhMRVZCUVVVc1RVRkJUU3hMUVVGTExFdEJRVXNzVDBGQmFVSXNRMEZCUXp0QlFVRkJMRmxCUTJ4Rk8wRkJRVUVzV1VGRFFTeEpRVUZKTEU5QlFVOHNXVUZCV1N4WFFVRlhPMEZCUVVFc1kwRkJXU3haUVVGWkxGTkJRVk1zVFVGQlRTeFpRVUZaTzBGQlFVRXNXVUZEYUVZN1FVRkJRU3d3UWtGQldTeFRRVUZUTEUxQlFVMHNXVUZCV1N4UFFVRlBPMEZCUVVFc1dVRkRia1FzUzBGQlN5eEpRVUZKTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhYUVVGWE8wRkJRVUVzVlVGRGNFUTdRVUZCUVN4VlFVTkJMRWxCUVVrc1dVRkJXU3hUUVVGVE8wRkJRVUVzV1VGQlZTeE5RVUZOTEU5QlFVOHNaMEpCUVdkQ0xFVkJRVVVzVlVGQlZTeFZRVUZWTEZOQlFWTXNNa3hCUVRKTUxFTkJRVU03UVVGQlFTeFJRVU12VWp0QlFVRkJMRkZCUlVFc1NVRkJTU3hsUVVGbE8wRkJRVUVzVVVGRGJrSXNUVUZCVFN4alFVRmpMRmxCUVZrN1FVRkJRU3hWUVVNMVFpeEpRVUZKTzBGQlFVRXNXVUZCWXp0QlFVRkJMRlZCUTJ4Q0xHVkJRV1U3UVVGQlFTeFZRVU5tTEZkQlFWY3NWMEZCVnl4VFFVRlRPMEZCUVVFc1dVRkRNMElzU1VGQlNUdEJRVUZCTEdOQlEwRXNUVUZCVFN4UlFVRlJPMEZCUVVFc1kwRkRhRUlzVDBGQlR5eFBRVUZQTzBGQlFVRXNZMEZEV2l4UFFVRlBMRTFCUVUwc2RVTkJRWFZETEV0QlFVczdRVUZCUVR0QlFVRkJMRlZCUldwRk8wRkJRVUVzVlVGRFFTeEpRVUZKTzBGQlFVRXNXVUZCZFVJc1RVRkJUU3hQUVVGUExFVkJRVVVzVDBGQlR5eFBRVUZqTzBGQlFVRXNWVUZETDBRc1NVRkJTVHRCUVVGQkxGbEJRV2xDTEZGQlFWRXNVVUZCVVN4UlFVRlJMRTlCUVU4c1UwRkJVenRCUVVGQk8wRkJRVUVzVVVGSGFrVXNVVUZCVVN4UFFVRlBPMEZCUVVFc1VVRkRaaXhSUVVGUkxGVkJRVlVzUzBGQlN5eFJRVUZSTzBGQlFVRXNVVUZETDBJc1VVRkJVU3haUVVGWk8wRkJRVUVzVVVGRmNFSXNUVUZCVFN4WFFVRlhMRTFCUVUwc1UwRkJVeXhWUVVGVkxHRkJRV0U3UVVGQlFTeFZRVU51UkN4clFrRkJhMEk3UVVGQlFTeFZRVU5zUWl4bFFVRmxPMEZCUVVFc1ZVRkRaaXhOUVVGTkxFdEJRVXNzUzBGQlN6dEJRVUZCTEZWQlEyaENMRk5CUVZNc1VVRkJVU3hSUVVGUk8wRkJRVUVzVlVGRGVrSTdRVUZCUVN4VlFVTkJMRkZCUVZFc1MwRkJTeXhQUVVGUE8wRkJRVUVzVlVGRGNFSXNXVUZCV1R0QlFVRkJMRkZCUTJoQ0xFTkJRVU03UVVGQlFTeFJRVU5FTEZWQlFWVXNVMEZCVXp0QlFVRkJMRkZCUlc1Q0xGTkJRVk1zVlVGQlZTeExRVUZMTEZOQlFWTXNXVUZCV1N4cFFrRkJhVUlzUzBGQlN5eE5RVUZOTEUxQlFVMHNSVUZCUlR0QlFVRkJMRkZCUldwR0xFbEJRVWs3UVVGQlFTeFJRVVZLTEVsQlFVazdRVUZCUVN4UlFVZEtMRWxCUVVrc1QwRkJUeXhSUVVGUkxHRkJRV0U3UVVGQlFTeFZRVVUxUWl4VFFVRlRMRWxCUVVrc1pVRkJaVHRCUVVGQkxGbEJRM2hDTEUxQlFVMDdRVUZCUVN4cFFrRkZRU3hMUVVGSkxFTkJRVU1zV1VGQk5FTTdRVUZCUVN4alFVTnVSQ3hWUVVGVk8wRkJRVUVzWTBGRFZpeEpRVUZKTzBGQlFVRXNaMEpCUTBFc1YwRkJWeXhOUVVGTkxGTkJRVk1zUzBGQlN5eFZRVUZWTEVWQlFVVXNVMEZCVXl4TlFVRk5MRTFCUVUwc1YwRkJWeXhWUVVGVkxFTkJRWE5ETzBGQlFVRTdRVUZCUVN4RFFVRlBPMEZCUVVFc1owSkJRMnhKTEdsQ1FVRnBRaXhUUVVGVExGTkJRVk1zVVVGQlVTeFBRVUZQTzBGQlFVRXNhMEpCUXpsRExFbEJRVWtzUTBGQlF5eFJRVUZSTEZGQlFWRXNUMEZCVHl4VFFVRlRPMEZCUVVFc2IwSkJRMnBETEUxQlFVMHNVMEZCYVVJc1MwRkJTeXhWUVVGVkxFTkJRVU1zVFVGQlRTeExRVUZMTEVOQlFVTTdRVUZCUVN4dlFrRkRia1FzVjBGQlZ5eE5RVUZOTEZGQlFWRTdRVUZCUVR0QlFVRkJMRU5CUVZrN1FVRkJRU3hyUWtGRGVrTXNSVUZCVHp0QlFVRkJMRzlDUVVOSUxGTkJRVk1zVVVGQlVTeE5RVUZOTEU5QlFVOHNVMEZCVXp0QlFVRkJMRzlDUVVOMlF5eE5RVUZOTEZsQlFWazdRVUZCUVN4dlFrRkRiRUlzVjBGQlZ5eE5RVUZOTzBGQlFVRTdRVUZCUVN4blFrRkZla0k3UVVGQlFTeG5Ra0ZEUml4UFFVRlBMRTlCUVU4N1FVRkJRU3huUWtGRFdpeE5RVUZOTEZsQlFWa3NhVUpCUVdsQ0xGZEJRVmNzVVVGQlVTeExRVUZMTzBGQlFVRXNaMEpCUXpORUxFMUJRVTBzVTBGQll5eERRVUZETzBGQlFVRXNaMEpCUTNKQ0xFOUJRVThzVlVGQlZTeFJRVUZSTEZWQlFWVTdRVUZCUVN4blFrRkRia01zVjBGQlZ5eE5RVUZOTEZGQlFWRXNTMEZCU3l4VlFVRlZMRU5CUVVNc1VVRkJVU3hKUVVGSkxFTkJRVU03UVVGQlFUdEJRVUZCTEVOQlFVODdRVUZCUVR0QlFVRkJMR05CUldwRkxFMUJRVTBzU1VGQlNTeFJRVUZSTEVOQlFVTXNXVUZCV1N4WFFVRlhMRk5CUVZNc1EwRkJReXhEUVVGRE8wRkJRVUVzWTBGRGNrUXNUVUZCVFN4WlFVRlpPMEZCUVVFc1kwRkRiRUlzVjBGQlZ5eE5RVUZOTzBGQlFVRTdRVUZCUVN4cFFrRkZaaXhQUVVGTkxFZEJRVWM3UVVGQlFTeGpRVU5ZTEUxQlFVMHNXVUZCV1R0QlFVRkJMR05CUTJ4Q0xGRkJRVkVzVFVGQlRUdEJRVUZCTzBGQlFVRXNWVUZGZEVJc1EwRkJVVHRCUVVGQkxGRkJRMW9zUlVGQlR6dEJRVUZCTEZWQlIwZ3NVMEZCVXl4SlFVRkpMR1ZCUVdVN1FVRkJRU3hwUWtGRmJFSXNTMEZCU1N4RFFVRkRMRmxCUVZrN1FVRkJRU3hqUVVOdVFpeFZRVUZWTzBGQlFVRXNZMEZEVml4SlFVRkpPMEZCUVVFc1owSkJRMEVzVjBGQlZ5eFJRVUZSTEZOQlFWTXNTMEZCU3l4VlFVRlZMRVZCUVVVc1UwRkJVeXhOUVVGTkxFMUJRVTBzVjBGQlZ5eFZRVUZWTEVOQlFYTkRPMEZCUVVFN1FVRkJRU3hEUVVGUE8wRkJRVUVzWjBKQlEzQkpMR2xDUVVGcFFpeFRRVUZUTEZOQlFWTXNVVUZCVVN4UFFVRlBPMEZCUVVFc2EwSkJRemxETEVsQlFVa3NRMEZCUXl4UlFVRlJMRkZCUVZFc1VVRkJVU3hUUVVGVE8wRkJRVUVzYjBKQlEyeERMRTFCUVUwc1UwRkJhVUlzUzBGQlN5eFZRVUZWTEVOQlFVTXNUVUZCVFN4TFFVRkxMRU5CUVVNN1FVRkJRU3h2UWtGRGJrUXNWMEZCVnl4UlFVRlJMRkZCUVZFN1FVRkJRVHRCUVVGQkxFTkJRVms3UVVGQlFTeHJRa0ZETTBNc1JVRkJUenRCUVVGQkxHOUNRVU5JTEZOQlFWTXNVVUZCVVN4TlFVRk5MRTlCUVU4c1UwRkJVenRCUVVGQkxHOUNRVU4yUXl4TlFVRk5MRmxCUVZrN1FVRkJRU3h2UWtGRGJFSXNWMEZCVnl4TlFVRk5PMEZCUVVFN1FVRkJRU3huUWtGRmVrSTdRVUZCUVN4blFrRkRSaXhQUVVGUExFOUJRVTg3UVVGQlFTeG5Ra0ZEV2l4TlFVRk5MRmxCUVZrc2FVSkJRV2xDTEZkQlFWY3NVVUZCVVN4TFFVRkxPMEZCUVVFc1owSkJRek5FTEUxQlFVMHNVMEZCWXl4RFFVRkRPMEZCUVVFc1owSkJRM0pDTEU5QlFVOHNWVUZCVlN4UlFVRlJMRlZCUVZVN1FVRkJRU3huUWtGRGJrTXNWMEZCVnl4UlFVRlJMRkZCUVZFc1MwRkJTeXhWUVVGVkxFTkJRVU1zVVVGQlVTeEpRVUZKTEVOQlFVTTdRVUZCUVR0QlFVRkJMRU5CUVU4N1FVRkJRVHRCUVVGQkxHTkJSVzVGTEUxQlFVMHNXVUZCV1R0QlFVRkJMR05CUTJ4Q0xFMUJRVTBzU1VGQlNTeFJRVUZSTEVOQlFVTXNXVUZCV1N4WFFVRlhMRk5CUVZNc1EwRkJReXhEUVVGRE8wRkJRVUVzWTBGRGNrUXNWMEZCVnl4TlFVRk5PMEZCUVVFN1FVRkJRU3hwUWtGRlppeFBRVUZOTEVkQlFVYzdRVUZCUVN4alFVTllMRTFCUVUwc1dVRkJXVHRCUVVGQkxHTkJRMnhDTEZGQlFWRXNUVUZCVFR0QlFVRkJPMEZCUVVFc1ZVRkZkRUlzUTBGQlVUdEJRVUZCTzBGQlFVRXNVVUZIV2l4VFFVRlRMRTlCUVU4N1FVRkJRU3hSUVVWb1FpeFRRVUZUTEZWQlFWVXNTMEZCU3l4VFFVRlRMRk5CUVZNc1owSkJRV2RDTEhGQ1FVRnhRaXhwUWtGQmFVSXNWMEZCVnp0QlFVRkJMRkZCUlROSExFMUJRVTBzVVVGQlVTeExRVUZMTEhWQ1FVRjFRaXhGUVVGRkxGZEJRVmNzVVVGQlVTeE5RVUZOTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhOUVVGTkxGTkJRVk1zUzBGQlN5eFJRVUZSTEZOQlFWTXNVMEZCVXl4VFFVRlRMRk5CUVZNc1UwRkJVeXhOUVVGTkxGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNVVUZGTDB3c1QwRkJUeXhKUVVGSkxGTkJRVk1zVTBGQlV5eE5RVUZOTEZGQlFWRTdRVUZCUVR0QlFVRkJMRTFCUldwRUxFOUJRVThzVDBGQlR6dEJRVUZCTEUxQlExb3NUVUZCVFN4VlFVRjVRenRCUVVGQkxGRkJRek5ETEU5QlFVOHNhVUpCUVdsQ0xGZEJRVmNzVVVGQlVTeExRVUZMTzBGQlFVRXNUVUZEY0VRN1FVRkJRU3hOUVVOQkxFbEJRVWtzVVVGQlVTeFZRVUZWTzBGQlFVRXNVVUZCVnl4VFFVRlRMRTlCUVU4c1MwRkJTeXhWUVVGVkxGRkJRVkVzUzBGQlN6dEJRVUZCTEUxQlJUZEZMRk5CUVZNc1ZVRkJWU3hMUVVGTExGTkJRVk1zV1VGQldTeFpRVUZaTzBGQlFVRXNUVUZEZWtRc1RVRkJUU3hSUVVGUkxFdEJRVXNzZFVKQlFYVkNMRVZCUVVVc1YwRkJWeXhSUVVGUkxFMUJRVTBzUzBGQlN5eExRVUZMTEZGQlFXdENMRTFCUVUwc1UwRkJVeXhMUVVGTExGRkJRVkVzVTBGQlV5eFRRVUZUTEZOQlFWTXNUMEZCVHl4UlFVRlJMRTFCUVUwc1EwRkJRenRCUVVGQkxFMUJSemxMTEVsQlFVa3NVVUZCVVN4VFFVRlRMRWRCUVVjN1FVRkJRU3hSUVVOd1FpeFhRVUZYTEZkQlFWY3NVMEZCVXp0QlFVRkJMRlZCUXpOQ0xFbEJRVWs3UVVGQlFTeFpRVUZGTEUxQlFVMHNVVUZCVVR0QlFVRkJMRmxCUVVzc1QwRkJUeXhIUVVGSE8wRkJRVUVzV1VGQlJTeFBRVUZQTEUxQlFVMHNkVU5CUVhWRExFTkJRVU03UVVGQlFUdEJRVUZCTEZGQlF6bEdPMEZCUVVFc1RVRkRTanRCUVVGQkxFMUJRMEVzU1VGQlNUdEJRVUZCTEZGQlFYVkNMRTFCUVUwc1QwRkJUeXhGUVVGRkxFOUJRVThzVDBGQll6dEJRVUZCTEUxQlF5OUVMRWxCUVVrN1FVRkJRU3hSUVVGcFFpeFJRVUZSTEZGQlFWRXNVVUZCVVN4UFFVRlBMRk5CUVZNN1FVRkJRU3hOUVVNM1JDeEpRVUZKTEZGQlFWRXNZVUZCWVR0QlFVRkJMRkZCUTNKQ0xFOUJRVThzUlVGQlJTeGxRVUZsTEUxQlFVMHNUVUZCVFN4VFFVRlRMRTFCUVUwc1VVRkJVU3hUUVVGVExGRkJRVkVzVTBGQlV5eFRRVUZUTEZGQlFWRTdRVUZCUVN4TlFVTXhSenRCUVVGQkxFMUJRMEVzVDBGQlR5eEpRVUZKTEZOQlFWTXNVMEZCVXl4TlFVRjVRaXhSUVVGUk8wRkJRVUU3UVVGQlFUdEJRVUZCTEVWQlNYUkZMRTFCUVUwc1owSkJRVGhGTEVsQlFVazdRVUZCUVN4RlFVTjRSaXhOUVVGTkxHZENRVUZuUWl4UFFVTnNRaXhOUVVOQkxGbEJVVU03UVVGQlFTeEpRVU5FTEVsQlFVa3NUMEZCVHl4WlFVRlpMRlZCUVZVN1FVRkJRU3hOUVVNM1FpeEpRVUZKTEZsQlFWa3NVVUZCVVR0QlFVRkJMRkZCUTNCQ0xFdEJRVXNzV1VGQldTeE5RVUZOTzBGQlFVRXNUVUZETTBJN1FVRkJRU3hOUVVOQkxFbEJRVWtzVVVGQlVTeFhRVUZYTEdWQlFXVXNSMEZCUnp0QlFVRkJMRkZCUTNKRExFMUJRVTBzV1VGQldTeFJRVUZSTEZWQlFWVXNaMEpCUVdkQ0xFMUJRVTA3UVVGQlFTeFJRVU14UkN4TlFVRk5MR1ZCUVdVc1kwRkJZeXhKUVVGSkxGTkJRVk03UVVGQlFTeFJRVU5vUkN4SlFVRkpMR05CUVdNN1FVRkJRU3hWUVVOa0xHRkJRV0VzVlVGQlZTeFBRVUZQTEZOQlFWTTdRVUZCUVN4VlFVTjJReXhoUVVGaExGbEJRVmtzVVVGQlVUdEJRVUZCTEZGQlEzSkRPMEZCUVVFc1RVRkRTanRCUVVGQkxFMUJRMEU3UVVGQlFTeEpRVU5LTzBGQlFVRXNTVUZEUVN4SlFVRkpMR05CUVdNc1MwRkJTeXhKUVVGSkxGRkJRVkVzU1VGQlNUdEJRVUZCTEVsQlEzWkRMRWxCUVVrc1owSkJRV2RDTEUxQlFVMDdRVUZCUVN4TlFVTjBRaXhqUVVGakxGVkJRVlVzWTBGQll5eFJRVUZSTzBGQlFVRXNUVUZET1VNc1NVRkJTU3huUWtGQlowSXNWMEZCVnp0QlFVRkJMRkZCUXpOQ0xFMUJRVTBzVDBGQlR5eGhRVUZoTEVWQlFVVXNUVUZCVFN4UlFVRlJMRXRCUVVzc1EwRkJRenRCUVVGQkxFMUJRM0JFTzBGQlFVRXNUVUZEUVN4SlFVRkpMRTlCUVU4c1dVRkJXU3hYUVVGWE8wRkJRVUVzVVVGQldTeFpRVUZaTEZOQlFWTXNUVUZCVFN4WlFVRlpPMEZCUVVFc1RVRkRhRVk3UVVGQlFTeHZRa0ZCV1N4VFFVRlRMRTFCUVUwc1dVRkJXU3hQUVVGUE8wRkJRVUVzVFVGRGJrUXNTMEZCU3l4SlFVRkpMRkZCUVZFc1RVRkJUU3hYUVVGWE8wRkJRVUVzU1VGRGRFTTdRVUZCUVN4SlFVVkJMRTFCUVUwc1ZVRkJWU3hKUVVGSkxGRkJRVkVzVVVGQlVTeFBRVUZQTzBGQlFVRXNTVUZETTBNc1RVRkJUU3hUUVVGVExGRkJRVkVzVlVGQlZTeERRVUZETzBGQlFVRXNTVUZEYkVNc1RVRkJUU3hUUVVGVExHRkJRV0VzVTBGQlV5eFJRVUZSTEUxQlFVMHNVVUZCVVN4VFFVRlRPMEZCUVVFc1NVRkRjRVVzU1VGQlNTeFZRVUUyUXl4RFFVRkRPMEZCUVVFc1NVRkZiRVFzVFVGQlRTeFBRVUZQTEVsQlFVa3NUVUZEWWl4RFFVRkRMRWRCUTBRN1FVRkJRU3hOUVVOSkxFdEJRVXNzUTBGQlF5eFJRVUZSTEdGQlFXRTdRVUZCUVN4UlFVTjJRaXhKUVVGSkxHRkJRV0U3UVVGQlFTeFZRVUZaTEU5QlFVODdRVUZCUVN4UlFVTndRenRCUVVGQk8wRkJRVUVzVFVGRlNpeExRVUZMTEUxQlFVMDdRVUZCUVN4UlFVTlFMRTFCUVUwc1QwRkJUeXhuUWtGQlowSXNSVUZCUlN4VlFVRlZMR2RDUVVGblFpeFRRVUZUTEhGS1FVRnhTaXhEUVVGRE8wRkJRVUU3UVVGQlFTeEpRVVZvVHl4RFFVTktPMEZCUVVFc1NVRkZRU3hOUVVGTkxHTkJRV01zVDBGQlR5eFRRVUU0UWp0QlFVRkJMRTFCUTNKRUxFbEJRVWtzVTBGQlV6dEJRVUZCTEZGQlFWVXNZMEZCWXl4UFFVRlBMRkZCUVZFc1UwRkJVenRCUVVGQkxFMUJRemRFTEZkQlFWY3NWMEZCVnl4VFFVRlRPMEZCUVVFc1VVRkRNMElzU1VGQlNUdEJRVUZCTEZWQlEwRXNUVUZCVFN4UlFVRlJPMEZCUVVFc1ZVRkRhRUlzVDBGQlR5eFBRVUZQTzBGQlFVRXNWVUZEV2l4UFFVRlBMRTFCUVUwc2RVTkJRWFZETEV0QlFVczdRVUZCUVR0QlFVRkJMRTFCUldwRk8wRkJRVUVzVFVGRFFTeE5RVUZOTEU5QlFVOHNSVUZCUlN4UFFVRlBMRTlCUVdNN1FVRkJRU3hOUVVOd1F5eFJRVUZSTEZGQlFWRXNVVUZCVVN4UFFVRlBMRkZCUVZFc1UwRkJVenRCUVVGQk8wRkJRVUVzU1VGSGNFUXNUVUZCVFN4VlFVRlZMRVZCUVVVc1RVRkJXU3hUUVVGVExGZEJRVmNzV1VGQldTeE5RVUZOTEZGQlFWRXNUVUZCVFR0QlFVRkJMRWxCUld4R0xFbEJRVWs3UVVGQlFTeE5RVU5CTEVsQlFVa3NXVUZCV1N4VFFVRlRMRlZCUVZVN1FVRkJRU3hSUVVNdlFpeE5RVUZOTEZkQlFWY3NUVUZCVFN4VFFVRlRMRlZCUVZVc1lVRkJZVHRCUVVGQkxGVkJRMjVFTEd0Q1FVRnJRaXhSUVVGUk8wRkJRVUVzVlVGRE1VSXNaVUZCWlR0QlFVRkJMRlZCUTJZc1RVRkJUU3hSUVVGUk8wRkJRVUVzVlVGRFpEdEJRVUZCTEZWQlEwRTdRVUZCUVN4VlFVTkJPMEZCUVVFc1ZVRkRRU3haUVVGWk8wRkJRVUVzVVVGRGFFSXNRMEZCUXp0QlFVRkJMRkZCUTBRc1ZVRkJWU3hUUVVGVE8wRkJRVUVzVVVGRmJrSXNUVUZCVFN4WlFVRlpMRkZCUVZFN1FVRkJRU3hSUVVVeFFpeEpRVUZKTEZOQlFWTXNZVUZCWVR0QlFVRkJMRlZCUTNSQ0xFdEJRVXNzV1VGQldUdEJRVUZCTEZsQlEySXNWMEZCVnl4UlFVRlJPMEZCUVVFc1dVRkRia0lzVTBGQlV6dEJRVUZCTEZsQlExUXNUVUZCVFR0QlFVRkJMRlZCUTFZc1EwRkJRenRCUVVGQkxGRkJRMHdzUlVGQlR6dEJRVUZCTEZWQlEwZ3NTMEZCU3l4WlFVRlpPMEZCUVVFc1dVRkRZaXhYUVVGWExGRkJRVkU3UVVGQlFTeFpRVU51UWl4VFFVRlRPMEZCUVVFc1dVRkRWQ3hOUVVGTkxGTkJRVk1zVVVGQlVUdEJRVUZCTEZWQlF6TkNMRU5CUVVNN1FVRkJRVHRCUVVGQkxFMUJSVlE3UVVGQlFTeE5RVU5CTEVsQlFVa3NXVUZCV1N4VFFVRlRMRlZCUVZVN1FVRkJRU3hSUVVNdlFpeE5RVUZOTEZkQlFWY3NUVUZCVFN4VFFVRlRMRlZCUVZVc1lVRkJZVHRCUVVGQkxGVkJRMjVFTEd0Q1FVRnJRaXhSUVVGUk8wRkJRVUVzVlVGRE1VSXNaVUZCWlR0QlFVRkJMRlZCUTJZc1RVRkJUU3hSUVVGUk8wRkJRVUVzVlVGRFpEdEJRVUZCTEZWQlEwRTdRVUZCUVN4VlFVTkJPMEZCUVVFc1ZVRkRRU3haUVVGWk8wRkJRVUVzVVVGRGFFSXNRMEZCUXp0QlFVRkJMRkZCUTBRc1ZVRkJWU3hUUVVGVE8wRkJRVUVzVVVGRmJrSXNTVUZCU1R0QlFVRkJMRlZCUTBFc1MwRkJTeXhaUVVGWkxFVkJRVVVzVTBGQlV5eE5RVUZOTEUxQlFVMHNWMEZCVnl4WFFVRlhMRkZCUVZFc1YwRkJWeXhOUVVGTkxFMUJRVTBzUTBGQlF6dEJRVUZCTEZWQlF6bEdMR05CUVdNc1NVRkJTU3hSUVVGUkxGZEJRVmNzUlVGQlJTeFhRVUZYTEZOQlFWTXNVVUZCVVN4UFFVRlBMRmxCUVZrc1EwRkJRenRCUVVGQkxGVkJRM1pHTEdsQ1FVRnBRaXhUUVVGVExGTkJRVk1zVVVGQlVTeFBRVUZQTzBGQlFVRXNXVUZET1VNc1RVRkJUU3hQUVVGUExFVkJRVVVzVTBGQlV5eE5RVUZOTEUxQlFVMHNRMEZCUXl4TlFVRk5MRXRCUVVzc1IwRkJSeXhYUVVGWExGRkJRVkVzVjBGQlZ5eE5RVUZOTEUxQlFVMDdRVUZCUVN4WlFVTTNSaXhMUVVGTExGbEJRVmtzU1VGQlNUdEJRVUZCTEZWQlEzcENPMEZCUVVFc1ZVRkRRU3hMUVVGTExGbEJRVmtzUlVGQlJTeFRRVUZUTEUxQlFVMHNUVUZCVFN4WFFVRlhMRmRCUVZjc1VVRkJVU3hYUVVGWExFMUJRVTBzUzBGQlN5eERRVUZETzBGQlFVRXNWVUZETDBZc1QwRkJUeXhQUVVGUE8wRkJRVUVzVlVGRFdpeE5RVUZOTEZsQlFWa3NhVUpCUVdsQ0xGRkJRVkVzVjBGQlZ5eFJRVUZSTEV0QlFVczdRVUZCUVN4VlFVTnVSU3hOUVVGTkxGTkJRV01zUTBGQlF6dEJRVUZCTEZWQlEzSkNMRTlCUVU4c1ZVRkJWU3hSUVVGUkxGVkJRVlU3UVVGQlFTeFZRVU51UXl4TFFVRkxMRmxCUVZrc1JVRkJSU3hUUVVGVExFMUJRVTBzVFVGQlRTeERRVUZETEZGQlFWRXNTVUZCU1N4SFFVRkhMRmRCUVZjc1VVRkJVU3hYUVVGWExFMUJRVTBzUzBGQlN5eERRVUZETzBGQlFVRTdRVUZCUVN4UlFVVjBSeXhOUVVGTkxGbEJRVmtzVVVGQlVUdEJRVUZCTEUxQlF6bENPMEZCUVVFc1RVRkRSaXhQUVVGUExFOUJRVTg3UVVGQlFTeE5RVU5hTEUxQlFVMHNVMEZCVXl4cFFrRkJhVUlzVVVGQlVTeFhRVUZYTEZGQlFWRXNTMEZCU3p0QlFVRkJMRTFCUTJoRkxFMUJRVTBzVDBGQlR5eEZRVUZGTEU5QlFVOHNUMEZCWXp0QlFVRkJMRTFCUTNCRExFdEJRVXNzV1VGQldTeEZRVUZGTEZOQlFWTXNUMEZCVHl4TlFVRk5MRmRCUVZjc1QwRkJUeXhSUVVGUkxGZEJRVmNzVVVGQlVTeFhRVUZYTEUxQlFVMHNTMEZCU3l4RFFVRkRPMEZCUVVFN1FVRkJRVHRCUVVGQkxFVkJTWEpJTEU5QlFVODdRVUZCUVN4SlFVTklPMEZCUVVFc1NVRkRRVHRCUVVGQkxFbEJRMEU3UVVGQlFTeEZRVU5LTzBGQlFVRTdPMEZETnpSQ1J5eFRRVUZUTEUxQlFVMHNRMEZCUXl4TlFVRmpMRTFCUVhsRE8wRkJRVUVzUlVGRE1VVXNUVUZCVFN4UlFVRlJMRVZCUVVVc1pVRkJaU3hOUVVGTkxFMUJRVTBzUzBGQlN6dEJRVUZCTEVWQlEyaEVMRWxCUVVrc1QwRkJUeXhOUVVGTkxITkNRVUZ6UWp0QlFVRkJMRWxCUVZrc1RVRkJUU3hyUWtGQmEwSXNTMEZCU3p0QlFVRkJMRVZCUTJoR0xFOUJRVTg3UVVGQlFUdEJRVXRLTEZOQlFWTXNTMEZCU3l4RFFVRkRMRXRCUVhWRU8wRkJRVUVzUlVGRGVrVXNUVUZCVFN4UFFVRlBMRTlCUVU4c1MwRkJTeXhIUVVGSE8wRkJRVUVzUlVGRE5VSXNUVUZCVFN4UFFVRlBMRXRCUVVzN1FVRkJRU3hGUVVOc1FpeEpRVUZKTEZOQlFWTTdRVUZCUVN4SlFVRlhMRTFCUVUwc1NVRkJTU3hOUVVGTkxIZEZRVUYzUlR0QlFVRkJMRVZCUTJoSUxFMUJRVTBzWVVGQllTeEpRVUZKTzBGQlFVRXNSVUZEZGtJc1RVRkJUU3hSUVVGUkxFVkJRVVVzWlVGQlpTeE5RVUZOTEUxQlFVMHNUVUZCVFN4WFFVRlhPMEZCUVVFc1JVRkROVVFzU1VGQlNTeFBRVUZQTEUxQlFVMHNjMEpCUVhOQ08wRkJRVUVzU1VGQldTeE5RVUZOTEd0Q1FVRnJRaXhMUVVGTE8wRkJRVUVzUlVGRGFFWXNUMEZCVHp0QlFVRkJPMEZCUzBvc1UwRkJVeXhuUWtGQlowSXNRMEZCUXl4WFFVRnRRaXhSUVVGblFpeFBRVUZuUlR0QlFVRkJMRVZCUTJoSkxFbEJRVWtzYVVKQlFXbENMRk5CUVZNc1owSkJRV2RDTEZsQlFWazdRVUZCUVN4SlFVTjBSQ3hKUVVGSk8wRkJRVUVzVFVGQlJ5eFhRVUZ0UWl4WFFVRlhMR2xDUVVGcFFpeExRVUZMTzBGQlFVRXNUVUZCU3l4TlFVRk5PMEZCUVVFc1JVRkRNVVU3UVVGQlFTeEZRVU5CTEUxQlFVMHNUMEZCVHl4UFFVRlBMRkZCUVZFc1QwRkJUeXhSUVVGUkxFOUJRVThzWVVGQllTeFJRVUZSTzBGQlFVRXNSVUZGZGtVc1NVRkJTU3hQUVVGUExHdENRVUZyUWl4TlFVRk5PMEZCUVVFc1NVRkhMMElzU1VGQlNTeE5RVUZOTEZOQlFWTXNZVUZCWVR0QlFVRkJMRTFCUXpWQ0xFOUJRVThzUzBGQlN5eE5RVUZOTEU5QlFVOHNUVUZCVFN4UlFVRlJMR05CUVdNN1FVRkJRU3hKUVVONlJDeEZRVUZQTzBGQlFVRXNUVUZEU0N4TlFVRk5MRk5CUVZNc1QwRkJUeXhUUVVGVExFbEJRVWtzVFVGQlRUdEJRVUZCTEVOQlFVa3NSVUZCUlN4TlFVRk5MRU5CUVVNc1JVRkJSU3hMUVVGTE8wRkJRVUVzUTBGQlNUdEJRVUZCTEUxQlEycEZMRTlCUVU4c1MwRkJTeXhOUVVGTk8wRkJRVUVzUlVGQlN5eExRVUZMTEZWQlFWVXNUMEZCVHl4SlFVRkpMRXRCUVVzN1FVRkJRU3hGUVVGTE8wRkJRVUVzUTBGQlV6dEJRVUZCTzBGQlFVRXNSVUZGTlVVc1JVRkJUenRCUVVGQkxFbEJRMGdzU1VGQlNUdEJRVUZCTEUxQlEwRXNUVUZCVFN4UlFVRlJMRTlCUVU4c1UwRkJVenRCUVVGQkxFMUJRemxDTEU5QlFVOHNUVUZCVFN4TlFVRk5PMEZCUVVFc1JVRkJTeXhMUVVGTExGVkJRVlVzVDBGQlR5eEpRVUZKTEV0QlFVczdRVUZCUVN4RlFVRkxPMEZCUVVFc1EwRkJVenRCUVVGQkxFMUJRM1pGTEU5QlFVOHNSMEZCUnp0QlFVRkJMRTFCUTFJc1QwRkJUeXhOUVVGTkxFMUJRVTA3UVVGQlFTeEZRVUZMTEU5QlFVOHNVMEZCVXl4TFFVRkxPMEZCUVVFc1JVRkJTeXhQUVVGUE8wRkJRVUVzUTBGQlV6dEJRVUZCTzBGQlFVRTdRVUZCUVN4RlFVa3hSU3hKUVVGSk8wRkJRVUVzUlVGRlNpeEpRVUZKTEU5QlFVOHNhMEpCUVd0Q08wRkJRVUVzU1VGQlRTeFRRVUZUTEVWQlFVVXNVMEZCVXl4UFFVRlBMRTFCUVUwc1RVRkJUU3hOUVVGTkxGRkJRVkVzVFVGQlRTeE5RVUZOTEZWQlFWVTdRVUZCUVN4RlFVTjZSenRCUVVGQkxHRkJRVk1zUlVGQlJTeFRRVUZUTEU5QlFVOHNUVUZCVFN4NVFrRkJlVUlzVVVGQlVTeFhRVUZYTEZWQlFWVTdRVUZCUVN4RlFVVTFSaXhQUVVGUE8wRkJRVUU3SWl3S0lDQWlaR1ZpZFdkSlpDSTZJQ0k0TmpRMk1Ea3lNRFZDT1VOQ05VTkVOalEzTlRaRk1qRTJORGMxTmtVeU1TSXNDaUFnSW01aGJXVnpJam9nVzEwS2ZRPT1cbiIsIi8vIGNvbmZpZy1zY2hlbWFcblxuY29uc3QgbW9kZSA9IFwidGVzdFwiO1xuXG5leHBvcnQgY29uc3QgY29uZmlnU2NoZW1hID0geyBnZXQ6IGFzeW5jICgpID0+IHtcbiAgcmV0dXJuIHsgbW9kZSxcbiAgfVxufX0iLCJleHBvcnQgZGVmYXVsdCB7XG59O1xuIiwiLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fanNvblN0cmluZ2lmeVN0cmluZy50c1xuLyoqXG4qIEluIHRoZSBwYXN0LCBuYW1lIG9mIGB0eXBpYWAgd2FzIGB0eXBlc2NyaXB0LWpzb25gLCBhbmQgc3VwcG9ydGVkIEpTT05cbiogc2VyaWFsaXphdGlvbiBieSB3cmFwcGluZyBgZmFzdC1qc29uLXN0cmluZ2lmeS4gYHR5cGVzY3JpcHQtanNvbmB3YXMgYSBoZWxwZXJcbiogbGlicmFyeSBvZmBmYXN0LWpzb24tc3RyaW5naWZ5YCwgd2hpY2ggY2FuIHNraXAgbWFudWFsIEpTT04gc2NoZW1hIGRlZmluaXRpb25cbioganVzdCBieSBwdXR0aW5nIHB1cmUgVHlwZVNjcmlwdCB0eXBlLlxuKlxuKiBUaGlzIGAkc3RyaW5nYCBmdW5jdGlvbiBpcyBhIHBhcnQgb2YgYGZhc3QtanNvbi1zdHJpbmdpZnlgIGF0IHRoYXQgdGltZSwgYW5kXG4qIHN0aWxsIGJlaW5nIHVzZWQgaW4gYHR5cGlhYCBmb3IgdGhlIHN0cmluZyBzZXJpYWxpemF0aW9uLlxuKlxuKiBAcmVmZXJlbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9mYXN0aWZ5L2Zhc3QtanNvbi1zdHJpbmdpZnkvYmxvYi9tYXN0ZXIvbGliL3NlcmlhbGl6ZXIuanNcbiogQGJsb2cgaHR0cHM6Ly9kZXYudG8vc2FtY2hvbi9nb29kLWJ5ZS10eXBlc2NyaXB0LWlzLWFuY2VzdG9yLW9mLXR5cGlhLTIwMDAweC1mYXN0ZXItdmFsaWRhdG9yLTQ5ZmlcbiovXG5jb25zdCBfanNvblN0cmluZ2lmeVN0cmluZyA9IChzdHIpID0+IHtcblx0Y29uc3QgbGVuID0gc3RyLmxlbmd0aDtcblx0bGV0IHJlc3VsdCA9IFwiXCI7XG5cdGxldCBsYXN0ID0gLTE7XG5cdGxldCBwb2ludCA9IDI1NTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdHBvaW50ID0gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdFx0aWYgKHBvaW50IDwgMzIpIHJldHVybiBKU09OLnN0cmluZ2lmeShzdHIpO1xuXHRcdGlmIChwb2ludCA+PSA1NTI5NiAmJiBwb2ludCA8PSA1NzM0MykgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0cik7XG5cdFx0aWYgKHBvaW50ID09PSAzNCB8fCBwb2ludCA9PT0gOTIpIHtcblx0XHRcdGxhc3QgPT09IC0xICYmIChsYXN0ID0gMCk7XG5cdFx0XHRyZXN1bHQgKz0gc3RyLnNsaWNlKGxhc3QsIGkpICsgXCJcXFxcXCI7XG5cdFx0XHRsYXN0ID0gaTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGxhc3QgPT09IC0xICYmIFwiXFxcIlwiICsgc3RyICsgXCJcXFwiXCIgfHwgXCJcXFwiXCIgKyByZXN1bHQgKyBzdHIuc2xpY2UobGFzdCkgKyBcIlxcXCJcIjtcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9qc29uU3RyaW5naWZ5U3RyaW5nIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9qc29uU3RyaW5naWZ5U3RyaW5nLm1qcy5tYXAiLCIvLyNyZWdpb24gc3JjL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydC50c1xuY29uc3QgX3ZhbGlkYXRlUmVwb3J0ID0gKGFycmF5KSA9PiB7XG5cdGNvbnN0IGlzQW5jZXN0b3IgPSAoYW5jZXN0b3IsIGRlc2NlbmRhbnQpID0+IGRlc2NlbmRhbnQgPT09IGFuY2VzdG9yIHx8IGRlc2NlbmRhbnQuc3RhcnRzV2l0aChgJHthbmNlc3Rvcn0uYCkgfHwgZGVzY2VuZGFudC5zdGFydHNXaXRoKGAke2FuY2VzdG9yfVtgKTtcblx0Y29uc3QgcmVwb3J0YWJsZSA9IChwYXRoKSA9PiB7XG5cdFx0aWYgKGFycmF5Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIHRydWU7XG5cdFx0Y29uc3QgbGFzdCA9IGFycmF5W2FycmF5Lmxlbmd0aCAtIDFdLnBhdGg7XG5cdFx0cmV0dXJuIGlzQW5jZXN0b3IocGF0aCwgbGFzdCkgPT09IGZhbHNlICYmIGlzQW5jZXN0b3IobGFzdCwgcGF0aCkgPT09IGZhbHNlO1xuXHR9O1xuXHRyZXR1cm4gKGV4Y2VwdGFibGUsIGVycm9yKSA9PiB7XG5cdFx0aWYgKGV4Y2VwdGFibGUgJiYgcmVwb3J0YWJsZShlcnJvci5wYXRoKSkge1xuXHRcdFx0aWYgKGVycm9yLnZhbHVlID09PSB2b2lkIDApIGVycm9yLmRlc2NyaXB0aW9uID8/PSBbXG5cdFx0XHRcdFwiVGhlIHZhbHVlIGF0IHRoaXMgcGF0aCBpcyBgdW5kZWZpbmVkYC5cIixcblx0XHRcdFx0XCJcIixcblx0XHRcdFx0YFBsZWFzZSBmaWxsIHRoZSBcXGAke2Vycm9yLmV4cGVjdGVkfVxcYCB0eXBlZCB2YWx1ZSBuZXh0IHRpbWUuYFxuXHRcdFx0XS5qb2luKFwiXFxuXCIpO1xuXHRcdFx0YXJyYXkucHVzaChlcnJvcik7XG5cdFx0fVxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF92YWxpZGF0ZVJlcG9ydCB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fdmFsaWRhdGVSZXBvcnQubWpzLm1hcCIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2luZGV4VGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvaW5kZXguYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9pbmRleC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe30pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQubWVzc2FnZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcIm1lc3NhZ2VcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQubWVzc2FnZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5tZXNzYWdlXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0Lm1lc3NhZ2VcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcIm1lc3NhZ2VcIjoke19qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQubWVzc2FnZSl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dpbmRvdy9jbG9zZS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dpbmRvdy9jbG9zZS5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe30pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gXCJ7fVwiO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvZ2V0LXN0YXRlLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2luZG93L2dldC1zdGF0ZS5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe30pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmlzTWF4aW1pemVkICYmIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNNaW5pbWl6ZWQ7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJpc01heGltaXplZFwiID09PSBrZXkgfHwgXCJpc01pbmltaXplZFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNNYXhpbWl6ZWQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuaXNNYXhpbWl6ZWRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmlzTWF4aW1pemVkXG4gICAgICAgICAgICB9KSwgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc01pbmltaXplZCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc01pbmltaXplZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNNaW5pbWl6ZWRcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImlzTWF4aW1pemVkXCI6JHtTdHJpbmcoaW5wdXQuaXNNYXhpbWl6ZWQpfSxcImlzTWluaW1pemVkXCI6JHtTdHJpbmcoaW5wdXQuaXNNaW5pbWl6ZWQpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWF4aW1pemUuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWF4aW1pemUuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNNYXhpbWl6ZWQ7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJpc01heGltaXplZFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNNYXhpbWl6ZWQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuaXNNYXhpbWl6ZWRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmlzTWF4aW1pemVkXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wiaXNNYXhpbWl6ZWRcIjoke1N0cmluZyhpbnB1dC5pc01heGltaXplZCl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2luZG93L21pbmltaXplLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2luZG93L21pbmltaXplLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBcInt9XCI7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dhbGxwYXBlci9jYW5jZWwuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93YWxscGFwZXIvY2FuY2VsLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNXYWxscGFwZXI7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJpc1dhbGxwYXBlclwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNXYWxscGFwZXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuaXNXYWxscGFwZXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmlzV2FsbHBhcGVyXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJpc1dhbGxwYXBlclwiOiR7U3RyaW5nKGlucHV0LmlzV2FsbHBhcGVyKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dhbGxwYXBlci9zZXQuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93YWxscGFwZXIvc2V0LmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNXYWxscGFwZXI7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJpc1dhbGxwYXBlclwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNXYWxscGFwZXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuaXNXYWxscGFwZXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmlzV2FsbHBhcGVyXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJpc1dhbGxwYXBlclwiOiR7U3RyaW5nKGlucHV0LmlzV2FsbHBhcGVyKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX2RlY2ltYWwudHNcbmNvbnN0IF9kZWNpbWFsRGVjb21wb3NlID0gKHZhbHVlKSA9PiB7XG5cdGlmIChOdW1iZXIuaXNGaW5pdGUodmFsdWUpID09PSBmYWxzZSkgcmV0dXJuIG51bGw7XG5cdGNvbnN0IFttYW50aXNzYSA9IFwiMFwiLCBleHBvbmVudFRleHQgPSBcIjBcIl0gPSB2YWx1ZS50b1N0cmluZygpLnNwbGl0KFwiZVwiKTtcblx0Y29uc3QgbmVnYXRpdmUgPSBtYW50aXNzYS5zdGFydHNXaXRoKFwiLVwiKTtcblx0Y29uc3QgdW5zaWduZWQgPSBuZWdhdGl2ZSA/IG1hbnRpc3NhLnNsaWNlKDEpIDogbWFudGlzc2E7XG5cdGNvbnN0IHBvaW50ID0gdW5zaWduZWQuaW5kZXhPZihcIi5cIik7XG5cdGNvbnN0IGRlY2ltYWxzID0gcG9pbnQgPT09IC0xID8gMCA6IHVuc2lnbmVkLmxlbmd0aCAtIHBvaW50IC0gMTtcblx0Y29uc3QgZGlnaXRzID0gQmlnSW50KHVuc2lnbmVkLnJlcGxhY2UoXCIuXCIsIFwiXCIpKTtcblx0cmV0dXJuIHtcblx0XHRjb2VmZmljaWVudDogbmVnYXRpdmUgPyAtZGlnaXRzIDogZGlnaXRzLFxuXHRcdGV4cG9uZW50OiBOdW1iZXIoZXhwb25lbnRUZXh0KSAtIGRlY2ltYWxzXG5cdH07XG59O1xuY29uc3QgX2RlY2ltYWxEaXZpZGUgPSAodmFsdWUsIGRpdmlzb3IpID0+IHtcblx0Y29uc3QgZGl2aWRlbmQgPSBfZGVjaW1hbERlY29tcG9zZSh2YWx1ZSk7XG5cdGlmIChkaXZpZGVuZCA9PT0gbnVsbCB8fCBkaXZpc29yLmNvZWZmaWNpZW50ID09PSBCaWdJbnQoMCkpIHJldHVybiBudWxsO1xuXHRjb25zdCBleHBvbmVudCA9IGRpdmlkZW5kLmV4cG9uZW50IC0gZGl2aXNvci5leHBvbmVudDtcblx0cmV0dXJuIGV4cG9uZW50ID49IDAgPyB7XG5cdFx0bnVtZXJhdG9yOiBkaXZpZGVuZC5jb2VmZmljaWVudCAqIF9kZWNpbWFsUG93ZXIoZXhwb25lbnQpLFxuXHRcdGRlbm9taW5hdG9yOiBkaXZpc29yLmNvZWZmaWNpZW50XG5cdH0gOiB7XG5cdFx0bnVtZXJhdG9yOiBkaXZpZGVuZC5jb2VmZmljaWVudCxcblx0XHRkZW5vbWluYXRvcjogZGl2aXNvci5jb2VmZmljaWVudCAqIF9kZWNpbWFsUG93ZXIoLWV4cG9uZW50KVxuXHR9O1xufTtcbmNvbnN0IF9kZWNpbWFsSW50ZWdlclN0ZXAgPSAodmFsdWUpID0+IHtcblx0Y29uc3QgZGVjaW1hbCA9IF9kZWNpbWFsRGVjb21wb3NlKHZhbHVlKTtcblx0aWYgKGRlY2ltYWwgPT09IG51bGwgfHwgZGVjaW1hbC5jb2VmZmljaWVudCA8PSBCaWdJbnQoMCkpIHJldHVybiBudWxsO1xuXHRpZiAoZGVjaW1hbC5leHBvbmVudCA+PSAwKSByZXR1cm4ge1xuXHRcdGNvZWZmaWNpZW50OiBkZWNpbWFsLmNvZWZmaWNpZW50ICogX2RlY2ltYWxQb3dlcihkZWNpbWFsLmV4cG9uZW50KSxcblx0XHRleHBvbmVudDogMFxuXHR9O1xuXHRjb25zdCBkZW5vbWluYXRvciA9IF9kZWNpbWFsUG93ZXIoLWRlY2ltYWwuZXhwb25lbnQpO1xuXHRyZXR1cm4ge1xuXHRcdGNvZWZmaWNpZW50OiBkZWNpbWFsLmNvZWZmaWNpZW50IC8gX2RlY2ltYWxHY2QoZGVjaW1hbC5jb2VmZmljaWVudCwgZGVub21pbmF0b3IpLFxuXHRcdGV4cG9uZW50OiAwXG5cdH07XG59O1xuY29uc3QgX2RlY2ltYWxUb051bWJlciA9ICh2YWx1ZSkgPT4gTnVtYmVyKGAke3ZhbHVlLmNvZWZmaWNpZW50fWUke3ZhbHVlLmV4cG9uZW50fWApO1xuY29uc3QgX2RlY2ltYWxQb3dlciA9IChleHBvbmVudCkgPT4gQmlnSW50KDEwKSAqKiBCaWdJbnQoZXhwb25lbnQpO1xuY29uc3QgX2RlY2ltYWxHY2QgPSAoeCwgeSkgPT4ge1xuXHR3aGlsZSAoeSAhPT0gQmlnSW50KDApKSBbeCwgeV0gPSBbeSwgeCAlIHldO1xuXHRyZXR1cm4geCA8IEJpZ0ludCgwKSA/IC14IDogeDtcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9kZWNpbWFsRGVjb21wb3NlLCBfZGVjaW1hbERpdmlkZSwgX2RlY2ltYWxHY2QsIF9kZWNpbWFsSW50ZWdlclN0ZXAsIF9kZWNpbWFsUG93ZXIsIF9kZWNpbWFsVG9OdW1iZXIgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X2RlY2ltYWwubWpzLm1hcCIsImltcG9ydCB7IF9kZWNpbWFsRGVjb21wb3NlLCBfZGVjaW1hbERpdmlkZSB9IGZyb20gXCIuL19kZWNpbWFsLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9faXNNdWx0aXBsZU9mLnRzXG5jb25zdCBfaXNNdWx0aXBsZU9mID0gKHZhbHVlLCBtdWx0aXBsZU9mKSA9PiB7XG5cdGNvbnN0IGRpdmlzb3IgPSBfZGVjaW1hbERlY29tcG9zZShtdWx0aXBsZU9mKTtcblx0aWYgKGRpdmlzb3IgPT09IG51bGwgfHwgZGl2aXNvci5jb2VmZmljaWVudCA8PSBCaWdJbnQoMCkpIHJldHVybiBmYWxzZTtcblx0Y29uc3QgcmF0aW8gPSBfZGVjaW1hbERpdmlkZSh2YWx1ZSwgZGl2aXNvcik7XG5cdHJldHVybiByYXRpbyAhPT0gbnVsbCAmJiByYXRpby5udW1lcmF0b3IgJSByYXRpby5kZW5vbWluYXRvciA9PT0gQmlnSW50KDApO1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX2lzTXVsdGlwbGVPZiB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1faXNNdWx0aXBsZU9mLm1qcy5tYXAiLCJpbXBvcnQgeyBfZGVjaW1hbERlY29tcG9zZSwgX2RlY2ltYWxEaXZpZGUsIF9kZWNpbWFsR2NkLCBfZGVjaW1hbEludGVnZXJTdGVwLCBfZGVjaW1hbFBvd2VyLCBfZGVjaW1hbFRvTnVtYmVyIH0gZnJvbSBcIi4vX2RlY2ltYWwubWpzXCI7XG5pbXBvcnQgeyBfaXNNdWx0aXBsZU9mIH0gZnJvbSBcIi4vX2lzTXVsdGlwbGVPZi5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX3JhbmRvbU11bHRpcGxlLnRzXG5jb25zdCBfcmFuZG9tTXVsdGlwbGUgPSAocHJvcHMpID0+IHtcblx0Y29uc3Qgc3RlcCA9IHByb3BzLmludGVnZXIgPyBfZGVjaW1hbEludGVnZXJTdGVwKHByb3BzLm11bHRpcGxlT2YpIDogX2RlY2ltYWxEZWNvbXBvc2UocHJvcHMubXVsdGlwbGVPZik7XG5cdGlmIChzdGVwID09PSBudWxsIHx8IHN0ZXAuY29lZmZpY2llbnQgPD0gQmlnSW50KDApKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgbXVsdGlwbGVPZiB2YWx1ZSBtdXN0IGJlIGEgcG9zaXRpdmUgZmluaXRlIG51bWJlci5cIik7XG5cdGNvbnN0IGxvd2VyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWluaW11bSwgc3RlcCk7XG5cdGNvbnN0IHVwcGVyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWF4aW11bSwgc3RlcCk7XG5cdGlmIChsb3dlciA9PT0gbnVsbCB8fCB1cHBlciA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHJhbmRvbSBudW1iZXIgcmFuZ2UgbXVzdCBiZSBmaW5pdGUuXCIpO1xuXHRjb25zdCBtaW5pbXVtID0gbG93ZXJCb3VuZChsb3dlciwgcHJvcHMuZXhjbHVzaXZlTWluaW11bSk7XG5cdGNvbnN0IG1heGltdW0gPSB1cHBlckJvdW5kKHVwcGVyLCBwcm9wcy5leGNsdXNpdmVNYXhpbXVtKTtcblx0aWYgKG1pbmltdW0gPiBtYXhpbXVtKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgcmFuZ2UgZG9lcyBub3QgY29udGFpbiBhIG11bHRpcGxlT2YgdmFsdWUuXCIpO1xuXHRjb25zdCBzZWxlY3RlZCA9IHJhbmRvbUJpZ2ludChtaW5pbXVtLCBtYXhpbXVtKTtcblx0Y29uc3QgY2FuZGlkYXRlcyA9IHVuaXF1ZShbXG5cdFx0c2VsZWN0ZWQsXG5cdFx0bWluaW11bSxcblx0XHRtYXhpbXVtLFxuXHRcdGNsYW1wKEJpZ0ludCgwKSwgbWluaW11bSwgbWF4aW11bSksXG5cdFx0Y2xhbXAoQmlnSW50KDEpLCBtaW5pbXVtLCBtYXhpbXVtKSxcblx0XHRjbGFtcChCaWdJbnQoLTEpLCBtaW5pbXVtLCBtYXhpbXVtKSxcblx0XHQuLi5uZWFyYnkoc2VsZWN0ZWQsIG1pbmltdW0sIG1heGltdW0pXG5cdF0pO1xuXHRmb3IgKGNvbnN0IGNvZWZmaWNpZW50IG9mIGNhbmRpZGF0ZXMpIHtcblx0XHRjb25zdCB2YWx1ZSA9IF9kZWNpbWFsVG9OdW1iZXIoe1xuXHRcdFx0Y29lZmZpY2llbnQ6IHN0ZXAuY29lZmZpY2llbnQgKiBjb2VmZmljaWVudCxcblx0XHRcdGV4cG9uZW50OiBzdGVwLmV4cG9uZW50XG5cdFx0fSk7XG5cdFx0aWYgKGlzVmFsaWQocHJvcHMsIHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuXHR9XG5cdGNvbnN0IGFsaWduZWQgPSBmaW5kUmVwcmVzZW50YWJsZUludGVnZXJNdWx0aXBsZShwcm9wcyk7XG5cdGlmIChhbGlnbmVkICE9PSBudWxsKSByZXR1cm4gYWxpZ25lZDtcblx0Y29uc3QgZGVjaW1hbEFsaWduZWQgPSBmaW5kUmVwcmVzZW50YWJsZURlY2ltYWxNdWx0aXBsZShwcm9wcywgc3RlcCk7XG5cdGlmIChkZWNpbWFsQWxpZ25lZCAhPT0gbnVsbCkgcmV0dXJuIGRlY2ltYWxBbGlnbmVkO1xuXHR0aHJvdyBuZXcgRXJyb3IoXCJUaGUgcmFuZ2UgZG9lcyBub3QgY29udGFpbiBhIHJlcHJlc2VudGFibGUgbXVsdGlwbGVPZiB2YWx1ZS5cIik7XG59O1xuY29uc3QgaXNWYWxpZCA9IChwcm9wcywgdmFsdWUpID0+IE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgJiYgKHByb3BzLmludGVnZXIgPT09IGZhbHNlIHx8IE51bWJlci5pc0ludGVnZXIodmFsdWUpKSAmJiAocHJvcHMuZXhjbHVzaXZlTWluaW11bSA/IHZhbHVlID4gcHJvcHMubWluaW11bSA6IHZhbHVlID49IHByb3BzLm1pbmltdW0pICYmIChwcm9wcy5leGNsdXNpdmVNYXhpbXVtID8gdmFsdWUgPCBwcm9wcy5tYXhpbXVtIDogdmFsdWUgPD0gcHJvcHMubWF4aW11bSkgJiYgX2lzTXVsdGlwbGVPZih2YWx1ZSwgcHJvcHMubXVsdGlwbGVPZik7XG5jb25zdCBmaW5kUmVwcmVzZW50YWJsZURlY2ltYWxNdWx0aXBsZSA9IChwcm9wcywgc3RlcCkgPT4ge1xuXHRjb25zdCBsaW1pdCA9IEJpZ0ludChcIjk5OTk5OTk5OTk5OTk5OVwiKTtcblx0Zm9yIChsZXQgZXhwb25lbnQgPSAtMzI0OyBleHBvbmVudCA8PSAzMDg7ICsrZXhwb25lbnQpIHtcblx0XHRjb25zdCB1bml0ID0ge1xuXHRcdFx0Y29lZmZpY2llbnQ6IEJpZ0ludCgxKSxcblx0XHRcdGV4cG9uZW50XG5cdFx0fTtcblx0XHRjb25zdCBsb3dlciA9IF9kZWNpbWFsRGl2aWRlKHByb3BzLm1pbmltdW0sIHVuaXQpO1xuXHRcdGNvbnN0IHVwcGVyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWF4aW11bSwgdW5pdCk7XG5cdFx0aWYgKGxvd2VyID09PSBudWxsIHx8IHVwcGVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0XHRjb25zdCBjb2VmZmljaWVudE1pbmltdW0gPSBtYXgoLWxpbWl0LCBsb3dlckJvdW5kKGxvd2VyLCBwcm9wcy5leGNsdXNpdmVNaW5pbXVtKSk7XG5cdFx0Y29uc3QgY29lZmZpY2llbnRNYXhpbXVtID0gbWluKGxpbWl0LCB1cHBlckJvdW5kKHVwcGVyLCBwcm9wcy5leGNsdXNpdmVNYXhpbXVtKSk7XG5cdFx0aWYgKGNvZWZmaWNpZW50TWluaW11bSA+IGNvZWZmaWNpZW50TWF4aW11bSkgY29udGludWU7XG5cdFx0Y29uc3QgY29lZmZpY2llbnRTdGVwID0gZGVjaW1hbENvZWZmaWNpZW50U3RlcChzdGVwLCBleHBvbmVudCk7XG5cdFx0Y29uc3QgbWluaW11bSA9IGxvd2VyQm91bmQoe1xuXHRcdFx0bnVtZXJhdG9yOiBjb2VmZmljaWVudE1pbmltdW0sXG5cdFx0XHRkZW5vbWluYXRvcjogY29lZmZpY2llbnRTdGVwXG5cdFx0fSwgZmFsc2UpO1xuXHRcdGNvbnN0IG1heGltdW0gPSB1cHBlckJvdW5kKHtcblx0XHRcdG51bWVyYXRvcjogY29lZmZpY2llbnRNYXhpbXVtLFxuXHRcdFx0ZGVub21pbmF0b3I6IGNvZWZmaWNpZW50U3RlcFxuXHRcdH0sIGZhbHNlKTtcblx0XHRpZiAobWluaW11bSA+IG1heGltdW0pIGNvbnRpbnVlO1xuXHRcdGNvbnN0IHNlbGVjdGVkID0gcmFuZG9tQmlnaW50KG1pbmltdW0sIG1heGltdW0pO1xuXHRcdGZvciAoY29uc3QgcXVvdGllbnQgb2YgdW5pcXVlKFtcblx0XHRcdHNlbGVjdGVkLFxuXHRcdFx0bWluaW11bSxcblx0XHRcdG1heGltdW0sXG5cdFx0XHRjbGFtcChCaWdJbnQoMCksIG1pbmltdW0sIG1heGltdW0pLFxuXHRcdFx0Li4ubmVhcmJ5KHNlbGVjdGVkLCBtaW5pbXVtLCBtYXhpbXVtKVxuXHRcdF0pKSB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IF9kZWNpbWFsVG9OdW1iZXIoe1xuXHRcdFx0XHRjb2VmZmljaWVudDogY29lZmZpY2llbnRTdGVwICogcXVvdGllbnQsXG5cdFx0XHRcdGV4cG9uZW50XG5cdFx0XHR9KTtcblx0XHRcdGlmIChpc1ZhbGlkKHByb3BzLCB2YWx1ZSkpIHJldHVybiB2YWx1ZTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIG51bGw7XG59O1xuY29uc3QgZGVjaW1hbENvZWZmaWNpZW50U3RlcCA9IChzdGVwLCBleHBvbmVudCkgPT4ge1xuXHRjb25zdCBkaWZmZXJlbmNlID0gZXhwb25lbnQgLSBzdGVwLmV4cG9uZW50O1xuXHRpZiAoZGlmZmVyZW5jZSA+PSAwKSB7XG5cdFx0Y29uc3QgcG93ZXIgPSBfZGVjaW1hbFBvd2VyKGRpZmZlcmVuY2UpO1xuXHRcdHJldHVybiBzdGVwLmNvZWZmaWNpZW50IC8gX2RlY2ltYWxHY2Qoc3RlcC5jb2VmZmljaWVudCwgcG93ZXIpO1xuXHR9XG5cdHJldHVybiBzdGVwLmNvZWZmaWNpZW50ICogX2RlY2ltYWxQb3dlcigtZGlmZmVyZW5jZSk7XG59O1xuY29uc3QgZmluZFJlcHJlc2VudGFibGVJbnRlZ2VyTXVsdGlwbGUgPSAocHJvcHMpID0+IHtcblx0Y29uc3Qgc3RlcCA9IF9kZWNpbWFsSW50ZWdlclN0ZXAocHJvcHMubXVsdGlwbGVPZik7XG5cdGlmIChzdGVwID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0Y29uc3QgdW5pdCA9IHtcblx0XHRjb2VmZmljaWVudDogQmlnSW50KDEpLFxuXHRcdGV4cG9uZW50OiAwXG5cdH07XG5cdGNvbnN0IGxvd2VyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWluaW11bSwgdW5pdCk7XG5cdGNvbnN0IHVwcGVyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWF4aW11bSwgdW5pdCk7XG5cdGlmIChsb3dlciA9PT0gbnVsbCB8fCB1cHBlciA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cdGNvbnN0IG1pbmltdW0gPSBsb3dlckJvdW5kKGxvd2VyLCBwcm9wcy5leGNsdXNpdmVNaW5pbXVtKTtcblx0Y29uc3QgbWF4aW11bSA9IHVwcGVyQm91bmQodXBwZXIsIHByb3BzLmV4Y2x1c2l2ZU1heGltdW0pO1xuXHRpZiAobWluaW11bSA+IG1heGltdW0pIHJldHVybiBudWxsO1xuXHRpZiAobWluaW11bSA8PSBCaWdJbnQoMCkgJiYgbWF4aW11bSA+PSBCaWdJbnQoMCkpIHJldHVybiAwO1xuXHRjb25zdCBjYW5kaWRhdGUgPSBtaW5pbXVtID4gQmlnSW50KDApID8gZmluZFBvc2l0aXZlQWxpZ25lZChtaW5pbXVtLCBtYXhpbXVtLCBzdGVwLmNvZWZmaWNpZW50KSA6ICgoKSA9PiB7XG5cdFx0Y29uc3QgbWFnbml0dWRlID0gZmluZFBvc2l0aXZlQWxpZ25lZCgtbWF4aW11bSwgLW1pbmltdW0sIHN0ZXAuY29lZmZpY2llbnQpO1xuXHRcdHJldHVybiBtYWduaXR1ZGUgPT09IG51bGwgPyBudWxsIDogLW1hZ25pdHVkZTtcblx0fSkoKTtcblx0aWYgKGNhbmRpZGF0ZSA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cdGNvbnN0IHZhbHVlID0gTnVtYmVyKGNhbmRpZGF0ZSk7XG5cdHJldHVybiBpc1ZhbGlkKHByb3BzLCB2YWx1ZSkgPyB2YWx1ZSA6IG51bGw7XG59O1xuY29uc3QgZmluZFBvc2l0aXZlQWxpZ25lZCA9IChtaW5pbXVtLCBtYXhpbXVtLCBpbnRlZ2VyU3RlcCkgPT4ge1xuXHRjb25zdCBmaXJzdCA9IGJpdExlbmd0aChtaW5pbXVtKSAtIDE7XG5cdGNvbnN0IGxhc3QgPSBiaXRMZW5ndGgobWF4aW11bSkgLSAxO1xuXHRmb3IgKGxldCBleHBvbmVudCA9IGZpcnN0OyBleHBvbmVudCA8PSBsYXN0OyArK2V4cG9uZW50KSB7XG5cdFx0Y29uc3QgYmFuZE1pbmltdW0gPSBtYXgobWluaW11bSwgQmlnSW50KDEpIDw8IEJpZ0ludChleHBvbmVudCkpO1xuXHRcdGNvbnN0IGJhbmRNYXhpbXVtID0gbWluKG1heGltdW0sIChCaWdJbnQoMSkgPDwgQmlnSW50KGV4cG9uZW50ICsgMSkpIC0gQmlnSW50KDEpKTtcblx0XHRjb25zdCBxdWFudHVtID0gZXhwb25lbnQgPD0gNTIgPyBCaWdJbnQoMSkgOiBCaWdJbnQoMSkgPDwgQmlnSW50KGV4cG9uZW50IC0gNTIpO1xuXHRcdGNvbnN0IGFsaWduZWRTdGVwID0gaW50ZWdlclN0ZXAgLyBfZGVjaW1hbEdjZChpbnRlZ2VyU3RlcCwgcXVhbnR1bSkgKiBxdWFudHVtO1xuXHRcdGNvbnN0IGxvd2VyID0gbG93ZXJCb3VuZCh7XG5cdFx0XHRudW1lcmF0b3I6IGJhbmRNaW5pbXVtLFxuXHRcdFx0ZGVub21pbmF0b3I6IGFsaWduZWRTdGVwXG5cdFx0fSwgZmFsc2UpO1xuXHRcdGNvbnN0IHVwcGVyID0gdXBwZXJCb3VuZCh7XG5cdFx0XHRudW1lcmF0b3I6IGJhbmRNYXhpbXVtLFxuXHRcdFx0ZGVub21pbmF0b3I6IGFsaWduZWRTdGVwXG5cdFx0fSwgZmFsc2UpO1xuXHRcdGlmIChsb3dlciA8PSB1cHBlcikgcmV0dXJuIHJhbmRvbUJpZ2ludChsb3dlciwgdXBwZXIpICogYWxpZ25lZFN0ZXA7XG5cdH1cblx0cmV0dXJuIG51bGw7XG59O1xuY29uc3QgYml0TGVuZ3RoID0gKHZhbHVlKSA9PiB2YWx1ZS50b1N0cmluZygyKS5sZW5ndGg7XG5jb25zdCBtaW4gPSAoeCwgeSkgPT4geCA8IHkgPyB4IDogeTtcbmNvbnN0IG1heCA9ICh4LCB5KSA9PiB4ID4geSA/IHggOiB5O1xuY29uc3QgbG93ZXJCb3VuZCA9IChyYXRpbywgZXhjbHVzaXZlKSA9PiB7XG5cdGNvbnN0IHF1b3RpZW50ID0gcmF0aW8ubnVtZXJhdG9yIC8gcmF0aW8uZGVub21pbmF0b3I7XG5cdGNvbnN0IHJlbWFpbmRlciA9IHJhdGlvLm51bWVyYXRvciAlIHJhdGlvLmRlbm9taW5hdG9yO1xuXHRyZXR1cm4gcXVvdGllbnQgKyAocmVtYWluZGVyID4gQmlnSW50KDApID8gQmlnSW50KDEpIDogQmlnSW50KDApKSArIChleGNsdXNpdmUgJiYgcmVtYWluZGVyID09PSBCaWdJbnQoMCkgPyBCaWdJbnQoMSkgOiBCaWdJbnQoMCkpO1xufTtcbmNvbnN0IHVwcGVyQm91bmQgPSAocmF0aW8sIGV4Y2x1c2l2ZSkgPT4ge1xuXHRjb25zdCBxdW90aWVudCA9IHJhdGlvLm51bWVyYXRvciAvIHJhdGlvLmRlbm9taW5hdG9yO1xuXHRjb25zdCByZW1haW5kZXIgPSByYXRpby5udW1lcmF0b3IgJSByYXRpby5kZW5vbWluYXRvcjtcblx0cmV0dXJuIHF1b3RpZW50IC0gKHJlbWFpbmRlciA8IEJpZ0ludCgwKSA/IEJpZ0ludCgxKSA6IEJpZ0ludCgwKSkgLSAoZXhjbHVzaXZlICYmIHJlbWFpbmRlciA9PT0gQmlnSW50KDApID8gQmlnSW50KDEpIDogQmlnSW50KDApKTtcbn07XG5jb25zdCByYW5kb21CaWdpbnQgPSAobWluaW11bSwgbWF4aW11bSkgPT4ge1xuXHRjb25zdCBzY2FsZSA9IEJpZ0ludCgxKSA8PCBCaWdJbnQoNTMpO1xuXHRjb25zdCBzYW1wbGUgPSBCaWdJbnQoTWF0aC5taW4oTnVtYmVyKHNjYWxlIC0gQmlnSW50KDEpKSwgTWF0aC5mbG9vcihNYXRoLm1heCgwLCBNYXRoLnJhbmRvbSgpKSAqIE51bWJlcihzY2FsZSkpKSk7XG5cdHJldHVybiBtaW5pbXVtICsgKG1heGltdW0gLSBtaW5pbXVtICsgQmlnSW50KDEpKSAqIHNhbXBsZSAvIHNjYWxlO1xufTtcbmNvbnN0IGNsYW1wID0gKHZhbHVlLCBtaW5pbXVtLCBtYXhpbXVtKSA9PiB2YWx1ZSA8IG1pbmltdW0gPyBtaW5pbXVtIDogdmFsdWUgPiBtYXhpbXVtID8gbWF4aW11bSA6IHZhbHVlO1xuY29uc3QgbmVhcmJ5ID0gKHNlbGVjdGVkLCBtaW5pbXVtLCBtYXhpbXVtKSA9PiB7XG5cdGNvbnN0IG91dHB1dCA9IFtdO1xuXHRmb3IgKGxldCBkaXN0YW5jZSA9IEJpZ0ludCgxKTsgZGlzdGFuY2UgPD0gQmlnSW50KDMyKTsgKytkaXN0YW5jZSkge1xuXHRcdGlmIChzZWxlY3RlZCAtIGRpc3RhbmNlID49IG1pbmltdW0pIG91dHB1dC5wdXNoKHNlbGVjdGVkIC0gZGlzdGFuY2UpO1xuXHRcdGlmIChzZWxlY3RlZCArIGRpc3RhbmNlIDw9IG1heGltdW0pIG91dHB1dC5wdXNoKHNlbGVjdGVkICsgZGlzdGFuY2UpO1xuXHR9XG5cdHJldHVybiBvdXRwdXQ7XG59O1xuY29uc3QgdW5pcXVlID0gKHZhbHVlcykgPT4gWy4uLm5ldyBTZXQodmFsdWVzKV07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21NdWx0aXBsZSB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fcmFuZG9tTXVsdGlwbGUubWpzLm1hcCIsImltcG9ydCB7IF9yYW5kb21NdWx0aXBsZSB9IGZyb20gXCIuL19yYW5kb21NdWx0aXBsZS5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX3JhbmRvbUludGVnZXIudHNcbmNvbnN0IF9yYW5kb21JbnRlZ2VyID0gKHNjaGVtYSkgPT4ge1xuXHRjb25zdCBsb3dlciA9IGdldExvd2VyQm91bmRhcnkoc2NoZW1hKTtcblx0Y29uc3QgdXBwZXIgPSBnZXRVcHBlckJvdW5kYXJ5KHNjaGVtYSk7XG5cdGNvbnN0IG1pbmltdW0gPSBsb3dlcj8udmFsdWUgPz8gKHVwcGVyID09PSBudWxsID8gMCA6IHVwcGVyLnZhbHVlIC0gMTAwKTtcblx0Y29uc3QgbWF4aW11bSA9IHVwcGVyPy52YWx1ZSA/PyAobG93ZXIgPT09IG51bGwgPyAxMDAgOiBsb3dlci52YWx1ZSArIDEwMCk7XG5cdGlmIChtaW5pbXVtID4gbWF4aW11bSkgdGhyb3cgbmV3IEVycm9yKFwiTWluaW11bSB2YWx1ZSBpcyBncmVhdGVyIHRoYW4gbWF4aW11bSB2YWx1ZS5cIik7XG5cdHJldHVybiBzY2hlbWEubXVsdGlwbGVPZiA9PT0gdm9pZCAwID8gc2NhbGFyKHtcblx0XHRtaW5pbXVtLFxuXHRcdG1heGltdW1cblx0fSkgOiBfcmFuZG9tTXVsdGlwbGUoe1xuXHRcdG1pbmltdW0sXG5cdFx0bWF4aW11bSxcblx0XHRtdWx0aXBsZU9mOiBzY2hlbWEubXVsdGlwbGVPZixcblx0XHRleGNsdXNpdmVNaW5pbXVtOiBsb3dlcj8uZXhjbHVzaXZlID8/IGZhbHNlLFxuXHRcdGV4Y2x1c2l2ZU1heGltdW06IHVwcGVyPy5leGNsdXNpdmUgPz8gZmFsc2UsXG5cdFx0aW50ZWdlcjogdHJ1ZVxuXHR9KTtcbn07XG5jb25zdCBzY2FsYXIgPSAocHJvcHMpID0+IHtcblx0Y29uc3QgbWluaW11bSA9IE1hdGguY2VpbChwcm9wcy5taW5pbXVtKTtcblx0Y29uc3QgbWF4aW11bSA9IE1hdGguZmxvb3IocHJvcHMubWF4aW11bSk7XG5cdGlmIChtaW5pbXVtID4gbWF4aW11bSkgdGhyb3cgbmV3IEVycm9yKFwiVGhlIGludGVnZXIgcmFuZ2UgaXMgZW1wdHkuXCIpO1xuXHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heGltdW0gLSBtaW5pbXVtICsgMSkpICsgbWluaW11bTtcbn07XG5jb25zdCBnZXRMb3dlckJvdW5kYXJ5ID0gKHNjaGVtYSkgPT4ge1xuXHRjb25zdCBpbmNsdXNpdmUgPSBzY2hlbWEubWluaW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0XHR2YWx1ZTogc2NoZW1hLm1pbmltdW0sXG5cdFx0ZXhjbHVzaXZlOiBmYWxzZVxuXHR9O1xuXHRjb25zdCBleGNsdXNpdmUgPSBzY2hlbWEuZXhjbHVzaXZlTWluaW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0XHR2YWx1ZTogc2NoZW1hLmV4Y2x1c2l2ZU1pbmltdW0sXG5cdFx0ZXhjbHVzaXZlOiB0cnVlXG5cdH07XG5cdGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0Qm91bmRhcnkoaW5jbHVzaXZlLCBleGNsdXNpdmUsIE1hdGgubWF4KTtcblx0aWYgKHNlbGVjdGVkID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0cmV0dXJuIHtcblx0XHR2YWx1ZTogc2VsZWN0ZWQuZXhjbHVzaXZlID8gTWF0aC5mbG9vcihzZWxlY3RlZC52YWx1ZSkgKyAxIDogTWF0aC5jZWlsKHNlbGVjdGVkLnZhbHVlKSxcblx0XHRleGNsdXNpdmU6IGZhbHNlXG5cdH07XG59O1xuY29uc3QgZ2V0VXBwZXJCb3VuZGFyeSA9IChzY2hlbWEpID0+IHtcblx0Y29uc3QgaW5jbHVzaXZlID0gc2NoZW1hLm1heGltdW0gPT09IHZvaWQgMCA/IG51bGwgOiB7XG5cdFx0dmFsdWU6IHNjaGVtYS5tYXhpbXVtLFxuXHRcdGV4Y2x1c2l2ZTogZmFsc2Vcblx0fTtcblx0Y29uc3QgZXhjbHVzaXZlID0gc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gPT09IHZvaWQgMCA/IG51bGwgOiB7XG5cdFx0dmFsdWU6IHNjaGVtYS5leGNsdXNpdmVNYXhpbXVtLFxuXHRcdGV4Y2x1c2l2ZTogdHJ1ZVxuXHR9O1xuXHRjb25zdCBzZWxlY3RlZCA9IHNlbGVjdEJvdW5kYXJ5KGluY2x1c2l2ZSwgZXhjbHVzaXZlLCBNYXRoLm1pbik7XG5cdGlmIChzZWxlY3RlZCA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG5cdHJldHVybiB7XG5cdFx0dmFsdWU6IHNlbGVjdGVkLmV4Y2x1c2l2ZSA/IE1hdGguY2VpbChzZWxlY3RlZC52YWx1ZSkgLSAxIDogTWF0aC5mbG9vcihzZWxlY3RlZC52YWx1ZSksXG5cdFx0ZXhjbHVzaXZlOiBmYWxzZVxuXHR9O1xufTtcbmNvbnN0IHNlbGVjdEJvdW5kYXJ5ID0gKHgsIHksIGNvbXBhcmUpID0+IHtcblx0aWYgKHggPT09IG51bGwpIHJldHVybiB5O1xuXHRpZiAoeSA9PT0gbnVsbCkgcmV0dXJuIHg7XG5cdGlmICh4LnZhbHVlID09PSB5LnZhbHVlKSByZXR1cm4ge1xuXHRcdHZhbHVlOiB4LnZhbHVlLFxuXHRcdGV4Y2x1c2l2ZTogeC5leGNsdXNpdmUgfHwgeS5leGNsdXNpdmVcblx0fTtcblx0cmV0dXJuIGNvbXBhcmUoeC52YWx1ZSwgeS52YWx1ZSkgPT09IHgudmFsdWUgPyB4IDogeTtcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21JbnRlZ2VyIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9yYW5kb21JbnRlZ2VyLm1qcy5tYXAiLCJpbXBvcnQgeyBfcmFuZG9tSW50ZWdlciB9IGZyb20gXCIuL19yYW5kb21JbnRlZ2VyLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nLnRzXG5jb25zdCBERUZBVUxUX01JTl9MRU5HVEggPSA1O1xuY29uc3QgREVGQVVMVF9SQU5HRSA9IDU7XG5jb25zdCBfcmFuZG9tU3RyaW5nID0gKHByb3BzKSA9PiB7XG5cdGNvbnN0IG1pbmltdW0gPSBwcm9wcy5taW5MZW5ndGggPz8gTWF0aC5taW4ocHJvcHMubWF4TGVuZ3RoID8/IERFRkFVTFRfTUlOX0xFTkdUSCwgREVGQVVMVF9NSU5fTEVOR1RIKTtcblx0Y29uc3QgbGVuZ3RoID0gX3JhbmRvbUludGVnZXIoe1xuXHRcdHR5cGU6IFwiaW50ZWdlclwiLFxuXHRcdG1pbmltdW0sXG5cdFx0bWF4aW11bTogcHJvcHMubWF4TGVuZ3RoID8/IG1pbmltdW0gKyBERUZBVUxUX1JBTkdFXG5cdH0pO1xuXHRyZXR1cm4gbmV3IEFycmF5KGxlbmd0aCkuZmlsbCgwKS5tYXAoKCkgPT4gQUxQSEFCRVRTW3JhbmRvbSgpXSkuam9pbihcIlwiKTtcbn07XG5jb25zdCBBTFBIQUJFVFMgPSBcImFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG5jb25zdCByYW5kb20gPSAoKSA9PiBfcmFuZG9tSW50ZWdlcih7XG5cdHR5cGU6IFwiaW50ZWdlclwiLFxuXHRtaW5pbXVtOiAwLFxuXHRtYXhpbXVtOiAyNVxufSk7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21TdHJpbmcgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X3JhbmRvbVN0cmluZy5tanMubWFwIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF9yYW5kb21TdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21TdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9kZWxldGUtZmlsZS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvZGVsZXRlLWZpbGUuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuZmlsZU5hbWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJwcm9qZWN0RGlyXCIgPT09IGtleSB8fCBcInJlbGF0aXZlRGlyXCIgPT09IGtleSB8fCBcImZpbGVOYW1lXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnByb2plY3REaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucHJvamVjdERpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5wcm9qZWN0RGlyXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbGF0aXZlRGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJlbGF0aXZlRGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnJlbGF0aXZlRGlyXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmZpbGVOYW1lIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmZpbGVOYW1lXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmZpbGVOYW1lXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBwcm9qZWN0RGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWxhdGl2ZURpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5zdWNjZXNzO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwic3VjY2Vzc1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcyB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zdWNjZXNzXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJzdWNjZXNzXCI6JHtTdHJpbmcoaW5wdXQuc3VjY2Vzcyl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9leGlzdHMuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL2V4aXN0cy5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuZmlsZU5hbWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJwcm9qZWN0RGlyXCIgPT09IGtleSB8fCBcInJlbGF0aXZlRGlyXCIgPT09IGtleSB8fCBcImZpbGVOYW1lXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnByb2plY3REaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucHJvamVjdERpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5wcm9qZWN0RGlyXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbGF0aXZlRGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJlbGF0aXZlRGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnJlbGF0aXZlRGlyXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmZpbGVOYW1lIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmZpbGVOYW1lXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmZpbGVOYW1lXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHtcbiAgICAgICAgICAgIHByb2plY3REaXI6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHJlbGF0aXZlRGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBmaWxlTmFtZTogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuZXhpc3RzO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiZXhpc3RzXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5leGlzdHMgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZXhpc3RzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5leGlzdHNcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wiZXhpc3RzXCI6JHtTdHJpbmcoaW5wdXQuZXhpc3RzKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyNyZWdpb24gc3JjL2ludGVybmFsL19qc29uU3RyaW5naWZ5QXJyYXkudHNcbi8qKlxuKiBTZXJpYWxpemVzIHRoZSBlbGVtZW50cyBvZiBhbiBhcnJheSB0aGUgd2F5IEVDTUFTY3JpcHQgYEpTT04uc3RyaW5naWZ5YCBkb2VzLlxuKlxuKiBgU2VyaWFsaXplSlNPTkFycmF5YCB3YWxrcyBpbmRleCBgMGAgdG8gYExlbmd0aE9mQXJyYXlMaWtlKHZhbHVlKSAtIDFgIGFuZFxuKiB3cml0ZXMgYG51bGxgIHdoZXJldmVyIHRoZSBlbGVtZW50IHNlcmlhbGl6ZXMgdG8gYHVuZGVmaW5lZGAuIE5laXRoZXJcbiogYEFycmF5LnByb3RvdHlwZS5tYXBgIG5vciBgQXJyYXkucHJvdG90eXBlLmpvaW5gIHJlcHJvZHVjZXMgdGhhdDpcbipcbiogLSBgbWFwYCBuZXZlciB2aXNpdHMgYSBob2xlIGFuZCBsZWF2ZXMgb25lIGJlaGluZCwgYW5kIGBqb2luYCByZW5kZXJzIGEgaG9sZSBhc1xuKiAgIGVtcHR5IHRleHQsIHNvIGEgc3BhcnNlIGFycmF5IGpvaW5lZCBpbnRvIG1hbGZvcm1lZCB0ZXh0IHN1Y2ggYXMgYFssMV1gLiBBXG4qICAgaG9sZSBleGlzdHMgYXQgcnVudGltZSB3aGF0ZXZlciB0aGUgZWxlbWVudCB0eXBlIGRlY2xhcmVzLCBzbyB0aGlzIGlzIG5vdFxuKiAgIGFuIGBhbnlgIGNvbmNlcm4uXG4qIC0gYGpvaW5gIHJlbmRlcnMgYSBtYXBwZWQgYHVuZGVmaW5lZGAgYXMgZW1wdHkgdGV4dCB0b28sIHdoaWNoIGlzIHdoYXQgYW4gYGFueWBcbiogICBvciBgdW5rbm93bmAgZWxlbWVudCBob2xkaW5nIGEgZnVuY3Rpb24sIGEgc3ltYm9sLCBvciBhIGB0b0pTT05gIHRoYXRcbiogICByZXR1cm5zIG5vdGhpbmcgc2VyaWFsaXplcyB0by5cbipcbiogVGhlIGxlbmd0aCBpcyBjb252ZXJ0ZWQgd2l0aCBgVG9MZW5ndGhgIGFuZCByZWFkIG9uY2UsIHdoaWNoIGlzIGJvdGggd2hhdFxuKiBgSlNPTi5zdHJpbmdpZnlgIGRvZXMgYW5kIHdoYXQgYEFycmF5LnByb3RvdHlwZS5ldmVyeWAgLSB0aGUgdHJhdmVyc2FsXG4qIHR5cGlhJ3Mgb3duIGFycmF5IGNoZWNrZXJzIGVtaXQgLSBkb2VzLCBzbyB0aGUgY2hlY2tlciBhbmQgdGhlIHNlcmlhbGl6ZXJcbiogd2FsayBvbmUgaW5kZXggcmFuZ2UgcmF0aGVyIHRoYW4gdHdvIHRoYXQgbWVyZWx5IHVzdWFsbHkgY29pbmNpZGUuXG4qXG4qIEBwYXJhbSBlbGVtZW50cyBBcnJheSBiZWluZyBzZXJpYWxpemVkLlxuKiBAcGFyYW0gbWFwcGVyIFNlcmlhbGl6ZXIgb2Ygb25lIGVsZW1lbnQsIGVtaXR0ZWQgYnkgdGhlIHRyYW5zZm9ybS5cbiogQHJldHVybnMgQ29tbWEgc2VwYXJhdGVkIGVsZW1lbnQgdGV4dCwgd2l0aG91dCB0aGUgZW5jbG9zaW5nIGJyYWNrZXRzLlxuKiBAaW50ZXJuYWxcbiovXG5jb25zdCBfanNvblN0cmluZ2lmeUFycmF5ID0gKGVsZW1lbnRzLCBtYXBwZXIpID0+IHtcblx0Y29uc3QgbGVuZ3RoID0gTWF0aC5taW4oTWF0aC5tYXgoTWF0aC50cnVuYyhlbGVtZW50cy5sZW5ndGgpIHx8IDAsIDApLCBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUik7XG5cdGxldCBvdXRwdXQgPSBcIlwiO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0Y29uc3QgZWxlbSA9IGVsZW1lbnRzW2ldO1xuXHRcdGNvbnN0IHRleHQgPSBlbGVtID09PSB2b2lkIDAgPyB2b2lkIDAgOiBtYXBwZXIoZWxlbSwgaSk7XG5cdFx0b3V0cHV0ICs9IChpID09PSAwID8gXCJcIiA6IFwiLFwiKSArICh0ZXh0ID09PSB2b2lkIDAgPyBcIm51bGxcIiA6IHRleHQpO1xuXHR9XG5cdHJldHVybiBvdXRwdXQ7XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBfanNvblN0cmluZ2lmeUFycmF5IH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9qc29uU3RyaW5naWZ5QXJyYXkubWpzLm1hcCIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfcmFuZG9tU3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeUFycmF5XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeUFycmF5XCI7XG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9saXN0LWRpcmVjdG9yeS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvbGlzdC1kaXJlY3RvcnkuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpcjtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInByb2plY3REaXJcIiA9PT0ga2V5IHx8IFwicmVsYXRpdmVEaXJcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5wcm9qZWN0RGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnByb2plY3REaXJcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucmVsYXRpdmVEaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucmVsYXRpdmVEaXJcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHtcbiAgICAgICAgICAgIHByb2plY3REaXI6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHJlbGF0aXZlRGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IEFycmF5LmlzQXJyYXkoaW5wdXQuZW50cmllcykgJiYgaW5wdXQuZW50cmllcy5ldmVyeSgoZWxlbTogYW55KSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgZWxlbSAmJiBudWxsICE9PSBlbGVtICYmIF9pbzEoZWxlbSkpO1xuICAgICAgICBjb25zdCBfaW8xID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5uYW1lICYmIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNEaXI7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dC5lbnRyaWVzKSlcbiAgICAgICAgICAgICAgICAoKCkgPT4gaW5wdXQuZW50cmllcy5mb3JFYWNoKChlbGVtOiBhbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBlbGVtICYmIG51bGwgIT09IGVsZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICBfcG8xKGVsZW0pO1xuICAgICAgICAgICAgICAgIH0pKSgpO1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiZW50cmllc1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfcG8xID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwibmFtZVwiID09PSBrZXkgfHwgXCJpc0RpclwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gWyhBcnJheS5pc0FycmF5KGlucHV0LmVudHJpZXMpIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmVudHJpZXNcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJ7IG5hbWU6IHN0cmluZzsgaXNEaXI6IGJvb2xlYW47IH1bXVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5lbnRyaWVzXG4gICAgICAgICAgICB9KSkgJiYgaW5wdXQuZW50cmllcy5tYXAoKGVsZW06IGFueSwgX2luZGV4MjogbnVtYmVyKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGVsZW0gJiYgbnVsbCAhPT0gZWxlbSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5lbnRyaWVzW1wiICsgX2luZGV4MiArIFwiXVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInsgbmFtZTogc3RyaW5nOyBpc0RpcjogYm9vbGVhbjsgfVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbGVtXG4gICAgICAgICAgICB9KSkgJiYgX3ZvMShlbGVtLCBfcGF0aCArIFwiLmVudHJpZXNbXCIgKyBfaW5kZXgyICsgXCJdXCIsIHRydWUgJiYgX2V4Y2VwdGlvbmFibGUpIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmVudHJpZXNbXCIgKyBfaW5kZXgyICsgXCJdXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwieyBuYW1lOiBzdHJpbmc7IGlzRGlyOiBib29sZWFuOyB9XCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGVsZW1cbiAgICAgICAgICAgIH0pKS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZykgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZW50cmllc1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInsgbmFtZTogc3RyaW5nOyBpc0RpcjogYm9vbGVhbjsgfVtdXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmVudHJpZXNcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF92bzEgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0Lm5hbWUgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIubmFtZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5uYW1lXG4gICAgICAgICAgICB9KSwgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc0RpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc0RpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNEaXJcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImVudHJpZXNcIjoke2BbJHtfanNvblN0cmluZ2lmeUFycmF5XzEuX2pzb25TdHJpbmdpZnlBcnJheShpbnB1dC5lbnRyaWVzLCAoZWxlbTogYW55KSA9PiBfc28xKGVsZW0pKX1dYH19YDtcbiAgICAgICAgICAgIGNvbnN0IF9zbzEgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wibmFtZVwiOiR7X2pzb25TdHJpbmdpZnlTdHJpbmdfMS5fanNvblN0cmluZ2lmeVN0cmluZyhpbnB1dC5uYW1lKX0sXCJpc0RpclwiOiR7U3RyaW5nKGlucHV0LmlzRGlyKX19YDtcbiAgICAgICAgICAgIGNvbnN0IF9pbzEgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0Lm5hbWUgJiYgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc0RpcjtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9waWNrLWRpcmVjdG9yeS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvcGljay1kaXJlY3RvcnkuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gbnVsbCA9PT0gaW5wdXQucGF0aCB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucGF0aDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInBhdGhcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtudWxsID09PSBpbnB1dC5wYXRoIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wYXRoIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnBhdGhcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCIobnVsbCB8IHN0cmluZylcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucGF0aFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wicGF0aFwiOiR7bnVsbCAhPT0gaW5wdXQucGF0aCA/IF9qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQucGF0aCkgOiBcIm51bGxcIn19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfcmFuZG9tU3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvcmVhZC1maWxlLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9yZWFkLWZpbGUuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmZpbGVOYW1lO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwicHJvamVjdERpclwiID09PSBrZXkgfHwgXCJyZWxhdGl2ZURpclwiID09PSBrZXkgfHwgXCJmaWxlTmFtZVwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnByb2plY3REaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucHJvamVjdERpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5yZWxhdGl2ZURpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5yZWxhdGl2ZURpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5maWxlTmFtZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5maWxlTmFtZVxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBwcm9qZWN0RGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWxhdGl2ZURpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBudWxsID09PSBpbnB1dC5jb250ZW50IHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5jb250ZW50O1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiY29udGVudFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW251bGwgPT09IGlucHV0LmNvbnRlbnQgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmNvbnRlbnQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuY29udGVudFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihudWxsIHwgc3RyaW5nKVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5jb250ZW50XG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImNvbnRlbnRcIjoke251bGwgIT09IGlucHV0LmNvbnRlbnQgPyBfanNvblN0cmluZ2lmeVN0cmluZ18xLl9qc29uU3RyaW5naWZ5U3RyaW5nKGlucHV0LmNvbnRlbnQpIDogXCJudWxsXCJ9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiaW1wb3J0IHsgX3JhbmRvbUludGVnZXIgfSBmcm9tIFwiLi9fcmFuZG9tSW50ZWdlci5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX3JhbmRvbVBpY2sudHNcbmNvbnN0IF9yYW5kb21QaWNrID0gKGFycmF5KSA9PiBhcnJheVtyYW5kb20oYXJyYXkpXTtcbmNvbnN0IHJhbmRvbSA9IChhcnJheSkgPT4gX3JhbmRvbUludGVnZXIoe1xuXHR0eXBlOiBcImludGVnZXJcIixcblx0bWluaW11bTogMCxcblx0bWF4aW11bTogYXJyYXkubGVuZ3RoIC0gMVxufSk7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21QaWNrIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9yYW5kb21QaWNrLm1qcy5tYXAiLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX3JhbmRvbVBpY2tfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21QaWNrXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS93cml0ZS1maWxlLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS93cml0ZS1maWxlLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuZmlsZU5hbWUgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmNvbnRlbnQgJiYgKFwiYmFzZTY0XCIgPT09IGlucHV0LmVuY29kaW5nIHx8IFwidXRmOFwiID09PSBpbnB1dC5lbmNvZGluZyk7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJwcm9qZWN0RGlyXCIgPT09IGtleSB8fCBcInJlbGF0aXZlRGlyXCIgPT09IGtleSB8fCBcImZpbGVOYW1lXCIgPT09IGtleSB8fCBcImNvbnRlbnRcIiA9PT0ga2V5IHx8IFwiZW5jb2RpbmdcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5wcm9qZWN0RGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnByb2plY3REaXJcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucmVsYXRpdmVEaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucmVsYXRpdmVEaXJcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuZmlsZU5hbWUgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZmlsZU5hbWVcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZmlsZU5hbWVcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuY29udGVudCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5jb250ZW50XCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmNvbnRlbnRcbiAgICAgICAgICAgIH0pLCBcImJhc2U2NFwiID09PSBpbnB1dC5lbmNvZGluZyB8fCBcInV0ZjhcIiA9PT0gaW5wdXQuZW5jb2RpbmcgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZW5jb2RpbmdcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCIoXFxcImJhc2U2NFxcXCIgfCBcXFwidXRmOFxcXCIpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmVuY29kaW5nXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgcHJvamVjdERpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVsYXRpdmVEaXI6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBjb250ZW50OiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBlbmNvZGluZzogX3JhbmRvbVBpY2tfMS5fcmFuZG9tUGljayhbXG4gICAgICAgICAgICAgICAgKCkgPT4gXCJiYXNlNjRcIixcbiAgICAgICAgICAgICAgICAoKSA9PiBcInV0ZjhcIlxuICAgICAgICAgICAgXSkoKVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcztcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInN1Y2Nlc3NcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnN1Y2Nlc3MgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3VjY2Vzc1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuc3VjY2Vzc1xuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcInN1Y2Nlc3NcIjoke1N0cmluZyhpbnB1dC5zdWNjZXNzKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbGF1bmNoZXIvcmVzdGFydC5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbGF1bmNoZXJfX3Jlc3RhcnRUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xhdW5jaGVyL3Jlc3RhcnQuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbGF1bmNoZXJfX3Jlc3RhcnRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbGF1bmNoZXJfX3Jlc3RhcnRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5zdWNjZXNzO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwic3VjY2Vzc1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcyB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zdWNjZXNzXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbGF1bmNoZXJfX3Jlc3RhcnRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJzdWNjZXNzXCI6JHtTdHJpbmcoaW5wdXQuc3VjY2Vzcyl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX2pzb25TdHJpbmdpZnlTdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5U3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2Rlc2t0b3Atc2V0dGluZy9nZXQuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvZ2V0LmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQubGF1bmNoQXRTdGFydHVwICYmIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kICYmIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNXYWxscGFwZXIgJiYgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC51cGRhdGVSZWFkeSAmJiAobnVsbCA9PT0gaW5wdXQuc3RhZ2VkVmVyc2lvbiB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuc3RhZ2VkVmVyc2lvbik7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJsYXVuY2hBdFN0YXJ0dXBcIiA9PT0ga2V5IHx8IFwicnVuSW5CYWNrZ3JvdW5kXCIgPT09IGtleSB8fCBcImlzV2FsbHBhcGVyXCIgPT09IGtleSB8fCBcInVwZGF0ZVJlYWR5XCIgPT09IGtleSB8fCBcInN0YWdlZFZlcnNpb25cIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5sYXVuY2hBdFN0YXJ0dXBcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmxhdW5jaEF0U3RhcnR1cFxuICAgICAgICAgICAgfSksIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJ1bkluQmFja2dyb3VuZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucnVuSW5CYWNrZ3JvdW5kXG4gICAgICAgICAgICB9KSwgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc1dhbGxwYXBlciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc1dhbGxwYXBlclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNXYWxscGFwZXJcbiAgICAgICAgICAgIH0pLCBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnVwZGF0ZVJlYWR5IHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnVwZGF0ZVJlYWR5XCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC51cGRhdGVSZWFkeVxuICAgICAgICAgICAgfSksIG51bGwgPT09IGlucHV0LnN0YWdlZFZlcnNpb24gfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnN0YWdlZFZlcnNpb24gfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3RhZ2VkVmVyc2lvblwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihudWxsIHwgc3RyaW5nKVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zdGFnZWRWZXJzaW9uXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJsYXVuY2hBdFN0YXJ0dXBcIjoke1N0cmluZyhpbnB1dC5sYXVuY2hBdFN0YXJ0dXApfSxcInJ1bkluQmFja2dyb3VuZFwiOiR7U3RyaW5nKGlucHV0LnJ1bkluQmFja2dyb3VuZCl9LFwiaXNXYWxscGFwZXJcIjoke1N0cmluZyhpbnB1dC5pc1dhbGxwYXBlcil9LFwidXBkYXRlUmVhZHlcIjoke1N0cmluZyhpbnB1dC51cGRhdGVSZWFkeSl9LFwic3RhZ2VkVmVyc2lvblwiOiR7bnVsbCAhPT0gaW5wdXQuc3RhZ2VkVmVyc2lvbiA/IF9qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQuc3RhZ2VkVmVyc2lvbikgOiBcIm51bGxcIn19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX3JhbmRvbUJvb2xlYW4udHNcbmNvbnN0IF9yYW5kb21Cb29sZWFuID0gKCkgPT4gTWF0aC5yYW5kb20oKSA8IC41O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBfcmFuZG9tQm9vbGVhbiB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fcmFuZG9tQm9vbGVhbi5tanMubWFwIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF9yYW5kb21Cb29sZWFuXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tQm9vbGVhblwiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvc2V0LWxhdW5jaC1hdC1zdGFydHVwLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvZGVza3RvcC1zZXR0aW5nL3NldC1sYXVuY2gtYXQtc3RhcnR1cC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5sYXVuY2hBdFN0YXJ0dXA7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJsYXVuY2hBdFN0YXJ0dXBcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5sYXVuY2hBdFN0YXJ0dXBcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmxhdW5jaEF0U3RhcnR1cFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgbGF1bmNoQXRTdGFydHVwOiAoX2dlbmVyYXRvcj8uYm9vbGVhbiA/PyBfcmFuZG9tQm9vbGVhbl8xLl9yYW5kb21Cb29sZWFuKSgpXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImxhdW5jaEF0U3RhcnR1cFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQubGF1bmNoQXRTdGFydHVwIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmxhdW5jaEF0U3RhcnR1cFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQubGF1bmNoQXRTdGFydHVwXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJsYXVuY2hBdFN0YXJ0dXBcIjoke1N0cmluZyhpbnB1dC5sYXVuY2hBdFN0YXJ0dXApfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF9yYW5kb21Cb29sZWFuXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tQm9vbGVhblwiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvc2V0LXJ1bi1pbi1iYWNrZ3JvdW5kLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvZGVza3RvcC1zZXR0aW5nL3NldC1ydW4taW4tYmFja2dyb3VuZC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5ydW5JbkJhY2tncm91bmQ7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJydW5JbkJhY2tncm91bmRcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnJ1bkluQmFja2dyb3VuZCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5ydW5JbkJhY2tncm91bmRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnJ1bkluQmFja2dyb3VuZFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgcnVuSW5CYWNrZ3JvdW5kOiAoX2dlbmVyYXRvcj8uYm9vbGVhbiA/PyBfcmFuZG9tQm9vbGVhbl8xLl9yYW5kb21Cb29sZWFuKSgpXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnJ1bkluQmFja2dyb3VuZDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInJ1bkluQmFja2dyb3VuZFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJ1bkluQmFja2dyb3VuZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucnVuSW5CYWNrZ3JvdW5kXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJydW5JbkJhY2tncm91bmRcIjoke1N0cmluZyhpbnB1dC5ydW5JbkJhY2tncm91bmQpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgbW9kdWxlc19faW5kZXhUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2luZGV4VGFjdGlvbi8yeWN0a29qNmMydm1kL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uLzk3NmN4eHF1bGh3YS9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uLzFpZnBpN3AxZTZtY3Qvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24vM2Y4NW9lY3doZ3Rqai9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbi83MHFzYmplbWtxcjIvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbi8xeGl4eG52eXdld25yL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24vZ2F1YXJoMzZ6N3V0L3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24vNWo5cnJuYzdjZ3B2L3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbi8xOW1naXJzN3NzNDNlL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24vMjFtZDF0Nzg0MGp0Mi9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uLzFrb29yM2t1cmlnYWwvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uLzh0Y3V6N3UwODczeS9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbi8yNGZmeTI4aHY0Y2hsL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xhdW5jaGVyX19yZXN0YXJ0VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sYXVuY2hlcl9fcmVzdGFydFRhY3Rpb24vdzIxcGZscW8waHVxL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24vMmxuNG9oMzd0aWk3L3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24vMjIyMWNzMGxqYnR3OC9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uL3VjNGVzMjkyeDRhbi9zY2hlbWEudHNcIjtcblxuZXhwb3J0IGRlZmF1bHQge1xuICBcIi9cIjogbW9kdWxlc19faW5kZXhUYWN0aW9uLFxuICBcIi93aW5kb3cvY2xvc2VcIjogbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24sXG4gIFwiL3dpbmRvdy9nZXQtc3RhdGVcIjogbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uLFxuICBcIi93aW5kb3cvbWF4aW1pemVcIjogbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24sXG4gIFwiL3dpbmRvdy9taW5pbWl6ZVwiOiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbixcbiAgXCIvd2FsbHBhcGVyL2NhbmNlbFwiOiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24sXG4gIFwiL3dhbGxwYXBlci9zZXRcIjogbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL2RlbGV0ZS1maWxlXCI6IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbixcbiAgXCIvbG9jYWwtZmlsZS9leGlzdHNcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbixcbiAgXCIvbG9jYWwtZmlsZS9saXN0LWRpcmVjdG9yeVwiOiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24sXG4gIFwiL2xvY2FsLWZpbGUvcGljay1kaXJlY3RvcnlcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL3JlYWQtZmlsZVwiOiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL3dyaXRlLWZpbGVcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24sXG4gIFwiL2xhdW5jaGVyL3Jlc3RhcnRcIjogbW9kdWxlc19fbGF1bmNoZXJfX3Jlc3RhcnRUYWN0aW9uLFxuICBcIi9kZXNrdG9wLXNldHRpbmcvZ2V0XCI6IG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbixcbiAgXCIvZGVza3RvcC1zZXR0aW5nL3NldC1sYXVuY2gtYXQtc3RhcnR1cFwiOiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24sXG4gIFwiL2Rlc2t0b3Atc2V0dGluZy9zZXQtcnVuLWluLWJhY2tncm91bmRcIjogbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uLFxufTtcbiIsIi8vIHJhdy1zY2hlbWFcblxuY29uc3QgcmF3UGF0aHMgPSBuZXcgU2V0PHN0cmluZz4oW1xuXSk7XG5cbmNvbnN0IHJvdXRlczogUmVjb3JkPHN0cmluZywgeyB0eXBlOiBcInJhd1wiOyBtb2R1bGU6ICgpID0+IFByb21pc2U8YW55PiB9PiA9IHtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHsgcmF3UGF0aHMsIHJvdXRlcyB9O1xuIiwiLy8gaGFuZGxlci1zY2hlbWFcblxuZXhwb3J0IGRlZmF1bHQge1xuICBsb2FkSGFuZGxlcnM6KHdvcmxkOiBhbnkpID0+IChbXG4gIF0pLFxufSIsIi8vIGluZGV4XG5pbXBvcnQgdHlwZSB7IE1pbGtpb01ldGEsIE1pbGtpb0NvbnRleHQsIE1pbGtpb1JlamVjdENvZGUsIE1pbGtpb0V2ZW50cyB9IGZyb20gXCIuL2RlY2xhcmVzLnRzXCI7XG5pbXBvcnQgdHlwaWFTY2hlbWEgZnJvbSBcIi4vdHlwaWEtc2NoZW1hLnRzXCI7XG5pbXBvcnQgcm91dGVTY2hlbWEgZnJvbSBcIi4vcm91dGUtc2NoZW1hLnRzXCI7XG5pbXBvcnQgcmF3U2NoZW1hIGZyb20gXCIuL3Jhdy1zY2hlbWEudHNcIjtcbmltcG9ydCBoYW5kbGVyU2NoZW1hIGZyb20gXCIuL2hhbmRsZXItc2NoZW1hLnRzXCI7XG5cblxuZXhwb3J0IGNvbnN0IGdlbmVyYXRlZCA9IHtcbiAgbWV0YTogdW5kZWZpbmVkIGFzIHVua25vd24gYXMgTWlsa2lvTWV0YSxcbiAgY29udGV4dDogdW5kZWZpbmVkIGFzIHVua25vd24gYXMgTWlsa2lvQ29udGV4dCxcbiAgcmVqZWN0Q29kZTogdW5kZWZpbmVkIGFzIHVua25vd24gYXMgTWlsa2lvUmVqZWN0Q29kZSxcbiAgZXZlbnRzOiB1bmRlZmluZWQgYXMgdW5rbm93biBhcyBNaWxraW9FdmVudHMsXG4gIHR5cGlhU2NoZW1hLFxuICByb3V0ZVNjaGVtYSxcbiAgcmF3U2NoZW1hLFxuICBoYW5kbGVyU2NoZW1hLFxufTtcbiIsImltcG9ydCB7IHRpbWluZ1NhZmVFcXVhbCB9IGZyb20gJ25vZGU6Y3J5cHRvJztcclxuaW1wb3J0IHsgdHlwZSBNaWxraW9Xb3JsZCB9IGZyb20gJ21pbGtpbyc7XHJcbmltcG9ydCB0eXBlIHsgZ2VuZXJhdGVkIH0gZnJvbSAnLi4vLi4vLi4vLm1pbGtpby9pbmRleC50cyc7XHJcblxyXG4vKipcclxuICogRWxlY3Ryb24g6YCa5L+h5Luk54mM5qCh6aqMXHJcbiAqIEVsZWN0cm9uIOS4u+i/m+eoi+WQr+WKqOaXtueUn+aIkOmaj+acuiB0b2tlbu+8jOmAmui/hyBVUkwg5Y+C5pWw5Lyg6YCS57uZ5riy5p+T6L+b56iL44CCXHJcbiAqIOa4suafk+i/m+eoi++8iGVtYmVkIFdvcmtlcu+8ieavj+asoeivt+axguW/hemhu+aQuuW4piBYLUVsZWN0cm9uLVRva2VuIOWktOmDqO+8jFxyXG4gKiDlpoLmnpzkuI3ljLnphY3liJnmi5Lnu53orr/pl67vvIzpmLLmraLlhbbku5bnvZHpobXll4XmjqLliLDmnKzlnLDnq6/lj6PlkI7nm7TmjqXosIPnlKggRWxlY3Ryb24g56uv54K544CCXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgbG9hZEVsZWN0cm9uVG9rZW4gPSBhc3luYyAod29ybGQ6IE1pbGtpb1dvcmxkPHR5cGVvZiBnZW5lcmF0ZWQ+KSA9PiB7XHJcbiAgd29ybGQub24oJ21pbGtpbzpodHRwUmVxdWVzdCcsIGFzeW5jIChldmVudCkgPT4ge1xyXG4gICAgY29uc3QgdG9rZW4gPSBldmVudC5odHRwLnJlcXVlc3QuaGVhZGVycy5nZXQoJ1gtRWxlY3Ryb24tVG9rZW4nKTtcclxuICAgIGlmICh0b2tlbiAmJiB0aW1pbmdTYWZlRXF1YWwoQnVmZmVyLmZyb20odG9rZW4pLCBCdWZmZXIuZnJvbShnbG9iYWxUaGlzLmVsZWN0cm9uVG9rZW4pKSkgcmV0dXJuO1xyXG4gICAgdGhyb3cgZXZlbnQucmVqZWN0KCdSRVFVRVNUX1RJTUVPVVQnLCB7IG1lc3NhZ2U6ICfplJ/mlqTmi7cnLCB0aW1lb3V0OiAtMSB9KTtcclxuICB9KTtcclxufTtcclxuIiwiaW1wb3J0ICcuL2FwcC91dGlscy9lbGVjdHJvbi50cyc7XG5pbXBvcnQgeyBjcmVhdGVXb3JsZCwgdHlwZSBNaWxraW9Jbml0IH0gZnJvbSAnbWlsa2lvJztcbmltcG9ydCB7IGNvbmZpZ1NjaGVtYSB9IGZyb20gJy4vLm1pbGtpby9jb25maWctc2NoZW1hLnRzJztcbmltcG9ydCB7IGdlbmVyYXRlZCB9IGZyb20gJy4vLm1pbGtpby9pbmRleC50cyc7XG5pbXBvcnQgeyBjcmVhdGVFbGVjdHJvbkFwcCB9IGZyb20gJy4vYXBwL3V0aWxzL2VsZWN0cm9uLnRzJztcbmltcG9ydCB7IGxvYWRFbGVjdHJvblRva2VuIH0gZnJvbSAnLi9hcHAvYm9vdHN0cmFwL2VsZWN0cm9uLXRva2VuL2luZGV4LnRzJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZShvcHRpb25zOiBNaWxraW9Jbml0KSB7XG4gIGF3YWl0IGNyZWF0ZUVsZWN0cm9uQXBwKCk7XG4gIGNvbnN0IHdvcmxkID0gYXdhaXQgY3JlYXRlV29ybGQoZ2VuZXJhdGVkLCBjb25maWdTY2hlbWEsIHtcbiAgICAuLi5vcHRpb25zLFxuICAgIHBvcnQ6IGdsb2JhbFRoaXMuZWxlY3Ryb25Qb3J0ID8/IDkwMDYsXG4gICAgYm9vdHN0cmFwczogW2xvYWRFbGVjdHJvblRva2VuXSxcbiAgICBodHRwOiB7XG4gICAgICBjb3JzOiB7XG4gICAgICAgIGNvcnNBbGxvd0NyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBjb3JzQWxsb3dNZXRob2RzOiBbJ09QVElPTlMnLCAnR0VUJywgJ1BPU1QnXSxcbiAgICAgICAgY29yc0FsbG93SGVhZGVyczogWydDb250ZW50LVR5cGUnLCAnQXV0aG9yaXphdGlvbicsICdNaWxraW8tVGltZXN0YW1wJywgJ01pbGtpby1DbGllbnQtVmVyc2lvbicsICdYLUVsZWN0cm9uLVRva2VuJ10sXG4gICAgICAgIGNvcnNBbGxvd09yaWdpbjogWydodHRwczovL2tlY3JlYW0uY24nLCAnaHR0cHM6Ly9rZWNyZWFtLmxpbmsnLCAnaHR0cHM6Ly9hcHAua2VjcmVhbS5jbicsICdodHRwczovL2FwcC5rZWNyZWFtLmxpbmsnLCAnaHR0cDovL2xvY2FsaG9zdDo5MDAzJ10sXG4gICAgICAgIGNvcnNNYXhBZ2U6IDcyMDAsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiB3b3JsZDtcbn1cbiIsIiMhL3Vzci9iaW4vZW52IG5vZGVcbi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBodHRwIGZyb20gXCJub2RlOmh0dHBcIjtcbmltcG9ydCB0eXBlIHsgSW5jb21pbmdNZXNzYWdlLCBTZXJ2ZXJSZXNwb25zZSB9IGZyb20gXCJub2RlOmh0dHBcIjtcbmltcG9ydCB7IGNyZWF0ZSB9IGZyb20gXCIuLi9pbmRleC50c1wiO1xuaW1wb3J0IHsgZW52IH0gZnJvbSBcIm5vZGU6cHJvY2Vzc1wiO1xuXG5hc3luYyBmdW5jdGlvbiBib290c3RyYXAoKSB7XG4gIGNvbnN0IHdvcmxkID0gYXdhaXQgY3JlYXRlKHtcbiAgICBwb3J0OiA5MDA2LFxuICAgIGRldmVsb3A6IEJvb2xlYW4oZW52LkNPT0tCT09LX0JBU0VfVVJMKSxcbiAgICBmZXRjaEVudjogKGtleTogc3RyaW5nKSA9PiBlbnZba2V5XSA/PyB1bmRlZmluZWQsXG4gIH0pO1xuXG4gIGNvbnN0IHNlcnZlciA9IGh0dHAuY3JlYXRlU2VydmVyKChyZXE6IEluY29taW5nTWVzc2FnZSwgcmVzOiBTZXJ2ZXJSZXNwb25zZSkgPT4ge1xuICAgIC8vIEFjY3VtdWxhdGUgZXZlcnkgY2h1bmsgdW5jb25kaXRpb25hbGx5OiBOb2RlIGVtaXRzIH42NEtCIHBlciBcImRhdGFcIlxuICAgIC8vIGV2ZW50LCBhbmQgYW55IHNtYXJ0ZXIgYnVmZmVyaW5nIHNjaGVtZSBoZXJlIHByZXZpb3VzbHkgZHJvcHBlZCB0aGVcbiAgICAvLyB0aGlyZCBjaHVuayBvZiBsYXJnZSByZXF1ZXN0IGJvZGllcyAoPjEyOEtCKSwgY29ycnVwdGluZyBKU09OIHBhcmFtcy5cbiAgICBjb25zdCBib2R5Q2h1bmtzOiBCdWZmZXJbXSA9IFtdO1xuICAgIHJlcS5vbihcImRhdGFcIiwgKGNodW5rOiBCdWZmZXIpID0+IHtcbiAgICAgIGJvZHlDaHVua3MucHVzaChjaHVuayk7XG4gICAgfSk7XG4gICAgcmVxLm9uKFwiZW5kXCIsICgpID0+IHtcbiAgICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2QgPz8gXCJHRVRcIjtcbiAgICAgIGNvbnN0IGJvZHk6IFVpbnQ4QXJyYXkgfCBudWxsID0gYm9keUNodW5rcy5sZW5ndGggPiAwID8gQnVmZmVyLmNvbmNhdChib2R5Q2h1bmtzKSA6IG51bGw7XG4gICAgICBjb25zdCBib2R5VGV4dCA9IGJvZHkgPyBCdWZmZXIuZnJvbShib2R5KS50b1N0cmluZyhcInV0Zi04XCIpIDogXCJcIjtcblxuICAgICAgLy8gQnVpbGQgZnVsbCBVUkwgZm9yIHN0YW5kYXJkIFJlcXVlc3RcbiAgICAgIGNvbnN0IHJlcVVybCA9IHJlcS51cmwgPz8gXCIvXCI7XG4gICAgICBjb25zdCBwcm90b2NvbCA9IChyZXEgYXMgYW55KS5lbmNyeXB0ZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIjtcbiAgICAgIGNvbnN0IGhvc3QgPSByZXEuaGVhZGVycy5ob3N0ID8/IFwibG9jYWxob3N0XCI7XG4gICAgICBjb25zdCBmdWxsVXJsID0gYCR7cHJvdG9jb2x9Oi8vJHtob3N0fSR7cmVxVXJsfWA7XG5cbiAgICAgIC8vIEJ1aWxkIHN0YW5kYXJkIEhlYWRlcnMgZnJvbSBOb2RlLmpzIGluY29taW5nIGhlYWRlcnNcbiAgICAgIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocmVxLmhlYWRlcnMpKSB7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCB2IG9mIHZhbHVlKSBoZWFkZXJzLmFwcGVuZChrZXksIHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhlYWRlcnMuc2V0KGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIENyZWF0ZSBBYm9ydENvbnRyb2xsZXIgZm9yIHN0cmVhbSByZXF1ZXN0c1xuICAgICAgY29uc3QgaXNTdHJlYW0gPSByZXEuaGVhZGVycy5hY2NlcHQ/LnN0YXJ0c1dpdGgoXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiKTtcbiAgICAgIGNvbnN0IHNpZ25hbCA9IGlzU3RyZWFtID8gKCgpID0+IHtcbiAgICAgICAgY29uc3QgYWMgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gICAgICAgIHJlcy5vbihcImNsb3NlXCIsICgpID0+IHsgYWMuYWJvcnQoKTsgfSk7XG4gICAgICAgIHJldHVybiBhYy5zaWduYWw7XG4gICAgICB9KSgpIDogdW5kZWZpbmVkO1xuXG4gICAgICAvLyBDb25zdHJ1Y3Qgc3RhbmRhcmQgUmVxdWVzdCBvYmplY3RcbiAgICAgIGNvbnN0IHJlcXVlc3QgPSBuZXcgUmVxdWVzdChmdWxsVXJsLCB7XG4gICAgICAgIG1ldGhvZCxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogbWV0aG9kICE9PSBcIkdFVFwiICYmIG1ldGhvZCAhPT0gXCJIRUFEXCIgPyBib2R5IDogdW5kZWZpbmVkLFxuICAgICAgICBzaWduYWwsXG4gICAgICB9KTtcblxuICAgICAgLy8gQXR0YWNoIHByZS1yZWFkIGRhdGEgZm9yIEZhc3QgUGF0aCBvcHRpbWl6YXRpb25cbiAgICAgIGNvbnN0IHFJbmRleCA9IHJlcVVybC5pbmRleE9mKFwiP1wiKTtcbiAgICAgIGNvbnN0IHBhdGhuYW1lID0gcUluZGV4ID49IDAgPyByZXFVcmwuc3Vic3RyaW5nKDAsIHFJbmRleCkgOiByZXFVcmw7XG4gICAgICAocmVxdWVzdCBhcyBhbnkpLl9fYm9keVRleHQgPSBib2R5VGV4dDtcbiAgICAgIChyZXF1ZXN0IGFzIGFueSkuX19wYXRobmFtZSA9IHBhdGhuYW1lO1xuICAgICAgKHJlcXVlc3QgYXMgYW55KS5fX3BhdGhBcnJheSA9IHBhdGhuYW1lLmxlbmd0aCA+IDEgPyBwYXRobmFtZS5zdWJzdHJpbmcoMSkuc3BsaXQoXCIvXCIpIDogW107XG4gICAgICAocmVxdWVzdCBhcyBhbnkpLl9fb3JpZ2luID0gcmVxLmhlYWRlcnMub3JpZ2luID8/IG51bGw7XG4gICAgICAocmVxdWVzdCBhcyBhbnkpLl9faXNBY3Rpb24gPSAhaXNTdHJlYW07XG5cbiAgICAgIHdvcmxkLmxpc3RlbmVyLmZldGNoKHtcbiAgICAgICAgcmVxdWVzdCxcbiAgICAgICAgZW52LFxuICAgICAgICBlbnZNb2RlOiBlbnYuVklURV9NT0RFID8/IFwidGVzdFwiLFxuICAgICAgICByYXdSZXNwb25zZTogdHJ1ZSxcbiAgICAgIH0pLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLl9fcmF3UmVzcG9uc2UpIHtcbiAgICAgICAgICByZXMud3JpdGVIZWFkKHJlc3BvbnNlLnN0YXR1cywgcmVzcG9uc2UuaGVhZGVycyk7XG4gICAgICAgICAgY29uc3QgcmVzQm9keSA9IHJlc3BvbnNlLmJvZHk7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNCb2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcmVzLmVuZChCdWZmZXIuZnJvbShyZXNCb2R5LCAndXRmLTgnKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXNCb2R5IGluc3RhbmNlb2YgVWludDhBcnJheSB8fCBCdWZmZXIuaXNCdWZmZXIocmVzQm9keSkpIHtcbiAgICAgICAgICAgIHJlcy5lbmQocmVzQm9keSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXNCb2R5IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgIHJlcy5lbmQoQnVmZmVyLmZyb20ocmVzQm9keSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzQm9keSBpbnN0YW5jZW9mIEJsb2IpIHtcbiAgICAgICAgICAgIHJlc0JvZHkuYXJyYXlCdWZmZXIoKS50aGVuKChhYjogQXJyYXlCdWZmZXIpID0+IHtcbiAgICAgICAgICAgICAgcmVzLmVuZChCdWZmZXIuZnJvbShhYikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXNCb2R5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIHJlcy5lbmQocmVzQm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlc0hlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdPiA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiByZXNwb25zZS5oZWFkZXJzKSB7XG4gICAgICAgICAgaWYgKGtleSBpbiByZXNIZWFkZXJzKSB7XG4gICAgICAgICAgICBjb25zdCBleGlzdGluZyA9IHJlc0hlYWRlcnNba2V5XTtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGV4aXN0aW5nKSkgZXhpc3RpbmcucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICBlbHNlIHJlc0hlYWRlcnNba2V5XSA9IFtleGlzdGluZywgdmFsdWVdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNIZWFkZXJzW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzLndyaXRlSGVhZChyZXNwb25zZS5zdGF0dXMsIHJlc0hlYWRlcnMpO1xuICAgICAgICBpZiAocmVzcG9uc2UuYm9keSAhPSBudWxsICYmIHJlcS5tZXRob2QgIT09IFwiSEVBRFwiKSB7XG4gICAgICAgICAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcbiAgICAgICAgICBjb25zdCBwdW1wID0gKCk6IFByb21pc2U8dm9pZD4gPT5cbiAgICAgICAgICAgIHJlYWRlci5yZWFkKCkudGhlbigoeyBkb25lLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChkb25lKSB7IHJlcy5lbmQoKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICAgIHJlcy53cml0ZSh2YWx1ZSk7XG4gICAgICAgICAgICAgIHJldHVybiBwdW1wKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICBwdW1wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVzLmVuZCgpO1xuICAgICAgICB9XG4gICAgICB9KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgaWYgKCFyZXMuaGVhZGVyc1NlbnQpIHJlcy53cml0ZUhlYWQoNTAwKTtcbiAgICAgICAgcmVzLmVuZChcIkludGVybmFsIFNlcnZlciBFcnJvclwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBzZXJ2ZXIubGlzdGVuKHdvcmxkLmxpc3RlbmVyLnBvcnQpO1xufVxuXG52b2lkIGJvb3RzdHJhcCgpOyJdLCJ4X2dvb2dsZV9pZ25vcmVMaXN0IjpbNCw3LDgsMTYsMTcsMTgsMTksMjAsMjMsMjcsMzFdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUFBLElBQWEsY0FBYzs7Ozs7OztBQzREM0IsU0FBZ0IsMkJBQTJCLFVBQThIO0NBQ3ZLLE1BQU0sWUFBWTtDQUNsQixNQUFNLGFBQWE7Q0FHbkIsTUFBTSxrQkFEZSxLQUFLLElBQUksU0FBUyxPQUFPLFNBQVMsTUFDL0IsSUFBZTtDQUV2QyxJQUFJLFFBQVEsbUJBQW1CLEtBQUs7Q0FDcEMsSUFBSSxTQUFTO0NBRWIsSUFBSSxRQUFRLFdBQVcsUUFBUTtDQUMvQixJQUFJLFNBQVMsWUFBWSxTQUFTO0NBRWxDLE1BQU0sV0FBVyxLQUFLLElBQUksR0FBRyxTQUFTLFFBQVEsT0FBTyxTQUFTLFNBQVMsTUFBTTtDQUM3RSxRQUFRLEtBQUssTUFBTSxRQUFRLFFBQVE7Q0FDbkMsU0FBUyxLQUFLLE1BQU0sU0FBUyxRQUFRO0NBR3JDLE1BQU0sSUFB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