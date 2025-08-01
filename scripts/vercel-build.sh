#!/bin/bash

echo "🚀 Starting Vercel build process..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations (SAFE for production)
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Build Next.js application
echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Vercel build completed successfully!"