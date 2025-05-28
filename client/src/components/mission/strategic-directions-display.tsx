import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target, Plus, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const queryClient = useQueryClient();
  
  const { data: directions, isLoading, error } = useQuery({
    queryKey: ['api', 'strategic-directions'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string }) => {
      console.log("=== FRONTEND: Creating strategic direction ===");
      console.log("Form data being sent:", data);
      
      const response = await apiRequest('/api/strategic-directions/create', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log("API response:", response);
      return response;
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