export const getElectronBinding: typeof process.electronBinding = process.electronBinding
  ? (name: string) => process.electronBinding(name as any)
  : (name: string) => (process as any)._linkedBinding('electron_common_' + name)
