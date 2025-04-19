import { useState, useRef, useCallback, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import usePDFStore from './usePDFStore';

/**
 * Consolidated hook for managing PDF loading, rendering, and state
 */
const usePDFManager = (pdfPath) => {
  // Store state
  const { 
    pdfDoc, 
    numPages, 
    scale,
    renderedPages,
    setPdfDoc,
    setNumPages,
    setRenderedPage,
    clearRenderedPages
  } = usePDFStore();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isZooming, setIsZooming] = useState(false);
  const [renderScale, setRenderScale] = useState(1.0);

  // Refs for mutable state
  const renderingQueue = useRef([]);
  const isRendering = useRef(false);
  const pageRefs = useRef({});
  const renderedPageCache = useRef(new Set());
  const pdfDataCache = useRef(new Map());
  const hasInitializedRef = useRef(false);

  /**
   * PDF Data Loading
   */
  const fetchPdfData = async (url) => {
    if (url.startsWith('file://')) {
      throw new Error('Cannot fetch from file:// URL directly');
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  };

  const loadPdf = useCallback(async () => {
    if (!pdfPath) return;

    setError('');
    setIsLoading(true);
    hasInitializedRef.current = false;
    renderedPageCache.current.clear();
    renderingQueue.current = [];

    try {
      const normalizedPath = pdfPath.replace(/^file:\/\//, '');
      let pdfData;

      // Try cache first
      if (pdfDataCache.current.has(normalizedPath)) {
        pdfData = pdfDataCache.current.get(normalizedPath);
      } else {
        // Load fresh PDF data
        if (pdfPath.startsWith('file://') || pdfPath.startsWith('/')) {
          if (typeof window.electron?.readPdfFile === 'function') {
            pdfData = await window.electron.readPdfFile(normalizedPath);
          } else {
            pdfData = await fetchPdfData(pdfPath);
          }
        } else {
          pdfData = await fetchPdfData(pdfPath);
        }
        pdfDataCache.current.set(normalizedPath, pdfData);
      }

      const loadingTask = pdfjs.getDocument({ data: pdfData });
      const loadedPdfDoc = await loadingTask.promise;

      setPdfDoc(loadedPdfDoc);
      setNumPages(loadedPdfDoc.numPages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError(`Failed to load PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [pdfPath, setPdfDoc, setNumPages]);

  /**
   * Page Rendering
   */
  const renderSinglePage = useCallback(async (pageNum) => {
    console.log('Attempting to render page:', pageNum);
    if (!pdfDoc || pageNum < 1 || pageNum > numPages) {
      console.log('Cannot render page:', { hasPdfDoc: !!pdfDoc, pageNum, numPages });
      return false;
    }

    try {
      console.log('Getting page:', pageNum);
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: renderScale });
      console.log('Page viewport:', { width: viewport.width, height: viewport.height });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Fill with white background
      context.fillStyle = 'rgb(255, 255, 255)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      console.log('Rendering page:', pageNum);
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      console.log('Page rendered successfully:', pageNum);
      setRenderedPage(pageNum, {
        canvas: canvas,
        viewport: viewport
      });
      
      return true;
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
      return false;
    }
  }, [pdfDoc, numPages, renderScale, setRenderedPage]);

  const processQueue = useCallback(async () => {
    console.log('Processing queue:', {
      isRendering: isRendering.current,
      hasPdfDoc: !!pdfDoc,
      queueLength: renderingQueue.current.length
    });

    if (isRendering.current || !pdfDoc || renderingQueue.current.length === 0) {
      return;
    }

    isRendering.current = true;

    try {
      const pageNum = renderingQueue.current.shift();
      console.log('Processing page from queue:', pageNum);
      await renderSinglePage(pageNum);
    } finally {
      isRendering.current = false;

      if (renderingQueue.current.length > 0) {
        console.log('Queue not empty, continuing...');
        processQueue();
      } else {
        console.log('Queue empty, rendering complete');
      }
    }
  }, [pdfDoc, renderSinglePage]);

  /**
   * Initialization and Page Management
   */
  const initializeRendering = useCallback((container) => {
    if (!container || !pdfDoc) return;
    
    // Clear any existing rendering queue
    renderingQueue.current = [];
    isRendering.current = false;
    
    // Queue all pages for rendering
    for (let i = 1; i <= numPages; i++) {
      renderingQueue.current.push(i);
    }
    
    // Start rendering process
    if (renderingQueue.current.length > 0) {
      processQueue();
    }
  }, [pdfDoc, numPages, processQueue]);

  const setPageRef = useCallback((pageNum, ref) => {
    if (!ref || !pageNum) return;

    pageRefs.current[pageNum] = ref;

    if (!renderedPageCache.current.has(pageNum) && !renderingQueue.current.includes(pageNum)) {
      renderingQueue.current.push(pageNum);
      
      if (!isRendering.current) {
        requestAnimationFrame(processQueue);
      }
    }
  }, [processQueue]);

  /**
   * Zoom Handling
   */
  const handleZoomChange = useCallback((newScale) => {
    console.log('Zoom change requested:', newScale);
    
    // Calculate the new scale
    const currentScale = scale;
    let finalScale = newScale;
    
    if (typeof newScale === 'function') {
      finalScale = newScale(currentScale);
    }
    
    // Ensure scale is within bounds
    finalScale = Math.min(Math.max(finalScale, 0.5), 3.0);
    
    console.log('Setting render scale to:', finalScale);
    setRenderScale(finalScale);
    
    // Clear existing rendered pages
    clearRenderedPages();
    renderingQueue.current = [];
    
    // Start rendering immediately
    const container = containerRef.current;
    if (container) {
      console.log('Starting re-render after zoom');
      initializeRendering(container);
    } else {
      console.log('No container available for re-render');
    }
  }, [scale, clearRenderedPages, initializeRendering]);

  // Load PDF when path changes
  useEffect(() => {
    loadPdf();
  }, [pdfPath, loadPdf]);

  return {
    // State
    isLoading,
    error,
    isZooming,
    renderedPages,
    numPages,
    
    // Actions
    setPageRef,
    initializeRendering,
    handleZoomChange,
    setError,
  };
};

export default usePDFManager; 