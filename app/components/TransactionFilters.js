'use client';

import { useState } from 'react';

export default function TransactionFilters({ filters, onFilterChange, onResetFilters }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'sortBy' && value === 'transactionDate') return false;
      if (key === 'sortOrder' && value === 'desc') return false;
      return value !== '';
    });
  };

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <div 
        className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="font-medium flex items-center space-x-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span>Bộ lọc {hasActiveFilters() && <span className="text-blue-600 text-sm">(Đang áp dụng)</span>}</span>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Ticker filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã cổ phiếu
                </label>
                <input
                  type="text"
                  name="ticker"
                  placeholder="VNM, FPT, ..."
                  value={localFilters.ticker}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
              
              {/* Transaction type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại giao dịch
                </label>
                <select
                  name="type"
                  value={localFilters.type}
                  onChange={handleChange}
                  className="input-field w-full"
                >
                  <option value="">Tất cả</option>
                  <option value="BUY">Mua</option>
                  <option value="SELL">Bán</option>
                </select>
              </div>
              
              {/* Date range filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ ngày
                </label>
                <input
                  type="date"
                  name="dateFrom"
                  value={localFilters.dateFrom}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Đến ngày
                </label>
                <input
                  type="date"
                  name="dateTo"
                  value={localFilters.dateTo}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
              
              {/* Amount range filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá thấp nhất
                </label>
                <input
                  type="number"
                  name="minAmount"
                  placeholder="0"
                  value={localFilters.minAmount}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá cao nhất
                </label>
                <input
                  type="number"
                  name="maxAmount"
                  placeholder="100000000"
                  value={localFilters.maxAmount}
                  onChange={handleChange}
                  className="input-field w-full"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onResetFilters}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Xóa bộ lọc
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
              >
                Áp dụng
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 