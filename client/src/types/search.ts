/**
 * Represents a generic search item with ID and title
 */
export interface SearchItem {
  id: number;
  title: string;
}

/**
 * Represents a search result for an objective
 */
export interface ObjectiveSearchResult extends SearchItem {
  description?: string;
  progress?: number;
  status?: string;
}

/**
 * Represents a search result for a key result
 */
export interface KeyResultSearchResult extends SearchItem {
  objectiveId: number;
  progress?: number;
}

/**
 * Represents a search result for a team
 */
export interface TeamSearchResult {
  id: number;
  name: string;
  description?: string;
  memberCount?: number;
}

/**
 * Represents a search result for a user
 */
export interface UserSearchResult {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

/**
 * Represents all search results
 */
export interface SearchResults {
  objectives: ObjectiveSearchResult[];
  keyResults: KeyResultSearchResult[];
  teams: TeamSearchResult[];
  users: UserSearchResult[];
}

/**
 * Interface for the search service
 */
export interface SearchService {
  search(query: string): Promise<SearchResults>;
}