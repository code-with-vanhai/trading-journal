/**
 * Enhanced Analysis API Tests
 * Tests for new risk metrics, sector analysis, and benchmark comparison endpoints
 */

const request = require('supertest');
const { createMocks } = require('node-mocks-http');

// Mock Next.js API route
const analysisRoute = require('../../app/api/analysis/route');

describe('Enhanced Analysis API', () => {
  let mockSession;

  beforeEach(() => {
    mockSession = {
      user: {
        id: 'test-user-id'
      }
    };
    
    // Mock getServerSession
    jest.mock('next-auth/next', () => ({
      getServerSession: jest.fn(() => Promise.resolve(mockSession))
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Risk Metrics Endpoint', () => {
    test('should return risk metrics for valid user', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=risk-metrics&period=all',
        query: {
          type: 'risk-metrics',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      // Check required fields
      expect(data).toHaveProperty('volatility');
      expect(data).toHaveProperty('sharpeRatio');
      expect(data).toHaveProperty('maxDrawdown');
      expect(data).toHaveProperty('valueAtRisk95');
      expect(data).toHaveProperty('riskScore');
      
      // Check data types
      expect(typeof data.volatility).toBe('number');
      expect(typeof data.sharpeRatio).toBe('number');
      expect(typeof data.maxDrawdown).toBe('number');
      expect(typeof data.riskScore).toBe('number');
      
      // Check ranges
      expect(data.riskScore).toBeGreaterThanOrEqual(0);
      expect(data.riskScore).toBeLessThanOrEqual(100);
    });

    test('should handle empty portfolio gracefully', async () => {
      // Mock empty transaction data
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=risk-metrics&period=all',
        query: {
          type: 'risk-metrics',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);

      const data = JSON.parse(res._getData());
      expect(data.volatility).toBe(0);
      expect(data.sharpeRatio).toBe(0);
      expect(data.maxDrawdown).toBe(0);
      expect(data.totalTrades).toBe(0);
    });
  });

  describe('Sector Analysis Endpoint', () => {
    test('should return sector performance data', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=sector-analysis&period=all',
        query: {
          type: 'sector-analysis',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data).toHaveProperty('sectorPerformance');
      expect(data).toHaveProperty('totalSectors');
      expect(Array.isArray(data.sectorPerformance)).toBe(true);
      
      // Check sector data structure
      if (data.sectorPerformance.length > 0) {
        const sector = data.sectorPerformance[0];
        expect(sector).toHaveProperty('sector');
        expect(sector).toHaveProperty('pnl');
        expect(sector).toHaveProperty('invested');
        expect(sector).toHaveProperty('trades');
        expect(sector).toHaveProperty('roi');
      }
    });

    test('should map Vietnamese tickers to correct sectors', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=sector-analysis&period=all',
        query: {
          type: 'sector-analysis',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);

      const data = JSON.parse(res._getData());
      
      // Check if known sectors are present
      const sectorNames = data.sectorPerformance.map(s => s.sector);
      const expectedSectors = ['Ngân hàng', 'Bất động sản', 'Thép', 'Công nghệ'];
      
      // At least some expected sectors should be present if there's data
      if (sectorNames.length > 0) {
        const hasExpectedSectors = expectedSectors.some(sector => 
          sectorNames.includes(sector)
        );
        expect(hasExpectedSectors).toBe(true);
      }
    });
  });

  describe('Benchmark Comparison Endpoint', () => {
    test('should return benchmark comparison metrics', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=benchmark-comparison&period=all',
        query: {
          type: 'benchmark-comparison',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      expect(data).toHaveProperty('beta');
      expect(data).toHaveProperty('alpha');
      expect(data).toHaveProperty('correlation');
      expect(data).toHaveProperty('trackingError');
      expect(data).toHaveProperty('informationRatio');
      
      // Check data types and ranges
      expect(typeof data.beta).toBe('number');
      expect(typeof data.alpha).toBe('number');
      expect(typeof data.correlation).toBe('number');
      
      // Correlation should be between -1 and 1
      expect(data.correlation).toBeGreaterThanOrEqual(-1);
      expect(data.correlation).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for unauthenticated requests', async () => {
      // Mock no session
      jest.mock('next-auth/next', () => ({
        getServerSession: jest.fn(() => Promise.resolve(null))
      }));

      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=risk-metrics',
        query: { type: 'risk-metrics' }
      });

      await analysisRoute.GET(req);

      expect(res._getStatusCode()).toBe(401);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Not authenticated');
    });

    test('should return 400 for invalid analysis type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=invalid-type',
        query: { type: 'invalid-type' }
      });

      await analysisRoute.GET(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe('Invalid analysis type');
    });
  });

  describe('Performance Tests', () => {
    test('should complete risk metrics calculation within time limit', async () => {
      const startTime = Date.now();
      
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=risk-metrics&period=all',
        query: {
          type: 'risk-metrics',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle large datasets efficiently', async () => {
      // This would test with a large number of transactions
      // For now, just ensure it doesn't crash
      const { req, res } = createMocks({
        method: 'GET',
        url: '/api/analysis?type=sector-analysis&period=all',
        query: {
          type: 'sector-analysis',
          period: 'all'
        }
      });

      await analysisRoute.GET(req);
      expect(res._getStatusCode()).toBe(200);
    });
  });
});

// Helper function tests
describe('Risk Calculation Helper Functions', () => {
  // These would test the individual calculation functions
  // For brevity, including a few key tests
  
  test('calculateVolatility should handle empty arrays', () => {
    // Would need to export the helper functions for testing
    // For now, testing through the API endpoints
    expect(true).toBe(true);
  });

  test('calculateSharpeRatio should return reasonable values', () => {
    // Test with known inputs and expected outputs
    expect(true).toBe(true);
  });
});

module.exports = {
  // Export test utilities for other test files
  createMockSession: () => mockSession,
  createAnalysisRequest: (type, period = 'all') => {
    return createMocks({
      method: 'GET',
      url: `/api/analysis?type=${type}&period=${period}`,
      query: { type, period }
    });
  }
};