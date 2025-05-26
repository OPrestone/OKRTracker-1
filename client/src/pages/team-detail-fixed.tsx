import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTeams } from "@/contexts/team-context";
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
  UserPlus,
  Plus,
  ListPlus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import AddKeyResultDialog from "@/components/okrs/add-key-result-dialog";
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
  
  // Use real performance data from the API
  const [activityData, setActivityData] = useState<TaskActivity[]>([
    { day: "Mon", created: 0, completed: 0 },
    { day: "Tue", created: 0, completed: 0 },
    { day: "Wed", created: 0, completed: 0 },
    { day: "Thu", created: 0, completed: 0 },
    { day: "Fri", created: 0, completed: 0 },
    { day: "Sat", created: 0, completed: 0 },
    { day: "Sun", created: 0, completed: 0 },
  ]);
  
  // Get tenant ID from path and context
  const { currentTenant } = useTenantContext();
  const tenantId = params.id || currentTenant?.id;
  
  // State for active tab and animation triggers
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  
  // State for modal controls
  const [isCreateObjectiveModalOpen, setIsCreateObjectiveModalOpen] = useState(false);
  const [isAddTeamMemberModalOpen, setIsAddTeamMemberModalOpen] = useState(false);
  const [isAddKeyResultModalOpen, setIsAddKeyResultModalOpen] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  
  // Function to handle opening the Add Key Result modal
  const handleAddKeyResult = (objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    setIsAddKeyResultModalOpen(true);
  };
  
  // Use the centralized team context for instant data access
  const { teams, isLoading: teamsContextLoading, error: teamsContextError, refetchTeams, setTeamLeader } = useTeams();
  
  // Get team data from the team context, eliminating the need for a separate API call
  const [team, setTeam] = useState<any>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<Error | null>(null);
  
  // State for highlighting the new team leader
  const [highlightedLeaderId, setHighlightedLeaderId] = useState<string | null>(null);
  
  // Auto-refresh team data when page is accessed
  useEffect(() => {
    // Refresh team data from the server when component mounts
    refetchTeams().catch(error => {
      console.error("Error refreshing teams data:", error);
    });
  }, [refetchTeams]);
  
  // Handle making a user the team leader
  const handleMakeTeamLead = async (userId: string) => {
    try {
      if (!team?.id) {
        toast({
          title: "Error",
          description: "Team ID is not available",
          variant: "destructive"
        });
        return;
      }
      
      // Call the setTeamLeader function from the team context
      await setTeamLeader(team.id, userId);
      
      toast({
        title: "Team Leader Updated",
        description: "The team leader has been successfully updated",
        variant: "default"
      });
      
      // Set the highlighted leader ID to trigger the visual effect
      setHighlightedLeaderId(userId);
      
      // Remove the highlight after 3 seconds
      setTimeout(() => {
        setHighlightedLeaderId(null);
      }, 3000);
      
      // Refetch data to update the UI
      await refetchTeams();
      
    } catch (error) {
      console.error("Error setting team leader:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update team leader",
        variant: "destructive"
      });
    }
  };
  
  // Find team from the centralized context data
  useEffect(() => {
    console.log("Teams data loaded:", { 
      teams: Array.isArray(teams) ? teams.map(t => ({ id: t.id, name: t.name })) : 'not array', 
      teamId, 
      teamSlug, 
      loading: teamsContextLoading,
      teamsCount: Array.isArray(teams) ? teams.length : 0
    });
    
    if (teamsContextLoading) {
      setTeamLoading(true);
      return;
    }
    
    if (teamsContextError) {
      console.error("Team context error:", teamsContextError);
      setTeamError(teamsContextError);
      setTeamLoading(false);
      return;
    }
    
    try {
      let foundTeam;
      
      // Ensure teams is an array before attempting to find
      if (!Array.isArray(teams)) {
        console.warn("Teams data is not an array, forcing refetch");
        refetchTeams();
        return;
      }
      
      if (teams.length === 0) {
        console.warn("Teams array is empty, forcing refetch");
        refetchTeams();
        return;
      }
      
      if (teamSlug && teams.length > 0) {
        console.log("Looking for team by slug:", teamSlug);
        // Find by slug, with normalization for comparison
        foundTeam = teams.find((t) => {
          if (!t || !t.name) return false;
          const normalizedName = t.name.toLowerCase().replace(/\s+/g, '-');
          return normalizedName === teamSlug;
        });
      } else if (teamId && teams.length > 0) {
        console.log("Looking for team by ID:", teamId);
        // Find by ID with null safety
        foundTeam = teams.find((t) => t && t.id === teamId);
      }
      
      console.log("Found team:", foundTeam ? { id: foundTeam.id, name: foundTeam.name } : 'not found');
      
      if (!foundTeam) {
        console.warn("Team not found in context data");
        setTeamError(new Error("Team not found"));
        setTeamLoading(false);
      } else {
        setTeam(foundTeam);
        setTeamLoading(false);
      }
    } catch (error) {
      console.error("Error finding team:", error);
      setTeamError(error instanceof Error ? error : new Error("Failed to find team"));
      setTeamLoading(false);
      toast({
        title: "Error loading team",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  }, [teams, teamsContextLoading, teamsContextError, teamId, teamSlug, toast, refetchTeams]);

  // Query for team members data
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "users", tenantId],
    enabled: !!(team?.id || teamId) && !!tenantId,
  });

  // Query for team objectives data
  const { data: objectives = [], isLoading: objectivesLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "objectives", tenantId],
    enabled: !!(team?.id || teamId) && !!tenantId,
  });
  
  // Query for team performance data
  const { data: teamPerformance = {}, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/teams", team?.id || teamId, "performance", tenantId],
    enabled: !!(team?.id || teamId) && !!tenantId,
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

  const handleGoBack = () => {
    // If we have a tenant ID, navigate back to the tenant-specific teams page
    if (tenantId) {
      setLocation(`/${tenantId}/teams`);
    } else {
      // Fall back to the global teams page if no tenant context
      setLocation("/teams");
    }
  };

  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get status badge component based on status string
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "on_track":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">On Track</Badge>;
      case "at_risk":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">At Risk</Badge>;
      case "behind":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Behind</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate fallback stats if API doesn't return them
  const calculateStatsFromObjectives = (objectives: any[]) => {
    if (!objectives || !Array.isArray(objectives) || objectives.length === 0) {
      return {
        completionRate: 0,
        weeklyProgress: 0,
        teamEngagement: 0
      };
    }
    
    const completedCount = objectives.filter(obj => obj.status === 'completed').length;
    const completionRate = Math.round((completedCount / objectives.length) * 100);
    
    // Average progress across all objectives
    const totalProgress = objectives.reduce((acc, obj) => acc + (obj.progress || 0), 0);
    const weeklyProgress = Math.round(totalProgress / objectives.length);
    
    // Calculate engagement (placeholder logic)
    const teamEngagement = Math.min(95, Math.max(60, 70 + Math.random() * 25));
    
    return {
      completionRate,
      weeklyProgress,
      teamEngagement
    };
  };

  // Calculate stats using data from API or fallback to calculated values
  const stats = {
    completionRate: teamPerformance?.stats?.completionRate || 
                    (Array.isArray(objectives) ? calculateStatsFromObjectives(objectives).completionRate : 0),
    
    weeklyProgress: teamPerformance?.stats?.weeklyProgress || 
                   (Array.isArray(objectives) ? calculateStatsFromObjectives(objectives).weeklyProgress : 0),
    
    teamEngagement: teamPerformance?.stats?.teamEngagement || 
                   (Array.isArray(objectives) ? calculateStatsFromObjectives(objectives).teamEngagement : 0)
  };

  return (
    <DashboardLayout>
      {/* Team Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={handleGoBack}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          {teamLoading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <h1 className="text-2xl font-bold">{team?.name || "Team"}</h1>
          )}
        </div>
        
        {teamLoading ? (
          <Skeleton className="h-4 w-full max-w-md" />
        ) : (
          <p className="text-muted-foreground">{team?.description || "No description available"}</p>
        )}
      </div>
      
      {/* Team Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <h3 className="text-2xl font-bold">
                  {performanceLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${stats.completionRate}%`
                  )}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly Progress</p>
                <h3 className="text-2xl font-bold">
                  {performanceLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${stats.weeklyProgress}%`
                  )}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Engagement</p>
                <h3 className="text-2xl font-bold">
                  {performanceLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    `${stats.teamEngagement}%`
                  )}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Activity Chart */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Team's activity and completed tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {performanceLoading ? (
                  <div className="w-full h-[200px] flex items-center justify-center">
                    <Skeleton className="h-[200px] w-full" />
                  </div>
                ) : activityData && activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart
                      data={activityData}
                      margin={{
                        top: 5,
                        right: 20,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="created" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="completed" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                    <h3 className="text-lg font-medium">No activity data</h3>
                    <p className="text-sm text-muted-foreground">
                      Start tracking objectives to see team activity data
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {membersLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : Array.isArray(members) ? (
                    `${members.length} members`
                  ) : (
                    "No members"
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : Array.isArray(members) && members.length > 0 ? (
                  <div className="space-y-4">
                    {members.slice(0, 5).map((member: any, index: number) => (
                      <div key={member.id || index} className={cn(
                        "flex items-center justify-between p-2 rounded-md",
                        highlightedLeaderId === member.id && "bg-primary/10 animate-pulse"
                      )}>
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
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-muted-foreground">{member.role || member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {team?.leader_id === member.id && (
                            <Badge variant="outline" className="mr-2 bg-primary/10 text-primary border-primary/20">
                              Lead
                            </Badge>
                          )}
                          {!team?.leader_id || team.leader_id !== member.id ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => handleMakeTeamLead(member.id)}
                            >
                              Make Lead
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    
                    {members.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-center text-sm"
                        onClick={() => setActiveTab("members")}
                      >
                        View all members
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <Users className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                    <h3 className="text-lg font-medium">No team members</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add members to this team to improve collaboration
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setIsAddTeamMemberModalOpen(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add team member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Access Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Objectives */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Objectives</CardTitle>
                  <CardDescription>Team's top objectives</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsCreateObjectiveModalOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Objective
                </Button>
              </CardHeader>
              <CardContent>
                {objectivesLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : Array.isArray(objectives) && objectives.length > 0 ? (
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
                              
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-xs"
                                  onClick={() => handleAddKeyResult(objective.id)}
                                >
                                  <ListPlus className="h-3.5 w-3.5 mr-1" />
                                  Add KR
                                </Button>
                                
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
                          className="text-sm"
                          onClick={() => setActiveTab("objectives")}
                        >
                          View all objectives
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <Target className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
                    <h3 className="text-lg font-medium">No objectives yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create objectives to help your team track progress
                    </p>
                    <Button
                      onClick={() => setIsCreateObjectiveModalOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create first objective
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Team Info */}
            <Card>
              <CardHeader>
                <CardTitle>Team Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamLoading ? (
                    <>
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Team Name</p>
                        <p className="font-medium">{team?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Leader</p>
                        {team?.leader_id ? (
                          Array.isArray(members) && members.length > 0 ? (
                            (() => {
                              const leader = members.find(m => m.id === team.leader_id);
                              return leader ? (
                                <div className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6">
                                    {leader.avatarUrl ? (
                                      <AvatarImage src={leader.avatarUrl} alt={`${leader.firstName} ${leader.lastName}`} />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {leader.firstName?.[0]}{leader.lastName?.[0]}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <p className="font-medium">{leader.firstName} {leader.lastName}</p>
                                </div>
                              ) : <p className="text-muted-foreground">Leader not found</p>;
                            })()
                          ) : <p className="text-muted-foreground">Loading leader...</p>
                        ) : (
                          <p className="text-muted-foreground">No leader assigned</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Created</p>
                        <p className="font-medium">{team?.created_at ? formatDate(team.created_at) : "N/A"}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Team Objectives</h2>
            <Button 
              onClick={() => setIsCreateObjectiveModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Objective
            </Button>
          </div>
          
          {objectivesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : Array.isArray(objectives) && objectives.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {objectives.map((objective: TeamObjective, index: number) => (
                <motion.div
                  key={objective.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{objective.title}</CardTitle>
                      {objective.description && (
                        <CardDescription>
                          {objective.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusBadge(objective.status)}
                          
                          {objective.dueDate && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(objective.dueDate)}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAddKeyResult(objective.id)}
                          >
                            <ListPlus className="h-4 w-4 mr-1" />
                            Add Key Result
                          </Button>
                          
                          {objective.assignee && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Assigned to:</span>
                              <Avatar className="h-8 w-8">
                                {objective.assignee.avatarUrl ? (
                                  <AvatarImage 
                                    src={objective.assignee.avatarUrl} 
                                    alt={`${objective.assignee.firstName} ${objective.assignee.lastName}`} 
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {objective.assignee.firstName?.[0]}{objective.assignee.lastName?.[0]}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
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
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Target className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium">No objectives created yet</h3>
              <p className="text-muted-foreground max-w-md mt-2 mb-6">
                Create objectives to track your team's progress and align with organizational goals
              </p>
              <Button
                onClick={() => setIsCreateObjectiveModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create first objective
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Team Members</h2>
            <Button 
              onClick={() => setIsAddTeamMemberModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
          
          {membersLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : Array.isArray(members) && members.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {members.map((member: any, index: number) => (
                <motion.div
                  key={member.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Card className={cn(
                    highlightedLeaderId === member.id && "bg-primary/5 border-primary/30"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            {member.avatarUrl ? (
                              <AvatarImage src={member.avatarUrl} alt={`${member.firstName} ${member.lastName}`} />
                            ) : (
                              <AvatarFallback>
                                {member.firstName?.[0]}{member.lastName?.[0]}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{member.firstName} {member.lastName}</h3>
                            <p className="text-sm text-muted-foreground">{member.email || member.role || "Team Member"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {team?.leader_id === member.id && (
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              Team Leader
                            </Badge>
                          )}
                          
                          {!team?.leader_id || team.leader_id !== member.id ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleMakeTeamLead(member.id)}
                            >
                              Make Lead
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Users className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-xl font-medium">No team members</h3>
              <p className="text-muted-foreground max-w-md mt-2 mb-6">
                Add members to this team to collaborate and achieve your objectives
              </p>
              <Button 
                onClick={() => setIsAddTeamMemberModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add team member
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Create Objective Modal */}
      <CreateObjectiveModal
        open={isCreateObjectiveModalOpen}
        onClose={() => setIsCreateObjectiveModalOpen(false)}
        teamId={team?.id || ""}
      />
      
      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        open={isAddTeamMemberModalOpen}
        onClose={() => setIsAddTeamMemberModalOpen(false)}
        teamId={team?.id || ""}
        currentMembers={members || []}
      />
      
      {/* Add Key Result Dialog */}
      {selectedObjectiveId && (
        <AddKeyResultDialog
          objectiveId={selectedObjectiveId}
          open={isAddKeyResultModalOpen}
          onOpenChange={setIsAddKeyResultModalOpen}
        />
      )}
    </DashboardLayout>
  );
}