import { getElectronBinding } from './get-electron-binding'

export const commonModuleNames = [
  'clipboard',
  'nativeImage',
  'shell',
];

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
  'screen',
  'session',
  'ShareMenu',
  'systemPreferences',
  'TopLevelWindow',
  'TouchBar',
  'Tray',
  'View',
  'webContents',
  'WebContentsView',
  'webFrameMain',
].concat(commonModuleNames);

const features = getElectronBinding('features');

if (!features || features.isDesktopCapturerEnabled()) {
  browserModuleNames.push('desktopCapturer');
}

if (!features || features.isViewApiEnabled()) {
  browserModuleNames.push('ImageView');
}
