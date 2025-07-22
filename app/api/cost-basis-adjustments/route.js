import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Fetch cost basis adjustments with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const ticker = searchParams.get('ticker');
    const adjustmentType = searchParams.get('adjustmentType');
    const isActive = searchParams.get('isActive');
    
    // Build where clause
    let whereClause = {
      userId: session.user.id,
    };

    if (ticker) {
      whereClause.ticker = {
        contains: ticker.toUpperCase()
      };
    }

    if (adjustmentType) {
      whereClause.adjustmentType = adjustmentType;
    }
    
    if (isActive !== '' && isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }
    
    console.log('[Cost Basis Adjustments API] Fetching adjustments with filters:', whereClause);
    
    // Fetch adjustments
    const adjustments = await prisma.costBasisAdjustment.findMany({
      where: whereClause,
      orderBy: [
        { eventDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    console.log(`[Cost Basis Adjustments API] Found ${adjustments.length} adjustments`);
    
    return NextResponse.json({
      adjustments,
      totalCount: adjustments.length
    });

  } catch (error) {
    console.error('Cost Basis Adjustments API Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message,
        adjustments: []
      },
      { status: 500 }
    );
  }
} 