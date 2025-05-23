import { Express, Request, Response } from 'express';

/**
 * Authentication test routes for debugging session/auth issues
 */
export function setupTestAuthRoutes(app: Express) {
  // Test session endpoint - check session status
  app.get('/api/test-session', (req: Request, res: Response) => {
    console.log('Session test route called');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    
    // Increment counter to see if session is being saved properly
    if (!req.session.counter) {
      req.session.counter = 1;
    } else {
      req.session.counter++;
    }
    
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