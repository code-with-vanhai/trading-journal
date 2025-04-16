import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Calculate profit/loss for a SELL transaction
const calculateProfitLoss = async (userId, ticker, quantity, sellPrice, fee, taxRate) => {
  // Get all BUY transactions for this ticker, ordered by date (FIFO method)
  const buyTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      ticker,
      type: 'BUY',
    },
    orderBy: {
      transactionDate: 'asc',
    },
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
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const ticker = searchParams.get('ticker');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'transactionDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build where clause
    const whereClause = {
      userId: session.user.id,
    };
    
    // Apply filters if provided
    if (ticker) {
      whereClause.ticker = {
        contains: ticker.toUpperCase()
      };
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    // Date range filter
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

    // Validate sort field - only allow sorting on valid fields
    const validSortFields = [
      'transactionDate', 'ticker', 'type', 'quantity', 
      'price', 'calculatedPl', 'fee', 'taxRate'
    ];
    
    const orderBy = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder.toLowerCase();
    } else {
      orderBy.transactionDate = 'desc'; // Default sort
    }

    // First get total count for pagination
    const totalCount = await prisma.transaction.count({
      where: whereClause,
    });

    // Then get transactions with filtering, sorting, and pagination
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy,
      include: {
        journalEntry: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: pageSize,
    });

    return NextResponse.json({
      transactions,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    });
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
    const { ticker, type, quantity, price, transactionDate, fee = 0, taxRate = 0, notes } = body;

    // Validate required fields
    if (!ticker || !type || !quantity || !price || !transactionDate) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate P/L for SELL transactions
    let calculatedPl = null;
    if (type === 'SELL') {
      calculatedPl = await calculateProfitLoss(
        session.user.id,
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
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to create transaction', error: error.message },
      { status: 500 }
    );
  }
}
