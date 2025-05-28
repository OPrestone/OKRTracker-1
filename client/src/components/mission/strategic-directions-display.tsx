import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface StrategicDirection {
  id: string;
  title: string;
  description: string;
  tenantId: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

interface StrategicDirectionsDisplayProps {
  className?: string;
}

export function StrategicDirectionsDisplay({ 
  className = "" 
}: StrategicDirectionsDisplayProps) {
  const { data: directions, isLoading, error } = useQuery({
    queryKey: ['strategic-directions'],
    queryFn: async () => {
      const response = await fetch('/api/strategic-directions');
      if (!response.ok) {
        throw new Error('Failed to fetch strategic directions');
      }
      return response.json() as StrategicDirection[];
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Directions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Target className="h-5 w-5" />
            Strategic Directions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Unable to load strategic directions. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const strategicDirections = config?.strategic_directions;

  if (!strategicDirections || strategicDirections.trim() === '') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Directions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No strategic directions have been set yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Directions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {strategicDirections}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}