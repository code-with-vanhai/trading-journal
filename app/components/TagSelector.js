'use client';

import { useState, useEffect } from 'react';

export default function TagSelector({ selectedTags = [], onChange }) {
  const [tags, setTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Fetch tags on component mount
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/journal/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const data = await response.json();
      setTags(data);
    } catch (err) {
      setError('Error loading tags');
      console.error('Tag fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagToggle = (tagId) => {
    const updatedSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    onChange(updatedSelection);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsAddingTag(true);
    try {
      const response = await fetch('/api/journal/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTagName.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create tag');
      }
      
      const newTag = await response.json();
      setTags([...tags, newTag]);
      setNewTagName('');
      
      // Auto-select the newly created tag
      onChange([...selectedTags, newTag.id]);
    } catch (err) {
      setError('Error creating tag');
      console.error('Tag creation error:', err);
    } finally {
      setIsAddingTag(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-500">Loading tags...</div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {tags.length === 0 ? (
          <div className="text-gray-500">No tags yet. Create your first tag below.</div>
        ) : (
          tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedTags.includes(tag.id)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tag.name}
            </button>
          ))
        )}
      </div>
      
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name"
          className="input-field flex-grow"
        />
        <button
          type="button"
          onClick={handleCreateTag}
          disabled={!newTagName.trim() || isAddingTag}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          {isAddingTag ? 'Adding...' : 'Add Tag'}
        </button>
      </div>
    </div>
  );
} 