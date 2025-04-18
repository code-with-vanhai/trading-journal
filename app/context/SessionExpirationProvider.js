'use client';

import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { logger } from '../lib/logger';

// Session expiration context
export const SessionExpirationContext = createContext();

// Hook for consuming the context
export const useSessionExpiration = () => useContext(SessionExpirationContext);

export const SessionExpirationProvider = ({ children }) => {
  const { data: session } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Configuration
  const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  const WARNING_BEFORE = 2 * 60 * 1000; // Show warning 2 minutes before expiration
  const CHECK_INTERVAL = 10 * 1000; // Check every 10 seconds

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (session) {
      setIsActive(true);
      setShowWarning(false);
      localStorage.setItem('lastActivity', Date.now().toString());
      logger.info('Session timer reset due to user activity');
    }
  }, [session]);

  // Handle session extension
  const extendSession = useCallback(() => {
    resetTimer();
    setShowWarning(false);
    logger.info('Session extended by user action');
  }, [resetTimer]);

  // Handle logout
  const handleLogout = useCallback(() => {
    setShowWarning(false);
    setIsActive(false);
    logger.info('User initiated logout due to session expiration');
    signOut({ callbackUrl: '/login' });
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!session) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleUserActivity = () => {
      resetTimer();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [session, resetTimer]);

  // Check session status regularly
  useEffect(() => {
    if (!session || !isActive) return;

    const checkSessionStatus = () => {
      const lastActivity = parseInt(localStorage.getItem('lastActivity') || '0');
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastActivity;
      const timeLeft = SESSION_DURATION - elapsedTime;

      if (elapsedTime >= SESSION_DURATION) {
        // Session expired
        logger.warning('Session expired, logging out user');
        handleLogout();
      } else if (timeLeft <= WARNING_BEFORE && !showWarning) {
        // Show warning
        setShowWarning(true);
        setTimeRemaining(Math.ceil(timeLeft / 1000));
        logger.info('Session expiration warning shown');
      } else if (showWarning) {
        // Update time remaining
        setTimeRemaining(Math.ceil(timeLeft / 1000));
      }
    };

    // Initial check
    checkSessionStatus();

    // Set up interval
    const intervalId = setInterval(checkSessionStatus, CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [session, isActive, showWarning, handleLogout, resetTimer]);

  return (
    <SessionExpirationContext.Provider
      value={{
        showWarning,
        timeRemaining,
        extendSession,
        handleLogout
      }}
    >
      {children}
      {showWarning && (
        <SessionExpirationWarning
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}
    </SessionExpirationContext.Provider>
  );
};

// Session expiration warning dialog
const SessionExpirationWarning = ({ timeRemaining, onExtend, onLogout }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-red-600">Session Expiring Soon</h2>
        <p className="mb-4">
          Your session will expire in {Math.floor(timeRemaining / 60)}:
          {(timeRemaining % 60).toString().padStart(2, '0')} minutes due to inactivity.
        </p>
        <p className="mb-6">Would you like to extend your session or log out?</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
          >
            Log Out
          </button>
          <button
            onClick={onExtend}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}; 