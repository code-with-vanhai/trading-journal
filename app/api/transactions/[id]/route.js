import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../../lib/database.js';
import { authOptions } from '../../auth/[...nextauth]/route';

// Create a single Prisma instance with query logging in development
const globalForPrisma = global;

// Enable query logging in development to help debug slow queries
const prisma = db;

// Improved caching with longer TTL for single transaction fetches
const singleTransactionCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL for individual transactions
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

/**
 * Tìm PurchaseLot tương ứng với Transaction
 * Match theo: userId, stockAccountId, ticker, transactionDate (±1 day), quantity gốc
 */
async function findMatchingPurchaseLot(userId, stockAccountId, ticker, transactionDate, originalQuantity) {
  const txDate = new Date(transactionDate);
  
  return await prisma.purchaseLot.findFirst({
    where: {
      userId,
      stockAccountId,
      ticker: ticker.toUpperCase(),
      quantity: originalQuantity, // Match quantity gốc khi tạo
      purchaseDate: {
        gte: new Date(txDate.getTime() - 24 * 60 * 60 * 1000),
        lte: new Date(txDate.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      createdAt: 'desc' // Lấy lot mới nhất nếu có nhiều match
    }
  });
}

/**
 * Cập nhật PurchaseLot khi sửa giao dịch BUY
 * @returns {Object} { success, message, updatedLot }
 */
async function updatePurchaseLotForEditedBuy(
  lotId,
  originalLot,
  newData // { quantity, price, fee, transactionDate }
) {
  const DRY_RUN = process.env.DRY_RUN === 'true';
  const { quantity: newQuantity, price: newPrice, fee: newFee, transactionDate: newDate } = newData;
  const oldQuantity = originalLot.quantity;
  
  // Validate quantity change
  if (newQuantity < oldQuantity) {
    const quantityReduction = oldQuantity - newQuantity;
    const soldQuantity = oldQuantity - originalLot.remainingQuantity;
    
    if (quantityReduction > originalLot.remainingQuantity) {
      return {
        success: false,
        message: `Không thể giảm số lượng xuống ${newQuantity}. Đã bán ${soldQuantity} cổ phiếu từ lô này.`
      };
    }
  }
  
  // Calculate new values
  const newTotalCost = (newPrice * newQuantity) + (newFee || 0);
  const quantityDiff = newQuantity - oldQuantity;
  const newRemainingQuantity = originalLot.remainingQuantity + quantityDiff;
  
  // DRY-RUN mode: chỉ log, không execute
  if (DRY_RUN) {
    console.log('[DRY-RUN] Would update PurchaseLot:', {
      lotId,
      oldValues: { 
        quantity: originalLot.quantity, 
        pricePerShare: originalLot.pricePerShare,
        totalCost: originalLot.totalCost,
        remainingQuantity: originalLot.remainingQuantity
      },
      newValues: { 
        quantity: newQuantity, 
        pricePerShare: newPrice, 
        totalCost: newTotalCost,
        remainingQuantity: newRemainingQuantity
      }
    });
    return { success: true, dryRun: true, message: 'DRY-RUN: No changes made' };
  }
  
  // Update PurchaseLot
  const updatedLot = await prisma.purchaseLot.update({
    where: { id: lotId },
    data: {
      quantity: newQuantity,
      pricePerShare: newPrice,
      totalCost: newTotalCost,
      buyFee: newFee || 0,
      remainingQuantity: newRemainingQuantity,
      purchaseDate: newDate ? new Date(newDate) : undefined
    }
  });
  
  return {
    success: true,
    message: 'PurchaseLot updated successfully',
    updatedLot
  };
}

// Calculate profit/loss for a SELL transaction
const calculateProfitLoss = async (userId, stockAccountId, ticker, quantity, sellPrice, fee, taxRate) => {
  // Get all BUY transactions for this ticker in the same stock account, ordered by date (FIFO method)
  const buyTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      stockAccountId, // Only consider transactions from the same stock account
      ticker,
      type: 'BUY',
    },
    orderBy: {
      transactionDate: 'asc',
    },
    select: {
      quantity: true,
      price: true,
    }
  });
  
  if (buyTransactions.length === 0) {
    return 0; // No buy transactions found
  }
  
  let remainingQuantity = quantity;
  let totalCost = 0;
  
  // Calculate cost basis using FIFO method
  for (const buyTx of buyTransactions) {
    if (remainingQuantity <= 0) break;
    
    const quantityToUse = Math.min(remainingQuantity, buyTx.quantity);
    totalCost += quantityToUse * buyTx.price;
    remainingQuantity -= quantityToUse;
  }
  
  // If we couldn't find enough BUY transactions
  if (remainingQuantity > 0) {
    return 0; // Not enough buy transactions to calculate P/L
  }
  
  // Calculate gross profit
  const grossProfit = (sellPrice * quantity) - totalCost;
  
  // Subtract fees
  const netProfit = grossProfit - fee;
  
  // Apply tax (if applicable)
  const afterTaxProfit = netProfit > 0 
    ? netProfit * (1 - (taxRate / 100)) 
    : netProfit;
  
  return afterTaxProfit;
};

// GET - Fetch a transaction by ID
export async function GET(request, { params }) {
  try {
    const startTime = Date.now();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Create cache key
    const cacheKey = `${session.user.id}-${id}`;
    
    // Check cache first
    const cachedTransaction = singleTransactionCache.get(cacheKey);
    if (cachedTransaction && cachedTransaction.timestamp > Date.now() - CACHE_TTL) {
      console.log(`[Transaction API] Cache hit for ID ${id} - ${Date.now() - startTime}ms`);
      return NextResponse.json(cachedTransaction.data);
    }

    // Use Prisma's standard query approach instead of raw SQL
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: id
      }
    });

    // If no transaction found, return 404
    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Format the response to match the expected structure
    const formattedTransaction = {
      ...transaction,
      journalEntry: transaction.journalEntry ? {
        ...transaction.journalEntry,
        tags: transaction.journalEntry.tags.map(tagRelation => ({
          id: tagRelation.tag.id,
          name: tagRelation.tag.name
        }))
      } : null
    };
    
    // Cache the result
    singleTransactionCache.set(cacheKey, {
      data: formattedTransaction,
      timestamp: Date.now()
    });
    
    // Limit cache size by removing oldest entries if needed
    if (singleTransactionCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(singleTransactionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove the oldest 10% of entries
      const entriesToRemove = Math.ceil(MAX_CACHE_SIZE * 0.1);
      for (let i = 0; i < entriesToRemove; i++) {
        if (entries[i]) singleTransactionCache.delete(entries[i][0]);
      }
    }
    
    console.log(`[Transaction API] Fetch completed for ID ${id} in ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transaction', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a transaction
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { ticker, type, quantity, price, transactionDate, fee, taxRate, notes, stockAccountId } = body;

    // Check if transaction exists and belongs to the current user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      select: { 
        id: true, 
        stockAccountId: true,
        type: true,
        ticker: true,
        quantity: true,
        price: true,
        transactionDate: true
      } // Get current values for comparison and PurchaseLot sync
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    // Validate ticker/account changes for BUY transactions
    const isTickerChanged = ticker?.toUpperCase() !== existingTransaction.ticker;
    const isAccountChanged = stockAccountId && stockAccountId !== existingTransaction.stockAccountId;
    
    if ((isTickerChanged || isAccountChanged) && existingTransaction.type === 'BUY') {
      return NextResponse.json(
        { message: 'Không thể thay đổi mã cổ phiếu hoặc tài khoản của giao dịch mua. Vui lòng xóa và tạo lại.' },
        { status: 400 }
      );
    }

    // If stockAccountId is being updated, verify the new stock account belongs to the user
    if (stockAccountId && stockAccountId !== existingTransaction.stockAccountId) {
      const stockAccount = await prisma.stockAccount.findFirst({
        where: {
          id: stockAccountId,
          userId: session.user.id
        }
      });

      if (!stockAccount) {
        return NextResponse.json(
          { message: 'Invalid stock account or account does not belong to user' },
          { status: 400 }
        );
      }
    }

    // Calculate P/L for SELL transactions using the correct stock account
    let calculatedPl = null;
    if (type === 'SELL') {
      const accountToUse = stockAccountId || existingTransaction.stockAccountId;
      calculatedPl = await calculateProfitLoss(
        session.user.id,
        accountToUse,
        ticker,
        quantity,
        price,
        fee || 0,
        taxRate || 0
      );
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ticker: ticker?.toUpperCase(),
        type,
        quantity,
        price,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        fee,
        taxRate,
        calculatedPl: type === 'SELL' ? calculatedPl : null,
        notes,
        stockAccountId: stockAccountId || undefined, // Only update if provided
      }
    });

    // THÊM: Đồng bộ PurchaseLot cho giao dịch BUY
    if (type === 'BUY' || existingTransaction.type === 'BUY') {
      try {
        // Tìm PurchaseLot tương ứng
        const matchingLot = await findMatchingPurchaseLot(
          session.user.id,
          existingTransaction.stockAccountId,
          existingTransaction.ticker, // Dùng ticker cũ để tìm
          existingTransaction.transactionDate,
          existingTransaction.quantity // Dùng quantity cũ để match
        );
        
        if (matchingLot) {
          const updateResult = await updatePurchaseLotForEditedBuy(
            matchingLot.id,
            matchingLot,
            {
              quantity,
              price,
              fee: fee || 0,
              transactionDate
            }
          );
          
          if (!updateResult.success) {
            // Rollback transaction update
            await prisma.transaction.update({
              where: { id },
              data: {
                ticker: existingTransaction.ticker,
                type: existingTransaction.type,
                quantity: existingTransaction.quantity,
                price: existingTransaction.price,
                transactionDate: existingTransaction.transactionDate,
                fee: existingTransaction.fee,
                taxRate: existingTransaction.taxRate,
                notes: existingTransaction.notes,
              }
            });
            
            return NextResponse.json(
              { message: updateResult.message },
              { status: 400 }
            );
          }
          
          console.log(`[Transaction API] PurchaseLot ${matchingLot.id} synced with Transaction ${id}`);
        } else {
          console.warn(`[Transaction API] No matching PurchaseLot found for BUY transaction ${id}`);
          // Continue anyway - old transactions may not have corresponding lots
        }
      } catch (lotError) {
        console.error(`[Transaction API] Error syncing PurchaseLot:`, lotError);
        // Don't fail the transaction update, just log the error
      }
    }

    // Clear cache entries for this transaction
    const cacheKey = `${session.user.id}-${id}`;
    singleTransactionCache.delete(cacheKey);
    
    // Clear list cache entries for this user
    for (const [key, _] of singleTransactionCache.entries()) {
      if (key.startsWith(`recent-${session.user.id}`) || key.includes(`"userId":"${session.user.id}"`)) {
        singleTransactionCache.delete(key);
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to update transaction', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a transaction
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Get full transaction info before deleting (need for FIFO restoration)
    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      }
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Handle purchase lots based on transaction type
    if (transaction.type === 'SELL') {
      // For SELL transactions, restore the PurchaseLots
      await restorePurchaseLotsForDeletedSell(
        transaction.userId,
        transaction.stockAccountId,
        transaction.ticker,
        transaction.quantity,
        transaction.transactionDate
      );
    } else if (transaction.type === 'BUY') {
      // For BUY transactions, delete the corresponding PurchaseLot
      await deletePurchaseLotsForDeletedBuy(
        transaction.userId,
        transaction.stockAccountId,
        transaction.ticker,
        transaction.quantity,
        transaction.price,
        transaction.transactionDate
      );
    }

    // Delete the transaction (cascade should handle journal entry deletion)
    await prisma.transaction.delete({
      where: { id },
    });

    // Clear related cache entries
    const cacheKey = `${session.user.id}-${id}`;
    singleTransactionCache.delete(cacheKey);
    
    // Clear list cache entries for this user
    for (const [key, _] of singleTransactionCache.entries()) {
      if (key.startsWith(`recent-${session.user.id}`) || key.includes(`"userId":"${session.user.id}"`)) {
        singleTransactionCache.delete(key);
      }
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'Failed to delete transaction', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Restore PurchaseLots when a SELL transaction is deleted
 * This reverses the FIFO deduction that was applied when the SELL was created
 */
async function restorePurchaseLotsForDeletedSell(userId, stockAccountId, ticker, sellQuantity, sellDate) {
  // Get all purchase lots for this ticker in the same account, ordered by purchase date (FIFO)
  const purchaseLots = await prisma.purchaseLot.findMany({
    where: {
      userId,
      stockAccountId,
      ticker,
      purchaseDate: {
        lte: sellDate // Only lots purchased before or on the sell date
      }
    },
    orderBy: {
      purchaseDate: 'asc' // FIFO order
    }
  });

  // Apply FIFO logic in reverse to restore quantities
  let quantityToRestore = sellQuantity;

  for (const lot of purchaseLots) {
    if (quantityToRestore <= 0) break;

    // Calculate how much this lot was used in the original sell
    const usedQuantity = lot.quantity - lot.remainingQuantity;
    if (usedQuantity <= 0) continue; // This lot wasn't used

    // Restore quantity (but not more than what was originally sold from this lot)
    const restoreAmount = Math.min(quantityToRestore, usedQuantity);
    
    await prisma.purchaseLot.update({
      where: { id: lot.id },
      data: {
        remainingQuantity: lot.remainingQuantity + restoreAmount
      }
    });

    quantityToRestore -= restoreAmount;
  }

  // If we couldn't restore all quantity, it means there was an inconsistency
  // Log this for debugging but don't fail the delete operation
  if (quantityToRestore > 0) {
    console.warn(`Could not restore all quantity for deleted SELL. Remaining: ${quantityToRestore}, Ticker: ${ticker}`);
  }
}

// Function to delete purchase lots when a BUY transaction is deleted
async function deletePurchaseLotsForDeletedBuy(userId, stockAccountId, ticker, quantity, price, transactionDate) {
  console.log(`Deleting purchase lots for deleted BUY transaction: ${ticker}, quantity: ${quantity}, price: ${price}`);
  
  try {
    // Find purchase lots that match the deleted BUY transaction
    // We need to be precise to avoid deleting wrong lots
    const matchingLots = await prisma.purchaseLot.findMany({
      where: {
        userId,
        stockAccountId,
        ticker,
        quantity,
        pricePerShare: price,
        purchaseDate: {
          // Allow some tolerance for date matching (within 1 day due to timezone)
          gte: new Date(new Date(transactionDate).getTime() - 24 * 60 * 60 * 1000),
          lte: new Date(new Date(transactionDate).getTime() + 24 * 60 * 60 * 1000)
        }
      },
      orderBy: {
        createdAt: 'desc' // Get the most recently created lot first
      }
    });

    if (matchingLots.length === 0) {
      console.warn(`No matching purchase lots found for deleted BUY transaction: ${ticker}, quantity: ${quantity}, price: ${price}`);
      return;
    }

    // If multiple lots match, we need to be careful
    // Ideally there should be only one, but let's handle edge cases
    if (matchingLots.length > 1) {
      console.warn(`Multiple matching purchase lots found for deleted BUY transaction. Will delete the most recent one.`);
    }

    // Delete the most recent matching lot (first in our ordered result)
    const lotToDelete = matchingLots[0];
    
    // Check if this lot has been partially sold (remaining quantity < original quantity)
    if (lotToDelete.remainingQuantity < lotToDelete.quantity) {
      console.error(`Cannot delete purchase lot ${lotToDelete.id} - it has been partially sold (remaining: ${lotToDelete.remainingQuantity}, original: ${lotToDelete.quantity})`);
      throw new Error(`Cannot delete BUY transaction - the purchase lot has been partially sold. Please undo the SELL transactions first.`);
    }

    // Delete the purchase lot
    await prisma.purchaseLot.delete({
      where: { id: lotToDelete.id }
    });

    console.log(`Successfully deleted purchase lot ${lotToDelete.id} for deleted BUY transaction`);

  } catch (error) {
    console.error(`Error deleting purchase lots for deleted BUY transaction:`, error);
    throw error;
  }
} 