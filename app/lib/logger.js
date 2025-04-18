'use client';

// Define log levels
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
};

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Browser-safe logger that falls back to console methods
 * This version maintains the same API as the server version but works in the browser
 */
function createLogger() {
  return {
    debug: (message, data) => {
      if (isBrowser) {
        console.debug(`[${LOG_LEVELS.DEBUG}] ${message}`, data || '');
      }
    },
    info: (message, data) => {
      if (isBrowser) {
        console.info(`[${LOG_LEVELS.INFO}] ${message}`, data || '');
      }
    },
    warning: (message, data) => {
      if (isBrowser) {
        console.warn(`[${LOG_LEVELS.WARNING}] ${message}`, data || '');
      }
    },
    error: (message, data) => {
      if (isBrowser) {
        console.error(`[${LOG_LEVELS.ERROR}] ${message}`, data || '');
      }
    }
  };
}

// Create and export the loggers with the same API
export const logger = createLogger();
export const tcbsLogger = createLogger();

// For consistency with the original API
export function logToFile() {
  // No-op in browser environment
}

export function logToSpecificFile() {
  // No-op in browser environment
}

export default logger; 