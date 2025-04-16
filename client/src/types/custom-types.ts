import { User, Team, Objective, KeyResult, Initiative, CheckIn, Cadence, Timeframe, AccessGroup } from "@shared/schema";

// Extended types for joined data
export type TimeframeWithCadence = Timeframe & {
  cadence?: Cadence;
};

export type ObjectiveWithDetails = Objective & {
  owner?: User;
  team?: Team;
  timeframe?: Timeframe;
  keyResults?: KeyResult[];
  children?: ObjectiveWithDetails[];
};

export type KeyResultWithDetails = KeyResult & {
  assignedTo?: User;
  objective?: Objective;
  initiatives?: Initiative[];
};

export type TeamWithDetails = Team & {
  parent?: Team;
  members?: User[];
  objectives?: Objective[];
};

// Export all base types from the schema for convenience
export type {
  User,
  Team,
  Objective,
  KeyResult,
  Initiative,
  CheckIn,
  Cadence,
  Timeframe,
  AccessGroup
};