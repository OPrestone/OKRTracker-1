export interface TooltipConfig {
  id: string;
  title: string;
  description: string;
  feature?: "overview" | "search" | "objective" | "reports";
  persistent?: boolean;
}

// Dashboard tooltips
export const dashboardTooltips = {
  welcome: {
    id: "dashboard-welcome",
    title: "Welcome to Your Dashboard",
    description: "This is your central command center for OKRs. Here you can see a snapshot of your objectives, key results, and overall progress.",
    feature: "overview",
    persistent: true
  },
  progress: {
    id: "dashboard-progress",
    title: "Progress Tracking",
    description: "This chart shows your progress towards completing objectives. Colors indicate status: Green (76-100%), Yellow (51-75%), Orange (26-50%), Red (0-25%)."
  },
  recentCheckins: {
    id: "dashboard-checkins",
    title: "Recent Check-ins",
    description: "These are the latest updates from you and your team. Regular check-ins help track progress and identify blockers."
  },
  quickActions: {
    id: "dashboard-quick-actions",
    title: "Quick Actions",
    description: "Use these shortcuts to perform common tasks like creating a new objective or scheduling a check-in."
  }
};

// OKR management tooltips
export const okrTooltips = {
  objective: {
    id: "okr-objective",
    title: "What is an Objective?",
    description: "Objectives are ambitious, qualitative goals that define what you want to achieve. They should be inspiring and time-bound.",
    feature: "objective"
  },
  keyResult: {
    id: "okr-key-result",
    title: "What is a Key Result?",
    description: "Key Results are specific, measurable outcomes that track progress towards an objective. Each objective should have 2-5 key results."
  },
  progress: {
    id: "okr-progress",
    title: "Updating Progress",
    description: "Regularly update your progress to keep everyone informed. You can update progress by clicking on the progress bar or through check-ins."
  },
  alignment: {
    id: "okr-alignment",
    title: "Aligning OKRs",
    description: "Align your objectives with team and company goals. This shows how your work contributes to broader strategic initiatives."
  },
  draft: {
    id: "okr-draft",
    title: "Draft OKRs",
    description: "Draft OKRs are objectives you're still working on. Once finalized, they can be submitted for review and approval."
  }
};

// Search tooltips
export const searchTooltips = {
  search: {
    id: "search-main",
    title: "Search Everything",
    description: "Use the search bar to find objectives, key results, team members, and more. Try searching by name, keyword, or status.",
    feature: "search"
  }
};

// Report tooltips
export const reportTooltips = {
  overview: {
    id: "reports-overview",
    title: "Reports Overview",
    description: "These reports provide insights into OKR performance across the organization. Use them to identify trends and make informed decisions.",
    feature: "reports"
  },
  filters: {
    id: "reports-filters",
    title: "Report Filters",
    description: "Customize your reports using these filters. You can filter by time period, team, status, and more."
  },
  export: {
    id: "reports-export",
    title: "Exporting Reports",
    description: "Export reports in various formats to share with stakeholders or use in presentations."
  }
};

// Team management tooltips
export const teamTooltips = {
  structure: {
    id: "team-structure",
    title: "Team Structure",
    description: "This view shows the organizational structure and hierarchy. Teams can have sub-teams for better organization."
  },
  members: {
    id: "team-members",
    title: "Team Members",
    description: "Manage team membership here. You can add or remove members and assign roles."
  }
};

// Chat tooltips
export const chatTooltips = {
  overview: {
    id: "chat-overview",
    title: "In-app Chat",
    description: "Use the chat feature to communicate with team members about OKRs, share updates, and provide feedback.",
    persistent: true
  },
  reactions: {
    id: "chat-reactions",
    title: "Message Reactions",
    description: "React to messages with emojis to provide quick feedback or acknowledgment."
  },
  attachments: {
    id: "chat-attachments",
    title: "Attachments",
    description: "Share files and documents related to your OKRs directly in the chat."
  }
};