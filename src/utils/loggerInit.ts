/**
 * Logger initialization
 * This file ensures logger settings are applied immediately at startup
 */
import { configureLogger, setCategoryEnabled } from './logger';

// Configure logger with default settings
configureLogger({
  enabled: true,
  level: 'info',
  categories: {
    redux: false,      // DISABLE redux logs by default
    redux_error: true  // But keep redux error logs enabled
  }
});

export default {
  // Add initialization functions here if needed
};