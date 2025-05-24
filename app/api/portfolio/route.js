import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { serverLogger as logger } from '../../lib/server-logger';

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

    // Build the where clause based on account filter
    const whereClause = {
      userId: userId,
      quantity: {
        not: 0
      }
    };

    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }

    // Use a more efficient query with only the fields we need
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        ticker: true,
        type: true,
        quantity: true,
        price: true,
        transactionDate: true,
        stockAccountId: true,
        stockAccount: {
          select: {
            id: true,
            name: true,
            brokerName: true
          }
        }
      },
      orderBy: {
        transactionDate: 'asc' // Order by date ascending for proper calculation
      }
    });

    const dbTime = performance.now();
    logger.info(`Portfolio DB query completed in ${Math.round(dbTime - startTime)}ms`);

    // Calculate portfolio positions with a more efficient algorithm
    const portfolio = {};
    const accountAllocations = {};
    
    // Pre-allocate memory for frequently accessed tickers
    const tickerSet = new Set(transactions.map(t => t.ticker));
    tickerSet.forEach(ticker => {
      portfolio[ticker] = {
        ticker,
        quantity: 0,
        totalCost: 0,
        avgCost: 0,
        stockAccountId: null,
        stockAccount: null
      };
    });
    
    // Process transactions in a single pass
    for (const transaction of transactions) {
      const { ticker, type, quantity, price, stockAccountId: txAccountId, stockAccount } = transaction;
      const position = portfolio[ticker];
      
      // Store account information (use the latest transaction's account)
      if (txAccountId) {
        position.stockAccountId = txAccountId;
        position.stockAccount = stockAccount;
      }
      
      if (type === 'BUY') {
        position.totalCost += price * quantity;
        position.quantity += quantity;
      } else if (type === 'SELL') {
        // For sells, we reduce the quantity and adjust the total cost proportionally
        if (position.quantity > 0) {
          const sellRatio = Math.min(1, quantity / position.quantity); // Cap at 1 to avoid negative ratios
          position.totalCost -= position.totalCost * sellRatio;
          position.quantity -= quantity;
        }
      }
      
      // Only recalculate average cost when necessary
      if (position.quantity > 0) {
        position.avgCost = position.totalCost / position.quantity;
      }
    }
    
    // Filter out positions with zero quantity more efficiently
    const activePositions = Object.values(portfolio).filter(position => position.quantity > 0);
    
    // Calculate account allocations only if not filtering by specific account
    let accountAllocationData = null;
    if (!stockAccountId) {
      // Get all transactions to calculate account allocations
      const allTransactions = await prisma.transaction.findMany({
        where: {
          userId: userId,
          quantity: {
            not: 0
          }
        },
        select: {
          ticker: true,
          type: true,
          quantity: true,
          price: true,
          transactionDate: true,
          stockAccountId: true,
          stockAccount: {
            select: {
              id: true,
              name: true,
              brokerName: true
            }
          }
        },
        orderBy: {
          transactionDate: 'asc'
        }
      });

      // Calculate portfolio by account
      const accountPortfolios = {};
      
      for (const transaction of allTransactions) {
        const { ticker, type, quantity, price, stockAccountId: txAccountId, stockAccount } = transaction;
        
        if (!txAccountId) continue;
        
        if (!accountPortfolios[txAccountId]) {
          accountPortfolios[txAccountId] = {
            accountId: txAccountId,
            accountInfo: stockAccount,
            positions: {},
            totalValue: 0
          };
        }
        
        const accountPortfolio = accountPortfolios[txAccountId];
        
        if (!accountPortfolio.positions[ticker]) {
          accountPortfolio.positions[ticker] = {
            ticker,
            quantity: 0,
            totalCost: 0,
            avgCost: 0
          };
        }
        
        const position = accountPortfolio.positions[ticker];
        
        if (type === 'BUY') {
          position.totalCost += price * quantity;
          position.quantity += quantity;
        } else if (type === 'SELL') {
          if (position.quantity > 0) {
            const sellRatio = Math.min(1, quantity / position.quantity);
            position.totalCost -= position.totalCost * sellRatio;
            position.quantity -= quantity;
          }
        }
        
        if (position.quantity > 0) {
          position.avgCost = position.totalCost / position.quantity;
        }
      }
      
      // Calculate total value for each account (cost basis for now, can be enhanced with market data)
      accountAllocationData = Object.values(accountPortfolios).map(account => {
        const activePositions = Object.values(account.positions).filter(p => p.quantity > 0);
        const totalValue = activePositions.reduce((sum, pos) => sum + (pos.quantity * pos.avgCost), 0);
        
        return {
          accountId: account.accountId,
          accountInfo: account.accountInfo,
          totalValue,
          positionsCount: activePositions.length
        };
      }).filter(account => account.totalValue > 0);
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
    logger.info(`Portfolio API completed in ${Math.round(endTime - startTime)}ms (calculation: ${Math.round(endTime - dbTime)}ms)`);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error fetching portfolio data:', { error: error.message, stack: error.stack });
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
} 