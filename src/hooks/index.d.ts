import { RefObject } from 'react';

declare module '../../hooks/useResizeObserver' {
  export default function useResizeObserver(
    ref: RefObject<HTMLElement>,
    callback: () => void,
    options?: ResizeObserverOptions
  ): void;
} 