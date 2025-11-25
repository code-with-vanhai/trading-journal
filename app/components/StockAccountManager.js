'use client';

import { useState, useEffect } from 'react';
import StockAccountModal from './StockAccountModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { Spinner } from './ui/Spinner';
import { useNotification } from './Notification';
import { IconEdit, IconTrash } from './ui/Icon';

export default function StockAccountManager() {
  const { showError, showWarning } = useNotification();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Fetch stock accounts
  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stock-accounts');
      
      if (!response.ok) {
        throw new Error('Không thể tải danh sách tài khoản');
      }
      
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error('Error fetching stock accounts:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Handle create account
  const handleCreateSuccess = (newAccount) => {
    setAccounts(prev => {
      const updatedAccounts = [...prev, newAccount];
      // Re-sort to ensure default account stays at top
      return updatedAccounts.sort((a, b) => {
        if (a.name === 'Tài khoản mặc định' && b.name !== 'Tài khoản mặc định') {
          return -1;
        }
        if (b.name === 'Tài khoản mặc định' && a.name !== 'Tài khoản mặc định') {
          return 1;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    });
    setShowCreateModal(false);
  };

  // Handle edit account
  const handleEditClick = (account) => {
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleEditSuccess = (updatedAccount) => {
    setAccounts(prev => {
      const updatedAccounts = prev.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      );
      // Re-sort to ensure default account stays at top
      return updatedAccounts.sort((a, b) => {
        if (a.name === 'Tài khoản mặc định' && b.name !== 'Tài khoản mặc định') {
          return -1;
        }
        if (b.name === 'Tài khoản mặc định' && a.name !== 'Tài khoản mặc định') {
          return 1;
        }
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    });
    setShowEditModal(false);
    setSelectedAccount(null);
  };

  // Handle delete account
  const handleDeleteClick = (account) => {
    // Don't allow deleting the default account
    if (account.name === 'Tài khoản mặc định') {
      showWarning('Không thể xóa tài khoản mặc định. Bạn có thể chỉnh sửa tên và thông tin của nó.');
      return;
    }
    
    setSelectedAccount(account);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAccount) return;

    try {
      const response = await fetch(`/api/stock-accounts/${selectedAccount.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể xóa tài khoản');
      }

      // Remove from list
      setAccounts(prev => prev.filter(account => account.id !== selectedAccount.id));
      setShowDeleteModal(false);
      setSelectedAccount(null);

    } catch (err) {
      console.error('Error deleting stock account:', err);
      // Show error notification
      showError('Lỗi: ' + err.message);
    }
  };

  // Close modals and reset selected account
  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedAccount(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="medium" />
        <span className="ml-3 text-gray-600">Đang tải danh sách tài khoản...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        <p>Lỗi: {error}</p>
        <button 
          onClick={fetchAccounts}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const isDefaultAccount = (account) => account.name === 'Tài khoản mặc định';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản Lý Tài Khoản Chứng Khoán</h2>
          <p className="text-gray-600 mt-1">
            Tạo và quản lý các tài khoản giao dịch chứng khoán của bạn
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm Tài Khoản
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Tài khoản mặc định:</strong> Hệ thống tự động tạo tài khoản mặc định cho bạn. 
              Tất cả giao dịch sẽ được gán vào tài khoản này nếu bạn không chọn tài khoản khác. 
              Bạn có thể tạo thêm tài khoản để phân loại giao dịch theo từng sàn giao dịch hoặc chiến lược đầu tư.
            </p>
          </div>
        </div>
      </div>

      {/* Account List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className={`bg-white rounded-lg border p-6 hover:shadow-md transition-shadow ${
            isDefaultAccount(account) ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {account.name}
                  </h3>
                  {isDefaultAccount(account) && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Mặc định
                    </span>
                  )}
                </div>
                {account.brokerName && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Công ty CK:</span> {account.brokerName}
                  </p>
                )}
                {account.accountNumber && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Số TK:</span> {account.accountNumber}
                  </p>
                )}
              </div>
              <div className="flex space-x-1 ml-4">
                <button
                  onClick={() => handleEditClick(account)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Chỉnh sửa tài khoản"
                >
                  <IconEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(account)}
                  className={`p-2 rounded-md transition-colors ${
                    isDefaultAccount(account) 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={isDefaultAccount(account) ? 'Không thể xóa tài khoản mặc định' : 'Xóa tài khoản'}
                  disabled={isDefaultAccount(account)}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {account.description && (
              <p className="text-sm text-gray-600 mb-3">
                {account.description}
              </p>
            )}

            <div className="flex justify-between items-center text-sm text-gray-500 pt-3 border-t border-gray-100">
              <span>
                {account._count?.transactions || 0} giao dịch
              </span>
              <span>
                {new Date(account.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <StockAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      <StockAccountModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        account={selectedAccount}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Xác Nhận Xóa Tài Khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này không?"
        itemName={selectedAccount?.name}
      />
    </div>
  );
} 