import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  Users, 
  Target, 
  BarChart3, 
  Calendar, 
  Settings,
  PlusCircle,
  UserPlus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface TeamObjective {
  id: number;
  title: string;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
}

export default function TeamDetailPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id);
  
  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}`],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Team not found");
        }
        throw new Error("Failed to fetch team details");
      }
      return res.json();
    },
    retry: false
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}/members`],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    enabled: !!teamId
  });

  const { data: objectives, isLoading: objectivesLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}/objectives`],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/objectives`);
      if (!res.ok) throw new Error("Failed to fetch team objectives");
      return res.json();
    },
    enabled: !!teamId
  });

  const handleGoBack = () => {
    setLocation("/teams");
  };

  // Function to determine progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-600";
    if (progress >= 50) return "bg-blue-600";
    if (progress >= 25) return "bg-amber-500";
    return "bg-red-600";
  };

  // Function to get status badge styling
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "on_track":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">On Track</Badge>;
      case "at_risk":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">At Risk</Badge>;
      case "behind":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Behind</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout title={team ? team.name : "Team Details"} 
      subtitle={team?.description || "Loading team information..."}>
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4 gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back to Teams
        </Button>

        {teamLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ) : team ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full flex items-center justify-center" 
                  style={{ backgroundColor: team.color || '#3B82F6' }}>
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{team.name}</h1>
                  <p className="text-muted-foreground">{team.description}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertTitle>Team not found</AlertTitle>
            <AlertDescription>
              The team you're looking for doesn't exist or you don't have access to it.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {team && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full max-w-md grid grid-cols-4">
            <TabsTrigger value="overview" className="flex gap-1 items-center">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="members" className="flex gap-1 items-center">
              <Users className="h-4 w-4" /> Members
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex gap-1 items-center">
              <Target className="h-4 w-4" /> Objectives
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-1 items-center">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Team Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {objectivesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : objectives && objectives.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">
                        {Math.round(objectives.reduce((acc: number, obj: any) => acc + (obj.progress || 0), 0) / objectives.length)}%
                      </div>
                      <Progress 
                        value={Math.round(objectives.reduce((acc: number, obj: any) => acc + (obj.progress || 0), 0) / objectives.length)} 
                        className={`h-2 mt-2 ${getProgressColor(Math.round(objectives.reduce((acc: number, obj: any) => acc + (obj.progress || 0), 0) / objectives.length))}`}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Average progress across {objectives.length} objectives
                      </p>
                    </>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      No objectives to track progress
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {membersLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : members && members.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-2xl font-bold">{members.length}</div>
                      <div className="flex -space-x-2">
                        {members.slice(0, 5).map((member: any, index: number) => (
                          <Avatar key={member.id} className="border-2 border-background">
                            {member.avatarUrl ? (
                              <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                            ) : (
                              <AvatarFallback>
                                {member.firstName?.[0]}{member.lastName?.[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                        
                        {members.length > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium">
                            +{members.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      No members in this team
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Objectives</CardTitle>
                </CardHeader>
                <CardContent>
                  {objectivesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : objectives && objectives.length > 0 ? (
                    <div>
                      <div className="text-2xl font-bold">{objectives.length}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-green-600">
                          {objectives.filter((obj: any) => obj.status === 'on_track').length}
                        </span> on track, 
                        <span className="font-medium text-amber-600 ml-1">
                          {objectives.filter((obj: any) => obj.status === 'at_risk').length}
                        </span> at risk, 
                        <span className="font-medium text-red-600 ml-1">
                          {objectives.filter((obj: any) => obj.status === 'behind').length}
                        </span> behind
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-muted-foreground">
                      No objectives found
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Objective
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and changes to team objectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* This would be replaced with actual activity data */}
                  {objectivesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ) : objectives && objectives.length > 0 ? (
                    <div className="space-y-4">
                      {objectives.slice(0, 3).map((objective: any) => (
                        <div key={objective.id} className="flex items-start space-x-4">
                          <div className="bg-primary/10 p-2 rounded-full">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium">{objective.title}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="text-xs text-muted-foreground">
                                Updated 2 days ago
                              </div>
                              <div>•</div>
                              <div>
                                {getStatusBadge(objective.status)}
                              </div>
                            </div>
                          </div>
                          <div>
                            <Badge variant="outline" className="bg-background">
                              {objective.progress}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      No recent activity found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage team members and their roles</CardDescription>
                  </div>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : members && members.length > 0 ? (
                  <div className="space-y-4">
                    {members.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            {member.avatarUrl ? (
                              <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                            ) : (
                              <AvatarFallback>
                                {member.firstName?.[0]}{member.lastName?.[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.firstName} {member.lastName}</div>
                            <div className="text-sm text-muted-foreground">{member.role || 'Member'}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant="outline">{member.role || 'Member'}</Badge>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No team members found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Objectives Tab */}
          <TabsContent value="objectives" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Team Objectives</CardTitle>
                    <CardDescription>Track and manage team objectives and key results</CardDescription>
                  </div>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Objective
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {objectivesLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-28 w-full" />
                  </div>
                ) : objectives && objectives.length > 0 ? (
                  <div className="space-y-6">
                    {objectives.map((objective: any) => (
                      <div key={objective.id} className="border rounded-lg p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{objective.title}</h3>
                            <div className="text-sm text-muted-foreground">
                              Owner: {objective.ownerName || 'Unassigned'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(objective.status)}
                            <Badge variant="outline">{objective.progress}%</Badge>
                          </div>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={objective.progress} 
                            className={`h-2 ${getProgressColor(objective.progress)}`}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-3">
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {objective.timeframe || 'No timeframe set'}
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertTitle>No objectives found</AlertTitle>
                    <AlertDescription>
                      This team doesn't have any objectives yet. Add objectives to track team progress.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
                <CardDescription>Manage team information and properties</CardDescription>
              </CardHeader>
              <CardContent>
                {teamLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : team ? (
                  <div className="space-y-6">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Team Name</label>
                      <input 
                        type="text" 
                        defaultValue={team.name}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea 
                        defaultValue={team.description || ''}
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Describe the team's purpose and responsibilities"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Team Color</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            defaultValue={team.color || '#3B82F6'} 
                            className="h-10 w-10 p-0 border-0 rounded cursor-pointer" 
                          />
                          <input 
                            type="text"
                            defaultValue={team.color || '#3B82F6'}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Parent Team</label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">None (Top-level team)</option>
                          <option value="1">Executive Leadership</option>
                          <option value="2">Product Development</option>
                          <option value="3">Marketing</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>Error loading team settings</AlertTitle>
                    <AlertDescription>
                      There was a problem loading team settings. Please try again.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </DashboardLayout>
  );
}