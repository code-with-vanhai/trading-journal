'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';
import { use } from 'react';
import JournalEntryView from '../../components/JournalEntryView';

export default function TransactionDetail({ params }) {
  // Unwrap params with React.use
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Format currency to VND with thousands separators
  const formatCurrency = (value) => {
    return value.toLocaleString('vi-VN') + ' ₫';
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch transaction details
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransaction();
    }
  }, [status, id]);

  const fetchTransaction = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions/${id}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải thông tin giao dịch');
      }
      
      const data = await response.json();
      setTransaction(data);
    } catch (err) {
      console.error('Error fetching transaction:', err);
      setError('Lỗi khi tải thông tin giao dịch: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác.')) {
      setIsDeleting(true);
      
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Không thể xóa giao dịch');
        }
        
        // Signal that transactions have been updated
        localStorage.setItem('portfolioDataUpdated', Date.now().toString());
        
        router.push('/transactions');
      } catch (err) {
        console.error('Delete error:', err);
        setError('Không thể xóa giao dịch: ' + err.message);
        setIsDeleting(false);
      }
    }
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
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <Link href="/transactions" className="text-blue-600 hover:underline">
            ← Quay lại Danh sách Giao dịch
          </Link>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
          <p>Không tìm thấy giao dịch</p>
        </div>
        <div className="mt-4">
          <Link href="/transactions" className="text-blue-600 hover:underline">
            ← Quay lại Danh sách Giao dịch
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Chi Tiết Giao Dịch</h1>
        <div className="flex gap-2">
          <Link 
            href="/transactions" 
            className="btn-secondary"
          >
            Quay lại Giao dịch
          </Link>
          <Link 
            href={`/transactions/${id}/edit`} 
            className="btn-secondary"
          >
            Chỉnh sửa
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="btn-danger"
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Mã Cổ Phiếu</h3>
            <p className="mt-1 text-lg font-semibold">{transaction.ticker}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Loại</h3>
            <p className="mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                transaction.type === 'BUY' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {transaction.type === 'BUY' ? 'Mua' : 'Bán'}
              </span>
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Ngày</h3>
            <p className="mt-1">
              {format(new Date(transaction.transactionDate), 'dd MMMM, yyyy', { locale: vi })}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Số Lượng</h3>
            <p className="mt-1">{transaction.quantity}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Giá</h3>
            <p className="mt-1">{formatCurrency(transaction.price)}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Tổng Giá Trị</h3>
            <p className="mt-1">
              {formatCurrency(transaction.price * transaction.quantity)}
            </p>
          </div>
          
          {transaction.fee > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phí</h3>
              <p className="mt-1">{formatCurrency(transaction.fee)}</p>
            </div>
          )}
          
          {transaction.calculatedPl !== null && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Lãi/Lỗ
              </h3>
              <p className={`mt-1 ${
                transaction.calculatedPl >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {transaction.calculatedPl >= 0 ? '+' : ''}
                {formatCurrency(Math.abs(transaction.calculatedPl))}
              </p>
            </div>
          )}
          
          {transaction.notes && (
            <div className="col-span-2">
              <h3 className="text-sm font-medium text-gray-500">Ghi Chú</h3>
              <p className="mt-1 whitespace-pre-line">{transaction.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Journal entry section */}
      <JournalEntryView transactionId={id} />
    </div>
  );
} 