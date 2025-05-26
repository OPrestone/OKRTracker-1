import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

export default function MyOKRs() {
  const [currentTab, setCurrentTab] = useState("active");
  const { currentTenant } = useTenantContext();
  const { user } = useAuth();
  
  const { data: timeframes } = useQuery({
    queryKey: ["/api/timeframes", currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  const { data: objectives, isLoading, error } = useQuery({
    queryKey: ["/api/my-objectives", currentTenant?.id],
    enabled: !!currentTenant?.id && !!user,
    retry: 3,
    retryDelay: 1000,
    onError: (err) => {
      console.error("Error fetching objectives:", err);
    }
  });

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

  // Loading state
  if (isLoading) {
    return (
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
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error loading your OKRs</AlertTitle>
        <AlertDescription>
          There was a problem fetching your objectives. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }
  
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
          <TabsTrigger value="active">Active ({activeOKRs.length})</TabsTrigger>
          <TabsTrigger value="pending-approval">Pending Approval ({pendingApprovalOKRs.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftsOKRs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedOKRs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeOKRs.length > 0 ? (
            activeOKRs.map((okr) => (
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
            ))
          ) : (
            <Card className="shadow-sm border-dashed border-2 border-neutral-200 bg-neutral-50">
              <CardContent className="pt-6 flex flex-col items-center text-center p-12">
                <Target className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No active OKRs</h3>
                <p className="text-neutral-600 mb-6 max-w-md">
                  You don't have any active OKRs yet. Create a new objective or wait for your pending OKRs to be approved.
                </p>
                <Link href="/create-objective">
                  <Button className="gap-2">
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
            ))
          ) : (
            <Card className="shadow-sm border-dashed border-2 border-neutral-200 bg-neutral-50">
              <CardContent className="pt-6 flex flex-col items-center text-center p-12">
                <AlertCircle className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No pending OKRs</h3>
                <p className="text-neutral-600 mb-6 max-w-md">
                  You don't have any OKRs waiting for approval.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4">
          {draftsOKRs.length > 0 ? (
            draftsOKRs.map((draft) => (
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
          {completedOKRs.length > 0 ? (
            completedOKRs.map((okr) => (
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
                              <div className="text-xs text-neutral-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {kr.dueDate}
                              </div>
                              <Badge className="bg-green-100 text-green-800">Complete</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{kr.progress}%</div>
                          <div className="w-16 h-1.5 bg-green-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-full"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-sm border-dashed border-2 border-neutral-200 bg-neutral-50">
              <CardContent className="pt-6 flex flex-col items-center text-center p-12">
                <CheckCircle className="h-12 w-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No completed OKRs</h3>
                <p className="text-neutral-600 mb-6 max-w-md">
                  You haven't completed any OKRs yet. Keep working on your active objectives!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}