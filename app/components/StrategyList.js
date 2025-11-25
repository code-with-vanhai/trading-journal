'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from './Notification';
import { IconTrash, IconRefresh } from './ui/Icon';

export default function StrategyList({ strategies, onStrategyDeleted, currentUserId }) {
  const { showError } = useNotification();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this strategy? This action cannot be undone.')) {
      setDeletingId(id);
      
      try {
        const response = await fetch(`/api/strategies/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete strategy');
        }
        
        // Notify parent to refresh the list
        onStrategyDeleted();
      } catch (err) {
        console.error('Delete error:', err);
        showError('Failed to delete strategy');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (strategies.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No strategies have been shared yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {strategies.map((strategy) => (
        <div key={strategy.id} className="card">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">
              {strategy.title || 'Untitled Strategy'}
            </h3>
            
            {strategy.userId === currentUserId && (
              <button
                onClick={() => handleDelete(strategy.id)}
                disabled={deletingId === strategy.id}
                className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                title={deletingId === strategy.id ? "Đang xóa chiến lược..." : "Xóa chiến lược"}
              >
                {deletingId === strategy.id ? (
                  <IconRefresh className="w-4 h-4 animate-spin" />
                ) : (
                  <IconTrash className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          
          <p className="text-gray-700 whitespace-pre-wrap mb-3">
            {strategy.content}
          </p>
          
          <div className="text-sm text-gray-500 flex justify-between items-center">
            <div>
              <span>Shared by </span>
              <span className="font-medium">{strategy.user?.name || strategy.user?.email || 'Anonymous'}</span>
            </div>
            <div>{formatDistanceToNow(new Date(strategy.createdAt), { addSuffix: true })}</div>
          </div>
        </div>
      ))}
    </div>
  );
} 