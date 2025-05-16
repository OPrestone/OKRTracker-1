import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/layouts/dashboard-layout";
import { AccessGroup } from "@shared/schema";
import { 
  AlertCircle, 
  CheckIcon, 
  XIcon, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion,
  Target, 
  BarChart3, 
  Settings2, 
  FileBarChart,
  Loader2,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  UsersRound,
  UserPlus,
  PersonStanding,
  Settings,
  Pencil,
  Eye,
  EyeOff
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccessGroupWithUsers extends AccessGroup {
  userCount?: number;
}

interface AccessGroupFormData {
  id?: number;
  name: string;
  description: string;
  permissions: {
    createOKRs: boolean;
    editAllOKRs: boolean;
    deleteOKRs: boolean;
    viewAllOKRs: boolean;
    manageUsers: boolean;
    manageTeams: boolean;
    manageSettings: boolean;
    createKeyResults: boolean;
    editAssignedKeyResults: boolean;
    viewReports: boolean;
    exportData: boolean;
    manageAccessGroups: boolean;
  };
}

const defaultAccessGroupForm: AccessGroupFormData = {
  name: "",
  description: "",
  permissions: {
    createOKRs: false,
    editAllOKRs: false,
    deleteOKRs: false,
    viewAllOKRs: true, // Default permission
    manageUsers: false,
    manageTeams: false,
    manageSettings: false,
    createKeyResults: false,
    editAssignedKeyResults: false,
    viewReports: false,
    exportData: false,
    manageAccessGroups: false,
  },
};

const AccessGroups = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("groups");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accessGroupForm, setAccessGroupForm] = useState<AccessGroupFormData>(defaultAccessGroupForm);
  const [selectedGroup, setSelectedGroup] = useState<AccessGroupWithUsers | null>(null);

  // Get access groups
  const {
    data: accessGroups,
    isLoading: accessGroupsLoading,
    error: accessGroupsError,
  } = useQuery<AccessGroupWithUsers[]>({
    queryKey: ["/api/access-groups"],
  });

  // Filter access groups based on search query
  const filteredAccessGroups = accessGroups?.filter(group =>
    searchQuery
      ? group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true
  );

  // Create access group mutation
  const createAccessGroupMutation = useMutation({
    mutationFn: async (data: AccessGroupFormData) => {
      const response = await fetch("/api/access-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create access group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-groups"] });
      toast({
        title: "Access Group Created",
        description: "The access group has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      setAccessGroupForm(defaultAccessGroupForm);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create access group: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update access group mutation
  const updateAccessGroupMutation = useMutation({
    mutationFn: async (data: AccessGroupFormData) => {
      const response = await fetch(`/api/access-groups/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update access group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-groups"] });
      toast({
        title: "Access Group Updated",
        description: "The access group has been updated successfully.",
      });
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update access group: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete access group mutation
  const deleteAccessGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/access-groups/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete access group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/access-groups"] });
      toast({
        title: "Access Group Deleted",
        description: "The access group has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete access group: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleFormChange = (
    field: keyof Omit<AccessGroupFormData, "permissions">,
    value: string
  ) => {
    setAccessGroupForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle permission changes
  const handlePermissionChange = (
    permission: keyof AccessGroupFormData["permissions"],
    value: boolean
  ) => {
    setAccessGroupForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value,
      },
    }));
  };

  // Handle edit access group
  const handleEditAccessGroup = (group: AccessGroupWithUsers) => {
    setSelectedGroup(group);
    setAccessGroupForm({
      id: group.id,
      name: group.name,
      description: group.description || "",
      permissions: {
        createOKRs: (group.permissions as any)?.createOKRs || false,
        editAllOKRs: (group.permissions as any)?.editAllOKRs || false,
        deleteOKRs: (group.permissions as any)?.deleteOKRs || false,
        viewAllOKRs: (group.permissions as any)?.viewAllOKRs || true,
        manageUsers: (group.permissions as any)?.manageUsers || false,
        manageTeams: (group.permissions as any)?.manageTeams || false,
        manageSettings: (group.permissions as any)?.manageSettings || false,
        createKeyResults: (group.permissions as any)?.createKeyResults || false,
        editAssignedKeyResults: (group.permissions as any)?.editAssignedKeyResults || false,
        viewReports: (group.permissions as any)?.viewReports || false,
        exportData: (group.permissions as any)?.exportData || false,
        manageAccessGroups: (group.permissions as any)?.manageAccessGroups || false,
      },
    });
    setIsEditDialogOpen(true);
  };

  // Handle delete access group
  const handleDeleteAccessGroup = (group: AccessGroupWithUsers) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessGroupForm.id) {
      updateAccessGroupMutation.mutate(accessGroupForm);
    } else {
      createAccessGroupMutation.mutate(accessGroupForm);
    }
  };

  // Get permission level label
  const getPermissionLevel = (group: AccessGroupWithUsers) => {
    const permissions = group.permissions as any;
    
    if (permissions?.manageSettings) {
      return { label: "Administrator", icon: <ShieldAlert className="h-4 w-4 text-red-500" /> };
    } else if (permissions?.manageUsers || permissions?.manageTeams || permissions?.manageAccessGroups) {
      return { label: "Manager", icon: <ShieldCheck className="h-4 w-4 text-amber-500" /> };
    } else if (permissions?.createOKRs || permissions?.editAllOKRs) {
      return { label: "Editor", icon: <Shield className="h-4 w-4 text-blue-500" /> };
    } else {
      return { label: "Viewer", icon: <ShieldQuestion className="h-4 w-4 text-gray-500" /> };
    }
  };

  return (
    <DashboardLayout title="Access Groups">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Access Groups</h1>
            <p className="text-slate-500 mt-1">Manage permissions and access control for users</p>
          </div>
          <div className="flex space-x-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search access groups..."
                className="pl-9 w-full rounded-md border-slate-200 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              onClick={() => {
                setAccessGroupForm(defaultAccessGroupForm);
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger 
            value="groups" 
            className="flex items-center rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <UsersRound className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
          <TabsTrigger 
            value="permissions" 
            className="flex items-center rounded-md data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm"
          >
            <Shield className="h-4 w-4 mr-2" />
            Permission Levels
          </TabsTrigger>
        </TabsList>

        {/* Access Groups Tab */}
        <TabsContent value="groups">
          {accessGroupsLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-gray-200 rounded mb-4"></div>
              ))}
            </div>
          ) : accessGroupsError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load access groups. Please try again later.
              </AlertDescription>
            </Alert>
          ) : filteredAccessGroups && filteredAccessGroups.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccessGroups.map(group => (
                <Card key={group.id} className="relative overflow-hidden group hover:shadow-md transition-all duration-200 border border-slate-200 rounded-lg bg-gradient-to-br from-white to-slate-50">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-600 to-indigo-400 shadow-sm"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-slate-800">{group.name}</CardTitle>
                        <div className="flex items-center text-xs px-2.5 py-1 rounded-full bg-indigo-100/80 shadow-sm">
                          {getPermissionLevel(group).icon}
                          <span className="ml-1 font-medium">{getPermissionLevel(group).label}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-indigo-100/70 rounded-full">
                            <Settings className="h-4 w-4 text-indigo-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-lg border-slate-200 shadow-md">
                          <DropdownMenuLabel className="text-xs font-medium text-indigo-500">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAccessGroup(group)} className="cursor-pointer focus:bg-indigo-50 focus:text-indigo-700">
                            <Edit className="h-4 w-4 mr-2 text-blue-600" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAccessGroup(group)} className="cursor-pointer focus:bg-indigo-50 focus:text-indigo-700">
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                            Delete Group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActiveTab("users")} className="cursor-pointer focus:bg-indigo-50 focus:text-indigo-700">
                            <UserPlus className="h-4 w-4 mr-2 text-emerald-600" />
                            Manage Users
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="text-slate-500 mt-1">{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex flex-col space-y-1.5">
                        <h4 className="text-sm font-medium text-indigo-700">Key Permissions:</h4>
                        <div className="space-y-2">
                          {(group.permissions as any)?.createOKRs && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <CheckIcon className="h-3 w-3 text-emerald-500" />
                              <span>Create OKRs</span>
                            </div>
                          )}
                          {(group.permissions as any)?.editAllOKRs && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <CheckIcon className="h-3 w-3 text-emerald-500" />
                              <span>Edit All OKRs</span>
                            </div>
                          )}
                          {(group.permissions as any)?.deleteOKRs && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <CheckIcon className="h-3 w-3 text-emerald-500" />
                              <span>Delete OKRs</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageTeams && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <CheckIcon className="h-3 w-3 text-amber-500" />
                              <span>Manage Teams</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageUsers && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <CheckIcon className="h-3 w-3 text-amber-500" />
                              <span>Manage Users</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageSettings && (
                            <div className="flex items-center space-x-2 text-xs text-slate-700">
                              <AlertCircle className="h-3 w-3 text-red-500" />
                              <span>Manage Settings</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end pt-0">
                    <div className="flex items-center text-xs text-slate-500">
                      <UsersRound className="h-3 w-3 mr-1" />
                      <span>{group.userCount || 0} users</span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 mb-4">
                <UsersRound className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-1">No Access Groups Found</h3>
              <p className="text-sm text-slate-500 mb-4">Get started by creating your first access group.</p>
              <Button 
                onClick={() => {
                  setAccessGroupForm(defaultAccessGroupForm);
                  setIsCreateDialogOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Access Group
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Permission Levels Tab */}
        <TabsContent value="permissions">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-slate-200 rounded-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <CardTitle className="text-slate-800">Administrator</CardTitle>
                </div>
                <CardDescription className="text-slate-500 mt-1">
                  Full access to all system settings and management functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Create, edit, and delete OKRs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Manage users and teams</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Access configuration settings</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>View and generate reports</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Manage access groups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-slate-800">Manager</CardTitle>
                </div>
                <CardDescription className="text-slate-500 mt-1">
                  Can manage teams, users, and access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Create, edit, and delete OKRs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Manage users and teams</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>View and generate reports</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot access system configuration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-slate-800">Editor</CardTitle>
                </div>
                <CardDescription className="text-slate-500 mt-1">
                  Can create and manage OKRs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Create and edit OKRs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>Create key results</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>View reports</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot manage users or teams</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot access system configuration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 rounded-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ShieldQuestion className="h-5 w-5 text-gray-500" />
                  <CardTitle className="text-slate-800">Viewer</CardTitle>
                </div>
                <CardDescription className="text-slate-500 mt-1">
                  Read-only access to view OKRs and reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>View all OKRs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <span>View reports</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot create or edit OKRs</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot manage users or teams</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                    <XIcon className="h-4 w-4 text-red-500" />
                    <span>Cannot access system configuration</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Access Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="p-3 inline-flex items-center justify-center rounded-full bg-indigo-100 mb-2">
              <UsersRound className="h-6 w-6 text-indigo-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Create Access Group</DialogTitle>
            <DialogDescription className="text-slate-500">
              Configure permissions and access levels for this group. Users assigned to this group will inherit these permissions.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Group Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Administrators, Team Leaders"
                    value={accessGroupForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="rounded-md border-slate-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Briefly describe this group's purpose and role"
                    value={accessGroupForm.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    className="min-h-[120px] resize-none rounded-md border-slate-200"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const allPermissions = Object.keys(accessGroupForm.permissions) as (keyof AccessGroupFormData['permissions'])[];
                          const updatedPermissions = { ...accessGroupForm.permissions };
                          
                          allPermissions.forEach(permission => {
                            updatedPermissions[permission] = true;
                          });
                          
                          setAccessGroupForm(prev => ({
                            ...prev,
                            permissions: updatedPermissions
                          }));
                        }}
                        className="text-xs h-8 px-3 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <CheckIcon className="h-3 w-3 mr-1" /> Select All
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const allPermissions = Object.keys(accessGroupForm.permissions) as (keyof AccessGroupFormData['permissions'])[];
                          const updatedPermissions = { ...accessGroupForm.permissions };
                          
                          allPermissions.forEach(permission => {
                            if (permission !== 'viewAllOKRs') { // Keep basic view permission
                              updatedPermissions[permission] = false;
                            }
                          });
                          
                          setAccessGroupForm(prev => ({
                            ...prev,
                            permissions: updatedPermissions
                          }));
                        }}
                        className="text-xs h-8 px-3 border-slate-200 hover:bg-slate-50"
                      >
                        <XIcon className="h-3 w-3 mr-1" /> Clear
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {/* OKR Management */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-indigo-600" />
                      OKR Management
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createOKRs"
                        checked={accessGroupForm.permissions.createOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="createOKRs" className="text-sm">
                        Create new objectives
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="editAllOKRs"
                        checked={accessGroupForm.permissions.editAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="editAllOKRs" className="text-sm">
                        Edit all objectives (including others')
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deleteOKRs"
                        checked={accessGroupForm.permissions.deleteOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("deleteOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="deleteOKRs" className="text-sm">
                        Delete objectives
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="viewAllOKRs"
                        checked={accessGroupForm.permissions.viewAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="viewAllOKRs" className="text-sm">
                        View all objectives
                      </Label>
                    </div>
                  </div>
                  
                  {/* Key Results */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <CheckIcon className="h-4 w-4 mr-2 text-indigo-600" />
                      Key Results
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createKeyResults"
                        checked={accessGroupForm.permissions.createKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="createKeyResults" className="text-sm">
                        Create key results
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="editAssignedKeyResults"
                        checked={accessGroupForm.permissions.editAssignedKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAssignedKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="editAssignedKeyResults" className="text-sm">
                        Edit assigned key results
                      </Label>
                    </div>
                  </div>
                  
                  {/* Administration */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-amber-500" />
                      Administration
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manageUsers"
                        checked={accessGroupForm.permissions.manageUsers}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageUsers", checked as boolean)
                        }
                      />
                      <Label htmlFor="manageUsers" className="text-sm">
                        Manage users
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manageTeams"
                        checked={accessGroupForm.permissions.manageTeams}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageTeams", checked as boolean)
                        }
                      />
                      <Label htmlFor="manageTeams" className="text-sm">
                        Manage teams
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manageAccessGroups"
                        checked={accessGroupForm.permissions.manageAccessGroups}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageAccessGroups", checked as boolean)
                        }
                      />
                      <Label htmlFor="manageAccessGroups" className="text-sm">
                        Manage access groups
                      </Label>
                    </div>
                  </div>
                  
                  {/* Reports & Data */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-indigo-600" />
                      Reports & Data
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="viewReports"
                        checked={accessGroupForm.permissions.viewReports}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewReports", checked as boolean)
                        }
                      />
                      <Label htmlFor="viewReports" className="text-sm">
                        View reports
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exportData"
                        checked={accessGroupForm.permissions.exportData}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("exportData", checked as boolean)
                        }
                      />
                      <Label htmlFor="exportData" className="text-sm">
                        Export data
                      </Label>
                    </div>
                  </div>
                  
                  {/* System Settings */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
                      System Settings
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="manageSettings"
                        checked={accessGroupForm.permissions.manageSettings}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageSettings", checked as boolean)
                        }
                      />
                      <div className="flex flex-col space-y-1">
                        <Label htmlFor="manageSettings" className="text-sm flex items-center">
                          <span className="mr-2">Manage system settings</span>
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">Admin only</span>
                        </Label>
                        <p className="text-xs text-slate-500">
                          Warning: This grants extensive control over the entire platform.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permission Level Summary */}
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                  <h4 className="text-sm font-medium text-indigo-800 mb-2">Permission Level:</h4>
                  <div className="flex items-center space-x-2">
                    {accessGroupForm.permissions.manageSettings ? (
                      <>
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-700">Administrator</span>
                      </>
                    ) : accessGroupForm.permissions.manageUsers || accessGroupForm.permissions.manageTeams || accessGroupForm.permissions.manageAccessGroups ? (
                      <>
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700">Manager</span>
                      </>
                    ) : accessGroupForm.permissions.createOKRs || accessGroupForm.permissions.editAllOKRs ? (
                      <>
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">Editor</span>
                      </>
                    ) : (
                      <>
                        <ShieldQuestion className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Viewer</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setAccessGroupForm(defaultAccessGroupForm);
                }}
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={createAccessGroupMutation.isPending}
              >
                {createAccessGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Create Access Group
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Access Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="p-3 inline-flex items-center justify-center rounded-full bg-blue-100 mb-2">
              <Pencil className="h-6 w-6 text-blue-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Edit Access Group</DialogTitle>
            <DialogDescription className="text-slate-500">
              Update permissions and access levels for this group.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Same form content as Create */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Group Name
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., Administrators, Team Leaders"
                    value={accessGroupForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    className="rounded-md border-slate-200"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Briefly describe this group's purpose and role"
                    value={accessGroupForm.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    className="min-h-[120px] resize-none rounded-md border-slate-200"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Permissions</Label>
                    <div className="flex items-center space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const allPermissions = Object.keys(accessGroupForm.permissions) as (keyof AccessGroupFormData['permissions'])[];
                          const updatedPermissions = { ...accessGroupForm.permissions };
                          
                          allPermissions.forEach(permission => {
                            updatedPermissions[permission] = true;
                          });
                          
                          setAccessGroupForm(prev => ({
                            ...prev,
                            permissions: updatedPermissions
                          }));
                        }}
                        className="text-xs h-8 px-3 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <CheckIcon className="h-3 w-3 mr-1" /> Select All
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const allPermissions = Object.keys(accessGroupForm.permissions) as (keyof AccessGroupFormData['permissions'])[];
                          const updatedPermissions = { ...accessGroupForm.permissions };
                          
                          allPermissions.forEach(permission => {
                            if (permission !== 'viewAllOKRs') { // Keep basic view permission
                              updatedPermissions[permission] = false;
                            }
                          });
                          
                          setAccessGroupForm(prev => ({
                            ...prev,
                            permissions: updatedPermissions
                          }));
                        }}
                        className="text-xs h-8 px-3 border-slate-200 hover:bg-slate-50"
                      >
                        <XIcon className="h-3 w-3 mr-1" /> Clear
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg divide-y divide-slate-100 overflow-hidden">
                  {/* Repeating the same permission sections as in Create form */}
                  {/* You can reuse the same permission sections here */}
                  
                  {/* OKR Management */}
                  <div className="px-3 py-2 bg-slate-50">
                    <h3 className="text-sm font-medium text-slate-800 flex items-center">
                      <Target className="h-4 w-4 mr-2 text-indigo-600" />
                      OKR Management
                    </h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-createOKRs"
                        checked={accessGroupForm.permissions.createOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-createOKRs" className="text-sm">
                        Create new objectives
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-editAllOKRs"
                        checked={accessGroupForm.permissions.editAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-editAllOKRs" className="text-sm">
                        Edit all objectives (including others')
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-deleteOKRs"
                        checked={accessGroupForm.permissions.deleteOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("deleteOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-deleteOKRs" className="text-sm">
                        Delete objectives
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-viewAllOKRs"
                        checked={accessGroupForm.permissions.viewAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-viewAllOKRs" className="text-sm">
                        View all objectives
                      </Label>
                    </div>
                  </div>
                  
                  {/* Key Results, Administration, Reports & Data, System Settings sections would follow the same pattern */}
                  
                </div>

                {/* Permission Level Summary */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Permission Level:</h4>
                  <div className="flex items-center space-x-2">
                    {accessGroupForm.permissions.manageSettings ? (
                      <>
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-700">Administrator</span>
                      </>
                    ) : accessGroupForm.permissions.manageUsers || accessGroupForm.permissions.manageTeams || accessGroupForm.permissions.manageAccessGroups ? (
                      <>
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700">Manager</span>
                      </>
                    ) : accessGroupForm.permissions.createOKRs || accessGroupForm.permissions.editAllOKRs ? (
                      <>
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">Editor</span>
                      </>
                    ) : (
                      <>
                        <ShieldQuestion className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Viewer</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedGroup(null);
                }}
                className="border-slate-200 text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateAccessGroupMutation.isPending}
              >
                {updateAccessGroupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Update Access Group
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Access Group Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="p-3 inline-flex items-center justify-center rounded-full bg-red-100 mb-2">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold">Delete Access Group</DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to delete this access group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="py-4">
              <div className="p-4 border rounded-lg bg-slate-50">
                <h3 className="font-medium text-slate-900 mb-1">{selectedGroup.name}</h3>
                <p className="text-sm text-slate-500">{selectedGroup.description}</p>
                
                {selectedGroup.userCount && selectedGroup.userCount > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                    <div className="flex items-center text-amber-800">
                      <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="text-sm font-medium">
                        This group has {selectedGroup.userCount} assigned {selectedGroup.userCount === 1 ? 'user' : 'users'}.
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-amber-600">
                      Users in this group will lose these permissions. Make sure they are assigned to another group.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedGroup(null);
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteAccessGroupMutation.isPending}
              onClick={() => {
                if (selectedGroup) {
                  deleteAccessGroupMutation.mutate(selectedGroup.id);
                }
              }}
            >
              {deleteAccessGroupMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AccessGroups;