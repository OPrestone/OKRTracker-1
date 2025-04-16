import { HelpItem } from "./help-content";

// Define a more comprehensive help item type for contextual tooltips
export interface ContextualHelpItem extends HelpItem {
  priority: "low" | "medium" | "high";
  helpfulTips: string[];
  placement?: "top" | "right" | "bottom" | "left";
}

// Cadences help content
export const cadencesContextualHelp: Record<string, ContextualHelpItem> = {
  "cadences-overview": {
    id: "cadences-overview",
    title: "OKR Cadences",
    description: "Cadences define the rhythm of your OKR process, determining when objectives are set, reviewed, and reset. Common cadences include quarterly, biannual, and annual cycles.",
    priority: "high",
    helpfulTips: [
      "Quarterly cadences help teams stay agile and adapt to changing priorities.",
      "Annual cadences work well for long-term strategic objectives.",
      "Choose a cadence that aligns with your organization's planning cycles."
    ],
    placement: "bottom"
  },
  
  "new-cadence": {
    id: "new-cadence",
    title: "Creating a Cadence",
    description: "When creating a new cadence, consider how frequently your organization needs to review and adjust objectives. Set a name, description, and select appropriate periods.",
    priority: "medium",
    helpfulTips: [
      "The period defines how long each OKR cycle will last.",
      "The start month determines when your OKR cycles begin each year.",
      "A descriptive name helps users understand the cadence purpose."
    ]
  },
  
  "cadence-actions": {
    id: "cadence-actions",
    title: "Cadence Actions",
    description: "Each cadence can be edited, viewed, or deleted. Viewing timeframes shows all time periods associated with this cadence.",
    priority: "low",
    helpfulTips: [
      "You cannot delete a cadence that has associated timeframes.",
      "Edit a cadence to change its description or period without affecting existing timeframes.",
      "Use 'View Timeframes' to quickly see all associated time periods."
    ],
    placement: "left"
  }
};

// Timeframes help content
export const timeframesContextualHelp: Record<string, ContextualHelpItem> = {
  "timeframes-overview": {
    id: "timeframes-overview",
    title: "OKR Timeframes",
    description: "Timeframes are specific periods when objectives are active. Each timeframe belongs to a cadence and has defined start and end dates.",
    priority: "high",
    helpfulTips: [
      "All objectives must be assigned to a timeframe.",
      "Filter timeframes by cadence to quickly find relevant periods.",
      "Timeframes should be created before adding objectives."
    ],
    placement: "bottom"
  },
  
  "new-timeframe": {
    id: "new-timeframe",
    title: "Creating a Timeframe",
    description: "When creating a timeframe, select a cadence it belongs to and define the exact date range. Use a clear naming convention like 'Q1 2025' or 'Annual 2025'.",
    priority: "medium",
    helpfulTips: [
      "Choose descriptive names like 'Q2 2025' for clarity.",
      "Ensure timeframes don't overlap within the same cadence.",
      "The end date must be after the start date."
    ]
  },
  
  "timeframe-filter": {
    id: "timeframe-filter",
    title: "Filtering Timeframes",
    description: "Use the cadence filter to quickly find timeframes belonging to a specific cadence. This helps when managing many timeframes across different cadence types.",
    priority: "low",
    helpfulTips: [
      "Filter by cadence when planning objectives for a specific cycle.",
      "The 'All cadences' option shows timeframes from all cadences.",
      "Filtering doesn't affect which timeframes are available when creating objectives."
    ],
    placement: "right"
  },
  
  "timeframe-actions": {
    id: "timeframe-actions",
    title: "Timeframe Actions",
    description: "Each timeframe can be edited, used to view objectives, or deleted. The 'View Objectives' option shows all objectives within this specific time period.",
    priority: "medium",
    helpfulTips: [
      "You cannot delete a timeframe with associated objectives.",
      "Edit a timeframe to adjust dates without affecting objectives.",
      "Use 'View Objectives' to quickly see all goals for this period."
    ],
    placement: "left"
  }
};

// Configuration general help content
export const configContextualHelp: Record<string, ContextualHelpItem> = {
  "configuration-menu": {
    id: "configuration-menu",
    title: "Configuration Menu",
    description: "The configuration section lets administrators set up and manage the OKR system, including cadences, timeframes, teams, user permissions, and integrations.",
    priority: "high",
    helpfulTips: [
      "Set up cadences and timeframes before creating objectives.",
      "Configure teams before assigning team objectives.",
      "User permissions control who can view and edit different parts of the system."
    ],
    placement: "right"
  }
};

// User management contextual help
export const userManagementContextualHelp: Record<string, ContextualHelpItem> = {
  "user-list": {
    id: "user-list",
    title: "User Management",
    description: "The Users page allows administrators to add, edit, and manage user accounts. Users can be assigned to teams and given specific permissions.",
    priority: "medium",
    helpfulTips: [
      "Assign users to appropriate teams for better organization.",
      "Inactive users remain in the system but cannot log in.",
      "User information is used in reports and notifications."
    ],
    placement: "bottom"
  },
  
  "user-actions": {
    id: "user-actions",
    title: "User Actions",
    description: "Each user can be edited, assigned to teams, or deactivated. User information is used throughout the OKR system for assignments and tracking.",
    priority: "low",
    helpfulTips: [
      "Edit a user to update their profile information.",
      "Deactivate users who should no longer have access.",
      "Team assignments determine which team objectives they can see and manage."
    ],
    placement: "left"
  }
};

// Team management contextual help
export const teamManagementContextualHelp: Record<string, ContextualHelpItem> = {
  "team-list": {
    id: "team-list",
    title: "Team Management",
    description: "Teams are groups of users working together on common objectives. The Teams page allows administrators to create and manage team structures.",
    priority: "medium",
    helpfulTips: [
      "Create a hierarchical team structure to mirror your organization.",
      "Teams can have parent-child relationships.",
      "Team objectives cascade down to child teams."
    ],
    placement: "bottom"
  }
};

// Export all contextual help content
export const allContextualHelp = {
  ...cadencesContextualHelp,
  ...timeframesContextualHelp,
  ...configContextualHelp,
  ...userManagementContextualHelp,
  ...teamManagementContextualHelp
};