import { useQuery } from "@tanstack/react-query";
import { Zap, Users, CheckCircle, Clock, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MetricsCard } from "@/components/metrics/metrics-card";
import { MiniChart } from "@/components/dashboard/mini-chart";

// Keeping the QuickStatProps interface for backward compatibility
interface QuickStatProps {
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
  title: string;
  value: string;
  progress: number;
  description: string;
}

// Using MetricsCard component with line chart for trend visualization
function QuickStat({ 
  icon, 
  iconColor, 
  bgColor, 
  title, 
  value, 
  progress, 
  description 
}: QuickStatProps) {
  // Generate smooth ascending chart data for the line chart
  const generateChartData = () => {
    // Base value that will be modified to create a trend
    const baseValue = 50;
    // Generate 12 data points representing days or weeks
    return Array(12).fill(0).map((_, i) => {
      // Creating a slight upward trend with some randomness for natural look
      const trend = (i / 11) * 20; // Value increases by ~20% over the series
      const randomFactor = Math.random() * 10 - 5; // Random variance +/- 5%
      return {
        name: `Point ${i+1}`,
        value: baseValue + trend + randomFactor
      };
    });
  };
  
  const chartData = generateChartData();
  
  // Extract trend percentage from description if available
  let trendValue: number | undefined = undefined;
  if (description.includes('increase')) {
    const match = description.match(/(\d+(\.\d+)?)%\s+increase/);
    if (match) trendValue = parseFloat(match[1]);
  } else if (description.includes('decrease')) {
    const match = description.match(/(\d+(\.\d+)?)%\s+decrease/);
    if (match) trendValue = -parseFloat(match[1]);
  }
  
  // Derive chart color based on the icon color class
  let chartColor = "#818cf8"; // Default color (indigo)
  if (iconColor.includes("primary")) {
    chartColor = "#3b82f6"; // Blue for primary
  } else if (iconColor.includes("accent")) {
    chartColor = "#8b5cf6"; // Purple for accent
  } else if (iconColor.includes("green")) {
    chartColor = "#22c55e"; // Green
  } else if (iconColor.includes("amber")) {
    chartColor = "#f59e0b"; // Amber
  } else if (iconColor.includes("rose")) {
    chartColor = "#f43f5e"; // Rose/red
  }
  
  return (
    <MetricsCard
      icon={icon}
      iconColor={iconColor}
      title={title}
      value={value}
      trend={trendValue}
      chart={
        <MiniChart
          data={chartData}
          dataKey="value"
          type="line"
          color={chartColor}
          height={40}
          showGrid={false}
          showTooltip={false}
          showAxis={false}
        />
      }
    />
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
      <QuickStat
        icon={<Target className="h-6 w-6" />}
        iconColor="text-primary-600"
        bgColor="bg-primary-100"
        title="Total Objectives"
        value={`${data.objectives.total}`}
        progress={data.objectives.progress}
        description={`${data.objectives.inProgress} in progress, ${data.objectives.completed} completed`}
      />
      
      <QuickStat
        icon={<Users className="h-6 w-6" />}
        iconColor="text-accent-500"
        bgColor="bg-accent-100"
        title="Team Performance"
        value={`${Math.round(data.teamPerformance.average)}%`}
        progress={data.teamPerformance.average}
        description={`${data.teamPerformance.improvement}% increase from last month`}
      />
      
      <QuickStat
        icon={<CheckCircle className="h-6 w-6" />}
        iconColor="text-green-600"
        bgColor="bg-green-100"
        title="Completed Key Results"
        value={`${data.keyResults.completed}/${data.keyResults.total}`}
        progress={data.keyResults.completionRate}
        description={`${Math.round(data.keyResults.completionRate)}% completion rate`}
      />
      
      <QuickStat
        icon={<Clock className="h-6 w-6" />}
        iconColor="text-amber-600"
        bgColor="bg-amber-100"
        title="Time Remaining"
        value={`${data.timeRemaining.days} days`}
        progress={data.timeRemaining.percentage}
        description={`${data.timeRemaining.percentage}% of Q2 remaining`}
      />
    </div>
  );
}
