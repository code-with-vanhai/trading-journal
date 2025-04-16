const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { tcbsLogger } = require('./debug-logger');

// Load environment variables
dotenv.config();

// Configuration
const OUTPUT_FILE = path.join(process.cwd(), 'logs', 'market-data-check.json');
const LOGS_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Input tickers from command line arguments or use defaults
const tickers = process.argv.slice(2).length > 0 
  ? process.argv.slice(2) 
  : ['TCB', 'VNM', 'VIC', 'MSN', 'FPT'];

console.log(`Checking market data API for tickers: ${tickers.join(', ')}`);

tcbsLogger.info('Market data check script started', { tickers });

// Test the market data API
async function testMarketDataAPI() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/market-data?tickers=${tickers.join(',')}`;
  
  console.log(`\nTesting market data API:`);
  console.log(`URL: ${apiUrl}`);
  
  tcbsLogger.info(`Testing market data API`, { url: apiUrl });
  
  try {
    const startTime = Date.now();
    const response = await fetch(apiUrl);
    const responseTime = Date.now() - startTime;
    
    console.log(`Response status: ${response.status} (${responseTime}ms)`);
    tcbsLogger.info(`API response received`, { 
      status: response.status, 
      responseTime: `${responseTime}ms` 
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from market data API: HTTP ${response.status}`);
      tcbsLogger.error(`API error response`, { 
        status: response.status, 
        error: errorText
      });
      
      return {
        status: response.status,
        success: false,
        responseTime,
        error: errorText,
        data: null
      };
    }
    
    const data = await response.json();
    
    // Check data for each ticker
    const tickerResults = {};
    let successCount = 0;
    
    for (const ticker of tickers) {
      const tickerData = data[ticker];
      
      if (!tickerData || tickerData.error) {
        console.error(`No valid data for ${ticker}: ${tickerData?.error || 'Unknown error'}`);
        tickerResults[ticker] = {
          success: false,
          error: tickerData?.error || 'No data returned',
          data: tickerData
        };
      } else {
        console.log(`Data for ${ticker}: ${Array.isArray(tickerData) ? `${tickerData.length} entries` : 'Invalid format'}`);
        
        if (Array.isArray(tickerData) && tickerData.length > 0) {
          successCount++;
          tickerResults[ticker] = {
            success: true,
            entriesCount: tickerData.length,
            firstEntry: tickerData[0],
            lastEntry: tickerData[tickerData.length - 1]
          };
        } else {
          tickerResults[ticker] = {
            success: false,
            error: 'Empty or invalid data format',
            data: tickerData
          };
        }
      }
    }
    
    const result = {
      status: response.status,
      success: successCount > 0,
      responseTime,
      error: null,
      tickerResults,
      overallSuccess: `${successCount}/${tickers.length} tickers returned valid data`
    };
    
    tcbsLogger.info(`Market data API test completed`, { 
      totalTickers: tickers.length,
      successfulTickers: successCount,
      responseTime
    });
    
    // Save results to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`\nResults saved to ${OUTPUT_FILE}`);
    
    return result;
  } catch (error) {
    console.error(`Error testing market data API:`, error.message);
    tcbsLogger.error(`Exception during market data API test`, { 
      error: error.message, 
      stack: error.stack 
    });
    
    return {
      success: false,
      responseTime: null,
      error: error.message,
      data: null
    };
  }
}

// Run the test
testMarketDataAPI().then(result => {
  console.log('\nSUMMARY:');
  console.log('-'.repeat(50));
  console.log(`Overall result: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
  console.log(`Response time: ${result.responseTime}ms`);
  console.log(`Success rate: ${result.overallSuccess}`);
  
  if (result.success) {
    console.log('\nTicker details:');
    for (const ticker of tickers) {
      const tickerResult = result.tickerResults[ticker];
      if (tickerResult.success) {
        console.log(`- ${ticker}: ${tickerResult.entriesCount} entries`);
      } else {
        console.log(`- ${ticker}: FAILED - ${tickerResult.error}`);
      }
    }
  }
}).catch(error => {
  console.error('Fatal error:', error);
  tcbsLogger.error('Fatal error in check script', { 
    error: error.message, 
    stack: error.stack 
  });
}); 