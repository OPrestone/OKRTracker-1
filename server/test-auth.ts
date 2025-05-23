import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, tenants } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
import { ulid } from "ulid";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { comparePasswords, hashPassword } from "./auth";
import session from "express-session";
import MemoryStore from "memorystore";

// Creates a simple session store
const SessionStore = MemoryStore(session);

export function setupTestAuth(app: Express) {
  // Simple session configuration for testing
  app.use(
    session({
      secret: "test-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000 // 24 hours
      })
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        console.log(`Login attempt for email: ${email}`);
        try {
          // Find user by email
          const user = await db.query.users.findFirst({
            where: eq(users.email, email),
          });

          if (!user) {
            console.log(`User not found: ${email}`);
            return done(null, false, { message: "Incorrect email." });
          }

          // Compare password
          const isValid = await comparePasswords(password, user.passwordHash || "");
          if (!isValid) {
            console.log(`Invalid password for user: ${email}`);
            return done(null, false, { message: "Incorrect password." });
          }

          console.log(`User authenticated: ${user.id}`);
          return done(null, user);
        } catch (error) {
          console.error("Authentication error:", error);
          return done(error);
        }
      }
    )
  );

  // Setup serialization/deserialization - simplified for test
  passport.serializeUser((user: any, done) => {
    console.log(`Serializing user: ${user.id}`);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    console.log(`Deserializing user ID: ${id}`);
    try {
      // Simple user lookup without tenant-related queries to avoid loops
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      
      if (!user) {
        console.log(`User not found during deserialization: ${id}`);
        return done(null, false);
      }
      
      console.log(`User deserialized successfully: ${id}`);
      return done(null, user);
    } catch (error) {
      console.error("Deserialization error:", error);
      return done(error);
    }
  });

  // Test routes
  app.post('/api/test-login', passport.authenticate('local'), (req, res) => {
    console.log('Test login successful');
    res.json({ success: true, user: req.user });
  });

  app.get('/api/test-user', (req, res) => {
    if (req.isAuthenticated()) {
      console.log('User is authenticated');
      res.json({ 
        authenticated: true, 
        user: req.user 
      });
    } else {
      console.log('User is not authenticated');
      res.json({ authenticated: false });
    }
  });

  app.post('/api/test-logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ success: false, error: 'Logout failed' });
      }
      console.log('Test logout successful');
      res.json({ success: true });
    });
  });

  // Create test user if needed
  app.get('/api/create-test-user', async (req, res) => {
    try {
      // Check if test user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, 'test@example.com'),
      });

      if (existingUser) {
        return res.json({ success: true, message: 'Test user already exists', user: existingUser });
      }

      // Create test user
      const passwordHash = await hashPassword('password123');
      
      const [newUser] = await db.insert(users).values({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash,
        role: 'admin',
      }).returning();

      // Create test tenant
      const [tenant] = await db.insert(tenants).values({
        name: 'Test Organization',
        subdomain: 'test-org',
      }).returning();

      // Associate user with tenant using usersToTenants
      await db.execute(sql`
        INSERT INTO users_to_tenants (id, user_id, tenant_id, role, is_default)
        VALUES (${ulid()}, ${newUser.id}, ${tenant.id}, 'admin', true)
      `);

      res.json({ 
        success: true, 
        message: 'Test user created', 
        user: newUser,
        tenant: tenant
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create test user'
      });
    }
  });
}