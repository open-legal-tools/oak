import React, { useEffect } from 'react';
import usePDFStore from '../hooks/usePDFStore';
import qualityManager from '../utils/qualityManager';

interface PageRendererProps {
  pageNumber: number;
  isVisible: boolean;
  isNearby: boolean;
}

const PageRenderer = ({
  pageNumber,
  isVisible,
  isNearby
}: PageRendererProps) => {
  const { 
    document: pdfDoc, 
    scale, 
    pageStates, 
    setPageState,
    cachedPages,
    addToRenderQueue
  } = usePDFStore();
  
  // Get current page state
  const pageState = pageStates.get(pageNumber) || {
    isLoading: false,
    isVisible: false,
    isNearby: false
  };
  
  // Effect to handle page queueing
  useEffect(() => {
    if (!pdfDoc) return;
    
    // Update visibility state
    setPageState(pageNumber, {
      isVisible,
      isNearby
    });
    
    // Don't queue if already rendered or loading
    if (pageState.isLoading || pageState.dimensions) {
      return;
    }
    
    // Determine quality level
    const quality = qualityManager.getQualityForPage(
      pageNumber,
      isVisible,
      isNearby,
      scale
    );
    
    // Add to render queue with priority based on visibility
    const priority = isVisible ? 2 : (isNearby ? 1 : 0);
    
    console.log(`Queuing page ${pageNumber} with priority ${priority}`);
    
    // Add to queue with priority
    addToRenderQueue({
      pageNumber,
      priority,
      quality,
      timestamp: Date.now()
    });
  }, [
    pdfDoc, 
    pageNumber, 
    isVisible, 
    isNearby, 
    scale, 
    pageState.isLoading, 
    pageState.dimensions,
    setPageState,
    addToRenderQueue
  ]);
  
  // Render loading state
  if (pageState.isLoading) {
    return (
      <div className="page-loading" data-page-num={pageNumber}>
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading page {pageNumber}...</div>
      </div>
    );
  }
  
  // Render error state
  if (pageState.error) {
    return (
      <div className="page-error" data-page-num={pageNumber}>
        <div className="error-message">
          {pageState.error}
        </div>
      </div>
    );
  }
  
  // Get cached image if available
  const cachedPage = cachedPages.get(pageNumber);
  
  // If we have dimensions but no render yet, show a placeholder
  if (!pageState.dimensions && !cachedPage) {
    return (
      <div className="pdf-page placeholder" data-page-num={pageNumber}>
        <canvas />
      </div>
    );
  }
  
  // Render the page
  return (
    <div 
      className={`pdf-page ${isVisible ? 'visible' : ''} ${isNearby ? 'nearby' : ''}`}
      data-page-num={pageNumber}
      style={{
        width: pageState.dimensions?.width,
        height: pageState.dimensions?.height
      }}
    >
      {cachedPage && pageState.renderType === 'image' ? (
        <img 
          src={cachedPage.data} 
          alt={`Page ${pageNumber}`}
          width={cachedPage.dimensions.width}
          height={cachedPage.dimensions.height}
          loading="lazy"
        />
      ) : (
        <canvas />
      )}
    </div>
  );
};

export default React.memo(PageRenderer); 