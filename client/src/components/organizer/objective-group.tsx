import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SortableObjective } from "./sortable-objective";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface ObjectiveGroupProps {
  id: string;
  title: string;
  description?: string;
  objectives: Objective[];
}

export function ObjectiveGroup({
  id,
  title,
  description,
  objectives
}: ObjectiveGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-200",
        isOver && "border-primary/60 bg-primary/5"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="font-normal">
            {objectives.length} {objectives.length === 1 ? "objective" : "objectives"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {objectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 rounded-md border border-dashed text-muted-foreground">
            <p className="text-sm">
              Drag objectives here to add them to this group
            </p>
          </div>
        ) : (
          <SortableContext
            id={id}
            items={objectives.map(obj => `${id}-${obj.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {objectives.map((objective) => (
                <SortableObjective
                  key={`${id}-${objective.id}`}
                  id={`${id}-${objective.id}`}
                  objective={objective}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}