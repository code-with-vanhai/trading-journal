/**
 * Portfolio Stats Server Component
 * Renders static portfolio summary statistics
 * No client-side interactivity needed - perfect for Server Component
 */

import db from '../../lib/database.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

export default async function PortfolioStats({ stockAccountId = null, includeAdjustments = false }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return null;
  }

  try {
    // Fetch portfolio data server-side
    const portfolioService = (await import('../../services/PortfolioService.js')).default;
    const portfolioData = await portfolioService.getPortfolio(session.user.id, {
      stockAccountId,
      includeAdjustments,
      includeMarketData: false,
      includeMetrics: true
    });

    const summary = portfolioData.summary || {};

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng Giá Trị</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.totalValue?.toLocaleString('vi-VN') || '0'} ₫
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tổng Đầu Tư</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.totalCost?.toLocaleString('vi-VN') || '0'} ₫
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Lãi/Lỗ Chưa Thực Hiện</h3>
          <p className={`text-2xl font-bold ${
            (summary.unrealizedPL || 0) >= 0 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(summary.unrealizedPL || 0) >= 0 ? '+' : ''}
            {(summary.unrealizedPL || 0).toLocaleString('vi-VN')} ₫
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Số Vị Thế</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {summary.positionCount || 0}
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching portfolio stats:', error);
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Không thể tải thống kê danh mục</p>
      </div>
    );
  }
}

