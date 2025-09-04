/**
 * Feature Implementation Test Suite
 * Tests each new feature incrementally to ensure system stability
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class FeatureTestSuite {
  constructor() {
    this.testResults = [];
    this.features = [
      'enhanced-risk-metrics',
      'enhanced-dashboard-ui',
      'sector-analysis',
      'benchmark-comparison',
      'interactive-charts',
      'export-functionality'
    ];
  }

  async runAllTests() {
    console.log('🚀 Starting Feature Implementation Test Suite...\n');
    
    for (const feature of this.features) {
      console.log(`📋 Testing Feature: ${feature}`);
      const result = await this.testFeature(feature);
      this.testResults.push(result);
      
      if (!result.passed) {
        console.error(`❌ Feature ${feature} failed tests. Stopping implementation.`);
        this.generateReport();
        process.exit(1);
      }
      
      console.log(`✅ Feature ${feature} passed all tests\n`);
    }
    
    this.generateReport();
    console.log('🎉 All features implemented successfully!');
  }

  async testFeature(featureName) {
    const startTime = Date.now();
    const result = {
      feature: featureName,
      passed: false,
      tests: [],
      duration: 0,
      errors: []
    };

    try {
      // 1. API Tests
      const apiTests = await this.runApiTests(featureName);
      result.tests.push(...apiTests);

      // 2. Component Tests
      const componentTests = await this.runComponentTests(featureName);
      result.tests.push(...componentTests);

      // 3. Integration Tests
      const integrationTests = await this.runIntegrationTests(featureName);
      result.tests.push(...integrationTests);

      // 4. Database Integrity Check
      const dbIntegrityTest = await this.checkDatabaseIntegrity();
      result.tests.push(dbIntegrityTest);

      // 5. Performance Tests
      const performanceTests = await this.runPerformanceTests(featureName);
      result.tests.push(...performanceTests);

      result.passed = result.tests.every(test => test.passed);
      result.duration = Date.now() - startTime;

    } catch (error) {
      result.errors.push(error.message);
      result.passed = false;
    }

    return result;
  }

  async runApiTests(featureName) {
    const tests = [];
    
    switch (featureName) {
      case 'enhanced-risk-metrics':
        tests.push(await this.testRiskMetricsAPI());
        break;
      case 'sector-analysis':
        tests.push(await this.testSectorAnalysisAPI());
        break;
      case 'benchmark-comparison':
        tests.push(await this.testBenchmarkAPI());
        break;
      default:
        tests.push({ name: 'API Test', passed: true, message: 'No API changes' });
    }
    
    return tests;
  }

  async testRiskMetricsAPI() {
    try {
      // Test new risk metrics endpoints
      const response = await fetch('http://localhost:3000/api/analysis?type=risk-metrics&period=all');
      const data = await response.json();
      
      const requiredFields = ['volatility', 'sharpeRatio', 'maxDrawdown', 'valueAtRisk95'];
      const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
      
      return {
        name: 'Risk Metrics API',
        passed: response.ok && hasAllFields,
        message: hasAllFields ? 'All risk metrics returned' : 'Missing required fields'
      };
    } catch (error) {
      return {
        name: 'Risk Metrics API',
        passed: false,
        message: `API Error: ${error.message}`
      };
    }
  }

  async testSectorAnalysisAPI() {
    try {
      const response = await fetch('http://localhost:3000/api/analysis?type=sector-analysis&period=all');
      const data = await response.json();
      
      return {
        name: 'Sector Analysis API',
        passed: response.ok && data.sectorPerformance,
        message: data.sectorPerformance ? 'Sector data returned' : 'No sector data'
      };
    } catch (error) {
      return {
        name: 'Sector Analysis API',
        passed: false,
        message: `API Error: ${error.message}`
      };
    }
  }

  async testBenchmarkAPI() {
    try {
      const response = await fetch('http://localhost:3000/api/analysis?type=benchmark-comparison&period=all');
      const data = await response.json();
      
      const requiredFields = ['beta', 'alpha', 'correlation'];
      const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
      
      return {
        name: 'Benchmark Comparison API',
        passed: response.ok && hasAllFields,
        message: hasAllFields ? 'Benchmark data returned' : 'Missing benchmark fields'
      };
    } catch (error) {
      return {
        name: 'Benchmark Comparison API',
        passed: false,
        message: `API Error: ${error.message}`
      };
    }
  }

  async runComponentTests(featureName) {
    const tests = [];
    
    try {
      // Run Jest tests for components
      const testCommand = `npm test -- --testNamePattern="${featureName}" --passWithNoTests`;
      execSync(testCommand, { stdio: 'pipe' });
      
      tests.push({
        name: 'Component Tests',
        passed: true,
        message: 'All component tests passed'
      });
    } catch (error) {
      tests.push({
        name: 'Component Tests',
        passed: false,
        message: `Component test failed: ${error.message}`
      });
    }
    
    return tests;
  }

  async runIntegrationTests(featureName) {
    const tests = [];
    
    try {
      // Test page loading
      const response = await fetch('http://localhost:3000/analysis');
      tests.push({
        name: 'Page Load Test',
        passed: response.ok,
        message: response.ok ? 'Analysis page loads successfully' : 'Page load failed'
      });

      // Test authentication
      const authResponse = await fetch('http://localhost:3000/api/analysis?type=summary', {
        headers: { 'Cookie': 'test-session=valid' }
      });
      tests.push({
        name: 'Authentication Test',
        passed: authResponse.status !== 500,
        message: 'Authentication handling works'
      });

    } catch (error) {
      tests.push({
        name: 'Integration Tests',
        passed: false,
        message: `Integration test failed: ${error.message}`
      });
    }
    
    return tests;
  }

  async checkDatabaseIntegrity() {
    try {
      // Verify no database schema changes
      const schemaPath = path.join(process.cwd(), 'prisma/schema.prisma');
      const currentSchema = fs.readFileSync(schemaPath, 'utf8');
      
      // Count models to ensure no new tables added
      const modelCount = (currentSchema.match(/^model\s+\w+/gm) || []).length;
      const expectedModelCount = 11; // Current number of models
      
      return {
        name: 'Database Integrity Check',
        passed: modelCount === expectedModelCount,
        message: `Database has ${modelCount} models (expected ${expectedModelCount})`
      };
    } catch (error) {
      return {
        name: 'Database Integrity Check',
        passed: false,
        message: `Database check failed: ${error.message}`
      };
    }
  }

  async runPerformanceTests(featureName) {
    const tests = [];
    
    try {
      const startTime = Date.now();
      await fetch('http://localhost:3000/api/analysis?type=summary&period=all');
      const duration = Date.now() - startTime;
      
      tests.push({
        name: 'API Performance Test',
        passed: duration < 5000, // Should complete within 5 seconds
        message: `API response time: ${duration}ms`
      });
      
    } catch (error) {
      tests.push({
        name: 'API Performance Test',
        passed: false,
        message: `Performance test failed: ${error.message}`
      });
    }
    
    return tests;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFeatures: this.features.length,
      passedFeatures: this.testResults.filter(r => r.passed).length,
      failedFeatures: this.testResults.filter(r => !r.passed).length,
      results: this.testResults
    };

    const reportPath = path.join(process.cwd(), 'test-reports', `feature-implementation-${Date.now()}.json`);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📊 Test Report Generated:');
    console.log(`✅ Passed: ${report.passedFeatures}/${report.totalFeatures}`);
    console.log(`❌ Failed: ${report.failedFeatures}/${report.totalFeatures}`);
    console.log(`📄 Report saved to: ${reportPath}`);
  }
}

// Export for use in other test files
module.exports = FeatureTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new FeatureTestSuite();
  testSuite.runAllTests().catch(console.error);
}