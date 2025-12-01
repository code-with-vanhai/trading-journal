'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { IconLineChart, IconUserCircle, IconLogOut, IconMenu, IconX } from './ui/Icon';
import SigninModal from './SigninModal';

// Dynamic import ThemeToggle to avoid SSR issues
const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => (
    <div className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700">
      <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-blue-500 shadow-md"></span>
    </div>
  )
});

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);

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
      <div id="mobile-menu-overlay" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 hidden md:hidden"></div>

      {/* Header (Fixed) - Glassmorphism Style */}
      <header className="fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-xl bg-white/70 dark:bg-black/40 border-b border-gray-200 dark:border-white/10 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <IconLineChart className="w-8 h-8 mr-2 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold">
                <Link href="/" className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-300 transition">
                  Trading Journal
                </Link>
              </h1>
            </div>
            {/* Desktop Nav */}
            <nav className="hidden md:block">
              <ul className="flex space-x-8 font-medium text-gray-700 dark:text-gray-300">
                <li><Link href="/" className="hover:text-blue-600 dark:hover:text-white transition">Trang chủ</Link></li>
                <li><a href="/#pricing" className="hover:text-blue-600 dark:hover:text-white transition">Bảng giá</a></li>
                {status === 'authenticated' && (
                  <>
                    <li><Link href="/account-fees" className="hover:text-blue-600 dark:hover:text-white transition">Phí giao dịch</Link></li>
                    <li><Link href="/transactions" className="hover:text-blue-600 dark:hover:text-white transition">Giao dịch</Link></li>
                    <li><Link href="/portfolio" className="hover:text-blue-600 dark:hover:text-white transition">Danh mục</Link></li>
                    <li><Link href="/analysis" className="hover:text-blue-600 dark:hover:text-white transition">Phân tích</Link></li>
                    <li><Link href="/cost-basis-adjustments" className="hover:text-blue-600 dark:hover:text-white transition">Sự kiện quyền</Link></li>
                    <li><Link href="/strategies" className="hover:text-blue-600 dark:hover:text-white transition">Chiến lược</Link></li>
                  </>
                )}
              </ul>
            </nav>
            {/* Auth Links */}
            <div className="hidden md:flex items-center space-x-4 font-medium">
              <ThemeToggle />
              {status === 'authenticated' ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 dark:text-blue-100 flex items-center">
                    <IconUserCircle className="w-4 h-4 mr-2" />
                    {getDisplayName()}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-600 dark:text-blue-200 hover:text-blue-600 dark:hover:text-white transition-colors flex items-center"
                  >
                    <IconLogOut className="w-4 h-4 mr-1" />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setIsSigninModalOpen(true)}
                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-white transition"
                  >
                    Đăng nhập
                  </button>
                  <Link href="/auth/signup" className="glass-button-primary text-white px-5 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all">Đăng ký</Link>
                </>
              )}
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button id="mobile-menu-button" className="text-gray-900 dark:text-white focus:outline-none">
                <IconMenu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Slide out) - Glassmorphism Style */}
        <div id="mobile-menu" className="mobile-menu fixed top-0 right-0 w-64 h-screen backdrop-blur-2xl bg-white/80 dark:bg-gray-900/90 border-l border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-2xl py-6 px-4 md:hidden z-50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <ThemeToggle />
            </div>
            <button id="close-mobile-menu-button" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none">
              <IconX className="w-6 h-6" />
            </button>
          </div>
          <nav>
            <ul className="flex flex-col space-y-4 text-lg font-medium">
              <li><Link href="/" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Trang chủ</Link></li>
              <li><a href="/#pricing" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Bảng giá</a></li>
              {status === 'authenticated' && (
                <>
                  <li className="pt-4 border-t border-gray-200 dark:border-gray-700"><Link href="/account-fees" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Phí giao dịch</Link></li>
                  <li><Link href="/transactions" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Giao dịch</Link></li>
                  <li><Link href="/portfolio" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Danh mục</Link></li>
                  <li><Link href="/analysis" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Phân tích</Link></li>
                  <li><Link href="/cost-basis-adjustments" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Sự kiện quyền</Link></li>
                  <li><Link href="/strategies" className="block hover:text-blue-600 dark:hover:text-blue-300 transition">Chiến lược</Link></li>
                </>
              )}
              {status === 'authenticated' ? (
                <>
                  <li className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="block text-gray-600 dark:text-blue-100 mb-2 flex items-center">
                      <IconUserCircle className="w-4 h-4 mr-2" />
                      {getDisplayName()}
                    </span>
                  </li>
                  <li>
                    <button
                      onClick={handleSignOut}
                      className="block hover:text-blue-600 dark:hover:text-blue-300 transition w-full text-left flex items-center"
                    >
                      <IconLogOut className="w-4 h-4 mr-2" />
                      Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={() => {
                        toggleMobileMenu();
                        setIsSigninModalOpen(true);
                      }}
                      className="block hover:text-blue-600 dark:hover:text-blue-300 transition w-full text-left"
                    >
                      Đăng nhập
                    </button>
                  </li>
                  <li><Link href="/auth/signup" className="block bg-blue-600 text-white px-4 py-2 rounded-lg text-center font-medium hover:bg-blue-700 transition shadow-md">Đăng ký</Link></li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Signin Modal */}
      <SigninModal isOpen={isSigninModalOpen} onClose={() => setIsSigninModalOpen(false)} />

      {/* Spacer to account for fixed header */}
      <div className="h-16"></div>
    </>
  );
}
