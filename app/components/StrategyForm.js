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
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Share a New Strategy</h2>
      
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="form-label">
            Title (Optional)
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="input-field"
            value={strategy.title}
            onChange={handleChange}
            placeholder="E.g., 'Moving Average Crossover Strategy'"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="form-label">
            Strategy Details
          </label>
          <textarea
            id="content"
            name="content"
            rows="6"
            className="input-field"
            value={strategy.content}
            onChange={handleChange}
            placeholder="Describe your trading strategy in detail..."
            required
          ></textarea>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
          >
            Share Strategy
          </button>
        </div>
      </form>
    </div>
  );
} 