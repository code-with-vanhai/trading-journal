'use client';

import { useState } from 'react';

export default function StrategyForm({ onSubmit }) {
  const [strategy, setStrategy] = useState({
    title: '',
    content: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStrategy(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!strategy.content.trim()) {
      setError('Strategy content is required');
      return;
    }

    // Submit the form
    onSubmit(strategy);

    // Reset form
    setStrategy({
      title: '',
      content: '',
    });
  };

  return (
    <div className="card dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Share a New Strategy</h2>
      
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded mb-4 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="form-label dark:text-gray-300">
            Title (Optional)
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={strategy.title}
            onChange={handleChange}
            placeholder="E.g., 'Moving Average Crossover Strategy'"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="form-label dark:text-gray-300">
            Strategy Details
          </label>
          <textarea
            id="content"
            name="content"
            rows="6"
            className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
            value={strategy.content}
            onChange={handleChange}
            placeholder="Describe your trading strategy in detail..."
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            Share Strategy
          </button>
        </div>
      </form>
    </div>
  );
} 