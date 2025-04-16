import { users, User, InsertUser, teams, Team, InsertTeam, accessGroups, AccessGroup, InsertAccessGroup, 
         cadences, Cadence, InsertCadence, timeframes, Timeframe, InsertTimeframe,
         objectives, Objective, InsertObjective, keyResults, KeyResult, InsertKeyResult,
         initiatives, Initiative, InsertInitiative, checkIns, CheckIn, InsertCheckIn, userAccessGroups } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User Management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
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
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
    return db.select().from(users);
  }

  async getUsersByTeam(teamId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.teamId, teamId));
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
}

// Use the database storage implementation
export const storage = new DatabaseStorage();