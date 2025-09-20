import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// CORS configuration
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    // In development, allow any origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // In production, check allowed origins
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5000').split(',');
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for WebSocket compatibility
});

// Rate limiting
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60, // 15 minutes in seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health checks and test endpoints
    return req.path === '/api/health' ||
      req.path === '/health' ||
      req.path.startsWith('/api/test/');
  },
});

// Stricter rate limiting for sensitive endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 authentication attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request size limits
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: 'Request entity too large',
          maxSize: maxSize,
        });
      }
    }
    next();
  };
};

// Trading-specific rate limiting
export const tradingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 trading requests per minute
  message: {
    error: 'Trading rate limit exceeded. Maximum 10 trades per minute.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to parse size strings like '10mb', '1gb', etc.
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const [, num, unit] = match;
  return parseFloat(num) * units[unit];
}

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Recursively sanitize object
  function sanitize(obj: any): any {
    if (typeof obj === 'string') {
      // Basic XSS prevention
      return obj
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 1000); // Limit string length
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanKey) {
          sanitized[cleanKey] = sanitize(value);
        }
      }
      return sanitized;
    }

    return obj;
  }

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};