import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import logger, { tcbsLogger } from '../../lib/logger';
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma instance
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Cache duration in milliseconds (1 hour default)
const CACHE_DURATION_MS = parseInt(process.env.STOCK_PRICE_CACHE_DURATION || '3600000', 10);

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

// Check cache and update if needed
async function getStockPriceWithCache(ticker) {
  const now = new Date();
  
  try {
    // Check for existing cache entry
    const cacheEntry = await prisma.stockPriceCache.findUnique({
      where: { symbol: ticker }
    });
    
    // If cache entry exists and is not expired
    if (cacheEntry) {
      const cacheAge = now.getTime() - cacheEntry.lastUpdatedAt.getTime();
      
      if (cacheAge < CACHE_DURATION_MS) {
        // Cache hit - use cached data
        tcbsLogger.info(`Cache HIT for ${ticker}`, {
          cacheAge: `${Math.round(cacheAge / 1000 / 60)} minutes old`
        });
        
        return {
          price: cacheEntry.price,
          source: 'cache',
          cached: true,
          metadata: cacheEntry.metadata
        };
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
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    // Convert dates to Unix timestamps (in seconds)
    const from = Math.floor(twoDaysAgo.getTime() / 1000);
    const to = Math.floor(yesterday.getTime() / 1000);
    
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
        return {
          price: cacheEntry.price,
          source: 'stale-cache',
          cached: true,
          stale: true,
          error: freshData.error,
          metadata: cacheEntry.metadata
        };
      }
      
      // No cache data and API failed
      return freshData;
    }
    
    // We have valid fresh data, update cache
    const price = freshData.price;
    const metadata = freshData.metadata;
    
    // Store in cache (upsert pattern)
    await prisma.stockPriceCache.upsert({
      where: { symbol: ticker },
      update: { 
        price,
        lastUpdatedAt: now,
        metadata: metadata || {},
        updatedAt: now 
      },
      create: {
        symbol: ticker,
        price,
        lastUpdatedAt: now,
        metadata: metadata || {},
        source: 'tcbs'
      }
    });
    
    tcbsLogger.info(`Updated cache for ${ticker}`, {
      price,
      timestamp: now
    });
    
    return {
      price,
      source: 'api',
      cached: false,
      metadata
    };
  } catch (error) {
    tcbsLogger.error(`Cache operation error for ${ticker}`, {
      error: error.message,
      stack: error.stack
    });
    
    // If cache fails, try to get fresh data directly
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const from = Math.floor(twoDaysAgo.getTime() / 1000);
    const to = Math.floor(yesterday.getTime() / 1000);
    
    try {
      return await fetchMarketData(ticker, from, to);
    } catch (fetchError) {
      tcbsLogger.error(`Failed to fetch data after cache error for ${ticker}`, {
        error: fetchError.message
      });
      return { error: `Cache error: ${error.message}, Fetch error: ${fetchError.message}` };
    }
  }
}

export async function GET(request) {
  const startTime = Date.now();
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
  
  const tickerArray = tickers.split(',');
  
  tcbsLogger.info(`Market data request received`, { 
    userId: session.user.id,
    tickers: tickerArray,
    cacheDuration: `${CACHE_DURATION_MS / 1000 / 60} minutes`
  });
  
  try {
    tcbsLogger.debug(`Starting market data fetch with caching`, { 
      tickers: tickerArray
    });
    
    // Fetch all prices with caching
    const results = await Promise.all(
      tickerArray.map(async (ticker) => {
        const ticker_clean = ticker.trim().toUpperCase();
        const data = await getStockPriceWithCache(ticker_clean);
        return { ticker: ticker_clean, data };
      })
    );
    
    // Count cache hits and misses
    const cacheHits = results.filter(r => r.data.cached).length;
    const cacheMisses = results.filter(r => !r.data.cached && !r.data.error).length;
    const errors = results.filter(r => r.data.error).length;
    
    tcbsLogger.info(`Market data fetch completed`, { 
      totalRequested: tickerArray.length,
      cacheHits,
      cacheMisses,
      errors,
      duration: `${Date.now() - startTime}ms`
    });
    
    // Convert results to an object with tickers as keys -> prices as values
    const marketData = results.reduce((acc, { ticker, data }) => {
      // If data has a price property, use it, otherwise return the error
      acc[ticker] = data.error ? data : data.price;
      return acc;
    }, {});
    
    return Response.json(marketData);
  } catch (error) {
    tcbsLogger.error(`Global exception in market data API`, { 
      error: error.message, 
      stack: error.stack,
      duration: `${Date.now() - startTime}ms`
    });
    console.error('Error fetching market data:', error);
    return Response.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
} 