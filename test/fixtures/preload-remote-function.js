const { ipcRenderer } = require('electron')
const remote = require('../../renderer')
remote.getCurrentWindow().rendererFunc = () => {
  ipcRenderer.send('done')
}
remote.getCurrentWindow().rendererFunc()
