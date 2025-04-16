import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TeamObjective {
  id: number;
  title: string;
  progress: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
}

interface TeamCardProps {
  id: number;
  name: string;
  memberCount: number;
  progress: number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  objectives: TeamObjective[];
  onViewDetails: (id: number) => void;
}

const TeamCard = ({
  id,
  name,
  memberCount,
  progress,
  icon,
  iconBgColor,
  iconColor,
  objectives,
  onViewDetails
}: TeamCardProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on_track':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">85%</Badge>;
      case 'at_risk':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">60%</Badge>;
      case 'behind':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">35%</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">100%</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{progress}%</Badge>;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-5 border-b border-gray-200">
        <div className="flex items-center mb-4">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
            style={{ backgroundColor: iconBgColor }}
          >
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-gray-500">{memberCount} members</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Key Objectives</span>
          <span className="text-xs font-medium text-gray-500">{objectives.length} total</span>
        </div>
        
        <div className="text-sm">
          {objectives.map((objective, index) => (
            <div 
              key={objective.id}
              className={`flex items-center justify-between mb-2 pb-2 ${
                index < objectives.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <span>{objective.title}</span>
              {getStatusBadge(objective.status)}
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          className="mt-4 w-full"
          onClick={() => onViewDetails(id)}
        >
          View Team Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamCard;
