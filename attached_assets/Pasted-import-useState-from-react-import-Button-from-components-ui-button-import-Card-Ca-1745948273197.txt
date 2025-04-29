import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";

interface KeyResult {
  id: number;
  title: string;
  progress: number;
  dueDate: string;
  status: "on-track" | "at-risk" | "behind" | "complete";
}

interface OKR {
  id: number;
  title: string;
  description: string;
  progress: number;
  timeframe: string;
  status: "draft" | "active" | "completed" | "pending-approval";
  type: "personal" | "team" | "company";
  keyResults: KeyResult[];
}

export default function MyOKRs() {
  const [currentTab, setCurrentTab] = useState("active");
  
  const myOKRs: OKR[] = [
    {
      id: 1,
      title: "Revolutionize Digital Landscapes",
      description: "Create groundbreaking digital products that redefine industry standards, pushing boundaries and setting new trends.",
      progress: 15,
      timeframe: "Q2 2025",
      status: "active",
      type: "personal",
      keyResults: [
        {
          id: 101,
          title: "Increase User Engagement by 40%",
          progress: 25,
          dueDate: "Jun 30, 2025",
          status: "on-track"
        },
        {
          id: 102,
          title: "Launch 5 Innovative Digital Products",
          progress: 0,
          dueDate: "Sep 15, 2025",
          status: "behind"
        },
        {
          id: 103,
          title: "Achieve 90% Positive User Feedback",
          progress: 20,
          dueDate: "Aug 1, 2025",
          status: "at-risk"
        }
      ]
    },
    {
      id: 2,
      title: "Optimize Development Workflow",
      description: "Improve development processes to increase efficiency, reduce bugs, and accelerate delivery timelines.",
      progress: 65,
      timeframe: "Q2 2025",
      status: "active",
      type: "team",
      keyResults: [
        {
          id: 201,
          title: "Reduce bug rate by 30%",
          progress: 80,
          dueDate: "May 15, 2025",
          status: "on-track"
        },
        {
          id: 202,
          title: "Implement CI/CD pipeline across all projects",
          progress: 100,
          dueDate: "Apr 30, 2025",
          status: "complete"
        },
        {
          id: 203,
          title: "Increase code review coverage to 95%",
          progress: 70,
          dueDate: "Jun 15, 2025",
          status: "on-track"
        }
      ]
    },
    {
      id: 3,
      title: "Ignite Innovation Fires",
      description: "Fuel the development of cutting-edge digital solutions, sparking creativity and pioneering advancements.",
      progress: 0,
      timeframe: "Q3 2025",
      status: "pending-approval",
      type: "personal",
      keyResults: [
        {
          id: 301,
          title: "Establish innovation lab",
          progress: 0,
          dueDate: "Aug 1, 2025",
          status: "on-track"
        },
        {
          id: 302,
          title: "Organize 5 innovation workshops",
          progress: 0,
          dueDate: "Sep 30, 2025",
          status: "on-track"
        }
      ]
    }
  ];
  
  const drafts: OKR[] = [
    {
      id: 4,
      title: "Enhance Team Collaboration",
      description: "Improve communication and workflows between team members to boost productivity.",
      progress: 0,
      timeframe: "Q3 2025",
      status: "draft",
      type: "team",
      keyResults: [
        {
          id: 401,
          title: "Implement new collaboration tools",
          progress: 0,
          dueDate: "Oct 15, 2025",
          status: "on-track"
        },
        {
          id: 402,
          title: "Conduct weekly sync-up meetings",
          progress: 0,
          dueDate: "Ongoing",
          status: "on-track"
        }
      ]
    }
  ];
  
  const completedOKRs: OKR[] = [
    {
      id: 5,
      title: "Improve Customer Support Response Time",
      description: "Reduce support ticket response and resolution times to improve customer satisfaction.",
      progress: 100,
      timeframe: "Q1 2025",
      status: "completed",
      type: "team",
      keyResults: [
        {
          id: 501,
          title: "Reduce first response time to under 4 hours",
          progress: 100,
          dueDate: "Mar 15, 2025",
          status: "complete"
        },
        {
          id: 502,
          title: "Achieve 85% first-contact resolution rate",
          progress: 100,
          dueDate: "Mar 30, 2025",
          status: "complete"
        }
      ]
    }
  ];
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
      case "at-risk":
        return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
      case "behind":
        return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
      case "complete":
        return <Badge className="bg-blue-100 text-blue-800">Complete</Badge>;
      case "pending-approval":
        return <Badge className="bg-purple-100 text-purple-800">Pending Approval</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-blue-500";
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My OKRs</h1>
          <p className="text-neutral-600 mt-1">
            Track and manage your personal objectives and key results
          </p>
        </div>
        
        <Link href="/create-objective">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create OKR
          </Button>
        </Link>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({myOKRs.filter(okr => okr.status === "active").length})</TabsTrigger>
          <TabsTrigger value="pending-approval">Pending Approval ({myOKRs.filter(okr => okr.status === "pending-approval").length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOKRs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {myOKRs.filter(okr => okr.status === "active").map((okr) => (
            <Card key={okr.id} className="shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{okr.timeframe}</Badge>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {okr.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{okr.description}</CardDescription>
                  </div>
                  
                  <Badge className={okr.type === "personal" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                    {okr.type === "personal" ? "Personal" : okr.type === "team" ? "Team" : "Company"}
                  </Badge>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-neutral-600">Overall Progress</span>
                    <span className="text-sm font-medium">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className={`h-2 ${getProgressColor(okr.progress)}`} />
                </div>
              </CardHeader>
              
              <CardContent>
                <h4 className="text-sm font-medium mb-2">Key Results</h4>
                <div className="space-y-3">
                  {okr.keyResults.map((kr) => (
                    <div key={kr.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{kr.title}</p>
                          <div className="flex items-center mt-1 gap-3">
                            <div className="text-xs text-neutral-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {kr.dueDate}
                            </div>
                            {getStatusBadge(kr.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{kr.progress}%</div>
                        <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${getProgressColor(kr.progress)}`} 
                            style={{ width: `${kr.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="pending-approval" className="space-y-4">
          {myOKRs.filter(okr => okr.status === "pending-approval").map((okr) => (
            <Card key={okr.id} className="shadow-sm border-purple-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{okr.timeframe}</Badge>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {okr.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{okr.description}</CardDescription>
                  </div>
                  
                  <Badge className="bg-purple-100 text-purple-800">Pending Approval</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="bg-purple-50 p-3 rounded-md text-sm text-purple-800 mb-4">
                  This OKR is awaiting approval from your manager. You'll be notified once it's reviewed.
                </div>
                
                <h4 className="text-sm font-medium mb-2">Key Results</h4>
                <div className="space-y-3">
                  {okr.keyResults.map((kr) => (
                    <div key={kr.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-5 w-5 text-neutral-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{kr.title}</p>
                          <div className="flex items-center mt-1">
                            <div className="text-xs text-neutral-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {kr.dueDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4">
          {drafts.length > 0 ? (
            drafts.map((draft) => (
              <Card key={draft.id} className="shadow-sm border-neutral-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">{draft.timeframe}</Badge>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-neutral-400" />
                        {draft.title}
                      </CardTitle>
                      <CardDescription className="mt-1">{draft.description}</CardDescription>
                    </div>
                    
                    <Badge className="bg-neutral-100 text-neutral-800">Draft</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="bg-neutral-50 p-3 rounded-md text-sm text-neutral-600 mb-4">
                    This draft has {draft.keyResults.length} key results and can be submitted when you're ready.
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm">
                      Edit Draft
                    </Button>
                    <Button size="sm">
                      Submit for Approval
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm border-dashed border-2 border-neutral-200 bg-neutral-50">
              <CardContent className="pt-6 flex flex-col items-center text-center p-12">
                <Target className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No draft OKRs</h3>
                <p className="text-neutral-600 mb-6 max-w-md">
                  You don't have any draft OKRs yet. Create a draft to work on before submitting for approval.
                </p>
                <Link href="/create-draft-okr">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Draft OKR
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedOKRs.map((okr) => (
            <Card key={okr.id} className="shadow-sm border-green-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{okr.timeframe}</Badge>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      {okr.title}
                    </CardTitle>
                    <CardDescription className="mt-1">{okr.description}</CardDescription>
                  </div>
                  
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
                
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-neutral-600">Overall Progress</span>
                    <span className="text-sm font-medium">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className="h-2 bg-green-500" />
                </div>
              </CardHeader>
              
              <CardContent>
                <h4 className="text-sm font-medium mb-2">Key Results</h4>
                <div className="space-y-3">
                  {okr.keyResults.map((kr) => (
                    <div key={kr.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{kr.title}</p>
                          <div className="flex items-center mt-1 gap-3">
                            <div className="text-xs text-neutral-500">
                              Completed: {kr.dueDate}
                            </div>
                            <Badge className="bg-green-100 text-green-800">Complete</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{kr.progress}%</div>
                        <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${kr.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}