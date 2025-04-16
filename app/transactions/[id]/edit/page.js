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
      <div className="flex justify-center items-center h-64">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/transactions"
            className="text-blue-600 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Quay lại Danh sách Giao dịch
          </Link>
        </div>
        
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p>Lỗi: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/transactions/${id}`}
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Quay lại Chi tiết Giao dịch
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Chỉnh Sửa Giao Dịch</h1>
      
      {transaction && (
        <TransactionForm 
          transaction={transaction} 
          onSuccess={handleSuccess} 
        />
      )}
    </div>
  );
} 