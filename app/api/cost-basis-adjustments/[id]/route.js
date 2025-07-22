import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// PATCH - Update cost basis adjustment (toggle active status)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { isActive } = body;

    // Verify adjustment belongs to user
    const existingAdjustment = await prisma.costBasisAdjustment.findUnique({
      where: { id },
      select: { userId: true, ticker: true, adjustmentType: true }
    });

    if (!existingAdjustment) {
      return NextResponse.json({ message: 'Adjustment not found' }, { status: 404 });
    }

    if (existingAdjustment.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Update adjustment
    const updatedAdjustment = await prisma.costBasisAdjustment.update({
      where: { id },
      data: { 
        isActive: isActive,
        updatedAt: new Date()
      }
    });

    console.log(`[Cost Basis Adjustments API] Updated adjustment ${id}: isActive = ${isActive}`);
    
    return NextResponse.json({
      message: isActive ? 'Adjustment activated' : 'Adjustment deactivated',
      adjustment: updatedAdjustment
    });

  } catch (error) {
    console.error('Cost Basis Adjustments PATCH Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete cost basis adjustment
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify adjustment belongs to user
    const existingAdjustment = await prisma.costBasisAdjustment.findUnique({
      where: { id },
      select: { userId: true, ticker: true, adjustmentType: true }
    });

    if (!existingAdjustment) {
      return NextResponse.json({ message: 'Adjustment not found' }, { status: 404 });
    }

    if (existingAdjustment.userId !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Delete adjustment
    await prisma.costBasisAdjustment.delete({
      where: { id }
    });

    console.log(`[Cost Basis Adjustments API] Deleted adjustment ${id} for ${existingAdjustment.ticker}`);
    
    return NextResponse.json({
      message: 'Adjustment deleted successfully'
    });

  } catch (error) {
    console.error('Cost Basis Adjustments DELETE Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error.message
      },
      { status: 500 }
    );
  }
} 