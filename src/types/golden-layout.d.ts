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
    parent: ContentItem | null;
    layoutManager: LayoutManager;
    container?: ComponentContainer;
    config: JsonWithId;
    container: ComponentContainer;
    addItem(config: JsonWithId, index?: number): void;
    updateSize(): void;
  }

  interface ComponentContainer {
    state: {
      paneId: string;
      documentId?: string;
    };
    updateSize(width?: number, height?: number): void;
    setState(state: Record<string, unknown>): void;
  }

  interface LayoutManager {
    createContentItem: (config: JsonWithId) => ContentItem;
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

  interface GoldenLayout {
    updateSize(width?: number, height?: number): void;
  }
}

interface JsonWithId extends Json {
  id?: string;
  type?: string;
  componentType?: string;
  componentState?: Record<string, unknown>;
} 