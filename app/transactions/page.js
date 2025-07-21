'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TransactionList from '../components/TransactionList';
import AddTransactionModal from '../components/AddTransactionModal';
import TransactionFilters from '../components/TransactionFilters';
import Pagination from '../components/Pagination';
import SigninModal from '../components/SigninModal';
import ProfitStatistics from '../components/ProfitStatistics';
import DividendEventForm from '../components/DividendEventForm';

function TransactionsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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

  // Update when page changes
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
      setProfitStats(data.profitStats);
      
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

  const handleFilterChange = (newFilters) => {
    // If changing filters other than pagination, reset to page 1
    if (Object.keys(newFilters).some(key => key !== 'page' && key !== 'pageSize')) {
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
    alert(`✅ ${result.adjustmentType} cho ${result.ticker} đã được tạo thành công!`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header Section */}
      <div className="gradient-bg text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">Quản lý Giao dịch</h1>
              <p className="text-xl opacity-90">Theo dõi và phân tích tất cả các giao dịch chứng khoán của bạn</p>
            </div>
            {status === 'authenticated' && (
              <div className="relative dropdown-container">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="bg-white text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-blue-100 transition shadow-lg flex items-center"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Thêm Mới
                  <i className={`fas fa-chevron-down ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsAddModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                      >
                        <i className="fas fa-chart-line text-blue-600 mr-3 w-4"></i>
                        <div>
                          <div className="font-medium">Thêm Giao Dịch</div>
                          <div className="text-sm text-gray-500">Mua/bán cổ phiếu</div>
                        </div>
                      </button>
                      
                      <hr className="my-1 border-gray-200" />
                      
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsDividendModalOpen(true);
                        }}
                        className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-green-50 hover:text-green-900 transition-colors"
                      >
                        <i className="fas fa-coins text-green-600 mr-3 w-4"></i>
                        <div className="text-left">
                          <div className="font-medium">Thêm Cổ Tức</div>
                          <div className="text-sm text-gray-500">Nhập thông tin chia cổ tức</div>
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
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <i className="fas fa-chart-line text-gray-400 text-6xl mb-6"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">Đăng nhập để xem giao dịch</h3>
              <p className="text-gray-500 mb-6">Vui lòng đăng nhập để truy cập thông tin giao dịch của bạn</p>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Section */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
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
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {error}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">Đang tải giao dịch...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-chart-bar text-blue-600 text-xl mr-3"></i>
                    <div className="font-semibold text-gray-800">Kết quả: {totalItems} giao dịch</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 font-medium">Hiển thị:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(parseInt(e.target.value, 10));
                        handleFilterChange({ pageSize: e.target.value, page: '1' });
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <i className="fas fa-coins text-green-600 text-xl mr-3"></i>
                <h2 className="text-xl font-bold text-gray-900">Thêm Thông Tin Cổ Tức</h2>
              </div>
              <button
                onClick={() => setIsDividendModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
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
          alert(message);
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