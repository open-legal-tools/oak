/**
 * A centralized logging utility for the application
 * Enables consistent logging across components with the ability to:
 * - Enable/disable all logs globally
 * - Enable/disable specific categories of logs
 * - Set different log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  categories: {
    [category: string]: boolean;
  };
}

// Default configuration
const defaultConfig: LoggerConfig = {
  // Default to true - can be disabled programmatically when needed
  enabled: true,
  level: 'info',
  categories: {
    layout: true,
    redux: true,       // Enable Redux logs for development
    redux_error: true, // Keep redux error logs enabled
    document: true,
    render: true,
    component: true,
    debug: true,       // Enable debug logs for development
    pdf: true,         // Enable PDF logs by default
    pdfium: true,      // Enable PDFium logs by default
  }
};

// Current configuration (can be updated at runtime)
let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 */
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  config = { ...config, ...newConfig };
  
  if (newConfig.categories) {
    config.categories = { ...config.categories, ...newConfig.categories };
  }
};

/**
 * Get the current logger configuration (read-only)
 */
export const getLoggerConfig = (): Readonly<LoggerConfig> => {
  return { ...config };
};

/**
 * Disable all logging
 */
export const disableAllLogs = () => {
  config.enabled = false;
};

/**
 * Enable all logging
 */
export const enableAllLogs = () => {
  config.enabled = true;
};

/**
 * Enable/disable specific category
 */
export const setCategoryEnabled = (category: string, enabled: boolean) => {
  config.categories[category] = enabled;
};

/**
 * Set multiple categories at once
 */
export const setCategoriesEnabled = (categories: Record<string, boolean>) => {
  Object.entries(categories).forEach(([category, enabled]) => {
    config.categories[category] = enabled;
  });
};

/**
 * Enable/disable Redux logging
 */
export const setReduxLogging = (enabled: boolean) => {
  config.categories['redux'] = enabled;
};

/**
 * Enable/disable Redux error logging
 * This is separate from general Redux logging to provide finer control
 */
export const setReduxErrorLogging = (enabled: boolean) => {
  config.categories['redux_error'] = enabled;
};

/**
 * The main logger function
 */
export const logger = {
  debug: (category: string, message: string, ...args: any[]) => {
    if (shouldLog(category, 'debug')) {
      console.debug(`[${category}] ${message}`, ...args);
    }
  },
  
  info: (category: string, message: string, ...args: any[]) => {
    if (shouldLog(category, 'info')) {
      console.info(`[${category}] ${message}`, ...args);
    }
  },
  
  warn: (category: string, message: string, ...args: any[]) => {
    if (shouldLog(category, 'warn')) {
      console.warn(`[${category}] ${message}`, ...args);
    }
  },
  
  error: (category: string, message: string, ...args: any[]) => {
    // Use redux_error category for redux errors to allow separate control
    const actualCategory = category === 'redux' ? 'redux_error' : category;
    if (shouldLog(actualCategory, 'error')) {
      console.error(`[${category}] ${message}`, ...args);
    }
  },
  
  group: (category: string, title: string) => {
    if (shouldLog(category, 'debug')) {
      console.group(`[${category}] ${title}`);
    }
  },
  
  groupCollapsed: (category: string, title: string) => {
    if (shouldLog(category, 'debug')) {
      console.groupCollapsed(`[${category}] ${title}`);
    }
  },
  
  groupEnd: () => {
    if (config.enabled) {
      console.groupEnd();
    }
  },
  
  // Allow checking current logger configuration
  getConfig: () => getLoggerConfig()
};

// Helper to determine if a log should be shown
function shouldLog(category: string, level: LogLevel): boolean {
  if (!config.enabled) return false;
  
  // Check if the category is enabled
  if (!(category in config.categories)) {
    config.categories[category] = true; // Add new categories by default
  }
  
  if (!config.categories[category]) return false;
  
  // Check log level
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const configLevelIndex = levels.indexOf(config.level);
  const messageLevelIndex = levels.indexOf(level);
  
  return messageLevelIndex >= configLevelIndex;
}