const request = require('supertest');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

// Mock fetch for TCBS API calls
jest.mock('node-fetch');

// Mock NextAuth session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const { getServerSession } = require('next-auth/next');

describe('/api/market-data', () => {
  let app;
  let server;
  let prisma;

  beforeAll(async () => {
    // Set up Next.js app for testing
    const nextApp = next({ dev: false, dir: '.' });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    server.close();
  });

  beforeEach(() => {
    // Mock authenticated session
    getServerSession.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      },
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('GET /api/market-data', () => {
    test('should return cached stock price if available and fresh', async () => {
      const ticker = 'VNM';
      const cachedPrice = 88000;

      // Create cached price entry
      await prisma.stockPriceCache.upsert({
        where: { symbol: ticker },
        update: {
          price: cachedPrice,
          lastUpdatedAt: new Date(), // Fresh cache
        },
        create: {
          symbol: ticker,
          price: cachedPrice,
          lastUpdatedAt: new Date(),
          source: 'tcbs',
        },
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(200);

      expect(response.body).toHaveProperty('price', cachedPrice);
      expect(response.body).toHaveProperty('symbol', ticker);
      expect(response.body).toHaveProperty('cached', true);
      
      // Should not call external API
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should fetch from TCBS API if cache is stale', async () => {
      const ticker = 'TCB';
      const newPrice = 26500;
      const staleDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Create stale cache entry
      await prisma.stockPriceCache.upsert({
        where: { symbol: ticker },
        update: {
          price: 25000,
          lastUpdatedAt: staleDate,
        },
        create: {
          symbol: ticker,
          price: 25000,
          lastUpdatedAt: staleDate,
          source: 'tcbs',
        },
      });

      // Mock TCBS API response
      const mockApiResponse = {
        data: [
          {
            tradingDate: Date.now() / 1000,
            open: 26000,
            high: 27000,
            low: 25500,
            close: newPrice,
            volume: 2000000,
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(200);

      expect(response.body).toHaveProperty('price', newPrice);
      expect(response.body).toHaveProperty('symbol', ticker);
      expect(response.body).toHaveProperty('cached', false);
      
      // Should call external API
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`ticker=${ticker}`)
      );
    });

    test('should fetch historical data with date range', async () => {
      const ticker = 'FPT';
      const from = Math.floor(new Date('2024-01-01').getTime() / 1000);
      const to = Math.floor(new Date('2024-01-31').getTime() / 1000);

      const mockApiResponse = {
        data: [
          {
            tradingDate: from,
            open: 120000,
            high: 125000,
            low: 118000,
            close: 123000,
            volume: 1500000,
          },
          {
            tradingDate: to,
            open: 123000,
            high: 128000,
            low: 121000,
            close: 126000,
            volume: 1800000,
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}&from=${from}&to=${to}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('date');
      expect(response.body.data[0]).toHaveProperty('open');
      expect(response.body.data[0]).toHaveProperty('high');
      expect(response.body.data[0]).toHaveProperty('low');
      expect(response.body.data[0]).toHaveProperty('close');
      expect(response.body.data[0]).toHaveProperty('volume');
    });

    test('should return 400 for missing ticker parameter', async () => {
      await request(server)
        .get('/api/market-data')
        .expect(400);
    });

    test('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      await request(server)
        .get('/api/market-data?ticker=VNM')
        .expect(401);
    });

    test('should handle TCBS API errors gracefully', async () => {
      const ticker = 'ERROR_TEST';

      // Mock API error
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle network errors gracefully', async () => {
      const ticker = 'NETWORK_ERROR';

      // Mock network error
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should validate ticker format', async () => {
      const invalidTickers = ['', '123', 'TOOLONG', 'invalid-ticker'];

      for (const ticker of invalidTickers) {
        await request(server)
          .get(`/api/market-data?ticker=${ticker}`)
          .expect(400);
      }
    });

    test('should cache API response after successful fetch', async () => {
      const ticker = 'CACHE_TEST';
      const price = 150000;

      const mockApiResponse = {
        data: [
          {
            tradingDate: Date.now() / 1000,
            open: 148000,
            high: 152000,
            low: 147000,
            close: price,
            volume: 1000000,
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      // First request should fetch from API
      const response1 = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(200);

      expect(response1.body.cached).toBe(false);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear fetch mock
      fetch.mockClear();

      // Second request should use cache
      const response2 = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(200);

      expect(response2.body.cached).toBe(true);
      expect(response2.body.price).toBe(price);
      expect(fetch).not.toHaveBeenCalled();
    });

    test('should handle malformed API response', async () => {
      const ticker = 'MALFORMED';

      // Mock malformed response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    test('should handle empty API response', async () => {
      const ticker = 'EMPTY';

      // Mock empty response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const response = await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should respect cache duration configuration', async () => {
      const ticker = 'CACHE_DURATION';
      const originalCacheDuration = process.env.STOCK_PRICE_CACHE_DURATION;
      
      // Set very short cache duration for testing
      process.env.STOCK_PRICE_CACHE_DURATION = '1000'; // 1 second

      try {
        // Create cache entry
        await prisma.stockPriceCache.upsert({
          where: { symbol: ticker },
          update: {
            price: 100000,
            lastUpdatedAt: new Date(Date.now() - 2000), // 2 seconds ago
          },
          create: {
            symbol: ticker,
            price: 100000,
            lastUpdatedAt: new Date(Date.now() - 2000),
            source: 'tcbs',
          },
        });

        const mockApiResponse = {
          data: [
            {
              tradingDate: Date.now() / 1000,
              open: 105000,
              high: 108000,
              low: 104000,
              close: 107000,
              volume: 500000,
            },
          ],
        };

        fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

        const response = await request(server)
          .get(`/api/market-data?ticker=${ticker}`)
          .expect(200);

        // Should fetch from API due to expired cache
        expect(response.body.cached).toBe(false);
        expect(response.body.price).toBe(107000);
        expect(fetch).toHaveBeenCalled();

      } finally {
        // Restore original cache duration
        process.env.STOCK_PRICE_CACHE_DURATION = originalCacheDuration;
      }
    });
  });

  describe('Cache Management', () => {
    test('should update cache metadata correctly', async () => {
      const ticker = 'METADATA_TEST';
      const metadata = { volume: 1500000, change: 2.5, high: 95000, low: 90000 };

      const mockApiResponse = {
        data: [
          {
            tradingDate: Date.now() / 1000,
            open: 92000,
            high: metadata.high,
            low: metadata.low,
            close: 93000,
            volume: metadata.volume,
          },
        ],
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      await request(server)
        .get(`/api/market-data?ticker=${ticker}`)
        .expect(200);

      // Check if metadata was stored correctly
      const cachedEntry = await prisma.stockPriceCache.findUnique({
        where: { symbol: ticker },
      });

      expect(cachedEntry).toBeTruthy();
      expect(cachedEntry.metadata).toMatchObject({
        volume: metadata.volume,
        high: metadata.high,
        low: metadata.low,
      });
    });
  });
}); 