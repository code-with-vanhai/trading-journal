const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Tính giá vốn theo phương pháp FIFO nghiêm ngặt
 * Bao gồm phí mua vào giá vốn và xử lý thuế bán theo %
 */

/**
 * Xử lý giao dịch MUA - tạo lô mua mới
 */
async function processBuyTransaction(userId, stockAccountId, ticker, quantity, price, fee, transactionDate) {
  // Tính tổng chi phí của lô mua này (bao gồm phí)
  const totalCost = (price * quantity) + fee;
  
  // Tạo lô mua mới
  const purchaseLot = await prisma.purchaseLot.create({
    data: {
      userId,
      stockAccountId,
      ticker: ticker.toUpperCase(),
      purchaseDate: new Date(transactionDate),
      quantity,
      pricePerShare: price,
      totalCost,
      buyFee: fee,
      remainingQuantity: quantity, // Ban đầu chưa bán cái nào
    }
  });
  
  return purchaseLot;
}

/**
 * Xử lý giao dịch BÁN - áp dụng FIFO nghiêm ngặt
 */
async function processSellTransaction(userId, stockAccountId, ticker, quantity, price, fee, taxRate, transactionDate) {
  // Lấy tất cả lô mua của ticker này trong cùng tài khoản, sắp xếp theo ngày mua (FIFO)
  const availableLots = await prisma.purchaseLot.findMany({
    where: {
      userId,
      stockAccountId,
      ticker: ticker.toUpperCase(),
      remainingQuantity: {
        gt: 0
      }
    },
    orderBy: {
      purchaseDate: 'asc'
    }
  });
  
  if (availableLots.length === 0) {
    throw new Error(`Không tìm thấy lô mua nào cho ${ticker} trong tài khoản này`);
  }
  
  // Kiểm tra đủ số lượng để bán không
  const totalAvailable = availableLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  if (totalAvailable < quantity) {
    throw new Error(`Không đủ số lượng để bán. Có: ${totalAvailable}, cần bán: ${quantity}`);
  }
  
  let remainingToSell = quantity;
  let totalCOGS = 0; // Cost of Goods Sold
  const lotsUsed = [];
  
  // Áp dụng FIFO - bán từ lô cũ nhất
  for (const lot of availableLots) {
    if (remainingToSell <= 0) break;
    
    const quantityFromThisLot = Math.min(remainingToSell, lot.remainingQuantity);
    const costPerShare = lot.totalCost / lot.quantity; // Giá vốn thực tế mỗi cổ phiếu (đã bao gồm phí mua)
    const cogsFromThisLot = quantityFromThisLot * costPerShare;
    
    totalCOGS += cogsFromThisLot;
    remainingToSell -= quantityFromThisLot;
    
    lotsUsed.push({
      lotId: lot.id,
      quantityUsed: quantityFromThisLot,
      costPerShare,
      cogsFromThisLot,
      newRemainingQuantity: lot.remainingQuantity - quantityFromThisLot
    });
  }
  
  // Tính tiền thu về ròng
  const grossSellValue = price * quantity;
  const sellingTax = grossSellValue * (taxRate / 100);
  const netProceeds = grossSellValue - fee - sellingTax;
  
  // Tính lãi/lỗ
  const profitOrLoss = netProceeds - totalCOGS;
  
  // Cập nhật các lô đã sử dụng
  for (const lotUsed of lotsUsed) {
    await prisma.purchaseLot.update({
      where: { id: lotUsed.lotId },
      data: { remainingQuantity: lotUsed.newRemainingQuantity }
    });
  }
  
  return {
    profitOrLoss,
    totalCOGS,
    grossSellValue,
    sellingTax,
    netProceeds,
    lotsUsed
  };
}

/**
 * Tính giá vốn trung bình hiện tại của một ticker trong tài khoản
 */
async function getCurrentAvgCost(userId, stockAccountId, ticker) {
  const activeLots = await prisma.purchaseLot.findMany({
    where: {
      userId,
      stockAccountId,
      ticker: ticker.toUpperCase(),
      remainingQuantity: {
        gt: 0
      }
    }
  });
  
  if (activeLots.length === 0) {
    return { avgCost: 0, totalQuantity: 0, totalCost: 0 };
  }
  
  const totalQuantity = activeLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
  const totalCost = activeLots.reduce((sum, lot) => {
    const costPerShare = lot.totalCost / lot.quantity;
    return sum + (lot.remainingQuantity * costPerShare);
  }, 0);
  
  const avgCost = totalCost / totalQuantity;
  
  return { avgCost, totalQuantity, totalCost };
}

/**
 * Tính toán portfolio với giá vốn mới
 */
async function calculatePortfolioWithNewCostBasis(userId, stockAccountId = null) {
  const whereClause = {
    userId,
    remainingQuantity: {
      gt: 0
    }
  };
  
  if (stockAccountId) {
    whereClause.stockAccountId = stockAccountId;
  }
  
  const activeLots = await prisma.purchaseLot.findMany({
    where: whereClause,
    include: {
      user: true
    }
  });
  
  // Nhóm theo ticker và tài khoản
  const portfolio = {};
  
  for (const lot of activeLots) {
    const key = `${lot.ticker}-${lot.stockAccountId}`;
    
    if (!portfolio[key]) {
      portfolio[key] = {
        ticker: lot.ticker,
        stockAccountId: lot.stockAccountId,
        quantity: 0,
        totalCost: 0,
        avgCost: 0,
        stockAccount: null // Sẽ được populate sau
      };
    }
    
    const costPerShare = lot.totalCost / lot.quantity;
    portfolio[key].quantity += lot.remainingQuantity;
    portfolio[key].totalCost += lot.remainingQuantity * costPerShare;
  }
  
  // Tính giá vốn trung bình cho mỗi ticker
  Object.values(portfolio).forEach(holding => {
    holding.avgCost = holding.totalCost / holding.quantity;
  });
  
  // Lấy thông tin stock accounts để populate stockAccount field
  const stockAccountIds = [...new Set(Object.values(portfolio).map(p => p.stockAccountId))];
  if (stockAccountIds.length > 0) {
    const stockAccounts = await prisma.stockAccount.findMany({
      where: {
        id: { in: stockAccountIds }
      },
      select: {
        id: true,
        name: true,
        brokerName: true
      }
    });
    
    const stockAccountMap = stockAccounts.reduce((map, account) => {
      map[account.id] = account;
      return map;
    }, {});
    
    // Populate stockAccount information
    Object.values(portfolio).forEach(holding => {
      holding.stockAccount = stockAccountMap[holding.stockAccountId] || null;
    });
  }
  
  return Object.values(portfolio);
}

module.exports = {
  processBuyTransaction,
  processSellTransaction,
  getCurrentAvgCost,
  calculatePortfolioWithNewCostBasis
}; 