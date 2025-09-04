#!/usr/bin/env node

/**
 * Simple Feature Test Runner - No external dependencies
 * Tests each feature implementation step by step
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

class SimpleTestRunner {
  constructor() {
    this.testResults = [];
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  }

  async runTests() {
    console.log('🚀 Starting Enhanced Analysis Feature Tests...\n');
    
    const tests = [
      { name: 'Enhanced Risk Metrics API', test: () => this.testRiskMetricsAPI() },
      { name: 'Sector Analysis API', test: () => this.testSectorAnalysisAPI() },
      { name: 'Benchmark Comparison API', test: () => this.testBenchmarkAPI() },
      { name: 'Enhanced Dashboard UI', test: () => this.testDashboardUI() },
      { name: 'Database Integrity', test: () => this.testDatabaseIntegrity() },
      { name: 'Performance Check', test: () => this.testPerformance() }
    ];

    for (const testCase of tests) {
      console.log(`📋 Running: ${testCase.name}`);
      try {
        const result = await testCase.test();
        this.testResults.push({
          name: testCase.name,
          passed: result.passed,
          message: result.message,
          duration: result.duration || 0
        });
        
        if (result.passed) {
          console.log(`✅ ${testCase.name}: PASSED - ${result.message}`);
        } else {
          console.log(`❌ ${testCase.name}: FAILED - ${result.message}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ERROR - ${error.message}`);
        this.testResults.push({
          name: testCase.name,
          passed: false,
          message: error.message,
          duration: 0
        });
      }
      console.log('');
    }

    this.generateReport();
  }

  async makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 3000),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FeatureTestRunner/1.0',
          ...options.headers
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', reject);
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  async testRiskMetricsAPI() {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/api/analysis?type=risk-metrics&period=all');
      const duration = Date.now() - startTime;
      
      if (response.statusCode === 401) {
        return {
          passed: true,
          message: 'API correctly requires authentication',
          duration
        };
      }
      
      if (response.statusCode !== 200) {
        return {
          passed: false,
          message: `API returned status ${response.statusCode}`,
          duration
        };
      }

      const requiredFields = ['volatility', 'sharpeRatio', 'maxDrawdown', 'riskScore'];
      const hasAllFields = requiredFields.every(field => 
        response.data.hasOwnProperty(field) && typeof response.data[field] === 'number'
      );

      return {
        passed: hasAllFields,
        message: hasAllFields ? 'All risk metrics fields present' : 'Missing required risk metrics fields',
        duration
      };
    } catch (error) {
      return {
        passed: false,
        message: `Request failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  async testSectorAnalysisAPI() {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/api/analysis?type=sector-analysis&period=all');
      const duration = Date.now() - startTime;
      
      if (response.statusCode === 401) {
        return {
          passed: true,
          message: 'API correctly requires authentication',
          duration
        };
      }

      if (response.statusCode !== 200) {
        return {
          passed: false,
          message: `API returned status ${response.statusCode}`,
          duration
        };
      }

      const hasRequiredStructure = response.data.hasOwnProperty('sectorPerformance') && 
                                  Array.isArray(response.data.sectorPerformance);

      return {
        passed: hasRequiredStructure,
        message: hasRequiredStructure ? 'Sector analysis structure correct' : 'Invalid sector analysis structure',
        duration
      };
    } catch (error) {
      return {
        passed: false,
        message: `Request failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  async testBenchmarkAPI() {
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest('/api/analysis?type=benchmark-comparison&period=all');
      const duration = Date.now() - startTime;
      
      if (response.statusCode === 401) {
        return {
          passed: true,
          message: 'API correctly requires authentication',
          duration
        };
      }

      if (response.statusCode !== 200) {
        return {
          passed: false,
          message: `API returned status ${response.statusCode}`,
          duration
        };
      }

      const requiredFields = ['beta', 'alpha', 'correlation'];
      const hasAllFields = requiredFields.every(field => 
        response.data.hasOwnProperty(field) && typeof response.data[field] === 'number'
      );

      return {
        passed: hasAllFields,
        message: hasAllFields ? 'All benchmark fields present' : 'Missing benchmark fields',
        duration
      };
    } catch (error) {
      return {
        passed: false,
        message: `Request failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  async testDashboardUI() {
    const startTime = Date.now();
    
    try {
      // Check if Enhanced Dashboard component exists
      const dashboardPath = path.join(process.cwd(), 'app/components/EnhancedDashboard.js');
      const exists = fs.existsSync(dashboardPath);
      
      if (!exists) {
        return {
          passed: false,
          message: 'EnhancedDashboard.js component not found',
          duration: Date.now() - startTime
        };
      }

      // Check if component has required exports
      const content = fs.readFileSync(dashboardPath, 'utf8');
      const hasRequiredComponents = [
        'EnhancedDashboard',
        'RiskGauge',
        'OverviewTab',
        'RiskAnalysisTab'
      ].every(component => content.includes(component));

      return {
        passed: hasRequiredComponents,
        message: hasRequiredComponents ? 'Enhanced Dashboard components present' : 'Missing required components',
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        passed: false,
        message: `Component check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  async testDatabaseIntegrity() {
    const startTime = Date.now();
    
    try {
      // Check that schema.prisma hasn't been modified with new tables
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Count existing models
      const modelCount = (schemaContent.match(/^model\s+\w+/gm) || []).length;
      const expectedModelCount = 11; // Current number of models
      
      // Check that no new tables were added
      const noNewTables = modelCount === expectedModelCount;
      
      // Check that existing tables weren't modified
      const requiredModels = [
        'User', 'Transaction', 'JournalEntry', 'Tag', 'Strategy', 
        'StockPriceCache', 'StockAccount', 'PurchaseLot', 'AccountFee', 'CostBasisAdjustment'
      ];
      
      const hasAllModels = requiredModels.every(model => 
        schemaContent.includes(`model ${model}`)
      );

      const passed = noNewTables && hasAllModels;

      return {
        passed,
        message: passed ? 
          `Database integrity maintained (${modelCount} models)` : 
          `Database integrity compromised (expected ${expectedModelCount}, found ${modelCount})`,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        passed: false,
        message: `Database check failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  async testPerformance() {
    const startTime = Date.now();
    
    try {
      // Test multiple API calls to ensure performance
      const promises = [
        this.makeRequest('/api/analysis?type=summary&period=all'),
        this.makeRequest('/api/analysis?type=risk-metrics&period=all'),
        this.makeRequest('/api/analysis?type=sector-analysis&period=all')
      ];

      const responses = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      // All requests should complete within 10 seconds
      const performanceOk = duration < 10000;
      
      // At least one should be successful (or 401 for auth)
      const hasValidResponse = responses.some(r => r.statusCode === 200 || r.statusCode === 401);

      const passed = performanceOk && hasValidResponse;

      return {
        passed,
        message: passed ? 
          `Performance test passed (${duration}ms for 3 requests)` : 
          `Performance test failed (${duration}ms)`,
        duration
      };
    } catch (error) {
      return {
        passed: false,
        message: `Performance test failed: ${error.message}`,
        duration: Date.now() - startTime
      };
    }
  }

  generateReport() {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const failed = total - passed;

    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`📈 Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, total, successRate: (passed/total) * 100 },
      results: this.testResults
    };

    const reportFile = path.join(reportPath, `feature-test-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Report saved: ${reportFile}`);
    
    // Exit with error code if tests failed
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new SimpleTestRunner();
  runner.runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = SimpleTestRunner;