import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

// Use singleton pattern for Prisma to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Cache for account fees with TTL
const accountFeesCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET - Fetch account fees with filtering and pagination
export async function GET(request) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const feeType = searchParams.get('feeType');
    const stockAccountId = searchParams.get('stockAccountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const sortBy = searchParams.get('sortBy') || 'feeDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search'); // Search in description
    
    // Extract pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Create cache key
    const cacheKey = JSON.stringify({
      userId: session.user.id,
      feeType, stockAccountId, dateFrom, dateTo, minAmount, maxAmount,
      sortBy, sortOrder, search, page, pageSize
    });
    
    // Check cache first
    const cachedResult = accountFeesCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp > Date.now() - CACHE_TTL) {
      console.log(`[Account Fees API] Cache hit - ${Date.now() - startTime}ms`);
      return NextResponse.json(cachedResult.data);
    }
    
    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;
    
    // Build where clause
    let whereClause = {
      userId: session.user.id,
      isActive: true
    };
    
    // Apply filters
    if (feeType) {
      whereClause.feeType = feeType;
    }
    
    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }
    
    if (dateFrom || dateTo) {
      whereClause.feeDate = {};
      if (dateFrom) {
        whereClause.feeDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.feeDate.lte = new Date(dateTo);
      }
    }
    
    if (minAmount || maxAmount) {
      whereClause.amount = {};
      if (minAmount) {
        whereClause.amount.gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        whereClause.amount.lte = parseFloat(maxAmount);
      }
    }
    
    if (search) {
      whereClause.description = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Build order clause
    let orderBy = {};
    orderBy[sortBy] = sortOrder;
    
    // Fetch account fees with pagination
    const [accountFees, totalCount] = await Promise.all([
      prisma.accountFee.findMany({
        where: whereClause,
        include: {
          stockAccount: {
            select: {
              name: true,
              brokerName: true
            }
          }
        },
        orderBy,
        skip,
        take: pageSize
      }),
      prisma.accountFee.count({
        where: whereClause
      })
    ]);
    
    // Calculate summary statistics
    const summaryStats = await prisma.accountFee.groupBy({
      by: ['feeType'],
      where: whereClause,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const result = {
      accountFees,
      totalCount,
      page,
      pageSize,
      totalPages,
      summaryStats,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
    
    // Cache the result
    accountFeesCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log(`[Account Fees API] Completed in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching account fees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch account fees' },
      { status: 500 }
    );
  }
}

// POST - Create new account fee
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const { stockAccountId, feeType, amount, feeDate } = body;
    
    if (!stockAccountId) {
      return NextResponse.json(
        { message: 'Stock account ID is required' },
        { status: 400 }
      );
    }
    
    if (!feeType) {
      return NextResponse.json(
        { message: 'Fee type is required' },
        { status: 400 }
      );
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    if (!feeDate) {
      return NextResponse.json(
        { message: 'Fee date is required' },
        { status: 400 }
      );
    }
    
    // Verify stock account belongs to user
    const stockAccount = await prisma.stockAccount.findFirst({
      where: {
        id: stockAccountId,
        userId: session.user.id
      }
    });
    
    if (!stockAccount) {
      return NextResponse.json(
        { message: 'Stock account not found' },
        { status: 404 }
      );
    }
    
    // Create account fee
    const accountFee = await prisma.accountFee.create({
      data: {
        userId: session.user.id,
        stockAccountId,
        feeType,
        amount: parseFloat(amount),
        description: body.description || null,
        feeDate: new Date(feeDate),
        referenceNumber: body.referenceNumber || null,
        attachmentUrl: body.attachmentUrl || null
      },
      include: {
        stockAccount: {
          select: {
            name: true,
            brokerName: true
          }
        }
      }
    });
    
    // Clear cache
    accountFeesCache.clear();
    
    return NextResponse.json(accountFee, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account fee:', error);
    return NextResponse.json(
      { message: 'Failed to create account fee' },
      { status: 500 }
    );
  }
} 