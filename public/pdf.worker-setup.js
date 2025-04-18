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
  const workerPaths = [
    '/assets/pdf.worker.min.js',           // Primary location
    './assets/pdf.worker.min.js',          // Relative paths
    '/assets/pdf.worker.min.js',           // Absolute path from server root
    'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js' // CDN path
  ];

  // Create a global object to store PDF.js configuration
  window.PDFJSConfig = {
    workerFound: false,
    workerPath: null
  };

  // Immediately check for worker availability
  (async function checkWorker() {
    console.log('PDF Worker Setup: Checking for PDF.js worker file...');
    
    for (const path of workerPaths) {
      const exists = await checkFileExists(path);
      if (exists) {
        console.log(`PDF Worker Setup: Found worker at "${path}"`);
        window.PDFJSConfig.workerFound = true;
        window.PDFJSConfig.workerPath = path;
        break;
      }
    }
    
    if (!window.PDFJSConfig.workerFound) {
      console.warn('PDF Worker Setup: Worker file not found at any expected location. Paths checked:', workerPaths);
    }
  })();
})(); 