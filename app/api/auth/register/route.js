import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, name, username, password } = body;

    if (!email || !password || !username) {
      return NextResponse.json(
        { message: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: 'Username can only contain letters, numbers, underscores and hyphens' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if username is already taken
    try {
      const existingUserByUsername = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });

      if (existingUserByUsername) {
        return NextResponse.json(
          { message: 'Username is already taken' },
          { status: 409 }
        );
      }
    } catch (error) {
      // If the username field doesn't exist in the database yet, this will fail
      // We can ignore this error during the transition period
      console.log('Username check error (expected if field not added yet):', error.message);
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    try {
      const user = await prisma.user.create({
        data: {
          email,
          username,
          name: name || null, // Handle empty name
          passwordHash,
        },
      });

      // Return success without exposing password hash
      return NextResponse.json(
        {
          message: 'User registered successfully',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            name: user.name,
          },
        },
        { status: 201 }
      );
    } catch (createError) {
      // If creating with username fails (field might not exist yet)
      if (createError.message.includes('username')) {
        console.error('Username field error (expected if migration not applied):', createError.message);
        
        // Fallback to creating without username during transition
        const user = await prisma.user.create({
          data: {
            email,
            name: name || null,
            passwordHash,
          },
        });
        
        return NextResponse.json(
          {
            message: 'User registered successfully (without username - migration needed)',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
          },
          { status: 201 }
        );
      }
      
      throw createError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Something went wrong', error: error.message },
      { status: 500 }
    );
  }
} 