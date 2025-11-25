import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import db from '../../lib/database.js';

const prisma = db;

/**
 * Consolidated Dashboard API
 * Combines multiple analysis endpoints into a single request
 * Reduces network round trips and improves performance
 * 
 * GET /api/dashboard?period=1M|3M|6M|1Y|all
 */
export async function GET(request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get the query parameters
    const { searchParams } = new URL(request.url);
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

    // Fetch all data in parallel using Promise.all
    const [
      summary,
      performance,
      riskMetrics,
      sectorAnalysis,
      benchmark,
      tickerBreakdown,
      recentTransactions
    ] = await Promise.all([
      getSummaryData(session.user.id, dateFilter),
      getPerformanceData(session.user.id, dateFilter, period),
      getRiskMetrics(session.user.id, dateFilter),
      getSectorAnalysis(session.user.id, dateFilter),
      getBenchmarkComparison(session.user.id, dateFilter),
      getTickerBreakdown(session.user.id, dateFilter),
      getRecentTransactions(session.user.id, 5)
    ]);

    // Combine all data into a single response
    const response = {
      summary,
      performance: performance.performance || [],
      riskMetrics,
      sectorAnalysis,
      benchmark,
      tickerBreakdown: tickerBreakdown.breakdown || [],
      recentTransactions,
      metadata: {
        generatedAt: new Date().toISOString(),
        period,
        cacheHit: false // Could implement caching later
      }
    };

    // Set cache headers for browser caching
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
    };

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Helper functions (reused from analysis route)
async function getSummaryData(userId, dateFilter) {
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
    },
  });

  // Get account fees
  let accountFeesTotal = 0;
  try {
    const accountFeesResult = await prisma.accountFee.aggregate({
      where: {
        userId,
        isActive: true,
        ...dateFilter
      },
      _sum: {
        amount: true
      }
    });
    accountFeesTotal = accountFeesResult._sum.amount || 0;
  } catch (error) {
    console.error('Error fetching account fees:', error);
  }

  let grossProfitLoss = 0;
  let investedAmount = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalBuys = 0;
  let totalSells = 0;
  let totalReturned = 0;
  
  trades.forEach(trade => {
    const tradeValue = trade.price * trade.quantity;
    
    if (trade.type === 'BUY') {
      totalBuys++;
      investedAmount += tradeValue + (trade.fee || 0);
    } else if (trade.type === 'SELL') {
      totalSells++;
      totalReturned += tradeValue - (trade.fee || 0);
      
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
  
  const netProfitLoss = grossProfitLoss - accountFeesTotal;
  const totalTrades = totalBuys + totalSells;
  const winRate = totalTrades > 0 ? (winCount / (winCount + lossCount)) * 100 : 0;
  const roi = investedAmount > 0 ? ((netProfitLoss / investedAmount) * 100) : 0;

  return {
    totalProfitLoss: netProfitLoss,
    roi,
    winRate,
    totalTrades,
    totalInvested: investedAmount,
    totalReturned,
    totalBuys,
    totalSells,
    profitableTrades: winCount,
    unprofitableTrades: lossCount,
    accountFeesTotal
  };
}

async function getPerformanceData(userId, dateFilter, period) {
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    select: {
      calculatedPl: true,
      transactionDate: true,
      type: true,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  // Group by date and calculate cumulative P&L
  const dailyData = {};
  trades.forEach(trade => {
    if (trade.type === 'SELL' && trade.calculatedPl !== null) {
      const date = trade.transactionDate.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, pnl: 0, trades: 0 };
      }
      dailyData[date].pnl += trade.calculatedPl;
      dailyData[date].trades += 1;
    }
  });

  // Convert to array and calculate cumulative
  let cumulativePnL = 0;
  const performance = Object.values(dailyData)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(item => {
      cumulativePnL += item.pnl;
      return {
        date: item.date,
        cumulativePnL,
        trades: item.trades
      };
    });

  return { performance };
}

async function getRiskMetrics(userId, dateFilter) {
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      ...dateFilter,
      type: 'SELL',
      calculatedPl: { not: null }
    },
    select: {
      calculatedPl: true,
      transactionDate: true,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  if (trades.length === 0) {
    return {
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      riskScore: 50
    };
  }

  // Calculate daily returns
  const dailyReturns = [];
  const dailyData = {};
  
  trades.forEach(trade => {
    const date = trade.transactionDate.toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = 0;
    }
    dailyData[date] += trade.calculatedPl;
  });

  const sortedDates = Object.keys(dailyData).sort();
  let cumulativeValue = 0;
  const values = [];
  
  sortedDates.forEach(date => {
    cumulativeValue += dailyData[date];
    values.push(cumulativeValue);
  });

  // Calculate volatility (standard deviation of returns)
  if (values.length > 1) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance) / Math.abs(mean || 1) * 100; // Percentage
    
    // Calculate Sharpe Ratio (simplified)
    const avgReturn = mean;
    const riskFreeRate = 0.02; // 2% annual
    const sharpeRatio = volatility > 0 ? (avgReturn - riskFreeRate) / (volatility / 100) : 0;
    
    // Calculate Max Drawdown
    let maxDrawdown = 0;
    let peak = values[0];
    values.forEach(value => {
      if (value > peak) peak = value;
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    // Calculate risk score (0-100)
    const volatilityScore = Math.min(volatility / 40 * 40, 40);
    const sharpeScore = Math.max(0, 30 - (sharpeRatio * 10));
    const drawdownScore = Math.min(maxDrawdown / 30 * 30, 30);
    const riskScore = Math.min(100, volatilityScore + sharpeScore + drawdownScore);
    
    return {
      volatility: Math.max(0, volatility),
      sharpeRatio: Math.max(0, sharpeRatio),
      maxDrawdown: Math.max(0, maxDrawdown),
      riskScore: Math.round(riskScore)
    };
  }

  return {
    volatility: 0,
    sharpeRatio: 0,
    maxDrawdown: 0,
    riskScore: 50
  };
}

async function getSectorAnalysis(userId, dateFilter) {
  // Simplified sector analysis - would need sector data in real implementation
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    select: {
      ticker: true,
      calculatedPl: true,
      price: true,
      quantity: true,
      type: true,
    },
  });

  const tickerData = {};
  trades.forEach(trade => {
    if (!tickerData[trade.ticker]) {
      tickerData[trade.ticker] = {
        ticker: trade.ticker,
        pnl: 0,
        invested: 0,
        count: 0
      };
    }
    
    if (trade.type === 'BUY') {
      tickerData[trade.ticker].invested += trade.price * trade.quantity;
    } else if (trade.type === 'SELL' && trade.calculatedPl !== null) {
      tickerData[trade.ticker].pnl += trade.calculatedPl;
    }
    tickerData[trade.ticker].count += 1;
  });

  // Group by sector (simplified - using "Other" for all)
  const sectorPerformance = Object.values(tickerData).map(item => ({
    sector: 'Other', // Would need sector mapping in real implementation
    ticker: item.ticker,
    pnl: item.pnl,
    invested: item.invested,
    roi: item.invested > 0 ? (item.pnl / item.invested) * 100 : 0,
    tickerCount: 1
  }));

  return {
    sectorPerformance
  };
}

async function getBenchmarkComparison(userId, dateFilter) {
  // Simplified benchmark comparison
  // In real implementation, would compare against VN-Index
  return {
    beta: 1.0,
    alpha: 0,
    correlation: 0.5
  };
}

async function getTickerBreakdown(userId, dateFilter) {
  const trades = await prisma.transaction.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    select: {
      ticker: true,
      calculatedPl: true,
      price: true,
      quantity: true,
      type: true,
    },
  });

  const tickerData = {};
  trades.forEach(trade => {
    if (!tickerData[trade.ticker]) {
      tickerData[trade.ticker] = {
        ticker: trade.ticker,
        profitLoss: 0,
        totalInvested: 0
      };
    }
    
    if (trade.type === 'BUY') {
      tickerData[trade.ticker].totalInvested += trade.price * trade.quantity;
    } else if (trade.type === 'SELL' && trade.calculatedPl !== null) {
      tickerData[trade.ticker].profitLoss += trade.calculatedPl;
    }
  });

  return {
    breakdown: Object.values(tickerData)
      .sort((a, b) => b.profitLoss - a.profitLoss)
  };
}

async function getRecentTransactions(userId, limit = 5) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      ticker: true,
      type: true,
      quantity: true,
      price: true,
      transactionDate: true,
      calculatedPl: true,
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: limit,
  });

  return transactions;
}


