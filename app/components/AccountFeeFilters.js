'use client';

import { useState, useEffect } from 'react';

const FEE_TYPE_OPTIONS = [
  { value: 'CUSTODY_FEE', label: 'Phí lưu ký' },
  { value: 'ADVANCE_SELLING_FEE', label: 'Phí ứng trước' },
  { value: 'ACCOUNT_MAINTENANCE', label: 'Phí duy trì' },
  { value: 'TRANSFER_FEE', label: 'Phí chuyển nhượng' },
  { value: 'DIVIDEND_TAX', label: 'Thuế cổ tức' },
  { value: 'INTEREST_FEE', label: 'Phí lãi vay' },
  { value: 'DATA_FEED_FEE', label: 'Phí dữ liệu' },
  { value: 'SMS_NOTIFICATION_FEE', label: 'Phí SMS' },
  { value: 'STATEMENT_FEE', label: 'Phí sao kê' },
  { value: 'WITHDRAWAL_FEE', label: 'Phí rút tiền' },
  { value: 'OTHER_FEE', label: 'Phí khác' }
];

export default function AccountFeeFilters({ filters, onFilterChange }) {
  const [stockAccounts, setStockAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Load stock accounts
  useEffect(() => {
    const fetchStockAccounts = async () => {
      try {
        const response = await fetch('/api/stock-accounts');
        if (response.ok) {
          const accounts = await response.json();
          setStockAccounts(accounts);
        }
      } catch (err) {
        console.error('Error fetching stock accounts:', err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchStockAccounts();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      feeType: '',
      stockAccountId: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      search: '',
      sortBy: 'feeDate',
      sortOrder: 'desc'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.feeType) count++;
    if (filters.stockAccountId) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    if (filters.search) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
        <div className="flex items-center gap-4">
          {activeFiltersCount > 0 && (
            <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {activeFiltersCount} bộ lọc đang áp dụng
            </span>
          )}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showAdvancedFilters ? 'Ẩn bộ lọc nâng cao' : 'Hiện bộ lọc nâng cao'}
          </button>
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Fee Type Filter */}
        <div>
          <label htmlFor="feeType" className="block text-sm font-medium text-gray-700 mb-1">
            Loại phí
          </label>
          <select
            id="feeType"
            name="feeType"
            value={filters.feeType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả loại phí</option>
            {FEE_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Account Filter */}
        <div>
          <label htmlFor="stockAccountId" className="block text-sm font-medium text-gray-700 mb-1">
            Tài khoản
          </label>
          <select
            id="stockAccountId"
            name="stockAccountId"
            value={filters.stockAccountId}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoadingAccounts}
          >
            <option value="">Tất cả tài khoản</option>
            {stockAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} {account.brokerName && `(${account.brokerName})`}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            id="dateFrom"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            id="dateTo"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          {/* Search in Description */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm mô tả
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tìm kiếm trong mô tả..."
            />
          </div>

          {/* Min Amount */}
          <div>
            <label htmlFor="minAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền tối thiểu
            </label>
            <input
              type="number"
              id="minAmount"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleInputChange}
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {/* Max Amount */}
          <div>
            <label htmlFor="maxAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Số tiền tối đa
            </label>
            <input
              type="number"
              id="maxAmount"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleInputChange}
              min="0"
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Không giới hạn"
            />
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
            Sắp xếp theo:
          </label>
          <select
            id="sortBy"
            name="sortBy"
            value={filters.sortBy}
            onChange={handleInputChange}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="feeDate">Ngày phí</option>
            <option value="amount">Số tiền</option>
            <option value="feeType">Loại phí</option>
            <option value="createdAt">Ngày tạo</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700">
            Thứ tự:
          </label>
          <select
            id="sortOrder"
            name="sortOrder"
            value={filters.sortOrder}
            onChange={handleInputChange}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Giảm dần</option>
            <option value="asc">Tăng dần</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleClearFilters}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
} 