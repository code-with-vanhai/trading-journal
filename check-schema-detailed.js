const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchemaDetailed() {
  try {
    console.log('=== DETAILED PROD DATABASE SCHEMA CHECK ===');
    
    // Check all schemas
    const schemas = await prisma.$queryRaw`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `;
    console.log('\n📋 Available schemas:');
    schemas.forEach(schema => console.log('  -', schema.schema_name));
    
    // Check tables in trading_journal schema specifically
    const tradingJournalTables = await prisma.$queryRaw`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'trading_journal' 
      ORDER BY table_name;
    `;
    console.log('\n📋 Tables in trading_journal schema:');
    tradingJournalTables.forEach(table => console.log(`  - ${table.table_name} (schema: ${table.table_schema})`));
    
    // Check tables in public schema
    const publicTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log('\n📋 Tables in public schema:');
    publicTables.forEach(table => console.log('  -', table.table_name));
    
    // Check all tables across all schemas
    const allTables = await prisma.$queryRaw`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY table_schema, table_name;
    `;
    console.log('\n📋 All tables across schemas:');
    allTables.forEach(table => console.log(`  - ${table.table_name} (${table.table_schema})`));
    
    // Check if we can access trading_journal schema tables
    console.log('\n🔍 Testing access to trading_journal schema...');
    try {
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM trading_journal."User"`;
      console.log('✅ Can access trading_journal.User table:', userCount);
    } catch (error) {
      console.log('❌ Cannot access trading_journal.User:', error.message);
    }
    
    // Check database connection details
    const currentDatabase = await prisma.$queryRaw`SELECT current_database()`;
    console.log('\n📊 Current database:', currentDatabase);
    
    const currentSchema = await prisma.$queryRaw`SELECT current_schema()`;
    console.log('📊 Current schema:', currentSchema);
    
    const searchPath = await prisma.$queryRaw`SHOW search_path`;
    console.log('📊 Search path:', searchPath);
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchemaDetailed(); 