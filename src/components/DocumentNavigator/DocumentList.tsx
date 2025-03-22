import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setCurrentDocument, toggleFavorite, removeDocument, reorderDocuments, clearSampleDocuments, restoreSampleDocuments, updateDocument } from '../../store/documentSlice';
import DocumentItem from './DocumentItem';
import { useTransition, animated } from 'react-spring';

interface DocumentListProps {
  documents: Document[]; // Ensure this type matches the actual document type used in your state
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
    dispatch(setCurrentDocument(id));
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
              fileType === 'docx' ? 'docx' : 'other'
      }
    }));
  };

  return (
    <div className="document-list">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium">Your Documents</h2>
        <button 
          onClick={handleToggleSamples}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          {documents.some(doc => doc.url.startsWith('/samples/')) 
            ? 'Clear Samples' 
            : 'Load Samples'}
        </button>
      </div>
      {documents.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">No documents yet</p>
      ) : (
        <ul className="space-y-1">
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