import { Be_Vietnam_Pro, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ConditionalLayout from './components/ConditionalLayout';
import { NotificationProvider } from './components/Notification';

const beVietnamPro = Be_Vietnam_Pro({ 
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata = {
  title: 'Trading Journal - Nhật ký giao dịch chứng khoán thông minh',
  description: 'Nền tảng nhật ký giao dịch chứng khoán thông minh hàng đầu Việt Nam',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${beVietnamPro.variable} ${spaceGrotesk.variable} font-body bg-background dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 