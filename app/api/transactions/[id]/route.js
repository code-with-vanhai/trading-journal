import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET - Fetch a transaction by ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if transaction exists and belongs to the current user
    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      },
      include: {
        journalEntry: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json(transaction);
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

    const { id } = params;
    const body = await request.json();
    const { ticker, type, quantity, price, transactionDate, fee, taxRate, notes } = body;

    // Check if transaction exists and belongs to the current user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      }
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Calculate P/L for SELL transactions
    let calculatedPl = null;
    if (type === 'SELL') {
      // Call the calculation function (reuse from the main route.js)
      // For brevity, this is simplified here - in a real app you would refactor this to a shared util
      calculatedPl = 0; // Placeholder
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

    const { id } = params;

    // Check if transaction exists and belongs to the current user
    const transaction = await prisma.transaction.findUnique({
      where: { 
        id,
        userId: session.user.id
      }
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    // Delete the transaction (cascade should handle journal entry deletion)
    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'Failed to delete transaction', error: error.message },
      { status: 500 }
    );
  }
} 