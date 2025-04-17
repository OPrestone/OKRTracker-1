import { useState, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  MoveHorizontal,
  GripHorizontal,
  Maximize2,
  Minimize2,
  Settings,
  Square,
  SquareDashedBottom,
  X,
} from "lucide-react";

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: number;
  data?: any;
}

interface ResizableWidgetProps {
  widget: Widget;
  editMode: boolean;
  className?: string;
  children: ReactNode;
  onRemove: () => void;
  onResize: (newSize: 'sm' | 'md' | 'lg' | 'xl') => void;
}

export function ResizableWidget({
  widget,
  editMode,
  className,
  children,
  onRemove,
  onResize
}: ResizableWidgetProps) {
  const [resizing, setResizing] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: widget.id,
    disabled: !editMode || resizing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const sizeOptions = [
    { value: 'sm', label: 'Small', icon: <Minimize2 className="h-4 w-4" /> },
    { value: 'md', label: 'Medium', icon: <Square className="h-4 w-4" /> },
    { value: 'lg', label: 'Large', icon: <SquareDashedBottom className="h-4 w-4" /> },
    { value: 'xl', label: 'Full Width', icon: <Maximize2 className="h-4 w-4" /> },
  ];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${className} transition-all duration-200 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center">
          {editMode && (
            <div
              className="cursor-grab mr-2 touch-none"
              {...attributes}
              {...listeners}
            >
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="text-base">{widget.title}</CardTitle>
        </div>
        
        {editMode && (
          <div className="flex items-center space-x-1">
            <Popover onOpenChange={setResizing}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoveHorizontal className="h-4 w-4" />
                  <span className="sr-only">Resize</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Widget Size</p>
                  <ToggleGroup 
                    type="single" 
                    size="sm" 
                    value={widget.size}
                    onValueChange={(value) => {
                      if (value) onResize(value as 'sm' | 'md' | 'lg' | 'xl');
                    }}
                  >
                    {sizeOptions.map(option => (
                      <ToggleGroupItem 
                        key={option.value} 
                        value={option.value}
                        aria-label={option.label}
                        className="flex flex-col gap-1 h-auto py-2 px-3"
                      >
                        {option.icon}
                        <span className="text-xs">{option.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              onClick={onRemove}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}