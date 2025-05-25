import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { pgTableWithUlid } from "./utils/schema";

// ENUMS
export const userRoleEnum = pgEnum("user_role", ["owner", "admin", "member"]);
export const objectiveStatusEnum = pgEnum("objective_status", ["draft", "active", "completed", "archived"]);
export const objectiveStatusReasonEnum = pgEnum("objective_status_reason", ["success", "failed", "changed", "other"]);
export const keyResultTypeEnum = pgEnum("key_result_type", ["numeric", "percentage", "boolean", "currency", "milestone"]);
export const chatRoomTypeEnum = pgEnum("chat_room_type", ["direct", "group", "objective", "keyresult", "team", "automated"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "system", "checkin"]);
export const teamTypeEnum = pgEnum("team_type", ["department", "team", "project"]);
export const featureEnum = pgEnum("feature", ["objectives", "key_results", "chat", "financial_tracking", "moods", "badges", "feedback"]);
export const userLevelEnum = pgEnum("user_level", ["beginner", "intermediate", "advanced", "expert"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense", "transfer"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "unpaid", "incomplete", "incomplete_expired", "trialing"]);
export const paymentStatusEnum = pgEnum("payment_status", ["succeeded", "pending", "failed"]);
export const projectStatusEnum = pgEnum("project_status", ["backlog", "todo", "in-progress", "review", "done"]);
export const meetingStatusEnum = pgEnum("meeting_status", ["scheduled", "completed", "cancelled", "upcoming"]);
export const meetingPlatformEnum = pgEnum("meeting_platform", ["google_meet", "zoom", "microsoft_teams", "in_person", "other"]);

// TABLE SCHEMAS

export const organizationMission = pgTableWithUlid("organization_mission", {
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  mission: text("mission"),
  vision: text("vision"),
  boundaries: text("boundaries"),
  strategicDirection: text("strategic_direction"),
  behaviors: text("behaviors"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cycles = pgTableWithUlid("cycles", {
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  timeframeId: text("timeframe_id").references(() => timeframes.id),
  status: text("status").default("active").notNull(), // active, completed, upcoming
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTableWithUlid("users", {
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(), // Add this field to match DB
  lastName: text("last_name").notNull(), // Add this field to match DB
  email: text("email").notNull().unique(),
  language: text("language").default("en"), // Add this field to match DB
  role: text("role").default("user"), // Add this field to match DB
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  teamId: text("team_id").references(() => teams.id),
  managerId: text("manager_id"), // Add this field to match DB
  level: userLevelEnum("level").default("beginner"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tenantId: text("tenant_id").references(() => tenants.id),
  defaultTenantId: text("default_tenant_id").references(() => tenants.id),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  firstLogin: boolean("first_login").default(true), // Add this field to match DB
  introVideoWatched: boolean("intro_video_watched").default(false), // Add this field to match DB
  walkthroughCompleted: boolean("walkthrough_completed").default(false), // Add this field to match DB
  onboardingProgress: integer("onboarding_progress").default(0), // Add this field to match DB
  lastOnboardingStep: text("last_onboarding_step"), // Add this field to match DB
  lastLoginAt: timestamp("last_login_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const usersToTenants = pgTable("users_to_tenants", {
  id: text("id").primaryKey(), // Added id column which is primary key
  userId: text("user_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  role: userRoleEnum("role").default("member"),
  isDefault: boolean("is_default").default(false), // Added isDefault column
  createdAt: timestamp("created_at").defaultNow(),
});

export const teams = pgTableWithUlid("teams", {
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  parentId: text("parent_id").references(() => teams.id),
  ownerId: text("owner_id").references(() => users.id),
  leaderId: text("leader_id").references(() => users.id, { onDelete: 'set null' }),
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accessGroups = pgTableWithUlid("access_groups", {
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").array(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // updatedAt column does not exist in the actual database table
  // updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userAccessGroups = pgTable("user_access_groups", {
  userId: text("user_id").references(() => users.id).notNull(),
  accessGroupId: text("access_group_id").references(() => accessGroups.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.accessGroupId] })
}));

export const cadences = pgTableWithUlid("cadences", {
  name: text("name").notNull(),
  description: text("description"),
  // The database has 'period' column instead of 'period_days'
  period: text("period"), // e.g., 'weekly', 'quarterly'
  // Removed startMonth field as requested
  // Tenant ID to ensure cadences are organization-specific
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // updatedAt column doesn't exist in the actual database table
  // updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeframes = pgTableWithUlid("timeframes", {
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cadenceId: text("cadence_id").references(() => cadences.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // updatedAt column doesn't exist in the actual database table
  // updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const objectives = pgTableWithUlid("objectives", {
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id").references(() => users.id).notNull(),
  teamId: text("team_id").references(() => teams.id),
  timeframeId: text("timeframe_id").references(() => timeframes.id).notNull(),
  status: objectiveStatusEnum("status").default("draft").notNull(),
  // statusReason is removed as it doesn't exist in the DB
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  parentId: text("parent_id").references(() => objectives.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  level: text("level").notNull(), // Required field per database schema
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // updatedAt is removed as it doesn't exist in the DB
});

export const keyResults = pgTableWithUlid("key_results", {
  title: text("title").notNull(),
  description: text("description"),
  // Based on the database schema, there's no "type" column, so we're removing it
  // currentValue, targetValue, startValue are text in the database (not integer)
  currentValue: text("current_value"),
  targetValue: text("target_value"),
  startValue: text("start_value"),
  // assignedToId exists in DB but not in schema
  assignedToId: text("assigned_to_id").references(() => users.id),
  // No format or milestones columns in the database
  objectiveId: text("objective_id").references(() => objectives.id).notNull(),
  // owner_id doesn't exist in database, but assigned_to_id serves a similar purpose
  progress: integer("progress").default(0), // optional in database
  status: text("status").default("not_started"),
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow(),
  // updatedAt column doesn't exist in the database
});

export const initiatives = pgTableWithUlid("initiatives", {
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull(), // e.g., todo, in-progress, done
  keyResultId: text("key_result_id").references(() => keyResults.id).notNull(),
  ownerId: text("owner_id").references(() => users.id),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const checkIns = pgTableWithUlid("check_ins", {
  userId: text("user_id").references(() => users.id).notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  progress: integer("progress"),
  notes: text("notes"),
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTableWithUlid("user_progress", {
  userId: text("user_id").references(() => users.id).notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schema for userProgress
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ 
  id: true, 
  createdAt: true,
  lastUpdated: true 
});

export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type UserProgress = typeof userProgress.$inferSelect;

export const projects = pgTableWithUlid("projects", {
  title: text("title").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("backlog").notNull(),
  priority: integer("priority"),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  assignedToId: text("assigned_to_id").references(() => users.id),
  teamId: text("team_id").references(() => teams.id),
  // Use created_by_id instead of owner_id to match the actual database schema
  createdById: text("created_by_id").references(() => users.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // Add tags field to match database schema
  tags: text("tags").array(),
});

export const chatRooms = pgTableWithUlid("chat_rooms", {
  name: text("name"),
  type: chatRoomTypeEnum("type").default("group").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(), // Use integer to match actual DB schema
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatRoomMembers = pgTable("chat_room_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  chatRoomId: text("chat_room_id").references(() => chatRooms.id).notNull(),
  role: text("role").default("member").notNull(),
  lastRead: timestamp("last_read").defaultNow().notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  // Note: tenant_id column doesn't exist in the actual database
  // We'll implement tenant isolation through the chat room's creator
});

export const messages = pgTableWithUlid("messages", {
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text").notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  chatRoomId: text("chat_room_id").references(() => chatRooms.id).notNull(),
  replyToId: text("reply_to_id").references(() => messages.id),
  // Added tenant_id column that now exists in the database
  tenantId: text("tenant_id").references(() => tenants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
  isEdited: boolean("is_edited").default(false),
});

export const attachments = pgTableWithUlid("attachments", {
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  messageId: text("message_id").references(() => messages.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reactions = pgTable("reactions", {
  userId: text("user_id").references(() => users.id).notNull(),
  messageId: text("message_id").references(() => messages.id).notNull(),
  emoji: text("emoji").notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.messageId, t.emoji] })
}));

export const badges = pgTableWithUlid("badges", {
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  criteria: text("criteria").notNull(),
  points: integer("points").default(0).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  userId: text("user_id").references(() => users.id).notNull(),
  badgeId: text("badge_id").references(() => badges.id).notNull(),
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  awardedById: text("awarded_by_id").references(() => users.id).notNull(),
  reason: text("reason"),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.badgeId] })
}));

export const tenants = pgTableWithUlid("tenants", {
  name: text("name").notNull(),
  displayName: text("display_name"),
  description: text("description"),
  industry: text("industry"),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}).notNull(),
  plan: text("plan").default("free").notNull(),
  status: text("status").default("active").notNull(),
  max_users: integer("max_users").default(5).notNull(),
  domain: text("domain"),
  enabledFeatures: jsonb("enabled_features").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTableWithUlid("subscriptions", {
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  plan: text("plan").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTableWithUlid("payments", {
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  subscriptionId: text("subscription_id").references(() => subscriptions.id).notNull(),
  stripeInvoiceId: text("stripe_invoice_id").notNull().unique(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const onboarding = pgTableWithUlid("onboarding", {
  userId: text("user_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  steps: jsonb("steps").default([]).notNull(), // Array of step objects with status
  completed: boolean("completed").default(false).notNull(),
  currentStep: text("current_step"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feedbackTypeEnum = pgEnum("feedback_type", ["positive", "constructive", "recognition", "general"]);

export const feedback = pgTableWithUlid("feedback", {
  userId: text("user_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  title: text("title").notNull(),
  type: feedbackTypeEnum("type").default("general").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  rating: integer("rating"), // 1-5 rating
  objectiveId: text("objective_id").references(() => objectives.id),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMoods = pgTableWithUlid("team_moods", {
  teamId: text("team_id").references(() => teams.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  mood: integer("mood").notNull(), // 1-5 rating
  note: text("note"),
  submittedBy: text("submitted_by").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodEntries = pgTableWithUlid("mood_entries", {
  userId: text("user_id").references(() => users.id).notNull(),
  moodScore: integer("mood_score").notNull(), // 1-5 rating
  notes: text("notes"),
  date: timestamp("date").notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [moodEntries.tenantId],
    references: [tenants.id]
  })
}));

export const financialAccounts = pgTableWithUlid("financial_accounts", {
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // e.g., checking, savings, credit, investment
  balance: integer("balance").default(0).notNull(), // in cents
  currency: text("currency").default("usd").notNull(),
  teamId: text("team_id").references(() => teams.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financialTransactions = pgTableWithUlid("financial_transactions", {
  accountId: text("account_id").references(() => financialAccounts.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  category: text("category"),
  type: transactionTypeEnum("type").notNull(),
  status: text("status").default("completed").notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  createdById: text("created_by_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const financialBudgets = pgTableWithUlid("financial_budgets", {
  name: text("name").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("usd").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  category: text("category"),
  teamId: text("team_id").references(() => teams.id).notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  createdById: text("created_by_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RELATIONS

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id]
  }),
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  defaultTenant: one(tenants, {
    fields: [users.defaultTenantId],
    references: [tenants.id]
  }),
  ownedObjectives: many(objectives, { relationName: "owner" }),
  ownedKeyResults: many(keyResults, { relationName: "owner" }),
  checkIns: many(checkIns),
  tenants: many(usersToTenants)
}));

export const usersToTenantsRelations = relations(usersToTenants, ({ one }) => ({
  user: one(users, {
    fields: [usersToTenants.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [usersToTenants.tenantId],
    references: [tenants.id]
  })
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  parent: one(teams, {
    fields: [teams.parentId],
    references: [teams.id]
  }),
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id]
  }),
  leader: one(users, {
    fields: [teams.leaderId],
    references: [users.id]
  }),
  members: many(users),
  objectives: many(objectives),
  chatRoom: many(chatRooms)
}));

export const accessGroupsRelations = relations(accessGroups, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [accessGroups.tenantId],
    references: [tenants.id]
  }),
  users: many(userAccessGroups)
}));

export const userAccessGroupsRelations = relations(userAccessGroups, ({ one }) => ({
  user: one(users, {
    fields: [userAccessGroups.userId],
    references: [users.id]
  }),
  accessGroup: one(accessGroups, {
    fields: [userAccessGroups.accessGroupId],
    references: [accessGroups.id]
  }),
  tenant: one(tenants, {
    fields: [userAccessGroups.tenantId],
    references: [tenants.id]
  })
}));

export const cadencesRelations = relations(cadences, ({ one, many }) => ({
  // Note: tenant relation removed as tenant_id doesn't exist in the actual database table
  // tenant: one(tenants, {
  //   fields: [cadences.tenantId],
  //   references: [tenants.id]
  // }),
  timeframes: many(timeframes)
}));

export const timeframesRelations = relations(timeframes, ({ one, many }) => ({
  cadence: one(cadences, {
    fields: [timeframes.cadenceId],
    references: [cadences.id]
  }),
  tenant: one(tenants, {
    fields: [timeframes.tenantId],
    references: [tenants.id]
  }),
  objectives: many(objectives)
}));

export const objectivesRelations = relations(objectives, ({ one, many }) => ({
  owner: one(users, {
    fields: [objectives.ownerId],
    references: [users.id],
    relationName: "owner"
  }),
  team: one(teams, {
    fields: [objectives.teamId],
    references: [teams.id]
  }),
  timeframe: one(timeframes, {
    fields: [objectives.timeframeId],
    references: [timeframes.id]
  }),
  parent: one(objectives, {
    fields: [objectives.parentId],
    references: [objectives.id]
  }),
  tenant: one(tenants, {
    fields: [objectives.tenantId],
    references: [tenants.id]
  }),
  keyResults: many(keyResults),
  checkIns: many(checkIns),
  chatRoom: many(chatRooms),
  children: many(objectives, { relationName: "parent" })
}));

export const keyResultsRelations = relations(keyResults, ({ one, many }) => ({
  objective: one(objectives, {
    fields: [keyResults.objectiveId],
    references: [objectives.id]
  }),
  assignedTo: one(users, {
    fields: [keyResults.assignedToId],
    references: [users.id],
    relationName: "assignedToKeyResults"
  }),
  tenant: one(tenants, {
    fields: [keyResults.tenantId],
    references: [tenants.id]
  }),
  initiatives: many(initiatives),
  checkIns: many(checkIns),
  chatRoom: many(chatRooms)
}));

export const initiativesRelations = relations(initiatives, ({ one }) => ({
  keyResult: one(keyResults, {
    fields: [initiatives.keyResultId],
    references: [keyResults.id]
  }),
  owner: one(users, {
    fields: [initiatives.ownerId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [initiatives.tenantId],
    references: [tenants.id]
  })
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id]
  }),
  objective: one(objectives, {
    fields: [checkIns.objectiveId],
    references: [objectives.id]
  }),
  keyResult: one(keyResults, {
    fields: [checkIns.keyResultId],
    references: [keyResults.id]
  }),
  tenant: one(tenants, {
    fields: [checkIns.tenantId],
    references: [tenants.id]
  })
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, {
    fields: [projects.createdById],
    references: [users.id]
  }),
  assignedTo: one(users, {
    fields: [projects.assignedToId],
    references: [users.id]
  }),
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id]
  }),
  tenant: one(tenants, {
    fields: [projects.tenantId],
    references: [tenants.id]
  })
}));

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [chatRooms.tenantId],
    references: [tenants.id]
  }),
  // Creator relation - note that users.id is text but createdBy is integer
  // This relation might not work correctly due to the type mismatch
  members: many(chatRoomMembers),
  messages: many(messages)
}));

export const chatRoomMembersRelations = relations(chatRoomMembers, ({ one }) => ({
  user: one(users, {
    fields: [chatRoomMembers.userId],
    references: [users.id]
  }),
  chatRoom: one(chatRooms, {
    fields: [chatRoomMembers.chatRoomId],
    references: [chatRooms.id]
  })
  // No direct tenant relation in the database
  // We'll use the chatRoom.creator relation to establish tenant context
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id]
  }),
  chatRoom: one(chatRooms, {
    fields: [messages.chatRoomId],
    references: [chatRooms.id]
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id]
  }),
  tenant: one(tenants, {
    fields: [messages.tenantId],
    references: [tenants.id]
  }),
  attachments: many(attachments),
  reactions: many(reactions)
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  message: one(messages, {
    fields: [attachments.messageId],
    references: [messages.id]
  })
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  user: one(users, {
    fields: [reactions.userId],
    references: [users.id]
  }),
  message: one(messages, {
    fields: [reactions.messageId],
    references: [messages.id]
  }),
  tenant: one(tenants, {
    fields: [reactions.tenantId],
    references: [tenants.id]
  })
}));

export const badgesRelations = relations(badges, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [badges.tenantId],
    references: [tenants.id]
  }),
  userBadges: many(userBadges)
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id]
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id]
  }),
  awardedBy: one(users, {
    fields: [userBadges.awardedById],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [userBadges.tenantId],
    references: [tenants.id]
  })
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(usersToTenants),
  teams: many(teams),
  objectives: many(objectives),
  subscriptions: many(subscriptions),
  // No direct chatRoomMembers relation in the database
  // We need to access through users instead
  reactions: many(reactions),
  userBadges: many(userBadges),
  userAccessGroups: many(userAccessGroups),
  moodEntries: many(moodEntries)
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id]
  }),
  payments: many(payments)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id]
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id]
  })
}));

export const onboardingRelations = relations(onboarding, ({ one }) => ({
  user: one(users, {
    fields: [onboarding.userId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [onboarding.tenantId],
    references: [tenants.id]
  })
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id]
  }),
  receiver: one(users, {
    fields: [feedback.receiverId],
    references: [users.id]
  }),
  objective: one(objectives, {
    fields: [feedback.objectiveId],
    references: [objectives.id]
  }),
  keyResult: one(keyResults, {
    fields: [feedback.keyResultId],
    references: [keyResults.id]
  }),
  tenant: one(tenants, {
    fields: [feedback.tenantId],
    references: [tenants.id]
  })
}));

export const teamMoodsRelations = relations(teamMoods, ({ one }) => ({
  team: one(teams, {
    fields: [teamMoods.teamId],
    references: [teams.id]
  }),
  submittedBy: one(users, {
    fields: [teamMoods.submittedBy],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [teamMoods.tenantId],
    references: [tenants.id]
  })
}));

export const financialAccountsRelations = relations(financialAccounts, ({ one, many }) => ({
  team: one(teams, {
    fields: [financialAccounts.teamId],
    references: [teams.id]
  }),
  tenant: one(tenants, {
    fields: [financialAccounts.tenantId],
    references: [tenants.id]
  }),
  transactions: many(financialTransactions)
}));

export const financialTransactionsRelations = relations(financialTransactions, ({ one }) => ({
  account: one(financialAccounts, {
    fields: [financialTransactions.accountId],
    references: [financialAccounts.id]
  }),
  objective: one(objectives, {
    fields: [financialTransactions.objectiveId],
    references: [objectives.id]
  }),
  keyResult: one(keyResults, {
    fields: [financialTransactions.keyResultId],
    references: [keyResults.id]
  }),
  createdBy: one(users, {
    fields: [financialTransactions.createdById],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [financialTransactions.tenantId],
    references: [tenants.id]
  })
}));

export const financialBudgetsRelations = relations(financialBudgets, ({ one }) => ({
  team: one(teams, {
    fields: [financialBudgets.teamId],
    references: [teams.id]
  }),
  objective: one(objectives, {
    fields: [financialBudgets.objectiveId],
    references: [objectives.id]
  }),
  createdBy: one(users, {
    fields: [financialBudgets.createdById],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [financialBudgets.tenantId],
    references: [tenants.id]
  })
}));

// ZOD SCHEMAS

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
// Custom schema for access groups to ensure permissions is properly handled as an array
export const insertAccessGroupSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  tenantId: z.string()
});
export const insertCadenceSchema = createInsertSchema(cadences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimeframeSchema = createInsertSchema(timeframes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertObjectiveSchema = createInsertSchema(objectives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKeyResultSchema = createInsertSchema(keyResults).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInitiativeSchema = createInsertSchema(initiatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCheckInSchema = createInsertSchema(checkIns).omit({ id: true, createdAt: true });
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({ id: true, createdAt: true, updatedAt: true });
// Explicitly define the schema to avoid issues with the actual database structure
export const insertChatRoomMemberSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  chatRoomId: z.string(),
  role: z.string().default("member")
});
// Explicitly define the schema to avoid issues with the actual database structure
export const insertMessageSchema = z.object({
  content: z.string(),
  type: z.enum(["text", "file", "system"]).default("text"),
  userId: z.string(),
  chatRoomId: z.string(),
  replyToId: z.string().optional(),
  isEdited: z.boolean().default(false)
});
export const insertAttachmentSchema = createInsertSchema(attachments).omit({ id: true, createdAt: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ createdAt: true });
export const insertBadgeSchema = createInsertSchema(badges).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ awardedAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserToTenantSchema = createInsertSchema(usersToTenants);
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOnboardingSchema = createInsertSchema(onboarding).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFeedbackSchema = createInsertSchema(feedback).omit({ id: true, createdAt: true });
export const insertTeamMoodSchema = createInsertSchema(teamMoods).omit({ id: true, createdAt: true });
// Update project insert schema to match the new database column names
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true })
  .extend({
    // Explicitly define the shape expected by the frontend
    // Make created_by_id, tenant_id required but other fields optional
    created_by_id: z.string(),
    tenant_id: z.string(),
    // Allow "tenantId" as well as "tenant_id" to handle both formats
    tenantId: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    status: z.enum(["backlog", "todo", "in-progress", "review", "done"]).default("backlog"),
    // Allow priority to be either a number or a string (like "low", "medium", "high")
    priority: z.union([
      z.number(), 
      z.string().transform(val => {
        // Convert string priorities to numbers
        const priorityMap: Record<string, number> = {
          low: 1,
          medium: 2,
          high: 3,
          urgent: 4
        };
        return priorityMap[val.toLowerCase()] || 2; // Default to medium if unknown
      })
    ]).optional(),
    start_date: z.union([z.date(), z.string().transform(val => new Date(val))]).optional().nullable(),
    due_date: z.union([z.date(), z.string().transform(val => new Date(val))]).optional().nullable(),
    assigned_to_id: z.string().optional().nullable(),
    team_id: z.string().optional().nullable(),
    tags: z.array(z.string()).optional().nullable()
  });
export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialBudgetSchema = createInsertSchema(financialBudgets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMoodEntrySchema = createInsertSchema(moodEntries).omit({ id: true, createdAt: true });
export const insertOrganizationMissionSchema = createInsertSchema(organizationMission).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCycleSchema = createInsertSchema(cycles)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    startDate: z.string().or(z.date()).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    ),
    endDate: z.string().or(z.date()).transform(val => 
      typeof val === 'string' ? new Date(val) : val
    )
  });

// TYPES

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type AccessGroup = typeof accessGroups.$inferSelect;
export type InsertAccessGroup = z.infer<typeof insertAccessGroupSchema>;

export type UserAccessGroup = typeof userAccessGroups.$inferSelect;

export type Cadence = typeof cadences.$inferSelect;
export type InsertCadence = z.infer<typeof insertCadenceSchema>;

export type Timeframe = typeof timeframes.$inferSelect;
export type InsertTimeframe = z.infer<typeof insertTimeframeSchema>;

export type Cycle = typeof cycles.$inferSelect;
export type InsertCycle = z.infer<typeof insertCycleSchema>;

export type Objective = typeof objectives.$inferSelect;
export type InsertObjective = z.infer<typeof insertObjectiveSchema>;

export type KeyResult = typeof keyResults.$inferSelect;
export type InsertKeyResult = z.infer<typeof insertKeyResultSchema>;

export type Initiative = typeof initiatives.$inferSelect;
export type InsertInitiative = z.infer<typeof insertInitiativeSchema>;

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatRoomMember = typeof chatRoomMembers.$inferSelect;
export type InsertChatRoomMember = z.infer<typeof insertChatRoomMemberSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type UserToTenant = typeof usersToTenants.$inferSelect;
export type InsertUserToTenant = z.infer<typeof insertUserToTenantSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type Onboarding = typeof onboarding.$inferSelect;
export type InsertOnboarding = z.infer<typeof insertOnboardingSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type TeamMood = typeof teamMoods.$inferSelect;
export type InsertTeamMood = z.infer<typeof insertTeamMoodSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type MoodEntry = typeof moodEntries.$inferSelect;
export type InsertMoodEntry = z.infer<typeof insertMoodEntrySchema>;

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;

export type FinancialBudget = typeof financialBudgets.$inferSelect;
export type InsertFinancialBudget = z.infer<typeof insertFinancialBudgetSchema>;

export type OrganizationMission = typeof organizationMission.$inferSelect;
export type InsertOrganizationMission = z.infer<typeof insertOrganizationMissionSchema>;

// 1:1 Meetings
export const meetings = pgTableWithUlid("meetings", {
  title: text("title").notNull(),
  scheduledStartTime: timestamp("scheduled_start_time").notNull(),
  scheduledEndTime: timestamp("scheduled_end_time").notNull(),
  duration: integer("duration").notNull(), // Duration in minutes
  status: meetingStatusEnum("status").default("scheduled").notNull(),
  platform: meetingPlatformEnum("platform"),
  meetingLink: text("meeting_link"),
  agenda: text("agenda").notNull(),
  notes: text("notes"),
  creatorId: text("creator_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meetingsToUsers = pgTableWithUlid("meetings_to_users", {
  meetingId: text("meeting_id").references(() => meetings.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  isAttending: boolean("is_attending").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingsToObjectives = pgTableWithUlid("meetings_to_objectives", {
  meetingId: text("meeting_id").references(() => meetings.id).notNull(),
  objectiveId: text("objective_id").references(() => objectives.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const meetingsToKeyResults = pgTableWithUlid("meetings_to_key_results", {
  meetingId: text("meeting_id").references(() => meetings.id).notNull(),
  keyResultId: text("key_result_id").references(() => keyResults.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const actionItems = pgTableWithUlid("action_items", {
  description: text("description").notNull(),
  assignedToId: text("assigned_to_id").references(() => users.id).notNull(),
  meetingId: text("meeting_id").references(() => meetings.id).notNull(),
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  creator: one(users, {
    fields: [meetings.creatorId],
    references: [users.id]
  }),
  tenant: one(tenants, {
    fields: [meetings.tenantId],
    references: [tenants.id]
  }),
  attendees: many(meetingsToUsers),
  actionItems: many(actionItems),
  relatedObjectives: many(meetingsToObjectives),
  relatedKeyResults: many(meetingsToKeyResults)
}));

export const meetingsToUsersRelations = relations(meetingsToUsers, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingsToUsers.meetingId],
    references: [meetings.id]
  }),
  user: one(users, {
    fields: [meetingsToUsers.userId],
    references: [users.id]
  })
}));

export const meetingsToObjectivesRelations = relations(meetingsToObjectives, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingsToObjectives.meetingId],
    references: [meetings.id]
  }),
  objective: one(objectives, {
    fields: [meetingsToObjectives.objectiveId],
    references: [objectives.id]
  })
}));

export const meetingsToKeyResultsRelations = relations(meetingsToKeyResults, ({ one }) => ({
  meeting: one(meetings, {
    fields: [meetingsToKeyResults.meetingId],
    references: [meetings.id]
  }),
  keyResult: one(keyResults, {
    fields: [meetingsToKeyResults.keyResultId],
    references: [keyResults.id]
  })
}));

export const actionItemsRelations = relations(actionItems, ({ one }) => ({
  assignedTo: one(users, {
    fields: [actionItems.assignedToId],
    references: [users.id]
  }),
  meeting: one(meetings, {
    fields: [actionItems.meetingId],
    references: [meetings.id]
  }),
  tenant: one(tenants, {
    fields: [actionItems.tenantId],
    references: [tenants.id]
  })
}));

// Types for Meetings
export const insertMeetingSchema = createInsertSchema(meetings)
  .omit({ id: true })
  .extend({
    // Override timestamp fields to accept ISO strings
    scheduledStartTime: z.string().transform((str) => new Date(str)),
    scheduledEndTime: z.string().transform((str) => new Date(str)),
  });
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;

export const insertMeetingToUserSchema = createInsertSchema(meetingsToUsers).omit({ id: true });
export type MeetingToUser = typeof meetingsToUsers.$inferSelect;
export type InsertMeetingToUser = z.infer<typeof insertMeetingToUserSchema>;

export const insertMeetingToObjectiveSchema = createInsertSchema(meetingsToObjectives).omit({ id: true });
export type MeetingToObjective = typeof meetingsToObjectives.$inferSelect;
export type InsertMeetingToObjective = z.infer<typeof insertMeetingToObjectiveSchema>;

export const insertMeetingToKeyResultSchema = createInsertSchema(meetingsToKeyResults).omit({ id: true });
export type MeetingToKeyResult = typeof meetingsToKeyResults.$inferSelect;
export type InsertMeetingToKeyResult = z.infer<typeof insertMeetingToKeyResultSchema>;

export const insertActionItemSchema = createInsertSchema(actionItems)

// OKR System Configurations
export const okrSystemConfigs = pgTableWithUlid("okr_system_configs", {
  tenant_id: text("tenant_id").references(() => tenants.id).notNull(),
  tracking_frequency: text("tracking_frequency").default("weekly").notNull(), // weekly, biweekly, monthly
  primary_cadence: text("primary_cadence").default("quarterly").notNull(), // quarterly, trimester, halfYearly, annual
  start_month: text("start_month").default("january").notNull(),
  max_objectives_per_team: integer("max_objectives_per_team").default(5).notNull(),
  max_key_results_per_objective: integer("max_key_results_per_objective").default(3).notNull(),
  org_structure_type: text("org_structure_type").default("functional").notNull(), // functional, divisional, matrix, flat, hierarchical
  default_visibility: text("default_visibility").default("public").notNull(), // public, team, private
  selected_teams: text("selected_teams").array(), // IDs of teams participating in OKR program
  company_mission: text("company_mission"),
  company_vision: text("company_vision"),
  company_values: text("company_values"),
  enable_notifications: boolean("enable_notifications").default(true).notNull(),
  enable_quarterly_cadence: boolean("enable_quarterly_cadence").default(true).notNull(),
  enable_annual_cadence: boolean("enable_annual_cadence").default(true).notNull(),
  custom_cadence: text("custom_cadence"),
  default_objective_category: text("default_objective_category").default("growth").notNull(), // growth, product, customer, people, financial, operations, other
  require_objective_approval: boolean("require_objective_approval").default(true).notNull(),
  enable_objective_alignment: boolean("enable_objective_alignment").default(true).notNull(),
  enable_cross_team_objectives: boolean("enable_cross_team_objectives").default(true).notNull(),
  enable_slack_integration: boolean("enable_slack_integration").default(false).notNull(),
  enable_email_notifications: boolean("enable_email_notifications").default(true).notNull(),
  enable_calendar_sync: boolean("enable_calendar_sync").default(false).notNull(),
  enable_analytics_reporting: boolean("enable_analytics_reporting").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = z.infer<typeof insertActionItemSchema>;