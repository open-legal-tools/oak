import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface DocumentState {
  pageNumber: number;
  zoomLevel: number;
  scrollPosition: number;
}

interface Pane {
  id: string;
  documentId: string | null;
  documentState: DocumentState | null;
}

interface LayoutState {
  panes: Pane[];
  focusedPane: string | null;
}

const initialState: LayoutState = {
  panes: [],
  focusedPane: null
};

const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    addPane: (state, action: PayloadAction<{ paneId: string }>) => {
      state.panes.push({
        id: action.payload.paneId,
        documentId: null,
        documentState: null
      });
    },
    removePane: (state, action: PayloadAction<{ paneId: string }>) => {
      state.panes = state.panes.filter(pane => pane.id !== action.payload.paneId);
    },
    setDocumentInPane: (state, action: PayloadAction<{ paneId: string, documentId: string }>) => {
      const pane = state.panes.find(p => p.id === action.payload.paneId);
      if (pane) {
        pane.documentId = action.payload.documentId;
      }
    },
    clearDocumentFromPane: (state, action: PayloadAction<{ paneId: string }>) => {
      const pane = state.panes.find(p => p.id === action.payload.paneId);
      if (pane) {
        pane.documentId = null;
      }
    },
    updateDocumentState: (state, action: PayloadAction<{ 
      paneId: string;
      state: DocumentState 
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
  console.log('[Redux] Current panes state:', state.layout.panes);
  return state.layout.panes;
}; 