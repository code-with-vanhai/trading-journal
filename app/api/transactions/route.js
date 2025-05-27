import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

// Create a single Prisma instance with query logging in development
const globalForPrisma = global;

// Enable query logging in development to help debug slow queries
const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  return prisma;
};

globalForPrisma.prisma = globalForPrisma.prisma || prismaClientSingleton();
const prisma = globalForPrisma.prisma;

// Improved LRU cache with larger TTL for better performance
const transactionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL for better hit ratio

// Calculate profit/loss for a SELL transaction
const calculateProfitLoss = async (userId, stockAccountId, ticker, quantity, sellPrice, fee, taxRate) => {
  // Get all BUY transactions for this ticker in the same stock account, ordered by date (FIFO method)
  // Using a more efficient query with only required fields
  const buyTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      stockAccountId, // Only consider transactions from the same stock account
      ticker,
      type: 'BUY',
    },
    orderBy: {
      transactionDate: 'asc',
    },
    select: {
      quantity: true,
      price: true,
    }
  });
  
  if (buyTransactions.length === 0) {
    return 0; // No buy transactions found
  }
  
  let remainingQuantity = quantity;
  let totalCost = 0;
  
  // Calculate cost basis using FIFO method
  for (const buyTx of buyTransactions) {
    if (remainingQuantity <= 0) break;
    
    const quantityToUse = Math.min(remainingQuantity, buyTx.quantity);
    totalCost += quantityToUse * buyTx.price;
    remainingQuantity -= quantityToUse;
  }
  
  // If we couldn't find enough BUY transactions
  if (remainingQuantity > 0) {
    return 0; // Not enough buy transactions to calculate P/L
  }
  
  // Calculate gross profit
  const grossProfit = (sellPrice * quantity) - totalCost;
  
  // Subtract fees
  const netProfit = grossProfit - fee;
  
  // Apply tax (if applicable)
  const afterTaxProfit = netProfit > 0 
    ? netProfit * (1 - (taxRate / 100)) 
    : netProfit;
  
  return afterTaxProfit;
};

// GET - Fetch all transactions for current user with filtering and pagination
export async function GET(request) {
  try {
    const startTime = Date.now();
    const session = await getServerSession(authOptions);
    
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
    
    // Check cache first
    const cachedResult = transactionCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp > Date.now() - CACHE_TTL) {
      console.log(`[Transactions API] Cache hit - ${Date.now() - startTime}ms`);
      return NextResponse.json(cachedResult.data);
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build where clause - more efficient with better index utilization
    let whereClause = {
      userId: session.user.id,
    };

    // Apply primary filters first (using indexed fields)
    if (type) {
      whereClause.type = type;
    }
    
    // Stock account filter
    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }
    
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
        endDate.setHours(23, 59, 59, 999); // End of the day
        whereClause.transactionDate.lte = endDate;
      }
    }
    
    // Price range filter - apply after indexed fields
    if (minAmount || maxAmount) {
      whereClause.price = {};
      
      if (minAmount) {
        whereClause.price.gte = parseFloat(minAmount);
      }
      
      if (maxAmount) {
        whereClause.price.lte = parseFloat(maxAmount);
      }
    }

    // Validate sort field - only allow sorting on valid fields
    const validSortFields = [
      'transactionDate', 'ticker', 'type', 'quantity', 
      'price', 'calculatedPl', 'fee', 'taxRate'
    ];
    
    // Format orderBy for Prisma - must be formatted as key with value object
    let orderBy = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase();
    } else {
      orderBy.transactionDate = 'desc'; // Default sort
    }
    
    // Add a secondary sort by id to ensure consistent ordering
    if (sortBy !== 'id') {
      // Fix: Prisma expects a specific format for orderBy when using multiple fields
      orderBy = [
        { [Object.keys(orderBy)[0]]: Object.values(orderBy)[0] },
        { id: 'desc' }
      ];
    }

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
      
      if (cachedRecent && cachedRecent.timestamp > Date.now() - CACHE_TTL) {
        console.log(`[Transactions API] Recent cache hit - ${Date.now() - startTime}ms`);
        return NextResponse.json(cachedRecent.data);
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
            StockAccount: { // Include stock account details
              select: {
                id: true,
                name: true,
                brokerName: true
              }
            },
            journalEntry: {
              select: {
                id: true
              }
            }
          },
          orderBy: [
            { transactionDate: 'desc' },
            { id: 'desc' }
          ],
          take: pageSize
        });
        
        // Format the results to match the expected structure
        const formattedTransactions = transactions.map(tx => ({
          ...tx,
          journalEntry: tx.journalEntry ? { id: tx.journalEntry.id } : null
        }));
      
        // Get count with a simple query
        const totalCount = await prisma.transaction.count({
          where: { userId: session.user.id }
        });
        
        const result = {
          transactions: formattedTransactions,
          totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        };
        
        // Cache the result with the recent key
        transactionCache.set(recentCacheKey, {
          data: result,
          timestamp: Date.now()
        });
        
        console.log(`[Transactions API] Optimized fetch completed in ${Date.now() - startTime}ms`);
        return NextResponse.json(result);
      } catch (optimizedQueryError) {
        console.error('Error in optimized query path:', optimizedQueryError);
        // Fall through to standard query path if optimized path fails
      }
    }

    // For non-common requests, use the regular approach with Promise.all for parallel execution
    const [totalCount, transactions] = await Promise.all([
      prisma.transaction.count({
        where: whereClause,
      }),
      prisma.transaction.findMany({
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
          StockAccount: { // Include stock account details
            select: {
              id: true,
              name: true,
              brokerName: true
            }
          },
          journalEntry: {
            select: {
              id: true,
            },
          },
        },
        skip,
        take: pageSize,
      })
    ]);

    const result = {
      transactions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
    
    // Cache the result
    transactionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Clean up old cache entries periodically
    if (Math.random() < 0.05) { // 5% chance to clean up on each request
      const now = Date.now();
      for (const [key, value] of transactionCache.entries()) {
        if (value.timestamp <= now - CACHE_TTL) {
          transactionCache.delete(key);
        }
      }
    }
    
    console.log(`[Transactions API] Fetch completed in ${Date.now() - startTime}ms`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transactions', error: error.message },
      { status: 500 }
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

    // Calculate P/L for SELL transactions
    let calculatedPl = null;
    if (type === 'SELL') {
      calculatedPl = await calculateProfitLoss(
        session.user.id,
        finalStockAccountId, // Pass stockAccountId to calculate P/L within the same account
        ticker,
        quantity,
        price,
        fee,
        taxRate
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
      },
      include: {
        stockAccount: {
          select: {
            id: true,
            name: true,
            brokerName: true
          }
        }
      }
    });

    // Clear relevant cache entries when adding new transactions
    for (const [key, _] of transactionCache.entries()) {
      if (key.includes(session.user.id)) {
        transactionCache.delete(key);
      }
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to create transaction', error: error.message },
      { status: 500 }
    );
  }
}
