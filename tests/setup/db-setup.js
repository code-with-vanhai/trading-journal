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

async function setupTestDatabase() {
  try {
    console.log('🔧 Setting up test database...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Check if database is accessible
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test passed');
    
    // Verify all tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const expectedTables = [
      'User',
      'StockAccount', 
      'Transaction',
      'JournalEntry',
      'Tag',
      'JournalEntryTag',
      'Strategy',
      'StockPriceCache'
    ];
    
    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables:', missingTables);
      console.log('Run: npx prisma migrate dev');
      process.exit(1);
    }
    
    console.log('✅ All required tables exist');
    console.log('🎉 Test database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestDatabase();
}

module.exports = { setupTestDatabase, prisma }; 