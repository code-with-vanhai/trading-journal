import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stock-accounts/[id] - Get a specific stock account
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    
    const stockAccount = await prisma.stockAccount.findFirst({
      where: {
        id: id,
        userId: session.user.id // Ensure user owns this account
      }
    });

    // Manually count transactions for this account
    const transactionCount = await prisma.transaction.count({
      where: {
        stockAccountId: id
      }
    });

    const stockAccountWithCount = stockAccount ? {
      ...stockAccount,
      _count: { Transaction: transactionCount }
    } : null;

    if (!stockAccount) {
      return NextResponse.json(
        { error: 'Stock account not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(stockAccountWithCount);

  } catch (error) {
    console.error('Error fetching stock account:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/stock-accounts/[id] - Update a stock account
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, brokerName, accountNumber, description } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Account name is required' }, 
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Account name must be less than 100 characters' }, 
        { status: 400 }
      );
    }

    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.stockAccount.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Stock account not found' }, 
        { status: 404 }
      );
    }

    // Check if another account with the same name exists (excluding current account)
    const duplicateAccount = await prisma.stockAccount.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim(),
        id: {
          not: id
        }
      }
    });

    if (duplicateAccount) {
      return NextResponse.json(
        { error: 'An account with this name already exists' }, 
        { status: 409 }
      );
    }

    // Update the stock account
    const updatedAccount = await prisma.stockAccount.update({
      where: {
        id: id
      },
      data: {
        name: name.trim(),
        brokerName: brokerName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        description: description?.trim() || null
      }
    });

    // Manually add transaction count
    const updateTransactionCount = await prisma.transaction.count({
      where: {
        stockAccountId: id
      }
    });

    const updatedAccountWithCount = {
      ...updatedAccount,
      _count: { Transaction: updateTransactionCount }
    };

    return NextResponse.json(updatedAccountWithCount);

  } catch (error) {
    console.error('Error updating stock account:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this name already exists' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/stock-accounts/[id] - Delete a stock account
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if the account exists and belongs to the user
    const existingAccount = await prisma.stockAccount.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    });

    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Stock account not found' }, 
        { status: 404 }
      );
    }

    // Check if account has transactions (prevent deletion)
    if (existingAccount._count.Transaction > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete account. It has ${existingAccount._count.Transaction} transaction(s) linked to it. Please move or delete the transactions first.` 
        }, 
        { status: 409 }
      );
    }

    // Delete the stock account
    await prisma.stockAccount.delete({
      where: {
        id: id
      }
    });

    return NextResponse.json(
      { message: 'Stock account deleted successfully' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting stock account:', error);
    
    // Handle foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete account because it has linked transactions' }, 
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 