import { configureStore } from '@reduxjs/toolkit';
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
  devTools: process.env.NODE_ENV !== 'production'
});

// Export types and hooks for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Add a console.log to verify the store is created
console.log('Redux store initialized');

declare module 'golden-layout' {
  interface ContentItem {
    replaceChild(oldChild: ContentItem, newChild: ContentItem): void;
  }
  
  interface JsonWithId extends Json {
    id?: string;
  }
}
