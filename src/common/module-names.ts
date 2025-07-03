import { getElectronBinding } from './get-electron-binding'

export const commonModuleNames = [
  'clipboard',
  'nativeImage',
  'shell',
];

const mainModules = Object.keys(require('electron'))

export const browserModuleNames = [
  'app',
  'autoUpdater',
  'BaseWindow',
  'BrowserView',
  'BrowserWindow',
  'contentTracing',
  'crashReporter',
  'dialog',
  'globalShortcut',
  'ipcMain',
  'inAppPurchase',
  'Menu',
  'MenuItem',
  'nativeTheme',
  'net',
  'netLog',
  'MessageChannelMain',
  'Notification',
  'powerMonitor',
  'powerSaveBlocker',
  'protocol',
  'pushNotifications',
  'safeStorage',
  'screen',
  'session',
  'ShareMenu',
  'systemPreferences',
  'TopLevelWindow',
  'TouchBar',
  'Tray',
  'utilityProcess',
  'View',
  'webContents',
  'WebContentsView',
  'webFrameMain',
].concat(commonModuleNames);

const features = getElectronBinding('features');

if (features?.isDesktopCapturerEnabled?.() !== false) {
  browserModuleNames.push('desktopCapturer');
}

if (features?.isViewApiEnabled?.() !== false) {
  browserModuleNames.push('ImageView');
}

try {
  getElectronBinding('electron_browser_service_worker_main');
  browserModuleNames.push('ServiceWorkerMain');
} catch {}
