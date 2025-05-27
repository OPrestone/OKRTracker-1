import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import MyOKRs from "@/components/dashboard/my-okrs";
import { TeamsOKRPerformance } from "@/components/dashboard/teams-okr-performance";
import { IndividualProgress } from "@/components/dashboard/individual-progress";
import { DashboardLayout as DashboardComponentLayout } from "@/components/dashboard/dashboard-layout";
import { StatsCard, MiniStatsCard } from "@/components/dashboard/stats-card";
import { MiniChart, MiniSparkline, GaugeChart } from "@/components/dashboard/mini-chart";
import { Target, CheckCircle, AlertCircle, Users, BarChart3, FileBarChart, Calendar, Building } from "lucide-react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Badge } from "@/components/ui/badge";

export default function Dashboards() {
  const { currentTenant } = useTenantContext();
  const tenantId = currentTenant?.id;

  // Fetch dashboard summary data with tenant ID
  const { data: dashboardData = { objectives: {} } } = useQuery({
    queryKey: ['/api/dashboard', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        return { objectives: {} };
      }
      
      const response = await fetch(`/api/dashboard?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!tenantId
  }) as { data: any };

  // Fetch teams data with tenant ID
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams-performance', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        return [];
      }
      
      const response = await fetch(`/api/teams-performance?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch teams performance data: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!tenantId
  }) as { data: any[] };

  // Fetch objectives data with tenant ID
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        return [];
      }
      
      const response = await fetch(`/api/objectives?tenantId=${tenantId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch objectives data: ${response.statusText}`);
      }
      
      return response.json();
    },
    enabled: !!tenantId
  }) as { data: any[] };

  // Extract stats from dashboard data
  const stats = {
    totalObjectives: dashboardData?.objectives?.total || 0,
    completedObjectives: dashboardData?.objectives?.completed || 0,
    atRiskObjectives: dashboardData?.objectives?.inProgress || 0,
    teamProgress: dashboardData?.teamPerformance?.average || 0,
    upcomingCheckins: dashboardData?.keyResults?.total || 0,
  };
  
  // Prepare data for pie chart
  const preparePieData = () => {
    if (!objectivesData || !Array.isArray(objectivesData)) return [];
    
    const statusCounts = {
      completed: 0,
      inProgress: 0,
      atRisk: 0,
      notStarted: 0
    };
    
    objectivesData.forEach((objective: any) => {
      if (objective.progress === 100) {
        statusCounts.completed++;
      } else if (objective.progress > 70) {
        statusCounts.inProgress++;
      } else if (objective.progress > 30) {
        statusCounts.atRisk++;
      } else {
        statusCounts.notStarted++;
      }
    });
    
    return [
      { name: "Completed", value: statusCounts.completed, color: "#10b981" },
      { name: "In Progress", value: statusCounts.inProgress, color: "#3b82f6" },
      { name: "At Risk", value: statusCounts.atRisk, color: "#f59e0b" },
      { name: "Not Started", value: statusCounts.notStarted, color: "#ef4444" }
    ];
  };

  // Prepare data for bar chart using team performance data
  const prepareBarData = () => {
    if (!teamsData || !Array.isArray(teamsData)) {
      return [];
    }
    
    // Use the progress data directly from the teams-performance endpoint
    const teamPerformance = teamsData.map((team: any) => {
      return {
        name: team.name,
        performance: team.progress || 0
      };
    });
    
    // Sort by performance (descending)
    return teamPerformance.sort((a, b) => b.performance - a.performance);
  };

  const pieData = preparePieData();
  const barData = prepareBarData();

  // Wrap the dashboard content with the sidebar layout
  return (
    <DashboardLayout title="Dashboard" subtitle="Manage your objectives and key results">
      <div className="w-full">
        {/* Organization Context Banner */}
        {currentTenant && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between pt-6">
              <div className="flex items-center mb-4 md:mb-0">
                <Building className="h-10 w-10 text-primary mr-4 p-2 bg-primary/10 rounded-full" />
                <div>
                  <h3 className="text-lg font-semibold">{currentTenant.display_name || currentTenant.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <span>Organization Dashboard</span>
                    <Badge variant="outline" className="ml-2 bg-primary/10 text-primary">
                      {currentTenant.status || 'Active'}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:items-end">
                <div className="mb-1 text-sm font-medium">Organization ID</div>
                <Badge variant="secondary" className="font-mono text-xs py-1">
                  {currentTenant.id}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Modern Dashboard Overview Section */}
        <DashboardComponentLayout overviewStats={stats} />
        
        {/* Legacy Dashboard Sections */}
        <div className="mt-8">
          <Tabs defaultValue="my-okrs" className="mb-8">
            <TabsList className="grid w-full md:w-auto grid-cols-4 md:grid-flow-col md:auto-cols-max gap-2">
              <TabsTrigger value="my-okrs">My OKRs</TabsTrigger>
              <TabsTrigger value="overview">Charts Overview</TabsTrigger>
              <TabsTrigger value="team">Team Performance</TabsTrigger>
              <TabsTrigger value="individual">Individual Progress</TabsTrigger>
            </TabsList>
            
            {/* My OKRs Tab */}
            <TabsContent value="my-okrs" className="pt-4">
              <MyOKRs />
            </TabsContent>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="pt-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Dashboard Charts</h2>
                <Button>Export Report</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Objectives Status Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Objectives Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Team Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={barData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis type="category" dataKey="name" width={80} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Performance']} />
                          <Bar dataKey="performance" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Team Performance Tab */}
            <TabsContent value="team" className="pt-4">
              <TeamsOKRPerformance />
            </TabsContent>
            
            {/* Individual Progress Tab */}
            <TabsContent value="individual" className="pt-4">
              <IndividualProgress />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
