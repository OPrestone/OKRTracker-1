import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Target, Users, BarChart3, CheckCircle2, Calendar, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface GuideStep {
  title: string;
  description: string;
  completed: boolean;
  stepNumber: number;
}

interface FlowStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  completed?: boolean;
}

export function GetStartedGuide() {
  const [_, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: GuideStep[] = [
    {
      title: "Define Company Objectives",
      description: "Start by setting 3-5 high-level company objectives for the current quarter or year.",
      completed: true,
      stepNumber: 1
    },
    {
      title: "Create Team Structure",
      description: "Set up your organizational structure by creating teams and assigning team leaders.",
      completed: true,
      stepNumber: 2
    },
    {
      title: "Add Team Members",
      description: "Invite your team members to join the platform and assign them to their respective teams.",
      completed: false,
      stepNumber: 3
    },
    {
      title: "Cascade Objectives to Teams",
      description: "Break down company objectives into team-specific objectives that align with the overall strategy.",
      completed: false,
      stepNumber: 4
    },
    {
      title: "Schedule Regular Check-ins",
      description: "Set up weekly or bi-weekly 1:1 meetings to review progress and provide feedback.",
      completed: false,
      stepNumber: 5
    }
  ];

  // Define the flow steps that match our logical sequence
  const flowSteps: FlowStep[] = [
    {
      title: "Set Company Mission",
      description: "Define your organization's mission, vision, and values to align your objectives.",
      icon: <Target className="h-5 w-5" />,
      path: "/mission",
      completed: true
    },
    {
      title: "Create Team",
      description: "Set up your teams and add team members to collaborate on objectives.",
      icon: <Users className="h-5 w-5" />,
      path: "/create-team",
      completed: true
    },
    {
      title: "Create Objectives",
      description: "Define measurable objectives that align with your organization's mission.",
      icon: <BarChart3 className="h-5 w-5" />,
      path: "/create-objective",
      completed: false
    },
    {
      title: "Add Key Results",
      description: "Create specific, measurable key results to track progress toward your objectives.",
      icon: <CheckCircle2 className="h-5 w-5" />,
      path: "/create-key-result",
      completed: false
    },
    {
      title: "Schedule Check-ins",
      description: "Set up regular check-ins to track progress and update your OKRs.",
      icon: <Calendar className="h-5 w-5" />,
      path: "/check-ins",
      completed: false
    },
    {
      title: "Track Progress",
      description: "Use dashboards to monitor progress and identify areas that need attention.",
      icon: <ListChecks className="h-5 w-5" />,
      path: "/dashboards",
      completed: false
    }
  ];

  const handleNextStep = () => {
    if (currentStep < flowSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - close dialog and navigate to dashboard
      setDialogOpen(false);
      setLocation('/dashboards');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToStep = (index: number) => {
    setCurrentStep(index);
  };

  const handleNavigateToStep = () => {
    setDialogOpen(false);
    setLocation(flowSteps[currentStep].path);
  };

  return (
    <>
      <Card className="mb-8">
        <CardHeader className="p-5 bg-primary-50 border-b border-primary-100">
          <h2 className="text-lg font-semibold text-primary-900">Quick Get Started Guide</h2>
          <p className="text-sm text-primary-700 mt-1">Follow these steps to set up your OKR system</p>
        </CardHeader>
        
        <CardContent className="p-5">
          <ol className="relative border-l border-neutral-200 ml-3">
            {steps.map((step) => (
              <li key={step.stepNumber} className="mb-6 ml-6 last:mb-0">
                <span className="absolute flex items-center justify-center w-8 h-8 rounded-full -left-4 ring-4 ring-white">
                  {step.completed ? (
                    <div className="bg-primary-100 w-full h-full rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-primary-600" />
                    </div>
                  ) : (
                    <div className="bg-neutral-200 w-full h-full rounded-full flex items-center justify-center">
                      <span className="text-neutral-700 text-xs">{step.stepNumber}</span>
                    </div>
                  )}
                </span>
                <h3 className="font-medium text-neutral-900">{step.title}</h3>
                <p className="text-sm text-neutral-600 mt-1">{step.description}</p>
                <a href="#" className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-800 mt-2">
                  Learn more
                  <svg className="ml-1 w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </li>
            ))}
          </ol>
        </CardContent>
        
        <CardFooter className="p-4 bg-neutral-50 border-t border-neutral-100 flex flex-wrap gap-4 justify-between">
          <a href="/resources" className="text-sm font-medium text-primary-600 hover:text-primary-800">
            View detailed guide
          </a>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setLocation('/configure')}>
              Configure Settings
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              Get started now
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Guided Flow Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {flowSteps[currentStep].icon}
              <span>{flowSteps[currentStep].title}</span>
            </DialogTitle>
            <DialogDescription>
              {flowSteps[currentStep].description}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {flowSteps.length}
              </span>
              <div className="flex space-x-1">
                {flowSteps.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "h-2 w-8 rounded-full transition-colors",
                      currentStep === index
                        ? "bg-primary"
                        : index < currentStep
                        ? "bg-primary/40"
                        : "bg-muted"
                    )}
                    onClick={() => handleSkipToStep(index)}
                  />
                ))}
              </div>
            </div>

            <div className="bg-muted p-6 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  {flowSteps[currentStep].icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium">{flowSteps[currentStep].title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    {flowSteps[currentStep].description}
                  </p>
                  <Button onClick={handleNavigateToStep}>
                    Go to {flowSteps[currentStep].title}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleNextStep}>
              {currentStep < flowSteps.length - 1 ? 'Next' : 'Finish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
