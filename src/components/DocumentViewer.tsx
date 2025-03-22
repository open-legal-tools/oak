import React, { useCallback } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { DocumentState } from '../store/layoutSlice';

interface DocumentViewerProps {
  paneId: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ paneId }) => {
  const { updateDocumentState } = useLayout();

  const handleViewStateChange = useCallback((state: DocumentState) => {
    updateDocumentState(paneId, state);
  }, [paneId, updateDocumentState]);

  return (
    <div className="document-viewer">
      {/* PDF.js integration will go here */}
    </div>
  );
};

export default DocumentViewer; 