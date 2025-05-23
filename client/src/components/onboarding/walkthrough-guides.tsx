import React from "react";
import { WalkthroughTooltip } from "./walkthrough-tooltip";
import { OnboardingStep, useOnboarding } from "@/hooks/use-onboarding";

export function WalkthroughGuides() {
  const { currentStep } = useOnboarding();
  
  // Don't render anything if there's no current step
  if (!currentStep) return null;

  return (
    <>
      {/* Dashboard Overview */}
      <WalkthroughTooltip
        step={OnboardingStep.DASHBOARD_OVERVIEW}
        title="Welcome to Your Dashboard"
        description="This is your command center where you can see all your OKRs, team performance, and important metrics at a glance."
        position="bottom"
        targetSelector=".dashboard-header"
      />

      {/* Objectives & Key Results */}
      <WalkthroughTooltip
        step={OnboardingStep.OBJECTIVES_KEYS}
        title="Objectives & Key Results"
        description="Create and track your team's goals. Objectives are what you want to achieve, and Key Results are how you'll measure success."
        position="right"
        targetSelector=".objectives-section"
      />

      {/* Check-ins */}
      <WalkthroughTooltip
        step={OnboardingStep.CHECKINS}
        title="Regular Check-ins"
        description="Use check-ins to update progress on your OKRs, share blockers, and keep everyone aligned on a regular basis."
        position="left"
        targetSelector=".checkins-section"
      />

      {/* Tasks & To-Dos */}
      <WalkthroughTooltip
        step={OnboardingStep.TASKS}
        title="Tasks & To-Dos"
        description="Break down your Key Results into actionable tasks and track their completion status here."
        position="right"
        targetSelector=".tasks-section"
      />

      {/* High-Fives (Recognition) */}
      <WalkthroughTooltip
        step={OnboardingStep.HIGHFIVES}
        title="Recognition (High-Fives)"
        description="Celebrate achievements and recognize team members who are making an impact with high-fives that everyone can see."
        position="bottom"
        targetSelector=".highfives-section"
      />

      {/* Reports & Insights */}
      <WalkthroughTooltip
        step={OnboardingStep.REPORTS}
        title="Reports & Insights"
        description="Gain insights into team performance, OKR progress, and trends over time to make data-driven decisions."
        position="left"
        targetSelector=".reports-section"
      />
    </>
  );
}