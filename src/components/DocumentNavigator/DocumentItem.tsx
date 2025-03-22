import React, { useRef, useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useSpring, animated } from 'react-spring';
import { Document } from '../../types/document.types';
import { NativeTypes } from 'react-dnd-html5-backend';
import { useDispatch, useSelector } from 'react-redux';
import { updateDocument } from '../../store/documentSlice';
import { RootState } from '../../store';
import { useLayout } from '../../contexts/LayoutContext';
import { setCurrentDocument } from '../../store/documentSlice';
import { store } from '../../store';

interface DocumentItemProps {
  document: Document;
  isActive: boolean;
  index: number;
  onDocumentClick: () => void;
  moveDocument: (dragIndex: number, hoverIndex: number) => void;
  isDropTarget?: boolean;
  setDropTargetId?: (id: string | null) => void;
  onFileDropped?: (file: File, documentId: string) => void;
}

// Define the drag item type
const ITEM_TYPE = 'document';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({
  document,
  isActive,
  index,
  onDocumentClick,
  moveDocument,
  isDropTarget,
  setDropTargetId,
  onFileDropped
}) => {
  const ref = useRef<HTMLLIElement>(null);
  const [hovered, setHovered] = React.useState(false);
  const [isFileDropTarget, setIsFileDropTarget] = useState(false);
  const [showPaneSelector, setShowPaneSelector] = useState(false);
  const [active, setActive] = useState(false);
  const dispatch = useDispatch();
  const { panes } = useSelector((state: RootState) => state.layout);
  const { addDocumentToPane } = useLayout();
  
  // Set up drag
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { type: ITEM_TYPE, id: document.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Set up drop
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Move the item
      moveDocument(dragIndex, hoverIndex);
      
      // Update the index for the dragged item
      item.index = hoverIndex;
    },
  });
  
  // Add file drop handling
  const [{ isFileOver }, fileDrop] = useDrop({
    accept: [NativeTypes.FILE],
    drop: (item: any, monitor) => {
      if (setDropTargetId) {
        setDropTargetId(null);
      }
      
      // Handle file drops
      if (monitor.getItemType() === NativeTypes.FILE) {
        const files = monitor.getItem().files;
        if (files && files.length > 0) {
          handleFileDrop(files[0]);
        }
      }
    },
    hover: (item: any, monitor) => {
      // Only handle file hover, document hover is handled by existing code
      if (monitor.getItemType() === NativeTypes.FILE) {
        setIsFileDropTarget(true);
      }
    },
    collect: (monitor) => ({
      isFileOver: monitor.isOver() && monitor.getItemType() === NativeTypes.FILE,
    }),
  });
  
  // Reset file drop target when not hovering
  useEffect(() => {
    if (!isFileOver) {
      setIsFileDropTarget(false);
    }
  }, [isFileOver]);
  
  // Handle file drop
  const handleFileDrop = (file: File) => {
    if (onFileDropped) {
      onFileDropped(file, document.id);
    } else {
      // Default implementation if no handler provided
      const fileUrl = URL.createObjectURL(file);
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Update the existing document with the new file
      dispatch(updateDocument({
        id: document.id,
        changes: {
          title: file.name,
          url: fileUrl,
          type: fileType === 'pdf' ? 'pdf' : 
                fileType === 'docx' ? 'docx' :
                fileType === 'txt' ? 'txt' : 'other'
        }
      }));
    }
  };
  
  // Combine drag and drop refs
  const combinedRef = (node: HTMLLIElement | null) => {
    ref.current = node;
    drag(drop(fileDrop(node)));
  };
  
  // Animation for drag state
  const dragAnimation = useSpring({
    opacity: isDragging ? 0.5 : 1,
    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : '0 0px 0px rgba(0,0,0,0)',
    config: { tension: 300, friction: 20 }
  });
  
  // Animation for hover state
  const hoverAnimation = useSpring({
    backgroundColor: hovered && !isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
    config: { tension: 300, friction: 20 }
  });
  
  // Animation for drop target
  const dropTargetAnimation = useSpring({
    borderColor: isDropTarget ? '#3b82f6' : 'transparent',
    borderWidth: isDropTarget ? '2px' : '1px',
    borderStyle: 'dashed',
    config: { tension: 300, friction: 20 }
  });
  
  // Add file drop animation
  const fileDropAnimation = useSpring({
    borderColor: isFileDropTarget ? '#10b981' : 'transparent',
    backgroundColor: isFileDropTarget ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
    config: { tension: 300, friction: 20 }
  });
  
  // Combine all animations
  const combinedStyle = {
    ...dragAnimation,
    ...hoverAnimation,
    ...dropTargetAnimation,
    ...fileDropAnimation
  };

  // Helper function to get document type icon and color
  const getDocumentTypeInfo = (type: string) => {
    switch (type) {
      case 'pdf':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          ),
          color: 'bg-blue-100 text-blue-700',
          label: 'PDF'
        };
      case 'docx':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          ),
          color: 'bg-indigo-100 text-indigo-700',
          label: 'DOCX'
        };
      case 'txt':
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          ),
          color: 'bg-gray-100 text-gray-700',
          label: 'TXT'
        };
      default:
        return {
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          ),
          color: 'bg-purple-100 text-purple-700',
          label: 'DOC'
        };
    }
  };

  const typeInfo = getDocumentTypeInfo(document.type);
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPaneSelector(!showPaneSelector);
  };
  
  const handleSelectPane = (paneId: string) => {
    addDocumentToPane(document.id, paneId);
    setShowPaneSelector(false);
  };

  // Update the click handler
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const { currentDocument } = store.getState().documents;
    
    if (active || currentDocument === document.id) return;

    console.log('Document clicked:', document.id);
    setActive(true);
    dispatch(setCurrentDocument(document.id));
    
    setTimeout(() => setActive(false), 300);
  };

  return (
    <animated.li 
      ref={combinedRef}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`document-item group ${isActive ? 'active' : ''} relative`}
      style={combinedStyle}
    >
      <div className="flex items-center flex-grow min-w-0">
        <span className={`document-type-icon flex items-center justify-center rounded-sm p-1 ${typeInfo.color}`} title={`${typeInfo.label} Document`}>
          {typeInfo.icon}
        </span>
        <span className="ml-2 truncate">{document.title}</span>
      </div>
      
      <div className="drag-handle ml-1" title="Drag to reorder">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="6" r="1"></circle>
          <circle cx="9" cy="12" r="1"></circle>
          <circle cx="9" cy="18" r="1"></circle>
          <circle cx="15" cy="6" r="1"></circle>
          <circle cx="15" cy="12" r="1"></circle>
          <circle cx="15" cy="18" r="1"></circle>
        </svg>
      </div>
      
      {/* Pane selector dropdown */}
      {showPaneSelector && (
        <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded z-50 border">
          <div className="p-2 text-sm font-medium border-b">Open in pane:</div>
          <ul>
            {panes.map(pane => (
              <li 
                key={pane.id} 
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPane(pane.id);
                }}
              >
                Pane {panes.findIndex(p => p.id === pane.id) + 1}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Optional: Add a visual indicator when file is being dragged over */}
      {isFileDropTarget && (
        <div className="absolute inset-0 border-2 border-green-500 rounded pointer-events-none z-10 flex items-center justify-center bg-green-50 bg-opacity-30">
          <span className="text-green-600 font-medium">Drop to replace</span>
        </div>
      )}
    </animated.li>
  );
};

export default DocumentItem;