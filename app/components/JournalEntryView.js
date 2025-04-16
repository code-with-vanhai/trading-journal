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
        <p>Đang tải nhật ký giao dịch...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        <p>Lỗi: {error}</p>
      </div>
    );
  }

  if (!journalEntry) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nhật Ký Giao Dịch</h2>
          <Link
            href={`/transactions/${transactionId}/journal/new`}
            className="btn-primary"
          >
            Thêm Nhật Ký
          </Link>
        </div>
        <p className="text-gray-500 mt-4">
          Chưa có nhật ký nào được tạo cho giao dịch này.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Nhật Ký Giao Dịch</h2>
        <Link
          href={`/transactions/${transactionId}/journal/edit`}
          className="btn-secondary"
        >
          Chỉnh Sửa Nhật Ký
        </Link>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Cảm Xúc Khi Mua Vào</h3>
          <p className="mt-1">{journalEntry.emotionOnEntry || "Không ghi nhận"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Cảm Xúc Khi Bán Ra</h3>
          <p className="mt-1">{journalEntry.emotionOnExit || "Không ghi nhận"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Chiến Lược Sử Dụng</h3>
          <p className="mt-1">{journalEntry.strategyUsed || "Không có"}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Đánh Giá Sau Giao Dịch</h3>
          <p className="mt-1 whitespace-pre-line">{journalEntry.postTradeReview}</p>
        </div>

        {journalEntry.tags && journalEntry.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Thẻ Gán</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {journalEntry.tags.map(tagRel => (
                <span
                  key={tagRel.tagId}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
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