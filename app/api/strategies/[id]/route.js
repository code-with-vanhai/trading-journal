import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../../lib/database.js';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = db;

// DELETE - Delete a strategy by ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // Check if strategy exists and belongs to the current user
    const strategy = await prisma.strategy.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!strategy) {
      return NextResponse.json({ message: 'Strategy not found' }, { status: 404 });
    }

    if (strategy.userId !== session.user.id) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this strategy' },
        { status: 403 }
      );
    }

    // Delete the strategy
    await prisma.strategy.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Strategy deleted successfully' });
  } catch (error) {
    console.error('Error deleting strategy:', error);
    return NextResponse.json(
      { message: 'Failed to delete strategy', error: error.message },
      { status: 500 }
    );
  }
} 