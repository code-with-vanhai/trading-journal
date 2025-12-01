import React, { useState, useEffect } from 'react';
import { Spinner } from './ui/Spinner';
import Pagination from './Pagination';

export default function Portfolio({ 
  stockAccountId = null, 
  includeAdjustments = true,
  onPortfolioUpdate = null 
}) {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Sorting states
  const [sortBy, setSortBy] = useState('totalCost');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (stockAccountId) params.append('stockAccountId', stockAccountId);
      if (includeAdjustments) params.append('includeAdjustments', 'true');
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      
      const url = `/api/portfolio${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio data');
      }
      
      const data = await response.json();
      setPortfolio(data.portfolio || []);
      setTotalItems(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
      
      // Notify parent component if callback provided
      if (onPortfolioUpdate) {
        onPortfolioUpdate(data);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [stockAccountId, includeAdjustments, currentPage, pageSize, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(parseInt(newPageSize, 10));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <Spinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
        Error: {error}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 p-4 text-center backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl border border-gray-200/50 dark:border-white/10">
        Bạn chưa có cổ phiếu nào trong danh mục đầu tư.
      </div>
    );
  }

  // Calculate total portfolio value for current page
  const currentPageValue = portfolio.reduce((sum, position) => 
    sum + (position.quantity * position.avgCost), 0);

  return (
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 dark:border-white/10">
      <div className="p-4 border-b border-gray-200/50 dark:border-white/10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danh Mục Đầu Tư</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tổng giá trị: {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(currentPageValue)} (Trang {currentPage}/{totalPages})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hiển thị:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('ticker')}
              >
                Mã CP {getSortIcon('ticker')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('quantity')}
              >
                Số Lượng {getSortIcon('quantity')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('avgCost')}
              >
                Giá TB {getSortIcon('avgCost')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleSort('totalCost')}
              >
                Tổng Giá Trị {getSortIcon('totalCost')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                % Danh Mục
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {portfolio.map((position, index) => {
              const positionValue = position.quantity * position.avgCost;
              const percentage = currentPageValue > 0 ? (positionValue / currentPageValue) * 100 : 0;
              
              return (
                <tr 
                  key={`${position.ticker}-${position.stockAccountId}`} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                    {position.ticker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {position.quantity?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {position.avgCost ? new Intl.NumberFormat('vi-VN').format(position.avgCost.toFixed(0)) : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                    {new Intl.NumberFormat('vi-VN').format(positionValue.toFixed(0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900 dark:text-gray-100">{percentage.toFixed(2)}%</span>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/50">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 