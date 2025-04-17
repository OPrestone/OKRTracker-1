import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  filterObjectives,
  filterObjectivesByLevel,
} from "@/lib/filter-utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  RefreshCw, 
  ListFilter,
  X,
} from "lucide-react";
import ObjectiveCard from "@/components/organizer/draggable-objective-card";
import { ObjectiveGroup } from "@/components/organizer/objective-group";
import { SortableObjective } from "@/components/organizer/sortable-objective";

// Types
interface Objective {
  id: number;
  title: string;
  description?: string;
  level: string;
  status: string;
  progress: number;
  owner?: {
    id: number;
    name: string;
    role?: string;
  };
  keyResults?: any[];
  timeframeId: number;
  teamId?: number;
}

interface Timeframe {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  cadenceId: number;
}

interface Team {
  id: number;
  name: string;
}

const ObjecitveStatusOptions = [
  "All",
  "On Track",
  "At Risk",
  "Behind",
  "Completed",
];

const ObjectiveGroups = {
  organization: { id: "organization", title: "Organization Objectives" },
  department: { id: "department", title: "Department Objectives" },
  team: { id: "team", title: "Team Objectives" },
  individual: { id: "individual", title: "Individual Objectives" },
  completed: { id: "completed", title: "Completed Objectives" },
};

const ObjectivesOrganizer = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // States
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTimeframe, setSelectedTimeframe] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  
  // Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
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
  
  // Fetch timeframes data
  const { data: timeframes = [] } = useQuery({
    queryKey: ["/api/timeframes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/timeframes");
      return response.json();
    },
  });
  
  // Fetch teams data
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/teams");
      return response.json();
    },
  });
  
  // Update objective level mutation
  const updateObjectiveLevelMutation = useMutation({
    mutationFn: async ({ id, level }: { id: number; level: string }) => {
      const response = await apiRequest("PATCH", `/api/objectives/${id}`, { level });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Objective Updated",
        description: "The objective has been successfully moved to a new level.",
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
  
  // Utility function to get container ID from combined ID
  const getContainerFromId = (id: string) => {
    if (typeof id !== "string") return null;
    return id.split("-")[0];
  };
  
  // Utility function to get objective ID from combined ID
  const getObjectiveFromId = (id: string) => {
    if (typeof id !== "string") return null;
    return parseInt(id.split("-")[1]);
  };
  
  // Get objectives by level
  const getObjectivesByLevel = (level: string) => {
    let filteredObjectives = [...objectives];
    
    // Apply filters
    if (searchQuery) {
      filteredObjectives = filterObjectives(filteredObjectives, { search: searchQuery });
    }
    
    if (selectedLevel !== "All") {
      filteredObjectives = filterObjectivesByLevel(filteredObjectives, selectedLevel);
    }
    
    if (selectedStatus !== "All") {
      filteredObjectives = filterObjectives(filteredObjectives, { status: [selectedStatus] });
    }
    
    if (selectedTimeframe) {
      filteredObjectives = filterObjectives(filteredObjectives, { timeframe: [selectedTimeframe] });
    }
    
    // Filter by team if selected
    if (selectedTeam) {
      filteredObjectives = filterObjectives(filteredObjectives, { team: [selectedTeam] });
    }
    
    // Now filter by the requested level
    if (level === "completed") {
      return filteredObjectives.filter(obj => obj.status.toLowerCase() === "completed");
    } else {
      return filteredObjectives.filter(obj => 
        obj.level.toLowerCase() === level.toLowerCase() && 
        obj.status.toLowerCase() !== "completed"
      );
    }
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeContainer = getContainerFromId(active.id as string);
    const overContainer = getContainerFromId(over.id as string);
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
    
    // Handle moving objectives between containers in the UI
    // The actual update happens in handleDragEnd
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeContainer = getContainerFromId(activeId);
    const overContainer = getContainerFromId(overId);
    
    if (!activeContainer || !overContainer) {
      setActiveId(null);
      return;
    }
    
    if (activeContainer !== overContainer) {
      // Item moved to a different container (level)
      const objectiveId = getObjectiveFromId(activeId);
      
      if (objectiveId) {
        // Update the objective's level in the database
        updateObjectiveLevelMutation.mutate({ 
          id: objectiveId, 
          level: overContainer === "organization" ? "Organization" :
                overContainer === "department" ? "Department" :
                overContainer === "team" ? "Team" :
                overContainer === "individual" ? "Individual" :
                "Completed" 
        });
      }
    } else if (activeId !== overId) {
      // Items rearranged within the same container
      // This would be implemented if you add position/order to objectives
    }
    
    setActiveId(null);
  };
  
  // Handle search
  const handleSearch = () => {
    if (searchInputRef.current) {
      setSearchQuery(searchInputRef.current.value);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLevel("All");
    setSelectedStatus("All");
    setSelectedTimeframe(null);
    setSelectedTeam(null);
    
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };
  
  // Get timeframe name
  const getTimeframeName = (id: number) => {
    const timeframe = timeframes.find((t: Timeframe) => t.id === id);
    return timeframe ? timeframe.name : "Unknown";
  };
  
  // Get active objective
  const getActiveObjective = (): Objective | null => {
    if (!activeId) return null;
    
    const container = getContainerFromId(activeId as string);
    const objectiveId = getObjectiveFromId(activeId as string);
    
    if (!container || !objectiveId) return null;
    
    const objective = objectives.find((obj: Objective) => obj.id === objectiveId);
    return objective || null;
  };
  
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
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Objectives Organizer</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/objectives"] })}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="relative w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search objectives..."
                  className="pl-9"
                  onChange={handleSearch}
                />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                disabled={!searchQuery && selectedLevel === "All" && selectedStatus === "All" && !selectedTimeframe && !selectedTeam}
              >
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4">
              <div className="font-medium flex items-center mb-3">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filters</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="level-filter">Level</Label>
                  <Select 
                    value={selectedLevel} 
                    onValueChange={setSelectedLevel}
                  >
                    <SelectTrigger id="level-filter">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Levels</SelectItem>
                      <SelectItem value="Organization">Organization</SelectItem>
                      <SelectItem value="Department">Department</SelectItem>
                      <SelectItem value="Team">Team</SelectItem>
                      <SelectItem value="Individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status-filter">Status</Label>
                  <Select 
                    value={selectedStatus} 
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger id="status-filter">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {ObjecitveStatusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeframe-filter">Timeframe</Label>
                  <Select 
                    value={selectedTimeframe?.toString() || ""} 
                    onValueChange={(value) => setSelectedTimeframe(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger id="timeframe-filter">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Timeframes</SelectItem>
                      {timeframes.map((timeframe: Timeframe) => (
                        <SelectItem 
                          key={timeframe.id} 
                          value={timeframe.id.toString()}
                        >
                          {timeframe.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team-filter">Team</Label>
                  <Select 
                    value={selectedTeam?.toString() || ""} 
                    onValueChange={(value) => setSelectedTeam(value ? parseInt(value) : null)}
                  >
                    <SelectTrigger id="team-filter">
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Teams</SelectItem>
                      {teams.map((team: Team) => (
                        <SelectItem 
                          key={team.id} 
                          value={team.id.toString()}
                        >
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Filters</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      disabled={!searchQuery && selectedLevel === "All" && selectedStatus === "All" && !selectedTimeframe && !selectedTeam}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {searchQuery && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Search className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{searchQuery}</span>
                        <button 
                          className="ml-1" 
                          onClick={() => {
                            setSearchQuery("");
                            if (searchInputRef.current) {
                              searchInputRef.current.value = "";
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {selectedLevel !== "All" && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {selectedLevel}
                        <button 
                          className="ml-1" 
                          onClick={() => setSelectedLevel("All")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {selectedStatus !== "All" && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {selectedStatus}
                        <button 
                          className="ml-1" 
                          onClick={() => setSelectedStatus("All")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {selectedTimeframe && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <ListFilter className="h-3 w-3" />
                        {getTimeframeName(selectedTimeframe)}
                        <button 
                          className="ml-1" 
                          onClick={() => setSelectedTimeframe(null)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {selectedTeam && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <ListFilter className="h-3 w-3" />
                        {teams.find(t => t.id === selectedTeam)?.name}
                        <button 
                          className="ml-1" 
                          onClick={() => setSelectedTeam(null)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-lg border p-4">
              <h2 className="font-medium mb-2">How to Use</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Drag objectives between levels</li>
                <li>• Filter and search to find specific objectives</li>
                <li>• Changes are saved automatically</li>
                <li>• Use filters to narrow down objectives</li>
              </ul>
            </div>
          </div>
          
          <div className="col-span-1 md:col-span-3">
            {isLoadingObjectives ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div 
                    key={i} 
                    className="border rounded-lg p-4 animate-pulse space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-12"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-24 bg-gray-100 rounded"></div>
                      <div className="h-24 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  <ObjectiveGroup
                    id="organization"
                    title="Organization Objectives"
                    description="High-level strategic objectives for the entire organization"
                    objectives={getObjectivesByLevel("organization")}
                  />
                  
                  <ObjectiveGroup
                    id="department"
                    title="Department Objectives"
                    description="Departmental objectives supporting organization goals"
                    objectives={getObjectivesByLevel("department")}
                  />
                  
                  <ObjectiveGroup
                    id="team"
                    title="Team Objectives"
                    description="Team-level objectives supporting department goals"
                    objectives={getObjectivesByLevel("team")}
                  />
                  
                  <ObjectiveGroup
                    id="individual"
                    title="Individual Objectives"
                    description="Individual objectives for personal development and contribution"
                    objectives={getObjectivesByLevel("individual")}
                  />
                  
                  <ObjectiveGroup
                    id="completed"
                    title="Completed Objectives"
                    description="Objectives that have been successfully completed"
                    objectives={getObjectivesByLevel("completed")}
                  />
                </div>
                
                <DragOverlay>
                  {activeId ? (
                    <div className="transform-gpu scale-105">
                      <ObjectiveCard 
                        objective={getActiveObjective() as Objective}
                        isDragging={true} 
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ObjectivesOrganizer;