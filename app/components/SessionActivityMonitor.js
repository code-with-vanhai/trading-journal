'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SessionActivityMonitor() {
  const { data: session, status, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const lastActivityRef = useRef(Date.now());
  const warningTimeoutRef = useRef(null);
  const expireTimeoutRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const sessionUpdateTimeoutRef = useRef(null);

  // Configuration
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
  const WARNING_BEFORE_EXPIRE = 2 * 60 * 1000; // Show warning 2 minutes before expiration
  const MAX_SESSION_AGE = 60 * 60 * 1000; // 60 minutes maximum session age
  const SESSION_UPDATE_THROTTLE = 5 * 60 * 1000; // Only update session every 5 minutes

  // Track user activity (without updating session every time)
  const updateActivity = useCallback(() => {
    if (status !== 'authenticated') return;
    
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    
    // Clear existing timeouts
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current);
    
    // Set warning timeout (13 minutes after activity)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setTimeRemaining(120); // 2 minutes remaining
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE_EXPIRE);
    
    // Set expiration timeout (15 minutes after activity)
    expireTimeoutRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      signOut({ callbackUrl: '/auth/signin?reason=inactivity' });
    }, INACTIVITY_TIMEOUT);
    
    // Only update session occasionally, not on every activity
    if (!sessionUpdateTimeoutRef.current) {
      sessionUpdateTimeoutRef.current = setTimeout(() => {
        update(); // Refresh the JWT token
        sessionUpdateTimeoutRef.current = null;
      }, SESSION_UPDATE_THROTTLE);
    }
  }, [status, update]);

  // Set up activity listeners
  useEffect(() => {
    if (status !== 'authenticated') return;

    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click'
    ];

    // Initial activity update
    updateActivity();

    // Add event listeners with throttling
    let activityThrottleTimeout = null;
    const throttledUpdateActivity = () => {
      if (activityThrottleTimeout) return;
      activityThrottleTimeout = setTimeout(() => {
        updateActivity();
        activityThrottleTimeout = null;
      }, 1000); // Throttle to once per second
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, throttledUpdateActivity, { passive: true });
    });

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledUpdateActivity);
      });
      
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (expireTimeoutRef.current) clearTimeout(expireTimeoutRef.current);
      if (sessionUpdateTimeoutRef.current) clearTimeout(sessionUpdateTimeoutRef.current);
      if (activityThrottleTimeout) clearTimeout(activityThrottleTimeout);
    };
  }, [status, updateActivity]);

  // Set up countdown timer for warning (separate effect to avoid re-adding listeners)
  useEffect(() => {
    if (!showWarning) return;

    checkIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(checkIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [showWarning]);

  // Check for maximum session age
  useEffect(() => {
    if (!session?.expires) return;

    const sessionStart = new Date(session.expires).getTime() - MAX_SESSION_AGE;
    const now = Date.now();
    const sessionAge = now - sessionStart;

    if (sessionAge >= MAX_SESSION_AGE) {
      console.log('Session expired due to maximum age limit');
      signOut({ callbackUrl: '/auth/signin?reason=max_age' });
    }
  }, [session]);

  // Extend session when user clicks "Stay Active"
  const extendSession = () => {
    updateActivity();
    setShowWarning(false);
    // Force session update immediately
    update();
  };

  // Manual logout
  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  // Don't render anything if not authenticated
  if (status !== 'authenticated') return null;

  // Render warning dialog
  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-amber-500 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Phiên sắp hết hạn</h2>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Phiên của bạn sẽ hết hạn trong{' '}
          <span className="font-bold text-red-600 dark:text-red-400">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </span>
          {' '}do không hoạt động.
        </p>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Nhấp "Tiếp tục" để duy trì phiên, hoặc bạn sẽ tự động đăng xuất.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded transition-colors"
          >
            Đăng xuất
          </button>
          <button
            onClick={extendSession}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded transition-colors"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
} 