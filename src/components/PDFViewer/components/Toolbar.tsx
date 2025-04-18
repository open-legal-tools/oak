import React from 'react';
import usePDFStore from '../hooks/usePDFStore';

interface ToolbarProps {
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
}

const Toolbar = ({
  className = '',
  onZoomIn,
  onZoomOut,
  onZoomReset
}: ToolbarProps) => {
  const { scale, totalPages } = usePDFStore();
  
  const handleZoomIn = () => {
    onZoomIn?.();
  };
  
  const handleZoomOut = () => {
    onZoomOut?.();
  };
  
  const handleZoomReset = () => {
    onZoomReset?.();
  };
  
  return (
    <div className={`pdf-toolbar ${className}`}>
      <div className="zoom-controls">
        <button
          onClick={handleZoomOut}
          className="zoom-button"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
        
        <span className="zoom-level" title="Current Zoom Level">
          {Math.round(scale * 100)}%
        </span>
        
        <button
          onClick={handleZoomReset}
          className="zoom-button"
          title="Reset Zoom"
          aria-label="Reset Zoom"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4 4V10H10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 20V14H14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 4L14 10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 20L10 14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        <button
          onClick={handleZoomIn}
          className="zoom-button"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
      </div>
      
      <div className="page-info">
        {totalPages > 0 ? (
          <span>
            {totalPages} page{totalPages !== 1 ? 's' : ''}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default Toolbar; 