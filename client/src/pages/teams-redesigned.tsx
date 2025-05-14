import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";
import { Team, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  Users,
  User as UserIcon,
  Search,
  PlusCircle,
  Building,
  Building2,
  LayoutGrid,
  List,
  BarChart,
  PieChart,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  ChevronRight,
  Filter,
  Briefcase,
  Rocket,
  Zap,
  ArrowUpRight
} from "lucide-react";

// Define TeamObjective interface
interface TeamObjective {
  id: string;
  title: string;
  name?: string;
  description: string;
  level: string;
  ownerId: string;
  teamId: string;
  timeframeId: string;
  status: "on_track" | "at_risk" | "behind" | "completed";
  progress: number;
  parentId: string | null;
  createdAt: string;
}

// Team member component with animation
const TeamMember = ({ user, index }: { user: User; index: number }) => {
  const initials = user.firstName && user.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : (user.username ? user.username[0] : '?');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors duration-200"
    >
      <Avatar className="h-10 w-10 mr-3 border-2 border-white shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary/60 text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
        <p className="text-sm text-gray-500">{user.title || user.role || "Member"}</p>
      </div>
      <div className="ml-auto text-sm text-gray-500">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
          Active
        </Badge>
      </div>
    </motion.div>
  );
};

// Team status badge component
const TeamStatusBadge = ({ status, className = "" }: { status?: string, className?: string }) => {
  // If status is undefined or null, use a default value
  const safeStatus = status || "at_risk";
  
  const statusConfig = {
    "on_track": { color: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
    "at_risk": { color: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock className="w-3 h-3 mr-1" /> },
    "behind": { color: "bg-red-50 text-red-700 border-red-200", icon: <AlertCircle className="w-3 h-3 mr-1" /> },
    "completed": { color: "bg-blue-50 text-blue-700 border-blue-200", icon: <CheckCircle2 className="w-3 h-3 mr-1" /> },
  };

  const config = statusConfig[safeStatus as keyof typeof statusConfig] || statusConfig.at_risk;
  const displayText = safeStatus ? safeStatus.replace(/_/g, " ") : "at risk";

  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.color} ${className}`}>
      {config.icon}
      {displayText}
    </Badge>
  );
};

// Team card with animation and enhanced design
const TeamCard = ({ team, onClick, delay = 0 }: { team: Team, onClick: (team: Team) => void, delay?: number }) => {
  const { currentTenant } = useTenantContext();
  
  // Get team members
  const { data: members = [] } = useQuery<User[]>({
    queryKey: ["/api/teams", team.id, "users", currentTenant?.id],
    enabled: !!team.id && !!currentTenant?.id,
  });

  // Get objectives for the team
  const { data: objectives = [] } = useQuery<TeamObjective[]>({
    queryKey: ["/api/teams", team.id, "objectives", currentTenant?.id],
    enabled: !!team.id && !!currentTenant?.id,
  });

  // Calculate progress as average of objectives or default to 0
  const progress = objectives && objectives.length > 0
    ? objectives.reduce((sum: number, obj: TeamObjective) => sum + obj.progress, 0) / objectives.length
    : 0;

  // Get team color or default
  const teamColor = team.color || "#3B82F6";
  
  // Get progress status color
  const getProgressColor = (prog: number) => {
    if (prog >= 75) return "#16a34a";
    if (prog >= 50) return "#3b82f6";
    if (prog >= 25) return "#eab308";
    return "#dc2626";
  };

  // Icons for different team types
  const teamIcons: Record<string, JSX.Element> = {
    building: <Building size={20} />,
    building2: <Building2 size={20} />,
    users: <Users size={20} />,
    briefcase: <Briefcase size={20} />,
    rocket: <Rocket size={20} />,
    zap: <Zap size={20} />
  };

  // Get icon based on team's icon property or default
  const getTeamIcon = () => {
    const iconName = team.icon?.toLowerCase() || "users";
    return teamIcons[iconName] || <Users size={20} />;
  };
  
  // Truncate description text
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "No description available";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-all duration-200 border border-gray-200/80">
        <CardHeader className="p-5 pb-4 flex flex-row items-start space-y-0 gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${teamColor}15` }}
          >
            <div style={{ color: teamColor }}>
              {getTeamIcon()}
            </div>
          </div>
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg leading-tight">{team.name}</CardTitle>
            <p className="text-sm text-gray-500 line-clamp-2">
              {truncateText(team.description || "", 80)}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 pt-0">
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Overall Progress</span>
                <span style={{ color: getProgressColor(progress) }} className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" indicatorStyle={{ background: getProgressColor(progress) }} />
            </div>
            
            <div className="flex gap-3 justify-between">
              <div className="rounded-md border border-gray-200 bg-white p-2 flex flex-col items-center text-center">
                <Users className="h-4 w-4 text-gray-500 mb-1" />
                <span className="text-sm font-medium">{members.length}</span>
                <span className="text-xs text-gray-500">Members</span>
              </div>
              
              <div className="rounded-md border border-gray-200 bg-white p-2 flex flex-col items-center text-center">
                <Target className="h-4 w-4 text-gray-500 mb-1" />
                <span className="text-sm font-medium">{objectives.length}</span>
                <span className="text-xs text-gray-500">Objectives</span>
              </div>
              
              <div className="rounded-md border border-gray-200 bg-white p-2 flex flex-col items-center text-center">
                <BarChart className="h-4 w-4 text-gray-500 mb-1" />
                <span className="text-sm font-medium">
                  {Math.round(progress)}%
                </span>
                <span className="text-xs text-gray-500">Completion</span>
              </div>
            </div>
            
            {objectives && objectives.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex justify-between items-center">
                  <span>Recent Objectives</span>
                  <span className="text-xs text-gray-500">Status</span>
                </h4>
                {objectives.slice(0, 2).map((objective) => (
                  <div 
                    key={objective.id}
                    className="flex items-center justify-between text-sm p-2 rounded-md bg-gray-50"
                  >
                    <span className="line-clamp-1 mr-2">{objective.title || objective.name}</span>
                    <TeamStatusBadge status={objective.status} />
                  </div>
                ))}
                
                {objectives.length > 2 && (
                  <div className="text-center pt-1">
                    <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2">
                      + {objectives.length - 2} more
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
        
        <CardFooter className="p-3 border-t bg-gray-50/50">
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center text-primary hover:text-primary font-medium"
            onClick={() => onClick(team)}
          >
            <span>View Team Details</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Table skeleton loader component
const TableSkeleton = () => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-32" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
);

// Cards skeleton loader component
const CardsSkeleton = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="p-5 pb-4 flex flex-row items-start space-y-0 gap-3">
          <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="flex gap-3 justify-between">
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
              <Skeleton className="h-16 flex-1" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-3 border-t">
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

// No teams found component
const NoTeamsFound = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="bg-gray-100 p-4 rounded-full mb-4">
      <Building2 className="h-12 w-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-medium text-gray-800 mb-2">No Teams Found</h3>
    <p className="text-gray-500 text-center max-w-md mb-6">
      There are no teams in your organization yet. Create your first team to start organizing your objectives and members.
    </p>
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Your First Team
        </Button>
      </DialogTrigger>
      <CreateTeamDialog />
    </Dialog>
  </motion.div>
);

// Create team dialog component
const CreateTeamDialog = () => {
  const { toast } = useToast();
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#3B82F6");
  const [newTeamIcon, setNewTeamIcon] = useState("users");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newTeamParent, setNewTeamParent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all teams for parent selection with tenant context
  const { currentTenant } = useTenantContext();
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams", currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  const colorOptions = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Green", value: "#10B981" },
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F59E0B" },
    { name: "Teal", value: "#14B8A6" },
    { name: "Indigo", value: "#6366F1" }
  ];
  
  const iconOptions = [
    { name: "Users", value: "users" },
    { name: "Building", value: "building" },
    { name: "Office Building", value: "building2" },
    { name: "Briefcase", value: "briefcase" },
    { name: "Rocket", value: "rocket" },
    { name: "Lightning", value: "zap" }
  ];

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a name for the team",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const newTeam = {
        name: newTeamName,
        description: newTeamDescription,
        color: newTeamColor,
        icon: newTeamIcon,
        parentId: newTeamParent || null,
      };

      await apiRequest("POST", "/api/teams", newTeam);
      
      // Invalidate and refetch teams
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      
      toast({
        title: "Team created",
        description: "New team has been created successfully.",
      });
      
      // Reset form
      setNewTeamName("");
      setNewTeamDescription("");
      setNewTeamColor("#3B82F6");
      setNewTeamIcon("users");
      setNewTeamParent("");
      
      // Close dialog - needs DialogClose component
      document.querySelector('[data-dialog-close]')?.click();
      
    } catch (error) {
      toast({
        title: "Error creating team",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogDescription>
          Create a new team to organize your members and objectives.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleCreateTeam} className="space-y-4 py-2">
        <div className="grid gap-2">
          <label htmlFor="team-name" className="text-sm font-medium">
            Team Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="team-name"
            placeholder="Enter team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <label htmlFor="team-description" className="text-sm font-medium">
            Description
          </label>
          <Textarea
            id="team-description"
            placeholder="Enter team description"
            value={newTeamDescription}
            onChange={(e) => setNewTeamDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label htmlFor="team-color" className="text-sm font-medium">
              Team Color
            </label>
            <Select value={newTeamColor} onValueChange={setNewTeamColor}>
              <SelectTrigger id="team-color" className="w-full">
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: color.value }}
                      />
                      {color.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="team-icon" className="text-sm font-medium">
              Team Icon
            </label>
            <Select value={newTeamIcon} onValueChange={setNewTeamIcon}>
              <SelectTrigger id="team-icon" className="w-full">
                <SelectValue placeholder="Select icon" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    <div className="flex items-center">
                      {icon.value === "users" && <Users className="w-4 h-4 mr-2" />}
                      {icon.value === "building" && <Building className="w-4 h-4 mr-2" />}
                      {icon.value === "building2" && <Building2 className="w-4 h-4 mr-2" />}
                      {icon.value === "briefcase" && <Briefcase className="w-4 h-4 mr-2" />}
                      {icon.value === "rocket" && <Rocket className="w-4 h-4 mr-2" />}
                      {icon.value === "zap" && <Zap className="w-4 h-4 mr-2" />}
                      {icon.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-2">
          <label htmlFor="parent-team" className="text-sm font-medium">
            Parent Team (Optional)
          </label>
          <Select value={newTeamParent} onValueChange={setNewTeamParent}>
            <SelectTrigger id="parent-team">
              <SelectValue placeholder="None (Top-level team)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None (Top-level team)</SelectItem>
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Team"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
};

const TeamsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortField, setSortField] = useState<"name" | "progress" | "members">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [, setLocation] = useLocation();
  const { currentTenant } = useTenantContext();

  // Fetch all teams with tenant context
  const { data: teams = [], isLoading, error } = useQuery<Team[]>({
    queryKey: ["/api/teams", currentTenant?.id],
    enabled: !!currentTenant?.id,
    onSuccess: (data) => {
      console.log("Teams data successfully fetched:", data);
    },
    onError: (err) => {
      console.error("Error fetching teams:", err);
      toast({
        title: "Error loading teams",
        description: "There was an error loading teams data. Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Filter teams by search query
  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort teams based on sort options
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    // For other sort options, we would need to implement them with additional data
    return 0;
  });

  // Handle team click to navigate to detail page
  const handleTeamClick = (team: Team) => {
    setLocation(`/teams/${team.id}`);
  };

  // Table columns definition
  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: "Team",
      cell: ({ row }) => {
        const team = row.original;
        const teamColor = team.color || "#3B82F6";
        
        return (
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${teamColor}15` }}
            >
              <div style={{ color: teamColor }}>
                {team.icon === "building" ? (
                  <Building size={18} />
                ) : team.icon === "building2" ? (
                  <Building2 size={18} />
                ) : team.icon === "briefcase" ? (
                  <Briefcase size={18} />
                ) : team.icon === "rocket" ? (
                  <Rocket size={18} />
                ) : team.icon === "zap" ? (
                  <Zap size={18} />
                ) : (
                  <Users size={18} />
                )}
              </div>
            </div>
            <div>
              <div className="font-medium">{team.name}</div>
              {team.description && (
                <div className="text-sm text-gray-500 max-w-[300px] truncate">
                  {team.description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      id: "members",
      header: "Members",
      cell: ({ row }) => {
        const teamId = row.original.id;
        const { data: members } = useQuery<User[]>({
          queryKey: ["/api/teams", teamId, "users"],
          enabled: !!teamId,
        });
        
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="flex items-center gap-1 font-normal">
              <Users size={14} />
              <span>{members?.length || 0}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      id: "objectives",
      header: "Objectives",
      cell: ({ row }) => {
        const teamId = row.original.id;
        const { data: objectives } = useQuery<TeamObjective[]>({
          queryKey: ["/api/teams", teamId, "objectives"],
          enabled: !!teamId,
        });
        
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="flex items-center gap-1 font-normal">
              <Target size={14} />
              <span>{objectives?.length || 0}</span>
            </Badge>
          </div>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const teamId = row.original.id;
        const { data: objectives } = useQuery<TeamObjective[]>({
          queryKey: ["/api/teams", teamId, "objectives"],
          enabled: !!teamId,
        });
        
        // Calculate progress
        const progress = objectives && objectives.length > 0
          ? objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length
          : 0;
          
        // Determine color based on progress
        const getProgressColor = (prog: number) => {
          if (prog >= 75) return "bg-green-500";
          if (prog >= 50) return "bg-blue-500";
          if (prog >= 25) return "bg-amber-500";
          return "bg-red-500";
        };
        
        return (
          <div className="flex items-center gap-2">
            <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${getProgressColor(progress)}`}
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <span className="text-sm">{Math.round(progress)}%</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
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
                View team
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit team
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <UserPlus className="mr-2 h-4 w-4" />
                Add members
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DashboardLayout title="Teams">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
              <p className="text-gray-500 mt-1">Manage and organize teams in your organization</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="default" className="shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <CreateTeamDialog />
            </Dialog>
          </div>
          
          {/* Filters and search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center rounded-lg border p-4 bg-white shadow-sm">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search teams..."
                className="w-full pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 ml-auto">
              <Select
                value={sortField}
                onValueChange={(value) => setSortField(value as "name" | "progress" | "members")}
              >
                <SelectTrigger className="w-[140px] h-9 text-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="progress">Sort by Progress</SelectItem>
                  <SelectItem value="members">Sort by Members</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                className="ml-1"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "A-Z" : "Z-A"}
              </Button>
              
              <div className="border rounded-md p-1 bg-muted">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("grid")}
                >
                  <span className="sr-only">Grid view</span>
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode("table")}
                >
                  <span className="sr-only">Table view</span>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Stats section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full mr-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{teams.length}</div>
                  <div className="text-sm text-muted-foreground">Total Teams</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">12</div>
                  <div className="text-sm text-muted-foreground">Team Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-4">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground">Active Objectives</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Teams content */}
        {isLoading ? (
          viewMode === "grid" ? <CardsSkeleton /> : <TableSkeleton />
        ) : sortedTeams.length === 0 ? (
          <NoTeamsFound />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedTeams.map((team, index) => (
                    <TeamCard 
                      key={team.id} 
                      team={team} 
                      onClick={handleTeamClick} 
                      delay={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <DataTable
                    columns={columns}
                    data={sortedTeams}
                    searchColumn="name"
                    searchPlaceholder="Filter teams..."
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* No results message */}
        {!isLoading && teams.length > 0 && filteredTeams.length === 0 && (
          <Alert className="mt-6">
            <AlertDescription>
              No teams match your search. Try a different search term or clear the filter.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamsPage;