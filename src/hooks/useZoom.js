import { useCallback } from 'react';
import usePDFStore from './usePDFStore';

const useZoom = () => {
  const { scale, setScale } = usePDFStore();

  const handleZoomChange = useCallback((newScale) => {
    // Ensure scale is within bounds and rounded to 2 decimal places
    const boundedScale = Math.min(Math.max(newScale, 0.5), 3.0);
    const roundedScale = Math.round(boundedScale * 100) / 100;
    setScale(roundedScale);
  }, [setScale]);

  const handleZoomIn = useCallback(() => {
    setScale(prevScale => {
      const newScale = prevScale * 1.2;
      return Math.min(Math.max(newScale, 0.5), 3.0);
    });
  }, [setScale]);

  const handleZoomOut = useCallback(() => {
    setScale(prevScale => {
      const newScale = prevScale / 1.2;
      return Math.min(Math.max(newScale, 0.5), 3.0);
    });
  }, [setScale]);

  const handleZoomReset = useCallback(() => {
    setScale(1.0);
  }, [setScale]);

  return {
    scale,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset
  };
};

export default useZoom;