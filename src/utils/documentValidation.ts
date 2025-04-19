import { Document } from '../types/document.types';
import { store } from '../store';

export interface DocumentValidationResult {
  isValid: boolean;
  type?: Document['type'];
  error?: string;
}

const VALID_DOCUMENT_TYPES = ['pdf', 'docx', 'txt'] as const;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_PANELS = 3; // Maximum number of panels allowed

export function validateDocumentType(file: File): DocumentValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    };
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  // Check if file has an extension
  if (!fileExtension) {
    return {
      isValid: false,
      error: 'File must have an extension'
    };
  }

  // Check if extension is valid
  if (!VALID_DOCUMENT_TYPES.includes(fileExtension as Document['type'])) {
    return {
      isValid: false,
      error: `Invalid file type. Supported types are: ${VALID_DOCUMENT_TYPES.join(', ')}`
    };
  }

  return {
    isValid: true,
    type: fileExtension as Document['type']
  };
}

export function isValidDocumentType(type: string): type is Document['type'] {
  return VALID_DOCUMENT_TYPES.includes(type as Document['type']);
}

export const getFileTypeFromMimeType = (mimeType: string): Document['type'] | undefined => {
  const mimeTypeMap: Record<string, Document['type']> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt'
  };
  
  return mimeTypeMap[mimeType];
};

/**
 * Checks if a document exists in the store
 */
export const documentExists = (documentId: string): boolean => {
  const state = store.getState();
  return state.documents.documents.some(doc => doc.id === documentId);
};

/**
 * Gets a document by ID from the store
 */
export const getDocumentById = (documentId: string): Document | undefined => {
  const state = store.getState();
  return state.documents.documents.find(doc => doc.id === documentId);
};

/**
 * Validates that panels are within limits
 */
export const validatePanelCount = (): boolean => {
  const state = store.getState();
  return (state.layout?.panes?.length || 0) <= MAX_PANELS;
};

/**
 * Logs validation results to console
 */
export const logDocumentValidation = (): void => {
  const state = store.getState();
  const panelCount = state.layout?.panes?.length || 0;
  const documentCount = state.documents.documents.length;

  console.log(`
    %c[DOCUMENT VALIDATION]%c
    Panels: ${panelCount}/${MAX_PANELS}
    Documents: ${documentCount}
    Current Document: ${state.documents.currentDocument}
  `, 
  'font-weight:bold; color:#2563eb;', 
  'color:black;'
  );
};

// Perform early validation at module load time
setTimeout(() => {
  logDocumentValidation();
}, 1000);