'use client';

import { SessionProvider } from 'next-auth/react';
import SessionRefresher from '../components/SessionRefresher';

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <SessionRefresher />
      {children}
    </SessionProvider>
  );
} 