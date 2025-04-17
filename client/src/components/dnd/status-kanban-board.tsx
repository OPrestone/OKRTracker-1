import React, { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getProgressColorClass, 
  getStatusColorClass, 
  getStatusName,
  extractDragData,
  DragItem
} from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { DraggableObjectiveCard } from './draggable-objective-card';

// Define the interface for an objective item
interface ObjectiveItem {
  id: string | number;
  title: string;
  description?: string | null;
  status: string;
  progress?: number | null;
  level?: string;
  parentId?: number | string | null;
}

// Interface for status column props
interface StatusColumnProps {
  status: string;
  title: string;
  objectives: ObjectiveItem[];
  className?: string;
  onAddObjective?: (status: string) => void;
}

// Status column component
function StatusColumn({ status, title, objectives, className, onAddObjective }: StatusColumnProps) {
  // Use the useDroppable hook to make this column a drop target
  const { setNodeRef, isOver } = useDroppable({
    id: `status-${status}`,
    data: {
      type: 'status',
      status,
      accepts: ['objective']
    }
  });

  // Return the column component
  return (
    <Card 
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full border rounded-md shadow-sm", 
        isOver && "ring-2 ring-primary ring-inset bg-primary/5",
        className
      )}
    >
      <CardHeader className="py-2 px-3 bg-muted/30 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center">
            <div 
              className={cn(
                "w-2 h-2 rounded-full mr-2",
                getStatusColorClass(status)
              )} 
            />
            {title}
            <span className="ml-2 text-xs text-muted-foreground">({objectives.length})</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-2">
          {objectives.map((objective) => (
            <DraggableObjectiveCard
              key={objective.id}
              id={objective.id}
              title={objective.title}
              description={objective.description}
              status={objective.status}
              progress={objective.progress}
              level={objective.level}
              parentId={status}
              isCompact={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Status types to use in the Kanban board
const statusTypes = [
  { id: 'draft', name: 'Draft' },
  { id: 'on_track', name: 'On Track' },
  { id: 'at_risk', name: 'At Risk' },
  { id: 'behind', name: 'Behind' },
  { id: 'completed', name: 'Completed' },
  { id: 'archived', name: 'Archived' }
];

// Interface for the Kanban board props
interface StatusKanbanBoardProps {
  objectives: ObjectiveItem[];
  onObjectiveStatusChange: (objectiveId: string | number, newStatus: string) => void;
  onAddObjective?: (status: string) => void;
  className?: string;
}

// Main Kanban board component
export function StatusKanbanBoard({ 
  objectives, 
  onObjectiveStatusChange,
  onAddObjective,
  className 
}: StatusKanbanBoardProps) {
  // State for tracking the active drag item
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeObjective, setActiveObjective] = useState<ObjectiveItem | null>(null);
  
  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Group objectives by status
  const objectivesByStatus = statusTypes.reduce<Record<string, ObjectiveItem[]>>((acc, status) => {
    acc[status.id] = objectives.filter(obj => obj.status === status.id);
    return acc;
  }, {});
  
  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id);
    
    const draggedObjective = objectives.find(obj => obj.id === active.id);
    if (draggedObjective) {
      setActiveObjective(draggedObjective);
    }
  }
  
  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveObjective(null);
    
    if (!over) return;
    
    // Extract data from the drag operation
    const activeData = extractDragData(active);
    const overId = over.id.toString();
    
    // Check if we're dropping onto a status column
    if (overId.startsWith('status-')) {
      const newStatus = overId.replace('status-', '');
      
      // Call the status change callback
      if (active.id !== newStatus) {
        onObjectiveStatusChange(active.id, newStatus);
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 h-full", className)}>
        {statusTypes.map(status => (
          <StatusColumn
            key={status.id}
            status={status.id}
            title={status.name}
            objectives={objectivesByStatus[status.id] || []}
            onAddObjective={onAddObjective ? () => onAddObjective(status.id) : undefined}
          />
        ))}
      </div>
      
      {/* Drag overlay to show what's being dragged */}
      <DragOverlay>
        {activeId && activeObjective && (
          <div className="w-60">
            <DraggableObjectiveCard
              id={activeObjective.id}
              title={activeObjective.title}
              description={activeObjective.description}
              status={activeObjective.status}
              progress={activeObjective.progress}
              level={activeObjective.level}
              isCompact={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}