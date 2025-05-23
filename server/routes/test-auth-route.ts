import { Request, Response, Router } from "express";
import { db } from "../db";
import { users, tenants, usersToTenants } from "@shared/schema";
import { sql } from "drizzle-orm";

// Creates a standalone test authentication router
export function createTestAuthRouter(): Router {
  const router = Router();
  
  // Simple endpoint that returns a list of existing users to login with
  router.get("/api/test-auth/get-users", async (req: Request, res: Response) => {
    try {
      const userResults = await db.select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      }).from(users).limit(5);
      
      res.json({
        success: true,
        message: "Available users for login",
        users: userResults,
        loginInstructions: "You can log in with any of these users with password 'password123' at /test-login"
      });
      
    } catch (error) {
      console.error("Error fetching test users:", error);
      res.status(500).json({
        error: "Failed to fetch test users",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Simple endpoint for testing authentication
  router.get("/api/test-auth/status", (req: Request, res: Response) => {
    const isAuthenticated = req.isAuthenticated();
    
    if (isAuthenticated) {
      res.json({
        authenticated: true,
        user: req.user,
        tenantId: req.tenantId || (req.user as any)?.defaultTenant
      });
    } else {
      res.json({
        authenticated: false,
        message: "User is not authenticated"
      });
    }
  });
  
  return router;
}