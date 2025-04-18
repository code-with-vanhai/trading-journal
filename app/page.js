'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Spinner } from './components/ui/Spinner';

export default function HomePage() {
  const { data: session, status } = useSession();
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStrategies = async () => {
      if (status === 'authenticated') {
        try {
          setLoading(true);
          const response = await fetch('/api/strategies');
          
          if (!response.ok) {
            throw new Error('Không thể lấy dữ liệu chiến lược');
          }
          
          const data = await response.json();
          setStrategies(data.slice(0, 3)); // Only take the first 3 strategies
        } catch (err) {
          console.error('Error fetching strategies:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    if (status === 'authenticated') {
      fetchStrategies();
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center">
      <section className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Nhật Ký Giao Dịch & Chia Sẻ Chiến Lược</h1>
        <p className="text-xl mb-8">
          Ghi lại giao dịch, phân tích hiệu suất và chia sẻ chiến lược với các nhà giao dịch khác
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/signin" className="btn-primary">
            Bắt Đầu Ngay
          </Link>
          <Link href="/about" className="btn-secondary">
            Tìm Hiểu Thêm
          </Link>
        </div>
      </section>

      <section className="w-full max-w-4xl mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Theo Dõi Giao Dịch</h2>
          <p>Ghi lại tất cả các giao dịch chứng khoán với chi tiết về giá cả, số lượng, phí và thuế.</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Phân Tích Hiệu Suất</h2>
          <p>Xem hiệu suất danh mục đầu tư của bạn với các chỉ số chi tiết và trực quan hóa.</p>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-3">Chia Sẻ Chiến Lược</h2>
          <p>Xuất bản và khám phá các chiến lược giao dịch trong cộng đồng.</p>
        </div>
      </section>

      <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Chiến Lược Công Khai Gần Đây</h2>
        
        {status !== 'authenticated' ? (
          <div className="card">
            <p className="text-center text-gray-500">
              Đăng nhập để xem và chia sẻ các chiến lược giao dịch
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/auth/signin" className="btn-primary">
                Đăng nhập
              </Link>
            </div>
          </div>
        ) : loading ? (
          <div className="card flex justify-center items-center py-8">
            <Spinner size="medium" />
          </div>
        ) : error ? (
          <div className="card">
            <p className="text-center text-red-500">
              Đã xảy ra lỗi: {error}
            </p>
          </div>
        ) : strategies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strategies.map(strategy => (
              <div key={strategy.id} className="card">
                <h3 className="font-semibold mb-2">{strategy.title || 'Chiến lược không tiêu đề'}</h3>
                <p className="text-gray-600 text-sm mb-2">
                  Bởi: {strategy.user.name || strategy.user.email}
                </p>
                <p className="text-sm mb-3 line-clamp-3">
                  {strategy.content}
                </p>
                <Link 
                  href={`/strategies/${strategy.id}`} 
                  className="text-blue-600 hover:underline text-sm inline-block"
                >
                  Đọc thêm
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="text-center text-gray-500">
              Chưa có chiến lược nào được chia sẻ. Hãy là người đầu tiên!
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/strategies" className="btn-primary">
                Tạo Chiến Lược
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
} 