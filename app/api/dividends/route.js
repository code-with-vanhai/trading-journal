import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { sanitizeError, secureLog } from '../../lib/error-handler';

// Import dividend processor functions
const dividendProcessor = require('../../lib/dividend-processor');
const costBasisAdjuster = require('../../lib/cost-basis-adjuster');

/**
 * GET /api/dividends - Lấy danh sách dividend adjustments
 * Query params: 
 * - ticker: Mã cổ phiếu (optional)
 * - stockAccountId: ID tài khoản (optional)
 * - adjustmentType: Loại adjustment (optional)
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const stockAccountId = searchParams.get('stockAccountId');
    const adjustmentType = searchParams.get('adjustmentType');

    console.log(`📋 Getting dividend adjustments for user ${session.user.id}`);

    // Import Prisma client
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Build where clause
      const whereClause = {
        userId: session.user.id,
        isActive: true
      };

      if (ticker) {
        whereClause.ticker = ticker.toUpperCase();
      }
      if (stockAccountId) {
        whereClause.stockAccountId = stockAccountId;
      }
      if (adjustmentType) {
        whereClause.adjustmentType = adjustmentType;
      }

      // Get adjustments with related data
      const adjustments = await prisma.costBasisAdjustment.findMany({
        where: whereClause,
        include: {
          stockAccount: {
            select: { id: true, name: true, brokerName: true }
          }
        },
        orderBy: [
          { eventDate: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      console.log(`✅ Found ${adjustments.length} dividend adjustments`);

      return NextResponse.json({
        success: true,
        data: adjustments,
        count: adjustments.length
      });

    } finally {
      await prisma.$disconnect();
    }

  } catch (error) {
    console.error('❌ Error fetching dividend adjustments:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: sanitizeError(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dividends - Tạo dividend adjustment mới
 * Body: {
 *   adjustmentType: 'CASH_DIVIDEND' | 'STOCK_DIVIDEND' | 'STOCK_SPLIT',
 *   ticker: string,
 *   stockAccountId: string,
 *   eventDate: string,
 *   dividendPerShare?: number,
 *   taxRate?: number,
 *   stockDividendRatio?: number,
 *   splitRatio?: number,
 *   description?: string,
 *   externalRef?: string
 * }
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      adjustmentType,
      ticker,
      stockAccountId,
      eventDate,
      dividendPerShare,
      taxRate = 0.05,
      stockDividendRatio,
      splitRatio,
      description,
      externalRef
    } = body;

    console.log(`🔄 Creating ${adjustmentType} adjustment for ${ticker}`);

    // Validation
    if (!adjustmentType || !ticker || !stockAccountId || !eventDate) {
      return NextResponse.json(
        { message: 'Missing required fields: adjustmentType, ticker, stockAccountId, eventDate' },
        { status: 400 }
      );
    }

    // Validate adjustment type specific data
    try {
      dividendProcessor.validateAdjustmentData(adjustmentType, {
        dividendPerShare,
        taxRate,
        stockDividendRatio,
        splitRatio
      });
    } catch (validationError) {
      return NextResponse.json(
        { message: 'Validation error', error: validationError.message },
        { status: 400 }
      );
    }

    let result;

    try {
      // Process different types of adjustments
      switch (adjustmentType) {
        case 'CASH_DIVIDEND':
          result = await dividendProcessor.handleCashDividend(
            session.user.id,
            stockAccountId,
            ticker,
            dividendPerShare,
            eventDate,
            taxRate,
            description,
            externalRef
          );
          break;

        case 'STOCK_DIVIDEND':
          result = await dividendProcessor.handleStockDividend(
            session.user.id,
            stockAccountId,
            ticker,
            stockDividendRatio,
            eventDate,
            description,
            externalRef
          );
          break;

        case 'STOCK_SPLIT':
          result = await dividendProcessor.handleStockSplit(
            session.user.id,
            stockAccountId,
            ticker,
            splitRatio,
            eventDate,
            description,
            externalRef
          );
          break;

        default:
          return NextResponse.json(
            { message: `Unsupported adjustment type: ${adjustmentType}` },
            { status: 400 }
          );
      }

      console.log(`✅ ${adjustmentType} adjustment created successfully`);

      return NextResponse.json({
        success: true,
        message: `${adjustmentType} adjustment created successfully`,
        data: result
      });

    } catch (processingError) {
      console.error(`❌ Error processing ${adjustmentType}:`, processingError);
      
      // Return specific error messages
      if (processingError.message.includes('Không tìm thấy lô mua')) {
        return NextResponse.json(
          { message: 'No purchase lots found for this stock in the account' },
          { status: 404 }
        );
      }
      
      throw processingError;
    }

  } catch (error) {
    console.error('❌ Error creating dividend adjustment:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: sanitizeError(error) },
      { status: 500 }
    );
  }
} 