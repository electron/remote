import { CallbacksRegistry } from './callbacks-registry'
import { isPromise, isSerializableObject, serialize, deserialize } from '../common/type-utils'
import { MetaTypeFromRenderer, ObjectMember, ObjProtoDescriptor, MetaType } from '../common/types'
import { BrowserWindow, WebContents, ipcRenderer } from 'electron'
import { browserModuleNames } from '../common/module-names'
import { getElectronBinding } from '../common/get-electron-binding'
import { IPC_MESSAGES } from '../common/ipc-messages';

const { Promise } = global

const callbacksRegistry = new CallbacksRegistry()
const remoteObjectCache = new Map()
const finalizationRegistry = new FinalizationRegistry((id: number) => {
  const ref = remoteObjectCache.get(id)
  if (ref !== undefined && ref.deref() === undefined) {
    remoteObjectCache.delete(id)
    ipcRenderer.send(IPC_MESSAGES.BROWSER_DEREFERENCE, contextId, id, 0)
  }
})

const electronIds = new WeakMap<Object, number>();
const isReturnValue = new WeakSet<Object>();

function getCachedRemoteObject (id: number) {
  const ref = remoteObjectCache.get(id)
  if (ref !== undefined) {
    const deref = ref.deref()
    if (deref !== undefined) return deref
  }
}
function setCachedRemoteObject (id: number, value: any) {
  const wr = new WeakRef(value)
  remoteObjectCache.set(id, wr)
  finalizationRegistry.register(value, id)
  return value
}

function getContextId() {
  const v8Util = getElectronBinding('v8_util')
  if (v8Util) {
    return v8Util.getHiddenValue<string>(global, 'contextId')
  } else {
    throw new Error('Electron >=v13.0.0-beta.6 required to support sandboxed renderers')
  }
}

// An unique ID that can represent current context.
const contextId = process.contextId || getContextId()

// Notify the main process when current context is going to be released.
// Note that when the renderer process is destroyed, the message may not be
// sent, we also listen to the "render-view-deleted" event in the main process
// to guard that situation.
process.on('exit', () => {
  const command = IPC_MESSAGES.BROWSER_CONTEXT_RELEASE
  ipcRenderer.send(command, contextId)
})

const IS_REMOTE_PROXY = Symbol('is-remote-proxy')

// Convert the arguments object into an array of meta data.
function wrapArgs (args: any[], visited = new Set()): MetaTypeFromRenderer[] {
  const valueToMeta = (value: any): MetaTypeFromRenderer => {
    // Check for circular reference.
    if (visited.has(value)) {
      return {
        type: 'value',
        value: null
      }
    }

    if (value && value.constructor && value.constructor.name === 'NativeImage') {
      return { type: 'nativeimage', value: serialize(value) }
    } else if (Array.isArray(value)) {
      visited.add(value)
      const meta: MetaTypeFromRenderer = {
        type: 'array',
        value: wrapArgs(value, visited)
      }
      visited.delete(value)
      return meta
    } else if (value instanceof Buffer) {
      return {
        type: 'buffer',
        value
      }
    } else if (isSerializableObject(value)) {
      return {
        type: 'value',
        value
      }
    } else if (typeof value === 'object') {
      if (isPromise(value)) {
        return {
          type: 'promise',
          then: valueToMeta(function (onFulfilled: Function, onRejected: Function) {
            value.then(onFulfilled, onRejected)
          })
        }
      } else if (electronIds.has(value)) {
        return {
          type: 'remote-object',
          id: electronIds.get(value)!
        }
      }

      const meta: MetaTypeFromRenderer = {
        type: 'object',
        name: value.constructor ? value.constructor.name : '',
        members: []
      }
      visited.add(value)
      for (const prop in value) { // eslint-disable-line guard-for-in
        meta.members.push({
          name: prop,
          value: valueToMeta(value[prop])
        })
      }
      visited.delete(value)
      return meta
    } else if (typeof value === 'function' && isReturnValue.has(value)) {
      return {
        type: 'function-with-return-value',
        value: valueToMeta(value())
      }
    } else if (typeof value === 'function') {
      return {
        type: 'function',
        id: callbacksRegistry.add(value),
        location: callbacksRegistry.getLocation(value)!,
        length: value.length
      }
    } else {
      return {
        type: 'value',
        value
      }
    }
  }
  return args.map(valueToMeta)
}

// Populate object's members from descriptors.
// The |ref| will be kept referenced by |members|.
// This matches |getObjectMemebers| in rpc-server.
function setObjectMembers (ref: any, object: any, metaId: number, members: ObjectMember[]) {
  if (!Array.isArray(members)) return

  for (const member of members) {
    if (Object.prototype.hasOwnProperty.call(object, member.name)) continue

    const descriptor: PropertyDescriptor = { enumerable: member.enumerable }
    if (member.type === 'method') {
      const remoteMemberFunction = function (this: any, ...args: any[]) {
        let command
        if (this && this.constructor === remoteMemberFunction) {
          command = IPC_MESSAGES.BROWSER_MEMBER_CONSTRUCTOR
        } else {
          command = IPC_MESSAGES.BROWSER_MEMBER_CALL
        }
        const ret = ipcRenderer.sendSync(command, contextId, metaId, member.name, wrapArgs(args))
        return metaToValue(ret)
      }

      let descriptorFunction = proxyFunctionProperties(remoteMemberFunction, metaId, member.name)

      descriptor.get = () => {
        descriptorFunction.ref = ref // The member should reference its object.
        return descriptorFunction
      }
      // Enable monkey-patch the method
      descriptor.set = (value) => {
        descriptorFunction = value
        return value
      }
      descriptor.configurable = true
    } else if (member.type === 'get') {
      descriptor.get = () => {
        const command = IPC_MESSAGES.BROWSER_MEMBER_GET
        const meta = ipcRenderer.sendSync(command, contextId, metaId, member.name)
        return metaToValue(meta)
      }

      if (member.writable) {
        descriptor.set = (value) => {
          const args = wrapArgs([value])
          const command = IPC_MESSAGES.BROWSER_MEMBER_SET
          const meta = ipcRenderer.sendSync(command, contextId, metaId, member.name, args)
          if (meta != null) metaToValue(meta)
          return value
        }
      }
    }

    Object.defineProperty(object, member.name, descriptor)
  }
}

// Populate object's prototype from descriptor.
// This matches |getObjectPrototype| in rpc-server.
function setObjectPrototype (ref: any, object: any, metaId: number, descriptor: ObjProtoDescriptor) {
  if (descriptor === null) return
  const proto = {}
  setObjectMembers(ref, proto, metaId, descriptor.members)
  setObjectPrototype(ref, proto, metaId, descriptor.proto)
  Object.setPrototypeOf(object, proto)
}

// Wrap function in Proxy for accessing remote properties
function proxyFunctionProperties (remoteMemberFunction: Function, metaId: number, name: string) {
  let loaded = false

  // Lazily load function properties
  const loadRemoteProperties = () => {
    if (loaded) return
    loaded = true
    const command = IPC_MESSAGES.BROWSER_MEMBER_GET
    const meta = ipcRenderer.sendSync(command, contextId, metaId, name)
    setObjectMembers(remoteMemberFunction, remoteMemberFunction, meta.id, meta.members)
  }

  return new Proxy(remoteMemberFunction as any, {
    set: (target, property, value) => {
      if (property !== 'ref') loadRemoteProperties()
      target[property] = value
      return true
    },
    get: (target, property) => {
      if (property === IS_REMOTE_PROXY) return true
      if (!Object.prototype.hasOwnProperty.call(target, property)) loadRemoteProperties()
      const value = target[property]
      if (property === 'toString' && typeof value === 'function') {
        return value.bind(target)
      }
      return value
    },
    ownKeys: (target) => {
      loadRemoteProperties()
      return Object.getOwnPropertyNames(target)
    },
    getOwnPropertyDescriptor: (target, property) => {
      const descriptor = Object.getOwnPropertyDescriptor(target, property)
      if (descriptor) return descriptor
      loadRemoteProperties()
      return Object.getOwnPropertyDescriptor(target, property)
    }
  })
}

// Convert meta data from browser into real value.
function metaToValue (meta: MetaType): any {
  if (!meta) return {}
  if (meta.type === 'value') {
    return meta.value
  } else if (meta.type === 'array') {
    return meta.members.map((member) => metaToValue(member))
  } else if (meta.type === 'nativeimage') {
    return deserialize(meta.value)
  } else if (meta.type === 'buffer') {
    return Buffer.from(meta.value.buffer, meta.value.byteOffset, meta.value.byteLength)
  } else if (meta.type === 'promise') {
    return Promise.resolve({ then: metaToValue(meta.then) })
  } else if (meta.type === 'error') {
    return metaToError(meta)
  } else if (meta.type === 'exception') {
    if (meta.value.type === 'error') { throw metaToError(meta.value); } else { throw new Error(`Unexpected value type in exception: ${meta.value.type}`); }
  } else {
    let ret
    if ('id' in meta) {
      const cached = getCachedRemoteObject(meta.id)
      if (cached !== undefined) { return cached; }
    }

    // A shadow class to represent the remote function object.
    if (meta.type === 'function') {
      const remoteFunction = function (this: any, ...args: any[]) {
        let command
        if (this && this.constructor === remoteFunction) {
          command = IPC_MESSAGES.BROWSER_CONSTRUCTOR
        } else {
          command = IPC_MESSAGES.BROWSER_FUNCTION_CALL
        }
        const obj = ipcRenderer.sendSync(command, contextId, meta.id, wrapArgs(args))
        return metaToValue(obj)
      }
      ret = remoteFunction
    } else {
      ret = {}
    }

    setObjectMembers(ret, ret, meta.id, meta.members)
    setObjectPrototype(ret, ret, meta.id, meta.proto)
    if (ret.constructor && (ret.constructor as any)[IS_REMOTE_PROXY]) {
      Object.defineProperty(ret.constructor, 'name', { value: meta.name })
    }

    // Track delegate obj's lifetime & tell browser to clean up when object is GCed.
    electronIds.set(ret, meta.id);
    setCachedRemoteObject(meta.id, ret)
    return ret
  }
}

function metaToError (meta: { type: 'error', value: any, members: ObjectMember[] }) {
  const obj = meta.value
  for (const { name, value } of meta.members) {
    obj[name] = metaToValue(value)
  }
  return obj
}

function handleMessage (channel: string, handler: Function) {
  ipcRenderer.on(channel, (event, passedContextId, id, ...args) => {
    if (event.senderId !== 0) {
      console.error(`Message ${channel} sent by unexpected WebContents (${event.senderId})`);
      return;
    }

    if (passedContextId === contextId) {
      handler(id, ...args)
    } else {
      // Message sent to an un-exist context, notify the error to main process.
      ipcRenderer.send(IPC_MESSAGES.BROWSER_WRONG_CONTEXT_ERROR, contextId, passedContextId, id)
    }
  })
}

const enableStacks = process.argv.includes('--enable-api-filtering-logging')

function getCurrentStack (): string | undefined {
  const target = { stack: undefined as string | undefined }
  if (enableStacks) {
    Error.captureStackTrace(target, getCurrentStack)
  }
  return target.stack
}

// Browser calls a callback in renderer.
handleMessage(IPC_MESSAGES.RENDERER_CALLBACK, (id: number, args: any) => {
  callbacksRegistry.apply(id, metaToValue(args))
})

// A callback in browser is released.
handleMessage(IPC_MESSAGES.RENDERER_RELEASE_CALLBACK, (id: number) => {
  callbacksRegistry.remove(id)
})

exports.require = (module: string) => {
  const command = IPC_MESSAGES.BROWSER_REQUIRE
  const meta = ipcRenderer.sendSync(command, contextId, module, getCurrentStack())
  return metaToValue(meta)
}

// Alias to remote.require('electron').xxx.
export function getBuiltin (module: string) {
  const command = IPC_MESSAGES.BROWSER_GET_BUILTIN
  const meta = ipcRenderer.sendSync(command, contextId, module, getCurrentStack())
  return metaToValue(meta)
}

export function getCurrentWindow (): BrowserWindow {
  const command = IPC_MESSAGES.BROWSER_GET_CURRENT_WINDOW
  const meta = ipcRenderer.sendSync(command, contextId, getCurrentStack())
  return metaToValue(meta)
}

// Get current WebContents object.
export function getCurrentWebContents (): WebContents {
  const command = IPC_MESSAGES.BROWSER_GET_CURRENT_WEB_CONTENTS
  const meta = ipcRenderer.sendSync(command, contextId, getCurrentStack())
  return metaToValue(meta)
}

// Get a global object in browser.
export function getGlobal<T = any> (name: string): T {
  const command = IPC_MESSAGES.BROWSER_GET_GLOBAL
  const meta = ipcRenderer.sendSync(command, contextId, name, getCurrentStack())
  return metaToValue(meta)
}

// Get the process object in browser.
Object.defineProperty(exports, 'process', {
  enumerable: true,
  get: () => exports.getGlobal('process')
})

// Create a function that will return the specified value when called in browser.
export function createFunctionWithReturnValue<T> (returnValue: T): () => T {
  const func = () => returnValue
  isReturnValue.add(func);
  return func
}

const addBuiltinProperty = (name: string) => {
  Object.defineProperty(exports, name, {
    enumerable: true,
    get: () => exports.getBuiltin(name)
  })
}

browserModuleNames
  .forEach(addBuiltinProperty)
