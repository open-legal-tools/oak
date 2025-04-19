export interface DocumentViewerState {
  pageNumber: number;
  zoomLevel: number;
  scrollPosition: {
    x: number;
    y: number;
  };
}

export interface PaneConfig {
  id: string;
  documentId?: string;
  title?: string;
  type: 'document' | 'split';
  position?: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  documentState?: DocumentViewerState;
}

export interface LayoutComponentState {
  paneId: string;
  documentId?: string;
  type: string;
}

export type SplitDirection = 'horizontal' | 'vertical'; 