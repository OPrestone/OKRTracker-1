import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, BarChart, Target, TrendingUp, Briefcase, Plus,
  Building, Calendar, CheckCircle, Clock, AlertCircle, 
  PieChart, Activity, Award, Settings
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Link } from "wouter";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart as RechartsBarChart, Bar
} from 'recharts';

export default function ManagementDashboard() {
  const { user } = useAuth();
  const { userRole, canViewAnalytics, isLoading } = useUserRole();

  // Get management-level data
  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!user?.id,
  });

  const { data: objectives } = useQuery({
    queryKey: ['/api/objectives'],
    enabled: !!user?.id,
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics/management'],
    enabled: !!user?.id && canViewAnalytics,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading management dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userRole !== 'management' && userRole !== 'ceo') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard is only available to users with Management or CEO access level.
            </p>
            <Link href="dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalTeams = teams?.length || 0;
  const totalObjectives = objectives?.length || 0;
  const completedObjectives = objectives?.filter(obj => obj.status === 'completed').length || 0;
  const inProgressObjectives = objectives?.filter(obj => obj.status === 'active').length || 0;
  const overallProgress = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

  // Calculate team performance metrics
  const teamPerformanceData = teams?.map(team => ({
    name: team.name,
    progress: team.objectiveCount > 0 ? Math.round((team.completedObjectives || 0) / team.objectiveCount * 100) : 0,
    objectives: team.objectiveCount || 0,
    members: team.memberCount || 0
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Management Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Operational oversight and team performance management
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams Managed</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Active operational teams
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressObjectives}</div>
              <p className="text-xs text-muted-foreground">
                {totalObjectives} total objectives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallProgress}%</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Progress value={overallProgress} className="flex-1 h-2" />
                <span>completion rate</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallProgress >= 80 ? 'Excellent' : overallProgress >= 60 ? 'Good' : 'Needs Attention'}
              </div>
              <p className="text-xs text-muted-foreground">
                Performance status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList>
            <TabsTrigger value="teams">Team Performance</TabsTrigger>
            <TabsTrigger value="objectives">Objective Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
            <TabsTrigger value="actions">Management Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Performance Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Team Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={teamPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="progress" fill="#3b82f6" name="Progress %" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Team Cards */}
              {teams?.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: team.color || '#3b82f6' }} />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.leaderId && (
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            Has Leader
                          </Badge>
                        )}
                      </div>
                      <Link href={`teams/${team.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </div>
                    <CardDescription>{team.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{team.memberCount || 0}</div>
                        <div className="text-muted-foreground">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{team.objectiveCount || 0}</div>
                        <div className="text-muted-foreground">Objectives</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">
                          {team.objectiveCount > 0 ? Math.round((team.completedObjectives || 0) / team.objectiveCount * 100) : 0}%
                        </div>
                        <div className="text-muted-foreground">Progress</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Team Progress</span>
                        <span className="font-medium">
                          {team.objectiveCount > 0 ? Math.round((team.completedObjectives || 0) / team.objectiveCount * 100) : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={team.objectiveCount > 0 ? Math.round((team.completedObjectives || 0) / team.objectiveCount * 100) : 0} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="objectives" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Objective Status Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Objective Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Completed</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">{completedObjectives}</div>
                      <p className="text-sm text-muted-foreground">Successfully achieved</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold">In Progress</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{inProgressObjectives}</div>
                      <p className="text-sm text-muted-foreground">Currently active</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold">Needs Attention</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-600">
                        {totalObjectives - completedObjectives - inProgressObjectives}
                      </div>
                      <p className="text-sm text-muted-foreground">Require review</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Objectives */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Objectives</CardTitle>
                  <CardDescription>Latest objectives across all teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {objectives?.slice(0, 5).map((objective) => (
                      <div key={objective.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1">
                          <h4 className="font-medium">{objective.title}</h4>
                          <p className="text-sm text-muted-foreground truncate">
                            {objective.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={
                            objective.status === 'completed' ? 'default' : 
                            objective.status === 'active' ? 'secondary' : 'outline'
                          }>
                            {objective.status}
                          </Badge>
                          <Link href={`objectives/${objective.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                        </div>
                      </div>
                    )) || (
                      <p className="text-center text-muted-foreground py-4">
                        No objectives found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { month: 'Jan', performance: 65 },
                        { month: 'Feb', performance: 70 },
                        { month: 'Mar', performance: 75 },
                        { month: 'Apr', performance: 78 },
                        { month: 'May', performance: 82 },
                        { month: 'Jun', performance: overallProgress },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="performance" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Team Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Resource Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teams?.map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color || `hsl(${index * 72}, 70%, 50%)` }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{team.memberCount || 0}</div>
                          <div className="text-xs text-muted-foreground">members</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Team Objective
                  </CardTitle>
                  <CardDescription>
                    Set new objectives for teams under your management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="objectives/create">
                    <Button className="w-full">Create Objective</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Manage Teams
                  </CardTitle>
                  <CardDescription>
                    Oversee team structure and member assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="teams">
                    <Button className="w-full" variant="outline">Manage Teams</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Performance Reports
                  </CardTitle>
                  <CardDescription>
                    Generate detailed performance and progress reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="reports">
                    <Button className="w-full" variant="outline">View Reports</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Schedule Reviews
                  </CardTitle>
                  <CardDescription>
                    Plan team performance reviews and check-ins
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setLocation('/one-on-one-meetings')}
                  >
                    Schedule Meetings
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Team Performance
                  </CardTitle>
                  <CardDescription>
                    Analyze individual team performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="team-performance">
                    <Button className="w-full" variant="outline">Performance Analysis</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Team Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure team settings and operational parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="configuration/teams-config">
                    <Button className="w-full" variant="outline">Team Settings</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}