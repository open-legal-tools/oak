// App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import LayoutWithErrorBoundary from './components/Layout/index';
import { DebugPanel } from './components/Debug';
import ErrorBoundary from './ErrorBoundary';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <div className="h-screen w-screen flex flex-col">
          {/* Simple header */}
          <header className="w-full bg-gray-800 text-white p-4">
            <h1 className="text-xl font-bold">Oak Document Viewer</h1>
          </header>
          
          {/* Main layout area */}
          <div className="flex-1 overflow-hidden">
            <ErrorBoundary>
              <LayoutWithErrorBoundary />
            </ErrorBoundary>
          </div>
          
          {/* Debug Panel */}
          <DebugPanel />
        </div>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;