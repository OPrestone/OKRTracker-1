import { ReactNode } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ObjectiveGroupProps {
  id: string;
  title: string;
  color?: string;
  children: ReactNode;
}

const ObjectiveGroup = ({
  id,
  title,
  color,
  children
}: ObjectiveGroupProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  const getBackgroundColor = () => {
    if (color === "gray") return "bg-gray-50 dark:bg-gray-900";
    if (isOver) return "bg-blue-50 dark:bg-blue-900/20";
    return "bg-white dark:bg-gray-800";
  };

  const getBorderColor = () => {
    if (isOver) return "border-blue-300 dark:border-blue-700";
    return "border-gray-200 dark:border-gray-700";
  };

  const getColorClass = (color?: string) => {
    switch (color) {
      case "blue": return "bg-blue-100 text-blue-800 border-blue-200";
      case "green": return "bg-green-100 text-green-800 border-green-200";
      case "amber": return "bg-amber-100 text-amber-800 border-amber-200";
      case "red": return "bg-red-100 text-red-800 border-red-200";
      case "purple": return "bg-purple-100 text-purple-800 border-purple-200";
      case "indigo": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "gray": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  return (
    <Card 
      ref={setNodeRef}
      className={`${getBackgroundColor()} ${getBorderColor()} transition-colors duration-200 h-full max-h-[calc(100vh-240px)]`}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`${getColorClass(color)} font-medium`}>
            {title}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 overflow-y-auto">
        {children}
      </CardContent>
    </Card>
  );
};

export default ObjectiveGroup;