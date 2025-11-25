import React from 'react';

export function Spinner({ size = 'medium', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`flex items-center justify-center ${className}`} role="status" aria-busy="true">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 dark:border-blue-400 ${spinnerSize}`}></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
} 