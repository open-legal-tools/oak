import { create } from 'zustand';

const usePDFStore = create((set, get) => ({
  pdfDoc: null,
  numPages: 0,
  scale: 1.0,
  renderedPages: {},
  isZooming: false,
  
  // Actions
  setPdfDoc: (pdfDoc) => set({ pdfDoc }),
  setNumPages: (numPages) => set({ numPages }),
  
  // Enhanced scale handling
  setScale: (scale) => {
    const currentScale = get().scale;
    if (currentScale !== scale) {
      set({ scale, isZooming: true });
    }
  },
  
  setIsZooming: (isZooming) => set({ isZooming }),
  
  // Use this for single page updates to avoid re-rendering the entire component tree
  setRenderedPage: (pageNum, pageData) => set((state) => {
    if (state.renderedPages[pageNum]?.data === pageData.data) {
      return state; // No change
    }
    return {
      renderedPages: {
        ...state.renderedPages,
        [pageNum]: pageData
      }
    };
  }),
  
  // Enhanced rendered pages handling
  setRenderedPages: (newPages) => set((state) => {
    if (state.isZooming) {
      return { renderedPages: newPages, isZooming: false };
    }
    // Only update if there are actual changes
    if (JSON.stringify(state.renderedPages) === JSON.stringify(newPages)) {
      return state;
    }
    return { renderedPages: newPages };
  }),
  
  // Clear rendered pages (for zoom operations)
  clearRenderedPages: () => set((state) => {
    if (Object.keys(state.renderedPages).length === 0) return state;
    return { renderedPages: {} };
  }),
}));

export default usePDFStore;