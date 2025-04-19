import React, { useState, ChangeEventHandler } from 'react';

interface PDFControlsProps {
  onZoomChange: (scale: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isActivePane: boolean;
}

const PDFControls = ({
  onZoomChange,
  currentPage,
  totalPages,
  onPageChange,
  isActivePane
}: PDFControlsProps) => {
  const [scale, setScale] = useState(1.0);

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.1, 2.5);
    setScale(newScale);
    onZoomChange(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.1, 0.5);
    setScale(newScale);
    onZoomChange(newScale);
  };

  const handleZoomReset = () => {
    setScale(1.0);
    onZoomChange(1.0);
  };

  const handlePageInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className={`pdf-controls ${isActivePane ? 'active' : ''}`}>
      <div className="page-controls">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          ←
        </button>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={currentPage}
          onChange={handlePageInput}
          aria-label="Current page"
        />
        <span>of {totalPages}</span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          →
        </button>
      </div>
      
      <div className="zoom-controls">
        <button onClick={handleZoomOut} aria-label="Zoom out">-</button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        <button onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button onClick={handleZoomReset} aria-label="Reset zoom">↺</button>
      </div>
    </div>
  );
};

export default PDFControls; 