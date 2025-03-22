import React from 'react';
import { useAppSelector } from '../../store';

export const DocumentRenderDebug = () => {
  const documents = useAppSelector(state => state.documents.documents);
  const layout = useAppSelector(state => state.layout.panes);

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 shadow-lg rounded-lg text-xs">
      <h3 className="font-bold mb-2">Render Debug</h3>
      <div className="space-y-2">
        <p>Loaded Documents: {documents.length}</p>
        <p>Active Panes: {layout.length}</p>
        <p>Visible Components: {
          documents.filter(d => layout.some(p => p.documentId === d.id)).length
        }</p>
      </div>
    </div>
  );
}; 