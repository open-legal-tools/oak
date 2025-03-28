// store/documentSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Document, DocumentState } from '../types/document.types';
import { v4 as uuidv4 } from 'uuid';

// Add this interface for the updateDocument action
interface UpdateDocumentPayload {
  id: string;
  changes: Partial<Document>;
}

// Update sample documents to use the correct path to your actual PDF files
const sampleDocuments: Document[] = [
  {
    id: uuidv4(),
    title: 'Appellant Brief.pdf',
    type: 'pdf',
    url: '/sample-documents/appellant-brief.pdf', // Correct path with folder
    dateAdded: new Date().toISOString(),
    favorite: false
  },
  {
    id: uuidv4(),
    title: 'Appellee Brief.pdf',
    type: 'pdf',
    url: '/sample-documents/appellee-brief.pdf', // Correct path with folder
    dateAdded: new Date(Date.now() - 86400000).toISOString(),
    favorite: true
  },
  {
    id: uuidv4(),
    title: 'Transcript.pdf',
    type: 'pdf',
    url: '/sample-documents/transcript.pdf', // Correct path with folder
    dateAdded: new Date(Date.now() - 172800000).toISOString(),
    favorite: false
  }
];

const initialState: DocumentState = {
  documents: sampleDocuments,
  loading: false,
  error: null,
  currentDocument: sampleDocuments.length > 0 ? sampleDocuments[0].id : null
};

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {
    addDocument: (state, action: PayloadAction<Omit<Document, 'id' | 'dateAdded'>>) => {
      const newDocument: Document = {
        ...action.payload,
        id: uuidv4(),
        dateAdded: new Date().toISOString(),
      };
      state.documents.push(newDocument);
    },
    setCurrentDocument: (state, action: PayloadAction<string>) => {
      console.log('Setting current document:', action.payload);
      state.currentDocument = action.payload;
      // Update lastOpened timestamp
      const document = state.documents.find(doc => doc.id === action.payload);
      if (document) {
        document.lastOpened = new Date().toISOString();
      }
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const document = state.documents.find(doc => doc.id === action.payload);
      if (document) {
        document.favorite = !document.favorite;
      }
    },
    removeDocument: (state, action: PayloadAction<string>) => {
      state.documents = state.documents.filter(doc => doc.id !== action.payload);
      if (state.currentDocument === action.payload) {
        state.currentDocument = null;
      }
    },
    reorderDocuments: (state, action: PayloadAction<{ sourceIndex: number, targetIndex: number }>) => {
      const { sourceIndex, targetIndex } = action.payload;
      
      if (sourceIndex >= 0 && sourceIndex < state.documents.length && 
          targetIndex >= 0 && targetIndex < state.documents.length) {
        const [removed] = state.documents.splice(sourceIndex, 1);
        state.documents.splice(targetIndex, 0, removed);
      }
    },
    clearSampleDocuments: (state) => {
      state.documents = [];
      state.currentDocument = null;
    },
    restoreSampleDocuments: (state) => {
      state.documents = sampleDocuments;
      state.currentDocument = sampleDocuments.length > 0 ? sampleDocuments[0].id : null;
    },
    // Add this new reducer for updating documents
    updateDocument: (state, action: PayloadAction<UpdateDocumentPayload>) => {
      const { id, changes } = action.payload;
      const documentIndex = state.documents.findIndex(doc => doc.id === id);
      
      if (documentIndex !== -1) {
        state.documents[documentIndex] = {
          ...state.documents[documentIndex],
          ...changes
        };
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setCurrentDocument, (state, action) => {
      console.log('[Redux] Setting current document:', action.payload);
      console.log('[Redux] All documents:', state.documents);
      state.currentDocument = action.payload;
    });
  }
});

export const { 
  addDocument, 
  setCurrentDocument, 
  toggleFavorite, 
  removeDocument,
  reorderDocuments,
  clearSampleDocuments,
  restoreSampleDocuments,
  updateDocument
} = documentSlice.actions;

export default documentSlice.reducer;