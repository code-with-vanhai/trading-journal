'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Notification = ({ message, type = 'success', isVisible, onClose, duration = 3000 }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 300); // Animation duration
  };

  if (!isVisible && !isAnimatingOut) {
    return null;
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: 'fas fa-check-circle',
          iconColor: 'text-white'
        };
      case 'error':
        return {
          bg: 'bg-red-500',
          icon: 'fas fa-exclamation-circle',
          iconColor: 'text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: 'fas fa-exclamation-triangle',
          iconColor: 'text-white'
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: 'fas fa-info-circle',
          iconColor: 'text-white'
        };
      default:
        return {
          bg: 'bg-gray-500',
          icon: 'fas fa-bell',
          iconColor: 'text-white'
        };
    }
  };

  const styles = getTypeStyles();
  
  const notificationElement = (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div
        className={`
          ${styles.bg} text-white px-4 py-3 rounded-lg shadow-lg max-w-sm min-w-80
          transform transition-all duration-300 ease-out pointer-events-auto mb-2
          ${isVisible && !isAnimatingOut 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className={`${styles.icon} ${styles.iconColor} text-lg`}></i>
            <div className="font-medium text-sm leading-relaxed">
              {message}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors ml-4 flex-shrink-0"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(notificationElement, document.body);
  }

  return null;
};

// NotificationProvider component để quản lý notifications
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, duration) => addNotification(message, 'success', duration);
  const showError = (message, duration) => addNotification(message, 'error', duration);
  const showWarning = (message, duration) => addNotification(message, 'warning', duration);
  const showInfo = (message, duration) => addNotification(message, 'info', duration);

  return (
    <NotificationContext.Provider value={{ 
      addNotification, 
      removeNotification, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo 
    }}>
      {children}
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          isVisible={true}
          onClose={() => removeNotification(notification.id)}
          duration={0} // Duration handled by provider
        />
      ))}
    </NotificationContext.Provider>
  );
};

// Context for notifications
import { createContext, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default Notification; 