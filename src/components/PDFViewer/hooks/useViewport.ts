import { useEffect, useRef, useCallback } from 'react';
import usePDFStore from './usePDFStore';

// Remove complex interface and simplify
export const useViewport = ({ containerRef, totalPages, preloadPages = 2, scrollThreshold = 0.1 }) => {
  const { viewport, setViewport, setPageState } = usePDFStore();
  const observerRef = useRef(null);
  const visiblePagesRef = useRef(new Set());
  
  // Calculate nearby pages based on visible pages
  const updateNearbyPages = useCallback((visiblePages) => {
    const nearbyPages = new Set();
    const preloadRange = preloadPages * 2; // Increased preload range
    
    visiblePages.forEach(pageNum => {
      // Add pages before with increased range
      for (let i = 1; i <= preloadRange; i++) {
        const prevPage = pageNum - i;
        if (prevPage > 0) {
          nearbyPages.add(prevPage);
        }
      }
      
      // Add pages after with increased range
      for (let i = 1; i <= preloadRange; i++) {
        const nextPage = pageNum + i;
        if (nextPage <= totalPages) {
          nearbyPages.add(nextPage);
        }
      }
    });
    
    return nearbyPages;
  }, [preloadPages, totalPages]);
  
  // Handle intersection changes
  const handleIntersection = useCallback((entries) => {
    const newVisiblePages = new Set(visiblePagesRef.current);
    let hasChanges = false;
    
    entries.forEach(entry => {
      const pageNum = parseInt(entry.target.getAttribute('data-page-num') || '0', 10);
      if (!pageNum) return;
      
      const isInView = entry.isIntersecting || 
                      (entry.intersectionRatio > 0.1); // Consider partially visible pages
      
      if (isInView) {
        if (!newVisiblePages.has(pageNum)) {
          newVisiblePages.add(pageNum);
          hasChanges = true;
        }
      } else {
        if (newVisiblePages.has(pageNum)) {
          newVisiblePages.delete(pageNum);
          hasChanges = true;
        }
      }
      
      // Update page state
      setPageState(pageNum, {
        isVisible: isInView,
        isNearby: false // Will be updated in next step if nearby
      });
    });
    
    if (hasChanges) {
      visiblePagesRef.current = newVisiblePages;
      const newNearbyPages = updateNearbyPages(newVisiblePages);
      
      // Update nearby state for pages
      newNearbyPages.forEach(pageNum => {
        setPageState(pageNum, { isNearby: true });
      });
      
      setViewport({
        visiblePages: newVisiblePages,
        nearbyPages: newNearbyPages,
        scrollPosition: containerRef.current?.scrollTop || 0
      });
    }
  }, [setViewport, setPageState, updateNearbyPages]);
  
  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: containerRef.current,
      rootMargin: '200px 0px', // Increased from 100px to 200px
      threshold: [0, 0.1, 0.5, 1.0] // Added more thresholds for better tracking
    });
    
    // Observe all page elements
    const pageElements = containerRef.current.querySelectorAll('[data-page-num]');
    pageElements.forEach(element => {
      observerRef.current?.observe(element);
    });
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [containerRef, handleIntersection, scrollThreshold]);
  
  // Handle scroll position restoration
  const restoreScrollPosition = useCallback((position) => {
    if (containerRef.current) {
      containerRef.current.scrollTop = position;
    }
  }, []);
  
  return {
    visiblePages: viewport.visiblePages,
    nearbyPages: viewport.nearbyPages,
    scrollPosition: viewport.scrollPosition,
    restoreScrollPosition
  };
};

export default useViewport; 