import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { PaneConfig, DocumentViewerState } from '../types/layout.types';

interface LayoutState {
  panes: PaneConfig[];
  focusedPane: string | null;
  maxPanes: number;
  snapToGrid: boolean;
  gridSize: number;
}

const initialState: LayoutState = {
  panes: [],
  focusedPane: null,
  maxPanes: 12, // Reasonable default that can be changed
  snapToGrid: true,
  gridSize: 20
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    addPane: (state, action: PayloadAction<{ paneId: string }>) => {
      state.panes.push({
        id: action.payload.paneId,
        documentId: undefined,
        documentState: undefined,
        type: 'document'
      });
    },
    removePane: (state, action: PayloadAction<{ paneId: string }>) => {
      state.panes = state.panes.filter(pane => pane.id !== action.payload.paneId);
    },
    setDocumentInPane: (state, action: PayloadAction<{ paneId: string, documentId: string }>) => {
      console.log(`Redux - Setting document ${action.payload.documentId} in pane ${action.payload.paneId}`);
      
      const pane = state.panes.find(p => p.id === action.payload.paneId);
      if (pane) {
        console.log(`Found pane ${action.payload.paneId}, updating documentId`);
        pane.documentId = action.payload.documentId;
      } else {
        console.warn(`Pane ${action.payload.paneId} not found, will create it`);
        
        // If the pane isn't found, add it (with validation)
        if (action.payload.paneId && typeof action.payload.paneId === 'string' && 
            action.payload.paneId !== 'undefined' && action.payload.paneId !== 'null') {
          
          state.panes.push({
            id: action.payload.paneId,
            documentId: action.payload.documentId,
            type: 'document'
          });
          console.log(`Created new pane ${action.payload.paneId} for document ${action.payload.documentId}`);
        }
      }
    },
    clearDocumentFromPane: (state, action: PayloadAction<{ paneId: string }>) => {
      const pane = state.panes.find(p => p.id === action.payload.paneId);
      if (pane) {
        pane.documentId = undefined;
      }
    },
    updateDocumentState: (state, action: PayloadAction<{ 
      paneId: string;
      state: DocumentViewerState 
    }>) => {
      const pane = state.panes.find(p => p.id === action.payload.paneId);
      if (pane) {
        pane.documentState = action.payload.state;
      }
    },
    setFocusedPane: (state, action: PayloadAction<{ paneId: string }>) => {
      state.focusedPane = action.payload.paneId;
    },
    swapDocuments: (state, action: PayloadAction<{ 
      sourcePaneId: string, 
      targetPaneId: string 
    }>) => {
      const sourcePane = state.panes.find(p => p.id === action.payload.sourcePaneId);
      const targetPane = state.panes.find(p => p.id === action.payload.targetPaneId);
      
      if (sourcePane && targetPane) {
        const tempDoc = sourcePane.documentId;
        const tempState = sourcePane.documentState;
        
        sourcePane.documentId = targetPane.documentId;
        sourcePane.documentState = targetPane.documentState;
        
        targetPane.documentId = tempDoc;
        targetPane.documentState = tempState;
      }
    }
  }
});

export const { addPane, removePane, setDocumentInPane, clearDocumentFromPane, updateDocumentState, setFocusedPane, swapDocuments } = layoutSlice.actions;
export default layoutSlice.reducer;

export const selectPanes = (state: RootState) => {
  return state.layout.panes;
}; 