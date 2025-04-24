import { users, User, InsertUser, teams, Team, InsertTeam, accessGroups, AccessGroup, InsertAccessGroup, 
         cadences, Cadence, InsertCadence, timeframes, Timeframe, InsertTimeframe,
         objectives, Objective, InsertObjective, keyResults, KeyResult, InsertKeyResult,
         initiatives, Initiative, InsertInitiative, checkIns, CheckIn, InsertCheckIn, userAccessGroups,
         chatRooms, ChatRoom, InsertChatRoom, chatRoomMembers, ChatRoomMember, InsertChatRoomMember,
         messages, Message, InsertMessage, attachments, Attachment, InsertAttachment,
         reactions, Reaction, InsertReaction } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, count, inArray, isNull, gt, lt, ne } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  getUsersByTeam(teamId: number): Promise<User[]>;
  
  // Team Management
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  getAllTeams(): Promise<Team[]>;
  getTeamsByParent(parentId: number): Promise<Team[]>;
  
  // Access Groups
  createAccessGroup(accessGroup: InsertAccessGroup): Promise<AccessGroup>;
  getAccessGroup(id: number): Promise<AccessGroup | undefined>;
  updateAccessGroup(id: number, accessGroup: Partial<InsertAccessGroup>): Promise<AccessGroup>;
  getAllAccessGroups(): Promise<AccessGroup[]>;
  assignUserToAccessGroup(userId: number, accessGroupId: number): Promise<void>;
  
  // Cadences
  createCadence(cadence: InsertCadence): Promise<Cadence>;
  getCadence(id: number): Promise<Cadence | undefined>;
  getAllCadences(): Promise<Cadence[]>;
  
  // Timeframes
  createTimeframe(timeframe: InsertTimeframe): Promise<Timeframe>;
  getTimeframe(id: number): Promise<Timeframe | undefined>;
  getAllTimeframes(): Promise<Timeframe[]>;
  getTimeframesByCadence(cadenceId: number): Promise<Timeframe[]>;
  
  // Objectives
  createObjective(objective: InsertObjective): Promise<Objective>;
  getObjective(id: number): Promise<Objective | undefined>;
  updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective>;
  getAllObjectives(): Promise<Objective[]>;
  getObjectivesByOwner(ownerId: number): Promise<Objective[]>;
  getObjectivesByTeam(teamId: number): Promise<Objective[]>;
  getObjectivesByTimeframe(timeframeId: number): Promise<Objective[]>;
  updateObjectiveProgress(id: number, progress: number): Promise<Objective>;
  
  // Key Results
  createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult>;
  getKeyResult(id: number): Promise<KeyResult | undefined>;
  updateKeyResult(id: number, keyResult: Partial<InsertKeyResult>): Promise<KeyResult>;
  getKeyResultsByObjective(objectiveId: number): Promise<KeyResult[]>;
  updateKeyResultProgress(id: number, progress: number): Promise<KeyResult>;
  
  // Initiatives
  createInitiative(initiative: InsertInitiative): Promise<Initiative>;
  getInitiative(id: number): Promise<Initiative | undefined>;
  updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative>;
  getInitiativesByKeyResult(keyResultId: number): Promise<Initiative[]>;
  
  // Check-ins
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckIn(id: number): Promise<CheckIn | undefined>;
  getCheckInsByUser(userId: number): Promise<CheckIn[]>;
  getCheckInsByObjective(objectiveId: number): Promise<CheckIn[]>;
  getCheckInsByKeyResult(keyResultId: number): Promise<CheckIn[]>;
  getRecentCheckIns(limit: number): Promise<CheckIn[]>;
  
  // Chat Rooms
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getChatRoom(id: number): Promise<ChatRoom | undefined>;
  updateChatRoom(id: number, chatRoom: Partial<InsertChatRoom>): Promise<ChatRoom>;
  getAllChatRooms(): Promise<ChatRoom[]>;
  getChatRoomsByUser(userId: number): Promise<ChatRoom[]>;
  getUserChatRooms(userId: number): Promise<(ChatRoom & { unreadCount: number })[]>;
  getChatRoomsByType(type: string): Promise<ChatRoom[]>;
  
  // Chat Room Members
  addUserToChatRoom(chatRoomMember: InsertChatRoomMember): Promise<ChatRoomMember>;
  removeUserFromChatRoom(userId: number, chatRoomId: number): Promise<void>;
  getChatRoomMembers(chatRoomId: number): Promise<(ChatRoomMember & { user: User })[]>;
  updateLastRead(userId: number, chatRoomId: number): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessage(id: number): Promise<Message | undefined>;
  updateMessage(id: number, message: Partial<InsertMessage>): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  getMessagesByChatRoom(chatRoomId: number, limit?: number, before?: number): Promise<(Message & { user: User, attachments: Attachment[], reactions: Reaction[] })[]>;
  
  // Attachments
  createAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  getAttachmentsByMessage(messageId: number): Promise<Attachment[]>;
  
  // Reactions
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(userId: number, messageId: number, emoji: string): Promise<void>;
  getReactionsByMessage(messageId: number): Promise<(Reaction & { user: User })[]>;
  
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
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Filter out properties that might not exist in the database yet
      const { firstLogin, introVideoWatched, walkthroughCompleted, onboardingProgress, lastOnboardingStep, ...safeInsertUser } = insertUser;
      
      // Insert the user with only the essential properties
      const [user] = await db.insert(users).values(safeInsertUser).returning();
      
      // Return the user with default onboarding values (these will be handled by localStorage on client)
      return {
        ...user,
        firstLogin: true,
        introVideoWatched: false,
        walkthroughCompleted: false,
        onboardingProgress: 0,
        lastOnboardingStep: null
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
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

  async getUsersByTeam(teamId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.teamId, teamId));
  }
  
  async deleteUser(id: number): Promise<void> {
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

  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
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
    return db.select().from(teams);
  }

  async getTeamsByParent(parentId: number): Promise<Team[]> {
    return db.select().from(teams).where(eq(teams.parentId, parentId));
  }

  // Access Groups
  async createAccessGroup(accessGroup: InsertAccessGroup): Promise<AccessGroup> {
    const [newAccessGroup] = await db.insert(accessGroups).values(accessGroup).returning();
    return newAccessGroup;
  }

  async getAccessGroup(id: number): Promise<AccessGroup | undefined> {
    const [accessGroup] = await db.select().from(accessGroups).where(eq(accessGroups.id, id));
    return accessGroup;
  }

  async updateAccessGroup(id: number, accessGroup: Partial<InsertAccessGroup>): Promise<AccessGroup> {
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

  async assignUserToAccessGroup(userId: number, accessGroupId: number): Promise<void> {
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

  async getCadence(id: number): Promise<Cadence | undefined> {
    const [cadence] = await db.select().from(cadences).where(eq(cadences.id, id));
    return cadence;
  }

  async getAllCadences(): Promise<Cadence[]> {
    return db.select().from(cadences);
  }
  
  async updateCadence(id: number, cadence: Partial<InsertCadence>): Promise<Cadence> {
    const [updatedCadence] = await db.update(cadences)
      .set(cadence)
      .where(eq(cadences.id, id))
      .returning();
    
    if (!updatedCadence) {
      throw new Error(`Cadence with id ${id} not found`);
    }
    
    return updatedCadence;
  }
  
  async deleteCadence(id: number): Promise<void> {
    await db.delete(cadences).where(eq(cadences.id, id));
  }

  // Timeframes
  async createTimeframe(timeframe: InsertTimeframe): Promise<Timeframe> {
    const [newTimeframe] = await db.insert(timeframes).values(timeframe).returning();
    return newTimeframe;
  }

  async getTimeframe(id: number): Promise<Timeframe | undefined> {
    const [timeframe] = await db.select().from(timeframes).where(eq(timeframes.id, id));
    return timeframe;
  }

  async getAllTimeframes(): Promise<Timeframe[]> {
    return db.select().from(timeframes);
  }

  async getTimeframesByCadence(cadenceId: number): Promise<Timeframe[]> {
    return db.select().from(timeframes).where(eq(timeframes.cadenceId, cadenceId));
  }
  
  async updateTimeframe(id: number, timeframe: Partial<InsertTimeframe>): Promise<Timeframe> {
    const [updatedTimeframe] = await db.update(timeframes)
      .set(timeframe)
      .where(eq(timeframes.id, id))
      .returning();
    
    if (!updatedTimeframe) {
      throw new Error(`Timeframe with id ${id} not found`);
    }
    
    return updatedTimeframe;
  }
  
  async deleteTimeframe(id: number): Promise<void> {
    await db.delete(timeframes).where(eq(timeframes.id, id));
  }

  // Objectives
  async createObjective(objective: InsertObjective): Promise<Objective> {
    const [newObjective] = await db.insert(objectives).values(objective).returning();
    return newObjective;
  }

  async getObjective(id: number): Promise<Objective | undefined> {
    const [objective] = await db.select().from(objectives).where(eq(objectives.id, id));
    return objective;
  }

  async updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective> {
    const [updatedObjective] = await db.update(objectives)
      .set(objective)
      .where(eq(objectives.id, id))
      .returning();
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    return updatedObjective;
  }

  async getAllObjectives(): Promise<Objective[]> {
    return db.select().from(objectives);
  }

  async getObjectivesByOwner(ownerId: number): Promise<Objective[]> {
    return db.select().from(objectives).where(eq(objectives.ownerId, ownerId));
  }

  async getObjectivesByTeam(teamId: number): Promise<Objective[]> {
    return db.select().from(objectives).where(eq(objectives.teamId, teamId));
  }

  async getObjectivesByTimeframe(timeframeId: number): Promise<Objective[]> {
    return db.select().from(objectives).where(eq(objectives.timeframeId, timeframeId));
  }

  async updateObjectiveProgress(id: number, progress: number): Promise<Objective> {
    const [updatedObjective] = await db.update(objectives)
      .set({ progress })
      .where(eq(objectives.id, id))
      .returning();
    
    if (!updatedObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    return updatedObjective;
  }

  // Key Results
  async createKeyResult(keyResult: InsertKeyResult): Promise<KeyResult> {
    // Ensure currentValue is set if not provided
    const values = {
      ...keyResult,
      currentValue: keyResult.startValue || "0"
    };
    
    const [newKeyResult] = await db.insert(keyResults).values(values).returning();
    return newKeyResult;
  }

  async getKeyResult(id: number): Promise<KeyResult | undefined> {
    const [keyResult] = await db.select().from(keyResults).where(eq(keyResults.id, id));
    return keyResult;
  }

  async updateKeyResult(id: number, keyResult: Partial<InsertKeyResult>): Promise<KeyResult> {
    const [updatedKeyResult] = await db.update(keyResults)
      .set(keyResult)
      .where(eq(keyResults.id, id))
      .returning();
    
    if (!updatedKeyResult) {
      throw new Error(`Key Result with id ${id} not found`);
    }
    
    return updatedKeyResult;
  }

  async getKeyResultsByObjective(objectiveId: number): Promise<KeyResult[]> {
    return db.select().from(keyResults).where(eq(keyResults.objectiveId, objectiveId));
  }

  async updateKeyResultProgress(id: number, progress: number): Promise<KeyResult> {
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

  async getInitiative(id: number): Promise<Initiative | undefined> {
    const [initiative] = await db.select().from(initiatives).where(eq(initiatives.id, id));
    return initiative;
  }

  async updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative> {
    const [updatedInitiative] = await db.update(initiatives)
      .set(initiative)
      .where(eq(initiatives.id, id))
      .returning();
    
    if (!updatedInitiative) {
      throw new Error(`Initiative with id ${id} not found`);
    }
    
    return updatedInitiative;
  }

  async getInitiativesByKeyResult(keyResultId: number): Promise<Initiative[]> {
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

  async getCheckIn(id: number): Promise<CheckIn | undefined> {
    const [checkIn] = await db.select().from(checkIns).where(eq(checkIns.id, id));
    return checkIn;
  }

  async getCheckInsByUser(userId: number): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.userId, userId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getCheckInsByObjective(objectiveId: number): Promise<CheckIn[]> {
    return db.select()
      .from(checkIns)
      .where(eq(checkIns.objectiveId, objectiveId))
      .orderBy(desc(checkIns.createdAt));
  }

  async getCheckInsByKeyResult(keyResultId: number): Promise<CheckIn[]> {
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

  // Chat Rooms
  async createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom> {
    const [newChatRoom] = await db.insert(chatRooms).values(chatRoom).returning();
    return newChatRoom;
  }

  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    const [room] = await db.select().from(chatRooms).where(eq(chatRooms.id, id));
    return room;
  }

  async updateChatRoom(id: number, chatRoom: Partial<InsertChatRoom>): Promise<ChatRoom> {
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

  async getChatRoomsByUser(userId: number): Promise<ChatRoom[]> {
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

  async getUserChatRooms(userId: number): Promise<(ChatRoom & { unreadCount: number })[]> {
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

  async removeUserFromChatRoom(userId: number, chatRoomId: number): Promise<void> {
    await db.delete(chatRoomMembers)
      .where(
        and(
          eq(chatRoomMembers.userId, userId),
          eq(chatRoomMembers.chatRoomId, chatRoomId)
        )
      );
  }

  async getChatRoomMembers(chatRoomId: number): Promise<(ChatRoomMember & { user: User })[]> {
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

  async updateLastRead(userId: number, chatRoomId: number): Promise<void> {
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
}

// Use the database storage implementation
export const storage = new DatabaseStorage();