import React, { useState } from 'react';
import { useDragDrop } from './DragDropProvider';

interface DropZoneProps {
  id: string;
  acceptTypes: string[];
  onDrop: (item: any) => void;
  children: React.ReactNode;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  id,
  acceptTypes,
  onDrop,
  children,
  className = ''
}) => {
  const { setDropTarget, dropTarget } = useDragDrop();
  const [isOver, setIsOver] = useState(false);
  
  const isActive = dropTarget === id;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Check if the dragged item is of an accepted type
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (acceptTypes.includes(parsedData.type)) {
          setIsOver(true);
          setDropTarget(id);
          return;
        }
      } catch (err) {
        console.error('Error parsing drag data:', err);
      }
    }
    
    // If we get here, the item is not acceptable
    e.dataTransfer.dropEffect = 'none';
  };

  const handleDragLeave = () => {
    setIsOver(false);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        if (acceptTypes.includes(parsedData.type)) {
          onDrop(parsedData);
        }
      } catch (err) {
        console.error('Error parsing drop data:', err);
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isOver ? 'drop-zone-active' : ''}`}
      data-dropzone-id={id}
    >
      {children}
    </div>
  );
};

export default DropZone; 