import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConfetti } from '@/components/ui/confetti';

// Define the types of milestones that can trigger celebrations
export type MilestoneType = 
  | 'objective_completion' 
  | 'key_result_completion' 
  | 'objective_progress' 
  | 'team_achievement' 
  | 'personal_achievement';

interface Milestone {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  entityId?: number; // ID of the objective, key result, etc.
  timestamp: Date;
  acknowledged: boolean;
  threshold?: number; // For progress-based milestones (e.g., 25%, 50%, 75%, 100%)
}

interface MilestoneContextType {
  milestones: Milestone[];
  recentMilestone: Milestone | null;
  addMilestone: (milestone: Omit<Milestone, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeMilestone: (id: string) => void;
  clearMilestones: () => void;
}

const MilestoneContext = createContext<MilestoneContextType | undefined>(undefined);

// Configuration for different milestone types
const milestoneConfigs = {
  objective_completion: {
    confettiType: 'completion' as const,
    confettiDuration: 4000,
  },
  key_result_completion: {
    confettiType: 'milestone' as const,
    confettiDuration: 3000,
  },
  objective_progress: {
    confettiType: 'achievement' as const,
    confettiDuration: 2500,
  },
  team_achievement: {
    confettiType: 'celebration' as const,
    confettiDuration: 5000,
  },
  personal_achievement: {
    confettiType: 'achievement' as const,
    confettiDuration: 3000,
  },
};

export function MilestoneProvider({ children }: { children: ReactNode }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recentMilestone, setRecentMilestone] = useState<Milestone | null>(null);
  const { triggerConfetti } = useConfetti();

  // When a new milestone is added, trigger a celebration
  useEffect(() => {
    if (recentMilestone && !recentMilestone.acknowledged) {
      const config = milestoneConfigs[recentMilestone.type];
      
      // Trigger confetti with proper type and duration
      triggerConfetti({
        type: config.confettiType,
        duration: config.confettiDuration,
      });
    }
  }, [recentMilestone, triggerConfetti]);

  // Add a new milestone and set it as the recent one
  const addMilestone = (milestoneData: Omit<Milestone, 'id' | 'timestamp' | 'acknowledged'>) => {
    const newMilestone: Milestone = {
      ...milestoneData,
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    setMilestones(prev => [newMilestone, ...prev]);
    setRecentMilestone(newMilestone);
  };

  // Mark a milestone as acknowledged
  const acknowledgeMilestone = (id: string) => {
    setMilestones(prev => 
      prev.map(milestone => 
        milestone.id === id 
          ? { ...milestone, acknowledged: true } 
          : milestone
      )
    );

    if (recentMilestone?.id === id) {
      setRecentMilestone(null);
    }
  };

  // Clear all milestones
  const clearMilestones = () => {
    setMilestones([]);
    setRecentMilestone(null);
  };

  return (
    <MilestoneContext.Provider
      value={{
        milestones,
        recentMilestone,
        addMilestone,
        acknowledgeMilestone,
        clearMilestones,
      }}
    >
      {children}
    </MilestoneContext.Provider>
  );
}

// Custom hook to use the milestone context
export function useMilestone() {
  const context = useContext(MilestoneContext);
  if (context === undefined) {
    throw new Error('useMilestone must be used within a MilestoneProvider');
  }
  return context;
}

// Helper functions to create common milestone types
export function createObjectiveCompletionMilestone(objectiveId: number, title: string) {
  return {
    type: 'objective_completion' as MilestoneType,
    title: `🎯 Objective Complete!`,
    description: `You've completed the objective: ${title}`,
    entityId: objectiveId,
  };
}

export function createKeyResultCompletionMilestone(keyResultId: number, title: string) {
  return {
    type: 'key_result_completion' as MilestoneType,
    title: `🚀 Key Result Achieved!`,
    description: `You've achieved the key result: ${title}`,
    entityId: keyResultId,
  };
}

export function createProgressMilestone(objectiveId: number, title: string, progress: number) {
  const thresholds = [25, 50, 75, 100];
  const milestone = {
    type: 'objective_progress' as MilestoneType,
    title: `📈 Milestone Reached: ${progress}%`,
    description: `You've reached ${progress}% progress on: ${title}`,
    entityId: objectiveId,
    threshold: progress,
  };

  // Only create milestones at the defined thresholds
  return thresholds.includes(progress) ? milestone : null;
}

export function createTeamAchievementMilestone(teamId: number, title: string, achievement: string) {
  return {
    type: 'team_achievement' as MilestoneType,
    title: `🏆 Team Achievement!`,
    description: `Team ${title} has ${achievement}`,
    entityId: teamId,
  };
}

export function createPersonalAchievementMilestone(userId: number, achievement: string) {
  return {
    type: 'personal_achievement' as MilestoneType,
    title: `⭐ Personal Achievement!`,
    description: achievement,
    entityId: userId,
  };
}