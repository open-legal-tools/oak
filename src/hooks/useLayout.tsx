import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { layoutManager } from '../services/LayoutManager';
import { setDocumentInPane } from '../store/layoutSlice';

export function useLayout() {
  const dispatch = useDispatch();
  
  // Add document to pane using the layoutManager
  const addDocumentToPane = useCallback((documentId: string, paneId: string) => {
    // Only update the layout model, which will update Redux internally
    layoutManager.setDocumentInPane(documentId, paneId);
  }, []);
  
  // Split a pane
  const splitPane = useCallback((paneId: string, direction: 'row' | 'column') => {
    return layoutManager.splitPane(paneId, direction);
  }, []);
  
  // Reset the layout
  const resetLayout = useCallback(() => {
    layoutManager.resetToDefaultLayout();
  }, []);
  
  return {
    addDocumentToPane,
    splitPane,
    resetLayout
  };
} 