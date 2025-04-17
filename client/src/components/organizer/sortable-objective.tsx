import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ObjectiveCard from "./draggable-objective-card";

interface Objective {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress: number;
  owner?: {
    id: number;
    name: string;
    role?: string;
  };
  keyResults?: any[];
}

interface SortableObjectiveProps {
  id: string;
  objective: Objective;
}

export function SortableObjective({
  id,
  objective
}: SortableObjectiveProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
      aria-roledescription="sortable"
    >
      <ObjectiveCard objective={objective} isDragging={isDragging} />
    </div>
  );
}