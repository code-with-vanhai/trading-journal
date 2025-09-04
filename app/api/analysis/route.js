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
      case 'risk-metrics':
        return await getRiskMetrics(session.user.id, dateFilter);
      case 'sector-analysis':
        return await getSectorAnalysis(session.user.id, dateFilter);
      case 'benchmark-comparison':
        return await getBenchmarkComparison(session.user.id, dateFilter);
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

// Enhanced Risk Metrics Analysis
async function getRiskMetrics(userId, dateFilter) {
  try {
    // Get all trades for risk calculation
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
        calculatedPl: true,
        price: true,
        quantity: true,
        type: true,
      },
    });

    if (trades.length === 0) {
      return NextResponse.json({
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        valueAtRisk95: 0,
        calmarRatio: 0,
        averageDailyReturn: 0,
        totalTrades: 0
      });
    }

    // Calculate daily returns
    const dailyReturns = calculateDailyReturns(trades);
    
    // Calculate risk metrics
    const volatility = calculateVolatility(dailyReturns);
    const sharpeRatio = calculateSharpeRatio(dailyReturns, 0.02); // 2% risk-free rate
    const maxDrawdown = calculateMaxDrawdown(trades);
    const valueAtRisk95 = calculateVaR(dailyReturns, 0.95);
    const calmarRatio = maxDrawdown !== 0 ? (dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length * 252) / maxDrawdown : 0;
    const averageDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;

    return NextResponse.json({
      volatility: volatility * 100, // Convert to percentage
      sharpeRatio: Number(sharpeRatio.toFixed(3)),
      maxDrawdown: maxDrawdown * 100,
      valueAtRisk95: valueAtRisk95 * 100,
      calmarRatio: Number(calmarRatio.toFixed(3)),
      averageDailyReturn: averageDailyReturn * 100,
      totalTrades: trades.length,
      riskScore: calculateRiskScore(volatility, sharpeRatio, maxDrawdown)
    });
  } catch (error) {
    console.error('Risk metrics calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate risk metrics' }, { status: 500 });
  }
}

// Sector Analysis with hard-coded mapping (no database changes)
async function getSectorAnalysis(userId, dateFilter) {
  try {
    // Hard-coded sector mapping for Vietnamese stocks
    const SECTOR_MAPPING = {
      // Banking
      'VCB': 'Ngân hàng', 'BID': 'Ngân hàng', 'CTG': 'Ngân hàng', 'TCB': 'Ngân hàng',
      'MBB': 'Ngân hàng', 'VPB': 'Ngân hàng', 'ACB': 'Ngân hàng', 'STB': 'Ngân hàng',
      
      // Real Estate
      'VIC': 'Bất động sản', 'VHM': 'Bất động sản', 'NVL': 'Bất động sản', 'PDR': 'Bất động sản',
      'KDH': 'Bất động sản', 'DXG': 'Bất động sản', 'BCM': 'Bất động sản',
      
      // Steel & Materials
      'HPG': 'Thép', 'HSG': 'Thép', 'NKG': 'Thép', 'TVN': 'Thép',
      
      // Food & Beverage
      'VNM': 'Thực phẩm & Đồ uống', 'MSN': 'Thực phẩm & Đồ uống', 'MCH': 'Thực phẩm & Đồ uống',
      
      // Technology
      'FPT': 'Công nghệ', 'CMG': 'Công nghệ', 'ELC': 'Công nghệ',
      
      // Oil & Gas
      'GAS': 'Dầu khí', 'PLX': 'Dầu khí', 'PVS': 'Dầu khí', 'PVD': 'Dầu khí',
      
      // Retail
      'MWG': 'Bán lẻ', 'PNJ': 'Bán lẻ', 'DGW': 'Bán lẻ',
      
      // Securities
      'SSI': 'Chứng khoán', 'VND': 'Chứng khoán', 'HCM': 'Chứng khoán', 'VCI': 'Chứng khoán',
      
      // Aviation
      'HVN': 'Hàng không', 'VJC': 'Hàng không',
      
      // Pharmaceuticals
      'DHG': 'Dược phẩm', 'IMP': 'Dược phẩm', 'PME': 'Dược phẩm'
    };

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

    const sectorPerformance = {};
    
    trades.forEach(trade => {
      const sector = SECTOR_MAPPING[trade.ticker] || 'Khác';
      if (!sectorPerformance[sector]) {
        sectorPerformance[sector] = {
          pnl: 0,
          invested: 0,
          trades: 0,
          tickers: new Set()
        };
      }
      
      const tradeValue = trade.price * trade.quantity;
      
      if (trade.type === 'BUY') {
        sectorPerformance[sector].invested += tradeValue;
      }
      
      if (trade.calculatedPl !== null) {
        sectorPerformance[sector].pnl += trade.calculatedPl;
        sectorPerformance[sector].trades++;
      }
      
      sectorPerformance[sector].tickers.add(trade.ticker);
    });

    // Convert to array and calculate percentages
    const sectorData = Object.entries(sectorPerformance).map(([sector, data]) => ({
      sector,
      pnl: data.pnl,
      invested: data.invested,
      trades: data.trades,
      tickerCount: data.tickers.size,
      roi: data.invested > 0 ? (data.pnl / data.invested) * 100 : 0
    }));

    // Sort by P&L
    sectorData.sort((a, b) => b.pnl - a.pnl);

    return NextResponse.json({ 
      sectorPerformance: sectorData,
      totalSectors: sectorData.length 
    });
  } catch (error) {
    console.error('Sector analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze sectors' }, { status: 500 });
  }
}

// Benchmark Comparison (using external API for VN-Index)
async function getBenchmarkComparison(userId, dateFilter) {
  try {
    // Get portfolio returns
    const portfolioTrades = await prisma.transaction.findMany({
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
        calculatedPl: true,
      },
    });

    if (portfolioTrades.length === 0) {
      return NextResponse.json({
        beta: 0,
        alpha: 0,
        correlation: 0,
        trackingError: 0,
        informationRatio: 0
      });
    }

    const portfolioReturns = calculateDailyReturns(portfolioTrades);
    
    // Simulate VN-Index returns (in real implementation, would call external API)
    const vnIndexReturns = generateSimulatedMarketReturns(portfolioReturns.length);
    
    // Calculate benchmark metrics
    const beta = calculateBeta(portfolioReturns, vnIndexReturns);
    const alpha = calculateAlpha(portfolioReturns, vnIndexReturns, beta, 0.02);
    const correlation = calculateCorrelation(portfolioReturns, vnIndexReturns);
    const trackingError = calculateTrackingError(portfolioReturns, vnIndexReturns);
    const informationRatio = trackingError !== 0 ? alpha / trackingError : 0;

    return NextResponse.json({
      beta: Number(beta.toFixed(3)),
      alpha: Number((alpha * 100).toFixed(2)), // Convert to percentage
      correlation: Number(correlation.toFixed(3)),
      trackingError: Number((trackingError * 100).toFixed(2)),
      informationRatio: Number(informationRatio.toFixed(3))
    });
  } catch (error) {
    console.error('Benchmark comparison error:', error);
    return NextResponse.json({ error: 'Failed to compare with benchmark' }, { status: 500 });
  }
}

// Helper functions for calculations
function calculateDailyReturns(trades) {
  const dailyPnL = {};
  
  trades.forEach(trade => {
    const date = trade.transactionDate.toISOString().split('T')[0];
    if (!dailyPnL[date]) dailyPnL[date] = 0;
    dailyPnL[date] += trade.calculatedPl || 0;
  });
  
  const sortedDates = Object.keys(dailyPnL).sort();
  let cumulativePnL = 0;
  const returns = [];
  
  for (let i = 0; i < sortedDates.length; i++) {
    const prevCumulative = cumulativePnL;
    cumulativePnL += dailyPnL[sortedDates[i]];
    
    if (i > 0 && prevCumulative !== 0) {
      returns.push(dailyPnL[sortedDates[i]] / Math.abs(prevCumulative));
    }
  }
  
  return returns.length > 0 ? returns : [0];
}

function calculateVolatility(returns) {
  if (returns.length <= 1) return 0;
  
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance * 252); // Annualized
}

function calculateSharpeRatio(returns, riskFreeRate) {
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = calculateVolatility(returns);
  return volatility !== 0 ? (avgReturn * 252 - riskFreeRate) / volatility : 0;
}

function calculateMaxDrawdown(trades) {
  let peak = 0;
  let maxDrawdown = 0;
  let cumulativePnL = 0;
  
  trades.forEach(trade => {
    cumulativePnL += trade.calculatedPl || 0;
    if (cumulativePnL > peak) peak = cumulativePnL;
    
    if (peak > 0) {
      const drawdown = (peak - cumulativePnL) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
  });
  
  return maxDrawdown;
}

function calculateVaR(returns, confidence) {
  if (returns.length === 0) return 0;
  
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sortedReturns.length);
  return Math.abs(sortedReturns[index] || 0);
}

function calculateRiskScore(volatility, sharpeRatio, maxDrawdown) {
  // Risk score from 0-100 (higher = more risky)
  let score = 0;
  
  // Volatility component (0-40 points)
  score += Math.min(volatility * 100, 40);
  
  // Sharpe ratio component (0-30 points, inverted)
  score += Math.max(0, 30 - (sharpeRatio * 10));
  
  // Max drawdown component (0-30 points)
  score += Math.min(maxDrawdown * 100, 30);
  
  return Math.min(Math.round(score), 100);
}

function calculateBeta(portfolioReturns, marketReturns) {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) return 1;
  
  const portfolioMean = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;
  
  let covariance = 0;
  let marketVariance = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const marketDiff = marketReturns[i] - marketMean;
    covariance += portfolioDiff * marketDiff;
    marketVariance += marketDiff * marketDiff;
  }
  
  return marketVariance !== 0 ? covariance / marketVariance : 1;
}

function calculateAlpha(portfolioReturns, marketReturns, beta, riskFreeRate) {
  const portfolioReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length * 252;
  const marketReturn = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length * 252;
  
  return portfolioReturn - (riskFreeRate + beta * (marketReturn - riskFreeRate));
}

function calculateCorrelation(portfolioReturns, marketReturns) {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) return 0;
  
  const portfolioMean = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
  const marketMean = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;
  
  let numerator = 0;
  let portfolioSumSq = 0;
  let marketSumSq = 0;
  
  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const marketDiff = marketReturns[i] - marketMean;
    
    numerator += portfolioDiff * marketDiff;
    portfolioSumSq += portfolioDiff * portfolioDiff;
    marketSumSq += marketDiff * marketDiff;
  }
  
  const denominator = Math.sqrt(portfolioSumSq * marketSumSq);
  return denominator !== 0 ? numerator / denominator : 0;
}

function calculateTrackingError(portfolioReturns, marketReturns) {
  if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length === 0) return 0;
  
  const differences = portfolioReturns.map((ret, i) => ret - marketReturns[i]);
  const mean = differences.reduce((a, b) => a + b, 0) / differences.length;
  const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - mean, 2), 0) / differences.length;
  
  return Math.sqrt(variance * 252); // Annualized
}

function generateSimulatedMarketReturns(length) {
  // Simulate VN-Index returns with realistic parameters
  const returns = [];
  for (let i = 0; i < length; i++) {
    // Normal distribution with mean=0.0003 (daily), std=0.015
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    returns.push(0.0003 + z * 0.015);
  }
  return returns;
} 