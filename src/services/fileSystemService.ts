// services/fileSystemService.ts
import { Document } from '../types/document.types';
import { v4 as uuidv4 } from 'uuid';

export const uploadDocument = async (file: File): Promise<Document> => {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      
      // Determine document type from file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      let type: 'pdf' | 'docx' | 'txt' | 'image' = 'pdf';
      
      if (['docx', 'doc'].includes(fileExtension)) {
        type = 'docx';
      } else if (['txt', 'text'].includes(fileExtension)) {
        type = 'txt';
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
        type = 'image';
      }
      
      const document: Document = {
        id: uuidv4(),
        title: file.name,
        type,
        url,
        metadata: {
          size: file.size,
          lastModified: file.lastModified,
          mimeType: file.type
        }
      };
      
      resolve(document);
    } catch (error) {
      reject(error);
    }
  });
};

export const loadLocalTestDocuments = async (): Promise<Document[]> => {
  // This would normally make API calls, but for testing we'll return hardcoded data
  return [
    {
      id: 'test-doc-1',
      title: 'Appellant Brief',
      type: 'pdf',
      url: '/test-documents/appellant-brief.pdf',
    },
    {
      id: 'test-doc-2',
      title: 'Appellee Brief',
      type: 'pdf',
      url: '/test-documents/appellee-brief.pdf',
    },
    {
      id: 'test-doc-3',
      title: 'Transcript Vol. 1',
      type: 'pdf',
      url: '/test-documents/transcript.pdf',
    }
  ];
};