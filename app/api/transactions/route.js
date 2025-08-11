import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { sanitizeError, secureLog } from '../../lib/error-handler';
import db from '../../lib/database.js';
import transactionService from '../../services/TransactionService.js';
import { withSecurity } from '../../lib/api-middleware.js';
import logger from '../../lib/production-logger.js';
import { processBuyTransaction, processSellTransaction } from '../../lib/cost-basis-calculator-wrapper.js';

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
    const result = await db.accountFee.aggregate({
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

// Prisma client is now imported from db-with-retry.js with connection pool management

// Import enhanced query optimizer
import enhancedOptimizer from '../../lib/enhanced-query-optimizer.js';

// Legacy calculateProfitLoss function - replaced by new FIFO system
// const calculateProfitLoss = async (userId, stockAccountId, ticker, quantity, sellPrice, fee, taxRate) => {
//   // Old logic has been replaced by processSellTransaction in cost-basis-calculator.js
//   return 0;
// };

// GET - Fetch all transactions for current user with filtering and pagination
const getTransactionsHandler = async (request) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const filters = {
      ticker: searchParams.get('ticker'),
      type: searchParams.get('type'),
      stockAccountId: searchParams.get('stockAccountId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      minAmount: searchParams.get('minAmount'),
      maxAmount: searchParams.get('maxAmount'),
    };
    
    // Extract pagination parameters
    const pagination = {
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
      sortBy: searchParams.get('sortBy') || 'transactionDate',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    };
    
    // Use transaction service
    const result = await transactionService.getTransactions(
      session.user.id,
      filters,
      pagination
    );
    
    return NextResponse.json(result);
  } catch (error) {
    if (error.isServiceError) {
      return NextResponse.json({ 
        error: error.code,
        message: error.message 
      }, { status: 400 });
    }
    
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
};

// POST - Create a new transaction
async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify user exists in database to prevent foreign key constraint violations
    const userExists = await db.user.findUnique({
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
      let stockAccounts = await db.stockAccount.findMany({
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
        
        const defaultAccount = await db.stockAccount.create({
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
      const stockAccount = await db.stockAccount.findFirst({
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
    const transaction = await db.transaction.create({
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
    const stockAccount = await db.stockAccount.findFirst({
      where: { id: finalStockAccountId },
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

    // Invalidate relevant cache entries when adding new transactions
    transactionService.invalidateRelatedCaches(session.user.id, { ticker });

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

// Apply security middleware to exports
export const GET = withSecurity(getTransactionsHandler);
// Keep POST as is for now since we have complex logic - can refactor later
export { POST };
