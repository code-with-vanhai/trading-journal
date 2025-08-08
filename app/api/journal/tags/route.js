import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../../lib/database.js';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = db;

// GET - Fetch all tags for the current user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { message: 'Failed to fetch tags', error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new tag
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: 'Tag name is required' },
        { status: 400 }
      );
    }

    // Check if tag already exists for this user
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId: session.user.id,
        name: name.trim(),
      },
    });

    if (existingTag) {
      return NextResponse.json(existingTag);
    }

    // Create new tag
    const tag = await prisma.tag.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { message: 'Failed to create tag', error: error.message },
      { status: 500 }
    );
  }
} 