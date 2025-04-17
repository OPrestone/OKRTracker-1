import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  PlayCircle,
  CheckSquare,
  FileText,
  BarChart4,
  Award,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import { useOnboarding, OnboardingStep } from "@/hooks/use-onboarding";

export function OnboardingProgress() {
  const {
    onboardingProgress,
    introVideoWatched,
    walkthroughCompleted,
    currentStep,
    showIntroVideo,
    startWalkthrough,
    resetOnboarding,
  } = useOnboarding();

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Getting Started</span>
          <span className="text-sm font-normal">{onboardingProgress}% complete</span>
        </CardTitle>
        <CardDescription>
          Track your progress and discover key features
        </CardDescription>
        <Progress value={onboardingProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-4">
          <ChecklistItem
            icon={<PlayCircle className="h-5 w-5" />}
            title="Watch Intro Video"
            completed={introVideoWatched}
            onClick={showIntroVideo}
          />
          
          <ChecklistItem
            icon={<CheckSquare className="h-5 w-5" />}
            title="Set up your first Objective"
            completed={walkthroughCompleted || (currentStep && currentStep > OnboardingStep.OBJECTIVES_KEYS)}
            onClick={() => {}}
            url="/objectives/create"
          />
          
          <ChecklistItem
            icon={<BarChart4 className="h-5 w-5" />}
            title="Explore your Dashboard"
            completed={walkthroughCompleted || (currentStep && currentStep > OnboardingStep.DASHBOARD_OVERVIEW)}
            onClick={() => {}}
            url="/dashboard"
          />
          
          <ChecklistItem
            icon={<FileText className="h-5 w-5" />}
            title="Complete your first Check-in"
            completed={walkthroughCompleted || (currentStep && currentStep > OnboardingStep.CHECKINS)}
            onClick={() => {}}
            url="/checkins"
          />

          <ChecklistItem
            icon={<Award className="h-5 w-5" />}
            title="Send a High-Five"
            completed={walkthroughCompleted || (currentStep && currentStep > OnboardingStep.HIGHFIVES)}
            onClick={() => {}}
            url="/highfives/create"
          />
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <Button 
            variant={walkthroughCompleted ? "outline" : "default"} 
            onClick={startWalkthrough}
            className="w-full"
          >
            {walkthroughCompleted ? "Restart Walkthrough" : "Continue Walkthrough"}
          </Button>
          
          {onboardingProgress > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={resetOnboarding}
            >
              <RotateCcw className="h-3 w-3 mr-1" /> Reset Onboarding
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChecklistItemProps {
  icon: React.ReactNode;
  title: string;
  completed: boolean;
  onClick: () => void;
  url?: string;
}

function ChecklistItem({ icon, title, completed, onClick, url }: ChecklistItemProps) {
  const content = (
    <div className={`
      flex items-center justify-between rounded-md 
      p-2 transition-colors
      ${completed 
        ? "bg-primary/10 text-primary" 
        : "hover:bg-muted cursor-pointer"
      }
    `}>
      <div className="flex items-center gap-3">
        <div>{icon}</div>
        <span className="font-medium">{title}</span>
      </div>
      <div>
        {completed ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/50" />
        )}
      </div>
    </div>
  );

  if (url && !completed) {
    return (
      <a href={url} className="block no-underline text-foreground">
        {content}
      </a>
    );
  }

  return (
    <div onClick={completed ? undefined : onClick}>
      {content}
    </div>
  );
}