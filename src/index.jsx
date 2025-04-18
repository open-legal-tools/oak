import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log("main.jsx: Script loaded"); // Check 1: Is the script running?

const rootElement = document.getElementById('root');
console.log("main.jsx: Found root element:", rootElement); // Check 2: Did it find the div?

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("main.jsx: React app rendered"); // Check 3: Did React attempt to render?
} else {
  console.error("main.jsx: Root element not found!"); // Check 4: If the div wasn't found
}