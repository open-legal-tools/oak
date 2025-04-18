import { app, BrowserWindow } from 'electron';
import * as path from 'path';

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self';",
          "style-src 'self' 'unsafe-inline';",
          "img-src 'self' blob: data:;",
          "font-src 'self';",
          "connect-src 'self';",
          "worker-src 'self' blob:;"
        ].join(' ')
      }
    });
  });

  // ... rest of your existing main process code ...
}); 