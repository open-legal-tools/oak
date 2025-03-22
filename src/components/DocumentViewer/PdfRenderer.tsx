// components/DocumentViewer/PdfRenderer.tsx
import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

interface PdfRendererProps {
  document: {
    id: string;
    url: string;
    type: string;
    // Add other required document properties
  };
}

const PdfRenderer: React.FC<PdfRendererProps> = ({ document }) => {
  console.log('[PdfRenderer] Mounted with document:', document.id);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<pdfjs.PDFWorker | null>(null);

  // Initialize the PDF.js worker
  useEffect(() => {
    workerRef.current = new pdfjs.PDFWorker();
    return () => {
      workerRef.current?.destroy();
      workerRef.current = null;
    };
  }, []);

  // Load the PDF document
  useEffect(() => {
    let isMounted = true;
    let loadingTask: pdfjs.PDFDocumentLoadingTask | null = null;
    const controller = new AbortController();
    
    const loadDocument = async () => {
      try {
        console.log(`Attempting to load PDF from: ${document.url}`);
        
        // For sample PDFs in the public folder, use absolute URL
        const documentUrl = document.url.startsWith('/') 
          ? `${window.location.origin}${document.url}`  // Make it absolute
          : document.url; // This might be a blob URL for uploaded files
        
        console.log(`Resolved URL for PDF fetch: ${documentUrl}`);
        console.log(`URL type: ${typeof documentUrl}, length: ${documentUrl.length}`);
        console.log(`Document object before fetch:`, {
          id: document.id,
          url: document.url,
          resolved: documentUrl,
          type: document.type
        });
        
        // First fetch the PDF as an ArrayBuffer
        const response = await fetch(documentUrl, { signal: controller.signal }).catch(err => {
          console.error('Fetch failed:', err);
          return null;  // Return null if fetch fails
        });

        if (response) {
          console.log(`Fetch response:`, {
            ok: response.ok, 
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries([...response.headers.entries()])
          });
        }
        
        if (!response || !response.ok) {
          throw new Error(`Failed to fetch PDF: ${response ? response.status : 'Fetch failed'}`);
        }
        
        const pdfData = await response.arrayBuffer();
        
        // Load the PDF using the binary data
        loadingTask = pdfjs.getDocument({
          data: pdfData,
          worker: workerRef.current || undefined
        });
        const pdf = await loadingTask.promise;
        
        if (isMounted) {
          console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
          setPdfDocument(pdf);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (isMounted) {
          setError(`Failed to load PDF: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    };
    
    loadDocument().catch(console.error);
    
    return () => {
      isMounted = false;
      if (loadingTask) {
        loadingTask.destroy();
      }
      controller.abort();
    };
  }, [document.url, workerRef.current]);

  // Render the current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument) return;
      
      try {
        // TEMPORARY: Always render first page for debugging
        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 1.0 });
        const canvas = canvasRef.current;
        
        if (!canvas) {
          console.error('Canvas element not found!');
          return;
        }

        console.log('Rendering page to canvas:', {
          dimensions: { width: viewport.width, height: viewport.height }
        });

        const context = canvas.getContext('2d');
        if (!context) {
          console.error('Failed to get canvas context!');
          return;
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        if (canvas) {
          console.log('Canvas element details:', {
            width: canvas.width,
            height: canvas.height,
            offsetWidth: canvas.offsetWidth, 
            offsetHeight: canvas.offsetHeight,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
            style: canvas.style.cssText
          });
        }

      } catch (err) {
        console.error('[PDF] Render error:', err);
        setError(`Render failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    renderPage().catch(console.error);
  }, [pdfDocument]);

  useEffect(() => {
    console.log('PDF URL verification:', {
      url: document.url,
      valid: document.url.startsWith('blob:') || document.url.startsWith('http')
    });
    
    fetch(document.url)
      .then(response => console.log('PDF fetch response:', response.status))
      .catch(error => console.error('PDF fetch failed:', error));
  }, [document.url]);

  // Add render debug
  console.log('[PdfRenderer] Rendering document URL:', document.url);

  return (
    <div className="pdf-renderer">
      <button 
        onClick={() => console.log('Force re-render')}
        style={{ position: 'absolute', top: 10, right: 10 }}
      >
        Debug Render
      </button>
      {error ? (
        <div className="error-message p-4 text-red-500">{error}</div>
      ) : (
        <>
          <canvas 
            ref={canvasRef} 
            className="pdf-canvas"
            style={{ border: '1px solid #ddd' }}
          />
          {!pdfDocument && <div className="loading">Loading PDF...</div>}
        </>
      )}
    </div>
  );
};

export default PdfRenderer;