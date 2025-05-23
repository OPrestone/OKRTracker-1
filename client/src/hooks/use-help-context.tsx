import React, { createContext, useContext, useState } from 'react';

type HelpContextType = {
  showHelp: boolean;
  toggleHelp: () => void;
};

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = () => setShowHelp(!showHelp);

  return (
    <HelpContext.Provider
      value={{
        showHelp,
        toggleHelp,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
}

export function useHelp(): HelpContextType {
  const context = useContext(HelpContext);
  
  if (context === undefined) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  
  return context;
}