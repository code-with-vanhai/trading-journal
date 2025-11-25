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
  // Note: SWC minification is enabled by default in Next.js 15
  webpack: (config, { dev, isServer }) => {
    // Only add essential optimizations
    if (!dev && !isServer) {
      // Disable source maps in production for smaller builds
      config.devtool = false;
      
      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Separate chunk for large libraries
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              chunks: 'all',
              priority: 30,
            },
            dateFns: {
              name: 'date-fns',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      };
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