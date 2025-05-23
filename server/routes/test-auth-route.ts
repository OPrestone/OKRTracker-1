import { Request, Response, Router } from "express";
import { db } from "../db";
import { users, tenants, usersToTenants } from "@shared/schema";
import { hashPassword } from "../auth";
import { sql } from "drizzle-orm";
import { ulid } from "ulid";

// Creates a standalone test authentication router
export function createTestAuthRouter(): Router {
  const router = Router();
  
  router.get("/api/test-auth/create-demo-user", async (req: Request, res: Response) => {
    try {
      // Demo user credentials
      const email = "demo@example.com";
      const password = "password123"; 
      const hashedPassword = await hashPassword(password);
      
      // Check if user already exists by email
      const existingUsers = await db.select().from(users).where(sql`email = ${email}`);
      
      let user;
      
      if (existingUsers.length > 0) {
        // User already exists
        user = existingUsers[0];
        console.log("Demo user already exists:", user.id);
      } else {
        // Create new user
        const userId = ulid();
        // Create the user with all required fields based on DB schema
        const currentDate = new Date();
        // Create user with direct SQL and proper response handling
        await db.execute(
          sql`INSERT INTO users (
            id, username, email, first_name, last_name, name, password, 
            role, created_at, updated_at, is_admin, is_enabled, 
            language, timezone
          ) VALUES (
            ${userId}, 
            ${email.split('@')[0]}, 
            ${email}, 
            ${"Demo"}, 
            ${"User"}, 
            ${"Demo User"}, 
            ${hashedPassword}, 
            ${"admin"}, 
            ${currentDate}, 
            ${currentDate}, 
            ${true}, 
            ${true}, 
            ${"en"}, 
            ${"UTC"}
          )`
        );
        
        // Query the user we just created
        const userResult = await db.select().from(users).where(sql`id = ${userId}`);
        user = userResult[0];
        console.log("Created demo user:", user.id);
      }
      
      // Check if user has a tenant
      const userTenantConnections = await db
        .select()
        .from(usersToTenants)
        .where(sql`user_id = ${user.id}`);
      
      let tenant;
      
      if (userTenantConnections.length > 0) {
        // Get first tenant
        const tenantId = userTenantConnections[0].tenant_id;
        const tenantResults = await db.select().from(tenants).where(sql`id = ${tenantId}`);
        tenant = tenantResults[0];
        console.log("User already has tenant:", tenant.id);
      } else {
        // Create a new tenant
        const tenantId = ulid();
        const tenantName = "Demo Organization";
        
        // Create tenant with direct SQL to ensure all required fields
        const currentDate = new Date();
        await db.execute(
          sql`INSERT INTO tenants (
            id, name, display_name, description, industry, 
            slug, plan, status, max_users, domain, 
            logo_url, settings, enabled_features, created_at
          ) VALUES (
            ${tenantId},
            ${tenantName}, 
            ${tenantName}, 
            ${"Demo organization for testing"},
            ${"Technology"},
            ${"demo-org"}, 
            ${"free"}, 
            ${"active"}, 
            ${10}, 
            ${null},
            ${null},
            ${JSON.stringify({})},
            ${JSON.stringify([])},
            ${currentDate}
          )`
        );
        
        // Get the tenant we just created
        const tenantResult = await db.select().from(tenants).where(sql`id = ${tenantId}`);
        tenant = tenantResult[0];
        
        // Link user to tenant
        const userToTenantId = ulid();
        // Check column names in the schema
        await db.execute(
          sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users_to_tenants'`
        ).then(async (result) => {
          console.log("users_to_tenants columns:", result.rows.map(row => row.column_name));
          
          // Use schema field names (user_id or userId, tenant_id or tenantId)
          await db.execute(
            sql`INSERT INTO users_to_tenants (
              id, user_id, tenant_id, role, is_default, created_at
            ) VALUES (
              ${userToTenantId}, 
              ${user.id}, 
              ${tenant.id}, 
              ${"admin"}, 
              ${true}, 
              ${currentDate}
            )`
          );
        });
        
        console.log("Created demo tenant:", tenant.id);
      }
      
      // Return success with demo user info
      res.json({
        success: true,
        message: "Demo user is ready to use",
        user: {
          id: user.id,
          email,
          password // Plain text password for login
        },
        tenant: {
          id: tenant.id,
          name: tenant.name || "Demo Organization" // Fallback if name is not available
        },
        loginInstructions: "Use these credentials on the test login page at /test-login"
      });
      
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({
        error: "Failed to create demo user",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return router;
}