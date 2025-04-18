import React from 'react';

const PDFErrorState = ({ error, onDismiss, onReload }) => {
  return (
    <div className="pdf-error">
      <h3>Error Loading PDF</h3>
      <p>{error}</p>
      <div className="error-actions">
        <button 
          onClick={onReload}
          className="error-action-button"
        >
          Reload Page
        </button>
        <button 
          onClick={onDismiss}
          className="error-action-button"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default PDFErrorState; 