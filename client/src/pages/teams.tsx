import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  PlusCircle, 
  Users, 
  Search, 
  AlertCircle, 
  Mail, 
  MoreHorizontal, 
  Eye, 
  Target, 
  ChevronLeft, 
  ChevronRight, 
  Building, 
  Edit, 
  Trash2, 
  UserPlus 
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Team, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define TeamObjective interface
interface TeamObjective {
  id: number;
  title: string;  // Primary title field
  name: string;   // Alternative name field (some components may use this)
  description: string;
  level: string;
  ownerId: number;
  teamId: number;
  timeframeId: number;
  status: "on_track" | "at_risk" | "behind" | "completed";
  progress: number;
  parentId: number | null;
  createdAt: string;
}

const TeamMember = ({ user }: { user: User }) => {
  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : (user.username ? user.username[0] : '?');

  return (
    <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
        <p className="text-sm text-gray-500">{user.role}</p>
      </div>
      <div className="ml-auto text-sm text-gray-500">
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      </div>
    </div>
  );
};

const TeamCard = ({ team, onClick }: { team: Team, onClick: (team: Team) => void }) => {
  // Get team members
  const { data: members } = useQuery<User[]>({
    queryKey: ["/api/teams", team.id, "users"],
    enabled: !!team.id,
  });

  // Use the TeamObjective interface defined above

  // Get objectives for the team
  const { data: objectives } = useQuery<TeamObjective[]>({
    queryKey: ["/api/teams", team.id, "objectives"],
    enabled: !!team.id,
  });

  // Calculate progress as average of objectives or default to 0
  const progress = objectives && objectives.length > 0
    ? objectives.reduce((sum: number, obj: TeamObjective) => sum + obj.progress, 0) / objectives.length
    : 0;

  // Get team color or default
  const teamColor = team.color || "#3B82F6";
  
  // Icon based on the team's icon property or default
  const getTeamIcon = () => {
    switch(team.icon?.toLowerCase()) {
      case 'building':
        return <Users className="text-lg" style={{ color: teamColor }} />;
      default:
        return <Users className="text-lg" style={{ color: teamColor }} />;
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: `${teamColor}20` }} // Use color with transparency
            >
              {getTeamIcon()}
            </div>
            <div>
              <h3 className="font-semibold">{team.name}</h3>
              <p className="text-sm text-gray-500">{members?.length || 0} members</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Objectives</span>
            <span className="text-xs font-medium text-gray-500">{objectives?.length || 0} total</span>
          </div>
          
          {objectives && objectives.length > 0 ? (
            <div className="text-sm">
              {objectives.slice(0, 3).map((objective: TeamObjective, index: number) => (
                <div 
                  key={objective.id}
                  className={`flex items-center justify-between mb-2 pb-2 ${
                    index < objectives.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <span>{objective.name}</span>
                  <Badge 
                    variant="outline"
                    className={
                      objective.progress >= 75 ? "bg-green-100 text-green-800 hover:bg-green-100" :
                      objective.progress >= 50 ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                      objective.progress >= 25 ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                      "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {objective.progress}%
                  </Badge>
                </div>
              ))}
              
              {objectives.length > 3 && (
                <div className="text-center mt-2 text-primary text-xs">
                  + {objectives.length - 3} more objectives
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-3 text-gray-500 text-sm">
              No objectives found for this team
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="mt-4 w-full"
            onClick={() => onClick(team)}
          >
            View Team Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Teams = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#3B82F6");
  const [newTeamIcon, setNewTeamIcon] = useState("building");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamParent, setNewTeamParent] = useState("");
  
  // View state (table or cards)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  
  // Pagination state
  const [currentMembersPage, setCurrentMembersPage] = useState(1);
  const [currentObjectivesPage, setCurrentObjectivesPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch all teams
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  // Fetch team members when a team is selected
  const { data: teamMembers, isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/teams", selectedTeam?.id, "users"],
    enabled: !!selectedTeam,
  });
  
  // Fetch team objectives when a team is selected
  const { data: teamObjectives, isLoading: objectivesLoading } = useQuery<TeamObjective[]>({
    queryKey: ["/api/teams", selectedTeam?.id, "objectives"],
    enabled: !!selectedTeam,
  });

  // Filter teams by search query
  const filteredTeams = teams?.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [, setLocation] = useLocation();
  
  const handleTeamClick = (team: Team) => {
    // Navigate to team detail page instead of opening dialog
    setLocation(`/teams/${team.id}`);
  };

  // This function is no longer needed but we'll keep it as a no-op to avoid errors
  const handleCloseDetails = () => {
    setSelectedTeam(null);
  };
  
  // Pagination logic
  const getPaginatedData = <T extends object>(data: T[] | undefined, page: number): T[] => {
    if (!data) return [];
    const startIndex = (page - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };
  
  // Calculate number of pages for pagination
  const getTotalPages = (totalItems: number): number => {
    return Math.ceil(totalItems / itemsPerPage);
  };
  
  // DataTable column definitions
  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "icon",
      header: "",
      cell: ({ row }) => {
        const team = row.original;
        const teamColor = team.color || "#3B82F6";
        return (
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${teamColor}20` }}
          >
            <Building size={18} style={{ color: teamColor }} />
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "Team Name",
      cell: ({ row }) => {
        const team = row.original;
        return <div className="font-medium">{team.name}</div>;
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return (
          <div className="max-w-[300px] truncate">
            {description || "No description provided"}
          </div>
        );
      },
    },
    {
      accessorKey: "ownerId",
      header: "Owner",
      cell: ({ row }) => {
        const ownerId = row.getValue("ownerId") as number;
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback className="bg-primary/10 text-primary">
                {ownerId ? `U${ownerId}` : "?"}
              </AvatarFallback>
            </Avatar>
            <span>{ownerId || "Unassigned"}</span>
          </div>
        );
      },
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users size={14} />
            <span>0 members</span>
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const team = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => handleTeamClick(team)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View details
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  // Open edit dialog
                  console.log("Edit team:", team.id);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit team
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  // Open add members dialog
                  console.log("Add members to team:", team.id);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-destructive"
                onClick={() => {
                  // Open delete confirmation
                  console.log("Delete team:", team.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleCreateTeam = async () => {
    try {
      const newTeam = {
        name: newTeamName,
        description: newTeamDescription,
        color: newTeamColor,
        icon: newTeamIcon,
        parentId: newTeamParent ? parseInt(newTeamParent) : null,
        ownerId: 1 // Default to admin for this example
      };

      await apiRequest("POST", "/api/teams", newTeam);
      
      // Invalidate and refetch teams
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
      // Reset form and close dialog
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamColor("#3B82F6");
      setNewTeamIcon("building");
      setNewTeamParent("");
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Team created",
        description: "New team has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error creating team",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Teams">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage and view all teams in your organization</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex border rounded-md overflow-hidden">
            <Button 
              variant={viewMode === "table" ? "default" : "ghost"}
              className="rounded-none px-3"
              onClick={() => setViewMode("table")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Table
            </Button>
            <Button 
              variant={viewMode === "cards" ? "default" : "ghost"}
              className="rounded-none px-3"
              onClick={() => setViewMode("cards")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
              </svg>
              Cards
            </Button>
          </div>
        
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-9"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Team</DialogTitle>
                <DialogDescription>
                  Add a new team to your organization structure.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Team Name
                  </label>
                  <Input 
                    id="name" 
                    value={newTeamName} 
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Marketing Team" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Input 
                    id="description" 
                    value={newTeamDescription} 
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Team responsible for marketing activities" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="color" className="text-sm font-medium text-gray-700">
                      Team Color
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        id="color" 
                        value={newTeamColor} 
                        onChange={(e) => setNewTeamColor(e.target.value)}
                        className="h-10 w-10 p-0 border-0" 
                      />
                      <Input 
                        value={newTeamColor} 
                        onChange={(e) => setNewTeamColor(e.target.value)}
                        className="w-full" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="icon" className="text-sm font-medium text-gray-700">
                      Team Icon
                    </label>
                    <Select value={newTeamIcon} onValueChange={setNewTeamIcon}>
                      <SelectTrigger id="icon">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="building">Building</SelectItem>
                        <SelectItem value="code-box">Code Box</SelectItem>
                        <SelectItem value="line-chart">Line Chart</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="parent" className="text-sm font-medium text-gray-700">
                    Parent Team (Optional)
                  </label>
                  <Select value={newTeamParent} onValueChange={setNewTeamParent}>
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="Select parent team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam}>Create Team</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main content - Cards or Table view */}
      {teamsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            <DataTable
              columns={columns}
              data={filteredTeams || []}
              searchColumn="name"
              searchPlaceholder="Search teams..."
              tableTitle="All Teams"
            />
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredTeams?.map(team => (
                <TeamCard key={team.id} team={team} onClick={handleTeamClick} />
              ))}
              {filteredTeams?.length === 0 && (
                <div className="col-span-full text-center p-8">
                  <h3 className="text-lg font-medium">No teams found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* Team details dialog removed - now using dedicated team detail page at /teams/:id */}

      {/* Teams grid */}
      {teamsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center mb-4">
                    <div className="rounded-full bg-slate-200 h-10 w-10 mr-3"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-24"></div>
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                    <div className="h-3 bg-slate-200 rounded w-8"></div>
                  </div>
                  <div className="h-2 bg-slate-200 rounded"></div>
                </div>
                
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                    <div className="h-3 bg-slate-200 rounded w-12"></div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-slate-200 rounded w-40"></div>
                      <div className="h-5 bg-slate-200 rounded w-12"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-slate-200 rounded w-36"></div>
                      <div className="h-5 bg-slate-200 rounded w-12"></div>
                    </div>
                  </div>
                  
                  <div className="h-9 bg-slate-200 rounded mt-4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeams && filteredTeams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map(team => (
            <TeamCard 
              key={team.id} 
              team={team} 
              onClick={handleTeamClick}
            />
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No teams found</AlertTitle>
          <AlertDescription>
            {searchQuery 
              ? `No teams matching "${searchQuery}" were found. Try a different search.` 
              : "No teams have been created yet. Create a new team to get started."}
          </AlertDescription>
        </Alert>
      )}
    </DashboardLayout>
  );
};

export default Teams;
