import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  BadgeCheck
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

const MOCK_PERFORMANCE_DATA: TeamOKRPerformance[] = [
  {
    id: "1",
    team: "Product Team",
    objective: "Improve product conversion rate",
    target: "25% increase in conversions",
    progress: 78,
    changePercent: 5.2,
    status: 'on-track',
  },
  {
    id: "2",
    team: "Marketing Team",
    objective: "Increase social media engagement",
    target: "40% more interactions per post",
    progress: 65,
    changePercent: 3.7,
    status: 'on-track',
  },
  {
    id: "3",
    team: "Development Team",
    objective: "Reduce application load time",
    target: "50% decrease in page load time",
    progress: 92,
    changePercent: 8.1,
    status: 'on-track',
  },
  {
    id: "4",
    team: "Customer Support",
    objective: "Improve customer satisfaction score",
    target: "Increase CSAT to 4.8/5",
    progress: 42,
    changePercent: -2.3,
    status: 'at-risk',
  },
  {
    id: "5",
    team: "Sales Team",
    objective: "Increase new client acquisition rate",
    target: "30% more new clients per quarter",
    progress: 35,
    changePercent: -4.1,
    status: 'behind',
  },
  {
    id: "6",
    team: "Finance Team",
    objective: "Reduce operational expenses",
    target: "15% reduction in non-essential expenses",
    progress: 81,
    changePercent: 6.3,
    status: 'on-track',
  },
  {
    id: "7",
    team: "HR Team",
    objective: "Improve employee satisfaction",
    target: "20% increase in satisfaction surveys",
    progress: 58,
    changePercent: 0,
    status: 'on-track',
  },
  {
    id: "8",
    team: "IT Support",
    objective: "Decrease ticket resolution time",
    target: "40% faster resolution times",
    progress: 29,
    changePercent: -5.8,
    status: 'behind',
  }
];

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
    description: "Average completion rate across all teams",
    icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
    change: "+4.2%",
    trend: "up"
  },
  {
    title: "OKRs On Track",
    value: "62.5%",
    description: "Percentage of OKRs on track to completion",
    icon: <Check className="h-5 w-5 text-green-600" />,
    change: "+2.5%",
    trend: "up"
  },
  {
    title: "Teams at Risk",
    value: "2",
    description: "Teams with at-risk or behind objectives",
    icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    change: "-1",
    trend: "down" 
  },
  {
    title: "Objectives Completed",
    value: "12",
    description: "Total number of completed objectives",
    icon: <BadgeCheck className="h-5 w-5 text-indigo-600" />,
    change: "+3",
    trend: "up"
  }
];

export function TeamsOKRPerformance() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeTableTab, setActiveTableTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  
  // Filter data based on active tab and search query
  const filteredData = MOCK_PERFORMANCE_DATA.filter(item => {
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
  const uniqueTeams = Array.from(new Set(MOCK_PERFORMANCE_DATA.map(item => item.team)));
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
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                        <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                      </div>
                      <div className="bg-gray-100 p-2 rounded-full">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`text-xs font-medium ${
                        stat.trend === 'up' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {stat.trend === 'up' ? '↑' : '↓'} {stat.change} {stat.trend === 'up' ? 'increase' : 'decrease'}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">since last month</span>
                    </div>
                  </CardContent>
                </Card>
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
                      <option value="all">All Teams</option>
                      {teamOptions.filter(team => team !== 'all').map((team, i) => (
                        <option key={i} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative w-full md:w-auto">
                    <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Search teams or objectives..." 
                      className="pl-8 h-9 w-full md:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </Button>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Team</TableHead>
                      <TableHead className="w-[300px]">Objective</TableHead>
                      <TableHead className="w-[200px]">Target</TableHead>
                      <TableHead className="w-[140px]">Progress</TableHead>
                      <TableHead className="w-[100px]">Change</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No matching team performance data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              {item.team}
                            </div>
                          </TableCell>
                          <TableCell>{item.objective}</TableCell>
                          <TableCell>{item.target}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{item.progress}%</span>
                              </div>
                              <Progress 
                                value={item.progress} 
                                className="h-2"
                                style={{ backgroundColor: '#e5e7eb' }}
                              >
                                <div 
                                  className={`h-full ${getProgressColor(item.progress)}`} 
                                  style={{ width: `${item.progress}%` }} 
                                />
                              </Progress>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getChangeIcon(item.changePercent)}
                              <span className={`ml-1 ${
                                item.changePercent > 0 
                                  ? 'text-green-600' 
                                  : item.changePercent < 0 
                                    ? 'text-red-600' 
                                    : 'text-gray-600'
                              }`}>
                                {Math.abs(item.changePercent)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {getStatusIcon(item.status)}
                              <span className="ml-1 text-sm">{getStatusText(item.status)}</span>
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
          
          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Performance by Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Performance by Key Metrics</CardTitle>
                  <CardDescription>Comparison of key performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={[
                          { category: 'Quality', Product: 95, Marketing: 85, Development: 90, Support: 70, Sales: 65 },
                          { category: 'Timeliness', Product: 70, Marketing: 80, Development: 85, Support: 65, Sales: 60 },
                          { category: 'Efficiency', Product: 85, Marketing: 75, Development: 95, Support: 60, Sales: 55 },
                          { category: 'Innovation', Product: 90, Marketing: 70, Development: 85, Support: 50, Sales: 45 },
                          { category: 'Collaboration', Product: 75, Marketing: 90, Development: 80, Support: 75, Sales: 60 }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Product" name="Product Team" fill="#8884d8" />
                        <Bar dataKey="Marketing" name="Marketing Team" fill="#82ca9d" />
                        <Bar dataKey="Development" name="Development Team" fill="#ffc658" />
                        <Bar dataKey="Support" name="Support Team" fill="#ff8042" />
                        <Bar dataKey="Sales" name="Sales Team" fill="#0088FE" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* OKR Completion Forecast */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">OKR Completion Forecast</CardTitle>
                  <CardDescription>Projected completion rates based on current progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan', actual: 10, projected: 12 },
                          { month: 'Feb', actual: 18, projected: 24 },
                          { month: 'Mar', actual: 30, projected: 36 },
                          { month: 'Apr', actual: 42, projected: 48 },
                          { month: 'May', actual: 50, projected: 60 },
                          { month: 'Jun', actual: 60, projected: 72 },
                          { month: 'Jul', actual: 67, projected: 84 },
                          { month: 'Aug', actual: null, projected: 96 },
                          { month: 'Sep', actual: null, projected: 100 }
                        ]}
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
      </CardContent>
    </Card>
  );
}