/**
 * 📊 PORTFOLIO SERVICE
 * Business logic layer cho portfolio management
 * 
 * Responsibilities:
 * - Portfolio calculation và analysis
 * - Position management
 * - Market data integration
 * - Performance metrics
 * - Asset allocation analysis
 */

import db, { withRetry } from '../lib/database.js';
import logger from '../lib/production-logger.js';
import enhancedOptimizer from '../lib/enhanced-query-optimizer.js';
import { calculatePortfolioWithNewCostBasis, calculatePortfolioWithAdjustments } from '../lib/cost-basis-calculator-wrapper.js';

class PortfolioService {
  constructor() {
    this.logger = logger;
    this.cache = enhancedOptimizer;
  }

  /**
   * Get comprehensive portfolio data
   */
  async getPortfolio(userId, options = {}) {
    const startTime = performance.now();
    
    try {
      const {
        stockAccountId,
        includeAdjustments = false,
        page = 1,
        pageSize = 25,
        sortBy = 'totalCost',
        sortOrder = 'desc',
        includeMarketData = true,
        includeMetrics = true
      } = options;

      logger.debug('Fetching portfolio', { 
        userId, 
        stockAccountId, 
        includeAdjustments,
        page,
        pageSize 
      });

      // Get portfolio positions using enhanced query optimizer
      const cacheKey = `portfolio-${userId}-${stockAccountId || 'all'}-${includeAdjustments ? 'adj' : 'orig'}-${page}-${pageSize}-${sortBy}-${sortOrder}`;
      
      const allPositions = await this.cache.executeOptimizedQuery(
        async () => {
          return includeAdjustments 
            ? await calculatePortfolioWithAdjustments(userId, stockAccountId, true)
            : await calculatePortfolioWithNewCostBasis(userId, stockAccountId);
        },
        cacheKey,
        'portfolio',
        { ttl: 5 * 60 * 1000 }
      );

      // Sort positions
      const sortedPositions = this.sortPositions(allPositions, sortBy, sortOrder);
      
      // Apply pagination
      const totalCount = sortedPositions.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const skip = (page - 1) * pageSize;
      const paginatedPositions = sortedPositions.slice(skip, skip + pageSize);
      
      // Calculate account allocations if not filtering by specific account
      let accountAllocationData = null;
      if (!stockAccountId) {
        accountAllocationData = this.calculateAccountAllocations(allPositions);
      }

      // Calculate summary metrics
      const totalSummary = this.calculatePortfolioSummary(allPositions);
      
      // Prepare chart data (all positions, not paginated)
      const allPortfolioForCharts = this.prepareChartData(allPositions);
      
      // Enrich with market data if requested
      let enrichedPortfolio = paginatedPositions;
      let enrichedAllPortfolio = allPortfolioForCharts;
      
      if (includeMarketData) {
        const tickers = [...new Set(allPositions.map(p => p.ticker))];
        const marketData = await this.getMarketDataForTickers(tickers);
        
        enrichedPortfolio = this.enrichWithMarketData(paginatedPositions, marketData);
        enrichedAllPortfolio = this.enrichWithMarketData(allPortfolioForCharts, marketData);
      }
      
      // Calculate performance metrics if requested
      let performanceMetrics = null;
      if (includeMetrics) {
        performanceMetrics = await this.calculatePerformanceMetrics(
          userId, 
          enrichedAllPortfolio,
          stockAccountId
        );
      }

      const duration = performance.now() - startTime;
      logger.info('Portfolio fetched successfully', {
        userId,
        positionsCount: totalCount,
        duration: `${duration.toFixed(2)}ms`,
        includeMarketData,
        includeMetrics
      });

      return {
        portfolio: enrichedPortfolio,
        totalCount,
        page,
        pageSize,
        totalPages,
        accountAllocations: accountAllocationData,
        totalSummary,
        allPortfolioForCharts: enrichedAllPortfolio,
        performanceMetrics,
        metadata: {
          includeAdjustments,
          sortBy,
          sortOrder,
          generatedAt: new Date().toISOString(),
          duration: `${duration.toFixed(2)}ms`
        }
      };
      
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Portfolio fetch failed', {
        userId,
        error: error.message,
        duration: `${duration.toFixed(2)}ms`,
        stack: error.stack
      });
      
      throw this.createServiceError('PORTFOLIO_FETCH_FAILED', error);
    }
  }

  /**
   * Get portfolio performance analysis
   */
  async getPortfolioAnalysis(userId, options = {}) {
    try {
      const {
        stockAccountId,
        period = 'all', // 1M, 3M, 6M, 1Y, all
        includeComparison = false
      } = options;

      logger.debug('Fetching portfolio analysis', { userId, period });

      // Get current portfolio
      const currentPortfolio = await this.getPortfolio(userId, { 
        stockAccountId,
        includeMarketData: true,
        includeMetrics: false
      });

      // Get historical performance data
      const performanceData = await this.getHistoricalPerformance(userId, stockAccountId, period);
      
      // Calculate risk metrics
      const riskMetrics = await this.calculateRiskMetrics(userId, stockAccountId, period);
      
      // Sector allocation analysis
      const sectorAllocation = await this.analyzeSectorAllocation(currentPortfolio.allPortfolioForCharts);
      
      // Performance attribution
      const performanceAttribution = await this.calculatePerformanceAttribution(
        userId, 
        stockAccountId, 
        period
      );
      
      // Benchmark comparison if requested
      let benchmarkComparison = null;
      if (includeComparison) {
        benchmarkComparison = await this.compareToBenchmark(performanceData);
      }

      return {
        summary: {
          totalValue: currentPortfolio.totalSummary.totalCostBasis,
          totalPositions: currentPortfolio.totalCount,
          performance: performanceData.totalReturn,
          period
        },
        performance: performanceData,
        risk: riskMetrics,
        allocation: {
          byAccount: currentPortfolio.accountAllocations,
          bySector: sectorAllocation,
          byPosition: currentPortfolio.allPortfolioForCharts
        },
        attribution: performanceAttribution,
        benchmark: benchmarkComparison,
        metadata: {
          generatedAt: new Date().toISOString(),
          period,
          includeComparison
        }
      };
      
    } catch (error) {
      logger.error('Portfolio analysis failed', {
        userId,
        error: error.message
      });
      
      throw this.createServiceError('PORTFOLIO_ANALYSIS_FAILED', error);
    }
  }

  /**
   * Get position details for specific ticker
   */
  async getPositionDetails(userId, ticker, stockAccountId = null) {
    try {
      logger.debug('Fetching position details', { userId, ticker, stockAccountId });
      
      // Get all transactions for this position
      const transactions = await db.transaction.findMany({
        where: {
          userId,
          ticker,
          ...(stockAccountId && { stockAccountId })
        },
        orderBy: [
          { transactionDate: 'asc' }
        ],
        include: {
          journalEntry: {
            select: {
              id: true,
              emotionOnEntry: true,
              emotionOnExit: true,
              strategyUsed: true,
              postTradeReview: true
            }
          }
        }
      });
      
      if (transactions.length === 0) {
        throw new Error('Position not found');
      }
      
      // Calculate position metrics
      const positionMetrics = this.calculatePositionMetrics(transactions);
      
      // Get current market data
      const marketData = await this.getMarketDataForTickers([ticker]);
      
      // Calculate current position value
      const currentPosition = this.calculateCurrentPosition(transactions, marketData[ticker]);
      
      // Get purchase lots (for FIFO tracking)
      const purchaseLots = await this.getPurchaseLots(userId, ticker, stockAccountId);
      
      // Performance analysis
      const performanceAnalysis = this.analyzePositionPerformance(
        transactions,
        currentPosition,
        marketData[ticker]
      );

      return {
        ticker,
        currentPosition,
        metrics: positionMetrics,
        performance: performanceAnalysis,
        transactions,
        purchaseLots,
        marketData: marketData[ticker],
        metadata: {
          generatedAt: new Date().toISOString(),
          transactionCount: transactions.length
        }
      };
      
    } catch (error) {
      logger.error('Position details fetch failed', {
        userId,
        ticker,
        error: error.message
      });
      
      throw this.createServiceError('POSITION_DETAILS_FAILED', error);
    }
  }

  /**
   * Helper methods
   */
  
  sortPositions(positions, sortBy, sortOrder) {
    return [...positions].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'avgCost':
          aValue = a.avgCost;
          bValue = b.avgCost;
          break;
        case 'totalCost':
        default:
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }

  calculateAccountAllocations(positions) {
    const allocations = {};
    
    positions.forEach(position => {
      if (!allocations[position.stockAccountId]) {
        allocations[position.stockAccountId] = {
          accountId: position.stockAccountId,
          accountInfo: position.stockAccount,
          totalValue: 0,
          positionsCount: 0
        };
      }
      
      allocations[position.stockAccountId].totalValue += position.totalCost;
      allocations[position.stockAccountId].positionsCount += 1;
    });
    
    return Object.values(allocations).filter(account => account.totalValue > 0);
  }

  calculatePortfolioSummary(positions) {
    return {
      totalCostBasis: positions.reduce((sum, item) => sum + (item.quantity * item.avgCost), 0),
      totalPositions: positions.length
    };
  }

  prepareChartData(positions) {
    return positions.map(holding => ({
      ticker: holding.ticker,
      quantity: holding.quantity,
      avgCost: holding.avgCost,
      totalCost: holding.totalCost,
      stockAccount: holding.stockAccount,
      stockAccountId: holding.stockAccountId
    }));
  }

  async getMarketDataForTickers(tickers) {
    try {
      if (!tickers || tickers.length === 0) {
        return {};
      }

      // This would integrate with your market data service
      // For now, return mock data structure
      const marketData = {};
      
      for (const ticker of tickers) {
        // In real implementation, call market data API
        marketData[ticker] = {
          price: null,
          change: null,
          changePercent: null,
          lastUpdated: null
        };
      }
      
      return marketData;
      
    } catch (error) {
      logger.error('Market data fetch failed', {
        tickers,
        error: error.message
      });
      
      return {};
    }
  }

  enrichWithMarketData(positions, marketData) {
    return positions.map(position => {
      const market = marketData[position.ticker] || {};
      const currentPrice = market.price || position.avgCost;
      const marketValue = position.quantity * currentPrice;
      const unrealizedPL = marketValue - position.totalCost;
      const unrealizedPLPercent = position.totalCost > 0 
        ? (unrealizedPL / position.totalCost) * 100 
        : 0;
      
      return {
        ...position,
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        marketData: market
      };
    });
  }

  async calculatePerformanceMetrics(userId, positions, stockAccountId) {
    try {
      // Get all sell transactions for realized P&L
      const sellTransactions = await db.transaction.findMany({
        where: {
          userId,
          type: 'SELL',
          ...(stockAccountId && { stockAccountId })
        },
        select: {
          calculatedPl: true,
          transactionDate: true
        }
      });
      
      const realizedPL = sellTransactions.reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
      const unrealizedPL = positions.reduce((sum, pos) => sum + (pos.unrealizedPL || 0), 0);
      const totalPL = realizedPL + unrealizedPL;
      
      const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
      const totalValue = positions.reduce((sum, pos) => sum + (pos.marketValue || pos.totalCost), 0);
      
      const totalReturn = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
      
      return {
        totalValue,
        totalCost,
        totalPL,
        totalReturn,
        realizedPL,
        unrealizedPL,
        winningPositions: positions.filter(p => (p.unrealizedPL || 0) > 0).length,
        losingPositions: positions.filter(p => (p.unrealizedPL || 0) < 0).length,
        breakEvenPositions: positions.filter(p => (p.unrealizedPL || 0) === 0).length
      };
      
    } catch (error) {
      logger.error('Performance metrics calculation failed', {
        userId,
        error: error.message
      });
      
      return {
        totalValue: 0,
        totalCost: 0,
        totalPL: 0,
        totalReturn: 0,
        realizedPL: 0,
        unrealizedPL: 0,
        winningPositions: 0,
        losingPositions: 0,
        breakEvenPositions: 0
      };
    }
  }

  // Additional helper methods for analysis features...
  async getHistoricalPerformance(userId, stockAccountId, period) {
    // Implementation for historical performance tracking
    return {
      totalReturn: 0,
      timeSeriesData: [],
      periodStart: new Date(),
      periodEnd: new Date()
    };
  }

  async calculateRiskMetrics(userId, stockAccountId, period) {
    // Implementation for risk analysis
    return {
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      beta: 0
    };
  }

  async analyzeSectorAllocation(positions) {
    // Implementation for sector analysis
    return [];
  }

  async calculatePerformanceAttribution(userId, stockAccountId, period) {
    // Implementation for performance attribution
    return {
      assetAllocation: 0,
      stockSelection: 0,
      interaction: 0
    };
  }

  async compareToBenchmark(performanceData) {
    // Implementation for benchmark comparison
    return {
      benchmark: 'VN-INDEX',
      benchmarkReturn: 0,
      alpha: 0,
      beta: 0
    };
  }

  calculatePositionMetrics(transactions) {
    const buyTransactions = transactions.filter(tx => tx.type === 'BUY');
    const sellTransactions = transactions.filter(tx => tx.type === 'SELL');
    
    const totalBought = buyTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
    const totalSold = sellTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
    const currentQuantity = totalBought - totalSold;
    
    const totalCost = buyTransactions.reduce((sum, tx) => sum + (tx.quantity * tx.price + tx.fee), 0);
    const avgCost = totalBought > 0 ? totalCost / totalBought : 0;
    
    const realizedPL = sellTransactions.reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
    
    return {
      currentQuantity,
      avgCost,
      totalCost,
      realizedPL,
      totalBought,
      totalSold,
      transactionCount: transactions.length,
      firstPurchase: buyTransactions[0]?.transactionDate,
      lastTransaction: transactions[transactions.length - 1]?.transactionDate
    };
  }

  calculateCurrentPosition(transactions, marketData) {
    const metrics = this.calculatePositionMetrics(transactions);
    const currentPrice = marketData?.price || metrics.avgCost;
    const marketValue = metrics.currentQuantity * currentPrice;
    const unrealizedPL = marketValue - (metrics.currentQuantity * metrics.avgCost);
    
    return {
      ...metrics,
      currentPrice,
      marketValue,
      unrealizedPL,
      unrealizedPLPercent: metrics.avgCost > 0 ? (unrealizedPL / (metrics.currentQuantity * metrics.avgCost)) * 100 : 0
    };
  }

  async getPurchaseLots(userId, ticker, stockAccountId) {
    return await db.purchaseLot.findMany({
      where: {
        userId,
        ticker,
        ...(stockAccountId && { stockAccountId }),
        remainingQuantity: { gt: 0 }
      },
      orderBy: {
        purchaseDate: 'asc'
      }
    });
  }

  analyzePositionPerformance(transactions, currentPosition, marketData) {
    // Implementation for detailed position performance analysis
    return {
      holdingPeriod: null,
      annualizedReturn: 0,
      totalReturn: currentPosition.unrealizedPLPercent,
      bestTrade: null,
      worstTrade: null,
      averageHoldingPeriod: 0
    };
  }

  createServiceError(code, originalError) {
    const error = new Error(originalError.message);
    error.code = code;
    error.originalError = originalError;
    error.isServiceError = true;
    return error;
  }
}

// Export singleton instance
const portfolioService = new PortfolioService();
export default portfolioService;
