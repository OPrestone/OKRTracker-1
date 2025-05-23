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