'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IconX, IconAlertCircle } from './ui/Icon';
import GlassCard from './ui/GlassCard';

export default function SigninModal({ isOpen, onClose }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        login: login,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email/Username hoặc mật khẩu không đúng');
      } else {
        // Đăng nhập thành công, đóng modal và refresh trang
        onClose();
        router.refresh();
      }
    } catch (error) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md overflow-hidden shadow-2xl border-0 ring-1 ring-white/10 relative">
        {/* Background Glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-blue-500/10 to-transparent opacity-50 dark:opacity-30"></div>
        </div>

        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <IconX className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Đăng nhập</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">Truy cập vào tài khoản Trading Journal</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-6 text-sm flex items-center">
              <IconAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email/Username
              </label>
              <input
                type="text"
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                className="input-glass w-full px-4 py-3"
                placeholder="email@example.com hoặc username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-glass w-full px-4 py-3"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="glass-button-primary w-full py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => {
                  onClose();
                  router.push('/auth/signup');
                }}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>

          {/* Social login options */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
            <button
              onClick={() => signIn('google', { redirect: false })}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-white/10 rounded-xl text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Đăng nhập với Google
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
