'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TransactionForm from '../../components/TransactionForm';

export default function NewTransactionPage() {
  const { status } = useSession();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  if (status === 'authenticated') {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Add New Transaction</h1>
        <TransactionForm onSuccess={() => router.push('/transactions')} />
      </div>
    );
  }

  return null;
} 