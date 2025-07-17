'use client';

export default function ProfitStatistics({ profitStats, isVisible = true }) {
  if (!isVisible || !profitStats) {
    return null;
  }

  const {
    totalProfitLoss,
    profitableTransactions,
    unprofitableTransactions,
    breakEvenTransactions,
    totalTransactions,
    successRate,
    averageProfit,
    totalProfit,
    totalLoss,
    accountFeesTotal = 0,
    grossProfitLoss = 0
  } = profitStats;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const getProfitLossColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProfitLossBgColor = (value) => {
    if (value > 0) return 'bg-green-50 border-green-200';
    if (value < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <i className="fas fa-chart-pie text-blue-600 text-xl mr-3"></i>
        <h3 className="text-lg font-semibold text-gray-800">Thống kê Lợi nhuận</h3>
        {totalTransactions === 0 && (
          <span className="ml-2 text-sm text-gray-500">(Chỉ tính các giao dịch bán)</span>
        )}
      </div>

      {totalTransactions === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-info-circle text-3xl mb-3"></i>
          <p>Chưa có giao dịch bán nào để thống kê</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng P/L */}
          <div className={`p-4 rounded-lg border-2 ${getProfitLossBgColor(totalProfitLoss)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng P/L (Ròng)</p>
                <p className={`text-2xl font-bold ${getProfitLossColor(totalProfitLoss)}`}>
                  {formatCurrency(totalProfitLoss)}
                </p>
                <p className="text-xs text-gray-500">
                  {accountFeesTotal > 0 ? `Đã trừ phí ${formatCurrency(accountFeesTotal)}` : 'Chưa có phí tài khoản'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <i className={`fas ${totalProfitLoss >= 0 ? 'fa-arrow-trend-up text-green-600' : 'fa-arrow-trend-down text-red-600'} text-xl`}></i>
              </div>
            </div>
          </div>

          {/* Tỷ lệ thành công */}
          <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold text-blue-600">{successRate}%</p>
                <p className="text-xs text-gray-500">{profitableTransactions}/{totalTransactions} lãi</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <i className="fas fa-percentage text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Tổng lãi */}
          <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng lãi</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
                <p className="text-xs text-gray-500">{formatNumber(profitableTransactions)} giao dịch</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <i className="fas fa-plus text-green-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* Tổng lỗ */}
          <div className="p-4 rounded-lg border-2 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng lỗ</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(Math.abs(totalLoss))}</p>
                <p className="text-xs text-gray-500">{formatNumber(unprofitableTransactions)} giao dịch</p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <i className="fas fa-minus text-red-600 text-xl"></i>
              </div>
            </div>
          </div>

          {/* P/L trung bình */}
          <div className={`p-4 rounded-lg border-2 ${getProfitLossBgColor(averageProfit)} md:col-span-2`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">P/L trung bình mỗi giao dịch (Ròng)</p>
                <p className={`text-xl font-bold ${getProfitLossColor(averageProfit)}`}>
                  {formatCurrency(averageProfit)}
                </p>
                <p className="text-xs text-gray-500">
                  Dựa trên {formatNumber(totalTransactions)} giao dịch bán, đã trừ phí tài khoản
                </p>
              </div>
              <div className={`p-3 rounded-full ${averageProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <i className={`fas fa-calculator ${averageProfit >= 0 ? 'text-green-600' : 'text-red-600'} text-xl`}></i>
              </div>
            </div>
          </div>

          {/* Breakdown giao dịch */}
          <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 md:col-span-2">
            <p className="text-sm font-medium text-gray-600 mb-3">Phân loại giao dịch</p>
            <div className="flex justify-between items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Lãi: {formatNumber(profitableTransactions)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Lỗ: {formatNumber(unprofitableTransactions)}</span>
              </div>
              {breakEvenTransactions > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Hòa vốn: {formatNumber(breakEvenTransactions)}</span>
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(profitableTransactions / totalTransactions) * 100}%` }}
                ></div>
                <div 
                  className="bg-red-500" 
                  style={{ width: `${(unprofitableTransactions / totalTransactions) * 100}%` }}
                ></div>
                {breakEvenTransactions > 0 && (
                  <div 
                    className="bg-gray-500" 
                    style={{ width: `${(breakEvenTransactions / totalTransactions) * 100}%` }}
                  ></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 