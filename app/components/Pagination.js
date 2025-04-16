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
    const range = (start, end) => {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    // Always show first boundary pages
    const startPages = range(1, Math.min(boundaryCount, totalPages));
    
    // Always show last boundary pages
    const endPages = range(
      Math.max(totalPages - boundaryCount + 1, boundaryCount + 1),
      totalPages
    );

    // Calculate sibling pages around the current page
    const siblingStart = Math.max(
      Math.min(
        // Current page - siblings
        currentPage - siblingsCount,
        // Last page - (siblings + boundary pages + 1 for dot symbol)
        totalPages - siblingsCount - boundaryCount - 1
      ),
      // Make sure siblings don't overlap with boundary pages
      boundaryCount + 2
    );

    const siblingEnd = Math.min(
      Math.max(
        // Current page + siblings
        currentPage + siblingsCount,
        // First page + (siblings + boundary + 1 for dot symbol)
        boundaryCount + siblingsCount + 2
      ),
      // Make sure siblings don't overlap with boundary pages
      endPages.length > 0 ? endPages[0] - 2 : totalPages - 1
    );

    const items = [];

    // Add first boundary pages
    items.push(...startPages);

    // Add ellipsis if needed
    if (siblingStart > boundaryCount + 2) {
      items.push('...');
    } else if (boundaryCount + 1 < siblingStart) {
      items.push(boundaryCount + 1);
    }

    // Add sibling pages
    items.push(...range(siblingStart, siblingEnd));

    // Add ellipsis if needed
    if (siblingEnd < totalPages - boundaryCount - 1) {
      items.push('...');
    } else if (siblingEnd < totalPages - boundaryCount) {
      items.push(totalPages - boundaryCount);
    }

    // Add last boundary pages
    items.push(...endPages);

    return items;
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
            px-3 py-1 rounded-md text-sm font-medium
            ${currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'}
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
              px-3 py-1 rounded-md text-sm font-medium
              ${page === currentPage
                ? 'bg-primary text-white'
                : page === '...'
                  ? 'text-gray-500 cursor-default'
                  : 'text-gray-700 hover:bg-gray-200'}
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
            px-3 py-1 rounded-md text-sm font-medium
            ${currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-200'}
          `}
        >
          →
        </button>
      </nav>
    </div>
  );
} 