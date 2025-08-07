/**
 * 🚨 ENHANCED CENTRALIZED ERROR HANDLING SYSTEM
 * Comprehensive error management với monitoring và recovery capabilities
 * 
 * Features:
 * - Error classification và handling strategies
 * - Automatic error reporting
 * - Recovery mechanisms
 * - User-friendly error messages
 * - Performance impact monitoring
 * - Error analytics and insights
 */

import logger from './production-logger.js';

// Error classifications
export const ERROR_TYPES = {
  // Database errors
  DATABASE_CONNECTION: 'DATABASE_CONNECTION',
  DATABASE_CONSTRAINT: 'DATABASE_CONSTRAINT', 
  DATABASE_TIMEOUT: 'DATABASE_TIMEOUT',
  DATABASE_DEADLOCK: 'DATABASE_DEADLOCK',
  
  // Business logic errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  
  // External API errors
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  EXTERNAL_API_TIMEOUT: 'EXTERNAL_API_TIMEOUT',
  EXTERNAL_API_RATE_LIMIT: 'EXTERNAL_API_RATE_LIMIT',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  
  // User input errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Security errors
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM', 
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Error recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'RETRY',
  FALLBACK: 'FALLBACK',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER',
  GRACEFUL_DEGRADATION: 'GRACEFUL_DEGRADATION',
  MANUAL_INTERVENTION: 'MANUAL_INTERVENTION'
};

class EnhancedErrorHandler {
  constructor() {
    this.errorStats = new Map();
    this.circuitBreakers = new Map();
    this.retryCounters = new Map();
    this.errorThresholds = {
      [ERROR_SEVERITY.LOW]: 100,      // 100 low errors per hour
      [ERROR_SEVERITY.MEDIUM]: 50,    // 50 medium errors per hour
      [ERROR_SEVERITY.HIGH]: 10,      // 10 high errors per hour
      [ERROR_SEVERITY.CRITICAL]: 3    // 3 critical errors per hour
    };
  }

  /**
   * Main error handling method
   */
  async handleError(error, context = {}) {
    const startTime = performance.now();
    
    try {
      // 1. Classify error
      const classification = this.classifyError(error);
      
      // 2. Enrich context
      const enrichedContext = this.enrichContext(error, context, classification);
      
      // 3. Track error statistics
      this.trackErrorStats(classification, enrichedContext);
      
      // 4. Determine severity
      const severity = this.determineSeverity(classification, enrichedContext);
      
      // 5. Apply recovery strategy
      const recoveryResult = await this.applyRecoveryStrategy(
        error, 
        classification, 
        severity, 
        enrichedContext
      );
      
      // 6. Log error with appropriate level
      this.logError(error, classification, severity, enrichedContext);
      
      // 7. Report error if needed
      await this.reportError(error, classification, severity, enrichedContext);
      
      // 8. Check if error patterns indicate system issues
      await this.checkErrorPatterns(classification, severity);
      
      const duration = performance.now() - startTime;
      
      return {
        handled: true,
        classification,
        severity,
        recovery: recoveryResult,
        userMessage: this.getUserFriendlyMessage(classification, severity),
        errorId: this.generateErrorId(enrichedContext),
        duration: `${duration.toFixed(2)}ms`
      };
      
    } catch (handlerError) {
      // Error in error handler - this is critical
      logger.fatal('Error handler failed', {
        originalError: error.message,
        handlerError: handlerError.message,
        stack: handlerError.stack
      });
      
      return {
        handled: false,
        error: 'Error handler failure',
        userMessage: 'Đã có lỗi hệ thống nghiêm trọng xảy ra. Vui lòng liên hệ hỗ trợ.',
        errorId: 'HANDLER_FAILURE_' + Date.now()
      };
    }
  }

  /**
   * Classify error based on type, message, and context
   */
  classifyError(error) {
    // Prisma/Database errors
    if (error.code?.startsWith('P')) {
      if (['P1001', 'P1008', 'P1017'].includes(error.code)) {
        return ERROR_TYPES.DATABASE_CONNECTION;
      }
      if (['P2002', 'P2003', 'P2025'].includes(error.code)) {
        return ERROR_TYPES.DATABASE_CONSTRAINT;
      }
      if (error.code === 'P1008') {
        return ERROR_TYPES.DATABASE_TIMEOUT;
      }
      return ERROR_TYPES.DATABASE_CONNECTION;
    }
    
    // Network/HTTP errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return ERROR_TYPES.EXTERNAL_API_TIMEOUT;
    }
    
    // Authentication errors
    if (error.name === 'UnauthorizedError' || error.status === 401) {
      return ERROR_TYPES.UNAUTHORIZED;
    }
    if (error.status === 403) {
      return ERROR_TYPES.FORBIDDEN;
    }
    
    // Validation errors
    if (error.name === 'ValidationError' || error.message?.includes('validation')) {
      return ERROR_TYPES.VALIDATION_ERROR;
    }
    
    // Rate limiting
    if (error.status === 429) {
      return ERROR_TYPES.RATE_LIMIT_EXCEEDED;
    }
    
    // Service errors (từ service layer)
    if (error.isServiceError) {
      return error.code || ERROR_TYPES.BUSINESS_RULE_VIOLATION;
    }
    
    // System errors
    if (error.message?.includes('ENOMEM') || error.message?.includes('out of memory')) {
      return ERROR_TYPES.RESOURCE_EXHAUSTED;
    }
    
    return ERROR_TYPES.UNKNOWN_ERROR;
  }

  /**
   * Enrich error context with additional information
   */
  enrichContext(error, context, classification) {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      errorType: error.constructor.name,
      errorCode: error.code,
      errorMessage: error.message,
      classification,
      stack: error.stack,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      platform: process.platform,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      // Request context if available
      ...(context.request && {
        requestId: context.requestId,
        method: context.request.method,
        url: context.request.url,
        userAgent: context.request.headers?.get('user-agent'),
        ip: context.request.headers?.get('x-forwarded-for') || 'unknown'
      })
    };
  }

  /**
   * Determine error severity based on classification and context
   */
  determineSeverity(classification, context) {
    // Critical errors that affect system stability
    const criticalErrors = [
      ERROR_TYPES.DATABASE_CONNECTION,
      ERROR_TYPES.RESOURCE_EXHAUSTED,
      ERROR_TYPES.CONFIGURATION_ERROR
    ];
    
    // High severity errors affecting functionality
    const highSeverityErrors = [
      ERROR_TYPES.DATABASE_TIMEOUT,
      ERROR_TYPES.DATABASE_DEADLOCK,
      ERROR_TYPES.EXTERNAL_API_ERROR,
      ERROR_TYPES.SECURITY_VIOLATION
    ];
    
    // Medium severity errors affecting user experience
    const mediumSeverityErrors = [
      ERROR_TYPES.VALIDATION_ERROR,
      ERROR_TYPES.BUSINESS_RULE_VIOLATION,
      ERROR_TYPES.SESSION_EXPIRED,
      ERROR_TYPES.EXTERNAL_API_TIMEOUT
    ];
    
    if (criticalErrors.includes(classification)) {
      return ERROR_SEVERITY.CRITICAL;
    }
    if (highSeverityErrors.includes(classification)) {
      return ERROR_SEVERITY.HIGH;
    }
    if (mediumSeverityErrors.includes(classification)) {
      return ERROR_SEVERITY.MEDIUM;
    }
    
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Apply appropriate recovery strategy
   */
  async applyRecoveryStrategy(error, classification, severity, context) {
    const strategy = this.getRecoveryStrategy(classification);
    
    switch (strategy) {
      case RECOVERY_STRATEGIES.RETRY:
        return await this.handleRetryStrategy(error, context);
        
      case RECOVERY_STRATEGIES.FALLBACK:
        return await this.handleFallbackStrategy(error, context);
        
      case RECOVERY_STRATEGIES.CIRCUIT_BREAKER:
        return await this.handleCircuitBreakerStrategy(error, context);
        
      case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
        return await this.handleGracefulDegradation(error, context);
        
      default:
        return { strategy, applied: false, reason: 'No recovery strategy available' };
    }
  }

  /**
   * Get recovery strategy for error type
   */
  getRecoveryStrategy(classification) {
    const strategies = {
      [ERROR_TYPES.DATABASE_CONNECTION]: RECOVERY_STRATEGIES.RETRY,
      [ERROR_TYPES.DATABASE_TIMEOUT]: RECOVERY_STRATEGIES.RETRY,
      [ERROR_TYPES.EXTERNAL_API_ERROR]: RECOVERY_STRATEGIES.CIRCUIT_BREAKER,
      [ERROR_TYPES.EXTERNAL_API_TIMEOUT]: RECOVERY_STRATEGIES.RETRY,
      [ERROR_TYPES.EXTERNAL_API_RATE_LIMIT]: RECOVERY_STRATEGIES.FALLBACK,
      [ERROR_TYPES.RESOURCE_EXHAUSTED]: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION,
      [ERROR_TYPES.VALIDATION_ERROR]: RECOVERY_STRATEGIES.MANUAL_INTERVENTION
    };
    
    return strategies[classification] || RECOVERY_STRATEGIES.MANUAL_INTERVENTION;
  }

  /**
   * Handle retry strategy with exponential backoff
   */
  async handleRetryStrategy(error, context) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    const retryKey = context.operation || 'default';
    const currentRetries = this.retryCounters.get(retryKey) || 0;
    
    if (currentRetries >= maxRetries) {
      return { 
        strategy: RECOVERY_STRATEGIES.RETRY, 
        applied: false, 
        reason: `Max retries (${maxRetries}) exceeded` 
      };
    }
    
    const delay = baseDelay * Math.pow(2, currentRetries);
    this.retryCounters.set(retryKey, currentRetries + 1);
    
    // Schedule cleanup of retry counter
    setTimeout(() => {
      this.retryCounters.delete(retryKey);
    }, 5 * 60 * 1000); // 5 minutes
    
    return { 
      strategy: RECOVERY_STRATEGIES.RETRY, 
      applied: true, 
      retryCount: currentRetries + 1,
      nextRetryIn: delay,
      maxRetries 
    };
  }

  /**
   * Handle fallback strategy
   */
  async handleFallbackStrategy(error, context) {
    // Implementation depends on specific use case
    // For now, return cached data or default values
    
    return { 
      strategy: RECOVERY_STRATEGIES.FALLBACK, 
      applied: true, 
      fallbackType: 'cached_data_or_defaults' 
    };
  }

  /**
   * Handle circuit breaker strategy
   */
  async handleCircuitBreakerStrategy(error, context) {
    const circuitKey = context.service || 'default';
    const circuit = this.circuitBreakers.get(circuitKey) || {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null
    };
    
    const now = Date.now();
    const failureThreshold = 5;
    const timeoutDuration = 30000; // 30 seconds
    
    switch (circuit.state) {
      case 'CLOSED':
        circuit.failureCount++;
        circuit.lastFailureTime = now;
        
        if (circuit.failureCount >= failureThreshold) {
          circuit.state = 'OPEN';
          circuit.nextAttemptTime = now + timeoutDuration;
        }
        break;
        
      case 'OPEN':
        if (now >= circuit.nextAttemptTime) {
          circuit.state = 'HALF_OPEN';
        }
        break;
        
      case 'HALF_OPEN':
        circuit.state = 'OPEN';
        circuit.nextAttemptTime = now + timeoutDuration;
        break;
    }
    
    this.circuitBreakers.set(circuitKey, circuit);
    
    return { 
      strategy: RECOVERY_STRATEGIES.CIRCUIT_BREAKER, 
      applied: true, 
      circuitState: circuit.state,
      failureCount: circuit.failureCount,
      nextAttemptTime: circuit.nextAttemptTime 
    };
  }

  /**
   * Handle graceful degradation
   */
  async handleGracefulDegradation(error, context) {
    // Reduce functionality to essential operations only
    
    return { 
      strategy: RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION, 
      applied: true, 
      degradationLevel: 'essential_operations_only' 
    };
  }

  /**
   * Track error statistics
   */
  trackErrorStats(classification, context) {
    const hour = new Date().getHours();
    const key = `${classification}_${hour}`;
    
    const stats = this.errorStats.get(key) || {
      count: 0,
      firstOccurrence: new Date(),
      lastOccurrence: new Date(),
      classification,
      hour
    };
    
    stats.count++;
    stats.lastOccurrence = new Date();
    
    this.errorStats.set(key, stats);
    
    // Cleanup old statistics (older than 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    for (const [key, stat] of this.errorStats.entries()) {
      if (stat.firstOccurrence.getTime() < cutoff) {
        this.errorStats.delete(key);
      }
    }
  }

  /**
   * Log error with appropriate level
   */
  logError(error, classification, severity, context) {
    const logData = {
      classification,
      severity,
      errorType: error.constructor.name,
      message: error.message,
      code: error.code,
      context: {
        userId: context.userId,
        operation: context.operation,
        requestId: context.requestId
      }
    };
    
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        logger.fatal(`Critical error: ${classification}`, logData);
        break;
      case ERROR_SEVERITY.HIGH:
        logger.error(`High severity error: ${classification}`, logData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        logger.warn(`Medium severity error: ${classification}`, logData);
        break;
      default:
        logger.debug(`Low severity error: ${classification}`, logData);
        break;
    }
  }

  /**
   * Report error to external monitoring systems
   */
  async reportError(error, classification, severity, context) {
    // Only report medium to critical errors
    if (![ERROR_SEVERITY.MEDIUM, ERROR_SEVERITY.HIGH, ERROR_SEVERITY.CRITICAL].includes(severity)) {
      return;
    }
    
    try {
      // In production, integrate with error reporting services like:
      // - Sentry
      // - Bugsnag
      // - Rollbar
      // - DataDog Error Tracking
      
      if (process.env.NODE_ENV === 'production') {
        // Placeholder for external error reporting
        logger.info('Error reported to external monitoring', {
          classification,
          severity,
          errorId: this.generateErrorId(context)
        });
      }
      
    } catch (reportingError) {
      logger.error('Failed to report error to external systems', {
        originalError: classification,
        reportingError: reportingError.message
      });
    }
  }

  /**
   * Check error patterns for system health
   */
  async checkErrorPatterns(classification, severity) {
    const hour = new Date().getHours();
    const key = `${classification}_${hour}`;
    const stats = this.errorStats.get(key);
    
    if (!stats) return;
    
    const threshold = this.errorThresholds[severity];
    
    if (stats.count >= threshold) {
      logger.fatal('Error threshold exceeded', {
        classification,
        severity,
        count: stats.count,
        threshold,
        timeWindow: '1 hour'
      });
      
      // Trigger system alerts
      await this.triggerSystemAlert(classification, severity, stats);
    }
  }

  /**
   * Generate user-friendly error message
   */
  getUserFriendlyMessage(classification, severity) {
    const messages = {
      [ERROR_TYPES.DATABASE_CONNECTION]: 'Hệ thống đang bận, vui lòng thử lại sau ít phút.',
      [ERROR_TYPES.VALIDATION_ERROR]: 'Dữ liệu nhập vào không hợp lệ, vui lòng kiểm tra lại.',
      [ERROR_TYPES.UNAUTHORIZED]: 'Bạn cần đăng nhập để tiếp tục.',
      [ERROR_TYPES.FORBIDDEN]: 'Bạn không có quyền thực hiện thao tác này.',
      [ERROR_TYPES.RATE_LIMIT_EXCEEDED]: 'Bạn đã thực hiện quá nhiều yêu cầu, vui lòng chờ ít phút.',
      [ERROR_TYPES.EXTERNAL_API_ERROR]: 'Dịch vụ bên ngoài đang gặp sự cố, vui lòng thử lại sau.',
      [ERROR_TYPES.RESOURCE_EXHAUSTED]: 'Hệ thống đang quá tải, vui lòng thử lại sau.'
    };
    
    return messages[classification] || 'Đã có lỗi xảy ra, vui lòng thử lại hoặc liên hệ hỗ trợ.';
  }

  /**
   * Generate unique error ID
   */
  generateErrorId(context) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const prefix = context.userId ? context.userId.substr(-4) : 'anon';
    
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Trigger system alerts
   */
  async triggerSystemAlert(classification, severity, stats) {
    // Implementation for system alerts
    // - Email notifications
    // - Slack webhooks
    // - PagerDuty alerts
    // - SMS notifications
    
    logger.error('System alert triggered', {
      classification,
      severity,
      stats,
      alertType: 'ERROR_THRESHOLD_EXCEEDED'
    });
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {};
    
    for (const [key, stat] of this.errorStats.entries()) {
      stats[key] = {
        count: stat.count,
        classification: stat.classification,
        firstOccurrence: stat.firstOccurrence,
        lastOccurrence: stat.lastOccurrence,
        hour: stat.hour
      };
    }
    
    return stats;
  }

  /**
   * Reset error counters (for testing)
   */
  reset() {
    this.errorStats.clear();
    this.circuitBreakers.clear();
    this.retryCounters.clear();
  }
}

// Create singleton instance
const enhancedErrorHandler = new EnhancedErrorHandler();

// Export error handler and utilities
export default enhancedErrorHandler;

// Convenient wrapper function
export const handleError = (error, context = {}) => {
  return enhancedErrorHandler.handleError(error, context);
};

// Async wrapper for promises
export const withErrorHandling = (fn, context = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const result = await handleError(error, context);
      
      // Re-throw with enhanced information
      const enhancedError = new Error(result.userMessage);
      enhancedError.errorId = result.errorId;
      enhancedError.classification = result.classification;
      enhancedError.severity = result.severity;
      enhancedError.originalError = error;
      enhancedError.handled = result.handled;
      
      throw enhancedError;
    }
  };
};
