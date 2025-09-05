import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import db from '../../lib/database.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stockAccountId = searchParams.get('stockAccountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause for filtering
    const whereClause = {
      userId: session.user.id,
      ...(stockAccountId && { stockAccountId }),
      ...(dateFrom && dateTo && {
        transactionDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      })
    };

    // Get all SELL transactions
    const sellTransactions = await db.transaction.findMany({
      where: {
        ...whereClause,
        type: 'SELL',
        calculatedPl: { not: null }
      },
      select: {
        id: true,
        ticker: true,
        calculatedPl: true,
        transactionDate: true,
        quantity: true,
        price: true,
        fee: true,
        taxRate: true
      },
      orderBy: { transactionDate: 'desc' }
    });

    // Get dividend adjustments in the same period
    const dividendAdjustments = await db.costBasisAdjustment.findMany({
      where: {
        userId: session.user.id,
        adjustmentType: 'CASH_DIVIDEND',
        isActive: true,
        ...(stockAccountId && { stockAccountId }),
        ...(dateFrom && dateTo && {
          eventDate: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo)
          }
        })
      },
      select: {
        ticker: true,
        dividendPerShare: true,
        taxRate: true,
        eventDate: true,
        description: true
      }
    });

    // Get dividend taxes
    const dividendTaxes = await db.accountFee.findMany({
      where: {
        userId: session.user.id,
        feeType: 'DIVIDEND_TAX',
        isActive: true,
        ...(stockAccountId && { stockAccountId }),
        ...(dateFrom && dateTo && {
          feeDate: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo)
          }
        })
      },
      select: {
        amount: true,
        description: true,
        feeDate: true
      }
    });

    // Calculate basic profit stats
    const totalPLFromSales = sellTransactions.reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
    const profitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) > 0).length;
    const unprofitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) < 0).length;
    const totalTransactions = sellTransactions.length;

    // Calculate dividend-related amounts
    const totalDividendTax = dividendTaxes.reduce((sum, fee) => sum + fee.amount, 0);
    
    // Estimate net dividend received (this is approximate since we don't have exact quantities)
    const estimatedNetDividend = dividendAdjustments.reduce((sum, adj) => {
      // This is an approximation - in real implementation, you'd need to track exact quantities
      const estimatedQuantity = 1000; // Default estimate
      const grossDividend = adj.dividendPerShare * estimatedQuantity;
      const tax = grossDividend * adj.taxRate;
      return sum + (grossDividend - tax);
    }, 0);

    // Enhanced statistics
    const successRate = totalTransactions > 0 ? (profitableTransactions / totalTransactions) * 100 : 0;
    const averageProfit = totalTransactions > 0 ? totalPLFromSales / totalTransactions : 0;
    
    const totalProfit = sellTransactions
      .filter(tx => (tx.calculatedPl || 0) > 0)
      .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
    
    const totalLoss = sellTransactions
      .filter(tx => (tx.calculatedPl || 0) < 0)
      .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);

    // Breakdown by ticker
    const tickerBreakdown = {};
    sellTransactions.forEach(tx => {
      if (!tickerBreakdown[tx.ticker]) {
        tickerBreakdown[tx.ticker] = {
          ticker: tx.ticker,
          totalPL: 0,
          transactionCount: 0,
          profitableCount: 0,
          unprofitableCount: 0
        };
      }
      
      tickerBreakdown[tx.ticker].totalPL += tx.calculatedPl || 0;
      tickerBreakdown[tx.ticker].transactionCount += 1;
      
      if ((tx.calculatedPl || 0) > 0) {
        tickerBreakdown[tx.ticker].profitableCount += 1;
      } else if ((tx.calculatedPl || 0) < 0) {
        tickerBreakdown[tx.ticker].unprofitableCount += 1;
      }
    });

    const responseData = {
      basicStats: {
        totalPLFromSales,
        profitableTransactions,
        unprofitableTransactions,
        totalTransactions,
        successRate: Math.round(successRate * 100) / 100,
        averageProfit: Math.round(averageProfit),
        totalProfit,
        totalLoss
      },
      dividendStats: {
        totalDividendTax,
        estimatedNetDividend,
        dividendEventsCount: dividendAdjustments.length,
        dividendEvents: dividendAdjustments
      },
      enhancedStats: {
        // ĐÚNG: Không cộng thêm cổ tức vì đã được tính vào cost basis adjustment
        adjustedTotalPL: totalPLFromSales - totalDividendTax,
        netDividendImpact: -totalDividendTax, // Chỉ có impact của thuế
        note: "calculatedPl đã bao gồm điều chỉnh cổ tức, chỉ cần trừ thuế"
      },
      tickerBreakdown: Object.values(tickerBreakdown).sort((a, b) => b.totalPL - a.totalPL),
      recentTransactions: sellTransactions.slice(0, 10) // Last 10 transactions
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Enhanced Profit Stats API Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}