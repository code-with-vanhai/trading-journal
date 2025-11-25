/**
 * Transaction Stats Server Component
 * Renders static transaction summary statistics
 * No client-side interactivity needed - perfect for Server Component
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import db from '../../lib/database.js';

export default async function TransactionStats({ filters = {} }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return null;
  }

  try {
    // Build where clause from filters
    const whereClause = {
      userId: session.user.id,
    };

    if (filters.ticker) {
      whereClause.ticker = filters.ticker;
    }

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.transactionDate = {};
      if (filters.dateFrom) {
        whereClause.transactionDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.transactionDate.lte = endDate;
      }
    }

    // Fetch transaction stats server-side
    const [totalTransactions, buyCount, sellCount] = await Promise.all([
      db.transaction.count({ where: whereClause }),
      db.transaction.count({ 
        where: { ...whereClause, type: 'BUY' } 
      }),
      db.transaction.count({ 
        where: { ...whereClause, type: 'SELL' } 
      })
    ]);

    // Calculate profit/loss from SELL transactions
    const sellTransactions = await db.transaction.findMany({
      where: {
        ...whereClause,
        type: 'SELL',
        calculatedPl: { not: null }
      },
      select: {
        calculatedPl: true
      }
    });

    const totalProfitLoss = sellTransactions.reduce(
      (sum, tx) => sum + (tx.calculatedPl || 0), 
      0
    );

    const profitableTrades = sellTransactions.filter(
      tx => (tx.calculatedPl || 0) > 0
    ).length;

    const winRate = sellTransactions.length > 0 
      ? (profitableTrades / sellTransactions.length) * 100 
      : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng Giao Dịch</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {totalTransactions}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mua / Bán</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {buyCount} / {sellCount}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng Lãi/Lỗ</h3>
          <p className={`text-2xl font-bold ${
            totalProfitLoss >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {totalProfitLoss >= 0 ? '+' : ''}
            {totalProfitLoss.toLocaleString('vi-VN')} ₫
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tỷ Lệ Thắng</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {winRate.toFixed(1)}%
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Không thể tải thống kê giao dịch</p>
      </div>
    );
  }
}

