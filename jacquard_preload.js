const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ndarray', {
    createArray: (row, col, id) => ipcRenderer.send('create-array', {row, col, id}),
    onDrawdownUpdate: (callback) => ipcRenderer.on('drawdown-update', (_event, value) => callback(value))
})

contextBridge.exposeInMainWorld('jquery', {
    readFile: (filePath) => ipcRenderer.send('read-file', {filePath})
})