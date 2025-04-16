import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Statuses for Objectives and Key Results
export const statusEnum = pgEnum("status", [
  "not_started",
  "on_track",
  "at_risk",
  "behind",
  "completed",
]);

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
  managerId: integer("manager_id"),
  teamId: integer("team_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"),
  icon: text("icon").default("building"),
  parentId: integer("parent_id"),
  ownerId: integer("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Highfive Recognition
export const highfives = pgTable("highfives", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  objectiveId: integer("objective_id").references(() => objectives.id),
  keyResultId: integer("key_result_id").references(() => keyResults.id),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const highfiveRecipients = pgTable("highfive_recipients", {
  id: serial("id").primaryKey(),
  highfiveId: integer("highfive_id").notNull().references(() => highfives.id),
  recipientId: integer("recipient_id").notNull().references(() => users.id),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Add relations after all tables are defined
// These will be added at the end of the file

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
  period: text("period").notNull(), // quarterly, annually, etc.
  startMonth: integer("start_month"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timeframes
export const timeframes = pgTable("timeframes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cadenceId: integer("cadence_id").references(() => cadences.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  parentId: integer("parent_id"),
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
  period: true,
  startMonth: true,
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

// Highfive schemas
export const insertHighfiveSchema = createInsertSchema(highfives).pick({
  senderId: true,
  message: true,
  objectiveId: true,
  keyResultId: true,
  isPublic: true,
});

export const insertHighfiveRecipientSchema = createInsertSchema(highfiveRecipients).pick({
  highfiveId: true,
  recipientId: true,
  isRead: true,
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

// Chat types
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;
export type ChatRoom = typeof chatRooms.$inferSelect;

export type InsertChatRoomMember = z.infer<typeof insertChatRoomMemberSchema>;
export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachments.$inferSelect;

export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type Reaction = typeof reactions.$inferSelect;

// Chat feature schema and types are defined at the end of this file

// For Authentication
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
    relationName: "manager",
  }),
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
    relationName: "team_members",
  }),
  managedUsers: many(users, {
    relationName: "manager",
  }),
  ownedTeams: many(teams, {
    relationName: "team_owner",
  }),
  objectives: many(objectives, {
    relationName: "objective_owner",
  }),
  keyResultsAssigned: many(keyResults, {
    relationName: "key_result_assignee",
  }),
  initiativesAssigned: many(initiatives, {
    relationName: "initiative_assignee",
  }),
  userAccessGroups: many(userAccessGroups, {
    relationName: "user_access",
  }),
  checkIns: many(checkIns, {
    relationName: "check_in_user",
  }),
  sentHighfives: many(highfives, {
    relationName: "sent_highfives",
  }),
  receivedHighfives: many(highfiveRecipients, {
    relationName: "received_highfives",
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  parent: one(teams, {
    fields: [teams.parentId],
    references: [teams.id],
    relationName: "parent_team",
  }),
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
    relationName: "team_owner",
  }),
  members: many(users, {
    relationName: "team_members",
  }),
  children: many(teams, {
    relationName: "parent_team",
  }),
  objectives: many(objectives, {
    relationName: "team_objectives",
  }),
}));

export const accessGroupsRelations = relations(accessGroups, ({ many }) => ({
  userAccessGroups: many(userAccessGroups, {
    relationName: "access_group_users",
  }),
}));

export const userAccessGroupsRelations = relations(userAccessGroups, ({ one }) => ({
  user: one(users, {
    fields: [userAccessGroups.userId],
    references: [users.id],
    relationName: "user_access",
  }),
  accessGroup: one(accessGroups, {
    fields: [userAccessGroups.accessGroupId],
    references: [accessGroups.id],
    relationName: "access_group_users",
  }),
}));

export const cadencesRelations = relations(cadences, ({ many }) => ({
  timeframes: many(timeframes, {
    relationName: "cadence_timeframes",
  }),
}));

export const timeframesRelations = relations(timeframes, ({ one, many }) => ({
  cadence: one(cadences, {
    fields: [timeframes.cadenceId],
    references: [cadences.id],
    relationName: "cadence_timeframes",
  }),
  objectives: many(objectives, {
    relationName: "timeframe_objectives",
  }),
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  owner: one(users, {
    fields: [objectives.ownerId],
    references: [users.id],
    relationName: "objective_owner",
  }),
  team: one(teams, {
    fields: [objectives.teamId],
    references: [teams.id],
    relationName: "team_objectives",
  }),
  timeframe: one(timeframes, {
    fields: [objectives.timeframeId],
    references: [timeframes.id],
    relationName: "timeframe_objectives",
  }),
  parent: one(objectives, {
    fields: [objectives.parentId],
    references: [objectives.id],
    relationName: "parent_objective",
  }),
  children: many(objectives, {
    relationName: "parent_objective",
  }),
  keyResults: many(keyResults, {
    relationName: "objective_key_results",
  }),
  checkIns: many(checkIns, {
    relationName: "objective_check_ins",
  }),
  highfives: many(highfives, {
    relationName: "objective_highfives",
  }),
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  objective: one(objectives, {
    fields: [keyResults.objectiveId],
    references: [objectives.id],
    relationName: "objective_key_results",
  }),
  assignedTo: one(users, {
    fields: [keyResults.assignedToId],
    references: [users.id],
    relationName: "key_result_assignee",
  }),
  initiatives: many(initiatives, {
    relationName: "key_result_initiatives",
  }),
  checkIns: many(checkIns, {
    relationName: "key_result_check_ins",
  }),
  highfives: many(highfives, {
    relationName: "key_result_highfives",
  }),
}));

export const initiativesRelations = relations(initiatives, ({ one }) => ({
  keyResult: one(keyResults, {
    fields: [initiatives.keyResultId],
    references: [keyResults.id],
    relationName: "key_result_initiatives",
  }),
  assignedTo: one(users, {
    fields: [initiatives.assignedToId],
    references: [users.id],
    relationName: "initiative_assignee",
  }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
    relationName: "check_in_user",
  }),
  objective: one(objectives, {
    fields: [checkIns.objectiveId],
    references: [objectives.id],
    relationName: "objective_check_ins",
  }),
  keyResult: one(keyResults, {
    fields: [checkIns.keyResultId],
    references: [keyResults.id],
    relationName: "key_result_check_ins",
  }),
}));

// Highfive relations
export const highfivesRelations = relations(highfives, ({ one, many }) => ({
  sender: one(users, {
    fields: [highfives.senderId],
    references: [users.id],
    relationName: "sent_highfives",
  }),
  objective: one(objectives, {
    fields: [highfives.objectiveId],
    references: [objectives.id],
    relationName: "objective_highfives",
  }),
  keyResult: one(keyResults, {
    fields: [highfives.keyResultId],
    references: [keyResults.id],
    relationName: "key_result_highfives",
  }),
  recipients: many(highfiveRecipients, {
    relationName: "highfive_recipients",
  }),
}));

export const highfiveRecipientsRelations = relations(highfiveRecipients, ({ one }) => ({
  highfive: one(highfives, {
    fields: [highfiveRecipients.highfiveId],
    references: [highfives.id],
    relationName: "highfive_recipients",
  }),
  recipient: one(users, {
    fields: [highfiveRecipients.recipientId],
    references: [users.id],
    relationName: "received_highfives",
  }),
}));

// Chat Feature Schema

// Chat Rooms Table
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("direct"), // direct, group, team
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").notNull().references(() => users.id)
});

// Chat Room Members Table
export const chatRoomMembers = pgTable("chat_room_members", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // member, admin
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastRead: timestamp("last_read").notNull().defaultNow()
});

// Messages Table with circular reference type fix
type MessageCircularReference = {
  id: number;
};

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatRoomId: integer("chat_room_id").notNull().references(() => chatRooms.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, image, file, system
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
  isEdited: boolean("is_edited").notNull().default(false),
  replyToId: integer("reply_to_id").references((): MessageCircularReference => messages.id)
});

// Attachments Table
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // mime type
  fileSize: integer("file_size").notNull(), // size in bytes
  fileUrl: text("file_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Reactions Table
export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Define Relations for chat
export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  creator: one(users, { 
    fields: [chatRooms.createdBy], 
    references: [users.id],
    relationName: "created_chat_rooms"
  }),
  members: many(chatRoomMembers, { relationName: "room_members" }),
  messages: many(messages, { relationName: "room_messages" })
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  chatRoom: one(chatRooms, { 
    fields: [chatRoomMembers.chatRoomId], 
    references: [chatRooms.id],
    relationName: "room_members"
  }),
  user: one(users, { 
    fields: [chatRoomMembers.userId], 
    references: [users.id],
    relationName: "user_chat_memberships"
  })
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  chatRoom: one(chatRooms, { 
    fields: [messages.chatRoomId], 
    references: [chatRooms.id],
    relationName: "room_messages"
  }),
  user: one(users, { 
    fields: [messages.userId], 
    references: [users.id],
    relationName: "user_messages"
  }),
  replyTo: one(messages, { 
    fields: [messages.replyToId], 
    references: [messages.id],
    relationName: "message_replies"
  }),
  attachments: many(attachments, { relationName: "message_attachments" }),
  reactions: many(reactions, { relationName: "message_reactions" })
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  message: one(messages, { 
    fields: [attachments.messageId], 
    references: [messages.id],
    relationName: "message_attachments"
  })
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  message: one(messages, { 
    fields: [reactions.messageId], 
    references: [messages.id],
    relationName: "message_reactions"
  }),
  user: one(users, { 
    fields: [reactions.userId], 
    references: [users.id],
    relationName: "user_reactions"
  })
}));

// Update user relations to include chat-related relations
// Include chat relations for users
export const usersRelationsWithChat = relations(users, ({ one, many }) => ({
  // Keep existing user relations
  createdChatRooms: many(chatRooms, { relationName: "created_chat_rooms" }),
  chatMemberships: many(chatRoomMembers, { relationName: "user_chat_memberships" }),
  messages: many(messages, { relationName: "user_messages" }),
  reactions: many(reactions, { relationName: "user_reactions" })
}));

// Add chat feature insert schemas
export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  type: true,
  createdBy: true
});

export const insertChatRoomMemberSchema = createInsertSchema(chatRoomMembers).pick({
  chatRoomId: true,
  userId: true,
  role: true
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatRoomId: true,
  userId: true,
  content: true,
  type: true,
  replyToId: true
});

export const insertAttachmentSchema = createInsertSchema(attachments).pick({
  messageId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  fileUrl: true
});

export const insertReactionSchema = createInsertSchema(reactions).pick({
  messageId: true,
  userId: true,
  emoji: true
});
