import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logger } from '../../utils/logger';
import { layoutManager } from '../../services/LayoutManager';

export const LayoutInspector: React.FC = () => {
  const panes = useSelector((state: RootState) => state.layout.panes);
  const documents = useSelector((state: RootState) => state.documents.documents);
  const [modelJson, setModelJson] = useState<string>('');
  
  useEffect(() => {
    const inspectLayout = () => {
      try {
        // Get the layout model
        const model = layoutManager.getModel();
        
        if (model) {
          // Save the model to JSON for display
          const json = model.toJson();
          setModelJson(JSON.stringify(json, null, 2));
          
          // Log detailed information
          logger.groupCollapsed('layout', 'Layout Inspector');
          logger.debug('layout', 'FlexLayout model:', model);
          logger.debug('layout', 'Redux panes:', panes);
          logger.debug('layout', 'Documents:', documents);
          
          // Count tabs and tabsets
          let tabCount = 0;
          let tabsetCount = 0;
          let rowCount = 0;
          
          model.visitNodes((node) => {
            if (node.getType() === 'tab') tabCount++;
            if (node.getType() === 'tabset') tabsetCount++;
            if (node.getType() === 'row') rowCount++;
            return true;
          });
          
          logger.debug('layout', 'Layout stats:', { 
            tabs: tabCount, 
            tabsets: tabsetCount,
            rows: rowCount
          });
          
          logger.groupEnd();
        }
      } catch (error) {
        logger.error('layout', 'Layout inspector error:', error);
      }
    };
    
    // Run immediately and then every 2 seconds
    inspectLayout();
    const interval = setInterval(inspectLayout, 2000);
    
    return () => {
      clearInterval(interval);
    };
  }, [panes, documents]);
  
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold mb-1">Layout Structure</h3>
        <div className="text-xs overflow-x-auto bg-gray-100 p-2 rounded">
          <div className="flex">
            <div className="mr-4">
              <div><strong>Tabs:</strong> {panes.length}</div>
              <div><strong>Documents:</strong> {documents.length}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-1">Pane Associations</h3>
        <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="pr-2">Pane ID</th>
                <th>Document ID</th>
              </tr>
            </thead>
            <tbody>
              {panes.map((pane) => (
                <tr key={pane.id}>
                  <td className="pr-2">{pane.id}</td>
                  <td>{pane.documentId || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-semibold mb-1 flex justify-between">
          <span>Model JSON</span>
          <button
            className="text-xs text-blue-600 hover:underline"
            onClick={() => layoutManager.resetToDefaultLayout()}
          >
            Reset Layout
          </button>
        </h3>
        <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
          <pre>{modelJson}</pre>
        </div>
      </div>
    </div>
  );
};