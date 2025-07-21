import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { serverLogger as logger } from '../../../lib/server-logger';

// Use a singleton Prisma instance to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Latest strategies cache with TTL
const latestCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes for homepage data

// GET - Fetch just the latest few strategies for homepage
export async function GET(request) {
  const startTime = performance.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3', 10); // Default to 3 items for homepage
    
    // Create a cache key
    const cacheKey = `latest-${limit}`;
    
    // Check cache first
    const cachedData = latestCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      logger.info(`Latest strategies cache hit for limit ${limit}`);
      const endTime = performance.now();
      logger.info(`Latest strategies API (cached) completed in ${Math.round(endTime - startTime)}ms`);
      return NextResponse.json(cachedData.data);
    }
    
    logger.info(`Latest strategies cache miss for limit ${limit}`);
    
    // Get just the latest strategies
    const strategies = await prisma.strategy.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
    
    const endTime = performance.now();
    logger.info(`Latest strategies query completed in ${Math.round(endTime - startTime)}ms`);
    
    // Cache the result
    latestCache.set(cacheKey, {
      data: strategies,
      timestamp: Date.now()
    });
    
    return NextResponse.json(strategies);
  } catch (error) {
    logger.error('Error fetching latest strategies:', { error: error.message, stack: error.stack });
    console.error('Error fetching latest strategies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch latest strategies', error: error.message },
      { status: 500 }
    );
  }
} 