'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AccountFeeList from '../components/AccountFeeList';
import AccountFeeFilters from '../components/AccountFeeFilters';
import AccountFeeModal from '../components/AccountFeeModal';
import AccountFeeSummary from '../components/AccountFeeSummary';
import Pagination from '../components/Pagination';
import SigninModal from '../components/SigninModal';

function AccountFeesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [accountFees, setAccountFees] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filter states
  const [filters, setFilters] = useState({
    feeType: searchParams.get('feeType') || '',
    stockAccountId: searchParams.get('stockAccountId') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || '',
    search: searchParams.get('search') || '',
    sortBy: searchParams.get('sortBy') || 'feeDate',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: searchParams.get('page') || '1',
    pageSize: searchParams.get('pageSize') || '10'
  });

  // UI states
  const [showModal, setShowModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);
  const [signinModalOpen, setSigninModalOpen] = useState(false);

  // Check authentication and show signin modal if needed
  useEffect(() => {
    if (status === 'unauthenticated') {
      setSigninModalOpen(true);
    }
  }, [status]);

  // Fetch account fees with filters
  useEffect(() => {
    if (status === 'authenticated') {
      fetchAccountFees();
    }
  }, [status, filters]);

  // Update when page changes
  useEffect(() => {
    if (status === 'authenticated') {
      handleFilterChange({ page: currentPage.toString(), pageSize: pageSize.toString() });
    }
  }, [currentPage, pageSize, status]);

  const fetchAccountFees = async () => {
    setIsLoading(true);
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.feeType) params.append('feeType', filters.feeType);
      if (filters.stockAccountId) params.append('stockAccountId', filters.stockAccountId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('pageSize', filters.pageSize);
      
      const queryString = params.toString();
      const url = `/api/account-fees${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách phí tài khoản');
      }
      const data = await response.json();
      
      setAccountFees(data.accountFees);
      setTotalItems(data.totalCount);
      setSummaryStats(data.summaryStats);
      
      // Calculate total pages
      const total = Math.ceil(data.totalCount / pageSize);
      // If current page is greater than total pages, set to first page
      if (currentPage > total && total > 0) {
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error fetching account fees:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL with new filters
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.append(key, value);
      }
    });
    
    const newUrl = `/account-fees${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleFilterChange({ page: page.toString() });
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
    handleFilterChange({ pageSize: size.toString(), page: '1' });
  };

  const handleAddFee = () => {
    setEditingFee(null);
    setShowModal(true);
  };

  const handleEditFee = (fee) => {
    setEditingFee(fee);
    setShowModal(true);
  };

  const handleDeleteFee = async (feeId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phí này không?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/account-fees/${feeId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa phí tài khoản');
      }
      
      // Refresh the list
      fetchAccountFees();
    } catch (err) {
      console.error('Error deleting fee:', err);
      setError(err.message);
    }
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingFee(null);
    fetchAccountFees();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingFee(null);
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <SigninModal isOpen={signinModalOpen} onClose={() => setSigninModalOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <div className="gradient-bg dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quản Lý Phí Tài Khoản</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Theo dõi và quản lý các loại phí liên quan đến tài khoản chứng khoán
              </p>
            </div>
            <button
              onClick={handleAddFee}
              className="glass-button text-blue-900 dark:text-blue-100 font-medium py-2 px-4 flex items-center gap-2 transition shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm Phí
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          {/* Summary Statistics */}
          <AccountFeeSummary 
            summaryStats={summaryStats} 
            isLoading={isLoading}
          />

          {/* Filters */}
          <AccountFeeFilters
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Account Fees List */}
          <AccountFeeList
            accountFees={accountFees}
            isLoading={isLoading}
            onEdit={handleEditFee}
            onDelete={handleDeleteFee}
          />
          
          {/* Page Size Selector and Pagination */}
          {totalItems > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 font-medium">Hiển thị:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} của {totalItems} kết quả
                </span>
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / pageSize)}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Account Fee Modal */}
        <AccountFeeModal
          isOpen={showModal}
          onClose={handleModalClose}
          fee={editingFee}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
}

export default function AccountFeesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    }>
      <AccountFeesContent />
    </Suspense>
  );
}
