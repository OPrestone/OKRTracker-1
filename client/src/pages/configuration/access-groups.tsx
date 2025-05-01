import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import DashboardLayout from "@/layouts/dashboard-layout";
import { AccessGroup } from "@shared/schema";

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
  Search,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  ChevronRight,
  UsersRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  AlertCircle,
  UserPlus,
  PersonStanding,
  Settings,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
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
                <Card key={group.id} className="relative overflow-hidden group hover:shadow-md transition-all duration-200 border border-slate-200">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-slate-800">{group.name}</CardTitle>
                        <div className="flex items-center text-xs px-2.5 py-1 rounded-full bg-slate-100">
                          {getPermissionLevel(group).icon}
                          <span className="ml-1 font-medium">{getPermissionLevel(group).label}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-slate-100">
                            <Settings className="h-4 w-4 text-slate-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-xs font-medium text-slate-500">Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditAccessGroup(group)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2 text-blue-600" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteAccessGroup(group)} className="cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                            Delete Group
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActiveTab("users")} className="cursor-pointer">
                            <UserPlus className="h-4 w-4 mr-2 text-emerald-600" />
                            Manage Users
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="text-slate-500">{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-col space-y-1.5">
                        <h4 className="text-sm font-medium text-slate-700">Key Permissions:</h4>
                        <div className="space-y-1.5">
                          {(group.permissions as any)?.createOKRs && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              <span className="text-slate-700">Create OKRs</span>
                            </div>
                          )}
                          {(group.permissions as any)?.editAllOKRs && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              <span className="text-slate-700">Edit All OKRs</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageUsers && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              <span className="text-slate-700">Manage Users</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageTeams && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              <span className="text-slate-700">Manage Teams</span>
                            </div>
                          )}
                          {(group.permissions as any)?.manageSettings && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></div>
                              <span className="text-slate-700">Manage System Settings</span>
                            </div>
                          )}
                          {!(group.permissions as any)?.createOKRs && 
                          !(group.permissions as any)?.editAllOKRs && 
                          !(group.permissions as any)?.manageUsers && 
                          !(group.permissions as any)?.manageTeams && 
                          !(group.permissions as any)?.manageSettings && (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                              <span>Basic access only</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0 border-t border-slate-100">
                    <div className="text-sm text-slate-500 flex items-center">
                      <UsersRound className="h-4 w-4 mr-1.5 text-indigo-500 opacity-80" />
                      <span>{group.userCount || 0} {group.userCount === 1 ? 'user' : 'users'}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" 
                      onClick={() => handleEditAccessGroup(group)}
                    >
                      Edit
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No access groups found</AlertTitle>
              <AlertDescription>
                {searchQuery 
                  ? `No access groups matching "${searchQuery}" were found. Try a different search.` 
                  : "No access groups have been created yet. Create a new access group to get started."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Permission Levels Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permission Levels</CardTitle>
              <CardDescription>
                Understanding access control in the OKR system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableCaption>Available permission levels in the system</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Level</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Key Capabilities</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        Administrator
                      </div>
                    </TableCell>
                    <TableCell>Full system access with all permissions</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Manage Settings
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Manage Users
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Manage Teams
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          All OKR Access
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-amber-500" />
                        Manager
                      </div>
                    </TableCell>
                    <TableCell>Can manage users, teams and some system aspects</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Manage Users
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Manage Teams
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Edit All OKRs
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Access Reports
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Editor
                      </div>
                    </TableCell>
                    <TableCell>Can create and edit OKRs and related content</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Create OKRs
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Edit Assigned OKRs
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Create Check-ins
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ShieldQuestion className="h-5 w-5 text-gray-500" />
                        Viewer
                      </div>
                    </TableCell>
                    <TableCell>Basic access for viewing OKRs</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          View Assigned OKRs
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          View Own Team Data
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Access Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Access Group</DialogTitle>
            <DialogDescription>
              Add a new access group and define its permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-right">
                    Group Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter access group name"
                    value={accessGroupForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this access group"
                    value={accessGroupForm.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Permissions</h3>
                
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-sm mb-3">OKR Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="create-okrs" 
                        checked={accessGroupForm.permissions.createOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="create-okrs" className="flex items-center">
                        <Pencil className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Create OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-all-okrs" 
                        checked={accessGroupForm.permissions.editAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-all-okrs" className="flex items-center">
                        <Edit className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Edit All OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="delete-okrs" 
                        checked={accessGroupForm.permissions.deleteOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("deleteOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="delete-okrs" className="flex items-center">
                        <Trash2 className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                        Delete OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="view-all-okrs" 
                        checked={accessGroupForm.permissions.viewAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="view-all-okrs" className="flex items-center">
                        <Eye className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        View All OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="create-key-results" 
                        checked={accessGroupForm.permissions.createKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="create-key-results" className="flex items-center">
                        <Plus className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Create Key Results
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-assigned-key-results" 
                        checked={accessGroupForm.permissions.editAssignedKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAssignedKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-assigned-key-results" className="flex items-center">
                        <Edit className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        Edit Assigned Key Results
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-sm mb-3">System Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manage-users" 
                        checked={accessGroupForm.permissions.manageUsers}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageUsers", checked as boolean);
                          // If this is checked, also enable viewing all OKRs
                          if (checked) {
                            handlePermissionChange("viewAllOKRs", true);
                          }
                        }}
                      />
                      <Label htmlFor="manage-users" className="flex items-center">
                        <UsersRound className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Users
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manage-teams" 
                        checked={accessGroupForm.permissions.manageTeams}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageTeams", checked as boolean);
                          // If this is checked, also enable viewing all OKRs
                          if (checked) {
                            handlePermissionChange("viewAllOKRs", true);
                          }
                        }}
                      />
                      <Label htmlFor="manage-teams" className="flex items-center">
                        <PersonStanding className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Teams
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manage-settings" 
                        checked={accessGroupForm.permissions.manageSettings}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageSettings", checked as boolean);
                          // If manage settings is enabled, enable all other permissions
                          if (checked) {
                            handlePermissionChange("manageUsers", true);
                            handlePermissionChange("manageTeams", true);
                            handlePermissionChange("createOKRs", true);
                            handlePermissionChange("editAllOKRs", true);
                            handlePermissionChange("deleteOKRs", true);
                            handlePermissionChange("viewAllOKRs", true);
                            handlePermissionChange("viewReports", true);
                            handlePermissionChange("exportData", true);
                            handlePermissionChange("manageAccessGroups", true);
                          }
                        }}
                      />
                      <Label htmlFor="manage-settings" className="flex items-center">
                        <Settings className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                        Manage System Settings
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manage-access-groups" 
                        checked={accessGroupForm.permissions.manageAccessGroups}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageAccessGroups", checked as boolean)
                        }
                      />
                      <Label htmlFor="manage-access-groups" className="flex items-center">
                        <Shield className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Access Groups
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-sm mb-3">Reports & Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="view-reports" 
                        checked={accessGroupForm.permissions.viewReports}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewReports", checked as boolean)
                        }
                      />
                      <Label htmlFor="view-reports">View Reports</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="export-data" 
                        checked={accessGroupForm.permissions.exportData}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("exportData", checked as boolean)
                        }
                      />
                      <Label htmlFor="export-data">Export Data</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!accessGroupForm.name || createAccessGroupMutation.isPending}>
                {createAccessGroupMutation.isPending ? (
                  <>
                    <span className="mr-2">Creating...</span>
                    <span className="animate-spin">
                      <span className="sr-only">Loading...</span>
                    </span>
                  </>
                ) : (
                  "Create Access Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Access Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Access Group</DialogTitle>
            <DialogDescription>
              Update access group details and permissions
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-right">
                    Group Name *
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Enter access group name"
                    value={accessGroupForm.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe the purpose of this access group"
                    value={accessGroupForm.description}
                    onChange={(e) => handleFormChange("description", e.target.value)}
                    className="min-h-24"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Permissions</h3>
                
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-sm mb-3">OKR Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-create-okrs" 
                        checked={accessGroupForm.permissions.createOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-create-okrs" className="flex items-center">
                        <Pencil className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Create OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-edit-all-okrs" 
                        checked={accessGroupForm.permissions.editAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-edit-all-okrs" className="flex items-center">
                        <Edit className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Edit All OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-delete-okrs" 
                        checked={accessGroupForm.permissions.deleteOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("deleteOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-delete-okrs" className="flex items-center">
                        <Trash2 className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                        Delete OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-view-all-okrs" 
                        checked={accessGroupForm.permissions.viewAllOKRs}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewAllOKRs", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-view-all-okrs" className="flex items-center">
                        <Eye className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        View All OKRs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-create-key-results" 
                        checked={accessGroupForm.permissions.createKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("createKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-create-key-results" className="flex items-center">
                        <Plus className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                        Create Key Results
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-edit-assigned-key-results" 
                        checked={accessGroupForm.permissions.editAssignedKeyResults}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("editAssignedKeyResults", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-edit-assigned-key-results" className="flex items-center">
                        <Edit className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                        Edit Assigned Key Results
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-sm mb-3">System Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-manage-users" 
                        checked={accessGroupForm.permissions.manageUsers}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageUsers", checked as boolean);
                          if (checked) {
                            handlePermissionChange("viewAllOKRs", true);
                          }
                        }}
                      />
                      <Label htmlFor="edit-manage-users" className="flex items-center">
                        <UsersRound className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Users
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-manage-teams" 
                        checked={accessGroupForm.permissions.manageTeams}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageTeams", checked as boolean);
                          if (checked) {
                            handlePermissionChange("viewAllOKRs", true);
                          }
                        }}
                      />
                      <Label htmlFor="edit-manage-teams" className="flex items-center">
                        <PersonStanding className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Teams
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-manage-settings" 
                        checked={accessGroupForm.permissions.manageSettings}
                        onCheckedChange={(checked) => {
                          handlePermissionChange("manageSettings", checked as boolean);
                          if (checked) {
                            handlePermissionChange("manageUsers", true);
                            handlePermissionChange("manageTeams", true);
                            handlePermissionChange("createOKRs", true);
                            handlePermissionChange("editAllOKRs", true);
                            handlePermissionChange("deleteOKRs", true);
                            handlePermissionChange("viewAllOKRs", true);
                            handlePermissionChange("viewReports", true);
                            handlePermissionChange("exportData", true);
                            handlePermissionChange("manageAccessGroups", true);
                          }
                        }}
                      />
                      <Label htmlFor="edit-manage-settings" className="flex items-center">
                        <Settings className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                        Manage System Settings
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-manage-access-groups" 
                        checked={accessGroupForm.permissions.manageAccessGroups}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("manageAccessGroups", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-manage-access-groups" className="flex items-center">
                        <Shield className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                        Manage Access Groups
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-sm mb-3">Reports & Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-view-reports" 
                        checked={accessGroupForm.permissions.viewReports}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("viewReports", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-view-reports">View Reports</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="edit-export-data" 
                        checked={accessGroupForm.permissions.exportData}
                        onCheckedChange={(checked) => 
                          handlePermissionChange("exportData", checked as boolean)
                        }
                      />
                      <Label htmlFor="edit-export-data">Export Data</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!accessGroupForm.name || updateAccessGroupMutation.isPending}>
                {updateAccessGroupMutation.isPending ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <span className="animate-spin">
                      <span className="sr-only">Loading...</span>
                    </span>
                  </>
                ) : (
                  "Update Access Group"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Access Group Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Access Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this access group? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedGroup && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{selectedGroup.name}</AlertTitle>
                <AlertDescription>
                  {selectedGroup.userCount && selectedGroup.userCount > 0 ? (
                    <span className="text-red-500">
                      Warning: This group has {selectedGroup.userCount} {selectedGroup.userCount === 1 ? 'user' : 'users'} assigned to it. 
                      These users will lose the permissions associated with this group.
                    </span>
                  ) : (
                    <span>This access group has no users assigned to it.</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (selectedGroup) {
                  deleteAccessGroupMutation.mutate(selectedGroup.id);
                }
              }}
              disabled={deleteAccessGroupMutation.isPending}
            >
              {deleteAccessGroupMutation.isPending ? "Deleting..." : "Delete Access Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AccessGroups;