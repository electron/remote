interface NodeRequireFunction {
  (moduleName: 'electron'): typeof Electron;
}

interface NodeRequire extends NodeRequireFunction {
  resolve: RequireResolve;
  cache: NodeRequireCache;
  /**
   * @deprecated
   */
  extensions: NodeExtensions;
  main: NodeModule | undefined;
}

export declare var require: NodeRequire;

// Taken from `RemoteMainInterface`
export {app, autoUpdater, BrowserView, BrowserWindow, ClientRequest, clipboard, CommandLine, contentTracing, Cookies, crashReporter, Debugger, desktopCapturer, dialog, Dock, DownloadItem, globalShortcut, inAppPurchase, IncomingMessage, ipcMain, Menu, MenuItem, MessageChannelMain, MessagePortMain, nativeImage, nativeTheme, net, netLog, Notification, powerMonitor, powerSaveBlocker, protocol, screen, ServiceWorkers, session, shell, systemPreferences, TouchBar, TouchBarButton, TouchBarColorPicker, TouchBarGroup, TouchBarLabel, TouchBarOtherItemsProxy, TouchBarPopover, TouchBarScrubber, TouchBarSegmentedControl, TouchBarSlider, TouchBarSpacer, Tray, webContents, WebRequest} from 'electron';
export * from './dist/src/main'
export * from './dist/src/renderer';
