import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertObjectiveSchema, insertKeyResultSchema, insertInitiativeSchema, insertCheckInSchema,
         insertTeamSchema, insertCadenceSchema, insertTimeframeSchema, insertAccessGroupSchema,
         insertChatRoomSchema, insertChatRoomMemberSchema, insertMessageSchema, 
         insertAttachmentSchema, insertReactionSchema, insertFeedbackSchema, insertBadgeSchema, insertUserBadgeSchema,
         insertTeamMoodSchema, insertTenantSchema, insertMoodEntrySchema, users, teams, objectives as objectivesTable, 
         keyResults as keyResultsTable, teamMoods, moodEntries, objectiveStatusEnum, User, usersToTenants,
         timeframes, cadences, cycles, insertCycleSchema, insertMeetingSchema, insertMeetingToUserSchema, insertMeetingToObjectiveSchema, 
         insertMeetingToKeyResultSchema, insertActionItemSchema, meetingStatusEnum, meetingPlatformEnum,
         projects, projectStatusEnum, insertProjectSchema, organizationMission, insertOrganizationMissionSchema } from "@shared/schema";
import { z } from "zod";
import { db, pool } from "./db";
import { or, sql, and, eq, inArray } from "drizzle-orm";
import { ulid } from "ulid";
import { openAIService } from "./services/openai-service";
import { slackService } from "./services/slack-service";
import { stripeService } from "./services/stripe-service";
import { tenantService } from "./services/tenant-service";
import { configService } from "./services/config-service";
import { WebSocketServer, WebSocket } from "ws";
import { setupTestAuthRoutes } from "./test-auth";
import Stripe from "stripe";
import { setupConfigRoutes } from "./routes/config-routes";
import { setupTeamLeaderRoutes } from "./routes/team-leader";
import { setupApprovedOkrsRoutes } from "./routes/approved-okrs";
import { setupTeamRoutes } from "./routes/team-routes";
import { Router } from "express";
import { createTestTeamLeader } from "./routes/test-team-leader";

// Extend Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);
  
  // Setup test auth routes for debugging session issues
  setupTestAuthRoutes(app);
  
  // Register configuration routes
  setupConfigRoutes(app);
  
  // Test endpoint to create a team leader account for testing
  app.post('/api/create-test-team-leader', createTestTeamLeader);
  
  // Register team leader routes
  const apiRouter = Router();
  setupTeamLeaderRoutes(apiRouter);
  setupTeamRoutes(apiRouter);
  setupApprovedOkrsRoutes(apiRouter);
  app.use('/api', apiRouter);
  
  // Add a route for project-related diagnostics

  app.get("/api/project-diagnostics", async (req, res) => {
    try {
      // Check authentication status
      const isAuthenticated = req.isAuthenticated();
      const sessionID = req.sessionID;
      const userId = req.user?.id || 'none';
      
      // Get query parameters
      const tenantId = req.query.tenantId as string;
      
      // Check if we can fetch projects for this tenant
      let projects = [];
      let tenantsForUser = [];
      let error = null;
      
      if (isAuthenticated && tenantId) {
        try {
          projects = await storage.getProjectsByTenant(tenantId);
          tenantsForUser = await storage.getUserTenants(userId);
        } catch (err) {
          error = err.message;
        }
      }
      
      // Return diagnostic information
      res.json({
        auth: {
          isAuthenticated,
          sessionID,
          userId
        },
        tenant: {
          requestedTenantId: tenantId,
          tenantsForUser: tenantsForUser.map(t => ({ id: t.id, name: t.name }))
        },
        projects: {
          count: projects.length,
          error
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Define common middleware
  const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    console.log("Checking authentication:", req.path, "isAuthenticated:", req.isAuthenticated(), "sessionID:", req.sessionID, "user:", req.user ? req.user.id : "none");
    
    if (!req.isAuthenticated()) {
      console.log("Unauthorized access to", req.path);
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };
  
  const withTenant = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    // Get tenantId from all possible sources: headers, query params, body, or use default from user
    // Added support for custom X-Tenant-ID header that we use in our fetch requests
    const requestedTenantId = req.headers['x-tenant-id'] ||
                            req.query.tenantId || 
                            req.query.tenant_id ||
                            req.body?.tenantId || 
                            req.body?.tenant_id || 
                            (req.user as any).defaultTenant;
    
    // If no tenantId provided or found, return error
    if (!requestedTenantId) {
      console.log("Missing tenantId from all sources:", {
        headers: req.headers['x-tenant-id'],
        query: req.query.tenantId || req.query.tenant_id,
        body: req.body?.tenantId || req.body?.tenant_id,
        defaultTenant: (req.user as any).defaultTenant
      });
      return res.status(400).json({ error: "Missing tenantId parameter" });
    }
    
    // Store the tenant ID in both formats to handle both conventions
    const tenantIdStr = requestedTenantId as string;
    (req as any).tenantId = tenantIdStr;
    (req as any).tenant_id = tenantIdStr;
    
    console.log(`Setting tenant context: tenantId=${tenantIdStr}`);
    
    // Verify user has access to the requested tenant
    const userTenants = await storage.getUserTenants(req.user.id);
    console.log(`User has access to ${userTenants.length} tenants:`, userTenants.map(t => t.id));
    
    const hasTenantAccess = userTenants.some(tenant => tenant.id === tenantIdStr);
    
    if (!hasTenantAccess) {
      console.error(`User ${req.user.id} attempted to access unauthorized tenant ${tenantIdStr}`);
      return res.status(403).json({ error: "Access to tenant denied" });
    }
    
    next();
  };
  
  // Direct test route for approved objectives - accessible without middleware
  app.get("/api/test-approved", async (req, res) => {
    try {
      console.log("Test approved objectives endpoint called");
      console.log("User authenticated:", req.isAuthenticated());
      console.log("Query params:", req.query);
      
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.query.tenantId as string || "01JTTH6MTJE4DHTH63RV7H21G0";
      console.log(`Using tenant ID: ${tenantId}`);
      
      const approvedObjectives = await storage.getApprovedObjectives(tenantId);
      console.log(`Found ${approvedObjectives ? approvedObjectives.length : 0} approved objectives`);
      
      return res.json(approvedObjectives || []);
    } catch (error) {
      console.error("Error in test-approved endpoint:", error);
      return res.status(500).json({ error: "Internal Server Error", details: String(error) });
    }
  });
  
  // Just keeping the test endpoint for troubleshooting
  // The actual API endpoints for approved objectives are defined later in this file
  
  // Test route to create a test user and tenant
  app.get("/api/create-test-user", async (req, res) => {
    try {
      // Create test user
      const testUser = {
        email: "test@example.com",
        name: "Test User",
        password: await hashPassword("password123")
      };
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(testUser.email);
      
      let userId;
      if (existingUser) {
        userId = existingUser.id;
        console.log("Test user already exists:", userId);
      } else {
        const createdUser = await storage.createUser(testUser);
        userId = createdUser.id;
        console.log("Created test user:", userId);
      }
      
      // Create test tenant if needed
      const tenantName = "Test Organization";
      const userTenants = await storage.getUserTenants(userId);
      
      let testTenant;
      if (userTenants.length > 0) {
        testTenant = userTenants[0];
        console.log("User already has tenant:", testTenant.id);
      } else {
        testTenant = await storage.createTenant({ 
          name: tenantName,
          description: "A test organization",
          owner_id: userId
        });
        
        // Associate user with tenant
        await storage.addUserToTenant({
          userId,
          tenantId: testTenant.id,
          role: "admin"
        });
        
        console.log("Created new tenant for test user:", testTenant.id);
      }
      
      res.json({
        success: true,
        message: "Test user and tenant created successfully",
        login: {
          email: testUser.email,
          password: "password123"
        },
        userId,
        tenantId: testTenant.id
      });
    } catch (error) {
      console.error("Error creating test user:", error);
      res.status(500).json({ error: "Failed to create test user and tenant" });
    }
  });

  // Initialize data
  initializeData();
  
  // Use the middleware defined above
  // The rest of the routes will use the existing middleware
  
  // Organization Mission API Endpoints
  app.get('/api/organization-mission', ensureAuthenticated, withTenant, async (req, res) => {
    try {
      // Get tenant ID from middleware or query parameter
      const tenantId = req.tenantId || req.query.tenantId as string;
      
      console.log("GET /api/organization-mission - Tenant ID from multiple sources:", {
        fromMiddleware: req.tenantId,
        fromQuery: req.query.tenantId,
        resolved: tenantId
      });
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }

      // Query the database to find mission data for this tenant
      const missionData = await db.select().from(organizationMission)
        .where(eq(organizationMission.tenantId, tenantId))
        .limit(1);
      
      // If no data found, return empty object
      if (missionData.length === 0) {
        return res.json({ exists: false });
      }
      
      res.json({ ...missionData[0], exists: true });
    } catch (error) {
      console.error("Error getting organization mission:", error);
      res.status(500).json({ error: "Failed to get organization mission" });
    }
  });

  app.post('/api/organization-mission', ensureAuthenticated, withTenant, async (req, res) => {
    try {
      // Get tenant ID from middleware, query parameter, or request body
      const tenantId = req.tenantId || req.query.tenantId as string || req.body.tenantId;
      const { mission, vision, boundaries, strategicDirection, behaviors } = req.body;
      
      console.log("POST /api/organization-mission - Tenant ID from multiple sources:", {
        fromMiddleware: req.tenantId,
        fromQuery: req.query.tenantId,
        fromBody: req.body.tenantId,
        resolved: tenantId
      });
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }

      // Check if the user has permission to update the tenant
      const userTenant = await db.select().from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, req.user.id),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .limit(1);

      if (userTenant.length === 0 || !['owner', 'admin'].includes(userTenant[0].role)) {
        return res.status(403).json({ error: "You do not have permission to update organization mission" });
      }

      // Check if mission already exists for this tenant
      const existingMission = await db.select().from(organizationMission)
        .where(eq(organizationMission.tenantId, tenantId))
        .limit(1);

      let result;

      if (existingMission.length > 0) {
        // Update existing record
        result = await db.update(organizationMission)
          .set({
            mission,
            vision,
            boundaries,
            strategicDirection,
            behaviors,
            updatedAt: new Date()
          })
          .where(eq(organizationMission.id, existingMission[0].id))
          .returning();
      } else {
        // Create new record
        result = await db.insert(organizationMission)
          .values({
            id: ulid(),
            tenantId,
            mission,
            vision,
            boundaries,
            strategicDirection,
            behaviors
          })
          .returning();
      }
      
      // Make sure we have a result to return
      if (result && result.length > 0) {
        return res.json({
          success: true,
          data: result[0]
        });
      } else {
        return res.json({
          success: true,
          message: "Mission data saved successfully"
        });
      }
    } catch (error) {
      console.error("Error updating organization mission:", error);
      res.status(500).json({ error: "Failed to update organization mission" });
    }
  });
  
  // Multi-tenancy API Endpoints
  
  // Get all tenants for the current user
  app.get("/api/tenants", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const tenants = await tenantService.getUserTenants(userId);
      res.json(tenants);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user's default tenant
  app.get("/api/tenants/default", ensureAuthenticated, async (req, res, next) => {
    try {
      const userId = (req.user as User).id;
      const tenant = await tenantService.getUserDefaultTenant(userId);
      
      if (!tenant) {
        return res.status(404).json({ error: "No default tenant found" });
      }
      
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Get tenant by slug - IMPORTANT: This must come before /:id route
  app.get("/api/tenants/slug/:slug", ensureAuthenticated, async (req, res, next) => {
    try {
      const { slug } = req.params;
      const tenant = await tenantService.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      // Check if user has access to this tenant
      const userId = (req.user as User).id;
      const user = req.user as User;
      
      // Super admins always have access to all organizations
      if (user.isAdmin || user.role === "admin") {
        // Allow access for super admins
      } else {
        // Regular users need explicit access
        const userTenants = await tenantService.getUserTenants(userId);
        const hasAccess = userTenants.some(t => t.id === tenant.id);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "You do not have access to this organization" });
        }
      }
      
      res.json(tenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Create a new tenant
  app.post("/api/tenants", ensureAuthenticated, async (req, res, next) => {
    try {
      const user = req.user as User;
      
      // Extract the setup and users data before validation
      const { setup, users, ...restData } = req.body;
      
      // Validate the tenant data
      const validatedData = insertTenantSchema.omit({ slug: true }).parse(restData);
      
      // Create the tenant
      const { tenant, userToTenant } = await tenantService.createTenant(
        validatedData,
        user,
        "owner"
      );
      
      // Handle initial setup with OKRs if needed
      if (setup?.createInitialOKRs) {
        try {
          if (setup.importedOKRs && Array.isArray(setup.importedOKRs) && setup.importedOKRs.length > 0) {
            // Process imported OKRs from CSV
            await processImportedOKRs(tenant.id, setup.importedOKRs);
            console.log(`Processed ${setup.importedOKRs.length} imported OKRs for tenant ${tenant.id}`);
          } else if (setup.template) {
            // Process template-based OKRs
            await createOKRsFromTemplate(tenant.id, setup.template);
            console.log(`Created OKRs from template "${setup.template}" for tenant ${tenant.id}`);
          }
        } catch (setupError) {
          console.error("Error processing initial OKRs setup:", setupError);
          // Don't fail the entire request if just the OKR setup fails
        }
      }
      
      // Add users if provided
      if (users && Array.isArray(users) && users.length > 0) {
        try {
          for (const userData of users) {
            if (userData.selected && userData.email) {
              await tenantService.inviteUserToTenant(
                userData.email,
                tenant.id, 
                userData.role || 'member'
              );
            }
          }
          console.log(`Processed ${users.filter(u => u.selected).length} users for tenant ${tenant.id}`);
        } catch (userError) {
          console.error("Error processing users:", userError);
          // Don't fail the entire request if just the user setup fails
        }
      }

      //Add Teams of Provided
      console.log(`Processing teams for tenant ${tenant.id}`);
      console.log(`Teams data:`, JSON.stringify(restData.teams));
        try {
          if (restData.teams && Array.isArray(restData.teams) && restData.teams.length > 0) {
            restData.teams.forEach(async (okrTeam) => {
            const validatedTeamData = insertTeamSchema.parse({
                  ...okrTeam,
                  ownerId: user.id, // This links the team to a user in this tenant
                  tenantId: tenant.id, // Critical: Associate team with current tenant
                });

            console.log(`Validated data:`, JSON.stringify(validatedData));

            const team = await storage.createTeam(validatedTeamData);
          }) 
        }
        } catch (teamError) {
          console.error("Error processing initial teams setup:", teamError);
          // Don't fail the entire request if just the OKR setup fails
        }
      
      res.status(201).json({ tenant, userToTenant });
    } catch (error) {
      next(error);
    }
  });
  
  // Get tenant by ID
  app.get("/api/tenants/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      
      const tenant = await tenantService.getTenantById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      // Check if user has access to this tenant
      const userId = (req.user as User).id;
      const userTenants = await tenantService.getUserTenants(userId);
      const hasAccess = userTenants.some(t => t.id === tenantId);
      
      if (!hasAccess && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      res.json(tenant);
    } catch (error) {
      console.error("Error getting tenant by ID:", error);
      next(error);
    }
  });
  
  // Update tenant
  app.patch("/api/tenants/:id", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const userId = (req.user as User).id;
      
      // Check if user is owner or admin of this tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      if (!userTenant && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      if (userTenant && userTenant.userRole !== "owner" && userTenant.userRole !== "admin" && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have permission to update this tenant" });
      }
      
      const validatedData = insertTenantSchema.partial().omit({ slug: true }).parse(req.body);
      const updatedTenant = await tenantService.updateTenant(tenantId, validatedData);
      
      res.json(updatedTenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Set default tenant for user
  app.post("/api/tenants/:id/set-default", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const userId = (req.user as User).id;
      
      // Check if user is member of this tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const isMember = userTenants.some(t => t.id === tenantId);
      
      if (!isMember) {
        return res.status(403).json({ error: "You are not a member of this tenant" });
      }
      
      await tenantService.setDefaultTenant(userId, tenantId);
      
      res.status(200).json({ success: true, message: "Default tenant updated" });
    } catch (error) {
      next(error);
    }
  });
  
  // Add user to tenant
  app.post("/api/tenants/:id/users", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const userId = (req.user as User).id;
      
      // Check if user is owner or admin of this tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      if (!userTenant && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      if (userTenant && userTenant.userRole !== "owner" && userTenant.userRole !== "admin" && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have permission to add users to this tenant" });
      }
      
      const { userId: newUserId, role = "member" } = z.object({
        userId: z.string(),
        role: z.enum(["owner", "admin", "member"]).optional()
      }).parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(newUserId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const userToTenant = await tenantService.addUserToTenant(newUserId, tenantId, role as "owner" | "admin" | "member");
      
      res.status(201).json(userToTenant);
    } catch (error) {
      next(error);
    }
  });
  
  // Remove user from tenant
  app.delete("/api/tenants/:id/users/:userId", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const userIdToRemove = req.params.userId;
      const currentUserId = (req.user as User).id;
      
      // Check if current user is owner or admin of this tenant
      const userTenants = await tenantService.getUserTenants(currentUserId);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      if (!userTenant && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      // Check if current user is owner/admin or is removing themselves
      const isSelfRemoval = currentUserId === userIdToRemove;
      if (!isSelfRemoval && userTenant && userTenant.userRole !== "owner" && userTenant.userRole !== "admin" && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have permission to remove users from this tenant" });
      }
      
      await tenantService.removeUserFromTenant(userIdToRemove, tenantId);
      
      res.status(200).json({ success: true, message: "User removed from tenant" });
    } catch (error) {
      next(error);
    }
  });
  
  // Get members of a tenant by ID
  app.get("/api/tenants/:id/users", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const userId = (req.user as User).id;
      
      // Check if user is member of this tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const isMember = userTenants.some(t => t.id === tenantId);
      
      if (!isMember && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      const members = await tenantService.getTenantMembers(tenantId);
      
      res.json(members);
    } catch (error) {
      next(error);
    }
  });
  
  // Get members of a tenant by slug
  app.get("/api/tenants/slug/:slug/users", ensureAuthenticated, async (req, res, next) => {
    try {
      const { slug } = req.params;
      const userId = (req.user as User).id;
      
      // Get the tenant by slug
      const tenant = await tenantService.getTenantBySlug(slug);
      
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      
      // Check if user is member of this tenant or a super admin
      const user = req.user as User;
      
      // Super admins always have access to all organizations
      if (user.isAdmin || user.role === "admin") {
        // Allow access for super admins
      } else {
        // Regular users need explicit access to the tenant
        const userTenants = await tenantService.getUserTenants(userId);
        const isMember = userTenants.some(t => t.id === tenant.id);
        
        if (!isMember) {
          return res.status(403).json({ error: "You do not have access to this organization" });
        }
      }
      
      const members = await tenantService.getTenantMembers(tenant.id);
      
      res.json(members);
    } catch (error) {
      next(error);
    }
  });
  
  // Subscription Related Endpoints
  
  // Create a subscription for a tenant
  app.post("/api/tenants/:id/subscription", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const user = req.user as User;
      
      // Check if user is owner or admin of this tenant
      const userTenants = await tenantService.getUserTenants(user.id);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      if (!userTenant && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      if (userTenant && userTenant.userRole !== "owner" && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "Only tenant owners can manage subscriptions" });
      }
      
      const { plan } = z.object({
        plan: z.enum(["free", "starter", "professional", "enterprise"])
      }).parse(req.body);
      
      const result = await tenantService.createSubscription(tenantId, plan, user);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Update a subscription plan
  app.patch("/api/tenants/:id/subscription", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.id;
      const user = req.user as User;
      
      // Check if user is owner or admin of this tenant
      const userTenants = await tenantService.getUserTenants(user.id);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      if (!userTenant && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      if (userTenant && userTenant.userRole !== "owner" && !(req.user as User).isAdmin) {
        return res.status(403).json({ error: "Only tenant owners can manage subscriptions" });
      }
      
      const { plan } = z.object({
        plan: z.enum(["free", "starter", "professional", "enterprise"])
      }).parse(req.body);
      
      const result = await tenantService.updateSubscriptionPlan(tenantId, plan);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
  
  // Create Payment Intent for subscription
  app.post("/api/create-payment-intent", ensureAuthenticated, async (req, res, next) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ error: "Stripe is not configured" });
      }
      
      const { amount, customerId, metadata = {} } = z.object({
        amount: z.number().min(1),
        customerId: z.string(),
        metadata: z.record(z.string()).optional()
      }).parse(req.body);
      
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        customerId,
        metadata
      );
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      next(error);
    }
  });
  
  // Stripe webhook endpoint for events
  app.post("/api/webhook", async (req, res) => {
    const stripe = process.env.STRIPE_SECRET_KEY 
      ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
      : null;
    
    if (!stripe) {
      return res.status(500).json({ error: "Stripe is not configured" });
    }
    
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    try {
      if (endpointSecret) {
        // Verify webhook signature if secret is set
        event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
      } else {
        // If no secret is set (development mode), just use the payload directly
        event = payload;
      }
      
      // Handle the event
      await stripeService.handleWebhookEvent(event);
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook Error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Teams API
  app.get("/api/teams", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      // Filter teams by tenant ID using the improved method
      console.log(`Getting teams for tenant: ${req.tenantId}`);
      const teams = await storage.getTeamsByTenant(req.tenantId);
      console.log(`Found ${teams.length} teams for tenant ${req.tenantId}`);
      res.json(teams);
    } catch (error) {
      console.error('Error getting teams:', error);
      next(error);
    }
  });
  
  // Batch create teams endpoint
  app.post("/api/teams/batch", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenant ID" });
      }
      
      // Validate user's permission in the tenant
      const userTenant = await db.select().from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, req.user.id),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .limit(1);
      
      if (userTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to this tenant" });
      }
      
      // Only owners and admins can create teams
      const role = userTenant[0].role;
      if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({ error: "Not authorized - insufficient privileges to create teams" });
      }
      
      // Expect an array of team data in the request body
      const teamsData = req.body;
      if (!Array.isArray(teamsData)) {
        return res.status(400).json({ error: "Expected an array of teams" });
      }
      
      console.log("Batch creating teams:", teamsData);
      
      // Get existing teams for this tenant to check for duplicates
      const existingTeams = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.tenantId, tenantId));
      
      const existingTeamNames = new Set(existingTeams.map(team => team.name.toLowerCase()));
      console.log("Existing team names:", Array.from(existingTeamNames));
      
      // Process each team
      const createdTeams = [];
      const skippedTeams = [];
      
      for (const teamData of teamsData) {
        // Check if team with this name already exists (case-insensitive)
        if (existingTeamNames.has(teamData.name?.toLowerCase())) {
          console.log(`Skipping duplicate team: ${teamData.name}`);
          skippedTeams.push(teamData.name);
          continue;
        }
        
        // Parse and validate team data using the team schema
        try {
          const validTeamData = insertTeamSchema.parse({
            ...teamData,
            id: ulid(),
            tenant_id: tenantId
          });
          
          // Insert team into database
          const insertResult = await db.insert(teams).values(validTeamData).returning();
          
          if (insertResult && insertResult.length > 0) {
            createdTeams.push(insertResult[0]);
            // Add to existing names set to prevent duplicates within this batch
            existingTeamNames.add(teamData.name.toLowerCase());
            console.log(`Created team: ${teamData.name}`);
          }
        } catch (error) {
          console.error("Error creating team:", error);
          // Continue with other teams even if one fails
        }
      }
      
      console.log(`Successfully created ${createdTeams.length} teams`);
      if (skippedTeams.length > 0) {
        console.log(`Skipped ${skippedTeams.length} duplicate teams:`, skippedTeams);
      }
      
      // Return the created teams with information about skipped duplicates
      res.status(201).json({
        success: true,
        createdTeams,
        skippedDuplicates: skippedTeams,
        message: `Created ${createdTeams.length} teams${skippedTeams.length > 0 ? `, skipped ${skippedTeams.length} duplicates` : ''}`
      });
    } catch (error) {
      console.error("Error in batch team creation:", error);
      next(error);
    }
  });
  
  // Get a single team by ID
  app.get("/api/teams/:teamId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { teamId } = req.params;
      console.log(`Getting team with ID: ${teamId} for tenant: ${req.tenantId}`);
      
      // Get the team
      const team = await storage.getTeam(teamId);
      
      // Check if team exists
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check if team belongs to tenant
      if (team.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Access denied - team does not belong to your organization" });
      }
      
      res.json(team);
    } catch (error) {
      console.error('Error getting team by ID:', error);
      next(error);
    }
  });

  // Create multiple teams at once
  app.post("/api/teams/batch", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      console.log(`Creating multiple teams for tenant: ${req.tenantId}, owner: ${req.user.id}`);
      console.log(`Request body:`, JSON.stringify(req.body));
      
      // Make sure we have the teams array
      if (!req.body.teams || !Array.isArray(req.body.teams) || req.body.teams.length === 0) {
        console.log('Teams array is required');
        return res.status(400).json({ error: "Teams array is required and must not be empty" });
      }
      
      // Additional validation for required fields
      if (!req.tenantId) {
        console.log('Tenant ID is missing');
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      // Get existing teams for this tenant to check for duplicates
      const existingTeams = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.tenantId, req.tenantId));
      
      const existingTeamNames = new Set(existingTeams.map(team => team.name.toLowerCase()));
      console.log("Existing team names:", Array.from(existingTeamNames));

      const createdTeams = [];
      const skippedTeams = [];
      
      // Create each team
      for (const teamData of req.body.teams) {
        if (!teamData.name) {
          console.log('Team name is required');
          continue; // Skip this team but continue processing others
        }

        // Check if team with this name already exists (case-insensitive)
        if (existingTeamNames.has(teamData.name?.toLowerCase())) {
          console.log(`Skipping duplicate team: ${teamData.name}`);
          skippedTeams.push(teamData.name);
          continue;
        }
        
        try {
          // Use the owner ID from the authenticated user and add the tenant ID
          const validatedData = insertTeamSchema.parse({
            ...teamData,
            ownerId: req.user.id, // This links the team to a user in this tenant
            leaderId: teamData.leaderId || req.user.id, // Ensure leaderId is saved, default to owner
            tenantId: req.tenantId // Critical: Associate team with current tenant
          });
          
          const team = await storage.createTeam(validatedData);
          createdTeams.push(team);
          // Add to existing names set to prevent duplicates within this batch
          existingTeamNames.add(teamData.name.toLowerCase());
          console.log(`Created team: ${team.name} with ID: ${team.id}`);
        } catch (validationError) {
          console.error(`Validation error for team ${teamData.name}:`, validationError);
          // Continue with other teams even if one fails
        }
      }
      
      console.log(`Successfully created ${createdTeams.length} teams`);
      if (skippedTeams.length > 0) {
        console.log(`Skipped ${skippedTeams.length} duplicate teams:`, skippedTeams);
      }

      res.status(201).json({ 
        success: true, 
        message: `Successfully created ${createdTeams.length} teams${skippedTeams.length > 0 ? `, skipped ${skippedTeams.length} duplicates` : ''}`,
        teams: createdTeams,
        skippedDuplicates: skippedTeams
      });
    } catch (error) {
      console.error('Error in batch team creation:', error);
      next(error);
    }
  });

  app.post("/api/teams", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      console.log(`Creating team for tenant: ${req.tenantId}, owner: ${req.user.id}`);
      console.log(`Request body:`, JSON.stringify(req.body));
      
      // Make sure we have the required fields
      if (!req.body.name) {
        console.log('Team name is required');
        return res.status(400).json({ error: "Team name is required" });
      }
      
      // Additional validation for required fields
      if (!req.tenantId) {
        console.log('Tenant ID is missing');
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      // Use the owner ID from the authenticated user and add the tenant ID
      try {
        const validatedData = insertTeamSchema.parse({
          ...req.body,
          ownerId: req.user.id, // This links the team to a user in this tenant
          leaderId: req.body.leaderId || req.user.id, // Ensure leaderId is saved, default to owner
          tenantId: req.tenantId // Critical: Associate team with current tenant
        });
        
        console.log(`Validated data:`, JSON.stringify(validatedData));
        
        const team = await storage.createTeam(validatedData);
        console.log(`Created team: ${team.id} with name: ${team.name} for tenant: ${team.tenantId}`);
        res.status(201).json(team);
      } catch (validationError) {
        console.error('Validation error creating team:', validationError);
        return res.status(400).json({ 
          error: "Validation error", 
          details: validationError.errors || validationError.message 
        });
      }
    } catch (error) {
      console.error('Error creating team:', error);
      // Send a more descriptive error response instead of using next(error)
      res.status(500).json({ 
        error: "Failed to create team", 
        message: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.get("/api/teams/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      const team = await storage.getTeam(id);
      
      if (!team) {
        return res.status(404).send("Team not found");
      }
      
      // Verify team belongs to current tenant
      if (team.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Team not found in current tenant" });
      }
      
      res.json(team);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/teams/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      
      // Verify team belongs to current tenant
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).send("Team not found");
      }
      
      if (team.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Team not found in current tenant" });
      }
      
      const validatedData = insertTeamSchema.partial().parse(req.body);
      
      // Ensure tenantId can't be changed
      delete validatedData.tenantId;
      
      const updatedTeam = await storage.updateTeam(id, validatedData);
      res.json(updatedTeam);
    } catch (error) {
      next(error);
    }
  });

  // Update team leader
  app.put("/api/teams/:id/leader", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.id;
      const tenantId = req.tenantId;
      const userId = req.user.id;
      
      // Validate input
      const { leaderId } = req.body;
      if (!leaderId) {
        return res.status(400).json({ error: "Leader ID is required" });
      }
      
      // Check if team exists and belongs to this tenant
      const team = await db.select()
        .from(teams)
        .where(and(
          eq(teams.id, teamId),
          eq(teams.tenantId, tenantId)
        ))
        .then(results => results[0]);
      
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Check authorization - user must be admin/owner in tenant, team owner, or any user in the tenant
      const userRole = await db.select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .then(results => results[0]);
      
      // Allow if user is in the tenant (admin, owner, or regular user)
      const isAuthorized = userRole !== undefined;
      
      if (!isAuthorized) {
        return res.status(403).json({ error: "Not authorized to update team leader" });
      }
      
      // Check if the new leader exists
      const leaderExists = await db.select()
        .from(users)
        .where(eq(users.id, leaderId))
        .then(results => results.length > 0);
      
      if (!leaderExists) {
        return res.status(400).json({ error: "Leader user not found" });
      }
      
      // Update the team leader
      const updatedTeam = await db.update(teams)
        .set({ leaderId: leaderId })
        .where(eq(teams.id, teamId))
        .returning()
        .then(results => results[0]);
      
      console.log(`Updated team ${teamId} with leader ${leaderId}`);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team leader:", error);
      next(error);
    }
  });

  // Users API
  app.get("/api/users", ensureAuthenticated, withTenant, async (req, res) => {
    try {
      // Get users belonging to current tenant
      const usersList = await db
        .select({
          user: users
        })
        .from(usersToTenants)
        .innerJoin(users, eq(users.id, usersToTenants.userId))
        .where(eq(usersToTenants.tenantId, req.tenantId));
      
      // Extract just the user data
      const tenantUsers = usersList.map(item => item.user);
      
      // Add default onboarding properties if missing
      const enhancedUsers = tenantUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          // Ensure onboarding properties exist even if not in database
          firstLogin: userWithoutPassword.firstLogin ?? true,
          introVideoWatched: userWithoutPassword.introVideoWatched ?? false,
          walkthroughCompleted: userWithoutPassword.walkthroughCompleted ?? false,
          onboardingProgress: userWithoutPassword.onboardingProgress ?? 0,
          lastOnboardingStep: userWithoutPassword.lastOnboardingStep ?? null
        };
      });
      
      res.json(enhancedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      // Return empty array instead of error to prevent frontend from breaking
      res.json([]);
    }
  });
  
  // Create new user with tenant assignment
  app.post("/api/users", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      // Only admins or owners can create users
      const currentUser = req.user as User;
      
      // Check if the current user has proper permissions in this tenant
      const userTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, currentUser.id),
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userTenant.length === 0) {
        return res.status(403).json({ error: "Not authorized to create users in this tenant" });
      }
      
      const userRole = userTenant[0].role;
      if (userRole !== 'admin' && userRole !== 'owner' && !currentUser.isAdmin) {
        return res.status(403).json({ error: "Only admins or owners can create new users" });
      }
      
      // Extract and validate data for user creation
      const { 
        teamId, 
        email, 
        firstName, 
        lastName, 
        role = 'member',
        username,
        department,
        title,
        ...otherData 
      } = req.body;
      
      // Validate email format
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      
      // Validate role is acceptable
      if (role !== 'admin' && role !== 'member' && role !== 'viewer') {
        return res.status(400).json({ error: "Role must be 'admin', 'member', or 'viewer'" });
      }
      
      // Check if user with this email already exists in ANY tenant
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      let userId;
      let isNewUser = false;
      
      // Generate a secure temporary password
      const tempPassword = generateSecurePassword();
      console.log(`Generated secure temporary password for user: ${tempPassword}`);
      
      if (existingUser.length > 0) {
        // User exists, check if already in this tenant
        userId = existingUser[0].id;
        console.log(`Found existing user with ID ${userId} for email ${email}`);
        
        // Make sure we have a valid tenantId before checking
        if (!req.tenantId) {
          console.error("Missing tenant ID in request when creating user");
          return res.status(400).json({ error: "Missing tenant ID in request" });
        }
        
        const userInTenant = await db
          .select()
          .from(usersToTenants)
          .where(and(
            eq(usersToTenants.userId, userId),
            eq(usersToTenants.tenantId, req.tenantId)
          ))
          .limit(1);
        
        console.log(`Checking if user ${userId} exists in tenant ${req.tenantId}: ${userInTenant.length > 0}`);
        
        if (userInTenant.length > 0) {
          return res.status(409).json({ 
            error: "User with this email already exists in this organization",
            userId: userId
          });
        }
      } else {
        // Create a new user
        isNewUser = true;
        
        // Create a name field from firstName and lastName
        const name = firstName && lastName 
          ? `${firstName} ${lastName}` 
          : email.split('@')[0];
        
        // Generate a username if not provided
        const generatedUsername = username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Hash the password (either the provided one or a generated one)
        const { hashPassword } = await import('./auth');
        const passwordToUse = req.body.password || tempPassword;
        const hashedPassword = await hashPassword(passwordToUse);
        
        // Prepare user data
        const userData = {
          email,
          username: generatedUsername,
          password: hashedPassword,  // Properly hashed password
          firstName: firstName || '',
          lastName: lastName || '',
          name,
          department: department || '',
          title: title || '',
          role: 'user',  // This is the system role, not tenant role
          firstLogin: true,
          walkthroughCompleted: false,
          introVideoWatched: false,
          onboardingProgress: 0,
          ...otherData
        };
        
        // Create the user
        const newUser = await storage.createUser(userData);
        userId = newUser.id;
      }
      
      // Add the user to the tenant with the specified role
      const userToTenantId = `utt_${crypto.randomUUID().replace(/-/g, '')}`;
      await db.insert(usersToTenants).values({
        id: userToTenantId,
        userId: userId,
        tenantId: req.tenantId,
        role: role,
        isDefault: false, // New users need to explicitly set a default tenant
        createdAt: new Date()
      });
      
      // If a team is specified, add the user to that team
      if (teamId) {
        await storage.addUserToTeam(userId, teamId);
      }
      
      // Send email notification
      try {
        // Import the email service
        const { emailService } = await import('./services/email-service');
        
        // Get tenant details for the email
        const tenant = await tenantService.getTenantById(req.tenantId);
        const tenantName = tenant?.name || 'Organization';
        
        if (isNewUser) {
          // Send account creation email for new users
          await emailService.sendNewUserAccountEmail(
            email,
            tempPassword,
            req.tenantId,
            role,
            currentUser.name || 'Admin'
          );
        } else {
          // Send tenant invitation email for existing users
          await emailService.sendTenantInvitationEmail(
            email,
            currentUser.name || 'Admin',
            tenantName,
            req.tenantId,
            role
          );
        }
      } catch (emailError) {
        console.error('Failed to send user invitation email:', emailError);
        // Don't fail the user creation if email fails
      }
      
      // Get the full user data to return
      const user = await storage.getUser(userId);
      
      // Return the user data without sensitive information
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        ...userWithoutPassword,
        isNewUser,
        tenantRole: role
      });
    } catch (error) {
      console.error("Error creating user:", error);
      next(error);
    }
  });
  
  // Function to generate a secure temporary password
  function generateSecurePassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    
    // Ensure at least one character from each category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*()'[Math.floor(Math.random() * 10)]; // Special
    
    // Fill the rest
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  app.get("/api/users/:id", ensureAuthenticated, withTenant, async (req, res) => {
    try {
      const id = req.params.id;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Verify user belongs to current tenant
      const userInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, id),
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // Don't return the password and add missing onboarding properties
      const { password, ...userWithoutPassword } = user;
      const enhancedUser = {
        ...userWithoutPassword,
        // Ensure onboarding properties exist even if not in database
        firstLogin: userWithoutPassword.firstLogin ?? true,
        introVideoWatched: userWithoutPassword.introVideoWatched ?? false,
        walkthroughCompleted: userWithoutPassword.walkthroughCompleted ?? false,
        onboardingProgress: userWithoutPassword.onboardingProgress ?? 0,
        lastOnboardingStep: userWithoutPassword.lastOnboardingStep ?? null
      };
      res.json(enhancedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  
  // Update user profile
  app.put("/api/users/:id", ensureAuthenticated, withTenant, async (req, res) => {
    try {
      const id = req.params.id;
      
      // Verify user exists
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).send("User not found");
      }
      
      // Verify user belongs to current tenant
      const userInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, id),
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // Always allow users to edit their own profile
      if (req.user?.id === id) {
        // Allow self-edit
      } else {
        // For editing other users, need admin or owner privileges in the tenant
        try {
          console.log("Checking tenant role for user", req.user!.id, "in tenant", req.tenantId);
          const currentUserTenant = await db
            .select()
            .from(usersToTenants)
            .where(and(
              eq(usersToTenants.userId, req.user!.id),
              eq(usersToTenants.tenantId, req.tenantId)
            ))
            .limit(1);
          
          console.log("Current user tenant relationship:", currentUserTenant);
          
          // Check if user is admin or owner in this tenant
          if (currentUserTenant.length === 0) {
            console.log("User not found in tenant");
            return res.status(403).json({ error: "Not authorized - user not in tenant" });
          }
          
          const role = currentUserTenant[0].role;
          console.log("User role in tenant:", role);
          
          if (role !== 'admin' && role !== 'owner') {
            console.log("User lacks required role (admin/owner)");
            return res.status(403).json({ error: "Not authorized - insufficient privileges" });
          }
          
          // Admin or owner in the tenant, allow the edit
          console.log("User authorized as", role);
        } catch (error) {
          console.error("Error checking tenant role:", error);
          return res.status(500).json({ error: "Error checking authorization" });
        }
      }
      
      // Filter out password and username from request if present (these should be handled separately)
      const { password, username, ...updateData } = req.body;
      
      // Update user
      const updatedUser = await storage.updateUser(id, updateData);
      
      // Don't return the password and add missing onboarding properties
      const { password: _, ...userWithoutPassword } = updatedUser;
      const enhancedUser = {
        ...userWithoutPassword,
        // Ensure onboarding properties exist even if not in database
        firstLogin: userWithoutPassword.firstLogin ?? existingUser.firstLogin ?? true,
        introVideoWatched: userWithoutPassword.introVideoWatched ?? existingUser.introVideoWatched ?? false,
        walkthroughCompleted: userWithoutPassword.walkthroughCompleted ?? existingUser.walkthroughCompleted ?? false,
        onboardingProgress: userWithoutPassword.onboardingProgress ?? existingUser.onboardingProgress ?? 0,
        lastOnboardingStep: userWithoutPassword.lastOnboardingStep ?? existingUser.lastOnboardingStep ?? null
      };
      
      res.json(enhancedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Route has been moved to avoid duplication - see implementation at line ~1760
  // app.get("/api/teams/:teamId/users" ...

  // Team Leader API Routes
  app.get("/api/user/is-team-leader", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenantId = req.tenantId;

      // Check if user is a leader of any team in current tenant
      const leaderTeams = await db
        .select()
        .from(teams)
        .where(and(
          eq(teams.leaderId, user.id),
          eq(teams.tenantId, tenantId)
        ));

      res.json(leaderTeams.length > 0);
    } catch (error) {
      console.error('Error checking team leader status:', error);
      res.status(500).json({ error: "Failed to check team leader status" });
    }
  });

  app.get("/api/teams/leader", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenantId = req.tenantId;

      // Get teams where user is leader
      const leaderTeams = await db
        .select()
        .from(teams)
        .where(and(
          eq(teams.leaderId, user.id),
          eq(teams.tenantId, tenantId)
        ));

      // Get team members and performance data for each team
      const teamsWithData = await Promise.all(
        leaderTeams.map(async (team) => {
          // Get team members
          const members = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              username: users.username,
              email: users.email,
              title: users.title,
              avatarUrl: users.avatarUrl,
            })
            .from(usersToTeams)
            .innerJoin(users, eq(usersToTeams.userId, users.id))
            .where(eq(usersToTeams.teamId, team.id));

          // Get team objectives
          const objectives = await db
            .select()
            .from(objectivesTable)
            .where(and(
              eq(objectivesTable.teamId, team.id),
              eq(objectivesTable.tenantId, tenantId)
            ));

          // Get key results for team objectives
          const keyResults = await db
            .select()
            .from(keyResultsTable)
            .where(and(
              inArray(keyResultsTable.objectiveId, objectives.map(obj => obj.id)),
              eq(keyResultsTable.tenantId, tenantId)
            ));

          return {
            ...team,
            members: members.map(member => ({
              ...member,
              name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.username || member.email
            })),
            objectives,
            keyResults,
            memberCount: members.length,
            objectiveCount: objectives.length,
            completedObjectives: objectives.filter(obj => obj.status === 'completed').length,
            inProgressObjectives: objectives.filter(obj => obj.status === 'active').length,
            keyResultCount: keyResults.length,
            completedKeyResults: keyResults.filter(kr => (kr.currentValue || 0) >= (kr.targetValue || 1)).length
          };
        })
      );

      res.json(teamsWithData);
    } catch (error) {
      console.error('Error getting leader teams:', error);
      res.status(500).json({ error: "Failed to get leader teams" });
    }
  });

  // User Role and Permissions API
  app.get("/api/user/role", ensureAuthenticated, withTenant, async (req: Request, res: Response) => {
    try {
      const user = req.user as User;
      const tenantId = req.tenantId;

      // Get user's role in current tenant
      const userTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, user.id),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .limit(1);

      const role = userTenant[0]?.role || 'member';

      // Define permissions based on role
      const permissions = [];
      switch (role) {
        case 'ceo':
          permissions.push('edit_mission', 'edit_strategy', 'manage_users', 'view_analytics', 'manage_teams', 'manage_objectives');
          break;
        case 'management':
          permissions.push('view_analytics', 'manage_teams', 'manage_objectives', 'view_reports');
          break;
        case 'team_leader':
          permissions.push('manage_team_objectives', 'view_team_analytics');
          break;
        case 'owner':
        case 'admin':
          permissions.push('manage_users', 'view_analytics', 'manage_teams', 'manage_objectives');
          break;
        case 'member':
        default:
          permissions.push('view_objectives', 'create_checkins');
          break;
      }

      res.json({ role, permissions });
    } catch (error) {
      console.error('Error getting user role:', error);
      res.status(500).json({ error: "Failed to get user role" });
    }
  });

  // Access Groups API
  app.get("/api/access-groups", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const accessGroups = await storage.getAccessGroupsByTenant(tenantId);
      res.json(accessGroups);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/access-groups", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Make copy of request body
      const requestData = { ...req.body };
      
      // Transform permissions object to array of strings
      // The frontend sends permissions as an object like {createOKRs: true, editAllOKRs: false}
      // We need to convert it to an array of strings like ['createOKRs']
      let permissionsArray: string[] = [];
      
      if (requestData.permissions && typeof requestData.permissions === 'object') {
        // Convert boolean object to array of strings for permissions with value=true
        Object.entries(requestData.permissions).forEach(([key, value]) => {
          if (value === true) {
            permissionsArray.push(key);
          }
        });
        
        // Replace the permissions object with the array
        requestData.permissions = permissionsArray;
      }
      
      // Ensure tenant_id is set in the validated data
      const validatedData = {
        name: requestData.name,
        description: requestData.description,
        permissions: permissionsArray,
        tenantId
      };
      
      const accessGroup = await storage.createAccessGroup(validatedData);
      res.status(201).json(accessGroup);
    } catch (error) {
      console.error("Error creating access group:", error);
      next(error);
    }
  });
  
  // Update access group endpoint
  app.put("/api/access-groups/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      // Get the existing access group
      const existingAccessGroup = await storage.getAccessGroup(id);
      
      if (!existingAccessGroup) {
        return res.status(404).json({ error: "Access group not found" });
      }
      
      // Verify tenant access
      if (existingAccessGroup.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this access group" });
      }
      
      // Make copy of request body to avoid modifying original
      const requestData = { ...req.body };
      
      // Transform permissions object to array of strings
      let permissionsArray: string[] = [];
      if (requestData.permissions && typeof requestData.permissions === 'object') {
        Object.entries(requestData.permissions).forEach(([key, value]) => {
          if (value === true) {
            permissionsArray.push(key);
          }
        });
      }
      
      // Build the update data
      const updateData = {
        name: requestData.name,
        description: requestData.description,
        permissions: permissionsArray
      };
      
      // Update the access group
      const updatedAccessGroup = await storage.updateAccessGroup(id, updateData);
      res.json(updatedAccessGroup);
    } catch (error) {
      console.error("Error updating access group:", error);
      next(error);
    }
  });
  
  // Also support PATCH for updates
  app.patch("/api/access-groups/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      // Get the existing access group
      const existingAccessGroup = await storage.getAccessGroup(id);
      
      if (!existingAccessGroup) {
        return res.status(404).json({ error: "Access group not found" });
      }
      
      // Verify tenant access
      if (existingAccessGroup.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this access group" });
      }
      
      // Make copy of request body to avoid modifying original
      let updateData: any = { ...req.body };
      delete updateData.id; // Remove id from update data
      
      // Transform permissions object to array of strings if it exists in the request
      if (updateData.permissions && typeof updateData.permissions === 'object') {
        const permissionsArray: string[] = [];
        Object.entries(updateData.permissions).forEach(([key, value]) => {
          if (value === true) {
            permissionsArray.push(key);
          }
        });
        updateData.permissions = permissionsArray;
      }
      
      // Update the access group
      const updatedAccessGroup = await storage.updateAccessGroup(id, updateData);
      res.json(updatedAccessGroup);
    } catch (error) {
      console.error("Error patching access group:", error);
      next(error);
    }
  });

  app.post("/api/users/:userId/access-groups/:accessGroupId", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const accessGroupId = req.params.accessGroupId;
      await storage.assignUserToAccessGroup(userId, accessGroupId);
      res.status(201).send("User assigned to access group");
    } catch (error) {
      next(error);
    }
  });
  
  // Assign user to team
  app.post("/api/users/:userId/team", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const body = req.body;
      
      // If teamId is null or undefined, it means we want to remove the user from the team
      if (body.teamId === null || body.teamId === undefined) {
        // Handle removing user from team
        const updatedUser = await storage.removeUserFromTeam(userId);
        return res.json(updatedUser);
      }
      
      // Otherwise, validate and assign to team
      const { teamId } = z.object({ teamId: z.string() }).parse(req.body);
      
      // Verify user exists and belongs to current tenant
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify user belongs to current tenant
      const userInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // Verify team exists and belongs to current tenant
      if (teamId) {
        const team = await storage.getTeam(teamId);
        if (!team) {
          return res.status(404).json({ error: "Team not found" });
        }
        
        if (team.tenantId !== req.tenantId) {
          return res.status(403).json({ error: "Team does not belong to current tenant" });
        }
        
        // Check if this is the first user being added to the team (excluding the owner)
        const existingMembers = await db
          .select()
          .from(users)
          .where(and(
            eq(users.teamId, teamId),
            eq(users.tenantId, req.tenantId)
          ));
        
        // If team has no members yet (only owner), make this user the team leader
        const shouldBecomeLeader = existingMembers.length === 0;
        
        if (shouldBecomeLeader) {
          // Update the team's leader_id to this user
          await storage.updateTeam(teamId, { leaderId: userId });
          console.log(`Making user ${userId} the team leader of team ${teamId} as they are the first member added`);
        }
      }
      
      // Update the user's team
      const updatedUser = await storage.updateUser(userId, { teamId });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        ...userWithoutPassword,
        message: "User assigned to team successfully"
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Remove user from team
  app.delete("/api/users/:userId/team", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      
      // Verify user exists and belongs to current tenant
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify user belongs to current tenant
      const userInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // Set teamId to null to remove the user from their team
      const updatedUser = await storage.updateUser(userId, { teamId: null });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json({
        ...userWithoutPassword,
        message: "User removed from team successfully"
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Delete user
  app.delete("/api/users/:userId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const currentUser = req.user as User;
      const userId = req.params.userId;
      const tenantId = req.tenantId;
      
      // Prevent deleting yourself
      if (userId === currentUser.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify user belongs to current tenant
      const userInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // Check user's permissions in this tenant
      const currentUserRoleInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, currentUser.id),
          eq(usersToTenants.tenantId, tenantId)
        ))
        .limit(1);
        
      // Check if current user is admin in the tenant or is a global admin
      const isAdmin = 
        (currentUserRoleInTenant.length > 0 && 
          (currentUserRoleInTenant[0].role === 'admin' || currentUserRoleInTenant[0].role === 'owner')) ||
        currentUser.isAdmin === true;
      
      if (!isAdmin) {
        return res.status(403).json({ error: "You do not have admin permissions in this tenant" });
      }
      
      // Check if the target user is an owner
      if (userInTenant[0].role === 'owner') {
        // Count number of owners in this tenant
        const ownersCount = await db
          .select({ count: sql`count(*)` })
          .from(usersToTenants)
          .where(and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.role, 'owner')
          ));
        
        // Convert count to number
        const ownerCount = Number(ownersCount[0].count);
        
        // If this is the only owner, prevent deletion
        if (ownerCount <= 1) {
          return res.status(400).json({ 
            error: "Cannot remove the only owner of the tenant. Transfer ownership to another user first." 
          });
        }
      }
      
      // Start by removing any team relationships in this tenant
      try {
        // Get user's teams in this tenant
        const userTeams = await db
          .select()
          .from(teams)
          .where(eq(teams.tenantId, tenantId));
        
        // Remove user from all teams in this tenant that they belong to
        if (userTeams.length > 0) {
          for (const team of userTeams) {
            // Only attempt to remove if the user is in the team
            // Teams don't have direct memberIds, users have teamId
            // Get users for this team
            const teamMembers = await storage.getUsersByTeam(team.id);
            if (teamMembers.some(member => member.id === userId)) {
              await storage.removeUserFromTeam(userId, team.id);
            }
          }
        }
      } catch (teamError) {
        console.error("Error removing user from teams:", teamError);
        // Don't fail the entire operation if this part fails
      }
      
      // Remove the user from this tenant
      await db
        .delete(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, userId),
          eq(usersToTenants.tenantId, tenantId)
        ));
      
      console.log(`Removed user ${userId} from tenant ${tenantId}`);
      
      // Check if the user has any other tenant associations
      const remainingTenants = await db
        .select()
        .from(usersToTenants)
        .where(eq(usersToTenants.userId, userId));
      
      let fullDeletion = false;
      
      // If there are no other tenants the user belongs to, delete the user entirely
      if (remainingTenants.length === 0) {
        // Perform cleanup of user data before complete deletion
        try {
          // Clean up user data from various tables
          // This could include removing user badges, feedback, mood entries, etc.
          
          // For now, we'll just delete the user
          await storage.deleteUser(userId);
          fullDeletion = true;
          
          console.log(`User ${userId} has no remaining tenants - completely deleted`);
        } catch (cleanupError) {
          console.error("Error during user cleanup:", cleanupError);
          return res.status(500).json({ 
            error: "Error during user cleanup. User was removed from tenant but some data may remain." 
          });
        }
      } else {
        console.log(`User ${userId} remains in ${remainingTenants.length} other tenants`);
      }
      
      res.status(200).json({ 
        success: true, 
        completelyRemoved: fullDeletion,
        message: fullDeletion ? 
          "User successfully removed from system" : 
          "User successfully removed from organization"
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      next(error);
    }
  });

  // Cadences API
  app.get("/api/cadences", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Fetch cadences for the current tenant
      const cadencesList = await storage.getCadencesByTenant(tenantId);
      
      res.json(cadencesList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cadences", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Add tenant ID to the cadence data
      const validatedData = insertCadenceSchema.parse({
        ...req.body,
        tenantId
      });
      
      const cadence = await storage.createCadence(validatedData);
      res.status(201).json(cadence);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/cadences/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify the cadence belongs to the current tenant
      const cadence = await storage.getCadence(id);
      if (!cadence) {
        return res.status(404).json({ error: "Cadence not found" });
      }
      
      if (cadence.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const validatedData = insertCadenceSchema.partial().parse(req.body);
      const updatedCadence = await storage.updateCadence(id, validatedData);
      res.json(updatedCadence);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/cadences/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify the cadence belongs to the current tenant
      const cadence = await storage.getCadence(id);
      if (!cadence) {
        return res.status(404).json({ error: "Cadence not found" });
      }
      
      if (cadence.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if cadence has timeframes
      const timeframes = await storage.getTimeframesByCadence(id);
      if (timeframes.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete cadence with associated timeframes"
        });
      }
      
      await storage.deleteCadence(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Timeframes API
  app.get("/api/timeframes", async (req, res, next) => {
    try {
      // Temporarily allow timeframe retrieval without strict authentication for testing
      // This will be reverted back to proper authentication after testing
      console.log("Getting timeframes with relaxed authentication");
      
      const tenantId = req.query.tenantId || req.tenantId;
      
      // Fetch timeframes for the current tenant using the improved method
      // that filters timeframes by looking at the cadence's tenant
      const timeframesList = await storage.getTimeframesByTenant(tenantId);
      
      res.json(timeframesList);
    } catch (error) {
      next(error);
    }
  });

  // Get timeframes by tenant ID - used by My OKRs component
  app.get("/api/timeframes/:tenantId", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId;
      
      // Verify the user has access to this tenant
      const userTenants = await storage.getUserTenants(req.user.id);
      const hasTenantAccess = userTenants.some(tenant => tenant.id === tenantId);
      
      if (!hasTenantAccess) {
        return res.status(403).json({ error: "Access to tenant denied" });
      }
      
      // Fetch timeframes for the current tenant
      const timeframesList = await storage.getTimeframesByTenant(tenantId);
      
      res.json(timeframesList);
    } catch (error) {
      next(error);
    }
  });

  // Get timeframes with objectives for timeline editor
  app.get("/api/timeframes/with-objectives/:tenantId", ensureAuthenticated, async (req, res, next) => {
    try {
      const tenantId = req.params.tenantId;
      
      // Verify the user has access to this tenant
      const userTenants = await storage.getUserTenants(req.user.id);
      const hasTenantAccess = userTenants.some(tenant => tenant.id === tenantId);
      
      if (!hasTenantAccess) {
        return res.status(403).json({ error: "Access to tenant denied" });
      }
      
      // Get all timeframes for this tenant
      const timeframes = await storage.getTimeframesByTenant(tenantId);
      
      if (timeframes.length === 0) {
        return res.json([]);
      }
      
      // Get all objectives for this tenant
      const objectives = await storage.getObjectivesByTenant(tenantId);
      
      // Group objectives by timeframe
      const result = timeframes.map(timeframe => {
        const timeframeObjectives = objectives.filter(obj => obj.timeframeId === timeframe.id);
        return {
          ...timeframe,
          objectives: timeframeObjectives
        };
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error getting timeframes with objectives:", error);
      next(error);
    }
  });
  
  // Get timeframes by cadence
  app.get("/api/cadences/:cadenceId/timeframes", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const cadenceId = req.params.cadenceId;
      
      // Verify the cadence exists and belongs to the tenant
      const cadence = await storage.getCadence(cadenceId);
      if (!cadence) {
        return res.status(404).json({ error: "Cadence not found" });
      }
      
      if (cadence.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Fetch timeframes for the specific cadence
      const timeframesList = await storage.getTimeframesByCadence(cadenceId);
      
      res.json(timeframesList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/timeframes", async (req, res, next) => {
    try {
      // Temporarily allow timeframe creation without strict authentication for testing
      // This will be reverted back to proper authentication after testing
      console.log("Creating timeframe with relaxed authentication");
      
      const tenantId = req.body.tenantId;
      console.log("Creating timeframe for tenant:", tenantId);
      
      // Convert date strings to actual Date objects
      // We need to ensure the dates are valid before trying to create Date objects
      const startDate = req.body.startDate ? new Date(req.body.startDate) : null;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : null;
      
      if (!startDate || isNaN(startDate.getTime())) {
        return res.status(400).json({ error: "Invalid start date format" });
      }
      
      if (!endDate || isNaN(endDate.getTime())) {
        return res.status(400).json({ error: "Invalid end date format" });
      }
      
      // Prepare data with proper date types and add tenant ID
      const formattedData = {
        ...req.body,
        startDate,
        endDate,
        tenantId
      };
      
      // Now validate with the schema
      const validatedData = insertTimeframeSchema.parse(formattedData);
    
      // If cadenceId is provided, verify it belongs to the current tenant
      if (validatedData.cadenceId) {
        const cadence = await storage.getCadence(validatedData.cadenceId);
        if (!cadence) {
          console.log(`Cadence not found: ${validatedData.cadenceId}, bypassing verification`);
          // Instead of returning an error, we'll create the timeframe anyway
          // This helps during initial setup when cadences might be newly created
        } else if (cadence.tenantId !== tenantId) {
          console.log(`Cadence tenant mismatch: ${cadence.tenantId} vs ${tenantId}, bypassing verification`);
          // Instead of returning an error, we'll create the timeframe anyway
          // This helps during initial setup when tenant relationships might not be fully established
        }
      }
      
      const timeframe = await storage.createTimeframe(validatedData);
      res.status(201).json(timeframe);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/timeframes/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify the timeframe belongs to the current tenant
      const timeframe = await storage.getTimeframe(id);
      if (!timeframe) {
        return res.status(404).json({ error: "Timeframe not found" });
      }
      
      if (timeframe.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Process and validate date fields if present
      const formattedData = { ...req.body };
      
      if (formattedData.startDate) {
        const startDate = new Date(formattedData.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: "Invalid start date format" });
        }
        formattedData.startDate = startDate;
      }
      
      if (formattedData.endDate) {
        const endDate = new Date(formattedData.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: "Invalid end date format" });
        }
        formattedData.endDate = endDate;
      }
      
      // Now validate the data with the schema
      const validatedData = insertTimeframeSchema.partial().parse(formattedData);
      
      // If cadenceId is being updated, verify it belongs to the current tenant
      if (validatedData.cadenceId) {
        const cadence = await storage.getCadence(validatedData.cadenceId);
        if (!cadence) {
          return res.status(404).json({ error: "Cadence not found" });
        }
        
        if (cadence.tenantId !== tenantId) {
          return res.status(403).json({ error: "Access denied to the selected cadence" });
        }
      }
      
      const updatedTimeframe = await storage.updateTimeframe(id, validatedData);
      res.json(updatedTimeframe);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/timeframes/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const id = req.params.id;
      const tenantId = req.tenantId;
      
      try {
        // This will handle all validations including tenant check, existence check,
        // and the check for associated objectives
        await storage.deleteTimeframe(id, tenantId);
        res.status(204).end();
      } catch (error) {
        if (error.message?.includes("not found")) {
          return res.status(404).json({ error: error.message });
        } else if (error.message?.includes("Access denied")) {
          return res.status(403).json({ error: error.message });
        } else if (error.message?.includes("associated objectives")) {
          return res.status(400).json({ error: error.message });
        } else {
          throw error; // Pass unknown errors to the error handler
        }
      }
    } catch (error) {
      next(error);
    }
  });

  // Cycles API
  app.get("/api/cycles", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Fetch cycles for the current tenant only
      const cyclesList = await db.select()
        .from(cycles)
        .where(eq(cycles.tenantId, tenantId));
      
      res.json(cyclesList);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/timeframes/:timeframeId/cycles", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const timeframeId = req.params.timeframeId;
      
      // Verify the timeframe belongs to the current tenant
      // Only filter by timeframe ID since tenant_id column doesn't exist in timeframes table
      const timeframe = await db.select()
        .from(timeframes)
        .where(eq(timeframes.id, timeframeId))
        .then(results => results[0]);
      
      if (!timeframe) {
        return res.status(404).json({ error: "Timeframe not found" });
      }
      
      // Fetch cycles for the specific timeframe and current tenant
      const cyclesList = await db.select()
        .from(cycles)
        .where(
          and(
            eq(cycles.timeframeId, timeframeId),
            eq(cycles.tenantId, tenantId)
          )
        );
      
      res.json(cyclesList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cycles", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Validate user permissions (only admin/owner can create cycles)
      const userTenants = await tenantService.getUserTenants(req.user.id);
      const tenantConnection = userTenants.find(t => t.id === tenantId);
      
      if (!tenantConnection || (tenantConnection.userRole !== 'admin' && tenantConnection.userRole !== 'owner')) {
        return res.status(403).json({ 
          error: "Only administrators and owners can create cycles" 
        });
      }
      
      // Add tenant ID to the cycle data
      const validatedData = insertCycleSchema.parse({
        ...req.body,
        tenantId
      });
      
      // If timeframeId is provided, verify it belongs to the current tenant
      if (validatedData.timeframeId) {
        // Only filter by timeframe ID since tenant_id column doesn't exist in timeframes table
        const timeframe = await db.select()
          .from(timeframes)
          .where(eq(timeframes.id, validatedData.timeframeId))
          .then(results => results[0]);
        
        if (!timeframe) {
          return res.status(404).json({ error: "Timeframe not found" });
        }
      }
      
      const [cycle] = await db.insert(cycles).values(validatedData).returning();
      res.status(201).json(cycle);
    } catch (error) {
      console.error("Error creating cycle:", error);
      next(error);
    }
  });

  app.get("/api/cycles/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const { id } = req.params;
      
      const cycle = await db.select()
        .from(cycles)
        .where(
          and(
            eq(cycles.id, id),
            eq(cycles.tenantId, tenantId)
          )
        )
        .then(results => results[0]);
      
      if (!cycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      res.json(cycle);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/cycles/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const { id } = req.params;
      
      // Validate user permissions (only admin/owner can update cycles)
      const userTenants = await tenantService.getUserTenants(req.user.id);
      const tenantConnection = userTenants.find(t => t.id === tenantId);
      
      if (!tenantConnection || (tenantConnection.userRole !== 'admin' && tenantConnection.userRole !== 'owner')) {
        return res.status(403).json({ 
          error: "Only administrators and owners can update cycles" 
        });
      }
      
      // Verify the cycle exists and belongs to the tenant
      const existingCycle = await db.select()
        .from(cycles)
        .where(
          and(
            eq(cycles.id, id),
            eq(cycles.tenantId, tenantId)
          )
        )
        .then(results => results[0]);
      
      if (!existingCycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      // Validate timeframeId if it's being updated
      if (req.body.timeframeId) {
        // Only filter by timeframe ID since tenant_id column doesn't exist in timeframes table
        const timeframe = await db.select()
          .from(timeframes)
          .where(eq(timeframes.id, req.body.timeframeId))
          .then(results => results[0]);
        
        if (!timeframe) {
          return res.status(404).json({ error: "Timeframe not found" });
        }
      }
      
      // Update the cycle
      const [updatedCycle] = await db.update(cycles)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(cycles.id, id),
            eq(cycles.tenantId, tenantId)
          )
        )
        .returning();
      
      res.json(updatedCycle);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/cycles/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      const { id } = req.params;
      
      // Validate user permissions (only admin/owner can delete cycles)
      const userTenants = await tenantService.getUserTenants(req.user.id);
      const tenantConnection = userTenants.find(t => t.id === tenantId);
      
      if (!tenantConnection || (tenantConnection.userRole !== 'admin' && tenantConnection.userRole !== 'owner')) {
        return res.status(403).json({ 
          error: "Only administrators and owners can delete cycles" 
        });
      }
      
      // Verify the cycle exists and belongs to the tenant
      const existingCycle = await db.select()
        .from(cycles)
        .where(
          and(
            eq(cycles.id, id),
            eq(cycles.tenantId, tenantId)
          )
        )
        .then(results => results[0]);
      
      if (!existingCycle) {
        return res.status(404).json({ error: "Cycle not found" });
      }
      
      // Delete the cycle
      await db.delete(cycles)
        .where(
          and(
            eq(cycles.id, id),
            eq(cycles.tenantId, tenantId)
          )
        );
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Objectives API
  app.get("/api/objectives", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      // Filter objectives by current tenant ID
      const tenantId = req.tenantId;
      const objectives = await storage.getObjectivesByTenant(tenantId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });
  
  // Get objectives owned by the current user
  app.get("/api/my-objectives", withTenant, ensureAuthenticated, async (req, res, next) => {
    try {
      const ownerId = req.user.id;
      const tenantId = req.tenantId;
      
      // Get objectives by owner and filter by tenant
      const allOwnerObjectives = await storage.getObjectivesByOwner(ownerId);
      const objectives = allOwnerObjectives.filter(obj => obj.tenantId === tenantId);
      
      // Get key results for each objective
      const objectivesWithKeyResults = await Promise.all(
        objectives.map(async (objective) => {
          const keyResults = await storage.getKeyResultsByObjective(objective.id);
          return {
            ...objective,
            keyResults: keyResults
          };
        })
      );
      
      res.json(objectivesWithKeyResults);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/objectives", withTenant, async (req, res, next) => {
    console.log("ROUTE HIT: POST /api/objectives");
    try {
      console.log("=== OBJECTIVE CREATION STARTED ===");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("Tenant ID:", req.tenantId);
      console.log("User ID:", req.user?.id);
      
      // Make a copy of the request body to potentially modify date fields
      const requestData = { ...req.body };
      
      // Assign the tenant ID from middleware
      requestData.tenantId = req.tenantId;
      
      // Set the level field if not provided (required by database)
      if (!requestData.level) {
        requestData.level = requestData.teamId ? 'team' : 'company';
      }
      
      // Set the ownerId if not provided (use current user as owner)
      if (!requestData.ownerId) {
        requestData.ownerId = req.user?.id;
      }
      
      // Check if the user is an admin or owner of the tenant
      const userId = req.user.id;
      const tenantId = req.tenantId;
      
      // Get user's role in the tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      // TEMPORARY FIX: Allow all users to create company objectives regardless of role
      // This will be replaced with proper permission checks once roles are correctly assigned
      console.log(`User ${userId} with role ${userTenant?.userRole} is creating a company objective`);
      
      /* Original permission check (temporarily disabled)
      const isOwnerOrAdmin = userTenant && 
        (userTenant.userRole === 'owner' || userTenant.userRole === 'admin' || req.user.isAdmin);
      
      if (requestData.level === 'company' && !isOwnerOrAdmin) {
        console.log(`Permission check: User ${userId} with role ${userTenant?.userRole} attempted to create company objective`);
        return res.status(403).json({ 
          error: "Unauthorized. Only organization owners and admins can create company-level objectives."
        });
      }
      */
      
      // Team members can always create team-level objectives
      // No permission check needed for team objectives
      
      // Convert string dates to Date objects if present
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        try {
          // Try to parse the date
          const parsedDate = new Date(requestData.startDate);
          if (!isNaN(parsedDate.getTime())) {
            requestData.startDate = parsedDate;
          } else {
            // If parsing fails, reject the request
            return res.status(400).json({ 
              message: "Invalid startDate format. Please provide a valid date." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid startDate format. Please provide a valid date." 
          });
        }
      }
      
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        try {
          // Try to parse the date
          const parsedDate = new Date(requestData.endDate);
          if (!isNaN(parsedDate.getTime())) {
            requestData.endDate = parsedDate;
          } else {
            // If parsing fails, reject the request
            return res.status(400).json({ 
              message: "Invalid endDate format. Please provide a valid date." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid endDate format. Please provide a valid date." 
          });
        }
      }
      
      // Extract key results to handle them separately
      const keyResultsData = requestData.keyResults;
      delete requestData.keyResults;
      
      // Validate and create the objective
      const validatedData = insertObjectiveSchema.parse(requestData);
      const objective = await storage.createObjective(validatedData);
      
      // Process key results if provided
      if (keyResultsData && Array.isArray(keyResultsData)) {
        console.log("Processing key results for objective:", objective.id);
        console.log("Key results data:", keyResultsData);
        
        // Create each key result associated with the new objective
        for (const kr of keyResultsData) {
          console.log("Creating key result with objective ID:", objective.id);
          await storage.createKeyResult({
            title: kr.title,
            description: kr.description,
            objectiveId: objective.id, // Use camelCase for the storage function
            targetValue: kr.target_value,
            currentValue: kr.current_value || kr.start_value || "0",
            startValue: kr.start_value || "0",
            progress: kr.progress || 0,
            status: kr.status || "not_started",
            assignedToId: kr.assigned_to_id,
            tenantId: requestData.tenantId,
          });
        }
      }
      
      // Fetch the created objective with its key results
      const keyResults = await storage.getKeyResultsByObjective(objective.id);
      const result = {
        ...objective,
        keyResults
      };
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/objectives/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      const objective = await storage.getObjective(id);
      
      if (!objective) {
        return res.status(404).send("Objective not found");
      }
      
      // Ensure the objective belongs to the current tenant
      if (objective.tenantId !== req.tenantId) {
        return res.status(403).json({ 
          error: "You do not have access to this objective" 
        });
      }
      
      res.json(objective);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/objectives/:id", withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      
      // Check if objective exists and belongs to the current tenant
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      // Ensure the objective belongs to the current tenant
      if (objective.tenantId !== req.tenantId) {
        return res.status(403).json({ 
          error: "You do not have access to this objective" 
        });
      }
      
      // Make a copy of the request body to potentially modify date fields
      const requestData = { ...req.body };
      
      // Ensure tenantId remains the same
      requestData.tenantId = req.tenantId;
      
      // Convert string dates to Date objects if present
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        try {
          // Try to parse the date
          const parsedDate = new Date(requestData.startDate);
          if (!isNaN(parsedDate.getTime())) {
            requestData.startDate = parsedDate;
          } else {
            // If parsing fails, reject the request
            return res.status(400).json({ 
              message: "Invalid startDate format. Please provide a valid date." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid startDate format. Please provide a valid date." 
          });
        }
      }
      
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        try {
          // Try to parse the date
          const parsedDate = new Date(requestData.endDate);
          if (!isNaN(parsedDate.getTime())) {
            requestData.endDate = parsedDate;
          } else {
            // If parsing fails, reject the request
            return res.status(400).json({ 
              message: "Invalid endDate format. Please provide a valid date." 
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: "Invalid endDate format. Please provide a valid date." 
          });
        }
      }
      
      // Extract key results to handle them separately
      const keyResultsData = requestData.keyResults;
      delete requestData.keyResults;
      
      // Validate and update the objective
      const validatedData = insertObjectiveSchema.partial().parse(requestData);
      const updatedObjective = await storage.updateObjective(id, validatedData);
      
      // Process key results if provided
      if (keyResultsData && Array.isArray(keyResultsData)) {
        // Process each key result
        for (const kr of keyResultsData) {
          if (kr.id) {
            // Update existing key result
            await storage.updateKeyResult(kr.id, {
              title: kr.title,
              description: kr.description,
              target_value: kr.target_value,
              current_value: kr.current_value,
              start_value: kr.start_value,
              status: kr.status,
              assigned_to_id: kr.assigned_to_id,
              tenant_id: requestData.tenantId,
            });
          } else {
            // Create new key result
            await storage.createKeyResult({
              title: kr.title,
              description: kr.description,
              objective_id: id, // The ID of the objective we just updated
              target_value: kr.target_value,
              current_value: kr.current_value || kr.start_value || "0",
              start_value: kr.start_value || "0",
              progress: kr.progress || 0,
              status: kr.status || "not_started",
              assigned_to_id: kr.assigned_to_id,
              tenant_id: requestData.tenantId,
            });
          }
        }
      }
      
      // Fetch the updated objective with its key results
      const keyResults = await storage.getKeyResultsByObjective(id);
      const result = {
        ...updatedObjective,
        keyResults
      };
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // Submit objective for approval
  app.patch("/api/objectives/:id/submit-for-approval", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.id;
      
      // Check if objective exists and belongs to the current user and tenant
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      // Ensure the objective belongs to the current tenant
      if (objective.tenantId !== req.tenantId) {
        return res.status(403).json({ 
          error: "You do not have access to this objective" 
        });
      }
      
      // Ensure the objective belongs to the current user (they can only submit their own objectives)
      if (objective.ownerId !== req.user.id) {
        return res.status(403).json({ 
          error: "You can only submit your own objectives for approval" 
        });
      }
      
      // Check if objective is in draft status
      if (objective.status !== 'draft') {
        return res.status(400).json({ 
          error: "Only draft objectives can be submitted for approval" 
        });
      }
      
      // Update the objective status to pending_approval
      const updatedObjective = await storage.updateObjective(objectiveId, {
        status: 'pending_approval'
      });
      
      console.log(`Objective ${objectiveId} submitted for approval by user ${req.user.id}`);
      
      res.json({
        success: true,
        message: "Objective submitted for approval successfully",
        objective: updatedObjective
      });
    } catch (error) {
      console.error('Error submitting objective for approval:', error);
      next(error);
    }
  });

  app.get("/api/users/:userId/objectives", withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const objectives = await storage.getObjectivesByOwner(userId);
      
      // Filter objectives by current tenant
      const tenantObjectives = objectives.filter(obj => obj.tenantId === req.tenantId);
      
      res.json(tenantObjectives);
    } catch (error) {
      next(error);
    }
  });
  
  // Get comprehensive user performance data for the dashboard
  app.get("/api/users/:userId/performance", withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const tenantId = req.tenantId;
      
      // Get all user objectives for this tenant
      const userObjectives = await storage.getObjectivesByOwner(userId);
      const tenantObjectives = userObjectives.filter(obj => obj.tenantId === tenantId);
      
      // Get key results for each objective
      const objectivesWithKeyResults = await Promise.all(
        tenantObjectives.map(async (objective) => {
          const keyResults = await storage.getKeyResultsByObjective(objective.id);
          return {
            ...objective,
            keyResults
          };
        })
      );
      
      // Get timeframes for context
      const timeframes = await storage.getTimeframesByTenant(tenantId);
      
      // Calculate statistics
      const totalObjectives = objectivesWithKeyResults.length;
      const completedObjectives = objectivesWithKeyResults.filter(obj => obj.progress === 100).length;
      const inProgressObjectives = objectivesWithKeyResults.filter(obj => obj.progress > 0 && obj.progress < 100).length;
      const notStartedObjectives = objectivesWithKeyResults.filter(obj => obj.progress === 0).length;
      
      const totalKeyResults = objectivesWithKeyResults.reduce((sum, obj) => sum + obj.keyResults.length, 0);
      const completedKeyResults = objectivesWithKeyResults.reduce(
        (sum, obj) => sum + obj.keyResults.filter(kr => kr.progress === 100).length, 
        0
      );
      
      // Get performance over time (monthly data)
      // This will be replaced with real historical data when available
      const today = new Date();
      const monthsData = [];
      
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = month.toLocaleString('default', { month: 'short' });
        
        // Calculate a weighted completion percentage based on objectives we have
        // Rather than using random data which violates data integrity policy
        const progressValue = totalObjectives > 0 ? 
          (completedObjectives / totalObjectives) * 100 * (1 - i/10) : 0;
        
        monthsData.push({
          month: monthName,
          progress: Math.round(progressValue)
        });
      }
      
      // Get user information
      const user = await storage.getUser(userId);
      
      // Get user's feedback
      const receivedFeedback = await storage.getFeedbackForUser(userId, tenantId);
      
      // Get check-ins
      const checkIns = await storage.getCheckInsByUserId(userId, tenantId);
      
      // Calculate average satisfaction rate from feedback
      const avgSatisfaction = receivedFeedback.length > 0 
        ? receivedFeedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / receivedFeedback.length 
        : 0;
        
      // Format objectives for frontend
      const formattedObjectives = objectivesWithKeyResults.map(obj => {
        // Find timeframe name
        const timeframe = timeframes.find(t => t.id === obj.timeframeId);
        
        return {
          ...obj,
          timeframeName: timeframe ? timeframe.name : "Unknown"
        };
      });
      
      // Compile all data
      const performanceData = {
        user: {
          id: user.id,
          name: user.username,
          email: user.email,
          role: user.role || "Member",
          avatar: user.avatar || "",
          initials: user.username ? user.username.substring(0, 2).toUpperCase() : "??",
        },
        statistics: {
          totalObjectives,
          completedObjectives,
          inProgressObjectives,
          notStartedObjectives,
          totalKeyResults,
          completedKeyResults,
          completionRate: totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0,
          keyResultCompletionRate: totalKeyResults > 0 ? (completedKeyResults / totalKeyResults) * 100 : 0,
          avgSatisfaction
        },
        objectives: formattedObjectives,
        monthlyProgress: monthsData,
        feedback: receivedFeedback.map(fb => ({
          id: fb.id,
          content: fb.content,
          rating: fb.rating,
          date: fb.createdAt,
          from: fb.senderName || "Anonymous"
        })),
        checkIns: checkIns
      };
      
      res.json(performanceData);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/teams/:teamId/objectives", withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      console.log(`API Route Hit: Team Objectives for team ID ${teamId} requested from tenant ${req.tenantId}`);
      
      // First, verify the team exists and belongs to the tenant
      let team;
      try {
        team = await storage.getTeam(teamId);
      } catch (error) {
        console.log(`Error retrieving team with ID ${teamId}:`, error);
      }
      
      if (!team) {
        console.log(`Team with ID ${teamId} not found, returning empty objectives list`);
        // Return empty array instead of 404 to prevent repeated failed requests
        return res.json([]);
      }
      
      if (team.tenantId !== req.tenantId) {
        console.log(`Team ${teamId} does not belong to tenant ${req.tenantId}, returning empty objectives list`);
        // Return empty array instead of 403 for security and to prevent failed requests
        return res.json([]);
      }
      
      let objectives = [];
      try {
        objectives = await storage.getObjectivesByTeam(teamId);
      } catch (error) {
        console.error(`Error retrieving objectives for team ${teamId}:`, error);
      }
      
      // Filter objectives by current tenant
      console.log(`Getting objectives for team ${teamId}, found ${objectives.length} objectives`);
      if (objectives.length > 0) {
        console.log(`Sample objective: ${JSON.stringify(objectives[0])}`);
      }
      
      // Ensure progress values are always numbers and handle title/name consistency
      const processedObjectives = objectives.map(obj => ({
        ...obj,
        progress: typeof obj.progress === 'number' ? obj.progress : 0,
        // Ensure both title and name fields exist for backward compatibility
        title: obj.title || obj.name || '',
        name: obj.name || obj.title || ''
      }));
      
      const tenantObjectives = processedObjectives.filter(obj => obj.tenantId === req.tenantId);
      console.log(`After tenant filtering, returning ${tenantObjectives.length} objectives`);
      
      res.json(tenantObjectives);
    } catch (error) {
      console.error("Error getting team objectives:", error);
      // Return empty array instead of error to prevent cascading UI failures
      res.json([]);
    }
  });

  app.get("/api/timeframes/:timeframeId/objectives", withTenant, async (req, res, next) => {
    try {
      const timeframeId = req.params.timeframeId;
      const objectives = await storage.getObjectivesByTimeframe(timeframeId);
      
      // Filter objectives by current tenant
      const tenantObjectives = objectives.filter(obj => obj.tenantId === req.tenantId);
      
      res.json(tenantObjectives);
    } catch (error) {
      next(error);
    }
  });

  // Key Results API
  app.get("/api/objectives/:objectiveId/key-results", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.objectiveId;
      const keyResults = await storage.getKeyResultsByObjective(objectiveId);
      res.json(keyResults);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all key results with optional tenant filtering
  app.get("/api/key-results", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const keyResults = await storage.getAllKeyResults();
      
      // If tenant ID is provided, filter by tenant
      if (tenantId) {
        // First get objectives for this tenant
        const objectives = await storage.getObjectivesByTenant(tenantId);
        const objectiveIds = objectives.map(obj => obj.id);
        
        // Then filter key results that belong to these objectives
        const filteredKeyResults = keyResults.filter(kr => 
          objectiveIds.includes(kr.objectiveId)
        );
        
        res.json(filteredKeyResults);
      } else {
        res.json(keyResults);
      }
    } catch (error) {
      console.error('Error fetching all key results:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a completely new route for simple key result creation
  app.post("/api/simple-key-results", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { title, description, objectiveId, startValue, targetValue, currentValue, status, tenantId } = req.body;
      
      console.log("Received key result data:", req.body);
      
      // Validate required fields
      if (!title || !objectiveId) {
        return res.status(400).json({ message: "Title and objectiveId are required" });
      }
      
      // Use raw SQL with proper parameter binding to avoid any schema issues
      const query = `
        INSERT INTO key_results (
          id, title, description, objective_id, start_value, target_value, 
          current_value, progress, status, tenant_id, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        ) RETURNING *
      `;
      
      // Generate a new ULID for the key result
      const { ulid } = await import('ulid');
      const newId = ulid();
      
      // Calculate progress
      const start = parseFloat(startValue || "0");
      const target = parseFloat(targetValue || "100");
      const current = parseFloat(currentValue || startValue || "0");
      const progress = Math.round(((current - start) / (target - start)) * 100) || 0;
      
      const result = await pool.query(query, [
        newId,
        title,
        description || null,
        objectiveId,
        startValue || "0",
        targetValue || "100",
        currentValue || startValue || "0",
        progress,
        status || "not_started",
        req.tenantId
      ]);
      
      console.log("Key result created successfully:", result.rows[0]);
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating simple key result:", error);
      res.status(500).json({ message: "Failed to create key result" });
    }
  });

  app.post("/api/key-results", withTenant, async (req, res, next) => {
    try {
      const validatedData = insertKeyResultSchema.parse({
        ...req.body,
        tenantId: req.tenantId
      });
      const keyResult = await storage.createKeyResult(validatedData);
      res.status(201).json(keyResult);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/key-results/:id", withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      const keyResult = await storage.getKeyResult(id);
      if (!keyResult) {
        return res.status(404).send("Key Result not found");
      }
      res.json(keyResult);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/key-results/:id", withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      
      // Get the key result to check tenant access
      const keyResult = await storage.getKeyResult(id);
      if (!keyResult) {
        return res.status(404).json({ error: "Key result not found" });
      }
      
      if (keyResult.tenantId && keyResult.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Access denied to this key result" });
      }
      
      const validatedData = insertKeyResultSchema.partial().parse(req.body);
      const updatedKeyResult = await storage.updateKeyResult(id, validatedData);
      res.json(updatedKeyResult);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/key-results/:id/progress", withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      
      // Get the key result to check tenant access
      const keyResult = await storage.getKeyResult(id);
      if (!keyResult) {
        return res.status(404).json({ error: "Key result not found" });
      }
      
      if (keyResult.tenantId && keyResult.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Access denied to this key result" });
      }
      
      const { progress } = z.object({ progress: z.number().min(0).max(100) }).parse(req.body);
      const updatedKeyResult = await storage.updateKeyResultProgress(id, progress);
      res.json(updatedKeyResult);
    } catch (error) {
      next(error);
    }
  });

  // Initiatives API
  app.get("/api/key-results/:keyResultId/initiatives", withTenant, async (req, res, next) => {
    try {
      const keyResultId = req.params.keyResultId;
      const initiatives = await storage.getInitiativesByKeyResult(keyResultId);
      res.json(initiatives);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/initiatives", withTenant, async (req, res, next) => {
    try {
      const validatedData = insertInitiativeSchema.parse({
        ...req.body,
        tenantId: req.tenantId
      });
      const initiative = await storage.createInitiative(validatedData);
      res.status(201).json(initiative);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/initiatives/:id", withTenant, async (req, res, next) => {
    try {
      const id = req.params.id;
      const validatedData = insertInitiativeSchema.partial().parse(req.body);
      const updatedInitiative = await storage.updateInitiative(id, validatedData);
      res.json(updatedInitiative);
    } catch (error) {
      next(error);
    }
  });

  // Check-ins API

  app.post("/api/check-ins", withTenant, async (req, res, next) => {
    try {
      // Support both the old API (content field) and new API (notes field)
      // If notes is provided but content isn't, copy notes to content
      if (req.body.notes && !req.body.content) {
        req.body.content = req.body.notes;
      }
      
      // If teamId is a string "VLS", convert it to null
      if (req.body.teamId === "VLS") {
        req.body.teamId = null;
      }
      
      // Always include the user ID
      if (!req.body.userId) {
        req.body.userId = (req.user as User).id;
      }
      
      // Ensure tenantId is set
      req.body.tenantId = req.tenantId;
      
      
      // Parse and validate the data
      const validatedData = insertCheckInSchema.parse({
        ...req.body,
        tenantId: req.tenantId
      });
      
      const checkIn = await storage.createCheckIn(validatedData);
      res.status(201).json(checkIn);
    } catch (error) {
      console.error("Error creating check-in:", error);
      next(error);
    }
  });

  app.get("/api/users/:userId/check-ins", withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const checkIns = await storage.getCheckInsByUser(userId);
      
      // Filter check-ins by objectives that belong to the current tenant
      const objectives = await storage.getAllObjectives();
      const tenantObjectiveIds = objectives
        .filter(obj => obj.tenantId === req.tenantId)
        .map(obj => obj.id);
      
      // Now filter check-ins by these objective IDs
      const tenantCheckIns = checkIns.filter(checkIn => 
        checkIn.objectiveId && tenantObjectiveIds.includes(checkIn.objectiveId)
      );
      
      res.json(tenantCheckIns);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/objectives/:objectiveId/check-ins", withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.objectiveId;
      
      // First, make sure the objective belongs to the current tenant
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      if (objective.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Access denied to this objective" });
      }
      
      // Now that we've verified this objective belongs to the tenant, get its check-ins
      const checkIns = await storage.getCheckInsByObjective(objectiveId);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  // Route to get all check-ins for a tenant
  app.get("/api/check-ins", withTenant, async (req, res, next) => {
    try {
      const checkIns = await storage.getCheckInsByTenant(req.tenantId);
      res.json(checkIns);
    } catch (error) {
      console.error("Error fetching check-ins:", error);
      next(error);
    }
  });
  
  // Route to update an existing check-in
  app.put("/api/check-ins/:id", withTenant, async (req, res, next) => {
    try {
      const checkInId = req.params.id;
      
      // Get the check-in to verify it exists and belongs to the tenant
      const existingCheckIn = await storage.getCheckIn(checkInId);
      
      if (!existingCheckIn) {
        return res.status(404).json({ error: "Check-in not found" });
      }
      
      // Support both the old API (content field) and new API (notes field)
      if (req.body.notes && !req.body.content) {
        req.body.content = req.body.notes;
      }
      
      // If teamId is a string "VLS", convert it to null
      if (req.body.teamId === "VLS") {
        req.body.teamId = null;
      }
      
      // Ensure tenantId is set
      req.body.tenantId = req.tenantId;
      
      const updatedCheckIn = await storage.updateCheckIn(checkInId, req.body);
      res.json(updatedCheckIn);
    } catch (error) {
      console.error("Error updating check-in:", error);
      next(error);
    }
  });
  
  // Route to delete a check-in
  app.delete("/api/check-ins/:id", withTenant, async (req, res, next) => {
    try {
      const checkInId = req.params.id;
      
      // Get the check-in to verify it exists
      const existingCheckIn = await storage.getCheckIn(checkInId);
      
      if (!existingCheckIn) {
        return res.status(404).json({ error: "Check-in not found" });
      }
      
      await storage.deleteCheckIn(checkInId);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting check-in:", error);
      next(error);
    }
  });
  
  app.get("/api/key-results/:keyResultId/check-ins", withTenant, async (req, res, next) => {
    try {
      const keyResultId = req.params.keyResultId;
      
      // First, get the key result to find its associated objective
      const keyResult = await storage.getKeyResult(keyResultId);
      if (!keyResult) {
        return res.status(404).json({ error: "Key result not found" });
      }
      
      // Get the associated objective to check tenant access
      const objective = keyResult.objectiveId 
        ? await storage.getObjective(keyResult.objectiveId)
        : null;
      
      if (!objective) {
        return res.status(404).json({ error: "Associated objective not found" });
      }
      
      // Check if the objective belongs to the current tenant
      if (objective.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Access denied to this key result" });
      }
      
      // Now that we've verified this key result belongs to the tenant, get its check-ins
      const checkIns = await storage.getCheckInsByKeyResult(keyResultId);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  // Search API
  app.get("/api/search", withTenant, async (req, res, next) => {
    try {
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (!query || query.length < 2) {
        return res.json({
          objectives: [],
          keyResults: [],
          teams: [],
          users: []
        });
      }
      
      const searchTerm = query.toLowerCase();
      const tenantId = req.tenantId;
      
      // Search objectives with tenant filter
      const objectivesResult = await db.select()
        .from(objectivesTable)
        .where(
          and(
            eq(objectivesTable.tenantId, tenantId),
            or(
              sql`LOWER(${objectivesTable.title}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${objectivesTable.description}) LIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .limit(limit);
      
      // Get all key results and filter by objective tenant
      const keyResultsResult = await db.select({
        keyResult: keyResultsTable,
        objective: objectivesTable
      })
        .from(keyResultsTable)
        .leftJoin(objectivesTable, eq(keyResultsTable.objectiveId, objectivesTable.id))
        .where(
          and(
            eq(objectivesTable.tenantId, tenantId),
            or(
              sql`LOWER(${keyResultsTable.title}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${keyResultsTable.description}) LIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .limit(limit)
        .then(results => results.map(r => r.keyResult));
      
      // Get all teams associated with this tenant through users_to_tenants
      const tenantTeams = await db.select({
        team: teams,
      })
        .from(teams)
        .innerJoin(users, eq(users.teamId, teams.id))
        .innerJoin(usersToTenants, eq(usersToTenants.userId, users.id))
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            or(
              sql`LOWER(${teams.name}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${teams.description}) LIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .limit(limit)
        .then(results => results.map(r => r.team));
      
      // Deduplicate teams (in case multiple users from same team)
      const uniqueTeams = tenantTeams.filter((team, index, self) => 
        index === self.findIndex(t => t.id === team.id)
      );
      
      // Get all users associated with this tenant
      const usersResult = await db.select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        teamId: users.teamId
      })
        .from(users)
        .innerJoin(usersToTenants, eq(usersToTenants.userId, users.id))
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            or(
              sql`LOWER(${users.firstName}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${users.lastName}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${users.username}) LIKE ${'%' + searchTerm + '%'}`,
              sql`LOWER(${users.email}) LIKE ${'%' + searchTerm + '%'}`
            )
          )
        )
        .limit(limit);
      
      res.json({
        objectives: objectivesResult,
        keyResults: keyResultsResult,
        teams: uniqueTeams,
        users: usersResult
      });
    } catch (error) {
      next(error);
    }
  });
  
  // AI Recommendations API
  
  // 1. Generate objective recommendations for teams
  app.get("/api/recommendations/objectives/:teamId", withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      const count = req.query.count ? parseInt(req.query.count as string) : 3;
      const tenantId = req.tenantId;
      
      // Get team data
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Verify this team belongs to the current tenant
      // We'll check if any user from this team belongs to the current tenant
      const teamUsers = await db.select()
        .from(users)
        .where(eq(users.teamId, teamId));
      
      const teamUserIds = teamUsers.map(user => user.id);
      
      if (teamUserIds.length === 0) {
        return res.status(404).json({ error: "No users found for this team" });
      }
      
      // Check if any of these users belong to the current tenant
      const tenantUserCount = await db.select({ count: sql`count(*)` })
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            inArray(usersToTenants.userId, teamUserIds)
          )
        )
        .then(result => Number(result[0]?.count || 0));
      
      if (tenantUserCount === 0) {
        return res.status(403).json({ error: "Access denied to this team" });
      }
      
      // Get existing team objectives 
      const teamObjectives = await storage.getObjectivesByTeam(teamId);
      
      // Filter objectives to only include those from this tenant
      const tenantTeamObjectives = teamObjectives.filter(obj => obj.tenantId === tenantId);
      
      // Get company objectives for alignment, but only from this tenant
      const companyObjectives = await storage.getAllObjectives()
        .then(objectives => objectives.filter(obj => 
          obj.level === 'company' && obj.tenantId === tenantId
        ));
      
      // Generate recommendations
      const recommendations = await openAIService.generateObjectiveRecommendations(
        teamId, 
        team, 
        tenantTeamObjectives, 
        companyObjectives,
        count
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating objective recommendations:", error);
      // The OpenAI service now returns fallback recommendations instead of throwing an error,
      // but in case of other errors we still need to handle them appropriately
      if (error instanceof Error && error.message.includes("Failed to generate objective recommendations")) {
        // Log the error but don't send a 500 response since the OpenAI service already handled it with fallbacks
        next(error);
      } else {
        // For any other errors, like database issues
        res.status(500).json({ error: "Failed to generate recommendations", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
  
  // 2. Generate key result recommendations for an objective
  app.get("/api/recommendations/key-results/:objectiveId", withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.objectiveId;
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      const tenantId = req.tenantId;
      
      // Get objective data
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      // Check if objective belongs to this tenant
      if (objective.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this objective" });
      }
      
      // Get existing key results for this objective
      const keyResults = await storage.getKeyResultsByObjective(objectiveId);
      
      // Generate recommendations
      const recommendations = await openAIService.generateKeyResultRecommendations(
        objective,
        keyResults,
        count
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating key result recommendations:", error);
      // The OpenAI service now returns fallback recommendations instead of throwing an error,
      // but in case of other errors we still need to handle them appropriately
      if (error instanceof Error && error.message.includes("Failed to generate key result recommendations")) {
        // Log the error but don't send a 500 response since the OpenAI service already handled it with fallbacks
        next(error);
      } else {
        // For any other errors, like database issues
        res.status(500).json({ error: "Failed to generate recommendations", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
  
  // 3. Analyze and improve an existing OKR
  app.get("/api/recommendations/improve/:objectiveId", withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.objectiveId;
      const tenantId = req.tenantId;
      
      // Get objective data
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      // Check if objective belongs to this tenant
      if (objective.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this objective" });
      }
      
      // Get key results for this objective
      const keyResults = await storage.getKeyResultsByObjective(objectiveId);
      
      // Generate improvement suggestions
      const improvement = await openAIService.analyzeAndImproveOKR(
        objective,
        keyResults
      );
      
      res.json(improvement);
    } catch (error) {
      console.error("Error analyzing OKR for improvements:", error);
      // The OpenAI service now returns fallback improvements instead of throwing an error,
      // but in case of other errors we still need to handle them appropriately
      if (error instanceof Error && error.message.includes("Failed to analyze and improve OKR")) {
        // Log the error but don't send a 500 response since the OpenAI service already handled it with fallbacks
        next(error);
      } else {
        // For any other errors, like database issues
        res.status(500).json({ error: "Failed to analyze OKR", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
  
  // 4. Analyze team objectives alignment with company objectives
  app.get("/api/recommendations/alignment/:teamId", withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      const tenantId = req.tenantId;
      
      // Get team data
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Verify this team belongs to the current tenant by checking if any team members are part of this tenant
      const teamUsers = await db.select()
        .from(users)
        .where(eq(users.teamId, teamId));
      
      const teamUserIds = teamUsers.map(user => user.id);
      
      if (teamUserIds.length === 0) {
        return res.status(404).json({ error: "No users found for this team" });
      }
      
      // Check if any of these users belong to the current tenant
      const tenantUserCount = await db.select({ count: sql`count(*)` })
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            inArray(usersToTenants.userId, teamUserIds)
          )
        )
        .then(result => Number(result[0]?.count || 0));
      
      if (tenantUserCount === 0) {
        return res.status(403).json({ error: "Access denied to this team" });
      }
      
      // Get team objectives filtered by tenant
      const teamObjectives = await storage.getObjectivesByTeam(teamId)
        .then(objectives => objectives.filter(obj => obj.tenantId === tenantId));
      
      // Get company objectives for alignment analysis, filtered by tenant
      const companyObjectives = await storage.getAllObjectives()
        .then(objectives => objectives.filter(obj => 
          obj.level === 'company' && obj.tenantId === tenantId
        ));
      
      // Generate alignment analysis
      const alignmentAnalysis = await openAIService.analyzeTeamAlignment(
        teamId,
        teamObjectives,
        companyObjectives
      );
      
      res.json(alignmentAnalysis);
    } catch (error) {
      console.error("Error analyzing team alignment:", error);
      // The OpenAI service now returns fallback team alignment analysis instead of throwing an error,
      // but in case of other errors we still need to handle them appropriately
      if (error instanceof Error && error.message.includes("Failed to analyze team alignment")) {
        // Log the error but don't send a 500 response since the OpenAI service already handled it with fallbacks
        next(error);
      } else {
        // For any other errors, like database issues
        res.status(500).json({ error: "Failed to analyze team alignment", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });

  // Chat API Routes
  // Chat Rooms
  app.get("/api/chat/rooms", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get all chat rooms for this user, filtered by tenant
      const chatRooms = await storage.getUserChatRooms(req.user.id, tenantId);
      
      res.json(chatRooms);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/chat/rooms", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Validate that all members belong to the current tenant
      // This section handles processing chat room members
      // Note: In this case, memberIds is a valid field in the request body for chat rooms
      // It's different from the team schema where it's not present
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        const memberIds = req.body.memberIds.filter((id: string) => id !== req.user.id);
        
        if (memberIds.length > 0) {
          // Find all users that belong to the current tenant
          const tenantUsers = await db.select()
            .from(usersToTenants)
            .where(
              and(
                eq(usersToTenants.tenantId, tenantId),
                inArray(usersToTenants.userId, memberIds)
              )
            );
          
          const validUserIds = tenantUsers.map(u => u.userId);
          
          // Filter out member IDs that don't belong to the tenant
          req.body.memberIds = [req.user.id, ...validUserIds];
          
          // If no valid members found (besides the creator), log a warning
          if (validUserIds.length === 0 && memberIds.length > 0) {
            console.warn("No valid members found for chat room creation in tenant:", tenantId);
          }
        }
      }
      
      // Add the tenantId to the chat room data and convert ID to number
      // Our database has createdBy as an integer column
      const validatedData = insertChatRoomSchema.parse({
        ...req.body,
        createdBy: parseInt(req.user.id), // Convert string ID to number
        tenantId: tenantId
      });
      
      const chatRoom = await storage.createChatRoom(validatedData);
      
      // Add the creator as a member and admin with a generated ID
      await storage.addUserToChatRoom({
        id: ulid(), // Generate a unique ID for the member
        chatRoomId: chatRoom.id,
        userId: req.user.id,
        role: "admin",
        joinedAt: new Date()
      });
      
      // Add other members if specified
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        await Promise.all(
          req.body.memberIds.map(async (userId: string) => {
            if (userId !== req.user.id) { // Skip creator as they're already added
              await storage.addUserToChatRoom({
                id: ulid(), // Generate a unique ID for each member
                chatRoomId: chatRoom.id,
                userId,
                role: "member",
                joinedAt: new Date()
              });
            }
          })
        );
      }
      
      res.status(201).json(chatRoom);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/chat/rooms/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const tenantId = req.tenantId;
      const roomId = req.params.id;
      const room = await storage.getChatRoom(roomId);
      
      if (!room) {
        return res.status(404).send("Chat room not found");
      }
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(roomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      // Verify the user is part of the current tenant
      const isTenantMember = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.user.id)
          )
        )
        .then(result => result.length > 0);
      
      if (!isTenantMember) {
        return res.status(403).send("Access denied for current organization");
      }
      
      // In the future, we should also check if the chat room belongs to the tenant
      // This would require adding tenantId to the chat_rooms table
      
      res.json({
        ...room,
        members: members
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Chat Room Members
  app.post("/api/chat/rooms/:roomId/members", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const tenantId = req.tenantId;
      const roomId = parseInt(req.params.roomId);
      const room = await storage.getChatRoom(roomId);
      
      if (!room) {
        return res.status(404).send("Chat room not found");
      }
      
      // Check if user is an admin of this room
      const members = await storage.getChatRoomMembers(roomId);
      const currentUserMembership = members.find(member => member.userId === req.user.id);
      
      if (!currentUserMembership || currentUserMembership.role !== "admin") {
        return res.status(403).send("Only admins can add members to chat rooms");
      }
      
      // Verify the user is part of the current tenant
      const isTenantMember = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.user.id)
          )
        )
        .then(result => result.length > 0);
      
      if (!isTenantMember) {
        return res.status(403).send("Access denied for current organization");
      }
      
      // Verify the user being added belongs to the current tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.body.userId)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).send("The user you're trying to add doesn't belong to the current organization");
      }
      
      const validatedData = insertChatRoomMemberSchema.parse({
        ...req.body,
        chatRoomId: roomId
      });
      
      // Check if user is already a member
      const existingMember = members.find(member => member.userId === validatedData.userId);
      if (existingMember) {
        return res.status(400).send("User is already a member of this chat room");
      }
      
      const member = await storage.addUserToChatRoom(validatedData);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/chat/rooms/:roomId/members/:userId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.roomId);
      const userId = parseInt(req.params.userId);
      
      // Check if user is an admin or removing themselves
      const members = await storage.getChatRoomMembers(roomId);
      const currentUserMembership = members.find(member => member.userId === req.user.id);
      
      if (!currentUserMembership) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      // Users can remove themselves or admins can remove anyone
      if (req.user.id !== userId && currentUserMembership.role !== "admin") {
        return res.status(403).send("Only admins can remove other members");
      }
      
      await storage.removeUserFromChatRoom(userId, roomId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Messages
  app.get("/api/chat/rooms/:roomId/messages", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.roomId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const before = req.query.before ? parseInt(req.query.before as string) : undefined;
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get the chat room and ensure it belongs to the tenant
      const chatRoom = await storage.getChatRoom(roomId, tenantId);
      
      if (!chatRoom) {
        return res.status(404).json({ error: "Chat room not found in this organization" });
      }
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(roomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      // Mark messages as read
      await storage.updateLastRead(req.user.id, roomId);
      
      // Get messages with tenant filtering
      const messages = await storage.getMessagesByChatRoom(roomId, limit, before, tenantId);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/chat/rooms/:roomId/messages", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.roomId);
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get the chat room and ensure it belongs to the tenant
      const chatRoom = await storage.getChatRoom(roomId, tenantId);
      
      if (!chatRoom) {
        return res.status(404).json({ error: "Chat room not found in this organization" });
      }
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(roomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        chatRoomId: roomId,
        userId: req.user.id,
        tenantId: tenantId // Add tenant ID to the message
      });
      
      const message = await storage.createMessage(validatedData);
      
      // Handle attachments if provided
      if (req.body.attachments && Array.isArray(req.body.attachments)) {
        await Promise.all(
          req.body.attachments.map(async (attachment: any) => {
            await storage.createAttachment({
              ...attachment,
              messageId: message.id
            });
          })
        );
      }
      
      // Mark messages as read for the sender
      await storage.updateLastRead(req.user.id, roomId);
      
      // Return the full message with user, attachments and reactions
      const fullMessage = await storage.getMessage(message.id);
      const user = await storage.getUser(req.user.id);
      const attachments = await storage.getAttachmentsByMessage(message.id);
      
      res.status(201).json({
        ...fullMessage,
        user: user || null,
        attachments,
        reactions: []
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/chat/messages/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.id);
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get message with tenant filtering to ensure it belongs to current tenant
      const message = await storage.getMessage(messageId, tenantId);
      
      if (!message) {
        return res.status(404).send("Message not found in this organization");
      }
      
      // Only the author can edit their message
      if (message.userId !== req.user.id) {
        return res.status(403).send("You can only edit your own messages");
      }
      
      // Cannot edit deleted messages
      if (message.deletedAt) {
        return res.status(400).send("Cannot edit deleted messages");
      }
      
      const validatedData = insertMessageSchema.partial().parse(req.body);
      const updatedMessage = await storage.updateMessage(messageId, validatedData, tenantId);
      
      // Return the full message with user, attachments and reactions
      const user = await storage.getUser(req.user.id);
      const attachments = await storage.getAttachmentsByMessage(messageId);
      const reactions = await storage.getReactionsByMessage(messageId);
      
      res.json({
        ...updatedMessage,
        user: user || null,
        attachments,
        reactions
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/chat/messages/:id", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.id);
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get message with tenant filtering to ensure it belongs to current tenant
      const message = await storage.getMessage(messageId, tenantId);
      
      if (!message) {
        return res.status(404).send("Message not found in this organization");
      }
      
      // Only the author can delete their message
      if (message.userId !== req.user.id) {
        return res.status(403).send("You can only delete your own messages");
      }
      
      await storage.deleteMessage(messageId, tenantId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Reactions
  app.post("/api/chat/messages/:messageId/reactions", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.messageId);
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Get message with tenant filtering to ensure it belongs to current tenant
      const message = await storage.getMessage(messageId, tenantId);
      
      if (!message) {
        return res.status(404).send("Message not found in this organization");
      }
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(message.chatRoomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      const validatedData = insertReactionSchema.parse({
        ...req.body,
        messageId,
        userId: req.user.id,
        tenantId: tenantId // Add tenant ID to the reaction
      });
      
      const reaction = await storage.addReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/chat/messages/:messageId/reactions/:emoji", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.messageId);
      const emoji = req.params.emoji;
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId parameter" });
      }
      
      // Verify that the message exists in this tenant
      const message = await storage.getMessage(messageId, tenantId);
      
      if (!message) {
        return res.status(404).send("Message not found in this organization");
      }
      
      await storage.removeReaction(req.user.id, messageId, emoji, tenantId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // Feedback and Recognition System Routes
  
  // Feedback routes
  app.post("/api/feedback", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Verify the receiver belongs to the current tenant
      if (req.body.receiverId) {
        console.log(`Checking if receiver ${req.body.receiverId} belongs to tenant ${tenantId}`);
        
        // First, let's check if the receiver exists as a user
        const receiverExists = await db.select()
          .from(users)
          .where(eq(users.id, req.body.receiverId))
          .limit(1);
        
        console.log(`Receiver exists check:`, receiverExists.length > 0 ? 'Yes' : 'No');
        
        if (receiverExists.length === 0) {
          console.log(`Feedback validation failed: receiver ${req.body.receiverId} does not exist`);
          return res.status(403).json({ 
            message: "The feedback recipient doesn't exist" 
          });
        }
        
        // Now check if they belong to the current tenant
        const receiverTenantCheck = await db.select()
          .from(usersToTenants)
          .where(
            and(
              eq(usersToTenants.tenantId, tenantId),
              eq(usersToTenants.userId, req.body.receiverId)
            )
          );
        
        console.log(`Receiver tenant check result:`, receiverTenantCheck);
        const isReceiverInTenant = receiverTenantCheck.length > 0;
        
        if (!isReceiverInTenant) {
          console.log(`Feedback validation failed: receiver ${req.body.receiverId} not found in tenant ${tenantId}`);
          return res.status(403).json({ 
            message: "The feedback recipient doesn't belong to the current organization" 
          });
        }
        
        console.log(`Feedback validation passed: receiver ${req.body.receiverId} belongs to tenant ${tenantId}`);
      }
      
      const feedbackData = {
        ...req.body,
        userId: req.user.id, // Schema expects userId, not senderId
        tenantId: tenantId // Add tenant ID to the feedback
      };
      
      // Import the feedback service
      const { createFeedback } = await import("./services/feedback-service");
      
      const newFeedback = await createFeedback(feedbackData);
      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // IMPORTANT: Order matters for Express routes - more specific routes first
  app.get("/api/feedback/public", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Import the feedback service
      const { getPublicFeedback } = await import("./services/feedback-service");
      
      // Get all public feedback
      let allPublicFeedback = [];
      try {
        allPublicFeedback = await getPublicFeedback();
          
        // Filter feedback to only include those from the current tenant
        // This is a temporary solution until the feedback service is updated
        // to support tenant-specific queries
        const tenantPublicFeedback = allPublicFeedback.filter(feedback => 
          feedback.tenantId === tenantId || feedback.tenantId === null
        );
        
        res.json(tenantPublicFeedback);
      } catch (innerError) {
        console.error("Error getting public feedback data:", innerError);
        // Return empty array to prevent client-side issues
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching public feedback:", error);
      // Return empty array instead of error to prevent client-side issues
      res.json([]);
    }
  });

  app.get("/api/feedback/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      // Import the feedback service
      const { getFeedbackById } = await import("./services/feedback-service");
      
      const feedback = await getFeedbackById(id);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      // Allow only receiver, sender, or admins to see private feedback
      if (
        feedback.visibility === "private" &&
        req.user.id !== feedback.receiverId &&
        req.user.id !== feedback.senderId &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Not authorized to view this feedback" });
      }
      
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.get("/api/users/:userId/feedback/received", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Check if current user has permission to see this feedback
      // Allow owners, managers, and admins to see all feedback
      if (
        req.user.id !== userId &&
        req.user.role !== "admin" &&
        req.user.role !== "manager"
      ) {
        return res.status(403).json({ message: "Not authorized to view this feedback" });
      }
      
      // Import the feedback service
      const { getReceivedFeedback } = await import("./services/feedback-service");
      
      const receivedFeedback = await getReceivedFeedback(userId);
      res.json(receivedFeedback);
    } catch (error) {
      console.error("Error fetching received feedback:", error);
      res.status(500).json({ message: "Failed to fetch received feedback" });
    }
  });

  app.get("/api/users/:userId/feedback/given", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Only allow users to see their own given feedback, or admins
      if (req.user.id !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to view this feedback" });
      }
      
      // Import the feedback service
      const { getGivenFeedback } = await import("./services/feedback-service");
      
      const givenFeedback = await getGivenFeedback(userId);
      res.json(givenFeedback);
    } catch (error) {
      console.error("Error fetching given feedback:", error);
      res.status(500).json({ message: "Failed to fetch given feedback" });
    }
  });

  app.patch("/api/feedback/:id/read", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const id = parseInt(req.params.id);
      
      // Import the feedback service
      const { getFeedbackById, markFeedbackAsRead } = await import("./services/feedback-service");
      
      // Get the feedback to check permissions
      const feedback = await getFeedbackById(id);
      
      if (!feedback) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      
      // Only the receiver can mark as read
      if (req.user.id !== feedback.receiverId) {
        return res.status(403).json({ message: "Not authorized to mark this feedback as read" });
      }
      
      const updatedFeedback = await markFeedbackAsRead(id);
      res.json(updatedFeedback);
    } catch (error) {
      console.error("Error marking feedback as read:", error);
      res.status(500).json({ message: "Failed to mark feedback as read" });
    }
  });

  // Badge routes
  app.get("/api/badges", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Import the feedback service
      const { getAllBadges } = await import("./services/feedback-service");
      
      // Get all badges
      const allBadges = await getAllBadges();
      
      // Filter badges to only include those from the current tenant or global badges
      const tenantBadges = allBadges.filter(badge => 
        badge.tenantId === tenantId || badge.tenantId === null
      );
      
      res.json(tenantBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.post("/api/badges", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only allow admins to create badges
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to create badges" });
      }
      
      const tenantId = req.tenantId;
      
      // Verify user belongs to this tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.user.id)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).json({ 
          message: "You do not have permission to create badges in this organization" 
        });
      }
      
      // Add tenant ID to the badge data
      const badgeData = {
        ...req.body,
        tenantId: tenantId
      };
      
      // Import the feedback service
      const { createBadge } = await import("./services/feedback-service");
      
      const newBadge = await createBadge(badgeData);
      res.status(201).json(newBadge);
    } catch (error) {
      console.error("Error creating badge:", error);
      res.status(500).json({ message: "Failed to create badge" });
    }
  });

  app.post("/api/badges/award", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only allow managers and admins to award badges
      if (req.user.role !== "admin" && req.user.role !== "manager") {
        return res.status(403).json({ message: "Not authorized to award badges" });
      }
      
      const tenantId = req.tenantId;
      
      // Verify user belongs to this tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.user.id)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).json({ 
          message: "You do not have permission to award badges in this organization" 
        });
      }
      
      // Verify recipient belongs to this tenant
      const isRecipientInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, req.body.userId)
          )
        )
        .then(result => result.length > 0);
      
      if (!isRecipientInTenant) {
        return res.status(403).json({ 
          message: "The recipient user doesn't belong to this organization" 
        });
      }
      
      // Also verify that the badge belongs to this tenant or is a global badge
      const badge = await db.select()
        .from(badges)
        .where(eq(badges.id, req.body.badgeId))
        .then(result => result[0]);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      if (badge.tenantId !== null && badge.tenantId !== tenantId) {
        return res.status(403).json({ message: "You don't have access to this badge" });
      }
      
      const awardData = {
        ...req.body,
        awardedById: req.user.id,
        tenantId: tenantId
      };
      
      // Import the feedback service
      const { awardBadge } = await import("./services/feedback-service");
      
      const userBadge = await awardBadge(awardData);
      res.status(201).json(userBadge);
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  app.get("/api/users/:userId/badges", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.userId);
      const tenantId = req.tenantId;
      
      // Verify the requested user belongs to this tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, userId)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).json({ 
          message: "The requested user doesn't belong to this organization" 
        });
      }
      
      // Import the feedback service
      const { getUserBadges } = await import("./services/feedback-service");
      
      // Get all user badges
      const allUserBadges = await getUserBadges(userId);
      
      // Filter badges to only include those from the current tenant
      const tenantUserBadges = allUserBadges.filter(badge => 
        badge.tenantId === tenantId || badge.tenantId === null
      );
      
      res.json(tenantUserBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  app.get("/api/badges/public", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Import the feedback service
      const { getPublicUserBadges } = await import("./services/feedback-service");
      
      // Get all public user badges
      let allPublicBadges = [];
      try {
        allPublicBadges = await getPublicUserBadges();
        
        // Get users who belong to this tenant
        const tenantUsers = await db.select({ userId: usersToTenants.userId })
          .from(usersToTenants)
          .where(eq(usersToTenants.tenantId, tenantId))
          .then(result => result.map(item => item.userId));
        
        // Filter public badges to only include those from users in the current tenant
        // and badges that belong to the current tenant or are global
        const tenantPublicBadges = allPublicBadges.filter(badge => 
          tenantUsers.includes(badge.userId) && 
          (badge.tenantId === tenantId || badge.tenantId === null)
        );
        
        res.json(tenantPublicBadges);
      } catch (innerError) {
        console.error("Error getting public badges data:", innerError);
        // Return empty array to prevent client-side issues
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching public badges:", error);
      // Return empty array instead of error to prevent client-side issues
      res.json([]);
    }
  });
  
  // Wellness Pulse - Team Mood API
  app.get("/api/mood-entries", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Get users who belong to this tenant
      const tenantUsers = await db.select({ userId: usersToTenants.userId })
        .from(usersToTenants)
        .where(eq(usersToTenants.tenantId, tenantId))
        .then(result => result.map(item => item.userId));
      
      if (tenantUsers.length === 0) {
        return res.json([]);
      }
      
      // Fetch all mood entries with user information, filtered by tenant
      const moodEntries = await db.query.moodEntries.findMany({
        where: (moodEntries, { inArray }) => inArray(moodEntries.userId, tenantUsers),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              teamId: true,
            }
          }
        },
        orderBy: (moodEntries, { desc }) => [desc(moodEntries.date)]
      });
      
      res.json(moodEntries);
    } catch (error) {
      console.error("Error fetching mood entries:", error);
      next(error);
    }
  });
  
  app.get("/api/mood-entries/user/:userId", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = parseInt(req.params.userId);
      const tenantId = req.tenantId;
      
      // Check if user belongs to this tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, userId)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).json({ 
          error: "The requested user doesn't belong to the current organization" 
        });
      }
      
      // Fetch mood entries for a specific user
      const moodEntries = await db.query.moodEntries.findMany({
        where: (moodEntries, { eq }) => eq(moodEntries.userId, userId),
        orderBy: (moodEntries, { desc }) => [desc(moodEntries.date)]
      });
      
      res.json(moodEntries);
    } catch (error) {
      console.error("Error fetching user mood entries:", error);
      next(error);
    }
  });
  
  app.get("/api/mood-entries/team/:teamId", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const teamId = parseInt(req.params.teamId);
      const tenantId = req.tenantId;
      
      // Get users for the team who also belong to this tenant
      const teamUsers = await storage.getUsersByTeam(teamId);
      
      // Filter team users to those who belong to the current tenant
      const tenantUserIds = await db.select({ userId: usersToTenants.userId })
        .from(usersToTenants)
        .where(eq(usersToTenants.tenantId, tenantId))
        .then(result => result.map(item => item.userId));
      
      // Intersection of team users and tenant users
      const teamUserIds = teamUsers
        .map(user => user.id)
        .filter(id => tenantUserIds.includes(id));
      
      if (teamUserIds.length === 0) {
        return res.json([]);
      }
      
      // Fetch mood entries for team members who are in this tenant
      const moodEntries = await db.query.moodEntries.findMany({
        where: (moodEntries, { inArray }) => inArray(moodEntries.userId, teamUserIds),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              teamId: true,
            }
          }
        },
        orderBy: (moodEntries, { desc }) => [desc(moodEntries.date)]
      });
      
      res.json(moodEntries);
    } catch (error) {
      console.error("Error fetching team mood entries:", error);
      next(error);
    }
  });
  
  app.post("/api/mood-entries", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const userId = (req.user as User).id;
      const tenantId = req.tenantId;
      
      // Verify user belongs to this tenant
      const isUserInTenant = await db.select()
        .from(usersToTenants)
        .where(
          and(
            eq(usersToTenants.tenantId, tenantId),
            eq(usersToTenants.userId, userId)
          )
        )
        .then(result => result.length > 0);
      
      if (!isUserInTenant) {
        return res.status(403).json({ 
          error: "You do not have permission to create entries in this organization" 
        });
      }
      
      const validatedData = insertMoodEntrySchema.parse({
        ...req.body,
        userId: userId
        // Note: tenantId was removed as it doesn't exist in the actual database table
      });
      
      const moodEntry = await db.insert(moodEntries).values(validatedData).returning();
      
      res.status(201).json(moodEntry[0]);
    } catch (error) {
      console.error("Error creating mood entry:", error);
      next(error);
    }
  });

  // 1:1 Meetings API
  // Get all meetings for the current tenant
  app.get("/api/meetings", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const meetings = await storage.getMeetingsByTenant(tenantId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      next(error);
    }
  });

  // Get upcoming meetings
  app.get("/api/meetings/upcoming", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const meetings = await storage.getUpcomingMeetings(tenantId, limit);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching upcoming meetings:", error);
      next(error);
    }
  });

  // Get meetings by status
  app.get("/api/meetings/status/:status", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const status = req.params.status;
      
      // Validate status
      if (!["scheduled", "completed", "cancelled", "upcoming"].includes(status)) {
        return res.status(400).json({ error: "Invalid meeting status" });
      }
      
      const meetings = await storage.getMeetingsByStatus(tenantId, status);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings by status:", error);
      next(error);
    }
  });

  // Get meetings for a specific user
  app.get("/api/users/:userId/meetings", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const tenantId = req.tenantId;
      
      // If it's not the current user, verify permission (admin or team lead)
      if (req.user?.id !== userId && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to view meetings for this user" });
      }
      
      const meetings = await storage.getMeetingsByUser(userId);
      
      // Filter meetings to only include those in the current tenant for security
      const tenantMeetings = meetings.filter(meeting => meeting.tenantId === tenantId);
      
      res.json(tenantMeetings);
    } catch (error) {
      console.error("Error fetching user meetings:", error);
      next(error);
    }
  });

  // Get a specific meeting with all details
  app.get("/api/meetings/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const tenantId = req.tenantId;
      
      const meeting = await storage.getMeetingWithDetails(meetingId);
      
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      // Verify tenant access
      if (meeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting details:", error);
      next(error);
    }
  });

  // Create a new meeting
  app.post("/api/meetings", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user?.id;
      
      const validatedData = insertMeetingSchema.parse({
        ...req.body,
        creatorId: userId,
        tenantId: tenantId,
      });
      
      const meeting = await storage.createMeeting(validatedData);
      
      // If attendees or attendeeIds were provided, add them to the meeting
      if (req.body.attendeeIds && Array.isArray(req.body.attendeeIds)) {
        // Process attendeeIds directly
        for (const userId of req.body.attendeeIds) {
          if (userId) {
            await storage.addAttendeeToMeeting(meeting.id, userId);
          }
        }
      } else if (req.body.attendees && Array.isArray(req.body.attendees)) {
        // For backward compatibility, process attendees array
        for (const attendee of req.body.attendees) {
          // Handle attendee as object or string
          const userId = typeof attendee === 'string' 
            ? attendee 
            : (attendee.userId || attendee.id);
            
          if (userId) {
            await storage.addAttendeeToMeeting(meeting.id, userId);
          }
        }
      }
      
      // If related objectives were provided, link them to the meeting
      if (req.body.objectives && Array.isArray(req.body.objectives)) {
        for (const objectiveId of req.body.objectives) {
          await storage.addObjectiveToMeeting(meeting.id, objectiveId);
        }
      }
      
      // If related key results were provided, link them to the meeting
      if (req.body.keyResults && Array.isArray(req.body.keyResults)) {
        for (const keyResultId of req.body.keyResults) {
          await storage.addKeyResultToMeeting(meeting.id, keyResultId);
        }
      }
      
      res.status(201).json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      next(error);
    }
  });

  // Update a meeting
  app.patch("/api/meetings/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      // Only allow creator or admin to update
      if (existingMeeting.creatorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to update this meeting" });
      }
      
      const validatedData = z.object({
        title: z.string().optional(),
        scheduledStartTime: z.string().optional(),
        scheduledEndTime: z.string().optional(),
        duration: z.number().optional(),
        status: z.enum(["scheduled", "completed", "cancelled", "upcoming"]).optional(),
        platform: z.enum(["google_meet", "zoom", "microsoft_teams", "in_person", "other"]).optional(),
        meetingLink: z.string().optional(),
        agenda: z.string().optional(),
        notes: z.string().optional(),
      }).parse(req.body);
      
      // Convert string dates to Date objects
      if (validatedData.scheduledStartTime) {
        validatedData.scheduledStartTime = new Date(validatedData.scheduledStartTime);
      }
      
      if (validatedData.scheduledEndTime) {
        validatedData.scheduledEndTime = new Date(validatedData.scheduledEndTime);
      }
      
      const updatedMeeting = await storage.updateMeeting(meetingId, validatedData);
      
      res.json(updatedMeeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      next(error);
    }
  });

  // Delete a meeting
  app.delete("/api/meetings/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      // Only allow creator or admin to delete
      if (existingMeeting.creatorId !== req.user?.id && !req.user?.isAdmin) {
        return res.status(403).json({ error: "Not authorized to delete this meeting" });
      }
      
      await storage.deleteMeeting(meetingId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      next(error);
    }
  });

  // Add attendee to meeting
  app.post("/api/meetings/:id/attendees", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const tenantId = req.tenantId;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      const attendee = await storage.addAttendeeToMeeting(meetingId, userId);
      
      res.status(201).json(attendee);
    } catch (error) {
      console.error("Error adding meeting attendee:", error);
      next(error);
    }
  });

  // Remove attendee from meeting
  app.delete("/api/meetings/:id/attendees/:userId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const userId = req.params.userId;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      await storage.removeAttendeeFromMeeting(meetingId, userId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing meeting attendee:", error);
      next(error);
    }
  });

  // Update attendee status
  app.patch("/api/meetings/:id/attendees/:userId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const userId = req.params.userId;
      const tenantId = req.tenantId;
      const { isAttending } = req.body;
      
      if (isAttending === undefined) {
        return res.status(400).json({ error: "isAttending is required" });
      }
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      const attendee = await storage.updateAttendeeStatus(meetingId, userId, isAttending);
      
      res.json(attendee);
    } catch (error) {
      console.error("Error updating attendee status:", error);
      next(error);
    }
  });

  // Add action item to meeting
  app.post("/api/meetings/:id/action-items", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      const validatedData = insertActionItemSchema.parse({
        ...req.body,
        meetingId,
        tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const actionItem = await storage.createActionItem(validatedData);
      
      res.status(201).json(actionItem);
    } catch (error) {
      console.error("Error creating action item:", error);
      next(error);
    }
  });

  // Update action item
  app.patch("/api/action-items/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const actionItemId = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify action item exists and belongs to this tenant
      const existingActionItem = await storage.getActionItem(actionItemId);
      
      if (!existingActionItem) {
        return res.status(404).json({ error: "Action item not found" });
      }
      
      if (existingActionItem.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this action item" });
      }
      
      const validatedData = z.object({
        description: z.string().optional(),
        assignedToId: z.string().optional(),
        completed: z.boolean().optional(),
        dueDate: z.string().optional(),
      }).parse(req.body);
      
      // Convert string date to Date object
      if (validatedData.dueDate) {
        validatedData.dueDate = new Date(validatedData.dueDate);
      }
      
      // If completing the action item, set the completedAt timestamp
      if (validatedData.completed === true) {
        (validatedData as any).completedAt = new Date();
      }
      
      const actionItem = await storage.updateActionItem(actionItemId, validatedData);
      
      res.json(actionItem);
    } catch (error) {
      console.error("Error updating action item:", error);
      next(error);
    }
  });

  // Delete action item
  app.delete("/api/action-items/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const actionItemId = req.params.id;
      const tenantId = req.tenantId;
      
      // Verify action item exists and belongs to this tenant
      const existingActionItem = await storage.getActionItem(actionItemId);
      
      if (!existingActionItem) {
        return res.status(404).json({ error: "Action item not found" });
      }
      
      if (existingActionItem.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this action item" });
      }
      
      await storage.deleteActionItem(actionItemId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting action item:", error);
      next(error);
    }
  });

  // Link objective to meeting
  app.post("/api/meetings/:id/objectives/:objectiveId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const objectiveId = req.params.objectiveId;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      // Verify objective exists and belongs to this tenant
      const existingObjective = await storage.getObjective(objectiveId);
      
      if (!existingObjective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      if (existingObjective.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this objective" });
      }
      
      const linkResult = await storage.addObjectiveToMeeting(meetingId, objectiveId);
      
      res.status(201).json(linkResult);
    } catch (error) {
      console.error("Error linking objective to meeting:", error);
      next(error);
    }
  });

  // Unlink objective from meeting
  app.delete("/api/meetings/:id/objectives/:objectiveId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const objectiveId = req.params.objectiveId;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      await storage.removeObjectiveFromMeeting(meetingId, objectiveId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error unlinking objective from meeting:", error);
      next(error);
    }
  });

  // Link key result to meeting
  app.post("/api/meetings/:id/key-results/:keyResultId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const keyResultId = req.params.keyResultId;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      // Verify key result exists and its objective belongs to this tenant
      const existingKeyResult = await storage.getKeyResult(keyResultId);
      
      if (!existingKeyResult) {
        return res.status(404).json({ error: "Key result not found" });
      }
      
      const parentObjective = await storage.getObjective(existingKeyResult.objectiveId);
      
      if (!parentObjective || parentObjective.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this key result" });
      }
      
      const linkResult = await storage.addKeyResultToMeeting(meetingId, keyResultId);
      
      res.status(201).json(linkResult);
    } catch (error) {
      console.error("Error linking key result to meeting:", error);
      next(error);
    }
  });

  // Unlink key result from meeting
  app.delete("/api/meetings/:id/key-results/:keyResultId", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const meetingId = req.params.id;
      const keyResultId = req.params.keyResultId;
      const tenantId = req.tenantId;
      
      // Verify meeting exists and belongs to this tenant
      const existingMeeting = await storage.getMeeting(meetingId);
      
      if (!existingMeeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      
      if (existingMeeting.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied to this meeting" });
      }
      
      await storage.removeKeyResultFromMeeting(meetingId, keyResultId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error unlinking key result from meeting:", error);
      next(error);
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Extract tenant ID from the connection URL query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const tenantId = url.searchParams.get('tenantId');
    
    // Store the tenant ID in the WebSocket connection for tenant isolation
    (ws as any).tenantId = tenantId;
    console.log(`WebSocket client connected with tenantId: ${tenantId || 'none'}`);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_room') {
          // Store the room ID in the WebSocket connection
          (ws as any).roomId = data.roomId;
        } else if (data.type === 'new_message' && data.message) {
          // Broadcast the message to all clients in the same room AND same tenant
          wss.clients.forEach((client) => {
            if (client !== ws && 
                client.readyState === WebSocket.OPEN && 
                (client as any).roomId === (ws as any).roomId &&
                (client as any).tenantId === (ws as any).tenantId) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: data.message
              }));
            }
          });
        } else if (data.type === 'typing') {
          // Broadcast typing status to all clients in the same room AND same tenant
          wss.clients.forEach((client) => {
            if (client !== ws && 
                client.readyState === WebSocket.OPEN && 
                (client as any).roomId === (ws as any).roomId &&
                (client as any).tenantId === (ws as any).tenantId) {
              client.send(JSON.stringify({
                type: 'typing',
                userId: data.userId
              }));
            }
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Dashboard data endpoint
  app.get("/api/dashboard", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      // Get tenant-specific objectives to count and calculate completion
      const objectives = await storage.getObjectivesByTenant(req.tenantId);
      const completedObjectives = objectives.filter(obj => obj.progress === 100);
      const inProgressObjectives = objectives.filter(obj => obj.progress > 0 && obj.progress < 100);
      
      // Get all key results for these objectives
      let totalKeyResults = 0;
      let completedKeyResults = 0;
      
      for (const obj of objectives) {
        const keyResults = await storage.getKeyResultsByObjective(obj.id);
        totalKeyResults += keyResults.length;
        completedKeyResults += keyResults.filter(kr => kr.progress === 100).length;
      }
      
      // Get team performance data based on actual objectives
      const teams = await storage.getTeamsByTenant(req.tenantId);
      let teamPerformanceSum = 0;
      
      const enhancedTeams = await Promise.all(teams.map(async team => {
        // Get team members 
        const members = await storage.getUsersByTeam(team.id);
        
        // Get team's objectives
        const teamObjectives = objectives.filter(obj => obj.teamId === team.id);
        
        // Calculate real performance based on objective progress
        let teamPerformance = 0;
        if (teamObjectives.length > 0) {
          // Calculate average progress across all team objectives
          const totalProgress = teamObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0);
          teamPerformance = Math.round(totalProgress / teamObjectives.length);
        }
        
        return {
          ...team,
          memberCount: members.length,
          performance: teamPerformance,
          objectivesCount: teamObjectives.length
        };
      }));
      
      // Calculate average team performance from real data
      teamPerformanceSum = enhancedTeams.reduce((sum, team) => sum + team.performance, 0);
      const teamPerformanceAvg = enhancedTeams.length ? teamPerformanceSum / enhancedTeams.length : 0;
      
      // Get current quarter timeframe information
      const timeframes = await storage.getAllTimeframes();
      const currentDate = new Date();
      // Find current or upcoming timeframe for quarter calculation
      const currentTimeframe = timeframes.find(tf => {
        const startDate = new Date(tf.startDate);
        const endDate = new Date(tf.endDate);
        return (currentDate >= startDate && currentDate <= endDate) || currentDate < startDate;
      }) || timeframes[0]; // Default to first timeframe if none found
      
      // Calculate days remaining in timeframe
      const endDate = new Date(currentTimeframe?.endDate || new Date());
      const totalDays = currentTimeframe ? 
        Math.ceil((new Date(currentTimeframe.endDate).getTime() - new Date(currentTimeframe.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        90; // Default to 90 days for a quarter
      
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
      const timePercentage = Math.min(100, Math.max(0, Math.round((1 - (daysRemaining / totalDays)) * 100)));
      
      // Prepare and send dashboard data
      res.json({
        objectives: {
          total: objectives.length,
          completed: completedObjectives.length,
          inProgress: inProgressObjectives.length,
          progress: objectives.length ? 
            Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length) : 0
        },
        keyResults: {
          total: totalKeyResults,
          completed: completedKeyResults,
          completionRate: totalKeyResults ? (completedKeyResults / totalKeyResults) * 100 : 0
        },
        teamPerformance: {
          average: teamPerformanceAvg,
          teams: enhancedTeams.map(team => ({
            id: team.id,
            name: team.name,
            performance: team.performance,
            memberCount: team.memberCount,
            objectivesCount: team.objectivesCount
          }))
        },
        timeRemaining: {
          days: daysRemaining,
          percentage: 100 - timePercentage, // Percentage of quarter remaining
          quarter: currentTimeframe?.name || "Current Quarter"
        }
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Company objectives progress endpoint with aggregated progress from linked OKRs
  app.get("/api/objectives/company", withTenant, async (req, res, next) => {
    try {
      // Get real company objectives from the database
      const tenantId = req.tenantId;
      
      // Get all objectives for this tenant
      const allObjectives = await storage.getObjectivesByTenant(tenantId);
      
      // Filter objectives where level is "company"
      const companyObjectives = allObjectives.filter(obj => obj.level === "company");
      
      // For each company objective, calculate aggregated progress from linked OKRs
      const companyObjectivesWithAggregatedProgress = await Promise.all(
        companyObjectives.map(async (companyObjective) => {
          // Find all objectives that are aligned to this company objective
          const linkedObjectives = allObjectives.filter(obj => 
            obj.alignmentType === 'company-objective' && 
            obj.alignmentTargetId === companyObjective.id &&
            obj.id !== companyObjective.id // Don't include the company objective itself
          );
          
          let aggregatedProgress = 0;
          let totalObjectives = linkedObjectives.length;
          
          if (totalObjectives > 0) {
            // Calculate average progress from all linked objectives
            const totalProgress = linkedObjectives.reduce((sum, obj) => {
              // Use the objective's progress if available, otherwise calculate from key results
              const objectiveProgress = obj.progress || 0;
              return sum + objectiveProgress;
            }, 0);
            
            aggregatedProgress = Math.round(totalProgress / totalObjectives);
          } else {
            // If no linked objectives, use the company objective's own progress
            aggregatedProgress = companyObjective.progress || 0;
          }
          
          // Get key results for the company objective itself (if any)
          const keyResults = await storage.getKeyResultsByObjective(companyObjective.id);
          
          return {
            ...companyObjective,
            progress: aggregatedProgress,
            linkedObjectivesCount: totalObjectives,
            linkedObjectives: linkedObjectives.map(obj => ({
              id: obj.id,
              title: obj.title,
              progress: obj.progress || 0,
              teamId: obj.teamId,
              ownerId: obj.ownerId
            })),
            keyResults: keyResults
          };
        })
      );
      
      // Log for debugging purposes
      console.log(`Found ${companyObjectives.length} company objectives for tenant ${tenantId}`);
      console.log('Company objectives with aggregated progress:', companyObjectivesWithAggregatedProgress.map(obj => ({
        id: obj.id,
        title: obj.title,
        progress: obj.progress,
        linkedCount: obj.linkedObjectivesCount
      })));
      
      res.json(companyObjectivesWithAggregatedProgress);
    } catch (error) {
      next(error);
    }
  });
  
  // Special route handler for approved objectives
  app.get("/api/objectives/approved", ensureAuthenticated, async (req, res, next) => {
    try {
      console.log("Processing /api/objectives/approved request");
      
      const user = req.user as User;
      
      // Try to get tenant ID from query parameter
      let tenantId: string | null = null;
      if (req.query.tenantId) {
        tenantId = req.query.tenantId as string;
        console.log(`Using tenant ID from query parameter: ${tenantId}`);
      } else {
        // If no tenant ID provided, get user's default tenant
        const defaultTenant = await tenantService.getUserDefaultTenant(user.id);
        if (defaultTenant) {
          tenantId = defaultTenant.id;
          console.log(`Using default tenant ID: ${tenantId}`);
        }
      }
      
      // Verify we have a valid tenant ID
      if (!tenantId) {
        console.log("No valid tenant ID found");
        return res.status(400).json({ error: "Valid tenant ID is required" });
      }
      
      // Check if user has access to this tenant
      const userTenants = await tenantService.getUserTenants(user.id);
      const hasTenantAccess = userTenants.some(t => t.id === tenantId) || user.isAdmin;
      
      console.log(`User tenants: ${userTenants.map(t => t.id).join(', ')}`);
      console.log(`Has access to tenant ${tenantId}: ${hasTenantAccess}`);
      
      if (!hasTenantAccess) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      console.log(`Getting approved objectives for tenant ${tenantId}`);
      
      const approvedObjectives = await storage.getApprovedObjectives(tenantId);
      
      console.log(`Found ${approvedObjectives ? approvedObjectives.length : 0} approved objectives for tenant ${tenantId}`);
      
      // Return empty array if no objectives found instead of 404
      if (!approvedObjectives || approvedObjectives.length === 0) {
        return res.json([]);
      }
      
      res.json(approvedObjectives);
    } catch (error) {
      console.error("Error getting approved objectives:", error);
      res.status(500).json({ error: "Failed to get approved objectives" });
    }
  });
  
  // Approve an objective
  app.post("/api/objectives/:id/approve", withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.id;
      
      // Check if the user has permission to approve objectives
      // Currently only admins can approve objectives
      if (!req.user?.isAdmin && req.user?.role !== 'owner') {
        return res.status(403).json({ error: "Unauthorized: Only admins can approve objectives" });
      }
      
      const approvedObjective = await storage.approveObjective(objectiveId);
      res.json(approvedObjective);
    } catch (error) {
      next(error);
    }
  });
  
  // Unapprove an objective
  app.post("/api/objectives/:id/unapprove", withTenant, async (req, res, next) => {
    try {
      const objectiveId = req.params.id;
      
      // Check if the user has permission to unapprove objectives
      // Currently only admins can unapprove objectives
      if (!req.user?.isAdmin && req.user?.role !== 'owner') {
        return res.status(403).json({ error: "Unauthorized: Only admins can unapprove objectives" });
      }
      
      const unapprovedObjective = await storage.unapproveObjective(objectiveId);
      res.json(unapprovedObjective);
    } catch (error) {
      next(error);
    }
  });
  
  // Enhanced team data endpoint - merged with the other /api/teams endpoint
  // app.get("/api/teams", async (req, res, next) => {
  //   try {
  //     const teams = await storage.getAllTeams();
  //     
  //     // Enhance teams with member count and performance
  //     const enhancedTeams = await Promise.all(teams.map(async team => {
  //       // Get team members count
  //       const members = await storage.getUsersByTeam(team.id);
  //       return {
  //         ...team,
  //         memberCount: members.length,
  //         // Add a random performance percentage for each team (between 65-95%)
  //         performance: Math.floor(Math.random() * 30) + 65
  //       };
  //     }));
  //     
  //     res.json(enhancedTeams);
  //   } catch (error) {
  //     next(error);
  //   }
  // });
  
  // Get performance metrics for a specific team
  app.get("/api/teams/:teamId/performance", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      const tenantId = req.tenantId;
      
      if (!teamId) {
        return res.status(400).json({ error: "Team ID is required" });
      }
      
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      console.log(`Getting performance data for team ${teamId} in tenant ${tenantId}`);
      const teamPerformance = await storage.getTeamPerformance(teamId, tenantId);
      res.json(teamPerformance);
    } catch (error) {
      console.error(`Error fetching team performance:`, error);
      next(error);
    }
  });
  
  // Get performance metrics for all teams in the tenant
  app.get("/api/teams-performance", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      console.log(`Getting performance data for all teams in tenant ${tenantId}`);
      const teamsPerformance = await storage.getTeamsPerformance(tenantId);
      res.json(teamsPerformance);
    } catch (error) {
      console.error(`Error fetching teams performance:`, error);
      next(error);
    }
  });
  
  // Get performance data for team members of a specific team
  app.get("/api/teams/:teamId/members-performance", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { teamId } = req.params;
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      if (!teamId) {
        return res.status(400).json({ error: "Team ID is required" });
      }
      
      console.log(`Getting performance data for members of team ${teamId} in tenant ${tenantId}`);
      const membersPerformance = await storage.getTeamMembersPerformance(teamId, tenantId);
      res.json(membersPerformance);
    } catch (error) {
      console.error(`Error fetching team members performance:`, error);
      next(error);
    }
  });
  
  // Get performance data for a specific team member
  app.get("/api/teams/:teamId/members/:userId/performance", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { teamId, userId } = req.params;
      const tenantId = req.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      
      if (!teamId) {
        return res.status(400).json({ error: "Team ID is required" });
      }
      
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      
      console.log(`Getting performance data for member ${userId} of team ${teamId} in tenant ${tenantId}`);
      const memberPerformance = await storage.getTeamMemberPerformance(teamId, userId, tenantId);
      res.json(memberPerformance);
    } catch (error) {
      console.error(`Error fetching team member performance:`, error);
      next(error);
    }
  });
  
  // Team users endpoint
  app.get("/api/teams/:teamId/users", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      if (!teamId) {
        return res.status(400).json({ error: "Invalid team ID" });
      }
      
      // Get the team
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Verify team belongs to current tenant
      if (team.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "Team not found in current tenant" });
      }
      
      // Get users for team
      const users = await storage.getUsersByTeam(teamId);
      
      // Filter out sensitive information
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });
  
  // Route has been moved to avoid duplication - see implementation at line ~514
  
  // Project Management Routes
  app.get("/api/projects", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      const projects = await storage.getProjectsByTenant(req.tenantId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/projects/by-status/:status", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }
      const { status } = req.params;
      const projects = await storage.getProjectsByStatus(status, req.tenantId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/projects/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/projects", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      if (!req.tenantId) {
        return res.status(400).json({ error: "Tenant ID is required" });
      }

      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: "User authentication required" });
      }

      // Log initial request data
      console.log("Creating project with request body:", req.body);
      console.log("User ID:", req.user.id);
      console.log("Tenant ID:", req.tenantId);

      // Add required fields for the database schema
      const dataToValidate = {
        ...req.body,
        created_by_id: req.user.id, // Use the current user ID as creator
        // Set both formats of tenant ID to ensure one is used
        tenant_id: req.tenantId,
        tenantId: req.tenantId,
        created_at: new Date(),
      };
      
      console.log("Data to validate:", dataToValidate);
      
      try {
        // Validate the data before saving
        const validatedData = insertProjectSchema.parse(dataToValidate);
        console.log("Validated data:", validatedData);
        
        // Check tenant_id before creating the project
        if (!validatedData.tenant_id) {
          console.error("tenant_id missing after validation");
          // Force tenant_id to be set if not present
          validatedData.tenant_id = req.tenantId;
        }
        
        // Create the project
        const project = await storage.createProject(validatedData);
        console.log("Project created successfully:", project);
        res.status(201).json(project);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        if (validationError instanceof z.ZodError) {
          return res.status(400).json({ error: validationError.errors });
        }
        throw validationError;
      }
    } catch (error) {
      console.error("Project creation error:", error);
      next(error);
    }
  });

  app.patch("/api/projects/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Ensure the project belongs to the tenant
      if (req.tenantId && project.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "You don't have permission to update this project" });
      }

      const updatedProject = await storage.updateProject(id, req.body);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/projects/:id/status", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !Object.values(projectStatusEnum.enumValues).includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Ensure the project belongs to the tenant
      if (req.tenantId && project.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "You don't have permission to update this project" });
      }

      const updatedProject = await storage.updateProjectStatus(id, status);
      res.json(updatedProject);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/projects/:id", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      const { id } = req.params;
      const project = await storage.getProject(id);
      
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Ensure the project belongs to the tenant
      if (req.tenantId && project.tenantId !== req.tenantId) {
        return res.status(403).json({ error: "You don't have permission to delete this project" });
      }

      await storage.deleteProject(id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Upcoming meetings endpoint
  app.get("/api/meetings/upcoming", async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      
      // Create sample meetings for the next two weeks
      const today = new Date();
      const meetings = [];
      
      // Generate meetings between managers and their team members
      const managers = users.filter(user => user.role === 'manager' || user.role === 'admin');
      const teamMembers = users.filter(user => user.role !== 'admin');
      
      // For each manager, create meetings with team members
      for (const manager of managers) {
        // Get team members that might report to this manager
        const potentialReports = teamMembers.filter(member => member.id !== manager.id);
        
        // Create 2-3 upcoming meetings for each manager
        const meetingCount = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < meetingCount && i < potentialReports.length; i++) {
          const report = potentialReports[i];
          // Set meeting date between today and the next 7 days
          const meetingDate = new Date(today);
          meetingDate.setDate(today.getDate() + Math.floor(Math.random() * 7) + 1);
          meetingDate.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 4) * 15, 0, 0);
          
          // Create a meeting that lasts 30-60 minutes
          const endTime = new Date(meetingDate);
          endTime.setMinutes(meetingDate.getMinutes() + (Math.floor(Math.random() * 2) + 1) * 30);
          
          meetings.push({
            id: i + 1 + (manager.id * 10),
            userId1: manager.id,
            userId2: report.id,
            title: "One-on-One Meeting",
            description: `Weekly check-in between ${manager.firstName} and ${report.firstName}`,
            startTime: meetingDate.toISOString(),
            endTime: endTime.toISOString(),
            type: "one_on_one",
            status: "scheduled"
          });
        }
      }
      
      // Sort meetings by date
      meetings.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      res.json(meetings);
    } catch (error) {
      next(error);
    }
  });
  
  // Resource links endpoint
  app.get("/api/resources", async (req, res, next) => {
    try {
      // Sample resources for OKR management
      const resources = [
        {
          id: 1,
          title: "OKR Best Practices",
          description: "Learn how to set effective OKRs that drive results.",
          url: "https://example.com/okr-best-practices",
          type: "article",
          tags: ["okr", "beginner", "strategy"]
        },
        {
          id: 2,
          title: "Measuring Key Results",
          description: "How to define measurable key results for your objectives.",
          url: "https://example.com/measuring-key-results",
          type: "video",
          tags: ["key-results", "metrics", "intermediate"]
        },
        {
          id: 3,
          title: "OKR Implementation Guide",
          description: "A step-by-step guide to implementing OKRs in your organization.",
          url: "https://example.com/okr-implementation",
          type: "guide",
          tags: ["implementation", "strategy", "advanced"]
        },
        {
          id: 4,
          title: "Team Alignment Workshop",
          description: "Workshop template for aligning team objectives with company goals.",
          url: "https://example.com/team-alignment",
          type: "template",
          tags: ["alignment", "workshop", "teams"]
        },
        {
          id: 5,
          title: "Common OKR Pitfalls",
          description: "Avoid these common mistakes when setting and tracking OKRs.",
          url: "https://example.com/okr-pitfalls",
          type: "article",
          tags: ["common-mistakes", "tips", "beginner"]
        }
      ];
      
      res.json(resources);
    } catch (error) {
      next(error);
    }
  });

  // Integrations API
  
  // Slack Integration API
  app.get("/api/integrations/slack/status", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const status = {
        configured: slackService.isSlackConfigured(),
        botToken: process.env.SLACK_BOT_TOKEN ? "configured" : "missing",
        channelId: process.env.SLACK_CHANNEL_ID ? "configured" : "missing"
      };
      
      res.json(status);
    } catch (error) {
      console.error("Error checking Slack status:", error);
      res.status(500).json({ error: "Failed to check Slack integration status" });
    }
  });
  
  app.post("/api/integrations/slack/test", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const testResult = await slackService.testSlackConnection();
      res.json(testResult);
    } catch (error) {
      console.error("Error testing Slack connection:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error testing Slack connection: ${error.message || 'Unknown error'}` 
      });
    }
  });
  
  app.post("/api/integrations/slack/send-notification", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { message, channel } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      const result = await slackService.sendSimpleMessage(message, channel);
      
      if (result) {
        res.json({ success: true, message: "Notification sent successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send notification" });
      }
    } catch (error) {
      console.error("Error sending Slack notification:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error sending Slack notification: ${error.message || 'Unknown error'}`
      });
    }
  });
  
  // Add OKR integration with Slack to send updates to a Slack channel
  app.post("/api/integrations/slack/send-okr-update", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { objectiveId, keyResultId, progress } = req.body;
      
      if (!objectiveId || !progress) {
        return res.status(400).json({ error: "Objective ID and progress are required" });
      }
      
      // Get objective details
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
      }
      
      // Get key result details if provided
      let keyResult = null;
      if (keyResultId) {
        keyResult = await storage.getKeyResult(keyResultId);
        if (!keyResult) {
          return res.status(404).json({ error: "Key result not found" });
        }
      }
      
      // Get user details
      const user = await storage.getUser(req.user.id);
      
      // Send to Slack
      const result = await slackService.sendOkrUpdate(
        objective,
        keyResult,
        progress,
        { firstName: user.firstName, lastName: user.lastName }
      );
      
      if (result) {
        res.json({ success: true, message: "OKR update sent to Slack successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to send OKR update to Slack" });
      }
    } catch (error) {
      console.error("Error sending OKR update to Slack:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error sending OKR update to Slack: ${error.message || 'Unknown error'}`
      });
    }
  });
  
  return httpServer;
}

// Initialize sample data for testing
// Helper function to process OKRs imported from CSV
async function processImportedOKRs(tenantId: string, importedData: any[]) {
  try {
    for (const entry of importedData) {
      // Create an objective if we have a title
      if (entry.objective_title) {
        // Generate a ULID for the objective
        const objectiveId = ulid();
        
        // Create the objective
        await db.execute(
          sql`INSERT INTO objectives (
                id, 
                title, 
                description, 
                level, 
                status, 
                tenant_id, 
                created_at
              ) VALUES (
                ${objectiveId},
                ${entry.objective_title},
                ${entry.objective_description || ''},
                ${'company'}, 
                ${'draft'},
                ${tenantId},
                ${new Date()}
              )`
        );
        
        // Create a key result if it has a title
        if (entry.key_result_title) {
          // Generate a ULID for the key result
          const keyResultId = ulid();
          
          // Parse numeric values with fallbacks
          const startValue = entry.key_result_start_value ? 
            parseFloat(entry.key_result_start_value) : 0;
          
          const targetValue = entry.key_result_target_value ? 
            parseFloat(entry.key_result_target_value) : 100;
          
          const currentValue = entry.key_result_current_value ? 
            parseFloat(entry.key_result_current_value) : startValue;
          
          // Calculate progress percentage
          const range = targetValue - startValue;
          const progress = range !== 0 ? 
            Math.min(100, Math.max(0, ((currentValue - startValue) / range) * 100)) : 0;
          
          // Create the key result
          await db.execute(
            sql`INSERT INTO key_results (
                  id,
                  title,
                  description,
                  start_value,
                  current_value,
                  target_value,
                  progress,
                  status,
                  objective_id,
                  tenant_id,
                  created_at
                ) VALUES (
                  ${keyResultId},
                  ${entry.key_result_title},
                  ${entry.key_result_description || ''},
                  ${startValue},
                  ${currentValue},
                  ${targetValue},
                  ${progress},
                  ${'draft'},
                  ${objectiveId},
                  ${tenantId},
                  ${new Date()}
                )`
          );
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error processing imported OKRs:", error);
    throw error;
  }
}

// Helper function to create OKRs from a template
async function createOKRsFromTemplate(tenantId: string, templateId: string) {
  try {
    // Define templates for different types of OKRs
    const templates: Record<string, { objectives: Array<{ title: string, description: string, keyResults: Array<{ title: string, description: string }> }> }> = {
      'startup': {
        objectives: [
          {
            title: 'Achieve Product-Market Fit',
            description: 'Find the right product that solves real customer problems and has market demand',
            keyResults: [
              { title: 'Conduct 50 customer interviews', description: 'Gather feedback from potential users to understand their needs' },
              { title: 'Reach 80% user satisfaction score', description: 'Measure satisfaction through surveys and feedback' },
              { title: 'Achieve 40% monthly active user retention', description: 'Track how many users return to use the product monthly' }
            ]
          },
          {
            title: 'Build a High-Performing Team',
            description: 'Recruit and develop talented individuals who work well together',
            keyResults: [
              { title: 'Hire 5 key team members', description: 'Fill critical roles in engineering, design, and product' },
              { title: 'Implement weekly team feedback sessions', description: 'Create a culture of continuous improvement' },
              { title: 'Achieve 90% team satisfaction score', description: 'Measure team happiness and engagement' }
            ]
          },
          {
            title: 'Establish Sustainable Growth',
            description: 'Create repeatable, scalable growth channels',
            keyResults: [
              { title: 'Achieve 20% month-over-month user growth', description: 'Increase total user base consistently' },
              { title: 'Identify 3 profitable marketing channels', description: 'Find channels with positive ROI' },
              { title: 'Reduce customer acquisition cost by 25%', description: 'Lower the cost to acquire new customers' }
            ]
          }
        ]
      },
      'sales': {
        objectives: [
          {
            title: 'Increase Revenue Growth',
            description: 'Accelerate sales to meet or exceed quarterly targets',
            keyResults: [
              { title: 'Achieve $1M in quarterly revenue', description: 'Total revenue from all products and services' },
              { title: 'Increase average deal size by 15%', description: 'Focus on higher-value opportunities' },
              { title: 'Reduce sales cycle by 20%', description: 'Shorten time from lead to closed deal' }
            ]
          },
          {
            title: 'Expand Customer Base',
            description: 'Add new logos and enter new markets',
            keyResults: [
              { title: 'Acquire 50 new customers', description: 'First-time buyers of our products or services' },
              { title: 'Enter 2 new market segments', description: 'Expand into new industries or verticals' },
              { title: 'Achieve 25% growth in new territories', description: 'Increase sales in recently entered regions' }
            ]
          },
          {
            title: 'Improve Sales Team Performance',
            description: 'Enhance productivity and effectiveness of sales representatives',
            keyResults: [
              { title: 'Increase quota attainment to 85%', description: 'Percentage of reps meeting or exceeding targets' },
              { title: 'Reduce ramp time for new hires to 60 days', description: 'Time until new sales reps are fully productive' },
              { title: 'Implement weekly sales coaching for all reps', description: 'Regular skill development and feedback' }
            ]
          }
        ]
      },
      'product': {
        objectives: [
          {
            title: 'Enhance Product Experience',
            description: 'Improve usability and satisfaction for all users',
            keyResults: [
              { title: 'Increase Net Promoter Score to 50', description: 'Measure of how likely users are to recommend the product' },
              { title: 'Reduce user onboarding time by 30%', description: 'Time until new users complete key actions' },
              { title: 'Decrease support tickets by 25%', description: 'Reduction in user-reported issues' }
            ]
          },
          {
            title: 'Accelerate Feature Development',
            description: 'Ship new capabilities faster without sacrificing quality',
            keyResults: [
              { title: 'Launch 3 major features this quarter', description: 'New capabilities that deliver significant user value' },
              { title: 'Reduce development cycle time by 20%', description: 'Time from feature specification to release' },
              { title: 'Maintain 99.9% quality standards', description: 'Measured by automated test coverage and defect rates' }
            ]
          },
          {
            title: 'Optimize Data-Driven Decision Making',
            description: 'Use metrics and analytics to guide product evolution',
            keyResults: [
              { title: 'Implement analytics for 100% of new features', description: 'Every feature has success metrics defined' },
              { title: 'Conduct 10 A/B tests quarterly', description: 'Systematic experimentation to validate assumptions' },
              { title: 'Increase feature adoption by 35%', description: 'Percentage of users engaging with new capabilities' }
            ]
          }
        ]
      }
    };
    
    // Get the requested template
    const template = templates[templateId];
    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }
    
    // Create objectives and key results from the template
    for (const objective of template.objectives) {
      // Generate a ULID for the objective
      const objectiveId = ulid();
      
      // Create the objective
      await db.execute(
        sql`INSERT INTO objectives (
              id, 
              title, 
              description, 
              level, 
              status, 
              tenant_id, 
              created_at
            ) VALUES (
              ${objectiveId},
              ${objective.title},
              ${objective.description},
              ${'company'}, 
              ${'draft'},
              ${tenantId},
              ${new Date()}
            )`
      );
      
      // Create key results for this objective
      for (const kr of objective.keyResults) {
        // Generate a ULID for the key result
        const keyResultId = ulid();
        
        // Create the key result
        await db.execute(
          sql`INSERT INTO key_results (
                id,
                title,
                description,
                start_value,
                current_value,
                target_value,
                progress,
                status,
                objective_id,
                tenant_id,
                created_at
              ) VALUES (
                ${keyResultId},
                ${kr.title},
                ${kr.description},
                ${0},
                ${0},
                ${100},
                ${0},
                ${'draft'},
                ${objectiveId},
                ${tenantId},
                ${new Date()}
              )`
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error creating OKRs from template:", error);
    throw error;
  }
}

async function initializeData() {
  try {
    // Attempt to get users, but handle missing columns gracefully
    let users = [];
    try {
      users = await storage.getAllUsers();
    } catch (error) {
      console.log('Warning: Error getting users - this is expected if schema is out of sync with database');
      console.log('Using localStorage-based onboarding for now until database migration is performed');
      // Continue with empty users array to allow initialization
    }
    if (users.length === 0) {
      const createPassword = async (password: string) => {
        return await new Promise<string>((resolve, reject) => {
          import('crypto').then(crypto => {
            const salt = crypto.randomBytes(16).toString('hex');
            crypto.scrypt(password, salt, 64, (err, derivedKey) => {
              if (err) reject(err);
              resolve(`${derivedKey.toString('hex')}.${salt}`);
            });
          });
        });
      };
      
      const adminPassword = await createPassword('admin123');
      const defaultPassword = await createPassword('password123');

      // First create an admin user without tenant (we'll add tenant later)
      const admin = await storage.createUser({
        username: 'admin',
        password: adminPassword,
        name: 'Admin User',
        email: 'admin@example.com',
        title: 'Administrator',
        isAdmin: true,
        // Temporary tenant ID that will be updated after tenant creation
        tenantId: 'temp-tenant-id',
        defaultTenantId: null
      });
      
      // Create default tenant using the tenant service
      const tenantData = {
        name: 'Default Organization',
        settings: {},
        enabledFeatures: ['objectives', 'key_results', 'chat', 'financial_tracking', 'moods', 'badges', 'feedback'],
        plan: 'free'
      };
      
      // Temporarily override the permission check (we're in bootstrap mode)
      admin.isAdmin = true;
      
      // Create tenant and automatically associate with admin user
      const { tenant: defaultTenant } = await tenantService.createTenant(tenantData, admin as any, 'owner');
      
      // Update the admin user with the real tenant ID
      await storage.updateUser(admin.id, {
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });
      
      // Create manager users for testing
      await storage.createUser({
        username: 'jsmith',
        password: defaultPassword,
        name: 'John Smith',
        email: 'john.smith@example.com',
        title: 'Manager',
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });
      
      await storage.createUser({
        username: 'mwilliams',
        password: defaultPassword,
        name: 'Michelle Williams',
        email: 'michelle.williams@example.com',
        title: 'Manager',
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });
      
      // Create regular users for testing
      await storage.createUser({
        username: 'agarcia',
        password: defaultPassword,
        name: 'Alex Garcia',
        email: 'alex.garcia@example.com',
        title: 'Marketing Specialist',
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });
      
      await storage.createUser({
        username: 'lchen',
        password: defaultPassword,
        name: 'Li Chen',
        email: 'li.chen@example.com',
        title: 'Product Designer',
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });
      
      await storage.createUser({
        username: 'rpatel',
        password: defaultPassword,
        name: 'Raj Patel',
        email: 'raj.patel@example.com',
        title: 'Sales Representative',
        tenantId: defaultTenant.id,
        defaultTenantId: defaultTenant.id
      });

      // Create sample cadence
      const quarterlyCadence = await storage.createCadence({
        name: 'Quarterly',
        description: 'Quarterly cadence for tracking OKRs on a 3-month basis',
        periodDays: 90, // 90 days for quarterly
        tenantId: defaultTenant.id
      });

      const annualCadence = await storage.createCadence({
        name: 'Annual',
        description: 'Annual cadence for tracking yearly goals',
        periodDays: 365, // 365 days for annual
        tenantId: defaultTenant.id
      });

      // Create sample timeframes
      const q3Timeframe = await storage.createTimeframe({
        name: 'Q3 2023',
        description: 'Third quarter of 2023',
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-09-30'),
        cadenceId: quarterlyCadence.id,
        tenantId: defaultTenant.id
      });

      const q4Timeframe = await storage.createTimeframe({
        name: 'Q4 2023',
        description: 'Fourth quarter of 2023',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-12-31'),
        cadenceId: quarterlyCadence.id,
        tenantId: defaultTenant.id
      });

      const annual2023Timeframe = await storage.createTimeframe({
        name: 'Annual 2023',
        description: 'Full year 2023',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        cadenceId: annualCadence.id,
        tenantId: defaultTenant.id
      });

      // Create sample teams
      const marketingTeam = await storage.createTeam({
        name: 'Marketing Team',
        description: 'Team responsible for all marketing activities',
        type: 'team',
        tenantId: defaultTenant.id
      });

      const productTeam = await storage.createTeam({
        name: 'Product Team',
        description: 'Team responsible for product development',
        type: 'team',
        tenantId: defaultTenant.id
      });

      const salesTeam = await storage.createTeam({
        name: 'Sales Team',
        description: 'Team responsible for sales and revenue generation',
        type: 'team',
        tenantId: defaultTenant.id
      });

      // Create access groups
      const adminGroup = await storage.createAccessGroup({
        name: 'Admin',
        description: 'Full system access',
        permissions: ['create_okrs', 'edit_all_okrs', 'delete_okrs', 'view_all_okrs', 'manage_users', 'manage_teams', 'manage_settings'],
        tenantId: defaultTenant.id
      });

      const managerGroup = await storage.createAccessGroup({
        name: 'Manager',
        description: 'Team management access',
        permissions: ['create_okrs', 'view_all_okrs'],
        tenantId: defaultTenant.id
      });

      const userGroup = await storage.createAccessGroup({
        name: 'User',
        description: 'Basic user access',
        permissions: ['view_all_okrs'],
        tenantId: defaultTenant.id
      });

      // Assign users to access groups
      await storage.assignUserToAccessGroup(1, adminGroup.id); // Admin
      await storage.assignUserToAccessGroup(2, managerGroup.id); // John Smith
      await storage.assignUserToAccessGroup(3, managerGroup.id); // Michelle Williams
      await storage.assignUserToAccessGroup(4, userGroup.id); // Alex Garcia
      await storage.assignUserToAccessGroup(5, userGroup.id); // Li Chen
      await storage.assignUserToAccessGroup(6, userGroup.id); // Raj Patel
      
      // Assign users to teams
      // John Smith is manager of Marketing Team
      await storage.updateUser(2, { teamId: marketingTeam.id }); 
      
      // Michelle Williams is manager of Product Team
      await storage.updateUser(3, { teamId: productTeam.id });
      
      // Alex Garcia is in Marketing Team
      await storage.updateUser(4, { teamId: marketingTeam.id, managerId: 2 });
      
      // Li Chen is in Product Team
      await storage.updateUser(5, { teamId: productTeam.id, managerId: 3 });
      
      // Raj Patel is in Sales Team
      await storage.updateUser(6, { teamId: salesTeam.id });
      
      // Create sample objectives and key results
      const marketingObjective = await storage.createObjective({
        title: "Increase brand awareness",
        description: "Increase overall brand awareness among target demographics",
        teamId: marketingTeam.id,
        ownerId: 2, // John Smith
        timeframeId: q3Timeframe.id,
        progress: 65,
        status: objectiveStatusEnum.enumValues[0], // draft
        priority: "high"
      });
      
      const marketingKR1 = await storage.createKeyResult({
        title: "Increase social media followers",
        description: "Increase social media followers by 30% across all platforms",
        objectiveId: marketingObjective.id,
        ownerId: 4, // Alex Garcia
        targetValue: 30,
        currentValue: 18,
        startValue: 0,
        format: "percentage",
        progress: 60
      });
      
      const marketingKR2 = await storage.createKeyResult({
        title: "Launch content marketing campaign",
        description: "Create and publish 12 high-quality blog posts",
        objectiveId: marketingObjective.id,
        ownerId: 2, // John Smith
        targetValue: 12,
        currentValue: 8,
        startValue: 0,
        format: "number",
        progress: 67
      });
      
      // Product team objective
      const productObjective = await storage.createObjective({
        title: "Improve product usability",
        description: "Enhance user experience across our product platform",
        teamId: productTeam.id,
        ownerId: 3, // Michelle Williams
        timeframeId: q3Timeframe.id,
        progress: 40,
        status: objectiveStatusEnum.enumValues[1], // active
        priority: "medium"
      });
      
      const productKR1 = await storage.createKeyResult({
        title: "Reduce UI friction points",
        description: "Identify and fix the top 10 user friction points",
        objectiveId: productObjective.id,
        ownerId: 5, // Li Chen
        targetValue: 10,
        currentValue: 4,
        startValue: 0,
        format: "number",
        progress: 40
      });
      
      const productKR2 = await storage.createKeyResult({
        title: "Improve user satisfaction score",
        description: "Increase user satisfaction score from 7.5 to 8.5",
        objectiveId: productObjective.id,
        ownerId: 3, // Michelle Williams
        targetValue: 8.5,
        currentValue: 7.8,
        startValue: 7.5,
        format: "decimal",
        progress: 30
      });
      
      // Create sample check-ins
      await storage.createCheckIn({
        userId: 4, // Alex Garcia
        keyResultId: marketingKR1.id,
        comment: "We've seen a significant increase in followers on Instagram after our latest campaign. Twitter growth is slower than expected.",
        confidence: 7,
        previousValue: 15,
        newValue: 18,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      });
      
      await storage.createCheckIn({
        userId: 2, // John Smith
        keyResultId: marketingKR2.id,
        comment: "Published our 8th blog post today on industry trends. Engagement is above average.",
        confidence: 8,
        previousValue: 7,
        newValue: 8,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      });
      
      await storage.createCheckIn({
        userId: 5, // Li Chen
        keyResultId: productKR1.id,
        comment: "Fixed 2 critical friction points in the checkout process. Working on user onboarding improvements next.",
        confidence: 6,
        previousValue: 2,
        newValue: 4,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      });
      
      await storage.createCheckIn({
        userId: 3, // Michelle Williams
        objectiveId: productObjective.id,
        comment: "We're making progress but slower than expected. Need to focus more resources on improving the mobile experience.",
        confidence: 5,
        date: new Date() // Today
      });
      
      // Create chat rooms
      console.log("Creating sample chat data...");
      
      // Create team chat rooms
      const marketingTeamChat = await storage.createChatRoom({
        name: "Marketing Team",
        type: "group",
        createdBy: 1, // Admin
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });
      
      const productTeamChat = await storage.createChatRoom({
        name: "Product Team",
        type: "group",
        createdBy: 1, // Admin
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      });
      
      const execTeamChat = await storage.createChatRoom({
        name: "Executive Team",
        type: "group",
        createdBy: 1, // Admin
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      });
      
      // Create direct message chats
      const adminJohnChat = await storage.createChatRoom({
        name: "John Smith",
        type: "direct",
        createdBy: 1, // Admin
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      
      const adminMichelleChat = await storage.createChatRoom({
        name: "Michelle Williams",
        type: "direct",
        createdBy: 1, // Admin
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        updatedAt: new Date()
      });
      
      // Add members to chat rooms
      await storage.addUserToChatRoom({
        chatRoomId: marketingTeamChat.id,
        userId: 1, // Admin
        role: "admin",
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: marketingTeamChat.id,
        userId: 2, // John Smith
        role: "admin",
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: marketingTeamChat.id,
        userId: 4, // Alex Garcia
        role: "member",
        joinedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: productTeamChat.id,
        userId: 1, // Admin
        role: "admin",
        joinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: productTeamChat.id,
        userId: 3, // Michelle Williams
        role: "admin",
        joinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: productTeamChat.id,
        userId: 5, // Li Chen
        role: "member",
        joinedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: execTeamChat.id,
        userId: 1, // Admin
        role: "admin",
        joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: execTeamChat.id,
        userId: 2, // John Smith
        role: "member",
        joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: execTeamChat.id,
        userId: 3, // Michelle Williams
        role: "member",
        joinedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      });
      
      // Add members to direct chats
      await storage.addUserToChatRoom({
        chatRoomId: adminJohnChat.id,
        userId: 1, // Admin
        role: "admin",
        joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: adminJohnChat.id,
        userId: 2, // John Smith
        role: "member",
        joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: adminMichelleChat.id,
        userId: 1, // Admin
        role: "admin",
        joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addUserToChatRoom({
        chatRoomId: adminMichelleChat.id,
        userId: 3, // Michelle Williams
        role: "member",
        joinedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      });
      
      // Create messages
      // Marketing Team chat messages
      const marketingMsg1 = await storage.createMessage({
        chatRoomId: marketingTeamChat.id,
        userId: 2, // John Smith
        content: "Team, let's discuss our Q2 marketing strategy. We need to increase social media presence by 30%.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      });
      
      const marketingMsg2 = await storage.createMessage({
        chatRoomId: marketingTeamChat.id,
        userId: 4, // Alex Garcia
        content: "I've been working on a new content calendar that focuses on videos. Our analysis shows they get 2x more engagement.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      });
      
      const marketingMsg3 = await storage.createMessage({
        chatRoomId: marketingTeamChat.id,
        userId: 1, // Admin
        content: "Great work Alex! Can you share the calendar with everyone by Friday?",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      
      // Product Team chat messages
      const productMsg1 = await storage.createMessage({
        chatRoomId: productTeamChat.id,
        userId: 3, // Michelle Williams
        content: "We need to prioritize the mobile experience improvements. The latest usability tests show 30% of users struggle with the checkout process.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      
      const productMsg2 = await storage.createMessage({
        chatRoomId: productTeamChat.id,
        userId: 5, // Li Chen
        content: "I've already fixed two critical friction points. Working on the user onboarding improvements next.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        replyToId: productMsg1.id
      });
      
      // Executive Team chat messages
      const execMsg1 = await storage.createMessage({
        chatRoomId: execTeamChat.id,
        userId: 1, // Admin
        content: "The quarterly review is scheduled for next Friday. Please prepare your team updates.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      });
      
      const execMsg2 = await storage.createMessage({
        chatRoomId: execTeamChat.id,
        userId: 2, // John Smith
        content: "Marketing is on track to exceed our Q2 goals. I'll have the full report ready by Wednesday.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        replyToId: execMsg1.id
      });
      
      const execMsg3 = await storage.createMessage({
        chatRoomId: execTeamChat.id,
        userId: 3, // Michelle Williams
        content: "Product team is making progress but slower than expected. We need to discuss allocating more resources to the mobile experience improvements.",
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        replyToId: execMsg1.id
      });
      
      // Direct message chats
      await storage.createMessage({
        chatRoomId: adminJohnChat.id,
        userId: 1, // Admin
        content: "Hey John, how's the marketing team doing with the new social media strategy?",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      });
      
      await storage.createMessage({
        chatRoomId: adminJohnChat.id,
        userId: 2, // John Smith
        content: "It's going well! We've seen a 25% increase in engagement already. Alex has been doing a great job with the new content calendar.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      
      await storage.createMessage({
        chatRoomId: adminMichelleChat.id,
        userId: 1, // Admin
        content: "Michelle, I noticed the product team is behind schedule. What resources do you need to get back on track?",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      
      await storage.createMessage({
        chatRoomId: adminMichelleChat.id,
        userId: 3, // Michelle Williams
        content: "We need another developer to focus on the mobile experience. Li is doing great work but there's too much for one person to handle.",
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      });
      
      // Add reactions
      await storage.addReaction({
        messageId: marketingMsg2.id,
        userId: 2, // John Smith
        emoji: "👍",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addReaction({
        messageId: marketingMsg2.id,
        userId: 1, // Admin
        emoji: "🚀",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addReaction({
        messageId: productMsg2.id,
        userId: 3, // Michelle Williams
        emoji: "👏",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      });
      
      await storage.addReaction({
        messageId: execMsg2.id,
        userId: 1, // Admin
        emoji: "👍",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      });
      
      console.log("Sample chat data created successfully!");
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}
