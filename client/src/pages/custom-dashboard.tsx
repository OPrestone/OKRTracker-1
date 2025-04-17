import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Import icons
import {
  ArrowDownUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Grid,
  LayoutGrid,
  LineChart,
  ListTodo,
  MessageSquare,
  RotateCcw,
  Save,
  Settings,
  Target,
  Users,
} from "lucide-react";

// Import DnD Kit components
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSwappingStrategy,
} from '@dnd-kit/sortable';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';

// Import custom components
import { DashboardWidget } from "@/components/dashboard/dashboard-widget";
import { ResizableWidget } from "@/components/dashboard/resizable-widget";
import { WidgetCatalog } from "@/components/dashboard/widget-catalog";

// Types
interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: number;
  data?: any;
}

const widgetSizeMap = {
  'sm': 'col-span-3', // 1/4 width
  'md': 'col-span-4', // 1/3 width
  'lg': 'col-span-6', // 1/2 width
  'xl': 'col-span-12', // full width
};

const CustomDashboard = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States
  const [activeId, setActiveId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [editMode, setEditMode] = useState(false);
  
  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch user dashboard layout
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['/api/user/dashboard'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/user/dashboard');
        return response.json();
      } catch (error) {
        // If API fails or not available yet, return default layout
        return { widgets: getDefaultWidgets() };
      }
    },
  });

  // Fetch required data for widgets
  const { data: objectives = [] } = useQuery({
    queryKey: ['/api/objectives'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/objectives');
      return response.json();
    },
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teams');
      return response.json();
    },
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['/api/check-ins'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/check-ins');
      return response.json();
    },
  });

  // Save dashboard layout
  const saveDashboardMutation = useMutation({
    mutationFn: async (widgets: Widget[]) => {
      const response = await apiRequest('POST', '/api/user/dashboard', { widgets });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Dashboard saved',
        description: 'Your custom dashboard layout has been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/dashboard'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save dashboard',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set initial widgets from dashboard data
  useEffect(() => {
    if (dashboardData && dashboardData.widgets) {
      setWidgets(dashboardData.widgets);
    } else {
      setWidgets(getDefaultWidgets());
    }
  }, [dashboardData]);

  // Get default widgets
  const getDefaultWidgets = (): Widget[] => {
    return [
      {
        id: 'progress-summary',
        type: 'progress-summary',
        title: 'OKR Progress Summary',
        size: 'lg',
        position: 0,
      },
      {
        id: 'my-objectives',
        type: 'my-objectives',
        title: 'My Objectives',
        size: 'md',
        position: 1,
      },
      {
        id: 'recent-check-ins',
        type: 'recent-check-ins',
        title: 'Recent Check-ins',
        size: 'md',
        position: 2,
      },
      {
        id: 'team-performance',
        type: 'team-performance',
        title: 'Team Performance',
        size: 'xl',
        position: 3,
      },
      {
        id: 'upcoming-deadlines',
        type: 'upcoming-deadlines',
        title: 'Upcoming Deadlines',
        size: 'md',
        position: 4,
      },
      {
        id: 'recent-activity',
        type: 'recent-activity',
        title: 'Recent Activity',
        size: 'md',
        position: 5,
      },
    ];
  };

  // Add new widget
  const addWidget = (widgetType: string) => {
    const newWidget: Widget = {
      id: `${widgetType}-${Date.now()}`,
      type: widgetType,
      title: getWidgetTitle(widgetType),
      size: 'md',
      position: widgets.length,
    };
    
    setWidgets([...widgets, newWidget]);
    
    toast({
      title: 'Widget added',
      description: `${getWidgetTitle(widgetType)} widget has been added to your dashboard.`,
    });
  };

  // Remove widget
  const removeWidget = (widgetId: string) => {
    setWidgets(widgets.filter(widget => widget.id !== widgetId));
  };

  // Reset layout to default
  const resetLayout = () => {
    setWidgets(getDefaultWidgets());
    toast({
      title: 'Layout reset',
      description: 'Your dashboard has been reset to the default layout.',
    });
  };

  // Save the current layout
  const saveLayout = () => {
    saveDashboardMutation.mutate(widgets);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      // If turning off edit mode, save the layout
      saveLayout();
    }
  };

  // Get widget title based on type
  const getWidgetTitle = (type: string): string => {
    switch (type) {
      case 'progress-summary':
        return 'OKR Progress Summary';
      case 'my-objectives':
        return 'My Objectives';
      case 'team-performance':
        return 'Team Performance';
      case 'recent-check-ins':
        return 'Recent Check-ins';
      case 'upcoming-deadlines':
        return 'Upcoming Deadlines';
      case 'recent-activity':
        return 'Recent Activity';
      case 'objective-completion':
        return 'Objective Completion Rate';
      case 'team-alignment':
        return 'Team Alignment';
      case 'key-metrics':
        return 'Key Metrics';
      default:
        return 'New Widget';
    }
  };

  // Handle resize of a widget
  const handleResize = (id: string, newSize: 'sm' | 'md' | 'lg' | 'xl') => {
    setWidgets(
      widgets.map(widget => 
        widget.id === id ? { ...widget, size: newSize } : widget
      )
    );
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update positions
        return newItems.map((item, index) => ({
          ...item,
          position: index,
        }));
      });
    }
    
    setActiveId(null);
  };

  // Get the currently active widget
  const getActiveWidget = () => {
    return widgets.find(widget => widget.id === activeId);
  };

  return (
    <DashboardLayout title="Custom Dashboard">
      <div className="space-y-4">
        {isError && (
          <Alert variant="destructive">
            <AlertDescription>
              There was an error loading your dashboard. Please try again.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 pb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">My Dashboard</h1>
            <Badge variant={editMode ? "default" : "outline"} className="ml-2">
              {editMode ? "Edit Mode" : "View Mode"}
            </Badge>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={toggleEditMode}
            >
              {editMode ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Layout
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Edit Layout
                </>
              )}
            </Button>
            
            {editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetLayout}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
        
        <Separator />
        
        {isLoading ? (
          <div className="grid grid-cols-12 gap-4 mt-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="col-span-6 h-64 animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {editMode && (
              <div className="mb-6 p-4 border rounded-lg bg-muted">
                <h2 className="text-lg font-medium mb-2">Available Widgets</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  <WidgetCatalog onAddWidget={addWidget} />
                </div>
              </div>
            )}
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToWindowEdges]}
            >
              <SortableContext 
                items={widgets.map(widget => widget.id)}
                strategy={rectSwappingStrategy}
              >
                <div className="grid grid-cols-12 gap-4 mt-4">
                  {widgets
                    .sort((a, b) => a.position - b.position)
                    .map((widget) => (
                      <ResizableWidget
                        key={widget.id}
                        widget={widget}
                        editMode={editMode}
                        className={widgetSizeMap[widget.size]}
                        onRemove={() => removeWidget(widget.id)}
                        onResize={(newSize) => handleResize(widget.id, newSize)}
                      >
                        <DashboardWidget
                          widget={widget}
                          objectives={objectives}
                          teams={teams}
                          checkIns={checkIns}
                        />
                      </ResizableWidget>
                    ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeId ? (
                  <div className="opacity-80 shadow-lg">
                    <Card className={`${widgetSizeMap[getActiveWidget()?.size || 'md']}`}>
                      <CardHeader className="pb-2">
                        <CardTitle>{getActiveWidget()?.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 flex items-center justify-center h-32 border-2 border-dashed rounded">
                          <p className="text-muted-foreground text-center">
                            {getActiveWidget()?.title} Content
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </>
        )}
        
        <div className="bg-muted rounded-lg p-4 mt-8">
          <h3 className="font-medium mb-2">How to customize your dashboard</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Click "Edit Layout" to enter edit mode</li>
            <li>Drag and drop widgets to rearrange them</li>
            <li>Resize widgets using the resize handles in edit mode</li>
            <li>Add new widgets from the widget catalog</li>
            <li>Remove widgets by clicking the X in the corner</li>
            <li>Click "Save Layout" when you're done to save your changes</li>
            <li>Your layout will be remembered the next time you log in</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomDashboard;