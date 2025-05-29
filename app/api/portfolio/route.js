import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { serverLogger as logger } from '../../lib/server-logger';
import { calculatePortfolioWithNewCostBasis } from '../../lib/cost-basis-calculator-wrapper';

// Use a singleton pattern for Prisma to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Portfolio cache with TTL
const portfolioCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

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
    
    const cacheKey = `portfolio-${userId}-${stockAccountId || 'all'}`;
    
    // Check cache first
    const cachedData = portfolioCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      logger.info(`Portfolio cache hit for user ${userId}, account: ${stockAccountId || 'all'}`);
      const endTime = performance.now();
      logger.info(`Portfolio API (cached) completed in ${Math.round(endTime - startTime)}ms`);
      return NextResponse.json(cachedData.data);
    }
    
    logger.info(`Portfolio cache miss for user ${userId}, account: ${stockAccountId || 'all'}, calculating...`);

    // Use new cost basis calculation system
    const activePositions = await calculatePortfolioWithNewCostBasis(userId, stockAccountId);

    const dbTime = performance.now();
    logger.info(`Portfolio calculation completed in ${Math.round(dbTime - startTime)}ms`);
    
    // Calculate account allocations only if not filtering by specific account
    let accountAllocationData = null;
    if (!stockAccountId) {
      // Get all stock accounts for this user
      const stockAccounts = await prisma.stockAccount.findMany({
        where: { userId: userId }
      });
      
      // Calculate portfolio for each account
      const accountPortfolios = await Promise.all(
        stockAccounts.map(async (account) => {
          const accountPositions = await calculatePortfolioWithNewCostBasis(userId, account.id);
          const totalValue = accountPositions.reduce((sum, pos) => sum + pos.totalCost, 0);
          
          return {
            accountId: account.id,
            accountInfo: {
              id: account.id,
              name: account.name,
              brokerName: account.brokerName
            },
            totalValue,
            positionsCount: accountPositions.length
          };
        })
      );
      
      accountAllocationData = accountPortfolios.filter(account => account.totalValue > 0);
    }

    // Cache the result
    const result = { 
      portfolio: activePositions,
      accountAllocations: accountAllocationData
    };
    portfolioCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    const endTime = performance.now();
    logger.info(`Portfolio API completed in ${Math.round(endTime - startTime)}ms`);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching portfolio data:', { error: error.message, stack: error.stack });
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
} 