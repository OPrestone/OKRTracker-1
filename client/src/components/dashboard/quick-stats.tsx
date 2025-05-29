import { useQuery } from "@tanstack/react-query";
import { Users, CircleCheckBig, Clock, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useMemo } from "react";

// Static chart data to prevent reloading
const CHART_DATA = {
  objectives: [
    { name: 'Jan', value: 45 },
    { name: 'Feb', value: 52 },
    { name: 'Mar', value: 48 },
    { name: 'Apr', value: 58 },
    { name: 'May', value: 62 },
    { name: 'Jun', value: 55 },
    { name: 'Jul', value: 67 },
    { name: 'Aug', value: 73 },
    { name: 'Sep', value: 68 },
    { name: 'Oct', value: 75 },
    { name: 'Nov', value: 78 },
    { name: 'Dec', value: 82 }
  ],
  performance: [
    { name: 'Jan', value: 35 },
    { name: 'Feb', value: 42 },
    { name: 'Mar', value: 38 },
    { name: 'Apr', value: 48 },
    { name: 'May', value: 52 },
    { name: 'Jun', value: 45 },
    { name: 'Jul', value: 57 },
    { name: 'Aug', value: 63 },
    { name: 'Sep', value: 58 },
    { name: 'Oct', value: 65 },
    { name: 'Nov', value: 68 },
    { name: 'Dec', value: 72 }
  ],
  keyResults: [
    { name: 'Jan', value: 25 },
    { name: 'Feb', value: 32 },
    { name: 'Mar', value: 28 },
    { name: 'Apr', value: 38 },
    { name: 'May', value: 42 },
    { name: 'Jun', value: 35 },
    { name: 'Jul', value: 47 },
    { name: 'Aug', value: 53 },
    { name: 'Sep', value: 48 },
    { name: 'Oct', value: 55 },
    { name: 'Nov', value: 58 },
    { name: 'Dec', value: 62 }
  ],
  time: [
    { name: 'Jan', value: 85 },
    { name: 'Feb', value: 82 },
    { name: 'Mar', value: 78 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 72 },
    { name: 'Jun', value: 68 },
    { name: 'Jul', value: 65 },
    { name: 'Aug', value: 62 },
    { name: 'Sep', value: 58 },
    { name: 'Oct', value: 55 },
    { name: 'Nov', value: 52 },
    { name: 'Dec', value: 48 }
  ]
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  chartColor: string;
  chartData: Array<{ name: string; value: number }>;
}

function StatCard({ title, value, icon, iconColor, chartColor, chartData }: StatCardProps) {

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

interface DashboardData {
  objectives: {
    total: number;
    completed: number;
    inProgress: number;
    progress: number;
  };
  teamPerformance: {
    average: number;
    improvement: number;
  };
  keyResults: {
    total: number;
    completed: number;
    completionRate: number;
  };
  timeRemaining: {
    days: number;
    percentage: number;
  };
}

export function QuickStats() {
  const { currentTenant } = useTenantContext();
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard-stats', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 border border-neutral-100">
            <div className="flex items-center">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="ml-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
            <div className="mt-3">
              <Skeleton className="h-1.5 w-full rounded-full mt-2" />
              <Skeleton className="h-3 w-36 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 mb-8">Error loading dashboard data</div>;
  }

  // Provide default data structure if API is unavailable
  const defaultData: DashboardData = {
    objectives: {
      total: 6,
      completed: 2,
      inProgress: 4,
      progress: 33
    },
    teamPerformance: {
      average: 10,
      improvement: 2
    },
    keyResults: {
      total: 22,
      completed: 1,
      completionRate: 4.5
    },
    timeRemaining: {
      days: 216,
      percentage: 60
    }
  };

  const displayData = data || defaultData;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Objectives"
        value={`${displayData.objectives.total}`}
        icon={<Target className="h-6 w-6" />}
        iconColor="text-primary-600"
        chartColor="#3b82f6"
        chartData={CHART_DATA.objectives}
      />
      
      <StatCard
        title="Team Performance"
        value={`${Math.round(displayData.teamPerformance.average)}%`}
        icon={<Users className="h-6 w-6" />}
        iconColor="text-accent-500"
        chartColor="#8b5cf6"
        chartData={CHART_DATA.performance}
      />
      
      <StatCard
        title="Completed Key Results"
        value={`${displayData.keyResults.completed}/${displayData.keyResults.total}`}
        icon={<CircleCheckBig className="h-6 w-6" />}
        iconColor="text-green-600"
        chartColor="#22c55e"
        chartData={CHART_DATA.keyResults}
      />
      
      <StatCard
        title="Time Remaining"
        value={`${displayData.timeRemaining.days} days`}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-amber-600"
        chartColor="#f59e0b"
        chartData={CHART_DATA.time}
      />
    </div>
  );
}
