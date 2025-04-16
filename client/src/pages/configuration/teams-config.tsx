import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PlusCircle, Search, AlertCircle, Building, Users, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Team, User } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

const TeamMappingItem = ({ team, level = 0, teams, onEdit }: { 
  team: Team; 
  level?: number; 
  teams: Team[];
  onEdit: (team: Team) => void;
}) => {
  const childTeams = teams.filter(t => t.parentId === team.id);
  
  const getTeamColor = (color?: string) => {
    return color || "#3B82F6";
  };
  
  const getTeamIcon = () => {
    return <Building className="h-4 w-4" style={{ color: getTeamColor(team.color) }} />;
  };
  
  return (
    <div>
      <div 
        className={`flex items-center justify-between py-2 px-3 rounded-md mb-1 ${level > 0 ? 'ml-6' : ''}`}
        style={{ backgroundColor: `${getTeamColor(team.color)}10` }}
      >
        <div className="flex items-center space-x-2">
          {getTeamIcon()}
          <span className="font-medium">{team.name}</span>
          {team.ownerId && (
            <span className="text-xs text-gray-500">
              (Owner ID: {team.ownerId})
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => onEdit(team)}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>
      
      {childTeams.length > 0 && (
        <div>
          {childTeams.map(childTeam => (
            <TeamMappingItem 
              key={childTeam.id} 
              team={childTeam} 
              level={level + 1} 
              teams={teams}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TeamsConfig = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Team form state
  const [teamForm, setTeamForm] = useState({
    id: 0,
    name: "",
    description: "",
    color: "#3B82F6",
    icon: "building",
    parentId: "",
    ownerId: ""
  });
  
  // Selected team for editing
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Fetch teams and users
  const { data: teams, isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });
  
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });
  
  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const res = await apiRequest("POST", "/api/teams", teamData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Team created",
        description: "The team has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating team",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async (teamData: any) => {
      const { id, ...updateData } = teamData;
      const res = await apiRequest("PATCH", `/api/teams/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      toast({
        title: "Team updated",
        description: "The team has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleCreateTeam = () => {
    const teamData = {
      name: teamForm.name,
      description: teamForm.description,
      color: teamForm.color,
      icon: teamForm.icon,
      parentId: teamForm.parentId ? parseInt(teamForm.parentId) : null,
      ownerId: teamForm.ownerId ? parseInt(teamForm.ownerId) : null
    };
    
    createTeamMutation.mutate(teamData);
  };
  
  const handleUpdateTeam = () => {
    if (!selectedTeam) return;
    
    const teamData = {
      id: selectedTeam.id,
      name: teamForm.name,
      description: teamForm.description,
      color: teamForm.color,
      icon: teamForm.icon,
      parentId: teamForm.parentId ? parseInt(teamForm.parentId) : null,
      ownerId: teamForm.ownerId ? parseInt(teamForm.ownerId) : null
    };
    
    updateTeamMutation.mutate(teamData);
  };
  
  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setTeamForm({
      id: team.id,
      name: team.name,
      description: team.description || "",
      color: team.color || "#3B82F6",
      icon: team.icon || "building",
      parentId: team.parentId ? team.parentId.toString() : "",
      ownerId: team.ownerId ? team.ownerId.toString() : ""
    });
    setIsEditDialogOpen(true);
  };
  
  const resetForm = () => {
    setTeamForm({
      id: 0,
      name: "",
      description: "",
      color: "#3B82F6",
      icon: "building",
      parentId: "",
      ownerId: ""
    });
  };
  
  // Filter teams based on search query
  const filteredTeams = teams?.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Get root teams (no parent)
  const rootTeams = teams?.filter(team => !team.parentId);
  
  return (
    <DashboardLayout title="Team Configuration">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Configuration</h1>
          <p className="text-gray-600">Manage teams and organizational structure</p>
        </div>
        
        <div className="flex gap-3">
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
                  <Label htmlFor="name">Team Name</Label>
                  <Input 
                    id="name" 
                    value={teamForm.name} 
                    onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                    placeholder="e.g., Marketing Team" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={teamForm.description} 
                    onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                    placeholder="Team responsible for marketing activities" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="color">Team Color</Label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        id="color" 
                        value={teamForm.color} 
                        onChange={(e) => setTeamForm({...teamForm, color: e.target.value})}
                        className="h-10 w-10 p-0 border-0" 
                      />
                      <Input 
                        value={teamForm.color} 
                        onChange={(e) => setTeamForm({...teamForm, color: e.target.value})}
                        className="w-full" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="icon">Team Icon</Label>
                    <Select 
                      value={teamForm.icon} 
                      onValueChange={(value) => setTeamForm({...teamForm, icon: value})}
                    >
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
                  <Label htmlFor="parent">Parent Team (Optional)</Label>
                  <Select 
                    value={teamForm.parentId} 
                    onValueChange={(value) => setTeamForm({...teamForm, parentId: value})}
                  >
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="Select parent team" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {teams?.map(team => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="owner">Team Owner (Optional)</Label>
                  <Select 
                    value={teamForm.ownerId} 
                    onValueChange={(value) => setTeamForm({...teamForm, ownerId: value})}
                  >
                    <SelectTrigger id="owner">
                      <SelectValue placeholder="Select team owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    resetForm();
                    setIsCreateDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTeam}
                  disabled={!teamForm.name || createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Edit Team Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team information and structure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Team Name</Label>
              <Input 
                id="edit-name" 
                value={teamForm.name} 
                onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                value={teamForm.description} 
                onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Team Color</Label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    id="edit-color" 
                    value={teamForm.color} 
                    onChange={(e) => setTeamForm({...teamForm, color: e.target.value})}
                    className="h-10 w-10 p-0 border-0" 
                  />
                  <Input 
                    value={teamForm.color} 
                    onChange={(e) => setTeamForm({...teamForm, color: e.target.value})}
                    className="w-full" 
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-icon">Team Icon</Label>
                <Select 
                  value={teamForm.icon} 
                  onValueChange={(value) => setTeamForm({...teamForm, icon: value})}
                >
                  <SelectTrigger id="edit-icon">
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
              <Label htmlFor="edit-parent">Parent Team</Label>
              <Select 
                value={teamForm.parentId} 
                onValueChange={(value) => setTeamForm({...teamForm, parentId: value})}
              >
                <SelectTrigger id="edit-parent">
                  <SelectValue placeholder="Select parent team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {teams?.filter(t => t.id !== selectedTeam?.id).map(team => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-owner">Team Owner</Label>
              <Select 
                value={teamForm.ownerId} 
                onValueChange={(value) => setTeamForm({...teamForm, ownerId: value})}
              >
                <SelectTrigger id="edit-owner">
                  <SelectValue placeholder="Select team owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users?.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedTeam(null);
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTeam}
              disabled={!teamForm.name || updateTeamMutation.isPending}
            >
              {updateTeamMutation.isPending ? "Updating..." : "Update Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Teams</TabsTrigger>
          <TabsTrigger value="hierarchy">Team Hierarchy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {teamsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredTeams && filteredTeams.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Parent Team</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map(team => {
                      const parentTeam = teams?.find(t => t.id === team.parentId);
                      const owner = users?.find(u => u.id === team.ownerId);
                      
                      return (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: team.color || "#3B82F6" }}
                              ></div>
                              {team.name}
                            </div>
                          </TableCell>
                          <TableCell>{team.description || "-"}</TableCell>
                          <TableCell>{parentTeam?.name || "-"}</TableCell>
                          <TableCell>
                            {owner ? `${owner.firstName} ${owner.lastName}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditTeam(team)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
        </TabsContent>
        
        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Structure</CardTitle>
              <CardDescription>
                Visual representation of your team hierarchy. Drag and drop teams to rearrange.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-6 py-1">
                      <div className="h-2 bg-slate-200 rounded"></div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : rootTeams && rootTeams.length > 0 ? (
                <div className="space-y-2">
                  {rootTeams.map(team => (
                    <TeamMappingItem 
                      key={team.id} 
                      team={team} 
                      teams={teams || []} 
                      onEdit={handleEditTeam}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Teams Found</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first team to start building your organizational structure.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Team
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default TeamsConfig;
