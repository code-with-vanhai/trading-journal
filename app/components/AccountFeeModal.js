'use client';

import { useEffect } from 'react';
import AccountFeeForm from './AccountFeeForm';

export default function AccountFeeModal({ isOpen, onClose, fee = null, onSuccess }) {
  const isEditing = !!fee;

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="gradient-bg dark:from-gray-800 dark:to-gray-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Chỉnh Sửa Phí Tài Khoản' : 'Thêm Phí Tài Khoản Mới'}
              </h2>
              <p className="opacity-90 dark:opacity-80 mt-1">
                {isEditing 
                  ? 'Cập nhật thông tin phí tài khoản chứng khoán'
                  : 'Thêm mới phí liên quan đến tài khoản chứng khoán của bạn'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 dark:hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-white hover:bg-opacity-10 dark:hover:bg-opacity-20"
              title="Đóng"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <AccountFeeForm
            fee={fee}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
} 