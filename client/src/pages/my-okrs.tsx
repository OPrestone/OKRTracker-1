import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Target, TrendingUp, Plus, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types matching the dashboard implementation
interface DbKeyResult {
  id: string;
  title: string;
  description?: string;
  current_value?: string;
  target_value?: string;
  start_value?: string;
  progress?: number;
  assigned_to_id?: string;
  objective_id: string;
  status?: string;
  tenant_id?: string;
  created_at?: string;
}

interface DbObjective {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  timeframeId: string;
  status?: string;
  progress?: number;
  tenantId: string;
  level: string;
  createdAt?: string;
  isApproved?: boolean;
  keyResults: DbKeyResult[];
}

interface OKR {
  id: string;
  title: string;
  description: string;
  progress: number;
  timeframe: string;
  status: "draft" | "active" | "completed" | "pending-approval";
  type: "personal" | "team" | "company";
  keyResults: KeyResult[];
}

interface KeyResult {
  id: string;
  title: string;
  progress: number;
  dueDate: string;
  status: "on-track" | "at-risk" | "behind" | "complete";
}

interface Timeframe {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

export default function MyOKRs() {
  const [currentTab, setCurrentTab] = useState("active");
  const { toast } = useToast();

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user's objectives
  const { data: objectives = [], isLoading, error } = useQuery<DbObjective[]>({
    queryKey: ["/api/my-objectives"],
    refetchInterval: 3000,
  });

  // Fetch timeframes
  const { data: timeframes } = useQuery<Timeframe[]>({
    queryKey: ["/api/timeframes"],
    refetchInterval: 3000,
  });

  // Submit for approval mutation
  const submitForApprovalMutation = useMutation({
    mutationFn: async (objectiveId: string) => {
      return apiRequest(`/api/objectives/${objectiveId}/submit-for-approval`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Objective submitted for approval successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-objectives"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit objective for approval",
        variant: "destructive",
      });
    },
  });

  const handleSubmitForApproval = (objectiveId: string) => {
    submitForApprovalMutation.mutate(objectiveId);
  };

  // Function to map DB objectives to UI format
  const mapDbObjectivesToUiFormat = (dbObjectives: DbObjective[] = []): OKR[] => {
    return dbObjectives.map(obj => {
      // Determine status mapping
      let status: "draft" | "active" | "completed" | "pending-approval" = "active";
      if (obj.status === "draft") status = "draft";
      else if (obj.status === "completed") status = "completed";
      else if (obj.status === "pending_approval") status = "pending-approval";
      
      // Determine type mapping
      let type: "personal" | "team" | "company" = "personal";
      if (obj.level === "company") type = "company";
      else if (obj.level === "team") type = "team";
      
      // Find timeframe name
      const timeframe = timeframes?.find(t => t.id === obj.timeframeId)?.name || "Unknown";
      
      // Map key results
      const keyResults: KeyResult[] = (obj.keyResults || []).map(kr => {
        // Determine key result status
        let krStatus: "on-track" | "at-risk" | "behind" | "complete" = "on-track";
        if (kr.status === "at_risk") krStatus = "at-risk";
        else if (kr.status === "behind") krStatus = "behind";
        else if (kr.status === "completed") krStatus = "complete";
        
        return {
          id: kr.id,
          title: kr.title,
          progress: kr.progress || 0,
          dueDate: "Ongoing", // No due date in DB schema, using default
          status: krStatus
        };
      });
      
      return {
        id: obj.id,
        title: obj.title,
        description: obj.description || "",
        progress: obj.progress || 0,
        timeframe,
        status,
        type,
        keyResults
      };
    });
  };
  
  // Process data
  const myOKRs = objectives ? mapDbObjectivesToUiFormat(objectives) : [];
  
  // Get filtered lists
  const activeOKRs = myOKRs.filter(okr => okr.status === "active");
  const pendingApprovalOKRs = myOKRs.filter(okr => okr.status === "pending-approval");
  const draftsOKRs = myOKRs.filter(okr => okr.status === "draft");
  const completedOKRs = myOKRs.filter(okr => okr.status === "completed");

  // Helper functions for UI display
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-800";
      case "at-risk":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
        return "bg-red-100 text-red-800";
      case "complete":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const calculateProgressPercentage = (current: any, target: any, start: any = 0): number => {
    const currentVal = parseFloat(current) || 0;
    const targetVal = parseFloat(target) || 0;
    const startVal = parseFloat(start) || 0;
    
    if (targetVal === 0) return 0;
    
    const progress = ((currentVal - startVal) / (targetVal - startVal)) * 100;
    return Math.round(progress);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading your OKRs</AlertTitle>
          <AlertDescription>
            There was a problem fetching your objectives. Please try again later or contact support.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">My OKRs</h1>
            <p className="text-neutral-600 mt-2">
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
            <TabsTrigger value="active">Active ({activeOKRs.length})</TabsTrigger>
            <TabsTrigger value="pending-approval">Pending Approval ({pendingApprovalOKRs.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftsOKRs.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOKRs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {activeOKRs.length > 0 ? (
              activeOKRs.map((okr) => (
                <Link key={okr.id} href={`/objective/${okr.id}`}>
                  <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
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
                          <span className="text-sm font-medium">{Math.round(okr.progress)}%</span>
                        </div>
                        <Progress value={okr.progress} className="h-2" />
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
                                  <p className="text-sm font-medium">{kr.title}</p>
                                  <Badge className={`text-xs ${getStatusBadge(kr.status)}`}>
                                    {kr.status.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{Math.round(kr.progress)}%</p>
                                <p className="text-xs text-neutral-500">{kr.dueDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-500">No key results found for this objective.</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active OKRs</h3>
                  <p className="text-neutral-500 mb-6">You don't have any active OKRs at the moment.</p>
                  <Link href="/create-objective">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create OKR
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="pending-approval" className="space-y-4">
            {pendingApprovalOKRs.length > 0 ? (
              pendingApprovalOKRs.map((okr) => (
                <Link key={okr.id} href={`/objective/${okr.id}`}>
                  <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
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
                        
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Pending Approval
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-neutral-600">Overall Progress</span>
                          <span className="text-sm font-medium">{Math.round(okr.progress)}%</span>
                        </div>
                        <Progress value={okr.progress} className="h-2" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending approvals</h3>
                  <p className="text-neutral-500">You don't have any objectives pending approval.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {draftsOKRs.length > 0 ? (
              draftsOKRs.map((okr) => (
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
                      
                      <Badge className="bg-neutral-100 text-neutral-800">
                        Draft
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex gap-2">
                      <Link href={`/objective/${okr.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        size="sm"
                        onClick={() => handleSubmitForApproval(okr.id)}
                        disabled={submitForApprovalMutation.isPending}
                      >
                        Submit for Approval
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No draft OKRs</h3>
                  <p className="text-neutral-500 mb-6">You don't have any draft objectives.</p>
                  <Link href="/create-objective">
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create OKR
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedOKRs.length > 0 ? (
              completedOKRs.map((okr) => (
                <Link key={okr.id} href={`/objective/${okr.id}`}>
                  <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
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
                        
                        <Badge className="bg-green-100 text-green-800">
                          Completed
                        </Badge>
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-neutral-600">Final Progress</span>
                          <span className="text-sm font-medium">{Math.round(okr.progress)}%</span>
                        </div>
                        <Progress value={okr.progress} className="h-2" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No completed OKRs</h3>
                  <p className="text-neutral-500">You haven't completed any objectives yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}