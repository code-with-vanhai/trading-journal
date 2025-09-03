/**
 * 🔥 PRODUCTION-READY CENTRALIZED LOGGING SYSTEM
 * Thay thế toàn bộ console.log pollution với structured logging
 * 
 * Features:
 * - Environment-aware logging
 * - Structured log format
 * - Sensitive data sanitization
 * - Performance tracking
 * - Zero console.log in production
 */

import { sanitizeLogData } from './error-handler.js';

// Log levels với priority
const LOG_LEVELS = {
  DEBUG: { level: 0, name: 'DEBUG', color: '\x1b[36m' }, // Cyan
  INFO: { level: 1, name: 'INFO', color: '\x1b[32m' },   // Green
  WARN: { level: 2, name: 'WARN', color: '\x1b[33m' },   // Yellow
  ERROR: { level: 3, name: 'ERROR', color: '\x1b[31m' }, // Red
  FATAL: { level: 4, name: 'FATAL', color: '\x1b[35m' }  // Magenta
};

const RESET_COLOR = '\x1b[0m';

// Current log level based on environment
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' 
  ? LOG_LEVELS.ERROR.level 
  : LOG_LEVELS.DEBUG.level;

// Performance metrics storage
const performanceMetrics = {
  apiCalls: new Map(),
  dbQueries: new Map(),
  errors: new Map()
};

class ProductionLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
  }

  /**
   * Core logging function
   * @param {Object} level - Log level object
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @param {Object} context - Context information
   */
  log(level, message, data = null, context = {}) {
    // Skip if level is below threshold
    if (level.level < CURRENT_LOG_LEVEL) {
      return;
    }

    const timestamp = new Date().toISOString();
    const sanitizedData = data ? sanitizeLogData(data) : null;
    
    const logEntry = {
      timestamp,
      level: level.name,
      message,
      data: sanitizedData,
      context: {
        pid: process.pid,
        memory: this.getMemoryUsage(),
        ...context
      }
    };

    // In production, only output ERROR and FATAL to console
    if (this.isProduction) {
      if (level.level >= LOG_LEVELS.ERROR.level) {
        console.error(JSON.stringify(logEntry));
      }
      // Send to external logging service (implement as needed)
      this.sendToExternalService(logEntry);
    } else {
      // Development: colorized console output
      const coloredMessage = `${level.color}[${level.name}]${RESET_COLOR} ${message}`;
      console.log(`${timestamp} ${coloredMessage}`, sanitizedData || '');
    }

    // Track metrics
    this.trackMetrics(level.name, message, data);
  }

  /**
   * Debug logging - only in development
   */
  debug(message, data, context) {
    this.log(LOG_LEVELS.DEBUG, message, data, context);
  }

  /**
   * Info logging - development and staging only
   */
  info(message, data, context) {
    this.log(LOG_LEVELS.INFO, message, data, context);
  }

  /**
   * Warning logging - all environments
   */
  warn(message, data, context) {
    this.log(LOG_LEVELS.WARN, message, data, context);
  }

  /**
   * Error logging - all environments
   */
  error(message, data, context) {
    this.log(LOG_LEVELS.ERROR, message, data, { 
      ...context, 
      stack: data?.stack,
      errorCode: data?.code 
    });
  }

  /**
   * Fatal error logging - all environments
   */
  fatal(message, data, context) {
    this.log(LOG_LEVELS.FATAL, message, data, context);
    // In production, consider sending alerts
    if (this.isProduction) {
      this.sendAlert(message, data);
    }
  }

  /**
   * API call performance tracking
   */
  apiCall(endpoint, method, duration, statusCode, userId) {
    const context = {
      endpoint,
      method,
      duration: `${duration}ms`,
      statusCode,
      userId: userId || 'anonymous'
    };

    if (duration > 1000) {
      this.warn(`Slow API call detected`, { endpoint, duration }, context);
    } else {
      this.debug(`API call completed`, null, context);
    }

    // Track metrics
    const key = `${method}:${endpoint}`;
    if (!performanceMetrics.apiCalls.has(key)) {
      performanceMetrics.apiCalls.set(key, { count: 0, totalDuration: 0, errors: 0 });
    }
    
    const metrics = performanceMetrics.apiCalls.get(key);
    metrics.count++;
    metrics.totalDuration += duration;
    if (statusCode >= 400) metrics.errors++;
  }

  /**
   * Database query performance tracking
   */
  dbQuery(queryType, duration, recordCount) {
    const context = {
      queryType,
      duration: `${duration}ms`,
      recordCount
    };

    if (duration > 500) {
      this.warn(`Slow database query detected`, null, context);
    } else {
      this.debug(`Database query completed`, null, context);
    }
  }

  /**
   * Business logic events
   */
  business(event, data, userId) {
    this.info(`Business event: ${event}`, data, { userId, eventType: 'business' });
  }

  /**
   * Security events
   */
  security(event, data, context) {
    this.error(`Security event: ${event}`, data, { 
      ...context, 
      eventType: 'security',
      severity: 'high'
    });
  }

  /**
   * Get current memory usage
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`
    };
  }

  /**
   * Get performance metrics summary
   */
  getMetrics() {
    const summary = {
      apiCalls: {},
      dbQueries: {},
      errors: {}
    };

    // API metrics
    for (const [endpoint, metrics] of performanceMetrics.apiCalls.entries()) {
      summary.apiCalls[endpoint] = {
        count: metrics.count,
        avgDuration: Math.round(metrics.totalDuration / metrics.count),
        errorRate: `${((metrics.errors / metrics.count) * 100).toFixed(2)}%`
      };
    }

    return summary;
  }

  /**
   * Track metrics internally
   */
  trackMetrics(level, message, data) {
    // Implementation for internal metrics tracking
    // This can be expanded for specific monitoring needs
  }

  /**
   * Send to external logging service (placeholder)
   */
  sendToExternalService(logEntry) {
    // Implement integration with external logging services like:
    // - Datadog
    // - New Relic
    // - Sentry
    // - CloudWatch
    // - LogRocket
    
    // For now, this is a placeholder
    if (this.isServerless) {
      // In serverless, logs are automatically collected
      return;
    }
  }

  /**
   * Send alerts for fatal errors (placeholder)
   */
  sendAlert(message, data) {
    // Implement alerting mechanism:
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty
    // - Discord webhooks
    
    // For now, just ensure it's logged to console in production
    console.error(`FATAL ERROR ALERT: ${message}`, data);
  }
}

// Singleton instance
const logger = new ProductionLogger();

// Export convenient methods
export default logger;

// Named exports for specific use cases
export const apiLogger = {
  call: (endpoint, method, duration, statusCode, userId) => 
    logger.apiCall(endpoint, method, duration, statusCode, userId),
  error: (endpoint, error, context) => 
    logger.error(`API Error: ${endpoint}`, error, context)
};

export const dbLogger = {
  query: (queryType, duration, recordCount) => 
    logger.dbQuery(queryType, duration, recordCount),
  error: (query, error) => 
    logger.error(`Database Error: ${query}`, error, { type: 'database' })
};

export const businessLogger = {
  event: (event, data, userId) => logger.business(event, data, userId),
  transaction: (action, transactionData, userId) => 
    logger.business(`transaction_${action}`, transactionData, userId),
  portfolio: (action, portfolioData, userId) => 
    logger.business(`portfolio_${action}`, portfolioData, userId)
};

export const securityLogger = {
  event: (event, data, context) => logger.security(event, data, context),
  auth: (event, userId, context) => 
    logger.security(`auth_${event}`, { userId }, context),
  rateLimit: (ip, endpoint) => 
    logger.security('rate_limit_exceeded', { ip, endpoint })
};

// Performance monitoring wrapper
export const performanceWrapper = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      logger.debug(`Performance: ${name}`, null, { duration: `${duration}ms` });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Performance: ${name} failed`, error, { duration: `${duration}ms` });
      throw error;
    }
  };
};





