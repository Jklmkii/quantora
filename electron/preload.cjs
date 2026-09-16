const { contextBridge, ipcRenderer } = require('electron');

// Secure context bridge: nodeIntegration is false, contextIsolation is true
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  saveFile: (defaultName, content, filters) =>
    ipcRenderer.invoke('dialog:saveFile', { defaultName, content, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('dialog:openFile', { filters }),

  checkForUpdates: () =>
    ipcRenderer.invoke('updater:check'),

  installUpdate: () =>
    ipcRenderer.invoke('updater:install'),

  onUpdateStatus: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('updater:status', subscription);
    return () => ipcRenderer.removeListener('updater:status', subscription);
  },

  closeTrayWidget: () => {
    ipcRenderer.send('tray:close');
  },

  openMainWindow: () => {
    ipcRenderer.send('tray:open-main');
  },

  onTrayNewQuestion: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('tray:new-question', subscription);
    return () => ipcRenderer.removeListener('tray:new-question', subscription);
  },
});

