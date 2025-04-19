import React, { useEffect, useCallback, useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import { PDF_CONFIG } from './config';
import PDFControls from './PDFControls';
import './PDFViewer.css';
import { useDispatch, useSelector } from 'react-redux';
import { setActivePage } from '../../store/documentSlice';

// Configure PDF.js worker - this is a fallback if global worker is not set
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
  const workerPath = PDF_CONFIG.worker.getWorkerPath();
  console.log('Setting up PDF.js worker at:', workerPath);
  pdfjs.GlobalWorkerOptions.workerSrc = workerPath;
}

// Debug helper
if (process.env.NODE_ENV !== 'production') {
  try {
    (pdfjs as any).verbosity = 1; // INFOS
    console.log('PDF.js debugging enabled');
  } catch (e) {
    console.warn('Could not enable PDF.js debugging:', e);
  }
}

interface PDFViewerProps {
  url?: string;
  pdfPath?: string; // Support for backward compatibility
  className?: string;
  onDocumentLoad?: (totalPages: number) => void;
  onError?: (error: Error) => void;
  paneId?: string;
  isActivePane?: boolean;
}

const PDFViewer = ({
  url,
  pdfPath,
  className = '',
  onDocumentLoad,
  onError,
  paneId,
  isActivePane = false
}: PDFViewerProps) => {
  // Use either url or pdfPath (for backward compatibility)
  const pdfUrl = url || pdfPath;
  
  const dispatch = useDispatch();
  const activePage = useSelector((state: any) => state.document.activePage);
  
  // Type definitions for state
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Sync with global active page when not the active pane
  useEffect(() => {
    if (!isActivePane && activePage) {
      setCurrentPage(activePage);
    }
  }, [activePage, isActivePane]);
  
  // Update global active page when this pane is active
  useEffect(() => {
    if (isActivePane) {
      dispatch(setActivePage(currentPage));
    }
  }, [currentPage, isActivePane, dispatch]);
  
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
        if (pdfUrl.startsWith('/') && !pdfUrl.startsWith('//')) {
          // For absolute file paths in Electron
          documentUrl = `file://${pdfUrl}`;
          console.log('Converted to file URL:', documentUrl);
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
          
          // Set dimensions
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          
          // Set page container dimensions to match canvas
          pageContainer.style.width = `${viewport.width}px`;
          pageContainer.style.height = `${viewport.height}px`;
          
          // Fill with white background
          context.fillStyle = 'rgb(255, 255, 255)';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
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
                <p class="error-message">${err instanceof Error ? err.message : 'Unknown error'}</p>
              </div>
            `;
          }
        }
      }
    };
    
    renderPages();
  }, [pdfDoc, numPages, scale]);
  
  const handleZoomChange = useCallback((newScale: number) => {
    setScale(newScale);
  }, []);
  
  // Add page navigation handlers
  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > numPages) return;
    setCurrentPage(pageNumber);
    if (pdfContainerRef.current) {
      const pageElement = pdfContainerRef.current.querySelector(`[data-page-number="${pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [numPages]);
  
  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  // Add keyboard navigation
  useEffect(() => {
    if (!isActivePane) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch(e.key) {
          case 'ArrowRight':
            e.preventDefault();
            goToNextPage();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            goToPrevPage();
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActivePane, goToNextPage, goToPrevPage]);
  
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
      <PDFControls 
        onZoomChange={handleZoomChange}
        currentPage={currentPage}
        totalPages={numPages}
        onPageChange={goToPage}
        isActivePane={isActivePane}
      />
      
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