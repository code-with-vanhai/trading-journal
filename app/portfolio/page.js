'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '../components/ui/Spinner';
import PortfolioPieChart from '../components/PortfolioPieChart';
import AccountAllocationPieChart from '../components/AccountAllocationPieChart';
import TransferStocksModal from '../components/TransferStocksModal';
import Link from 'next/link';

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  
  // Transfer functionality state
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Check authentication and redirect if needed
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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
        console.error('Error fetching stock accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchStockAccounts();
  }, [status]);

  // Memoized market data fetch function
  const fetchMarketData = useCallback(async (tickers) => {
    if (!tickers || tickers.length === 0) {
      console.log('[Portfolio] No tickers to fetch market data for');
      return;
    }

    try {
      setMarketDataLoading(true);
      const tickersParam = tickers.join(',');
      
      console.log(`[Portfolio] Fetching market data for: ${tickersParam}`);
      const startTime = Date.now();
      const response = await fetch(`/api/market-data?tickers=${tickersParam}`);
      const responseTime = Date.now() - startTime;
      
      console.log(`[Portfolio] Market data response received in ${responseTime}ms`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      const data = await response.json();
      
      // Validate market data
      const validData = Object.entries(data).reduce((acc, [ticker, price]) => {
        if (typeof price === 'number' && !isNaN(price)) {
          acc[ticker] = price;
        } else {
          console.warn(`[Portfolio] Invalid price for ${ticker}:`, price);
        }
        return acc;
      }, {});
      
      setMarketData(validData);
    } catch (err) {
      console.error('[Portfolio] Market data fetch error:', err);
      // Don't set error state to still show portfolio
    } finally {
      setMarketDataLoading(false);
    }
  }, []);

  // Combined data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') {
        setLoading(false);
        return;
      }

      // Check if transactions have been updated
      let shouldFetchFresh = false;
      
      if (typeof window !== 'undefined') {
        const portfolioUpdatedAt = localStorage.getItem('portfolioDataUpdated');
        if (portfolioUpdatedAt) {
          // Clear the flag immediately
          localStorage.removeItem('portfolioDataUpdated');
          shouldFetchFresh = true;
          console.log('[Portfolio] Transaction changes detected, refreshing data');
        }
      }

      // Check if we need to fetch new data
      const now = Date.now();
      if (!shouldFetchFresh && lastFetchTimestamp && now - lastFetchTimestamp < CACHE_DURATION) {
        console.log('[Portfolio] Using cached data');
        return;
      }

      try {
        setLoading(true);
        console.log('[Portfolio] Fetching portfolio data');
        
        // Build URL with account filter if selected
        const url = selectedAccountId 
          ? `/api/portfolio?stockAccountId=${selectedAccountId}`
          : '/api/portfolio';
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const data = await response.json();
        
        if (!data.portfolio || !Array.isArray(data.portfolio)) {
          console.error('[Portfolio] Invalid portfolio data format:', data);
          setPortfolio([]);
        } else {
          console.log(`[Portfolio] Loaded ${data.portfolio.length} holdings`);
          setPortfolio(data.portfolio);
          
          // Set account allocations (only available when not filtering by specific account)
          if (data.accountAllocations) {
            setAccountAllocations(data.accountAllocations);
          }
          
          // Fetch market data if we have holdings
          if (data.portfolio.length > 0) {
            const tickers = data.portfolio.map(item => item.ticker);
            await fetchMarketData(tickers);
          }
        }
        
        setLastFetchTimestamp(now);
      } catch (err) {
        console.error('[Portfolio] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status, selectedAccountId, fetchMarketData, lastFetchTimestamp]);

  // Calculate enriched portfolio data
  useEffect(() => {
    if (!portfolio.length || !Object.keys(marketData).length) return;

    console.log('[Portfolio] Calculating portfolio metrics');
    
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

  const handleAccountChange = (e) => {
    setSelectedAccountId(e.target.value);
    // Clear selections when changing accounts
    setSelectedStocks([]);
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
    alert(message);
    setSelectedStocks([]);
    setTransferModalOpen(false);
    
    // Trigger data refresh
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolioDataUpdated', Date.now().toString());
    }
    
    // Force refresh
    setLastFetchTimestamp(null);
  };

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
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem danh mục đầu tư</p>
          <Link href="/auth/signin" className="btn-primary">
            Đăng nhập
          </Link>
        </div>
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
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh Mục Đầu Tư</h1>
        
        {/* Account Filter */}
        <div className="flex items-center space-x-4">
          {loadingAccounts ? (
            <Spinner size="small" />
          ) : (
            stockAccounts.length > 0 && (
              <div className="flex items-center space-x-2">
                <label htmlFor="accountFilter" className="text-sm font-medium text-gray-700">
                  Tài khoản:
                </label>
                <select
                  id="accountFilter"
                  value={selectedAccountId}
                  onChange={handleAccountChange}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
                >
                  <option value="">Tất cả tài khoản</option>
                  {stockAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} {account.brokerName ? `(${account.brokerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )
          )}
        </div>
      </div>

      {portfolio.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">
            {selectedAccountId 
              ? 'Tài khoản này chưa có cổ phiếu nào trong danh mục.' 
              : 'Bạn chưa có cổ phiếu nào trong danh mục.'}
          </p>
          <Link 
            href="/transactions/new" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Thêm giao dịch mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-lg font-semibold mb-4">
                Tổng quan {selectedAccountId && stockAccounts.find(acc => acc.id === selectedAccountId)?.name && 
                  `- ${stockAccounts.find(acc => acc.id === selectedAccountId).name}`}
              </h2>
              {marketDataLoading ? (
                <div className="flex justify-center items-center py-4">
                  <Spinner size="medium" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm text-gray-500 mb-1">Tổng Giá Vốn</h3>
                    <p className="text-xl font-semibold">
                      {portfolio.reduce((sum, item) => sum + (item.quantity * item.avgCost), 0)
                        .toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm text-gray-500 mb-1">Tổng Giá Trị Thị Trường</h3>
                    <p className="text-xl font-semibold">
                      {marketData && enrichedPortfolio.length > 0 
                        ? enrichedPortfolio.reduce((sum, item) => sum + (item.marketValue || 0), 0)
                            .toLocaleString('vi-VN')
                        : 'N/A'} VND
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <h3 className="text-sm text-gray-500 mb-1">Tổng Lãi/Lỗ Tạm tính</h3>
                    {marketData && enrichedPortfolio.length > 0 ? (
                      <p className={`text-xl font-semibold ${
                        enrichedPortfolio.reduce((sum, item) => sum + (item.unrealizedPL || 0), 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {enrichedPortfolio.reduce((sum, item) => sum + (item.unrealizedPL || 0), 0)
                          .toLocaleString('vi-VN')} VND
                      </p>
                    ) : (
                      <p className="text-xl font-semibold">N/A</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Transfer Controls */}
            {!selectedAccountId && (
              <div className="bg-white p-4 rounded-lg shadow mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedStocks.length > 0 ? `Đã chọn ${selectedStocks.length} cổ phiếu` : 'Chọn cổ phiếu để chuyển tài khoản'}
                    </span>
                  </div>
                  <button
                    onClick={handleOpenTransferModal}
                    disabled={selectedStocks.length === 0}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Chuyển Tài Khoản
                  </button>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto bg-white rounded-lg shadow">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã CP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá vốn TB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá đóng cửa hôm nay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá trị thị trường
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lãi/Lỗ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lãi/Lỗ (%)
                    </th>
                    {!selectedAccountId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tài khoản
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(enrichedPortfolio.length > 0 ? enrichedPortfolio : portfolio).map((holding) => {
                    if (!holding || typeof holding !== 'object') return null;
                    
                    return (
                      <tr key={holding.ticker || 'unknown'} className="hover:bg-gray-50">
                        {!selectedAccountId && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isStockSelected(holding.ticker)}
                              onChange={(e) => handleStockSelect(holding, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{holding.ticker || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {holding.quantity ? holding.quantity.toLocaleString() : '0'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {holding.avgCost ? holding.avgCost.toLocaleString('vi-VN', { 
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0 
                            }) : '0'} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {marketDataLoading ? (
                              <Spinner size="small" />
                            ) : holding.currentPrice ? (
                              holding.currentPrice.toLocaleString('vi-VN')
                            ) : (
                              'N/A'
                            )} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {holding.marketValue ? (
                              holding.marketValue.toLocaleString('vi-VN')
                            ) : (
                              'N/A'
                            )} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {holding.unrealizedPL != null ? (
                            <div className={`text-sm ${holding.unrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.unrealizedPL.toLocaleString('vi-VN')} VND
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">N/A</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {holding.plPercentage != null ? (
                            <div className={`text-sm ${holding.plPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {holding.plPercentage.toFixed(2)}%
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">N/A</div>
                          )}
                        </td>
                        {!selectedAccountId && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {holding.stockAccount?.name || 'N/A'}
                              {holding.stockAccount?.brokerName && (
                                <div className="text-xs text-gray-500">
                                  {holding.stockAccount.brokerName}
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/transactions?ticker=${holding.ticker || ''}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Lịch sử giao dịch
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            {/* Portfolio Allocation Chart */}
            {marketDataLoading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                <Spinner size="large" />
              </div>
            ) : (
              <PortfolioPieChart 
                holdings={enrichedPortfolio.filter(h => h.marketValue && h.marketValue > 0)} 
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
    </div>
  );
} 