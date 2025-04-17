// Types
interface Objective {
  id: number;
  title: string;
  description?: string;
  level: string;
  status: string;
  progress: number;
  timeframeId: number;
  teamId?: number;
  // Add other fields as needed
}

/**
 * Filters objectives based on search query
 * @param objectives - Array of objectives to filter
 * @param searchQuery - Search query to filter by
 * @returns Filtered objectives
 */
export const filterObjectivesBySearch = (
  objectives: Objective[],
  searchQuery: string
): Objective[] => {
  if (!searchQuery) return objectives;

  const lowerCaseQuery = searchQuery.toLowerCase().trim();
  
  return objectives.filter((obj) => {
    // Check if title or description contains the search query
    const titleMatch = obj.title.toLowerCase().includes(lowerCaseQuery);
    const descriptionMatch = obj.description
      ? obj.description.toLowerCase().includes(lowerCaseQuery)
      : false;
    
    return titleMatch || descriptionMatch;
  });
};

/**
 * Filters objectives by level
 * @param objectives - Array of objectives to filter
 * @param level - Level to filter by
 * @returns Filtered objectives
 */
export const filterObjectivesByLevel = (
  objectives: Objective[],
  level: string | null
): Objective[] => {
  if (!level) return objectives;
  
  return objectives.filter((obj) => 
    obj.level.toLowerCase() === level.toLowerCase()
  );
};

/**
 * Filters objectives by status
 * @param objectives - Array of objectives to filter
 * @param status - Status to filter by
 * @returns Filtered objectives
 */
export const filterObjectivesByStatus = (
  objectives: Objective[],
  status: string | null
): Objective[] => {
  if (!status) return objectives;
  
  return objectives.filter((obj) => 
    obj.status.toLowerCase() === status.toLowerCase()
  );
};

/**
 * Filters objectives by timeframe
 * @param objectives - Array of objectives to filter
 * @param timeframeId - Timeframe ID to filter by
 * @returns Filtered objectives
 */
export const filterObjectivesByTimeframe = (
  objectives: Objective[],
  timeframeId: number | null
): Objective[] => {
  if (!timeframeId) return objectives;
  
  return objectives.filter((obj) => obj.timeframeId === timeframeId);
};

/**
 * Filters objectives by team
 * @param objectives - Array of objectives to filter
 * @param teamId - Team ID to filter by
 * @returns Filtered objectives
 */
export const filterObjectivesByTeam = (
  objectives: Objective[],
  teamId: number | null
): Objective[] => {
  if (!teamId) return objectives;
  
  return objectives.filter((obj) => obj.teamId === teamId);
};

/**
 * Get progress color based on percentage
 * @param progress - Progress percentage
 * @returns CSS class for the progress color
 */
export const getProgressColor = (progress: number): string => {
  if (progress >= 75) return "bg-green-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-red-500";
};

/**
 * Get status color based on status
 * @param status - Status string
 * @returns CSS class for the status color
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case "on track":
      return "bg-green-100 text-green-800 border-green-300";
    case "at risk":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "behind":
      return "bg-red-100 text-red-800 border-red-300";
    case "completed":
      return "bg-blue-100 text-blue-800 border-blue-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};