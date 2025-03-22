import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { ScreenReaderAnnouncerProvider } from './components/a11y/ScreenReaderAnnouncer';
import { store } from './store';
import './index.css';
import * as pdfjs from 'pdfjs-dist';
import 'golden-layout/dist/css/goldenlayout-base.css';
import './styles/components/golden-layout.css';

// PDF.js worker configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.js',
  import.meta.url
).toString();

console.log('PDF worker configured:', {
  workerSrc: pdfjs.GlobalWorkerOptions.workerSrc,
  workerPortType: typeof pdfjs.GlobalWorkerOptions.workerPort
});

// Add error handling
pdfjs.GlobalWorkerOptions.workerHandler = {
  postMessage: (message) => {
    try {
      worker.postMessage(message);
    } catch (e) {
      console.error('PDF worker error:', e);
    }
  },
  terminate: () => worker.terminate()
};

// Render with proper error boundaries, Redux, and accessibility support
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <ScreenReaderAnnouncerProvider>
          <DndProvider backend={HTML5Backend}>
            <App />
          </DndProvider>
        </ScreenReaderAnnouncerProvider>
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);