'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Mobile menu functionality - matching landing page exactly
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMobileMenuButton = document.getElementById('close-mobile-menu-button');
    const overlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuLinks = document.querySelectorAll('#mobile-menu a');

    function toggleMobileMenu() {
      mobileMenu?.classList.toggle('is-active');
      overlay?.classList.toggle('hidden');
      document.body.classList.toggle('overflow-hidden');
    }

    mobileMenuButton?.addEventListener('click', toggleMobileMenu);
    closeMobileMenuButton?.addEventListener('click', toggleMobileMenu);
    overlay?.addEventListener('click', toggleMobileMenu);

    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu?.classList.contains('is-active')) {
          toggleMobileMenu();
        }
      });
    });

    // Cleanup event listeners
    return () => {
      mobileMenuButton?.removeEventListener('click', toggleMobileMenu);
      closeMobileMenuButton?.removeEventListener('click', toggleMobileMenu);
      overlay?.removeEventListener('click', toggleMobileMenu);
    };
  }, []);

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
    <>
      <style jsx>{`
        .mobile-menu {
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out;
        }

        .mobile-menu.is-active {
          transform: translateX(0);
        }

        .overlay {
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 30;
        }
      `}</style>

      {/* Mobile Menu Overlay */}
      <div id="mobile-menu-overlay" className="fixed inset-0 bg-black bg-opacity-50 z-30 hidden md:hidden"></div>

      {/* Header (Fixed) - Exactly matching landing page */}
      <header className="gradient-bg text-white shadow-lg fixed top-0 w-full z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <i className="fas fa-chart-line text-3xl mr-2 text-blue-300"></i>
              <h1 className="text-2xl font-bold">
                <Link href="/" className="hover:text-blue-200 transition">
                  Trading Journal
                </Link>
              </h1>
            </div>
            {/* Desktop Nav - Exactly matching landing page */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8 font-medium">
                <li><Link href="/" className="hover:text-blue-200 transition">Trang chủ</Link></li>
                <li><a href="/#features" className="hover:text-blue-200 transition">Tính năng</a></li>
                <li><a href="/#pricing" className="hover:text-blue-200 transition">Bảng giá</a></li>
                {status === 'authenticated' && (
                  <>
                    <li><Link href="/account-fees" className="hover:text-blue-200 transition">Phí giao dịch</Link></li>
                    <li><Link href="/transactions" className="hover:text-blue-200 transition">Giao dịch</Link></li>
                    <li><Link href="/portfolio" className="hover:text-blue-200 transition">Danh mục</Link></li>
                    <li><Link href="/strategies" className="hover:text-blue-200 transition">Chiến lược</Link></li>
                  </>
                )}
              </ul>
            </nav>
            {/* Auth Links - Exactly matching landing page */}
            <div className="hidden md:flex items-center space-x-4 font-medium">
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
                <>
                  <Link href="/auth/signin" className="hover:text-blue-200 transition">Đăng nhập</Link>
                  <Link href="/auth/signup" className="bg-white text-blue-900 px-5 py-2 rounded-lg font-medium hover:bg-blue-100 transition shadow-md">Đăng ký</Link>
                </>
              )}
            </div>
            {/* Mobile Menu Button - Exactly matching landing page */}
            <div className="md:hidden">
              <button id="mobile-menu-button" className="text-white focus:outline-none">
                <i className="fas fa-bars text-xl"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Slide out) - Exactly matching landing page */}
        <div id="mobile-menu" className="mobile-menu fixed top-0 right-0 w-64 h-screen bg-blue-900 text-white shadow-lg py-6 px-4 md:hidden">
          <div className="flex justify-end mb-6">
            <button id="close-mobile-menu-button" className="text-white focus:outline-none">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <nav>
            <ul className="flex flex-col space-y-4 text-lg font-medium">
              <li><Link href="/" className="block hover:text-blue-200 transition">Trang chủ</Link></li>
              <li><a href="/#features" className="block hover:text-blue-200 transition">Tính năng</a></li>
              <li><a href="/#pricing" className="block hover:text-blue-200 transition">Bảng giá</a></li>
              {status === 'authenticated' && (
                <>
                  <li className="pt-4 border-t border-blue-800"><Link href="/account-fees" className="block hover:text-blue-200 transition">Phí giao dịch</Link></li>
                  <li><Link href="/transactions" className="block hover:text-blue-200 transition">Giao dịch</Link></li>
                  <li><Link href="/portfolio" className="block hover:text-blue-200 transition">Danh mục</Link></li>
                  <li><Link href="/strategies" className="block hover:text-blue-200 transition">Chiến lược</Link></li>
                </>
              )}
              {status === 'authenticated' ? (
                <>
                  <li className="pt-4 border-t border-blue-800">
                    <span className="block text-blue-100 mb-2">
                      <i className="fas fa-user-circle mr-2"></i>
                      {getDisplayName()}
                    </span>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="block hover:text-blue-200 transition w-full text-left"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="pt-4 border-t border-blue-800"><Link href="/auth/signin" className="block hover:text-blue-200 transition">Đăng nhập</Link></li>
                  <li><Link href="/auth/signup" className="block bg-white text-blue-900 px-4 py-2 rounded-lg text-center font-medium hover:bg-blue-100 transition shadow-md">Đăng ký</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Spacer to account for fixed header */}
      <div className="h-16"></div>
    </>
  );
} 