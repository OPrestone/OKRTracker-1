import { useQuery } from "@tanstack/react-query";
import { Users, CircleCheckBig, Clock, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Generate sample chart data for area charts
const generateChartData = () => {
  return Array(12).fill(0).map((_, i) => ({
    name: `Point ${i + 1}`,
    value: 50 + Math.random() * 30 + (i * 2) // Trending upward with some variance
  }));
};

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconColor: string;
  chartColor: string;
}

function StatCard({ title, value, icon, iconColor, chartColor }: StatCardProps) {
  const chartData = generateChartData();

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
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
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

  if (!data) {
    return <div className="text-gray-500 mb-8">No data available</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="Total Objectives"
        value={`${data.objectives.total}`}
        icon={<Target className="h-6 w-6" />}
        iconColor="text-primary-600"
        chartColor="#3b82f6"
      />
      
      <StatCard
        title="Team Performance"
        value={`${Math.round(data.teamPerformance.average)}%`}
        icon={<Users className="h-6 w-6" />}
        iconColor="text-accent-500"
        chartColor="#8b5cf6"
      />
      
      <StatCard
        title="Completed Key Results"
        value={`${data.keyResults.completed}/${data.keyResults.total}`}
        icon={<CircleCheckBig className="h-6 w-6" />}
        iconColor="text-green-600"
        chartColor="#22c55e"
      />
      
      <StatCard
        title="Time Remaining"
        value={`${data.timeRemaining.days} days`}
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-amber-600"
        chartColor="#f59e0b"
      />
    </div>
  );
}
