const { contextBridge } = require('electron');

// Expose secure API to renderer process
contextBridge.exposeInMainWorld('electron', {
  app: {
    getName: () => 'Guard Firearm Management System',
    getVersion: () => '1.0.0',
  },
});
