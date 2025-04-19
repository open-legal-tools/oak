import { useEffect, RefObject, useRef } from 'react';

export const useResizeObserver = (
  ref: RefObject<HTMLElement>,
  callback: () => void,
  options: ResizeObserverOptions = {},
  debounceMs: number = 100
) => {
  const timeoutRef = useRef<number | null>(null);
  const previousDimensions = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      // Clear previous timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      
      // Get current dimensions
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      // Only proceed if dimensions changed significantly
      const prevWidth = previousDimensions.current.width;
      const prevHeight = previousDimensions.current.height;
      
      if (
        (Math.abs(width - prevWidth) > 5 || 
         Math.abs(height - prevHeight) > 5) &&
        width > 10 && height > 10
      ) {
        // Update previous dimensions
        previousDimensions.current = { width, height };
        
        // Set new timeout to debounce the resize events
        timeoutRef.current = window.setTimeout(() => {
          callback();
        }, debounceMs);
      }
    });

    observer.observe(ref.current, options);

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      observer.disconnect();
    };
  }, [ref, callback, options, debounceMs]);
};

export default useResizeObserver; 