import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../../lib/database.js';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = db;

// GET - Fetch strategies created by the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get user strategies, ordered by most recent first
    const strategies = await prisma.strategy.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Error fetching user strategies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch strategies', error: error.message },
      { status: 500 }
    );
  }
} 