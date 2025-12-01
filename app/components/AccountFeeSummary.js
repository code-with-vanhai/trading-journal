'use client';

const FEE_TYPE_LABELS = {
  CUSTODY_FEE: 'Phí lưu ký',
  ADVANCE_SELLING_FEE: 'Phí ứng trước',
  ACCOUNT_MAINTENANCE: 'Phí duy trì',
  TRANSFER_FEE: 'Phí chuyển nhượng',
  DIVIDEND_TAX: 'Thuế cổ tức',
  INTEREST_FEE: 'Phí lãi vay',
  DATA_FEED_FEE: 'Phí dữ liệu',
  SMS_NOTIFICATION_FEE: 'Phí SMS',
  STATEMENT_FEE: 'Phí sao kê',
  WITHDRAWAL_FEE: 'Phí rút tiền',
  OTHER_FEE: 'Phí khác'
};

export default function AccountFeeSummary({ summaryStats, isLoading }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to safely get count value
  const getCountValue = (countField) => {
    if (typeof countField === 'number') {
      return countField;
    } else if (typeof countField === 'object' && countField !== null) {
      const firstValue = Object.values(countField)[0];
      return typeof firstValue === 'number' ? firstValue : 0;
    }
    return 0;
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Ensure summaryStats is an array
  const statsArray = Array.isArray(summaryStats) ? summaryStats : [];
  
  if (!summaryStats || statsArray.length === 0) {
    return (
      <div className="mb-6">
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100/50 dark:bg-gray-700/50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chưa có dữ liệu thống kê</h3>
            <p className="text-gray-500 dark:text-gray-400">Thêm phí tài khoản để xem thống kê tổng quan.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total amount and count
  const totalAmount = statsArray.reduce((sum, stat) => sum + (stat._sum?.amount || 0), 0);
  const totalCount = statsArray.reduce((sum, stat) => sum + getCountValue(stat._count), 0);
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  // Sort by amount for display
  const sortedStats = [...statsArray].sort((a, b) => (b._sum?.amount || 0) - (a._sum?.amount || 0));

  return (
    <div className="mb-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Amount */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng phí</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        {/* Total Count */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Số lượng phí</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCount}</p>
            </div>
          </div>
        </div>

        {/* Average Amount */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phí trung bình</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{formatCurrency(averageAmount)}</p>
            </div>
          </div>
        </div>

        {/* Most Expensive Fee Type */}
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phí cao nhất</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {sortedStats[0] ? FEE_TYPE_LABELS[sortedStats[0].feeType] || sortedStats[0].feeType : 'N/A'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sortedStats[0] ? formatCurrency(sortedStats[0]._sum?.amount || 0) : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fee Type Breakdown */}
      {sortedStats.length > 0 && (
        <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Phân tích theo loại phí</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedStats.map((stat, index) => {
              const percentage = totalAmount > 0 ? ((stat._sum?.amount || 0) / totalAmount) * 100 : 0;
              return (
                <div key={stat.feeType} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {FEE_TYPE_LABELS[stat.feeType] || stat.feeType}
                    </h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tổng tiền:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(stat._sum?.amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Số lượng:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{getCountValue(stat._count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Tỷ lệ:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 