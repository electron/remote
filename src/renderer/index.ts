if (process.type === 'browser')
  throw new Error(`"@electron/remote" cannot be required in the browser process. Instead require("@electron/remote/main").`)
export * from './remote'
