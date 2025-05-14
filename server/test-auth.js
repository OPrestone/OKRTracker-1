/**
 * Test authentication endpoints to diagnose session issues
 */

function setupTestAuthRoutes(app) {
  // Test route to check session functionality
  app.get('/api/test-session', (req, res) => {
    console.log('Session test route called');
    console.log('Session ID:', req.sessionID);
    console.log('Session:', req.session);
    
    // If no counter exists in session, initialize it
    if (!req.session.counter) {
      req.session.counter = 0;
    }
    
    // Increment the counter
    req.session.counter++;
    
    // Explicitly save the session to ensure it persists
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      
      console.log('Session saved successfully');
      res.json({
        sessionId: req.sessionID,
        counter: req.session.counter,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  // Test route for simple login - no passport
  app.post('/api/test-login', (req, res) => {
    const { username, password } = req.body;
    console.log(`Test login attempt for ${username}`);
    
    // Very simple validation - just for test purposes
    if (username === 'test' && password === 'test123') {
      // Manually set user data in session
      req.session.isTestAuthenticated = true;
      req.session.testUser = { id: 'test-user-id', username };
      
      req.session.save((err) => {
        if (err) {
          console.error('Failed to save test login session:', err);
          return res.status(500).json({ error: 'Session save failed' });
        }
        
        console.log('Test login successful');
        res.json({
          success: true,
          message: 'Test login successful',
          sessionId: req.sessionID,
          user: { id: 'test-user-id', username }
        });
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid test credentials'
      });
    }
  });
  
  // Test route to check if test user is authenticated
  app.get('/api/test-auth-check', (req, res) => {
    console.log('Test auth check route called');
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    
    if (req.session.isTestAuthenticated && req.session.testUser) {
      res.json({
        authenticated: true,
        user: req.session.testUser,
        sessionId: req.sessionID,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        authenticated: false,
        message: 'Not authenticated in test auth'
      });
    }
  });
}

// For CommonJS
exports.setupTestAuthRoutes = setupTestAuthRoutes;
// For ESM
export { setupTestAuthRoutes };