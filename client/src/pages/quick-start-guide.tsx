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
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";

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

  return (
    <DashboardLayout title="Quick Start Guide">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quick Start Guide</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the OKR System! This guide will help you get started with managing objectives and key results.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flag className="mr-2 h-5 w-5 text-primary" />
            Your OKR Progress
          </CardTitle>
          <CardDescription>Track your progress through the essential steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1 text-sm">
              <span>Progress</span>
              <span>{completedCount} of {totalSteps} steps completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`rounded-full p-1 mr-3 ${completedSteps["step-1"] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="font-medium">Learn OKR Basics</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markStepComplete("step-1")}
                disabled={completedSteps["step-1"]}
              >
                {completedSteps["step-1"] ? "Completed" : "Mark Complete"}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`rounded-full p-1 mr-3 ${completedSteps["step-2"] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="font-medium">Create Your First Objective</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markStepComplete("step-2")}
                disabled={completedSteps["step-2"]}
              >
                {completedSteps["step-2"] ? "Completed" : "Mark Complete"}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`rounded-full p-1 mr-3 ${completedSteps["step-3"] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="font-medium">Add Key Results</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markStepComplete("step-3")}
                disabled={completedSteps["step-3"]}
              >
                {completedSteps["step-3"] ? "Completed" : "Mark Complete"}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center">
                <div className={`rounded-full p-1 mr-3 ${completedSteps["step-4"] ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  <CheckCircle className="h-5 w-5" />
                </div>
                <span className="font-medium">Record Your First Check-in</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markStepComplete("step-4")}
                disabled={completedSteps["step-4"]}
              >
                {completedSteps["step-4"] ? "Completed" : "Mark Complete"}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30">
          <Button asChild variant="outline" className="ml-auto">
            <Link href="/my-okrs">
              Go to My OKRs <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="overview" className="flex items-center">
            <Book className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">OKR Overview</span>
            <span className="sm:hidden">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="flex items-center">
            <Video className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Video Tutorials</span>
            <span className="sm:hidden">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="examples" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Example OKRs</span>
            <span className="sm:hidden">Examples</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
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
          <Card>
            <CardHeader>
              <CardTitle>Video Tutorials</CardTitle>
              <CardDescription>
                Watch these short videos to learn how to use the OKR system effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Getting Started with OKRs</h3>
                    <p className="text-sm text-gray-600 mb-3">Learn the basics of OKRs and how to implement them in your team.</p>
                    <div className="flex">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">5:32</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Creating Effective Key Results</h3>
                    <p className="text-sm text-gray-600 mb-3">Tips for creating measurable and meaningful key results.</p>
                    <div className="flex">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">4:47</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">OKR Check-ins and Updates</h3>
                    <p className="text-sm text-gray-600 mb-3">How to conduct effective OKR check-ins with your team.</p>
                    <div className="flex">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">6:18</span>
                    </div>
                  </div>
                </div>
                
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">Analyzing OKR Performance</h3>
                    <p className="text-sm text-gray-600 mb-3">How to use reports and analytics to improve your OKR process.</p>
                    <div className="flex">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">7:22</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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