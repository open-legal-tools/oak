// App.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import FileUploader from './components/DocumentNavigator/FileUploader';
import DocumentList from './components/DocumentNavigator/DocumentList';
import DocumentViewer from './components/DocumentViewer';
import { LayoutInspector } from './components/Debug/LayoutInspector';
import { DocumentRenderDebug } from './components/Debug/DocumentRenderDebug';
import { ReduxActionTracker } from './components/Debug/ReduxActionTracker';

const App: React.FC = () => {
  const { currentDocument } = useSelector((state: RootState) => state.documents);

  useEffect(() => {
    const checkContainer = () => {
      const container = document.getElementById('golden-layout-container');
      console.log('Golden Layout container:', container);
      if (container) {
        console.log('Container dimensions:', {
          width: container.offsetWidth,
          height: container.offsetHeight,
          top: container.offsetTop
        });
      }
    };
    
    checkContainer();
    window.addEventListener('resize', checkContainer);
    return () => window.removeEventListener('resize', checkContainer);
  }, []);

  return (
    <div className="app-container">
      {/* Document Navigator */}
      <div className="document-navigator">
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <FileUploader />
        <DocumentList />
      </div>

      {/* Main Workspace */}
      <div className="main-workspace">
        {/* Persistent Header */}
        <header className="h-12 bg-white border-b flex items-center px-4 z-50">
          <h1 className="text-lg font-medium">Oak Document Viewer</h1>
          <div className="ml-auto flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">Zoom In</button>
            <button className="p-2 hover:bg-gray-100 rounded">Zoom Out</button>
          </div>
        </header>

        {/* Golden Layout Container */}
        <div 
          id="golden-layout-container" 
          className="golden-layout-wrapper"
          style={{ 
            height: 'calc(100vh - 4rem - 3rem)', // Adjust for header height
            position: 'relative',
            zIndex: 1
          }}
        >
          <button 
            onClick={() => console.log('Golden Layout Debug:', layout)}
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              zIndex: 1000,
              padding: '8px',
              background: 'red',
              color: 'white'
            }}
          >
            Layout Debug
          </button>
        </div>
      </div>

      {/* Debug Components */}
      <LayoutInspector />
      <DocumentRenderDebug />
      {/* <DOMInspector /> */}
      <ReduxActionTracker />
    </div>
  );
};

export default App;