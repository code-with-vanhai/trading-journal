'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { calculatePriceStep, roundToValidPrice, isValidPrice } from '../utils/priceStepCalculator';

export default function EditTransactionModal({ 
  isOpen, 
  onClose, 
  transaction,
  onEditSuccess 
}) {
  const [formData, setFormData] = useState({
    ticker: '',
    type: 'BUY',
    quantity: '',
    price: '',
    transactionDate: '',
    fee: '0',
    taxRate: '0.1',
    notes: '',
    stockAccountId: ''
  });
  
  const [stockAccounts, setStockAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load stock accounts and populate form when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      fetchStockAccounts();
      
      // Populate form with transaction data
      setFormData({
        ticker: transaction.ticker || '',
        type: transaction.type || 'BUY',
        quantity: transaction.quantity?.toString() || '',
        price: transaction.price?.toString() || '',
        transactionDate: transaction.transactionDate ? 
          new Date(transaction.transactionDate).toISOString().split('T')[0] : '',
        fee: transaction.fee?.toString() || '0',
        taxRate: transaction.taxRate?.toString() || '0.1',
        notes: transaction.notes || '',
        stockAccountId: transaction.stockAccountId || ''
      });
      
      setError('');
    }
  }, [isOpen, transaction]);

  const fetchStockAccounts = async () => {
    try {
      const response = await fetch('/api/stock-accounts');
      if (response.ok) {
        const accounts = await response.json();
        setStockAccounts(accounts);
      }
    } catch (err) {
      console.error('Error fetching stock accounts:', err);
      setError('Không thể tải danh sách tài khoản');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Xử lý đặc biệt cho trường price
    if (name === 'price') {
      const numericValue = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        [name]: value,
        // Tính step động dựa trên giá hiện tại
        priceStep: calculatePriceStep(numericValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!formData.ticker.trim()) {
        throw new Error('Mã cổ phiếu là bắt buộc');
      }
      
      if (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0) {
        throw new Error('Số lượng phải là số dương');
      }
      
      if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
        throw new Error('Giá phải là số dương');
      }

      if (!formData.stockAccountId) {
        throw new Error('Vui lòng chọn tài khoản chứng khoán');
      }

      // Construct data for API
      const transactionData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee: parseFloat(formData.fee),
        taxRate: parseFloat(formData.taxRate),
        stockAccountId: formData.stockAccountId
      };
      
      // API call to update transaction
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể cập nhật giao dịch');
      }

      // Signal that transactions have been updated
      localStorage.setItem('portfolioDataUpdated', Date.now().toString());
      
      // Success handling
      if (onEditSuccess) {
        onEditSuccess('Giao dịch đã được cập nhật thành công');
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
      console.error('Transaction update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Giao Dịch" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock Account Selector */}
          <div className="md:col-span-2">
            <label htmlFor="stockAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tài Khoản Chứng Khoán *
            </label>
            <select
              id="stockAccountId"
              name="stockAccountId"
              value={formData.stockAccountId}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="">-- Chọn tài khoản --</option>
              {stockAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.brokerName ? `(${account.brokerName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Ticker */}
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mã Cổ Phiếu *
            </label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent uppercase"
              placeholder="VNM"
            />
          </div>

          {/* Transaction Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loại Giao Dịch *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="BUY">Mua</option>
              <option value="SELL">Bán</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Số Lượng *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="100"
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Giá (VND) <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step={formData.price ? calculatePriceStep(parseFloat(formData.price) || 0) : 10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="Nhập giá giao dịch"
            />
            {formData.price && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Bước giá: {calculatePriceStep(parseFloat(formData.price) || 0).toLocaleString('vi-VN')} VNĐ
                {!isValidPrice(parseFloat(formData.price) || 0) && (
                  <span className="text-orange-600 dark:text-orange-400 ml-2">
                    ⚠️ Giá không hợp lệ theo quy định
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Transaction Date */}
          <div>
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ngày Giao Dịch *
            </label>
            <input
              type="date"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Fee */}
          <div>
            <label htmlFor="fee" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phí Giao Dịch (VND)
            </label>
            <input
              type="number"
              id="fee"
              name="fee"
              value={formData.fee}
              onChange={handleChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Tax Rate */}
          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thuế (%)
            </label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              placeholder="0.1"
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ghi Chú
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-vertical"
              placeholder="Ghi chú về giao dịch..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Đang lưu...' : 'Cập nhật giao dịch'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 