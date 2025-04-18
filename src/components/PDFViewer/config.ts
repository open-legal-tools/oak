// Add type declarations for window properties
declare global {
  interface Window {
    electron?: unknown;
    __DEVELOPMENT__?: boolean;
  }
}

export const PDF_CONFIG = {
  // Worker configuration
  worker: {
    // Use a function to determine the worker path based on the environment
    getWorkerPath: () => {
      // Check if we're running in Electron
      const isElectron = window.electron !== undefined;
      
      // Get NODE_ENV safely
      const isDevelopment = typeof window !== 'undefined' && 
        window.__DEVELOPMENT__ === true;
      
      if (isElectron) {
        // In development with Electron
        if (isDevelopment) {
          return '/assets/pdf.worker.min.js';
        }
        // In production with Electron
        return './assets/pdf.worker.min.js';
      }
      
      // Web environment - use a relative path as fallback
      return './pdf.worker.min.js';
    },
  },
  
  // Quality settings
  quality: {
    defaultScale: 1,
    maxScale: 5,
    minScale: 0.25,
    scaleStep: 1.25,
    defaultQuality: 1.0,
    zoomingQuality: 0.75,
    qualityThreshold: 0.1,
  },
  
  // Performance settings
  performance: {
    renderDebounce: 150,
    maxWorkers: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
    preloadPages: 3
  },
  
  // Cache settings
  cache: {
    maxPages: 100,
    defaultMemory: 1024 * 1024 * 1024, // 1GB
    pageCount: 10,
    chunkSize: 20,
  },
  
  // Rendering settings
  rendering: {
    enableWebGL: true,
    useWorker: true,
    cMapUrl: './cmaps/',
    cMapPacked: true,
  }
} as const;

export type PDFConfig = typeof PDF_CONFIG; 