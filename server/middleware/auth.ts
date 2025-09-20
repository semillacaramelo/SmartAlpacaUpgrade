import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { storage } from "../storage";

// JWT secret - in production, this should be a strong, randomly generated secret
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
      };
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  username: string;
}

// Generate JWT token
export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username 
    },
    JWT_SECRET as string,
    { 
      expiresIn: "24h" // Hard-coded to avoid type issues
    }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthenticatedUser {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    return {
      id: decoded.id,
      username: decoded.username
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'Authorization header required',
      message: 'Please provide a valid JWT token in the Authorization header'
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next(); // Continue without authentication
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  try {
    const user = verifyToken(token);
    req.user = user;
  } catch (error) {
    // Log the error but don't fail the request
    console.warn('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  next();
};

// Demo user authentication (for development)
export const authenticateDemo = (req: Request, res: Response, next: NextFunction) => {
  // In development, allow requests without authentication for the demo user
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'demo-user-id',
      username: 'demo-user'
    };
    return next();
  }
  
  // In production, require proper authentication
  return authenticate(req, res, next);
};

// Login endpoint handler
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }

    // For demo purposes, accept demo-user with any password
    if (username === 'demo-user' && process.env.NODE_ENV === 'development') {
      const token = generateToken({
        id: 'demo-user-id',
        username: 'demo-user'
      });

      return res.json({
        success: true,
        token,
        user: {
          id: 'demo-user-id',
          username: 'demo-user'
        }
      });
    }

    // Look up user in database
    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      username: user.username
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
};

// Register endpoint handler
export const registerHandler = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Username and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this username already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      email: email || null
    });

    // Generate token
    const token = generateToken({
      id: newUser.id,
      username: newUser.username
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
};

// User profile endpoint handler
export const profileHandler = (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'User authentication required'
    });
  }

  res.json({
    success: true,
    user: req.user
  });
};