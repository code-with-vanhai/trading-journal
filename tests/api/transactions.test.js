const request = require('supertest');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { PrismaClient } = require('@prisma/client');
const { seedTestData, cleanTestData } = require('../setup/db-seed');

// Mock NextAuth session
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const { getServerSession } = require('next-auth/next');

describe('/api/transactions', () => {
  let app;
  let server;
  let prisma;
  let testUser;
  let testStockAccount;

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
    
    // Seed test data
    const seedResult = await seedTestData();
    testUser = seedResult.users[0];
    testStockAccount = seedResult.stockAccounts[0];
  });

  afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
    server.close();
  });

  beforeEach(() => {
    // Mock authenticated session
    getServerSession.mockResolvedValue({
      user: {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    test('should return transactions for authenticated user', async () => {
      const response = await request(server)
        .get('/api/transactions')
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    test('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      await request(server)
        .get('/api/transactions')
        .expect(401);
    });

    test('should filter transactions by ticker', async () => {
      const response = await request(server)
        .get('/api/transactions?ticker=VNM')
        .expect(200);

      expect(response.body.transactions.every(t => t.ticker.includes('VNM'))).toBe(true);
    });

    test('should filter transactions by type', async () => {
      const response = await request(server)
        .get('/api/transactions?type=BUY')
        .expect(200);

      expect(response.body.transactions.every(t => t.type === 'BUY')).toBe(true);
    });

    test('should filter transactions by stock account', async () => {
      const response = await request(server)
        .get(`/api/transactions?stockAccountId=${testStockAccount.id}`)
        .expect(200);

      expect(response.body.transactions.every(t => t.stockAccountId === testStockAccount.id)).toBe(true);
    });

    test('should filter transactions by date range', async () => {
      const dateFrom = '2024-01-01';
      const dateTo = '2024-01-31';

      const response = await request(server)
        .get(`/api/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`)
        .expect(200);

      response.body.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        expect(transactionDate >= new Date(dateFrom)).toBe(true);
        expect(transactionDate <= new Date(dateTo + 'T23:59:59.999Z')).toBe(true);
      });
    });

    test('should paginate results correctly', async () => {
      const page1 = await request(server)
        .get('/api/transactions?page=1&pageSize=1')
        .expect(200);

      expect(page1.body.transactions).toHaveLength(1);
      expect(page1.body.currentPage).toBe(1);
      expect(page1.body.pageSize).toBe(1);
    });

    test('should sort transactions correctly', async () => {
      const response = await request(server)
        .get('/api/transactions?sortBy=transactionDate&sortOrder=asc')
        .expect(200);

      const dates = response.body.transactions.map(t => new Date(t.transactionDate));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i] >= dates[i - 1]).toBe(true);
      }
    });
  });

  describe('POST /api/transactions', () => {
    test('should create a new BUY transaction', async () => {
      const newTransaction = {
        ticker: 'FPT',
        type: 'BUY',
        quantity: 100,
        price: 120000,
        transactionDate: '2024-02-01T00:00:00.000Z',
        fee: 30000,
        taxRate: 0,
        stockAccountId: testStockAccount.id,
        notes: 'Test BUY transaction',
      };

      const response = await request(server)
        .post('/api/transactions')
        .send(newTransaction)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.ticker).toBe(newTransaction.ticker);
      expect(response.body.type).toBe(newTransaction.type);
      expect(response.body.quantity).toBe(newTransaction.quantity);
      expect(response.body.price).toBe(newTransaction.price);
      expect(response.body.calculatedPl).toBeNull(); // BUY transactions don't have P&L
    });

    test('should create a new SELL transaction with calculated P&L', async () => {
      // First create a BUY transaction
      const buyTransaction = {
        ticker: 'MSN',
        type: 'BUY',
        quantity: 100,
        price: 150000,
        transactionDate: '2024-02-01T00:00:00.000Z',
        fee: 30000,
        taxRate: 0,
        stockAccountId: testStockAccount.id,
      };

      await request(server)
        .post('/api/transactions')
        .send(buyTransaction)
        .expect(201);

      // Then create a SELL transaction
      const sellTransaction = {
        ticker: 'MSN',
        type: 'SELL',
        quantity: 50,
        price: 160000,
        transactionDate: '2024-02-05T00:00:00.000Z',
        fee: 25000,
        taxRate: 0.1,
        stockAccountId: testStockAccount.id,
      };

      const response = await request(server)
        .post('/api/transactions')
        .send(sellTransaction)
        .expect(201);

      expect(response.body.calculatedPl).toBeDefined();
      expect(typeof response.body.calculatedPl).toBe('number');
    });

    test('should return 400 for invalid transaction data', async () => {
      const invalidTransaction = {
        ticker: '', // Invalid: empty ticker
        type: 'BUY',
        quantity: -10, // Invalid: negative quantity
        price: 0, // Invalid: zero price
      };

      await request(server)
        .post('/api/transactions')
        .send(invalidTransaction)
        .expect(400);
    });

    test('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      const transaction = {
        ticker: 'VNM',
        type: 'BUY',
        quantity: 100,
        price: 85000,
        transactionDate: '2024-02-01T00:00:00.000Z',
        stockAccountId: testStockAccount.id,
      };

      await request(server)
        .post('/api/transactions')
        .send(transaction)
        .expect(401);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let testTransaction;

    beforeEach(async () => {
      // Create a test transaction
      testTransaction = await prisma.transaction.create({
        data: {
          ticker: 'TEST',
          type: 'BUY',
          quantity: 100,
          price: 50000,
          transactionDate: new Date('2024-02-01'),
          fee: 20000,
          taxRate: 0,
          userId: testUser.id,
          stockAccountId: testStockAccount.id,
        },
      });
    });

    test('should update an existing transaction', async () => {
      const updates = {
        quantity: 150,
        price: 55000,
        notes: 'Updated transaction',
      };

      const response = await request(server)
        .put(`/api/transactions/${testTransaction.id}`)
        .send(updates)
        .expect(200);

      expect(response.body.quantity).toBe(updates.quantity);
      expect(response.body.price).toBe(updates.price);
      expect(response.body.notes).toBe(updates.notes);
    });

    test('should return 404 for non-existent transaction', async () => {
      await request(server)
        .put('/api/transactions/non-existent-id')
        .send({ quantity: 100 })
        .expect(404);
    });

    test('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      await request(server)
        .put(`/api/transactions/${testTransaction.id}`)
        .send({ quantity: 100 })
        .expect(401);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    let testTransaction;

    beforeEach(async () => {
      testTransaction = await prisma.transaction.create({
        data: {
          ticker: 'DELETE_TEST',
          type: 'BUY',
          quantity: 100,
          price: 50000,
          transactionDate: new Date('2024-02-01'),
          fee: 20000,
          taxRate: 0,
          userId: testUser.id,
          stockAccountId: testStockAccount.id,
        },
      });
    });

    test('should delete an existing transaction', async () => {
      await request(server)
        .delete(`/api/transactions/${testTransaction.id}`)
        .expect(200);

      // Verify transaction is deleted
      const deletedTransaction = await prisma.transaction.findUnique({
        where: { id: testTransaction.id },
      });
      expect(deletedTransaction).toBeNull();
    });

    test('should return 404 for non-existent transaction', async () => {
      await request(server)
        .delete('/api/transactions/non-existent-id')
        .expect(404);
    });

    test('should return 401 for unauthenticated user', async () => {
      getServerSession.mockResolvedValue(null);

      await request(server)
        .delete(`/api/transactions/${testTransaction.id}`)
        .expect(401);
    });
  });

  describe('Profit/Loss Calculation', () => {
    test('should calculate P&L correctly using FIFO method', async () => {
      const stockAccountId = testStockAccount.id;

      // Create multiple BUY transactions
      const buy1 = await prisma.transaction.create({
        data: {
          ticker: 'FIFO_TEST',
          type: 'BUY',
          quantity: 100,
          price: 100000,
          transactionDate: new Date('2024-01-01'),
          fee: 10000,
          taxRate: 0,
          userId: testUser.id,
          stockAccountId,
        },
      });

      const buy2 = await prisma.transaction.create({
        data: {
          ticker: 'FIFO_TEST',
          type: 'BUY',
          quantity: 100,
          price: 110000,
          transactionDate: new Date('2024-01-02'),
          fee: 10000,
          taxRate: 0,
          userId: testUser.id,
          stockAccountId,
        },
      });

      // Create SELL transaction
      const sellTransaction = {
        ticker: 'FIFO_TEST',
        type: 'SELL',
        quantity: 150,
        price: 120000,
        transactionDate: '2024-01-03T00:00:00.000Z',
        fee: 15000,
        taxRate: 0,
        stockAccountId,
      };

      const response = await request(server)
        .post('/api/transactions')
        .send(sellTransaction)
        .expect(201);

      // Expected P&L calculation:
      // Sell: 150 * 120000 = 18,000,000
      // Cost: (100 * 100000) + (50 * 110000) = 10,000,000 + 5,500,000 = 15,500,000
      // Gross profit: 18,000,000 - 15,500,000 = 2,500,000
      // Net profit: 2,500,000 - 15,000 (fee) = 2,485,000
      expect(response.body.calculatedPl).toBe(2485000);
    });
  });
}); 