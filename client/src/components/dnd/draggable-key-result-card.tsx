import React from 'react';
import { SortableItem } from './sortable-item';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { getProgressColorClass } from '@/lib/dnd-utils';

export interface DraggableKeyResultCardProps {
  id: number | string;
  title: string;
  description?: string | null;
  progress?: number | null;
  objectiveId?: number | string | null;
  className?: string;
  index?: number;
  isCompact?: boolean;
  onEdit?: (id: number | string) => void;
  onDelete?: (id: number | string) => void;
  onAddInitiative?: (id: number | string) => void;
  onCheckIn?: (id: number | string) => void;
  onClick?: (id: number | string) => void;
}

export function DraggableKeyResultCard({
  id,
  title,
  description,
  progress = 0,
  objectiveId,
  className,
  index,
  isCompact = false,
  onEdit,
  onDelete,
  onAddInitiative,
  onCheckIn,
  onClick,
}: DraggableKeyResultCardProps) {
  const handleClick = () => {
    if (onClick) onClick(id);
  };

  return (
    <SortableItem 
      id={id}
      type="key-result"
      parentId={objectiveId}
      index={index}
      className={cn("w-full", className)}
      customHandle
      dragHandleClassName="drag-handle"
    >
      <Card 
        className="border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow duration-200"
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
                    {onAddInitiative && (
                      <DropdownMenuItem onClick={() => onAddInitiative(id)}>
                        Add Initiative
                      </DropdownMenuItem>
                    )}
                    {onCheckIn && (
                      <DropdownMenuItem onClick={() => onCheckIn(id)}>
                        Check-in
                      </DropdownMenuItem>
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
              
              <div className="mt-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className="font-medium">{progress ?? 0}%</span>
                </div>
                <Progress 
                  value={progress ?? 0} 
                  className="h-1.5 bg-gray-100 dark:bg-gray-800"
                  indicatorClassName={getProgressColorClass(progress)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );
}