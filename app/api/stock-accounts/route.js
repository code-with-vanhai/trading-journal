import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/stock-accounts - Get all stock accounts for the authenticated user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Verify user exists in database to prevent foreign key constraint violations
    // TEMPORARILY DISABLED - uncomment after fixing session
    /*
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      return NextResponse.json(
        { error: 'User not found in database. Please log out and log in again.' }, 
        { status: 404 }
      );
    }
    */

    let stockAccounts = await prisma.stockAccount.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            Transaction: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // If user has no accounts, create a default one
    if (stockAccounts.length === 0) {
      console.log(`Creating default account for user ${session.user.id}`);
      
      const defaultAccount = await prisma.stockAccount.create({
        data: {
          id: `default-${session.user.id}`,
          name: 'Tài khoản mặc định',
          brokerName: null,
          accountNumber: null,
          description: 'Tài khoản mặc định được tạo tự động',
          userId: session.user.id
        },
        include: {
          _count: {
            select: {
              Transaction: true
            }
          }
        }
      });

      stockAccounts = [defaultAccount];
    }

    // Sort accounts to ensure default account appears first
    const sortedAccounts = stockAccounts.sort((a, b) => {
      // Default account (by name) should appear first
      if (a.name === 'Tài khoản mặc định' && b.name !== 'Tài khoản mặc định') {
        return -1;
      }
      if (b.name === 'Tài khoản mặc định' && a.name !== 'Tài khoản mặc định') {
        return 1;
      }
      // Otherwise, sort by creation date (oldest first)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    return NextResponse.json(sortedAccounts);

  } catch (error) {
    console.error('Error fetching stock accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/stock-accounts - Create a new stock account
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

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

    // Check if account name already exists for this user
    const existingAccount = await prisma.stockAccount.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim()
      }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'An account with this name already exists' }, 
        { status: 409 }
      );
    }

    // Create the new stock account
    const newAccount = await prisma.stockAccount.create({
      data: {
        id: `${session.user.id}-${Date.now()}`,
        name: name.trim(),
        brokerName: brokerName?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        description: description?.trim() || null,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            transactions: true
          }
        }
      }
    });

    return NextResponse.json(newAccount, { status: 201 });

  } catch (error) {
    console.error('Error creating stock account:', error);
    
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