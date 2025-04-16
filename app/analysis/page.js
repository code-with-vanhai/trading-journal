'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Dashboard from '../components/Dashboard';
import { useRouter } from 'next/navigation';

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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Portfolio Analysis</h1>
      
      <div className="mb-6">
        <label htmlFor="period" className="block text-sm font-medium text-gray-700">Time Period</label>
        <select
          id="period"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          value={selectedPeriod}
          onChange={handlePeriodChange}
        >
          <option value="all">All Time</option>
          <option value="year">Past Year</option>
          <option value="month">Past Month</option>
          <option value="week">Past Week</option>
        </select>
      </div>
      
      <Dashboard period={selectedPeriod} />
    </div>
  );
} 