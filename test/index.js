// ts-node 8 cannot drive TypeScript 7 (which no longer exposes the JS
// compiler API), so the specs are compiled with the TypeScript 6 alias.
if (!process.env.TS_NODE_COMPILER) {
  process.env.TS_NODE_COMPILER = 'typescript6'
}

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('dirty-chai'))
const { app } = require('electron')

app.on('window-all-closed', () => null)

app.whenReady().then(() => {
  require('mocha/bin/mocha')
})
