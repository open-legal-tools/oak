import React from 'react';

interface SimplePdfViewerProps {
  url: string;
  title: string;
}

const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({ url, title }) => {
  // Convert relative URLs to absolute
  const absoluteUrl = url.startsWith('/') 
    ? `${window.location.origin}${url}`
    : url;
    
  return (
    <div className="simple-pdf-viewer">
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h3 className="font-medium text-lg mb-2">Viewing: {title}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Using browser's built-in PDF viewer
        </p>
        <div className="border rounded overflow-hidden" style={{ height: '70vh' }}>
          <iframe
            src={absoluteUrl}
            title={title}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePdfViewer; 