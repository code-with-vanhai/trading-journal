'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import StrategyForm from '../components/StrategyForm';
import StrategyList from '../components/StrategyList';
import SigninModal from '../components/SigninModal';
import { IconAlertCircle, IconChessKing, IconEdit, IconLineChart, IconPlus, IconX } from '../components/ui/Icon';

// Wrapper component that uses searchParams
function StrategiesContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Signin modal state
  const [signinModalOpen, setSigninModalOpen] = useState(false);

  // Check for query parameter and authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      setSigninModalOpen(true);
    } else if (status === 'authenticated') {
      // Check if 'create=true' is in the query parameters
      const shouldShowForm = searchParams.get('create') === 'true';
      if (shouldShowForm) {
        setShowForm(true);
        // Remove the query parameter from URL to avoid form showing on refresh
        const url = new URL(window.location.href);
        url.searchParams.delete('create');
        window.history.replaceState({}, '', url);
      }
    }
  }, [status, router, searchParams]);

  // Fetch strategies
  useEffect(() => {
    if (status === 'authenticated') {
      fetchStrategies();
    }
  }, [status]);

  const fetchStrategies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/strategies');
      if (!response.ok) {
        throw new Error('Failed to fetch strategies');
      }
      const data = await response.json();
      // Handle both new and old data structure
      setStrategies(data.strategies || data);
    } catch (err) {
      setError('Error loading strategies: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategySubmit = async (strategyData) => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });

      if (!response.ok) {
        throw new Error('Failed to create strategy');
      }

      // Close form and refresh strategies list
      setShowForm(false);
      fetchStrategies();
    } catch (err) {
      setError('Error creating strategy: ' + err.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header Section */}
      <div className="gradient-bg dark:from-gray-800 dark:to-gray-700 text-gray-900 dark:text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Chiến Lược Giao Dịch</h1>
              <p className="text-xl opacity-90 dark:opacity-80 text-gray-600 dark:text-gray-300">Chia sẻ và học hỏi các chiến lược giao dịch từ cộng đồng</p>
            </div>
            {status === 'authenticated' && (
              <button
                className="glass-button text-blue-900 dark:text-blue-100 px-6 py-3 font-bold transition shadow-lg flex items-center"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <IconX className="w-5 h-5 mr-2" /> : <IconPlus className="w-5 h-5 mr-2" />}
                {showForm ? 'Hủy' : 'Chia Sẻ Chiến Lược'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 mt-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-600 text-red-700 dark:text-red-400 p-4 rounded mb-6">
            <div className="flex items-center">
              <IconAlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {status === 'unauthenticated' ? (
          <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-12 text-center">
            <div className="flex flex-col items-center">
              <IconChessKing className="text-gray-400 dark:text-gray-500 w-16 h-16 mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">Đăng nhập để xem chiến lược</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Vui lòng đăng nhập để truy cập và chia sẻ chiến lược giao dịch</p>
            </div>
          </div>
        ) : (
          <>
            {showForm && (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-6 mb-6">
                <div className="flex items-center mb-6">
                  <IconEdit className="text-blue-600 dark:text-blue-400 w-6 h-6 mr-3" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Tạo Chiến Lược Mới</h2>
                </div>
                <StrategyForm onSubmit={handleStrategySubmit} />
              </div>
            )}

            {isLoading ? (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 p-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Đang tải chiến lược...</p>
                </div>
              </div>
            ) : (
              <div className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/50 rounded-2xl shadow-xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center">
                    <IconLineChart className="text-blue-600 dark:text-blue-400 w-6 h-6 mr-3" />
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Danh sách chiến lược ({strategies.length})</h3>
                  </div>
                </div>
                <div className="p-6">
                  <StrategyList
                    strategies={strategies}
                    onStrategyDeleted={fetchStrategies}
                    currentUserId={session?.user?.id}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Signin Modal */}
      <SigninModal
        isOpen={signinModalOpen}
        onClose={() => setSigninModalOpen(false)}
      />
    </div>
  );
}

// Loading fallback component
function StrategiesLoading() {
  return (
    <div className="flex justify-center items-center h-64">
      <p>Loading strategies...</p>
    </div>
  );
}

// Main page component with Suspense boundary
export default function StrategiesPage() {
  return (
    <Suspense fallback={<StrategiesLoading />}>
      <StrategiesContent />
    </Suspense>
  );
}
