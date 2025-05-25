import { useState, useEffect } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Target, 
  Calendar, 
  User, 
  Building,
  MessageSquare, 
  CheckCircle, 
  PlusCircle, 
  Clock, 
  Edit, 
  Trash2, 
  ChevronLeft,
  BarChart3,
  AlignLeft,
  CheckSquare,
  AlertCircle
} from "lucide-react";

// Types for the Objective Detail based on the database schema
interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  teamId?: string;
  role?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  ownerId?: string;
}

interface Timeframe {
  id: string;
  name: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

interface DbKeyResult {
  id: string;
  title: string;
  description?: string;
  objectiveId: string;
  currentValue?: string;
  targetValue?: string;
  startValue?: string;
  assignedToId?: string;
  progress?: number;
  status?: string;
  tenantId?: string;
  createdAt?: string;
  
  // Relations
  assignedTo?: User;
}

interface DbInitiative {
  id: string;
  title: string;
  description?: string;
  status: string;
  keyResultId: string;
  ownerId?: string;
  dueDate?: string;
  completed: boolean;
  tenantId: string;
  createdAt?: string;
  
  // Relations
  owner?: User;
}

interface DbCheckIn {
  id: string;
  userId: string;
  objectiveId?: string;
  keyResultId?: string;
  progress?: number;
  notes?: string;
  tenantId?: string;
  createdAt?: string;
  
  // Relations
  user?: User;
}

interface DbObjective {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  timeframeId: string;
  status: string; // Using objectiveStatusEnum
  progress: number;
  parentId?: string;
  tenantId: string;
  level: string;
  isApproved: boolean;
  createdAt?: string;
  
  // Relations
  owner?: User;
  team?: Team;
  timeframe?: Timeframe;
  keyResults?: DbKeyResult[];
  checkIns?: DbCheckIn[];
  initiatives?: DbInitiative[];
}

// Sample data for the objective
const objectiveData: DbObjective = {
  id: 101,
  title: "Launch mobile app redesign",
  description: "Complete redesign and release of our mobile application with improved user experience and new features based on customer feedback. Focus on performance optimization and better onboarding flow to increase user activation.",
  progress: 85,
  status: "on_track",
  timeframe: "Q3 2023",
  startDate: "July 1, 2023",
  endDate: "September 30, 2023",
  owner: {
    id: 1,
    name: "Alex Johnson",
    initials: "AJ",
    role: "Product Manager"
  },
  team: {
    id: 2,
    name: "Product Development"
  },
  lastUpdated: "August 26, 2023",
  keyResults: [
    {
      id: 1001,
      title: "Complete UI design revisions",
      description: "Finalize all UI design changes and get approval from stakeholders",
      progress: 100,
      status: "completed",
      owner: {
        id: 2,
        name: "Emma Taylor",
        initials: "ET"
      },
      dueDate: "August 15, 2023",
      lastUpdated: "August 14, 2023"
    },
    {
      id: 1002,
      title: "Implement backend API changes",
      description: "Update backend APIs to support new features and improve performance",
      progress: 90,
      status: "on_track",
      owner: {
        id: 3,
        name: "David Lee",
        initials: "DL"
      },
      dueDate: "September 1, 2023",
      lastUpdated: "August 25, 2023"
    },
    {
      id: 1003,
      title: "Reach 95% test coverage",
      description: "Implement comprehensive test suite to ensure quality and stability",
      progress: 80,
      status: "at_risk",
      owner: {
        id: 4,
        name: "Sofia Martinez",
        initials: "SM"
      },
      dueDate: "September 10, 2023",
      lastUpdated: "August 23, 2023"
    },
    {
      id: 1004,
      title: "Execute beta testing program",
      description: "Recruit users and conduct beta testing program to gather feedback",
      progress: 70,
      status: "on_track",
      owner: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      },
      dueDate: "September 20, 2023",
      lastUpdated: "August 24, 2023"
    }
  ],
  initiatives: [
    {
      id: 2001,
      title: "Develop new onboarding flow",
      description: "Create simplified onboarding process to increase activation rate",
      status: "completed",
      dueDate: "August 10, 2023",
      owner: {
        id: 5,
        name: "Ryan Cooper",
        initials: "RC"
      }
    },
    {
      id: 2002,
      title: "Optimize app performance",
      description: "Improve app load time and responsiveness",
      status: "in_progress",
      dueDate: "September 5, 2023",
      owner: {
        id: 3,
        name: "David Lee",
        initials: "DL"
      }
    },
    {
      id: 2003,
      title: "Update analytics implementation",
      description: "Add new event tracking to capture user behavior",
      status: "in_progress",
      dueDate: "September 15, 2023",
      owner: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      }
    }
  ],
  checkIns: [
    {
      id: 3001,
      user: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      },
      date: "August 26, 2023",
      progress: 85,
      previousProgress: 80,
      notes: "Backend API changes are almost complete. Test coverage is improving but still at risk of not meeting target. Beta testing preparations are on track."
    },
    {
      id: 3002,
      user: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      },
      date: "August 19, 2023",
      progress: 80,
      previousProgress: 70,
      notes: "UI design completed ahead of schedule. Starting to recruit beta testers. Need to focus more resources on increasing test coverage."
    },
    {
      id: 3003,
      user: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      },
      date: "August 12, 2023",
      progress: 70,
      previousProgress: 60,
      notes: "New onboarding flow has been implemented and tested. UI designs are nearly finalized. Backend work is progressing well."
    }
  ],
  todos: [
    {
      id: 4001,
      title: "Finalize beta tester list",
      completed: true,
      dueDate: "August 25, 2023",
      assignee: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      }
    },
    {
      id: 4002,
      title: "Prepare beta testing instructions",
      completed: false,
      dueDate: "September 5, 2023",
      assignee: {
        id: 1,
        name: "Alex Johnson",
        initials: "AJ"
      }
    },
    {
      id: 4003,
      title: "Review test coverage report",
      completed: false,
      dueDate: "September 2, 2023",
      assignee: {
        id: 4,
        name: "Sofia Martinez",
        initials: "SM"
      }
    },
    {
      id: 4004,
      title: "Prepare launch communications",
      completed: false,
      dueDate: "September 15, 2023",
      assignee: {
        id: 6,
        name: "Jamie Wilson",
        initials: "JW"
      }
    }
  ]
};

export default function ObjectiveDetail() {
  // Get the route parameters and extract the objective ID from different possible routes
  const [matchesSimpleRoute, simpleParams] = useRoute("/objective/:id");
  const [matchesPluralRoute, pluralParams] = useRoute("/objectives/:id");
  const [matchesTenantRoute, tenantParams] = useRoute("/:tenantId/objective/:objectiveId");
  const [matchesOrgRoute, orgParams] = useRoute("/organization/:organisation/objective/:id");
  
  // Use the first matching route's parameters
  const objectiveId = simpleParams?.id || pluralParams?.id || tenantParams?.objectiveId || orgParams?.id;
  const [progressValue, setProgressValue] = useState<string>("0");
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [newCheckInNotes, setNewCheckInNotes] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { currentTenant } = useTenantContext();
  
  // For debugging
  console.log("Route params:", { simpleParams, tenantParams, orgParams });
  console.log("Objective ID from URL:", objectiveId);
  
  // Fetch the objective data from API with tenant context
  const { data: objective, isLoading: objectiveLoading, isError: objectiveError } = useQuery({
    queryKey: ['/api/objectives', objectiveId],
    queryFn: async () => {
      if (!objectiveId) {
        throw new Error("Missing objectiveId");
      }
      
      console.log("Fetching objective with ID:", objectiveId);
      
      // Explicitly add tenantId to ensure proper authorization
      const response = await apiRequest(
        'GET', 
        `/api/objectives/${objectiveId}`
      );
      
      if (!response.ok) {
        console.error("Error response:", await response.text());
        throw new Error(`Error fetching objective: ${response.statusText}`);
      }
      
      return await response.json() as DbObjective;
    },
    enabled: !!objectiveId && !!currentTenant?.id,
    retry: 3
  });

  // Fetch key results related to this objective
  const { data: keyResults, isLoading: keyResultsLoading } = useQuery({
    queryKey: ['/api/key-results', objectiveId],
    queryFn: async () => {
      if (!objectiveId) {
        throw new Error("Missing objectiveId");
      }
      
      console.log("Fetching key results for objective:", objectiveId);
      
      const response = await apiRequest(
        'GET', 
        `/api/objectives/${objectiveId}/key-results`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching key results: ${response.statusText}`);
      }
      
      return await response.json() as DbKeyResult[];
    },
    enabled: !!objectiveId && !!currentTenant?.id,
  });

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      if (!currentTenant?.id) {
        throw new Error("Missing tenant");
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/teams?tenantId=${currentTenant.id}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching teams: ${response.statusText}`);
      }
      
      return await response.json() as Team[];
    },
    enabled: !!currentTenant?.id,
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      if (!currentTenant?.id) {
        throw new Error("Missing tenant");
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/users?tenantId=${currentTenant.id}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.statusText}`);
      }
      
      return await response.json() as User[];
    },
    enabled: !!currentTenant?.id,
  });

  // Fetch check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['/api/check-ins', objectiveId],
    queryFn: async () => {
      if (!objectiveId || !currentTenant?.id) {
        throw new Error("Missing objectiveId or tenant");
      }
      
      const response = await apiRequest(
        'GET', 
        `/api/check-ins?objectiveId=${objectiveId}&tenantId=${currentTenant.id}`
      );
      
      if (!response.ok) {
        throw new Error(`Error fetching check-ins: ${response.statusText}`);
      }
      
      return await response.json() as DbCheckIn[];
    },
    enabled: !!objectiveId && !!currentTenant?.id,
  });

  // Update progress value when objective data changes
  useEffect(() => {
    if (objective && objective.progress !== undefined) {
      setProgressValue(objective.progress.toString());
    }
  }, [objective]);

  // Helper function to determine progress color class based on value
  const getProgressColorClass = (progress: number): string => {
    if (progress >= 76) return "text-green-600";
    if (progress >= 51) return "text-yellow-600";
    if (progress >= 26) return "text-orange-600";
    return "text-red-600";
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch(status) {
      case "on_track": return "bg-green-100 text-green-800";
      case "at_risk": return "bg-amber-100 text-amber-800";
      case "behind": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string): string => {
    switch(status) {
      case "on_track": return "On Track";
      case "at_risk": return "At Risk";
      case "behind": return "Behind";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  // Helper function to get initiative status color
  const getInitiativeStatusColor = (status: string): string => {
    switch(status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "not_started": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get initiative status text
  const getInitiativeStatusText = (status: string): string => {
    switch(status) {
      case "completed": return "Completed";
      case "in_progress": return "In Progress";
      case "not_started": return "Not Started";
      default: return "Unknown";
    }
  };

  // Handle progress update with real API
  const handleProgressUpdate = async () => {
    const newProgress = parseInt(progressValue, 10);
    if (isNaN(newProgress) || newProgress < 0 || newProgress > 100) {
      toast({
        title: "Invalid Progress Value",
        description: "Progress must be a number between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    if (!objective || !currentTenant?.id) {
      toast({
        title: "Cannot Update Progress",
        description: "Missing objective data or tenant information.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare the update data
      const updateData = {
        progress: newProgress,
        tenantId: currentTenant.id
      };

      // Make API request to update objective
      const response = await apiRequest(
        'PATCH',
        `/api/objectives/${objective.id}?tenantId=${currentTenant.id}`,
        updateData
      );

      if (!response.ok) {
        throw new Error(`Error updating progress: ${response.statusText}`);
      }

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/objectives', objective.id] });
      
      setProgressDialogOpen(false);
      
      toast({
        title: "Progress Updated",
        description: `Progress has been updated to ${newProgress}%.`,
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Error Updating Progress",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Handle check-in submission with real API
  const handleCheckInSubmit = async () => {
    if (!newCheckInNotes.trim()) {
      toast({
        title: "Check-in Notes Required",
        description: "Please provide notes for your check-in.",
        variant: "destructive",
      });
      return;
    }

    if (!objective || !currentTenant?.id) {
      toast({
        title: "Cannot Add Check-in",
        description: "Missing objective data or tenant information.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the check-in data model
      const checkInData: Partial<DbCheckIn> = {
        userId: users?.[0]?.id, // Currently logged in user
        objectiveId: objective.id,
        progress: objective.progress,
        notes: newCheckInNotes,
        tenantId: currentTenant.id
      };

      // Make API request to create check-in
      const response = await apiRequest(
        'POST',
        `/api/check-ins?tenantId=${currentTenant.id}`,
        checkInData
      );

      if (!response.ok) {
        throw new Error(`Error creating check-in: ${response.statusText}`);
      }

      // Get the newly created check-in
      const newCheckIn = await response.json() as DbCheckIn;

      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins', objective.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/objectives', objective.id] });

      // Clear form and close dialog
      setNewCheckInNotes("");
      setCheckInDialogOpen(false);
      
      toast({
        title: "Check-in Added",
        description: "Your check-in has been recorded successfully.",
      });
    } catch (error) {
      console.error("Error adding check-in:", error);
      toast({
        title: "Error Adding Check-in",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  // Toggle todo completion
  const toggleTodo = (todoId: number) => {
    const updatedTodos = objective.todos.map(todo => 
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );

    setObjective({
      ...objective,
      todos: updatedTodos
    });

    toast({
      title: "Todo Updated",
      description: `Todo has been ${updatedTodos.find(t => t.id === todoId)?.completed ? 'completed' : 'uncompleted'}.`,
    });
  };

  // Go back to previous page
  const handleGoBack = () => {
    navigate("/my-okrs");
  };

  // Combine all loading states
  const isLoading = objectiveLoading || keyResultsLoading || teamsLoading || usersLoading || checkInsLoading;

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Loading Objective...">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading objective data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (objectiveError || !objective) {
    return (
      <DashboardLayout title="Objective Not Found">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Objective Not Found</h2>
          <p className="text-muted-foreground">The objective you are looking for does not exist or you do not have access to it.</p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Objective Detail">
      <div className="mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getStatusColor(objective.status)}>
                {getStatusText(objective.status)}
              </Badge>
              <Badge variant="outline">{objective.timeframe}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{objective.title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setCheckInDialogOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              New Check-in
            </Button>
            <Button onClick={() => setProgressDialogOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Update Progress
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content area - 2/3 width */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium">Progress</h3>
                      <span className={`text-lg font-bold ${getProgressColorClass(objective.progress)}`}>
                        {objective.progress}%
                      </span>
                    </div>
                    <Progress value={objective.progress} className="h-2 mb-1" />
                    <p className="text-xs text-gray-500">Last updated: {objective.lastUpdated}</p>
                  </div>
                  
                  <div className="flex items-start space-x-8 text-sm">
                    <div>
                      <p className="text-gray-500 mb-1">Start Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {objective.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">End Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {objective.endDate}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{objective.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="key-results" className="space-y-4">
            <TabsList>
              <TabsTrigger value="key-results">
                <Target className="h-4 w-4 mr-2" />
                Key Results
              </TabsTrigger>
              <TabsTrigger value="initiatives">
                <CheckSquare className="h-4 w-4 mr-2" />
                Initiatives
              </TabsTrigger>
              <TabsTrigger value="check-ins">
                <MessageSquare className="h-4 w-4 mr-2" />
                Check-ins
              </TabsTrigger>
              <TabsTrigger value="todos">
                <CheckCircle className="h-4 w-4 mr-2" />
                To-Dos
              </TabsTrigger>
            </TabsList>
            
            {/* Key Results Tab */}
            <TabsContent value="key-results" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Key Results</CardTitle>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Key Result
                    </Button>
                  </div>
                  <CardDescription>
                    Measurable outcomes that define success for this objective
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {objective?.keyResults?.length > 0 ? (
                    objective.keyResults.map((keyResult) => (
                      <div key={keyResult.id} className="border rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{keyResult.title || 'Untitled Key Result'}</h3>
                              <Badge className={getStatusColor(keyResult.status || 'not_started')}>
                                {getStatusText(keyResult.status || 'not_started')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{keyResult.description || 'No description provided'}</p>
                          </div>
                          <div className={`text-xl font-bold ${getProgressColorClass(keyResult.progress || 0)}`}>
                            {keyResult.progress || 0}%
                          </div>
                        </div>
                        
                        <Progress value={keyResult.progress || 0} className="h-2 mb-3" />
                        
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {keyResult.assignedTo?.name || 'Unassigned'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="h-4 w-4 mr-1" />
                              Update Progress
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No key results found for this objective
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Initiatives Tab */}
            <TabsContent value="initiatives" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Initiatives</CardTitle>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Initiative
                    </Button>
                  </div>
                  <CardDescription>
                    Projects and activities that contribute to achieving the key results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {objective?.initiatives?.length > 0 ? (
                    objective.initiatives.map((initiative) => (
                      <div key={initiative.id} className="border rounded-md p-4">
                        <div className="flex justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{initiative.title || 'Untitled Initiative'}</h3>
                              <Badge className={getInitiativeStatusColor(initiative.status || 'not_started')}>
                                {getInitiativeStatusText(initiative.status || 'not_started')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{initiative.description || 'No description provided'}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-500 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {initiative.owner?.name || 'Unassigned'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Check-ins Tab */}
            <TabsContent value="check-ins" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Check-ins</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setCheckInDialogOpen(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      New Check-in
                    </Button>
                  </div>
                  <CardDescription>
                    Regular updates on progress and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {checkInsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : checkIns && checkIns.length > 0 ? (
                    checkIns.map((checkIn) => {
                      // Find the user who created this check-in
                      const checkInUser = users?.find(user => user.id === checkIn.userId);
                      
                      return (
                        <div key={checkIn.id} className="border rounded-md p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{checkInUser?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <h3 className="font-medium">{checkInUser?.name || "Unknown User"}</h3>
                                <span className="text-sm text-gray-500">
                                  {checkIn.createdAt ? new Date(checkIn.createdAt).toLocaleDateString() : "Unknown date"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`text-sm ${getProgressColorClass(checkIn.progress || 0)}`}>
                                  Progress: {checkIn.progress || 0}%
                                </div>
                                {/* We don't have previous progress data in the DB schema yet */}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded-md text-sm">
                            <p>{checkIn.notes || "No notes provided"}</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No check-ins recorded yet. Create your first check-in by clicking the "New Check-in" button.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* To-Dos Tab */}
            <TabsContent value="todos" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>To-Dos</CardTitle>
                    <Button variant="outline" size="sm" disabled>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add To-Do
                    </Button>
                  </div>
                  <CardDescription>
                    Tasks that need to be completed to achieve the objective
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {keyResults && keyResults.length > 0 ? (
                      keyResults.map((keyResult, idx) => (
                        <div 
                          key={keyResult.id} 
                          className="flex items-center justify-between p-3 border rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer border-gray-300">
                              {/* Will implement toggling when todos are supported */}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                Complete Key Result: {keyResult.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                Progress: {keyResult.progress || 0}%
                              </p>
                            </div>
                          </div>
                          
                          {keyResult.assignedTo && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {keyResult.assignedTo.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-500">{keyResult.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center p-4 text-gray-500">
                        No tasks defined for this objective yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-6">
          {/* Owner Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Owner & Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {objective.owner ? (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{objective.owner.name?.charAt(0) || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{objective.owner.name || "Unknown Owner"}</p>
                      <p className="text-sm text-gray-500">{objective.owner.role || "Team Member"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    No owner assigned
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Team</p>
                  {objective.team ? (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{objective.team.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">No team assigned</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-2xl font-bold">{objective?.keyResults?.length || 0}</p>
                  <p className="text-xs text-gray-500">Key Results</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-2xl font-bold">{objective?.initiatives?.length || 0}</p>
                  <p className="text-xs text-gray-500">Initiatives</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-2xl font-bold">{objective?.checkIns?.length || 0}</p>
                  <p className="text-xs text-gray-500">Check-ins</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-2xl font-bold">0/0</p>
                  <p className="text-xs text-gray-500">To-Dos Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MessageSquare className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm">New check-in added</p>
                    <p className="text-xs text-gray-500">{objective.checkIns[0]?.date}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm">UI design revisions completed</p>
                    <p className="text-xs text-gray-500">August 14, 2023</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <AlertCircle className="h-3 w-3 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm">Test coverage flagged as at risk</p>
                    <p className="text-xs text-gray-500">August 23, 2023</p>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress Update Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              Update the overall progress for this objective.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="progress" className="text-sm font-medium">
                Progress Percentage
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={progressValue}
                  onChange={(e) => setProgressValue(e.target.value)}
                  className="flex-1"
                />
                <span>%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a value between 0 and 100.
              </p>
            </div>
            
            <div>
              <Progress value={parseInt(progressValue) || 0} className="h-2" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleProgressUpdate}>Update Progress</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Check-in</DialogTitle>
            <DialogDescription>
              Provide an update on this objective's progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Current Progress</span>
              <span className={`text-sm font-medium ${getProgressColorClass(objective.progress)}`}>
                {objective.progress}%
              </span>
            </div>
            <Progress value={objective.progress} className="h-2 mb-4" />
            
            <div className="space-y-2">
              <label htmlFor="checkInNotes" className="text-sm font-medium">
                Check-in Notes
              </label>
              <Textarea
                id="checkInNotes"
                placeholder="Provide details about current progress, challenges, and next steps..."
                value={newCheckInNotes}
                onChange={(e) => setNewCheckInNotes(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckInDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckInSubmit}>Submit Check-in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}