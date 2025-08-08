// Use centralized Prisma client
const dbModule = require('./database.js');
const prisma = dbModule.default || dbModule;

/**
 * Dividend Processor - Xử lý các sự kiện corporate actions
 * Dựa trên phương pháp FIFO nghiêm ngặt với cost basis adjustment
 */

/**
 * Xử lý cổ tức tiền mặt
 * @param {string} userId - ID của user
 * @param {string} stockAccountId - ID của stock account  
 * @param {string} ticker - Mã cổ phiếu
 * @param {number} dividendPerShare - Cổ tức mỗi cổ phiếu (VND)
 * @param {Date} exDate - Ngày ex-dividend
 * @param {number} taxRate - Thuế suất (mặc định 0.05 = 5%)
 * @param {string} description - Mô tả
 * @param {string} externalRef - Tham chiếu external
 */
async function handleCashDividend(userId, stockAccountId, ticker, dividendPerShare, exDate, taxRate = 0.05, description = null, externalRef = null) {
  console.log(`🔄 Xử lý cổ tức tiền mặt cho ${ticker}: ${dividendPerShare.toLocaleString('vi-VN')} VND/cp`);
  
  try {
    // Lấy tất cả purchase lots hiện có của ticker này
    const activeLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker: ticker.toUpperCase(),
        remainingQuantity: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });
    
    if (activeLots.length === 0) {
      throw new Error(`Không tìm thấy lô mua nào cho ${ticker} trong tài khoản này`);
    }
    
    // Tính tổng số cổ phiếu hiện có
    const totalShares = activeLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const totalDividend = totalShares * dividendPerShare;
    const totalTax = totalDividend * taxRate;
    const netDividendReceived = totalDividend - totalTax;
    
    console.log(`  📊 Thống kê:`);
    console.log(`     Tổng số cổ phiếu: ${totalShares} cp`);
    console.log(`     Cổ tức trước thuế: ${totalDividend.toLocaleString('vi-VN')} VND`);
    console.log(`     Thuế (${(taxRate * 100).toFixed(1)}%): ${totalTax.toLocaleString('vi-VN')} VND`);
    console.log(`     Cổ tức thực nhận: ${netDividendReceived.toLocaleString('vi-VN')} VND`);
    
    // Sử dụng transaction để đảm bảo consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tạo cost basis adjustment record
      const adjustment = await tx.costBasisAdjustment.create({
        data: {
          userId,
          stockAccountId,
          ticker: ticker.toUpperCase(),
          adjustmentType: 'CASH_DIVIDEND',
          eventDate: new Date(exDate),
          dividendPerShare,
          taxRate,
          description: description || `Cổ tức tiền mặt ${ticker} - ${dividendPerShare.toLocaleString('vi-VN')} VND/cp`,
          externalRef,
          isActive: true,
          processedAt: new Date(),
          createdBy: userId
        }
      });
      
      // 2. Tạo account fee record cho thuế
      const taxRecord = await tx.accountFee.create({
        data: {
          userId,
          stockAccountId,
          feeType: 'DIVIDEND_TAX',
          amount: totalTax,
          description: `Thuế cổ tức ${ticker} - ${dividendPerShare.toLocaleString('vi-VN')} VND/cp × ${totalShares} cp`,
          feeDate: new Date(exDate),
          referenceNumber: externalRef,
          isActive: true
        }
      });
      
      return { adjustment, taxRecord, totalDividend, totalTax, netDividendReceived };
    });
    
    console.log(`✅ Đã tạo adjustment ID: ${result.adjustment.id}`);
    console.log(`✅ Đã tạo tax record ID: ${result.taxRecord.id}`);
    
    return {
      success: true,
      adjustmentId: result.adjustment.id,
      taxRecordId: result.taxRecord.id,
      totalShares,
      totalDividend: result.totalDividend,
      totalTax: result.totalTax,
      netDividendReceived: result.netDividendReceived,
      dividendPerShare
    };
    
  } catch (error) {
    console.error(`❌ Lỗi xử lý cổ tức ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Xử lý cổ tức cổ phiếu (stock dividend)
 * @param {string} userId - ID của user
 * @param {string} stockAccountId - ID của stock account
 * @param {string} ticker - Mã cổ phiếu
 * @param {number} stockDividendRatio - Tỷ lệ cổ tức cổ phiếu (e.g., 0.1 = 10%)
 * @param {Date} exDate - Ngày ex-dividend
 * @param {string} description - Mô tả
 * @param {string} externalRef - Tham chiếu external
 */
async function handleStockDividend(userId, stockAccountId, ticker, stockDividendRatio, exDate, description = null, externalRef = null) {
  console.log(`🔄 Xử lý cổ tức cổ phiếu cho ${ticker}: ${(stockDividendRatio * 100).toFixed(2)}%`);
  
  try {
    // Lấy tất cả purchase lots hiện có
    const activeLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker: ticker.toUpperCase(),
        remainingQuantity: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });
    
    if (activeLots.length === 0) {
      throw new Error(`Không tìm thấy lô mua nào cho ${ticker} trong tài khoản này`);
    }
    
    const totalShares = activeLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const bonusShares = Math.floor(totalShares * stockDividendRatio); // Làm tròn xuống
    
    console.log(`  📊 Thống kê:`);
    console.log(`     Tổng số cổ phiếu hiện có: ${totalShares} cp`);
    console.log(`     Cổ phiếu thưởng nhận được: ${bonusShares} cp`);
    console.log(`     Tỷ lệ thực tế: ${(bonusShares / totalShares * 100).toFixed(4)}%`);
    
    const result = await prisma.$transaction(async (tx) => {
      // Tạo adjustment record cho stock dividend
      const adjustment = await tx.costBasisAdjustment.create({
        data: {
          userId,
          stockAccountId,
          ticker: ticker.toUpperCase(),
          adjustmentType: 'STOCK_DIVIDEND',
          eventDate: new Date(exDate),
          splitRatio: 1 + stockDividendRatio, // e.g., 1.1 cho 10% stock dividend
          description: description || `Cổ tức cổ phiếu ${ticker} - ${(stockDividendRatio * 100).toFixed(2)}%`,
          externalRef,
          isActive: true,
          processedAt: new Date(),
          createdBy: userId
        }
      });
      
      return { adjustment, bonusShares };
    });
    
    console.log(`✅ Đã tạo stock dividend adjustment ID: ${result.adjustment.id}`);
    
    return {
      success: true,
      adjustmentId: result.adjustment.id,
      totalShares,
      bonusShares: result.bonusShares,
      stockDividendRatio
    };
    
  } catch (error) {
    console.error(`❌ Lỗi xử lý cổ tức cổ phiếu ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Xử lý chia tách cổ phiếu (stock split)
 * @param {string} userId - ID của user
 * @param {string} stockAccountId - ID của stock account
 * @param {string} ticker - Mã cổ phiếu
 * @param {number} splitRatio - Tỷ lệ chia tách (e.g., 2.0 cho split 1:2)
 * @param {Date} exDate - Ngày thực hiện split
 * @param {string} description - Mô tả
 * @param {string} externalRef - Tham chiếu external
 */
async function handleStockSplit(userId, stockAccountId, ticker, splitRatio, exDate, description = null, externalRef = null) {
  console.log(`🔄 Xử lý chia tách cổ phiếu cho ${ticker}: tỷ lệ ${splitRatio}:1`);
  
  try {
    const activeLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker: ticker.toUpperCase(),
        remainingQuantity: { gt: 0 }
      },
      orderBy: { purchaseDate: 'asc' }
    });
    
    if (activeLots.length === 0) {
      throw new Error(`Không tìm thấy lô mua nào cho ${ticker} trong tài khoản này`);
    }
    
    const totalSharesBefore = activeLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
    const totalSharesAfter = Math.floor(totalSharesBefore * splitRatio);
    
    console.log(`  📊 Thống kê:`);
    console.log(`     Số cổ phiếu trước split: ${totalSharesBefore} cp`);
    console.log(`     Số cổ phiếu sau split: ${totalSharesAfter} cp`);
    console.log(`     Tỷ lệ split: ${splitRatio}:1`);
    
    const result = await prisma.$transaction(async (tx) => {
      // Tạo adjustment record cho stock split
      const adjustment = await tx.costBasisAdjustment.create({
        data: {
          userId,
          stockAccountId,
          ticker: ticker.toUpperCase(),
          adjustmentType: 'STOCK_SPLIT',
          eventDate: new Date(exDate),
          splitRatio,
          description: description || `Chia tách cổ phiếu ${ticker} - tỷ lệ ${splitRatio}:1`,
          externalRef,
          isActive: true,
          processedAt: new Date(),
          createdBy: userId
        }
      });
      
      return { adjustment, totalSharesAfter };
    });
    
    console.log(`✅ Đã tạo stock split adjustment ID: ${result.adjustment.id}`);
    
    return {
      success: true,
      adjustmentId: result.adjustment.id,
      totalSharesBefore,
      totalSharesAfter: result.totalSharesAfter,
      splitRatio
    };
    
  } catch (error) {
    console.error(`❌ Lỗi xử lý chia tách cổ phiếu ${ticker}:`, error.message);
    throw error;
  }
}

/**
 * Lấy tất cả adjustments cho một ticker trong một stock account
 */
async function getAdjustmentsForStock(userId, stockAccountId, ticker) {
  return await prisma.costBasisAdjustment.findMany({
    where: {
      userId,
      stockAccountId,
      ticker: ticker.toUpperCase(),
      isActive: true
    },
    orderBy: { eventDate: 'asc' }
  });
}

/**
 * Validate adjustment trước khi tạo
 */
function validateAdjustmentData(adjustmentType, data) {
  switch (adjustmentType) {
    case 'CASH_DIVIDEND':
      if (!data.dividendPerShare || data.dividendPerShare <= 0) {
        throw new Error('Cổ tức mỗi cổ phiếu phải lớn hơn 0');
      }
      if (!data.taxRate || data.taxRate < 0 || data.taxRate > 1) {
        throw new Error('Thuế suất phải nằm trong khoảng 0-1');
      }
      break;
    case 'STOCK_DIVIDEND':
      if (!data.stockDividendRatio || data.stockDividendRatio <= 0) {
        throw new Error('Tỷ lệ cổ tức cổ phiếu phải lớn hơn 0');
      }
      break;
    case 'STOCK_SPLIT':
      if (!data.splitRatio || data.splitRatio <= 0) {
        throw new Error('Tỷ lệ chia tách phải lớn hơn 0');
      }
      break;
    default:
      throw new Error(`Loại adjustment không được hỗ trợ: ${adjustmentType}`);
  }
}

module.exports = {
  handleCashDividend,
  handleStockDividend,
  handleStockSplit,
  getAdjustmentsForStock,
  validateAdjustmentData
}; 