import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgEnum, pgTable, text, timestamp, boolean, jsonb, primaryKey } from "drizzle-orm/pg-core";
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

// TABLE SCHEMAS

export const users = pgTableWithUlid("users", {
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  teamId: text("team_id").references(() => teams.id),
  level: userLevelEnum("level").default("beginner"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  defaultTenantId: text("default_tenant_id").references(() => tenants.id),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const usersToTenants = pgTable("users_to_tenants", {
  userId: text("user_id").references(() => users.id).notNull(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  role: userRoleEnum("role").default("member").notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.tenantId] })
}));

export const teams = pgTableWithUlid("teams", {
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  type: teamTypeEnum("type").default("team").notNull(),
  parentId: text("parent_id").references(() => teams.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accessGroups = pgTableWithUlid("access_groups", {
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").array(),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userAccessGroups = pgTable("user_access_groups", {
  userId: text("user_id").references(() => users.id).notNull(),
  accessGroupId: text("access_group_id").references(() => accessGroups.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.accessGroupId] })
}));

export const cadences = pgTableWithUlid("cadences", {
  name: text("name").notNull(),
  description: text("description"),
  periodDays: integer("period_days").notNull(), // e.g., 7 for weekly, 90 for quarterly
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const timeframes = pgTableWithUlid("timeframes", {
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  cadenceId: text("cadence_id").references(() => cadences.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const objectives = pgTableWithUlid("objectives", {
  title: text("title").notNull(),
  description: text("description"),
  ownerId: text("owner_id").references(() => users.id),
  teamId: text("team_id").references(() => teams.id),
  timeframeId: text("timeframe_id").references(() => timeframes.id),
  status: objectiveStatusEnum("status").default("draft").notNull(),
  statusReason: objectiveStatusReasonEnum("status_reason"),
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  parentId: text("parent_id").references(() => objectives.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const keyResults = pgTableWithUlid("key_results", {
  title: text("title").notNull(),
  description: text("description"),
  type: keyResultTypeEnum("type").default("percentage").notNull(),
  currentValue: integer("current_value").default(0).notNull(),
  targetValue: integer("target_value").notNull(),
  startValue: integer("start_value").default(0).notNull(),
  format: text("format"), // e.g., "$", "%", etc.
  milestones: jsonb("milestones"), // Array of milestone objects
  objectiveId: text("objective_id").references(() => objectives.id).notNull(),
  ownerId: text("owner_id").references(() => users.id),
  progress: integer("progress").default(0).notNull(), // 0-100 percentage
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
  content: text("content").notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  confidence: integer("confidence"), // 1-5 rating
  previousValue: integer("previous_value"),
  newValue: integer("new_value"),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRooms = pgTableWithUlid("chat_rooms", {
  name: text("name"),
  type: chatRoomTypeEnum("type").default("group").notNull(),
  objectiveId: text("objective_id").references(() => objectives.id),
  keyResultId: text("key_result_id").references(() => keyResults.id),
  teamId: text("team_id").references(() => teams.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatRoomMembers = pgTable("chat_room_members", {
  userId: text("user_id").references(() => users.id).notNull(),
  chatRoomId: text("chat_room_id").references(() => chatRooms.id).notNull(),
  lastReadTimestamp: timestamp("last_read_timestamp").defaultNow().notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  joined: timestamp("joined").defaultNow().notNull(),
  left: timestamp("left"),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.chatRoomId] })
}));

export const messages = pgTableWithUlid("messages", {
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text").notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  chatRoomId: text("chat_room_id").references(() => chatRooms.id).notNull(),
  replyToId: text("reply_to_id").references(() => messages.id),
  tenantId: text("tenant_id").references(() => tenants.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attachments = pgTableWithUlid("attachments", {
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  messageId: text("message_id").references(() => messages.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reactions = pgTable("reactions", {
  userId: text("user_id").references(() => users.id).notNull(),
  messageId: text("message_id").references(() => messages.id).notNull(),
  emoji: text("emoji").notNull(),
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
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.badgeId] })
}));

export const tenants = pgTableWithUlid("tenants", {
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}).notNull(),
  plan: text("plan").default("free").notNull(),
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

export const feedback = pgTableWithUlid("feedback", {
  userId: text("user_id").references(() => users.id).notNull(),
  receiverId: text("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
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
  tenant: one(tenants, {
    fields: [teams.tenantId],
    references: [tenants.id]
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
  })
}));

export const cadencesRelations = relations(cadences, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [cadences.tenantId],
    references: [tenants.id]
  }),
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
  owner: one(users, {
    fields: [keyResults.ownerId],
    references: [users.id],
    relationName: "owner"
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

export const chatRoomsRelations = relations(chatRooms, ({ one, many }) => ({
  objective: one(objectives, {
    fields: [chatRooms.objectiveId],
    references: [objectives.id]
  }),
  keyResult: one(keyResults, {
    fields: [chatRooms.keyResultId],
    references: [keyResults.id]
  }),
  team: one(teams, {
    fields: [chatRooms.teamId],
    references: [teams.id]
  }),
  tenant: one(tenants, {
    fields: [chatRooms.tenantId],
    references: [tenants.id]
  }),
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
  })
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(usersToTenants),
  teams: many(teams),
  objectives: many(objectives),
  subscriptions: many(subscriptions)
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
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccessGroupSchema = createInsertSchema(accessGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCadenceSchema = createInsertSchema(cadences).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTimeframeSchema = createInsertSchema(timeframes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertObjectiveSchema = createInsertSchema(objectives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKeyResultSchema = createInsertSchema(keyResults).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInitiativeSchema = createInsertSchema(initiatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCheckInSchema = createInsertSchema(checkIns).omit({ id: true, createdAt: true });
export const insertChatRoomSchema = createInsertSchema(chatRooms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatRoomMemberSchema = createInsertSchema(chatRoomMembers).omit({ lastReadTimestamp: true, joined: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true, updatedAt: true });
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
export const insertFinancialAccountSchema = createInsertSchema(financialAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinancialBudgetSchema = createInsertSchema(financialBudgets).omit({ id: true, createdAt: true, updatedAt: true });

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

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type InsertFinancialAccount = z.infer<typeof insertFinancialAccountSchema>;

export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;

export type FinancialBudget = typeof financialBudgets.$inferSelect;
export type InsertFinancialBudget = z.infer<typeof insertFinancialBudgetSchema>;