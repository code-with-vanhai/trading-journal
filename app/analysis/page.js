'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for Enhanced Dashboard (contains heavy chart libraries)
const EnhancedDashboard = dynamic(() => import('../components/EnhancedDashboard'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded mt-6"></div>
          </div>
        </div>
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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Title and breadcrumb */}
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <span>Trang chủ</span> / <span className="text-blue-600 font-medium">Phân tích danh mục</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <i className="fas fa-chart-line text-blue-600 mr-3"></i>
                Phân Tích Danh Mục Nâng Cao
              </h1>
              <p className="text-gray-600 mt-1">
                Phân tích chi tiết hiệu suất, rủi ro và cơ hội đầu tư của danh mục
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Thời gian:</label>
              <div className="flex bg-gray-100 rounded-lg p-1">
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
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
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