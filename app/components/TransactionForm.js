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
    notes: '',
    stockAccountId: ''
  });
  
  const [stockAccounts, setStockAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stock accounts
  useEffect(() => {
    const fetchStockAccounts = async () => {
      try {
        const response = await fetch('/api/stock-accounts');
        if (response.ok) {
          const accounts = await response.json();
          setStockAccounts(accounts);
          
          // Auto-select the first account (which should be the default account)
          if (!isEditing && accounts.length > 0 && !formData.stockAccountId) {
            setFormData(prev => ({
              ...prev,
              stockAccountId: accounts[0].id
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching stock accounts:', err);
        setError('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchStockAccounts();
  }, []);

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
        notes: transaction.notes || '',
        stockAccountId: transaction.stockAccountId || ''
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

      // Construct data for API (stockAccountId is optional now, backend will use default if not provided)
      const transactionData = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        price: parseFloat(formData.price),
        fee: parseFloat(formData.fee),
        taxRate: parseFloat(formData.taxRate),
      };
      
      // Only include stockAccountId if it's set
      if (formData.stockAccountId) {
        transactionData.stockAccountId = formData.stockAccountId;
      }
      
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

  const handleCreateAccount = () => {
    router.push('/accounts');
  };

  if (isLoadingAccounts) {
    return (
      <div className="card">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in-up">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        {isEditing ? 'Chỉnh Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
      </h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded mb-4 border border-red-200 dark:border-red-800 shake">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Stock Account Selector - Only show if accounts are loaded */}
          {stockAccounts.length > 0 && (
            <div className="md:col-span-2">
              <label htmlFor="stockAccountId" className="form-label">
                Tài Khoản Chứng Khoán
              </label>
              <select
                id="stockAccountId"
                name="stockAccountId"
                className="input-field"
                value={formData.stockAccountId}
                onChange={handleChange}
              >
                {stockAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.brokerName ? `(${account.brokerName})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nếu không chọn, giao dịch sẽ được gán cho tài khoản mặc định.{' '}
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Quản lý tài khoản
                </button>
              </p>
            </div>
          )}

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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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