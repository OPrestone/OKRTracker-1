import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useHelp } from "@/hooks/use-help-context";
import { HelpTooltip } from "@/components/help/tooltip";
import { usersHelp } from "@/components/help/help-content";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AlertCircle, 
  PlusCircle,
  Search, 
  MoreHorizontal, 
  UserPlus, 
  ShieldCheck, 
  Users,
  Pencil,
  UserCog,
  UserX,
  UserCheck
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Team, AccessGroup } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const UsersPage = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { isNewUser } = useHelp();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
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
  
  // Form state for editing user
  const [editUser, setEditUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    language: "",
    managerId: ""
  });
  
  // Form state for team assignment
  const [teamAssignment, setTeamAssignment] = useState({
    teamId: ""
  });

  // Fetch users, teams, and access groups
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"]
  });

  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams"]
  });

  const { data: accessGroups } = useQuery<AccessGroup[]>({
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
        description: "The user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User updated",
        description: "The user has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Assign team mutation
  const assignTeamMutation = useMutation({
    mutationFn: async ({ id, teamId }: { id: number, teamId: number | null }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { teamId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsTeamAssignDialogOpen(false);
      setSelectedUser(null);
      setTeamAssignment({ teamId: "" });
      toast({
        title: "Team assigned",
        description: "The user has been assigned to a new team.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error assigning team",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Deactivate user mutation (we'll simulate this by changing the role to "inactive")
  const deactivateUserMutation = useMutation({
    mutationFn: async (id: number) => {
      // In a real application, you might want to implement a proper deactivation
      // Here we're just updating the role to indicate the user is inactive
      const res = await apiRequest("PATCH", `/api/users/${id}`, { role: "inactive" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeactivateDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "User deactivated",
        description: "The user has been deactivated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deactivating user",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter users based on active tab and search query
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      searchQuery === "" || 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.firstName + " " + user.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "admins") return user.role === "admin" && matchesSearch;
    if (activeTab === "team-leads") return user.role === "manager" && matchesSearch;
    return matchesSearch;
  });

  const handleNewUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

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

  const handleCreateUser = () => {
    // Convert teamId and managerId from string to number or null
    const userData = {
      ...newUser,
      teamId: newUser.teamId ? parseInt(newUser.teamId) : null,
      managerId: newUser.managerId ? parseInt(newUser.managerId) : null
    };
    
    createUserMutation.mutate(userData);
  };

  // Find team name by ID
  const getTeamName = (teamId: number | null | undefined) => {
    if (!teamId || !teams) return "None";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Unknown";
  };

  return (
    <DashboardLayout title="Users">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-1">
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            {isNewUser && (
              <span className="ml-2">
                <HelpTooltip 
                  id={usersHelp.id}
                  title={usersHelp.title}
                  description={usersHelp.description}
                />
              </span>
            )}
          </div>
          <p className="text-gray-600">Manage users and their access to the system</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input 
              className="pl-9"
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
                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      value={newUser.firstName}
                      onChange={handleNewUserChange}
                      placeholder="John" 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Last Name
                    </label>
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
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
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
                  <label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <Input 
                    id="username" 
                    name="username"
                    value={newUser.username}
                    onChange={handleNewUserChange}
                    placeholder="johndoe" 
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </label>
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
                    <label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Role
                    </label>
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
                    <label htmlFor="language" className="text-sm font-medium text-gray-700">
                      Language
                    </label>
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
                  <label htmlFor="team" className="text-sm font-medium text-gray-700">
                    Team
                  </label>
                  <Select 
                    value={newUser.teamId} 
                    onValueChange={(value) => handleSelectChange("teamId", value)}
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Assign to team" />
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
                  <label htmlFor="manager" className="text-sm font-medium text-gray-700">
                    Manager
                  </label>
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
      </div>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="editFirstName" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input 
                  id="editFirstName" 
                  value={editUser.firstName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="editLastName" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input 
                  id="editLastName" 
                  value={editUser.lastName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, lastName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="editEmail" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input 
                id="editEmail" 
                type="email"
                value={editUser.email}
                onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="editRole" className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <Select 
                  value={editUser.role} 
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger id="editRole">
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
                <label htmlFor="editLanguage" className="text-sm font-medium text-gray-700">
                  Language
                </label>
                <Select 
                  value={editUser.language} 
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger id="editLanguage">
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
              <label htmlFor="editManager" className="text-sm font-medium text-gray-700">
                Manager
              </label>
              <Select 
                value={editUser.managerId} 
                onValueChange={(value) => setEditUser(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger id="editManager">
                  <SelectValue placeholder="Assign a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users?.filter(u => 
                    (u.role === "manager" || u.role === "admin") && 
                    u.id !== selectedUser?.id // Don't show current user as an option
                  ).map(user => (
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
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedUser) return;
                
                updateUserMutation.mutate({
                  id: selectedUser.id,
                  data: {
                    firstName: editUser.firstName,
                    lastName: editUser.lastName,
                    email: editUser.email,
                    role: editUser.role,
                    language: editUser.language,
                    managerId: editUser.managerId ? parseInt(editUser.managerId) : null
                  }
                });
              }}
              disabled={
                !editUser.firstName || 
                !editUser.lastName || 
                !editUser.email ||
                updateUserMutation.isPending
              }
            >
              {updateUserMutation.isPending ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Team Assignment Dialog */}
      <Dialog open={isTeamAssignDialogOpen} onOpenChange={setIsTeamAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Team</DialogTitle>
            <DialogDescription>
              Update team assignment for {selectedUser?.firstName} {selectedUser?.lastName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid gap-2">
              <label htmlFor="assignTeam" className="text-sm font-medium text-gray-700">
                Team
              </label>
              <Select 
                value={teamAssignment.teamId} 
                onValueChange={(value) => setTeamAssignment({ teamId: value })}
              >
                <SelectTrigger id="assignTeam">
                  <SelectValue placeholder="Select team" />
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
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTeamAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedUser) return;
                
                assignTeamMutation.mutate({
                  id: selectedUser.id,
                  teamId: teamAssignment.teamId ? parseInt(teamAssignment.teamId) : null
                });
              }}
              disabled={assignTeamMutation.isPending}
            >
              {assignTeamMutation.isPending ? "Assigning..." : "Assign Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Deactivate User Dialog */}
      <AlertDialog open={isDeactivateDialogOpen} onOpenChange={setIsDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {selectedUser?.firstName} {selectedUser?.lastName}? 
              This will prevent them from accessing the system, but their data will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!selectedUser) return;
                deactivateUserMutation.mutate(selectedUser.id);
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deactivateUserMutation.isPending}
            >
              {deactivateUserMutation.isPending ? "Deactivating..." : "Deactivate User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="team-leads">Team Leads</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          {usersLoading ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="p-6 flex justify-center">
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
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
                                (user.role || "") === "admin" 
                                  ? "bg-purple-100 text-purple-800 hover:bg-purple-100" 
                                  : (user.role || "") === "manager" 
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100" 
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "User"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedUser(user);
                                    
                                    // Initialize edit form with current values
                                    setEditUser({
                                      firstName: user.firstName,
                                      lastName: user.lastName,
                                      email: user.email,
                                      role: user.role || "user",
                                      language: user.language || "en",
                                      managerId: user.managerId ? user.managerId.toString() : ""
                                    });
                                    
                                    setIsEditUserDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setTeamAssignment({
                                      teamId: user.teamId ? user.teamId.toString() : ""
                                    });
                                    setIsTeamAssignDialogOpen(true);
                                  }}
                                >
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Assign to Team
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDeactivateDialogOpen(true);
                                  }}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Deactivate User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No users found</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? `No users matching "${searchQuery}" were found. Try a different search.` 
                  : "No users have been created yet."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Users;
