import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { CreateFirstObjectiveCard, SmartCreateObjectiveButton } from "@/components/onboarding/smart-create-objective-button";

// Types to match database schema
interface KeyResult {
  id: string;
  title: string;
  description?: string;
  currentValue: string; // Changed from number to string to match database
  targetValue: string; // Changed from number to string to match database
  startValue: string; // Changed from number to string to match database
  objectiveId: string;
  assignedToId?: string; // Changed from ownerId to assignedToId to match database
  status?: string;
  tenantId?: string; // Added tenantId to match database
  progress?: number; // Added progress from database
  createdAt: string;
}

interface DBObjective {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  timeframeId: string;
  status: string;
  progress: number;
  parentId?: string;
  tenantId: string;
  level: string;
  createdAt: string;
}

interface Timeframe {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  cadenceId: string;
  createdAt: string;
}

// Interface for transformed data structure to match UI needs
interface OKR {
  id: string;
  title: string;
  description: string;
  progress: number;
  timeframe: string;
  status: string;
  type: string;
  keyResults: KeyResult[];
}

export default function MyOKRs() {
  const [currentTab, setCurrentTab] = useState("active");
  const [_, navigate] = useLocation();
  const { canCreateObjectives } = useUserPermissions();
  const { user } = useAuth();
  
  // Fetch all objectives
  const { data: objectives = [], isLoading: loadingObjectives } = useQuery<DBObjective[]>({
    queryKey: ['/api/objectives'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user
  });
  
  // Fetch key results
  const { data: keyResults = [], isLoading: loadingKeyResults } = useQuery<KeyResult[]>({
    queryKey: ['/api/key-results'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user
  });
  
  // Fetch timeframes for mapping
  const { data: timeframes = [], isLoading: loadingTimeframes } = useQuery<Timeframe[]>({
    queryKey: ['/api/timeframes'],
    queryFn: getQueryFn({ on401: 'returnNull' }),
    enabled: !!user
  });
  
  // Transform database objectives into OKR format needed for UI
  const transformObjectivesToOKRs = (): OKR[] => {
    if (loadingObjectives || loadingKeyResults || loadingTimeframes) return [];
    
    return objectives.map(obj => {
      // Find related key results
      const objKeyResults = keyResults.filter(kr => kr.objectiveId === obj.id);
      
      // Find timeframe
      const timeframe = timeframes.find(tf => tf.id === obj.timeframeId);
      
      return {
        id: obj.id,
        title: obj.title,
        description: obj.description || "",
        progress: obj.progress,
        timeframe: timeframe?.name || "Unknown",
        status: obj.status,
        type: obj.level, // using level field to determine type
        keyResults: objKeyResults
      };
    });
  };
  
  const myOKRs = transformObjectivesToOKRs();
  
  // Filter objectives by user
  const userOKRs = myOKRs.filter(okr => {
    // For now, show all objectives as we build out the system, but in future we can filter
    // to only show those belonging to current user with: okr.ownerId === user?.id
    return true;
  });
  
  // Filter by status
  const activeOKRs = userOKRs.filter(okr => okr.status === "active");
  const pendingApprovalOKRs = userOKRs.filter(okr => okr.status === "pending-approval");
  const draftOKRs = userOKRs.filter(okr => okr.status === "draft");
  const completedOKRs = userOKRs.filter(okr => okr.status === "completed");
  
  // Helper functions for UI display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
      case "at-risk":
        return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
      case "behind":
        return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
      case "complete":
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Complete</Badge>;
      case "pending-approval":
        return <Badge className="bg-purple-100 text-purple-800">Pending Approval</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "draft":
        return <Badge className="bg-neutral-100 text-neutral-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-blue-500";
  };
  
  // Calculate key result progress based on current, target and start values
  const calculateProgressPercentage = (current: string, target: string, start: string) => {
    // Convert string values to numbers
    const currentNum = parseFloat(current);
    const targetNum = parseFloat(target);
    const startNum = parseFloat(start);
    
    // Check for valid numbers and prevent division by zero
    if (isNaN(currentNum) || isNaN(targetNum) || isNaN(startNum) || targetNum === startNum) {
      return 0;
    }
    
    const progress = Math.min(100, Math.max(0, 
      ((currentNum - startNum) / (targetNum - startNum)) * 100
    ));
    return Math.round(progress);
  };
  
  // Loading state
  if (loadingObjectives || loadingKeyResults || loadingTimeframes) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-neutral-600">Loading your objectives...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">My OKRs</h1>
            <p className="text-neutral-600 mt-1">
              Track and manage your personal objectives and key results
            </p>
          </div>
          
          <SmartCreateObjectiveButton className="flex items-center gap-2" />
        </div>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active ({activeOKRs.length})</TabsTrigger>
            <TabsTrigger value="pending-approval">Pending Approval ({pendingApprovalOKRs.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftOKRs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOKRs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activeOKRs.length > 0 ? (
              activeOKRs.map((okr) => (
                <Card 
                  key={okr.id} 
                  className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/objective/${okr.id}`)}
                >
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
                    {okr.keyResults.length > 0 ? (
                      <div className="space-y-3">
                        {okr.keyResults.map((kr) => {
                          // Calculate progress for key result
                          // Use the progress field from the database if available, otherwise calculate it
                          const krProgress = kr.progress !== undefined 
                            ? kr.progress 
                            : calculateProgressPercentage(
                                kr.currentValue, 
                                kr.targetValue, 
                                kr.startValue
                              );
                          
                          return (
                            <div key={kr.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                              <div className="flex items-start gap-3">
                                <TrendingUp className="h-5 w-5 text-neutral-400 mt-0.5" />
                                <div>
                                  <p className="font-medium text-sm">{kr.title}</p>
                                  <div className="flex items-center mt-1 gap-3">
                                    <div className="text-xs text-neutral-500 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(kr.createdAt).toLocaleDateString()}
                                    </div>
                                    {getStatusBadge(kr.status || 'active')}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">{krProgress}%</div>
                                <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${getProgressColor(krProgress)}`} 
                                    style={{ width: `${krProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No key results found for this objective.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <CreateFirstObjectiveCard />
            )}
          </TabsContent>
          
          <TabsContent value="pending-approval" className="space-y-4">
            {pendingApprovalOKRs.length > 0 ? (
              pendingApprovalOKRs.map((okr) => (
                <Card 
                  key={okr.id} 
                  className="shadow-sm border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/objective/${okr.id}`)}
                >
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
                    {okr.keyResults.length > 0 ? (
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
                                    {new Date(kr.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No key results found for this objective.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending OKRs</h3>
                  <p className="text-neutral-500 mb-6">You don't have any OKRs awaiting approval.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="drafts" className="space-y-4">
            {draftOKRs.length > 0 ? (
              draftOKRs.map((draft) => (
                <Card 
                  key={draft.id} 
                  className="shadow-sm border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/objectives/${draft.id}`)}
                >
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
                    <div className="flex gap-2 mb-4">
                      <Button variant="default">Continue Editing</Button>
                      <Button variant="outline">Submit for Approval</Button>
                    </div>
                    
                    <h4 className="text-sm font-medium mb-2">Key Results</h4>
                    {draft.keyResults.length > 0 ? (
                      <div className="space-y-3">
                        {draft.keyResults.map((kr) => (
                          <div key={kr.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-md">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="h-5 w-5 text-neutral-400 mt-0.5" />
                              <div>
                                <p className="font-medium text-sm">{kr.title}</p>
                                <div className="flex items-center mt-1">
                                  <div className="text-xs text-neutral-500 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(kr.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No key results created yet for this draft.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No draft OKRs</h3>
                  <p className="text-neutral-500 mb-6">You don't have any OKRs in draft status.</p>
                  {canCreateObjectives && canCreateObjectives() && (
                    <Button
                      onClick={() => navigate("/create-objective")}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create OKR
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {completedOKRs.length > 0 ? (
              completedOKRs.map((okr) => (
                <Card 
                  key={okr.id} 
                  className="shadow-sm border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/objective/${okr.id}`)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="mb-2">{okr.timeframe}</Badge>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-500" />
                          {okr.title}
                        </CardTitle>
                        <CardDescription className="mt-1">{okr.description}</CardDescription>
                      </div>
                      
                      <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
                    </div>
                    
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-neutral-600">Overall Progress</span>
                        <span className="text-sm font-medium">100%</span>
                      </div>
                      <Progress value={100} className="h-2 bg-blue-500" />
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <h4 className="text-sm font-medium mb-2">Key Results</h4>
                    {okr.keyResults.length > 0 ? (
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
                                    {new Date(kr.createdAt).toLocaleDateString()}
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800">Complete</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No key results found for this objective.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed OKRs</h3>
                  <p className="text-neutral-500 mb-6">You don't have any completed OKRs yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}