import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  PlayCircle,
  Compass,
  CheckSquare,
  BarChart,
  Users,
  FileText,
  Award,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useOnboarding, OnboardingStep } from "@/hooks/use-onboarding";

export function GetStartedMenu() {
  const {
    getStartedMenuOpen,
    closeGetStartedMenu,
    onboardingProgress,
    introVideoWatched,
    showIntroVideo,
    startWalkthrough,
    walkthroughCompleted,
  } = useOnboarding();

  const handleWatchVideo = () => {
    closeGetStartedMenu();
    showIntroVideo();
  };

  const handleExplore = () => {
    closeGetStartedMenu();
    startWalkthrough();
  };

  return (
    <Sheet open={getStartedMenuOpen} onOpenChange={closeGetStartedMenu}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-2xl font-bold">Get Started</SheetTitle>
          <SheetDescription>
            Welcome to the OKR Management System. Follow these steps to get
            started quickly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Onboarding Progress</span>
            <span className="text-sm font-medium">{onboardingProgress}%</span>
          </div>
          <Progress value={onboardingProgress} className="h-2" />
        </div>

        <div className="space-y-6 py-4">
          {/* Watch Intro Video */}
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2">
              {introVideoWatched ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <PlayCircle className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-1">Watch Introduction Video</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Get a quick overview of the OKR Management System and learn how
                it can help your team achieve goals.
              </p>
              <Button
                variant={introVideoWatched ? "outline" : "default"}
                onClick={handleWatchVideo}
                className="mt-2"
              >
                {introVideoWatched ? "Rewatch Video" : "Watch Now"}
              </Button>
            </div>
          </div>

          {/* Explore Platform */}
          <div className="flex gap-4 items-start">
            <div className="bg-primary/10 rounded-full p-2">
              {walkthroughCompleted ? (
                <CheckCircle className="h-6 w-6 text-primary" />
              ) : (
                <Compass className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-1">Explore the Platform</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Take an interactive guided tour to understand the key features
                and how to use them effectively.
              </p>
              <Button
                variant={walkthroughCompleted ? "outline" : "default"}
                onClick={handleExplore}
                className="mt-2"
              >
                {walkthroughCompleted ? "Restart Tour" : "Start Exploring"}
              </Button>
            </div>
          </div>

          {/* Key Features Section */}
          <div className="pt-4 mt-4 border-t">
            <h3 className="text-lg font-medium mb-4">Key Features</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<CheckSquare className="h-5 w-5" />}
                title="OKRs & Goals"
                description="Create and track objectives with measurable key results"
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Team Alignment"
                description="Connect team and individual goals to company strategy"
              />
              <FeatureCard
                icon={<FileText className="h-5 w-5" />}
                title="Check-ins"
                description="Regular progress updates and reflection points"
              />
              <FeatureCard
                icon={<Award className="h-5 w-5" />}
                title="Recognition"
                description="Send high-fives to recognize team achievements"
              />
              <FeatureCard
                icon={<BarChart className="h-5 w-5" />}
                title="Reports & Insights"
                description="Track performance and gain actionable insights"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col p-4 rounded-lg border bg-card">
      <div className="text-primary mb-2">{icon}</div>
      <h4 className="text-sm font-medium mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}