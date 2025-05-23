import React, { createContext, useContext, useState } from 'react';

type OnboardingContextType = {
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completedSteps: Record<string, boolean>;
  markStepCompleted: (step: string) => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const markStepCompleted = (step: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [step]: true,
    }));
  };

  const resetOnboarding = () => {
    setCompletedSteps({});
    setShowOnboarding(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        setShowOnboarding,
        completedSteps,
        markStepCompleted,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}