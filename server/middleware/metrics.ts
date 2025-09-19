import { Request, Response, NextFunction } from "express";
import { metricsCollector } from "../services/metrics";

let requestCount = 0;
let errorCount = 0;
const REQUEST_WINDOW = 60000; // 1 minute window for request rate

setInterval(() => {
  metricsCollector.updateApplicationMetrics({
    requestRate: requestCount / (REQUEST_WINDOW / 1000),
    errorRate: errorCount / (REQUEST_WINDOW / 1000),
  });
  requestCount = 0;
  errorCount = 0;
}, REQUEST_WINDOW);

export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const endTimer = metricsCollector.startPerformanceTimer("request");
  requestCount++;

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      errorCount++;
    }

    metricsCollector.updateApplicationMetrics({
      responseTime: endTimer(),
    });
  });

  next();
};
