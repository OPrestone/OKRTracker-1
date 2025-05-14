import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { storage } from "./storage";

export function setupLoginRoute(app: any) {
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    console.log("Attempting login for:", req.body.username);
    console.log("Current session ID:", req.sessionID);
    
    passport.authenticate("local", (err: Error | null, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Authentication failed:", info);
        return res.status(401).json({ error: "Authentication failed", message: info?.message || "Invalid credentials" });
      }
      
      // Log user in manually to handle the session
      req.login(user, async (loginErr: Error | null) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return next(loginErr);
        }
        
        console.log("Login successful, session established");
        console.log("Session ID after login:", req.sessionID);
        console.log("User ID in session:", req.user?.id);
        
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
    })(req, res, next);
  });
}