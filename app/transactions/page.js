'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Pagination from '../components/Pagination';
import { useNotification } from '../components/Notification';
import { Spinner } from '../components/ui/Spinner';
import { TableSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { IconPlus, IconChevronDown, IconLineChart, IconCoins, IconAlertCircle, IconBarChart, IconX } from '../components/ui/Icon';

// Dynamic imports for heavy components
const TransactionList = dynamic(() => import('../components/TransactionList'), {
  loading: () => <div className="p-6"><Spinner /></div>,
  ssr: false
});

const AddTransactionModal = dynamic(() => import('../components/AddTransactionModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Spinner /></div>,
  ssr: false
});

const TransactionFilters = dynamic(() => import('../components/TransactionFilters'), {
  loading: () => <div className="bg-white p-4 rounded-lg shadow animate-pulse"><div className="h-20 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const SigninModal = dynamic(() => import('../components/SigninModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Spinner /></div>,
  ssr: false
});

const ProfitStatistics = dynamic(() => import('../components/ProfitStatistics'), {
  loading: () => <div className="bg-white p-6 rounded-lg shadow animate-pulse"><div className="h-32 bg-gray-200 rounded"></div></div>,
  ssr: false
});

const DividendEventForm = dynamic(() => import('../components/DividendEventForm'), {
  loading: () => <div className="bg-white p-6 rounded-lg shadow animate-pulse"><div className="h-40 bg-gray-200 rounded"></div></div>,
  ssr: false
});

function TransactionsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess } = useNotification();
  
  const [transactions, setTransactions] = useState([]);
  const [profitStats, setProfitStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  const [filters, setFilters] = useState({
    ticker: searchParams.get('ticker') || '',
    type: searchParams.get('type') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    sortBy: searchParams.get('sortBy') || 'transactionDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: searchParams.get('page') || '1',
    pageSize: searchParams.get('pageSize') || '10'
  });

  // Signin modal state
  const [signinModalOpen, setSigninModalOpen] = useState(false);

  // Dropdown and modal states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [stockAccounts, setStockAccounts] = useState([]);

  // Check authentication and show signin modal if needed
  useEffect(() => {
    if (status === 'unauthenticated') {
      setSigninModalOpen(true);
    }
  }, [status]);

  // Listen for custom event to open add modal
  useEffect(() => {
    const handleOpenAddModal = () => setIsAddModalOpen(true);
    window.addEventListener('openAddModal', handleOpenAddModal);
    return () => window.removeEventListener('openAddModal', handleOpenAddModal);
  }, []);

  // Fetch transactions with filters
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
      fetchStockAccounts();
    }
  }, [status, filters]);

  // Separate useEffect for profit stats - only when non-pagination filters change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfitStats();
    }
  }, [
    status,
    filters.ticker,
    filters.type, 
    filters.dateFrom,
    filters.dateTo,
    filters.minAmount,
    filters.maxAmount
    // Note: NOT including page and pageSize here!
  ]);

  // Update when page changes (transactions only, not profit stats)
  useEffect(() => {
    if (status === 'authenticated') {
      handleFilterChange({ page: currentPage.toString(), pageSize: pageSize.toString() });
    }
  }, [currentPage, pageSize, status]);

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

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.ticker) params.append('ticker', filters.ticker);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('pageSize', filters.pageSize);
      
      const queryString = params.toString();
      const url = `/api/transactions${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách giao dịch');
      }
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalItems(data.totalCount);
      
      // Calculate total pages
      const total = Math.ceil(data.totalCount / pageSize);
      // If current page is greater than total pages, set to first page
      if (currentPage > total && total > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      setError('Lỗi khi tải giao dịch: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfitStats = async () => {
    try {
      // Build query string for profit stats (same filters but no pagination)
      const params = new URLSearchParams();
      
      if (filters.ticker) params.append('ticker', filters.ticker);
      if (filters.type) params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      
      const queryString = params.toString();
      const url = `/api/profit-stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không thể tải thống kê lãi lỗ');
      }
      const data = await response.json();
      setProfitStats(data.profitStats);
    } catch (err) {
      console.error('Fetch profit stats error:', err);
      // Set default stats on error
      setProfitStats({
        totalProfitLoss: 0,
        profitableTransactions: 0,
        unprofitableTransactions: 0,
        totalTransactions: 0,
        successRate: 0,
        averageProfit: 0,
        totalProfit: 0,
        totalLoss: 0
      });
    }
  };

  const handleFilterChange = (newFilters) => {
    // Check if non-pagination filters are changing
    const nonPaginationFiltersChanged = Object.keys(newFilters).some(key => 
      key !== 'page' && key !== 'pageSize'
    );
    
    // If changing filters other than pagination, reset to page 1
    if (nonPaginationFiltersChanged) {
      newFilters.page = '1';
      setCurrentPage(1);
    }
    
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    
    // Update URL query parameters
    const params = new URLSearchParams();
    const updatedFilters = { ...filters, ...newFilters };
    
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const queryString = params.toString();
    router.push(`/transactions${queryString ? `?${queryString}` : ''}`);
    
    // Fetch profit stats only if non-pagination filters changed
    if (nonPaginationFiltersChanged && status === 'authenticated') {
      fetchProfitStats();
    }
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleEditSuccess = () => {
    // Refresh transactions data after successful edit
    fetchTransactions();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleResetFilters = () => {
    setFilters({
      ticker: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      sortBy: 'transactionDate',
      sortOrder: 'desc',
      page: '1',
      pageSize: '10'
    });
    setCurrentPage(1);
    router.push('/transactions');
  };

  const handleDividendSuccess = (result) => {
    console.log('Dividend created successfully:', result);
    setIsDividendModalOpen(false);
    // Show success message
    showSuccess(`✅ ${result.adjustmentType} cho ${result.ticker} đã được tạo thành công!`);
    // Refresh transactions to show updated cost basis
    fetchTransactions();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header Section */}
      <div className="gradient-bg dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Quản lý Giao dịch</h1>
              <p className="text-xl opacity-90 dark:opacity-80 text-gray-600 dark:text-gray-300">Theo dõi và phân tích tất cả các giao dịch chứng khoán của bạn</p>
            </div>
            {status === 'authenticated' && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="glass-button text-blue-900 dark:text-blue-100 px-6 py-3 font-bold transition shadow-lg flex items-center"
                >
                  <IconPlus className="w-5 h-5 mr-2" />
                  Thêm Mới
                  <IconChevronDown className={`ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''} w-5 h-5`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-2xl z-50 border border-gray-200/50 dark:border-white/10">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsAddModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                      >
                        <IconLineChart className="text-blue-600 dark:text-blue-400 mr-3 w-5 h-5" />
                        <div>
                          <div className="font-medium">Thêm Giao Dịch</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Mua/bán cổ phiếu</div>
                        </div>
                      </button>
                      
                      <hr className="my-1 border-gray-200 dark:border-gray-700" />
                      
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsDividendModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                      >
                        <IconCoins className="text-green-600 dark:text-green-400 mr-3 w-5 h-5" />
                        <div className="text-left">
                          <div className="font-medium">Thêm Cổ Tức</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Nhập thông tin chia cổ tức</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 mt-6">
        {status === 'unauthenticated' ? (
          <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-12 text-center">
            <div className="flex flex-col items-center">
              <IconLineChart className="text-gray-400 dark:text-gray-500 w-16 h-16 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Đăng nhập để xem giao dịch</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Vui lòng đăng nhập để truy cập thông tin giao dịch của bạn</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6 mb-6">
              <TransactionFilters 
                filters={filters} 
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
              />
            </div>

            {/* Profit Statistics Section */}
            <ProfitStatistics 
              profitStats={profitStats}
              isVisible={!isLoading && !error}
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 p-4 rounded mb-6">
                <div className="flex items-center">
                  <IconAlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
                <TableSkeleton rows={10} cols={8} />
              </div>
            ) : (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border-b border-gray-200/50 dark:border-white/10 flex justify-between items-center">
                  <div className="flex items-center">
                    <IconBarChart className="text-blue-600 dark:text-blue-400 w-6 h-6 mr-3" />
                    <div className="font-semibold text-gray-800 dark:text-gray-200">Kết quả: {totalItems} giao dịch</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hiển thị:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        handleFilterChange({ pageSize: e.target.value, page: '1' });
                      }}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                
                <TransactionList 
                  transactions={transactions} 
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditSuccess={handleEditSuccess}
                  sortField={filters.sortBy}
                  sortDirection={filters.sortOrder}
                  onSortChange={(field, direction) => handleFilterChange({ sortBy: field, sortOrder: direction })}
                />
                
                {totalItems > 0 && (
                  <div className="p-6 border-t border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-gray-900/50">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalItems / pageSize)}
                      onPageChange={handlePageChange}
                    />
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

      {/* Dividend Modal */}
      {isDividendModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 ring-1 ring-black/5 dark:ring-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
              <div className="flex items-center">
                <IconCoins className="text-green-600 dark:text-green-400 w-6 h-6 mr-3" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thêm Thông Tin Cổ Tức</h2>
              </div>
              <button
                onClick={() => setIsDividendModalOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <DividendEventForm
                stockAccounts={stockAccounts}
                onSuccess={handleDividendSuccess}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={(message) => {
          showSuccess(message);
          fetchTransactions();
        }}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">
      <p>Đang tải trang giao dịch...</p>
    </div>}>
      <TransactionsContent />
    </Suspense>
  );
}
