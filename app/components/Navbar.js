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
    <nav className="gradient-bg text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-white flex items-center">
                <i className="fas fa-chart-line text-blue-300 mr-2"></i>
                Trading Journal
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'border-white text-white' 
                    : 'border-transparent text-blue-200 hover:text-white hover:border-blue-200'
                }`}
              >
                Trang chủ
              </Link>
              
              {status === 'authenticated' && (
                <>
                  <Link
                    href="/transactions"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/transactions') 
                        ? 'border-white text-white' 
                        : 'border-transparent text-blue-200 hover:text-white hover:border-blue-200'
                    }`}
                  >
                    Giao dịch
                  </Link>
                  <Link
                    href="/portfolio"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/portfolio') 
                        ? 'border-white text-white' 
                        : 'border-transparent text-blue-200 hover:text-white hover:border-blue-200'
                    }`}
                  >
                    Danh mục
                  </Link>
                  <Link
                    href="/strategies"
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive('/strategies') 
                        ? 'border-white text-white' 
                        : 'border-transparent text-blue-200 hover:text-white hover:border-blue-200'
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
                <span className="text-sm text-blue-100 flex items-center">
                  <i className="fas fa-user-circle mr-2"></i>
                  {getDisplayName()}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-blue-200 hover:text-white transition-colors"
                >
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/auth/signin"
                  className="text-sm text-blue-200 hover:text-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link href="/auth/signup" className="bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition shadow-md">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white focus:outline-none"
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
        <div className="pt-2 pb-3 space-y-1 bg-blue-800">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
              isActive('/') 
                ? 'border-white text-white bg-blue-700' 
                : 'border-transparent text-blue-200 hover:bg-blue-700 hover:text-white'
            }`}
          >
            Trang chủ
          </Link>
          
          {status === 'authenticated' && (
            <>
              <Link
                href="/transactions"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive('/transactions') 
                    ? 'border-white text-white bg-blue-700' 
                    : 'border-transparent text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Giao dịch
              </Link>
              <Link
                href="/portfolio"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive('/portfolio') 
                    ? 'border-white text-white bg-blue-700' 
                    : 'border-transparent text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Danh mục
              </Link>
              <Link
                href="/strategies"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors ${
                  isActive('/strategies') 
                    ? 'border-white text-white bg-blue-700' 
                    : 'border-transparent text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Chiến lược
              </Link>
            </>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-blue-700 bg-blue-800">
          {status === 'authenticated' ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium">
                    {(session.user.username?.charAt(0) || session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {getDisplayName()}
                </div>
                <div className="text-sm font-medium text-blue-200">
                  {session.user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-auto bg-blue-700 flex-shrink-0 p-2 rounded-full text-blue-200 hover:text-white focus:outline-none transition-colors"
              >
                <span className="sr-only">Đăng xuất</span>
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around px-4">
              <Link
                href="/auth/signin"
                className="block text-center px-4 py-2 text-base font-medium text-blue-200 hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/signup"
                className="block text-center px-4 py-2 text-base font-medium bg-white text-blue-900 rounded-lg hover:bg-blue-100 transition shadow-md"
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