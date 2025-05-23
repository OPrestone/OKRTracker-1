import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface Objective {
  id: string;
  title: string;
  description?: string;
  status: string;
  progress: number;
}

interface UserProgress {
  id: string;
  userId: string;
  objectiveId: string;
  progress: number;
  lastUpdated: string;
}

interface ProgressTrackerProps {
  objectives: Objective[];
  onProgressUpdate?: (objectiveId: string, progress: number) => void;
}

export default function ProgressTracker({ objectives, onProgressUpdate }: ProgressTrackerProps) {
  const { userData } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = userData?.id || "";
  
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});
  const [editingObjectiveId, setEditingObjectiveId] = useState<string | null>(null);
  
  // Get user progress data for all objectives
  const { data: userProgressData, isLoading } = useQuery({
    queryKey: ["/api/progress/user", userId],
    enabled: !!userId, // Only run query if userId is available
  });
  
  const updateProgressMutation = useMutation({
    mutationFn: async (data: { objectiveId: string; progress: number }) => {
      return apiRequest('/api/progress', 'POST', {
        userId,
        objectiveId: data.objectiveId,
        progress: data.progress,
        updateObjective: true // Also update the objective's progress
      });
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({queryKey: ["/api/progress/user"]});
      queryClient.invalidateQueries({queryKey: ["/api/objectives"]});
      
      toast({
        title: "Progress updated",
        description: "Your progress has been saved successfully.",
      });
      
      // Close edit mode
      setEditingObjectiveId(null);
    },
    onError: (error) => {
      console.error("Error updating progress:", error);
      toast({
        title: "Error updating progress",
        description: "There was a problem saving your progress. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Initialize progress values from user progress data or objectives
  useEffect(() => {
    if (userProgressData && Array.isArray(userProgressData)) {
      const progressMap: Record<string, number> = {};
      
      userProgressData.forEach((progress: UserProgress) => {
        progressMap[progress.objectiveId] = progress.progress;
      });
      
      // For objectives without progress data, use the objective's progress
      objectives.forEach(objective => {
        if (progressMap[objective.id] === undefined) {
          progressMap[objective.id] = objective.progress || 0;
        }
      });
      
      setProgressValues(progressMap);
    } else {
      // If no user progress data, initialize with objectives' progress
      const progressMap: Record<string, number> = {};
      objectives.forEach(objective => {
        progressMap[objective.id] = objective.progress || 0;
      });
      setProgressValues(progressMap);
    }
  }, [userProgressData, objectives]);
  
  const handleProgressChange = (objectiveId: string, value: number[]) => {
    setProgressValues(prev => ({ 
      ...prev, 
      [objectiveId]: value[0] 
    }));
  };
  
  const handleSaveProgress = (objectiveId: string) => {
    const progress = progressValues[objectiveId];
    
    updateProgressMutation.mutate({ 
      objectiveId, 
      progress 
    });
    
    if (onProgressUpdate) {
      onProgressUpdate(objectiveId, progress);
    }
  };
  
  const getProgressColorClass = (value: number) => {
    if (value >= 75) return "bg-green-500";
    if (value >= 50) return "bg-blue-500";
    if (value >= 25) return "bg-amber-500";
    return "bg-red-500";
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full mb-4"></div>
            <div className="h-2 bg-gray-200 rounded animate-pulse w-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {objectives.map(objective => (
        <Card key={objective.id} className="relative">
          <CardHeader>
            <CardTitle className="text-lg">{objective.title}</CardTitle>
            {objective.description && (
              <CardDescription>{objective.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm font-medium">
                  {progressValues[objective.id] || 0}%
                </span>
              </div>
              
              {editingObjectiveId === objective.id ? (
                <div className="space-y-6">
                  <Slider 
                    value={[progressValues[objective.id] || 0]} 
                    max={100}
                    step={5}
                    onValueChange={(value) => handleProgressChange(objective.id, value)}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingObjectiveId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleSaveProgress(objective.id)}
                      disabled={updateProgressMutation.isPending}
                    >
                      {updateProgressMutation.isPending ? "Saving..." : "Save Progress"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Progress 
                    value={progressValues[objective.id] || 0} 
                    className={`h-2 ${getProgressColorClass(progressValues[objective.id] || 0)}`}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEditingObjectiveId(objective.id)}
                    >
                      Update Progress
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Objective Progress</span>
                <span className="text-sm font-medium">
                  {objective.progress || 0}%
                </span>
              </div>
              <Progress 
                value={objective.progress || 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      ))}
      
      {objectives.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              No objectives found. Create objectives to track your progress.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}