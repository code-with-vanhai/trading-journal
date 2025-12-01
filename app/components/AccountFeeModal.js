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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-gray-800/80 dark:to-gray-700/80 backdrop-blur-sm text-gray-900 dark:text-white p-6 rounded-t-2xl border-b border-gray-200/50 dark:border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {isEditing ? 'Chỉnh Sửa Phí Tài Khoản' : 'Thêm Phí Tài Khoản Mới'}
              </h2>
              <p className="opacity-90 dark:opacity-80 mt-1 text-gray-600 dark:text-gray-300">
                {isEditing 
                  ? 'Cập nhật thông tin phí tài khoản chứng khoán'
                  : 'Thêm mới phí liên quan đến tài khoản chứng khoán của bạn'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100/50 dark:hover:bg-white/10"
              title="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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