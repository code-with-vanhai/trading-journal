'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TransactionList from '../components/TransactionList';
import TransactionFilters from '../components/TransactionFilters';
import Pagination from '../components/Pagination';

function TransactionsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [transactions, setTransactions] = useState([]);
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

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch transactions with filters
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, filters]);

  // Update when page changes
  useEffect(() => {
    if (status === 'authenticated') {
      handleFilterChange({ page: currentPage.toString(), pageSize: pageSize.toString() });
    }
  }, [currentPage, pageSize, status]);

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

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Giao Dịch</h1>
          <Link href="/transactions/new" className="btn-primary">
            Thêm Giao Dịch
          </Link>
        </div>

        {/* Filter Section */}
        <TransactionFilters 
          filters={filters} 
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
        />

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">Đang tải giao dịch...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="font-medium">Kết quả: {totalItems} giao dịch</div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-500">Hiển thị:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    handleFilterChange({ pageSize: e.target.value, page: '1' });
                  }}
                  className="input-field text-sm py-1 px-2"
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
              sortField={filters.sortBy}
              sortDirection={filters.sortOrder}
              onSortChange={(field, direction) => handleFilterChange({ sortBy: field, sortOrder: direction })}
            />
            
            {totalItems > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / pageSize)}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
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