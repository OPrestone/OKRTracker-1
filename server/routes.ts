import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertObjectiveSchema, insertKeyResultSchema, insertInitiativeSchema, insertCheckInSchema,
         insertTeamSchema, insertCadenceSchema, insertTimeframeSchema, insertAccessGroupSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  setupAuth(app);

  // Initialize data
  initializeData();

  // Teams API
  app.get("/api/teams", async (req, res, next) => {
    try {
      const teams = await storage.getAllTeams();
      res.json(teams);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/teams", async (req, res, next) => {
    try {
      const validatedData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/teams/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const team = await storage.getTeam(id);
      if (!team) {
        return res.status(404).send("Team not found");
      }
      res.json(team);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/teams/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTeamSchema.partial().parse(req.body);
      const updatedTeam = await storage.updateTeam(id, validatedData);
      res.json(updatedTeam);
    } catch (error) {
      next(error);
    }
  });

  // Users API
  app.get("/api/users", async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      // Don't return passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).send("User not found");
      }
      // Don't return the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/teams/:teamId/users", async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const users = await storage.getUsersByTeam(teamId);
      // Don't return passwords
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

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
      const userId = parseInt(req.params.userId);
      const accessGroupId = parseInt(req.params.accessGroupId);
      await storage.assignUserToAccessGroup(userId, accessGroupId);
      res.status(201).send("User assigned to access group");
    } catch (error) {
      next(error);
    }
  });

  // Cadences API
  app.get("/api/cadences", async (req, res, next) => {
    try {
      const cadences = await storage.getAllCadences();
      res.json(cadences);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/cadences", async (req, res, next) => {
    try {
      const validatedData = insertCadenceSchema.parse(req.body);
      const cadence = await storage.createCadence(validatedData);
      res.status(201).json(cadence);
    } catch (error) {
      next(error);
    }
  });

  // Timeframes API
  app.get("/api/timeframes", async (req, res, next) => {
    try {
      const timeframes = await storage.getAllTimeframes();
      res.json(timeframes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/timeframes", async (req, res, next) => {
    try {
      const validatedData = insertTimeframeSchema.parse(req.body);
      const timeframe = await storage.createTimeframe(validatedData);
      res.status(201).json(timeframe);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/cadences/:cadenceId/timeframes", async (req, res, next) => {
    try {
      const cadenceId = parseInt(req.params.cadenceId);
      const timeframes = await storage.getTimeframesByCadence(cadenceId);
      res.json(timeframes);
    } catch (error) {
      next(error);
    }
  });

  // Objectives API
  app.get("/api/objectives", async (req, res, next) => {
    try {
      const objectives = await storage.getAllObjectives();
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/objectives", async (req, res, next) => {
    try {
      const validatedData = insertObjectiveSchema.parse(req.body);
      const objective = await storage.createObjective(validatedData);
      res.status(201).json(objective);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/objectives/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const objective = await storage.getObjective(id);
      if (!objective) {
        return res.status(404).send("Objective not found");
      }
      res.json(objective);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/objectives/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertObjectiveSchema.partial().parse(req.body);
      const updatedObjective = await storage.updateObjective(id, validatedData);
      res.json(updatedObjective);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:userId/objectives", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const objectives = await storage.getObjectivesByOwner(userId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/teams/:teamId/objectives", async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const objectives = await storage.getObjectivesByTeam(teamId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/timeframes/:timeframeId/objectives", async (req, res, next) => {
    try {
      const timeframeId = parseInt(req.params.timeframeId);
      const objectives = await storage.getObjectivesByTimeframe(timeframeId);
      res.json(objectives);
    } catch (error) {
      next(error);
    }
  });

  // Key Results API
  app.get("/api/objectives/:objectiveId/key-results", async (req, res, next) => {
    try {
      const objectiveId = parseInt(req.params.objectiveId);
      const keyResults = await storage.getKeyResultsByObjective(objectiveId);
      res.json(keyResults);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/key-results", async (req, res, next) => {
    try {
      const validatedData = insertKeyResultSchema.parse(req.body);
      const keyResult = await storage.createKeyResult(validatedData);
      res.status(201).json(keyResult);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/key-results/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const keyResult = await storage.getKeyResult(id);
      if (!keyResult) {
        return res.status(404).send("Key Result not found");
      }
      res.json(keyResult);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/key-results/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertKeyResultSchema.partial().parse(req.body);
      const updatedKeyResult = await storage.updateKeyResult(id, validatedData);
      res.json(updatedKeyResult);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/key-results/:id/progress", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const { progress } = z.object({ progress: z.number().min(0).max(100) }).parse(req.body);
      const updatedKeyResult = await storage.updateKeyResultProgress(id, progress);
      res.json(updatedKeyResult);
    } catch (error) {
      next(error);
    }
  });

  // Initiatives API
  app.get("/api/key-results/:keyResultId/initiatives", async (req, res, next) => {
    try {
      const keyResultId = parseInt(req.params.keyResultId);
      const initiatives = await storage.getInitiativesByKeyResult(keyResultId);
      res.json(initiatives);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/initiatives", async (req, res, next) => {
    try {
      const validatedData = insertInitiativeSchema.parse(req.body);
      const initiative = await storage.createInitiative(validatedData);
      res.status(201).json(initiative);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/initiatives/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInitiativeSchema.partial().parse(req.body);
      const updatedInitiative = await storage.updateInitiative(id, validatedData);
      res.json(updatedInitiative);
    } catch (error) {
      next(error);
    }
  });

  // Check-ins API
  app.get("/api/check-ins", async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const checkIns = await storage.getRecentCheckIns(limit);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/check-ins", async (req, res, next) => {
    try {
      const validatedData = insertCheckInSchema.parse(req.body);
      const checkIn = await storage.createCheckIn(validatedData);
      res.status(201).json(checkIn);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/users/:userId/check-ins", async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const checkIns = await storage.getCheckInsByUser(userId);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/objectives/:objectiveId/check-ins", async (req, res, next) => {
    try {
      const objectiveId = parseInt(req.params.objectiveId);
      const checkIns = await storage.getCheckInsByObjective(objectiveId);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/key-results/:keyResultId/check-ins", async (req, res, next) => {
    try {
      const keyResultId = parseInt(req.params.keyResultId);
      const checkIns = await storage.getCheckInsByKeyResult(keyResultId);
      res.json(checkIns);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize sample data for testing
async function initializeData() {
  try {
    // Create admin user if no users exist
    const users = await storage.getAllUsers();
    if (users.length === 0) {
      const adminPassword = await new Promise<string>((resolve, reject) => {
        import('crypto').then(crypto => {
          const salt = crypto.randomBytes(16).toString('hex');
          crypto.scrypt('admin123', salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${derivedKey.toString('hex')}.${salt}`);
          });
        });
      });

      await storage.createUser({
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin',
        language: 'en'
      });

      // Create sample cadence
      const quarterlyCadence = await storage.createCadence({
        name: 'Quarterly',
        description: 'Quarterly cadence for tracking OKRs on a 3-month basis'
      });

      const annualCadence = await storage.createCadence({
        name: 'Annual',
        description: 'Annual cadence for tracking yearly goals'
      });

      // Create sample timeframes
      const q3Timeframe = await storage.createTimeframe({
        name: 'Q3 2023',
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-09-30'),
        cadenceId: quarterlyCadence.id
      });

      const q4Timeframe = await storage.createTimeframe({
        name: 'Q4 2023',
        startDate: new Date('2023-10-01'),
        endDate: new Date('2023-12-31'),
        cadenceId: quarterlyCadence.id
      });

      const annual2023Timeframe = await storage.createTimeframe({
        name: 'Annual 2023',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
        cadenceId: annualCadence.id
      });

      // Create sample teams
      const marketingTeam = await storage.createTeam({
        name: 'Marketing Team',
        description: 'Team responsible for all marketing activities',
        color: '#3B82F6',
        icon: 'building'
      });

      const productTeam = await storage.createTeam({
        name: 'Product Team',
        description: 'Team responsible for product development',
        color: '#8B5CF6',
        icon: 'code-box'
      });

      const salesTeam = await storage.createTeam({
        name: 'Sales Team',
        description: 'Team responsible for sales and revenue generation',
        color: '#10B981',
        icon: 'line-chart'
      });

      // Create access groups
      const adminGroup = await storage.createAccessGroup({
        name: 'Admin',
        description: 'Full system access',
        permissions: {
          createOKRs: true,
          editAllOKRs: true,
          deleteOKRs: true,
          viewAllOKRs: true,
          manageUsers: true,
          manageTeams: true,
          manageSettings: true
        }
      });

      const managerGroup = await storage.createAccessGroup({
        name: 'Manager',
        description: 'Team management access',
        permissions: {
          createOKRs: true,
          editAllOKRs: false,
          deleteOKRs: false,
          viewAllOKRs: true,
          manageUsers: false,
          manageTeams: false,
          manageSettings: false
        }
      });

      const userGroup = await storage.createAccessGroup({
        name: 'User',
        description: 'Basic user access',
        permissions: {
          createOKRs: false,
          editAllOKRs: false,
          deleteOKRs: false,
          viewAllOKRs: true,
          manageUsers: false,
          manageTeams: false,
          manageSettings: false
        }
      });

      // Assign admin to admin group
      await storage.assignUserToAccessGroup(1, adminGroup.id);
    }
  } catch (error) {
    console.error("Error initializing data:", error);
  }
}
