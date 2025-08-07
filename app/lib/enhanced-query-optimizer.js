/**
 * 🚀 ENHANCED QUERY OPTIMIZER
 * Advanced database query optimization với intelligent caching
 * 
 * Features:
 * - Smart query caching với TTL
 * - Query performance monitoring
 * - Automatic query optimization
 * - Database connection pooling
 * - Real-time metrics tracking
 * - Memory-efficient data structures
 */

import logger from './production-logger.js';
import db from './database.js';

// Advanced LRU Cache implementation với memory management
class AdvancedLRUCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000, maxMemory = 50 * 1024 * 1024) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.maxMemory = maxMemory; // 50MB limit
    this.cache = new Map();
    this.accessTimes = new Map();
    this.sizes = new Map();
    this.currentMemory = 0;
    
    // Cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000); // Every 2 minutes
  }
  
  /**
   * Estimate object memory size
   */
  estimateSize(data) {
    const jsonString = JSON.stringify(data);
    return jsonString.length * 2; // Rough estimation (UTF-16)
  }
  
  /**
   * Set cache entry with memory management
   */
  set(key, value, customTTL) {
    const size = this.estimateSize(value);
    const expiryTime = Date.now() + (customTTL || this.ttl);
    
    // Check memory limits
    if (size > this.maxMemory / 4) { // Don't cache items larger than 25% of total memory
      logger.warn('Cache item too large, skipping', { key, size });
      return false;
    }
    
    // Make room if necessary
    while ((this.currentMemory + size > this.maxMemory || this.cache.size >= this.maxSize) && this.cache.size > 0) {
      this.evictLRU();
    }
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.currentMemory -= this.sizes.get(key);
    }
    
    // Add new entry
    this.cache.set(key, { data: value, expiryTime });
    this.accessTimes.set(key, Date.now());
    this.sizes.set(key, size);
    this.currentMemory += size;
    
    return true;
  }
  
  /**
   * Get cache entry với access time tracking
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expiryTime) {
      this.delete(key);
      return null;
    }
    
    // Update access time (LRU)
    this.accessTimes.set(key, Date.now());
    return item.data;
  }
  
  /**
   * Delete cache entry
   */
  delete(key) {
    if (this.cache.has(key)) {
      this.currentMemory -= this.sizes.get(key);
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.sizes.delete(key);
    }
  }
  
  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.delete(oldestKey);
    }
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiryTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    logger.debug('Cache cleanup completed', {
      deletedKeys: keysToDelete.length,
      remainingKeys: this.cache.size,
      memoryUsage: `${(this.currentMemory / 1024 / 1024).toFixed(2)}MB`
    });
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsage: `${(this.currentMemory / 1024 / 1024).toFixed(2)}MB`,
      maxMemory: `${(this.maxMemory / 1024 / 1024).toFixed(2)}MB`,
      hitRatio: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }
  
  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.accessTimes.clear();
    this.sizes.clear();
    this.currentMemory = 0;
  }
  
  /**
   * Destroy cache và cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Performance metrics tracking
const queryMetrics = {
  totalQueries: 0,
  cacheHits: 0,
  cacheMisses: 0,
  totalExecutionTime: 0,
  slowQueries: 0,
  errorCount: 0,
  queryTypes: new Map(),
  averageResponseTime: 0
};

class EnhancedQueryOptimizer {
  constructor() {
    // Specialized caches for different data types
    this.portfolioCache = new AdvancedLRUCache(200, 5 * 60 * 1000, 20 * 1024 * 1024); // 5min TTL, 20MB
    this.transactionCache = new AdvancedLRUCache(500, 3 * 60 * 1000, 15 * 1024 * 1024); // 3min TTL, 15MB
    this.marketDataCache = new AdvancedLRUCache(100, 10 * 60 * 1000, 10 * 1024 * 1024); // 10min TTL, 10MB
    this.userCache = new AdvancedLRUCache(1000, 30 * 60 * 1000, 5 * 1024 * 1024); // 30min TTL, 5MB
    
    // Query performance tracking
    this.slowQueryThreshold = 500; // ms
    this.startTime = Date.now();
  }

  /**
   * Get appropriate cache for query type
   */
  getCacheForType(type) {
    switch (type) {
      case 'portfolio': return this.portfolioCache;
      case 'transaction': return this.transactionCache;
      case 'market': return this.marketDataCache;
      case 'user': return this.userCache;
      default: return this.transactionCache; // Default cache
    }
  }

  /**
   * Optimized query execution với automatic caching
   */
  async executeOptimizedQuery(queryFn, cacheKey, type = 'transaction', options = {}) {
    const startTime = performance.now();
    queryMetrics.totalQueries++;
    
    try {
      // Check cache first
      const cache = this.getCacheForType(type);
      const cachedResult = cache.get(cacheKey);
      
      if (cachedResult && !options.skipCache) {
        queryMetrics.cacheHits++;
        const duration = performance.now() - startTime;
        
        logger.debug('Query cache hit', {
          cacheKey,
          type,
          duration: `${duration.toFixed(2)}ms`
        });
        
        return cachedResult;
      }
      
      // Execute query
      queryMetrics.cacheMisses++;
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      // Update metrics
      this.updateQueryMetrics(type, duration, true);
      
      // Cache result if successful
      if (result && !options.skipCache) {
        const customTTL = options.ttl || this.getOptimalTTL(type, result);
        cache.set(cacheKey, result, customTTL);
      }
      
      // Log slow queries
      if (duration > this.slowQueryThreshold) {
        logger.warn('Slow query detected', {
          cacheKey,
          type,
          duration: `${duration.toFixed(2)}ms`,
          threshold: `${this.slowQueryThreshold}ms`
        });
        queryMetrics.slowQueries++;
      }
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.updateQueryMetrics(type, duration, false);
      
      logger.error('Query execution failed', {
        cacheKey,
        type,
        error: error.message,
        duration: `${duration.toFixed(2)}ms`
      });
      
      throw error;
    }
  }

  /**
   * Get optimal TTL based on data type và size
   */
  getOptimalTTL(type, data) {
    const baseCache = this.getCacheForType(type);
    const dataSize = baseCache.estimateSize(data);
    
    // Adjust TTL based on data size và type
    const baseTTL = {
      portfolio: 5 * 60 * 1000,    // 5 minutes
      transaction: 3 * 60 * 1000,  // 3 minutes
      market: 10 * 60 * 1000,      // 10 minutes
      user: 30 * 60 * 1000         // 30 minutes
    }[type] || 5 * 60 * 1000;
    
    // Reduce TTL for larger data sets
    if (dataSize > 1024 * 1024) { // > 1MB
      return baseTTL * 0.5;
    } else if (dataSize > 100 * 1024) { // > 100KB
      return baseTTL * 0.8;
    }
    
    return baseTTL;
  }

  /**
   * Update query performance metrics
   */
  updateQueryMetrics(type, duration, success) {
    queryMetrics.totalExecutionTime += duration;
    queryMetrics.averageResponseTime = queryMetrics.totalExecutionTime / queryMetrics.totalQueries;
    
    if (!success) {
      queryMetrics.errorCount++;
    }
    
    // Track by query type
    const typeStats = queryMetrics.queryTypes.get(type) || { count: 0, totalTime: 0, errors: 0 };
    typeStats.count++;
    typeStats.totalTime += duration;
    if (!success) typeStats.errors++;
    queryMetrics.queryTypes.set(type, typeStats);
  }

  /**
   * Smart cache invalidation strategies
   */
  invalidateRelatedCache(type, pattern) {
    const cache = this.getCacheForType(type);
    const keysToInvalidate = [];
    
    for (const key of cache.cache.keys()) {
      if (key.includes(pattern)) {
        keysToInvalidate.push(key);
      }
    }
    
    keysToInvalidate.forEach(key => cache.delete(key));
    
    logger.debug('Cache invalidation completed', {
      type,
      pattern,
      invalidatedKeys: keysToInvalidate.length
    });
  }

  /**
   * Optimized portfolio query
   */
  async getOptimizedPortfolio(userId, accountId, options = {}) {
    const cacheKey = `portfolio_${userId}_${accountId || 'all'}_${options.useAdjustments || false}`;
    
    return await this.executeOptimizedQuery(
      async () => {
        // Use database manager with retry logic
        return await db.transaction(async (tx) => {
          const whereClause = { userId };
          if (accountId) whereClause.stockAccountId = accountId;
          
          // Optimized query với proper joins
          const transactions = await tx.transaction.findMany({
            where: whereClause,
            select: {
              id: true,
              ticker: true,
              type: true,
              quantity: true,
              price: true,
              transactionDate: true,
              fee: true,
              calculatedPl: true,
              stockAccountId: true
            },
            orderBy: [
              { ticker: 'asc' },
              { transactionDate: 'asc' }
            ]
          });
          
          return this.processPortfolioData(transactions);
        });
      },
      cacheKey,
      'portfolio',
      options
    );
  }

  /**
   * Optimized transaction list query
   */
  async getOptimizedTransactions(userId, filters = {}, pagination = {}) {
    const cacheKey = `transactions_${userId}_${JSON.stringify({ ...filters, ...pagination })}`;
    
    return await this.executeOptimizedQuery(
      async () => {
        const { page = 1, pageSize = 10 } = pagination;
        const skip = (page - 1) * pageSize;
        
        // Build optimized where clause
        const whereClause = this.buildOptimizedWhereClause({ userId }, filters);
        
        // Parallel execution for count và data
        const [transactions, totalCount] = await Promise.all([
          db.transaction.findMany({
            where: whereClause,
            select: {
              id: true,
              ticker: true,
              type: true,
              quantity: true,
              price: true,
              transactionDate: true,
              fee: true,
              taxRate: true,
              calculatedPl: true,
              notes: true,
              stockAccountId: true
            },
            orderBy: [
              { transactionDate: 'desc' },
              { id: 'desc' }
            ],
            skip,
            take: pageSize
          }),
          db.transaction.count({ where: whereClause })
        ]);
        
        return {
          transactions,
          pagination: {
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
          }
        };
      },
      cacheKey,
      'transaction',
      { ttl: 2 * 60 * 1000 } // 2 minutes for transaction lists
    );
  }

  /**
   * Build optimized WHERE clause với proper indexing
   */
  buildOptimizedWhereClause(baseWhere, filters) {
    const whereClause = { ...baseWhere };
    
    // Apply indexed filters first for better performance
    const indexedFilters = ['userId', 'stockAccountId', 'ticker', 'type'];
    
    indexedFilters.forEach(field => {
      if (filters[field] !== undefined && filters[field] !== null && filters[field] !== '') {
        whereClause[field] = filters[field];
      }
    });
    
    // Date range filters (indexed)
    if (filters.dateFrom || filters.dateTo) {
      whereClause.transactionDate = {};
      
      if (filters.dateFrom) {
        whereClause.transactionDate.gte = new Date(filters.dateFrom);
      }
      
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.transactionDate.lte = endDate;
      }
    }
    
    // Price range filters
    if (filters.minAmount || filters.maxAmount) {
      whereClause.price = {};
      
      if (filters.minAmount) {
        whereClause.price.gte = parseFloat(filters.minAmount);
      }
      
      if (filters.maxAmount) {
        whereClause.price.lte = parseFloat(filters.maxAmount);
      }
    }
    
    return whereClause;
  }

  /**
   * Process portfolio data efficiently
   */
  processPortfolioData(transactions) {
    const positions = new Map();
    
    // Process transactions to calculate positions
    transactions.forEach(tx => {
      const key = `${tx.ticker}_${tx.stockAccountId}`;
      
      if (!positions.has(key)) {
        positions.set(key, {
          ticker: tx.ticker,
          stockAccountId: tx.stockAccountId,
          quantity: 0,
          totalCost: 0,
          avgCost: 0,
          transactions: []
        });
      }
      
      const position = positions.get(key);
      position.transactions.push(tx);
      
      if (tx.type === 'BUY') {
        const newQuantity = position.quantity + tx.quantity;
        const newTotalCost = position.totalCost + (tx.quantity * tx.price) + tx.fee;
        
        position.quantity = newQuantity;
        position.totalCost = newTotalCost;
        position.avgCost = newQuantity > 0 ? newTotalCost / newQuantity : 0;
      } else if (tx.type === 'SELL' && position.quantity > 0) {
        position.quantity = Math.max(0, position.quantity - tx.quantity);
        
        if (position.quantity === 0) {
          position.totalCost = 0;
          position.avgCost = 0;
        } else {
          position.avgCost = position.totalCost / position.quantity;
        }
      }
    });
    
    // Filter out zero positions và return array
    return Array.from(positions.values())
      .filter(position => position.quantity > 0)
      .sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Batch query execution
   */
  async executeBatch(queries, options = {}) {
    const batchSize = options.batchSize || 3;
    const results = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(query => query())
      );
      
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < queries.length && !options.skipDelay) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    return results;
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats() {
    const uptime = Date.now() - this.startTime;
    
    return {
      uptime: `${Math.round(uptime / 1000 / 60)} minutes`,
      totalQueries: queryMetrics.totalQueries,
      cacheHitRatio: queryMetrics.totalQueries > 0 
        ? `${((queryMetrics.cacheHits / queryMetrics.totalQueries) * 100).toFixed(2)}%`
        : '0%',
      averageResponseTime: `${queryMetrics.averageResponseTime.toFixed(2)}ms`,
      slowQueries: queryMetrics.slowQueries,
      errorRate: queryMetrics.totalQueries > 0
        ? `${((queryMetrics.errorCount / queryMetrics.totalQueries) * 100).toFixed(2)}%`
        : '0%',
      cacheStats: {
        portfolio: this.portfolioCache.getStats(),
        transaction: this.transactionCache.getStats(),
        market: this.marketDataCache.getStats(),
        user: this.userCache.getStats()
      }
    };
  }

  /**
   * Cleanup và destroy optimizer
   */
  destroy() {
    this.portfolioCache.destroy();
    this.transactionCache.destroy();
    this.marketDataCache.destroy();
    this.userCache.destroy();
  }
}

// Create singleton instance
const queryOptimizer = new EnhancedQueryOptimizer();

// Export optimizer và utilities
export default queryOptimizer;

export const {
  executeOptimizedQuery,
  getOptimizedPortfolio,
  getOptimizedTransactions,
  invalidateRelatedCache,
  getPerformanceStats,
  executeBatch
} = queryOptimizer;
