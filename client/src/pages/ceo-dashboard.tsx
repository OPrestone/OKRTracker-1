import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, BarChart, Target, TrendingUp, Crown, Plus, Edit,
  Building, Map, FileText, Settings, Calendar, Award, 
  PieChart, Activity, Briefcase, Globe
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Link } from "wouter";
import { 
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart as RechartsBarChart, Bar
} from 'recharts';

export default function CEODashboard() {
  const { user } = useAuth();
  const { userRole, canEditMission, canEditStrategy, isLoading } = useUserRole();

  // Get organization-wide data
  const { data: organizationData } = useQuery({
    queryKey: ['/api/organization/overview'],
    enabled: !!user?.id && userRole === 'ceo',
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    enabled: !!user?.id,
  });

  const { data: objectives } = useQuery({
    queryKey: ['/api/objectives'],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading executive dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (userRole !== 'ceo') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Crown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-4">
              This dashboard is only available to users with CEO access level.
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
  const overallProgress = totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Crown className="h-8 w-8 text-yellow-500" />
              <h1 className="text-3xl font-bold">CEO Executive Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Strategic overview and organizational performance management
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeams}</div>
              <p className="text-xs text-muted-foreground">
                Across all departments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Company Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalObjectives}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Progress value={overallProgress} className="flex-1 h-2" />
                <span>{overallProgress}% complete</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Company Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overallProgress >= 80 ? 'Excellent' : overallProgress >= 60 ? 'Good' : overallProgress >= 40 ? 'Fair' : 'Needs Focus'}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on objective completion
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Strategic Alignment</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">High</div>
              <p className="text-xs text-muted-foreground">
                Mission-objective alignment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Organization Overview</TabsTrigger>
            <TabsTrigger value="strategy">Strategic Management</TabsTrigger>
            <TabsTrigger value="teams">Team Performance</TabsTrigger>
            <TabsTrigger value="actions">Executive Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Company Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
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
                        <Area type="monotone" dataKey="performance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Team Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Team Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teams?.slice(0, 5).map((team, index) => (
                      <div key={team.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: team.color || `hsl(${index * 72}, 70%, 50%)` }}
                          />
                          <span className="font-medium">{team.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {team.memberCount || 0} members
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mission & Vision Management */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Strategic Foundation
                    </CardTitle>
                    {canEditMission && (
                      <Link href="mission">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Mission & Vision
                        </Button>
                      </Link>
                    )}
                  </div>
                  <CardDescription>
                    Manage your organization's mission, vision, and strategic direction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                          Company Mission
                        </h4>
                        <p className="text-sm leading-relaxed">
                          Drive innovation and excellence in technology solutions while maintaining the highest standards of customer service and employee satisfaction.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                          Company Vision
                        </h4>
                        <p className="text-sm leading-relaxed">
                          To be the leading technology partner that empowers businesses to achieve their full potential through innovative solutions.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">
                          Strategic Direction
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>• Focus on customer-centric innovation</li>
                          <li>• Expand market presence globally</li>
                          <li>• Invest in employee development</li>
                          <li>• Maintain operational excellence</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Map Access */}
              {canEditStrategy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Strategic Planning
                    </CardTitle>
                    <CardDescription>
                      Manage your organization's strategic map and planning
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link href="strategy-map">
                      <Button className="w-full">
                        <Map className="h-4 w-4 mr-2" />
                        Access Strategy Map
                      </Button>
                    </Link>
                    <Link href="company-strategy">
                      <Button variant="outline" className="w-full">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Strategic Planning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {teams?.map((team) => (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: team.color || '#3b82f6' }} />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.leaderId && (
                          <Badge variant="secondary">
                            <Crown className="h-3 w-3 mr-1" />
                            Has Leader
                          </Badge>
                        )}
                      </div>
                      <Link href={`teams/${team.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                    <CardDescription>{team.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Company Objective
                  </CardTitle>
                  <CardDescription>
                    Set strategic objectives for the entire organization
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
                    <Users className="h-5 w-5" />
                    Manage Users
                  </CardTitle>
                  <CardDescription>
                    Add, edit, and manage user roles and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="users">
                    <Button className="w-full" variant="outline">Manage Users</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Executive Reports
                  </CardTitle>
                  <CardDescription>
                    Access comprehensive analytics and reports
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
                    <Settings className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure system settings and organizational structure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="configuration/general">
                    <Button className="w-full" variant="outline">System Settings</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Strategic Planning
                  </CardTitle>
                  <CardDescription>
                    Plan quarterly and annual strategic initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="configuration/cycles">
                    <Button className="w-full" variant="outline">Planning Cycles</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Performance Review
                  </CardTitle>
                  <CardDescription>
                    Review team and individual performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="team-performance">
                    <Button className="w-full" variant="outline">Performance Review</Button>
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