/**
 * Database Index Migration Script
 * Applies new indexes to optimize query performance
 * 
 * Run: node scripts/apply-db-indexes.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyIndexes() {
  console.log('🚀 Applying database indexes...\n');

  try {
    // Note: Prisma doesn't support creating indexes directly via client
    // These indexes should be applied via Prisma migration
    // This script is for reference/documentation
    
    console.log('📋 Indexes to be applied:');
    console.log('');
    console.log('Transaction table:');
    console.log('  - idx_transaction_user_date_desc: [userId, transactionDate DESC]');
    console.log('  - idx_transaction_user_ticker_date: [userId, ticker, transactionDate DESC]');
    console.log('  - idx_transaction_account_date: [stockAccountId, transactionDate DESC]');
    console.log('  - idx_transaction_user_type_pl: [userId, type, calculatedPl]');
    console.log('  - idx_transaction_date_desc: [transactionDate DESC]');
    console.log('');
    console.log('CostBasisAdjustment table:');
    console.log('  - idx_adjustment_user_ticker_date: [userId, ticker, eventDate DESC]');
    console.log('  - idx_adjustment_account_ticker_active: [stockAccountId, ticker, isActive]');
    console.log('  - idx_adjustment_event_date: [eventDate DESC]');
    console.log('');
    console.log('✅ To apply these indexes, run:');
    console.log('   npx prisma migrate dev --name add_performance_indexes');
    console.log('   or');
    console.log('   npx prisma db push');
    console.log('');
    
    // Verify current indexes
    const result = await prisma.$queryRaw`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;
    
    console.log('📊 Current indexes in database:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes()
  .then(() => {
    console.log('\n✅ Index check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error);
    process.exit(1);
  });















