import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, Team } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  ShieldCheck,
  Mail,
  Phone,
  Building,
  Users,
  Building2
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useTenantContext } from "@/hooks/use-tenant-context";

export default function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
  const [isOrgAssignDialogOpen, setIsOrgAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [teamAssignment, setTeamAssignment] = useState<{ teamId: string | number }>({ teamId: "" });
  const [orgAssignment, setOrgAssignment] = useState<{ tenantId: string, role: "owner" | "admin" | "member" }>({ 
    tenantId: "", 
    role: "member" 
  });
  const [newUser, setNewUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    teamId: '',
    role: 'member', // Change default role to 'member' which is a tenant role
    tenantRole: 'member', // Add tenant role field (separate from system role)
    department: '',
    title: ''
  });
  const { toast } = useToast();
  const { tenantId } = useTenantContext();
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch teams
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });
  
  // Fetch tenants
  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ["/api/tenants"],
  });
  
  // Assign team mutation
  const assignTeamMutation = useMutation({
    mutationFn: async ({ id, teamId }: { id: number, teamId: number | null }) => {
      if (teamId === null) {
        // Remove from team
        const res = await apiRequest("DELETE", `/api/users/${id}/team`);
        return await res.json();
      } else {
        // Assign to team
        const res = await apiRequest("POST", `/api/users/${id}/team`, { teamId });
        return await res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // If the user is assigned to a team, also invalidate team members
      if (data.teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams", data.teamId, "users"] });
      }
      
      setIsTeamAssignDialogOpen(false);
      setSelectedUser(null);
      setTeamAssignment({ teamId: "0" });
      
      const action = data.teamId ? "assigned to" : "removed from";
      const teamName = data.teamId && teams 
        ? teams.find(t => t.id === data.teamId)?.name || "the team"
        : "any team";
        
      toast({
        title: `Team ${action === "assigned to" ? "assignment" : "removal"} successful`,
        description: `User has been ${action} ${teamName}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: "There was a problem updating the team assignment",
        variant: "destructive",
      });
    }
  });
  
  const handleAssignTeam = () => {
    if (!selectedUser) return;
    
    const teamId = teamAssignment.teamId === "" || teamAssignment.teamId === "0" ? null : Number(teamAssignment.teamId);
    assignTeamMutation.mutate({ id: selectedUser.id, teamId });
  };
  
  const openTeamAssignDialog = (user: User) => {
    setSelectedUser(user);
    setTeamAssignment({ teamId: user.teamId?.toString() || "0" });
    setIsTeamAssignDialogOpen(true);
  };

  // Organization assignment mutation
  const assignOrgMutation = useMutation({
    mutationFn: async ({ userId, tenantId, role }: { userId: string, tenantId: string, role: "owner" | "admin" | "member" }) => {
      const res = await apiRequest("POST", `/api/tenants/${tenantId}/users`, { userId, role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      setIsOrgAssignDialogOpen(false);
      setSelectedUser(null);
      setOrgAssignment({ tenantId: "", role: "member" });
      
      toast({
        title: "Success",
        description: "User added to organization successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add user to organization: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleAssignOrg = () => {
    if (!selectedUser) return;
    assignOrgMutation.mutate({ 
      userId: selectedUser.id, 
      tenantId: orgAssignment.tenantId,
      role: orgAssignment.role
    });
  };
  
  const openOrgAssignDialog = (user: User) => {
    setSelectedUser(user);
    setOrgAssignment({ tenantId: "", role: "member" });
    setIsOrgAssignDialogOpen(true);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const res = await apiRequest("POST", `/api/users`, {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        password: userData.password, // Optional, will be generated if not provided
        department: userData.department,
        title: userData.title,
        role: userData.tenantRole, // Tenant-specific role (member, admin, owner)
        teamId: userData.teamId ? userData.teamId : null,
        tenantId: tenantId, // Assign user to current tenant
      });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // If a team was assigned, also invalidate team members
      if (data.teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams", data.teamId, "users"] });
      }
      
      setIsAddUserDialogOpen(false);
      setNewUser({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        teamId: '',
        role: 'member',
        tenantRole: 'member',
        department: '',
        title: ''
      });
      
      const isNewUser = data.isNewUser;
      toast({
        title: isNewUser ? "User created successfully" : "User added to organization",
        description: isNewUser 
          ? "A new user has been created and added to your organization" 
          : "Existing user has been added to your organization",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating user",
        description: `There was a problem: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // This endpoint will handle removing the user from current tenant
      // and only completely delete the user if they don't belong to other tenants
      const res = await apiRequest("DELETE", `/api/users/${userId}?tenantId=${tenantId}`);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // If user had a team, also invalidate team members
      if (selectedUser?.teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams", selectedUser.teamId, "users"] });
      }
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      const completelyRemoved = data.completelyRemoved;
      toast({
        title: completelyRemoved ? "User deleted completely" : "User removed from organization",
        description: completelyRemoved 
          ? "The user has been permanently removed from the system" 
          : "The user has been removed from this organization but still exists in other organizations",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing user",
        description: `There was a problem: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const openAddUserDialog = () => {
    setIsAddUserDialogOpen(true);
  };
  
  const handleCreateUser = () => {
    createUserMutation.mutate(newUser);
  };
  
  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Helper function to get tenant name by ID
  const getTenantName = (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    return tenant?.name || tenant?.displayName || 'Unnamed Organization';
  };
  
  const isLoading = isLoadingUsers || isLoadingTeams || isLoadingTenants;
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "manager":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "active" ? 
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge> : 
      <Badge variant="outline" className="text-gray-500">Inactive</Badge>;
  };
  
  // Define the columns for the users table
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {`${user.firstName[0]}${user.lastName[0]}`}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-sm">
            <div className="flex items-center text-gray-700">
              <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              {user.email}
            </div>
            <div className="flex items-center text-gray-600 mt-1">
              <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              Language: {user.language || 'en'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "teamId",
      header: "Team",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <>
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>
                {user.teamId ? 
                  teams.find(t => t.id === user.teamId)?.name || 'Loading...' : 
                  'No Team'}
              </span>
            </div>
            {user.managerId && (
              <div className="text-xs text-gray-500 mt-0.5">
                Manager: {users.find(u => u.id === user.managerId)?.firstName || 'Loading...'}
              </div>
            )}
          </>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role || 'user';
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "onboardingProgress",
      header: "Onboarding",
      cell: ({ row }) => {
        const progress = row.original.onboardingProgress || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-[80px] h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {progress}%
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openTeamAssignDialog(user)}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openOrgAssignDialog(user)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Add to Organization
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Manage Permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => openDeleteDialog(user)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout title="All Users">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">View and manage all users in the system</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={openAddUserDialog}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[450px] w-full rounded-lg" />
        </div>
      ) : (
        <DataTable
          columns={userColumns}
          data={filteredUsers || []}
          searchColumn="username"
          searchPlaceholder="Search users..."
          tableTitle="All Users"
        />
      )}
      
      {/* Team Assignment Dialog */}
      <Dialog open={isTeamAssignDialogOpen} onOpenChange={setIsTeamAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Team</DialogTitle>
            <DialogDescription>
              {selectedUser && `Select a team for ${selectedUser.firstName} ${selectedUser.lastName} or remove from current team.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Select
                value={teamAssignment.teamId.toString()}
                onValueChange={(value) => setTeamAssignment({ teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Team</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTeam}
              disabled={assignTeamMutation.isPending}
            >
              {assignTeamMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Assignment Dialog */}
      <Dialog open={isOrgAssignDialogOpen} onOpenChange={setIsOrgAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User to Organization</DialogTitle>
            <DialogDescription>
              {selectedUser && `Add ${selectedUser.firstName} ${selectedUser.lastName} to an organization with a specific role.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Organization</label>
              <Select
                value={orgAssignment.tenantId}
                onValueChange={(value) => setOrgAssignment({ ...orgAssignment, tenantId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant: any) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name || tenant.displayName || 'Unnamed Organization'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select
                value={orgAssignment.role}
                onValueChange={(value) => setOrgAssignment({ ...orgAssignment, role: value as "owner" | "admin" | "member" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Owner:</strong> Full access to manage organization settings, members, and all data.<br/>
                <strong>Admin:</strong> Can manage teams, users, and data but cannot delete the organization.<br/>
                <strong>Member:</strong> Can participate in teams and access data, but cannot manage organizational settings.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrgAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignOrg}
              disabled={assignOrgMutation.isPending || !orgAssignment.tenantId}
            >
              {assignOrgMutation.isPending ? "Adding..." : "Add to Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove User from Organization</DialogTitle>
            <DialogDescription>
              {selectedUser && 
                `Are you sure you want to remove ${selectedUser.firstName} ${selectedUser.lastName} from this organization?`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>The user will lose access to all data in this organization</li>
                <li>Their role assignments and team memberships in this organization will be removed</li>
                <li>If they don't belong to any other organizations, their account will be completely deleted</li>
              </ul>
            </div>
            
            {selectedUser?.teamId && (
              <p className="text-sm">
                <strong>Team assignment:</strong> This user is currently a member of {' '}
                {teams.find(t => t.id === selectedUser.teamId)?.name || "a team"} 
                {' '} and will be removed from it.
              </p>
            )}
            
            {(selectedUser && users.some(u => u.managerId === selectedUser.id)) && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                <strong>Warning:</strong> This user is a manager for other users. 
                Those users will no longer have a manager assigned if this user is removed.
              </div>
            )}
            
            <p className="text-sm font-medium">This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Removing..." : "Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add User to Organization</DialogTitle>
            <DialogDescription>
              Add a new or existing user to this organization. Only email is required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-sm text-blue-800">
              <p className="font-medium">Note about email invitations:</p>
              <p>New users will receive an email with account details. If the email already exists in the system, the user will be invited to join this organization.</p>
            </div>
          
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={newUser.firstName}
                  onChange={handleNewUserInputChange}
                  placeholder="John"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={newUser.lastName}
                  onChange={handleNewUserInputChange}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center">
                Email <span className="text-red-500 ml-1">*</span>
              </label>
              <Input
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleNewUserInputChange}
                type="email"
                placeholder="john.doe@example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <Input
                  id="username"
                  name="username"
                  value={newUser.username}
                  onChange={handleNewUserInputChange}
                  placeholder="johndoe"
                />
                <p className="text-xs text-muted-foreground">If left empty, will be generated from email</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <Input
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserInputChange}
                  type="password"
                  placeholder="••••••••"
                />
                <p className="text-xs text-muted-foreground">If left empty, a secure password will be generated</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">Department</label>
                <Input
                  id="department"
                  name="department"
                  value={newUser.department}
                  onChange={handleNewUserInputChange}
                  placeholder="Marketing"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Job Title</label>
                <Input
                  id="title"
                  name="title"
                  value={newUser.title}
                  onChange={handleNewUserInputChange}
                  placeholder="Marketing Manager"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="tenantRole" className="text-sm font-medium">Organization Role</label>
                <Select
                  value={newUser.tenantRole}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, tenantRole: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <strong>Member:</strong> Regular user
                  <br />
                  <strong>Admin:</strong> Can manage users/teams
                  <br />
                  <strong>Owner:</strong> Full organization control
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="teamId" className="text-sm font-medium">Assign to Team</label>
                <Select
                  value={newUser.teamId.toString()}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, teamId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending || !newUser.email}
            >
              {createUserMutation.isPending ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
