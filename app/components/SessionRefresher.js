'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Component that automatically refreshes the user's session on activity
 * to prevent timeout during active use of the application.
 */
export default function SessionRefresher() {
  const { data: session, status, update } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    // Events to monitor for user activity
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart'
    ];
    
    // Debounced session refresh - only refresh at most once every 4 minutes
    let refreshTimeout = null;
    const SESSION_REFRESH_DEBOUNCE = 4 * 60 * 1000; // 4 minutes in ms
    
    // Timer to check session expiration
    let expiryTimeout = null;
    const SESSION_WARNING_THRESHOLD = 10 * 60 * 1000; // Show warning 10 minutes before expiry
    
    const refreshSession = () => {
      if (refreshTimeout) return;
      
      refreshTimeout = setTimeout(() => {
        update(); // Force session refresh
        setShowWarning(false); // Hide warning after refresh
        refreshTimeout = null;
      }, SESSION_REFRESH_DEBOUNCE);
    };
    
    // Check session expiry
    const checkSessionExpiry = () => {
      if (!session?.expires) return;
      
      const expiryTime = new Date(session.expires).getTime();
      const currentTime = new Date().getTime();
      const timeRemaining = expiryTime - currentTime;
      
      // Show warning if less than 10 minutes remain
      if (timeRemaining < SESSION_WARNING_THRESHOLD && timeRemaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };
    
    // Setup timers
    expiryTimeout = setInterval(checkSessionExpiry, 60 * 1000); // Check every minute
    checkSessionExpiry(); // Check immediately on mount
    
    // Add all event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, refreshSession, { passive: true });
    });
    
    // Cleanup event listeners and timers
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, refreshSession);
      });
      
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      if (expiryTimeout) {
        clearInterval(expiryTimeout);
      }
    };
  }, [status, update, session]);
  
  // Return warning toast if session is about to expire
  if (!showWarning) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 rounded shadow-lg z-50">
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <p className="font-medium">Phiên đăng nhập sắp hết hạn!</p>
          <p className="text-sm">Hoạt động trên trang để duy trì phiên đăng nhập.</p>
        </div>
      </div>
    </div>
  );
} 