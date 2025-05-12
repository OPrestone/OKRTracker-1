import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { db } from "./db";
import { User as SelectUser, Tenant, tenants as tenantsTable, usersToTenants } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {
      tenants?: Array<Tenant & { userRole?: string }>;
      defaultTenant?: string;
    }
    interface Request {
      tenantId?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "okr-management-system-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        // Add debugging for authentication issues
        console.log("Attempting login for user:", username);
        
        if (!user) {
          console.log("User not found:", username);
          return done(null, false);
        }
        
        if (!user.password) {
          console.log("User has no password:", username);
          return done(null, false);
        }
        
        const passwordMatches = await comparePasswords(password, user.password);
        if (!passwordMatches) {
          console.log("Password mismatch for user:", username);
          return done(null, false);
        }
        
        console.log("Login successful for user:", username);
        return done(null, user);
      } catch (error) {
        console.error("Error during authentication:", error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log("Deserializing user ID:", id);
      const user = await storage.getUser(id);
      
      if (!user) {
        console.log("User not found during deserialization:", id);
        return done(null, false);
      }
      
      // Enhance user with tenants information
      try {
        // Get user's tenants and roles
        const userTenants = await storage.getUserTenants(id);
        
        // Get default tenant if any
        const defaultTenant = userTenants.find(t => t.isDefault);
        const defaultTenantId = defaultTenant ? defaultTenant.id : userTenants[0]?.id;
        
        // Add tenant information to user object
        const enhancedUser = {
          ...user,
          tenants: userTenants,
          defaultTenant: defaultTenantId
        };
        
        console.log("User deserialized successfully with tenants:", id);
        done(null, enhancedUser);
      } catch (tenantError) {
        console.error("Error loading user tenants, continuing with basic user:", tenantError);
        console.log("User deserialized successfully (without tenants):", id);
        done(null, user);
      }
    } catch (error) {
      console.error("Error deserializing user:", error);
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt for username:", req.body.username);
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Registration failed - username already exists:", req.body.username);
        return res.status(400).send("Username already exists");
      }

      // Ensure we have a name field from firstName and lastName
      const name = `${req.body.firstName || ''} ${req.body.lastName || ''}`.trim() || req.body.username;
      
      // Get a default tenant if one isn't provided
      let tenantId = req.body.tenantId;
      if (!tenantId) {
        // Find or create a default tenant
        try {
          // Try to find an existing tenant
          const existingTenants = await db.select().from(tenantsTable);
          if (existingTenants && existingTenants.length > 0) {
            tenantId = existingTenants[0].id;
            console.log("Using existing tenant for registration:", tenantId);
          } else {
            // Create a default tenant if none exists
            console.log("No tenants found, creating a default tenant");
            const [defaultTenant] = await db.insert(tenantsTable).values({
              name: "Default Organization",
              slug: "default-org",
              plan: "free",
              settings: {},
              enabledFeatures: ["objectives", "key_results", "chat"]
            }).returning();
            tenantId = defaultTenant.id;
            console.log("Created default tenant:", tenantId);
          }
        } catch (err) {
          console.error("Error finding/creating default tenant:", err);
          // Fallback to a static ID only as last resort
          tenantId = "01JTTH6MTJE4DHTH63RV7H21G0"; // Use an existing tenant ID if possible
          console.log("Using fallback tenant ID:", tenantId);
        }
      }

      const userData = {
        ...req.body,
        name,
        password: await hashPassword(req.body.password),
        tenantId: tenantId,
      };
      
      console.log("Creating new user with tenant:", req.body.username, tenantId);
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user.id);
      
      // Create user-tenant relationship if not already created
      try {
        await db.insert(usersToTenants).values({
          userId: user.id,
          tenantId: tenantId,
          role: "member"
        }).onConflictDoNothing();
        console.log("User-tenant relationship created");
      } catch (err) {
        console.error("Error creating user-tenant relationship:", err);
        // Non-critical error, continue with registration
      }

      req.login(user, (err) => {
        if (err) {
          console.error("Error during login after registration:", err);
          return next(err);
        }
        
        console.log("User logged in after registration:", user.id);
        
        // Handle the case where password might not exist in the user object
        const userWithoutPassword = { ...user };
        if (userWithoutPassword && 'password' in userWithoutPassword) {
          delete userWithoutPassword.password;
        }
        
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Error during registration:", error);
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), async (req, res) => {
    console.log("Login successful, returning user data");
    
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      
      // Enhance user object with tenant information on login
      const userId = req.user.id;
      
      // Get user's tenants and roles if they weren't already included
      if (!req.user.tenants) {
        const userTenants = await storage.getUserTenants(userId);
        
        // Get default tenant if any
        const defaultTenant = userTenants.find(t => t.isDefault);
        const defaultTenantId = defaultTenant ? defaultTenant.id : userTenants[0]?.id;
        
        // Add tenant information to user object
        req.user.tenants = userTenants;
        req.user.defaultTenant = defaultTenantId;
      }
      
      // Handle the case where password might exist in the user object
      const userWithoutPassword = { ...req.user };
      if (userWithoutPassword && 'password' in userWithoutPassword) {
        delete userWithoutPassword.password;
      }

      // After login, update last login timestamp
      try {
        await storage.updateLastLogin(userId);
      } catch (error) {
        console.error("Failed to update last login time:", error);
        // Continue despite error - non-critical
      }
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error enhancing user data on login:", error);
      
      if (!req.user) {
        return res.status(401).json({ error: "Authentication failed" });
      }
      
      // Return basic user data without tenant info in case of error
      const basicUserData = { ...req.user };
      if (basicUserData && 'password' in basicUserData) {
        delete basicUserData.password;
      }
      
      res.status(200).json(basicUserData);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      console.log("Unauthorized access to /api/user");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!req.user) {
      console.log("Missing user in request despite authentication");
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    console.log("Returning user data for authenticated user:", req.user.id);
    
    try {
      // If tenants are not already loaded in user object, load them
      if (!req.user.tenants) {
        const userId = req.user.id;
        try {
          const userTenants = await storage.getUserTenants(userId);
          
          // Get default tenant if any
          const defaultTenant = userTenants.find(t => t.isDefault);
          const defaultTenantId = defaultTenant ? defaultTenant.id : userTenants[0]?.id;
          
          // Add tenant information to user object
          req.user.tenants = userTenants;
          req.user.defaultTenant = defaultTenantId;
        } catch (tenantError) {
          console.error("Error loading tenants, continuing with basic user data:", tenantError);
          // Continue with base user info if tenant loading fails
          req.user.tenants = [];
          req.user.defaultTenant = undefined;
        }
      }
      
      // Handle the case where password might exist in the user object
      const userWithoutPassword = { ...req.user };
      if (userWithoutPassword && 'password' in userWithoutPassword) {
        delete userWithoutPassword.password;
      }
      
      res.status(200).json(userWithoutPassword);
    }
    catch (error) {
      console.error("Error loading user data:", error);
      
      // Return user without tenant information in case of error
      const basicUserData = { ...req.user };
      if (basicUserData && 'password' in basicUserData) {
        delete basicUserData.password;
      }
      
      res.status(200).json(basicUserData);
    }
  });
}
