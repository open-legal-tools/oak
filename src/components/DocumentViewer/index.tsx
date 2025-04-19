// components/DocumentViewer/index.tsx
import React, { useState, useContext, useRef, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import PdfViewer from './PdfViewer';
import ViewErrorBoundary from '../ErrorBoundary/ViewErrorBoundary';
import { LayoutContext } from '../../contexts/LayoutContext';
import { DocumentViewerState } from '../../types/layout.types';
import { logger } from '../../utils/logger';

interface DocumentViewerProps {
  documentId?: string;
  paneId: string;
  type?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documentId, paneId, type }) => {
  // Use memoized selector to prevent unnecessary re-renders
  const document = useSelector((state: RootState) => 
    documentId ? state.documents.documents.find(doc => doc.id === documentId) : null
  );
  
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  // Track document state updates to prevent excessive updates
  const lastUpdateRef = useRef<number>(0);
  const lastDocumentIdRef = useRef<string | undefined>(documentId);
  
  // Use useContext with a fallback to prevent errors
  const layoutContext = useContext(LayoutContext) || {
    updateDocumentState: (paneId: string, state: DocumentViewerState) => {
      logger.debug('document', `Update document state called with no context (pane: ${paneId})`);
    }
  };

  // Log document changes for debugging
  useEffect(() => {
    if (documentId !== lastDocumentIdRef.current) {
      logger.debug('document', `Document changed in viewer: ${lastDocumentIdRef.current} -> ${documentId}`);
      lastDocumentIdRef.current = documentId;
      
      // Reset any error state when document changes
      if (error) {
        setError(null);
      }
    }
  }, [documentId, error]);
  
  // Safely memoize the update function to prevent recreation on each render
  const updateDocumentState = useMemo(() => {
    return layoutContext.updateDocumentState;
  }, [layoutContext]);

  // Log the status for debugging
  useEffect(() => {
    console.log("DocumentViewer state:", {
      documentId,
      hasDocument: !!document,
      paneId
    });
  }, [documentId, document, paneId]);
  
  if (!documentId || !document) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No document selected (pane: {paneId})
      </div>
    );
  }

  const handleError = (error: Error) => {
    logger.error('document', 'Document viewer error:', error);
    setError(error);
  };

  const handleLoadProgress = (progress: number) => {
    // Only update state if value has changed significantly
    if (Math.abs(progress - loadProgress) > 0.1) {
      setLoadProgress(progress);
    }
    
    // Only update document state in very specific circumstances to prevent loops
    const now = Date.now();
    if (layoutContext && 
        progress === 1 && // Only at complete 
        now - lastUpdateRef.current > 2000) { // With a long delay
      
      lastUpdateRef.current = now;
      logger.debug('document', `Updating document state for pane ${paneId}, progress: ${progress}`);
      
      // Update with a properly formatted DocumentViewerState object
      updateDocumentState(paneId, {
        pageNumber: 1,  // Default to first page 
        zoomLevel: 1,   // Default zoom level
        scrollPosition: {
          x: 0,
          y: 0
        }
      });
    }
  };

  // Log what document we're trying to display
  logger.debug('document', `Rendering document: ${document.id} - ${document.title} (${document.type})`);

  return (
    <ViewErrorBoundary viewId={paneId} onError={handleError}>
      <div className="document-viewer h-full">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500 p-4 text-center">
              <p className="font-semibold mb-2">Error loading document</p>
              <p className="text-sm">{error.message}</p>
            </div>
          </div>
        ) : document.type === 'pdf' ? (
          <PdfViewer
            key={`pdf-${document.id}`} // Add key to force remount on document change
            document={document}
            onLoadProgress={handleLoadProgress}
            onError={handleError}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              Unsupported document type: {document.type}
            </p>
          </div>
        )}
      </div>
    </ViewErrorBoundary>
  );
};

export default DocumentViewer;