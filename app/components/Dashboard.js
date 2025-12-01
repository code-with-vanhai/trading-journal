'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useSession } from 'next-auth/react';
import { CardSkeleton, ChartSkeleton } from './ui/Skeleton';
import GlassCard from './ui/GlassCard';

const Dashboard = ({ period = 'all' }) => {
  const { data: session } = useSession();
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [tickerBreakdown, setTickerBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!session?.user?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Use consolidated Dashboard API - single request instead of multiple
        const response = await fetch(`/api/dashboard?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        
        // Extract data from consolidated response
        setSummary(data.summary);
        setPerformance(data.performance || []);
        setTickerBreakdown(data.tickerBreakdown || []);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [session?.user?.id, period]);
  
  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton height={256} />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <GlassCard className="text-center text-gray-500 dark:text-gray-400 p-8">
        <p>Không có dữ liệu. Hãy bắt đầu thêm giao dịch để xem phân tích danh mục của bạn.</p>
      </GlassCard>
    );
  }
  
  // Format monetary values for VND
  const formatCurrency = (value) => {
    // Convert to VND (assuming value is in base unit)
    return value.toLocaleString('vi-VN') + ' ₫';
  };
  
  // Format percentage values
  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };
  
  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4 fade-in-up">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Tổng Lãi/Lỗ</h3>
          <p className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(summary.totalProfitLoss)}
          </p>
        </GlassCard>
        
        <GlassCard className="p-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">ROI</h3>
          <p className={`text-2xl font-bold ${summary.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercent(summary.roi)}
          </p>
        </GlassCard>
        
        <GlassCard className="p-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Tỉ Lệ Thắng</h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatPercent(summary.winRate)}
          </p>
        </GlassCard>
        
        <GlassCard className="p-4 fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Tổng Giao Dịch</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.totalTrades}
          </p>
        </GlassCard>
      </div>
      
      {/* Performance Chart */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Hiệu Suất Theo Thời Gian</h3>
        {performance.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                <XAxis dataKey="date" strokeOpacity={0.5} stroke="#888888" />
                <YAxis strokeOpacity={0.5} stroke="#888888" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    color: '#1f2937'
                  }}
                  formatter={(value) => [formatCurrency(value), 'Giá Trị Danh Mục']}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Giá Trị Danh Mục"
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500">Không có dữ liệu hiệu suất</p>
        )}
      </GlassCard>
      
      {/* Ticker Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Hiệu Suất Cao Nhất</h3>
          {tickerBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tickerBreakdown.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                  <XAxis dataKey="ticker" strokeOpacity={0.5} stroke="#888888" />
                  <YAxis strokeOpacity={0.5} stroke="#888888" />
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Lãi/Lỗ']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="profitLoss" 
                    name="Lãi/Lỗ" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500">Không có dữ liệu cổ phiếu</p>
          )}
        </GlassCard>
        
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Phân Bổ Danh Mục</h3>
          {tickerBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tickerBreakdown.filter(t => t.totalInvested > 0).slice(0, 6)}
                    dataKey="totalInvested"
                    nameKey="ticker"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ticker, percent}) => `${ticker} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {tickerBreakdown.filter(t => t.totalInvested > 0).slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                        color: '#1f2937'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Đã Đầu Tư']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500">Không có dữ liệu phân bổ</p>
          )}
        </GlassCard>
      </div>
      
      {/* Detailed Stats */}
      <GlassCard className="p-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Thống Kê Chi Tiết</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Đầu Tư</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(summary.totalInvested)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng Thu Về</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{formatCurrency(summary.totalReturned)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Giao Dịch Mua</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{summary.totalBuys}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Giao Dịch Bán</p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{summary.totalSells}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Giao Dịch Có Lãi</p>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">{summary.profitableTrades}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Giao Dịch Lỗ</p>
            <p className="text-lg font-medium text-red-600 dark:text-red-400">{summary.unprofitableTrades}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
