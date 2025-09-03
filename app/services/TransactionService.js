/**
 * 💼 TRANSACTION SERVICE
 * Business logic layer cho transaction management
 * 
 * Responsibilities:
 * - Transaction CRUD operations
 * - Business rule validation
 * - FIFO cost basis calculations
 * - Data consistency management
 * - Cache invalidation
 * - Error handling
 */

import db, { withRetry, transaction } from '../lib/database.js';
import logger from '../lib/production-logger.js';
import enhancedOptimizer from '../lib/enhanced-query-optimizer.js';
import { processBuyTransaction, processSellTransaction } from '../lib/cost-basis-calculator-wrapper.js';
import { sanitizeError } from '../lib/error-handler.js';

class TransactionService {
  constructor() {
    this.logger = logger;
    this.cache = enhancedOptimizer;
  }

  /**
   * Create new transaction với full business logic
   */
  async createTransaction(userId, transactionData, options = {}) {
    const startTime = performance.now();
    
    try {
      logger.debug('Creating transaction', { userId, ticker: transactionData.ticker });
      
      // 1. Validate input data
      const validatedData = await this.validateTransactionData(transactionData, userId);
      
      // 2. Check for duplicate transactions
      if (!options.skipDuplicateCheck) {
        await this.checkDuplicateTransaction(validatedData, userId);
      }
      
      // 3. Process with database transaction for consistency
      const result = await transaction(async (tx) => {
        // 3a. Create transaction record
        const newTransaction = await this.createTransactionRecord(tx, userId, validatedData);
        
        // 3b. Process cost basis calculations
        const costBasisResult = await this.processCostBasis(
          tx, 
          userId, 
          newTransaction, 
          validatedData
        );
        
        // 3c. Update related records if needed
        await this.updateRelatedRecords(tx, userId, newTransaction);
        
        return {
          transaction: newTransaction,
          costBasis: costBasisResult
        };
      });
      
      // 4. Invalidate cache
      this.invalidateRelatedCaches(userId, validatedData);
      
      // 5. Log success
      const duration = performance.now() - startTime;
      logger.info('Transaction created successfully', {
        userId,
        transactionId: result.transaction.id,
        ticker: validatedData.ticker,
        type: validatedData.type,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return result;
      
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error('Transaction creation failed', {
        userId,
        error: error.message,
        ticker: transactionData.ticker,
        duration: `${duration.toFixed(2)}ms`,
        stack: error.stack
      });
      
      throw this.createServiceError('TRANSACTION_CREATE_FAILED', error);
    }
  }

  /**
   * Get transactions với filtering và pagination
   */
  async getTransactions(userId, filters = {}, pagination = {}) {
    try {
      logger.debug('Fetching transactions', { userId, filters, pagination });
      
      // Use enhanced query optimizer
      const result = await this.cache.getOptimizedTransactions(
        userId,
        filters,
        pagination
      );
      
      // Add profit statistics
      const profitStats = await this.calculateProfitStatistics(
        userId, 
        filters,
        result.transactions
      );
      
      return {
        ...result,
        profitStats
      };
      
    } catch (error) {
      logger.error('Failed to fetch transactions', {
        userId,
        error: error.message,
        filters
      });
      
      throw this.createServiceError('TRANSACTION_FETCH_FAILED', error);
    }
  }

  /**
   * Update transaction với business logic validation
   */
  async updateTransaction(userId, transactionId, updateData) {
    try {
      logger.debug('Updating transaction', { userId, transactionId });
      
      // 1. Validate ownership
      const existingTransaction = await this.getTransactionById(userId, transactionId);
      if (!existingTransaction) {
        throw new Error('Transaction not found or access denied');
      }
      
      // 2. Validate update data
      const validatedData = await this.validateTransactionData(updateData, userId, true);
      
      // 3. Process update in transaction
      const result = await transaction(async (tx) => {
        // Check if cost basis recalculation is needed
        const needsRecalculation = this.needsCostBasisRecalculation(
          existingTransaction, 
          validatedData
        );
        
        if (needsRecalculation) {
          // Recalculate cost basis for affected positions
          await this.recalculateCostBasis(tx, userId, existingTransaction, validatedData);
        }
        
        // Update transaction record
        const updatedTransaction = await tx.transaction.update({
          where: { 
            id: transactionId,
            userId // Ensure user ownership
          },
          data: {
            ...validatedData,
            updatedAt: new Date()
          }
        });
        
        return updatedTransaction;
      });
      
      // 4. Invalidate cache
      this.invalidateRelatedCaches(userId, validatedData);
      
      logger.info('Transaction updated successfully', {
        userId,
        transactionId,
        changes: Object.keys(validatedData)
      });
      
      return result;
      
    } catch (error) {
      logger.error('Transaction update failed', {
        userId,
        transactionId,
        error: error.message
      });
      
      throw this.createServiceError('TRANSACTION_UPDATE_FAILED', error);
    }
  }

  /**
   * Delete transaction với cascade handling
   */
  async deleteTransaction(userId, transactionId) {
    try {
      logger.debug('Deleting transaction', { userId, transactionId });
      
      // 1. Get transaction with related data
      const existingTransaction = await this.getTransactionById(userId, transactionId, {
        includeRelated: true
      });
      
      if (!existingTransaction) {
        throw new Error('Transaction not found or access denied');
      }
      
      // 2. Process deletion in transaction
      const result = await transaction(async (tx) => {
        // Delete related records first
        await this.deleteRelatedRecords(tx, transactionId);
        
        // Recalculate cost basis for affected positions
        await this.recalculateCostBasisAfterDeletion(tx, userId, existingTransaction);
        
        // Delete transaction
        await tx.transaction.delete({
          where: { 
            id: transactionId,
            userId
          }
        });
        
        return existingTransaction;
      });
      
      // 3. Invalidate cache
      this.invalidateRelatedCaches(userId, existingTransaction);
      
      logger.info('Transaction deleted successfully', {
        userId,
        transactionId,
        ticker: existingTransaction.ticker
      });
      
      return result;
      
    } catch (error) {
      logger.error('Transaction deletion failed', {
        userId,
        transactionId,
        error: error.message
      });
      
      throw this.createServiceError('TRANSACTION_DELETE_FAILED', error);
    }
  }

  /**
   * Validate transaction data
   */
  async validateTransactionData(data, userId, isUpdate = false) {
    const errors = [];
    
    // Required fields (except for updates)
    if (!isUpdate || data.ticker !== undefined) {
      if (!data.ticker || typeof data.ticker !== 'string') {
        errors.push('Ticker is required and must be a string');
      } else if (!/^[A-Z]{3,5}$/.test(data.ticker.toUpperCase())) {
        errors.push('Ticker must be 3-5 uppercase letters');
      }
    }
    
    if (!isUpdate || data.type !== undefined) {
      if (!['BUY', 'SELL'].includes(data.type)) {
        errors.push('Type must be either BUY or SELL');
      }
    }
    
    if (!isUpdate || data.quantity !== undefined) {
      if (!data.quantity || data.quantity <= 0) {
        errors.push('Quantity must be greater than 0');
      }
    }
    
    if (!isUpdate || data.price !== undefined) {
      if (!data.price || data.price <= 0) {
        errors.push('Price must be greater than 0');
      }
    }
    
    if (!isUpdate || data.transactionDate !== undefined) {
      if (!data.transactionDate) {
        errors.push('Transaction date is required');
      } else {
        const date = new Date(data.transactionDate);
        if (isNaN(date.getTime())) {
          errors.push('Transaction date must be valid');
        } else if (date > new Date()) {
          errors.push('Transaction date cannot be in the future');
        }
      }
    }
    
    // Optional fields validation
    if (data.fee !== undefined && (data.fee < 0 || isNaN(data.fee))) {
      errors.push('Fee must be a non-negative number');
    }
    
    if (data.taxRate !== undefined && (data.taxRate < 0 || data.taxRate > 1)) {
      errors.push('Tax rate must be between 0 and 1');
    }
    
    // Validate stock account ownership
    if (data.stockAccountId) {
      const accountExists = await this.validateStockAccountOwnership(userId, data.stockAccountId);
      if (!accountExists) {
        errors.push('Stock account not found or access denied');
      }
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // Return cleaned data
    return {
      ticker: data.ticker?.toUpperCase(),
      type: data.type,
      quantity: parseFloat(data.quantity),
      price: parseFloat(data.price),
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
      fee: data.fee ? parseFloat(data.fee) : 0,
      taxRate: data.taxRate ? parseFloat(data.taxRate) : 0,
      notes: data.notes?.trim() || null,
      stockAccountId: data.stockAccountId
    };
  }

  /**
   * Process cost basis calculations
   */
  async processCostBasis(tx, userId, transaction, data) {
    try {
      if (data.type === 'BUY') {
        return await processBuyTransaction(
          userId,
          transaction.stockAccountId,
          data.ticker,
          data.quantity,
          data.price,
          data.fee,
          data.transactionDate
        );
      } else if (data.type === 'SELL') {
        const result = await processSellTransaction(
          userId,
          transaction.stockAccountId,
          data.ticker,
          data.quantity,
          data.price,
          data.fee,
          data.taxRate,
          data.transactionDate
        );
        
        // Update calculated P&L in transaction
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { calculatedPl: result.profitOrLoss }
        });
        
        return result;
      }
      
      return null;
    } catch (error) {
      logger.error('Cost basis calculation failed', {
        userId,
        ticker: data.ticker,
        type: data.type,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate profit statistics
   */
  async calculateProfitStatistics(userId, filters, transactions = null) {
    try {
      // Get account fees for the same period
      const accountFeesData = await this.getAccountFeesTotal(userId, filters);
      
      const sellTransactions = transactions 
        ? transactions.filter(tx => tx.type === 'SELL')
        : await this.getSellTransactions(userId, filters);
      
      if (sellTransactions.length === 0) {
        return {
          totalProfitLoss: -accountFeesData.totalAmount,
          profitableTransactions: 0,
          unprofitableTransactions: 0,
          totalTransactions: 0,
          successRate: 0,
          averageProfit: 0,
          totalProfit: 0,
          totalLoss: 0,
          accountFeesTotal: accountFeesData.totalAmount,
          grossProfitLoss: 0
        };
      }
      
      const profitLosses = sellTransactions.map(tx => tx.calculatedPl || 0);
      const grossProfitLoss = profitLosses.reduce((sum, pl) => sum + pl, 0);
      const totalProfitLoss = grossProfitLoss - accountFeesData.totalAmount;
      
      const profitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) > 0).length;
      const unprofitableTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) < 0).length;
      const breakEvenTransactions = sellTransactions.filter(tx => (tx.calculatedPl || 0) === 0).length;
      
      const totalProfit = sellTransactions
        .filter(tx => (tx.calculatedPl || 0) > 0)
        .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
        
      const totalLoss = sellTransactions
        .filter(tx => (tx.calculatedPl || 0) < 0)
        .reduce((sum, tx) => sum + (tx.calculatedPl || 0), 0);
      
      const successRate = sellTransactions.length > 0 ? (profitableTransactions / sellTransactions.length) * 100 : 0;
      const averageProfit = sellTransactions.length > 0 ? totalProfitLoss / sellTransactions.length : 0;
      
      return {
        totalProfitLoss: Math.round(totalProfitLoss),
        profitableTransactions,
        unprofitableTransactions,
        breakEvenTransactions,
        totalTransactions: sellTransactions.length,
        successRate: Math.round(successRate * 100) / 100,
        averageProfit: Math.round(averageProfit),
        totalProfit: Math.round(totalProfit),
        totalLoss: Math.round(totalLoss),
        accountFeesTotal: Math.round(accountFeesData.totalAmount),
        grossProfitLoss: Math.round(grossProfitLoss)
      };
      
    } catch (error) {
      logger.error('Profit statistics calculation failed', {
        userId,
        error: error.message
      });
      
      // Return default stats on error
      return {
        totalProfitLoss: 0,
        profitableTransactions: 0,
        unprofitableTransactions: 0,
        totalTransactions: 0,
        successRate: 0,
        averageProfit: 0,
        totalProfit: 0,
        totalLoss: 0,
        accountFeesTotal: 0,
        grossProfitLoss: 0
      };
    }
  }

  /**
   * Helper methods
   */
  
  async getTransactionById(userId, transactionId, options = {}) {
    const select = options.includeRelated ? {
      id: true,
      ticker: true,
      type: true,
      quantity: true,
      price: true,
      transactionDate: true,
      fee: true,
      taxRate: true,
      calculatedPl: true,
      notes: true,
      stockAccountId: true,
      journalEntry: true
    } : undefined;
    
    return await db.transaction.findFirst({
      where: { 
        id: transactionId,
        userId
      },
      select
    });
  }

  async validateStockAccountOwnership(userId, stockAccountId) {
    const account = await db.stockAccount.findFirst({
      where: {
        id: stockAccountId,
        userId
      }
    });
    return !!account;
  }

  async checkDuplicateTransaction(data, userId) {
    const existing = await db.transaction.findFirst({
      where: {
        userId,
        ticker: data.ticker,
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        transactionDate: data.transactionDate
      }
    });
    
    if (existing) {
      throw new Error('Duplicate transaction detected');
    }
  }

  async createTransactionRecord(tx, userId, data) {
    return await tx.transaction.create({
      data: {
        userId,
        ...data
      }
    });
  }

  async getAccountFeesTotal(userId, filters) {
    const whereClause = {
      userId,
      isActive: true
    };

    if (filters.stockAccountId) {
      whereClause.stockAccountId = filters.stockAccountId;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.feeDate = {};
      if (filters.dateFrom) {
        whereClause.feeDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.feeDate.lte = endDate;
      }
    }

    try {
      const result = await db.accountFee.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      });

      return {
        totalAmount: result._sum.amount || 0,
        totalCount: result._count.id || 0
      };
    } catch (error) {
      logger.error('Account fees calculation failed', error);
      return {
        totalAmount: 0,
        totalCount: 0
      };
    }
  }

  invalidateRelatedCaches(userId, transactionData) {
    this.cache.invalidateRelatedCache('transaction', userId);
    this.cache.invalidateRelatedCache('portfolio', userId);
    
    if (transactionData.stockAccountId) {
      this.cache.invalidateRelatedCache('transaction', transactionData.stockAccountId);
      this.cache.invalidateRelatedCache('portfolio', transactionData.stockAccountId);
    }
  }

  createServiceError(code, originalError) {
    const error = new Error(originalError.message);
    error.code = code;
    error.originalError = originalError;
    error.isServiceError = true;
    return error;
  }

  // Additional helper methods would be implemented here...
  async updateRelatedRecords(tx, userId, transaction) {
    // Implement any related record updates
    return true;
  }

  async deleteRelatedRecords(tx, transactionId) {
    // Delete journal entries, etc.
    await tx.journalEntry.deleteMany({
      where: { transactionId }
    });
  }

  needsCostBasisRecalculation(oldTransaction, newData) {
    const criticalFields = ['ticker', 'quantity', 'price', 'transactionDate', 'type'];
    return criticalFields.some(field => 
      newData[field] !== undefined && newData[field] !== oldTransaction[field]
    );
  }

  async recalculateCostBasis(tx, userId, oldTransaction, newData) {
    // Implement cost basis recalculation logic
    logger.debug('Cost basis recalculation needed', { userId, transactionId: oldTransaction.id });
  }

  async recalculateCostBasisAfterDeletion(tx, userId, deletedTransaction) {
    // Implement cost basis recalculation after deletion
    logger.debug('Cost basis recalculation after deletion', { userId, ticker: deletedTransaction.ticker });
  }

  async getSellTransactions(userId, filters) {
    return await db.transaction.findMany({
      where: {
        userId,
        type: 'SELL',
        ...filters
      },
      select: {
        calculatedPl: true
      }
    });
  }
}

// Export singleton instance
const transactionService = new TransactionService();
export default transactionService;





