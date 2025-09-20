import winston from "winston";
import { performance } from "perf_hooks";

interface LogContext {
  operation: string;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private static instance: PerformanceLogger;
  private logger: winston.Logger;

  private constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "logs/combined.log" }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });
  }

  public static getInstance(): PerformanceLogger {
    if (!PerformanceLogger.instance) {
      PerformanceLogger.instance = new PerformanceLogger();
    }
    return PerformanceLogger.instance;
  }

  public startOperation(operation: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.log({ operation, duration });
    };
  }

  public log(context: LogContext): void {
    this.logger.info({
      type: "performance",
      operation: context.operation,
      duration: context.duration,
      ...context.metadata,
    });
  }

  public error(error: Error, context: LogContext): void {
    this.logger.error({
      type: "error",
      operation: context.operation,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      duration: context.duration,
      ...context.metadata,
    });
  }

  public warn(message: string, context: LogContext): void {
    this.logger.warn({
      type: "warning",
      operation: context.operation,
      message,
      duration: context.duration,
      ...context.metadata,
    });
  }
}

export const performanceLogger = PerformanceLogger.getInstance();
export const logger = performanceLogger; // Export as logger for compatibility
export type { LogContext };
