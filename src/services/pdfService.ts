// src/services/pdfService.ts
import pdfJsService from './pdfJsService';
import { logger } from '../utils/logger';

/**
 * Common interface for PDF document operations
 * This allows us to swap PDF rendering backends (PDF.js, PDFium) without changing client code
 */
export interface PDFDocument {
  // Basic document info
  id: string;
  url: string;
  totalPages: number;
  
  // PDF operations
  getPage(pageNumber: number): Promise<PDFPage>;
  getOutline(): Promise<PDFOutlineNode[]>;
  getMetadata(): Promise<PDFMetadata>;
  
  // Lifecycle
  close(): Promise<void>;
}

export interface PDFPage {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  
  // Rendering
  render(canvas: HTMLCanvasElement, scale: number): Promise<void>;
  
  // Text extraction
  getText(): Promise<string>;
  getTextContent(): Promise<PDFTextItem[]>;
}

export interface PDFTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PDFOutlineNode {
  title: string;
  pageNumber: number;
  children: PDFOutlineNode[];
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

// Service factory modes
export type PDFEngineType = 'pdfjs' | 'pdfium';

/**
 * PDF Service - handles document operations with ability to swap backends
 */
class PDFService {
  private engineType: PDFEngineType = 'pdfjs';
  
  /**
   * Set the engine type to use
   */
  setEngineType(type: PDFEngineType): void {
    this.engineType = type;
    logger.info('pdf', `PDF engine set to: ${type}`);
  }
  
  /**
   * Get current engine type
   */
  getEngineType(): PDFEngineType {
    return this.engineType;
  }
  
  /**
   * Check if PDFium is available in this environment
   */
  isPDFiumAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.hasOwnProperty('electron') && 
           window?.electron?.isPDFiumAvailable?.() === true;
  }
  
  /**
   * Load a PDF document
   * Returns a PDFDocument interface that abstracts the underlying engine
   */
  async loadDocument(url: string, id: string = crypto.randomUUID()): Promise<PDFDocument> {
    try {
      logger.info('pdf', `Loading document: ${url} using ${this.engineType}`);
      
      // Use the appropriate engine based on settings
      if (this.engineType === 'pdfium' && this.isPDFiumAvailable()) {
        // PDFium implementation would go here
        // For now, we'll fall back to PDF.js with a log message
        logger.info('pdf', 'PDFium requested but using PDF.js fallback');
        return await pdfJsService.loadDocument(url, id);
      } else {
        return await pdfJsService.loadDocument(url, id);
      }
    } catch (error) {
      logger.error('pdf', 'Error loading PDF:', error);
      throw error;
    }
  }
}

export default new PDFService();