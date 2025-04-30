import { useState, useRef } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar, Plus, Filter, ChevronDown, ChevronUp, Info, MoreVertical, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Timeframe {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  cadenceId: number;
  isActive: boolean;
}

interface Objective {
  id: number;
  title: string;
  description: string | null;
  level: string;
  ownerId: number;
  teamId: number | null;
  timeframeId: number;
  status: string | null;
  progress: number | null;
  parentId: number | null;
  createdAt: string;
}

interface TimeframeWithObjectives extends Timeframe {
  objectives: Objective[];
}

function SortableObjective({ objective }: { objective: Objective }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: objective.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2"
    >
      <ObjectiveCard objective={objective} />
    </div>
  );
}

function ObjectiveCard({ objective }: { objective: Objective }) {
  return (
    <Card className="shadow-sm hover:shadow transition-shadow cursor-grab">
      <CardContent className="p-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm mb-1">{objective.title}</h3>
            {objective.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-1">{objective.description}</p>
            )}
          </div>
          
          <Badge className={objective.level === "company" ? "bg-purple-100 text-purple-800" : objective.level === "team" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
            {objective.level}
          </Badge>
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-500">Progress</span>
            <span className="text-xs font-medium">{objective.progress || 0}%</span>
          </div>
          <Progress value={objective.progress || 0} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
}

function TimeframeColumn({ timeframe, objectives }: { timeframe: TimeframeWithObjectives; objectives: Objective[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const startDate = formatDate(timeframe.startDate);
  const endDate = formatDate(timeframe.endDate);

  return (
    <div className="bg-gray-50 rounded-lg p-3 min-w-[280px] h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-medium">{timeframe.name}</h3>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{startDate} - {endDate}</span>
          </div>
        </div>
        <Badge variant={timeframe.isActive ? "default" : "outline"} className="text-xs">
          {timeframe.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-600 font-medium">Objectives</span>
          <Badge variant="outline" className="text-xs">
            {objectives.length}
          </Badge>
        </div>
        
        <Separator className="my-2" />
        
        <div className="space-y-2 mt-3">
          <SortableContext items={objectives.map(o => o.id.toString())} strategy={verticalListSortingStrategy}>
            {objectives.map((objective) => (
              <SortableObjective key={objective.id} objective={objective} />
            ))}
          </SortableContext>
          
          <Button variant="ghost" size="sm" className="w-full border border-dashed border-gray-300 text-gray-500 mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Objective
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function TimelineEditor() {
  const [_, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"all" | "active" | "upcoming" | "past">("active");
  
  // Mock data for timeframes and objectives
  const timeframes: TimeframeWithObjectives[] = [
    {
      id: 1,
      name: "Q1 2025",
      description: "First quarter strategic initiatives",
      startDate: "2025-01-01",
      endDate: "2025-03-31",
      cadenceId: 1,
      isActive: false,
      objectives: [
        {
          id: 101,
          title: "Improve Customer Satisfaction",
          description: "Increase NPS score by 15 points",
          level: "company",
          ownerId: 1,
          teamId: null,
          timeframeId: 1,
          status: "in_progress",
          progress: 35,
          parentId: null,
          createdAt: "2024-12-15"
        },
        {
          id: 102,
          title: "Launch Mobile App v2",
          description: "Release new version with improved UX",
          level: "team",
          ownerId: 2,
          teamId: 3,
          timeframeId: 1,
          status: "in_progress",
          progress: 20,
          parentId: 101,
          createdAt: "2024-12-20"
        }
      ]
    },
    {
      id: 2,
      name: "Q2 2025",
      description: "Second quarter strategic initiatives",
      startDate: "2025-04-01",
      endDate: "2025-06-30",
      cadenceId: 1,
      isActive: true,
      objectives: [
        {
          id: 103,
          title: "Expand Market Reach",
          description: "Enter 3 new geographic markets",
          level: "company",
          ownerId: 1,
          teamId: null,
          timeframeId: 2,
          status: "not_started",
          progress: 0,
          parentId: null,
          createdAt: "2025-01-10"
        }
      ]
    },
    {
      id: 3,
      name: "Q3 2025",
      description: "Third quarter strategic initiatives",
      startDate: "2025-07-01",
      endDate: "2025-09-30",
      cadenceId: 1,
      isActive: false,
      objectives: []
    },
    {
      id: 4,
      name: "Q4 2025",
      description: "Fourth quarter strategic initiatives",
      startDate: "2025-10-01",
      endDate: "2025-12-31",
      cadenceId: 1,
      isActive: false,
      objectives: []
    }
  ];

  // Fetch timeframes and objectives from API (commented out for now)
  // const { data: timeframes = [], isLoading } = useQuery<TimeframeWithObjectives[]>({
  //   queryKey: ['/api/timeframes/with-objectives'],
  //   queryFn: getQueryFn({ on401: "throw" }),
  // });

  // Filter timeframes based on view type
  const filteredTimeframes = timeframes.filter(timeframe => {
    const now = new Date();
    const startDate = new Date(timeframe.startDate);
    const endDate = new Date(timeframe.endDate);
    
    switch (viewType) {
      case "active":
        return timeframe.isActive;
      case "upcoming":
        return startDate > now;
      case "past":
        return endDate < now;
      default:
        return true;
    }
  }).filter(timeframe => {
    if (!search) return true;
    
    return (
      timeframe.name.toLowerCase().includes(search.toLowerCase()) ||
      (timeframe.description && timeframe.description.toLowerCase().includes(search.toLowerCase())) ||
      timeframe.objectives.some(obj => 
        obj.title.toLowerCase().includes(search.toLowerCase()) ||
        (obj.description && obj.description.toLowerCase().includes(search.toLowerCase()))
      )
    );
  });

  const findTimeframeByObjectiveId = (objectiveId: string) => {
    return filteredTimeframes.find(timeframe => 
      timeframe.objectives.some(obj => obj.id.toString() === objectiveId)
    );
  };

  const findObjective = (objectiveId: string) => {
    for (const timeframe of filteredTimeframes) {
      const objective = timeframe.objectives.find(obj => obj.id.toString() === objectiveId);
      if (objective) return objective;
    }
    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) {
      setActiveId(null);
      return;
    }
    
    // Check if we're dragging between timeframes
    const activeTimeframe = findTimeframeByObjectiveId(activeId);
    const overObjective = findObjective(overId);
    
    if (!activeTimeframe || !overObjective) {
      setActiveId(null);
      return;
    }
    
    const overTimeframe = filteredTimeframes.find(tf => tf.id === overObjective.timeframeId);
    
    if (!overTimeframe) {
      setActiveId(null);
      return;
    }
    
    if (activeTimeframe.id === overTimeframe.id) {
      // Reordering within the same timeframe
      const newTimeframes = filteredTimeframes.map(timeframe => {
        if (timeframe.id !== activeTimeframe.id) return timeframe;
        
        const oldIndex = timeframe.objectives.findIndex(obj => obj.id.toString() === activeId);
        const newIndex = timeframe.objectives.findIndex(obj => obj.id.toString() === overId);
        
        return {
          ...timeframe,
          objectives: arrayMove(timeframe.objectives, oldIndex, newIndex)
        };
      });
      
      // Here you would update state or call an API to persist changes
      console.log("Reordered objectives within timeframe:", newTimeframes);
    } else {
      // Moving between timeframes
      const activeObjective = findObjective(activeId);
      if (!activeObjective) {
        setActiveId(null);
        return;
      }
      
      const updatedTimeframes = filteredTimeframes.map(timeframe => {
        // Remove from source timeframe
        if (timeframe.id === activeTimeframe.id) {
          return {
            ...timeframe,
            objectives: timeframe.objectives.filter(obj => obj.id.toString() !== activeId)
          };
        }
        
        // Add to destination timeframe
        if (timeframe.id === overTimeframe.id) {
          // Update the objective's timeframeId
          const updatedObjective = {
            ...activeObjective,
            timeframeId: timeframe.id
          };
          
          // Add at the right position
          const overIndex = timeframe.objectives.findIndex(obj => obj.id.toString() === overId);
          const newObjectives = [...timeframe.objectives];
          newObjectives.splice(overIndex, 0, updatedObjective);
          
          return {
            ...timeframe,
            objectives: newObjectives
          };
        }
        
        return timeframe;
      });
      
      // Here you would update state or call an API to persist changes
      console.log("Moved objective between timeframes:", updatedTimeframes);
    }
    
    setActiveId(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Timeline Editor</h1>
            <p className="text-neutral-600 mt-1">
              Plan and organize objectives across different timeframes
            </p>
          </div>
          
          <div className="flex gap-4">
            <Tabs value={viewType} className="w-[400px]" onValueChange={(value) => setViewType(value as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative">
              <Input 
                placeholder="Search timeframes or objectives..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            <Button 
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Timeframe
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-4 min-h-[calc(100vh-200px)]">
              {filteredTimeframes.map((timeframe) => (
                <TimeframeColumn 
                  key={timeframe.id} 
                  timeframe={timeframe} 
                  objectives={timeframe.objectives}
                />
              ))}
              
              <DragOverlay>
                {activeId ? (
                  <div className="w-[280px] opacity-80">
                    <ObjectiveCard objective={findObjective(activeId)!} />
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
        </div>
      </div>
    </DashboardLayout>
  );
}