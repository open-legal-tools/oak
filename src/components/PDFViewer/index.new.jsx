import React, { useEffect, useCallback, useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import { PDF_CONFIG } from './config';
import PDFControls from './PDFControls';
import './PDFViewer.css';

// Configure PDF.js worker - this is a fallback if global worker is not set
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  const workerPath = PDF_CONFIG.worker.getWorkerPath();
  console.log('Setting up PDF.js worker at:', workerPath);
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
}

// Debug helper
if (process.env.NODE_ENV !== 'production') {
  try {
    pdfjs.verbosity = 1; // INFOS
    console.log('PDF.js debugging enabled');
  } catch (e) {
    console.warn('Could not enable PDF.js debugging:', e);
  }
}

/**
 * PDF Viewer component
 */
const PDFViewer = ({
  url,
  pdfPath,
  className = '',
  onDocumentLoad,
  onError
}) => {
  // Use either url or pdfPath (for backward compatibility)
  const pdfUrl = url || pdfPath;
  
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scale, setScale] = useState(1.0);
  
  const pdfContainerRef = useRef(null);
  
  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) return;
    
    let isActive = true;
    console.log(`Loading PDF from: ${pdfUrl}`);
    
    const loadDocument = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Handle different URL types
        let documentUrl = pdfUrl;
        if (pdfUrl.startsWith('file://') || pdfUrl.startsWith('/')) {
          // For local files in Electron, use the readPdfFile API
          if (window.electron?.readPdfFile) {
            try {
              const filePath = pdfUrl.replace('file://', '');
              console.log('Reading PDF file from path:', filePath);
              const pdfData = await window.electron.readPdfFile(filePath);
              
              // Debug the PDF data
              console.log('PDF data type:', typeof pdfData);
              console.log('PDF data length:', pdfData?.length);
              console.log('First few bytes:', pdfData?.slice(0, 20));
              
              // Create a Uint8Array from the data
              const uint8Array = new Uint8Array(pdfData);
              
              // Load the document directly with the data
              const loadingTask = pdfjs.getDocument({
                data: uint8Array,
                cMapUrl: PDF_CONFIG.rendering.cMapUrl,
                cMapPacked: PDF_CONFIG.rendering.cMapPacked,
              });
              
              loadingTask.onProgress = (progress) => {
                if (progress.total > 0) {
                  console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
                }
              };
              
              const doc = await loadingTask.promise;
              
              if (!isActive) return;
              
              console.log('PDF document loaded successfully with', doc.numPages, 'pages');
              setPdfDoc(doc);
              setNumPages(doc.numPages);
              
              if (onDocumentLoad) {
                onDocumentLoad(doc.numPages);
              }
              
              return; // Exit early since we've already loaded the document
            } catch (error) {
              console.error('Error reading PDF file through Electron:', error);
              throw new Error(`Failed to read PDF file: ${error.message}`);
            }
          } else {
            // Fallback for non-Electron environment
            try {
              const response = await fetch(pdfUrl);
              if (!response.ok) {
                throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
              }
              const blob = await response.blob();
              documentUrl = URL.createObjectURL(blob);
              console.log('Created blob URL for local file:', documentUrl);
            } catch (error) {
              console.error('Error loading local file:', error);
              throw new Error(`Failed to load local file: ${error.message}`);
            }
          }
        } else if (pdfUrl.startsWith('./')) {
          // For relative paths
          const base = window.location.origin;
          documentUrl = new URL(pdfUrl, base).toString();
          console.log('Resolved relative URL:', documentUrl);
        }
        
        // Load the document
        const loadingTask = pdfjs.getDocument({
          url: documentUrl,
          cMapUrl: PDF_CONFIG.rendering.cMapUrl,
          cMapPacked: PDF_CONFIG.rendering.cMapPacked,
        });
        
        loadingTask.onProgress = (progress) => {
          if (progress.total > 0) {
            console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
          }
        };
        
        const doc = await loadingTask.promise;
        
        if (!isActive) return;
        
        console.log('PDF document loaded successfully with', doc.numPages, 'pages');
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        
        if (onDocumentLoad) {
          onDocumentLoad(doc.numPages);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (!isActive) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF';
        setError(errorMessage);
        
        if (onError && err instanceof Error) {
          onError(err);
        } else if (onError) {
          onError(new Error(errorMessage));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    
    loadDocument();
    
    return () => {
      isActive = false;
    };
  }, [pdfUrl, onDocumentLoad, onError]);
  
  // Render PDF pages when document is loaded
  useEffect(() => {
    if (!pdfDoc || !pdfContainerRef.current) return;
    
    const container = pdfContainerRef.current;
    
    // Clear previous content
    container.innerHTML = '';
    
    console.log('Container dimensions:', container.offsetWidth, container.offsetHeight);
    
    const renderPages = async () => {
      console.log(`Rendering ${numPages} PDF pages...`);
      
      // Create a wrapper for all pages
      const pagesWrapper = document.createElement('div');
      pagesWrapper.className = 'pdf-pages';
      container.appendChild(pagesWrapper);
      
      for (let i = 1; i <= numPages; i++) {
        try {
          // Create page container
          const pageContainer = document.createElement('div');
          pageContainer.className = 'pdf-page';
          pageContainer.dataset.pageNumber = String(i);
          
          // Add loading indicator
          const loadingIndicator = document.createElement('div');
          loadingIndicator.className = 'page-loading';
          loadingIndicator.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading page ${i}...</div>
          `;
          pageContainer.appendChild(loadingIndicator);
          pagesWrapper.appendChild(pageContainer);
          
          // Get the page
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale });
          
          // Remove loading indicator
          pageContainer.innerHTML = '';
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          if (!context) continue;
          
          // Set dimensions with pixel ratio for high-DPI screens
          const pixelRatio = window.devicePixelRatio || 1;
          canvas.width = viewport.width * pixelRatio;
          canvas.height = viewport.height * pixelRatio;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          
          // Set page container dimensions to match viewport
          pageContainer.style.width = `${viewport.width}px`;
          pageContainer.style.height = `${viewport.height}px`;
          
          // Adjust for pixel ratio
          context.scale(pixelRatio, pixelRatio);
          
          // Fill with white background
          context.fillStyle = 'rgb(255, 255, 255)';
          context.fillRect(0, 0, viewport.width, viewport.height);
          
          pageContainer.appendChild(canvas);
          
          // Render PDF page
          await page.render({
            canvasContext: context,
            viewport,
            background: 'rgb(255, 255, 255)'
          }).promise;
          
          console.log(`Page ${i} rendered successfully`);
        } catch (err) {
          console.error(`Error rendering page ${i}:`, err);
          
          // Show error in the page container
          const pageContainer = pagesWrapper.querySelector(`[data-page-number="${i}"]`);
          if (pageContainer) {
            pageContainer.innerHTML = `
              <div class="page-error">
                <p>Error rendering page ${i}</p>
                <p class="error-message">${err.message || 'Unknown error'}</p>
              </div>
            `;
          }
        }
      }
    };
    
    renderPages();
  }, [pdfDoc, numPages, scale]);
  
  const handleZoomChange = useCallback((newScale) => {
    setScale(newScale);
  }, []);
  
  if (error) {
    return (
      <div className={`pdf-viewer-root ${className}`}>
        <div className="pdf-error">
          <p>Error loading PDF: {error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`pdf-viewer-root ${className}`}>
      <PDFControls onZoomChange={handleZoomChange} />
      
      <div className="pdf-scroll-container">
        {isLoading ? (
          <div className="pdf-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading PDF...</div>
          </div>
        ) : (
          <div ref={pdfContainerRef} className="pdf-content-container"></div>
        )}
      </div>
    </div>
  );
};

export default PDFViewer; 