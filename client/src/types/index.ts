export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId: number | null;
  managerId: number | null;
  firstLogin?: boolean;
  introVideoWatched?: boolean;
  walkthroughCompleted?: boolean;
  onboardingProgress?: number;
  lastOnboardingStep?: string | null;
}

export interface Team {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  parentId: number | null;
  ownerId: number | null;
  createdAt: string;
  memberCount?: number;
  performance?: number;
}

export interface MoodEntry {
  id: number;
  userId: number;
  moodScore: number;
  notes: string | null;
  date: string;
  createdAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    teamId: number | null;
  };
}