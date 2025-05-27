const { PrismaClient } = require('@prisma/client');

async function checkAndFixSchema() {
  // Create a fresh Prisma instance to avoid prepared statement conflicts
  const prisma = new PrismaClient();
  
  try {
    console.log('=== CHECKING CURRENT DATABASE STATE ===\n');
    
    // Check available schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `;
    console.log('📋 Available schemas:');
    schemas.forEach(schema => console.log(`  - ${schema.schema_name}`));
    
    // Check tables in trading_journal schema
    const tradingJournalTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'trading_journal' 
      ORDER BY table_name
    `;
    console.log('\n📋 Tables in trading_journal schema:');
    tradingJournalTables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // Check tables in public schema  
    const publicTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log('\n📋 Tables in public schema:');
    publicTables.forEach(table => console.log(`  - ${table.table_name}`));
    
    // Check current database settings
    const currentSchema = await prisma.$queryRaw`SELECT current_schema()`;
    console.log('\n📊 Current schema:', currentSchema[0].current_schema);
    
    const searchPath = await prisma.$queryRaw`SHOW search_path`;
    console.log('📊 Search path:', searchPath[0].search_path);
    
    // Check if we can access the tables directly
    if (tradingJournalTables.length > 0) {
      console.log('\n🔍 Testing direct access to tables...');
      try {
        const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM trading_journal."User"`;
        console.log(`✅ trading_journal.User table has ${userCount[0].count} records`);
        
        const accountCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM trading_journal."StockAccount"`;
        console.log(`✅ trading_journal.StockAccount table has ${accountCount[0].count} records`);
      } catch (error) {
        console.log('❌ Cannot access tables:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixSchema(); 