import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useSpring, animated } from 'react-spring';
import { Document } from '../../types/document.types';
import { NativeTypes } from 'react-dnd-html5-backend';
import { useDispatch, useSelector } from 'react-redux';
import { updateDocument, removeDocument, setCurrentDocument } from '../../store/documentSlice';
import { RootState } from '../../store';
import { useLayout } from '../../hooks/useLayout';
import { store } from '../../store';
import { validateDocumentType } from '../../utils/documentValidation';
import { toast } from 'react-toastify';

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

interface FileDropItem {
  files: File[];
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
    hover(item: DragItem, _monitor) {
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
    drop: (_item: unknown, monitor) => {
      if (setDropTargetId) {
        setDropTargetId(null);
      }
      
      // Handle file drops
      if (monitor.getItemType() === NativeTypes.FILE) {
        const item = monitor.getItem() as FileDropItem;
        if (item.files && item.files.length > 0) {
          handleFileDrop(item.files[0]);
        }
      }
    },
    hover: (_item: unknown, monitor) => {
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
    const validationResult = validateDocumentType(file);

    if (!validationResult.isValid) {
      toast.error(validationResult.error);
      return;
    }

    if (onFileDropped) {
      onFileDropped(file, document.id);
    } else {
      const fileUrl = URL.createObjectURL(file);
      
      dispatch(updateDocument({
        id: document.id,
        changes: {
          title: file.name,
          url: fileUrl,
          type: validationResult.type
        }
      }));

      toast.success('Document updated successfully');
    }
  };
  
  // Combine drag and drop refs
  const combinedRef = useCallback((node: HTMLLIElement | null) => {
    if (node) {
      drag(drop(fileDrop(node)));
    }
  }, [drag, drop, fileDrop]);
  
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
    
    // Set active state with animation
    setActive(true);
    
    // Use the correct value for dispatch
    dispatch(setCurrentDocument(document.id));
    
    setTimeout(() => {
      // Find a viewer pane (not a nav pane)
      // Filter out nav panes first
      const viewerPanes = panes.filter(p => !p.id.includes('nav'));
      
      if (viewerPanes.length > 0) {
        // Use the first viewer pane
        const targetPane = viewerPanes[0];
        console.log(`Setting document ${document.id} in viewer pane ${targetPane.id}`);
        dispatch({ type: 'layout/setDocumentInPane', payload: { paneId: targetPane.id, documentId: document.id } });
      } else {
        // Fallback - look for pane-1 which is the default viewer
        console.log(`Looking for default pane-1`);
        dispatch({ type: 'layout/setDocumentInPane', payload: { paneId: 'pane-1', documentId: document.id } });
      }
      
      setActive(false);
    }, 300);
  };

  return (
    <animated.li 
      ref={combinedRef}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`document-item group ${isActive ? 'active' : ''} relative p-3 border-b cursor-pointer`}
      style={combinedStyle}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow min-w-0">
          <span className={`document-type-icon flex items-center justify-center rounded-sm p-1 ${typeInfo.color}`} title={`${typeInfo.label} Document`}>
            {typeInfo.icon}
          </span>
          <span className="ml-2 truncate">{document.title}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Remove document button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (document.id) {
                // Call parent handler to remove document
                dispatch(removeDocument(document.id));
              }
            }}
            className="text-gray-400 hover:text-red-500"
            title="Remove document"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18"></path>
              <path d="M6 6l12 12"></path>
            </svg>
          </button>
          
          {/* Drag handle */}
          <div className="drag-handle cursor-grab active:cursor-grabbing" title="Drag to reorder">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="6" r="1"></circle>
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="18" r="1"></circle>
              <circle cx="15" cy="6" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="18" r="1"></circle>
            </svg>
          </div>
        </div>
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