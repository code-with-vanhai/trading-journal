'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CardSkeleton, ChartSkeleton } from '../components/ui/Skeleton';
import { IconLineChart } from '../components/ui/Icon';

// Dynamic import for Enhanced Dashboard (contains heavy chart libraries)
const EnhancedDashboard = dynamic(() => import('../components/EnhancedDashboard'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header skeleton */}
        <CardSkeleton lines={2} />
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton height={300} />
          <ChartSkeleton height={300} />
        </div>
        <ChartSkeleton height={400} />
      </div>
    </div>
  ),
  ssr: false
});

export default function AnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }
  
  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <CardSkeleton lines={2} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton height={300} />
            <ChartSkeleton height={300} />
          </div>
        </div>
      </div>
    );
  }
  
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Enhanced Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Title and breadcrumb */}
            <div>
              <nav className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                <span>Trang chủ</span> / <span className="text-blue-600 dark:text-blue-400 font-medium">Phân tích danh mục</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <IconLineChart className="text-blue-600 dark:text-blue-400 w-8 h-8 mr-3" />
                Phân Tích Danh Mục Nâng Cao
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Phân tích chi tiết hiệu suất, rủi ro và cơ hội đầu tư của danh mục
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Thời gian:</label>
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {[
                  { value: 'week', label: '1T' },
                  { value: 'month', label: '1Th' },
                  { value: 'year', label: '1N' },
                  { value: 'all', label: 'Tất cả' }
                ].map(period => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <EnhancedDashboard period={selectedPeriod} />
      </div>
    </div>
  );
} 