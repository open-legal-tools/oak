import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

export interface QualityLevel {
  scale: number;
  quality: number;
  renderType: 'canvas' | 'image';
  compression: number;
}

export interface PageDimensions {
  width: number;
  height: number;
}

export interface PageState {
  isLoading: boolean;
  isVisible: boolean;
  isNearby: boolean;
  error?: string;
  dimensions?: PageDimensions;
  renderType?: 'canvas' | 'image';
  quality?: number;
}

export interface CachedPage {
  data: string;
  dimensions: PageDimensions;
  quality: number;
  timestamp: number;
}

export interface RenderTask {
  pageNumber: number;
  priority: number;
  quality: QualityLevel;
  timestamp: number;
}

export interface ViewportState {
  visiblePages: Set<number>;
  nearbyPages: Set<number>;
  scrollPosition: number;
}

export interface ZoomOperation {
  scale: number;
  timestamp: number;
  centerPoint?: { x: number; y: number };
}

export interface PDFViewerProps {
  url: string;
  initialPage?: number;
  renderQuality?: Partial<QualityLevel>;
  onDocumentLoad?: (totalPages: number) => void;
  onError?: (error: Error) => void;
}

export interface WorkerPoolTask {
  type: 'render' | 'cache' | 'cleanup';
  payload: any;
  priority: number;
  callback: (result: any) => void;
} 