import React, { useRef, useEffect } from 'react';
import { Layout } from 'flexlayout-react';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { layoutManager, ComponentTypes, DEFAULT_LAYOUT } from '../../services/LayoutManager';
import DocumentViewer from '../DocumentViewer';
import DocumentList from '../DocumentNavigator/DocumentList';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { logger } from '../../utils/logger';
import { setCurrentDocument } from '../../store/documentSlice';
import { LayoutContext } from '../../contexts/LayoutContext';

// Import CSS for FlexLayout
import 'flexlayout-react/style/light.css';

// Add some custom styles for FlexLayout
const flexLayoutStyles = `
.flexlayout__layout {
  background-color: #f0f0f0;
}
.flexlayout__tabset {
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
}
.flexlayout__tab {
  background-color: white;
  padding: 8px;
}
`;

// Inject the styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = flexLayoutStyles;
  document.head.appendChild(styleElement);
}

/**
 * Factory function to create components for FlexLayout
 */
const factory = (node: any) => {
  try {
    // Get component type safely
    let component;
    try {
      component = node.getComponent();
    } catch (e) {
      // Fallback if getComponent isn't available
      component = node.component || 'unknown';
      logger.warn('layout', 'Failed to get component using getComponent()', e);
    }
    
    // In FlexLayout 0.8.10, getConfig() might be called differently
    let config: Record<string, any> = {};
    try {
      // Try different methods of getting config
      if (typeof node.getConfig === 'function') {
        config = node.getConfig() || {};
      } else if (node.config) {
        config = node.config;
      }
    } catch (error) {
      logger.error('layout', 'Error getting node config', error);
    }
    
    logger.debug('layout', 'Factory creating component', { 
      type: component, 
      config 
    });

    // Wrap each component in its own Redux Provider to ensure it has access to the store
    switch (component) {
      case ComponentTypes.DOCUMENT_VIEWER:
        // Log which document we're creating a viewer for
        console.log("Creating DocumentViewer for:", {
          paneId: 'id' in config ? config.id : 'pane-default',
          documentId: 'documentId' in config ? config.documentId : undefined
        });
        
        return (
          <Provider store={store}>
            <DocumentViewer
              paneId={'id' in config ? config.id : 'pane-default'}
              documentId={'documentId' in config ? config.documentId : undefined}
              key={`viewer-${'id' in config ? config.id : 'pane-default'}-${'documentId' in config ? config.documentId : 'none'}`}
            />
          </Provider>
        );
        
      case ComponentTypes.DOCUMENT_NAVIGATOR:
        const documents = store.getState().documents.documents;
        return (
          <Provider store={store}>
            <DocumentList documents={documents} />
          </Provider>
        );
        
      default:
        logger.warn('layout', `Unknown component type: ${component}`);
        return <div>Unknown component: {component}</div>;
    }
  } catch (error) {
    logger.error('layout', 'Error in component factory', error);
    return <div>Error creating component</div>;
  }
};

/**
 * Main Layout component that renders the FlexLayout
 */
const LayoutComponent: React.FC = () => {
  const layoutRef = useRef<Layout>(null);
  const dispatch = useDispatch();
  const documents = useSelector((state: RootState) => state.documents.documents);
  const currentDocument = useSelector((state: RootState) => state.documents.currentDocument);
  const panes = useSelector((state: RootState) => state.layout.panes);
  
  // Create context value for the LayoutContext
  const [contextValue, setContextValue] = React.useState({
    updateDocumentState: (paneId: string, state: any) => {
      logger.debug('layout', `Updating document state for pane ${paneId}`);
    }
  });
  
  // Initialize components and set layout reference
  useEffect(() => {
    try {
      // Register document viewer component
      layoutManager.registerComponent(
        ComponentTypes.DOCUMENT_VIEWER,
        DocumentViewer
      );
      
      // Register document navigator component
      layoutManager.registerComponent(
        ComponentTypes.DOCUMENT_NAVIGATOR,
        DocumentList
      );
      
      // Set the layout reference for direct interactions
      if (layoutRef.current) {
        layoutManager.setLayoutRef(layoutRef.current);
      }
      
      // Try to load saved layout
      layoutManager.loadSavedOrDefaultLayout();
      
      // Add some default panes if they don't exist yet
      setTimeout(() => {
        try {
          // Make sure we have at least one viewer pane
          const state = store.getState();
          const hasViewerPane = state.layout.panes.some(p => p.id === 'pane-1');
          
          if (!hasViewerPane) {
            console.log('Creating default viewer pane pane-1');
            dispatch({ type: 'layout/addPane', payload: { paneId: 'pane-1' } });
          }
        } catch (e) {
          console.error('Error setting up default panes', e);
        }
      }, 300);
      
      logger.info('layout', 'Layout initialized');
    } catch (error) {
      logger.error('layout', 'Error initializing layout', error);
      setLayoutError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [dispatch]);
  
  // Update document association when documents or panes change
  useEffect(() => {
    try {
      if (documents.length > 0 && panes.length > 0) {
        // Find viewer panes that aren't navigators and have no document
        const viewerPanes = panes.filter(pane => !pane.id.includes('nav'));
        console.log('Available panes for document viewing:', viewerPanes);
        
        if (viewerPanes.length > 0) {
          const emptyViewerPane = viewerPanes.find(pane => !pane.documentId);
          const targetPane = emptyViewerPane || viewerPanes[0];
          
          logger.debug('layout', 'Auto-setting document in pane', {
            paneId: targetPane.id, 
            docId: documents[0].id
          });
          
          // Wait a moment to ensure the component is fully initialized
          setTimeout(() => {
            try {
              // Directly use Redux dispatch to avoid manager issues
              dispatch({ 
                type: 'layout/setDocumentInPane', 
                payload: { paneId: targetPane.id, documentId: documents[0].id } 
              });
              
              console.log(`Auto-assigned document ${documents[0].id} to pane ${targetPane.id}`);
            } catch (err) {
              logger.error('layout', 'Delayed document assignment error', err);
            }
          }, 800);
        }
      }
    } catch (error) {
      logger.error('layout', 'Error associating documents with panes', error);
    }
  }, [documents, panes, dispatch]);
  
  // Update pane when currentDocument changes
  // Disable this effect to prevent loops
  /*
  useEffect(() => {
    if (currentDocument && panes.length > 0) {
      try {
        // Find the first empty pane or use the first pane
        const targetPane = panes.find(pane => !pane.documentId) || panes[0];
        
        logger.debug('layout', 'Current document changed, updating pane', {
          paneId: targetPane.id,
          docId: currentDocument
        });
        
        layoutManager.setDocumentInPane(currentDocument, targetPane.id);
      } catch (error) {
        logger.error('layout', 'Error updating pane with current document', error);
      }
    }
  }, [currentDocument, panes]);
  */

  // Error handling
  const [layoutError, setLayoutError] = React.useState<Error | null>(null);

  if (layoutError) {
    return (
      <div className="flex-layout-error p-4 bg-red-100 border border-red-400 text-red-700">
        <h3 className="text-lg font-bold mb-2">Layout Error</h3>
        <p>{layoutError.message}</p>
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          onClick={() => {
            // Reset to default layout
            layoutManager.resetToDefaultLayout();
            setLayoutError(null);
          }}
        >
          Reset Layout
        </button>
      </div>
    );
  }

  return (
    <div className="flex-layout-container h-full">
      <LayoutContext.Provider value={contextValue}>
        <Layout
          ref={layoutRef}
          model={layoutManager.getModel()}
          factory={factory}
          onModelChange={() => {
            // Save the layout whenever it changes
            try {
              setTimeout(() => {
                layoutManager.saveLayout();
              }, 500);
            } catch (error) {
              logger.error('layout', 'Error saving layout', error);
            }
          }}
        onRenderTabSet={(node: any, renderValues: any) => {
          // This is a safe fallback if the layout has rendering issues
          try {
            if (renderValues && renderValues.errors) {
              logger.error('layout', 'Layout render error', renderValues.errors);
              setLayoutError(new Error('Error rendering layout'));
            }
          } catch (error) {
            logger.error('layout', 'Error in render callback', error);
          }
        }}
        onTabSelect={(node: any) => {
          try {
            // Handle tab selection here safely
            let config: Record<string, any> = {};
            let name = '';
            
            try {
              // Try different methods of getting config
              if (typeof node.getConfig === 'function') {
                config = node.getConfig() || {};
              } else if (node.config) {
                config = node.config;
              }
              
              // Get name safely
              name = typeof node.getName === 'function' ? node.getName() : (node.name || '');
            } catch (e) {
              logger.warn('layout', 'Error getting tab details', e);
            }
            
            if (config && 'id' in config) {
              logger.debug('layout', 'Tab selected (component handler)', { 
                id: config.id, 
                name 
              });
            }
          } catch (error) {
            logger.error('layout', 'Error in tab select handler', error);
          }
        }}
      />
      </LayoutContext.Provider>
    </div>
  );
};

/**
 * Error boundary specifically for layout errors
 */
class LayoutErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  private layoutManagerRef: typeof layoutManager;
  
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
    // Store reference to layoutManager
    this.layoutManagerRef = layoutManager;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('layout', 'Layout component error', { error, errorInfo });
  }

  resetLayout = () => {
    try {
      // Reset to default layout using the stored reference
      this.layoutManagerRef.resetToDefaultLayout();
      // Clear the error state to retry rendering
      this.setState({ hasError: false, error: null });
    } catch (error) {
      logger.error('layout', 'Error resetting layout', error);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="layout-error p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="text-lg font-bold mb-2">Layout Error</h3>
          <p className="mb-2">{this.state.error?.message || 'An unknown error occurred in the layout'}</p>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={this.resetLayout}
          >
            Reset Layout
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the component in an error boundary before exporting
export default function LayoutWithErrorBoundary() {
  return (
    <LayoutErrorBoundary>
      <LayoutComponent />
    </LayoutErrorBoundary>
  );
}