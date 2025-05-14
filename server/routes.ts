import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertObjectiveSchema, insertKeyResultSchema, insertInitiativeSchema, insertCheckInSchema,
         insertTeamSchema, insertCadenceSchema, insertTimeframeSchema, insertAccessGroupSchema,
         insertChatRoomSchema, insertChatRoomMemberSchema, insertMessageSchema, 
         insertAttachmentSchema, insertReactionSchema, insertFeedbackSchema, insertBadgeSchema, insertUserBadgeSchema,
         insertTeamMoodSchema, insertTenantSchema, insertMoodEntrySchema, users, teams, objectives as objectivesTable, 
         keyResults as keyResultsTable, teamMoods, moodEntries, objectiveStatusEnum, User, usersToTenants,
         timeframes, cadences, cycles, insertCycleSchema, insertMeetingSchema, insertMeetingToUserSchema, insertMeetingToObjectiveSchema, 
         insertMeetingToKeyResultSchema, insertActionItemSchema, meetingStatusEnum, meetingPlatformEnum } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { or, sql, and, eq, inArray } from "drizzle-orm";
import { openAIService } from "./services/openai-service";
import { slackService } from "./services/slack-service";
import { stripeService } from "./services/stripe-service";
import { tenantService } from "./services/tenant-service";
import { WebSocketServer, WebSocket } from "ws";
import { setupTestAuthRoutes } from "./test-auth";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);
  
  // Setup test auth routes for debugging session issues
  setupTestAuthRoutes(app);

  // Initialize data
  initializeData();
  
  // Middleware to ensure user is authenticated
  const ensureAuthenticated = (req: Request, res: any, next: any) => {
    console.log("Checking authentication:", req.path, 
                "isAuthenticated:", req.isAuthenticated(),
                "sessionID:", req.sessionID,
                "user:", req.user?.id || "none");

    if (req.isAuthenticated()) {
      return next();
    }
    
    console.log("Unauthorized access to", req.path);
    res.status(401).json({ error: "Unauthorized" });
  };
  
  // Middleware to extract the current tenant ID from request and ensure user has access
  const withTenant = async (req: Request, res: any, next: any) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = req.user as User;
      
      // Try to get tenant ID from:
      // 1. Query parameter: ?tenantId=ABC123
      // 2. URL path parameter in routes like /tenants/:tenantId/...
      // 3. User's default tenant
      let tenantId: string | null = null;
      
      if (req.query.tenantId) {
        tenantId = req.query.tenantId as string;
      } else if (req.params.tenantId) {
        tenantId = req.params.tenantId;
      } else if (req.path.includes('/tenants/')) {
        // Extract tenant ID from path like /tenants/ABC123/something
        const match = req.path.match(/\/tenants\/([^\/]+)/);
        if (match && match[1]) {
          tenantId = match[1];
        }
      }
      
      // If no tenant ID found, get user's default tenant
      if (!tenantId) {
        const defaultTenant = await tenantService.getUserDefaultTenant(user.id);
        if (defaultTenant) {
          tenantId = defaultTenant.id;
        }
      }
      
      // If we still don't have a valid tenant ID, return error
      if (!tenantId) {
        return res.status(400).json({ error: "Valid tenant ID is required" });
      }
      
      // Check if user has access to this tenant
      const userTenants = await tenantService.getUserTenants(user.id);
      const hasTenantAccess = userTenants.some(t => t.id === tenantId) || user.isAdmin;
      
      if (!hasTenantAccess) {
        return res.status(403).json({ error: "You do not have access to this tenant" });
      }
      
      // Store tenant ID in request for use in route handlers
      req.tenantId = tenantId;
      
      next();
    } catch (error) {
      console.error("Error in tenant middleware:", error);
      res.status(500).json({ error: "Failed to process tenant context" });
    }
  };
  
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
      const validatedData = insertTenantSchema.omit({ slug: true }).parse(req.body);
      
      const { tenant, userToTenant } = await tenantService.createTenant(
        validatedData,
        user,
        "owner"
      );
      
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

  app.post("/api/teams", ensureAuthenticated, withTenant, async (req, res, next) => {
    try {
      console.log(`Creating team for tenant: ${req.tenantId}, owner: ${req.user.id}`);
      
      // Use the owner ID from the authenticated user
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        ownerId: req.user.id // This links the team to a user in this tenant
      });
      
      const team = await storage.createTeam(validatedData);
      console.log(`Created team: ${team.id} with name: ${team.name}`);
      res.status(201).json(team);
    } catch (error) {
      console.error('Error creating team:', error);
      next(error);
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
      
      // Check if user is authorized (can only edit own profile unless admin)
      if (req.user?.id !== id && !(req.user as User).isAdmin) {
        return res.status(403).send("Not authorized to update this user");
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

  // Access Groups API
  app.get("/api/access-groups", async (req, res, next) => {
    try {
      const accessGroups = await storage.getAllAccessGroups();
      res.json(accessGroups);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/access-groups", async (req, res, next) => {
    try {
      const validatedData = insertAccessGroupSchema.parse(req.body);
      const accessGroup = await storage.createAccessGroup(validatedData);
      res.status(201).json(accessGroup);
    } catch (error) {
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
      if (!(currentUser.isAdmin || currentUser.role === "admin")) {
        return res.status(403).json({ error: "Forbidden - Admin access required to delete users" });
      }
      
      const userId = req.params.userId;
      
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
          eq(usersToTenants.tenantId, req.tenantId)
        ))
        .limit(1);
      
      if (userInTenant.length === 0) {
        return res.status(403).json({ error: "User does not belong to current tenant" });
      }
      
      // User can only be deleted by an admin of the same tenant
      // First, check if current user is admin in this tenant
      const adminInTenant = await db
        .select()
        .from(usersToTenants)
        .where(and(
          eq(usersToTenants.userId, currentUser.id),
          eq(usersToTenants.tenantId, req.tenantId),
          eq(usersToTenants.role, "admin")
        ))
        .limit(1);
      
      if (adminInTenant.length === 0 && !currentUser.isAdmin) {
        return res.status(403).json({ error: "You do not have admin permissions in this tenant" });
      }
      
      await storage.deleteUser(userId);
      
      res.status(200).json({ success: true, message: "User deleted successfully" });
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
      
      // Fetch all cadences for now as tenant_id column doesn't exist in the database yet
      // Once the database schema is updated with tenant_id, we'll filter by tenant
      const cadencesList = await db.select().from(cadences);
      
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
  app.get("/api/timeframes", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Fetch all timeframes for now as tenant_id column doesn't exist in the database yet
      // Once the database schema is updated with tenant_id, we'll filter by tenant
      const timeframesList = await db.select().from(timeframes);
      
      res.json(timeframesList);
    } catch (error) {
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
      
      // Verify the cadence belongs to the current tenant
      const cadence = await storage.getCadence(cadenceId);
      if (!cadence) {
        return res.status(404).json({ error: "Cadence not found" });
      }
      
      if (cadence.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Fetch timeframes for the specific cadence and current tenant
      // Only filter by cadenceId since tenant_id column doesn't exist in timeframes table
      const timeframesList = await db.select()
        .from(timeframes)
        .where(eq(timeframes.cadenceId, cadenceId));
      
      res.json(timeframesList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/timeframes", withTenant, async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const tenantId = req.tenantId;
      
      // Add tenant ID to the timeframe data
      const validatedData = insertTimeframeSchema.parse({
        ...req.body,
        tenantId
      });
      
      // If cadenceId is provided, verify it belongs to the current tenant
      if (validatedData.cadenceId) {
        const cadence = await storage.getCadence(validatedData.cadenceId);
        if (!cadence) {
          return res.status(404).json({ error: "Cadence not found" });
        }
        
        if (cadence.tenantId !== tenantId) {
          return res.status(403).json({ error: "Access denied to the selected cadence" });
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
      
      const validatedData = insertTimeframeSchema.partial().parse(req.body);
      
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
      
      // Verify the timeframe belongs to the current tenant
      const timeframe = await storage.getTimeframe(id);
      if (!timeframe) {
        return res.status(404).json({ error: "Timeframe not found" });
      }
      
      if (timeframe.tenantId !== tenantId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Check if timeframe has objectives
      const objectives = await storage.getObjectivesByTimeframe(id);
      if (objectives.length > 0) {
        return res.status(400).json({ 
          error: "Cannot delete timeframe with associated objectives" 
        });
      }
      
      await storage.deleteTimeframe(id);
      res.status(204).end();
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
  app.get("/api/objectives", withTenant, async (req, res, next) => {
    try {
      // Filter objectives by current tenant ID
      const tenantId = req.tenantId;
      const objectives = await storage.getObjectivesByTenant(tenantId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/objectives", withTenant, async (req, res, next) => {
    try {
      // Make a copy of the request body to potentially modify date fields
      const requestData = { ...req.body };
      
      // Assign the tenant ID from middleware
      requestData.tenantId = req.tenantId;
      
      // Check if the user is an admin or owner of the tenant
      const userId = req.user.id;
      const tenantId = req.tenantId;
      
      // Get user's role in the tenant
      const userTenants = await tenantService.getUserTenants(userId);
      const userTenant = userTenants.find(t => t.id === tenantId);
      
      // Only allow objective creation if user is admin or owner
      if (!userTenant || (userTenant.userRole !== 'owner' && userTenant.userRole !== 'admin' && !req.user.isAdmin)) {
        return res.status(403).json({ 
          error: "Unauthorized. Only organization owners and admins can create objectives."
        });
      }
      
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
      
      const validatedData = insertObjectiveSchema.parse(requestData);
      const objective = await storage.createObjective(validatedData);
      res.status(201).json(objective);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/objectives/:id", withTenant, async (req, res, next) => {
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
      
      const validatedData = insertObjectiveSchema.partial().parse(requestData);
      const updatedObjective = await storage.updateObjective(id, validatedData);
      res.json(updatedObjective);
    } catch (error) {
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

  app.get("/api/teams/:teamId/objectives", withTenant, async (req, res, next) => {
    try {
      const teamId = req.params.teamId;
      const objectives = await storage.getObjectivesByTeam(teamId);
      
      // Filter objectives by current tenant
      const tenantObjectives = objectives.filter(obj => obj.tenantId === req.tenantId);
      
      res.json(tenantObjectives);
    } catch (error) {
      next(error);
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
  app.get("/api/objectives/:objectiveId/key-results", async (req, res, next) => {
    try {
      const objectiveId = req.params.objectiveId;
      const keyResults = await storage.getKeyResultsByObjective(objectiveId);
      res.json(keyResults);
    } catch (error) {
      next(error);
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
  app.get("/api/check-ins", withTenant, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const checkIns = await storage.getRecentCheckIns(limit);
      
      // Filter check-ins by objectives that belong to the current tenant
      // We need to get the objectives first
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
      
      // Get all chat rooms for this user
      const chatRooms = await storage.getUserChatRooms(req.user.id);
      
      // Filter chat rooms to only include those that belong to current tenant
      // This requires a tenantId field to be added to the chat_rooms table
      // For now, we'll assume all chat rooms belong to the current tenant
      // In a production environment, we'd filter by tenantId
      // const tenantChatRooms = chatRooms.filter(room => room.tenantId === tenantId);
      
      // TEMPORARY SOLUTION - Just return all chat rooms
      // This needs to be updated when tenantId is added to chat_rooms table
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
      
      // Validate that all members belong to the current tenant
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        const memberIds = req.body.memberIds.filter((id: number) => id !== req.user.id);
        
        if (memberIds.length > 0) {
          // Check if these users belong to the current tenant
          const tenantUsersCount = await db.select({ count: sql`count(*)` })
            .from(usersToTenants)
            .where(
              and(
                eq(usersToTenants.tenantId, tenantId),
                inArray(usersToTenants.userId, memberIds)
              )
            )
            .then(result => Number(result[0]?.count || 0));
          
          // If the count doesn't match the number of requested members, some users don't belong to this tenant
          if (tenantUsersCount !== memberIds.length) {
            return res.status(403).json({ error: "Some users don't belong to the current organization" });
          }
        }
      }
      
      // We need to add tenantId to the chatRoom schema
      // For now, we'll assume the schema has been updated to include tenantId
      // This would be a migration to add the tenantId field to the chat_rooms table
      const validatedData = insertChatRoomSchema.parse({
        ...req.body,
        createdBy: req.user.id,
        // tenantId: tenantId // Uncomment when schema is updated
      });
      
      const chatRoom = await storage.createChatRoom(validatedData);
      
      // Add the creator as a member and admin
      await storage.addUserToChatRoom({
        chatRoomId: chatRoom.id,
        userId: req.user.id,
        role: "admin"
      });
      
      // Add other members if specified
      if (req.body.memberIds && Array.isArray(req.body.memberIds)) {
        await Promise.all(
          req.body.memberIds.map(async (userId: number) => {
            if (userId !== req.user.id) { // Skip creator as they're already added
              await storage.addUserToChatRoom({
                chatRoomId: chatRoom.id,
                userId,
                role: "member"
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
  app.get("/api/chat/rooms/:roomId/messages", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.roomId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const before = req.query.before ? parseInt(req.query.before as string) : undefined;
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(roomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      // Mark messages as read
      await storage.updateLastRead(req.user.id, roomId);
      
      const messages = await storage.getMessagesByChatRoom(roomId, limit, before);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/chat/rooms/:roomId/messages", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.roomId);
      
      // Check if user is a member of this room
      const members = await storage.getChatRoomMembers(roomId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).send("You don't have access to this chat room");
      }
      
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        chatRoomId: roomId,
        userId: req.user.id
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
  
  app.patch("/api/chat/messages/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).send("Message not found");
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
      const updatedMessage = await storage.updateMessage(messageId, validatedData);
      
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
  
  app.delete("/api/chat/messages/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).send("Message not found");
      }
      
      // Only the author can delete their message
      if (message.userId !== req.user.id) {
        return res.status(403).send("You can only delete your own messages");
      }
      
      await storage.deleteMessage(messageId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Reactions
  app.post("/api/chat/messages/:messageId/reactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.messageId);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).send("Message not found");
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
        userId: req.user.id
      });
      
      const reaction = await storage.addReaction(validatedData);
      res.status(201).json(reaction);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/chat/messages/:messageId/reactions/:emoji", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const messageId = parseInt(req.params.messageId);
      const emoji = req.params.emoji;
      
      await storage.removeReaction(req.user.id, messageId, emoji);
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
        const isReceiverInTenant = await db.select()
          .from(usersToTenants)
          .where(
            and(
              eq(usersToTenants.tenantId, tenantId),
              eq(usersToTenants.userId, req.body.receiverId)
            )
          )
          .then(result => result.length > 0);
        
        if (!isReceiverInTenant) {
          return res.status(403).json({ 
            message: "The feedback recipient doesn't belong to the current organization" 
          });
        }
      }
      
      const feedbackData = {
        ...req.body,
        senderId: req.user.id,
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
      const allPublicFeedback = await getPublicFeedback();
      
      // Filter feedback to only include those from the current tenant
      // This is a temporary solution until the feedback service is updated
      // to support tenant-specific queries
      const tenantPublicFeedback = allPublicFeedback.filter(feedback => 
        feedback.tenantId === tenantId || feedback.tenantId === null
      );
      
      res.json(tenantPublicFeedback);
    } catch (error) {
      console.error("Error fetching public feedback:", error);
      res.status(500).json({ message: "Failed to fetch public feedback" });
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
      const allPublicBadges = await getPublicUserBadges();
      
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
    } catch (error) {
      console.error("Error fetching public badges:", error);
      res.status(500).json({ message: "Failed to fetch public badges" });
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
  app.get("/api/dashboard", async (req, res, next) => {
    try {
      // Get all objectives to count and calculate completion
      const objectives = await storage.getAllObjectives();
      const completedObjectives = objectives.filter(obj => obj.progress === 100);
      const inProgressObjectives = objectives.filter(obj => obj.progress > 0 && obj.progress < 100);
      
      // Get all key results
      let totalKeyResults = 0;
      let completedKeyResults = 0;
      
      for (const obj of objectives) {
        const keyResults = await storage.getKeyResultsByObjective(obj.id);
        totalKeyResults += keyResults.length;
        completedKeyResults += keyResults.filter(kr => kr.progress === 100).length;
      }
      
      // Get team performance data
      const teams = await storage.getAllTeams();
      let teamPerformanceSum = 0;
      
      const enhancedTeams = await Promise.all(teams.map(async team => {
        // Get team members count
        const members = await storage.getUsersByTeam(team.id);
        return {
          ...team,
          memberCount: members.length,
          // Add a random performance percentage for each team (between 65-95%)
          performance: Math.floor(Math.random() * 30) + 65
        };
      }));
      
      // Calculate average team performance
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
          improvement: Math.floor(Math.random() * 10) + 5 // Random improvement percentage (5-15%)
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
  
  // Company objectives progress endpoint
  app.get("/api/objectives/company", async (req, res, next) => {
    try {
      // Create sample company objectives with progress for display
      const sampleCompanyObjectives = [
        {
          id: 101,
          title: "Increase global market share by 15%",
          progress: 75,
          description: "Drive expansion in key markets through strategic partnerships and targeted marketing",
          status: "on_track"
        },
        {
          id: 102,
          title: "Improve overall customer satisfaction score to 90%",
          progress: 60,
          description: "Enhance product quality and customer support experience",
          status: "on_track"
        },
        {
          id: 103,
          title: "Develop and launch 3 innovative products",
          progress: 40,
          description: "Expand product portfolio with cutting-edge solutions",
          status: "at_risk"
        },
        {
          id: 104,
          title: "Reduce operational costs by 10%",
          progress: 85,
          description: "Optimize internal processes and resource allocation",
          status: "on_track"
        },
        {
          id: 105,
          title: "Increase employee engagement score to 85%",
          progress: 65,
          description: "Enhance workplace culture and professional development opportunities",
          status: "on_track"
        }
      ];
      
      res.json(sampleCompanyObjectives);
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
