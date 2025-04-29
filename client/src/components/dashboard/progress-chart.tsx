import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

function ProgressItem({ title, progress }: { title: string; progress: number | null }) {
  // Ensure progress is a valid number between 0-100
  const validProgress = progress !== null && !isNaN(progress) ? Math.max(0, Math.min(100, progress)) : 0;
  
  // Determine color based on progress percentage
  const getColorClass = () => {
    if (validProgress >= 70) return "bg-green-500";
    if (validProgress >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-neutral-700">{title}</span>
        <span className="text-sm font-medium text-neutral-700">{validProgress}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className={`${getColorClass()} h-2 rounded-full transition-all duration-500`} 
          style={{ width: `${validProgress}%` }}
        ></div>
      </div>
    </div>
  );
}

export function ProgressChart() {
  // Use the general objectives endpoint and filter for company level
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/objectives'],
  });

  // Filter for only company level objectives
  const companyObjectives = data?.filter((obj: any) => 
    obj.level === 'company' && obj.progress !== undefined
  ) || [];

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Company OKR Progress</CardTitle>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-5">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-red-500">Error loading objectives</div>
        ) : companyObjectives.length === 0 ? (
          <div className="text-center py-4 text-neutral-500">No company objectives found</div>
        ) : (
          <>
            {companyObjectives.map((objective: any) => (
              <ProgressItem 
                key={objective.id} 
                title={objective.title} 
                progress={objective.progress} 
              />
            ))}
          </>
        )}
      </CardContent>
      <div className="px-5 py-3 border-t border-neutral-200">
        <Link href="/objectives" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all objectives
        </Link>
      </div>
    </Card>
  );
}
