import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Define team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  tenantId: string;
  leaderId?: string;
  createdAt?: string;
}

interface TeamContextValue {
  teams: Team[];
  isLoading: boolean;
  error: Error | null;
  refetchTeams: () => Promise<void>;
  setTeamLeader: (teamId: string, userId: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>;
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt'>) => Promise<Team>;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // Fetch teams data
  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/teams'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Refetch teams
  const refetchTeams = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching teams:', error);
      setError(error instanceof Error ? error : new Error('Failed to refetch teams'));
    }
  };

  // Set team leader
  const setTeamLeader = async (teamId: string, userId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/leader`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leaderId: userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team leader');
      }
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/users`] });
      
      await refetchTeams();
    } catch (error) {
      console.error('Error setting team leader:', error);
      setError(error instanceof Error ? error : new Error('Failed to update team leader'));
      throw error;
    }
  };

  // Delete a team
  const deleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await refetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error instanceof Error ? error : new Error('Failed to delete team'));
      throw error;
    }
  };

  // Update a team
  const updateTeam = async (teamId: string, teamData: Partial<Team>) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team');
      }
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}`] });
      await refetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      setError(error instanceof Error ? error : new Error('Failed to update team'));
      throw error;
    }
  };

  // Create a team
  const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create team');
      }
      
      const newTeam = await response.json();
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      await refetchTeams();
      
      return newTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error instanceof Error ? error : new Error('Failed to create team'));
      throw error;
    }
  };

  const value = {
    teams: teams as Team[],
    isLoading,
    error,
    refetchTeams,
    setTeamLeader,
    deleteTeam,
    updateTeam,
    createTeam,
  };

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeams() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamProvider');
  }
  return context;
}