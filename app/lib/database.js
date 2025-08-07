/**
 * 🔧 ENHANCED DATABASE MANAGER
 * Single source of truth cho database connections
 * Thay thế multiple Prisma instances bằng singleton pattern
 * 
 * Features:
 * - Singleton Prisma client
 * - Connection pool optimization  
 * - Automatic retry with exponential backoff
 * - Connection monitoring & metrics
 * - Production-ready error handling
 * - Graceful shutdown handling
 */

import { PrismaClient } from '@prisma/client';
import logger from './production-logger.js';

// Connection configuration based on environment
const CONNECTION_CONFIG = {
  development: {
    connectionLimit: 3,
    poolTimeout: 20,
    statementTimeout: 15000,
    logLevel: ['error', 'warn'],
    maxRetries: 2
  },
  production: {
    connectionLimit: 5,
    poolTimeout: 30,
    statementTimeout: 30000,
    logLevel: ['error'],
    maxRetries: 3
  }
};

// Connection metrics tracking
const connectionMetrics = {
  totalQueries: 0,
  successfulQueries: 0,
  failedQueries: 0,
  retries: 0,
  averageResponseTime: 0,
  lastConnected: null,
  isHealthy: true,
  errors: new Map() // Track different types of errors
};

class DatabaseManager {
  constructor() {
    // Singleton pattern
    if (DatabaseManager.instance) {
      return DatabaseManager.instance;
    }

    this.prisma = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.shutdownCallbacks = [];
    
    // Get environment config
    this.config = CONNECTION_CONFIG[process.env.NODE_ENV] || CONNECTION_CONFIG.development;
    
    // Initialize connection
    this.initialize();
    
    // Set up graceful shutdown handlers
    this.setupGracefulShutdown();
    
    DatabaseManager.instance = this;
  }

  /**
   * Initialize database connection with optimized settings
   */
  initialize() {
    try {
      const databaseUrl = this.buildOptimizedConnectionUrl();
      
      this.prisma = new PrismaClient({
        log: this.config.logLevel.map(level => ({
          level,
          emit: 'event'
        })),
        datasources: {
          db: {
            url: databaseUrl
          }
        },
        // Add error handling configuration
        __internal: {
          engine: {
            endpoint: undefined // Let Prisma handle endpoint selection
          }
        }
      });

      // Set up event listeners for logging and metrics
      this.setupEventListeners();
      
      logger.info('Database Manager initialized', {
        environment: process.env.NODE_ENV,
        config: this.config,
        connectionUrl: this.maskConnectionUrl(databaseUrl)
      });

    } catch (error) {
      logger.fatal('Failed to initialize Database Manager', error);
      throw error;
    }
  }

  /**
   * Build optimized connection URL with proper parameters
   */
  buildOptimizedConnectionUrl() {
    const baseUrl = process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Parse existing URL to avoid duplicate parameters
    const url = new URL(baseUrl);
    
    // Clear any existing connection pool parameters to avoid conflicts
    url.searchParams.delete('connection_limit');
    url.searchParams.delete('pool_timeout');  
    url.searchParams.delete('statement_timeout');

    // Set optimized parameters
    url.searchParams.set('connection_limit', this.config.connectionLimit.toString());
    url.searchParams.set('pool_timeout', this.config.poolTimeout.toString());
    url.searchParams.set('statement_timeout', this.config.statementTimeout.toString());
    
    // Add additional performance parameters
    url.searchParams.set('socket_timeout', '60');
    url.searchParams.set('connect_timeout', '10');
    
    return url.toString();
  }

  /**
   * Mask sensitive information in connection URL for logging
   */
  maskConnectionUrl(url) {
    try {
      const parsedUrl = new URL(url);
      parsedUrl.password = '[MASKED]';
      return parsedUrl.toString();
    } catch {
      return '[INVALID_URL]';
    }
  }

  /**
   * Set up Prisma event listeners for monitoring
   */
  setupEventListeners() {
    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$on('query', (e) => {
        logger.debug('Database query executed', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          target: e.target
        });
      });
    }

    // Log database errors
    this.prisma.$on('error', (e) => {
      logger.error('Database error event', {
        message: e.message,
        target: e.target
      });
      
      this.trackError(e);
    });

    // Log warnings
    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning', {
        message: e.message,
        target: e.target
      });
    });

    // Log info messages
    this.prisma.$on('info', (e) => {
      logger.info('Database info', {
        message: e.message,
        target: e.target
      });
    });
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    if (!this.prisma) {
      throw new Error('Database Manager not initialized');
    }
    return this.prisma;
  }

  /**
   * Execute query with retry logic and metrics tracking
   */
  async withRetry(operation, context = {}) {
    const startTime = performance.now();
    let lastError;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        connectionMetrics.totalQueries++;
        
        const result = await operation();
        
        // Track successful query
        connectionMetrics.successfulQueries++;
        const duration = performance.now() - startTime;
        this.updateResponseTime(duration);
        
        // Log slow queries
        if (duration > 1000) {
          logger.warn('Slow database query detected', {
            duration: `${duration}ms`,
            attempt,
            context
          });
        }

        return result;
        
      } catch (error) {
        lastError = error;
        connectionMetrics.failedQueries++;
        
        // Check if error is retryable
        if (this.isRetryableError(error) && attempt < this.config.maxRetries) {
          connectionMetrics.retries++;
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff: 1s, 2s, 4s
          
          logger.warn('Database operation failed, retrying', {
            error: error.message,
            code: error.code,
            attempt,
            retryIn: `${delay}ms`,
            context
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          // Log non-retryable or final failure
          logger.error('Database operation failed permanently', {
            error: error.message,
            code: error.code,
            stack: error.stack,
            attempt,
            context
          });
          
          this.trackError(error);
          break;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'P1001', // Can't connect to database server
      'P1008', // Operations timed out
      'P1009', // Database already exists  
      'P1010', // Access denied
      'P1017', // Server has closed the connection
      'ECONNRESET',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message.includes('Connection terminated') ||
           error.message.includes('Connection closed') ||
           error.message.includes('timeout');
  }

  /**
   * Track error metrics
   */
  trackError(error) {
    const errorType = error.code || 'UNKNOWN';
    const count = connectionMetrics.errors.get(errorType) || 0;
    connectionMetrics.errors.set(errorType, count + 1);
    
    // Mark as unhealthy if too many critical errors
    if (this.isCriticalError(error)) {
      connectionMetrics.isHealthy = false;
      
      // Try to restore health after delay
      setTimeout(() => {
        connectionMetrics.isHealthy = true;
        logger.info('Database health status restored');
      }, 30000); // 30 seconds
    }
  }

  /**
   * Check if error is critical for health status
   */
  isCriticalError(error) {
    const criticalCodes = ['P1001', 'P1008', 'P1017'];
    return criticalCodes.includes(error.code);
  }

  /**
   * Update average response time
   */
  updateResponseTime(duration) {
    connectionMetrics.averageResponseTime = 
      (connectionMetrics.averageResponseTime + duration) / 2;
    connectionMetrics.lastConnected = new Date();
  }

  /**
   * Get connection health status
   */
  async getHealthStatus() {
    try {
      const startTime = performance.now();
      
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      
      const responseTime = performance.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime.toFixed(2)}ms`,
        metrics: {
          totalQueries: connectionMetrics.totalQueries,
          successRate: connectionMetrics.totalQueries > 0 
            ? ((connectionMetrics.successfulQueries / connectionMetrics.totalQueries) * 100).toFixed(2) + '%'
            : '0%',
          averageResponseTime: `${connectionMetrics.averageResponseTime.toFixed(2)}ms`,
          retryCount: connectionMetrics.retries,
          lastConnected: connectionMetrics.lastConnected,
          errors: Object.fromEntries(connectionMetrics.errors)
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        code: error.code,
        metrics: connectionMetrics
      };
    }
  }

  /**
   * Batch operations with controlled concurrency
   */
  async batchExecute(operations, batchSize = 3) {
    const results = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(operation => this.withRetry(operation))
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * Transaction wrapper with retry logic
   */
  async transaction(operations, options = {}) {
    return await this.withRetry(async () => {
      return await this.prisma.$transaction(
        operations,
        {
          timeout: options.timeout || 10000,
          isolationLevel: options.isolationLevel || 'ReadCommitted'
        }
      );
    }, { context: 'transaction', operationCount: operations.length });
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async () => {
      logger.info('Initiating database graceful shutdown...');
      
      try {
        // Execute shutdown callbacks
        await Promise.all(
          this.shutdownCallbacks.map(callback => callback())
        );
        
        // Disconnect Prisma client
        if (this.prisma) {
          await this.prisma.$disconnect();
          logger.info('Database connections closed successfully');
        }
        
      } catch (error) {
        logger.error('Error during database shutdown', error);
      }
    };

    // Handle various shutdown signals
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }

  /**
   * Register callback for graceful shutdown
   */
  onShutdown(callback) {
    if (typeof callback === 'function') {
      this.shutdownCallbacks.push(callback);
    }
  }

  /**
   * Manual disconnect (for testing)
   */
  async disconnect() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database manually disconnected');
    }
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics() {
    Object.assign(connectionMetrics, {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      retries: 0,
      averageResponseTime: 0,
      lastConnected: null,
      isHealthy: true,
      errors: new Map()
    });
  }
}

// Create singleton instance
const databaseManager = new DatabaseManager();

// Export convenient access methods
export default databaseManager.getClient();
export const withRetry = databaseManager.withRetry.bind(databaseManager);
export const batchExecute = databaseManager.batchExecute.bind(databaseManager);
export const transaction = databaseManager.transaction.bind(databaseManager);
export const getHealthStatus = databaseManager.getHealthStatus.bind(databaseManager);
export const onShutdown = databaseManager.onShutdown.bind(databaseManager);

// Named exports for specific use cases
export const db = databaseManager.getClient();
export const dbManager = databaseManager;
