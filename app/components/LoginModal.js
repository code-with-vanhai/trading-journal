'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { IconX, IconAlertCircle } from './ui/Icon';
import GlassCard from './ui/GlassCard';

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    login: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        login: formData.login,
        password: formData.password,
      });

      if (result.error) {
        setError('Invalid email/username or password');
      } else {
        // Reset form
        setFormData({ login: '', password: '' });
        
        // Notify parent of successful login
        if (onSuccess) {
          onSuccess();
        }
        
        // Close modal
        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <GlassCard className="w-full max-w-md overflow-hidden shadow-2xl border-0 ring-1 ring-white/10 relative">
        {/* Background Glow */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-b from-blue-500/10 to-transparent opacity-50 dark:opacity-30"></div>
        </div>

        <div className="relative p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Session Expired</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <IconX className="h-6 w-6" />
            </button>
          </div>
          
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Your session has expired. Please sign in again to continue.
          </p>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-500 text-red-700 dark:text-red-300 p-4 rounded mb-6 text-sm flex items-center">
              <IconAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="modal-login" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email or Username
              </label>
              <input
                id="modal-login"
                name="login"
                type="text"
                className="input-glass w-full px-4 py-3"
                value={formData.login}
                onChange={handleChange}
                required
                placeholder="Enter your email or username"
              />
            </div>
            
            <div>
              <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                id="modal-password"
                name="password"
                type="password"
                className="input-glass w-full px-4 py-3"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button
              type="submit"
              className="glass-button-primary w-full py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  );
}
