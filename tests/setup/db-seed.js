const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
    }
  }
});

async function seedTestData() {
  try {
    console.log('🌱 Seeding test database...');
    
    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const testUser1 = await prisma.user.upsert({
      where: { email: 'test1@example.com' },
      update: {},
      create: {
        email: 'test1@example.com',
        username: 'testuser1',
        name: 'Test User 1',
        passwordHash: hashedPassword,
      },
    });
    
    const testUser2 = await prisma.user.upsert({
      where: { email: 'test2@example.com' },
      update: {},
      create: {
        email: 'test2@example.com',
        username: 'testuser2',
        name: 'Test User 2',
        passwordHash: hashedPassword,
      },
    });
    
    console.log('✅ Test users created');
    
    // Create stock accounts
    const stockAccount1 = await prisma.stockAccount.upsert({
      where: { id: 'test-account-1' },
      update: {},
      create: {
        id: 'test-account-1',
        name: 'Test Broker Account',
        brokerName: 'Test Broker',
        accountNumber: '123456789',
        description: 'Test account for unit testing',
        userId: testUser1.id,
      },
    });
    
    const stockAccount2 = await prisma.stockAccount.upsert({
      where: { id: 'test-account-2' },
      update: {},
      create: {
        id: 'test-account-2',
        name: 'Secondary Account',
        brokerName: 'Another Broker',
        accountNumber: '987654321',
        description: 'Secondary test account',
        userId: testUser1.id,
      },
    });
    
    console.log('✅ Stock accounts created');
    
    // Create test transactions
    const transactions = [
      {
        ticker: 'VNM',
        type: 'BUY',
        quantity: 100,
        price: 85000,
        transactionDate: new Date('2024-01-15'),
        fee: 50000,
        taxRate: 0,
        userId: testUser1.id,
        stockAccountId: stockAccount1.id,
      },
      {
        ticker: 'VNM',
        type: 'SELL',
        quantity: 50,
        price: 90000,
        transactionDate: new Date('2024-01-20'),
        fee: 25000,
        taxRate: 0.1,
        calculatedPl: 225000, // (90000 * 50) - (85000 * 50) - 25000
        userId: testUser1.id,
        stockAccountId: stockAccount1.id,
      },
      {
        ticker: 'TCB',
        type: 'BUY',
        quantity: 200,
        price: 25000,
        transactionDate: new Date('2024-01-10'),
        fee: 30000,
        taxRate: 0,
        userId: testUser1.id,
        stockAccountId: stockAccount2.id,
      },
    ];
    
    for (const transaction of transactions) {
      await prisma.transaction.create({
        data: transaction,
      });
    }
    
    console.log('✅ Test transactions created');
    
    // Create test tags
    const tags = [
      { name: 'swing-trade', userId: testUser1.id },
      { name: 'day-trade', userId: testUser1.id },
      { name: 'long-term', userId: testUser1.id },
    ];
    
    for (const tag of tags) {
      await prisma.tag.create({
        data: tag,
      });
    }
    
    console.log('✅ Test tags created');
    
    // Create test strategies
    const strategies = [
      {
        title: 'Test Strategy 1',
        content: 'This is a test trading strategy for unit testing purposes.',
        userId: testUser1.id,
      },
      {
        title: 'Test Strategy 2',
        content: 'Another test strategy with different approach.',
        userId: testUser2.id,
      },
    ];
    
    for (const strategy of strategies) {
      await prisma.strategy.create({
        data: strategy,
      });
    }
    
    console.log('✅ Test strategies created');
    
    // Create test stock price cache
    const stockPrices = [
      {
        symbol: 'VNM',
        price: 88000,
        lastUpdatedAt: new Date(),
        source: 'tcbs',
        metadata: { volume: 1000000, change: 2.5 },
      },
      {
        symbol: 'TCB',
        price: 26500,
        lastUpdatedAt: new Date(),
        source: 'tcbs',
        metadata: { volume: 2000000, change: -1.2 },
      },
    ];
    
    for (const stockPrice of stockPrices) {
      await prisma.stockPriceCache.upsert({
        where: { symbol: stockPrice.symbol },
        update: stockPrice,
        create: stockPrice,
      });
    }
    
    console.log('✅ Test stock price cache created');
    console.log('🎉 Test database seeding complete!');
    
    return {
      users: [testUser1, testUser2],
      stockAccounts: [stockAccount1, stockAccount2],
      transactionCount: transactions.length,
      tagCount: tags.length,
      strategyCount: strategies.length,
    };
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanTestData() {
  try {
    console.log('🧹 Cleaning test data...');
    
    // Delete in reverse order of dependencies
    await prisma.journalEntryTag.deleteMany({});
    await prisma.journalEntry.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.strategy.deleteMany({});
    await prisma.stockAccount.deleteMany({});
    await prisma.stockPriceCache.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('✅ Test data cleaned');
    
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error.message);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedTestData, cleanTestData }; 