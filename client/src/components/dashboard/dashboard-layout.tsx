import { ReactNode, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsCard, MiniStatsCard } from "@/components/dashboard/stats-card";
import { MiniChart, MiniSparkline, GaugeChart } from "@/components/dashboard/mini-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Target, Users, CheckCircle, AlertCircle, FileBarChart, Calendar, CircleCheckBig, Clock } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useRealTimeSync } from "@/hooks/use-real-time-sync";
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
  
  // Use real-time sync for instant updates
  useRealTimeSync();
  
  // Auto-refresh for dashboard data with reasonable intervals
  useEffect(() => {
    if (!tenantId) return;
    
    const interval = setInterval(() => {
      // Invalidate only essential queries to reduce server load
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
    }, 30000); // Reduced frequency to 30 seconds to avoid overwhelming the server
    
    return () => clearInterval(interval);
  }, [tenantId, queryClient]);
  
  // Fetch real-time dashboard stats from database
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard-stats', tenantId],
    enabled: !!tenantId,
    refetchInterval: 2000, // Refetch every 2 seconds for real-time updates
    staleTime: 0, // Always consider stale to force fresh data
    gcTime: 0, // Don't cache the data
  });

  // Fetch all objectives for this tenant
  const { data: objectivesData = [] } = useQuery({
    queryKey: ['/api/objectives', tenantId],
    enabled: !!tenantId
  });
  
  // Fetch tenant-specific teams data
  const { data: teamsData = [] } = useQuery({
    queryKey: ['/api/teams-performance', tenantId],
    enabled: !!tenantId
  }) as { data: any[] };

  // Fetch check-ins data for real-time updates
  const { data: checkInsData = [] } = useQuery({
    queryKey: ['/api/check-ins', tenantId],
    enabled: !!tenantId
  });
  
  // Calculate real-time stats from authentic database data
  // Use the dashboard-stats API when available, otherwise calculate from real objectives data
  const stats = dashboardStats ? {
    totalObjectives: dashboardStats.objectives?.total || 0,
    completedObjectives: dashboardStats.objectives?.completed || 0,
    atRiskObjectives: dashboardStats.objectives?.inProgress || 0,
    teamProgress: dashboardStats.teamPerformance?.average || 0,
    upcomingCheckins: dashboardStats.keyResults?.total || 0
  } : {
    totalObjectives: (objectivesData as any[]).length,
    completedObjectives: (objectivesData as any[]).filter((obj: any) => obj.progress >= 100).length,
    atRiskObjectives: (objectivesData as any[]).filter((obj: any) => obj.progress >= 0 && obj.progress < 70).length,
    teamProgress: (objectivesData as any[]).length > 0 
      ? Math.floor((objectivesData as any[]).reduce((sum: number, obj: any) => sum + (obj.progress || 0), 0) / (objectivesData as any[]).length) 
      : 0,
    upcomingCheckins: (checkInsData as any[]).length
  };
  
  // Generate stable chart data for area charts using useMemo
  const chartData = useMemo(() => {
    return Array(12).fill(0).map((_, i) => ({
      name: `Point ${i + 1}`,
      value: 50 + (i * 3) + (i % 3 === 0 ? 5 : i % 3 === 1 ? -2 : 3) // Stable trending pattern
    }));
  }, []); // Empty dependency array means this only runs once

  // Home page style StatCard component
  function StatCard({ title, value, icon, iconColor, chartColor }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    iconColor: string;
    chartColor: string;
  }) {

    return (
      <div className="bg-white rounded-lg shadow-sm pt-5 border border-slate-100 content-end flex flex-col">
        <div className="flex justify-between mb-1 px-5">
          <div className="text-sm font-medium text-neutral-500">{title}</div>
          <div className={`w-6 h-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        <div className="flex flex-col mb-2 px-5 grow">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
        </div>
        <div className="mt-1">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={chartData}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill={`${chartColor}20`}
                strokeWidth={2}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

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
 
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Objectives"
              value={`${stats.totalObjectives}`}
              icon={<Target className="h-6 w-6" />}
              iconColor="text-primary-600"
              chartColor="#3b82f6"
            />
            
            <StatCard
              title="Team Progress"
              value={`${Math.round(stats.teamProgress)}%`}
              icon={<Users className="h-6 w-6" />}
              iconColor="text-accent-500"
              chartColor="#8b5cf6"
            />
            
            <StatCard
              title="Completed Objectives"
              value={`${stats.completedObjectives}`}
              icon={<CircleCheckBig className="h-6 w-6" />}
              iconColor="text-green-600"
              chartColor="#22c55e"
            />
            
            <StatCard
              title="At Risk Objectives"
              value={`${stats.atRiskObjectives}`}
              icon={<Clock className="h-6 w-6" />}
              iconColor="text-amber-600"
              chartColor="#f59e0b"
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