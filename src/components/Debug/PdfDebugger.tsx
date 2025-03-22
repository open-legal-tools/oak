import React, { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';

interface PdfDebuggerProps {
  url: string;
}

const PdfDebugger: React.FC<PdfDebuggerProps> = ({ url }) => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const debugPdf = async () => {
      try {
        setStatus('Resolving URL...');
        
        // For sample PDFs in the public folder, use absolute URL
        const documentUrl = url.startsWith('/') 
          ? `${window.location.origin}${url}`
          : url;
        
        setStatus(`Attempting to load PDF from: ${documentUrl}`);
        
        // Try to fetch the file first to check if it exists
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`File not found: ${response.status} ${response.statusText}`);
        }
        
        setStatus('File exists, loading binary data...');
        
        // Get the binary data
        const pdfData = await response.arrayBuffer();
        setStatus(`Loaded ${pdfData.byteLength} bytes of data, parsing with PDF.js...`);
        
        // Now try to load it with PDF.js using binary data
        const loadingTask = pdfjs.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        setStatus(`PDF loaded successfully with ${pdf.numPages} pages`);
      } catch (err) {
        console.error('PDF Debug Error:', err);
        setError(`${err instanceof Error ? err.message : String(err)}`);
        setStatus('Failed');
      }
    };
    
    debugPdf();
  }, [url]);

  return (
    <div className="pdf-debugger p-4 bg-gray-100 rounded mb-4">
      <h3 className="font-bold mb-2">PDF Debugger</h3>
      <p><strong>URL:</strong> {url}</p>
      <p><strong>Status:</strong> {status}</p>
      {error && (
        <div className="error mt-2 p-2 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default PdfDebugger; 