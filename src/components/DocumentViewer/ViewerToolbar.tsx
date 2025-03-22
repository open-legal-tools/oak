// components/DocumentViewer/ViewerToolbar.tsx
import React from 'react';

interface ViewerToolbarProps {
  title: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  title,
  currentPage,
  totalPages,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset
}) => {
  return (
    <div className="viewer-toolbar">
      <div className="title">{title}</div>
      <div className="spacer"></div>
      <div className="zoom-controls">
        <button 
          onClick={onZoomOut}
          className="btn-secondary p-1"
          aria-label="Zoom out"
        >
          -
        </button>
        <span className="mx-2">{Math.round(scale * 100)}%</span>
        <button 
          onClick={onZoomIn}
          className="btn-secondary p-1"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          onClick={onZoomReset}
          className="btn-secondary ml-2 px-2"
          aria-label="Reset zoom"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ViewerToolbar;