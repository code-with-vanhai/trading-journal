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
    const costPerShare = Math.round(lot.totalCost / lot.quantity); // Làm tròn giá vốn mỗi cổ phiếu
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
  const sellingTax = Math.round(grossSellValue * (taxRate / 100)); // Làm tròn thuế
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
    const costPerShare = Math.round(lot.totalCost / lot.quantity); // Làm tròn giá vốn mỗi cổ phiếu
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
    
          const costPerShare = Math.round(lot.totalCost / lot.quantity); // Làm tròn giá vốn mỗi cổ phiếu
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
  calculatePortfolioWithNewCostBasis,
  // New functions for adjustment integration
  calculatePortfolioWithAdjustments,
  getCurrentAvgCostWithAdjustments,
  processSellTransactionWithAdjustments
};

/**
 * Tính toán portfolio với cost basis adjustments
 * @param {string} userId 
 * @param {string} stockAccountId - optional
 * @param {boolean} includeAdjustments - whether to apply cost basis adjustments
 * @returns {Array} Portfolio với adjusted cost basis
 */
async function calculatePortfolioWithAdjustments(userId, stockAccountId = null, includeAdjustments = true) {
  // Import cost basis adjuster (lazy loading)
  const { calculateAdjustedPortfolio } = require('./cost-basis-adjuster');
  
  if (includeAdjustments) {
    console.log('🔄 Using adjusted cost basis calculation...');
    try {
      // Sử dụng calculation mới với adjustments
      const adjustedPositions = await calculateAdjustedPortfolio(userId, stockAccountId);
      
      // Convert to format compatible with existing code
      const portfolioResults = [];
      
      for (const position of adjustedPositions) {
        // Get stock account info
        const stockAccount = await prisma.stockAccount.findFirst({
          where: { id: position.stockAccountId },
          select: { id: true, name: true, brokerName: true }
        });
        
        portfolioResults.push({
          ticker: position.ticker,
          stockAccountId: position.stockAccountId,
          quantity: position.totalQuantity,
          totalCost: position.totalCost,
          avgCost: position.averageCostBasis,
          stockAccount: stockAccount,
          // Additional fields for adjustment tracking
          appliedAdjustmentsCount: position.appliedAdjustmentsCount,
          adjustedLots: position.adjustedLots,
          adjustments: position.adjustments
        });
      }
      
      console.log(`✅ Portfolio with adjustments: ${portfolioResults.length} positions`);
      return portfolioResults;
      
    } catch (error) {
      console.error('❌ Error calculating adjusted portfolio, falling back to original:', error.message);
      // Fall back to original calculation
      return await calculatePortfolioWithNewCostBasis(userId, stockAccountId);
    }
  } else {
    console.log('🔄 Using original cost basis calculation...');
    return await calculatePortfolioWithNewCostBasis(userId, stockAccountId);
  }
}

/**
 * Lấy average cost hiện tại với adjustments
 * @param {string} userId 
 * @param {string} stockAccountId 
 * @param {string} ticker 
 * @param {boolean} includeAdjustments 
 * @returns {Object} Cost basis info
 */
async function getCurrentAvgCostWithAdjustments(userId, stockAccountId, ticker, includeAdjustments = true) {
  if (includeAdjustments) {
    try {
      const { calculateAdjustedCostBasis } = require('./cost-basis-adjuster');
      const adjustedData = await calculateAdjustedCostBasis(userId, stockAccountId, ticker);
      
      return {
        avgCost: adjustedData.averageCostBasis,
        totalQuantity: adjustedData.totalQuantity,
        totalCost: adjustedData.totalCost,
        appliedAdjustments: adjustedData.appliedAdjustmentsCount
      };
      
    } catch (error) {
      console.error(`❌ Error getting adjusted cost basis for ${ticker}, falling back:`, error.message);
      // Fall back to original
      return await getCurrentAvgCost(userId, stockAccountId, ticker);
    }
  } else {
    return await getCurrentAvgCost(userId, stockAccountId, ticker);
  }
}

/**
 * Xử lý giao dịch bán với adjustments (FIFO + cost basis adjustments)
 * @param {string} userId 
 * @param {string} stockAccountId 
 * @param {string} ticker 
 * @param {number} quantity 
 * @param {number} price 
 * @param {number} fee 
 * @param {number} taxRate 
 * @param {Date} transactionDate 
 * @param {boolean} includeAdjustments 
 * @returns {Object} Sell transaction result
 */
async function processSellTransactionWithAdjustments(userId, stockAccountId, ticker, quantity, price, fee, taxRate, transactionDate, includeAdjustments = true) {
  if (includeAdjustments) {
    console.log(`🔄 Processing sell transaction with adjustments for ${ticker}...`);
    
    try {
      const { calculateAdjustedCostBasis } = require('./cost-basis-adjuster');
      
      // 1. Get adjusted cost basis data
      const adjustedData = await calculateAdjustedCostBasis(userId, stockAccountId, ticker);
      
      if (adjustedData.totalQuantity < quantity) {
        throw new Error(`Không đủ số lượng để bán. Có: ${adjustedData.totalQuantity}, cần bán: ${quantity}`);
      }
      
      // 2. Apply FIFO với adjusted cost basis
      let remainingToSell = quantity;
      let totalCOGS = 0;
      const lotsUsed = [];
      
      for (const adjustedLot of adjustedData.adjustedLots) {
        if (remainingToSell <= 0) break;
        
        const quantityFromThisLot = Math.min(remainingToSell, adjustedLot.remainingQuantity);
        const cogsFromThisLot = quantityFromThisLot * adjustedLot.adjustedCostPerShare;
        
        totalCOGS += cogsFromThisLot;
        remainingToSell -= quantityFromThisLot;
        
        // Update original lot remaining quantity
        await prisma.purchaseLot.update({
          where: { id: adjustedLot.id },
          data: { remainingQuantity: adjustedLot.remainingQuantity - quantityFromThisLot }
        });
        
        lotsUsed.push({
          lotId: adjustedLot.id,
          quantityUsed: quantityFromThisLot,
          costPerShare: adjustedLot.adjustedCostPerShare,
          cogsFromThisLot
        });
      }
      
      // 3. Calculate P/L
      const grossSellValue = price * quantity;
      const sellingTax = Math.round(grossSellValue * (taxRate / 100));
      const netProceeds = grossSellValue - fee - sellingTax;
      const profitOrLoss = netProceeds - totalCOGS;
      
      console.log(`✅ Sell with adjustments completed: P/L = ${profitOrLoss.toLocaleString('vi-VN')} VND`);
      
      return {
        profitOrLoss,
        totalCOGS,
        grossSellValue,
        sellingTax,
        netProceeds,
        lotsUsed,
        usedAdjustments: true,
        adjustedCostBasis: true
      };
      
    } catch (error) {
      console.error(`❌ Error processing sell with adjustments for ${ticker}, falling back:`, error.message);
      // Fall back to original sell processing
      return await processSellTransaction(userId, stockAccountId, ticker, quantity, price, fee, taxRate, transactionDate);
    }
  } else {
    console.log(`🔄 Processing sell transaction without adjustments for ${ticker}...`);
    return await processSellTransaction(userId, stockAccountId, ticker, quantity, price, fee, taxRate, transactionDate);
  }
} 