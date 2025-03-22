// components/Layout/Pane.tsx
import React, { useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DocumentViewer from '../DocumentViewer';

interface PaneProps {
  id: string;
  onDocumentDrop: (docId: string, paneId: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  children?: React.ReactNode;
}

const Pane: React.FC<PaneProps> = ({ 
  id, 
  onDocumentDrop,
  isFocused,
  onFocus,
  children 
}) => {
  const paneRef = useRef<HTMLDivElement>(null);
  const { documentId } = useSelector((state: RootState) => 
    state.workspace.panes.find(p => p.id === id) || { documentId: null }
  );
  
  const [{ isOver }, drop] = useDrop({
    accept: 'DOCUMENT',
    drop: (item: { id: string }) => {
      onDocumentDrop(item.id, id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Focus the pane when isFocused changes
  useEffect(() => {
    if (isFocused && paneRef.current) {
      paneRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div 
      ref={(node) => {
        // Combine refs from React and react-dnd
        drop(node);
        paneRef.current = node;
      }}
      className={`pane ${isOver ? 'bg-blue-50' : ''} ${isFocused ? 'pane-focused' : ''}`}
      tabIndex={0} // Make focusable
      onFocus={onFocus}
      role="region"
      aria-label={`Document pane ${id}`}
    >
      {documentId ? (
        // If we have a document assigned, render the DocumentViewer
        <DocumentViewer documentId={documentId} paneId={id} />
      ) : (
        // Empty state
        <div className="empty-pane">
          <p>Drag a document here or use keyboard to assign</p>
        </div>
      )}
      {children}
    </div>
  );
};

export default Pane;