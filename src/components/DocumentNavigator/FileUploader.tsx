// components/DocumentNavigator/FileUploader.tsx
import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addDocument } from '../../store/documentSlice';
import FileDropZone from './FileDropZone';

const FileUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // For each file, create a document
    Array.from(files).forEach(file => {
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
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <FileDropZone className="file-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.txt"
        multiple
        className="hidden"
      />
      <button 
        className="btn w-full"
        onClick={handleUploadClick}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload Document'}
      </button>
      <div className="mt-2 text-center text-sm text-gray-500">
        or drag files here
      </div>
    </FileDropZone>
  );
};

export default FileUploader;