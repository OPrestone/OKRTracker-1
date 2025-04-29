import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Target,
  Users,
  BarChart3,
  Calendar,
  ListChecks,
  Settings,
  CheckCircle2,
  ArrowRight,
  Info,
  Layers,
  Building,
  Briefcase,
  Clock,
  BarChart,
  BookOpen
} from "lucide-react";

// Define the step interfaces
interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface OKRCycle {
  id: string;
  name: string;
  description: string;
  duration: string;
}

export function SetupWorkflow() {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [cycleType, setCycleType] = useState<string>("quarterly");
  const [_, navigate] = useLocation();

  // Sample OKR cycles
  const okrCycles: OKRCycle[] = [
    {
      id: "quarterly",
      name: "Quarterly OKRs",
      description: "Set and review objectives every 3 months. Best for fast-moving organizations that need regular adjustment.",
      duration: "3 months"
    },
    {
      id: "annual",
      name: "Annual OKRs",
      description: "Set strategic objectives once a year with quarterly check-ins. Best for long-term strategic goals.",
      duration: "12 months"
    },
    {
      id: "custom",
      name: "Custom Cycle",
      description: "Create a custom OKR cycle duration that fits your organization's unique needs.",
      duration: "Custom"
    }
  ];

  // Define all setup steps
  const setupSteps: SetupStep[] = [
    {
      id: "company-mission",
      title: "Define Company Mission",
      description: "Set the foundation for your OKRs by defining your company's mission and vision",
      icon: <Building className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your company's mission defines your purpose and drives your strategic direction.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input id="company-name" placeholder="Enter your company name" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mission-statement">Mission Statement</Label>
              <Textarea
                id="mission-statement"
                placeholder="Why does your company exist? What problem are you solving?"
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vision-statement">Vision Statement</Label>
              <Textarea
                id="vision-statement"
                placeholder="What does the future look like if you succeed in your mission?"
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <Button onClick={() => navigate('/mission')}>
              Complete Mission Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: "okr-cycles",
      title: "Choose OKR Cycle",
      description: "Select the time period for setting and reviewing your organization's OKRs",
      icon: <Clock className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              OKR cycles determine how often you set new objectives and review results.
            </AlertDescription>
          </Alert>
          
          <RadioGroup defaultValue={cycleType} onValueChange={setCycleType} className="space-y-4">
            {okrCycles.map((cycle) => (
              <div key={cycle.id} className={cn(
                "flex items-start space-x-4 border rounded-lg p-4 cursor-pointer transition-all",
                cycleType === cycle.id ? "border-primary bg-primary/5" : "border-neutral-200 hover:border-neutral-300"
              )}>
                <RadioGroupItem value={cycle.id} id={cycle.id} className="mt-1" />
                <div>
                  <Label
                    htmlFor={cycle.id}
                    className="text-base font-medium flex items-center"
                  >
                    {cycle.name}
                    <span className="ml-2 text-xs bg-neutral-100 text-neutral-700 py-0.5 px-2 rounded-full">
                      {cycle.duration}
                    </span>
                  </Label>
                  <p className="text-sm text-neutral-600 mt-1">{cycle.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          {cycleType === "custom" && (
            <div className="pt-2">
              <Label htmlFor="custom-duration">Custom Duration (in weeks)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input type="number" id="custom-duration" placeholder="Enter duration" min="1" max="52" />
                <span className="text-sm text-neutral-600">weeks</span>
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <Button onClick={() => navigate('/configure/cycles')}>
              Configure Cycles
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: "team-structure",
      title: "Set Up Team Structure",
      description: "Define your organization's teams and departments for OKR alignment",
      icon: <Users className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Creating a clear team structure helps align objectives across your organization.
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="create-team">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create-team">Create Team</TabsTrigger>
              <TabsTrigger value="manage-teams">Manage Teams</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create-team" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input id="team-name" placeholder="e.g., Marketing, Engineering, etc." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-description">Team Description</Label>
                <Textarea
                  id="team-description"
                  placeholder="Describe the team's purpose and responsibilities"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="team-lead">Team Lead</Label>
                <Input id="team-lead" placeholder="Select or enter team lead name" />
              </div>
              
              <Button className="w-full">Create Team</Button>
            </TabsContent>
            
            <TabsContent value="manage-teams" className="pt-4">
              <p className="text-neutral-600 text-sm mb-4">
                Manage your existing teams or add members to teams
              </p>
              
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {["Product", "Marketing", "Engineering", "Sales"].map((team) => (
                      <div key={team} className="flex items-center justify-between p-4">
                        <div>
                          <h4 className="font-medium">{team}</h4>
                          <p className="text-sm text-neutral-600">3 members</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/teams`)}>
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-4 text-center">
                <Button onClick={() => navigate('/teams')}>Manage All Teams</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )
    },
    {
      id: "create-objectives",
      title: "Create Company Objectives",
      description: "Define top-level objectives that support your mission and vision",
      icon: <Target className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Company objectives are high-level goals that align with your mission. Aim for 3-5 objectives per cycle.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="objective-title">Objective Title</Label>
            <Input id="objective-title" placeholder="e.g., Increase Customer Satisfaction" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objective-description">Description</Label>
            <Textarea
              id="objective-description"
              placeholder="Describe what you want to achieve with this objective"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="objective-owner">Owner</Label>
              <Input id="objective-owner" placeholder="Assign an owner" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="objective-category">Category</Label>
              <Input id="objective-category" placeholder="e.g., Growth, Retention" />
            </div>
          </div>
          
          <div className="pt-4 space-y-2">
            <Button className="w-full" onClick={() => navigate('/create-objective')}>
              Continue to Key Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button variant="outline" className="w-full" onClick={() => navigate('/company-objectives')}>
              View All Objectives
            </Button>
          </div>
        </div>
      )
    },
    {
      id: "cadence-setup",
      title: "Set Up Check-in Cadence",
      description: "Establish regular check-ins to keep your OKRs on track",
      icon: <Calendar className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Regular check-ins help teams stay accountable and make progress toward their objectives.
            </AlertDescription>
          </Alert>
          
          <RadioGroup defaultValue="weekly" className="space-y-4">
            {[
              { id: "weekly", name: "Weekly Check-ins", description: "Short, focused updates on key results progress" },
              { id: "biweekly", name: "Bi-weekly Check-ins", description: "More substantial progress reviews every two weeks" },
              { id: "monthly", name: "Monthly Check-ins", description: "In-depth reviews with course correction as needed" }
            ].map((option) => (
              <div key={option.id} className="flex items-start space-x-4 border rounded-lg p-4 cursor-pointer transition-all hover:border-neutral-300">
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div>
                  <Label htmlFor={option.id} className="text-base font-medium">{option.name}</Label>
                  <p className="text-sm text-neutral-600 mt-1">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
          
          <div className="pt-4 flex space-x-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/configure/cadence')}>
              Advanced Settings
            </Button>
            
            <Button className="flex-1" onClick={() => navigate('/check-ins')}>
              Set Up Check-ins
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    },
    {
      id: "track-results",
      title: "Track Progress",
      description: "Set up dashboards and reports to monitor your OKR progress",
      icon: <BarChart className="h-5 w-5" />,
      component: (
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Dashboards help you visualize progress and identify areas that need attention.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 border border-neutral-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-blue-100 p-3 mb-3">
                  <BarChart3 className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-medium">Performance Dashboard</h3>
                <p className="text-xs text-neutral-600 mt-1">Track team and individual performance</p>
              </div>
            </Card>
            
            <Card className="p-4 border border-neutral-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-green-100 p-3 mb-3">
                  <Layers className="h-6 w-6 text-green-700" />
                </div>
                <h3 className="font-medium">Alignment View</h3>
                <p className="text-xs text-neutral-600 mt-1">See how objectives align across teams</p>
              </div>
            </Card>
            
            <Card className="p-4 border border-neutral-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-amber-100 p-3 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-amber-700" />
                </div>
                <h3 className="font-medium">Check-in Reports</h3>
                <p className="text-xs text-neutral-600 mt-1">Review check-in history and trends</p>
              </div>
            </Card>
            
            <Card className="p-4 border border-neutral-200 rounded-lg hover:border-primary/50 transition-colors cursor-pointer">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-purple-100 p-3 mb-3">
                  <Briefcase className="h-6 w-6 text-purple-700" />
                </div>
                <h3 className="font-medium">Resource Allocation</h3>
                <p className="text-xs text-neutral-600 mt-1">Track resources dedicated to objectives</p>
              </div>
            </Card>
          </div>
          
          <div className="pt-4">
            <Button className="w-full" onClick={() => navigate('/')}>
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )
    },
  ];

  const handleNextStep = () => {
    if (currentStep < setupSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        variant="default"
        className="text-white flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        <span>Set Up OKR System</span>
      </Button>
      
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span>OKR System Setup</span>
          </DialogTitle>
          <DialogDescription>
            Follow this guided workflow to set up your complete OKR system
          </DialogDescription>
        </DialogHeader>
        
        {/* Step Navigation */}
        <div className="px-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {setupSteps.length}
            </span>
            <span className="text-sm font-medium text-neutral-900">
              {setupSteps[currentStep].title}
            </span>
          </div>
          
          <div className="flex space-x-1 mb-4">
            {setupSteps.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  currentStep === index
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/40"
                    : "bg-neutral-200"
                )}
                onClick={() => handleSkipToStep(index)}
              />
            ))}
          </div>
        </div>
        
        {/* Steps List */}
        <div className="grid grid-cols-5 border-y">
          <div className="col-span-1 bg-neutral-50 border-r min-h-[500px]">
            <ScrollArea className="h-[500px]">
              <div className="p-2">
                {setupSteps.map((step, index) => (
                  <button
                    key={step.id}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-md transition-colors mb-1 flex items-center text-sm",
                      currentStep === index
                        ? "bg-primary text-primary-foreground font-medium"
                        : index < currentStep
                        ? "text-neutral-900 hover:bg-neutral-100"
                        : "text-neutral-500 hover:bg-neutral-100"
                    )}
                    onClick={() => handleSkipToStep(index)}
                  >
                    <div className={cn(
                      "mr-3 rounded-full p-1.5",
                      currentStep === index 
                        ? "bg-white/20" 
                        : index < currentStep
                        ? "bg-primary/10 text-primary"
                        : "bg-neutral-200"
                    )}>
                      {currentStep > index ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    {step.title}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Step Content */}
          <div className="col-span-4 p-6">
            <ScrollArea className="h-[500px] pr-4">
              {setupSteps[currentStep].component}
            </ScrollArea>
          </div>
        </div>
        
        {/* Navigation Footer */}
        <DialogFooter className="p-4 flex justify-between border-t bg-neutral-50">
          <Button 
            variant="outline" 
            onClick={handlePreviousStep}
            disabled={currentStep === 0}
          >
            Previous Step
          </Button>
          
          <Button onClick={handleNextStep}>
            {currentStep < setupSteps.length - 1 ? 'Next Step' : 'Finish Setup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}