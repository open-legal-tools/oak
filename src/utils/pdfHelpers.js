/**
 * Calculate the scale factor for a PDF page based on container width
 * @param {Object} viewport - PDF page viewport
 * @param {number} containerWidth - Container width in pixels
 * @returns {number} - Scale factor
 */
export const calculateScaleFactor = (viewport, containerWidth) => {
  const targetWidth = Math.min(800, containerWidth - 60);
  return targetWidth / viewport.width;
};

/**
 * Get visible pages in the container
 * @param {HTMLElement} container - Container element
 * @param {Object} pageRefs - References to page elements
 * @param {number} numPages - Total number of pages
 * @returns {number[]} - Array of visible page numbers
 */
export const getVisiblePages = (container, pageRefs, numPages) => {
  const visiblePages = [];
  
  if (!container) return visiblePages;
  
  const containerRect = container.getBoundingClientRect();
  
  Object.entries(pageRefs).forEach(([pageNum, ref]) => {
    if (ref) {
      const rect = ref.getBoundingClientRect();
      if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        const pageNumInt = parseInt(pageNum, 10);
        if (!isNaN(pageNumInt) && pageNumInt > 0 && pageNumInt <= numPages) {
          visiblePages.push(pageNumInt);
        }
      }
    }
  });
  
  return visiblePages;
};

/**
 * Convert canvas to optimized JPEG data URL
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {string} - JPEG data URL
 */
export const canvasToJPEG = (canvas) => {
  return canvas.toDataURL('image/jpeg', 0.92);
};

/**
 * Create a canvas context optimized for PDF rendering
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Object} - Canvas and context
 */
export const createPDFCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  
  canvas.width = width;
  canvas.height = height;
  
  // Fill with white background
  context.fillStyle = 'rgb(255, 255, 255)';
  context.fillRect(0, 0, width, height);
  
  return { canvas, context };
}; 