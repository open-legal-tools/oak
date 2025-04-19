import { configureStore, Middleware } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import documentsReducer from './documentSlice';
import layoutReducer from './layoutSlice';
import { AnyAction } from 'redux';

// Create a minimal workspace reducer
const workspaceReducer = (state = { panes: [] }, action: AnyAction) => {
  switch (action.type) {
    default:
      return state;
  }
};

// Create a middleware to silence Redux logs
const silenceReduxLogsMiddleware: Middleware = () => next => action => {
  // Just pass the action to the next middleware without logging
  return next(action);
};

export const store = configureStore({
  reducer: {
    documents: documentsReducer,
    workspace: workspaceReducer,
    layout: layoutReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production' // Enable Redux DevTools in dev mode
});

// Export types and hooks for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Make store accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).__REDUX_STORE__ = store;
}

declare module 'golden-layout' {
  interface ContentItem {
    replaceChild(oldChild: ContentItem, newChild: ContentItem): void;
  }
  
  interface JsonWithId extends Json {
    id?: string;
  }
}