import React from 'react';
import { SortableItem } from './sortable-item';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, MoreHorizontal, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export interface DraggableInitiativeCardProps {
  id: number | string;
  title: string;
  description?: string | null;
  status?: 'not_started' | 'in_progress' | 'completed' | string;
  dueDate?: string | Date | null;
  parentId?: number | string | null;
  keyResultId?: number | string | null;
  className?: string;
  index?: number;
  isCompact?: boolean;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onStatusChange?: (id: number | string, status: string) => void;
  onClick?: (id: number | string) => void;
}

export function DraggableInitiativeCard({
  id,
  title,
  description,
  status = 'not_started',
  dueDate,
  parentId,
  keyResultId,
  className,
  index,
  isCompact = false,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: DraggableInitiativeCardProps) {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  // Format date if present
  const formattedDate = dueDate 
    ? new Date(dueDate).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    : null;
  
  // Get icon based on status
  const getStatusIcon = () => {
    switch(status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'not_started':
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  // Get badge variant based on status
  const getStatusBadgeVariant = () => {
    switch(status) {
      case 'completed':
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100";
      case 'in_progress':
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100";
      case 'not_started':
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100";
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch(status) {
      case 'completed':
        return "Completed";
      case 'in_progress':
        return "In Progress";
      case 'not_started':
        return "Not Started";
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
  };

  return (
    <SortableItem 
      id={id}
      type="initiative"
      parentId={parentId || keyResultId}
      index={index}
      className={cn("w-full", className)}
      customHandle
      dragHandleClassName="drag-handle"
    >
      <Card 
        className={cn(
          "border hover:shadow-sm transition-shadow duration-200",
          status === 'completed' ? "bg-green-50 dark:bg-green-900/10" : ""
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start space-x-2">
            <GripVertical className="h-5 w-5 mt-0.5 text-gray-400 shrink-0 drag-handle cursor-grab active:cursor-grabbing" />
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium mb-1 truncate">{title}</h3>
                
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
                    {onStatusChange && (
                      <>
                        <DropdownMenuItem onClick={() => onStatusChange(id, 'not_started')}>
                          Mark Not Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(id, 'in_progress')}>
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange(id, 'completed')}>
                          Mark Completed
                        </DropdownMenuItem>
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
              </div>
              
              {!isCompact && description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{description}</p>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs flex items-center space-x-1 px-2 py-0 h-5",
                    getStatusBadgeVariant()
                  )}
                >
                  {getStatusIcon()}
                  <span>{getStatusText()}</span>
                </Badge>
                
                {formattedDate && (
                  <span className="text-xs text-gray-500">Due {formattedDate}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );
}