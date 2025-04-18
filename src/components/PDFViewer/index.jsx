import React, { useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import usePDFManager from '../../hooks/usePDFManager';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import PDFControls from './PDFControls';
import PDFLoadingState from './PDFLoadingState';
import PDFErrorState from './PDFErrorState';
import PDFEmptyState from './PDFEmptyState';
import PDFPage from './PDFPage';
import './PDFViewer.css';

// Set worker path to use local file
pdfjs.GlobalWorkerOptions.workerSrc = './assets/pdf.worker.min.js';

/**
 * PDF Viewer component with consolidated PDF management
 */
const PDFViewer = ({ pdfPath }) => {
  const {
    isLoading,
    error,
    isZooming,
    renderedPages,
    numPages,
    setPageRef,
    initializeRendering,
    handleZoomChange,
    setError
  } = usePDFManager(pdfPath);
  
  // Main container ref
  const containerRef = useRef(null);
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="pdf-viewer">
      <PDFControls onZoomChange={handleZoomChange} />
      
      {error && (
        <PDFErrorState 
          error={error}
          onDismiss={() => setError('')}
          onReload={() => window.location.reload()}
        />
      )}
      
      {isLoading && <PDFLoadingState />}
      
      {!isLoading && !error && numPages === 0 && <PDFEmptyState />}
      
      {!isLoading && !error && numPages > 0 && (
        <div 
          className="pdf-container"
          ref={(ref) => {
            containerRef.current = ref;
            if (ref) initializeRendering(ref);
          }}
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <PDFPage
              key={`page-${pageNum}`}
              pageNum={pageNum}
              pageData={renderedPages[pageNum] || {}}
              isRendered={!!renderedPages[pageNum]}
              onRef={(ref) => setPageRef(pageNum, ref)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 