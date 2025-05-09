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
import { Target, CheckCircle, AlertCircle, Users, BarChart3, FileBarChart, Calendar } from "lucide-react";
import DashboardLayout from "@/layouts/dashboard-layout";

export default function Dashboards() {
  // Fetch dashboard summary data
  const { data: dashboardData = { objectives: {} } } = useQuery({
    queryKey: ['/api/dashboard'],
  }) as { data: any };

  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams'],
  }) as { data: any[] };

  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives'],
  }) as { data: any[] };

  // Extract stats from dashboard data
  const stats = {
    totalObjectives: dashboardData?.objectives?.total || 35,
    completedObjectives: dashboardData?.objectives?.completed || 21,
    atRiskObjectives: dashboardData?.objectives?.atRisk || 4,
    teamProgress: dashboardData?.teamProgress || 78,
    upcomingCheckins: dashboardData?.upcomingCheckins || 8,
  };
  
  // Prepare chart data
  const dummyChartData = [
    { name: 'Jan', value: 12 },
    { name: 'Feb', value: 19 },
    { name: 'Mar', value: 15 },
    { name: 'Apr', value: 27 },
    { name: 'May', value: 22 },
    { name: 'Jun', value: 30 },
    { name: 'Jul', value: 25 },
  ];
  
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

  // Prepare data for bar chart
  const prepareBarData = () => {
    if (!teamsData || !Array.isArray(teamsData)) return [];
    
    return teamsData.map((team: any) => ({
      name: team.name,
      performance: team.performance || 0
    }));
  };

  const pieData = preparePieData();
  const barData = prepareBarData();

  // Wrap the dashboard content with the sidebar layout
  return (
    <DashboardLayout title="Dashboard" subtitle="Manage your objectives and key results">
      <div className="w-full">
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
