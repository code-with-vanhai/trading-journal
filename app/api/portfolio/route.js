import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all transactions for the current user
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    // Calculate portfolio positions
    const portfolio = {};
    
    transactions.forEach(transaction => {
      const { ticker, type, quantity, price } = transaction;
      
      if (!portfolio[ticker]) {
        portfolio[ticker] = {
          ticker,
          quantity: 0,
          totalCost: 0,
          avgCost: 0
        };
      }
      
      if (type === 'BUY') {
        portfolio[ticker].totalCost += price * quantity;
        portfolio[ticker].quantity += quantity;
      } else if (type === 'SELL') {
        // For sells, we reduce the quantity and adjust the total cost proportionally
        const sellRatio = quantity / portfolio[ticker].quantity;
        portfolio[ticker].totalCost -= portfolio[ticker].totalCost * sellRatio;
        portfolio[ticker].quantity -= quantity;
      }
      
      // Recalculate average cost if quantity is positive
      if (portfolio[ticker].quantity > 0) {
        portfolio[ticker].avgCost = portfolio[ticker].totalCost / portfolio[ticker].quantity;
      }
    });
    
    // Filter out positions with zero quantity
    const activePositions = Object.values(portfolio).filter(position => position.quantity > 0);
    
    return NextResponse.json({ portfolio: activePositions });
  } catch (error) {
    console.error('Error fetching portfolio data:', error);
    return NextResponse.json({ error: 'Failed to fetch portfolio data' }, { status: 500 });
  }
} 