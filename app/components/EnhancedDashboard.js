'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { useSession } from 'next-auth/react';
import {
  IconLineChart,
  IconShield,
  IconScale,
  IconFactory,
  IconAreaChart,
  IconAlertCircle,
  IconGauge,
  IconPieChart,
  IconWaves,
  IconArrowDown,
  IconInfo,
  IconChevronUp,
  IconChevronDown,
} from './ui/Icon';

const EnhancedDashboard = ({ period = 'all' }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState({
    summary: null,
    riskMetrics: null,
    benchmark: null,
    sectors: null,
    performance: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs configuration
  const tabs = [
    { id: 'overview', name: 'Tổng Quan', icon: IconLineChart },
    { id: 'risk', name: 'Phân Tích Rủi Ro', icon: IconShield },
    { id: 'benchmark', name: 'So Sánh Thị Trường', icon: IconScale },
    { id: 'sectors', name: 'Phân Tích Ngành', icon: IconFactory },
    { id: 'performance', name: 'Hiệu Suất', icon: IconAreaChart }
  ];

  useEffect(() => {
    if (session?.user?.id) {
      fetchAllData();
    }
  }, [period, session?.user?.id]);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use consolidated Dashboard API - single request instead of 5 separate requests
      const response = await fetch(`/api/dashboard?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();

      // Extract all data from consolidated response
      setData({ 
        summary: dashboardData.summary, 
        riskMetrics: dashboardData.riskMetrics, 
        benchmark: dashboardData.benchmark, 
        sectors: dashboardData.sectorAnalysis, 
        performance: dashboardData.performance || [] 
      });
    } catch (error) {
      console.error('Error fetching enhanced analysis data:', error);
      setError('Không thể tải dữ liệu phân tích. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '0 ₫';
    return value.toLocaleString('vi-VN') + ' ₫';
  };
  
  const formatPercent = (value) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <IconAlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500 dark:text-red-400" />
        <p className="text-lg font-semibold">{error}</p>
        <button 
          onClick={fetchAllData}
          className="mt-4 px-6 py-2 bg-red-600 dark:bg-red-700 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const TabIcon = tabs.find(t => t.id === activeTab)?.icon || IconLineChart;

  return (
    <div className="space-y-6">
      {/* Enhanced Header với Quick Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{formatCurrency(data.summary?.totalProfitLoss)}</div>
            <div className="text-blue-100 dark:text-blue-200">Tổng P&L</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{data.riskMetrics?.sharpeRatio?.toFixed(2) || '0.00'}</div>
            <div className="text-blue-100 dark:text-blue-200">Sharpe Ratio</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{formatPercent(data.riskMetrics?.maxDrawdown)}</div>
            <div className="text-blue-100 dark:text-blue-200">Max Drawdown</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{data.benchmark?.beta?.toFixed(2) || '1.00'}</div>
            <div className="text-blue-100 dark:text-blue-200">Beta vs VN-Index</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
        {activeTab === 'risk' && <RiskAnalysisTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
        {activeTab === 'benchmark' && <BenchmarkTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
        {activeTab === 'sectors' && <SectorsTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
        {activeTab === 'performance' && <PerformanceTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />}
      </div>
    </div>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => (
  <div className="space-y-6">
    {/* Header skeleton */}
    <div className="bg-gradient-to-r from-gray-200 dark:from-gray-700 to-gray-300 dark:to-gray-600 rounded-xl h-32 animate-pulse"></div>
    
    {/* Tabs skeleton */}
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
      <div className="flex space-x-4 p-4">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
    
    {/* Content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1,2,3,4].map(i => (
        <div key={i} className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// Overview Tab Component
const OverviewTab = ({ data, formatCurrency, formatPercent }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Portfolio Performance Chart */}
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 col-span-2">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <IconAreaChart className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
        Hiệu Suất Danh Mục Theo Thời Gian
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data.performance}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => [
                name === 'Giá Trị Danh Mục' ? formatCurrency(value) : value,
                name
              ]}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="cumulativePnL"
              fill="#8884d8"
              fillOpacity={0.3}
              stroke="#8884d8"
              name="Giá Trị Danh Mục"
            />
            <Bar
              yAxisId="right"
              dataKey="trades"
              fill="#82ca9d"
              name="Số Giao Dịch"
              opacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Risk Gauge */}
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <IconGauge className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
        Đánh Giá Rủi Ro
      </h3>
      <RiskGauge riskScore={data.riskMetrics?.riskScore || 50} />
    </div>

    {/* Key Metrics Summary */}
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <IconPieChart className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
        Chỉ Số Quan Trọng
      </h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">ROI:</span>
          <span className={`font-bold ${data.summary?.roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercent(data.summary?.roi)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Tỷ lệ thắng:</span>
          <span className="font-bold text-blue-600 dark:text-blue-400">
            {formatPercent(data.summary?.winRate)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Tổng giao dịch:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            {data.summary?.totalTrades || 0}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">Volatility:</span>
          <span className="font-bold text-orange-600 dark:text-orange-400">
            {formatPercent(data.riskMetrics?.volatility)}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Risk Analysis Tab Component
const RiskAnalysisTab = ({ data, formatCurrency, formatPercent }) => (
  <div className="space-y-6">
    {/* Enhanced Risk Metrics Cards with Detailed Explanations */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <EnhancedRiskMetricCard
          title="Volatility (Độ Biến Động)"
          value={formatPercent(data.riskMetrics?.volatility)}
          description="Đo lường mức độ biến động của danh mục theo thời gian"
          icon={IconWaves}
          color="blue"
          explanation={{
            meaning: "Volatility cho biết danh mục của bạn biến động bao nhiều so với giá trị trung bình. Volatility cao = rủi ro cao nhưng cũng có thể có lợi nhuận cao.",
            calculation: "Tính từ độ lệch chuẩn của lợi nhuận hàng ngày, sau đó nhân với √252 để có volatility hàng năm.",
            dataSource: "Dữ liệu từ bảng Transaction: calculatedPl (lãi/lỗ) của các giao dịch SELL theo ngày",
            interpretation: {
              low: "< 15%: Rủi ro thấp, phù hợp với nhà đầu tư thận trọng",
              medium: "15-30%: Rủi ro trung bình, cân bằng giữa an toàn và lợi nhuận", 
              high: "> 30%: Rủi ro cao, phù hợp với nhà đầu tư mạo hiểm"
            }
          }}
        />
        
        <EnhancedRiskMetricCard
          title="Sharpe Ratio"
          value={data.riskMetrics?.sharpeRatio?.toFixed(2) || '0.00'}
          description="Hiệu quả đầu tư: lợi nhuận trên mỗi đơn vị rủi ro"
          icon={IconScale}
          color="green"
          explanation={{
            meaning: "Sharpe Ratio đo lường hiệu quả đầu tư - bạn nhận được bao nhiều lợi nhuận cho mỗi đơn vị rủi ro chấp nhận.",
            calculation: "Công thức: (Lợi nhuận hàng năm - Lãi suất phi rủi ro) / Volatility. Lãi suất phi rủi ro = 2%/năm",
            dataSource: "Dữ liệu từ bảng Transaction: tính lợi nhuận trung bình và volatility từ calculatedPl",
            interpretation: {
              excellent: "> 1.0: Xuất sắc - lợi nhuận cao với rủi ro hợp lý",
              good: "0.5-1.0: Tốt - hiệu quả đầu tư ổn định",
              poor: "< 0.5: Kém - rủi ro cao so với lợi nhuận"
            }
          }}
        />
        
        <EnhancedRiskMetricCard
          title="Max Drawdown"
          value={formatPercent(data.riskMetrics?.maxDrawdown)}
          description="Tổn thất lớn nhất từ đỉnh cao nhất"
          icon={IconArrowDown}
          color="red"
          explanation={{
            meaning: "Max Drawdown là tổn thất lớn nhất mà danh mục của bạn từng trải qua, tính từ đỉnh cao nhất đến điểm thấp nhất.",
            calculation: "Tính từ giá trị danh mục tích lũy: Max Drawdown = (Đỉnh - Đáy) / Đỉnh × 100%",
            dataSource: "Dữ liệu từ bảng Transaction: tích lũy calculatedPl theo thời gian để tìm đỉnh và đáy",
            interpretation: {
              low: "< 10%: Rủi ro thấp, danh mục ổn định",
              medium: "10-20%: Rủi ro trung bình, có thể chấp nhận được",
              high: "> 20%: Rủi ro cao, cần xem xét lại chiến lược"
            }
          }}
        />
      </div>

      {/* Enhanced Risk Score Visualization */}
      <div className="space-y-4">
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
            <IconGauge className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" />
            Điểm Rủi Ro Tổng Hợp
          </h3>
          <RiskGauge riskScore={data.riskMetrics?.riskScore || 50} />
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium mb-2">Cách tính điểm rủi ro (0-100):</p>
            <div className="space-y-1">
              <p>• <strong>Volatility:</strong> 0-40 điểm (cao = nhiều điểm)</p>
              <p>• <strong>Sharpe Ratio:</strong> 0-30 điểm (thấp = nhiều điểm)</p>
              <p>• <strong>Max Drawdown:</strong> 0-30 điểm (cao = nhiều điểm)</p>
            </div>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
              <p className="font-medium mb-1">Phân loại rủi ro:</p>
              <p><span className="text-green-600 dark:text-green-400 font-medium">0-30:</span> Rủi ro thấp - Phù hợp nhà đầu tư thận trọng</p>
              <p><span className="text-yellow-600 dark:text-yellow-400 font-medium">31-60:</span> Rủi ro trung bình - Cân bằng lợi nhuận/rủi ro</p>
              <p><span className="text-red-600 dark:text-red-400 font-medium">61-100:</span> Rủi ro cao - Chỉ dành cho nhà đầu tư mạo hiểm</p>
            </div>
          </div>
        </div>

        {/* Risk Breakdown Chart */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Phân Tích Chi Tiết Rủi Ro</h3>
          <RiskBreakdownChart data={data.riskMetrics} />
        </div>
      </div>
    </div>

    {/* Data Source Information */}
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
        <IconInfo className="w-5 h-5 mr-2" />
        Nguồn Dữ Liệu Tính Toán
      </h4>
      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
        <p><strong>Bảng Transaction:</strong> Tất cả các chỉ số rủi ro được tính từ dữ liệu giao dịch hiện có</p>
        <p><strong>Trường calculatedPl:</strong> Lãi/lỗ đã tính sẵn của các giao dịch SELL (đã bao gồm phí)</p>
        <p><strong>Trường transactionDate:</strong> Ngày giao dịch để nhóm theo thời gian</p>
        <p><strong>Không cần thêm bảng mới:</strong> Sử dụng 100% dữ liệu có sẵn trong hệ thống</p>
      </div>
    </div>
  </div>
);

// Risk Gauge Component
const RiskGauge = ({ riskScore }) => {
  const getColor = (score) => {
    if (score <= 30) return '#10b981'; // Green - Low risk
    if (score <= 60) return '#f59e0b'; // Yellow - Medium risk
    return '#ef4444'; // Red - High risk
  };

  const getRiskLevel = (score) => {
    if (score <= 30) return 'Thấp';
    if (score <= 60) return 'Trung Bình';
    return 'Cao';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={getColor(riskScore)}
            strokeWidth="3"
            strokeDasharray={`${riskScore}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{riskScore}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="font-semibold" style={{ color: getColor(riskScore) }}>
          Rủi Ro {getRiskLevel(riskScore)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Điểm rủi ro tổng hợp</div>
      </div>
    </div>
  );
};

// Enhanced Risk Metric Card Component with Detailed Explanations
const EnhancedRiskMetricCard = ({ title, value, description, icon: IconComponent, color, explanation }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400'
  };

  const getInterpretationColor = (value, interpretation) => {
    if (!value || !interpretation) return 'text-gray-600';
    
    const numValue = parseFloat(value.replace('%', ''));
    
    if (title.includes('Volatility')) {
      if (numValue < 15) return 'text-green-600';
      if (numValue < 30) return 'text-yellow-600';
      return 'text-red-600';
    } else if (title.includes('Sharpe')) {
      if (numValue > 1.0) return 'text-green-600';
      if (numValue > 0.5) return 'text-yellow-600';
      return 'text-red-600';
    } else if (title.includes('Drawdown')) {
      if (numValue < 10) return 'text-green-600';
      if (numValue < 20) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]} transition-all duration-300 ${showDetails ? 'shadow-lg' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
              <h4 className="font-semibold">{title}</h4>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs bg-white dark:bg-gray-800 bg-opacity-50 dark:bg-opacity-50 hover:bg-opacity-75 dark:hover:bg-opacity-75 px-2 py-1 rounded transition-colors"
              title="Xem chi tiết"
            >
              {showDetails ? <IconChevronUp className="w-4 h-4" /> : <IconInfo className="w-4 h-4" />}
            </button>
          </div>
          
          <div className={`text-2xl font-bold mb-1 ${getInterpretationColor(value, explanation?.interpretation)}`}>
            {value}
          </div>
          <p className="text-sm opacity-75">{description}</p>
          
          {showDetails && explanation && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 bg-opacity-70 dark:bg-opacity-70 rounded-lg text-xs space-y-3">
              <div>
                <h5 className="font-semibold mb-1">💡 Ý nghĩa:</h5>
                <p>{explanation.meaning}</p>
              </div>
              
              <div>
                <h5 className="font-semibold mb-1">🧮 Cách tính:</h5>
                <p>{explanation.calculation}</p>
              </div>
              
              <div>
                <h5 className="font-semibold mb-1">📊 Nguồn dữ liệu:</h5>
                <p>{explanation.dataSource}</p>
              </div>
              
              <div>
                <h5 className="font-semibold mb-1">📈 Cách đọc kết quả:</h5>
                <div className="space-y-1">
                  {Object.entries(explanation.interpretation).map(([level, desc]) => (
                    <p key={level} className="text-xs">
                      <span className="font-medium">• {desc}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Risk Breakdown Chart Component
const RiskBreakdownChart = ({ data }) => {
  if (!data) return <div className="text-gray-500 dark:text-gray-400 text-center py-8">Không có dữ liệu</div>;

  const riskComponents = [
    {
      name: 'Volatility',
      value: Math.min((data.volatility || 0), 40),
      maxValue: 40,
      color: '#3b82f6',
      description: 'Độ biến động'
    },
    {
      name: 'Sharpe (Inverted)',
      value: Math.max(0, 30 - ((data.sharpeRatio || 0) * 10)),
      maxValue: 30,
      color: '#10b981',
      description: 'Hiệu quả (đảo ngược)'
    },
    {
      name: 'Max Drawdown',
      value: Math.min((data.maxDrawdown || 0), 30),
      maxValue: 30,
      color: '#ef4444',
      description: 'Tổn thất tối đa'
    }
  ];

  return (
    <div className="space-y-4">
      {riskComponents.map((component, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-gray-800 dark:text-gray-200">{component.description}</span>
            <span className="text-gray-600 dark:text-gray-400">{component.value.toFixed(1)}/{component.maxValue}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(component.value / component.maxValue) * 100}%`,
                backgroundColor: component.color
              }}
            ></div>
          </div>
        </div>
      ))}
      
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-xs">
        <p className="font-medium mb-1 text-gray-800 dark:text-gray-200">Tổng điểm rủi ro: {data.riskScore || 0}/100</p>
        <p className="text-gray-600 dark:text-gray-400">
          Điểm càng cao = rủi ro càng lớn. Điểm được tính bằng tổng của 3 thành phần trên.
        </p>
      </div>
    </div>
  );
};

// Original Risk Metric Card Component (kept for backward compatibility)
const RiskMetricCard = ({ title, value, description, icon: IconComponent, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400'
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {IconComponent && <IconComponent className="w-5 h-5 mr-2" />}
            <h4 className="font-semibold">{title}</h4>
          </div>
          <div className="text-2xl font-bold mb-1">{value}</div>
          <p className="text-sm opacity-75">{description}</p>
        </div>
      </div>
    </div>
  );
};

// Benchmark Tab Component
const BenchmarkTab = ({ data, formatCurrency, formatPercent }) => (
  <div className="space-y-6">
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
      <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
        <IconLineChart className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
        So Sánh với VN-Index
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.benchmark?.beta?.toFixed(2) || '1.00'}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Beta</div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Độ nhạy cảm với thị trường</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPercent(data.benchmark?.alpha)}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Alpha</div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Lợi nhuận vượt thị trường</div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{data.benchmark?.correlation?.toFixed(2) || '0.00'}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Correlation</div>
          <div className="text-xs text-gray-500 dark:text-gray-500">Mức độ tương quan</div>
        </div>
      </div>
    </div>
  </div>
);

// Sectors Tab Component
const SectorsTab = ({ data, formatCurrency, formatPercent }) => {
  const SECTOR_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sector Performance List */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Hiệu Suất Theo Ngành</h3>
          <div className="space-y-3">
            {data.sectors?.sectorPerformance?.slice(0, 8).map((sector, index) => (
              <div key={sector.sector} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-3"
                    style={{ backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length] }}
                  ></div>
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-200">{sector.sector}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{sector.tickerCount} cổ phiếu</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${sector.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(sector.pnl)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{formatPercent(sector.roi)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Allocation Pie Chart */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Phân Bổ Theo Ngành</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sectors?.sectorPerformance?.filter(s => s.invested > 0).slice(0, 6)}
                  dataKey="invested"
                  nameKey="sector"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({sector, percent}) => `${sector} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.sectors?.sectorPerformance?.filter(s => s.invested > 0).slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value), 'Đã Đầu Tư']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab = ({ data, formatCurrency, formatPercent }) => (
  <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10">
    <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-800 dark:text-gray-200">
      <IconAreaChart className="w-5 h-5 text-purple-500 dark:text-purple-400 mr-2" />
      Hiệu Suất Chi Tiết
    </h3>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.performance}>
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
            dataKey="cumulativePnL" 
            stroke="#0088FE" 
            name="Giá Trị Danh Mục"
            activeDot={{ r: 8 }} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default EnhancedDashboard;