const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('=== CHECKING PROD DATABASE SCHEMA ===');
    
    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('\n📋 Tables in database:');
    tables.forEach(table => console.log('  -', table.table_name));
    
    // Check if specific expected tables exist
    const expectedTables = ['User', 'Transaction', 'StockAccount', 'JournalEntry', 'Tag', 'JournalEntryTag', 'Strategy', 'StockPriceCache'];
    console.log('\n🔍 Expected tables status:');
    expectedTables.forEach(tableName => {
      const exists = tables.some(t => t.table_name === tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    });
    
    // Check schema name/case
    const schemaInfo = await prisma.$queryRaw`
      SELECT schemaname 
      FROM pg_tables 
      WHERE tablename = ANY(ARRAY['User', 'user', 'Transaction', 'transaction'])
      GROUP BY schemaname;
    `;
    console.log('\n📊 Schema info:', schemaInfo);
    
    // Check for case-sensitive table names
    const caseCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name ILIKE ANY(ARRAY['%user%', '%transaction%', '%stockaccount%'])
      ORDER BY table_name;
    `;
    console.log('\n🔤 Case-insensitive table check:', caseCheck);
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema(); 