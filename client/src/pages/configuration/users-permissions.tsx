import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Search,
  AlertCircle,
  ShieldCheck,
  PlusCircle,
  Edit,
  Save,
  Trash2,
  User,
  Users,
  Lock
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User as UserType, AccessGroup } from "@shared/schema";

const UsersPermissions = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isNewAccessGroupDialogOpen, setIsNewAccessGroupDialogOpen] = useState(false);
  const [isEditAccessGroupDialogOpen, setIsEditAccessGroupDialogOpen] = useState(false);
  
  // Form state for new user
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "user",
    language: "en",
    teamId: "",
    managerId: ""
  });

  // Form state for access group
  const [accessGroupForm, setAccessGroupForm] = useState({
    id: 0,
    name: "",
    description: "",
    permissions: {
      createOKRs: false,
      editAllOKRs: false,
      deleteOKRs: false,
      viewAllOKRs: true,
      manageUsers: false,
      manageTeams: false,
      manageSettings: false,
      createKeyResults: false,
      editAssignedKeyResults: true,
      createInitiatives: false,
      editAssignedInitiatives: true
    }
  });

  // Selected access group for editing
  const [selectedAccessGroup, setSelectedAccessGroup] = useState<AccessGroup | null>(null);

  // Fetch users and teams
  const { data: users, isLoading: usersLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"]
  });

  const { data: teams } = useQuery({
    queryKey: ["/api/teams"]
  });

  // Fetch access groups
  const { data: accessGroups, isLoading: accessGroupsLoading } = useQuery<AccessGroup[]>({
    queryKey: ["/api/access-groups"]
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsNewUserDialogOpen(false);
      resetNewUserForm();
      toast({
        title: "User created",
        description: "The user has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create access group mutation
  const createAccessGroupMutation = useMutation({
    mutationFn: async (accessGroupData: any) => {
      const res = await apiRequest("POST", "/api/access-groups", accessGroupData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-groups"] });
      setIsNewAccessGroupDialogOpen(false);
      resetAccessGroupForm();
      toast({
        title: "Access group created",
        description: "The access group has been created successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating access group",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update access group mutation
  const updateAccessGroupMutation = useMutation({
    mutationFn: async (accessGroupData: any) => {
      const { id, ...updateData } = accessGroupData;
      const res = await apiRequest("PATCH", `/api/access-groups/${id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-groups"] });
      setIsEditAccessGroupDialogOpen(false);
      setSelectedAccessGroup(null);
      toast({
        title: "Access group updated",
        description: "The access group has been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating access group",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle form changes
  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setAccessGroupForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
  };

  // Form reset functions
  const resetNewUserForm = () => {
    setNewUser({
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "user",
      language: "en",
      teamId: "",
      managerId: ""
    });
  };

  const resetAccessGroupForm = () => {
    setAccessGroupForm({
      id: 0,
      name: "",
      description: "",
      permissions: {
        createOKRs: false,
        editAllOKRs: false,
        deleteOKRs: false,
        viewAllOKRs: true,
        manageUsers: false,
        manageTeams: false,
        manageSettings: false,
        createKeyResults: false,
        editAssignedKeyResults: true,
        createInitiatives: false,
        editAssignedInitiatives: true
      }
    });
  };

  // Form submission handlers
  const handleCreateUser = () => {
    const userData = {
      ...newUser,
      teamId: newUser.teamId ? parseInt(newUser.teamId) : null,
      managerId: newUser.managerId ? parseInt(newUser.managerId) : null
    };
    
    createUserMutation.mutate(userData);
  };

  const handleCreateAccessGroup = () => {
    const accessGroupData = {
      name: accessGroupForm.name,
      description: accessGroupForm.description,
      permissions: accessGroupForm.permissions
    };
    
    createAccessGroupMutation.mutate(accessGroupData);
  };

  const handleUpdateAccessGroup = () => {
    if (!selectedAccessGroup) return;
    
    const accessGroupData = {
      id: selectedAccessGroup.id,
      name: accessGroupForm.name,
      description: accessGroupForm.description,
      permissions: accessGroupForm.permissions
    };
    
    updateAccessGroupMutation.mutate(accessGroupData);
  };

  const handleEditAccessGroup = (accessGroup: AccessGroup) => {
    setSelectedAccessGroup(accessGroup);
    setAccessGroupForm({
      id: accessGroup.id,
      name: accessGroup.name,
      description: accessGroup.description || "",
      permissions: {
        ...accessGroupForm.permissions,
        ...(accessGroup.permissions as any)
      }
    });
    setIsEditAccessGroupDialogOpen(true);
  };

  // Filter users based on search query
  const filteredUsers = users?.filter(user => {
    return (
      searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName + " " + user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter access groups based on search query
  const filteredAccessGroups = accessGroups?.filter(group => {
    return (
      searchQuery === "" || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Get team name by ID
  const getTeamName = (teamId: number | null | undefined) => {
    if (!teamId || !teams) return "None";
    const team = teams.find((t: any) => t.id === teamId);
    return team ? team.name : "Unknown";
  };

  return (
    <DashboardLayout title="Users & Permissions">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users & Permissions</h1>
        <p className="text-gray-600">Manage user accounts and permission groups</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="access-groups" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>Access Groups</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                className="pl-9 w-full sm:w-[300px]"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. They will receive an email with login instructions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input 
                        id="firstName" 
                        name="firstName"
                        value={newUser.firstName}
                        onChange={handleNewUserChange}
                        placeholder="John" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input 
                        id="lastName" 
                        name="lastName"
                        value={newUser.lastName}
                        onChange={handleNewUserChange}
                        placeholder="Doe" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={newUser.email}
                      onChange={handleNewUserChange}
                      placeholder="john.doe@example.com" 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      name="username"
                      value={newUser.username}
                      onChange={handleNewUserChange}
                      placeholder="johndoe" 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      name="password"
                      type="password"
                      value={newUser.password}
                      onChange={handleNewUserChange}
                      placeholder="••••••••" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value) => handleSelectChange("role", value)}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Team Lead</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={newUser.language} 
                        onValueChange={(value) => handleSelectChange("language", value)}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="team">Team</Label>
                    <Select 
                      value={newUser.teamId} 
                      onValueChange={(value) => handleSelectChange("teamId", value)}
                    >
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Assign to team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {teams?.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select 
                      value={newUser.managerId} 
                      onValueChange={(value) => handleSelectChange("managerId", value)}
                    >
                      <SelectTrigger id="manager">
                        <SelectValue placeholder="Assign a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {users?.filter(u => u.role === "manager" || u.role === "admin").map(user => (
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
                      resetNewUserForm();
                      setIsNewUserDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateUser}
                    disabled={
                      !newUser.username || 
                      !newUser.password || 
                      !newUser.firstName || 
                      !newUser.lastName || 
                      !newUser.email ||
                      createUserMutation.isPending
                    }
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {usersLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => {
                      const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.firstName} {user.lastName}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getTeamName(user.teamId)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={
                                user.role === "admin" 
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                                  : user.role === "manager" 
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              Assign Groups
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
              <AlertTitle>No users found</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? `No users matching "${searchQuery}" were found. Try a different search.` 
                  : "No users have been created yet. Create a new user to get started."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Access Groups Tab */}
        <TabsContent value="access-groups">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                className="pl-9 w-full sm:w-[300px]"
                placeholder="Search access groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isNewAccessGroupDialogOpen} onOpenChange={setIsNewAccessGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Access Group
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Create New Access Group</DialogTitle>
                  <DialogDescription>
                    Configure a new access group to define permissions for users.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input 
                      id="group-name" 
                      value={accessGroupForm.name}
                      onChange={(e) => setAccessGroupForm({
                        ...accessGroupForm,
                        name: e.target.value
                      })}
                      placeholder="e.g., OKR Contributors" 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="group-description">Description</Label>
                    <Input 
                      id="group-description" 
                      value={accessGroupForm.description}
                      onChange={(e) => setAccessGroupForm({
                        ...accessGroupForm,
                        description: e.target.value
                      })}
                      placeholder="Description of this access group's purpose" 
                    />
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">OKR Editing and Creation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="create-okrs" 
                          checked={accessGroupForm.permissions.createOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="create-okrs">Allow OKR Creation</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-all-okrs" 
                          checked={accessGroupForm.permissions.editAllOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAllOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-all-okrs">Allow Editing All OKRs</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="delete-okrs" 
                          checked={accessGroupForm.permissions.deleteOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("deleteOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="delete-okrs">Allow Deleting OKRs</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="view-all-okrs" 
                          checked={accessGroupForm.permissions.viewAllOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("viewAllOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="view-all-okrs">Allow Viewing All OKRs</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">Key Results & Initiatives</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="create-key-results" 
                          checked={accessGroupForm.permissions.createKeyResults}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createKeyResults", checked as boolean)
                          }
                        />
                        <Label htmlFor="create-key-results">Allow Creating Key Results</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-assigned-key-results" 
                          checked={accessGroupForm.permissions.editAssignedKeyResults}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAssignedKeyResults", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-assigned-key-results">Allow Editing Assigned Key Results</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="create-initiatives" 
                          checked={accessGroupForm.permissions.createInitiatives}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createInitiatives", checked as boolean)
                          }
                        />
                        <Label htmlFor="create-initiatives">Allow Creating Initiatives</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-assigned-initiatives" 
                          checked={accessGroupForm.permissions.editAssignedInitiatives}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAssignedInitiatives", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-assigned-initiatives">Allow Editing Assigned Initiatives</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">Administration</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="manage-users" 
                          checked={accessGroupForm.permissions.manageUsers}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageUsers", checked as boolean)
                          }
                        />
                        <Label htmlFor="manage-users">Allow Managing Users</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="manage-teams" 
                          checked={accessGroupForm.permissions.manageTeams}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageTeams", checked as boolean)
                          }
                        />
                        <Label htmlFor="manage-teams">Allow Managing Teams</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="manage-settings" 
                          checked={accessGroupForm.permissions.manageSettings}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageSettings", checked as boolean)
                          }
                        />
                        <Label htmlFor="manage-settings">Allow Managing System Settings</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetAccessGroupForm();
                      setIsNewAccessGroupDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateAccessGroup}
                    disabled={!accessGroupForm.name || createAccessGroupMutation.isPending}
                  >
                    {createAccessGroupMutation.isPending ? "Creating..." : "Create Access Group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {/* Edit Access Group Dialog */}
            <Dialog open={isEditAccessGroupDialogOpen} onOpenChange={setIsEditAccessGroupDialogOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Edit Access Group</DialogTitle>
                  <DialogDescription>
                    Update access group settings and permissions.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-group-name">Group Name</Label>
                    <Input 
                      id="edit-group-name" 
                      value={accessGroupForm.name}
                      onChange={(e) => setAccessGroupForm({
                        ...accessGroupForm,
                        name: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-group-description">Description</Label>
                    <Input 
                      id="edit-group-description" 
                      value={accessGroupForm.description}
                      onChange={(e) => setAccessGroupForm({
                        ...accessGroupForm,
                        description: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">OKR Editing and Creation</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-create-okrs" 
                          checked={accessGroupForm.permissions.createOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-create-okrs">Allow OKR Creation</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-edit-all-okrs" 
                          checked={accessGroupForm.permissions.editAllOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAllOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-edit-all-okrs">Allow Editing All OKRs</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-delete-okrs" 
                          checked={accessGroupForm.permissions.deleteOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("deleteOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-delete-okrs">Allow Deleting OKRs</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-view-all-okrs" 
                          checked={accessGroupForm.permissions.viewAllOKRs}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("viewAllOKRs", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-view-all-okrs">Allow Viewing All OKRs</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">Key Results & Initiatives</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-create-key-results" 
                          checked={accessGroupForm.permissions.createKeyResults}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createKeyResults", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-create-key-results">Allow Creating Key Results</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-edit-assigned-key-results" 
                          checked={accessGroupForm.permissions.editAssignedKeyResults}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAssignedKeyResults", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-edit-assigned-key-results">Allow Editing Assigned Key Results</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-create-initiatives" 
                          checked={accessGroupForm.permissions.createInitiatives}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("createInitiatives", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-create-initiatives">Allow Creating Initiatives</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-edit-assigned-initiatives" 
                          checked={accessGroupForm.permissions.editAssignedInitiatives}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("editAssignedInitiatives", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-edit-assigned-initiatives">Allow Editing Assigned Initiatives</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <h3 className="font-medium text-sm mb-3">Administration</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-manage-users" 
                          checked={accessGroupForm.permissions.manageUsers}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageUsers", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-manage-users">Allow Managing Users</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-manage-teams" 
                          checked={accessGroupForm.permissions.manageTeams}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageTeams", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-manage-teams">Allow Managing Teams</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="edit-manage-settings" 
                          checked={accessGroupForm.permissions.manageSettings}
                          onCheckedChange={(checked) => 
                            handlePermissionChange("manageSettings", checked as boolean)
                          }
                        />
                        <Label htmlFor="edit-manage-settings">Allow Managing System Settings</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedAccessGroup(null);
                      setIsEditAccessGroupDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateAccessGroup}
                    disabled={!accessGroupForm.name || updateAccessGroupMutation.isPending}
                  >
                    {updateAccessGroupMutation.isPending ? "Updating..." : "Update Access Group"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {accessGroupsLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded mb-4"></div>
              ))}
            </div>
          ) : filteredAccessGroups && filteredAccessGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccessGroups.map(group => (
                <Card key={group.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle>{group.name}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => handleEditAccessGroup(group)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Key Permissions:</h4>
                      <div className="space-y-1">
                        {(group.permissions as any)?.createOKRs && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Create OKRs</span>
                          </div>
                        )}
                        {(group.permissions as any)?.editAllOKRs && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Edit All OKRs</span>
                          </div>
                        )}
                        {(group.permissions as any)?.manageUsers && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Manage Users</span>
                          </div>
                        )}
                        {(group.permissions as any)?.manageTeams && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Manage Teams</span>
                          </div>
                        )}
                        {(group.permissions as any)?.manageSettings && (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>Manage System Settings</span>
                          </div>
                        )}
                        {!(group.permissions as any)?.createOKRs && 
                          !(group.permissions as any)?.editAllOKRs && 
                          !(group.permissions as any)?.manageUsers && 
                          !(group.permissions as any)?.manageTeams && 
                          !(group.permissions as any)?.manageSettings && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            <span>Basic access only</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No access groups found</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? `No access groups matching "${searchQuery}" were found. Try a different search.` 
                  : "No access groups have been created yet. Create a new access group to get started."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default UsersPermissions;
