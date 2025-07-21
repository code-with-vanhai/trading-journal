import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

// Create a single Prisma instance with query logging in development
const globalForPrisma = global;

// Enable query logging in development to help debug slow queries
const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  return prisma;
};

globalForPrisma.prisma = globalForPrisma.prisma || prismaClientSingleton();
const prisma = globalForPrisma.prisma;

// Improved caching with longer TTL for single transaction fetches
const singleTransactionCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL for individual transactions
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

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
        type: true 
      } // Get current values for comparison
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
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

    // If it's a SELL transaction, we need to restore the PurchaseLots
    if (transaction.type === 'SELL') {
      await restorePurchaseLotsForDeletedSell(
        transaction.userId,
        transaction.stockAccountId,
        transaction.ticker,
        transaction.quantity,
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