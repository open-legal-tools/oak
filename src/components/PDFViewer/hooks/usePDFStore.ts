import { create } from 'zustand';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { 
  PageState, 
  ViewportState, 
  CachedPage, 
  ZoomOperation,
  RenderTask
} from '../types';

interface PDFStore {
  // Document State
  document: PDFDocumentProxy | null;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  
  // Viewport State
  viewport: ViewportState;
  
  // Render State
  pageStates: Map<number, PageState>;
  renderQueue: RenderTask[];
  
  // Cache State
  cachedPages: Map<number, CachedPage>;
  
  // Zoom State
  scale: number;
  isZooming: boolean;
  zoomOperation: ZoomOperation | null;
  
  // Actions
  setDocument: (doc: PDFDocumentProxy | null) => void;
  setTotalPages: (total: number) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  setViewport: (viewport: Partial<ViewportState>) => void;
  
  setPageState: (pageNumber: number, state: Partial<PageState>) => void;
  addToRenderQueue: (task: RenderTask) => void;
  removeFromRenderQueue: (pageNumber: number) => void;
  
  setCachedPage: (pageNumber: number, page: CachedPage) => void;
  removeCachedPage: (pageNumber: number) => void;
  
  setScale: (scale: number, centerPoint?: { x: number; y: number }) => void;
  setZooming: (isZooming: boolean) => void;
  clearZoomOperation: () => void;
}

const usePDFStore = create<PDFStore>((set, get) => ({
  // Initial State
  document: null,
  totalPages: 0,
  isLoading: false,
  error: null,
  
  viewport: {
    visiblePages: new Set(),
    nearbyPages: new Set(),
    scrollPosition: 0
  },
  
  pageStates: new Map(),
  renderQueue: [],
  
  cachedPages: new Map(),
  
  scale: 1.0,
  isZooming: false,
  zoomOperation: null,
  
  // Actions
  setDocument: (doc) => set({ document: doc }),
  
  setTotalPages: (total) => set({ totalPages: total }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setViewport: (viewport) => set((state) => ({
    viewport: { ...state.viewport, ...viewport }
  })),
  
  setPageState: (pageNumber, newState) => set((state) => {
    const pageStates = new Map(state.pageStates);
    const currentState = pageStates.get(pageNumber) || {
      isLoading: false,
      isVisible: false,
      isNearby: false
    };
    pageStates.set(pageNumber, { ...currentState, ...newState });
    return { pageStates };
  }),
  
  addToRenderQueue: (task) => set((state) => ({
    renderQueue: [...state.renderQueue, task].sort((a, b) => b.priority - a.priority)
  })),
  
  removeFromRenderQueue: (pageNumber) => set((state) => ({
    renderQueue: state.renderQueue.filter(task => task.pageNumber !== pageNumber)
  })),
  
  setCachedPage: (pageNumber, page) => set((state) => {
    const cachedPages = new Map(state.cachedPages);
    cachedPages.set(pageNumber, page);
    return { cachedPages };
  }),
  
  removeCachedPage: (pageNumber) => set((state) => {
    const cachedPages = new Map(state.cachedPages);
    cachedPages.delete(pageNumber);
    return { cachedPages };
  }),
  
  setScale: (scale, centerPoint) => set((state) => ({
    scale,
    isZooming: true,
    zoomOperation: {
      scale,
      timestamp: Date.now(),
      centerPoint
    }
  })),
  
  setZooming: (isZooming) => set({ isZooming }),
  
  clearZoomOperation: () => set({ zoomOperation: null, isZooming: false })
}));

export default usePDFStore; 