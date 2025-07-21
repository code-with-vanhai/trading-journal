import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

// Use singleton pattern for Prisma to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Cache for summary data with TTL
const summaryCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// GET - Fetch comprehensive account fees summary
export async function GET(request) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const stockAccountId = searchParams.get('stockAccountId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const feeType = searchParams.get('feeType');
    
    // Create cache key
    const cacheKey = JSON.stringify({
      userId: session.user.id,
      stockAccountId,
      dateFrom,
      dateTo,
      feeType
    });
    
    // Check cache first
    const cachedResult = summaryCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp > Date.now() - CACHE_TTL) {
      console.log(`[Account Fees Summary API] Cache hit - ${Date.now() - startTime}ms`);
      return NextResponse.json(cachedResult.data);
    }
    
    // Build where clause
    let whereClause = {
      userId: session.user.id,
      isActive: true
    };
    
    // Apply filters
    if (stockAccountId) {
      whereClause.stockAccountId = stockAccountId;
    }
    
    if (feeType) {
      whereClause.feeType = feeType;
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
    
    // Get comprehensive statistics
    const [
      totalSummary,
      feeTypeSummary,
      accountSummary,
      monthlySummary,
      recentFees
    ] = await Promise.all([
      // Total summary
      prisma.accountFee.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          amount: true
        }
      }),
      
      // Summary by fee type
      prisma.accountFee.groupBy({
        by: ['feeType'],
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        }
      }),
      
      // Summary by stock account
      prisma.accountFee.groupBy({
        by: ['stockAccountId'],
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          amount: true
        },
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        }
      }),
      
      // Monthly summary (last 12 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "feeDate") as month,
          SUM(amount) as total_amount,
          COUNT(id) as total_count,
          AVG(amount) as avg_amount
        FROM "AccountFee"
        WHERE "userId" = ${session.user.id}
          AND "isActive" = true
          AND "feeDate" >= NOW() - INTERVAL '12 months'
          ${stockAccountId ? `AND "stockAccountId" = ${stockAccountId}` : ''}
          ${feeType ? `AND "feeType" = ${feeType}` : ''}
        GROUP BY DATE_TRUNC('month', "feeDate")
        ORDER BY month DESC
      `,
      
      // Recent fees (last 10)
      prisma.accountFee.findMany({
        where: whereClause,
        orderBy: {
          feeDate: 'desc'
        },
        take: 10
      })
    ]);
    
    // Enrich account summary with account details
    const accountIds = accountSummary.map(acc => acc.stockAccountId);
    const stockAccounts = await prisma.stockAccount.findMany({
      where: {
        id: {
          in: accountIds
        }
      },
      select: {
        id: true,
        name: true,
        brokerName: true
      }
    });
    
    // Map account details to summary
    const enrichedAccountSummary = accountSummary.map(acc => {
      const accountDetails = stockAccounts.find(sa => sa.id === acc.stockAccountId);
      return {
        ...acc,
        accountDetails
      };
    });
    
    // Calculate trend data (compare current period vs previous period)
    let trendData = null;
    if (dateFrom && dateTo) {
      const periodLength = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
      const previousPeriodEnd = new Date(dateFrom);
      const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodLength);
      
      const previousPeriodSummary = await prisma.accountFee.aggregate({
        where: {
          ...whereClause,
          feeDate: {
            gte: previousPeriodStart,
            lte: previousPeriodEnd
          }
        },
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });
      
      const currentTotal = totalSummary._sum.amount || 0;
      const previousTotal = previousPeriodSummary._sum.amount || 0;
      const currentCount = totalSummary._count || 0;
      const previousCount = previousPeriodSummary._count || 0;
      
      trendData = {
        currentPeriod: {
          totalAmount: currentTotal,
          totalCount: currentCount
        },
        previousPeriod: {
          totalAmount: previousTotal,
          totalCount: previousCount
        },
        changes: {
          amountChange: currentTotal - previousTotal,
          amountChangePercent: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
          countChange: currentCount - previousCount,
          countChangePercent: previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0
        }
      };
    }
    
    const result = {
      totalSummary: {
        totalAmount: totalSummary._sum.amount || 0,
        totalCount: totalSummary._count || 0,
        averageAmount: totalSummary._avg.amount || 0
      },
      feeTypeSummary: feeTypeSummary.map(item => ({
        feeType: item.feeType,
        totalAmount: item._sum.amount || 0,
        totalCount: item._count || 0,
        averageAmount: item._avg.amount || 0
      })),
      accountSummary: enrichedAccountSummary.map(item => ({
        stockAccountId: item.stockAccountId,
        accountDetails: item.accountDetails,
        totalAmount: item._sum.amount || 0,
        totalCount: item._count || 0,
        averageAmount: item._avg.amount || 0
      })),
      monthlySummary: monthlySummary.map(item => ({
        month: item.month,
        totalAmount: parseFloat(item.total_amount) || 0,
        totalCount: parseInt(item.total_count) || 0,
        averageAmount: parseFloat(item.avg_amount) || 0
      })),
      recentFees,
      trendData
    };
    
    // Cache the result
    summaryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log(`[Account Fees Summary API] Completed in ${Date.now() - startTime}ms`);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error fetching account fees summary:', error);
    return NextResponse.json(
      { message: 'Failed to fetch account fees summary' },
      { status: 500 }
    );
  }
} 