const { exec } = require('child_process');
const util = require('util');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

const execPromise = util.promisify(exec);

async function runDatabaseMigrations() {
  try {
    console.log('🔄 Running database migrations for testing...');
    
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    await execPromise('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Run database migrations
    console.log('🗄️ Applying database migrations...');
    await execPromise('npx prisma migrate deploy');
    console.log('✅ Database migrations applied');
    
    console.log('🎉 Database migration setup complete!');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    if (error.stdout) {
      console.log('STDOUT:', error.stdout);
    }
    if (error.stderr) {
      console.error('STDERR:', error.stderr);
    }
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runDatabaseMigrations();
}

module.exports = { runDatabaseMigrations }; 