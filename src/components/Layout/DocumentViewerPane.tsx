import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import DocumentViewer from '../DocumentViewer';
import { useLayout } from '../../hooks/useLayout';
import { clearDocumentFromPane } from '../../store/layoutSlice';

interface DocumentViewerPaneProps {
  paneId: string;
}

const DocumentViewerPane: React.FC<DocumentViewerPaneProps> = ({ paneId }) => {
  const dispatch = useDispatch();
  const { canRemovePane, removeExistingPane } = useLayout();
  
  // Get the document ID for this pane
  const pane = useSelector((state: RootState) => 
    state.layout.panes.find(p => p.id === paneId)
  );
  
  const documentId = pane?.documentId || null;
  
  // Get the document from the store
  const document = useSelector((state: RootState) => 
    documentId ? state.documents.documents.find(doc => doc.id === documentId) : null
  );
  
  const handleCloseDocument = () => {
    dispatch(clearDocumentFromPane({ paneId }));
  };
  
  const handleClosePane = () => {
    if (canRemovePane) {
      removeExistingPane(paneId);
    }
  };
  
  return (
    <div className="document-viewer-pane h-full flex flex-col">
      <div className="pane-header flex justify-between items-center p-2 bg-gray-100 border-b">
        <div className="pane-title font-medium">
          {document ? document.title : 'No Document Selected'}
        </div>
        <div className="pane-actions flex space-x-2">
          {document && (
            <button 
              onClick={handleCloseDocument}
              className="text-gray-500 hover:text-gray-700"
              title="Close document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
          {canRemovePane && (
            <button 
              onClick={handleClosePane}
              className="text-gray-500 hover:text-gray-700"
              title="Close pane"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="pane-content flex-grow overflow-auto">
        {document ? (
          <DocumentViewer documentId={document.id} paneId={paneId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a document from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewerPane; 