/**
 * Secure Error Handling Middleware
 * Prevents sensitive information disclosure while maintaining useful error information
 */

// Define sensitive field names that should never be logged
const SENSITIVE_FIELDS = [
  'password',
  'secret',
  'token', 
  'api_key',
  'apiKey',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'jwt',
  'privateKey',
  'connectionString',
  'database_url',
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'ACCESS_TOKEN',
  'REFRESH_TOKEN'
];

// Database-related error patterns that should be sanitized
const DB_ERROR_PATTERNS = [
  /invalid input syntax/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /constraint .* failed/i,
  /foreign key constraint/i,
  /unique constraint/i,
  /connection.*refused/i,
  /authentication.*failed/i,
  /role.*does not exist/i,
  /database.*does not exist/i,
  /prisma/i,
  /postgresql/i,
  /pg_/i
];

/**
 * Sanitize error for client response
 * @param {Error} error - The error to sanitize
 * @param {boolean} isProduction - Whether running in production
 * @returns {Object} Sanitized error object
 */
export function sanitizeError(error, isProduction = process.env.NODE_ENV === 'production') {
  // In production, return generic error messages
  if (isProduction) {
    // Check if it's a known client error (4xx)
    if (error.status >= 400 && error.status < 500) {
      return {
        message: error.message || 'Client error',
        code: 'CLIENT_ERROR',
        status: error.status
      };
    }
    
    // For server errors (5xx), return generic message
    return {
      message: 'An internal server error occurred',
      code: 'INTERNAL_ERROR',
      status: 500
    };
  }
  
  // In development, return more details but still sanitized
  let sanitizedMessage = error.message || 'Unknown error';
  
  // Check for database-related errors and sanitize them
  for (const pattern of DB_ERROR_PATTERNS) {
    if (pattern.test(sanitizedMessage)) {
      sanitizedMessage = 'Database operation failed';
      break;
    }
  }
  
  return {
    message: sanitizedMessage,
    code: error.code || 'INTERNAL_ERROR',
    status: error.status || 500
  };
}

/**
 * Sanitize data object by removing sensitive fields
 * @param {any} data - Data to sanitize
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {any} Sanitized data
 */
export function sanitizeLogData(data, maxDepth = 5) {
  if (maxDepth <= 0) {
    return '[Max depth reached]';
  }
  
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, maxDepth - 1));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Check if field is sensitive
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Special handling for common sensitive patterns
    if (lowerKey.includes('pass') || lowerKey.includes('pwd')) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value, maxDepth - 1);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Secure logging function that sanitizes sensitive data
 * @param {Error} error - Error to log
 * @param {Object} context - Additional context to log
 * @param {string} level - Log level (error, warn, info, debug)
 */
export function secureLog(error, context = {}, level = 'error') {
  const timestamp = new Date().toISOString();
  
  // Sanitize the context data
  const sanitizedContext = sanitizeLogData(context);
  
  // Create sanitized error object
  const logEntry = {
    timestamp,
    level,
    message: error.message || 'Unknown error',
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    context: sanitizedContext
  };
  
  // Remove undefined fields
  Object.keys(logEntry).forEach(key => {
    if (logEntry[key] === undefined) {
      delete logEntry[key];
    }
  });
  
  // Log to console with appropriate level
  switch (level) {
    case 'error':
      console.error('SECURE_LOG:', JSON.stringify(logEntry, null, 2));
      break;
    case 'warn':
      console.warn('SECURE_LOG:', JSON.stringify(logEntry, null, 2));
      break;
    case 'info':
      console.info('SECURE_LOG:', JSON.stringify(logEntry, null, 2));
      break;
    case 'debug':
      console.debug('SECURE_LOG:', JSON.stringify(logEntry, null, 2));
      break;
    default:
      console.log('SECURE_LOG:', JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Create a standardized API error response
 * @param {Error} error - The error that occurred
 * @param {Object} context - Additional context for logging
 * @returns {Response} Next.js Response object
 */
export function createErrorResponse(error, context = {}) {
  // Log the error securely on the server side
  secureLog(error, context, 'error');
  
  // Return sanitized error to client
  const sanitizedError = sanitizeError(error);
  
  return new Response(
    JSON.stringify({
      success: false,
      ...sanitizedError
    }),
    {
      status: sanitizedError.status || 500,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Middleware wrapper for API routes with error handling
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler with error handling
 */
export function withErrorHandling(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return createErrorResponse(error, {
        url: request.url,
        method: request.method,
        userAgent: request.headers.get('user-agent')
      });
    }
  };
}

export default {
  sanitizeError,
  sanitizeLogData,
  secureLog,
  createErrorResponse,
  withErrorHandling
}; 