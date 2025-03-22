// src/services/pdfiumService.ts (temporary implementation with PDF.js)
import * as pdfjs from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/display/api';
import { ipcRenderer } from 'electron';

// Set up worker for PDF.js
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface PDFiumDocument {
  getPageCount(): Promise<number>;
  renderPage(pageNumber: number, scale: number): Promise<ImageData>;
  getPageText(pageNumber: number): Promise<string>;
  getDocumentOutline(): Promise<PDFiumOutlineNode[]>;
}

export interface PDFiumOutlineNode {
  title: string;
  pageNumber: number;
  children: PDFiumOutlineNode[];
}

class PDFDocument implements PDFiumDocument {
  private document: pdfjs.PDFDocumentProxy;
  
  constructor(document: pdfjs.PDFDocumentProxy) {
    this.document = document;
  }
  
  async getPageCount(): Promise<number> {
    return this.document.numPages;
  }
  
  async renderPage(pageNumber: number, scale: number): Promise<ImageData> {
    const page = await this.document.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // Render to canvas
    await page.render({
      canvasContext: context as any,
      viewport
    }).promise;
    
    // Return image data
    return context!.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  async getPageText(pageNumber: number): Promise<string> {
    const page = await this.document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    return textContent.items
      .map((item: TextItem) => item.str)
      .join(' ');
  }
  
  async getDocumentOutline(): Promise<PDFiumOutlineNode[]> {
    const outline = await this.document.getOutline();
    if (!outline) return [];
    
    // Convert PDF.js outline to our format
    const convertOutlineNode = async (node: any): Promise<PDFiumOutlineNode> => {
      const dest = await this.document.getDestination(node.dest);
      const pageRef = await this.document.getPageIndex(dest[0]);
      
      return {
        title: node.title,
        pageNumber: pageRef + 1, // PDF.js uses 0-based indexing
        children: await Promise.all((node.items || []).map(convertOutlineNode))
      };
    };
    
    return Promise.all(outline.map(convertOutlineNode));
  }
}

class PDFiumService {
  async loadDocument(path: string): Promise<PDFiumDocument> {
    // For local development, we'll use a data URL or Blob
    // In production with Electron, we'll use the file path directly
    const isElectron = false; // Change this based on your environment detection
    
    let document;
    if (isElectron) {
      // In Electron, we can use the file path directly
      document = await pdfjs.getDocument(path).promise;
    } else {
      // In browser, we need to fetch the file first
      const response = await fetch(path);
      const data = await response.arrayBuffer();
      document = await pdfjs.getDocument(new Uint8Array(data)).promise;
    }
    
    return new PDFDocument(document);
  }
}

export default new PDFiumService();

export interface PdfiumPage {
  width: number;
  height: number;
  pageNumber: number;
}

export interface PdfiumDocument {
  path: string;
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfiumPage>;
  close: () => Promise<void>;
}

export const openDocument = async (path: string): Promise<PdfiumDocument> => {
  // In Electron, we'd use IPC to communicate with the main process
  // where PDFium would be running
  const documentInfo = await ipcRenderer.invoke('pdfium:openDocument', path);
  
  return {
    path,
    numPages: documentInfo.numPages,
    getPage: async (pageNumber: number) => {
      const pageInfo = await ipcRenderer.invoke('pdfium:getPage', path, pageNumber);
      return pageInfo;
    },
    close: async () => {
      await ipcRenderer.invoke('pdfium:closeDocument', path);
    }
  };
};

export const renderPageToCanvas = async (
  document: PdfiumDocument,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void> => {
  // Get page info
  const page = await document.getPage(pageNumber);
  
  // Set canvas dimensions
  canvas.width = page.width * scale;
  canvas.height = page.height * scale;
  
  // Render to canvas
  const imageData = await ipcRenderer.invoke(
    'pdfium:renderPage', 
    document.path, 
    pageNumber, 
    canvas.width, 
    canvas.height
  );
  
  // Draw the image data to canvas
  const ctx = canvas.getContext('2d')!;
  const imgData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  ctx.putImageData(imgData, 0, 0);
};

const isPDFiumAvailable = () => {
  return window.electron && window.electron.isPDFiumAvailable();
};

const DocumentViewer = () => {
  // ...
  return (
    <div>
      {isPDFiumAvailable() ? (
        <PDFiumRenderer {...props} />
      ) : (
        <PdfJsRenderer {...props} />
      )}
    </div>
  );
};