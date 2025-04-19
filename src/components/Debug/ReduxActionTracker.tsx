import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { store } from '../../store';

// A much simpler component that doesn't monkey-patch anything
export const ReduxActionTracker = () => {
  // We won't do anything by default - this component is a no-op
  // This avoids all the errors and issues with monkey patching
  return null;
}; 