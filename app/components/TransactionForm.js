'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionForm({ transaction = null, onSuccess }) {
  const router = useRouter();
  const isEditing = !!transaction;
  
  const [formData, setFormData] = useState({
    ticker: '',
    type: 'BUY',
    quantity: '',
    price: '',
    transactionDate: new Date().toISOString().split('T')[0],
    fee: '0',
    taxRate: '0.1',
    notes: ''
  });
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing, populate form with transaction data
  useEffect(() => {
    if (transaction) {
      setFormData({
        ticker: transaction.ticker,
        type: transaction.type,
        quantity: transaction.quantity.toString(),
        price: transaction.price.toString(),
        transactionDate: new Date(transaction.transactionDate).toISOString().split('T')[0],
        fee: transaction.fee.toString(),
        taxRate: transaction.taxRate.toString(),
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  const handleChange = (e) => {
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

      // Construct data for API
      const transactionData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee: parseFloat(formData.fee),
        taxRate: parseFloat(formData.taxRate),
      };
      
      // API call
      const url = isEditing 
        ? `/api/transactions/${transaction.id}` 
        : '/api/transactions';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể lưu giao dịch');
      }

      // Signal that transactions have been updated - set a flag with timestamp
      localStorage.setItem('portfolioDataUpdated', Date.now().toString());
      
      // Success handling
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/transactions');
        router.refresh();
      }
    } catch (err) {
      setError(err.message);
      console.error('Transaction save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="ticker" className="form-label">
              Mã Cổ Phiếu
            </label>
            <input
              id="ticker"
              name="ticker"
              type="text"
              className="input-field"
              value={formData.ticker}
              onChange={handleChange}
              placeholder="VD: VNM"
              required
            />
          </div>
          
          <div>
            <label htmlFor="type" className="form-label">
              Loại Giao Dịch
            </label>
            <select
              id="type"
              name="type"
              className="input-field"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="BUY">Mua</option>
              <option value="SELL">Bán</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="quantity" className="form-label">
              Số Lượng
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              min="0.01"
              className="input-field"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="form-label">
              Giá Mỗi Cổ Phiếu (VNĐ)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              className="input-field"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="transactionDate" className="form-label">
              Ngày Giao Dịch
            </label>
            <input
              id="transactionDate"
              name="transactionDate"
              type="date"
              className="input-field"
              value={formData.transactionDate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <label htmlFor="fee" className="form-label">
              Phí Giao Dịch (VNĐ)
            </label>
            <input
              id="fee"
              name="fee"
              type="number"
              step="0.01"
              min="0"
              className="input-field"
              value={formData.fee}
              onChange={handleChange}
            />
          </div>
          
          {formData.type === 'SELL' && (
            <div>
              <label htmlFor="taxRate" className="form-label">
                Thuế Suất (%)
              </label>
              <input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input-field"
                value={formData.taxRate}
                onChange={handleChange}
              />
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="notes" className="form-label">
            Ghi Chú (Tùy Chọn)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            className="input-field"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Thêm ghi chú về giao dịch này"
          ></textarea>
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? 'Đang Lưu...' 
              : isEditing 
                ? 'Cập Nhật Giao Dịch' 
                : 'Thêm Giao Dịch'
            }
          </button>
        </div>
      </form>
    </div>
  );
} 