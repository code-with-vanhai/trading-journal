import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Function to get account fees total based on filters
async function getAccountFeesTotal(userId, filters) {
  const whereClause = {
    userId,
    isActive: true
  };

  // Apply filters similar to transactions
  if (filters.stockAccountId) {
    whereClause.stockAccountId = filters.stockAccountId;
  }

  if (filters.dateFrom || filters.dateTo) {
    whereClause.feeDate = {};
    if (filters.dateFrom) {
      whereClause.feeDate.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      whereClause.feeDate.lte = endDate;
    }
  }

  try {
    const result = await prisma.accountFee.aggregate({
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalAmount: result._sum.amount || 0,
      totalCount: result._count.id || 0
    };
  } catch (error) {
    console.error('Error calculating account fees total:', error);
    return {
      totalAmount: 0,
      totalCount: 0
    };
  }
}

// Function to calculate profit/loss statistics including account fees
function calculateProfitStats(transactions, accountFeesTotal = 0) {
  const sellTransactions = transactions.filter(tx => tx.type === 'SELL');
  
  if (sellTransactions.length === 0) {
    return {
      totalProfitLoss: -accountFeesTotal,
      profitableTransactions: 0,
      unprofitableTransactions: 0,
      totalTransactions: 0,
      successRate: 0,
      averageProfit: 0,
      totalProfit: 0,
      totalLoss: 0,
      accountFeesTotal: accountFeesTotal,
      grossProfitLoss: 0
    };
  }

  const profitLosses = sellTransactions.map(tx => tx.calculatedPl || 0);
  const grossProfitLoss = profitLosses.reduce((sum, pl) => sum + pl, 0);
  const totalProfitLoss = grossProfitLoss - accountFeesTotal;
  
  const profitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) > 0).length;
  const unprofitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) < 0).length;
  const breakEvenTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) === 0).length;
  
  const totalProfit = sellTransactions
    .filter(tx => (tx.calculatedPl || 0) > 0)
    .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
    
  const totalLoss = sellTransactions
    .filter(tx => (tx.calculatedPl || 0) < 0)
    .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);

  const successRate = sellTransactions.length > 0 ? (profitableTransactions / sellTransactions.length) * 100 : 0;
  const averageProfit = sellTransactions.length > 0 ? totalProfitLoss / sellTransactions.length : 0;

  return {
    totalProfitLoss: Math.round(totalProfitLoss),
    profitableTransactions,
    unprofitableTransactions,
    breakEvenTransactions,
    totalTransactions: sellTransactions.length,
    successRate: Math.round(successRate * 100) / 100,
    averageProfit: Math.round(averageProfit),
    totalProfit: Math.round(totalProfit),
    totalLoss: Math.round(totalLoss),
    accountFeesTotal: Math.round(accountFeesTotal),
    grossProfitLoss: Math.round(grossProfitLoss)
  };
}

// GET - Fetch profit statistics for ALL transactions matching filters (no pagination)
export async function GET(request) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters (same as transactions API but NO pagination)
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');
    const stockAccountId = searchParams.get('stockAccountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    
    // Build where clause for ALL transactions (no pagination)
    let whereClause = {
      userId: session.user.id,
    };

    if (type) {
      whereClause.type = type;
    }
    
    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }
    
    if (ticker) {
      whereClause.ticker = {
        contains: ticker.toUpperCase()
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.transactionDate = {};
      if (dateFrom) {
        whereClause.transactionDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.transactionDate.lte = endDate;
      }
    }

    // Amount filters
    if (minAmount || maxAmount) {
      const amountConditions = [];
      
      if (minAmount) {
        amountConditions.push({
          OR: [
            { price: { gte: parseFloat(minAmount) } },
            { 
              AND: [
                { price: { gte: 0 } },
                { quantity: { gte: 0 } },
              ]
            }
          ]
        });
      }
      
      if (maxAmount) {
        amountConditions.push({
          OR: [
            { price: { lte: parseFloat(maxAmount) } },
            { 
              AND: [
                { price: { lte: parseFloat(maxAmount) } },
                { quantity: { gte: 0 } },
              ]
            }
          ]
        });
      }
      
      if (amountConditions.length > 0) {
        whereClause.AND = amountConditions;
      }
    }
    
    console.log(`[Profit Stats API] Fetching ALL transactions for stats calculation...`);
    
    // Fetch ALL transactions matching filters (no pagination limit)
    const allTransactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        calculatedPl: true,
        transactionDate: true,
        ticker: true
      }
    });

    console.log(`[Profit Stats API] Found ${allTransactions.length} total transactions`);

    // Get account fees with same filters
    const accountFeesData = await getAccountFeesTotal(session.user.id, {
      stockAccountId,
      dateFrom,
      dateTo
    });

    // Calculate profit statistics for ALL transactions
    const profitStats = calculateProfitStats(allTransactions, accountFeesData.totalAmount);

    const responseData = {
      profitStats,
      totalTransactionsCount: allTransactions.length,
      accountFeesTotal: accountFeesData.totalAmount,
      calculationTime: Date.now() - startTime
    };

    console.log(`[Profit Stats API] Completed in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Profit Stats API Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        profitStats: {
          totalProfitLoss: 0,
          profitableTransactions: 0,
          unprofitableTransactions: 0,
          totalTransactions: 0,
          successRate: 0,
          averageProfit: 0,
          totalProfit: 0,
          totalLoss: 0
        }
      },
      { status: 500 }
    );
  }
} 