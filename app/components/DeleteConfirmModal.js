'use client';

import { useState } from 'react';
import Modal from './ui/Modal';
import { Spinner } from './ui/Spinner';

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Xác Nhận Xóa',
  message = 'Bạn có chắc chắn muốn xóa mục này không?',
  itemName = '',
  confirmText = 'Xóa',
  cancelText = 'Hủy',
  isLoading = false
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm?.();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !isLoading) {
      onClose();
    }
  };

  const isDeleting = loading || isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="text-gray-700 dark:text-gray-300">
          <p>{message}</p>
          {itemName && (
            <p className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
              {itemName}
            </p>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            disabled={isDeleting}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-600 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Spinner size="small" />
                <span className="ml-2">Đang xóa...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
} 