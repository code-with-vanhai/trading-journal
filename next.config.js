/** @type {import('next').NextConfig} */

/**
 * 🚀 SIMPLIFIED NEXT.JS CONFIGURATION
 * Focus on working optimizations that provide real value
 */

// Bundle analyzer (only when needed)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Basic optimizations that work reliably
  experimental: {
    // Only enable stable optimizations
  },

  // Server Components optimizations
  serverExternalPackages: ['@prisma/client', 'bcrypt'],

  // Compiler optimizations
  compiler: {
    // Remove console statements in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error và warn logs
    } : false,
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Enable compression
  compress: true,

  // Remove powered by header
  poweredByHeader: false,

  // Basic webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Only add essential optimizations
    if (!dev && !isServer) {
      // Disable source maps in production for smaller builds
      config.devtool = false;
    }

    return config;
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Apply bundle analyzer wrapper
module.exports = withBundleAnalyzer(nextConfig);