import React, { useRef, useEffect } from 'react';

/**
 * Component to render a single PDF page
 */
const PDFPage = ({ pageNum, pageData, isRendered }) => {
  // Reference to the container element for intersection observer
  const pageRef = useRef(null);
  
  // Track if this page has been observed
  const observedRef = useRef(false);
  
  // Prevent unnecessary re-renders
  const memoizedData = useRef(pageData);
  
  // Update the memoized data only when it actually changes
  useEffect(() => {
    if (isRendered && pageData && pageData.data !== memoizedData.current?.data) {
      memoizedData.current = pageData;
    }
  }, [pageData, isRendered]);
  
  return (
    <div 
      ref={pageRef}
      data-page-num={pageNum}
      className={`pdf-page ${isRendered ? 'rendered' : 'loading'}`}
      style={isRendered ? {
        width: pageData.width,
        height: pageData.height
      } : undefined}
    >
      {isRendered ? (
        <img 
          src={pageData.data} 
          alt={`Page ${pageNum}`}
          className="pdf-page-image"
          width={pageData.width}
          height={pageData.height}
          loading="lazy"
        />
      ) : (
        <div className="page-loading">
          <div className="loading-spinner"></div>
          <div>Loading page {pageNum}...</div>
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(PDFPage, (prevProps, nextProps) => {
  // Only re-render if the rendered state changes or if the data changes when rendered
  return prevProps.isRendered === nextProps.isRendered && 
         (prevProps.isRendered === false || 
          prevProps.pageData?.data === nextProps.pageData?.data);
}); 