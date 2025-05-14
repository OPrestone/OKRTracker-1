import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
  CalendarDays
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TeamObjective {
  id: string;
  title: string;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
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
      date: "July 21, 2023"
    },
    {
      id: 2,
      title: "Hubspot Landing Page Design",
      company: "Hubspot",
      date: "July 23, 2023"
    }
  ];

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

  return (
    <DashboardLayout>
      <div className="mb-8">
        {teamLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ) : team ? (
          <div>
            <div className="flex flex-col space-y-3 mb-4">
              <h1 className="text-2xl font-bold">{team.name}</h1>
              <p className="text-muted-foreground">
                {team.description || "This project will be create awesome product. Will running around 6 months with superfast pace working but touch with awesome visual"}
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2">
                  {members && members.slice(0, 4).map((member: any) => (
                    <Avatar key={member.id} className="border-2 border-background w-8 h-8">
                      {member.avatarUrl ? (
                        <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                      ) : (
                        <AvatarFallback className="text-xs">
                          {member.firstName?.[0]}{member.lastName?.[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ))}
                  
                  {members && members.length > 4 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent border-2 border-background text-xs font-medium">
                      +{members.length - 4}
                    </div>
                  )}
                </div>
                
                <Button size="sm" variant="outline" className="rounded-full text-sm font-medium">
                  Invite
                </Button>
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
        <div className="space-y-8">
          {/* User and Project Selection Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=N`} alt="User" />
                <AvatarFallback>N</AvatarFallback>
              </Avatar>
              
              <div className="flex items-center border rounded-md px-2">
                <span className="text-sm px-2 py-1">Today</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Design Project</span>
              </div>
              
              <div className="flex items-center border rounded-md px-2">
                <span className="text-sm px-2 py-1">Monthly</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <Button variant="outline" className="gap-2">
                <span>New Broadcast</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <div className="border rounded-md px-2 py-1">
                <span className="text-sm">Everyone</span>
                <ChevronRight className="h-4 w-4 inline-block text-muted-foreground" />
              </div>
            </div>
          </div>
          
          {/* Project Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {members && members.slice(0, 3).map((member: any) => (
                        <Avatar key={member.id} className="border-2 border-background w-8 h-8">
                          {member.avatarUrl ? (
                            <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                          ) : (
                            <AvatarFallback className="text-xs">
                              {member.firstName?.[0]}{member.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">Team members</span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="text-2xl font-bold">24</div>
                      <div className="text-sm text-muted-foreground">Tasks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">190</div>
                      <div className="text-sm text-muted-foreground">Hours</div>
                    </div>
                  </div>
                </div>
                
                {/* Task Activity Chart */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Tasks Activity</h3>
                    <div className="flex items-center border rounded-md">
                      <span className="text-xs px-2 py-1">Weekly</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">Created: 131</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-xs text-muted-foreground">Completed: 91</span>
                    </div>
                  </div>
                  
                  <div className="h-[150px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={activityData}
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
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
                </div>
                
                {/* Reactions/Emojis */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn("rounded-full p-2 h-8 w-8", 
                        selectedEmoji === "smile" && "bg-yellow-100 border-yellow-300"
                      )}
                      onClick={() => setSelectedEmoji(selectedEmoji === "smile" ? null : "smile")}
                    >
                      <Smile className="h-4 w-4 text-yellow-500" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn("rounded-full p-2 h-8 w-8", 
                        selectedEmoji === "heart" && "bg-red-100 border-red-300"
                      )}
                      onClick={() => setSelectedEmoji(selectedEmoji === "heart" ? null : "heart")}
                    >
                      <Heart className="h-4 w-4 text-red-500" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn("rounded-full p-2 h-8 w-8", 
                        selectedEmoji === "award" && "bg-orange-100 border-orange-300"
                      )}
                      onClick={() => setSelectedEmoji(selectedEmoji === "award" ? null : "award")}
                    >
                      <Award className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className={cn("rounded-full p-2 h-8 w-8", 
                        selectedEmoji === "flame" && "bg-red-100 border-red-300"
                      )}
                      onClick={() => setSelectedEmoji(selectedEmoji === "flame" ? null : "flame")}
                    >
                      <Flame className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Group Name</h3>
                  <div className="flex items-center p-3 border rounded-lg">
                    <span className="text-sm">Good Job Design team 👍</span>
                    <span className="ml-3 text-sm text-muted-foreground">client</span>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium text-sm mb-2">Add Collaborators</div>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 bg-blue-100 rounded-md px-2 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=S" />
                        <AvatarFallback className="text-xs">S</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">Scott</span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1 bg-green-100 rounded-md px-2 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=J" />
                        <AvatarFallback className="text-xs">J</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">Jessica</span>
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Completed Tasks and Scheduled Launches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recently Completed Tasks */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Recently Completed Tasks</h3>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=S" />
                    <AvatarFallback className="text-xs">S</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=J" />
                    <AvatarFallback className="text-xs">J</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=M" />
                    <AvatarFallback className="text-xs">M</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="space-y-4">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-4 border rounded-lg p-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: task.clientColor }}>
                      <span className="text-white font-bold">{task.clientLogo}</span>
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">Client: {task.client}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-xs mb-1">Completed</span>
                        <span className="text-xs text-muted-foreground">Assignee</span>
                      </div>
                      
                      <Avatar className="h-8 w-8">
                        {task.assignee.avatarUrl ? (
                          <AvatarImage src={task.assignee.avatarUrl} alt={`${task.assignee.firstName} ${task.assignee.lastName}`} />
                        ) : (
                          <AvatarFallback>
                            {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Scheduled Launches */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Scheduled Launches</h3>
                <Button variant="link" size="sm" className="text-blue-600">
                  View all
                </Button>
              </div>
              
              <div className="space-y-4">
                {scheduledLaunches.map(launch => (
                  <div key={launch.id} className="flex justify-between items-center border rounded-lg p-4">
                    <div className="flex-1">
                      <p className="font-bold text-xl">{launch.date.split(" ")[1]}</p>
                      <p className="text-muted-foreground text-sm">{launch.date.split(" ")[0]} {launch.date.split(" ")[2]}</p>
                    </div>
                    
                    <div className="flex-1 ml-4">
                      <h4 className="font-medium">{launch.title}</h4>
                      <p className="text-sm text-muted-foreground">{launch.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}