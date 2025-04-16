const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { tcbsLogger } = require('./debug-logger');

// Load environment variables
dotenv.config();

// Configuration
const OUTPUT_FILE = path.join(process.cwd(), 'logs', 'tcbs-api-debug.json');
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Input tickers from command line arguments or use defaults
const tickers = process.argv.slice(2).length > 0 
  ? process.argv.slice(2) 
  : ['TCB', 'VNM', 'VIC', 'MSN', 'FPT'];

// Time range for EOD data (from 2 days ago to yesterday)
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

// Convert dates to Unix timestamps (in seconds)
const from = Math.floor(twoDaysAgo.getTime() / 1000);
const to = Math.floor(yesterday.getTime() / 1000);

console.log(`Checking EOD data for tickers: ${tickers.join(', ')}`);
console.log(`Time range: ${from} to ${to} (${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()})`);

tcbsLogger.info('Debug TCBS API script started', {
  tickers,
  timeRange: { 
    from, 
    to,
    fromDate: new Date(from * 1000).toISOString(),
    toDate: new Date(to * 1000).toISOString()
  }
});

// Test each ticker
async function testTicker(ticker) {
  const url = `${process.env.TCBS_API_URL}/stock-insight/v1/stock/bars-long-term?ticker=${ticker}&type=stock&resolution=D&from=${from}&to=${to}`;
  
  console.log(`\nFetching data for ${ticker}:`);
  console.log(`URL: ${url}`);
  
  tcbsLogger.info(`Testing API for ticker`, { ticker, url });
  
  try {
    const startTime = Date.now();
    const response = await fetch(url);
    const responseTime = Date.now() - startTime;
    
    console.log(`Response status: ${response.status} (${responseTime}ms)`);
    tcbsLogger.info(`API response received`, { 
      ticker, 
      status: response.status, 
      responseTime: `${responseTime}ms` 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching data for ${ticker}: HTTP ${response.status}`);
      tcbsLogger.error(`API error response`, { 
        ticker, 
        status: response.status, 
        error: errorText
      });
      
      return {
        ticker,
        status: response.status,
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${errorText}`,
        data: null
      };
    }
    
    const data = await response.json();
    
    // Log the data structure for debugging
    console.log('Data structure:', Object.keys(data));
    console.log('Data sample (first 100 chars):', JSON.stringify(data).substring(0, 100));
    tcbsLogger.debug(`Raw API response structure`, {
      ticker,
      keys: Object.keys(data),
      sample: JSON.stringify(data).substring(0, 500)
    });
    
    if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
      console.error(`No price data found for ${ticker}`);
      tcbsLogger.warning(`No data returned for ticker`, { 
        ticker, 
        dataStructure: JSON.stringify(data).substring(0, 200) 
      });
      
      return {
        ticker,
        status: response.status,
        success: false,
        responseTime,
        error: 'No price data found',
        data
      };
    }
    
    const latestEntry = data.data[data.data.length - 1];
    console.log(`Latest data for ${ticker}:`, latestEntry);
    
    tcbsLogger.info(`Successfully retrieved data for ticker`, { 
      ticker, 
      entriesCount: data.data.length,
      latestEntry
    });
    
    return {
      ticker,
      status: response.status,
      success: true,
      responseTime,
      error: null,
      data: data,
      latestEntry
    };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    tcbsLogger.error(`Exception during API call`, { 
      ticker, 
      error: error.message, 
      stack: error.stack 
    });
    
    return {
      ticker,
      success: false,
      responseTime: null,
      error: error.message,
      data: null
    };
  }
}

// Test all tickers and save results
async function testAllTickers() {
  tcbsLogger.info('Starting batch test of all tickers', { tickers });
  
  const results = {};
  const promises = tickers.map(ticker => testTicker(ticker));
  
  const tickerResults = await Promise.all(promises);
  
  tickerResults.forEach(result => {
    results[result.ticker] = result;
  });
  
  // Save results to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${OUTPUT_FILE}`);
  
  // Summary
  console.log('\nSUMMARY:');
  console.log('-'.repeat(50));
  
  const successCount = tickerResults.filter(r => r.success).length;
  console.log(`Success: ${successCount}/${tickers.length}`);
  
  tcbsLogger.info('Test batch completed', {
    totalTested: tickers.length,
    successful: successCount,
    failed: tickers.length - successCount,
    outputFile: OUTPUT_FILE
  });
  
  if (successCount < tickers.length) {
    console.log('\nFailed tickers:');
    const failedTickers = tickerResults
      .filter(r => !r.success)
      .map(r => ({ ticker: r.ticker, error: r.error }));
      
    failedTickers.forEach(r => console.log(`- ${r.ticker}: ${r.error}`));
    
    tcbsLogger.warning('Some ticker tests failed', { failedTickers });
  }
  
  console.log('\nResponse times:');
  const responseTimes = tickerResults
    .filter(r => r.responseTime)
    .sort((a, b) => b.responseTime - a.responseTime)
    .map(r => ({ ticker: r.ticker, responseTime: r.responseTime }));
    
  responseTimes.forEach(r => console.log(`- ${r.ticker}: ${r.responseTime}ms`));
  
  tcbsLogger.info('Response time statistics', { responseTimes });
}

// Run the tests
testAllTickers().catch(error => {
  console.error('Fatal error:', error);
  tcbsLogger.error('Fatal error in debug script', { 
    error: error.message, 
    stack: error.stack 
  });
}); 