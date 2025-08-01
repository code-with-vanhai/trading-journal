import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { serverLogger as logger } from '../../lib/server-logger';
import { calculatePortfolioWithNewCostBasis, calculatePortfolioWithAdjustments } from '../../lib/cost-basis-calculator-wrapper';

// Use a singleton pattern for Prisma to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Import optimized portfolio cache
const { portfolioCache, performanceMonitor } = require('../../lib/query-optimizer');

export async function GET(request) {
  const startTime = performance.now();
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const stockAccountId = searchParams.get('stockAccountId');
    const includeAdjustments = searchParams.get('includeAdjustments') === 'true';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const sortBy = searchParams.get('sortBy') || 'totalCost';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const cacheKey = `portfolio-${userId}-${stockAccountId || 'all'}-${includeAdjustments ? 'adj' : 'orig'}-${page}-${pageSize}-${sortBy}-${sortOrder}`;
    
    // Check optimized cache first
    const cachedData = portfolioCache.get(cacheKey);
    if (cachedData) {
      const endTimer = performanceMonitor.startTimer('Portfolio API (cached)');
      logger.info(`Portfolio cache hit for user ${userId}, account: ${stockAccountId || 'all'}, adjustments: ${includeAdjustments}`);
      endTimer();
      return NextResponse.json(cachedData);
    }
    
    logger.info(`Portfolio cache miss for user ${userId}, account: ${stockAccountId || 'all'}, adjustments: ${includeAdjustments}, calculating...`);

    // Use appropriate cost basis calculation system
    const allPositions = includeAdjustments 
      ? await calculatePortfolioWithAdjustments(userId, stockAccountId, true)
      : await calculatePortfolioWithNewCostBasis(userId, stockAccountId);

    const dbTime = performance.now();
    logger.info(`Portfolio calculation completed in ${Math.round(dbTime - startTime)}ms`);
    
    // Sort positions
    const sortedPositions = [...allPositions].sort((a, b) => {
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
    
    // Apply pagination
    const totalCount = sortedPositions.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const skip = (page - 1) * pageSize;
    const paginatedPositions = sortedPositions.slice(skip, skip + pageSize);
    
    // Calculate account allocations only if not filtering by specific account - Optimized
    let accountAllocationData = null;
    if (!stockAccountId) {
      // Optimized: Get account allocations from already calculated portfolio data
      // instead of recalculating for each account
      const accountAllocations = {};
      
      allPositions.forEach(position => {
        if (!accountAllocations[position.stockAccountId]) {
          accountAllocations[position.stockAccountId] = {
            accountId: position.stockAccountId,
            accountInfo: position.stockAccount,
            totalValue: 0,
            positionsCount: 0
          };
        }
        
        accountAllocations[position.stockAccountId].totalValue += position.totalCost;
        accountAllocations[position.stockAccountId].positionsCount += 1;
      });
      
      accountAllocationData = Object.values(accountAllocations).filter(account => account.totalValue > 0);
    }

    // Calculate total summary for overview (not affected by pagination)
    const totalSummary = {
      totalCostBasis: allPositions.reduce((sum, item) => sum + (item.quantity * item.avgCost), 0),
      totalPositions: allPositions.length
    };

    // Prepare all portfolio data for charts (not affected by pagination)
    const allPortfolioForCharts = allPositions.map(holding => ({
      ticker: holding.ticker,
      quantity: holding.quantity,
      avgCost: holding.avgCost,
      totalCost: holding.totalCost,
      stockAccount: holding.stockAccount,
      stockAccountId: holding.stockAccountId
    }));

    // Cache the result using optimized cache
    const result = { 
      portfolio: paginatedPositions,
      totalCount,
      page,
      pageSize,
      totalPages,
      accountAllocations: accountAllocationData,
      totalSummary,
      allPortfolioForCharts
    };
    portfolioCache.set(cacheKey, result);
    
    const endTime = performance.now();
    logger.info(`Portfolio API completed in ${Math.round(endTime - startTime)}ms`);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching portfolio data:', { error: error.message, stack: error.stack });
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
} 