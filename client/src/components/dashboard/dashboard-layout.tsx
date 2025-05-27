import { ReactNode, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard, MiniStatsCard } from "@/components/dashboard/stats-card";
import { MiniChart, MiniSparkline, GaugeChart } from "@/components/dashboard/mini-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, Users, CheckCircle, AlertCircle, FileBarChart, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/hooks/use-tenant-context";
import ObjectivesProgressChart from "@/components/dashboard/objectives-progress-chart";
import UpcomingCheckIns from "@/components/dashboard/upcoming-checkins";

interface DashboardLayoutProps {
  children?: ReactNode;
  overviewStats?: {
    totalObjectives: number;
    completedObjectives: number;
    atRiskObjectives: number;
    teamProgress: number;
    upcomingCheckins: number;
  };
}

export function DashboardLayout({ children, overviewStats }: DashboardLayoutProps) {
  const { currentTenant } = useTenantContext();
  const tenantId = currentTenant?.id;
  const queryClient = useQueryClient();
  
  // Auto-refresh dashboard data every 3 seconds
  useEffect(() => {
    if (!tenantId) return;
    
    const interval = setInterval(() => {
      // Invalidate all dashboard-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/my-objectives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams-performance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams'] });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
    }, 3000); // 3 seconds
    
    return () => clearInterval(interval);
  }, [tenantId, queryClient]);
  
  // Fetch all objectives for this tenant to calculate real stats
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/my-objectives', tenantId],
    enabled: !!tenantId
  });
  
  // Fetch tenant-specific teams data
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams-performance', tenantId],
    enabled: !!tenantId
  }) as { data: any[] };
  
  // Calculate real stats from objectives data
  const stats = objectivesData.length > 0 ? {
    totalObjectives: objectivesData.length,
    completedObjectives: objectivesData.filter((obj: any) => obj.progress === 100).length,
    atRiskObjectives: objectivesData.filter((obj: any) => obj.progress >= 40 && obj.progress < 70).length,
    teamProgress: Math.floor(objectivesData.reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0) / objectivesData.length) || 0,
    upcomingCheckins: 0
  } : (overviewStats || {
    totalObjectives: 0,
    completedObjectives: 0,
    atRiskObjectives: 0,
    teamProgress: 0,
    upcomingCheckins: 0
  });
  
  // Generate chart data based on objectives counts
  const objectivesChartData = [
    { name: 'Total', value: stats.totalObjectives },
    { name: 'Completed', value: stats.completedObjectives },
    { name: 'In Progress', value: stats.atRiskObjectives }
  ];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="relative w-64">
          <Input
            placeholder="Search..."
            className="pr-8 h-9 border-slate-200"
          />
          <div className="absolute right-2.5 top-2.5 text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </div>
        </div>
      </div>
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatsCard
              title="Total Objectives"
              value={stats.totalObjectives}
              icon={<Target className="h-5 w-5 text-indigo-500" />}
              chart={
                <MiniSparkline 
                  data={objectivesChartData}
                  dataKey="value"
                  color="#6366f1"
                  height={40}
                />
              }
            />
            
            <StatsCard
              title="Team Progress"
              value={`${stats.teamProgress}%`}
              progressBar
              progressValue={stats.teamProgress}
              trendLabel={`${stats.teamProgress}% complete`}
              icon={<FileBarChart className="h-5 w-5 text-indigo-500" />}
            />
            
            <StatsCard
              title="Completed Objectives"
              value={stats.completedObjectives}
              icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
              chart={
                <MiniSparkline 
                  data={objectivesChartData}
                  dataKey="value"
                  color="#10b981"
                  height={40}
                />
              }
            />
            
            <StatsCard
              title="At Risk Objectives"
              value={stats.atRiskObjectives}
              icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
              chart={
                <MiniSparkline 
                  data={objectivesChartData}
                  dataKey="value"
                  color="#ef4444"
                  height={40}
                />
              }
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="col-span-2">
              <ObjectivesProgressChart />
            </div>
            
            <div className="space-y-5">
              <UpcomingCheckIns />
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">Team Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <GaugeChart value={Math.round(stats.teamProgress)} color="#6366f1" />
                  <div className="flex justify-between mt-2 text-sm">
                    <div className="text-slate-500">Current Progress</div>
                    <div className="font-medium text-emerald-600">{Math.floor(stats.teamProgress)}%</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {teamsData && teamsData.length > 0 ? (
              // Display real team data
              teamsData.map((team, index) => (
                <MiniStatsCard
                  key={team.id}
                  title={team.name || `Team ${index + 1}`}
                  value={`${Math.floor(team.progress || 0)}%`}
                  trend={team.memberCount || 0}
                  trendLabel={team.memberCount ? `${team.memberCount} members` : undefined}
                  icon={<Users className="h-4 w-4 text-indigo-500" />}
                />
              ))
            ) : (
              // Add a placeholder if no teams found
              <div className="col-span-full flex flex-col items-center p-4 text-slate-500">
                <Users className="h-10 w-10 text-slate-300 mb-3" />
                <p>No teams found</p>
                <Button variant="outline" size="sm" className="mt-2">Add Team</Button>
              </div>
            )}
          </div> 
      
      {children}
    </div>
  );
}