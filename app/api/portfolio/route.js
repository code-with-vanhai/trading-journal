import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import logger from '../../lib/production-logger.js';
import portfolioService from '../../services/PortfolioService.js';
import { withSecurity } from '../../lib/api-middleware.js';

const getPortfolioHandler = async (request) => {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const options = {
      stockAccountId: searchParams.get('stockAccountId'),
      includeAdjustments: searchParams.get('includeAdjustments') === 'true',
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
      sortBy: searchParams.get('sortBy') || 'totalCost',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      includeMarketData: searchParams.get('includeMarketData') !== 'false',
      includeMetrics: searchParams.get('includeMetrics') !== 'false'
    };
    
    // Use portfolio service
    const result = await portfolioService.getPortfolio(userId, options);
    
    return NextResponse.json(result);
  } catch (error) {
    if (error.isServiceError) {
      return NextResponse.json({ 
        error: error.code,
        message: error.message 
      }, { status: 400 });
    }
    
    logger.error('Portfolio API error', { error: error.message, stack: error.stack });
    return NextResponse.json({ 
      error: 'PORTFOLIO_FETCH_FAILED',
      message: 'Failed to fetch portfolio data' 
    }, { status: 500 });
  }
};

// Apply security middleware
export const GET = withSecurity(getPortfolioHandler); 