import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  PlusCircle, 
  Loader2, 
  Circle, 
  Timer, 
  Eye, 
  ListTodo, 
  SortAsc, 
  Filter, 
  Inbox
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTenantContext } from "@/hooks/use-tenant-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Project {
  id: string;
  title: string;
  description: string;
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  assignees: string[];
  comments: number;
  checklistTotal: number;
  checklistCompleted: number;
  tenantId: string;
  createdAt: string;
  updatedAt?: string;
}

// Create form schema for creating/editing projects
const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["backlog", "todo", "in-progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  assignees: z.array(z.string()).default([]),
});

interface KanbanColumn {
  id: string;
  title: string;
  projects: Project[];
}

function SortableItem({ project }: { project: Project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3"
    >
      <ProjectCard project={project} />
    </div>
  );
}

function KanbanCard({ project }: { project: Project }) {
  return <ProjectCard project={project} />;
}

function ProjectCard({ project }: { project: Project }) {
  const { toast } = useToast();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-400",
          icon: "text-emerald-500"
        };
      case "medium":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-700 dark:text-blue-400",
          icon: "text-blue-500"
        };
      case "high":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-400",
          icon: "text-amber-500"
        };
      case "urgent":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/30",
          border: "border-rose-200 dark:border-rose-800",
          text: "text-rose-700 dark:text-rose-400",
          icon: "text-rose-500"
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800/30",
          border: "border-gray-200 dark:border-gray-700",
          text: "text-gray-700 dark:text-gray-400",
          icon: "text-gray-500"
        };
    }
  };
  
  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Project deleted",
        description: "The project has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Format date for display with distance calculation
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const diffTime = date.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dateDisplay = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
      
      let statusDisplay = "";
      if (diffDays < 0) {
        statusDisplay = "Overdue";
      } else if (diffDays === 0) {
        statusDisplay = "Due today";
      } else if (diffDays === 1) {
        statusDisplay = "Due tomorrow";
      } else if (diffDays <= 7) {
        statusDisplay = `Due in ${diffDays} days`;
      } else {
        statusDisplay = "Due";
      }
      
      return { dateDisplay, statusDisplay, diffDays };
    } catch (error) {
      // If date is invalid, return a default
      return { dateDisplay: dateString, statusDisplay: "Due", diffDays: 0 };
    }
  };

  // Calculate completion percentage if there's a checklist
  const completionPercentage = project.checklistTotal > 0
    ? Math.round((project.checklistCompleted / project.checklistTotal) * 100)
    : 0;
    
  const priorityColors = getPriorityColor(project.priority);
  const formattedDate = project.dueDate ? formatDate(project.dueDate) : null;
  
  // Determine if the due date indicates this is overdue
  const isOverdue = formattedDate && formattedDate.diffDays < 0;

  return (
    <Card className={`shadow-sm hover:shadow-md transition-all border ${priorityColors.border} overflow-hidden`}>
      <CardContent className="p-0">
        {/* Priority indicator bar at the top */}
        <div className={`h-1 w-full ${priorityColors.bg}`}></div>
        
        <div className="p-4">
          {/* Card header with title and dropdown */}
          <div className="flex justify-between items-start mb-3">
            <Badge variant="outline" className={`${priorityColors.text} ${priorityColors.border} ${priorityColors.bg}`}>
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Move to...
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this project?')) {
                      deleteProjectMutation.mutate(project.id);
                    }
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Card title and description */}
          <h3 className="font-semibold text-base mb-2 line-clamp-2">{project.title}</h3>
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
          
          {/* Card footer with metadata */}
          <div className="flex flex-col gap-2">
            {/* Due date info */}
            {formattedDate && (
              <div className={`flex items-center text-xs ${isOverdue ? 'text-rose-600' : 'text-gray-500'} mb-1`}>
                <Calendar className={`h-3 w-3 mr-1 ${isOverdue ? 'text-rose-600' : 'text-gray-400'}`} />
                <span>{formattedDate.statusDisplay}: {formattedDate.dateDisplay}</span>
              </div>
            )}
            
            {/* Progress bar if there's a checklist */}
            {project.checklistTotal > 0 && (
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              {/* Assignees avatars */}
              <div className="flex -space-x-2">
                {project.assignees && project.assignees.length > 0 ? (
                  project.assignees.map((assignee, index) => (
                    <Avatar key={index} className="h-7 w-7 border-2 border-white">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {assignee.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">Unassigned</span>
                )}
              </div>
              
              {/* Task metadata */}
              <div className="flex items-center gap-3">
                {project.comments > 0 && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <MessageSquare className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {project.comments}
                  </span>
                )}
                {project.checklistTotal > 0 && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    {project.checklistCompleted}/{project.checklistTotal}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ column, projects }: { column: KanbanColumn; projects: Project[] }) {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "backlog":
        return {
          icon: <Clock className="h-5 w-5 mr-2 text-slate-500" />,
          headerBg: "bg-slate-100 dark:bg-slate-800/50",
          hoverBg: "bg-slate-50/80 dark:bg-slate-800/30",
          border: "border-slate-200 dark:border-slate-700",
          count: "bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
        };
      case "todo":
        return {
          icon: <ListTodo className="h-5 w-5 mr-2 text-blue-500" />,
          headerBg: "bg-blue-50 dark:bg-blue-950/30",
          hoverBg: "bg-blue-50/50 dark:bg-blue-950/20",
          border: "border-blue-100 dark:border-blue-900/50",
          count: "bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-300"
        };
      case "in-progress":
        return {
          icon: <Timer className="h-5 w-5 mr-2 text-amber-500" />,
          headerBg: "bg-amber-50 dark:bg-amber-950/30",
          hoverBg: "bg-amber-50/50 dark:bg-amber-950/20",
          border: "border-amber-100 dark:border-amber-900/50",
          count: "bg-amber-100 text-amber-700 dark:bg-amber-900/70 dark:text-amber-300"
        };
      case "review":
        return {
          icon: <Eye className="h-5 w-5 mr-2 text-purple-500" />,
          headerBg: "bg-purple-50 dark:bg-purple-950/30",
          hoverBg: "bg-purple-50/50 dark:bg-purple-950/20",
          border: "border-purple-100 dark:border-purple-900/50",
          count: "bg-purple-100 text-purple-700 dark:bg-purple-900/70 dark:text-purple-300"
        };
      case "done":
        return {
          icon: <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />,
          headerBg: "bg-emerald-50 dark:bg-emerald-950/30",
          hoverBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
          border: "border-emerald-100 dark:border-emerald-900/50",
          count: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/70 dark:text-emerald-300"
        };
      default:
        return {
          icon: <Circle className="h-5 w-5 mr-2 text-gray-500" />,
          headerBg: "bg-gray-100 dark:bg-gray-800/50",
          hoverBg: "bg-gray-50/80 dark:bg-gray-800/30",
          border: "border-gray-200 dark:border-gray-700",
          count: "bg-gray-200/70 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        };
    }
  };

  const styles = getStatusStyles(column.id);

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border ${styles.border} min-w-[320px] max-w-[350px] flex flex-col h-full`}>
      {/* Column header with colored background */}
      <div className={`${styles.headerBg} rounded-t-lg p-3 border-b ${styles.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {styles.icon}
            <h3 className="text-sm font-medium">{column.title}</h3>
            <div className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${styles.count}`}>
              {projects.length}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Add project
              </DropdownMenuItem>
              <DropdownMenuItem>
                <SortAsc className="h-4 w-4 mr-2" />
                Sort by
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Project cards container */}
      <div className="flex-1 p-2 space-y-3 overflow-y-auto transition-colors"
           style={{
             maxHeight: "calc(100vh - 230px)",
           }}>
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projects.map((project) => (
            <SortableItem key={project.id} project={project} />
          ))}
        </SortableContext>
        
        {/* Empty state when no projects */}
        {projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <Inbox className="h-8 w-8 mb-2 opacity-20" />
            <p>No projects yet</p>
            <p className="text-xs mt-1">Drag projects here or add a new one</p>
          </div>
        )}
      </div>
      
      {/* Quick add button at the bottom */}
      <div className={`p-2 border-t ${styles.border}`}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full flex items-center justify-center text-xs text-gray-500 hover:text-gray-700"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add project
        </Button>
      </div>
    </div>
  );
}

export default function ProjectKanban() {
  const [search, setSearch] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentTenant } = useTenantContext();
  
  // Form for creating new projects
  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "backlog",
      priority: "medium",
      assignees: [],
    },
  });

  // Fetch projects for the current tenant
  const { 
    data: projects = [], 
    isLoading,
    isError,
    refetch
  } = useQuery<Project[]>({
    queryKey: ["/api/projects", currentTenant?.id],
    enabled: !!currentTenant?.id,
  });

  // Create a new project
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof projectFormSchema>) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Project created",
        description: "Your project has been created successfully",
      });
      setIsAddingProject(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a project
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Project> }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update project status specifically (for drag and drop)
  const updateProjectStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/projects/${id}/status`, { status });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update project status",
        description: error.message,
        variant: "destructive",
      });
      // Refresh to get the correct states after a failed update
      refetch();
    },
  });

  // Group projects by status
  const columns: KanbanColumn[] = [
    { id: "backlog", title: "Backlog", projects: [] },
    { id: "todo", title: "To Do", projects: [] },
    { id: "in-progress", title: "In Progress", projects: [] },
    { id: "review", title: "Review", projects: [] },
    { id: "done", title: "Done", projects: [] },
  ];
  
  // If we have projects, organize them into columns
  if (projects.length > 0) {
    projects.forEach(project => {
      const column = columns.find(col => col.id === project.status);
      if (column) {
        // Add some default values for UI rendering if they don't exist
        column.projects.push({
          ...project,
          assignees: project.assignees || [],
          comments: project.comments || 0,
          checklistTotal: project.checklistTotal || 0,
          checklistCompleted: project.checklistCompleted || 0,
        });
      }
    });
  }

  const findColumnByProjectId = (projectId: string) => {
    return columns.find(col => 
      col.projects.some(project => project.id === projectId)
    );
  };

  const findProject = (projectId: string) => {
    for (const column of columns) {
      const project = column.projects.find(p => p.id === projectId);
      if (project) return project;
    }
    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the columns for both items
    const activeColumn = findColumnByProjectId(activeId);
    const overColumn = columns.find(col => col.id === overId) || findColumnByProjectId(overId);
    
    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;
    
    // Find the active project
    const activeProject = findProject(activeId);
    if (!activeProject) return;
    
    // Update the status in the UI first for immediate feedback
    // Update both the UI state and call the API to persist the change
    const newStatus = overColumn.id as "backlog" | "todo" | "in-progress" | "review" | "done";
    
    // This is a simplified approach since we reload from the API after mutation
    columns.forEach(col => {
      // Remove from source column
      if (col.id === activeColumn.id) {
        col.projects = col.projects.filter(p => p.id !== activeId);
      }
      
      // Add to destination column
      if (col.id === overColumn.id) {
        col.projects.push({ ...activeProject, status: newStatus });
      }
    });
    
    // Call the API to update the project status
    updateProjectStatusMutation.mutate({ 
      id: activeId, 
      status: newStatus 
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    if (activeId === overId) {
      setActiveId(null);
      return;
    }
    
    const activeColumn = findColumnByProjectId(activeId);
    const overColumn = findColumnByProjectId(overId);
    
    if (!activeColumn || !overColumn) {
      setActiveId(null);
      return;
    }
    
    if (activeColumn.id === overColumn.id) {
      // Reordering within the same column
      const oldIndex = activeColumn.projects.findIndex(p => p.id === activeId);
      const newIndex = activeColumn.projects.findIndex(p => p.id === overId);
      
      activeColumn.projects = arrayMove(activeColumn.projects, oldIndex, newIndex);
      
      // Note: If you want to persist the order, you would need
      // to add a 'position' field to your projects and update it here
    }
    
    setActiveId(null);
  };

  const filteredColumns = columns.map(column => ({
    ...column,
    projects: column.projects.filter(project => 
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
    )
  }));

  // Show loading state if projects are loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Project Kanban</h1>
              <p className="text-neutral-600 mt-1">
                Manage your projects with drag-and-drop kanban boards
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-neutral-600">Loading projects...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Show error state if there was an error loading projects
  if (isError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Project Kanban</h1>
              <p className="text-neutral-600 mt-1">
                Manage your projects with drag-and-drop kanban boards
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 max-w-md">
              <h3 className="font-semibold mb-2">Error Loading Projects</h3>
              <p>There was a problem loading your projects. Please try again later or contact support if the issue persists.</p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no projects
  if (projects.length === 0 && !isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Project Kanban</h1>
              <p className="text-neutral-600 mt-1">
                Manage your projects with drag-and-drop kanban boards
              </p>
            </div>
            
            <div className="flex gap-4">
              <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create new project</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(data => createProjectMutation.mutate(data))} className="space-y-4 py-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter project title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter project description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="backlog">Backlog</SelectItem>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in-progress">In Progress</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end pt-4">
                        <Button 
                          variant="outline" 
                          className="mr-2" 
                          type="button"
                          onClick={() => {
                            setIsAddingProject(false);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Create Project
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-neutral-600 mb-4">Get started by creating your first project.</p>
              <Button 
                onClick={() => setIsAddingProject(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create First Project
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Main UI with projects
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Project Kanban</h1>
            <p className="text-neutral-600 mt-1">
              Manage your projects with drag-and-drop kanban boards
            </p>
          </div>
          
          <div className="flex gap-4">
            <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new project</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(data => createProjectMutation.mutate(data))} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter project description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="backlog">Backlog</SelectItem>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="review">Review</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end pt-4">
                      <Button 
                        variant="outline" 
                        className="mr-2" 
                        type="button"
                        onClick={() => {
                          setIsAddingProject(false);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createProjectMutation.isPending}
                      >
                        {createProjectMutation.isPending && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        Create Project
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <div className="w-64">
              <Input 
                placeholder="Search projects..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto pb-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-h-[calc(100vh-200px)]">
              {filteredColumns.map(column => (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  projects={column.projects}
                />
              ))}
              
              <DragOverlay>
                {activeId ? (
                  <div className="w-[300px] opacity-80">
                    <KanbanCard project={findProject(activeId)!} />
                  </div>
                ) : null}
              </DragOverlay>
            </div>
          </DndContext>
        </div>
      </div>
    </DashboardLayout>
  );
}