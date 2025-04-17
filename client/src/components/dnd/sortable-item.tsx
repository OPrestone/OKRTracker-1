import React, { CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DragItem } from '@/lib/dnd-utils';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  id: string | number;
  type: string;
  parentId?: string | number | null;
  index?: number;
  children: React.ReactNode;
  className?: string;
  dragHandleClassName?: string;
  customHandle?: boolean;
}

export function SortableItem({
  id,
  type,
  parentId,
  index,
  children,
  className,
  dragHandleClassName,
  customHandle = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      id,
      type,
      parentId,
      index,
    } as DragItem,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  if (customHandle) {
    // Use a custom drag handle when specified
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "touch-manipulation focus:outline-none",
          className,
          isDragging && "relative z-50"
        )}
      >
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && child.props.className?.includes(dragHandleClassName)) {
            return React.cloneElement(child, {
              ...child.props,
              ...attributes,
              ...listeners,
            });
          }
          return child;
        })}
      </div>
    );
  }

  // Default behavior - entire item is draggable
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-manipulation focus:outline-none cursor-grab active:cursor-grabbing", 
        className,
        isDragging && "relative z-50"
      )}
    >
      {children}
    </div>
  );
}