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
    if (!req.session.counter) {
      req.session.counter = 1;
    } else {
      req.session.counter++;
    }
    
    // Save the updated session
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        res.status(500).json({ error: 'Session save error', details: err.message });
      } else {
        console.log('Session saved successfully');
        
        // Return authentication status and session info for debugging
        res.json({
          sessionId: req.sessionID,
          isAuthenticated: req.isAuthenticated(),
          counter: req.session.counter,
          timestamp: new Date().toISOString(),
          cookies: req.headers.cookie ? 'Present' : 'None',
          user: req.isAuthenticated() ? {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            name: req.user.name,
          } : 'none'
        });
      }
    });
  });
  
  // Test user info endpoint - returns current user details
  app.get('/api/test-user', (req: Request, res: Response) => {
    console.log('User info test route called');
    console.log('Authentication status:', req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Return basic user data for debugging
    res.json({
      id: req.user.id,
      username: req.user.username || 'unknown',
      authenticated: true,
      session: req.sessionID,
      tenantId: req.tenantId || 'none'
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
  
  // Test auth check endpoint
  app.get('/api/test-auth-check', (req: Request, res: Response) => {
    console.log('Auth check route called');
    console.log('Is authenticated:', req.isAuthenticated());
    
    res.json({
      authenticated: req.isAuthenticated(),
      user: req.user ? {
        id: req.user.id,
        username: req.user.username,
        tenants: req.user.tenants?.length || 0
      } : null,
      sessionID: req.sessionID
    });
  });
  
  // Test teams endpoint - gets teams without auth requirement
  app.get('/api/test-teams', (req: Request, res: Response) => {
    console.log('Test teams route called');
    
    // Create sample teams for testing UI
    const sampleTeams = [
      {
        id: 'test-team-1',
        name: 'Executive Team',
        description: 'Company leadership and executives',
        icon: '👑',
        color: '#4f46e5',
        members_count: 5
      },
      {
        id: 'test-team-2',
        name: 'Marketing',
        description: 'Marketing and communications',
        icon: '🚀',
        color: '#10b981',
        members_count: 8
      },
      {
        id: 'test-team-3',
        name: 'Engineering',
        description: 'Software development and IT operations',
        icon: '⚙️',
        color: '#f59e0b',
        members_count: 12
      },
      {
        id: 'test-team-4',
        name: 'Sales',
        description: 'Revenue generation and customer acquisition',
        icon: '💰',
        color: '#ef4444',
        members_count: 10
      },
      {
        id: 'test-team-5',
        name: 'Customer Support',
        description: 'Client services and success',
        icon: '🙋',
        color: '#8b5cf6',
        members_count: 7
      }
    ];
    
    res.json(sampleTeams);
  });
}