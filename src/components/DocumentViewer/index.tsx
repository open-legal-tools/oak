// components/DocumentViewer/index.tsx
import React, { useState, useEffect } from 'react';
import PdfRenderer from './PdfRenderer';
import ViewerToolbar from './ViewerToolbar';
import PageNavigator from './PageNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useLayout } from '../../contexts/LayoutContext';
// Keep these imports for potential future use, but they won't be used in the component
// import PdfDebugger from '../Debug/PdfDebugger';
// import FileChecker from '../Debug/FileChecker';

interface DocumentViewerProps {
  documentId: string;
  paneId: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ paneId, documentId }) => {
  console.log('[DocumentViewer] Mounted with:', { paneId, documentId });
  const document = useSelector((state: RootState) => 
    state.documents.documents.find(d => d.id === documentId)
  );
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  
  const { updateDocumentState, panes } = useLayout();
  
  // Add state preservation effect
  useEffect(() => {
    return () => {
      // Save state when unmounting
      updateDocumentState(paneId, {
        pageNumber: currentPage,
        zoomLevel: scale,
        scrollPosition: 0 // Add scroll position tracking
      });
    };
  }, [paneId, currentPage, scale]);

  // Restore state when mounted
  useEffect(() => {
    const paneState = panes.find(p => p.id === paneId)?.documentState;
    if (paneState) {
      setCurrentPage(paneState.pageNumber);
      setScale(paneState.zoomLevel);
    }
  }, [paneId]);

  // Add effect to track document changes
  useEffect(() => {
    console.log('DocumentViewer updated - Pane:', paneId, 'Document:', documentId);
    if (documentId && !document) {
      console.warn('Document not found in store:', documentId);
    }
  }, [documentId, document, paneId]);

  // Add props logging
  console.log('[DocumentViewer] Rendering with props:', { paneId, documentId, document });

  // Add state logging
  useEffect(() => {
    console.log('[DocumentViewer] State updated:', { currentPage, scale });
  }, [currentPage, scale]);

  // Add effect to handle document changes
  useEffect(() => {
    if (documentId && !document) {
      console.error('Document mismatch - stored ID:', documentId, 'Actual document:', document);
    }
  }, [documentId, document]);

  // Add effect to log document changes
  useEffect(() => {
    console.log('[DocumentViewer] Document changed:', documentId, document);
  }, [documentId, document]);

  // Add debug effect
  useEffect(() => {
    console.log('[DocumentViewer] Document ID changed:', documentId);
    console.log('[DocumentViewer] Found document:', document);
  }, [documentId, document]);

  // Add proper document loading effect
  useEffect(() => {
    console.log('[DocumentViewer] Active document check:', {
      hasDocument: !!document,
      documentId,
      storeDocuments: useSelector((state: RootState) => state.documents.documents)
    });
  }, [document, documentId]);

  if (!documentId) {
    return <div className="empty-state p-4">No document selected</div>;
  }

  if (!document) {
    return <div className="error-state p-4 text-red-600">Document not found: {documentId}</div>;
  }

  const handleDocumentLoaded = (numPages: number) => {
    setTotalPages(numPages);
    console.log(`Document loaded with ${numPages} pages`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.1, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.1, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  return (
    <div className="document-viewer-container h-full w-full">
      {document.type === 'pdf' ? (
        <PdfRenderer key={documentId} document={document} />
      ) : (
        <div>Unsupported document type: {document.type}</div>
      )}
    </div>
  );
};

export default DocumentViewer;