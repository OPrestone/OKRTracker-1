import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertObjectiveSchema, insertKeyResultSchema, insertInitiativeSchema, insertCheckInSchema,
         insertTeamSchema, insertCadenceSchema, insertTimeframeSchema, insertAccessGroupSchema,
         insertChatRoomSchema, insertChatRoomMemberSchema, insertMessageSchema, 
         insertAttachmentSchema, insertReactionSchema,
         users, teams, objectives as objectivesTable, keyResults as keyResultsTable, 
         statusEnum } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { or, sql } from "drizzle-orm";
import { openAIService } from "./services/openai-service";
import { WebSocketServer, WebSocket } from "ws";

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
  
  app.patch("/api/cadences/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCadenceSchema.partial().parse(req.body);
      const updatedCadence = await storage.updateCadence(id, validatedData);
      res.json(updatedCadence);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/cadences/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
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
  
  app.patch("/api/timeframes/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTimeframeSchema.partial().parse(req.body);
      const updatedTimeframe = await storage.updateTimeframe(id, validatedData);
      res.json(updatedTimeframe);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/timeframes/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
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

  // Search API
  app.get("/api/search", async (req, res, next) => {
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
      
      // Search objectives
      const objectivesResult = await db.select()
        .from(objectivesTable)
        .where(
          or(
            sql`LOWER(${objectivesTable.title}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${objectivesTable.description}) LIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(limit);
      
      // Search key results
      const keyResultsResult = await db.select()
        .from(keyResultsTable)
        .where(
          or(
            sql`LOWER(${keyResultsTable.title}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${keyResultsTable.description}) LIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(limit);
      
      // Search teams
      const teamsResult = await db.select()
        .from(teams)
        .where(
          or(
            sql`LOWER(${teams.name}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${teams.description}) LIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(limit);
      
      // Search users
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
        .where(
          or(
            sql`LOWER(${users.firstName}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${users.lastName}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${users.username}) LIKE ${'%' + searchTerm + '%'}`,
            sql`LOWER(${users.email}) LIKE ${'%' + searchTerm + '%'}`
          )
        )
        .limit(limit);
      
      res.json({
        objectives: objectivesResult,
        keyResults: keyResultsResult,
        teams: teamsResult,
        users: usersResult
      });
    } catch (error) {
      next(error);
    }
  });
  
  // AI Recommendations API
  
  // 1. Generate objective recommendations for teams
  app.get("/api/recommendations/objectives/:teamId", async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const count = req.query.count ? parseInt(req.query.count as string) : 3;
      
      // Get team data
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Get existing team objectives 
      const teamObjectives = await storage.getObjectivesByTeam(teamId);
      
      // Get company objectives for alignment
      const companyObjectives = await storage.getAllObjectives().then(
        objectives => objectives.filter(obj => obj.level === 'company')
      );
      
      // Generate recommendations
      const recommendations = await openAIService.generateObjectiveRecommendations(
        teamId, 
        team, 
        teamObjectives, 
        companyObjectives,
        count
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating objective recommendations:", error);
      next(error);
    }
  });
  
  // 2. Generate key result recommendations for an objective
  app.get("/api/recommendations/key-results/:objectiveId", async (req, res, next) => {
    try {
      const objectiveId = parseInt(req.params.objectiveId);
      const count = req.query.count ? parseInt(req.query.count as string) : 5;
      
      // Get objective data
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
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
      next(error);
    }
  });
  
  // 3. Analyze and improve an existing OKR
  app.get("/api/recommendations/improve/:objectiveId", async (req, res, next) => {
    try {
      const objectiveId = parseInt(req.params.objectiveId);
      
      // Get objective data
      const objective = await storage.getObjective(objectiveId);
      if (!objective) {
        return res.status(404).json({ error: "Objective not found" });
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
      next(error);
    }
  });
  
  // 4. Analyze team objectives alignment with company objectives
  app.get("/api/recommendations/alignment/:teamId", async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      // Get team data
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }
      
      // Get team objectives 
      const teamObjectives = await storage.getObjectivesByTeam(teamId);
      
      // Get company objectives for alignment analysis
      const companyObjectives = await storage.getAllObjectives().then(
        objectives => objectives.filter(obj => obj.level === 'company')
      );
      
      // Generate alignment analysis
      const alignmentAnalysis = await openAIService.analyzeTeamAlignment(
        teamId,
        teamObjectives,
        companyObjectives
      );
      
      res.json(alignmentAnalysis);
    } catch (error) {
      console.error("Error analyzing team alignment:", error);
      next(error);
    }
  });

  // Chat API Routes
  // Chat Rooms
  app.get("/api/chat/rooms", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const chatRooms = await storage.getUserChatRooms(req.user.id);
      res.json(chatRooms);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/chat/rooms", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const validatedData = insertChatRoomSchema.parse({
        ...req.body,
        createdBy: req.user.id
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
  
  app.get("/api/chat/rooms/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
      const roomId = parseInt(req.params.id);
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
      
      res.json({
        ...room,
        members: members
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Chat Room Members
  app.post("/api/chat/rooms/:roomId/members", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Unauthorized");
      }
      
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

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_room') {
          // Store the room ID in the WebSocket connection
          (ws as any).roomId = data.roomId;
        } else if (data.type === 'new_message' && data.message) {
          // Broadcast the message to all clients in the same room
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN && (client as any).roomId === (ws as any).roomId) {
              client.send(JSON.stringify({
                type: 'new_message',
                message: data.message
              }));
            }
          });
        } else if (data.type === 'typing') {
          // Broadcast typing status to all clients in the same room
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN && (client as any).roomId === (ws as any).roomId) {
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

  return httpServer;
}

// Initialize sample data for testing
async function initializeData() {
  try {
    // Create admin user if no users exist
    const users = await storage.getAllUsers();
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

      const admin = await storage.createUser({
        username: 'admin',
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin',
        language: 'en'
      });
      
      // Create manager users for testing
      await storage.createUser({
        username: 'jsmith',
        password: defaultPassword,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        role: 'manager',
        language: 'en'
      });
      
      await storage.createUser({
        username: 'mwilliams',
        password: defaultPassword,
        firstName: 'Michelle',
        lastName: 'Williams',
        email: 'michelle.williams@example.com',
        role: 'manager',
        language: 'en'
      });
      
      // Create regular users for testing
      await storage.createUser({
        username: 'agarcia',
        password: defaultPassword,
        firstName: 'Alex',
        lastName: 'Garcia',
        email: 'alex.garcia@example.com',
        role: 'user',
        language: 'es'
      });
      
      await storage.createUser({
        username: 'lchen',
        password: defaultPassword,
        firstName: 'Li',
        lastName: 'Chen',
        email: 'li.chen@example.com',
        role: 'user',
        language: 'en'
      });
      
      await storage.createUser({
        username: 'rpatel',
        password: defaultPassword,
        firstName: 'Raj',
        lastName: 'Patel',
        email: 'raj.patel@example.com',
        role: 'user',
        language: 'en'
      });

      // Create sample cadence
      const quarterlyCadence = await storage.createCadence({
        name: 'Quarterly',
        description: 'Quarterly cadence for tracking OKRs on a 3-month basis',
        period: 'quarterly',
        startMonth: 1
      });

      const annualCadence = await storage.createCadence({
        name: 'Annual',
        description: 'Annual cadence for tracking yearly goals',
        period: 'annual',
        startMonth: 1
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
        status: statusEnum.enumValues[0], // on_track
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
        status: statusEnum.enumValues[1], // at_risk
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
