import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, X, Building2, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface StrategicDirection {
  id: string;
  title: string;
  description: string;
  tenantId: string;
  teamId?: string;
  type?: string;
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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const queryClient = useQueryClient();
  
  // Get user role and team information
  const { data: userRole } = useQuery({
    queryKey: ['api', 'user', 'role'],
    queryFn: async () => {
      const response = await fetch('/api/user/role', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user role');
      }
      return response.json();
    },
  });

  const { data: userTeams } = useQuery({
    queryKey: ['api', 'teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }
      return response.json();
    },
  });
  
  const { data: directions, isLoading, error } = useQuery({
    queryKey: ['api', 'strategic-directions'],
    queryFn: async () => {
      const response = await fetch('/api/strategic-directions', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch strategic directions');
      }
      return response.json();
    },
  });

  // Check if user can add strategic directions (admin or manager)
  const canAddDirections = userRole?.role === 'admin' || userRole?.role === 'owner' || userRole?.role === 'manager';

  // Check if there's already a company-wide strategic direction
  const hasCompanyDirection = directions?.some((direction: StrategicDirection) => !direction.teamId);
  
  // CEO/Owner/Admin can create company-wide directions, Managers can create team directions
  const isExecutiveLevel = userRole?.role === 'admin' || userRole?.role === 'owner';
  const isManager = userRole?.role === 'manager';
  
  const canCreateDirection = canAddDirections && (
    (isExecutiveLevel && !hasCompanyDirection) || // Executives can create company direction if none exists
    (isManager && userTeams && userTeams.length > 0) // Managers can create team directions if they have a team
  );

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      console.log("=== FRONTEND: Creating strategic direction ===");
      console.log("Form data being sent:", data);
      
      const response = await fetch('/api/strategic-directions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create strategic direction');
      }
      
      const result = await response.json();
      console.log("API response:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Strategic direction created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ['api', 'strategic-directions'] });
      setShowForm(false);
      setTitle("");
      setDescription("");
    },
    onError: (error) => {
      console.error("Error creating strategic direction:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== FORM SUBMISSION ===");
    console.log("Title:", title);
    console.log("Description:", description);
    console.log("Title trimmed:", title.trim());
    console.log("Description trimmed:", description.trim());
    
    if (title.trim()) {
      console.log("Submitting form with data:", { title: title.trim(), description: description.trim() });
      createMutation.mutate({ title: title.trim(), description: description.trim() });
    } else {
      console.log("Form not submitted - title is empty");
    }
  };

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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Strategic Directions
            </div>
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Direction
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Digital Transformation"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this strategic direction and its importance..."
                  className="resize-none h-20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !title.trim()}
                  className="flex items-center gap-2"
                >
                  {createMutation.isPending ? "Creating..." : "Create Direction"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTitle("");
                    setDescription("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No strategic directions have been set yet.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Click "Add Direction" to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Filter directions based on user's team and company-wide visibility
  const filteredDirections = directions?.filter((direction: StrategicDirection) => {
    // Show company-wide directions (no teamId) to everyone
    if (!direction.teamId) return true;
    
    // Show team-specific directions only to team members
    if (userTeams?.some((team: any) => team.id === direction.teamId)) return true;
    
    return false;
  }) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Strategic Directions
          </div>
          {canCreateDirection && (
            <Button
              onClick={() => setShowForm(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Direction
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Digital Transformation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the strategic direction..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="flex items-center gap-2"
              >
                {createMutation.isPending ? (
                  <>Loading...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Direction
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setTitle("");
                  setDescription("");
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        )}
        
        <div className="space-y-4">
          {filteredDirections.map((direction: StrategicDirection) => (
            <div key={direction.id} className="border-l-4 border-l-green-500 pl-4 py-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">
                      {direction.title}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className="text-xs flex items-center gap-1"
                    >
                      {direction.teamId ? (
                        <>
                          <Users className="h-3 w-3" />
                          Team Direction
                        </>
                      ) : (
                        <>
                          <Building2 className="h-3 w-3" />
                          From CEO
                        </>
                      )}
                    </Badge>
                  </div>
                  {direction.description && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {direction.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredDirections.length === 0 && (
            <div className="text-center py-6">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                No strategic directions available for your team.
              </p>
              {canAddDirections && (
                <p className="text-sm text-gray-400 mt-1">
                  Click "Add Direction" to create team strategic directions.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}