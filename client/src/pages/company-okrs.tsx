import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Filter, Search, BarChart, ChevronRight, Calendar, Target, 
  Users, Activity, Briefcase, Loader2, Building, ArrowUpRight, Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getQueryFn } from "@/lib/queryClient";

// Define interfaces for type safety
interface KeyResult {
  id: number;
  title: string;
  description?: string;
  objectiveId: number;
  progress: number;
  status: string;
  assignedToId?: number;
  assignedToName?: string;
}

interface Objective {
  id: number;
  title: string;
  description?: string;
  level: string;
  timeframe?: string;
  timeframeId: number;
  timeframeName?: string;
  type?: string;
  progress: number;
  status: string;
  teamId?: number;
  teamName?: string;
  ownerId: number;
  ownerName?: string;
  keyResults: KeyResult[];
  startDate?: string;
  endDate?: string;
}

// Define objective types for filtering
const OBJECTIVE_TYPES = [
  { value: 'financial', label: 'Financial', icon: <BarChart className="h-4 w-4" /> },
  { value: 'product', label: 'Product', icon: <Target className="h-4 w-4" /> },
  { value: 'customer', label: 'Customer', icon: <Users className="h-4 w-4" /> },
  { value: 'market', label: 'Market', icon: <ArrowUpRight className="h-4 w-4" /> },
  { value: 'operations', label: 'Operations', icon: <Activity className="h-4 w-4" /> },
  { value: 'people', label: 'People', icon: <Users className="h-4 w-4" /> },
  { value: 'process', label: 'Process', icon: <Activity className="h-4 w-4" /> },
  { value: 'technology', label: 'Technology', icon: <Briefcase className="h-4 w-4" /> },
];

export default function CompanyOKRs() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<number[]>([]);

  // Use the auth context from above
  const isAuthenticated = !!user;



  // Fetch objectives data including linked OKRs
  const { data: objectives = [], isLoading, error } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch all OKRs to find those linked to company objectives
  const { data: allOKRs = [] } = useQuery<Objective[]>({
    queryKey: ["/api/objectives-with-links"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch timeframes for filtering
  const { data: timeframes = [] } = useQuery<any[]>({
    queryKey: ["/api/timeframes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Fetch teams for assignment info
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: isAuthenticated,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Filter objectives based on all criteria
  console.log("Raw objectives from API:", JSON.stringify(objectives, null, 2));
  
  // Manual check for company level
  const hasLevelField = objectives.some(obj => 'level' in obj);
  console.log("Do objectives have level field?", hasLevelField);
  
  // Modified to handle potentially missing level field
  const filteredObjectives = objectives
    .filter(obj => {
      // Debug level field
      console.log(`Objective ID: ${obj.id}, Title: ${obj.title}, Level: ${obj.level || 'undefined'}`);
      
      // Check if it's a company level objective (handle missing level field)
      if (!obj.level && obj.teamId === null && obj.parentId === null) {
        console.log(`Objective ${obj.id} has no team and no parent - likely company level`);
        return true;
      }
      
      return obj.level === 'company';
    })
    .filter(obj => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      return searchQuery === "" || 
        obj.title.toLowerCase().includes(searchLower) ||
        (obj.description?.toLowerCase().includes(searchLower) || false);
    })
    .filter(obj => {
      // Tab filter
      if (selectedTab === 'all') return true;
      if (selectedTab === 'current') {
        // Filter for current quarter timeframes
        const currentTimeframe = timeframes.find(t => {
          const now = new Date();
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return now >= start && now <= end;
        });
        return obj.timeframeId === currentTimeframe?.id;
      }
      if (selectedTab === 'upcoming') {
        // Filter for upcoming timeframes
        const now = new Date();
        return obj.startDate ? new Date(obj.startDate) > now : false;
      }
      if (selectedTab === 'completed') {
        return obj.status === 'completed';
      }
      return true;
    })
    .filter(obj => {
      // Type filter
      return selectedTypes.length === 0 || selectedTypes.includes(obj.type || '');
    })
    .filter(obj => {
      // Status filter
      return selectedStatuses.length === 0 || selectedStatuses.includes(obj.status);
    })
    .filter(obj => {
      // Timeframe filter
      return selectedTimeframes.length === 0 || selectedTimeframes.includes(obj.timeframeId);
    });
    
  console.log("Filtered company objectives:", filteredObjectives);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get type icon
  const getTypeIcon = (type?: string) => {
    const objectiveType = OBJECTIVE_TYPES.find(t => t.value === type);
    return objectiveType?.icon || <Target className="h-4 w-4" />;
  };

  // Get team name by ID
  const getTeamName = (teamId?: number) => {
    if (!teamId) return "Unassigned";
    const team = teams.find(t => t.id === teamId);
    return team?.name || "Unknown Team";
  };

  // Get timeframe name by ID
  const getTimeframeName = (timeframeId: number) => {
    const timeframe = timeframes.find(t => t.id === timeframeId);
    return timeframe?.name || "Unknown Timeframe";
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedTimeframes([]);
    setSearchQuery("");
    setSelectedTab("all");
  };

  // Toggle type selection in filter
  const toggleTypeSelection = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };

  // Toggle status selection in filter
  const toggleStatusSelection = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  // Toggle timeframe selection in filter
  const toggleTimeframeSelection = (timeframeId: number) => {
    setSelectedTimeframes(prev => 
      prev.includes(timeframeId) 
        ? prev.filter(t => t !== timeframeId) 
        : [...prev, timeframeId]
    );
  };

  // Navigation handled by the main function at the top

  // Get all unique objective types from data
  const availableTypes = objectives.length 
    ? Array.from(new Set(objectives.map(obj => obj.type).filter(Boolean) as string[])) 
    : [];
  
  // Get all available statuses from data
  const availableStatuses = objectives.length
    ? Array.from(new Set(objectives.map(obj => obj.status)))
        .sort((a, b) => {
          const order = ["not_started", "on_track", "at_risk", "behind", "completed"];
          return order.indexOf(a) - order.indexOf(b);
        })
    : [];

  return (
    <DashboardLayout title="Company OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company OKRs</h1>
          <p className="text-gray-600">View and track company-wide objectives and key results</p>
        </div>
        
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search objectives..."
                className="pl-8 w-[200px] lg:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => navigate("/create-company-objective")}
              className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Company OKR
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {(selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTimeframes.length > 0) && (
                    <Badge className="ml-2 bg-primary" variant="default">
                      {selectedTypes.length + selectedStatuses.length + selectedTimeframes.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter By Type</DropdownMenuLabel>
                {availableTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleTypeSelection(type)}
                  >
                    <span className="flex items-center">
                      {getTypeIcon(type)}
                      <span className="ml-2 capitalize">{type}</span>
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Filter By Status</DropdownMenuLabel>
                {availableStatuses.map(status => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => toggleStatusSelection(status)}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Filter By Timeframe</DropdownMenuLabel>
                {timeframes.map(tf => (
                  <DropdownMenuCheckboxItem
                    key={tf.id}
                    checked={selectedTimeframes.includes(tf.id)}
                    onCheckedChange={() => toggleTimeframeSelection(tf.id)}
                  >
                    {tf.name}
                  </DropdownMenuCheckboxItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-center" 
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full mb-6">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="current">Current Quarter</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Showing all company-level objectives
            </p>
          </TabsContent>
          
          <TabsContent value="current" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Showing objectives for the current quarter
            </p>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Showing upcoming objectives that haven't started yet
            </p>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-4">
            <p className="text-sm text-gray-500 mb-4">
              Showing completed objectives
            </p>
          </TabsContent>
        </Tabs>
      )}

      {!isAuthenticated ? (
        <Card className="border-2 border-dashed border-primary/20">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to log in to view company objectives and key results.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 p-4 bg-primary/5 rounded-full">
              <Loader2 className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Company OKRs provide organization-wide visibility into key objectives and their progress.
              Log in to track, monitor, and contribute to company goals.
            </p>
            <div className="flex gap-4">
              <Button 
                variant="default" 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                Log in
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate('/')}
              >
                Back to Dashboard
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Default admin login: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></p>
            </div>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading objectives...</span>
        </div>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Error loading objectives</CardTitle>
            <CardDescription>
              There was a problem fetching the company objectives.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : "An unknown error occurred"}
            </p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredObjectives.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredObjectives.map((objective) => {
            // Calculate average progress from connected OKRs
            const connectedOKRs = allOKRs.filter(okr => 
              okr.parentId === objective.id || 
              okr.strategicAlignment === objective.id ||
              okr.alignedToObjectiveId === objective.id
            );
            
            const averageProgress = connectedOKRs.length > 0 
              ? Math.round(connectedOKRs.reduce((sum, okr) => sum + (okr.progress || 0), 0) / connectedOKRs.length)
              : objective.progress || 0;
            
            return (
              <Card 
                key={objective.id} 
                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => {
                  // Prevent navigation if clicking on buttons inside the card
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/objective/${objective.id}`);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold">{objective.title}</CardTitle>
                    <Badge variant="secondary" className="ml-2">Company</Badge>
                  </div>
                  {objective.description && (
                    <CardDescription className="mt-2 line-clamp-2">
                      {objective.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <h4 className="text-sm font-medium mb-2">Key Results</h4>
                  {objective.keyResults && objective.keyResults.length > 0 ? (
                    <ul className="space-y-2 list-disc pl-5">
                      {objective.keyResults.slice(0, 3).map((keyResult) => (
                        <li key={keyResult.id} className="text-sm text-muted-foreground">
                          {keyResult.title}
                        </li>
                      ))}
                      {objective.keyResults.length > 3 && (
                        <li className="text-sm text-muted-foreground">
                          +{objective.keyResults.length - 3} more key results
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No key results defined</p>
                  )}
                </CardContent>
                <CardFooter className="pt-2 flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/objective/${objective.id}`)}>
                      <Target className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    {connectedOKRs.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {connectedOKRs.length} Connected OKR{connectedOKRs.length > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {averageProgress}%
                    </span>
                    <Progress value={averageProgress} className="w-16" />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-200">
          <CardHeader>
            <CardTitle>No Company OKRs Found</CardTitle>
            <CardDescription>
              There are no company-level objectives matching your current filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="mb-4 p-4 bg-primary/5 rounded-full">
              <Building className="h-12 w-12 text-primary" />
            </div>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Company OKRs help align organization-wide goals and track strategic initiatives.
              Create your first company objective to get started.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={() => navigate("/create-company-objective")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Company OKR
              </Button>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
