import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import { DragItem, extractDragData, extractDropData, isSameContainer } from '@/lib/dnd-utils';

export interface SortableContainerProps {
  children: React.ReactNode;
  items: { id: string | number }[];
  id?: string;
  type?: string;
  className?: string;
  strategy?: 'vertical' | 'grid';
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  restrictToParent?: boolean;
  handleIds?: (string | number)[];
  hideDragOverlay?: boolean;
}

export function SortableContainer({
  children,
  items,
  id = 'sortable-container',
  type = 'default',
  className,
  strategy = 'vertical',
  onDragStart,
  onDragEnd,
  onDragOver,
  restrictToParent = true,
  hideDragOverlay = false,
}: SortableContainerProps) {
  const [activeId, setActiveId] = useState<string | number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Minimum drag distance before activation
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id);

    if (onDragStart) {
      onDragStart(event);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (onDragOver) {
      onDragOver(event);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const activeData = extractDragData(active);
      const overData = extractDropData(over);

      if (activeData && overData && isSameContainer(activeData, overData)) {
        // Handle reordering logic if container handles its own data
        if (onDragEnd) {
          onDragEnd(event);
        }
      } else if (onDragEnd) {
        // Let parent handle cross-container moves
        onDragEnd(event);
      }
    }
  }

  const modifiers = restrictToParent ? [restrictToParentElement] : [];
  const sortingStrategy = strategy === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <SortableContext items={items} strategy={sortingStrategy}>
        <div className={cn('relative', className)}>
          {children}
        </div>
      </SortableContext>
      
      {!hideDragOverlay && activeId && (
        <DragOverlay>
          {/* Custom drag overlay if needed */}
        </DragOverlay>
      )}
    </DndContext>
  );
}

// Import sortableKeyboardCoordinates from '@dnd-kit/sortable'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { DragOverlay } from '@dnd-kit/core';