// filepath: /Users/danielle/Documents/GitHub/gavel/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Ensure the PDF worker file is in both locations
const workerSrc = path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.js');
const workerDestLegacy = path.resolve(__dirname, 'public/pdf-worker/pdf.worker.min.js');
const workerDestNew = path.resolve(__dirname, 'public/assets/pdf.worker.min.js');

// Create the directories if they don't exist
[workerDestLegacy, workerDestNew].forEach(dest => {
  if (!fs.existsSync(path.dirname(dest))) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
  }
});

// Copy the worker file to both locations if needed
[workerDestLegacy, workerDestNew].forEach(dest => {
  if (!fs.existsSync(dest) || fs.statSync(workerSrc).mtimeMs > fs.statSync(dest).mtimeMs) {
    fs.copyFileSync(workerSrc, dest);
    console.log(`PDF.js worker file copied to ${path.relative(__dirname, dest)}`);
  }
});

// Log the testStore path for debugging
console.log('Resolving testStore:', path.resolve(__dirname, 'src/hooks/testStore.js'));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  // Ensure correct asset paths in Electron
  base: './',
  // Ensure the server runs on the expected port
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist/legacy/build/pdf', 'zustand'],
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/]
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep PDF worker files in their respective directories
          if (assetInfo.name === 'pdf.worker.min.js') {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
});