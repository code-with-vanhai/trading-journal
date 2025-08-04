import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { processBuyTransaction, processSellTransaction } from '../../lib/cost-basis-calculator-wrapper';
import { sanitizeError, secureLog } from '../../lib/error-handler';
import { prisma, withRetry } from '../../lib/prisma-with-retry';

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
      averageProfit: sellTransactions.length > 0 ? -accountFeesTotal / sellTransactions.length : 0,
      totalProfit: 0,
      totalLoss: 0,
      accountFeesTotal: accountFeesTotal,
      grossProfitLoss: 0 // P/L from transactions only
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
    successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
    averageProfit: Math.round(averageProfit),
    totalProfit: Math.round(totalProfit),
    totalLoss: Math.round(totalLoss),
    accountFeesTotal: Math.round(accountFeesTotal),
    grossProfitLoss: Math.round(grossProfitLoss) // P/L from transactions only
  };
}

// Prisma client is now imported from prisma-with-retry.js with connection pool management

// Import optimized caching and query utilities
const { transactionCache, performanceMonitor, queryOptimizer, batchProcessor } = require('../../lib/query-optimizer');

// Legacy calculateProfitLoss function - replaced by new FIFO system
// const calculateProfitLoss = async (userId, stockAccountId, ticker, quantity, sellPrice, fee, taxRate) => {
//   // Old logic has been replaced by processSellTransaction in cost-basis-calculator.js
//   return 0;
// };

// GET - Fetch all transactions for current user with filtering and pagination
export async function GET(request) {
  const startTime = Date.now();
  let session; // Declare session in outer scope for error handler

  try {
    session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');
    const stockAccountId = searchParams.get('stockAccountId'); // New filter for stock account
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'transactionDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Create a cache key based on the request params
    const cacheKey = JSON.stringify({
      userId: session.user.id,
      ticker, type, stockAccountId, dateFrom, dateTo, minAmount, maxAmount,
      sortBy, sortOrder, page, pageSize
    });
    
    // Check optimized cache first
    const cachedResult = transactionCache.get(cacheKey);
    if (cachedResult) {
      const endTimer = performanceMonitor.startTimer('Transactions API (cached)');
      endTimer();
      return NextResponse.json(cachedResult);
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build optimized where clause using query optimizer
    const filters = { type, stockAccountId, ticker, dateFrom, dateTo, minAmount, maxAmount };
    let whereClause = queryOptimizer.optimizeWhereClause(
      { userId: session.user.id },
      filters
    );

    // Apply specific filter logic
    if (ticker) {
      // Use exact matching if possible for better index usage
      if (ticker.length >= 2) {
        whereClause.ticker = {
          contains: ticker.toUpperCase()
        };
      } else {
        whereClause.ticker = {
          startsWith: ticker.toUpperCase()
        };
      }
    }
    
    // Date range filter - optimize for index usage
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
    
    // Price range filter
    if (minAmount || maxAmount) {
      whereClause.price = {};
      
      if (minAmount) {
        whereClause.price.gte = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        whereClause.price.lte = parseFloat(maxAmount);
      }
    }

    // Optimize orderBy using query optimizer
    const validSortFields = [
      'transactionDate', 'ticker', 'type', 'quantity', 
      'price', 'calculatedPl', 'fee', 'taxRate'
    ];
    
    const orderBy = queryOptimizer.optimizeOrderBy(sortBy, sortOrder, validSortFields);

    // For common requests (first page with default sort), optimize further
    const isCommonRequest = page === 1 && 
                           pageSize === 10 && 
                           sortBy === 'transactionDate' && 
                           sortOrder === 'desc' &&
                           !ticker && !type && !stockAccountId && !dateFrom && !dateTo && !minAmount && !maxAmount;

    if (isCommonRequest) {
      // Use a separate cache key for this common request pattern
      const recentCacheKey = `recent_${session.user.id}_${pageSize}`;
      const cachedRecent = transactionCache.get(recentCacheKey);
      
      if (cachedRecent) {
        console.log(`[Transactions API] Recent cache hit - ${Date.now() - startTime}ms`);
        return NextResponse.json(cachedRecent);
      }
      
      // Optimized query for recent transactions
      try {
        // Instead of using raw SQL which is prone to case sensitivity issues,
        // let's use Prisma's findMany for better compatibility
        const transactions = await prisma.transaction.findMany({
          where: {
            userId: session.user.id
          },
          select: {
            id: true,
            ticker: true,
            type: true,
            quantity: true,
            price: true,
            transactionDate: true,
            fee: true,
            taxRate: true,
            calculatedPl: true,
            notes: true,
            stockAccountId: true, // Include stock account ID
            userId: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: [
            { transactionDate: 'desc' },
            { id: 'desc' }
          ],
          take: pageSize
        });

        // Optimized: Batch fetch related data to avoid N+1 queries
        const stockAccountIds = [...new Set(transactions.map(tx => tx.stockAccountId))];
        const transactionIds = transactions.map(tx => tx.id);

        const [stockAccounts, journalEntries] = await Promise.all([
          stockAccountIds.length > 0 ? withRetry(() => prisma.stockAccount.findMany({
            where: {
              id: { in: stockAccountIds }
            },
            select: {
              id: true,
              name: true,
              brokerName: true
            }
          })) : Promise.resolve([]),
          transactionIds.length > 0 ? withRetry(() => prisma.journalEntry.findMany({
            where: {
              transactionId: { in: transactionIds }
            },
            select: {
              id: true,
              transactionId: true
            }
          })) : Promise.resolve([])
        ]);

        // Create optimized lookup maps
        const stockAccountMap = new Map(stockAccounts.map(account => [account.id, account]));
        const journalEntryMap = new Map(journalEntries.map(entry => [entry.transactionId, entry]));
        
        // Format the results with optimized lookups
        const formattedTransactions = transactions.map(tx => ({
          ...tx,
          StockAccount: stockAccountMap.get(tx.stockAccountId) || null,
          journalEntry: journalEntryMap.has(tx.id) ? { id: journalEntryMap.get(tx.id).id } : null
        }));
      
        // Get count with a simple query
        const totalCount = await prisma.transaction.count({
          where: { userId: session.user.id }
        });
        
        // Get account fees total for the same period
        const accountFeesData = await getAccountFeesTotal(session.user.id, {
          stockAccountId: stockAccountId,
          dateFrom: dateFrom,
          dateTo: dateTo
        });

        // Calculate profit/loss statistics for recent transactions including account fees
        const profitStats = calculateProfitStats(formattedTransactions, accountFeesData.totalAmount);

        const result = {
          transactions: formattedTransactions,
          totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          profitStats
        };
        
        // Cache the result with the recent key using optimized cache
        transactionCache.set(recentCacheKey, result);
        
        console.log(`[Transactions API] Optimized fetch completed in ${Date.now() - startTime}ms`);
        return NextResponse.json(result);
      } catch (optimizedQueryError) {
        console.error('Error in optimized query path:', optimizedQueryError);
        // Fall through to standard query path if optimized path fails
      }
    }

    // For non-common requests, use the regular approach with Promise.all for parallel execution
    const [totalCount, transactions] = await Promise.all([
      withRetry(() => prisma.transaction.count({
        where: whereClause,
      })),
      withRetry(() => prisma.transaction.findMany({
        where: whereClause,
        orderBy, // Now correctly formatted
        // Only select fields we need
        select: {
          id: true,
          ticker: true,
          type: true,
          quantity: true,
          price: true,
          transactionDate: true,
          fee: true,
          taxRate: true,
          calculatedPl: true,
          notes: true,
          stockAccountId: true, // Include stock account ID
          userId: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: pageSize,
      }))
    ]);

    // Get account fees total for the same filters
    const accountFeesData = await getAccountFeesTotal(session.user.id, {
      stockAccountId: stockAccountId,
      dateFrom: dateFrom,
      dateTo: dateTo
    });

    // Calculate profit/loss statistics for filtered transactions including account fees
    const profitStats = calculateProfitStats(transactions, accountFeesData.totalAmount);

    const result = {
      transactions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      profitStats // Add profit statistics
    };
    
    // Cache the result using optimized cache
    transactionCache.set(cacheKey, result);
    
    console.log(`[Transactions API] Fetch completed in ${Date.now() - startTime}ms`);
    return NextResponse.json(result);
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      userId: session?.user?.id,
      endpoint: 'GET /api/transactions',
      userAgent: request.headers.get('user-agent')
    });
    
    const sanitizedError = sanitizeError(error);
    return NextResponse.json(
      { 
        message: sanitizedError.message,
        code: sanitizedError.code
      },
      { status: sanitizedError.status }
    );
  }
}

// POST - Create a new transaction
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database to prevent foreign key constraint violations
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json(
        { message: 'User not found in database. Please log out and log in again.' }, 
        { status: 404 }
      );
    }

    const body = await request.json();
    const { ticker, type, quantity, price, transactionDate, fee = 0, taxRate = 0, notes, stockAccountId } = body;

    // Validate required fields
    if (!ticker || !type || !quantity || !price || !transactionDate) {
      return NextResponse.json(
        { message: 'Missing required fields: ticker, type, quantity, price, and transactionDate are required' },
        { status: 400 }
      );
    }

    let finalStockAccountId = stockAccountId;

    // If no stockAccountId provided, get or create default account
    if (!finalStockAccountId) {
      // Try to find existing accounts for the user
      let stockAccounts = await prisma.stockAccount.findMany({
        where: {
          userId: session.user.id
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      // If no accounts exist, create a default one
      if (stockAccounts.length === 0) {
        console.log(`Creating default account for user ${session.user.id} during transaction creation`);
        
        const defaultAccount = await prisma.stockAccount.create({
          data: {
            id: `default-${session.user.id}`,
            name: 'Tài khoản mặc định',
            brokerName: null,
            accountNumber: null,
            description: 'Tài khoản mặc định được tạo tự động',
            userId: session.user.id
          }
        });

        finalStockAccountId = defaultAccount.id;
      } else {
        // Use the first account (which should be default if it exists, or oldest account)
        const defaultAccount = stockAccounts.find(account => account.name === 'Tài khoản mặc định') || stockAccounts[0];
        finalStockAccountId = defaultAccount.id;
      }
    } else {
      // Verify that the provided stock account belongs to the user
      const stockAccount = await prisma.stockAccount.findFirst({
        where: {
          id: stockAccountId,
          userId: session.user.id
        }
      });

      if (!stockAccount) {
        return NextResponse.json(
          { message: 'Invalid stock account or account does not belong to user' },
          { status: 400 }
        );
      }
    }

    // Process transaction with new cost basis system
    let calculatedPl = null;
    let purchaseLot = null;

    try {
      if (type === 'BUY') {
        // Tạo lô mua mới
        purchaseLot = await processBuyTransaction(
          session.user.id,
          finalStockAccountId,
          ticker,
          quantity,
          price,
          fee,
          transactionDate
        );
        
        // Với giao dịch mua, P/L = 0
        calculatedPl = 0;
      } else if (type === 'SELL') {
        // Xử lý giao dịch bán với FIFO nghiêm ngặt
        const sellResult = await processSellTransaction(
          session.user.id,
          finalStockAccountId,
          ticker,
          quantity,
          price,
          fee,
          taxRate,
          transactionDate
        );
        
        calculatedPl = sellResult.profitOrLoss;
      }
    } catch (costBasisError) {
      return NextResponse.json(
        { message: 'Error processing cost basis: ' + costBasisError.message },
        { status: 400 }
      );
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        stockAccountId: finalStockAccountId,
        ticker: ticker.toUpperCase(),
        type,
        quantity,
        price,
        transactionDate: new Date(transactionDate),
        fee,
        taxRate,
        calculatedPl,
        notes,
      }
    });

    // Manually add stockAccount information to the created transaction
    const stockAccount = await prisma.stockAccount.findFirst({
      where: { id: stockAccountId },
      select: {
        id: true,
        name: true,
        brokerName: true
      }
    });

    const transactionWithStockAccount = {
      ...transaction,
      StockAccount: stockAccount || null
    };

    // Clear relevant cache entries when adding new transactions
    transactionCache.clear(); // Clear all cache since new transaction affects multiple queries

    return NextResponse.json(transactionWithStockAccount, { status: 201 });
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      userId: session?.user?.id,
      endpoint: 'POST /api/transactions',
      userAgent: request.headers.get('user-agent')
    });
    
    const sanitizedError = sanitizeError(error);
    return NextResponse.json(
      { 
        message: sanitizedError.message,
        code: sanitizedError.code
      },
      { status: sanitizedError.status }
    );
  }
}
