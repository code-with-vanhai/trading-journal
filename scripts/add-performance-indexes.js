#!/usr/bin/env node

/**
 * 📊 SAFE DATABASE INDEX MIGRATION SCRIPT
 * Thêm performance indexes một cách an toàn cho production
 * 
 * Safety measures:
 * - Chỉ thêm indexes, không modify data
 * - Non-blocking index creation
 * - Rollback capability
 * - Production-safe operations
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

class SafeIndexMigration {
  constructor() {
    this.prisma = new PrismaClient();
    this.logFile = path.join(process.cwd(), 'logs', 'index-migration.log');
    this.results = [];
  }

  /**
   * Log migration steps
   */
  log(message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    
    console.log(`[${logEntry.timestamp}] ${message}`);
    if (data) console.log('  Data:', data);
    
    // Append to log file
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Check if index exists
   */
  async indexExists(indexName) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = ${indexName}
      `;
      return result.length > 0;
    } catch (error) {
      this.log(`Error checking index ${indexName}`, { error: error.message });
      return false;
    }
  }

  /**
   * Create index safely (non-blocking)
   */
  async createIndexSafely(indexName, sql) {
    try {
      this.log(`Creating index: ${indexName}`);
      
      // Check if index already exists
      if (await this.indexExists(indexName)) {
        this.log(`Index ${indexName} already exists, skipping`);
        this.results.push({ indexName, status: 'EXISTS', action: 'SKIPPED' });
        return true;
      }
      
      const startTime = Date.now();
      
      // Execute index creation
      await this.prisma.$executeRawUnsafe(sql);
      
      const duration = Date.now() - startTime;
      this.log(`Index ${indexName} created successfully`, { duration: `${duration}ms` });
      
      this.results.push({ 
        indexName, 
        status: 'CREATED', 
        duration: `${duration}ms`,
        sql 
      });
      
      return true;
    } catch (error) {
      this.log(`Failed to create index ${indexName}`, { 
        error: error.message,
        sql 
      });
      
      this.results.push({ 
        indexName, 
        status: 'FAILED', 
        error: error.message,
        sql 
      });
      
      return false;
    }
  }

  /**
   * Execute safe index migrations
   */
  async executeMigration() {
    this.log('Starting safe index migration...');
    
    // List of safe indexes to create
    const indexMigrations = [
      {
        name: 'idx_stock_price_cache_symbol_updated',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stock_price_cache_symbol_updated 
              ON "StockPriceCache" (symbol, "lastUpdatedAt" DESC)`,
        priority: 'HIGH',
        table: 'StockPriceCache',
        purpose: 'Optimize market data queries with symbol + freshness'
      },
      {
        name: 'idx_journal_entry_user_created',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entry_user_created 
              ON "JournalEntry" ("userId", "createdAt" DESC)`,
        priority: 'MEDIUM',
        table: 'JournalEntry', 
        purpose: 'Optimize user journal queries with date sorting'
      },
      {
        name: 'idx_account_fee_user_account_date',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_account_fee_user_account_date 
              ON "AccountFee" ("userId", "stockAccountId", "feeDate" DESC)`,
        priority: 'MEDIUM',
        table: 'AccountFee',
        purpose: 'Optimize account fee queries with date range filtering'
      },
      {
        name: 'idx_transaction_user_pl_not_null',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_user_pl_not_null 
              ON "Transaction" ("userId", "calculatedPl") 
              WHERE "calculatedPl" IS NOT NULL`,
        priority: 'LOW',
        table: 'Transaction',
        purpose: 'Optimize profit/loss statistics queries (partial index)'
      },
      {
        name: 'idx_transaction_user_type_date',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transaction_user_type_date 
              ON "Transaction" ("userId", type, "transactionDate" DESC)`,
        priority: 'LOW',
        table: 'Transaction',
        purpose: 'Optimize transaction queries by type with date sorting'
      }
    ];

    let successCount = 0;
    let failureCount = 0;

    // Execute migrations in priority order
    const sortedMigrations = indexMigrations.sort((a, b) => {
      const priority = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priority[b.priority] - priority[a.priority];
    });

    for (const migration of sortedMigrations) {
      this.log(`Processing ${migration.priority} priority index: ${migration.name}`, {
        table: migration.table,
        purpose: migration.purpose
      });

      const success = await this.createIndexSafely(migration.name, migration.sql);
      
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }

      // Small delay between index creations to avoid overwhelming database
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final summary
    this.log('Index migration completed', {
      totalIndexes: indexMigrations.length,
      successful: successCount,
      failed: failureCount,
      results: this.results
    });

    return {
      success: failureCount === 0,
      totalIndexes: indexMigrations.length,
      successful: successCount,
      failed: failureCount,
      results: this.results
    };
  }

  /**
   * Rollback migrations (remove indexes)
   */
  async rollbackMigration() {
    this.log('Starting index rollback...');
    
    const indexesToRemove = [
      'idx_stock_price_cache_symbol_updated',
      'idx_journal_entry_user_created', 
      'idx_account_fee_user_account_date',
      'idx_transaction_user_pl_not_null',
      'idx_transaction_user_type_date'
    ];

    for (const indexName of indexesToRemove) {
      try {
        if (await this.indexExists(indexName)) {
          await this.prisma.$executeRawUnsafe(`DROP INDEX CONCURRENTLY IF EXISTS ${indexName}`);
          this.log(`Removed index: ${indexName}`);
        } else {
          this.log(`Index ${indexName} does not exist, skipping`);
        }
      } catch (error) {
        this.log(`Failed to remove index ${indexName}`, { error: error.message });
      }
    }

    this.log('Rollback completed');
  }

  /**
   * Analyze index usage after creation
   */
  async analyzeIndexUsage() {
    this.log('Analyzing index usage...');
    
    try {
      const indexUsage = await this.prisma.$queryRaw`
        SELECT 
          indexrelname as index_name,
          relname as table_name,
          idx_scan as times_used,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        WHERE indexrelname LIKE 'idx_%'
        ORDER BY idx_scan DESC
      `;

      this.log('Index usage analysis completed', { 
        indexCount: indexUsage.length,
        usage: indexUsage 
      });
      
      return indexUsage;
    } catch (error) {
      this.log('Index usage analysis failed', { error: error.message });
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.prisma.$disconnect();
    this.log('Migration script completed and disconnected');
  }
}

// CLI interface
async function main() {
  const migration = new SafeIndexMigration();
  
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--rollback')) {
      await migration.rollbackMigration();
    } else if (args.includes('--analyze')) {
      const usage = await migration.analyzeIndexUsage();
      console.log('\nIndex Usage Analysis:');
      console.table(usage);
    } else {
      console.log('🚀 Starting safe database index migration...');
      console.log('⚠️  This will add performance indexes to your database');
      console.log('✅ All operations are non-blocking and production-safe\n');
      
      const result = await migration.executeMigration();
      
      console.log('\n📊 MIGRATION SUMMARY:');
      console.log('=' .repeat(50));
      console.log(`Total indexes processed: ${result.totalIndexes}`);
      console.log(`Successfully created: ${result.successful}`);
      console.log(`Failed: ${result.failed}`);
      console.log(`Overall success: ${result.success ? '✅ YES' : '❌ NO'}`);
      
      if (result.results.length > 0) {
        console.log('\n📋 Detailed Results:');
        console.table(result.results);
      }
      
      console.log(`\n📄 Full log available at: ${migration.logFile}`);
      console.log('\n🔍 To analyze index usage later, run:');
      console.log('  node scripts/add-performance-indexes.js --analyze');
      console.log('\n↩️  To rollback (remove indexes), run:');
      console.log('  node scripts/add-performance-indexes.js --rollback');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await migration.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SafeIndexMigration;
