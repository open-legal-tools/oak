import React from 'react';

const PDFLoadingState = ({ message = 'Loading PDF document...' }) => {
  return (
    <div className="pdf-loading">
      <p>{message}</p>
      <div className="loading-spinner"></div>
    </div>
  );
};

export default PDFLoadingState; 