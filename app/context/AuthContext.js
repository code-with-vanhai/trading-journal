'use client';

import { SessionProvider } from 'next-auth/react';
import SessionActivityMonitor from '../components/SessionActivityMonitor';

export function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <SessionActivityMonitor />
      {children}
    </SessionProvider>
  );
} 