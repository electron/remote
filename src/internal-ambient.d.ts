declare namespace Electron {
  interface WebContents {
    getLastWebPreferences(): WebPreferences;
    getOwnerBrowserWindow(): BrowserWindow;
  }
}

declare namespace NodeJS {
  interface V8UtilBinding {
    getHiddenValue<T>(obj: Object, key: string): T;
  }

  interface EventBinding {
    createWithSender(contents: Electron.WebContents): Electron.Event & { returnValue: any }
  }

  interface FeaturesBinding {
    isDesktopCapturerEnabled(): boolean;
    isViewApiEnabled(): boolean;
  }

  interface Process {
    electronBinding(name: 'event'): EventBinding;
    electronBinding(name: 'v8_util'): V8UtilBinding;
    electronBinding(name: 'features'): FeaturesBinding;
    readonly contextId?: string;
  }
}
