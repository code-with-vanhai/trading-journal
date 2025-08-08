/**
 * 🛡️ SECURITY CONFIGURATION & MIDDLEWARE
 * Comprehensive security layer cho trading journal application
 * 
 * Features:
 * - Rate limiting per endpoint
 * - CORS configuration
 * - Security headers
 * - Environment validation
 * - Secret management
 * - Input sanitization
 */

import logger from './production-logger.js';

// Security configuration based on environment
const SECURITY_CONFIG = {
  development: {
    rateLimits: {
      general: { windowMs: 15 * 60 * 1000, max: 200 },      // 200 requests per 15min
      api: { windowMs: 15 * 60 * 1000, max: 100 },          // 100 API calls per 15min
      auth: { windowMs: 15 * 60 * 1000, max: 10 },          // 10 auth attempts per 15min
      sensitive: { windowMs: 15 * 60 * 1000, max: 5 },      // 5 sensitive operations per 15min
    },
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }
  },
  production: {
    rateLimits: {
      general: { windowMs: 15 * 60 * 1000, max: 100 },      // 100 requests per 15min
      api: { windowMs: 15 * 60 * 1000, max: 50 },           // 50 API calls per 15min  
      auth: { windowMs: 15 * 60 * 1000, max: 5 },           // 5 auth attempts per 15min
      sensitive: { windowMs: 15 * 60 * 1000, max: 3 },      // 3 sensitive operations per 15min
    },
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true
    }
  }
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map();

class SecurityManager {
  constructor() {
    this.config = SECURITY_CONFIG[process.env.NODE_ENV] || SECURITY_CONFIG.development;
    this.sensitivePatterns = [
      /password/i,
      /secret/i, 
      /token/i,
      /key/i,
      /auth/i,
      /credential/i
    ];
  }

  /**
   * Validate all required environment variables
   */
  validateEnvironment() {
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET', 
      'NEXTAUTH_URL'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      const error = new Error(`Missing required environment variables: ${missing.join(', ')}`);
      logger.fatal('Environment validation failed', { missingVars: missing });
      throw error;
    }

    // Validate secret lengths
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
      logger.warn('NEXTAUTH_SECRET should be at least 32 characters for security');
    }

    logger.info('Environment validation passed', { 
      nodeEnv: process.env.NODE_ENV,
      requiredVarsCount: requiredVars.length 
    });
  }

  /**
   * Generate secure test passwords (for tests only)
   */
  generateTestPassword() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Test password generation not allowed in production');
    }
    
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Rate limiting middleware
   */
  createRateLimiter(type = 'general') {
    const limits = this.config.rateLimits[type] || this.config.rateLimits.general;
    
    return (request) => {
      const ip = this.getClientIP(request);
      const key = `${type}_${ip}`;
      const now = Date.now();
      
      // Get or create rate limit entry
      let rateLimitEntry = rateLimitStore.get(key);
      
      if (!rateLimitEntry || now - rateLimitEntry.resetTime > limits.windowMs) {
        // Reset or create new entry
        rateLimitEntry = {
          count: 0,
          resetTime: now,
          firstRequest: now
        };
        rateLimitStore.set(key, rateLimitEntry);
      }
      
      rateLimitEntry.count++;
      
      // Check if limit exceeded
      if (rateLimitEntry.count > limits.max) {
        logger.warn('Rate limit exceeded', {
          ip,
          type,
          count: rateLimitEntry.count,
          limit: limits.max,
          windowMs: limits.windowMs
        });
        
        return {
          allowed: false,
          remaining: 0,
          resetTime: rateLimitEntry.resetTime + limits.windowMs,
          retryAfter: Math.ceil((rateLimitEntry.resetTime + limits.windowMs - now) / 1000)
        };
      }
      
      return {
        allowed: true,
        remaining: limits.max - rateLimitEntry.count,
        resetTime: rateLimitEntry.resetTime + limits.windowMs,
        used: rateLimitEntry.count
      };
    };
  }

  /**
   * Get client IP address from request
   */
  getClientIP(request) {
    // Handle various proxy headers
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    return request.headers.get('x-real-ip') || 
           request.headers.get('cf-connecting-ip') ||
           request.ip || 
           'unknown';
  }

  /**
   * Security headers middleware
   */
  getSecurityHeaders() {
    return {
      // Prevent XSS attacks
      'X-XSS-Protection': '1; mode=block',
      
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Content Security Policy (basic)
      'Content-Security-Policy': process.env.NODE_ENV === 'production' 
        ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
        : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:;",
      
      // HTTPS redirect in production
      'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
        ? 'max-age=31536000; includeSubDomains; preload'
        : undefined
    };
  }

  /**
   * CORS configuration
   */
  getCorsHeaders(origin) {
    const allowedOrigins = this.config.cors.origin;
    const isAllowed = Array.isArray(allowedOrigins) 
      ? allowedOrigins.includes(origin)
      : allowedOrigins === origin || allowedOrigins === '*';
    
    if (!isAllowed && process.env.NODE_ENV === 'production') {
      logger.warn('CORS: Origin not allowed', { origin, allowedOrigins });
      return {};
    }
    
    return {
      'Access-Control-Allow-Origin': isAllowed ? origin : 'null',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // 24 hours
    };
  }

  /**
   * Input sanitization
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potential XSS patterns
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeInput(value);
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Remove sensitive data from logs
   */
  sanitizeSensitiveData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    const sanitizeRecursive = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if key contains sensitive patterns
        if (this.sensitivePatterns.some(pattern => pattern.test(lowerKey))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeRecursive(obj[key]);
        }
      });
    };
    
    sanitizeRecursive(sanitized);
    return sanitized;
  }

  /**
   * Validate session security
   */
  validateSession(session) {
    if (!session) return false;
    
    // Check session age
    const maxAge = 30 * 60 * 1000; // 30 minutes
    const sessionAge = Date.now() - new Date(session.expires || session.iat).getTime();
    
    if (sessionAge > maxAge) {
      logger.warn('Session expired', { 
        sessionAge: `${Math.round(sessionAge / 1000)}s`,
        maxAge: `${maxAge / 1000}s`
      });
      return false;
    }
    
    return true;
  }

  /**
   * Create secure headers for API responses
   */
  createSecureResponse(data, request, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getSecurityHeaders(),
      ...this.getCorsHeaders(request.headers.get('origin'))
    };
    
    // Remove undefined headers
    Object.keys(headers).forEach(key => {
      if (headers[key] === undefined) {
        delete headers[key];
      }
    });
    
    return {
      headers,
      status: options.status || 200
    };
  }

  /**
   * Audit security event
   */
  auditSecurityEvent(event, details = {}, request = null) {
    const auditData = {
      event,
      timestamp: new Date().toISOString(),
      ip: request ? this.getClientIP(request) : 'unknown',
      userAgent: request ? request.headers.get('user-agent') : 'unknown',
      ...this.sanitizeSensitiveData(details)
    };
    
    logger.error('Security Event', auditData);
    
    // In production, send to SIEM or security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityMonitoring(auditData);
    }
  }

  /**
   * Send to external security monitoring (placeholder)
   */
  sendToSecurityMonitoring(auditData) {
    // Implement integration with security monitoring services like:
    // - Datadog Security Monitoring
    // - Splunk
    // - Elastic Security
    // - AWS Security Hub
    // - Azure Sentinel
    
    // For now, just ensure it's logged
    console.error('[SECURITY AUDIT]', JSON.stringify(auditData));
  }

  /**
   * Clean up expired rate limit entries (run periodically)
   */
  cleanupRateLimits() {
    const now = Date.now();
    const windowMs = Math.max(...Object.values(this.config.rateLimits).map(limit => limit.windowMs));
    
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.resetTime > windowMs) {
        rateLimitStore.delete(key);
      }
    }
    
    logger.debug('Rate limit cleanup completed', { 
      remainingEntries: rateLimitStore.size 
    });
  }
}

// Create singleton instance
const security = new SecurityManager();

// Validate environment on startup
try {
  security.validateEnvironment();
} catch (error) {
  process.exit(1);
}

// Cleanup rate limits every 10 minutes
setInterval(() => {
  security.cleanupRateLimits();
}, 10 * 60 * 1000);

// Export security manager and utilities
export default security;

// Convenient exports for middleware usage
export const rateLimiters = {
  general: security.createRateLimiter('general'),
  api: security.createRateLimiter('api'),
  auth: security.createRateLimiter('auth'),
  sensitive: security.createRateLimiter('sensitive')
};

export const {
  sanitizeInput,
  sanitizeObject,
  sanitizeSensitiveData,
  validateSession,
  createSecureResponse,
  auditSecurityEvent,
  getSecurityHeaders,
  getCorsHeaders
} = security;

