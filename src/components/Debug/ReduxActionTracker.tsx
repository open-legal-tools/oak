import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { store } from '../../store';

export const ReduxActionTracker = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const originalDispatch = dispatch;
    
    // Wrap dispatch to log actions
    const trackedDispatch = (action: any) => {
      console.log('[Redux Action]', action);
      return originalDispatch(action);
    };

    // Monkey-patch the store's dispatch
    store.dispatch = trackedDispatch;

    return () => {
      store.dispatch = originalDispatch;
    };
  }, [dispatch]);

  return null;
}; 