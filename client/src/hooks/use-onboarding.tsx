import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react";

// Onboarding step IDs
export enum OnboardingStep {
  INTRO_VIDEO = "intro_video",
  DASHBOARD_OVERVIEW = "dashboard_overview",
  OBJECTIVES_KEYS = "objectives_key_results",
  CHECKINS = "checkins",
  TASKS = "tasks_todos",
  HIGHFIVES = "recognition_highfives",
  REPORTS = "reports_insights",
}

// Types
export interface OnboardingState {
  onboardingEnabled: boolean;
  firstLogin: boolean;
  introVideoWatched: boolean;
  walkthroughCompleted: boolean;
  onboardingProgress: number;
  currentStep: OnboardingStep | null;
  getStartedMenuOpen: boolean;
}

interface OnboardingContextType extends OnboardingState {
  showIntroVideo: () => void;
  startWalkthrough: () => void;
  skipWalkthrough: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (step: OnboardingStep) => void;
  resetOnboarding: () => void;
  toggleGetStartedMenu: () => void;
  closeGetStartedMenu: () => void;
}

// Storage helpers for persisting onboarding state
const STORAGE_KEY = "okr_onboarding_state";

// Default initial state
const defaultOnboardingState: OnboardingState = {
  onboardingEnabled: true,
  firstLogin: true,
  introVideoWatched: false,
  walkthroughCompleted: false,
  onboardingProgress: 0,
  currentStep: null,
  getStartedMenuOpen: false,
};

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Steps for the walkthrough in order
const walkthroughSteps: OnboardingStep[] = [
  OnboardingStep.DASHBOARD_OVERVIEW,
  OnboardingStep.OBJECTIVES_KEYS,
  OnboardingStep.CHECKINS,
  OnboardingStep.TASKS,
  OnboardingStep.HIGHFIVES,
  OnboardingStep.REPORTS,
];

// Provider component
export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Load state from local storage
  const loadInitialState = (): OnboardingState => {
    if (typeof window === "undefined") return defaultOnboardingState;
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Failed to load onboarding state:", error);
    }
    
    return defaultOnboardingState;
  };

  const [state, setState] = useState<OnboardingState>(loadInitialState);

  // Save state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save onboarding state:", error);
    }
  }, [state]);

  // Calculate progress percentage
  useEffect(() => {
    if (state.walkthroughCompleted) {
      setState(prev => ({ ...prev, onboardingProgress: 100 }));
      return;
    }

    if (!state.currentStep) {
      // If intro video watched but walkthrough not started, set progress to initial value
      const progress = state.introVideoWatched ? 14 : 0;
      setState(prev => ({ ...prev, onboardingProgress: progress }));
      return;
    }

    // Calculate progress based on current step
    const currentStepIndex = walkthroughSteps.indexOf(state.currentStep);
    if (currentStepIndex >= 0) {
      // Base progress of 14% for intro + additional progress per step
      const stepProgress = Math.round(
        14 + ((currentStepIndex + 1) / walkthroughSteps.length) * 86
      );
      setState(prev => ({ ...prev, onboardingProgress: stepProgress }));
    }
  }, [state.currentStep, state.introVideoWatched, state.walkthroughCompleted]);

  // Handlers
  const showIntroVideo = () => {
    setState(prev => ({ ...prev, introVideoWatched: true }));
  };

  const startWalkthrough = () => {
    setState(prev => ({
      ...prev,
      currentStep: walkthroughSteps[0],
      getStartedMenuOpen: false,
    }));
  };

  const skipWalkthrough = () => {
    setState(prev => ({
      ...prev,
      walkthroughCompleted: true,
      currentStep: null,
      firstLogin: false,
      onboardingProgress: 100,
      getStartedMenuOpen: false,
    }));
  };

  const nextStep = () => {
    if (!state.currentStep) return;
    
    const currentIndex = walkthroughSteps.indexOf(state.currentStep);
    if (currentIndex < walkthroughSteps.length - 1) {
      setState(prev => ({ ...prev, currentStep: walkthroughSteps[currentIndex + 1] }));
    } else {
      // Last step completed
      setState(prev => ({
        ...prev,
        walkthroughCompleted: true,
        currentStep: null,
        firstLogin: false,
      }));
    }
  };

  const prevStep = () => {
    if (!state.currentStep) return;
    
    const currentIndex = walkthroughSteps.indexOf(state.currentStep);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, currentStep: walkthroughSteps[currentIndex - 1] }));
    }
  };

  const completeStep = (step: OnboardingStep) => {
    if (state.currentStep === step) {
      nextStep();
    }
  };

  const resetOnboarding = () => {
    setState(defaultOnboardingState);
  };

  const toggleGetStartedMenu = () => {
    setState(prev => ({ ...prev, getStartedMenuOpen: !prev.getStartedMenuOpen }));
  };

  const closeGetStartedMenu = () => {
    setState(prev => ({ ...prev, getStartedMenuOpen: false }));
  };

  const value: OnboardingContextType = {
    ...state,
    showIntroVideo,
    startWalkthrough,
    skipWalkthrough,
    nextStep,
    prevStep,
    completeStep,
    resetOnboarding,
    toggleGetStartedMenu,
    closeGetStartedMenu,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// Custom hook
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};