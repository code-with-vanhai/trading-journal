'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import TransactionDetailModal from './TransactionDetailModal';
import EditTransactionModal from './EditTransactionModal';
import { useNotification } from './Notification';

export default function TransactionList({ 
  transactions, 
  onDeleteTransaction,
  sortField = 'transactionDate',
  sortDirection = 'desc',
  onSortChange,
  onEditSuccess 
}) {
  const { showSuccess, showError } = useNotification();
  const [deletingId, setDeletingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState(null);

  const handleSort = (field) => {
    if (onSortChange) {
      if (sortField === field) {
        onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        onSortChange(field, 'asc');
      }
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleDelete = async (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.')) {
      setDeletingId(id);
      
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        // Show success message
        showSuccess(result.message || 'Xóa giao dịch thành công!');
        
        // Notify parent to refresh the list
        if (onDeleteTransaction) {
          onDeleteTransaction(id);
        }
      } catch (err) {
        console.error('Delete error:', err);
        
        // Show detailed error message
        let errorMessage = 'Không thể xóa giao dịch';
        if (err.message.includes('Unauthorized')) {
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (err.message.includes('not found')) {
          errorMessage = 'Giao dịch không tồn tại hoặc đã bị xóa.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        showError(errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const openTransactionModal = (id) => {
    setSelectedTransactionId(id);
    setModalOpen(true);
  };

  const closeTransactionModal = () => {
    setModalOpen(false);
  };

  const openEditModal = (transaction) => {
    setTransactionToEdit(transaction);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setTransactionToEdit(null);
  };

  const handleEditSuccess = (message) => {
    // Show success message
    showSuccess(message);
    
    // Notify parent to refresh the data
    if (onEditSuccess) {
      onEditSuccess();
    }
    
    closeEditModal();
  };

  // Format currency to VND with thousands separators
  const formatCurrency = (value) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  // Remove the local filtering and sorting since it's now handled by the API
  const filteredAndSortedTransactions = transactions;

  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">Chưa có giao dịch nào được ghi lại.</p>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openAddModal'))}
          className="btn-primary"
        >
          Thêm Giao Dịch Đầu Tiên
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('transactionDate')}
              >
                Ngày {getSortIcon('transactionDate')}
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ticker')}
              >
                Mã CP {getSortIcon('ticker')}
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('type')}
              >
                Loại {getSortIcon('type')}
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('quantity')}
              >
                Số Lượng {getSortIcon('quantity')}
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('price')}
              >
                Giá {getSortIcon('price')}
              </th>
              <th
                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('calculatedPl')}
              >
                Lãi/Lỗ {getSortIcon('calculatedPl')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nhật Ký
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  {format(new Date(transaction.transactionDate), 'dd MMM, yyyy', { locale: vi })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap font-medium">
                  {transaction.ticker}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    transaction.type === 'BUY' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.type === 'BUY' ? 'Mua' : 'Bán'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {transaction.quantity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatCurrency(transaction.price)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {transaction.calculatedPl != null ? (
                    <span className={transaction.calculatedPl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {transaction.calculatedPl >= 0 ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.calculatedPl))}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {transaction.journalEntry ? (
                    <button
                      onClick={() => openTransactionModal(transaction.id)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      title="Xem nhật ký giao dịch"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                  ) : (
                    <Link
                      href={`/transactions/${transaction.id}/journal/new`}
                      className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 inline-block"
                      title="Thêm nhật ký giao dịch"
                    >
                      <i className="fas fa-plus"></i>
                    </Link>
                  )}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-1">
                    <button
                      onClick={() => openTransactionModal(transaction.id)}
                      className="text-indigo-600 hover:text-indigo-900 p-2 rounded hover:bg-indigo-50 transition-colors"
                      title="Xem chi tiết giao dịch"
                    >
                      <i className="fas fa-eye text-sm"></i>
                    </button>
                    <button
                      onClick={() => openEditModal(transaction)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50 transition-colors"
                      title="Sửa giao dịch"
                    >
                      <i className="fas fa-edit text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={deletingId === transaction.id}
                      className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      title={deletingId === transaction.id ? "Đang xóa..." : "Xóa giao dịch"}
                    >
                      {deletingId === transaction.id ? (
                        <i className="fas fa-spinner fa-spin text-sm"></i>
                      ) : (
                        <i className="fas fa-trash text-sm"></i>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal 
        isOpen={modalOpen}
        onClose={closeTransactionModal}
        transactionId={selectedTransactionId}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={closeEditModal}
        transaction={transactionToEdit}
        onEditSuccess={handleEditSuccess}
      />
    </div>
  );
} 