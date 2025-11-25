'use client';

import { useState, useEffect } from 'react';

const FEE_TYPE_OPTIONS = [
  { value: 'CUSTODY_FEE', label: 'Phí lưu ký chứng khoán' },
  { value: 'ADVANCE_SELLING_FEE', label: 'Phí ứng trước tiền bán' },
  { value: 'ACCOUNT_MAINTENANCE', label: 'Phí duy trì tài khoản' },
  { value: 'TRANSFER_FEE', label: 'Phí chuyển nhượng' },
  { value: 'DIVIDEND_TAX', label: 'Thuế cổ tức' },
  { value: 'INTEREST_FEE', label: 'Phí lãi vay margin' },
  { value: 'DATA_FEED_FEE', label: 'Phí cung cấp dữ liệu' },
  { value: 'SMS_NOTIFICATION_FEE', label: 'Phí SMS thông báo' },
  { value: 'STATEMENT_FEE', label: 'Phí sao kê' },
  { value: 'WITHDRAWAL_FEE', label: 'Phí rút tiền' },
  { value: 'OTHER_FEE', label: 'Phí khác' }
];

export default function AccountFeeForm({ fee = null, onSuccess, onCancel }) {
  const isEditing = !!fee;
  
  const [formData, setFormData] = useState({
    stockAccountId: '',
    feeType: '',
    amount: '',
    description: '',
    feeDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    attachmentUrl: ''
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
          
          // Auto-select the first account if not editing and no account selected
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
  }, [isEditing, formData.stockAccountId]);

  // If editing, populate form with fee data
  useEffect(() => {
    if (fee) {
      setFormData({
        stockAccountId: fee.stockAccountId || '',
        feeType: fee.feeType || '',
        amount: fee.amount?.toString() || '',
        description: fee.description || '',
        feeDate: fee.feeDate ? new Date(fee.feeDate).toISOString().split('T')[0] : '',
        referenceNumber: fee.referenceNumber || '',
        attachmentUrl: fee.attachmentUrl || ''
      });
    }
  }, [fee]);

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
      if (!formData.stockAccountId.trim()) {
        throw new Error('Tài khoản chứng khoán là bắt buộc');
      }
      
      if (!formData.feeType.trim()) {
        throw new Error('Loại phí là bắt buộc');
      }
      
      if (!formData.amount.trim() || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        throw new Error('Số tiền phí phải là số dương');
      }
      
      if (!formData.feeDate.trim()) {
        throw new Error('Ngày phí là bắt buộc');
      }

      // Construct data for API
      const feeData = {
        stockAccountId: formData.stockAccountId,
        feeType: formData.feeType,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        feeDate: formData.feeDate,
        referenceNumber: formData.referenceNumber || null,
        attachmentUrl: formData.attachmentUrl || null
      };
      
      // API call
      const url = isEditing 
        ? `/api/account-fees/${fee.id}` 
        : '/api/account-fees';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feeData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể lưu phí tài khoản');
      }

      // Success handling
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      console.error('Account fee save error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Account */}
        <div>
          <label htmlFor="stockAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tài khoản chứng khoán *
          </label>
          <select
            id="stockAccountId"
            name="stockAccountId"
            value={formData.stockAccountId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
            disabled={isLoadingAccounts}
          >
            <option value="">Chọn tài khoản...</option>
            {stockAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} {account.brokerName && `(${account.brokerName})`}
              </option>
            ))}
          </select>
        </div>

        {/* Fee Type */}
        <div>
          <label htmlFor="feeType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loại phí *
          </label>
          <select
            id="feeType"
            name="feeType"
            value={formData.feeType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          >
            <option value="">Chọn loại phí...</option>
            {FEE_TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tiền phí (VND) *
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Nhập số tiền phí"
            required
          />
        </div>

        {/* Fee Date */}
        <div>
          <label htmlFor="feeDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ngày phí *
          </label>
          <input
            type="date"
            id="feeDate"
            name="feeDate"
            value={formData.feeDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>

        {/* Reference Number */}
        <div>
          <label htmlFor="referenceNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Số tham chiếu
          </label>
          <input
            type="text"
            id="referenceNumber"
            name="referenceNumber"
            value={formData.referenceNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Số tham chiếu từ công ty chứng khoán"
          />
        </div>

        {/* Attachment URL */}
        <div>
          <label htmlFor="attachmentUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link đính kèm
          </label>
          <input
            type="url"
            id="attachmentUrl"
            name="attachmentUrl"
            value={formData.attachmentUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="https://example.com/document.pdf"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          placeholder="Mô tả chi tiết về phí này..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
          disabled={isSubmitting}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Thêm phí')}
        </button>
      </div>
    </form>
  );
} 