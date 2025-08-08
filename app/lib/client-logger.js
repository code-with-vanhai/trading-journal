/**
 * 🌐 CLIENT-SIDE PRODUCTION LOGGER
 * Logging system cho React components và client-side code
 * 
 * Features:
 * - Browser-compatible logging
 * - Environment-aware (dev/prod)
 * - Local storage for error tracking
 * - Performance monitoring
 * - User session tracking
 */

// Client-side log levels
const LOG_LEVELS = {
  DEBUG: { level: 0, name: 'DEBUG', color: '#36b9cc' },
  INFO: { level: 1, name: 'INFO', color: '#28a745' },
  WARN: { level: 2, name: 'WARN', color: '#ffc107' },
  ERROR: { level: 3, name: 'ERROR', color: '#dc3545' },
  FATAL: { level: 4, name: 'FATAL', color: '#6f42c1' }
};

class ClientLogger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.errorQueue = [];
    this.maxQueueSize = 100;
    
    // Current log level based on environment
    this.currentLogLevel = this.isDevelopment 
      ? LOG_LEVELS.DEBUG.level 
      : LOG_LEVELS.ERROR.level;

    // Initialize error tracking
    this.initErrorTracking();
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set current user ID for context
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Core logging function for client-side
   */
  log(level, message, data = null, context = {}) {
    // Skip if level is below threshold
    if (level.level < this.currentLogLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.name,
      message,
      data: this.sanitizeClientData(data),
      context: {
        sessionId: this.sessionId,
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...context
      }
    };

    // In production, only log errors to console
    if (!this.isDevelopment && level.level >= LOG_LEVELS.ERROR.level) {
      console.error(`[${level.name}] ${message}`, data);
      this.queueError(logEntry);
    } else if (this.isDevelopment) {
      // Development: styled console output
      this.consoleLog(level, message, data);
    }

    // Store important logs in localStorage for debugging
    if (level.level >= LOG_LEVELS.WARN.level) {
      this.storeLog(logEntry);
    }
  }

  /**
   * Styled console output for development
   */
  consoleLog(level, message, data) {
    const style = `color: ${level.color}; font-weight: bold;`;
    const timestamp = new Date().toLocaleTimeString();
    
    if (data) {
      console.log(`%c[${level.name}] ${timestamp} ${message}`, style, data);
    } else {
      console.log(`%c[${level.name}] ${timestamp} ${message}`, style);
    }
  }

  /**
   * Sanitize data for client-side logging (remove sensitive info)
   */
  sanitizeClientData(data) {
    if (!data || typeof data !== 'object') return data;

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'csrf', 'api_key', 'access_token'
    ];

    const sanitized = { ...data };
    
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Debug logging - development only
   */
  debug(message, data, context) {
    this.log(LOG_LEVELS.DEBUG, message, data, context);
  }

  /**
   * Info logging
   */
  info(message, data, context) {
    this.log(LOG_LEVELS.INFO, message, data, context);
  }

  /**
   * Warning logging
   */
  warn(message, data, context) {
    this.log(LOG_LEVELS.WARN, message, data, context);
  }

  /**
   * Error logging
   */
  error(message, data, context) {
    // Capture stack trace if data is an error
    const errorData = data instanceof Error ? {
      message: data.message,
      stack: data.stack,
      name: data.name
    } : data;

    this.log(LOG_LEVELS.ERROR, message, errorData, {
      ...context,
      errorType: data instanceof Error ? data.constructor.name : 'unknown'
    });
  }

  /**
   * Fatal error logging
   */
  fatal(message, data, context) {
    this.log(LOG_LEVELS.FATAL, message, data, context);
    
    // In production, consider sending to error reporting service
    if (!this.isDevelopment) {
      this.reportFatalError(message, data);
    }
  }

  /**
   * User interaction logging
   */
  userAction(action, data, context = {}) {
    this.info(`User action: ${action}`, data, {
      ...context,
      type: 'user_interaction'
    });
  }

  /**
   * Component lifecycle logging
   */
  component(componentName, lifecycle, data = null) {
    this.debug(`Component ${componentName}: ${lifecycle}`, data, {
      type: 'component_lifecycle',
      component: componentName
    });
  }

  /**
   * API call logging
   */
  apiCall(url, method, duration, status, responseData = null) {
    const context = {
      type: 'api_call',
      url,
      method,
      duration: `${duration}ms`,
      status
    };

    if (status >= 400) {
      this.error(`API call failed: ${method} ${url}`, responseData, context);
    } else if (duration > 2000) {
      this.warn(`Slow API call: ${method} ${url}`, null, context);
    } else {
      this.debug(`API call completed: ${method} ${url}`, null, context);
    }
  }

  /**
   * Performance monitoring
   */
  performance(operation, startTime, endTime = Date.now()) {
    const duration = endTime - startTime;
    const context = {
      type: 'performance',
      operation,
      duration: `${duration}ms`
    };

    if (duration > 1000) {
      this.warn(`Slow operation: ${operation}`, null, context);
    } else {
      this.debug(`Performance: ${operation}`, null, context);
    }
  }

  /**
   * Store log in localStorage for debugging
   */
  storeLog(logEntry) {
    if (typeof localStorage === 'undefined') return;

    try {
      const logs = JSON.parse(localStorage.getItem('client_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift();
      }
      
      localStorage.setItem('client_logs', JSON.stringify(logs));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Queue error for batch sending
   */
  queueError(errorEntry) {
    this.errorQueue.push(errorEntry);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Send errors periodically or when queue is full
    if (this.errorQueue.length >= 10) {
      this.flushErrorQueue();
    }
  }

  /**
   * Send queued errors to server
   */
  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    try {
      // Send to error reporting endpoint
      const response = await fetch('/api/client-errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors: this.errorQueue,
          sessionId: this.sessionId,
          userId: this.userId
        })
      });

      if (response.ok) {
        this.errorQueue = [];
      }
    } catch (error) {
      // Ignore error reporting failures
    }
  }

  /**
   * Initialize global error tracking
   */
  initErrorTracking() {
    if (typeof window === 'undefined') return;

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason
      });
    });

    // Flush errors before page unload
    window.addEventListener('beforeunload', () => {
      this.flushErrorQueue();
    });
  }

  /**
   * Report fatal errors to external service
   */
  reportFatalError(message, data) {
    // Placeholder for external error reporting integration
    // Could integrate with Sentry, LogRocket, etc.
    console.error('FATAL ERROR:', message, data);
  }

  /**
   * Get stored logs from localStorage
   */
  getStoredLogs() {
    if (typeof localStorage === 'undefined') return [];

    try {
      return JSON.parse(localStorage.getItem('client_logs') || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearStoredLogs() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('client_logs');
    }
    this.errorQueue = [];
  }
}

// Singleton instance
const clientLogger = new ClientLogger();

// Export default logger
export default clientLogger;

// Convenient named exports for specific use cases
export const userLogger = {
  action: (action, data) => clientLogger.userAction(action, data),
  login: (userId) => {
    clientLogger.setUserId(userId);
    clientLogger.userAction('login', { userId });
  },
  logout: () => {
    clientLogger.userAction('logout');
    clientLogger.setUserId(null);
  }
};

export const componentLogger = {
  mount: (name, props) => clientLogger.component(name, 'mounted', props),
  unmount: (name) => clientLogger.component(name, 'unmounted'),
  render: (name, renderTime) => clientLogger.performance(`${name} render`, renderTime),
  error: (name, error) => clientLogger.error(`Component error: ${name}`, error)
};

export const apiLogger = {
  request: (url, method, data) => 
    clientLogger.debug(`API request: ${method} ${url}`, data),
  response: (url, method, duration, status, data) => 
    clientLogger.apiCall(url, method, duration, status, data),
  error: (url, method, error) => 
    clientLogger.error(`API error: ${method} ${url}`, error)
};

// Performance wrapper for functions
export const withPerformanceLogging = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      clientLogger.performance(name, startTime);
      return result;
    } catch (error) {
      clientLogger.performance(name, startTime);
      clientLogger.error(`Performance wrapper error: ${name}`, error);
      throw error;
    }
  };
};

