import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { validatePdfPath } from './setup.mjs';

const isDev = process.env.NODE_ENV === 'development';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  const preloadScriptPath = path.join(__dirname, 'preload.mjs');
  console.log(`>>> Attempting to load preload script from: ${preloadScriptPath}`);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadScriptPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false // Disable sandbox to allow file system access
    }
  });

  // Load the app
  if (isDev) {
    // Try multiple ports since Vite might use different ones
    const tryPorts = [5173, 5174, 5175, 5176, 5177, 5178];
    let portIndex = 0;
    
    const tryLoadURL = () => {
      if (portIndex >= tryPorts.length) {
        console.error("Failed to connect to Vite dev server on any port");
        return;
      }
      
      const port = tryPorts[portIndex];
      const url = `http://localhost:${port}`;
      
      console.log(`Attempting to connect to Vite server at ${url}`);
      
      // Try to load the URL
      mainWindow.loadURL(url).then(() => {
        console.log(`Successfully connected to Vite server at ${url}`);
        mainWindow.webContents.openDevTools();
      }).catch(err => {
        console.warn(`Failed to connect to Vite server at ${url}: ${err.message}`);
        portIndex++;
        // Try the next port
        setTimeout(tryLoadURL, 500);
      });
    };
    
    // Start trying ports after a short delay
    setTimeout(tryLoadURL, 2000);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // --- Set up IPC Handler for Opening Dialog ---
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDFs', extensions: ['pdf'] }]
    });
    if (!canceled && filePaths.length > 0) {
      return filePaths[0]; // Return the selected path
    }
    return null; // Return null if cancelled or no path
  });
  
  // --- Set up IPC Handler for Reading PDF Files ---
  ipcMain.handle('file:readPdf', async (_, filePath) => {
    try {
      console.log(`Received request to read PDF file: ${filePath}`);
      
      // Handle special case for sample PDF
      if (filePath === '/test-assets/sample.pdf' || filePath.endsWith('/test-assets/sample.pdf')) {
        // Adjust the path to look in the public directory during development
        if (isDev) {
          const samplePath = path.join(__dirname, '../public/test-assets/sample.pdf');
          console.log(`Using development path for sample PDF: ${samplePath}`);
          filePath = samplePath;
        } else {
          // For production build
          const samplePath = path.join(__dirname, '../dist/test-assets/sample.pdf');
          console.log(`Using production path for sample PDF: ${samplePath}`);
          filePath = samplePath;
        }
      }
      
      // Validate the file path
      const validation = validatePdfPath(filePath);
      if (!validation.valid) {
        throw new Error(`Invalid PDF file: ${validation.error}`);
      }
      
      // Use the resolved path if available
      const resolvedPath = validation.resolvedPath || filePath;
      
      // Read the file as a binary buffer
      console.log(`Reading file: ${resolvedPath}`);
      const data = await fs.promises.readFile(resolvedPath);
      console.log(`Successfully read ${data.length} bytes`);
      
      // Convert to array buffer for PDF.js to consume
      return Array.from(new Uint8Array(data));
    } catch (error) {
      console.error('Error reading PDF file:', error);
      throw error;
    }
  });
  // --- End File Reader Handler ---

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});