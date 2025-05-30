'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  if (isHomePage) {
    // Landing page layout - no navbar, no container
    return children;
  }

  // Regular page layout - with navbar and container
  return (
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
    </>
  );
} 