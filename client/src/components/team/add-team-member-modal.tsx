import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Search, UserPlus } from "lucide-react";
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
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { hashPassword } from "@/lib/auth";

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

// Form schema for creating a new user
const userFormSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address").optional(),
  role: z.string().optional()
});

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
  const [activeTab, setActiveTab] = useState<string>("existing");
  
  // Form for creating a new user
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "member"
    },
  });
  
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

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userFormSchema>) => {
      // Create the new user with the tenant ID included
      const response = await apiRequest("POST", "/api/register", {
        ...userData,
        tenantId: tenantId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create user");
      }
      
      const newUser = await response.json();
      
      // After creating the user, assign them to the team
      await apiRequest("POST", `/api/users/${newUser.id}/team`, {
        teamId,
        tenantId
      });
      
      return newUser;
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created and added to the team.",
      });
      
      // Reset the form
      form.reset();
      
      // Switch back to the existing users tab
      setActiveTab("existing");
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/teams", teamId, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", tenantId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create user: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleAddUser = (userId: string) => {
    addUserToTeamMutation.mutate(userId);
  };
  
  const onSubmit = (data: z.infer<typeof userFormSchema>) => {
    createUserMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add team members from your organization or create new users.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Users</TabsTrigger>
            <TabsTrigger value="new">Create New User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="new">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="user@example.com" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create User & Add to Team
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
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