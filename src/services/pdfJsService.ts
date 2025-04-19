// src/services/pdfJsService.ts
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/display/api';
import { logger } from '../utils/logger';
import { PDFDocument, PDFPage, PDFTextItem, PDFOutlineNode, PDFMetadata } from './pdfService';

// Configure PDF.js worker (needed for text extraction and other operations)
// We can't use import.meta.url with regular URLs in Vite, so handle it differently
if (typeof window !== 'undefined') {
  // For browser environments, use CDN for worker
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
  
  // Initialize PDF.js with custom params
  logger.info('pdf', 'PDF.js worker configured from CDN');
} else {
  // For Node.js environments if needed
  const pdfjsWorker = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();
}

/**
 * PDF.js implementation of the PDFPage interface
 */
class PDFJsPage implements PDFPage {
  private page: pdfjs.PDFPageProxy;
  
  constructor(page: pdfjs.PDFPageProxy) {
    this.page = page;
  }
  
  get pageNumber(): number {
    return this.page.pageNumber;
  }
  
  get width(): number {
    const viewport = this.page.getViewport({ scale: 1 });
    return viewport.width;
  }
  
  get height(): number {
    const viewport = this.page.getViewport({ scale: 1 });
    return viewport.height;
  }
  
  get rotation(): number {
    return this.page.rotate;
  }
  
  async render(canvas: HTMLCanvasElement, scale: number): Promise<void> {
    try {
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Canvas 2D context is not available');
      }
      
      // Get viewport with provided scale
      const viewport = this.page.getViewport({ scale });
      
      // Handle high DPI displays
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Set canvas dimensions
      const width = viewport.width;
      const height = viewport.height;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale context for retina displays
      context.save();
      context.scale(pixelRatio, pixelRatio);
      
      // Perform the render
      const renderTask = this.page.render({
        canvasContext: context,
        viewport
      });
      
      // Wait for render to complete
      await renderTask.promise;
      
      // Restore canvas context
      context.restore();
      
      logger.debug('pdf', `Page ${this.pageNumber} rendered successfully at scale ${scale}`);
    } catch (error) {
      logger.error('pdf', `Error rendering page ${this.pageNumber}:`, error);
      throw new Error(`Failed to render page ${this.pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async getText(): Promise<string> {
    const textContent = await this.page.getTextContent();
    return textContent.items
      .map((item: TextItem) => item.str)
      .join(' ');
  }
  
  async getTextContent(): Promise<PDFTextItem[]> {
    const textContent = await this.page.getTextContent();
    const viewport = this.page.getViewport({ scale: 1 });
    
    return textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item: TextItem) => {
        // PDF.js provides coordinates in a different format than we want
        // so we need to transform them
        const transform = pdfjs.Util.transform(
          viewport.transform,
          item.transform
        );
        
        return {
          text: item.str,
          x: transform[4],
          y: transform[5],
          width: item.width || 0,
          height: item.height || 0
        };
      });
  }
}

/**
 * PDF.js implementation of the PDFDocument interface
 */
class PDFJsDocument implements PDFDocument {
  private document: pdfjs.PDFDocumentProxy;
  private _id: string;
  private _url: string;
  
  constructor(document: pdfjs.PDFDocumentProxy, url: string, id: string) {
    this.document = document;
    this._url = url;
    this._id = id;
  }
  
  get id(): string {
    return this._id;
  }
  
  get url(): string {
    return this._url;
  }
  
  get totalPages(): number {
    return this.document.numPages;
  }
  
  async getPage(pageNumber: number): Promise<PDFPage> {
    try {
      const page = await this.document.getPage(pageNumber);
      return new PDFJsPage(page);
    } catch (error) {
      logger.error('pdf', `Error getting page ${pageNumber}:`, error);
      throw error;
    }
  }
  
  async getOutline(): Promise<PDFOutlineNode[]> {
    try {
      const outline = await this.document.getOutline();
      if (!outline) return [];
      
      // Convert PDF.js outline to our format
      const convertOutlineNode = async (node: any): Promise<PDFOutlineNode> => {
        let pageNumber = 1;
        
        try {
          // Attempt to get destination
          if (node.dest) {
            const dest = await this.document.getDestination(node.dest);
            if (dest) {
              const pageRef = await this.document.getPageIndex(dest[0]);
              pageNumber = pageRef + 1; // PDF.js uses 0-based indexing
            }
          } else if (node.url) {
            // Handle URL-based destinations
            // These are typically external links
            pageNumber = 1; // Default to first page for external links
          }
        } catch (error) {
          logger.warn('pdf', `Error processing outline node destination:`, error);
        }
        
        return {
          title: node.title,
          pageNumber,
          children: await Promise.all((node.items || []).map(convertOutlineNode))
        };
      };
      
      return Promise.all(outline.map(convertOutlineNode));
    } catch (error) {
      logger.error('pdf', 'Error getting outline:', error);
      return [];
    }
  }
  
  async getMetadata(): Promise<PDFMetadata> {
    try {
      const metadata = await this.document.getMetadata();
      return {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        creationDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined,
        modificationDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : undefined
      };
    } catch (error) {
      logger.error('pdf', 'Error getting metadata:', error);
      return {};
    }
  }
  
  async close(): Promise<void> {
    try {
      await this.document.destroy();
    } catch (error) {
      logger.error('pdf', 'Error closing document:', error);
    }
  }
}

/**
 * PDF.js service implementation
 */
class PDFJsService {
  async loadDocument(url: string, id: string): Promise<PDFDocument> {
    try {
      console.log("pdfJsService.loadDocument called with URL:", url);
      
      // Ensure URL is valid and absolute
      let documentUrl = url;
      
      // Handle relative URLs (starting with /)
      if (url.startsWith('/')) {
        documentUrl = `${window.location.origin}${url}`;
      }
      // Handle relative URLs without leading /
      else if (!url.match(/^(https?:\/\/|blob:|data:)/)) {
        documentUrl = `${window.location.origin}/${url}`;
      }
      
      console.log(`Loading PDF from absolute URL: ${documentUrl}`);
      logger.info('pdf', `Loading PDF from: ${documentUrl}`);
      
      // Create loading task with custom params
      const loadingTask = pdfjs.getDocument({
        url: documentUrl,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/standard_fonts/',
        disableRange: false,
        disableStream: false,
        disableAutoFetch: false
      });
      
      // Wait for document to load with timeout
      console.log("Waiting for PDF document to load...");
      const document = await Promise.race([
        loadingTask.promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("PDF loading timeout")), 10000))
      ]) as pdfjs.PDFDocumentProxy;
      
      console.log(`Successfully loaded PDF, page count: ${document.numPages}`);
      logger.info('pdf', `Successfully loaded PDF, page count: ${document.numPages}`);
      
      return new PDFJsDocument(document, url, id);
    } catch (error) {
      console.error(`Error loading document from ${url}:`, error);
      logger.error('pdf', `Error loading document from ${url}:`, error);
      
      // Provide more context in the error message for debugging
      if (error instanceof Error) {
        throw new Error(`Failed to load PDF from ${url}: ${error.message}`);
      } else {
        throw new Error(`Failed to load PDF from ${url}: Unknown error`);
      }
    }
  }
}

export default new PDFJsService();