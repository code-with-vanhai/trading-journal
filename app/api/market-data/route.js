import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import logger, { tcbsLogger } from '../../lib/logger';

export async function fetchMarketData(ticker, from, to) {
  const requestUrl = `${process.env.TCBS_API_URL}/stock-insight/v1/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&from=${from}&to=${to}`;
  
  tcbsLogger.info(`Fetching market data`, { 
    ticker, 
    from, 
    to, 
    url: requestUrl 
  });
  
  try {
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
    
    // Return just the closing price
    return latestEntry.close;
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

export async function GET(request) {
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
    tickers: tickerArray
  });
  
  // Set time range from 2 days ago to yesterday
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  // Convert dates to Unix timestamps (in seconds)
  const from = Math.floor(twoDaysAgo.getTime() / 1000);
  const to = Math.floor(yesterday.getTime() / 1000);
  
  try {
    tcbsLogger.debug(`Starting batch market data fetch with timestamps`, { 
      tickers: tickerArray, 
      from, 
      to,
      fromDate: new Date(from * 1000).toISOString(),
      toDate: new Date(to * 1000).toISOString()
    });
    
    const results = await Promise.all(
      tickerArray.map(async (ticker) => {
        const data = await fetchMarketData(ticker.trim(), from, to);
        return { ticker: ticker.trim(), data };
      })
    );
    
    const successfulResults = results.filter(result => !result.data.error);
    const failedResults = results.filter(result => result.data.error);
    
    tcbsLogger.info(`Batch market data fetch completed`, { 
      totalRequested: tickerArray.length,
      successful: successfulResults.length,
      failed: failedResults.length
    });
    
    if (failedResults.length > 0) {
      tcbsLogger.warning(`Some market data requests failed`, { 
        failed: failedResults.map(r => ({ 
          ticker: r.ticker, 
          error: r.data.error 
        }))
      });
    }
    
    // Convert results to an object with tickers as keys -> closing prices as values
    const marketData = results.reduce((acc, { ticker, data }) => {
      // If data is a number, it's a successful closing price, otherwise pass through the error
      acc[ticker] = typeof data === 'number' ? data : data;
      return acc;
    }, {});
    
    return Response.json(marketData);
  } catch (error) {
    tcbsLogger.error(`Global exception in market data API`, { 
      error: error.message, 
      stack: error.stack 
    });
    console.error('Error fetching market data:', error);
    return Response.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
} 