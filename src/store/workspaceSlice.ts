// store/workspaceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Pane {
  id: string;
  documentId: string | null;
}

interface WorkspaceState {
  panes: Pane[];
  activePaneId: string | null;
}

const initialState: WorkspaceState = {
  panes: [
    { id: 'pane1', documentId: null },
    { id: 'pane2', documentId: null },
    { id: 'pane3', documentId: null }
  ],
  activePaneId: null
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    assignDocumentToPane: (state, action: PayloadAction<{ documentId: string, paneId: string }>) => {
      const { documentId, paneId } = action.payload;
      const paneIndex = state.panes.findIndex(p => p.id === paneId);
      
      if (paneIndex !== -1) {
        state.panes[paneIndex].documentId = documentId;
      }
    },
    setActivePane: (state, action: PayloadAction<string>) => {
      state.activePaneId = action.payload;
    },
    swapPaneDocuments: (state, action: PayloadAction<{ sourcePane: string, targetPane: string }>) => {
      const { sourcePane, targetPane } = action.payload;
      const sourcePaneIndex = state.panes.findIndex(p => p.id === sourcePane);
      const targetPaneIndex = state.panes.findIndex(p => p.id === targetPane);
      
      if (sourcePaneIndex !== -1 && targetPaneIndex !== -1) {
        const temp = state.panes[sourcePaneIndex].documentId;
        state.panes[sourcePaneIndex].documentId = state.panes[targetPaneIndex].documentId;
        state.panes[targetPaneIndex].documentId = temp;
      }
    }
  }
});

export const { assignDocumentToPane, setActivePane, swapPaneDocuments } = workspaceSlice.actions;
export default workspaceSlice.reducer;