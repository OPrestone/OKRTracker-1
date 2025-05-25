import React, { createContext, useContext, ReactNode, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenantContext } from '@/hooks/use-tenant-context';

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
  const { currentTenant } = useTenantContext();

  // Fetch teams data with fast reload functionality
  const { data: teams = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/teams', currentTenant?.id],
    staleTime: 0, // Always fetch fresh data - no caching for real-time updates
    cacheTime: 0, // Don't cache data in memory
    refetchOnWindowFocus: true, // Enable refetch on window focus to keep data fresh
    refetchOnMount: true, // Always refetch when component mounts
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time data
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!currentTenant?.id,
    onError: (error) => {
      console.error('Error loading teams:', error);
      setError(error instanceof Error ? error : new Error('Failed to load teams'));
    }
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
      if (!currentTenant?.id) {
        throw new Error('No tenant selected');
      }
      
      const response = await fetch(`/api/teams/${teamId}?tenantId=${currentTenant.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team');
      }
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams', currentTenant.id] });
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
      if (!currentTenant?.id) {
        throw new Error('No tenant selected');
      }
      
      // Make sure to include the tenant ID in the request
      const response = await fetch(`/api/teams/${teamId}?tenantId=${currentTenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teamData,
          tenantId: currentTenant.id, // Include tenant ID in the body as well
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team');
      }
      
      // Invalidate team queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/teams', currentTenant.id] });
      await queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}`, currentTenant.id] });
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