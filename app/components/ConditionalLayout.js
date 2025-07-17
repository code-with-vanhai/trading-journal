'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  // All pages now use the same navbar
  return (
    <>
      <Navbar />
      {isHomePage ? (
        // Landing page layout - no container
        children
      ) : (
        // Regular page layout - with container
        <main className="container mx-auto px-4 py-4">
          {children}
        </main>
      )}
    </>
  );
} 