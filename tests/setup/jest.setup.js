require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock fetch
global.fetch = jest.fn();

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_trading_journal';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-purposes';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.TCBS_API_URL = 'https://apipubaws.tcbs.com.vn';
process.env.STOCK_PRICE_CACHE_DURATION = '3600000';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 