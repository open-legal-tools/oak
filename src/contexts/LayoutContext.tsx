import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { createContext, useContext, useState } from 'react';
import { GoldenLayout, LayoutConfig, ComponentContainer } from 'golden-layout';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { RootState, store } from '../store'; 
import { setDocumentInPane, addPane, removePane, swapDocuments } from '../store/layoutSlice';
import { createRoot, Root } from 'react-dom/client';
import { PaneConfig, DocumentViewerState } from '../types/layout.types';
import ErrorBoundary from '../ErrorBoundary';
import { logger } from '../utils/logger';

interface ComponentState {
  paneId: string;
  documentId?: string;
  type?: string;
}

interface GoldenLayoutComponentConfig {
  componentName: string;
  componentState: ComponentState;
  id: string;
}

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
  updateDocumentState: (paneId: string, state: DocumentViewerState) => void;
  panes: Array<{ id: string; documentId?: string; documentState?: DocumentViewerState }>;
}

// Create the context
// Create context with a default value to avoid null checks everywhere
const defaultUpdateDocumentState = (paneId: string, state: DocumentViewerState) => {
  logger.debug('layout', `Default updateDocumentState called for pane ${paneId}`);
};

export const LayoutContext = createContext<LayoutContextType | { updateDocumentState: typeof defaultUpdateDocumentState }>({
  updateDocumentState: defaultUpdateDocumentState
});

// Hook for using the layout context
export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: React.ReactNode;
}

// Component root pool for performance optimization
class ComponentRootPool {
  private pool: Map<string, Root> = new Map();
  private maxSize: number = 10;

  acquire(id: string): Root {
    let root = this.pool.get(id);
    if (!root) {
      root = createRoot(document.createElement('div'));
      this.pool.set(id, root);
      
      // Clean up old roots if pool is too large
      if (this.pool.size > this.maxSize) {
        const [oldestId] = this.pool.keys();
        this.release(oldestId);
      }
    }
    return root;
  }

  release(id: string): void {
    const root = this.pool.get(id);
    if (root) {
      try {
        // Schedule unmount for next tick to avoid synchronous unmounting during render
        setTimeout(() => {
          root.unmount();
        }, 0);
      } catch (e) {
        logger.error('layout', 'Error unmounting root:', e);
      }
      this.pool.delete(id);
    }
  }

  clear(): void {
    // Use safe asynchronous unmounting to prevent race conditions
    const roots = Array.from(this.pool.values());
    this.pool.clear();
    
    // Schedule unmounts for next tick
    setTimeout(() => {
      roots.forEach(root => {
        try {
          root.unmount();
        } catch (e) {
          logger.error('layout', 'Error unmounting root during clear:', e);
        }
      });
    }, 0);
  }
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [layout, setLayout] = useState<GoldenLayout | null>(null);
  const componentMap = useRef<Map<string, React.ComponentType<any>>>(new Map());
  const rootPool = useRef<ComponentRootPool>(new ComponentRootPool());
  const dispatch = useDispatch();
  const { panes } = useSelector((state: RootState) => state.layout);
  
  // Calculate if we can add or remove panes
  const canAddPane = panes.length < 3;
  const canRemovePane = panes.length > 1;

  const registerComponent = useCallback((name: string, component: React.ComponentType<any>) => {
    componentMap.current.set(name, component);
  }, []);

  const createNewLayout = useCallback((config: LayoutConfig) => {
    const layoutElement = document.getElementById('golden-layout-container');
    if (!layoutElement) {
      logger.warn('layout', 'Golden Layout container not found!');
      return;
    }
    
    if (layout) {
      layout.destroy();
    }
    
    try {
      // First create a bare GoldenLayout instance
      const newLayout = new GoldenLayout(layoutElement);
      
      // Add components directly to the layout before loading config
      componentMap.current.forEach((Component, name) => {
        // Register each component by its name
        newLayout.registerComponentFactoryFunction(name, (container: ComponentContainer) => {
          // Get state from container or use default
          const state = container.state as ComponentState || { paneId: 'pane-1', type: 'document' };
          const paneId = state.paneId || 'pane-1';

          const root = rootPool.current.acquire(paneId);
          const el = document.createElement('div');
          el.style.cssText = 'width: 100%; height: 100%;';
          container.element.appendChild(el);

          root.render(
            <React.StrictMode>
              <Provider store={store}>
                <ErrorBoundary onError={(error) => logger.error('component', 'Component error:', error)}>
                  <Component 
                    paneId={paneId}
                    documentId={state.documentId}
                    type={state.type}
                    key={`${paneId}-${state.documentId || 'empty'}`}
                  />
                </ErrorBoundary>
              </Provider>
            </React.StrictMode>
          );

          container.addEventListener('destroy', () => {
            rootPool.current.release(paneId);
          });
        });
      });
      
      // Also register generic react-component that can route to the proper component
      newLayout.registerComponentFactoryFunction('react-component', (container: ComponentContainer) => {
        // Get the component name from the config
        const componentName = container._config?.componentName || 'DocumentViewer';
        
        // Find the component in our registry
        const Component = componentMap.current.get(componentName);
        if (!Component) {
          logger.error('layout', `Component ${componentName} not found in registry`);
          return;
        }
        
        // Get state from container or use default
        const state = container.state as ComponentState || { paneId: 'pane-1', type: 'document' };
        const paneId = state.paneId || 'pane-1';

        const root = rootPool.current.acquire(`generic-${paneId}`);
        const el = document.createElement('div');
        el.style.cssText = 'width: 100%; height: 100%;';
        container.element.appendChild(el);

        root.render(
          <React.StrictMode>
            <Provider store={store}>
              <ErrorBoundary onError={(error) => logger.error('component', 'Component error:', error)}>
                <Component 
                  paneId={paneId}
                  documentId={state.documentId}
                  type={state.type}
                  key={`${paneId}-${state.documentId || 'empty'}`}
                />
              </ErrorBoundary>
            </Provider>
          </React.StrictMode>
        );

        container.addEventListener('destroy', () => {
          rootPool.current.release(`generic-${paneId}`);
        });
      });
      
      // Now load the layout configuration
      newLayout.loadLayout(config);
      setLayout(newLayout);
      
      // Handle resize events
      let animationFrameId: number | null = null;
      let previousWidth = 0;
      let previousHeight = 0;
      let lastUpdateTime = 0;
      
      const resizeObserver = new ResizeObserver((entries) => {
        // Debounce resize events with requestAnimationFrame to avoid too many updates
        
        // Cancel any existing animation frame
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Schedule a new frame with dimension checking
        animationFrameId = requestAnimationFrame(() => {
          const now = Date.now();
          const { width, height } = entries[0].contentRect;
          
          // Only update if:
          // 1. Dimensions have actually changed significantly
          // 2. Enough time has passed since the last update (throttle)
          // 3. Width and height are valid values (prevent glitches)
          if (width > 50 && height > 50 && 
              (Math.abs(width - previousWidth) > 10 || Math.abs(height - previousHeight) > 10) &&
              now - lastUpdateTime > 500) {
            
            previousWidth = width;
            previousHeight = height;
            lastUpdateTime = now;
            
            // Update the layout with the new dimensions
            newLayout.updateSize(width, height);
          }
        });
      });
      resizeObserver.observe(layoutElement);

      return () => {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        resizeObserver.disconnect();
        newLayout.destroy();
      };
    } catch (error) {
      console.error('[Layout] Error initializing layout:', error);
    }
  }, [layout]);

  // Clean up layout on unmount
  useEffect(() => {
    return () => {
      if (layout) {
        // Safely destroy the layout with a delayed execution
        setTimeout(() => {
          try {
            layout.destroy();
          } catch (e) {
            console.error('Error destroying layout:', e);
          }
        }, 0);
      }
      // Clear the pool without unmounting synchronously
      rootPool.current.clear();
    };
  }, [layout]);

  const addDocumentToPane = useCallback((documentId: string, paneId: string) => {
    logger.debug('layout', 'Assigning document', documentId, 'to pane', paneId);
    dispatch(setDocumentInPane({ paneId, documentId }));

    if (layout) {
      layout.rootItem?.getItemsByFilter(item => {
        if (!item.isComponent || !item.container) return false;
        const state = item.container.state as { paneId: string };
        return state.paneId === paneId;
      }).forEach(item => {
        if (!item.container) return;
        
        logger.debug('layout', 'Updating pane:', paneId);
        const currentState = item.container.state as { paneId: string; documentId?: string };
        item.container.setState({ 
          paneId: currentState.paneId,
          documentId: documentId
        });
        item.container.updateSize();
      });
    }
  }, [layout, dispatch]);

  // Create the context value with useMemo
  const contextValue = useMemo(() => ({
    layout,
    registerComponent,
    createNewLayout,
    addDocumentToPane,
    createNewPane: () => {
      // Implementation
    },
    removeExistingPane: (paneId: string) => {
      // Implementation
    },
    canAddPane,
    canRemovePane,
    splitPane: (paneId: string, direction: 'horizontal' | 'vertical') => {
      // Implementation
    },
    swapPanes: (sourcePaneId: string, targetPaneId: string) => {
      dispatch(swapDocuments({ sourcePaneId, targetPaneId }));
    },
    updateDocumentState: (paneId: string, state: DocumentViewerState) => {
      // Check if state is actually different to avoid unnecessary updates
      const currentPane = panes.find(p => p.id === paneId);
      if (!currentPane || !currentPane.documentState || 
          JSON.stringify(currentPane.documentState) !== JSON.stringify(state)) {
        dispatch({
          type: 'layout/updateDocumentState',
          payload: { paneId, state }
        });
      }
    },
    panes
  }), [layout, registerComponent, createNewLayout, addDocumentToPane, canAddPane, canRemovePane, panes, dispatch]);

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
}; 