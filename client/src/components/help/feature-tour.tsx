import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useHelp } from "@/hooks/use-help-context";

type TourStep = {
  title: string;
  description: string;
  image?: string;
};

const tourSteps: TourStep[] = [
  {
    title: "Welcome to the OKR Platform",
    description:
      "This tour will walk you through the key features of our OKR (Objectives and Key Results) platform to help you get started.",
  },
  {
    title: "Dashboard",
    description:
      "Your dashboard gives you a comprehensive overview of your objectives, recent check-ins, and overall progress. It's your central hub for OKR management.",
  },
  {
    title: "Creating Objectives",
    description:
      "Objectives are ambitious goals that define what you want to achieve. They should be qualitative, time-bound, and actionable. Click the 'New Objective' button to create one.",
  },
  {
    title: "Adding Key Results",
    description:
      "Key Results measure progress towards an objective. They should be quantitative and have a clear success criteria. Add 2-5 key results for each objective.",
  },
  {
    title: "Team Organization",
    description:
      "Organize your company into teams to better manage and align objectives. Team hierarchy helps visualize how team goals support company objectives.",
  },
  {
    title: "Regular Check-ins",
    description:
      "Regular check-ins help track progress and identify blockers. Update your key results weekly or bi-weekly to keep everyone informed of your progress.",
  },
  {
    title: "Search Functionality",
    description:
      "Use the search feature in the header to quickly find objectives, key results, teams, or users across the entire platform.",
  },
  {
    title: "Help is Always Available",
    description:
      "Look for the info icon (ℹ️) next to features for contextual help. You can also reset this tour from your profile settings if you need a refresher.",
  },
];

const TOUR_COMPLETED_KEY = "okr-tour-completed";

export const FeatureTour: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { isNewUser, markOverviewSeen } = useHelp();

  useEffect(() => {
    // Check if the tour has been completed
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY) === "true";
    
    // Only show the tour automatically for new users who haven't completed it
    if (isNewUser && !tourCompleted) {
      setOpen(true);
    }
  }, [isNewUser]);

  const handleClose = () => {
    setOpen(false);
    markOverviewSeen();
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{tourSteps[currentStep].title}</DialogTitle>
          <DialogDescription>
            {tourSteps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {tourSteps[currentStep].image && (
          <div className="my-4 rounded-md overflow-hidden border border-border">
            <img
              src={tourSteps[currentStep].image}
              alt={tourSteps[currentStep].title}
              className="w-full h-auto"
            />
          </div>
        )}

        <div className="flex justify-center my-4">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full mx-1 ${
                index === currentStep ? "bg-primary" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            <Button variant="ghost" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};