# Migrating to `@electron/remote@2.x`

In `@electron/remote@2.x`, the method of enabling the `remote` module for a
WebContents has changed. Previously, the deprecated `enableRemoteModule`
preference was respected. Beginning with `@electron/remote@2.0.0`, there is a
new API for enabling the `remote` module, called `enable()`.

## Usage

After creating a `WebContents`, and before the `remote` module is first used in
that contents, you must call `enable()`:

```js
// Main process
const remoteMain = require("@electron/remote/main")

const win = new BrowserWindow(/* ... */)
remoteMain.enable(win.webContents)
win.loadURL(/* ... */)
```

## Migration

To migrate from `@electron/remote@1.x` to `@electron/remote@2.x`, replace all
usages of the `enableRemoteModule: true` WebPreference by a call to `enable()`.

```js
// Before (@electron/remote@1.x)
const win = new BrowserWindow({
  webPreferences: {
    enableRemoteModule: true
  }
})

// After (@electron/remote@2.x)
const remoteMain = require("@electron/remote/main")
const win = new BrowserWindow()
remoteMain.enable(win.webContents)
```
