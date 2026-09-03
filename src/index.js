#!/usr/bin/env node
import { r as __toESM } from "./assets/rolldown-runtime-C7HZzL1F.js";
import * as http from "node:http";
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { execSync } from "child_process";
import { timingSafeEqual } from "node:crypto";
import { env } from "node:process";
//#region app/__VERSION__.ts
var __VERSION__ = "1029.0.353907";
//#endregion
//#region app/utils/electron-states.ts
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
		launchAtStartup: false,
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
		const primaryDisplay = electron.screen.getPrimaryDisplay();
		const screenWidth = primaryDisplay.workAreaSize.width;
		const screenHeight = primaryDisplay.workAreaSize.height;
		console.log(`[electron-states.ts] Screen size: ${screenWidth}x${screenHeight}`);
		const MIN_WIDTH = 1534;
		const MIN_HEIGHT = 864;
		const MAX_WIDTH = 1920;
		const MAX_HEIGHT = 1080;
		console.log(`[electron-states.ts] Size constraints: MIN=${MIN_WIDTH}x${MIN_HEIGHT}, MAX=${MAX_WIDTH}x${MAX_HEIGHT}`);
		const shortestSide = Math.min(screenWidth, screenHeight);
		const targetDimension = shortestSide * .85;
		console.log(`[electron-states.ts] Shortest side: ${shortestSide}, target dimension: ${targetDimension}`);
		let windowWidth = targetDimension * (16 / 9);
		let windowHeight = targetDimension;
		console.log(`[electron-states.ts] Calculated window size (16:9): ${windowWidth}x${windowHeight}, ratio: ${(windowWidth / windowHeight).toFixed(2)}`);
		if (windowWidth <= MIN_WIDTH || windowHeight <= MIN_HEIGHT) {
			console.log("[electron-states.ts] Window size below minimum, enabling fullscreen mode");
			currentStates.webviewWindowIsMaximized = true;
		} else {
			if (windowWidth > MAX_WIDTH) {
				console.log(`[electron-states.ts] Width exceeds maximum, limiting to ${MAX_WIDTH}`);
				windowWidth = MAX_WIDTH;
			}
			if (windowHeight > MAX_HEIGHT) {
				console.log(`[electron-states.ts] Height exceeds maximum, limiting to ${MAX_HEIGHT}`);
				windowHeight = MAX_HEIGHT;
			}
			currentStates.webviewWindowWidth = Math.floor(windowWidth);
			currentStates.webviewWindowHeight = Math.floor(windowHeight);
			currentStates.webviewWindowIsMaximized = false;
		}
		console.log(`[electron-states.ts] Final window size: ${currentStates.webviewWindowWidth}x${currentStates.webviewWindowHeight}, maximized: ${currentStates.webviewWindowIsMaximized}`);
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
var instancePromise$1 = null;
function useElectronStates() {
	if (!instancePromise$1) instancePromise$1 = createElectronStates();
	return instancePromise$1;
}
//#endregion
//#region app/modules/updater/$stores/updater.store.ts
var META_FILENAME = "update-meta.json";
var VERSION_CHECK_META_FILENAME = "version-check-meta.json";
function getRabbixDir() {
	if (process.env.RABBIX_DIR_OVERRIDE) return process.env.RABBIX_DIR_OVERRIDE;
	const username = process.env.USERNAME || process.env.USER;
	if (!username) return "";
	return join("C:", "Users", username, "AppData", "Local", "rabbix");
}
function compareVersions(current, remote) {
	const currentParts = current.split(".").map(Number);
	const remoteParts = remote.split(".").map(Number);
	for (let i = 0; i < 3; i++) {
		const c = currentParts[i] ?? 0;
		const r = remoteParts[i] ?? 0;
		if (r > c) {
			if (i === 0) return "major";
			if (i === 1) return "minor";
			return "patch";
		}
		if (r < c) return null;
	}
	return null;
}
async function readVersionCheckMeta(rabbixDir) {
	try {
		const raw = await readFile(join(rabbixDir, VERSION_CHECK_META_FILENAME), "utf8");
		const meta = JSON.parse(raw);
		if (typeof meta.remoteVersion === "string" && typeof meta.publishDate === "number" && (meta.updateLevel === "major" || meta.updateLevel === "minor" || meta.updateLevel === "patch") && typeof meta.checkedAt === "number") return meta;
		return null;
	} catch {
		return null;
	}
}
async function writeVersionCheckMeta(rabbixDir, meta) {
	try {
		await mkdir(rabbixDir, { recursive: true });
	} catch {}
	await writeFile(join(rabbixDir, VERSION_CHECK_META_FILENAME), JSON.stringify(meta, null, 2), "utf8");
}
async function clearVersionCheckMeta(rabbixDir) {
	try {
		await rm(join(rabbixDir, VERSION_CHECK_META_FILENAME), { force: true });
	} catch {}
}
var globalUpdateStatus = {
	autoUpdateSupported: false,
	updateLevel: null,
	updateCompleted: false,
	updated: false,
	waitingForRestart: false,
	currentVersion: "",
	remoteVersion: null,
	installPath: null,
	message: "Idle",
	error: null,
	forceUpdate: false,
	forcePrompt: false,
	publishDate: 0,
	isChecking: false,
	hashVerified: false,
	downloadedAt: null
};
function updateStatus(status) {
	const keys = Object.keys(status);
	for (const key of keys) globalUpdateStatus[key] = status[key];
}
async function readMeta(rabbixDir) {
	try {
		const raw = await readFile(join(rabbixDir, META_FILENAME), "utf8");
		const meta = JSON.parse(raw);
		if (typeof meta.version === "string" && typeof meta.downloadedAt === "number" && typeof meta.hashVerified === "boolean") return meta;
		return null;
	} catch {
		return null;
	}
}
async function writeMeta(rabbixDir, meta) {
	await writeFile(join(rabbixDir, META_FILENAME), JSON.stringify(meta, null, 2), "utf8");
}
async function clearMeta(rabbixDir) {
	try {
		await rm(join(rabbixDir, META_FILENAME), { force: true });
	} catch {}
}
async function streamDownload(url, expectedHash, logger) {
	const response = await fetch(url, { signal: AbortSignal.timeout(6e5) });
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	if (!response.body) return new Uint8Array(await response.arrayBuffer());
	const contentLength = Number(response.headers.get("content-length") || "0");
	const reader = response.body.getReader();
	const chunks = [];
	let received = 0;
	const hash = createHash("sha256");
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			chunks.push(value);
			received += value.length;
			hash.update(value);
			if (contentLength > 0) logger.info(`[updater.store.ts] Progress: ${received}/${contentLength} (${Math.floor(received / contentLength * 100)}%)`);
		}
	}
	const merged = new Uint8Array(received);
	let offset = 0;
	for (const c of chunks) {
		merged.set(c, offset);
		offset += c.length;
	}
	if (expectedHash) {
		const actualHash = hash.digest("hex");
		if (actualHash.toLowerCase() !== expectedHash.toLowerCase()) throw new Error(`HASH_MISMATCH expected=${expectedHash} actual=${actualHash}`);
	}
	return merged;
}
async function createUpdaterStore() {
	console.log("[updater.store.ts] Creating updater store instance");
	return {
		get status() {
			return globalUpdateStatus;
		},
		updateStatus(status) {
			const keys = Object.keys(status);
			for (const key of keys) globalUpdateStatus[key] = status[key];
		},
		async readMeta(rabbixDir) {
			return readMeta(rabbixDir);
		},
		async writeMeta(rabbixDir, meta) {
			return writeMeta(rabbixDir, meta);
		},
		async clearMeta(rabbixDir) {
			return clearMeta(rabbixDir);
		},
		async downloadAndInstall(context, currentVersion, remoteVersion, splitFiles, splitFileHashes, baseUrl, rabbixDir, targetVersionDir) {
			const logger = context.logger;
			logger.info("[updater.store.ts] Starting download and install process");
			if (splitFiles.length === 0) {
				logger.error("[updater.store.ts] No split files provided");
				throw context.reject("UPDATER_NO_SPLIT_FILES", {});
			}
			const downloadedParts = [];
			for (let index = 0; index < splitFiles.length; index++) {
				const filePath = splitFiles[index];
				const expectedHash = splitFileHashes[index];
				const fullUrl = `${baseUrl}${filePath}`;
				logger.info(`[updater.store.ts] Downloading part ${index + 1} of ${splitFiles.length}:`, filePath);
				updateStatus({
					message: `Downloading part ${index + 1}/${splitFiles.length}...`,
					hashVerified: false
				});
				let lastError = null;
				for (let attempt = 0; attempt < 3; attempt++) try {
					const data = await streamDownload(fullUrl, expectedHash, logger);
					downloadedParts.push(data);
					lastError = null;
					logger.info(`[updater.store.ts] Part ${index + 1} downloaded successfully`);
					break;
				} catch (error) {
					const msg = error instanceof Error ? error.message : String(error);
					if (msg.startsWith("HASH_MISMATCH")) {
						logger.error(`[updater.store.ts] Hash mismatch on part ${index + 1}: ${msg}`);
						updateStatus({
							message: `Hash mismatch on part ${index + 1}`,
							error: msg,
							hashVerified: false
						});
						throw context.reject("UPDATER_HASH_MISMATCH", {
							partIndex: index + 1,
							error: msg
						});
					}
					lastError = msg;
					logger.info(`[updater.store.ts] Download attempt ${attempt + 1} failed:`, lastError);
					if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 5e3));
				}
				if (lastError) {
					updateStatus({
						message: `Download failed: ${lastError}`,
						error: lastError
					});
					throw context.reject("UPDATER_DOWNLOAD_FAILED", {
						partIndex: index + 1,
						error: lastError
					});
				}
			}
			updateStatus({
				hashVerified: true,
				message: "Merging files..."
			});
			let totalLength = 0;
			for (let i = 0; i < downloadedParts.length; i++) totalLength += downloadedParts[i].length;
			const mergedArchive = new Uint8Array(totalLength);
			let mergeOffset = 0;
			for (let i = 0; i < downloadedParts.length; i++) {
				mergedArchive.set(downloadedParts[i], mergeOffset);
				mergeOffset += downloadedParts[i].length;
			}
			const tempDir = join(rabbixDir, ".tmp_update");
			try {
				await rm(tempDir, {
					recursive: true,
					force: true
				});
			} catch {}
			await mkdir(tempDir, { recursive: true });
			const tempArchivePath = join(tempDir, "update.7z");
			await writeFile(tempArchivePath, mergedArchive);
			logger.info("[updater.store.ts] Extracting archive...");
			updateStatus({ message: "Extracting..." });
			try {
				const sevenZipExePath = (await useElectronStates()).states.sevenZipExePath;
				execSync(`"${sevenZipExePath}" x "${tempArchivePath}" -o"${tempDir}" -y -aoa`, {
					stdio: "pipe",
					windowsHide: true
				});
			} catch (error) {
				await rm(tempDir, {
					recursive: true,
					force: true
				});
				const errorMsg = error instanceof Error ? error.message : String(error);
				updateStatus({
					message: `Extraction failed: ${errorMsg}`,
					error: errorMsg
				});
				throw context.reject("UPDATER_EXTRACTION_FAILED", { error: errorMsg });
			} finally {
				try {
					await rm(tempArchivePath, { force: true });
				} catch {}
			}
			try {
				await access(targetVersionDir);
				await rm(targetVersionDir, {
					recursive: true,
					force: true
				});
			} catch {}
			const extractedEntries = await readdir(tempDir, { withFileTypes: true });
			let sourceDir = tempDir;
			if (extractedEntries.length === 1 && extractedEntries[0].isDirectory()) sourceDir = join(tempDir, extractedEntries[0].name);
			logger.info("[updater.store.ts] Moving extracted files to target directory:", targetVersionDir);
			updateStatus({ message: "Installing..." });
			let renameOk = false;
			let lastError;
			for (let attempt = 0; attempt < 3; attempt++) try {
				await rename(sourceDir, targetVersionDir);
				renameOk = true;
				break;
			} catch (error) {
				lastError = error;
				const errInfo = error instanceof Error ? `${error.message}` : JSON.stringify(error);
				logger.info(`[updater.store.ts] rename attempt ${attempt + 1} failed: ${errInfo}`);
				try {
					await access(targetVersionDir);
					const delDir = `${targetVersionDir}.del_${Date.now()}`;
					try {
						await rename(targetVersionDir, delDir);
						logger.info(`[updater.store.ts] renamed old target to ${delDir}`);
						rm(delDir, {
							recursive: true,
							force: true
						}).catch(() => {});
					} catch (delErr) {
						logger.info(`[updater.store.ts] rename-to-del failed: ${delErr instanceof Error ? delErr.message : String(delErr)}`);
					}
				} catch {}
				await new Promise((r) => setTimeout(r, 500));
			}
			if (!renameOk) {
				const error = lastError;
				const errInfo = error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : JSON.stringify(error);
				console.error("[updater.store.ts] rename failed after retries:", {
					sourceDir,
					targetVersionDir,
					error: errInfo
				});
				await rm(tempDir, {
					recursive: true,
					force: true
				});
				const errorMsg = error instanceof Error ? error.message : String(error);
				updateStatus({
					message: `Installation failed: ${errorMsg}`,
					error: errorMsg
				});
				throw context.reject("UPDATER_INSTALL_FAILED", { error: errorMsg });
			}
			try {
				await rm(tempDir, {
					recursive: true,
					force: true
				});
			} catch {}
			const downloadedAt = Date.now();
			await writeMeta(rabbixDir, {
				version: remoteVersion,
				downloadedAt,
				installPath: targetVersionDir,
				hashVerified: true
			});
			logger.info("[updater.store.ts] Update completed successfully, version:", remoteVersion);
			updateStatus({
				message: "Update successful",
				updateCompleted: true,
				updated: true,
				waitingForRestart: true,
				installPath: targetVersionDir,
				hashVerified: true,
				downloadedAt
			});
		},
		async cleanupOldVersions(rabbixDir, currentVersion, latestVersion) {
			console.log("[updater.store.ts] Cleaning up old versions");
			const currentVersionDir = `v${currentVersion.startsWith("v") ? currentVersion.slice(1) : currentVersion}`;
			const latestVersionDir = `v${latestVersion.startsWith("v") ? latestVersion.slice(1) : latestVersion}`;
			let entries;
			try {
				entries = await readdir(rabbixDir);
			} catch {
				return;
			}
			const timestamp = Date.now();
			for (const entry of entries) {
				if (!entry.startsWith("v")) continue;
				if (entry === currentVersionDir || entry === latestVersionDir) continue;
				const oldVersionPath = join(rabbixDir, entry);
				const tempPath = join(rabbixDir, `.del_${timestamp}_${Math.random().toString(36).slice(2, 8)}`);
				try {
					await rename(oldVersionPath, tempPath);
				} catch {
					continue;
				}
				try {
					await rm(tempPath, {
						recursive: true,
						force: true
					});
				} catch {}
			}
		}
	};
}
var instancePromise = null;
function useUpdaterStore() {
	if (!instancePromise) instancePromise = createUpdaterStore();
	return instancePromise;
}
//#endregion
//#region app/utils/electron.ts
var mainWindow = null;
var tray = null;
var OUTDATE_PROMPT_HTML = "outdate-prompt.html";
var OUTDATED_MAJOR_THRESHOLD_MS = 4320 * 60 * 1e3;
var OUTDATED_MINOR_THRESHOLD_MS = 14400 * 60 * 1e3;
async function shouldLoadOutdatePrompt() {
	const rabbixDir = getRabbixDir();
	if (!rabbixDir) return {
		loadOutdate: false,
		reason: "no-rabbix-dir",
		meta: null
	};
	const meta = await readVersionCheckMeta(rabbixDir);
	if (!meta) return {
		loadOutdate: false,
		reason: "no-meta",
		meta: null
	};
	if (compareVersions("1029.0.353907", meta.remoteVersion) === null) {
		await clearVersionCheckMeta(rabbixDir);
		return {
			loadOutdate: false,
			reason: "version-caught-up",
			meta: null
		};
	}
	const ageMs = Date.now() - meta.publishDate * 1e3;
	if (meta.updateLevel === "major" && ageMs > OUTDATED_MAJOR_THRESHOLD_MS) return {
		loadOutdate: true,
		reason: `major-outdated age=${Math.floor(ageMs / 36e5)}h`,
		meta
	};
	if (meta.updateLevel === "minor" && ageMs > OUTDATED_MINOR_THRESHOLD_MS) return {
		loadOutdate: true,
		reason: `minor-outdated age=${Math.floor(ageMs / 864e5)}d`,
		meta
	};
	return {
		loadOutdate: false,
		reason: "within-threshold",
		meta: null
	};
}
async function createElectronApp() {
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
		const { handleDisplayChange, setWallpaper } = await import("./assets/wallpaper-Bbli00hS.js");
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
	const isFullScreenMode = savedStates.webviewWindowIsMaximized;
	console.log(`[electron] Window size: ${windowWidth}x${windowHeight}, maximized: ${isFullScreenMode}`);
	if (isFullScreenMode) {
		const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize;
		mainWindow = new electron.BrowserWindow({
			width: screenWidth,
			height: screenHeight,
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
	const { loadOutdate, reason } = await shouldLoadOutdatePrompt();
	if (loadOutdate) {
		const htmlPath = join(savedStates.publicPath, OUTDATE_PROMPT_HTML);
		console.log(`[electron] Loading outdate-prompt page: ${htmlPath} (reason: ${reason})`);
		globalThis.__lastLoadURL = `file://${htmlPath}`;
		mainWindow.loadFile(htmlPath);
	} else {
		const url = new URL(getWebviewOrigin());
		url.searchParams.set("mode", "electron");
		url.searchParams.set("shellVersion", __VERSION__);
		url.searchParams.set("electronPort", electronPort.toString());
		url.searchParams.set("electronToken", globalThis.electronToken);
		console.log(`[electron] Loading webview URL, outdate check: ${reason}`);
		globalThis.__lastLoadURL = url.toString();
		mainWindow.loadURL(url.toString());
	}
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
	if (!electronStates.states.runInBackground) mainWindow.show();
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
		if (mainWindow && !mainWindow.isMaximized() && !isFullScreenMode) saveWindowState();
	});
	mainWindow.on("move", () => {
		if (mainWindow && !mainWindow.isMaximized() && !isFullScreenMode) saveWindowState();
	});
	mainWindow.on("maximize", () => {
		if (!isFullScreenMode) saveWindowState();
	});
	mainWindow.on("unmaximize", () => {
		if (!isFullScreenMode) saveWindowState();
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
	electron.app.setLoginItemSettings({
		openAtLogin: launchAtStartup,
		openAsHidden: launchAtStartup && runInBackground
	});
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
		ctx.call = (module2, params2) => __call(ctx, module2, params2);
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
	const config2 = await configSchema.get();
	const runtime = {
		request: /* @__PURE__ */ new Map(),
		config: config2
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
		config: config2
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
		for (const part2 of parts) {
			if (!currentNode.children.has(part2)) currentNode.children.set(part2, new TrieNode());
			currentNode = currentNode.children.get(part2);
		}
		currentNode.value = value;
		this.cache.set(path, value);
	}
	get(path) {
		const cached = this.cache.get(path);
		if (cached !== void 0) return cached;
		const parts = path.replace(/^\/+|\/+$/g, "").split("/").filter((p) => p !== "");
		let currentNode = this.root;
		for (const part2 of parts) {
			if (!currentNode.children.has(part2)) return null;
			currentNode = currentNode.children.get(part2);
		}
		const result = currentNode.value;
		if (result !== null) this.cache.set(path, result);
		return result;
	}
	getByParts(parts) {
		let currentNode = this.root;
		for (const part2 of parts) {
			if (!currentNode.children.has(part2)) return null;
			currentNode = currentNode.children.get(part2);
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
			const corsHeaders2 = getCorsHeaders(origin);
			return new Response(null, {
				status: 204,
				headers: {
					Server: "milkio",
					...corsHeaders2,
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
				const corsHeaders2 = getCorsHeaders(origin);
				if (options.rawResponse) return {
					__rawResponse: true,
					body: "",
					status: 403,
					headers: corsHeaders2
				};
				return new Response(void 0, {
					status: 403,
					headers: corsHeaders2
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
				const corsHeaders3 = getCorsHeaders(origin);
				const body2 = JSON.stringify({
					success: false,
					code: "PARAMS_TYPE_NOT_SUPPORTED",
					reject: { expected: "valid base64 event name" }
				});
				if (options.rawResponse) return {
					__rawResponse: true,
					body: body2,
					status: 200,
					headers: {
						...corsHeaders3,
						"Content-Type": "application/json"
					}
				};
				return new Response(body2, {
					status: 200,
					headers: {
						...corsHeaders3,
						"Content-Type": "application/json"
					}
				});
			}
			let eventData = void 0;
			const rawBody = await readBodyText();
			if (rawBody && rawBody !== "" && rawBody !== "{}") try {
				eventData = reviveJSONParse(JSON.parse(rawBody));
			} catch {
				const corsHeaders3 = getCorsHeaders(origin);
				const body2 = JSON.stringify({
					success: false,
					code: "PARAMS_TYPE_NOT_SUPPORTED",
					reject: { expected: "json" }
				});
				if (options.rawResponse) return {
					__rawResponse: true,
					body: body2,
					status: 200,
					headers: {
						...corsHeaders3,
						"Content-Type": "application/json"
					}
				};
				return new Response(body2, {
					status: 200,
					headers: {
						...corsHeaders3,
						"Content-Type": "application/json"
					}
				});
			}
			const executeId2 = __createId();
			const jsonHeaders = {
				...getCorsHeaders(origin),
				"Content-Type": "application/json",
				"Cache-Control": "no-store"
			};
			if (eventData && typeof eventData === "object" && !Array.isArray(eventData) && !("context" in eventData)) {
				const context2 = {};
				context2.reject = reject;
				context2.raise = raise;
				context2.develop = runtime.develop;
				context2.executeId = executeId2;
				context2.path = pathString;
				context2.emit = runtime.emit;
				context2.emitAnyApproved = runtime.emitAnyApproved;
				context2.emitAllApproved = runtime.emitAllApproved;
				context2._ = runtime;
				context2.config = runtime.runtime.config;
				context2.typia = generated.typiaSchema;
				context2.call = (module, params) => executer.__call(context2, module, params);
				context2.onFinally = () => {};
				const logger2 = createLogger(runtime, pathString, executeId2);
				context2.logger = logger2;
				context2.http = {
					ip,
					params: {
						string: rawBody ?? "",
						parsed: eventData
					},
					request: options.request
				};
				eventData.context = context2;
				const emitHttpResponse = (success) => {
					if (runtime._hasEmitHandlers?.("milkio:httpResponse") ?? true) return runtime.emit("milkio:httpResponse", {
						executeId: executeId2,
						logger: logger2,
						path: pathString,
						http: context2.http,
						headers: options.request.headers,
						context: context2,
						success,
						reject,
						raise
					});
				};
				try {
					if (runtime._hasEmitHandlers?.("milkio:executeBefore") ?? true) await runtime.emit("milkio:executeBefore", {
						executeId: executeId2,
						logger: logger2,
						path: pathString,
						meta: {},
						context: context2,
						reject,
						raise
					});
					await runtime.emit(eventName, eventData);
				} catch (emitError) {
					const errResult = exceptionHandler(executeId2, logger2, emitError);
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
				const errResult = exceptionHandler(executeId2, noopLogger, emitError);
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
			const body = `{"data":${JSON.stringify(eventData ?? {}, (key, value) => key === "context" ? void 0 : value)},"executeId":"${executeId2}","success":true}`;
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
					const executeId2 = __createId();
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
								const context2 = Object.create(baseContextProto);
								context2.path = pathString;
								context2.routeType = "action";
								context2.executeId = executeId2;
								context2.http = {
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
								context2.headers = options.request.headers;
								try {
									const result = await handler(context2, params);
									if (result === void 0 || result === null || result === "") return {
										__rawResponse: true,
										body: emptyResultPrefix + executeId2 + idSuffix,
										status: 200,
										headers: defaultMergedHeaders
									};
									else if (!Array.isArray(result) && typeof result === "object") return {
										__rawResponse: true,
										body: resultPrefix + JSON.stringify(result) + ",\"executeId\":\"" + executeId2 + idSuffix,
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
	const handleMessage = async (port2, options) => {
		if (typeof options === "string") {
			if (options === "PING") port2.postMessage("PONG");
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
				if (executed.emptyResult) port2.postMessage({
					executeId: options.executeId,
					success: true,
					data: void 0
				});
				else port2.postMessage({
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
					port2.postMessage({
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
						port2.postMessage(data);
					}
					port2.postMessage({
						success: true,
						data: void 0,
						executeId: options.executeId,
						done: true
					});
				} catch (error) {
					const exception = exceptionHandler(options.executeId, logger, error);
					const result = {};
					result[exception.code] = exception.reject;
					port2.postMessage({
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
			port2.postMessage({
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
var schema_default$17 = {
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
var schema_default$16 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/close.action-Du-exQm-.js"),
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
var schema_default$15 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/get-state.action-BvNRJHVT.js"),
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
var schema_default$14 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/maximize.action-BTLuX1zL.js"),
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
var schema_default$13 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/minimize.action-CG1CgWKc.js"),
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
var schema_default$12 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/cancel.action-CUY2P1H0.js"),
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
var schema_default$11 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/set.action-EzGiaQsT.js"),
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
	const lower = getLowerBoundary$1(schema);
	const upper = getUpperBoundary$1(schema);
	const minimum = lower?.value ?? (upper === null ? 0 : upper.value - 100);
	const maximum = upper?.value ?? (lower === null ? 100 : lower.value + 100);
	if (minimum > maximum) throw new Error("Minimum value is greater than maximum value.");
	return schema.multipleOf === void 0 ? scalar$1({
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
var scalar$1 = (props) => {
	const minimum = Math.ceil(props.minimum);
	const maximum = Math.floor(props.maximum);
	if (minimum > maximum) throw new Error("The integer range is empty.");
	return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
};
var getLowerBoundary$1 = (schema) => {
	const selected = selectBoundary$1(schema.minimum === void 0 ? null : {
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
var getUpperBoundary$1 = (schema) => {
	const selected = selectBoundary$1(schema.maximum === void 0 ? null : {
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
var selectBoundary$1 = (x, y, compare) => {
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
var DEFAULT_RANGE$1 = 5;
var _randomString = (props) => {
	const minimum = props.minLength ?? Math.min(props.maxLength ?? DEFAULT_MIN_LENGTH, DEFAULT_MIN_LENGTH);
	const length = _randomInteger({
		type: "integer",
		minimum,
		maximum: props.maxLength ?? minimum + DEFAULT_RANGE$1
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
//#region ../../node_modules/typia/lib/internal/_randomNumber.mjs
var _randomNumber = (schema) => {
	const lower = getLowerBoundary(schema);
	const upper = getUpperBoundary(schema);
	const minimum = lower?.value ?? (upper === null ? 0 : upper.value - 100);
	const maximum = upper?.value ?? (lower === null ? 100 : lower.value + 100);
	if (minimum > maximum) throw new Error("Minimum value is greater than maximum value.");
	return schema.multipleOf === void 0 ? scalar({
		minimum,
		maximum,
		exclusiveMinimum: lower?.exclusive ?? false,
		exclusiveMaximum: upper?.exclusive ?? false
	}) : _randomMultiple({
		minimum,
		maximum,
		multipleOf: schema.multipleOf,
		exclusiveMinimum: lower?.exclusive ?? false,
		exclusiveMaximum: upper?.exclusive ?? false,
		integer: false
	});
};
var scalar = (props) => {
	if (props.minimum === props.maximum && (props.exclusiveMinimum || props.exclusiveMaximum)) throw new Error("Exclusive numeric range is empty.");
	const value = Math.random() * (props.maximum - props.minimum) + props.minimum;
	if (props.exclusiveMinimum && value === props.minimum || props.exclusiveMaximum && value === props.maximum) {
		const middle = props.minimum + (props.maximum - props.minimum) / 2;
		if (middle <= props.minimum || middle >= props.maximum) throw new Error("Exclusive numeric range has no representable value.");
		return middle;
	}
	return value;
};
var getLowerBoundary = (schema) => selectBoundary(schema.minimum === void 0 ? null : {
	value: schema.minimum,
	exclusive: false
}, schema.exclusiveMinimum === void 0 ? null : {
	value: schema.exclusiveMinimum,
	exclusive: true
}, Math.max);
var getUpperBoundary = (schema) => selectBoundary(schema.maximum === void 0 ? null : {
	value: schema.maximum,
	exclusive: false
}, schema.exclusiveMaximum === void 0 ? null : {
	value: schema.exclusiveMaximum,
	exclusive: true
}, Math.min);
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
//#region ../../node_modules/typia/lib/internal/_isUniqueItems.mjs
var _isUniqueItems = (elements) => {
	for (let i = 0; i < elements.length; i++) for (let j = i + 1; j < elements.length; j++) if (equals(/* @__PURE__ */ new WeakMap())(elements[i], elements[j])) return false;
	return true;
};
var equals = (visited) => {
	const next = (a, b) => {
		if (a === b) return true;
		if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
		const previous = visited.get(a)?.get(b);
		if (previous !== void 0) return previous;
		const pairs = visited.get(a) ?? /* @__PURE__ */ new WeakMap();
		visited.set(a, pairs);
		pairs.set(b, true);
		const result = compare(a, b);
		pairs.set(b, result);
		return result;
	};
	const compare = (a, b) => {
		if (Array.isArray(a)) {
			if (!Array.isArray(b) || a.length !== b.length) return false;
			for (let i = 0; i < a.length; i++) {
				const aHas = Object.hasOwn(a, i);
				if (aHas !== Object.hasOwn(b, i) || aHas && !next(a[i], b[i])) return false;
			}
			return true;
		}
		if (Array.isArray(b)) return false;
		if (a instanceof Set) {
			if (!(b instanceof Set) || a.size !== b.size) return false;
			const unmatched = [...b];
			for (const value of a) {
				const index = unmatched.findIndex((candidate) => next(value, candidate));
				if (index === -1) return false;
				unmatched.splice(index, 1);
			}
			return true;
		}
		if (a instanceof Map) {
			if (!(b instanceof Map) || a.size !== b.size) return false;
			const unmatched = [...b];
			for (const [key, value] of a) {
				const index = unmatched.findIndex(([candidateKey, candidateValue]) => next(key, candidateKey) && next(value, candidateValue));
				if (index === -1) return false;
				unmatched.splice(index, 1);
			}
			return true;
		}
		if (a instanceof Boolean) return b instanceof Boolean && a.valueOf() === b.valueOf();
		if (Object.prototype.toString.call(a) === "[object BigInt]") return Object.prototype.toString.call(b) === "[object BigInt]" && a.valueOf() === b.valueOf();
		if (Object.prototype.toString.call(a) === "[object Symbol]") return Object.prototype.toString.call(b) === "[object Symbol]" && a.valueOf() === b.valueOf();
		if (a instanceof Number) return b instanceof Number && a.valueOf() === b.valueOf();
		if (a instanceof String) return b instanceof String && a.valueOf() === b.valueOf();
		if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime();
		if (a instanceof RegExp) return b instanceof RegExp && a.source === b.source && a.flags === b.flags;
		if (typeof File !== "undefined" && a instanceof File) return b instanceof File && a.name === b.name && a.size === b.size && a.type === b.type && a.lastModified === b.lastModified;
		if (typeof Blob !== "undefined" && a instanceof Blob) return b instanceof Blob && a.size === b.size && a.type === b.type;
		if (a instanceof DataView) {
			if (!(b instanceof DataView) || a.byteLength !== b.byteLength) return false;
			return bytes(a.buffer, a.byteOffset, a.byteLength).every((value, index) => value === bytes(b.buffer, b.byteOffset, b.byteLength)[index]);
		}
		if (ArrayBuffer.isView(a)) {
			if (!ArrayBuffer.isView(b) || b instanceof DataView || Object.getPrototypeOf(a) !== Object.getPrototypeOf(b) || a.byteLength !== b.byteLength) return false;
			const x = bytes(a.buffer, a.byteOffset, a.byteLength);
			const y = bytes(b.buffer, b.byteOffset, b.byteLength);
			return x.every((value, index) => value === y[index]);
		}
		if (a instanceof ArrayBuffer) return b instanceof ArrayBuffer && a.byteLength === b.byteLength && bytes(a).every((value, index) => value === bytes(b)[index]);
		if (typeof SharedArrayBuffer !== "undefined" && a instanceof SharedArrayBuffer) return b instanceof SharedArrayBuffer && a.byteLength === b.byteLength && bytes(a).every((value, index) => value === bytes(b)[index]);
		const keys = Reflect.ownKeys(a).filter((key) => Object.prototype.propertyIsEnumerable.call(a, key));
		return keys.length === Reflect.ownKeys(b).filter((key) => Object.prototype.propertyIsEnumerable.call(b, key)).length && keys.every((key) => Object.prototype.propertyIsEnumerable.call(b, key) && next(a[key], b[key]));
	};
	return next;
};
var bytes = (buffer, byteOffset = 0, byteLength = buffer.byteLength) => new Uint8Array(buffer, byteOffset, byteLength);
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomArray.mjs
var DEFAULT_MIN_ITEMS = 1;
var DEFAULT_RANGE = 5;
var DEFAULT_RECURSIVE_RANGE = 2;
/**
* Consecutive duplicates that end a unique draw once its floor is satisfied.
*
* The worst case a domain can still hide is one value left among a handful:
* with one of four remaining, sixty-four misses in a row is a `0.75 ** 64`
* event, about one in a hundred million. Below the floor this limit does not
* apply at all, so it can never fail a request the domain could satisfy.
*/
var STALE_LIMIT = 64;
var _randomArray = (props) => {
	const defaultMinimum = props.recursive === true ? 0 : DEFAULT_MIN_ITEMS;
	const minimum = props.minItems ?? Math.min(props.maxItems ?? defaultMinimum, defaultMinimum);
	const count = _randomInteger({
		type: "integer",
		minimum,
		maximum: props.maxItems ?? minimum + (props.recursive === true ? DEFAULT_RECURSIVE_RANGE : DEFAULT_RANGE)
	});
	if (props.uniqueItems !== true) return new Array(count).fill(null).map((_, i) => props.element(i, count));
	const elements = [];
	const maximumAttempts = count * 100 + 1e3;
	let stale = 0;
	for (let attempts = 0; elements.length !== count && attempts !== maximumAttempts; attempts++) {
		const candidate = props.element(elements.length, count);
		if (elements.every((element) => _isUniqueItems([element, candidate]))) {
			elements.push(candidate);
			stale = 0;
		} else if (elements.length >= minimum && ++stale === STALE_LIMIT) break;
	}
	if (elements.length < minimum) throw new Error("Unable to generate enough unique items; the element domain may be too small.");
	return elements;
};
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomBoolean.mjs
var _randomBoolean = () => Math.random() < .5;
//#endregion
//#region ../../node_modules/typia/lib/internal/_randomPick.mjs
var _randomPick = (array) => array[random(array)];
var random = (array) => _randomInteger({
	type: "integer",
	minimum: 0,
	maximum: array.length - 1
});
//#endregion
//#region ../../node_modules/typia/lib/internal/_jsonStringifyNumber.mjs
var _jsonStringifyNumber = (value) => isFinite(value) ? value : null;
//#endregion
//#region .milkio/transpiled/routes/modules__updater__downloadTaction/3dfwhbvjux9su/schema.ts
var schema_default$10 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/download.action-FZgY0Y9v.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => "string" === typeof input.currentVersion && "string" === typeof input.remoteVersion && Array.isArray(input.splitFiles) && input.splitFiles.every((elem) => "string" === typeof elem) && Array.isArray(input.splitFileHashes) && input.splitFileHashes.every((elem) => "string" === typeof elem) && "string" === typeof input.baseUrl && (void 0 === input.forcePrompt || "boolean" === typeof input.forcePrompt) && (void 0 === input.publishDate || "number" === typeof input.publishDate) && (void 0 === input.updateLevel || "major" === input.updateLevel || "minor" === input.updateLevel || "patch" === input.updateLevel);
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("currentVersion" === key || "remoteVersion" === key || "splitFiles" === key || "splitFileHashes" === key || "baseUrl" === key || "forcePrompt" === key || "publishDate" === key || "updateLevel" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"string" === typeof input.currentVersion || _report(_exceptionable, {
				path: _path + ".currentVersion",
				expected: "string",
				value: input.currentVersion
			}),
			"string" === typeof input.remoteVersion || _report(_exceptionable, {
				path: _path + ".remoteVersion",
				expected: "string",
				value: input.remoteVersion
			}),
			(Array.isArray(input.splitFiles) || _report(_exceptionable, {
				path: _path + ".splitFiles",
				expected: "Array<string>",
				value: input.splitFiles
			})) && input.splitFiles.map((elem, _index3) => "string" === typeof elem || _report(_exceptionable, {
				path: _path + ".splitFiles[" + _index3 + "]",
				expected: "string",
				value: elem
			})).every((flag) => flag) || _report(_exceptionable, {
				path: _path + ".splitFiles",
				expected: "Array<string>",
				value: input.splitFiles
			}),
			(Array.isArray(input.splitFileHashes) || _report(_exceptionable, {
				path: _path + ".splitFileHashes",
				expected: "Array<string>",
				value: input.splitFileHashes
			})) && input.splitFileHashes.map((elem, _index4) => "string" === typeof elem || _report(_exceptionable, {
				path: _path + ".splitFileHashes[" + _index4 + "]",
				expected: "string",
				value: elem
			})).every((flag) => flag) || _report(_exceptionable, {
				path: _path + ".splitFileHashes",
				expected: "Array<string>",
				value: input.splitFileHashes
			}),
			"string" === typeof input.baseUrl || _report(_exceptionable, {
				path: _path + ".baseUrl",
				expected: "string",
				value: input.baseUrl
			}),
			void 0 === input.forcePrompt || "boolean" === typeof input.forcePrompt || _report(_exceptionable, {
				path: _path + ".forcePrompt",
				expected: "(boolean | undefined)",
				value: input.forcePrompt
			}),
			void 0 === input.publishDate || "number" === typeof input.publishDate || _report(_exceptionable, {
				path: _path + ".publishDate",
				expected: "(number | undefined)",
				value: input.publishDate
			}),
			void 0 === input.updateLevel || "major" === input.updateLevel || "minor" === input.updateLevel || "patch" === input.updateLevel || _report(_exceptionable, {
				path: _path + ".updateLevel",
				expected: "(\"major\" | \"minor\" | \"patch\" | undefined)",
				value: input.updateLevel
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
			currentVersion: (_generator?.string ?? _randomString)({ type: "string" }),
			remoteVersion: (_generator?.string ?? _randomString)({ type: "string" }),
			splitFiles: (_generator?.array ?? _randomArray)({
				type: "array",
				element: () => (_generator?.string ?? _randomString)({ type: "string" })
			}),
			splitFileHashes: (_generator?.array ?? _randomArray)({
				type: "array",
				element: () => (_generator?.string ?? _randomString)({ type: "string" })
			}),
			baseUrl: (_generator?.string ?? _randomString)({ type: "string" }),
			forcePrompt: _randomPick([() => void 0, () => (_generator?.boolean ?? _randomBoolean)()])(),
			publishDate: _randomPick([() => void 0, () => (_generator?.number ?? _randomNumber)({ type: "number" })])(),
			updateLevel: _randomPick([
				() => void 0,
				() => "major",
				() => "minor",
				() => "patch"
			])()
		});
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.autoUpdateSupported && "boolean" === typeof input.updateCompleted && "boolean" === typeof input.waitingForRestart && (null === input.remoteVersion || "string" === typeof input.remoteVersion) && (null === input.installPath || "string" === typeof input.installPath) && "string" === typeof input.message && "boolean" === typeof input.hashVerified && (null === input.downloadedAt || "number" === typeof input.downloadedAt);
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("autoUpdateSupported" === key || "updateCompleted" === key || "waitingForRestart" === key || "remoteVersion" === key || "installPath" === key || "message" === key || "hashVerified" === key || "downloadedAt" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [
			"boolean" === typeof input.autoUpdateSupported || _report(_exceptionable, {
				path: _path + ".autoUpdateSupported",
				expected: "boolean",
				value: input.autoUpdateSupported
			}),
			"boolean" === typeof input.updateCompleted || _report(_exceptionable, {
				path: _path + ".updateCompleted",
				expected: "boolean",
				value: input.updateCompleted
			}),
			"boolean" === typeof input.waitingForRestart || _report(_exceptionable, {
				path: _path + ".waitingForRestart",
				expected: "boolean",
				value: input.waitingForRestart
			}),
			null === input.remoteVersion || "string" === typeof input.remoteVersion || _report(_exceptionable, {
				path: _path + ".remoteVersion",
				expected: "(null | string)",
				value: input.remoteVersion
			}),
			null === input.installPath || "string" === typeof input.installPath || _report(_exceptionable, {
				path: _path + ".installPath",
				expected: "(null | string)",
				value: input.installPath
			}),
			"string" === typeof input.message || _report(_exceptionable, {
				path: _path + ".message",
				expected: "string",
				value: input.message
			}),
			"boolean" === typeof input.hashVerified || _report(_exceptionable, {
				path: _path + ".hashVerified",
				expected: "boolean",
				value: input.hashVerified
			}),
			null === input.downloadedAt || "number" === typeof input.downloadedAt || _report(_exceptionable, {
				path: _path + ".downloadedAt",
				expected: "(null | number)",
				value: input.downloadedAt
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
			const _so0 = (input) => `{"autoUpdateSupported":${String(input.autoUpdateSupported)},"updateCompleted":${String(input.updateCompleted)},"waitingForRestart":${String(input.waitingForRestart)},"remoteVersion":${null !== input.remoteVersion ? _jsonStringifyString(input.remoteVersion) : "null"},"installPath":${null !== input.installPath ? _jsonStringifyString(input.installPath) : "null"},"message":${_jsonStringifyString(input.message)},"hashVerified":${String(input.hashVerified)},"downloadedAt":${null !== input.downloadedAt ? String(_jsonStringifyNumber(input.downloadedAt)) : "null"}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__updater__reloadTaction/3jl2v8tv13exs/schema.ts
var schema_default$9 = {
	type: "action",
	types: void 0,
	module: () => import("./assets/reload.action-C5gLyvua.js"),
	validateParams: (params) => (() => {
		const _io0 = (input) => void 0 === input.force || "boolean" === typeof input.force;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("force" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => [void 0 === input.force || "boolean" === typeof input.force || _report(_exceptionable, {
			path: _path + ".force",
			expected: "(boolean | undefined)",
			value: input.force
		})].every((flag) => flag);
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
		const _ro0 = (_recursive = false, _depth = 0) => ({ force: _randomPick([() => void 0, () => (_generator?.boolean ?? _randomBoolean)()])() });
		let _generator;
		return (generator) => {
			_generator = generator;
			return _ro0();
		};
	})()(),
	validateResults: (results) => (() => {
		const _io0 = (input) => "boolean" === typeof input.success && "string" === typeof input.message;
		const _po0 = (input) => {
			for (const key of Object.keys(input)) {
				if ("success" === key || "message" === key) continue;
				delete input[key];
			}
		};
		const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.success || _report(_exceptionable, {
			path: _path + ".success",
			expected: "boolean",
			value: input.success
		}), "string" === typeof input.message || _report(_exceptionable, {
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
			const _so0 = (input) => `{"success":${String(input.success)},"message":${_jsonStringifyString(input.message)}}`;
			return (input) => _so0(input);
		})()(results);
	}
};
//#endregion
//#region .milkio/transpiled/routes/modules__local_file__delete_fileTaction/5j9rrnc7cgpv/schema.ts
var schema_default$8 = {
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
var schema_default$7 = {
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
//#region .milkio/index.ts
var generated = {
	meta: void 0,
	context: void 0,
	rejectCode: void 0,
	events: void 0,
	typiaSchema: typia_schema_default,
	routeSchema: {
		"/": schema_default$17,
		"/window/close": schema_default$16,
		"/window/get-state": schema_default$15,
		"/window/maximize": schema_default$14,
		"/window/minimize": schema_default$13,
		"/wallpaper/cancel": schema_default$12,
		"/wallpaper/set": schema_default$11,
		"/updater/download": schema_default$10,
		"/updater/reload": schema_default$9,
		"/local-file/delete-file": schema_default$8,
		"/local-file/exists": schema_default$7,
		"/local-file/list-directory": {
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
		},
		"/local-file/pick-directory": {
			type: "action",
			types: void 0,
			module: () => import("./assets/pick-directory.action-ZiSgUWYB.js"),
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
		},
		"/local-file/read-file": {
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
		},
		"/local-file/write-file": {
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
		},
		"/desktop-setting/get": {
			type: "action",
			types: void 0,
			module: () => import("./assets/get.action-mUqKAP5V.js"),
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
				const _io0 = (input) => "boolean" === typeof input.launchAtStartup && "boolean" === typeof input.runInBackground;
				const _po0 = (input) => {
					for (const key of Object.keys(input)) {
						if ("launchAtStartup" === key || "runInBackground" === key) continue;
						delete input[key];
					}
				};
				const _vo0 = (input, _path, _exceptionable = true) => ["boolean" === typeof input.launchAtStartup || _report(_exceptionable, {
					path: _path + ".launchAtStartup",
					expected: "boolean",
					value: input.launchAtStartup
				}), "boolean" === typeof input.runInBackground || _report(_exceptionable, {
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
					const _so0 = (input) => `{"launchAtStartup":${String(input.launchAtStartup)},"runInBackground":${String(input.runInBackground)}}`;
					return (input) => _so0(input);
				})()(results);
			}
		},
		"/desktop-setting/set-launch-at-startup": {
			type: "action",
			types: void 0,
			module: () => import("./assets/set-launch-at-startup.action-DyHgZ8qO.js"),
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
			module: () => import("./assets/set-run-in-background.action-DD6X29E-.js"),
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
export { writeVersionCheckMeta as a, useUpdaterStore as i, getWebviewWindow as n, useElectronStates as o, getRabbixDir as r, __VERSION__ as s, getWebviewOrigin as t };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJuYW1lcyI6WyJnZXRMb3dlckJvdW5kYXJ5IiwiZ2V0VXBwZXJCb3VuZGFyeSIsInNjYWxhciIsInNlbGVjdEJvdW5kYXJ5IiwiREVGQVVMVF9SQU5HRSIsInJhbmRvbSJdLCJzb3VyY2VzIjpbIi4uL2FwcC9fX1ZFUlNJT05fXy50cyIsIi4uL2FwcC91dGlscy9lbGVjdHJvbi1zdGF0ZXMudHMiLCIuLi9hcHAvbW9kdWxlcy91cGRhdGVyLyRzdG9yZXMvdXBkYXRlci5zdG9yZS50cyIsIi4uL2FwcC91dGlscy9lbGVjdHJvbi50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9taWxraW8vaW5kZXguanMiLCIuLi8ubWlsa2lvL2NvbmZpZy1zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3R5cGlhLXNjaGVtYS50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmcubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnQubWpzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19pbmRleFRhY3Rpb24vMnljdGtvajZjMnZtZC9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uLzk3NmN4eHF1bGh3YS9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbi8xaWZwaTdwMWU2bWN0L3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24vM2Y4NW9lY3doZ3Rqai9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uLzcwcXNiamVta3FyMi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbi8xeGl4eG52eXdld25yL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uL2dhdWFyaDM2ejd1dC9zY2hlbWEudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19kZWNpbWFsLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX2lzTXVsdGlwbGVPZi5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21NdWx0aXBsZS5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21JbnRlZ2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21OdW1iZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9faXNVbmlxdWVJdGVtcy5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21BcnJheS5tanMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19yYW5kb21Cb29sZWFuLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy90eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVBpY2subWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3R5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeU51bWJlci5tanMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbi8zZGZ3aGJ2anV4OXN1L3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbi8zamwydjh0djEzZXhzL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uLzVqOXJybmM3Y2dwdi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24vMTltZ2lyczdzczQzZS9zY2hlbWEudHMiLCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvdHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5QXJyYXkubWpzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24vMjFtZDF0Nzg0MGp0Mi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbi8xa29vcjNrdXJpZ2FsL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbi84dGN1ejd1MDg3M3kvc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbi8yNGZmeTI4aHY0Y2hsL3NjaGVtYS50cyIsIi4uLy5taWxraW8vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uLzE2dGR1M3Jxc241M24vc2NoZW1hLnRzIiwiLi4vLm1pbGtpby90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24vM3V5dTR1YWt4eTBlYi9zY2hlbWEudHMiLCIuLi8ubWlsa2lvL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbi8xOXVhb2dndnc2d3lsL3NjaGVtYS50cyIsIi4uLy5taWxraW8vcm91dGUtc2NoZW1hLnRzIiwiLi4vLm1pbGtpby9yYXctc2NoZW1hLnRzIiwiLi4vLm1pbGtpby9oYW5kbGVyLXNjaGVtYS50cyIsIi4uLy5taWxraW8vaW5kZXgudHMiLCIuLi9hcHAvYm9vdHN0cmFwL2VsZWN0cm9uLXRva2VuL2luZGV4LnRzIiwiLi4vaW5kZXgudHMiLCIuLi8ubWlsa2lvL3J1bi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgX19WRVJTSU9OX18gPSAnMTAyOS4wLjM1MzkwNyc7XG4iLCJpbXBvcnQgeyB3cml0ZUZpbGUsIHJlYWRGaWxlLCBta2RpciB9IGZyb20gJ2ZzL3Byb21pc2VzJztcbmltcG9ydCB7IHdyaXRlRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBqb2luLCBkaXJuYW1lIH0gZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAndXJsJztcblxuaW50ZXJmYWNlIEVsZWN0cm9uU3RhdGVzIHtcbiAgLyoqXG4gICAqIOeUqOaIt+aVsOaNrui3r+W+hFxuICAgKi9cbiAgdXNlckRhdGFQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDlhazlhbHot6/lvoRcbiAgICovXG4gIHB1YmxpY1BhdGg6IHN0cmluZztcbiAgLyoqXG4gICAqIHpwYXFmcmFuei5leGUg6Lev5b6EXG4gICAqL1xuICB6cGFxZnJhbnpFeGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiA3emEuZXhlIOi3r+W+hFxuICAgKi9cbiAgc2V2ZW5aaXBFeGVQYXRoOiBzdHJpbmc7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOWuveW6plxuICAgKi9cbiAgd2Vidmlld1dpbmRvd1dpZHRoOiBudW1iZXI7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOmrmOW6plxuICAgKi9cbiAgd2Vidmlld1dpbmRvd0hlaWdodDogbnVtYmVyO1xuICAvKipcbiAgICog572R6aG16KeG5Zu+56qX5Y+jOiBY5Z2Q5qCHXG4gICAqL1xuICB3ZWJ2aWV3V2luZG93WD86IG51bWJlcjtcbiAgLyoqXG4gICAqIOe9kemhteinhuWbvueql+WPozogWeWdkOagh1xuICAgKi9cbiAgd2Vidmlld1dpbmRvd1k/OiBudW1iZXI7XG4gIC8qKlxuICAgKiDnvZHpobXop4blm77nqpflj6M6IOaYr+WQpuacgOWkp+WMllxuICAgKi9cbiAgd2Vidmlld1dpbmRvd0lzTWF4aW1pemVkOiBib29sZWFuO1xuICAvKipcbiAgICog5byA5py65ZCv5YqoXG4gICAqL1xuICBsYXVuY2hBdFN0YXJ0dXA6IGJvb2xlYW47XG4gIC8qKlxuICAgKiDlkK/liqjlkI7lnKjlkI7lj7Dov5DooYzkuI3mmL7npLrkuLvliqjnlYzpnaJcbiAgICovXG4gIHJ1bkluQmFja2dyb3VuZDogYm9vbGVhbjtcbiAgLyoqXG4gICAqIOWjgee6uOWKn+iDveaYr+WQpuWQr+eUqO+8iOWQr+WKqOaXtuiHquWKqOaBouWkjeWjgee6uOeKtuaAge+8iVxuICAgKi9cbiAgd2FsbHBhcGVyRW5hYmxlZDogYm9vbGVhbjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlRWxlY3Ryb25TdGF0ZXMoKTogUHJvbWlzZTxFbGVjdHJvblN0YXRlc0luc3RhbmNlPiB7XG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBjcmVhdGVFbGVjdHJvblN0YXRlcyBjYWxsZWQsIGluaXRpYWxpemluZy4uLicpO1xuXG4gIGNvbnN0IHVzZXJEYXRhUGF0aCA9IGpvaW4oZWxlY3Ryb24uYXBwLmdldFBhdGgoJ3VzZXJEYXRhJyksICdBcHBEYXRhJyk7XG4gIGNvbnN0IHB1YmxpY1BhdGggPSBqb2luKGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKSk7XG4gIGNvbnN0IHpwYXFmcmFuekV4ZVBhdGggPSBqb2luKHB1YmxpY1BhdGgsICd6cGFxZnJhbnouZXhlJyk7XG4gIGNvbnN0IHNldmVuWmlwRXhlUGF0aCA9IGpvaW4ocHVibGljUGF0aCwgJzd6YS5leGUnKTtcbiAgY29uc3QgZmlsZVBhdGggPSBqb2luKHVzZXJEYXRhUGF0aCwgJ3N0YXRlcy5qc29uJyk7XG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBGaWxlIHBhdGggcmVzb2x2ZWQ6JywgZmlsZVBhdGgpO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgbWtkaXIoam9pbihmaWxlUGF0aCwgJy4uJyksIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICB9IGNhdGNoIHt9XG5cbiAgLy8g5bCd6K+V5LuO5paH5Lu25Yqg6L295bey5L+d5a2Y55qE54q25oCBXG4gIGxldCBsb2FkZWRGcm9tRmlsZSA9IGZhbHNlO1xuICBsZXQgY3VycmVudFN0YXRlczogRWxlY3Ryb25TdGF0ZXMgPSB7XG4gICAgd2Vidmlld1dpbmRvd1dpZHRoOiAxNTM0LFxuICAgIHdlYnZpZXdXaW5kb3dIZWlnaHQ6IDg2NCxcbiAgICB3ZWJ2aWV3V2luZG93SXNNYXhpbWl6ZWQ6IGZhbHNlLFxuICAgIGxhdW5jaEF0U3RhcnR1cDogZmFsc2UsXG4gICAgcnVuSW5CYWNrZ3JvdW5kOiBmYWxzZSxcbiAgICB3YWxscGFwZXJFbmFibGVkOiBmYWxzZSxcbiAgICB1c2VyRGF0YVBhdGgsXG4gICAgcHVibGljUGF0aCxcbiAgICB6cGFxZnJhbnpFeGVQYXRoLFxuICAgIHNldmVuWmlwRXhlUGF0aCxcbiAgfTtcblxuICB0cnkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCByZWFkRmlsZShmaWxlUGF0aCwgJ3V0Zi04Jyk7XG4gICAgY3VycmVudFN0YXRlcyA9IEpTT04ucGFyc2UoY29udGVudCkgYXMgRWxlY3Ryb25TdGF0ZXM7XG4gICAgbG9hZGVkRnJvbUZpbGUgPSB0cnVlO1xuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBMb2FkZWQgc3RhdGVzIGZyb20gZmlsZTonLCBKU09OLnN0cmluZ2lmeShjdXJyZW50U3RhdGVzKSk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIOaWh+S7tuS4jeWtmOWcqO+8jOmmluasoeWIneWni+WMlu+8jOmcgOimgeagueaNruWxj+W5leWwuuWvuOiuoeeul+m7mOiupOeql+WPo+Wkp+Wwj1xuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTdGF0ZXMgZmlsZSBub3QgZm91bmQsIGNhbGN1bGF0aW5nIGRlZmF1bHQgd2luZG93IHNpemUuLi4nKTtcblxuICAgIC8vIOetieW+hSBFbGVjdHJvbiBhcHAg5YeG5aSH5bCx57uq5ZCO5omN6IO96I635Y+W5bGP5bmV5bC65a+4XG4gICAgYXdhaXQgZWxlY3Ryb24uYXBwLndoZW5SZWFkeSgpO1xuICAgIGNvbnN0IHByaW1hcnlEaXNwbGF5ID0gZWxlY3Ryb24uc2NyZWVuLmdldFByaW1hcnlEaXNwbGF5KCk7XG4gICAgY29uc3Qgc2NyZWVuV2lkdGggPSBwcmltYXJ5RGlzcGxheS53b3JrQXJlYVNpemUud2lkdGg7XG4gICAgY29uc3Qgc2NyZWVuSGVpZ2h0ID0gcHJpbWFyeURpc3BsYXkud29ya0FyZWFTaXplLmhlaWdodDtcbiAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uLXN0YXRlcy50c10gU2NyZWVuIHNpemU6ICR7c2NyZWVuV2lkdGh9eCR7c2NyZWVuSGVpZ2h0fWApO1xuXG4gICAgLy8g56qX5Y+j5bC65a+457qm5p2f5bi46YePXG4gICAgY29uc3QgTUlOX1dJRFRIID0gMTUzNDtcbiAgICBjb25zdCBNSU5fSEVJR0hUID0gODY0O1xuICAgIGNvbnN0IE1BWF9XSURUSCA9IDE5MjA7XG4gICAgY29uc3QgTUFYX0hFSUdIVCA9IDEwODA7XG4gICAgY29uc29sZS5sb2coYFtlbGVjdHJvbi1zdGF0ZXMudHNdIFNpemUgY29uc3RyYWludHM6IE1JTj0ke01JTl9XSURUSH14JHtNSU5fSEVJR0hUfSwgTUFYPSR7TUFYX1dJRFRIfXgke01BWF9IRUlHSFR9YCk7XG5cbiAgICAvLyDmoLnmja7lsY/luZXmnIDnn63ovrnorqHnrpfnqpflj6PlsLrlr7jvvIzkv53mjIEgMTY6OSDmr5TkvotcbiAgICBjb25zdCBzaG9ydGVzdFNpZGUgPSBNYXRoLm1pbihzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KTtcbiAgICBjb25zdCB0YXJnZXREaW1lbnNpb24gPSBzaG9ydGVzdFNpZGUgKiAwLjg1O1xuICAgIGNvbnNvbGUubG9nKGBbZWxlY3Ryb24tc3RhdGVzLnRzXSBTaG9ydGVzdCBzaWRlOiAke3Nob3J0ZXN0U2lkZX0sIHRhcmdldCBkaW1lbnNpb246ICR7dGFyZ2V0RGltZW5zaW9ufWApO1xuXG4gICAgbGV0IHdpbmRvd1dpZHRoID0gdGFyZ2V0RGltZW5zaW9uICogKDE2IC8gOSk7XG4gICAgbGV0IHdpbmRvd0hlaWdodCA9IHRhcmdldERpbWVuc2lvbjtcbiAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uLXN0YXRlcy50c10gQ2FsY3VsYXRlZCB3aW5kb3cgc2l6ZSAoMTY6OSk6ICR7d2luZG93V2lkdGh9eCR7d2luZG93SGVpZ2h0fSwgcmF0aW86ICR7KHdpbmRvd1dpZHRoIC8gd2luZG93SGVpZ2h0KS50b0ZpeGVkKDIpfWApO1xuXG4gICAgLy8g5aaC5p6c6K6h566X5Ye655qE5bC65a+45bCP5LqO5pyA5bCP5YC877yM5YiZ5L2/55So5YWo5bGP5qih5byPXG4gICAgaWYgKHdpbmRvd1dpZHRoIDw9IE1JTl9XSURUSCB8fCB3aW5kb3dIZWlnaHQgPD0gTUlOX0hFSUdIVCkge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIFdpbmRvdyBzaXplIGJlbG93IG1pbmltdW0sIGVuYWJsaW5nIGZ1bGxzY3JlZW4gbW9kZScpO1xuICAgICAgY3VycmVudFN0YXRlcy53ZWJ2aWV3V2luZG93SXNNYXhpbWl6ZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyDlkKbliJnpmZDliLblnKjmnIDlpKflgLzojIPlm7TlhoVcbiAgICAgIGlmICh3aW5kb3dXaWR0aCA+IE1BWF9XSURUSCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uLXN0YXRlcy50c10gV2lkdGggZXhjZWVkcyBtYXhpbXVtLCBsaW1pdGluZyB0byAke01BWF9XSURUSH1gKTtcbiAgICAgICAgd2luZG93V2lkdGggPSBNQVhfV0lEVEg7XG4gICAgICB9XG4gICAgICBpZiAod2luZG93SGVpZ2h0ID4gTUFYX0hFSUdIVCkge1xuICAgICAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uLXN0YXRlcy50c10gSGVpZ2h0IGV4Y2VlZHMgbWF4aW11bSwgbGltaXRpbmcgdG8gJHtNQVhfSEVJR0hUfWApO1xuICAgICAgICB3aW5kb3dIZWlnaHQgPSBNQVhfSEVJR0hUO1xuICAgICAgfVxuICAgICAgY3VycmVudFN0YXRlcy53ZWJ2aWV3V2luZG93V2lkdGggPSBNYXRoLmZsb29yKHdpbmRvd1dpZHRoKTtcbiAgICAgIGN1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd0hlaWdodCA9IE1hdGguZmxvb3Iod2luZG93SGVpZ2h0KTtcbiAgICAgIGN1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd0lzTWF4aW1pemVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coYFtlbGVjdHJvbi1zdGF0ZXMudHNdIEZpbmFsIHdpbmRvdyBzaXplOiAke2N1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd1dpZHRofXgke2N1cnJlbnRTdGF0ZXMud2Vidmlld1dpbmRvd0hlaWdodH0sIG1heGltaXplZDogJHtjdXJyZW50U3RhdGVzLndlYnZpZXdXaW5kb3dJc01heGltaXplZH1gKTtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gQ3JlYXRpbmcgc3RhdGVzIGZpbGUgd2l0aCBjYWxjdWxhdGVkIHZhbHVlcy4uLicpO1xuICAgIGF3YWl0IHdyaXRlRmlsZShmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlcywgbnVsbCwgMiksICd1dGYtOCcpO1xuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTdGF0ZXMgZmlsZSBjcmVhdGVkIHN1Y2Nlc3NmdWxseScpO1xuICB9XG5cbiAgY3VycmVudFN0YXRlcy51c2VyRGF0YVBhdGggPSB1c2VyRGF0YVBhdGg7XG4gIGN1cnJlbnRTdGF0ZXMucHVibGljUGF0aCA9IHB1YmxpY1BhdGg7XG4gIGN1cnJlbnRTdGF0ZXMuenBhcWZyYW56RXhlUGF0aCA9IHpwYXFmcmFuekV4ZVBhdGg7XG4gIGN1cnJlbnRTdGF0ZXMuc2V2ZW5aaXBFeGVQYXRoID0gc2V2ZW5aaXBFeGVQYXRoO1xuICBjdXJyZW50U3RhdGVzLmxhdW5jaEF0U3RhcnR1cCA9IGN1cnJlbnRTdGF0ZXMubGF1bmNoQXRTdGFydHVwID8/IGZhbHNlO1xuICBjdXJyZW50U3RhdGVzLnJ1bkluQmFja2dyb3VuZCA9IGN1cnJlbnRTdGF0ZXMucnVuSW5CYWNrZ3JvdW5kID8/IGZhbHNlO1xuICBjdXJyZW50U3RhdGVzLndhbGxwYXBlckVuYWJsZWQgPSBjdXJyZW50U3RhdGVzLndhbGxwYXBlckVuYWJsZWQgPz8gZmFsc2U7XG5cbiAgbGV0IHNhdmVUaW1lb3V0OiBSZXR1cm5UeXBlPHR5cGVvZiBzZXRUaW1lb3V0PiB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0IHNhdmVUb0ZpbGUgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKHNhdmVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2F2ZVRpbWVvdXQpO1xuICAgICAgc2F2ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gU2F2aW5nIHN0YXRlcyB0byBmaWxlOicsIEpTT04uc3RyaW5naWZ5KGN1cnJlbnRTdGF0ZXMpKTtcbiAgICBhd2FpdCB3cml0ZUZpbGUoZmlsZVBhdGgsIEpTT04uc3RyaW5naWZ5KGN1cnJlbnRTdGF0ZXMsIG51bGwsIDIpLCAndXRmLTgnKTtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gU3RhdGVzIHNhdmVkIHN1Y2Nlc3NmdWxseScpO1xuICB9O1xuXG4gIGNvbnN0IGRlYm91bmNlZFNhdmUgPSBhc3luYyAoKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgaWYgKHNhdmVUaW1lb3V0KSB7XG4gICAgICBjbGVhclRpbWVvdXQoc2F2ZVRpbWVvdXQpO1xuICAgICAgc2F2ZVRpbWVvdXQgPSBudWxsO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gRGVib3VuY2VkIHNhdmUgc2NoZWR1bGVkLCAzMDBtcyBkZWxheS4uLicpO1xuICAgIHNhdmVUaW1lb3V0ID0gc2V0VGltZW91dChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBzYXZlVG9GaWxlKCk7XG4gICAgfSwgMzAwKTtcbiAgfTtcblxuICBjb25zdCBzeW5jU2F2ZSA9ICgpOiB2b2lkID0+IHtcbiAgICBpZiAoc2F2ZVRpbWVvdXQpIHtcbiAgICAgIGNsZWFyVGltZW91dChzYXZlVGltZW91dCk7XG4gICAgICBzYXZlVGltZW91dCA9IG51bGw7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTeW5jIHNhdmluZyBzdGF0ZXMgdG8gZmlsZSAocHJvY2VzcyBleGl0KTonLCBKU09OLnN0cmluZ2lmeShjdXJyZW50U3RhdGVzKSk7XG4gICAgd3JpdGVGaWxlU3luYyhmaWxlUGF0aCwgSlNPTi5zdHJpbmdpZnkoY3VycmVudFN0YXRlcywgbnVsbCwgMiksICd1dGYtOCcpO1xuICB9O1xuXG4gIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBTZXR0aW5nIHVwIHByb2Nlc3MgZXhpdCBoYW5kbGVycy4uLicpO1xuICBjb25zdCBjbGVhbnVwRm5zOiBBcnJheTwoKSA9PiB2b2lkPiA9IFtdO1xuXG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBjb25zdCBvbkV4aXQgPSAoKTogdm9pZCA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gUHJvY2VzcyBleGl0IHNpZ25hbCByZWNlaXZlZCcpO1xuICAgICAgc3luY1NhdmUoKTtcbiAgICB9O1xuICAgIHByb2Nlc3Mub24oJ2V4aXQnLCBvbkV4aXQpO1xuICAgIGNsZWFudXBGbnMucHVzaCgoKSA9PiBwcm9jZXNzLm9mZignZXhpdCcsIG9uRXhpdCkpO1xuXG4gICAgaWYgKHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMicpIHtcbiAgICAgIGNvbnN0IG9uU2lnbFRlcm0gPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbZWxlY3Ryb24tc3RhdGVzLnRzXSBXaW5kb3dzIFNJR1RFUk0gcmVjZWl2ZWQnKTtcbiAgICAgICAgc3luY1NhdmUoKTtcbiAgICAgIH07XG4gICAgICBwcm9jZXNzLm9uKCdTSUdURVJNJywgb25TaWdsVGVybSk7XG4gICAgICBjbGVhbnVwRm5zLnB1c2goKCkgPT4gcHJvY2Vzcy5vZmYoJ1NJR1RFUk0nLCBvblNpZ2xUZXJtKSk7XG5cbiAgICAgIGNvbnN0IG9uU2lnbEludCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIFdpbmRvd3MgU0lHSU5UIHJlY2VpdmVkJyk7XG4gICAgICAgIHN5bmNTYXZlKCk7XG4gICAgICB9O1xuICAgICAgcHJvY2Vzcy5vbignU0lHSU5UJywgb25TaWdsSW50KTtcbiAgICAgIGNsZWFudXBGbnMucHVzaCgoKSA9PiBwcm9jZXNzLm9mZignU0lHSU5UJywgb25TaWdsSW50KSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHR5cGVvZiBlbGVjdHJvbiAhPT0gJ3VuZGVmaW5lZCcgJiYgZWxlY3Ryb24uYXBwKSB7XG4gICAgLy8g5aaC5p6c5piv5LuO5paH5Lu25Yqg6L2955qE54q25oCB77yM6ZyA6KaB562J5b6FIGFwcCByZWFkee+8m+WmguaenOaYr+mmluasoeWIneWni+WMlu+8jOS4iumdouW3sue7j+etieW+hei/h+S6hlxuICAgIGlmIChsb2FkZWRGcm9tRmlsZSkge1xuICAgICAgYXdhaXQgZWxlY3Ryb24uYXBwLndoZW5SZWFkeSgpO1xuICAgIH1cbiAgICBjb25zdCBvbldpbGxRdWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIEVsZWN0cm9uIHdpbGwtcXVpdCBldmVudCByZWNlaXZlZCcpO1xuICAgIH07XG4gICAgZWxlY3Ryb24uYXBwLm9uKCd3aWxsLXF1aXQnLCBvbldpbGxRdWl0KTtcbiAgICBjbGVhbnVwRm5zLnB1c2goKCkgPT4gZWxlY3Ryb24uYXBwLm9mZignd2lsbC1xdWl0Jywgb25XaWxsUXVpdCkpO1xuXG4gICAgY29uc3Qgb25CZWZvcmVRdWl0ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIEVsZWN0cm9uIGJlZm9yZS1xdWl0IGV2ZW50IHJlY2VpdmVkJyk7XG4gICAgICBzeW5jU2F2ZSgpO1xuICAgIH07XG4gICAgZWxlY3Ryb24uYXBwLm9uKCdiZWZvcmUtcXVpdCcsIG9uQmVmb3JlUXVpdCk7XG4gICAgY2xlYW51cEZucy5wdXNoKCgpID0+IGVsZWN0cm9uLmFwcC5vZmYoJ2JlZm9yZS1xdWl0Jywgb25CZWZvcmVRdWl0KSk7XG4gIH1cblxuICBjb25zdCBzZXQgPSAocGFydGlhbDogUGFydGlhbDxFbGVjdHJvblN0YXRlcz4pOiB2b2lkID0+IHtcbiAgICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gc2V0IGNhbGxlZCB3aXRoOicsIEpTT04uc3RyaW5naWZ5KHBhcnRpYWwpKTtcbiAgICBjdXJyZW50U3RhdGVzID0geyAuLi5jdXJyZW50U3RhdGVzLCAuLi5wYXJ0aWFsIH07XG4gICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbi1zdGF0ZXMudHNdIHN0YXRlcyBhZnRlciBtZXJnZTonLCBKU09OLnN0cmluZ2lmeShjdXJyZW50U3RhdGVzKSk7XG4gICAgZGVib3VuY2VkU2F2ZSgpO1xuICB9O1xuXG4gIGNvbnN0IGluc3RhbmNlOiBFbGVjdHJvblN0YXRlc0luc3RhbmNlID0ge1xuICAgIGdldCBzdGF0ZXMoKSB7XG4gICAgICByZXR1cm4gY3VycmVudFN0YXRlcztcbiAgICB9LFxuICAgIHNldCxcbiAgfTtcblxuICBjb25zb2xlLmxvZygnW2VsZWN0cm9uLXN0YXRlcy50c10gY3JlYXRlRWxlY3Ryb25TdGF0ZXMgY29tcGxldGVkLCBpbnN0YW5jZSBjcmVhdGVkJyk7XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5sZXQgaW5zdGFuY2VQcm9taXNlOiBQcm9taXNlPEVsZWN0cm9uU3RhdGVzSW5zdGFuY2U+IHwgbnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VFbGVjdHJvblN0YXRlcygpOiBQcm9taXNlPEVsZWN0cm9uU3RhdGVzSW5zdGFuY2U+IHtcbiAgaWYgKCFpbnN0YW5jZVByb21pc2UpIHtcbiAgICBpbnN0YW5jZVByb21pc2UgPSBjcmVhdGVFbGVjdHJvblN0YXRlcygpO1xuICB9XG4gIHJldHVybiBpbnN0YW5jZVByb21pc2U7XG59XG5cbmludGVyZmFjZSBFbGVjdHJvblN0YXRlc0luc3RhbmNlIHtcbiAgc3RhdGVzOiBFbGVjdHJvblN0YXRlcztcbiAgc2V0OiAocGFydGlhbDogUGFydGlhbDxFbGVjdHJvblN0YXRlcz4pID0+IHZvaWQ7XG59XG4iLCJpbXBvcnQgeyBhY2Nlc3MsIG1rZGlyLCByZWFkZGlyLCByZWFkRmlsZSwgcm0sIHJlbmFtZSwgd3JpdGVGaWxlIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY3JlYXRlSGFzaCB9IGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xuaW1wb3J0IHsgdXNlRWxlY3Ryb25TdGF0ZXMgfSBmcm9tICcuLi8uLi8uLi91dGlscy9lbGVjdHJvbi1zdGF0ZXMudHMnO1xuXG50eXBlIFVwZGF0ZUxldmVsID0gJ21ham9yJyB8ICdtaW5vcicgfCAncGF0Y2gnO1xuXG5pbnRlcmZhY2UgVXBkYXRlU3RhdHVzIHtcbiAgYXV0b1VwZGF0ZVN1cHBvcnRlZDogYm9vbGVhbjtcbiAgdXBkYXRlTGV2ZWw6IFVwZGF0ZUxldmVsIHwgbnVsbDtcbiAgdXBkYXRlQ29tcGxldGVkOiBib29sZWFuO1xuICB1cGRhdGVkOiBib29sZWFuO1xuICB3YWl0aW5nRm9yUmVzdGFydDogYm9vbGVhbjtcbiAgY3VycmVudFZlcnNpb246IHN0cmluZztcbiAgcmVtb3RlVmVyc2lvbjogc3RyaW5nIHwgbnVsbDtcbiAgaW5zdGFsbFBhdGg6IHN0cmluZyB8IG51bGw7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgZXJyb3I6IHN0cmluZyB8IG51bGw7XG4gIGZvcmNlVXBkYXRlOiBib29sZWFuO1xuICBmb3JjZVByb21wdDogYm9vbGVhbjtcbiAgcHVibGlzaERhdGU6IG51bWJlcjtcbiAgaXNDaGVja2luZzogYm9vbGVhbjtcbiAgaGFzaFZlcmlmaWVkOiBib29sZWFuO1xuICBkb3dubG9hZGVkQXQ6IG51bWJlciB8IG51bGw7XG59XG5cbmludGVyZmFjZSBVcGRhdGVNZXRhIHtcbiAgdmVyc2lvbjogc3RyaW5nO1xuICBkb3dubG9hZGVkQXQ6IG51bWJlcjtcbiAgaW5zdGFsbFBhdGg6IHN0cmluZztcbiAgaGFzaFZlcmlmaWVkOiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZlcnNpb25DaGVja01ldGEge1xuICByZW1vdGVWZXJzaW9uOiBzdHJpbmc7XG4gIHB1Ymxpc2hEYXRlOiBudW1iZXI7XG4gIHVwZGF0ZUxldmVsOiBVcGRhdGVMZXZlbDtcbiAgY2hlY2tlZEF0OiBudW1iZXI7XG59XG5cbmNvbnN0IE1FVEFfRklMRU5BTUUgPSAndXBkYXRlLW1ldGEuanNvbic7XG5jb25zdCBWRVJTSU9OX0NIRUNLX01FVEFfRklMRU5BTUUgPSAndmVyc2lvbi1jaGVjay1tZXRhLmpzb24nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmFiYml4RGlyKCk6IHN0cmluZyB7XG4gIGlmIChwcm9jZXNzLmVudi5SQUJCSVhfRElSX09WRVJSSURFKSByZXR1cm4gcHJvY2Vzcy5lbnYuUkFCQklYX0RJUl9PVkVSUklERTtcbiAgY29uc3QgdXNlcm5hbWUgPSBwcm9jZXNzLmVudi5VU0VSTkFNRSB8fCBwcm9jZXNzLmVudi5VU0VSO1xuICBpZiAoIXVzZXJuYW1lKSByZXR1cm4gJyc7XG4gIHJldHVybiBqb2luKCdDOicsICdVc2VycycsIHVzZXJuYW1lLCAnQXBwRGF0YScsICdMb2NhbCcsICdyYWJiaXgnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmVWZXJzaW9ucyhjdXJyZW50OiBzdHJpbmcsIHJlbW90ZTogc3RyaW5nKTogVXBkYXRlTGV2ZWwgfCBudWxsIHtcbiAgY29uc3QgY3VycmVudFBhcnRzID0gY3VycmVudC5zcGxpdCgnLicpLm1hcChOdW1iZXIpO1xuICBjb25zdCByZW1vdGVQYXJ0cyA9IHJlbW90ZS5zcGxpdCgnLicpLm1hcChOdW1iZXIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIGNvbnN0IGMgPSBjdXJyZW50UGFydHNbaV0gPz8gMDtcbiAgICBjb25zdCByID0gcmVtb3RlUGFydHNbaV0gPz8gMDtcbiAgICBpZiAociA+IGMpIHtcbiAgICAgIGlmIChpID09PSAwKSByZXR1cm4gJ21ham9yJztcbiAgICAgIGlmIChpID09PSAxKSByZXR1cm4gJ21pbm9yJztcbiAgICAgIHJldHVybiAncGF0Y2gnO1xuICAgIH1cbiAgICBpZiAociA8IGMpIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFZlcnNpb25DaGVja01ldGEocmFiYml4RGlyOiBzdHJpbmcpOiBQcm9taXNlPFZlcnNpb25DaGVja01ldGEgfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcmF3ID0gYXdhaXQgcmVhZEZpbGUoam9pbihyYWJiaXhEaXIsIFZFUlNJT05fQ0hFQ0tfTUVUQV9GSUxFTkFNRSksICd1dGY4Jyk7XG4gICAgY29uc3QgbWV0YSA9IEpTT04ucGFyc2UocmF3KSBhcyBWZXJzaW9uQ2hlY2tNZXRhO1xuICAgIGlmIChcbiAgICAgIHR5cGVvZiBtZXRhLnJlbW90ZVZlcnNpb24gPT09ICdzdHJpbmcnXG4gICAgICAmJiB0eXBlb2YgbWV0YS5wdWJsaXNoRGF0ZSA9PT0gJ251bWJlcidcbiAgICAgICYmIChtZXRhLnVwZGF0ZUxldmVsID09PSAnbWFqb3InIHx8IG1ldGEudXBkYXRlTGV2ZWwgPT09ICdtaW5vcicgfHwgbWV0YS51cGRhdGVMZXZlbCA9PT0gJ3BhdGNoJylcbiAgICAgICYmIHR5cGVvZiBtZXRhLmNoZWNrZWRBdCA9PT0gJ251bWJlcidcbiAgICApIHtcbiAgICAgIHJldHVybiBtZXRhO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlVmVyc2lvbkNoZWNrTWV0YShyYWJiaXhEaXI6IHN0cmluZywgbWV0YTogVmVyc2lvbkNoZWNrTWV0YSk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGF3YWl0IG1rZGlyKHJhYmJpeERpciwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIH0gY2F0Y2gge31cbiAgYXdhaXQgd3JpdGVGaWxlKGpvaW4ocmFiYml4RGlyLCBWRVJTSU9OX0NIRUNLX01FVEFfRklMRU5BTUUpLCBKU09OLnN0cmluZ2lmeShtZXRhLCBudWxsLCAyKSwgJ3V0ZjgnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyVmVyc2lvbkNoZWNrTWV0YShyYWJiaXhEaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICB0cnkge1xuICAgIGF3YWl0IHJtKGpvaW4ocmFiYml4RGlyLCBWRVJTSU9OX0NIRUNLX01FVEFfRklMRU5BTUUpLCB7IGZvcmNlOiB0cnVlIH0pO1xuICB9IGNhdGNoIHt9XG59XG5cbmNvbnN0IGdsb2JhbFVwZGF0ZVN0YXR1czogVXBkYXRlU3RhdHVzID0ge1xuICBhdXRvVXBkYXRlU3VwcG9ydGVkOiBmYWxzZSxcbiAgdXBkYXRlTGV2ZWw6IG51bGwsXG4gIHVwZGF0ZUNvbXBsZXRlZDogZmFsc2UsXG4gIHVwZGF0ZWQ6IGZhbHNlLFxuICB3YWl0aW5nRm9yUmVzdGFydDogZmFsc2UsXG4gIGN1cnJlbnRWZXJzaW9uOiAnJyxcbiAgcmVtb3RlVmVyc2lvbjogbnVsbCxcbiAgaW5zdGFsbFBhdGg6IG51bGwsXG4gIG1lc3NhZ2U6ICdJZGxlJyxcbiAgZXJyb3I6IG51bGwsXG4gIGZvcmNlVXBkYXRlOiBmYWxzZSxcbiAgZm9yY2VQcm9tcHQ6IGZhbHNlLFxuICBwdWJsaXNoRGF0ZTogMCxcbiAgaXNDaGVja2luZzogZmFsc2UsXG4gIGhhc2hWZXJpZmllZDogZmFsc2UsXG4gIGRvd25sb2FkZWRBdDogbnVsbCxcbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoc3RhdHVzKSBhcyBBcnJheTxrZXlvZiBVcGRhdGVTdGF0dXM+O1xuICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzKSB7XG4gICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiByZWFkTWV0YShyYWJiaXhEaXI6IHN0cmluZyk6IFByb21pc2U8VXBkYXRlTWV0YSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByYXcgPSBhd2FpdCByZWFkRmlsZShqb2luKHJhYmJpeERpciwgTUVUQV9GSUxFTkFNRSksICd1dGY4Jyk7XG4gICAgY29uc3QgbWV0YSA9IEpTT04ucGFyc2UocmF3KSBhcyBVcGRhdGVNZXRhO1xuICAgIGlmICh0eXBlb2YgbWV0YS52ZXJzaW9uID09PSAnc3RyaW5nJyAmJiB0eXBlb2YgbWV0YS5kb3dubG9hZGVkQXQgPT09ICdudW1iZXInICYmIHR5cGVvZiBtZXRhLmhhc2hWZXJpZmllZCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICByZXR1cm4gbWV0YTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHdyaXRlTWV0YShyYWJiaXhEaXI6IHN0cmluZywgbWV0YTogVXBkYXRlTWV0YSk6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCB3cml0ZUZpbGUoam9pbihyYWJiaXhEaXIsIE1FVEFfRklMRU5BTUUpLCBKU09OLnN0cmluZ2lmeShtZXRhLCBudWxsLCAyKSwgJ3V0ZjgnKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2xlYXJNZXRhKHJhYmJpeERpcjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgYXdhaXQgcm0oam9pbihyYWJiaXhEaXIsIE1FVEFfRklMRU5BTUUpLCB7IGZvcmNlOiB0cnVlIH0pO1xuICB9IGNhdGNoIHt9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0cmVhbURvd25sb2FkKFxuICB1cmw6IHN0cmluZyxcbiAgZXhwZWN0ZWRIYXNoOiBzdHJpbmcgfCB1bmRlZmluZWQsXG4gIGxvZ2dlcjogYW55LFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7IHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCg2MDAwMDApIH0pO1xuICBpZiAoIXJlc3BvbnNlLm9rKSB0aHJvdyBuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXN9YCk7XG4gIGlmICghcmVzcG9uc2UuYm9keSkge1xuICAgIHJldHVybiBuZXcgVWludDhBcnJheShhd2FpdCByZXNwb25zZS5hcnJheUJ1ZmZlcigpKTtcbiAgfVxuXG4gIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOdW1iZXIocmVzcG9uc2UuaGVhZGVycy5nZXQoJ2NvbnRlbnQtbGVuZ3RoJykgfHwgJzAnKTtcbiAgY29uc3QgcmVhZGVyID0gcmVzcG9uc2UuYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3QgY2h1bmtzOiBVaW50OEFycmF5W10gPSBbXTtcbiAgbGV0IHJlY2VpdmVkID0gMDtcbiAgY29uc3QgaGFzaCA9IGNyZWF0ZUhhc2goJ3NoYTI1NicpO1xuXG4gIGZvciAoOzspIHtcbiAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgIGlmIChkb25lKSBicmVhaztcbiAgICBpZiAodmFsdWUpIHtcbiAgICAgIGNodW5rcy5wdXNoKHZhbHVlKTtcbiAgICAgIHJlY2VpdmVkICs9IHZhbHVlLmxlbmd0aDtcbiAgICAgIGhhc2gudXBkYXRlKHZhbHVlKTtcbiAgICAgIGlmIChjb250ZW50TGVuZ3RoID4gMCkge1xuICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIFByb2dyZXNzOiAke3JlY2VpdmVkfS8ke2NvbnRlbnRMZW5ndGh9ICgke01hdGguZmxvb3IoKHJlY2VpdmVkIC8gY29udGVudExlbmd0aCkgKiAxMDApfSUpYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbWVyZ2VkID0gbmV3IFVpbnQ4QXJyYXkocmVjZWl2ZWQpO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgZm9yIChjb25zdCBjIG9mIGNodW5rcykge1xuICAgIG1lcmdlZC5zZXQoYywgb2Zmc2V0KTtcbiAgICBvZmZzZXQgKz0gYy5sZW5ndGg7XG4gIH1cblxuICBpZiAoZXhwZWN0ZWRIYXNoKSB7XG4gICAgY29uc3QgYWN0dWFsSGFzaCA9IGhhc2guZGlnZXN0KCdoZXgnKTtcbiAgICBpZiAoYWN0dWFsSGFzaC50b0xvd2VyQ2FzZSgpICE9PSBleHBlY3RlZEhhc2gudG9Mb3dlckNhc2UoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBIQVNIX01JU01BVENIIGV4cGVjdGVkPSR7ZXhwZWN0ZWRIYXNofSBhY3R1YWw9JHthY3R1YWxIYXNofWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBtZXJnZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVwZGF0ZXJTdG9yZSgpIHtcbiAgY29uc29sZS5sb2coJ1t1cGRhdGVyLnN0b3JlLnRzXSBDcmVhdGluZyB1cGRhdGVyIHN0b3JlIGluc3RhbmNlJyk7XG5cbiAgY29uc3QgaW5zdGFuY2UgPSB7XG4gICAgZ2V0IHN0YXR1cygpIHtcbiAgICAgIHJldHVybiBnbG9iYWxVcGRhdGVTdGF0dXM7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1cyhzdGF0dXM6IFBhcnRpYWw8VXBkYXRlU3RhdHVzPik6IHZvaWQge1xuICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHN0YXR1cykgYXMgQXJyYXk8a2V5b2YgVXBkYXRlU3RhdHVzPjtcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcbiAgICAgICAgKGdsb2JhbFVwZGF0ZVN0YXR1cyBhcyBhbnkpW2tleV0gPSBzdGF0dXNba2V5XTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgYXN5bmMgcmVhZE1ldGEocmFiYml4RGlyOiBzdHJpbmcpOiBQcm9taXNlPFVwZGF0ZU1ldGEgfCBudWxsPiB7XG4gICAgICByZXR1cm4gcmVhZE1ldGEocmFiYml4RGlyKTtcbiAgICB9LFxuXG4gICAgYXN5bmMgd3JpdGVNZXRhKHJhYmJpeERpcjogc3RyaW5nLCBtZXRhOiBVcGRhdGVNZXRhKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICByZXR1cm4gd3JpdGVNZXRhKHJhYmJpeERpciwgbWV0YSk7XG4gICAgfSxcblxuICAgIGFzeW5jIGNsZWFyTWV0YShyYWJiaXhEaXI6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgcmV0dXJuIGNsZWFyTWV0YShyYWJiaXhEaXIpO1xuICAgIH0sXG5cbiAgICBhc3luYyBkb3dubG9hZEFuZEluc3RhbGwoXG4gICAgICBjb250ZXh0OiBhbnksXG4gICAgICBjdXJyZW50VmVyc2lvbjogc3RyaW5nLFxuICAgICAgcmVtb3RlVmVyc2lvbjogc3RyaW5nLFxuICAgICAgc3BsaXRGaWxlczogc3RyaW5nW10sXG4gICAgICBzcGxpdEZpbGVIYXNoZXM6IHN0cmluZ1tdLFxuICAgICAgYmFzZVVybDogc3RyaW5nLFxuICAgICAgcmFiYml4RGlyOiBzdHJpbmcsXG4gICAgICB0YXJnZXRWZXJzaW9uRGlyOiBzdHJpbmcsXG4gICAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBsb2dnZXIgPSBjb250ZXh0LmxvZ2dlcjtcbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gU3RhcnRpbmcgZG93bmxvYWQgYW5kIGluc3RhbGwgcHJvY2VzcycpO1xuXG4gICAgICBpZiAoc3BsaXRGaWxlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbG9nZ2VyLmVycm9yKCdbdXBkYXRlci5zdG9yZS50c10gTm8gc3BsaXQgZmlsZXMgcHJvdmlkZWQnKTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfTk9fU1BMSVRfRklMRVMnLCB7fSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvd25sb2FkZWRQYXJ0czogVWludDhBcnJheVtdID0gW107XG5cbiAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzcGxpdEZpbGVzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHNwbGl0RmlsZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBleHBlY3RlZEhhc2ggPSBzcGxpdEZpbGVIYXNoZXNbaW5kZXhdO1xuICAgICAgICBjb25zdCBmdWxsVXJsID0gYCR7YmFzZVVybH0ke2ZpbGVQYXRofWA7XG5cbiAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBEb3dubG9hZGluZyBwYXJ0ICR7aW5kZXggKyAxfSBvZiAke3NwbGl0RmlsZXMubGVuZ3RofTpgLCBmaWxlUGF0aCk7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYERvd25sb2FkaW5nIHBhcnQgJHtpbmRleCArIDF9LyR7c3BsaXRGaWxlcy5sZW5ndGh9Li4uYCxcbiAgICAgICAgICBoYXNoVmVyaWZpZWQ6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgbGFzdEVycm9yOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICAgICAgICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IDM7IGF0dGVtcHQrKykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgc3RyZWFtRG93bmxvYWQoZnVsbFVybCwgZXhwZWN0ZWRIYXNoLCBsb2dnZXIpO1xuICAgICAgICAgICAgZG93bmxvYWRlZFBhcnRzLnB1c2goZGF0YSk7XG4gICAgICAgICAgICBsYXN0RXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgbG9nZ2VyLmluZm8oYFt1cGRhdGVyLnN0b3JlLnRzXSBQYXJ0ICR7aW5kZXggKyAxfSBkb3dubG9hZGVkIHN1Y2Nlc3NmdWxseWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIGlmIChtc2cuc3RhcnRzV2l0aCgnSEFTSF9NSVNNQVRDSCcpKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihgW3VwZGF0ZXIuc3RvcmUudHNdIEhhc2ggbWlzbWF0Y2ggb24gcGFydCAke2luZGV4ICsgMX06ICR7bXNnfWApO1xuICAgICAgICAgICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGBIYXNoIG1pc21hdGNoIG9uIHBhcnQgJHtpbmRleCArIDF9YCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbXNnLFxuICAgICAgICAgICAgICAgIGhhc2hWZXJpZmllZDogZmFsc2UsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9IQVNIX01JU01BVENIJywgeyBwYXJ0SW5kZXg6IGluZGV4ICsgMSwgZXJyb3I6IG1zZyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhc3RFcnJvciA9IG1zZztcbiAgICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gRG93bmxvYWQgYXR0ZW1wdCAke2F0dGVtcHQgKyAxfSBmYWlsZWQ6YCwgbGFzdEVycm9yKTtcbiAgICAgICAgICAgIGlmIChhdHRlbXB0IDwgMikge1xuICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGxhc3RFcnJvcikge1xuICAgICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgICBtZXNzYWdlOiBgRG93bmxvYWQgZmFpbGVkOiAke2xhc3RFcnJvcn1gLFxuICAgICAgICAgICAgZXJyb3I6IGxhc3RFcnJvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aHJvdyBjb250ZXh0LnJlamVjdCgnVVBEQVRFUl9ET1dOTE9BRF9GQUlMRUQnLCB7XG4gICAgICAgICAgICBwYXJ0SW5kZXg6IGluZGV4ICsgMSxcbiAgICAgICAgICAgIGVycm9yOiBsYXN0RXJyb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdXBkYXRlU3RhdHVzKHsgaGFzaFZlcmlmaWVkOiB0cnVlLCBtZXNzYWdlOiAnTWVyZ2luZyBmaWxlcy4uLicgfSk7XG5cbiAgICAgIGxldCB0b3RhbExlbmd0aCA9IDA7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvd25sb2FkZWRQYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0b3RhbExlbmd0aCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lcmdlZEFyY2hpdmUgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbmd0aCk7XG4gICAgICBsZXQgbWVyZ2VPZmZzZXQgPSAwO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb3dubG9hZGVkUGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbWVyZ2VkQXJjaGl2ZS5zZXQoZG93bmxvYWRlZFBhcnRzW2ldISwgbWVyZ2VPZmZzZXQpO1xuICAgICAgICBtZXJnZU9mZnNldCArPSBkb3dubG9hZGVkUGFydHNbaV0hLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGVtcERpciA9IGpvaW4ocmFiYml4RGlyLCAnLnRtcF91cGRhdGUnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cbiAgICAgIGF3YWl0IG1rZGlyKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgICBjb25zdCB0ZW1wQXJjaGl2ZVBhdGggPSBqb2luKHRlbXBEaXIsICd1cGRhdGUuN3onKTtcbiAgICAgIGF3YWl0IHdyaXRlRmlsZSh0ZW1wQXJjaGl2ZVBhdGgsIG1lcmdlZEFyY2hpdmUpO1xuXG4gICAgICBsb2dnZXIuaW5mbygnW3VwZGF0ZXIuc3RvcmUudHNdIEV4dHJhY3RpbmcgYXJjaGl2ZS4uLicpO1xuICAgICAgdXBkYXRlU3RhdHVzKHsgbWVzc2FnZTogJ0V4dHJhY3RpbmcuLi4nIH0pO1xuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBlbGVjdHJvblN0YXRlcyA9IGF3YWl0IHVzZUVsZWN0cm9uU3RhdGVzKCk7XG4gICAgICAgIGNvbnN0IHNldmVuWmlwRXhlUGF0aCA9IGVsZWN0cm9uU3RhdGVzLnN0YXRlcy5zZXZlblppcEV4ZVBhdGg7XG5cbiAgICAgICAgZXhlY1N5bmMoYFwiJHtzZXZlblppcEV4ZVBhdGh9XCIgeCBcIiR7dGVtcEFyY2hpdmVQYXRofVwiIC1vXCIke3RlbXBEaXJ9XCIgLXkgLWFvYWAsIHtcbiAgICAgICAgICBzdGRpbzogJ3BpcGUnLFxuICAgICAgICAgIHdpbmRvd3NIaWRlOiB0cnVlLFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICAgIHVwZGF0ZVN0YXR1cyh7XG4gICAgICAgICAgbWVzc2FnZTogYEV4dHJhY3Rpb24gZmFpbGVkOiAke2Vycm9yTXNnfWAsXG4gICAgICAgICAgZXJyb3I6IGVycm9yTXNnLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhyb3cgY29udGV4dC5yZWplY3QoJ1VQREFURVJfRVhUUkFDVElPTl9GQUlMRUQnLCB7IGVycm9yOiBlcnJvck1zZyB9KTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcm0odGVtcEFyY2hpdmVQYXRoLCB7IGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICB9IGNhdGNoIHt9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGFjY2Vzcyh0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgICAgYXdhaXQgcm0odGFyZ2V0VmVyc2lvbkRpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgfSBjYXRjaCB7fVxuXG4gICAgICBjb25zdCBleHRyYWN0ZWRFbnRyaWVzID0gYXdhaXQgcmVhZGRpcih0ZW1wRGlyLCB7IHdpdGhGaWxlVHlwZXM6IHRydWUgfSk7XG4gICAgICBsZXQgc291cmNlRGlyID0gdGVtcERpcjtcblxuICAgICAgaWYgKGV4dHJhY3RlZEVudHJpZXMubGVuZ3RoID09PSAxICYmIGV4dHJhY3RlZEVudHJpZXNbMF0hLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgc291cmNlRGlyID0gam9pbih0ZW1wRGlyLCBleHRyYWN0ZWRFbnRyaWVzWzBdIS5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbG9nZ2VyLmluZm8oJ1t1cGRhdGVyLnN0b3JlLnRzXSBNb3ZpbmcgZXh0cmFjdGVkIGZpbGVzIHRvIHRhcmdldCBkaXJlY3Rvcnk6JywgdGFyZ2V0VmVyc2lvbkRpcik7XG4gICAgICB1cGRhdGVTdGF0dXMoeyBtZXNzYWdlOiAnSW5zdGFsbGluZy4uLicgfSk7XG5cbiAgICAgIGxldCByZW5hbWVPayA9IGZhbHNlO1xuICAgICAgbGV0IGxhc3RFcnJvcjogdW5rbm93bjtcbiAgICAgIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgMzsgYXR0ZW1wdCsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgcmVuYW1lKHNvdXJjZURpciwgdGFyZ2V0VmVyc2lvbkRpcik7XG4gICAgICAgICAgcmVuYW1lT2sgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGxhc3RFcnJvciA9IGVycm9yO1xuICAgICAgICAgIGNvbnN0IGVyckluZm8gPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gYCR7ZXJyb3IubWVzc2FnZX1gIDogSlNPTi5zdHJpbmdpZnkoZXJyb3IpO1xuICAgICAgICAgIGxvZ2dlci5pbmZvKGBbdXBkYXRlci5zdG9yZS50c10gcmVuYW1lIGF0dGVtcHQgJHthdHRlbXB0ICsgMX0gZmFpbGVkOiAke2VyckluZm99YCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IGFjY2Vzcyh0YXJnZXRWZXJzaW9uRGlyKTtcbiAgICAgICAgICAgIC8vIHRhcmdldCDku43lrZjlnKggLT4g6YeN5ZG95ZCN5Li6IC5kZWxfPHRzPiDnu5Xov4fplIHvvIzorqnlkI7nu63muIXnkIZcbiAgICAgICAgICAgIGNvbnN0IGRlbERpciA9IGAke3RhcmdldFZlcnNpb25EaXJ9LmRlbF8ke0RhdGUubm93KCl9YDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IHJlbmFtZSh0YXJnZXRWZXJzaW9uRGlyLCBkZWxEaXIpO1xuICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIHJlbmFtZWQgb2xkIHRhcmdldCB0byAke2RlbERpcn1gKTtcbiAgICAgICAgICAgICAgLy8g5byC5q2l5riF55CG77yM5LiN6Zi75aGeXG4gICAgICAgICAgICAgIHJtKGRlbERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGRlbEVycikge1xuICAgICAgICAgICAgICBsb2dnZXIuaW5mbyhgW3VwZGF0ZXIuc3RvcmUudHNdIHJlbmFtZS10by1kZWwgZmFpbGVkOiAke2RlbEVyciBpbnN0YW5jZW9mIEVycm9yID8gZGVsRXJyLm1lc3NhZ2UgOiBTdHJpbmcoZGVsRXJyKX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgIC8vIHRhcmdldCDkuI3lrZjlnKjvvIzlj6/og73mmK/lhbbku5bljp/lm6BcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgNTAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghcmVuYW1lT2spIHtcbiAgICAgICAgY29uc3QgZXJyb3IgPSBsYXN0RXJyb3IhO1xuICAgICAgICBjb25zdCBlcnJJbmZvID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGAke2Vycm9yLm1lc3NhZ2V9XFxuJHtlcnJvci5zdGFjayA/PyAnJ31gIDogSlNPTi5zdHJpbmdpZnkoZXJyb3IpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdbdXBkYXRlci5zdG9yZS50c10gcmVuYW1lIGZhaWxlZCBhZnRlciByZXRyaWVzOicsIHsgc291cmNlRGlyLCB0YXJnZXRWZXJzaW9uRGlyLCBlcnJvcjogZXJySW5mbyB9KTtcbiAgICAgICAgYXdhaXQgcm0odGVtcERpciwgeyByZWN1cnNpdmU6IHRydWUsIGZvcmNlOiB0cnVlIH0pO1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgdXBkYXRlU3RhdHVzKHtcbiAgICAgICAgICBtZXNzYWdlOiBgSW5zdGFsbGF0aW9uIGZhaWxlZDogJHtlcnJvck1zZ31gLFxuICAgICAgICAgIGVycm9yOiBlcnJvck1zZyxcbiAgICAgICAgfSk7XG4gICAgICAgIHRocm93IGNvbnRleHQucmVqZWN0KCdVUERBVEVSX0lOU1RBTExfRkFJTEVEJywgeyBlcnJvcjogZXJyb3JNc2cgfSk7XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHJtKHRlbXBEaXIsIHsgcmVjdXJzaXZlOiB0cnVlLCBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0gY2F0Y2gge31cblxuICAgICAgY29uc3QgZG93bmxvYWRlZEF0ID0gRGF0ZS5ub3coKTtcbiAgICAgIGF3YWl0IHdyaXRlTWV0YShyYWJiaXhEaXIsIHtcbiAgICAgICAgdmVyc2lvbjogcmVtb3RlVmVyc2lvbixcbiAgICAgICAgZG93bmxvYWRlZEF0LFxuICAgICAgICBpbnN0YWxsUGF0aDogdGFyZ2V0VmVyc2lvbkRpcixcbiAgICAgICAgaGFzaFZlcmlmaWVkOiB0cnVlLFxuICAgICAgfSk7XG5cbiAgICAgIGxvZ2dlci5pbmZvKCdbdXBkYXRlci5zdG9yZS50c10gVXBkYXRlIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHksIHZlcnNpb246JywgcmVtb3RlVmVyc2lvbik7XG4gICAgICB1cGRhdGVTdGF0dXMoe1xuICAgICAgICBtZXNzYWdlOiAnVXBkYXRlIHN1Y2Nlc3NmdWwnLFxuICAgICAgICB1cGRhdGVDb21wbGV0ZWQ6IHRydWUsXG4gICAgICAgIHVwZGF0ZWQ6IHRydWUsXG4gICAgICAgIHdhaXRpbmdGb3JSZXN0YXJ0OiB0cnVlLFxuICAgICAgICBpbnN0YWxsUGF0aDogdGFyZ2V0VmVyc2lvbkRpcixcbiAgICAgICAgaGFzaFZlcmlmaWVkOiB0cnVlLFxuICAgICAgICBkb3dubG9hZGVkQXQsXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgYXN5bmMgY2xlYW51cE9sZFZlcnNpb25zKHJhYmJpeERpcjogc3RyaW5nLCBjdXJyZW50VmVyc2lvbjogc3RyaW5nLCBsYXRlc3RWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdbdXBkYXRlci5zdG9yZS50c10gQ2xlYW5pbmcgdXAgb2xkIHZlcnNpb25zJyk7XG4gICAgICBjb25zdCBjdXJyZW50VmVyc2lvbkRpciA9IGB2JHtjdXJyZW50VmVyc2lvbi5zdGFydHNXaXRoKCd2JykgPyBjdXJyZW50VmVyc2lvbi5zbGljZSgxKSA6IGN1cnJlbnRWZXJzaW9ufWA7XG4gICAgICBjb25zdCBsYXRlc3RWZXJzaW9uRGlyID0gYHYke2xhdGVzdFZlcnNpb24uc3RhcnRzV2l0aCgndicpID8gbGF0ZXN0VmVyc2lvbi5zbGljZSgxKSA6IGxhdGVzdFZlcnNpb259YDtcblxuICAgICAgbGV0IGVudHJpZXM6IHN0cmluZ1tdO1xuICAgICAgdHJ5IHtcbiAgICAgICAgZW50cmllcyA9IGF3YWl0IHJlYWRkaXIocmFiYml4RGlyKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBpZiAoIWVudHJ5LnN0YXJ0c1dpdGgoJ3YnKSkgY29udGludWU7XG4gICAgICAgIGlmIChlbnRyeSA9PT0gY3VycmVudFZlcnNpb25EaXIgfHwgZW50cnkgPT09IGxhdGVzdFZlcnNpb25EaXIpIGNvbnRpbnVlO1xuXG4gICAgICAgIGNvbnN0IG9sZFZlcnNpb25QYXRoID0gam9pbihyYWJiaXhEaXIsIGVudHJ5KTtcbiAgICAgICAgY29uc3QgdGVtcE5hbWUgPSBgLmRlbF8ke3RpbWVzdGFtcH1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCA4KX1gO1xuICAgICAgICBjb25zdCB0ZW1wUGF0aCA9IGpvaW4ocmFiYml4RGlyLCB0ZW1wTmFtZSk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCByZW5hbWUob2xkVmVyc2lvblBhdGgsIHRlbXBQYXRoKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGF3YWl0IHJtKHRlbXBQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSwgZm9yY2U6IHRydWUgfSk7XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICAgIH1cbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxubGV0IGluc3RhbmNlUHJvbWlzZTogUmV0dXJuVHlwZTx0eXBlb2YgY3JlYXRlVXBkYXRlclN0b3JlPiB8IG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlVXBkYXRlclN0b3JlKCkge1xuICBpZiAoIWluc3RhbmNlUHJvbWlzZSkgaW5zdGFuY2VQcm9taXNlID0gY3JlYXRlVXBkYXRlclN0b3JlKCk7XG4gIHJldHVybiBpbnN0YW5jZVByb21pc2U7XG59XG4iLCJpbXBvcnQgdHlwZSAqIGFzIF9lbGVjdHJvbiBmcm9tICdlbGVjdHJvbic7XG5pbXBvcnQgeyBta2RpciwgYWNjZXNzIH0gZnJvbSAnZnMvcHJvbWlzZXMnO1xuaW1wb3J0IHsgam9pbiB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgX19WRVJTSU9OX18gfSBmcm9tICcuLi9fX1ZFUlNJT05fXyc7XG5pbXBvcnQgeyB1c2VFbGVjdHJvblN0YXRlcyB9IGZyb20gJy4vZWxlY3Ryb24tc3RhdGVzJztcbmltcG9ydCB7IGdldFJhYmJpeERpciwgcmVhZFZlcnNpb25DaGVja01ldGEsIGNsZWFyVmVyc2lvbkNoZWNrTWV0YSwgY29tcGFyZVZlcnNpb25zLCB0eXBlIFZlcnNpb25DaGVja01ldGEgfSBmcm9tICcuLi9tb2R1bGVzL3VwZGF0ZXIvJHN0b3Jlcy91cGRhdGVyLnN0b3JlJztcblxubGV0IG1haW5XaW5kb3c6IF9lbGVjdHJvbi5Ccm93c2VyV2luZG93IHwgbnVsbCA9IG51bGw7XG5sZXQgdHJheTogX2VsZWN0cm9uLlRyYXkgfCBudWxsID0gbnVsbDtcblxuY29uc3QgT1VUREFURV9QUk9NUFRfSFRNTCA9ICdvdXRkYXRlLXByb21wdC5odG1sJztcbmNvbnN0IE9VVERBVEVEX01BSk9SX1RIUkVTSE9MRF9NUyA9IDcyICogNjAgKiA2MCAqIDEwMDA7XG5jb25zdCBPVVREQVRFRF9NSU5PUl9USFJFU0hPTERfTVMgPSAxMCAqIDI0ICogNjAgKiA2MCAqIDEwMDA7XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3VsZExvYWRPdXRkYXRlUHJvbXB0KCk6IFByb21pc2U8eyBsb2FkT3V0ZGF0ZTogYm9vbGVhbjsgcmVhc29uOiBzdHJpbmc7IG1ldGE6IFZlcnNpb25DaGVja01ldGEgfCBudWxsIH0+IHtcbiAgY29uc3QgcmFiYml4RGlyID0gZ2V0UmFiYml4RGlyKCk7XG4gIGlmICghcmFiYml4RGlyKSByZXR1cm4geyBsb2FkT3V0ZGF0ZTogZmFsc2UsIHJlYXNvbjogJ25vLXJhYmJpeC1kaXInLCBtZXRhOiBudWxsIH07XG5cbiAgY29uc3QgbWV0YSA9IGF3YWl0IHJlYWRWZXJzaW9uQ2hlY2tNZXRhKHJhYmJpeERpcik7XG4gIGlmICghbWV0YSkgcmV0dXJuIHsgbG9hZE91dGRhdGU6IGZhbHNlLCByZWFzb246ICduby1tZXRhJywgbWV0YTogbnVsbCB9O1xuXG4gIC8vIOW9k+WJjeeJiOacrOW3sue7j+i/veS4iuaIlui2hei/hyBtZXRhIOS4reeahCByZW1vdGVWZXJzaW9uIOKGkiDmuIXnkIbov4fml7YgbWV0YVxuICBjb25zdCBsZXZlbCA9IGNvbXBhcmVWZXJzaW9ucyhfX1ZFUlNJT05fXywgbWV0YS5yZW1vdGVWZXJzaW9uKTtcbiAgaWYgKGxldmVsID09PSBudWxsKSB7XG4gICAgYXdhaXQgY2xlYXJWZXJzaW9uQ2hlY2tNZXRhKHJhYmJpeERpcik7XG4gICAgcmV0dXJuIHsgbG9hZE91dGRhdGU6IGZhbHNlLCByZWFzb246ICd2ZXJzaW9uLWNhdWdodC11cCcsIG1ldGE6IG51bGwgfTtcbiAgfVxuXG4gIGNvbnN0IGFnZU1zID0gRGF0ZS5ub3coKSAtIG1ldGEucHVibGlzaERhdGUgKiAxMDAwO1xuICBpZiAobWV0YS51cGRhdGVMZXZlbCA9PT0gJ21ham9yJyAmJiBhZ2VNcyA+IE9VVERBVEVEX01BSk9SX1RIUkVTSE9MRF9NUykge1xuICAgIHJldHVybiB7IGxvYWRPdXRkYXRlOiB0cnVlLCByZWFzb246IGBtYWpvci1vdXRkYXRlZCBhZ2U9JHtNYXRoLmZsb29yKGFnZU1zIC8gMzYwMDAwMCl9aGAsIG1ldGEgfTtcbiAgfVxuICBpZiAobWV0YS51cGRhdGVMZXZlbCA9PT0gJ21pbm9yJyAmJiBhZ2VNcyA+IE9VVERBVEVEX01JTk9SX1RIUkVTSE9MRF9NUykge1xuICAgIHJldHVybiB7IGxvYWRPdXRkYXRlOiB0cnVlLCByZWFzb246IGBtaW5vci1vdXRkYXRlZCBhZ2U9JHtNYXRoLmZsb29yKGFnZU1zIC8gODY0MDAwMDApfWRgLCBtZXRhIH07XG4gIH1cblxuICByZXR1cm4geyBsb2FkT3V0ZGF0ZTogZmFsc2UsIHJlYXNvbjogJ3dpdGhpbi10aHJlc2hvbGQnLCBtZXRhOiBudWxsIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVFbGVjdHJvbkFwcCgpIHtcbiAgY29uc3QgZ290VGhlTG9jayA9IGVsZWN0cm9uLmFwcC5yZXF1ZXN0U2luZ2xlSW5zdGFuY2VMb2NrKCk7XG4gIGlmICghZ290VGhlTG9jaykge1xuICAgIGVsZWN0cm9uLmFwcC5xdWl0KCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZWxlY3Ryb24uYXBwLm9uKCdzZWNvbmQtaW5zdGFuY2UnLCBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFtYWluV2luZG93IHx8IG1haW5XaW5kb3cuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgYXdhaXQgX19jcmVhdGVXaW5kb3coKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbWFpbldpbmRvdy5zaG93KCk7XG4gICAgaWYgKG1haW5XaW5kb3cuaXNNaW5pbWl6ZWQoKSkgbWFpbldpbmRvdy5yZXN0b3JlKCk7XG4gICAgbWFpbldpbmRvdy5mb2N1cygpO1xuICB9KTtcblxuICBpZiAoKGF3YWl0IGltcG9ydCgnZWxlY3Ryb24tc3F1aXJyZWwtc3RhcnR1cCcpKS5kZWZhdWx0KSB7XG4gICAgZWxlY3Ryb24uYXBwLnF1aXQoKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBlbGVjdHJvbi5hcHAud2hlblJlYWR5KCkudGhlbihhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcbiAgICBhd2FpdCBfX3N5bmNMb2dpbkl0ZW1TZXR0aW5ncygpO1xuICAgIGF3YWl0IF9fY3JlYXRlVHJheSgpO1xuICAgIGF3YWl0IF9fY3JlYXRlV2luZG93KCk7XG5cbiAgICAvLyDlo4HnurjvvJrnm5HlkKzmmL7npLrlmajlj5jljJbvvIzliqjmgIHlop7liKDlo4Hnurjnqpflj6NcbiAgICBjb25zdCB7IGhhbmRsZURpc3BsYXlDaGFuZ2UsIHNldFdhbGxwYXBlciB9ID0gYXdhaXQgaW1wb3J0KCcuL3dhbGxwYXBlci50cycpO1xuICAgIGVsZWN0cm9uLnNjcmVlbi5vbignZGlzcGxheS1hZGRlZCcsICgpID0+IGhhbmRsZURpc3BsYXlDaGFuZ2UoKSk7XG4gICAgZWxlY3Ryb24uc2NyZWVuLm9uKCdkaXNwbGF5LXJlbW92ZWQnLCAoKSA9PiBoYW5kbGVEaXNwbGF5Q2hhbmdlKCkpO1xuICAgIGVsZWN0cm9uLnNjcmVlbi5vbignZGlzcGxheS1tZXRyaWNzLWNoYW5nZWQnLCAoKSA9PiBoYW5kbGVEaXNwbGF5Q2hhbmdlKCkpO1xuXG4gICAgLy8g5ZCv5Yqo5pe26Ieq5Yqo5oGi5aSN5aOB57q454q25oCB77yI5aaC5p6c5LiK5qyh6YCA5Ye65pe25aOB57q45aSE5LqO5ZCv55So54q25oCB77yJXG4gICAgY29uc3QgZWxlY3Ryb25TdGF0ZXMgPSBhd2FpdCB1c2VFbGVjdHJvblN0YXRlcygpO1xuICAgIGlmIChlbGVjdHJvblN0YXRlcy5zdGF0ZXMud2FsbHBhcGVyRW5hYmxlZCkge1xuICAgICAgY29uc29sZS5sb2coJ1tlbGVjdHJvbl0gUmVzdG9yaW5nIHdhbGxwYXBlciBvbiBzdGFydHVwJyk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZXRXYWxscGFwZXIoKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdbZWxlY3Ryb25dIEZhaWxlZCB0byByZXN0b3JlIHdhbGxwYXBlcjonLCBlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbGVjdHJvbi5hcHAub24oJ2FjdGl2YXRlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGVsZWN0cm9uLkJyb3dzZXJXaW5kb3cuZ2V0QWxsV2luZG93cygpLmxlbmd0aCA9PT0gMCkgYXdhaXQgX19jcmVhdGVXaW5kb3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZWxlY3Ryb24uYXBwLm9uKCd3aW5kb3ctYWxsLWNsb3NlZCcsICgpID0+IHtcbiAgICAvLyDkuI3lho3oh6rliqjpgIDlh7rvvIznqpflj6PlhbPpl63lj6rmmK/pmpDol49cbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXZWJ2aWV3T3JpZ2luKCk6IHN0cmluZyB7XG4gIGlmIChlbGVjdHJvbi5hcHAuaXNQYWNrYWdlZCkgcmV0dXJuICdodHRwczovL2FwcC5rZWNyZWFtLmNuLyc7XG4gIGlmIChwcm9jZXNzLmVudi5GT1JDRV9QUk9EX09SSUdJTiA9PT0gJzEnKSByZXR1cm4gJ2h0dHBzOi8vYXBwLmtlY3JlYW0uY24vJztcbiAgcmV0dXJuICdodHRwOi8vbG9jYWxob3N0OjkwMDMvJztcbn1cblxubGV0IHdlYnZpZXdXaW5kb3dSZXNvbHZlcnMgPSBQcm9taXNlLndpdGhSZXNvbHZlcnM8X2VsZWN0cm9uLkJyb3dzZXJXaW5kb3c+KCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRXZWJ2aWV3V2luZG93KCk6IFByb21pc2U8X2VsZWN0cm9uLkJyb3dzZXJXaW5kb3c+IHtcbiAgcmV0dXJuIHdlYnZpZXdXaW5kb3dSZXNvbHZlcnMucHJvbWlzZTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX19jcmVhdGVXaW5kb3coKSB7XG4gIGNvbnN0IGVsZWN0cm9uU3RhdGVzID0gYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcbiAgY29uc3Qgc2F2ZWRTdGF0ZXMgPSBlbGVjdHJvblN0YXRlcy5zdGF0ZXM7XG4gIGNvbnNvbGUubG9nKGBbZWxlY3Ryb25dIExvYWRlZCB3aW5kb3cgc3RhdGUgZnJvbSBzdGF0ZXM6ICR7SlNPTi5zdHJpbmdpZnkoc2F2ZWRTdGF0ZXMpfWApO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgbWtkaXIoc2F2ZWRTdGF0ZXMudXNlckRhdGFQYXRoLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgfSBjYXRjaCB7fVxuXG4gIGNvbnN0IGljb25QYXRoID0gam9pbihzYXZlZFN0YXRlcy5wdWJsaWNQYXRoLCAnZmF2aWNvbi5wbmcnKTtcbiAgbGV0IHdpbmRvd0ljb246IF9lbGVjdHJvbi5OYXRpdmVJbWFnZTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBhY2Nlc3MoaWNvblBhdGgpO1xuICAgIHdpbmRvd0ljb24gPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVGcm9tUGF0aChpY29uUGF0aCk7XG4gIH0gY2F0Y2gge1xuICAgIHdpbmRvd0ljb24gPSBlbGVjdHJvbi5uYXRpdmVJbWFnZS5jcmVhdGVFbXB0eSgpO1xuICB9XG5cbiAgLy8g56qX5Y+j5bC65a+45bey5ZyoIGVsZWN0cm9uLXN0YXRlcy50cyDkuK3moLnmja7lsY/luZXlsLrlr7jorqHnrpflrozmiJBcbiAgY29uc3Qgd2luZG93V2lkdGggPSBzYXZlZFN0YXRlcy53ZWJ2aWV3V2luZG93V2lkdGg7XG4gIGNvbnN0IHdpbmRvd0hlaWdodCA9IHNhdmVkU3RhdGVzLndlYnZpZXdXaW5kb3dIZWlnaHQ7XG4gIGNvbnN0IGlzRnVsbFNjcmVlbk1vZGUgPSBzYXZlZFN0YXRlcy53ZWJ2aWV3V2luZG93SXNNYXhpbWl6ZWQ7XG4gIGNvbnNvbGUubG9nKGBbZWxlY3Ryb25dIFdpbmRvdyBzaXplOiAke3dpbmRvd1dpZHRofXgke3dpbmRvd0hlaWdodH0sIG1heGltaXplZDogJHtpc0Z1bGxTY3JlZW5Nb2RlfWApO1xuXG4gIGlmIChpc0Z1bGxTY3JlZW5Nb2RlKSB7XG4gICAgLy8g5YWo5bGP5qih5byP77ya56qX5Y+j5aGr5ruh5bGP5bmV5bm25pyA5aSn5YyWXG4gICAgY29uc3QgcHJpbWFyeURpc3BsYXkgPSBlbGVjdHJvbi5zY3JlZW4uZ2V0UHJpbWFyeURpc3BsYXkoKTtcbiAgICBjb25zdCB7IHdpZHRoOiBzY3JlZW5XaWR0aCwgaGVpZ2h0OiBzY3JlZW5IZWlnaHQgfSA9IHByaW1hcnlEaXNwbGF5LndvcmtBcmVhU2l6ZTtcbiAgICBtYWluV2luZG93ID0gbmV3IGVsZWN0cm9uLkJyb3dzZXJXaW5kb3coe1xuICAgICAgd2lkdGg6IHNjcmVlbldpZHRoLFxuICAgICAgaGVpZ2h0OiBzY3JlZW5IZWlnaHQsXG4gICAgICBzaG93OiBmYWxzZSxcbiAgICAgIGZyYW1lOiBmYWxzZSxcbiAgICAgIGljb246IHdpbmRvd0ljb24sXG4gICAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgICBkZXZUb29sczogdHJ1ZSxcbiAgICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSxcbiAgICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgICAgc2FuZGJveDogdHJ1ZSxcbiAgICAgICAgLy8gRWxlY3Ryb24g56uv57uV6L+H5rWP6KeI5Zmo6Ieq5Yqo5pKt5pS+562W55Wl77yM5peg6ZyA55So5oi35Lqk5LqS5Y2z5Y+v5pKt5pS+6Z+z6aKRXG4gICAgICAgIGF1dG9wbGF5UG9saWN5OiAnbm8tdXNlci1nZXN0dXJlLXJlcXVpcmVkJyxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgbWFpbldpbmRvdy5tYXhpbWl6ZSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIOaZrumAmueql+WPo+aooeW8j++8muS9v+eUqOiuoeeul+WlveeahOWwuuWvuFxuICAgIG1haW5XaW5kb3cgPSBuZXcgZWxlY3Ryb24uQnJvd3NlcldpbmRvdyh7XG4gICAgICB3aWR0aDogTWF0aC5mbG9vcih3aW5kb3dXaWR0aCksXG4gICAgICBoZWlnaHQ6IE1hdGguZmxvb3Iod2luZG93SGVpZ2h0KSxcbiAgICAgIHg6IHNhdmVkU3RhdGVzLndlYnZpZXdXaW5kb3dYLFxuICAgICAgeTogc2F2ZWRTdGF0ZXMud2Vidmlld1dpbmRvd1ksXG4gICAgICBzaG93OiBmYWxzZSxcbiAgICAgIGZyYW1lOiBmYWxzZSxcbiAgICAgIGljb246IHdpbmRvd0ljb24sXG4gICAgICB3ZWJQcmVmZXJlbmNlczoge1xuICAgICAgICBkZXZUb29sczogdHJ1ZSxcbiAgICAgICAgbm9kZUludGVncmF0aW9uOiBmYWxzZSxcbiAgICAgICAgY29udGV4dElzb2xhdGlvbjogdHJ1ZSxcbiAgICAgICAgc2FuZGJveDogdHJ1ZSxcbiAgICAgICAgLy8gRWxlY3Ryb24g56uv57uV6L+H5rWP6KeI5Zmo6Ieq5Yqo5pKt5pS+562W55Wl77yM5peg6ZyA55So5oi35Lqk5LqS5Y2z5Y+v5pKt5pS+6Z+z6aKRXG4gICAgICAgIGF1dG9wbGF5UG9saWN5OiAnbm8tdXNlci1nZXN0dXJlLXJlcXVpcmVkJyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyDmi6bmiKrkuLvnqpflj6PlhoXnmoTlr7zoiKrvvJrpnZ7lkIzmupDpk77mjqXnlKjns7vnu5/mtY/op4jlmajmiZPlvIBcbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignd2lsbC1uYXZpZ2F0ZScsIChldmVudCwgdXJsKSA9PiB7XG4gICAgaWYgKHVybC5zdGFydHNXaXRoKGdldFdlYnZpZXdPcmlnaW4oKSkpIHJldHVybjtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGVsZWN0cm9uLnNoZWxsLm9wZW5FeHRlcm5hbCh1cmwpO1xuICB9KTtcblxuICAvLyDmi6bmiKrmlrDnqpflj6PmiZPlvIDvvIh3aW5kb3cub3BlbuOAgXRhcmdldD1cIl9ibGFua1wi77yJ77yM55So57O757uf5rWP6KeI5Zmo5omT5byAXG4gIG1haW5XaW5kb3cud2ViQ29udGVudHMuc2V0V2luZG93T3BlbkhhbmRsZXIoKHsgdXJsIH0pID0+IHtcbiAgICBlbGVjdHJvbi5zaGVsbC5vcGVuRXh0ZXJuYWwodXJsKTtcbiAgICByZXR1cm4geyBhY3Rpb246ICdkZW55JyB9O1xuICB9KTtcblxuICBjb25zdCB7IGxvYWRPdXRkYXRlLCByZWFzb24gfSA9IGF3YWl0IHNob3VsZExvYWRPdXRkYXRlUHJvbXB0KCk7XG4gIGlmIChsb2FkT3V0ZGF0ZSkge1xuICAgIGNvbnN0IGh0bWxQYXRoID0gam9pbihzYXZlZFN0YXRlcy5wdWJsaWNQYXRoLCBPVVREQVRFX1BST01QVF9IVE1MKTtcbiAgICBjb25zb2xlLmxvZyhgW2VsZWN0cm9uXSBMb2FkaW5nIG91dGRhdGUtcHJvbXB0IHBhZ2U6ICR7aHRtbFBhdGh9IChyZWFzb246ICR7cmVhc29ufSlgKTtcbiAgICAoZ2xvYmFsVGhpcyBhcyB7IF9fbGFzdExvYWRVUkw/OiBzdHJpbmcgfSkuX19sYXN0TG9hZFVSTCA9IGBmaWxlOi8vJHtodG1sUGF0aH1gO1xuICAgIG1haW5XaW5kb3cubG9hZEZpbGUoaHRtbFBhdGgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHVybCA9IG5ldyBVUkwoZ2V0V2Vidmlld09yaWdpbigpKTtcbiAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnbW9kZScsICdlbGVjdHJvbicpO1xuICAgIHVybC5zZWFyY2hQYXJhbXMuc2V0KCdzaGVsbFZlcnNpb24nLCBfX1ZFUlNJT05fXyk7XG4gICAgdXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2VsZWN0cm9uUG9ydCcsIGVsZWN0cm9uUG9ydC50b1N0cmluZygpKTtcbiAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnZWxlY3Ryb25Ub2tlbicsIGdsb2JhbFRoaXMuZWxlY3Ryb25Ub2tlbik7XG4gICAgY29uc29sZS5sb2coYFtlbGVjdHJvbl0gTG9hZGluZyB3ZWJ2aWV3IFVSTCwgb3V0ZGF0ZSBjaGVjazogJHtyZWFzb259YCk7XG4gICAgKGdsb2JhbFRoaXMgYXMgeyBfX2xhc3RMb2FkVVJMPzogc3RyaW5nIH0pLl9fbGFzdExvYWRVUkwgPSB1cmwudG9TdHJpbmcoKTtcbiAgICBtYWluV2luZG93LmxvYWRVUkwodXJsLnRvU3RyaW5nKCkpO1xuICB9XG5cbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignYmVmb3JlLWlucHV0LWV2ZW50JywgKF9ldmVudCwgaW5wdXQpID0+IHtcbiAgICBpZiAoaW5wdXQua2V5ID09PSAnRjEyJykgbWFpbldpbmRvdyEud2ViQ29udGVudHMudG9nZ2xlRGV2VG9vbHMoKTtcbiAgfSk7XG5cbiAgbWFpbldpbmRvdy53ZWJDb250ZW50cy5vbignZGlkLWZpbmlzaC1sb2FkJywgKCkgPT4ge1xuICAgIG1haW5XaW5kb3chLndlYkNvbnRlbnRzLnNldFpvb21GYWN0b3IoMSk7XG4gICAgbWFpbldpbmRvdyEud2ViQ29udGVudHMuc2V0VmlzdWFsWm9vbUxldmVsTGltaXRzKDEsIDEpO1xuICB9KTtcblxuICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSh0cnVlKSwgNTAwMCk7XG4gICAgbWFpbldpbmRvdyEud2ViQ29udGVudHMub24oJ2RpZC1maW5pc2gtbG9hZCcsICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKHRydWUpLCA1MDApO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoIWVsZWN0cm9uU3RhdGVzLnN0YXRlcy5ydW5JbkJhY2tncm91bmQpIHtcbiAgICBtYWluV2luZG93LnNob3coKTtcbiAgfVxuXG4gIGNvbnN0IHNhdmVXaW5kb3dTdGF0ZSA9ICgpID0+IHtcbiAgICBpZiAoIW1haW5XaW5kb3cpIHJldHVybjtcbiAgICBpZiAobWFpbldpbmRvdy5pc01heGltaXplZCgpKSB7XG4gICAgICBjb25zdCBib3VuZHMgPSBtYWluV2luZG93LmdldE5vcm1hbEJvdW5kcygpO1xuICAgICAgZWxlY3Ryb25TdGF0ZXMuc2V0KHtcbiAgICAgICAgd2Vidmlld1dpbmRvd0lzTWF4aW1pemVkOiB0cnVlLFxuICAgICAgICB3ZWJ2aWV3V2luZG93V2lkdGg6IGJvdW5kcy53aWR0aCxcbiAgICAgICAgd2Vidmlld1dpbmRvd0hlaWdodDogYm91bmRzLmhlaWdodCxcbiAgICAgICAgd2Vidmlld1dpbmRvd1g6IGJvdW5kcy54LFxuICAgICAgICB3ZWJ2aWV3V2luZG93WTogYm91bmRzLnksXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgYm91bmRzID0gbWFpbldpbmRvdy5nZXRCb3VuZHMoKTtcbiAgICAgIGVsZWN0cm9uU3RhdGVzLnNldCh7XG4gICAgICAgIHdlYnZpZXdXaW5kb3dJc01heGltaXplZDogZmFsc2UsXG4gICAgICAgIHdlYnZpZXdXaW5kb3dXaWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICB3ZWJ2aWV3V2luZG93SGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuICAgICAgICB3ZWJ2aWV3V2luZG93WDogYm91bmRzLngsXG4gICAgICAgIHdlYnZpZXdXaW5kb3dZOiBib3VuZHMueSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBtYWluV2luZG93Lm9uKCdyZXNpemUnLCAoKSA9PiB7XG4gICAgaWYgKG1haW5XaW5kb3cgJiYgIW1haW5XaW5kb3cuaXNNYXhpbWl6ZWQoKSAmJiAhaXNGdWxsU2NyZWVuTW9kZSkge1xuICAgICAgc2F2ZVdpbmRvd1N0YXRlKCk7XG4gICAgfVxuICB9KTtcblxuICBtYWluV2luZG93Lm9uKCdtb3ZlJywgKCkgPT4ge1xuICAgIGlmIChtYWluV2luZG93ICYmICFtYWluV2luZG93LmlzTWF4aW1pemVkKCkgJiYgIWlzRnVsbFNjcmVlbk1vZGUpIHtcbiAgICAgIHNhdmVXaW5kb3dTdGF0ZSgpO1xuICAgIH1cbiAgfSk7XG5cbiAgbWFpbldpbmRvdy5vbignbWF4aW1pemUnLCAoKSA9PiB7XG4gICAgaWYgKCFpc0Z1bGxTY3JlZW5Nb2RlKSB7XG4gICAgICBzYXZlV2luZG93U3RhdGUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1haW5XaW5kb3cub24oJ3VubWF4aW1pemUnLCAoKSA9PiB7XG4gICAgaWYgKCFpc0Z1bGxTY3JlZW5Nb2RlKSB7XG4gICAgICBzYXZlV2luZG93U3RhdGUoKTtcbiAgICB9XG4gIH0pO1xuXG4gIG1haW5XaW5kb3cub24oJ2Nsb3NlJywgKGV2ZW50KSA9PiB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBtYWluV2luZG93IS5oaWRlKCk7XG4gIH0pO1xuXG4gIHdlYnZpZXdXaW5kb3dSZXNvbHZlcnMucmVzb2x2ZShtYWluV2luZG93KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX19jcmVhdGVUcmF5KCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBpMThuOiBSZWNvcmQ8c3RyaW5nLCB7IHNob3dXaW5kb3c6IHN0cmluZzsgcXVpdDogc3RyaW5nIH0+ID0ge1xuICAgICd6aC1jbic6IHsgc2hvd1dpbmRvdzogJ+aJk+W8gCcsIHF1aXQ6ICfpgIDlh7onIH0sXG4gICAgJ3poLXNnJzogeyBzaG93V2luZG93OiAn5omT5byAJywgcXVpdDogJ+mAgOWHuicgfSxcbiAgICAnemgtdHcnOiB7IHNob3dXaW5kb3c6ICfpoa/npLonLCBxdWl0OiAn6YCA5Ye6JyB9LFxuICAgICd6aC1oayc6IHsgc2hvd1dpbmRvdzogJ+mhr+ekuicsIHF1aXQ6ICfpgIDlh7onIH0sXG4gICAgamE6IHsgc2hvd1dpbmRvdzogJ+ihqOekuicsIHF1aXQ6ICfntYLkuoYnIH0sXG4gICAga286IHsgc2hvd1dpbmRvdzogJ+ywvSDtkZzsi5wnLCBxdWl0OiAn7KKF66OMJyB9LFxuICB9O1xuXG4gIGNvbnN0IGxvY2FsZSA9IGVsZWN0cm9uLmFwcC5nZXRMb2NhbGUoKS50b0xvd2VyQ2FzZSgpO1xuICBjb25zdCB0ID0gaTE4bltsb2NhbGVdIHx8IHsgc2hvd1dpbmRvdzogJ1Nob3cgV2luZG93JywgcXVpdDogJ1F1aXQnIH07XG4gIGNvbnNvbGUubG9nKGBbZWxlY3Ryb25dIFN5c3RlbSBsb2NhbGU6ICR7bG9jYWxlfSwgdXNpbmcgdHJhbnNsYXRpb25zOiAke0pTT04uc3RyaW5naWZ5KHQpfWApO1xuXG4gIGNvbnN0IGVsZWN0cm9uU3RhdGVzID0gYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcbiAgY29uc3QgaWNvblBhdGggPSBqb2luKGVsZWN0cm9uU3RhdGVzLnN0YXRlcy5wdWJsaWNQYXRoLCAndHJheS5wbmcnKTtcbiAgY29uc3QgaWNvbkJXUGF0aCA9IGpvaW4oZWxlY3Ryb25TdGF0ZXMuc3RhdGVzLnB1YmxpY1BhdGgsICd0cmF5LWJ3LnBuZycpO1xuICBsZXQgdHJheUljb246IF9lbGVjdHJvbi5OYXRpdmVJbWFnZTtcbiAgdHJ5IHtcbiAgICAvLyDlnKggbWFjT1Mg5LiK77yM6ZyA6KaB5bCG5omY55uY5Zu+5qCH57yp5pS+5Yiw5ZCI6YCC55qE5bC65a+4XG4gICAgLy8gbWFjT1Mg6I+c5Y2V5qCP5omY55uY5Zu+5qCH55qE5qCH5YeG5bC65a+45pivIDE4eDE4IOWDj+e0oO+8iEAxeO+8ieaIliAzNngzNiDlg4/ntKDvvIhAMngg55So5LqOIFJldGluYSDlsY/luZXvvIlcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2RhcndpbicpIHtcbiAgICAgIGF3YWl0IGFjY2VzcyhpY29uQldQYXRoKTtcbiAgICAgIHRyYXlJY29uID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRnJvbVBhdGgoaWNvbkJXUGF0aCk7XG4gICAgICBjb25zdCBpc1JldGluYSA9IGVsZWN0cm9uLnNjcmVlbi5nZXRQcmltYXJ5RGlzcGxheSgpLnNjYWxlRmFjdG9yID49IDI7XG4gICAgICBjb25zdCB0YXJnZXRTaXplID0gaXNSZXRpbmEgPyAzNiA6IDE4O1xuICAgICAgY29uc29sZS5sb2coYFtlbGVjdHJvbl0gbWFjT1MgZGV0ZWN0ZWQsIHJlc2l6aW5nIHRyYXkgaWNvbiB0byAke3RhcmdldFNpemV9eCR7dGFyZ2V0U2l6ZX0gKFJldGluYTogJHtpc1JldGluYX0pYCk7XG4gICAgICB0cmF5SWNvbiA9IHRyYXlJY29uLnJlc2l6ZSh7IHdpZHRoOiB0YXJnZXRTaXplLCBoZWlnaHQ6IHRhcmdldFNpemUgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IGFjY2VzcyhpY29uUGF0aCk7XG4gICAgICB0cmF5SWNvbiA9IGVsZWN0cm9uLm5hdGl2ZUltYWdlLmNyZWF0ZUZyb21QYXRoKGljb25QYXRoKTtcbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIHRyYXlJY29uID0gZWxlY3Ryb24ubmF0aXZlSW1hZ2UuY3JlYXRlRW1wdHkoKTtcbiAgfVxuICB0cmF5ID0gbmV3IGVsZWN0cm9uLlRyYXkodHJheUljb24pO1xuICBjb25zdCBjb250ZXh0TWVudSA9IGVsZWN0cm9uLk1lbnUuYnVpbGRGcm9tVGVtcGxhdGUoW1xuICAgIHtcbiAgICAgIGxhYmVsOiB0LnNob3dXaW5kb3csXG4gICAgICBjbGljazogYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoIW1haW5XaW5kb3cgfHwgbWFpbldpbmRvdy5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgICAgYXdhaXQgX19jcmVhdGVXaW5kb3coKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbWFpbldpbmRvdy5zaG93KCk7XG4gICAgICAgIGlmIChtYWluV2luZG93LmlzTWluaW1pemVkKCkpIG1haW5XaW5kb3cucmVzdG9yZSgpO1xuICAgICAgICBtYWluV2luZG93LmZvY3VzKCk7XG4gICAgICB9LFxuICAgIH0sXG4gICAgeyB0eXBlOiAnc2VwYXJhdG9yJyB9LFxuICAgIHtcbiAgICAgIGxhYmVsOiB0LnF1aXQsXG4gICAgICBjbGljazogKCkgPT4ge1xuICAgICAgICBlbGVjdHJvbi5hcHAuZXhpdCgwKTtcbiAgICAgIH0sXG4gICAgfSxcbiAgXSk7XG4gIHRyYXkuc2V0VG9vbFRpcCgnS2VjcmVhbScpO1xuICB0cmF5LnNldENvbnRleHRNZW51KGNvbnRleHRNZW51KTtcbiAgdHJheS5vbignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgaWYgKCFtYWluV2luZG93IHx8IG1haW5XaW5kb3cuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgYXdhaXQgX19jcmVhdGVXaW5kb3coKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbWFpbldpbmRvdy5zaG93KCk7XG4gICAgaWYgKG1haW5XaW5kb3cuaXNNaW5pbWl6ZWQoKSkgbWFpbldpbmRvdy5yZXN0b3JlKCk7XG4gICAgbWFpbldpbmRvdy5mb2N1cygpO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX19zeW5jTG9naW5JdGVtU2V0dGluZ3MoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGVsZWN0cm9uU3RhdGVzID0gYXdhaXQgdXNlRWxlY3Ryb25TdGF0ZXMoKTtcbiAgY29uc3QgeyBsYXVuY2hBdFN0YXJ0dXAsIHJ1bkluQmFja2dyb3VuZCB9ID0gZWxlY3Ryb25TdGF0ZXMuc3RhdGVzO1xuXG4gIGVsZWN0cm9uLmFwcC5zZXRMb2dpbkl0ZW1TZXR0aW5ncyh7XG4gICAgb3BlbkF0TG9naW46IGxhdW5jaEF0U3RhcnR1cCxcbiAgICBvcGVuQXNIaWRkZW46IGxhdW5jaEF0U3RhcnR1cCAmJiBydW5JbkJhY2tncm91bmQsXG4gIH0pO1xufVxuIiwiLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL3BhcnQudHNcbmZ1bmN0aW9uIHBhcnQoaGFuZGxlcikge1xuICByZXR1cm4gaGFuZGxlcigpO1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3R5cGUtc2FmZXR5L2luZGV4LnRzXG5mdW5jdGlvbiB0eXBlU2FmZXR5KHZhbHVlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogKCkgPT4gKHsgJG1pbGtpb1R5cGU6IFwidHlwZS1zYWZldHlcIiwgdmFsdWUgfSlcbiAgfTtcbn1cbi8vIHBhY2thZ2VzL21pbGtpby9jb25maWcvaW5kZXgudHNcbmZ1bmN0aW9uIGNvbmZpZyhjb25maWcyKSB7XG4gIHJldHVybiBjb25maWcyO1xufVxuZnVuY3Rpb24gZW52VG9TdHJpbmcodmFsdWUsIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICByZXR1cm4gYCR7dmFsdWV9YDtcbn1cbmZ1bmN0aW9uIGVudlRvTnVtYmVyKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgcmV0dXJuIE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xufVxuZnVuY3Rpb24gZW52VG9Cb29sZWFuKHZhbHVlLCBkZWZhdWx0VmFsdWUpIHtcbiAgaWYgKHZhbHVlID09PSBcInRydWVcIilcbiAgICByZXR1cm4gdHJ1ZTtcbiAgaWYgKHZhbHVlID09PSBcImZhbHNlXCIpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAodmFsdWUgPT09IFwiXCIpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICByZXR1cm4gQm9vbGVhbih2YWx1ZSk7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvaGVhZGVycy10by1qc29uLnRzXG5mdW5jdGlvbiBoZWFkZXJzVG9KU09OKGhlYWRlcnMpIHtcbiAgY29uc3QganNvbiA9IHt9O1xuICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBoZWFkZXJzLmVudHJpZXMoKSkge1xuICAgIGpzb25ba2V5XSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBqc29uO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvbWVyZ2UtZGVlcC50c1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsICYmICFBcnJheS5pc0FycmF5KHZhbHVlKTtcbn1cbmZ1bmN0aW9uIG1lcmdlRGVlcCh0YXJnZXQsIHNvdXJjZSkge1xuICBjb25zdCBtZXJnZWQgPSB7IC4uLnRhcmdldCB9O1xuICBmb3IgKGNvbnN0IGtleSBpbiBzb3VyY2UpIHtcbiAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpXG4gICAgICBjb250aW51ZTtcbiAgICBjb25zdCBzb3VyY2VWYWx1ZSA9IHNvdXJjZVtrZXldO1xuICAgIGNvbnN0IHRhcmdldFZhbHVlID0gdGFyZ2V0W2tleV07XG4gICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh0YXJnZXQsIGtleSkpIHtcbiAgICAgIGlmIChpc1BsYWluT2JqZWN0KHRhcmdldFZhbHVlKSAmJiBpc1BsYWluT2JqZWN0KHNvdXJjZVZhbHVlKSkge1xuICAgICAgICBtZXJnZWRba2V5XSA9IG1lcmdlRGVlcCh0YXJnZXRWYWx1ZSwgc291cmNlVmFsdWUpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBtZXJnZWRba2V5XSA9IHNvdXJjZVZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbWVyZ2VkO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvcmV2aXZlLWpzb24tcGFyc2UudHNcbnZhciBpc29EYXRlUGF0dGVybiA9IC9eKFxcZHs0fS1cXGR7Mn0tXFxkezJ9VFxcZHsyfTpcXGR7Mn06XFxkezJ9KD86XFwuXFxkezEsM30pPykoWnxbKy1dXFxkezJ9Oj9cXGR7Mn0pPyQvO1xuZnVuY3Rpb24gdHJ5UGFyc2VEYXRlKHN0cikge1xuICBjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuICBpZiAobGVuID49IDIwICYmIGxlbiA8PSAzMiAmJiBzdHIuY2hhckNvZGVBdCgwKSA+PSA0OCAmJiBzdHIuY2hhckNvZGVBdCgwKSA8PSA1NyAmJiBzdHIuaW5kZXhPZihcIlRcIikgIT09IC0xKSB7XG4gICAgY29uc3QgbWF0Y2ggPSBpc29EYXRlUGF0dGVybi5leGVjKHN0cik7XG4gICAgaWYgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBkYXRlUGFydCA9IG1hdGNoWzFdO1xuICAgICAgY29uc3QgdHpQYXJ0ID0gbWF0Y2hbMl07XG4gICAgICBpZiAoZGF0ZVBhcnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICBpZiAodHpQYXJ0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFR6ID0gdHpQYXJ0Lmxlbmd0aCA9PT0gNSAmJiB0elBhcnQuY2hhckF0KDMpICE9PSBcIjpcIiA/IGAke3R6UGFydC5zbGljZSgwLCAzKX06JHt0elBhcnQuc2xpY2UoMyl9YCA6IHR6UGFydDtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVQYXJ0ICsgbm9ybWFsaXplZFR6KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgRGF0ZShkYXRlUGFydCArIFwiWlwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiByZXZpdmVKU09OUGFyc2UoanNvbikge1xuICBpZiAoanNvbiA9PT0gbnVsbCB8fCBqc29uID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGpzb247XG4gIGlmICh0eXBlb2YganNvbiA9PT0gXCJvYmplY3RcIikge1xuICAgIGlmIChqc29uIGluc3RhbmNlb2YgRGF0ZSlcbiAgICAgIHJldHVybiBqc29uO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICBjb25zdCBsZW4gPSBqc29uLmxlbmd0aDtcbiAgICAgIGZvciAobGV0IGkgPSAwO2kgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCB2ID0ganNvbltpXTtcbiAgICAgICAgaWYgKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgY29uc3QgZCA9IHRyeVBhcnNlRGF0ZSh2KTtcbiAgICAgICAgICBpZiAoZCAhPT0gbnVsbClcbiAgICAgICAgICAgIGpzb25baV0gPSBkO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSBcIm9iamVjdFwiICYmIHYgIT09IG51bGwpIHtcbiAgICAgICAgICByZXZpdmVKU09OUGFyc2Uodik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBqc29uO1xuICAgIH1cbiAgICBjb25zdCBvYmogPSBqc29uO1xuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIGNvbnN0IHYgPSBvYmpba2V5XTtcbiAgICAgIGlmICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICBjb25zdCBkID0gdHJ5UGFyc2VEYXRlKHYpO1xuICAgICAgICBpZiAoZCAhPT0gbnVsbClcbiAgICAgICAgICBvYmpba2V5XSA9IGQ7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2ID09PSBcIm9iamVjdFwiICYmIHYgIT09IG51bGwpIHtcbiAgICAgICAgcmV2aXZlSlNPTlBhcnNlKHYpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBpZiAodHlwZW9mIGpzb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBkID0gdHJ5UGFyc2VEYXRlKGpzb24pO1xuICAgIGlmIChkICE9PSBudWxsKVxuICAgICAgcmV0dXJuIGQ7XG4gIH1cbiAgcmV0dXJuIGpzb247XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby9leGVjdXRlL2luZGV4LnRzXG5mdW5jdGlvbiBfX2luaXRFeGVjdXRlcihnZW5lcmF0ZWQsIHJ1bnRpbWUpIHtcbiAgY29uc3QgX19leGVjdXRlID0gYXN5bmMgKHJvdXRlU2NoZW1hLCBvcHRpb25zKSA9PiB7XG4gICAgY29uc3QgdHlwZSA9IG9wdGlvbnMucGF0aC5lbmRzV2l0aChcIn5cIikgPyBcInN0cmVhbVwiIDogXCJhY3Rpb25cIjtcbiAgICBjb25zdCBleGVjdXRlSWQgPSBvcHRpb25zLmNyZWF0ZWRFeGVjdXRlSWQ7XG4gICAgbGV0IGhlYWRlcnM7XG4gICAgaWYgKCEob3B0aW9ucy5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykpIHtcbiAgICAgIGlmICh0eXBlb2Ygb3B0aW9ucy5oZWFkZXJzPy5nZXQgPT09IFwiZnVuY3Rpb25cIiAmJiAhKG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpKSB7XG4gICAgICAgIGhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWFkZXJzID0gbmV3IEhlYWRlcnMoe1xuICAgICAgICAgIC4uLm9wdGlvbnMuaGVhZGVyc1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCEoXCJ0b0pTT05cIiBpbiBoZWFkZXJzKSlcbiAgICAgICAgICBoZWFkZXJzLnRvSlNPTiA9ICgpID0+IGhlYWRlcnNUb0pTT04oaGVhZGVycyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnM7XG4gICAgICBpZiAoIShcInRvSlNPTlwiIGluIGhlYWRlcnMpKVxuICAgICAgICBoZWFkZXJzLnRvSlNPTiA9ICgpID0+IGhlYWRlcnNUb0pTT04oaGVhZGVycyk7XG4gICAgfVxuICAgIGNvbnN0IGZpbmFsZXMgPSBbXTtcbiAgICBjb25zdCBvbkZpbmFsbHkgPSAoaGFuZGxlcikgPT4gZmluYWxlcy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgIGxldCBwYXJhbXM7XG4gICAgaWYgKG9wdGlvbnMucGFyYW1zVHlwZSA9PT0gXCJyYXdcIikge1xuICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbXM7XG4gICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgcGFyYW1zID0ge307XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghb3B0aW9ucy5wYXJhbXMgfHwgb3B0aW9ucy5wYXJhbXMgPT09IFwiXCIgfHwgb3B0aW9ucy5wYXJhbXMgPT09IFwie31cIikge1xuICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH0gZWxzZSBpZiAoaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi9qc29uXCIpKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcGFyYW1zID0gcmV2aXZlSlNPTlBhcnNlKEpTT04ucGFyc2Uob3B0aW9ucy5wYXJhbXMpKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICB0aHJvdyByZWplY3QoXCJQQVJBTVNfVFlQRV9OT1RfU1VQUE9SVEVEXCIsIHsgZXhwZWN0ZWQ6IFwianNvblwiLCBjb250ZW50VHlwZTogaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikgPz8gbnVsbCwgcGFyYW1zOiBvcHRpb25zLnBhcmFtcy5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gXCJ1bmRlZmluZWRcIilcbiAgICAgICAgICBwYXJhbXMgPSB7fTtcbiAgICAgIH0gZWxzZSBpZiAoaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIik/LnN0YXJ0c1dpdGgoXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIikpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBVUkxTZWFyY2hQYXJhbXMob3B0aW9ucy5wYXJhbXMpO1xuICAgICAgICAgIHBhcmFtcyA9IHt9O1xuICAgICAgICAgIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHBhcmFtc1trZXldID0gdmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRocm93IHJlamVjdChcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgeyBleHBlY3RlZDogXCJmb3JtLXVybGVuY29kZWRcIiwgY29udGVudFR5cGU6IGhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpID8/IG51bGwsIHBhcmFtczogb3B0aW9ucy5wYXJhbXMuc2xpY2UoMCwgNDA5NikgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAob3B0aW9ucy5wYXJhbXMuc3RhcnRzV2l0aChcIntcIikpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBwYXJhbXMgPSByZXZpdmVKU09OUGFyc2UoSlNPTi5wYXJzZShvcHRpb25zLnBhcmFtcykpO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIHRocm93IHJlamVjdChcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgeyBleHBlY3RlZDogXCJqc29uXCIsIGNvbnRlbnRUeXBlOiBoZWFkZXJzLmdldChcImNvbnRlbnQtdHlwZVwiKSA/PyBudWxsLCBwYXJhbXM6IG9wdGlvbnMucGFyYW1zLnNsaWNlKDAsIDQwOTYpIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyByZWplY3QoXCJQQVJBTVNfVFlQRV9OT1RfU1VQUE9SVEVEXCIsIHsgZXhwZWN0ZWQ6IFwianNvblwiLCBjb250ZW50VHlwZTogaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikgPz8gbnVsbCwgcGFyYW1zOiBvcHRpb25zLnBhcmFtcy5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwYXJhbXMgIT09IFwib2JqZWN0XCIgfHwgQXJyYXkuaXNBcnJheShwYXJhbXMpKVxuICAgICAgdGhyb3cgcmVqZWN0KFwiUEFSQU1TX1RZUEVfTk9UX1NVUFBPUlRFRFwiLCB7IGV4cGVjdGVkOiBcImpzb25cIiwgY29udGVudFR5cGU6IGhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpID8/IG51bGwsIHBhcmFtczogKHR5cGVvZiBvcHRpb25zLnBhcmFtcyA9PT0gXCJzdHJpbmdcIiA/IG9wdGlvbnMucGFyYW1zIDogSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5wYXJhbXMpKS5zbGljZSgwLCA0MDk2KSB9KTtcbiAgICBpZiAoXCIkbWlsa2lvR2VuZXJhdGVQYXJhbXNcIiBpbiBwYXJhbXMgJiYgcGFyYW1zLiRtaWxraW9HZW5lcmF0ZVBhcmFtcyA9PT0gXCJlbmFibGVcIikge1xuICAgICAgaWYgKCFydW50aW1lLmRldmVsb3ApXG4gICAgICAgIHRocm93IHJlamVjdChcIk5PVF9ERVZFTE9QX01PREVcIiwgXCJUaGlzIGZlYXR1cmUgbXVzdCBiZSBpbiBjb29rYm9vayB0byB1c2UuXCIpO1xuICAgICAgZGVsZXRlIHBhcmFtcy4kbWlsa2lvR2VuZXJhdGVQYXJhbXM7XG4gICAgICBsZXQgcGFyYW1zUmFuZCA9IHJvdXRlU2NoZW1hLnJhbmRvbVBhcmFtcygpO1xuICAgICAgaWYgKHBhcmFtc1JhbmQgPT09IHVuZGVmaW5lZCB8fCBwYXJhbXNSYW5kID09PSBudWxsKVxuICAgICAgICBwYXJhbXNSYW5kID0ge307XG4gICAgICBwYXJhbXMgPSBtZXJnZURlZXAocGFyYW1zLCBwYXJhbXNSYW5kKTtcbiAgICAgIG9wdGlvbnMuY3JlYXRlZExvZ2dlci5kZWJ1ZyhcIuKcqCB0aGUgZ2VuZXJhdGVkIHBhcmFtczpcIiwgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgfVxuICAgIGlmICghb3B0aW9ucy5jb250ZXh0Py5odHRwPy5ub3RGb3VuZCAmJiBvcHRpb25zLmNvbnRleHQ/Lmh0dHA/LnBhcmFtcz8uc3RyaW5nKVxuICAgICAgb3B0aW9ucy5jb250ZXh0Lmh0dHAucGFyYW1zLnBhcnNlZCA9IHBhcmFtcztcbiAgICBpZiAoIW9wdGlvbnMuY29udGV4dClcbiAgICAgIG9wdGlvbnMuY29udGV4dCA9IHt9O1xuICAgIGNvbnN0IGN0eCA9IG9wdGlvbnMuY29udGV4dDtcbiAgICBjdHguZGV2ZWxvcCA9IHJ1bnRpbWUuZGV2ZWxvcDtcbiAgICBjdHgucGF0aCA9IG9wdGlvbnMucGF0aDtcbiAgICBjdHgucm91dGVUeXBlID0gdHlwZTtcbiAgICBjdHgubG9nZ2VyID0gb3B0aW9ucy5jcmVhdGVkTG9nZ2VyO1xuICAgIGN0eC5lbWl0ID0gcnVudGltZS5lbWl0O1xuICAgIGN0eC5lbWl0QW55QXBwcm92ZWQgPSBydW50aW1lLmVtaXRBbnlBcHByb3ZlZDtcbiAgICBjdHguZW1pdEFsbEFwcHJvdmVkID0gcnVudGltZS5lbWl0QWxsQXBwcm92ZWQ7XG4gICAgY3R4LmV4ZWN1dGVJZCA9IG9wdGlvbnMuY3JlYXRlZEV4ZWN1dGVJZDtcbiAgICBjdHguY29uZmlnID0gcnVudGltZS5ydW50aW1lLmNvbmZpZztcbiAgICBjdHgudHlwaWEgPSBnZW5lcmF0ZWQudHlwaWFTY2hlbWE7XG4gICAgY3R4LmNhbGwgPSAobW9kdWxlMiwgcGFyYW1zMikgPT4gX19jYWxsKGN0eCwgbW9kdWxlMiwgcGFyYW1zMik7XG4gICAgY3R4Lm9uRmluYWxseSA9IG9uRmluYWxseTtcbiAgICBjdHguXyA9IHJ1bnRpbWU7XG4gICAgY3R4LnJlamVjdCA9IHJlamVjdDtcbiAgICBjdHgucmFpc2UgPSByYWlzZTtcbiAgICBjb25zdCByZXN1bHRzID0geyB2YWx1ZTogdW5kZWZpbmVkIH07XG4gICAgY29uc3QgbW9kdWxlID0gcm91dGVTY2hlbWEubW9kdWxlO1xuICAgIGNvbnN0IG1ldGEgPSBtb2R1bGU/Lm1ldGEgPyBtb2R1bGU/Lm1ldGEgOiB7fTtcbiAgICBpZiAob3B0aW9ucy5jb250ZXh0Lmh0dHA/LnJlcXVlc3Q/Lm1ldGhvZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBhbGxvd01ldGhvZHMgPSBtZXRhPy5tZXRob2RzID8/IFtcIlBPU1RcIl07XG4gICAgICBpZiAoIWFsbG93TWV0aG9kcy5pbmNsdWRlcyhvcHRpb25zLmNvbnRleHQuaHR0cC5yZXF1ZXN0Lm1ldGhvZCkpXG4gICAgICAgIHRocm93IHJlamVjdChcIk1FVEhPRF9OT1RfQUxMT1dFRFwiLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgICBpZiAobWV0YT8udHlwZVNhZmV0eSA9PT0gdW5kZWZpbmVkIHx8IG1ldGEudHlwZVNhZmV0eSA9PT0gdHJ1ZSB8fCBBcnJheS5pc0FycmF5KG1ldGEudHlwZVNhZmV0eSkgJiYgbWV0YS50eXBlU2FmZXR5LmluY2x1ZGVzKFwicGFyYW1zXCIpKSB7XG4gICAgICBjb25zdCB2YWxpZGF0aW9uID0gcm91dGVTY2hlbWEudmFsaWRhdGVQYXJhbXMocGFyYW1zKTtcbiAgICAgIGlmICghdmFsaWRhdGlvbi5zdWNjZXNzKVxuICAgICAgICB0aHJvdyByZWplY3QoXCJQQVJBTVNfVFlQRV9JTkNPUlJFQ1RcIiwgeyAuLi52YWxpZGF0aW9uLmVycm9yc1swXSwgbWVzc2FnZTogYFRoZSB2YWx1ZSAnJHt2YWxpZGF0aW9uLmVycm9yc1swXS5wYXRofScgaXMgJyR7dmFsaWRhdGlvbi5lcnJvcnNbMF0udmFsdWV9Jywgd2hpY2ggZG9lcyBub3QgbWVldCAnJHt2YWxpZGF0aW9uLmVycm9yc1swXS5leHBlY3RlZH0nIHJlcXVpcmVtZW50cy5gIH0pO1xuICAgIH1cbiAgICBpZiAocnVudGltZS5faGFzRW1pdEhhbmRsZXJzPy4oXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiKSA/PyB0cnVlKSB7XG4gICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiLCB7IGV4ZWN1dGVJZDogb3B0aW9ucy5jcmVhdGVkRXhlY3V0ZUlkLCBsb2dnZXI6IG9wdGlvbnMuY3JlYXRlZExvZ2dlciwgcGF0aDogb3B0aW9ucy5wYXRoLCBtZXRhLCBjb250ZXh0OiBvcHRpb25zLmNvbnRleHQsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgfVxuICAgIHJlc3VsdHMudmFsdWUgPSBhd2FpdCBtb2R1bGUuaGFuZGxlcihvcHRpb25zLmNvbnRleHQsIHBhcmFtcyk7XG4gICAgbGV0IGVtcHR5UmVzdWx0ID0gZmFsc2U7XG4gICAgaWYgKHJlc3VsdHMudmFsdWUgPT09IHVuZGVmaW5lZCB8fCByZXN1bHRzLnZhbHVlID09PSBudWxsIHx8IHJlc3VsdHMudmFsdWUgPT09IFwiXCIpIHtcbiAgICAgIGVtcHR5UmVzdWx0ID0gdHJ1ZTtcbiAgICAgIHJlc3VsdHMudmFsdWUgPSB7fTtcbiAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocmVzdWx0cy52YWx1ZSkgfHwgdHlwZW9mIHJlc3VsdHMudmFsdWUgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgIHRocm93IHJlamVjdChcIlJFUVVFU1RfRkFJTFwiLCBcIlRoZSByZXR1cm4gdHlwZSBvZiB0aGUgaGFuZGxlciBtdXN0IGJlIGFuICdvYmplY3QnLCB3aGljaCBpcyBjdXJyZW50bHkgYW4gJyR7dHlwZW9mIHR5cGVvZiByZXN1bHRzLnZhbHVlfScuXCIpO1xuICAgIH1cbiAgICBpZiAocnVudGltZS5faGFzRW1pdEhhbmRsZXJzPy4oXCJtaWxraW86ZXhlY3V0ZUFmdGVyXCIpID8/IHRydWUpIHtcbiAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIiwgeyBleGVjdXRlSWQ6IG9wdGlvbnMuY3JlYXRlZEV4ZWN1dGVJZCwgbG9nZ2VyOiBvcHRpb25zLmNyZWF0ZWRMb2dnZXIsIHBhdGg6IG9wdGlvbnMucGF0aCwgbWV0YSwgY29udGV4dDogb3B0aW9ucy5jb250ZXh0LCByZXN1bHRzLCByZWplY3QsIHJhaXNlIH0pO1xuICAgIH1cbiAgICByZXR1cm4geyBleGVjdXRlSWQsIGhlYWRlcnMsIHBhcmFtcywgcmVzdWx0cywgY29udGV4dDogb3B0aW9ucy5jb250ZXh0LCBtZXRhLCB0eXBlLCBlbXB0eVJlc3VsdCwgZmluYWxlcyB9O1xuICB9O1xuICBjb25zdCBfX2NhbGwgPSBhc3luYyAoY29udGV4dCwgbW9kdWxlLCBwYXJhbXMpID0+IHtcbiAgICBjb25zdCB7IGhhbmRsZXIgfSA9IGF3YWl0IG1vZHVsZTtcbiAgICByZXR1cm4gaGFuZGxlcihjb250ZXh0LCBwYXJhbXMpO1xuICB9O1xuICByZXR1cm4ge1xuICAgIF9fY2FsbCxcbiAgICBfX2V4ZWN1dGVcbiAgfTtcbn1cbi8vIHBhY2thZ2VzL21pbGtpby9ldmVudC9pbmRleC50c1xudmFyIFJFU09MVkVEX1BST01JU0UgPSBQcm9taXNlLnJlc29sdmUoKTtcbmZ1bmN0aW9uIF9faW5pdEV2ZW50TWFuYWdlcigpIHtcbiAgY29uc3QgaGFuZGxlcnMgPSBuZXcgTWFwO1xuICBjb25zdCBpbmRleGVkID0gbmV3IE1hcDtcbiAgbGV0IF92ZXJzaW9uID0gMDtcbiAgY29uc3QgZXZlbnRNYW5hZ2VyID0ge1xuICAgIG9uOiAoa2V5LCBoYW5kbGVyKSA9PiB7XG4gICAgICBfdmVyc2lvbisrO1xuICAgICAgaGFuZGxlcnMuc2V0KGhhbmRsZXIsIGtleSk7XG4gICAgICBpZiAoa2V5ID09PSBcIipcIikge1xuICAgICAgICBpZiAoaW5kZXhlZC5oYXMoXCIqXCIpID09PSBmYWxzZSkge1xuICAgICAgICAgIGluZGV4ZWQuc2V0KFwiKlwiLCBuZXcgU2V0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB3aWxkY2FyZFNldCA9IGluZGV4ZWQuZ2V0KFwiKlwiKTtcbiAgICAgICAgd2lsZGNhcmRTZXQuYWRkKGhhbmRsZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGluZGV4ZWQuaGFzKGtleSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgaW5kZXhlZC5zZXQoa2V5LCBuZXcgU2V0KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzZXQgPSBpbmRleGVkLmdldChrZXkpO1xuICAgICAgICBzZXQuYWRkKGhhbmRsZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgICBpZiAoa2V5ID09PSBcIipcIikge1xuICAgICAgICAgIGNvbnN0IHdpbGRjYXJkU2V0ID0gaW5kZXhlZC5nZXQoXCIqXCIpO1xuICAgICAgICAgIGlmICh3aWxkY2FyZFNldCkge1xuICAgICAgICAgICAgd2lsZGNhcmRTZXQuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCBzZXQgPSBpbmRleGVkLmdldChrZXkpO1xuICAgICAgICAgIGlmIChzZXQpIHtcbiAgICAgICAgICAgIHNldC5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0sXG4gICAgb2ZmOiAoa2V5LCBoYW5kbGVyKSA9PiB7XG4gICAgICBfdmVyc2lvbisrO1xuICAgICAgaWYgKGtleSA9PT0gXCIqXCIpIHtcbiAgICAgICAgY29uc3Qgd2lsZGNhcmRTZXQgPSBpbmRleGVkLmdldChcIipcIik7XG4gICAgICAgIGlmICghd2lsZGNhcmRTZXQpXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBoYW5kbGVycy5kZWxldGUoaGFuZGxlcik7XG4gICAgICAgIHdpbGRjYXJkU2V0LmRlbGV0ZShoYW5kbGVyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHNldCA9IGluZGV4ZWQuZ2V0KGtleSk7XG4gICAgICAgIGlmICghc2V0KVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgICBzZXQuZGVsZXRlKGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgZW1pdDogKGtleSwgdmFsdWUpID0+IHtcbiAgICAgIGNvbnN0IGggPSBpbmRleGVkLmdldChrZXkpO1xuICAgICAgY29uc3Qgd2lsZGNhcmRIYW5kbGVycyA9IGluZGV4ZWQuZ2V0KFwiKlwiKTtcbiAgICAgIGlmICghd2lsZGNhcmRIYW5kbGVycyAmJiAhaClcbiAgICAgICAgcmV0dXJuIFJFU09MVkVEX1BST01JU0U7XG4gICAgICBpZiAod2lsZGNhcmRIYW5kbGVycyAmJiBoKSB7XG4gICAgICAgIHJldHVybiAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVyKHsga2V5LCB2YWx1ZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGgpIHtcbiAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkoKTtcbiAgICAgIH1cbiAgICAgIGlmICh3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgIHJldHVybiAoYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVyKHsga2V5LCB2YWx1ZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gKGFzeW5jICgpID0+IHtcbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGgpIHtcbiAgICAgICAgICBhd2FpdCBoYW5kbGVyKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSkoKTtcbiAgICB9LFxuICAgIF9oYXNFbWl0SGFuZGxlcnM6IChrZXkpID0+IHtcbiAgICAgIHJldHVybiBpbmRleGVkLmhhcyhrZXkpIHx8IGluZGV4ZWQuaGFzKFwiKlwiKTtcbiAgICB9LFxuICAgIGdldCBfdmVyc2lvbigpIHtcbiAgICAgIHJldHVybiBfdmVyc2lvbjtcbiAgICB9LFxuICAgIGVtaXRBbnlBcHByb3ZlZDogYXN5bmMgKGtleSwgdmFsdWUpID0+IHtcbiAgICAgIGNvbnN0IHdpbGRjYXJkSGFuZGxlcnMgPSBpbmRleGVkLmdldChcIipcIik7XG4gICAgICBsZXQgYWNjZXB0ZWQgPSBmYWxzZTtcbiAgICAgIGlmICh3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgICAgaWYgKGF3YWl0IGhhbmRsZXIoeyBrZXksIHZhbHVlIH0pID09PSB0cnVlKSB7XG4gICAgICAgICAgICBhY2NlcHRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBoID0gaW5kZXhlZC5nZXQoa2V5KTtcbiAgICAgIGlmIChoKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBoKSB7XG4gICAgICAgICAgaWYgKGF3YWl0IGhhbmRsZXIodmFsdWUpID09PSB0cnVlKSB7XG4gICAgICAgICAgICBhY2NlcHRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjZXB0ZWQ7XG4gICAgfSxcbiAgICBlbWl0QWxsQXBwcm92ZWQ6IGFzeW5jIChrZXksIHZhbHVlKSA9PiB7XG4gICAgICBjb25zdCB3aWxkY2FyZEhhbmRsZXJzID0gaW5kZXhlZC5nZXQoXCIqXCIpO1xuICAgICAgbGV0IGFwcHJvdmVkID0gdHJ1ZTtcbiAgICAgIGlmICh3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiB3aWxkY2FyZEhhbmRsZXJzKSB7XG4gICAgICAgICAgaWYgKGF3YWl0IGhhbmRsZXIoeyBrZXksIHZhbHVlIH0pICE9PSB0cnVlKSB7XG4gICAgICAgICAgICBhcHByb3ZlZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgY29uc3QgaCA9IGluZGV4ZWQuZ2V0KGtleSk7XG4gICAgICBpZiAoaCkge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaCkge1xuICAgICAgICAgIGlmIChhd2FpdCBoYW5kbGVyKHZhbHVlKSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgYXBwcm92ZWQgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBhcHByb3ZlZDtcbiAgICB9XG4gIH07XG4gIHJldHVybiBldmVudE1hbmFnZXI7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vZmxvdy9pbmRleC50c1xuZnVuY3Rpb24gY3JlYXRlRmxvdygpIHtcbiAgbGV0IHN0YXR1cyA9IFwicGVuZGluZ1wiO1xuICBjb25zdCBmbG93cyA9IFtdO1xuICBjb25zdCBpdGVyYXRvciA9IHtcbiAgICBlbWl0OiAoZmxvdykgPT4ge1xuICAgICAgaWYgKGZsb3dzLmF0KC0xKT8uYmxhbmsgPT09IHRydWUpIHtcbiAgICAgICAgY29uc3QgaXRlbSA9IGZsb3dzLmF0KC0xKTtcbiAgICAgICAgaXRlbS5ibGFuayA9IGZhbHNlO1xuICAgICAgICBpdGVtLnJlc29sdmUoZmxvdyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlc29sdmVycyA9IFByb21pc2Uud2l0aFJlc29sdmVycygpO1xuICAgICAgICByZXNvbHZlcnMucmVzb2x2ZShmbG93KTtcbiAgICAgICAgZmxvd3MucHVzaCh7IC4uLnJlc29sdmVycywgYmxhbms6IGZhbHNlIH0pO1xuICAgICAgfVxuICAgIH0sXG4gICAgLi4ue1xuICAgICAgYXN5bmMgbmV4dCgpIHtcbiAgICAgICAgaWYgKHN0YXR1cyAhPT0gXCJwZW5kaW5nXCIpXG4gICAgICAgICAgcmV0dXJuIHsgZG9uZTogdHJ1ZSwgdmFsdWU6IG51bGwgfTtcbiAgICAgICAgaWYgKGZsb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGNvbnN0IHJlc29sdmVycyA9IFByb21pc2Uud2l0aFJlc29sdmVycygpO1xuICAgICAgICAgIGZsb3dzLnB1c2goeyAuLi5yZXNvbHZlcnMsIGJsYW5rOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGZsb3cgPSBmbG93cy5hdCgwKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZmxvdy5wcm9taXNlO1xuICAgICAgICBmbG93cy5zaGlmdCgpO1xuICAgICAgICByZXR1cm4geyBkb25lOiBzdGF0dXMgIT09IFwicGVuZGluZ1wiLCB2YWx1ZTogcmVzdWx0IH07XG4gICAgICB9LFxuICAgICAgYXN5bmMgcmV0dXJuKCkge1xuICAgICAgICBzdGF0dXMgPSBcInJlc29sdmVkXCI7XG4gICAgICAgIGZvciAoY29uc3QgZmxvdyBvZiBmbG93cykge1xuICAgICAgICAgIGZsb3cuYmxhbmsgPSBmYWxzZTtcbiAgICAgICAgICBmbG93LnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlLCB2YWx1ZTogbnVsbCB9O1xuICAgICAgfSxcbiAgICAgIGFzeW5jIHRocm93KGVycikge1xuICAgICAgICBzdGF0dXMgPSBcInJlamVjdGVkXCI7XG4gICAgICAgIGlmIChmbG93cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBjb25zdCByZXNvbHZlcnMgPSBQcm9taXNlLndpdGhSZXNvbHZlcnMoKTtcbiAgICAgICAgICBmbG93cy5wdXNoKHsgLi4ucmVzb2x2ZXJzLCBibGFuazogdHJ1ZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGNvbnN0IGZsb3cgb2YgZmxvd3MpIHtcbiAgICAgICAgICBmbG93LmJsYW5rID0gZmFsc2U7XG4gICAgICAgICAgZmxvdy5yZWplY3QoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBkb25lOiB0cnVlLCB2YWx1ZTogbnVsbCB9O1xuICAgICAgfVxuICAgIH0sXG4gICAgW1N5bWJvbC5hc3luY0l0ZXJhdG9yXSgpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGl0ZXJhdG9yO1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL2NyZWF0ZS1pZC50c1xudmFyIEVOQ09ESU5HID0gXCIwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO1xudmFyIEVOQ09ESU5HX0xFTiA9IEVOQ09ESU5HLmxlbmd0aDtcbnZhciBfX2Zhc3RJZFBvb2wgPSBuZXcgVWludDhBcnJheSgyNTYpO1xudmFyIF9fZmFzdElkUG9vbEluZGV4ID0gMjU2O1xudmFyIF9fZmFzdElkQ291bnRlciA9IDA7XG5mdW5jdGlvbiBfX2NyZWF0ZUlkKCkge1xuICBpZiAoX19mYXN0SWRQb29sSW5kZXggKyAxNiA+IDI1Nikge1xuICAgIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMoX19mYXN0SWRQb29sKTtcbiAgICBfX2Zhc3RJZFBvb2xJbmRleCA9IDA7XG4gIH1cbiAgY29uc3QgdHMgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KS5wYWRTdGFydCg4LCBcIjBcIik7XG4gIGxldCBpZCA9IHRzO1xuICBmb3IgKGxldCBpID0gMDtpIDwgNjsgaSsrKSB7XG4gICAgaWQgKz0gRU5DT0RJTkcuY2hhckF0KF9fZmFzdElkUG9vbFtfX2Zhc3RJZFBvb2xJbmRleCsrXSAlIEVOQ09ESU5HX0xFTik7XG4gIH1cbiAgY29uc3QgY291bnRlciA9IF9fZmFzdElkQ291bnRlcisrO1xuICBmb3IgKGxldCBpID0gMDtpIDwgMTA7IGkrKykge1xuICAgIGNvbnN0IG1peCA9IGNvdW50ZXIgKyBfX2Zhc3RJZFBvb2xbX19mYXN0SWRQb29sSW5kZXgrKyAlIDI1Nl0gJiA2NTUzNTtcbiAgICBpZCArPSBFTkNPRElORy5jaGFyQXQobWl4ICUgRU5DT0RJTkdfTEVOKTtcbiAgfVxuICByZXR1cm4gaWQ7XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby9leGVjdXRlL2V4ZWN1dGUtaWQtZ2VuZXJhdG9yLnRzXG5mdW5jdGlvbiBkZWZpbmVEZWZhdWx0RXhlY3V0ZUlkR2VuZXJhdG9yKCkge1xuICByZXR1cm4gX19jcmVhdGVJZDtcbn1cblxuLy8gcGFja2FnZXMvbWlsa2lvL3dvcmxkL2luZGV4LnRzXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVXb3JsZChnZW5lcmF0ZWQsIGNvbmZpZ1NjaGVtYSwgb3B0aW9ucykge1xuICBjb25zdCBleGVjdXRlSWQgPSBvcHRpb25zLmV4ZWN1dGVJZCA/PyBkZWZpbmVEZWZhdWx0RXhlY3V0ZUlkR2VuZXJhdG9yKCk7XG4gIGNvbnN0IGNvbmZpZzIgPSBhd2FpdCBjb25maWdTY2hlbWEuZ2V0KCk7XG4gIGNvbnN0IHJ1bnRpbWUgPSB7XG4gICAgcmVxdWVzdDogbmV3IE1hcCxcbiAgICBjb25maWc6IGNvbmZpZzJcbiAgfTtcbiAgY29uc3QgZXZlbnRNYW5hZ2VyID0gX19pbml0RXZlbnRNYW5hZ2VyKCk7XG4gIGlmIChvcHRpb25zLmFjY2Vzc0tleSlcbiAgICBvcHRpb25zLmlnbm9yZVBhdGhMZXZlbCA9IG9wdGlvbnMuaWdub3JlUGF0aExldmVsID8gb3B0aW9ucy5pZ25vcmVQYXRoTGV2ZWwgKyAxIDogMTtcbiAgY29uc3QgXyA9IHtcbiAgICAuLi5vcHRpb25zLFxuICAgIGV4ZWN1dGVJZCxcbiAgICBydW50aW1lLFxuICAgIG9uOiBldmVudE1hbmFnZXIub24sXG4gICAgb2ZmOiBldmVudE1hbmFnZXIub2ZmLFxuICAgIGVtaXQ6IGV2ZW50TWFuYWdlci5lbWl0LFxuICAgIGVtaXRBbnlBcHByb3ZlZDogZXZlbnRNYW5hZ2VyLmVtaXRBbnlBcHByb3ZlZCxcbiAgICBlbWl0QWxsQXBwcm92ZWQ6IGV2ZW50TWFuYWdlci5lbWl0QWxsQXBwcm92ZWQsXG4gICAgX2hhc0VtaXRIYW5kbGVyczogZXZlbnRNYW5hZ2VyLl9oYXNFbWl0SGFuZGxlcnMsXG4gICAgX2VtaXRIYW5kbGVyc1ZlcnNpb246IGV2ZW50TWFuYWdlci5fdmVyc2lvblxuICB9O1xuICBjb25zdCBleGVjdXRlciA9IF9faW5pdEV4ZWN1dGVyKGdlbmVyYXRlZCwgXyk7XG4gIGNvbnN0IGxpc3RlbmVyID0gX19pbml0TGlzdGVuZXIoZ2VuZXJhdGVkLCBfLCBleGVjdXRlcik7XG4gIGNvbnN0IHdvcmxkID0ge1xuICAgIF8sXG4gICAgb246IGV2ZW50TWFuYWdlci5vbixcbiAgICBvZmY6IGV2ZW50TWFuYWdlci5vZmYsXG4gICAgZW1pdDogZXZlbnRNYW5hZ2VyLmVtaXQsXG4gICAgZW1pdEFueUFwcHJvdmVkOiBldmVudE1hbmFnZXIuZW1pdEFueUFwcHJvdmVkLFxuICAgIGVtaXRBbGxBcHByb3ZlZDogZXZlbnRNYW5hZ2VyLmVtaXRBbGxBcHByb3ZlZCxcbiAgICBsaXN0ZW5lcixcbiAgICBjb25maWc6IGNvbmZpZzJcbiAgfTtcbiAgcnVudGltZS5hcHAgPSB3b3JsZDtcbiAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5ib290c3RyYXBzKSkge1xuICAgIGZvciAoY29uc3QgYm9vdHN0cmFwIG9mIG9wdGlvbnMuYm9vdHN0cmFwcykge1xuICAgICAgYXdhaXQgYm9vdHN0cmFwKHdvcmxkKTtcbiAgICB9XG4gIH1cbiAgYXdhaXQgUHJvbWlzZS5hbGwoZ2VuZXJhdGVkLmhhbmRsZXJTY2hlbWEubG9hZEhhbmRsZXJzKHdvcmxkKSk7XG4gIGNvbnN0IHJvdXRlS2V5cyA9IE9iamVjdC5rZXlzKGdlbmVyYXRlZC5yb3V0ZVNjaGVtYSk7XG4gIGNvbnN0IHJhd1BhdGhzID0gZ2VuZXJhdGVkLnJhd1NjaGVtYT8ucmF3UGF0aHMgPyBBcnJheS5mcm9tKGdlbmVyYXRlZC5yYXdTY2hlbWEucmF3UGF0aHMpIDogW107XG4gIGNvbnN0IGFsbFJvdXRlcyA9IFsuLi5yb3V0ZUtleXMsIC4uLnJhd1BhdGhzXTtcbiAgY29uc29sZS5sb2coYFxu4pazIFJvdXRlczpcbiAgICAke2FsbFJvdXRlcy5qb2luKGBcbiAgICBgKX1cbiAgQSB0b3RhbCBvZiAke2FsbFJvdXRlcy5sZW5ndGh9IHJvdXRlcy5gKTtcbiAgY29uc29sZS5sb2coYFxu4pazIFNlcnZlcjogaHR0cDovL2xvY2FsaG9zdDoke29wdGlvbnMucG9ydH1gKTtcbiAgcmV0dXJuIHdvcmxkO1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3R5cGlhL2luZGV4LnRzXG5mdW5jdGlvbiB0eXBpYShpbml0KSB7XG4gIHJldHVybiBpbml0O1xufVxuLy8gcGFja2FnZXMvbWlsa2lvL3V0aWxzL3NlbmQtY29va2Jvb2stZXZlbnQudHNcbmFzeW5jIGZ1bmN0aW9uIHNlbmRDb29rYm9va0V2ZW50KHJ1bnRpbWUsIGV2ZW50KSB7fVxuXG4vLyBwYWNrYWdlcy9taWxraW8vbG9nZ2VyL2luZGV4LnRzXG5mdW5jdGlvbiBmYXN0VGltZXN0YW1wKCkge1xuICBjb25zdCBkID0gbmV3IERhdGU7XG4gIHJldHVybiBgKCR7ZC5nZXRGdWxsWWVhcigpfS0ke1N0cmluZyhkLmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCBcIjBcIil9LSR7U3RyaW5nKGQuZ2V0RGF0ZSgpKS5wYWRTdGFydCgyLCBcIjBcIil9ICR7U3RyaW5nKGQuZ2V0SG91cnMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfToke1N0cmluZyhkLmdldE1pbnV0ZXMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfToke1N0cmluZyhkLmdldFNlY29uZHMoKSkucGFkU3RhcnQoMiwgXCIwXCIpfSlgO1xufVxudmFyIGRlZmF1bHRJbnNlcnRpbmcgPSAobG9nKSA9PiB7XG4gIGxvZ1swXSA9IGBcbiR7bG9nWzBdfWA7XG4gIGNvbnNvbGUubG9nKC4uLmxvZyk7XG4gIHJldHVybiB0cnVlO1xufTtcbmZ1bmN0aW9uIGNyZWF0ZUxvZ2dlcihydW50aW1lLCBwYXRoLCBleGVjdXRlSWQpIHtcbiAgY29uc3QgbG9nZ2VyID0ge307XG4gIGNvbnN0IGxvZ3MgPSBbXTtcbiAgY29uc3QgdGFncyA9IG5ldyBNYXA7XG4gIGNvbnN0IGluc2VydGluZyA9IHJ1bnRpbWUub25Mb2dnZXJJbnNlcnRpbmcgfHwgZGVmYXVsdEluc2VydGluZztcbiAgY29uc3QgaGFzU3VibWl0dGluZyA9ICEhcnVudGltZS5vbkxvZ2dlclN1Ym1pdHRpbmc7XG4gIGNvbnN0IGlzRGV2ZWxvcCA9IHJ1bnRpbWUuZGV2ZWxvcDtcbiAgbG9nZ2VyLl8gPSB7XG4gICAgbG9ncyxcbiAgICB0YWdzLFxuICAgIHN1Ym1pdDogKGNvbnRleHQpID0+IHtcbiAgICAgIGlmICghcnVudGltZS5vbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgIHJldHVybjtcbiAgICAgIHJldHVybiBydW50aW1lLm9uTG9nZ2VyU3VibWl0dGluZyhjb250ZXh0LCBsb2dzLCB0YWdzKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IF9fdGFnUHVzaCA9IChrZXksIHZhbHVlKSA9PiB7XG4gICAgdGFncy5zZXQoa2V5LCB2YWx1ZSk7XG4gIH07XG4gIGNvbnN0IF9fbG9nUHVzaCA9IChsb2cpID0+IHtcbiAgICBpZiAoIWluc2VydGluZyhsb2cpKVxuICAgICAgcmV0dXJuIGxvZztcbiAgICBpZiAoaGFzU3VibWl0dGluZylcbiAgICAgIGxvZ3MucHVzaChbLi4ubG9nXSk7XG4gICAgaWYgKGlzRGV2ZWxvcClcbiAgICAgIHNlbmRDb29rYm9va0V2ZW50KHJ1bnRpbWUsIHsgdHlwZTogXCJtaWxraW9AbG9nZ2VyXCIsIGxvZyB9KTtcbiAgICByZXR1cm4gbG9nO1xuICB9O1xuICBsb2dnZXIuc2V0VGFnID0gX190YWdQdXNoO1xuICBsb2dnZXIuc2V0TG9nID0gKC4uLmxvZykgPT4gX19sb2dQdXNoKGxvZyk7XG4gIGNvbnN0IGdldE5vdyA9IGZhc3RUaW1lc3RhbXA7XG4gIGxvZ2dlci5kZWJ1ZyA9IChkZXNjcmlwdGlvbiwgLi4ucGFyYW1zKSA9PiBfX2xvZ1B1c2goW1wiKGRlYnVnKVwiLCBwYXRoLCBleGVjdXRlSWQsIGdldE5vdygpLCBgXG4ke2Rlc2NyaXB0aW9ufWAsIC4uLnBhcmFtc10pO1xuICBsb2dnZXIuaW5mbyA9IChkZXNjcmlwdGlvbiwgLi4ucGFyYW1zKSA9PiBfX2xvZ1B1c2goW1wiKGluZm8pXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIGxvZ2dlci53YXJuID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIod2FybilcIiwgcGF0aCwgZXhlY3V0ZUlkLCBnZXROb3coKSwgYFxuJHtkZXNjcmlwdGlvbn1gLCAuLi5wYXJhbXNdKTtcbiAgbG9nZ2VyLmVycm9yID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIoZXJyb3IpXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIGxvZ2dlci5yZXF1ZXN0ID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIocmVxdWVzdClcIiwgcGF0aCwgZXhlY3V0ZUlkLCBnZXROb3coKSwgYFxuJHtkZXNjcmlwdGlvbn1gLCAuLi5wYXJhbXNdKTtcbiAgbG9nZ2VyLnJlc3BvbnNlID0gKGRlc2NyaXB0aW9uLCAuLi5wYXJhbXMpID0+IF9fbG9nUHVzaChbXCIocmVzcG9uc2UpXCIsIHBhdGgsIGV4ZWN1dGVJZCwgZ2V0Tm93KCksIGBcbiR7ZGVzY3JpcHRpb259YCwgLi4ucGFyYW1zXSk7XG4gIHJldHVybiBsb2dnZXI7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vc3RlcC9pbmRleC50c1xuZnVuY3Rpb24gY3JlYXRlU3RlcCgpIHtcbiAgY29uc3Qgc3RlcENvbnRyb2xsZXIgPSB7XG4gICAgJG1pbGtpb1R5cGU6IFwic3RlcFwiLFxuICAgIF9zdGVwczogW10sXG4gICAgc3RlcChoYW5kbGVyKSB7XG4gICAgICBzdGVwQ29udHJvbGxlci5fc3RlcHMucHVzaChoYW5kbGVyKTtcbiAgICAgIHJldHVybiBzdGVwQ29udHJvbGxlcjtcbiAgICB9LFxuICAgIGFzeW5jIHJ1bigpIHtcbiAgICAgIGxldCBzdGFnZSA9IHt9O1xuICAgICAgZm9yIChjb25zdCBzdGVwIG9mIHN0ZXBDb250cm9sbGVyLl9zdGVwcykge1xuICAgICAgICBzdGFnZSA9IHsgLi4uc3RhZ2UsIC4uLmF3YWl0IHN0ZXAoc3RhZ2UpIH07XG4gICAgICB9XG4gICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgIGZvciAoY29uc3Qga2V5IGluIHN0YWdlKSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gc3RhZ2Vba2V5XTtcbiAgICAgICAgaWYgKCFrZXkuc3RhcnRzV2l0aChcIl9cIikpXG4gICAgICAgICAgcmVzdWx0W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9O1xuICByZXR1cm4gc3RlcENvbnRyb2xsZXI7XG59XG4vLyBwYWNrYWdlcy9taWxraW8vdXRpbHMvdHJpZS50c1xuY2xhc3MgVHJpZSB7XG4gIHJvb3Q7XG4gIGNhY2hlO1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnJvb3QgPSBuZXcgVHJpZU5vZGU7XG4gICAgdGhpcy5jYWNoZSA9IG5ldyBNYXA7XG4gIH1cbiAgYWRkKHBhdGgsIHZhbHVlKSB7XG4gICAgY29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpLnNwbGl0KFwiL1wiKS5maWx0ZXIoKHApID0+IHAgIT09IFwiXCIpO1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IHRoaXMucm9vdDtcbiAgICBpZiAocGFydHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjdXJyZW50Tm9kZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5jYWNoZS5zZXQocGF0aCwgdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHBhcnQyIG9mIHBhcnRzKSB7XG4gICAgICBpZiAoIWN1cnJlbnROb2RlLmNoaWxkcmVuLmhhcyhwYXJ0MikpIHtcbiAgICAgICAgY3VycmVudE5vZGUuY2hpbGRyZW4uc2V0KHBhcnQyLCBuZXcgVHJpZU5vZGUpO1xuICAgICAgfVxuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5jaGlsZHJlbi5nZXQocGFydDIpO1xuICAgIH1cbiAgICBjdXJyZW50Tm9kZS52YWx1ZSA9IHZhbHVlO1xuICAgIHRoaXMuY2FjaGUuc2V0KHBhdGgsIHZhbHVlKTtcbiAgfVxuICBnZXQocGF0aCkge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuY2FjaGUuZ2V0KHBhdGgpO1xuICAgIGlmIChjYWNoZWQgIT09IHVuZGVmaW5lZClcbiAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgY29uc3QgcGFydHMgPSBwYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csIFwiXCIpLnNwbGl0KFwiL1wiKS5maWx0ZXIoKHApID0+IHAgIT09IFwiXCIpO1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IHRoaXMucm9vdDtcbiAgICBmb3IgKGNvbnN0IHBhcnQyIG9mIHBhcnRzKSB7XG4gICAgICBpZiAoIWN1cnJlbnROb2RlLmNoaWxkcmVuLmhhcyhwYXJ0MikpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBjdXJyZW50Tm9kZSA9IGN1cnJlbnROb2RlLmNoaWxkcmVuLmdldChwYXJ0Mik7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGN1cnJlbnROb2RlLnZhbHVlO1xuICAgIGlmIChyZXN1bHQgIT09IG51bGwpXG4gICAgICB0aGlzLmNhY2hlLnNldChwYXRoLCByZXN1bHQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgZ2V0QnlQYXJ0cyhwYXJ0cykge1xuICAgIGxldCBjdXJyZW50Tm9kZSA9IHRoaXMucm9vdDtcbiAgICBmb3IgKGNvbnN0IHBhcnQyIG9mIHBhcnRzKSB7XG4gICAgICBpZiAoIWN1cnJlbnROb2RlLmNoaWxkcmVuLmhhcyhwYXJ0MikpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5jaGlsZHJlbi5nZXQocGFydDIpO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudE5vZGUudmFsdWU7XG4gIH1cbiAgaGFzKHBhdGgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXQocGF0aCkgIT09IG51bGw7XG4gIH1cbn1cblxuY2xhc3MgVHJpZU5vZGUge1xuICBjaGlsZHJlbjtcbiAgdmFsdWU7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuY2hpbGRyZW4gPSBuZXcgTWFwO1xuICAgIHRoaXMudmFsdWUgPSBudWxsO1xuICB9XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby91dGlscy9idWlsZC1jb3JzLWhlYWRlcnMudHNcbmZ1bmN0aW9uIGJ1aWxkQ29yc0hlYWRlcnMoY29ycywgb3JpZ2luKSB7XG4gIGNvbnN0IHJlc3VsdCA9IHt9O1xuICBpZiAoY29ycz8uY29yc0FsbG93TWV0aG9kcylcbiAgICByZXN1bHRbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCJdID0gY29ycy5jb3JzQWxsb3dNZXRob2RzLmpvaW4oXCIsIFwiKTtcbiAgaWYgKGNvcnM/LmNvcnNBbGxvd0hlYWRlcnMpXG4gICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiXSA9IGNvcnMuY29yc0FsbG93SGVhZGVycy5qb2luKFwiLCBcIik7XG4gIGlmIChjb3JzPy5jb3JzTWF4QWdlICE9PSB1bmRlZmluZWQpXG4gICAgcmVzdWx0W1wiQWNjZXNzLUNvbnRyb2wtTWF4LUFnZVwiXSA9IFN0cmluZyhjb3JzLmNvcnNNYXhBZ2UpO1xuICBpZiAoY29ycz8uY29yc0FsbG93T3JpZ2luICYmIGNvcnMuY29yc0FsbG93T3JpZ2luLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpc1dpbGRjYXJkID0gY29ycy5jb3JzQWxsb3dPcmlnaW4uaW5jbHVkZXMoXCIqXCIpO1xuICAgIGlmIChjb3JzLmNvcnNBbGxvd0NyZWRlbnRpYWxzKSB7XG4gICAgICBpZiAob3JpZ2luICYmIChpc1dpbGRjYXJkIHx8IGNvcnMuY29yc0FsbG93T3JpZ2luLmluY2x1ZGVzKG9yaWdpbikpKSB7XG4gICAgICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiXSA9IG9yaWdpbjtcbiAgICAgICAgcmVzdWx0W1wiVmFyeVwiXSA9IFwiT3JpZ2luXCI7XG4gICAgICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzXCJdID0gXCJ0cnVlXCI7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChpc1dpbGRjYXJkKSB7XG4gICAgICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpblwiXSA9IFwiKlwiO1xuICAgICAgfSBlbHNlIGlmIChvcmlnaW4gJiYgY29ycy5jb3JzQWxsb3dPcmlnaW4uaW5jbHVkZXMob3JpZ2luKSkge1xuICAgICAgICByZXN1bHRbXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIl0gPSBvcmlnaW47XG4gICAgICAgIHJlc3VsdFtcIlZhcnlcIl0gPSBcIk9yaWdpblwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoY29ycz8uY29yc0V4cG9zZUhlYWRlcnMgJiYgY29ycy5jb3JzRXhwb3NlSGVhZGVycy5sZW5ndGggPiAwKVxuICAgIHJlc3VsdFtcIkFjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzXCJdID0gY29ycy5jb3JzRXhwb3NlSGVhZGVycy5qb2luKFwiLCBcIik7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIHBhY2thZ2VzL21pbGtpby91dGlscy9zYW5pdGl6ZS1leGVjdXRlLWlkLnRzXG5mdW5jdGlvbiBzYW5pdGl6ZUV4ZWN1dGVJZChleGVjdXRlSWQpIHtcbiAgY29uc3QgdmFsdWUgPSB0eXBlb2YgZXhlY3V0ZUlkID09PSBcInN0cmluZ1wiID8gZXhlY3V0ZUlkIDogXCJcIjtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1teQS1aYS16MC05Xy1dL2csIFwiXCIpO1xufVxuXG4vLyBwYWNrYWdlcy9taWxraW8vbGlzdGVuZXIvaW5kZXgudHNcbmZ1bmN0aW9uIF9faW5pdExpc3RlbmVyKGdlbmVyYXRlZCwgcnVudGltZSwgZXhlY3V0ZXIpIHtcbiAgY29uc3QgcG9ydCA9IHJ1bnRpbWUucG9ydDtcbiAgY29uc3QgdHJpZSA9IG5ldyBUcmllO1xuICBjb25zdCBjb3JzID0geyBjb3JzQWxsb3dNZXRob2RzOiBbXCJQT1NUXCIsIFwiT1BUSU9OU1wiXSwgY29yc0FsbG93SGVhZGVyczogW1wiQ29udGVudC1UeXBlXCIsIFwiQXV0aG9yaXphdGlvblwiXSwgY29yc01heEFnZTogMCwgLi4ucnVudGltZS5odHRwPy5jb3JzIH07XG4gIGNvbnN0IGNvcnNIZWFkZXJzQ2FjaGUgPSBuZXcgTWFwO1xuICBjb25zdCBNQVhfQ09SU19IRUFERVJTX0NBQ0hFX1NJWkUgPSAxMDI0O1xuICBjb25zdCBnZXRDb3JzSGVhZGVycyA9IChvcmlnaW4pID0+IHtcbiAgICBjb25zdCBrZXkgPSBvcmlnaW4gPz8gXCJcIjtcbiAgICBsZXQgY2FjaGVkID0gY29yc0hlYWRlcnNDYWNoZS5nZXQoa2V5KTtcbiAgICBpZiAoY2FjaGVkICE9PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gY2FjaGVkO1xuICAgIGlmIChjb3JzSGVhZGVyc0NhY2hlLnNpemUgPj0gTUFYX0NPUlNfSEVBREVSU19DQUNIRV9TSVpFKVxuICAgICAgY29yc0hlYWRlcnNDYWNoZS5jbGVhcigpO1xuICAgIGNhY2hlZCA9IGJ1aWxkQ29yc0hlYWRlcnMoY29ycywgb3JpZ2luKTtcbiAgICBjb3JzSGVhZGVyc0NhY2hlLnNldChrZXksIGNhY2hlZCk7XG4gICAgcmV0dXJuIGNhY2hlZDtcbiAgfTtcbiAgY29uc3QgZGVmYXVsdFJlc3BvbnNlSGVhZGVycyA9IHtcbiAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1zdG9yZVwiLFxuICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiXG4gIH07XG4gIGNvbnN0IGRlZmF1bHRNZXJnZWRIZWFkZXJzID0geyAuLi5nZXRDb3JzSGVhZGVycyhudWxsKSwgLi4uZGVmYXVsdFJlc3BvbnNlSGVhZGVycyB9O1xuICBjb25zdCBlbXB0eVJlc3VsdFByZWZpeCA9ICd7XCJkYXRhXCI6e30sXCJleGVjdXRlSWRcIjpcIic7XG4gIGNvbnN0IHJlc3VsdFByZWZpeCA9ICd7XCJkYXRhXCI6JztcbiAgY29uc3QgaWRTdWZmaXggPSAnXCIsXCJzdWNjZXNzXCI6dHJ1ZX0nO1xuICBjb25zdCBmYXN0UGF0aFJlc3BvbnNlID0geyBib2R5OiBcIlwiLCBzdGF0dXM6IDIwMCwgaGVhZGVyczogZGVmYXVsdE1lcmdlZEhlYWRlcnMgfTtcbiAgbGV0IGNhY2hlZE5vRW1pdEhhbmRsZXJzID0gdHJ1ZTtcbiAgbGV0IGxhc3RFbWl0SGFuZGxlcnNWZXJzaW9uID0gLTE7XG4gIGNvbnN0IGNoZWNrTm9FbWl0SGFuZGxlcnMgPSAoKSA9PiB7XG4gICAgY29uc3QgdiA9IHJ1bnRpbWUuX2VtaXRIYW5kbGVyc1ZlcnNpb247XG4gICAgaWYgKHYgIT09IGxhc3RFbWl0SGFuZGxlcnNWZXJzaW9uKSB7XG4gICAgICBsYXN0RW1pdEhhbmRsZXJzVmVyc2lvbiA9IHY7XG4gICAgICBjYWNoZWROb0VtaXRIYW5kbGVycyA9ICFydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIpICYmICFydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIikgJiYgIXJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXF1ZXN0XCIpICYmICFydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpodHRwUmVzcG9uc2VcIikgJiYgIXJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZE5vRW1pdEhhbmRsZXJzO1xuICB9O1xuICBjb25zdCBoYXNPbkxvZ2dlclN1Ym1pdHRpbmcgPSAhIXJ1bnRpbWUub25Mb2dnZXJTdWJtaXR0aW5nO1xuICBjb25zdCBub29wTG9nZ2VyID0ge1xuICAgIF86IHsgbG9nczogW10sIHRhZ3M6IG5ldyBNYXAsIHN1Ym1pdDogKCkgPT4ge30gfSxcbiAgICBzZXRUYWc6ICgpID0+IHt9LFxuICAgIHNldExvZzogKC4uLl9sb2cpID0+ICh7fSksXG4gICAgZGVidWc6IChfZGVzY3JpcHRpb24sIC4uLl9wYXJhbXMpID0+ICh7fSksXG4gICAgaW5mbzogKF9kZXNjcmlwdGlvbiwgLi4uX3BhcmFtcykgPT4gKHt9KSxcbiAgICB3YXJuOiAoX2Rlc2NyaXB0aW9uLCAuLi5fcGFyYW1zKSA9PiAoe30pLFxuICAgIGVycm9yOiAoX2Rlc2NyaXB0aW9uLCAuLi5fcGFyYW1zKSA9PiAoe30pLFxuICAgIHJlcXVlc3Q6IChfZGVzY3JpcHRpb24sIC4uLl9wYXJhbXMpID0+ICh7fSksXG4gICAgcmVzcG9uc2U6IChfZGVzY3JpcHRpb24sIC4uLl9wYXJhbXMpID0+ICh7fSlcbiAgfTtcbiAgY29uc3QgYmFzZUNvbnRleHRQcm90byA9IHtcbiAgICByZWplY3QsXG4gICAgZGV2ZWxvcDogcnVudGltZS5kZXZlbG9wLFxuICAgIGxvZ2dlcjogbm9vcExvZ2dlcixcbiAgICBlbWl0OiBydW50aW1lLmVtaXQsXG4gICAgZW1pdEFueUFwcHJvdmVkOiBydW50aW1lLmVtaXRBbnlBcHByb3ZlZCxcbiAgICBlbWl0QWxsQXBwcm92ZWQ6IHJ1bnRpbWUuZW1pdEFsbEFwcHJvdmVkLFxuICAgIGNvbmZpZzogcnVudGltZS5ydW50aW1lLmNvbmZpZyxcbiAgICB0eXBpYTogZ2VuZXJhdGVkLnR5cGlhU2NoZW1hLFxuICAgIG9uRmluYWxseTogKCkgPT4ge30sXG4gICAgXzogcnVudGltZSxcbiAgICBjYWxsKG1vZHVsZSwgcCkge1xuICAgICAgcmV0dXJuIGV4ZWN1dGVyLl9fY2FsbCh0aGlzLCBtb2R1bGUsIHApO1xuICAgIH1cbiAgfTtcbiAgbGV0IGNhY2hlZFJvdXRlU2NoZW1hID0gbnVsbDtcbiAgbGV0IGNhY2hlZFBhdGhTdHJpbmcgPSBudWxsO1xuICBsZXQgY2FjaGVkVmFsaWRhdGVQYXJhbXMgPSBudWxsO1xuICBsZXQgY2FjaGVkSGFuZGxlciA9IG51bGw7XG4gIGxldCBjYWNoZWRTa2lwVmFsaWRhdGlvbiA9IGZhbHNlO1xuICBjb25zdCBmZXRjaCA9IGFzeW5jIChvcHRpb25zKSA9PiB7XG4gICAgY29uc3QgTUFYX0JPRFlfU0laRSA9IDEwICogMTAyNCAqIDEwMjQ7XG4gICAgY29uc3QgdG9vTGFyZ2UgPSAoKSA9PiByZWplY3QoXCJSRVFVRVNUX1RPT19MQVJHRVwiLCB7IG1heEJvZHlTaXplOiBNQVhfQk9EWV9TSVpFIH0pO1xuICAgIGNvbnN0IHJlYWRCb2R5VGV4dCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHByZVJlYWQgPSBvcHRpb25zLnJlcXVlc3QuX19ib2R5VGV4dDtcbiAgICAgIGlmIChwcmVSZWFkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmVSZWFkID09PSBcInN0cmluZ1wiICYmIHByZVJlYWQubGVuZ3RoID4gTUFYX0JPRFlfU0laRSlcbiAgICAgICAgICB0aHJvdyB0b29MYXJnZSgpO1xuICAgICAgICByZXR1cm4gcHJlUmVhZDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOdW1iZXIob3B0aW9ucy5yZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiY29udGVudC1sZW5ndGhcIikgPz8gXCIwXCIpO1xuICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZShjb250ZW50TGVuZ3RoKSAmJiBjb250ZW50TGVuZ3RoID4gTUFYX0JPRFlfU0laRSlcbiAgICAgICAgdGhyb3cgdG9vTGFyZ2UoKTtcbiAgICAgIGlmICghb3B0aW9ucy5yZXF1ZXN0LmJvZHkpXG4gICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgY29uc3QgcmVhZGVyID0gb3B0aW9ucy5yZXF1ZXN0LmJvZHkuZ2V0UmVhZGVyKCk7XG4gICAgICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyO1xuICAgICAgbGV0IHRleHQgPSBcIlwiO1xuICAgICAgdHJ5IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBjb25zdCB7IGRvbmUsIHZhbHVlIH0gPSBhd2FpdCByZWFkZXIucmVhZCgpO1xuICAgICAgICAgIGlmIChkb25lKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgdGV4dCArPSBkZWNvZGVyLmRlY29kZSh2YWx1ZSwgeyBzdHJlYW06IHRydWUgfSk7XG4gICAgICAgICAgaWYgKHRleHQubGVuZ3RoID4gTUFYX0JPRFlfU0laRSkge1xuICAgICAgICAgICAgYXdhaXQgcmVhZGVyLmNhbmNlbCgpLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIHRocm93IHRvb0xhcmdlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRleHQgKz0gZGVjb2Rlci5kZWNvZGUoKTtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIHJlYWRlci5yZWxlYXNlTG9jaygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRleHQ7XG4gICAgfTtcbiAgICBjb25zdCBvcmlnaW4gPSBvcHRpb25zLnJlcXVlc3QuX19vcmlnaW4gPz8gb3B0aW9ucy5yZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiT3JpZ2luXCIpO1xuICAgIGlmIChvcHRpb25zLnJlcXVlc3QubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSh1bmRlZmluZWQsIHtcbiAgICAgICAgaGVhZGVyczogZ2V0Q29yc0hlYWRlcnMob3JpZ2luKVxuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHBhdGhuYW1lID0gb3B0aW9ucy5yZXF1ZXN0Ll9fcGF0aG5hbWUgPz8gbmV3IFVSTChvcHRpb25zLnJlcXVlc3QudXJsKS5wYXRobmFtZTtcbiAgICBpZiAocGF0aG5hbWUuZW5kc1dpdGgoXCIvZ2VuZXJhdGVfMjA0XCIpKSB7XG4gICAgICBjb25zdCBjb3JzSGVhZGVyczIgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgIHN0YXR1czogMjA0LFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgU2VydmVyOiBcIm1pbGtpb1wiLFxuICAgICAgICAgIC4uLmNvcnNIZWFkZXJzMixcbiAgICAgICAgICBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1zdG9yZVwiLFxuICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IGB0ZXh0L3BsYWluOyB0aW1lPSR7RGF0ZS5ub3coKX1gXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBwcmVQYXRoQXJyYXkgPSBvcHRpb25zLnJlcXVlc3QuX19wYXRoQXJyYXk7XG4gICAgbGV0IHBhdGhTdHJpbmc7XG4gICAgbGV0IHBhdGhBcnJheTtcbiAgICBpZiAoIXJ1bnRpbWUuYWNjZXNzS2V5ICYmICghcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgfHwgcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgPT09IDApKSB7XG4gICAgICBwYXRoU3RyaW5nID0gcGF0aG5hbWU7XG4gICAgICBwYXRoQXJyYXkgPSBwcmVQYXRoQXJyYXkgPz8gcGF0aG5hbWUuc3Vic3RyaW5nKDEpLnNwbGl0KFwiL1wiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcGF0aEFycmF5ID0gcHJlUGF0aEFycmF5ID8/IHBhdGhuYW1lLnN1YnN0cmluZygxKS5zcGxpdChcIi9cIik7XG4gICAgICBpZiAocnVudGltZS5hY2Nlc3NLZXkgJiYgcGF0aEFycmF5LmF0KDApICE9PSBydW50aW1lLmFjY2Vzc0tleSkge1xuICAgICAgICBjb25zdCBjb3JzSGVhZGVyczIgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgICAgICBpZiAob3B0aW9ucy5yYXdSZXNwb25zZSlcbiAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiBcIlwiLCBzdGF0dXM6IDQwMywgaGVhZGVyczogY29yc0hlYWRlcnMyIH07XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UodW5kZWZpbmVkLCB7XG4gICAgICAgICAgc3RhdHVzOiA0MDMsXG4gICAgICAgICAgaGVhZGVyczogY29yc0hlYWRlcnMyXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKHJ1bnRpbWUuaWdub3JlUGF0aExldmVsICE9PSB1bmRlZmluZWQgJiYgcnVudGltZS5pZ25vcmVQYXRoTGV2ZWwgIT09IDApXG4gICAgICAgIHBhdGhBcnJheSA9IHBhdGhBcnJheS5zbGljZShydW50aW1lLmlnbm9yZVBhdGhMZXZlbCk7XG4gICAgICBwYXRoU3RyaW5nID0gYC8ke3BhdGhBcnJheS5qb2luKFwiL1wiKX1gO1xuICAgIH1cbiAgICBjb25zdCBib2R5VGV4dCA9IG9wdGlvbnMucmVxdWVzdC5fX2JvZHlUZXh0O1xuICAgIGNvbnN0IGlwID0gcnVudGltZS5yZWFsSXAgPyBydW50aW1lLnJlYWxJcChvcHRpb25zLnJlcXVlc3QuaGVhZGVycykgOiBcIjo6MVwiO1xuICAgIGlmIChvcHRpb25zLmVudk1vZGUgPT09IFwidGVzdFwiICYmIHBhdGhTdHJpbmcuc3RhcnRzV2l0aChcIi8kZXZlbnQvXCIpKSB7XG4gICAgICBjb25zdCBiYXNlNjROYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhTdHJpbmcuc2xpY2UoOCkpO1xuICAgICAgbGV0IGV2ZW50TmFtZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgYXRvYiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGV2ZW50TmFtZSA9IGF0b2IoYmFzZTY0TmFtZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGV2ZW50TmFtZSA9IEJ1ZmZlci5mcm9tKGJhc2U2NE5hbWUsIFwiYmFzZTY0XCIpLnRvU3RyaW5nKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYmFzZTY0IGRlY29kZXIgYXZhaWxhYmxlXCIpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgY29uc3QgY29yc0hlYWRlcnMzID0gZ2V0Q29yc0hlYWRlcnMob3JpZ2luKTtcbiAgICAgICAgY29uc3QgYm9keTIgPSBKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IGZhbHNlLCBjb2RlOiBcIlBBUkFNU19UWVBFX05PVF9TVVBQT1JURURcIiwgcmVqZWN0OiB7IGV4cGVjdGVkOiBcInZhbGlkIGJhc2U2NCBldmVudCBuYW1lXCIgfSB9KTtcbiAgICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgICAgcmV0dXJuIHsgX19yYXdSZXNwb25zZTogdHJ1ZSwgYm9keTogYm9keTIsIHN0YXR1czogMjAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzMywgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9O1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGJvZHkyLCB7IHN0YXR1czogMjAwLCBoZWFkZXJzOiB7IC4uLmNvcnNIZWFkZXJzMywgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSB9KTtcbiAgICAgIH1cbiAgICAgIGxldCBldmVudERhdGEgPSB1bmRlZmluZWQ7XG4gICAgICBjb25zdCByYXdCb2R5ID0gYXdhaXQgcmVhZEJvZHlUZXh0KCk7XG4gICAgICBpZiAocmF3Qm9keSAmJiByYXdCb2R5ICE9PSBcIlwiICYmIHJhd0JvZHkgIT09IFwie31cIikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGV2ZW50RGF0YSA9IHJldml2ZUpTT05QYXJzZShKU09OLnBhcnNlKHJhd0JvZHkpKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgY29uc3QgY29yc0hlYWRlcnMzID0gZ2V0Q29yc0hlYWRlcnMob3JpZ2luKTtcbiAgICAgICAgICBjb25zdCBib2R5MiA9IEpTT04uc3RyaW5naWZ5KHsgc3VjY2VzczogZmFsc2UsIGNvZGU6IFwiUEFSQU1TX1RZUEVfTk9UX1NVUFBPUlRFRFwiLCByZWplY3Q6IHsgZXhwZWN0ZWQ6IFwianNvblwiIH0gfSk7XG4gICAgICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiBib2R5Miwgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IHsgLi4uY29yc0hlYWRlcnMzLCBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9IH07XG4gICAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5MiwgeyBzdGF0dXM6IDIwMCwgaGVhZGVyczogeyAuLi5jb3JzSGVhZGVyczMsIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0gfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNvbnN0IGV4ZWN1dGVJZDIgPSBfX2NyZWF0ZUlkKCk7XG4gICAgICBjb25zdCBjb3JzSGVhZGVyczIgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgICAgY29uc3QganNvbkhlYWRlcnMgPSB7IC4uLmNvcnNIZWFkZXJzMiwgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsIFwiQ2FjaGUtQ29udHJvbFwiOiBcIm5vLXN0b3JlXCIgfTtcbiAgICAgIGlmIChldmVudERhdGEgJiYgdHlwZW9mIGV2ZW50RGF0YSA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShldmVudERhdGEpICYmICEoXCJjb250ZXh0XCIgaW4gZXZlbnREYXRhKSkge1xuICAgICAgICBjb25zdCBjb250ZXh0MiA9IHt9O1xuICAgICAgICBjb250ZXh0Mi5yZWplY3QgPSByZWplY3Q7XG4gICAgICAgIGNvbnRleHQyLnJhaXNlID0gcmFpc2U7XG4gICAgICAgIGNvbnRleHQyLmRldmVsb3AgPSBydW50aW1lLmRldmVsb3A7XG4gICAgICAgIGNvbnRleHQyLmV4ZWN1dGVJZCA9IGV4ZWN1dGVJZDI7XG4gICAgICAgIGNvbnRleHQyLnBhdGggPSBwYXRoU3RyaW5nO1xuICAgICAgICBjb250ZXh0Mi5lbWl0ID0gcnVudGltZS5lbWl0O1xuICAgICAgICBjb250ZXh0Mi5lbWl0QW55QXBwcm92ZWQgPSBydW50aW1lLmVtaXRBbnlBcHByb3ZlZDtcbiAgICAgICAgY29udGV4dDIuZW1pdEFsbEFwcHJvdmVkID0gcnVudGltZS5lbWl0QWxsQXBwcm92ZWQ7XG4gICAgICAgIGNvbnRleHQyLl8gPSBydW50aW1lO1xuICAgICAgICBjb250ZXh0Mi5jb25maWcgPSBydW50aW1lLnJ1bnRpbWUuY29uZmlnO1xuICAgICAgICBjb250ZXh0Mi50eXBpYSA9IGdlbmVyYXRlZC50eXBpYVNjaGVtYTtcbiAgICAgICAgY29udGV4dDIuY2FsbCA9IChtb2R1bGUsIHBhcmFtcykgPT4gZXhlY3V0ZXIuX19jYWxsKGNvbnRleHQyLCBtb2R1bGUsIHBhcmFtcyk7XG4gICAgICAgIGNvbnRleHQyLm9uRmluYWxseSA9ICgpID0+IHt9O1xuICAgICAgICBjb25zdCBsb2dnZXIyID0gY3JlYXRlTG9nZ2VyKHJ1bnRpbWUsIHBhdGhTdHJpbmcsIGV4ZWN1dGVJZDIpO1xuICAgICAgICBjb250ZXh0Mi5sb2dnZXIgPSBsb2dnZXIyO1xuICAgICAgICBjb250ZXh0Mi5odHRwID0ge1xuICAgICAgICAgIGlwLFxuICAgICAgICAgIHBhcmFtczogeyBzdHJpbmc6IHJhd0JvZHkgPz8gXCJcIiwgcGFyc2VkOiBldmVudERhdGEgfSxcbiAgICAgICAgICByZXF1ZXN0OiBvcHRpb25zLnJlcXVlc3RcbiAgICAgICAgfTtcbiAgICAgICAgZXZlbnREYXRhLmNvbnRleHQgPSBjb250ZXh0MjtcbiAgICAgICAgY29uc3QgZW1pdEh0dHBSZXNwb25zZSA9IChzdWNjZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZDogZXhlY3V0ZUlkMiwgbG9nZ2VyOiBsb2dnZXIyLCBwYXRoOiBwYXRoU3RyaW5nLCBodHRwOiBjb250ZXh0Mi5odHRwLCBoZWFkZXJzOiBvcHRpb25zLnJlcXVlc3QuaGVhZGVycywgY29udGV4dDogY29udGV4dDIsIHN1Y2Nlc3MsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIpID8/IHRydWUpIHtcbiAgICAgICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIsIHsgZXhlY3V0ZUlkOiBleGVjdXRlSWQyLCBsb2dnZXI6IGxvZ2dlcjIsIHBhdGg6IHBhdGhTdHJpbmcsIG1ldGE6IHt9LCBjb250ZXh0OiBjb250ZXh0MiwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KGV2ZW50TmFtZSwgZXZlbnREYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZW1pdEVycm9yKSB7XG4gICAgICAgICAgY29uc3QgZXJyUmVzdWx0ID0gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQyLCBsb2dnZXIyLCBlbWl0RXJyb3IpO1xuICAgICAgICAgIGNvbnN0IGVyckJvZHkgPSBKU09OLnN0cmluZ2lmeShlcnJSZXN1bHQpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBlbWl0SHR0cFJlc3BvbnNlKGZhbHNlKTtcbiAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiBlcnJCb2R5LCBzdGF0dXM6IDIwMCwgaGVhZGVyczoganNvbkhlYWRlcnMgfTtcbiAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGVyckJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYXdhaXQgZW1pdEh0dHBSZXNwb25zZSh0cnVlKTtcbiAgICAgICAgfSBjYXRjaCB7fVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoZXZlbnROYW1lLCBldmVudERhdGEpO1xuICAgICAgICB9IGNhdGNoIChlbWl0RXJyb3IpIHtcbiAgICAgICAgICBjb25zdCBlcnJSZXN1bHQgPSBleGNlcHRpb25IYW5kbGVyKGV4ZWN1dGVJZDIsIG5vb3BMb2dnZXIsIGVtaXRFcnJvcik7XG4gICAgICAgICAgY29uc3QgZXJyQm9keSA9IEpTT04uc3RyaW5naWZ5KGVyclJlc3VsdCk7XG4gICAgICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgICAgICByZXR1cm4geyBfX3Jhd1Jlc3BvbnNlOiB0cnVlLCBib2R5OiBlcnJCb2R5LCBzdGF0dXM6IDIwMCwgaGVhZGVyczoganNvbkhlYWRlcnMgfTtcbiAgICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKGVyckJvZHksIHsgc3RhdHVzOiAyMDAsIGhlYWRlcnM6IGpzb25IZWFkZXJzIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBib2R5ID0gYHtcImRhdGFcIjoke0pTT04uc3RyaW5naWZ5KGV2ZW50RGF0YSA/PyB7fSwgKGtleSwgdmFsdWUpID0+IGtleSA9PT0gXCJjb250ZXh0XCIgPyB1bmRlZmluZWQgOiB2YWx1ZSl9LFwiZXhlY3V0ZUlkXCI6XCIke2V4ZWN1dGVJZDJ9XCIsXCJzdWNjZXNzXCI6dHJ1ZX1gO1xuICAgICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UpXG4gICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHksIHN0YXR1czogMjAwLCBoZWFkZXJzOiBqc29uSGVhZGVycyB9O1xuICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShib2R5LCB7IHN0YXR1czogMjAwLCBoZWFkZXJzOiBqc29uSGVhZGVycyB9KTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMucmF3UmVzcG9uc2UgJiYgIW9yaWdpbiAmJiBjaGVja05vRW1pdEhhbmRsZXJzKCkpIHtcbiAgICAgIGNvbnN0IF9faXNBY3Rpb24gPSBvcHRpb25zLnJlcXVlc3QuX19pc0FjdGlvbjtcbiAgICAgIGlmIChfX2lzQWN0aW9uICE9PSBmYWxzZSkge1xuICAgICAgICBsZXQgcm91dGVTY2hlbWEgPSBvcHRpb25zLnJvdXRlU2NoZW1hO1xuICAgICAgICBpZiAoIXJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgaWYgKHBhdGhTdHJpbmcgPT09IGNhY2hlZFBhdGhTdHJpbmcgJiYgY2FjaGVkUm91dGVTY2hlbWEpIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gY2FjaGVkUm91dGVTY2hlbWE7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gdHJpZS5nZXQocGF0aFN0cmluZyk7XG4gICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgY2FjaGVkUm91dGVTY2hlbWEgPSByb3V0ZVNjaGVtYTtcbiAgICAgICAgICAgICAgY2FjaGVkUGF0aFN0cmluZyA9IHBhdGhTdHJpbmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByb3V0ZVNjaGVtYSA9IGdlbmVyYXRlZC5yb3V0ZVNjaGVtYT8uW3BhdGhTdHJpbmddO1xuICAgICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgPT09IHVuZGVmaW5lZCkge30gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiByb3V0ZVNjaGVtYS5tb2R1bGUgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICByb3V0ZVNjaGVtYS5tb2R1bGUgPSBhd2FpdCByb3V0ZVNjaGVtYS5tb2R1bGUoKTtcbiAgICAgICAgICAgICAgICB0cmllLmFkZChwYXRoU3RyaW5nLCByb3V0ZVNjaGVtYSk7XG4gICAgICAgICAgICAgICAgY2FjaGVkUm91dGVTY2hlbWEgPSByb3V0ZVNjaGVtYTtcbiAgICAgICAgICAgICAgICBjYWNoZWRQYXRoU3RyaW5nID0gcGF0aFN0cmluZztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocm91dGVTY2hlbWEgJiYgcm91dGVTY2hlbWEudHlwZSA9PT0gXCJhY3Rpb25cIikge1xuICAgICAgICAgIGxldCB2YWxpZGF0ZVBhcmFtcyA9IGNhY2hlZFZhbGlkYXRlUGFyYW1zO1xuICAgICAgICAgIGxldCBoYW5kbGVyID0gY2FjaGVkSGFuZGxlcjtcbiAgICAgICAgICBsZXQgc2tpcFZhbGlkYXRpb24gPSBjYWNoZWRTa2lwVmFsaWRhdGlvbjtcbiAgICAgICAgICBpZiAocm91dGVTY2hlbWEgIT09IGNhY2hlZFJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgICB2YWxpZGF0ZVBhcmFtcyA9IHJvdXRlU2NoZW1hLnZhbGlkYXRlUGFyYW1zO1xuICAgICAgICAgICAgaGFuZGxlciA9IHJvdXRlU2NoZW1hLm1vZHVsZS5oYW5kbGVyO1xuICAgICAgICAgICAgY29uc3QgbWV0YSA9IHJvdXRlU2NoZW1hLm1vZHVsZT8ubWV0YTtcbiAgICAgICAgICAgIHNraXBWYWxpZGF0aW9uID0gbWV0YT8udHlwZVNhZmV0eSA9PT0gZmFsc2UgfHwgQXJyYXkuaXNBcnJheShtZXRhPy50eXBlU2FmZXR5KSAmJiAhbWV0YS50eXBlU2FmZXR5LmluY2x1ZGVzKFwicGFyYW1zXCIpO1xuICAgICAgICAgICAgY2FjaGVkVmFsaWRhdGVQYXJhbXMgPSB2YWxpZGF0ZVBhcmFtcztcbiAgICAgICAgICAgIGNhY2hlZEhhbmRsZXIgPSBoYW5kbGVyO1xuICAgICAgICAgICAgY2FjaGVkU2tpcFZhbGlkYXRpb24gPSBza2lwVmFsaWRhdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgZXhlY3V0ZUlkMiA9IF9fY3JlYXRlSWQoKTtcbiAgICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHlUZXh0KCk7XG4gICAgICAgICAgbGV0IHBhcmFtcztcbiAgICAgICAgICBsZXQgcGFyYW1zT2sgPSB0cnVlO1xuICAgICAgICAgIGlmICghYm9keSB8fCBib2R5ID09PSBcIlwiIHx8IGJvZHkgPT09IFwie31cIikge1xuICAgICAgICAgICAgcGFyYW1zID0ge307XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHBhcmFtcyA9IHJldml2ZUpTT05QYXJzZShKU09OLnBhcnNlKGJvZHkpKTtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09IFwidW5kZWZpbmVkXCIpXG4gICAgICAgICAgICAgICAgcGFyYW1zID0ge307XG4gICAgICAgICAgICB9IGNhdGNoIHtcbiAgICAgICAgICAgICAgcGFyYW1zT2sgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHBhcmFtc09rICYmIHBhcmFtcyAhPT0gbnVsbCAmJiB0eXBlb2YgcGFyYW1zID09PSBcIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KHBhcmFtcykpIHtcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVudk1vZGUgPT09IFwidGVzdFwiIHx8ICEoXCIkbWlsa2lvR2VuZXJhdGVQYXJhbXNcIiBpbiBwYXJhbXMpKSB7XG4gICAgICAgICAgICAgIGlmICghc2tpcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgICAgICBpZiAoIXZhbGlkYXRpb24uc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgICAgcGFyYW1zT2sgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHBhcmFtc09rKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29udGV4dDIgPSBPYmplY3QuY3JlYXRlKGJhc2VDb250ZXh0UHJvdG8pO1xuICAgICAgICAgICAgICAgIGNvbnRleHQyLnBhdGggPSBwYXRoU3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvbnRleHQyLnJvdXRlVHlwZSA9IFwiYWN0aW9uXCI7XG4gICAgICAgICAgICAgICAgY29udGV4dDIuZXhlY3V0ZUlkID0gZXhlY3V0ZUlkMjtcbiAgICAgICAgICAgICAgICBjb250ZXh0Mi5odHRwID0ge1xuICAgICAgICAgICAgICAgICAgdXJsOiBwYXRobmFtZSxcbiAgICAgICAgICAgICAgICAgIGlwLFxuICAgICAgICAgICAgICAgICAgcGF0aDogeyBzdHJpbmc6IHBhdGhTdHJpbmcsIGFycmF5OiBwYXRoQXJyYXkgfSxcbiAgICAgICAgICAgICAgICAgIHBhcmFtczogeyBzdHJpbmc6IGJvZHksIHBhcnNlZDogcGFyYW1zIH0sXG4gICAgICAgICAgICAgICAgICByZXF1ZXN0OiBvcHRpb25zLnJlcXVlc3QsXG4gICAgICAgICAgICAgICAgICByZXNwb25zZTogZmFzdFBhdGhSZXNwb25zZSxcbiAgICAgICAgICAgICAgICAgIGNvcnNcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGNvbnRleHQyLmhlYWRlcnMgPSBvcHRpb25zLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgaGFuZGxlcihjb250ZXh0MiwgcGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT09IHVuZGVmaW5lZCB8fCByZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IGVtcHR5UmVzdWx0UHJlZml4ICsgZXhlY3V0ZUlkMiArIGlkU3VmZml4LCBzdGF0dXM6IDIwMCwgaGVhZGVyczogZGVmYXVsdE1lcmdlZEhlYWRlcnMgfTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIUFycmF5LmlzQXJyYXkocmVzdWx0KSAmJiB0eXBlb2YgcmVzdWx0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IHJlc3VsdFByZWZpeCArIEpTT04uc3RyaW5naWZ5KHJlc3VsdCkgKyAnLFwiZXhlY3V0ZUlkXCI6XCInICsgZXhlY3V0ZUlkMiArIGlkU3VmZml4LCBzdGF0dXM6IDIwMCwgaGVhZGVyczogZGVmYXVsdE1lcmdlZEhlYWRlcnMgfTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIHt9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgY29yc0hlYWRlcnMgPSBnZXRDb3JzSGVhZGVycyhvcmlnaW4pO1xuICAgIGNvbnN0IHJhd0V4ZWN1dGVJZCA9IHJ1bnRpbWU/LmV4ZWN1dGVJZCA/IGF3YWl0IHJ1bnRpbWUuZXhlY3V0ZUlkKG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzKSA6IF9fY3JlYXRlSWQoKTtcbiAgICBjb25zdCBleGVjdXRlSWQgPSBzYW5pdGl6ZUV4ZWN1dGVJZChyYXdFeGVjdXRlSWQpIHx8IF9fY3JlYXRlSWQoKTtcbiAgICBjb25zdCBhbnlFbWl0SGFuZGxlcnMgPSAhY2hlY2tOb0VtaXRIYW5kbGVycygpO1xuICAgIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihydW50aW1lLCBwYXRoU3RyaW5nLCBleGVjdXRlSWQpO1xuICAgIGlmIChhbnlFbWl0SGFuZGxlcnMpXG4gICAgICBydW50aW1lLnJ1bnRpbWUucmVxdWVzdC5zZXQoZXhlY3V0ZUlkLCB7IGxvZ2dlciB9KTtcbiAgICBjb25zdCBiYXNlSGVhZGVycyA9IG9yaWdpbiA/IHsgLi4uY29yc0hlYWRlcnMsIC4uLmRlZmF1bHRSZXNwb25zZUhlYWRlcnMgfSA6IGRlZmF1bHRNZXJnZWRIZWFkZXJzO1xuICAgIGxldCBmaW5hbGVzID0gW107XG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBib2R5OiBcIlwiLFxuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBoZWFkZXJzOiB7IC4uLmJhc2VIZWFkZXJzIH1cbiAgICB9O1xuICAgIGNvbnN0IGlzUmF3UGF0aCA9IGdlbmVyYXRlZC5yYXdTY2hlbWE/LnJhd1BhdGhzPy5oYXMocGF0aFN0cmluZykgPz8gZmFsc2U7XG4gICAgY29uc3QgaHR0cCA9IHtcbiAgICAgIHVybDogcGF0aG5hbWUsXG4gICAgICBpcCxcbiAgICAgIHBhdGg6IHsgc3RyaW5nOiBwYXRoU3RyaW5nLCBhcnJheTogcGF0aEFycmF5IH0sXG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgc3RyaW5nOiBpc1Jhd1BhdGggPyBcIlwiIDogYXdhaXQgcmVhZEJvZHlUZXh0KCksXG4gICAgICAgIHBhcnNlZDogdW5kZWZpbmVkXG4gICAgICB9LFxuICAgICAgcmVxdWVzdDogb3B0aW9ucy5yZXF1ZXN0LFxuICAgICAgcmVzcG9uc2UsXG4gICAgICBjb3JzXG4gICAgfTtcbiAgICBjb25zdCBjb250ZXh0ID0geyByZWplY3QsIHJhaXNlIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGhhc0h0dHBSZXF1ZXN0SGFuZGxlcnMgPSBydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpodHRwUmVxdWVzdFwiKSA/PyB0cnVlO1xuICAgICAgaWYgKGhhc0h0dHBSZXF1ZXN0SGFuZGxlcnMpXG4gICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVxdWVzdFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgaWYgKG9wdGlvbnMuZW52TW9kZSAhPT0gXCJ0ZXN0XCIgJiYgaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikpIHtcbiAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICB0aHJvdyByZWplY3QoXCJOT1RfRk9VTkRcIiwgeyBwYXRoOiBodHRwLnBhdGguc3RyaW5nIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGlzUmF3UGF0aCkge1xuICAgICAgICBjb25zdCByYXdSb3V0ZSA9IGdlbmVyYXRlZC5yYXdTY2hlbWEucm91dGVzW3BhdGhTdHJpbmddO1xuICAgICAgICBpZiAoIXJhd1JvdXRlKSB7XG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICAgIHRocm93IHJlamVjdChcIk5PVF9GT1VORFwiLCB7IHBhdGg6IGh0dHAucGF0aC5zdHJpbmcgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IG1vZHVsZSA9IHJhd1JvdXRlLm1vZHVsZTtcbiAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgIG1vZHVsZSA9IGF3YWl0IG1vZHVsZSgpO1xuICAgICAgICAgIHJhd1JvdXRlLm1vZHVsZSA9IG1vZHVsZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtZXRhID0gbW9kdWxlPy5tZXRhID8/IHt9O1xuICAgICAgICBjb250ZXh0Lmh0dHAgPSBodHRwO1xuICAgICAgICBjb250ZXh0LmhlYWRlcnMgPSBodHRwLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgY29udGV4dC5kZXZlbG9wID0gcnVudGltZS5kZXZlbG9wO1xuICAgICAgICBjb250ZXh0LnBhdGggPSBwYXRoU3RyaW5nO1xuICAgICAgICBjb250ZXh0LnJvdXRlVHlwZSA9IFwicmF3XCI7XG4gICAgICAgIGNvbnRleHQubG9nZ2VyID0gbG9nZ2VyO1xuICAgICAgICBjb250ZXh0LmVtaXQgPSBydW50aW1lLmVtaXQ7XG4gICAgICAgIGNvbnRleHQuZW1pdEFueUFwcHJvdmVkID0gcnVudGltZS5lbWl0QW55QXBwcm92ZWQ7XG4gICAgICAgIGNvbnRleHQuZW1pdEFsbEFwcHJvdmVkID0gcnVudGltZS5lbWl0QWxsQXBwcm92ZWQ7XG4gICAgICAgIGNvbnRleHQuZXhlY3V0ZUlkID0gZXhlY3V0ZUlkO1xuICAgICAgICBjb250ZXh0LmNvbmZpZyA9IHJ1bnRpbWUucnVudGltZS5jb25maWc7XG4gICAgICAgIGNvbnRleHQudHlwaWEgPSBnZW5lcmF0ZWQudHlwaWFTY2hlbWE7XG4gICAgICAgIGNvbnRleHQuY2FsbCA9IChtb2QsIHBhcmFtcykgPT4gZXhlY3V0ZXIuX19jYWxsKGNvbnRleHQsIG1vZCwgcGFyYW1zKTtcbiAgICAgICAgY29udGV4dC5vbkZpbmFsbHkgPSAoaGFuZGxlcikgPT4gZmluYWxlcy51bnNoaWZ0KGhhbmRsZXIpO1xuICAgICAgICBjb250ZXh0Ll8gPSBydW50aW1lO1xuICAgICAgICBjb25zdCBoYW5kbGVyUmVxdWVzdCA9IGJvZHlUZXh0ICE9PSB1bmRlZmluZWQgPyBuZXcgUmVxdWVzdChvcHRpb25zLnJlcXVlc3QudXJsLCB7XG4gICAgICAgICAgbWV0aG9kOiBvcHRpb25zLnJlcXVlc3QubWV0aG9kLFxuICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgIGJvZHk6IGJvZHlUZXh0IHx8IG51bGwsXG4gICAgICAgICAgc2lnbmFsOiBvcHRpb25zLnJlcXVlc3Quc2lnbmFsXG4gICAgICAgIH0pIDogb3B0aW9ucy5yZXF1ZXN0O1xuICAgICAgICBjb25zdCByZXN1bHRzID0geyB2YWx1ZTogdW5kZWZpbmVkIH07XG4gICAgICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQmVmb3JlXCIpID8/IHRydWUpIHtcbiAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86ZXhlY3V0ZUJlZm9yZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBwYXRoU3RyaW5nLCBtZXRhLCBjb250ZXh0LCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJhd1Jlc3BvbnNlID0gYXdhaXQgbW9kdWxlLmhhbmRsZXIoY29udGV4dCwgaGFuZGxlclJlcXVlc3QpO1xuICAgICAgICByZXN1bHRzLnZhbHVlID0gcmF3UmVzcG9uc2U7XG4gICAgICAgIGlmIChydW50aW1lLl9oYXNFbWl0SGFuZGxlcnM/LihcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIikgPz8gdHJ1ZSkge1xuICAgICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpleGVjdXRlQWZ0ZXJcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogcGF0aFN0cmluZywgbWV0YSwgY29udGV4dCwgcmVzdWx0cywgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmaW5hbEhlYWRlcnMgPSBuZXcgSGVhZGVycyhyYXdSZXNwb25zZS5oZWFkZXJzKTtcbiAgICAgICAgZm9yIChjb25zdCBbaywgdl0gb2YgT2JqZWN0LmVudHJpZXMoY29yc0hlYWRlcnMpKSB7XG4gICAgICAgICAgaWYgKCFmaW5hbEhlYWRlcnMuaGFzKGspKVxuICAgICAgICAgICAgZmluYWxIZWFkZXJzLnNldChrLCB2KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNIdHRwUmVzcG9uc2VIYW5kbGVycyA9IHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaGFzSHR0cFJlc3BvbnNlSGFuZGxlcnMpXG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCBoZWFkZXJzOiBodHRwLnJlcXVlc3QuaGVhZGVycywgY29udGV4dCwgc3VjY2VzczogdHJ1ZSwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBmaW5hbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoXCJBbiBlcnJvciBvY2N1cnJlZCBpbnNpZGUgb25GaW5hbGx5LlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYXNPbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgIHJ1bnRpbWUucnVudGltZS5yZXF1ZXN0LmRlbGV0ZShleGVjdXRlSWQpO1xuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHJhd1Jlc3BvbnNlLmJvZHksIHtcbiAgICAgICAgICBzdGF0dXM6IHJhd1Jlc3BvbnNlLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiByYXdSZXNwb25zZS5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGZpbmFsSGVhZGVyc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5yZXF1ZXN0LmhlYWRlcnMuZ2V0KFwiQWNjZXB0XCIpPy5zdGFydHNXaXRoKFwidGV4dC9ldmVudC1zdHJlYW1cIikpIHtcbiAgICAgICAgbGV0IHJvdXRlU2NoZW1hID0gb3B0aW9ucy5yb3V0ZVNjaGVtYTtcbiAgICAgICAgaWYgKCFyb3V0ZVNjaGVtYSkge1xuICAgICAgICAgIGlmIChwYXRoU3RyaW5nID09PSBjYWNoZWRQYXRoU3RyaW5nICYmIGNhY2hlZFJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgICByb3V0ZVNjaGVtYSA9IGNhY2hlZFJvdXRlU2NoZW1hO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikpIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gdHJpZS5nZXQoaHR0cC5wYXRoLnN0cmluZyk7XG4gICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEgPSBnZW5lcmF0ZWQucm91dGVTY2hlbWE/LltodHRwLnBhdGguc3RyaW5nXTtcbiAgICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86aHR0cE5vdEZvdW5kXCIsIHsgZXhlY3V0ZUlkLCBsb2dnZXIsIHBhdGg6IGh0dHAucGF0aC5zdHJpbmcsIGh0dHAsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiTk9UX0ZPVU5EXCIsIHsgcGF0aDogaHR0cC5wYXRoLnN0cmluZyB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgICAgICAgICB0cmllLmFkZChodHRwLnBhdGguc3RyaW5nLCByb3V0ZVNjaGVtYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJvdXRlU2NoZW1hID0gdHJpZS5nZXQoaHR0cC5wYXRoLnN0cmluZyk7XG4gICAgICAgICAgICBpZiAocm91dGVTY2hlbWEgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEgPSBnZW5lcmF0ZWQucm91dGVTY2hlbWE/LltodHRwLnBhdGguc3RyaW5nXTtcbiAgICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBydW50aW1lLmVtaXQoXCJtaWxraW86aHR0cE5vdEZvdW5kXCIsIHsgZXhlY3V0ZUlkLCBsb2dnZXIsIHBhdGg6IGh0dHAucGF0aC5zdHJpbmcsIGh0dHAsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiTk9UX0ZPVU5EXCIsIHsgcGF0aDogaHR0cC5wYXRoLnN0cmluZyB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZTtcbiAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgICAgICAgICB0cmllLmFkZChodHRwLnBhdGguc3RyaW5nLCByb3V0ZVNjaGVtYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWNoZWRSb3V0ZVNjaGVtYSA9IHJvdXRlU2NoZW1hO1xuICAgICAgICAgICAgY2FjaGVkUGF0aFN0cmluZyA9IHBhdGhTdHJpbmc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChyb3V0ZVNjaGVtYS50eXBlICE9PSBcImFjdGlvblwiKVxuICAgICAgICAgICAgdGhyb3cgcmVqZWN0KFwiVU5BQ0NFUFRBQkxFXCIsIHsgZXhwZWN0ZWQ6IFwic3RyZWFtXCIsIG1lc3NhZ2U6IGBOb3QgYWNjZXB0YWJsZSwgdGhlIEFjY2VwdCBpbiB0aGUgcmVxdWVzdCBoZWFkZXIgc2hvdWxkIGJlIFwidGV4dC9ldmVudC1zdHJlYW1cIi4gSWYgeW91IGFyZSB1c2luZyB0aGUgXCJAbWlsa2lvL3N0YXJnYXRlXCIgcGFja2FnZSwgcGxlYXNlIGFkZCBcXGB0eXBlOiBcInN0cmVhbVwiXFxgIHRvIHRoZSBleGVjdXRlIG9wdGlvbnMuYCB9KTtcbiAgICAgICAgfVxuICAgICAgICBjb250ZXh0Lmh0dHAgPSBodHRwO1xuICAgICAgICBjb250ZXh0LmhlYWRlcnMgPSBodHRwLnJlcXVlc3QuaGVhZGVycztcbiAgICAgICAgY29udGV4dC5yb3V0ZVR5cGUgPSBcImFjdGlvblwiO1xuICAgICAgICBjb25zdCBleGVjdXRlZCA9IGF3YWl0IGV4ZWN1dGVyLl9fZXhlY3V0ZShyb3V0ZVNjaGVtYSwge1xuICAgICAgICAgIGNyZWF0ZWRFeGVjdXRlSWQ6IGV4ZWN1dGVJZCxcbiAgICAgICAgICBjcmVhdGVkTG9nZ2VyOiBsb2dnZXIsXG4gICAgICAgICAgcGF0aDogaHR0cC5wYXRoLnN0cmluZyxcbiAgICAgICAgICBoZWFkZXJzOiBvcHRpb25zLnJlcXVlc3QuaGVhZGVycyxcbiAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgIHBhcmFtczogaHR0cC5wYXJhbXMuc3RyaW5nLFxuICAgICAgICAgIHBhcmFtc1R5cGU6IFwic3RyaW5nXCIsXG4gICAgICAgICAgcGFyYW1zQ29udGVudFR5cGU6IFwianNvblwiXG4gICAgICAgIH0pO1xuICAgICAgICBmaW5hbGVzID0gZXhlY3V0ZWQuZmluYWxlcztcbiAgICAgICAgaWYgKHJlc3BvbnNlLmJvZHkgPT09IFwiXCIgJiYgZXhlY3V0ZWQucmVzdWx0cy52YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKGV4ZWN1dGVkLmVtcHR5UmVzdWx0KSB7XG4gICAgICAgICAgICByZXNwb25zZS5ib2R5ID0gYHtcImRhdGFcIjp7fSxcImV4ZWN1dGVJZFwiOlwiJHtleGVjdXRlSWR9XCIsXCJzdWNjZXNzXCI6dHJ1ZX1gO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXNwb25zZS5ib2R5ID0gYHtcImRhdGFcIjoke0pTT04uc3RyaW5naWZ5KGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUpfSxcImV4ZWN1dGVJZFwiOlwiJHtleGVjdXRlSWR9XCIsXCJzdWNjZXNzXCI6dHJ1ZX1gO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBoYXNIdHRwUmVzcG9uc2VIYW5kbGVycyA9IHJ1bnRpbWUuX2hhc0VtaXRIYW5kbGVycz8uKFwibWlsa2lvOmh0dHBSZXNwb25zZVwiKSA/PyB0cnVlO1xuICAgICAgICBpZiAoaGFzSHR0cFJlc3BvbnNlSGFuZGxlcnMpXG4gICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBSZXNwb25zZVwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCBoZWFkZXJzOiBodHRwLnJlcXVlc3QuaGVhZGVycywgY29udGV4dDogZXhlY3V0ZWQuY29udGV4dCwgc3VjY2VzczogdHJ1ZSwgcmVqZWN0LCByYWlzZSB9KTtcbiAgICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBmaW5hbGVzKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBsb2dnZXIuZXJyb3IoXCJBbiBlcnJvciBvY2N1cnJlZCBpbnNpZGUgb25GaW5hbGx5LlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChoYXNPbkxvZ2dlclN1Ym1pdHRpbmcpXG4gICAgICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgIHJ1bnRpbWUucnVudGltZS5yZXF1ZXN0LmRlbGV0ZShleGVjdXRlSWQpO1xuICAgICAgICBpZiAob3B0aW9ucy5yYXdSZXNwb25zZSkge1xuICAgICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IHJlc3BvbnNlLmJvZHksIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLCBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShyZXNwb25zZS5ib2R5LCByZXNwb25zZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcm91dGVTY2hlbWEgPSBvcHRpb25zLnJvdXRlU2NoZW1hO1xuICAgICAgICBpZiAoIXJvdXRlU2NoZW1hKSB7XG4gICAgICAgICAgcm91dGVTY2hlbWEgPSB0cmllLmdldChodHRwLnBhdGguc3RyaW5nKTtcbiAgICAgICAgICBpZiAoaHR0cC5wYXRoLnN0cmluZy5pbmNsdWRlcyhcIiRcIikgfHwgIWh0dHAucGF0aC5zdHJpbmcuZW5kc1dpdGgoXCJ+XCIpIHx8IHJvdXRlU2NoZW1hID09PSBudWxsKSB7XG4gICAgICAgICAgICByb3V0ZVNjaGVtYSA9IGdlbmVyYXRlZC5yb3V0ZVNjaGVtYT8uW2h0dHAucGF0aC5zdHJpbmddO1xuICAgICAgICAgICAgaWYgKHJvdXRlU2NoZW1hID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgYXdhaXQgcnVudGltZS5lbWl0KFwibWlsa2lvOmh0dHBOb3RGb3VuZFwiLCB7IGV4ZWN1dGVJZCwgbG9nZ2VyLCBwYXRoOiBodHRwLnBhdGguc3RyaW5nLCBodHRwLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgICAgICAgICB0aHJvdyByZWplY3QoXCJOT1RfRk9VTkRcIiwgeyBwYXRoOiBodHRwLnBhdGguc3RyaW5nIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHR5cGVvZiByb3V0ZVNjaGVtYS5tb2R1bGUgIT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgcm91dGVTY2hlbWEubW9kdWxlID0gYXdhaXQgcm91dGVTY2hlbWEubW9kdWxlO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICByb3V0ZVNjaGVtYS5tb2R1bGUgPSBhd2FpdCByb3V0ZVNjaGVtYS5tb2R1bGUoKTtcbiAgICAgICAgICAgIHRyaWUuYWRkKGh0dHAucGF0aC5zdHJpbmcsIHJvdXRlU2NoZW1hKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHJvdXRlU2NoZW1hLnR5cGUgIT09IFwic3RyZWFtXCIpXG4gICAgICAgICAgICB0aHJvdyByZWplY3QoXCJVTkFDQ0VQVEFCTEVcIiwgeyBleHBlY3RlZDogXCJzdHJlYW1cIiwgbWVzc2FnZTogYE5vdCBhY2NlcHRhYmxlLCB0aGUgQWNjZXB0IGluIHRoZSByZXF1ZXN0IGhlYWRlciBzaG91bGQgYmUgXCJhcHBsaWNhdGlvbi9qc29uXCIuIElmIHlvdSBhcmUgdXNpbmcgdGhlIFwiQG1pbGtpby9zdGFyZ2F0ZVwiIHBhY2thZ2UsIHBsZWFzZSByZW1vdmUgXFxgdHlwZTogXCJzdHJlYW1cIlxcYCB0byB0aGUgZXhlY3V0ZSBvcHRpb25zLmAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHN0cmVhbUNsb3NlZCA9IGZhbHNlO1xuICAgICAgICBjb25zdCBoYW5kbGVDbG9zZSA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBpZiAoc3RyZWFtQ2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIHN0cmVhbUNsb3NlZCA9IHRydWU7XG4gICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGZpbmFsZXMpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZXIoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIGxvZ2dlci5lcnJvcihcIkFuIGVycm9yIG9jY3VycmVkIGluc2lkZSBvbkZpbmFsbHkuXCIsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGhhc09uTG9nZ2VyU3VibWl0dGluZylcbiAgICAgICAgICAgIGF3YWl0IGxvZ2dlci5fLnN1Ym1pdChjb250ZXh0KTtcbiAgICAgICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICAgICAgcnVudGltZS5ydW50aW1lLnJlcXVlc3QuZGVsZXRlKGV4ZWN1dGVJZCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnRleHQuaHR0cCA9IGh0dHA7XG4gICAgICAgIGNvbnRleHQuaGVhZGVycyA9IGh0dHAucmVxdWVzdC5oZWFkZXJzO1xuICAgICAgICBjb250ZXh0LnJvdXRlVHlwZSA9IFwic3RyZWFtXCI7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVkID0gYXdhaXQgZXhlY3V0ZXIuX19leGVjdXRlKHJvdXRlU2NoZW1hLCB7XG4gICAgICAgICAgY3JlYXRlZEV4ZWN1dGVJZDogZXhlY3V0ZUlkLFxuICAgICAgICAgIGNyZWF0ZWRMb2dnZXI6IGxvZ2dlcixcbiAgICAgICAgICBwYXRoOiBodHRwLnBhdGguc3RyaW5nLFxuICAgICAgICAgIGhlYWRlcnM6IG9wdGlvbnMucmVxdWVzdC5oZWFkZXJzLFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgcGFyYW1zOiBodHRwLnBhcmFtcy5zdHJpbmcsXG4gICAgICAgICAgcGFyYW1zVHlwZTogXCJzdHJpbmdcIlxuICAgICAgICB9KTtcbiAgICAgICAgZmluYWxlcyA9IGV4ZWN1dGVkLmZpbmFsZXM7XG4gICAgICAgIHJlc3BvbnNlLmhlYWRlcnMgPSB7IC4uLnJlc3BvbnNlLmhlYWRlcnMsIC4uLmJ1aWxkQ29yc0hlYWRlcnMoaHR0cC5jb3JzLCBvcmlnaW4pIH07XG4gICAgICAgIGxldCBzdHJlYW07XG4gICAgICAgIGxldCBjb250cm9sO1xuICAgICAgICBpZiAodHlwZW9mIEJ1biAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHN0cmVhbSA9IG5ldyBSZWFkYWJsZVN0cmVhbSh7XG4gICAgICAgICAgICB0eXBlOiBcImRpcmVjdFwiLFxuICAgICAgICAgICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2wgPSBjb250cm9sbGVyO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIud3JpdGUoYGRhdGE6QCR7SlNPTi5zdHJpbmdpZnkoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB1bmRlZmluZWQsIGV4ZWN1dGVJZCB9KX1cblxuYCk7XG4gICAgICAgICAgICAgICAgZm9yIGF3YWl0IChjb25zdCB2YWx1ZSBvZiBleGVjdXRlZC5yZXN1bHRzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMucmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnN0cmluZ2lmeShbbnVsbCwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci53cml0ZShgZGF0YToke3Jlc3VsdH1cblxuYCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBleGVjdXRlZC5yZXN1bHRzLnZhbHVlLnJldHVybih1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVDbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VwdGlvbiA9IGV4Y2VwdGlvbkhhbmRsZXIoZXhlY3V0ZUlkLCBsb2dnZXIsIGVycm9yKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICAgICAgICAgICAgICByZXN1bHRbZXhjZXB0aW9uLmNvZGVdID0gZXhjZXB0aW9uLnJlamVjdDtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyLndyaXRlKGBkYXRhOiR7SlNPTi5zdHJpbmdpZnkoW3Jlc3VsdCwgbnVsbF0pfVxuXG5gKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCAwKSk7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3luYyBjYW5jZWwoKSB7XG4gICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgIGNvbnRyb2wuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHJlYW0gPSBuZXcgUmVhZGFibGVTdHJlYW0oe1xuICAgICAgICAgICAgYXN5bmMgcHVsbChjb250cm9sbGVyKSB7XG4gICAgICAgICAgICAgIGNvbnRyb2wgPSBjb250cm9sbGVyO1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShgZGF0YTpAJHtKU09OLnN0cmluZ2lmeSh7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IHVuZGVmaW5lZCwgZXhlY3V0ZUlkIH0pfVxuXG5gKTtcbiAgICAgICAgICAgICAgICBmb3IgYXdhaXQgKGNvbnN0IHZhbHVlIG9mIGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5yZXF1ZXN0LnNpZ25hbD8uYWJvcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXN1bHQgPSBKU09OLnN0cmluZ2lmeShbbnVsbCwgdmFsdWVdKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGBkYXRhOiR7cmVzdWx0fVxuXG5gKTtcbiAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVkLnJlc3VsdHMudmFsdWUucmV0dXJuKHVuZGVmaW5lZCk7XG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IGhhbmRsZUNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZXhjZXB0aW9uID0gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgICAgICAgIHJlc3VsdFtleGNlcHRpb24uY29kZV0gPSBleGNlcHRpb24ucmVqZWN0O1xuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXIuZW5xdWV1ZShgZGF0YToke0pTT04uc3RyaW5naWZ5KFtyZXN1bHQsIG51bGxdKX1cblxuYCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYXdhaXQgaGFuZGxlQ2xvc2UoKTtcbiAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMCkpO1xuICAgICAgICAgICAgICBjb250cm9sbGVyLmNsb3NlKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXN5bmMgY2FuY2VsKCkge1xuICAgICAgICAgICAgICBhd2FpdCBoYW5kbGVDbG9zZSgpO1xuICAgICAgICAgICAgICBjb250cm9sLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IHN0cmVhbTtcbiAgICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHsgLi4ucmVzcG9uc2UuaGVhZGVycywgXCJDb250ZW50LVR5cGVcIjogXCJ0ZXh0L2V2ZW50LXN0cmVhbVwiLCBcIkNhY2hlLUNvbnRyb2xcIjogXCJuby1jYWNoZVwiIH07XG4gICAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVzcG9uc2VcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogaHR0cC5wYXRoLnN0cmluZywgaHR0cCwgaGVhZGVyczogaHR0cC5yZXF1ZXN0LmhlYWRlcnMsIGNvbnRleHQ6IGV4ZWN1dGVkLmNvbnRleHQsIHN1Y2Nlc3M6IHRydWUsIHJlamVjdCwgcmFpc2UgfSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UocmVzcG9uc2UuYm9keSwgcmVzcG9uc2UpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCByZXN1bHRzID0ge1xuICAgICAgICB2YWx1ZTogZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpXG4gICAgICB9O1xuICAgICAgaWYgKHJlc3VsdHMudmFsdWUgIT09IHVuZGVmaW5lZClcbiAgICAgICAgcmVzcG9uc2UuYm9keSA9IEpTT04uc3RyaW5naWZ5KHJlc3VsdHMudmFsdWUpO1xuICAgICAgcmVzcG9uc2UuaGVhZGVycyA9IHsgLi4ucmVzcG9uc2UuaGVhZGVycywgLi4uY29yc0hlYWRlcnMgfTtcbiAgICAgIGF3YWl0IHJ1bnRpbWUuZW1pdChcIm1pbGtpbzpodHRwUmVzcG9uc2VcIiwgeyBleGVjdXRlSWQsIGxvZ2dlciwgcGF0aDogaHR0cC5wYXRoLnN0cmluZywgaHR0cCwgaGVhZGVyczogaHR0cC5yZXF1ZXN0LmhlYWRlcnMsIGNvbnRleHQsIHN1Y2Nlc3M6IGZhbHNlLCByZWplY3QsIHJhaXNlIH0pO1xuICAgICAgaWYgKGZpbmFsZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgZmluYWxlcykge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgbG9nZ2VyLmVycm9yKFwiQW4gZXJyb3Igb2NjdXJyZWQgaW5zaWRlIG9uRmluYWxseS5cIiwgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoaGFzT25Mb2dnZXJTdWJtaXR0aW5nKVxuICAgICAgICBhd2FpdCBsb2dnZXIuXy5zdWJtaXQoY29udGV4dCk7XG4gICAgICBpZiAoYW55RW1pdEhhbmRsZXJzKVxuICAgICAgICBydW50aW1lLnJ1bnRpbWUucmVxdWVzdC5kZWxldGUoZXhlY3V0ZUlkKTtcbiAgICAgIGlmIChvcHRpb25zLnJhd1Jlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiB7IF9fcmF3UmVzcG9uc2U6IHRydWUsIGJvZHk6IHJlc3BvbnNlLmJvZHksIHN0YXR1czogcmVzcG9uc2Uuc3RhdHVzLCBoZWFkZXJzOiByZXNwb25zZS5oZWFkZXJzIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHJlc3BvbnNlLmJvZHksIHJlc3BvbnNlKTtcbiAgICB9XG4gIH07XG4gIGNvbnN0IHN0cmVhbUNsb3NlcnMgPSBuZXcgTWFwO1xuICBjb25zdCBoYW5kbGVNZXNzYWdlID0gYXN5bmMgKHBvcnQyLCBvcHRpb25zKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBpZiAob3B0aW9ucyA9PT0gXCJQSU5HXCIpIHtcbiAgICAgICAgcG9ydDIucG9zdE1lc3NhZ2UoXCJQT05HXCIpO1xuICAgICAgfVxuICAgICAgaWYgKG9wdGlvbnMuc3RhcnRzV2l0aChcIkNMT1NFX1NUUkVBTTpcIikpIHtcbiAgICAgICAgY29uc3QgZXhlY3V0ZUlkID0gb3B0aW9ucy5zdWJzdHJpbmcoXCJDTE9TRV9TVFJFQU06XCIubGVuZ3RoKTtcbiAgICAgICAgY29uc3Qgc3RyZWFtQ2xvc2VyID0gc3RyZWFtQ2xvc2Vycy5nZXQoZXhlY3V0ZUlkKTtcbiAgICAgICAgaWYgKHN0cmVhbUNsb3Nlcikge1xuICAgICAgICAgIHN0cmVhbUNsb3Nlci5nZW5lcmF0b3IucmV0dXJuKHVuZGVmaW5lZCk7XG4gICAgICAgICAgc3RyZWFtQ2xvc2VyLmhhbmRsZUNsb3NlKFwic3RyZWFtXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCByb3V0ZVNjaGVtYSA9IHRyaWUuZ2V0KG9wdGlvbnMucGF0aCk7XG4gICAgaWYgKHJvdXRlU2NoZW1hID09PSBudWxsKSB7XG4gICAgICByb3V0ZVNjaGVtYSA9IGdlbmVyYXRlZC5yb3V0ZVNjaGVtYT8uW29wdGlvbnMucGF0aF07XG4gICAgICBpZiAocm91dGVTY2hlbWEgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB0aHJvdyByZWplY3QoXCJOT1RfRk9VTkRcIiwgeyBwYXRoOiBvcHRpb25zLnBhdGggfSk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHJvdXRlU2NoZW1hLm1vZHVsZSAhPT0gXCJmdW5jdGlvblwiKVxuICAgICAgICByb3V0ZVNjaGVtYS5tb2R1bGUgPSBhd2FpdCByb3V0ZVNjaGVtYS5tb2R1bGU7XG4gICAgICBlbHNlXG4gICAgICAgIHJvdXRlU2NoZW1hLm1vZHVsZSA9IGF3YWl0IHJvdXRlU2NoZW1hLm1vZHVsZSgpO1xuICAgICAgdHJpZS5hZGQob3B0aW9ucy5wYXRoLCByb3V0ZVNjaGVtYSk7XG4gICAgfVxuICAgIGNvbnN0IGhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpO1xuICAgIGNvbnN0IHBhcmFtcyA9IG9wdGlvbnMucGFyYW1zID8/IHt9O1xuICAgIGNvbnN0IGxvZ2dlciA9IGNyZWF0ZUxvZ2dlcihydW50aW1lLCBvcHRpb25zLnBhdGgsIG9wdGlvbnMuZXhlY3V0ZUlkKTtcbiAgICBsZXQgZmluYWxlcyA9IFtdO1xuICAgIGNvbnN0IGh0dHAgPSBuZXcgUHJveHkoe30sIHtcbiAgICAgIGdldDogKHRhcmdldCwgcHJvcGVydHkpID0+IHtcbiAgICAgICAgaWYgKHByb3BlcnR5ID09PSBcIm5vdEZvdW5kXCIpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0sXG4gICAgICBzZXQ6ICgpID0+IHtcbiAgICAgICAgdGhyb3cgcmVqZWN0KFwiVU5BQ0NFUFRBQkxFXCIsIHsgZXhwZWN0ZWQ6IFwiY29udGV4dC5odHRwXCIsIG1lc3NhZ2U6IFwiVGhpcyByZXF1ZXN0IHdhcyBpbnZva2VkIHRocm91Z2ggdGhlIGV4ZWN1dGUgbWV0aG9kLiBTaW5jZSBubyBhY3R1YWwgcmVxdWVzdCB3YXMgZ2VuZXJhdGVkLCB0aGUgSFRUUCBtZXRob2RzIHVuZGVyIHRoZSBjb250ZXh0IGNhbm5vdCBiZSBhY2Nlc3NlZC5cIiB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBoYW5kbGVDbG9zZSA9IGFzeW5jICh0eXBlKSA9PiB7XG4gICAgICBpZiAodHlwZSA9PT0gXCJzdHJlYW1cIilcbiAgICAgICAgc3RyZWFtQ2xvc2Vycy5kZWxldGUob3B0aW9ucy5leGVjdXRlSWQpO1xuICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGZpbmFsZXMpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCBoYW5kbGVyKCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgbG9nZ2VyLmVycm9yKFwiQW4gZXJyb3Igb2NjdXJyZWQgaW5zaWRlIG9uRmluYWxseS5cIiwgZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBhd2FpdCBsb2dnZXIuXy5zdWJtaXQoY29udGV4dCk7XG4gICAgICBydW50aW1lLnJ1bnRpbWUucmVxdWVzdC5kZWxldGUob3B0aW9ucy5leGVjdXRlSWQpO1xuICAgIH07XG4gICAgY29uc3QgY29udGV4dCA9IHsgaHR0cCwgaGVhZGVycywgcm91dGVUeXBlOiByb3V0ZVNjaGVtYS50eXBlLCByZWplY3QsIHJhaXNlIH07XG4gICAgdHJ5IHtcbiAgICAgIGlmIChyb3V0ZVNjaGVtYS50eXBlID09PSBcImFjdGlvblwiKSB7XG4gICAgICAgIGNvbnN0IGV4ZWN1dGVkID0gYXdhaXQgZXhlY3V0ZXIuX19leGVjdXRlKHJvdXRlU2NoZW1hLCB7XG4gICAgICAgICAgY3JlYXRlZEV4ZWN1dGVJZDogb3B0aW9ucy5leGVjdXRlSWQsXG4gICAgICAgICAgY3JlYXRlZExvZ2dlcjogbG9nZ2VyLFxuICAgICAgICAgIHBhdGg6IG9wdGlvbnMucGF0aCxcbiAgICAgICAgICBoZWFkZXJzLFxuICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgcGFyYW1zLFxuICAgICAgICAgIHBhcmFtc1R5cGU6IFwicmF3XCJcbiAgICAgICAgfSk7XG4gICAgICAgIGZpbmFsZXMgPSBleGVjdXRlZC5maW5hbGVzO1xuICAgICAgICBhd2FpdCBoYW5kbGVDbG9zZShcImFjdGlvblwiKTtcbiAgICAgICAgaWYgKGV4ZWN1dGVkLmVtcHR5UmVzdWx0KSB7XG4gICAgICAgICAgcG9ydDIucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgZXhlY3V0ZUlkOiBvcHRpb25zLmV4ZWN1dGVJZCxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiB1bmRlZmluZWRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwb3J0Mi5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLFxuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IGV4ZWN1dGVkLnJlc3VsdHMudmFsdWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHJvdXRlU2NoZW1hLnR5cGUgPT09IFwic3RyZWFtXCIpIHtcbiAgICAgICAgY29uc3QgZXhlY3V0ZWQgPSBhd2FpdCBleGVjdXRlci5fX2V4ZWN1dGUocm91dGVTY2hlbWEsIHtcbiAgICAgICAgICBjcmVhdGVkRXhlY3V0ZUlkOiBvcHRpb25zLmV4ZWN1dGVJZCxcbiAgICAgICAgICBjcmVhdGVkTG9nZ2VyOiBsb2dnZXIsXG4gICAgICAgICAgcGF0aDogb3B0aW9ucy5wYXRoLFxuICAgICAgICAgIGhlYWRlcnMsXG4gICAgICAgICAgY29udGV4dCxcbiAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgcGFyYW1zVHlwZTogXCJyYXdcIlxuICAgICAgICB9KTtcbiAgICAgICAgZmluYWxlcyA9IGV4ZWN1dGVkLmZpbmFsZXM7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcG9ydDIucG9zdE1lc3NhZ2UoeyBzdWNjZXNzOiB0cnVlLCBkYXRhOiB1bmRlZmluZWQsIGV4ZWN1dGVJZDogb3B0aW9ucy5leGVjdXRlSWQsIGRvbmU6IGZhbHNlIH0pO1xuICAgICAgICAgIHN0cmVhbUNsb3NlcnMuc2V0KG9wdGlvbnMuZXhlY3V0ZUlkLCB7IGdlbmVyYXRvcjogZXhlY3V0ZWQucmVzdWx0cy52YWx1ZSwgaGFuZGxlQ2xvc2UgfSk7XG4gICAgICAgICAgZm9yIGF3YWl0IChjb25zdCB2YWx1ZSBvZiBleGVjdXRlZC5yZXN1bHRzLnZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0geyBzdWNjZXNzOiB0cnVlLCBkYXRhOiBbbnVsbCwgdmFsdWVdLCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiBmYWxzZSB9O1xuICAgICAgICAgICAgcG9ydDIucG9zdE1lc3NhZ2UoZGF0YSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBvcnQyLnBvc3RNZXNzYWdlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogdW5kZWZpbmVkLCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiB0cnVlIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGNvbnN0IGV4Y2VwdGlvbiA9IGV4Y2VwdGlvbkhhbmRsZXIob3B0aW9ucy5leGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpO1xuICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgICAgICAgIHJlc3VsdFtleGNlcHRpb24uY29kZV0gPSBleGNlcHRpb24ucmVqZWN0O1xuICAgICAgICAgIHBvcnQyLnBvc3RNZXNzYWdlKHsgc3VjY2VzczogdHJ1ZSwgZGF0YTogW3Jlc3VsdCwgbnVsbF0sIGV4ZWN1dGVJZDogb3B0aW9ucy5leGVjdXRlSWQsIGRvbmU6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgYXdhaXQgaGFuZGxlQ2xvc2UoXCJzdHJlYW1cIik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGV4Y2VwdGlvbkhhbmRsZXIob3B0aW9ucy5leGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpO1xuICAgICAgYXdhaXQgbG9nZ2VyLl8uc3VibWl0KGNvbnRleHQpO1xuICAgICAgcG9ydDIucG9zdE1lc3NhZ2UoeyBzdWNjZXNzOiBmYWxzZSwgZGF0YTogdW5kZWZpbmVkLCBlcnJvcjogcmVzdWx0LCBleGVjdXRlSWQ6IG9wdGlvbnMuZXhlY3V0ZUlkLCBkb25lOiB0cnVlIH0pO1xuICAgIH1cbiAgfTtcbiAgcmV0dXJuIHtcbiAgICBwb3J0LFxuICAgIGZldGNoLFxuICAgIGhhbmRsZU1lc3NhZ2VcbiAgfTtcbn1cbi8vIHBhY2thZ2VzL21pbGtpby9leGNlcHRpb24vaW5kZXgudHNcbmZ1bmN0aW9uIHJlamVjdChjb2RlLCBkYXRhKSB7XG4gIGNvbnN0IGVycm9yID0geyAkbWlsa2lvUmVqZWN0OiB0cnVlLCBjb2RlLCBkYXRhIH07XG4gIGlmICh0eXBlb2YgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UgPT09IFwiZnVuY3Rpb25cIilcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnJvcik7XG4gIHJldHVybiBlcnJvcjtcbn1cbmZ1bmN0aW9uIHJhaXNlKG9iaikge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgY29uc3QgY29kZSA9IGtleXNbMF07XG4gIGlmIChjb2RlID09PSB1bmRlZmluZWQpXG4gICAgdGhyb3cgbmV3IEVycm9yKFwicmFpc2UoKSByZXF1aXJlcyBhbiBvYmplY3Qgd2l0aCBhdCBsZWFzdCBvbmUga2V5IGFzIHRoZSByZWplY3Rpb24gY29kZVwiKTtcbiAgY29uc3QgcmVqZWN0RGF0YSA9IG9ialtjb2RlXTtcbiAgY29uc3QgZXJyb3IgPSB7ICRtaWxraW9SZWplY3Q6IHRydWUsIGNvZGUsIGRhdGE6IHJlamVjdERhdGEgfTtcbiAgaWYgKHR5cGVvZiBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSA9PT0gXCJmdW5jdGlvblwiKVxuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKGVycm9yKTtcbiAgcmV0dXJuIGVycm9yO1xufVxuZnVuY3Rpb24gZXhjZXB0aW9uSGFuZGxlcihleGVjdXRlSWQsIGxvZ2dlciwgZXJyb3IpIHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgXCJ2aXRlU2VydmVyXCIgaW4gZ2xvYmFsVGhpcykge1xuICAgIHRyeSB7XG4gICAgICBnbG9iYWxUaGlzLnZpdGVTZXJ2ZXIuc3NyRml4U3RhY2t0cmFjZShlcnJvcik7XG4gICAgfSBjYXRjaCB7fVxuICB9XG4gIGNvbnN0IG5hbWUgPSBlcnJvcj8uY29kZSA/PyBlcnJvcj8ubmFtZSA/PyBlcnJvcj8uY29uc3RydWN0b3I/Lm5hbWUgPz8gXCJVbm5hbWVkIEV4Y2VwdGlvblwiO1xuICBpZiAoZXJyb3I/LiRtaWxraW9SZWplY3QgPT09IHRydWUpIHtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gXCJOT1RfRk9VTkRcIikge1xuICAgICAgbG9nZ2VyLmluZm8obmFtZSwgZXJyb3I/LmRhdGE/LnBhdGggPz8gXCJVbmtub3duIHBhdGhcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0YWNrID0gKGVycm9yPy5zdGFjayA/PyBcIlwiKS5zcGxpdChgXG5gKS5zbGljZSgyKS5qb2luKGBcbmApO1xuICAgICAgbG9nZ2VyLndhcm4obmFtZSwgYFxuJHtKU09OLnN0cmluZ2lmeShlcnJvcj8uZGF0YSl9YCwgYFxuJHtzdGFja31cbmApO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhY2sgPSBlcnJvcj8uc3RhY2sgPz8gXCJcIjtcbiAgICAgIGxvZ2dlci5lcnJvcihuYW1lLCBgXG4ke0pTT04uc3RyaW5naWZ5KGVycm9yPy5kYXRhKX1gLCBgXG4ke3N0YWNrfVxuYCk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgbG9nZ2VyLmVycm9yKG5hbWUsIGBcbiR7ZXJyb3I/LnRvU3RyaW5nKCl9YCwgYFxuJHtlcnJvcj8uc3RhY2t9XG5gKTtcbiAgICB9XG4gIH1cbiAgbGV0IHJlc3VsdDtcbiAgaWYgKGVycm9yPy4kbWlsa2lvUmVqZWN0ID09PSB0cnVlKVxuICAgIHJlc3VsdCA9IHsgc3VjY2VzczogZmFsc2UsIGNvZGU6IGVycm9yLmNvZGUsIHJlamVjdDogZXJyb3IuZGF0YSwgZXhlY3V0ZUlkIH07XG4gIGVsc2VcbiAgICByZXN1bHQgPSB7IHN1Y2Nlc3M6IGZhbHNlLCBjb2RlOiBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLCByZWplY3Q6IHVuZGVmaW5lZCwgZXhlY3V0ZUlkIH07XG4gIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnQge1xuICBfX2luaXRFdmVudE1hbmFnZXIsXG4gIF9faW5pdEV4ZWN1dGVyLFxuICBfX2luaXRMaXN0ZW5lcixcbiAgY29uZmlnLFxuICBjcmVhdGVGbG93LFxuICBjcmVhdGVMb2dnZXIsXG4gIGNyZWF0ZVN0ZXAsXG4gIGNyZWF0ZVdvcmxkLFxuICBlbnZUb0Jvb2xlYW4sXG4gIGVudlRvTnVtYmVyLFxuICBlbnZUb1N0cmluZyxcbiAgZXhjZXB0aW9uSGFuZGxlcixcbiAgcGFydCxcbiAgcmFpc2UsXG4gIHJlamVjdCxcbiAgdHlwZVNhZmV0eSxcbiAgdHlwaWFcbn07XG5cbi8vIyBkZWJ1Z0lkPUUxNzgyN0E2QzRCMjkwMDg2NDc1NkUyMTY0NzU2RTIxXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LGV3b2dJQ0oyWlhKemFXOXVJam9nTXl3S0lDQWljMjkxY21ObGN5STZJRnNpTGk0dmRYUnBiSE12Y0dGeWRDNTBjeUlzSUNJdUxpOTBlWEJsTFhOaFptVjBlUzlwYm1SbGVDNTBjeUlzSUNJdUxpOWpiMjVtYVdjdmFXNWtaWGd1ZEhNaUxDQWlMaTR2ZFhScGJITXZhR1ZoWkdWeWN5MTBieTFxYzI5dUxuUnpJaXdnSWk0dUwzVjBhV3h6TDIxbGNtZGxMV1JsWlhBdWRITWlMQ0FpTGk0dmRYUnBiSE12Y21WMmFYWmxMV3B6YjI0dGNHRnljMlV1ZEhNaUxDQWlMaTR2WlhobFkzVjBaUzlwYm1SbGVDNTBjeUlzSUNJdUxpOWxkbVZ1ZEM5cGJtUmxlQzUwY3lJc0lDSXVMaTltYkc5M0wybHVaR1Y0TG5Seklpd2dJaTR1TDNWMGFXeHpMMk55WldGMFpTMXBaQzUwY3lJc0lDSXVMaTlsZUdWamRYUmxMMlY0WldOMWRHVXRhV1F0WjJWdVpYSmhkRzl5TG5Seklpd2dJaTR1TDNkdmNteGtMMmx1WkdWNExuUnpJaXdnSWk0dUwzUjVjR2xoTDJsdVpHVjRMblJ6SWl3Z0lpNHVMM1YwYVd4ekwzTmxibVF0WTI5dmEySnZiMnN0WlhabGJuUXVkSE1pTENBaUxpNHZiRzluWjJWeUwybHVaR1Y0TG5Seklpd2dJaTR1TDNOMFpYQXZhVzVrWlhndWRITWlMQ0FpTGk0dmRYUnBiSE12ZEhKcFpTNTBjeUlzSUNJdUxpOTFkR2xzY3k5aWRXbHNaQzFqYjNKekxXaGxZV1JsY25NdWRITWlMQ0FpTGk0dmRYUnBiSE12YzJGdWFYUnBlbVV0WlhobFkzVjBaUzFwWkM1MGN5SXNJQ0l1TGk5c2FYTjBaVzVsY2k5cGJtUmxlQzUwY3lJc0lDSXVMaTlsZUdObGNIUnBiMjR2YVc1a1pYZ3VkSE1pWFN3S0lDQWljMjkxY21ObGMwTnZiblJsYm5RaU9pQmJDaUFnSUNBaVpYaHdiM0owSUdaMWJtTjBhVzl1SUhCaGNuUThWQ0JsZUhSbGJtUnpJQ2dwSUQwK0lIVnVhMjV2ZDI0K0tHaGhibVJzWlhJNklGUXBPaUJTWlhSMWNtNVVlWEJsUEZRK0lIdGNiaUFnY21WMGRYSnVJR2hoYm1Sc1pYSW9LU0JoY3lCMWJtdHViM2R1SUdGeklGSmxkSFZ5YmxSNWNHVThWRDQ3WEc1OVhHNGlMQW9nSUNBZ0ltVjRjRzl5ZENCMGVYQmxJRlI1Y0dWVFlXWmxkSGs4Vm1Gc2RXVWdaWGgwWlc1a2N5QlNaV052Y21ROFlXNTVMQ0JoYm5rK1BpQTlJQ2gyWVd4MVpUb2dWbUZzZFdVcElEMCtJRlI1Y0dWVFlXWmxkSGxXWVd4MVpUdGNibHh1Wlhod2IzSjBJR2x1ZEdWeVptRmpaU0JVZVhCbFUyRm1aWFI1Vm1Gc2RXVWdlMXh1SUNCMGVYQmxPaUE4Vkhsd1pTQmxlSFJsYm1SeklGSmxZMjl5WkR4aGJua3NJR0Z1ZVQ0K0tDa2dQVDRnVkhsd1pUdGNibjFjYmx4dVpYaHdiM0owSUdsdWRHVnlabUZqWlNCVWVYQmxVMkZtWlhSNVZIbHdaVHhVZVhCbElHVjRkR1Z1WkhNZ1VtVmpiM0prUEdGdWVTd2dZVzU1UGo0Z2UxeHVJQ0FrYldsc2EybHZWSGx3WlRvZ1hDSjBlWEJsTFhOaFptVjBlVndpTzF4dUlDQjJZV3gxWlRvZ1ZIbHdaVHRjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlIUjVjR1ZUWVdabGRIazhWbUZzZFdVZ1pYaDBaVzVrY3lCU1pXTnZjbVE4WVc1NUxDQmhibmsrUGloMllXeDFaVG9nVm1Gc2RXVXBPaUJVZVhCbFUyRm1aWFI1Vm1Gc2RXVWdlMXh1SUNCeVpYUjFjbTRnZTF4dUlDQWdJSFI1Y0dVNklDZ3BJRDArSUNoN0lDUnRhV3hyYVc5VWVYQmxPaUJjSW5SNWNHVXRjMkZtWlhSNVhDSXNJSFpoYkhWbElIMHBMRnh1SUNCOUlHRnpJR0Z1ZVR0Y2JuMWNiaUlzQ2lBZ0lDQWlaWGh3YjNKMElHWjFibU4wYVc5dUlHTnZibVpwWnp4RGIyNW1hV2RVSUdWNGRHVnVaSE1nUTI5dVptbG5QaWhqYjI1bWFXYzZJRU52Ym1acFoxUXBPaUJEYjI1bWFXZFVJSHRjYmlBZ2NtVjBkWEp1SUdOdmJtWnBaenRjYm4xY2JseHVaWGh3YjNKMElIUjVjR1VnUTI5dVptbG5JRDBnS0cxdlpHVTZJSE4wY21sdVp5a2dQVDRnVUhKdmJXbHpaVHhTWldOdmNtUThjM1J5YVc1bkxDQjFibXR1YjNkdVBqNGdmQ0JTWldOdmNtUThjM1J5YVc1bkxDQjFibXR1YjNkdVBqdGNibHh1Wlhod2IzSjBJR2x1ZEdWeVptRmpaU0JEYjI1bWFXZEZiblpwY205dWJXVnVkSE04VkNCbGVIUmxibVJ6SUVOdmJtWnBaejRnZTF4dUlDQmJhMlY1T2lCemRISnBibWRkT2lBb1pXNTJPaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK0tTQTlQaUJRWVhKMGFXRnNQRUYzWVdsMFpXUThVbVYwZFhKdVZIbHdaVHhVUGo0K0lId2dVSEp2YldselpUeFFZWEowYVdGc1BFRjNZV2wwWldROFVtVjBkWEp1Vkhsd1pUeFVQajQrUGp0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR1Z1ZGxSdlUzUnlhVzVuS0haaGJIVmxPaUJ6ZEhKcGJtY2dmQ0J1ZFcxaVpYSWdmQ0IxYm1SbFptbHVaV1FzSUdSbFptRjFiSFJXWVd4MVpUb2djM1J5YVc1bktTQjdYRzRnSUdsbUlDaDJZV3gxWlNBOVBUMGdkVzVrWldacGJtVmtLU0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJSEpsZEhWeWJpQmdKSHQyWVd4MVpYMWdPMXh1ZlZ4dVhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z1pXNTJWRzlPZFcxaVpYSW9kbUZzZFdVNklITjBjbWx1WnlCOElIVnVaR1ZtYVc1bFpDd2daR1ZtWVhWc2RGWmhiSFZsT2lCdWRXMWlaWElwSUh0Y2JpQWdhV1lnS0haaGJIVmxJRDA5UFNCMWJtUmxabWx1WldRcElISmxkSFZ5YmlCa1pXWmhkV3gwVm1Gc2RXVTdYRzVjYmlBZ2NtVjBkWEp1SUU1MWJXSmxjaTV3WVhKelpVbHVkQ2gyWVd4MVpTd2dNVEFwTzF4dWZWeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdaVzUyVkc5Q2IyOXNaV0Z1S0haaGJIVmxPaUJ6ZEhKcGJtY2dmQ0J1ZFcxaVpYSWdmQ0IxYm1SbFptbHVaV1FzSUdSbFptRjFiSFJXWVd4MVpUb2dZbTl2YkdWaGJpa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BUMDlJRndpZEhKMVpWd2lLU0J5WlhSMWNtNGdkSEoxWlR0Y2JseHVJQ0JwWmlBb2RtRnNkV1VnUFQwOUlGd2labUZzYzJWY0lpa2djbVYwZFhKdUlHWmhiSE5sTzF4dVhHNGdJR2xtSUNoMllXeDFaU0E5UFQwZ1hDSmNJaWtnY21WMGRYSnVJR1poYkhObE8xeHVYRzRnSUdsbUlDaDFibVJsWm1sdVpXUWdQVDA5SUhaaGJIVmxLU0J5WlhSMWNtNGdaR1ZtWVhWc2RGWmhiSFZsTzF4dVhHNGdJSEpsZEhWeWJpQkNiMjlzWldGdUtIWmhiSFZsS1R0Y2JuMWNiaUlzQ2lBZ0lDQWlaWGh3YjNKMElHWjFibU4wYVc5dUlHaGxZV1JsY25OVWIwcFRUMDRvYUdWaFpHVnljem9nU0dWaFpHVnljeWtnZTF4dUlDQmpiMjV6ZENCcWMyOXVPaUJTWldOdmNtUThjM1J5YVc1bkxDQnpkSEpwYm1jK0lEMGdlMzA3WEc0Z0lHWnZjaUFvWTI5dWMzUWdXMnRsZVN3Z2RtRnNkV1ZkSUc5bUlDaG9aV0ZrWlhKeklHRnpJR0Z1ZVNrdVpXNTBjbWxsY3lncEtTQjdYRzRnSUNBZ2FuTnZibHRyWlhsZElEMGdkbUZzZFdVN1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdwemIyNDdYRzU5WEc0aUxBb2dJQ0FnSW1aMWJtTjBhVzl1SUdselVHeGhhVzVQWW1wbFkzUW9kbUZzZFdVNklHRnVlU2s2SUhaaGJIVmxJR2x6SUZKbFkyOXlaRHh6ZEhKcGJtY3NJR0Z1ZVQ0Z2UxeHVJQ0J5WlhSMWNtNGdkSGx3Wlc5bUlIWmhiSFZsSUQwOVBTQmNJbTlpYW1WamRGd2lJQ1ltSUhaaGJIVmxJQ0U5UFNCdWRXeHNJQ1ltSUNGQmNuSmhlUzVwYzBGeWNtRjVLSFpoYkhWbEtUdGNibjFjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUcxbGNtZGxSR1ZsY0R4VUlHVjRkR1Z1WkhNZ1VtVmpiM0prUEhOMGNtbHVaeXdnWVc1NVBpd2dWU0JsZUhSbGJtUnpJRkpsWTI5eVpEeHpkSEpwYm1jc0lHRnVlVDQrS0hSaGNtZGxkRG9nVkN3Z2MyOTFjbU5sT2lCVktUb2dWQ0I3WEc0Z0lHTnZibk4wSUcxbGNtZGxaQ0E5SUhzZ0xpNHVkR0Z5WjJWMElIMDdYRzVjYmlBZ1ptOXlJQ2hqYjI1emRDQnJaWGtnYVc0Z2MyOTFjbU5sS1NCN1hHNGdJQ0FnYVdZZ0tDRlBZbXBsWTNRdWNISnZkRzkwZVhCbExtaGhjMDkzYmxCeWIzQmxjblI1TG1OaGJHd29jMjkxY21ObExDQnJaWGtwS1NCamIyNTBhVzUxWlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE52ZFhKalpWWmhiSFZsSUQwZ2MyOTFjbU5sVzJ0bGVWMDdYRzRnSUNBZ1kyOXVjM1FnZEdGeVoyVjBWbUZzZFdVZ1BTQjBZWEpuWlhSYmEyVjVJR0Z6SUd0bGVXOW1JRlJkTzF4dVhHNGdJQ0FnYVdZZ0tFOWlhbVZqZEM1d2NtOTBiM1I1Y0dVdWFHRnpUM2R1VUhKdmNHVnlkSGt1WTJGc2JDaDBZWEpuWlhRc0lHdGxlU2twSUh0Y2JpQWdJQ0FnSUdsbUlDaHBjMUJzWVdsdVQySnFaV04wS0hSaGNtZGxkRlpoYkhWbEtTQW1KaUJwYzFCc1lXbHVUMkpxWldOMEtITnZkWEpqWlZaaGJIVmxLU2tnZTF4dUlDQWdJQ0FnSUNCdFpYSm5aV1JiYTJWNUlHRnpJR3RsZVc5bUlGUWdKaUJyWlhsdlppQlZYU0E5SUcxbGNtZGxSR1ZsY0NoMFlYSm5aWFJXWVd4MVpTd2djMjkxY21ObFZtRnNkV1VwSUdGeklHRnVlVHRjYmlBZ0lDQWdJSDFjYmlBZ0lDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUNBZ0tHMWxjbWRsWkNCaGN5QmhibmtwVzJ0bGVWMGdQU0J6YjNWeVkyVldZV3gxWlR0Y2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnYldWeVoyVmtJR0Z6SUZRZ0ppQlZPMXh1ZlZ4dUlpd0tJQ0FnSUNKamIyNXpkQ0JwYzI5RVlYUmxVR0YwZEdWeWJpQTlJQzllS0Z4Y1pIczBmUzFjWEdSN01uMHRYRnhrZXpKOVZGeGNaSHN5ZlRwY1hHUjdNbjA2WEZ4a2V6SjlLRDg2WEZ3dVhGeGtlekVzTTMwcFB5a29XbnhiS3kxZFhGeGtleko5T2o5Y1hHUjdNbjBwUHlRdk8xeHVYRzVtZFc1amRHbHZiaUIwY25sUVlYSnpaVVJoZEdVb2MzUnlPaUJ6ZEhKcGJtY3BPaUJFWVhSbElId2diblZzYkNCN1hHNGdJQ0FnWTI5dWMzUWdiR1Z1SUQwZ2MzUnlMbXhsYm1kMGFEdGNiaUFnSUNCcFppQW9iR1Z1SUQ0OUlESXdJQ1ltSUd4bGJpQThQU0F6TWlBbUppQnpkSEl1WTJoaGNrTnZaR1ZCZENnd0tTQStQU0F3ZURNd0lDWW1JSE4wY2k1amFHRnlRMjlrWlVGMEtEQXBJRHc5SURCNE16a2dKaVlnYzNSeUxtbHVaR1Y0VDJZb0oxUW5LU0FoUFQwZ0xURXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV0YwWTJnZ1BTQnBjMjlFWVhSbFVHRjBkR1Z5Ymk1bGVHVmpLSE4wY2lrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2h0WVhSamFDQWhQVDBnYm5Wc2JDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWkdGMFpWQmhjblFnUFNCdFlYUmphRnN4WFR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIUjZVR0Z5ZENBOUlHMWhkR05vV3pKZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHUmhkR1ZRWVhKMElEMDlQU0IxYm1SbFptbHVaV1FwSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjZVR0Z5ZENBaFBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdibTl5YldGc2FYcGxaRlI2SUQwZ2RIcFFZWEowTG14bGJtZDBhQ0E5UFQwZ05TQW1KaUIwZWxCaGNuUXVZMmhoY2tGMEtETXBJQ0U5UFNCY0lqcGNJaUEvSUdBa2UzUjZVR0Z5ZEM1emJHbGpaU2d3TENBektYMDZKSHQwZWxCaGNuUXVjMnhwWTJVb015bDlZQ0E2SUhSNlVHRnlkRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdibVYzSUVSaGRHVW9aR0YwWlZCaGNuUWdLeUJ1YjNKdFlXeHBlbVZrVkhvcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlHNWxkeUJFWVhSbEtHUmhkR1ZRWVhKMElDc2dKMW9uS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdiblZzYkR0Y2JuMWNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJSEpsZG1sMlpVcFRUMDVRWVhKelpUeFVQaWhxYzI5dU9pQlVLVG9nVkNCN1hHNGdJQ0FnYVdZZ0tHcHpiMjRnUFQwOUlHNTFiR3dnZkh3Z2FuTnZiaUE5UFQwZ2RXNWtaV1pwYm1Wa0tTQnlaWFIxY200Z2FuTnZianRjYmlBZ0lDQnBaaUFvZEhsd1pXOW1JR3B6YjI0Z1BUMDlJQ2R2WW1wbFkzUW5LU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaHFjMjl1SUdsdWMzUmhibU5sYjJZZ1JHRjBaU2tnY21WMGRYSnVJR3B6YjI0N1hHNGdJQ0FnSUNBZ0lHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtHcHpiMjRwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnNaVzRnUFNCcWMyOXVMbXhsYm1kMGFEdGNiaUFnSUNBZ0lDQWdJQ0FnSUdadmNpQW9iR1YwSUdrZ1BTQXdPeUJwSUR3Z2JHVnVPeUJwS3lzcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCMklEMGdhbk52Ymx0cFhUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEhsd1pXOW1JSFlnUFQwOUlDZHpkSEpwYm1jbktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1FnUFNCMGNubFFZWEp6WlVSaGRHVW9kaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hrSUNFOVBTQnVkV3hzS1NCcWMyOXVXMmxkSUQwZ1pEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQjJJRDA5UFNBbmIySnFaV04wSnlBbUppQjJJQ0U5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkbWwyWlVwVFQwNVFZWEp6WlNoMktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdhbk52Ymp0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCdlltb2dQU0JxYzI5dUlHRnpJRkpsWTI5eVpEeHpkSEpwYm1jc0lIVnVhMjV2ZDI0K08xeHVJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR3RsZVNCcGJpQnZZbW9wSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaFQySnFaV04wTG5CeWIzUnZkSGx3WlM1b1lYTlBkMjVRY205d1pYSjBlUzVqWVd4c0tHOWlhaXdnYTJWNUtTa2dZMjl1ZEdsdWRXVTdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0IySUQwZ2IySnFXMnRsZVYwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUhZZ1BUMDlJQ2R6ZEhKcGJtY25LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaQ0E5SUhSeWVWQmhjbk5sUkdGMFpTaDJLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1pDQWhQVDBnYm5Wc2JDa2diMkpxVzJ0bGVWMGdQU0JrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdkaUE5UFQwZ0oyOWlhbVZqZENjZ0ppWWdkaUFoUFQwZ2JuVnNiQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRtbDJaVXBUVDA1UVlYSnpaU2gyS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYW5OdmJqdGNiaUFnSUNCOVhHNGdJQ0FnYVdZZ0tIUjVjR1Z2WmlCcWMyOXVJRDA5UFNBbmMzUnlhVzVuSnlrZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCa0lEMGdkSEo1VUdGeWMyVkVZWFJsS0dwemIyNHBPMXh1SUNBZ0lDQWdJQ0JwWmlBb1pDQWhQVDBnYm5Wc2JDa2djbVYwZFhKdUlHUWdZWE1nWVc1NU8xeHVJQ0FnSUgxY2JpQWdJQ0J5WlhSMWNtNGdhbk52Ymp0Y2JuMGlMQW9nSUNBZ0ltbHRjRzl5ZENCMGVYQmxJSHNnU1ZaaGJHbGtZWFJwYjI0Z2ZTQm1jbTl0SUZ3aWRIbHdhV0ZjSWp0Y2JtbHRjRzl5ZENCN0lISmxhbVZqZEN3Z2NtRnBjMlVnZlNCbWNtOXRJRndpTGk0dmFXNWtaWGd1ZEhOY0lqdGNibWx0Y0c5eWRDQjBlWEJsSUhzZ0pHTnZiblJsZUhRc0lDUnRaWFJoTENCTWIyZG5aWElzSUZKbGMzVnNkSE1zSUVkbGJtVnlZWFJsWkVsdWFYUWdmU0JtY205dElGd2lMaTR2YVc1a1pYZ3VkSE5jSWp0Y2JtbHRjRzl5ZENCN0lHaGxZV1JsY25OVWIwcFRUMDRnZlNCbWNtOXRJRndpTGk0dmRYUnBiSE12YUdWaFpHVnljeTEwYnkxcWMyOXVMblJ6WENJN1hHNXBiWEJ2Y25RZ2V5QnRaWEpuWlVSbFpYQWdmU0JtY205dElGd2lMaTR2ZFhScGJITXZiV1Z5WjJVdFpHVmxjQzUwYzF3aU8xeHVhVzF3YjNKMElIc2djbVYyYVhabFNsTlBUbEJoY25ObElIMGdabkp2YlNCY0lpNHVMM1YwYVd4ekwzSmxkbWwyWlMxcWMyOXVMWEJoY25ObExuUnpYQ0k3WEc1Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCZlgybHVhWFJGZUdWamRYUmxjaWhuWlc1bGNtRjBaV1E2SUVkbGJtVnlZWFJsWkVsdWFYUXNJSEoxYm5ScGJXVTZJR0Z1ZVNrZ2UxeHVJQ0FnSUdOdmJuTjBJRjlmWlhobFkzVjBaU0E5SUdGemVXNWpJQ2hjYmlBZ0lDQWdJQ0FnY205MWRHVlRZMmhsYldFNklHRnVlU3hjYmlBZ0lDQWdJQ0FnYjNCMGFXOXVjem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZM0psWVhSbFpFVjRaV04xZEdWSlpEb2djM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTNKbFlYUmxaRXh2WjJkbGNqb2dURzluWjJWeU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFEb2djM1J5YVc1bk8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYUdWaFpHVnljem9nVW1WamIzSmtQSE4wY21sdVp5d2djM1J5YVc1blBpQjhJRWhsWVdSbGNuTTdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwT2lCaGJua2dmQ0IxYm1SbFptbHVaV1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQndZWEpoYlhORGIyNTBaVzUwVkhsd1pUODZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdmU0FtSUNoY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpPaUJTWldOdmNtUThZVzU1TENCaGJuaytPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYSmhiWE5VZVhCbE9pQmNJbkpoZDF3aU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjhJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnlZVzF6T2lCemRISnBibWM3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzFSNWNHVTZJRndpYzNSeWFXNW5YQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdLU3hjYmlBZ0lDQXBPaUJRY205dGFYTmxQSHNnWlhobFkzVjBaVWxrT2lCemRISnBibWM3SUdobFlXUmxjbk02SUVobFlXUmxjbk03SUhCaGNtRnRjem9nVW1WamIzSmtQR0Z1ZVN3Z2RXNXJibTkzYmo0N0lISmxjM1ZzZEhNNklGSmxjM1ZzZEhNOFlXNTVQanNnWTI5dWRHVjRkRG9nSkdOdmJuUmxlSFE3SUcxbGRHRTZJRkpsWVdSdmJteDVQQ1J0WlhSaFBqc2dkSGx3WlRvZ1hDSmhZM1JwYjI1Y0lpQjhJRndpYzNSeVpXRnRYQ0k3SUdWdGNIUjVVbVZ6ZFd4ME9pQmliMjlzWldGdU95Qm1hVzVoYkdWek9pQkJjbkpoZVR3b0tTQTlQaUIyYjJsa0lId2dVSEp2YldselpUeDJiMmxrUGo0Z2ZUNGdQVDRnZTF4dUlDQWdJQ0FnSUNCamIyNXpkQ0IwZVhCbElEMGdiM0IwYVc5dWN5NXdZWFJvTG1WdVpITlhhWFJvS0Z3aWZsd2lLU0EvSUZ3aWMzUnlaV0Z0WENJZ09pQmNJbUZqZEdsdmJsd2lPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQmxlR1ZqZFhSbFNXUTZJSE4wY21sdVp5QTlJRzl3ZEdsdmJuTXVZM0psWVhSbFpFVjRaV04xZEdWSlpEdGNiaUFnSUNBZ0lDQWdiR1YwSUdobFlXUmxjbk02SUVobFlXUmxjbk03WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hLRzl3ZEdsdmJuTXVhR1ZoWkdWeWN5QnBibk4wWVc1alpXOW1JRWhsWVdSbGNuTXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJUZFhCd2IzSjBJR3hwWjJoMGQyVnBaMmgwSUdobFlXUmxjbk1nY0hKdmVIa2dkMmwwYUNCblpYUW9LU0J0WlhSb2IyUmNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ0tHOXdkR2x2Ym5NdWFHVmhaR1Z5Y3lCaGN5QmhibmtwUHk1blpYUWdQVDA5SUZ3aVpuVnVZM1JwYjI1Y0lpQW1KaUFoS0c5d2RHbHZibk11YUdWaFpHVnljeUJwYm5OMFlXNWpaVzltSUVobFlXUmxjbk1wS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3lBOUlHOXdkR2x2Ym5NdWFHVmhaR1Z5Y3lCaGN5QjFibXR1YjNkdUlHRnpJRWhsWVdSbGNuTTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVTJ0cGNDQjBiMHBUVDA0Z1ptOXlJR3hwWjJoMGQyVnBaMmgwSUhCeWIzaDVJQzBnYm05MElHNWxaV1JsWkNCcGJpQklWRlJRSUhKbGNYVmxjM1FnY0dGMGFGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCQWRITXRhV2R1YjNKbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHVmhaR1Z5Y3lBOUlHNWxkeUJJWldGa1pYSnpLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0xpNHViM0IwYVc5dWN5NW9aV0ZrWlhKekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaEtGd2lkRzlLVTA5T1hDSWdhVzRnYUdWaFpHVnljeWtwSUNob1pXRmtaWEp6SUdGeklHRnVlU2t1ZEc5S1UwOU9JRDBnS0NrZ1BUNGdhR1ZoWkdWeWMxUnZTbE5QVGlob1pXRmtaWEp6S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHaGxZV1JsY25NZ1BTQnZjSFJwYjI1ekxtaGxZV1JsY25NN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lTaGNJblJ2U2xOUFRsd2lJR2x1SUdobFlXUmxjbk1wS1NBb2FHVmhaR1Z5Y3lCaGN5QmhibmtwTG5SdlNsTlBUaUE5SUNncElEMCtJR2hsWVdSbGNuTlViMHBUVDA0b2FHVmhaR1Z5Y3lrN1hHNGdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0JqYjI1emRDQm1hVzVoYkdWek9pQkJjbkpoZVR4aGJuaytJRDBnVzEwN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUc5dVJtbHVZV3hzZVNBOUlDaG9ZVzVrYkdWeU9pQmhibmtwSUQwK0lHWnBibUZzWlhNdWRXNXphR2xtZENob1lXNWtiR1Z5S1R0Y2JseHVJQ0FnSUNBZ0lDQnNaWFFnY0dGeVlXMXpPaUJTWldOdmNtUThZVzU1TENCMWJtdHViM2R1UGp0Y2JpQWdJQ0FnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVjR0Z5WVcxelZIbHdaU0E5UFQwZ1hDSnlZWGRjSWlrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpJRDBnYjNCMGFXOXVjeTV3WVhKaGJYTTdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlIQmhjbUZ0Y3lBOVBUMGdYQ0oxYm1SbFptbHVaV1JjSWlrZ2NHRnlZVzF6SUQwZ2UzMDdYRzRnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JVzl3ZEdsdmJuTXVjR0Z5WVcxeklIeDhJRzl3ZEdsdmJuTXVjR0Z5WVcxeklEMDlQU0JjSWx3aUlIeDhJRzl3ZEdsdmJuTXVjR0Z5WVcxeklEMDlQU0JjSW50OVhDSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTWdQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvYUdWaFpHVnljeTVuWlhRb1hDSmpiMjUwWlc1MExYUjVjR1ZjSWlrL0xuTjBZWEowYzFkcGRHZ29YQ0poY0hCc2FXTmhkR2x2Ymk5cWMyOXVYQ0lwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnlZVzF6SUQwZ2NtVjJhWFpsU2xOUFRsQmhjbk5sS0VwVFQwNHVjR0Z5YzJVb2IzQjBhVzl1Y3k1d1lYSmhiWE1wS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUNobGNuSnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCeVpXcGxZM1FvWENKUVFWSkJUVk5mVkZsUVJWOU9UMVJmVTFWUVVFOVNWRVZFWENJc0lIc2daWGh3WldOMFpXUTZJRndpYW5OdmJsd2lMQ0JqYjI1MFpXNTBWSGx3WlRvZ2FHVmhaR1Z5Y3k1blpYUW9YQ0pqYjI1MFpXNTBMWFI1Y0dWY0lpa2dQejhnYm5Wc2JDd2djR0Z5WVcxek9pQnZjSFJwYjI1ekxuQmhjbUZ0Y3k1emJHbGpaU2d3TENBME1EazJLU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFI1Y0dWdlppQndZWEpoYlhNZ1BUMDlJRndpZFc1a1pXWnBibVZrWENJcElIQmhjbUZ0Y3lBOUlIdDlPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaG9aV0ZrWlhKekxtZGxkQ2hjSW1OdmJuUmxiblF0ZEhsd1pWd2lLVDh1YzNSaGNuUnpWMmwwYUNoY0ltRndjR3hwWTJGMGFXOXVMM2d0ZDNkM0xXWnZjbTB0ZFhKc1pXNWpiMlJsWkZ3aUtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHWnZjbTFFWVhSaElEMGdibVYzSUZWU1RGTmxZWEpqYUZCaGNtRnRjeWh2Y0hScGIyNXpMbkJoY21GdGN5azdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjeUE5SUh0OU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNKdFJHRjBZUzVtYjNKRllXTm9LQ2gyWVd4MVpTd2dhMlY1S1NBOVBpQndZWEpoYlhOYmEyVjVYU0E5SUhaaGJIVmxLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdOaGRHTm9JQ2hsY25KdmNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pRUVZKQlRWTmZWRmxRUlY5T1QxUmZVMVZRVUU5U1ZFVkVYQ0lzSUhzZ1pYaHdaV04wWldRNklGd2labTl5YlMxMWNteGxibU52WkdWa1hDSXNJR052Ym5SbGJuUlVlWEJsT2lCb1pXRmtaWEp6TG1kbGRDaGNJbU52Ym5SbGJuUXRkSGx3WlZ3aUtTQS9QeUJ1ZFd4c0xDQndZWEpoYlhNNklHOXdkR2x2Ym5NdWNHRnlZVzF6TG5Oc2FXTmxLREFzSURRd09UWXBJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQnBaaUFvYjNCMGFXOXVjeTV3WVhKaGJYTXVjM1JoY25SelYybDBhQ2hjSW50Y0lpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTWdQU0J5WlhacGRtVktVMDlPVUdGeWMyVW9TbE5QVGk1d1lYSnpaU2h2Y0hScGIyNXpMbkJoY21GdGN5a3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dLR1Z5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJSEpsYW1WamRDaGNJbEJCVWtGTlUxOVVXVkJGWDA1UFZGOVRWVkJRVDFKVVJVUmNJaXdnZXlCbGVIQmxZM1JsWkRvZ1hDSnFjMjl1WENJc0lHTnZiblJsYm5SVWVYQmxPaUJvWldGa1pYSnpMbWRsZENoY0ltTnZiblJsYm5RdGRIbHdaVndpS1NBL1B5QnVkV3hzTENCd1lYSmhiWE02SUc5d2RHbHZibk11Y0dGeVlXMXpMbk5zYVdObEtEQXNJRFF3T1RZcElIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJvY205M0lISmxhbVZqZENoY0lsQkJVa0ZOVTE5VVdWQkZYMDVQVkY5VFZWQlFUMUpVUlVSY0lpd2dleUJsZUhCbFkzUmxaRG9nWENKcWMyOXVYQ0lzSUdOdmJuUmxiblJVZVhCbE9pQm9aV0ZrWlhKekxtZGxkQ2hjSW1OdmJuUmxiblF0ZEhsd1pWd2lLU0EvUHlCdWRXeHNMQ0J3WVhKaGJYTTZJRzl3ZEdsdmJuTXVjR0Z5WVcxekxuTnNhV05sS0RBc0lEUXdPVFlwSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjR0Z5WVcxeklDRTlQU0JjSW05aWFtVmpkRndpSUh4OElFRnljbUY1TG1selFYSnlZWGtvY0dGeVlXMXpLU2tnZEdoeWIzY2djbVZxWldOMEtGd2lVRUZTUVUxVFgxUlpVRVZmVGs5VVgxTlZVRkJQVWxSRlJGd2lMQ0I3SUdWNGNHVmpkR1ZrT2lCY0ltcHpiMjVjSWl3Z1kyOXVkR1Z1ZEZSNWNHVTZJR2hsWVdSbGNuTXVaMlYwS0Z3aVkyOXVkR1Z1ZEMxMGVYQmxYQ0lwSUQ4L0lHNTFiR3dzSUhCaGNtRnRjem9nS0hSNWNHVnZaaUJ2Y0hScGIyNXpMbkJoY21GdGN5QTlQVDBnWENKemRISnBibWRjSWlBL0lHOXdkR2x2Ym5NdWNHRnlZVzF6SURvZ1NsTlBUaTV6ZEhKcGJtZHBabmtvYjNCMGFXOXVjeTV3WVhKaGJYTXBLUzV6YkdsalpTZ3dMQ0EwTURrMktTQjlLVHRjYmlBZ0lDQWdJQ0FnYVdZZ0tGd2lKRzFwYkd0cGIwZGxibVZ5WVhSbFVHRnlZVzF6WENJZ2FXNGdjR0Z5WVcxeklDWW1JSEJoY21GdGN5NGtiV2xzYTJsdlIyVnVaWEpoZEdWUVlYSmhiWE1nUFQwOUlGd2laVzVoWW14bFhDSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY25WdWRHbHRaUzVrWlhabGJHOXdLU0IwYUhKdmR5QnlaV3BsWTNRb1hDSk9UMVJmUkVWV1JVeFBVRjlOVDBSRlhDSXNJRndpVkdocGN5Qm1aV0YwZFhKbElHMTFjM1FnWW1VZ2FXNGdZMjl2YTJKdmIyc2dkRzhnZFhObExsd2lLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHUmxiR1YwWlNCd1lYSmhiWE11SkcxcGJHdHBiMGRsYm1WeVlYUmxVR0Z5WVcxek8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElIQmhjbUZ0YzFKaGJtUWdQU0J5YjNWMFpWTmphR1Z0WVM1eVlXNWtiMjFRWVhKaGJYTW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h3WVhKaGJYTlNZVzVrSUQwOVBTQjFibVJsWm1sdVpXUWdmSHdnY0dGeVlXMXpVbUZ1WkNBOVBUMGdiblZzYkNrZ2NHRnlZVzF6VW1GdVpDQTlJSHQ5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxeklEMGdiV1Z5WjJWRVpXVndLSEJoY21GdGN5d2djR0Z5WVcxelVtRnVaQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnZjSFJwYjI1ekxtTnlaV0YwWldSTWIyZG5aWEl1WkdWaWRXY29YQ0xpbktnZ2RHaGxJR2RsYm1WeVlYUmxaQ0J3WVhKaGJYTTZYQ0lzSUVwVFQwNHVjM1J5YVc1bmFXWjVLSEJoY21GdGN5a3BPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hiM0IwYVc5dWN5NWpiMjUwWlhoMFB5NW9kSFJ3UHk1dWIzUkdiM1Z1WkNBbUppQnZjSFJwYjI1ekxtTnZiblJsZUhRL0xtaDBkSEEvTG5CaGNtRnRjejh1YzNSeWFXNW5LU0J2Y0hScGIyNXpMbU52Ym5SbGVIUXVhSFIwY0M1d1lYSmhiWE11Y0dGeWMyVmtJRDBnY0dGeVlXMXpPMXh1WEc0Z0lDQWdJQ0FnSUdsbUlDZ2hiM0IwYVc5dWN5NWpiMjUwWlhoMEtTQnZjSFJwYjI1ekxtTnZiblJsZUhRZ1BTQjdmVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdZM1I0SUQwZ2IzQjBhVzl1Y3k1amIyNTBaWGgwTzF4dUlDQWdJQ0FnSUNCamRIZ3VaR1YyWld4dmNDQTlJSEoxYm5ScGJXVXVaR1YyWld4dmNEdGNiaUFnSUNBZ0lDQWdZM1I0TG5CaGRHZ2dQU0J2Y0hScGIyNXpMbkJoZEdnN1hHNGdJQ0FnSUNBZ0lHTjBlQzV5YjNWMFpWUjVjR1VnUFNCMGVYQmxPMXh1SUNBZ0lDQWdJQ0JqZEhndWJHOW5aMlZ5SUQwZ2IzQjBhVzl1Y3k1amNtVmhkR1ZrVEc5bloyVnlPMXh1SUNBZ0lDQWdJQ0JqZEhndVpXMXBkQ0E5SUhKMWJuUnBiV1V1WlcxcGREdGNiaUFnSUNBZ0lDQWdZM1I0TG1WdGFYUkJibmxCY0hCeWIzWmxaQ0E5SUhKMWJuUnBiV1V1WlcxcGRFRnVlVUZ3Y0hKdmRtVmtPMXh1SUNBZ0lDQWdJQ0JqZEhndVpXMXBkRUZzYkVGd2NISnZkbVZrSUQwZ2NuVnVkR2x0WlM1bGJXbDBRV3hzUVhCd2NtOTJaV1E3WEc0Z0lDQWdJQ0FnSUdOMGVDNWxlR1ZqZFhSbFNXUWdQU0J2Y0hScGIyNXpMbU55WldGMFpXUkZlR1ZqZFhSbFNXUTdYRzRnSUNBZ0lDQWdJR04wZUM1amIyNW1hV2NnUFNCeWRXNTBhVzFsTG5KMWJuUnBiV1V1WTI5dVptbG5PMXh1SUNBZ0lDQWdJQ0JqZEhndWRIbHdhV0VnUFNCblpXNWxjbUYwWldRdWRIbHdhV0ZUWTJobGJXRTdYRzRnSUNBZ0lDQWdJR04wZUM1allXeHNJRDBnS0cxdlpIVnNaVG9nWVc1NUxDQndZWEpoYlhNNklHRnVlU2tnUFQ0Z1gxOWpZV3hzS0dOMGVDd2diVzlrZFd4bExDQndZWEpoYlhNcE8xeHVJQ0FnSUNBZ0lDQmpkSGd1YjI1R2FXNWhiR3g1SUQwZ2IyNUdhVzVoYkd4NU8xeHVJQ0FnSUNBZ0lDQmpkSGd1WHlBOUlISjFiblJwYldVN1hHNGdJQ0FnSUNBZ0lHTjBlQzV5WldwbFkzUWdQU0J5WldwbFkzUTdYRzRnSUNBZ0lDQWdJR04wZUM1eVlXbHpaU0E5SUhKaGFYTmxPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEpsYzNWc2RITTZJRkpsYzNWc2RITThZVzU1UGlBOUlIc2dkbUZzZFdVNklIVnVaR1ZtYVc1bFpDQjlPMXh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzF2WkhWc1pTQTlJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaVHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV1YwWVNBOUlDaHRiMlIxYkdVL0xtMWxkR0VnUHlCdGIyUjFiR1UvTG0xbGRHRWdPaUI3ZlNrZ1lYTWdkVzVyYm05M2JpQmhjeUJTWldGa2IyNXNlVHdrYldWMFlUNDdYRzVjYmlBZ0lDQWdJQ0FnYVdZZ0tHOXdkR2x2Ym5NdVkyOXVkR1Y0ZEM1b2RIUndQeTV5WlhGMVpYTjBQeTV0WlhSb2IyUWdJVDA5SUhWdVpHVm1hVzVsWkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdZV3hzYjNkTlpYUm9iMlJ6SUQwZ2JXVjBZVDh1YldWMGFHOWtjeUEvUHlCYlhDSlFUMU5VWENKZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmhiR3h2ZDAxbGRHaHZaSE11YVc1amJIVmtaWE1vYjNCMGFXOXVjeTVqYjI1MFpYaDBMbWgwZEhBdWNtVnhkV1Z6ZEM1dFpYUm9iMlFwS1NCMGFISnZkeUJ5WldwbFkzUW9YQ0pOUlZSSVQwUmZUazlVWDBGTVRFOVhSVVJjSWl3Z2RXNWtaV1pwYm1Wa0tUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdsbUlDaHRaWFJoUHk1MGVYQmxVMkZtWlhSNUlEMDlQU0IxYm1SbFptbHVaV1FnZkh3Z2JXVjBZUzUwZVhCbFUyRm1aWFI1SUQwOVBTQjBjblZsSUh4OElDaEJjbkpoZVM1cGMwRnljbUY1S0cxbGRHRXVkSGx3WlZOaFptVjBlU2tnSmlZZ2JXVjBZUzUwZVhCbFUyRm1aWFI1TG1sdVkyeDFaR1Z6S0Z3aWNHRnlZVzF6WENJcEtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2FXUmhkR2x2YmlBOUlISnZkWFJsVTJOb1pXMWhMblpoYkdsa1lYUmxVR0Z5WVcxektIQmhjbUZ0Y3lrZ1lYTWdTVlpoYkdsa1lYUnBiMjQ4WVc1NVBqdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hkbUZzYVdSaGRHbHZiaTV6ZFdOalpYTnpLU0IwYUhKdmR5QnlaV3BsWTNRb1hDSlFRVkpCVFZOZlZGbFFSVjlKVGtOUFVsSkZRMVJjSWl3Z2V5QXVMaTRvZG1Gc2FXUmhkR2x2YmlCaGN5QmhibmtwTG1WeWNtOXljMXN3WFN3Z2JXVnpjMkZuWlRvZ1lGUm9aU0IyWVd4MVpTQW5KSHNvZG1Gc2FXUmhkR2x2YmlCaGN5QmhibmtwTG1WeWNtOXljMXN3WFM1d1lYUm9mU2NnYVhNZ0p5UjdLSFpoYkdsa1lYUnBiMjRnWVhNZ1lXNTVLUzVsY25KdmNuTmJNRjB1ZG1Gc2RXVjlKeXdnZDJocFkyZ2daRzlsY3lCdWIzUWdiV1ZsZENBbkpIc29kbUZzYVdSaGRHbHZiaUJoY3lCaGJua3BMbVZ5Y205eWMxc3dYUzVsZUhCbFkzUmxaSDBuSUhKbGNYVnBjbVZ0Wlc1MGN5NWdJSDBwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdhV1lnS0hKMWJuUnBiV1V1WDJoaGMwVnRhWFJJWVc1a2JHVnljejh1S0Z3aWJXbHNhMmx2T21WNFpXTjFkR1ZDWldadmNtVmNJaWtnUHo4Z2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbVY0WldOMWRHVkNaV1p2Y21WY0lpd2dleUJsZUdWamRYUmxTV1E2SUc5d2RHbHZibk11WTNKbFlYUmxaRVY0WldOMWRHVkpaQ3dnYkc5bloyVnlPaUJ2Y0hScGIyNXpMbU55WldGMFpXUk1iMmRuWlhJc0lIQmhkR2c2SUc5d2RHbHZibk11Y0dGMGFDd2diV1YwWVN3Z1kyOXVkR1Y0ZERvZ2IzQjBhVzl1Y3k1amIyNTBaWGgwTENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dUlDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdjbVZ6ZFd4MGN5NTJZV3gxWlNBOUlHRjNZV2wwSUcxdlpIVnNaUzVvWVc1a2JHVnlLRzl3ZEdsdmJuTXVZMjl1ZEdWNGRDd2djR0Z5WVcxektUdGNibHh1SUNBZ0lDQWdJQ0JzWlhRZ1pXMXdkSGxTWlhOMWJIUWdQU0JtWVd4elpUdGNiaUFnSUNBZ0lDQWdhV1lnS0hKbGMzVnNkSE11ZG1Gc2RXVWdQVDA5SUhWdVpHVm1hVzVsWkNCOGZDQnlaWE4xYkhSekxuWmhiSFZsSUQwOVBTQnVkV3hzSUh4OElISmxjM1ZzZEhNdWRtRnNkV1VnUFQwOUlGd2lYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1Z0Y0hSNVVtVnpkV3gwSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISmxjM1ZzZEhNdWRtRnNkV1VnUFNCN2ZUdGNiaUFnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtISmxjM1ZzZEhNdWRtRnNkV1VwSUh4OElIUjVjR1Z2WmlCeVpYTjFiSFJ6TG5aaGJIVmxJQ0U5UFNCY0ltOWlhbVZqZEZ3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pTUlZGVlJWTlVYMFpCU1V4Y0lpd2dYQ0pVYUdVZ2NtVjBkWEp1SUhSNWNHVWdiMllnZEdobElHaGhibVJzWlhJZ2JYVnpkQ0JpWlNCaGJpQW5iMkpxWldOMEp5d2dkMmhwWTJnZ2FYTWdZM1Z5Y21WdWRHeDVJR0Z1SUNja2UzUjVjR1Z2WmlCMGVYQmxiMllnY21WemRXeDBjeTUyWVd4MVpYMG5MbHdpS1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJR2xtSUNoeWRXNTBhVzFsTGw5b1lYTkZiV2wwU0dGdVpHeGxjbk0vTGloY0ltMXBiR3RwYnpwbGVHVmpkWFJsUVdaMFpYSmNJaWtnUHo4Z2RISjFaU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbVY0WldOMWRHVkJablJsY2x3aUxDQjdJR1Y0WldOMWRHVkpaRG9nYjNCMGFXOXVjeTVqY21WaGRHVmtSWGhsWTNWMFpVbGtMQ0JzYjJkblpYSTZJRzl3ZEdsdmJuTXVZM0psWVhSbFpFeHZaMmRsY2l3Z2NHRjBhRG9nYjNCMGFXOXVjeTV3WVhSb0xDQnRaWFJoTENCamIyNTBaWGgwT2lCdmNIUnBiMjV6TG1OdmJuUmxlSFFzSUhKbGMzVnNkSE1zSUhKbGFtVmpkQ3dnY21GcGMyVWdmU2s3WEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2V5QmxlR1ZqZFhSbFNXUXNJR2hsWVdSbGNuTXNJSEJoY21GdGN5d2djbVZ6ZFd4MGN5d2dZMjl1ZEdWNGREb2diM0IwYVc5dWN5NWpiMjUwWlhoMExDQnRaWFJoTENCMGVYQmxMQ0JsYlhCMGVWSmxjM1ZzZEN3Z1ptbHVZV3hsY3lCOU8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0JmWDJOaGJHd2dQU0JoYzNsdVl5QW9ZMjl1ZEdWNGREb2dKR052Ym5SbGVIUXNJRzF2WkhWc1pUb2dleUJ0WlhSaE9pQmhibmtzSUdoaGJtUnNaWEk2SUdGdWVTQjlMQ0J3WVhKaGJYTS9PaUJoYm5rcE9pQlFjbTl0YVhObFBHRnVlVDRnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCN0lHaGhibVJzWlhJZ2ZTQTlJR0YzWVdsMElHMXZaSFZzWlR0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdoaGJtUnNaWElvWTI5dWRHVjRkQ3dnY0dGeVlXMXpLVHRjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdjbVYwZFhKdUlIdGNiaUFnSUNBZ0lDQWdYMTlqWVd4c0xGeHVJQ0FnSUNBZ0lDQmZYMlY0WldOMWRHVXNYRzRnSUNBZ2ZUdGNibjBpTEFvZ0lDQWdJbWx0Y0c5eWRDQjBlWEJsSUhzZ0pHTnZiblJsZUhRc0lFTnZiblJsZUhSSWRIUndMQ0JTWlhOMWJIUnpMQ0JNYjJkblpYSXNJQ1J0WlhSaElIMGdabkp2YlNCY0lpNHVMMmx1WkdWNExuUnpYQ0k3WEc1Y2JtVjRjRzl5ZENCcGJuUmxjbVpoWTJVZ0pHVjJaVzUwY3lCN1hHNGdJQ0FnWENJcVhDSTZJSHNnYTJWNU9pQnJaWGx2WmlBa1pYWmxiblJ6TENCMllXeDFaVG9nWVc1NUlIMDdYRzRnSUNBZ1hDSnRhV3hyYVc4NmFIUjBjRkpsY1hWbGMzUmNJam9nZXlCbGVHVmpkWFJsU1dRNklITjBjbWx1WnpzZ2NHRjBhRG9nYzNSeWFXNW5PeUJzYjJkblpYSTZJRXh2WjJkbGNqc2dhSFIwY0RvZ1EyOXVkR1Y0ZEVoMGRIQThVbVZqYjNKa1BITjBjbWx1Wnl3Z1lXNTVQajRnZlR0Y2JpQWdJQ0JjSW0xcGJHdHBienBvZEhSd1VtVnpjRzl1YzJWY0lqb2dleUJsZUdWamRYUmxTV1E2SUhOMGNtbHVaenNnY0dGMGFEb2djM1J5YVc1bk95QnNiMmRuWlhJNklFeHZaMmRsY2pzZ2FIUjBjRG9nUTI5dWRHVjRkRWgwZEhBOFVtVmpiM0prUEhOMGNtbHVaeXdnWVc1NVBqNDdJR052Ym5SbGVIUTZJQ1JqYjI1MFpYaDBPeUJ6ZFdOalpYTnpPaUJpYjI5c1pXRnVJSDA3WEc0Z0lDQWdYQ0p0YVd4cmFXODZhSFIwY0U1dmRFWnZkVzVrWENJNklIc2daWGhsWTNWMFpVbGtPaUJ6ZEhKcGJtYzdJSEJoZEdnNklITjBjbWx1WnpzZ2JHOW5aMlZ5T2lCTWIyZG5aWEk3SUdoMGRIQTZJRU52Ym5SbGVIUklkSFJ3UEZKbFkyOXlaRHh6ZEhKcGJtY3NJR0Z1ZVQ0K0lIMDdYRzRnSUNBZ1hDSnRhV3hyYVc4NlpYaGxZM1YwWlVKbFptOXlaVndpT2lCN0lHVjRaV04xZEdWSlpEb2djM1J5YVc1bk95QndZWFJvT2lCemRISnBibWM3SUd4dloyZGxjam9nVEc5bloyVnlPeUJ0WlhSaE9pQWtiV1YwWVRzZ1kyOXVkR1Y0ZERvZ0pHTnZiblJsZUhRZ2ZUdGNiaUFnSUNCY0ltMXBiR3RwYnpwbGVHVmpkWFJsUVdaMFpYSmNJam9nZXlCbGVHVmpkWFJsU1dRNklITjBjbWx1WnpzZ2NHRjBhRG9nYzNSeWFXNW5PeUJzYjJkblpYSTZJRXh2WjJkbGNqc2diV1YwWVRvZ0pHMWxkR0U3SUdOdmJuUmxlSFE2SUNSamIyNTBaWGgwT3lCeVpYTjFiSFJ6T2lCU1pYTjFiSFJ6UEdGdWVUNGdmVHRjYm4xY2JseHVZMjl1YzNRZ1VrVlRUMHhXUlVSZlVGSlBUVWxUUlNBOUlGQnliMjFwYzJVdWNtVnpiMngyWlNncE8xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdYMTlwYm1sMFJYWmxiblJOWVc1aFoyVnlLQ2tnZTF4dUlDQWdJR052Ym5OMElHaGhibVJzWlhKeklEMGdibVYzSUUxaGNEd29aWFpsYm5RNklHRnVlU2tnUFQ0Z2RtOXBaQ3dnYzNSeWFXNW5QaWdwTzF4dUlDQWdJR052Ym5OMElHbHVaR1Y0WldRZ1BTQnVaWGNnVFdGd1BITjBjbWx1Wnl3Z1UyVjBQQ2hsZG1WdWREb2dZVzU1S1NBOVBpQlFjbTl0YVhObFBIWnZhV1FnZkNCaWIyOXNaV0Z1UGlCOElIWnZhV1FnZkNCaWIyOXNaV0Z1UGo0b0tUdGNiaUFnSUNCc1pYUWdYM1psY25OcGIyNGdQU0F3TzF4dVhHNGdJQ0FnWTI5dWMzUWdaWFpsYm5STllXNWhaMlZ5SUQwZ2UxeHVJQ0FnSUNBZ0lDQnZiam9nUEV0bGVTQmxlSFJsYm1SeklHdGxlVzltSUNSbGRtVnVkSE1zSUVoaGJtUnNaWElnWlhoMFpXNWtjeUFvWlhabGJuUTZJQ1JsZG1WdWRITmJTMlY1WFNrZ1BUNGdVSEp2YldselpUeDJiMmxrSUh3Z1ltOXZiR1ZoYmo0Z2ZDQjJiMmxrSUh3Z1ltOXZiR1ZoYmo0b2EyVjVPaUJMWlhrc0lHaGhibVJzWlhJNklFaGhibVJzWlhJcElEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lGOTJaWEp6YVc5dUt5czdYRzRnSUNBZ0lDQWdJQ0FnSUNCb1lXNWtiR1Z5Y3k1elpYUW9hR0Z1Wkd4bGNpd2dhMlY1SUdGeklITjBjbWx1WnlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2EyVjVJRDA5UFNBbktpY3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2FXNWtaWGhsWkM1b1lYTW9KeW9uS1NBOVBUMGdabUZzYzJVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVc1a1pYaGxaQzV6WlhRb0p5b25MQ0J1WlhjZ1UyVjBLQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0IzYVd4a1kyRnlaRk5sZENBOUlHbHVaR1Y0WldRdVoyVjBLQ2NxSnlraE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIZHBiR1JqWVhKa1UyVjBMbUZrWkNob1lXNWtiR1Z5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dsdVpHVjRaV1F1YUdGektHdGxlU0JoY3lCemRISnBibWNwSUQwOVBTQm1ZV3h6WlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwYm1SbGVHVmtMbk5sZENoclpYa2dZWE1nYzNSeWFXNW5MQ0J1WlhjZ1UyVjBLQ2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J6WlhRZ1BTQnBibVJsZUdWa0xtZGxkQ2hyWlhrZ1lYTWdjM1J5YVc1bktTRTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjMlYwTG1Ga1pDaG9ZVzVrYkdWeUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm9ZVzVrYkdWeWN5NWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR3RsZVNBOVBUMGdKeW9uS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIZHBiR1JqWVhKa1UyVjBJRDBnYVc1a1pYaGxaQzVuWlhRb0p5b25LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSGRwYkdSallYSmtVMlYwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCM2FXeGtZMkZ5WkZObGRDNWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J6WlhRZ1BTQnBibVJsZUdWa0xtZGxkQ2hyWlhrZ1lYTWdjM1J5YVc1bktUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tITmxkQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYzJWMExtUmxiR1YwWlNob1lXNWtiR1Z5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMDdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUc5bVpqb2dQRXRsZVNCbGVIUmxibVJ6SUd0bGVXOW1JQ1JsZG1WdWRITXNJRWhoYm1Sc1pYSWdaWGgwWlc1a2N5QW9aWFpsYm5RNklDUmxkbVZ1ZEhOYlMyVjVYU2tnUFQ0Z2RtOXBaRDRvYTJWNU9pQkxaWGtzSUdoaGJtUnNaWEk2SUVoaGJtUnNaWElwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUY5MlpYSnphVzl1S3lzN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2EyVjVJRDA5UFNBbktpY3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQjNhV3hrWTJGeVpGTmxkQ0E5SUdsdVpHVjRaV1F1WjJWMEtDY3FKeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRjNhV3hrWTJGeVpGTmxkQ2tnY21WMGRYSnVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hoYm1Sc1pYSnpMbVJsYkdWMFpTaG9ZVzVrYkdWeUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjNhV3hrWTJGeVpGTmxkQzVrWld4bGRHVW9hR0Z1Wkd4bGNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJSE5sZENBOUlHbHVaR1Y0WldRdVoyVjBLR3RsZVNCaGN5QnpkSEpwYm1jcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doYzJWMEtTQnlaWFIxY200N1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FHRnVaR3hsY25NdVpHVnNaWFJsS0doaGJtUnNaWElwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhObGRDNWtaV3hsZEdVb2FHRnVaR3hsY2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lHVnRhWFE2SUR4TFpYa2daWGgwWlc1a2N5QnJaWGx2WmlBa1pYWmxiblJ6TENCV1lXeDFaU0JsZUhSbGJtUnpJQ1JsZG1WdWRITmJTMlY1WFQ0b2EyVjVPaUJMWlhrc0lIWmhiSFZsT2lCV1lXeDFaU2s2SUZCeWIyMXBjMlU4ZG05cFpENGdQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2FDQTlJR2x1WkdWNFpXUXVaMlYwS0d0bGVTQmhjeUJ6ZEhKcGJtY3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZDJsc1pHTmhjbVJJWVc1a2JHVnljeUE5SUdsdVpHVjRaV1F1WjJWMEtDY3FKeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVhkcGJHUmpZWEprU0dGdVpHeGxjbk1nSmlZZ0lXZ3BJSEpsZEhWeWJpQlNSVk5QVEZaRlJGOVFVazlOU1ZORk8xeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kMmxzWkdOaGNtUklZVzVrYkdWeWN5QW1KaUJvS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUNoaGMzbHVZeUFvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2FHRnVaR3hsY2lCdlppQjNhV3hrWTJGeVpFaGhibVJzWlhKektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCb1lXNWtiR1Z5S0hzZ2EyVjVMQ0IyWVd4MVpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdoaGJtUnNaWElnYjJZZ2FDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2FHRnVaR3hsY2loMllXeDFaU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlLU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZDJsc1pHTmhjbVJJWVc1a2JHVnljeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUFvWVhONWJtTWdLQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdoaGJtUnNaWElnYjJZZ2QybHNaR05oY21SSVlXNWtiR1Z5Y3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnYUdGdVpHeGxjaWg3SUd0bGVTd2dkbUZzZFdVZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUtTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnS0dGemVXNWpJQ2dwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQm1iM0lnS0dOdmJuTjBJR2hoYm1Sc1pYSWdiMllnYUNFcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdhR0Z1Wkd4bGNpaDJZV3gxWlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNrb0tUdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ0FnWDJoaGMwVnRhWFJJWVc1a2JHVnljem9nS0d0bGVUb2djM1J5YVc1bktUb2dZbTl2YkdWaGJpQTlQaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2FXNWtaWGhsWkM1b1lYTW9hMlY1S1NCOGZDQnBibVJsZUdWa0xtaGhjeWduS2ljcE8xeHVJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0JuWlhRZ1gzWmxjbk5wYjI0b0tTQjdJSEpsZEhWeWJpQmZkbVZ5YzJsdmJqc2dmU3hjYmlBZ0lDQWdJQ0FnWlcxcGRFRnVlVUZ3Y0hKdmRtVmtPaUJoYzNsdVl5QThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdKR1YyWlc1MGN5d2dWbUZzZFdVZ1pYaDBaVzVrY3lBa1pYWmxiblJ6VzB0bGVWMCtLR3RsZVRvZ1MyVjVMQ0IyWVd4MVpUb2dWbUZzZFdVcE9pQlFjbTl0YVhObFBHSnZiMnhsWVc0K0lEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhkcGJHUmpZWEprU0dGdVpHeGxjbk1nUFNCcGJtUmxlR1ZrTG1kbGRDZ25LaWNwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdiR1YwSUdGalkyVndkR1ZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZDJsc1pHTmhjbVJJWVc1a2JHVnljeWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdadmNpQW9ZMjl1YzNRZ2FHRnVaR3hsY2lCdlppQjNhV3hrWTJGeVpFaGhibVJzWlhKektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDZ29ZWGRoYVhRZ2FHRnVaR3hsY2loN0lHdGxlU3dnZG1Gc2RXVWdmU2twSUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaFkyTmxjSFJsWkNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2dnUFNCcGJtUmxlR1ZrTG1kbGRDaHJaWGtnWVhNZ2MzUnlhVzVuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JvWVc1a2JHVnlJRzltSUdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0haaGJIVmxLU2tnUFQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGalkyVndkR1ZrSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQmhZMk5sY0hSbFpEdGNiaUFnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ0FnWlcxcGRFRnNiRUZ3Y0hKdmRtVmtPaUJoYzNsdVl5QThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdKR1YyWlc1MGN5d2dWbUZzZFdVZ1pYaDBaVzVrY3lBa1pYWmxiblJ6VzB0bGVWMCtLR3RsZVRvZ1MyVjVMQ0IyWVd4MVpUb2dWbUZzZFdVcE9pQlFjbTl0YVhObFBHSnZiMnhsWVc0K0lEMCtJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhkcGJHUmpZWEprU0dGdVpHeGxjbk1nUFNCcGJtUmxlR1ZrTG1kbGRDZ25LaWNwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdiR1YwSUdGd2NISnZkbVZrSUQwZ2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gzYVd4a1kyRnlaRWhoYm1Sc1pYSnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCb1lXNWtiR1Z5SUc5bUlIZHBiR1JqWVhKa1NHRnVaR3hsY25NcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0hzZ2EyVjVMQ0IyWVd4MVpTQjlLU2tnSVQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGd2NISnZkbVZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2dnUFNCcGJtUmxlR1ZrTG1kbGRDaHJaWGtnWVhNZ2MzUnlhVzVuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNob0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUNoamIyNXpkQ0JvWVc1a2JHVnlJRzltSUdncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDaGhkMkZwZENCb1lXNWtiR1Z5S0haaGJIVmxLU2tnSVQwOUlIUnlkV1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGd2NISnZkbVZrSUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdZWEJ3Y205MlpXUTdYRzRnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdmVHRjYmx4dUlDQWdJSEpsZEhWeWJpQmxkbVZ1ZEUxaGJtRm5aWEk3WEc1OVhHNGlMQW9nSUNBZ0ltVjRjRzl5ZENCMGVYQmxJRTFwYkd0cGIwWnNiM2M4VkN3Z1ZGSmxkSFZ5YmlBOUlHRnVlU3dnVkU1bGVIUWdQU0JoYm5rK0lEMGdlMXh1SUNCbGJXbDBPaUFvWm14dmR6b2dWQ2tnUFQ0Z2RtOXBaRHRjYmlBZ1cxTjViV0p2YkM1aGMzbHVZMGwwWlhKaGRHOXlYVG9nS0NrZ1BUNGdUV2xzYTJsdlJteHZkenhVUGp0Y2JpQWdibVY0ZENndUxpNWJkbUZzZFdWZE9pQmJYU0I4SUZ0VVRtVjRkRjBwT2lCUWNtOXRhWE5sUEVsMFpYSmhkRzl5VW1WemRXeDBQRlFzSUZSU1pYUjFjbTQrUGp0Y2JpQWdjbVYwZFhKdUtDazZJRkJ5YjIxcGMyVThTWFJsY21GMGIzSlNaWE4xYkhROFZDd2dWRkpsZEhWeWJqNCtPMXh1SUNCMGFISnZkeWhsY25KdmNqb2dZVzU1S1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHhVTENCVVVtVjBkWEp1UGo0N1hHNTlPMXh1WEc1bGVIQnZjblFnWm5WdVkzUnBiMjRnWTNKbFlYUmxSbXh2ZHp4VVBpZ3BPaUJOYVd4cmFXOUdiRzkzUEZRK0lIdGNiaUFnYkdWMElITjBZWFIxY3pvZ1hDSndaVzVrYVc1blhDSWdmQ0JjSW5KbGMyOXNkbVZrWENJZ2ZDQmNJbkpsYW1WamRHVmtYQ0lnUFNCY0luQmxibVJwYm1kY0lqdGNiaUFnWTI5dWMzUWdabXh2ZDNNNklFRnljbUY1UEh0Y2JpQWdJQ0JpYkdGdWF6b2dZbTl2YkdWaGJqdGNiaUFnSUNCd2NtOXRhWE5sT2lCUWNtOXRhWE5sUEZRK08xeHVJQ0FnSUhKbGMyOXNkbVU2SUNoMllXeDFaVDg2SUZRZ2ZDQlFjbTl0YVhObFRHbHJaVHhVUGlrZ1BUNGdkbTlwWkR0Y2JpQWdJQ0J5WldwbFkzUTZJQ2h5WldGemIyNC9PaUJoYm5rcElEMCtJSFp2YVdRN1hHNGdJSDArSUQwZ1cxMDdYRzVjYmlBZ1kyOXVjM1FnYVhSbGNtRjBiM0lnUFNCN1hHNGdJQ0FnWlcxcGREb2dLR1pzYjNjNklGUXBJRDArSUh0Y2JpQWdJQ0FnSUdsbUlDaG1iRzkzY3k1aGRDZ3RNU2svTG1Kc1lXNXJJRDA5UFNCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2wwWlcwZ1BTQm1iRzkzY3k1aGRDZ3RNU2toTzF4dUlDQWdJQ0FnSUNCcGRHVnRMbUpzWVc1cklEMGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lHbDBaVzB1Y21WemIyeDJaU2htYkc5M0tUdGNiaUFnSUNBZ0lDQWdjbVYwZFhKdU8xeHVJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnY21WemIyeDJaWEp6SUQwZ1VISnZiV2x6WlM1M2FYUm9VbVZ6YjJ4MlpYSnpQRlErS0NrN1hHNGdJQ0FnSUNBZ0lISmxjMjlzZG1WeWN5NXlaWE52YkhabEtHWnNiM2NwTzF4dUlDQWdJQ0FnSUNCbWJHOTNjeTV3ZFhOb0tIc2dMaTR1Y21WemIyeDJaWEp6TENCaWJHRnVhem9nWm1Gc2MyVWdmU0JoY3lCaGJua3BPMXh1SUNBZ0lDQWdmVnh1SUNBZ0lIMHNYRzRnSUNBZ0xpNHVLSHRjYmlBZ0lDQWdJR0Z6ZVc1aklHNWxlSFFvS1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHhVUGo0Z2UxeHVJQ0FnSUNBZ0lDQnBaaUFvYzNSaGRIVnpJQ0U5UFNCY0luQmxibVJwYm1kY0lpa2djbVYwZFhKdUlIc2daRzl1WlRvZ2RISjFaU3dnZG1Gc2RXVTZJRzUxYkd3Z2ZUdGNiaUFnSUNBZ0lDQWdhV1lnS0dac2IzZHpMbXhsYm1kMGFDQTlQVDBnTUNrZ2UxeHVJQ0FnSUNBZ0lDQWdJR052Ym5OMElISmxjMjlzZG1WeWN5QTlJRkJ5YjIxcGMyVXVkMmwwYUZKbGMyOXNkbVZ5Y3p4VVBpZ3BPMXh1SUNBZ0lDQWdJQ0FnSUdac2IzZHpMbkIxYzJnb2V5QXVMaTV5WlhOdmJIWmxjbk1zSUdKc1lXNXJPaUIwY25WbElIMGdZWE1nWVc1NUtUdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JqYjI1emRDQm1iRzkzSUQwZ1pteHZkM011WVhRb01Da2hPMXh1SUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE4xYkhRZ1BTQmhkMkZwZENCbWJHOTNMbkJ5YjIxcGMyVTdYRzRnSUNBZ0lDQWdJR1pzYjNkekxuTm9hV1owS0NrN1hHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCN0lHUnZibVU2SUhOMFlYUjFjeUFoUFQwZ1hDSndaVzVrYVc1blhDSXNJSFpoYkhWbE9pQnlaWE4xYkhRZ2ZUdGNiaUFnSUNBZ0lIMHNYRzRnSUNBZ0lDQmhjM2x1WXlCeVpYUjFjbTRvS1RvZ1VISnZiV2x6WlR4SmRHVnlZWFJ2Y2xKbGMzVnNkRHgyYjJsa1BqNGdlMXh1SUNBZ0lDQWdJQ0J6ZEdGMGRYTWdQU0JjSW5KbGMyOXNkbVZrWENJN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdabXh2ZHlCdlppQm1iRzkzY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJR1pzYjNjdVlteGhibXNnUFNCbVlXeHpaVHRjYmlBZ0lDQWdJQ0FnSUNCbWJHOTNMbkpsYzI5c2RtVW9kVzVrWldacGJtVmtLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnZXlCa2IyNWxPaUIwY25WbExDQjJZV3gxWlRvZ2JuVnNiQ0I5TzF4dUlDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUdGemVXNWpJSFJvY205M0tHVnljam9nWVc1NUtUb2dVSEp2YldselpUeEpkR1Z5WVhSdmNsSmxjM1ZzZER4MmIybGtQajRnZTF4dUlDQWdJQ0FnSUNCemRHRjBkWE1nUFNCY0luSmxhbVZqZEdWa1hDSTdYRzRnSUNBZ0lDQWdJR2xtSUNobWJHOTNjeTVzWlc1bmRHZ2dQVDA5SURBcElIdGNiaUFnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaWE52YkhabGNuTWdQU0JRY205dGFYTmxMbmRwZEdoU1pYTnZiSFpsY25NOFZENG9LVHRjYmlBZ0lDQWdJQ0FnSUNCbWJHOTNjeTV3ZFhOb0tIc2dMaTR1Y21WemIyeDJaWEp6TENCaWJHRnVhem9nZEhKMVpTQjlJR0Z6SUdGdWVTazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCbWJHOTNJRzltSUdac2IzZHpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ1pteHZkeTVpYkdGdWF5QTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJR1pzYjNjdWNtVnFaV04wS0dWeWNpazdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnY21WMGRYSnVJSHNnWkc5dVpUb2dkSEoxWlN3Z2RtRnNkV1U2SUc1MWJHd2dmVHRjYmlBZ0lDQWdJSDBzWEc0Z0lDQWdmU0J6WVhScGMyWnBaWE1nUVhONWJtTkpkR1Z5WVhSdmNqeDFibXR1YjNkdVBpa3NYRzRnSUNBZ1cxTjViV0p2YkM1aGMzbHVZMGwwWlhKaGRHOXlYU2dwSUh0Y2JpQWdJQ0FnSUhKbGRIVnliaUIwYUdsek8xeHVJQ0FnSUgwc1hHNGdJSDA3WEc1Y2JpQWdjbVYwZFhKdUlHbDBaWEpoZEc5eUlHRnpJRTFwYkd0cGIwWnNiM2M4VkQ0N1hHNTlYRzRpTEFvZ0lDQWdJbU52Ym5OMElFVk9RMDlFU1U1SElEMGdYQ0l3TVRJek5EVTJOemc1UVVKRFJFVkdSMGhKU2t0TVRVNVBVRkZTVTFSVlZsZFlXVnBoWW1Oa1pXWm5hR2xxYTJ4dGJtOXdjWEp6ZEhWMmQzaDVlbHdpTzF4dVkyOXVjM1FnUlU1RFQwUkpUa2RmVEVWT0lEMGdSVTVEVDBSSlRrY3ViR1Z1WjNSb08xeHVYRzVzWlhRZ1gxOW1ZWE4wU1dSUWIyOXNJRDBnYm1WM0lGVnBiblE0UVhKeVlYa29NalUyS1R0Y2JteGxkQ0JmWDJaaGMzUkpaRkJ2YjJ4SmJtUmxlQ0E5SURJMU5qdGNibXhsZENCZlgyWmhjM1JKWkVOdmRXNTBaWElnUFNBd08xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdYMTlqY21WaGRHVkpaQ2dwT2lCemRISnBibWNnZTF4dUlDQWdJR2xtSUNoZlgyWmhjM1JKWkZCdmIyeEpibVJsZUNBcklERTJJRDRnTWpVMktTQjdYRzRnSUNBZ0lDQWdJR055ZVhCMGJ5NW5aWFJTWVc1a2IyMVdZV3gxWlhNb1gxOW1ZWE4wU1dSUWIyOXNLVHRjYmlBZ0lDQWdJQ0FnWDE5bVlYTjBTV1JRYjI5c1NXNWtaWGdnUFNBd08xeHVJQ0FnSUgxY2JpQWdJQ0F2THlEbGlZMGdPQ0RsclpmbnJLWTZJT2FYdHVtWHRPYUlzeUJpWVhObE16YnZ2SWhFWVhSbExtNXZkeWdwTG5SdlUzUnlhVzVuS0RNMktTRG1tNy9rdTZNZ1FtbG5TVzUwNzd5TWZqRXdNSGdnNXB1MDViK3I3N3lKWEc0Z0lDQWdZMjl1YzNRZ2RITWdQU0JFWVhSbExtNXZkeWdwTG5SdlUzUnlhVzVuS0RNMktTNXdZV1JUZEdGeWRDZzRMQ0JjSWpCY0lpazdYRzRnSUNBZ0x5OGc1YTJYNTZ5bTVMaXk1b3U4NW82bDVwdS81THVqSUVGeWNtRjVMbVp5YjIwZ0t5QnFiMmx1Nzd5TTZZRy81WVdONXBXdzU3dUU1WWlHNllXTlhHNGdJQ0FnYkdWMElHbGtJRDBnZEhNN1hHNGdJQ0FnTHk4ZzVMaXQ2WmUwSURZZzVhMlg1NnltT2lEbnVxL3Btby9tbkxwY2JpQWdJQ0JtYjNJZ0tHeGxkQ0JwSUQwZ01Ec2dhU0E4SURZN0lHa3JLeWtnZTF4dUlDQWdJQ0FnSUNCcFpDQXJQU0JGVGtOUFJFbE9SeTVqYUdGeVFYUW9YMTltWVhOMFNXUlFiMjlzVzE5ZlptRnpkRWxrVUc5dmJFbHVaR1Y0S3l0ZElTQWxJRVZPUTA5RVNVNUhYMHhGVGlrN1hHNGdJQ0FnZlZ4dUlDQWdJQzh2SU9XUWppQXhNQ0RsclpmbnJLWTZJT2l1b2VhVnNPV1pxQ0FySU9tYWorYWN1dWEzdCtXUWlGeHVJQ0FnSUdOdmJuTjBJR052ZFc1MFpYSWdQU0JmWDJaaGMzUkpaRU52ZFc1MFpYSXJLenRjYmlBZ0lDQm1iM0lnS0d4bGRDQnBJRDBnTURzZ2FTQThJREV3T3lCcEt5c3BJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdiV2w0SUQwZ0tHTnZkVzUwWlhJZ0t5QmZYMlpoYzNSSlpGQnZiMnhiWDE5bVlYTjBTV1JRYjI5c1NXNWtaWGdyS3lBbElESTFObDBoS1NBbUlEQjRSa1pHUmp0Y2JpQWdJQ0FnSUNBZ2FXUWdLejBnUlU1RFQwUkpUa2N1WTJoaGNrRjBLRzFwZUNBbElFVk9RMDlFU1U1SFgweEZUaWs3WEc0Z0lDQWdmVnh1SUNBZ0lISmxkSFZ5YmlCcFpEdGNibjFjYmlJc0NpQWdJQ0FpYVcxd2IzSjBJSHNnWDE5amNtVmhkR1ZKWkNCOUlHWnliMjBnWENJdUxpOTFkR2xzY3k5amNtVmhkR1V0YVdRdWRITmNJanRjYmx4dVpYaHdiM0owSUhSNWNHVWdSWGhsWTNWMFpVbGtSMlZ1WlhKaGRHOXlJRDBnS0dobFlXUmxjbk0vT2lCSVpXRmtaWEp6S1NBOVBpQnpkSEpwYm1jZ2ZDQlFjbTl0YVhObFBITjBjbWx1Wno0N1hHNWNibVY0Y0c5eWRDQm1kVzVqZEdsdmJpQmtaV1pwYm1WRVpXWmhkV3gwUlhobFkzVjBaVWxrUjJWdVpYSmhkRzl5S0NrZ2UxeHVJQ0J5WlhSMWNtNGdYMTlqY21WaGRHVkpaRHRjYm4xY2JpSXNDaUFnSUNBaWFXMXdiM0owSUhzZ2RIbHdaU0FrZEhsd1pYTXNJRjlmYVc1cGRFeHBjM1JsYm1WeUxDQmZYMmx1YVhSRmVHVmpkWFJsY2l3Z1gxOXBibWwwUlhabGJuUk5ZVzVoWjJWeUxDQjBlWEJsSUVWNFpXTjFkR1ZKWkN3Z2RIbHdaU0JNYjJkblpYSXNJSFI1Y0dVZ1RXbDRhVzRzSUhSNWNHVWdSMlZ1WlhKaGRHVmtTVzVwZEN3Z2RIbHdaU0JRYVc1bkxDQjBlWEJsSUV4dloyZGxjbE4xWW0xcGRIUnBibWRJWVc1a2JHVnlMQ0IwZVhCbElFeHZaMmRsY2tsdWMyVnlkR2x1WjBoaGJtUnNaWElzSUhSNWNHVWdRMjl5YzBOdmJtWnBaeUI5SUdaeWIyMGdYQ0l1TGk5cGJtUmxlQzUwYzF3aU8xeHVhVzF3YjNKMElIc2daR1ZtYVc1bFJHVm1ZWFZzZEVWNFpXTjFkR1ZKWkVkbGJtVnlZWFJ2Y2lCOUlHWnliMjBnWENJdUxpOWxlR1ZqZFhSbEwyVjRaV04xZEdVdGFXUXRaMlZ1WlhKaGRHOXlMblJ6WENJN1hHNWNibVY0Y0c5eWRDQnBiblJsY21aaFkyVWdUV2xzYTJsdlNXNXBkQ0I3WEc0Z0lDQWdjRzl5ZERvZ2JuVnRZbVZ5TzF4dUlDQWdJR1JsZG1Wc2IzQTZJR0p2YjJ4bFlXNDdYRzRnSUNBZ1ptVjBZMmhGYm5ZL09pQW9hMlY1T2lCemRISnBibWNwSUQwK0lITjBjbWx1WnlCOElIVnVaR1ZtYVc1bFpEdGNiaUFnSUNCaFkyTmxjM05MWlhrL09pQnpkSEpwYm1jN1hHNGdJQ0FnYUhSMGNEODZJSHRjYmlBZ0lDQWdJQ0FnWTI5eWN6ODZJRU52Y25ORGIyNW1hV2M3WEc0Z0lDQWdmVHRjYmlBZ0lDQnBaMjV2Y21WUVlYUm9UR1YyWld3L09pQnVkVzFpWlhJN1hHNGdJQ0FnY21WaGJFbHdQem9nS0dobFlXUmxjbk02SUVobFlXUmxjbk1wSUQwK0lITjBjbWx1Wnp0Y2JpQWdJQ0JsZUdWamRYUmxTV1EvT2lBb2FHVmhaR1Z5Y3pvZ1NHVmhaR1Z5Y3lrZ1BUNGdjM1J5YVc1bklId2dVSEp2YldselpUeHpkSEpwYm1jK08xeHVJQ0FnSUc5dVRHOW5aMlZ5VTNWaWJXbDBkR2x1Wno4NklFeHZaMmRsY2xOMVltMXBkSFJwYm1kSVlXNWtiR1Z5TzF4dUlDQWdJRzl1VEc5bloyVnlTVzV6WlhKMGFXNW5Qem9nVEc5bloyVnlTVzV6WlhKMGFXNW5TR0Z1Wkd4bGNqdGNiaUFnSUNCaWIyOTBjM1J5WVhCelB6b2dRWEp5WVhrOEtIZHZjbXhrT2lCaGJua3BJRDArSUZCeWIyMXBjMlU4ZG05cFpENGdmQ0IyYjJsa1BqdGNibjFjYmx4dVpYaHdiM0owSUhSNWNHVWdUV2xzYTJsdlVuVnVkR2x0WlVsdWFYUThWQ0JsZUhSbGJtUnpJRTFwYkd0cGIwbHVhWFErSUQwZ1RXbDRhVzQ4WEc0Z0lDQWdWQ3hjYmlBZ0lDQjdYRzRnSUNBZ0lDQWdJR1Y0WldOMWRHVkpaRG9nS0dobFlXUmxjbk02SUVobFlXUmxjbk1wSUQwK0lITjBjbWx1WnlCOElGQnliMjFwYzJVOGMzUnlhVzVuUGp0Y2JpQWdJQ0FnSUNBZ2NuVnVkR2x0WlRvZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WeGRXVnpkRG9nVFdGd1BFVjRaV04xZEdWSlpDd2dleUJzYjJkblpYSTZJRXh2WjJkbGNpQjlQanRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibVpwWnpvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBDUjBlWEJsYzF0Y0ltZGxibVZ5WVhSbFpGd2lYVnRjSW1OdmJtWnBaMU5qYUdWdFlWd2lYVDQrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZWEJ3T2lCaGJuazdYRzRnSUNBZ0lDQWdJSDA3WEc0Z0lDQWdJQ0FnSUc5dU9pQkJkMkZwZEdWa1BGSmxkSFZ5YmxSNWNHVThkSGx3Wlc5bUlGOWZhVzVwZEVWMlpXNTBUV0Z1WVdkbGNqNCtXMXdpYjI1Y0lsMDdYRzRnSUNBZ0lDQWdJRzltWmpvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBIUjVjR1Z2WmlCZlgybHVhWFJGZG1WdWRFMWhibUZuWlhJK1BsdGNJbTltWmx3aVhUdGNiaUFnSUNBZ0lDQWdaVzFwZERvZ1FYZGhhWFJsWkR4U1pYUjFjbTVVZVhCbFBIUjVjR1Z2WmlCZlgybHVhWFJGZG1WdWRFMWhibUZuWlhJK1BsdGNJbVZ0YVhSY0lsMDdYRzRnSUNBZ0lDQWdJR1Z0YVhSQmJubEJjSEJ5YjNabFpEb2dRWGRoYVhSbFpEeFNaWFIxY201VWVYQmxQSFI1Y0dWdlppQmZYMmx1YVhSRmRtVnVkRTFoYm1GblpYSStQbHRjSW1WdGFYUkJibmxCY0hCeWIzWmxaRndpWFR0Y2JpQWdJQ0FnSUNBZ1pXMXBkRUZzYkVGd2NISnZkbVZrT2lCQmQyRnBkR1ZrUEZKbGRIVnlibFI1Y0dVOGRIbHdaVzltSUY5ZmFXNXBkRVYyWlc1MFRXRnVZV2RsY2o0K1cxd2laVzFwZEVGc2JFRndjSEp2ZG1Wa1hDSmRPMXh1SUNBZ0lDQWdJQ0JmYUdGelJXMXBkRWhoYm1Sc1pYSnpPaUJCZDJGcGRHVmtQRkpsZEhWeWJsUjVjR1U4ZEhsd1pXOW1JRjlmYVc1cGRFVjJaVzUwVFdGdVlXZGxjajQrVzF3aVgyaGhjMFZ0YVhSSVlXNWtiR1Z5YzF3aVhUdGNiaUFnSUNBZ0lDQWdYMlZ0YVhSSVlXNWtiR1Z5YzFabGNuTnBiMjQ2SUc1MWJXSmxjanRjYmlBZ0lDQjlYRzQrTzF4dVhHNWxlSEJ2Y25RZ1lYTjVibU1nWm5WdVkzUnBiMjRnWTNKbFlYUmxWMjl5YkdROFRXbHNhMmx2VDNCMGFXOXVjeUJsZUhSbGJtUnpJRTFwYkd0cGIwbHVhWFErS0dkbGJtVnlZWFJsWkRvZ1IyVnVaWEpoZEdWa1NXNXBkQ3dnWTI5dVptbG5VMk5vWlcxaE9pQjdJR2RsZERvZ0tDa2dQVDRnVUhKdmJXbHpaVHhTWldOdmNtUThZVzU1TENCaGJuaytQaUI5TENCdmNIUnBiMjV6T2lCTmFXeHJhVzlQY0hScGIyNXpLVG9nVUhKdmJXbHpaVHhOYVd4cmFXOVhiM0pzWkR4SFpXNWxjbUYwWldSSmJtbDBMQ0JOYVd4cmFXOVBjSFJwYjI1elBqNGdlMXh1SUNBZ0lHTnZibk4wSUdWNFpXTjFkR1ZKWkNBOUlHOXdkR2x2Ym5NdVpYaGxZM1YwWlVsa0lEOC9JR1JsWm1sdVpVUmxabUYxYkhSRmVHVmpkWFJsU1dSSFpXNWxjbUYwYjNJb0tUdGNiaUFnSUNCamIyNXpkQ0JqYjI1bWFXY2dQU0JoZDJGcGRDQmpiMjVtYVdkVFkyaGxiV0V1WjJWMEtDazdYRzVjYmlBZ0lDQmpiMjV6ZENCeWRXNTBhVzFsSUQwZ2UxeHVJQ0FnSUNBZ0lDQnlaWEYxWlhOME9pQnVaWGNnVFdGd0tDa3NYRzRnSUNBZ0lDQWdJR052Ym1acFp5eGNiaUFnSUNCOUlHRnpJRTFwYkd0cGIxSjFiblJwYldWSmJtbDBQRTFwYkd0cGIwOXdkR2x2Ym5NK1cxd2ljblZ1ZEdsdFpWd2lYVHRjYmx4dUlDQWdJR052Ym5OMElHVjJaVzUwVFdGdVlXZGxjaUE5SUY5ZmFXNXBkRVYyWlc1MFRXRnVZV2RsY2lncE8xeHVYRzRnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVZV05qWlhOelMyVjVLU0J2Y0hScGIyNXpMbWxuYm05eVpWQmhkR2hNWlhabGJDQTlJRzl3ZEdsdmJuTXVhV2R1YjNKbFVHRjBhRXhsZG1Wc0lEOGdiM0IwYVc5dWN5NXBaMjV2Y21WUVlYUm9UR1YyWld3Z0t5QXhJRG9nTVR0Y2JseHVJQ0FnSUdOdmJuTjBJRjg2SUUxcGJHdHBiMUoxYm5ScGJXVkpibWwwUEUxcGJHdHBiMDl3ZEdsdmJuTStJRDBnZTF4dUlDQWdJQ0FnSUNBdUxpNXZjSFJwYjI1ekxGeHVJQ0FnSUNBZ0lDQmxlR1ZqZFhSbFNXUXNYRzRnSUNBZ0lDQWdJSEoxYm5ScGJXVXNYRzRnSUNBZ0lDQWdJRzl1T2lCbGRtVnVkRTFoYm1GblpYSXViMjRzWEc0Z0lDQWdJQ0FnSUc5bVpqb2daWFpsYm5STllXNWhaMlZ5TG05bVppeGNiaUFnSUNBZ0lDQWdaVzFwZERvZ1pYWmxiblJOWVc1aFoyVnlMbVZ0YVhRc1hHNGdJQ0FnSUNBZ0lHVnRhWFJCYm5sQmNIQnliM1psWkRvZ1pYWmxiblJOWVc1aFoyVnlMbVZ0YVhSQmJubEJjSEJ5YjNabFpDeGNiaUFnSUNBZ0lDQWdaVzFwZEVGc2JFRndjSEp2ZG1Wa09pQmxkbVZ1ZEUxaGJtRm5aWEl1WlcxcGRFRnNiRUZ3Y0hKdmRtVmtMRnh1SUNBZ0lDQWdJQ0JmYUdGelJXMXBkRWhoYm1Sc1pYSnpPaUJsZG1WdWRFMWhibUZuWlhJdVgyaGhjMFZ0YVhSSVlXNWtiR1Z5Y3l4Y2JpQWdJQ0FnSUNBZ1gyVnRhWFJJWVc1a2JHVnljMVpsY25OcGIyNDZJR1YyWlc1MFRXRnVZV2RsY2k1ZmRtVnljMmx2Yml4Y2JpQWdJQ0I5TzF4dVhHNGdJQ0FnWTI5dWMzUWdaWGhsWTNWMFpYSWdQU0JmWDJsdWFYUkZlR1ZqZFhSbGNpaG5aVzVsY21GMFpXUXNJRjhwTzF4dUlDQWdJR052Ym5OMElHeHBjM1JsYm1WeUlEMGdYMTlwYm1sMFRHbHpkR1Z1WlhJb1oyVnVaWEpoZEdWa0xDQmZMQ0JsZUdWamRYUmxjaWs3WEc1Y2JpQWdJQ0F2THlCSmJtbDBhV0ZzYVhwbElIUm9aU0JoY0hCY2JpQWdJQ0JqYjI1emRDQjNiM0pzWkNBOUlIdGNiaUFnSUNBZ0lDQWdYeXhjYmlBZ0lDQWdJQ0FnTHk4Z1pYWmxiblFnYldGdVlXZGxjbHh1SUNBZ0lDQWdJQ0J2YmpvZ1pYWmxiblJOWVc1aFoyVnlMbTl1TEZ4dUlDQWdJQ0FnSUNCdlptWTZJR1YyWlc1MFRXRnVZV2RsY2k1dlptWXNYRzRnSUNBZ0lDQWdJR1Z0YVhRNklHVjJaVzUwVFdGdVlXZGxjaTVsYldsMExGeHVJQ0FnSUNBZ0lDQmxiV2wwUVc1NVFYQndjbTkyWldRNklHVjJaVzUwVFdGdVlXZGxjaTVsYldsMFFXNTVRWEJ3Y205MlpXUXNYRzRnSUNBZ0lDQWdJR1Z0YVhSQmJHeEJjSEJ5YjNabFpEb2daWFpsYm5STllXNWhaMlZ5TG1WdGFYUkJiR3hCY0hCeWIzWmxaQ3hjYmlBZ0lDQWdJQ0FnTHk4Z2JHbHpkR1Z1WlhKY2JpQWdJQ0FnSUNBZ2JHbHpkR1Z1WlhJc1hHNGdJQ0FnSUNBZ0lDOHZJR1oxYm1OMGFXOXVYRzRnSUNBZ0lDQWdJR052Ym1acFp5eGNiaUFnSUNCOU8xeHVYRzRnSUNBZ2NuVnVkR2x0WlM1aGNIQWdQU0IzYjNKc1pEdGNibHh1SUNBZ0lHbG1JQ2hCY25KaGVTNXBjMEZ5Y21GNUtHOXdkR2x2Ym5NdVltOXZkSE4wY21Gd2N5a3BJSHRjYmlBZ0lDQWdJQ0FnWm05eUlDaGpiMjV6ZENCaWIyOTBjM1J5WVhBZ2IyWWdiM0IwYVc5dWN5NWliMjkwYzNSeVlYQnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCaWIyOTBjM1J5WVhBb2QyOXliR1FnWVhNZ1RXbHNhMmx2VjI5eWJHUThSMlZ1WlhKaGRHVmtTVzVwZEN3Z1RXbHNhMmx2VDNCMGFXOXVjejRwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnWVhkaGFYUWdVSEp2YldselpTNWhiR3dvWjJWdVpYSmhkR1ZrTG1oaGJtUnNaWEpUWTJobGJXRXViRzloWkVoaGJtUnNaWEp6S0hkdmNteGtLU2s3WEc1Y2JpQWdJQ0JqYjI1emRDQnliM1YwWlV0bGVYTWdQU0JQWW1wbFkzUXVhMlY1Y3loblpXNWxjbUYwWldRdWNtOTFkR1ZUWTJobGJXRWdZWE1nVW1WamIzSmtQSE4wY21sdVp5d2dZVzU1UGlrN1hHNGdJQ0FnWTI5dWMzUWdjbUYzVUdGMGFITTZJRUZ5Y21GNVBITjBjbWx1Wno0Z1BTQm5aVzVsY21GMFpXUXVjbUYzVTJOb1pXMWhQeTV5WVhkUVlYUm9jeUEvSUVGeWNtRjVMbVp5YjIwb1oyVnVaWEpoZEdWa0xuSmhkMU5qYUdWdFlTNXlZWGRRWVhSb2N5QmhjeUJUWlhROGMzUnlhVzVuUGlrZ09pQmJYVHRjYmlBZ0lDQmpiMjV6ZENCaGJHeFNiM1YwWlhNZ1BTQmJMaTR1Y205MWRHVkxaWGx6TENBdUxpNXlZWGRRWVhSb2MxMDdYRzRnSUNBZ1kyOXVjMjlzWlM1c2IyY29ZRnhjYnVLV3N5QlNiM1YwWlhNNlhGeHVJQ0FnSUNSN1lXeHNVbTkxZEdWekxtcHZhVzRvWENKY1hHNGdJQ0FnWENJcGZWeGNiaUFnUVNCMGIzUmhiQ0J2WmlBa2UyRnNiRkp2ZFhSbGN5NXNaVzVuZEdoOUlISnZkWFJsY3k1Z0tUdGNiaUFnSUNCamIyNXpiMnhsTG14dlp5aGdYRnh1NHBheklGTmxjblpsY2pvZ2FIUjBjRG92TDJ4dlkyRnNhRzl6ZERva2UyOXdkR2x2Ym5NdWNHOXlkSDFnS1R0Y2JseHVJQ0FnSUhKbGRIVnliaUIzYjNKc1pDQmhjeUJOYVd4cmFXOVhiM0pzWkR4SFpXNWxjbUYwWldSSmJtbDBMQ0JOYVd4cmFXOVBjSFJwYjI1elBqdGNibjFjYmx4dVpYaHdiM0owSUdsdWRHVnlabUZqWlNCTmFXeHJhVzlYYjNKc1pEeEhaVzVsY21GMFpXUWdaWGgwWlc1a2N5QkhaVzVsY21GMFpXUkpibWwwTENCTmFXeHJhVzlQY0hScGIyNXpJR1Y0ZEdWdVpITWdUV2xzYTJsdlNXNXBkQ0E5SUUxcGJHdHBiMGx1YVhRK0lIdGNiaUFnSUNCZk9pQk5hV3hyYVc5U2RXNTBhVzFsU1c1cGREeE5hV3hyYVc5UGNIUnBiMjV6UGp0Y2JpQWdJQ0F2THlCbGRtVnVkQ0J0WVc1aFoyVnlYRzRnSUNBZ2IyNDZJRHhMWlhrZ1pYaDBaVzVrY3lCclpYbHZaaUJIWlc1bGNtRjBaV1JiWENKbGRtVnVkSE5jSWwwc0lFaGhibVJzWlhJZ1pYaDBaVzVrY3lBb1pYWmxiblE2SUVkbGJtVnlZWFJsWkZ0Y0ltVjJaVzUwYzF3aVhWdExaWGxkS1NBOVBpQjJiMmxrUGloclpYazZJRXRsZVN3Z2FHRnVaR3hsY2pvZ1NHRnVaR3hsY2lrZ1BUNGdLQ2dwSUQwK0lIWnZhV1FwTzF4dUlDQWdJRzltWmpvZ1BFdGxlU0JsZUhSbGJtUnpJR3RsZVc5bUlFZGxibVZ5WVhSbFpGdGNJbVYyWlc1MGMxd2lYU3dnU0dGdVpHeGxjaUJsZUhSbGJtUnpJQ2hsZG1WdWREb2dSMlZ1WlhKaGRHVmtXMXdpWlhabGJuUnpYQ0pkVzB0bGVWMHBJRDArSUhadmFXUStLR3RsZVRvZ1MyVjVMQ0JvWVc1a2JHVnlPaUJJWVc1a2JHVnlLU0E5UGlCMmIybGtPMXh1SUNBZ0lHVnRhWFE2SUR4TFpYa2daWGgwWlc1a2N5QnJaWGx2WmlCSFpXNWxjbUYwWldSYlhDSmxkbVZ1ZEhOY0lsMHNJRlpoYkhWbElHVjRkR1Z1WkhNZ1IyVnVaWEpoZEdWa1cxd2laWFpsYm5SelhDSmRXMHRsZVYwK0tHdGxlVG9nUzJWNUxDQjJZV3gxWlRvZ1ZtRnNkV1VwSUQwK0lGQnliMjFwYzJVOGRtOXBaRDQ3WEc0Z0lDQWdaVzFwZEVGdWVVRndjSEp2ZG1Wa09pQThTMlY1SUdWNGRHVnVaSE1nYTJWNWIyWWdSMlZ1WlhKaGRHVmtXMXdpWlhabGJuUnpYQ0pkTENCV1lXeDFaU0JsZUhSbGJtUnpJRWRsYm1WeVlYUmxaRnRjSW1WMlpXNTBjMXdpWFZ0TFpYbGRQaWhyWlhrNklFdGxlU3dnZG1Gc2RXVTZJRlpoYkhWbEtTQTlQaUJRY205dGFYTmxQR0p2YjJ4bFlXNCtPMXh1SUNBZ0lHVnRhWFJCYkd4QmNIQnliM1psWkRvZ1BFdGxlU0JsZUhSbGJtUnpJR3RsZVc5bUlFZGxibVZ5WVhSbFpGdGNJbVYyWlc1MGMxd2lYU3dnVm1Gc2RXVWdaWGgwWlc1a2N5QkhaVzVsY21GMFpXUmJYQ0psZG1WdWRITmNJbDFiUzJWNVhUNG9hMlY1T2lCTFpYa3NJSFpoYkhWbE9pQldZV3gxWlNrZ1BUNGdVSEp2YldselpUeGliMjlzWldGdVBqdGNiaUFnSUNCd2FXNW5PaUFvYjNCMGFXOXVjejg2SUhzZ2RHbHRaVzkxZEQ4NklHNTFiV0psY2lCOUtTQTlQaUJRY205dGFYTmxQRkJwYm1jK08xeHVJQ0FnSUM4dklHeHBjM1JsYm1WeVhHNGdJQ0FnYkdsemRHVnVaWEk2SUVGM1lXbDBaV1E4VW1WMGRYSnVWSGx3WlR4MGVYQmxiMllnWDE5cGJtbDBUR2x6ZEdWdVpYSStQanRjYmlBZ0lDQmpiMjVtYVdjNklGSmxZV1J2Ym14NVBFRjNZV2wwWldROFVtVjBkWEp1Vkhsd1pUd2tkSGx3WlhOYlhDSmpiMjVtYVdkVFkyaGxiV0ZjSWwxYlhDSm5aWFJjSWwwK1BqNDdYRzU5WEc0aUxBb2dJQ0FnSW1WNGNHOXlkQ0JtZFc1amRHbHZiaUIwZVhCcFlUeFVlWEJwWVVsdWFYUlVJR1Y0ZEdWdVpITWdWSGx3YVdGSmJtbDBQaWhwYm1sME9pQlVlWEJwWVVsdWFYUlVLVG9nVkhsd2FXRThWSGx3YVdGSmJtbDBWRDRnZTF4dUlDQnlaWFIxY200Z2FXNXBkQ0JoY3lCMWJtdHViM2R1SUdGeklGUjVjR2xoUEZSNWNHbGhTVzVwZEZRK08xeHVmVnh1WEc1bGVIQnZjblFnZEhsd1pTQlVlWEJwWVVsdWFYUWdQU0FvS1NBOVBpQlNaV052Y21ROFVISnZjR1Z5ZEhsTFpYa3NJSFZ1YTI1dmQyNCtJSHdnVUhKdmJXbHpaVHhTWldOdmNtUThVSEp2Y0dWeWRIbExaWGtzSUhWdWEyNXZkMjQrUGp0Y2JseHVaWGh3YjNKMElIUjVjR1VnVkhsd2FXRThWSGx3YVdGSmJtbDBWQ0JsZUhSbGJtUnpJRlI1Y0dsaFNXNXBkRDRnUFNCVWVYQnBZVWx1YVhSVU8xeHVJaXdLSUNBZ0lDSnBiWEJ2Y25RZ2RIbHdaU0I3SUV4dlp5d2dUV2xzYTJsdlNXNXBkQ3dnVFdsc2EybHZVblZ1ZEdsdFpVbHVhWFFnZlNCbWNtOXRJRndpTGk0dmFXNWtaWGd1ZEhOY0lqdGNibHh1YVc1MFpYSm1ZV05sSUVOdmIydGliMjlyUlhabGJuUWdlMXh1SUNCMGVYQmxPaUJjSW0xcGJHdHBiMEJzYjJkblpYSmNJanRjYmlBZ2JHOW5PaUJNYjJjN1hHNTlYRzVjYm1WNGNHOXlkQ0JoYzNsdVl5Qm1kVzVqZEdsdmJpQnpaVzVrUTI5dmEySnZiMnRGZG1WdWRDaHlkVzUwYVcxbE9pQk5hV3hyYVc5U2RXNTBhVzFsU1c1cGREeE5hV3hyYVc5SmJtbDBQaXdnWlhabGJuUTZJRU52YjJ0aWIyOXJSWFpsYm5RcElIdGNiaUFnTHk4Z2RISjVJSHRjYmlBZ0x5OGdJQ0JqYjI1emRDQnlaWE53YjI1elpTQTlJR0YzWVdsMElHWmxkR05vS0dCb2RIUndPaTh2Ykc5allXeG9iM04wT2lSN2NuVnVkR2x0WlM1amIyOXJZbTl2YXk1amIyOXJZbTl2YTFCdmNuUjlMeVJoWTNScGIyNWdMQ0I3WEc0Z0lDOHZJQ0FnSUNCdFpYUm9iMlE2SUZ3aVVFOVRWRndpTEZ4dUlDQXZMeUFnSUNBZ2FHVmhaR1Z5Y3pvZ2UxeHVJQ0F2THlBZ0lDQWdJQ0JjSWtOdmJuUmxiblF0Vkhsd1pWd2lPaUJjSW1Gd2NHeHBZMkYwYVc5dUwycHpiMjVjSWl4Y2JpQWdMeThnSUNBZ0lIMHNYRzRnSUM4dklDQWdJQ0JpYjJSNU9pQktVMDlPTG5OMGNtbHVaMmxtZVNobGRtVnVkQ2tzWEc0Z0lDOHZJQ0FnZlNrN1hHNGdJQzh2SUNBZ2FXWWdLQ0Z5WlhOd2IyNXpaUzV2YXlrZ2UxeHVJQ0F2THlBZ0lDQWdZMjl1YzI5c1pTNXNiMmNvWENKYlEwOVBTMEpQVDB0ZFhDSXNJR0YzWVdsMElISmxjM0J2Ym5ObExuUmxlSFFvS1NrN1hHNGdJQzh2SUNBZ0lDQmpiMjV6YjJ4bExteHZaeWhjSWx0RFQwOUxRazlQUzExY0lpd2dYQ0pKY3lCRGIyOXJZbTl2YXlCamJHOXpaV1EvSUZSb1pYSmxJR2x6SUdGdUlHRmlibTl5YldGc2FYUjVJR2x1SUhSb1pTQmpiMjF0ZFc1cFkyRjBhVzl1SUhkcGRHZ2dRMjl2YTJKdmIyc3VYQ0lwTzF4dUlDQXZMeUFnSUgxY2JpQWdMeThnZlNCallYUmphQ0FvWlhKeWIzSXBJSHRjYmlBZ0x5OGdJQ0JqYjI1emIyeGxMbXh2WnloY0lsdERUMDlMUWs5UFMxMWNJaXdnWlhKeWIzSXBPMXh1SUNBdkx5QWdJR052Ym5OdmJHVXViRzluS0Z3aVcwTlBUMHRDVDA5TFhWd2lMQ0JjSWtseklFTnZiMnRpYjI5cklHTnNiM05sWkQ4Z1ZHaGxjbVVnYVhNZ1lXNGdZV0p1YjNKdFlXeHBkSGtnYVc0Z2RHaGxJR052YlcxMWJtbGpZWFJwYjI0Z2QybDBhQ0JEYjI5clltOXZheTVjSWlrN1hHNGdJQzh2SUgxY2JuMWNiaUlzQ2lBZ0lDQWlhVzF3YjNKMElIUjVjR1VnZXlBa1kyOXVkR1Y0ZEN3Z1RXbHNhMmx2U1c1cGRDd2dUV2xzYTJsdlVuVnVkR2x0WlVsdWFYUWdmU0JtY205dElGd2lMaTR2YVc1a1pYZ3VkSE5jSWp0Y2JtbHRjRzl5ZENCN0lITmxibVJEYjI5clltOXZhMFYyWlc1MElIMGdabkp2YlNCY0lpNHVMM1YwYVd4ekwzTmxibVF0WTI5dmEySnZiMnN0WlhabGJuUXVkSE5jSWp0Y2JseHVaWGh3YjNKMElIUjVjR1VnVEc5bklEMGdXMXdpS0dSbFluVm5LVndpSUh3Z1hDSW9hVzVtYnlsY0lpQjhJRndpS0hkaGNtNHBYQ0lnZkNCY0lpaGxjbkp2Y2lsY0lpQjhJRndpS0hKbGNYVmxjM1FwWENJZ2ZDQmNJaWh5WlhOd2IyNXpaU2xjSWl3Z2MzUnlhVzVuSUM4cUlHVjRaV04xZEdWSlpDQXFMeXdnYzNSeWFXNW5MQ0J6ZEhKcGJtY3NJSE4wY21sdVp5d2dMaTR1UVhKeVlYazhkVzVyYm05M2JqNWRPMXh1WEc1bGVIQnZjblFnYVc1MFpYSm1ZV05sSUV4dloyZGxjaUI3WEc0Z0lDQWdYem9nZTF4dUlDQWdJQ0FnSUNCc2IyZHpPaUJCY25KaGVUeE1iMmMrTzF4dUlDQWdJQ0FnSUNCMFlXZHpPaUJOWVhBOGMzUnlhVzVuTENCMWJtdHViM2R1UGp0Y2JpQWdJQ0FnSUNBZ2MzVmliV2wwT2lBb1kyOXVkR1Y0ZERvZ0pHTnZiblJsZUhRcElEMCtJRkJ5YjIxcGMyVThkbTlwWkQ0Z2ZDQjJiMmxrTzF4dUlDQWdJSDA3WEc0Z0lDQWdjMlYwVkdGbk9pQW9hMlY1T2lCemRISnBibWNzSUhaaGJIVmxPaUIxYm10dWIzZHVLU0E5UGlCMmIybGtPMXh1SUNBZ0lITmxkRXh2WnpvZ0tDNHVMbXh2WnpvZ1RHOW5LU0E5UGlCMmIybGtPMXh1SUNBZ0lHUmxZblZuT2lBb1pHVnpZM0pwY0hScGIyNDZJSE4wY21sdVp5d2dMaTR1Y0dGeVlXMXpPaUJCY25KaGVUeDFibXR1YjNkdVBpa2dQVDRnVEc5bk8xeHVJQ0FnSUdsdVptODZJQ2hrWlhOamNtbHdkR2x2YmpvZ2MzUnlhVzVuTENBdUxpNXdZWEpoYlhNNklFRnljbUY1UEhWdWEyNXZkMjQrS1NBOVBpQk1iMmM3WEc0Z0lDQWdkMkZ5YmpvZ0tHUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TG5CaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUV4dlp6dGNiaUFnSUNCbGNuSnZjam9nS0dSbGMyTnlhWEIwYVc5dU9pQnpkSEpwYm1jc0lDNHVMbkJoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJRXh2Wnp0Y2JpQWdJQ0J5WlhGMVpYTjBPaUFvWkdWelkzSnBjSFJwYjI0NklITjBjbWx1Wnl3Z0xpNHVjR0Z5WVcxek9pQkJjbkpoZVR4MWJtdHViM2R1UGlrZ1BUNGdURzluTzF4dUlDQWdJSEpsYzNCdmJuTmxPaUFvWkdWelkzSnBjSFJwYjI0NklITjBjbWx1Wnl3Z0xpNHVjR0Z5WVcxek9pQkJjbkpoZVR4MWJtdHViM2R1UGlrZ1BUNGdURzluTzF4dWZWeHVYRzVsZUhCdmNuUWdkSGx3WlNCTWIyZG5aWEpKYm5ObGNuUnBibWRJWVc1a2JHVnlJRDBnS0d4dlp6b2dURzluS1NBOVBpQmliMjlzWldGdU8xeHVYRzVsZUhCdmNuUWdkSGx3WlNCTWIyZG5aWEpUZFdKdGFYUjBhVzVuU0dGdVpHeGxjaUE5SUNoamIyNTBaWGgwT2lBa1kyOXVkR1Y0ZEN3Z2JHOW5jem9nUVhKeVlYazhURzluUGl3Z2RHRm5jem9nVFdGd1BITjBjbWx1Wnl3Z2RXNXJibTkzYmo0cElEMCtJRkJ5YjIxcGMyVThkbTlwWkQ0Z2ZDQjJiMmxrTzF4dVhHNW1kVzVqZEdsdmJpQm1ZWE4wVkdsdFpYTjBZVzF3S0NrNklITjBjbWx1WnlCN1hHNGdJQ0FnWTI5dWMzUWdaQ0E5SUc1bGR5QkVZWFJsS0NrN1hHNGdJQ0FnY21WMGRYSnVJR0FvSkh0a0xtZGxkRVoxYkd4WlpXRnlLQ2w5TFNSN1UzUnlhVzVuS0dRdVoyVjBUVzl1ZEdnb0tTQXJJREVwTG5CaFpGTjBZWEowS0RJc0lGd2lNRndpS1gwdEpIdFRkSEpwYm1jb1pDNW5aWFJFWVhSbEtDa3BMbkJoWkZOMFlYSjBLRElzSUZ3aU1Gd2lLWDBnSkh0VGRISnBibWNvWkM1blpYUkliM1Z5Y3lncEtTNXdZV1JUZEdGeWRDZ3lMQ0JjSWpCY0lpbDlPaVI3VTNSeWFXNW5LR1F1WjJWMFRXbHVkWFJsY3lncEtTNXdZV1JUZEdGeWRDZ3lMQ0JjSWpCY0lpbDlPaVI3VTNSeWFXNW5LR1F1WjJWMFUyVmpiMjVrY3lncEtTNXdZV1JUZEdGeWRDZ3lMQ0JjSWpCY0lpbDlLV0E3WEc1OVhHNWNiaTh2SUZCeVpTMWpjbVZoZEdWa0lHUmxabUYxYkhRZ2FXNXpaWEowYVc1bklHaGhibVJzWlhJZ0xTQnphR0Z5WldRZ1lXTnliM056SUdGc2JDQnNiMmRuWlhKelhHNWpiMjV6ZENCa1pXWmhkV3gwU1c1elpYSjBhVzVuSUQwZ0tHeHZaem9nVEc5bktUb2dZbTl2YkdWaGJpQTlQaUI3WEc0Z0lDQWdiRzluV3pCZElEMGdZRnhjYmlSN2JHOW5XekJkZldBZ1lYTWdZVzU1TzF4dUlDQWdJR052Ym5OdmJHVXViRzluS0M0dUxteHZaeWs3WEc0Z0lDQWdjbVYwZFhKdUlIUnlkV1U3WEc1OU8xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdZM0psWVhSbFRHOW5aMlZ5UEUxcGJHdHBiMUoxYm5ScGJXVWdaWGgwWlc1a2N5Qk5hV3hyYVc5U2RXNTBhVzFsU1c1cGREeE5hV3hyYVc5U2RXNTBhVzFsU1c1cGREeE5hV3hyYVc5SmJtbDBQajRnUFNCTmFXeHJhVzlTZFc1MGFXMWxTVzVwZER4TmFXeHJhVzlKYm1sMFBqNG9jblZ1ZEdsdFpUb2dUV2xzYTJsdlVuVnVkR2x0WlN3Z2NHRjBhRG9nYzNSeWFXNW5MQ0JsZUdWamRYUmxTV1E2SUhOMGNtbHVaeWs2SUV4dloyZGxjaUI3WEc0Z0lDQWdZMjl1YzNRZ2JHOW5aMlZ5SUQwZ2UzMGdZWE1nVEc5bloyVnlPMXh1WEc0Z0lDQWdZMjl1YzNRZ2JHOW5jem9nUVhKeVlYazhURzluUGlBOUlGdGRPMXh1SUNBZ0lHTnZibk4wSUhSaFozTTZJRTFoY0R4emRISnBibWNzSUhWdWEyNXZkMjQrSUQwZ2JtVjNJRTFoY0NncE8xeHVYRzRnSUNBZ1kyOXVjM1FnYVc1elpYSjBhVzVuSUQwZ2NuVnVkR2x0WlM1dmJreHZaMmRsY2tsdWMyVnlkR2x1WnlCOGZDQmtaV1poZFd4MFNXNXpaWEowYVc1bk8xeHVJQ0FnSUdOdmJuTjBJR2hoYzFOMVltMXBkSFJwYm1jZ1BTQWhJWEoxYm5ScGJXVXViMjVNYjJkblpYSlRkV0p0YVhSMGFXNW5PMXh1SUNBZ0lHTnZibk4wSUdselJHVjJaV3h2Y0NBOUlISjFiblJwYldVdVpHVjJaV3h2Y0R0Y2JseHVJQ0FnSUd4dloyZGxjaTVmSUQwZ2UxeHVJQ0FnSUNBZ0lDQnNiMmR6TEZ4dUlDQWdJQ0FnSUNCMFlXZHpMRnh1SUNBZ0lDQWdJQ0J6ZFdKdGFYUTZJQ2hqYjI1MFpYaDBPaUFrWTI5dWRHVjRkQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRnlkVzUwYVcxbExtOXVURzluWjJWeVUzVmliV2wwZEdsdVp5a2djbVYwZFhKdU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSEoxYm5ScGJXVXViMjVNYjJkblpYSlRkV0p0YVhSMGFXNW5LR052Ym5SbGVIUXNJR3h2WjNNc0lIUmhaM01wTzF4dUlDQWdJQ0FnSUNCOUxGeHVJQ0FnSUgwN1hHNWNiaUFnSUNCamIyNXpkQ0JmWDNSaFoxQjFjMmdnUFNBb2EyVjVPaUJ6ZEhKcGJtY3NJSFpoYkhWbE9pQjFibXR1YjNkdUtUb2dkbTlwWkNBOVBpQjdYRzRnSUNBZ0lDQWdJSFJoWjNNdWMyVjBLR3RsZVN3Z2RtRnNkV1VwTzF4dUlDQWdJSDA3WEc0Z0lDQWdZMjl1YzNRZ1gxOXNiMmRRZFhOb0lEMGdLR3h2WnpvZ1RHOW5LVG9nVEc5bklEMCtJSHRjYmlBZ0lDQWdJQ0FnYVdZZ0tDRnBibk5sY25ScGJtY29iRzluS1NrZ2NtVjBkWEp1SUd4dlp6dGNiaUFnSUNBZ0lDQWdhV1lnS0doaGMxTjFZbTFwZEhScGJtY3BJR3h2WjNNdWNIVnphQ2hiTGk0dWJHOW5YU2s3WEc0Z0lDQWdJQ0FnSUdsbUlDaHBjMFJsZG1Wc2IzQXBJSFp2YVdRZ2MyVnVaRU52YjJ0aWIyOXJSWFpsYm5Rb2NuVnVkR2x0WlN3Z2V5QjBlWEJsT2lCY0ltMXBiR3RwYjBCc2IyZG5aWEpjSWl3Z2JHOW5JSDBwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYkc5bk8xeHVJQ0FnSUgwN1hHNWNiaUFnSUNCc2IyZG5aWEl1YzJWMFZHRm5JRDBnWDE5MFlXZFFkWE5vTzF4dUlDQWdJR3h2WjJkbGNpNXpaWFJNYjJjZ1BTQW9MaTR1Ykc5bk9pQk1iMmNwSUQwK0lGOWZiRzluVUhWemFDaHNiMmNwTzF4dVhHNGdJQ0FnWTI5dWMzUWdaMlYwVG05M0lEMGdabUZ6ZEZScGJXVnpkR0Z0Y0R0Y2JseHVJQ0FnSUd4dloyZGxjaTVrWldKMVp5QTlJQ2hrWlhOamNtbHdkR2x2YmpvZ2MzUnlhVzVuTENBdUxpNXdZWEpoYlhNNklFRnljbUY1UEhWdWEyNXZkMjQrS1NBOVBpQmZYMnh2WjFCMWMyZ29XMXdpS0dSbFluVm5LVndpTENCd1lYUm9MQ0JsZUdWamRYUmxTV1FzSUdkbGRFNXZkeWdwTENCZ1hGeHVKSHRrWlhOamNtbHdkR2x2Ym4xZ0xDQXVMaTV3WVhKaGJYTmRLVHRjYmlBZ0lDQnNiMmRuWlhJdWFXNW1ieUE5SUNoa1pYTmpjbWx3ZEdsdmJqb2djM1J5YVc1bkxDQXVMaTV3WVhKaGJYTTZJRUZ5Y21GNVBIVnVhMjV2ZDI0K0tTQTlQaUJmWDJ4dloxQjFjMmdvVzF3aUtHbHVabThwWENJc0lIQmhkR2dzSUdWNFpXTjFkR1ZKWkN3Z1oyVjBUbTkzS0Nrc0lHQmNYRzRrZTJSbGMyTnlhWEIwYVc5dWZXQXNJQzR1TG5CaGNtRnRjMTBwTzF4dUlDQWdJR3h2WjJkbGNpNTNZWEp1SUQwZ0tHUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TG5CaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUY5ZmJHOW5VSFZ6YUNoYlhDSW9kMkZ5YmlsY0lpd2djR0YwYUN3Z1pYaGxZM1YwWlVsa0xDQm5aWFJPYjNjb0tTd2dZRnhjYmlSN1pHVnpZM0pwY0hScGIyNTlZQ3dnTGk0dWNHRnlZVzF6WFNrN1hHNGdJQ0FnYkc5bloyVnlMbVZ5Y205eUlEMGdLR1JsYzJOeWFYQjBhVzl1T2lCemRISnBibWNzSUM0dUxuQmhjbUZ0Y3pvZ1FYSnlZWGs4ZFc1cmJtOTNiajRwSUQwK0lGOWZiRzluVUhWemFDaGJYQ0lvWlhKeWIzSXBYQ0lzSUhCaGRHZ3NJR1Y0WldOMWRHVkpaQ3dnWjJWMFRtOTNLQ2tzSUdCY1hHNGtlMlJsYzJOeWFYQjBhVzl1ZldBc0lDNHVMbkJoY21GdGMxMHBPMXh1SUNBZ0lHeHZaMmRsY2k1eVpYRjFaWE4wSUQwZ0tHUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TG5CaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUY5ZmJHOW5VSFZ6YUNoYlhDSW9jbVZ4ZFdWemRDbGNJaXdnY0dGMGFDd2daWGhsWTNWMFpVbGtMQ0JuWlhST2IzY29LU3dnWUZ4Y2JpUjdaR1Z6WTNKcGNIUnBiMjU5WUN3Z0xpNHVjR0Z5WVcxelhTazdYRzRnSUNBZ2JHOW5aMlZ5TG5KbGMzQnZibk5sSUQwZ0tHUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TG5CaGNtRnRjem9nUVhKeVlYazhkVzVyYm05M2JqNHBJRDArSUY5ZmJHOW5VSFZ6YUNoYlhDSW9jbVZ6Y0c5dWMyVXBYQ0lzSUhCaGRHZ3NJR1Y0WldOMWRHVkpaQ3dnWjJWMFRtOTNLQ2tzSUdCY1hHNGtlMlJsYzJOeWFYQjBhVzl1ZldBc0lDNHVMbkJoY21GdGMxMHBPMXh1WEc0Z0lDQWdjbVYwZFhKdUlHeHZaMmRsY2p0Y2JuMWNiaUlzQ2lBZ0lDQWlaWGh3YjNKMElHbHVkR1Z5Wm1GalpTQlRkR1Z3Y3p4VGRHRm5aVlFnWlhoMFpXNWtjeUJTWldOdmNtUThZVzU1TENCaGJuaytQaUI3WEc0Z0lITjBaWEE2SUZOMFpYQkdkVzVqZEdsdmJqeFRkR0ZuWlZRK08xeHVJQ0J5ZFc0NklDZ3BJRDArSUZCeWIyMXBjMlU4VW1WdGIzWmxYenhUZEdGblpWUStQanRjYm4xY2JseHVkSGx3WlNCU1pXMXZkbVZmUEZRK0lEMGdlMXh1SUNCYlN5QnBiaUJyWlhsdlppQlVJR0Z6SUVzZ1pYaDBaVzVrY3lCZ1h5UjdjM1J5YVc1bmZXQWdQeUJ1WlhabGNpQTZJRXRkT2lCVVcwdGRPMXh1ZlR0Y2JseHVkSGx3WlNCVWIwVnRjSFI1VDJKcVpXTjBQRlErSUQwZ1ZDQmxlSFJsYm1SeklIVnVaR1ZtYVc1bFpDQjhJRzUxYkd3Z2ZDQnVaWFpsY2lBL0lIdDlJRG9nVkNCbGVIUmxibVJ6SUc5aWFtVmpkQ0EvSUZRZ09pQjdmVHRjYmx4dVpYaHdiM0owSUhSNWNHVWdVM1JsY0VaMWJtTjBhVzl1UEZOMFlXZGxWQ0JsZUhSbGJtUnpJRkpsWTI5eVpEeGhibmtzSUdGdWVUNCtJRDBnUEVoaGJtUnNaWEpVSUdWNGRHVnVaSE1nS0hOMFlXZGxPaUJTWldGa2IyNXNlVHhUZEdGblpWUStLU0E5UGlCU1pXTnZjbVE4WVc1NUxDQmhibmsrSUh3Z1VISnZiV2x6WlR4U1pXTnZjbVE4WVc1NUxDQmhibmsrUGo0b2FHRnVaR3hsY2pvZ1NHRnVaR3hsY2xRcElEMCtJRk4wWlhCelBFRjNZV2wwWldROFUzUmhaMlZVUGlBbUlGUnZSVzF3ZEhsUFltcGxZM1E4UVhkaGFYUmxaRHhTWlhSMWNtNVVlWEJsUEVoaGJtUnNaWEpVUGo0K1BqdGNibHh1Wlhod2IzSjBJR1oxYm1OMGFXOXVJR055WldGMFpWTjBaWEFvS1RvZ1UzUmxjSE04ZTMwK0lIdGNiaUFnWTI5dWMzUWdjM1JsY0VOdmJuUnliMnhzWlhJZ1BTQjdYRzRnSUNBZ0pHMXBiR3RwYjFSNWNHVTZJRndpYzNSbGNGd2lMRnh1SUNBZ0lGOXpkR1Z3Y3pvZ1cxMGdZWE1nUVhKeVlYazhLSE4wWVdkbE9pQmhibmtwSUQwK0lGQnliMjFwYzJVOFlXNTVQajRzWEc0Z0lDQWdjM1JsY0Nob1lXNWtiR1Z5T2lBb2MzUmhaMlU2SUdGdWVTa2dQVDRnVUhKdmJXbHpaVHhoYm5rK0tTQjdYRzRnSUNBZ0lDQnpkR1Z3UTI5dWRISnZiR3hsY2k1ZmMzUmxjSE11Y0hWemFDaG9ZVzVrYkdWeUtUdGNiaUFnSUNBZ0lISmxkSFZ5YmlCemRHVndRMjl1ZEhKdmJHeGxjanRjYmlBZ0lDQjlMRnh1SUNBZ0lHRnplVzVqSUhKMWJpZ3BJSHRjYmlBZ0lDQWdJR3hsZENCemRHRm5aU0E5SUh0OU8xeHVJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQnpkR1Z3SUc5bUlITjBaWEJEYjI1MGNtOXNiR1Z5TGw5emRHVndjeWtnZTF4dUlDQWdJQ0FnSUNCemRHRm5aU0E5SUhzZ0xpNHVjM1JoWjJVc0lDNHVMaWhoZDJGcGRDQnpkR1Z3S0hOMFlXZGxLU2tnZlR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0FnSUdOdmJuTjBJSEpsYzNWc2REb2dVbVZqYjNKa1BHRnVlU3dnWVc1NVBpQTlJSHQ5TzF4dUlDQWdJQ0FnWm05eUlDaGpiMjV6ZENCclpYa2dhVzRnYzNSaFoyVXBJSHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkbUZzZFdVZ1BTQW9jM1JoWjJVZ1lYTWdZVzU1S1Z0clpYbGRPMXh1SUNBZ0lDQWdJQ0JwWmlBb0lXdGxlUzV6ZEdGeWRITlhhWFJvS0Z3aVgxd2lLU2tnY21WemRXeDBXMnRsZVYwZ1BTQjJZV3gxWlR0Y2JpQWdJQ0FnSUgxY2JpQWdJQ0FnSUhKbGRIVnliaUJ5WlhOMWJIUTdYRzRnSUNBZ2ZTeGNiaUFnZlR0Y2JpQWdjbVYwZFhKdUlITjBaWEJEYjI1MGNtOXNiR1Z5SUdGeklHRnVlU0JoY3lCVGRHVndjeng3ZlQ0N1hHNTlYRzRpTEFvZ0lDQWdJbVY0Y0c5eWRDQmpiR0Z6Y3lCVWNtbGxQRlErSUh0Y2JpQWdJQ0J3Y21sMllYUmxJSEp2YjNRNklGUnlhV1ZPYjJSbFBGUStPMXh1SUNBZ0lIQnlhWFpoZEdVZ1kyRmphR1U2SUUxaGNEeHpkSEpwYm1jc0lGUWdmQ0J1ZFd4c1BqdGNibHh1SUNBZ0lHTnZibk4wY25WamRHOXlLQ2tnZTF4dUlDQWdJQ0FnSUNCMGFHbHpMbkp2YjNRZ1BTQnVaWGNnVkhKcFpVNXZaR1VvS1R0Y2JpQWdJQ0FnSUNBZ2RHaHBjeTVqWVdOb1pTQTlJRzVsZHlCTllYQW9LVHRjYmlBZ0lDQjlYRzVjYmlBZ0lDQmhaR1FvY0dGMGFEb2djM1J5YVc1bkxDQjJZV3gxWlRvZ1ZDazZJSFp2YVdRZ2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCd1lYSjBjeUE5SUhCaGRHaGNiaUFnSUNBZ0lDQWdJQ0FnSUM1eVpYQnNZV05sS0M5ZVhGd3ZLM3hjWEM4ckpDOW5MQ0JjSWx3aUtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5Od2JHbDBLRndpTDF3aUtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWdvY0NrZ1BUNGdjQ0FoUFQwZ1hDSmNJaWs3WEc0Z0lDQWdJQ0FnSUd4bGRDQmpkWEp5Wlc1MFRtOWtaU0E5SUhSb2FYTXVjbTl2ZER0Y2JpQWdJQ0FnSUNBZ2FXWWdLSEJoY25SekxteGxibWQwYUNBOVBUMGdNQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZM1Z5Y21WdWRFNXZaR1V1ZG1Gc2RXVWdQU0IyWVd4MVpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUhSb2FYTXVZMkZqYUdVdWMyVjBLSEJoZEdnc0lIWmhiSFZsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJqdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUhCaGNuUWdiMllnY0dGeWRITXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doWTNWeWNtVnVkRTV2WkdVdVkyaHBiR1J5Wlc0dWFHRnpLSEJoY25RcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZM1Z5Y21WdWRFNXZaR1V1WTJocGJHUnlaVzR1YzJWMEtIQmhjblFzSUc1bGR5QlVjbWxsVG05a1pTZ3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUdOMWNuSmxiblJPYjJSbElEMGdZM1Z5Y21WdWRFNXZaR1V1WTJocGJHUnlaVzR1WjJWMEtIQmhjblFwSVR0Y2JpQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQmpkWEp5Wlc1MFRtOWtaUzUyWVd4MVpTQTlJSFpoYkhWbE8xeHVJQ0FnSUNBZ0lDQjBhR2x6TG1OaFkyaGxMbk5sZENod1lYUm9MQ0IyWVd4MVpTazdYRzRnSUNBZ2ZWeHVYRzRnSUNBZ1oyVjBLSEJoZEdnNklITjBjbWx1WnlrNklGUWdmQ0J1ZFd4c0lIdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyRmphR1ZrSUQwZ2RHaHBjeTVqWVdOb1pTNW5aWFFvY0dGMGFDazdYRzRnSUNBZ0lDQWdJR2xtSUNoallXTm9aV1FnSVQwOUlIVnVaR1ZtYVc1bFpDa2djbVYwZFhKdUlHTmhZMmhsWkR0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCd1lYSjBjeUE5SUhCaGRHaGNiaUFnSUNBZ0lDQWdJQ0FnSUM1eVpYQnNZV05sS0M5ZVhGd3ZLM3hjWEM4ckpDOW5MQ0JjSWx3aUtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG5Od2JHbDBLRndpTDF3aUtWeHVJQ0FnSUNBZ0lDQWdJQ0FnTG1acGJIUmxjaWdvY0NrZ1BUNGdjQ0FoUFQwZ1hDSmNJaWs3WEc0Z0lDQWdJQ0FnSUd4bGRDQmpkWEp5Wlc1MFRtOWtaU0E5SUhSb2FYTXVjbTl2ZER0Y2JpQWdJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQndZWEowSUc5bUlIQmhjblJ6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXTjFjbkpsYm5ST2IyUmxMbU5vYVd4a2NtVnVMbWhoY3lod1lYSjBLU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdZM1Z5Y21WdWRFNXZaR1VnUFNCamRYSnlaVzUwVG05a1pTNWphR2xzWkhKbGJpNW5aWFFvY0dGeWRDa2hPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJSEpsYzNWc2RDQTlJR04xY25KbGJuUk9iMlJsTG5aaGJIVmxPMXh1SUNBZ0lDQWdJQ0JwWmlBb2NtVnpkV3gwSUNFOVBTQnVkV3hzS1NCMGFHbHpMbU5oWTJobExuTmxkQ2h3WVhSb0xDQnlaWE4xYkhRcE8xeHVJQ0FnSUNBZ0lDQnlaWFIxY200Z2NtVnpkV3gwTzF4dUlDQWdJSDFjYmx4dUlDQWdJR2RsZEVKNVVHRnlkSE1vY0dGeWRITTZJSE4wY21sdVoxdGRLVG9nVkNCOElHNTFiR3dnZTF4dUlDQWdJQ0FnSUNCc1pYUWdZM1Z5Y21WdWRFNXZaR1VnUFNCMGFHbHpMbkp2YjNRN1hHNGdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdjR0Z5ZENCdlppQndZWEowY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRmpkWEp5Wlc1MFRtOWtaUzVqYUdsc1pISmxiaTVvWVhNb2NHRnlkQ2twSUhKbGRIVnliaUJ1ZFd4c08xeHVJQ0FnSUNBZ0lDQWdJQ0FnWTNWeWNtVnVkRTV2WkdVZ1BTQmpkWEp5Wlc1MFRtOWtaUzVqYUdsc1pISmxiaTVuWlhRb2NHRnlkQ2toTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCamRYSnlaVzUwVG05a1pTNTJZV3gxWlR0Y2JpQWdJQ0I5WEc1Y2JpQWdJQ0JvWVhNb2NHRjBhRG9nYzNSeWFXNW5LVG9nWW05dmJHVmhiaUI3WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIwYUdsekxtZGxkQ2h3WVhSb0tTQWhQVDBnYm5Wc2JEdGNiaUFnSUNCOVhHNTlYRzVjYm1Oc1lYTnpJRlJ5YVdWT2IyUmxQRlErSUh0Y2JpQWdJQ0JqYUdsc1pISmxiam9nVFdGd1BITjBjbWx1Wnl3Z1ZISnBaVTV2WkdVOFZENCtPMXh1SUNBZ0lIWmhiSFZsT2lCVUlId2diblZzYkR0Y2JseHVJQ0FnSUdOdmJuTjBjblZqZEc5eUtDa2dlMXh1SUNBZ0lDQWdJQ0IwYUdsekxtTm9hV3hrY21WdUlEMGdibVYzSUUxaGNDZ3BPMXh1SUNBZ0lDQWdJQ0IwYUdsekxuWmhiSFZsSUQwZ2JuVnNiRHRjYmlBZ0lDQjlYRzU5WEc0aUxBb2dJQ0FnSW1sdGNHOXlkQ0IwZVhCbElIc2dRMjl5YzBOdmJtWnBaeUI5SUdaeWIyMGdYQ0l1TGk5cGJtUmxlQzUwYzF3aU8xeHVYRzVsZUhCdmNuUWdablZ1WTNScGIyNGdZblZwYkdSRGIzSnpTR1ZoWkdWeWN5aGpiM0p6T2lCRGIzSnpRMjl1Wm1sbklId2dkVzVrWldacGJtVmtMQ0J2Y21sbmFXNC9PaUJ6ZEhKcGJtY2dmQ0J1ZFd4c0tUb2dVbVZqYjNKa1BITjBjbWx1Wnl3Z2MzUnlhVzVuUGlCN1hHNGdJQ0FnWTI5dWMzUWdjbVZ6ZFd4ME9pQlNaV052Y21ROGMzUnlhVzVuTENCemRISnBibWMrSUQwZ2UzMDdYRzRnSUNBZ2FXWWdLR052Y25NL0xtTnZjbk5CYkd4dmQwMWxkR2h2WkhNcElISmxjM1ZzZEZ0Y0lrRmpZMlZ6Y3kxRGIyNTBjbTlzTFVGc2JHOTNMVTFsZEdodlpITmNJbDBnUFNCamIzSnpMbU52Y25OQmJHeHZkMDFsZEdodlpITXVhbTlwYmloY0lpd2dYQ0lwTzF4dUlDQWdJR2xtSUNoamIzSnpQeTVqYjNKelFXeHNiM2RJWldGa1pYSnpLU0J5WlhOMWJIUmJYQ0pCWTJObGMzTXRRMjl1ZEhKdmJDMUJiR3h2ZHkxSVpXRmtaWEp6WENKZElEMGdZMjl5Y3k1amIzSnpRV3hzYjNkSVpXRmtaWEp6TG1wdmFXNG9YQ0lzSUZ3aUtUdGNiaUFnSUNCcFppQW9ZMjl5Y3o4dVkyOXljMDFoZUVGblpTQWhQVDBnZFc1a1pXWnBibVZrS1NCeVpYTjFiSFJiWENKQlkyTmxjM010UTI5dWRISnZiQzFOWVhndFFXZGxYQ0pkSUQwZ1UzUnlhVzVuS0dOdmNuTXVZMjl5YzAxaGVFRm5aU2s3WEc0Z0lDQWdhV1lnS0dOdmNuTS9MbU52Y25OQmJHeHZkMDl5YVdkcGJpQW1KaUJqYjNKekxtTnZjbk5CYkd4dmQwOXlhV2RwYmk1c1pXNW5kR2dnUGlBd0tTQjdYRzRnSUNBZ0lDQWdJR052Ym5OMElHbHpWMmxzWkdOaGNtUWdQU0JqYjNKekxtTnZjbk5CYkd4dmQwOXlhV2RwYmk1cGJtTnNkV1JsY3loY0lpcGNJaWs3WEc0Z0lDQWdJQ0FnSUdsbUlDaGpiM0p6TG1OdmNuTkJiR3h2ZDBOeVpXUmxiblJwWVd4ektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBdkx5QlhhR1Z1SUdOeVpXUmxiblJwWVd4ek9pQjBjblZsTENCMGFHVWdjM0JsWXlCbWIzSmlhV1J6SUVGalkyVnpjeTFEYjI1MGNtOXNMVUZzYkc5M0xVOXlhV2RwYmpvZ0tpNWNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklFVmphRzhnZEdobElISmxjWFZsYzNRZ2IzSnBaMmx1SUdsdWMzUmxZV1FnS0hkcGJHUmpZWEprSUcxbFlXNXpJRndpWVd4c2IzY2dZVzU1SUc5eWFXZHBibHdpS1M1Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmNtbG5hVzRnSmlZZ0tHbHpWMmxzWkdOaGNtUWdmSHdnWTI5eWN5NWpiM0p6UVd4c2IzZFBjbWxuYVc0dWFXNWpiSFZrWlhNb2IzSnBaMmx1S1NrcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhSYlhDSkJZMk5sYzNNdFEyOXVkSEp2YkMxQmJHeHZkeTFQY21sbmFXNWNJbDBnUFNCdmNtbG5hVzQ3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBXMXdpVm1GeWVWd2lYU0E5SUZ3aVQzSnBaMmx1WENJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwVzF3aVFXTmpaWE56TFVOdmJuUnliMnd0UVd4c2IzY3RRM0psWkdWdWRHbGhiSE5jSWwwZ1BTQmNJblJ5ZFdWY0lqdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNocGMxZHBiR1JqWVhKa0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6ZFd4MFcxd2lRV05qWlhOekxVTnZiblJ5YjJ3dFFXeHNiM2N0VDNKcFoybHVYQ0pkSUQwZ1hDSXFYQ0k3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlJR1ZzYzJVZ2FXWWdLRzl5YVdkcGJpQW1KaUJqYjNKekxtTnZjbk5CYkd4dmQwOXlhV2RwYmk1cGJtTnNkV1JsY3lodmNtbG5hVzRwS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVnpkV3gwVzF3aVFXTmpaWE56TFVOdmJuUnliMnd0UVd4c2IzY3RUM0pwWjJsdVhDSmRJRDBnYjNKcFoybHVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzNWc2RGdGNJbFpoY25sY0lsMGdQU0JjSWs5eWFXZHBibHdpTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdmVnh1SUNBZ0lHbG1JQ2hqYjNKelB5NWpiM0p6Ulhod2IzTmxTR1ZoWkdWeWN5QW1KaUJqYjNKekxtTnZjbk5GZUhCdmMyVklaV0ZrWlhKekxteGxibWQwYUNBK0lEQXBJSEpsYzNWc2RGdGNJa0ZqWTJWemN5MURiMjUwY205c0xVVjRjRzl6WlMxSVpXRmtaWEp6WENKZElEMGdZMjl5Y3k1amIzSnpSWGh3YjNObFNHVmhaR1Z5Y3k1cWIybHVLRndpTENCY0lpazdYRzRnSUNBZ2NtVjBkWEp1SUhKbGMzVnNkRHRjYm4waUxBb2dJQ0FnSW1WNGNHOXlkQ0JtZFc1amRHbHZiaUJ6WVc1cGRHbDZaVVY0WldOMWRHVkpaQ2hsZUdWamRYUmxTV1E2SUhOMGNtbHVaeUI4SUhWdVpHVm1hVzVsWkNrNklITjBjbWx1WnlCN1hHNGdJR052Ym5OMElIWmhiSFZsSUQwZ2RIbHdaVzltSUdWNFpXTjFkR1ZKWkNBOVBUMGdYQ0p6ZEhKcGJtZGNJaUEvSUdWNFpXTjFkR1ZKWkNBNklGd2lYQ0k3WEc0Z0lISmxkSFZ5YmlCMllXeDFaUzV5WlhCc1lXTmxLQzliWGtFdFdtRXRlakF0T1Y4dFhTOW5MQ0JjSWx3aUtUdGNibjFjYmlJc0NpQWdJQ0FpYVcxd2IzSjBJSHNnWTNKbFlYUmxURzluWjJWeUxDQmxlR05sY0hScGIyNUlZVzVrYkdWeUxDQnlaV3BsWTNRc0lISmhhWE5sSUgwZ1puSnZiU0JjSWk0dUwybHVaR1Y0TG5SelhDSTdYRzVwYlhCdmNuUWdkSGx3WlNCN0lFMXBlR2x1TENCSFpXNWxjbUYwWldSSmJtbDBMQ0FrZEhsd1pYTXNJRU52Ym5SbGVIUklkSFJ3TENCTmFXeHJhVzlTWlhOd2IyNXpaVkpsYW1WamRDd2dVbVZ6ZFd4MGN5d2dUV2xzYTJsdlVtVnpjRzl1YzJWVGRXTmpaWE56TENCRGIzSnpRMjl1Wm1sbkxDQk1iMmRuWlhJc0lFeHZaeUI5SUdaeWIyMGdYQ0l1TGk5cGJtUmxlQzUwYzF3aU8xeHVhVzF3YjNKMElIUjVjR1VnZXlCZlgybHVhWFJGZUdWamRYUmxjaUI5SUdaeWIyMGdYQ0l1TGk5bGVHVmpkWFJsTDJsdVpHVjRMblJ6WENJN1hHNXBiWEJ2Y25RZ2V5QmZYMk55WldGMFpVbGtJSDBnWm5KdmJTQmNJaTR1TDNWMGFXeHpMMk55WldGMFpTMXBaQzUwYzF3aU8xeHVhVzF3YjNKMElIc2dWSEpwWlNCOUlHWnliMjBnWENJdUxpOTFkR2xzY3k5MGNtbGxMblJ6WENJN1hHNXBiWEJ2Y25RZ2V5QmlkV2xzWkVOdmNuTklaV0ZrWlhKeklIMGdabkp2YlNCY0lpNHVMM1YwYVd4ekwySjFhV3hrTFdOdmNuTXRhR1ZoWkdWeWN5NTBjMXdpTzF4dWFXMXdiM0owSUhzZ2NtVjJhWFpsU2xOUFRsQmhjbk5sSUgwZ1puSnZiU0JjSWk0dUwzVjBhV3h6TDNKbGRtbDJaUzFxYzI5dUxYQmhjbk5sTG5SelhDSTdYRzVwYlhCdmNuUWdleUJ6WVc1cGRHbDZaVVY0WldOMWRHVkpaQ0I5SUdaeWIyMGdYQ0l1TGk5MWRHbHNjeTl6WVc1cGRHbDZaUzFsZUdWamRYUmxMV2xrTG5SelhDSTdYRzVjYm1WNGNHOXlkQ0IwZVhCbElFMXBiR3RwYjBoMGRIQlNaWEYxWlhOMElEMGdVbVZ4ZFdWemREdGNibHh1Wlhod2IzSjBJSFI1Y0dVZ1RXbHNhMmx2U0hSMGNGSmxjM0J2Ym5ObElEMGdUV2w0YVc0OFhHNGdJQ0FnVW1WemNHOXVjMlZKYm1sMExGeHVJQ0FnSUh0Y2JpQWdJQ0FnSUNBZ1ltOWtlVG9nYzNSeWFXNW5JSHdnVW1WaFpHRmliR1ZUZEhKbFlXMDhWV2x1ZERoQmNuSmhlVDRnZkNCVmFXNTBPRUZ5Y21GNUlId2dRWEp5WVhsQ2RXWm1aWElnZkNCQ2JHOWlJSHdnYm5Wc2JEdGNiaUFnSUNBZ0lDQWdjM1JoZEhWek9pQnVkVzFpWlhJN1hHNGdJQ0FnSUNBZ0lHaGxZV1JsY25NNklGSmxZMjl5WkR4emRISnBibWNzSUhOMGNtbHVaejQ3WEc0Z0lDQWdmVnh1UGp0Y2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlGOWZhVzVwZEV4cGMzUmxibVZ5S0dkbGJtVnlZWFJsWkRvZ1IyVnVaWEpoZEdWa1NXNXBkQ3dnY25WdWRHbHRaVG9nWVc1NUxDQmxlR1ZqZFhSbGNqb2dVbVYwZFhKdVZIbHdaVHgwZVhCbGIyWWdYMTlwYm1sMFJYaGxZM1YwWlhJK0tTQjdYRzRnSUNBZ1kyOXVjM1FnY0c5eWRDQTlJSEoxYm5ScGJXVXVjRzl5ZER0Y2JpQWdJQ0JqYjI1emRDQjBjbWxsSUQwZ2JtVjNJRlJ5YVdVOFlXNTVQaWdwTzF4dUlDQWdJQzh2SUZCeVpTMWpiMjF3ZFhSbElHUmxabUYxYkhRZ1EwOVNVeUJqYjI1bWFXY2dZVzVrSUdOaFkyaGxJR2hsWVdSbGNuTWdjR1Z5SUc5eWFXZHBibHh1SUNBZ0lHTnZibk4wSUdOdmNuTTZJRU52Y25ORGIyNW1hV2NnUFNCN0lHTnZjbk5CYkd4dmQwMWxkR2h2WkhNNklGdGNJbEJQVTFSY0lpd2dYQ0pQVUZSSlQwNVRYQ0pkTENCamIzSnpRV3hzYjNkSVpXRmtaWEp6T2lCYlhDSkRiMjUwWlc1MExWUjVjR1ZjSWl3Z1hDSkJkWFJvYjNKcGVtRjBhVzl1WENKZExDQmpiM0p6VFdGNFFXZGxPaUF3TENBdUxpNXlkVzUwYVcxbExtaDBkSEEvTG1OdmNuTWdmVHRjYmlBZ0lDQmpiMjV6ZENCamIzSnpTR1ZoWkdWeWMwTmhZMmhsSUQwZ2JtVjNJRTFoY0R4emRISnBibWNzSUZKbFkyOXlaRHh6ZEhKcGJtY3NJSE4wY21sdVp6NCtLQ2s3WEc0Z0lDQWdZMjl1YzNRZ1RVRllYME5QVWxOZlNFVkJSRVZTVTE5RFFVTklSVjlUU1ZwRklEMGdNVEF5TkR0Y2JpQWdJQ0JqYjI1emRDQm5aWFJEYjNKelNHVmhaR1Z5Y3lBOUlDaHZjbWxuYVc0NklITjBjbWx1WnlCOElHNTFiR3dwT2lCU1pXTnZjbVE4YzNSeWFXNW5MQ0J6ZEhKcGJtYytJRDArSUh0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYTJWNUlEMGdiM0pwWjJsdUlEOC9JRndpWENJN1hHNGdJQ0FnSUNBZ0lHeGxkQ0JqWVdOb1pXUWdQU0JqYjNKelNHVmhaR1Z5YzBOaFkyaGxMbWRsZENoclpYa3BPMXh1SUNBZ0lDQWdJQ0JwWmlBb1kyRmphR1ZrSUNFOVBTQjFibVJsWm1sdVpXUXBJSEpsZEhWeWJpQmpZV05vWldRN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hqYjNKelNHVmhaR1Z5YzBOaFkyaGxMbk5wZW1VZ1BqMGdUVUZZWDBOUFVsTmZTRVZCUkVWU1UxOURRVU5JUlY5VFNWcEZLU0JqYjNKelNHVmhaR1Z5YzBOaFkyaGxMbU5zWldGeUtDazdYRzRnSUNBZ0lDQWdJR05oWTJobFpDQTlJR0oxYVd4a1EyOXljMGhsWVdSbGNuTW9ZMjl5Y3l3Z2IzSnBaMmx1S1R0Y2JpQWdJQ0FnSUNBZ1kyOXljMGhsWVdSbGNuTkRZV05vWlM1elpYUW9hMlY1TENCallXTm9aV1FwTzF4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWTJGamFHVmtPMXh1SUNBZ0lIMDdYRzRnSUNBZ0x5OGdVSEpsTFdOdmJYQjFkR1VnWkdWbVlYVnNkQ0J5WlhOd2IyNXpaU0JvWldGa1pYSnpJQ2gzYVhSb2IzVjBJRzl5YVdkcGJpMXpjR1ZqYVdacFl5QkRUMUpUS1Z4dUlDQWdJR052Ym5OMElHUmxabUYxYkhSU1pYTndiMjV6WlVobFlXUmxjbk02SUZKbFkyOXlaRHh6ZEhKcGJtY3NJSE4wY21sdVp6NGdQU0I3WEc0Z0lDQWdJQ0FnSUZ3aVEyRmphR1V0UTI5dWRISnZiRndpT2lCY0ltNXZMWE4wYjNKbFhDSXNYRzRnSUNBZ0lDQWdJRndpUTI5dWRHVnVkQzFVZVhCbFhDSTZJRndpWVhCd2JHbGpZWFJwYjI0dmFuTnZibHdpTEZ4dUlDQWdJSDA3WEc0Z0lDQWdMeThnVUhKbExXTnZiWEIxZEdVZ2JXVnlaMlZrSUdobFlXUmxjbk1nWm05eUlHNTFiR3dnYjNKcFoybHVJQ2h0YjNOMElHTnZiVzF2YmlCallYTmxLVnh1SUNBZ0lHTnZibk4wSUdSbFptRjFiSFJOWlhKblpXUklaV0ZrWlhKek9pQlNaV052Y21ROGMzUnlhVzVuTENCemRISnBibWMrSUQwZ2V5QXVMaTVuWlhSRGIzSnpTR1ZoWkdWeWN5aHVkV3hzS1N3Z0xpNHVaR1ZtWVhWc2RGSmxjM0J2Ym5ObFNHVmhaR1Z5Y3lCOU8xeHVYRzRnSUNBZ0x5OGdVSEpsTFdGc2JHOWpZWFJsSUhKbGMzQnZibk5sSUhSbGJYQnNZWFJsSUhCaGNuUnpJR1p2Y2lCR1lYTjBJRkJoZEdoY2JpQWdJQ0JqYjI1emRDQmxiWEIwZVZKbGMzVnNkRkJ5WldacGVDQTlJQ2Q3WENKa1lYUmhYQ0k2ZTMwc1hDSmxlR1ZqZFhSbFNXUmNJanBjSWljN1hHNGdJQ0FnWTI5dWMzUWdjbVZ6ZFd4MFVISmxabWw0SUQwZ0ozdGNJbVJoZEdGY0lqb25PMXh1SUNBZ0lHTnZibk4wSUdsa1UzVm1abWw0SUQwZ0oxd2lMRndpYzNWalkyVnpjMXdpT25SeWRXVjlKenRjYmlBZ0lDQXZMeUJUYUdGeVpXUWdjbVZ6Y0c5dWMyVWdiMkpxWldOMElHWnZjaUJHWVhOMElGQmhkR2dnS0doaGJtUnNaWElnY21WMGRYSnVjeUJ5WlhOMWJIUWdaR2x5WldOMGJIa3NJRzVsZG1WeUlHMXZaR2xtYVdWeklISmxjM0J2Ym5ObEtWeHVJQ0FnSUdOdmJuTjBJR1poYzNSUVlYUm9VbVZ6Y0c5dWMyVWdQU0I3SUdKdlpIazZJRndpWENJc0lITjBZWFIxY3pvZ01qQXdMQ0JvWldGa1pYSnpPaUJrWldaaGRXeDBUV1Z5WjJWa1NHVmhaR1Z5Y3lCOU8xeHVYRzRnSUNBZ0x5OGdSSGx1WVcxcFl5QmphR1ZqYXlCbWIzSWdaWFpsYm5RZ2FHRnVaR3hsY25NZ2QybDBhQ0IyWlhKemFXOXVMV0poYzJWa0lHTmhZMmhwYm1kY2JpQWdJQ0JzWlhRZ1kyRmphR1ZrVG05RmJXbDBTR0Z1Wkd4bGNuTWdQU0IwY25WbE8xeHVJQ0FnSUd4bGRDQnNZWE4wUlcxcGRFaGhibVJzWlhKelZtVnljMmx2YmlBOUlDMHhPMXh1SUNBZ0lHTnZibk4wSUdOb1pXTnJUbTlGYldsMFNHRnVaR3hsY25NZ1BTQW9LVG9nWW05dmJHVmhiaUE5UGlCN1hHNGdJQ0FnSUNBZ0lHTnZibk4wSUhZZ1BTQnlkVzUwYVcxbExsOWxiV2wwU0dGdVpHeGxjbk5XWlhKemFXOXVPMXh1SUNBZ0lDQWdJQ0JwWmlBb2RpQWhQVDBnYkdGemRFVnRhWFJJWVc1a2JHVnljMVpsY25OcGIyNHBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHeGhjM1JGYldsMFNHRnVaR3hsY25OV1pYSnphVzl1SUQwZ2RqdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOaFkyaGxaRTV2UlcxcGRFaGhibVJzWlhKeklEMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWhjblZ1ZEdsdFpTNWZhR0Z6UlcxcGRFaGhibVJzWlhKelB5NG9YQ0p0YVd4cmFXODZaWGhsWTNWMFpVSmxabTl5WlZ3aUtTQW1KbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0Z5ZFc1MGFXMWxMbDlvWVhORmJXbDBTR0Z1Wkd4bGNuTS9MaWhjSW0xcGJHdHBienBsZUdWamRYUmxRV1owWlhKY0lpa2dKaVpjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FoY25WdWRHbHRaUzVmYUdGelJXMXBkRWhoYm1Sc1pYSnpQeTRvWENKdGFXeHJhVzg2YUhSMGNGSmxjWFZsYzNSY0lpa2dKaVpjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FoY25WdWRHbHRaUzVmYUdGelJXMXBkRWhoYm1Sc1pYSnpQeTRvWENKdGFXeHJhVzg2YUhSMGNGSmxjM0J2Ym5ObFhDSXBJQ1ltWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSVhKMWJuUnBiV1V1WDJoaGMwVnRhWFJJWVc1a2JHVnljejh1S0Z3aWJXbHNhMmx2T21oMGRIQk9iM1JHYjNWdVpGd2lLVHRjYmlBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWTJGamFHVmtUbTlGYldsMFNHRnVaR3hsY25NN1hHNGdJQ0FnZlR0Y2JpQWdJQ0JqYjI1emRDQm9ZWE5QYmt4dloyZGxjbE4xWW0xcGRIUnBibWNnUFNBaElYSjFiblJwYldVdWIyNU1iMmRuWlhKVGRXSnRhWFIwYVc1bk8xeHVYRzRnSUNBZ0x5OGdVMmhoY21Wa0lHNXZMVzl3SUd4dloyZGxjaUJtYjNJZ1ptRnpkQ0J3WVhSb0lDaDFjMlZrSUhkb1pXNGdibThnWlhabGJuUWdhR0Z1Wkd4bGNuTXBYRzRnSUNBZ1kyOXVjM1FnYm05dmNFeHZaMmRsY2pvZ1RHOW5aMlZ5SUQwZ2UxeHVJQ0FnSUNBZ0lDQmZPaUI3SUd4dlozTTZJRnRkSUdGeklHRnVlU3dnZEdGbmN6b2dibVYzSUUxaGNEeHpkSEpwYm1jc0lIVnVhMjV2ZDI0K0tDa3NJSE4xWW0xcGREb2dLQ2tnUFQ0Z2V5QjlJSDBzWEc0Z0lDQWdJQ0FnSUhObGRGUmhaem9nS0NrZ1BUNGdleUI5TEZ4dUlDQWdJQ0FnSUNCelpYUk1iMmM2SUNndUxpNWZiRzluT2lCTWIyY3BJRDArSUNoN2ZTQmhjeUJNYjJjcExGeHVJQ0FnSUNBZ0lDQmtaV0oxWnpvZ0tGOWtaWE5qY21sd2RHbHZiam9nYzNSeWFXNW5MQ0F1TGk1ZmNHRnlZVzF6T2lCQmNuSmhlVHgxYm10dWIzZHVQaWtnUFQ0Z0tIdDlJR0Z6SUV4dlp5a3NYRzRnSUNBZ0lDQWdJR2x1Wm04NklDaGZaR1Z6WTNKcGNIUnBiMjQ2SUhOMGNtbHVaeXdnTGk0dVgzQmhjbUZ0Y3pvZ1FYSnlZWGs4ZFc1cmJtOTNiajRwSUQwK0lDaDdmU0JoY3lCTWIyY3BMRnh1SUNBZ0lDQWdJQ0IzWVhKdU9pQW9YMlJsYzJOeWFYQjBhVzl1T2lCemRISnBibWNzSUM0dUxsOXdZWEpoYlhNNklFRnljbUY1UEhWdWEyNXZkMjQrS1NBOVBpQW9lMzBnWVhNZ1RHOW5LU3hjYmlBZ0lDQWdJQ0FnWlhKeWIzSTZJQ2hmWkdWelkzSnBjSFJwYjI0NklITjBjbWx1Wnl3Z0xpNHVYM0JoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJQ2g3ZlNCaGN5Qk1iMmNwTEZ4dUlDQWdJQ0FnSUNCeVpYRjFaWE4wT2lBb1gyUmxjMk55YVhCMGFXOXVPaUJ6ZEhKcGJtY3NJQzR1TGw5d1lYSmhiWE02SUVGeWNtRjVQSFZ1YTI1dmQyNCtLU0E5UGlBb2UzMGdZWE1nVEc5bktTeGNiaUFnSUNBZ0lDQWdjbVZ6Y0c5dWMyVTZJQ2hmWkdWelkzSnBjSFJwYjI0NklITjBjbWx1Wnl3Z0xpNHVYM0JoY21GdGN6b2dRWEp5WVhrOGRXNXJibTkzYmo0cElEMCtJQ2g3ZlNCaGN5Qk1iMmNwTEZ4dUlDQWdJSDA3WEc1Y2JpQWdJQ0F2THlCUWNtVXRZM0psWVhSbElHSmhjMlVnWTI5dWRHVjRkQ0J3Y205MGIzUjVjR1VnWm05eUlFWmhjM1FnVUdGMGFDQW9jMmhoY21Wa0lHbHRiWFYwWVdKc1pTQndjbTl3WlhKMGFXVnpLVnh1SUNBZ0lDOHZJR0JqWVd4c1lDQnBjeUJrWldacGJtVmtJRzl1SUhCeWIzUnZkSGx3WlNCMGJ5QmhkbTlwWkNCamNtVmhkR2x1WnlCaElHTnNiM04xY21VZ2NHVnlJSEpsY1hWbGMzUmNiaUFnSUNCamIyNXpkQ0JpWVhObFEyOXVkR1Y0ZEZCeWIzUnZPaUJoYm5rZ1BTQjdYRzRnSUNBZ0lDQWdJSEpsYW1WamRDeGNiaUFnSUNBZ0lDQWdaR1YyWld4dmNEb2djblZ1ZEdsdFpTNWtaWFpsYkc5d0xGeHVJQ0FnSUNBZ0lDQnNiMmRuWlhJNklHNXZiM0JNYjJkblpYSXNYRzRnSUNBZ0lDQWdJR1Z0YVhRNklISjFiblJwYldVdVpXMXBkQ3hjYmlBZ0lDQWdJQ0FnWlcxcGRFRnVlVUZ3Y0hKdmRtVmtPaUJ5ZFc1MGFXMWxMbVZ0YVhSQmJubEJjSEJ5YjNabFpDeGNiaUFnSUNBZ0lDQWdaVzFwZEVGc2JFRndjSEp2ZG1Wa09pQnlkVzUwYVcxbExtVnRhWFJCYkd4QmNIQnliM1psWkN4Y2JpQWdJQ0FnSUNBZ1kyOXVabWxuT2lCeWRXNTBhVzFsTG5KMWJuUnBiV1V1WTI5dVptbG5MRnh1SUNBZ0lDQWdJQ0IwZVhCcFlUb2daMlZ1WlhKaGRHVmtMblI1Y0dsaFUyTm9aVzFoTEZ4dUlDQWdJQ0FnSUNCdmJrWnBibUZzYkhrNklDZ3BJRDArSUhzZ2ZTeGNiaUFnSUNBZ0lDQWdYem9nY25WdWRHbHRaU3hjYmlBZ0lDQWdJQ0FnWTJGc2JDaHRiMlIxYkdVNklHRnVlU3dnY0RvZ1lXNTVLU0I3SUhKbGRIVnliaUJsZUdWamRYUmxjaTVmWDJOaGJHd29kR2hwY3l3Z2JXOWtkV3hsTENCd0tUc2dmU3hjYmlBZ0lDQjlPMXh1WEc0Z0lDQWdMeThnU0c5MElIQmhkR2dnWTJGamFHVTZJSEJ5WlMxeVpYTnZiSFpsSUhSb1pTQnRiM04wSUdOdmJXMXZiaUJ5YjNWMFpWeHVJQ0FnSUd4bGRDQmpZV05vWldSU2IzVjBaVk5qYUdWdFlUb2dZVzU1SUQwZ2JuVnNiRHRjYmlBZ0lDQnNaWFFnWTJGamFHVmtVR0YwYUZOMGNtbHVaem9nYzNSeWFXNW5JSHdnYm5Wc2JDQTlJRzUxYkd3N1hHNGdJQ0FnTHk4Z1EyRmphR1VnZG1Gc2FXUmhkR1ZRWVhKaGJYTWdZVzVrSUdoaGJtUnNaWElnY21WbVpYSmxibU5sY3lCMGJ5QmhkbTlwWkNCd2NtOXdaWEowZVNCc2IyOXJkWEJ6WEc0Z0lDQWdiR1YwSUdOaFkyaGxaRlpoYkdsa1lYUmxVR0Z5WVcxek9pQmhibmtnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JqWVdOb1pXUklZVzVrYkdWeU9pQmhibmtnUFNCdWRXeHNPMXh1SUNBZ0lHeGxkQ0JqWVdOb1pXUlRhMmx3Vm1Gc2FXUmhkR2x2YmpvZ1ltOXZiR1ZoYmlBOUlHWmhiSE5sTzF4dVhHNGdJQ0FnWTI5dWMzUWdabVYwWTJnZ1BTQmhjM2x1WXlBb2IzQjBhVzl1Y3pvZ2UxeHVJQ0FnSUNBZ0lDQnlaWEYxWlhOME9pQk5hV3hyYVc5SWRIUndVbVZ4ZFdWemREdGNiaUFnSUNBZ0lDQWdaVzUyVFc5a1pUODZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdaVzUyUHpvZ1VtVmpiM0prUEdGdWVTd2dZVzU1UGp0Y2JpQWdJQ0FnSUNBZ2NtOTFkR1ZUWTJobGJXRS9PaUJoYm5rN1hHNGdJQ0FnSUNBZ0lISmhkMUpsYzNCdmJuTmxQem9nWW05dmJHVmhianRjYmlBZ0lDQjlLVG9nVUhKdmJXbHpaVHhTWlhOd2IyNXpaVDRnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCTlFWaGZRazlFV1Y5VFNWcEZJRDBnTVRBZ0tpQXhNREkwSUNvZ01UQXlORHRjYmlBZ0lDQWdJQ0FnWTI5dWMzUWdkRzl2VEdGeVoyVWdQU0FvS1NBOVBpQnlaV3BsWTNRb1hDSlNSVkZWUlZOVVgxUlBUMTlNUVZKSFJWd2lMQ0I3SUcxaGVFSnZaSGxUYVhwbE9pQk5RVmhmUWs5RVdWOVRTVnBGSUgwcE8xeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpXRmtRbTlrZVZSbGVIUWdQU0JoYzNsdVl5QW9LVG9nVUhKdmJXbHpaVHh6ZEhKcGJtYytJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElIQnlaVkpsWVdRZ1BTQW9iM0IwYVc5dWN5NXlaWEYxWlhOMElHRnpJR0Z1ZVNrdVgxOWliMlI1VkdWNGREdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaHdjbVZTWldGa0lDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9kSGx3Wlc5bUlIQnlaVkpsWVdRZ1BUMDlJRndpYzNSeWFXNW5YQ0lnSmlZZ2NISmxVbVZoWkM1c1pXNW5kR2dnUGlCTlFWaGZRazlFV1Y5VFNWcEZLU0IwYUhKdmR5QjBiMjlNWVhKblpTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQndjbVZTWldGa08xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1kyOXVkR1Z1ZEV4bGJtZDBhQ0E5SUU1MWJXSmxjaWh2Y0hScGIyNXpMbkpsY1hWbGMzUXVhR1ZoWkdWeWN5NW5aWFFvWENKamIyNTBaVzUwTFd4bGJtZDBhRndpS1NBL1B5QmNJakJjSWlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1RuVnRZbVZ5TG1selJtbHVhWFJsS0dOdmJuUmxiblJNWlc1bmRHZ3BJQ1ltSUdOdmJuUmxiblJNWlc1bmRHZ2dQaUJOUVZoZlFrOUVXVjlUU1ZwRktTQjBhSEp2ZHlCMGIyOU1ZWEpuWlNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRnZjSFJwYjI1ekxuSmxjWFZsYzNRdVltOWtlU2tnY21WMGRYSnVJRndpWENJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQnlaV0ZrWlhJZ1BTQnZjSFJwYjI1ekxuSmxjWFZsYzNRdVltOWtlUzVuWlhSU1pXRmtaWElvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHUmxZMjlrWlhJZ1BTQnVaWGNnVkdWNGRFUmxZMjlrWlhJb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUd4bGRDQjBaWGgwSUQwZ1hDSmNJanRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZDJocGJHVWdLSFJ5ZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdleUJrYjI1bExDQjJZV3gxWlNCOUlEMGdZWGRoYVhRZ2NtVmhaR1Z5TG5KbFlXUW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLR1J2Ym1VcElHSnlaV0ZyTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBaWGgwSUNzOUlHUmxZMjlrWlhJdVpHVmpiMlJsS0haaGJIVmxMQ0I3SUhOMGNtVmhiVG9nZEhKMVpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSFJsZUhRdWJHVnVaM1JvSUQ0Z1RVRllYMEpQUkZsZlUwbGFSU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdjbVZoWkdWeUxtTmhibU5sYkNncExtTmhkR05vS0NncElEMCtJSHQ5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJSFJ2YjB4aGNtZGxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkR1Y0ZENBclBTQmtaV052WkdWeUxtUmxZMjlrWlNncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlNCbWFXNWhiR3g1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpXRmtaWEl1Y21Wc1pXRnpaVXh2WTJzb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjBaWGgwTzF4dUlDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJQzh2SUZWelpTQndjbVV0Y0dGemMyVmtJRzl5YVdkcGJpQm1jbTl0SUdGa1lYQjBaWElnZEc4Z1lYWnZhV1FnYUdWaFpHVnljeTVuWlhRb0tTQmpZV3hzWEc0Z0lDQWdJQ0FnSUdOdmJuTjBJRzl5YVdkcGJpQTlJQ2h2Y0hScGIyNXpMbkpsY1hWbGMzUWdZWE1nWVc1NUtTNWZYMjl5YVdkcGJpQS9QeUJ2Y0hScGIyNXpMbkpsY1hWbGMzUXVhR1ZoWkdWeWN5NW5aWFFvWENKUGNtbG5hVzVjSWlrN1hHNWNiaUFnSUNBZ0lDQWdhV1lnS0c5d2RHbHZibk11Y21WeGRXVnpkQzV0WlhSb2IyUWdQVDA5SUZ3aVQxQlVTVTlPVTF3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lGSmxjM0J2Ym5ObEtIVnVaR1ZtYVc1bFpDd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdSbGNuTTZJR2RsZEVOdmNuTklaV0ZrWlhKektHOXlhV2RwYmlrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQzh2SUZWelpTQndjbVV0Y0dGeWMyVmtJSEJoZEdodVlXMWxJR0Z1WkNCd1lYUm9RWEp5WVhrZ2FXWWdZWFpoYVd4aFlteGxJQ2htY205dElHRmtZWEIwWlhJcExDQnZkR2hsY25kcGMyVWdjR0Z5YzJWY2JpQWdJQ0FnSUNBZ1kyOXVjM1FnY0dGMGFHNWhiV1VnUFNBb2IzQjBhVzl1Y3k1eVpYRjFaWE4wSUdGeklHRnVlU2t1WDE5d1lYUm9ibUZ0WlNBL1B5QnVaWGNnVlZKTUtHOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1MWNtd3BMbkJoZEdodVlXMWxPMXh1SUNBZ0lDQWdJQ0JwWmlBb2NHRjBhRzVoYldVdVpXNWtjMWRwZEdnb1hDSXZaMlZ1WlhKaGRHVmZNakEwWENJcEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JqYjNKelNHVmhaR1Z5Y3lBOUlHZGxkRU52Y25OSVpXRmtaWEp6S0c5eWFXZHBiaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRkpsYzNCdmJuTmxLRzUxYkd3c0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkR0YwZFhNNklESXdOQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JvWldGa1pYSnpPaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lGTmxjblpsY2pvZ1hDSnRhV3hyYVc5Y0lpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTGk0dVkyOXljMGhsWVdSbGNuTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUZ3aVEyRmphR1V0UTI5dWRISnZiRndpT2lCY0ltNXZMWE4wYjNKbFhDSXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUZ3aVEyOXVkR1Z1ZEMxVWVYQmxYQ0k2SUdCMFpYaDBMM0JzWVdsdU95QjBhVzFsUFNSN1JHRjBaUzV1YjNjb0tYMWdMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lHTnZibk4wSUhCeVpWQmhkR2hCY25KaGVTQTlJQ2h2Y0hScGIyNXpMbkpsY1hWbGMzUWdZWE1nWVc1NUtTNWZYM0JoZEdoQmNuSmhlVHRjYmlBZ0lDQWdJQ0FnYkdWMElIQmhkR2hUZEhKcGJtYzZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdiR1YwSUhCaGRHaEJjbkpoZVRvZ2MzUnlhVzVuVzEwN1hHNGdJQ0FnSUNBZ0lHbG1JQ2doY25WdWRHbHRaUzVoWTJObGMzTkxaWGtnSmlZZ0tDRnlkVzUwYVcxbExtbG5ibTl5WlZCaGRHaE1aWFpsYkNCOGZDQnlkVzUwYVcxbExtbG5ibTl5WlZCaGRHaE1aWFpsYkNBOVBUMGdNQ2twSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJoZEdoVGRISnBibWNnUFNCd1lYUm9ibUZ0WlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJSEJoZEdoQmNuSmhlU0E5SUhCeVpWQmhkR2hCY25KaGVTQS9QeUJ3WVhSb2JtRnRaUzV6ZFdKemRISnBibWNvTVNrdWMzQnNhWFFvWENJdlhDSXBPMXh1SUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NHRjBhRUZ5Y21GNUlEMGdjSEpsVUdGMGFFRnljbUY1SUQ4L0lIQmhkR2h1WVcxbExuTjFZbk4wY21sdVp5Z3hLUzV6Y0d4cGRDaGNJaTljSWlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2NuVnVkR2x0WlM1aFkyTmxjM05MWlhrZ0ppWWdjR0YwYUVGeWNtRjVMbUYwS0RBcElDRTlQU0J5ZFc1MGFXMWxMbUZqWTJWemMwdGxlU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR052Y25OSVpXRmtaWEp6SUQwZ1oyVjBRMjl5YzBobFlXUmxjbk1vYjNKcFoybHVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2IzQjBhVzl1Y3k1eVlYZFNaWE53YjI1elpTa2djbVYwZFhKdUlIc2dYMTl5WVhkU1pYTndiMjV6WlRvZ2RISjFaU3dnWW05a2VUb2dYQ0pjSWl3Z2MzUmhkSFZ6T2lBME1ETXNJR2hsWVdSbGNuTTZJR052Y25OSVpXRmtaWEp6SUgwZ1lYTWdZVzU1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1VtVnpjRzl1YzJVb2RXNWtaV1pwYm1Wa0xDQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhOMFlYUjFjem9nTkRBekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JvWldGa1pYSnpPaUJqYjNKelNHVmhaR1Z5Y3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeWRXNTBhVzFsTG1sbmJtOXlaVkJoZEdoTVpYWmxiQ0FoUFQwZ2RXNWtaV1pwYm1Wa0lDWW1JSEoxYm5ScGJXVXVhV2R1YjNKbFVHRjBhRXhsZG1Wc0lDRTlQU0F3S1NCd1lYUm9RWEp5WVhrZ1BTQndZWFJvUVhKeVlYa3VjMnhwWTJVb2NuVnVkR2x0WlM1cFoyNXZjbVZRWVhSb1RHVjJaV3dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdjR0YwYUZOMGNtbHVaeUE5SUdBdkpIdHdZWFJvUVhKeVlYa3VhbTlwYmloY0lpOWNJaWw5WUR0Y2JpQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQzh2SUZCeVpTMXlaV0ZrSUdKdlpIa2dkR1Y0ZENCcFppQmhkbUZwYkdGaWJHVWdLR1p5YjIwZ1lXUmhjSFJsY2lrc0lHOTBhR1Z5ZDJselpTQjFjMlVnWVhONWJtTWdjbVZ4ZFdWemRDNTBaWGgwS0NsY2JpQWdJQ0FnSUNBZ1kyOXVjM1FnWW05a2VWUmxlSFFnUFNBb2IzQjBhVzl1Y3k1eVpYRjFaWE4wSUdGeklHRnVlU2t1WDE5aWIyUjVWR1Y0ZER0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYVhBZ1BTQnlkVzUwYVcxbExuSmxZV3hKY0NBL0lISjFiblJwYldVdWNtVmhiRWx3S0c5d2RHbHZibk11Y21WeGRXVnpkQzVvWldGa1pYSnpLU0E2SUZ3aU9qb3hYQ0k3WEc1Y2JpQWdJQ0FnSUNBZ0x5OGc1cldMNksrVjU0NnY1YUtENUxpTDU1cUVJQ1JsZG1WdWRDRG5xNi9uZ3JudnZKcnBnSnJvdjRjZ1ltRnpaVFkwSU9lOGx1ZWdnZWVhaE9TNmkrUzd0dVdRamVpbnB1V1BrZVM2aStTN3RseHVJQ0FnSUNBZ0lDQnBaaUFvYjNCMGFXOXVjeTVsYm5aTmIyUmxJRDA5UFNCY0luUmxjM1JjSWlBbUppQndZWFJvVTNSeWFXNW5Mbk4wWVhKMGMxZHBkR2dvWENJdkpHVjJaVzUwTDF3aUtTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWW1GelpUWTBUbUZ0WlNBOUlHUmxZMjlrWlZWU1NVTnZiWEJ2Ym1WdWRDaHdZWFJvVTNSeWFXNW5Mbk5zYVdObEtEZ3BLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHeGxkQ0JsZG1WdWRFNWhiV1U2SUhOMGNtbHVaenRjYmlBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4ZzVZVzg1YTY1NUxpTjVaQ002TCtRNktHTTVwZTI3N3lhNUx5WTVZV0k1TDIvNTVTb0lHRjBiMkx2dkl6bG01N3BnSURsaUxBZ1FuVm1abVZ5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCaGRHOWlJQ0U5UFNCY0luVnVaR1ZtYVc1bFpGd2lLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHVjJaVzUwVG1GdFpTQTlJR0YwYjJJb1ltRnpaVFkwVG1GdFpTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2gwZVhCbGIyWWdRblZtWm1WeUlDRTlQU0JjSW5WdVpHVm1hVzVsWkZ3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWMlpXNTBUbUZ0WlNBOUlFSjFabVpsY2k1bWNtOXRLR0poYzJVMk5FNWhiV1VzSUZ3aVltRnpaVFkwWENJcExuUnZVM1J5YVc1bktDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEdoeWIzY2dibVYzSUVWeWNtOXlLRndpVG04Z1ltRnpaVFkwSUdSbFkyOWtaWElnWVhaaGFXeGhZbXhsWENJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUgwZ1kyRjBZMmdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR052Y25OSVpXRmtaWEp6SUQwZ1oyVjBRMjl5YzBobFlXUmxjbk1vYjNKcFoybHVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmliMlI1SUQwZ1NsTlBUaTV6ZEhKcGJtZHBabmtvZXlCemRXTmpaWE56T2lCbVlXeHpaU3dnWTI5a1pUb2dYQ0pRUVZKQlRWTmZWRmxRUlY5T1QxUmZVMVZRVUU5U1ZFVkVYQ0lzSUhKbGFtVmpkRG9nZXlCbGVIQmxZM1JsWkRvZ1hDSjJZV3hwWkNCaVlYTmxOalFnWlhabGJuUWdibUZ0WlZ3aUlIMGdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHOXdkR2x2Ym5NdWNtRjNVbVZ6Y0c5dWMyVXBJSEpsZEhWeWJpQjdJRjlmY21GM1VtVnpjRzl1YzJVNklIUnlkV1VzSUdKdlpIa3NJSE4wWVhSMWN6b2dNakF3TENCb1pXRmtaWEp6T2lCN0lDNHVMbU52Y25OSVpXRmtaWEp6TENCY0lrTnZiblJsYm5RdFZIbHdaVndpT2lCY0ltRndjR3hwWTJGMGFXOXVMMnB6YjI1Y0lpQjlJSDBnWVhNZ1lXNTVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQnVaWGNnVW1WemNHOXVjMlVvWW05a2VTd2dleUJ6ZEdGMGRYTTZJREl3TUN3Z2FHVmhaR1Z5Y3pvZ2V5QXVMaTVqYjNKelNHVmhaR1Z5Y3l3Z1hDSkRiMjUwWlc1MExWUjVjR1ZjSWpvZ1hDSmhjSEJzYVdOaGRHbHZiaTlxYzI5dVhDSWdmU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJSDFjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdiR1YwSUdWMlpXNTBSR0YwWVRvZ1lXNTVJRDBnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtRjNRbTlrZVNBOUlHRjNZV2wwSUhKbFlXUkNiMlI1VkdWNGRDZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEpoZDBKdlpIa2dKaVlnY21GM1FtOWtlU0FoUFQwZ1hDSmNJaUFtSmlCeVlYZENiMlI1SUNFOVBTQmNJbnQ5WENJcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBjbmtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmxkbVZ1ZEVSaGRHRWdQU0J5WlhacGRtVktVMDlPVUdGeWMyVW9TbE5QVGk1d1lYSnpaU2h5WVhkQ2IyUjVLU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCallYUmphQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdOdmNuTklaV0ZrWlhKeklEMGdaMlYwUTI5eWMwaGxZV1JsY25Nb2IzSnBaMmx1S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1ltOWtlU0E5SUVwVFQwNHVjM1J5YVc1bmFXWjVLSHNnYzNWalkyVnpjem9nWm1Gc2MyVXNJR052WkdVNklGd2lVRUZTUVUxVFgxUlpVRVZmVGs5VVgxTlZVRkJQVWxSRlJGd2lMQ0J5WldwbFkzUTZJSHNnWlhod1pXTjBaV1E2SUZ3aWFuTnZibHdpSUgwZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHZjSFJwYjI1ekxuSmhkMUpsYzNCdmJuTmxLU0J5WlhSMWNtNGdleUJmWDNKaGQxSmxjM0J2Ym5ObE9pQjBjblZsTENCaWIyUjVMQ0J6ZEdGMGRYTTZJREl3TUN3Z2FHVmhaR1Z5Y3pvZ2V5QXVMaTVqYjNKelNHVmhaR1Z5Y3l3Z1hDSkRiMjUwWlc1MExWUjVjR1ZjSWpvZ1hDSmhjSEJzYVdOaGRHbHZiaTlxYzI5dVhDSWdmU0I5SUdGeklHRnVlVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlNaWE53YjI1elpTaGliMlI1TENCN0lITjBZWFIxY3pvZ01qQXdMQ0JvWldGa1pYSnpPaUI3SUM0dUxtTnZjbk5JWldGa1pYSnpMQ0JjSWtOdmJuUmxiblF0Vkhsd1pWd2lPaUJjSW1Gd2NHeHBZMkYwYVc5dUwycHpiMjVjSWlCOUlIMHBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWlhobFkzVjBaVWxrSUQwZ1gxOWpjbVZoZEdWSlpDZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5eWMwaGxZV1JsY25NZ1BTQm5aWFJEYjNKelNHVmhaR1Z5Y3lodmNtbG5hVzRwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2FuTnZia2hsWVdSbGNuTWdQU0I3SUM0dUxtTnZjbk5JWldGa1pYSnpMQ0JjSWtOdmJuUmxiblF0Vkhsd1pWd2lPaUJjSW1Gd2NHeHBZMkYwYVc5dUwycHpiMjVjSWl3Z1hDSkRZV05vWlMxRGIyNTBjbTlzWENJNklGd2libTh0YzNSdmNtVmNJaUI5TzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlEb2g2cmxpcWptczZqbGhhVWdZMjl1ZEdWNGRDRGlnSlFnWlhabGJuUWc1cFd3NW8ydTVMaXQ1N3FtNWE2YTVMK1g1b2lRNTVxRUlHTnZiblJsZUhRZzVZK0M1cFd3NXBlZzVyT1Y1NVN4NWFTVzZZT281THlnNVkrQzc3eU01NVN4NXB5TjVZcWg1NnV2NktHbDVZV280NENDWEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeURrdUk0Z1lXTjBhVzl1SU9hSnAraWhqT1MvbmVhTWdlUzRnT2lIdE8rOG11YWVoT1c3dXVXdWpPYVZ0T2VhaENCamIyNTBaWGgwNzd5SWJHOW5aMlZ5TDJOdmJtWnBaeTkwZVhCcFlTOWpZV3hzSU9ldGllKzhpZSs4ak9XNXR1aW5wdVdQa1Z4dUlDQWdJQ0FnSUNBZ0lDQWdMeThnYldsc2EybHZPbVY0WldOMWRHVkNaV1p2Y21VZ0x5QnRhV3hyYVc4NmFIUjBjRkpsYzNCdmJuTmxJT1M2aStTN3R1KzhqT1M5dnlCaWIyOTBjM1J5WVhBZzVZK3Y1THVsNXJPbzVZV2xJR1JpTDNKbFpHbHpJT2V0aWVpRHZlV0ttK09BZ2x4dUlDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dWMlpXNTBSR0YwWVNBbUppQjBlWEJsYjJZZ1pYWmxiblJFWVhSaElEMDlQU0JjSW05aWFtVmpkRndpSUNZbUlDRkJjbkpoZVM1cGMwRnljbUY1S0dWMlpXNTBSR0YwWVNrZ0ppWWdJU2hjSW1OdmJuUmxlSFJjSWlCcGJpQmxkbVZ1ZEVSaGRHRXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdZMjl1ZEdWNGREb2dZVzU1SUQwZ2UzMDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXlaV3BsWTNRZ1BTQnlaV3BsWTNRN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1eVlXbHpaU0E5SUhKaGFYTmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVaR1YyWld4dmNDQTlJSEoxYm5ScGJXVXVaR1YyWld4dmNEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtVjRaV04xZEdWSlpDQTlJR1Y0WldOMWRHVkpaRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbkJoZEdnZ1BTQndZWFJvVTNSeWFXNW5PMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVaVzFwZENBOUlISjFiblJwYldVdVpXMXBkRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbVZ0YVhSQmJubEJjSEJ5YjNabFpDQTlJSEoxYm5ScGJXVXVaVzFwZEVGdWVVRndjSEp2ZG1Wa08xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdVpXMXBkRUZzYkVGd2NISnZkbVZrSUQwZ2NuVnVkR2x0WlM1bGJXbDBRV3hzUVhCd2NtOTJaV1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVmSUQwZ2NuVnVkR2x0WlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNTBaWGgwTG1OdmJtWnBaeUE5SUhKMWJuUnBiV1V1Y25WdWRHbHRaUzVqYjI1bWFXYzdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNTBlWEJwWVNBOUlHZGxibVZ5WVhSbFpDNTBlWEJwWVZOamFHVnRZVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbU5oYkd3Z1BTQW9iVzlrZFd4bE9pQmhibmtzSUhCaGNtRnRjem9nWVc1NUtTQTlQaUJsZUdWamRYUmxjaTVmWDJOaGJHd29ZMjl1ZEdWNGRDd2diVzlrZFd4bExDQndZWEpoYlhNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdWIyNUdhVzVoYkd4NUlEMGdLQ2tnUFQ0Z2UzMDdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2JHOW5aMlZ5SUQwZ1kzSmxZWFJsVEc5bloyVnlLSEoxYm5ScGJXVXNJSEJoZEdoVGRISnBibWNzSUdWNFpXTjFkR1ZKWkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1c2IyZG5aWElnUFNCc2IyZG5aWEk3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVvZEhSd0lEMGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcGNDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY0dGeVlXMXpPaUI3SUhOMGNtbHVaem9nY21GM1FtOWtlU0EvUHlCY0lsd2lMQ0J3WVhKelpXUTZJR1YyWlc1MFJHRjBZU0I5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWEYxWlhOME9pQnZjSFJwYjI1ekxuSmxjWFZsYzNRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmxkbVZ1ZEVSaGRHRXVZMjl1ZEdWNGRDQTlJR052Ym5SbGVIUTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQmxiV2wwU0hSMGNGSmxjM0J2Ym5ObElEMGdLSE4xWTJObGMzTTZJR0p2YjJ4bFlXNHBJRDArSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0hKMWJuUnBiV1V1WDJoaGMwVnRhWFJJWVc1a2JHVnljejh1S0Z3aWJXbHNhMmx2T21oMGRIQlNaWE53YjI1elpWd2lLU0EvUHlCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdjblZ1ZEdsdFpTNWxiV2wwS0Z3aWJXbHNhMmx2T21oMGRIQlNaWE53YjI1elpWd2lMQ0I3SUdWNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCd1lYUm9PaUJ3WVhSb1UzUnlhVzVuTENCb2RIUndPaUJqYjI1MFpYaDBMbWgwZEhBc0lHaGxZV1JsY25NNklHOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TENCamIyNTBaWGgwTENCemRXTmpaWE56TENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSeWVTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklPV0ZpT2lucHVXUGtTQmxlR1ZqZFhSbFFtVm1iM0psNzd5SVltOXZkSE4wY21Gd0lPYXpxT1dGcFNCa1lpOXlaV1JwYysrOGllKzhqT1M2aStTN3R1V2toT2VRaHVXdWpPYUlrT1dRanVXR2plaW5wdVdQa1Z4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJvZEhSd1VtVnpjRzl1YzJYdnZJanBoNHJtbEw3b3Y1N21qcVh2dkludnZJemt1STRnWVdOMGFXOXVJT2VhaE9lVW4rV1J2ZVdScU9hY24rUy9uZWFNZ2VTNGdPaUh0T09BZ2x4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY25WdWRHbHRaUzVmYUdGelJXMXBkRWhoYm1Sc1pYSnpQeTRvWENKdGFXeHJhVzg2WlhobFkzVjBaVUpsWm05eVpWd2lLU0EvUHlCMGNuVmxLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQnlkVzUwYVcxbExtVnRhWFFvWENKdGFXeHJhVzg2WlhobFkzVjBaVUpsWm05eVpWd2lMQ0I3SUdWNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCd1lYUm9PaUJ3WVhSb1UzUnlhVzVuTENCdFpYUmhPaUI3ZlN3Z1kyOXVkR1Y0ZEN3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0J5ZFc1MGFXMWxMbVZ0YVhRb1pYWmxiblJPWVcxbExDQmxkbVZ1ZEVSaGRHRXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dLR1Z0YVhSRmNuSnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGNuSlNaWE4xYkhRZ1BTQmxlR05sY0hScGIyNUlZVzVrYkdWeUtHVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQmxiV2wwUlhKeWIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JsY25KQ2IyUjVJRDBnU2xOUFRpNXpkSEpwYm1kcFpua29aWEp5VW1WemRXeDBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElHVnRhWFJJZEhSd1VtVnpjRzl1YzJVb1ptRnNjMlVwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlJR05oZEdOb0lIdDlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHZjSFJwYjI1ekxuSmhkMUpsYzNCdmJuTmxLU0J5WlhSMWNtNGdleUJmWDNKaGQxSmxjM0J2Ym5ObE9pQjBjblZsTENCaWIyUjVPaUJsY25KQ2IyUjVMQ0J6ZEdGMGRYTTZJREl3TUN3Z2FHVmhaR1Z5Y3pvZ2FuTnZia2hsWVdSbGNuTWdmU0JoY3lCaGJuazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1VtVnpjRzl1YzJVb1pYSnlRbTlrZVN3Z2V5QnpkR0YwZFhNNklESXdNQ3dnYUdWaFpHVnljem9nYW5OdmJraGxZV1JsY25NZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKNUlIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdaVzFwZEVoMGRIQlNaWE53YjI1elpTaDBjblZsS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUh0OVhHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElISjFiblJwYldVdVpXMXBkQ2hsZG1WdWRFNWhiV1VzSUdWMlpXNTBSR0YwWVNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmpZWFJqYUNBb1pXMXBkRVZ5Y205eUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1Z5Y2xKbGMzVnNkQ0E5SUdWNFkyVndkR2x2YmtoaGJtUnNaWElvWlhobFkzVjBaVWxrTENCdWIyOXdURzluWjJWeUxDQmxiV2wwUlhKeWIzSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JsY25KQ2IyUjVJRDBnU2xOUFRpNXpkSEpwYm1kcFpua29aWEp5VW1WemRXeDBLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLRzl3ZEdsdmJuTXVjbUYzVW1WemNHOXVjMlVwSUhKbGRIVnliaUI3SUY5ZmNtRjNVbVZ6Y0c5dWMyVTZJSFJ5ZFdVc0lHSnZaSGs2SUdWeWNrSnZaSGtzSUhOMFlYUjFjem9nTWpBd0xDQm9aV0ZrWlhKek9pQnFjMjl1U0dWaFpHVnljeUI5SUdGeklHRnVlVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlNaWE53YjI1elpTaGxjbkpDYjJSNUxDQjdJSE4wWVhSMWN6b2dNakF3TENCb1pXRmtaWEp6T2lCcWMyOXVTR1ZoWkdWeWN5QjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdKdlpIa2dQU0JnZTF3aVpHRjBZVndpT2lSN1NsTlBUaTV6ZEhKcGJtZHBabmtvWlhabGJuUkVZWFJoSUQ4L0lIdDlMQ0FvYTJWNUxDQjJZV3gxWlNrZ1BUNGdhMlY1SUQwOVBTQmNJbU52Ym5SbGVIUmNJaUEvSUhWdVpHVm1hVzVsWkNBNklIWmhiSFZsS1gwc1hDSmxlR1ZqZFhSbFNXUmNJanBjSWlSN1pYaGxZM1YwWlVsa2ZWd2lMRndpYzNWalkyVnpjMXdpT25SeWRXVjlZRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h2Y0hScGIyNXpMbkpoZDFKbGMzQnZibk5sS1NCeVpYUjFjbTRnZXlCZlgzSmhkMUpsYzNCdmJuTmxPaUIwY25WbExDQmliMlI1TENCemRHRjBkWE02SURJd01Dd2dhR1ZoWkdWeWN6b2dhbk52YmtobFlXUmxjbk1nZlNCaGN5Qmhibms3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWFIxY200Z2JtVjNJRkpsYzNCdmJuTmxLR0p2Wkhrc0lIc2djM1JoZEhWek9pQXlNREFzSUdobFlXUmxjbk02SUdwemIyNUlaV0ZrWlhKeklIMHBPMXh1SUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0x5OGdQVDA5UFQwZ1JrRlRWQ0JRUVZSSUlHWnZjaUJqYjIxdGIyNGdZV04wYVc5dUlISmxjWFZsYzNSeklEMDlQVDA5WEc0Z0lDQWdJQ0FnSUM4dklGTnJhWEFnYkc5bloyVnlMQ0J5WlhGMVpYTjBJRzFoY0N3Z1lXNWtJRzF2YzNRZ2IySnFaV04wSUdOeVpXRjBhVzl1SUhkb1pXNDZYRzRnSUNBZ0lDQWdJQzh2SUMwZ2NtRjNVbVZ6Y0c5dWMyVWdiVzlrWlNBb1lXUmhjSFJsY2lsY2JpQWdJQ0FnSUNBZ0x5OGdMU0JPYnlCdmNtbG5hVzRnYUdWaFpHVnlJQ2h1YnlCRFQxSlRJRzVsWldSbFpDbGNiaUFnSUNBZ0lDQWdMeThnTFNCT2J5QmxkbVZ1ZENCb1lXNWtiR1Z5Y3lCeVpXZHBjM1JsY21Wa0lDaGtlVzVoYldsaklHTm9aV05yS1Z4dUlDQWdJQ0FnSUNBdkx5QXRJRTV2ZENCaElITjBjbVZoYlNCeVpYRjFaWE4wWEc0Z0lDQWdJQ0FnSUdsbUlDaHZjSFJwYjI1ekxuSmhkMUpsYzNCdmJuTmxJQ1ltSUNGdmNtbG5hVzRnSmlZZ1kyaGxZMnRPYjBWdGFYUklZVzVrYkdWeWN5Z3BLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCZlgybHpRV04wYVc5dUlEMGdLRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDQmhjeUJoYm5rcExsOWZhWE5CWTNScGIyNDdYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9YMTlwYzBGamRHbHZiaUFoUFQwZ1ptRnNjMlVwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QlNaWE52YkhabElISnZkWFJsSUhOamFHVnRZU0IzYVhSb0lHaHZkQ0JqWVdOb1pWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHeGxkQ0J5YjNWMFpWTmphR1Z0WVNBOUlHOXdkR2x2Ym5NdWNtOTFkR1ZUWTJobGJXRTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGeWIzVjBaVk5qYUdWdFlTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jR0YwYUZOMGNtbHVaeUE5UFQwZ1kyRmphR1ZrVUdGMGFGTjBjbWx1WnlBbUppQmpZV05vWldSU2IzVjBaVk5qYUdWdFlTa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkxZEdWVFkyaGxiV0VnUFNCallXTm9aV1JTYjNWMFpWTmphR1Z0WVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISnZkWFJsVTJOb1pXMWhJRDBnZEhKcFpTNW5aWFFvY0dGMGFGTjBjbWx1WnlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jbTkxZEdWVFkyaGxiV0VnSVQwOUlHNTFiR3dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpZV05vWldSU2IzVjBaVk5qYUdWdFlTQTlJSEp2ZFhSbFUyTm9aVzFoTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTmhZMmhsWkZCaGRHaFRkSEpwYm1jZ1BTQndZWFJvVTNSeWFXNW5PMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5YjNWMFpWTmphR1Z0WVNBOUlHZGxibVZ5WVhSbFpDNXliM1YwWlZOamFHVnRZVDh1VzNCaGRHaFRkSEpwYm1kZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeWIzVjBaVk5qYUdWdFlTQTlQVDBnZFc1a1pXWnBibVZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklEUXdOQ0F0SUdaaGJHd2dkR2h5YjNWbmFDQjBieUJ6Ykc5M0lIQmhkR2dnWm05eUlIQnliM0JsY2lCbGNuSnZjaUJvWVc1a2JHbHVaMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnY205MWRHVlRZMmhsYldFdWJXOWtkV3hsSUNFOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlNBOUlHRjNZV2wwSUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWld4elpTQnliM1YwWlZOamFHVnRZUzV0YjJSMWJHVWdQU0JoZDJGcGRDQnliM1YwWlZOamFHVnRZUzV0YjJSMWJHVW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkSEpwWlM1aFpHUW9jR0YwYUZOMGNtbHVaeXdnY205MWRHVlRZMmhsYldFcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCallXTm9aV1JTYjNWMFpWTmphR1Z0WVNBOUlISnZkWFJsVTJOb1pXMWhPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpZV05vWldSUVlYUm9VM1J5YVc1bklEMGdjR0YwYUZOMGNtbHVaenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jbTkxZEdWVFkyaGxiV0VnSmlZZ2NtOTFkR1ZUWTJobGJXRXVkSGx3WlNBOVBUMGdYQ0poWTNScGIyNWNJaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJWYzJVZ1kyRmphR1ZrSUdaMWJtTjBhVzl1SUhKbFptVnlaVzVqWlhNZ2QyaGxiaUJvYVhSMGFXNW5JSFJvWlNCellXMWxJSEp2ZFhSbFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR3hsZENCMllXeHBaR0YwWlZCaGNtRnRjeUE5SUdOaFkyaGxaRlpoYkdsa1lYUmxVR0Z5WVcxek8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JzWlhRZ2FHRnVaR3hsY2lBOUlHTmhZMmhsWkVoaGJtUnNaWEk3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHeGxkQ0J6YTJsd1ZtRnNhV1JoZEdsdmJpQTlJR05oWTJobFpGTnJhWEJXWVd4cFpHRjBhVzl1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ0lUMDlJR05oWTJobFpGSnZkWFJsVTJOb1pXMWhLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4cFpHRjBaVkJoY21GdGN5QTlJSEp2ZFhSbFUyTm9aVzFoTG5aaGJHbGtZWFJsVUdGeVlXMXpPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhR0Z1Wkd4bGNpQTlJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaUzVvWVc1a2JHVnlPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2JXVjBZU0E5SUhKdmRYUmxVMk5vWlcxaExtMXZaSFZzWlQ4dWJXVjBZVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE5yYVhCV1lXeHBaR0YwYVc5dUlEMGdiV1YwWVQ4dWRIbHdaVk5oWm1WMGVTQTlQVDBnWm1Gc2MyVWdmSHdnS0VGeWNtRjVMbWx6UVhKeVlYa29iV1YwWVQ4dWRIbHdaVk5oWm1WMGVTa2dKaVlnSVcxbGRHRXVkSGx3WlZOaFptVjBlUzVwYm1Oc2RXUmxjeWhjSW5CaGNtRnRjMXdpS1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCallXTm9aV1JXWVd4cFpHRjBaVkJoY21GdGN5QTlJSFpoYkdsa1lYUmxVR0Z5WVcxek8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyRmphR1ZrU0dGdVpHeGxjaUE5SUdoaGJtUnNaWEk3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqWVdOb1pXUlRhMmx3Vm1Gc2FXUmhkR2x2YmlBOUlITnJhWEJXWVd4cFpHRjBhVzl1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWlhobFkzVjBaVWxrSUQwZ1gxOWpjbVZoZEdWSlpDZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JpYjJSNUlEMGdZWGRoYVhRZ2NtVmhaRUp2WkhsVVpYaDBLQ2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVUdGeWMyVWdjR0Z5WVcxelhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR3hsZENCd1lYSmhiWE02SUdGdWVUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElIQmhjbUZ0YzA5cklEMGdkSEoxWlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0NGaWIyUjVJSHg4SUdKdlpIa2dQVDA5SUZ3aVhDSWdmSHdnWW05a2VTQTlQVDBnWENKN2ZWd2lLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTWdQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnlZVzF6SUQwZ2NtVjJhWFpsU2xOUFRsQmhjbk5sS0VwVFQwNHVjR0Z5YzJVb1ltOWtlU2twTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjR0Z5WVcxeklEMDlQU0JjSW5WdVpHVm1hVzVsWkZ3aUtTQndZWEpoYlhNZ1BTQjdmVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWTJGMFkyZ2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjMDlySUQwZ1ptRnNjMlU3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jR0Z5WVcxelQyc2dKaVlnY0dGeVlXMXpJQ0U5UFNCdWRXeHNJQ1ltSUhSNWNHVnZaaUJ3WVhKaGJYTWdQVDA5SUZ3aWIySnFaV04wWENJZ0ppWWdJVUZ5Y21GNUxtbHpRWEp5WVhrb2NHRnlZVzF6S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdVMnRwY0NBa2JXbHNhMmx2UjJWdVpYSmhkR1ZRWVhKaGJYTWdhVzRnZEdWemRDQnRiMlJsWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2IzQjBhVzl1Y3k1bGJuWk5iMlJsSUQwOVBTQmNJblJsYzNSY0lpQjhmQ0FoS0Z3aUpHMXBiR3RwYjBkbGJtVnlZWFJsVUdGeVlXMXpYQ0lnYVc0Z2NHRnlZVzF6S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUZaaGJHbGtZWFJsSUhCaGNtRnRjeUIzYUdWdUlIUjVjR1ZUWVdabGRIa2dhWE1nWlc1aFlteGxaRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDZ2hjMnRwY0ZaaGJHbGtZWFJwYjI0cElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnZG1Gc2FXUmhkR2x2YmlBOUlIWmhiR2xrWVhSbFVHRnlZVzF6S0hCaGNtRnRjeWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2xtSUNnaGRtRnNhV1JoZEdsdmJpNXpkV05qWlhOektTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCV1lXeHBaR0YwYVc5dUlHWmhhV3hsWkNBdElHWmhiR3dnZEdoeWIzVm5hQ0IwYnlCemJHOTNJSEJoZEdoY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0YzA5cklEMGdabUZzYzJVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jR0Z5WVcxelQyc3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnUW5WcGJHUWdiV2x1YVcxaGJDQmpiMjUwWlhoMElIVnphVzVuSUhCeWIzUnZkSGx3WlNCbWIzSWdjMmhoY21Wa0lIQnliM0JsY25ScFpYTmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWTI5dWRHVjRkRG9nWVc1NUlEMGdUMkpxWldOMExtTnlaV0YwWlNoaVlYTmxRMjl1ZEdWNGRGQnliM1J2S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzV3WVhSb0lEMGdjR0YwYUZOMGNtbHVaenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXliM1YwWlZSNWNHVWdQU0JjSW1GamRHbHZibHdpTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbVY0WldOMWRHVkpaQ0E5SUdWNFpXTjFkR1ZKWkR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVvZEhSd0lEMGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZFhKc09pQndZWFJvYm1GdFpTeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2x3TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRjBhRG9nZXlCemRISnBibWM2SUhCaGRHaFRkSEpwYm1jc0lHRnljbUY1T2lCd1lYUm9RWEp5WVhrZ2ZTeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEJoY21GdGN6b2dleUJ6ZEhKcGJtYzZJR0p2Wkhrc0lIQmhjbk5sWkRvZ2NHRnlZVzF6SUgwc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWEYxWlhOME9pQnZjSFJwYjI1ekxuSmxjWFZsYzNRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE53YjI1elpUb2dabUZ6ZEZCaGRHaFNaWE53YjI1elpTeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Y25Nc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1YUdWaFpHVnljeUE5SUc5d2RHbHZibk11Y21WeGRXVnpkQzVvWldGa1pYSnpPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpYTjFiSFFnUFNCaGQyRnBkQ0JvWVc1a2JHVnlLR052Ym5SbGVIUXNJSEJoY21GdGN5azdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHlaWE4xYkhRZ1BUMDlJSFZ1WkdWbWFXNWxaQ0I4ZkNCeVpYTjFiSFFnUFQwOUlHNTFiR3dnZkh3Z2NtVnpkV3gwSUQwOVBTQmNJbHdpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJSHNnWDE5eVlYZFNaWE53YjI1elpUb2dkSEoxWlN3Z1ltOWtlVG9nWlcxd2RIbFNaWE4xYkhSUWNtVm1hWGdnS3lCbGVHVmpkWFJsU1dRZ0t5QnBaRk4xWm1acGVDd2djM1JoZEhWek9pQXlNREFzSUdobFlXUmxjbk02SUdSbFptRjFiSFJOWlhKblpXUklaV0ZrWlhKeklIMGdZWE1nWVc1NU8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU0JsYkhObElHbG1JQ2doUVhKeVlYa3VhWE5CY25KaGVTaHlaWE4xYkhRcElDWW1JSFI1Y0dWdlppQnlaWE4xYkhRZ1BUMDlJRndpYjJKcVpXTjBYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNGdleUJmWDNKaGQxSmxjM0J2Ym5ObE9pQjBjblZsTENCaWIyUjVPaUJ5WlhOMWJIUlFjbVZtYVhnZ0t5QktVMDlPTG5OMGNtbHVaMmxtZVNoeVpYTjFiSFFwSUNzZ0p5eGNJbVY0WldOMWRHVkpaRndpT2x3aUp5QXJJR1Y0WldOMWRHVkpaQ0FySUdsa1UzVm1abWw0TENCemRHRjBkWE02SURJd01Dd2dhR1ZoWkdWeWN6b2daR1ZtWVhWc2RFMWxjbWRsWkVobFlXUmxjbk1nZlNCaGN5Qmhibms3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJKYm5aaGJHbGtJSEpsYzNWc2RDQjBlWEJsSUMwZ1ptRnNiQ0IwYUhKdmRXZG9JSFJ2SUhOc2IzY2djR0YwYUZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdOaGRHTm9JSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFaGhibVJzWlhJZ2RHaHlaWGNnTFNCbVlXeHNJSFJvY205MVoyZ2dkRzhnYzJ4dmR5QndZWFJvSUdadmNpQndjbTl3WlhJZ1pYSnliM0lnYUdGdVpHeHBibWRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUM4dklEMDlQVDA5SUZOTVQxY2dVRUZVU0NBOVBUMDlQVnh1SUNBZ0lDQWdJQ0JqYjI1emRDQmpiM0p6U0dWaFpHVnljeUE5SUdkbGRFTnZjbk5JWldGa1pYSnpLRzl5YVdkcGJpazdYRzRnSUNBZ0lDQWdJR052Ym5OMElISmhkMFY0WldOMWRHVkpaQ0E5SUhKMWJuUnBiV1UvTG1WNFpXTjFkR1ZKWkNBL0lHRjNZV2wwSUhKMWJuUnBiV1V1WlhobFkzVjBaVWxrS0c5d2RHbHZibk11Y21WeGRXVnpkQzVvWldGa1pYSnpLU0E2SUY5ZlkzSmxZWFJsU1dRb0tUdGNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1pYaGxZM1YwWlVsa0lEMGdjMkZ1YVhScGVtVkZlR1ZqZFhSbFNXUW9jbUYzUlhobFkzVjBaVWxrS1NCOGZDQmZYMk55WldGMFpVbGtLQ2s3WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR0Z1ZVVWdGFYUklZVzVrYkdWeWN5QTlJQ0ZqYUdWamEwNXZSVzFwZEVoaGJtUnNaWEp6S0NrN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2JHOW5aMlZ5SUQwZ1kzSmxZWFJsVEc5bloyVnlLSEoxYm5ScGJXVXNJSEJoZEdoVGRISnBibWNzSUdWNFpXTjFkR1ZKWkNrN1hHNGdJQ0FnSUNBZ0lHbG1JQ2hoYm5sRmJXbDBTR0Z1Wkd4bGNuTXBJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNXlaWEYxWlhOMExuTmxkQ2hsZUdWamRYUmxTV1FzSUhzZ2JHOW5aMlZ5SUgwcE8xeHVJQ0FnSUNBZ0lDQXZMeUJRY21VdFkyOXRjSFYwWlNCaVlYTmxJR2hsWVdSbGNuTWdabTl5SUhSb2FYTWdjbVZ4ZFdWemRDQW9RMDlTVXlBcklHUmxabUYxYkhSektWeHVJQ0FnSUNBZ0lDQmpiMjV6ZENCaVlYTmxTR1ZoWkdWeWN6b2dVbVZqYjNKa1BITjBjbWx1Wnl3Z2MzUnlhVzVuUGlBOUlHOXlhV2RwYmlBL0lIc2dMaTR1WTI5eWMwaGxZV1JsY25Nc0lDNHVMbVJsWm1GMWJIUlNaWE53YjI1elpVaGxZV1JsY25NZ2ZTQTZJR1JsWm1GMWJIUk5aWEpuWldSSVpXRmtaWEp6TzF4dVhHNGdJQ0FnSUNBZ0lHeGxkQ0JtYVc1aGJHVnpPaUJCY25KaGVUd29LU0E5UGlCMmIybGtJSHdnVUhKdmJXbHpaVHgyYjJsa1BqNGdQU0JiWFR0Y2JseHVJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpYTndiMjV6WlRvZ1RXbHNhMmx2U0hSMGNGSmxjM0J2Ym5ObElEMGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1ltOWtlVG9nWENKY0lpeGNiaUFnSUNBZ0lDQWdJQ0FnSUhOMFlYUjFjem9nTWpBd0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnYUdWaFpHVnljem9nZXlBdUxpNWlZWE5sU0dWaFpHVnljeUI5TEZ4dUlDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJQzh2SUVOb1pXTnJJR2xtSUhSb2FYTWdhWE1nWVNCeVlYY2djbTkxZEdVZzRvQ1VJSEpoZHlCeWIzVjBaWE1nWW5sd1lYTnpJR0ZqZEdsdmJpOXpkSEpsWVcwZ2JHOW5hV05jYmlBZ0lDQWdJQ0FnTHk4Z1lXNWtJR3hsZENCMGFHVWdhR0Z1Wkd4bGNpQnZkMjRnZEdobElHWjFiR3dnVW1WeGRXVnpkQzlTWlhOd2IyNXpaU0JzYVdabFkzbGpiR1V1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2x6VW1GM1VHRjBhQ0E5SUdkbGJtVnlZWFJsWkM1eVlYZFRZMmhsYldFL0xuSmhkMUJoZEdoelB5NW9ZWE1vY0dGMGFGTjBjbWx1WnlrZ1B6OGdabUZzYzJVN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FIUjBjRG9nUTI5dWRHVjRkRWgwZEhBZ1BTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMWNtdzZJSEJoZEdodVlXMWxJR0Z6SUdGdWVTeGNiaUFnSUNBZ0lDQWdJQ0FnSUdsd0xGeHVJQ0FnSUNBZ0lDQWdJQ0FnY0dGMGFEb2dleUJ6ZEhKcGJtYzZJSEJoZEdoVGRISnBibWNnWVhNZ2EyVjViMllnSkhSNWNHVnpXMXdpWjJWdVpYSmhkR1ZrWENKZFcxd2ljbTkxZEdWVFkyaGxiV0ZjSWwwc0lHRnljbUY1T2lCd1lYUm9RWEp5WVhrZ2ZTeGNiaUFnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjem9nZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFWnZjaUJ5WVhjZ2NtOTFkR1Z6TENCa2IyNG5kQ0JqYjI1emRXMWxJSFJvWlNCeVpYRjFaWE4wSUdKdlpIa2c0b0NVSUhSb1pTQm9ZVzVrYkdWeVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdibVZsWkhNZ2FYUWdhVzUwWVdOMExpQlVhR1VnWW05a2VTQjNhV3hzSUdKbElIQmhjM05sWkNCMmFXRWdkR2hsSUZKbGNYVmxjM1FnYjJKcVpXTjBMbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wY21sdVp6b2dhWE5TWVhkUVlYUm9JRDhnWENKY0lpQTZJQ2hoZDJGcGRDQnlaV0ZrUW05a2VWUmxlSFFvS1Nrc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHRnljMlZrT2lCMWJtUmxabWx1WldRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdjbVZ4ZFdWemREb2diM0IwYVc5dWN5NXlaWEYxWlhOMExGeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemNHOXVjMlVzWEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiM0p6TEZ4dUlDQWdJQ0FnSUNCOU8xeHVYRzRnSUNBZ0lDQWdJR052Ym5OMElHTnZiblJsZUhRNklHRnVlU0E5SUhzZ2NtVnFaV04wTENCeVlXbHpaU0I5TzF4dUlDQWdJQ0FnSUNCMGNua2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdRMmhsWTJzZ2FXWWdaVzFwZENCb1lYTWdhR0Z1Wkd4bGNuTWdZbVZtYjNKbElHRjNZV2wwYVc1blhHNGdJQ0FnSUNBZ0lDQWdJQ0JqYjI1emRDQm9ZWE5JZEhSd1VtVnhkV1Z6ZEVoaGJtUnNaWEp6SUQwZ2NuVnVkR2x0WlM1ZmFHRnpSVzFwZEVoaGJtUnNaWEp6UHk0b1hDSnRhV3hyYVc4NmFIUjBjRkpsY1hWbGMzUmNJaWtnUHo4Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hvWVhOSWRIUndVbVZ4ZFdWemRFaGhibVJzWlhKektTQmhkMkZwZENCeWRXNTBhVzFsTG1WdGFYUW9YQ0p0YVd4cmFXODZhSFIwY0ZKbGNYVmxjM1JjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lHaDBkSEFzSUhKbGFtVmpkQ3dnY21GcGMyVWdmU2s3WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQzh2SU9tZG5pQjBaWE4wSU9lT3IrV2lnK1M0aSthTHB1YUlxaUFrWlhod2IzSjBjeURsaG9YcGc2am90Ni9sdm9SY2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNodmNIUnBiMjV6TG1WdWRrMXZaR1VnSVQwOUlGd2lkR1Z6ZEZ3aUlDWW1JQ2hvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeWt1YVc1amJIVmtaWE1vWENJa1hDSXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWVhkaGFYUWdjblZ1ZEdsdFpTNWxiV2wwS0Z3aWJXbHNhMmx2T21oMGRIQk9iM1JHYjNWdVpGd2lMQ0I3SUdWNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeXdnYUhSMGNDd2djbVZxWldOMExDQnlZV2x6WlNCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBhSEp2ZHlCeVpXcGxZM1FvWENKT1QxUmZSazlWVGtSY0lpd2dleUJ3WVhSb09pQm9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5QjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0x5OGdQVDA5UFQwZ1VrRlhJRkJCVkVnZ1BUMDlQVDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRkpoZHlCeWIzVjBaWE1nY21WalpXbDJaU0JoSUc1aGRHbDJaU0JTWlhGMVpYTjBJR0Z1WkNCeVpYUjFjbTRnWVNCdVlYUnBkbVVnVW1WemNHOXVjMlV1WEc0Z0lDQWdJQ0FnSUNBZ0lDQXZMeUJVYUdWNUlHSjVjR0Z6Y3lCMGVYQnBZU0IyWVd4cFpHRjBhVzl1TENCS1UwOU9JSE5sY21saGJHbDZZWFJwYjI0c0lHRnVaQ0J6ZEdGeVoyRjBaUzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRlZ6WlNCallYTmxPaUJUVTBVZ2NHRnpjM1JvY205MVoyZ2dLR1V1Wnk0Z1QzQmxia0ZKSUhCeWIzaDVLU3dnZDJWaWFHOXZhM01zSUdKcGJtRnllUzVjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hwYzFKaGQxQmhkR2dwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0J5WVhkU2IzVjBaU0E5SUdkbGJtVnlZWFJsWkM1eVlYZFRZMmhsYldFdWNtOTFkR1Z6VzNCaGRHaFRkSEpwYm1kZE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2doY21GM1VtOTFkR1VwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2NuVnVkR2x0WlM1bGJXbDBLRndpYldsc2EybHZPbWgwZEhCT2IzUkdiM1Z1WkZ3aUxDQjdJR1Y0WldOMWRHVkpaQ3dnYkc5bloyVnlMQ0J3WVhSb09pQm9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5d2dhSFIwY0N3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkR2h5YjNjZ2NtVnFaV04wS0Z3aVRrOVVYMFpQVlU1RVhDSXNJSHNnY0dGMGFEb2dhSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY2dmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklFeGhlbmt0Ykc5aFpDQnRiMlIxYkdVZ2IyNGdabWx5YzNRZ1lXTmpaWE56TENCMGFHVnVJR05oWTJobFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJRzF2WkhWc1pUb2dZVzU1SUQwZ2NtRjNVbTkxZEdVdWJXOWtkV3hsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2JXOWtkV3hsSUQwOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdiVzlrZFd4bElEMGdZWGRoYVhRZ2JXOWtkV3hsS0NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpoZDFKdmRYUmxMbTF2WkhWc1pTQTlJRzF2WkhWc1pUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2JXVjBZU0E5SUcxdlpIVnNaVDh1YldWMFlTQS9QeUI3ZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRU52Ym5OMGNuVmpkQ0JtZFd4c0lHTnZiblJsZUhRZ0tISmhkeUJrYjJWemJpZDBJR2R2SUhSb2NtOTFaMmdnWDE5bGVHVmpkWFJsTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUM4dklITnZJSGRsSUhObGRDQmhiR3dnWm1sbGJHUnpJRzFoYm5WaGJHeDVJR2hsY21VcFhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1b2RIUndJRDBnYUhSMGNEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtaGxZV1JsY25NZ1BTQm9kSFJ3TG5KbGNYVmxjM1F1YUdWaFpHVnljenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbVJsZG1Wc2IzQWdQU0J5ZFc1MGFXMWxMbVJsZG1Wc2IzQTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXdZWFJvSUQwZ2NHRjBhRk4wY21sdVp6dGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExuSnZkWFJsVkhsd1pTQTlJRndpY21GM1hDSTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEdWNGRDNXNiMmRuWlhJZ1BTQnNiMmRuWlhJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1bGJXbDBJRDBnY25WdWRHbHRaUzVsYldsME8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdVpXMXBkRUZ1ZVVGd2NISnZkbVZrSUQwZ2NuVnVkR2x0WlM1bGJXbDBRVzU1UVhCd2NtOTJaV1E3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRHVjRkQzVsYldsMFFXeHNRWEJ3Y205MlpXUWdQU0J5ZFc1MGFXMWxMbVZ0YVhSQmJHeEJjSEJ5YjNabFpEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtVjRaV04xZEdWSlpDQTlJR1Y0WldOMWRHVkpaRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbU52Ym1acFp5QTlJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNWpiMjVtYVdjN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1MGVYQnBZU0E5SUdkbGJtVnlZWFJsWkM1MGVYQnBZVk5qYUdWdFlUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtTmhiR3dnUFNBb2JXOWtPaUJoYm5rc0lIQmhjbUZ0Y3pvZ1lXNTVLU0E5UGlCbGVHVmpkWFJsY2k1ZlgyTmhiR3dvWTI5dWRHVjRkQ3dnYlc5a0xDQndZWEpoYlhNcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdWIyNUdhVzVoYkd4NUlEMGdLR2hoYm1Sc1pYSTZJR0Z1ZVNrZ1BUNGdabWx1WVd4bGN5NTFibk5vYVdaMEtHaGhibVJzWlhJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJsZUhRdVh5QTlJSEoxYm5ScGJXVTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCSlppQmhaR0Z3ZEdWeUlIQnlaUzF5WldGa0lIUm9aU0JpYjJSNUlDaGliMlI1VkdWNGRDQnpaWFFwTENCeVpXTnZibk4wY25WamRDQmhYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnVW1WeGRXVnpkQ0IzYVhSb0lIUm9aU0JpYjJSNUlISmxMV2x1YW1WamRHVmtJSE52SUhSb1pTQm9ZVzVrYkdWeUlHTmhiaUJ5WldGa0lHbDBMbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUU5MGFHVnlkMmx6WlN3Z2RHaGxJRzl5YVdkcGJtRnNJSEpsY1hWbGMzUWdZbTlrZVNCcGN5QnpkR2xzYkNCcGJuUmhZM1FnS0hkbElITnJhWEJ3WldSY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QnlaV0ZrYVc1bklHbDBJR0ZpYjNabElHWnZjaUJ5WVhjZ2NHRjBhSE1wTGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR2hoYm1Sc1pYSlNaWEYxWlhOME9pQlNaWEYxWlhOMElEMGdZbTlrZVZSbGVIUWdJVDA5SUhWdVpHVm1hVzVsWkZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQS9JRzVsZHlCU1pYRjFaWE4wS0c5d2RHbHZibk11Y21WeGRXVnpkQzUxY213c0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHMWxkR2h2WkRvZ2IzQjBhVzl1Y3k1eVpYRjFaWE4wTG0xbGRHaHZaQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdSbGNuTTZJRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1ltOWtlVG9nWW05a2VWUmxlSFFnZkh3Z2JuVnNiQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE5wWjI1aGJEb2diM0IwYVc5dWN5NXlaWEYxWlhOMExuTnBaMjVoYkN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ09pQnZjSFJwYjI1ekxuSmxjWFZsYzNRN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpYTjFiSFJ6T2lCU1pYTjFiSFJ6UEdGdWVUNGdQU0I3SUhaaGJIVmxPaUIxYm1SbFptbHVaV1FnZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5ZFc1MGFXMWxMbDlvWVhORmJXbDBTR0Z1Wkd4bGNuTS9MaWhjSW0xcGJHdHBienBsZUdWamRYUmxRbVZtYjNKbFhDSXBJRDgvSUhSeWRXVXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnY25WdWRHbHRaUzVsYldsMEtGd2liV2xzYTJsdk9tVjRaV04xZEdWQ1pXWnZjbVZjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2NHRjBhRk4wY21sdVp5d2diV1YwWVN3Z1kyOXVkR1Y0ZEN3Z2NtVnFaV04wTENCeVlXbHpaU0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVlYZFNaWE53YjI1elpUb2dVbVZ6Y0c5dWMyVWdQU0JoZDJGcGRDQnRiMlIxYkdVdWFHRnVaR3hsY2loamIyNTBaWGgwTENCb1lXNWtiR1Z5VW1WeGRXVnpkQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBjeTUyWVd4MVpTQTlJSEpoZDFKbGMzQnZibk5sTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEoxYm5ScGJXVXVYMmhoYzBWdGFYUklZVzVrYkdWeWN6OHVLRndpYldsc2EybHZPbVY0WldOMWRHVkJablJsY2x3aUtTQS9QeUIwY25WbEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJSEoxYm5ScGJXVXVaVzFwZENoY0ltMXBiR3RwYnpwbGVHVmpkWFJsUVdaMFpYSmNJaXdnZXlCbGVHVmpkWFJsU1dRc0lHeHZaMmRsY2l3Z2NHRjBhRG9nY0dGMGFGTjBjbWx1Wnl3Z2JXVjBZU3dnWTI5dWRHVjRkQ3dnY21WemRXeDBjeXdnY21WcVpXTjBMQ0J5WVdselpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkJjSEJzZVNCRFQxSlRJR2hsWVdSbGNuTWdkRzhnZEdobElISmhkeUJ5WlhOd2IyNXpaVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHWnBibUZzU0dWaFpHVnljeUE5SUc1bGR5QklaV0ZrWlhKektISmhkMUpsYzNCdmJuTmxMbWhsWVdSbGNuTXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnVzJzc0lIWmRJRzltSUU5aWFtVmpkQzVsYm5SeWFXVnpLR052Y25OSVpXRmtaWEp6S1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXWnBibUZzU0dWaFpHVnljeTVvWVhNb2F5a3BJR1pwYm1Gc1NHVmhaR1Z5Y3k1elpYUW9heXdnZGlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2FHRnpTSFIwY0ZKbGMzQnZibk5sU0dGdVpHeGxjbk1nUFNCeWRXNTBhVzFsTGw5b1lYTkZiV2wwU0dGdVpHeGxjbk0vTGloY0ltMXBiR3RwYnpwb2RIUndVbVZ6Y0c5dWMyVmNJaWtnUHo4Z2RISjFaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2FHRnpTSFIwY0ZKbGMzQnZibk5sU0dGdVpHeGxjbk1wSUdGM1lXbDBJSEoxYm5ScGJXVXVaVzFwZENoY0ltMXBiR3RwYnpwb2RIUndVbVZ6Y0c5dWMyVmNJaXdnZXlCbGVHVmpkWFJsU1dRc0lHeHZaMmRsY2l3Z2NHRjBhRG9nYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNzSUdoMGRIQXNJR2hsWVdSbGNuTTZJR2gwZEhBdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TENCamIyNTBaWGgwTENCemRXTmpaWE56T2lCMGNuVmxMQ0J5WldwbFkzUXNJSEpoYVhObElIMHBPMXh1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1VuVnVJRzl1Um1sdVlXeHNlU0JvWVc1a2JHVnljeUFvWVdaMFpYSWdhSFIwY0ZKbGMzQnZibk5sTENCdFlYUmphR2x1WnlCaFkzUnBiMjRnY0dGMGFDQnZjbVJsY21sdVp5bGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvWm1sdVlXeGxjeTVzWlc1bmRHZ2dQaUF3S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1p2Y2lBb1kyOXVjM1FnYUdGdVpHeGxjaUJ2WmlCbWFXNWhiR1Z6S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGNua2dleUJoZDJGcGRDQm9ZVzVrYkdWeUtDazdJSDBnWTJGMFkyZ2dLR1Z5Y205eUtTQjdJR3h2WjJkbGNpNWxjbkp2Y2loY0lrRnVJR1Z5Y205eUlHOWpZM1Z5Y21Wa0lHbHVjMmxrWlNCdmJrWnBibUZzYkhrdVhDSXNJR1Z5Y205eUtUc2dmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0doaGMwOXVURzluWjJWeVUzVmliV2wwZEdsdVp5a2dZWGRoYVhRZ2JHOW5aMlZ5TGw4dWMzVmliV2wwS0dOdmJuUmxlSFFnWVhNZ1lXNTVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb1lXNTVSVzFwZEVoaGJtUnNaWEp6S1NCeWRXNTBhVzFsTG5KMWJuUnBiV1V1Y21WeGRXVnpkQzVrWld4bGRHVW9aWGhsWTNWMFpVbGtLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhKbGRIVnliaUJ1WlhjZ1VtVnpjRzl1YzJVb2NtRjNVbVZ6Y0c5dWMyVXVZbTlrZVN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZEdGMGRYTTZJSEpoZDFKbGMzQnZibk5sTG5OMFlYUjFjeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MzUmhkSFZ6VkdWNGREb2djbUYzVW1WemNHOXVjMlV1YzNSaGRIVnpWR1Y0ZEN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhR1ZoWkdWeWN6b2dabWx1WVd4SVpXRmtaWEp6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb0lXOXdkR2x2Ym5NdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TG1kbGRDaGNJa0ZqWTJWd2RGd2lLVDh1YzNSaGNuUnpWMmwwYUNoY0luUmxlSFF2WlhabGJuUXRjM1J5WldGdFhDSXBLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1lXTjBhVzl1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElISnZkWFJsVTJOb1pXMWhJRDBnYjNCMGFXOXVjeTV5YjNWMFpWTmphR1Z0WVR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9JWEp2ZFhSbFUyTm9aVzFoS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUVodmRDQndZWFJvT2lCamFHVmpheUJ6YVc1bmJHVXRaVzUwY25rZ1kyRmphR1VnWm1seWMzUmNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIQmhkR2hUZEhKcGJtY2dQVDA5SUdOaFkyaGxaRkJoZEdoVGRISnBibWNnSmlZZ1kyRmphR1ZrVW05MWRHVlRZMmhsYldFcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISnZkWFJsVTJOb1pXMWhJRDBnWTJGamFHVmtVbTkxZEdWVFkyaGxiV0U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdaV3h6WlNCcFppQW9LR2gwZEhBdWNHRjBhQzV6ZEhKcGJtY2dZWE1nYzNSeWFXNW5LUzVwYm1Oc2RXUmxjeWhjSWlSY0lpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZFhSbFUyTm9aVzFoSUQwZ2RISnBaUzVuWlhRb2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEp2ZFhSbFUyTm9aVzFoSUQwOVBTQnVkV3hzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkxZEdWVFkyaGxiV0VnUFNCblpXNWxjbUYwWldRdWNtOTFkR1ZUWTJobGJXRS9MbHRvZEhSd0xuQmhkR2d1YzNSeWFXNW5YVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jbTkxZEdWVFkyaGxiV0VnUFQwOUlIVnVaR1ZtYVc1bFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCeWRXNTBhVzFsTG1WdGFYUW9YQ0p0YVd4cmFXODZhSFIwY0U1dmRFWnZkVzVrWENJc0lIc2daWGhsWTNWMFpVbGtMQ0JzYjJkblpYSXNJSEJoZEdnNklHaDBkSEF1Y0dGMGFDNXpkSEpwYm1jZ1lYTWdjM1J5YVc1bkxDQm9kSFJ3TENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnlaV3BsWTNRb1hDSk9UMVJmUms5VlRrUmNJaXdnZXlCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeUI5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCeWIzVjBaVk5qYUdWdFlTNXRiMlIxYkdVZ0lUMDlJRndpWm5WdVkzUnBiMjVjSWlrZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElEMGdZWGRoYVhRZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1ZzYzJVZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElEMGdZWGRoYVhRZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKcFpTNWhaR1FvYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNzSUhKdmRYUmxVMk5vWlcxaEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEp2ZFhSbFUyTm9aVzFoSUQwZ2RISnBaUzVuWlhRb2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLSEp2ZFhSbFUyTm9aVzFoSUQwOVBTQnVkV3hzS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbTkxZEdWVFkyaGxiV0VnUFNCblpXNWxjbUYwWldRdWNtOTFkR1ZUWTJobGJXRS9MbHRvZEhSd0xuQmhkR2d1YzNSeWFXNW5YVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9jbTkxZEdWVFkyaGxiV0VnUFQwOUlIVnVaR1ZtYVc1bFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCeWRXNTBhVzFsTG1WdGFYUW9YQ0p0YVd4cmFXODZhSFIwY0U1dmRFWnZkVzVrWENJc0lIc2daWGhsWTNWMFpVbGtMQ0JzYjJkblpYSXNJSEJoZEdnNklHaDBkSEF1Y0dGMGFDNXpkSEpwYm1jZ1lYTWdjM1J5YVc1bkxDQm9kSFJ3TENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwYUhKdmR5QnlaV3BsWTNRb1hDSk9UMVJmUms5VlRrUmNJaXdnZXlCd1lYUm9PaUJvZEhSd0xuQmhkR2d1YzNSeWFXNW5JR0Z6SUhOMGNtbHVaeUI5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIUjVjR1Z2WmlCeWIzVjBaVk5qYUdWdFlTNXRiMlIxYkdVZ0lUMDlJRndpWm5WdVkzUnBiMjVjSWlrZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElEMGdZWGRoYVhRZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1ZzYzJVZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElEMGdZWGRoYVhRZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKcFpTNWhaR1FvYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNzSUhKdmRYUmxVMk5vWlcxaEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDOHZJRlZ3WkdGMFpTQm9iM1FnY0dGMGFDQmpZV05vWlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTJGamFHVmtVbTkxZEdWVFkyaGxiV0VnUFNCeWIzVjBaVk5qYUdWdFlUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTmhZMmhsWkZCaGRHaFRkSEpwYm1jZ1BTQndZWFJvVTNSeWFXNW5PMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tISnZkWFJsVTJOb1pXMWhMblI1Y0dVZ0lUMDlJRndpWVdOMGFXOXVYQ0lwSUhSb2NtOTNJSEpsYW1WamRDaGNJbFZPUVVORFJWQlVRVUpNUlZ3aUxDQjdJR1Y0Y0dWamRHVmtPaUJjSW5OMGNtVmhiVndpTENCdFpYTnpZV2RsT2lCZ1RtOTBJR0ZqWTJWd2RHRmliR1VzSUhSb1pTQkJZMk5sY0hRZ2FXNGdkR2hsSUhKbGNYVmxjM1FnYUdWaFpHVnlJSE5vYjNWc1pDQmlaU0JjSW5SbGVIUXZaWFpsYm5RdGMzUnlaV0Z0WENJdUlFbG1JSGx2ZFNCaGNtVWdkWE5wYm1jZ2RHaGxJRndpUUcxcGJHdHBieTl6ZEdGeVoyRjBaVndpSUhCaFkydGhaMlVzSUhCc1pXRnpaU0JoWkdRZ1hGeGdkSGx3WlRvZ1hDSnpkSEpsWVcxY0lseGNZQ0IwYnlCMGFHVWdaWGhsWTNWMFpTQnZjSFJwYjI1ekxtQWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEM1b2RIUndJRDBnYUhSMGNEdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtaGxZV1JsY25NZ1BTQm9kSFJ3TG5KbGNYVmxjM1F1YUdWaFpHVnljenRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MFpYaDBMbkp2ZFhSbFZIbHdaU0E5SUZ3aVlXTjBhVzl1WENJN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCbGVHVmpkWFJsWkNBOUlHRjNZV2wwSUdWNFpXTjFkR1Z5TGw5ZlpYaGxZM1YwWlNoeWIzVjBaVk5qYUdWdFlTd2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamNtVmhkR1ZrUlhobFkzVjBaVWxrT2lCbGVHVmpkWFJsU1dRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR055WldGMFpXUk1iMmRuWlhJNklHeHZaMmRsY2l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0YwYURvZ2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdSbGNuTTZJRzl3ZEdsdmJuTXVjbVZ4ZFdWemRDNW9aV0ZrWlhKeklHRnpJRWhsWVdSbGNuTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0Y3pvZ2FIUjBjQzV3WVhKaGJYTXVjM1J5YVc1bkxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTlVlWEJsT2lCY0luTjBjbWx1WjF3aUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTkRiMjUwWlc1MFZIbHdaVG9nWENKcWMyOXVYQ0lzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1ptbHVZV3hsY3lBOUlHVjRaV04xZEdWa0xtWnBibUZzWlhNN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY21WemNHOXVjMlV1WW05a2VTQTlQVDBnWENKY0lpQW1KaUJsZUdWamRYUmxaQzV5WlhOMWJIUnpMblpoYkhWbElDRTlQU0IxYm1SbFptbHVaV1FwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0dWNFpXTjFkR1ZrTG1WdGNIUjVVbVZ6ZFd4MEtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnlaWE53YjI1elpTNWliMlI1SUQwZ1lIdGNJbVJoZEdGY0lqcDdmU3hjSW1WNFpXTjFkR1ZKWkZ3aU9sd2lKSHRsZUdWamRYUmxTV1I5WENJc1hDSnpkV05qWlhOelhDSTZkSEoxWlgxZ08xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6Y0c5dWMyVXVZbTlrZVNBOUlHQjdYQ0prWVhSaFhDSTZKSHRLVTA5T0xuTjBjbWx1WjJsbWVTaGxlR1ZqZFhSbFpDNXlaWE4xYkhSekxuWmhiSFZsS1gwc1hDSmxlR1ZqZFhSbFNXUmNJanBjSWlSN1pYaGxZM1YwWlVsa2ZWd2lMRndpYzNWalkyVnpjMXdpT25SeWRXVjlZRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHaGhjMGgwZEhCU1pYTndiMjV6WlVoaGJtUnNaWEp6SUQwZ2NuVnVkR2x0WlM1ZmFHRnpSVzFwZEVoaGJtUnNaWEp6UHk0b1hDSnRhV3hyYVc4NmFIUjBjRkpsYzNCdmJuTmxYQ0lwSUQ4L0lIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHaGhjMGgwZEhCU1pYTndiMjV6WlVoaGJtUnNaWEp6S1NCaGQyRnBkQ0J5ZFc1MGFXMWxMbVZ0YVhRb1hDSnRhV3hyYVc4NmFIUjBjRkpsYzNCdmJuTmxYQ0lzSUhzZ1pYaGxZM1YwWlVsa0xDQnNiMmRuWlhJc0lIQmhkR2c2SUdoMGRIQXVjR0YwYUM1emRISnBibWNnWVhNZ2MzUnlhVzVuTENCb2RIUndMQ0JvWldGa1pYSnpPaUJvZEhSd0xuSmxjWFZsYzNRdWFHVmhaR1Z5Y3l3Z1kyOXVkR1Y0ZERvZ1pYaGxZM1YwWldRdVkyOXVkR1Y0ZEN3Z2MzVmpZMlZ6Y3pvZ2RISjFaU3dnY21WcVpXTjBMQ0J5WVdselpTQjlLVHRjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaG1hVzVoYkdWekxteGxibWQwYUNBK0lEQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1ptOXlJQ2hqYjI1emRDQm9ZVzVrYkdWeUlHOW1JR1pwYm1Gc1pYTXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFJ5ZVNCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2FHRnVaR3hsY2lncE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmpZWFJqYUNBb1pYSnliM0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnNiMmRuWlhJdVpYSnliM0lvWENKQmJpQmxjbkp2Y2lCdlkyTjFjbkpsWkNCcGJuTnBaR1VnYjI1R2FXNWhiR3g1TGx3aUxDQmxjbkp2Y2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCcFppQW9hR0Z6VDI1TWIyZG5aWEpUZFdKdGFYUjBhVzVuS1NCaGQyRnBkQ0JzYjJkblpYSXVYeTV6ZFdKdGFYUW9ZMjl1ZEdWNGRDQmhjeUJoYm5rcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hoYm5sRmJXbDBTR0Z1Wkd4bGNuTXBJSEoxYm5ScGJXVXVjblZ1ZEdsdFpTNXlaWEYxWlhOMExtUmxiR1YwWlNobGVHVmpkWFJsU1dRcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h2Y0hScGIyNXpMbkpoZDFKbGMzQnZibk5sS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsZEhWeWJpQjdJRjlmY21GM1VtVnpjRzl1YzJVNklIUnlkV1VzSUdKdlpIazZJSEpsYzNCdmJuTmxMbUp2Wkhrc0lITjBZWFIxY3pvZ2NtVnpjRzl1YzJVdWMzUmhkSFZ6TENCb1pXRmtaWEp6T2lCeVpYTndiMjV6WlM1b1pXRmtaWEp6SUgwZ1lYTWdZVzU1TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnYm1WM0lGSmxjM0J2Ym5ObEtISmxjM0J2Ym5ObExtSnZaSGtnWVhNZ1FtOWtlVWx1YVhRZ2ZDQnVkV3hzTENCeVpYTndiMjV6WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUhOMGNtVmhiVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR3hsZENCeWIzVjBaVk5qYUdWdFlTQTlJRzl3ZEdsdmJuTXVjbTkxZEdWVFkyaGxiV0U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tDRnliM1YwWlZOamFHVnRZU2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnliM1YwWlZOamFHVnRZU0E5SUhSeWFXVXVaMlYwS0doMGRIQXVjR0YwYUM1emRISnBibWNnWVhNZ2MzUnlhVzVuS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdhV1lnS0Nob2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1WnlrdWFXNWpiSFZrWlhNb1hDSWtYQ0lwSUh4OElDRW9hSFIwY0M1d1lYUm9Mbk4wY21sdVp5QmhjeUJ6ZEhKcGJtY3BMbVZ1WkhOWGFYUm9LRndpZmx3aUtTQjhmQ0J5YjNWMFpWTmphR1Z0WVNBOVBUMGdiblZzYkNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtOTFkR1ZUWTJobGJXRWdQU0JuWlc1bGNtRjBaV1F1Y205MWRHVlRZMmhsYldFL0xsdG9kSFJ3TG5CaGRHZ3VjM1J5YVc1blhUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5YjNWMFpWTmphR1Z0WVNBOVBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnY25WdWRHbHRaUzVsYldsMEtGd2liV2xzYTJsdk9taDBkSEJPYjNSR2IzVnVaRndpTENCN0lHVjRaV04xZEdWSlpDd2diRzluWjJWeUxDQndZWFJvT2lCb2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1Wnl3Z2FIUjBjQ3dnY21WcVpXTjBMQ0J5WVdselpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGFISnZkeUJ5WldwbFkzUW9YQ0pPVDFSZlJrOVZUa1JjSWl3Z2V5QndZWFJvT2lCb2RIUndMbkJoZEdndWMzUnlhVzVuSUdGeklITjBjbWx1WnlCOUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2gwZVhCbGIyWWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJQ0U5UFNCY0ltWjFibU4wYVc5dVhDSXBJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaU0E5SUdGM1lXbDBJSEp2ZFhSbFUyTm9aVzFoTG0xdlpIVnNaVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1ZzYzJVZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElEMGdZWGRoYVhRZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjBjbWxsTG1Ga1pDaG9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5d2djbTkxZEdWVFkyaGxiV0VwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaHliM1YwWlZOamFHVnRZUzUwZVhCbElDRTlQU0JjSW5OMGNtVmhiVndpS1NCMGFISnZkeUJ5WldwbFkzUW9YQ0pWVGtGRFEwVlFWRUZDVEVWY0lpd2dleUJsZUhCbFkzUmxaRG9nWENKemRISmxZVzFjSWl3Z2JXVnpjMkZuWlRvZ1lFNXZkQ0JoWTJObGNIUmhZbXhsTENCMGFHVWdRV05qWlhCMElHbHVJSFJvWlNCeVpYRjFaWE4wSUdobFlXUmxjaUJ6YUc5MWJHUWdZbVVnWENKaGNIQnNhV05oZEdsdmJpOXFjMjl1WENJdUlFbG1JSGx2ZFNCaGNtVWdkWE5wYm1jZ2RHaGxJRndpUUcxcGJHdHBieTl6ZEdGeVoyRjBaVndpSUhCaFkydGhaMlVzSUhCc1pXRnpaU0J5WlcxdmRtVWdYRnhnZEhsd1pUb2dYQ0p6ZEhKbFlXMWNJbHhjWUNCMGJ5QjBhR1VnWlhobFkzVjBaU0J2Y0hScGIyNXpMbUFnZlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdiR1YwSUhOMGNtVmhiVU5zYjNObFpDQTlJR1poYkhObE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdoaGJtUnNaVU5zYjNObElEMGdZWE41Ym1NZ0tDa2dQVDRnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYzNSeVpXRnRRMnh2YzJWa0tTQnlaWFIxY200N1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wY21WaGJVTnNiM05sWkNBOUlIUnlkV1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHWnZjaUFvWTI5dWMzUWdhR0Z1Wkd4bGNpQnZaaUJtYVc1aGJHVnpLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElHaGhibVJzWlhJb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdZMkYwWTJnZ0tHVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdiRzluWjJWeUxtVnljbTl5S0Z3aVFXNGdaWEp5YjNJZ2IyTmpkWEp5WldRZ2FXNXphV1JsSUc5dVJtbHVZV3hzZVM1Y0lpd2daWEp5YjNJcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hvWVhOUGJreHZaMmRsY2xOMVltMXBkSFJwYm1jcElHRjNZV2wwSUd4dloyZGxjaTVmTG5OMVltMXBkQ2hqYjI1MFpYaDBJR0Z6SUdGdWVTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdsbUlDaGhibmxGYldsMFNHRnVaR3hsY25NcElISjFiblJwYldVdWNuVnVkR2x0WlM1eVpYRjFaWE4wTG1SbGJHVjBaU2hsZUdWamRYUmxTV1FwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExtaDBkSEFnUFNCb2RIUndPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SbGVIUXVhR1ZoWkdWeWN5QTlJR2gwZEhBdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFF1Y205MWRHVlVlWEJsSUQwZ1hDSnpkSEpsWVcxY0lqdGNibHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHVjRaV04xZEdWa0lEMGdZWGRoYVhRZ1pYaGxZM1YwWlhJdVgxOWxlR1ZqZFhSbEtISnZkWFJsVTJOb1pXMWhMQ0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnlaV0YwWldSRmVHVmpkWFJsU1dRNklHVjRaV04xZEdWSlpDeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTNKbFlYUmxaRXh2WjJkbGNqb2diRzluWjJWeUxGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhSb09pQm9kSFJ3TG5CaGRHZ3VjM1J5YVc1bklHRnpJSE4wY21sdVp5eGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYUdWaFpHVnljem9nYjNCMGFXOXVjeTV5WlhGMVpYTjBMbWhsWVdSbGNuTWdZWE1nU0dWaFpHVnljeXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVkR1Y0ZEN4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxek9pQm9kSFJ3TG5CaGNtRnRjeTV6ZEhKcGJtY3NYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjMVI1Y0dVNklGd2ljM1J5YVc1blhDSXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWm1sdVlXeGxjeUE5SUdWNFpXTjFkR1ZrTG1acGJtRnNaWE03WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1UzUnlaV0Z0SUhCaGRHZzZJR055WldGMFpTQnVaWGNnYUdWaFpHVnljeUJ2WW1wbFkzUWdkRzhnWVhadmFXUWdjRzlzYkhWMGFXNW5JSE5vWVhKbFpDQmtaV1poZFd4MFRXVnlaMlZrU0dWaFpHVnljMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSEpsYzNCdmJuTmxMbWhsWVdSbGNuTWdQU0I3SUM0dUxuSmxjM0J2Ym5ObExtaGxZV1JsY25Nc0lDNHVMbUoxYVd4a1EyOXljMGhsWVdSbGNuTW9hSFIwY0M1amIzSnpMQ0J2Y21sbmFXNHBJSDA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1FIUnpMV2xuYm05eVpUb2dZblZ1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElITjBjbVZoYlRvZ1VtVmhaR0ZpYkdWVGRISmxZVzA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnTHk4Z1FIUnpMV2xuYm05eVpUb2dZblZ1WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWMElHTnZiblJ5YjJ3NklGSmxZV1JoWW14bFUzUnlaV0Z0UkdseVpXTjBRMjl1ZEhKdmJHeGxjaUI4SUZKbFlXUmhZbXhsVTNSeVpXRnRSR1ZtWVhWc2RFTnZiblJ5YjJ4c1pYSTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCQWRITXRhV2R1YjNKbE9pQmlkVzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RIbHdaVzltSUVKMWJpQWhQVDBnWENKMWJtUmxabWx1WldSY0lpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBdkx5QkFkSE10YVdkdWIzSmxPaUJpZFc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjM1J5WldGdElEMGdibVYzSUZKbFlXUmhZbXhsVTNSeVpXRnRLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSFI1Y0dVNklGd2laR2x5WldOMFhDSXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQXZMeUJBZEhNdGFXZHViM0psT2lCaWRXNWNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRnplVzVqSUhCMWJHd29ZMjl1ZEhKdmJHeGxjam9nVW1WaFpHRmliR1ZUZEhKbFlXMUVhWEpsWTNSRGIyNTBjbTlzYkdWeUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRISnZiQ0E5SUdOdmJuUnliMnhzWlhJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdkSEo1SUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRISnZiR3hsY2k1M2NtbDBaU2hnWkdGMFlUcEFKSHRLVTA5T0xuTjBjbWx1WjJsbWVTaDdJSE4xWTJObGMzTTZJSFJ5ZFdVc0lHUmhkR0U2SUhWdVpHVm1hVzVsWkN3Z1pYaGxZM1YwWlVsa0lIMGdjMkYwYVhObWFXVnpJRTFwYkd0cGIxSmxjM0J2Ym5ObFUzVmpZMlZ6Y3p4aGJuaytLWDFjWEc1Y1hHNWdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUdGM1lXbDBJQ2hqYjI1emRDQjJZV3gxWlNCdlppQmxlR1ZqZFhSbFpDNXlaWE4xYkhSekxuWmhiSFZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVc5d2RHbHZibk11Y21WeGRXVnpkQzV6YVdkdVlXd3VZV0p2Y25SbFpDa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhKbGMzVnNkRG9nYzNSeWFXNW5JRDBnU2xOUFRpNXpkSEpwYm1kcFpua29XMjUxYkd3c0lIWmhiSFZsWFNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnWTI5dWRISnZiR3hsY2k1M2NtbDBaU2hnWkdGMFlUb2tlM0psYzNWc2RIMWNYRzVjWEc1Z0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pYaGxZM1YwWldRdWNtVnpkV3gwY3k1MllXeDFaUzV5WlhSMWNtNG9kVzVrWldacGJtVmtLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCb1lXNWtiR1ZEYkc5elpTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ4c1pYSXVZMnh2YzJVb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dWeWNtOXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5OMElHVjRZMlZ3ZEdsdmJpQTlJR1Y0WTJWd2RHbHZia2hoYm1Sc1pYSW9aWGhsWTNWMFpVbGtMQ0JzYjJkblpYSXNJR1Z5Y205eUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY21WemRXeDBPaUJoYm5rZ1BTQjdmVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjbVZ6ZFd4MFcyVjRZMlZ3ZEdsdmJpNWpiMlJsWFNBOUlHVjRZMlZ3ZEdsdmJpNXlaV3BsWTNRN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMnhzWlhJdWQzSnBkR1VvWUdSaGRHRTZKSHRLVTA5T0xuTjBjbWx1WjJsbWVTaGJjbVZ6ZFd4MExDQnVkV3hzWFNsOVhGeHVYRnh1WUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJRzVsZHlCUWNtOXRhWE5sS0NoeVpYTnZiSFpsS1NBOVBpQnpaWFJVYVcxbGIzVjBLSEpsYzI5c2RtVXNJREFwS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmhkMkZwZENCb1lXNWtiR1ZEYkc5elpTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMnhzWlhJdVkyeHZjMlVvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGMzbHVZeUJqWVc1alpXd29LU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1lYZGhhWFFnYUdGdVpHeGxRMnh2YzJVb0tUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqYjI1MGNtOXNMbU5zYjNObEtDazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHRnpJR0Z1ZVNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdMeThnYm05a1pTNXFjeUJ2Y2lCdmRHaGxjbk5jYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0x5OGdRSFJ6TFdsbmJtOXlaVG9nWW5WdVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSE4wY21WaGJTQTlJRzVsZHlCU1pXRmtZV0pzWlZOMGNtVmhiU2g3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0F2THlCQWRITXRhV2R1YjNKbE9pQmlkVzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0Z6ZVc1aklIQjFiR3dvWTI5dWRISnZiR3hsY2lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyd2dQU0JqYjI1MGNtOXNiR1Z5TzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyeHNaWEl1Wlc1eGRXVjFaU2hnWkdGMFlUcEFKSHRLVTA5T0xuTjBjbWx1WjJsbWVTaDdJSE4xWTJObGMzTTZJSFJ5ZFdVc0lHUmhkR0U2SUhWdVpHVm1hVzVsWkN3Z1pYaGxZM1YwWlVsa0lIMGdjMkYwYVhObWFXVnpJRTFwYkd0cGIxSmxjM0J2Ym5ObFUzVmpZMlZ6Y3p4aGJuaytLWDFjWEc1Y1hHNWdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabTl5SUdGM1lXbDBJQ2hqYjI1emRDQjJZV3gxWlNCdlppQmxlR1ZqZFhSbFpDNXlaWE4xYkhSekxuWmhiSFZsS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnBaaUFvSVc5d2RHbHZibk11Y21WeGRXVnpkQzV6YVdkdVlXdy9MbUZpYjNKMFpXUXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpYTjFiSFE2SUhOMGNtbHVaeUE5SUVwVFQwNHVjM1J5YVc1bmFXWjVLRnR1ZFd4c0xDQjJZV3gxWlYwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUnliMnhzWlhJdVpXNXhkV1YxWlNoZ1pHRjBZVG9rZTNKbGMzVnNkSDFjWEc1Y1hHNWdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaWGhsWTNWMFpXUXVjbVZ6ZFd4MGN5NTJZV3gxWlM1eVpYUjFjbTRvZFc1a1pXWnBibVZrS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQm9ZVzVrYkdWRGJHOXpaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR052Ym5SeWIyeHNaWEl1WTJ4dmMyVW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIMGdZMkYwWTJnZ0tHVnljbTl5S1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuTjBJR1Y0WTJWd2RHbHZiaUE5SUdWNFkyVndkR2x2YmtoaGJtUnNaWElvWlhobFkzVjBaVWxrTENCc2IyZG5aWElzSUdWeWNtOXlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ2NtVnpkV3gwT2lCaGJua2dQU0I3ZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBXMlY0WTJWd2RHbHZiaTVqYjJSbFhTQTlJR1Y0WTJWd2RHbHZiaTV5WldwbFkzUTdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ4c1pYSXVaVzV4ZFdWMVpTaGdaR0YwWVRva2UwcFRUMDR1YzNSeWFXNW5hV1o1S0Z0eVpYTjFiSFFzSUc1MWJHeGRLWDFjWEc1Y1hHNWdLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2FHRnVaR3hsUTJ4dmMyVW9LVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0J1WlhjZ1VISnZiV2x6WlNnb2NtVnpiMngyWlNrZ1BUNGdjMlYwVkdsdFpXOTFkQ2h5WlhOdmJIWmxMQ0F3S1NrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1ZEhKdmJHeGxjaTVqYkc5elpTZ3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0Z6ZVc1aklHTmhibU5sYkNncElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQm9ZVzVrYkdWRGJHOXpaU2dwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZiblJ5YjJ3dVkyeHZjMlVvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSDBnWVhNZ1lXNTVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYTndiMjV6WlM1aWIyUjVJRDBnYzNSeVpXRnRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQzh2SUZOMGNtVmhiU0J3WVhSb09pQmpjbVZoZEdVZ2JtVjNJR2hsWVdSbGNuTWdkRzhnWVhadmFXUWdjRzlzYkhWMGFXNW5JSE5vWVhKbFpDQnZZbXBsWTNSY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYTndiMjV6WlM1b1pXRmtaWEp6SUQwZ2V5QXVMaTV5WlhOd2IyNXpaUzVvWldGa1pYSnpMQ0JjSWtOdmJuUmxiblF0Vkhsd1pWd2lPaUJjSW5SbGVIUXZaWFpsYm5RdGMzUnlaV0Z0WENJc0lGd2lRMkZqYUdVdFEyOXVkSEp2YkZ3aU9pQmNJbTV2TFdOaFkyaGxYQ0lnZlR0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRjNZV2wwSUhKMWJuUnBiV1V1WlcxcGRDaGNJbTFwYkd0cGJ6cG9kSFJ3VW1WemNHOXVjMlZjSWl3Z2V5QmxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2djR0YwYURvZ2FIUjBjQzV3WVhSb0xuTjBjbWx1WnlCaGN5QnpkSEpwYm1jc0lHaDBkSEFzSUdobFlXUmxjbk02SUdoMGRIQXVjbVZ4ZFdWemRDNW9aV0ZrWlhKekxDQmpiMjUwWlhoME9pQmxlR1ZqZFhSbFpDNWpiMjUwWlhoMExDQnpkV05qWlhOek9pQjBjblZsTENCeVpXcGxZM1FzSUhKaGFYTmxJSDBwTzF4dVhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NtVjBkWEp1SUc1bGR5QlNaWE53YjI1elpTaHlaWE53YjI1elpTNWliMlI1TENCeVpYTndiMjV6WlNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUgwZ1kyRjBZMmdnS0dWeWNtOXlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmpiMjV6ZENCeVpYTjFiSFJ6T2lCU1pYTjFiSFJ6UEUxcGJHdHBiMUpsYzNCdmJuTmxVbVZxWldOMFBpQTlJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0IyWVd4MVpUb2daWGhqWlhCMGFXOXVTR0Z1Wkd4bGNpaGxlR1ZqZFhSbFNXUXNJR3h2WjJkbGNpd2daWEp5YjNJcExGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoeVpYTjFiSFJ6TG5aaGJIVmxJQ0U5UFNCMWJtUmxabWx1WldRcElISmxjM0J2Ym5ObExtSnZaSGtnUFNCS1UwOU9Mbk4wY21sdVoybG1lU2h5WlhOMWJIUnpMblpoYkhWbEtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUM4dklFVnljbTl5SUhCaGRHZzZJR055WldGMFpTQnVaWGNnYUdWaFpHVnljeUIwYnlCaGRtOXBaQ0J3YjJ4c2RYUnBibWNnYzJoaGNtVmtJRzlpYW1WamRGeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemNHOXVjMlV1YUdWaFpHVnljeUE5SUhzZ0xpNHVjbVZ6Y0c5dWMyVXVhR1ZoWkdWeWN5d2dMaTR1WTI5eWMwaGxZV1JsY25NZ2ZUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdGM1lXbDBJSEoxYm5ScGJXVXVaVzFwZENoY0ltMXBiR3RwYnpwb2RIUndVbVZ6Y0c5dWMyVmNJaXdnZXlCbGVHVmpkWFJsU1dRc0lHeHZaMmRsY2l3Z2NHRjBhRG9nYUhSMGNDNXdZWFJvTG5OMGNtbHVaeUJoY3lCemRISnBibWNzSUdoMGRIQXNJR2hsWVdSbGNuTTZJR2gwZEhBdWNtVnhkV1Z6ZEM1b1pXRmtaWEp6TENCamIyNTBaWGgwTENCemRXTmpaWE56T2lCbVlXeHpaU3dnY21WcVpXTjBMQ0J5WVdselpTQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDOHZJRkoxYmlCdmJrWnBibUZzYkhrZ2FHRnVaR3hsY25NZ1pYWmxiaUJ2YmlCbGNuSnZjaUFvYVcxd2IzSjBZVzUwSUdadmNpQnlZWGNnY205MWRHVnpJSGRvWlhKbFhHNGdJQ0FnSUNBZ0lDQWdJQ0F2THlCMGFHVWdhR0Z1Wkd4bGNpQnRZWGtnYUdGMlpTQnlaV2RwYzNSbGNtVmtJR05zWldGdWRYQWdkbWxoSUdOdmJuUmxlSFF1YjI1R2FXNWhiR3g1SUdKbFptOXlaU0IwYUhKdmQybHVaeWxjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2htYVc1aGJHVnpMbXhsYm1kMGFDQStJREFwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbWIzSWdLR052Ym5OMElHaGhibVJzWlhJZ2IyWWdabWx1WVd4bGN5a2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCMGNua2dleUJoZDJGcGRDQm9ZVzVrYkdWeUtDazdJSDBnWTJGMFkyZ2dLR1VwSUhzZ2JHOW5aMlZ5TG1WeWNtOXlLRndpUVc0Z1pYSnliM0lnYjJOamRYSnlaV1FnYVc1emFXUmxJRzl1Um1sdVlXeHNlUzVjSWl3Z1pTazdJSDFjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCcFppQW9hR0Z6VDI1TWIyZG5aWEpUZFdKdGFYUjBhVzVuS1NCaGQyRnBkQ0JzYjJkblpYSXVYeTV6ZFdKdGFYUW9ZMjl1ZEdWNGRDQmhjeUJoYm5rcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tHRnVlVVZ0YVhSSVlXNWtiR1Z5Y3lrZ2NuVnVkR2x0WlM1eWRXNTBhVzFsTG5KbGNYVmxjM1F1WkdWc1pYUmxLR1Y0WldOMWRHVkpaQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYjNCMGFXOXVjeTV5WVhkU1pYTndiMjV6WlNrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxkSFZ5YmlCN0lGOWZjbUYzVW1WemNHOXVjMlU2SUhSeWRXVXNJR0p2WkhrNklISmxjM0J2Ym5ObExtSnZaSGtzSUhOMFlYUjFjem9nY21WemNHOXVjMlV1YzNSaGRIVnpMQ0JvWldGa1pYSnpPaUJ5WlhOd2IyNXpaUzVvWldGa1pYSnpJSDBnWVhNZ1lXNTVPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WMGRYSnVJRzVsZHlCU1pYTndiMjV6WlNoeVpYTndiMjV6WlM1aWIyUjVJR0Z6SUVKdlpIbEpibWwwSUh3Z2JuVnNiQ3dnY21WemNHOXVjMlVwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlR0Y2JseHVJQ0FnSUdOdmJuTjBJSE4wY21WaGJVTnNiM05sY25NNklFMWhjRHh6ZEhKcGJtY3NJSHNnWjJWdVpYSmhkRzl5T2lCQmMzbHVZMGRsYm1WeVlYUnZjanNnYUdGdVpHeGxRMnh2YzJVNklHRnVlU0I5UGlBOUlHNWxkeUJOWVhBb0tUdGNiaUFnSUNCamIyNXpkQ0JvWVc1a2JHVk5aWE56WVdkbElEMGdZWE41Ym1NZ0tGeHVJQ0FnSUNBZ0lDQndiM0owT2lCN0lIQnZjM1JOWlhOellXZGxLRzFsYzNOaFoyVTZJR0Z1ZVNrNklIWnZhV1FnZlN4Y2JpQWdJQ0FnSUNBZ2IzQjBhVzl1Y3pwY2JpQWdJQ0FnSUNBZ0lDQWdJSHdnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWNFpXTjFkR1ZKWkRvZ2MzUnlhVzVuTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGRHZzZJSE4wY21sdVp6dGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndZWEpoYlhNL09pQlNaV052Y21ROFlXNTVMQ0JoYm5rK08xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHaGxZV1JsY25NL09pQlNaV052Y21ROGMzUnlhVzVuTENCemRISnBibWMrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZDQnpkSEpwYm1jc1hHNGdJQ0FnS1NBOVBpQjdYRzRnSUNBZ0lDQWdJR2xtSUNoMGVYQmxiMllnYjNCMGFXOXVjeUE5UFQwZ1hDSnpkSEpwYm1kY0lpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2FXWWdLRzl3ZEdsdmJuTWdQVDA5SUZ3aVVFbE9SMXdpS1NCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2NHOXlkQzV3YjNOMFRXVnpjMkZuWlNoY0lsQlBUa2RjSWlrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvYjNCMGFXOXVjeTV6ZEdGeWRITlhhWFJvS0Z3aVEweFBVMFZmVTFSU1JVRk5PbHdpS1NrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdWNFpXTjFkR1ZKWkNBOUlHOXdkR2x2Ym5NdWMzVmljM1J5YVc1bktGd2lRMHhQVTBWZlUxUlNSVUZOT2x3aUxteGxibWQwYUNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnYzNSeVpXRnRRMnh2YzJWeUlEMGdjM1J5WldGdFEyeHZjMlZ5Y3k1blpYUW9aWGhsWTNWMFpVbGtLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2MzUnlaV0Z0UTJ4dmMyVnlLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBjbVZoYlVOc2IzTmxjaTVuWlc1bGNtRjBiM0l1Y21WMGRYSnVLSFZ1WkdWbWFXNWxaQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lITjBjbVZoYlVOc2IzTmxjaTVvWVc1a2JHVkRiRzl6WlNoY0luTjBjbVZoYlZ3aUtUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0J5WlhSMWNtNDdYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnYkdWMElISnZkWFJsVTJOb1pXMWhJRDBnZEhKcFpTNW5aWFFvYjNCMGFXOXVjeTV3WVhSb0tUdGNiaUFnSUNBZ0lDQWdhV1lnS0hKdmRYUmxVMk5vWlcxaElEMDlQU0J1ZFd4c0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCeWIzVjBaVk5qYUdWdFlTQTlJR2RsYm1WeVlYUmxaQzV5YjNWMFpWTmphR1Z0WVQ4dVcyOXdkR2x2Ym5NdWNHRjBhRjA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvY205MWRHVlRZMmhsYldFZ1BUMDlJSFZ1WkdWbWFXNWxaQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJSEpsYW1WamRDaGNJazVQVkY5R1QxVk9SRndpTENCN0lIQmhkR2c2SUc5d2RHbHZibk11Y0dGMGFDQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsYjJZZ2NtOTFkR1ZUWTJobGJXRXViVzlrZFd4bElDRTlQU0JjSW1aMWJtTjBhVzl1WENJcElISnZkWFJsVTJOb1pXMWhMbTF2WkhWc1pTQTlJR0YzWVdsMElISnZkWFJsVTJOb1pXMWhMbTF2WkhWc1pUdGNiaUFnSUNBZ0lDQWdJQ0FnSUdWc2MyVWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxJRDBnWVhkaGFYUWdjbTkxZEdWVFkyaGxiV0V1Ylc5a2RXeGxLQ2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBjbWxsTG1Ga1pDaHZjSFJwYjI1ekxuQmhkR2dzSUhKdmRYUmxVMk5vWlcxaEtUdGNiaUFnSUNBZ0lDQWdmVnh1WEc0Z0lDQWdJQ0FnSUdOdmJuTjBJR2hsWVdSbGNuTWdQU0J1WlhjZ1NHVmhaR1Z5Y3lodmNIUnBiMjV6TG1obFlXUmxjbk1wTzF4dUlDQWdJQ0FnSUNCamIyNXpkQ0J3WVhKaGJYTWdQU0J2Y0hScGIyNXpMbkJoY21GdGN5QS9QeUI3ZlR0Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYkc5bloyVnlJRDBnWTNKbFlYUmxURzluWjJWeUtISjFiblJwYldVc0lHOXdkR2x2Ym5NdWNHRjBhQ3dnYjNCMGFXOXVjeTVsZUdWamRYUmxTV1FwTzF4dUlDQWdJQ0FnSUNCc1pYUWdabWx1WVd4bGN6b2dRWEp5WVhrOEtDa2dQVDRnZG05cFpDQjhJRkJ5YjIxcGMyVThkbTlwWkQ0K0lEMGdXMTA3WEc1Y2JpQWdJQ0FnSUNBZ1kyOXVjM1FnYUhSMGNDQTlJRzVsZHlCUWNtOTRlU2hjYmlBZ0lDQWdJQ0FnSUNBZ0lIdDlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHZGxkRG9nS0hSaGNtZGxkQ3dnY0hKdmNHVnlkSGtwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tIQnliM0JsY25SNUlEMDlQU0JjSW01dmRFWnZkVzVrWENJcElISmxkSFZ5YmlCMGNuVmxPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCeVpYUjFjbTRnZFc1a1pXWnBibVZrTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUgwc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2MyVjBPaUFvS1NBOVBpQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhSb2NtOTNJSEpsYW1WamRDaGNJbFZPUVVORFJWQlVRVUpNUlZ3aUxDQjdJR1Y0Y0dWamRHVmtPaUJjSW1OdmJuUmxlSFF1YUhSMGNGd2lMQ0J0WlhOellXZGxPaUJjSWxSb2FYTWdjbVZ4ZFdWemRDQjNZWE1nYVc1MmIydGxaQ0IwYUhKdmRXZG9JSFJvWlNCbGVHVmpkWFJsSUcxbGRHaHZaQzRnVTJsdVkyVWdibThnWVdOMGRXRnNJSEpsY1hWbGMzUWdkMkZ6SUdkbGJtVnlZWFJsWkN3Z2RHaGxJRWhVVkZBZ2JXVjBhRzlrY3lCMWJtUmxjaUIwYUdVZ1kyOXVkR1Y0ZENCallXNXViM1FnWW1VZ1lXTmpaWE56WldRdVhDSWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlN4Y2JpQWdJQ0FnSUNBZ0lDQWdJSDBzWEc0Z0lDQWdJQ0FnSUNrN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ2FHRnVaR3hsUTJ4dmMyVWdQU0JoYzNsdVl5QW9kSGx3WlRvZ1hDSmhZM1JwYjI1Y0lpQjhJRndpYzNSeVpXRnRYQ0lwSUQwK0lIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdsbUlDaDBlWEJsSUQwOVBTQmNJbk4wY21WaGJWd2lLU0J6ZEhKbFlXMURiRzl6WlhKekxtUmxiR1YwWlNodmNIUnBiMjV6TG1WNFpXTjFkR1ZKWkNrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ0tHTnZibk4wSUdoaGJtUnNaWElnYjJZZ1ptbHVZV3hsY3lrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHRjNZV2wwSUdoaGJtUnNaWElvS1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCOUlHTmhkR05vSUNobGNuSnZjaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnNiMmRuWlhJdVpYSnliM0lvWENKQmJpQmxjbkp2Y2lCdlkyTjFjbkpsWkNCcGJuTnBaR1VnYjI1R2FXNWhiR3g1TGx3aUxDQmxjbkp2Y2lrN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lDQWdZWGRoYVhRZ2JHOW5aMlZ5TGw4dWMzVmliV2wwS0dOdmJuUmxlSFFnWVhNZ1lXNTVLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lISjFiblJwYldVdWNuVnVkR2x0WlM1eVpYRjFaWE4wTG1SbGJHVjBaU2h2Y0hScGIyNXpMbVY0WldOMWRHVkpaQ2s3WEc0Z0lDQWdJQ0FnSUgwN1hHNWNiaUFnSUNBZ0lDQWdZMjl1YzNRZ1kyOXVkR1Y0ZENBOUlIc2dhSFIwY0RvZ2FIUjBjQ3dnYUdWaFpHVnljeXdnY205MWRHVlVlWEJsT2lCeWIzVjBaVk5qYUdWdFlTNTBlWEJsTENCeVpXcGxZM1FzSUhKaGFYTmxJSDA3WEc1Y2JpQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2h5YjNWMFpWTmphR1Z0WVM1MGVYQmxJRDA5UFNCY0ltRmpkR2x2Ymx3aUtTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjl1YzNRZ1pYaGxZM1YwWldRZ1BTQmhkMkZwZENCbGVHVmpkWFJsY2k1ZlgyVjRaV04xZEdVb2NtOTFkR1ZUWTJobGJXRXNJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kzSmxZWFJsWkVWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR055WldGMFpXUk1iMmRuWlhJNklHeHZaMmRsY2l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0YwYURvZ2IzQjBhVzl1Y3k1d1lYUm9MRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCb1pXRmtaWEp6TEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmpiMjUwWlhoMExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3WVhKaGJYTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUhCaGNtRnRjMVI1Y0dVNklGd2ljbUYzWENJc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdabWx1WVd4bGN5QTlJR1Y0WldOMWRHVmtMbVpwYm1Gc1pYTTdYRzVjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JoZDJGcGRDQm9ZVzVrYkdWRGJHOXpaU2hjSW1GamRHbHZibHdpS1R0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHbG1JQ2hsZUdWamRYUmxaQzVsYlhCMGVWSmxjM1ZzZENrZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3YjNKMExuQnZjM1JOWlhOellXZGxLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR1Y0WldOMWRHVkpaRG9nYjNCMGFXOXVjeTVsZUdWamRYUmxTV1FzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J6ZFdOalpYTnpPaUIwY25WbExGeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1pHRjBZVG9nZFc1a1pXWnBibVZrTEZ4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQjlLVHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd2IzSjBMbkJ2YzNSTlpYTnpZV2RsS0h0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCemRXTmpaWE56T2lCMGNuVmxMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdaR0YwWVRvZ1pYaGxZM1YwWldRdWNtVnpkV3gwY3k1MllXeDFaU3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVJQ0FnSUNBZ0lDQWdJQ0FnYVdZZ0tISnZkWFJsVTJOb1pXMWhMblI1Y0dVZ1BUMDlJRndpYzNSeVpXRnRYQ0lwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCamIyNXpkQ0JsZUdWamRYUmxaQ0E5SUdGM1lXbDBJR1Y0WldOMWRHVnlMbDlmWlhobFkzVjBaU2h5YjNWMFpWTmphR1Z0WVN3Z2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JqY21WaGRHVmtSWGhsWTNWMFpVbGtPaUJ2Y0hScGIyNXpMbVY0WldOMWRHVkpaQ3hjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kzSmxZWFJsWkV4dloyZGxjam9nYkc5bloyVnlMRnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCd1lYUm9PaUJ2Y0hScGIyNXpMbkJoZEdnc1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR2hsWVdSbGNuTXNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxlSFFzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQmhjbUZ0Y3l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdjR0Z5WVcxelZIbHdaVG9nWENKeVlYZGNJaXhjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5S1R0Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNCbWFXNWhiR1Z6SUQwZ1pYaGxZM1YwWldRdVptbHVZV3hsY3p0Y2JseHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIUnllU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnZjblF1Y0c5emRFMWxjM05oWjJVb2V5QnpkV05qWlhOek9pQjBjblZsTENCa1lYUmhPaUIxYm1SbFptbHVaV1FzSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc0lHUnZibVU2SUdaaGJITmxJSDBwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQnpkSEpsWVcxRGJHOXpaWEp6TG5ObGRDaHZjSFJwYjI1ekxtVjRaV04xZEdWSlpDd2dleUJuWlc1bGNtRjBiM0k2SUdWNFpXTjFkR1ZrTG5KbGMzVnNkSE11ZG1Gc2RXVXNJR2hoYm1Sc1pVTnNiM05sSUgwcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JtYjNJZ1lYZGhhWFFnS0dOdmJuTjBJSFpoYkhWbElHOW1JR1Y0WldOMWRHVmtMbkpsYzNWc2RITXVkbUZzZFdVcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUdSaGRHRWdQU0I3SUhOMVkyTmxjM002SUhSeWRXVXNJR1JoZEdFNklGdHVkV3hzTENCMllXeDFaVjBzSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc0lHUnZibVU2SUdaaGJITmxJSDA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0J3YjNKMExuQnZjM1JOWlhOellXZGxLR1JoZEdFcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnZjblF1Y0c5emRFMWxjM05oWjJVb2V5QnpkV05qWlhOek9pQjBjblZsTENCa1lYUmhPaUIxYm1SbFptbHVaV1FzSUdWNFpXTjFkR1ZKWkRvZ2IzQjBhVzl1Y3k1bGVHVmpkWFJsU1dRc0lHUnZibVU2SUhSeWRXVWdmU2s3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZlNCallYUmphQ0FvWlhKeWIzSXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnWlhoalpYQjBhVzl1SUQwZ1pYaGpaWEIwYVc5dVNHRnVaR3hsY2lodmNIUnBiMjV6TG1WNFpXTjFkR1ZKWkN3Z2JHOW5aMlZ5TENCbGNuSnZjaWs3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhKbGMzVnNkRG9nWVc1NUlEMGdlMzA3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lISmxjM1ZzZEZ0bGVHTmxjSFJwYjI0dVkyOWtaVjBnUFNCbGVHTmxjSFJwYjI0dWNtVnFaV04wTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQndiM0owTG5CdmMzUk5aWE56WVdkbEtIc2djM1ZqWTJWemN6b2dkSEoxWlN3Z1pHRjBZVG9nVzNKbGMzVnNkQ3dnYm5Wc2JGMHNJR1Y0WldOMWRHVkpaRG9nYjNCMGFXOXVjeTVsZUdWamRYUmxTV1FzSUdSdmJtVTZJSFJ5ZFdVZ2ZTazdYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJR0YzWVdsMElHaGhibVJzWlVOc2IzTmxLRndpYzNSeVpXRnRYQ0lwTzF4dUlDQWdJQ0FnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0I5SUdOaGRHTm9JQ2hsY25KdmNpa2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ1kyOXVjM1FnY21WemRXeDBJRDBnWlhoalpYQjBhVzl1U0dGdVpHeGxjaWh2Y0hScGIyNXpMbVY0WldOMWRHVkpaQ3dnYkc5bloyVnlMQ0JsY25KdmNpazdYRzRnSUNBZ0lDQWdJQ0FnSUNCaGQyRnBkQ0JzYjJkblpYSXVYeTV6ZFdKdGFYUW9ZMjl1ZEdWNGRDQmhjeUJoYm5rcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnY0c5eWRDNXdiM04wVFdWemMyRm5aU2g3SUhOMVkyTmxjM002SUdaaGJITmxMQ0JrWVhSaE9pQjFibVJsWm1sdVpXUXNJR1Z5Y205eU9pQnlaWE4xYkhRc0lHVjRaV04xZEdWSlpEb2diM0IwYVc5dWN5NWxlR1ZqZFhSbFNXUXNJR1J2Ym1VNklIUnlkV1VnZlNrN1hHNGdJQ0FnSUNBZ0lIMWNiaUFnSUNCOU8xeHVYRzRnSUNBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0FnSUNBZ2NHOXlkQ3hjYmlBZ0lDQWdJQ0FnWm1WMFkyZ3NYRzRnSUNBZ0lDQWdJR2hoYm1Sc1pVMWxjM05oWjJVc1hHNGdJQ0FnZlR0Y2JuMWNiaUlzQ2lBZ0lDQWlhVzF3YjNKMElIUjVjR1VnZXlCTmFXeHJhVzlTWlhOd2IyNXpaVkpsYW1WamRDd2dURzluWjJWeUlIMGdabkp2YlNCY0lpNHVMMmx1WkdWNExuUnpYQ0k3WEc1Y2JtVjRjRzl5ZENCcGJuUmxjbVpoWTJVZ0pISmxhbVZqZEVOdlpHVWdlMXh1SUNBZ0lGSkZVVlZGVTFSZlJrRkpURG9nWVc1NU8xeHVJQ0FnSUU1UFZGOUVSVlpGVEU5UVgwMVBSRVU2SUhOMGNtbHVaenRjYmlBZ0lDQlNSVkZWUlZOVVgxUkpUVVZQVlZRNklIc2dkR2x0Wlc5MWREb2diblZ0WW1WeU95QnRaWE56WVdkbE9pQnpkSEpwYm1jZ2ZUdGNiaUFnSUNCT1QxUmZSazlWVGtRNklIc2djR0YwYURvZ2MzUnlhVzVuSUgwN1hHNGdJQ0FnVUVGU1FVMVRYMVJaVUVWZlNVNURUMUpTUlVOVU9pQjdJSEJoZEdnNklITjBjbWx1WnpzZ1pYaHdaV04wWldRNklITjBjbWx1WnpzZ2RtRnNkV1U2SUdGdWVUc2diV1Z6YzJGblpUb2djM1J5YVc1bklIMGdmQ0J1ZFd4c08xeHVJQ0FnSUZKRlUxVk1WRk5mVkZsUVJWOUpUa05QVWxKRlExUTZJSHNnY0dGMGFEb2djM1J5YVc1bk95QmxlSEJsWTNSbFpEb2djM1J5YVc1bk95QjJZV3gxWlRvZ1lXNTVPeUJ0WlhOellXZGxPaUJ6ZEhKcGJtY2dmU0I4SUc1MWJHdzdYRzRnSUNBZ1ZVNUJRME5GVUZSQlFreEZPaUI3SUdWNGNHVmpkR1ZrT2lCemRISnBibWM3SUcxbGMzTmhaMlU2SUhOMGNtbHVaeUI5TzF4dUlDQWdJRkJCVWtGTlUxOVVXVkJGWDA1UFZGOVRWVkJRVDFKVVJVUTZJSHNnWlhod1pXTjBaV1E2SUhOMGNtbHVaenNnWTI5dWRHVnVkRlI1Y0dVNklITjBjbWx1WnlCOElHNTFiR3c3SUhCaGNtRnRjem9nYzNSeWFXNW5JSDA3WEc0Z0lDQWdVa1ZUVlV4VVUxOVVXVkJGWDA1UFZGOVRWVkJRVDFKVVJVUTZJSHNnWlhod1pXTjBaV1E2SUhOMGNtbHVaeUI5TzF4dUlDQWdJRWxPVkVWU1RrRk1YMU5GVWxaRlVsOUZVbEpQVWpvZ2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUUxRlZFaFBSRjlPVDFSZlFVeE1UMWRGUkRvZ2RXNWtaV1pwYm1Wa08xeHVJQ0FnSUU1RlZGZFBVa3RmUlZKU1QxSTZJSFZ1WkdWbWFXNWxaRHRjYm4xY2JseHVMeThnY21WcVpXTjBPaURtaTVMbnU1M25vSUhsdmFMbHZJL3Z2SXpuckt6a3VJRGt1S3JsajRMbWxiRGx2NFhwb2J2bW1LL2xyWmZucktia3VMTHZ2SWptaTVMbnU1M25vSUh2dkludnZJem5yS3prdW96a3VLcmxqNExtbGJEbW1LL2xoYmZrdlpQbm1vVHBsSm5vcjYvbWxiRG1qYTVjYmk4dklPYXpxT2FFaisrOG11YWhodWFldHVXR2hlbURxT2VhaENCeVpXcGxZM1FnNUwyLzU1U281YTY5NXAyKzU3Rzc1WjZMNzd5TTU1U281b2kzNUw2bklHTnZiblJsZUhRdWNtVnFaV04wSU9lYWhPUzRwZWFndk9leHUrV2VpK2VVc1NCa1pXTnNZWEpsY3k1MGN5RGt1SzNubW9RZ1RXbHNhMmx2VW1WcVpXTjBSblZ1WTNScGIyNGc1bytRNUw2YlhHNWxlSEJ2Y25RZ1puVnVZM1JwYjI0Z2NtVnFaV04wS0dOdlpHVTZJSE4wY21sdVp5d2daR0YwWVQ4NklHRnVlU2s2SUUxcGJHdHBiMUpsYW1WamRFVnljbTl5UEdGdWVTd2dZVzU1UGlCN1hHNGdJQ0FnWTI5dWMzUWdaWEp5YjNJZ1BTQjdJQ1J0YVd4cmFXOVNaV3BsWTNRNklIUnlkV1VzSUdOdlpHVXNJR1JoZEdFZ2ZTQmhjeUJOYVd4cmFXOVNaV3BsWTNSRmNuSnZjanhoYm5rc0lHRnVlVDQ3WEc0Z0lDQWdhV1lnS0hSNWNHVnZaaUJGY25KdmNpNWpZWEIwZFhKbFUzUmhZMnRVY21GalpTQTlQVDBnWENKbWRXNWpkR2x2Ymx3aUtTQkZjbkp2Y2k1allYQjBkWEpsVTNSaFkydFVjbUZqWlNobGNuSnZjaWs3WEc0Z0lDQWdjbVYwZFhKdUlHVnljbTl5TzF4dWZWeHVYRzR2THlCeVlXbHpaVG9nNWErNTZMR2g1YjJpNWJ5UDc3eU01THlnNVlXbDVMaUE1TGlxSUhzZzVvdVM1N3VkNTZDQk9pRHBsSm5vcjYvbWxiRG1qYTRnZlNEbHI3bm9zYUh2dkl6bHNJYnBsSm5vcjYvbGtKSGt1SXJtaXB2bGg3cnZ2SWpuc2J2a3ZMd2daMjlzWVc1bklPZWFoT2FZdnVXOGorbVVtZWl2citXa2hPZVFodSs4aVZ4dUx5OGc1ck9vNW9TUDc3eWE1cUdHNXA2MjVZYUY2WU9vNTVxRUlISmhhWE5sSU9TOXYrZVVxT1d1dmVhZHZ1ZXh1K1dlaSsrOGpPZVVxT2FJdCtTK3B5QmpiMjUwWlhoMExuSmhhWE5sSU9lYWhPUzRwZWFndk9leHUrV2VpK2VVc1NCa1pXTnNZWEpsY3k1MGN5RGt1SzNubW9RZ1RXbHNhMmx2VW1GcGMyVkdkVzVqZEdsdmJpRG1qNURrdnB0Y2JtVjRjRzl5ZENCbWRXNWpkR2x2YmlCeVlXbHpaU2h2WW1vNklGSmxZMjl5WkR4emRISnBibWNzSUdGdWVUNHBPaUJOYVd4cmFXOVNaV3BsWTNSRmNuSnZjanhoYm5rc0lHRnVlVDRnZTF4dUlDQWdJR052Ym5OMElHdGxlWE1nUFNCUFltcGxZM1F1YTJWNWN5aHZZbW9wTzF4dUlDQWdJR052Ym5OMElHTnZaR1VnUFNCclpYbHpXekJkTzF4dUlDQWdJR2xtSUNoamIyUmxJRDA5UFNCMWJtUmxabWx1WldRcElIUm9jbTkzSUc1bGR5QkZjbkp2Y2loY0luSmhhWE5sS0NrZ2NtVnhkV2x5WlhNZ1lXNGdiMkpxWldOMElIZHBkR2dnWVhRZ2JHVmhjM1FnYjI1bElHdGxlU0JoY3lCMGFHVWdjbVZxWldOMGFXOXVJR052WkdWY0lpazdYRzRnSUNBZ1kyOXVjM1FnY21WcVpXTjBSR0YwWVNBOUlHOWlhbHRqYjJSbFhUdGNiaUFnSUNCamIyNXpkQ0JsY25KdmNpQTlJSHNnSkcxcGJHdHBiMUpsYW1WamREb2dkSEoxWlN3Z1kyOWtaU3dnWkdGMFlUb2djbVZxWldOMFJHRjBZU0I5SUdGeklFMXBiR3RwYjFKbGFtVmpkRVZ5Y205eVBHRnVlU3dnWVc1NVBqdGNiaUFnSUNCcFppQW9kSGx3Wlc5bUlFVnljbTl5TG1OaGNIUjFjbVZUZEdGamExUnlZV05sSUQwOVBTQmNJbVoxYm1OMGFXOXVYQ0lwSUVWeWNtOXlMbU5oY0hSMWNtVlRkR0ZqYTFSeVlXTmxLR1Z5Y205eUtUdGNiaUFnSUNCeVpYUjFjbTRnWlhKeWIzSTdYRzU5WEc1Y2JtVjRjRzl5ZENCMGVYQmxJRTFwYkd0cGIxSmxhbVZqZEVWeWNtOXlQRU52WkdVZ1pYaDBaVzVrY3lCclpYbHZaaUFrY21WcVpXTjBRMjlrWlNBOUlHdGxlVzltSUNSeVpXcGxZM1JEYjJSbExDQlNaV3BsWTNSRVlYUmhJR1Y0ZEdWdVpITWdKSEpsYW1WamRFTnZaR1ZiUTI5a1pWMGdQU0FrY21WcVpXTjBRMjlrWlZ0RGIyUmxYVDRnUFNCN0lHTnZaR1U2SUVOdlpHVTdJR1JoZEdFNklGSmxhbVZqZEVSaGRHRTdJSE4wWVdOck9pQnpkSEpwYm1jN0lDUnRhV3hyYVc5U1pXcGxZM1E2SUhSeWRXVWdmVHRjYmx4dVpYaHdiM0owSUdaMWJtTjBhVzl1SUdWNFkyVndkR2x2YmtoaGJtUnNaWElvWlhobFkzVjBaVWxrT2lCemRISnBibWNzSUd4dloyZGxjam9nVEc5bloyVnlMQ0JsY25KdmNqb2dUV2xzYTJsdlVtVnFaV04wUlhKeWIzSThZVzU1TENCaGJuaytJSHdnWVc1NUtUb2dUV2xzYTJsdlVtVnpjRzl1YzJWU1pXcGxZM1FnZTF4dUlDQWdJR2xtSUNobGNuSnZjaUJwYm5OMFlXNWpaVzltSUVWeWNtOXlJQ1ltSUZ3aWRtbDBaVk5sY25abGNsd2lJR2x1SUdkc2IySmhiRlJvYVhNcElIdGNiaUFnSUNBZ0lDQWdkSEo1SUhzZ0tHZHNiMkpoYkZSb2FYTWdZWE1nWVc1NUtTNTJhWFJsVTJWeWRtVnlMbk56Y2tacGVGTjBZV05yZEhKaFkyVW9aWEp5YjNJcE95QjlJR05oZEdOb0lIdDlYRzRnSUNBZ2ZWeHVJQ0FnSUdOdmJuTjBJRzVoYldVZ1BTQmxjbkp2Y2o4dVkyOWtaU0EvUHlCbGNuSnZjajh1Ym1GdFpTQS9QeUJsY25KdmNqOHVZMjl1YzNSeWRXTjBiM0kvTG01aGJXVWdQejhnWENKVmJtNWhiV1ZrSUVWNFkyVndkR2x2Ymx3aU8xeHVYRzRnSUNBZ2FXWWdLR1Z5Y205eVB5NGtiV2xzYTJsdlVtVnFaV04wSUQwOVBTQjBjblZsS1NCN1hHNGdJQ0FnSUNBZ0lDOHZJT21paE9hY24rV0doZWVhaE9TNG11V0tvZWFMa3VlN25lKzhpT2V0dnVXUWplYVhvT2FWaU9PQWdlV1BndWFWc09tVW1laXZyK09BZ1U1UFZGOUdUMVZPUkNEbnJZbnZ2SW5ubEtnZ2QyRnliaTlwYm1adklPaXVzT1c5bGUrOGpGeHVJQ0FnSUNBZ0lDQXZMeURrdUkza3VxZm5sSjhnWlhKeWIzSWc1cGVsNWIrWDc3eU02WUcvNVlXTjVhU1c2WU9vNXBlZzVwV0k2SyszNXJHQzc3eUk1NGlzNkptcjVvbXI1bytQNTYySjc3eUo1ckdoNXArVDZaU1o2Syt2NVpHSzZLMm00NENDWEc0Z0lDQWdJQ0FnSUdsbUlDaGxjbkp2Y2k1amIyUmxJRDA5UFNCY0lrNVBWRjlHVDFWT1JGd2lLU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnNiMmRuWlhJdWFXNW1ieWh1WVcxbExDQmxjbkp2Y2o4dVpHRjBZVDh1Y0dGMGFDQS9QeUJjSWxWdWEyNXZkMjRnY0dGMGFGd2lLVHRjYmlBZ0lDQWdJQ0FnZlNCbGJITmxJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhOMFlXTnJJRDBnS0dWeWNtOXlQeTV6ZEdGamF5QS9QeUJjSWx3aUtTNXpjR3hwZENoY0lseGNibHdpS1M1emJHbGpaU2d5S1M1cWIybHVLRndpWEZ4dVhDSXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2JHOW5aMlZ5TG5kaGNtNG9ibUZ0WlN3Z1lGeGNiaVI3U2xOUFRpNXpkSEpwYm1kcFpua29aWEp5YjNJL0xtUmhkR0VwZldBc0lHQmNYRzRrZTNOMFlXTnJmVnhjYm1BcE8xeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUNBZ2RISjVJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lHTnZibk4wSUhOMFlXTnJJRDBnWlhKeWIzSS9Mbk4wWVdOcklEOC9JRndpWENJN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JzYjJkblpYSXVaWEp5YjNJb2JtRnRaU3dnWUZ4Y2JpUjdTbE5QVGk1emRISnBibWRwWm5rb1pYSnliM0kvTG1SaGRHRXBmV0FzSUdCY1hHNGtlM04wWVdOcmZWeGNibUFwTzF4dUlDQWdJQ0FnSUNCOUlHTmhkR05vSUNoZktTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCc2IyZG5aWEl1WlhKeWIzSW9ibUZ0WlN3Z1lGeGNiaVI3WlhKeWIzSS9MblJ2VTNSeWFXNW5LQ2w5WUN3Z1lGeGNiaVI3WlhKeWIzSS9Mbk4wWVdOcmZWeGNibUFwTzF4dUlDQWdJQ0FnSUNCOVhHNGdJQ0FnZlZ4dVhHNGdJQ0FnYkdWMElISmxjM1ZzZERvZ1RXbHNhMmx2VW1WemNHOXVjMlZTWldwbFkzUTdYRzVjYmlBZ0lDQnBaaUFvWlhKeWIzSS9MaVJ0YVd4cmFXOVNaV3BsWTNRZ1BUMDlJSFJ5ZFdVcElISmxjM1ZzZENBOUlIc2djM1ZqWTJWemN6b2dabUZzYzJVc0lHTnZaR1U2SUdWeWNtOXlMbU52WkdVc0lISmxhbVZqZERvZ1pYSnliM0l1WkdGMFlTd2daWGhsWTNWMFpVbGtJSDA3WEc0Z0lDQWdaV3h6WlNCeVpYTjFiSFFnUFNCN0lITjFZMk5sYzNNNklHWmhiSE5sTENCamIyUmxPaUJjSWtsT1ZFVlNUa0ZNWDFORlVsWkZVbDlGVWxKUFVsd2lMQ0J5WldwbFkzUTZJSFZ1WkdWbWFXNWxaQ3dnWlhobFkzVjBaVWxrSUgwN1hHNWNiaUFnSUNCeVpYUjFjbTRnY21WemRXeDBPMXh1ZlZ4dUlnb2dJRjBzQ2lBZ0ltMWhjSEJwYm1keklqb2dJanRCUVVGUExGTkJRVk1zU1VGQk5rSXNRMEZCUXl4VFFVRXlRanRCUVVGQkxFVkJRM1pGTEU5QlFVOHNVVUZCVVR0QlFVRkJPenRCUTFWV0xGTkJRVk1zVlVGQk1FTXNRMEZCUXl4UFFVRXJRanRCUVVGQkxFVkJRM2hHTEU5QlFVODdRVUZCUVN4SlFVTk1MRTFCUVUwc1QwRkJUeXhGUVVGRkxHRkJRV0VzWlVGQlpTeE5RVUZOTzBGQlFVRXNSVUZEYmtRN1FVRkJRVHM3UVVOa1N5eFRRVUZUTEUxQlFUaENMRU5CUVVNc1UwRkJNRUk3UVVGQlFTeEZRVU4yUlN4UFFVRlBPMEZCUVVFN1FVRlRSaXhUUVVGVExGZEJRVmNzUTBGQlF5eFBRVUZ2UXl4alFVRnpRanRCUVVGQkxFVkJRM0JHTEVsQlFVa3NWVUZCVlR0QlFVRkJMRWxCUVZjc1QwRkJUenRCUVVGQkxFVkJSV2hETEU5QlFVOHNSMEZCUnp0QlFVRkJPMEZCUjB3c1UwRkJVeXhYUVVGWExFTkJRVU1zVDBGQk1rSXNZMEZCYzBJN1FVRkJRU3hGUVVNelJTeEpRVUZKTEZWQlFWVTdRVUZCUVN4SlFVRlhMRTlCUVU4N1FVRkJRU3hGUVVWb1F5eFBRVUZQTEU5QlFVOHNVMEZCVXl4UFFVRlBMRVZCUVVVN1FVRkJRVHRCUVVjelFpeFRRVUZUTEZsQlFWa3NRMEZCUXl4UFFVRnZReXhqUVVGMVFqdEJRVUZCTEVWQlEzUkdMRWxCUVVrc1ZVRkJWVHRCUVVGQkxFbEJRVkVzVDBGQlR6dEJRVUZCTEVWQlJUZENMRWxCUVVrc1ZVRkJWVHRCUVVGQkxFbEJRVk1zVDBGQlR6dEJRVUZCTEVWQlJUbENMRWxCUVVrc1ZVRkJWVHRCUVVGQkxFbEJRVWtzVDBGQlR6dEJRVUZCTEVWQlJYcENMRWxCUVd0Q0xGVkJRV1E3UVVGQlFTeEpRVUZ4UWl4UFFVRlBPMEZCUVVFc1JVRkZhRU1zVDBGQlR5eFJRVUZSTEV0QlFVczdRVUZCUVRzN1FVTXZRbVlzVTBGQlV5eGhRVUZoTEVOQlFVTXNVMEZCYTBJN1FVRkJRU3hGUVVNNVF5eE5RVUZOTEU5QlFTdENMRU5CUVVNN1FVRkJRU3hGUVVOMFF5eFpRVUZaTEV0QlFVc3NWVUZCVnl4UlFVRm5RaXhSUVVGUkxFZEJRVWM3UVVGQlFTeEpRVU55UkN4TFFVRkxMRTlCUVU4N1FVRkJRU3hGUVVOa08wRkJRVUVzUlVGRFFTeFBRVUZQTzBGQlFVRTdPenRCUTB4VUxGTkJRVk1zWVVGQllTeERRVUZETEU5QlFUQkRPMEZCUVVFc1JVRkRMMFFzVDBGQlR5eFBRVUZQTEZWQlFWVXNXVUZCV1N4VlFVRlZMRkZCUVZFc1EwRkJReXhOUVVGTkxGRkJRVkVzUzBGQlN6dEJRVUZCTzBGQlIzSkZMRk5CUVZNc1UwRkJkVVVzUTBGQlF5eFJRVUZYTEZGQlFXTTdRVUZCUVN4RlFVTXZSeXhOUVVGTkxGTkJRVk1zUzBGQlN5eFBRVUZQTzBGQlFVRXNSVUZGTTBJc1YwRkJWeXhQUVVGUExGRkJRVkU3UVVGQlFTeEpRVU40UWl4SlFVRkpMRU5CUVVNc1QwRkJUeXhWUVVGVkxHVkJRV1VzUzBGQlN5eFJRVUZSTEVkQlFVYzdRVUZCUVN4TlFVRkhPMEZCUVVFc1NVRkZlRVFzVFVGQlRTeGpRVUZqTEU5QlFVODdRVUZCUVN4SlFVTXpRaXhOUVVGTkxHTkJRV01zVDBGQlR6dEJRVUZCTEVsQlJUTkNMRWxCUVVrc1QwRkJUeXhWUVVGVkxHVkJRV1VzUzBGQlN5eFJRVUZSTEVkQlFVY3NSMEZCUnp0QlFVRkJMRTFCUTNKRUxFbEJRVWtzWTBGQll5eFhRVUZYTEV0QlFVc3NZMEZCWXl4WFFVRlhMRWRCUVVjN1FVRkJRU3hSUVVNMVJDeFBRVUZQTEU5QlFUUkNMRlZCUVZVc1lVRkJZU3hYUVVGWE8wRkJRVUVzVFVGRGRrVTdRVUZCUVN4SlFVTkdMRVZCUVU4N1FVRkJRU3hOUVVOS0xFOUJRV1VzVDBGQlR6dEJRVUZCTzBGQlFVRXNSVUZGTTBJN1FVRkJRU3hGUVVWQkxFOUJRVTg3UVVGQlFUczdPMEZEZEVKVUxFbEJRVTBzYVVKQlFXbENPMEZCUlhaQ0xGTkJRVk1zV1VGQldTeERRVUZETEV0QlFUQkNPMEZCUVVFc1JVRkROVU1zVFVGQlRTeE5RVUZOTEVsQlFVazdRVUZCUVN4RlFVTm9RaXhKUVVGSkxFOUJRVThzVFVGQlRTeFBRVUZQTEUxQlFVMHNTVUZCU1N4WFFVRlhMRU5CUVVNc1MwRkJTeXhOUVVGUkxFbEJRVWtzVjBGQlZ5eERRVUZETEV0QlFVc3NUVUZCVVN4SlFVRkpMRkZCUVZFc1IwRkJSeXhOUVVGTkxFbEJRVWs3UVVGQlFTeEpRVU0zUnl4TlFVRk5MRkZCUVZFc1pVRkJaU3hMUVVGTExFZEJRVWM3UVVGQlFTeEpRVU55UXl4SlFVRkpMRlZCUVZVc1RVRkJUVHRCUVVGQkxFMUJRMmhDTEUxQlFVMHNWMEZCVnl4TlFVRk5PMEZCUVVFc1RVRkRka0lzVFVGQlRTeFRRVUZUTEUxQlFVMDdRVUZCUVN4TlFVTnlRaXhKUVVGSkxHRkJRV0U3UVVGQlFTeFJRVUZYTEU5QlFVODdRVUZCUVN4TlFVTnVReXhKUVVGSkxGZEJRVmNzVjBGQlZ6dEJRVUZCTEZGQlEzUkNMRTFCUVUwc1pVRkJaU3hQUVVGUExGZEJRVmNzUzBGQlN5eFBRVUZQTEU5QlFVOHNRMEZCUXl4TlFVRk5MRTFCUVUwc1IwRkJSeXhQUVVGUExFMUJRVTBzUjBGQlJ5eERRVUZETEV0QlFVc3NUMEZCVHl4TlFVRk5MRU5CUVVNc1RVRkJUVHRCUVVGQkxGRkJRM0JJTEU5QlFVOHNTVUZCU1N4TFFVRkxMRmRCUVZjc1dVRkJXVHRCUVVGQkxFMUJRek5ETzBGQlFVRXNUVUZEUVN4UFFVRlBMRWxCUVVrc1MwRkJTeXhYUVVGWExFZEJRVWM3UVVGQlFTeEpRVU5zUXp0QlFVRkJMRVZCUTBvN1FVRkJRU3hGUVVOQkxFOUJRVTg3UVVGQlFUdEJRVWRLTEZOQlFWTXNaVUZCYTBJc1EwRkJReXhOUVVGWk8wRkJRVUVzUlVGRE0wTXNTVUZCU1N4VFFVRlRMRkZCUVZFc1UwRkJVenRCUVVGQkxFbEJRVmNzVDBGQlR6dEJRVUZCTEVWQlEyaEVMRWxCUVVrc1QwRkJUeXhUUVVGVExGVkJRVlU3UVVGQlFTeEpRVU14UWl4SlFVRkpMR2RDUVVGblFqdEJRVUZCTEUxQlFVMHNUMEZCVHp0QlFVRkJMRWxCUTJwRExFbEJRVWtzVFVGQlRTeFJRVUZSTEVsQlFVa3NSMEZCUnp0QlFVRkJMRTFCUTNKQ0xFMUJRVTBzVFVGQlRTeExRVUZMTzBGQlFVRXNUVUZEYWtJc1UwRkJVeXhKUVVGSkxFVkJRVWNzU1VGQlNTeExRVUZMTEV0QlFVczdRVUZCUVN4UlFVTXhRaXhOUVVGTkxFbEJRVWtzUzBGQlN6dEJRVUZCTEZGQlEyWXNTVUZCU1N4UFFVRlBMRTFCUVUwc1ZVRkJWVHRCUVVGQkxGVkJRM1pDTEUxQlFVMHNTVUZCU1N4aFFVRmhMRU5CUVVNN1FVRkJRU3hWUVVONFFpeEpRVUZKTEUxQlFVMDdRVUZCUVN4WlFVRk5MRXRCUVVzc1MwRkJTenRCUVVGQkxGRkJRemxDTEVWQlFVOHNVMEZCU1N4UFFVRlBMRTFCUVUwc1dVRkJXU3hOUVVGTkxFMUJRVTA3UVVGQlFTeFZRVU0xUXl4blFrRkJaMElzUTBGQlF6dEJRVUZCTEZGQlEzSkNPMEZCUVVFc1RVRkRTanRCUVVGQkxFMUJRMEVzVDBGQlR6dEJRVUZCTEVsQlExZzdRVUZCUVN4SlFVTkJMRTFCUVUwc1RVRkJUVHRCUVVGQkxFbEJRMW9zVjBGQlZ5eFBRVUZQTEV0QlFVczdRVUZCUVN4TlFVTnVRaXhKUVVGSkxFTkJRVU1zVDBGQlR5eFZRVUZWTEdWQlFXVXNTMEZCU3l4TFFVRkxMRWRCUVVjN1FVRkJRU3hSUVVGSE8wRkJRVUVzVFVGRGNrUXNUVUZCVFN4SlFVRkpMRWxCUVVrN1FVRkJRU3hOUVVOa0xFbEJRVWtzVDBGQlR5eE5RVUZOTEZWQlFWVTdRVUZCUVN4UlFVTjJRaXhOUVVGTkxFbEJRVWtzWVVGQllTeERRVUZETzBGQlFVRXNVVUZEZUVJc1NVRkJTU3hOUVVGTk8wRkJRVUVzVlVGQlRTeEpRVUZKTEU5QlFVODdRVUZCUVN4TlFVTXZRaXhGUVVGUExGTkJRVWtzVDBGQlR5eE5RVUZOTEZsQlFWa3NUVUZCVFN4TlFVRk5PMEZCUVVFc1VVRkROVU1zWjBKQlFXZENMRU5CUVVNN1FVRkJRU3hOUVVOeVFqdEJRVUZCTEVsQlEwbzdRVUZCUVN4SlFVTkJMRTlCUVU4N1FVRkJRU3hGUVVOWU8wRkJRVUVzUlVGRFFTeEpRVUZKTEU5QlFVOHNVMEZCVXl4VlFVRlZPMEZCUVVFc1NVRkRNVUlzVFVGQlRTeEpRVUZKTEdGQlFXRXNTVUZCU1R0QlFVRkJMRWxCUXpOQ0xFbEJRVWtzVFVGQlRUdEJRVUZCTEUxQlFVMHNUMEZCVHp0QlFVRkJMRVZCUXpOQ08wRkJRVUVzUlVGRFFTeFBRVUZQTzBGQlFVRTdPenRCUXk5RFNpeFRRVUZUTEdOQlFXTXNRMEZCUXl4WFFVRXdRaXhUUVVGak8wRkJRVUVzUlVGRGJrVXNUVUZCVFN4WlFVRlpMRTlCUTJRc1lVRkRRU3haUVdsQ0swODdRVUZCUVN4SlFVTXZUeXhOUVVGTkxFOUJRVThzVVVGQlVTeExRVUZMTEZOQlFWTXNSMEZCUnl4SlFVRkpMRmRCUVZjN1FVRkJRU3hKUVVOeVJDeE5RVUZOTEZsQlFXOUNMRkZCUVZFN1FVRkJRU3hKUVVOc1F5eEpRVUZKTzBGQlFVRXNTVUZEU2l4SlFVRkpMRVZCUVVVc1VVRkJVU3h0UWtGQmJVSXNWVUZCVlR0QlFVRkJMRTFCUlhaRExFbEJRVWtzVDBGQlVTeFJRVUZSTEZOQlFXbENMRkZCUVZFc1kwRkJZeXhGUVVGRkxGRkJRVkVzYlVKQlFXMUNMRlZCUVZVN1FVRkJRU3hSUVVNNVJpeFZRVUZWTEZGQlFWRTdRVUZCUVN4TlFVVjBRaXhGUVVGUE8wRkJRVUVzVVVGRlNDeFZRVUZWTEVsQlFVa3NVVUZCVVR0QlFVRkJMR0ZCUTJZc1VVRkJVVHRCUVVGQkxGRkJRMllzUTBGQlF6dEJRVUZCTEZGQlEwUXNTVUZCU1N4RlFVRkZMRmxCUVZrN1FVRkJRU3hWUVVGWExGRkJRV2RDTEZOQlFWTXNUVUZCVFN4alFVRmpMRTlCUVU4N1FVRkJRVHRCUVVGQkxFbEJSWHBHTEVWQlFVODdRVUZCUVN4TlFVTklMRlZCUVZVc1VVRkJVVHRCUVVGQkxFMUJRMnhDTEVsQlFVa3NSVUZCUlN4WlFVRlpPMEZCUVVFc1VVRkJWeXhSUVVGblFpeFRRVUZUTEUxQlFVMHNZMEZCWXl4UFFVRlBPMEZCUVVFN1FVRkJRU3hKUVVkeVJpeE5RVUZOTEZWQlFYTkNMRU5CUVVNN1FVRkJRU3hKUVVNM1FpeE5RVUZOTEZsQlFWa3NRMEZCUXl4WlFVRnBRaXhSUVVGUkxGRkJRVkVzVDBGQlR6dEJRVUZCTEVsQlJUTkVMRWxCUVVrN1FVRkJRU3hKUVVOS0xFbEJRVWtzVVVGQlVTeGxRVUZsTEU5QlFVODdRVUZCUVN4TlFVTTVRaXhUUVVGVExGRkJRVkU3UVVGQlFTeE5RVU5xUWl4SlFVRkpMRTlCUVU4c1YwRkJWenRCUVVGQkxGRkJRV0VzVTBGQlV5eERRVUZETzBGQlFVRXNTVUZEYWtRc1JVRkJUenRCUVVGQkxFMUJRMGdzU1VGQlNTeERRVUZETEZGQlFWRXNWVUZCVlN4UlFVRlJMRmRCUVZjc1RVRkJUU3hSUVVGUkxGZEJRVmNzVFVGQlRUdEJRVUZCTEZGQlEzSkZMRk5CUVZNc1EwRkJRenRCUVVGQkxFMUJRMlFzUlVGQlR5eFRRVUZKTEZGQlFWRXNTVUZCU1N4alFVRmpMRWRCUVVjc1YwRkJWeXhyUWtGQmEwSXNSMEZCUnp0QlFVRkJMRkZCUTNCRkxFbEJRVWs3UVVGQlFTeFZRVU5CTEZOQlFWTXNaMEpCUVdkQ0xFdEJRVXNzVFVGQlRTeFJRVUZSTEUxQlFVMHNRMEZCUXp0QlFVRkJMRlZCUTNKRUxFOUJRVThzVDBGQlR6dEJRVUZCTEZWQlExb3NUVUZCVFN4UFFVRlBMRFpDUVVFMlFpeEZRVUZGTEZWQlFWVXNVVUZCVVN4aFFVRmhMRkZCUVZFc1NVRkJTU3hqUVVGakxFdEJRVXNzVFVGQlRTeFJRVUZSTEZGQlFWRXNUMEZCVHl4TlFVRk5MRWRCUVVjc1NVRkJTU3hGUVVGRkxFTkJRVU03UVVGQlFUdEJRVUZCTEZGQlJUTktMRWxCUVVrc1QwRkJUeXhYUVVGWE8wRkJRVUVzVlVGQllTeFRRVUZUTEVOQlFVTTdRVUZCUVN4TlFVTnFSQ3hGUVVGUExGTkJRVWtzVVVGQlVTeEpRVUZKTEdOQlFXTXNSMEZCUnl4WFFVRlhMRzFEUVVGdFF5eEhRVUZITzBGQlFVRXNVVUZEY2tZc1NVRkJTVHRCUVVGQkxGVkJRMEVzVFVGQlRTeFhRVUZYTEVsQlFVa3NaMEpCUVdkQ0xGRkJRVkVzVFVGQlRUdEJRVUZCTEZWQlEyNUVMRk5CUVZNc1EwRkJRenRCUVVGQkxGVkJRMVlzVTBGQlV5eFJRVUZSTEVOQlFVTXNUMEZCVHl4UlFVRlJMRTlCUVU4c1QwRkJUeXhMUVVGTE8wRkJRVUVzVlVGRGRFUXNUMEZCVHl4UFFVRlBPMEZCUVVFc1ZVRkRXaXhOUVVGTkxFOUJRVThzTmtKQlFUWkNMRVZCUVVVc1ZVRkJWU3h0UWtGQmJVSXNZVUZCWVN4UlFVRlJMRWxCUVVrc1kwRkJZeXhMUVVGTExFMUJRVTBzVVVGQlVTeFJRVUZSTEU5QlFVOHNUVUZCVFN4SFFVRkhMRWxCUVVrc1JVRkJSU3hEUVVGRE8wRkJRVUU3UVVGQlFTeE5RVVV4U3l4RlFVRlBMRk5CUVVrc1VVRkJVU3hQUVVGUExGZEJRVmNzUjBGQlJ5eEhRVUZITzBGQlFVRXNVVUZEZGtNc1NVRkJTVHRCUVVGQkxGVkJRMEVzVTBGQlV5eG5Ra0ZCWjBJc1MwRkJTeXhOUVVGTkxGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNWVUZEY2tRc1QwRkJUeXhQUVVGUE8wRkJRVUVzVlVGRFdpeE5RVUZOTEU5QlFVOHNOa0pCUVRaQ0xFVkJRVVVzVlVGQlZTeFJRVUZSTEdGQlFXRXNVVUZCVVN4SlFVRkpMR05CUVdNc1MwRkJTeXhOUVVGTkxGRkJRVkVzVVVGQlVTeFBRVUZQTEUxQlFVMHNSMEZCUnl4SlFVRkpMRVZCUVVVc1EwRkJRenRCUVVGQk8wRkJRVUVzVFVGRkwwb3NSVUZEU3p0QlFVRkJMRkZCUTBRc1RVRkJUU3hQUVVGUExEWkNRVUUyUWl4RlFVRkZMRlZCUVZVc1VVRkJVU3hoUVVGaExGRkJRVkVzU1VGQlNTeGpRVUZqTEV0QlFVc3NUVUZCVFN4UlFVRlJMRkZCUVZFc1QwRkJUeXhOUVVGTkxFZEJRVWNzU1VGQlNTeEZRVUZGTEVOQlFVTTdRVUZCUVR0QlFVRkJPMEZCUVVFc1NVRkhMMG9zU1VGQlNTeFBRVUZQTEZkQlFWY3NXVUZCV1N4TlFVRk5MRkZCUVZFc1RVRkJUVHRCUVVGQkxFMUJRVWNzVFVGQlRTeFBRVUZQTERaQ1FVRTJRaXhGUVVGRkxGVkJRVlVzVVVGQlVTeGhRVUZoTEZGQlFWRXNTVUZCU1N4alFVRmpMRXRCUVVzc1RVRkJUU3hUUVVGVExFOUJRVThzVVVGQlVTeFhRVUZYTEZkQlFWY3NVVUZCVVN4VFFVRlRMRXRCUVVzc1ZVRkJWU3hSUVVGUkxFMUJRVTBzUjBGQlJ5eE5RVUZOTEVkQlFVY3NTVUZCU1N4RlFVRkZMRU5CUVVNN1FVRkJRU3hKUVVONFVpeEpRVUZKTERKQ1FVRXlRaXhWUVVGVkxFOUJRVThzTUVKQlFUQkNMRlZCUVZVN1FVRkJRU3hOUVVOb1JpeEpRVUZKTEVOQlFVTXNVVUZCVVR0QlFVRkJMRkZCUVZNc1RVRkJUU3hQUVVGUExHOUNRVUZ2UWl3d1EwRkJNRU03UVVGQlFTeE5RVU5xUnl4UFFVRlBMRTlCUVU4N1FVRkJRU3hOUVVOa0xFbEJRVWtzWVVGQllTeFpRVUZaTEdGQlFXRTdRVUZCUVN4TlFVTXhReXhKUVVGSkxHVkJRV1VzWVVGQllTeGxRVUZsTzBGQlFVRXNVVUZCVFN4aFFVRmhMRU5CUVVNN1FVRkJRU3hOUVVOdVJTeFRRVUZUTEZWQlFWVXNVVUZCVVN4VlFVRlZPMEZCUVVFc1RVRkRja01zVVVGQlVTeGpRVUZqTEUxQlFVMHNNa0pCUVRKQ0xFdEJRVXNzVlVGQlZTeE5RVUZOTEVOQlFVTTdRVUZCUVN4SlFVTnFSanRCUVVGQkxFbEJRMEVzU1VGQlNTeERRVUZETEZGQlFWRXNVMEZCVXl4TlFVRk5MRmxCUVZrc1VVRkJVU3hUUVVGVExFMUJRVTBzVVVGQlVUdEJRVUZCTEUxQlFWRXNVVUZCVVN4UlFVRlJMRXRCUVVzc1QwRkJUeXhUUVVGVE8wRkJRVUVzU1VGRmNFZ3NTVUZCU1N4RFFVRkRMRkZCUVZFN1FVRkJRU3hOUVVGVExGRkJRVkVzVlVGQlZTeERRVUZETzBGQlFVRXNTVUZEZWtNc1RVRkJUU3hOUVVGTkxGRkJRVkU3UVVGQlFTeEpRVU53UWl4SlFVRkpMRlZCUVZVc1VVRkJVVHRCUVVGQkxFbEJRM1JDTEVsQlFVa3NUMEZCVHl4UlFVRlJPMEZCUVVFc1NVRkRia0lzU1VGQlNTeFpRVUZaTzBGQlFVRXNTVUZEYUVJc1NVRkJTU3hUUVVGVExGRkJRVkU3UVVGQlFTeEpRVU55UWl4SlFVRkpMRTlCUVU4c1VVRkJVVHRCUVVGQkxFbEJRMjVDTEVsQlFVa3NhMEpCUVd0Q0xGRkJRVkU3UVVGQlFTeEpRVU01UWl4SlFVRkpMR3RDUVVGclFpeFJRVUZSTzBGQlFVRXNTVUZET1VJc1NVRkJTU3haUVVGWkxGRkJRVkU3UVVGQlFTeEpRVU40UWl4SlFVRkpMRk5CUVZNc1VVRkJVU3hSUVVGUk8wRkJRVUVzU1VGRE4wSXNTVUZCU1N4UlFVRlJMRlZCUVZVN1FVRkJRU3hKUVVOMFFpeEpRVUZKTEU5QlFVOHNRMEZCUXl4VFFVRmhMRmxCUVdkQ0xFOUJRVThzUzBGQlN5eFRRVUZSTEU5QlFVMDdRVUZCUVN4SlFVTnVSU3hKUVVGSkxGbEJRVms3UVVGQlFTeEpRVU5vUWl4SlFVRkpMRWxCUVVrN1FVRkJRU3hKUVVOU0xFbEJRVWtzVTBGQlV6dEJRVUZCTEVsQlEySXNTVUZCU1N4UlFVRlJPMEZCUVVFc1NVRkZXaXhOUVVGTkxGVkJRWGRDTEVWQlFVVXNUMEZCVHl4VlFVRlZPMEZCUVVFc1NVRkZha1FzVFVGQlRTeFRRVUZUTEZsQlFWazdRVUZCUVN4SlFVTXpRaXhOUVVGTkxFOUJRVkVzVVVGQlVTeFBRVUZQTEZGQlFWRXNUMEZCVHl4RFFVRkRPMEZCUVVFc1NVRkZOME1zU1VGQlNTeFJRVUZSTEZGQlFWRXNUVUZCVFN4VFFVRlRMRmRCUVZjc1YwRkJWenRCUVVGQkxFMUJRM0pFTEUxQlFVMHNaVUZCWlN4TlFVRk5MRmRCUVZjc1EwRkJReXhOUVVGTk8wRkJRVUVzVFVGRE4wTXNTVUZCU1N4RFFVRkRMR0ZCUVdFc1UwRkJVeXhSUVVGUkxGRkJRVkVzUzBGQlN5eFJRVUZSTEUxQlFVMDdRVUZCUVN4UlFVRkhMRTFCUVUwc1QwRkJUeXh6UWtGQmMwSXNVMEZCVXp0QlFVRkJMRWxCUTJwSU8wRkJRVUVzU1VGRlFTeEpRVUZKTEUxQlFVMHNaVUZCWlN4aFFVRmhMRXRCUVVzc1pVRkJaU3hSUVVGVExFMUJRVTBzVVVGQlVTeExRVUZMTEZWQlFWVXNTMEZCU3l4TFFVRkxMRmRCUVZjc1UwRkJVeXhSUVVGUkxFZEJRVWs3UVVGQlFTeE5RVU4wU1N4TlFVRk5MR0ZCUVdFc1dVRkJXU3hsUVVGbExFMUJRVTA3UVVGQlFTeE5RVU53UkN4SlFVRkpMRU5CUVVNc1YwRkJWenRCUVVGQkxGRkJRVk1zVFVGQlRTeFBRVUZQTEhsQ1FVRjVRaXhMUVVGTkxGZEJRVzFDTEU5QlFVOHNTVUZCU1N4VFFVRlRMR05CUVdVc1YwRkJiVUlzVDBGQlR5eEhRVUZITEdGQlFXTXNWMEZCYlVJc1QwRkJUeXhIUVVGSExHZERRVUZwUXl4WFFVRnRRaXhQUVVGUExFZEJRVWNzTUVKQlFUQkNMRU5CUVVNN1FVRkJRU3hKUVVOb1V6dEJRVUZCTEVsQlJVRXNTVUZCU1N4UlFVRlJMRzFDUVVGdFFpeHpRa0ZCYzBJc1MwRkJTeXhOUVVGTk8wRkJRVUVzVFVGRE5VUXNUVUZCVFN4UlFVRlJMRXRCUVVzc2QwSkJRWGRDTEVWQlFVVXNWMEZCVnl4UlFVRlJMR3RDUVVGclFpeFJRVUZSTEZGQlFWRXNaVUZCWlN4TlFVRk5MRkZCUVZFc1RVRkJUU3hOUVVGTkxGTkJRVk1zVVVGQlVTeFRRVUZUTEZGQlFWRXNUVUZCVFN4RFFVRkRPMEZCUVVFc1NVRkRlRXc3UVVGQlFTeEpRVVZCTEZGQlFWRXNVVUZCVVN4TlFVRk5MRTlCUVU4c1VVRkJVU3hSUVVGUkxGTkJRVk1zVFVGQlRUdEJRVUZCTEVsQlJUVkVMRWxCUVVrc1kwRkJZenRCUVVGQkxFbEJRMnhDTEVsQlFVa3NVVUZCVVN4VlFVRlZMR0ZCUVdFc1VVRkJVU3hWUVVGVkxGRkJRVkVzVVVGQlVTeFZRVUZWTEVsQlFVazdRVUZCUVN4TlFVTXZSU3hqUVVGak8wRkJRVUVzVFVGRFpDeFJRVUZSTEZGQlFWRXNRMEZCUXp0QlFVRkJMRWxCUTNKQ0xFVkJRVThzVTBGQlNTeE5RVUZOTEZGQlFWRXNVVUZCVVN4TFFVRkxMRXRCUVVzc1QwRkJUeXhSUVVGUkxGVkJRVlVzVlVGQlZUdEJRVUZCTEUxQlF6RkZMRTFCUVUwc1QwRkJUeXhuUWtGQlowSXNOa2RCUVRaSE8wRkJRVUVzU1VGRE9VazdRVUZCUVN4SlFVVkJMRWxCUVVrc1VVRkJVU3h0UWtGQmJVSXNjVUpCUVhGQ0xFdEJRVXNzVFVGQlRUdEJRVUZCTEUxQlF6TkVMRTFCUVUwc1VVRkJVU3hMUVVGTExIVkNRVUYxUWl4RlFVRkZMRmRCUVZjc1VVRkJVU3hyUWtGQmEwSXNVVUZCVVN4UlFVRlJMR1ZCUVdVc1RVRkJUU3hSUVVGUkxFMUJRVTBzVFVGQlRTeFRRVUZUTEZGQlFWRXNVMEZCVXl4VFFVRlRMRkZCUVZFc1RVRkJUU3hEUVVGRE8wRkJRVUVzU1VGRGFFMDdRVUZCUVN4SlFVVkJMRTlCUVU4c1JVRkJSU3hYUVVGWExGTkJRVk1zVVVGQlVTeFRRVUZUTEZOQlFWTXNVVUZCVVN4VFFVRlRMRTFCUVUwc1RVRkJUU3hoUVVGaExGRkJRVkU3UVVGQlFUdEJRVUZCTEVWQlJ6ZEhMRTFCUVUwc1UwRkJVeXhQUVVGUExGTkJRVzFDTEZGQlFYRkRMRmRCUVN0Q08wRkJRVUVzU1VGRGVrY3NVVUZCVVN4WlFVRlpMRTFCUVUwN1FVRkJRU3hKUVVNeFFpeFBRVUZQTEZGQlFWRXNVMEZCVXl4TlFVRk5PMEZCUVVFN1FVRkJRU3hGUVVkc1F5eFBRVUZQTzBGQlFVRXNTVUZEU0R0QlFVRkJMRWxCUTBFN1FVRkJRU3hGUVVOS08wRkJRVUU3TzBGRGJFcEtMRWxCUVUwc2JVSkJRVzFDTEZGQlFWRXNVVUZCVVR0QlFVVnNReXhUUVVGVExHdENRVUZyUWl4SFFVRkhPMEZCUVVFc1JVRkRha01zVFVGQlRTeFhRVUZYTEVsQlFVazdRVUZCUVN4RlFVTnlRaXhOUVVGTkxGVkJRVlVzU1VGQlNUdEJRVUZCTEVWQlEzQkNMRWxCUVVrc1YwRkJWenRCUVVGQkxFVkJSV1lzVFVGQlRTeGxRVUZsTzBGQlFVRXNTVUZEYWtJc1NVRkJTU3hEUVVFclJ5eExRVUZWTEZsQlFYRkNPMEZCUVVFc1RVRkRPVWs3UVVGQlFTeE5RVU5CTEZOQlFWTXNTVUZCU1N4VFFVRlRMRWRCUVdFN1FVRkJRU3hOUVVOdVF5eEpRVUZKTEZGQlFWRXNTMEZCU3p0QlFVRkJMRkZCUTJJc1NVRkJTU3hSUVVGUkxFbEJRVWtzUjBGQlJ5eE5RVUZOTEU5QlFVODdRVUZCUVN4VlFVTTFRaXhSUVVGUkxFbEJRVWtzUzBGQlN5eEpRVUZKTEVkQlFVczdRVUZCUVN4UlFVTTVRanRCUVVGQkxGRkJRMEVzVFVGQlRTeGpRVUZqTEZGQlFWRXNTVUZCU1N4SFFVRkhPMEZCUVVFc1VVRkRia01zV1VGQldTeEpRVUZKTEU5QlFVODdRVUZCUVN4TlFVTXpRaXhGUVVGUE8wRkJRVUVzVVVGRFNDeEpRVUZKTEZGQlFWRXNTVUZCU1N4SFFVRmhMRTFCUVUwc1QwRkJUenRCUVVGQkxGVkJRM1JETEZGQlFWRXNTVUZCU1N4TFFVRmxMRWxCUVVrc1IwRkJTenRCUVVGQkxGRkJRM2hETzBGQlFVRXNVVUZEUVN4TlFVRk5MRTFCUVUwc1VVRkJVU3hKUVVGSkxFZEJRV0U3UVVGQlFTeFJRVU55UXl4SlFVRkpMRWxCUVVrc1QwRkJUenRCUVVGQk8wRkJRVUVzVFVGSGJrSXNUMEZCVHl4TlFVRk5PMEZCUVVFc1VVRkRWQ3hUUVVGVExFOUJRVThzVDBGQlR6dEJRVUZCTEZGQlEzWkNMRWxCUVVrc1VVRkJVU3hMUVVGTE8wRkJRVUVzVlVGRFlpeE5RVUZOTEdOQlFXTXNVVUZCVVN4SlFVRkpMRWRCUVVjN1FVRkJRU3hWUVVOdVF5eEpRVUZKTEdGQlFXRTdRVUZCUVN4WlFVTmlMRmxCUVZrc1QwRkJUeXhQUVVGUE8wRkJRVUVzVlVGRE9VSTdRVUZCUVN4UlFVTktMRVZCUVU4N1FVRkJRU3hWUVVOSUxFMUJRVTBzVFVGQlRTeFJRVUZSTEVsQlFVa3NSMEZCWVR0QlFVRkJMRlZCUTNKRExFbEJRVWtzUzBGQlN6dEJRVUZCTEZsQlEwd3NTVUZCU1N4UFFVRlBMRTlCUVU4N1FVRkJRU3hWUVVOMFFqdEJRVUZCTzBGQlFVRTdRVUZCUVR0QlFVRkJMRWxCU1Zvc1MwRkJTeXhEUVVFeVJTeExRVUZWTEZsQlFYRkNPMEZCUVVFc1RVRkRNMGM3UVVGQlFTeE5RVU5CTEVsQlFVa3NVVUZCVVN4TFFVRkxPMEZCUVVFc1VVRkRZaXhOUVVGTkxHTkJRV01zVVVGQlVTeEpRVUZKTEVkQlFVYzdRVUZCUVN4UlFVTnVReXhKUVVGSkxFTkJRVU03UVVGQlFTeFZRVUZoTzBGQlFVRXNVVUZEYkVJc1UwRkJVeXhQUVVGUExFOUJRVTg3UVVGQlFTeFJRVU4yUWl4WlFVRlpMRTlCUVU4c1QwRkJUenRCUVVGQkxFMUJRemxDTEVWQlFVODdRVUZCUVN4UlFVTklMRTFCUVUwc1RVRkJUU3hSUVVGUkxFbEJRVWtzUjBGQllUdEJRVUZCTEZGQlEzSkRMRWxCUVVrc1EwRkJRenRCUVVGQkxGVkJRVXM3UVVGQlFTeFJRVU5XTEZOQlFWTXNUMEZCVHl4UFFVRlBPMEZCUVVFc1VVRkRka0lzU1VGQlNTeFBRVUZQTEU5QlFVODdRVUZCUVR0QlFVRkJPMEZCUVVFc1NVRkhNVUlzVFVGQlRTeERRVUYzUkN4TFFVRlZMRlZCUVdkRE8wRkJRVUVzVFVGRGNFY3NUVUZCVFN4SlFVRkpMRkZCUVZFc1NVRkJTU3hIUVVGaE8wRkJRVUVzVFVGRGJrTXNUVUZCVFN4dFFrRkJiVUlzVVVGQlVTeEpRVUZKTEVkQlFVYzdRVUZCUVN4TlFVTjRReXhKUVVGSkxFTkJRVU1zYjBKQlFXOUNMRU5CUVVNN1FVRkJRU3hSUVVGSExFOUJRVTg3UVVGQlFTeE5RVVZ3UXl4SlFVRkpMRzlDUVVGdlFpeEhRVUZITzBGQlFVRXNVVUZEZGtJc1VVRkJVU3haUVVGWk8wRkJRVUVzVlVGRGFFSXNWMEZCVnl4WFFVRlhMR3RDUVVGclFqdEJRVUZCTEZsQlEzQkRMRTFCUVUwc1VVRkJVU3hGUVVGRkxFdEJRVXNzVFVGQlRTeERRVUZETzBGQlFVRXNWVUZEYUVNN1FVRkJRU3hWUVVOQkxGZEJRVmNzVjBGQlZ5eEhRVUZITzBGQlFVRXNXVUZEY2tJc1RVRkJUU3hSUVVGUkxFdEJRVXM3UVVGQlFTeFZRVU4yUWp0QlFVRkJMRmRCUTBRN1FVRkJRU3hOUVVOUU8wRkJRVUVzVFVGRlFTeEpRVUZKTEd0Q1FVRnJRanRCUVVGQkxGRkJRMnhDTEZGQlFWRXNXVUZCV1R0QlFVRkJMRlZCUTJoQ0xGZEJRVmNzVjBGQlZ5eHJRa0ZCYTBJN1FVRkJRU3haUVVOd1F5eE5RVUZOTEZGQlFWRXNSVUZCUlN4TFFVRkxMRTFCUVUwc1EwRkJRenRCUVVGQkxGVkJRMmhETzBGQlFVRXNWMEZEUkR0QlFVRkJMRTFCUTFBN1FVRkJRU3hOUVVWQkxGRkJRVkVzV1VGQldUdEJRVUZCTEZGQlEyaENMRmRCUVZjc1YwRkJWeXhIUVVGSk8wRkJRVUVzVlVGRGRFSXNUVUZCVFN4UlFVRlJMRXRCUVVzN1FVRkJRU3hSUVVOMlFqdEJRVUZCTEZOQlEwUTdRVUZCUVR0QlFVRkJMRWxCUlZBc2EwSkJRV3RDTEVOQlFVTXNVVUZCZVVJN1FVRkJRU3hOUVVONFF5eFBRVUZQTEZGQlFWRXNTVUZCU1N4SFFVRkhMRXRCUVVzc1VVRkJVU3hKUVVGSkxFZEJRVWM3UVVGQlFUdEJRVUZCTEZGQlJURkRMRkZCUVZFc1IwRkJSenRCUVVGQkxFMUJRVVVzVDBGQlR6dEJRVUZCTzBGQlFVRXNTVUZEZUVJc2FVSkJRV2xDTEU5QlFUaEVMRXRCUVZVc1ZVRkJiVU03UVVGQlFTeE5RVU40U0N4TlFVRk5MRzFDUVVGdFFpeFJRVUZSTEVsQlFVa3NSMEZCUnp0QlFVRkJMRTFCUTNoRExFbEJRVWtzVjBGQlZ6dEJRVUZCTEUxQlEyWXNTVUZCU1N4clFrRkJhMEk3UVVGQlFTeFJRVU5zUWl4WFFVRlhMRmRCUVZjc2EwSkJRV3RDTzBGQlFVRXNWVUZEY0VNc1NVRkJTeXhOUVVGTkxGRkJRVkVzUlVGQlJTeExRVUZMTEUxQlFVMHNRMEZCUXl4TlFVRlBMRTFCUVUwN1FVRkJRU3haUVVNeFF5eFhRVUZYTzBGQlFVRXNWVUZEWmp0QlFVRkJMRkZCUTBvN1FVRkJRU3hOUVVOS08wRkJRVUVzVFVGRlFTeE5RVUZOTEVsQlFVa3NVVUZCVVN4SlFVRkpMRWRCUVdFN1FVRkJRU3hOUVVOdVF5eEpRVUZKTEVkQlFVYzdRVUZCUVN4UlFVTklMRmRCUVZjc1YwRkJWeXhIUVVGSE8wRkJRVUVzVlVGRGNrSXNTVUZCU3l4TlFVRk5MRkZCUVZFc1MwRkJTeXhOUVVGUExFMUJRVTA3UVVGQlFTeFpRVU5xUXl4WFFVRlhPMEZCUVVFc1ZVRkRaanRCUVVGQkxGRkJRMG83UVVGQlFTeE5RVU5LTzBGQlFVRXNUVUZEUVN4UFFVRlBPMEZCUVVFN1FVRkJRU3hKUVVWWUxHbENRVUZwUWl4UFFVRTRSQ3hMUVVGVkxGVkJRVzFETzBGQlFVRXNUVUZEZUVnc1RVRkJUU3h0UWtGQmJVSXNVVUZCVVN4SlFVRkpMRWRCUVVjN1FVRkJRU3hOUVVONFF5eEpRVUZKTEZkQlFWYzdRVUZCUVN4TlFVTm1MRWxCUVVrc2EwSkJRV3RDTzBGQlFVRXNVVUZEYkVJc1YwRkJWeXhYUVVGWExHdENRVUZyUWp0QlFVRkJMRlZCUTNCRExFbEJRVXNzVFVGQlRTeFJRVUZSTEVWQlFVVXNTMEZCU3l4TlFVRk5MRU5CUVVNc1RVRkJUeXhOUVVGTk8wRkJRVUVzV1VGRE1VTXNWMEZCVnp0QlFVRkJMRlZCUTJZN1FVRkJRU3hSUVVOS08wRkJRVUVzVFVGRFNqdEJRVUZCTEUxQlJVRXNUVUZCVFN4SlFVRkpMRkZCUVZFc1NVRkJTU3hIUVVGaE8wRkJRVUVzVFVGRGJrTXNTVUZCU1N4SFFVRkhPMEZCUVVFc1VVRkRTQ3hYUVVGWExGZEJRVmNzUjBGQlJ6dEJRVUZCTEZWQlEzSkNMRWxCUVVzc1RVRkJUU3hSUVVGUkxFdEJRVXNzVFVGQlR5eE5RVUZOTzBGQlFVRXNXVUZEYWtNc1YwRkJWenRCUVVGQkxGVkJRMlk3UVVGQlFTeFJRVU5LTzBGQlFVRXNUVUZEU2p0QlFVRkJMRTFCUTBFc1QwRkJUenRCUVVGQk8wRkJRVUVzUlVGRlpqdEJRVUZCTEVWQlJVRXNUMEZCVHp0QlFVRkJPenRCUTNaSlNpeFRRVUZUTEZWQlFXRXNSMEZCYTBJN1FVRkJRU3hGUVVNM1F5eEpRVUZKTEZOQlFUaERPMEZCUVVFc1JVRkRiRVFzVFVGQlRTeFJRVXRFTEVOQlFVTTdRVUZCUVN4RlFVVk9MRTFCUVUwc1YwRkJWenRCUVVGQkxFbEJRMllzVFVGQlRTeERRVUZETEZOQlFWazdRVUZCUVN4TlFVTnFRaXhKUVVGSkxFMUJRVTBzUjBGQlJ5eEZRVUZGTEVkQlFVY3NWVUZCVlN4TlFVRk5PMEZCUVVFc1VVRkRhRU1zVFVGQlRTeFBRVUZQTEUxQlFVMHNSMEZCUnl4RlFVRkZPMEZCUVVFc1VVRkRlRUlzUzBGQlN5eFJRVUZSTzBGQlFVRXNVVUZEWWl4TFFVRkxMRkZCUVZFc1NVRkJTVHRCUVVGQkxGRkJRMnBDTzBGQlFVRXNUVUZEUml4RlFVRlBPMEZCUVVFc1VVRkRUQ3hOUVVGTkxGbEJRVmtzVVVGQlVTeGpRVUZwUWp0QlFVRkJMRkZCUXpORExGVkJRVlVzVVVGQlVTeEpRVUZKTzBGQlFVRXNVVUZEZEVJc1RVRkJUU3hMUVVGTExFdEJRVXNzVjBGQlZ5eFBRVUZQTEUxQlFVMHNRMEZCVVR0QlFVRkJPMEZCUVVFN1FVRkJRU3hQUVVkb1JEdEJRVUZCTEZkQlEwa3NTMEZCU1N4SFFVRXJRanRCUVVGQkxGRkJRM1pETEVsQlFVa3NWMEZCVnp0QlFVRkJMRlZCUVZjc1QwRkJUeXhGUVVGRkxFMUJRVTBzVFVGQlRTeFBRVUZQTEV0QlFVczdRVUZCUVN4UlFVTXpSQ3hKUVVGSkxFMUJRVTBzVjBGQlZ5eEhRVUZITzBGQlFVRXNWVUZEZEVJc1RVRkJUU3haUVVGWkxGRkJRVkVzWTBGQmFVSTdRVUZCUVN4VlFVTXpReXhOUVVGTkxFdEJRVXNzUzBGQlN5eFhRVUZYTEU5QlFVOHNTMEZCU3l4RFFVRlJPMEZCUVVFc1VVRkRha1E3UVVGQlFTeFJRVU5CTEUxQlFVMHNUMEZCVHl4TlFVRk5MRWRCUVVjc1EwRkJRenRCUVVGQkxGRkJRM1pDTEUxQlFVMHNVMEZCVXl4TlFVRk5MRXRCUVVzN1FVRkJRU3hSUVVNeFFpeE5RVUZOTEUxQlFVMDdRVUZCUVN4UlFVTmFMRTlCUVU4c1JVRkJSU3hOUVVGTkxGZEJRVmNzVjBGQlZ5eFBRVUZQTEU5QlFVODdRVUZCUVR0QlFVRkJMRmRCUlM5RExFOUJRVTBzUjBGQmEwTTdRVUZCUVN4UlFVTTFReXhUUVVGVE8wRkJRVUVzVVVGRFZDeFhRVUZYTEZGQlFWRXNUMEZCVHp0QlFVRkJMRlZCUTNoQ0xFdEJRVXNzVVVGQlVUdEJRVUZCTEZWQlEySXNTMEZCU3l4UlFVRlJMRk5CUVZNN1FVRkJRU3hSUVVONFFqdEJRVUZCTEZGQlEwRXNUMEZCVHl4RlFVRkZMRTFCUVUwc1RVRkJUU3hQUVVGUExFdEJRVXM3UVVGQlFUdEJRVUZCTEZkQlJUZENMRTFCUVVzc1EwRkJReXhMUVVGNVF6dEJRVUZCTEZGQlEyNUVMRk5CUVZNN1FVRkJRU3hSUVVOVUxFbEJRVWtzVFVGQlRTeFhRVUZYTEVkQlFVYzdRVUZCUVN4VlFVTjBRaXhOUVVGTkxGbEJRVmtzVVVGQlVTeGpRVUZwUWp0QlFVRkJMRlZCUXpORExFMUJRVTBzUzBGQlN5eExRVUZMTEZkQlFWY3NUMEZCVHl4TFFVRkxMRU5CUVZFN1FVRkJRU3hSUVVOcVJEdEJRVUZCTEZGQlEwRXNWMEZCVnl4UlFVRlJMRTlCUVU4N1FVRkJRU3hWUVVONFFpeExRVUZMTEZGQlFWRTdRVUZCUVN4VlFVTmlMRXRCUVVzc1QwRkJUeXhIUVVGSE8wRkJRVUVzVVVGRGFrSTdRVUZCUVN4UlFVTkJMRTlCUVU4c1JVRkJSU3hOUVVGTkxFMUJRVTBzVDBGQlR5eExRVUZMTzBGQlFVRTdRVUZCUVN4SlFVVnlRenRCUVVGQkxFdEJRME1zVDBGQlR5eGpRVUZqTEVkQlFVYzdRVUZCUVN4TlFVTjJRaXhQUVVGUE8wRkJRVUU3UVVGQlFTeEZRVVZZTzBGQlFVRXNSVUZGUVN4UFFVRlBPMEZCUVVFN08wRkRjRVZVTEVsQlFVMHNWMEZCVnp0QlFVTnFRaXhKUVVGTkxHVkJRV1VzVTBGQlV6dEJRVVU1UWl4SlFVRkpMR1ZCUVdVc1NVRkJTU3hYUVVGWExFZEJRVWM3UVVGRGNrTXNTVUZCU1N4dlFrRkJiMEk3UVVGRGVFSXNTVUZCU1N4clFrRkJhMEk3UVVGRlppeFRRVUZUTEZWQlFWVXNSMEZCVnp0QlFVRkJMRVZCUTJwRExFbEJRVWtzYjBKQlFXOUNMRXRCUVVzc1MwRkJTenRCUVVGQkxFbEJRemxDTEU5QlFVOHNaMEpCUVdkQ0xGbEJRVms3UVVGQlFTeEpRVU51UXl4dlFrRkJiMEk3UVVGQlFTeEZRVU40UWp0QlFVRkJMRVZCUlVFc1RVRkJUU3hMUVVGTExFdEJRVXNzU1VGQlNTeEZRVUZGTEZOQlFWTXNSVUZCUlN4RlFVRkZMRk5CUVZNc1IwRkJSeXhIUVVGSE8wRkJRVUVzUlVGRmJFUXNTVUZCU1N4TFFVRkxPMEZCUVVFc1JVRkZWQ3hUUVVGVExFbEJRVWtzUlVGQlJ5eEpRVUZKTEVkQlFVY3NTMEZCU3p0QlFVRkJMRWxCUTNoQ0xFMUJRVTBzVTBGQlV5eFBRVUZQTEdGQlFXRXNkVUpCUVhkQ0xGbEJRVms3UVVGQlFTeEZRVU16UlR0QlFVRkJMRVZCUlVFc1RVRkJUU3hWUVVGVk8wRkJRVUVzUlVGRGFFSXNVMEZCVXl4SlFVRkpMRVZCUVVjc1NVRkJTU3hKUVVGSkxFdEJRVXM3UVVGQlFTeEpRVU42UWl4TlFVRk5MRTFCUVU4c1ZVRkJWU3hoUVVGaExITkNRVUZ6UWl4UFFVRlRPMEZCUVVFc1NVRkRia1VzVFVGQlRTeFRRVUZUTEU5QlFVOHNUVUZCVFN4WlFVRlpPMEZCUVVFc1JVRkROVU03UVVGQlFTeEZRVU5CTEU5QlFVODdRVUZCUVRzN08wRkRkRUpLTEZOQlFWTXNLMEpCUVN0Q0xFZEJRVWM3UVVGQlFTeEZRVU5vUkN4UFFVRlBPMEZCUVVFN096dEJRMmxEVkN4bFFVRnpRaXhYUVVFMlF5eERRVUZETEZkQlFUQkNMR05CUVhkRUxGTkJRVFJGTzBGQlFVRXNSVUZET1U0c1RVRkJUU3haUVVGWkxGRkJRVkVzWVVGQllTeG5RMEZCWjBNN1FVRkJRU3hGUVVOMlJTeE5RVUZOTEZWQlFWTXNUVUZCVFN4aFFVRmhMRWxCUVVrN1FVRkJRU3hGUVVWMFF5eE5RVUZOTEZWQlFWVTdRVUZCUVN4SlFVTmFMRk5CUVZNc1NVRkJTVHRCUVVGQkxFbEJRMkk3UVVGQlFTeEZRVU5LTzBGQlFVRXNSVUZGUVN4TlFVRk5MR1ZCUVdVc2JVSkJRVzFDTzBGQlFVRXNSVUZGZUVNc1NVRkJTU3hSUVVGUk8wRkJRVUVzU1VGQlZ5eFJRVUZSTEd0Q1FVRnJRaXhSUVVGUkxHdENRVUZyUWl4UlFVRlJMR3RDUVVGclFpeEpRVUZKTzBGQlFVRXNSVUZGZWtjc1RVRkJUU3hKUVVGelF6dEJRVUZCTEU5QlEzSkRPMEZCUVVFc1NVRkRTRHRCUVVGQkxFbEJRMEU3UVVGQlFTeEpRVU5CTEVsQlFVa3NZVUZCWVR0QlFVRkJMRWxCUTJwQ0xFdEJRVXNzWVVGQllUdEJRVUZCTEVsQlEyeENMRTFCUVUwc1lVRkJZVHRCUVVGQkxFbEJRMjVDTEdsQ1FVRnBRaXhoUVVGaE8wRkJRVUVzU1VGRE9VSXNhVUpCUVdsQ0xHRkJRV0U3UVVGQlFTeEpRVU01UWl4clFrRkJhMElzWVVGQllUdEJRVUZCTEVsQlF5OUNMSE5DUVVGelFpeGhRVUZoTzBGQlFVRXNSVUZEZGtNN1FVRkJRU3hGUVVWQkxFMUJRVTBzVjBGQlZ5eGxRVUZsTEZkQlFWY3NRMEZCUXp0QlFVRkJMRVZCUXpWRExFMUJRVTBzVjBGQlZ5eGxRVUZsTEZkQlFWY3NSMEZCUnl4UlFVRlJPMEZCUVVFc1JVRkhkRVFzVFVGQlRTeFJRVUZSTzBGQlFVRXNTVUZEVmp0QlFVRkJMRWxCUlVFc1NVRkJTU3hoUVVGaE8wRkJRVUVzU1VGRGFrSXNTMEZCU3l4aFFVRmhPMEZCUVVFc1NVRkRiRUlzVFVGQlRTeGhRVUZoTzBGQlFVRXNTVUZEYmtJc2FVSkJRV2xDTEdGQlFXRTdRVUZCUVN4SlFVTTVRaXhwUWtGQmFVSXNZVUZCWVR0QlFVRkJMRWxCUlRsQ08wRkJRVUVzU1VGRlFUdEJRVUZCTEVWQlEwbzdRVUZCUVN4RlFVVkJMRkZCUVZFc1RVRkJUVHRCUVVGQkxFVkJSV1FzU1VGQlNTeE5RVUZOTEZGQlFWRXNVVUZCVVN4VlFVRlZMRWRCUVVjN1FVRkJRU3hKUVVOdVF5eFhRVUZYTEdGQlFXRXNVVUZCVVN4WlFVRlpPMEZCUVVFc1RVRkRlRU1zVFVGQlRTeFZRVUZWTEV0QlFXdEVPMEZCUVVFc1NVRkRkRVU3UVVGQlFTeEZRVU5LTzBGQlFVRXNSVUZGUVN4TlFVRk5MRkZCUVZFc1NVRkJTU3hWUVVGVkxHTkJRV01zWVVGQllTeExRVUZMTEVOQlFVTTdRVUZCUVN4RlFVVTNSQ3hOUVVGTkxGbEJRVmtzVDBGQlR5eExRVUZMTEZWQlFWVXNWMEZCYTBNN1FVRkJRU3hGUVVNeFJTeE5RVUZOTEZkQlFUQkNMRlZCUVZVc1YwRkJWeXhYUVVGWExFMUJRVTBzUzBGQlN5eFZRVUZWTEZWQlFWVXNVVUZCZFVJc1NVRkJTU3hEUVVGRE8wRkJRVUVzUlVGRE0wZ3NUVUZCVFN4WlFVRlpMRU5CUVVNc1IwRkJSeXhYUVVGWExFZEJRVWNzVVVGQlVUdEJRVUZCTEVWQlF6VkRMRkZCUVZFc1NVRkJTVHRCUVVGQk8wRkJRVUVzVFVGQmIwSXNWVUZCVlN4TFFVRkxPMEZCUVVFc1MwRkJVVHRCUVVGQkxHVkJRVzFDTEZWQlFWVXNaMEpCUVdkQ08wRkJRVUVzUlVGRGNFY3NVVUZCVVN4SlFVRkpPMEZCUVVFc05rSkJRV2RETEZGQlFWRXNUVUZCVFR0QlFVRkJMRVZCUlRGRUxFOUJRVTg3UVVGQlFUczdRVU5zUjBvc1UwRkJVeXhMUVVGdFF5eERRVUZETEUxQlFYRkRPMEZCUVVFc1JVRkRka1lzVDBGQlR6dEJRVUZCT3p0QlEwMVVMR1ZCUVhOQ0xHbENRVUZwUWl4RFFVRkRMRk5CUVhkRExFOUJRWE5DT3pzN1FVTnJRblJITEZOQlFWTXNZVUZCWVN4SFFVRlhPMEZCUVVFc1JVRkROMElzVFVGQlRTeEpRVUZKTEVsQlFVazdRVUZCUVN4RlFVTmtMRTlCUVU4c1NVRkJTU3hGUVVGRkxGbEJRVmtzUzBGQlN5eFBRVUZQTEVWQlFVVXNVMEZCVXl4SlFVRkpMRU5CUVVNc1JVRkJSU3hUUVVGVExFZEJRVWNzUjBGQlJ5eExRVUZMTEU5QlFVOHNSVUZCUlN4UlFVRlJMRU5CUVVNc1JVRkJSU3hUUVVGVExFZEJRVWNzUjBGQlJ5eExRVUZMTEU5QlFVOHNSVUZCUlN4VFFVRlRMRU5CUVVNc1JVRkJSU3hUUVVGVExFZEJRVWNzUjBGQlJ5eExRVUZMTEU5QlFVOHNSVUZCUlN4WFFVRlhMRU5CUVVNc1JVRkJSU3hUUVVGVExFZEJRVWNzUjBGQlJ5eExRVUZMTEU5QlFVOHNSVUZCUlN4WFFVRlhMRU5CUVVNc1JVRkJSU3hUUVVGVExFZEJRVWNzUjBGQlJ6dEJRVUZCTzBGQlNXcFFMRWxCUVUwc2JVSkJRVzFDTEVOQlFVTXNVVUZCYzBJN1FVRkJRU3hGUVVNMVF5eEpRVUZKTEV0QlFVczdRVUZCUVN4RlFVRkxMRWxCUVVrN1FVRkJRU3hGUVVOc1FpeFJRVUZSTEVsQlFVa3NSMEZCUnl4SFFVRkhPMEZCUVVFc1JVRkRiRUlzVDBGQlR6dEJRVUZCTzBGQlIwb3NVMEZCVXl4WlFVRnZTQ3hEUVVGRExGTkJRWGRDTEUxQlFXTXNWMEZCTWtJN1FVRkJRU3hGUVVOc1RTeE5RVUZOTEZOQlFWTXNRMEZCUXp0QlFVRkJMRVZCUldoQ0xFMUJRVTBzVDBGQmJVSXNRMEZCUXp0QlFVRkJMRVZCUXpGQ0xFMUJRVTBzVDBGQk5rSXNTVUZCU1R0QlFVRkJMRVZCUlhaRExFMUJRVTBzV1VGQldTeFJRVUZSTEhGQ1FVRnhRanRCUVVGQkxFVkJReTlETEUxQlFVMHNaMEpCUVdkQ0xFTkJRVU1zUTBGQlF5eFJRVUZSTzBGQlFVRXNSVUZEYUVNc1RVRkJUU3haUVVGWkxGRkJRVkU3UVVGQlFTeEZRVVV4UWl4UFFVRlBMRWxCUVVrN1FVRkJRU3hKUVVOUU8wRkJRVUVzU1VGRFFUdEJRVUZCTEVsQlEwRXNVVUZCVVN4RFFVRkRMRmxCUVhOQ08wRkJRVUVzVFVGRE0wSXNTVUZCU1N4RFFVRkRMRkZCUVZFN1FVRkJRU3hSUVVGdlFqdEJRVUZCTEUxQlEycERMRTlCUVU4c1VVRkJVU3h0UWtGQmJVSXNVMEZCVXl4TlFVRk5MRWxCUVVrN1FVRkJRVHRCUVVGQkxFVkJSVGRFTzBGQlFVRXNSVUZGUVN4TlFVRk5MRmxCUVZrc1EwRkJReXhMUVVGaExGVkJRWGxDTzBGQlFVRXNTVUZEY2tRc1MwRkJTeXhKUVVGSkxFdEJRVXNzUzBGQlN6dEJRVUZCTzBGQlFVRXNSVUZGZGtJc1RVRkJUU3haUVVGWkxFTkJRVU1zVVVGQmEwSTdRVUZCUVN4SlFVTnFReXhKUVVGSkxFTkJRVU1zVlVGQlZTeEhRVUZITzBGQlFVRXNUVUZCUnl4UFFVRlBPMEZCUVVFc1NVRkROVUlzU1VGQlNUdEJRVUZCTEUxQlFXVXNTMEZCU3l4TFFVRkxMRU5CUVVNc1IwRkJSeXhIUVVGSExFTkJRVU03UVVGQlFTeEpRVU55UXl4SlFVRkpPMEZCUVVFc1RVRkJaMElzYTBKQlFXdENMRk5CUVZNc1JVRkJSU3hOUVVGTkxHbENRVUZwUWl4SlFVRkpMRU5CUVVNN1FVRkJRU3hKUVVNM1JTeFBRVUZQTzBGQlFVRTdRVUZCUVN4RlFVZFlMRTlCUVU4c1UwRkJVenRCUVVGQkxFVkJRMmhDTEU5QlFVOHNVMEZCVXl4SlFVRkpMRkZCUVdFc1ZVRkJWU3hIUVVGSE8wRkJRVUVzUlVGRk9VTXNUVUZCVFN4VFFVRlRPMEZCUVVFc1JVRkZaaXhQUVVGUExGRkJRVkVzUTBGQlF5eG5Ra0ZCZDBJc1YwRkJNa0lzVlVGQlZTeERRVUZETEZkQlFWY3NUVUZCVFN4WFFVRlhMRTlCUVU4c1IwRkJSenRCUVVGQkxFVkJRVXNzWlVGQlpTeEhRVUZITEUxQlFVMHNRMEZCUXp0QlFVRkJMRVZCUTJ4S0xFOUJRVThzVDBGQlR5eERRVUZETEdkQ1FVRjNRaXhYUVVFeVFpeFZRVUZWTEVOQlFVTXNWVUZCVlN4TlFVRk5MRmRCUVZjc1QwRkJUeXhIUVVGSE8wRkJRVUVzUlVGQlN5eGxRVUZsTEVkQlFVY3NUVUZCVFN4RFFVRkRPMEZCUVVFc1JVRkRhRW9zVDBGQlR5eFBRVUZQTEVOQlFVTXNaMEpCUVhkQ0xGZEJRVEpDTEZWQlFWVXNRMEZCUXl4VlFVRlZMRTFCUVUwc1YwRkJWeXhQUVVGUExFZEJRVWM3UVVGQlFTeEZRVUZMTEdWQlFXVXNSMEZCUnl4TlFVRk5MRU5CUVVNN1FVRkJRU3hGUVVOb1NpeFBRVUZQTEZGQlFWRXNRMEZCUXl4blFrRkJkMElzVjBGQk1rSXNWVUZCVlN4RFFVRkRMRmRCUVZjc1RVRkJUU3hYUVVGWExFOUJRVThzUjBGQlJ6dEJRVUZCTEVWQlFVc3NaVUZCWlN4SFFVRkhMRTFCUVUwc1EwRkJRenRCUVVGQkxFVkJRMnhLTEU5QlFVOHNWVUZCVlN4RFFVRkRMR2RDUVVGM1FpeFhRVUV5UWl4VlFVRlZMRU5CUVVNc1lVRkJZU3hOUVVGTkxGZEJRVmNzVDBGQlR5eEhRVUZITzBGQlFVRXNSVUZCU3l4bFFVRmxMRWRCUVVjc1RVRkJUU3hEUVVGRE8wRkJRVUVzUlVGRGRFb3NUMEZCVHl4WFFVRlhMRU5CUVVNc1owSkJRWGRDTEZkQlFUSkNMRlZCUVZVc1EwRkJReXhqUVVGakxFMUJRVTBzVjBGQlZ5eFBRVUZQTEVkQlFVYzdRVUZCUVN4RlFVRkxMR1ZCUVdVc1IwRkJSeXhOUVVGTkxFTkJRVU03UVVGQlFTeEZRVVY0U2l4UFFVRlBPMEZCUVVFN08wRkRha1ZLTEZOQlFWTXNWVUZCVlN4SFFVRmpPMEZCUVVFc1JVRkRkRU1zVFVGQlRTeHBRa0ZCYVVJN1FVRkJRU3hKUVVOeVFpeGhRVUZoTzBGQlFVRXNTVUZEWWl4UlFVRlJMRU5CUVVNN1FVRkJRU3hKUVVOVUxFbEJRVWtzUTBGQlF5eFRRVUYxUXp0QlFVRkJMRTFCUXpGRExHVkJRV1VzVDBGQlR5eExRVUZMTEU5QlFVODdRVUZCUVN4TlFVTnNReXhQUVVGUE8wRkJRVUU3UVVGQlFTeFRRVVZJTEVsQlFVY3NSMEZCUnp0QlFVRkJMRTFCUTFZc1NVRkJTU3hSUVVGUkxFTkJRVU03UVVGQlFTeE5RVU5pTEZkQlFWY3NVVUZCVVN4bFFVRmxMRkZCUVZFN1FVRkJRU3hSUVVONFF5eFJRVUZSTEV0QlFVc3NWVUZCVnl4TlFVRk5MRXRCUVVzc1MwRkJTeXhGUVVGSE8wRkJRVUVzVFVGRE4wTTdRVUZCUVN4TlFVTkJMRTFCUVUwc1UwRkJNa0lzUTBGQlF6dEJRVUZCTEUxQlEyeERMRmRCUVZjc1QwRkJUeXhQUVVGUE8wRkJRVUVzVVVGRGRrSXNUVUZCVFN4UlFVRlRMRTFCUVdNN1FVRkJRU3hSUVVNM1FpeEpRVUZKTEVOQlFVTXNTVUZCU1N4WFFVRlhMRWRCUVVjN1FVRkJRU3hWUVVGSExFOUJRVThzVDBGQlR6dEJRVUZCTEUxQlF6RkRPMEZCUVVFc1RVRkRRU3hQUVVGUE8wRkJRVUU3UVVGQlFTeEZRVVZZTzBGQlFVRXNSVUZEUVN4UFFVRlBPMEZCUVVFN08wRkRiRU5HTEUxQlFVMHNTMEZCVVR0QlFVRkJMRVZCUTFRN1FVRkJRU3hGUVVOQk8wRkJRVUVzUlVGRlVpeFhRVUZYTEVkQlFVYzdRVUZCUVN4SlFVTldMRXRCUVVzc1QwRkJUeXhKUVVGSk8wRkJRVUVzU1VGRGFFSXNTMEZCU3l4UlFVRlJMRWxCUVVrN1FVRkJRVHRCUVVGQkxFVkJSM0pDTEVkQlFVY3NRMEZCUXl4TlFVRmpMRTlCUVdkQ08wRkJRVUVzU1VGRE9VSXNUVUZCVFN4UlFVRlJMRXRCUTFRc1VVRkJVU3hqUVVGakxFVkJRVVVzUlVGRGVFSXNUVUZCVFN4SFFVRkhMRVZCUTFRc1QwRkJUeXhEUVVGRExFMUJRVTBzVFVGQlRTeEZRVUZGTzBGQlFVRXNTVUZETTBJc1NVRkJTU3hqUVVGakxFdEJRVXM3UVVGQlFTeEpRVU4yUWl4SlFVRkpMRTFCUVUwc1YwRkJWeXhIUVVGSE8wRkJRVUVzVFVGRGNFSXNXVUZCV1N4UlFVRlJPMEZCUVVFc1RVRkRjRUlzUzBGQlN5eE5RVUZOTEVsQlFVa3NUVUZCVFN4TFFVRkxPMEZCUVVFc1RVRkRNVUk3UVVGQlFTeEpRVU5LTzBGQlFVRXNTVUZEUVN4WFFVRlhMRk5CUVZFc1QwRkJUenRCUVVGQkxFMUJRM1JDTEVsQlFVa3NRMEZCUXl4WlFVRlpMRk5CUVZNc1NVRkJTU3hMUVVGSkxFZEJRVWM3UVVGQlFTeFJRVU5xUXl4WlFVRlpMRk5CUVZNc1NVRkJTU3hQUVVGTkxFbEJRVWtzVVVGQlZUdEJRVUZCTEUxQlEycEVPMEZCUVVFc1RVRkRRU3hqUVVGakxGbEJRVmtzVTBGQlV5eEpRVUZKTEV0QlFVazdRVUZCUVN4SlFVTXZRenRCUVVGQkxFbEJRMEVzV1VGQldTeFJRVUZSTzBGQlFVRXNTVUZEY0VJc1MwRkJTeXhOUVVGTkxFbEJRVWtzVFVGQlRTeExRVUZMTzBGQlFVRTdRVUZCUVN4RlFVYzVRaXhIUVVGSExFTkJRVU1zVFVGQmQwSTdRVUZCUVN4SlFVTjRRaXhOUVVGTkxGTkJRVk1zUzBGQlN5eE5RVUZOTEVsQlFVa3NTVUZCU1R0QlFVRkJMRWxCUTJ4RExFbEJRVWtzVjBGQlZ6dEJRVUZCTEUxQlFWY3NUMEZCVHp0QlFVRkJMRWxCUldwRExFMUJRVTBzVVVGQlVTeExRVU5VTEZGQlFWRXNZMEZCWXl4RlFVRkZMRVZCUTNoQ0xFMUJRVTBzUjBGQlJ5eEZRVU5VTEU5QlFVOHNRMEZCUXl4TlFVRk5MRTFCUVUwc1JVRkJSVHRCUVVGQkxFbEJRek5DTEVsQlFVa3NZMEZCWXl4TFFVRkxPMEZCUVVFc1NVRkRka0lzVjBGQlZ5eFRRVUZSTEU5QlFVODdRVUZCUVN4TlFVTjBRaXhKUVVGSkxFTkJRVU1zV1VGQldTeFRRVUZUTEVsQlFVa3NTMEZCU1N4SFFVRkhPMEZCUVVFc1VVRkRha01zVDBGQlR6dEJRVUZCTEUxQlExZzdRVUZCUVN4TlFVTkJMR05CUVdNc1dVRkJXU3hUUVVGVExFbEJRVWtzUzBGQlNUdEJRVUZCTEVsQlF5OURPMEZCUVVFc1NVRkRRU3hOUVVGTkxGTkJRVk1zV1VGQldUdEJRVUZCTEVsQlF6TkNMRWxCUVVrc1YwRkJWenRCUVVGQkxFMUJRVTBzUzBGQlN5eE5RVUZOTEVsQlFVa3NUVUZCVFN4TlFVRk5PMEZCUVVFc1NVRkRhRVFzVDBGQlR6dEJRVUZCTzBGQlFVRXNSVUZIV0N4VlFVRlZMRU5CUVVNc1QwRkJNa0k3UVVGQlFTeEpRVU5zUXl4SlFVRkpMR05CUVdNc1MwRkJTenRCUVVGQkxFbEJRM1pDTEZkQlFWY3NVMEZCVVN4UFFVRlBPMEZCUVVFc1RVRkRkRUlzU1VGQlNTeERRVUZETEZsQlFWa3NVMEZCVXl4SlFVRkpMRXRCUVVrN1FVRkJRU3hSUVVGSExFOUJRVTg3UVVGQlFTeE5RVU0xUXl4alFVRmpMRmxCUVZrc1UwRkJVeXhKUVVGSkxFdEJRVWs3UVVGQlFTeEpRVU12UXp0QlFVRkJMRWxCUTBFc1QwRkJUeXhaUVVGWk8wRkJRVUU3UVVGQlFTeEZRVWQyUWl4SFFVRkhMRU5CUVVNc1RVRkJkVUk3UVVGQlFTeEpRVU4yUWl4UFFVRlBMRXRCUVVzc1NVRkJTU3hKUVVGSkxFMUJRVTA3UVVGQlFUdEJRVVZzUXp0QlFVRkJPMEZCUlVFc1RVRkJUU3hUUVVGWk8wRkJRVUVzUlVGRFpEdEJRVUZCTEVWQlEwRTdRVUZCUVN4RlFVVkJMRmRCUVZjc1IwRkJSenRCUVVGQkxFbEJRMVlzUzBGQlN5eFhRVUZYTEVsQlFVazdRVUZCUVN4SlFVTndRaXhMUVVGTExGRkJRVkU3UVVGQlFUdEJRVVZ5UWpzN08wRkRkRVZQTEZOQlFWTXNaMEpCUVdkQ0xFTkJRVU1zVFVGQk9FSXNVVUZCWjBRN1FVRkJRU3hGUVVNelJ5eE5RVUZOTEZOQlFXbERMRU5CUVVNN1FVRkJRU3hGUVVONFF5eEpRVUZKTEUxQlFVMDdRVUZCUVN4SlFVRnJRaXhQUVVGUExHdERRVUZyUXl4TFFVRkxMR2xDUVVGcFFpeExRVUZMTEVsQlFVazdRVUZCUVN4RlFVTndSeXhKUVVGSkxFMUJRVTA3UVVGQlFTeEpRVUZyUWl4UFFVRlBMR3REUVVGclF5eExRVUZMTEdsQ1FVRnBRaXhMUVVGTExFbEJRVWs3UVVGQlFTeEZRVU53Unl4SlFVRkpMRTFCUVUwc1pVRkJaVHRCUVVGQkxFbEJRVmNzVDBGQlR5dzBRa0ZCTkVJc1QwRkJUeXhMUVVGTExGVkJRVlU3UVVGQlFTeEZRVU0zUml4SlFVRkpMRTFCUVUwc2JVSkJRVzFDTEV0QlFVc3NaMEpCUVdkQ0xGTkJRVk1zUjBGQlJ6dEJRVUZCTEVsQlF6RkVMRTFCUVUwc1lVRkJZU3hMUVVGTExHZENRVUZuUWl4VFFVRlRMRWRCUVVjN1FVRkJRU3hKUVVOd1JDeEpRVUZKTEV0QlFVc3NjMEpCUVhOQ08wRkJRVUVzVFVGSE0wSXNTVUZCU1N4WFFVRlhMR05CUVdNc1MwRkJTeXhuUWtGQlowSXNVMEZCVXl4TlFVRk5MRWxCUVVrN1FVRkJRU3hSUVVOcVJTeFBRVUZQTEdsRFFVRnBRenRCUVVGQkxGRkJRM2hETEU5QlFVOHNWVUZCVlR0QlFVRkJMRkZCUTJwQ0xFOUJRVThzYzBOQlFYTkRPMEZCUVVFc1RVRkRha1E3UVVGQlFTeEpRVU5LTEVWQlFVODdRVUZCUVN4TlFVTklMRWxCUVVrc1dVRkJXVHRCUVVGQkxGRkJRMW9zVDBGQlR5eHBRMEZCYVVNN1FVRkJRU3hOUVVNMVF5eEZRVUZQTEZOQlFVa3NWVUZCVlN4TFFVRkxMR2RDUVVGblFpeFRRVUZUTEUxQlFVMHNSMEZCUnp0QlFVRkJMRkZCUTNoRUxFOUJRVThzYVVOQlFXbERPMEZCUVVFc1VVRkRlRU1zVDBGQlR5eFZRVUZWTzBGQlFVRXNUVUZEY2tJN1FVRkJRVHRCUVVGQkxFVkJSVkk3UVVGQlFTeEZRVU5CTEVsQlFVa3NUVUZCVFN4eFFrRkJjVUlzUzBGQlN5eHJRa0ZCYTBJc1UwRkJVenRCUVVGQkxFbEJRVWNzVDBGQlR5eHRRMEZCYlVNc1MwRkJTeXhyUWtGQmEwSXNTMEZCU3l4SlFVRkpPMEZCUVVFc1JVRkROVWtzVDBGQlR6dEJRVUZCT3pzN1FVTXpRa29zVTBGQlV5eHBRa0ZCYVVJc1EwRkJReXhYUVVGMVF6dEJRVUZCTEVWQlEzWkZMRTFCUVUwc1VVRkJVU3hQUVVGUExHTkJRV01zVjBGQlZ5eFpRVUZaTzBGQlFVRXNSVUZETVVRc1QwRkJUeXhOUVVGTkxGRkJRVkVzYlVKQlFXMUNMRVZCUVVVN1FVRkJRVHM3TzBGRGEwSnlReXhUUVVGVExHTkJRV01zUTBGQlF5eFhRVUV3UWl4VFFVRmpMRlZCUVRaRE8wRkJRVUVzUlVGRGFFZ3NUVUZCVFN4UFFVRlBMRkZCUVZFN1FVRkJRU3hGUVVOeVFpeE5RVUZOTEU5QlFVOHNTVUZCU1R0QlFVRkJMRVZCUldwQ0xFMUJRVTBzVDBGQmJVSXNSVUZCUlN4clFrRkJhMElzUTBGQlF5eFJRVUZSTEZOQlFWTXNSMEZCUnl4clFrRkJhMElzUTBGQlF5eG5Ra0ZCWjBJc1pVRkJaU3hIUVVGSExGbEJRVmtzVFVGQlRTeFJRVUZSTEUxQlFVMHNTMEZCU3p0QlFVRkJMRVZCUXpWS0xFMUJRVTBzYlVKQlFXMUNMRWxCUVVrN1FVRkJRU3hGUVVNM1FpeE5RVUZOTERoQ1FVRTRRanRCUVVGQkxFVkJRM0JETEUxQlFVMHNhVUpCUVdsQ0xFTkJRVU1zVjBGQmEwUTdRVUZCUVN4SlFVTjBSU3hOUVVGTkxFMUJRVTBzVlVGQlZUdEJRVUZCTEVsQlEzUkNMRWxCUVVrc1UwRkJVeXhwUWtGQmFVSXNTVUZCU1N4SFFVRkhPMEZCUVVFc1NVRkRja01zU1VGQlNTeFhRVUZYTzBGQlFVRXNUVUZCVnl4UFFVRlBPMEZCUVVFc1NVRkRha01zU1VGQlNTeHBRa0ZCYVVJc1VVRkJVVHRCUVVGQkxFMUJRVFpDTEdsQ1FVRnBRaXhOUVVGTk8wRkJRVUVzU1VGRGFrWXNVMEZCVXl4cFFrRkJhVUlzVFVGQlRTeE5RVUZOTzBGQlFVRXNTVUZEZEVNc2FVSkJRV2xDTEVsQlFVa3NTMEZCU3l4TlFVRk5PMEZCUVVFc1NVRkRhRU1zVDBGQlR6dEJRVUZCTzBGQlFVRXNSVUZIV0N4TlFVRk5MSGxDUVVGcFJEdEJRVUZCTEVsQlEyNUVMR2xDUVVGcFFqdEJRVUZCTEVsQlEycENMR2RDUVVGblFqdEJRVUZCTEVWQlEzQkNPMEZCUVVFc1JVRkZRU3hOUVVGTkxIVkNRVUVyUXl4TFFVRkxMR1ZCUVdVc1NVRkJTU3hOUVVGTkxIVkNRVUYxUWp0QlFVRkJMRVZCUnpGSExFMUJRVTBzYjBKQlFXOUNPMEZCUVVFc1JVRkRNVUlzVFVGQlRTeGxRVUZsTzBGQlFVRXNSVUZEY2tJc1RVRkJUU3hYUVVGWE8wRkJRVUVzUlVGRmFrSXNUVUZCVFN4dFFrRkJiVUlzUlVGQlJTeE5RVUZOTEVsQlFVa3NVVUZCVVN4TFFVRkxMRk5CUVZNc2NVSkJRWEZDTzBGQlFVRXNSVUZIYUVZc1NVRkJTU3gxUWtGQmRVSTdRVUZCUVN4RlFVTXpRaXhKUVVGSkxEQkNRVUV3UWp0QlFVRkJMRVZCUXpsQ0xFMUJRVTBzYzBKQlFYTkNMRTFCUVdVN1FVRkJRU3hKUVVOMlF5eE5RVUZOTEVsQlFVa3NVVUZCVVR0QlFVRkJMRWxCUTJ4Q0xFbEJRVWtzVFVGQlRTeDVRa0ZCZVVJN1FVRkJRU3hOUVVNdlFpd3dRa0ZCTUVJN1FVRkJRU3hOUVVNeFFpeDFRa0ZEU1N4RFFVRkRMRkZCUVZFc2JVSkJRVzFDTEhOQ1FVRnpRaXhMUVVOc1JDeERRVUZETEZGQlFWRXNiVUpCUVcxQ0xIRkNRVUZ4UWl4TFFVTnFSQ3hEUVVGRExGRkJRVkVzYlVKQlFXMUNMRzlDUVVGdlFpeExRVU5vUkN4RFFVRkRMRkZCUVZFc2JVSkJRVzFDTEhGQ1FVRnhRaXhMUVVOcVJDeERRVUZETEZGQlFWRXNiVUpCUVcxQ0xIRkNRVUZ4UWp0QlFVRkJMRWxCUTNwRU8wRkJRVUVzU1VGRFFTeFBRVUZQTzBGQlFVRTdRVUZCUVN4RlFVVllMRTFCUVUwc2QwSkJRWGRDTEVOQlFVTXNRMEZCUXl4UlFVRlJPMEZCUVVFc1JVRkhlRU1zVFVGQlRTeGhRVUZ4UWp0QlFVRkJMRWxCUTNaQ0xFZEJRVWNzUlVGQlJTeE5RVUZOTEVOQlFVTXNSMEZCVlN4TlFVRk5MRWxCUVVrc1MwRkJkMElzVVVGQlVTeE5RVUZOTEVkQlFVazdRVUZCUVN4SlFVTXhSU3hSUVVGUkxFMUJRVTA3UVVGQlFTeEpRVU5rTEZGQlFWRXNTVUZCU1N4VlFVRmxMRU5CUVVNN1FVRkJRU3hKUVVNMVFpeFBRVUZQTEVOQlFVTXNhVUpCUVhsQ0xHRkJRVFpDTEVOQlFVTTdRVUZCUVN4SlFVTXZSQ3hOUVVGTkxFTkJRVU1zYVVKQlFYbENMR0ZCUVRaQ0xFTkJRVU03UVVGQlFTeEpRVU01UkN4TlFVRk5MRU5CUVVNc2FVSkJRWGxDTEdGQlFUWkNMRU5CUVVNN1FVRkJRU3hKUVVNNVJDeFBRVUZQTEVOQlFVTXNhVUpCUVhsQ0xHRkJRVFpDTEVOQlFVTTdRVUZCUVN4SlFVTXZSQ3hUUVVGVExFTkJRVU1zYVVKQlFYbENMR0ZCUVRaQ0xFTkJRVU03UVVGQlFTeEpRVU5xUlN4VlFVRlZMRU5CUVVNc2FVSkJRWGxDTEdGQlFUWkNMRU5CUVVNN1FVRkJRU3hGUVVOMFJUdEJRVUZCTEVWQlNVRXNUVUZCVFN4dFFrRkJkMEk3UVVGQlFTeEpRVU14UWp0QlFVRkJMRWxCUTBFc1UwRkJVeXhSUVVGUk8wRkJRVUVzU1VGRGFrSXNVVUZCVVR0QlFVRkJMRWxCUTFJc1RVRkJUU3hSUVVGUk8wRkJRVUVzU1VGRFpDeHBRa0ZCYVVJc1VVRkJVVHRCUVVGQkxFbEJRM3BDTEdsQ1FVRnBRaXhSUVVGUk8wRkJRVUVzU1VGRGVrSXNVVUZCVVN4UlFVRlJMRkZCUVZFN1FVRkJRU3hKUVVONFFpeFBRVUZQTEZWQlFWVTdRVUZCUVN4SlFVTnFRaXhYUVVGWExFMUJRVTA3UVVGQlFTeEpRVU5xUWl4SFFVRkhPMEZCUVVFc1NVRkRTQ3hKUVVGSkxFTkJRVU1zVVVGQllTeEhRVUZSTzBGQlFVRXNUVUZCUlN4UFFVRlBMRk5CUVZNc1QwRkJUeXhOUVVGTkxGRkJRVkVzUTBGQlF6dEJRVUZCTzBGQlFVRXNSVUZEZEVVN1FVRkJRU3hGUVVkQkxFbEJRVWtzYjBKQlFYbENPMEZCUVVFc1JVRkROMElzU1VGQlNTeHRRa0ZCYTBNN1FVRkJRU3hGUVVWMFF5eEpRVUZKTEhWQ1FVRTBRanRCUVVGQkxFVkJRMmhETEVsQlFVa3NaMEpCUVhGQ08wRkJRVUVzUlVGRGVrSXNTVUZCU1N4MVFrRkJaME03UVVGQlFTeEZRVVZ3UXl4TlFVRk5MRkZCUVZFc1QwRkJUeXhaUVUxSk8wRkJRVUVzU1VGRGNrSXNUVUZCVFN4blFrRkJaMElzUzBGQlN5eFBRVUZQTzBGQlFVRXNTVUZEYkVNc1RVRkJUU3hYUVVGWExFMUJRVTBzVDBGQlR5eHhRa0ZCY1VJc1JVRkJSU3hoUVVGaExHTkJRV01zUTBGQlF6dEJRVUZCTEVsQlEycEdMRTFCUVUwc1pVRkJaU3haUVVFMlFqdEJRVUZCTEUxQlF6bERMRTFCUVUwc1ZVRkJWeXhSUVVGUkxGRkJRV2RDTzBGQlFVRXNUVUZEZWtNc1NVRkJTU3haUVVGWkxGZEJRVmM3UVVGQlFTeFJRVU4yUWl4SlFVRkpMRTlCUVU4c1dVRkJXU3haUVVGWkxGRkJRVkVzVTBGQlV6dEJRVUZCTEZWQlFXVXNUVUZCVFN4VFFVRlRPMEZCUVVFc1VVRkRiRVlzVDBGQlR6dEJRVUZCTEUxQlExZzdRVUZCUVN4TlFVTkJMRTFCUVUwc1owSkJRV2RDTEU5QlFVOHNVVUZCVVN4UlFVRlJMRkZCUVZFc1NVRkJTU3huUWtGQlowSXNTMEZCU3l4SFFVRkhPMEZCUVVFc1RVRkRha1lzU1VGQlNTeFBRVUZQTEZOQlFWTXNZVUZCWVN4TFFVRkxMR2RDUVVGblFqdEJRVUZCTEZGQlFXVXNUVUZCVFN4VFFVRlRPMEZCUVVFc1RVRkRjRVlzU1VGQlNTeERRVUZETEZGQlFWRXNVVUZCVVR0QlFVRkJMRkZCUVUwc1QwRkJUenRCUVVGQkxFMUJRMnhETEUxQlFVMHNVMEZCVXl4UlFVRlJMRkZCUVZFc1MwRkJTeXhWUVVGVk8wRkJRVUVzVFVGRE9VTXNUVUZCVFN4VlFVRlZMRWxCUVVrN1FVRkJRU3hOUVVOd1FpeEpRVUZKTEU5QlFVODdRVUZCUVN4TlFVTllMRWxCUVVrN1FVRkJRU3hSUVVOQkxFOUJRVThzVFVGQlRUdEJRVUZCTEZWQlExUXNVVUZCVVN4TlFVRk5MRlZCUVZVc1RVRkJUU3hQUVVGUExFdEJRVXM3UVVGQlFTeFZRVU14UXl4SlFVRkpPMEZCUVVFc1dVRkJUVHRCUVVGQkxGVkJRMVlzVVVGQlVTeFJRVUZSTEU5QlFVOHNUMEZCVHl4RlFVRkZMRkZCUVZFc1MwRkJTeXhEUVVGRE8wRkJRVUVzVlVGRE9VTXNTVUZCU1N4TFFVRkxMRk5CUVZNc1pVRkJaVHRCUVVGQkxGbEJRemRDTEUxQlFVMHNUMEZCVHl4UFFVRlBMRVZCUVVVc1RVRkJUU3hOUVVGTkxFVkJRVVU3UVVGQlFTeFpRVU53UXl4TlFVRk5MRk5CUVZNN1FVRkJRU3hWUVVOdVFqdEJRVUZCTEZGQlEwbzdRVUZCUVN4UlFVTkJMRkZCUVZFc1VVRkJVU3hQUVVGUE8wRkJRVUVzWjBKQlEzcENPMEZCUVVFc1VVRkRSU3hQUVVGUExGbEJRVms3UVVGQlFUdEJRVUZCTEUxQlJYWkNMRTlCUVU4N1FVRkJRVHRCUVVGQkxFbEJTVmdzVFVGQlRTeFRRVUZWTEZGQlFWRXNVVUZCWjBJc1dVRkJXU3hSUVVGUkxGRkJRVkVzVVVGQlVTeEpRVUZKTEZGQlFWRTdRVUZCUVN4SlFVVjRSaXhKUVVGSkxGRkJRVkVzVVVGQlVTeFhRVUZYTEZkQlFWYzdRVUZCUVN4TlFVTjBReXhQUVVGUExFbEJRVWtzVTBGQlV5eFhRVUZYTzBGQlFVRXNVVUZETTBJc1UwRkJVeXhsUVVGbExFMUJRVTA3UVVGQlFTeE5RVU5zUXl4RFFVRkRPMEZCUVVFc1NVRkRURHRCUVVGQkxFbEJSMEVzVFVGQlRTeFhRVUZaTEZGQlFWRXNVVUZCWjBJc1kwRkJZeXhKUVVGSkxFbEJRVWtzVVVGQlVTeFJRVUZSTEVkQlFVY3NSVUZCUlR0QlFVRkJMRWxCUTNKR0xFbEJRVWtzVTBGQlV5eFRRVUZUTEdWQlFXVXNSMEZCUnp0QlFVRkJMRTFCUTNCRExFMUJRVTBzWlVGQll5eGxRVUZsTEUxQlFVMDdRVUZCUVN4TlFVTjZReXhQUVVGUExFbEJRVWtzVTBGQlV5eE5RVUZOTzBGQlFVRXNVVUZEZEVJc1VVRkJVVHRCUVVGQkxGRkJRMUlzVTBGQlV6dEJRVUZCTEZWQlEwd3NVVUZCVVR0QlFVRkJMR0ZCUTB3N1FVRkJRU3hWUVVOSUxHbENRVUZwUWp0QlFVRkJMRlZCUTJwQ0xHZENRVUZuUWl4dlFrRkJiMElzUzBGQlN5eEpRVUZKTzBGQlFVRXNVVUZEYWtRN1FVRkJRU3hOUVVOS0xFTkJRVU03UVVGQlFTeEpRVU5NTzBGQlFVRXNTVUZGUVN4TlFVRk5MR1ZCUVdkQ0xGRkJRVkVzVVVGQlowSTdRVUZCUVN4SlFVTTVReXhKUVVGSk8wRkJRVUVzU1VGRFNpeEpRVUZKTzBGQlFVRXNTVUZEU2l4SlFVRkpMRU5CUVVNc1VVRkJVU3hqUVVGakxFTkJRVU1zVVVGQlVTeHRRa0ZCYlVJc1VVRkJVU3h2UWtGQmIwSXNTVUZCU1R0QlFVRkJMRTFCUTI1R0xHRkJRV0U3UVVGQlFTeE5RVU5pTEZsQlFWa3NaMEpCUVdkQ0xGTkJRVk1zVlVGQlZTeERRVUZETEVWQlFVVXNUVUZCVFN4SFFVRkhPMEZCUVVFc1NVRkRMMFFzUlVGQlR6dEJRVUZCTEUxQlEwZ3NXVUZCV1N4blFrRkJaMElzVTBGQlV5eFZRVUZWTEVOQlFVTXNSVUZCUlN4TlFVRk5MRWRCUVVjN1FVRkJRU3hOUVVNelJDeEpRVUZKTEZGQlFWRXNZVUZCWVN4VlFVRlZMRWRCUVVjc1EwRkJReXhOUVVGTkxGRkJRVkVzVjBGQlZ6dEJRVUZCTEZGQlF6VkVMRTFCUVUwc1pVRkJZeXhsUVVGbExFMUJRVTA3UVVGQlFTeFJRVU42UXl4SlFVRkpMRkZCUVZFN1FVRkJRU3hWUVVGaExFOUJRVThzUlVGQlJTeGxRVUZsTEUxQlFVMHNUVUZCVFN4SlFVRkpMRkZCUVZFc1MwRkJTeXhUUVVGVExHRkJRVms3UVVGQlFTeFJRVU51Unl4UFFVRlBMRWxCUVVrc1UwRkJVeXhYUVVGWE8wRkJRVUVzVlVGRE0wSXNVVUZCVVR0QlFVRkJMRlZCUTFJc1UwRkJVenRCUVVGQkxGRkJRMklzUTBGQlF6dEJRVUZCTEUxQlEwdzdRVUZCUVN4TlFVTkJMRWxCUVVrc1VVRkJVU3h2UWtGQmIwSXNZVUZCWVN4UlFVRlJMRzlDUVVGdlFqdEJRVUZCTEZGQlFVY3NXVUZCV1N4VlFVRlZMRTFCUVUwc1VVRkJVU3hsUVVGbE8wRkJRVUVzVFVGREwwZ3NZVUZCWVN4SlFVRkpMRlZCUVZVc1MwRkJTeXhIUVVGSE8wRkJRVUU3UVVGQlFTeEpRVWwyUXl4TlFVRk5MRmRCUVZrc1VVRkJVU3hSUVVGblFqdEJRVUZCTEVsQlF6RkRMRTFCUVUwc1MwRkJTeXhSUVVGUkxGTkJRVk1zVVVGQlVTeFBRVUZQTEZGQlFWRXNVVUZCVVN4UFFVRlBMRWxCUVVrN1FVRkJRU3hKUVVkMFJTeEpRVUZKTEZGQlFWRXNXVUZCV1N4VlFVRlZMRmRCUVZjc1YwRkJWeXhWUVVGVkxFZEJRVWM3UVVGQlFTeE5RVU5xUlN4TlFVRk5MR0ZCUVdFc2JVSkJRVzFDTEZkQlFWY3NUVUZCVFN4RFFVRkRMRU5CUVVNN1FVRkJRU3hOUVVONlJDeEpRVUZKTzBGQlFVRXNUVUZEU2l4SlFVRkpPMEZCUVVFc1VVRkZRU3hKUVVGSkxFOUJRVThzVTBGQlV5eGhRVUZoTzBGQlFVRXNWVUZETjBJc1dVRkJXU3hMUVVGTExGVkJRVlU3UVVGQlFTeFJRVU12UWl4RlFVRlBMRk5CUVVrc1QwRkJUeXhYUVVGWExHRkJRV0U3UVVGQlFTeFZRVU4wUXl4WlFVRlpMRTlCUVU4c1MwRkJTeXhaUVVGWkxGRkJRVkVzUlVGQlJTeFRRVUZUTzBGQlFVRXNVVUZETTBRc1JVRkJUenRCUVVGQkxGVkJRMGdzVFVGQlRTeEpRVUZKTEUxQlFVMHNOa0pCUVRaQ08wRkJRVUU3UVVGQlFTeFJRVVZ1UkN4TlFVRk5PMEZCUVVFc1VVRkRTaXhOUVVGTkxHVkJRV01zWlVGQlpTeE5RVUZOTzBGQlFVRXNVVUZEZWtNc1RVRkJUU3hSUVVGUExFdEJRVXNzVlVGQlZTeEZRVUZGTEZOQlFWTXNUMEZCVHl4TlFVRk5MRFpDUVVFMlFpeFJRVUZSTEVWQlFVVXNWVUZCVlN3d1FrRkJNRUlzUlVGQlJTeERRVUZETzBGQlFVRXNVVUZEYkVrc1NVRkJTU3hSUVVGUk8wRkJRVUVzVlVGQllTeFBRVUZQTEVWQlFVVXNaVUZCWlN4TlFVRk5MR0ZCUVUwc1VVRkJVU3hMUVVGTExGTkJRVk1zUzBGQlN5eGpRVUZoTEdkQ1FVRm5RaXh0UWtGQmJVSXNSVUZCUlR0QlFVRkJMRkZCUXpGSkxFOUJRVThzU1VGQlNTeFRRVUZUTEU5QlFVMHNSVUZCUlN4UlFVRlJMRXRCUVVzc1UwRkJVeXhMUVVGTExHTkJRV0VzWjBKQlFXZENMRzFDUVVGdFFpeEZRVUZGTEVOQlFVTTdRVUZCUVR0QlFVRkJMRTFCUnpsSExFbEJRVWtzV1VGQmFVSTdRVUZCUVN4TlFVTnlRaXhOUVVGTkxGVkJRVlVzVFVGQlRTeGhRVUZoTzBGQlFVRXNUVUZEYmtNc1NVRkJTU3hYUVVGWExGbEJRVmtzVFVGQlRTeFpRVUZaTEUxQlFVMDdRVUZCUVN4UlFVTXZReXhKUVVGSk8wRkJRVUVzVlVGRFFTeFpRVUZaTEdkQ1FVRm5RaXhMUVVGTExFMUJRVTBzVDBGQlR5eERRVUZETzBGQlFVRXNWVUZEYWtRc1RVRkJUVHRCUVVGQkxGVkJRMG9zVFVGQlRTeGxRVUZqTEdWQlFXVXNUVUZCVFR0QlFVRkJMRlZCUTNwRExFMUJRVTBzVVVGQlR5eExRVUZMTEZWQlFWVXNSVUZCUlN4VFFVRlRMRTlCUVU4c1RVRkJUU3cyUWtGQk5rSXNVVUZCVVN4RlFVRkZMRlZCUVZVc1QwRkJUeXhGUVVGRkxFTkJRVU03UVVGQlFTeFZRVU12Unl4SlFVRkpMRkZCUVZFN1FVRkJRU3haUVVGaExFOUJRVThzUlVGQlJTeGxRVUZsTEUxQlFVMHNZVUZCVFN4UlFVRlJMRXRCUVVzc1UwRkJVeXhMUVVGTExHTkJRV0VzWjBKQlFXZENMRzFDUVVGdFFpeEZRVUZGTzBGQlFVRXNWVUZETVVrc1QwRkJUeXhKUVVGSkxGTkJRVk1zVDBGQlRTeEZRVUZGTEZGQlFWRXNTMEZCU3l4VFFVRlRMRXRCUVVzc1kwRkJZU3huUWtGQlowSXNiVUpCUVcxQ0xFVkJRVVVzUTBGQlF6dEJRVUZCTzBGQlFVRXNUVUZGYkVnN1FVRkJRU3hOUVVWQkxFMUJRVTBzWVVGQldTeFhRVUZYTzBGQlFVRXNUVUZETjBJc1RVRkJUU3hsUVVGakxHVkJRV1VzVFVGQlRUdEJRVUZCTEUxQlEzcERMRTFCUVUwc1kwRkJZeXhMUVVGTExHTkJRV0VzWjBKQlFXZENMRzlDUVVGdlFpeHBRa0ZCYVVJc1YwRkJWenRCUVVGQkxFMUJTM1JITEVsQlFVa3NZVUZCWVN4UFFVRlBMR05CUVdNc1dVRkJXU3hEUVVGRExFMUJRVTBzVVVGQlVTeFRRVUZUTEV0QlFVc3NSVUZCUlN4aFFVRmhMRmxCUVZrN1FVRkJRU3hSUVVOMFJ5eE5RVUZOTEZkQlFXVXNRMEZCUXp0QlFVRkJMRkZCUTNSQ0xGTkJRVkVzVTBGQlV6dEJRVUZCTEZGQlEycENMRk5CUVZFc1VVRkJVVHRCUVVGQkxGRkJRMmhDTEZOQlFWRXNWVUZCVlN4UlFVRlJPMEZCUVVFc1VVRkRNVUlzVTBGQlVTeFpRVUZaTzBGQlFVRXNVVUZEY0VJc1UwRkJVU3hQUVVGUE8wRkJRVUVzVVVGRFppeFRRVUZSTEU5QlFVOHNVVUZCVVR0QlFVRkJMRkZCUTNaQ0xGTkJRVkVzYTBKQlFXdENMRkZCUVZFN1FVRkJRU3hSUVVOc1F5eFRRVUZSTEd0Q1FVRnJRaXhSUVVGUk8wRkJRVUVzVVVGRGJFTXNVMEZCVVN4SlFVRkpPMEZCUVVFc1VVRkRXaXhUUVVGUkxGTkJRVk1zVVVGQlVTeFJRVUZSTzBGQlFVRXNVVUZEYWtNc1UwRkJVU3hSUVVGUkxGVkJRVlU3UVVGQlFTeFJRVU14UWl4VFFVRlJMRTlCUVU4c1EwRkJReXhSUVVGaExGZEJRV2RDTEZOQlFWTXNUMEZCVHl4VlFVRlRMRkZCUVZFc1RVRkJUVHRCUVVGQkxGRkJRM0JHTEZOQlFWRXNXVUZCV1N4TlFVRk5PMEZCUVVFc1VVRkRNVUlzVFVGQlRTeFZRVUZUTEdGQlFXRXNVMEZCVXl4WlFVRlpMRlZCUVZNN1FVRkJRU3hSUVVNeFJDeFRRVUZSTEZOQlFWTTdRVUZCUVN4UlFVTnFRaXhUUVVGUkxFOUJRVTg3UVVGQlFTeFZRVU5ZTzBGQlFVRXNWVUZEUVN4UlFVRlJMRVZCUVVVc1VVRkJVU3hYUVVGWExFbEJRVWtzVVVGQlVTeFZRVUZWTzBGQlFVRXNWVUZEYmtRc1UwRkJVeXhSUVVGUk8wRkJRVUVzVVVGRGNrSTdRVUZCUVN4UlFVTkJMRlZCUVZVc1ZVRkJWVHRCUVVGQkxGRkJSWEJDTEUxQlFVMHNiVUpCUVcxQ0xFTkJRVU1zV1VGQmNVSTdRVUZCUVN4VlFVTXpReXhKUVVGSkxGRkJRVkVzYlVKQlFXMUNMSEZDUVVGeFFpeExRVUZMTEUxQlFVMDdRVUZCUVN4WlFVTXpSQ3hQUVVGUExGRkJRVkVzUzBGQlN5eDFRa0ZCZFVJc1JVRkJSU3gxUWtGQlZ5eHBRa0ZCVVN4TlFVRk5MRmxCUVZrc1RVRkJUU3hUUVVGUkxFMUJRVTBzVTBGQlV5eFJRVUZSTEZGQlFWRXNVMEZCVXl4dFFrRkJVeXhUUVVGVExGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNWVUZETjBzN1FVRkJRVHRCUVVGQkxGRkJSMG9zU1VGQlNUdEJRVUZCTEZWQlIwRXNTVUZCU1N4UlFVRlJMRzFDUVVGdFFpeHpRa0ZCYzBJc1MwRkJTeXhOUVVGTk8wRkJRVUVzV1VGRE5VUXNUVUZCVFN4UlFVRlJMRXRCUVVzc2QwSkJRWGRDTEVWQlFVVXNkVUpCUVZjc2FVSkJRVkVzVFVGQlRTeFpRVUZaTEUxQlFVMHNRMEZCUXl4SFFVRkhMRzFDUVVGVExGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNWVUZEZUVnN1FVRkJRU3hWUVVOQkxFMUJRVTBzVVVGQlVTeExRVUZMTEZkQlFWY3NVMEZCVXp0QlFVRkJMRlZCUTNwRExFOUJRVThzVjBGQlZ6dEJRVUZCTEZWQlEyaENMRTFCUVUwc1dVRkJXU3hwUWtGQmFVSXNXVUZCVnl4VFFVRlJMRk5CUVZNN1FVRkJRU3hWUVVNdlJDeE5RVUZOTEZWQlFWVXNTMEZCU3l4VlFVRlZMRk5CUVZNN1FVRkJRU3hWUVVONFF5eEpRVUZKTzBGQlFVRXNXVUZEUVN4TlFVRk5MR2xDUVVGcFFpeExRVUZMTzBGQlFVRXNXVUZET1VJc1RVRkJUVHRCUVVGQkxGVkJRMUlzU1VGQlNTeFJRVUZSTzBGQlFVRXNXVUZCWVN4UFFVRlBMRVZCUVVVc1pVRkJaU3hOUVVGTkxFMUJRVTBzVTBGQlV5eFJRVUZSTEV0QlFVc3NVMEZCVXl4WlFVRlpPMEZCUVVFc1ZVRkRlRWNzVDBGQlR5eEpRVUZKTEZOQlFWTXNVMEZCVXl4RlFVRkZMRkZCUVZFc1MwRkJTeXhUUVVGVExGbEJRVmtzUTBGQlF6dEJRVUZCTzBGQlFVRXNVVUZIZEVVc1NVRkJTVHRCUVVGQkxGVkJRMEVzVFVGQlRTeHBRa0ZCYVVJc1NVRkJTVHRCUVVGQkxGVkJRemRDTEUxQlFVMDdRVUZCUVN4TlFVTmFMRVZCUVU4N1FVRkJRU3hSUVVOSUxFbEJRVWs3UVVGQlFTeFZRVU5CTEUxQlFVMHNVVUZCVVN4TFFVRkxMRmRCUVZjc1UwRkJVenRCUVVGQkxGVkJRM3BETEU5QlFVOHNWMEZCVnp0QlFVRkJMRlZCUTJoQ0xFMUJRVTBzV1VGQldTeHBRa0ZCYVVJc1dVRkJWeXhaUVVGWkxGTkJRVk03UVVGQlFTeFZRVU51UlN4TlFVRk5MRlZCUVZVc1MwRkJTeXhWUVVGVkxGTkJRVk03UVVGQlFTeFZRVU40UXl4SlFVRkpMRkZCUVZFN1FVRkJRU3haUVVGaExFOUJRVThzUlVGQlJTeGxRVUZsTEUxQlFVMHNUVUZCVFN4VFFVRlRMRkZCUVZFc1MwRkJTeXhUUVVGVExGbEJRVms3UVVGQlFTeFZRVU40Unl4UFFVRlBMRWxCUVVrc1UwRkJVeXhUUVVGVExFVkJRVVVzVVVGQlVTeExRVUZMTEZOQlFWTXNXVUZCV1N4RFFVRkRPMEZCUVVFN1FVRkJRVHRCUVVGQkxFMUJTVEZGTEUxQlFVMHNUMEZCVHl4WFFVRlhMRXRCUVVzc1ZVRkJWU3hoUVVGaExFTkJRVU1zUjBGQlJ5eERRVUZETEV0QlFVc3NWVUZCVlN4UlFVRlJMRmxCUVZrc1dVRkJXU3hMUVVGTExHdENRVUZyUWp0QlFVRkJMRTFCUXk5SUxFbEJRVWtzVVVGQlVUdEJRVUZCTEZGQlFXRXNUMEZCVHl4RlFVRkZMR1ZCUVdVc1RVRkJUU3hOUVVGTkxGRkJRVkVzUzBGQlN5eFRRVUZUTEZsQlFWazdRVUZCUVN4TlFVTXZSaXhQUVVGUExFbEJRVWtzVTBGQlV5eE5RVUZOTEVWQlFVVXNVVUZCVVN4TFFVRkxMRk5CUVZNc1dVRkJXU3hEUVVGRE8wRkJRVUVzU1VGRGJrVTdRVUZCUVN4SlFWRkJMRWxCUVVrc1VVRkJVU3hsUVVGbExFTkJRVU1zVlVGQlZTeHZRa0ZCYjBJc1IwRkJSenRCUVVGQkxFMUJRM3BFTEUxQlFVMHNZVUZCWXl4UlFVRlJMRkZCUVdkQ08wRkJRVUVzVFVGRE5VTXNTVUZCU1N4bFFVRmxMRTlCUVU4N1FVRkJRU3hSUVVWMFFpeEpRVUZKTEdOQlFXTXNVVUZCVVR0QlFVRkJMRkZCUXpGQ0xFbEJRVWtzUTBGQlF5eGhRVUZoTzBGQlFVRXNWVUZEWkN4SlFVRkpMR1ZCUVdVc2IwSkJRVzlDTEcxQ1FVRnRRanRCUVVGQkxGbEJRM1JFTEdOQlFXTTdRVUZCUVN4VlFVTnNRaXhGUVVGUE8wRkJRVUVzV1VGRFNDeGpRVUZqTEV0QlFVc3NTVUZCU1N4VlFVRlZPMEZCUVVFc1dVRkRha01zU1VGQlNTeG5Ra0ZCWjBJc1RVRkJUVHRCUVVGQkxHTkJRM1JDTEc5Q1FVRnZRanRCUVVGQkxHTkJRM0JDTEcxQ1FVRnRRanRCUVVGQkxGbEJRM1pDTEVWQlFVODdRVUZCUVN4alFVTklMR05CUVdNc1ZVRkJWU3hqUVVGak8wRkJRVUVzWTBGRGRFTXNTVUZCU1N4blFrRkJaMElzVjBGQlZ5eERRVVV2UWl4RlFVRlBPMEZCUVVFc1owSkJRMGdzU1VGQlNTeFBRVUZQTEZsQlFWa3NWMEZCVnp0QlFVRkJMR3RDUVVGWkxGbEJRVmtzVTBGQlV5eE5RVUZOTEZsQlFWazdRVUZCUVN4blFrRkRhRVk3UVVGQlFTdzRRa0ZCV1N4VFFVRlRMRTFCUVUwc1dVRkJXU3hQUVVGUE8wRkJRVUVzWjBKQlEyNUVMRXRCUVVzc1NVRkJTU3haUVVGWkxGZEJRVmM3UVVGQlFTeG5Ra0ZEYUVNc2IwSkJRVzlDTzBGQlFVRXNaMEpCUTNCQ0xHMUNRVUZ0UWp0QlFVRkJPMEZCUVVFN1FVRkJRVHRCUVVGQkxGRkJTVzVETzBGQlFVRXNVVUZGUVN4SlFVRkpMR1ZCUVdVc1dVRkJXU3hUUVVGVExGVkJRVlU3UVVGQlFTeFZRVVU1UXl4SlFVRkpMR2xDUVVGcFFqdEJRVUZCTEZWQlEzSkNMRWxCUVVrc1ZVRkJWVHRCUVVGQkxGVkJRMlFzU1VGQlNTeHBRa0ZCYVVJN1FVRkJRU3hWUVVOeVFpeEpRVUZKTEdkQ1FVRm5RaXh0UWtGQmJVSTdRVUZCUVN4WlFVTnVReXhwUWtGQmFVSXNXVUZCV1R0QlFVRkJMRmxCUXpkQ0xGVkJRVlVzV1VGQldTeFBRVUZQTzBGQlFVRXNXVUZETjBJc1RVRkJUU3hQUVVGUExGbEJRVmtzVVVGQlVUdEJRVUZCTEZsQlEycERMR2xDUVVGcFFpeE5RVUZOTEdWQlFXVXNVMEZCVlN4TlFVRk5MRkZCUVZFc1RVRkJUU3hWUVVGVkxFdEJRVXNzUTBGQlF5eExRVUZMTEZkQlFWY3NVMEZCVXl4UlFVRlJPMEZCUVVFc1dVRkRja2dzZFVKQlFYVkNPMEZCUVVFc1dVRkRka0lzWjBKQlFXZENPMEZCUVVFc1dVRkRhRUlzZFVKQlFYVkNPMEZCUVVFc1ZVRkRNMEk3UVVGQlFTeFZRVVZCTEUxQlFVMHNZVUZCV1N4WFFVRlhPMEZCUVVFc1ZVRkROMElzVFVGQlRTeFBRVUZQTEUxQlFVMHNZVUZCWVR0QlFVRkJMRlZCUjJoRExFbEJRVWs3UVVGQlFTeFZRVU5LTEVsQlFVa3NWMEZCVnp0QlFVRkJMRlZCUTJZc1NVRkJTU3hEUVVGRExGRkJRVkVzVTBGQlV5eE5RVUZOTEZOQlFWTXNUVUZCVFR0QlFVRkJMRmxCUTNaRExGTkJRVk1zUTBGQlF6dEJRVUZCTEZWQlEyUXNSVUZCVHp0QlFVRkJMRmxCUTBnc1NVRkJTVHRCUVVGQkxHTkJRMEVzVTBGQlV5eG5Ra0ZCWjBJc1MwRkJTeXhOUVVGTkxFbEJRVWtzUTBGQlF6dEJRVUZCTEdOQlEzcERMRWxCUVVrc1QwRkJUeXhYUVVGWE8wRkJRVUVzWjBKQlFXRXNVMEZCVXl4RFFVRkRPMEZCUVVFc1kwRkRMME1zVFVGQlRUdEJRVUZCTEdOQlEwb3NWMEZCVnp0QlFVRkJPMEZCUVVFN1FVRkJRU3hWUVVsdVFpeEpRVUZKTEZsQlFWa3NWMEZCVnl4UlFVRlJMRTlCUVU4c1YwRkJWeXhaUVVGWkxFTkJRVU1zVFVGQlRTeFJRVUZSTEUxQlFVMHNSMEZCUnp0QlFVRkJMRmxCUlhKR0xFbEJRVWtzVVVGQlVTeFpRVUZaTEZWQlFWVXNSVUZCUlN3eVFrRkJNa0lzVTBGQlV6dEJRVUZCTEdOQlJYQkZMRWxCUVVrc1EwRkJReXhuUWtGQlowSTdRVUZCUVN4blFrRkRha0lzVFVGQlRTeGhRVUZoTEdWQlFXVXNUVUZCVFR0QlFVRkJMR2RDUVVONFF5eEpRVUZKTEVOQlFVTXNWMEZCVnl4VFFVRlRPMEZCUVVFc2EwSkJSWEpDTEZkQlFWYzdRVUZCUVN4blFrRkRaanRCUVVGQkxHTkJRMG83UVVGQlFTeGpRVVZCTEVsQlFVa3NWVUZCVlR0QlFVRkJMR2RDUVVWV0xFMUJRVTBzVjBGQlpTeFBRVUZQTEU5QlFVOHNaMEpCUVdkQ08wRkJRVUVzWjBKQlEyNUVMRk5CUVZFc1QwRkJUenRCUVVGQkxHZENRVU5tTEZOQlFWRXNXVUZCV1R0QlFVRkJMR2RDUVVOd1FpeFRRVUZSTEZsQlFWazdRVUZCUVN4blFrRkRjRUlzVTBGQlVTeFBRVUZQTzBGQlFVRXNhMEpCUTFnc1MwRkJTenRCUVVGQkxHdENRVU5NTzBGQlFVRXNhMEpCUTBFc1RVRkJUU3hGUVVGRkxGRkJRVkVzV1VGQldTeFBRVUZQTEZWQlFWVTdRVUZCUVN4clFrRkROME1zVVVGQlVTeEZRVUZGTEZGQlFWRXNUVUZCVFN4UlFVRlJMRTlCUVU4N1FVRkJRU3hyUWtGRGRrTXNVMEZCVXl4UlFVRlJPMEZCUVVFc2EwSkJRMnBDTEZWQlFWVTdRVUZCUVN4clFrRkRWanRCUVVGQkxHZENRVU5LTzBGQlFVRXNaMEpCUTBFc1UwRkJVU3hWUVVGVkxGRkJRVkVzVVVGQlVUdEJRVUZCTEdkQ1FVVnNReXhKUVVGSk8wRkJRVUVzYTBKQlEwRXNUVUZCVFN4VFFVRlRMRTFCUVUwc1VVRkJVU3hWUVVGVExFMUJRVTA3UVVGQlFTeHJRa0ZGTlVNc1NVRkJTU3hYUVVGWExHRkJRV0VzVjBGQlZ5eFJRVUZSTEZkQlFWY3NTVUZCU1R0QlFVRkJMRzlDUVVNeFJDeFBRVUZQTEVWQlFVVXNaVUZCWlN4TlFVRk5MRTFCUVUwc2IwSkJRVzlDTEdGQlFWa3NWVUZCVlN4UlFVRlJMRXRCUVVzc1UwRkJVeXh4UWtGQmNVSTdRVUZCUVN4clFrRkROMGdzUlVGQlR5eFRRVUZKTEVOQlFVTXNUVUZCVFN4UlFVRlJMRTFCUVUwc1MwRkJTeXhQUVVGUExGZEJRVmNzVlVGQlZUdEJRVUZCTEc5Q1FVTTNSQ3hQUVVGUExFVkJRVVVzWlVGQlpTeE5RVUZOTEUxQlFVMHNaVUZCWlN4TFFVRkxMRlZCUVZVc1RVRkJUU3hKUVVGSkxHMUNRVUZ0UWl4aFFVRlpMRlZCUVZVc1VVRkJVU3hMUVVGTExGTkJRVk1zY1VKQlFYRkNPMEZCUVVFc2EwSkJRM0JMTzBGQlFVRXNhMEpCUlVZc1RVRkJUVHRCUVVGQkxHTkJSMW83UVVGQlFTeFpRVU5LTzBGQlFVRXNWVUZEU2p0QlFVRkJMRkZCUTBvN1FVRkJRU3hOUVVOS08wRkJRVUVzU1VGRFNqdEJRVUZCTEVsQlIwRXNUVUZCVFN4alFVRmpMR1ZCUVdVc1RVRkJUVHRCUVVGQkxFbEJRM3BETEUxQlFVMHNaVUZCWlN4VFFVRlRMRmxCUVZrc1RVRkJUU3hSUVVGUkxGVkJRVlVzVVVGQlVTeFJRVUZSTEU5QlFVOHNTVUZCU1N4WFFVRlhPMEZCUVVFc1NVRkRlRWNzVFVGQlRTeFpRVUZaTEd0Q1FVRnJRaXhaUVVGWkxFdEJRVXNzVjBGQlZ6dEJRVUZCTEVsQlEyaEZMRTFCUVUwc2EwSkJRV3RDTEVOQlFVTXNiMEpCUVc5Q08wRkJRVUVzU1VGRk4wTXNUVUZCVFN4VFFVRlRMR0ZCUVdFc1UwRkJVeXhaUVVGWkxGTkJRVk03UVVGQlFTeEpRVU14UkN4SlFVRkpPMEZCUVVFc1RVRkJhVUlzVVVGQlVTeFJRVUZSTEZGQlFWRXNTVUZCU1N4WFFVRlhMRVZCUVVVc1QwRkJUeXhEUVVGRE8wRkJRVUVzU1VGRmRFVXNUVUZCVFN4alFVRnpReXhUUVVGVExFdEJRVXNzWjBKQlFXZENMSFZDUVVGMVFpeEpRVUZKTzBGQlFVRXNTVUZGY2tjc1NVRkJTU3hWUVVFMlF5eERRVUZETzBGQlFVRXNTVUZGYkVRc1RVRkJUU3hYUVVFclFqdEJRVUZCTEUxQlEycERMRTFCUVUwN1FVRkJRU3hOUVVOT0xGRkJRVkU3UVVGQlFTeE5RVU5TTEZOQlFWTXNTMEZCU3l4WlFVRlpPMEZCUVVFc1NVRkRPVUk3UVVGQlFTeEpRVWxCTEUxQlFVMHNXVUZCV1N4VlFVRlZMRmRCUVZjc1ZVRkJWU3hKUVVGSkxGVkJRVlVzUzBGQlN6dEJRVUZCTEVsQlJYQkZMRTFCUVUwc1QwRkJiMEk3UVVGQlFTeE5RVU4wUWl4TFFVRkxPMEZCUVVFc1RVRkRURHRCUVVGQkxFMUJRMEVzVFVGQlRTeEZRVUZGTEZGQlFWRXNXVUZCZDBRc1QwRkJUeXhWUVVGVk8wRkJRVUVzVFVGRGVrWXNVVUZCVVR0QlFVRkJMRkZCUjBvc1VVRkJVU3haUVVGWkxFdEJRVTBzVFVGQlRTeGhRVUZoTzBGQlFVRXNVVUZETjBNc1VVRkJVVHRCUVVGQkxFMUJRMW83UVVGQlFTeE5RVU5CTEZOQlFWTXNVVUZCVVR0QlFVRkJMRTFCUTJwQ08wRkJRVUVzVFVGRFFUdEJRVUZCTEVsQlEwbzdRVUZCUVN4SlFVVkJMRTFCUVUwc1ZVRkJaU3hGUVVGRkxGRkJRVkVzVFVGQlRUdEJRVUZCTEVsQlEzSkRMRWxCUVVrN1FVRkJRU3hOUVVWQkxFMUJRVTBzZVVKQlFYbENMRkZCUVZFc2JVSkJRVzFDTEc5Q1FVRnZRaXhMUVVGTE8wRkJRVUVzVFVGRGJrWXNTVUZCU1R0QlFVRkJMRkZCUVhkQ0xFMUJRVTBzVVVGQlVTeExRVUZMTEhOQ1FVRnpRaXhGUVVGRkxGZEJRVmNzVVVGQlVTeE5RVUZOTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhOUVVGTkxGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNUVUZIYWtvc1NVRkJTU3hSUVVGUkxGbEJRVmtzVlVGQlZ5eExRVUZMTEV0QlFVc3NUMEZCYTBJc1UwRkJVeXhIUVVGSExFZEJRVWM3UVVGQlFTeFJRVU14UlN4TlFVRk5MRkZCUVZFc1MwRkJTeXgxUWtGQmRVSXNSVUZCUlN4WFFVRlhMRkZCUVZFc1RVRkJUU3hMUVVGTExFdEJRVXNzVVVGQmEwSXNUVUZCVFN4UlFVRlJMRTFCUVUwc1EwRkJRenRCUVVGQkxGRkJRM1JJTEUxQlFVMHNUMEZCVHl4aFFVRmhMRVZCUVVVc1RVRkJUU3hMUVVGTExFdEJRVXNzVDBGQmFVSXNRMEZCUXp0QlFVRkJMRTFCUTJ4Rk8wRkJRVUVzVFVGTlFTeEpRVUZKTEZkQlFWYzdRVUZCUVN4UlFVTllMRTFCUVUwc1YwRkJWeXhWUVVGVkxGVkJRVlVzVDBGQlR6dEJRVUZCTEZGQlF6VkRMRWxCUVVrc1EwRkJReXhWUVVGVk8wRkJRVUVzVlVGRFdDeE5RVUZOTEZGQlFWRXNTMEZCU3l4MVFrRkJkVUlzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4TFFVRkxMRXRCUVVzc1VVRkJhMElzVFVGQlRTeFJRVUZSTEUxQlFVMHNRMEZCUXp0QlFVRkJMRlZCUTNSSUxFMUJRVTBzVDBGQlR5eGhRVUZoTEVWQlFVVXNUVUZCVFN4TFFVRkxMRXRCUVVzc1QwRkJhVUlzUTBGQlF6dEJRVUZCTEZGQlEyeEZPMEZCUVVFc1VVRkZRU3hKUVVGSkxGTkJRV01zVTBGQlV6dEJRVUZCTEZGQlF6TkNMRWxCUVVrc1QwRkJUeXhYUVVGWExGbEJRVms3UVVGQlFTeFZRVU01UWl4VFFVRlRMRTFCUVUwc1QwRkJUenRCUVVGQkxGVkJRM1JDTEZOQlFWTXNVMEZCVXp0QlFVRkJMRkZCUTNSQ08wRkJRVUVzVVVGRFFTeE5RVUZOTEU5QlFVOHNVVUZCVVN4UlFVRlJMRU5CUVVNN1FVRkJRU3hSUVVrNVFpeFJRVUZSTEU5QlFVODdRVUZCUVN4UlFVTm1MRkZCUVZFc1ZVRkJWU3hMUVVGTExGRkJRVkU3UVVGQlFTeFJRVU12UWl4UlFVRlJMRlZCUVZVc1VVRkJVVHRCUVVGQkxGRkJRekZDTEZGQlFWRXNUMEZCVHp0QlFVRkJMRkZCUTJZc1VVRkJVU3haUVVGWk8wRkJRVUVzVVVGRGNFSXNVVUZCVVN4VFFVRlRPMEZCUVVFc1VVRkRha0lzVVVGQlVTeFBRVUZQTEZGQlFWRTdRVUZCUVN4UlFVTjJRaXhSUVVGUkxHdENRVUZyUWl4UlFVRlJPMEZCUVVFc1VVRkRiRU1zVVVGQlVTeHJRa0ZCYTBJc1VVRkJVVHRCUVVGQkxGRkJRMnhETEZGQlFWRXNXVUZCV1R0QlFVRkJMRkZCUTNCQ0xGRkJRVkVzVTBGQlV5eFJRVUZSTEZGQlFWRTdRVUZCUVN4UlFVTnFReXhSUVVGUkxGRkJRVkVzVlVGQlZUdEJRVUZCTEZGQlF6RkNMRkZCUVZFc1QwRkJUeXhEUVVGRExFdEJRVlVzVjBGQlowSXNVMEZCVXl4UFFVRlBMRk5CUVZNc1MwRkJTeXhOUVVGTk8wRkJRVUVzVVVGRE9VVXNVVUZCVVN4WlFVRlpMRU5CUVVNc1dVRkJhVUlzVVVGQlVTeFJRVUZSTEU5QlFVODdRVUZCUVN4UlFVTTNSQ3hSUVVGUkxFbEJRVWs3UVVGQlFTeFJRVTFhTEUxQlFVMHNhVUpCUVRCQ0xHRkJRV0VzV1VGRGRrTXNTVUZCU1N4UlFVRlJMRkZCUVZFc1VVRkJVU3hMUVVGTE8wRkJRVUVzVlVGREwwSXNVVUZCVVN4UlFVRlJMRkZCUVZFN1FVRkJRU3hWUVVONFFpeFRRVUZUTEZGQlFWRXNVVUZCVVR0QlFVRkJMRlZCUTNwQ0xFMUJRVTBzV1VGQldUdEJRVUZCTEZWQlEyeENMRkZCUVZFc1VVRkJVU3hSUVVGUk8wRkJRVUVzVVVGRE5VSXNRMEZCUXl4SlFVTkRMRkZCUVZFN1FVRkJRU3hSUVVWa0xFMUJRVTBzVlVGQmQwSXNSVUZCUlN4UFFVRlBMRlZCUVZVN1FVRkJRU3hSUVVWcVJDeEpRVUZKTEZGQlFWRXNiVUpCUVcxQ0xITkNRVUZ6UWl4TFFVRkxMRTFCUVUwN1FVRkJRU3hWUVVNMVJDeE5RVUZOTEZGQlFWRXNTMEZCU3l4M1FrRkJkMElzUlVGQlJTeFhRVUZYTEZGQlFWRXNUVUZCVFN4WlFVRlpMRTFCUVUwc1UwRkJVeXhSUVVGUkxFMUJRVTBzUTBGQlF6dEJRVUZCTEZGQlEzQklPMEZCUVVFc1VVRkZRU3hOUVVGTkxHTkJRWGRDTEUxQlFVMHNUMEZCVHl4UlFVRlJMRk5CUVZNc1kwRkJZenRCUVVGQkxGRkJRekZGTEZGQlFWRXNVVUZCVVR0QlFVRkJMRkZCUldoQ0xFbEJRVWtzVVVGQlVTeHRRa0ZCYlVJc2NVSkJRWEZDTEV0QlFVc3NUVUZCVFR0QlFVRkJMRlZCUXpORUxFMUJRVTBzVVVGQlVTeExRVUZMTEhWQ1FVRjFRaXhGUVVGRkxGZEJRVmNzVVVGQlVTeE5RVUZOTEZsQlFWa3NUVUZCVFN4VFFVRlRMRk5CUVZNc1VVRkJVU3hOUVVGTkxFTkJRVU03UVVGQlFTeFJRVU0xU0R0QlFVRkJMRkZCUjBFc1RVRkJUU3hsUVVGbExFbEJRVWtzVVVGQlVTeFpRVUZaTEU5QlFVODdRVUZCUVN4UlFVTndSQ3haUVVGWkxFZEJRVWNzVFVGQlRTeFBRVUZQTEZGQlFWRXNWMEZCVnl4SFFVRkhPMEZCUVVFc1ZVRkRPVU1zU1VGQlNTeERRVUZETEdGQlFXRXNTVUZCU1N4RFFVRkRPMEZCUVVFc1dVRkJSeXhoUVVGaExFbEJRVWtzUjBGQlJ5eERRVUZETzBGQlFVRXNVVUZEYmtRN1FVRkJRU3hSUVVWQkxFMUJRVTBzTUVKQlFUQkNMRkZCUVZFc2JVSkJRVzFDTEhGQ1FVRnhRaXhMUVVGTE8wRkJRVUVzVVVGRGNrWXNTVUZCU1R0QlFVRkJMRlZCUVhsQ0xFMUJRVTBzVVVGQlVTeExRVUZMTEhWQ1FVRjFRaXhGUVVGRkxGZEJRVmNzVVVGQlVTeE5RVUZOTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhOUVVGTkxGTkJRVk1zUzBGQlN5eFJRVUZSTEZOQlFWTXNVMEZCVXl4VFFVRlRMRTFCUVUwc1VVRkJVU3hOUVVGTkxFTkJRVU03UVVGQlFTeFJRVWN4VFN4SlFVRkpMRkZCUVZFc1UwRkJVeXhIUVVGSE8wRkJRVUVzVlVGRGNFSXNWMEZCVnl4WFFVRlhMRk5CUVZNN1FVRkJRU3haUVVNelFpeEpRVUZKTzBGQlFVRXNZMEZCUlN4TlFVRk5MRkZCUVZFN1FVRkJRU3hqUVVGTExFOUJRVThzVDBGQlR6dEJRVUZCTEdOQlFVVXNUMEZCVHl4TlFVRk5MSFZEUVVGMVF5eExRVUZMTzBGQlFVRTdRVUZCUVN4VlFVTjBSenRCUVVGQkxGRkJRMG83UVVGQlFTeFJRVVZCTEVsQlFVazdRVUZCUVN4VlFVRjFRaXhOUVVGTkxFOUJRVThzUlVGQlJTeFBRVUZQTEU5QlFXTTdRVUZCUVN4UlFVTXZSQ3hKUVVGSk8wRkJRVUVzVlVGQmFVSXNVVUZCVVN4UlFVRlJMRkZCUVZFc1QwRkJUeXhUUVVGVE8wRkJRVUVzVVVGRk4wUXNUMEZCVHl4SlFVRkpMRk5CUVZNc1dVRkJXU3hOUVVGTk8wRkJRVUVzVlVGRGJFTXNVVUZCVVN4WlFVRlpPMEZCUVVFc1ZVRkRjRUlzV1VGQldTeFpRVUZaTzBGQlFVRXNWVUZEZUVJc1UwRkJVenRCUVVGQkxGRkJRMklzUTBGQlF6dEJRVUZCTEUxQlEwdzdRVUZCUVN4TlFVVkJMRWxCUVVrc1EwRkJReXhSUVVGUkxGRkJRVkVzVVVGQlVTeEpRVUZKTEZGQlFWRXNSMEZCUnl4WFFVRlhMRzFDUVVGdFFpeEhRVUZITzBGQlFVRXNVVUZGZWtVc1NVRkJTU3hqUVVGakxGRkJRVkU3UVVGQlFTeFJRVU14UWl4SlFVRkpMRU5CUVVNc1lVRkJZVHRCUVVGQkxGVkJSV1FzU1VGQlNTeGxRVUZsTEc5Q1FVRnZRaXh0UWtGQmJVSTdRVUZCUVN4WlFVTjBSQ3hqUVVGak8wRkJRVUVzVlVGRGJFSXNSVUZCVHl4VFFVRkxMRXRCUVVzc1MwRkJTeXhQUVVGclFpeFRRVUZUTEVkQlFVY3NSMEZCUnp0QlFVRkJMRmxCUTI1RUxHTkJRV01zUzBGQlN5eEpRVUZKTEV0QlFVc3NTMEZCU3l4TlFVRm5RanRCUVVGQkxGbEJRMnBFTEVsQlFVa3NaMEpCUVdkQ0xFMUJRVTA3UVVGQlFTeGpRVU4wUWl4alFVRmpMRlZCUVZVc1kwRkJZeXhMUVVGTExFdEJRVXM3UVVGQlFTeGpRVU5vUkN4SlFVRkpMR2RDUVVGblFpeFhRVUZYTzBGQlFVRXNaMEpCUXpOQ0xFMUJRVTBzVVVGQlVTeExRVUZMTEhWQ1FVRjFRaXhGUVVGRkxGZEJRVmNzVVVGQlVTeE5RVUZOTEV0QlFVc3NTMEZCU3l4UlFVRnJRaXhOUVVGTkxGRkJRVkVzVFVGQlRTeERRVUZETzBGQlFVRXNaMEpCUTNSSUxFMUJRVTBzVDBGQlR5eGhRVUZoTEVWQlFVVXNUVUZCVFN4TFFVRkxMRXRCUVVzc1QwRkJhVUlzUTBGQlF6dEJRVUZCTEdOQlEyeEZPMEZCUVVFc1kwRkRRU3hKUVVGSkxFOUJRVThzV1VGQldTeFhRVUZYTzBGQlFVRXNaMEpCUVZrc1dVRkJXU3hUUVVGVExFMUJRVTBzV1VGQldUdEJRVUZCTEdOQlEyaEdPMEZCUVVFc05FSkJRVmtzVTBGQlV5eE5RVUZOTEZsQlFWa3NUMEZCVHp0QlFVRkJMR05CUTI1RUxFdEJRVXNzU1VGQlNTeExRVUZMTEV0QlFVc3NVVUZCYTBJc1YwRkJWenRCUVVGQkxGbEJRM0JFTzBGQlFVRXNWVUZEU2l4RlFVRlBPMEZCUVVFc1dVRkRTQ3hqUVVGakxFdEJRVXNzU1VGQlNTeExRVUZMTEV0QlFVc3NUVUZCWjBJN1FVRkJRU3haUVVOcVJDeEpRVUZKTEdkQ1FVRm5RaXhOUVVGTk8wRkJRVUVzWTBGRGRFSXNZMEZCWXl4VlFVRlZMR05CUVdNc1MwRkJTeXhMUVVGTE8wRkJRVUVzWTBGRGFFUXNTVUZCU1N4blFrRkJaMElzVjBGQlZ6dEJRVUZCTEdkQ1FVTXpRaXhOUVVGTkxGRkJRVkVzUzBGQlN5eDFRa0ZCZFVJc1JVRkJSU3hYUVVGWExGRkJRVkVzVFVGQlRTeExRVUZMTEV0QlFVc3NVVUZCYTBJc1RVRkJUU3hSUVVGUkxFMUJRVTBzUTBGQlF6dEJRVUZCTEdkQ1FVTjBTQ3hOUVVGTkxFOUJRVThzWVVGQllTeEZRVUZGTEUxQlFVMHNTMEZCU3l4TFFVRkxMRTlCUVdsQ0xFTkJRVU03UVVGQlFTeGpRVU5zUlR0QlFVRkJMR05CUTBFc1NVRkJTU3hQUVVGUExGbEJRVmtzVjBGQlZ6dEJRVUZCTEdkQ1FVRlpMRmxCUVZrc1UwRkJVeXhOUVVGTkxGbEJRVms3UVVGQlFTeGpRVU5vUmp0QlFVRkJMRFJDUVVGWkxGTkJRVk1zVFVGQlRTeFpRVUZaTEU5QlFVODdRVUZCUVN4alFVTnVSQ3hMUVVGTExFbEJRVWtzUzBGQlN5eExRVUZMTEZGQlFXdENMRmRCUVZjN1FVRkJRU3haUVVOd1JEdEJRVUZCTEZsQlJVRXNiMEpCUVc5Q08wRkJRVUVzV1VGRGNFSXNiVUpCUVcxQ08wRkJRVUU3UVVGQlFTeFZRVWQyUWl4SlFVRkpMRmxCUVZrc1UwRkJVenRCUVVGQkxGbEJRVlVzVFVGQlRTeFBRVUZQTEdkQ1FVRm5RaXhGUVVGRkxGVkJRVlVzVlVGQlZTeFRRVUZUTEhsTVFVRjVUQ3hEUVVGRE8wRkJRVUVzVVVGRE4xSTdRVUZCUVN4UlFVVkJMRkZCUVZFc1QwRkJUenRCUVVGQkxGRkJRMllzVVVGQlVTeFZRVUZWTEV0QlFVc3NVVUZCVVR0QlFVRkJMRkZCUXk5Q0xGRkJRVkVzV1VGQldUdEJRVUZCTEZGQlJYQkNMRTFCUVUwc1YwRkJWeXhOUVVGTkxGTkJRVk1zVlVGQlZTeGhRVUZoTzBGQlFVRXNWVUZEYmtRc2EwSkJRV3RDTzBGQlFVRXNWVUZEYkVJc1pVRkJaVHRCUVVGQkxGVkJRMllzVFVGQlRTeExRVUZMTEV0QlFVczdRVUZCUVN4VlFVTm9RaXhUUVVGVExGRkJRVkVzVVVGQlVUdEJRVUZCTEZWQlEzcENPMEZCUVVFc1ZVRkRRU3hSUVVGUkxFdEJRVXNzVDBGQlR6dEJRVUZCTEZWQlEzQkNMRmxCUVZrN1FVRkJRU3hWUVVOYUxHMUNRVUZ0UWp0QlFVRkJMRkZCUTNaQ0xFTkJRVU03UVVGQlFTeFJRVU5FTEZWQlFWVXNVMEZCVXp0QlFVRkJMRkZCUlc1Q0xFbEJRVWtzVTBGQlV5eFRRVUZUTEUxQlFVMHNVMEZCVXl4UlFVRlJMRlZCUVZVc1YwRkJWenRCUVVGQkxGVkJRemxFTEVsQlFVa3NVMEZCVXl4aFFVRmhPMEZCUVVFc1dVRkRkRUlzVTBGQlV5eFBRVUZQTERKQ1FVRXlRanRCUVVGQkxGVkJReTlETEVWQlFVODdRVUZCUVN4WlFVTklMRk5CUVZNc1QwRkJUeXhYUVVGWExFdEJRVXNzVlVGQlZTeFRRVUZUTEZGQlFWRXNTMEZCU3l4clFrRkJhMEk3UVVGQlFUdEJRVUZCTEZGQlJURkdPMEZCUVVFc1VVRkZRU3hOUVVGTkxEQkNRVUV3UWl4UlFVRlJMRzFDUVVGdFFpeHhRa0ZCY1VJc1MwRkJTenRCUVVGQkxGRkJRM0pHTEVsQlFVazdRVUZCUVN4VlFVRjVRaXhOUVVGTkxGRkJRVkVzUzBGQlN5eDFRa0ZCZFVJc1JVRkJSU3hYUVVGWExGRkJRVkVzVFVGQlRTeExRVUZMTEV0QlFVc3NVVUZCYTBJc1RVRkJUU3hUUVVGVExFdEJRVXNzVVVGQlVTeFRRVUZUTEZOQlFWTXNVMEZCVXl4VFFVRlRMRk5CUVZNc1RVRkJUU3hSUVVGUkxFMUJRVTBzUTBGQlF6dEJRVUZCTEZGQlJUVk9MRWxCUVVrc1VVRkJVU3hUUVVGVExFZEJRVWM3UVVGQlFTeFZRVU53UWl4WFFVRlhMRmRCUVZjc1UwRkJVenRCUVVGQkxGbEJRek5DTEVsQlFVazdRVUZCUVN4alFVTkJMRTFCUVUwc1VVRkJVVHRCUVVGQkxHTkJRMmhDTEU5QlFVOHNUMEZCVHp0QlFVRkJMR05CUTFvc1QwRkJUeXhOUVVGTkxIVkRRVUYxUXl4TFFVRkxPMEZCUVVFN1FVRkJRU3hWUVVWcVJUdEJRVUZCTEZGQlEwbzdRVUZCUVN4UlFVVkJMRWxCUVVrN1FVRkJRU3hWUVVGMVFpeE5RVUZOTEU5QlFVOHNSVUZCUlN4UFFVRlBMRTlCUVdNN1FVRkJRU3hSUVVNdlJDeEpRVUZKTzBGQlFVRXNWVUZCYVVJc1VVRkJVU3hSUVVGUkxGRkJRVkVzVDBGQlR5eFRRVUZUTzBGQlFVRXNVVUZETjBRc1NVRkJTU3hSUVVGUkxHRkJRV0U3UVVGQlFTeFZRVU55UWl4UFFVRlBMRVZCUVVVc1pVRkJaU3hOUVVGTkxFMUJRVTBzVTBGQlV5eE5RVUZOTEZGQlFWRXNVMEZCVXl4UlFVRlJMRk5CUVZNc1UwRkJVeXhSUVVGUk8wRkJRVUVzVVVGRE1VYzdRVUZCUVN4UlFVTkJMRTlCUVU4c1NVRkJTU3hUUVVGVExGTkJRVk1zVFVGQmVVSXNVVUZCVVR0QlFVRkJMRTFCUTJ4RkxFVkJRVTg3UVVGQlFTeFJRVVZJTEVsQlFVa3NZMEZCWXl4UlFVRlJPMEZCUVVFc1VVRkRNVUlzU1VGQlNTeERRVUZETEdGQlFXRTdRVUZCUVN4VlFVTmtMR05CUVdNc1MwRkJTeXhKUVVGSkxFdEJRVXNzUzBGQlN5eE5RVUZuUWp0QlFVRkJMRlZCUTJwRUxFbEJRVXNzUzBGQlN5eExRVUZMTEU5QlFXdENMRk5CUVZNc1IwRkJSeXhMUVVGTExFTkJRVVVzUzBGQlN5eExRVUZMTEU5QlFXdENMRk5CUVZNc1IwRkJSeXhMUVVGTExHZENRVUZuUWl4TlFVRk5PMEZCUVVFc1dVRkRia2dzWTBGQll5eFZRVUZWTEdOQlFXTXNTMEZCU3l4TFFVRkxPMEZCUVVFc1dVRkRhRVFzU1VGQlNTeG5Ra0ZCWjBJc1YwRkJWenRCUVVGQkxHTkJRek5DTEUxQlFVMHNVVUZCVVN4TFFVRkxMSFZDUVVGMVFpeEZRVUZGTEZkQlFWY3NVVUZCVVN4TlFVRk5MRXRCUVVzc1MwRkJTeXhSUVVGclFpeE5RVUZOTEZGQlFWRXNUVUZCVFN4RFFVRkRPMEZCUVVFc1kwRkRkRWdzVFVGQlRTeFBRVUZQTEdGQlFXRXNSVUZCUlN4TlFVRk5MRXRCUVVzc1MwRkJTeXhQUVVGcFFpeERRVUZETzBGQlFVRXNXVUZEYkVVN1FVRkJRU3haUVVOQkxFbEJRVWtzVDBGQlR5eFpRVUZaTEZkQlFWYzdRVUZCUVN4alFVRlpMRmxCUVZrc1UwRkJVeXhOUVVGTkxGbEJRVms3UVVGQlFTeFpRVU5vUmp0QlFVRkJMREJDUVVGWkxGTkJRVk1zVFVGQlRTeFpRVUZaTEU5QlFVODdRVUZCUVN4WlFVTnVSQ3hMUVVGTExFbEJRVWtzUzBGQlN5eExRVUZMTEZGQlFXdENMRmRCUVZjN1FVRkJRU3hWUVVOd1JEdEJRVUZCTEZWQlEwRXNTVUZCU1N4WlFVRlpMRk5CUVZNN1FVRkJRU3haUVVGVkxFMUJRVTBzVDBGQlR5eG5Ra0ZCWjBJc1JVRkJSU3hWUVVGVkxGVkJRVlVzVTBGQlV5d3lURUZCTWt3c1EwRkJRenRCUVVGQkxGRkJReTlTTzBGQlFVRXNVVUZGUVN4SlFVRkpMR1ZCUVdVN1FVRkJRU3hSUVVOdVFpeE5RVUZOTEdOQlFXTXNXVUZCV1R0QlFVRkJMRlZCUXpWQ0xFbEJRVWs3UVVGQlFTeFpRVUZqTzBGQlFVRXNWVUZEYkVJc1pVRkJaVHRCUVVGQkxGVkJRMllzVjBGQlZ5eFhRVUZYTEZOQlFWTTdRVUZCUVN4WlFVTXpRaXhKUVVGSk8wRkJRVUVzWTBGRFFTeE5RVUZOTEZGQlFWRTdRVUZCUVN4alFVTm9RaXhQUVVGUExFOUJRVTg3UVVGQlFTeGpRVU5hTEU5QlFVOHNUVUZCVFN4MVEwRkJkVU1zUzBGQlN6dEJRVUZCTzBGQlFVRXNWVUZGYWtVN1FVRkJRU3hWUVVOQkxFbEJRVWs3UVVGQlFTeFpRVUYxUWl4TlFVRk5MRTlCUVU4c1JVRkJSU3hQUVVGUExFOUJRV003UVVGQlFTeFZRVU12UkN4SlFVRkpPMEZCUVVFc1dVRkJhVUlzVVVGQlVTeFJRVUZSTEZGQlFWRXNUMEZCVHl4VFFVRlRPMEZCUVVFN1FVRkJRU3hSUVVkcVJTeFJRVUZSTEU5QlFVODdRVUZCUVN4UlFVTm1MRkZCUVZFc1ZVRkJWU3hMUVVGTExGRkJRVkU3UVVGQlFTeFJRVU12UWl4UlFVRlJMRmxCUVZrN1FVRkJRU3hSUVVWd1FpeE5RVUZOTEZkQlFWY3NUVUZCVFN4VFFVRlRMRlZCUVZVc1lVRkJZVHRCUVVGQkxGVkJRMjVFTEd0Q1FVRnJRanRCUVVGQkxGVkJRMnhDTEdWQlFXVTdRVUZCUVN4VlFVTm1MRTFCUVUwc1MwRkJTeXhMUVVGTE8wRkJRVUVzVlVGRGFFSXNVMEZCVXl4UlFVRlJMRkZCUVZFN1FVRkJRU3hWUVVONlFqdEJRVUZCTEZWQlEwRXNVVUZCVVN4TFFVRkxMRTlCUVU4N1FVRkJRU3hWUVVOd1FpeFpRVUZaTzBGQlFVRXNVVUZEYUVJc1EwRkJRenRCUVVGQkxGRkJRMFFzVlVGQlZTeFRRVUZUTzBGQlFVRXNVVUZGYmtJc1UwRkJVeXhWUVVGVkxFdEJRVXNzVTBGQlV5eFpRVUZaTEdsQ1FVRnBRaXhMUVVGTExFMUJRVTBzVFVGQlRTeEZRVUZGTzBGQlFVRXNVVUZGYWtZc1NVRkJTVHRCUVVGQkxGRkJSVW9zU1VGQlNUdEJRVUZCTEZGQlIwb3NTVUZCU1N4UFFVRlBMRkZCUVZFc1lVRkJZVHRCUVVGQkxGVkJSVFZDTEZOQlFWTXNTVUZCU1N4bFFVRmxPMEZCUVVFc1dVRkRlRUlzVFVGQlRUdEJRVUZCTEdsQ1FVVkJMRXRCUVVrc1EwRkJReXhaUVVFMFF6dEJRVUZCTEdOQlEyNUVMRlZCUVZVN1FVRkJRU3hqUVVOV0xFbEJRVWs3UVVGQlFTeG5Ra0ZEUVN4WFFVRlhMRTFCUVUwc1UwRkJVeXhMUVVGTExGVkJRVlVzUlVGQlJTeFRRVUZUTEUxQlFVMHNUVUZCVFN4WFFVRlhMRlZCUVZVc1EwRkJjME03UVVGQlFUdEJRVUZCTEVOQlFVODdRVUZCUVN4blFrRkRiRWtzYVVKQlFXbENMRk5CUVZNc1UwRkJVeXhSUVVGUkxFOUJRVTg3UVVGQlFTeHJRa0ZET1VNc1NVRkJTU3hEUVVGRExGRkJRVkVzVVVGQlVTeFBRVUZQTEZOQlFWTTdRVUZCUVN4dlFrRkRha01zVFVGQlRTeFRRVUZwUWl4TFFVRkxMRlZCUVZVc1EwRkJReXhOUVVGTkxFdEJRVXNzUTBGQlF6dEJRVUZCTEc5Q1FVTnVSQ3hYUVVGWExFMUJRVTBzVVVGQlVUdEJRVUZCTzBGQlFVRXNRMEZCV1R0QlFVRkJMR3RDUVVONlF5eEZRVUZQTzBGQlFVRXNiMEpCUTBnc1UwRkJVeXhSUVVGUkxFMUJRVTBzVDBGQlR5eFRRVUZUTzBGQlFVRXNiMEpCUTNaRExFMUJRVTBzV1VGQldUdEJRVUZCTEc5Q1FVTnNRaXhYUVVGWExFMUJRVTA3UVVGQlFUdEJRVUZCTEdkQ1FVVjZRanRCUVVGQkxHZENRVU5HTEU5QlFVOHNUMEZCVHp0QlFVRkJMR2RDUVVOYUxFMUJRVTBzV1VGQldTeHBRa0ZCYVVJc1YwRkJWeXhSUVVGUkxFdEJRVXM3UVVGQlFTeG5Ra0ZETTBRc1RVRkJUU3hUUVVGakxFTkJRVU03UVVGQlFTeG5Ra0ZEY2tJc1QwRkJUeXhWUVVGVkxGRkJRVkVzVlVGQlZUdEJRVUZCTEdkQ1FVTnVReXhYUVVGWExFMUJRVTBzVVVGQlVTeExRVUZMTEZWQlFWVXNRMEZCUXl4UlFVRlJMRWxCUVVrc1EwRkJRenRCUVVGQk8wRkJRVUVzUTBGQlR6dEJRVUZCTzBGQlFVRXNZMEZGYWtVc1RVRkJUU3hKUVVGSkxGRkJRVkVzUTBGQlF5eFpRVUZaTEZkQlFWY3NVMEZCVXl4RFFVRkRMRU5CUVVNN1FVRkJRU3hqUVVOeVJDeE5RVUZOTEZsQlFWazdRVUZCUVN4alFVTnNRaXhYUVVGWExFMUJRVTA3UVVGQlFUdEJRVUZCTEdsQ1FVVm1MRTlCUVUwc1IwRkJSenRCUVVGQkxHTkJRMWdzVFVGQlRTeFpRVUZaTzBGQlFVRXNZMEZEYkVJc1VVRkJVU3hOUVVGTk8wRkJRVUU3UVVGQlFTeFZRVVYwUWl4RFFVRlJPMEZCUVVFc1VVRkRXaXhGUVVGUE8wRkJRVUVzVlVGSFNDeFRRVUZUTEVsQlFVa3NaVUZCWlR0QlFVRkJMR2xDUVVWc1FpeExRVUZKTEVOQlFVTXNXVUZCV1R0QlFVRkJMR05CUTI1Q0xGVkJRVlU3UVVGQlFTeGpRVU5XTEVsQlFVazdRVUZCUVN4blFrRkRRU3hYUVVGWExGRkJRVkVzVTBGQlV5eExRVUZMTEZWQlFWVXNSVUZCUlN4VFFVRlRMRTFCUVUwc1RVRkJUU3hYUVVGWExGVkJRVlVzUTBGQmMwTTdRVUZCUVR0QlFVRkJMRU5CUVU4N1FVRkJRU3huUWtGRGNFa3NhVUpCUVdsQ0xGTkJRVk1zVTBGQlV5eFJRVUZSTEU5QlFVODdRVUZCUVN4clFrRkRPVU1zU1VGQlNTeERRVUZETEZGQlFWRXNVVUZCVVN4UlFVRlJMRk5CUVZNN1FVRkJRU3h2UWtGRGJFTXNUVUZCVFN4VFFVRnBRaXhMUVVGTExGVkJRVlVzUTBGQlF5eE5RVUZOTEV0QlFVc3NRMEZCUXp0QlFVRkJMRzlDUVVOdVJDeFhRVUZYTEZGQlFWRXNVVUZCVVR0QlFVRkJPMEZCUVVFc1EwRkJXVHRCUVVGQkxHdENRVU16UXl4RlFVRlBPMEZCUVVFc2IwSkJRMGdzVTBGQlV5eFJRVUZSTEUxQlFVMHNUMEZCVHl4VFFVRlRPMEZCUVVFc2IwSkJRM1pETEUxQlFVMHNXVUZCV1R0QlFVRkJMRzlDUVVOc1FpeFhRVUZYTEUxQlFVMDdRVUZCUVR0QlFVRkJMR2RDUVVWNlFqdEJRVUZCTEdkQ1FVTkdMRTlCUVU4c1QwRkJUenRCUVVGQkxHZENRVU5hTEUxQlFVMHNXVUZCV1N4cFFrRkJhVUlzVjBGQlZ5eFJRVUZSTEV0QlFVczdRVUZCUVN4blFrRkRNMFFzVFVGQlRTeFRRVUZqTEVOQlFVTTdRVUZCUVN4blFrRkRja0lzVDBGQlR5eFZRVUZWTEZGQlFWRXNWVUZCVlR0QlFVRkJMR2RDUVVOdVF5eFhRVUZYTEZGQlFWRXNVVUZCVVN4TFFVRkxMRlZCUVZVc1EwRkJReXhSUVVGUkxFbEJRVWtzUTBGQlF6dEJRVUZCTzBGQlFVRXNRMEZCVHp0QlFVRkJPMEZCUVVFc1kwRkZia1VzVFVGQlRTeFpRVUZaTzBGQlFVRXNZMEZEYkVJc1RVRkJUU3hKUVVGSkxGRkJRVkVzUTBGQlF5eFpRVUZaTEZkQlFWY3NVMEZCVXl4RFFVRkRMRU5CUVVNN1FVRkJRU3hqUVVOeVJDeFhRVUZYTEUxQlFVMDdRVUZCUVR0QlFVRkJMR2xDUVVWbUxFOUJRVTBzUjBGQlJ6dEJRVUZCTEdOQlExZ3NUVUZCVFN4WlFVRlpPMEZCUVVFc1kwRkRiRUlzVVVGQlVTeE5RVUZOTzBGQlFVRTdRVUZCUVN4VlFVVjBRaXhEUVVGUk8wRkJRVUU3UVVGQlFTeFJRVWRhTEZOQlFWTXNUMEZCVHp0QlFVRkJMRkZCUldoQ0xGTkJRVk1zVlVGQlZTeExRVUZMTEZOQlFWTXNVMEZCVXl4blFrRkJaMElzY1VKQlFYRkNMR2xDUVVGcFFpeFhRVUZYTzBGQlFVRXNVVUZGTTBjc1RVRkJUU3hSUVVGUkxFdEJRVXNzZFVKQlFYVkNMRVZCUVVVc1YwRkJWeXhSUVVGUkxFMUJRVTBzUzBGQlN5eExRVUZMTEZGQlFXdENMRTFCUVUwc1UwRkJVeXhMUVVGTExGRkJRVkVzVTBGQlV5eFRRVUZUTEZOQlFWTXNVMEZCVXl4VFFVRlRMRTFCUVUwc1VVRkJVU3hOUVVGTkxFTkJRVU03UVVGQlFTeFJRVVV2VEN4UFFVRlBMRWxCUVVrc1UwRkJVeXhUUVVGVExFMUJRVTBzVVVGQlVUdEJRVUZCTzBGQlFVRXNUVUZGYWtRc1QwRkJUeXhQUVVGUE8wRkJRVUVzVFVGRFdpeE5RVUZOTEZWQlFYbERPMEZCUVVFc1VVRkRNME1zVDBGQlR5eHBRa0ZCYVVJc1YwRkJWeXhSUVVGUkxFdEJRVXM3UVVGQlFTeE5RVU53UkR0QlFVRkJMRTFCUTBFc1NVRkJTU3hSUVVGUkxGVkJRVlU3UVVGQlFTeFJRVUZYTEZOQlFWTXNUMEZCVHl4TFFVRkxMRlZCUVZVc1VVRkJVU3hMUVVGTE8wRkJRVUVzVFVGRk4wVXNVMEZCVXl4VlFVRlZMRXRCUVVzc1UwRkJVeXhaUVVGWkxGbEJRVms3UVVGQlFTeE5RVU42UkN4TlFVRk5MRkZCUVZFc1MwRkJTeXgxUWtGQmRVSXNSVUZCUlN4WFFVRlhMRkZCUVZFc1RVRkJUU3hMUVVGTExFdEJRVXNzVVVGQmEwSXNUVUZCVFN4VFFVRlRMRXRCUVVzc1VVRkJVU3hUUVVGVExGTkJRVk1zVTBGQlV5eFBRVUZQTEZGQlFWRXNUVUZCVFN4RFFVRkRPMEZCUVVFc1RVRkhPVXNzU1VGQlNTeFJRVUZSTEZOQlFWTXNSMEZCUnp0QlFVRkJMRkZCUTNCQ0xGZEJRVmNzVjBGQlZ5eFRRVUZUTzBGQlFVRXNWVUZETTBJc1NVRkJTVHRCUVVGQkxGbEJRVVVzVFVGQlRTeFJRVUZSTzBGQlFVRXNXVUZCU3l4UFFVRlBMRWRCUVVjN1FVRkJRU3haUVVGRkxFOUJRVThzVFVGQlRTeDFRMEZCZFVNc1EwRkJRenRCUVVGQk8wRkJRVUVzVVVGRE9VWTdRVUZCUVN4TlFVTktPMEZCUVVFc1RVRkRRU3hKUVVGSk8wRkJRVUVzVVVGQmRVSXNUVUZCVFN4UFFVRlBMRVZCUVVVc1QwRkJUeXhQUVVGak8wRkJRVUVzVFVGREwwUXNTVUZCU1R0QlFVRkJMRkZCUVdsQ0xGRkJRVkVzVVVGQlVTeFJRVUZSTEU5QlFVOHNVMEZCVXp0QlFVRkJMRTFCUXpkRUxFbEJRVWtzVVVGQlVTeGhRVUZoTzBGQlFVRXNVVUZEY2tJc1QwRkJUeXhGUVVGRkxHVkJRV1VzVFVGQlRTeE5RVUZOTEZOQlFWTXNUVUZCVFN4UlFVRlJMRk5CUVZNc1VVRkJVU3hUUVVGVExGTkJRVk1zVVVGQlVUdEJRVUZCTEUxQlF6RkhPMEZCUVVFc1RVRkRRU3hQUVVGUExFbEJRVWtzVTBGQlV5eFRRVUZUTEUxQlFYbENMRkZCUVZFN1FVRkJRVHRCUVVGQk8wRkJRVUVzUlVGSmRFVXNUVUZCVFN4blFrRkJPRVVzU1VGQlNUdEJRVUZCTEVWQlEzaEdMRTFCUVUwc1owSkJRV2RDTEU5QlEyeENMRTlCUTBFc1dVRlJRenRCUVVGQkxFbEJRMFFzU1VGQlNTeFBRVUZQTEZsQlFWa3NWVUZCVlR0QlFVRkJMRTFCUXpkQ0xFbEJRVWtzV1VGQldTeFJRVUZSTzBGQlFVRXNVVUZEY0VJc1RVRkJTeXhaUVVGWkxFMUJRVTA3UVVGQlFTeE5RVU16UWp0QlFVRkJMRTFCUTBFc1NVRkJTU3hSUVVGUkxGZEJRVmNzWlVGQlpTeEhRVUZITzBGQlFVRXNVVUZEY2tNc1RVRkJUU3haUVVGWkxGRkJRVkVzVlVGQlZTeG5Ra0ZCWjBJc1RVRkJUVHRCUVVGQkxGRkJRekZFTEUxQlFVMHNaVUZCWlN4alFVRmpMRWxCUVVrc1UwRkJVenRCUVVGQkxGRkJRMmhFTEVsQlFVa3NZMEZCWXp0QlFVRkJMRlZCUTJRc1lVRkJZU3hWUVVGVkxFOUJRVThzVTBGQlV6dEJRVUZCTEZWQlEzWkRMR0ZCUVdFc1dVRkJXU3hSUVVGUk8wRkJRVUVzVVVGRGNrTTdRVUZCUVN4TlFVTktPMEZCUVVFc1RVRkRRVHRCUVVGQkxFbEJRMG83UVVGQlFTeEpRVU5CTEVsQlFVa3NZMEZCWXl4TFFVRkxMRWxCUVVrc1VVRkJVU3hKUVVGSk8wRkJRVUVzU1VGRGRrTXNTVUZCU1N4blFrRkJaMElzVFVGQlRUdEJRVUZCTEUxQlEzUkNMR05CUVdNc1ZVRkJWU3hqUVVGakxGRkJRVkU3UVVGQlFTeE5RVU01UXl4SlFVRkpMR2RDUVVGblFpeFhRVUZYTzBGQlFVRXNVVUZETTBJc1RVRkJUU3hQUVVGUExHRkJRV0VzUlVGQlJTeE5RVUZOTEZGQlFWRXNTMEZCU3l4RFFVRkRPMEZCUVVFc1RVRkRjRVE3UVVGQlFTeE5RVU5CTEVsQlFVa3NUMEZCVHl4WlFVRlpMRmRCUVZjN1FVRkJRU3hSUVVGWkxGbEJRVmtzVTBGQlV5eE5RVUZOTEZsQlFWazdRVUZCUVN4TlFVTm9SanRCUVVGQkxHOUNRVUZaTEZOQlFWTXNUVUZCVFN4WlFVRlpMRTlCUVU4N1FVRkJRU3hOUVVOdVJDeExRVUZMTEVsQlFVa3NVVUZCVVN4TlFVRk5MRmRCUVZjN1FVRkJRU3hKUVVOMFF6dEJRVUZCTEVsQlJVRXNUVUZCVFN4VlFVRlZMRWxCUVVrc1VVRkJVU3hSUVVGUkxFOUJRVTg3UVVGQlFTeEpRVU16UXl4TlFVRk5MRk5CUVZNc1VVRkJVU3hWUVVGVkxFTkJRVU03UVVGQlFTeEpRVU5zUXl4TlFVRk5MRk5CUVZNc1lVRkJZU3hUUVVGVExGRkJRVkVzVFVGQlRTeFJRVUZSTEZOQlFWTTdRVUZCUVN4SlFVTndSU3hKUVVGSkxGVkJRVFpETEVOQlFVTTdRVUZCUVN4SlFVVnNSQ3hOUVVGTkxFOUJRVThzU1VGQlNTeE5RVU5pTEVOQlFVTXNSMEZEUkR0QlFVRkJMRTFCUTBrc1MwRkJTeXhEUVVGRExGRkJRVkVzWVVGQllUdEJRVUZCTEZGQlEzWkNMRWxCUVVrc1lVRkJZVHRCUVVGQkxGVkJRVmtzVDBGQlR6dEJRVUZCTEZGQlEzQkRPMEZCUVVFN1FVRkJRU3hOUVVWS0xFdEJRVXNzVFVGQlRUdEJRVUZCTEZGQlExQXNUVUZCVFN4UFFVRlBMR2RDUVVGblFpeEZRVUZGTEZWQlFWVXNaMEpCUVdkQ0xGTkJRVk1zY1VwQlFYRktMRU5CUVVNN1FVRkJRVHRCUVVGQkxFbEJSV2hQTEVOQlEwbzdRVUZCUVN4SlFVVkJMRTFCUVUwc1kwRkJZeXhQUVVGUExGTkJRVGhDTzBGQlFVRXNUVUZEY2tRc1NVRkJTU3hUUVVGVE8wRkJRVUVzVVVGQlZTeGpRVUZqTEU5QlFVOHNVVUZCVVN4VFFVRlRPMEZCUVVFc1RVRkROMFFzVjBGQlZ5eFhRVUZYTEZOQlFWTTdRVUZCUVN4UlFVTXpRaXhKUVVGSk8wRkJRVUVzVlVGRFFTeE5RVUZOTEZGQlFWRTdRVUZCUVN4VlFVTm9RaXhQUVVGUExFOUJRVTg3UVVGQlFTeFZRVU5hTEU5QlFVOHNUVUZCVFN4MVEwRkJkVU1zUzBGQlN6dEJRVUZCTzBGQlFVRXNUVUZGYWtVN1FVRkJRU3hOUVVOQkxFMUJRVTBzVDBGQlR5eEZRVUZGTEU5QlFVOHNUMEZCWXp0QlFVRkJMRTFCUTNCRExGRkJRVkVzVVVGQlVTeFJRVUZSTEU5QlFVOHNVVUZCVVN4VFFVRlRPMEZCUVVFN1FVRkJRU3hKUVVkd1JDeE5RVUZOTEZWQlFWVXNSVUZCUlN4TlFVRlpMRk5CUVZNc1YwRkJWeXhaUVVGWkxFMUJRVTBzVVVGQlVTeE5RVUZOTzBGQlFVRXNTVUZGYkVZc1NVRkJTVHRCUVVGQkxFMUJRMEVzU1VGQlNTeFpRVUZaTEZOQlFWTXNWVUZCVlR0QlFVRkJMRkZCUXk5Q0xFMUJRVTBzVjBGQlZ5eE5RVUZOTEZOQlFWTXNWVUZCVlN4aFFVRmhPMEZCUVVFc1ZVRkRia1FzYTBKQlFXdENMRkZCUVZFN1FVRkJRU3hWUVVNeFFpeGxRVUZsTzBGQlFVRXNWVUZEWml4TlFVRk5MRkZCUVZFN1FVRkJRU3hWUVVOa08wRkJRVUVzVlVGRFFUdEJRVUZCTEZWQlEwRTdRVUZCUVN4VlFVTkJMRmxCUVZrN1FVRkJRU3hSUVVOb1FpeERRVUZETzBGQlFVRXNVVUZEUkN4VlFVRlZMRk5CUVZNN1FVRkJRU3hSUVVWdVFpeE5RVUZOTEZsQlFWa3NVVUZCVVR0QlFVRkJMRkZCUlRGQ0xFbEJRVWtzVTBGQlV5eGhRVUZoTzBGQlFVRXNWVUZEZEVJc1RVRkJTeXhaUVVGWk8wRkJRVUVzV1VGRFlpeFhRVUZYTEZGQlFWRTdRVUZCUVN4WlFVTnVRaXhUUVVGVE8wRkJRVUVzV1VGRFZDeE5RVUZOTzBGQlFVRXNWVUZEVml4RFFVRkRPMEZCUVVFc1VVRkRUQ3hGUVVGUE8wRkJRVUVzVlVGRFNDeE5RVUZMTEZsQlFWazdRVUZCUVN4WlFVTmlMRmRCUVZjc1VVRkJVVHRCUVVGQkxGbEJRMjVDTEZOQlFWTTdRVUZCUVN4WlFVTlVMRTFCUVUwc1UwRkJVeXhSUVVGUk8wRkJRVUVzVlVGRE0wSXNRMEZCUXp0QlFVRkJPMEZCUVVFc1RVRkZWRHRCUVVGQkxFMUJRMEVzU1VGQlNTeFpRVUZaTEZOQlFWTXNWVUZCVlR0QlFVRkJMRkZCUXk5Q0xFMUJRVTBzVjBGQlZ5eE5RVUZOTEZOQlFWTXNWVUZCVlN4aFFVRmhPMEZCUVVFc1ZVRkRia1FzYTBKQlFXdENMRkZCUVZFN1FVRkJRU3hWUVVNeFFpeGxRVUZsTzBGQlFVRXNWVUZEWml4TlFVRk5MRkZCUVZFN1FVRkJRU3hWUVVOa08wRkJRVUVzVlVGRFFUdEJRVUZCTEZWQlEwRTdRVUZCUVN4VlFVTkJMRmxCUVZrN1FVRkJRU3hSUVVOb1FpeERRVUZETzBGQlFVRXNVVUZEUkN4VlFVRlZMRk5CUVZNN1FVRkJRU3hSUVVWdVFpeEpRVUZKTzBGQlFVRXNWVUZEUVN4TlFVRkxMRmxCUVZrc1JVRkJSU3hUUVVGVExFMUJRVTBzVFVGQlRTeFhRVUZYTEZkQlFWY3NVVUZCVVN4WFFVRlhMRTFCUVUwc1RVRkJUU3hEUVVGRE8wRkJRVUVzVlVGRE9VWXNZMEZCWXl4SlFVRkpMRkZCUVZFc1YwRkJWeXhGUVVGRkxGZEJRVmNzVTBGQlV5eFJRVUZSTEU5QlFVOHNXVUZCV1N4RFFVRkRPMEZCUVVFc1ZVRkRka1lzYVVKQlFXbENMRk5CUVZNc1UwRkJVeXhSUVVGUkxFOUJRVTg3UVVGQlFTeFpRVU01UXl4TlFVRk5MRTlCUVU4c1JVRkJSU3hUUVVGVExFMUJRVTBzVFVGQlRTeERRVUZETEUxQlFVMHNTMEZCU3l4SFFVRkhMRmRCUVZjc1VVRkJVU3hYUVVGWExFMUJRVTBzVFVGQlRUdEJRVUZCTEZsQlF6ZEdMRTFCUVVzc1dVRkJXU3hKUVVGSk8wRkJRVUVzVlVGRGVrSTdRVUZCUVN4VlFVTkJMRTFCUVVzc1dVRkJXU3hGUVVGRkxGTkJRVk1zVFVGQlRTeE5RVUZOTEZkQlFWY3NWMEZCVnl4UlFVRlJMRmRCUVZjc1RVRkJUU3hMUVVGTExFTkJRVU03UVVGQlFTeFZRVU12Uml4UFFVRlBMRTlCUVU4N1FVRkJRU3hWUVVOYUxFMUJRVTBzV1VGQldTeHBRa0ZCYVVJc1VVRkJVU3hYUVVGWExGRkJRVkVzUzBGQlN6dEJRVUZCTEZWQlEyNUZMRTFCUVUwc1UwRkJZeXhEUVVGRE8wRkJRVUVzVlVGRGNrSXNUMEZCVHl4VlFVRlZMRkZCUVZFc1ZVRkJWVHRCUVVGQkxGVkJRMjVETEUxQlFVc3NXVUZCV1N4RlFVRkZMRk5CUVZNc1RVRkJUU3hOUVVGTkxFTkJRVU1zVVVGQlVTeEpRVUZKTEVkQlFVY3NWMEZCVnl4UlFVRlJMRmRCUVZjc1RVRkJUU3hMUVVGTExFTkJRVU03UVVGQlFUdEJRVUZCTEZGQlJYUkhMRTFCUVUwc1dVRkJXU3hSUVVGUk8wRkJRVUVzVFVGRE9VSTdRVUZCUVN4TlFVTkdMRTlCUVU4c1QwRkJUenRCUVVGQkxFMUJRMW9zVFVGQlRTeFRRVUZUTEdsQ1FVRnBRaXhSUVVGUkxGZEJRVmNzVVVGQlVTeExRVUZMTzBGQlFVRXNUVUZEYUVVc1RVRkJUU3hQUVVGUExFVkJRVVVzVDBGQlR5eFBRVUZqTzBGQlFVRXNUVUZEY0VNc1RVRkJTeXhaUVVGWkxFVkJRVVVzVTBGQlV5eFBRVUZQTEUxQlFVMHNWMEZCVnl4UFFVRlBMRkZCUVZFc1YwRkJWeXhSUVVGUkxGZEJRVmNzVFVGQlRTeExRVUZMTEVOQlFVTTdRVUZCUVR0QlFVRkJPMEZCUVVFc1JVRkpja2dzVDBGQlR6dEJRVUZCTEVsQlEwZzdRVUZCUVN4SlFVTkJPMEZCUVVFc1NVRkRRVHRCUVVGQkxFVkJRMG83UVVGQlFUczdRVU0xTkVKSExGTkJRVk1zVFVGQlRTeERRVUZETEUxQlFXTXNUVUZCZVVNN1FVRkJRU3hGUVVNeFJTeE5RVUZOTEZGQlFWRXNSVUZCUlN4bFFVRmxMRTFCUVUwc1RVRkJUU3hMUVVGTE8wRkJRVUVzUlVGRGFFUXNTVUZCU1N4UFFVRlBMRTFCUVUwc2MwSkJRWE5DTzBGQlFVRXNTVUZCV1N4TlFVRk5MR3RDUVVGclFpeExRVUZMTzBGQlFVRXNSVUZEYUVZc1QwRkJUenRCUVVGQk8wRkJTMG9zVTBGQlV5eExRVUZMTEVOQlFVTXNTMEZCZFVRN1FVRkJRU3hGUVVONlJTeE5RVUZOTEU5QlFVOHNUMEZCVHl4TFFVRkxMRWRCUVVjN1FVRkJRU3hGUVVNMVFpeE5RVUZOTEU5QlFVOHNTMEZCU3p0QlFVRkJMRVZCUTJ4Q0xFbEJRVWtzVTBGQlV6dEJRVUZCTEVsQlFWY3NUVUZCVFN4SlFVRkpMRTFCUVUwc2QwVkJRWGRGTzBGQlFVRXNSVUZEYUVnc1RVRkJUU3hoUVVGaExFbEJRVWs3UVVGQlFTeEZRVU4yUWl4TlFVRk5MRkZCUVZFc1JVRkJSU3hsUVVGbExFMUJRVTBzVFVGQlRTeE5RVUZOTEZkQlFWYzdRVUZCUVN4RlFVTTFSQ3hKUVVGSkxFOUJRVThzVFVGQlRTeHpRa0ZCYzBJN1FVRkJRU3hKUVVGWkxFMUJRVTBzYTBKQlFXdENMRXRCUVVzN1FVRkJRU3hGUVVOb1JpeFBRVUZQTzBGQlFVRTdRVUZMU2l4VFFVRlRMR2RDUVVGblFpeERRVUZETEZkQlFXMUNMRkZCUVdkQ0xFOUJRV2RGTzBGQlFVRXNSVUZEYUVrc1NVRkJTU3hwUWtGQmFVSXNVMEZCVXl4blFrRkJaMElzV1VGQldUdEJRVUZCTEVsQlEzUkVMRWxCUVVrN1FVRkJRU3hOUVVGSExGZEJRVzFDTEZkQlFWY3NhVUpCUVdsQ0xFdEJRVXM3UVVGQlFTeE5RVUZMTEUxQlFVMDdRVUZCUVN4RlFVTXhSVHRCUVVGQkxFVkJRMEVzVFVGQlRTeFBRVUZQTEU5QlFVOHNVVUZCVVN4UFFVRlBMRkZCUVZFc1QwRkJUeXhoUVVGaExGRkJRVkU3UVVGQlFTeEZRVVYyUlN4SlFVRkpMRTlCUVU4c2EwSkJRV3RDTEUxQlFVMDdRVUZCUVN4SlFVY3ZRaXhKUVVGSkxFMUJRVTBzVTBGQlV5eGhRVUZoTzBGQlFVRXNUVUZETlVJc1QwRkJUeXhMUVVGTExFMUJRVTBzVDBGQlR5eE5RVUZOTEZGQlFWRXNZMEZCWXp0QlFVRkJMRWxCUTNwRUxFVkJRVTg3UVVGQlFTeE5RVU5JTEUxQlFVMHNVMEZCVXl4UFFVRlBMRk5CUVZNc1NVRkJTU3hOUVVGTk8wRkJRVUVzUTBGQlNTeEZRVUZGTEUxQlFVMHNRMEZCUXl4RlFVRkZMRXRCUVVzN1FVRkJRU3hEUVVGSk8wRkJRVUVzVFVGRGFrVXNUMEZCVHl4TFFVRkxMRTFCUVUwN1FVRkJRU3hGUVVGTExFdEJRVXNzVlVGQlZTeFBRVUZQTEVsQlFVa3NTMEZCU3p0QlFVRkJMRVZCUVVzN1FVRkJRU3hEUVVGVE8wRkJRVUU3UVVGQlFTeEZRVVUxUlN4RlFVRlBPMEZCUVVFc1NVRkRTQ3hKUVVGSk8wRkJRVUVzVFVGRFFTeE5RVUZOTEZGQlFWRXNUMEZCVHl4VFFVRlRPMEZCUVVFc1RVRkRPVUlzVDBGQlR5eE5RVUZOTEUxQlFVMDdRVUZCUVN4RlFVRkxMRXRCUVVzc1ZVRkJWU3hQUVVGUExFbEJRVWtzUzBGQlN6dEJRVUZCTEVWQlFVczdRVUZCUVN4RFFVRlRPMEZCUVVFc1RVRkRka1VzVDBGQlR5eEhRVUZITzBGQlFVRXNUVUZEVWl4UFFVRlBMRTFCUVUwc1RVRkJUVHRCUVVGQkxFVkJRVXNzVDBGQlR5eFRRVUZUTEV0QlFVczdRVUZCUVN4RlFVRkxMRTlCUVU4N1FVRkJRU3hEUVVGVE8wRkJRVUU3UVVGQlFUdEJRVUZCTEVWQlNURkZMRWxCUVVrN1FVRkJRU3hGUVVWS0xFbEJRVWtzVDBGQlR5eHJRa0ZCYTBJN1FVRkJRU3hKUVVGTkxGTkJRVk1zUlVGQlJTeFRRVUZUTEU5QlFVOHNUVUZCVFN4TlFVRk5MRTFCUVUwc1VVRkJVU3hOUVVGTkxFMUJRVTBzVlVGQlZUdEJRVUZCTEVWQlEzcEhPMEZCUVVFc1lVRkJVeXhGUVVGRkxGTkJRVk1zVDBGQlR5eE5RVUZOTEhsQ1FVRjVRaXhSUVVGUkxGZEJRVmNzVlVGQlZUdEJRVUZCTEVWQlJUVkdMRTlCUVU4N1FVRkJRVHNpTEFvZ0lDSmtaV0oxWjBsa0lqb2dJa1V4TnpneU4wRTJRelJDTWprd01EZzJORGMxTmtVeU1UWTBOelUyUlRJeElpd0tJQ0FpYm1GdFpYTWlPaUJiWFFwOVxuIiwiLy8gY29uZmlnLXNjaGVtYVxuXG5jb25zdCBtb2RlID0gXCJ0ZXN0XCI7XG5cbmV4cG9ydCBjb25zdCBjb25maWdTY2hlbWEgPSB7IGdldDogYXN5bmMgKCkgPT4ge1xuICByZXR1cm4geyBtb2RlLFxuICB9XG59fSIsImV4cG9ydCBkZWZhdWx0IHtcbn07XG4iLCIvLyNyZWdpb24gc3JjL2ludGVybmFsL19qc29uU3RyaW5naWZ5U3RyaW5nLnRzXG4vKipcbiogSW4gdGhlIHBhc3QsIG5hbWUgb2YgYHR5cGlhYCB3YXMgYHR5cGVzY3JpcHQtanNvbmAsIGFuZCBzdXBwb3J0ZWQgSlNPTlxuKiBzZXJpYWxpemF0aW9uIGJ5IHdyYXBwaW5nIGBmYXN0LWpzb24tc3RyaW5naWZ5LiBgdHlwZXNjcmlwdC1qc29uYHdhcyBhIGhlbHBlclxuKiBsaWJyYXJ5IG9mYGZhc3QtanNvbi1zdHJpbmdpZnlgLCB3aGljaCBjYW4gc2tpcCBtYW51YWwgSlNPTiBzY2hlbWEgZGVmaW5pdGlvblxuKiBqdXN0IGJ5IHB1dHRpbmcgcHVyZSBUeXBlU2NyaXB0IHR5cGUuXG4qXG4qIFRoaXMgYCRzdHJpbmdgIGZ1bmN0aW9uIGlzIGEgcGFydCBvZiBgZmFzdC1qc29uLXN0cmluZ2lmeWAgYXQgdGhhdCB0aW1lLCBhbmRcbiogc3RpbGwgYmVpbmcgdXNlZCBpbiBgdHlwaWFgIGZvciB0aGUgc3RyaW5nIHNlcmlhbGl6YXRpb24uXG4qXG4qIEByZWZlcmVuY2UgaHR0cHM6Ly9naXRodWIuY29tL2Zhc3RpZnkvZmFzdC1qc29uLXN0cmluZ2lmeS9ibG9iL21hc3Rlci9saWIvc2VyaWFsaXplci5qc1xuKiBAYmxvZyBodHRwczovL2Rldi50by9zYW1jaG9uL2dvb2QtYnllLXR5cGVzY3JpcHQtaXMtYW5jZXN0b3Itb2YtdHlwaWEtMjAwMDB4LWZhc3Rlci12YWxpZGF0b3ItNDlmaVxuKi9cbmNvbnN0IF9qc29uU3RyaW5naWZ5U3RyaW5nID0gKHN0cikgPT4ge1xuXHRjb25zdCBsZW4gPSBzdHIubGVuZ3RoO1xuXHRsZXQgcmVzdWx0ID0gXCJcIjtcblx0bGV0IGxhc3QgPSAtMTtcblx0bGV0IHBvaW50ID0gMjU1O1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0cG9pbnQgPSBzdHIuY2hhckNvZGVBdChpKTtcblx0XHRpZiAocG9pbnQgPCAzMikgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN0cik7XG5cdFx0aWYgKHBvaW50ID49IDU1Mjk2ICYmIHBvaW50IDw9IDU3MzQzKSByZXR1cm4gSlNPTi5zdHJpbmdpZnkoc3RyKTtcblx0XHRpZiAocG9pbnQgPT09IDM0IHx8IHBvaW50ID09PSA5Mikge1xuXHRcdFx0bGFzdCA9PT0gLTEgJiYgKGxhc3QgPSAwKTtcblx0XHRcdHJlc3VsdCArPSBzdHIuc2xpY2UobGFzdCwgaSkgKyBcIlxcXFxcIjtcblx0XHRcdGxhc3QgPSBpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbGFzdCA9PT0gLTEgJiYgXCJcXFwiXCIgKyBzdHIgKyBcIlxcXCJcIiB8fCBcIlxcXCJcIiArIHJlc3VsdCArIHN0ci5zbGljZShsYXN0KSArIFwiXFxcIlwiO1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX2pzb25TdHJpbmdpZnlTdHJpbmcgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X2pzb25TdHJpbmdpZnlTdHJpbmcubWpzLm1hcCIsIi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0LnRzXG5jb25zdCBfdmFsaWRhdGVSZXBvcnQgPSAoYXJyYXkpID0+IHtcblx0Y29uc3QgaXNBbmNlc3RvciA9IChhbmNlc3RvciwgZGVzY2VuZGFudCkgPT4gZGVzY2VuZGFudCA9PT0gYW5jZXN0b3IgfHwgZGVzY2VuZGFudC5zdGFydHNXaXRoKGAke2FuY2VzdG9yfS5gKSB8fCBkZXNjZW5kYW50LnN0YXJ0c1dpdGgoYCR7YW5jZXN0b3J9W2ApO1xuXHRjb25zdCByZXBvcnRhYmxlID0gKHBhdGgpID0+IHtcblx0XHRpZiAoYXJyYXkubGVuZ3RoID09PSAwKSByZXR1cm4gdHJ1ZTtcblx0XHRjb25zdCBsYXN0ID0gYXJyYXlbYXJyYXkubGVuZ3RoIC0gMV0ucGF0aDtcblx0XHRyZXR1cm4gaXNBbmNlc3RvcihwYXRoLCBsYXN0KSA9PT0gZmFsc2UgJiYgaXNBbmNlc3RvcihsYXN0LCBwYXRoKSA9PT0gZmFsc2U7XG5cdH07XG5cdHJldHVybiAoZXhjZXB0YWJsZSwgZXJyb3IpID0+IHtcblx0XHRpZiAoZXhjZXB0YWJsZSAmJiByZXBvcnRhYmxlKGVycm9yLnBhdGgpKSB7XG5cdFx0XHRpZiAoZXJyb3IudmFsdWUgPT09IHZvaWQgMCkgZXJyb3IuZGVzY3JpcHRpb24gPz89IFtcblx0XHRcdFx0XCJUaGUgdmFsdWUgYXQgdGhpcyBwYXRoIGlzIGB1bmRlZmluZWRgLlwiLFxuXHRcdFx0XHRcIlwiLFxuXHRcdFx0XHRgUGxlYXNlIGZpbGwgdGhlIFxcYCR7ZXJyb3IuZXhwZWN0ZWR9XFxgIHR5cGVkIHZhbHVlIG5leHQgdGltZS5gXG5cdFx0XHRdLmpvaW4oXCJcXG5cIik7XG5cdFx0XHRhcnJheS5wdXNoKGVycm9yKTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3ZhbGlkYXRlUmVwb3J0IH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV92YWxpZGF0ZVJlcG9ydC5tanMubWFwIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF9qc29uU3RyaW5naWZ5U3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19faW5kZXhUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9pbmRleC5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2luZGV4LmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5tZXNzYWdlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwibWVzc2FnZVwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5tZXNzYWdlIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLm1lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQubWVzc2FnZVxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2luZGV4VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19pbmRleFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wibWVzc2FnZVwiOiR7X2pzb25TdHJpbmdpZnlTdHJpbmdfMS5fanNvblN0cmluZ2lmeVN0cmluZyhpbnB1dC5tZXNzYWdlKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19faW5kZXhUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2luZG93L2Nsb3NlLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2luZG93L2Nsb3NlLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBcInt9XCI7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fY2xvc2VUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dpbmRvdy9nZXQtc3RhdGUuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvZ2V0LXN0YXRlLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNNYXhpbWl6ZWQgJiYgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc01pbmltaXplZDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImlzTWF4aW1pemVkXCIgPT09IGtleSB8fCBcImlzTWluaW1pemVkXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc01heGltaXplZCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc01heGltaXplZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNNYXhpbWl6ZWRcbiAgICAgICAgICAgIH0pLCBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmlzTWluaW1pemVkIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmlzTWluaW1pemVkXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5pc01pbmltaXplZFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19nZXRfc3RhdGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wiaXNNYXhpbWl6ZWRcIjoke1N0cmluZyhpbnB1dC5pc01heGltaXplZCl9LFwiaXNNaW5pbWl6ZWRcIjoke1N0cmluZyhpbnB1dC5pc01pbmltaXplZCl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dpbmRvdy9tYXhpbWl6ZS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dpbmRvdy9tYXhpbWl6ZS5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWF4aW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe30pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc01heGltaXplZDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImlzTWF4aW1pemVkXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc01heGltaXplZCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc01heGltaXplZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNNYXhpbWl6ZWRcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJpc01heGltaXplZFwiOiR7U3RyaW5nKGlucHV0LmlzTWF4aW1pemVkKX19YDtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19tYXhpbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWluaW1pemUuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy93aW5kb3cvbWluaW1pemUuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX193aW5kb3dfX21pbmltaXplVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IFwie31cIjtcbiAgICAgICAgICAgIHJldHVybiAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2luZG93X19taW5pbWl6ZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2FsbHBhcGVyL2NhbmNlbC5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dhbGxwYXBlci9jYW5jZWwuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc1dhbGxwYXBlcjtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImlzV2FsbHBhcGVyXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc1dhbGxwYXBlciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc1dhbGxwYXBlclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNXYWxscGFwZXJcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImlzV2FsbHBhcGVyXCI6JHtTdHJpbmcoaW5wdXQuaXNXYWxscGFwZXIpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvd2FsbHBhcGVyL3NldC5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL3dhbGxwYXBlci9zZXQuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpXG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9ybzAgPSAoX3JlY3Vyc2l2ZTogYm9vbGVhbiA9IGZhbHNlLCBfZGVwdGg6IG51bWJlciA9IDApOiBhbnkgPT4gKHt9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc1dhbGxwYXBlcjtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImlzV2FsbHBhcGVyXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5pc1dhbGxwYXBlciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pc1dhbGxwYXBlclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaXNXYWxscGFwZXJcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImlzV2FsbHBhcGVyXCI6JHtTdHJpbmcoaW5wdXQuaXNXYWxscGFwZXIpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fZGVjaW1hbC50c1xuY29uc3QgX2RlY2ltYWxEZWNvbXBvc2UgPSAodmFsdWUpID0+IHtcblx0aWYgKE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgPT09IGZhbHNlKSByZXR1cm4gbnVsbDtcblx0Y29uc3QgW21hbnRpc3NhID0gXCIwXCIsIGV4cG9uZW50VGV4dCA9IFwiMFwiXSA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoXCJlXCIpO1xuXHRjb25zdCBuZWdhdGl2ZSA9IG1hbnRpc3NhLnN0YXJ0c1dpdGgoXCItXCIpO1xuXHRjb25zdCB1bnNpZ25lZCA9IG5lZ2F0aXZlID8gbWFudGlzc2Euc2xpY2UoMSkgOiBtYW50aXNzYTtcblx0Y29uc3QgcG9pbnQgPSB1bnNpZ25lZC5pbmRleE9mKFwiLlwiKTtcblx0Y29uc3QgZGVjaW1hbHMgPSBwb2ludCA9PT0gLTEgPyAwIDogdW5zaWduZWQubGVuZ3RoIC0gcG9pbnQgLSAxO1xuXHRjb25zdCBkaWdpdHMgPSBCaWdJbnQodW5zaWduZWQucmVwbGFjZShcIi5cIiwgXCJcIikpO1xuXHRyZXR1cm4ge1xuXHRcdGNvZWZmaWNpZW50OiBuZWdhdGl2ZSA/IC1kaWdpdHMgOiBkaWdpdHMsXG5cdFx0ZXhwb25lbnQ6IE51bWJlcihleHBvbmVudFRleHQpIC0gZGVjaW1hbHNcblx0fTtcbn07XG5jb25zdCBfZGVjaW1hbERpdmlkZSA9ICh2YWx1ZSwgZGl2aXNvcikgPT4ge1xuXHRjb25zdCBkaXZpZGVuZCA9IF9kZWNpbWFsRGVjb21wb3NlKHZhbHVlKTtcblx0aWYgKGRpdmlkZW5kID09PSBudWxsIHx8IGRpdmlzb3IuY29lZmZpY2llbnQgPT09IEJpZ0ludCgwKSkgcmV0dXJuIG51bGw7XG5cdGNvbnN0IGV4cG9uZW50ID0gZGl2aWRlbmQuZXhwb25lbnQgLSBkaXZpc29yLmV4cG9uZW50O1xuXHRyZXR1cm4gZXhwb25lbnQgPj0gMCA/IHtcblx0XHRudW1lcmF0b3I6IGRpdmlkZW5kLmNvZWZmaWNpZW50ICogX2RlY2ltYWxQb3dlcihleHBvbmVudCksXG5cdFx0ZGVub21pbmF0b3I6IGRpdmlzb3IuY29lZmZpY2llbnRcblx0fSA6IHtcblx0XHRudW1lcmF0b3I6IGRpdmlkZW5kLmNvZWZmaWNpZW50LFxuXHRcdGRlbm9taW5hdG9yOiBkaXZpc29yLmNvZWZmaWNpZW50ICogX2RlY2ltYWxQb3dlcigtZXhwb25lbnQpXG5cdH07XG59O1xuY29uc3QgX2RlY2ltYWxJbnRlZ2VyU3RlcCA9ICh2YWx1ZSkgPT4ge1xuXHRjb25zdCBkZWNpbWFsID0gX2RlY2ltYWxEZWNvbXBvc2UodmFsdWUpO1xuXHRpZiAoZGVjaW1hbCA9PT0gbnVsbCB8fCBkZWNpbWFsLmNvZWZmaWNpZW50IDw9IEJpZ0ludCgwKSkgcmV0dXJuIG51bGw7XG5cdGlmIChkZWNpbWFsLmV4cG9uZW50ID49IDApIHJldHVybiB7XG5cdFx0Y29lZmZpY2llbnQ6IGRlY2ltYWwuY29lZmZpY2llbnQgKiBfZGVjaW1hbFBvd2VyKGRlY2ltYWwuZXhwb25lbnQpLFxuXHRcdGV4cG9uZW50OiAwXG5cdH07XG5cdGNvbnN0IGRlbm9taW5hdG9yID0gX2RlY2ltYWxQb3dlcigtZGVjaW1hbC5leHBvbmVudCk7XG5cdHJldHVybiB7XG5cdFx0Y29lZmZpY2llbnQ6IGRlY2ltYWwuY29lZmZpY2llbnQgLyBfZGVjaW1hbEdjZChkZWNpbWFsLmNvZWZmaWNpZW50LCBkZW5vbWluYXRvciksXG5cdFx0ZXhwb25lbnQ6IDBcblx0fTtcbn07XG5jb25zdCBfZGVjaW1hbFRvTnVtYmVyID0gKHZhbHVlKSA9PiBOdW1iZXIoYCR7dmFsdWUuY29lZmZpY2llbnR9ZSR7dmFsdWUuZXhwb25lbnR9YCk7XG5jb25zdCBfZGVjaW1hbFBvd2VyID0gKGV4cG9uZW50KSA9PiBCaWdJbnQoMTApICoqIEJpZ0ludChleHBvbmVudCk7XG5jb25zdCBfZGVjaW1hbEdjZCA9ICh4LCB5KSA9PiB7XG5cdHdoaWxlICh5ICE9PSBCaWdJbnQoMCkpIFt4LCB5XSA9IFt5LCB4ICUgeV07XG5cdHJldHVybiB4IDwgQmlnSW50KDApID8gLXggOiB4O1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX2RlY2ltYWxEZWNvbXBvc2UsIF9kZWNpbWFsRGl2aWRlLCBfZGVjaW1hbEdjZCwgX2RlY2ltYWxJbnRlZ2VyU3RlcCwgX2RlY2ltYWxQb3dlciwgX2RlY2ltYWxUb051bWJlciB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fZGVjaW1hbC5tanMubWFwIiwiaW1wb3J0IHsgX2RlY2ltYWxEZWNvbXBvc2UsIF9kZWNpbWFsRGl2aWRlIH0gZnJvbSBcIi4vX2RlY2ltYWwubWpzXCI7XG4vLyNyZWdpb24gc3JjL2ludGVybmFsL19pc011bHRpcGxlT2YudHNcbmNvbnN0IF9pc011bHRpcGxlT2YgPSAodmFsdWUsIG11bHRpcGxlT2YpID0+IHtcblx0Y29uc3QgZGl2aXNvciA9IF9kZWNpbWFsRGVjb21wb3NlKG11bHRpcGxlT2YpO1xuXHRpZiAoZGl2aXNvciA9PT0gbnVsbCB8fCBkaXZpc29yLmNvZWZmaWNpZW50IDw9IEJpZ0ludCgwKSkgcmV0dXJuIGZhbHNlO1xuXHRjb25zdCByYXRpbyA9IF9kZWNpbWFsRGl2aWRlKHZhbHVlLCBkaXZpc29yKTtcblx0cmV0dXJuIHJhdGlvICE9PSBudWxsICYmIHJhdGlvLm51bWVyYXRvciAlIHJhdGlvLmRlbm9taW5hdG9yID09PSBCaWdJbnQoMCk7XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBfaXNNdWx0aXBsZU9mIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9pc011bHRpcGxlT2YubWpzLm1hcCIsImltcG9ydCB7IF9kZWNpbWFsRGVjb21wb3NlLCBfZGVjaW1hbERpdmlkZSwgX2RlY2ltYWxHY2QsIF9kZWNpbWFsSW50ZWdlclN0ZXAsIF9kZWNpbWFsUG93ZXIsIF9kZWNpbWFsVG9OdW1iZXIgfSBmcm9tIFwiLi9fZGVjaW1hbC5tanNcIjtcbmltcG9ydCB7IF9pc011bHRpcGxlT2YgfSBmcm9tIFwiLi9faXNNdWx0aXBsZU9mLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tTXVsdGlwbGUudHNcbmNvbnN0IF9yYW5kb21NdWx0aXBsZSA9IChwcm9wcykgPT4ge1xuXHRjb25zdCBzdGVwID0gcHJvcHMuaW50ZWdlciA/IF9kZWNpbWFsSW50ZWdlclN0ZXAocHJvcHMubXVsdGlwbGVPZikgOiBfZGVjaW1hbERlY29tcG9zZShwcm9wcy5tdWx0aXBsZU9mKTtcblx0aWYgKHN0ZXAgPT09IG51bGwgfHwgc3RlcC5jb2VmZmljaWVudCA8PSBCaWdJbnQoMCkpIHRocm93IG5ldyBFcnJvcihcIlRoZSBtdWx0aXBsZU9mIHZhbHVlIG11c3QgYmUgYSBwb3NpdGl2ZSBmaW5pdGUgbnVtYmVyLlwiKTtcblx0Y29uc3QgbG93ZXIgPSBfZGVjaW1hbERpdmlkZShwcm9wcy5taW5pbXVtLCBzdGVwKTtcblx0Y29uc3QgdXBwZXIgPSBfZGVjaW1hbERpdmlkZShwcm9wcy5tYXhpbXVtLCBzdGVwKTtcblx0aWYgKGxvd2VyID09PSBudWxsIHx8IHVwcGVyID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgcmFuZG9tIG51bWJlciByYW5nZSBtdXN0IGJlIGZpbml0ZS5cIik7XG5cdGNvbnN0IG1pbmltdW0gPSBsb3dlckJvdW5kKGxvd2VyLCBwcm9wcy5leGNsdXNpdmVNaW5pbXVtKTtcblx0Y29uc3QgbWF4aW11bSA9IHVwcGVyQm91bmQodXBwZXIsIHByb3BzLmV4Y2x1c2l2ZU1heGltdW0pO1xuXHRpZiAobWluaW11bSA+IG1heGltdW0pIHRocm93IG5ldyBFcnJvcihcIlRoZSByYW5nZSBkb2VzIG5vdCBjb250YWluIGEgbXVsdGlwbGVPZiB2YWx1ZS5cIik7XG5cdGNvbnN0IHNlbGVjdGVkID0gcmFuZG9tQmlnaW50KG1pbmltdW0sIG1heGltdW0pO1xuXHRjb25zdCBjYW5kaWRhdGVzID0gdW5pcXVlKFtcblx0XHRzZWxlY3RlZCxcblx0XHRtaW5pbXVtLFxuXHRcdG1heGltdW0sXG5cdFx0Y2xhbXAoQmlnSW50KDApLCBtaW5pbXVtLCBtYXhpbXVtKSxcblx0XHRjbGFtcChCaWdJbnQoMSksIG1pbmltdW0sIG1heGltdW0pLFxuXHRcdGNsYW1wKEJpZ0ludCgtMSksIG1pbmltdW0sIG1heGltdW0pLFxuXHRcdC4uLm5lYXJieShzZWxlY3RlZCwgbWluaW11bSwgbWF4aW11bSlcblx0XSk7XG5cdGZvciAoY29uc3QgY29lZmZpY2llbnQgb2YgY2FuZGlkYXRlcykge1xuXHRcdGNvbnN0IHZhbHVlID0gX2RlY2ltYWxUb051bWJlcih7XG5cdFx0XHRjb2VmZmljaWVudDogc3RlcC5jb2VmZmljaWVudCAqIGNvZWZmaWNpZW50LFxuXHRcdFx0ZXhwb25lbnQ6IHN0ZXAuZXhwb25lbnRcblx0XHR9KTtcblx0XHRpZiAoaXNWYWxpZChwcm9wcywgdmFsdWUpKSByZXR1cm4gdmFsdWU7XG5cdH1cblx0Y29uc3QgYWxpZ25lZCA9IGZpbmRSZXByZXNlbnRhYmxlSW50ZWdlck11bHRpcGxlKHByb3BzKTtcblx0aWYgKGFsaWduZWQgIT09IG51bGwpIHJldHVybiBhbGlnbmVkO1xuXHRjb25zdCBkZWNpbWFsQWxpZ25lZCA9IGZpbmRSZXByZXNlbnRhYmxlRGVjaW1hbE11bHRpcGxlKHByb3BzLCBzdGVwKTtcblx0aWYgKGRlY2ltYWxBbGlnbmVkICE9PSBudWxsKSByZXR1cm4gZGVjaW1hbEFsaWduZWQ7XG5cdHRocm93IG5ldyBFcnJvcihcIlRoZSByYW5nZSBkb2VzIG5vdCBjb250YWluIGEgcmVwcmVzZW50YWJsZSBtdWx0aXBsZU9mIHZhbHVlLlwiKTtcbn07XG5jb25zdCBpc1ZhbGlkID0gKHByb3BzLCB2YWx1ZSkgPT4gTnVtYmVyLmlzRmluaXRlKHZhbHVlKSAmJiAocHJvcHMuaW50ZWdlciA9PT0gZmFsc2UgfHwgTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpICYmIChwcm9wcy5leGNsdXNpdmVNaW5pbXVtID8gdmFsdWUgPiBwcm9wcy5taW5pbXVtIDogdmFsdWUgPj0gcHJvcHMubWluaW11bSkgJiYgKHByb3BzLmV4Y2x1c2l2ZU1heGltdW0gPyB2YWx1ZSA8IHByb3BzLm1heGltdW0gOiB2YWx1ZSA8PSBwcm9wcy5tYXhpbXVtKSAmJiBfaXNNdWx0aXBsZU9mKHZhbHVlLCBwcm9wcy5tdWx0aXBsZU9mKTtcbmNvbnN0IGZpbmRSZXByZXNlbnRhYmxlRGVjaW1hbE11bHRpcGxlID0gKHByb3BzLCBzdGVwKSA9PiB7XG5cdGNvbnN0IGxpbWl0ID0gQmlnSW50KFwiOTk5OTk5OTk5OTk5OTk5XCIpO1xuXHRmb3IgKGxldCBleHBvbmVudCA9IC0zMjQ7IGV4cG9uZW50IDw9IDMwODsgKytleHBvbmVudCkge1xuXHRcdGNvbnN0IHVuaXQgPSB7XG5cdFx0XHRjb2VmZmljaWVudDogQmlnSW50KDEpLFxuXHRcdFx0ZXhwb25lbnRcblx0XHR9O1xuXHRcdGNvbnN0IGxvd2VyID0gX2RlY2ltYWxEaXZpZGUocHJvcHMubWluaW11bSwgdW5pdCk7XG5cdFx0Y29uc3QgdXBwZXIgPSBfZGVjaW1hbERpdmlkZShwcm9wcy5tYXhpbXVtLCB1bml0KTtcblx0XHRpZiAobG93ZXIgPT09IG51bGwgfHwgdXBwZXIgPT09IG51bGwpIHJldHVybiBudWxsO1xuXHRcdGNvbnN0IGNvZWZmaWNpZW50TWluaW11bSA9IG1heCgtbGltaXQsIGxvd2VyQm91bmQobG93ZXIsIHByb3BzLmV4Y2x1c2l2ZU1pbmltdW0pKTtcblx0XHRjb25zdCBjb2VmZmljaWVudE1heGltdW0gPSBtaW4obGltaXQsIHVwcGVyQm91bmQodXBwZXIsIHByb3BzLmV4Y2x1c2l2ZU1heGltdW0pKTtcblx0XHRpZiAoY29lZmZpY2llbnRNaW5pbXVtID4gY29lZmZpY2llbnRNYXhpbXVtKSBjb250aW51ZTtcblx0XHRjb25zdCBjb2VmZmljaWVudFN0ZXAgPSBkZWNpbWFsQ29lZmZpY2llbnRTdGVwKHN0ZXAsIGV4cG9uZW50KTtcblx0XHRjb25zdCBtaW5pbXVtID0gbG93ZXJCb3VuZCh7XG5cdFx0XHRudW1lcmF0b3I6IGNvZWZmaWNpZW50TWluaW11bSxcblx0XHRcdGRlbm9taW5hdG9yOiBjb2VmZmljaWVudFN0ZXBcblx0XHR9LCBmYWxzZSk7XG5cdFx0Y29uc3QgbWF4aW11bSA9IHVwcGVyQm91bmQoe1xuXHRcdFx0bnVtZXJhdG9yOiBjb2VmZmljaWVudE1heGltdW0sXG5cdFx0XHRkZW5vbWluYXRvcjogY29lZmZpY2llbnRTdGVwXG5cdFx0fSwgZmFsc2UpO1xuXHRcdGlmIChtaW5pbXVtID4gbWF4aW11bSkgY29udGludWU7XG5cdFx0Y29uc3Qgc2VsZWN0ZWQgPSByYW5kb21CaWdpbnQobWluaW11bSwgbWF4aW11bSk7XG5cdFx0Zm9yIChjb25zdCBxdW90aWVudCBvZiB1bmlxdWUoW1xuXHRcdFx0c2VsZWN0ZWQsXG5cdFx0XHRtaW5pbXVtLFxuXHRcdFx0bWF4aW11bSxcblx0XHRcdGNsYW1wKEJpZ0ludCgwKSwgbWluaW11bSwgbWF4aW11bSksXG5cdFx0XHQuLi5uZWFyYnkoc2VsZWN0ZWQsIG1pbmltdW0sIG1heGltdW0pXG5cdFx0XSkpIHtcblx0XHRcdGNvbnN0IHZhbHVlID0gX2RlY2ltYWxUb051bWJlcih7XG5cdFx0XHRcdGNvZWZmaWNpZW50OiBjb2VmZmljaWVudFN0ZXAgKiBxdW90aWVudCxcblx0XHRcdFx0ZXhwb25lbnRcblx0XHRcdH0pO1xuXHRcdFx0aWYgKGlzVmFsaWQocHJvcHMsIHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5jb25zdCBkZWNpbWFsQ29lZmZpY2llbnRTdGVwID0gKHN0ZXAsIGV4cG9uZW50KSA9PiB7XG5cdGNvbnN0IGRpZmZlcmVuY2UgPSBleHBvbmVudCAtIHN0ZXAuZXhwb25lbnQ7XG5cdGlmIChkaWZmZXJlbmNlID49IDApIHtcblx0XHRjb25zdCBwb3dlciA9IF9kZWNpbWFsUG93ZXIoZGlmZmVyZW5jZSk7XG5cdFx0cmV0dXJuIHN0ZXAuY29lZmZpY2llbnQgLyBfZGVjaW1hbEdjZChzdGVwLmNvZWZmaWNpZW50LCBwb3dlcik7XG5cdH1cblx0cmV0dXJuIHN0ZXAuY29lZmZpY2llbnQgKiBfZGVjaW1hbFBvd2VyKC1kaWZmZXJlbmNlKTtcbn07XG5jb25zdCBmaW5kUmVwcmVzZW50YWJsZUludGVnZXJNdWx0aXBsZSA9IChwcm9wcykgPT4ge1xuXHRjb25zdCBzdGVwID0gX2RlY2ltYWxJbnRlZ2VyU3RlcChwcm9wcy5tdWx0aXBsZU9mKTtcblx0aWYgKHN0ZXAgPT09IG51bGwpIHJldHVybiBudWxsO1xuXHRjb25zdCB1bml0ID0ge1xuXHRcdGNvZWZmaWNpZW50OiBCaWdJbnQoMSksXG5cdFx0ZXhwb25lbnQ6IDBcblx0fTtcblx0Y29uc3QgbG93ZXIgPSBfZGVjaW1hbERpdmlkZShwcm9wcy5taW5pbXVtLCB1bml0KTtcblx0Y29uc3QgdXBwZXIgPSBfZGVjaW1hbERpdmlkZShwcm9wcy5tYXhpbXVtLCB1bml0KTtcblx0aWYgKGxvd2VyID09PSBudWxsIHx8IHVwcGVyID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0Y29uc3QgbWluaW11bSA9IGxvd2VyQm91bmQobG93ZXIsIHByb3BzLmV4Y2x1c2l2ZU1pbmltdW0pO1xuXHRjb25zdCBtYXhpbXVtID0gdXBwZXJCb3VuZCh1cHBlciwgcHJvcHMuZXhjbHVzaXZlTWF4aW11bSk7XG5cdGlmIChtaW5pbXVtID4gbWF4aW11bSkgcmV0dXJuIG51bGw7XG5cdGlmIChtaW5pbXVtIDw9IEJpZ0ludCgwKSAmJiBtYXhpbXVtID49IEJpZ0ludCgwKSkgcmV0dXJuIDA7XG5cdGNvbnN0IGNhbmRpZGF0ZSA9IG1pbmltdW0gPiBCaWdJbnQoMCkgPyBmaW5kUG9zaXRpdmVBbGlnbmVkKG1pbmltdW0sIG1heGltdW0sIHN0ZXAuY29lZmZpY2llbnQpIDogKCgpID0+IHtcblx0XHRjb25zdCBtYWduaXR1ZGUgPSBmaW5kUG9zaXRpdmVBbGlnbmVkKC1tYXhpbXVtLCAtbWluaW11bSwgc3RlcC5jb2VmZmljaWVudCk7XG5cdFx0cmV0dXJuIG1hZ25pdHVkZSA9PT0gbnVsbCA/IG51bGwgOiAtbWFnbml0dWRlO1xuXHR9KSgpO1xuXHRpZiAoY2FuZGlkYXRlID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0Y29uc3QgdmFsdWUgPSBOdW1iZXIoY2FuZGlkYXRlKTtcblx0cmV0dXJuIGlzVmFsaWQocHJvcHMsIHZhbHVlKSA/IHZhbHVlIDogbnVsbDtcbn07XG5jb25zdCBmaW5kUG9zaXRpdmVBbGlnbmVkID0gKG1pbmltdW0sIG1heGltdW0sIGludGVnZXJTdGVwKSA9PiB7XG5cdGNvbnN0IGZpcnN0ID0gYml0TGVuZ3RoKG1pbmltdW0pIC0gMTtcblx0Y29uc3QgbGFzdCA9IGJpdExlbmd0aChtYXhpbXVtKSAtIDE7XG5cdGZvciAobGV0IGV4cG9uZW50ID0gZmlyc3Q7IGV4cG9uZW50IDw9IGxhc3Q7ICsrZXhwb25lbnQpIHtcblx0XHRjb25zdCBiYW5kTWluaW11bSA9IG1heChtaW5pbXVtLCBCaWdJbnQoMSkgPDwgQmlnSW50KGV4cG9uZW50KSk7XG5cdFx0Y29uc3QgYmFuZE1heGltdW0gPSBtaW4obWF4aW11bSwgKEJpZ0ludCgxKSA8PCBCaWdJbnQoZXhwb25lbnQgKyAxKSkgLSBCaWdJbnQoMSkpO1xuXHRcdGNvbnN0IHF1YW50dW0gPSBleHBvbmVudCA8PSA1MiA/IEJpZ0ludCgxKSA6IEJpZ0ludCgxKSA8PCBCaWdJbnQoZXhwb25lbnQgLSA1Mik7XG5cdFx0Y29uc3QgYWxpZ25lZFN0ZXAgPSBpbnRlZ2VyU3RlcCAvIF9kZWNpbWFsR2NkKGludGVnZXJTdGVwLCBxdWFudHVtKSAqIHF1YW50dW07XG5cdFx0Y29uc3QgbG93ZXIgPSBsb3dlckJvdW5kKHtcblx0XHRcdG51bWVyYXRvcjogYmFuZE1pbmltdW0sXG5cdFx0XHRkZW5vbWluYXRvcjogYWxpZ25lZFN0ZXBcblx0XHR9LCBmYWxzZSk7XG5cdFx0Y29uc3QgdXBwZXIgPSB1cHBlckJvdW5kKHtcblx0XHRcdG51bWVyYXRvcjogYmFuZE1heGltdW0sXG5cdFx0XHRkZW5vbWluYXRvcjogYWxpZ25lZFN0ZXBcblx0XHR9LCBmYWxzZSk7XG5cdFx0aWYgKGxvd2VyIDw9IHVwcGVyKSByZXR1cm4gcmFuZG9tQmlnaW50KGxvd2VyLCB1cHBlcikgKiBhbGlnbmVkU3RlcDtcblx0fVxuXHRyZXR1cm4gbnVsbDtcbn07XG5jb25zdCBiaXRMZW5ndGggPSAodmFsdWUpID0+IHZhbHVlLnRvU3RyaW5nKDIpLmxlbmd0aDtcbmNvbnN0IG1pbiA9ICh4LCB5KSA9PiB4IDwgeSA/IHggOiB5O1xuY29uc3QgbWF4ID0gKHgsIHkpID0+IHggPiB5ID8geCA6IHk7XG5jb25zdCBsb3dlckJvdW5kID0gKHJhdGlvLCBleGNsdXNpdmUpID0+IHtcblx0Y29uc3QgcXVvdGllbnQgPSByYXRpby5udW1lcmF0b3IgLyByYXRpby5kZW5vbWluYXRvcjtcblx0Y29uc3QgcmVtYWluZGVyID0gcmF0aW8ubnVtZXJhdG9yICUgcmF0aW8uZGVub21pbmF0b3I7XG5cdHJldHVybiBxdW90aWVudCArIChyZW1haW5kZXIgPiBCaWdJbnQoMCkgPyBCaWdJbnQoMSkgOiBCaWdJbnQoMCkpICsgKGV4Y2x1c2l2ZSAmJiByZW1haW5kZXIgPT09IEJpZ0ludCgwKSA/IEJpZ0ludCgxKSA6IEJpZ0ludCgwKSk7XG59O1xuY29uc3QgdXBwZXJCb3VuZCA9IChyYXRpbywgZXhjbHVzaXZlKSA9PiB7XG5cdGNvbnN0IHF1b3RpZW50ID0gcmF0aW8ubnVtZXJhdG9yIC8gcmF0aW8uZGVub21pbmF0b3I7XG5cdGNvbnN0IHJlbWFpbmRlciA9IHJhdGlvLm51bWVyYXRvciAlIHJhdGlvLmRlbm9taW5hdG9yO1xuXHRyZXR1cm4gcXVvdGllbnQgLSAocmVtYWluZGVyIDwgQmlnSW50KDApID8gQmlnSW50KDEpIDogQmlnSW50KDApKSAtIChleGNsdXNpdmUgJiYgcmVtYWluZGVyID09PSBCaWdJbnQoMCkgPyBCaWdJbnQoMSkgOiBCaWdJbnQoMCkpO1xufTtcbmNvbnN0IHJhbmRvbUJpZ2ludCA9IChtaW5pbXVtLCBtYXhpbXVtKSA9PiB7XG5cdGNvbnN0IHNjYWxlID0gQmlnSW50KDEpIDw8IEJpZ0ludCg1Myk7XG5cdGNvbnN0IHNhbXBsZSA9IEJpZ0ludChNYXRoLm1pbihOdW1iZXIoc2NhbGUgLSBCaWdJbnQoMSkpLCBNYXRoLmZsb29yKE1hdGgubWF4KDAsIE1hdGgucmFuZG9tKCkpICogTnVtYmVyKHNjYWxlKSkpKTtcblx0cmV0dXJuIG1pbmltdW0gKyAobWF4aW11bSAtIG1pbmltdW0gKyBCaWdJbnQoMSkpICogc2FtcGxlIC8gc2NhbGU7XG59O1xuY29uc3QgY2xhbXAgPSAodmFsdWUsIG1pbmltdW0sIG1heGltdW0pID0+IHZhbHVlIDwgbWluaW11bSA/IG1pbmltdW0gOiB2YWx1ZSA+IG1heGltdW0gPyBtYXhpbXVtIDogdmFsdWU7XG5jb25zdCBuZWFyYnkgPSAoc2VsZWN0ZWQsIG1pbmltdW0sIG1heGltdW0pID0+IHtcblx0Y29uc3Qgb3V0cHV0ID0gW107XG5cdGZvciAobGV0IGRpc3RhbmNlID0gQmlnSW50KDEpOyBkaXN0YW5jZSA8PSBCaWdJbnQoMzIpOyArK2Rpc3RhbmNlKSB7XG5cdFx0aWYgKHNlbGVjdGVkIC0gZGlzdGFuY2UgPj0gbWluaW11bSkgb3V0cHV0LnB1c2goc2VsZWN0ZWQgLSBkaXN0YW5jZSk7XG5cdFx0aWYgKHNlbGVjdGVkICsgZGlzdGFuY2UgPD0gbWF4aW11bSkgb3V0cHV0LnB1c2goc2VsZWN0ZWQgKyBkaXN0YW5jZSk7XG5cdH1cblx0cmV0dXJuIG91dHB1dDtcbn07XG5jb25zdCB1bmlxdWUgPSAodmFsdWVzKSA9PiBbLi4ubmV3IFNldCh2YWx1ZXMpXTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3JhbmRvbU11bHRpcGxlIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9yYW5kb21NdWx0aXBsZS5tanMubWFwIiwiaW1wb3J0IHsgX3JhbmRvbU11bHRpcGxlIH0gZnJvbSBcIi4vX3JhbmRvbU11bHRpcGxlLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tSW50ZWdlci50c1xuY29uc3QgX3JhbmRvbUludGVnZXIgPSAoc2NoZW1hKSA9PiB7XG5cdGNvbnN0IGxvd2VyID0gZ2V0TG93ZXJCb3VuZGFyeShzY2hlbWEpO1xuXHRjb25zdCB1cHBlciA9IGdldFVwcGVyQm91bmRhcnkoc2NoZW1hKTtcblx0Y29uc3QgbWluaW11bSA9IGxvd2VyPy52YWx1ZSA/PyAodXBwZXIgPT09IG51bGwgPyAwIDogdXBwZXIudmFsdWUgLSAxMDApO1xuXHRjb25zdCBtYXhpbXVtID0gdXBwZXI/LnZhbHVlID8/IChsb3dlciA9PT0gbnVsbCA/IDEwMCA6IGxvd2VyLnZhbHVlICsgMTAwKTtcblx0aWYgKG1pbmltdW0gPiBtYXhpbXVtKSB0aHJvdyBuZXcgRXJyb3IoXCJNaW5pbXVtIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiBtYXhpbXVtIHZhbHVlLlwiKTtcblx0cmV0dXJuIHNjaGVtYS5tdWx0aXBsZU9mID09PSB2b2lkIDAgPyBzY2FsYXIoe1xuXHRcdG1pbmltdW0sXG5cdFx0bWF4aW11bVxuXHR9KSA6IF9yYW5kb21NdWx0aXBsZSh7XG5cdFx0bWluaW11bSxcblx0XHRtYXhpbXVtLFxuXHRcdG11bHRpcGxlT2Y6IHNjaGVtYS5tdWx0aXBsZU9mLFxuXHRcdGV4Y2x1c2l2ZU1pbmltdW06IGxvd2VyPy5leGNsdXNpdmUgPz8gZmFsc2UsXG5cdFx0ZXhjbHVzaXZlTWF4aW11bTogdXBwZXI/LmV4Y2x1c2l2ZSA/PyBmYWxzZSxcblx0XHRpbnRlZ2VyOiB0cnVlXG5cdH0pO1xufTtcbmNvbnN0IHNjYWxhciA9IChwcm9wcykgPT4ge1xuXHRjb25zdCBtaW5pbXVtID0gTWF0aC5jZWlsKHByb3BzLm1pbmltdW0pO1xuXHRjb25zdCBtYXhpbXVtID0gTWF0aC5mbG9vcihwcm9wcy5tYXhpbXVtKTtcblx0aWYgKG1pbmltdW0gPiBtYXhpbXVtKSB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgaW50ZWdlciByYW5nZSBpcyBlbXB0eS5cIik7XG5cdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4aW11bSAtIG1pbmltdW0gKyAxKSkgKyBtaW5pbXVtO1xufTtcbmNvbnN0IGdldExvd2VyQm91bmRhcnkgPSAoc2NoZW1hKSA9PiB7XG5cdGNvbnN0IGluY2x1c2l2ZSA9IHNjaGVtYS5taW5pbXVtID09PSB2b2lkIDAgPyBudWxsIDoge1xuXHRcdHZhbHVlOiBzY2hlbWEubWluaW11bSxcblx0XHRleGNsdXNpdmU6IGZhbHNlXG5cdH07XG5cdGNvbnN0IGV4Y2x1c2l2ZSA9IHNjaGVtYS5leGNsdXNpdmVNaW5pbXVtID09PSB2b2lkIDAgPyBudWxsIDoge1xuXHRcdHZhbHVlOiBzY2hlbWEuZXhjbHVzaXZlTWluaW11bSxcblx0XHRleGNsdXNpdmU6IHRydWVcblx0fTtcblx0Y29uc3Qgc2VsZWN0ZWQgPSBzZWxlY3RCb3VuZGFyeShpbmNsdXNpdmUsIGV4Y2x1c2l2ZSwgTWF0aC5tYXgpO1xuXHRpZiAoc2VsZWN0ZWQgPT09IG51bGwpIHJldHVybiBudWxsO1xuXHRyZXR1cm4ge1xuXHRcdHZhbHVlOiBzZWxlY3RlZC5leGNsdXNpdmUgPyBNYXRoLmZsb29yKHNlbGVjdGVkLnZhbHVlKSArIDEgOiBNYXRoLmNlaWwoc2VsZWN0ZWQudmFsdWUpLFxuXHRcdGV4Y2x1c2l2ZTogZmFsc2Vcblx0fTtcbn07XG5jb25zdCBnZXRVcHBlckJvdW5kYXJ5ID0gKHNjaGVtYSkgPT4ge1xuXHRjb25zdCBpbmNsdXNpdmUgPSBzY2hlbWEubWF4aW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0XHR2YWx1ZTogc2NoZW1hLm1heGltdW0sXG5cdFx0ZXhjbHVzaXZlOiBmYWxzZVxuXHR9O1xuXHRjb25zdCBleGNsdXNpdmUgPSBzY2hlbWEuZXhjbHVzaXZlTWF4aW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0XHR2YWx1ZTogc2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0sXG5cdFx0ZXhjbHVzaXZlOiB0cnVlXG5cdH07XG5cdGNvbnN0IHNlbGVjdGVkID0gc2VsZWN0Qm91bmRhcnkoaW5jbHVzaXZlLCBleGNsdXNpdmUsIE1hdGgubWluKTtcblx0aWYgKHNlbGVjdGVkID09PSBudWxsKSByZXR1cm4gbnVsbDtcblx0cmV0dXJuIHtcblx0XHR2YWx1ZTogc2VsZWN0ZWQuZXhjbHVzaXZlID8gTWF0aC5jZWlsKHNlbGVjdGVkLnZhbHVlKSAtIDEgOiBNYXRoLmZsb29yKHNlbGVjdGVkLnZhbHVlKSxcblx0XHRleGNsdXNpdmU6IGZhbHNlXG5cdH07XG59O1xuY29uc3Qgc2VsZWN0Qm91bmRhcnkgPSAoeCwgeSwgY29tcGFyZSkgPT4ge1xuXHRpZiAoeCA9PT0gbnVsbCkgcmV0dXJuIHk7XG5cdGlmICh5ID09PSBudWxsKSByZXR1cm4geDtcblx0aWYgKHgudmFsdWUgPT09IHkudmFsdWUpIHJldHVybiB7XG5cdFx0dmFsdWU6IHgudmFsdWUsXG5cdFx0ZXhjbHVzaXZlOiB4LmV4Y2x1c2l2ZSB8fCB5LmV4Y2x1c2l2ZVxuXHR9O1xuXHRyZXR1cm4gY29tcGFyZSh4LnZhbHVlLCB5LnZhbHVlKSA9PT0geC52YWx1ZSA/IHggOiB5O1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3JhbmRvbUludGVnZXIgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X3JhbmRvbUludGVnZXIubWpzLm1hcCIsImltcG9ydCB7IF9yYW5kb21JbnRlZ2VyIH0gZnJvbSBcIi4vX3JhbmRvbUludGVnZXIubWpzXCI7XG4vLyNyZWdpb24gc3JjL2ludGVybmFsL19yYW5kb21TdHJpbmcudHNcbmNvbnN0IERFRkFVTFRfTUlOX0xFTkdUSCA9IDU7XG5jb25zdCBERUZBVUxUX1JBTkdFID0gNTtcbmNvbnN0IF9yYW5kb21TdHJpbmcgPSAocHJvcHMpID0+IHtcblx0Y29uc3QgbWluaW11bSA9IHByb3BzLm1pbkxlbmd0aCA/PyBNYXRoLm1pbihwcm9wcy5tYXhMZW5ndGggPz8gREVGQVVMVF9NSU5fTEVOR1RILCBERUZBVUxUX01JTl9MRU5HVEgpO1xuXHRjb25zdCBsZW5ndGggPSBfcmFuZG9tSW50ZWdlcih7XG5cdFx0dHlwZTogXCJpbnRlZ2VyXCIsXG5cdFx0bWluaW11bSxcblx0XHRtYXhpbXVtOiBwcm9wcy5tYXhMZW5ndGggPz8gbWluaW11bSArIERFRkFVTFRfUkFOR0Vcblx0fSk7XG5cdHJldHVybiBuZXcgQXJyYXkobGVuZ3RoKS5maWxsKDApLm1hcCgoKSA9PiBBTFBIQUJFVFNbcmFuZG9tKCldKS5qb2luKFwiXCIpO1xufTtcbmNvbnN0IEFMUEhBQkVUUyA9IFwiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIjtcbmNvbnN0IHJhbmRvbSA9ICgpID0+IF9yYW5kb21JbnRlZ2VyKHtcblx0dHlwZTogXCJpbnRlZ2VyXCIsXG5cdG1pbmltdW06IDAsXG5cdG1heGltdW06IDI1XG59KTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3JhbmRvbVN0cmluZyB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fcmFuZG9tU3RyaW5nLm1qcy5tYXAiLCJpbXBvcnQgeyBfcmFuZG9tTXVsdGlwbGUgfSBmcm9tIFwiLi9fcmFuZG9tTXVsdGlwbGUubWpzXCI7XG4vLyNyZWdpb24gc3JjL2ludGVybmFsL19yYW5kb21OdW1iZXIudHNcbmNvbnN0IF9yYW5kb21OdW1iZXIgPSAoc2NoZW1hKSA9PiB7XG5cdGNvbnN0IGxvd2VyID0gZ2V0TG93ZXJCb3VuZGFyeShzY2hlbWEpO1xuXHRjb25zdCB1cHBlciA9IGdldFVwcGVyQm91bmRhcnkoc2NoZW1hKTtcblx0Y29uc3QgbWluaW11bSA9IGxvd2VyPy52YWx1ZSA/PyAodXBwZXIgPT09IG51bGwgPyAwIDogdXBwZXIudmFsdWUgLSAxMDApO1xuXHRjb25zdCBtYXhpbXVtID0gdXBwZXI/LnZhbHVlID8/IChsb3dlciA9PT0gbnVsbCA/IDEwMCA6IGxvd2VyLnZhbHVlICsgMTAwKTtcblx0aWYgKG1pbmltdW0gPiBtYXhpbXVtKSB0aHJvdyBuZXcgRXJyb3IoXCJNaW5pbXVtIHZhbHVlIGlzIGdyZWF0ZXIgdGhhbiBtYXhpbXVtIHZhbHVlLlwiKTtcblx0cmV0dXJuIHNjaGVtYS5tdWx0aXBsZU9mID09PSB2b2lkIDAgPyBzY2FsYXIoe1xuXHRcdG1pbmltdW0sXG5cdFx0bWF4aW11bSxcblx0XHRleGNsdXNpdmVNaW5pbXVtOiBsb3dlcj8uZXhjbHVzaXZlID8/IGZhbHNlLFxuXHRcdGV4Y2x1c2l2ZU1heGltdW06IHVwcGVyPy5leGNsdXNpdmUgPz8gZmFsc2Vcblx0fSkgOiBfcmFuZG9tTXVsdGlwbGUoe1xuXHRcdG1pbmltdW0sXG5cdFx0bWF4aW11bSxcblx0XHRtdWx0aXBsZU9mOiBzY2hlbWEubXVsdGlwbGVPZixcblx0XHRleGNsdXNpdmVNaW5pbXVtOiBsb3dlcj8uZXhjbHVzaXZlID8/IGZhbHNlLFxuXHRcdGV4Y2x1c2l2ZU1heGltdW06IHVwcGVyPy5leGNsdXNpdmUgPz8gZmFsc2UsXG5cdFx0aW50ZWdlcjogZmFsc2Vcblx0fSk7XG59O1xuY29uc3Qgc2NhbGFyID0gKHByb3BzKSA9PiB7XG5cdGlmIChwcm9wcy5taW5pbXVtID09PSBwcm9wcy5tYXhpbXVtICYmIChwcm9wcy5leGNsdXNpdmVNaW5pbXVtIHx8IHByb3BzLmV4Y2x1c2l2ZU1heGltdW0pKSB0aHJvdyBuZXcgRXJyb3IoXCJFeGNsdXNpdmUgbnVtZXJpYyByYW5nZSBpcyBlbXB0eS5cIik7XG5cdGNvbnN0IHZhbHVlID0gTWF0aC5yYW5kb20oKSAqIChwcm9wcy5tYXhpbXVtIC0gcHJvcHMubWluaW11bSkgKyBwcm9wcy5taW5pbXVtO1xuXHRpZiAocHJvcHMuZXhjbHVzaXZlTWluaW11bSAmJiB2YWx1ZSA9PT0gcHJvcHMubWluaW11bSB8fCBwcm9wcy5leGNsdXNpdmVNYXhpbXVtICYmIHZhbHVlID09PSBwcm9wcy5tYXhpbXVtKSB7XG5cdFx0Y29uc3QgbWlkZGxlID0gcHJvcHMubWluaW11bSArIChwcm9wcy5tYXhpbXVtIC0gcHJvcHMubWluaW11bSkgLyAyO1xuXHRcdGlmIChtaWRkbGUgPD0gcHJvcHMubWluaW11bSB8fCBtaWRkbGUgPj0gcHJvcHMubWF4aW11bSkgdGhyb3cgbmV3IEVycm9yKFwiRXhjbHVzaXZlIG51bWVyaWMgcmFuZ2UgaGFzIG5vIHJlcHJlc2VudGFibGUgdmFsdWUuXCIpO1xuXHRcdHJldHVybiBtaWRkbGU7XG5cdH1cblx0cmV0dXJuIHZhbHVlO1xufTtcbmNvbnN0IGdldExvd2VyQm91bmRhcnkgPSAoc2NoZW1hKSA9PiBzZWxlY3RCb3VuZGFyeShzY2hlbWEubWluaW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0dmFsdWU6IHNjaGVtYS5taW5pbXVtLFxuXHRleGNsdXNpdmU6IGZhbHNlXG59LCBzY2hlbWEuZXhjbHVzaXZlTWluaW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0dmFsdWU6IHNjaGVtYS5leGNsdXNpdmVNaW5pbXVtLFxuXHRleGNsdXNpdmU6IHRydWVcbn0sIE1hdGgubWF4KTtcbmNvbnN0IGdldFVwcGVyQm91bmRhcnkgPSAoc2NoZW1hKSA9PiBzZWxlY3RCb3VuZGFyeShzY2hlbWEubWF4aW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0dmFsdWU6IHNjaGVtYS5tYXhpbXVtLFxuXHRleGNsdXNpdmU6IGZhbHNlXG59LCBzY2hlbWEuZXhjbHVzaXZlTWF4aW11bSA9PT0gdm9pZCAwID8gbnVsbCA6IHtcblx0dmFsdWU6IHNjaGVtYS5leGNsdXNpdmVNYXhpbXVtLFxuXHRleGNsdXNpdmU6IHRydWVcbn0sIE1hdGgubWluKTtcbmNvbnN0IHNlbGVjdEJvdW5kYXJ5ID0gKHgsIHksIGNvbXBhcmUpID0+IHtcblx0aWYgKHggPT09IG51bGwpIHJldHVybiB5O1xuXHRpZiAoeSA9PT0gbnVsbCkgcmV0dXJuIHg7XG5cdGlmICh4LnZhbHVlID09PSB5LnZhbHVlKSByZXR1cm4ge1xuXHRcdHZhbHVlOiB4LnZhbHVlLFxuXHRcdGV4Y2x1c2l2ZTogeC5leGNsdXNpdmUgfHwgeS5leGNsdXNpdmVcblx0fTtcblx0cmV0dXJuIGNvbXBhcmUoeC52YWx1ZSwgeS52YWx1ZSkgPT09IHgudmFsdWUgPyB4IDogeTtcbn07XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21OdW1iZXIgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X3JhbmRvbU51bWJlci5tanMubWFwIiwiLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9faXNVbmlxdWVJdGVtcy50c1xuY29uc3QgX2lzVW5pcXVlSXRlbXMgPSAoZWxlbWVudHMpID0+IHtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBlbGVtZW50cy5sZW5ndGg7IGkrKykgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgZWxlbWVudHMubGVuZ3RoOyBqKyspIGlmIChlcXVhbHMoLyogQF9fUFVSRV9fICovIG5ldyBXZWFrTWFwKCkpKGVsZW1lbnRzW2ldLCBlbGVtZW50c1tqXSkpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuIHRydWU7XG59O1xuY29uc3QgZXF1YWxzID0gKHZpc2l0ZWQpID0+IHtcblx0Y29uc3QgbmV4dCA9IChhLCBiKSA9PiB7XG5cdFx0aWYgKGEgPT09IGIpIHJldHVybiB0cnVlO1xuXHRcdGlmIChhID09PSBudWxsIHx8IGIgPT09IG51bGwgfHwgdHlwZW9mIGEgIT09IFwib2JqZWN0XCIgfHwgdHlwZW9mIGIgIT09IFwib2JqZWN0XCIpIHJldHVybiBmYWxzZTtcblx0XHRjb25zdCBwcmV2aW91cyA9IHZpc2l0ZWQuZ2V0KGEpPy5nZXQoYik7XG5cdFx0aWYgKHByZXZpb3VzICE9PSB2b2lkIDApIHJldHVybiBwcmV2aW91cztcblx0XHRjb25zdCBwYWlycyA9IHZpc2l0ZWQuZ2V0KGEpID8/IC8qIEBfX1BVUkVfXyAqLyBuZXcgV2Vha01hcCgpO1xuXHRcdHZpc2l0ZWQuc2V0KGEsIHBhaXJzKTtcblx0XHRwYWlycy5zZXQoYiwgdHJ1ZSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0gY29tcGFyZShhLCBiKTtcblx0XHRwYWlycy5zZXQoYiwgcmVzdWx0KTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9O1xuXHRjb25zdCBjb21wYXJlID0gKGEsIGIpID0+IHtcblx0XHRpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KGIpIHx8IGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGNvbnN0IGFIYXMgPSBPYmplY3QuaGFzT3duKGEsIGkpO1xuXHRcdFx0XHRpZiAoYUhhcyAhPT0gT2JqZWN0Lmhhc093bihiLCBpKSB8fCBhSGFzICYmICFuZXh0KGFbaV0sIGJbaV0pKSByZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoYikpIHJldHVybiBmYWxzZTtcblx0XHRpZiAoYSBpbnN0YW5jZW9mIFNldCkge1xuXHRcdFx0aWYgKCEoYiBpbnN0YW5jZW9mIFNldCkgfHwgYS5zaXplICE9PSBiLnNpemUpIHJldHVybiBmYWxzZTtcblx0XHRcdGNvbnN0IHVubWF0Y2hlZCA9IFsuLi5iXTtcblx0XHRcdGZvciAoY29uc3QgdmFsdWUgb2YgYSkge1xuXHRcdFx0XHRjb25zdCBpbmRleCA9IHVubWF0Y2hlZC5maW5kSW5kZXgoKGNhbmRpZGF0ZSkgPT4gbmV4dCh2YWx1ZSwgY2FuZGlkYXRlKSk7XG5cdFx0XHRcdGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0dW5tYXRjaGVkLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0aWYgKGEgaW5zdGFuY2VvZiBNYXApIHtcblx0XHRcdGlmICghKGIgaW5zdGFuY2VvZiBNYXApIHx8IGEuc2l6ZSAhPT0gYi5zaXplKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRjb25zdCB1bm1hdGNoZWQgPSBbLi4uYl07XG5cdFx0XHRmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBhKSB7XG5cdFx0XHRcdGNvbnN0IGluZGV4ID0gdW5tYXRjaGVkLmZpbmRJbmRleCgoW2NhbmRpZGF0ZUtleSwgY2FuZGlkYXRlVmFsdWVdKSA9PiBuZXh0KGtleSwgY2FuZGlkYXRlS2V5KSAmJiBuZXh0KHZhbHVlLCBjYW5kaWRhdGVWYWx1ZSkpO1xuXHRcdFx0XHRpZiAoaW5kZXggPT09IC0xKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdHVubWF0Y2hlZC5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdGlmIChhIGluc3RhbmNlb2YgQm9vbGVhbikgcmV0dXJuIGIgaW5zdGFuY2VvZiBCb29sZWFuICYmIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcblx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgQmlnSW50XVwiKSByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgQmlnSW50XVwiICYmIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcblx0XHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGEpID09PSBcIltvYmplY3QgU3ltYm9sXVwiKSByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGIpID09PSBcIltvYmplY3QgU3ltYm9sXVwiICYmIGEudmFsdWVPZigpID09PSBiLnZhbHVlT2YoKTtcblx0XHRpZiAoYSBpbnN0YW5jZW9mIE51bWJlcikgcmV0dXJuIGIgaW5zdGFuY2VvZiBOdW1iZXIgJiYgYS52YWx1ZU9mKCkgPT09IGIudmFsdWVPZigpO1xuXHRcdGlmIChhIGluc3RhbmNlb2YgU3RyaW5nKSByZXR1cm4gYiBpbnN0YW5jZW9mIFN0cmluZyAmJiBhLnZhbHVlT2YoKSA9PT0gYi52YWx1ZU9mKCk7XG5cdFx0aWYgKGEgaW5zdGFuY2VvZiBEYXRlKSByZXR1cm4gYiBpbnN0YW5jZW9mIERhdGUgJiYgYS5nZXRUaW1lKCkgPT09IGIuZ2V0VGltZSgpO1xuXHRcdGlmIChhIGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gYiBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBhLnNvdXJjZSA9PT0gYi5zb3VyY2UgJiYgYS5mbGFncyA9PT0gYi5mbGFncztcblx0XHRpZiAodHlwZW9mIEZpbGUgIT09IFwidW5kZWZpbmVkXCIgJiYgYSBpbnN0YW5jZW9mIEZpbGUpIHJldHVybiBiIGluc3RhbmNlb2YgRmlsZSAmJiBhLm5hbWUgPT09IGIubmFtZSAmJiBhLnNpemUgPT09IGIuc2l6ZSAmJiBhLnR5cGUgPT09IGIudHlwZSAmJiBhLmxhc3RNb2RpZmllZCA9PT0gYi5sYXN0TW9kaWZpZWQ7XG5cdFx0aWYgKHR5cGVvZiBCbG9iICE9PSBcInVuZGVmaW5lZFwiICYmIGEgaW5zdGFuY2VvZiBCbG9iKSByZXR1cm4gYiBpbnN0YW5jZW9mIEJsb2IgJiYgYS5zaXplID09PSBiLnNpemUgJiYgYS50eXBlID09PSBiLnR5cGU7XG5cdFx0aWYgKGEgaW5zdGFuY2VvZiBEYXRhVmlldykge1xuXHRcdFx0aWYgKCEoYiBpbnN0YW5jZW9mIERhdGFWaWV3KSB8fCBhLmJ5dGVMZW5ndGggIT09IGIuYnl0ZUxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0cmV0dXJuIGJ5dGVzKGEuYnVmZmVyLCBhLmJ5dGVPZmZzZXQsIGEuYnl0ZUxlbmd0aCkuZXZlcnkoKHZhbHVlLCBpbmRleCkgPT4gdmFsdWUgPT09IGJ5dGVzKGIuYnVmZmVyLCBiLmJ5dGVPZmZzZXQsIGIuYnl0ZUxlbmd0aClbaW5kZXhdKTtcblx0XHR9XG5cdFx0aWYgKEFycmF5QnVmZmVyLmlzVmlldyhhKSkge1xuXHRcdFx0aWYgKCFBcnJheUJ1ZmZlci5pc1ZpZXcoYikgfHwgYiBpbnN0YW5jZW9mIERhdGFWaWV3IHx8IE9iamVjdC5nZXRQcm90b3R5cGVPZihhKSAhPT0gT2JqZWN0LmdldFByb3RvdHlwZU9mKGIpIHx8IGEuYnl0ZUxlbmd0aCAhPT0gYi5ieXRlTGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRjb25zdCB4ID0gYnl0ZXMoYS5idWZmZXIsIGEuYnl0ZU9mZnNldCwgYS5ieXRlTGVuZ3RoKTtcblx0XHRcdGNvbnN0IHkgPSBieXRlcyhiLmJ1ZmZlciwgYi5ieXRlT2Zmc2V0LCBiLmJ5dGVMZW5ndGgpO1xuXHRcdFx0cmV0dXJuIHguZXZlcnkoKHZhbHVlLCBpbmRleCkgPT4gdmFsdWUgPT09IHlbaW5kZXhdKTtcblx0XHR9XG5cdFx0aWYgKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgcmV0dXJuIGIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlciAmJiBhLmJ5dGVMZW5ndGggPT09IGIuYnl0ZUxlbmd0aCAmJiBieXRlcyhhKS5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiB2YWx1ZSA9PT0gYnl0ZXMoYilbaW5kZXhdKTtcblx0XHRpZiAodHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyICE9PSBcInVuZGVmaW5lZFwiICYmIGEgaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlcikgcmV0dXJuIGIgaW5zdGFuY2VvZiBTaGFyZWRBcnJheUJ1ZmZlciAmJiBhLmJ5dGVMZW5ndGggPT09IGIuYnl0ZUxlbmd0aCAmJiBieXRlcyhhKS5ldmVyeSgodmFsdWUsIGluZGV4KSA9PiB2YWx1ZSA9PT0gYnl0ZXMoYilbaW5kZXhdKTtcblx0XHRjb25zdCBrZXlzID0gUmVmbGVjdC5vd25LZXlzKGEpLmZpbHRlcigoa2V5KSA9PiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwoYSwga2V5KSk7XG5cdFx0cmV0dXJuIGtleXMubGVuZ3RoID09PSBSZWZsZWN0Lm93bktleXMoYikuZmlsdGVyKChrZXkpID0+IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGUuY2FsbChiLCBrZXkpKS5sZW5ndGggJiYga2V5cy5ldmVyeSgoa2V5KSA9PiBPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwoYiwga2V5KSAmJiBuZXh0KGFba2V5XSwgYltrZXldKSk7XG5cdH07XG5cdHJldHVybiBuZXh0O1xufTtcbmNvbnN0IGJ5dGVzID0gKGJ1ZmZlciwgYnl0ZU9mZnNldCA9IDAsIGJ5dGVMZW5ndGggPSBidWZmZXIuYnl0ZUxlbmd0aCkgPT4gbmV3IFVpbnQ4QXJyYXkoYnVmZmVyLCBieXRlT2Zmc2V0LCBieXRlTGVuZ3RoKTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX2lzVW5pcXVlSXRlbXMgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X2lzVW5pcXVlSXRlbXMubWpzLm1hcCIsImltcG9ydCB7IF9pc1VuaXF1ZUl0ZW1zIH0gZnJvbSBcIi4vX2lzVW5pcXVlSXRlbXMubWpzXCI7XG5pbXBvcnQgeyBfcmFuZG9tSW50ZWdlciB9IGZyb20gXCIuL19yYW5kb21JbnRlZ2VyLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tQXJyYXkudHNcbmNvbnN0IERFRkFVTFRfTUlOX0lURU1TID0gMTtcbmNvbnN0IERFRkFVTFRfUkFOR0UgPSA1O1xuY29uc3QgREVGQVVMVF9SRUNVUlNJVkVfUkFOR0UgPSAyO1xuLyoqXG4qIENvbnNlY3V0aXZlIGR1cGxpY2F0ZXMgdGhhdCBlbmQgYSB1bmlxdWUgZHJhdyBvbmNlIGl0cyBmbG9vciBpcyBzYXRpc2ZpZWQuXG4qXG4qIFRoZSB3b3JzdCBjYXNlIGEgZG9tYWluIGNhbiBzdGlsbCBoaWRlIGlzIG9uZSB2YWx1ZSBsZWZ0IGFtb25nIGEgaGFuZGZ1bDpcbiogd2l0aCBvbmUgb2YgZm91ciByZW1haW5pbmcsIHNpeHR5LWZvdXIgbWlzc2VzIGluIGEgcm93IGlzIGEgYDAuNzUgKiogNjRgXG4qIGV2ZW50LCBhYm91dCBvbmUgaW4gYSBodW5kcmVkIG1pbGxpb24uIEJlbG93IHRoZSBmbG9vciB0aGlzIGxpbWl0IGRvZXMgbm90XG4qIGFwcGx5IGF0IGFsbCwgc28gaXQgY2FuIG5ldmVyIGZhaWwgYSByZXF1ZXN0IHRoZSBkb21haW4gY291bGQgc2F0aXNmeS5cbiovXG5jb25zdCBTVEFMRV9MSU1JVCA9IDY0O1xuY29uc3QgX3JhbmRvbUFycmF5ID0gKHByb3BzKSA9PiB7XG5cdGNvbnN0IGRlZmF1bHRNaW5pbXVtID0gcHJvcHMucmVjdXJzaXZlID09PSB0cnVlID8gMCA6IERFRkFVTFRfTUlOX0lURU1TO1xuXHRjb25zdCBtaW5pbXVtID0gcHJvcHMubWluSXRlbXMgPz8gTWF0aC5taW4ocHJvcHMubWF4SXRlbXMgPz8gZGVmYXVsdE1pbmltdW0sIGRlZmF1bHRNaW5pbXVtKTtcblx0Y29uc3QgY291bnQgPSBfcmFuZG9tSW50ZWdlcih7XG5cdFx0dHlwZTogXCJpbnRlZ2VyXCIsXG5cdFx0bWluaW11bSxcblx0XHRtYXhpbXVtOiBwcm9wcy5tYXhJdGVtcyA/PyBtaW5pbXVtICsgKHByb3BzLnJlY3Vyc2l2ZSA9PT0gdHJ1ZSA/IERFRkFVTFRfUkVDVVJTSVZFX1JBTkdFIDogREVGQVVMVF9SQU5HRSlcblx0fSk7XG5cdGlmIChwcm9wcy51bmlxdWVJdGVtcyAhPT0gdHJ1ZSkgcmV0dXJuIG5ldyBBcnJheShjb3VudCkuZmlsbChudWxsKS5tYXAoKF8sIGkpID0+IHByb3BzLmVsZW1lbnQoaSwgY291bnQpKTtcblx0Y29uc3QgZWxlbWVudHMgPSBbXTtcblx0Y29uc3QgbWF4aW11bUF0dGVtcHRzID0gY291bnQgKiAxMDAgKyAxZTM7XG5cdGxldCBzdGFsZSA9IDA7XG5cdGZvciAobGV0IGF0dGVtcHRzID0gMDsgZWxlbWVudHMubGVuZ3RoICE9PSBjb3VudCAmJiBhdHRlbXB0cyAhPT0gbWF4aW11bUF0dGVtcHRzOyBhdHRlbXB0cysrKSB7XG5cdFx0Y29uc3QgY2FuZGlkYXRlID0gcHJvcHMuZWxlbWVudChlbGVtZW50cy5sZW5ndGgsIGNvdW50KTtcblx0XHRpZiAoZWxlbWVudHMuZXZlcnkoKGVsZW1lbnQpID0+IF9pc1VuaXF1ZUl0ZW1zKFtlbGVtZW50LCBjYW5kaWRhdGVdKSkpIHtcblx0XHRcdGVsZW1lbnRzLnB1c2goY2FuZGlkYXRlKTtcblx0XHRcdHN0YWxlID0gMDtcblx0XHR9IGVsc2UgaWYgKGVsZW1lbnRzLmxlbmd0aCA+PSBtaW5pbXVtICYmICsrc3RhbGUgPT09IFNUQUxFX0xJTUlUKSBicmVhaztcblx0fVxuXHRpZiAoZWxlbWVudHMubGVuZ3RoIDwgbWluaW11bSkgdGhyb3cgbmV3IEVycm9yKFwiVW5hYmxlIHRvIGdlbmVyYXRlIGVub3VnaCB1bmlxdWUgaXRlbXM7IHRoZSBlbGVtZW50IGRvbWFpbiBtYXkgYmUgdG9vIHNtYWxsLlwiKTtcblx0cmV0dXJuIGVsZW1lbnRzO1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3JhbmRvbUFycmF5IH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9yYW5kb21BcnJheS5tanMubWFwIiwiLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tQm9vbGVhbi50c1xuY29uc3QgX3JhbmRvbUJvb2xlYW4gPSAoKSA9PiBNYXRoLnJhbmRvbSgpIDwgLjU7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9yYW5kb21Cb29sZWFuIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9yYW5kb21Cb29sZWFuLm1qcy5tYXAiLCJpbXBvcnQgeyBfcmFuZG9tSW50ZWdlciB9IGZyb20gXCIuL19yYW5kb21JbnRlZ2VyLm1qc1wiO1xuLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fcmFuZG9tUGljay50c1xuY29uc3QgX3JhbmRvbVBpY2sgPSAoYXJyYXkpID0+IGFycmF5W3JhbmRvbShhcnJheSldO1xuY29uc3QgcmFuZG9tID0gKGFycmF5KSA9PiBfcmFuZG9tSW50ZWdlcih7XG5cdHR5cGU6IFwiaW50ZWdlclwiLFxuXHRtaW5pbXVtOiAwLFxuXHRtYXhpbXVtOiBhcnJheS5sZW5ndGggLSAxXG59KTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX3JhbmRvbVBpY2sgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9X3JhbmRvbVBpY2subWpzLm1hcCIsIi8vI3JlZ2lvbiBzcmMvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlOdW1iZXIudHNcbmNvbnN0IF9qc29uU3RyaW5naWZ5TnVtYmVyID0gKHZhbHVlKSA9PiBpc0Zpbml0ZSh2YWx1ZSkgPyB2YWx1ZSA6IG51bGw7XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IF9qc29uU3RyaW5naWZ5TnVtYmVyIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPV9qc29uU3RyaW5naWZ5TnVtYmVyLm1qcy5tYXAiLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX3JhbmRvbU51bWJlcl8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbU51bWJlclwiO1xuaW1wb3J0ICogYXMgX3JhbmRvbUFycmF5XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tQXJyYXlcIjtcbmltcG9ydCAqIGFzIF9yYW5kb21Cb29sZWFuXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tQm9vbGVhblwiO1xuaW1wb3J0ICogYXMgX3JhbmRvbVBpY2tfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21QaWNrXCI7XG5pbXBvcnQgKiBhcyBfanNvblN0cmluZ2lmeVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlTdHJpbmdcIjtcbmltcG9ydCAqIGFzIF9qc29uU3RyaW5naWZ5TnVtYmVyXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeU51bWJlclwiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy91cGRhdGVyL2Rvd25sb2FkLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci9kb3dubG9hZC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmN1cnJlbnRWZXJzaW9uICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZW1vdGVWZXJzaW9uICYmIChBcnJheS5pc0FycmF5KGlucHV0LnNwbGl0RmlsZXMpICYmIGlucHV0LnNwbGl0RmlsZXMuZXZlcnkoKGVsZW06IGFueSkgPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVsZW0pKSAmJiAoQXJyYXkuaXNBcnJheShpbnB1dC5zcGxpdEZpbGVIYXNoZXMpICYmIGlucHV0LnNwbGl0RmlsZUhhc2hlcy5ldmVyeSgoZWxlbTogYW55KSA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgZWxlbSkpICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5iYXNlVXJsICYmICh1bmRlZmluZWQgPT09IGlucHV0LmZvcmNlUHJvbXB0IHx8IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuZm9yY2VQcm9tcHQpICYmICh1bmRlZmluZWQgPT09IGlucHV0LnB1Ymxpc2hEYXRlIHx8IFwibnVtYmVyXCIgPT09IHR5cGVvZiBpbnB1dC5wdWJsaXNoRGF0ZSkgJiYgKHVuZGVmaW5lZCA9PT0gaW5wdXQudXBkYXRlTGV2ZWwgfHwgXCJtYWpvclwiID09PSBpbnB1dC51cGRhdGVMZXZlbCB8fCBcIm1pbm9yXCIgPT09IGlucHV0LnVwZGF0ZUxldmVsIHx8IFwicGF0Y2hcIiA9PT0gaW5wdXQudXBkYXRlTGV2ZWwpO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiY3VycmVudFZlcnNpb25cIiA9PT0ga2V5IHx8IFwicmVtb3RlVmVyc2lvblwiID09PSBrZXkgfHwgXCJzcGxpdEZpbGVzXCIgPT09IGtleSB8fCBcInNwbGl0RmlsZUhhc2hlc1wiID09PSBrZXkgfHwgXCJiYXNlVXJsXCIgPT09IGtleSB8fCBcImZvcmNlUHJvbXB0XCIgPT09IGtleSB8fCBcInB1Ymxpc2hEYXRlXCIgPT09IGtleSB8fCBcInVwZGF0ZUxldmVsXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmN1cnJlbnRWZXJzaW9uIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmN1cnJlbnRWZXJzaW9uXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmN1cnJlbnRWZXJzaW9uXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbW90ZVZlcnNpb24gfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucmVtb3RlVmVyc2lvblwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5yZW1vdGVWZXJzaW9uXG4gICAgICAgICAgICB9KSwgKEFycmF5LmlzQXJyYXkoaW5wdXQuc3BsaXRGaWxlcykgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3BsaXRGaWxlc1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIkFycmF5PHN0cmluZz5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuc3BsaXRGaWxlc1xuICAgICAgICAgICAgfSkpICYmIGlucHV0LnNwbGl0RmlsZXMubWFwKChlbGVtOiBhbnksIF9pbmRleDM6IG51bWJlcikgPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVsZW0gfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3BsaXRGaWxlc1tcIiArIF9pbmRleDMgKyBcIl1cIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogZWxlbVxuICAgICAgICAgICAgfSkpLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zcGxpdEZpbGVzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiQXJyYXk8c3RyaW5nPlwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zcGxpdEZpbGVzXG4gICAgICAgICAgICB9KSwgKEFycmF5LmlzQXJyYXkoaW5wdXQuc3BsaXRGaWxlSGFzaGVzKSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zcGxpdEZpbGVIYXNoZXNcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJBcnJheTxzdHJpbmc+XCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnNwbGl0RmlsZUhhc2hlc1xuICAgICAgICAgICAgfSkpICYmIGlucHV0LnNwbGl0RmlsZUhhc2hlcy5tYXAoKGVsZW06IGFueSwgX2luZGV4NDogbnVtYmVyKSA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgZWxlbSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zcGxpdEZpbGVIYXNoZXNbXCIgKyBfaW5kZXg0ICsgXCJdXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGVsZW1cbiAgICAgICAgICAgIH0pKS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZykgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3BsaXRGaWxlSGFzaGVzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiQXJyYXk8c3RyaW5nPlwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zcGxpdEZpbGVIYXNoZXNcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuYmFzZVVybCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5iYXNlVXJsXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmJhc2VVcmxcbiAgICAgICAgICAgIH0pLCB1bmRlZmluZWQgPT09IGlucHV0LmZvcmNlUHJvbXB0IHx8IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuZm9yY2VQcm9tcHQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZm9yY2VQcm9tcHRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCIoYm9vbGVhbiB8IHVuZGVmaW5lZClcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZm9yY2VQcm9tcHRcbiAgICAgICAgICAgIH0pLCB1bmRlZmluZWQgPT09IGlucHV0LnB1Ymxpc2hEYXRlIHx8IFwibnVtYmVyXCIgPT09IHR5cGVvZiBpbnB1dC5wdWJsaXNoRGF0ZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5wdWJsaXNoRGF0ZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihudW1iZXIgfCB1bmRlZmluZWQpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnB1Ymxpc2hEYXRlXG4gICAgICAgICAgICB9KSwgdW5kZWZpbmVkID09PSBpbnB1dC51cGRhdGVMZXZlbCB8fCBcIm1ham9yXCIgPT09IGlucHV0LnVwZGF0ZUxldmVsIHx8IFwibWlub3JcIiA9PT0gaW5wdXQudXBkYXRlTGV2ZWwgfHwgXCJwYXRjaFwiID09PSBpbnB1dC51cGRhdGVMZXZlbCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi51cGRhdGVMZXZlbFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihcXFwibWFqb3JcXFwiIHwgXFxcIm1pbm9yXFxcIiB8IFxcXCJwYXRjaFxcXCIgfCB1bmRlZmluZWQpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnVwZGF0ZUxldmVsXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBjdXJyZW50VmVyc2lvbjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVtb3RlVmVyc2lvbjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgc3BsaXRGaWxlczogKF9nZW5lcmF0b3I/LmFycmF5ID8/IF9yYW5kb21BcnJheV8xLl9yYW5kb21BcnJheSkoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiYXJyYXlcIixcbiAgICAgICAgICAgICAgICBlbGVtZW50OiAoKSA9PiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBzcGxpdEZpbGVIYXNoZXM6IChfZ2VuZXJhdG9yPy5hcnJheSA/PyBfcmFuZG9tQXJyYXlfMS5fcmFuZG9tQXJyYXkpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcImFycmF5XCIsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogKCkgPT4gKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgYmFzZVVybDogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZm9yY2VQcm9tcHQ6IF9yYW5kb21QaWNrXzEuX3JhbmRvbVBpY2soW1xuICAgICAgICAgICAgICAgICgpID0+IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAoKSA9PiAoX2dlbmVyYXRvcj8uYm9vbGVhbiA/PyBfcmFuZG9tQm9vbGVhbl8xLl9yYW5kb21Cb29sZWFuKSgpXG4gICAgICAgICAgICBdKSgpLFxuICAgICAgICAgICAgcHVibGlzaERhdGU6IF9yYW5kb21QaWNrXzEuX3JhbmRvbVBpY2soW1xuICAgICAgICAgICAgICAgICgpID0+IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAoKSA9PiAoX2dlbmVyYXRvcj8ubnVtYmVyID8/IF9yYW5kb21OdW1iZXJfMS5fcmFuZG9tTnVtYmVyKSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXSkoKSxcbiAgICAgICAgICAgIHVwZGF0ZUxldmVsOiBfcmFuZG9tUGlja18xLl9yYW5kb21QaWNrKFtcbiAgICAgICAgICAgICAgICAoKSA9PiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgKCkgPT4gXCJtYWpvclwiLFxuICAgICAgICAgICAgICAgICgpID0+IFwibWlub3JcIixcbiAgICAgICAgICAgICAgICAoKSA9PiBcInBhdGNoXCJcbiAgICAgICAgICAgIF0pKClcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuYXV0b1VwZGF0ZVN1cHBvcnRlZCAmJiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnVwZGF0ZUNvbXBsZXRlZCAmJiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LndhaXRpbmdGb3JSZXN0YXJ0ICYmIChudWxsID09PSBpbnB1dC5yZW1vdGVWZXJzaW9uIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZW1vdGVWZXJzaW9uKSAmJiAobnVsbCA9PT0gaW5wdXQuaW5zdGFsbFBhdGggfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0Lmluc3RhbGxQYXRoKSAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQubWVzc2FnZSAmJiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0Lmhhc2hWZXJpZmllZCAmJiAobnVsbCA9PT0gaW5wdXQuZG93bmxvYWRlZEF0IHx8IFwibnVtYmVyXCIgPT09IHR5cGVvZiBpbnB1dC5kb3dubG9hZGVkQXQpO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwiYXV0b1VwZGF0ZVN1cHBvcnRlZFwiID09PSBrZXkgfHwgXCJ1cGRhdGVDb21wbGV0ZWRcIiA9PT0ga2V5IHx8IFwid2FpdGluZ0ZvclJlc3RhcnRcIiA9PT0ga2V5IHx8IFwicmVtb3RlVmVyc2lvblwiID09PSBrZXkgfHwgXCJpbnN0YWxsUGF0aFwiID09PSBrZXkgfHwgXCJtZXNzYWdlXCIgPT09IGtleSB8fCBcImhhc2hWZXJpZmllZFwiID09PSBrZXkgfHwgXCJkb3dubG9hZGVkQXRcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmF1dG9VcGRhdGVTdXBwb3J0ZWQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuYXV0b1VwZGF0ZVN1cHBvcnRlZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuYXV0b1VwZGF0ZVN1cHBvcnRlZFxuICAgICAgICAgICAgfSksIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQudXBkYXRlQ29tcGxldGVkIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnVwZGF0ZUNvbXBsZXRlZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQudXBkYXRlQ29tcGxldGVkXG4gICAgICAgICAgICB9KSwgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC53YWl0aW5nRm9yUmVzdGFydCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi53YWl0aW5nRm9yUmVzdGFydFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQud2FpdGluZ0ZvclJlc3RhcnRcbiAgICAgICAgICAgIH0pLCBudWxsID09PSBpbnB1dC5yZW1vdGVWZXJzaW9uIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZW1vdGVWZXJzaW9uIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJlbW90ZVZlcnNpb25cIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCIobnVsbCB8IHN0cmluZylcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucmVtb3RlVmVyc2lvblxuICAgICAgICAgICAgfSksIG51bGwgPT09IGlucHV0Lmluc3RhbGxQYXRoIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5pbnN0YWxsUGF0aCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5pbnN0YWxsUGF0aFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihudWxsIHwgc3RyaW5nKVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5pbnN0YWxsUGF0aFxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5tZXNzYWdlIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLm1lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQubWVzc2FnZVxuICAgICAgICAgICAgfSksIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaGFzaFZlcmlmaWVkIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmhhc2hWZXJpZmllZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuaGFzaFZlcmlmaWVkXG4gICAgICAgICAgICB9KSwgbnVsbCA9PT0gaW5wdXQuZG93bmxvYWRlZEF0IHx8IFwibnVtYmVyXCIgPT09IHR5cGVvZiBpbnB1dC5kb3dubG9hZGVkQXQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZG93bmxvYWRlZEF0XCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiKG51bGwgfCBudW1iZXIpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmRvd25sb2FkZWRBdFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19kb3dubG9hZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wiYXV0b1VwZGF0ZVN1cHBvcnRlZFwiOiR7U3RyaW5nKGlucHV0LmF1dG9VcGRhdGVTdXBwb3J0ZWQpfSxcInVwZGF0ZUNvbXBsZXRlZFwiOiR7U3RyaW5nKGlucHV0LnVwZGF0ZUNvbXBsZXRlZCl9LFwid2FpdGluZ0ZvclJlc3RhcnRcIjoke1N0cmluZyhpbnB1dC53YWl0aW5nRm9yUmVzdGFydCl9LFwicmVtb3RlVmVyc2lvblwiOiR7bnVsbCAhPT0gaW5wdXQucmVtb3RlVmVyc2lvbiA/IF9qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQucmVtb3RlVmVyc2lvbikgOiBcIm51bGxcIn0sXCJpbnN0YWxsUGF0aFwiOiR7bnVsbCAhPT0gaW5wdXQuaW5zdGFsbFBhdGggPyBfanNvblN0cmluZ2lmeVN0cmluZ18xLl9qc29uU3RyaW5naWZ5U3RyaW5nKGlucHV0Lmluc3RhbGxQYXRoKSA6IFwibnVsbFwifSxcIm1lc3NhZ2VcIjoke19qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQubWVzc2FnZSl9LFwiaGFzaFZlcmlmaWVkXCI6JHtTdHJpbmcoaW5wdXQuaGFzaFZlcmlmaWVkKX0sXCJkb3dubG9hZGVkQXRcIjoke251bGwgIT09IGlucHV0LmRvd25sb2FkZWRBdCA/IFN0cmluZyhfanNvblN0cmluZ2lmeU51bWJlcl8xLl9qc29uU3RyaW5naWZ5TnVtYmVyKGlucHV0LmRvd25sb2FkZWRBdCkpIDogXCJudWxsXCJ9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbUJvb2xlYW5fMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21Cb29sZWFuXCI7XG5pbXBvcnQgKiBhcyBfcmFuZG9tUGlja18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVBpY2tcIjtcbmltcG9ydCAqIGFzIF9qc29uU3RyaW5naWZ5U3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fanNvblN0cmluZ2lmeVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbiBmcm9tIFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvdXBkYXRlci9yZWxvYWQuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT47XG4gICAgICAgIHJlc3VsdDogUmVzb2x2ZWQ8QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy91cGRhdGVyL3JlbG9hZC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IHVuZGVmaW5lZCA9PT0gaW5wdXQuZm9yY2UgfHwgXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5mb3JjZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImZvcmNlXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbdW5kZWZpbmVkID09PSBpbnB1dC5mb3JjZSB8fCBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmZvcmNlIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmZvcmNlXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiKGJvb2xlYW4gfCB1bmRlZmluZWQpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmZvcmNlXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX3JlbG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgZm9yY2U6IF9yYW5kb21QaWNrXzEuX3JhbmRvbVBpY2soW1xuICAgICAgICAgICAgICAgICgpID0+IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAoKSA9PiAoX2dlbmVyYXRvcj8uYm9vbGVhbiA/PyBfcmFuZG9tQm9vbGVhbl8xLl9yYW5kb21Cb29sZWFuKSgpXG4gICAgICAgICAgICBdKSgpXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBfZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICAgICAgcmV0dXJuIF9ybzAoKTtcbiAgICAgICAgfTtcbiAgICB9KSgpKCkgYXMgYW55LFxuICAgIHZhbGlkYXRlUmVzdWx0czogKHJlc3VsdHM6IGFueSk6IElWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX3JlbG9hZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcyAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQubWVzc2FnZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInN1Y2Nlc3NcIiA9PT0ga2V5IHx8IFwibWVzc2FnZVwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcyB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zdWNjZXNzXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0Lm1lc3NhZ2UgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIubWVzc2FnZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5tZXNzYWdlXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX3JlbG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX3VwZGF0ZXJfX3JlbG9hZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcInN1Y2Nlc3NcIjoke1N0cmluZyhpbnB1dC5zdWNjZXNzKX0sXCJtZXNzYWdlXCI6JHtfanNvblN0cmluZ2lmeVN0cmluZ18xLl9qc29uU3RyaW5naWZ5U3RyaW5nKGlucHV0Lm1lc3NhZ2UpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfcmFuZG9tU3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvZGVsZXRlLWZpbGUuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL2RlbGV0ZS1maWxlLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmZpbGVOYW1lO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwicHJvamVjdERpclwiID09PSBrZXkgfHwgXCJyZWxhdGl2ZURpclwiID09PSBrZXkgfHwgXCJmaWxlTmFtZVwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnByb2plY3REaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucHJvamVjdERpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5yZWxhdGl2ZURpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5yZWxhdGl2ZURpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5maWxlTmFtZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5maWxlTmFtZVxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgcHJvamVjdERpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVsYXRpdmVEaXI6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcztcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInN1Y2Nlc3NcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnN1Y2Nlc3MgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuc3VjY2Vzc1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuc3VjY2Vzc1xuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZGVsZXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wic3VjY2Vzc1wiOiR7U3RyaW5nKGlucHV0LnN1Y2Nlc3MpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8gQHRzLW5vY2hlY2tcbmltcG9ydCAqIGFzIF9yYW5kb21TdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21TdHJpbmdcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvZXhpc3RzLmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvbG9jYWwtZmlsZS9leGlzdHMuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LmZpbGVOYW1lO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwicHJvamVjdERpclwiID09PSBrZXkgfHwgXCJyZWxhdGl2ZURpclwiID09PSBrZXkgfHwgXCJmaWxlTmFtZVwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnByb2plY3REaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucHJvamVjdERpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5yZWxhdGl2ZURpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5yZWxhdGl2ZURpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5maWxlTmFtZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5maWxlTmFtZVxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHBhcmFtcykgYXMgYW55LFxuICAgIHJhbmRvbVBhcmFtczogKCk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBwcm9qZWN0RGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWxhdGl2ZURpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IF9nZW5lcmF0b3I6IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4gfCB1bmRlZmluZWQ7XG4gICAgICAgIHJldHVybiAoZ2VuZXJhdG9yPzogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPik6IGltcG9ydChcInR5cGlhXCIpLlJlc29sdmVkPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmV4aXN0cztcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImV4aXN0c1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuZXhpc3RzIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmV4aXN0c1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZXhpc3RzXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPj4gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocmVzdWx0cykgYXMgYW55LFxuICAgIHJlc3VsdHNUb0pTT046IChyZXN1bHRzOiBhbnkpOiBBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19leGlzdHNUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImV4aXN0c1wiOiR7U3RyaW5nKGlucHV0LmV4aXN0cyl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiBzdHJpbmcgPT4gX3NvMChpbnB1dCk7XG4gICAgICAgIH0pKCkocmVzdWx0cykgYXMgYW55O1xuICAgIH0sXG59O1xuIiwiLy8jcmVnaW9uIHNyYy9pbnRlcm5hbC9fanNvblN0cmluZ2lmeUFycmF5LnRzXG4vKipcbiogU2VyaWFsaXplcyB0aGUgZWxlbWVudHMgb2YgYW4gYXJyYXkgdGhlIHdheSBFQ01BU2NyaXB0IGBKU09OLnN0cmluZ2lmeWAgZG9lcy5cbipcbiogYFNlcmlhbGl6ZUpTT05BcnJheWAgd2Fsa3MgaW5kZXggYDBgIHRvIGBMZW5ndGhPZkFycmF5TGlrZSh2YWx1ZSkgLSAxYCBhbmRcbiogd3JpdGVzIGBudWxsYCB3aGVyZXZlciB0aGUgZWxlbWVudCBzZXJpYWxpemVzIHRvIGB1bmRlZmluZWRgLiBOZWl0aGVyXG4qIGBBcnJheS5wcm90b3R5cGUubWFwYCBub3IgYEFycmF5LnByb3RvdHlwZS5qb2luYCByZXByb2R1Y2VzIHRoYXQ6XG4qXG4qIC0gYG1hcGAgbmV2ZXIgdmlzaXRzIGEgaG9sZSBhbmQgbGVhdmVzIG9uZSBiZWhpbmQsIGFuZCBgam9pbmAgcmVuZGVycyBhIGhvbGUgYXNcbiogICBlbXB0eSB0ZXh0LCBzbyBhIHNwYXJzZSBhcnJheSBqb2luZWQgaW50byBtYWxmb3JtZWQgdGV4dCBzdWNoIGFzIGBbLDFdYC4gQVxuKiAgIGhvbGUgZXhpc3RzIGF0IHJ1bnRpbWUgd2hhdGV2ZXIgdGhlIGVsZW1lbnQgdHlwZSBkZWNsYXJlcywgc28gdGhpcyBpcyBub3RcbiogICBhbiBgYW55YCBjb25jZXJuLlxuKiAtIGBqb2luYCByZW5kZXJzIGEgbWFwcGVkIGB1bmRlZmluZWRgIGFzIGVtcHR5IHRleHQgdG9vLCB3aGljaCBpcyB3aGF0IGFuIGBhbnlgXG4qICAgb3IgYHVua25vd25gIGVsZW1lbnQgaG9sZGluZyBhIGZ1bmN0aW9uLCBhIHN5bWJvbCwgb3IgYSBgdG9KU09OYCB0aGF0XG4qICAgcmV0dXJucyBub3RoaW5nIHNlcmlhbGl6ZXMgdG8uXG4qXG4qIFRoZSBsZW5ndGggaXMgY29udmVydGVkIHdpdGggYFRvTGVuZ3RoYCBhbmQgcmVhZCBvbmNlLCB3aGljaCBpcyBib3RoIHdoYXRcbiogYEpTT04uc3RyaW5naWZ5YCBkb2VzIGFuZCB3aGF0IGBBcnJheS5wcm90b3R5cGUuZXZlcnlgIC0gdGhlIHRyYXZlcnNhbFxuKiB0eXBpYSdzIG93biBhcnJheSBjaGVja2VycyBlbWl0IC0gZG9lcywgc28gdGhlIGNoZWNrZXIgYW5kIHRoZSBzZXJpYWxpemVyXG4qIHdhbGsgb25lIGluZGV4IHJhbmdlIHJhdGhlciB0aGFuIHR3byB0aGF0IG1lcmVseSB1c3VhbGx5IGNvaW5jaWRlLlxuKlxuKiBAcGFyYW0gZWxlbWVudHMgQXJyYXkgYmVpbmcgc2VyaWFsaXplZC5cbiogQHBhcmFtIG1hcHBlciBTZXJpYWxpemVyIG9mIG9uZSBlbGVtZW50LCBlbWl0dGVkIGJ5IHRoZSB0cmFuc2Zvcm0uXG4qIEByZXR1cm5zIENvbW1hIHNlcGFyYXRlZCBlbGVtZW50IHRleHQsIHdpdGhvdXQgdGhlIGVuY2xvc2luZyBicmFja2V0cy5cbiogQGludGVybmFsXG4qL1xuY29uc3QgX2pzb25TdHJpbmdpZnlBcnJheSA9IChlbGVtZW50cywgbWFwcGVyKSA9PiB7XG5cdGNvbnN0IGxlbmd0aCA9IE1hdGgubWluKE1hdGgubWF4KE1hdGgudHJ1bmMoZWxlbWVudHMubGVuZ3RoKSB8fCAwLCAwKSwgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVIpO1xuXHRsZXQgb3V0cHV0ID0gXCJcIjtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdGNvbnN0IGVsZW0gPSBlbGVtZW50c1tpXTtcblx0XHRjb25zdCB0ZXh0ID0gZWxlbSA9PT0gdm9pZCAwID8gdm9pZCAwIDogbWFwcGVyKGVsZW0sIGkpO1xuXHRcdG91dHB1dCArPSAoaSA9PT0gMCA/IFwiXCIgOiBcIixcIikgKyAodGV4dCA9PT0gdm9pZCAwID8gXCJudWxsXCIgOiB0ZXh0KTtcblx0fVxuXHRyZXR1cm4gb3V0cHV0O1xufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgX2pzb25TdHJpbmdpZnlBcnJheSB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1fanNvblN0cmluZ2lmeUFycmF5Lm1qcy5tYXAiLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX2pzb25TdHJpbmdpZnlBcnJheV8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX2pzb25TdHJpbmdpZnlBcnJheVwiO1xuaW1wb3J0ICogYXMgX2pzb25TdHJpbmdpZnlTdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5U3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvbGlzdC1kaXJlY3RvcnkuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL2xpc3QtZGlyZWN0b3J5LmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXI7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJwcm9qZWN0RGlyXCIgPT09IGtleSB8fCBcInJlbGF0aXZlRGlyXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnByb2plY3REaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucHJvamVjdERpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5wcm9qZWN0RGlyXG4gICAgICAgICAgICB9KSwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbGF0aXZlRGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJlbGF0aXZlRGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnJlbGF0aXZlRGlyXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBwcm9qZWN0RGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWxhdGl2ZURpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBBcnJheS5pc0FycmF5KGlucHV0LmVudHJpZXMpICYmIGlucHV0LmVudHJpZXMuZXZlcnkoKGVsZW06IGFueSkgPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGVsZW0gJiYgbnVsbCAhPT0gZWxlbSAmJiBfaW8xKGVsZW0pKTtcbiAgICAgICAgY29uc3QgX2lvMSA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQubmFtZSAmJiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmlzRGlyO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQuZW50cmllcykpXG4gICAgICAgICAgICAgICAgKCgpID0+IGlucHV0LmVudHJpZXMuZm9yRWFjaCgoZWxlbTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgZWxlbSAmJiBudWxsICE9PSBlbGVtKVxuICAgICAgICAgICAgICAgICAgICAgICAgX3BvMShlbGVtKTtcbiAgICAgICAgICAgICAgICB9KSkoKTtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImVudHJpZXNcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3BvMSA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcIm5hbWVcIiA9PT0ga2V5IHx8IFwiaXNEaXJcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFsoQXJyYXkuaXNBcnJheShpbnB1dC5lbnRyaWVzKSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5lbnRyaWVzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwieyBuYW1lOiBzdHJpbmc7IGlzRGlyOiBib29sZWFuOyB9W11cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZW50cmllc1xuICAgICAgICAgICAgfSkpICYmIGlucHV0LmVudHJpZXMubWFwKChlbGVtOiBhbnksIF9pbmRleDI6IG51bWJlcikgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBlbGVtICYmIG51bGwgIT09IGVsZW0gfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZW50cmllc1tcIiArIF9pbmRleDIgKyBcIl1cIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJ7IG5hbWU6IHN0cmluZzsgaXNEaXI6IGJvb2xlYW47IH1cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogZWxlbVxuICAgICAgICAgICAgfSkpICYmIF92bzEoZWxlbSwgX3BhdGggKyBcIi5lbnRyaWVzW1wiICsgX2luZGV4MiArIFwiXVwiLCB0cnVlICYmIF9leGNlcHRpb25hYmxlKSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5lbnRyaWVzW1wiICsgX2luZGV4MiArIFwiXVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInsgbmFtZTogc3RyaW5nOyBpc0RpcjogYm9vbGVhbjsgfVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBlbGVtXG4gICAgICAgICAgICB9KSkuZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmVudHJpZXNcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJ7IG5hbWU6IHN0cmluZzsgaXNEaXI6IGJvb2xlYW47IH1bXVwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5lbnRyaWVzXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfdm8xID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5uYW1lIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLm5hbWVcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQubmFtZVxuICAgICAgICAgICAgfSksIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNEaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuaXNEaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmlzRGlyXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fbGlzdF9kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJlbnRyaWVzXCI6JHtgWyR7X2pzb25TdHJpbmdpZnlBcnJheV8xLl9qc29uU3RyaW5naWZ5QXJyYXkoaW5wdXQuZW50cmllcywgKGVsZW06IGFueSkgPT4gX3NvMShlbGVtKSl9XWB9fWA7XG4gICAgICAgICAgICBjb25zdCBfc28xID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcIm5hbWVcIjoke19qc29uU3RyaW5naWZ5U3RyaW5nXzEuX2pzb25TdHJpbmdpZnlTdHJpbmcoaW5wdXQubmFtZSl9LFwiaXNEaXJcIjoke1N0cmluZyhpbnB1dC5pc0Rpcil9fWA7XG4gICAgICAgICAgICBjb25zdCBfaW8xID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5uYW1lICYmIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuaXNEaXI7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX2pzb25TdHJpbmdpZnlTdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5U3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvcGljay1kaXJlY3RvcnkuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL3BpY2stZGlyZWN0b3J5LmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiB0cnVlO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKVxuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIGZhbHNlID09PSBBcnJheS5pc0FycmF5KGlucHV0KSAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7fSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IG51bGwgPT09IGlucHV0LnBhdGggfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnBhdGg7XG4gICAgICAgIGNvbnN0IF9wbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoXCJwYXRoXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbbnVsbCA9PT0gaW5wdXQucGF0aCB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucGF0aCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5wYXRoXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiKG51bGwgfCBzdHJpbmcpXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnBhdGhcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcInBhdGhcIjoke251bGwgIT09IGlucHV0LnBhdGggPyBfanNvblN0cmluZ2lmeVN0cmluZ18xLl9qc29uU3RyaW5naWZ5U3RyaW5nKGlucHV0LnBhdGgpIDogXCJudWxsXCJ9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3BpY2tfZGlyZWN0b3J5VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbVN0cmluZ18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVN0cmluZ1wiO1xuaW1wb3J0ICogYXMgX2pzb25TdHJpbmdpZnlTdHJpbmdfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19qc29uU3RyaW5naWZ5U3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL3JlYWQtZmlsZS5hY3Rpb24udHNcIjtcbi8vIHR5cGlhIHRyYW5zZm9ybTogdHRzYyBUdHNjQ29tcGlsZXIudHJhbnNmb3JtKCkgKHR5cGlhL2xpYi90cmFuc2Zvcm0gcGx1Z2luKVxuZXhwb3J0IGRlZmF1bHQge1xuICAgIHR5cGU6IFwiYWN0aW9uXCIsXG4gICAgdHlwZXM6IHVuZGVmaW5lZCBhcyBhbnkgYXMge1xuICAgICAgICBcIvCfpZtcIjogYm9vbGVhbjtcbiAgICAgICAgbWV0YTogKHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj47XG4gICAgfSxcbiAgICBtb2R1bGU6ICgpID0+IGltcG9ydChcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2xvY2FsLWZpbGUvcmVhZC1maWxlLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnByb2plY3REaXIgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbGF0aXZlRGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInByb2plY3REaXJcIiA9PT0ga2V5IHx8IFwicmVsYXRpdmVEaXJcIiA9PT0ga2V5IHx8IFwiZmlsZU5hbWVcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucHJvamVjdERpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5wcm9qZWN0RGlyXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwic3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LnByb2plY3REaXJcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQucmVsYXRpdmVEaXIgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucmVsYXRpdmVEaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucmVsYXRpdmVEaXJcbiAgICAgICAgICAgIH0pLCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuZmlsZU5hbWUgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIuZmlsZU5hbWVcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZmlsZU5hbWVcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe1xuICAgICAgICAgICAgcHJvamVjdERpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgcmVsYXRpdmVEaXI6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGZpbGVOYW1lOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gbnVsbCA9PT0gaW5wdXQuY29udGVudCB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuY29udGVudDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImNvbnRlbnRcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtudWxsID09PSBpbnB1dC5jb250ZW50IHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5jb250ZW50IHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCIobnVsbCB8IHN0cmluZylcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuY29udGVudFxuICAgICAgICAgICAgfSldLmV2ZXJ5KChmbGFnOiBib29sZWFuKSA9PiBmbGFnKTtcbiAgICAgICAgY29uc3QgX19pcyA9IChpbnB1dDogYW55KTogaW5wdXQgaXMgQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3JlYWRfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJjb250ZW50XCI6JHtudWxsICE9PSBpbnB1dC5jb250ZW50ID8gX2pzb25TdHJpbmdpZnlTdHJpbmdfMS5fanNvblN0cmluZ2lmeVN0cmluZyhpbnB1dC5jb250ZW50KSA6IFwibnVsbFwifX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+KTogc3RyaW5nID0+IF9zbzAoaW5wdXQpO1xuICAgICAgICB9KSgpKHJlc3VsdHMpIGFzIGFueTtcbiAgICB9LFxufTtcbiIsIi8vIEB0cy1ub2NoZWNrXG5pbXBvcnQgKiBhcyBfcmFuZG9tU3RyaW5nXzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fcmFuZG9tU3RyaW5nXCI7XG5pbXBvcnQgKiBhcyBfcmFuZG9tUGlja18xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3JhbmRvbVBpY2tcIjtcbmltcG9ydCAqIGFzIF92YWxpZGF0ZVJlcG9ydF8xIGZyb20gXCJ0eXBpYS9saWIvaW50ZXJuYWwvX3ZhbGlkYXRlUmVwb3J0XCI7XG4vLyByb3V0ZS1zY2hlbWFcbmltcG9ydCB0eXBpYSwgeyB0eXBlIElWYWxpZGF0aW9uLCB0eXBlIFJlc29sdmVkIH0gZnJvbSBcInR5cGlhXCI7XG5pbXBvcnQgdHlwZSAqIGFzIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL3dyaXRlLWZpbGUuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24pIGV4dGVuZHMge1xuICAgICAgICAgICAgbWV0YTogaW5mZXIgTTtcbiAgICAgICAgfSA/IE0gOiB1bmRlZmluZWQ7XG4gICAgICAgIHBhcmFtczogUmVzb2x2ZWQ8UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9sb2NhbC1maWxlL3dyaXRlLWZpbGUuYWN0aW9uLnRzXCIpLFxuICAgIHZhbGlkYXRlUGFyYW1zOiAocGFyYW1zOiBhbnkpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnByb2plY3REaXIgJiYgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGlucHV0LnJlbGF0aXZlRGlyICYmIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZSAmJiBcInN0cmluZ1wiID09PSB0eXBlb2YgaW5wdXQuY29udGVudCAmJiAoXCJiYXNlNjRcIiA9PT0gaW5wdXQuZW5jb2RpbmcgfHwgXCJ1dGY4XCIgPT09IGlucHV0LmVuY29kaW5nKTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInByb2plY3REaXJcIiA9PT0ga2V5IHx8IFwicmVsYXRpdmVEaXJcIiA9PT0ga2V5IHx8IFwiZmlsZU5hbWVcIiA9PT0ga2V5IHx8IFwiY29udGVudFwiID09PSBrZXkgfHwgXCJlbmNvZGluZ1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5wcm9qZWN0RGlyIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnByb2plY3REaXJcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucHJvamVjdERpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5yZWxhdGl2ZURpciB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5yZWxhdGl2ZURpclwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5yZWxhdGl2ZURpclxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5maWxlTmFtZSB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5maWxlTmFtZVwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcInN0cmluZ1wiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5maWxlTmFtZVxuICAgICAgICAgICAgfSksIFwic3RyaW5nXCIgPT09IHR5cGVvZiBpbnB1dC5jb250ZW50IHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmNvbnRlbnRcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJzdHJpbmdcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuY29udGVudFxuICAgICAgICAgICAgfSksIFwiYmFzZTY0XCIgPT09IGlucHV0LmVuY29kaW5nIHx8IFwidXRmOFwiID09PSBpbnB1dC5lbmNvZGluZyB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5lbmNvZGluZ1wiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIihcXFwiYmFzZTY0XFxcIiB8IFxcXCJ1dGY4XFxcIilcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQuZW5jb2RpbmdcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0gPT4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0ICYmIF9pbzAoaW5wdXQpO1xuICAgICAgICBsZXQgZXJyb3JzOiBhbnk7XG4gICAgICAgIGxldCBfcmVwb3J0OiBhbnk7XG4gICAgICAgIGNvbnN0IF9fdmFsaWRhdGUgPSAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBwcm9qZWN0RGlyOiAoX2dlbmVyYXRvcj8uc3RyaW5nID8/IF9yYW5kb21TdHJpbmdfMS5fcmFuZG9tU3RyaW5nKSh7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzdHJpbmdcIlxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWxhdGl2ZURpcjogKF9nZW5lcmF0b3I/LnN0cmluZyA/PyBfcmFuZG9tU3RyaW5nXzEuX3JhbmRvbVN0cmluZykoe1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic3RyaW5nXCJcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWU6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGNvbnRlbnQ6IChfZ2VuZXJhdG9yPy5zdHJpbmcgPz8gX3JhbmRvbVN0cmluZ18xLl9yYW5kb21TdHJpbmcpKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInN0cmluZ1wiXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIGVuY29kaW5nOiBfcmFuZG9tUGlja18xLl9yYW5kb21QaWNrKFtcbiAgICAgICAgICAgICAgICAoKSA9PiBcImJhc2U2NFwiLFxuICAgICAgICAgICAgICAgICgpID0+IFwidXRmOFwiXG4gICAgICAgICAgICBdKSgpXG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5zdWNjZXNzO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwic3VjY2Vzc1wiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQuc3VjY2VzcyB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5zdWNjZXNzXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2xvY2FsX2ZpbGVfX3dyaXRlX2ZpbGVUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBpZiAoZmFsc2UgPT09IF9faXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzID0gW107XG4gICAgICAgICAgICAgICAgX3JlcG9ydCA9IChfdmFsaWRhdGVSZXBvcnRfMS5fdmFsaWRhdGVSZXBvcnQgYXMgYW55KShlcnJvcnMpO1xuICAgICAgICAgICAgICAgICgoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKSA9PiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0IHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24pW1wiaGFuZGxlclwiXT4+ID0+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IF9zbzAgPSAoaW5wdXQ6IGFueSk6IGFueSA9PiBge1wic3VjY2Vzc1wiOiR7U3RyaW5nKGlucHV0LnN1Y2Nlc3MpfX1gO1xuICAgICAgICAgICAgcmV0dXJuIChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3ZhbGlkYXRlUmVwb3J0XzEgZnJvbSBcInR5cGlhL2xpYi9pbnRlcm5hbC9fdmFsaWRhdGVSZXBvcnRcIjtcbi8vIHJvdXRlLXNjaGVtYVxuaW1wb3J0IHR5cGlhLCB7IHR5cGUgSVZhbGlkYXRpb24sIHR5cGUgUmVzb2x2ZWQgfSBmcm9tIFwidHlwaWFcIjtcbmltcG9ydCB0eXBlICogYXMgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uIGZyb20gXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvZ2V0LmFjdGlvbi50c1wiO1xuLy8gdHlwaWEgdHJhbnNmb3JtOiB0dHNjIFR0c2NDb21waWxlci50cmFuc2Zvcm0oKSAodHlwaWEvbGliL3RyYW5zZm9ybSBwbHVnaW4pXG5leHBvcnQgZGVmYXVsdCB7XG4gICAgdHlwZTogXCJhY3Rpb25cIixcbiAgICB0eXBlczogdW5kZWZpbmVkIGFzIGFueSBhcyB7XG4gICAgICAgIFwi8J+lm1wiOiBib29sZWFuO1xuICAgICAgICBtZXRhOiAodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbikgZXh0ZW5kcyB7XG4gICAgICAgICAgICBtZXRhOiBpbmZlciBNO1xuICAgICAgICB9ID8gTSA6IHVuZGVmaW5lZDtcbiAgICAgICAgcGFyYW1zOiBSZXNvbHZlZDxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPjtcbiAgICAgICAgcmVzdWx0OiBSZXNvbHZlZDxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PjtcbiAgICB9LFxuICAgIG1vZHVsZTogKCkgPT4gaW1wb3J0KFwiLi4vLi4vLi4vLi4vLi4vYXBwL21vZHVsZXMvZGVza3RvcC1zZXR0aW5nL2dldC5hY3Rpb24udHNcIiksXG4gICAgdmFsaWRhdGVQYXJhbXM6IChwYXJhbXM6IGFueSk6IElWYWxpZGF0aW9uPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+ID0+ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IF9pbzAgPSAoaW5wdXQ6IGFueSk6IGJvb2xlYW4gPT4gdHJ1ZTtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSlcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IHRydWU7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBmYWxzZSA9PT0gQXJyYXkuaXNBcnJheShpbnB1dCkgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgZmFsc2UgPT09IEFycmF5LmlzQXJyYXkoaW5wdXQpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkgJiYgX3ZvMChpbnB1dCwgX3BhdGggKyBcIlwiLCB0cnVlKSB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJQYXJhbXNcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpKGlucHV0LCBcIiRpbnB1dFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWNjZXNzID0gMCA9PT0gZXJyb3JzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHN1Y2Nlc3MgPyB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3JzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgfSBhcyBhbnk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF9fcHJ1bmUgPSAoaW5wdXQ6IFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+WzFdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpZiAoXCJvYmplY3RcIiA9PT0gdHlwZW9mIGlucHV0ICYmIG51bGwgIT09IGlucHV0KVxuICAgICAgICAgICAgICAgIF9wbzAoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIGlucHV0O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gX192YWxpZGF0ZShpbnB1dCk7XG4gICAgICAgICAgICBpZiAocmVzdWx0LnN1Y2Nlc3MpXG4gICAgICAgICAgICAgICAgX19wcnVuZShpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgIH0pKCkocGFyYW1zKSBhcyBhbnksXG4gICAgcmFuZG9tUGFyYW1zOiAoKTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX3JvMCA9IChfcmVjdXJzaXZlOiBib29sZWFuID0gZmFsc2UsIF9kZXB0aDogbnVtYmVyID0gMCk6IGFueSA9PiAoe30pO1xuICAgICAgICBsZXQgX2dlbmVyYXRvcjogUGFydGlhbDxpbXBvcnQoXCJ0eXBpYVwiKS5JUmFuZG9tR2VuZXJhdG9yPiB8IHVuZGVmaW5lZDtcbiAgICAgICAgcmV0dXJuIChnZW5lcmF0b3I/OiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+KTogaW1wb3J0KFwidHlwaWFcIikuUmVzb2x2ZWQ8UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIF9nZW5lcmF0b3IgPSBnZW5lcmF0b3I7XG4gICAgICAgICAgICByZXR1cm4gX3JvMCgpO1xuICAgICAgICB9O1xuICAgIH0pKCkoKSBhcyBhbnksXG4gICAgdmFsaWRhdGVSZXN1bHRzOiAocmVzdWx0czogYW55KTogSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uKVtcImhhbmRsZXJcIl0+Pj4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cCAmJiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnJ1bkluQmFja2dyb3VuZDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImxhdW5jaEF0U3RhcnR1cFwiID09PSBrZXkgfHwgXCJydW5JbkJhY2tncm91bmRcIiA9PT0ga2V5KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgaW5wdXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX3ZvMCA9IChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpOiBib29sZWFuID0+IFtcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cCB8fCBfcmVwb3J0KF9leGNlcHRpb25hYmxlLCB7XG4gICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIi5sYXVuY2hBdFN0YXJ0dXBcIixcbiAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0LmxhdW5jaEF0U3RhcnR1cFxuICAgICAgICAgICAgfSksIFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJ1bkluQmFja2dyb3VuZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucnVuSW5CYWNrZ3JvdW5kXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+PiA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlJlc3VsdFwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogQXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uW1wiaGFuZGxlclwiXT4+PiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShyZXN1bHRzKSBhcyBhbnksXG4gICAgcmVzdWx0c1RvSlNPTjogKHJlc3VsdHM6IGFueSk6IEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbilbXCJoYW5kbGVyXCJdPj4gPT4ge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgX3NvMCA9IChpbnB1dDogYW55KTogYW55ID0+IGB7XCJsYXVuY2hBdFN0YXJ0dXBcIjoke1N0cmluZyhpbnB1dC5sYXVuY2hBdFN0YXJ0dXApfSxcInJ1bkluQmFja2dyb3VuZFwiOiR7U3RyaW5nKGlucHV0LnJ1bkluQmFja2dyb3VuZCl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbUJvb2xlYW5fMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21Cb29sZWFuXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2Rlc2t0b3Atc2V0dGluZy9zZXQtbGF1bmNoLWF0LXN0YXJ0dXAuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvc2V0LWxhdW5jaC1hdC1zdGFydHVwLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LmxhdW5jaEF0U3RhcnR1cDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcImxhdW5jaEF0U3RhcnR1cFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQubGF1bmNoQXRTdGFydHVwIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLmxhdW5jaEF0U3RhcnR1cFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQubGF1bmNoQXRTdGFydHVwXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBsYXVuY2hBdFN0YXJ0dXA6IChfZ2VuZXJhdG9yPy5ib29sZWFuID8/IF9yYW5kb21Cb29sZWFuXzEuX3JhbmRvbUJvb2xlYW4pKClcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQubGF1bmNoQXRTdGFydHVwO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwibGF1bmNoQXRTdGFydHVwXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5sYXVuY2hBdFN0YXJ0dXAgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIubGF1bmNoQXRTdGFydHVwXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5sYXVuY2hBdFN0YXJ0dXBcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcImxhdW5jaEF0U3RhcnR1cFwiOiR7U3RyaW5nKGlucHV0LmxhdW5jaEF0U3RhcnR1cCl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgX3JhbmRvbUJvb2xlYW5fMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL19yYW5kb21Cb29sZWFuXCI7XG5pbXBvcnQgKiBhcyBfdmFsaWRhdGVSZXBvcnRfMSBmcm9tIFwidHlwaWEvbGliL2ludGVybmFsL192YWxpZGF0ZVJlcG9ydFwiO1xuLy8gcm91dGUtc2NoZW1hXG5pbXBvcnQgdHlwaWEsIHsgdHlwZSBJVmFsaWRhdGlvbiwgdHlwZSBSZXNvbHZlZCB9IGZyb20gXCJ0eXBpYVwiO1xuaW1wb3J0IHR5cGUgKiBhcyBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24gZnJvbSBcIi4uLy4uLy4uLy4uLy4uL2FwcC9tb2R1bGVzL2Rlc2t0b3Atc2V0dGluZy9zZXQtcnVuLWluLWJhY2tncm91bmQuYWN0aW9uLnRzXCI7XG4vLyB0eXBpYSB0cmFuc2Zvcm06IHR0c2MgVHRzY0NvbXBpbGVyLnRyYW5zZm9ybSgpICh0eXBpYS9saWIvdHJhbnNmb3JtIHBsdWdpbilcbmV4cG9ydCBkZWZhdWx0IHtcbiAgICB0eXBlOiBcImFjdGlvblwiLFxuICAgIHR5cGVzOiB1bmRlZmluZWQgYXMgYW55IGFzIHtcbiAgICAgICAgXCLwn6WbXCI6IGJvb2xlYW47XG4gICAgICAgIG1ldGE6ICh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uKSBleHRlbmRzIHtcbiAgICAgICAgICAgIG1ldGE6IGluZmVyIE07XG4gICAgICAgIH0gPyBNIDogdW5kZWZpbmVkO1xuICAgICAgICBwYXJhbXM6IFJlc29sdmVkPFBhcmFtZXRlcnM8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24pW1wiaGFuZGxlclwiXT5bMV0+O1xuICAgICAgICByZXN1bHQ6IFJlc29sdmVkPEF3YWl0ZWQ8UmV0dXJuVHlwZTwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbilbXCJoYW5kbGVyXCJdPj4+O1xuICAgIH0sXG4gICAgbW9kdWxlOiAoKSA9PiBpbXBvcnQoXCIuLi8uLi8uLi8uLi8uLi9hcHAvbW9kdWxlcy9kZXNrdG9wLXNldHRpbmcvc2V0LXJ1bi1pbi1iYWNrZ3JvdW5kLmFjdGlvbi50c1wiKSxcbiAgICB2YWxpZGF0ZVBhcmFtczogKHBhcmFtczogYW55KTogSVZhbGlkYXRpb248UGFyYW1ldGVyczwodHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbilbXCJoYW5kbGVyXCJdPlsxXT4gPT4gKCgpID0+IHtcbiAgICAgICAgY29uc3QgX2lvMCA9IChpbnB1dDogYW55KTogYm9vbGVhbiA9PiBcImJvb2xlYW5cIiA9PT0gdHlwZW9mIGlucHV0LnJ1bkluQmFja2dyb3VuZDtcbiAgICAgICAgY29uc3QgX3BvMCA9IChpbnB1dDogYW55KTogYW55ID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGlmIChcInJ1bkluQmFja2dyb3VuZFwiID09PSBrZXkpXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBpbnB1dFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfdm8wID0gKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4gPT4gW1wiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kIHx8IF9yZXBvcnQoX2V4Y2VwdGlvbmFibGUsIHtcbiAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiLnJ1bkluQmFja2dyb3VuZFwiLFxuICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXQucnVuSW5CYWNrZ3JvdW5kXG4gICAgICAgICAgICB9KV0uZXZlcnkoKGZsYWc6IGJvb2xlYW4pID0+IGZsYWcpO1xuICAgICAgICBjb25zdCBfX2lzID0gKGlucHV0OiBhbnkpOiBpbnB1dCBpcyBQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXSA9PiBcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgJiYgX2lvMChpbnB1dCk7XG4gICAgICAgIGxldCBlcnJvcnM6IGFueTtcbiAgICAgICAgbGV0IF9yZXBvcnQ6IGFueTtcbiAgICAgICAgY29uc3QgX192YWxpZGF0ZSA9IChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248UGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0+ID0+IHtcbiAgICAgICAgICAgIGlmIChmYWxzZSA9PT0gX19pcyhpbnB1dCkpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMgPSBbXTtcbiAgICAgICAgICAgICAgICBfcmVwb3J0ID0gKF92YWxpZGF0ZVJlcG9ydF8xLl92YWxpZGF0ZVJlcG9ydCBhcyBhbnkpKGVycm9ycyk7XG4gICAgICAgICAgICAgICAgKChpbnB1dDogYW55LCBfcGF0aDogc3RyaW5nLCBfZXhjZXB0aW9uYWJsZTogYm9vbGVhbiA9IHRydWUpID0+IChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUGFyYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKSAmJiBfdm8wKGlucHV0LCBfcGF0aCArIFwiXCIsIHRydWUpIHx8IF9yZXBvcnQodHJ1ZSwge1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiBfcGF0aCArIFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkOiBcIlBhcmFtc1wiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSkoaW5wdXQsIFwiJGlucHV0XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN1Y2Nlc3MgPSAwID09PSBlcnJvcnMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHJldHVybiAoc3VjY2VzcyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzcyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcnMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGlucHV0XG4gICAgICAgICAgICB9IGFzIGFueTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgX19wcnVuZSA9IChpbnB1dDogUGFyYW1ldGVyczx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT5bMV0pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGlmIChcIm9iamVjdFwiID09PSB0eXBlb2YgaW5wdXQgJiYgbnVsbCAhPT0gaW5wdXQpXG4gICAgICAgICAgICAgICAgX3BvMChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiAoaW5wdXQ6IGFueSk6IGltcG9ydChcInR5cGlhXCIpLklWYWxpZGF0aW9uPFBhcmFtZXRlcnM8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+WzFdPiA9PiB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBfX3ZhbGlkYXRlKGlucHV0KTtcbiAgICAgICAgICAgIGlmIChyZXN1bHQuc3VjY2VzcylcbiAgICAgICAgICAgICAgICBfX3BydW5lKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgfSkoKShwYXJhbXMpIGFzIGFueSxcbiAgICByYW5kb21QYXJhbXM6ICgpOiBJVmFsaWRhdGlvbjxQYXJhbWV0ZXJzPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uKVtcImhhbmRsZXJcIl0+WzFdPiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfcm8wID0gKF9yZWN1cnNpdmU6IGJvb2xlYW4gPSBmYWxzZSwgX2RlcHRoOiBudW1iZXIgPSAwKTogYW55ID0+ICh7XG4gICAgICAgICAgICBydW5JbkJhY2tncm91bmQ6IChfZ2VuZXJhdG9yPy5ib29sZWFuID8/IF9yYW5kb21Cb29sZWFuXzEuX3JhbmRvbUJvb2xlYW4pKClcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBfZ2VuZXJhdG9yOiBQYXJ0aWFsPGltcG9ydChcInR5cGlhXCIpLklSYW5kb21HZW5lcmF0b3I+IHwgdW5kZWZpbmVkO1xuICAgICAgICByZXR1cm4gKGdlbmVyYXRvcj86IFBhcnRpYWw8aW1wb3J0KFwidHlwaWFcIikuSVJhbmRvbUdlbmVyYXRvcj4pOiBpbXBvcnQoXCJ0eXBpYVwiKS5SZXNvbHZlZDxQYXJhbWV0ZXJzPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPlsxXT4gPT4ge1xuICAgICAgICAgICAgX2dlbmVyYXRvciA9IGdlbmVyYXRvcjtcbiAgICAgICAgICAgIHJldHVybiBfcm8wKCk7XG4gICAgICAgIH07XG4gICAgfSkoKSgpIGFzIGFueSxcbiAgICB2YWxpZGF0ZVJlc3VsdHM6IChyZXN1bHRzOiBhbnkpOiBJVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8KHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24pW1wiaGFuZGxlclwiXT4+PiA9PiAoKCkgPT4ge1xuICAgICAgICBjb25zdCBfaW8wID0gKGlucHV0OiBhbnkpOiBib29sZWFuID0+IFwiYm9vbGVhblwiID09PSB0eXBlb2YgaW5wdXQucnVuSW5CYWNrZ3JvdW5kO1xuICAgICAgICBjb25zdCBfcG8wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4ge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFwicnVuSW5CYWNrZ3JvdW5kXCIgPT09IGtleSlcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGlucHV0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IF92bzAgPSAoaW5wdXQ6IGFueSwgX3BhdGg6IHN0cmluZywgX2V4Y2VwdGlvbmFibGU6IGJvb2xlYW4gPSB0cnVlKTogYm9vbGVhbiA9PiBbXCJib29sZWFuXCIgPT09IHR5cGVvZiBpbnB1dC5ydW5JbkJhY2tncm91bmQgfHwgX3JlcG9ydChfZXhjZXB0aW9uYWJsZSwge1xuICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCIucnVuSW5CYWNrZ3JvdW5kXCIsXG4gICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dC5ydW5JbkJhY2tncm91bmRcbiAgICAgICAgICAgIH0pXS5ldmVyeSgoZmxhZzogYm9vbGVhbikgPT4gZmxhZyk7XG4gICAgICAgIGNvbnN0IF9faXMgPSAoaW5wdXQ6IGFueSk6IGlucHV0IGlzIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uW1wiaGFuZGxlclwiXT4+ID0+IFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCAmJiBfaW8wKGlucHV0KTtcbiAgICAgICAgbGV0IGVycm9yczogYW55O1xuICAgICAgICBsZXQgX3JlcG9ydDogYW55O1xuICAgICAgICBjb25zdCBfX3ZhbGlkYXRlID0gKGlucHV0OiBhbnkpOiBpbXBvcnQoXCJ0eXBpYVwiKS5JVmFsaWRhdGlvbjxBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+Pj4gPT4ge1xuICAgICAgICAgICAgaWYgKGZhbHNlID09PSBfX2lzKGlucHV0KSkge1xuICAgICAgICAgICAgICAgIGVycm9ycyA9IFtdO1xuICAgICAgICAgICAgICAgIF9yZXBvcnQgPSAoX3ZhbGlkYXRlUmVwb3J0XzEuX3ZhbGlkYXRlUmVwb3J0IGFzIGFueSkoZXJyb3JzKTtcbiAgICAgICAgICAgICAgICAoKGlucHV0OiBhbnksIF9wYXRoOiBzdHJpbmcsIF9leGNlcHRpb25hYmxlOiBib29sZWFuID0gdHJ1ZSkgPT4gKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dCB8fCBfcmVwb3J0KHRydWUsIHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogX3BhdGggKyBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogXCJSZXN1bHRcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGlucHV0XG4gICAgICAgICAgICAgICAgfSkpICYmIF92bzAoaW5wdXQsIF9wYXRoICsgXCJcIiwgdHJ1ZSkgfHwgX3JlcG9ydCh0cnVlLCB7XG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IF9wYXRoICsgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgZXhwZWN0ZWQ6IFwiUmVzdWx0XCIsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0pKShpbnB1dCwgXCIkaW5wdXRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3VjY2VzcyA9IDAgPT09IGVycm9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChzdWNjZXNzID8ge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBpbnB1dFxuICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgICAgICB9KSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogaW5wdXRcbiAgICAgICAgICAgIH0gYXMgYW55O1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBfX3BydW5lID0gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaWYgKFwib2JqZWN0XCIgPT09IHR5cGVvZiBpbnB1dCAmJiBudWxsICE9PSBpbnB1dClcbiAgICAgICAgICAgICAgICBfcG8wKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIChpbnB1dDogYW55KTogaW1wb3J0KFwidHlwaWFcIikuSVZhbGlkYXRpb248QXdhaXRlZDxSZXR1cm5UeXBlPHR5cGVvZiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb25bXCJoYW5kbGVyXCJdPj4+ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IF9fdmFsaWRhdGUoaW5wdXQpO1xuICAgICAgICAgICAgaWYgKHJlc3VsdC5zdWNjZXNzKVxuICAgICAgICAgICAgICAgIF9fcHJ1bmUoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICB9KSgpKHJlc3VsdHMpIGFzIGFueSxcbiAgICByZXN1bHRzVG9KU09OOiAocmVzdWx0czogYW55KTogQXdhaXRlZDxSZXR1cm5UeXBlPCh0eXBlb2YgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uKVtcImhhbmRsZXJcIl0+PiA9PiB7XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBfc28wID0gKGlucHV0OiBhbnkpOiBhbnkgPT4gYHtcInJ1bkluQmFja2dyb3VuZFwiOiR7U3RyaW5nKGlucHV0LnJ1bkluQmFja2dyb3VuZCl9fWA7XG4gICAgICAgICAgICByZXR1cm4gKGlucHV0OiBBd2FpdGVkPFJldHVyblR5cGU8dHlwZW9mIG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbltcImhhbmRsZXJcIl0+Pik6IHN0cmluZyA9PiBfc28wKGlucHV0KTtcbiAgICAgICAgfSkoKShyZXN1bHRzKSBhcyBhbnk7XG4gICAgfSxcbn07XG4iLCIvLyByb3V0ZS1zY2hlbWFcbmltcG9ydCBtb2R1bGVzX19pbmRleFRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19faW5kZXhUYWN0aW9uLzJ5Y3Rrb2o2YzJ2bWQvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2luZG93X19jbG9zZVRhY3Rpb24vOTc2Y3h4cXVsaHdhL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX3dpbmRvd19fZ2V0X3N0YXRlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24vMWlmcGk3cDFlNm1jdC9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbi8zZjg1b2Vjd2hndGpqL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uLzcwcXNiamVta3FyMi9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX193YWxscGFwZXJfX2NhbmNlbFRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fd2FsbHBhcGVyX19jYW5jZWxUYWN0aW9uLzF4aXh4bnZ5d2V3bnIvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fd2FsbHBhcGVyX19zZXRUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3dhbGxwYXBlcl9fc2V0VGFjdGlvbi9nYXVhcmgzNno3dXQvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX3VwZGF0ZXJfX2Rvd25sb2FkVGFjdGlvbi8zZGZ3aGJ2anV4OXN1L3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX3VwZGF0ZXJfX3JlbG9hZFRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fdXBkYXRlcl9fcmVsb2FkVGFjdGlvbi8zamwydjh0djEzZXhzL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19kZWxldGVfZmlsZVRhY3Rpb24vNWo5cnJuYzdjZ3B2L3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2V4aXN0c1RhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbi8xOW1naXJzN3NzNDNlL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2xpc3RfZGlyZWN0b3J5VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24vMjFtZDF0Nzg0MGp0Mi9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19sb2NhbF9maWxlX19waWNrX2RpcmVjdG9yeVRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uLzFrb29yM2t1cmlnYWwvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fbG9jYWxfZmlsZV9fcmVhZF9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uLzh0Y3V6N3UwODczeS9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19sb2NhbF9maWxlX193cml0ZV9maWxlVGFjdGlvbi8yNGZmeTI4aHY0Y2hsL3NjaGVtYS50c1wiO1xuaW1wb3J0IG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fZ2V0VGFjdGlvbiBmcm9tIFwiLi90cmFuc3BpbGVkL3JvdXRlcy9tb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX2dldFRhY3Rpb24vMTZ0ZHUzcnFzbjUzbi9zY2hlbWEudHNcIjtcbmltcG9ydCBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9sYXVuY2hfYXRfc3RhcnR1cFRhY3Rpb24gZnJvbSBcIi4vdHJhbnNwaWxlZC9yb3V0ZXMvbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfbGF1bmNoX2F0X3N0YXJ0dXBUYWN0aW9uLzN1eXU0dWFreHkwZWIvc2NoZW1hLnRzXCI7XG5pbXBvcnQgbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19zZXRfcnVuX2luX2JhY2tncm91bmRUYWN0aW9uIGZyb20gXCIuL3RyYW5zcGlsZWQvcm91dGVzL21vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X3J1bl9pbl9iYWNrZ3JvdW5kVGFjdGlvbi8xOXVhb2dndnc2d3lsL3NjaGVtYS50c1wiO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFwiL1wiOiBtb2R1bGVzX19pbmRleFRhY3Rpb24sXG4gIFwiL3dpbmRvdy9jbG9zZVwiOiBtb2R1bGVzX193aW5kb3dfX2Nsb3NlVGFjdGlvbixcbiAgXCIvd2luZG93L2dldC1zdGF0ZVwiOiBtb2R1bGVzX193aW5kb3dfX2dldF9zdGF0ZVRhY3Rpb24sXG4gIFwiL3dpbmRvdy9tYXhpbWl6ZVwiOiBtb2R1bGVzX193aW5kb3dfX21heGltaXplVGFjdGlvbixcbiAgXCIvd2luZG93L21pbmltaXplXCI6IG1vZHVsZXNfX3dpbmRvd19fbWluaW1pemVUYWN0aW9uLFxuICBcIi93YWxscGFwZXIvY2FuY2VsXCI6IG1vZHVsZXNfX3dhbGxwYXBlcl9fY2FuY2VsVGFjdGlvbixcbiAgXCIvd2FsbHBhcGVyL3NldFwiOiBtb2R1bGVzX193YWxscGFwZXJfX3NldFRhY3Rpb24sXG4gIFwiL3VwZGF0ZXIvZG93bmxvYWRcIjogbW9kdWxlc19fdXBkYXRlcl9fZG93bmxvYWRUYWN0aW9uLFxuICBcIi91cGRhdGVyL3JlbG9hZFwiOiBtb2R1bGVzX191cGRhdGVyX19yZWxvYWRUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL2RlbGV0ZS1maWxlXCI6IG1vZHVsZXNfX2xvY2FsX2ZpbGVfX2RlbGV0ZV9maWxlVGFjdGlvbixcbiAgXCIvbG9jYWwtZmlsZS9leGlzdHNcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fZXhpc3RzVGFjdGlvbixcbiAgXCIvbG9jYWwtZmlsZS9saXN0LWRpcmVjdG9yeVwiOiBtb2R1bGVzX19sb2NhbF9maWxlX19saXN0X2RpcmVjdG9yeVRhY3Rpb24sXG4gIFwiL2xvY2FsLWZpbGUvcGljay1kaXJlY3RvcnlcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fcGlja19kaXJlY3RvcnlUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL3JlYWQtZmlsZVwiOiBtb2R1bGVzX19sb2NhbF9maWxlX19yZWFkX2ZpbGVUYWN0aW9uLFxuICBcIi9sb2NhbC1maWxlL3dyaXRlLWZpbGVcIjogbW9kdWxlc19fbG9jYWxfZmlsZV9fd3JpdGVfZmlsZVRhY3Rpb24sXG4gIFwiL2Rlc2t0b3Atc2V0dGluZy9nZXRcIjogbW9kdWxlc19fZGVza3RvcF9zZXR0aW5nX19nZXRUYWN0aW9uLFxuICBcIi9kZXNrdG9wLXNldHRpbmcvc2V0LWxhdW5jaC1hdC1zdGFydHVwXCI6IG1vZHVsZXNfX2Rlc2t0b3Bfc2V0dGluZ19fc2V0X2xhdW5jaF9hdF9zdGFydHVwVGFjdGlvbixcbiAgXCIvZGVza3RvcC1zZXR0aW5nL3NldC1ydW4taW4tYmFja2dyb3VuZFwiOiBtb2R1bGVzX19kZXNrdG9wX3NldHRpbmdfX3NldF9ydW5faW5fYmFja2dyb3VuZFRhY3Rpb24sXG59O1xuIiwiLy8gcmF3LXNjaGVtYVxuXG5jb25zdCByYXdQYXRocyA9IG5ldyBTZXQ8c3RyaW5nPihbXG5dKTtcblxuY29uc3Qgcm91dGVzOiBSZWNvcmQ8c3RyaW5nLCB7IHR5cGU6IFwicmF3XCI7IG1vZHVsZTogKCkgPT4gUHJvbWlzZTxhbnk+IH0+ID0ge1xufTtcblxuZXhwb3J0IGRlZmF1bHQgeyByYXdQYXRocywgcm91dGVzIH07XG4iLCIvLyBoYW5kbGVyLXNjaGVtYVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGxvYWRIYW5kbGVyczood29ybGQ6IGFueSkgPT4gKFtcbiAgXSksXG59IiwiLy8gaW5kZXhcbmltcG9ydCB0eXBlIHsgTWlsa2lvTWV0YSwgTWlsa2lvQ29udGV4dCwgTWlsa2lvUmVqZWN0Q29kZSwgTWlsa2lvRXZlbnRzIH0gZnJvbSBcIi4vZGVjbGFyZXMudHNcIjtcbmltcG9ydCB0eXBpYVNjaGVtYSBmcm9tIFwiLi90eXBpYS1zY2hlbWEudHNcIjtcbmltcG9ydCByb3V0ZVNjaGVtYSBmcm9tIFwiLi9yb3V0ZS1zY2hlbWEudHNcIjtcbmltcG9ydCByYXdTY2hlbWEgZnJvbSBcIi4vcmF3LXNjaGVtYS50c1wiO1xuaW1wb3J0IGhhbmRsZXJTY2hlbWEgZnJvbSBcIi4vaGFuZGxlci1zY2hlbWEudHNcIjtcblxuXG5leHBvcnQgY29uc3QgZ2VuZXJhdGVkID0ge1xuICBtZXRhOiB1bmRlZmluZWQgYXMgdW5rbm93biBhcyBNaWxraW9NZXRhLFxuICBjb250ZXh0OiB1bmRlZmluZWQgYXMgdW5rbm93biBhcyBNaWxraW9Db250ZXh0LFxuICByZWplY3RDb2RlOiB1bmRlZmluZWQgYXMgdW5rbm93biBhcyBNaWxraW9SZWplY3RDb2RlLFxuICBldmVudHM6IHVuZGVmaW5lZCBhcyB1bmtub3duIGFzIE1pbGtpb0V2ZW50cyxcbiAgdHlwaWFTY2hlbWEsXG4gIHJvdXRlU2NoZW1hLFxuICByYXdTY2hlbWEsXG4gIGhhbmRsZXJTY2hlbWEsXG59O1xuIiwiaW1wb3J0IHsgdGltaW5nU2FmZUVxdWFsIH0gZnJvbSAnbm9kZTpjcnlwdG8nO1xyXG5pbXBvcnQgeyB0eXBlIE1pbGtpb1dvcmxkIH0gZnJvbSAnbWlsa2lvJztcclxuaW1wb3J0IHR5cGUgeyBnZW5lcmF0ZWQgfSBmcm9tICcuLi8uLi8uLi8ubWlsa2lvL2luZGV4LnRzJztcclxuXHJcbi8qKlxyXG4gKiBFbGVjdHJvbiDpgJrkv6Hku6TniYzmoKHpqoxcclxuICogRWxlY3Ryb24g5Li76L+b56iL5ZCv5Yqo5pe255Sf5oiQ6ZqP5py6IHRva2Vu77yM6YCa6L+HIFVSTCDlj4LmlbDkvKDpgJLnu5nmuLLmn5Pov5vnqIvjgIJcclxuICog5riy5p+T6L+b56iL77yIZW1iZWQgV29ya2Vy77yJ5q+P5qyh6K+35rGC5b+F6aG75pC65bimIFgtRWxlY3Ryb24tVG9rZW4g5aS06YOo77yMXHJcbiAqIOWmguaenOS4jeWMuemFjeWImeaLkue7neiuv+mXru+8jOmYsuatouWFtuS7lue9kemhteWXheaOouWIsOacrOWcsOerr+WPo+WQjuebtOaOpeiwg+eUqCBFbGVjdHJvbiDnq6/ngrnjgIJcclxuICovXHJcbmV4cG9ydCBjb25zdCBsb2FkRWxlY3Ryb25Ub2tlbiA9IGFzeW5jICh3b3JsZDogTWlsa2lvV29ybGQ8dHlwZW9mIGdlbmVyYXRlZD4pID0+IHtcclxuICB3b3JsZC5vbignbWlsa2lvOmh0dHBSZXF1ZXN0JywgYXN5bmMgKGV2ZW50KSA9PiB7XHJcbiAgICBjb25zdCB0b2tlbiA9IGV2ZW50Lmh0dHAucmVxdWVzdC5oZWFkZXJzLmdldCgnWC1FbGVjdHJvbi1Ub2tlbicpO1xyXG4gICAgaWYgKHRva2VuICYmIHRpbWluZ1NhZmVFcXVhbChCdWZmZXIuZnJvbSh0b2tlbiksIEJ1ZmZlci5mcm9tKGdsb2JhbFRoaXMuZWxlY3Ryb25Ub2tlbikpKSByZXR1cm47XHJcbiAgICB0aHJvdyBldmVudC5yZWplY3QoJ1JFUVVFU1RfVElNRU9VVCcsIHsgbWVzc2FnZTogJ+mUn+aWpOaLtycsIHRpbWVvdXQ6IC0xIH0pO1xyXG4gIH0pO1xyXG59O1xyXG4iLCJpbXBvcnQgJy4vYXBwL3V0aWxzL2VsZWN0cm9uLnRzJztcbmltcG9ydCB7IGNyZWF0ZVdvcmxkLCB0eXBlIE1pbGtpb0luaXQgfSBmcm9tICdtaWxraW8nO1xuaW1wb3J0IHsgY29uZmlnU2NoZW1hIH0gZnJvbSAnLi8ubWlsa2lvL2NvbmZpZy1zY2hlbWEudHMnO1xuaW1wb3J0IHsgZ2VuZXJhdGVkIH0gZnJvbSAnLi8ubWlsa2lvL2luZGV4LnRzJztcbmltcG9ydCB7IGNyZWF0ZUVsZWN0cm9uQXBwIH0gZnJvbSAnLi9hcHAvdXRpbHMvZWxlY3Ryb24udHMnO1xuaW1wb3J0IHsgbG9hZEVsZWN0cm9uVG9rZW4gfSBmcm9tICcuL2FwcC9ib290c3RyYXAvZWxlY3Ryb24tdG9rZW4vaW5kZXgudHMnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlKG9wdGlvbnM6IE1pbGtpb0luaXQpIHtcbiAgYXdhaXQgY3JlYXRlRWxlY3Ryb25BcHAoKTtcbiAgY29uc3Qgd29ybGQgPSBhd2FpdCBjcmVhdGVXb3JsZChnZW5lcmF0ZWQsIGNvbmZpZ1NjaGVtYSwge1xuICAgIC4uLm9wdGlvbnMsXG4gICAgcG9ydDogZ2xvYmFsVGhpcy5lbGVjdHJvblBvcnQgPz8gOTAwNixcbiAgICBib290c3RyYXBzOiBbbG9hZEVsZWN0cm9uVG9rZW5dLFxuICAgIGh0dHA6IHtcbiAgICAgIGNvcnM6IHtcbiAgICAgICAgY29yc0FsbG93Q3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgIGNvcnNBbGxvd01ldGhvZHM6IFsnT1BUSU9OUycsICdHRVQnLCAnUE9TVCddLFxuICAgICAgICBjb3JzQWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ01pbGtpby1UaW1lc3RhbXAnLCAnWC1FbGVjdHJvbi1Ub2tlbiddLFxuICAgICAgICBjb3JzQWxsb3dPcmlnaW46IFsnaHR0cHM6Ly9rZWNyZWFtLmNuJywgJ2h0dHBzOi8va2VjcmVhbS5saW5rJywgJ2h0dHBzOi8vYXBwLmtlY3JlYW0uY24nLCAnaHR0cHM6Ly9hcHAua2VjcmVhbS5saW5rJywgJ2h0dHA6Ly9sb2NhbGhvc3Q6OTAwMyddLFxuICAgICAgICBjb3JzTWF4QWdlOiA3MjAwLFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICByZXR1cm4gd29ybGQ7XG59XG4iLCIjIS91c3IvYmluL2VudiBub2RlXG4vLyBAdHMtbm9jaGVja1xuaW1wb3J0ICogYXMgaHR0cCBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgdHlwZSB7IEluY29taW5nTWVzc2FnZSwgU2VydmVyUmVzcG9uc2UgfSBmcm9tIFwibm9kZTpodHRwXCI7XG5pbXBvcnQgeyBjcmVhdGUgfSBmcm9tIFwiLi4vaW5kZXgudHNcIjtcbmltcG9ydCB7IGVudiB9IGZyb20gXCJub2RlOnByb2Nlc3NcIjtcblxuYXN5bmMgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICBjb25zdCB3b3JsZCA9IGF3YWl0IGNyZWF0ZSh7XG4gICAgcG9ydDogOTAwNixcbiAgICBkZXZlbG9wOiBCb29sZWFuKGVudi5DT09LQk9PS19CQVNFX1VSTCksXG4gICAgZmV0Y2hFbnY6IChrZXk6IHN0cmluZykgPT4gZW52W2tleV0gPz8gdW5kZWZpbmVkLFxuICB9KTtcblxuICBjb25zdCBzZXJ2ZXIgPSBodHRwLmNyZWF0ZVNlcnZlcigocmVxOiBJbmNvbWluZ01lc3NhZ2UsIHJlczogU2VydmVyUmVzcG9uc2UpID0+IHtcbiAgICAvLyBBY2N1bXVsYXRlIGV2ZXJ5IGNodW5rIHVuY29uZGl0aW9uYWxseTogTm9kZSBlbWl0cyB+NjRLQiBwZXIgXCJkYXRhXCJcbiAgICAvLyBldmVudCwgYW5kIGFueSBzbWFydGVyIGJ1ZmZlcmluZyBzY2hlbWUgaGVyZSBwcmV2aW91c2x5IGRyb3BwZWQgdGhlXG4gICAgLy8gdGhpcmQgY2h1bmsgb2YgbGFyZ2UgcmVxdWVzdCBib2RpZXMgKD4xMjhLQiksIGNvcnJ1cHRpbmcgSlNPTiBwYXJhbXMuXG4gICAgY29uc3QgYm9keUNodW5rczogQnVmZmVyW10gPSBbXTtcbiAgICByZXEub24oXCJkYXRhXCIsIChjaHVuazogQnVmZmVyKSA9PiB7XG4gICAgICBib2R5Q2h1bmtzLnB1c2goY2h1bmspO1xuICAgIH0pO1xuICAgIHJlcS5vbihcImVuZFwiLCAoKSA9PiB7XG4gICAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kID8/IFwiR0VUXCI7XG4gICAgICBjb25zdCBib2R5OiBVaW50OEFycmF5IHwgbnVsbCA9IGJvZHlDaHVua3MubGVuZ3RoID4gMCA/IEJ1ZmZlci5jb25jYXQoYm9keUNodW5rcykgOiBudWxsO1xuICAgICAgY29uc3QgYm9keVRleHQgPSBib2R5ID8gQnVmZmVyLmZyb20oYm9keSkudG9TdHJpbmcoXCJ1dGYtOFwiKSA6IFwiXCI7XG5cbiAgICAgIC8vIEJ1aWxkIGZ1bGwgVVJMIGZvciBzdGFuZGFyZCBSZXF1ZXN0XG4gICAgICBjb25zdCByZXFVcmwgPSByZXEudXJsID8/IFwiL1wiO1xuICAgICAgY29uc3QgcHJvdG9jb2wgPSAocmVxIGFzIGFueSkuZW5jcnlwdGVkID8gXCJodHRwc1wiIDogXCJodHRwXCI7XG4gICAgICBjb25zdCBob3N0ID0gcmVxLmhlYWRlcnMuaG9zdCA/PyBcImxvY2FsaG9zdFwiO1xuICAgICAgY29uc3QgZnVsbFVybCA9IGAke3Byb3RvY29sfTovLyR7aG9zdH0ke3JlcVVybH1gO1xuXG4gICAgICAvLyBCdWlsZCBzdGFuZGFyZCBIZWFkZXJzIGZyb20gTm9kZS5qcyBpbmNvbWluZyBoZWFkZXJzXG4gICAgICBjb25zdCBoZWFkZXJzID0gbmV3IEhlYWRlcnMoKTtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHJlcS5oZWFkZXJzKSkge1xuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgdiBvZiB2YWx1ZSkgaGVhZGVycy5hcHBlbmQoa2V5LCB2KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoZWFkZXJzLnNldChrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgQWJvcnRDb250cm9sbGVyIGZvciBzdHJlYW0gcmVxdWVzdHNcbiAgICAgIGNvbnN0IGlzU3RyZWFtID0gcmVxLmhlYWRlcnMuYWNjZXB0Py5zdGFydHNXaXRoKFwidGV4dC9ldmVudC1zdHJlYW1cIik7XG4gICAgICBjb25zdCBzaWduYWwgPSBpc1N0cmVhbSA/ICgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGFjID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgICAgICByZXMub24oXCJjbG9zZVwiLCAoKSA9PiB7IGFjLmFib3J0KCk7IH0pO1xuICAgICAgICByZXR1cm4gYWMuc2lnbmFsO1xuICAgICAgfSkoKSA6IHVuZGVmaW5lZDtcblxuICAgICAgLy8gQ29uc3RydWN0IHN0YW5kYXJkIFJlcXVlc3Qgb2JqZWN0XG4gICAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoZnVsbFVybCwge1xuICAgICAgICBtZXRob2QsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IG1ldGhvZCAhPT0gXCJHRVRcIiAmJiBtZXRob2QgIT09IFwiSEVBRFwiID8gYm9keSA6IHVuZGVmaW5lZCxcbiAgICAgICAgc2lnbmFsLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIEF0dGFjaCBwcmUtcmVhZCBkYXRhIGZvciBGYXN0IFBhdGggb3B0aW1pemF0aW9uXG4gICAgICBjb25zdCBxSW5kZXggPSByZXFVcmwuaW5kZXhPZihcIj9cIik7XG4gICAgICBjb25zdCBwYXRobmFtZSA9IHFJbmRleCA+PSAwID8gcmVxVXJsLnN1YnN0cmluZygwLCBxSW5kZXgpIDogcmVxVXJsO1xuICAgICAgKHJlcXVlc3QgYXMgYW55KS5fX2JvZHlUZXh0ID0gYm9keVRleHQ7XG4gICAgICAocmVxdWVzdCBhcyBhbnkpLl9fcGF0aG5hbWUgPSBwYXRobmFtZTtcbiAgICAgIChyZXF1ZXN0IGFzIGFueSkuX19wYXRoQXJyYXkgPSBwYXRobmFtZS5sZW5ndGggPiAxID8gcGF0aG5hbWUuc3Vic3RyaW5nKDEpLnNwbGl0KFwiL1wiKSA6IFtdO1xuICAgICAgKHJlcXVlc3QgYXMgYW55KS5fX29yaWdpbiA9IHJlcS5oZWFkZXJzLm9yaWdpbiA/PyBudWxsO1xuICAgICAgKHJlcXVlc3QgYXMgYW55KS5fX2lzQWN0aW9uID0gIWlzU3RyZWFtO1xuXG4gICAgICB3b3JsZC5saXN0ZW5lci5mZXRjaCh7XG4gICAgICAgIHJlcXVlc3QsXG4gICAgICAgIGVudixcbiAgICAgICAgZW52TW9kZTogZW52LlZJVEVfTU9ERSA/PyBcInRlc3RcIixcbiAgICAgICAgcmF3UmVzcG9uc2U6IHRydWUsXG4gICAgICB9KS50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5fX3Jhd1Jlc3BvbnNlKSB7XG4gICAgICAgICAgcmVzLndyaXRlSGVhZChyZXNwb25zZS5zdGF0dXMsIHJlc3BvbnNlLmhlYWRlcnMpO1xuICAgICAgICAgIGNvbnN0IHJlc0JvZHkgPSByZXNwb25zZS5ib2R5O1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzQm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHJlcy5lbmQoQnVmZmVyLmZyb20ocmVzQm9keSwgJ3V0Zi04JykpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzQm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgQnVmZmVyLmlzQnVmZmVyKHJlc0JvZHkpKSB7XG4gICAgICAgICAgICByZXMuZW5kKHJlc0JvZHkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzQm9keSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICByZXMuZW5kKEJ1ZmZlci5mcm9tKHJlc0JvZHkpKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHJlc0JvZHkgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICByZXNCb2R5LmFycmF5QnVmZmVyKCkudGhlbigoYWI6IEFycmF5QnVmZmVyKSA9PiB7XG4gICAgICAgICAgICAgIHJlcy5lbmQoQnVmZmVyLmZyb20oYWIpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH0gZWxzZSBpZiAocmVzQm9keSAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXMuZW5kKHJlc0JvZHkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXMuZW5kKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCByZXNIZWFkZXJzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmcgfCBzdHJpbmdbXT4gPSB7fTtcbiAgICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgcmVzcG9uc2UuaGVhZGVycykge1xuICAgICAgICAgIGlmIChrZXkgaW4gcmVzSGVhZGVycykge1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmcgPSByZXNIZWFkZXJzW2tleV07XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShleGlzdGluZykpIGV4aXN0aW5nLnB1c2godmFsdWUpO1xuICAgICAgICAgICAgZWxzZSByZXNIZWFkZXJzW2tleV0gPSBbZXhpc3RpbmcsIHZhbHVlXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzSGVhZGVyc1trZXldID0gdmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlcy53cml0ZUhlYWQocmVzcG9uc2Uuc3RhdHVzLCByZXNIZWFkZXJzKTtcbiAgICAgICAgaWYgKHJlc3BvbnNlLmJvZHkgIT0gbnVsbCAmJiByZXEubWV0aG9kICE9PSBcIkhFQURcIikge1xuICAgICAgICAgIGNvbnN0IHJlYWRlciA9IHJlc3BvbnNlLmJvZHkuZ2V0UmVhZGVyKCk7XG4gICAgICAgICAgY29uc3QgcHVtcCA9ICgpOiBQcm9taXNlPHZvaWQ+ID0+XG4gICAgICAgICAgICByZWFkZXIucmVhZCgpLnRoZW4oKHsgZG9uZSwgdmFsdWUgfSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZG9uZSkgeyByZXMuZW5kKCk7IHJldHVybjsgfVxuICAgICAgICAgICAgICByZXMud3JpdGUodmFsdWUpO1xuICAgICAgICAgICAgICByZXR1cm4gcHVtcCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgcHVtcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcy5lbmQoKTtcbiAgICAgICAgfVxuICAgICAgfSkuY2F0Y2goKGVycm9yOiBhbnkpID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGlmICghcmVzLmhlYWRlcnNTZW50KSByZXMud3JpdGVIZWFkKDUwMCk7XG4gICAgICAgIHJlcy5lbmQoXCJJbnRlcm5hbCBTZXJ2ZXIgRXJyb3JcIik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgc2VydmVyLmxpc3Rlbih3b3JsZC5saXN0ZW5lci5wb3J0KTtcbn1cblxudm9pZCBib290c3RyYXAoKTsiXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzQsNyw4LDE2LDE3LDE4LDE5LDIwLDIxLDIyLDIzLDI0LDI1LDI2LDMxXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUFBLElBQWEsY0FBYzs7O0FDd0QzQixlQUFlLHVCQUF3RDtDQUNyRSxRQUFRLElBQUksbUVBQW1FO0NBRS9FLE1BQU0sZUFBZSxLQUFLLFNBQVMsSUFBSSxRQUFRLFVBQVUsR0FBRyxTQUFTO0NBQ3JFLE1BQU0sYUFBYSxLQUFLLFFBQVEsY0FBYyxPQUFPLEtBQUssR0FBRyxDQUFDLENBQUM7Q0FDL0QsTUFBTSxtQkFBbUIsS0FBSyxZQUFZLGVBQWU7Q0FDekQsTUFBTSxrQkFBa0IsS0FBSyxZQUFZLFNBQVM7Q0FDbEQsTUFBTSxXQUFXLEtBQUssY0FBYyxhQUFhO0NBQ2pELFFBQVEsSUFBSSw0Q0FBNEMsUUFBUTtDQUVoRSxJQUFJO0VBQ0YsTUFBTSxNQUFNLEtBQUssVUFBVSxJQUFJLEdBQUcsRUFBRSxXQUFXLEtBQUssQ0FBQztDQUN2RCxRQUFRLENBQUM7Q0FHVCxJQUFJLGlCQUFpQjtDQUNyQixJQUFJLGdCQUFnQztFQUNsQyxvQkFBb0I7RUFDcEIscUJBQXFCO0VBQ3JCLDBCQUEwQjtFQUMxQixpQkFBaUI7RUFDakIsaUJBQWlCO0VBQ2pCLGtCQUFrQjtFQUNsQjtFQUNBO0VBQ0E7RUFDQTtDQUNGO0NBRUEsSUFBSTtFQUNGLE1BQU0sVUFBVSxNQUFNLFNBQVMsVUFBVSxPQUFPO0VBQ2hELGdCQUFnQixLQUFLLE1BQU0sT0FBTztFQUNsQyxpQkFBaUI7RUFDakIsUUFBUSxJQUFJLGlE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