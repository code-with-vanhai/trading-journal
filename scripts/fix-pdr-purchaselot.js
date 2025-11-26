// Script fix data PDR PurchaseLot
// ✅ APPROVED để chạy trên production

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

async function fixPDRPurchaseLot() {
  console.log('🔍 Tìm PurchaseLot PDR cần fix...\n');
  
  // Tìm lot có giá sai (27.8 thay vì 25.2)
  const lot = await prisma.purchaseLot.findFirst({
    where: { 
      ticker: 'PDR', 
      pricePerShare: 27800,
      quantity: 5000  // Đảm bảo đúng lô cần fix
    }
  });
  
  if (!lot) {
    console.log('❌ Không tìm thấy PurchaseLot cần fix');
    return;
  }
  
  console.log('📋 Lot hiện tại:', {
    id: lot.id,
    ticker: lot.ticker,
    quantity: lot.quantity,
    pricePerShare: lot.pricePerShare,
    totalCost: lot.totalCost,
    buyFee: lot.buyFee
  });
  
  // Tính toán giá trị mới
  const correctPrice = 25200;
  const newTotalCost = (correctPrice * lot.quantity) + (lot.buyFee || 0);
  
  console.log('\n🔄 Giá trị mới:', {
    pricePerShare: correctPrice,
    totalCost: newTotalCost
  });
  
  console.log('\n📊 So sánh:');
  console.log(`  Giá cũ: ${lot.pricePerShare} → Giá mới: ${correctPrice}`);
  console.log(`  Total cost cũ: ${lot.totalCost} → Total cost mới: ${newTotalCost}`);
  console.log(`  Chênh lệch: ${lot.totalCost - newTotalCost}`);
  
  // Confirm trước khi update
  const rl = readline.createInterface({ 
    input: process.stdin, 
    output: process.stdout 
  });
  
  const answer = await new Promise(resolve => {
    rl.question('\n⚠️  Xác nhận update? (yes/no): ', resolve);
  });
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Đã hủy');
    return;
  }
  
  // Execute update
  const updated = await prisma.purchaseLot.update({
    where: { id: lot.id },
    data: {
      pricePerShare: correctPrice,
      totalCost: newTotalCost
    }
  });
  
  console.log('\n✅ Đã cập nhật thành công!');
  console.log('📋 Lot sau khi update:', {
    id: updated.id,
    ticker: updated.ticker,
    quantity: updated.quantity,
    pricePerShare: updated.pricePerShare,
    totalCost: updated.totalCost,
    buyFee: updated.buyFee
  });
  
  // Tính lại giá vốn trung bình
  console.log('\n📈 Kiểm tra giá vốn trung bình mới...');
  const allLots = await prisma.purchaseLot.findMany({
    where: { ticker: 'PDR' },
    select: {
      quantity: true,
      totalCost: true,
      remainingQuantity: true
    }
  });
  
  const totalQuantity = allLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  const totalCost = allLots.reduce((sum, lot) => {
    const remainingRatio = lot.remainingQuantity / lot.quantity;
    return sum + (lot.totalCost * remainingRatio);
  }, 0);
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  
  console.log(`  Tổng số lượng còn lại: ${totalQuantity}`);
  console.log(`  Tổng chi phí: ${totalCost.toFixed(2)}`);
  console.log(`  Giá vốn TB mới: ${avgCost.toFixed(2)} VND`);
}

fixPDRPurchaseLot()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
