import { IJsonModel, Layout, Model, Actions, TabNode, BorderNode } from 'flexlayout-react';
import { store } from '../store';
import { addPane, setDocumentInPane } from '../store/layoutSlice';
import { logger } from '../utils/logger';

// Define component types that can be added to the layout
export enum ComponentTypes {
  DOCUMENT_VIEWER = 'document-viewer',
  DOCUMENT_NAVIGATOR = 'document-navigator',
}

// Initial layout configuration
export const DEFAULT_LAYOUT: IJsonModel = {
  global: {
    splitterSize: 5,
    enableEdgeDock: false,
    enableClose: false,
    enableMaximize: true,
    enableTabStrip: true,
    tabEnableClose: false,
    tabEnableFloat: false,
    tabSetEnableMaximize: true,
    tabSetMinWidth: 100,
    tabSetMinHeight: 100
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 15,
        enableTabStrip: true, 
        children: [
          {
            type: 'tab',
            name: 'Document List',
            component: ComponentTypes.DOCUMENT_NAVIGATOR,
            config: {
              id: 'nav-1',
            },
          }
        ]
      },
      {
        type: 'tabset',
        weight: 80,
        enableTabStrip: true,
        children: [
          {
            type: 'tab',
            name: 'Document Viewer',
            component: ComponentTypes.DOCUMENT_VIEWER,
            config: {
              id: 'pane-1',
              documentId: null,
            },
          }
        ]
      }
    ]
  }
};

/**
 * LayoutManager service handles the FlexLayout integration
 * and provides a clean API for managing the layout
 */
export class LayoutManager {
  private model: Model;
  private layoutRef: Layout | null = null;
  private idCounter: number = 1;
  private componentRegistry: Map<string, React.ComponentType<any>> = new Map();

  constructor() {
    // Initialize the model with the default layout
    this.model = Model.fromJson(DEFAULT_LAYOUT);

    // Initialize the layout in Redux
    this.initializeStoreState();
    
    // Log initialization
    logger.debug('layout', 'LayoutManager initialized');
  }

  /**
   * Initialize the Redux store with initial panes
   */
  private initializeStoreState(): void {
    // Add initial panes to Redux
    this.model.visitNodes((node) => {
      if (node.getType() === 'tab') {
        const config = (node as TabNode).getConfig() || {};
        if (config.id) {
          store.dispatch(addPane({ paneId: config.id }));
        }
      }
      return true;
    });
  }

  /**
   * Set up event handlers for the layout model
   */
  private setupEventHandlers(): void {
    try {
      // Try different methods of adding event listeners based on FlexLayout version
      // This handles API differences gracefully
      
      // Method 1: Use onAction if it exists (newer versions)
      if (typeof this.model.onAction === 'function') {
        this.model.onAction((action) => {
          if (action.type === "FlexLayout_SelectTab") {
            const selectedNode = action.data?.node;
            if (selectedNode) {
              const config = selectedNode.getConfig() || {};
              if (config && config.id) {
                logger.debug('layout', 'Tab selected (onAction)', { 
                  id: config.id, 
                  name: selectedNode.getName() 
                });
              }
            }
          }
        });
        logger.debug('layout', 'Using onAction event handler');
        return;
      }
      
      // Method 2: If direct event handling isn't available, we'll use the Layout component's onTabSelect prop
      // The actual event handling will happen in the Layout component
      logger.debug('layout', 'Deferring to Layout component for event handling');
    } catch (error) {
      logger.error('layout', 'Failed to set up event handlers', error);
    }
  }

  /**
   * Set the layout reference for direct interactions
   */
  setLayoutRef(layout: Layout | null): void {
    this.layoutRef = layout;
    logger.debug('layout', 'Layout reference set', { hasRef: layout !== null });
  }

  /**
   * Register a component type with the layout manager
   */
  registerComponent(type: string, component: React.ComponentType<any>): void {
    this.componentRegistry.set(type, component);
    logger.debug('layout', `Component registered: ${type}`);
  }

  /**
   * Get a registered component
   */
  getComponent(type: string): React.ComponentType<any> | undefined {
    return this.componentRegistry.get(type);
  }

  /**
   * Get the layout model
   */
  getModel(): Model {
    return this.model;
  }

  /**
   * Add a new document viewer pane
   */
  addDocumentViewerPane(): string {
    const paneId = `pane-${this.idCounter++}`;
    
    try {
      // Find the right parent to add the tab to
      const root = this.model.getRoot();
      const docViewerTabSet = root.getChildren()[1]; // Second child is document viewer tabset
      
      if (docViewerTabSet) {
        // Create new tab data
        const newTabJson = {
          type: 'tab',
          name: 'Document Viewer',
          component: ComponentTypes.DOCUMENT_VIEWER,
          config: {
            id: paneId,
            documentId: null,
          },
        };
        
        // Add the new tab to the model
        const newNode = this.model.createTabNode(newTabJson);
        docViewerTabSet.addChild(newNode);
        
        // Add to Redux store
        store.dispatch(addPane({ paneId }));
      } else {
        logger.error('layout', 'Could not find document viewer tabset');
      }
    } catch (error) {
      logger.error('layout', 'Error adding document viewer pane', error);
    }
    
    return paneId;
  }

  /**
   * Assign a document to a pane
   */
  setDocumentInPane(documentId: string, paneId: string): void {
    try {
      // Update Redux store only
      store.dispatch(setDocumentInPane({ paneId, documentId }));
      
      // Log success
      logger.debug('layout', 'Document assigned to pane in Redux', { 
        paneId, 
        documentId
      });
      
    } catch (error) {
      logger.error('layout', 'Error in setDocumentInPane', error);
    }
  }

  /**
   * Split a pane horizontally or vertically
   */
  splitPane(paneId: string, direction: 'row' | 'column'): string {
    // Create a new pane ID
    const newPaneId = `pane-${this.idCounter++}`;
    let tabNode: TabNode | null = null;
    
    try {
      // Find the tab node to split
      this.model.visitNodes((node) => {
        if (node.getType() === 'tab') {
          const config = (node as TabNode).getConfig() || {};
          if (config && config.id === paneId) {
            tabNode = node as TabNode;
            return false; // Stop traversal
          }
        }
        return true; // Continue traversal
      });
      
      if (tabNode) {
        const parentTabSet = tabNode.getParent();
        
        if (parentTabSet) {
          // Create a new tab for the new pane
          const newTabJson = {
            type: 'tab',
            name: 'Document Viewer',
            component: ComponentTypes.DOCUMENT_VIEWER,
            config: {
              id: newPaneId,
              documentId: null,
            },
          };
          
          // Create the tab node
          const newTabNode = this.model.createTabNode(newTabJson);
          
          // Get the parent of the tabset
          const grandparent = parentTabSet.getParent();
          
          if (grandparent) {
            // Create a new row or column depending on the split direction
            const newSplitJson = {
              type: direction,
              weight: 100,
              children: []
            };
            
            // Create the split container and add it to the model
            // FlexLayout 0.8.10 uses RowNode for both row and column layouts
            // The actual orientation is determined by the 'type' property in the JSON
            const newSplit = this.model.createRowNode(newSplitJson);
            
            // Get index of parent in grandparent
            const parentIndex = grandparent.getChildren().indexOf(parentTabSet);
            
            // Replace parent with the new split in the grandparent
            grandparent.removeChild(parentTabSet);
            grandparent.addChild(newSplit, parentIndex);
            
            // Add the original tabset and a new tabset with our new tab to the split
            newSplit.addChild(parentTabSet);
            
            // Create new tabset for the new tab
            const newTabSetJson = {
              type: 'tabset',
              weight: 50,
              children: []
            };
            
            // In FlexLayout 0.8.10, we may need to use different API 
            // Use createTabSetNode if available, otherwise create a standard node
            const newTabSet = typeof this.model.createTabSetNode === 'function' 
              ? this.model.createTabSetNode(newTabSetJson)
              : this.model.doAction(Actions.addNode(newTabSetJson, newSplit.getId(), 1, null));
            newTabSet.addChild(newTabNode);
            newSplit.addChild(newTabSet);
            
            // Add to Redux store
            store.dispatch(addPane({ paneId: newPaneId }));
          }
        }
      }
    } catch (error) {
      logger.error('layout', 'Error splitting pane', error);
    }
    
    return newPaneId;
  }

  /**
   * Save the current layout to localStorage or other storage
   */
  saveLayout(): string {
    const layoutJson = this.model.toJson();
    const layoutString = JSON.stringify(layoutJson);
    localStorage.setItem('oak_layout', layoutString);
    return layoutString;
  }

  /**
   * Load a layout from JSON string
   */
  loadLayout(layoutJson: string): void {
    try {
      const layout = JSON.parse(layoutJson);
      this.model = Model.fromJson(layout);
      
      // Reinitialize the store with the new layout
      this.initializeStoreState();
      
      // Refresh the layout
      if (this.layoutRef) {
        this.layoutRef.forceUpdate();
      }
      
      logger.debug('layout', 'Layout loaded successfully');
    } catch (error) {
      logger.error('layout', 'Error loading layout', error);
    }
  }

  /**
   * Try to load a saved layout, or use the default
   */
  loadSavedOrDefaultLayout(): void {
    const savedLayout = localStorage.getItem('oak_layout');
    if (savedLayout) {
      try {
        this.loadLayout(savedLayout);
      } catch (error) {
        logger.error('layout', 'Error loading saved layout, using default', error);
        this.resetToDefaultLayout();
      }
    }
  }
  
  /**
   * Reset the layout to the default configuration
   */
  resetToDefaultLayout(): void {
    try {
      this.model = Model.fromJson(DEFAULT_LAYOUT);
      this.initializeStoreState();
      
      // Clear any saved layout
      localStorage.removeItem('oak_layout');
      
      logger.info('layout', 'Reset to default layout');
      
      // Refresh the layout if reference exists
      if (this.layoutRef) {
        this.layoutRef.forceUpdate();
      }
    } catch (error) {
      logger.error('layout', 'Error resetting to default layout', error);
    }
  }
}

// Export a singleton instance
export const layoutManager = new LayoutManager();