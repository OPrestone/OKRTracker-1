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
    queryKey: ['api', 'strategic-directions'],
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

  if (!directions || directions.length === 0) {
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
            <p className="text-sm text-gray-400 mt-1">
              Click "Add Direction" to get started.
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
        <div className="space-y-4">
          {directions.map((direction) => (
            <div key={direction.id} className="border-l-4 border-l-blue-500 pl-4 py-2">
              <h4 className="font-medium text-gray-900 mb-1">
                {direction.title}
              </h4>
              {direction.description && (
                <p className="text-sm text-gray-700 leading-relaxed">
                  {direction.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}