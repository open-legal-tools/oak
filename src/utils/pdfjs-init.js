import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
const initPdfJs = () => {
  try {
    console.log('Initializing PDF.js worker...');
    
    // Set the worker path directly - we know it exists in /assets/
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
    console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
    
    // Configure additional options if needed
    pdfjsLib.GlobalWorkerOptions.workerPort = null; // Ensure we're using the default worker
    console.log('PDF.js additional options configured');
    
    return true;
  } catch (error) {
    console.error("Error setting PDF.js worker source:", error);
    return false;
  }
};

// Configure PDF.js additional options
const configurePdfJs = () => {
  try {
    // Enable stream compression for better performance
    pdfjsLib.GlobalWorkerOptions.disableWebAssembly = false;
    
    // Increase maximum canvas size (if needed for very large PDFs)
    pdfjsLib.PixelsPerInch.MAX_AUTO_SCALE = 1.0;
    
    console.log('PDF.js additional options configured');
    return true;
  } catch (error) {
    console.error("Error configuring PDF.js options:", error);
    return false;
  }
};

// Export wrapped PDF.js functionality with our init
const init = () => {
  const workerInitialized = initPdfJs();
  const optionsConfigured = configurePdfJs();
  return workerInitialized && optionsConfigured;
};

export { init as initPdfJs, pdfjsLib }; 