'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from '../components/ui/Spinner';
import PortfolioPieChart from '../components/PortfolioPieChart';
import Link from 'next/link';

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const [portfolio, setPortfolio] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [enrichedPortfolio, setEnrichedPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketDataLoading, setMarketDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState(null);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

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

      // Check if we need to fetch new data
      const now = Date.now();
      if (lastFetchTimestamp && now - lastFetchTimestamp < CACHE_DURATION) {
        console.log('[Portfolio] Using cached data');
        return;
      }

      try {
        setLoading(true);
        console.log('[Portfolio] Fetching portfolio data');
        
        const response = await fetch('/api/portfolio');
        
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
  }, [status, fetchMarketData, lastFetchTimestamp]);

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

    // Calculate allocations
    const totalMarketValue = enriched.reduce((sum, h) => sum + (h.marketValue || 0), 0);
    
    const finalEnriched = enriched.map(holding => ({
      ...holding,
      allocationPercentage: totalMarketValue > 0 && holding.marketValue 
        ? (holding.marketValue / totalMarketValue * 100)
        : 0
    }));

    setEnrichedPortfolio(finalEnriched);
  }, [portfolio, marketData]);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  // Authentication check
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg mb-4">Please log in to view your portfolio.</p>
        <Link 
          href="/auth/signin" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p className="text-lg">Error: {error}</p>
        <button 
          onClick={() => {
            setError(null);
            setLastFetchTimestamp(null); // Force a fresh fetch
          }} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Danh mục đầu tư</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      ) : portfolio.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg shadow">
          <p className="text-lg text-gray-600">Bạn chưa có cổ phiếu nào trong danh mục.</p>
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
              <h2 className="text-lg font-semibold mb-4">Tổng quan</h2>
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
            
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
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
          
          <div className="lg:col-span-1">
            {marketDataLoading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                <Spinner size="large" />
              </div>
            ) : (
              <PortfolioPieChart 
                holdings={enrichedPortfolio.filter(h => h.marketValue && h.marketValue > 0)} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 