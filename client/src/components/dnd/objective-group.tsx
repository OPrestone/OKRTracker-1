import React from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { SortableContainer } from './sortable-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronRight, GripHorizontal } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { extractDragData, extractDropData } from '@/lib/dnd-utils';

export interface ObjectiveGroupProps {
  id: string | number;
  title: string;
  description?: string;
  children: React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onAddObjective?: () => void;
  items: Array<{ id: string | number }>;
  className?: string;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  isDraggable?: boolean;
}

export function ObjectiveGroup({
  id,
  title,
  description,
  children,
  onDragEnd,
  onDragOver,
  onAddObjective,
  items,
  className,
  isCollapsible = true,
  defaultOpen = true,
  isDraggable = false,
}: ObjectiveGroupProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `group-${id}`,
    data: {
      type: 'group',
      id,
      accepts: ['objective']
    }
  });

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = extractDragData(active);
    const overData = extractDropData(over);
    
    if (activeData?.type === 'objective' && overData?.type === 'group') {
      // Drag is over a group, not an item in the group
      console.log('Dragging over group', overData.id);
    }
    
    if (onDragOver) {
      onDragOver(event);
    }
  }

  const GroupComponent = isDraggable ? DraggableGroupWrapper : React.Fragment;
  const groupProps = isDraggable ? { id } : {};

  return (
    <GroupComponent {...groupProps}>
      <Card 
        className={cn(
          "mb-4 border shadow-sm", 
          className
        )}
        ref={setDroppableRef}
      >
        {isCollapsible ? (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center space-x-2">
                {isDraggable && (
                  <GripHorizontal className="h-5 w-5 text-gray-400 drag-handle cursor-grab active:cursor-grabbing" />
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CardTitle className="text-md font-medium">{title}</CardTitle>
              </div>
              
              {onAddObjective && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onAddObjective}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs">Add Objective</span>
                </Button>
              )}
            </CardHeader>
            
            <CollapsibleContent>
              <CardContent className="pt-0 px-3 pb-3">
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
                )}
                
                <SortableContainer
                  items={items}
                  id={`group-${id}-container`}
                  type="objective-list"
                  onDragEnd={onDragEnd}
                  onDragOver={handleDragOver}
                  className="space-y-2"
                >
                  {children}
                </SortableContainer>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <>
            <CardHeader className="py-2 px-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center space-x-2">
                {isDraggable && (
                  <GripHorizontal className="h-5 w-5 text-gray-400 drag-handle cursor-grab active:cursor-grabbing" />
                )}
                <CardTitle className="text-md font-medium">{title}</CardTitle>
              </div>
              
              {onAddObjective && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onAddObjective}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="text-xs">Add Objective</span>
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="pt-0 px-3 pb-3">
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{description}</p>
              )}
              
              <SortableContainer
                items={items}
                id={`group-${id}-container`}
                type="objective-list"
                onDragEnd={onDragEnd}
                onDragOver={handleDragOver}
                className="space-y-2"
              >
                {children}
              </SortableContainer>
            </CardContent>
          </>
        )}
      </Card>
    </GroupComponent>
  );
}

function DraggableGroupWrapper({ id, children }: { id: string | number, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `draggable-group-${id}`,
    data: {
      type: 'group',
      id
    }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  } : undefined;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        isDragging && "relative z-50"
      )}
    >
      {children}
    </div>
  );
}