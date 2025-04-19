// components/DocumentViewer/PageNavigator.tsx
import React, { useState } from 'react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onJumpToPage: (page: number) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onJumpToPage
}) => {
  const [jumpToPage, setJumpToPage] = useState('');

  const handleJumpToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      onJumpToPage(pageNum);
      setJumpToPage('');
    }
  };

  // Generate page number options for quick navigation
  const pageOptions = [];
  
  // Add first few pages
  for (let i = 1; i <= Math.min(3, totalPages); i++) {
    pageOptions.push(i);
  }
  
  // Add pages around current page
  if (currentPage > 3) {
    if (currentPage > 4) {
      pageOptions.push(-1); // Ellipsis
    }
    pageOptions.push(currentPage - 1);
    pageOptions.push(currentPage);
    pageOptions.push(currentPage + 1);
  }
  
  // Add last few pages
  if (currentPage < totalPages - 2) {
    if (currentPage < totalPages - 3) {
      pageOptions.push(-1); // Ellipsis
    }
    for (let i = Math.max(currentPage + 2, totalPages - 2); i <= totalPages; i++) {
      pageOptions.push(i);
    }
  }
  
  // Filter out duplicates and sort
  const uniquePageOptions = Array.from(new Set(pageOptions)).sort((a, b) => a - b);

  return (
    <div className="page-navigator flex items-center p-2 bg-white border-b">
      <div className="flex items-center">
        <button
          onClick={onPrevPage}
          disabled={currentPage <= 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous Page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Page selector */}
        <div className="inline-flex items-center mx-2">
          {uniquePageOptions.map((page, index) => 
            page === -1 ? (
              <span key={`ellipsis-${index}`} className="mx-1">...</span>
            ) : (
              <button
                key={page}
                onClick={() => onJumpToPage(page)}
                className={`w-8 h-8 mx-0.5 rounded ${
                  page === currentPage 
                    ? 'bg-blue-500 text-white' 
                    : 'hover:bg-gray-100'
                }`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            )
          )}
        </div>
        
        <button
          onClick={onNextPage}
          disabled={currentPage >= totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next Page"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Jump to page form */}
      <form onSubmit={handleJumpToPage} className="ml-auto flex items-center">
        <label htmlFor="jump-to-page" className="text-sm mr-2">
          Page:
        </label>
        <input
          id="jump-to-page"
          type="text"
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          className="w-16 px-2 py-1 border rounded text-sm"
          placeholder={`1-${totalPages}`}
          aria-label={`Jump to page (1-${totalPages})`}
        />
        <button
          type="submit"
          className="ml-2 px-2 py-1 bg-gray-100 border rounded text-sm hover:bg-gray-200"
        >
          Go
        </button>
      </form>
    </div>
  );
};

export default React.memo(PageNavigator);