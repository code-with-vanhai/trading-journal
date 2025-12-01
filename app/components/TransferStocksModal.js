'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';

export default function TransferStocksModal({
  isOpen,
  onClose,
  selectedStocks, // Array of { ticker, accountId, accountName } objects
  onTransferSuccess
}) {
  const [stockAccounts, setStockAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load stock accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStockAccounts();
      setSelectedAccountId('');
      setError('');
    }
  }, [isOpen]);

  const fetchStockAccounts = async () => {
    try {
      const response = await fetch('/api/stock-accounts');
      if (response.ok) {
        const accounts = await response.json();
        setStockAccounts(accounts);
      }
    } catch (err) {
      console.error('Error fetching stock accounts:', err);
      setError('Không thể tải danh sách tài khoản');
    }
  };

  const handleTransfer = async () => {
    if (!selectedAccountId) {
      setError('Vui lòng chọn tài khoản đích');
      return;
    }

    if (!selectedStocks || selectedStocks.length === 0) {
      setError('Không có cổ phiếu nào được chọn');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const tickers = selectedStocks.map(stock => stock.ticker);

      const response = await fetch('/api/transactions/transfer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tickers: tickers,
          targetAccountId: selectedAccountId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Không thể chuyển cổ phiếu');
      }

      // Signal success to parent
      if (onTransferSuccess) {
        onTransferSuccess(data.message);
      }

      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available accounts (exclude accounts that already have all selected stocks)
  const getAvailableAccounts = () => {
    if (!selectedStocks || selectedStocks.length === 0) return stockAccounts;

    // Get unique source accounts from selected stocks
    const sourceAccountIds = [...new Set(selectedStocks.map(stock => stock.accountId))];

    // Filter out accounts that contain all selected stocks
    return stockAccounts.filter(account => {
      // If this account is not in the source accounts, it's available
      return !sourceAccountIds.includes(account.id);
    });
  };

  const availableAccounts = getAvailableAccounts();

  // Group selected stocks by source account for display
  const stocksByAccount = selectedStocks?.reduce((acc, stock) => {
    const accountKey = stock.accountId || 'unknown';
    if (!acc[accountKey]) {
      acc[accountKey] = {
        accountName: stock.accountName || 'Tài khoản không xác định',
        stocks: []
      };
    }
    acc[accountKey].stocks.push(stock.ticker);
    return acc;
  }, {}) || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chuyển Cổ Phiếu">
      <div className="space-y-4">
        {/* Selected Stocks Info */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cổ phiếu được chọn</h4>
          {Object.entries(stocksByAccount).map(([accountId, { accountName, stocks }]) => (
            <div key={accountId} className="mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Từ tài khoản: <span className="font-medium">{accountName}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stocks.map((ticker) => (
                  <span
                    key={ticker}
                    className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs px-2 py-1 rounded"
                  >
                    {ticker}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tổng cộng: {selectedStocks?.length || 0} cổ phiếu
          </div>
        </div>

        {/* Account Selection */}
        <div>
          <label htmlFor="targetAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Chuyển đến tài khoản
          </label>
          {availableAccounts.length > 0 ? (
            <select
              id="targetAccount"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              <option value="">-- Chọn tài khoản đích --</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} {account.brokerName ? `(${account.brokerName})` : ''}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Không có tài khoản khác để chuyển. Tất cả cổ phiếu đã thuộc tài khoản hiện tại hoặc không có tài khoản khác.
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-yellow-800 dark:text-yellow-400">
              <p className="font-medium">Lưu ý quan trọng:</p>
              <p>Tất cả giao dịch của các cổ phiếu được chọn sẽ được chuyển sang tài khoản đích. Điều này sẽ ảnh hưởng đến tính toán lãi/lỗ và báo cáo hiệu suất.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!selectedAccountId || isSubmitting || availableAccounts.length === 0}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Đang chuyển...' : `Chuyển ${selectedStocks?.length || 0} cổ phiếu`}
          </button>
        </div>
      </div>
    </Modal>
  );
} 