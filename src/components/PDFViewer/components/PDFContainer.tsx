import React, { useRef, useEffect, useState, useCallback } from 'react';
import usePDFStore from '../hooks/usePDFStore';
import useViewport from '../hooks/useViewport';
import PageRenderer from './PageRenderer';
import { PDF_CONFIG } from '../config';
import { RenderTask } from '../types';

interface PDFContainerProps {
  className?: string;
}

const PDFContainer = ({ className = '' }: PDFContainerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    document: pdfDoc, 
    totalPages, 
    scale,
    renderQueue,
    pageStates,
    setPageState,
    removeFromRenderQueue
  } = usePDFStore();
  
  // Track which pages are currently rendering
  const [renderingPages, setRenderingPages] = useState(() => new Set());
  
  const { visiblePages, nearbyPages } = useViewport({
    containerRef,
    totalPages,
    preloadPages: PDF_CONFIG.performance.preloadPages,
    scrollThreshold: 0.1
  });

  // Reference to store page elements
  const pageRefs = useRef({});
  
  // Function to render a page from the queue
  const renderPage = useCallback(async (task: RenderTask) => {
    if (!pdfDoc) return;
    
    try {
      console.log(`Starting render of page ${task.pageNumber}`);
      
      // Get the page
      const page = await pdfDoc.getPage(task.pageNumber);
      
      // Find the canvas element for this page
      const pageElement = pageRefs.current[task.pageNumber];
      if (!pageElement) {
        console.warn(`No element found for page ${task.pageNumber}`);
        return;
      }
      
      const canvas = pageElement.querySelector('canvas');
      if (!canvas) {
        console.warn(`No canvas found for page ${task.pageNumber}`);
        return;
      }
      
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        console.warn(`Could not get context for page ${task.pageNumber}`);
        return;
      }
      
      // Calculate viewport
      const viewport = page.getViewport({ scale: task.quality.scale });
      
      // Set canvas dimensions
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear canvas with white background
      context.fillStyle = 'rgb(255, 255, 255)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        background: 'rgb(255, 255, 255)'
      };
      
      const renderTask = page.render(renderContext);
      
      await renderTask.promise;
      console.log(`Finished rendering page ${task.pageNumber}`);
      
      // Update page state
      setPageState(task.pageNumber, {
        isLoading: false,
        dimensions: {
          width: viewport.width,
          height: viewport.height
        },
        quality: task.quality.quality,
        renderType: task.quality.renderType
      });
      
      // Remove from render queue
      removeFromRenderQueue(task.pageNumber);
      
      // Remove from rendering set
      setRenderingPages(prev => {
        const next = new Set(prev);
        next.delete(task.pageNumber);
        return next;
      });
    } catch (err) {
      console.error(`Error rendering page ${task.pageNumber}:`, err);
      setPageState(task.pageNumber, { 
        isLoading: false, 
        error: 'Render failed'
      });
      removeFromRenderQueue(task.pageNumber);
      setRenderingPages(prev => {
        const next = new Set(prev);
        next.delete(task.pageNumber);
        return next;
      });
    }
  }, [pdfDoc, setPageState, removeFromRenderQueue]);
  
  // Effect to process render queue
  useEffect(() => {
    const processQueue = async () => {
      // Don't process if we're already at max concurrent renders
      if (renderingPages.size >= PDF_CONFIG.performance.maxWorkers) {
        return;
      }
      
      // Get next task from queue that isn't already rendering
      const nextTask = renderQueue.find(task => !renderingPages.has(task.pageNumber));
      if (!nextTask) return;
      
      console.log(`Processing queue for page ${nextTask.pageNumber}`);
      
      // Mark page as rendering
      setRenderingPages(prev => {
        const next = new Set(prev);
        next.add(nextTask.pageNumber);
        return next;
      });
      
      // Update page state to loading
      setPageState(nextTask.pageNumber, {
        isLoading: true,
        quality: nextTask.quality.quality,
        renderType: nextTask.quality.renderType
      });
      
      // Actually render the page
      renderPage(nextTask);
    };
    
    if (renderQueue.length > 0) {
      processQueue();
    }
  }, [renderQueue, renderingPages, setPageState, renderPage]);
  
  // Log current state
  useEffect(() => {
    console.log('Render queue:', renderQueue.length);
    console.log('Rendering pages:', renderingPages.size);
    console.log('Visible pages:', visiblePages.size);
  }, [renderQueue, renderingPages, visiblePages]);
  
  if (!pdfDoc || totalPages === 0) {
    return (
      <div className="pdf-container-empty">
        No PDF document loaded
      </div>
    );
  }
  
  // Generate array of page numbers
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  
  return (
    <div 
      ref={containerRef}
      className={`pdf-container ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
        padding: '20px'
      }}
    >
      <div className="pdf-pages">
        {pageNumbers.map(pageNum => (
          <div 
            key={`page-container-${pageNum}`}
            ref={el => pageRefs.current[pageNum] = el}
            data-page-num={pageNum}
            className="pdf-page-container"
          >
            <PageRenderer
              key={`page-${pageNum}`}
              pageNumber={pageNum}
              isVisible={visiblePages.has(pageNum)}
              isNearby={nearbyPages.has(pageNum)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PDFContainer; 