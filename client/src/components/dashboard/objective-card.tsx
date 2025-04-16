import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, 
  Edit, 
  MoreHorizontal, 
  User, 
  Calendar 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KeyResult {
  id: number;
  title: string;
  progress: number;
  status: string;
  color: string;
}

interface ObjectiveCardProps {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  owner: {
    name: string;
    role?: string;
  };
  timeframe: string;
  progress: number;
  keyResults: KeyResult[];
  onEdit?: (id: number) => void;
  onView?: (id: number) => void;
}

const ObjectiveCard = ({
  id,
  title,
  description,
  type,
  status,
  owner,
  timeframe,
  progress,
  keyResults,
  onEdit,
  onView
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressRingColor = (progress: number) => {
    if (progress >= 75) return '#10B981'; // green
    if (progress >= 50) return '#3B82F6'; // blue
    if (progress >= 25) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const handleView = () => {
    if (onView) onView(id);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(id);
  };

  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="p-5 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <Badge variant="outline" className="mr-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                {type}
              </Badge>
              <Badge variant="outline" className={`${getStatusColor(status)} hover:${getStatusColor(status)}`}>
                {status}
              </Badge>
            </div>
            
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-600 mb-3">{description}</p>
            
            <div className="flex items-center text-sm text-gray-500">
              <div className="flex items-center mr-4">
                <User className="h-4 w-4 mr-1" />
                <span>{owner.name} (Owner)</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{timeframe}</span>
              </div>
            </div>
          </div>
          
          <div className="ml-6 flex-shrink-0">
            <div className="relative group">
              <svg className="w-16 h-16" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="2"></circle>
                <circle 
                  className="transition-all duration-500 ease-in-out" 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  stroke={getProgressRingColor(progress)} 
                  strokeWidth="2" 
                  strokeDasharray="100" 
                  strokeDashoffset={100 - progress}
                  transform="rotate(-90 18 18)"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{progress}%</span>
              </div>
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {progress}% complete
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5">
        <h4 className="font-medium text-sm mb-3">Key Results</h4>
        
        {keyResults.map((keyResult) => (
          <div className="mb-3" key={keyResult.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <span 
                  className="w-4 h-4 rounded-full mr-3" 
                  style={{ backgroundColor: keyResult.color }}
                ></span>
                <span className="text-sm font-medium">{keyResult.title}</span>
              </div>
              <span className="text-sm font-medium">{keyResult.progress}%</span>
            </div>
            <Progress value={keyResult.progress} className="h-1.5" />
          </div>
        ))}
        
        <div className="mt-4 border-t border-gray-100 pt-4 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleView}
            className="text-primary hover:text-primary-focus hover:bg-primary-50"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Details
          </Button>
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-gray-500 hover:text-gray-700 mr-3"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Add Key Result</DropdownMenuItem>
                <DropdownMenuItem>Add Initiative</DropdownMenuItem>
                <DropdownMenuItem>Create Check-in</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectiveCard;
