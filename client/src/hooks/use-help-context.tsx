import React, { createContext, useState, useContext, useEffect } from 'react';

// Define the help context type
type HelpContextType = {
  isNewUser: boolean;
  hasSeenOverview: boolean;
  hasUsedSearch: boolean;
  hasCreatedObjective: boolean;
  hasViewedReports: boolean;
  markOverviewSeen: () => void;
  markSearchUsed: () => void;
  markObjectiveCreated: () => void;
  markReportsViewed: () => void;
  resetHelpState: () => void;
};

// Create the help context with default values
const HelpContext = createContext<HelpContextType>({
  isNewUser: true,
  hasSeenOverview: false,
  hasUsedSearch: false,
  hasCreatedObjective: false,
  hasViewedReports: false,
  markOverviewSeen: () => {},
  markSearchUsed: () => {},
  markObjectiveCreated: () => {},
  markReportsViewed: () => {},
  resetHelpState: () => {},
});

// Keys for localStorage
const NEW_USER_KEY = 'okr-new-user';
const SEEN_OVERVIEW_KEY = 'okr-seen-overview';
const USED_SEARCH_KEY = 'okr-used-search';
const CREATED_OBJECTIVE_KEY = 'okr-created-objective';
const VIEWED_REPORTS_KEY = 'okr-viewed-reports';

// Provider component that wraps the app
export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage or default to true for isNewUser
  const [isNewUser, setIsNewUser] = useState<boolean>(true);
  const [hasSeenOverview, setHasSeenOverview] = useState<boolean>(false);
  const [hasUsedSearch, setHasUsedSearch] = useState<boolean>(false);
  const [hasCreatedObjective, setHasCreatedObjective] = useState<boolean>(false);
  const [hasViewedReports, setHasViewedReports] = useState<boolean>(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadStateFromStorage = () => {
      try {
        const isNew = localStorage.getItem(NEW_USER_KEY) !== 'false';
        const seenOverview = localStorage.getItem(SEEN_OVERVIEW_KEY) === 'true';
        const usedSearch = localStorage.getItem(USED_SEARCH_KEY) === 'true';
        const createdObjective = localStorage.getItem(CREATED_OBJECTIVE_KEY) === 'true';
        const viewedReports = localStorage.getItem(VIEWED_REPORTS_KEY) === 'true';

        setIsNewUser(isNew);
        setHasSeenOverview(seenOverview);
        setHasUsedSearch(usedSearch);
        setHasCreatedObjective(createdObjective);
        setHasViewedReports(viewedReports);
      } catch (error) {
        console.error('Failed to load help state from localStorage', error);
      }
    };

    loadStateFromStorage();
  }, []);

  // Helper functions to mark different parts of the app as seen/used
  const markOverviewSeen = () => {
    setHasSeenOverview(true);
    localStorage.setItem(SEEN_OVERVIEW_KEY, 'true');
    updateNewUserStatus();
  };

  const markSearchUsed = () => {
    setHasUsedSearch(true);
    localStorage.setItem(USED_SEARCH_KEY, 'true');
    updateNewUserStatus();
  };

  const markObjectiveCreated = () => {
    setHasCreatedObjective(true);
    localStorage.setItem(CREATED_OBJECTIVE_KEY, 'true');
    updateNewUserStatus();
  };

  const markReportsViewed = () => {
    setHasViewedReports(true);
    localStorage.setItem(VIEWED_REPORTS_KEY, 'true');
    updateNewUserStatus();
  };

  // Reset all help state (for testing or at user request)
  const resetHelpState = () => {
    setIsNewUser(true);
    setHasSeenOverview(false);
    setHasUsedSearch(false);
    setHasCreatedObjective(false);
    setHasViewedReports(false);
    
    localStorage.setItem(NEW_USER_KEY, 'true');
    localStorage.setItem(SEEN_OVERVIEW_KEY, 'false');
    localStorage.setItem(USED_SEARCH_KEY, 'false');
    localStorage.setItem(CREATED_OBJECTIVE_KEY, 'false');
    localStorage.setItem(VIEWED_REPORTS_KEY, 'false');
  };

  // Helper to update new user status based on completed actions
  const updateNewUserStatus = () => {
    // If the user has completed a certain number of actions, they're no longer considered new
    if (hasSeenOverview && hasUsedSearch && hasCreatedObjective) {
      setIsNewUser(false);
      localStorage.setItem(NEW_USER_KEY, 'false');
    }
  };

  // Value object to provide to consuming components
  const value = {
    isNewUser,
    hasSeenOverview,
    hasUsedSearch,
    hasCreatedObjective,
    hasViewedReports,
    markOverviewSeen,
    markSearchUsed,
    markObjectiveCreated,
    markReportsViewed,
    resetHelpState,
  };

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
};

// Custom hook to use the help context
export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
};