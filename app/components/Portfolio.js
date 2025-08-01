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
      <div className="text-red-500 p-4 bg-red-50 rounded">
        Error: {error}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="text-gray-500 p-4 text-center">
        Bạn chưa có cổ phiếu nào trong danh mục đầu tư.
      </div>
    );
  }

  // Calculate total portfolio value for current page
  const currentPageValue = portfolio.reduce((sum, position) => 
    sum + (position.quantity * position.avgCost), 0);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Danh Mục Đầu Tư</h2>
            <p className="text-sm text-gray-500">
              Tổng giá trị: {new Intl.NumberFormat('vi-VN', { 
                style: 'currency', 
                currency: 'VND' 
              }).format(currentPageValue)} (Trang {currentPage}/{totalPages})
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600 font-medium">Hiển thị:</label>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('ticker')}
              >
                Mã CP {getSortIcon('ticker')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantity')}
              >
                Số Lượng {getSortIcon('quantity')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgCost')}
              >
                Giá TB {getSortIcon('avgCost')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalCost')}
              >
                Tổng Giá Trị {getSortIcon('totalCost')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Danh Mục
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {portfolio.map((position) => {
              const positionValue = position.quantity * position.avgCost;
              const percentage = currentPageValue > 0 ? (positionValue / currentPageValue) * 100 : 0;
              
              return (
                <tr key={`${position.ticker}-${position.stockAccountId}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {position.ticker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {position.quantity?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {position.avgCost ? new Intl.NumberFormat('vi-VN').format(position.avgCost.toFixed(0)) : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {new Intl.NumberFormat('vi-VN').format(positionValue.toFixed(0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {percentage.toFixed(2)}%
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
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
        <div className="p-6 border-t border-gray-200 bg-gray-50">
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