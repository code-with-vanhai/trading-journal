import { PrismaClient } from '@prisma/client';

// Create Prisma client with optimized connection settings for Supabase
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '&connection_limit=3&pool_timeout=20'
      }
    }
  });
};

// Global Prisma instance
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || createPrismaClient();
export const prisma = globalForPrisma.prisma;

// Retry function with exponential backoff for P1001 errors
export async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (error.code === 'P1001' && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`[Database] Connection failed, retrying in ${delay}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Utility to limit concurrent operations to prevent connection pool exhaustion
export async function limitConcurrency(operations, limit = 2) {
  const results = [];
  for (let i = 0; i < operations.length; i += limit) {
    const batch = operations.slice(i, i + limit);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    // Small delay between batches
    if (i + limit < operations.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  return results;
}

// Enhanced error handler for database operations
export function handleDatabaseError(error, context = {}) {
  if (error.code === 'P1001') {
    console.error('[CRITICAL] Database connection lost:', {
      timestamp: new Date().toISOString(),
      context,
      error: error.message
    });
  }
  
  return error;
}

export default prisma;