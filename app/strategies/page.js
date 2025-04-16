'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StrategyForm from '../components/StrategyForm';
import StrategyList from '../components/StrategyList';

export default function StrategiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [strategies, setStrategies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

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
      setStrategies(data);
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

  if (status === 'authenticated') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trading Strategies</h1>
          <button
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Share New Strategy'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6">
            <StrategyForm onSubmit={handleStrategySubmit} />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">Loading strategies...</div>
        ) : (
          <StrategyList
            strategies={strategies}
            onStrategyDeleted={fetchStrategies}
            currentUserId={session.user.id}
          />
        )}
      </div>
    );
  }

  return null;
} 