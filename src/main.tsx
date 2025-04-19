import React from 'react';
import ReactDOM from 'react-dom/client';

// Initialize logger settings - IMPORTANT: do this before any other imports
import './utils/loggerInit';

// Initialize document validation - keep this early
import './utils/documentValidation';

import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { ScreenReaderAnnouncerProvider } from './components/a11y/ScreenReaderAnnouncer';
import { store } from './store';
import './index.css';
import * as pdfjs from 'pdfjs-dist';
// Import FlexLayout CSS
import 'flexlayout-react/style/light.css';
// Import toast notifications
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { logger, disableAllLogs, setCategoryEnabled } from './utils/logger';

// PDF.js worker configuration
if (typeof window !== 'undefined') {
  // For browser environments, use CDN or local path
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.min.js';
} else {
  // For Node.js environments if needed
  const pdfjsWorker = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url);
  pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();
}

// Extra safety measure - ensure Redux logs are disabled at startup
setCategoryEnabled('redux', false);
setCategoryEnabled('redux_error', false);

// Disable all logging in production
if (location.hostname !== 'localhost') {
  disableAllLogs();
}

// Render with proper error boundaries, Redux, and accessibility support
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <ScreenReaderAnnouncerProvider>
          <DndProvider backend={HTML5Backend}>
            <App />
            <ToastContainer position="bottom-right" autoClose={3000} />
          </DndProvider>
        </ScreenReaderAnnouncerProvider>
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);