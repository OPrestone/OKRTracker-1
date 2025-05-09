import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { 
  CircleUser, 
  Loader2, 
  MoreHorizontal, 
  Shield, 
  ShieldCheck, 
  UserPlus, 
  X 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

interface TenantUser extends User {
  userRole: string;
}

interface TenantUsersProps {
  tenantId: number;
}

export function TenantUsers({ tenantId }: TenantUsersProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("member");

  // Fetch the users for the current tenant
  const { data: tenantUsers = [], isLoading } = useQuery({
    queryKey: ['/api/tenants', tenantId, 'users'],
    enabled: !!tenantId,
  });

  // Fetch all users to add to the tenant
  const { data: allUsers = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: isAddingUser,
  });

  // Filter out users already in the tenant
  const availableUsers = allUsers.filter(
    (user: User) => !tenantUsers.some((tu: TenantUser) => tu.id === user.id)
  );

  // Add user to tenant mutation
  const addUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("POST", `/api/tenants/${tenantId}/users`, { userId, role });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId, 'users'] });
      setIsAddingUser(false);
      setSelectedUserId(null);
      setSelectedRole("member");
      toast({
        title: "User added",
        description: "User has been added to the organization.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user to organization",
        variant: "destructive",
      });
    },
  });

  // Remove user from tenant mutation
  const removeUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/tenants/${tenantId}/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId, 'users'] });
      toast({
        title: "User removed",
        description: "User has been removed from the organization.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove user from organization",
        variant: "destructive",
      });
    },
  });

  const handleAddUser = () => {
    if (!selectedUserId) {
      toast({
        title: "Error",
        description: "Please select a user to add",
        variant: "destructive",
      });
      return;
    }

    addUserMutation.mutate({ 
      userId: selectedUserId, 
      role: selectedRole 
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <ShieldCheck className="h-4 w-4 text-primary" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <CircleUser className="h-4 w-4 text-gray-500" />;
    }
  };

  // Check if current user is owner or admin of this tenant
  const currentUserRole = tenantUsers.find((tu: TenantUser) => tu.id === user?.id)?.userRole;
  const canManageUsers = 
    currentUserRole === "owner" || 
    currentUserRole === "admin" || 
    user?.role === "admin";

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Organization Members</CardTitle>
          <CardDescription>
            Manage users in this organization.
          </CardDescription>
        </div>
        {canManageUsers && (
          <Button size="sm" onClick={() => setIsAddingUser(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {canManageUsers && <TableHead className="w-[60px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageUsers ? 4 : 3} className="text-center py-6 text-muted-foreground">
                    No users found in this organization
                  </TableCell>
                </TableRow>
              ) : (
                tenantUsers.map((tenantUser: TenantUser) => (
                  <TableRow key={tenantUser.id}>
                    <TableCell className="flex items-center gap-2">
                      {tenantUser.avatar ? (
                        <img 
                          src={tenantUser.avatar} 
                          alt={tenantUser.name || tenantUser.username} 
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <CircleUser className="h-4 w-4" />
                        </div>
                      )}
                      <span>{tenantUser.name || tenantUser.username}</span>
                    </TableCell>
                    <TableCell>{tenantUser.email || "-"}</TableCell>
                    <TableCell>
                      <Badge className="flex items-center gap-1 w-fit capitalize">
                        {getRoleIcon(tenantUser.userRole)}
                        {tenantUser.userRole}
                      </Badge>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell>
                        {tenantUser.id !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => removeUserMutation.mutate(tenantUser.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Remove user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Add User Dialog */}
        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User to Organization</DialogTitle>
              <DialogDescription>
                Add an existing user to this organization.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select 
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No available users
                      </SelectItem>
                    ) : (
                      availableUsers.map((user: User) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.username}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  defaultValue="member"
                  onValueChange={setSelectedRole}
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
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingUser(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddUser}
                disabled={addUserMutation.isPending || !selectedUserId}
              >
                {addUserMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}