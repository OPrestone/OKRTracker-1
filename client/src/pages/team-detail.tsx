import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
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
  ChevronRight,
  Users,
  Target,
  Search,
  FileText,
  Flame,
  Smile,
  Heart,
  Award,
  PlusCircle,
  Calendar,
  Clock,
  BarChart3,
  LineChart,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Info,
  Activity,
  ThumbsUp,
  CalendarDays,
  UserPlus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { CreateObjectiveModal } from "@/components/team/create-objective-modal";
import { AddTeamMemberModal } from "@/components/team/add-team-member-modal";

interface TeamObjective {
  id: string;
  title: string;
  description?: string;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed" | string;
  dueDate?: string;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

interface TaskActivity {
  day: string;
  created: number;
  completed: number;
}

export default function TeamDetailPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  // Get parameters from the URL, supporting both ID and slug-based routes
  const params = useParams<{ id?: string; teamId?: string; teamSlug?: string }>();
  
  // Determine team ID from parameters - handle both formats
  // For /:id/teams/:teamId route
  // For /:id/team/:teamSlug route (we'll lookup by name)
  const teamId = params.teamId || params.id;
  const teamSlug = params.teamSlug;
  
  const [viewMode, setViewMode] = useState<"today" | "weekly" | "monthly">("weekly");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  
  // Sample activity data for the chart (this would come from API in real implementation)
  const activityData: TaskActivity[] = [
    { day: "Mon", created: 20, completed: 15 },
    { day: "Tue", created: 32, completed: 25 },
    { day: "Wed", created: 27, completed: 20 },
    { day: "Thu", created: 35, completed: 30 },
    { day: "Fri", created: 30, completed: 22 },
    { day: "Sat", created: 18, completed: 16 },
    { day: "Sun", created: 13, completed: 11 },
  ];
  
  // Get tenant ID from path and context
  const { currentTenant } = useTenantContext();
  const tenantId = params.id || currentTenant?.id;
  
  // State for active tab and animation triggers
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  
  // State for modal controls
  const [isCreateObjectiveModalOpen, setIsCreateObjectiveModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  
  // Query for teams data (either by ID or by finding team by slug)
  const { data: team, isLoading: teamLoading, error: teamError } = useQuery({
    queryKey: teamSlug ? ["/api/teams", tenantId, "slug", teamSlug] : ["/api/teams", teamId, tenantId],
    queryFn: async () => {
      if (teamSlug) {
        // If we have a slug, we need to fetch all teams and find by slug
        const res = await fetch(`/api/teams?tenantId=${tenantId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch teams");
        }
        const teams = await res.json();
        // Find the team with matching slug (normalized team name)
        const matchedTeam = teams.find((t: any) => 
          t.name.toLowerCase().replace(/\s+/g, '-') === teamSlug
        );
        
        if (!matchedTeam) {
          throw new Error("Team not found");
        }
        return matchedTeam;
      } else {
        // Direct ID lookup
        const res = await fetch(`/api/teams/${teamId}?tenantId=${tenantId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Team not found");
          }
          throw new Error("Failed to fetch team details");
        }
        return res.json();
      }
    },
    retry: false,
    onError: (err) => {
      toast({
        title: "Error loading team",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  });

  // Query for team members data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "users", tenantId],
    queryFn: async () => {
      // Use the team ID from the resolved team data if available (for slug-based routing)
      const resolvedTeamId = team?.id || teamId;
      const res = await fetch(`/api/teams/${resolvedTeamId}/users?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return res.json();
    },
    // Only enable the query once we have a team ID to use
    enabled: !!(team?.id || teamId && tenantId),
    onError: (err) => {
      toast({
        title: "Error loading team members",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  });

  // Query for team objectives data
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "objectives", tenantId],
    queryFn: async () => {
      // Use the team ID from the resolved team data if available (for slug-based routing)
      const resolvedTeamId = team?.id || teamId;
      const res = await fetch(`/api/teams/${resolvedTeamId}/objectives?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch team objectives");
      return res.json();
    },
    // Only enable the query once we have a team ID to use
    enabled: !!(team?.id || teamId && tenantId),
    onError: (err) => {
      toast({
        title: "Error loading objectives",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive"
      });
    }
  });
  
  // Query for team performance data
  const { data: teamPerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "performance", tenantId],
    queryFn: async () => {
      const resolvedTeamId = team?.id || teamId;
      const res = await fetch(`/api/teams/${resolvedTeamId}/performance?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch team performance data");
      return res.json();
    },
    enabled: !!(team?.id || teamId && tenantId),
    onError: (err) => {
      // Silently log errors without toast to avoid overwhelming users
      console.error("Error loading team performance:", err);
    }
  });
  
  // Sample completed tasks data (this would come from API in real implementation)
  const completedTasks = [
    {
      id: 1,
      title: "Logo Design",
      client: "Google",
      clientLogo: "G",
      clientColor: "#4285F4",
      dueDate: "July 21, 2023",
      assignee: {
        id: 1,
        firstName: "Alex",
        lastName: "Morgan",
        avatarUrl: ""
      }
    },
    {
      id: 2,
      title: "Landing Page Design",
      client: "Facebook",
      clientLogo: "f",
      clientColor: "#1877F2",
      dueDate: "July 23, 2023",
      assignee: {
        id: 2,
        firstName: "Sarah",
        lastName: "Johnson",
        avatarUrl: ""
      }
    }
  ];
  
  // Sample scheduled launches (this would come from API in real implementation)
  const scheduledLaunches = [
    {
      id: 1,
      title: "The Bible of Mobile UX Design",
      company: "Visual.inc",
      date: "July 21, 2023",
      status: "on_track"
    },
    {
      id: 2,
      title: "Hubspot Landing Page Design",
      company: "Hubspot",
      date: "July 23, 2023",
      status: "at_risk"
    }
  ];

  // Handle setting a user as team leader
  const handleMakeTeamLead = async (userId: string) => {
    if (!team?.id || !tenantId) return;
    
    try {
      const response = await fetch(`/api/teams/${team.id}/leader`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        body: JSON.stringify({ leaderId: userId }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update team leader');
      }
      
      // Show success message
      toast({
        title: "Team Leader Updated",
        description: "The team leader has been successfully updated.",
      });
      
      // Invalidate team query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team.id, tenantId] });
      
    } catch (error) {
      toast({
        title: "Error Updating Team Leader",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    // If we have a tenant ID, navigate back to the tenant-specific teams page
    if (tenantId) {
      setLocation(`/${tenantId}/teams`);
    } else {
      // Fall back to the global teams page if no tenant context
      setLocation("/teams");
    }
  };

  // Generate activity data based on objectives and their progress
  const generateActivityData = (objectives: any[]) => {
    if (!objectives || objectives.length === 0) return activityData;
    
    const days_of_week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date();
    const result: TaskActivity[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayName = days_of_week[date.getDay()];
      
      // For real implementation, we'd query actual data from the API
      // For now, generate data based on objectives count
      const created = Math.floor(Math.random() * 10) + (objectives.length);
      const completed = Math.floor(Math.random() * created * 0.8);
      
      result.push({
        day: dayName,
        created,
        completed
      });
    }
    
    return result;
  };
  
  // Calculate team statistics
  const calculateTeamStats = (objectives: any[] = []) => {
    if (!objectives || objectives.length === 0) {
      return { 
        totalObjectives: 0,
        completedObjectives: 0,
        onTrackCount: 0,
        atRiskCount: 0,
        behindCount: 0,
        averageProgress: 0
      };
    }
    
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter(obj => obj.status === "completed").length;
    const onTrackCount = objectives.filter(obj => obj.status === "on_track").length;
    const atRiskCount = objectives.filter(obj => obj.status === "at_risk").length;
    const behindCount = objectives.filter(obj => obj.status === "behind").length;
    const totalProgress = objectives.reduce((sum, obj) => sum + (parseInt(obj.progress) || 0), 0);
    const averageProgress = totalObjectives > 0 ? Math.round(totalProgress / totalObjectives) : 0;
    
    return {
      totalObjectives,
      completedObjectives,
      onTrackCount,
      atRiskCount,
      behindCount,
      averageProgress
    };
  };
  
  // Calculate team members contribution
  const calculateMemberContribution = (members: any[] = [], objectives: any[] = []) => {
    if (!members || members.length === 0 || !objectives || objectives.length === 0) {
      return [];
    }
    
    const memberContribution = members.map(member => {
      const assignedObjectives = objectives.filter(obj => 
        obj.assignee?.id === member.id || obj.assignedToId === member.id || obj.ownerId === member.id
      );
      
      const completedObjectives = assignedObjectives.filter(obj => obj.status === "completed");
      const progress = assignedObjectives.reduce((sum, obj) => sum + (parseInt(obj.progress) || 0), 0);
      const averageProgress = assignedObjectives.length > 0 ? progress / assignedObjectives.length : 0;
      
      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        assignedCount: assignedObjectives.length,
        completedCount: completedObjectives.length,
        averageProgress: Math.round(averageProgress)
      };
    });
    
    return memberContribution.sort((a, b) => b.assignedCount - a.assignedCount);
  };

  // Function to determine progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "#16a34a"; // green-600
    if (progress >= 50) return "#3b82f6"; // blue-600
    if (progress >= 25) return "#eab308"; // amber-500
    return "#dc2626"; // red-600
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
        return <Badge variant="outline">{status || "Not Started"}</Badge>;
    }
  };
  
  // Function to format date to readable string
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  // Get calculated stats and data
  const teamStats = calculateTeamStats(objectives);
  const dynamicActivityData = generateActivityData(objectives);
  const memberContributions = calculateMemberContribution(members, objectives);
  
  // Status distribution data for pie chart
  const statusDistribution = [
    { name: 'On Track', value: teamStats.onTrackCount, color: '#16a34a' },
    { name: 'At Risk', value: teamStats.atRiskCount, color: '#eab308' },
    { name: 'Behind', value: teamStats.behindCount, color: '#dc2626' },
    { name: 'Completed', value: teamStats.completedObjectives, color: '#3b82f6' },
  ].filter(item => item.value > 0);
  
  // Get team color styling
  const getTeamColor = () => {
    return team?.color || "#3b82f6";
  };
  
  // Get team icon
  const teamIcons: Record<string, JSX.Element> = {
    building: <Target className="h-5 w-5" />,
    users: <Users className="h-5 w-5" />,
    rocket: <Activity className="h-5 w-5" />,
    default: <Users className="h-5 w-5" />
  };
  
  const getTeamIcon = () => {
    const iconName = team?.icon?.toLowerCase() || "default";
    return teamIcons[iconName] || teamIcons.default;
  };
  
  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        {teamLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-full max-w-md" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Skeleton className="h-[300px] col-span-3 md:col-span-2" />
              <Skeleton className="h-[300px] col-span-3 md:col-span-1" />
            </div>
          </motion.div>
        ) : !team ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Alert className="border-red-200 bg-red-50">
              <AlertTitle className="flex items-center text-red-800">
                <AlertCircle className="h-4 w-4 mr-2" />
                Team not found
              </AlertTitle>
              <AlertDescription className="text-red-600 mt-2">
                This team doesn't exist or you don't have permission to view it.
                <div className="mt-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleGoBack()}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>Back to Teams</span>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Team Header */}
            <div className="flex flex-col space-y-3 mb-6">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                       style={{ backgroundColor: `${getTeamColor()}15` }}>
                    <div style={{ color: getTeamColor() }}>
                      {getTeamIcon()}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                      {team.name}
                      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {members?.length || 0} members
                      </span>
                    </h1>
                    <p className="text-muted-foreground mt-1 max-w-3xl">
                      {team.description || "No description provided for this team."}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleGoBack()}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span>Back to Teams</span>
                  </Button>
                </div>
              </div>
              
              <div className="mt-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 md:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="objectives">Objectives</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                
                <TabsContent value="overview" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Team Performance Overview */}
                <Card className="col-span-3 md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Team Performance</CardTitle>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn("text-xs", viewMode === "today" && "bg-primary/5")}
                          onClick={() => setViewMode("today")}
                        >
                          Today
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn("text-xs", viewMode === "weekly" && "bg-primary/5")}
                          onClick={() => setViewMode("weekly")}
                        >
                          Weekly
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className={cn("text-xs", viewMode === "monthly" && "bg-primary/5")}
                          onClick={() => setViewMode("monthly")}
                        >
                          Monthly
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      Overall progress and key metrics for {team.name}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">Overall Progress</p>
                              <h3 className="text-2xl font-bold mt-1">{teamStats.averageProgress}%</h3>
                            </div>
                            <div className="bg-blue-100 p-2 rounded-full">
                              <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <Progress 
                            value={teamStats.averageProgress} 
                            className="h-2 mt-2" 
                          />
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">Objectives</p>
                              <h3 className="text-2xl font-bold mt-1">{teamStats.totalObjectives}</h3>
                            </div>
                            <div className="bg-green-100 p-2 rounded-full">
                              <Target className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {teamStats.completedObjectives} completed
                            </div>
                            <div className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              {teamStats.onTrackCount} on track
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-muted-foreground">Team Members</p>
                              <h3 className="text-2xl font-bold mt-1">{members?.length || 0}</h3>
                            </div>
                            <div className="bg-purple-100 p-2 rounded-full">
                              <Users className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                          <div className="flex -space-x-2 mt-2">
                            {members?.slice(0, 5).map((member: any) => (
                              <Avatar key={member.id} className="border-2 border-background w-7 h-7">
                                {member.avatarUrl ? (
                                  <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            ))}
                            
                            {members && members.length > 5 && (
                              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-accent border-2 border-background text-xs font-medium">
                                +{members.length - 5}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Activity Trend</h3>
                        <div className="flex items-center border rounded-md">
                          <span className="text-xs px-2 py-1">{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-xs text-muted-foreground">Created</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span className="text-xs text-muted-foreground">Completed</span>
                        </div>
                      </div>
                      
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={dynamicActivityData}
                            margin={{
                              top: 5,
                              right: 10,
                              left: 0,
                              bottom: 5,
                            }}
                          >
                            <defs>
                              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" />
                            <XAxis dataKey="day" axisLine={false} tickLine={false} />
                            <YAxis hide={true} />
                            <Tooltip />
                            <Area 
                              type="monotone" 
                              dataKey="created" 
                              stroke="#10B981" 
                              fillOpacity={1}
                              fill="url(#colorCreated)"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="completed" 
                              stroke="#8B5CF6" 
                              fillOpacity={1}
                              fill="url(#colorCompleted)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
                
                {/* Status Distribution */}
                <motion.div
                  className="col-span-3 md:col-span-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Status Overview</CardTitle>
                      <CardDescription>
                        Distribution of objective statuses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {statusDistribution.length > 0 ? (
                        <div className="flex flex-col h-full justify-between">
                          <div className="h-[200px] mx-auto">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={statusDistribution}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`${value} objectives`, 'Count']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            {statusDistribution.map((status, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: status.color }}
                                ></div>
                                <span className="text-sm">{status.name}</span>
                                <span className="text-sm font-medium ml-auto">{status.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[200px]">
                          <Info className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                          <p className="text-muted-foreground text-center">
                            No objectives data available to display status distribution.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              
              {/* Recent Objectives */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">Recent Objectives</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab("objectives")}
                      >
                        View All
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Latest objectives and their current progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {objectivesLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : objectives && objectives.length > 0 ? (
                      <div className="space-y-4">
                        {objectives.slice(0, 3).map((objective: TeamObjective, index: number) => (
                          <motion.div
                            key={objective.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                          >
                            <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <h3 className="font-medium">{objective.title}</h3>
                                    <div className="flex items-center gap-2">
                                      {getStatusBadge(objective.status)}
                                      {objective.dueDate && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Calendar className="h-3 w-3" />
                                          <span>Due {formatDate(objective.dueDate)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {objective.assignee && (
                                    <Avatar className="h-8 w-8">
                                      {objective.assignee.avatarUrl ? (
                                        <AvatarImage 
                                          src={objective.assignee.avatarUrl} 
                                          alt={`${objective.assignee.firstName} ${objective.assignee.lastName}`} 
                                        />
                                      ) : (
                                        <AvatarFallback className="text-xs">
                                          {objective.assignee.firstName?.[0]}{objective.assignee.lastName?.[0]}
                                        </AvatarFallback>
                                      )}
                                    </Avatar>
                                  )}
                                </div>
                                
                                <div className="mt-4">
                                  <div className="flex justify-between items-center mb-1.5 text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">{objective.progress}%</span>
                                  </div>
                                  <Progress value={objective.progress} className="h-2" />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                        
                        {objectives.length > 3 && (
                          <div className="text-center pt-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-sm"
                              onClick={() => setActiveTab("objectives")}
                            >
                              View all {objectives.length} objectives
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="font-medium mb-1">No objectives yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Create objectives to start tracking your team's progress.
                        </p>
                        <Button 
                          size="sm"
                          onClick={() => setIsCreateObjectiveModalOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span>Create Objective</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
                </TabsContent>
                
                <TabsContent value="objectives" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Team Objectives</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search objectives..."
                          className="pl-8 w-[200px] h-9"
                        />
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setIsCreateObjectiveModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span>New Objective</span>
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    All team objectives and their current progress status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {objectivesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : objectives && objectives.length > 0 ? (
                    <div className="space-y-4">
                      {objectives.map((objective: TeamObjective, index: number) => (
                        <motion.div
                          key={objective.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                        >
                          <Card 
                            className="overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => setExpandedObjective(expandedObjective === objective.id ? null : objective.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h3 className="font-medium">{objective.title}</h3>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(objective.status)}
                                    {objective.dueDate && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        <span>Due {formatDate(objective.dueDate)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {objective.assignee && (
                                  <Avatar className="h-8 w-8">
                                    {objective.assignee.avatarUrl ? (
                                      <AvatarImage 
                                        src={objective.assignee.avatarUrl} 
                                        alt={`${objective.assignee.firstName} ${objective.assignee.lastName}`} 
                                      />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {objective.assignee.firstName?.[0]}{objective.assignee.lastName?.[0]}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                )}
                              </div>
                              
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-1.5 text-sm">
                                  <span className="text-muted-foreground">Progress</span>
                                  <span className="font-medium">{objective.progress}%</span>
                                </div>
                                <Progress value={objective.progress} className="h-2" />
                              </div>
                              
                              {expandedObjective === objective.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-4 pt-4 border-t"
                                >
                                  <div className="grid gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium mb-1">Description</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {objective.description || "No description provided."}
                                      </p>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                      <Button size="sm" variant="outline">Edit</Button>
                                      <Button size="sm" variant="outline">Add Key Result</Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <h3 className="font-medium mb-1">No objectives yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Create your first objective to start tracking progress.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => setIsCreateObjectiveModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span>Create Objective</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>
                
                <TabsContent value="members" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <Button 
                      size="sm"
                      onClick={() => setIsAddTeamMemberModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      <span>Add Member</span>
                    </Button>
                  </div>
                  <CardDescription>
                    All members in {team.name}
                  </CardDescription>
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
                      {members.map((member: any, index: number) => (
                        <motion.div
                          key={member.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * index }}
                        >
                          <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10">
                                  {member.avatarUrl ? (
                                    <AvatarImage 
                                      src={member.avatarUrl} 
                                      alt={`${member.firstName} ${member.lastName}`} 
                                    />
                                  ) : (
                                    <AvatarFallback className="text-sm">
                                      {member.firstName?.[0]}{member.lastName?.[0]}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex-1">
                                  <h3 className="font-medium">
                                    {member.firstName} {member.lastName}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {member.role || member.email || "Team Member"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {member.role || "Member"}
                                  </Badge>
                                  {member.id === team?.leaderId && (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Team Lead
                                    </Badge>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleMakeTeamLead(member.id)}
                                    disabled={member.id === team?.leaderId}
                                    className="ml-auto"
                                  >
                                    {member.id === team?.leaderId ? "Current Lead" : "Make Lead"}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <h3 className="font-medium mb-1">No team members yet</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Add members to your team to start collaborating.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => setIsAddTeamMemberModalOpen(true)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        <span>Add Member</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>
                
                <TabsContent value="activity" className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Team Activity</CardTitle>
                  <CardDescription>
                    Recent activity and updates for {team.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {objectives && objectives.length > 0 ? (
                      objectives.slice(0, 5).map((objective: TeamObjective, index: number) => (
                        <motion.div
                          key={objective.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex gap-4"
                        >
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                          </div>
                          <div className="flex-1 pb-6">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{objective.title} was {objective.status === 'completed' ? 'completed' : 'updated'}</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Current progress: {objective.progress}% {getStatusBadge(objective.status)}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {objective.dueDate ? formatDate(objective.dueDate) : 'Recently'}
                              </span>
                            </div>
                            <div className="mt-3">
                              <Progress 
                                value={objective.progress} 
                                className="h-1.5" 
                              />
                            </div>
                            {objective.assignee && (
                              <div className="flex items-center mt-3">
                                <Avatar className="h-6 w-6 mr-2">
                                  <AvatarFallback className="text-xs">
                                    {objective.assignee.firstName?.[0]}{objective.assignee.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">
                                  Assigned to {objective.assignee.firstName} {objective.assignee.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="font-medium mb-1">No activity yet</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                          Team activity will appear here once objectives are created and updated.
                        </p>
                        <Button 
                          size="sm"
                          onClick={() => setIsCreateObjectiveModalOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          <span>Create Objective</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
                </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Modals */}
      <CreateObjectiveModal 
        isOpen={isCreateObjectiveModalOpen}
        onClose={() => setIsCreateObjectiveModalOpen(false)}
        teamId={team?.id || ""}
      />
      
      <AddTeamMemberModal
        isOpen={isAddTeamMemberModalOpen}
        onClose={() => setIsAddTeamMemberModalOpen(false)}
        teamId={team?.id || ""}
        currentMembers={members || []}
      />
    </DashboardLayout>
  );
}