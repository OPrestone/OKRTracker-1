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
  Users
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table/data-table";

export default function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [teamAssignment, setTeamAssignment] = useState<{ teamId: string | number }>({ teamId: "" });
  const { toast } = useToast();
  
  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  // Fetch teams
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User deleted successfully",
        description: "The user has been permanently removed from the system",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting user",
        description: "There was a problem deleting the user. Please try again.",
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
  
  const isLoading = isLoadingUsers || isLoadingTeams;
  
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
          <Button>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              {selectedUser && 
                `Are you sure you want to delete ${selectedUser.firstName} ${selectedUser.lastName}? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <p className="text-sm text-gray-600">
              Deleting this user will remove all their information and permissions from the system.
              {selectedUser?.teamId && " They will also be removed from their assigned team."}
            </p>
            
            {(selectedUser && users.some(u => u.managerId === selectedUser.id)) && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
                <strong>Warning:</strong> This user is a manager for other users. 
                Those users will no longer have a manager assigned.
              </div>
            )}
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
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
