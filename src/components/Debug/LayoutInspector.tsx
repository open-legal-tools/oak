import React, { useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { useAppSelector } from '../../store';

export const LayoutInspector = () => {
  const { layout } = useLayout();
  const panes = useAppSelector(state => state.layout.panes);

  useEffect(() => {
    let isMounted = true;
    
    const inspect = async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      
      if (!isMounted || !layout) return;
      
      console.groupCollapsed('[Layout Inspector]');
      console.log('Golden Layout instance:', layout);
      console.log('Redux panes:', panes);
      
      if (layout) {
        console.log('Layout config:', layout.saveLayout());
        console.log('Component map:', Array.from(layout.getComponentInstances()));
      }
      
      console.groupEnd();
    };

    inspect();
    return () => {
      isMounted = false;
    };
  }, [layout, panes]);

  return null;
}; 