import { useLayout } from '../contexts/LayoutContext';
import { useAppDispatch, useAppSelector } from '../store';

export const useKeyboardNavigation = () => {
  const dispatch = useAppDispatch();
  const { panes, focusedPane } = useAppSelector(state => state.layout);
  const { splitPane, swapPanes } = useLayout();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        if (focusedPane) splitPane(focusedPane, 'horizontal');
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
        // Handle document movement logic
      }
      
      if (e.altKey && e.key === 'w') {
        // Implement swap logic
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedPane, panes, splitPane, swapPanes]);
}; 