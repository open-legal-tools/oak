// types/document.types.ts
export interface Document {
    id: string;
    title: string;
    type: 'pdf' | 'docx' | 'txt';
    url: string;
    dateAdded: string;
    lastOpened?: string;
    favorite?: boolean;
}

export interface DocumentState {
    documents: Document[];
    loading: boolean;
    error: string | null;
    currentDocument: string | null;
}