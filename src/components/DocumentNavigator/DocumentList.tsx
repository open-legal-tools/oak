import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentDocument, toggleFavorite, removeDocument, reorderDocuments, clearSampleDocuments, restoreSampleDocuments, updateDocument } from '../../store/documentSlice';
import DocumentItem from './DocumentItem';
import FileUploader from './FileUploader';
import TestDocumentLoader from './TestDocumentLoader';
import { useTransition, animated } from 'react-spring';
import { Document } from '../../types/document.types';

interface DocumentListProps {
  documents: Document[]; // Using the imported Document type
}

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  const { currentDocument } = useSelector((state: RootState) => state.documents);
  const dispatch = useDispatch();
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Add transitions for list items
  const transitions = useTransition(
    documents.map((doc, i) => ({ ...doc, index: i })),
    {
      keys: item => item.index,  // Changed from item.id to item.index to match our augmented type
      from: { opacity: 0, transform: 'translate3d(0,-20px,0)' },
      enter: { opacity: 1, transform: 'translate3d(0,0px,0)' },
      leave: { opacity: 0, transform: 'translate3d(0,-20px,0)' },
      config: { mass: 1, tension: 280, friction: 26 },
    }
  );

  const handleDocumentClick = (id: string) => {
    // Set current document in store
    dispatch(setCurrentDocument(id));
    
    // Find a pane to display it in
    const state = store.getState();
    const { focusedPane } = state.layout;
    const { panes } = state.layout;
    
    console.log("Document clicked:", id);
    console.log("Available panes:", panes);
    
    setTimeout(() => {
      try {
        // If there's a focused pane, use that, otherwise find the first available one
        let targetPaneId = focusedPane;
        if (!targetPaneId) {
          const emptyPane = panes.find(p => !p.documentId);
          const targetPane = emptyPane || panes[0];
          if (targetPane) {
            targetPaneId = targetPane.id;
          }
        }
        
        if (targetPaneId) {
          console.log("Assigning document to pane:", targetPaneId);
          // Direct Redux dispatch to avoid dependency on layoutManager
          dispatch({ type: 'layout/setDocumentInPane', payload: { paneId: targetPaneId, documentId: id } });
        }
      } catch (error) {
        console.error("Error handling document click:", error);
      }
    }, 100);
  };

  const handleFavoriteToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavorite(id));
  };

  const handleRemoveDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeDocument(id));
  };

  const moveDocument = useCallback((dragIndex: number, hoverIndex: number) => {
    dispatch(reorderDocuments({ sourceIndex: dragIndex, targetIndex: hoverIndex }));
  }, [dispatch]);

  const handleToggleSamples = () => {
    if (documents.some(doc => doc.url.startsWith('/samples/'))) {
      dispatch(clearSampleDocuments());
    } else {
      dispatch(restoreSampleDocuments());
    }
  };

  const handleFileDroppedOnDocument = (file: File, documentId: string) => {
    const fileUrl = URL.createObjectURL(file);
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    
    dispatch(updateDocument({
      id: documentId,
      changes: {
        title: file.name,
        url: fileUrl,
        type: fileType === 'pdf' ? 'pdf' : 
              fileType === 'docx' ? 'docx' : 
              fileType === 'txt' ? 'txt' : 'txt' // Default to txt instead of other
      }
    }));
  };

  return (
    <div className="document-list p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Your Documents</h2>
        <div className="flex space-x-2">
          <TestDocumentLoader />
          <button 
            onClick={handleToggleSamples}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            {documents.some(doc => doc.url.startsWith('/samples/')) 
              ? 'Clear Samples' 
              : 'Load Samples'}
          </button>
        </div>
      </div>
      
      {/* File Uploader */}
      <div className="mb-4">
        <FileUploader />
      </div>
      
      {documents.length === 0 ? (
        <div className="bg-gray-100 rounded p-8 text-center">
          <p className="text-gray-500 italic mb-4">No documents yet</p>
          <p className="text-sm text-gray-400">Upload a document or load sample documents</p>
        </div>
      ) : (
        <ul className="bg-white rounded border border-gray-200 divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
          {transitions((style, item) => (
            <animated.div style={style}>
              <DocumentItem
                document={item}
                isActive={item.id === currentDocument}
                index={item.index}
                onDocumentClick={() => handleDocumentClick(item.id)}
                moveDocument={moveDocument}
                isDropTarget={dropTargetId === item.id}
                setDropTargetId={setDropTargetId}
                onFileDropped={handleFileDroppedOnDocument}
              />
            </animated.div>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentList;