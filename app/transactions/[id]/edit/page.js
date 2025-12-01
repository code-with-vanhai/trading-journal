'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import TransactionForm from '../../../components/TransactionForm';

export default function EditTransactionPage({ params }) {
  // Unwrap params with React.use
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch transaction data
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/transactions/${id}`);
        
        if (response.status === 404) {
          setError('Không tìm thấy giao dịch');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Không thể tải thông tin giao dịch');
        }
        
        const data = await response.json();
        setTransaction(data);
      } catch (err) {
        console.error('Error fetching transaction:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTransaction();
    }
  }, [status, id]);

  const handleSuccess = () => {
    router.push(`/transactions/${id}`);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link
              href="/transactions"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Quay lại Danh sách Giao dịch
            </Link>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800">
            <p>Lỗi: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link
            href={`/transactions/${id}`}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Quay lại Chi tiết Giao dịch
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Chỉnh Sửa Giao Dịch</h1>
        
        {transaction && (
          <TransactionForm 
            transaction={transaction} 
            onSuccess={handleSuccess} 
          />
        )}
      </div>
    </div>
  );
} 