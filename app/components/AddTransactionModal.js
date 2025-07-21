'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';

export default function AddTransactionModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    ticker: '',
    type: 'BUY',
    quantity: '',
    price: '',
    transactionDate: new Date().toISOString().split('T')[0],
    fee: '0',
    taxRate: '0.1',
    notes: '',
    stockAccountId: ''
  });
  
  const [stockAccounts, setStockAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stock accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStockAccounts();
    }
  }, [isOpen]);

  const fetchStockAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch('/api/stock-accounts');
      if (response.ok) {
        const data = await response.json();
        setStockAccounts(data);
        
        // Auto-select first account if only one exists
        if (data.length === 1) {
          setFormData(prev => ({ ...prev, stockAccountId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error fetching stock accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.ticker || !formData.quantity || !formData.price || !formData.stockAccountId) {
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          price: parseFloat(formData.price),
          fee: parseFloat(formData.fee) || 0,
          taxRate: parseFloat(formData.taxRate) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Có lỗi xảy ra khi thêm giao dịch');
      }

      const result = await response.json();
      
      // Reset form
      setFormData({
        ticker: '',
        type: 'BUY',
        quantity: '',
        price: '',
        transactionDate: new Date().toISOString().split('T')[0],
        fee: '0',
        taxRate: '0.1',
        notes: '',
        stockAccountId: stockAccounts.length === 1 ? stockAccounts[0].id : ''
      });

      // Call success callbacks
      if (onSuccess) {
        onSuccess('Thêm giao dịch thành công!');
      }
      
      // Close modal
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      ticker: '',
      type: 'BUY',
      quantity: '',
      price: '',
      transactionDate: new Date().toISOString().split('T')[0],
      fee: '0',
      taxRate: '0.1',
      notes: '',
      stockAccountId: stockAccounts.length === 1 ? stockAccounts[0].id : ''
    });
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Thêm Giao Dịch Mới" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stock Account Selection */}
        <div>
          <label htmlFor="stockAccountId" className="block text-sm font-medium text-gray-700 mb-1">
            Tài khoản cổ phiếu *
          </label>
          {isLoadingAccounts ? (
            <div className="text-gray-500">Đang tải tài khoản...</div>
          ) : stockAccounts.length === 0 ? (
            <div className="text-red-500">Không có tài khoản cổ phiếu nào. Vui lòng tạo tài khoản trước.</div>
          ) : (
            <select
              id="stockAccountId"
              name="stockAccountId"
              value={formData.stockAccountId}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn tài khoản</option>
              {stockAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.brokerName && `(${account.brokerName})`}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Ticker and Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
              Mã cổ phiếu *
            </label>
            <input
              type="text"
              id="ticker"
              name="ticker"
              value={formData.ticker}
              onChange={handleInputChange}
              placeholder="VD: VCB, VNM, FPT"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Loại giao dịch *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BUY">Mua</option>
              <option value="SELL">Bán</option>
            </select>
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              step="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Giá (VNĐ) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              min="0"
              step="50"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Date and Fee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-1">
              Ngày giao dịch *
            </label>
            <input
              type="date"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="fee" className="block text-sm font-medium text-gray-700 mb-1">
              Phí giao dịch (VNĐ)
            </label>
            <input
              type="number"
              id="fee"
              name="fee"
              value={formData.fee}
              onChange={handleInputChange}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tax Rate */}
        <div>
          <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">
            Thuế (%) - Chỉ áp dụng cho giao dịch bán
          </label>
          <input
            type="number"
            id="taxRate"
            name="taxRate"
            value={formData.taxRate}
            onChange={handleInputChange}
            min="0"
            max="100"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Ghi chú
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ghi chú về giao dịch này..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting || stockAccounts.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Đang thêm...' : 'Thêm Giao Dịch'}
          </button>
        </div>
      </form>
    </Modal>
  );
} 