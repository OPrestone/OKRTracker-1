import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User as UserSchema, Team } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Building2,
  Filter,
  RefreshCw,
  CheckCircle2,
  Settings,
  UserCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  User as UserIcon,
  UserX,
  ChevronDown,
  Loader2,
  Upload,
  Download,
  FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Progress } from "@/components/ui/progress";

export default function AllUsers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isTeamAssignDialogOpen, setIsTeamAssignDialogOpen] = useState(false);
  const [isOrgAssignDialogOpen, setIsOrgAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isUpdateUserDialogOpen, setIsUpdateUserDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSchema | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [teamAssignment, setTeamAssignment] = useState<{ teamId: string | number }>({ teamId: "" });
  const [orgAssignment, setOrgAssignment] = useState<{ tenantId: string, role: "owner" | "admin" | "member" }>({ 
    tenantId: "", 
    role: "member" 
  });
  const [updateUserData, setUpdateUserData] = useState({
    id: '',
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    title: '',
    teamId: '',
    tenantRole: 'member',
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
  
  // Fetch users with optimized caching
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserSchema[]>({
    queryKey: ["/api/users"],
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
  
  // Fetch teams with optimized caching
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
    staleTime: 60000, // Teams change less frequently
    cacheTime: 300000,
  });
  
  // Fetch tenants with optimized caching
  const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
    queryKey: ["/api/tenants"],
    staleTime: 60000,
    cacheTime: 300000,
  });
  
  // Assign team mutation
  const assignTeamMutation = useMutation({
    mutationFn: async ({ id, teamId }: { id: string, teamId: string | null }) => {
      if (teamId === null) {
        // Remove from team
        const res = await apiRequest("DELETE", `/api/users/${id}/team`);
        return await res.json();
      } else {
        // Check if team has any existing members
        const teamRes = await apiRequest("GET", `/api/teams/${teamId}/users`);
        const teamMembers = await teamRes.json();
        
        // Assign to team
        const res = await apiRequest("POST", `/api/users/${id}/team`, { teamId });
        const result = await res.json();
        
        // If this is the first user in the team, make them the team leader
        if (teamMembers.length === 0) {
          await apiRequest("PUT", `/api/teams/${teamId}/leader`, { leaderId: id });
        }
        
        return result;
      }
    },
    onSuccess: (data) => {
      // Comprehensive data refresh to display current information
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      
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
    
    const teamId = teamAssignment.teamId === "no-team" || teamAssignment.teamId === "" ? null : teamAssignment.teamId;
    assignTeamMutation.mutate({ id: selectedUser.id, teamId });
  };
  
  const openTeamAssignDialog = (user: UserSchema) => {
    setSelectedUser(user);
    setTeamAssignment({ teamId: user.teamId?.toString() || "" });
    setIsTeamAssignDialogOpen(true);
  };

  // Organization assignment mutation
  const assignOrgMutation = useMutation({
    mutationFn: async ({ userId, tenantId, role }: { userId: string, tenantId: string, role: "owner" | "admin" | "member" }) => {
      const res = await apiRequest("POST", `/api/tenants/${tenantId}/users`, { userId, role });
      return await res.json();
    },
    onSuccess: () => {
      // Comprehensive data refresh to display current information
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      
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
  
  const openOrgAssignDialog = (user: UserSchema) => {
    setSelectedUser(user);
    setOrgAssignment({ tenantId: "", role: "member" });
    setIsOrgAssignDialogOpen(true);
  };

  // Create user mutation with enhanced error handling
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      try {
        // Check for existing user with the same email/username before submitting
        if (userData.email) {
          console.log("Checking if email already exists:", userData.email);
        }
        
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
        
        // Check if the response is an error
        if (!res.ok) {
          try {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await res.json();
              console.error("Server returned error:", errorData);
              
              // Extract the specific error message from the response
              if (errorData.message) {
                throw new Error(errorData.message);
              } else if (errorData.error) {
                throw new Error(errorData.error);
              } else {
                throw new Error('Failed to create user - please try again');
              }
            } else {
              // Handle non-JSON responses (like HTML error pages)
              const errorText = await res.text();
              console.error("Server returned non-JSON error:", errorText);
              throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }
          } catch (parseError) {
            console.error("Error parsing server response:", parseError);
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        
        try {
          return await res.json();
        } catch (jsonError) {
          console.error("Error parsing response JSON:", jsonError);
          throw new Error("Invalid response format from server");
        }
      } catch (err: any) {
        // Enhanced error handling with specific error messages
        console.error("Error creating user:", err);
        
        // Check for common error patterns
        if (err.message?.includes("already exists")) {
          // Already exists errors
          throw new Error(err.message);
        } else if (err.message?.includes("validation")) {
          // Validation errors
          throw new Error(err.message);
        } else if (err.message?.includes("missing")) {
          // Missing required fields
          throw new Error(err.message);
        } else if (err.message) {
          // Use the error message if available
          throw new Error(err.message);
        } else {
          // Generic error
          throw new Error("Failed to create user. Please check the data and try again.");
        }
      }
    },
    onSuccess: (data) => {
      // Comprehensive data refresh to display current information
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      
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
    onError: (error: any) => {
      const errorMessage = error.message || "An unknown error occurred";
      
      toast({
        title: "Error creating user",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (users: any[]) => {
      const results = {
        total: users.length,
        successful: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        setUploadProgress(((i + 1) / users.length) * 100);

        try {
          const res = await apiRequest("POST", `/api/users`, {
            email: user.email,
            firstName: user.firstName || user.first_name,
            lastName: user.lastName || user.last_name,
            username: user.username || user.email,
            password: user.password || undefined, // Will be auto-generated if not provided
            department: user.department,
            title: user.title,
            role: user.role || 'member',
            teamId: user.teamId || null,
            tenantId: tenantId,
          });

          if (res.ok) {
            results.successful++;
          } else {
            const errorData = await res.json();
            results.failed++;
            results.errors.push(`Row ${i + 1}: ${errorData.message || 'Failed to create user'}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${error.message || 'Network error'}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setUploadResults(results);
      setIsUploading(false);
      
      // Comprehensive data refresh to display current information
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ["/api/users"] });
      
      toast({
        title: "Bulk Upload Complete",
        description: `${results.successful} users created successfully, ${results.failed} failed`,
        variant: results.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process bulk upload",
        variant: "destructive",
      });
    }
  });

  // CSV processing function
  const processCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const users = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const user: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          // Map common header variations
          switch (header) {
            case 'email':
            case 'email address':
              user.email = values[index];
              break;
            case 'firstname':
            case 'first name':
            case 'first_name':
              user.firstName = values[index];
              break;
            case 'lastname':
            case 'last name':
            case 'last_name':
              user.lastName = values[index];
              break;
            case 'username':
            case 'user name':
              user.username = values[index];
              break;
            case 'department':
              user.department = values[index];
              break;
            case 'title':
            case 'job title':
              user.title = values[index];
              break;
            case 'role':
              user.role = values[index];
              break;
            case 'password':
              user.password = values[index];
              break;
            case 'teamid':
            case 'team id':
            case 'team_id':
              user.teamId = values[index];
              break;
          }
        }
      });

      if (user.email) {
        users.push(user);
      }
    }

    return users;
  };

  // Handle bulk upload
  const handleBulkUpload = async (file: File) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadResults(null);

      const text = await file.text();
      const users = processCSV(text);

      if (users.length === 0) {
        throw new Error('No valid users found in CSV file');
      }

      bulkUploadMutation.mutate(users);
    } catch (error: any) {
      setIsUploading(false);
      toast({
        title: "Error Processing CSV",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Generate CSV template
  const downloadCSVTemplate = () => {
    const csvContent = "email,firstName,lastName,username,department,title,role,password\njohn.doe@example.com,John,Doe,johndoe,Engineering,Software Engineer,member,tempPassword123\njane.smith@example.com,Jane,Smith,janesmith,Marketing,Marketing Manager,member,tempPassword456";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: typeof updateUserData) => {
      try {
        const res = await apiRequest("PUT", `/api/users/${userData.id}`, {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          username: userData.username,
          department: userData.department,
          title: userData.title,
          teamId: userData.teamId || null,
          tenantRole: userData.tenantRole,
          tenantId: tenantId, // Current tenant context
        });
        
        // Check if the response is an error
        if (!res.ok) {
          try {
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await res.json();
              console.error("Server returned error:", errorData);
              
              // Extract the specific error message from the response
              if (errorData.message) {
                throw new Error(errorData.message);
              } else if (errorData.error) {
                throw new Error(errorData.error);
              } else {
                throw new Error('Failed to update user - please try again');
              }
            } else {
              // Handle non-JSON responses (like HTML error pages)
              const errorText = await res.text();
              console.error("Server returned non-JSON error:", errorText);
              throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }
          } catch (parseError) {
            console.error("Error parsing server response:", parseError);
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        
        try {
          return await res.json();
        } catch (jsonError) {
          console.error("Error parsing response JSON:", jsonError);
          throw new Error("Invalid response format from server");
        }
      } catch (err: any) {
        // Enhanced error handling with specific error messages
        console.error("Error updating user:", err);
        
        // Check for common error patterns
        if (err.message?.includes("already exists")) {
          throw new Error(err.message);
        } else if (err.message?.includes("validation")) {
          throw new Error(err.message);
        } else if (err.message) {
          throw new Error(err.message);
        } else {
          throw new Error("Failed to update user. Please check the data and try again.");
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      // If team was updated, invalidate team members
      if (data.teamId) {
        queryClient.invalidateQueries({ queryKey: ["/api/teams", data.teamId, "users"] });
      }
      
      setIsUpdateUserDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: "User updated successfully",
        description: "The user's information has been updated",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "An unknown error occurred";
      
      toast({
        title: "Error updating user",
        description: errorMessage,
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

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/users/${userId}/reset-password`);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Password reset successful",
        description: `New password: ${data.newPassword}. The user should change this password on their next login.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error resetting password",
        description: `There was a problem: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { userId: string; tenantRole: string }) => {
      const res = await apiRequest("PUT", `/api/users/${data.userId}/permissions`, {
        tenantRole: data.tenantRole
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate user-related queries to refresh permissions
      invalidateUserQueries();
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Permissions updated",
        description: "User permissions have been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating permissions",
        description: `There was a problem: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const openDeleteDialog = (user: UserSchema) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const handleResetPassword = () => {
    if (!selectedUser) return;
    resetPasswordMutation.mutate(selectedUser.id);
  };

  const handleUpdatePermissions = (tenantRole: string) => {
    if (!selectedUser) return;
    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      tenantRole
    });
  };

  const openUpdateUserDialog = (user: UserSchema) => {
    console.log("Opening update dialog for user:", user);
    setSelectedUser(user);
    
    // Get user's role in the current tenant
    const userTenantRelation = user.tenants?.find(t => t.id === tenantId);
    const tenantRole = userTenantRelation?.userRole || 'member';
    console.log("User tenant relation:", userTenantRelation, "Current tenant:", tenantId);
    
    // Populate the update form with the user's current data
    const userData = {
      id: user.id,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      department: user.department || '',
      title: user.title || '',
      teamId: user.teamId?.toString() || '',
      tenantRole: tenantRole as 'member' | 'admin' | 'owner',
    };
    console.log("Setting update user data:", userData);
    
    setUpdateUserData(userData);
    setIsUpdateUserDialogOpen(true);
  };

  const openPermissionsDialog = (user: UserSchema) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const openResetPasswordDialog = (user: UserSchema) => {
    setSelectedUser(user);
    setIsResetPasswordDialogOpen(true);
  };

  const handleUpdateUser = () => {
    updateUserMutation.mutate(updateUserData);
  };

  const handleUpdateUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUpdateUserData(prev => ({
      ...prev,
      [name]: value
    }));
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
  
  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );
  
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
  const userColumns: ColumnDef<UserSchema>[] = [
    {
      accessorKey: "username",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/10">
              <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <span className="mr-2">@{user.username}</span>
                {user.title && (
                  <Badge variant="outline" className="text-xs">
                    {user.title}
                  </Badge>
                )}
              </div>
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
        // Get user's role in the current tenant
        const userTenantRelation = user.tenants?.find(t => t.id === tenantId);
        const tenantRole = userTenantRelation?.userRole || 'member';
        
        return (
          <div className="space-y-1">
            <div className="flex items-center">
              <Mail className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{user.department || 'No Department'}</span>
              </div>
              <Badge 
                variant={
                  tenantRole === 'owner' ? 'default' : 
                  tenantRole === 'admin' ? 'secondary' : 
                  'outline'
                }
                className={
                  tenantRole === 'owner' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/10' : 
                  tenantRole === 'admin' ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/10' : 
                  'bg-green-500/10 text-green-600 hover:bg-green-500/10'
                }
              >
                {tenantRole.charAt(0).toUpperCase() + tenantRole.slice(1)}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "teamId",
      header: "Team & Status",
      cell: ({ row }) => {
        const user = row.original;
        const status = user.status || 'active';
        const isActive = status === 'active';
        
        return (
          <div className="space-y-2">
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span className="font-medium">
                {user.teamId ? 
                  teams.find(t => t.id === user.teamId)?.name || 'Loading...' : 
                  'No Team'}
              </span>
            </div>
            
            <div className="flex items-center">
              {isActive ? (
                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
            
            {user.managerId && (
              <div className="text-xs text-muted-foreground flex items-center">
                <span className="mr-1">Reports to:</span>
                <span className="font-medium">{users.find(u => u.id === user.managerId)?.firstName || 'Loading...'}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "onboardingProgress",
      header: "Onboarding",
      cell: ({ row }) => {
        const progress = row.original.onboardingProgress || 0;
        const getProgressColor = (value: number) => {
          if (value < 30) return "text-red-500";
          if (value < 70) return "text-amber-500";
          return "text-green-500";
        };
        
        return (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress</span>
              <span className={`text-xs font-medium ${getProgressColor(progress)}`}>
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {progress < 100 ? "Onboarding in progress" : "Onboarding complete"}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => {
        const user = row.original;
        const lastActive = user.lastActive ? new Date(user.lastActive) : null;
        const now = new Date();
        const diffInDays = lastActive 
          ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) 
          : null;
        
        return (
          <div className="space-y-1">
            {lastActive ? (
              <>
                <div className="text-sm font-medium">
                  {lastActive.toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {diffInDays === 0 
                    ? "Today" 
                    : diffInDays === 1 
                      ? "Yesterday" 
                      : `${diffInDays} days ago`}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Never logged in</div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => openUpdateUserDialog(user)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openTeamAssignDialog(user)}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Team
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openOrgAssignDialog(user)}>
                  <Building2 className="h-4 w-4 mr-2" />
                  Add to Organization
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openPermissionsDialog(user)}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Manage Permissions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => openDeleteDialog(user)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Filter users by role
  const filterUsersByRole = (role: string) => {
    if (role === 'all') return filteredUsers;
    return filteredUsers.filter(user => {
      // Get user's role in the current tenant
      const userTenantRelation = user.tenants?.find(t => t.id === tenantId);
      return userTenantRelation?.userRole === role;
    });
  };

  // Get counts of users by role
  const userCounts = {
    all: filteredUsers.length,
    owner: filteredUsers.filter(user => user.tenants?.find(t => t.id === tenantId)?.userRole === 'owner').length,
    admin: filteredUsers.filter(user => user.tenants?.find(t => t.id === tenantId)?.userRole === 'admin').length,
    executive: filteredUsers.filter(user => user.tenants?.find(t => t.id === tenantId)?.userRole === 'executive').length,
    manager: filteredUsers.filter(user => user.tenants?.find(t => t.id === tenantId)?.userRole === 'manager').length,
    user: filteredUsers.filter(user => user.tenants?.find(t => t.id === tenantId)?.userRole === 'user').length,
  };

  return (
    <DashboardLayout title="User Management">
      <div className="flex flex-col space-y-6">
        {/* Header with stats */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage users, roles, and permissions for your organization
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsBulkUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={openAddUserDialog} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
        
        {/* User statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h2 className="text-3xl font-bold">{userCounts.all}</h2>
              </div>
              <Users className="h-8 w-8 text-primary opacity-80" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Owners</p>
                <h2 className="text-3xl font-bold">{userCounts.owner}</h2>
              </div>
              <ShieldCheck className="h-8 w-8 text-amber-500 opacity-80" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admins</p>
                <h2 className="text-3xl font-bold">{userCounts.admin}</h2>
              </div>
              <Settings className="h-8 w-8 text-blue-500 opacity-80" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex flex-row items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Members</p>
                <h2 className="text-3xl font-bold">{userCounts.member}</h2>
              </div>
              <UserCheck className="h-8 w-8 text-green-500 opacity-80" />
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[450px] w-full rounded-lg" />
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Organization Users</CardTitle>
              <CardDescription>
                All users that are part of your organization
              </CardDescription>
            </CardHeader>
            
            <Tabs defaultValue="all" className="px-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="all" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  All Users <Badge className="ml-2 bg-primary/10 text-primary">{userCounts.all}</Badge>
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Owners <Badge className="ml-2 bg-amber-500/10 text-amber-600">{userCounts.owner}</Badge>
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Admins <Badge className="ml-2 bg-blue-500/10 text-blue-600">{userCounts.admin}</Badge>
                </TabsTrigger>
                <TabsTrigger value="member" className="flex items-center">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Members <Badge className="ml-2 bg-green-500/10 text-green-600">{userCounts.member}</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <DataTable
                  columns={userColumns}
                  data={filterUsersByRole('all')}
                  searchColumn="username"
                  searchPlaceholder="Search all users..."
                  tableTitle="All Users"
                />
              </TabsContent>
              
              <TabsContent value="owner">
                <DataTable
                  columns={userColumns}
                  data={filterUsersByRole('owner')}
                  searchColumn="username"
                  searchPlaceholder="Search owners..."
                  tableTitle="Organization Owners"
                />
              </TabsContent>
              
              <TabsContent value="admin">
                <DataTable
                  columns={userColumns}
                  data={filterUsersByRole('admin')}
                  searchColumn="username"
                  searchPlaceholder="Search admins..."
                  tableTitle="Organization Admins"
                />
              </TabsContent>
              
              <TabsContent value="member">
                <DataTable
                  columns={userColumns}
                  data={filterUsersByRole('member')}
                  searchColumn="username"
                  searchPlaceholder="Search members..."
                  tableTitle="Organization Members"
                />
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
      
      {/* Team Assignment Dialog */}
      <Dialog open={isTeamAssignDialogOpen} onOpenChange={setIsTeamAssignDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Assign User to Team
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedUser && (
                <div className="flex items-center gap-2 py-2">
                  <Avatar className="h-9 w-9 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Team</label>
              <Select
                value={teamAssignment.teamId.toString()}
                onValueChange={(value) => setTeamAssignment({ teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-team">
                    <div className="flex items-center">
                      <UserX className="h-4 w-4 mr-2 text-muted-foreground" />
                      No Team
                    </div>
                  </SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-primary" />
                        {team.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                Users assigned to a team will appear in team dashboards and reports.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTeam} disabled={assignTeamMutation.isPending}>
              {assignTeamMutation.isPending ? 
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Save Changes</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Assignment Dialog */}
      <Dialog open={isOrgAssignDialogOpen} onOpenChange={setIsOrgAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-primary" />
              Add User to Organization
            </DialogTitle>
            <DialogDescription className="pt-2">
              {selectedUser && (
                <div className="flex items-center gap-2 py-2">
                  <Avatar className="h-9 w-9 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</div>
                    <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Organization</label>
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
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-primary" />
                        {tenant.name || tenant.displayName || 'Unnamed Organization'}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Role in Organization</label>
              <div className="grid grid-cols-3 gap-2">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    orgAssignment.role === 'member' 
                      ? 'border-green-500 bg-green-50 dark:bg-green-500/10' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setOrgAssignment({ ...orgAssignment, role: 'member' })}
                >
                  <div className="flex justify-center mb-1">
                    <UserCheck className={`h-6 w-6 ${
                      orgAssignment.role === 'member' ? 'text-green-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <p className="text-center text-sm font-medium">Member</p>
                  <p className="text-center text-xs text-muted-foreground mt-1">Basic user access</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    orgAssignment.role === 'admin' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setOrgAssignment({ ...orgAssignment, role: 'admin' })}
                >
                  <div className="flex justify-center mb-1">
                    <Settings className={`h-6 w-6 ${
                      orgAssignment.role === 'admin' ? 'text-blue-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <p className="text-center text-sm font-medium">Admin</p>
                  <p className="text-center text-xs text-muted-foreground mt-1">Manage users & teams</p>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    orgAssignment.role === 'owner' 
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setOrgAssignment({ ...orgAssignment, role: 'owner' })}
                >
                  <div className="flex justify-center mb-1">
                    <ShieldCheck className={`h-6 w-6 ${
                      orgAssignment.role === 'owner' ? 'text-amber-500' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <p className="text-center text-sm font-medium">Owner</p>
                  <p className="text-center text-xs text-muted-foreground mt-1">Full organization control</p>
                </div>
              </div>
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
              {assignOrgMutation.isPending ? 
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Adding...</> : 
                <><UserPlus className="h-4 w-4 mr-2" /> Add to Organization</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[475px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Remove User
            </DialogTitle>
            <DialogDescription className="pt-3">
              {selectedUser && (
                <div className="flex items-center gap-2 py-2 border-l-4 border-red-200 pl-3 mb-2 bg-red-50 dark:bg-red-900/10 rounded">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-red-100 text-red-600">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-red-700 dark:text-red-200">{selectedUser.firstName} {selectedUser.lastName}</div>
                    <div className="text-xs text-red-600/70 dark:text-red-400/70">{selectedUser.email}</div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                Important Information
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="bg-background rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                  <span>The user will lose access to all data in this organization</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-background rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                  <span>Their role assignments and team memberships in this organization will be removed</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-background rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                  <span>If they don't belong to any other organizations, their account will be completely deleted</span>
                </li>
              </ul>
            </div>
            
            {selectedUser?.teamId && (
              <div className="rounded-lg border border-primary/20 p-3 bg-primary/5">
                <p className="text-sm flex items-center">
                  <Building className="h-4 w-4 mr-2 text-primary" />
                  <span>
                    <strong>Team assignment:</strong> This user is currently a member of {' '}
                    <Badge variant="outline" className="font-normal ml-1">
                      {teams.find(t => t.id === selectedUser.teamId)?.name || "a team"}
                    </Badge>
                    {' '} and will be removed from it.
                  </span>
                </p>
              </div>
            )}
            
            {(selectedUser && users.some(u => u.managerId === selectedUser.id)) && (
              <div className="rounded-lg border border-red-200 p-3 bg-red-50 dark:bg-red-900/10">
                <p className="text-sm flex items-start">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-500 mt-0.5" />
                  <span>
                    <strong>Warning:</strong> This user is a manager for other users. 
                    Those users will no longer have a manager assigned if this user is removed.
                  </span>
                </p>
              </div>
            )}
            
            <p className="text-sm font-medium flex items-center text-muted-foreground">
              <Info className="h-4 w-4 mr-2" />
              This action cannot be undone.
            </p>
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
              {deleteUserMutation.isPending ? 
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Removing...</> : 
                <><Trash2 className="h-4 w-4 mr-2" /> Remove User</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-primary" />
              Add User to Organization
            </DialogTitle>
            <DialogDescription className="pt-2">
              Add a new or existing user to this organization. Only email is required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="rounded-lg border-l-4 border-l-blue-400 bg-blue-50 dark:bg-blue-950/20 p-4 text-sm">
              <p className="font-medium flex items-center text-blue-800 dark:text-blue-300">
                <Mail className="h-4 w-4 mr-2" />
                Email Invitation Process
              </p>
              <p className="mt-1 text-blue-700 dark:text-blue-400">
                New users will receive an email with account details. If the email already exists in the system, the user will be invited to join this organization.
              </p>
            </div>
          
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium flex items-center">
                  <UserIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                  First Name
                </label>
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
                    <SelectItem value="none">No Team</SelectItem>
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

      {/* Update User Dialog */}
      <Dialog open={isUpdateUserDialogOpen} onOpenChange={setIsUpdateUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>
              Edit user profile details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="updateFirstName" className="text-sm font-medium">First Name *</label>
                <Input 
                  id="updateFirstName" 
                  name="firstName" 
                  value={updateUserData.firstName}
                  onChange={handleUpdateUserInputChange}
                  placeholder="John" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="updateLastName" className="text-sm font-medium">Last Name *</label>
                <Input 
                  id="updateLastName" 
                  name="lastName" 
                  value={updateUserData.lastName}
                  onChange={handleUpdateUserInputChange}
                  placeholder="Doe" 
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="updateEmail" className="text-sm font-medium">Email Address *</label>
              <Input 
                id="updateEmail" 
                name="email" 
                type="email" 
                value={updateUserData.email}
                onChange={handleUpdateUserInputChange}
                placeholder="john.doe@example.com" 
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="updateUsername" className="text-sm font-medium">Username *</label>
              <Input 
                id="updateUsername" 
                name="username" 
                value={updateUserData.username}
                onChange={handleUpdateUserInputChange}
                placeholder="johndoe" 
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="updateDepartment" className="text-sm font-medium">Department</label>
                <Input 
                  id="updateDepartment" 
                  name="department" 
                  value={updateUserData.department}
                  onChange={handleUpdateUserInputChange}
                  placeholder="Engineering" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="updateTitle" className="text-sm font-medium">Job Title</label>
                <Input 
                  id="updateTitle" 
                  name="title" 
                  value={updateUserData.title}
                  onChange={handleUpdateUserInputChange}
                  placeholder="Software Engineer" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="updateTeam" className="text-sm font-medium">Team</label>
                <Select
                  name="teamId"
                  value={updateUserData.teamId?.toString() || "no-team"}
                  onValueChange={(value) => {
                    setUpdateUserData(prev => ({ 
                      ...prev, 
                      teamId: value === "no-team" ? "" : value
                    }));
                  }}
                >
                  <SelectTrigger id="updateTeam">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team">No Team</SelectItem>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="updateRole" className="text-sm font-medium">Role</label>
                <Select
                  name="tenantRole"
                  value={updateUserData.tenantRole || "member"}
                  onValueChange={(value) => {
                    setUpdateUserData(prev => ({ ...prev, tenantRole: value as "owner" | "admin" | "member" }));
                  }}
                >
                  <SelectTrigger id="updateRole">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateUserDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Permissions</DialogTitle>
            <DialogDescription>
              Update the role and permissions for {selectedUser?.firstName} {selectedUser?.lastName} in this organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Organization Role</label>
              <div className="space-y-2">

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role-user"
                    name="tenantRole"
                    value="user"
                    defaultChecked={selectedUser?.tenants?.find(t => t.id === tenantId)?.userRole === 'user'}
                    onChange={(e) => e.target.checked && handleUpdatePermissions('user')}
                  />
                  <label htmlFor="role-user" className="text-sm">
                    <span className="font-medium">User</span> - Basic access to objectives and teams
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role-manager"
                    name="tenantRole"
                    value="manager"
                    defaultChecked={selectedUser?.tenants?.find(t => t.id === tenantId)?.userRole === 'manager'}
                    onChange={(e) => e.target.checked && handleUpdatePermissions('manager')}
                  />
                  <label htmlFor="role-manager" className="text-sm">
                    <span className="font-medium">Manager</span> - Can manage team members and objectives
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role-executive"
                    name="tenantRole"
                    value="executive"
                    defaultChecked={selectedUser?.tenants?.find(t => t.id === tenantId)?.userRole === 'executive'}
                    onChange={(e) => e.target.checked && handleUpdatePermissions('executive')}
                  />
                  <label htmlFor="role-executive" className="text-sm">
                    <span className="font-medium">Executive</span> - Senior leadership with broad organizational access
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role-admin"
                    name="tenantRole"
                    value="admin"
                    defaultChecked={selectedUser?.tenants?.find(t => t.id === tenantId)?.userRole === 'admin'}
                    onChange={(e) => e.target.checked && handleUpdatePermissions('admin')}
                  />
                  <label htmlFor="role-admin" className="text-sm">
                    <span className="font-medium">Admin</span> - Can manage users and organizational settings
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="role-owner"
                    name="tenantRole"
                    value="owner"
                    defaultChecked={selectedUser?.tenants?.find(t => t.id === tenantId)?.userRole === 'owner'}
                    onChange={(e) => e.target.checked && handleUpdatePermissions('owner')}
                  />
                  <label htmlFor="role-owner" className="text-sm">
                    <span className="font-medium">Owner</span> - Full organizational control and management
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Generate a new password for {selectedUser?.firstName} {selectedUser?.lastName}. They will need to change this password on their next login.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Security Notice</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    The new password will be displayed once. Make sure to securely share it with the user.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Upload Users</DialogTitle>
            <DialogDescription>
              Upload a CSV file to add multiple users at once. Users will be saved directly to your database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Download Template */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">CSV Template</p>
                  <p className="text-xs text-muted-foreground">Download the template to see required format</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadCSVTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV File</label>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleBulkUpload(file);
                  }
                }}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Required columns: email, firstName, lastName. Optional: username, department, title, role, password
              </p>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploading users...</span>
                  <span className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{uploadResults.successful}</div>
                    <div className="text-sm text-green-600">Successful</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{uploadResults.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>

                {uploadResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Errors:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadResults.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsBulkUploadDialogOpen(false);
                setUploadResults(null);
                setUploadProgress(0);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
