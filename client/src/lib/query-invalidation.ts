import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized query invalidation utility
 * This ensures all components stay in sync with database changes
 */

export const invalidateAllQueries = (queryClient: QueryClient) => {
  console.log('🔄 Invalidating all application queries...');
  
  // Core OKR data queries
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
  queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
  
  // Team and user data
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user/is-team-leader"] });
  
  // Time management
  queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
  
  // Performance and analytics
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
  queryClient.invalidateQueries({ queryKey: ["/api/performance"] });
  
  // Mission and strategy
  queryClient.invalidateQueries({ queryKey: ["/api/mission"] });
  queryClient.invalidateQueries({ queryKey: ["/api/strategic-directions"] });
  
  // Resources and content
  queryClient.invalidateQueries({ queryKey: ["/api/resources"] });
  queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
  
  // Chat and communication
  queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
  
  // Wellness and mood tracking
  queryClient.invalidateQueries({ queryKey: ["/api/mood"] });
  queryClient.invalidateQueries({ queryKey: ["/api/wellness"] });
  
  // Project management
  queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
  queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
};

export const invalidateObjectiveQueries = (queryClient: QueryClient) => {
  console.log('🎯 Invalidating objective-related queries...');
  
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/key-results"] });
  queryClient.invalidateQueries({ queryKey: ["/api/check-ins"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
  queryClient.invalidateQueries({ queryKey: ["/api/performance"] });
};

export const invalidateTeamQueries = (queryClient: QueryClient) => {
  console.log('👥 Invalidating team-related queries...');
  
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams-performance"] });
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
};

export const invalidateUserQueries = (queryClient: QueryClient) => {
  console.log('👤 Invalidating user-related queries...');
  
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
  queryClient.invalidateQueries({ queryKey: ["/api/user/is-team-leader"] });
  queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
  queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
};

export const invalidateTimeframeQueries = (queryClient: QueryClient) => {
  console.log('⏰ Invalidating timeframe-related queries...');
  
  queryClient.invalidateQueries({ queryKey: ["/api/timeframes"] });
  queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
};

export const invalidateMissionQueries = (queryClient: QueryClient) => {
  console.log('🎯 Invalidating mission and strategy queries...');
  
  queryClient.invalidateQueries({ queryKey: ["/api/mission"] });
  queryClient.invalidateQueries({ queryKey: ["/api/strategic-directions"] });
  queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
};