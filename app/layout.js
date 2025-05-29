import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import ConditionalLayout from './components/ConditionalLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Trading Journal - Nhật ký giao dịch chứng khoán thông minh',
  description: 'Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-background min-h-screen`}>
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 