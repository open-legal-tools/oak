// components/Layout/MultiPaneLayout.tsx
import React, { useState, useRef, useEffect } from 'react';
import Pane from './Pane';
import ResizeHandle from './ResizeHandle';
import { useDispatch, useSelector } from 'react-redux';
import { assignDocumentToPane, setActivePane, swapPaneDocuments } from '../../store/workspaceSlice';
import { RootState } from '../../store';

const MultiPaneLayout: React.FC = () => {
  const dispatch = useDispatch();
  const { panes, activePaneId } = useSelector((state: RootState) => state.workspace);
  const [focusedPaneId, setFocusedPaneId] = useState<string | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  
  // Set initial active pane
  useEffect(() => {
    if (panes.length > 0 && !activePaneId) {
      dispatch(setActivePane(panes[0].id));
    }
  }, [panes, activePaneId, dispatch]);
  
  // Handler for document dropping
  const handleDocumentDrop = (documentId: string, paneId: string) => {
    dispatch(assignDocumentToPane({ documentId, paneId }));
  };
  
  // Keyboard navigation between panes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.altKey) {
      switch(e.key) {
        case 'ArrowLeft':
          // Focus left pane if it exists
          if (panes.findIndex(p => p.id === focusedPaneId) > 0) {
            const index = panes.findIndex(p => p.id === focusedPaneId);
            const newPaneId = panes[index - 1].id;
            setFocusedPaneId(newPaneId);
            dispatch(setActivePane(newPaneId));
          }
          break;
        case 'ArrowRight':
          // Focus right pane if it exists
          if (panes.findIndex(p => p.id === focusedPaneId) < panes.length - 1) {
            const index = panes.findIndex(p => p.id === focusedPaneId);
            const newPaneId = panes[index + 1].id;
            setFocusedPaneId(newPaneId);
            dispatch(setActivePane(newPaneId));
          }
          break;
        case '1': 
          setFocusedPaneId(panes[0].id);
          dispatch(setActivePane(panes[0].id));
          break;
        case '2':
          if (panes.length > 1) {
            setFocusedPaneId(panes[1].id);
            dispatch(setActivePane(panes[1].id));
          }
          break;
        case '3':
          if (panes.length > 2) {
            setFocusedPaneId(panes[2].id);
            dispatch(setActivePane(panes[2].id));
          }
          break;
        case 's':
          // Swap documents between focused pane and next pane
          if (focusedPaneId && panes.length > 1) {
            const index = panes.findIndex(p => p.id === focusedPaneId);
            if (index < panes.length - 1) {
              dispatch(swapPaneDocuments({
                sourcePane: focusedPaneId,
                targetPane: panes[index + 1].id
              }));
            }
          }
          break;
      }
      
      // Announce pane change to screen readers
      const announcement = document.getElementById('screen-reader-announcer');
      if (announcement) {
        announcement.textContent = `Pane ${focusedPaneId} activated`;
      }
    }
  };
  
  return (
    <div 
      ref={layoutRef}
      className="multi-pane-layout" 
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Document workspace"
      tabIndex={-1} // Make div focusable without tab stop
    >
      {/* Hidden element for screen reader announcements */}
      <div 
        id="screen-reader-announcer" 
        className="sr-only" 
        aria-live="polite"
      ></div>
      
      <div className="panes-container">
        {panes.map((pane, index) => (
          <React.Fragment key={pane.id}>
            <Pane 
              id={pane.id}
              onDocumentDrop={handleDocumentDrop}
              isFocused={focusedPaneId === pane.id}
              isActive={activePaneId === pane.id}
              onFocus={() => {
                setFocusedPaneId(pane.id);
                dispatch(setActivePane(pane.id));
              }}
            >
              {/* Pane content will go here based on assigned document */}
              {/* We'll implement the document viewer later */}
            </Pane>
            
            {/* Add resize handle between panes but not after the last one */}
            {index < panes.length - 1 && (
              <ResizeHandle 
                onResize={(delta) => {/* Resize logic */}}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Keyboard navigation help - hidden until ? key is pressed */}
      <div className="keyboard-help hidden">
        <h3>Keyboard Shortcuts</h3>
        <ul>
          <li>Alt+1, Alt+2, Alt+3: Focus specific pane</li>
          <li>Alt+Left/Right: Navigate between panes</li>
          <li>Alt+S: Swap documents between panes</li>
        </ul>
      </div>
    </div>
  );
};

export default MultiPaneLayout;