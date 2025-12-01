'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SigninModal from '../components/SigninModal';
import DividendEventForm from '../components/DividendEventForm';
import { useNotification } from '../components/Notification';
import { IconPlus, IconLock, IconRotateCw, IconAlertCircle, IconCalendarCheck, IconInbox, IconTrash, IconX } from '../components/ui/Icon';

export default function CostBasisAdjustmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  
  const [adjustments, setAdjustments] = useState([]);
  const [stockAccounts, setStockAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [signinModalOpen, setSigninModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    ticker: '',
    adjustmentType: '',
    isActive: 'true'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      setSigninModalOpen(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAdjustments();
      fetchStockAccounts();
    }
  }, [status, filters]);

  const fetchStockAccounts = async () => {
    try {
      const response = await fetch('/api/stock-accounts');
      if (response.ok) {
        const accounts = await response.json();
        setStockAccounts(Array.isArray(accounts) ? accounts : []);
      }
    } catch (error) {
      console.error('Error fetching stock accounts:', error);
    }
  };

  const fetchAdjustments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.ticker) params.append('ticker', filters.ticker);
      if (filters.adjustmentType) params.append('adjustmentType', filters.adjustmentType);
      if (filters.isActive !== '') params.append('isActive', filters.isActive);
      
      const queryString = params.toString();
      const url = `/api/cost-basis-adjustments${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách sự kiện quyền');
      }
      const data = await response.json();
      setAdjustments(data.adjustments || []);
    } catch (err) {
      setError('Lỗi khi tải sự kiện quyền: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  const handleDeleteAdjustment = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa sự kiện quyền này?')) return;
    
    try {
      const response = await fetch(`/api/cost-basis-adjustments/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa sự kiện quyền');
      }
      
      setAdjustments(adjustments.filter(adj => adj.id !== id));
      showSuccess('✅ Đã xóa sự kiện quyền thành công!');
    } catch (err) {
      showError('❌ Lỗi khi xóa sự kiện quyền: ' + err.message);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      const response = await fetch(`/api/cost-basis-adjustments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      
      if (!response.ok) {
        throw new Error('Không thể cập nhật trạng thái');
      }
      
      setAdjustments(adjustments.map(adj => 
        adj.id === id ? { ...adj, isActive: !isActive } : adj
      ));
      showSuccess(`✅ Đã ${!isActive ? 'kích hoạt' : 'vô hiệu hóa'} sự kiện quyền!`);
    } catch (err) {
      showError('❌ Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const handleAddSuccess = (result) => {
    setIsAddModalOpen(false);
    showSuccess(`✅ ${result.adjustmentType} cho ${result.ticker} đã được tạo thành công!`);
    fetchAdjustments(); // Refresh list
  };

  const formatAdjustmentType = (type) => {
    const types = {
      'CASH_DIVIDEND': '🪙 Cổ tức tiền mặt',
      'STOCK_DIVIDEND': '📊 Cổ tức cổ phiếu', 
      'STOCK_SPLIT': '📈 Tách cổ phiếu',
      'REVERSE_SPLIT': '📉 Gộp cổ phiếu',
      'MERGER': '🤝 Sáp nhập',
      'SPINOFF': '🔄 Tách tài sản'
    };
    return types[type] || type;
  };

  const getAdjustmentDetails = (adj) => {
    if (adj.adjustmentType === 'CASH_DIVIDEND' && adj.dividendPerShare) {
      return `${adj.dividendPerShare.toLocaleString('vi-VN')} VND/cp`;
    }
    if ((adj.adjustmentType === 'STOCK_SPLIT' || adj.adjustmentType === 'REVERSE_SPLIT') && adj.splitRatio) {
      return `Tỷ lệ: ${adj.splitRatio}`;
    }
    return '-';
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <div className="gradient-bg dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Quản lý Sự kiện Quyền</h1>
              <p className="text-xl opacity-90 dark:opacity-80 text-gray-600 dark:text-gray-300">Theo dõi các sự kiện quyền ảnh hưởng đến giá vốn cổ phiếu</p>
            </div>
            {status === 'authenticated' && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="glass-button text-blue-900 dark:text-blue-100 px-6 py-3 font-bold transition shadow-lg flex items-center"
              >
                <IconPlus className="w-5 h-5 mr-2" />
                Thêm Sự kiện Quyền
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 mt-6">
        {status === 'unauthenticated' ? (
          <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-12 text-center">
            <div className="flex flex-col items-center">
              <IconLock className="text-gray-400 dark:text-gray-500 w-16 h-16 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Đăng nhập để xem sự kiện quyền</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Vui lòng đăng nhập để truy cập thông tin sự kiện quyền</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mã cổ phiếu
                  </label>
                  <input
                    type="text"
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={filters.ticker}
                    onChange={(e) => handleFilterChange({ ticker: e.target.value.toUpperCase() })}
                    placeholder="VD: VLB"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loại sự kiện quyền
                  </label>
                  <select
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={filters.adjustmentType}
                    onChange={(e) => handleFilterChange({ adjustmentType: e.target.value })}
                  >
                    <option value="">Tất cả</option>
                    <option value="CASH_DIVIDEND">Cổ tức tiền mặt</option>
                    <option value="STOCK_DIVIDEND">Cổ tức cổ phiếu</option>
                    <option value="STOCK_SPLIT">Tách cổ phiếu</option>
                    <option value="REVERSE_SPLIT">Gộp cổ phiếu</option>
                    <option value="MERGER">Sáp nhập</option>
                    <option value="SPINOFF">Tách tài sản</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trạng thái
                  </label>
                  <select
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    value={filters.isActive}
                    onChange={(e) => handleFilterChange({ isActive: e.target.value })}
                  >
                    <option value="">Tất cả</option>
                    <option value="true">Kích hoạt</option>
                    <option value="false">Vô hiệu</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ ticker: '', adjustmentType: '', isActive: 'true' })}
                    className="btn-secondary w-full flex items-center justify-center"
                  >
                    <IconRotateCw className="w-4 h-4 mr-2" />
                    Đặt lại
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 p-4 rounded mb-6">
                <div className="flex items-center">
                  <IconAlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Đang tải sự kiện quyền...</p>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <IconCalendarCheck className="text-green-600 dark:text-green-400 w-6 h-6 mr-3" />
                    <div className="font-semibold text-gray-800 dark:text-gray-200">
                      {adjustments.length} sự kiện quyền
                    </div>
                  </div>
                </div>
                
                {adjustments.length === 0 ? (
                  <div className="p-12 text-center">
                    <IconInbox className="text-gray-400 dark:text-gray-500 w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Chưa có sự kiện quyền nào</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Thêm sự kiện quyền đầu tiên cho các sự kiện ảnh hưởng giá vốn</p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="btn-primary flex items-center mx-auto"
                    >
                      <IconPlus className="w-5 h-5 mr-2" />
                      Thêm sự kiện quyền
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Cổ phiếu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Loại sự kiện quyền
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Chi tiết
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Ngày sự kiện
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Trạng thái
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                        {adjustments.map((adjustment) => (
                          <tr key={adjustment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                                {adjustment.ticker}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {adjustment.stockAccountId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-200">
                                {formatAdjustmentType(adjustment.adjustmentType)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-200">
                                {getAdjustmentDetails(adjustment)}
                              </div>
                              {adjustment.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {adjustment.description}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-gray-200">
                                {new Date(adjustment.eventDate).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {adjustment.processedAt ? 'Đã xử lý' : 'Chưa xử lý'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleActive(adjustment.id, adjustment.isActive)}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  adjustment.isActive 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {adjustment.isActive ? 'Kích hoạt' : 'Vô hiệu'}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteAdjustment(adjustment.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                title="Xóa sự kiện quyền"
                              >
                                <IconTrash className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Signin Modal */}
      <SigninModal
        isOpen={signinModalOpen}
        onClose={() => setSigninModalOpen(false)}
      />

      {/* Add Adjustment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <IconCalendarCheck className="text-green-600 dark:text-green-400 w-6 h-6 mr-3" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm Sự kiện Quyền</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <DividendEventForm
                stockAccounts={stockAccounts}
                onSuccess={handleAddSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
