/**
 * 🛡️ API SECURITY MIDDLEWARE
 * Middleware cho tất cả API routes với security features
 * 
 * Features:
 * - Rate limiting per endpoint
 * - Security headers
 * - CORS handling
 * - Input sanitization
 * - Error handling
 * - Request logging
 */

import { NextResponse } from 'next/server';
import security, { rateLimiters } from './security.js';
import logger from './production-logger.js';

// Route-specific rate limiting configuration
const ROUTE_RATE_LIMITS = {
  // Authentication routes - stricter limits
  '/api/auth': 'auth',
  '/api/auth/register': 'auth', 
  '/api/auth/signin': 'auth',
  
  // Sensitive operations
  '/api/transactions': 'sensitive',
  '/api/portfolio': 'sensitive',
  '/api/stock-accounts': 'sensitive',
  
  // Regular API routes
  '/api/market-data': 'api',
  '/api/strategies': 'api',
  '/api/journal': 'api',
  '/api/analysis': 'api',
  
  // Default for unmatched routes
  'default': 'general'
};

/**
 * Get appropriate rate limiter for route
 */
function getRateLimiterForRoute(pathname) {
  // Check exact matches first
  if (ROUTE_RATE_LIMITS[pathname]) {
    return rateLimiters[ROUTE_RATE_LIMITS[pathname]];
  }
  
  // Check prefix matches
  for (const [route, limiterType] of Object.entries(ROUTE_RATE_LIMITS)) {
    if (pathname.startsWith(route)) {
      return rateLimiters[limiterType];
    }
  }
  
  // Default rate limiter
  return rateLimiters[ROUTE_RATE_LIMITS['default']];
}

/**
 * Create rate limit response
 */
function createRateLimitResponse(rateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': '50',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    ...security.getSecurityHeaders()
  };
  
  return NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
      retryAfter: rateLimitResult.retryAfter
    },
    { 
      status: 429,
      headers
    }
  );
}

/**
 * Create error response with security headers
 */
function createErrorResponse(message, status = 500, details = {}) {
  const headers = security.getSecurityHeaders();
  
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
      ...details
    },
    { status, headers }
  );
}

/**
 * Main security middleware wrapper
 */
export function withSecurity(handler, options = {}) {
  return async (request, context) => {
    const startTime = performance.now();
    const { pathname } = new URL(request.url);
    
    try {
      // 1. CORS preflight handling
      if (request.method === 'OPTIONS') {
        const origin = request.headers.get('origin');
        return new NextResponse(null, {
          status: 200,
          headers: {
            ...security.getCorsHeaders(origin),
            ...security.getSecurityHeaders()
          }
        });
      }
      
      // 2. Rate limiting
      if (!options.skipRateLimit) {
        const rateLimiter = getRateLimiterForRoute(pathname);
        const rateLimitResult = rateLimiter(request);
        
        if (!rateLimitResult.allowed) {
          security.auditSecurityEvent('rate_limit_exceeded', {
            pathname,
            ip: security.getClientIP(request),
            limit: rateLimitResult
          }, request);
          
          return createRateLimitResponse(rateLimitResult);
        }
      }
      
      // 3. Input sanitization for POST/PUT requests
      let sanitizedBody = null;
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.clone().json();
          sanitizedBody = security.sanitizeObject(body);
          
          // Replace request body with sanitized version
          Object.defineProperty(request, 'json', {
            value: async () => sanitizedBody,
            writable: false
          });
        } catch (error) {
          // Invalid JSON, let the handler deal with it
          logger.debug('Invalid JSON in request body', { pathname });
        }
      }
      
      // 4. Request logging
      logger.debug('API request received', {
        method: request.method,
        pathname,
        ip: security.getClientIP(request),
        userAgent: request.headers.get('user-agent'),
        hasBody: sanitizedBody !== null
      });
      
      // 5. Execute the actual handler
      const response = await handler(request, context);
      
      // 6. Add security headers to response
      if (response instanceof NextResponse) {
        const securityHeaders = security.getSecurityHeaders();
        const corsHeaders = security.getCorsHeaders(request.headers.get('origin'));
        
        Object.entries({ ...securityHeaders, ...corsHeaders }).forEach(([key, value]) => {
          if (value !== undefined) {
            response.headers.set(key, value);
          }
        });
      }
      
      // 7. Log response
      const duration = performance.now() - startTime;
      logger.debug('API request completed', {
        method: request.method,
        pathname,
        status: response.status,
        duration: `${duration.toFixed(2)}ms`
      });
      
      return response;
      
    } catch (error) {
      // 8. Error handling with security context
      const duration = performance.now() - startTime;
      
      logger.error('API request failed', {
        method: request.method,
        pathname,
        error: error.message,
        stack: error.stack,
        duration: `${duration.toFixed(2)}ms`,
        ip: security.getClientIP(request)
      });
      
      // Audit critical errors
      if (error.name === 'SecurityError' || error.code?.startsWith('AUTH')) {
        security.auditSecurityEvent('api_security_error', {
          pathname,
          error: error.message,
          code: error.code
        }, request);
      }
      
      // Return generic error in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'An error occurred processing your request'
        : error.message;
      
      return createErrorResponse(message, 500, {
        ...(process.env.NODE_ENV !== 'production' && { 
          stack: error.stack,
          code: error.code 
        })
      });
    }
  };
}

/**
 * Authentication middleware
 */
export function withAuth(handler) {
  return withSecurity(async (request, context) => {
    // This can be enhanced to check JWT tokens, API keys, etc.
    // For now, we rely on NextAuth session handling
    
    return handler(request, context);
  });
}

/**
 * Admin-only middleware
 */
export function withAdminAuth(handler) {
  return withAuth(async (request, context) => {
    // Add admin check logic here
    // For now, just pass through
    
    return handler(request, context);
  });
}

/**
 * HTTPS-only middleware (for production)
 */
export function withHTTPS(handler) {
  return withSecurity(async (request, context) => {
    if (process.env.NODE_ENV === 'production') {
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      
      if (protocol !== 'https') {
        security.auditSecurityEvent('insecure_request', {
          protocol,
          url: request.url
        }, request);
        
        return createErrorResponse('HTTPS required', 400);
      }
    }
    
    return handler(request, context);
  });
}

/**
 * Content-Type validation middleware
 */
export function withContentTypeValidation(allowedTypes = ['application/json']) {
  return (handler) => withSecurity(async (request, context) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type');
      
      if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
        return createErrorResponse('Invalid Content-Type', 400, {
          expected: allowedTypes,
          received: contentType
        });
      }
    }
    
    return handler(request, context);
  });
}

/**
 * Request size limit middleware
 */
export function withSizeLimit(maxSize = 1024 * 1024) { // 1MB default
  return (handler) => withSecurity(async (request, context) => {
    const contentLength = request.headers.get('content-length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      security.auditSecurityEvent('request_size_exceeded', {
        contentLength,
        maxSize,
        url: request.url
      }, request);
      
      return createErrorResponse('Request size too large', 413, {
        maxSize: `${maxSize} bytes`,
        received: `${contentLength} bytes`
      });
    }
    
    return handler(request, context);
  });
}

/**
 * Combine multiple middlewares
 */
export function combineMiddlewares(...middlewares) {
  return (handler) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

// Common middleware combinations
export const standardApiMiddleware = combineMiddlewares(
  withSecurity,
  withContentTypeValidation(['application/json']),
  withSizeLimit(2 * 1024 * 1024) // 2MB
);

export const authApiMiddleware = combineMiddlewares(
  withAuth,
  withContentTypeValidation(['application/json']),
  withSizeLimit(1024 * 1024) // 1MB
);

export const adminApiMiddleware = combineMiddlewares(
  withAdminAuth,
  withHTTPS,
  withContentTypeValidation(['application/json']),
  withSizeLimit(512 * 1024) // 512KB
);

