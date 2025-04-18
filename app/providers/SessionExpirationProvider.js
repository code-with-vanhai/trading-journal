'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { useSession } from 'next-auth/react';
import LoginModal from '../components/LoginModal';

const SessionExpirationContext = createContext(null);

export function useSessionExpiration() {
  return useContext(SessionExpirationContext);
}

export default function SessionExpirationProvider({ children }) {
  const { data: session, status, update } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Function to check if a response indicates an expired token
  const checkResponseForExpiredToken = async (response) => {
    if (response.status === 401) {
      try {
        const data = await response.json();
        if (data.message?.toLowerCase().includes('expired') || 
            data.error?.toLowerCase().includes('expired')) {
          return true;
        }
      } catch (e) {
        // If we can't parse the JSON, we'll assume it's not an expiration
        return false;
      }
    }
    return false;
  };

  // Intercept fetch to detect token expiration from API responses
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      const response = await originalFetch(url, options);
      
      // Create a clone of the response to check for token expiration
      // (since we can only read the body once)
      const clone = response.clone();
      
      const isExpired = await checkResponseForExpiredToken(clone);
      if (isExpired && !isTokenExpired) {
        setIsTokenExpired(true);
        setIsModalOpen(true);
      }
      
      return response;
    };
    
    return () => {
      window.fetch = originalFetch;
    };
  }, [isTokenExpired]);

  // Handle successful login
  const handleLoginSuccess = async () => {
    setIsTokenExpired(false);
    
    // Update the session
    await update();
    
    // Reload the current page to refresh data with new session
    window.location.reload();
  };

  // Close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <SessionExpirationContext.Provider value={{ isTokenExpired, setIsTokenExpired }}>
      {children}
      <LoginModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleLoginSuccess} 
      />
    </SessionExpirationContext.Provider>
  );
} 