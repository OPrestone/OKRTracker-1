import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomProgress } from "@/components/ui/custom-progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GripVertical, MoreVertical, Target } from "lucide-react";

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

interface ObjectiveCardProps {
  objective: Objective;
  isDragging?: boolean;
}

const ObjectiveCard = ({ objective, isDragging }: ObjectiveCardProps) => {
  // Get color for progress bar
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-red-500";
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "on track":
        return "bg-green-100 text-green-800 border-green-300";
      case "at risk":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "behind":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className={`border ${
        isDragging ? "border-primary/50 shadow-md" : "border-border"
      }`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="mt-1">
              <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium line-clamp-2">{objective.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 h-5 ${getStatusColor(
                    objective.status
                  )}`}
                >
                  {objective.status}
                </Badge>
                
                {objective.owner && (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={`https://avatar.vercel.sh/${objective.owner.id}`} alt={objective.owner.name} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(objective.owner.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {objective.owner.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-md flex items-center justify-center">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span>{objective.progress}%</span>
          </div>
          <CustomProgress 
            value={objective.progress} 
            className="h-1.5"
            indicatorClassName={getProgressColor(objective.progress)}
          />
        </div>

        {objective.keyResults && objective.keyResults.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-xs text-muted-foreground mb-2">
              <Target className="h-3 w-3 mr-1" />
              <span>Key Results ({objective.keyResults.length})</span>
            </div>
            <div className="space-y-1.5">
              {objective.keyResults.slice(0, 2).map((kr, idx) => (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between">
                    <span className="line-clamp-1">{kr.title}</span>
                    <span>{kr.progress}%</span>
                  </div>
                  <CustomProgress
                    value={kr.progress}
                    className="h-1 mt-0.5"
                    indicatorClassName={getProgressColor(kr.progress)}
                  />
                </div>
              ))}
              {objective.keyResults.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{objective.keyResults.length - 2} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ObjectiveCard;