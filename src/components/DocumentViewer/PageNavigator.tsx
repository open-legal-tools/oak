// components/DocumentViewer/PageNavigator.tsx
import React from 'react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="page-navigator">
      <button 
        onClick={handlePrevPage}
        disabled={currentPage <= 1}
        className="btn-secondary px-2"
        aria-label="Previous page"
      >
        ←
      </button>
      
      <div className="page-input-container">
        <span>Page</span>
        <input 
          type="number" 
          min={1} 
          max={totalPages} 
          value={currentPage}
          onChange={handlePageInputChange}
          aria-label="Current page"
        />
        <span>of {totalPages}</span>
      </div>
      
      <button 
        onClick={handleNextPage}
        disabled={currentPage >= totalPages}
        className="btn-secondary px-2"
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
};

export default PageNavigator;