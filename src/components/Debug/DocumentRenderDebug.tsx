// src/components/Debug/DocumentRenderDebug.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logger } from '../../utils/logger';

export const DocumentRenderDebug = () => {
  const documents = useSelector((state: RootState) => state.documents.documents);
  const currentDocumentId = useSelector((state: RootState) => state.documents.currentDocument);
  const layout = useSelector((state: RootState) => state.layout.panes);
  
  // Log document and layout state changes
  useEffect(() => {
    logger.debug('render', 'Documents and layouts updated', {
      loadedDocuments: documents.length,
      activePanes: layout.length,
      visibleComponents: documents.filter(d => layout.some(p => p.documentId === d.id)).length
    });
  }, [documents, layout]);

  return (
    <div className="debug-panel p-4 bg-white rounded shadow text-sm">
      <h3 className="font-bold mb-2">Documents in Store</h3>
      <table className="w-full mb-4 text-left">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1">ID</th>
            <th className="px-2 py-1">Title</th>
            <th className="px-2 py-1">Type</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.id} className={`${doc.id === currentDocumentId ? 'bg-blue-100' : ''}`}>
              <td className="px-2 py-1 font-mono text-xs truncate max-w-[60px]">{doc.id.substring(0, 8)}...</td>
              <td className="px-2 py-1 truncate max-w-[120px]">{doc.title}</td>
              <td className="px-2 py-1">{doc.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h3 className="font-bold mb-2">Layout Panes</h3>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="px-2 py-1">Pane ID</th>
            <th className="px-2 py-1">Document ID</th>
          </tr>
        </thead>
        <tbody>
          {layout.map(pane => (
            <tr key={pane.id}>
              <td className="px-2 py-1">{pane.id}</td>
              <td className="px-2 py-1 font-mono text-xs truncate max-w-[120px]">
                {pane.documentId || 'None'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4">
        <h3 className="font-bold mb-2">Fix Document Association</h3>
        <button 
          onClick={() => {
            // Dispatch action to associate current document with pane
            if (layout.length > 0 && documents.length > 0) {
              const firstPane = layout[0];
              const firstDoc = documents[0];
              
              logger.info('debug', 'Auto-fixing document association', {
                paneId: firstPane.id,
                docId: firstDoc.id
              });
              
              // Dispatch action through global window to avoid import cycle
              const action = {
                type: 'layout/setDocumentInPane',
                payload: { 
                  paneId: firstPane.id, 
                  documentId: firstDoc.id 
                }
              };
              
              // @ts-ignore - Access Redux store through window
              window.__REDUX_STORE__?.dispatch(action);
            }
          }}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Connect Document to Pane
        </button>
      </div>
    </div>
  );
};

export default DocumentRenderDebug;