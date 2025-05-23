import { Express } from "express";

/**
 * Sets up health check routes that don't require authentication
 * This is useful for diagnostic purposes
 */
export function setupHealthRoutes(app: Express) {
  // Simple health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      auth: {
        isAuthenticated: req.isAuthenticated(),
        session: req.session ? { 
          id: req.session.id,
          cookie: req.session.cookie ? {
            maxAge: req.session.cookie.maxAge,
            secure: req.session.cookie.secure
          } : null
        } : null
      }
    });
  });
}