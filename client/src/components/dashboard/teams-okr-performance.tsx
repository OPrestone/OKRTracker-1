import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCard, MiniStatsCard } from "@/components/dashboard/stats-card";
import { MiniChart, MiniSparkline, GaugeChart } from "@/components/dashboard/mini-chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus,
  Check,
  AlertTriangle,
  XCircle,
  PieChart,
  BarChart,
  Calendar,
  Clock,
  Target,
  Activity,
  TrendingUp,
  BadgeCheck,
  Loader2
} from "lucide-react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

interface TeamOKRPerformance {
  id: string;
  team: string;
  objective: string;
  target: string;
  progress: number;
  changePercent: number;
  status: 'on-track' | 'at-risk' | 'behind';
}

// Color functions for visual elements
const getProgressColor = (progress: number) => {
  if (progress >= 70) return 'bg-green-500';
  if (progress >= 40) return 'bg-amber-500';
  return 'bg-red-500';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'on-track':
      return <Check className="h-5 w-5 text-green-500" />;
    case 'at-risk':
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case 'behind':
      return <XCircle className="h-5 w-5 text-red-500" />;
    default:
      return null;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'on-track':
      return 'On Track';
    case 'at-risk':
      return 'At Risk';
    case 'behind':
      return 'Behind';
    default:
      return '';
  }
};

const getChangeIcon = (change: number) => {
  if (change > 0) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
  if (change < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

// Mock data for detailed analytics
const teamTrendData = [
  { name: 'Jan', Product: 30, Marketing: 40, Development: 45, Support: 25, Sales: 20 },
  { name: 'Feb', Product: 35, Marketing: 45, Development: 50, Support: 30, Sales: 25 },
  { name: 'Mar', Product: 45, Marketing: 50, Development: 55, Support: 35, Sales: 30 },
  { name: 'Apr', Product: 50, Marketing: 55, Development: 65, Support: 30, Sales: 28 },
  { name: 'May', Product: 55, Marketing: 60, Development: 70, Support: 35, Sales: 32 },
  { name: 'Jun', Product: 65, Marketing: 65, Development: 75, Support: 40, Sales: 35 },
  { name: 'Jul', Product: 70, Marketing: 70, Development: 80, Support: 45, Sales: 38 },
  { name: 'Aug', Product: 78, Marketing: 65, Development: 92, Support: 42, Sales: 35 },
];

const statusDistributionData = [
  { name: 'On Track', value: 5, color: '#22c55e' },
  { name: 'At Risk', value: 1, color: '#f59e0b' },
  { name: 'Behind', value: 2, color: '#ef4444' },
];

const teamCompletionData = [
  { name: 'Product Team', objectives: 3, completed: 2, progress: 78 },
  { name: 'Marketing Team', objectives: 4, completed: 2, progress: 65 },
  { name: 'Development Team', objectives: 5, completed: 4, progress: 92 },
  { name: 'Customer Support', objectives: 3, completed: 1, progress: 42 },
  { name: 'Sales Team', objectives: 4, completed: 1, progress: 35 },
  { name: 'Finance Team', objectives: 2, completed: 1, progress: 81 },
  { name: 'HR Team', objectives: 3, completed: 1, progress: 58 },
  { name: 'IT Support', objectives: 3, completed: 0, progress: 29 },
];

const teamSummaryStats = [
  {
    title: "Overall Progress",
    value: "67%",
    subtitle: "Average completion rate across all teams",
    icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
    trend: 4.2,
    chartData: [
      { name: 'Mar', value: 52 },
      { name: 'Apr', value: 58 },
      { name: 'May', value: 63 },
      { name: 'Jun', value: 67 },
    ]
  },
  {
    title: "OKRs On Track",
    value: "62.5%",
    subtitle: "Percentage of OKRs on track to completion",
    icon: <Check className="h-5 w-5 text-emerald-500" />,
    trend: 2.5,
    chartData: [
      { name: 'Mar', value: 56 },
      { name: 'Apr', value: 58 },
      { name: 'May', value: 60 },
      { name: 'Jun', value: 62.5 },
    ]
  },
  {
    title: "Teams at Risk",
    value: "2",
    subtitle: "Teams with at-risk or behind objectives",
    icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    trend: -1,
    chartData: [
      { name: 'Mar', value: 3 },
      { name: 'Apr', value: 4 },
      { name: 'May', value: 3 },
      { name: 'Jun', value: 2 },
    ]
  },
  {
    title: "Objectives Completed",
    value: "12",
    subtitle: "Total number of completed objectives",
    icon: <BadgeCheck className="h-5 w-5 text-indigo-500" />,
    trend: 3,
    chartData: [
      { name: 'Mar', value: 7 },
      { name: 'Apr', value: 9 },
      { name: 'May', value: 10 },
      { name: 'Jun', value: 12 },
    ]
  }
];

export function TeamsOKRPerformance() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTableTab, setActiveTableTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  
  // Fetch real data from API
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['/api/dashboard'],
  }) as { data: any, isLoading: boolean };
  
  const { data: objectives, isLoading: isObjectivesLoading } = useQuery({
    queryKey: ['/api/objectives'],
  }) as { data: any[], isLoading: boolean };
  
  const { data: teams, isLoading: isTeamsLoading } = useQuery({
    queryKey: ['/api/teams'],
  }) as { data: any[], isLoading: boolean };
  
  const isLoading = isDashboardLoading || isObjectivesLoading || isTeamsLoading;
  
  // Convert the fetched data to the format needed for the table
  const generatePerformanceData = () => {
    if (!objectives || !teams) return [];
    
    return objectives.map(obj => {
      // Find the team for this objective
      const team = teams.find(t => t.id === obj.teamId);
      
      // Determine status based on progress
      let status: 'on-track' | 'at-risk' | 'behind' = 'behind';
      if (obj.progress >= 70) status = 'on-track';
      else if (obj.progress >= 40) status = 'at-risk';
      
      return {
        id: obj.id,
        team: team?.name || 'Unassigned',
        objective: obj.title,
        target: obj.description || 'No target specified',
        progress: obj.progress || 0,
        changePercent: 0, // We don't have historical data yet
        status: status
      };
    });
  };
  
  const realPerformanceData = generatePerformanceData();
  
  // Filter data based on active tab and search query
  const filteredData = realPerformanceData.filter(item => {
    const matchesTab = 
      activeTableTab === 'all' || 
      (activeTableTab === 'on-track' && item.status === 'on-track') ||
      (activeTableTab === 'at-risk' && item.status === 'at-risk') ||
      (activeTableTab === 'behind' && item.status === 'behind');
    
    const matchesTeam = 
      selectedTeamFilter === 'all' ||
      item.team === selectedTeamFilter;
    
    const matchesSearch = 
      searchQuery === '' ||
      item.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.target.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesTeam && matchesSearch;
  });

  // Extract unique team names for the filter dropdown
  const uniqueTeams = teams ? Array.from(new Set(teams.map(team => team.name))) : [];
  const teamOptions = ['all', ...uniqueTeams];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Team OKR Performance</CardTitle>
        <CardDescription>
          Detailed metrics and analytics for all teams
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-60">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-gray-500">Loading team performance data...</p>
          </div>
        ) : realPerformanceData.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-2">No objectives found</p>
            <p className="text-sm text-gray-400">Create objectives for teams to track progress</p>
          </div>
        ) : (
          <Tabs 
            defaultValue="dashboard" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="analytics">Detailed Analytics</TabsTrigger>
            </TabsList>
            
            {/* Dashboard Tab Content */}
            <TabsContent value="dashboard" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {teamSummaryStats.map((stat, index) => (
                  <StatsCard
                    key={index}
                    title={stat.title}
                    value={stat.value}
                    subtitle={stat.subtitle}
                    icon={stat.icon}
                    trend={stat.trend}
                    chart={
                      <MiniChart
                        data={stat.chartData}
                        dataKey="value"
                        type="area"
                        color={
                          stat.title.includes("Risk") 
                            ? "#f59e0b" 
                            : stat.title.includes("Track") 
                              ? "#10b981" 
                              : "#6366f1"
                        }
                        height={40}
                      />
                    }
                  />
                ))}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Team Progress Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Team Progress Trends</CardTitle>
                    <CardDescription>Monthly progress for each team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={teamTrendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="Product" stroke="#8884d8" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="Marketing" stroke="#82ca9d" />
                          <Line type="monotone" dataKey="Development" stroke="#ffc658" />
                          <Line type="monotone" dataKey="Support" stroke="#ff8042" />
                          <Line type="monotone" dataKey="Sales" stroke="#0088FE" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* OKR Status Distribution */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">OKR Status Distribution</CardTitle>
                    <CardDescription>Current status of all objectives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={statusDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [`${value} objectives`, name]} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Team Completion Rates */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Team Completion Rates</CardTitle>
                  <CardDescription>Objectives completed by each team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={teamCompletionData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="objectives" name="Total Objectives" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#82ca9d" />
                        <Bar yAxisId="right" dataKey="progress" name="Progress %" fill="#ffc658" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Table View Tab Content */}
            <TabsContent value="table" className="mt-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <Tabs 
                    defaultValue="all" 
                    value={activeTableTab} 
                    onValueChange={setActiveTableTab}
                    className="w-auto"
                  >
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="on-track">On Track</TabsTrigger>
                      <TabsTrigger value="at-risk">At Risk</TabsTrigger>
                      <TabsTrigger value="behind">Behind</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                    <div className="w-full md:w-auto">
                      <select 
                        className="h-9 rounded-md border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={selectedTeamFilter}
                        onChange={(e) => setSelectedTeamFilter(e.target.value)}
                      >
                        {teamOptions.map((team, index) => (
                          <option key={index} value={team}>
                            {team === 'all' ? 'All Teams' : team}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="relative w-full md:w-auto">
                      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search objectives..."
                        className="w-full pl-8 md:w-[250px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Team</TableHead>
                        <TableHead>Objective</TableHead>
                        <TableHead className="hidden sm:table-cell">Target</TableHead>
                        <TableHead className="w-[100px] text-right">Progress</TableHead>
                        <TableHead className="hidden sm:table-cell w-[100px] text-right">Change</TableHead>
                        <TableHead className="w-[100px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No matching objectives found. Try adjusting your filters.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.team}</TableCell>
                            <TableCell>{item.objective}</TableCell>
                            <TableCell className="hidden sm:table-cell">{item.target}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-sm">{item.progress}%</span>
                                <Progress 
                                  value={item.progress} 
                                  className={`h-2 w-20 ${getProgressColor(item.progress)}`} 
                                />
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-right">
                              <div className="flex items-center justify-end gap-1">
                                {getChangeIcon(item.changePercent)}
                                <span className={`text-sm ${
                                  item.changePercent > 0 
                                    ? 'text-green-500' 
                                    : item.changePercent < 0 
                                      ? 'text-red-500' 
                                      : 'text-gray-500'
                                }`}>
                                  {Math.abs(item.changePercent)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center">
                                {getStatusIcon(item.status)}
                                <span className="ml-1 hidden sm:inline-block">
                                  {getStatusText(item.status)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            {/* Detailed Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Objective Completion Timeline</CardTitle>
                    <CardDescription>Projected vs actual completion rates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={[
                            { month: 'Jan', actual: 10, projected: 12 },
                            { month: 'Feb', actual: 25, projected: 26 },
                            { month: 'Mar', actual: 37, projected: 40 },
                            { month: 'Apr', actual: 45, projected: 55 },
                            { month: 'May', actual: 60, projected: 68 },
                            { month: 'Jun', actual: 67, projected: 80 },
                            { month: 'Jul', actual: 75, projected: 90 },
                            { month: 'Aug', actual: 82, projected: 100 },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="actual" name="Actual Progress" stroke="#8884d8" strokeWidth={2} dot={{ r: 5 }} />
                          <Line type="monotone" dataKey="projected" name="Projected Progress" stroke="#82ca9d" strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}