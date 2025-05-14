import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  currentMembers: User[];
}

export function AddTeamMemberModal({ 
  isOpen, 
  onClose, 
  teamId,
  currentMembers = []
}: AddTeamMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantContext();
  const tenantId = currentTenant?.id;
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get all users in the tenant
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/users?tenantId=${tenantId}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: !!tenantId && isOpen
  });

  // Filter out users already in the team
  const availableUsers = users.filter(
    (user: User) => !currentMembers.some(member => member.id === user.id)
  );
  
  // Filter users based on search
  const filteredUsers = searchQuery 
    ? availableUsers.filter((user: User) => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const username = user.username.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || 
               username.includes(query) || 
               email.includes(query);
      })
    : availableUsers;

  // Add user to team mutation
  const addUserToTeamMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/users/${userId}/team`, {
        teamId,
        tenantId
      });
    },
    onSuccess: () => {
      toast({
        title: "Team Member Added",
        description: "The user has been successfully added to the team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "performance"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add team member: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleAddUser = (userId: string) => {
    addUserToTeamMutation.mutate(userId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add existing users from your organization to this team.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users by name, username or email..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            {usersLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                          ) : (
                            <AvatarFallback>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.email && (
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{user.username}</span>
                          {user.role && (
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => handleAddUser(user.id)}
                          disabled={addUserToTeamMutation.isPending && 
                                   addUserToTeamMutation.variables === user.id}
                        >
                          {addUserToTeamMutation.isPending && 
                           addUserToTeamMutation.variables === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : "Add"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-muted-foreground">
                  {searchQuery ? (
                    <>No users found matching "{searchQuery}"</>
                  ) : (
                    <>No available users to add to this team</>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}