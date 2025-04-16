import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// DELETE - Delete a tag
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if tag exists and belongs to the current user
    const tag = await prisma.tag.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!tag) {
      return NextResponse.json({ message: 'Tag not found' }, { status: 404 });
    }

    // Delete the tag (this will also delete all JournalEntryTag relations due to cascade)
    await prisma.tag.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { message: 'Failed to delete tag', error: error.message },
      { status: 500 }
    );
  }
} 