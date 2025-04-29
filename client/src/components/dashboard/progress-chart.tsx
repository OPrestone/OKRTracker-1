import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function ProgressItem({ title, progress }: { title: string; progress: number }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium text-neutral-700">{title}</span>
        <span className="text-sm font-medium text-neutral-700">{progress}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div 
          className="bg-primary-500 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export function ProgressChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/objectives/company'],
  });

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
            {[...Array(4)].map((_, i) => (
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
        ) : (
          <>
            {data && data.map((objective: any) => (
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
        <a href="/company-objectives" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all objectives
        </a>
      </div>
    </Card>
  );
}
