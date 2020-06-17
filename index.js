throw new Error(`@electron/remote cannot be required directly. Instead require("@electron/remote/${process.type === 'browser' ? 'main' : 'renderer'}").`)
