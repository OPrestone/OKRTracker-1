import React from 'react';
import { DraggableObjectiveCard as BaseDraggableObjectiveCard } from '../dnd/draggable-objective-card';

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

interface ObjectiveCardProps {
  objective: Objective;
  containerId?: string;
  className?: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onAddKeyResult?: (id: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  onClick?: (id: number) => void;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  containerId,
  className,
  onEdit,
  onDelete,
  onAddKeyResult,
  onStatusChange,
  onClick,
}) => {
  const { id, title, description, level, status, progress } = objective;

  return (
    <BaseDraggableObjectiveCard
      id={id}
      title={title}
      description={description}
      status={status}
      progress={progress}
      level={level}
      parentId={containerId}
      className={className}
      onEdit={onEdit ? () => onEdit(id) : undefined}
      onDelete={onDelete ? () => onDelete(id) : undefined}
      onAddKeyResult={onAddKeyResult ? () => onAddKeyResult(id) : undefined}
      onStatusChange={onStatusChange}
      onClick={onClick ? () => onClick(id) : undefined}
    />
  );
};

export default ObjectiveCard;