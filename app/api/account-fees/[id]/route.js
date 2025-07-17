import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

// Use singleton pattern for Prisma to avoid connection overhead
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Cache for account fees with TTL
const accountFeesCache = new Map();

// GET - Fetch specific account fee
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Find account fee
    const accountFee = await prisma.accountFee.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true
      },
      include: {
        stockAccount: {
          select: {
            name: true,
            brokerName: true
          }
        }
      }
    });
    
    if (!accountFee) {
      return NextResponse.json(
        { message: 'Account fee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(accountFee);
    
  } catch (error) {
    console.error('Error fetching account fee:', error);
    return NextResponse.json(
      { message: 'Failed to fetch account fee' },
      { status: 500 }
    );
  }
}

// PUT - Update specific account fee
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    
    // Find existing account fee
    const existingFee = await prisma.accountFee.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true
      }
    });
    
    if (!existingFee) {
      return NextResponse.json(
        { message: 'Account fee not found' },
        { status: 404 }
      );
    }
    
    // Validate required fields
    const { stockAccountId, feeType, amount, feeDate } = body;
    
    if (!stockAccountId) {
      return NextResponse.json(
        { message: 'Stock account ID is required' },
        { status: 400 }
      );
    }
    
    if (!feeType) {
      return NextResponse.json(
        { message: 'Fee type is required' },
        { status: 400 }
      );
    }
    
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }
    
    if (!feeDate) {
      return NextResponse.json(
        { message: 'Fee date is required' },
        { status: 400 }
      );
    }
    
    // Verify stock account belongs to user
    const stockAccount = await prisma.stockAccount.findFirst({
      where: {
        id: stockAccountId,
        userId: session.user.id
      }
    });
    
    if (!stockAccount) {
      return NextResponse.json(
        { message: 'Stock account not found' },
        { status: 404 }
      );
    }
    
    // Update account fee
    const updatedAccountFee = await prisma.accountFee.update({
      where: { id },
      data: {
        stockAccountId,
        feeType,
        amount: parseFloat(amount),
        description: body.description || null,
        feeDate: new Date(feeDate),
        referenceNumber: body.referenceNumber || null,
        attachmentUrl: body.attachmentUrl || null
      },
      include: {
        stockAccount: {
          select: {
            name: true,
            brokerName: true
          }
        }
      }
    });
    
    // Clear cache
    accountFeesCache.clear();
    
    return NextResponse.json(updatedAccountFee);
    
  } catch (error) {
    console.error('Error updating account fee:', error);
    return NextResponse.json(
      { message: 'Failed to update account fee' },
      { status: 500 }
    );
  }
}

// DELETE - Remove specific account fee (soft delete)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    // Find existing account fee
    const existingFee = await prisma.accountFee.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true
      }
    });
    
    if (!existingFee) {
      return NextResponse.json(
        { message: 'Account fee not found' },
        { status: 404 }
      );
    }
    
    // Soft delete by setting isActive to false
    await prisma.accountFee.update({
      where: { id },
      data: {
        isActive: false
      }
    });
    
    // Clear cache
    accountFeesCache.clear();
    
    return NextResponse.json(
      { message: 'Account fee deleted successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error deleting account fee:', error);
    return NextResponse.json(
      { message: 'Failed to delete account fee' },
      { status: 500 }
    );
  }
} 