'use client';

/**
 * Skeleton Loading Components
 * Provides various skeleton loading states for better UX
 */

// Table Skeleton - for transaction/portfolio tables
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="animate-pulse" role="status" aria-busy="true" aria-label="Loading table data">
      {/* Header skeleton */}
      <div className="grid grid-cols-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded" />
        ))}
      </div>
      {/* Row skeletons */}
      {[...Array(rows)].map((_, row) => (
        <div key={row} className="grid grid-cols-6 gap-4 p-4 border-b dark:border-gray-700">
          {[...Array(cols)].map((_, col) => (
            <div key={col} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Card Skeleton - for dashboard cards
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg" role="status" aria-busy="true">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
      {lines > 2 && (
        <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
      )}
      <span className="sr-only">Loading card...</span>
    </div>
  );
}

// Chart Skeleton - for charts/graphs
export function ChartSkeleton({ height = 300 }) {
  return (
    <div 
      className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md" 
      style={{ height: `${height}px` }}
      role="status" 
      aria-busy="true"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
      <div className="flex items-end justify-between h-full space-x-2">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-200 dark:bg-gray-700 rounded-t"
            style={{
              width: '12%',
              height: `${Math.random() * 60 + 40}%`,
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading chart...</span>
    </div>
  );
}

// List Skeleton - for lists of items
export function ListSkeleton({ items = 5 }) {
  return (
    <div className="animate-pulse space-y-3" role="status" aria-busy="true">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading list...</span>
    </div>
  );
}

// Form Skeleton - for forms
export function FormSkeleton({ fields = 4 }) {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md" role="status" aria-busy="true">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
      <div className="space-y-4">
        {[...Array(fields)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-10 bg-gray-100 dark:bg-gray-600 rounded w-full" />
          </div>
        ))}
        <div className="flex justify-end space-x-3 pt-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
      </div>
      <span className="sr-only">Loading form...</span>
    </div>
  );
}

// Generic Skeleton - flexible skeleton component
export function Skeleton({ className = '', width, height, rounded = true }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${rounded ? 'rounded' : ''} ${className}`}
      style={style}
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}














