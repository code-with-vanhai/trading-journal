const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

// SAFETY CHECK: NEVER use production database for tests
if (!process.env.TEST_DATABASE_URL) {
  console.error('❌ DANGER: TEST_DATABASE_URL not set! This script will NOT run without explicit test database URL.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

async function cleanTestDatabase() {
  try {
    console.log('🧹 Cleaning test database...');
    
    // Delete all test data in reverse dependency order
    console.log('Cleaning journal entry tags...');
    await prisma.journalEntryTag.deleteMany({});
    
    console.log('Cleaning journal entries...');
    await prisma.journalEntry.deleteMany({});
    
    console.log('Cleaning transactions...');
    await prisma.transaction.deleteMany({});
    
    console.log('Cleaning tags...');
    await prisma.tag.deleteMany({});
    
    console.log('Cleaning strategies...');
    await prisma.strategy.deleteMany({});
    
    console.log('Cleaning stock accounts...');
    await prisma.stockAccount.deleteMany({});
    
    console.log('Cleaning stock price cache...');
    await prisma.stockPriceCache.deleteMany({});
    
    console.log('Cleaning users...');
    await prisma.user.deleteMany({});
    
    console.log('✅ Test database cleaned successfully');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanTestDatabase();
}

module.exports = { cleanTestDatabase }; 