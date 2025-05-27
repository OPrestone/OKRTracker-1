import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Building2, Users } from "lucide-react";

interface StrategicDirection {
  id: string;
  title: string;
  description: string;
  priority: number;
  type: 'company' | 'team';
  tenant_id: string;
  team_id?: string;
  created_at: string;
}

interface StrategicDirectionsDisplayProps {
  type?: 'company' | 'team';
  teamId?: string;
  className?: string;
}

export function StrategicDirectionsDisplay({ 
  type = 'company', 
  teamId, 
  className = "" 
}: StrategicDirectionsDisplayProps) {
  const { data: directions, isLoading, error } = useQuery({
    queryKey: ['strategic-directions', type, teamId],
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (teamId && type === 'team') {
        params.append('teamId', teamId);
      }
      
      const response = await fetch(`/api/strategic-directions?${params}`);
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
          <Badge variant="outline" className="ml-auto">
            {directions.length} {directions.length === 1 ? 'Direction' : 'Directions'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {directions
            .sort((a, b) => a.priority - b.priority)
            .map((direction, index) => (
            <div
              key={direction.id}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    {direction.priority || index + 1}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {direction.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {direction.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    {direction.type === 'company' ? (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        Company
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Team
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(direction.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}