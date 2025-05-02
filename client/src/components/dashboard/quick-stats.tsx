import { useQuery } from "@tanstack/react-query";
import { Zap, Users, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";

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

// Using StatsCard component from stats-card.tsx instead
function QuickStat({ 
  icon, 
  iconColor, 
  bgColor, 
  title, 
  value, 
  progress, 
  description 
}: QuickStatProps) {
  return (
    <StatsCard
      icon={icon}
      iconColor={iconColor}
      bgColor={bgColor}
      title={title}
      value={value}
      progressBar={true}
      progressValue={progress}
      subtitle={description}
    />
  );
}

export function QuickStats() {
  const { data, isLoading, error } = useQuery({
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <QuickStat
        icon={<Zap className="h-6 w-6" />}
        iconColor="text-primary-600"
        bgColor="bg-primary-100"
        title="Company Objectives"
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
