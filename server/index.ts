import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import {
  corsMiddleware,
  securityHeaders,
  apiRateLimit,
  sanitizeInput,
  requestSizeLimit
} from "./middleware/security";

// Simple logging function for API server
function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [api-server] ${message}`);
}

const app = express();

// Security middleware (apply before body parsing)
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(requestSizeLimit('10mb'));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// API rate limiting
app.use('/api', apiRateLimit);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In development, we only serve the API
  // The Vite dev server will run separately on port 3000
  // and proxy API calls to this server on port 5000

  // ALWAYS serve the API on port 5000 for development and production
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0", // Allow connections from any host
  }, () => {
    log(`API server serving on port ${port}`);
    log(`Local: http://localhost:${port}`);
    if (app.get("env") === "development") {
      log(`Frontend dev server should be running on http://localhost:3000`);
      log(`Run: npm run dev:client in a separate terminal`);
    }
  });
})();
