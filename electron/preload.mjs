// filepath: /Users/danielle/Documents/GitHub/gavel/electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';

try {
    // Expose a controlled way to invoke main process handlers
    contextBridge.exposeInMainWorld('electron', {
        // Define a function that the renderer can call to open file dialog
        openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
        
        // Add a function to read PDF file data via IPC
        readPdfFile: (filePath) => ipcRenderer.invoke('file:readPdf', filePath)
    });
    console.log('--- Preload: contextBridge executed successfully ---');
} catch (error) {
    console.error('--- Preload: Error during contextBridge setup ---', error);
}

console.log('--- Preload Script Finished Execution (IPC Version) ---');