const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables from both .env and .env.test (if present)
dotenv.config();
dotenv.config({ path: '.env.test' });

function maskDbUrl(url) {
  if (!url) return '(not set)';
  try {
    const u = new URL(url);
    if (u.password) u.password = '****';
    return u.toString();
  } catch {
    return url.replace(/:(?:[^@]+)@/, ':****@');
  }
}

async function promptSelectDatabaseUrl() {
  const testUrl = process.env.TEST_DATABASE_URL || '';
  const prodUrl = process.env.DATABASE_URL || '';

  console.log('\nSafety confirmation required before running DB CLEAN script.');
  console.log('Please choose the target database:');
  console.log(`  1) TEST  - TEST_DATABASE_URL = ${maskDbUrl(testUrl)}`);
  console.log(`  2) PROD  - DATABASE_URL     = ${maskDbUrl(prodUrl)}`);
  console.log('  0) Cancel');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  function ask(q) { return new Promise(res => rl.question(q, res)); }

  const choice = (await ask('\nEnter your choice [1/2/0]: ')).trim();

  if (choice === '0') {
    console.log('User cancelled. Exiting.');
    rl.close();
    process.exit(0);
  }

  let selected = null;
  let label = '';
  if (choice === '1') {
    if (!testUrl) {
      console.error('❌ TEST_DATABASE_URL is not set. Aborting.');
      rl.close();
      process.exit(1);
    }
    selected = testUrl; label = 'TEST';
  } else if (choice === '2') {
    if (!prodUrl) {
      console.error('❌ DATABASE_URL is not set. Aborting.');
      rl.close();
      process.exit(1);
    }
    console.log('\n⚠️  You selected PROD database. This will DELETE DATA IRREVERSIBLY.');
    console.log(`Target: ${maskDbUrl(prodUrl)}`);
    const confirm = await ask("Type EXACTLY 'YES DELETE PROD' to proceed: ");
    if (confirm.trim() !== 'YES DELETE PROD') {
      console.log('Confirmation failed. Aborting.');
      rl.close();
      process.exit(1);
    }
    selected = prodUrl; label = 'PROD';
  } else {
    console.error('Invalid choice. Aborting.');
    rl.close();
    process.exit(1);
  }

  rl.close();
  return { url: selected, label };
}

async function cleanDatabase(targetUrl, label) {
  const prisma = new PrismaClient({ datasources: { db: { url: targetUrl } } });
  try {
    console.log(`\n🧹 Cleaning ${label} database...`);

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

    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if called directly
if (require.main === module) {
  (async () => {
    const { url, label } = await promptSelectDatabaseUrl();
    console.log(`\nProceeding to clean ${label} DB at: ${maskDbUrl(url)}`);
    await cleanDatabase(url, label);
  })();
}

module.exports = { cleanDatabase };