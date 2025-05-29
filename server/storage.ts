import { users, User, InsertUser, teams, Team, InsertTeam, accessGroups, AccessGroup, InsertAccessGroup, 
         cadences, Cadence, InsertCadence, timeframes, Timeframe, InsertTimeframe,
         objectives, Objective, InsertObjective, keyResults, KeyResult, InsertKeyResult,
         initiatives, Initiative, InsertInitiative, checkIns, CheckIn, InsertCheckIn, userAccessGroups,
         chatRooms, ChatRoom, InsertChatRoom, chatRoomMembers, ChatRoomMember, InsertChatRoomMember,
         messages, Message, InsertMessage, attachments, Attachment, InsertAttachment,
         reactions, Reaction, InsertReaction, tenants, Tenant, usersToTenants,
         meetings, Meeting, InsertMeeting, meetingsToUsers, MeetingToUser, InsertMeetingToUser,
         meetingsToObjectives, MeetingToObjective, InsertMeetingToObjective,
         meetingsToKeyResults, MeetingToKeyResult, InsertMeetingToKeyResult,
         actionItems, ActionItem, InsertActionItem,
         projects, Project, InsertProject,
         userProgress, UserProgress, InsertUserProgress } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, count, inArray, isNull, gt, lt, ne, sql } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User Management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByTeam(teamId: string): Promise<User[]>;
  getUserTenants(userId: string): Promise<Array<Tenant & { userRole?: string, isDefault?: boolean }>>;
  updateLastLogin(userId: string): Promise<void>;
  
  // User Progress Tracking
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getUserProgress(id: string): Promise<UserProgress | undefined>;
  getUserProgressByUserAndObjective(userId: string, objectiveId: string): Promise<UserProgress | undefined>;
  getUserObjectivesProgress(userId: string, tenantId: string): Promise<UserProgress[]>;
  updateUserProgress(id: string, progress: Partial<InsertUserProgress>): Promise<UserProgress>;
  
  // Team Management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByParent(parentId: string): Promise<Team[]>;
  getTeamsByTenant(tenantId: string): Promise<Team[]>;
  getTeamPerformance(teamId: string, tenantId: string): Promise<any>;
  getTeamsPerformance(tenantId: string): Promise<any[]>;
  getTeamMemberPerformance(teamId: string, userId: string, tenantId: string): Promise<any>;
  getTeamMembersPerformance(teamId: string, tenantId: string): Promise<any[]>;
  addUserToTeam(userId: string, teamId: string): Promise<User>;
  removeUserFromTeam(userId: string): Promise<User>;
  
  // Project Management
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByStatus(status: string, tenantId: string): Promise<Project[]>;
  getProjectsByTenant(tenantId: string): Promise<Project[]>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  updateProjectStatus(id: string, status: string): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Meeting Management
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  getMeetingWithDetails(id: string): Promise<Meeting & { 
    attendees: Array<User & { isAttending: boolean }>,
    relatedObjectives: Objective[],
    relatedKeyResults: KeyResult[],
    actionItems: ActionItem[]
  } | undefined>;
  getMeetingsByTenant(tenantId: string): Promise<Meeting[]>;
  getMeetingsByUser(userId: string): Promise<Meeting[]>;
  getMeetingsByStatus(tenantId: string, status: string): Promise<Meeting[]>;
  getUpcomingMeetings(tenantId: string, limit?: number): Promise<Meeting[]>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;
  
  // Meeting Attendees
  addAttendeeToMeeting(meetingId: string, userId: string): Promise<MeetingToUser>;
  removeAttendeeFromMeeting(meetingId: string, userId: string): Promise<void>;
  updateAttendeeStatus(meetingId: string, userId: string, isAttending: boolean): Promise<MeetingToUser>;
  getMeetingAttendees(meetingId: string): Promise<Array<User & { isAttending: boolean }>>;
  
  // Meeting Action Items
  createActionItem(actionItem: InsertActionItem): Promise<ActionItem>;
  getActionItem(id: string): Promise<ActionItem | undefined>;
  getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]>;
  getActionItemsByUser(userId: string): Promise<ActionItem[]>;
  updateActionItem(id: string, actionItem: Partial<InsertActionItem>): Promise<ActionItem>;
  deleteActionItem(id: string): Promise<void>;
  completeActionItem(id: string): Promise<ActionItem>;
  
  // Meeting Related OKRs
  addObjectiveToMeeting(meetingId: string, objectiveId: string): Promise<MeetingToObjective>;
  removeObjectiveFromMeeting(meetingId: string, objectiveId: string): Promise<void>;
  addKeyResultToMeeting(meetingId: string, keyResultId: string): Promise<MeetingToKeyResult>;
  removeKeyResultFromMeeting(meetingId: string, keyResultId: string): Promise<void>;
  getMeetingObjectives(meetingId: string): Promise<Objective[]>;
  getMeetingKeyResults(meetingId: string): Promise<KeyResult[]>;
  
  // Access Groups
  createAccessGroup(accessGroup: InsertAccessGroup): Promise<AccessGroup>;
  getAccessGroup(id: string): Promise<AccessGroup | undefined>;
  updateAccessGroup(id: string, accessGroup: Partial<InsertAccessGroup>): Promise<AccessGroup>;
  getAllAccessGroups(): Promise<AccessGroup[]>;
  assignUserToAccessGroup(userId: string, accessGroupId: string): Promise<void>;
  
  // Cadences
  createCadence(cadence: InsertCadence): Promise<Cadence>;
  getCadence(id: string): Promise<Cadence | undefined>;
  getAllCadences(): Promise<Cadence[]>;
  getCadencesByTenant(tenantId: string): Promise<Cadence[]>;
  
  // Timeframes
  createTimeframe(timeframe: InsertTimeframe): Promise<Timeframe>;
  getTimeframe(id: string): Promise<Timeframe | undefined>;
  getAllTimeframes(): Promise<Timeframe[]>;
  getTimeframesByCadence(cadenceId: string): Promise<Timeframe[]>;
  getTimeframesByTenant(tenantId: string): Promise<Timeframe[]>;
  getTimeframesWithObjectives(tenantId: string): Promise<Array<Timeframe & { objectives: Objective[] }>>;
  
  // Objectives
  createObjective(objective: InsertObjective): Promise<Objective>;
  getObjective(id: string): Promise<Objective | undefined>;
  updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective>;
  getAllObjectives(): Promise<Objective[]>;
  getObjectivesByOwner(ownerId: string): Promise<Objective[]>;
  getObjectivesByTeam(teamId: string): Promise<Objective[]>;
  getObjectivesByTimeframe(timeframeId: string): Promise<Objective[]>;
  getObjectivesByTenant(tenantId: string): Promise<Objective[]>;
  updateObjectiveProgress(id: string, progress: number): Promise<Objective>;
  
  // Key Results
  createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult>;
  getKeyResult(id: string): Promise<KeyResult | undefined>;
  updateKeyResult(id: string, keyResult: Partial<InsertKeyResult>): Promise<KeyResult>;
  getKeyResultsByObjective(objectiveId: string): Promise<KeyResult[]>;
  getAllKeyResults(): Promise<KeyResult[]>;
  updateKeyResultProgress(id: string, progress: number): Promise<KeyResult>;
  
  // Initiatives
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  getInitiative(id: string): Promise<Initiative | undefined>;
  updateInitiative(id: string, initiative: Partial<InsertInitiative>): Promise<Initiative>;
  getInitiativesByKeyResult(keyResultId: string): Promise<Initiative[]>;
  
  // Check-ins
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckIn(id: string): Promise<CheckIn | undefined>;
  getCheckInsByUser(userId: string): Promise<CheckIn[]>;
  getCheckInsByUserId(userId: string, tenantId: string): Promise<CheckIn[]>;
  getCheckInsByObjective(objectiveId: string): Promise<CheckIn[]>;
  getCheckInsByKeyResult(keyResultId: string): Promise<CheckIn[]>;
  getRecentCheckIns(limit: number): Promise<CheckIn[]>;
  getFeedbackForUser(userId: string, tenantId: string): Promise<any[]>;
  
  // Chat Rooms
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  updateChatRoom(id: string, chatRoom: Partial<InsertChatRoom>): Promise<ChatRoom>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;
  getUserChatRooms(userId: string): Promise<(ChatRoom & { unreadCount: number })[]>;
  getChatRoomsByType(type: string): Promise<ChatRoom[]>;
  
  // Chat Room Members
  addUserToChatRoom(chatRoomMember: InsertChatRoomMember): Promise<ChatRoomMember>;
  removeUserFromChatRoom(userId: string, chatRoomId: string): Promise<void>;
  getChatRoomMembers(chatRoomId: string): Promise<(ChatRoomMember & { user: User })[]>;
  updateLastRead(userId: string, chatRoomId: string): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: string): Promise<Message | undefined>;
  updateMessage(id: string, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
  getMessagesByChatRoom(chatRoomId: string, limit?: number, before?: string): Promise<(Message & { user: User, attachments: Attachment[], reactions: Reaction[] })[]>;
  
  // Attachments
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachment(id: string): Promise<Attachment | undefined>;
  getAttachmentsByMessage(messageId: string): Promise<Attachment[]>;
  
  // Reactions
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(userId: string, messageId: string, emoji: string): Promise<void>;
  getReactionsByMessage(messageId: string): Promise<(Reaction & { user: User })[]>;
  
  // Session Store
  sessionStore: any; // Using any for session store type compatibility
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type compatibility

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // User Management
  async getUser(id: string): Promise<User | undefined> {
    // Select specific columns to avoid issues with missing columns
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      name: users.name,
      title: users.title,
      bio: users.bio,
      teamId: users.teamId,
      level: users.level,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      tenantId: users.tenantId,
      defaultTenantId: users.defaultTenantId,
      isEnabled: users.isEnabled,
      isAdmin: users.isAdmin,
      lastLoginAt: users.lastLoginAt,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId
    }).from(users).where(eq(users.id, id));
    
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Make username lookup case-insensitive
    console.log(`Looking up user with case-insensitive username: ${username}`);
    
    // Select specific columns to avoid issues with missing columns
    const results = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      name: users.name,
      title: users.title,
      bio: users.bio,
      teamId: users.teamId,
      level: users.level,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      tenantId: users.tenantId,
      defaultTenantId: users.defaultTenantId,
      isEnabled: users.isEnabled,
      isAdmin: users.isAdmin,
      lastLoginAt: users.lastLoginAt,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId
    }).from(users).where(
      sql`LOWER(${users.username}) = LOWER(${username})`
    );
    
    if (results.length > 0) {
      console.log(`Found user by case-insensitive username match: ${username}`);
      return results[0];
    }
    
    console.log(`No user found with username: ${username} (case-insensitive)`);
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`Looking up user with case-insensitive email: ${email}`);
    
    // Select specific columns to avoid issues with missing columns
    const results = await db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      name: users.name,
      title: users.title,
      bio: users.bio,
      teamId: users.teamId,
      level: users.level,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      tenantId: users.tenantId,
      defaultTenantId: users.defaultTenantId,
      isEnabled: users.isEnabled,
      isAdmin: users.isAdmin,
      lastLoginAt: users.lastLoginAt,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId
    }).from(users).where(
      sql`LOWER(${users.email}) = LOWER(${email})`
    );
    
    if (results.length > 0) {
      console.log(`Found user by case-insensitive email match: ${email}`);
      return results[0];
    }
    
    console.log(`No user found with email: ${email} (case-insensitive)`);
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Since we've updated the schema to match the database, we don't need to transform field names anymore
      // We're just making sure data is well-formed before insertion
      
      // Makes sure we have required fields properly set
      const userData = {
        ...insertUser,
        // Ensure these fields have sensible defaults if they don't exist
        firstName: insertUser.firstName || '',
        lastName: insertUser.lastName || '',
        language: insertUser.language || 'en',
        role: insertUser.role || 'user',
        firstLogin: insertUser.firstLogin !== undefined ? insertUser.firstLogin : true,
        introVideoWatched: insertUser.introVideoWatched !== undefined ? insertUser.introVideoWatched : false,
        walkthroughCompleted: insertUser.walkthroughCompleted !== undefined ? insertUser.walkthroughCompleted : false,
        onboardingProgress: insertUser.onboardingProgress !== undefined ? insertUser.onboardingProgress : 0,
      };
      
      // For debugging
      console.log("Final user data for insertion:", { ...userData, password: '***' });
      
      // Insert the user
      const [user] = await db.insert(users).values(userData).returning();
      
      // Return the user
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }
  
  // Transaction-based user creation to ensure user is only created when all operations succeed
  async createUserWithTransaction(tx: any, userData: InsertUser): Promise<User> {
    try {
      console.log("Creating user with transaction - data:", { ...userData, password: '***' });
      
      // Insert the user using the provided transaction
      const [user] = await tx.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error("Error creating user within transaction:", error);
      throw error;
    }
  }
  
  // Add a user to a team using a transaction
  async addUserToTeamWithTransaction(tx: any, userId: string, teamId: string): Promise<User> {
    try {
      console.log(`Adding user ${userId} to team ${teamId} with transaction`);
      
      // Update the user's team ID using the provided transaction
      const [updatedUser] = await tx.update(users)
        .set({ teamId, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error("Error adding user to team within transaction:", error);
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return db.select().from(users);
    } catch (error) {
      console.log('Error in getAllUsers:', error);
      // Return empty array if there are column issues
      return [];
    }
  }

  async getUsersByTeam(teamId: string): Promise<User[]> {
    // Select specific columns to avoid issues with missing columns
    return db.select({
      id: users.id,
      username: users.username,
      password: users.password,
      email: users.email,
      name: users.name,
      title: users.title,
      bio: users.bio,
      teamId: users.teamId,
      level: users.level,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      tenantId: users.tenantId,
      defaultTenantId: users.defaultTenantId,
      isEnabled: users.isEnabled,
      isAdmin: users.isAdmin,
      lastLoginAt: users.lastLoginAt,
      stripeCustomerId: users.stripeCustomerId,
      stripeSubscriptionId: users.stripeSubscriptionId
    }).from(users).where(eq(users.teamId, teamId));
  }

  async getUserTenants(userId: string): Promise<Array<Tenant & { userRole?: string, isDefault?: boolean }>> {
    try {
      console.log("Getting tenants for user:", userId);
      
      // First, check if we have any user-tenant relationships
      const userTenantConnections = await db
        .select()
        .from(usersToTenants)
        .where(eq(usersToTenants.userId, userId));
      
      if (!userTenantConnections || userTenantConnections.length === 0) {
        console.log(`No tenant connections found for user ${userId}, returning empty array`);
        return [];
      }
      
      // Get all tenants the user has access to along with their role
      const tenantIds = userTenantConnections.map(utc => utc.tenantId);
      
      // Fetch the actual tenant records
      const tenantRecords = await db
        .select()
        .from(tenants)
        .where(inArray(tenants.id, tenantIds));
      
      // Map the records with role information
      const enhancedTenants = tenantRecords.map(tenant => {
        const connection = userTenantConnections.find(utc => utc.tenantId === tenant.id);
        return {
          ...tenant,
          userRole: connection?.role || 'user',
          isDefault: connection?.isDefault || false
        };
      });
      
      console.log(`Found ${enhancedTenants.length} tenants for user ${userId}`);
      return enhancedTenants;
      
    } catch (error) {
      console.error("Error getting user tenants:", error);
      return [];
    }
  }
  
  async updateLastLogin(userId: string): Promise<void> {
    try {
      console.log("Updating last login time for user:", userId);
      
      // Update the last login timestamp for the user
      await db
        .update(users)
        .set({
          lastLoginAt: new Date()
        })
        .where(eq(users.id, userId));
      
      console.log("Updated last login time for user:", userId);
    } catch (error) {
      console.error("Error updating last login time:", error);
      throw error;
    }
  }
  
  async deleteUser(id: string): Promise<void> {
    try {
      // First check if user exists
      const user = await this.getUser(id);
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // Delete the user
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  // Team Management
  async createTeam(team: InsertTeam): Promise<Team> {
    try {
      console.log("Creating team with data:", { 
        ...team, 
        name: team.name,
        description: team.description || '',
        ownerId: team.ownerId,
        tenantId: team.tenantId
      });
      
      // Ensure we have the required fields
      if (!team.name) {
        throw new Error("Team name is required");
      }
      
      if (!team.tenantId) {
        throw new Error("Tenant ID is required");
      }
      
      if (!team.ownerId) {
        throw new Error("Owner ID is required");
      }
      
      // Provide defaults for optional fields
      const teamData = {
        ...team,
        description: team.description || '',
        icon: team.icon || 'users',
        color: team.color || '#4F46E5' // Default to indigo
      };
      
      // Insert the team
      const [newTeam] = await db.insert(teams).values(teamData).returning();
      console.log("Successfully created team:", newTeam);
      
      return newTeam;
    } catch (error) {
      console.error("Error creating team in database:", error);
      // Throw a more descriptive error
      if (error.message.includes('duplicate key')) {
        throw new Error(`A team with this name already exists in this organization`);
      } else if (error.message.includes('foreign key constraint')) {
        throw new Error(`Invalid tenant ID or owner ID reference`);
      } else {
        throw error; // Re-throw original error for other cases
      }
    }
  }

  async getTeam(id: string): Promise<Team | undefined> {
    try {
      const [team] = await db.select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color, 
        icon: teams.icon,
        parentId: teams.parentId,
        ownerId: teams.ownerId,
        leaderId: teams.leaderId,
        tenantId: teams.tenantId,
        createdAt: teams.createdAt
      }).from(teams).where(eq(teams.id, id));
      
      return team;
    } catch (error) {
      console.error(`Error getting team ${id}:`, error);
      return undefined;
    }
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    const [updatedTeam] = await db.update(teams)
      .set(team)
      .where(eq(teams.id, id))
      .returning();
    
    if (!updatedTeam) {
      throw new Error(`Team with id ${id} not found`);
    }
    
    return updatedTeam;
  }

  async getAllTeams(): Promise<Team[]> {
    try {
      return db.select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        icon: teams.icon,
        parentId: teams.parentId,
        ownerId: teams.ownerId,
        tenantId: teams.tenantId,
        createdAt: teams.createdAt
      }).from(teams);
    } catch (error) {
      console.error('Error getting all teams:', error);
      return [];
    }
  }
  
  async getTeamsByTenant(tenantId: string): Promise<Team[]> {
    try {
      console.log(`Getting teams for tenant: ${tenantId}`);
      
      // Query teams directly using the tenant_id column
      return await db.select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        icon: teams.icon,
        parentId: teams.parentId,
        ownerId: teams.ownerId,
        leaderId: teams.leaderId,
        tenantId: teams.tenantId,
        createdAt: teams.createdAt
      })
      .from(teams)
      .where(eq(teams.tenantId, tenantId));
    } catch (error) {
      console.error(`Error getting teams for tenant ${tenantId}:`, error);
      return [];
    }
  }

  async getTeamsByParent(parentId: string): Promise<Team[]> {
    return db.select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      color: teams.color,
      icon: teams.icon,
      parentId: teams.parentId,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt
    }).from(teams).where(eq(teams.parentId, parentId));
  }
  
  /**
   * Get performance metrics for a specific team
   * @param teamId - The ID of the team
   * @param tenantId - The tenant ID for context
   * @returns Comprehensive team performance metrics
   */
  async getTeamPerformance(teamId: string, tenantId: string): Promise<any> {
    try {
      // Get the team details
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error(`Team with id ${teamId} not found`);
      }
      
      // Get team members
      const teamMembers = await this.getUsersByTeam(teamId);
      
      // Get objectives assigned to this team
      const teamObjectives = await db
        .select()
        .from(objectives)
        .where(and(
          eq(objectives.teamId, teamId),
          eq(objectives.tenantId, tenantId)
        ));
      
      // Get all key results for these objectives
      const objectiveIds = teamObjectives.map(obj => obj.id);
      const keyResultsForTeam = objectiveIds.length > 0 
        ? await db
            .select()
            .from(keyResults)
            .where(and(
              inArray(keyResults.objectiveId, objectiveIds),
              eq(keyResults.tenantId, tenantId)
            ))
        : [];
      
      // Calculate overall progress metrics
      const totalObjectives = teamObjectives.length;
      const completedObjectives = teamObjectives.filter(obj => obj.progress === 100).length;
      const onTrackObjectives = teamObjectives.filter(obj => obj.progress >= 70 && obj.progress < 100).length;
      const atRiskObjectives = teamObjectives.filter(obj => obj.progress >= 40 && obj.progress < 70).length;
      const behindObjectives = teamObjectives.filter(obj => obj.progress < 40).length;
      
      // Calculate key result metrics
      const totalKeyResults = keyResultsForTeam.length;
      const completedKeyResults = keyResultsForTeam.filter(kr => kr.progress === 100).length;
      
      // Calculate average progress
      const overallProgress = totalObjectives > 0
        ? Math.round(teamObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / totalObjectives)
        : 0;
      
      // Get active timeframes for this tenant
      const activeTimeframes = await this.getTimeframesByTenant(tenantId);
      
      // Generate performance data
      const performance = {
        team,
        memberCount: teamMembers.length,
        metrics: {
          totalObjectives,
          completedObjectives,
          onTrackObjectives,
          atRiskObjectives,
          behindObjectives,
          totalKeyResults,
          completedKeyResults,
          overallProgress
        },
        objectives: teamObjectives.map(obj => {
          // Find key results for this objective
          const objKeyResults = keyResultsForTeam.filter(kr => kr.objectiveId === obj.id);
          
          return {
            ...obj,
            keyResults: objKeyResults,
            status: obj.progress >= 70 ? 'on-track' : obj.progress >= 40 ? 'at-risk' : 'behind'
          };
        }),
        timeframes: activeTimeframes
      };
      
      return performance;
    } catch (error) {
      console.error(`Error getting performance for team ${teamId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics for all teams in a tenant
   * @param tenantId - The tenant ID
   * @returns Array of team performance metrics
   */
  async getTeamsPerformance(tenantId: string): Promise<any[]> {
    try {
      // Get all teams for this tenant
      const teams = await this.getTeamsByTenant(tenantId);
      
      // Get performance data for each team
      const teamsPerformance = await Promise.all(
        teams.map(async (team) => {
          try {
            const performance = await this.getTeamPerformance(team.id, tenantId);
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              color: team.color,
              icon: team.icon,
              memberCount: performance.memberCount,
              progress: performance.metrics.overallProgress,
              objectives: {
                total: performance.metrics.totalObjectives,
                completed: performance.metrics.completedObjectives,
                onTrack: performance.metrics.onTrackObjectives,
                atRisk: performance.metrics.atRiskObjectives,
                behind: performance.metrics.behindObjectives
              },
              keyResults: {
                total: performance.metrics.totalKeyResults,
                completed: performance.metrics.completedKeyResults
              }
            };
          } catch (error) {
            console.error(`Error getting performance for team ${team.id}:`, error);
            return {
              id: team.id,
              name: team.name,
              description: team.description,
              color: team.color,
              icon: team.icon,
              memberCount: 0,
              progress: 0,
              objectives: { total: 0, completed: 0, onTrack: 0, atRisk: 0, behind: 0 },
              keyResults: { total: 0, completed: 0 }
            };
          }
        })
      );
      
      return teamsPerformance;
    } catch (error) {
      console.error('Error getting teams performance:', error);
      return [];
    }
  }
  
  /**
   * Get performance metrics for a specific team member
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @param tenantId - The tenant ID for context
   * @returns Team member performance metrics
   */
  async getTeamMemberPerformance(teamId: string, userId: string, tenantId: string): Promise<any> {
    try {
      // Get the user details
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      // Get the team details
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error(`Team with id ${teamId} not found`);
      }
      
      // Verify user belongs to the team
      if (user.teamId !== teamId) {
        throw new Error(`User ${userId} is not a member of team ${teamId}`);
      }
      
      // Get objectives assigned to this user that belong to the team
      const userObjectives = await db
        .select()
        .from(objectives)
        .where(and(
          eq(objectives.ownerId, userId),
          eq(objectives.teamId, teamId),
          eq(objectives.tenantId, tenantId)
        ));
      
      // Get key results assigned to this user
      const userKeyResults = await db
        .select()
        .from(keyResults)
        .where(and(
          eq(keyResults.assignedToId, userId),
          eq(keyResults.tenantId, tenantId)
        ));
      
      // Get all objectives for the team to find key results in team objectives that are assigned to this user
      const teamObjectives = await this.getObjectivesByTeam(teamId, tenantId);
      const teamObjectiveIds = teamObjectives.map(obj => obj.id);
      
      // Filter key results to only include those that belong to team objectives
      const keyResultsForTeamObjectives = userKeyResults.filter(kr => 
        teamObjectiveIds.includes(kr.objectiveId)
      );
      
      // Calculate metrics
      const totalAssignedObjectives = userObjectives.length;
      const completedObjectives = userObjectives.filter(obj => obj.progress === 100).length;
      const onTrackObjectives = userObjectives.filter(obj => obj.progress >= 70 && obj.progress < 100).length;
      const atRiskObjectives = userObjectives.filter(obj => obj.progress >= 40 && obj.progress < 70).length;
      const behindObjectives = userObjectives.filter(obj => obj.progress < 40).length;
      
      const totalAssignedKeyResults = keyResultsForTeamObjectives.length;
      const completedKeyResults = keyResultsForTeamObjectives.filter(kr => kr.progress === 100).length;
      
      // Calculate overall progress
      const overallProgress = totalAssignedObjectives > 0
        ? Math.round(userObjectives.reduce((sum, obj) => sum + (obj.progress || 0), 0) / totalAssignedObjectives)
        : totalAssignedKeyResults > 0
          ? Math.round(keyResultsForTeamObjectives.reduce((sum, kr) => sum + (kr.progress || 0), 0) / totalAssignedKeyResults)
          : 0;
      
      // Generate performance data
      return {
        user,
        team,
        metrics: {
          totalAssignedObjectives,
          completedObjectives,
          onTrackObjectives,
          atRiskObjectives,
          behindObjectives,
          totalAssignedKeyResults,
          completedKeyResults,
          overallProgress
        },
        objectives: userObjectives.map(obj => {
          // Find key results for this objective
          const objKeyResults = userKeyResults.filter(kr => kr.objectiveId === obj.id);
          
          return {
            ...obj,
            keyResults: objKeyResults,
            status: obj.progress >= 70 ? 'on-track' : obj.progress >= 40 ? 'at-risk' : 'behind'
          };
        }),
        keyResults: keyResultsForTeamObjectives
      };
    } catch (error) {
      console.error(`Error getting performance for team member ${userId} in team ${teamId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get performance metrics for all members of a specific team
   * @param teamId - The ID of the team
   * @param tenantId - The tenant ID for context
   * @returns Array of team member performance metrics
   */
  async getTeamMembersPerformance(teamId: string, tenantId: string): Promise<any[]> {
    try {
      // Get all team members
      const teamMembers = await this.getUsersByTeam(teamId);
      
      // Get performance data for each team member
      const membersPerformance = await Promise.all(
        teamMembers.map(async (member) => {
          try {
            const performance = await this.getTeamMemberPerformance(teamId, member.id, tenantId);
            return {
              id: member.id,
              name: member.name,
              email: member.email,
              username: member.username,
              avatar: member.avatar,
              role: member.role,
              team: performance.team,
              progress: performance.metrics.overallProgress,
              objectives: {
                total: performance.metrics.totalAssignedObjectives,
                completed: performance.metrics.completedObjectives,
                onTrack: performance.metrics.onTrackObjectives,
                atRisk: performance.metrics.atRiskObjectives,
                behind: performance.metrics.behindObjectives
              },
              keyResults: {
                total: performance.metrics.totalAssignedKeyResults,
                completed: performance.metrics.completedKeyResults
              }
            };
          } catch (error) {
            console.error(`Error getting performance for team member ${member.id}:`, error);
            return {
              id: member.id,
              name: member.name,
              email: member.email,
              username: member.username,
              avatar: member.avatar,
              role: member.role,
              team: { id: teamId, name: 'Unknown' },
              progress: 0,
              objectives: { total: 0, completed: 0, onTrack: 0, atRisk: 0, behind: 0 },
              keyResults: { total: 0, completed: 0 }
            };
          }
        })
      );
      
      return membersPerformance;
    } catch (error) {
      console.error(`Error getting team members performance for team ${teamId}:`, error);
      return [];
    }
  }
  
  async addUserToTeam(userId: string, teamId: string): Promise<User> {
    try {
      // First check if user and team exist
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      const team = await this.getTeam(teamId);
      if (!team) {
        throw new Error(`Team with id ${teamId} not found`);
      }
      
      // Update the user's team
      const [updatedUser] = await db.update(users)
        .set({
          teamId: teamId
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`Failed to update team for user ${userId}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error("Error adding user to team:", error);
      throw error;
    }
  }

  async removeUserFromTeam(userId: string): Promise<User> {
    try {
      // First check if user exists
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      // Update the user to remove their team
      const [updatedUser] = await db.update(users)
        .set({
          teamId: null
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`Failed to remove team for user ${userId}`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error("Error removing user from team:", error);
      throw error;
    }
  }

  // Access Groups
  async createAccessGroup(accessGroup: InsertAccessGroup): Promise<AccessGroup> {
    try {
      // Create a trimmed version with only the fields that exist in the database
      const accessGroupToInsert = {
        name: accessGroup.name,
        description: accessGroup.description,
        permissions: accessGroup.permissions,
        tenantId: accessGroup.tenantId,
        // Note: updatedAt is not included as it doesn't exist in the database
      };
      
      console.log("Creating access group with data:", JSON.stringify(accessGroupToInsert));
      
      // Only select columns that exist in the database table
      const [newAccessGroup] = await db.insert(accessGroups)
        .values(accessGroupToInsert)
        .returning({
          id: accessGroups.id,
          name: accessGroups.name,
          description: accessGroups.description,
          permissions: accessGroups.permissions,
          tenantId: accessGroups.tenantId,
          createdAt: accessGroups.createdAt
        });
      
      console.log("Successfully created access group:", newAccessGroup);
      return newAccessGroup;
    } catch (error) {
      console.error("Error creating access group in storage:", error);
      throw error;
    }
  }

  async getAccessGroup(id: string): Promise<AccessGroup | undefined> {
    const [accessGroup] = await db.select({
      id: accessGroups.id,
      name: accessGroups.name,
      description: accessGroups.description,
      permissions: accessGroups.permissions,
      tenantId: accessGroups.tenantId,
      createdAt: accessGroups.createdAt
    })
    .from(accessGroups)
    .where(eq(accessGroups.id, id));
    
    return accessGroup;
  }

  async updateAccessGroup(id: string, accessGroup: Partial<InsertAccessGroup>): Promise<AccessGroup> {
    const [updatedAccessGroup] = await db.update(accessGroups)
      .set(accessGroup)
      .where(eq(accessGroups.id, id))
      .returning();
    
    if (!updatedAccessGroup) {
      throw new Error(`Access Group with id ${id} not found`);
    }
    
    return updatedAccessGroup;
  }

  async getAllAccessGroups(): Promise<AccessGroup[]> {
    return db.select().from(accessGroups);
  }
  
  async getAccessGroupsByTenant(tenantId: string): Promise<AccessGroup[]> {
    try {
      console.log(`Getting access groups for tenant: ${tenantId}`);
      // Select specific columns to avoid issues with schema mismatches
      return db.select({
        id: accessGroups.id,
        name: accessGroups.name,
        description: accessGroups.description,
        permissions: accessGroups.permissions,
        tenantId: accessGroups.tenantId,
        createdAt: accessGroups.createdAt
      })
      .from(accessGroups)
      .where(eq(accessGroups.tenantId, tenantId));
    } catch (error) {
      console.error(`Error getting access groups for tenant ${tenantId}:`, error);
      return [];
    }
  }

  async assignUserToAccessGroup(userId: string, accessGroupId: string, tenantId: string): Promise<void> {
    await db.insert(userAccessGroups).values({
      userId,
      accessGroupId,
      tenantId
    });
  }

  // Cadences
  async createCadence(cadence: InsertCadence): Promise<Cadence> {
    // Make sure tenant_id is included in the cadence data
    if (!cadence.tenantId) {
      throw new Error("Tenant ID is required for creating a cadence");
    }
    
    const [newCadence] = await db.insert(cadences).values(cadence).returning();
    return newCadence;
  }

  async getCadence(id: string): Promise<Cadence | undefined> {
    const [cadence] = await db.select().from(cadences).where(eq(cadences.id, id));
    return cadence;
  }

  async getAllCadences(): Promise<Cadence[]> {
    return db.select().from(cadences);
  }
  
  async getCadencesByTenant(tenantId: string): Promise<Cadence[]> {
    return db.select().from(cadences).where(eq(cadences.tenantId, tenantId));
  }
  
  async updateCadence(id: string, cadence: Partial<InsertCadence>): Promise<Cadence> {
    const [updatedCadence] = await db.update(cadences)
      .set(cadence)
      .where(eq(cadences.id, id))
      .returning();
    
    if (!updatedCadence) {
      throw new Error(`Cadence with id ${id} not found`);
    }
    
    return updatedCadence;
  }
  
  async deleteCadence(id: string): Promise<void> {
    await db.delete(cadences).where(eq(cadences.id, id));
  }

  // Timeframes
  async createTimeframe(timeframe: InsertTimeframe): Promise<Timeframe> {
    // Make sure tenant_id is included in the timeframe data if the schema supports it
    if ('tenantId' in timeframe && !timeframe.tenantId) {
      throw new Error("Tenant ID is required for creating a timeframe");
    }
    
    // If cadenceId is provided, verify it exists
    if (timeframe.cadenceId) {
      const cadence = await this.getCadence(timeframe.cadenceId);
      if (!cadence) {
        throw new Error(`Cadence with ID ${timeframe.cadenceId} not found`);
      }
      
      // If both tenantId values are provided, log a warning but don't fail
      // This allows new organizations to work with default cadences
      if ('tenantId' in timeframe && cadence.tenantId && timeframe.tenantId !== cadence.tenantId) {
        console.warn(`Warning: Timeframe tenant (${timeframe.tenantId}) doesn't match cadence tenant (${cadence.tenantId})`);
        // We'll update the timeframe to use the current tenant
        timeframe.tenantId = cadence.tenantId;
      }
    }
    
    const [newTimeframe] = await db.insert(timeframes).values(timeframe).returning();
    return newTimeframe;
  }

  async getTimeframe(id: string): Promise<Timeframe | undefined> {
    try {
      // Get the timeframe record
      const [timeframe] = await db.select().from(timeframes).where(eq(timeframes.id, id));
      
      if (!timeframe) {
        return undefined;
      }
      
      // If we have a cadenceId, get the cadence to determine the tenant
      if (timeframe.cadenceId) {
        const cadence = await this.getCadence(timeframe.cadenceId);
        if (cadence && cadence.tenantId) {
          // Add the tenant ID from the cadence to the timeframe (virtual field)
          return {
            ...timeframe,
            tenantId: cadence.tenantId
          };
        }
      }
      
      return timeframe;
    } catch (error) {
      console.error(`Error getting timeframe ${id}:`, error);
      return undefined;
    }
  }

  async getAllTimeframes(): Promise<Timeframe[]> {
    // Get all timeframes with their data
    const timeframeList = await db.select({
      id: timeframes.id,
      name: timeframes.name,
      description: timeframes.description,
      startDate: timeframes.startDate,
      endDate: timeframes.endDate,
      cadenceId: timeframes.cadenceId,
      tenantId: timeframes.tenantId,
      createdAt: timeframes.createdAt,
    }).from(timeframes);
    
    return timeframeList;
  }

  async getTimeframesByCadence(cadenceId: string): Promise<Timeframe[]> {
    // First, get the cadence to determine its tenant
    const cadence = await this.getCadence(cadenceId);
    if (!cadence) {
      return [];
    }
    
    // Get timeframes for this cadence
    const timeframesList = await db.select({
      id: timeframes.id,
      name: timeframes.name,
      description: timeframes.description,
      startDate: timeframes.startDate,
      endDate: timeframes.endDate,
      cadenceId: timeframes.cadenceId,
      tenantId: timeframes.tenantId,
      createdAt: timeframes.createdAt,
    }).from(timeframes).where(eq(timeframes.cadenceId, cadenceId));
    
    return timeframesList;
  }
  
  async getTimeframesByTenant(tenantId: string): Promise<Timeframe[]> {
    try {
      console.log(`Getting timeframes for tenant: ${tenantId}`);
      
      // First, try to get timeframes directly by tenant ID
      let directTimeframes = await db.select({
        id: timeframes.id,
        name: timeframes.name,
        description: timeframes.description,
        startDate: timeframes.startDate,
        endDate: timeframes.endDate,
        cadenceId: timeframes.cadenceId,
        tenantId: timeframes.tenantId,
        createdAt: timeframes.createdAt,
      }).from(timeframes)
        .where(eq(timeframes.tenantId, tenantId))
        .orderBy(desc(timeframes.endDate)); // Sort by end date in descending order
      
      // If we find timeframes directly, return them
      if (directTimeframes.length > 0) {
        return directTimeframes;
      }
      
      // Fallback: get all cadences for this tenant and find timeframes linked to those cadences
      console.log("No timeframes found directly by tenant ID, checking cadences...");
      const tenantCadences = await this.getCadencesByTenant(tenantId);
      const cadenceIds = tenantCadences.map(cadence => cadence.id);
      
      if (cadenceIds.length === 0) {
        console.log(`No cadences found for tenant ${tenantId}`);
        return [];
      }
      
      // Select timeframes that belong to tenant's cadences
      const timeframesFromCadences = await db.select({
        id: timeframes.id,
        name: timeframes.name,
        description: timeframes.description,
        startDate: timeframes.startDate,
        endDate: timeframes.endDate,
        cadenceId: timeframes.cadenceId,
        tenantId: timeframes.tenantId,
        createdAt: timeframes.createdAt,
      }).from(timeframes)
        .where(inArray(timeframes.cadenceId, cadenceIds))
        .orderBy(desc(timeframes.endDate)); // Sort by end date in descending order
      
      // For timeframes without a tenant ID, add the tenant ID
      const timeframesWithTenant = timeframesFromCadences.map(tf => {
        if (!tf.tenantId) {
          return {
            ...tf,
            tenantId
          };
        }
        return tf;
      });
      
      return timeframesWithTenant;
    } catch (error) {
      console.error(`Error getting timeframes for tenant ${tenantId}:`, error);
      return [];
    }
  }
  
  async updateTimeframe(id: string, timeframe: Partial<InsertTimeframe>): Promise<Timeframe> {
    // First, get the existing timeframe to ensure it exists
    const existingTimeframe = await this.getTimeframe(id);
    if (!existingTimeframe) {
      throw new Error(`Timeframe with id ${id} not found`);
    }
    
    // If updating cadenceId, verify the cadence exists and belongs to the right tenant
    if (timeframe.cadenceId) {
      const cadence = await this.getCadence(timeframe.cadenceId);
      if (!cadence) {
        throw new Error(`Cadence with ID ${timeframe.cadenceId} not found`);
      }
      
      // If both have tenantId fields, ensure tenants match
      if ('tenantId' in existingTimeframe && 'tenantId' in cadence) {
        const existingTenantId = existingTimeframe.tenantId;
        const cadenceTenantId = cadence.tenantId;
        
        if (existingTenantId && cadenceTenantId && existingTenantId !== cadenceTenantId) {
          throw new Error("Timeframe and cadence must belong to the same tenant");
        }
      }
    }
    
    // If attempting to update tenantId directly, ensure it's not changing
    if ('tenantId' in timeframe && 'tenantId' in existingTimeframe) {
      if (timeframe.tenantId && existingTimeframe.tenantId && timeframe.tenantId !== existingTimeframe.tenantId) {
        throw new Error("Cannot change tenant ownership of a timeframe");
      }
    }
    
    const [updatedTimeframe] = await db.update(timeframes)
      .set(timeframe)
      .where(eq(timeframes.id, id))
      .returning();
    
    if (!updatedTimeframe) {
      throw new Error(`Timeframe with id ${id} not found after update`);
    }
    
    return updatedTimeframe;
  }
  
  async deleteTimeframe(id: string, tenantId?: string): Promise<void> {
    // First verify the timeframe exists 
    const timeframe = await this.getTimeframe(id);
    if (!timeframe) {
      throw new Error(`Timeframe with id ${id} not found`);
    }
    
    // If tenantId is provided, verify the timeframe belongs to this tenant
    if (tenantId && timeframe.tenantId && timeframe.tenantId !== tenantId) {
      throw new Error(`Access denied: Timeframe does not belong to tenant ${tenantId}`);
    }
    
    // Check if timeframe has objectives
    const objectives = await this.getObjectivesByTimeframe(id);
    if (objectives.length > 0) {
      throw new Error("Cannot delete timeframe with associated objectives");
    }
    
    // Proceed with deletion
    await db.delete(timeframes).where(eq(timeframes.id, id));
  }

  // Objectives
  async createObjective(objective: InsertObjective): Promise<Objective> {
    const [newObjective] = await db.insert(objectives).values(objective).returning();
    return newObjective;
  }

  async getObjective(id: string): Promise<Objective | undefined> {
    // Select only columns that exist in the actual database
    const [objective] = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      strategyId: objectives.strategyId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      createdAt: objectives.createdAt,
      // Exclude updatedAt and statusReason which don't exist in the database
    }).from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async updateObjective(id: string, objective: Partial<InsertObjective>): Promise<Objective> {
    // If the update contains fields that don't exist in the database, remove them
    const cleanedUpdate = { ...objective };
    if ('updatedAt' in cleanedUpdate) delete cleanedUpdate.updatedAt;
    if ('statusReason' in cleanedUpdate) delete cleanedUpdate.statusReason;
    
    // Update
    await db.update(objectives)
      .set(cleanedUpdate)
      .where(eq(objectives.id, id));
    
    // Then fetch the updated objective with only the columns that exist
    const [updatedObjective] = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      createdAt: objectives.createdAt,
      // Exclude fields that don't exist in the actual database
    }).from(objectives).where(eq(objectives.id, id));
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    return updatedObjective;
  }

  async getAllObjectives(): Promise<Objective[]> {
    // Select only columns that exist in the actual database
    return db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      createdAt: objectives.createdAt,
      // Exclude updatedAt and statusReason which don't exist in the database
    }).from(objectives);
  }

  async getObjectivesByOwner(ownerId: string): Promise<Objective[]> {
    // Select only columns that exist in the actual database
    return db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      createdAt: objectives.createdAt,
      // Exclude updatedAt and statusReason which don't exist in the database
    }).from(objectives).where(eq(objectives.ownerId, ownerId));
  }

  async getObjectivesByTeam(teamId: string): Promise<Objective[]> {
    // Verify we are querying objectives, not teams (this is important!)
    console.log(`Getting objectives for team ID: ${teamId}`);
    
    // Select only columns that exist in the actual database
    const result = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      createdAt: objectives.createdAt,
      // Exclude updatedAt and statusReason which don't exist in the database
    }).from(objectives).where(eq(objectives.teamId, teamId));
    
    console.log(`Found ${result.length} objectives for team ${teamId}`);
    if (result.length > 0) {
      console.log(`Sample objective: ${JSON.stringify(result[0])}`);
    }
    
    return result;
  }

  async getObjectivesByTimeframe(timeframeId: string): Promise<Objective[]> {
    // Select only columns that exist in the actual database
    return db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      createdAt: objectives.createdAt,
      // Exclude updatedAt and statusReason which don't exist in the database
    }).from(objectives).where(eq(objectives.timeframeId, timeframeId));
  }
  
  async getObjectivesByTenant(tenantId: string): Promise<Objective[]> {
    // Select all columns that exist in the actual database
    const results = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      level: objectives.level, // Include the level field
      isApproved: objectives.isApproved, // Include the approval status
      createdAt: objectives.createdAt,
      // Note: Exclude fields that don't exist in the actual database: 
      // - updatedAt
      // - statusReason
    }).from(objectives).where(eq(objectives.tenantId, tenantId));
    
    // For each objective, fetch and add its key results
    const objectivesWithKeyResults = await Promise.all(
      results.map(async (objective) => {
        const keyResultsList = await this.getKeyResultsByObjective(objective.id);
        return {
          ...objective,
          keyResults: keyResultsList || []
        };
      })
    );
    
    return objectivesWithKeyResults;
  }
  
  async getApprovedObjectives(tenantId: string): Promise<Objective[]> {
    try {
      console.log(`Looking for approved objectives with tenantId: ${tenantId}`);
      
      // First check if there are any approved objectives at all
      const count = await db.select({ count: sql`count(*)` })
        .from(objectives)
        .where(and(
          eq(objectives.tenantId, tenantId),
          eq(objectives.isApproved, true)
        ));
        
      console.log(`Found ${count[0]?.count || 0} approved objectives with tenantId: ${tenantId}`);
      
      // If no objectives found, return empty array
      if (!count[0] || parseInt(count[0].count as string) === 0) {
        return [];
      }
      
      // Select all columns that exist in the actual database
      const results = await db.select({
        id: objectives.id,
        title: objectives.title,
        description: objectives.description,
        ownerId: objectives.ownerId,
        teamId: objectives.teamId,
        timeframeId: objectives.timeframeId,
        status: objectives.status,
        progress: objectives.progress,
        parentId: objectives.parentId,
        tenantId: objectives.tenantId,
        level: objectives.level,
        isApproved: objectives.isApproved,
        createdAt: objectives.createdAt,
      }).from(objectives)
        .where(and(
          eq(objectives.tenantId, tenantId),
          eq(objectives.isApproved, true)
        ));
      
      console.log(`Retrieved ${results.length} approved objectives from the database`);
      
      // For each objective, fetch and add its key results
      const objectivesWithKeyResults = await Promise.all(
        results.map(async (objective) => {
          const keyResultsList = await this.getKeyResultsByObjective(objective.id);
          return {
            ...objective,
            keyResults: keyResultsList || []
          };
        })
      );
      
      return objectivesWithKeyResults;
    } catch (error) {
      console.error("Error in getApprovedObjectives:", error);
      return [];
    }
  }
  
  async approveObjective(id: string): Promise<Objective> {
    const [updatedObjective] = await db.update(objectives)
      .set({ isApproved: true })
      .where(eq(objectives.id, id))
      .returning();
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    // Fetch key results for the updated objective
    const keyResultsList = await this.getKeyResultsByObjective(updatedObjective.id);
    
    return {
      ...updatedObjective,
      keyResults: keyResultsList || []
    };
  }
  
  async unapproveObjective(id: string): Promise<Objective> {
    const [updatedObjective] = await db.update(objectives)
      .set({ isApproved: false })
      .where(eq(objectives.id, id))
      .returning();
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    // Fetch key results for the updated objective
    const keyResultsList = await this.getKeyResultsByObjective(updatedObjective.id);
    
    return {
      ...updatedObjective,
      keyResults: keyResultsList || []
    };
  }

  async updateObjectiveProgress(id: string, progress: number): Promise<Objective> {
    // Update the progress
    await db.update(objectives)
      .set({ progress })
      .where(eq(objectives.id, id));
    
    // Then fetch the updated objective with only the columns that exist
    const [updatedObjective] = await db.select({
      id: objectives.id,
      title: objectives.title,
      description: objectives.description,
      ownerId: objectives.ownerId,
      teamId: objectives.teamId,
      timeframeId: objectives.timeframeId,
      status: objectives.status,
      progress: objectives.progress,
      parentId: objectives.parentId,
      tenantId: objectives.tenantId,
      createdAt: objectives.createdAt,
      // Exclude fields that don't exist in the actual database
    }).from(objectives).where(eq(objectives.id, id));
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    return updatedObjective;
  }

  // Key Results
  async createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult> {
    console.log("createKeyResult called with:", JSON.stringify(keyResult, null, 2));
    
    // Check if objectiveId is provided since it's required by the database
    if (!keyResult.objectiveId) {
      console.log("ERROR: objectiveId is missing from keyResult:", keyResult);
      throw new Error("objectiveId is required to create a key result");
    }
    
    console.log("objectiveId found:", keyResult.objectiveId);
    
    // Calculate progress from current, start, and target values
    const startValue = parseFloat(keyResult.startValue || "0");
    const currentValue = parseFloat(keyResult.currentValue || keyResult.startValue || "0");
    const targetValue = parseFloat(keyResult.targetValue || "100");
    const targetType = keyResult.targetType || "increase";
    
    let calculatedProgress = 0;
    if (targetType === "increase") {
      calculatedProgress = targetValue > startValue ? 
        Math.max(0, Math.min(100, ((currentValue - startValue) / (targetValue - startValue)) * 100)) : 0;
    } else if (targetType === "decrease") {
      calculatedProgress = currentValue <= targetValue ? 100 : 
        startValue > targetValue ? Math.max(0, Math.min(100, ((startValue - currentValue) / (startValue - targetValue)) * 100)) : 0;
    } else if (targetType === "maintain") {
      calculatedProgress = currentValue === targetValue ? 100 : 0;
    }
    
    // Map camelCase input to snake_case database columns - ensuring all required fields are present
    const values = {
      title: keyResult.title,
      description: keyResult.description || "",
      objectiveId: keyResult.objectiveId, // Use camelCase for Drizzle ORM
      startValue: keyResult.startValue || "0",
      targetValue: keyResult.targetValue || "100", 
      currentValue: keyResult.currentValue || keyResult.startValue || "0",
      progress: Math.round(calculatedProgress),
      status: keyResult.status || "not_started",
      tenantId: keyResult.tenantId,
      assignedToId: keyResult.assignedToId,
      targetType: keyResult.targetType || "increase",
      measureType: keyResult.measureType || "numerical"
    };
    
    // Add error handling and logging
    try {
      console.log("Creating key result with values:", JSON.stringify(values));
      const [newKeyResult] = await db.insert(keyResults).values(values).returning();
      console.log("Key result created:", newKeyResult);
      
      // Now we can safely use objectiveId since we validated it above
      // Update the objective's progress
      const results = await this.getKeyResultsByObjective(newKeyResult.objectiveId);
      if (results && results.length > 0) {
        const totalProgress = results.reduce((sum, kr) => sum + (kr.progress || 0), 0);
        const averageProgress = results.length > 0 ? Math.round(totalProgress / results.length) : 0;
        
        // Update the objective's progress
        await this.updateObjectiveProgress(newKeyResult.objectiveId, averageProgress);
      }
      
      return newKeyResult;
    } catch (error) {
      console.error("Error creating key result:", error);
      console.error("Attempted values:", JSON.stringify(values));
      throw error;
    }
  }

  async getKeyResult(id: string): Promise<KeyResult | undefined> {
    const [keyResult] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    return keyResult;
  }

  async updateKeyResult(id: string, keyResult: Partial<InsertKeyResult>): Promise<KeyResult> {
    const [updatedKeyResult] = await db.update(keyResults)
      .set(keyResult)
      .where(eq(keyResults.id, id))
      .returning();
    
    if (!updatedKeyResult) {
      throw new Error(`Key Result with id ${id} not found`);
    }
    
    return updatedKeyResult;
  }

  async getKeyResultsByObjective(objectiveId: string): Promise<KeyResult[]> {
    return db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
  }

  async deleteKeyResult(id: string): Promise<void> {
    await db.delete(keyResults).where(eq(keyResults.id, id));
  }
  
  async getAllKeyResults(): Promise<KeyResult[]> {
    return db.select().from(keyResults);
  }

  async updateKeyResultProgress(id: string, progress: number): Promise<KeyResult> {
    const [updatedKeyResult] = await db.update(keyResults)
      .set({ progress })
      .where(eq(keyResults.id, id))
      .returning();
    
    if (!updatedKeyResult) {
      throw new Error(`Key Result with id ${id} not found`);
    }
    
    // Update objective progress based on key results
    if (updatedKeyResult.objectiveId) {
      const keyResults = await this.getKeyResultsByObjective(updatedKeyResult.objectiveId);
      const totalProgress = keyResults.reduce((sum, kr) => sum + (kr.progress || 0), 0);
      const averageProgress = Math.round(totalProgress / keyResults.length);
      await this.updateObjectiveProgress(updatedKeyResult.objectiveId, averageProgress);
    }
    
    return updatedKeyResult;
  }

  // Initiatives
  async createInitiative(initiative: InsertInitiative): Promise<Initiative> {
    const [newInitiative] = await db.insert(initiatives).values(initiative).returning();
    return newInitiative;
  }

  async getInitiative(id: string): Promise<Initiative | undefined> {
    const [initiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    return initiative;
  }

  async updateInitiative(id: string, initiative: Partial<InsertInitiative>): Promise<Initiative> {
    const [updatedInitiative] = await db.update(initiatives)
      .set(initiative)
      .where(eq(initiatives.id, id))
      .returning();
    
    if (!updatedInitiative) {
      throw new Error(`Initiative with id ${id} not found`);
    }
    
    return updatedInitiative;
  }

  async getInitiativesByKeyResult(keyResultId: string): Promise<Initiative[]> {
    return db.select().from(initiatives).where(eq(initiatives.keyResultId, keyResultId));
  }

  // Check-ins
  async createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn> {
    const [newCheckIn] = await db.insert(checkIns).values(checkIn).returning();
    
    // Update key result progress if available
    if (newCheckIn.keyResultId && typeof newCheckIn.progress === 'number') {
      await this.updateKeyResultProgress(newCheckIn.keyResultId, newCheckIn.progress);
    }
    
    return newCheckIn;
  }

  async getCheckIn(id: string): Promise<CheckIn | undefined> {
    const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, id));
    return checkIn;
  }

  async getCheckInsByUser(userId: string): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.createdAt));
  }
  
  async getCheckInsByUserId(userId: string, tenantId: string): Promise<CheckIn[]> {
    try {
      console.log(`Getting check-ins for user ${userId} in tenant ${tenantId}`);
      return db.select()
        .from(checkIns)
        .where(and(
          eq(checkIns.userId, userId),
          eq(checkIns.tenantId, tenantId)
        ))
        .orderBy(desc(checkIns.createdAt));
    } catch (error) {
      console.error(`Error getting check-ins for user ${userId} in tenant ${tenantId}:`, error);
      return [];
    }
  }

  async getCheckInsByObjective(objectiveId: string): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.objectiveId, objectiveId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getCheckInsByKeyResult(keyResultId: string): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.keyResultId, keyResultId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getRecentCheckIns(limit: number): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .orderBy(desc(checkIns.createdAt))
      .limit(limit);
  }

  async updateCheckIn(id: string, checkInData: Partial<InsertCheckIn>): Promise<CheckIn> {
    const [updatedCheckIn] = await db.update(checkIns)
      .set(checkInData)
      .where(eq(checkIns.id, id))
      .returning();
    
    if (!updatedCheckIn) {
      throw new Error(`Check-in with id ${id} not found`);
    }
    
    // Update key result progress if progress was updated
    if (updatedCheckIn.keyResultId && typeof checkInData.progress === 'number') {
      await this.updateKeyResultProgress(updatedCheckIn.keyResultId, checkInData.progress);
    }
    
    return updatedCheckIn;
  }

  async deleteCheckIn(id: string): Promise<void> {
    const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, id));
    
    if (!checkIn) {
      throw new Error(`Check-in with id ${id} not found`);
    }
    
    await db.delete(checkIns).where(eq(checkIns.id, id));
  }

  async getCheckInsByTenant(tenantId: string): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.tenantId, tenantId))
      .orderBy(desc(checkIns.createdAt));
  }

  // Chat Rooms
  async createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom> {
    // Ensure tenant_id is properly set for multi-tenancy
    if (!chatRoom.tenantId) {
      throw new Error("Tenant ID is required for creating a chat room");
    }
    
    const [newChatRoom] = await db.insert(chatRooms).values(chatRoom).returning();
    return newChatRoom;
  }

  async getChatRoom(id: string, tenantId?: string): Promise<ChatRoom | undefined> {
    // If tenantId is provided, ensure we only return rooms for that tenant
    if (tenantId) {
      const [room] = await db.select()
        .from(chatRooms)
        .where(
          and(
            eq(chatRooms.id, id),
            eq(chatRooms.tenantId, tenantId)
          )
        );
      return room;
    } else {
      // For backward compatibility with existing code that doesn't specify tenant
      const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
      return room;
    }
  }

  async updateChatRoom(id: string, chatRoom: Partial<InsertChatRoom>, tenantId?: string): Promise<ChatRoom> {
    let query = db.update(chatRooms)
      .set({
        ...chatRoom,
        updatedAt: new Date()
      });
    
    // If tenantId is provided, restrict update to the specific tenant
    if (tenantId) {
      query = query.where(
        and(
          eq(chatRooms.id, id),
          eq(chatRooms.tenantId, tenantId)
        )
      );
    } else {
      query = query.where(eq(chatRooms.id, id));
    }
    
    const [updatedRoom] = await query.returning();
    
    if (!updatedRoom) {
      throw new Error(`Chat room with id ${id} not found or belongs to a different tenant`);
    }
    
    return updatedRoom;
  }

  async getAllChatRooms(tenantId?: string): Promise<ChatRoom[]> {
    // If tenantId is provided, filter rooms by tenant
    if (tenantId) {
      return db.select()
        .from(chatRooms)
        .where(eq(chatRooms.tenantId, tenantId));
    } else {
      // For backward compatibility, return all if no tenant specified
      return db.select().from(chatRooms);
    }
  }

  async getChatRoomsByUser(userId: string, tenantId?: string): Promise<ChatRoom[]> {
    // Get all chat rooms where the user is a member
    const memberRooms = await db.select({
      chatRoomId: chatRoomMembers.chatRoomId
    })
    .from(chatRoomMembers)
    .where(eq(chatRoomMembers.userId, userId));
    
    const roomIds = memberRooms.map(r => r.chatRoomId);
    
    if (roomIds.length === 0) {
      return [];
    }
    
    // If tenantId is provided, filter rooms by tenant
    if (tenantId) {
      return db.select()
        .from(chatRooms)
        .where(
          and(
            inArray(chatRooms.id, roomIds),
            eq(chatRooms.tenantId, tenantId)
          )
        );
    } else {
      // For backward compatibility, return all if no tenant specified
      return db.select()
        .from(chatRooms)
        .where(inArray(chatRooms.id, roomIds));
    }
  }

  async getUserChatRooms(userId: string, tenantId?: string): Promise<(ChatRoom & { unreadCount: number })[]> {
    try {
      // Get all chat rooms where the user is a member
      const members = await db.select()
        .from(chatRoomMembers)
        .where(eq(chatRoomMembers.userId, userId));
      
      if (members.length === 0) {
        return [];
      }
      
      const roomIds = members.map(m => m.chatRoomId);
      
      // Get the rooms the user is a member of, filtering by tenant_id if provided
      // Using a more explicit column selection to avoid issues with columns that might not exist
      let roomsQuery = db.select({
        id: chatRooms.id,
        name: chatRooms.name,
        type: chatRooms.type,
        description: chatRooms.description,
        createdBy: chatRooms.createdBy,
        tenantId: chatRooms.tenantId,
        createdAt: chatRooms.createdAt,
        updatedAt: chatRooms.updatedAt
      })
      .from(chatRooms)
      .where(inArray(chatRooms.id, roomIds));
      
      // Filter by tenant_id if provided
      if (tenantId) {
        roomsQuery = roomsQuery.where(eq(chatRooms.tenantId, tenantId));
      }
      
        const rooms = await roomsQuery;
      
      // If no rooms found, return empty array
      if (rooms.length === 0) {
        return [];
      }
      
      // Get unread counts for each room
      const results = await Promise.all(rooms.map(async (room) => {
        const member = members.find(m => m.chatRoomId === room.id);
        if (!member) {
          return { ...room, unreadCount: 0 };
        }
        
        // Count messages newer than user's last read timestamp or joined time
        const lastRead = member.lastRead || member.joinedAt;
        
        const unreadMessages = await db.select({ count: count() })
          .from(messages)
          .where(
            and(
              eq(messages.chatRoomId, room.id),
              gt(messages.createdAt, lastRead),
              ne(messages.userId, userId) // Don't count user's own messages
            )
          );
        
        return { ...room, unreadCount: unreadMessages[0]?.count || 0 };
      }));
      
      return results;
    } catch (error) {
      console.error('Error getting user chat rooms:', error);
      return [];
    }
  }

  async getChatRoomsByType(type: string, tenantId?: string): Promise<ChatRoom[]> {
    // Filter chat rooms by type and optionally by tenant
    let query = db.select().from(chatRooms).where(eq(chatRooms.type, type));
    
    // If tenantId is provided, filter by tenant
    if (tenantId) {
      query = query.where(eq(chatRooms.tenantId, tenantId));
    }
    
    return query;
  }
  
  // Chat Room Members
  async addUserToChatRoom(chatRoomMember: InsertChatRoomMember): Promise<ChatRoomMember> {
    const [member] = await db.insert(chatRoomMembers).values(chatRoomMember).returning();
    return member;
  }

  async removeUserFromChatRoom(userId: string, chatRoomId: string): Promise<void> {
    await db.delete(chatRoomMembers)
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          eq(chatRoomMembers.chatRoomId, chatRoomId)
        )
      );
  }

  async getChatRoomMembers(chatRoomId: string): Promise<(ChatRoomMember & { user: User })[]> {
    // Using JOIN to get user details with each chat room member
    const members = await db.select({
      id: chatRoomMembers.id,
      chatRoomId: chatRoomMembers.chatRoomId,
      userId: chatRoomMembers.userId,
      role: chatRoomMembers.role,
      joinedAt: chatRoomMembers.joinedAt,
      lastRead: chatRoomMembers.lastRead,
      user: users
    })
    .from(chatRoomMembers)
    .innerJoin(users, eq(chatRoomMembers.userId, users.id))
    .where(eq(chatRoomMembers.chatRoomId, chatRoomId));
    
    return members;
  }

  async updateLastRead(userId: string, chatRoomId: string): Promise<void> {
    await db.update(chatRoomMembers)
      .set({ lastRead: new Date() })
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          eq(chatRoomMembers.chatRoomId, chatRoomId)
        )
      );
  }
  
  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    // Make sure tenantId is set when creating a message
    if (!message.tenantId) {
      throw new Error("Tenant ID is required for creating a message");
    }
    
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessage(id: number, tenantId?: string): Promise<Message | undefined> {
    // Query with appropriate tenant filtering
    let query = db.select().from(messages).where(eq(messages.id, id));
    
    // If tenantId is provided, restrict to that tenant
    if (tenantId) {
      query = query.where(eq(messages.tenantId, tenantId));
    }
    
    const [message] = await query;
    return message;
  }

  async updateMessage(id: number, message: Partial<InsertMessage>, tenantId?: string): Promise<Message> {
    // Build update query
    let query = db.update(messages)
      .set({
        ...message,
        updatedAt: new Date(),
        isEdited: true
      })
      .where(eq(messages.id, id));
      
    // If tenantId is provided, add tenant restriction
    if (tenantId) {
      query = query.where(eq(messages.tenantId, tenantId));
    }
    
    const [updatedMessage] = await query.returning();
    
    if (!updatedMessage) {
      throw new Error(`Message with id ${id} not found or belongs to a different tenant`);
    }
    
    return updatedMessage;
  }

  async deleteMessage(id: number, tenantId?: string): Promise<void> {
    // Soft delete - just mark as deleted
    let query = db.update(messages)
      .set({
        deletedAt: new Date(),
        content: "[This message was deleted]"
      })
      .where(eq(messages.id, id));
      
    // If tenantId is provided, add tenant restriction
    if (tenantId) {
      query = query.where(eq(messages.tenantId, tenantId));
    }
    
    await query;
  }

  async getMessagesByChatRoom(
    chatRoomId: number, 
    limit: number = 50, 
    before?: number,
    tenantId?: string
  ): Promise<(Message & { user: User, attachments: Attachment[], reactions: Reaction[] })[]> {
    // Define the base query with tenant filtering
    let baseConditions = and(
      eq(messages.chatRoomId, chatRoomId),
      isNull(messages.deletedAt)
    );
    
    // Add tenant filter if provided
    if (tenantId) {
      baseConditions = and(
        baseConditions,
        eq(messages.tenantId, tenantId)
      );
    }
    
    // Create appropriate query based on whether 'before' is provided
    let messageResults;
    if (before !== undefined) {
      const fullConditions = and(
        baseConditions,
        lt(messages.id, before)
      );
      
      messageResults = await db.select({
        id: messages.id,
        chatRoomId: messages.chatRoomId,
        userId: messages.userId,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        deletedAt: messages.deletedAt,
        isEdited: messages.isEdited,
        replyToId: messages.replyToId,
        user: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(fullConditions)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    } else {
      messageResults = await db.select({
        id: messages.id,
        chatRoomId: messages.chatRoomId,
        userId: messages.userId,
        content: messages.content,
        type: messages.type,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        deletedAt: messages.deletedAt,
        isEdited: messages.isEdited,
        replyToId: messages.replyToId,
        user: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(baseConditions)
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    }
    
    // Get attachments and reactions for each message
    const messagesWithDetails = await Promise.all(messageResults.map(async (message) => {
      const attachments = await this.getAttachmentsByMessage(message.id);
      const reactions = await this.getReactionsByMessage(message.id);
      
      return {
        ...message,
        attachments,
        reactions
      };
    }));
    
    return messagesWithDetails;
  }
  
  // Attachments
  async createAttachment(attachment: InsertAttachment): Promise<Attachment> {
    const [newAttachment] = await db.insert(attachments).values(attachment).returning();
    return newAttachment;
  }

  async getAttachment(id: number): Promise<Attachment | undefined> {
    const [attachment] = await db.select().from(attachments).where(eq(attachments.id, id));
    return attachment;
  }

  async getAttachmentsByMessage(messageId: number): Promise<Attachment[]> {
    return db.select()
      .from(attachments)
      .where(eq(attachments.messageId, messageId));
  }
  
  // Reactions
  async addReaction(reaction: InsertReaction): Promise<Reaction> {
    // Check if reaction already exists
    const [existingReaction] = await db.select()
      .from(reactions)
      .where(
        and(
          eq(reactions.messageId, reaction.messageId),
          eq(reactions.userId, reaction.userId),
          eq(reactions.emoji, reaction.emoji)
        )
      );
    
    if (existingReaction) {
      return existingReaction;
    }
    
    // Create new reaction
    const [newReaction] = await db.insert(reactions).values(reaction).returning();
    return newReaction;
  }

  async removeReaction(userId: number, messageId: number, emoji: string): Promise<void> {
    await db.delete(reactions)
      .where(
        and(
          eq(reactions.userId, userId),
          eq(reactions.messageId, messageId),
          eq(reactions.emoji, emoji)
        )
      );
  }

  async getReactionsByMessage(messageId: number): Promise<(Reaction & { user: User })[]> {
    return db.select({
      id: reactions.id,
      messageId: reactions.messageId,
      userId: reactions.userId,
      emoji: reactions.emoji,
      createdAt: reactions.createdAt,
      user: users
    })
    .from(reactions)
    .innerJoin(users, eq(reactions.userId, users.id))
    .where(eq(reactions.messageId, messageId));
  }

  // Meetings Management
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async getMeetingWithDetails(id: string): Promise<Meeting & { 
    attendees: Array<User & { isAttending: boolean }>,
    attendeeIds: string[],
    relatedObjectives: Objective[],
    relatedKeyResults: KeyResult[],
    actionItems: ActionItem[]
  } | undefined> {
    // Get the meeting
    const meeting = await this.getMeeting(id);
    if (!meeting) return undefined;

    // Get all meeting-related data in parallel for better performance
    const [attendees, relatedObjectives, relatedKeyResults, actionItems, attendeeIdsResult] = await Promise.all([
      this.getMeetingAttendees(id),
      this.getMeetingObjectives(id),
      this.getMeetingKeyResults(id),
      this.getActionItemsByMeeting(id),
      db.select({
        userId: meetingsToUsers.userId
      })
      .from(meetingsToUsers)
      .where(eq(meetingsToUsers.meetingId, id))
    ]);

    const attendeeIds = attendeeIdsResult.map(result => result.userId);

    return {
      ...meeting,
      attendees,
      attendeeIds,
      relatedObjectives,
      relatedKeyResults,
      actionItems
    };
  }

  async getMeetingsByTenant(tenantId: string): Promise<(Meeting & { attendeeIds?: string[] })[]> {
    // First get all meetings
    const allMeetings = await db.select()
      .from(meetings)
      .where(eq(meetings.tenantId, tenantId))
      .orderBy(desc(meetings.scheduledStartTime));
    
    // For each meeting, get its attendees
    const meetingsWithAttendeeIds = await Promise.all(
      allMeetings.map(async (meeting) => {
        const attendeeIdsResult = await db.select({
          userId: meetingsToUsers.userId
        })
        .from(meetingsToUsers)
        .where(eq(meetingsToUsers.meetingId, meeting.id));
        
        return {
          ...meeting,
          attendeeIds: attendeeIdsResult.map(result => result.userId)
        };
      })
    );
    
    return meetingsWithAttendeeIds;
  }

  async getMeetingsByUser(userId: string): Promise<(Meeting & { attendeeIds?: string[] })[]> {
    // Get all meetings where the user is an attendee
    const userMeetings = await db.select({
      meetingId: meetingsToUsers.meetingId
    })
    .from(meetingsToUsers)
    .where(eq(meetingsToUsers.userId, userId));

    if (!userMeetings.length) return [];

    const meetingIds = userMeetings.map(m => m.meetingId);

    // Get the full meeting details
    const userMeetingsData = await db.select()
      .from(meetings)
      .where(inArray(meetings.id, meetingIds))
      .orderBy(desc(meetings.scheduledStartTime));
      
    // For each meeting, get its attendees
    const meetingsWithAttendeeIds = await Promise.all(
      userMeetingsData.map(async (meeting) => {
        const attendeeIdsResult = await db.select({
          userId: meetingsToUsers.userId
        })
        .from(meetingsToUsers)
        .where(eq(meetingsToUsers.meetingId, meeting.id));
        
        return {
          ...meeting,
          attendeeIds: attendeeIdsResult.map(result => result.userId)
        };
      })
    );
    
    return meetingsWithAttendeeIds;
  }

  async getMeetingsByStatus(tenantId: string, status: string): Promise<(Meeting & { attendeeIds?: string[] })[]> {
    // First get all meetings by status
    const allMeetings = await db.select()
      .from(meetings)
      .where(
        and(
          eq(meetings.tenantId, tenantId),
          eq(meetings.status, status)
        )
      )
      .orderBy(desc(meetings.scheduledStartTime));
    
    // For each meeting, get its attendees
    const meetingsWithAttendeeIds = await Promise.all(
      allMeetings.map(async (meeting) => {
        const attendeeIdsResult = await db.select({
          userId: meetingsToUsers.userId
        })
        .from(meetingsToUsers)
        .where(eq(meetingsToUsers.meetingId, meeting.id));
        
        return {
          ...meeting,
          attendeeIds: attendeeIdsResult.map(result => result.userId)
        };
      })
    );
    
    return meetingsWithAttendeeIds;
  }

  async getUpcomingMeetings(tenantId: string, limit: number = 5): Promise<(Meeting & { attendeeIds?: string[] })[]> {
    const now = new Date();
    
    // First get all upcoming meetings
    const upcomingMeetings = await db.select()
      .from(meetings)
      .where(
        and(
          eq(meetings.tenantId, tenantId),
          eq(meetings.status, 'scheduled'),
          gt(meetings.scheduledStartTime, now)
        )
      )
      .orderBy(meetings.scheduledStartTime)
      .limit(limit);
    
    // For each meeting, get its attendees
    const meetingsWithAttendeeIds = await Promise.all(
      upcomingMeetings.map(async (meeting) => {
        const attendeeIdsResult = await db.select({
          userId: meetingsToUsers.userId
        })
        .from(meetingsToUsers)
        .where(eq(meetingsToUsers.meetingId, meeting.id));
        
        return {
          ...meeting,
          attendeeIds: attendeeIdsResult.map(result => result.userId)
        };
      })
    );
    
    return meetingsWithAttendeeIds;
  }

  async updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting> {
    const [updatedMeeting] = await db.update(meetings)
      .set(meeting)
      .where(eq(meetings.id, id))
      .returning();
    
    if (!updatedMeeting) {
      throw new Error(`Meeting with id ${id} not found`);
    }
    
    return updatedMeeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    // First delete all related records
    await db.delete(meetingsToUsers).where(eq(meetingsToUsers.meetingId, id));
    await db.delete(meetingsToObjectives).where(eq(meetingsToObjectives.meetingId, id));
    await db.delete(meetingsToKeyResults).where(eq(meetingsToKeyResults.meetingId, id));
    await db.delete(actionItems).where(eq(actionItems.meetingId, id));
    
    // Then delete the meeting
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // Meeting Attendees
  async addAttendeeToMeeting(meetingId: string, userId: string): Promise<MeetingToUser> {
    // Check if the user is already an attendee
    const [existingAttendee] = await db.select()
      .from(meetingsToUsers)
      .where(
        and(
          eq(meetingsToUsers.meetingId, meetingId),
          eq(meetingsToUsers.userId, userId)
        )
      );
    
    if (existingAttendee) {
      return existingAttendee;
    }
    
    // Add the user as an attendee
    const [newAttendee] = await db.insert(meetingsToUsers)
      .values({
        meetingId,
        userId,
        isAttending: true,
        createdAt: new Date()
      })
      .returning();
    
    return newAttendee;
  }

  async removeAttendeeFromMeeting(meetingId: string, userId: string): Promise<void> {
    await db.delete(meetingsToUsers)
      .where(
        and(
          eq(meetingsToUsers.meetingId, meetingId),
          eq(meetingsToUsers.userId, userId)
        )
      );
  }

  async updateAttendeeStatus(meetingId: string, userId: string, isAttending: boolean): Promise<MeetingToUser> {
    const [updatedAttendee] = await db.update(meetingsToUsers)
      .set({ isAttending })
      .where(
        and(
          eq(meetingsToUsers.meetingId, meetingId),
          eq(meetingsToUsers.userId, userId)
        )
      )
      .returning();
    
    if (!updatedAttendee) {
      throw new Error(`Attendee record not found for meeting ${meetingId} and user ${userId}`);
    }
    
    return updatedAttendee;
  }

  async getMeetingAttendees(meetingId: string): Promise<Array<User & { isAttending: boolean }>> {
    return db.select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      name: users.name,
      title: users.title,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
      teamId: users.teamId,
      level: users.level,
      timezone: users.timezone,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      tenantId: users.tenantId,
      defaultTenantId: users.defaultTenantId,
      isEnabled: users.isEnabled,
      isAdmin: users.isAdmin,
      isAttending: meetingsToUsers.isAttending
    })
    .from(meetingsToUsers)
    .innerJoin(users, eq(meetingsToUsers.userId, users.id))
    .where(eq(meetingsToUsers.meetingId, meetingId));
  }

  // Meeting Action Items
  async createActionItem(actionItem: InsertActionItem): Promise<ActionItem> {
    const [newActionItem] = await db.insert(actionItems).values(actionItem).returning();
    return newActionItem;
  }

  async getActionItem(id: string): Promise<ActionItem | undefined> {
    const [actionItem] = await db.select().from(actionItems).where(eq(actionItems.id, id));
    return actionItem;
  }

  async getActionItemsByMeeting(meetingId: string): Promise<ActionItem[]> {
    return db.select()
      .from(actionItems)
      .where(eq(actionItems.meetingId, meetingId))
      .orderBy(actionItems.createdAt);
  }

  async getActionItemsByUser(userId: string): Promise<ActionItem[]> {
    return db.select()
      .from(actionItems)
      .where(eq(actionItems.assignedToId, userId))
      .orderBy(actionItems.createdAt);
  }

  async updateActionItem(id: string, actionItem: Partial<InsertActionItem>): Promise<ActionItem> {
    const [updatedActionItem] = await db.update(actionItems)
      .set(actionItem)
      .where(eq(actionItems.id, id))
      .returning();
    
    if (!updatedActionItem) {
      throw new Error(`Action item with id ${id} not found`);
    }
    
    return updatedActionItem;
  }

  async deleteActionItem(id: string): Promise<void> {
    await db.delete(actionItems).where(eq(actionItems.id, id));
  }

  async completeActionItem(id: string): Promise<ActionItem> {
    const [completedActionItem] = await db.update(actionItems)
      .set({ 
        completed: true,
        completedAt: new Date()
      })
      .where(eq(actionItems.id, id))
      .returning();
    
    if (!completedActionItem) {
      throw new Error(`Action item with id ${id} not found`);
    }
    
    return completedActionItem;
  }

  // Meeting Related OKRs
  async addObjectiveToMeeting(meetingId: string, objectiveId: string): Promise<MeetingToObjective> {
    // Check if the objective is already linked to the meeting
    const [existingLink] = await db.select()
      .from(meetingsToObjectives)
      .where(
        and(
          eq(meetingsToObjectives.meetingId, meetingId),
          eq(meetingsToObjectives.objectiveId, objectiveId)
        )
      );
    
    if (existingLink) {
      return existingLink;
    }
    
    // Link the objective to the meeting
    const [newLink] = await db.insert(meetingsToObjectives)
      .values({
        meetingId,
        objectiveId,
        createdAt: new Date()
      })
      .returning();
    
    return newLink;
  }

  async removeObjectiveFromMeeting(meetingId: string, objectiveId: string): Promise<void> {
    await db.delete(meetingsToObjectives)
      .where(
        and(
          eq(meetingsToObjectives.meetingId, meetingId),
          eq(meetingsToObjectives.objectiveId, objectiveId)
        )
      );
  }

  async addKeyResultToMeeting(meetingId: string, keyResultId: string): Promise<MeetingToKeyResult> {
    // Check if the key result is already linked to the meeting
    const [existingLink] = await db.select()
      .from(meetingsToKeyResults)
      .where(
        and(
          eq(meetingsToKeyResults.meetingId, meetingId),
          eq(meetingsToKeyResults.keyResultId, keyResultId)
        )
      );
    
    if (existingLink) {
      return existingLink;
    }
    
    // Link the key result to the meeting
    const [newLink] = await db.insert(meetingsToKeyResults)
      .values({
        meetingId,
        keyResultId,
        createdAt: new Date()
      })
      .returning();
    
    return newLink;
  }

  async removeKeyResultFromMeeting(meetingId: string, keyResultId: string): Promise<void> {
    await db.delete(meetingsToKeyResults)
      .where(
        and(
          eq(meetingsToKeyResults.meetingId, meetingId),
          eq(meetingsToKeyResults.keyResultId, keyResultId)
        )
      );
  }

  async getMeetingObjectives(meetingId: string): Promise<Objective[]> {
    // Get all objectives related to the meeting
    const objectiveLinks = await db.select({
      objectiveId: meetingsToObjectives.objectiveId
    })
    .from(meetingsToObjectives)
    .where(eq(meetingsToObjectives.meetingId, meetingId));

    if (!objectiveLinks.length) return [];

    const objectiveIds = objectiveLinks.map(link => link.objectiveId);

    // Get the full objective details
    return db.select()
      .from(objectives)
      .where(inArray(objectives.id, objectiveIds));
  }

  async getMeetingKeyResults(meetingId: string): Promise<KeyResult[]> {
    // Get all key results related to the meeting
    const keyResultLinks = await db.select({
      keyResultId: meetingsToKeyResults.keyResultId
    })
    .from(meetingsToKeyResults)
    .where(eq(meetingsToKeyResults.meetingId, meetingId));

    if (!keyResultLinks.length) return [];

    const keyResultIds = keyResultLinks.map(link => link.keyResultId);

    // Get the full key result details
    return db.select()
      .from(keyResults)
      .where(inArray(keyResults.id, keyResultIds));
  }
  
  async getFeedbackForUser(userId: string, tenantId: string): Promise<any[]> {
    try {
      console.log(`Getting feedback for user ${userId} in tenant ${tenantId}`);
      const receivedFeedback = await db.select({
        id: feedback.id,
        content: feedback.content,
        title: feedback.title,
        type: feedback.type,
        rating: feedback.rating,
        from: feedback.userId,
        createdAt: feedback.createdAt,
      })
      .from(feedback)
      .where(and(
        eq(feedback.receiverId, userId),
        eq(feedback.tenantId, tenantId)
      ))
      .orderBy(desc(feedback.createdAt));
      
      // Enhance feedback with user information
      const enhancedFeedback = await Promise.all(
        receivedFeedback.map(async (fb) => {
          // Get user information for the sender
          const sender = await this.getUser(fb.from);
          return {
            ...fb,
            fromUser: sender ? {
              id: sender.id,
              name: sender.name,
              email: sender.email,
              avatar: sender.avatar,
              initials: sender.initials || sender.name?.substring(0, 2).toUpperCase() || 'UN',
            } : null,
            date: fb.createdAt // alias createdAt as date for frontend compatibility
          };
        })
      );
      
      return enhancedFeedback;
    } catch (error) {
      console.error(`Error getting feedback for user ${userId} in tenant ${tenantId}:`, error);
      return [];
    }
  }

  // Project Management
  async createProject(projectData: any): Promise<Project> {
    try {
      console.log("Raw project data received:", {
        ...projectData,
        // Don't log sensitive fields
        password: projectData.password ? '***' : undefined
      });
      
      // Ensure we have a tenant_id - this is required
      let tenantId = projectData.tenant_id || projectData.tenantId;
      if (!tenantId) {
        throw new Error("tenant_id is required but was not provided in the project data");
      }
      
      // Handle both camelCase and snake_case field names
      // Prefer snake_case but fall back to camelCase
      const dbFields = {
        id: projectData.id || `01${require('ulid').ulid().slice(2)}`, // Generate ID if not provided
        title: projectData.title || "Untitled Project",
        description: projectData.description || "",
        status: projectData.status || "todo",
        // Priority handling - can come in as string or number
        priority: typeof projectData.priority === 'number' ? 
                  projectData.priority : 
                  this.convertPriorityToNumber(projectData.priority),
        // Handle both assigned_to_id and assignedToId
        assigned_to_id: projectData.assigned_to_id || projectData.assignedToId || null,
        // Handle both team_id and teamId
        team_id: projectData.team_id || projectData.teamId || null,
        // Handle both created_by_id and createdById
        created_by_id: projectData.created_by_id || projectData.createdById || null,
        // Force tenant_id to be set and not null - Use direct assignment, not from the object
        tenant_id: String(tenantId), // Force to string and cannot be null
        // Handle date fields
        start_date: projectData.start_date || projectData.startDate || null,
        due_date: projectData.due_date || projectData.dueDate || null,
        created_at: projectData.created_at || projectData.createdAt || new Date(),
        // Handle tags array
        tags: projectData.tags || null
      };
      
      console.log("Normalized project data for database:", dbFields);
      
      // Double-check that tenant_id is set before inserting
      if (!dbFields.tenant_id) {
        throw new Error(`tenant_id is required but was null or undefined: ${JSON.stringify(dbFields)}`);
      }
      
      // Direct SQL query to ensure tenant_id is set correctly
      try {
        console.log("About to execute SQL insert with these fields:", JSON.stringify(dbFields, null, 2));
        
        // Create SQL insert that explicitly sets the tenant_id
        const [newProject] = await db.insert(projects)
          .values({
            ...dbFields,
            tenant_id: String(tenantId) // Make sure this is not null
          })
          .returning();
          
        console.log("New project created successfully:", newProject);
        return newProject;
      } catch (innerError) {
        console.error("Database insertion error:", innerError);
        // Try a fallback approach with direct values
        console.log("Attempting fallback approach with direct values");
        
        // Create a SQL query with explicit values
        const sqlQuery = `
          INSERT INTO projects (
            title, description, status, priority, 
            assigned_to_id, team_id, created_by_id, tenant_id, 
            start_date, due_date, created_at, tags
          ) VALUES (
            $1, $2, $3, $4, 
            $5, $6, $7, $8, 
            $9, $10, $11, $12
          ) RETURNING *
        `;
        
        const values = [
          dbFields.title,
          dbFields.description,
          dbFields.status,
          dbFields.priority,
          dbFields.assigned_to_id,
          dbFields.team_id,
          dbFields.created_by_id,
          String(tenantId), // Ensure tenant_id is not null
          dbFields.start_date,
          dbFields.due_date,
          dbFields.created_at,
          dbFields.tags
        ];
        
        console.log("Executing fallback SQL with values:", values);
        
        const result = await pool.query(sqlQuery, values);
        console.log("Fallback insert successful:", result.rows[0]);
        return result.rows[0];
      }
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  }
  
  // Helper method to convert priority strings to numbers
  private convertPriorityToNumber(priority: any): number {
    if (!priority) return 2; // Default to medium
    
    // If it's already a number, return it
    if (typeof priority === 'number') return priority;
    
    // If it's not a string, convert to string first
    const priorityStr = String(priority);
    
    const priorityMap: Record<string, number> = {
      low: 1,
      medium: 2,
      high: 3,
      urgent: 4
    };
    
    return priorityMap[priorityStr.toLowerCase()] || 2; // Default to medium
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByStatus(status: string, tenantId: string): Promise<Project[]> {
    return await db.select()
      .from(projects)
      .where(and(
        eq(projects.status, status),
        eq(projects.tenantId, tenantId)
      ))
      .orderBy(projects.priority);
  }

  async getProjectsByTenant(tenantId: string): Promise<Project[]> {
    // Query using raw SQL to ensure proper field mapping
    try {
      const result = await pool.query(`
        SELECT 
          id, title, description, status, priority,
          assigned_to_id, team_id, created_by_id, tenant_id,
          start_date, due_date, created_at, tags
        FROM projects 
        WHERE tenant_id = $1
        ORDER BY created_at DESC
      `, [tenantId]);
      
      // Transform the results to match the frontend schema
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority || 'medium',
        dueDate: row.due_date,
        startDate: row.start_date,
        teamId: row.team_id,
        assignedToId: row.assigned_to_id,
        ownerId: row.created_by_id, // Map created_by_id to ownerId for frontend 
        tenantId: row.tenant_id,
        createdAt: row.created_at,
        tags: row.tags || [],
        // Add default values for any missing fields that frontend might expect
        checklistTotal: 0,
        checklistCompleted: 0,
        commentsCount: 0,
        assignees: [], // Add empty assignees array for kanban board
        comments: 0 // Add comments count for kanban board
      }));
    } catch (error) {
      console.error("Error fetching projects:", error);
      // Return empty array on error to prevent app from crashing
      return [];
    }
  }

  async updateProject(id: string, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db.update(projects)
      .set(project)
      .where(eq(projects.id, id))
      .returning();
    
    if (!updatedProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    return updatedProject;
  }

  async updateProjectStatus(id: string, status: string): Promise<Project> {
    const [updatedProject] = await db.update(projects)
      .set({ status })
      .where(eq(projects.id, id))
      .returning();
    
    if (!updatedProject) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    return updatedProject;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // User Progress Tracking
  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    try {
      // Check if a progress record already exists for this user and objective
      const existingProgress = await this.getUserProgressByUserAndObjective(
        progress.userId, 
        progress.objectiveId || ''
      );
      
      if (existingProgress) {
        // Update the existing progress record instead of creating a new one
        return await this.updateUserProgress(existingProgress.id, {
          progress: progress.progress,
          lastUpdated: new Date()
        });
      }
      
      // Create a new progress record
      const [createdProgress] = await db.insert(userProgress)
        .values({
          ...progress,
          lastUpdated: new Date() // Ensure lastUpdated is current
        })
        .returning();
      
      return createdProgress;
    } catch (error) {
      console.error("Error creating user progress:", error);
      throw error;
    }
  }

  async getUserProgress(id: string): Promise<UserProgress | undefined> {
    try {
      const [progress] = await db.select().from(userProgress).where(eq(userProgress.id, id));
      return progress;
    } catch (error) {
      console.error("Error getting user progress:", error);
      throw error;
    }
  }

  async getUserProgressByUserAndObjective(userId: string, objectiveId: string): Promise<UserProgress | undefined> {
    try {
      const [progress] = await db.select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.objectiveId, objectiveId)
        ));
      return progress;
    } catch (error) {
      console.error("Error getting user progress by user and objective:", error);
      throw error;
    }
  }

  async getUserObjectivesProgress(userId: string, tenantId: string): Promise<UserProgress[]> {
    try {
      return await db.select()
        .from(userProgress)
        .where(and(
          eq(userProgress.userId, userId),
          eq(userProgress.tenantId, tenantId)
        ));
    } catch (error) {
      console.error("Error getting user objectives progress:", error);
      throw error;
    }
  }

  async updateUserProgress(id: string, progress: Partial<InsertUserProgress>): Promise<UserProgress> {
    try {
      const [updatedProgress] = await db.update(userProgress)
        .set({
          ...progress,
          lastUpdated: new Date() // Always update the lastUpdated field
        })
        .where(eq(userProgress.id, id))
        .returning();
      
      if (!updatedProgress) {
        throw new Error(`User progress with id ${id} not found`);
      }
      
      return updatedProgress;
    } catch (error) {
      console.error("Error updating user progress:", error);
      throw error;
    }
  }
}

// Use the database storage implementation
export const storage = new DatabaseStorage();