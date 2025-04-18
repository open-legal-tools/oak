import React, { useEffect } from 'react';
import useZoom from '../../hooks/useZoom';
import usePDFStore from '../../hooks/usePDFStore';

const PDFControls = ({ onZoomChange }) => {
  const { handleZoomIn, handleZoomOut, handleZoomReset } = useZoom();
  const { numPages, scale } = usePDFStore();

  const handleZoomInClick = () => {
    const newScale = scale * 1.2;
    onZoomChange?.(newScale);
    handleZoomIn();
  };

  const handleZoomOutClick = () => {
    const newScale = scale / 1.2;
    onZoomChange?.(newScale);
    handleZoomOut();
  };

  const handleZoomResetClick = () => {
    onZoomChange?.(1.0);
    handleZoomReset();
  };

  // Keyboard shortcuts for zooming
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault();
            handleZoomInClick();
            break;
          case '-':
            e.preventDefault();
            handleZoomOutClick();
            break;
          case '0':
            e.preventDefault();
            handleZoomResetClick();
            break;
          default:
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomInClick, handleZoomOutClick, handleZoomResetClick]);

  return (
    <div className="pdf-controls">
      <div className="zoom-controls">
        <button 
          onClick={handleZoomOutClick} 
          className="zoom-button" 
          title="Zoom Out (Ctrl+-)"
          aria-label="Zoom Out"
        >
          −
        </button>
        
        <button
          onClick={handleZoomResetClick}
          className="zoom-button zoom-reset"
          title="Reset Zoom (Ctrl+0)"
          aria-label="Reset Zoom"
        >
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
        </button>
        
        <button 
          onClick={handleZoomInClick} 
          className="zoom-button" 
          title="Zoom In (Ctrl++)"
          aria-label="Zoom In"
        >
          +
        </button>
      </div>
      
      <div className="page-info">
        {numPages ? `${numPages} page${numPages !== 1 ? 's' : ''}` : ''}
      </div>
    </div>
  );
};

export default PDFControls; 