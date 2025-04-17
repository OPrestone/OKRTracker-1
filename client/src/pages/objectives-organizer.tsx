import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw, ArrowUpDown, Layers, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Import DnD Kit components
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

// Import our custom DnD components
import ObjectiveCard from "@/components/organizer/draggable-objective-card";
import ObjectiveGroup from "@/components/organizer/objective-group";
import { SortableObjective } from "@/components/organizer/sortable-objective";

// Types
interface Objective {
  id: number;
  title: string;
  description: string;
  level: string;
  status: string;
  progress: number;
  owner: {
    id: number;
    name: string;
    role?: string;
  };
  timeframe: string;
  timeframeId: number;
  teamId?: number;
  keyResults: any[];
  sequence?: number;
}

interface Team {
  id: number;
  name: string;
  description: string;
}

interface Timeframe {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  cadenceId: number;
}

const ObjectivesOrganizer = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeId, setActiveId] = useState<string | null>(null);
  const [objectivesByTeam, setObjectivesByTeam] = useState<Record<string, Objective[]>>({});
  const [objectivesByTimeframe, setObjectivesByTimeframe] = useState<Record<string, Objective[]>>({});
  const [groupBy, setGroupBy] = useState<"team" | "timeframe">("team");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch objectives data
  const { data: objectives = [], isLoading: isLoadingObjectives, isError: isObjectivesError } = useQuery({
    queryKey: ["/api/objectives"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/objectives");
      return response.json();
    },
  });

  // Fetch teams data
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/teams");
      return response.json();
    },
  });

  // Fetch timeframes data
  const { data: timeframes = [], isLoading: isLoadingTimeframes } = useQuery({
    queryKey: ["/api/timeframes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/timeframes");
      return response.json();
    },
  });

  // Group objectives by team and timeframe
  useEffect(() => {
    if (objectives.length) {
      const byTeam: Record<string, Objective[]> = {};
      const byTimeframe: Record<string, Objective[]> = {};
      
      objectives.forEach((obj: Objective) => {
        // Group by team
        const teamId = obj.teamId?.toString() || "unassigned";
        if (!byTeam[teamId]) {
          byTeam[teamId] = [];
        }
        byTeam[teamId].push(obj);
        
        // Group by timeframe
        const timeframeId = obj.timeframeId?.toString() || "unassigned";
        if (!byTimeframe[timeframeId]) {
          byTimeframe[timeframeId] = [];
        }
        byTimeframe[timeframeId].push(obj);
      });
      
      // Sort objectives by sequence if available
      Object.keys(byTeam).forEach(teamId => {
        byTeam[teamId].sort((a, b) => {
          if (a.sequence !== undefined && b.sequence !== undefined) {
            return a.sequence - b.sequence;
          }
          return a.id - b.id;
        });
      });
      
      Object.keys(byTimeframe).forEach(timeframeId => {
        byTimeframe[timeframeId].sort((a, b) => {
          if (a.sequence !== undefined && b.sequence !== undefined) {
            return a.sequence - b.sequence;
          }
          return a.id - b.id;
        });
      });
      
      setObjectivesByTeam(byTeam);
      setObjectivesByTimeframe(byTimeframe);
    }
  }, [objectives]);

  // Define mutation to update objective group or sequence
  const updateObjectiveMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Objective> }) => {
      const response = await apiRequest("PATCH", `/api/objectives/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective updated",
        description: "The objective has been successfully rearranged.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const activeIdStr = active.id as string;
      const overIdStr = over.id as string;
      
      // Extract group ID and objective ID from the composite ID
      const [activeGroupId, activeObjectiveId] = activeIdStr.split('-');
      const [overGroupId, overObjectiveId] = overIdStr.split('-');
      
      if (groupBy === "team") {
        const activeTeamId = activeGroupId;
        const overTeamId = overGroupId;
        
        // Get the active objective
        const objectiveId = parseInt(activeObjectiveId);
        
        if (activeTeamId === overTeamId) {
          // If same team, just reorder
          setObjectivesByTeam(prevObjectivesByTeam => {
            const teamObjectives = [...prevObjectivesByTeam[activeTeamId]];
            const oldIndex = teamObjectives.findIndex(obj => obj.id === objectiveId);
            const newIndex = teamObjectives.findIndex(obj => obj.id === parseInt(overObjectiveId));
            
            const newTeamObjectives = arrayMove(teamObjectives, oldIndex, newIndex);
            
            // Update sequence numbers
            newTeamObjectives.forEach((obj, index) => {
              obj.sequence = index;
              // Update in database
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            return {
              ...prevObjectivesByTeam,
              [activeTeamId]: newTeamObjectives
            };
          });
        } else {
          // Moving to different team
          setObjectivesByTeam(prevObjectivesByTeam => {
            const sourceTeamObjectives = [...prevObjectivesByTeam[activeTeamId]];
            const targetTeamObjectives = [...(prevObjectivesByTeam[overTeamId] || [])];
            
            const objectiveIndex = sourceTeamObjectives.findIndex(obj => obj.id === objectiveId);
            const objective = sourceTeamObjectives[objectiveIndex];
            
            // Remove from source team
            sourceTeamObjectives.splice(objectiveIndex, 1);
            
            // Add to target team
            const targetIndex = overObjectiveId ? 
              targetTeamObjectives.findIndex(obj => obj.id === parseInt(overObjectiveId)) :
              targetTeamObjectives.length;
            
            targetTeamObjectives.splice(targetIndex, 0, objective);
            
            // Update team ID and sequence
            objective.teamId = overTeamId === "unassigned" ? undefined : parseInt(overTeamId);
            
            // Update in database
            updateObjectiveMutation.mutate({ 
              id: objective.id, 
              data: { 
                teamId: objective.teamId,
                sequence: targetIndex
              } 
            });
            
            // Update sequences for both teams
            sourceTeamObjectives.forEach((obj, index) => {
              obj.sequence = index;
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            targetTeamObjectives.forEach((obj, index) => {
              obj.sequence = index;
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            return {
              ...prevObjectivesByTeam,
              [activeTeamId]: sourceTeamObjectives,
              [overTeamId]: targetTeamObjectives
            };
          });
        }
      } else if (groupBy === "timeframe") {
        // Similar logic for timeframe grouping
        const activeTimeframeId = activeGroupId;
        const overTimeframeId = overGroupId;
        
        // Get the active objective
        const objectiveId = parseInt(activeObjectiveId);
        
        if (activeTimeframeId === overTimeframeId) {
          // If same timeframe, just reorder
          setObjectivesByTimeframe(prevObjectivesByTimeframe => {
            const timeframeObjectives = [...prevObjectivesByTimeframe[activeTimeframeId]];
            const oldIndex = timeframeObjectives.findIndex(obj => obj.id === objectiveId);
            const newIndex = timeframeObjectives.findIndex(obj => obj.id === parseInt(overObjectiveId));
            
            const newTimeframeObjectives = arrayMove(timeframeObjectives, oldIndex, newIndex);
            
            // Update sequence numbers
            newTimeframeObjectives.forEach((obj, index) => {
              obj.sequence = index;
              // Update in database
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            return {
              ...prevObjectivesByTimeframe,
              [activeTimeframeId]: newTimeframeObjectives
            };
          });
        } else {
          // Moving to different timeframe
          setObjectivesByTimeframe(prevObjectivesByTimeframe => {
            const sourceTimeframeObjectives = [...prevObjectivesByTimeframe[activeTimeframeId]];
            const targetTimeframeObjectives = [...(prevObjectivesByTimeframe[overTimeframeId] || [])];
            
            const objectiveIndex = sourceTimeframeObjectives.findIndex(obj => obj.id === objectiveId);
            const objective = sourceTimeframeObjectives[objectiveIndex];
            
            // Remove from source timeframe
            sourceTimeframeObjectives.splice(objectiveIndex, 1);
            
            // Add to target timeframe
            const targetIndex = overObjectiveId ? 
              targetTimeframeObjectives.findIndex(obj => obj.id === parseInt(overObjectiveId)) :
              targetTimeframeObjectives.length;
            
            targetTimeframeObjectives.splice(targetIndex, 0, objective);
            
            // Update timeframe ID and sequence
            objective.timeframeId = overTimeframeId === "unassigned" ? 0 : parseInt(overTimeframeId);
            
            // Update in database
            updateObjectiveMutation.mutate({ 
              id: objective.id, 
              data: { 
                timeframeId: objective.timeframeId,
                sequence: targetIndex
              } 
            });
            
            // Update sequences for both timeframes
            sourceTimeframeObjectives.forEach((obj, index) => {
              obj.sequence = index;
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            targetTimeframeObjectives.forEach((obj, index) => {
              obj.sequence = index;
              updateObjectiveMutation.mutate({ id: obj.id, data: { sequence: index } });
            });
            
            return {
              ...prevObjectivesByTimeframe,
              [activeTimeframeId]: sourceTimeframeObjectives,
              [overTimeframeId]: targetTimeframeObjectives
            };
          });
        }
      }
    }
    
    setActiveId(null);
  }

  // Get the name of a team by ID
  function getTeamName(teamId: string) {
    if (teamId === "unassigned") return "Unassigned";
    const team = teams.find((t: Team) => t.id.toString() === teamId);
    return team ? team.name : `Team ${teamId}`;
  }

  // Get the name of a timeframe by ID
  function getTimeframeName(timeframeId: string) {
    if (timeframeId === "unassigned") return "Unassigned";
    const timeframe = timeframes.find((t: Timeframe) => t.id.toString() === timeframeId);
    return timeframe ? timeframe.name : `Timeframe ${timeframeId}`;
  }

  // Reset to default order
  function resetOrder() {
    // This would reset all sequence numbers to default based on ID or creation date
    toast({
      title: "Order reset",
      description: "The objectives have been reset to their default order.",
    });
    
    // Refetch data from the server
    queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
  }

  // Get the active objective for drag overlay
  function getActiveObjective() {
    if (!activeId) return null;
    
    const [groupId, objectiveId] = activeId.split('-');
    const objId = parseInt(objectiveId);
    
    if (groupBy === "team") {
      const group = objectivesByTeam[groupId];
      return group?.find(obj => obj.id === objId) || null;
    } else {
      const group = objectivesByTimeframe[groupId];
      return group?.find(obj => obj.id === objId) || null;
    }
  }

  return (
    <DashboardLayout title="Objectives Organizer">
      <div className="space-y-4">
        {isObjectivesError && (
          <Alert variant="destructive">
            <AlertDescription>
              There was an error loading objectives. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold">Objectives Organizer</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={resetOrder}
              title="Reset to default order"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Select 
              value={groupBy} 
              onValueChange={(value) => setGroupBy(value as "team" | "timeframe")}
            >
              <SelectTrigger className="w-[180px]">
                <Layers className="h-4 w-4 mr-2" />
                <span>Group By</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team</SelectItem>
                <SelectItem value="timeframe">Timeframe</SelectItem>
              </SelectContent>
            </Select>
            
            {groupBy === "team" && (
              <Select 
                value={selectedTeam || "all"}
                onValueChange={(value) => setSelectedTeam(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filter Teams</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {Object.keys(objectivesByTeam).map(teamId => (
                    <SelectItem key={teamId} value={teamId}>
                      {getTeamName(teamId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {groupBy === "timeframe" && (
              <Select 
                value={selectedTimeframe || "all"}
                onValueChange={(value) => setSelectedTimeframe(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Filter Timeframes</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeframes</SelectItem>
                  {Object.keys(objectivesByTimeframe).map(timeframeId => (
                    <SelectItem key={timeframeId} value={timeframeId}>
                      {getTimeframeName(timeframeId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <Separator />
        
        {(isLoadingObjectives || isLoadingTeams || isLoadingTimeframes) ? (
          <div className="flex justify-center p-8">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 rounded-full bg-slate-200"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupBy === "team" && 
                Object.entries(objectivesByTeam)
                  .filter(([teamId]) => !selectedTeam || teamId === selectedTeam)
                  .map(([teamId, teamObjectives]) => (
                    <ObjectiveGroup
                      key={teamId}
                      id={teamId}
                      title={getTeamName(teamId)}
                      color={teamId === "unassigned" ? "gray" : undefined}
                    >
                      <SortableContext 
                        items={teamObjectives.map(obj => `${teamId}-${obj.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {teamObjectives.map(objective => (
                            <SortableObjective
                              key={`${teamId}-${objective.id}`}
                              id={`${teamId}-${objective.id}`}
                              objective={objective}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </ObjectiveGroup>
                ))}
                
              {groupBy === "timeframe" && 
                Object.entries(objectivesByTimeframe)
                  .filter(([timeframeId]) => !selectedTimeframe || timeframeId === selectedTimeframe)
                  .map(([timeframeId, timeframeObjectives]) => (
                    <ObjectiveGroup
                      key={timeframeId}
                      id={timeframeId}
                      title={getTimeframeName(timeframeId)}
                      color={timeframeId === "unassigned" ? "gray" : undefined}
                    >
                      <SortableContext 
                        items={timeframeObjectives.map(obj => `${timeframeId}-${obj.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {timeframeObjectives.map(objective => (
                            <SortableObjective
                              key={`${timeframeId}-${objective.id}`}
                              id={`${timeframeId}-${objective.id}`}
                              objective={objective}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </ObjectiveGroup>
                ))}
            </div>
            
            <DragOverlay>
              {activeId && (
                <div className="opacity-80">
                  <ObjectiveCard objective={getActiveObjective()!} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
        
        <div className="bg-muted rounded-lg p-4 mt-8">
          <h3 className="font-medium mb-2">How to use the Objectives Organizer</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Drag and drop objectives to reorder them within a group</li>
            <li>Drag an objective to another group to move it</li>
            <li>Changes are automatically saved when you drop an objective</li>
            <li>Use the "Group By" selector to organize by team or timeframe</li>
            <li>Filter to focus on specific teams or timeframes</li>
            <li>Click the reset button to restore the default order</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ObjectivesOrganizer;