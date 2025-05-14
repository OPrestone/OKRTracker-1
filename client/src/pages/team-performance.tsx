import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';
import { useTenantContext } from '@/hooks/use-tenant-context';
import TeamMembersPerformance from '@/components/dashboard/team-members-performance';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  color?: string;
  icon?: string;
}

interface TeamPerformanceData {
  metrics: {
    completionRate: number;
    behindSchedule: number;
    averageProgress: number;
    teamMorale: number;
    atRiskCount: number;
    averageCheckInsPerWeek: number;
    completedObjectives: number;
    onTrackObjectives: number;
    atRiskObjectives: number;
    behindObjectives: number;
    totalObjectives: number;
    completedKeyResults: number;
    totalKeyResults: number;
    overallProgress: number;
  };
  objectives: {
    id: string;
    title: string;
    progress: number;
    status: string;
    owner: {
      id: string;
      name: string;
    };
  }[];
  trendData: {
    date: string;
    progress: number;
  }[];
  memberData: {
    id: string;
    name: string;
    progress: number;
  }[];
  memberCount?: number;
}

const TeamPerformancePage = () => {
  const params = useParams();
  const teamId = params.teamId || '';
  const { currentTenant } = useTenantContext();
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const tenantId = currentTenant?.id;

  const { data: teamData, isLoading, error } = useQuery<Team>({
    queryKey: [`/api/teams/${teamId}`, tenantId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!teamId && !!tenantId,
  });

  const { data: performanceData, isLoading: isLoadingPerformance, error: performanceError } = useQuery<TeamPerformanceData>({
    queryKey: [`/api/teams/${teamId}/performance`, tenantId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!teamId && !!tenantId,
  });

  if (isLoading || isLoadingPerformance) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || performanceError) {
    return (
      <DashboardLayout>
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load team performance data. Please try again later.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  if (!teamData || !performanceData) {
    return (
      <DashboardLayout>
        <Alert className="mb-6">
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>
            No performance data available for this team.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  // Prepare chart data
  const objectivesData = [
    { name: 'Completed', value: performanceData.metrics.completedObjectives, color: '#16a34a' },
    { name: 'On Track', value: performanceData.metrics.onTrackObjectives, color: '#2563eb' },
    { name: 'At Risk', value: performanceData.metrics.atRiskObjectives, color: '#eab308' },
    { name: 'Behind', value: performanceData.metrics.behindObjectives, color: '#dc2626' },
  ].filter(item => item.value > 0);

  const keyResultsData = [
    { name: 'Completed', value: performanceData.metrics.completedKeyResults, color: '#16a34a' },
    { name: 'In Progress', value: performanceData.metrics.totalKeyResults - performanceData.metrics.completedKeyResults, color: '#2563eb' },
  ].filter(item => item.value > 0);

  // Bar chart data for objectives progress over time (example data)
  const progressData = performanceData.objectives.map((obj: any) => ({
    name: obj.title.slice(0, 20) + (obj.title.length > 20 ? '...' : ''),
    progress: obj.progress,
    status: obj.status,
  })).slice(0, 10); // Limit to 10 objectives for readability

  return (
    <DashboardLayout>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{teamData.name} Performance</h1>
          <p className="text-muted-foreground">{teamData.description}</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.memberCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.metrics.overallProgress}%</div>
                <Progress value={performanceData.metrics.overallProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.metrics.totalObjectives}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {performanceData.metrics.completedObjectives} completed
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Key Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceData.metrics.totalKeyResults}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {performanceData.metrics.completedKeyResults} completed
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Objectives by Status</CardTitle>
                <CardDescription>
                  Distribution of objectives by their current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {objectivesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={objectivesData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {objectivesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Objectives`, '']}/> 
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No objectives data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Results Progress</CardTitle>
                <CardDescription>
                  Completion status of key results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {keyResultsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={keyResultsData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {keyResultsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} Key Results`, '']}/> 
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No key results data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Objectives Progress</CardTitle>
              <CardDescription>
                Progress percentage for top 10 objectives
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {progressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={progressData}
                      layout="vertical"
                      margin={{
                        top: 20,
                        right: 30,
                        left: 100,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                      <Legend />
                      <Bar 
                        dataKey="progress" 
                        name="Progress" 
                        fill="#3b82f6"
                        radius={[0, 4, 4, 0]}
                      >
                        {progressData.map((entry: { progress: number; name: string; status?: string }, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.status === 'on-track' ? '#16a34a' : 
                              entry.status === 'at-risk' ? '#eab308' : 
                              entry.status === 'behind' ? '#dc2626' : '#3b82f6'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No objectives data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <TeamMembersPerformance teamId={teamId} />
        </TabsContent>

        <TabsContent value="objectives">
          <Card>
            <CardHeader>
              <CardTitle>Team Objectives</CardTitle>
              <CardDescription>
                All objectives for this team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.objectives && performanceData.objectives.length > 0 ? (
                  performanceData.objectives.map((objective: any) => (
                    <div key={objective.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{objective.title}</h3>
                        <div className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                          {objective.progress}% Complete
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{objective.description}</p>
                      <Progress value={objective.progress} className="h-2 mb-4" />
                      
                      {objective.keyResults && objective.keyResults.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Results:</h4>
                          <ul className="space-y-2">
                            {objective.keyResults.map((kr: any) => (
                              <li key={kr.id} className="text-sm">
                                <div className="flex items-center justify-between">
                                  <span>{kr.title}</span>
                                  <span className="text-xs font-medium">{kr.progress}%</span>
                                </div>
                                <Progress value={kr.progress} className="h-1 mt-1" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-muted-foreground">No objectives available for this team</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default TeamPerformancePage;