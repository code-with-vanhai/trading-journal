'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function JournalEntryView({ transactionId }) {
  const [journalEntry, setJournalEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJournalEntry = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/journal?transactionId=${transactionId}`);
        
        if (response.status === 404) {
          // No journal entry found - this is not an error
          setJournalEntry(null);
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

    if (transactionId) {
      fetchJournalEntry();
    }
  }, [transactionId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-6">
        <p className="text-gray-600 dark:text-gray-400">Đang tải nhật ký giao dịch...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-md border border-red-200 dark:border-red-800">
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  if (!journalEntry) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nhật Ký Giao Dịch</h2>
          <Link
            href={`/transactions/${transactionId}/journal/new`}
            className="btn-primary dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Thêm Nhật Ký
          </Link>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-4">
          Chưa có nhật ký nào được tạo cho giao dịch này.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Nhật Ký Giao Dịch</h2>
        <Link
          href={`/transactions/${transactionId}/journal/edit`}
          className="btn-secondary dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          Chỉnh Sửa Nhật Ký
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cảm Xúc Khi Mua Vào</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-200">{journalEntry.emotionOnEntry || "Không ghi nhận"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Cảm Xúc Khi Bán Ra</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-200">{journalEntry.emotionOnExit || "Không ghi nhận"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Chiến Lược Sử Dụng</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-200">{journalEntry.strategyUsed || "Không có"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Đánh Giá Sau Giao Dịch</h3>
          <p className="mt-1 text-gray-900 dark:text-gray-200 whitespace-pre-line">{journalEntry.postTradeReview}</p>
        </div>

        {journalEntry.tags && journalEntry.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Thẻ Gán</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {journalEntry.tags.map(tagRel => (
                <span
                  key={tagRel.tagId}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm"
                >
                  {tagRel.tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 