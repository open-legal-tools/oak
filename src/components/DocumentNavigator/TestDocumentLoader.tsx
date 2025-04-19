// components/DocumentNavigator/TestDocumentLoader.tsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { loadLocalTestDocuments } from '../../services/fileSystemService';
import { setDocuments, setError } from '../../store/documentSlice';
import Button from '../common/Button';

const TestDocumentLoader: React.FC = () => {
  const dispatch = useDispatch();
  
  const handleLoadTestDocuments = async () => {
    try {
      const documents = await loadLocalTestDocuments();
      dispatch(setDocuments(documents));
    } catch (error) {
      console.error('Error loading test documents:', error);
      dispatch(setError('Failed to load test documents'));
    }
  };
  
  return (
    <Button 
      onClick={handleLoadTestDocuments}
      className="test-document-loader"
      aria-label="Load test documents"
    >
      Load Test Documents
    </Button>
  );
};

export default TestDocumentLoader;