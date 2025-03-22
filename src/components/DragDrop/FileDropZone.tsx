import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addDocument } from '../../store/documentSlice';

interface FileDropZoneProps {
  children: React.ReactNode;
  className?: string;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ children, className = '' }) => {
  const [isOver, setIsOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dispatch = useDispatch();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Only accept files
    if (e.dataTransfer.types.includes('Files')) {
      setIsOver(true);
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    
    const files = e.dataTransfer.files;
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isOver ? 'file-drop-active' : ''} ${isUploading ? 'uploading' : ''}`}
    >
      {children}
      {isUploading && (
        <div className="upload-overlay">
          <span>Uploading...</span>
        </div>
      )}
    </div>
  );
};

export default FileDropZone; 