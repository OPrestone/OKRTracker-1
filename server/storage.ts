import { users, User, InsertUser, teams, Team, InsertTeam, accessGroups, AccessGroup, InsertAccessGroup, 
         cadences, Cadence, InsertCadence, timeframes, Timeframe, InsertTimeframe,
         objectives, Objective, InsertObjective, keyResults, KeyResult, InsertKeyResult,
         initiatives, Initiative, InsertInitiative, checkIns, CheckIn, InsertCheckIn } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private accessGroups: Map<number, AccessGroup>;
  private userAccessGroups: Map<number, { userId: number, accessGroupId: number }>;
  private cadences: Map<number, Cadence>;
  private timeframes: Map<number, Timeframe>;
  private objectives: Map<number, Objective>;
  private keyResults: Map<number, KeyResult>;
  private initiatives: Map<number, Initiative>;
  private checkIns: Map<number, CheckIn>;

  // IDs
  private userId: number;
  private teamId: number;
  private accessGroupId: number;
  private userAccessGroupId: number;
  private cadenceId: number;
  private timeframeId: number;
  private objectiveId: number;
  private keyResultId: number;
  private initiativeId: number;
  private checkInId: number;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.accessGroups = new Map();
    this.userAccessGroups = new Map();
    this.cadences = new Map();
    this.timeframes = new Map();
    this.objectives = new Map();
    this.keyResults = new Map();
    this.initiatives = new Map();
    this.checkIns = new Map();

    this.userId = 1;
    this.teamId = 1;
    this.accessGroupId = 1;
    this.userAccessGroupId = 1;
    this.cadenceId = 1;
    this.timeframeId = 1;
    this.objectiveId = 1;
    this.keyResultId = 1;
    this.initiativeId = 1;
    this.checkInId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByTeam(teamId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.teamId === teamId,
    );
  }

  // Team Management
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamId++;
    const team: Team = { ...insertTeam, id, createdAt: new Date() };
    this.teams.set(id, team);
    return team;
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const existingTeam = await this.getTeam(id);
    if (!existingTeam) {
      throw new Error(`Team with id ${id} not found`);
    }
    const updatedTeam = { ...existingTeam, ...team };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeamsByParent(parentId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.parentId === parentId,
    );
  }

  // Access Groups
  async createAccessGroup(insertAccessGroup: InsertAccessGroup): Promise<AccessGroup> {
    const id = this.accessGroupId++;
    const accessGroup: AccessGroup = { ...insertAccessGroup, id, createdAt: new Date() };
    this.accessGroups.set(id, accessGroup);
    return accessGroup;
  }

  async getAccessGroup(id: number): Promise<AccessGroup | undefined> {
    return this.accessGroups.get(id);
  }

  async updateAccessGroup(id: number, accessGroup: Partial<InsertAccessGroup>): Promise<AccessGroup> {
    const existingAccessGroup = await this.getAccessGroup(id);
    if (!existingAccessGroup) {
      throw new Error(`Access Group with id ${id} not found`);
    }
    const updatedAccessGroup = { ...existingAccessGroup, ...accessGroup };
    this.accessGroups.set(id, updatedAccessGroup);
    return updatedAccessGroup;
  }

  async getAllAccessGroups(): Promise<AccessGroup[]> {
    return Array.from(this.accessGroups.values());
  }

  async assignUserToAccessGroup(userId: number, accessGroupId: number): Promise<void> {
    const user = await this.getUser(userId);
    const accessGroup = await this.getAccessGroup(accessGroupId);
    
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    
    if (!accessGroup) {
      throw new Error(`Access Group with id ${accessGroupId} not found`);
    }
    
    const id = this.userAccessGroupId++;
    this.userAccessGroups.set(id, { userId, accessGroupId });
  }

  // Cadences
  async createCadence(insertCadence: InsertCadence): Promise<Cadence> {
    const id = this.cadenceId++;
    const cadence: Cadence = { ...insertCadence, id, createdAt: new Date() };
    this.cadences.set(id, cadence);
    return cadence;
  }

  async getCadence(id: number): Promise<Cadence | undefined> {
    return this.cadences.get(id);
  }

  async getAllCadences(): Promise<Cadence[]> {
    return Array.from(this.cadences.values());
  }

  // Timeframes
  async createTimeframe(insertTimeframe: InsertTimeframe): Promise<Timeframe> {
    const id = this.timeframeId++;
    const timeframe: Timeframe = { ...insertTimeframe, id, createdAt: new Date() };
    this.timeframes.set(id, timeframe);
    return timeframe;
  }

  async getTimeframe(id: number): Promise<Timeframe | undefined> {
    return this.timeframes.get(id);
  }

  async getAllTimeframes(): Promise<Timeframe[]> {
    return Array.from(this.timeframes.values());
  }

  async getTimeframesByCadence(cadenceId: number): Promise<Timeframe[]> {
    return Array.from(this.timeframes.values()).filter(
      (timeframe) => timeframe.cadenceId === cadenceId,
    );
  }

  // Objectives
  async createObjective(insertObjective: InsertObjective): Promise<Objective> {
    const id = this.objectiveId++;
    const objective: Objective = { 
      ...insertObjective, 
      id, 
      createdAt: new Date(),
      progress: 0
    };
    this.objectives.set(id, objective);
    return objective;
  }

  async getObjective(id: number): Promise<Objective | undefined> {
    return this.objectives.get(id);
  }

  async updateObjective(id: number, objective: Partial<InsertObjective>): Promise<Objective> {
    const existingObjective = await this.getObjective(id);
    if (!existingObjective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    const updatedObjective = { ...existingObjective, ...objective };
    this.objectives.set(id, updatedObjective);
    return updatedObjective;
  }

  async getAllObjectives(): Promise<Objective[]> {
    return Array.from(this.objectives.values());
  }

  async getObjectivesByOwner(ownerId: number): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(
      (objective) => objective.ownerId === ownerId,
    );
  }

  async getObjectivesByTeam(teamId: number): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(
      (objective) => objective.teamId === teamId,
    );
  }

  async getObjectivesByTimeframe(timeframeId: number): Promise<Objective[]> {
    return Array.from(this.objectives.values()).filter(
      (objective) => objective.timeframeId === timeframeId,
    );
  }

  async updateObjectiveProgress(id: number, progress: number): Promise<Objective> {
    const objective = await this.getObjective(id);
    if (!objective) {
      throw new Error(`Objective with id ${id} not found`);
    }
    
    const updatedObjective = { ...objective, progress };
    this.objectives.set(id, updatedObjective);
    return updatedObjective;
  }

  // Key Results
  async createKeyResult(insertKeyResult: InsertKeyResult): Promise<KeyResult> {
    const id = this.keyResultId++;
    const keyResult: KeyResult = { 
      ...insertKeyResult, 
      id, 
      createdAt: new Date(),
      progress: 0,
      currentValue: insertKeyResult.startValue || "0"
    };
    this.keyResults.set(id, keyResult);
    return keyResult;
  }

  async getKeyResult(id: number): Promise<KeyResult | undefined> {
    return this.keyResults.get(id);
  }

  async updateKeyResult(id: number, keyResult: Partial<InsertKeyResult>): Promise<KeyResult> {
    const existingKeyResult = await this.getKeyResult(id);
    if (!existingKeyResult) {
      throw new Error(`Key Result with id ${id} not found`);
    }
    const updatedKeyResult = { ...existingKeyResult, ...keyResult };
    this.keyResults.set(id, updatedKeyResult);
    return updatedKeyResult;
  }

  async getKeyResultsByObjective(objectiveId: number): Promise<KeyResult[]> {
    return Array.from(this.keyResults.values()).filter(
      (keyResult) => keyResult.objectiveId === objectiveId,
    );
  }

  async updateKeyResultProgress(id: number, progress: number): Promise<KeyResult> {
    const keyResult = await this.getKeyResult(id);
    if (!keyResult) {
      throw new Error(`Key Result with id ${id} not found`);
    }
    
    const updatedKeyResult = { ...keyResult, progress };
    this.keyResults.set(id, updatedKeyResult);
    
    // Update objective progress based on key results
    if (keyResult.objectiveId) {
      const objective = await this.getObjective(keyResult.objectiveId);
      if (objective) {
        const keyResults = await this.getKeyResultsByObjective(objective.id);
        const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
        const averageProgress = Math.round(totalProgress / keyResults.length);
        await this.updateObjectiveProgress(objective.id, averageProgress);
      }
    }
    
    return updatedKeyResult;
  }

  // Initiatives
  async createInitiative(insertInitiative: InsertInitiative): Promise<Initiative> {
    const id = this.initiativeId++;
    const initiative: Initiative = { ...insertInitiative, id, createdAt: new Date() };
    this.initiatives.set(id, initiative);
    return initiative;
  }

  async getInitiative(id: number): Promise<Initiative | undefined> {
    return this.initiatives.get(id);
  }

  async updateInitiative(id: number, initiative: Partial<InsertInitiative>): Promise<Initiative> {
    const existingInitiative = await this.getInitiative(id);
    if (!existingInitiative) {
      throw new Error(`Initiative with id ${id} not found`);
    }
    const updatedInitiative = { ...existingInitiative, ...initiative };
    this.initiatives.set(id, updatedInitiative);
    return updatedInitiative;
  }

  async getInitiativesByKeyResult(keyResultId: number): Promise<Initiative[]> {
    return Array.from(this.initiatives.values()).filter(
      (initiative) => initiative.keyResultId === keyResultId,
    );
  }

  // Check-ins
  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = this.checkInId++;
    const checkIn: CheckIn = { ...insertCheckIn, id, createdAt: new Date() };
    this.checkIns.set(id, checkIn);
    
    // Update key result progress if available
    if (checkIn.keyResultId && checkIn.progress !== undefined) {
      await this.updateKeyResultProgress(checkIn.keyResultId, checkIn.progress);
    }
    
    return checkIn;
  }

  async getCheckIn(id: number): Promise<CheckIn | undefined> {
    return this.checkIns.get(id);
  }

  async getCheckInsByUser(userId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter((checkIn) => checkIn.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCheckInsByObjective(objectiveId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter((checkIn) => checkIn.objectiveId === objectiveId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getCheckInsByKeyResult(keyResultId: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter((checkIn) => checkIn.keyResultId === keyResultId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentCheckIns(limit: number): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
