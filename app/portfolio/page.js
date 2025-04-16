'use client';

import { useState, useEffect } from 'react';
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
  const [apiCalls, setApiCalls] = useState({
    portfolioCall: { status: 'idle', timestamp: null },
    marketDataCall: { status: 'idle', timestamp: null }
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          setApiCalls(prev => ({
            ...prev,
            portfolioCall: { status: 'loading', timestamp: new Date().toISOString() }
          }));
          
          console.log('[Portfolio] Starting API call to fetch portfolio data');
          const response = await fetch('/api/portfolio');
          
          console.log(`[Portfolio] Received response from API, status: ${response.status}`);
          setApiCalls(prev => ({
            ...prev,
            portfolioCall: { 
              status: response.ok ? 'success' : 'error', 
              timestamp: new Date().toISOString(),
              statusCode: response.status
            }
          }));
          
          if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu danh mục đầu tư');
          }
          
          const data = await response.json();
          console.log('[Portfolio] API response data:', data);
          
          if (!data.portfolio || !Array.isArray(data.portfolio)) {
            console.error('[Portfolio] Invalid portfolio data format:', data);
            setPortfolio([]);
          } else {
            console.log(`[Portfolio] Successfully loaded ${data.portfolio.length} holdings`);
            setPortfolio(data.portfolio);
            
            // Fetch market data for the tickers in the portfolio
            if (data.portfolio.length > 0) {
              const tickers = data.portfolio.map(item => item.ticker);
              console.log(`[Portfolio] Will fetch market data for tickers: ${tickers.join(', ')}`);
              await fetchMarketData(tickers);
            } else {
              console.log('[Portfolio] No holdings to fetch market data for');
            }
          }
        } catch (err) {
          console.error('[Portfolio] Error fetching portfolio:', err);
          setApiCalls(prev => ({
            ...prev,
            portfolioCall: { 
              status: 'error', 
              timestamp: new Date().toISOString(),
              error: err.message 
            }
          }));
          setError(err.message);
        } finally {
          setLoading(false);
        }
      } else {
        // Make sure loading is set to false for unauthenticated users
        setLoading(false);
      }
    };

    const fetchMarketData = async (tickers) => {
      try {
        setMarketDataLoading(true);
        const tickersParam = tickers.join(',');
        
        setApiCalls(prev => ({
          ...prev,
          marketDataCall: { status: 'loading', timestamp: new Date().toISOString() }
        }));
        
        console.log(`[Portfolio] Starting API call to fetch market data for tickers: ${tickersParam}`);
        console.log(`[Portfolio] API URL: /api/market-data?tickers=${tickersParam}`);
        
        const startTime = Date.now();
        const response = await fetch(`/api/market-data?tickers=${tickersParam}`);
        const responseTime = Date.now() - startTime;
        
        console.log(`[Portfolio] Received market data response in ${responseTime}ms, status: ${response.status}`);
        setApiCalls(prev => ({
          ...prev,
          marketDataCall: { 
            status: response.ok ? 'success' : 'error', 
            timestamp: new Date().toISOString(),
            statusCode: response.status,
            responseTime: `${responseTime}ms`
          }
        }));
        
        if (!response.ok) {
          console.error(`[Portfolio] Market data API error: ${response.status} ${response.statusText}`);
          throw new Error('Không thể lấy dữ liệu giá thị trường');
        }
        
        const data = await response.json();
        console.log('[Portfolio] Market data response:', data);
        
        // Check for errors or null values in market data
        const tickersWithNoData = tickers.filter(ticker => data[ticker] === null || data[ticker]?.error);
        if (tickersWithNoData.length > 0) {
          console.warn(`[Portfolio] Missing market data for tickers: ${tickersWithNoData.join(', ')}`);
        }
        
        const tickersWithData = tickers.filter(ticker => typeof data[ticker] === 'number');
        console.log(`[Portfolio] Successfully loaded market data for ${tickersWithData.length}/${tickers.length} tickers`);
        
        setMarketData(data);
      } catch (err) {
        console.error('[Portfolio] Error fetching market data:', err);
        setApiCalls(prev => ({
          ...prev,
          marketDataCall: { 
            status: 'error', 
            timestamp: new Date().toISOString(),
            error: err.message 
          }
        }));
        // We don't set the main error state here to still show the portfolio
      } finally {
        setMarketDataLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchPortfolio();
    }
  }, [status]);

  // Calculate enriched portfolio with market data
  useEffect(() => {
    if (portfolio.length > 0 && Object.keys(marketData).length > 0) {
      console.log('[Portfolio] Calculating enriched portfolio data from market prices');
      
      const enriched = portfolio.map(holding => {
        const currentPrice = marketData[holding.ticker];
        
        // Only calculate market values if we have price data and it's a number
        if (typeof currentPrice === 'number') {
          const marketValue = holding.quantity * currentPrice;
          const unrealizedPL = marketValue - (holding.quantity * holding.avgCost);
          const plPercentage = holding.avgCost > 0 
            ? (currentPrice - holding.avgCost) / holding.avgCost * 100 
            : 0;
          
          console.log(`[Portfolio] Calculated for ${holding.ticker}: price=${currentPrice}, marketValue=${marketValue}, PL=${unrealizedPL}`);  
          
          return {
            ...holding,
            currentPrice,
            marketValue,
            unrealizedPL,
            plPercentage
          };
        } else {
          console.warn(`[Portfolio] Missing market price for ${holding.ticker}, cannot calculate metrics`);
          return {
            ...holding,
            currentPrice: null,
            marketValue: null,
            unrealizedPL: null,
            plPercentage: null
          };
        }
      });
      
      // Calculate total market value for allocations
      const totalMarketValue = enriched.reduce((total, holding) => 
        total + (holding.marketValue || 0), 0);
      
      console.log(`[Portfolio] Total portfolio market value: ${totalMarketValue}`);
      
      // Add allocation percentages
      const finalEnriched = enriched.map(holding => {
        const allocationPercentage = totalMarketValue > 0 && holding.marketValue 
          ? (holding.marketValue / totalMarketValue * 100) 
          : 0;
        
        if (holding.marketValue) {
          console.log(`[Portfolio] Allocation for ${holding.ticker}: ${allocationPercentage.toFixed(2)}%`);
        }
        
        return {
          ...holding,
          allocationPercentage
        };
      });
      
      console.log('[Portfolio] Enriched portfolio data:', finalEnriched);
      setEnrichedPortfolio(finalEnriched);
    } else {
      console.warn(`[Portfolio] Cannot enrich portfolio: portfolio length = ${portfolio.length}, market data keys = ${Object.keys(marketData).length}`);
    }
  }, [portfolio, marketData]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="large" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg mb-4">Bạn cần đăng nhập để xem phần này.</p>
        <Link 
          href="/auth/signin" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-600">
        <p className="text-lg">Đã xảy ra lỗi: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Thử lại
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