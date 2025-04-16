// This file contains the help content for different features in the application

export type HelpItem = {
  id: string;
  title: string;
  description: string;
};

export const dashboardHelp: HelpItem = {
  id: "dashboard-overview",
  title: "Dashboard Overview",
  description: "This dashboard provides a high-level view of your company's OKRs. Track progress, view recent check-ins, and access key reports all from this central hub."
};

export const objectivesHelp: HelpItem = {
  id: "objectives-overview",
  title: "Objectives",
  description: "Objectives are ambitious goals that define what you want to achieve. They should be qualitative, time-bound, and actionable. Each objective should have measurable key results."
};

export const keyResultsHelp: HelpItem = {
  id: "key-results-overview",
  title: "Key Results",
  description: "Key Results measure progress towards an objective. They should be quantitative, measurable, and have a clear success criteria. Aim for 2-5 key results per objective."
};

export const checkInsHelp: HelpItem = {
  id: "check-ins-overview",
  title: "Check-ins",
  description: "Regular check-ins help track progress on your OKRs. Use this feature to update your progress, add comments, and identify any blockers that need attention."
};

export const teamsHelp: HelpItem = {
  id: "teams-overview",
  title: "Teams",
  description: "Teams allow you to organize your users and assign objectives at the team level. Create a hierarchical structure that mirrors your organization."
};

export const searchHelp: HelpItem = {
  id: "search-feature",
  title: "Search",
  description: "Quickly find objectives, key results, teams, or users across the entire platform. Type at least 2 characters to see search results."
};

export const newObjectiveHelp: HelpItem = {
  id: "new-objective",
  title: "Creating an Objective",
  description: "When creating an objective, focus on what you want to achieve, not how you'll achieve it. Make it inspiring, aligned with company goals, and achievable within the timeframe."
};

export const newKeyResultHelp: HelpItem = {
  id: "new-key-result",
  title: "Creating a Key Result",
  description: "Key results should be specific, measurable, and time-bound. Include a numeric target that represents success and ensures your objective is achievable."
};

export const timeframesHelp: HelpItem = {
  id: "timeframes",
  title: "Timeframes",
  description: "Timeframes define the period for your OKRs. Typical cycles include quarterly and annual timeframes. Choose a timeframe that allows for meaningful progress."
};

export const cadencesHelp: HelpItem = {
  id: "cadences",
  title: "Cadences",
  description: "Cadences define the rhythm of your OKR process. They determine when you set, review, and reset your objectives. Common cadences are quarterly or annual."
};

export const accessGroupsHelp: HelpItem = {
  id: "access-groups",
  title: "Access Groups",
  description: "Access groups control who can view, edit, and manage different aspects of the OKR system. Assign users to appropriate groups based on their role in the organization."
};

export const alignmentHelp: HelpItem = {
  id: "alignment",
  title: "OKR Alignment",
  description: "Aligning objectives ensures that everyone is working toward common goals. Use parent-child relationships to show how individual and team objectives support company goals."
};

export const progressTrackingHelp: HelpItem = {
  id: "progress-tracking",
  title: "Progress Tracking",
  description: "Regularly update the progress of your key results to keep your objectives on track. Use the confidence level to indicate how likely you are to achieve each key result."
};

export const reportingHelp: HelpItem = {
  id: "reporting",
  title: "Reporting",
  description: "OKR reports provide insights into your organization's progress. Use filters to focus on specific teams, timeframes, or status levels to identify areas that need attention."
};

export const authenticationHelp: HelpItem = {
  id: "authentication",
  title: "Login & Registration",
  description: "Create an account to track your objectives and key results. If you're new, register with your details. Returning users can login with their username and password."
};

export const usersHelp: HelpItem = {
  id: "users-management",
  title: "User Management",
  description: "Manage users across your organization. You can view team assignments, roles, contact details, and perform actions like editing profiles or assigning users to different teams."
};