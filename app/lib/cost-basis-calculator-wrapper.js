/**
 * ES Module wrapper cho cost-basis-calculator
 * Wrapper này cho phép import ES modules từ code CommonJS
 */

// Import trực tiếp từ CommonJS module
const calculator = require('./cost-basis-calculator');

// Re-export với ES module syntax
export const {
  processBuyTransaction,
  processSellTransaction,
  getCurrentAvgCost,
  calculatePortfolioWithNewCostBasis
} = calculator; 