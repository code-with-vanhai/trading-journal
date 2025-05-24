const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function migrateToStockAccounts() {
  console.log('🚀 Starting Stock Account migration...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        transactions: true,
        stockAccounts: true
      }
    });

    console.log(`📊 Found ${users.length} users to process`);

    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.username || user.email}`);
      
      // Check if user already has stock accounts
      if (user.stockAccounts.length > 0) {
        console.log(`  ✅ User already has ${user.stockAccounts.length} stock account(s), skipping...`);
        continue;
      }

      // Create default stock account for the user
      console.log(`  🏦 Creating default stock account...`);
      const defaultAccount = await prisma.stockAccount.create({
        data: {
          name: 'Tài khoản mặc định',
          brokerName: null,
          accountNumber: null,
          description: 'Tài khoản mặc định được tạo tự động',
          userId: user.id
        }
      });

      console.log(`  ✅ Created default account: ${defaultAccount.id}`);

      // Update all user's transactions to use the default account
      if (user.transactions.length > 0) {
        console.log(`  📈 Updating ${user.transactions.length} transaction(s)...`);
        
        const updateResult = await prisma.transaction.updateMany({
          where: {
            userId: user.id
          },
          data: {
            stockAccountId: defaultAccount.id
          }
        });

        console.log(`  ✅ Updated ${updateResult.count} transaction(s)`);
      } else {
        console.log(`  ℹ️  No transactions to update`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');

    // Verify migration results
    console.log('\n📋 Migration Summary:');
    const totalUsers = await prisma.user.count();
    const totalAccounts = await prisma.stockAccount.count();
    const totalTransactions = await prisma.transaction.count();

    console.log(`  👥 Total users: ${totalUsers}`);
    console.log(`  🏦 Total stock accounts: ${totalAccounts}`);
    console.log(`  📈 Total transactions: ${totalTransactions}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToStockAccounts()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToStockAccounts }; 