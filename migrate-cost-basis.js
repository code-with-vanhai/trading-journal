#!/usr/bin/env node

/**
 * Migration script để tính lại giá vốn cho tất cả transaction hiện có
 * Sử dụng FIFO nghiêm ngặt với phí mua được tính vào giá vốn
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateExistingTransactions() {
  console.log('🔄 Bắt đầu migration tính lại giá vốn...');
  
  try {
    // Lấy tất cả transactions, nhóm theo user và stock account
    const allTransactions = await prisma.transaction.findMany({
      orderBy: [
        { userId: 'asc' },
        { stockAccountId: 'asc' },
        { ticker: 'asc' },
        { transactionDate: 'asc' }
      ],
      include: {
        user: true,
        StockAccount: true
      }
    });

    console.log(`📊 Tìm thấy ${allTransactions.length} transactions cần migration`);

    // Xóa tất cả purchase lots hiện có (nếu có)
    await prisma.purchaseLot.deleteMany({});
    console.log('🧹 Đã xóa tất cả purchase lots cũ');

    // Nhóm transactions theo user, account, ticker
    const grouped = {};
    for (const tx of allTransactions) {
      const key = `${tx.userId}-${tx.stockAccountId}-${tx.ticker}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(tx);
    }

    console.log(`📋 Nhóm thành ${Object.keys(grouped).length} nhóm (user-account-ticker)`);

    let processedGroups = 0;
    let totalPurchaseLotsCreated = 0;
    let totalPLRecalculated = 0;

    // Xử lý từng nhóm
    for (const [groupKey, transactions] of Object.entries(grouped)) {
      const [userId, stockAccountId, ticker] = groupKey.split('-');
      console.log(`\n🔍 Xử lý nhóm: User ${userId}, Account ${stockAccountId}, Ticker ${ticker}`);
      console.log(`   📈 ${transactions.length} transactions`);

      // Lưu trữ thông tin lô mua cho ticker này
      const purchaseLots = [];
      let totalBought = 0;
      let totalSold = 0;

      for (const tx of transactions) {
        if (tx.type === 'BUY') {
          // Tạo lô mua mới
          const totalCost = (tx.price * tx.quantity) + tx.fee;
          
          const purchaseLot = await prisma.purchaseLot.create({
            data: {
              userId: tx.userId,
              stockAccountId: tx.stockAccountId,
              ticker: tx.ticker,
              purchaseDate: tx.transactionDate,
              quantity: tx.quantity,
              pricePerShare: tx.price,
              totalCost: totalCost,
              buyFee: tx.fee,
              remainingQuantity: tx.quantity,
            }
          });

          purchaseLots.push(purchaseLot);
          totalBought += tx.quantity;
          totalPurchaseLotsCreated++;

          // Cập nhật P/L cho transaction mua = 0
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { calculatedPl: 0 }
          });

          console.log(`   💰 Mua: ${tx.quantity} cp @ ${tx.price} VND (phí: ${tx.fee} VND)`);

        } else if (tx.type === 'SELL') {
          // Xử lý bán theo FIFO
          let remainingToSell = tx.quantity;
          let totalCOGS = 0;
          const lotsUsed = [];

          // Lấy các lô mua có thể sử dụng (theo thứ tự FIFO)
          const availableLots = purchaseLots.filter(lot => lot.remainingQuantity > 0);
          
          if (availableLots.length === 0) {
            console.log(`   ⚠️  Cảnh báo: Không có lô mua nào để bán ${tx.quantity} cp`);
            continue;
          }

          // Kiểm tra đủ số lượng không
          const totalAvailable = availableLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
          if (totalAvailable < remainingToSell) {
            console.log(`   ⚠️  Cảnh báo: Không đủ số lượng để bán. Có: ${totalAvailable}, cần: ${remainingToSell}`);
            remainingToSell = totalAvailable; // Bán số lượng có thể
          }

          // Áp dụng FIFO
          for (const lot of availableLots) {
            if (remainingToSell <= 0) break;

            const quantityFromThisLot = Math.min(remainingToSell, lot.remainingQuantity);
            const costPerShare = lot.totalCost / lot.quantity;
            const cogsFromThisLot = quantityFromThisLot * costPerShare;

            totalCOGS += cogsFromThisLot;
            remainingToSell -= quantityFromThisLot;
            lot.remainingQuantity -= quantityFromThisLot;

            // Cập nhật lô trong database
            await prisma.purchaseLot.update({
              where: { id: lot.id },
              data: { remainingQuantity: lot.remainingQuantity }
            });

            lotsUsed.push({
              lotId: lot.id,
              quantityUsed: quantityFromThisLot,
              costPerShare,
              cogsFromThisLot
            });
          }

          // Tính P/L cho giao dịch bán
          const grossSellValue = tx.price * tx.quantity;
          const sellingTax = grossSellValue * (tx.taxRate / 100);
          const netProceeds = grossSellValue - tx.fee - sellingTax;
          const profitOrLoss = netProceeds - totalCOGS;

          // Cập nhật P/L cho transaction
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { calculatedPl: profitOrLoss }
          });

          totalSold += tx.quantity;
          totalPLRecalculated++;

          console.log(`   📉 Bán: ${tx.quantity} cp @ ${tx.price} VND`);
          console.log(`      💸 COGS: ${totalCOGS.toLocaleString('vi-VN')} VND`);
          console.log(`      💰 P/L: ${profitOrLoss.toLocaleString('vi-VN')} VND`);
        }
      }

      const remainingQuantity = totalBought - totalSold;
      console.log(`   📊 Tổng kết: Mua ${totalBought}, bán ${totalSold}, còn lại ${remainingQuantity}`);
      
      processedGroups++;
      console.log(`   ✅ Hoàn thành nhóm ${processedGroups}/${Object.keys(grouped).length}`);
    }

    console.log('\n🎉 Migration hoàn thành!');
    console.log(`📈 Đã tạo ${totalPurchaseLotsCreated} purchase lots`);
    console.log(`💰 Đã tính lại P/L cho ${totalPLRecalculated} giao dịch bán`);
    console.log(`✅ Đã xử lý ${processedGroups} nhóm transaction`);

  } catch (error) {
    console.error('❌ Lỗi trong quá trình migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy migration
migrateExistingTransactions()
  .then(() => {
    console.log('🏁 Migration script hoàn thành thành công!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script thất bại:', error);
    process.exit(1);
  }); 