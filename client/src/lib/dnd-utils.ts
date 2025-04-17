import type { Active, Over } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

export interface DragItem {
  id: number | string;
  type: string;
  parentId?: number | string | null;
  index?: number;
}

export type ObjectiveStatus = "draft" | "active" | "completed" | "archived" | "on_track" | "at_risk" | "behind";

export function extractDragData(active: Active | null): DragItem | null {
  if (!active || !active.data.current) {
    return null;
  }
  return active.data.current as DragItem;
}

export function extractDropData(over: Over | null): DragItem | null {
  if (!over || !over.data.current) {
    return null;
  }
  return over.data.current as DragItem;
}

export function isSameContainer(active: DragItem, over: DragItem): boolean {
  // Check if both items are in the same container (same parent, or same status column in kanban view)
  return active.parentId === over.parentId || active.type === over.type;
}

// Reordering within the same container (parent/status)
export function reorderItems<T>(items: T[], activeId: string | number, overId: string | number): T[] {
  const oldIndex = items.findIndex((item: any) => item.id === activeId);
  const newIndex = items.findIndex((item: any) => item.id === overId);
  
  return arrayMove(items, oldIndex, newIndex);
}

// Moving an item to a new container (changing parent/status)
export function moveItemToContainer<T extends { id: number | string }>(
  sourceContainer: T[],
  destinationContainer: T[],
  activeId: string | number
): { sourceItems: T[], destinationItems: T[] } {
  const activeItem = sourceContainer.find(item => item.id === activeId);
  
  if (!activeItem) {
    return { sourceItems: sourceContainer, destinationItems: destinationContainer };
  }
  
  const newSourceItems = sourceContainer.filter(item => item.id !== activeId);
  const newDestinationItems = [...destinationContainer, activeItem];
  
  return {
    sourceItems: newSourceItems,
    destinationItems: newDestinationItems
  };
}

// Maps the progress value to a status color class
export function getProgressColorClass(progress: number | null): string {
  if (progress === null) return "bg-gray-200 dark:bg-gray-700";
  
  if (progress <= 25) return "bg-red-500 dark:bg-red-700";
  if (progress <= 50) return "bg-orange-500 dark:bg-orange-700";
  if (progress <= 75) return "bg-yellow-500 dark:bg-yellow-700";
  return "bg-green-500 dark:bg-green-700";
}

// Maps the status to a color class
export function getStatusColorClass(status: string): string {
  switch (status) {
    case "on_track":
      return "bg-green-500 dark:bg-green-700";
    case "at_risk":
      return "bg-yellow-500 dark:bg-yellow-700";
    case "behind":
      return "bg-red-500 dark:bg-red-700";
    case "completed":
      return "bg-blue-500 dark:bg-blue-700";
    case "draft":
      return "bg-gray-300 dark:bg-gray-600";
    case "archived":
      return "bg-gray-500 dark:bg-gray-800";
    default:
      return "bg-gray-200 dark:bg-gray-700";
  }
}

// Get text color based on status
export function getStatusTextClass(status: string): string {
  switch (status) {
    case "on_track":
      return "text-green-600 dark:text-green-400";
    case "at_risk":
      return "text-yellow-600 dark:text-yellow-400";
    case "behind":
      return "text-red-600 dark:text-red-400";
    case "completed":
      return "text-blue-600 dark:text-blue-400";
    case "draft":
      return "text-gray-600 dark:text-gray-400";
    case "archived":
      return "text-gray-700 dark:text-gray-300";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

// Get a friendly name for a status
export function getStatusName(status: string): string {
  switch (status) {
    case "on_track":
      return "On Track";
    case "at_risk":
      return "At Risk";
    case "behind":
      return "Behind";
    case "completed":
      return "Completed";
    case "draft":
      return "Draft";
    case "archived":
      return "Archived";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
  }
}