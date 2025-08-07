/**
 * Query Optimization Utilities
 * Provides caching, batching, and performance monitoring for database queries
 */

// LRU Cache implementation for query results
class LRUCache {
  constructor(maxSize = 1000, ttl = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
  }
  
  set(key, value) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item || Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Move to end (LRU behavior)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
  
  size() {
    return this.cache.size;
  }
  
  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Request deduplication for identical API calls
const requestCache = new Map();

function dedupedApiCall(key, apiCall) {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }
  
  const promise = apiCall().finally(() => {
    requestCache.delete(key);
  });
  
  requestCache.set(key, promise);
  return promise;
}

// Performance monitoring utilities
const performanceMonitor = {
  startTimer: (operation) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      console.log(`${operation} took ${duration.toFixed(2)}ms`);
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operation} - ${duration}ms`);
      }
      
      return duration;
    };
  },
  
  logQueryPerformance: (queryName, duration, recordCount = null) => {
    const message = recordCount 
      ? `${queryName}: ${duration.toFixed(2)}ms (${recordCount} records)`
      : `${queryName}: ${duration.toFixed(2)}ms`;
    
    if (duration > 1000) {
      console.warn(`🐌 SLOW QUERY: ${message}`);
    } else if (duration > 500) {
      console.log(`⚠️  ${message}`);
    } else {
      console.log(`✅ ${message}`);
    }
  }
};

// Batch processing utilities
const batchProcessor = {
  // Batch multiple queries into a single database call
  batchQueries: async (queries) => {
    const startTime = performance.now();
    
    try {
      const results = await Promise.all(queries);
      const duration = performance.now() - startTime;
      performanceMonitor.logQueryPerformance(`Batch of ${queries.length} queries`, duration);
      return results;
    } catch (error) {
      console.error('Batch query error:', error);
      throw error;
    }
  },
  
  // Process items in batches to avoid overwhelming the database
  processBatches: async (items, batchSize, processor) => {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }
};

// Query optimization helpers
const queryOptimizer = {
  // Optimize WHERE clauses for better index usage
  optimizeWhereClause: (baseWhere, filters) => {
    const optimizedWhere = { ...baseWhere };
    
    // Apply indexed fields first for better performance
    const indexedFields = ['userId', 'stockAccountId', 'ticker', 'type', 'transactionDate'];
    
    indexedFields.forEach(field => {
      if (filters[field] !== undefined && filters[field] !== null && filters[field] !== '') {
        optimizedWhere[field] = filters[field];
      }
    });
    
    return optimizedWhere;
  },
  
  // Create efficient select clauses
  createSelectClause: (fields) => {
    return fields.reduce((select, field) => {
      select[field] = true;
      return select;
    }, {});
  },
  
  // Optimize orderBy for index usage
  optimizeOrderBy: (sortBy, sortOrder, validFields) => {
    if (!validFields.includes(sortBy)) {
      return [{ transactionDate: 'desc' }, { id: 'desc' }];
    }
    
    return [
      { [sortBy]: sortOrder.toLowerCase() },
      { id: 'desc' } // Secondary sort for consistency
    ];
  }
};

// Cache instances
const portfolioCache = new LRUCache(500, 5 * 60 * 1000); // 5 minutes TTL
const transactionCache = new LRUCache(1000, 3 * 60 * 1000); // 3 minutes TTL
const marketDataCache = new LRUCache(200, 10 * 60 * 1000); // 10 minutes TTL

// Cleanup caches periodically
setInterval(() => {
  portfolioCache.cleanup();
  transactionCache.cleanup();
  marketDataCache.cleanup();
}, 60 * 1000); // Every minute

module.exports = {
  LRUCache,
  dedupedApiCall,
  performanceMonitor,
  batchProcessor,
  queryOptimizer,
  portfolioCache,
  transactionCache,
  marketDataCache
};