'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMarketData } from '../lib/useMarketData';
import { Spinner } from '../components/ui/Spinner';
import Pagination from '../components/Pagination';
import Link from 'next/link';
import { useNotification } from '../components/Notification';
import logger, { componentLogger, apiLogger, userLogger } from '../lib/client-logger.js';

// Dynamic imports for heavy components to reduce initial bundle size
const PortfolioPieChart = dynamic(() => import('../components/PortfolioPieChart'), {
  loading: () => <div className="flex justify-center items-center h-64"><Spinner /></div>,
  ssr: false
});

const AccountAllocationPieChart = dynamic(() => import('../components/AccountAllocationPieChart'), {
  loading: () => <div className="flex justify-center items-center h-64"><Spinner /></div>,
  ssr: false
});

const TransferStocksModal = dynamic(() => import('../components/TransferStocksModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Spinner /></div>,
  ssr: false
});

const AddTransactionModal = dynamic(() => import('../components/AddTransactionModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Spinner /></div>,
  ssr: false
});

const SigninModal = dynamic(() => import('../components/SigninModal'), {
  loading: () => <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><Spinner /></div>,
  ssr: false
});

// Virtualized table for large datasets
const VirtualizedPortfolioTable = dynamic(() => import('../components/VirtualizedPortfolioTable'), { ssr: false });

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showSuccess } = useNotification();
  const [portfolio, setPortfolio] = useState([]);
  const [accountAllocations, setAccountAllocations] = useState([]);
  const [stockAccounts, setStockAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [marketData, setMarketData] = useState({});
  const [enrichedPortfolio, setEnrichedPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalSummary, setTotalSummary] = useState({ totalCostBasis: 0, totalPositions: 0 });
  const [allPortfolioForCharts, setAllPortfolioForCharts] = useState([]);
  const [enrichedAllPortfolio, setEnrichedAllPortfolio] = useState([]);
  
  // Cost Basis Adjustments state
  const [useAdjustedCostBasis, setUseAdjustedCostBasis] = useState(true);
  
  // Transfer functionality state
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Signin modal state
  const [signinModalOpen, setSigninModalOpen] = useState(false);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check authentication and show signin modal if needed
  useEffect(() => {
    if (status === 'unauthenticated') {
      setSigninModalOpen(true);
    }
  }, [status]);

  // Load stock accounts
  useEffect(() => {
    const fetchStockAccounts = async () => {
      if (status !== 'authenticated') return;
      
      try {
        setLoadingAccounts(true);
        const response = await fetch('/api/stock-accounts');
        if (response.ok) {
          const accounts = await response.json();
          setStockAccounts(accounts);
        }
      } catch (err) {
        logger.error('Error fetching stock accounts', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchStockAccounts();
  }, [status]);

  // SWR-based market data
  const dataSource = allPortfolioForCharts.length > 0 ? allPortfolioForCharts : portfolio;
  const allTickers = useMemo(() => {
    return dataSource.map(item => item.ticker).filter(Boolean);
  }, [dataSource]);
  const { data: swrMarketData, isLoading: swrLoading } = useMarketData(allTickers);

  // Portfolio data fetching effect (includes pagination)
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (status !== 'authenticated') {
        setLoading(false);
        return;
      }

      // Check if transactions have been updated or cost basis toggle changed
      let shouldFetchFresh = false;
      
      if (typeof window !== 'undefined') {
        const portfolioUpdatedAt = localStorage.getItem('portfolioDataUpdated');
        if (portfolioUpdatedAt) {
          // Clear the flag immediately
          localStorage.removeItem('portfolioDataUpdated');
          shouldFetchFresh = true;
          logger.debug('Portfolio: Transaction changes detected, refreshing data');
        }
        
        // Check if cost basis mode changed
        const lastCostBasisMode = localStorage.getItem('lastCostBasisMode');
        const currentMode = useAdjustedCostBasis.toString();
        if (lastCostBasisMode !== currentMode) {
          localStorage.setItem('lastCostBasisMode', currentMode);
          shouldFetchFresh = true;
          logger.debug('Portfolio: Cost basis mode changed', { mode: useAdjustedCostBasis ? 'Adjusted' : 'Original' });
        }
      }

      // For pagination changes, don't check cache - always fetch fresh data
      const isPaginationChange = typeof window !== 'undefined' && 
        localStorage.getItem('portfolioPaginationChange') === 'true';
      
      if (isPaginationChange) {
        localStorage.removeItem('portfolioPaginationChange');
        shouldFetchFresh = true;
      }

      // Check if we need to fetch new data (skip cache check for pagination)
      const now = Date.now();
      if (!shouldFetchFresh && !isPaginationChange && lastFetchTimestamp && now - lastFetchTimestamp < CACHE_DURATION) {
        logger.debug('Portfolio: Using cached data - SKIPPING FETCH');
        return;
      }

      try {
        // Only show loading spinner for non-pagination changes
        if (!isPaginationChange) {
          setLoading(true);
        }
        logger.debug('Portfolio: Fetching portfolio data');
        
        // Build URL with account filter, adjustments and pagination
        const params = new URLSearchParams();
        if (selectedAccountId) {
          params.append('stockAccountId', selectedAccountId);
        }
        if (useAdjustedCostBasis) {
          params.append('includeAdjustments', 'true');
        }
        params.append('page', currentPage.toString());
        params.append('pageSize', pageSize.toString());
        
        const url = `/api/portfolio${params.toString() ? `?${params.toString()}` : ''}`;
        logger.debug('Portfolio: Fetching URL', { url });
        logger.debug('Portfolio: Cost basis mode', { mode: useAdjustedCostBasis ? 'Adjusted' : 'Original' });
        logger.debug('Portfolio: Pagination parameters', { page: currentPage, pageSize });
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const data = await response.json();
        
        if (!data.portfolio || !Array.isArray(data.portfolio)) {
          logger.error('Portfolio: Invalid portfolio data format', data);
          setPortfolio([]);
        } else {
          logger.debug('Portfolio: Loaded holdings', { count: data.portfolio.length });
          logger.debug('Portfolio: Pagination info', { totalCount: data.totalCount, totalPages: data.totalPages });
          logger.debug('Portfolio: Current page info', { currentPage: data.page, pageSize: data.pageSize });
          setPortfolio(data.portfolio);
          setTotalItems(data.totalCount || 0);
          setTotalPages(data.totalPages || 0);
          
          // Set total summary for overview (not affected by pagination)
          if (data.totalSummary) {
            setTotalSummary(data.totalSummary);
          }
          
          // Set all portfolio data for charts (not affected by pagination)
          if (data.allPortfolioForCharts) {
            setAllPortfolioForCharts(data.allPortfolioForCharts);
          }
          
          // Set account allocations (only available when not filtering by specific account)
          if (data.accountAllocations) {
            setAccountAllocations(data.accountAllocations);
          }
        }
        
        // Only update timestamp for non-pagination changes
        if (!isPaginationChange) {
          setLastFetchTimestamp(now);
        }
      } catch (err) {
        logger.error('Portfolio: Fetch error', err);
        setError(err.message);
      } finally {
        // Only clear loading state if it was set (for non-pagination changes)
        if (!isPaginationChange) {
          setLoading(false);
        }
      }
    };

    fetchPortfolioData();
  }, [status, selectedAccountId, useAdjustedCostBasis, lastFetchTimestamp, currentPage, pageSize]);

  // Reflect SWR data into local state
  useEffect(() => {
    if (swrMarketData && typeof swrMarketData === 'object') {
      const validData = Object.entries(swrMarketData).reduce((acc, [ticker, price]) => {
        if (typeof price === 'number' && !isNaN(price)) acc[ticker] = price;
        return acc;
      }, {});
      const isSame = Object.keys(validData).length === Object.keys(marketData).length &&
        Object.keys(validData).every(k => marketData[k] === validData[k]);
      if (!isSame) {
        setMarketData(validData);
      }
    }
    if (marketDataLoading !== swrLoading) {
      setMarketDataLoading(swrLoading);
    }
  }, [swrMarketData, swrLoading]);

  const handlePageChange = (newPage) => {
    logger.debug('Portfolio: Changing page', { from: currentPage, to: newPage });
    setCurrentPage(newPage);
    // Mark as pagination change for optimized fetching
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolioPaginationChange', 'true');
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    const newSize = parseInt(newPageSize, 10);
    logger.debug('Portfolio: Changing page size', { from: pageSize, to: newSize });
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
    // Mark as pagination change for optimized fetching
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolioPaginationChange', 'true');
    }
  };

  // Calculate enriched portfolio data
  useEffect(() => {
    if (!portfolio.length || !Object.keys(marketData).length) return;

    logger.debug('Portfolio: Calculating portfolio metrics');
    
    const enriched = portfolio.map(holding => {
      const currentPrice = marketData[holding.ticker];
      
      if (typeof currentPrice === 'number' && !isNaN(currentPrice)) {
        const marketValue = holding.quantity * currentPrice;
        const unrealizedPL = marketValue - (holding.quantity * holding.avgCost);
        const plPercentage = holding.avgCost > 0 
          ? ((currentPrice - holding.avgCost) / holding.avgCost) * 100 
          : 0;
        
        return {
          ...holding,
          currentPrice,
          marketValue,
          unrealizedPL,
          plPercentage
        };
      }
      
      return {
        ...holding,
        currentPrice: null,
        marketValue: null,
        unrealizedPL: null,
        plPercentage: null
      };
    });

    setEnrichedPortfolio(enriched);
  }, [portfolio, marketData]);

  // Calculate enriched all portfolio data for charts (not affected by pagination)
  useEffect(() => {
    if (!allPortfolioForCharts.length || !Object.keys(marketData).length) return;

    logger.debug('Portfolio: Calculating all portfolio metrics for charts');
    
    const enrichedAll = allPortfolioForCharts.map(holding => {
      const currentPrice = marketData[holding.ticker];
      
      if (typeof currentPrice === 'number' && !isNaN(currentPrice)) {
        const marketValue = holding.quantity * currentPrice;
        const unrealizedPL = marketValue - (holding.quantity * holding.avgCost);
        const plPercentage = holding.avgCost > 0 
          ? ((currentPrice - holding.avgCost) / holding.avgCost) * 100 
          : 0;
        
        return {
          ...holding,
          currentPrice,
          marketValue,
          unrealizedPL,
          plPercentage
        };
      }
      
      return {
        ...holding,
        currentPrice: null,
        marketValue: null,
        unrealizedPL: null,
        plPercentage: null
      };
    });

    setEnrichedAllPortfolio(enrichedAll);
  }, [allPortfolioForCharts, marketData]);

  // Memoized chart data that only changes when account or cost basis changes
  const chartData = useMemo(() => {
    if (!enrichedAllPortfolio.length) return [];
    
    logger.debug('Portfolio: Calculating chart data');
    return enrichedAllPortfolio.filter(h => h.marketValue && h.marketValue > 0);
  }, [selectedAccountId, useAdjustedCostBasis, enrichedAllPortfolio.length]);

  const handleAccountChange = (e) => {
    setSelectedAccountId(e.target.value);
    // Clear selections when changing accounts
    setSelectedStocks([]);
    // Reset pagination when changing accounts
    setCurrentPage(1);
    // Force refresh for account change (not pagination)
    setLastFetchTimestamp(null);
  };

  // Stock selection handlers
  const handleStockSelect = (holding, isSelected) => {
    if (isSelected) {
      setSelectedStocks(prev => [...prev, {
        ticker: holding.ticker,
        accountId: holding.stockAccount?.id,
        accountName: holding.stockAccount?.name
      }]);
    } else {
      setSelectedStocks(prev => prev.filter(stock => stock.ticker !== holding.ticker));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allStocks = (enrichedPortfolio.length > 0 ? enrichedPortfolio : portfolio).map(holding => ({
        ticker: holding.ticker,
        accountId: holding.stockAccount?.id,
        accountName: holding.stockAccount?.name
      }));
      setSelectedStocks(allStocks);
    } else {
      setSelectedStocks([]);
    }
  };

  const isStockSelected = (ticker) => {
    return selectedStocks.some(stock => stock.ticker === ticker);
  };

  const isAllSelected = () => {
    const currentPortfolio = enrichedPortfolio.length > 0 ? enrichedPortfolio : portfolio;
    return currentPortfolio.length > 0 && selectedStocks.length === currentPortfolio.length;
  };

  const isSomeSelected = () => {
    return selectedStocks.length > 0 && !isAllSelected();
  };

  // Transfer handlers
  const handleOpenTransferModal = () => {
    setTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setTransferModalOpen(false);
  };

  const handleTransferSuccess = (message) => {
    showSuccess(message);
    setSelectedStocks([]);
    setTransferModalOpen(false);
    
    // Trigger data refresh for transfer (not pagination)
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolioDataUpdated', Date.now().toString());
    }
    
    // Reset pagination and force refresh for transfer
    setCurrentPage(1);
    setLastFetchTimestamp(null);
  };

  // Determine rows and virtualization condition
  const displayedRows = (enrichedPortfolio.length > 0 ? enrichedPortfolio : portfolio);
  const useVirtual = displayedRows.length > 100;

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Hero Header Section */}
        <div className="gradient-bg text-white py-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold mb-4">Danh Mục Đầu Tư</h1>
                <p className="text-xl opacity-90">Theo dõi hiệu suất và quản lý danh mục đầu tư của bạn</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto p-4 mt-6">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <i className="fas fa-chart-pie text-gray-400 text-6xl mb-6"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">Đăng nhập để xem danh mục</h3>
              <p className="text-gray-500 mb-6">Vui lòng đăng nhập để truy cập thông tin danh mục đầu tư của bạn</p>
            </div>
          </div>
        </div>

        {/* Signin Modal */}
        <SigninModal
          isOpen={signinModalOpen}
          onClose={() => setSigninModalOpen(false)}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p>Lỗi khi tải dữ liệu: {error}</p>
        </div>
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
              <h1 className="text-4xl font-bold mb-4">Danh Mục Đầu Tư</h1>
              <p className="text-xl opacity-90">Theo dõi hiệu suất và quản lý danh mục đầu tư của bạn</p>
            </div>
            {/* Compact Controls */}
            <div className="flex items-center space-x-3 lg:space-x-4">
              {loadingAccounts ? (
                <Spinner size="small" />
              ) : (
                stockAccounts.length > 0 && (
                  <>
                    {/* Account Selector - Compact */}
                    <div className="flex items-center space-x-2 relative group">
                      <label htmlFor="accountFilter" className="text-sm font-medium text-white whitespace-nowrap hidden sm:block">
                        Tài khoản:
                      </label>
                      <div className="relative">
                        <select
                          id="accountFilter"
                          value={selectedAccountId}
                          onChange={handleAccountChange}
                          className="px-3 py-2 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 text-white backdrop-blur-sm w-32 sm:w-36 lg:w-40 truncate appearance-none cursor-pointer"
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 8px center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '16px',
                            paddingRight: '2rem'
                          }}
                        >
                          <option value="" className="text-gray-900">Tất cả tài khoản</option>
                          {stockAccounts.map((account) => (
                            <option key={account.id} value={account.id} className="text-gray-900">
                              {account.name} {account.brokerName ? `(${account.brokerName})` : ''}
                            </option>
                          ))}
                        </select>
                        
                        {/* Account Tooltip */}
                        {selectedAccountId && (
                          <div className="absolute top-full left-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap">
                            <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3">
                              {(() => {
                                const account = stockAccounts.find(acc => acc.id === selectedAccountId);
                                return account ? `${account.name}${account.brokerName ? ` (${account.brokerName})` : ''}` : '';
                              })()}
                              <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Cost Basis Toggle - Compact */}
                    <div className="flex items-center space-x-2">
                      <label htmlFor="adjustedCostBasisToggle" className="text-sm font-medium text-white whitespace-nowrap hidden sm:block">
                        Giá vốn:
                      </label>
                      <div className="relative group">
                        <button
                          id="adjustedCostBasisToggle"
                          onClick={() => {
                            setUseAdjustedCostBasis(!useAdjustedCostBasis);
                            // Reset pagination when changing cost basis mode
                            setCurrentPage(1);
                            // Force refresh for cost basis change (not pagination)
                            setLastFetchTimestamp(null);
                          }}
                          className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 border w-20 sm:w-24 lg:w-28 ${
                            useAdjustedCostBasis
                              ? 'bg-green-500/20 text-green-100 border-green-400/50 hover:bg-green-500/30'
                              : 'bg-orange-500/20 text-orange-100 border-orange-400/50 hover:bg-orange-500/30'
                          }`}
                        >
                          <i className={`fas ${useAdjustedCostBasis ? 'fa-adjust' : 'fa-calculator'} mr-1 text-xs`}></i>
                          <span className="hidden sm:inline">{useAdjustedCostBasis ? 'Điều chỉnh' : 'Gốc'}</span>
                          <span className="sm:hidden">{useAdjustedCostBasis ? 'DC' : 'G'}</span>
                        </button>
                        {useAdjustedCostBasis && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        )}
                        
                        {/* Cost Basis Tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs whitespace-nowrap">
                            {useAdjustedCostBasis 
                              ? '📊 Giá vốn sau điều chỉnh cổ tức/quyền' 
                              : '🧮 Giá vốn gốc chưa điều chỉnh'}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 mt-6">
        {portfolio.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="flex flex-col items-center">
              <i className="fas fa-chart-pie text-gray-400 text-6xl mb-6"></i>
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                {selectedAccountId 
                  ? 'Tài khoản này chưa có cổ phiếu nào trong danh mục' 
                  : 'Bạn chưa có cổ phiếu nào trong danh mục'}
              </h3>
              <p className="text-gray-500 mb-6">Bắt đầu bằng cách thêm giao dịch đầu tiên của bạn</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
              >
                <i className="fas fa-plus mr-2"></i>
                Thêm giao dịch mới
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7">
              {/* Overview Stats */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center mb-6">
                  <i className="fas fa-chart-line text-blue-600 text-2xl mr-3"></i>
                  <h2 className="text-xl font-bold text-gray-800">
                    Tổng quan {selectedAccountId && stockAccounts.find(acc => acc.id === selectedAccountId)?.name && 
                      `- ${stockAccounts.find(acc => acc.id === selectedAccountId).name}`}
                  </h2>
                </div>
                {marketDataLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
                    <span className="text-gray-600">Đang cập nhật dữ liệu thị trường...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border-l-4 border-blue-500 overflow-hidden">
                      <div>
                        <div className="min-w-0">
                          <h3 className="text-xs md:text-sm text-blue-700 font-medium mb-2 whitespace-nowrap">Tổng Giá Vốn</h3>
                          <div className="text-xl md:text-2xl font-bold text-blue-900 leading-tight whitespace-nowrap">
                            {totalSummary.totalCostBasis.toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xl md:text-2xl font-bold text-blue-900 leading-tight">VND</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border-l-4 border-green-500 overflow-hidden">
                      <div>
                        <div className="min-w-0">
                          <h3 className="text-sm text-green-700 font-medium mb-2">Giá Trị Thị Trường</h3>
                          {marketData && enrichedAllPortfolio.length > 0 ? (
                            <>
                              <div className="text-xl md:text-2xl font-bold text-green-900 leading-tight whitespace-nowrap">
                                {enrichedAllPortfolio
                                  .reduce((sum, item) => sum + (item.marketValue || 0), 0)
                                  .toLocaleString('vi-VN')}
                              </div>
                              <div className="text-xl md:text-2xl font-bold text-green-900 leading-tight">VND</div>
                            </>
                          ) : (
                            <>
                              <div className="text-xl md:text-2xl font-bold text-gray-600 leading-tight">N/A</div>
                              <div className="text-xl md:text-2xl font-bold text-green-900 leading-tight">VND</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border-l-4 border-purple-500 overflow-hidden">
                      <div>
                        <div className="min-w-0">
                          <h3 className="text-xs md:text-sm text-purple-700 font-medium mb-2 whitespace-nowrap">Lãi/Lỗ Tạm tính</h3>
                          {marketData && enrichedAllPortfolio.length > 0 ? (
                            (() => {
                              const totalPL = enrichedAllPortfolio.reduce((sum, item) => sum + (item.unrealizedPL || 0), 0);
                              const isPositive = totalPL >= 0;
                              return (
                                <>
                                  <div className={`text-xl md:text-2xl font-bold leading-tight whitespace-nowrap ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}{totalPL.toLocaleString('vi-VN')}
                                  </div>
                                  <div className={`text-xl md:text-2xl font-bold leading-tight ${isPositive ? 'text-green-600' : 'text-red-600'}`}>VND</div>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <div className="text-xl md:text-2xl font-bold text-gray-600 leading-tight">N/A</div>
                              <div className="text-xl md:text-2xl font-bold text-purple-700 leading-tight">VND</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Transfer Controls */}
              {!selectedAccountId && (
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <i className="fas fa-exchange-alt text-orange-600"></i>
                      <span className="text-sm text-gray-700 font-medium">
                        {selectedStocks.length > 0 ? `Đã chọn ${selectedStocks.length} cổ phiếu` : 'Chọn cổ phiếu để chuyển tài khoản'}
                      </span>
                    </div>
                    <button
                      onClick={handleOpenTransferModal}
                      disabled={selectedStocks.length === 0}
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                    >
                      <i className="fas fa-arrow-right mr-2"></i>
                      Chuyển Tài Khoản
                    </button>
                  </div>
                </div>
              )}
              
              <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center">
                    <i className="fas fa-chart-bar text-blue-600 text-xl mr-3"></i>
                    <div className="font-semibold text-gray-800">Chi tiết danh mục: {totalSummary.totalPositions} positions</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-gray-600 font-medium">Hiển thị:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                {useVirtual ? (
                  <>
                    <div className="hidden lg:block">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            {!selectedAccountId && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chọn</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã CP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá vốn TB</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá đóng cửa hôm nay</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị thị trường</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lãi/Lỗ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lãi/Lỗ (%)</th>
                            {!selectedAccountId && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</th>
                            )}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                    <div style={{ height: 560 }}>
                      <VirtualizedPortfolioTable
                        rows={displayedRows}
                        rowHeight={56}
                        height={560}
                        renderRow={(holding, idx, style) => (
                          <div style={style} key={holding.ticker || idx} className="grid grid-cols-10 items-center border-b border-gray-200 px-6 bg-white">
                            {!selectedAccountId && (
                              <div className="py-3">
                                <input
                                  type="checkbox"
                                  checked={isStockSelected(holding.ticker)}
                                  onChange={(e) => handleStockSelect(holding, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </div>
                            )}
                            <div className="py-3 font-medium">{holding.ticker || 'N/A'}</div>
                            <div className="py-3">{holding.quantity?.toLocaleString() || '0'}</div>
                            <div className="py-3">{holding.avgCost ? holding.avgCost.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'} VND</div>
                            <div className="py-3">{marketDataLoading ? '...' : (holding.currentPrice ? holding.currentPrice.toLocaleString('vi-VN') : 'N/A')} VND</div>
                            <div className="py-3">{holding.marketValue ? holding.marketValue.toLocaleString('vi-VN') : 'N/A'} VND</div>
                            <div className="py-3">{holding.unrealizedPL != null ? (<span className={holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}>{holding.unrealizedPL.toLocaleString('vi-VN')} VND</span>) : 'N/A'}</div>
                            <div className="py-3">{holding.plPercentage != null ? (<span className={holding.plPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>{holding.plPercentage.toFixed(2)}%</span>) : 'N/A'}</div>
                            {!selectedAccountId && (
                              <div className="py-3">
                                <div>{holding.stockAccount?.name || 'N/A'}</div>
                                {holding.stockAccount?.brokerName && (<div className="text-xs text-gray-500">{holding.stockAccount.brokerName}</div>)}
                              </div>
                            )}
                            <div className="py-3 text-sm font-medium">
                              <Link href={`/transactions?ticker=${holding.ticker || ''}`} className="text-indigo-600 hover:text-indigo-900">Lịch sử giao dịch</Link>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        {!selectedAccountId && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={isAllSelected()}
                              ref={input => {
                                if (input) input.indeterminate = isSomeSelected();
                              }}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã CP</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá vốn TB</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá đóng cửa hôm nay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị thị trường</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lãi/Lỗ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lãi/Lỗ (%)</th>
                        {!selectedAccountId && (<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</th>)}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {displayedRows.map((holding) => {
                        if (!holding || typeof holding !== 'object') return null;
                        return (
                          <tr key={holding.ticker || 'unknown'} className="hover:bg-gray-50">
                            {!selectedAccountId && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input type="checkbox" checked={isStockSelected(holding.ticker)} onChange={(e) => handleStockSelect(holding, e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{holding.ticker || 'N/A'}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{holding.quantity ? holding.quantity.toLocaleString() : '0'}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{holding.avgCost ? holding.avgCost.toLocaleString('vi-VN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'} VND</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{marketDataLoading ? (<Spinner size="small" />) : holding.currentPrice ? (holding.currentPrice.toLocaleString('vi-VN')) : ('N/A')} VND</div></td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{holding.marketValue ? (holding.marketValue.toLocaleString('vi-VN')) : ('N/A')} VND</div></td>
                            <td className="px-6 py-4 whitespace-nowrap">{holding.unrealizedPL != null ? (<div className={`text-sm ${holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{holding.unrealizedPL.toLocaleString('vi-VN')} VND</div>) : (<div className="text-sm text-gray-500">N/A</div>)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{holding.plPercentage != null ? (<div className={`text-sm ${holding.plPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>{holding.plPercentage.toFixed(2)}%</div>) : (<div className="text-sm text-gray-500">N/A</div>)}</td>
                            {!selectedAccountId && (<td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{holding.stockAccount?.name || 'N/A'}{holding.stockAccount?.brokerName && (<div className="text-xs text-gray-500">{holding.stockAccount.brokerName}</div>)}</div></td>)}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><Link href={`/transactions?ticker=${holding.ticker || ''}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Lịch sử giao dịch</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
                
                {totalPages > 1 && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <Pagination 
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>

            </div>
            
            <div className="lg:col-span-3 space-y-6">
              {/* Portfolio Allocation Chart */}
              {marketDataLoading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                  <Spinner size="large" />
                </div>
              ) : (
                <PortfolioPieChart 
                  holdings={chartData} 
                />
              )}
              
              {/* Account Allocation Chart - Only show when viewing all accounts */}
              {!selectedAccountId && (
                <AccountAllocationPieChart 
                  accountAllocations={accountAllocations}
                />
              )}
            </div>
          </div>
        )}

        {/* Transfer Stocks Modal */}
        <TransferStocksModal
          isOpen={transferModalOpen}
          onClose={handleCloseTransferModal}
          selectedStocks={selectedStocks}
          onTransferSuccess={handleTransferSuccess}
        />

        {/* Add Transaction Modal */}
        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={(message) => {
            showSuccess(message);
            fetchData();
          }}
        />
      </div>
    </div>
  );
} 