'use client';

import { useTheme } from '../context/ThemeContext';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700">
        <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white dark:bg-blue-500 shadow-md"></span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-gray-200 dark:bg-gray-700 
                 transition-colors duration-300 focus:outline-none focus:ring-2 
                 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span 
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full 
                   bg-white dark:bg-blue-500 transform transition-transform 
                   duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'} 
                   shadow-md flex items-center justify-center text-xs`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </button>
  );
}

