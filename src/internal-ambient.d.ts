declare namespace NodeJS {
  interface V8UtilBinding {
    getHiddenValue<T>(obj: any, key: string): T;
    setHiddenValue<T>(obj: any, key: string, value: T): void;
    deleteHiddenValue(obj: any, key: string): void;
    createDoubleIDWeakMap(): any;
    createIDWeakMap(): any;
    addRemoteObjectRef(contextId: string, id: number): void;
    setRemoteCallbackFreer(fn: Function, contextId: string, id: number, sender: any): void
    setRemoteObjectFreer(object: any, contextId: string, id: number): void
  }

  interface Process {
    electronBinding(name: 'event'): any;
    electronBinding(name: 'v8_util'): V8UtilBinding;
  }
}
