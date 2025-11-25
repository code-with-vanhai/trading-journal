'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { Spinner } from './ui/Spinner';

export default function StockAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  account = null // If provided, we're editing; if null, we're creating
}) {
  const [formData, setFormData] = useState({
    name: '',
    brokerName: '',
    accountNumber: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!account;

  // Populate form when editing
  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        brokerName: account.brokerName || '',
        accountNumber: account.accountNumber || '',
        description: account.description || ''
      });
    } else {
      setFormData({
        name: '',
        brokerName: '',
        accountNumber: '',
        description: ''
      });
    }
    setError('');
  }, [account, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Tên tài khoản là bắt buộc');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Tên tài khoản không được vượt quá 100 ký tự');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = isEditing ? `/api/stock-accounts/${account.id}` : '/api/stock-accounts';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          brokerName: formData.brokerName.trim() || null,
          accountNumber: formData.accountNumber.trim() || null,
          description: formData.description.trim() || null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Lỗi ${isEditing ? 'cập nhật' : 'tạo'} tài khoản`);
      }

      // Success
      onSuccess?.(data);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        brokerName: '',
        accountNumber: '',
        description: ''
      });

    } catch (err) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} stock account:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError('');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên Tài Khoản <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            placeholder="VD: Tài khoản TCBS chính"
            maxLength={100}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="brokerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tên Công Ty Chứng Khoán
          </label>
          <input
            type="text"
            id="brokerName"
            name="brokerName"
            value={formData.brokerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            placeholder="VD: TCBS, VNDIRECT, SSI"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Số Tài Khoản
          </label>
          <input
            type="text"
            id="accountNumber"
            name="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            placeholder="VD: 123456789"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mô Tả
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            placeholder="VD: Tài khoản dành cho đầu tư dài hạn"
            disabled={isLoading}
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            disabled={isLoading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="small" />
                <span className="ml-2">
                  {isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
                </span>
              </>
            ) : (
              isEditing ? 'Cập Nhật' : 'Tạo Tài Khoản'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
} 