import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { SessionExpirationProvider } from './context/SessionExpirationProvider';
import Navbar from './components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Trading Journal & Strategy Sharing',
  description: 'A comprehensive app for tracking trades and sharing strategies',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background min-h-screen`}>
        <AuthProvider>
          <SessionExpirationProvider>
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </SessionExpirationProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 