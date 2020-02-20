const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('dirty-chai'))
const { app } = require('electron')

app.on('window-all-closed', () => null)

app.whenReady().then(() => {
  require('mocha/bin/mocha')
})
