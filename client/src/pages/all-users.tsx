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

export default function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
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
      setTeamAssignment({ teamId: "" });
      
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
    
    const teamId = teamAssignment.teamId === "" ? null : Number(teamAssignment.teamId);
    assignTeamMutation.mutate({ id: selectedUser.id, teamId });
  };
  
  const openTeamAssignDialog = (user: User) => {
    setSelectedUser(user);
    setTeamAssignment({ teamId: user.teamId?.toString() || "" });
    setIsTeamAssignDialogOpen(true);
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

  return (
    <DashboardLayout title="All Users">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600">View and manage all users in the system</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[200px] lg:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="w-[250px]">User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Onboarding</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-medium">
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
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
                          {(user.role || 'user').charAt(0).toUpperCase() + (user.role || 'user').slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-[80px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${user.onboardingProgress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {user.onboardingProgress || 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No users match "${searchTerm}"` : "Add users to get started"}
              </p>
              <Button 
                className="mt-4"
                variant="outline"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Your First User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
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
    </DashboardLayout>
  );
}
