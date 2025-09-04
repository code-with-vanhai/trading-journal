/**
 * Enhanced Dashboard Component Tests
 * Simple tests without external dependencies
 */

const fs = require('fs');
const path = require('path');

describe('Enhanced Dashboard Component', () => {
  const componentPath = path.join(process.cwd(), 'app/components/EnhancedDashboard.js');
  let componentContent;

  beforeAll(() => {
    if (fs.existsSync(componentPath)) {
      componentContent = fs.readFileSync(componentPath, 'utf8');
    }
  });

  test('Enhanced Dashboard component file exists', () => {
    expect(fs.existsSync(componentPath)).toBe(true);
  });

  test('Component exports EnhancedDashboard as default', () => {
    expect(componentContent).toContain('export default EnhancedDashboard');
  });

  test('Component includes required tab components', () => {
    const requiredComponents = [
      'OverviewTab',
      'RiskAnalysisTab', 
      'BenchmarkTab',
      'SectorsTab',
      'PerformanceTab'
    ];

    requiredComponents.forEach(component => {
      expect(componentContent).toContain(component);
    });
  });

  test('Component includes RiskGauge component', () => {
    expect(componentContent).toContain('RiskGauge');
    expect(componentContent).toContain('const RiskGauge = ({ riskScore })');
  });

  test('Component includes proper tab configuration', () => {
    const expectedTabs = [
      'overview',
      'risk', 
      'benchmark',
      'sectors',
      'performance'
    ];

    expectedTabs.forEach(tab => {
      expect(componentContent).toContain(`id: '${tab}'`);
    });
  });

  test('Component includes proper API calls', () => {
    const expectedAPICalls = [
      'type=summary',
      'type=risk-metrics',
      'type=benchmark-comparison',
      'type=sector-analysis',
      'type=performance'
    ];

    expectedAPICalls.forEach(apiCall => {
      expect(componentContent).toContain(apiCall);
    });
  });

  test('Component includes proper error handling', () => {
    expect(componentContent).toContain('setError');
    expect(componentContent).toContain('catch');
    expect(componentContent).toContain('error');
  });

  test('Component includes loading states', () => {
    expect(componentContent).toContain('isLoading');
    expect(componentContent).toContain('LoadingSkeleton');
    expect(componentContent).toContain('setIsLoading');
  });

  test('Component includes proper formatting functions', () => {
    expect(componentContent).toContain('formatCurrency');
    expect(componentContent).toContain('formatPercent');
    expect(componentContent).toContain('toLocaleString');
  });

  test('Component includes Recharts components', () => {
    const rechartComponents = [
      'LineChart',
      'AreaChart', 
      'BarChart',
      'PieChart',
      'ComposedChart',
      'ResponsiveContainer'
    ];

    rechartComponents.forEach(component => {
      expect(componentContent).toContain(component);
    });
  });
});

// Simple component structure validation
describe('Component Structure Validation', () => {
  test('Analysis page uses EnhancedDashboard', () => {
    const analysisPagePath = path.join(process.cwd(), 'app/analysis/page.js');
    
    if (fs.existsSync(analysisPagePath)) {
      const pageContent = fs.readFileSync(analysisPagePath, 'utf8');
      expect(pageContent).toContain('EnhancedDashboard');
      expect(pageContent).toContain("import('../components/EnhancedDashboard')");
    }
  });

  test('Enhanced header structure in analysis page', () => {
    const analysisPagePath = path.join(process.cwd(), 'app/analysis/page.js');
    
    if (fs.existsSync(analysisPagePath)) {
      const pageContent = fs.readFileSync(analysisPagePath, 'utf8');
      expect(pageContent).toContain('Phân Tích Danh Mục Nâng Cao');
      expect(pageContent).toContain('sticky top-0');
      expect(pageContent).toContain('bg-gray-50');
    }
  });
});