import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, differenceInDays, parseISO, isValid, isWithinInterval } from "date-fns";

// Types
interface Objective {
  id: number;
  title: string;
  description: string;
  level: string;
  status: string;
  progress: number;
  timeframeId: number;
  startDate?: string;
  endDate?: string;
  teamId?: number;
}

interface Team {
  id: number;
  name: string;
}

interface Timeframe {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  cadenceId: number;
}

interface TimelineDragState {
  active: boolean;
  objectiveId: number | null;
  type: "start" | "end" | "move" | null;
  startX: number;
  initialStartDate: Date | null;
  initialEndDate: Date | null;
}

const TimelineEditor = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [view, setView] = useState<"month" | "quarter" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(40); // width per day in pixels
  const [dragState, setDragState] = useState<TimelineDragState>({
    active: false,
    objectiveId: null,
    type: null,
    startX: 0,
    initialStartDate: null,
    initialEndDate: null,
  });
  
  // Define date range based on the view
  useEffect(() => {
    if (view === "month") {
      setStartDate(startOfMonth(selectedDate));
      setEndDate(endOfMonth(selectedDate));
    } else if (view === "quarter") {
      // Calculate start of quarter
      const month = selectedDate.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const quarterStart = new Date(selectedDate.getFullYear(), quarterStartMonth, 1);
      setStartDate(quarterStart);
      setEndDate(new Date(selectedDate.getFullYear(), quarterStartMonth + 3, 0));
    } else if (view === "year") {
      setStartDate(new Date(selectedDate.getFullYear(), 0, 1));
      setEndDate(new Date(selectedDate.getFullYear(), 11, 31));
    }
  }, [view, selectedDate]);

  // Fetch objectives data
  const { data: objectives = [], isLoading: isLoadingObjectives, isError: isObjectivesError } = useQuery({
    queryKey: ["/api/objectives"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/objectives");
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

  // Fetch timeframes data
  const { data: timeframes = [] } = useQuery({
    queryKey: ["/api/timeframes"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/timeframes");
      return response.json();
    },
  });

  // Define mutation to update objective dates
  const updateObjectiveDatesMutation = useMutation({
    mutationFn: async ({ id, startDate, endDate }: { id: number; startDate?: string; endDate?: string }) => {
      const response = await apiRequest("PATCH", `/api/objectives/${id}`, {
        startDate,
        endDate,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      toast({
        title: "Timeline Updated",
        description: "The objective timeline has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update timeline",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter objectives by team and date range
  const filteredObjectives = objectives.filter((obj: Objective) => {
    // Filter by team if selected
    if (selectedTeam && selectedTeam !== "all" && obj.teamId?.toString() !== selectedTeam) {
      return false;
    }
    
    // Check if objective has start and end dates
    if (!obj.startDate || !obj.endDate) {
      return false;
    }
    
    // Convert string dates to Date objects
    const objStart = parseISO(obj.startDate);
    const objEnd = parseISO(obj.endDate);
    
    // Validate dates
    if (!isValid(objStart) || !isValid(objEnd)) {
      return false;
    }
    
    // Check if objective overlaps with the visible date range
    return (
      // Either the start date is within our range
      isWithinInterval(objStart, { start: startDate, end: endDate }) ||
      // Or the end date is within our range
      isWithinInterval(objEnd, { start: startDate, end: endDate }) ||
      // Or it spans our entire range
      (objStart <= startDate && objEnd >= endDate)
    );
  });

  // Generate dates array for the timeline header
  const datesInRange = Array.from(
    { length: differenceInDays(endDate, startDate) + 1 },
    (_, i) => addDays(startDate, i)
  );

  // Get the timeframe name for an objective
  const getTimeframeName = (timeframeId: number) => {
    const timeframe = timeframes.find((t: Timeframe) => t.id === timeframeId);
    return timeframe ? timeframe.name : "Unknown Timeframe";
  };

  // Get the team name for an objective
  const getTeamName = (teamId?: number) => {
    if (!teamId) return "Unassigned";
    const team = teams.find((t: Team) => t.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  // Calculate position and width of timeline item
  const getTimelineItemStyle = (startDateStr?: string, endDateStr?: string) => {
    if (!startDateStr || !endDateStr) return { left: 0, width: 0 };
    
    const objStart = parseISO(startDateStr);
    const objEnd = parseISO(endDateStr);
    
    if (!isValid(objStart) || !isValid(objEnd)) return { left: 0, width: 0 };
    
    // Calculate the days from the start of our visible range
    const daysFromStart = Math.max(0, differenceInDays(objStart, startDate));
    // Calculate the total days for the objective within our range
    const visibleEndDate = objEnd > endDate ? endDate : objEnd;
    const visibleStartDate = objStart < startDate ? startDate : objStart;
    const visibleDuration = differenceInDays(visibleEndDate, visibleStartDate) + 1;
    
    // Convert to pixels
    const left = daysFromStart * zoomLevel;
    const width = visibleDuration * zoomLevel;
    
    return { left, width };
  };

  // Handle zoom in/out
  const handleZoom = (direction: "in" | "out") => {
    if (direction === "in") {
      setZoomLevel(prev => Math.min(prev + 10, 100));
    } else {
      setZoomLevel(prev => Math.max(prev - 10, 20));
    }
  };

  // Handle mouse down on timeline item
  const handleMouseDown = (
    e: React.MouseEvent,
    objective: Objective,
    type: "start" | "end" | "move"
  ) => {
    if (!objective.startDate || !objective.endDate) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      active: true,
      objectiveId: objective.id,
      type,
      startX: e.clientX,
      initialStartDate: parseISO(objective.startDate),
      initialEndDate: parseISO(objective.endDate),
    });
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handle mouse move during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.active || !dragState.objectiveId || !dragState.initialStartDate || !dragState.initialEndDate) return;
    
    const deltaX = e.clientX - dragState.startX;
    const daysDelta = Math.round(deltaX / zoomLevel);
    
    // Find the objective being dragged
    const objective = objectives.find((obj: Objective) => obj.id === dragState.objectiveId);
    if (!objective) return;
    
    // Create a copy of the objective with updated dates
    const updatedObj = { ...objective };
    
    if (dragState.type === "start") {
      // Adjust only start date, but don't allow it to go past end date
      const newStartDate = addDays(dragState.initialStartDate, daysDelta);
      if (newStartDate < dragState.initialEndDate) {
        updatedObj.startDate = format(newStartDate, "yyyy-MM-dd");
      }
    } else if (dragState.type === "end") {
      // Adjust only end date, but don't allow it to go before start date
      const newEndDate = addDays(dragState.initialEndDate, daysDelta);
      if (newEndDate > dragState.initialStartDate) {
        updatedObj.endDate = format(newEndDate, "yyyy-MM-dd");
      }
    } else if (dragState.type === "move") {
      // Move both dates by the same amount
      updatedObj.startDate = format(addDays(dragState.initialStartDate, daysDelta), "yyyy-MM-dd");
      updatedObj.endDate = format(addDays(dragState.initialEndDate, daysDelta), "yyyy-MM-dd");
    }
    
    // Update the objectives array with the modified object (temporary visual update)
    const objIndex = objectives.findIndex((obj: Objective) => obj.id === dragState.objectiveId);
    if (objIndex !== -1) {
      objectives[objIndex] = updatedObj;
    }
  };

  // Handle mouse up after drag
  const handleMouseUp = () => {
    if (!dragState.active || !dragState.objectiveId) {
      cleanupDragListeners();
      return;
    }
    
    // Find the objective that was being dragged
    const objective = objectives.find((obj: Objective) => obj.id === dragState.objectiveId);
    if (!objective) {
      cleanupDragListeners();
      return;
    }
    
    // Save the changes to the server
    updateObjectiveDatesMutation.mutate({
      id: dragState.objectiveId,
      startDate: objective.startDate,
      endDate: objective.endDate,
    });
    
    cleanupDragListeners();
  };

  // Remove event listeners
  const cleanupDragListeners = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    setDragState({
      active: false,
      objectiveId: null,
      type: null,
      startX: 0,
      initialStartDate: null,
      initialEndDate: null,
    });
  };

  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      cleanupDragListeners();
    };
  }, []);

  // Get color based on objective status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on track':
        return 'bg-green-200 border-green-400';
      case 'at risk':
        return 'bg-amber-200 border-amber-400';
      case 'behind':
        return 'bg-red-200 border-red-400';
      case 'completed':
        return 'bg-blue-200 border-blue-400';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  return (
    <DashboardLayout title="Timeline Editor">
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
            <h1 className="text-2xl font-bold mr-2">Timeline Editor</h1>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/objectives"] })}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 space-x-0 sm:space-x-2">
            <Select 
              value={view} 
              onValueChange={(value) => setView(value as "month" | "quarter" | "year")}
            >
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <span>View</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedTeam || "all"}
              onValueChange={(value) => setSelectedTeam(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter Teams</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-1">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => handleZoom("out")}
                disabled={zoomLevel <= 20}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => handleZoom("in")}
                disabled={zoomLevel >= 100}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {isLoadingObjectives ? (
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
          <div className="mt-4 overflow-x-auto" ref={containerRef}>
            <div className="relative min-w-full" style={{ overflowX: "auto" }}>
              {/* Timeline header with dates */}
              <div className="sticky top-0 bg-background z-10 border-b border-gray-200 dark:border-gray-700">
                <div className="grid" style={{ gridTemplateColumns: `200px repeat(${datesInRange.length}, ${zoomLevel}px)` }}>
                  <div className="border-r border-gray-200 dark:border-gray-700 p-2 font-medium">
                    Objective
                  </div>
                  
                  {datesInRange.map((date, i) => (
                    <div 
                      key={i}
                      className={`
                        border-r border-gray-200 dark:border-gray-700 p-1 text-xs whitespace-nowrap text-center
                        ${date.getDay() === 0 || date.getDay() === 6 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
                      `}
                    >
                      {format(date, view === "year" ? "MMM d" : "MMM d")}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline body with objective bars */}
              <div>
                {filteredObjectives.map((objective: Objective, index: number) => {
                  const { left, width } = getTimelineItemStyle(objective.startDate, objective.endDate);
                  
                  if (width === 0) return null; // Skip objectives that aren't visible
                  
                  return (
                    <div 
                      key={objective.id}
                      className={`
                        grid border-b border-gray-200 dark:border-gray-700
                        ${index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/10' : ''}
                      `}
                      style={{ gridTemplateColumns: `200px repeat(${datesInRange.length}, ${zoomLevel}px)` }}
                    >
                      <div className="p-2 border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="text-sm font-medium truncate" title={objective.title}>
                          {objective.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {getTeamName(objective.teamId)} · {getTimeframeName(objective.timeframeId)}
                        </div>
                      </div>
                      
                      <div 
                        className={`col-span-full absolute h-6 mt-3 rounded-md border-2 cursor-move
                          ${getStatusColor(objective.status)}
                          flex items-center px-2 text-xs font-medium truncate
                        `}
                        style={{ 
                          left: `calc(200px + ${left}px)`, 
                          width: `${width}px`,
                          touchAction: "none"
                        }}
                        onMouseDown={(e) => handleMouseDown(e, objective, "move")}
                        role="button"
                        aria-label={`Drag to move ${objective.title}`}
                        tabIndex={0}
                      >
                        <div className="truncate text-sm">
                          {objective.title}
                        </div>
                        
                        {/* Resize handles */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize"
                          onMouseDown={(e) => handleMouseDown(e, objective, "start")}
                          aria-label="Adjust start date"
                        />
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize"
                          onMouseDown={(e) => handleMouseDown(e, objective, "end")}
                          aria-label="Adjust end date"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-muted rounded-lg p-4 mt-8">
          <h3 className="font-medium mb-2">How to use the Timeline Editor</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Drag the middle of an objective bar to move its entire timeline</li>
            <li>Drag the edges to adjust the start or end date</li>
            <li>Use the zoom buttons to adjust the timeline scale</li>
            <li>Filter by team to focus on specific groups</li>
            <li>Switch between month, quarter, and year views</li>
            <li>Changes are automatically saved when you release the mouse</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TimelineEditor;