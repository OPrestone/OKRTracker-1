import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sparkles, Target, LineChart, Trophy, User, Calendar } from "lucide-react";
import ProgressTracker from "@/components/user-progress/progress-tracker";

export default function ProgressDashboard() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-progress");
  
  // Query to get the user's objectives
  const { data: userObjectives, isLoading: objectivesLoading } = useQuery({
    queryKey: ["/api/objectives/user", userData?.id],
    enabled: !!userData?.id,
  });
  
  // Query to get the user's progress data
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/progress/user", userData?.id],
    enabled: !!userData?.id,
  });
  
  // Calculate overall progress percentage across all objectives
  const overallProgress = progressData && progressData.length > 0
    ? Math.round(progressData.reduce((sum, item) => sum + item.progress, 0) / progressData.length)
    : 0;
  
  const getProgressColor = (value: number) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-blue-500";
    if (value >= 25) return "bg-amber-500";
    return "bg-red-500";
  };
  
  // Filter objectives by status for different tabs
  const activeObjectives = userObjectives?.filter(obj => obj.status === "active") || [];
  const completedObjectives = userObjectives?.filter(obj => obj.status === "completed") || [];
  const draftObjectives = userObjectives?.filter(obj => obj.status === "draft") || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your personal OKR progress
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <Progress 
              value={overallProgress} 
              className={`h-2 mt-2 ${getProgressColor(overallProgress)}`} 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Average progress across all your objectives
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{userObjectives?.length || 0}</div>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <div>{activeObjectives.length} Active</div>
              <div>{completedObjectives.length} Completed</div>
              <div>{draftObjectives.length} Draft</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {progressData && progressData.length > 0 
                  ? new Date(Math.max(...progressData.map(p => new Date(p.lastUpdated).getTime()))).toLocaleDateString()
                  : "Never"
                }
              </div>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last time you updated your progress
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        defaultValue="my-progress" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="my-progress">My Progress</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Objectives Progress</CardTitle>
              <CardDescription>
                Track and update your personal progress on assigned objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectivesLoading || progressLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : userObjectives && userObjectives.length > 0 ? (
                <ProgressTracker 
                  objectives={userObjectives}
                  onProgressUpdate={(objectiveId, progress) => {
                    toast({
                      title: "Progress updated",
                      description: `Objective progress set to ${progress}%`,
                    });
                  }}
                />
              ) : (
                <div className="text-center py-6">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No objectives found</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any objectives assigned yet.
                  </p>
                  <Button variant="outline">Create an Objective</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Objectives</CardTitle>
              <CardDescription>
                Objectives that are currently in progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectivesLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : activeObjectives && activeObjectives.length > 0 ? (
                <ProgressTracker 
                  objectives={activeObjectives}
                />
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  You don't have any active objectives.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Objectives</CardTitle>
              <CardDescription>
                Objectives you have successfully completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectivesLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : completedObjectives && completedObjectives.length > 0 ? (
                <ProgressTracker 
                  objectives={completedObjectives}
                />
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  You haven't completed any objectives yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="drafts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Objectives</CardTitle>
              <CardDescription>
                Objectives that are still in draft status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {objectivesLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ) : draftObjectives && draftObjectives.length > 0 ? (
                <ProgressTracker 
                  objectives={draftObjectives}
                />
              ) : (
                <p className="text-muted-foreground text-center py-6">
                  You don't have any draft objectives.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}