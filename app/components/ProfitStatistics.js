'use client';

import { IconPieChart, IconInfo, IconTrendingUp, IconTrendingDown, IconPercent, IconPlus, IconMinus, IconCalculator } from './ui/Icon';

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
    <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6 mb-6">
      <div className="flex items-center mb-4">
        <IconPieChart className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Thống kê Lợi nhuận</h3>
        {totalTransactions === 0 && (
          <span className="ml-2 text-sm text-gray-500">(Chỉ tính các giao dịch bán)</span>
        )}
      </div>

      {totalTransactions === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <IconInfo className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
          <p>Chưa có giao dịch bán nào để thống kê</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tổng P/L */}
          <div className={`p-4 rounded-lg border-2 ${getProfitLossBgColor(totalProfitLoss)} dark:border-gray-700 dark:bg-gray-800/50`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng P/L (Ròng)</p>
                <p className={`text-2xl font-bold ${getProfitLossColor(totalProfitLoss)} dark:${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(totalProfitLoss)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {accountFeesTotal > 0 ? `Đã trừ phí ${formatCurrency(accountFeesTotal)}` : 'Chưa có phí tài khoản'}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalProfitLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {totalProfitLoss >= 0 ? (
                  <IconTrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <IconTrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Tỷ lệ thành công */}
          <div className="p-4 rounded-lg border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{successRate}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profitableTransactions}/{totalTransactions} lãi</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <IconPercent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Tổng lãi */}
          <div className="p-4 rounded-lg border-2 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng lãi</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalProfit)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(profitableTransactions)} giao dịch</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <IconPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          {/* Tổng lỗ */}
          <div className="p-4 rounded-lg border-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng lỗ</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(Math.abs(totalLoss))}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(unprofitableTransactions)} giao dịch</p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <IconMinus className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          {/* P/L trung bình */}
          <div className={`p-4 rounded-lg border-2 ${getProfitLossBgColor(averageProfit)} dark:border-gray-700 dark:bg-gray-800/50 md:col-span-2`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">P/L trung bình mỗi giao dịch (Ròng)</p>
                <p className={`text-xl font-bold ${getProfitLossColor(averageProfit)} dark:${averageProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(averageProfit)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Dựa trên {formatNumber(totalTransactions)} giao dịch bán, đã trừ phí tài khoản
                </p>
              </div>
              <div className={`p-3 rounded-full ${averageProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <IconCalculator className={`w-6 h-6 ${averageProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
              </div>
            </div>
          </div>

          {/* Breakdown giao dịch */}
          <div className="p-4 rounded-lg border-2 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 md:col-span-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Phân loại giao dịch</p>
            <div className="flex justify-between items-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Lãi: {formatNumber(profitableTransactions)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Lỗ: {formatNumber(unprofitableTransactions)}</span>
              </div>
              {breakEvenTransactions > 0 && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 dark:bg-gray-400 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Hòa vốn: {formatNumber(breakEvenTransactions)}</span>
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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