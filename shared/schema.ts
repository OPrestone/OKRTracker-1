import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  language: text("language").default("en"),
  role: text("role").default("user"),
  managerId: integer("manager_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"),
  icon: text("icon").default("building"),
  parentId: integer("parent_id").references(() => teams.id),
  ownerId: integer("owner_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Access Groups
export const accessGroups = pgTable("access_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  permissions: json("permissions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users to Access Groups
export const userAccessGroups = pgTable("user_access_groups", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessGroupId: integer("access_group_id").references(() => accessGroups.id).notNull(),
});

// Cadences
export const cadences = pgTable("cadences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeframes
export const timeframes = pgTable("timeframes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cadenceId: integer("cadence_id").references(() => cadences.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Statuses for Objectives and Key Results
export const statusEnum = pgEnum("status", [
  "not_started",
  "on_track",
  "at_risk",
  "behind",
  "completed",
]);

// Objectives
export const objectives = pgTable("objectives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  level: text("level").notNull(), // company, department, team, individual
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  teamId: integer("team_id").references(() => teams.id),
  timeframeId: integer("timeframe_id").references(() => timeframes.id).notNull(),
  status: text("status").default("not_started"),
  progress: integer("progress").default(0),
  parentId: integer("parent_id").references(() => objectives.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Key Results
export const keyResults = pgTable("key_results", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  objectiveId: integer("objective_id").references(() => objectives.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  targetValue: text("target_value"),
  currentValue: text("current_value"),
  startValue: text("start_value"),
  progress: integer("progress").default(0),
  status: text("status").default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Initiatives (projects, tasks or activities)
export const initiatives = pgTable("initiatives", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  keyResultId: integer("key_result_id").references(() => keyResults.id).notNull(),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  status: text("status").default("not_started"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Check-ins
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  objectiveId: integer("objective_id").references(() => objectives.id),
  keyResultId: integer("key_result_id").references(() => keyResults.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  progress: integer("progress"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  email: true,
  language: true,
  role: true,
  managerId: true,
  teamId: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  description: true,
  color: true,
  icon: true,
  parentId: true,
  ownerId: true,
});

export const insertAccessGroupSchema = createInsertSchema(accessGroups).pick({
  name: true,
  description: true,
  permissions: true,
});

export const insertCadenceSchema = createInsertSchema(cadences).pick({
  name: true,
  description: true,
});

export const insertTimeframeSchema = createInsertSchema(timeframes).pick({
  name: true,
  startDate: true,
  endDate: true,
  cadenceId: true,
});

export const insertObjectiveSchema = createInsertSchema(objectives).pick({
  title: true,
  description: true,
  level: true,
  ownerId: true,
  teamId: true,
  timeframeId: true,
  status: true,
  parentId: true,
});

export const insertKeyResultSchema = createInsertSchema(keyResults).pick({
  title: true,
  description: true,
  objectiveId: true,
  assignedToId: true,
  targetValue: true,
  startValue: true,
  status: true,
});

export const insertInitiativeSchema = createInsertSchema(initiatives).pick({
  title: true,
  description: true,
  keyResultId: true,
  assignedToId: true,
  status: true,
});

export const insertCheckInSchema = createInsertSchema(checkIns).pick({
  objectiveId: true,
  keyResultId: true,
  userId: true,
  progress: true,
  notes: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertAccessGroup = z.infer<typeof insertAccessGroupSchema>;
export type AccessGroup = typeof accessGroups.$inferSelect;

export type InsertCadence = z.infer<typeof insertCadenceSchema>;
export type Cadence = typeof cadences.$inferSelect;

export type InsertTimeframe = z.infer<typeof insertTimeframeSchema>;
export type Timeframe = typeof timeframes.$inferSelect;

export type InsertObjective = z.infer<typeof insertObjectiveSchema>;
export type Objective = typeof objectives.$inferSelect;

export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;
export type KeyResult = typeof keyResults.$inferSelect;

export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;
export type Initiative = typeof initiatives.$inferSelect;

export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;
export type CheckIn = typeof checkIns.$inferSelect;

// For Authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
