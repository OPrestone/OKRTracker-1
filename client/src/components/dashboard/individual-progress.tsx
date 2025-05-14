import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MiniChart } from "@/components/dashboard/mini-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useAuth } from "@/hooks/use-auth";
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  Trophy,
  Target,
  BarChart as BarChartIcon,
  PieChart,
  LineChart as LineChartIcon,
  User as UserIcon,
  Info,
} from "lucide-react";

// Types for real data
interface DbUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string;
  initials: string;
}

interface DbObjective {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  status?: string;
  ownerId: string;
  teamId?: string;
  timeframeId: string;
  timeframeName?: string;
  level?: string;
  tenantId: string;
  createdAt?: string;
  keyResults: DbKeyResult[];
}

interface DbKeyResult {
  id: string;
  title: string;
  progress?: number;
  target_value?: string;
  current_value?: string;
  start_value?: string;
  status?: string;
  objective_id: string;
}

interface DbFeedback {
  id: string;
  content: string;
  rating: number;
  date: string;
  from: string;
}

interface MonthlyProgress {
  month: string;
  progress: number;
}

interface UserPerformance {
  user: DbUser;
  statistics: {
    totalObjectives: number;
    completedObjectives: number;
    inProgressObjectives: number;
    notStartedObjectives: number;
    totalKeyResults: number;
    completedKeyResults: number;
    completionRate: number;
    keyResultCompletionRate: number;
    avgSatisfaction: number;
  };
  objectives: DbObjective[];
  monthlyProgress: MonthlyProgress[];
  feedback: DbFeedback[];
  checkIns: any[]; // Using any for now as we're not focusing on check-ins
}

// Generate radar chart data from objectives
const generateCompetencyData = (objectives: DbObjective[]) => {
  const competencyMap = new Map<string, { count: number; total: number }>();

  objectives.forEach(obj => {
    const level = obj.level || 'Other';
    const progress = obj.progress || 0;
    
    if (competencyMap.has(level)) {
      const current = competencyMap.get(level)!;
      competencyMap.set(level, {
        count: current.count + 1,
        total: current.total + progress
      });
    } else {
      competencyMap.set(level, {
        count: 1,
        total: progress
      });
    }
  });

  return Array.from(competencyMap.entries()).map(([subject, data]) => ({
    subject,
    A: data.count > 0 ? Math.round(data.total / data.count) : 0,
    fullMark: 100
  }));
};

// Helper function to get status color
const getStatusColor = (status: string | undefined) => {
  if (!status) return 'bg-gray-500';
  
  switch (status.toLowerCase()) {
    case 'on-track':
    case 'completed':
      return 'bg-green-500';
    case 'at-risk':
      return 'bg-yellow-500';
    case 'behind':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

// Helper function to create status badges
const getStatusBadge = (status: string | undefined) => {
  if (!status) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
  
  switch (status.toLowerCase()) {
    case 'on-track':
      return <Badge className="bg-green-100 text-green-800">On Track</Badge>;
    case 'at-risk':
      return <Badge className="bg-yellow-100 text-yellow-800">At Risk</Badge>;
    case 'behind':
      return <Badge className="bg-red-100 text-red-800">Behind</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};

// Helper function to generate rating stars
const getRatingStars = (rating: number) => {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
};

export function IndividualProgress() {
  const { currentTenant } = useTenantContext();
  const { user } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Fetch all users in the tenant for the dropdown
  const { 
    data: users = [], 
    isLoading: usersLoading, 
    error: usersError 
  } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: !!currentTenant
  });
  
  // Fetch individual performance data
  const { 
    data: performanceData, 
    isLoading: performanceLoading, 
    error: performanceError 
  } = useQuery<UserPerformance>({
    queryKey: ["/api/users", selectedUserId, "performance"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${selectedUserId}/performance?tenantId=${currentTenant?.id}`);
      if (!res.ok) throw new Error('Failed to fetch performance data');
      return await res.json();
    },
    enabled: !!selectedUserId && !!currentTenant?.id
  });
  
  // Initialize selectedUserId when users data loads
  React.useEffect(() => {
    if (Array.isArray(users) && users.length && !selectedUserId) {
      // Default to current user if available
      const defaultUser = user ? 
        users.find(u => u.id === user.id) : 
        users[0];
      
      if (defaultUser) {
        setSelectedUserId(defaultUser.id);
      }
    }
  }, [users, user, selectedUserId]);
  
  // Parse performance data
  const competencyData = performanceData?.objectives ? 
    generateCompetencyData(performanceData.objectives) : 
    [];
    
  const monthlyProgressData = performanceData?.monthlyProgress || [];
  const feedbackData = performanceData?.feedback || [];
  const objectives = performanceData?.objectives || [];
  const stats = performanceData?.statistics;
  
  // Loading state
  if (usersLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  // Error state
  if (usersError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load users. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  // No users state
  if (!users || users.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No users found</AlertTitle>
        <AlertDescription>
          There are no users in this organization yet.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Individual Progress</h2>
          <p className="text-muted-foreground">
            Track and analyze individual team member performance and objectives.
          </p>
        </div>
        <div className="w-full md:w-[260px]">
          <Select
            value={selectedUserId}
            onValueChange={(value) => setSelectedUserId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Team Members</SelectLabel>
                {Array.isArray(users) && users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.username || `User ${user.id}`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {performanceLoading && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      )}

      {performanceError && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load performance data. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {performanceData && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Objectives"
              value={stats?.totalObjectives.toString() || "0"}
              subtitle={`${stats?.completedObjectives || 0} completed`}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Completion Rate"
              value={`${Math.round(stats?.completionRate || 0)}%`}
              subtitle="Objective completion rate"
              icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Key Results"
              value={stats?.totalKeyResults.toString() || "0"}
              subtitle={`${stats?.completedKeyResults || 0} completed`}
              icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="Satisfaction"
              value={`${(stats?.avgSatisfaction || 0).toFixed(1)}/5`}
              subtitle="Average feedback rating"
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Over Time</CardTitle>
                <CardDescription>
                  Monthly objective completion progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyProgressData}>
                      <defs>
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        stroke="#0ea5e9"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Competency Analysis</CardTitle>
                <CardDescription>Skill performance by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#0ea5e9"
                        fill="#0ea5e9"
                        fillOpacity={0.5}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="objectives">
            <TabsList className="mb-4">
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="objectives" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {objectives.length > 0 ? (
                  objectives.map((objective) => (
                    <Card key={objective.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{objective.title}</CardTitle>
                            <CardDescription className="mt-2">
                              {objective.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(objective.status)}
                            <Badge variant="outline">{objective.timeframeName}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{objective.progress}%</span>
                          </div>
                          <Progress value={objective.progress} className="h-2" />
                          
                          <div className="pt-4">
                            <h4 className="font-medium mb-2">Key Results</h4>
                            <div className="space-y-4">
                              {objective.keyResults.map((kr) => (
                                <div key={kr.id} className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <p className="font-medium">{kr.title}</p>
                                      <div className="text-sm text-muted-foreground">
                                        {kr.current_value} of {kr.target_value}
                                      </div>
                                    </div>
                                    {getStatusBadge(kr.status)}
                                  </div>
                                  <Progress value={kr.progress} className="h-1.5" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No objectives</AlertTitle>
                    <AlertDescription>
                      This user doesn't have any objectives yet.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            <TabsContent value="feedback" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {feedbackData.length > 0 ? (
                  feedbackData.map((feedback, index) => (
                    <Card key={feedback.id || index}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Feedback from {feedback.from}</CardTitle>
                          <div className="text-yellow-500">{getRatingStars(feedback.rating)}</div>
                        </div>
                        <CardDescription>{new Date(feedback.date).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>{feedback.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="md:col-span-2">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No feedback</AlertTitle>
                      <AlertDescription>
                        This user hasn't received any feedback yet.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}