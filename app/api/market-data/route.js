import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { serverLogger as logger, tcbsServerLogger as tcbsLogger } from '../../lib/server-logger';
import { PrismaClient } from '@prisma/client';
import { sanitizeError, secureLog } from '../../lib/error-handler';

// Create a singleton Prisma instance with connection management
const globalForPrisma = global;

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

globalForPrisma.prisma = globalForPrisma.prisma || prismaClientSingleton();
const prisma = globalForPrisma.prisma;

// Cache duration in milliseconds (1 hour default)
const CACHE_DURATION_MS = parseInt(process.env.STOCK_PRICE_CACHE_DURATION || '3600000', 10);
// Add a memory cache to supplement the database cache
const memoryCache = new Map();
const MEMORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function fetchMarketData(ticker, from, to) {
  // Fix: Use proper URL construction to avoid malformed URLs
  const baseUrl = process.env.TCBS_API_URL || 'https://apipubaws.tcbs.com.vn';
  const apiPath = '/stock-insight/v1/stock/bars-long-term';
  const queryParams = `ticker=${ticker}&type=stock&resolution=D&from=${from}&to=${to}`;
  
  // Construct a proper URL by ensuring no line breaks
  const requestUrl = `${baseUrl}${apiPath}?${queryParams}`;
  
  tcbsLogger.info(`Fetching market data from TCBS API`, { 
    ticker, 
    from, 
    to, 
    url: requestUrl 
  });
  
  try {
    // Validate URL before fetch
    new URL(requestUrl); // This will throw if URL is invalid
    
    const response = await fetch(requestUrl);
    const status = response.status;
    
    tcbsLogger.info(`TCBS API response status`, { 
      ticker, 
      status 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      tcbsLogger.error(`TCBS API error response`, { 
        ticker, 
        status,
        error: errorText
      });
      console.error(`Error fetching market data for ${ticker}: ${status} - ${errorText}`);
      return { error: `Error fetching market data: ${status}` };
    }
    
    const data = await response.json();
    
    // Log the data structure
    tcbsLogger.debug(`API response structure`, {
      ticker,
      keys: Object.keys(data),
      sample: JSON.stringify(data).substring(0, 500)
    });
    
    // Validate data structure
    if (!data || !data.data || !Array.isArray(data.data)) {
      tcbsLogger.error(`Invalid data structure from TCBS API`, { 
        ticker, 
        dataReceived: JSON.stringify(data)
      });
      console.error(`Invalid data structure from TCBS API for ${ticker}`);
      return { error: "Invalid data structure", data };
    }
    
    // Check if data is fresh (has at least one entry)
    if (data.data.length === 0) {
      tcbsLogger.warning(`Empty data set received from TCBS API`, { 
        ticker, 
        from, 
        to 
      });
      console.warn(`No market data received for ${ticker} from ${from} to ${to}`);
      return { error: "No data available for the specified period", data: [] };
    }
    
    // Get the latest entry (current day)
    const latestEntry = data.data[data.data.length - 1];
    
    tcbsLogger.info(`Successfully fetched market data`, { 
      ticker, 
      latestEntry
    });
    
    // Return just the closing price and additional metadata
    return {
      price: latestEntry.close,
      metadata: {
        open: latestEntry.open,
        high: latestEntry.high,
        low: latestEntry.low,
        volume: latestEntry.volume,
        timestamp: latestEntry.time
      }
    };
  } catch (error) {
    tcbsLogger.error(`Exception during TCBS API call`, { 
      ticker, 
      error: error.message, 
      stack: error.stack 
    });
    console.error(`Exception fetching market data for ${ticker}:`, error);
    return { error: error.message };
  }
}

// Update getStockPriceWithCache to first check memory cache
async function getStockPriceWithCache(ticker) {
  const now = Date.now();
  const cacheKey = `price-${ticker}`;
  
  try {
    // Check memory cache first (fastest)
    if (memoryCache.has(cacheKey)) {
      const memData = memoryCache.get(cacheKey);
      if (now - memData.timestamp < MEMORY_CACHE_TTL) {
        tcbsLogger.debug(`Memory cache HIT for ${ticker}`);
        return {
          ...memData.data,
          source: 'memory-cache',
          cached: true
        };
      }
    }
    
    // Check for existing cache entry in database with timeout
    const cacheEntry = await Promise.race([
      prisma.stockPriceCache.findUnique({
        where: { symbol: ticker }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]);
    
    // If cache entry exists and is not expired
    if (cacheEntry) {
      const cacheAge = now - cacheEntry.lastUpdatedAt.getTime();
      
      if (cacheAge < CACHE_DURATION_MS) {
        // Cache hit - use cached data
        tcbsLogger.info(`Cache HIT for ${ticker}`, {
          cacheAge: `${Math.round(cacheAge / 1000 / 60)} minutes old`
        });
        
        const result = {
          price: cacheEntry.price,
          source: 'db-cache',
          cached: true,
          metadata: cacheEntry.metadata
        };
        
        // Store in memory cache too
        memoryCache.set(cacheKey, {
          data: result,
          timestamp: now
        });
        
        return result;
      }
      
      // Cache expired
      tcbsLogger.info(`Cache EXPIRED for ${ticker}`, {
        cacheAge: `${Math.round(cacheAge / 1000 / 60)} minutes old`,
        cacheDuration: `${CACHE_DURATION_MS / 1000 / 60} minutes`
      });
    } else {
      // Cache miss
      tcbsLogger.info(`Cache MISS for ${ticker}`);
    }
    
    // Set time range to fetch from TCBS
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Set specific times (7:00 AM)
    yesterday.setHours(7, 0, 0, 0); // Yesterday at 7:00 AM
    today.setHours(7, 0, 0, 0);     // Today at 7:00 AM

    // Convert dates to Unix timestamps (in seconds)
    const from = Math.floor(yesterday.getTime() / 1000);
    const to = Math.floor(today.getTime() / 1000);
    
    // Fetch fresh data from TCBS API
    const freshData = await fetchMarketData(ticker, from, to);
    
    // Check if we got an error or valid price
    if (freshData.error) {
      tcbsLogger.error(`Failed to fetch fresh data for ${ticker}`, {
        error: freshData.error
      });
      
      // If we have stale cache data, return it with a flag
      if (cacheEntry) {
        tcbsLogger.info(`Using stale cache for ${ticker} due to API error`);
        const result = {
          price: cacheEntry.price,
          source: 'stale-cache',
          cached: true,
          stale: true,
          error: freshData.error,
          metadata: cacheEntry.metadata
        };
        
        // Store in memory cache too (with a shorter TTL)
        memoryCache.set(cacheKey, {
          data: result,
          timestamp: now - MEMORY_CACHE_TTL / 2 // Half the normal TTL for stale data
        });
        
        return result;
      }
      
      // No cache data and API failed
      return freshData;
    }
    
    // We have valid fresh data, update cache
    const price = freshData.price;
    const metadata = freshData.metadata;
    
    // Store in memory cache
    const result = {
      price,
      source: 'api',
      cached: false,
      metadata
    };
    
    memoryCache.set(cacheKey, {
      data: result,
      timestamp: now
    });
    
    // Store in database cache (upsert pattern) with timeout
    try {
      await Promise.race([
        prisma.stockPriceCache.upsert({
          where: { symbol: ticker },
          update: { 
            price,
            lastUpdatedAt: new Date(now),
            metadata: metadata || {},
            updatedAt: new Date(now)
          },
          create: {
            symbol: ticker,
            price,
            lastUpdatedAt: new Date(now),
            metadata: metadata || {},
            source: 'tcbs'
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database upsert timeout')), 10000)
        )
      ]);
    } catch (dbError) {
      // Log database error but don't fail the request
      tcbsLogger.warning(`Database cache update failed for ${ticker}`, {
        error: dbError.message
      });
      // Continue without caching to database
    }
    
    tcbsLogger.info(`Updated cache for ${ticker}`, {
      price,
      timestamp: now
    });
    
    return result;
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      ticker,
      operation: 'cache_operation',
      endpoint: 'getStockPriceWithCache'
    });
    
    // If cache fails, try to get fresh data directly
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Set specific times (7:00 AM)
    yesterday.setHours(7, 0, 0, 0); // Yesterday at 7:00 AM
    today.setHours(7, 0, 0, 0);     // Today at 7:00 AM
    
    const from = Math.floor(yesterday.getTime() / 1000);
    const to = Math.floor(today.getTime() / 1000);
    
    try {
      return await fetchMarketData(ticker, from, to);
    } catch (fetchError) {
      // SECURITY FIX: Use secure logging and return sanitized error
      secureLog(fetchError, {
        ticker,
        operation: 'fetch_after_cache_error',
        endpoint: 'getStockPriceWithCache'
      });
      
      // Return sanitized error message instead of raw error details
      return { 
        error: 'Market data temporarily unavailable' 
      };
    }
  }
}

export async function GET(request) {
  const startTime = performance.now();
  const session = await getServerSession(authOptions);
  
  if (!session) {
    tcbsLogger.warning(`Unauthorized access attempt to market data API`);
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const tickers = searchParams.get('tickers');
  
  if (!tickers) {
    tcbsLogger.warning(`Missing ticker parameter`, { 
      userId: session.user.id 
    });
    return Response.json({ error: 'Missing tickers parameter' }, { status: 400 });
  }
  
  const tickerArray = tickers.split(',').map(ticker => ticker.trim().toUpperCase());
  
  // Create a cache key for the entire request
  const batchCacheKey = `batch-${tickerArray.sort().join(',')}`;
  
  // Check if we have a cached response for this exact batch of tickers
  if (memoryCache.has(batchCacheKey)) {
    const cachedBatch = memoryCache.get(batchCacheKey);
    if (Date.now() - cachedBatch.timestamp < MEMORY_CACHE_TTL) {
      tcbsLogger.info(`Batch cache HIT for [${tickerArray.join(',')}]`);
      const endTime = performance.now();
      tcbsLogger.info(`Market data API (cached batch) completed in ${Math.round(endTime - startTime)}ms`);
      return Response.json(cachedBatch.data);
    }
  }
  
  tcbsLogger.info(`Market data request received`, { 
    userId: session.user.id,
    tickers: tickerArray,
    cacheDuration: `${CACHE_DURATION_MS / 1000 / 60} minutes`
  });
  
  try {
    tcbsLogger.debug(`Starting market data fetch with caching`, { 
      tickers: tickerArray
    });
    
    // Use Promise.all for parallel processing
    const fetchStart = performance.now();
    const results = await Promise.all(
      tickerArray.map(async (ticker) => {
        const data = await getStockPriceWithCache(ticker);
        return { ticker, data };
      })
    );
    const fetchEnd = performance.now();
    
    // Count cache hits and misses
    const cacheHits = results.filter(r => r.data.cached).length;
    const cacheMisses = results.filter(r => !r.data.cached && !r.data.error).length;
    const errors = results.filter(r => r.data.error).length;
    
    // Convert results to an object with tickers as keys -> prices as values
    const marketData = results.reduce((acc, { ticker, data }) => {
      // If data has a price property, use it, otherwise return the error
      acc[ticker] = data.error ? data : data.price;
      return acc;
    }, {});
    
    // Cache the entire batch result
    memoryCache.set(batchCacheKey, {
      data: marketData,
      timestamp: Date.now()
    });
    
    const endTime = performance.now();
    tcbsLogger.info(`Market data fetch completed`, { 
      totalRequested: tickerArray.length,
      cacheHits,
      cacheMisses,
      errors,
      fetchTime: `${Math.round(fetchEnd - fetchStart)}ms`,
      totalTime: `${Math.round(endTime - startTime)}ms`
    });
    
    return Response.json(marketData);
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      userId: session?.user?.id,
      endpoint: 'GET /api/market-data',
      tickers: tickerArray,
      userAgent: request.headers.get('user-agent'),
      duration: `${Math.round(performance.now() - startTime)}ms`
    });
    
    const sanitizedError = sanitizeError(error);
    return Response.json(
      { 
        error: sanitizedError.message,
        code: sanitizedError.code 
      }, 
      { status: sanitizedError.status }
    );
  }
} 