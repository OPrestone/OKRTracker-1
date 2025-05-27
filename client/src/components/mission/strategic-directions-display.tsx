import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface StrategicDirection {
  id: string;
  title: string;
  description: string;
  type: "company" | "team";
  priority: number;
  tenantId: string;
  teamId?: string;
  createdById: string;
  createdAt: string;
}

interface StrategicDirectionsDisplayProps {
  type?: "company" | "team";
  teamId?: string;
}

export function StrategicDirectionsDisplay({ 
  type = "company", 
  teamId 
}: StrategicDirectionsDisplayProps) {
  const { tenantId } = useAuth();

  // Fetch strategic directions from the API
  const { data: directions = [], isLoading, error } = useQuery({
    queryKey: ['/api/strategic-directions', tenantId, type, teamId],
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        ...(teamId && { teamId })
      });
      
      const response = await fetch(`/api/strategic-directions?${params}`, {
        credentials: 'include',
        headers: {
          'X-Tenant-ID': tenantId
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch strategic directions');
      }
      
      return response.json() as Promise<StrategicDirection[]>;
    },
    enabled: !!tenantId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Directions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading strategic directions...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Directions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load strategic directions</p>
        </CardContent>
      </Card>
    );
  }

  if (!directions || directions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategic Directions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No strategic directions have been set yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === "company" ? "Company Strategic Directions" : "Team Strategic Directions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {directions.map((direction) => (
          <div key={direction.id} className="space-y-2">
            <h4 className="font-medium">{direction.title}</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {direction.description}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}