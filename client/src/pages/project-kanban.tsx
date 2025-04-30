import { useState, useRef } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, MoreHorizontal, Calendar, MessageSquare, CheckCircle, Clock, AlertCircle, PlusCircle } from "lucide-react";
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
}

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
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <Badge className={getPriorityColor(project.priority)}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h3 className="font-semibold text-base mb-1">{project.title}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>
        
        {project.dueDate && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Due {project.dueDate}</span>
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          <div className="flex -space-x-2">
            {project.assignees.map((assignee, index) => (
              <Avatar key={index} className="h-6 w-6 border-2 border-white">
                <AvatarFallback className="text-xs">{assignee.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {project.comments > 0 && (
              <span className="text-xs text-gray-500 flex items-center">
                <MessageSquare className="h-3 w-3 mr-1" />
                {project.comments}
              </span>
            )}
            {project.checklistTotal > 0 && (
              <span className="text-xs text-gray-500 flex items-center">
                <CheckCircle className="h-3 w-3 mr-1" />
                {project.checklistCompleted}/{project.checklistTotal}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanColumn({ column, projects }: { column: KanbanColumn; projects: Project[] }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "backlog":
        return <Clock className="h-4 w-4 mr-2 text-gray-500" />;
      case "todo":
        return <PlusCircle className="h-4 w-4 mr-2 text-blue-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 mr-2 text-orange-500" />;
      case "review":
        return <AlertCircle className="h-4 w-4 mr-2 text-purple-500" />;
      case "done":
        return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 min-w-[300px] h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {getStatusIcon(column.id)}
          <h3 className="text-sm font-medium">{column.title}</h3>
          <Badge variant="outline" className="ml-2 text-xs font-normal">
            {projects.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projects.map((project) => (
            <SortableItem key={project.id} project={project} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function ProjectKanban() {
  const [search, setSearch] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: "backlog",
      title: "Backlog",
      projects: [
        {
          id: "p1",
          title: "Update user authentication system",
          description: "Implement new security features and update the login flow",
          status: "backlog",
          priority: "medium",
          dueDate: "Mar 25, 2025",
          assignees: ["John D", "Sarah M"],
          comments: 3,
          checklistTotal: 5,
          checklistCompleted: 0
        },
        {
          id: "p2",
          title: "Refactor CSS codebase",
          description: "Update to use Tailwind CSS and remove legacy styles",
          status: "backlog",
          priority: "low",
          assignees: ["Emma L"],
          comments: 0,
          checklistTotal: 3,
          checklistCompleted: 0
        }
      ]
    },
    {
      id: "todo",
      title: "To Do",
      projects: [
        {
          id: "p3",
          title: "Optimize database queries",
          description: "Improve performance of slow-running queries on the user dashboard",
          status: "todo",
          priority: "high",
          dueDate: "Mar 15, 2025",
          assignees: ["Michael T", "David K"],
          comments: 2,
          checklistTotal: 4,
          checklistCompleted: 1
        }
      ]
    },
    {
      id: "in-progress",
      title: "In Progress",
      projects: [
        {
          id: "p4",
          title: "Implement new analytics dashboard",
          description: "Create visualizations for key metrics using Chart.js",
          status: "in-progress",
          priority: "high",
          dueDate: "Mar 10, 2025",
          assignees: ["Alex W", "Jessica R"],
          comments: 8,
          checklistTotal: 6,
          checklistCompleted: 2
        },
        {
          id: "p5",
          title: "Build email notification system",
          description: "Create templates and implement delivery for user notifications",
          status: "in-progress",
          priority: "medium",
          assignees: ["Ryan M"],
          comments: 1,
          checklistTotal: 3,
          checklistCompleted: 1
        }
      ]
    },
    {
      id: "review",
      title: "Review",
      projects: [
        {
          id: "p6",
          title: "Fix mobile responsiveness issues",
          description: "Address display problems on small screens and tablets",
          status: "review",
          priority: "urgent",
          dueDate: "Mar 5, 2025",
          assignees: ["Sarah M", "John D"],
          comments: 4,
          checklistTotal: 7,
          checklistCompleted: 6
        }
      ]
    },
    {
      id: "done",
      title: "Done",
      projects: [
        {
          id: "p7",
          title: "Update privacy policy page",
          description: "Review and update legal texts for GDPR compliance",
          status: "done",
          priority: "medium",
          assignees: ["Lisa T"],
          comments: 2,
          checklistTotal: 4,
          checklistCompleted: 4
        },
        {
          id: "p8",
          title: "Fix login page bugs",
          description: "Address form submission errors and validation issues",
          status: "done",
          priority: "high",
          assignees: ["Michael T"],
          comments: 0,
          checklistTotal: 5,
          checklistCompleted: 5
        }
      ]
    }
  ]);

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
    
    setColumns(cols => {
      const activeProject = findProject(activeId);
      if (!activeProject) return cols;
      
      return cols.map(col => {
        // Remove from source column
        if (col.id === activeColumn.id) {
          return {
            ...col,
            projects: col.projects.filter(p => p.id !== activeId)
          };
        }
        
        // Add to destination column
        if (col.id === overColumn.id) {
          return {
            ...col,
            projects: [...col.projects, { ...activeProject, status: overColumn.id as any }]
          };
        }
        
        return col;
      });
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
      setColumns(cols => {
        return cols.map(col => {
          if (col.id !== activeColumn.id) return col;
          
          const oldIndex = col.projects.findIndex(p => p.id === activeId);
          const newIndex = col.projects.findIndex(p => p.id === overId);
          
          return {
            ...col,
            projects: arrayMove(col.projects, oldIndex, newIndex)
          };
        });
      });
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
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input placeholder="Enter project title" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input placeholder="Enter project description" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Input placeholder="Select status" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Input placeholder="Select priority" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" className="mr-2" onClick={() => setIsAddingProject(false)}>
                    Cancel
                  </Button>
                  <Button>
                    Create Project
                  </Button>
                </div>
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