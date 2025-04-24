import React, { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Flag, 
  Target, 
  CheckCircle, 
  Book, 
  HelpCircle, 
  Video, 
  FileText, 
  ChevronRight, 
  Award, 
  ExternalLink,
  PlayCircle,
  Rocket,
  ArrowRight,
  LucideIcon,
  BookOpen,
  CheckSquare,
  PieChart,
  UserCircle2,
  Sparkles,
  Lightbulb,
  Zap
} from "lucide-react";
import { Link } from "wouter";

// Import the image from assets
import getStartedVideoPath from "@assets/get started.mp4";
import picture5Path from "@assets/Picture5.png";
import picture7Path from "@assets/Picture7.png";

export default function QuickStartGuide() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({
    "step-1": false,
    "step-2": false,
    "step-3": false,
    "step-4": false
  });

  const totalSteps = Object.keys(completedSteps).length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepId]: true
    }));
    
    toast({
      title: "Step completed!",
      description: "You're making progress on your OKR journey.",
    });
  };

  // Helper component for feature cards on the homepage
  interface FeatureCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    className?: string;
  }
  
  const FeatureCard = ({ icon, title, description, className = "" }: FeatureCardProps) => (
    <div className={`p-6 rounded-xl border border-border/40 bg-card hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start">
        <div className="rounded-full p-2.5 bg-primary/10 text-primary mr-4 mt-1">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Quick Start Guide">
      {/* Hero Section */}
      <div className="relative mb-12 rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-secondary/80 text-white">
        <div className="absolute inset-0 bg-[url('@assets/Picture7.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 px-8 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:mr-8 md:max-w-[50%]">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Your OKR Journey</h1>
              <p className="text-lg opacity-90 mb-6">
                Set, track, and achieve your most ambitious goals with our comprehensive OKR system.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
                  <Link href="/create-objective">
                    <Rocket className="mr-2 h-5 w-5" />
                    Create First Objective
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Tutorial
                </Button>
              </div>
            </div>
            <div className="relative w-full md:w-auto flex-shrink-0">
              <div className="w-full md:w-[320px] h-[240px] rounded-lg overflow-hidden shadow-xl">
                <video 
                  src={getStartedVideoPath} 
                  className="w-full h-full object-cover"
                  controls
                  poster={picture5Path}
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-white text-primary rounded-full p-3 shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <FeatureCard 
          icon={<Lightbulb className="h-6 w-6" />}
          title="Learn OKR Fundamentals"
          description="Understand the core principles and best practices to create effective OKRs."
        />
        <FeatureCard 
          icon={<Target className="h-6 w-6" />}
          title="Set Meaningful Objectives"
          description="Define ambitious goals that move your organization forward."
        />
        <FeatureCard 
          icon={<CheckSquare className="h-6 w-6" />}
          title="Track Progress"
          description="Regularly update and monitor your OKRs to ensure success."
        />
      </div>

      {/* Progress Tracker */}
      <Card className="mb-10 overflow-hidden border-2 border-border">
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold flex items-center">
            <Zap className="mr-2 h-5 w-5 text-primary" />
            Your OKR Progress
            <span className="ml-auto text-sm font-normal px-3 py-1 bg-primary/10 text-primary rounded-full">
              {completedCount}/{totalSteps} Completed
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Complete these essential steps to get started with OKRs</p>
        </div>
        
        <CardContent className="p-6">
          <div className="mb-5">
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`rounded-full p-1.5 ${completedSteps["step-1"] ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Learn OKR Basics</div>
                <div className="text-sm text-muted-foreground">Understand the fundamental concepts of OKRs</div>
              </div>
              <Button 
                variant={completedSteps["step-1"] ? "ghost" : "outline"}
                size="sm"
                onClick={() => markStepComplete("step-1")}
                disabled={completedSteps["step-1"]}
                className={completedSteps["step-1"] ? "text-green-600" : ""}
              >
                {completedSteps["step-1"] ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : "Mark Complete"}
              </Button>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`rounded-full p-1.5 ${completedSteps["step-2"] ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                <Flag className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Create Your First Objective</div>
                <div className="text-sm text-muted-foreground">Define a clear, meaningful goal for yourself or your team</div>
              </div>
              <Button 
                variant={completedSteps["step-2"] ? "ghost" : "outline"}
                size="sm"
                onClick={() => markStepComplete("step-2")}
                disabled={completedSteps["step-2"]}
                className={completedSteps["step-2"] ? "text-green-600" : ""}
              >
                {completedSteps["step-2"] ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : "Mark Complete"}
              </Button>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`rounded-full p-1.5 ${completedSteps["step-3"] ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                <Target className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Add Key Results</div>
                <div className="text-sm text-muted-foreground">Define measurable outcomes for your objective</div>
              </div>
              <Button 
                variant={completedSteps["step-3"] ? "ghost" : "outline"}
                size="sm"
                onClick={() => markStepComplete("step-3")}
                disabled={completedSteps["step-3"]}
                className={completedSteps["step-3"] ? "text-green-600" : ""}
              >
                {completedSteps["step-3"] ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : "Mark Complete"}
              </Button>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
              <div className={`rounded-full p-1.5 ${completedSteps["step-4"] ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                <PieChart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Record Your First Check-in</div>
                <div className="text-sm text-muted-foreground">Start tracking progress on your OKRs</div>
              </div>
              <Button 
                variant={completedSteps["step-4"] ? "ghost" : "outline"}
                size="sm"
                onClick={() => markStepComplete("step-4")}
                disabled={completedSteps["step-4"]}
                className={completedSteps["step-4"] ? "text-green-600" : ""}
              >
                {completedSteps["step-4"] ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : "Mark Complete"}
              </Button>
            </div>
          </div>
        </CardContent>
        <div className="bg-muted/30 px-6 py-4 border-t border-border flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Estimated time to complete: <span className="font-medium">20 minutes</span>
          </p>
          <Button asChild>
            <Link href="/my-okrs">
              Go to My OKRs <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </Card>

      {/* Learn more section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <BookOpen className="mr-2 h-6 w-6 text-primary" />
          Knowledge Center
        </h2>
        <p className="text-muted-foreground mb-6">
          Explore our comprehensive resources to help you master OKRs and drive results
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-14 items-center justify-center rounded-lg bg-muted p-1 mb-8 text-muted-foreground w-full md:w-fit">
          <TabsTrigger value="overview" className="flex items-center h-12 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Book className="mr-2 h-5 w-5" />
            <span>OKR Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center h-12 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <Video className="mr-2 h-5 w-5" />
            <span>Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center h-12 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <FileText className="mr-2 h-5 w-5" />
            <span>Examples</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center h-12 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
            <HelpCircle className="mr-2 h-5 w-5" />
            <span>FAQ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>What are OKRs?</CardTitle>
              <CardDescription>
                Objectives and Key Results (OKRs) is a goal-setting framework for defining and tracking objectives and their outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <Flag className="h-6 w-6 text-primary mr-3" />
                      <h3 className="text-lg font-medium">Objectives</h3>
                    </div>
                    <p className="text-gray-600">
                      Objectives are ambitious, qualitative goals that are intended to push the organization forward in a meaningful way.
                    </p>
                    <div className="mt-4 border-l-4 border-primary/30 pl-4 italic text-gray-600">
                      Example: "Create an exceptional customer experience"
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-5">
                    <div className="flex items-center mb-4">
                      <Target className="h-6 w-6 text-secondary mr-3" />
                      <h3 className="text-lg font-medium">Key Results</h3>
                    </div>
                    <p className="text-gray-600">
                      Key Results are specific, measurable, and time-bound metrics that track the progress toward the Objective.
                    </p>
                    <div className="mt-4 border-l-4 border-secondary/30 pl-4 italic text-gray-600">
                      Example: "Improve Net Promoter Score from 30 to 50"
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Key OKR Principles</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-border/40">
                      <h4 className="font-medium mb-2">Alignment</h4>
                      <p className="text-sm text-gray-600">Connects company, team, and personal objectives to create a unified direction.</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-border/40">
                      <h4 className="font-medium mb-2">Transparency</h4>
                      <p className="text-sm text-gray-600">Objectives are public to foster accountability and collaboration.</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 border border-border/40">
                      <h4 className="font-medium mb-2">Stretch Goals</h4>
                      <p className="text-sm text-gray-600">Setting ambitious goals where 70% completion is considered a success.</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">OKR Cycle</h3>
                  <div className="flex flex-col md:flex-row gap-4 text-center">
                    <div className="flex-1 p-4 border border-border rounded-lg relative">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">1</div>
                      <h4 className="font-medium">Plan</h4>
                      <p className="text-sm text-gray-600 mt-2">Define objectives and key results</p>
                      <ChevronRight className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-300 h-6 w-6" />
                    </div>
                    <div className="flex-1 p-4 border border-border rounded-lg relative">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">2</div>
                      <h4 className="font-medium">Execute</h4>
                      <p className="text-sm text-gray-600 mt-2">Work toward achieving the key results</p>
                      <ChevronRight className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-300 h-6 w-6" />
                    </div>
                    <div className="flex-1 p-4 border border-border rounded-lg relative">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">3</div>
                      <h4 className="font-medium">Check-in</h4>
                      <p className="text-sm text-gray-600 mt-2">Regular updates on progress</p>
                      <ChevronRight className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-gray-300 h-6 w-6" />
                    </div>
                    <div className="flex-1 p-4 border border-border rounded-lg">
                      <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">4</div>
                      <h4 className="font-medium">Reflect</h4>
                      <p className="text-sm text-gray-600 mt-2">Review and learn from results</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorials">
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-5 xl:col-span-4">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <PlayCircle className="h-6 w-6 mr-2 text-primary" />
                    Video Tutorials
                  </CardTitle>
                  <CardDescription>
                    Watch these guided walkthroughs to master the OKR system
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Our video tutorials cover everything from basic concepts to advanced OKR techniques. 
                      Select a video from the list to start learning.
                    </p>
                    
                    <div className="border border-border rounded-lg overflow-hidden mt-6">
                      <div className="aspect-video bg-black">
                        <video 
                          src={getStartedVideoPath} 
                          className="w-full h-full object-contain"
                          controls
                          poster={picture5Path}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h3 className="font-semibold mb-2 text-lg">Currently Playing</h3>
                      <p className="font-medium">Getting Started with OKRs</p>
                      <div className="flex items-center mt-1 text-sm text-muted-foreground">
                        <span>5:32</span>
                        <span className="mx-2">•</span>
                        <span>Beginner Level</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-7 xl:col-span-8">
              <Card className="h-full flex flex-col">
                <div className="p-6 border-b border-border">
                  <h3 className="text-xl font-semibold">Tutorial Library</h3>
                  <p className="text-sm text-muted-foreground mt-1">Browse all available video tutorials</p>
                </div>
                
                <div className="flex-1 p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">Getting Started with OKRs</h4>
                        <p className="text-sm text-muted-foreground mb-1">Learn the basics of OKRs and how to implement them.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">5:32</span>
                          <span className="ml-2 text-muted-foreground">Beginner</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">Creating Effective Key Results</h4>
                        <p className="text-sm text-muted-foreground mb-1">Tips for creating measurable key results.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">4:47</span>
                          <span className="ml-2 text-muted-foreground">Intermediate</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">OKR Check-ins and Updates</h4>
                        <p className="text-sm text-muted-foreground mb-1">How to conduct effective check-ins with your team.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">6:18</span>
                          <span className="ml-2 text-muted-foreground">Intermediate</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">Analyzing OKR Performance</h4>
                        <p className="text-sm text-muted-foreground mb-1">Using analytics to improve your OKR process.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">7:22</span>
                          <span className="ml-2 text-muted-foreground">Advanced</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">Team Alignment Strategies</h4>
                        <p className="text-sm text-muted-foreground mb-1">Connect company and team objectives effectively.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">8:15</span>
                          <span className="ml-2 text-muted-foreground">Advanced</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer group">
                      <div className="h-14 w-14 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                        <PlayCircle className="h-7 w-7 text-primary group-hover:text-primary/80 transition-colors" />
                      </div>
                      <div>
                        <h4 className="font-medium">OKR Scoring & Evaluation</h4>
                        <p className="text-sm text-muted-foreground mb-1">Learn how to score and evaluate OKRs properly.</p>
                        <div className="flex items-center text-xs">
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">5:54</span>
                          <span className="ml-2 text-muted-foreground">Intermediate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Showing 6 of 12 videos
                    </div>
                    <Button variant="outline" size="sm">
                      View All Tutorials
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Example OKRs</CardTitle>
              <CardDescription>
                Real-world examples to inspire your OKR creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <Award className="h-5 w-5 mr-2 text-amber-500" />
                    Company Level OKRs
                  </h3>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Become the market leader in customer satisfaction</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Increase Net Promoter Score from 32 to 50</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Reduce customer support response time from 24 hours to 4 hours</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Increase customer retention rate from 85% to 92%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Launch and establish our new product line</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Successfully launch product by Q2 with 95% feature completeness</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Generate $2M in new product revenue by end of year</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Reach 10,000 active users within first 3 months of launch</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <Award className="h-5 w-5 mr-2 text-indigo-500" />
                    Team Level OKRs
                  </h3>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Transform our engineering processes for faster delivery</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Reduce build time from 45 minutes to 10 minutes</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Increase test coverage from 65% to 85%</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Decrease production incidents by 50%</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Make our marketing campaigns data-driven</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Implement analytics tracking across all marketing channels</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Increase conversion rate from 2.3% to 3.5%</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Reduce cost per acquisition by 25%</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium flex items-center mb-4">
                    <Award className="h-5 w-5 mr-2 text-emerald-500" />
                    Individual Level OKRs
                  </h3>
                  
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Become a subject matter expert in my domain</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Complete 3 advanced certification courses</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Conduct 5 internal knowledge-sharing sessions</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Create a comprehensive documentation library for the team</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4 border border-border">
                    <h4 className="font-medium text-primary">Objective: Improve my leadership skills</h4>
                    <div className="mt-3 pl-5 space-y-3">
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 1: Mentor 3 junior team members with positive feedback</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 2: Lead 2 cross-functional projects to successful completion</p>
                      </div>
                      <div className="border-l-2 border-secondary pl-3">
                        <p className="text-sm font-medium">Key Result 3: Improve my 360-degree feedback score from 7.5 to 9.0</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions about OKRs and our system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How often should we update OKRs?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Most organizations set OKRs quarterly, but the check-in frequency should be higher. Weekly or bi-weekly check-ins 
                      help keep progress on track and allow for adjustments when necessary. Our system makes it easy to record regular check-ins.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>What's the difference between a KPI and a Key Result?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Key Performance Indicators (KPIs) are ongoing metrics that track business performance, while Key Results are specific, 
                      measurable outcomes tied to an Objective with a deadline. KPIs may inform Key Results, but Key Results should be ambitious 
                      and push beyond "business as usual."
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>How many OKRs should each person/team have?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Less is more with OKRs. Focus on quality over quantity. Teams should typically have 2-3 objectives with 3-5 key results each. 
                      Individuals should have 1-2 objectives with 3-4 key results. Having too many dilutes focus and effectiveness.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>How are OKRs different from traditional goal-setting?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      OKRs differ from traditional goals in several ways: they promote transparency (all OKRs are visible to everyone), 
                      encourage ambitious "stretch goals," separate aspirational objectives from measurable outcomes, and typically follow 
                      shorter cycles (quarterly instead of annually).
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Should OKRs be tied to performance reviews?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      While OKRs can inform performance discussions, they work best when decoupled from compensation or formal reviews. 
                      This separation encourages setting ambitious objectives without fear of punishment for falling short. OKRs are primarily 
                      a goal-setting and alignment tool, not an employee evaluation system.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>What makes a good Key Result?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-600">
                      Good Key Results are specific, measurable, achievable (yet challenging), relevant to the objective, and time-bound. 
                      They should describe outcomes, not activities, and include metrics with clear starting and target values. Avoid vague 
                      language and ensure they can be objectively scored at the end of the OKR cycle.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="font-medium text-blue-700 mb-2 flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Need more help?
                </h3>
                <p className="text-blue-600 mb-4 text-sm">
                  Check out these additional resources to learn more about OKRs and best practices.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-blue-700 bg-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OKR Resource Library
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-blue-700 bg-white">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Schedule OKR Coaching Session
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}