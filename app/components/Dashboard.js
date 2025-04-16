'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { useSession } from 'next-auth/react';

const Dashboard = ({ period = 'all' }) => {
  const { data: session } = useSession();
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [tickerBreakdown, setTickerBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!session) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch summary data
        const summaryRes = await fetch(`/api/analysis?type=summary&period=${period}`);
        if (!summaryRes.ok) throw new Error('Failed to fetch summary data');
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
        
        // Fetch performance data for chart
        const performanceRes = await fetch(`/api/analysis?type=performance&period=${period}`);
        if (!performanceRes.ok) throw new Error('Failed to fetch performance data');
        const performanceData = await performanceRes.json();
        setPerformance(performanceData.performance);
        
        // Fetch ticker breakdown
        const breakdownRes = await fetch(`/api/analysis?type=ticker-breakdown&period=${period}`);
        if (!breakdownRes.ok) throw new Error('Failed to fetch ticker breakdown');
        const breakdownData = await breakdownRes.json();
        setTickerBreakdown(breakdownData.breakdown);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [session, period]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>Không có dữ liệu. Hãy bắt đầu thêm giao dịch để xem phân tích danh mục của bạn.</p>
      </div>
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
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Tổng Lãi/Lỗ</h3>
          <p className={`text-2xl font-bold ${summary.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.totalProfitLoss)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">ROI</h3>
          <p className={`text-2xl font-bold ${summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(summary.roi)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Tỉ Lệ Thắng</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatPercent(summary.winRate)}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Tổng Giao Dịch</h3>
          <p className="text-2xl font-bold text-gray-800">
            {summary.totalTrades}
          </p>
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Hiệu Suất Theo Thời Gian</h3>
        {performance.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Giá Trị Danh Mục']}
                  labelFormatter={(label) => `Ngày: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0088FE" 
                  name="Giá Trị Danh Mục"
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500">Không có dữ liệu hiệu suất</p>
        )}
      </div>
      
      {/* Ticker Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Hiệu Suất Cao Nhất</h3>
          {tickerBreakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tickerBreakdown.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Lãi/Lỗ']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="profitLoss" 
                    name="Lãi/Lỗ" 
                    fill="#82ca9d"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500">Không có dữ liệu cổ phiếu</p>
          )}
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Phân Bổ Danh Mục</h3>
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
                  >
                    {tickerBreakdown.filter(t => t.totalInvested > 0).slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Đã Đầu Tư']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-gray-500">Không có dữ liệu phân bổ</p>
          )}
        </div>
      </div>
      
      {/* Detailed Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Thống Kê Chi Tiết</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Tổng Đầu Tư</p>
            <p className="text-lg font-medium">{formatCurrency(summary.totalInvested)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tổng Thu Về</p>
            <p className="text-lg font-medium">{formatCurrency(summary.totalReturned)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giao Dịch Mua</p>
            <p className="text-lg font-medium">{summary.totalBuys}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giao Dịch Bán</p>
            <p className="text-lg font-medium">{summary.totalSells}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giao Dịch Có Lãi</p>
            <p className="text-lg font-medium text-green-600">{summary.profitableTrades}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Giao Dịch Lỗ</p>
            <p className="text-lg font-medium text-red-600">{summary.unprofitableTrades}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 