import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HelpTooltipsContextType {
  dismissedTooltips: Record<string, boolean>;
  isDismissed: (id: string) => boolean;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  resetAll: () => void;
  showAgain: (id: string) => void;
}

const HelpTooltipsContext = createContext<HelpTooltipsContextType | undefined>(undefined);

interface HelpTooltipsProviderProps {
  children: ReactNode;
}

export function HelpTooltipsProvider({ children }: HelpTooltipsProviderProps) {
  const [dismissedTooltips, setDismissedTooltips] = useState<Record<string, boolean>>({});

  // Load dismissed tooltips from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissedTooltips');
      if (stored) {
        setDismissedTooltips(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load dismissed tooltips from localStorage', error);
      // Reset localStorage if corrupted
      localStorage.setItem('dismissedTooltips', JSON.stringify({}));
    }
  }, []);

  // Update localStorage when dismissed tooltips change
  useEffect(() => {
    localStorage.setItem('dismissedTooltips', JSON.stringify(dismissedTooltips));
  }, [dismissedTooltips]);

  const isDismissed = (id: string): boolean => {
    return !!dismissedTooltips[id];
  };

  const dismiss = (id: string) => {
    setDismissedTooltips(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const dismissAll = () => {
    // Get all tooltip IDs and set them to dismissed
    const allTooltipIds = Object.keys(dismissedTooltips);
    const allDismissed = allTooltipIds.reduce((acc, id) => {
      acc[id] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setDismissedTooltips(allDismissed);
  };

  const resetAll = () => {
    setDismissedTooltips({});
    localStorage.setItem('dismissedTooltips', JSON.stringify({}));
  };

  const showAgain = (id: string) => {
    setDismissedTooltips(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  return (
    <HelpTooltipsContext.Provider
      value={{
        dismissedTooltips,
        isDismissed,
        dismiss,
        dismissAll,
        resetAll,
        showAgain
      }}
    >
      {children}
    </HelpTooltipsContext.Provider>
  );
}

export function useHelpTooltips() {
  const context = useContext(HelpTooltipsContext);
  
  if (context === undefined) {
    throw new Error('useHelpTooltips must be used within a HelpTooltipsProvider');
  }
  
  return context;
}