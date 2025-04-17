import React from 'react';
import { SortableItem } from './sortable-item';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { getProgressColorClass, getStatusColorClass, getStatusName } from '@/lib/dnd-utils';

export interface DraggableObjectiveCardProps {
  id: number | string;
  title: string;
  description?: string | null;
  status?: string;
  progress?: number | null;
  level?: string;
  parentId?: number | string | null;
  className?: string;
  index?: number;
  isCompact?: boolean;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onAddKeyResult?: (id: number | string) => void;
  onAddInitiative?: (id: number | string) => void;
  onStatusChange?: (id: number | string, status: string) => void;
  onClick?: (id: number | string) => void;
}

export function DraggableObjectiveCard({
  id,
  title,
  description,
  status = 'draft',
  progress = 0,
  level = 'team',
  parentId,
  className,
  index,
  isCompact = false,
  onEdit,
  onDelete,
  onAddKeyResult,
  onAddInitiative,
  onStatusChange,
  onClick,
}: DraggableObjectiveCardProps) {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  return (
    <SortableItem 
      id={id}
      type="objective"
      parentId={parentId}
      index={index}
      className={cn("w-full", className)}
      customHandle
      dragHandleClassName="drag-handle"
    >
      <Card 
        className={cn(
          "border-l-4",
          status ? getStatusColorClass(status).replace('bg-', 'border-') : 'border-l-gray-300',
          "hover:shadow-md transition-shadow duration-200"
        )}
        onClick={handleClick}
      >
        <CardHeader className="py-2 px-3 flex flex-row items-center space-x-2 justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="h-5 w-5 text-gray-400 shrink-0 drag-handle cursor-grab active:cursor-grabbing" />
            
            <div className="flex items-center space-x-2">
              <Badge 
                className={cn(
                  "text-xs mr-2",
                  level === 'company' ? 'bg-primary' : 'bg-secondary'
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Badge>
              
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  getStatusTextClass(status)
                )}
              >
                {getStatusName(status)}
              </Badge>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>Edit</DropdownMenuItem>
              )}
              {onAddKeyResult && (
                <DropdownMenuItem onClick={() => onAddKeyResult(id)}>Add Key Result</DropdownMenuItem>
              )}
              {onAddInitiative && (
                <DropdownMenuItem onClick={() => onAddInitiative(id)}>Add Initiative</DropdownMenuItem>
              )}
              {onStatusChange && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(id, 'on_track')}>Mark On Track</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(id, 'at_risk')}>Mark At Risk</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(id, 'behind')}>Mark Behind</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(id, 'completed')}>Mark Completed</DropdownMenuItem>
                </>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  className="text-red-600 dark:text-red-400"
                  onClick={() => onDelete(id)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className={cn("px-3", isCompact ? "py-1" : "py-2")}>
          <h3 className="text-sm font-medium mb-1 truncate">{title}</h3>
          
          {!isCompact && description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
          )}
          
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span>Progress</span>
              <span>{progress ?? 0}%</span>
            </div>
            <Progress 
              value={progress ?? 0} 
              className="h-1.5 bg-gray-100 dark:bg-gray-800"
              indicatorClassName={getProgressColorClass(progress)}
            />
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );
}

function getStatusTextClass(status: string): string {
  switch (status) {
    case 'on_track':
      return 'text-green-600 dark:text-green-400';
    case 'at_risk':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'behind':
      return 'text-red-600 dark:text-red-400';
    case 'completed':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}