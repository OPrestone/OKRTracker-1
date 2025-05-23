import { Express } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { ulid } from "ulid";

/**
 * Set up test authentication routes for development purposes
 */
export function setupTestAuthRoutes(app: Express) {
  // Create test user route - accessible only in development environment
  app.get("/api/dev/create-test-user", async (req, res) => {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ error: "This route is only available in development mode" });
    }

    try {
      // Create a test user
      const testUserEmail = "test@example.com";
      const testUserPassword = "password123";
      
      // Check if user already exists - try using proper method for user lookup by username or email
      let existingUser;
      try {
        existingUser = await storage.getUserByUsername(testUserEmail);
      } catch (error) {
        console.log("Error looking up user by username, will create new:", error);
        existingUser = null;
      }
      
      let user;
      
      if (existingUser) {
        user = existingUser;
        console.log("Test user already exists:", user.id);
      } else {
        // Create new user
        user = await storage.createUser({
          email: testUserEmail,
          username: testUserEmail,
          name: "Test User",
          password: await hashPassword(testUserPassword),
          status: "active",
          role: "admin",
          avatar_url: null,
          preferences: {},
          verification_token: null,
          reset_token: null,
          email_verified: true
        });
        console.log("Created test user:", user.id);
      }
      
      // Get user's tenants
      const userTenants = await storage.getUserTenants(user.id);
      
      let testTenant;
      
      if (userTenants.length > 0) {
        testTenant = userTenants[0];
        console.log("User already has tenant:", testTenant.id);
      } else {
        // Create test tenant
        const tenantId = ulid();
        const tenantName = "Test Organization";
        
        // Insert tenant directly with SQL to avoid type issues
        const { rows: [tenant] } = await db.execute(
          sql`INSERT INTO tenants (id, name, display_name, description, industry, slug, plan, status, max_users, domain, logo_url, settings, enabled_features)
              VALUES (
                ${tenantId},
                ${tenantName}, 
                ${tenantName}, 
                ${"Test tenant for development"},
                ${"Technology"},
                ${"test-org"}, 
                ${"free"}, 
                ${"active"}, 
                ${10}, 
                ${null},
                ${null},
                ${JSON.stringify({})},
                ${JSON.stringify([])}
              )
              RETURNING *`
        );
        
        testTenant = tenant;
        
        // Associate user with tenant
        const userToTenantId = ulid();
        await db.execute(
          sql`INSERT INTO users_to_tenants (id, user_id, tenant_id, role, is_default)
              VALUES (${userToTenantId}, ${user.id}, ${tenant.id}, ${"admin"}, TRUE)`
        );
        
        console.log("Created test tenant for user:", testTenant.id);
      }
      
      // Return information
      res.json({
        success: true,
        message: "Test user and tenant created/verified successfully",
        user: {
          id: user.id,
          email: testUserEmail,
          password: testUserPassword,
        },
        tenant: {
          id: testTenant.id,
          name: testTenant.name
        },
        loginUrl: "/test-login"
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ 
        error: "Failed to create test user",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}