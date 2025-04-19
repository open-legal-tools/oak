import React, { useEffect } from 'react';
import { logger } from '../../utils/logger';

export const DOMInspector = () => {
  useEffect(() => {
    const checkElements = () => {
      const goldenLayoutContainer = document.getElementById('golden-layout-container');
      const viewerElements = document.querySelectorAll('.document-viewer');
      
      logger.group('dom', 'DOM Inspector');
      logger.debug('dom', 'Golden Layout container exists:', !!goldenLayoutContainer);
      logger.debug('dom', 'Golden Layout container dimensions:', 
        goldenLayoutContainer?.getBoundingClientRect());
      logger.debug('dom', 'DocumentViewer instances:', viewerElements.length);
      viewerElements.forEach(el => logger.debug('dom', 'Viewer node:', el));
      logger.groupEnd();
    };
    
    const interval = setInterval(checkElements, 2000);
    return () => clearInterval(interval);
  }, []);

  return null;
}; 