import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, AlertTriangle, Users, BarChart, List, TrendingUp, 
  Check, Clock, Calendar, Award, Target, Activity,
  ArrowUpRight, ArrowDownRight, Minus, Filter, CalendarDays,
  MessageCircle, MoveUpRight, HelpCircle, CalendarClock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart as RechartsBarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter
} from 'recharts';

// Type definitions
interface TeamMember {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  progress: number;
  lastActive?: string;
  completedObjectives?: number;
  inProgressObjectives?: number;
  riskScore?: number;
  engagementScore?: number;
  performanceTrend?: 'up' | 'down' | 'stable';
}

interface KeyResult {
  id: string;
  title: string;
  progress: number;
  target: number;
  current: number;
  start: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  dueDate?: string;
}

interface Objective {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: string;
  ownerId: string;
  ownerName: string;
  startDate?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  keyResults?: KeyResult[];
  alignedTo?: string;
  health?: 'on-track' | 'at-risk' | 'off-track';
}

interface TeamPerformanceData {
  name: string;
  value: number;
  color: string;
}

interface TeamRiskMetric {
  category: string;
  count: number;
  percentage: number;
}

interface CheckInData {
  id: string;
  date: string;
  memberName: string;
  status: string;
  highlights: string;
  blockers?: string;
  mood?: 'positive' | 'neutral' | 'negative';
}

interface KeyMetric {
  label: string;
  value: number | string;
  change: number;
  trend?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
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

  // Time period filter state
  const [timePeriod, setTimePeriod] = useState('quarter');
  
  // Check-ins data query
  const teamCheckIns = useQuery({
    queryKey: ['/api/team/check-ins'],
    enabled: !!isTeamLeader.data,
  });
  
  // Team risk metrics
  const teamRiskMetrics = useQuery({
    queryKey: ['/api/team/risk-metrics'],
    enabled: !!isTeamLeader.data,
  });

  // Key metrics section data with enhanced metrics
  const keyMetrics: KeyMetric[] = [
    { 
      label: "Team Members", 
      value: teamMembers.data?.length || 0, 
      change: 0,
      trend: 'neutral',
      icon: <Users className="h-4 w-4" />,
      description: "Total active team members" 
    },
    { 
      label: "Objectives", 
      value: teamObjectives.data?.length || 0, 
      change: 2,
      trend: 'positive',
      icon: <Target className="h-4 w-4" />,
      description: "Total active objectives" 
    },
    { 
      label: "OKR Progress", 
      value: `${calculateAverageProgress(teamObjectives.data || [])}%`, 
      change: 5,
      trend: 'positive',
      icon: <Activity className="h-4 w-4" />,
      description: "Average completion rate" 
    },
    { 
      label: "Completed", 
      value: countCompletedObjectives(teamObjectives.data || []), 
      change: 1,
      trend: 'positive',
      icon: <Check className="h-4 w-4" />,
      description: "Objectives completed" 
    },
    { 
      label: "At Risk", 
      value: countRiskObjectives(teamObjectives.data || []), 
      change: -2,
      trend: 'negative',
      icon: <AlertTriangle className="h-4 w-4" />,
      description: "Objectives that need attention" 
    },
    { 
      label: "Check-ins", 
      value: teamCheckIns.data?.length || 0, 
      change: 3,
      trend: 'positive',
      icon: <CalendarDays className="h-4 w-4" />,
      description: "Weekly team check-ins" 
    },
    { 
      label: "Alignment", 
      value: `${calculateAlignmentScore(teamObjectives.data || [])}%`, 
      change: 7,
      trend: 'positive',
      icon: <MoveUpRight className="h-4 w-4" />,
      description: "Objective alignment score" 
    },
    { 
      label: "Team Health", 
      value: calculateTeamHealth(teamMembers.data || []) || "Good", 
      change: 0,
      trend: 'neutral',
      icon: <Award className="h-4 w-4" />,
      description: "Overall team performance" 
    },
  ];

  // Loading state
  if (isTeamLeader.isLoading) {
    return (
      <DashboardLayout title="Team Leader Dashboard">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Checking permissions...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (isTeamLeader.isError) {
    return (
      <DashboardLayout title="Team Leader Dashboard">
        <div className="container mx-auto">
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
    <DashboardLayout 
      title="Team Leader Dashboard" 
      subtitle="Team performance metrics and management tools"
    >
      <div className="container mx-auto">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {keyMetrics.slice(0, 4).map((metric, index) => (
            <Card key={index} className="overflow-hidden border-l-4" style={{ 
              borderLeftColor: metric.trend === 'positive' ? '#10b981' 
                : metric.trend === 'negative' ? '#ef4444' 
                : '#6b7280' 
            }}>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <span className="p-1.5 rounded-md bg-slate-100 mr-2">{metric.icon}</span>
                    <span>{metric.label}</span>
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                  <div className="flex items-center mt-1">
                    <p className={`text-xs ${
                      metric.trend === 'positive' ? 'text-green-500' 
                      : metric.trend === 'negative' ? 'text-red-500' 
                      : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '–'} {Math.abs(metric.change)}
                    </p>
                    {metric.description && (
                      <p className="text-xs text-muted-foreground ml-2">{metric.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Display all metrics in a clean row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {keyMetrics.slice(4).map((metric, index) => (
            <Card key={index} className="overflow-hidden border-l-4" style={{ 
              borderLeftColor: metric.trend === 'positive' ? '#10b981' 
                : metric.trend === 'negative' ? '#ef4444' 
                : '#6b7280' 
            }}>
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <span className="p-1.5 rounded-md bg-slate-100 mr-2">{metric.icon}</span>
                    <span>{metric.label}</span>
                  </p>
                  <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
                  <div className="flex items-center mt-1">
                    <p className={`text-xs ${
                      metric.trend === 'positive' ? 'text-green-500' 
                      : metric.trend === 'negative' ? 'text-red-500' 
                      : 'text-gray-500'
                    }`}>
                      {metric.change > 0 ? '↑' : metric.change < 0 ? '↓' : '–'} {Math.abs(metric.change)}
                    </p>
                    {metric.description && (
                      <p className="text-xs text-muted-foreground ml-2">{metric.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter controls */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Select defaultValue={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
          <Button variant="outline" size="sm">
            Export Report
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team-members">Team Members</TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="check-ins">Check-ins</TabsTrigger>
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

          {/* Check-ins Tab */}
          <TabsContent value="check-ins" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Check-ins</CardTitle>
                  <CardDescription>Weekly status updates from team members</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Filter by Date
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Request Check-in
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Member</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Mood</TableHead>
                      <TableHead>Highlights</TableHead>
                      <TableHead>Blockers</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamObjectives.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      [
                        {
                          id: "1",
                          date: "2025-05-12",
                          memberName: "Emily Johnson",
                          status: "Completed",
                          highlights: "Finished the product roadmap presentation for stakeholders",
                          blockers: "Waiting for design team to finish mockups",
                          mood: "positive"
                        },
                        {
                          id: "2",
                          date: "2025-05-12",
                          memberName: "Michael Chen",
                          status: "Completed",
                          highlights: "Implemented new analytics dashboard features",
                          blockers: "Need clarification on data visualization requirements",
                          mood: "neutral"
                        },
                        {
                          id: "3",
                          date: "2025-05-11",
                          memberName: "Sarah Williams",
                          status: "Incomplete",
                          highlights: "Working on user research for new feature",
                          blockers: "Limited access to target user groups",
                          mood: "negative"
                        },
                        {
                          id: "4",
                          date: "2025-05-10",
                          memberName: "James Rodriguez",
                          status: "Completed",
                          highlights: "Documentation for API endpoints is complete",
                          blockers: "None",
                          mood: "positive"
                        },
                        {
                          id: "5",
                          date: "2025-05-10",
                          memberName: "Alex Kim",
                          status: "In Progress",
                          highlights: "Halfway through security implementation",
                          blockers: "Waiting on infrastructure team",
                          mood: "neutral"
                        }
                      ].map((checkIn) => (
                        <TableRow key={checkIn.id}>
                          <TableCell className="font-medium">{checkIn.memberName}</TableCell>
                          <TableCell>{new Date(checkIn.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(checkIn.status)}>{checkIn.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {checkIn.mood === 'positive' && <div className="text-green-500">😊</div>}
                            {checkIn.mood === 'neutral' && <div className="text-yellow-500">😐</div>}
                            {checkIn.mood === 'negative' && <div className="text-red-500">😞</div>}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{checkIn.highlights}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{checkIn.blockers || 'None'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="icon">
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Clock className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                  <CardDescription>Check-in completion rates by week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">This Week</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Last Week</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <Progress value={75} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Two Weeks Ago</span>
                      <span className="text-sm font-medium">80%</span>
                    </div>
                    <Progress value={80} className="h-2" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Team Sentiment</CardTitle>
                  <CardDescription>Overall mood from check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-around py-4">
                    <div className="text-center">
                      <div className="text-4xl text-green-500 mb-2">😊</div>
                      <div className="text-2xl font-bold">60%</div>
                      <div className="text-sm text-muted-foreground">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl text-yellow-500 mb-2">😐</div>
                      <div className="text-2xl font-bold">30%</div>
                      <div className="text-sm text-muted-foreground">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl text-red-500 mb-2">😞</div>
                      <div className="text-2xl font-bold">10%</div>
                      <div className="text-sm text-muted-foreground">Negative</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Common Blockers</CardTitle>
                  <CardDescription>Frequently mentioned challenges</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm">Waiting on other teams</span>
                      </div>
                      <Badge>42%</Badge>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm">Technical challenges</span>
                      </div>
                      <Badge>27%</Badge>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm">Resource constraints</span>
                      </div>
                      <Badge>18%</Badge>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                        <span className="text-sm">Unclear requirements</span>
                      </div>
                      <Badge>13%</Badge>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
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
  return objectives.filter(obj => obj.status.toLowerCase() === 'completed').length;
}

function countRiskObjectives(objectives: Objective[]): number {
  return objectives.filter(obj => 
    obj.status.toLowerCase() === 'at risk' || 
    obj.status.toLowerCase() === 'off track' ||
    obj.health === 'at-risk' || 
    obj.health === 'off-track'
  ).length;
}

function calculateAlignmentScore(objectives: Objective[]): number {
  if (objectives.length === 0) return 0;
  const alignedObjectives = objectives.filter(obj => obj.alignedTo);
  return Math.round((alignedObjectives.length / objectives.length) * 100);
}

function calculateTeamHealth(members: TeamMember[]): string {
  if (members.length === 0) return "No Data";
  
  // For demo purposes, assume average progress > 70% means good health
  const avgProgress = members.reduce((sum, m) => sum + m.progress, 0) / members.length;
  
  if (avgProgress > 85) return "Excellent";
  if (avgProgress > 70) return "Good";
  if (avgProgress > 50) return "Fair";
  return "Needs Attention";
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'secondary';
    case 'active':
    case 'in progress':
    case 'on track':
      return 'default';
    case 'at risk':
    case 'at-risk':
    case 'overdue':
    case 'off track':
      return 'destructive';
    default:
      return 'outline';
  }
}