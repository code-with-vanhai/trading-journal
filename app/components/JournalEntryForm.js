'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JournalEntryForm({ transactionId, existingEntry = null }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [formData, setFormData] = useState({
    emotionOnEntry: existingEntry?.emotionOnEntry || '',
    emotionOnExit: existingEntry?.emotionOnExit || '',
    strategyUsed: existingEntry?.strategyUsed || '',
    postTradeReview: existingEntry?.postTradeReview || '',
    tags: existingEntry?.tags?.map(t => t.tagId) || [],
  });

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/journal/tags');
        if (!response.ok) {
          throw new Error('Không thể tải danh sách thẻ');
        }
        const data = await response.json();
        setTags(data);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagChange = (e) => {
    const tagId = e.target.value;
    // Only add the tag if it's not already in the list
    if (tagId !== '' && !formData.tags.includes(tagId)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagId]
      }));
    }
  };

  const removeTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(id => id !== tagId)
    }));
  };

  const createNewTag = async () => {
    if (!newTag.trim()) return;

    try {
      const response = await fetch('/api/journal/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTag.trim() }),
      });

      if (!response.ok) {
        throw new Error('Không thể tạo thẻ mới');
      }

      const createdTag = await response.json();
      setTags(prev => [...prev, createdTag]);
      
      // Add newly created tag to the form data
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, createdTag.id]
      }));
      
      setNewTag('');
    } catch (err) {
      console.error('Error creating tag:', err);
      setError('Không thể tạo thẻ mới. Vui lòng thử lại.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          ...formData
        }),
      });

      if (!response.ok) {
        throw new Error('Không thể lưu nhật ký giao dịch');
      }

      setSuccess('Nhật ký giao dịch đã được lưu thành công!');
      
      // Redirect back to transaction view after a short delay
      setTimeout(() => {
        router.push(`/transactions/${transactionId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Không thể lưu nhật ký giao dịch. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">
        {existingEntry ? 'Chỉnh Sửa Nhật Ký Giao Dịch' : 'Tạo Nhật Ký Giao Dịch'}
      </h2>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cảm Xúc Khi Mua Vào
          </label>
          <select
            name="emotionOnEntry"
            value={formData.emotionOnEntry}
            onChange={handleInputChange}
            className="input-field w-full"
            required
          >
            <option value="">Chọn cảm xúc...</option>
            <option value="Calm">Bình tĩnh</option>
            <option value="Confident">Tự tin</option>
            <option value="Excited">Phấn khích</option>
            <option value="Fearful">Lo sợ</option>
            <option value="Greedy">Tham lam</option>
            <option value="Hesitant">Lưỡng lự</option>
            <option value="Impatient">Thiếu kiên nhẫn</option>
            <option value="Neutral">Trung lập</option>
            <option value="Optimistic">Lạc quan</option>
            <option value="Pessimistic">Bi quan</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cảm Xúc Khi Bán Ra
          </label>
          <select
            name="emotionOnExit"
            value={formData.emotionOnExit}
            onChange={handleInputChange}
            className="input-field w-full"
            required
          >
            <option value="">Chọn cảm xúc...</option>
            <option value="Calm">Bình tĩnh</option>
            <option value="Disappointed">Thất vọng</option>
            <option value="Ecstatic">Vui sướng</option>
            <option value="Frustrated">Thất vọng</option>
            <option value="Grateful">Biết ơn</option>
            <option value="Proud">Tự hào</option>
            <option value="Relieved">Nhẹ nhõm</option>
            <option value="Satisfied">Hài lòng</option>
            <option value="Surprised">Ngạc nhiên</option>
            <option value="Unsatisfied">Không hài lòng</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Chiến Lược Sử Dụng
          </label>
          <input
            type="text"
            name="strategyUsed"
            value={formData.strategyUsed}
            onChange={handleInputChange}
            className="input-field w-full"
            placeholder="VD: Breakout, Hỗ Trợ/Kháng Cự, Theo Xu Hướng"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đánh Giá Sau Giao Dịch
          </label>
          <textarea
            name="postTradeReview"
            value={formData.postTradeReview}
            onChange={handleInputChange}
            rows={5}
            className="input-field w-full"
            placeholder="Điều gì đã tốt? Điều gì cần cải thiện? Bạn đã học được gì?"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thẻ Gán
          </label>
          
          <div className="flex items-center mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="input-field flex-1 mr-2"
              placeholder="Thêm thẻ mới..."
            />
            <button
              type="button"
              onClick={createNewTag}
              className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Thêm
            </button>
          </div>
          
          <div className="flex items-center">
            <select
              value=""
              onChange={handleTagChange}
              className="input-field flex-1"
            >
              <option value="">Chọn thẻ có sẵn...</option>
              {tags
                .filter(tag => !formData.tags.includes(tag.id))
                .map(tag => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </select>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map(tagId => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <span 
                    key={tagId} 
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center"
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => removeTag(tagId)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      &times;
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Link
            href={`/transactions/${transactionId}`}
            className="btn-secondary"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Đang Lưu...' : 'Lưu Nhật Ký'}
          </button>
        </div>
      </form>
    </div>
  );
} 