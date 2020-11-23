import { getElectronBinding } from './get-electron-binding'

export const commonModules = [
  { name: 'clipboard' },
  { name: 'nativeImage' },
  { name: 'shell' },
];

export const browserModules = [
  { name: 'app' },
  { name: 'autoUpdater' },
  { name: 'BrowserView' },
  { name: 'BrowserWindow' },
  { name: 'contentTracing' },
  { name: 'crashReporter' },
  { name: 'desktopCapturer' },
  { name: 'dialog' },
  { name: 'globalShortcut' },
  { name: 'ipcMain' },
  { name: 'inAppPurchase' },
  { name: 'Menu' },
  { name: 'MenuItem' },
  { name: 'nativeTheme' },
  { name: 'net' },
  { name: 'netLog' },
  { name: 'MessageChannelMain' },
  { name: 'Notification' },
  { name: 'powerMonitor' },
  { name: 'powerSaveBlocker' },
  { name: 'protocol' },
  { name: 'screen' },
  { name: 'session' },
  { name: 'systemPreferences' },
  { name: 'TopLevelWindow' },
  { name: 'TouchBar' },
  { name: 'Tray' },
  { name: 'View' },
  { name: 'webContents' },
  { name: 'WebContentsView' }
].concat(commonModules);

const features = getElectronBinding('features');

if (features.isViewApiEnabled()) {
  browserModules.push(
    { name: 'ImageView' }
  );
}
