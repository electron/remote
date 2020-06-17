declare namespace NodeJS {
  interface V8UtilBinding {
    getHiddenValue<T>(obj: any, key: string): T;
    setHiddenValue<T>(obj: any, key: string, value: T): void;
    deleteHiddenValue(obj: any, key: string): void;
  }

  interface EventBinding {
    createWithSender(contents: Electron.WebContents): Electron.Event & { returnValue: any }
  }

  interface FeaturesBinding {
    isViewApiEnabled(): boolean;
  }

  interface NativeImageBinding {
    nativeImage: any;
    NativeImage: any;
  }

  interface Process {
    electronBinding(name: 'event'): EventBinding;
    electronBinding(name: 'v8_util'): V8UtilBinding;
    electronBinding(name: 'native_image'): NativeImageBinding;
    electronBinding(name: 'features'): FeaturesBinding;
    electronBinding(name: 'command_line'): Electron.CommandLine;
  }
}
