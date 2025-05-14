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
         actionItems, ActionItem, InsertActionItem } from "@shared/schema";
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
  
  // Team Management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: string): Promise<Team | undefined>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByParent(parentId: string): Promise<Team[]>;
  addUserToTeam(userId: string, teamId: string): Promise<User>;
  removeUserFromTeam(userId: string): Promise<User>;
  
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
  
  // Timeframes
  createTimeframe(timeframe: InsertTimeframe): Promise<Timeframe>;
  getTimeframe(id: string): Promise<Timeframe | undefined>;
  getAllTimeframes(): Promise<Timeframe[]>;
  getTimeframesByCadence(cadenceId: string): Promise<Timeframe[]>;
  
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
  getCheckInsByObjective(objectiveId: string): Promise<CheckIn[]>;
  getCheckInsByKeyResult(keyResultId: string): Promise<CheckIn[]>;
  getRecentCheckIns(limit: number): Promise<CheckIn[]>;
  
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
    }).from(users).where(eq(users.username, username));
    
    return user;
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
          userRole: connection?.role || 'member',
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
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const [team] = await db.select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      color: teams.color, 
      icon: teams.icon,
      parentId: teams.parentId,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt
    }).from(teams).where(eq(teams.id, id));
    return team;
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
    return db.select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      color: teams.color,
      icon: teams.icon,
      parentId: teams.parentId,
      ownerId: teams.ownerId,
      createdAt: teams.createdAt
    }).from(teams);
  }
  
  async getTeamsByTenant(tenantId: string): Promise<Team[]> {
    try {
      // Since the teams table doesn't have a tenant_id column,
      // we need to get teams based on the owner_id of users in the tenant
      
      // First, get all users who belong to this tenant
      const tenantUsers = await db.select({
        id: users.id
      })
      .from(users)
      .innerJoin(usersToTenants, eq(usersToTenants.userId, users.id))
      .where(eq(usersToTenants.tenantId, tenantId));
      
      // Extract user IDs
      const userIds = tenantUsers.map(user => user.id);
      
      if (userIds.length === 0) {
        console.log(`No users found for tenant ${tenantId}`);
        return []; // No users in this tenant, so no teams
      }
      
      console.log(`Found ${userIds.length} users for tenant ${tenantId}`, userIds);
      
      // Get teams where the owner_id is in the list of user IDs from this tenant
      return db.select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        color: teams.color,
        icon: teams.icon,
        parentId: teams.parentId,
        ownerId: teams.ownerId,
        createdAt: teams.createdAt
      })
      .from(teams)
      .where(inArray(teams.ownerId, userIds));
    } catch (error) {
      console.error('Error in getTeamsByTenant:', error);
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
    const [newAccessGroup] = await db.insert(accessGroups).values(accessGroup).returning();
    return newAccessGroup;
  }

  async getAccessGroup(id: string): Promise<AccessGroup | undefined> {
    const [accessGroup] = await db.select().from(accessGroups).where(eq(accessGroups.id, id));
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

  async assignUserToAccessGroup(userId: string, accessGroupId: string): Promise<void> {
    await db.insert(userAccessGroups).values({
      userId,
      accessGroupId
    });
  }

  // Cadences
  async createCadence(cadence: InsertCadence): Promise<Cadence> {
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
    const [newTimeframe] = await db.insert(timeframes).values(timeframe).returning();
    return newTimeframe;
  }

  async getTimeframe(id: string): Promise<Timeframe | undefined> {
    const [timeframe] = await db.select().from(timeframes).where(eq(timeframes.id, id));
    return timeframe;
  }

  async getAllTimeframes(): Promise<Timeframe[]> {
    // Select only columns that exist in the actual database
    return db.select({
      id: timeframes.id,
      name: timeframes.name,
      description: timeframes.description,
      startDate: timeframes.startDate,
      endDate: timeframes.endDate,
      cadenceId: timeframes.cadenceId,
      createdAt: timeframes.createdAt,
      // Exclude fields that don't exist in the actual database: tenant_id, updated_at
    }).from(timeframes);
  }

  async getTimeframesByCadence(cadenceId: string): Promise<Timeframe[]> {
    // Select only columns that exist in the actual database
    return db.select({
      id: timeframes.id,
      name: timeframes.name,
      description: timeframes.description,
      startDate: timeframes.startDate,
      endDate: timeframes.endDate,
      cadenceId: timeframes.cadenceId,
      createdAt: timeframes.createdAt,
      // Exclude fields that don't exist in the actual database: tenant_id, updated_at
    }).from(timeframes).where(eq(timeframes.cadenceId, cadenceId));
  }
  
  async updateTimeframe(id: string, timeframe: Partial<InsertTimeframe>): Promise<Timeframe> {
    const [updatedTimeframe] = await db.update(timeframes)
      .set(timeframe)
      .where(eq(timeframes.id, id))
      .returning();
    
    if (!updatedTimeframe) {
      throw new Error(`Timeframe with id ${id} not found`);
    }
    
    return updatedTimeframe;
  }
  
  async deleteTimeframe(id: string): Promise<void> {
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
    }).from(objectives).where(eq(objectives.teamId, teamId));
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
    // Check if objective_id is provided since it's required by the database
    if (!keyResult.objective_id) {
      throw new Error("objective_id is required to create a key result");
    }
    
    // Fix column names to match the database schema
    const values = {
      ...keyResult,
      // Make sure required fields are set with proper fallbacks
      current_value: keyResult.current_value || keyResult.start_value || "0",
      start_value: keyResult.start_value || "0",
      progress: keyResult.progress || 0,
      status: keyResult.status || "not_started",
      // Map schema columns to database columns if needed
      objectiveId: keyResult.objective_id
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
    const [newChatRoom] = await db.insert(chatRooms).values(chatRoom).returning();
    return newChatRoom;
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }

  async updateChatRoom(id: string, chatRoom: Partial<InsertChatRoom>): Promise<ChatRoom> {
    const [updatedRoom] = await db.update(chatRooms)
      .set({
        ...chatRoom,
        updatedAt: new Date()
      })
      .where(eq(chatRooms.id, id))
      .returning();
    
    if (!updatedRoom) {
      throw new Error(`Chat room with id ${id} not found`);
    }
    
    return updatedRoom;
  }

  async getAllChatRooms(): Promise<ChatRoom[]> {
    return db.select().from(chatRooms);
  }

  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
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
    
    return db.select()
      .from(chatRooms)
      .where(inArray(chatRooms.id, roomIds));
  }

  async getUserChatRooms(userId: string): Promise<(ChatRoom & { unreadCount: number })[]> {
    // Get all chat rooms where the user is a member
    const members = await db.select()
      .from(chatRoomMembers)
      .where(eq(chatRoomMembers.userId, userId));
    
    if (members.length === 0) {
      return [];
    }
    
    const roomIds = members.map(m => m.chatRoomId);
    const rooms = await db.select().from(chatRooms).where(inArray(chatRooms.id, roomIds));
    
    // Get unread counts for each room
    const results = await Promise.all(rooms.map(async (room) => {
      const member = members.find(m => m.chatRoomId === room.id);
      if (!member) {
        return { ...room, unreadCount: 0 };
      }
      
      // Count messages newer than user's last read timestamp
      const unreadMessages = await db.select({ count: count() })
        .from(messages)
        .where(
          and(
            eq(messages.chatRoomId, room.id),
            gt(messages.createdAt, member.lastRead),
            ne(messages.userId, userId) // Don't count user's own messages
          )
        );
      
      return { ...room, unreadCount: unreadMessages[0]?.count || 0 };
    }));
    
    return results;
  }

  async getChatRoomsByType(type: string): Promise<ChatRoom[]> {
    return db.select().from(chatRooms).where(eq(chatRooms.type, type));
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
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message> {
    const [updatedMessage] = await db.update(messages)
      .set({
        ...message,
        updatedAt: new Date(),
        isEdited: true
      })
      .where(eq(messages.id, id))
      .returning();
    
    if (!updatedMessage) {
      throw new Error(`Message with id ${id} not found`);
    }
    
    return updatedMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    // Soft delete - just mark as deleted
    await db.update(messages)
      .set({
        deletedAt: new Date(),
        content: "[This message was deleted]"
      })
      .where(eq(messages.id, id));
  }

  async getMessagesByChatRoom(
    chatRoomId: number, 
    limit: number = 50, 
    before?: number
  ): Promise<(Message & { user: User, attachments: Attachment[], reactions: Reaction[] })[]> {
    // Define the base query
    const baseConditions = and(
      eq(messages.chatRoomId, chatRoomId),
      isNull(messages.deletedAt)
    );
    
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
}

// Use the database storage implementation
export const storage = new DatabaseStorage();