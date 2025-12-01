'use client';

import { useState } from 'react';

const FEE_TYPE_LABELS = {
  CUSTODY_FEE: 'Phí lưu ký',
  ADVANCE_SELLING_FEE: 'Phí ứng trước',
  ACCOUNT_MAINTENANCE: 'Phí duy trì',
  TRANSFER_FEE: 'Phí chuyển nhượng',
  DIVIDEND_TAX: 'Thuế cổ tức',
  INTEREST_FEE: 'Phí lãi vay',
  DATA_FEED_FEE: 'Phí dữ liệu',
  SMS_NOTIFICATION_FEE: 'Phí SMS',
  STATEMENT_FEE: 'Phí sao kê',
  WITHDRAWAL_FEE: 'Phí rút tiền',
  OTHER_FEE: 'Phí khác'
};

const FEE_TYPE_COLORS = {
  CUSTODY_FEE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  ADVANCE_SELLING_FEE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
  ACCOUNT_MAINTENANCE: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  TRANSFER_FEE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
  DIVIDEND_TAX: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  INTEREST_FEE: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  DATA_FEED_FEE: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
  SMS_NOTIFICATION_FEE: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400',
  STATEMENT_FEE: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  WITHDRAWAL_FEE: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
  OTHER_FEE: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
};

export default function AccountFeeList({ accountFees, isLoading, onEdit, onDelete }) {
  const [sortBy, setSortBy] = useState('feeDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!accountFees || accountFees.length === 0) {
    return (
      <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có phí tài khoản</h3>
          <p className="text-gray-500 dark:text-gray-400">Bạn chưa có phí tài khoản nào được ghi nhận.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
          <thead className="bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('feeDate')}
              >
                <div className="flex items-center gap-1">
                  Ngày
                  {getSortIcon('feeDate')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('feeType')}
              >
                <div className="flex items-center gap-1">
                  Loại phí
                  {getSortIcon('feeType')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                onClick={() => handleSort('amount')}
              >
                <div className="flex items-center gap-1">
                  Số tiền
                  {getSortIcon('amount')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tài khoản
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Mô tả
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Số tham chiếu
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
            {accountFees.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  {formatDate(fee.feeDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${FEE_TYPE_COLORS[fee.feeType] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                    {FEE_TYPE_LABELS[fee.feeType] || fee.feeType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                  {formatCurrency(fee.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  <div>
                    <div className="font-medium">{fee.stockAccount?.name}</div>
                    {fee.stockAccount?.brokerName && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{fee.stockAccount.brokerName}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 max-w-xs truncate">
                  {fee.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                  {fee.referenceNumber || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(fee)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1 rounded"
                      title="Chỉnh sửa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(fee.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded"
                      title="Xóa"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 