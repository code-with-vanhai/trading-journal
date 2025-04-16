import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      dateFilter = { date: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { date: { gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { date: { gte: yearAgo } };
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
  const trades = await prisma.trade.findMany({
    where: {
      userId,
      ...dateFilter,
    },
    select: {
      entryPrice: true,
      exitPrice: true,
      quantity: true,
      type: true,
      status: true,
    },
  });

  // Calculate summary statistics
  let totalPnL = 0;
  let investedAmount = 0;
  let winCount = 0;
  let lossCount = 0;
  
  trades.forEach(trade => {
    if (trade.status === 'CLOSED') {
      const tradeValue = trade.entryPrice * trade.quantity;
      investedAmount += tradeValue;
      
      const pnl = trade.type === 'BUY' 
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - trade.exitPrice) * trade.quantity;
        
      totalPnL += pnl;
      
      if (pnl > 0) {
        winCount++;
      } else if (pnl < 0) {
        lossCount++;
      }
    }
  });
  
  const totalTrades = winCount + lossCount;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const roi = investedAmount > 0 ? (totalPnL / investedAmount) * 100 : 0;
  
  return NextResponse.json({
    totalPnL,
    roi,
    winRate,
    totalTrades,
    winCount,
    lossCount
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
  const trades = await prisma.trade.findMany({
    where: {
      userId,
      status: 'CLOSED',
      ...dateFilter,
    },
    orderBy: {
      date: 'asc',
    },
    select: {
      date: true,
      entryPrice: true,
      exitPrice: true,
      quantity: true,
      type: true,
    },
  });
  
  // Group trades by period
  const performanceByPeriod = {};
  let cumulativePnL = 0;
  
  trades.forEach(trade => {
    // Format date according to period grouping
    const date = new Date(trade.date);
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
    
    // Calculate P&L for this trade
    const pnl = trade.type === 'BUY' 
      ? (trade.exitPrice - trade.entryPrice) * trade.quantity
      : (trade.entryPrice - trade.exitPrice) * trade.quantity;
      
    performanceByPeriod[periodKey].pnl += pnl;
    performanceByPeriod[periodKey].trades += 1;
  });
  
  // Convert to array for charting
  const performance = Object.entries(performanceByPeriod).map(([date, data]) => {
    cumulativePnL += data.pnl;
    return {
      date,
      pnl: data.pnl,
      cumulativePnL,
      trades: data.trades,
    };
  });
  
  // Limit to recent periods
  const limitedPerformance = performance.slice(-limit);
  
  return NextResponse.json(limitedPerformance);
}

async function getTickerBreakdown(userId, dateFilter) {
  // Get all closed trades grouped by ticker
  const tickerBreakdown = await prisma.trade.groupBy({
    by: ['ticker'],
    where: {
      userId,
      status: 'CLOSED',
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
    const trades = await prisma.trade.findMany({
      where: {
        userId,
        ticker,
        status: 'CLOSED',
        ...dateFilter,
      },
      select: {
        entryPrice: true,
        exitPrice: true,
        quantity: true,
        type: true,
      },
    });
    
    let pnl = 0;
    let winCount = 0;
    let tradeCount = 0;
    
    trades.forEach(trade => {
      const tradePnL = trade.type === 'BUY' 
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - trade.exitPrice) * trade.quantity;
        
      pnl += tradePnL;
      if (tradePnL > 0) winCount++;
      tradeCount++;
    });
    
    tickerData.push({
      ticker,
      pnl,
      tradeCount,
      winRate: tradeCount > 0 ? (winCount / tradeCount) * 100 : 0,
    });
  }
  
  // Sort by P&L (highest to lowest)
  tickerData.sort((a, b) => b.pnl - a.pnl);
  
  return NextResponse.json(tickerData);
} 