'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get('success');
  const logoutReason = searchParams.get('reason');

  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(successMessage || '');
  const [isLoading, setIsLoading] = useState(false);

  // Get logout reason message
  const getLogoutReasonMessage = () => {
    switch (logoutReason) {
      case 'inactivity':
        return 'Your session expired due to 15 minutes of inactivity. Please sign in again.';
      case 'max_age':
        return 'Your session expired after 60 minutes for security reasons. Please sign in again.';
      default:
        return null;
    }
  };

  const logoutMessage = getLogoutReasonMessage();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        login: formData.login,
        password: formData.password,
      });

      if (result.error) {
        setError('Invalid email/username or password');
      } else {
        router.push('/'); // Redirect to home page after successful login
        router.refresh();
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-md">
          <p className="text-center text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Đăng nhập</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">Truy cập vào tài khoản Trading Journal của bạn</p>
        
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {logoutMessage && (
          <div className="bg-amber-50 text-amber-700 p-3 rounded mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {logoutMessage}
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login" className="form-label">
              Email hoặc Username
            </label>
            <input
              id="login"
              name="login"
              type="text"
              className="input-field"
              value={formData.login}
              onChange={handleChange}
              required
              placeholder="email@example.com hoặc username"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Nhập mật khẩu của bạn"
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center"
            disabled={isLoading}
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
        
        <div className="text-center mt-6">
          <p className="text-gray-600 dark:text-gray-400">
            Chưa có tài khoản?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <p className="text-center text-gray-600 dark:text-gray-400">Đang tải trang đăng nhập...</p>
      </div>
    </div>}>
      <SignInContent />
    </Suspense>
  );
} 