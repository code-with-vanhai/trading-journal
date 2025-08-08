import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import db from '../../lib/database.js';
import { authOptions } from '../auth/[...nextauth]/route';

const prisma = db;

// POST - Create or update a journal entry
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, emotionOnEntry, emotionOnExit, strategyUsed, postTradeReview, tags = [] } = body;

    if (!transactionId) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if the transaction exists and belongs to the user
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionId,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found or does not belong to you' },
        { status: 404 }
      );
    }

    // Check if a journal entry already exists for this transaction
    const existingEntry = await prisma.journalEntry.findUnique({
      where: {
        transactionId,
      },
    });

    // Create or update the journal entry
    let journalEntry;
    if (existingEntry) {
      // Update existing entry
      journalEntry = await prisma.journalEntry.update({
        where: {
          id: existingEntry.id,
        },
        data: {
          emotionOnEntry,
          emotionOnExit,
          strategyUsed,
          postTradeReview,
        },
      });

      // Delete existing tags and add new ones if provided
      if (tags.length > 0) {
        // Remove old tags
        await prisma.journalEntryTag.deleteMany({
          where: {
            journalEntryId: journalEntry.id,
          },
        });

        // Add new tags
        for (const tagId of tags) {
          await prisma.journalEntryTag.create({
            data: {
              journalEntryId: journalEntry.id,
              tagId,
            },
          });
        }
      }
    } else {
      // Create new entry
      journalEntry = await prisma.journalEntry.create({
        data: {
          transactionId,
          userId: session.user.id,
          emotionOnEntry,
          emotionOnExit,
          strategyUsed,
          postTradeReview,
        },
      });

      // Add tags if provided
      if (tags.length > 0) {
        for (const tagId of tags) {
          await prisma.journalEntryTag.create({
            data: {
              journalEntryId: journalEntry.id,
              tagId,
            },
          });
        }
      }
    }

    // Return the journal entry with tags
    const entryWithTags = await prisma.journalEntry.findUnique({
      where: {
        id: journalEntry.id,
      },
    });

    // Manually get tags for this journal entry
    const entryTags = await prisma.journalEntryTag.findMany({
      where: {
        journalEntryId: journalEntry.id,
      },
    });

    const tagIds = entryTags.map(et => et.tagId);
    const entryTagsList = tagIds.length > 0 ? await prisma.tag.findMany({
      where: {
        id: { in: tagIds }
      }
    }) : [];

    const entryWithTagsData = {
      ...entryWithTags,
      tags: entryTags.map(et => ({
        journalEntryId: et.journalEntryId,
        tagId: et.tagId,
        tag: entryTagsList.find(tag => tag.id === et.tagId)
      }))
    };

    return NextResponse.json(entryWithTagsData, { 
      status: existingEntry ? 200 : 201 
    });
  } catch (error) {
    console.error('Error saving journal entry:', error);
    return NextResponse.json(
      { message: 'Failed to save journal entry', error: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch a journal entry by transaction ID
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if the journal entry exists and belongs to the user
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        transactionId,
        userId: session.user.id,
      },
    });

    if (!journalEntry) {
      return NextResponse.json(
        { message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Manually get tags and transaction data
    const [entryTags, transaction] = await Promise.all([
      prisma.journalEntryTag.findMany({
        where: {
          journalEntryId: journalEntry.id,
        },
      }),
      prisma.transaction.findFirst({
        where: {
          id: transactionId,
        },
      })
    ]);

         const tagIds = entryTags.map(et => et.tagId);
     const journalTagsList = tagIds.length > 0 ? await prisma.tag.findMany({
       where: {
         id: { in: tagIds }
       }
     }) : [];

     const journalEntryWithData = {
       ...journalEntry,
       tags: entryTags.map(et => ({
         journalEntryId: et.journalEntryId,
         tagId: et.tagId,
         tag: journalTagsList.find(tag => tag.id === et.tagId)
       })),
       transaction
     };

    if (!journalEntry) {
      return NextResponse.json(
        { message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(journalEntry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { message: 'Failed to fetch journal entry', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a journal entry
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Find the journal entry
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        transactionId,
        userId: session.user.id,
      },
    });

    if (!journalEntry) {
      return NextResponse.json(
        { message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Delete all associated tags first
    await prisma.journalEntryTag.deleteMany({
      where: {
        journalEntryId: journalEntry.id,
      },
    });

    // Delete the journal entry
    await prisma.journalEntry.delete({
      where: {
        id: journalEntry.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { message: 'Failed to delete journal entry', error: error.message },
      { status: 500 }
    );
  }
} 