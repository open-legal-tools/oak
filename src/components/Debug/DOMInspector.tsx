import React, { useEffect } from 'react';

export const DOMInspector = () => {
  useEffect(() => {
    const checkElements = () => {
      const goldenLayoutContainer = document.getElementById('golden-layout-container');
      const viewerElements = document.querySelectorAll('.document-viewer');
      
      console.group('[DOM Inspector]');
      console.log('Golden Layout container exists:', !!goldenLayoutContainer);
      console.log('Golden Layout container dimensions:', 
        goldenLayoutContainer?.getBoundingClientRect());
      console.log('DocumentViewer instances:', viewerElements.length);
      viewerElements.forEach(el => console.log('Viewer node:', el));
      console.groupEnd();
    };
    
    const interval = setInterval(checkElements, 2000);
    return () => clearInterval(interval);
  }, []);

  return null;
}; 