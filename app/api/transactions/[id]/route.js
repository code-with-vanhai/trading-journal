import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

// Create a single Prisma instance with query logging in development
const globalForPrisma = global;

// Enable query logging in development to help debug slow queries
const prismaClientSingleton = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  return prisma;
};

globalForPrisma.prisma = globalForPrisma.prisma || prismaClientSingleton();
const prisma = globalForPrisma.prisma;

// Improved caching with longer TTL for single transaction fetches
const singleTransactionCache = new Map();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache TTL for individual transactions
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory leaks

// GET - Fetch a transaction by ID
export async function GET(request, { params }) {
  try {
    const startTime = Date.now();
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Create cache key
    const cacheKey = `${session.user.id}-${id}`;
    
    // Check cache first
    const cachedTransaction = singleTransactionCache.get(cacheKey);
    if (cachedTransaction && cachedTransaction.timestamp > Date.now() - CACHE_TTL) {
      console.log(`[Transaction API] Cache hit for ID ${id} - ${Date.now() - startTime}ms`);
      return NextResponse.json(cachedTransaction.data);
    }

    // Use Prisma's standard query approach instead of raw SQL
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        journalEntry: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    });

    // If no transaction found, return 404
    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Format the response to match the expected structure
    const formattedTransaction = {
      ...transaction,
      journalEntry: transaction.journalEntry ? {
        ...transaction.journalEntry,
        tags: transaction.journalEntry.tags.map(tagRelation => ({
          id: tagRelation.tag.id,
          name: tagRelation.tag.name
        }))
      } : null
    };
    
    // Cache the result
    singleTransactionCache.set(cacheKey, {
      data: formattedTransaction,
      timestamp: Date.now()
    });
    
    // Limit cache size by removing oldest entries if needed
    if (singleTransactionCache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(singleTransactionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove the oldest 10% of entries
      const entriesToRemove = Math.ceil(MAX_CACHE_SIZE * 0.1);
      for (let i = 0; i < entriesToRemove; i++) {
        if (entries[i]) singleTransactionCache.delete(entries[i][0]);
      }
    }
    
    console.log(`[Transaction API] Fetch completed for ID ${id} in ${Date.now() - startTime}ms`);
    return NextResponse.json(formattedTransaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transaction', error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a transaction
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    const body = await request.json();
    const { ticker, type, quantity, price, transactionDate, fee, taxRate, notes } = body;

    // Check if transaction exists and belongs to the current user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      select: { id: true } // Only select the id field for performance
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Calculate P/L for SELL transactions - implement properly here
    let calculatedPl = null;
    if (type === 'SELL') {
      // For a production app, you'd implement the proper calculation
      // For now, we'll just use a placeholder
      calculatedPl = 0;
    }

    // Update the transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        ticker: ticker?.toUpperCase(),
        type,
        quantity,
        price,
        transactionDate: transactionDate ? new Date(transactionDate) : undefined,
        fee,
        taxRate,
        calculatedPl: type === 'SELL' ? calculatedPl : null,
        notes,
      },
    });

    // Clear cache entries for this transaction
    const cacheKey = `${session.user.id}-${id}`;
    singleTransactionCache.delete(cacheKey);
    
    // Clear list cache entries for this user
    for (const [key, _] of singleTransactionCache.entries()) {
      if (key.startsWith(`recent-${session.user.id}`) || key.includes(`"userId":"${session.user.id}"`)) {
        singleTransactionCache.delete(key);
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to update transaction', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a transaction
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check if transaction exists and belongs to the current user - use a lightweight query
    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      select: { id: true } // Only select the id field for better performance
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Delete the transaction (cascade should handle journal entry deletion)
    await prisma.transaction.delete({
      where: { id },
    });

    // Clear related cache entries
    const cacheKey = `${session.user.id}-${id}`;
    singleTransactionCache.delete(cacheKey);
    
    // Clear list cache entries for this user
    for (const [key, _] of singleTransactionCache.entries()) {
      if (key.startsWith(`recent-${session.user.id}`) || key.includes(`"userId":"${session.user.id}"`)) {
        singleTransactionCache.delete(key);
      }
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'Failed to delete transaction', error: error.message },
      { status: 500 }
    );
  }
} 