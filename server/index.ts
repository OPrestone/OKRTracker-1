// Load environment variables from .env file first
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Try to load from .env file
const result = dotenv.config();
if (result.error) {
  // If .env file doesn't exist but .env.example does, provide a helpful message
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  // Check if .env file doesn't exist but .env.example does
  let isFileNotFound = false;
  try {
    isFileNotFound = result.error.message.includes('ENOENT') && fs.existsSync(envExamplePath);
  } catch (e) {
    // Silently handle any error in the check
  }
  
  if (isFileNotFound) {
    console.warn('\x1b[33m%s\x1b[0m', 'No .env file found. You should create one based on .env.example.');
    console.warn('\x1b[33m%s\x1b[0m', 'Run: cp .env.example .env');
    console.warn('\x1b[33m%s\x1b[0m', 'Then edit the .env file with your configuration.');
    console.warn('\x1b[33m%s\x1b[0m', 'Or run: node scripts/setup.js for guided setup.');
  } else {
    console.warn('\x1b[33m%s\x1b[0m', 'Error loading .env file:', result.error);
  }
}

// Extra safety - allow .env to be loaded from the parent directory as well
// This helps when running from subdirectories
if (!process.env.DATABASE_URL) {
  try {
    const parentEnvPath = path.join(process.cwd(), '..', '.env');
    if (fs.existsSync(parentEnvPath)) {
      dotenv.config({ path: parentEnvPath });
      console.log('Loaded .env file from parent directory');
    }
  } catch (error) {
    // Silently continue if parent .env can't be loaded
  }
}

// Import necessary libraries
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Create express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging requests and responses
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

// Initialize the app and setup routes
(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite for development
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app on port 5000 for compatibility with Replit workflows
  const port = 5000;
  server.listen(5000, 'localhost', () => {
    console.log('Server is running');
  });
})();
