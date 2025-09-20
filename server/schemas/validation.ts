import { z } from "zod";
import { Request, Response, NextFunction } from "express";

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedQuery?: any;
    }
  }
}

// Trading endpoint validation schemas
export const executeTradeSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/, "Symbol must be uppercase letters only"),
  side: z.enum(["buy", "sell"]),
  qty: z.number().positive("Quantity must be positive"),
  type: z.enum(["market", "limit", "stop", "stop_limit"]),
  time_in_force: z.enum(["day", "gtc", "ioc", "fok"]).optional().default("day"),
  limit_price: z.number().positive().optional(),
  stop_price: z.number().positive().optional(),
  trail_price: z.number().positive().optional(),
  trail_percent: z.number().min(0).max(100).optional(),
}).refine((data) => {
  // Validate limit orders have limit_price
  if (data.type === "limit" && !data.limit_price) {
    return false;
  }
  // Validate stop orders have stop_price
  if ((data.type === "stop" || data.type === "stop_limit") && !data.stop_price) {
    return false;
  }
  // Validate stop_limit orders have both stop_price and limit_price
  if (data.type === "stop_limit" && (!data.stop_price || !data.limit_price)) {
    return false;
  }
  return true;
}, {
  message: "Order type requires appropriate price parameters"
});

// Backtest endpoint validation schema
export const backtestSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/, "Symbol must be uppercase letters only"),
  entryRules: z.object({
    indicators: z.array(z.string()).min(1, "At least one entry indicator required"),
    conditions: z.array(z.string()).min(1, "At least one entry condition required")
  }),
  exitRules: z.object({
    indicators: z.array(z.string()).min(1, "At least one exit indicator required"),
    conditions: z.array(z.string()).min(1, "At least one exit condition required")
  }),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  initialCapital: z.number().positive().optional().default(100000),
  maxPositionSize: z.number().min(0).max(1).optional().default(0.1)
}).refine((data) => {
  // Validate date range if both provided
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: "Start date must be before end date"
});

// API settings validation schema
export const apiSettingsSchema = z.object({
  alpacaApiKey: z.string().optional().default(""),
  alpacaSecret: z.string().optional().default(""),
  geminiApiKey: z.string().optional().default(""),
  tradingMode: z.enum(["paper", "live"]).optional().default("paper"),
  autoTrading: z.boolean().optional().default(false),
  maxPositionSize: z.number().min(1).max(100).optional().default(10),
  stopLoss: z.number().min(0).max(50).optional().default(5),
  takeProfit: z.number().min(0).max(100).optional().default(15)
}).refine((data) => {
  // Ensure live trading is only enabled with proper API keys
  if (data.tradingMode === "live" && (!data.alpacaApiKey || !data.alpacaSecret)) {
    return false;
  }
  return true;
}, {
  message: "Live trading requires both Alpaca API key and secret"
});

// Portfolio query validation schema
export const portfolioQuerySchema = z.object({
  period: z.enum(["1D", "1W", "1M", "3M", "1Y", "ALL"]).optional().default("1M"),
  includePositions: z.boolean().optional().default(true),
  includeMetrics: z.boolean().optional().default(true)
});

// Position query validation schema
export const positionQuerySchema = z.object({
  status: z.enum(["open", "closed", "all"]).optional().default("open"),
  symbol: z.string().optional(),
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0)
});

// Validation middleware factory
export function validateSchema<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code
          }))
        });
      }
      return res.status(400).json({ error: "Invalid request data" });
    }
  };
}

// Query parameter validation middleware
export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid query parameters",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code
          }))
        });
      }
      return res.status(400).json({ error: "Invalid query parameters" });
    }
  };
}