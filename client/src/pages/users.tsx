import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { useHelp } from "@/hooks/use-help-context";
import { HelpItemTooltip } from "@/components/help/help-item-tooltip";
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
  Users 
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
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                <DropdownMenuItem>Assign to Team</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
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
