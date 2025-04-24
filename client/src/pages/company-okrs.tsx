import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Filter, Search, BarChart, ChevronRight, Calendar, Target, 
  Users, Activity, Briefcase, Loader2, Building, ArrowUpRight 
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
  
  // State for filtering and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTimeframes, setSelectedTimeframes] = useState<number[]>([]);

  // Get auth context
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Fetch objectives data
  const { data: objectives = [], isLoading, error } = useQuery<Objective[]>({
    queryKey: ["/api/objectives"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/objectives");
        if (response.status === 401) {
          // Handle unauthorized
          return [];
        }
        if (!response.ok) {
          throw new Error("Failed to fetch objectives");
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching objectives:", err);
        throw err;
      }
    },
    enabled: isAuthenticated
  });

  // Fetch key results for each objective
  const { data: keyResults = [] } = useQuery<KeyResult[]>({
    queryKey: ["/api/key-results"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/key-results");
        if (response.status === 401) {
          // Handle unauthorized
          return [];
        }
        if (!response.ok) {
          throw new Error("Failed to fetch key results");
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching key results:", err);
        throw err;
      }
    },
    enabled: isAuthenticated
  });

  // Fetch timeframes for filtering
  const { data: timeframes = [] } = useQuery<any[]>({
    queryKey: ["/api/timeframes"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/timeframes");
        if (response.status === 401) {
          // Handle unauthorized
          return [];
        }
        if (!response.ok) {
          throw new Error("Failed to fetch timeframes");
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching timeframes:", err);
        throw err;
      }
    },
    enabled: isAuthenticated
  });

  // Fetch teams for assignment info
  const { data: teams = [] } = useQuery<any[]>({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/teams");
        if (response.status === 401) {
          // Handle unauthorized
          return [];
        }
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        const data = await response.json();
        return data;
      } catch (err) {
        console.error("Error fetching teams:", err);
        throw err;
      }
    },
    enabled: isAuthenticated
  });

  // Filter objectives based on all criteria
  const filteredObjectives = objectives
    .filter(obj => obj.level === 'company')
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

  // Navigate to objective detail page
  const navigateToObjective = (id: number) => {
    navigate(`/objective-detail/${id}`);
  };

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredObjectives.map((objective) => {
            // Get key results for this objective
            const objectiveKeyResults = keyResults.filter(kr => kr.objectiveId === objective.id);
            
            // Determine color based on objective type
            const typeColor = objective.type === 'financial' ? '#818cf8' : 
                          objective.type === 'product' ? '#6ee7b7' : 
                          objective.type === 'customer' ? '#fcd34d' : 
                          objective.type === 'market' ? '#93c5fd' :
                          objective.type === 'operations' ? '#a5b4fc' :
                          objective.type === 'people' ? '#f472b6' : '#d1d5db';
            
            return (
              <Card 
                key={objective.id} 
                className="border-t-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                style={{ borderTopColor: typeColor }}
                onClick={() => navigateToObjective(objective.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center">
                      <Badge className="mr-2" variant="outline">
                        <span className="flex items-center">
                          {getTypeIcon(objective.type)}
                          <span className="ml-1 capitalize">{objective.type || 'General'}</span>
                        </span>
                      </Badge>
                      <Badge className={getStatusColor(objective.status)}>
                        {objective.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      <Calendar className="h-3 w-3 mr-1" />
                      {getTimeframeName(objective.timeframeId)}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{objective.title}</CardTitle>
                  <CardDescription className="mt-1.5">
                    {objective.description || 'No description provided'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Overall Progress</span>
                      <span>{objective.progress}%</span>
                    </div>
                    <Progress value={objective.progress} className="h-2" />
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Key Results:</h4>
                    {objectiveKeyResults.length > 0 ? (
                      <ul className="space-y-3">
                        {objectiveKeyResults.map((kr) => (
                          <li key={kr.id} className="text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-700">{kr.title}</span>
                              <span className="text-gray-500">{kr.progress}%</span>
                            </div>
                            <Progress value={kr.progress} className="h-1.5" />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No key results defined</p>
                    )}
                  </div>
                  
                  <div className="mt-5 text-sm text-gray-500 flex justify-between items-center">
                    <span>Assigned: {getTeamName(objective.teamId)}</span>
                    <Button size="sm" variant="ghost">
                      Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No company objectives found</CardTitle>
            <CardDescription>
              {searchQuery || selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTimeframes.length > 0
                ? "No objectives match your current filters"
                : "There are no company-level objectives at this time."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(searchQuery || selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTimeframes.length > 0) && (
              <Button className="mb-4" variant="outline" onClick={resetFilters}>
                Clear all filters
              </Button>
            )}
            <p className="text-sm text-gray-500">
              Company objectives provide direction and alignment for the entire organization.
            </p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
