'use client';

import { useSessionExpiration } from '../context/SessionExpirationProvider';
import { useSession } from 'next-auth/react';

export default function SessionExpirationSettings() {
  const { data: session } = useSession();
  const { extendSession } = useSessionExpiration();
  
  if (!session) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Session Management</h2>
      
      <div className="mb-4">
        <p className="text-gray-700">
          Your session will automatically expire after 30 minutes of inactivity.
          You will receive a warning 2 minutes before expiration.
        </p>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={extendSession}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Reset Session Timer
        </button>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          For security reasons, your session will automatically end if no activity
          is detected. Regular activity (clicking, typing, scrolling) will reset the timer.
        </p>
      </div>
    </div>
  );
} 