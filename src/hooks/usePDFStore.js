import { create } from 'zustand';

const usePDFStore = create((set, get) => ({
  pdfDoc: null,
  numPages: 0,
  scale: 1.0,
  renderedPages: {},
  
  // Actions
  setPdfDoc: (pdfDoc) => {
    console.log('Setting PDF doc:', pdfDoc ? 'valid' : 'null');
    set({ pdfDoc });
  },
  
  setNumPages: (numPages) => {
    console.log('Setting num pages:', numPages);
    set({ numPages });
  },
  
  // Enhanced scale handling
  setScale: (newScale) => {
    console.log('Setting scale:', newScale);
    const currentScale = get().scale;
    let finalScale = newScale;
    
    // Handle both function and direct value cases
    if (typeof newScale === 'function') {
      finalScale = newScale(currentScale);
    }
    
    // Ensure scale is within bounds
    finalScale = Math.min(Math.max(finalScale, 0.5), 3.0);
    
    console.log('Final scale:', finalScale);
    set({ scale: finalScale, renderedPages: {} });
  },
  
  // Use this for single page updates
  setRenderedPage: (pageNum, pageData) => {
    console.log('Setting rendered page:', pageNum);
    set((state) => ({
      renderedPages: {
        ...state.renderedPages,
        [pageNum]: pageData
      }
    }));
  },
  
  // Clear rendered pages
  clearRenderedPages: () => {
    console.log('Clearing rendered pages');
    set({ renderedPages: {} });
  },
}));

export default usePDFStore;