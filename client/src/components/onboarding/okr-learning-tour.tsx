import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Book,
  Lightbulb,
  Award,
  Clock
} from "lucide-react";
import { useLocation } from "wouter";

interface OKRLearningTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OKRLearningTour({ isOpen, onClose }: OKRLearningTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [_, setLocation] = useLocation();

  const tourSteps = [
    {
      title: "Welcome to OKRs!",
      description: "Learn the fundamentals of Objectives and Key Results",
      icon: <Book className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            OKRs (Objectives and Key Results) is a goal-setting framework that helps organizations 
            align and track progress toward strategic objectives.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What you'll learn:</h4>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• What are Objectives and Key Results</li>
              <li>• How to write effective OKRs</li>
              <li>• Best practices for tracking progress</li>
              <li>• How OKRs align teams and drive results</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Understanding Objectives",
      description: "Learn what makes a great objective",
      icon: <Target className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                What is an Objective?
              </h4>
              <p className="text-gray-600 text-sm">
                An objective is a clearly defined goal that describes what you want to achieve. 
                It should be ambitious, qualitative, and time-bound.
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-900 mb-2">Example Good Objective:</h5>
              <p className="text-green-800 italic">"Become the market leader in customer satisfaction"</p>
              <div className="mt-2 text-xs text-green-700">
                ✓ Clear and ambitious ✓ Qualitative ✓ Inspiring
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Key Results Explained",
      description: "Learn how to measure success with Key Results",
      icon: <TrendingUp className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                What are Key Results?
              </h4>
              <p className="text-gray-600 text-sm">
                Key Results are specific, measurable outcomes that indicate progress toward your objective. 
                They answer "How will we know if we're successful?"
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Example Key Results:</h5>
              <div className="space-y-1 text-blue-800 text-sm">
                <p>• Increase NPS score from 7.2 to 8.5</p>
                <p>• Reduce customer support response time to under 2 hours</p>
                <p>• Achieve 95% customer retention rate</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "OKR Best Practices",
      description: "Tips for writing and managing effective OKRs",
      icon: <Lightbulb className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Keep it Simple</h5>
                <p className="text-xs text-gray-600">3-5 objectives with 3-4 key results each</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                <Clock className="h-3 w-3 text-blue-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Set Quarterly Cycles</h5>
                <p className="text-xs text-gray-600">Review and update OKRs every quarter</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                <Users className="h-3 w-3 text-purple-600" />
              </div>
              <div>
                <h5 className="font-medium text-sm">Align Teams</h5>
                <p className="text-xs text-gray-600">Ensure all OKRs support organizational goals</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Your Learning Objective",
      description: "Let's create your first learning objective!",
      icon: <Award className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Your First Objective
            </h4>
            <div className="bg-white p-4 rounded-lg border">
              <h5 className="font-medium mb-2">"Learn and Apply OKR Methodology Effectively"</h5>
              <p className="text-sm text-gray-600 mb-3">
                Master the fundamentals of OKRs and successfully implement them in daily work practices.
              </p>
              <div className="space-y-2">
                <h6 className="font-medium text-sm">Key Results:</h6>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Complete OKR fundamentals training within 2 weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Set and track 3 personal objectives for the quarter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Participate in weekly OKR check-ins with 100% attendance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tour completed, navigate to objectives page
      setLocation('/my-okrs');
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setLocation('/my-okrs');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {currentStepData.icon}
              </div>
              <div>
                <DialogTitle>{currentStepData.title}</DialogTitle>
                <DialogDescription>{currentStepData.description}</DialogDescription>
              </div>
            </div>
            <Badge variant="outline">
              {currentStep + 1} of {tourSteps.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={progress} className="w-full" />
          
          <div className="min-h-[300px]">
            {currentStepData.content}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
            </div>
            
            <Button onClick={handleNext}>
              {currentStep === tourSteps.length - 1 ? (
                <>
                  Get Started
                  <Award className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}