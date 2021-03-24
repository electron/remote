export const getElectronBinding: typeof process.electronBinding = (name: string) => {
  if ((process as any)._linkedBinding) {
    return (process as any)._linkedBinding('electron_common_' + name)
  } else if (process.electronBinding) {
    return process.electronBinding(name as any)
  } else {
    return null
  }
}
