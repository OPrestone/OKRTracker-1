import React from 'react';
import { SortableItem } from '../dnd/sortable-item';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getProgressColorClass, getStatusColorClass, getStatusName } from '@/lib/dnd-utils';

interface Objective {
  id: number;
  title: string;
  description?: string;
  level: string;
  status: string;
  progress: number;
  timeframeId: number;
  teamId?: number;
}

interface SortableObjectiveProps {
  objective: Objective;
  containerId: string;
  className?: string;
}

export function SortableObjective({ objective, containerId, className }: SortableObjectiveProps) {
  const { id, title, description, level, status, progress } = objective;
  const itemId = `${containerId}-${id}`;

  return (
    <SortableItem
      id={itemId}
      type="objective"
      parentId={containerId}
      className={className}
    >
      <Card 
        className={cn(
          "border-l-4 hover:shadow-md transition-shadow duration-200",
          getStatusColorClass(status).replace('bg-', 'border-l-')
        )}
      >
        <CardContent className="py-3 px-4">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-sm">{title}</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className={getStatusTextClass(status)}>
                  {getStatusName(status)}
                </Badge>
                <Badge variant="secondary">
                  {level}
                </Badge>
              </div>
            </div>
            
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
            )}
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress 
                value={progress} 
                className="h-1.5"
                indicatorClassName={getProgressColorClass(progress)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </SortableItem>
  );
}

function getStatusTextClass(status: string): string {
  switch (status.toLowerCase()) {
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