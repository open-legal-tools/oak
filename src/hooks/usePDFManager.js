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
    if (!pdfDoc || pageNum < 1 || pageNum > numPages || renderedPageCache.current.has(pageNum)) {
      return;
    }

    try {
      const page = await pdfDoc.getPage(pageNum);
      
      // Calculate scale
      const originalViewport = page.getViewport({ scale: 1.0 });
      const targetWidth = Math.min(800, window.innerWidth - 60);
      const scaleFactor = targetWidth / originalViewport.width;
      const finalScale = scale * scaleFactor;

      const viewport = page.getViewport({ scale: finalScale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { alpha: false });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill background
      context.fillStyle = 'rgb(255, 255, 255)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
        background: 'rgb(255, 255, 255)'
      });

      await renderTask.promise;

      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      renderedPageCache.current.add(pageNum);

      setRenderedPage(pageNum, {
        data: imageData,
        width: canvas.width,
        height: canvas.height
      });

      return true;
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
      return false;
    }
  }, [pdfDoc, numPages, scale, setRenderedPage]);

  const processQueue = useCallback(async () => {
    if (isRendering.current || !pdfDoc || renderingQueue.current.length === 0) {
      return;
    }

    isRendering.current = true;

    try {
      const pageNum = renderingQueue.current.shift();
      await renderSinglePage(pageNum);
    } finally {
      isRendering.current = false;

      if (renderingQueue.current.length > 0) {
        requestAnimationFrame(processQueue);
      }
    }
  }, [pdfDoc, renderSinglePage]);

  /**
   * Initialization and Page Management
   */
  const initializeRendering = useCallback((containerRef) => {
    if (hasInitializedRef.current || !pdfDoc || numPages === 0 || isZooming) {
      return;
    }

    hasInitializedRef.current = true;

    if (scale !== renderScale) {
      clearRenderedPages();
      renderingQueue.current = [];
      renderedPageCache.current.clear();
      setRenderScale(scale);
    }

    // Queue initial pages
    for (let i = 1; i <= Math.min(3, numPages); i++) {
      if (!renderedPageCache.current.has(i) && !renderingQueue.current.includes(i)) {
        renderingQueue.current.push(i);
      }
    }

    requestAnimationFrame(processQueue);
  }, [pdfDoc, numPages, processQueue, scale, renderScale, clearRenderedPages, isZooming]);

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
    if (isZooming) return;

    setIsZooming(true);
    renderingQueue.current = [];

    requestAnimationFrame(() => {
      hasInitializedRef.current = false;
      renderedPageCache.current.clear();
      clearRenderedPages();

      requestAnimationFrame(() => {
        setRenderScale(newScale);
        setIsZooming(false);
      });
    });
  }, [clearRenderedPages, isZooming]);

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