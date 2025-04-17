import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface Objective {
  id: number;
  title: string;
  description?: string;
  level?: string;
  status: string;
  progress: number;
  owner?: {
    id: number;
    name: string;
    role?: string;
  };
  keyResults?: any[];
}

interface ObjectiveCardProps {
  objective: Objective;
  isDragging?: boolean;
}

const ObjectiveCard = ({
  objective,
  isDragging = false,
}: ObjectiveCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'on track':
        return 'bg-green-100 text-green-800';
      case 'at risk':
        return 'bg-amber-100 text-amber-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card 
      className={`overflow-hidden shadow-sm transition-all cursor-grab ${
        isDragging 
          ? "shadow-md rotate-1 border-dashed" 
          : "hover:shadow"
      }`}
      data-objective-id={objective.id}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={getStatusColor(objective.status)}>
              {objective.status}
            </Badge>
            
            {objective.level && (
              <Badge variant="outline" className="bg-indigo-100 text-indigo-800">
                {objective.level}
              </Badge>
            )}
          </div>
          
          <h3 className="font-medium text-sm line-clamp-2">
            {objective.title}
          </h3>
          
          {objective.description && (
            <p className="text-xs text-gray-500 line-clamp-2">
              {objective.description}
            </p>
          )}
          
          <div className="pt-1">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Progress</span>
              <span>{objective.progress}%</span>
            </div>
            <Progress 
              value={objective.progress} 
              className="h-1.5"
              indicatorClassName={getProgressColor(objective.progress)}
            />
          </div>
          
          {objective.owner && (
            <div className="flex items-center mt-2 pt-2 border-t border-gray-100 text-gray-500 text-xs">
              <User className="h-3 w-3 mr-1" />
              <span>{objective.owner.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectiveCard;