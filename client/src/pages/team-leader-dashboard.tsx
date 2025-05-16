import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertTriangle, Users, BarChart, List, TrendingUp, Check, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart as RechartsBarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Type definitions
interface TeamMember {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  progress: number;
}

interface Objective {
  id: string;
  title: string;
  progress: number;
  status: string;
  ownerId: string;
  ownerName: string;
}

interface TeamPerformanceData {
  name: string;
  value: number;
  color: string;
}

interface KeyMetric {
  label: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
}

// Team Leader Dashboard Component
export default function TeamLeaderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useNavigate();

  // Check if user is a team leader
  const isTeamLeader = useQuery({
    queryKey: ['/api/user/is-team-leader'],
    retry: false,
  });
  
  // Redirect if not a team leader
  useEffect(() => {
    if (isTeamLeader.isSuccess && isTeamLeader.data === false) {
      toast({
        title: "Access Denied",
        description: "You need team leader permissions to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isTeamLeader.isSuccess, isTeamLeader.data, navigate, toast]);

  // Fetch team members data
  const teamMembers = useQuery({
    queryKey: ['/api/team/members'],
    enabled: !!isTeamLeader.data,
  });

  // Fetch team objectives data
  const teamObjectives = useQuery({
    queryKey: ['/api/team/objectives'],
    enabled: !!isTeamLeader.data,
  });
  
  // Fetch team performance data
  const teamPerformance = useQuery({
    queryKey: ['/api/team/performance'],
    enabled: !!isTeamLeader.data,
  });

  // Key metrics section data
  const keyMetrics: KeyMetric[] = [
    { 
      label: "Team Members", 
      value: teamMembers.data?.length || 0, 
      change: 0,
      icon: <Users className="h-4 w-4" /> 
    },
    { 
      label: "Objectives", 
      value: teamObjectives.data?.length || 0, 
      change: 2,
      icon: <List className="h-4 w-4" /> 
    },
    { 
      label: "Average Progress", 
      value: `${calculateAverageProgress(teamObjectives.data || [])}%`, 
      change: 5,
      icon: <TrendingUp className="h-4 w-4" /> 
    },
    { 
      label: "Completed", 
      value: countCompletedObjectives(teamObjectives.data || []), 
      change: 1,
      icon: <Check className="h-4 w-4" /> 
    },
  ];

  // Loading state
  if (isTeamLeader.isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking permissions...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (isTeamLeader.isError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error checking your permissions. Please try again later.
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Team Leader Dashboard</h1>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {keyMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    {metric.icon}
                    <span className="ml-2">{metric.label}</span>
                  </p>
                  <h3 className="text-2xl font-bold">{metric.value}</h3>
                  <p className={`text-xs ${metric.change > 0 ? 'text-green-500' : metric.change < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                    {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '–'} {Math.abs(metric.change)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team-members">Team Members</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Team Progress</CardTitle>
                  <CardDescription>
                    Overall progress of your team's objectives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {teamPerformance.isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-border" />
                    </div>
                  ) : teamPerformance.data ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={teamPerformance.data}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {teamPerformance.data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8">No data available</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates from your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamObjectives.isLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-border" />
                      </div>
                    ) : teamObjectives.data && teamObjectives.data.length > 0 ? (
                      <ul className="space-y-4">
                        {teamObjectives.data.slice(0, 5).map((objective) => (
                          <li key={objective.id} className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{objective.title}</p>
                                <p className="text-xs text-muted-foreground">Updated by {objective.ownerName}</p>
                              </div>
                            </div>
                            <Badge variant={objective.status === 'completed' ? 'success' : 'default'}>
                              {objective.status}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">No recent activity</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Members Tab */}
          <TabsContent value="team-members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Overview of your team members and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamMembers.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-border" />
                  </div>
                ) : teamMembers.data && teamMembers.data.length > 0 ? (
                  <div className="space-y-6">
                    {teamMembers.data.map((member) => (
                      <div key={member.id} className="flex items-center justify-between border-b pb-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.title}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-48">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Progress</span>
                              <span className="text-xs font-medium">{member.progress}%</span>
                            </div>
                            <Progress value={member.progress} className="h-2" />
                          </div>
                          <Button variant="ghost" size="sm">View Details</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">No team members found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objectives Tab */}
          <TabsContent value="objectives" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Objectives</CardTitle>
                <CardDescription>
                  Current objectives and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamObjectives.isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-border" />
                  </div>
                ) : teamObjectives.data && teamObjectives.data.length > 0 ? (
                  <div className="space-y-6">
                    {teamObjectives.data.map((objective) => (
                      <div key={objective.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{objective.title}</h4>
                            <p className="text-sm text-muted-foreground">Assigned to: {objective.ownerName}</p>
                          </div>
                          <Badge variant={getStatusVariant(objective.status)}>
                            {objective.status}
                          </Badge>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-xs font-medium">{objective.progress}%</span>
                          </div>
                          <Progress value={objective.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">No objectives found</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Over Time</CardTitle>
                  <CardDescription>
                    Team's progress trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { month: 'Jan', progress: 30 },
                        { month: 'Feb', progress: 45 },
                        { month: 'Mar', progress: 55 },
                        { month: 'Apr', progress: 70 },
                        { month: 'May', progress: 85 }
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Member Contribution</CardTitle>
                  <CardDescription>
                    Contribution by team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart
                      data={teamMembers.data?.map(member => ({
                        name: member.name.split(' ')[0],
                        contribution: member.progress
                      })) || []}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="contribution" fill="#82ca9d" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function calculateAverageProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0;
  const total = objectives.reduce((sum, obj) => sum + obj.progress, 0);
  return Math.round(total / objectives.length);
}

function countCompletedObjectives(objectives: Objective[]): number {
  return objectives.filter(obj => obj.status === 'completed').length;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'active':
      return 'secondary';
    case 'at-risk':
      return 'destructive';
    default:
      return 'outline';
  }
}