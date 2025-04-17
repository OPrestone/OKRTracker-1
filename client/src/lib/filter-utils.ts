/**
 * Utility functions for filtering and organizing objectives and other OKR data
 */

interface FilterableObjective {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress: number;
  owner?: {
    id: number;
    name: string;
    role?: string;
  };
  level?: string;
  teamId?: number;
  timeframeId?: number;
}

interface FilterOptions {
  status?: string[];
  progress?: {
    min?: number;
    max?: number;
  };
  owner?: number[];
  team?: number[];
  search?: string;
  timeframe?: number[];
  level?: string[];
}

/**
 * Filter objectives based on provided filter criteria
 * @param objectives Array of objectives to filter
 * @param filters Filter criteria
 * @returns Filtered objectives array
 */
export function filterObjectives(
  objectives: FilterableObjective[],
  filters: FilterOptions
): FilterableObjective[] {
  return objectives.filter((objective) => {
    // Filter by status
    if (
      filters.status &&
      filters.status.length > 0 &&
      !filters.status.includes(objective.status.toLowerCase())
    ) {
      return false;
    }

    // Filter by progress range
    if (filters.progress) {
      if (
        filters.progress.min !== undefined &&
        objective.progress < filters.progress.min
      ) {
        return false;
      }
      if (
        filters.progress.max !== undefined &&
        objective.progress > filters.progress.max
      ) {
        return false;
      }
    }

    // Filter by owner
    if (
      filters.owner &&
      filters.owner.length > 0 &&
      objective.owner &&
      !filters.owner.includes(objective.owner.id)
    ) {
      return false;
    }

    // Filter by team
    if (
      filters.team &&
      filters.team.length > 0 &&
      objective.teamId &&
      !filters.team.includes(objective.teamId)
    ) {
      return false;
    }

    // Filter by timeframe
    if (
      filters.timeframe &&
      filters.timeframe.length > 0 &&
      objective.timeframeId &&
      !filters.timeframe.includes(objective.timeframeId)
    ) {
      return false;
    }

    // Filter by level
    if (
      filters.level &&
      filters.level.length > 0 &&
      objective.level &&
      !filters.level.includes(objective.level.toLowerCase())
    ) {
      return false;
    }

    // Filter by search text
    if (filters.search && filters.search.trim() !== "") {
      const searchText = filters.search.toLowerCase();
      const titleMatch = objective.title.toLowerCase().includes(searchText);
      const descriptionMatch = objective.description
        ? objective.description.toLowerCase().includes(searchText)
        : false;
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filter objectives by a specific level
 * @param objectives Array of objectives to filter
 * @param level Level to filter by (e.g., "company", "team", "individual")
 * @returns Filtered objectives array
 */
export function filterObjectivesByLevel(
  objectives: FilterableObjective[],
  level: string
): FilterableObjective[] {
  return objectives.filter((objective) => 
    objective.level && objective.level.toLowerCase() === level.toLowerCase()
  );
}

/**
 * Group objectives by a specific property
 * @param objectives Array of objectives to group
 * @param groupBy Property to group by
 * @returns Record with keys as group names and values as arrays of objectives
 */
export function groupObjectives(
  objectives: FilterableObjective[],
  groupBy: "status" | "owner" | "team" | "timeframe" | "level"
): Record<string, FilterableObjective[]> {
  const grouped: Record<string, FilterableObjective[]> = {};

  objectives.forEach((objective) => {
    let key = "";

    switch (groupBy) {
      case "status":
        key = objective.status || "No Status";
        break;
      case "owner":
        key = objective.owner ? `${objective.owner.id}` : "Unassigned";
        break;
      case "team":
        key = objective.teamId ? `${objective.teamId}` : "No Team";
        break;
      case "timeframe":
        key = objective.timeframeId ? `${objective.timeframeId}` : "No Timeframe";
        break;
      case "level":
        key = objective.level || "No Level";
        break;
    }

    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(objective);
  });

  return grouped;
}

/**
 * Sort objectives by a specific property
 * @param objectives Array of objectives to sort
 * @param sortBy Property to sort by
 * @param ascending Sort order (true for ascending, false for descending)
 * @returns Sorted objectives array
 */
export function sortObjectives(
  objectives: FilterableObjective[],
  sortBy: "title" | "progress" | "status",
  ascending: boolean = true
): FilterableObjective[] {
  const sorted = [...objectives];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "progress":
        comparison = a.progress - b.progress;
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
    }

    return ascending ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Get status display details (color, background, etc.) for a given status
 * @param status Status string to get details for
 * @returns Object with status display details
 */
export function getStatusDetails(status: string): {
  color: string;
  background: string;
  borderColor: string;
  textColor: string;
} {
  const normalizedStatus = status.toLowerCase();
  
  switch (normalizedStatus) {
    case "on track":
    case "on_track":
      return {
        color: "green",
        background: "bg-green-100",
        borderColor: "border-green-300",
        textColor: "text-green-800",
      };
    case "at risk":
    case "at_risk":
      return {
        color: "amber",
        background: "bg-amber-100",
        borderColor: "border-amber-300",
        textColor: "text-amber-800",
      };
    case "behind":
      return {
        color: "red",
        background: "bg-red-100",
        borderColor: "border-red-300",
        textColor: "text-red-800",
      };
    case "completed":
      return {
        color: "blue",
        background: "bg-blue-100",
        borderColor: "border-blue-300",
        textColor: "text-blue-800",
      };
    default:
      return {
        color: "gray",
        background: "bg-gray-100",
        borderColor: "border-gray-300",
        textColor: "text-gray-800",
      };
  }
}

/**
 * Get progress color based on percentage
 * @param progress Progress percentage value
 * @returns Tailwind CSS color class for the progress
 */
export function getProgressColor(progress: number): string {
  if (progress >= 75) return "bg-green-500";
  if (progress >= 50) return "bg-blue-500";
  if (progress >= 25) return "bg-amber-500";
  return "bg-red-500";
}