import React, { useState } from 'react';
import { useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import { useDispatch } from 'react-redux';
import { addDocument } from '../../store/documentSlice';
import { useSpring, animated } from 'react-spring';

interface FileDropZoneProps {
  children: React.ReactNode;
  className?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ children, className = '' }) => {
  const [isUploading, setIsUploading] = useState(false);
  const dispatch = useDispatch();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    drop: (item: { files: File[] }) => {
      handleFiles(item.files);
      return { files: item.files };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Animation for drop zone
  const dropAnimation = useSpring({
    borderColor: isOver && canDrop ? '#3b82f6' : 'transparent',
    backgroundColor: isOver && canDrop ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
    scale: isOver && canDrop ? 1.02 : 1,
    config: { tension: 300, friction: 20 }
  });

  const handleFiles = (files: FileList | File[]) => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    // Process each file
    Array.from(files).forEach(file => {
      // Only accept PDF, DOCX, and TXT files
      if (!file.name.match(/\.(pdf|docx|txt)$/i)) {
        console.warn(`Unsupported file type: ${file.name}`);
        return;
      }
      
      // Create a local URL for the file
      const url = URL.createObjectURL(file);
      
      // Determine file type
      let type: 'pdf' | 'docx' | 'txt' = 'pdf';
      if (file.name.endsWith('.docx')) type = 'docx';
      if (file.name.endsWith('.txt')) type = 'txt';
      
      // Add document to store
      dispatch(addDocument({
        title: file.name,
        type,
        url
      }));
    });
    
    setIsUploading(false);
  };

  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <animated.div
      ref={drop}
      onDrop={handleNativeDrop}
      className={`${className} relative border-2 border-dashed rounded p-4`}
      style={dropAnimation}
    >
      {children}
      {isUploading && (
        <div className="upload-overlay">
          <span>Uploading...</span>
        </div>
      )}
    </animated.div>
  );
};

export default FileDropZone; 