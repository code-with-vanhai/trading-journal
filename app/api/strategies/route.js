import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Fetch all strategies
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all strategies with user info, ordered by most recent first
    const strategies = await prisma.strategy.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Error fetching strategies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch strategies', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new strategy
export async function POST(request) {
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

    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    console.error('Error creating strategy:', error);
    return NextResponse.json(
      { message: 'Failed to create strategy', error: error.message },
      { status: 500 }
    );
  }
} 