'use client';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  siblingsCount = 1,
  boundaryCount = 1,
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers array with dots for ellipsis
  const generatePaginationItems = () => {
    // For small number of pages, just show all pages
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const range = (start, end) => {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const items = [];
    
    // Always show first page
    items.push(1);
    
    // Calculate the start and end of the middle section
    const leftSibling = Math.max(currentPage - siblingsCount, 1);
    const rightSibling = Math.min(currentPage + siblingsCount, totalPages);
    
    // Determine if we need dots on the left
    const shouldShowLeftDots = leftSibling > 2;
    // Determine if we need dots on the right  
    const shouldShowRightDots = rightSibling < totalPages - 1;
    
    // If we need left dots
    if (shouldShowLeftDots) {
      items.push('...');
    } else if (leftSibling === 2) {
      // If leftSibling is 2, just add page 2 instead of dots
      items.push(2);
    }
    
    // Add the middle section (around current page)
    for (let i = leftSibling; i <= rightSibling; i++) {
      if (i !== 1 && i !== totalPages) {
        items.push(i);
      }
    }
    
    // If we need right dots
    if (shouldShowRightDots) {
      items.push('...');
    } else if (rightSibling === totalPages - 1) {
      // If rightSibling is totalPages - 1, just add that page instead of dots
      items.push(totalPages - 1);
    }
    
    // Always show last page (if it's not page 1)
    if (totalPages > 1) {
      items.push(totalPages);
    }
    
    // Remove duplicates while preserving order
    const uniqueItems = [];
    const seen = new Set();
    
    for (const item of items) {
      if (!seen.has(item)) {
        seen.add(item);
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  };

  const pages = generatePaginationItems();

  return (
    <div className="flex justify-center mt-6">
      <nav className="flex space-x-1">
        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200
            ${currentPage === 1
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
          `}
        >
          ←
        </button>

        {/* Page numbers */}
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`
              px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200
              ${page === currentPage
                ? 'bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700'
                : page === '...'
                  ? 'text-gray-500 dark:text-gray-500 cursor-default border-transparent bg-transparent'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
            `}
          >
            {page}
          </button>
        ))}

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            px-3 py-2 rounded-md text-sm font-medium border transition-colors duration-200
            ${currentPage === totalPages
              ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}
          `}
        >
          →
        </button>
      </nav>
    </div>
  );
} 