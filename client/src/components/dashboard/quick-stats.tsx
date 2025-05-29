import { useQuery } from "@tanstack/react-query";
import { Target, Users, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  // Simple trend line SVG
  const TrendLine = () => (
    <svg 
      width="100%" 
      height="32" 
      viewBox="0 0 240 32" 
      fill="none" 
      className="mt-4"
    >
      <path 
        d="M0 24 Q30 20 60 16 T120 12 T180 8 T240 6" 
        stroke={color} 
        strokeWidth="2" 
        fill="none"
        opacity="0.6"
      />
      <defs>
        <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <path 
        d="M0 24 Q30 20 60 16 T120 12 T180 8 T240 6 L240 32 L0 32 Z" 
        fill={`url(#gradient-${color.replace('#', '')})`}
      />
    </svg>
  );

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 flex-1">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-4">{value}</div>
      <TrendLine />
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
    queryKey: ['/api/dashboard-stats'],
  });

  if (isLoading) {
    return (
      <div className="flex gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-100 p-6 flex-1">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-12 mb-4" />
            <Skeleton className="h-8 w-full" />
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
    <div className="flex gap-4 mb-8">
      <StatCard
        title="Total Objectives"
        value={`${data.objectives.total}`}
        icon={<Target className="h-5 w-5" />}
        color="#3B82F6"
      />
      
      <StatCard
        title="Team Performance"
        value={`${Math.round(data.teamPerformance.average)}%`}
        icon={<Users className="h-5 w-5" />}
        color="#8B5CF6"
      />
      
      <StatCard
        title="Completed Key Results"
        value={`${data.keyResults.completed}/${data.keyResults.total}`}
        icon={<CheckCircle className="h-5 w-5" />}
        color="#22C55E"
      />
      
      <StatCard
        title="Time Remaining"
        value={`${data.timeRemaining.days} days`}
        icon={<Clock className="h-5 w-5" />}
        color="#F59E0B"
      />
    </div>
  );
}
