const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { tcbsLogger } = require('./debug-logger');

// Load environment variables
dotenv.config();

// Configuration
const OUTPUT_FILE = path.join(process.cwd(), 'logs', 'market-data-function-test.json');
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Input tickers from command line arguments or use defaults
const tickers = process.argv.slice(2).length > 0 
  ? process.argv.slice(2) 
  : ['TCB', 'VNM', 'VIC', 'MSN', 'FPT'];

console.log(`Testing market data function for tickers: ${tickers.join(', ')}`);
tcbsLogger.info('Market data function test started', { tickers });

// Time range for data (from 2 days ago to yesterday)
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

// Convert dates to Unix timestamps (in seconds)
const from = Math.floor(twoDaysAgo.getTime() / 1000);
const to = Math.floor(yesterday.getTime() / 1000);

console.log(`Time range: ${from} to ${to} (${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()})`);

// Function to fetch market data (similar to the one in the route.js file)
async function fetchMarketData(ticker, from, to) {
  const requestUrl = `${process.env.TCBS_API_URL}/stock-insight/v1/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&from=${from}&to=${to}`;
  
  console.log(`\nFetching data for ${ticker}:`);
  console.log(`URL: ${requestUrl}`);
  
  tcbsLogger.info(`Fetching market data`, { 
    ticker, 
    from, 
    to, 
    url: requestUrl 
  });
  
  try {
    const startTime = Date.now();
    const response = await fetch(requestUrl);
    const responseTime = Date.now() - startTime;
    const status = response.status;
    
    console.log(`Response status: ${status} (${responseTime}ms)`);
    tcbsLogger.info(`API response status`, { 
      ticker, 
      status,
      responseTime: `${responseTime}ms`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      tcbsLogger.error(`API error response`, { 
        ticker, 
        status,
        error: errorText
      });
      console.error(`Error fetching market data for ${ticker}: ${status} - ${errorText}`);
      return { error: `Error fetching market data: ${status}` };
    }
    
    const data = await response.json();
    
    // Log the data structure
    console.log('Data structure:', Object.keys(data));
    tcbsLogger.debug(`API response structure`, {
      ticker,
      keys: Object.keys(data),
      sample: JSON.stringify(data).substring(0, 500)
    });
    
    // Validate data structure
    if (!data || !data.data || !Array.isArray(data.data)) {
      tcbsLogger.error(`Invalid data structure from API`, { 
        ticker, 
        dataReceived: JSON.stringify(data).substring(0, 500)
      });
      console.error(`Invalid data structure from API for ${ticker}`);
      return { error: "Invalid data structure", data };
    }
    
    // Check if data is fresh (has at least one entry)
    if (data.data.length === 0) {
      tcbsLogger.warning(`Empty data set received from API`, { 
        ticker, 
        from, 
        to 
      });
      console.warn(`No market data received for ${ticker} from ${from} to ${to}`);
      return { error: "No data available for the specified period", data: [] };
    }
    
    // Format the data
    const formattedData = data.data.map(item => ({
      date: new Date(item.tradingDate || item.date).toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
    
    console.log(`Retrieved ${formattedData.length} data points for ${ticker}`);
    console.log(`Latest data (${formattedData[formattedData.length - 1].date}): Close: ${formattedData[formattedData.length - 1].close}`);
    
    tcbsLogger.info(`Successfully fetched market data`, { 
      ticker, 
      entriesCount: data.data.length,
      firstEntry: formattedData[0],
      lastEntry: formattedData[formattedData.length - 1]
    });
    
    return formattedData;
  } catch (error) {
    tcbsLogger.error(`Exception during API call`, { 
      ticker, 
      error: error.message, 
      stack: error.stack 
    });
    console.error(`Exception fetching market data for ${ticker}:`, error);
    return { error: error.message };
  }
}

// Test all tickers
async function testAllTickers() {
  tcbsLogger.info('Starting batch test of market data function', { 
    tickers,
    from,
    to
  });
  
  const results = {};
  
  for (const ticker of tickers) {
    try {
      const data = await fetchMarketData(ticker, from, to);
      results[ticker] = {
        success: !data.error,
        data: data,
        error: data.error,
        entriesCount: Array.isArray(data) ? data.length : 0
      };
    } catch (error) {
      results[ticker] = {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
  
  // Save results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${OUTPUT_FILE}`);
  
  // Summary
  console.log('\nSUMMARY:');
  console.log('-'.repeat(50));
  
  const successCount = Object.values(results).filter(r => r.success).length;
  console.log(`Success: ${successCount}/${tickers.length}`);
  
  tcbsLogger.info('Test batch completed', {
    totalTested: tickers.length,
    successful: successCount,
    failed: tickers.length - successCount
  });
  
  if (successCount < tickers.length) {
    console.log('\nFailed tickers:');
    for (const ticker of tickers) {
      if (!results[ticker].success) {
        console.log(`- ${ticker}: ${results[ticker].error}`);
      }
    }
  }
  
  return results;
}

// Run the tests
testAllTickers().catch(error => {
  console.error('Fatal error:', error);
  tcbsLogger.error('Fatal error in test script', { 
    error: error.message, 
    stack: error.stack 
  });
}); 