// components/DocumentViewer/ViewerToolbar.tsx
import React, { useState } from 'react';

interface ViewerToolbarProps {
  documentTitle: string;
  currentZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  documentTitle,
  currentZoom,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  const [showFullTitle, setShowFullTitle] = useState(false);
  
  // Calculate truncated title
  const truncatedTitle = documentTitle.length > 30 
    ? `${documentTitle.slice(0, 30)}...` 
    : documentTitle;
  
  return (
    <div className="viewer-toolbar flex items-center justify-between p-2 border-b bg-white shadow-sm">
      <div className="document-title-container flex items-center">
        {/* Document Icon */}
        <div className="icon w-6 h-6 mr-2 flex-shrink-0">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Document Title */}
        <div 
          className="document-title text-sm font-medium max-w-md"
          onMouseEnter={() => setShowFullTitle(true)}
          onMouseLeave={() => setShowFullTitle(false)}
        >
          {showFullTitle ? (
            <div className="absolute bg-white p-2 border shadow-md rounded z-10">
              {documentTitle}
            </div>
          ) : (
            truncatedTitle
          )}
        </div>
      </div>
      
      {/* Toolbar Controls */}
      <div className="controls flex items-center space-x-4">
        {/* Zoom Controls */}
        <div className="zoom-controls flex items-center space-x-1">
          <button 
            onClick={onZoomOut}
            className="p-1 rounded hover:bg-gray-100 text-gray-700"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button 
            onClick={onZoomReset}
            className="px-2 py-1 text-xs rounded hover:bg-gray-100 border text-gray-700"
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            {Math.round(currentZoom * 100)}%
          </button>
          <button 
            onClick={onZoomIn}
            className="p-1 rounded hover:bg-gray-100 text-gray-700"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ViewerToolbar);