import React, { useMemo } from 'react';
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { GoldenLayout, LayoutConfig, ComponentContainer } from 'golden-layout';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setDocumentInPane, addPane, removePane, swapDocuments } from '../store/layoutSlice';
import { createRoot } from 'react-dom/client';
import DocumentViewer from '../components/DocumentViewer';

interface LayoutContextType {
  layout: GoldenLayout | null;
  registerComponent: (name: string, component: React.ComponentType<any>) => void;
  createNewLayout: (config: LayoutConfig) => void;
  addDocumentToPane: (documentId: string, paneId: string) => void;
  createNewPane: () => void;
  removeExistingPane: (paneId: string) => void;
  canAddPane: boolean;
  canRemovePane: boolean;
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical') => void;
  swapPanes: (sourcePaneId: string, targetPaneId: string) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  layout: null,
  registerComponent: () => {},
  createNewLayout: () => {},
  addDocumentToPane: () => {},
  createNewPane: () => {},
  removeExistingPane: () => {},
  canAddPane: false,
  canRemovePane: false,
  splitPane: () => {},
  swapPanes: () => {},
});

export const useLayout = (): LayoutContextType => useContext(LayoutContext);

interface LayoutProviderProps {
  children: React.ReactNode;
}

const DebugComponent = () => {
  useEffect(() => {
    console.log('DEBUG COMPONENT MOUNTED');
    return () => console.log('DEBUG COMPONENT UNMOUNTED');
  }, []);
  
  return <div style={{ 
    width: '100%', 
    height: '100%',
    background: 'red',
    color: 'white',
    padding: 20
  }}>
    <h1>Debug Component</h1>
    <p>If you see this, Golden Layout is working</p>
  </div>;
};

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [layout, setLayout] = useState<GoldenLayout | null>(null);
  const componentMap = useRef<Map<string, React.ComponentType<any>>>(new Map());
  const dispatch = useDispatch();
  const { panes } = useSelector((state: RootState) => state.layout);
  
  // Calculate if we can add or remove panes
  const canAddPane = panes.length < 3;
  const canRemovePane = panes.length > 1;

  const registerComponent = (name: string, component: React.ComponentType<any>) => {
    console.log('[Layout] Registering component:', name);
    componentMap.current.set(name, component);

    // Add debug component registration
    if (name === 'DebugComponent') {
      layout?.registerComponentFactoryFunction(name, (container: ComponentContainer) => {
        const el = document.createElement('div');
        container.element.appendChild(el);
        createRoot(el).render(<DebugComponent />);
      });
    }
    
    if (layout) {
      layout.registerComponentFactoryFunction(name, (container: ComponentContainer) => {
        const state = container.state as { paneId: string; documentId?: string };
        console.log('[Layout] Creating component:', name, 'State:', state);
        
        const Component = componentMap.current.get(name);
        if (!Component) return;
        
        const el = document.createElement('div');
        el.style.width = '100%';
        el.style.height = '100%';
        container.element.appendChild(el);
        
        const root = createRoot(el);
        root.render(
          <Component 
            key={`${state.paneId}-${state.documentId}`}
            paneId={state.paneId}
            documentId={state.documentId || ''}
          />
        );
        
        container.addEventListener('destroy', () => root.unmount());
      });
    }
  };

  const createNewLayout = (config: LayoutConfig) => {
    console.log('[Layout] Initializing new layout with config:', config);
    if (layout) {
      layout.destroy();
    }
    
    const layoutElement = document.getElementById('golden-layout-container');
    if (!layoutElement) return;
    
    const newLayout = new GoldenLayout(layoutElement);
    
    // Register all components that were previously registered
    componentMap.current.forEach((component, name) => {
      newLayout.registerComponentFactoryFunction(name, (container: ComponentContainer) => {
        const Component = componentMap.current.get(name);
        if (!Component) return;
        
        const el = document.createElement('div');
        el.style.width = '100%';
        el.style.height = '100%';
        container.element.appendChild(el);
        
        const paneId = (container.state as { paneId: string }).paneId;
        
        const root = createRoot(el);
        root.render(
          <Component 
            paneId={paneId} 
            key={paneId}
          />
        );
        
        container.addEventListener('destroy', () => {
          root.unmount();
        });
      });
    });
    
    newLayout.loadLayout(config);
    setLayout(newLayout);
    
    // Handle resize events
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        newLayout.updateSize(width, height);
      });
      resizeObserver.observe(layoutElement);
    }

    return () => {
      resizeObserver?.disconnect();
      newLayout.destroy();
    };
  };

  const addDocumentToPane = (documentId: string, paneId: string) => {
    console.log('[Layout] Assigning document', documentId, 'to pane', paneId);
    dispatch(setDocumentInPane({ paneId, documentId }));

    if (layout) {
      layout.rootItem?.getItemsByFilter(item => {
        if (!item.isComponent || !item.container) return false;
        const state = item.container.state as { paneId: string };
        return state.paneId === paneId;
      }).forEach(item => {
        if (!item.container) return;
        
        console.log('[Layout] Updating pane:', paneId);
        item.container.setState({ 
          ...item.container.state,
          documentId: documentId
        });
        item.container.updateSize();
      });
    }
  };

  const createNewPane = () => {
    if (!canAddPane) return;
    
    // Generate a unique ID for the new pane
    const paneId = `pane-${Date.now()}`;
    
    dispatch(addPane({ paneId }));
    
    // Update the layout to include the new pane
    if (layout) {
      // This is a simplified example - in a real app, you'd need to determine
      // where to add the new pane based on the current layout
      const rootItem = layout.rootItem;
      
      if (rootItem.isStack) {
        // If the root is a stack, add a new component to it
        rootItem.addComponent('DocumentViewer', { 
          paneId: paneId,
          state: {
            paneId: paneId,
            documentId: null
          }
        });
      } else if (rootItem.isRow || rootItem.isColumn) {
        // If the root is a row or column, add a new component to it
        rootItem.addItem({
          type: 'component',
          componentType: 'DocumentViewer',
          componentState: { paneId }
        });
      }
    }
  };

  const removeExistingPane = (paneId: string) => {
    if (!canRemovePane) return;
    
    dispatch(removePane({ paneId }));
    
    // Find and remove the pane from the layout
    if (layout) {
      layout.rootItem.getItemsByFilter(item => {
        if (item.isComponent) {
          const state = item.container.state;
          return state && state.paneId === paneId;
        }
        return false;
      }).forEach(item => {
        item.remove();
      });
    }
  };

  const splitPane = (paneId: string, direction: 'horizontal' | 'vertical') => {
    if (!canAddPane || !layout) return;

    const newPaneId = `pane-${Date.now()}`;
    dispatch(addPane({ paneId: newPaneId }));

    layout.rootItem.getItemsByFilter(item => {
      if (item.isComponent) {
        const state = item.container.state;
        return state && state.paneId === paneId;
      }
      return false;
    }).forEach(item => {
      const parent = item.parent;
      if (parent) {
        const newItem = {
          type: 'component',
          componentType: 'DocumentViewer',
          componentState: { paneId: newPaneId }
        };
        
        if (direction === 'horizontal') {
          parent.addItem(newItem, 1);
        } else {
          const column = parent.layoutManager.createContentItem({
            type: 'column',
            content: [item.config as JsonWithId, newItem]
          });
          parent.replaceChild(item, column);
        }
      }
    });
  };

  const swapPanes = (sourcePaneId: string, targetPaneId: string) => {
    dispatch(swapDocuments({ sourcePaneId, targetPaneId }));
  };

  // Initialize layout when the component mounts
  useEffect(() => {
    const initLayout = async () => {
      console.log('[Layout] Initialization started');
      const layoutElement = document.getElementById('golden-layout-container');
      
      if (!layoutElement) {
        console.error('Golden Layout container not found!');
        return;
      }

      // Clear existing content
      layoutElement.innerHTML = '';

      console.log('[Layout] Creating new instance');
      const initialConfig: LayoutConfig = {
        root: {
          type: 'row',
          content: [{
            type: 'component',
            componentType: 'DebugComponent',
            componentState: { 
              paneId: 'debug-pane-1',
              documentId: 'debug-document' 
            }
          }]
        }
      };

      // Register components FIRST
      registerComponent('DebugComponent', DebugComponent);
      registerComponent('DocumentViewer', DocumentViewer);
      
      // Then create layout
      createNewLayout(initialConfig);
      console.log('[Layout] Initialization complete');
    };

    // Delay initialization to ensure DOM is ready
    const timeoutId = setTimeout(initLayout, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (layout) {
        console.log('[Layout] Cleaning up previous layout');
        layout.destroy();
      }
    };
  }, []);

  // Add this inside the LayoutProvider component
  useEffect(() => {
    const checkGoldenLayout = () => {
      const container = document.getElementById('golden-layout-container');
      console.log('Golden Layout instance check:', {
        exists: !!container,
        goldenLayout: (container as any)?.goldenLayout,
        componentMap: Array.from(componentMap.current.keys())
      });
    };
    
    const timer = setInterval(checkGoldenLayout, 2000);
    return () => clearInterval(timer);
  }, []);

  // Wrap the context value in useMemo to prevent unnecessary updates
  const contextValue = useMemo(() => ({
    layout,
    registerComponent,
    createNewLayout,
    addDocumentToPane,
    createNewPane,
    removeExistingPane,
    canAddPane,
    canRemovePane,
    splitPane,
    swapPanes
  }), [layout, canAddPane, canRemovePane]);

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}; 