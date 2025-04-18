import React, { useState, useEffect } from 'react';
import PDFViewer from './components/PDFViewer/index.new.jsx';
import { initPdfJs } from './utils/pdfjs-init';
import usePdfUrl from './utils/use-pdf-url';
import './App.css';

// Access the function exposed in preload.js
const openFileDialog = window.electron?.openFileDialog;

// Debug: Log electron API availability
console.log('App: electron API available:', !!window.electron);
console.log('App: openFileDialog available:', !!openFileDialog);
if (window.electron) {
  console.log('App: Available electron methods:', Object.keys(window.electron));
}

function App() {
  const [rawPdfPath, setRawPdfPath] = useState('');
  const [error, setError] = useState('');
  const [workerInitialized, setWorkerInitialized] = useState(false);
  
  // Process the PDF URL
  const { url: pdfPath, isProcessing, error: urlError } = usePdfUrl(rawPdfPath);
  
  // Handle URL processing errors
  useEffect(() => {
    if (urlError) {
      setError(`Error processing PDF URL: ${urlError}`);
    }
  }, [urlError]);
  
  // Initialize PDF.js worker on component mount
  useEffect(() => {
    const initialized = initPdfJs();
    setWorkerInitialized(initialized);
    
    if (!initialized) {
      setError('Failed to initialize PDF.js worker');
    }
  }, []);

  // Function to handle opening a PDF file
  const handleOpenFile = async () => {
    // Check if the IPC function is available
    if (!openFileDialog) {
      setError("Error: File dialog API (IPC) not available. Check preload script.");
      console.error("window.electron.openFileDialog is not defined.");
      return;
    }
    
    try {
      // Clear previous state
      setError('');
      
      // Call the exposed IPC function to open file dialog
      const filePath = await openFileDialog();
      
      if (!filePath) {
        // User cancelled selection
        console.log('File selection cancelled');
        return;
      }
      
      console.log(`Selected file: ${filePath}`);
      
      // For local files in Electron, set the raw path and let the hook handle it
      setRawPdfPath(filePath);
    } catch (err) {
      console.error('Error opening file:', err);
      setError(`Error opening file: ${err.message || 'Unknown error'}`);
    }
  };

  // Load the sample PDF for quick testing
  const loadSamplePdf = () => {
    setError('');
    
    // Set the path to the sample PDF and let the hook handle it
    const samplePath = './test-assets/sample.pdf';
    console.log('Loading sample PDF from:', samplePath);
    setRawPdfPath(samplePath);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PDF Viewer</h1>
        <div className="header-buttons">
          <button 
            onClick={handleOpenFile} 
            disabled={!openFileDialog || !workerInitialized || isProcessing}
            className="open-button"
          >
            {isProcessing ? 'Processing...' : 'Open PDF'}
          </button>
          <button
            onClick={loadSamplePdf}
            disabled={!workerInitialized || isProcessing}
            className="open-button sample-button"
          >
            {isProcessing ? 'Processing...' : 'Load Sample'}
          </button>
        </div>
      </header>
      
      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}
      
      <main className="viewer-container">
        {pdfPath ? (
          <PDFViewer 
            pdfPath={pdfPath} 
            onError={(err) => setError(`PDF error: ${err.message}`)}
            onDocumentLoad={(pages) => console.log(`PDF loaded with ${pages} pages`)}
          />
        ) : (
          <div className="empty-state">
            <p>No PDF loaded. Click "Open PDF" to select a file or "Load Sample" to test with a sample PDF.</p>
            {isProcessing && <p className="processing-state">Processing PDF URL...</p>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;