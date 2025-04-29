import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Plus, Target, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface Objective {
  id: number;
  title: string;
  description: string | null;
  level: string;
  ownerId: number;
  teamId: number | null;
  timeframeId: number;
  status: string | null;
  progress: number | null;
  parentId: number | null;
  createdAt: string;
}

export default function MyOKRs() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  
  // Fetch objectives from API
  const { data: objectives = [], isLoading } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Filter objectives by active/archived status
  const activeObjectives = objectives.filter((obj) => obj.status !== "archived");
  const archivedObjectives = objectives.filter((obj) => obj.status === "archived");
  
  // Calculate time remaining functions
  const calculateTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const currentDate = new Date();
    const daysRemaining = Math.ceil((deadlineDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining;
  };
  
  const getStatusColor = (progress: number | null) => {
    if (progress === null) return "bg-gray-200";
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-yellow-500";
    if (progress < 75) return "bg-blue-500";
    return "bg-green-500";
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My OKRs</h1>
          
          <Button 
            onClick={() => navigate("/create-objective")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create OKR
          </Button>
        </div>
        
        <Tabs defaultValue="active" className="mb-6" onValueChange={(val) => setActiveTab(val as "active" | "archived")}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active OKRs</TabsTrigger>
            <TabsTrigger value="archived">Archived OKRs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-md"></div>
                ))}
              </div>
            ) : activeObjectives.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active OKRs found</h3>
                  <p className="text-gray-500 mb-6">You don't have any active OKRs yet.</p>
                  <Button
                    onClick={() => navigate("/create-objective")}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create your first OKR
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {activeObjectives.map((objective) => (
                  <Card 
                    key={objective.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/objectives/${objective.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className="text-xs font-normal bg-gray-50"
                            >
                              {objective.level === "company" && <Users className="h-3 w-3 mr-1" />}
                              {objective.level === "team" && <Users className="h-3 w-3 mr-1" />}
                              {objective.level === "personal" && <Target className="h-3 w-3 mr-1" />}
                              {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
                            </Badge>
                            
                            <Badge 
                              variant="outline" 
                              className={`text-xs font-normal ${
                                objective.status === "in_progress" 
                                  ? "bg-blue-50 text-blue-700 border-blue-200" 
                                  : objective.status === "at_risk"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : objective.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              {objective.status === "in_progress" && "In Progress"}
                              {objective.status === "at_risk" && "At Risk"}
                              {objective.status === "completed" && "Completed"}
                              {objective.status === "not_started" && "Not Started"}
                              {!objective.status && "Not Started"}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-2">{objective.title}</h3>
                          {objective.description && (
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                              {objective.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={objective.progress || 0} 
                                  className="h-2 w-24"
                                />
                                <span className="text-sm font-medium">
                                  {objective.progress || 0}%
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Timeline</p>
                              <div className="flex items-center">
                                <span className="text-sm">
                                  Q2 2023
                                </span>
                              </div>
                            </div>
                            
                            <div className="ml-auto flex items-center">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="archived">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-md"></div>
                ))}
              </div>
            ) : archivedObjectives.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No archived OKRs</h3>
                  <p className="text-gray-500">Completed OKRs will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {archivedObjectives.map((objective) => (
                  <Card 
                    key={objective.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer opacity-80"
                    onClick={() => navigate(`/objectives/${objective.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className="text-xs font-normal bg-gray-50"
                            >
                              {objective.level === "company" && <Users className="h-3 w-3 mr-1" />}
                              {objective.level === "team" && <Users className="h-3 w-3 mr-1" />}
                              {objective.level === "personal" && <Target className="h-3 w-3 mr-1" />}
                              {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
                            </Badge>
                            
                            <Badge
                              className="bg-gray-200 text-gray-700 hover:bg-gray-200 text-xs"
                            >
                              Archived
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-medium mb-2">{objective.title}</h3>
                          {objective.description && (
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                              {objective.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 mt-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Final Progress</p>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={objective.progress || 0} 
                                  className="h-2 w-24"
                                />
                                <span className="text-sm font-medium">
                                  {objective.progress || 0}%
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Timeline</p>
                              <div className="flex items-center">
                                <span className="text-sm">
                                  Q1 2023
                                </span>
                              </div>
                            </div>
                            
                            <div className="ml-auto flex items-center">
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}