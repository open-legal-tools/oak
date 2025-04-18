/**
 * PDF.js Worker Setup Script
 * 
 * This script checks if the PDF.js worker is available at the expected path
 * and logs its status. It's meant to be included in the HTML before the main
 * application code loads.
 */

(function() {
  // Function to check if a file exists by creating a test request
  function checkFileExists(url) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url, true);
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          resolve(xhr.status === 200);
        }
      };
      xhr.send();
    });
  }

  // Paths to check for the PDF.js worker
  const possibleWorkerPaths = [
    // Check for newer .mjs format (ES modules)
    './assets/pdf.worker.min.mjs',          // Relative to HTML file (production)
    '/assets/pdf.worker.min.mjs',           // Absolute path from server root
    
    // Check for legacy .js format
    './assets/pdf.worker.min.js',           // Relative to HTML file (production)
    '/assets/pdf.worker.min.js',            // Absolute path from server root
    
    // CDN fallback
    'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs' // CDN path
  ];

  // Create a global object to store PDF.js configuration
  window.PDFJSConfig = {
    workerFound: false,
    workerPath: null
  };

  // Immediately check for worker availability
  (async function checkWorker() {
    console.log('PDF Worker Setup: Checking for PDF.js worker file...');
    
    for (const path of possibleWorkerPaths) {
      try {
        const exists = await checkFileExists(path);
        if (exists) {
          console.log(`PDF Worker Setup: Found worker at "${path}"`);
          window.PDFJSConfig.workerFound = true;
          window.PDFJSConfig.workerPath = path;
          break;
        }
      } catch (e) {
        console.warn(`Error checking ${path}:`, e);
      }
    }
    
    if (!window.PDFJSConfig.workerFound) {
      console.warn('PDF Worker Setup: Worker file not found at any expected location.');
    }
  })();
})(); 