import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized query invalidation utility
 * This ensures all components stay in sync with database changes
 */

export const invalidateAllQueries = (queryClient: QueryClient) => {
  // Core data queries
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
  
  // Dashboard and performance queries
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
  
  // Team-specific queries
  queryClient.invalidateQueries({ queryKey: ["/api/teams"], type: "all" });
  
  // Resources and other data
  queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
  
  // Chat queries if present
  queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
};

export const invalidateObjectiveQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
};

export const invalidateTeamQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
};

export const invalidateUserQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
};

export const invalidateTimeframeQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
};