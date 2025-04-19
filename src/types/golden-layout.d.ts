import 'golden-layout';
import { ComponentContainer, ContentItem } from 'golden-layout';

declare module 'golden-layout' {
  interface ContentItem {
    getItemsByFilter: (filter: (item: ContentItem) => boolean) => ContentItem[];
    addComponent: (type: string, state?: Record<string, unknown>) => void;
    addItem: (item: JsonWithId) => void;
    isStack: boolean;
    isRow: boolean;
    isColumn: boolean;
    isComponent: boolean;
    parent: ContentItem | null;
    layoutManager: LayoutManager;
    container?: ComponentContainer;
    config: JsonWithId;
    element: HTMLElement;
    component?: any;
    addItem(config: JsonWithId, index?: number): void;
    updateSize(): void;
  }

  interface ComponentContainer {
    state: {
      paneId: string;
      documentId?: string;
      type?: string;
    };
    _config?: {
      componentName: string;
      id?: string;
      componentType: string;
      title?: string;
      isClosable?: boolean;
      reorderEnabled?: boolean;
      componentState?: {
        paneId: string;
        documentId?: string;
        type?: string;
      };
    };
    element: HTMLElement;
    component?: any;
    parent?: any;
    componentName?: string;
    componentType?: string;
    title?: string;
    updateSize(width?: number, height?: number): void;
    setState(state: Record<string, unknown>): void;
    addEventListener(event: string, callback: () => void): void;
    [key: string]: any; // Allow any other property access
  }

  interface LayoutManager {
    createContentItem: (config: JsonWithId) => ContentItem;
  }

  interface GoldenLayout {
    rootItem?: ContentItem;
    updateSize(width?: number, height?: number): void;
    saveLayout(): LayoutConfig;
    loadLayout(config: LayoutConfig): void;
    destroy(): void;
    registerComponentFactoryFunction(
      type: string,
      factory: (container: ComponentContainer) => void
    ): void;
  }

  interface LayoutConfig {
    settings?: {
      showPopoutIcon?: boolean;
      showMaximiseIcon?: boolean;
      showCloseIcon?: boolean;
      responsiveMode?: string;
      reorderEnabled?: boolean;
      constrainDragToContainer?: boolean;
      selectionEnabled?: boolean;
      popInOnClose?: boolean;
    };
    dimensions?: {
      borderWidth?: number;
      minItemHeight?: number;
      minItemWidth?: number;
      headerHeight?: number;
    };
    root: {
      type: string;
      content: Array<{
        type: string;
        content?: any[];
        componentType?: string;
        componentName?: string;
        title?: string;
        id?: string;
        isClosable?: boolean;
        reorderEnabled?: boolean;
        componentState?: Record<string, unknown>;
      }>;
    };
  }

  export type JsonWithId = {
    id?: string;
    type?: string;
    componentType?: string;
    componentState?: {
      paneId?: string;
      documentId?: string;
    };
  };
}

interface JsonWithId extends Json {
  id?: string;
  type?: string;
  componentType?: string;
  componentState?: Record<string, unknown>;
} 