'use client';

import React, { useState, useEffect } from 'react';
import { useNotification } from './Notification';

// Adjustment type options
const ADJUSTMENT_TYPES = [
  { value: 'CASH_DIVIDEND', label: '💰 Cổ tức tiền mặt' },
  { value: 'STOCK_DIVIDEND', label: '📈 Cổ tức cổ phiếu' },
  { value: 'STOCK_SPLIT', label: '🔄 Chia tách cổ phiếu' }
];

export default function DividendEventForm({ stockAccounts = [], onSuccess, initialData = null }) {
  const { showError } = useNotification();
  const [formData, setFormData] = useState({
    adjustmentType: 'CASH_DIVIDEND',
    ticker: '',
    stockAccountId: '',
    eventDate: '',
    dividendPerShare: '',
    taxRate: '0.05',
    stockDividendRatio: '',
    splitRatio: '',
    description: '',
    externalRef: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form with data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        adjustmentType: initialData.adjustmentType || 'CASH_DIVIDEND',
        ticker: initialData.ticker || '',
        stockAccountId: initialData.stockAccountId || '',
        eventDate: initialData.eventDate ? new Date(initialData.eventDate).toISOString().split('T')[0] : '',
        dividendPerShare: initialData.dividendPerShare?.toString() || '',
        taxRate: initialData.taxRate?.toString() || '0.05',
        stockDividendRatio: initialData.splitRatio ? (initialData.splitRatio - 1).toString() : '',
        splitRatio: initialData.splitRatio?.toString() || '',
        description: initialData.description || '',
        externalRef: initialData.externalRef || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Mã cổ phiếu là bắt buộc';
    }
    if (!formData.stockAccountId) {
      newErrors.stockAccountId = 'Tài khoản là bắt buộc';
    }
    if (!formData.eventDate) {
      newErrors.eventDate = 'Ngày ex-dividend là bắt buộc';
    }

    // Type-specific validation
    switch (formData.adjustmentType) {
      case 'CASH_DIVIDEND':
        if (!formData.dividendPerShare || parseFloat(formData.dividendPerShare) <= 0) {
          newErrors.dividendPerShare = 'Cổ tức mỗi cổ phiếu phải lớn hơn 0';
        }
        if (!formData.taxRate || parseFloat(formData.taxRate) < 0 || parseFloat(formData.taxRate) > 1) {
          newErrors.taxRate = 'Thuế suất phải trong khoảng 0-1';
        }
        break;
      case 'STOCK_DIVIDEND':
        if (!formData.stockDividendRatio || parseFloat(formData.stockDividendRatio) <= 0) {
          newErrors.stockDividendRatio = 'Tỷ lệ cổ tức cổ phiếu phải lớn hơn 0';
        }
        break;
      case 'STOCK_SPLIT':
        if (!formData.splitRatio || parseFloat(formData.splitRatio) <= 0) {
          newErrors.splitRatio = 'Tỷ lệ chia tách phải lớn hơn 0';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Vui lòng kiểm tra lại thông tin');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare API payload
      const payload = {
        adjustmentType: formData.adjustmentType,
        ticker: formData.ticker.toUpperCase().trim(),
        stockAccountId: formData.stockAccountId,
        eventDate: formData.eventDate,
        description: formData.description.trim() || null,
        externalRef: formData.externalRef.trim() || null
      };

      // Add type-specific fields
      switch (formData.adjustmentType) {
        case 'CASH_DIVIDEND':
          payload.dividendPerShare = parseFloat(formData.dividendPerShare);
          payload.taxRate = parseFloat(formData.taxRate);
          break;
        case 'STOCK_DIVIDEND':
          payload.stockDividendRatio = parseFloat(formData.stockDividendRatio);
          break;
        case 'STOCK_SPLIT':
          payload.splitRatio = parseFloat(formData.splitRatio);
          break;
      }

      console.log('Submitting dividend event:', payload);

      const response = await fetch('/api/dividends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create dividend event');
      }

      // Success message will be handled by parent component via onSuccess callback

      // Reset form
      setFormData({
        adjustmentType: 'CASH_DIVIDEND',
        ticker: '',
        stockAccountId: '',
        eventDate: '',
        dividendPerShare: '',
        taxRate: '0.05',
        stockDividendRatio: '',
        splitRatio: '',
        description: '',
        externalRef: ''
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result.data);
      }

    } catch (error) {
      console.error('Error creating dividend event:', error);
      showError(error.message || 'Có lỗi xảy ra khi tạo sự kiện cổ tức');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {initialData ? 'Cập nhật' : 'Tạo'} Sự Kiện Cổ Tức
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Adjustment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại sự kiện <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            name="adjustmentType"
            value={formData.adjustmentType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {ADJUSTMENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ticker & Stock Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mã cổ phiếu <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              name="ticker"
              value={formData.ticker}
              onChange={handleInputChange}
              placeholder="VD: VLB"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.ticker ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            {errors.ticker && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.ticker}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tài khoản <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <select
              name="stockAccountId"
              value={formData.stockAccountId}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.stockAccountId ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
            >
              <option value="">-- Chọn tài khoản --</option>
              {stockAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.brokerName})
                </option>
              ))}
            </select>
            {errors.stockAccountId && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.stockAccountId}</p>}
          </div>
        </div>

        {/* Event Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ngày ex-dividend <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="date"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.eventDate ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
          />
          {errors.eventDate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.eventDate}</p>}
        </div>

        {/* Type-specific fields */}
        {formData.adjustmentType === 'CASH_DIVIDEND' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cổ tức mỗi cổ phiếu (VND) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                name="dividendPerShare"
                value={formData.dividendPerShare}
                onChange={handleInputChange}
                placeholder="1500"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.dividendPerShare ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {errors.dividendPerShare && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.dividendPerShare}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Thuế suất (0-1) <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleInputChange}
                placeholder="0.05"
                min="0"
                max="1"
                step="0.001"
                className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.taxRate ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
              {errors.taxRate && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.taxRate}</p>}
            </div>
          </div>
        )}

        {formData.adjustmentType === 'STOCK_DIVIDEND' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tỷ lệ cổ tức cổ phiếu (0.1 = 10%) <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              name="stockDividendRatio"
              value={formData.stockDividendRatio}
              onChange={handleInputChange}
              placeholder="0.15"
              min="0"
              step="0.001"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.stockDividendRatio ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            {errors.stockDividendRatio && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.stockDividendRatio}</p>}
          </div>
        )}

        {formData.adjustmentType === 'STOCK_SPLIT' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tỷ lệ chia tách (2 = 1:2 split) <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="number"
              name="splitRatio"
              value={formData.splitRatio}
              onChange={handleInputChange}
              placeholder="2"
              min="0"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${errors.splitRatio ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            {errors.splitRatio && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.splitRatio}</p>}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mô tả
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Mô tả chi tiết về sự kiện cổ tức..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* External Reference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tham chiếu (Mã thông báo từ CTCK)
          </label>
          <input
            type="text"
            name="externalRef"
            value={formData.externalRef}
            onChange={handleInputChange}
            placeholder="TB-123456"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md text-white font-medium transition-colors ${isSubmitting
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
              }`}
          >
            {isSubmitting ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo sự kiện'}
          </button>
        </div>
      </form>
    </div>
  );
} 