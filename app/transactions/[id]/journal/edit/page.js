'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import JournalEntryForm from '../../../../components/JournalEntryForm';

export default function EditJournalEntryPage({ params }) {
  // Unwrap params with React.use
  const unwrappedParams = use(params);
  const transactionId = unwrappedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [journalEntry, setJournalEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch journal entry data
  useEffect(() => {
    const fetchJournalEntry = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/journal?transactionId=${transactionId}`);
        
        if (response.status === 404) {
          setError('Không tìm thấy nhật ký giao dịch');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Không thể tải nhật ký giao dịch');
        }
        
        const data = await response.json();
        setJournalEntry(data);
      } catch (err) {
        console.error('Error fetching journal entry:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchJournalEntry();
    }
  }, [status, transactionId]);

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
            href={`/transactions/${transactionId}`}
            className="text-blue-600 hover:underline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Quay lại Giao dịch
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
          href={`/transactions/${transactionId}`}
          className="text-blue-600 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Quay lại Giao dịch
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Chỉnh Sửa Nhật Ký Giao Dịch</h1>
      
      <JournalEntryForm 
        transactionId={transactionId} 
        existingEntry={journalEntry} 
      />
    </div>
  );
} 