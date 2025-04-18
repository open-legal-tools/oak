// Zoom settings
export const ZOOM_SETTINGS = {
  MIN_SCALE: 0.5,
  MAX_SCALE: 3.0,
  DEFAULT_SCALE: 1.0,
  ZOOM_STEP: 0.1
};

// Rendering settings
export const RENDER_SETTINGS = {
  JPEG_QUALITY: 0.92,
  MAX_CANVAS_WIDTH: 800,
  RENDER_DELAY: 50,
  QUEUE_DELAY: 10
};

// Page settings
export const PAGE_SETTINGS = {
  CONTAINER_PADDING: 60,
  INTERSECTION_MARGIN: '300px 0px',
  INTERSECTION_THRESHOLD: 0.1
};

// Cache settings
export const CACHE_SETTINGS = {
  MAX_CACHE_SIZE: 50
};

// Worker settings
export const WORKER_SETTINGS = {
  WORKER_PATH: '/pdf-worker/pdf.worker.min.js'
};

// Error messages
export const ERROR_MESSAGES = {
  FILE_PROTOCOL: 'Cannot fetch from file:// URL directly, use a relative or http URL',
  PDF_UNAVAILABLE: 'PDF reading capability is not available',
  UNKNOWN_ERROR: 'Unknown error'
}; 