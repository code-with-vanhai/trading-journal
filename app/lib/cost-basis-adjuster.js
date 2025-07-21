const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Cost Basis Adjuster - Tính toán giá vốn có điều chỉnh
 * Áp dụng các adjustments vào purchase lots theo timeline
 */

/**
 * Áp dụng cost basis adjustments cho một purchase lot
 * @param {Object} purchaseLot - Purchase lot gốc
 * @param {Array} adjustments - Danh sách adjustments đã sắp xếp theo thời gian
 * @returns {Object} Adjusted purchase lot với cost basis mới
 */
function applyAdjustmentsToLot(purchaseLot, adjustments) {
  let adjustedLot = { ...purchaseLot };
  let adjustedTotalCost = purchaseLot.totalCost;
  let adjustedQuantity = purchaseLot.quantity;
  let adjustedRemainingQuantity = purchaseLot.remainingQuantity;
  
  // Lọc adjustments có hiệu lực sau ngày mua lot này
  const effectiveAdjustments = adjustments.filter(adj => 
    new Date(adj.eventDate) >= new Date(purchaseLot.purchaseDate) && adj.isActive
  );
  
  console.log(`    📋 Áp dụng ${effectiveAdjustments.length} adjustments cho lot ${purchaseLot.id}`);
  
  for (const adjustment of effectiveAdjustments) {
    switch (adjustment.adjustmentType) {
      case 'CASH_DIVIDEND':
        // Giảm cost basis theo dividend per share
        const dividendAdjustment = adjustedQuantity * adjustment.dividendPerShare;
        adjustedTotalCost -= dividendAdjustment;
        console.log(`      💰 Cash dividend: -${dividendAdjustment.toLocaleString('vi-VN')} VND (${adjustment.dividendPerShare.toLocaleString('vi-VN')} × ${adjustedQuantity})`);
        break;
        
      case 'STOCK_DIVIDEND':
      case 'STOCK_SPLIT':
        // Điều chỉnh số lượng và cost basis
        const newQuantity = Math.floor(adjustedQuantity * adjustment.splitRatio);
        const newRemainingQuantity = Math.floor(adjustedRemainingQuantity * adjustment.splitRatio);
        
        console.log(`      📈 ${adjustment.adjustmentType}: ${adjustedQuantity} → ${newQuantity} cp (ratio: ${adjustment.splitRatio})`);
        
        adjustedQuantity = newQuantity;
        adjustedRemainingQuantity = newRemainingQuantity;
        // Cost basis remains same, but cost per share decreases proportionally
        break;
        
      default:
        console.log(`      ⚠️  Adjustment type ${adjustment.adjustmentType} chưa được implement`);
        break;
    }
  }
  
  // Tính cost per share điều chỉnh
  const adjustedCostPerShare = adjustedQuantity > 0 ? adjustedTotalCost / adjustedQuantity : 0;
  
  return {
    ...adjustedLot,
    totalCost: adjustedTotalCost,
    quantity: adjustedQuantity,
    remainingQuantity: adjustedRemainingQuantity,
    adjustedCostPerShare: Math.round(adjustedCostPerShare),
    appliedAdjustments: effectiveAdjustments.length
  };
}

/**
 * Lấy tất cả adjustments có hiệu lực cho một ticker
 * @param {string} userId
 * @param {string} stockAccountId  
 * @param {string} ticker
 * @param {Date} asOfDate - Tính đến ngày này (optional)
 * @returns {Array} Danh sách adjustments
 */
async function getEffectiveAdjustments(userId, stockAccountId, ticker, asOfDate = null) {
  const whereClause = {
    userId,
    stockAccountId,
    ticker: ticker.toUpperCase(),
    isActive: true
  };
  
  if (asOfDate) {
    whereClause.eventDate = { lte: new Date(asOfDate) };
  }
  
  return await prisma.costBasisAdjustment.findMany({
    where: whereClause,
    orderBy: { eventDate: 'asc' }
  });
}

/**
 * Tính cost basis điều chỉnh cho tất cả lots của một ticker
 * @param {string} userId
 * @param {string} stockAccountId
 * @param {string} ticker
 * @param {Date} asOfDate - Tính đến ngày này (optional)
 * @returns {Object} Adjusted portfolio data
 */
async function calculateAdjustedCostBasis(userId, stockAccountId, ticker, asOfDate = null) {
  console.log(`🔄 Tính cost basis điều chỉnh cho ${ticker}...`);
  
  try {
    // 1. Lấy tất cả purchase lots
    const originalLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker: ticker.toUpperCase(),
        remainingQuantity: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });
    
    if (originalLots.length === 0) {
      return {
        ticker,
        totalQuantity: 0,
        totalCost: 0,
        averageCostBasis: 0,
        adjustedLots: [],
        appliedAdjustmentsCount: 0
      };
    }
    
    // 2. Lấy tất cả adjustments
    const adjustments = await getEffectiveAdjustments(userId, stockAccountId, ticker, asOfDate);
    
    console.log(`  📊 Tìm thấy ${originalLots.length} lots và ${adjustments.length} adjustments`);
    
    // 3. Áp dụng adjustments cho từng lot
    const adjustedLots = originalLots.map(lot => 
      applyAdjustmentsToLot(lot, adjustments)
    );
    
    // 4. Tính tổng kết
    const totalQuantity = adjustedLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const totalCost = adjustedLots.reduce((sum, lot) => {
      return sum + (lot.remainingQuantity * lot.adjustedCostPerShare);
    }, 0);
    const averageCostBasis = totalQuantity > 0 ? totalCost / totalQuantity : 0;
    
    console.log(`  ✅ Kết quả:`);
    console.log(`     Tổng SL: ${totalQuantity} cp`);
    console.log(`     Tổng cost: ${totalCost.toLocaleString('vi-VN')} VND`);
    console.log(`     Giá vốn TB: ${Math.round(averageCostBasis).toLocaleString('vi-VN')} VND/cp`);
    
    return {
      ticker,
      totalQuantity,
      totalCost,
      averageCostBasis: Math.round(averageCostBasis),
      adjustedLots,
      appliedAdjustmentsCount: adjustments.length,
      adjustments
    };
    
  } catch (error) {
    console.error(`❌ Lỗi tính cost basis điều chỉnh cho ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Áp dụng adjustments cho toàn bộ portfolio
 * @param {string} userId
 * @param {string} stockAccountId - optional, nếu null thì lấy tất cả accounts
 * @param {Date} asOfDate - optional
 * @returns {Array} Adjusted portfolio
 */
async function calculateAdjustedPortfolio(userId, stockAccountId = null, asOfDate = null) {
  console.log(`🔄 Tính portfolio điều chỉnh cho user ${userId}...`);
  
  try {
    // Lấy danh sách tất cả tickers có trong portfolio
    const whereClause = { 
      userId,
      remainingQuantity: { gt: 0 }
    };
    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }
    
    const activeLots = await prisma.purchaseLot.findMany({
      where: whereClause,
      distinct: ['ticker', 'stockAccountId'],
      select: { ticker: true, stockAccountId: true }
    });
    
    console.log(`  📋 Tìm thấy ${activeLots.length} ticker-account combinations`);
    
    // Tính cost basis điều chỉnh cho từng ticker-account
    const adjustedPositions = [];
    
    for (const position of activeLots) {
      try {
        const adjustedData = await calculateAdjustedCostBasis(
          userId,
          position.stockAccountId,
          position.ticker,
          asOfDate
        );
        
        if (adjustedData.totalQuantity > 0) {
          adjustedPositions.push({
            ...adjustedData,
            stockAccountId: position.stockAccountId
          });
        }
      } catch (error) {
        console.error(`❌ Lỗi tính ${position.ticker}:`, error.message);
        // Continue with other positions
      }
    }
    
    console.log(`✅ Hoàn thành portfolio điều chỉnh: ${adjustedPositions.length} positions`);
    
    return adjustedPositions;
    
  } catch (error) {
    console.error(`❌ Lỗi tính portfolio điều chỉnh:`, error.message);
    throw error;
  }
}

/**
 * So sánh cost basis trước và sau adjustments
 * @param {string} userId
 * @param {string} stockAccountId
 * @param {string} ticker
 * @returns {Object} Comparison data
 */
async function compareCostBasis(userId, stockAccountId, ticker) {
  try {
    // Cost basis gốc (không điều chỉnh)
    const originalLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker: ticker.toUpperCase(),
        remainingQuantity: { gt: 0 }
      }
    });
    
    const originalTotalQuantity = originalLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const originalTotalCost = originalLots.reduce((sum, lot) => {
      const costPerShare = Math.round(lot.totalCost / lot.quantity);
      return sum + (lot.remainingQuantity * costPerShare);
    }, 0);
    const originalAvgCost = originalTotalQuantity > 0 ? originalTotalCost / originalTotalQuantity : 0;
    
    // Cost basis điều chỉnh
    const adjustedData = await calculateAdjustedCostBasis(userId, stockAccountId, ticker);
    
    return {
      ticker,
      original: {
        totalQuantity: originalTotalQuantity,
        totalCost: originalTotalCost,
        averageCostBasis: Math.round(originalAvgCost)
      },
      adjusted: {
        totalQuantity: adjustedData.totalQuantity,
        totalCost: adjustedData.totalCost,
        averageCostBasis: adjustedData.averageCostBasis
      },
      differences: {
        quantityDiff: adjustedData.totalQuantity - originalTotalQuantity,
        costDiff: adjustedData.totalCost - originalTotalCost,
        avgCostDiff: adjustedData.averageCostBasis - Math.round(originalAvgCost)
      },
      adjustments: adjustedData.adjustments
    };
  } catch (error) {
    console.error(`❌ Lỗi so sánh cost basis cho ${ticker}:`, error.message);
    throw error;
  }
}

module.exports = {
  applyAdjustmentsToLot,
  getEffectiveAdjustments,
  calculateAdjustedCostBasis,
  calculateAdjustedPortfolio,
  compareCostBasis
}; 