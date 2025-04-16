const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
require('dotenv').config();

/**
 * This script cleans up old stock price cache entries.
 * It keeps only the most recent entries for each symbol and removes entries 
 * that haven't been updated in a long time.
 * 
 * Usage: node scripts/cleanup-cache.js [options]
 * Options:
 *   --dry-run    Show what would be deleted without actually deleting
 *   --days=N     Delete cache entries older than N days (default: 7)
 */

async function cleanupCache() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    
    // Get the days threshold from command line or use default (7 days)
    const daysArg = args.find(arg => arg.startsWith('--days='));
    const days = daysArg 
      ? parseInt(daysArg.split('=')[1], 10) 
      : 7;
    
    if (isNaN(days) || days <= 0) {
      console.error('Invalid days value. Please use a positive number.');
      process.exit(1);
    }

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    console.log(`Looking for cache entries older than ${days} days (before ${cutoffDate.toISOString()})`);
    
    // Find old cache entries
    const oldEntries = await prisma.stockPriceCache.findMany({
      where: {
        lastUpdatedAt: {
          lt: cutoffDate
        }
      },
      orderBy: {
        lastUpdatedAt: 'asc'
      }
    });
    
    console.log(`Found ${oldEntries.length} cache entries older than ${days} days`);
    
    if (oldEntries.length > 0) {
      // Show summary of what will be deleted
      const symbolCounts = {};
      for (const entry of oldEntries) {
        symbolCounts[entry.symbol] = (symbolCounts[entry.symbol] || 0) + 1;
      }
      
      console.log('\nEntries to be deleted:');
      for (const [symbol, count] of Object.entries(symbolCounts)) {
        console.log(`  ${symbol}: ${count} entries`);
      }
      
      // Display the oldest entries
      console.log('\nOldest entries:');
      for (let i = 0; i < Math.min(5, oldEntries.length); i++) {
        const entry = oldEntries[i];
        console.log(`  ${entry.symbol}: last updated ${entry.lastUpdatedAt.toISOString()} (${entry.price} VND)`);
      }
      
      // Delete if not dry run
      if (!dryRun) {
        console.log('\nDeleting old cache entries...');
        const result = await prisma.stockPriceCache.deleteMany({
          where: {
            lastUpdatedAt: {
              lt: cutoffDate
            }
          }
        });
        
        console.log(`Deleted ${result.count} cache entries`);
      } else {
        console.log('\nDRY RUN: No entries were deleted. Run without --dry-run to delete entries.');
      }
    }
    
    // Count current cache entries
    const totalCacheEntries = await prisma.stockPriceCache.count();
    console.log(`\nTotal cache entries remaining: ${totalCacheEntries}`);
    
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCache(); 