const { contextBridge, ipcRenderer } = require('electron')

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  // App info
  isElectron: true,
  platform: process.platform,

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Event listeners for menu actions
  onNewPage: (callback) => {
    window.addEventListener('scrivenry:new-page', callback)
    return () => window.removeEventListener('scrivenry:new-page', callback)
  },
  onShowShortcuts: (callback) => {
    window.addEventListener('scrivenry:shortcuts', callback)
    return () => window.removeEventListener('scrivenry:shortcuts', callback)
  }
})

// Log when preload script is ready
console.log('Scrivenry preload script loaded')
