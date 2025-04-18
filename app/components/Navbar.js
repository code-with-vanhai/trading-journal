'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => pathname === path;

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  // Function to get the display name (prefer username over name)
  const getDisplayName = () => {
    if (session?.user?.username) return session.user.username;
    if (session?.user?.name) return session.user.name;
    return session?.user?.email || '';
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-primary">
                TradeJournal
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'border-primary text-gray-900' 
                    : 'border-transparent text-gray-500 hover:border-gray-300'
                }`}
              >
                Trang chủ
              </Link>
              
              {status === 'authenticated' && (
                <>
                  <Link
                    href="/transactions"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/transactions') 
                        ? 'border-primary text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Giao dịch
                  </Link>
                  <Link
                    href="/portfolio"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/portfolio') 
                        ? 'border-primary text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Danh mục
                  </Link>
                  <Link
                    href="/strategies"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/strategies') 
                        ? 'border-primary text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Chiến lược
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {status === 'authenticated' ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {getDisplayName()}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Đăng nhập
                </Link>
                <Link href="/auth/signup" className="btn-primary text-sm">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Mở menu chính</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on state */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/') 
                ? 'border-primary text-primary bg-primary-50' 
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            Trang chủ
          </Link>
          
          {status === 'authenticated' && (
            <>
              <Link
                href="/transactions"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/transactions') 
                    ? 'border-primary text-primary bg-primary-50' 
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                Giao dịch
              </Link>
              <Link
                href="/portfolio"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/portfolio') 
                    ? 'border-primary text-primary bg-primary-50' 
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                Danh mục
              </Link>
              <Link
                href="/strategies"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/strategies') 
                    ? 'border-primary text-primary bg-primary-50' 
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                Chiến lược
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {status === 'authenticated' ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {(session.user.username?.charAt(0) || session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {getDisplayName()}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {session.user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Đăng xuất</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around px-4">
              <Link
                href="/auth/signin"
                className="block text-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/signup"
                className="block text-center px-4 py-2 text-base font-medium bg-primary text-white rounded"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 