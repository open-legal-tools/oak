import React, { useRef, useEffect } from 'react';
import { useDragDrop } from './DragDropProvider';

interface DraggableProps {
  id: string;
  type: string;
  data: any;
  children: React.ReactNode;
  className?: string;
}

const Draggable: React.FC<DraggableProps> = ({ 
  id, 
  type, 
  data, 
  children, 
  className = '' 
}) => {
  const { startDrag, endDrag, isDragging, draggedItem } = useDragDrop();
  const elementRef = useRef<HTMLDivElement>(null);
  const isBeingDragged = isDragging && draggedItem?.id === id;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      id,
      type,
      data
    }));
    
    // Set drag image (optional)
    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(
        elementRef.current,
        e.clientX - rect.left,
        e.clientY - rect.top
      );
    }
    
    // Update drag state
    startDrag({ id, type, data });
  };

  const handleDragEnd = () => {
    endDrag();
  };

  return (
    <div
      ref={elementRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`${className} ${isBeingDragged ? 'opacity-50' : ''}`}
      data-draggable-id={id}
      data-draggable-type={type}
    >
      {children}
    </div>
  );
};

export default Draggable; 