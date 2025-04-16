const fs = require('fs');
const path = require('path');

// Configuration
const LOG_FILE = path.join(process.cwd(), 'logs', 'api-calls.log');
const SUMMARY_FILE = path.join(process.cwd(), 'logs', 'eod-api-summary.txt');

// Check if log file exists
if (!fs.existsSync(LOG_FILE)) {
  console.error(`Log file not found: ${LOG_FILE}`);
  process.exit(1);
}

// Read and analyze log file
try {
  // Read log file
  const logContent = fs.readFileSync(LOG_FILE, 'utf8');
  
  // Split into log entries (each separated by a line of dashes)
  const logEntries = logContent.split('-'.repeat(80)).filter(entry => entry.trim());
  
  console.log(`Found ${logEntries.length} log entries`);
  
  // Extract market data API calls
  const marketDataCalls = logEntries.filter(entry => 
    entry.includes('[INFO]') && 
    (entry.includes('Market data API request started') || 
     entry.includes('Calling TCBS API for') || 
     entry.includes('TCBS API response for') ||
     entry.includes('Retrieved price for'))
  );
  
  console.log(`Found ${marketDataCalls.length} market data API-related log entries`);

  // Extract errors and warnings
  const errors = logEntries.filter(entry => entry.includes('[ERROR]'));
  const warnings = logEntries.filter(entry => entry.includes('[WARNING]'));
  
  console.log(`Found ${errors.length} errors and ${warnings.length} warnings`);
  
  // Count requests by ticker
  const tickerCalls = {};
  const tickerRegex = /Calling TCBS API for ([A-Z0-9]+)/;
  marketDataCalls.forEach(entry => {
    const match = entry.match(tickerRegex);
    if (match && match[1]) {
      const ticker = match[1];
      tickerCalls[ticker] = (tickerCalls[ticker] || 0) + 1;
    }
  });
  
  // Count successful price retrievals
  const successfulPrices = {};
  const priceRegex = /Retrieved price for ([A-Z0-9]+)/;
  marketDataCalls.forEach(entry => {
    const match = entry.match(priceRegex);
    if (match && match[1]) {
      const ticker = match[1];
      successfulPrices[ticker] = true;
    }
  });
  
  // Generate summary report
  let summaryReport = '=== TCBS EOD API CALL SUMMARY ===\n\n';
  summaryReport += `Generated: ${new Date().toISOString()}\n`;
  summaryReport += `Log file: ${LOG_FILE}\n\n`;
  summaryReport += `Total log entries: ${logEntries.length}\n`;
  summaryReport += `Market data API calls: ${marketDataCalls.length}\n`;
  summaryReport += `Errors: ${errors.length}\n`;
  summaryReport += `Warnings: ${warnings.length}\n\n`;
  
  summaryReport += '=== TICKER CALL SUMMARY ===\n\n';
  for (const ticker in tickerCalls) {
    summaryReport += `${ticker}: ${tickerCalls[ticker]} calls`;
    if (successfulPrices[ticker]) {
      summaryReport += ' ✓ (got price)\n';
    } else {
      summaryReport += ' ✗ (no price)\n';
    }
  }
  
  summaryReport += '\n=== ERRORS ===\n\n';
  errors.forEach(error => {
    summaryReport += error.trim() + '\n\n';
  });
  
  summaryReport += '\n=== WARNINGS ===\n\n';
  warnings.forEach(warning => {
    summaryReport += warning.trim() + '\n\n';
  });
  
  // Write summary to file
  fs.writeFileSync(SUMMARY_FILE, summaryReport);
  console.log(`Summary report written to ${SUMMARY_FILE}`);
  
  // Print summary to console
  const tickers = Object.keys(tickerCalls);
  const successfulTickerCount = Object.keys(successfulPrices).length;
  
  console.log('\nSUMMARY:');
  console.log('-'.repeat(40));
  console.log(`Tickers requested: ${tickers.length}`);
  console.log(`Tickers with prices: ${successfulTickerCount}`);
  console.log(`Tickers without prices: ${tickers.length - successfulTickerCount}`);
  
  if (tickers.length - successfulTickerCount > 0) {
    console.log('\nTickers missing prices:');
    tickers.forEach(ticker => {
      if (!successfulPrices[ticker]) {
        console.log(`- ${ticker}`);
      }
    });
  }
  
  if (errors.length > 0) {
    console.log('\nERROR SUMMARY:');
    console.log('-'.repeat(40));
    errors.slice(0, 3).forEach(error => {
      console.log(error.split('\n')[0]);
    });
    if (errors.length > 3) {
      console.log(`...and ${errors.length - 3} more errors`);
    }
  }
  
  console.log('\nCheck the full report for more details.');
  
} catch (error) {
  console.error('Error analyzing logs:', error);
} 