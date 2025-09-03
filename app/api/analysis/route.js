import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import db from '../../lib/database.js';

const prisma = db;

export async function GET(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') || 'all';

    // Create date filters based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { transactionDate: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { transactionDate: { gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { transactionDate: { gte: yearAgo } };
    }

    // Process the request based on the analysis type
    switch (type) {
      case 'summary':
        return await getSummaryData(session.user.id, dateFilter);
      case 'performance':
        return await getPerformanceData(session.user.id, dateFilter, period);
      case 'ticker-breakdown':
        return await getTickerBreakdown(session.user.id, dateFilter);
      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getSummaryData(userId, dateFilter) {
  // Get all trades for the user with date filter
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    select: {
      price: true,
      quantity: true,
      type: true,
      fee: true,
      calculatedPl: true,
      transactionDate: true,
      ticker: true,
      stockAccountId: true,
    },
  });

  // Get account fees for the same period to match Transactions page calculation
  let accountFeesTotal = 0;
  try {
    const accountFeesFilter = {
      userId,
      isActive: true,
      ...dateFilter
    };
    
    const accountFeesResult = await prisma.accountFee.aggregate({
      where: accountFeesFilter,
      _sum: {
        amount: true
      }
    });
    
    accountFeesTotal = accountFeesResult._sum.amount || 0;
  } catch (error) {
    console.error('Error fetching account fees:', error);
    accountFeesTotal = 0;
  }

  // Calculate summary statistics to match Transactions page logic
  let grossProfitLoss = 0; // Sum of calculatedPl from SELL transactions
  let investedAmount = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalBuys = 0;
  let totalSells = 0;
  let totalReturned = 0;
  
  trades.forEach(trade => {
    const tradeValue = trade.price * trade.quantity;
    
    // Count all trades and include fees in calculations
    if (trade.type === 'BUY') {
      totalBuys++;
      // For BUY: add fees to invested amount (total cost including fees)
      investedAmount += tradeValue + (trade.fee || 0);
    } else if (trade.type === 'SELL') {
      totalSells++;
      // For SELL: subtract fees from returned amount (net proceeds after fees)
      totalReturned += tradeValue - (trade.fee || 0);
      
      // For P&L calculation, only count SELL transactions like Transactions page
      if (trade.calculatedPl !== null) {
        const pnl = trade.calculatedPl;
        grossProfitLoss += pnl;
        
        if (pnl > 0) {
          winCount++;
        } else if (pnl < 0) {
          lossCount++;
        }
      }
    }
  });
  
  // Calculate net P&L same as Transactions page: gross P&L minus account fees
  const totalProfitLoss = grossProfitLoss - accountFeesTotal;
  
  const totalTrades = winCount + lossCount;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const roi = investedAmount > 0 ? (totalProfitLoss / investedAmount) * 100 : 0;
  
  return NextResponse.json({
    totalProfitLoss: Math.round(totalProfitLoss), // Net P&L (same as Transactions page)
    grossProfitLoss: Math.round(grossProfitLoss), // Gross P&L before account fees
    accountFeesTotal: Math.round(accountFeesTotal), // Account fees
    roi,
    winRate,
    totalTrades,
    totalBuys,
    totalSells,
    totalInvested: investedAmount,
    totalReturned,
    profitableTrades: winCount,
    unprofitableTrades: lossCount
  });
}

async function getPerformanceData(userId, dateFilter, period) {
  // Determine grouping format based on period
  let groupFormat;
  let limit;
  
  if (period === 'week') {
    groupFormat = 'yyyy-MM-dd'; // Daily
    limit = 7;
  } else if (period === 'month') {
    groupFormat = 'yyyy-MM-dd'; // Daily
    limit = 30;
  } else if (period === 'year') {
    groupFormat = 'yyyy-MM'; // Monthly
    limit = 12;
  } else {
    groupFormat = 'yyyy-MM'; // Monthly
    limit = 24; // Last 24 months for "all time"
  }
  
  // Get all closed trades within the period
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      calculatedPl: { not: null },
      ...dateFilter,
    },
    orderBy: {
      transactionDate: 'asc',
    },
    select: {
      transactionDate: true,
      price: true,
      quantity: true,
      type: true,
      fee: true,
      calculatedPl: true,
      ticker: true,
    },
  });
  
  // Group trades by period
  const performanceByPeriod = {};
  let cumulativePnL = 0;
  
  trades.forEach(trade => {
    // Format date according to period grouping
    const date = new Date(trade.transactionDate);
    let periodKey;
    
    if (groupFormat === 'yyyy-MM-dd') {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!performanceByPeriod[periodKey]) {
      performanceByPeriod[periodKey] = {
        pnl: 0,
        trades: 0,
      };
    }
    
    // Use the calculated P&L from the transaction
    const pnl = trade.calculatedPl;
      
    performanceByPeriod[periodKey].pnl += pnl;
    performanceByPeriod[periodKey].trades += 1;
  });
  
  // Convert to array for charting
  const performance = Object.entries(performanceByPeriod).map(([date, data]) => {
    cumulativePnL += data.pnl;
    return {
      date,
      value: cumulativePnL, // Dashboard expects 'value' field
      pnl: data.pnl,
      cumulativePnL,
      trades: data.trades,
    };
  });
  
  // Limit to recent periods
  const limitedPerformance = performance.slice(-limit);
  
  return NextResponse.json({ performance: limitedPerformance });
}

async function getTickerBreakdown(userId, dateFilter) {
  // Get all closed trades grouped by ticker
  const tickerBreakdown = await prisma.transaction.groupBy({
    by: ['ticker'],
    where: {
      userId,
      calculatedPl: { not: null },
      ...dateFilter,
    },
    _count: {
      _all: true,
    },
  });
  
  // Get P&L data for each ticker
  const tickers = tickerBreakdown.map(item => item.ticker);
  const tickerData = [];
  
  for (const ticker of tickers) {
    const trades = await prisma.transaction.findMany({
      where: {
        userId,
        ticker,
        ...dateFilter,
      },
      select: {
        calculatedPl: true,
        price: true,
        quantity: true,
        type: true,
        fee: true,
      },
    });
    
    let pnl = 0;
    let winCount = 0;
    let tradeCount = 0;
    let totalInvested = 0;
    
    trades.forEach(trade => {
      const tradeValue = trade.price * trade.quantity;
      
      // Calculate total invested for this ticker (include fees for BUY transactions)
      if (trade.type === 'BUY') {
        totalInvested += tradeValue + (trade.fee || 0);
      }
      
      // Only count P&L for completed trades (calculatedPl already includes fees)
      if (trade.calculatedPl !== null) {
        const tradePnL = trade.calculatedPl;
        pnl += tradePnL;
        if (tradePnL > 0) winCount++;
        tradeCount++;
      }
    });
    
    tickerData.push({
      ticker,
      profitLoss: pnl, // Dashboard expects 'profitLoss'
      pnl,
      tradeCount,
      totalInvested,
      winRate: tradeCount > 0 ? (winCount / tradeCount) * 100 : 0,
    });
  }
  
  // Sort by P&L (highest to lowest)
  tickerData.sort((a, b) => b.pnl - a.pnl);
  
  return NextResponse.json({ breakdown: tickerData });
} 