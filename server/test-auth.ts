import { Express, Request, Response } from 'express';

/**
 * Sets up test authentication routes for debugging purposes
 */
export function setupTestAuthRoutes(app: Express) {
  // Test session route - returns session information for debugging
  app.get('/api/test-session', (req: Request, res: Response) => {
    console.log('Session test route called');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    
    // Update session counter
    req.session.counter = (req.session.counter || 0) + 1;
    
    // Save the updated session
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('Session saved successfully');
      
      // Return session information
      res.json({
        sessionId: req.sessionID,
        counter: req.session.counter,
        timestamp: new Date().toISOString(),
        cookies: req.headers.cookie ? 'Present' : 'None'
      });
    });
  });
  
  // Test authentication status route
  app.get('/api/auth-status', (req: Request, res: Response) => {
    res.json({
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        tenants: req.user.tenants?.map(t => ({ id: t.id, name: t.name, role: t.userRole }))
      } : null,
      sessionID: req.sessionID,
      session: {
        ...req.session,
        // Don't expose cookie for security reasons
        cookie: {
          expires: req.session.cookie.expires,
          maxAge: req.session.cookie.maxAge
        }
      }
    });
  });
  
  // Test login with debug information
  app.post('/api/test-login', (req: Request, res: Response, next) => {
    console.log('Test login attempt with:', {
      username: req.body.username,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      cookies: req.headers.cookie
    });
    
    // Pass to regular login handler
    // This expects passport.authenticate middleware to be configured elsewhere
    next();
  });
}