// components/DocumentNavigator/index.tsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DocumentList from './DocumentList';
import FileUploader from './FileUploader';
import TestDocumentLoader from './TestDocumentLoader';
import pdfjs from 'pdfjs-dist';

const DocumentNavigator: React.FC = () => {
  const { documents, loading, error } = useSelector((state: RootState) => state.documents);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  return (
    <div className="document-navigator" role="navigation" aria-label="Document navigation">
      <h2>Documents</h2>
      
      <div className="document-actions">
        <FileUploader />
        <TestDocumentLoader />
      </div>
      
      {loading && <div className="loading">Loading documents...</div>}
      {error && <div className="error">{error}</div>}
      
      <DocumentList documents={documents} />
    </div>
  );
};

export default DocumentNavigator;