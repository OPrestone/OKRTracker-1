import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, Target, LucideGitBranch, ArrowUpDown, Filter, MoreVertical, Plus } from "lucide-react";
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
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

interface ObjectiveGroup {
  id: string;
  title: string;
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
      className="mb-3"
    >
      <ObjectiveCard objective={objective} />
    </div>
  );
}

function ObjectiveCard({ objective }: { objective: Objective }) {
  const getStatusBadge = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800";
    
    switch (status) {
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
        return "bg-red-100 text-red-800";
      case "complete":
        return "bg-green-100 text-green-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "company":
        return <LucideGitBranch className="h-4 w-4 mr-1" />;
      case "team":
        return <LucideGitBranch className="h-4 w-4 mr-1" />;
      case "personal":
        return <Target className="h-4 w-4 mr-1" />;
      default:
        return <Target className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <Card className="shadow-sm hover:shadow transition-shadow cursor-grab">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="flex items-center text-xs">
            {getLevelIcon(objective.level)}
            {objective.level.charAt(0).toUpperCase() + objective.level.slice(1)}
          </Badge>
          
          <Badge className={`text-xs ${getStatusBadge(objective.status)}`}>
            {objective.status ? objective.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not Started'}
          </Badge>
        </div>
        
        <h3 className="font-medium text-sm mb-2">{objective.title}</h3>
        {objective.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{objective.description}</p>
        )}
        
        <div className="mt-3">
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

function ObjectiveGroup({ group, objectives }: { group: ObjectiveGroup; objectives: Objective[] }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 min-w-[300px] h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <h3 className="text-sm font-medium">{group.title}</h3>
          <Badge variant="outline" className="ml-2 text-xs">
            {objectives.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <SortableContext items={objectives.map(o => o.id.toString())} strategy={verticalListSortingStrategy}>
          {objectives.map((objective) => (
            <SortableObjective key={objective.id} objective={objective} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ObjectivesOrganizer() {
  const [_, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"priority" | "status" | "level" | "owner">("status");
  
  // Fetch objectives from API
  const { data: objectives = [], isLoading } = useQuery<Objective[]>({
    queryKey: ['/api/objectives'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Generate groups based on the selected view type
  const [groups, setGroups] = useState<ObjectiveGroup[]>([]);

  useEffect(() => {
    if (!objectives.length) return;
    
    let newGroups: ObjectiveGroup[] = [];
    
    switch (viewType) {
      case "status":
        newGroups = [
          { id: "not_started", title: "Not Started", objectives: [] },
          { id: "in_progress", title: "In Progress", objectives: [] },
          { id: "at_risk", title: "At Risk", objectives: [] },
          { id: "behind", title: "Behind", objectives: [] },
          { id: "complete", title: "Complete", objectives: [] },
        ];
        
        objectives.forEach(obj => {
          const status = obj.status || "not_started";
          const groupIndex = newGroups.findIndex(g => g.id === status);
          if (groupIndex !== -1) {
            newGroups[groupIndex].objectives.push(obj);
          } else {
            newGroups[0].objectives.push(obj);
          }
        });
        break;
        
      case "level":
        newGroups = [
          { id: "company", title: "Company", objectives: [] },
          { id: "team", title: "Team", objectives: [] },
          { id: "personal", title: "Personal", objectives: [] },
        ];
        
        objectives.forEach(obj => {
          const groupIndex = newGroups.findIndex(g => g.id === obj.level);
          if (groupIndex !== -1) {
            newGroups[groupIndex].objectives.push(obj);
          }
        });
        break;
        
      case "priority":
        newGroups = [
          { id: "urgent", title: "Urgent", objectives: [] },
          { id: "high", title: "High", objectives: [] },
          { id: "medium", title: "Medium", objectives: [] },
          { id: "low", title: "Low", objectives: [] },
        ];
        
        // For this example, we'll distribute objectives randomly
        objectives.forEach(obj => {
          const randomIndex = Math.floor(Math.random() * newGroups.length);
          newGroups[randomIndex].objectives.push(obj);
        });
        break;
        
      case "owner":
        // Group by owner
        const ownerGroups = objectives.reduce((acc, obj) => {
          const ownerId = obj.ownerId.toString();
          if (!acc[ownerId]) {
            acc[ownerId] = {
              id: ownerId,
              title: `Owner ${ownerId}`,
              objectives: []
            };
          }
          acc[ownerId].objectives.push(obj);
          return acc;
        }, {} as Record<string, ObjectiveGroup>);
        
        newGroups = Object.values(ownerGroups);
        break;
    }
    
    // Filter objectives based on search
    if (search) {
      newGroups = newGroups.map(group => ({
        ...group,
        objectives: group.objectives.filter(
          obj => obj.title.toLowerCase().includes(search.toLowerCase()) ||
                (obj.description && obj.description.toLowerCase().includes(search.toLowerCase()))
        )
      }));
    }
    
    setGroups(newGroups);
  }, [objectives, viewType, search]);

  const findGroupByObjectiveId = (objectiveId: string) => {
    return groups.find(group => 
      group.objectives.some(obj => obj.id.toString() === objectiveId)
    );
  };

  const findObjective = (objectiveId: string) => {
    for (const group of groups) {
      const objective = group.objectives.find(obj => obj.id.toString() === objectiveId);
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
    
    const activeGroup = findGroupByObjectiveId(activeId);
    const overGroup = findGroupByObjectiveId(overId);
    
    if (!activeGroup || !overGroup) {
      setActiveId(null);
      return;
    }
    
    if (activeGroup.id === overGroup.id) {
      // Reordering within the same group
      setGroups(currentGroups => {
        return currentGroups.map(group => {
          if (group.id !== activeGroup.id) return group;
          
          const oldIndex = group.objectives.findIndex(obj => obj.id.toString() === activeId);
          const newIndex = group.objectives.findIndex(obj => obj.id.toString() === overId);
          
          return {
            ...group,
            objectives: arrayMove(group.objectives, oldIndex, newIndex)
          };
        });
      });
    } else {
      // Moving between groups
      setGroups(currentGroups => {
        const updatedGroups = currentGroups.map(group => {
          // Remove from source group
          if (group.id === activeGroup.id) {
            return {
              ...group,
              objectives: group.objectives.filter(obj => obj.id.toString() !== activeId)
            };
          }
          
          // Add to destination group
          if (group.id === overGroup.id) {
            const activeObjective = findObjective(activeId);
            if (!activeObjective) return group;
            
            // Find position to insert
            const overObjectiveIndex = group.objectives.findIndex(obj => obj.id.toString() === overId);
            
            const newObjectives = [...group.objectives];
            newObjectives.splice(overObjectiveIndex, 0, activeObjective);
            
            return {
              ...group,
              objectives: newObjectives
            };
          }
          
          return group;
        });
        
        return updatedGroups;
      });
    }
    
    setActiveId(null);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Objectives Organizer</h1>
            <p className="text-neutral-600 mt-1">
              Rearrange and organize objectives with drag-and-drop
            </p>
          </div>
          
          <div className="flex gap-4">
            <Select value={viewType} onValueChange={(value) => setViewType(value as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="level">By Level</SelectItem>
                <SelectItem value="priority">By Priority</SelectItem>
                <SelectItem value="owner">By Owner</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Input 
                placeholder="Search objectives..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
            </div>
            
            <Button 
              onClick={() => navigate("/create-objective")}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Objective
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-6">
          {isLoading ? (
            <div className="flex space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-100 rounded-lg h-[500px] w-[300px] animate-pulse"></div>
              ))}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex space-x-4 min-h-[calc(100vh-200px)]">
                {groups.map((group) => (
                  <ObjectiveGroup 
                    key={group.id} 
                    group={group} 
                    objectives={group.objectives}
                  />
                ))}
                
                <DragOverlay>
                  {activeId ? (
                    <div className="w-[300px] opacity-80">
                      <ObjectiveCard objective={findObjective(activeId)!} />
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}