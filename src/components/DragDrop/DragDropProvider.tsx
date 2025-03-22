import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DragDropContextType {
  isDragging: boolean;
  draggedItem: any;
  startDrag: (item: any) => void;
  endDrag: () => void;
  dropTarget: string | null;
  setDropTarget: (targetId: string | null) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

interface DragDropProviderProps {
  children: ReactNode;
}

export const DragDropProvider: React.FC<DragDropProviderProps> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const startDrag = (item: any) => {
    setIsDragging(true);
    setDraggedItem(item);
  };

  const endDrag = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDropTarget(null);
  };

  return (
    <DragDropContext.Provider
      value={{
        isDragging,
        draggedItem,
        startDrag,
        endDrag,
        dropTarget,
        setDropTarget,
      }}
    >
      {children}
    </DragDropContext.Provider>
  );
}; 