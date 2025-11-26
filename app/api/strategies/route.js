import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../lib/database.js';
import { authOptions } from '../auth/[...nextauth]/route';
import { serverLogger as logger } from '../../lib/server-logger';
import { sanitizeError, secureLog } from '../../lib/error-handler';

// Use a singleton Prisma instance to avoid connection overhead
const prisma = db;

// Strategies cache with TTL
const strategiesCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GET - Fetch all strategies
export async function GET(request) {
  const startTime = performance.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10); // Default to 50 items per page
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Create a cache key
    const cacheKey = `strategies-${page}-${limit}`;
    
    // Check cache first
    const cachedData = strategiesCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      logger.info(`Strategies cache hit for page ${page}, limit ${limit}`);
      const endTime = performance.now();
      logger.info(`Strategies API (cached) completed in ${Math.round(endTime - startTime)}ms`);
      return NextResponse.json(cachedData.data);
    }
    
    logger.info(`Strategies cache miss for page ${page}, limit ${limit}`);
    
    // Run two queries in parallel for better performance
    const [strategies, totalCount] = await Promise.all([
      // Query 1: Get paginated strategies
      prisma.strategy.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              // KHÔNG select passwordHash!
            }
          }
        }
      }),
      
      // Query 2: Count total strategies for pagination metadata
      prisma.strategy.count()
    ]);
    
    const dbTime = performance.now();
    logger.info(`Strategies DB query completed in ${Math.round(dbTime - startTime)}ms`);
    
    // Format the response
    const result = {
      strategies,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
    
    // Cache the result
    strategiesCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    // Also cache first page results separately for common requests
    if (page === 1 && limit === 50) {
      strategiesCache.set('strategies-latest', {
        data: { strategies: strategies.slice(0, 10) }, // Cache just the first 10 for homepage
        timestamp: Date.now()
      });
    }
    
    const endTime = performance.now();
    logger.info(`Strategies API completed in ${Math.round(endTime - startTime)}ms`);

    return NextResponse.json(result);
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      userId: session?.user?.id,
      endpoint: 'GET /api/strategies',
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

// POST - Create a new strategy
export async function POST(request) {
  const startTime = performance.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { message: 'Strategy content is required' },
        { status: 400 }
      );
    }

    // Create the strategy
    const strategy = await prisma.strategy.create({
      data: {
        title: title || null, // Handle empty title
        content,
        userId: session.user.id,
      },
    });
    
    // Invalidate cache after creating a new strategy
    for (const key of strategiesCache.keys()) {
      if (key.startsWith('strategies-')) {
        strategiesCache.delete(key);
      }
    }
    
    const endTime = performance.now();
    logger.info(`Strategy creation completed in ${Math.round(endTime - startTime)}ms`);

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    // SECURITY FIX: Use secure logging and sanitized error responses
    secureLog(error, {
      userId: session?.user?.id,
      endpoint: 'POST /api/strategies',
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