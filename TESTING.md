# Testing Guide for Trading Journal Application

This document provides comprehensive testing instructions for the Trading Journal application, especially when changing database environments.

## 🧪 Test Suite Overview

The application includes a comprehensive test suite that validates all functionality across different layers:

### Test Categories

1. **Database Migration Tests** - Validates database connectivity and schema integrity
2. **API Tests** - Tests all REST endpoints and business logic
3. **Component Tests** - Tests React components and UI functionality
4. **Integration Tests** - Tests end-to-end workflows
5. **Performance Tests** - Validates response times and query performance
6. **Security Tests** - Validates authentication and data isolation

## 🚀 Quick Start - Database Environment Testing

When changing database environments (e.g., SQLite to PostgreSQL), run this command to validate everything works:

```bash
npm run test:db-migration
```

This comprehensive test will:
- ✅ Validate database connectivity
- ✅ Check schema integrity
- ✅ Test all API endpoints
- ✅ Verify data relationships
- ✅ Test performance benchmarks
- ✅ Validate security features
- ✅ Generate detailed report

**If all tests pass, your database migration is successful and ready for deployment!**

## 📋 Complete Test Commands

### Run All Tests
```bash
# Run complete test suite
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

### Run Specific Test Categories
```bash
# API endpoint tests
npm run test:api

# React component tests
npm run test:components

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e
```

### Database Environment Tests
```bash
# Complete database migration validation
npm run test:db-migration

# Set up test database
npm run test:db:setup

# Seed test data
npm run test:db:seed

# Clean test data
npm run test:db:clean
```

## 🔍 Detailed Test Cases

### 1. Database Migration Test Suite

**File**: `tests/db-migration-suite.js`

This comprehensive test validates your database after environment changes:

#### Database Connectivity Tests
- ✅ Database connection establishment
- ✅ Database version verification
- ✅ Connection pool functionality
- ✅ Query execution validation

#### Schema Integrity Tests
- ✅ All required tables exist
- ✅ Database indexes are properly created
- ✅ Foreign key constraints are intact
- ✅ Column data types are correct

#### Data Migration Tests
- ✅ User creation and authentication
- ✅ Stock account management
- ✅ Transaction recording
- ✅ Journal entry creation
- ✅ Tag system functionality
- ✅ Strategy management

#### API Functionality Tests
- ✅ User authentication flow
- ✅ Transaction CRUD operations
- ✅ Portfolio calculations (FIFO method)
- ✅ Journal entry relationships
- ✅ Strategy queries

#### Performance Benchmark Tests
- ✅ Transaction list query performance (<1s)
- ✅ Complex portfolio queries (<2s)
- ✅ Concurrent query handling (<3s)

#### Cache System Tests
- ✅ Stock price cache creation
- ✅ Cache retrieval performance (<100ms)
- ✅ Cache expiration logic

#### Security Feature Tests
- ✅ Password hashing verification
- ✅ User data isolation
- ✅ SQL injection prevention

### 2. API Endpoint Tests

#### Transaction API Tests (`tests/api/transactions.test.js`)
- ✅ GET /api/transactions - List with filtering, pagination, sorting
- ✅ POST /api/transactions - Create BUY/SELL transactions
- ✅ PUT /api/transactions/:id - Update existing transactions
- ✅ DELETE /api/transactions/:id - Delete transactions
- ✅ FIFO P&L calculation validation
- ✅ Authentication and authorization
- ✅ Input validation and error handling

#### Market Data API Tests (`tests/api/market-data.test.js`)
- ✅ GET /api/market-data - Stock price retrieval
- ✅ Cache hit/miss scenarios
- ✅ TCBS API integration
- ✅ Historical data fetching
- ✅ Error handling (API failures, network issues)
- ✅ Cache duration configuration
- ✅ Metadata storage validation

#### Portfolio API Tests
- ✅ GET /api/portfolio - Portfolio analytics
- ✅ Position calculations
- ✅ Multi-account aggregation
- ✅ Performance metrics
- ✅ Real-time data integration

#### Journal API Tests
- ✅ GET /api/journal - Journal entry listing
- ✅ POST /api/journal - Create journal entries
- ✅ Tag management (CRUD operations)
- ✅ Transaction-journal relationships

#### Strategy API Tests
- ✅ GET /api/strategies - Public strategy listing
- ✅ POST /api/strategies - Create strategies
- ✅ GET /api/strategies/me - User's own strategies
- ✅ PUT/DELETE /api/strategies/:id - Update/delete strategies

#### Stock Account API Tests
- ✅ GET /api/stock-accounts - List user accounts
- ✅ POST /api/stock-accounts - Create new accounts
- ✅ PUT /api/stock-accounts/:id - Update accounts
- ✅ DELETE /api/stock-accounts/:id - Delete accounts

#### Authentication API Tests
- ✅ POST /api/auth/register - User registration
- ✅ NextAuth.js integration
- ✅ Session management
- ✅ Password validation

### 3. Component Tests

#### Core Components
- ✅ Dashboard component rendering
- ✅ Transaction list functionality
- ✅ Transaction form validation
- ✅ Portfolio charts and analytics
- ✅ Journal entry forms
- ✅ Strategy management components

#### UI Components
- ✅ Modal components (Login, Edit, Delete)
- ✅ Form validation and submission
- ✅ Pagination component
- ✅ Filter components
- ✅ Chart components (Portfolio, Account allocation)

#### Navigation & Layout
- ✅ Navbar functionality
- ✅ Session management components
- ✅ Responsive design validation

### 4. Integration Tests

#### End-to-End Workflows
- ✅ User registration and login flow
- ✅ Complete trading workflow (Buy → Journal → Sell → Analysis)
- ✅ Multi-account portfolio management
- ✅ Strategy creation and sharing
- ✅ Market data integration workflow

#### Cross-Component Integration
- ✅ Transaction creation → Portfolio update
- ✅ Journal entry → Transaction linking
- ✅ Strategy → Journal entry association
- ✅ Account switching → Data filtering

### 5. Performance Tests

#### Response Time Validation
- ✅ API endpoints respond within acceptable limits
- ✅ Database queries are optimized
- ✅ Cache effectiveness measurement
- ✅ Concurrent user simulation

#### Load Testing
- ✅ Multiple simultaneous transactions
- ✅ Large dataset handling
- ✅ Memory usage monitoring
- ✅ Database connection pooling

### 6. Security Tests

#### Authentication & Authorization
- ✅ Secure password handling
- ✅ Session timeout functionality
- ✅ User data isolation
- ✅ API endpoint protection

#### Data Security
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Input sanitization

## 🔧 Test Configuration

### Environment Setup

Create `.env.test` file for test-specific configuration:
```env
# Test Database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/test_trading_journal"

# Test Configuration
NODE_ENV="test"
NEXTAUTH_SECRET="test-secret-key-for-testing"
NEXTAUTH_URL="http://localhost:3000"
TCBS_API_URL="https://apipubaws.tcbs.com.vn"
STOCK_PRICE_CACHE_DURATION=3600000
```

### Jest Configuration

The application uses Jest with the following configuration:
- **Test Environment**: jsdom for React component testing
- **Coverage Threshold**: 70% for branches, functions, lines, and statements
- **Setup Files**: Automatic mocking of Next.js and NextAuth
- **Module Mapping**: Support for absolute imports

### Test Database Setup

1. **Create Test Database**:
```sql
CREATE DATABASE test_trading_journal;
CREATE USER test WITH ENCRYPTED PASSWORD 'test';
GRANT ALL PRIVILEGES ON DATABASE test_trading_journal TO test;
```

2. **Run Migrations**:
```bash
npm run test:db:setup
npm run test:db:migrate
```

3. **Seed Test Data**:
```bash
npm run test:db:seed
```

## 📊 Test Reports

### Coverage Reports
```bash
npm run test:coverage
```
Generates detailed coverage reports in `coverage/` directory.

### Migration Test Reports
```bash
npm run test:db-migration
```
Generates detailed migration reports in `logs/migration-test-report.json`.

### Performance Reports
Performance metrics are logged during test execution and saved to test reports.

## 🚨 Troubleshooting Tests

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Verify test database exists
psql -U test -d test_trading_journal -c "\dt"
```

#### Test Failures After Database Migration
1. Run the complete migration test suite:
```bash
npm run test:db-migration
```

2. Check the generated report in `logs/migration-test-report.json`

3. Fix any schema or data issues identified

4. Re-run specific test categories:
```bash
npm run test:api
npm run test:components
```

#### Mock Issues
If you encounter mocking issues:
1. Clear Jest cache: `npx jest --clearCache`
2. Restart test runner: `npm run test:watch`
3. Check mock configurations in `tests/setup/jest.setup.js`

### Test Data Cleanup
```bash
# Clean all test data
npm run test:db:clean

# Reset test database
npx prisma migrate reset --force
```

## ✅ Pre-Deployment Checklist

Before deploying after a database environment change:

1. **Run Complete Test Suite**:
```bash
npm run test:db-migration
```

2. **Verify All Tests Pass**:
- [ ] Database connectivity ✅
- [ ] Schema integrity ✅
- [ ] API functionality ✅
- [ ] Performance benchmarks ✅
- [ ] Security features ✅

3. **Check Test Coverage**:
```bash
npm run test:coverage
```
Ensure coverage meets the 70% threshold.

4. **Run Production Build Test**:
```bash
npm run build
npm start
```

5. **Validate Environment Variables**:
- [ ] DATABASE_URL is correctly set
- [ ] NEXTAUTH_SECRET is configured
- [ ] TCBS_API_URL is accessible
- [ ] Cache configuration is appropriate

## 🎯 Success Criteria

Your database migration is successful when:

✅ **All migration tests pass** (100% success rate)
✅ **API response times** meet performance benchmarks
✅ **Security tests** validate data isolation and protection
✅ **Integration tests** confirm end-to-end workflows
✅ **No data corruption** or relationship issues
✅ **Cache system** functions correctly
✅ **Authentication** works as expected

## 📞 Support

If tests fail or you encounter issues:

1. Check the detailed test report in `logs/migration-test-report.json`
2. Review the troubleshooting section above
3. Verify your database configuration and environment variables
4. Ensure all dependencies are properly installed
5. Check the application logs for additional error details

---

**Remember**: A successful test run means your application is ready for production deployment! 🚀 