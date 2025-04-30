import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Save, User2, Building, Flag, CalendarRange, Settings, Bell, Lock, Mail, MoreHorizontal, Pencil, Trash, Trash2, Repeat, Calendar, Plus, Users, Server, Shield, Download, Eye, LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Form schema for creating and updating cycles
const cycleFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  type: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.string().default("planning"),
  description: z.string().optional(),
  isDefault: z.boolean().default(false)
});

type CycleFormValues = z.infer<typeof cycleFormSchema>;

// CycleCreateDialog component for creating new cycles
function CycleCreateDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleFormSchema),
    defaultValues: {
      name: "",
      type: "quarterly",
      status: "planning",
      description: "",
      isDefault: false
    }
  });

  const createCycleMutation = useMutation({
    mutationFn: async (data: CycleFormValues) => {
      const response = await fetch('/api/cycles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create cycle');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cycle created",
        description: "Your new OKR cycle has been created successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cycles'] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create cycle. Please try again.",
        variant: "destructive"
      });
      console.error("Error creating cycle:", error);
    }
  });

  function onSubmit(data: CycleFormValues) {
    createCycleMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Cycle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New OKR Cycle</DialogTitle>
          <DialogDescription>
            Set up a new time period for tracking objectives and key results
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cycle Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Q1 2025" {...field} />
                  </FormControl>
                  <FormDescription>
                    Give this cycle a recognizable name, e.g. "Q1 2025" or "H2 2025"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cycle Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a cycle type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of cycle determines the expected duration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("startDate");
                            return startDate && date < startDate;
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Current status of this OKR cycle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the focus and goals for this cycle"
                      className="h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as Default Cycle
                    </FormLabel>
                    <FormDescription>
                      New objectives will be assigned to this cycle by default
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createCycleMutation.isPending}
              >
                {createCycleMutation.isPending && (
                  <span className="animate-spin mr-2">⟳</span>
                )}
                Create Cycle
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// CyclesList component for displaying and managing cycles
function CyclesList() {
  const queryClient = useQueryClient();
  
  const cyclesQuery = useQuery({
    queryKey: ['/api/cycles'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const deleteCycleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/cycles/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete cycle');
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast({
        title: "Cycle deleted",
        description: "The cycle has been removed successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cycles'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete cycle. Please try again.",
        variant: "destructive"
      });
      console.error("Error deleting cycle:", error);
    }
  });

  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this cycle? This action cannot be undone.")) {
      deleteCycleMutation.mutate(id);
    }
  }
  
  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'planning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-neutral-100 text-neutral-800 border-neutral-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  if (cyclesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded-md">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (cyclesQuery.isError) {
    return (
      <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
        Error loading cycles. Please try refreshing the page.
      </div>
    );
  }

  const cycles = cyclesQuery.data || [];

  if (cycles.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md bg-neutral-50">
        <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
        <h3 className="font-medium text-lg">No OKR Cycles</h3>
        <p className="text-neutral-500 mb-4">
          Start by creating your first OKR cycle to organize your objectives
        </p>
        <CycleCreateDialog />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cycles.map((cycle: any) => (
        <div key={cycle.id} className="p-4 border rounded-md hover:border-neutral-300 transition-colors">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-lg">{cycle.name}</h3>
                {cycle.isDefault && (
                  <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                )}
                <Badge className={`text-xs ${getStatusBadgeColor(cycle.status)}`}>
                  {cycle.status.charAt(0).toUpperCase() + cycle.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                <span>{format(new Date(cycle.startDate), "MMM d, yyyy")}</span>
                <span>—</span>
                <span>{format(new Date(cycle.endDate), "MMM d, yyyy")}</span>
                <span className="mx-2">•</span>
                <span className="capitalize">{cycle.type}</span>
              </div>
              {cycle.description && (
                <p className="text-sm text-neutral-600 mt-2">{cycle.description}</p>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="flex items-center gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit Cycle
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 flex items-center gap-2"
                  onClick={() => handleDelete(cycle.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Cycle
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Configure() {
  // General settings states
  const [isGeneralSaving, setIsGeneralSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingSystemLogo, setIsUploadingSystemLogo] = useState(false);
  const [systemLogoFile, setSystemLogoFile] = useState<File | null>(null);
  
  // Section specific saving states
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [isSecuritySaving, setIsSecuritySaving] = useState(false);
  const [isLdapSaving, setIsLdapSaving] = useState(false);
  const [isSsoSaving, setIsSsoSaving] = useState(false);
  

  const [isPermissionSaving, setIsPermissionSaving] = useState(false);
  const [isEmailTemplateSaving, setIsEmailTemplateSaving] = useState(false);
  const [isTeamSaving, setIsTeamSaving] = useState(false);
  const [isObjectiveSaving, setIsObjectiveSaving] = useState(false);
  const [isDefaultSettingsSaving, setIsDefaultSettingsSaving] = useState(false);
  const [isKeyResultTypesSaving, setIsKeyResultTypesSaving] = useState(false);
  const [isApprovalSettingsSaving, setIsApprovalSettingsSaving] = useState(false);
  const [isCadenceSettingsSaving, setIsCadenceSettingsSaving] = useState(false);
  const [isCycleSaving, setIsCycleSaving] = useState(false);
  
  // Integration states
  const [isSlackConnecting, setIsSlackConnecting] = useState(false);
  const [isGoogleCalendarConnecting, setIsGoogleCalendarConnecting] = useState(false);
  const [isJiraConnecting, setIsJiraConnecting] = useState(false);
  

  
  // Handler for saving general settings
  const handleSaveGeneralSettings = () => {
    setIsGeneralSaving(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "Your general settings have been updated successfully.",
      });
      setIsGeneralSaving(false);
    }, 1000);
  };
  
  // Handler for company logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("File selected:", file.name);
    setIsUploadingLogo(true);
    setLogoFile(file);
    
    // Simulate upload
    setTimeout(() => {
      toast({
        title: "Logo uploaded",
        description: "Your company logo has been updated successfully.",
      });
      setIsUploadingLogo(false);
    }, 1500);
  };
  
  // Handler for system logo upload
  const handleSystemLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log("System logo file selected:", file.name);
    setIsUploadingSystemLogo(true);
    setSystemLogoFile(file);
    
    // Create FormData
    const formData = new FormData();
    formData.append('logo', file);
    
    // Call API to upload system logo
    fetch('/api/system-logo', {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to upload system logo');
      }
      return response.json();
    })
    .then(data => {
      toast({
        title: "System logo uploaded",
        description: "Your system logo has been updated successfully.",
      });
    })
    .catch(error => {
      console.error('Error uploading system logo:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading the system logo.",
        variant: "destructive",
      });
    })
    .finally(() => {
      setIsUploadingSystemLogo(false);
    });
  };
  
  // Handler for LDAP test connection
  const handleLdapTestConnection = () => {
    toast({
      title: "Testing connection",
      description: "Attempting to connect to the LDAP server...",
    });
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to the LDAP server.",
      });
    }, 2000);
  };
  
  // Handler for SSO test connection
  const handleSsoTestConnection = () => {
    toast({
      title: "Testing SSO connection",
      description: "Validating SSO configuration...",
    });
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "SSO connection successful",
        description: "Your SSO configuration is valid.",
      });
    }, 2000);
  };
  
  // Handler for downloading SSO metadata
  const handleDownloadSsoMetadata = () => {
    toast({
      title: "Downloading metadata",
      description: "Preparing SSO metadata for download...",
    });
    
    // Simulate download
    setTimeout(() => {
      const metadataContent = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="https://okr.yourcompany.com">
    <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
        <AssertionConsumerService index="1" 
                                 Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="https://okr.yourcompany.com/api/auth/sso/callback"/>
    </SPSSODescriptor>
</EntityDescriptor>`;
      
      const blob = new Blob([metadataContent], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'okr-sp-metadata.xml';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Metadata downloaded",
        description: "SSO metadata has been downloaded.",
      });
    }, 1000);
  };
  
  // Handler for viewing SSO setup instructions
  const handleViewSsoInstructions = () => {
    toast({
      title: "Setup instructions",
      description: "Opening SSO setup instructions...",
    });
    
    // Here you would typically open a modal with instructions
    // For now, let's just show a toast
    setTimeout(() => {
      toast({
        title: "SSO Setup Guide",
        description: "A detailed guide would typically be shown in a modal here.",
      });
    }, 500);
  };
  
  // Additional handlers for other action buttons
  
  // Notification Settings
  const handleSaveNotificationSettings = () => {
    setIsNotificationSaving(true);
    setTimeout(() => {
      toast({
        title: "Notification preferences saved",
        description: "Your notification preferences have been updated.",
      });
      setIsNotificationSaving(false);
    }, 1000);
  };
  
  // Security Settings
  const handleSaveSecuritySettings = () => {
    setIsSecuritySaving(true);
    setTimeout(() => {
      toast({
        title: "Security settings saved",
        description: "Your security settings have been updated.",
      });
      setIsSecuritySaving(false);
    }, 1000);
  };
  
  // LDAP Configuration
  const handleSaveLdapConfig = () => {
    setIsLdapSaving(true);
    setTimeout(() => {
      toast({
        title: "LDAP configuration saved",
        description: "Your LDAP integration settings have been updated.",
      });
      setIsLdapSaving(false);
    }, 1000);
  };
  
  // SSO Configuration
  const handleSaveSsoConfig = () => {
    setIsSsoSaving(true);
    setTimeout(() => {
      toast({
        title: "SSO configuration saved",
        description: "Your Single Sign-On settings have been updated.",
      });
      setIsSsoSaving(false);
    }, 1000);
  };
  
  // User Permission Settings
  const handleSavePermissionSettings = () => {
    setIsPermissionSaving(true);
    setTimeout(() => {
      toast({
        title: "Permission settings saved",
        description: "User role permissions have been updated.",
      });
      setIsPermissionSaving(false);
    }, 1000);
  };
  
  // Email Templates
  const handleSaveEmailTemplates = () => {
    setIsEmailTemplateSaving(true);
    setTimeout(() => {
      toast({
        title: "Email templates saved",
        description: "Your notification email templates have been updated.",
      });
      setIsEmailTemplateSaving(false);
    }, 1000);
  };
  
  // Teams Settings
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  
  const teamFormSchema = z.object({
    name: z.string().min(2, "Team name must be at least 2 characters"),
    description: z.string().optional(),
    leaderId: z.number().optional(),
  });
  
  type TeamFormValues = z.infer<typeof teamFormSchema>;
  
  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const handleCreateTeam = async (data: TeamFormValues) => {
    setIsCreatingTeam(true);
    
    try {
      // Replace with actual API call when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Team created",
        description: `${data.name} team has been created successfully.`,
      });
      
      // Close form and reset
      setTeamFormOpen(false);
      teamForm.reset();
    } catch (error) {
      toast({
        title: "Error creating team",
        description: "There was a problem creating the team. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating team:", error);
    } finally {
      setIsCreatingTeam(false);
    }
  };
  
  const handleSaveTeamSettings = () => {
    setIsTeamSaving(true);
    setTimeout(() => {
      toast({
        title: "Team settings saved",
        description: "Your team configuration has been updated.",
      });
      setIsTeamSaving(false);
    }, 1000);
  };
  
  // Objective Settings
  const handleSaveObjectiveSettings = () => {
    setIsObjectiveSaving(true);
    setTimeout(() => {
      toast({
        title: "Objective settings saved",
        description: "Your OKR default settings have been updated.",
      });
      setIsObjectiveSaving(false);
    }, 1000);
  };
  
  // Default Settings
  const handleSaveDefaultSettings = () => {
    setIsDefaultSettingsSaving(true);
    setTimeout(() => {
      toast({
        title: "Default settings saved",
        description: "Your OKR default settings have been updated.",
      });
      setIsDefaultSettingsSaving(false);
    }, 1000);
  };
  
  // Key Result Types
  const handleSaveKeyResultTypes = () => {
    setIsKeyResultTypesSaving(true);
    setTimeout(() => {
      toast({
        title: "Key result types saved",
        description: "Your key result type settings have been updated.",
      });
      setIsKeyResultTypesSaving(false);
    }, 1000);
  };
  
  // Approval Settings
  const handleSaveApprovalSettings = () => {
    setIsApprovalSettingsSaving(true);
    setTimeout(() => {
      toast({
        title: "Approval settings saved",
        description: "Your OKR approval workflow settings have been updated.",
      });
      setIsApprovalSettingsSaving(false);
    }, 1000);
  };
  
  // Cadence Settings
  const handleSaveCadenceSettings = () => {
    setIsCadenceSettingsSaving(true);
    setTimeout(() => {
      toast({
        title: "Cadence settings saved",
        description: "Your check-in and review cadence settings have been updated.",
      });
      setIsCadenceSettingsSaving(false);
    }, 1000);
  };
  
  // Integration Handlers
  const handleSlackConnect = () => {
    setIsSlackConnecting(true);
    toast({
      title: "Connecting to Slack",
      description: "Setting up Slack integration...",
    });
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Slack connected",
        description: "Successfully connected to Slack workspace.",
      });
      setIsSlackConnecting(false);
    }, 2000);
  };
  
  const handleGoogleCalendarConnect = () => {
    setIsGoogleCalendarConnecting(true);
    toast({
      title: "Connecting to Google Calendar",
      description: "Setting up Google Calendar integration...",
    });
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Google Calendar connected",
        description: "Successfully connected to Google Calendar.",
      });
      setIsGoogleCalendarConnecting(false);
    }, 2000);
  };
  
  const handleJiraConnect = () => {
    setIsJiraConnecting(true);
    toast({
      title: "Connecting to Jira",
      description: "Setting up Jira integration...",
    });
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Jira connected",
        description: "Successfully connected to Jira.",
      });
      setIsJiraConnecting(false);
    }, 2000);
  };
  
  // Cycle Settings
  const handleCreateCycle = () => {
    toast({
      title: "Create new cycle",
      description: "Opening cycle creation dialog...",
    });
  };
  
  const handleSaveCycleSettings = () => {
    setIsCycleSaving(true);
    setTimeout(() => {
      toast({
        title: "Cycle settings saved",
        description: "Your OKR cycle settings have been updated.",
      });
      setIsCycleSaving(false);
    }, 1000);
  };
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Configure</h1>
        <p className="text-neutral-600">Customize your OKR system settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="mb-8">
        <TabsList className="grid w-full md:w-auto grid-cols-6 md:grid-flow-col md:auto-cols-max gap-2">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User2 className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Teams</span>
          </TabsTrigger>
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            <span>Objectives</span>
          </TabsTrigger>
          <TabsTrigger value="cadences" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            <span>Cadences</span>
          </TabsTrigger>
          <TabsTrigger value="cycles" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4" />
            <span>Cycles</span>
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 pt-4">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="flex items-center">
                    Company Name <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="company-name" 
                    defaultValue="Acme Corporation" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="flex items-center">
                    Admin Email <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="admin-email" 
                    defaultValue="admin@acmecorp.com" 
                    type="email" 
                    required 
                  />
                </div>
              </div>
              
              {/* Company Address */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Company Address</Label>
                
                {/* Street Address */}
                <div className="space-y-2">
                  <Label htmlFor="street-address" className="flex items-center">
                    Street Address <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input 
                    id="street-address" 
                    placeholder="123 Main Street" 
                    required
                  />
                </div>
                
                {/* Address Line 2 - Optional */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="address-line2">Address Line 2</Label>
                    <span className="text-sm text-gray-500">Optional</span>
                  </div>
                  <Input 
                    id="address-line2" 
                    placeholder="Suite 100" 
                  />
                </div>
                
                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center">
                    Country <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select defaultValue="us" required>
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="h-[300px]">
                      <SelectItem value="af">Afghanistan</SelectItem>
                      <SelectItem value="al">Albania</SelectItem>
                      <SelectItem value="dz">Algeria</SelectItem>
                      <SelectItem value="as">American Samoa</SelectItem>
                      <SelectItem value="ad">Andorra</SelectItem>
                      <SelectItem value="ao">Angola</SelectItem>
                      <SelectItem value="ai">Anguilla</SelectItem>
                      <SelectItem value="aq">Antarctica</SelectItem>
                      <SelectItem value="ag">Antigua and Barbuda</SelectItem>
                      <SelectItem value="ar">Argentina</SelectItem>
                      <SelectItem value="am">Armenia</SelectItem>
                      <SelectItem value="aw">Aruba</SelectItem>
                      <SelectItem value="au">Australia</SelectItem>
                      <SelectItem value="at">Austria</SelectItem>
                      <SelectItem value="az">Azerbaijan</SelectItem>
                      <SelectItem value="bs">Bahamas</SelectItem>
                      <SelectItem value="bh">Bahrain</SelectItem>
                      <SelectItem value="bd">Bangladesh</SelectItem>
                      <SelectItem value="bb">Barbados</SelectItem>
                      <SelectItem value="by">Belarus</SelectItem>
                      <SelectItem value="be">Belgium</SelectItem>
                      <SelectItem value="bz">Belize</SelectItem>
                      <SelectItem value="bj">Benin</SelectItem>
                      <SelectItem value="bm">Bermuda</SelectItem>
                      <SelectItem value="bt">Bhutan</SelectItem>
                      <SelectItem value="bo">Bolivia</SelectItem>
                      <SelectItem value="ba">Bosnia and Herzegovina</SelectItem>
                      <SelectItem value="bw">Botswana</SelectItem>
                      <SelectItem value="bv">Bouvet Island</SelectItem>
                      <SelectItem value="br">Brazil</SelectItem>
                      <SelectItem value="io">British Indian Ocean Territory</SelectItem>
                      <SelectItem value="bn">Brunei</SelectItem>
                      <SelectItem value="bg">Bulgaria</SelectItem>
                      <SelectItem value="bf">Burkina Faso</SelectItem>
                      <SelectItem value="bi">Burundi</SelectItem>
                      <SelectItem value="kh">Cambodia</SelectItem>
                      <SelectItem value="cm">Cameroon</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="cv">Cape Verde</SelectItem>
                      <SelectItem value="ky">Cayman Islands</SelectItem>
                      <SelectItem value="cf">Central African Republic</SelectItem>
                      <SelectItem value="td">Chad</SelectItem>
                      <SelectItem value="cl">Chile</SelectItem>
                      <SelectItem value="cn">China</SelectItem>
                      <SelectItem value="cx">Christmas Island</SelectItem>
                      <SelectItem value="cc">Cocos (Keeling) Islands</SelectItem>
                      <SelectItem value="co">Colombia</SelectItem>
                      <SelectItem value="km">Comoros</SelectItem>
                      <SelectItem value="cg">Congo</SelectItem>
                      <SelectItem value="cd">Congo (Democratic Republic)</SelectItem>
                      <SelectItem value="ck">Cook Islands</SelectItem>
                      <SelectItem value="cr">Costa Rica</SelectItem>
                      <SelectItem value="ci">Côte d'Ivoire</SelectItem>
                      <SelectItem value="hr">Croatia</SelectItem>
                      <SelectItem value="cu">Cuba</SelectItem>
                      <SelectItem value="cy">Cyprus</SelectItem>
                      <SelectItem value="cz">Czech Republic</SelectItem>
                      <SelectItem value="dk">Denmark</SelectItem>
                      <SelectItem value="dj">Djibouti</SelectItem>
                      <SelectItem value="dm">Dominica</SelectItem>
                      <SelectItem value="do">Dominican Republic</SelectItem>
                      <SelectItem value="ec">Ecuador</SelectItem>
                      <SelectItem value="eg">Egypt</SelectItem>
                      <SelectItem value="sv">El Salvador</SelectItem>
                      <SelectItem value="gq">Equatorial Guinea</SelectItem>
                      <SelectItem value="er">Eritrea</SelectItem>
                      <SelectItem value="ee">Estonia</SelectItem>
                      <SelectItem value="et">Ethiopia</SelectItem>
                      <SelectItem value="fk">Falkland Islands</SelectItem>
                      <SelectItem value="fo">Faroe Islands</SelectItem>
                      <SelectItem value="fj">Fiji</SelectItem>
                      <SelectItem value="fi">Finland</SelectItem>
                      <SelectItem value="fr">France</SelectItem>
                      <SelectItem value="gf">French Guiana</SelectItem>
                      <SelectItem value="pf">French Polynesia</SelectItem>
                      <SelectItem value="tf">French Southern Territories</SelectItem>
                      <SelectItem value="ga">Gabon</SelectItem>
                      <SelectItem value="gm">Gambia</SelectItem>
                      <SelectItem value="ge">Georgia</SelectItem>
                      <SelectItem value="de">Germany</SelectItem>
                      <SelectItem value="gh">Ghana</SelectItem>
                      <SelectItem value="gi">Gibraltar</SelectItem>
                      <SelectItem value="gr">Greece</SelectItem>
                      <SelectItem value="gl">Greenland</SelectItem>
                      <SelectItem value="gd">Grenada</SelectItem>
                      <SelectItem value="gp">Guadeloupe</SelectItem>
                      <SelectItem value="gu">Guam</SelectItem>
                      <SelectItem value="gt">Guatemala</SelectItem>
                      <SelectItem value="gn">Guinea</SelectItem>
                      <SelectItem value="gw">Guinea-Bissau</SelectItem>
                      <SelectItem value="gy">Guyana</SelectItem>
                      <SelectItem value="ht">Haiti</SelectItem>
                      <SelectItem value="hm">Heard Island and McDonald Islands</SelectItem>
                      <SelectItem value="va">Holy See (Vatican City)</SelectItem>
                      <SelectItem value="hn">Honduras</SelectItem>
                      <SelectItem value="hk">Hong Kong</SelectItem>
                      <SelectItem value="hu">Hungary</SelectItem>
                      <SelectItem value="is">Iceland</SelectItem>
                      <SelectItem value="in">India</SelectItem>
                      <SelectItem value="id">Indonesia</SelectItem>
                      <SelectItem value="ir">Iran</SelectItem>
                      <SelectItem value="iq">Iraq</SelectItem>
                      <SelectItem value="ie">Ireland</SelectItem>
                      <SelectItem value="il">Israel</SelectItem>
                      <SelectItem value="it">Italy</SelectItem>
                      <SelectItem value="jm">Jamaica</SelectItem>
                      <SelectItem value="jp">Japan</SelectItem>
                      <SelectItem value="jo">Jordan</SelectItem>
                      <SelectItem value="kz">Kazakhstan</SelectItem>
                      <SelectItem value="ke">Kenya</SelectItem>
                      <SelectItem value="ki">Kiribati</SelectItem>
                      <SelectItem value="kp">Korea, North</SelectItem>
                      <SelectItem value="kr">Korea, South</SelectItem>
                      <SelectItem value="kw">Kuwait</SelectItem>
                      <SelectItem value="kg">Kyrgyzstan</SelectItem>
                      <SelectItem value="la">Laos</SelectItem>
                      <SelectItem value="lv">Latvia</SelectItem>
                      <SelectItem value="lb">Lebanon</SelectItem>
                      <SelectItem value="ls">Lesotho</SelectItem>
                      <SelectItem value="lr">Liberia</SelectItem>
                      <SelectItem value="ly">Libya</SelectItem>
                      <SelectItem value="li">Liechtenstein</SelectItem>
                      <SelectItem value="lt">Lithuania</SelectItem>
                      <SelectItem value="lu">Luxembourg</SelectItem>
                      <SelectItem value="mo">Macao</SelectItem>
                      <SelectItem value="mk">North Macedonia</SelectItem>
                      <SelectItem value="mg">Madagascar</SelectItem>
                      <SelectItem value="mw">Malawi</SelectItem>
                      <SelectItem value="my">Malaysia</SelectItem>
                      <SelectItem value="mv">Maldives</SelectItem>
                      <SelectItem value="ml">Mali</SelectItem>
                      <SelectItem value="mt">Malta</SelectItem>
                      <SelectItem value="mh">Marshall Islands</SelectItem>
                      <SelectItem value="mq">Martinique</SelectItem>
                      <SelectItem value="mr">Mauritania</SelectItem>
                      <SelectItem value="mu">Mauritius</SelectItem>
                      <SelectItem value="yt">Mayotte</SelectItem>
                      <SelectItem value="mx">Mexico</SelectItem>
                      <SelectItem value="fm">Micronesia</SelectItem>
                      <SelectItem value="md">Moldova</SelectItem>
                      <SelectItem value="mc">Monaco</SelectItem>
                      <SelectItem value="mn">Mongolia</SelectItem>
                      <SelectItem value="me">Montenegro</SelectItem>
                      <SelectItem value="ms">Montserrat</SelectItem>
                      <SelectItem value="ma">Morocco</SelectItem>
                      <SelectItem value="mz">Mozambique</SelectItem>
                      <SelectItem value="mm">Myanmar</SelectItem>
                      <SelectItem value="na">Namibia</SelectItem>
                      <SelectItem value="nr">Nauru</SelectItem>
                      <SelectItem value="np">Nepal</SelectItem>
                      <SelectItem value="nl">Netherlands</SelectItem>
                      <SelectItem value="nc">New Caledonia</SelectItem>
                      <SelectItem value="nz">New Zealand</SelectItem>
                      <SelectItem value="ni">Nicaragua</SelectItem>
                      <SelectItem value="ne">Niger</SelectItem>
                      <SelectItem value="ng">Nigeria</SelectItem>
                      <SelectItem value="nu">Niue</SelectItem>
                      <SelectItem value="nf">Norfolk Island</SelectItem>
                      <SelectItem value="mp">Northern Mariana Islands</SelectItem>
                      <SelectItem value="no">Norway</SelectItem>
                      <SelectItem value="om">Oman</SelectItem>
                      <SelectItem value="pk">Pakistan</SelectItem>
                      <SelectItem value="pw">Palau</SelectItem>
                      <SelectItem value="ps">Palestine</SelectItem>
                      <SelectItem value="pa">Panama</SelectItem>
                      <SelectItem value="pg">Papua New Guinea</SelectItem>
                      <SelectItem value="py">Paraguay</SelectItem>
                      <SelectItem value="pe">Peru</SelectItem>
                      <SelectItem value="ph">Philippines</SelectItem>
                      <SelectItem value="pn">Pitcairn</SelectItem>
                      <SelectItem value="pl">Poland</SelectItem>
                      <SelectItem value="pt">Portugal</SelectItem>
                      <SelectItem value="pr">Puerto Rico</SelectItem>
                      <SelectItem value="qa">Qatar</SelectItem>
                      <SelectItem value="re">Réunion</SelectItem>
                      <SelectItem value="ro">Romania</SelectItem>
                      <SelectItem value="ru">Russian Federation</SelectItem>
                      <SelectItem value="rw">Rwanda</SelectItem>
                      <SelectItem value="sh">Saint Helena</SelectItem>
                      <SelectItem value="kn">Saint Kitts and Nevis</SelectItem>
                      <SelectItem value="lc">Saint Lucia</SelectItem>
                      <SelectItem value="pm">Saint Pierre and Miquelon</SelectItem>
                      <SelectItem value="vc">Saint Vincent and the Grenadines</SelectItem>
                      <SelectItem value="ws">Samoa</SelectItem>
                      <SelectItem value="sm">San Marino</SelectItem>
                      <SelectItem value="st">Sao Tome and Principe</SelectItem>
                      <SelectItem value="sa">Saudi Arabia</SelectItem>
                      <SelectItem value="sn">Senegal</SelectItem>
                      <SelectItem value="rs">Serbia</SelectItem>
                      <SelectItem value="sc">Seychelles</SelectItem>
                      <SelectItem value="sl">Sierra Leone</SelectItem>
                      <SelectItem value="sg">Singapore</SelectItem>
                      <SelectItem value="sk">Slovakia</SelectItem>
                      <SelectItem value="si">Slovenia</SelectItem>
                      <SelectItem value="sb">Solomon Islands</SelectItem>
                      <SelectItem value="so">Somalia</SelectItem>
                      <SelectItem value="za">South Africa</SelectItem>
                      <SelectItem value="ss">South Sudan</SelectItem>
                      <SelectItem value="es">Spain</SelectItem>
                      <SelectItem value="lk">Sri Lanka</SelectItem>
                      <SelectItem value="sd">Sudan</SelectItem>
                      <SelectItem value="sr">Suriname</SelectItem>
                      <SelectItem value="sj">Svalbard and Jan Mayen</SelectItem>
                      <SelectItem value="sz">Eswatini</SelectItem>
                      <SelectItem value="se">Sweden</SelectItem>
                      <SelectItem value="ch">Switzerland</SelectItem>
                      <SelectItem value="sy">Syria</SelectItem>
                      <SelectItem value="tw">Taiwan</SelectItem>
                      <SelectItem value="tj">Tajikistan</SelectItem>
                      <SelectItem value="tz">Tanzania</SelectItem>
                      <SelectItem value="th">Thailand</SelectItem>
                      <SelectItem value="tl">Timor-Leste</SelectItem>
                      <SelectItem value="tg">Togo</SelectItem>
                      <SelectItem value="tk">Tokelau</SelectItem>
                      <SelectItem value="to">Tonga</SelectItem>
                      <SelectItem value="tt">Trinidad and Tobago</SelectItem>
                      <SelectItem value="tn">Tunisia</SelectItem>
                      <SelectItem value="tr">Turkey</SelectItem>
                      <SelectItem value="tm">Turkmenistan</SelectItem>
                      <SelectItem value="tc">Turks and Caicos Islands</SelectItem>
                      <SelectItem value="tv">Tuvalu</SelectItem>
                      <SelectItem value="ug">Uganda</SelectItem>
                      <SelectItem value="ua">Ukraine</SelectItem>
                      <SelectItem value="ae">United Arab Emirates</SelectItem>
                      <SelectItem value="gb">United Kingdom</SelectItem>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="um">United States Minor Outlying Islands</SelectItem>
                      <SelectItem value="uy">Uruguay</SelectItem>
                      <SelectItem value="uz">Uzbekistan</SelectItem>
                      <SelectItem value="vu">Vanuatu</SelectItem>
                      <SelectItem value="ve">Venezuela</SelectItem>
                      <SelectItem value="vn">Vietnam</SelectItem>
                      <SelectItem value="vg">Virgin Islands, British</SelectItem>
                      <SelectItem value="vi">Virgin Islands, U.S.</SelectItem>
                      <SelectItem value="wf">Wallis and Futuna</SelectItem>
                      <SelectItem value="eh">Western Sahara</SelectItem>
                      <SelectItem value="ye">Yemen</SelectItem>
                      <SelectItem value="zm">Zambia</SelectItem>
                      <SelectItem value="zw">Zimbabwe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* State/Province */}
                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center">
                      State/Province <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="state" 
                      placeholder="CA" 
                      required
                    />
                  </div>
                  
                  {/* City */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center">
                      City <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="city" 
                      placeholder="San Francisco" 
                      required
                    />
                  </div>
                  
                  {/* Postal Code */}
                  <div className="space-y-2">
                    <Label htmlFor="postal-code" className="flex items-center">
                      Postal Code <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input 
                      id="postal-code" 
                      placeholder="94103" 
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Regional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="America/Los_Angeles">
                    <SelectTrigger id="timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="h-[300px]">
                      <SelectItem value="Pacific/Midway">(UTC-11:00) Midway Island, Samoa</SelectItem>
                      <SelectItem value="Pacific/Honolulu">(UTC-10:00) Hawaii</SelectItem>
                      <SelectItem value="America/Anchorage">(UTC-09:00) Alaska</SelectItem>
                      <SelectItem value="America/Los_Angeles">(UTC-08:00) Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Tijuana">(UTC-08:00) Tijuana, Baja California</SelectItem>
                      <SelectItem value="America/Denver">(UTC-07:00) Mountain Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Phoenix">(UTC-07:00) Arizona</SelectItem>
                      <SelectItem value="America/Chihuahua">(UTC-07:00) Chihuahua, La Paz, Mazatlan</SelectItem>
                      <SelectItem value="America/Chicago">(UTC-06:00) Central Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Mexico_City">(UTC-06:00) Mexico City</SelectItem>
                      <SelectItem value="America/Monterrey">(UTC-06:00) Monterrey</SelectItem>
                      <SelectItem value="America/Regina">(UTC-06:00) Saskatchewan</SelectItem>
                      <SelectItem value="America/Bogota">(UTC-05:00) Bogota, Lima, Quito, Rio Branco</SelectItem>
                      <SelectItem value="America/New_York">(UTC-05:00) Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Indiana/Indianapolis">(UTC-05:00) Indiana (East)</SelectItem>
                      <SelectItem value="America/Caracas">(UTC-04:30) Caracas</SelectItem>
                      <SelectItem value="America/Halifax">(UTC-04:00) Atlantic Time (Canada)</SelectItem>
                      <SelectItem value="America/Manaus">(UTC-04:00) Manaus</SelectItem>
                      <SelectItem value="America/Santiago">(UTC-04:00) Santiago</SelectItem>
                      <SelectItem value="America/La_Paz">(UTC-04:00) La Paz</SelectItem>
                      <SelectItem value="America/St_Johns">(UTC-03:30) Newfoundland</SelectItem>
                      <SelectItem value="America/Argentina/Buenos_Aires">(UTC-03:00) Buenos Aires</SelectItem>
                      <SelectItem value="America/Sao_Paulo">(UTC-03:00) Brasilia</SelectItem>
                      <SelectItem value="America/Godthab">(UTC-03:00) Greenland</SelectItem>
                      <SelectItem value="America/Montevideo">(UTC-03:00) Montevideo</SelectItem>
                      <SelectItem value="Atlantic/South_Georgia">(UTC-02:00) Mid-Atlantic</SelectItem>
                      <SelectItem value="Atlantic/Azores">(UTC-01:00) Azores</SelectItem>
                      <SelectItem value="Atlantic/Cape_Verde">(UTC-01:00) Cape Verde Is.</SelectItem>
                      <SelectItem value="Europe/Dublin">(UTC+00:00) Dublin, Edinburgh, Lisbon, London</SelectItem>
                      <SelectItem value="Africa/Casablanca">(UTC+00:00) Casablanca</SelectItem>
                      <SelectItem value="Africa/Monrovia">(UTC+00:00) Monrovia, Reykjavik</SelectItem>
                      <SelectItem value="Etc/UTC">(UTC+00:00) UTC</SelectItem>
                      <SelectItem value="Europe/Amsterdam">(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna</SelectItem>
                      <SelectItem value="Europe/Belgrade">(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague</SelectItem>
                      <SelectItem value="Europe/Brussels">(UTC+01:00) Brussels, Copenhagen, Madrid, Paris</SelectItem>
                      <SelectItem value="Europe/Warsaw">(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb</SelectItem>
                      <SelectItem value="Africa/Lagos">(UTC+01:00) West Central Africa</SelectItem>
                      <SelectItem value="Asia/Amman">(UTC+02:00) Amman</SelectItem>
                      <SelectItem value="Europe/Athens">(UTC+02:00) Athens, Bucharest, Istanbul</SelectItem>
                      <SelectItem value="Asia/Beirut">(UTC+02:00) Beirut</SelectItem>
                      <SelectItem value="Africa/Cairo">(UTC+02:00) Cairo</SelectItem>
                      <SelectItem value="Africa/Harare">(UTC+02:00) Harare, Pretoria</SelectItem>
                      <SelectItem value="Europe/Helsinki">(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius</SelectItem>
                      <SelectItem value="Asia/Jerusalem">(UTC+02:00) Jerusalem</SelectItem>
                      <SelectItem value="Europe/Minsk">(UTC+03:00) Minsk</SelectItem>
                      <SelectItem value="Asia/Baghdad">(UTC+03:00) Baghdad</SelectItem>
                      <SelectItem value="Asia/Kuwait">(UTC+03:00) Kuwait, Riyadh</SelectItem>
                      <SelectItem value="Europe/Moscow">(UTC+03:00) Moscow, St. Petersburg, Volgograd</SelectItem>
                      <SelectItem value="Africa/Nairobi">(UTC+03:00) Nairobi</SelectItem>
                      <SelectItem value="Asia/Tehran">(UTC+03:30) Tehran</SelectItem>
                      <SelectItem value="Asia/Dubai">(UTC+04:00) Abu Dhabi, Muscat</SelectItem>
                      <SelectItem value="Asia/Baku">(UTC+04:00) Baku</SelectItem>
                      <SelectItem value="Asia/Tbilisi">(UTC+04:00) Tbilisi</SelectItem>
                      <SelectItem value="Asia/Yerevan">(UTC+04:00) Yerevan</SelectItem>
                      <SelectItem value="Asia/Kabul">(UTC+04:30) Kabul</SelectItem>
                      <SelectItem value="Asia/Karachi">(UTC+05:00) Islamabad, Karachi</SelectItem>
                      <SelectItem value="Asia/Tashkent">(UTC+05:00) Tashkent</SelectItem>
                      <SelectItem value="Asia/Kolkata">(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi</SelectItem>
                      <SelectItem value="Asia/Colombo">(UTC+05:30) Sri Jayawardenepura</SelectItem>
                      <SelectItem value="Asia/Kathmandu">(UTC+05:45) Kathmandu</SelectItem>
                      <SelectItem value="Asia/Almaty">(UTC+06:00) Almaty, Novosibirsk</SelectItem>
                      <SelectItem value="Asia/Dhaka">(UTC+06:00) Astana, Dhaka</SelectItem>
                      <SelectItem value="Asia/Rangoon">(UTC+06:30) Yangon (Rangoon)</SelectItem>
                      <SelectItem value="Asia/Bangkok">(UTC+07:00) Bangkok, Hanoi, Jakarta</SelectItem>
                      <SelectItem value="Asia/Krasnoyarsk">(UTC+07:00) Krasnoyarsk</SelectItem>
                      <SelectItem value="Asia/Hong_Kong">(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi</SelectItem>
                      <SelectItem value="Asia/Kuala_Lumpur">(UTC+08:00) Kuala Lumpur, Singapore</SelectItem>
                      <SelectItem value="Asia/Irkutsk">(UTC+08:00) Irkutsk, Ulaan Bataar</SelectItem>
                      <SelectItem value="Australia/Perth">(UTC+08:00) Perth</SelectItem>
                      <SelectItem value="Asia/Taipei">(UTC+08:00) Taipei</SelectItem>
                      <SelectItem value="Asia/Tokyo">(UTC+09:00) Osaka, Sapporo, Tokyo</SelectItem>
                      <SelectItem value="Asia/Seoul">(UTC+09:00) Seoul</SelectItem>
                      <SelectItem value="Asia/Yakutsk">(UTC+09:00) Yakutsk</SelectItem>
                      <SelectItem value="Australia/Adelaide">(UTC+09:30) Adelaide</SelectItem>
                      <SelectItem value="Australia/Darwin">(UTC+09:30) Darwin</SelectItem>
                      <SelectItem value="Australia/Brisbane">(UTC+10:00) Brisbane</SelectItem>
                      <SelectItem value="Australia/Canberra">(UTC+10:00) Canberra, Melbourne, Sydney</SelectItem>
                      <SelectItem value="Australia/Hobart">(UTC+10:00) Hobart</SelectItem>
                      <SelectItem value="Pacific/Guam">(UTC+10:00) Guam, Port Moresby</SelectItem>
                      <SelectItem value="Asia/Vladivostok">(UTC+10:00) Vladivostok</SelectItem>
                      <SelectItem value="Asia/Magadan">(UTC+11:00) Magadan, Solomon Is., New Caledonia</SelectItem>
                      <SelectItem value="Pacific/Auckland">(UTC+12:00) Auckland, Wellington</SelectItem>
                      <SelectItem value="Pacific/Fiji">(UTC+12:00) Fiji, Kamchatka, Marshall Is.</SelectItem>
                      <SelectItem value="Pacific/Tongatapu">(UTC+13:00) Nuku'alofa</SelectItem>
                      <SelectItem value="Pacific/Kiritimati">(UTC+14:00) Kiritimati</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select defaultValue="mm-dd-yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
              <div className="flex flex-col md:flex-row gap-4 items-center border rounded-lg p-3 bg-gray-50 w-full md:w-auto">
                <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <Building className="h-8 w-8 text-gray-300" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="logo-upload" className="text-sm font-medium">Company Logo</Label>
                  <p className="text-xs text-gray-500">Max size: 2MB</p>
                  <Button 
                    variant="outline" 
                    className="w-full md:w-auto text-sm h-8 mt-1"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    Upload Logo
                  </Button>
                  <Input 
                    type="file" 
                    id="logo-upload" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/svg+xml" 
                    onChange={handleLogoUpload}
                  />
                </div>
              </div>
              
              {/* System Logo */}
              <div className="flex flex-col md:flex-row gap-4 items-center border rounded-lg p-3 bg-gray-50 w-full md:w-auto mt-4">
                <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border flex items-center justify-center overflow-hidden">
                  <div className="text-center">
                    <LayoutDashboard className="h-8 w-8 text-gray-300" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <Label htmlFor="system-logo-upload" className="text-sm font-medium">System Logo</Label>
                  <p className="text-xs text-gray-500">Max size: 2MB. This logo appears in the dashboard.</p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full md:w-auto text-sm h-8 mt-1"
                      size="sm"
                      onClick={() => document.getElementById('system-logo-upload')?.click()}
                      disabled={isUploadingSystemLogo}
                    >
                      {isUploadingSystemLogo ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Uploading...
                        </>
                      ) : (
                        "Upload Logo"
                      )}
                    </Button>
                  </div>
                  <Input 
                    type="file" 
                    id="system-logo-upload" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/svg+xml" 
                    onChange={handleSystemLogoUpload}
                  />
                </div>
              </div>
              
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveGeneralSettings}
                disabled={isGeneralSaving}
              >
                {isGeneralSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-neutral-500">Receive updates via email</p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="meeting-reminders" className="text-base">Meeting Reminders</Label>
                  <p className="text-sm text-neutral-500">Get reminders before scheduled meetings</p>
                </div>
                <Switch id="meeting-reminders" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="objective-updates" className="text-base">Objective Updates</Label>
                  <p className="text-sm text-neutral-500">Be notified when objectives are updated</p>
                </div>
                <Switch id="objective-updates" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest" className="text-base">Weekly Digest</Label>
                  <p className="text-sm text-neutral-500">Receive a weekly summary of progress</p>
                </div>
                <Switch id="weekly-digest" />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveNotificationSettings}
                disabled={isNotificationSaving}
              >
                {isNotificationSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor" className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-neutral-500">Add an extra layer of security</p>
                </div>
                <Switch id="two-factor" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="session-timeout" className="text-base">Session Timeout</Label>
                  <p className="text-sm text-neutral-500">How long until inactive users are logged out</p>
                </div>
                <Select defaultValue="60">
                  <SelectTrigger id="session-timeout" className="w-40">
                    <SelectValue placeholder="Select timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveSecuritySettings}
                disabled={isSecuritySaving}
              >
                {isSecuritySaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Security Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* LDAP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                LDAP Configuration
              </CardTitle>
              <CardDescription>
                Configure LDAP integration for user authentication and directory services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ldap-enabled" className="text-base">Enable LDAP Authentication</Label>
                  <p className="text-sm text-neutral-500">Use your organization's directory for user authentication</p>
                </div>
                <Switch id="ldap-enabled" />
              </div>
              
              <div className="space-y-4 border rounded-md p-4 bg-neutral-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ldap-host">LDAP Server Host</Label>
                    <Input id="ldap-host" placeholder="ldap.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ldap-port">LDAP Server Port</Label>
                    <Input id="ldap-port" placeholder="389" type="number" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ldap-base-dn">Base DN</Label>
                  <Input id="ldap-base-dn" placeholder="dc=example,dc=com" />
                  <p className="text-xs text-neutral-500">The distinguished name where directory searches will start</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ldap-bind-dn">Bind DN</Label>
                    <Input id="ldap-bind-dn" placeholder="cn=admin,dc=example,dc=com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ldap-bind-password">Bind Password</Label>
                    <Input id="ldap-bind-password" type="password" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ldap-user-search-filter">User Search Filter</Label>
                  <Input id="ldap-user-search-filter" placeholder="(uid=%s)" />
                  <p className="text-xs text-neutral-500">Filter to locate user entries, %s will be replaced with the username</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ldap-group-search-base">Group Search Base</Label>
                  <Input id="ldap-group-search-base" placeholder="ou=groups,dc=example,dc=com" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ldap-mapping" className="text-base">Attribute Mapping</Label>
                  <p className="text-sm text-neutral-500 mb-2">Map LDAP attributes to user properties</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Username:</span>
                      <Input placeholder="uid" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Full Name:</span>
                      <Input placeholder="cn" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Email:</span>
                      <Input placeholder="mail" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Department:</span>
                      <Input placeholder="departmentNumber" className="h-8" />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center mt-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={handleLdapTestConnection}
                  >
                    <Server className="h-4 w-4" />
                    Test Connection
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Connection details are encrypted
                </span>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveLdapConfig}
                disabled={isLdapSaving}
              >
                {isLdapSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save LDAP Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Single Sign-On Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Single Sign-On (SSO)
              </CardTitle>
              <CardDescription>
                Configure Single Sign-On integration to simplify authentication for your users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sso-enabled" className="text-base">Enable SSO Authentication</Label>
                  <p className="text-sm text-neutral-500">Allow users to sign in using your organization's identity provider</p>
                </div>
                <Switch id="sso-enabled" />
              </div>
              
              <div className="space-y-4 border rounded-md p-4 bg-neutral-50">
                <div className="space-y-2">
                  <Label htmlFor="sso-provider" className="text-base">Identity Provider</Label>
                  <Select defaultValue="saml">
                    <SelectTrigger id="sso-provider" className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saml">SAML 2.0</SelectItem>
                      <SelectItem value="oidc">OpenID Connect</SelectItem>
                      <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">Select the protocol used by your identity provider</p>
                </div>
                
                <div className="grid grid-cols-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sso-metadata-url">Metadata URL</Label>
                    <Input id="sso-metadata-url" placeholder="https://idp.example.com/metadata.xml" />
                    <p className="text-xs text-neutral-500">URL to your identity provider's metadata document</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sso-entity-id">Entity ID / Client ID</Label>
                    <Input id="sso-entity-id" placeholder="https://okr.yourcompany.com" />
                    <p className="text-xs text-neutral-500">The identifier for this application with your identity provider</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sso-acs-url">Assertion Consumer Service URL (ACS URL)</Label>
                    <Input id="sso-acs-url" placeholder="https://okr.yourcompany.com/api/auth/sso/callback" />
                    <p className="text-xs text-neutral-500">The URL where your identity provider will send the authentication response</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-base">Attribute Mapping</Label>
                  <p className="text-sm text-neutral-500 mb-2">Map identity provider attributes to user properties</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Email:</span>
                      <Input placeholder="email" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Username:</span>
                      <Input placeholder="name" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Full Name:</span>
                      <Input placeholder="displayName" className="h-8" />
                    </div>
                    <div className="flex items-center space-x-2 border rounded p-2">
                      <span className="text-sm font-medium w-24">Groups:</span>
                      <Input placeholder="groups" className="h-8" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sso-certificate" className="text-base">Identity Provider Certificate</Label>
                  <Textarea 
                    id="sso-certificate" 
                    placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCAowCCQDsw9...&#10;-----END CERTIFICATE-----" 
                    className="font-mono text-xs h-24"
                  />
                  <p className="text-xs text-neutral-500">Public certificate from your identity provider to verify responses</p>
                </div>
                
                <div className="flex justify-between items-center gap-2 mt-4">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={handleSsoTestConnection}
                    >
                      <Server className="h-4 w-4" />
                      Test Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={handleDownloadSsoMetadata}
                    >
                      <Download className="h-4 w-4" />
                      Download Metadata
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={handleViewSsoInstructions}
                  >
                    <Eye className="h-4 w-4" />
                    View Setup Instructions
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sso-default-role" className="text-base">Default Role for New SSO Users</Label>
                <Select defaultValue="member">
                  <SelectTrigger id="sso-default-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Team Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-neutral-500">Role assigned to users when they first sign in via SSO</p>
              </div>
              
              <div className="flex items-center space-x-3 rounded-md border p-4">
                <Switch id="sso-just-in-time" defaultChecked />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="sso-just-in-time" className="text-base">
                    Just-in-time User Provisioning
                  </Label>
                  <p className="text-sm text-neutral-500">
                    Automatically create user accounts when they first sign in through SSO
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-neutral-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  SSO configuration is encrypted
                </span>
              </div>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveSsoConfig}
                disabled={isSsoSaving}
              >
                {isSsoSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save SSO Configuration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Users Settings */}
        <TabsContent value="users" className="space-y-6 pt-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Configure user roles and manage team members
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                    <DialogDescription>
                      Create a new user role with specific permissions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-name">Role Name</Label>
                      <Input
                        id="role-name"
                        placeholder="Enter role name"
                        className="col-span-3"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-description">Description (Optional)</Label>
                      <Textarea
                        id="role-description"
                        placeholder="Brief description of this role"
                        className="col-span-3"
                      />
                    </div>
                    <div className="space-y-4 mt-2">
                      <h4 className="font-medium">Permissions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="view-okrs">View OKRs</Label>
                          <Switch id="view-okrs" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="edit-okrs">Edit OKRs</Label>
                          <Switch id="edit-okrs" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="manage-users">Manage Users</Label>
                          <Switch id="manage-users" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="manage-teams">Manage Teams</Label>
                          <Switch id="manage-teams" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="admin-access">Admin Access</Label>
                          <Switch id="admin-access" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    View Users
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader>
                    <DialogTitle>All Users</DialogTitle>
                    <DialogDescription>
                      View and manage users in your organization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Last Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { name: "Alex Morgan", role: "Admin", team: "Executive", lastActive: "Today" },
                          { name: "Sarah Chen", role: "Manager", team: "Marketing", lastActive: "1 day ago" },
                          { name: "John Davis", role: "Manager", team: "Product", lastActive: "2 hours ago" },
                          { name: "Michael Brown", role: "Employee", team: "Sales", lastActive: "3 days ago" },
                          { name: "Emma Wilson", role: "Employee", team: "Product", lastActive: "Just now" }
                        ].map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.role}</TableCell>
                            <TableCell>{user.team}</TableCell>
                            <TableCell>{user.lastActive}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="cursor-pointer">
                                    Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    Change Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer">
                                    Reset Password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer text-red-600">
                                    Deactivate
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button variant="outline">Export Users</Button>
                    <Button>Invite New User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>User Roles and Permissions</CardTitle>
              <CardDescription>
                Configure user roles and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>View OKRs</TableHead>
                    <TableHead>Edit OKRs</TableHead>
                    <TableHead>Manage Users</TableHead>
                    <TableHead>Manage Teams</TableHead>
                    <TableHead>Admin Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Admin</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-red-600">
                            <Trash className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Team Lead</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Limited</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-red-600">
                            <Trash className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Member</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">Limited</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-red-600">
                            <Trash className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Viewer</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700">Yes</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">No</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 text-red-600">
                            <Trash className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSavePermissionSettings}
                disabled={isPermissionSaving}
              >
                {isPermissionSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Permission Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Customize notification emails sent to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-email">Welcome Email</Label>
                <div className="border rounded-md p-4 bg-neutral-50">
                  <div className="flex items-center mb-2">
                    <Mail className="h-5 w-5 text-neutral-500 mr-2" />
                    <h4 className="font-medium">Welcome to the OKR System</h4>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    Hello {'{user}'},
                  </p>
                  <p className="text-sm text-neutral-600 mb-2">
                    Welcome to the OKR System! We're excited to have you on board. Here are your account details:
                  </p>
                  <ul className="list-disc list-inside text-sm text-neutral-600 mb-2">
                    <li>Username: {'{username}'}</li>
                    <li>Temporary Password: {'{password}'}</li>
                  </ul>
                  <p className="text-sm text-neutral-600">
                    Please log in and change your password at your earliest convenience. If you have any questions, don't hesitate to reach out.
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder-email">Meeting Reminder</Label>
                <div className="border rounded-md p-4 bg-neutral-50">
                  <div className="flex items-center mb-2">
                    <Mail className="h-5 w-5 text-neutral-500 mr-2" />
                    <h4 className="font-medium">Upcoming Meeting Reminder</h4>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Reminder content preview...
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveEmailTemplates}
                disabled={isEmailTemplateSaving}
              >
                {isEmailTemplateSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Email Templates
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Teams Settings */}
        <TabsContent value="teams" className="pt-4 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
              <p className="text-muted-foreground">
                Manage your organization's teams and their members
              </p>
            </div>
            <Dialog open={teamFormOpen} onOpenChange={setTeamFormOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" onClick={() => setTeamFormOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Team</DialogTitle>
                  <DialogDescription>
                    Add a new team to your organization.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...teamForm}>
                  <form onSubmit={teamForm.handleSubmit(handleCreateTeam)} className="space-y-4">
                    <FormField
                      control={teamForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter team name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Brief description of the team's purpose and responsibilities" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={teamForm.control}
                      name="leaderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Lead</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value ? String(field.value) : undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team lead" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Alex Morgan</SelectItem>
                              <SelectItem value="2">Sarah Chen</SelectItem>
                              <SelectItem value="3">John Davis</SelectItem>
                              <SelectItem value="4">Michael Brown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="pt-4">
                      <Button variant="outline" type="button" onClick={() => setTeamFormOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreatingTeam}>
                        {isCreatingTeam ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            Creating...
                          </>
                        ) : (
                          'Create Team'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>All Teams</CardTitle>
              <CardDescription>
                View and manage all teams in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Marketing Team</TableCell>
                    <TableCell>Oversees marketing strategy and execution</TableCell>
                    <TableCell>8 members</TableCell>
                    <TableCell>Alex Morgan</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                          92%
                        </div>
                        <Progress value={92} className="h-2 w-12" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" /> Marketing Team
                            </DialogTitle>
                            <DialogDescription>
                              Team details and member management
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue="members">
                            <TabsList className="mb-4">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="members">Members</TabsTrigger>
                              <TabsTrigger value="objectives">Objectives</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Name</Label>
                                  <div className="font-medium">Marketing Team</div>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Lead</Label>
                                  <div className="font-medium">Alex Morgan</div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm text-muted-foreground">Description</Label>
                                <div className="text-sm">
                                  Oversees marketing strategy and execution for all company products and services. Responsible for branding, content marketing, social media presence, and customer acquisition campaigns.
                                </div>
                              </div>
                              
                              <div className="border rounded-md p-4">
                                <Label className="text-sm text-muted-foreground mb-2 block">Performance</Label>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-xl font-semibold">92%</div>
                                  <Badge variant="outline" className="bg-green-50 text-green-700">Above Target</Badge>
                                </div>
                                <Progress value={92} className="h-2 mb-2" />
                                <p className="text-xs text-muted-foreground">Based on OKR completion rate in current cycle</p>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="members" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Members (8)</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Member
                                </Button>
                              </div>
                              
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>OKRs</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow className="bg-amber-50">
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/alex-morgan.jpg" alt="Alex Morgan" />
                                            <AvatarFallback>AM</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">Alex Morgan</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">Team Lead</Badge>
                                      </TableCell>
                                      <TableCell>alex.morgan@company.com</TableCell>
                                      <TableCell>3 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                    
                                    <TableRow>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/john-smith.jpg" alt="John Smith" />
                                            <AvatarFallback>JS</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">John Smith</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">Member</Badge>
                                      </TableCell>
                                      <TableCell>john.smith@company.com</TableCell>
                                      <TableCell>2 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                    
                                    <TableRow>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/sarah-chen.jpg" alt="Sarah Chen" />
                                            <AvatarFallback>SC</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">Sarah Chen</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">Member</Badge>
                                      </TableCell>
                                      <TableCell>sarah.chen@company.com</TableCell>
                                      <TableCell>1 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="objectives" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Objectives</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Objective
                                </Button>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="border rounded-md p-4 hover:border-neutral-300 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">Increase social media engagement by 40%</h4>
                                      <p className="text-sm text-muted-foreground">Q2 2025</p>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                      In Progress
                                    </Badge>
                                  </div>
                                  <Progress value={65} className="h-2 my-4" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">65% complete</span>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="border rounded-md p-4 hover:border-neutral-300 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">Launch 2 new marketing campaigns for Q2</h4>
                                      <p className="text-sm text-muted-foreground">Q2 2025</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">
                                      Completed
                                    </Badge>
                                  </div>
                                  <Progress value={100} className="h-2 my-4" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">100% complete</span>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                          
                          <DialogFooter>
                            <Button variant="outline">
                              Close
                            </Button>
                            <Button>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Product Team</TableCell>
                    <TableCell>Manages product development and roadmap</TableCell>
                    <TableCell>12 members</TableCell>
                    <TableCell>Emily Johnson</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded">
                          78%
                        </div>
                        <Progress value={78} className="h-2 w-12" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" /> Product Team
                            </DialogTitle>
                            <DialogDescription>
                              Team details and member management
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue="members">
                            <TabsList className="mb-4">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="members">Members</TabsTrigger>
                              <TabsTrigger value="objectives">Objectives</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Name</Label>
                                  <div className="font-medium">Product Team</div>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Lead</Label>
                                  <div className="font-medium">Emily Johnson</div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm text-muted-foreground">Description</Label>
                                <div className="text-sm">
                                  Manages product development and roadmap planning. Responsible for feature prioritization, user research, and working with development to deliver high-quality products.
                                </div>
                              </div>
                              
                              <div className="border rounded-md p-4">
                                <Label className="text-sm text-muted-foreground mb-2 block">Performance</Label>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-xl font-semibold">78%</div>
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700">On Target</Badge>
                                </div>
                                <Progress value={78} className="h-2 mb-2" />
                                <p className="text-xs text-muted-foreground">Based on OKR completion rate in current cycle</p>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="members" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Members (12)</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Member
                                </Button>
                              </div>
                              
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>OKRs</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow className="bg-amber-50">
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/emily-johnson.jpg" alt="Emily Johnson" />
                                            <AvatarFallback>EJ</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">Emily Johnson</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">Team Lead</Badge>
                                      </TableCell>
                                      <TableCell>emily.johnson@company.com</TableCell>
                                      <TableCell>4 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                    
                                    <TableRow>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/michael-davis.jpg" alt="Michael Davis" />
                                            <AvatarFallback>MD</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">Michael Davis</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline">Member</Badge>
                                      </TableCell>
                                      <TableCell>michael.davis@company.com</TableCell>
                                      <TableCell>2 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="objectives" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Objectives</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Objective
                                </Button>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="border rounded-md p-4 hover:border-neutral-300 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">Launch new product dashboard by Q3</h4>
                                      <p className="text-sm text-muted-foreground">Q2 2025</p>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                      In Progress
                                    </Badge>
                                  </div>
                                  <Progress value={45} className="h-2 my-4" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">45% complete</span>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                          
                          <DialogFooter>
                            <Button variant="outline">
                              Close
                            </Button>
                            <Button>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Sales Team</TableCell>
                    <TableCell>Drives revenue through direct sales</TableCell>
                    <TableCell>6 members</TableCell>
                    <TableCell>Robert Chang</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded">
                          62%
                        </div>
                        <Progress value={62} className="h-2 w-12" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-2">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Users className="h-5 w-5" /> Sales Team
                            </DialogTitle>
                            <DialogDescription>
                              Team details and member management
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Tabs defaultValue="members">
                            <TabsList className="mb-4">
                              <TabsTrigger value="overview">Overview</TabsTrigger>
                              <TabsTrigger value="members">Members</TabsTrigger>
                              <TabsTrigger value="objectives">Objectives</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Name</Label>
                                  <div className="font-medium">Sales Team</div>
                                </div>
                                <div>
                                  <Label className="text-sm text-muted-foreground">Team Lead</Label>
                                  <div className="font-medium">Robert Chang</div>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-sm text-muted-foreground">Description</Label>
                                <div className="text-sm">
                                  Drives revenue through direct sales and account management. Responsible for customer acquisition, relationship management, and meeting quarterly revenue targets.
                                </div>
                              </div>
                              
                              <div className="border rounded-md p-4">
                                <Label className="text-sm text-muted-foreground mb-2 block">Performance</Label>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="text-xl font-semibold">62%</div>
                                  <Badge variant="outline" className="bg-red-50 text-red-700">Below Target</Badge>
                                </div>
                                <Progress value={62} className="h-2 mb-2" />
                                <p className="text-xs text-muted-foreground">Based on OKR completion rate in current cycle</p>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="members" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Members (6)</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Member
                                </Button>
                              </div>
                              
                              <div className="border rounded-md">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Role</TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>OKRs</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow className="bg-amber-50">
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src="/avatars/robert-chang.jpg" alt="Robert Chang" />
                                            <AvatarFallback>RC</AvatarFallback>
                                          </Avatar>
                                          <div className="font-medium">Robert Chang</div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-800">Team Lead</Badge>
                                      </TableCell>
                                      <TableCell>robert.chang@company.com</TableCell>
                                      <TableCell>2 active</TableCell>
                                      <TableCell className="text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                              <span className="sr-only">Open menu</span>
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem className="cursor-pointer">
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer">
                                              Change Role
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer text-red-600">
                                              Remove from Team
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="objectives" className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium">Team Objectives</h3>
                                <Button size="sm" className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  Add Objective
                                </Button>
                              </div>
                              
                              <div className="space-y-4">
                                <div className="border rounded-md p-4 hover:border-neutral-300 transition-colors">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">Increase sales revenue by 30% in Q2</h4>
                                      <p className="text-sm text-muted-foreground">Q2 2025</p>
                                    </div>
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                                      In Progress
                                    </Badge>
                                  </div>
                                  <Progress value={62} className="h-2 my-4" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">62% complete</span>
                                    <Button variant="outline" size="sm">
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>
                          
                          <DialogFooter>
                            <Button variant="outline">
                              Close
                            </Button>
                            <Button>
                              Save Changes
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              Export Teams
            </Button>
            <div className="text-sm text-muted-foreground">
              3 teams • 26 members
            </div>
          </div>
        </TabsContent>
        
        {/* Objectives Settings */}
        <TabsContent value="objectives" className="space-y-6 pt-4">
          {/* OKR Default Settings */}
          <Card>
            <CardHeader>
              <CardTitle>OKR Default Settings</CardTitle>
              <CardDescription>
                Configure default settings for new OKRs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-cycle">Default OKR Cycle</Label>
                  <Select defaultValue="quarterly">
                    <SelectTrigger id="default-cycle">
                      <SelectValue placeholder="Select cycle period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannual">Bi-annual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-visibility">Default Visibility</Label>
                  <Select defaultValue="team">
                    <SelectTrigger id="default-visibility">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team Only</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="company">Company-wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default-key-results">Default Key Results Per Objective</Label>
                  <Select defaultValue="3">
                    <SelectTrigger id="default-key-results">
                      <SelectValue placeholder="Select number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto-reminders">Automatic Check-in Reminders</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger id="auto-reminders">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="progress-calculation">Progress Calculation Method</Label>
                  <Select defaultValue="average">
                    <SelectTrigger id="progress-calculation">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average of Key Results</SelectItem>
                      <SelectItem value="weighted">Weighted Average</SelectItem>
                      <SelectItem value="manual">Manual Entry</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">This determines how overall objective progress is calculated from key results</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="require-approval" className="text-base">Require Approval for OKRs</Label>
                  <p className="text-sm text-muted-foreground">New OKRs must be approved by managers</p>
                </div>
                <Switch id="require-approval" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-comments" className="text-base">Allow Comments on OKRs</Label>
                  <p className="text-sm text-muted-foreground">Team members can comment on objectives and key results</p>
                </div>
                <Switch id="allow-comments" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="alignable-objectives" className="text-base">Enable Objective Alignment</Label>
                  <p className="text-sm text-muted-foreground">Allow objectives to be aligned with other objectives</p>
                </div>
                <Switch id="alignable-objectives" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveDefaultSettings}
                disabled={isDefaultSettingsSaving}
              >
                {isDefaultSettingsSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Default Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Key Result Types */}
          <Card>
            <CardHeader>
              <CardTitle>Key Result Types</CardTitle>
              <CardDescription>
                Configure the types of key results available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Available Key Result Types</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Enabled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Numeric</TableCell>
                      <TableCell>Progress from X to Y (e.g., increase revenue from $1M to $1.5M)</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Percentage</TableCell>
                      <TableCell>Progress tracked as a percentage (e.g., increase satisfaction from 70% to 90%)</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Binary</TableCell>
                      <TableCell>Completion status only (e.g., launch new website)</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Milestone</TableCell>
                      <TableCell>Multiple steps with dates (e.g., complete project phases)</TableCell>
                      <TableCell><Switch defaultChecked /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-kr-type">Add Custom Key Result Type</Label>
                <div className="flex gap-2">
                  <Input id="custom-kr-type" placeholder="Enter name of custom type" />
                  <Button variant="outline">Add Type</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveKeyResultTypes}
                disabled={isKeyResultTypesSaving}
              >
                {isKeyResultTypesSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Key Result Types
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Approval Workflow */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Workflow</CardTitle>
              <CardDescription>
                Configure the OKR review and approval process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-approval" className="text-base">Enable OKR Approval Workflow</Label>
                  <p className="text-sm text-muted-foreground">Require formal approval for OKRs</p>
                </div>
                <Switch id="enable-approval" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="approver-role">Default Approver Role</Label>
                <Select defaultValue="manager">
                  <SelectTrigger id="approver-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Direct Manager</SelectItem>
                    <SelectItem value="team-lead">Team Lead</SelectItem>
                    <SelectItem value="dept-head">Department Head</SelectItem>
                    <SelectItem value="ceo">CEO/Executive</SelectItem>
                    <SelectItem value="custom">Custom Approver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="approval-stages">Approval Stages</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Approvers</TableHead>
                      <TableHead>Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Team Review</TableCell>
                      <TableCell>Team Members</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">Optional</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Manager Approval</TableCell>
                      <TableCell>Direct Manager</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Required</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Executive Review</TableCell>
                      <TableCell>Department Head</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Required</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-reminders-approval" className="text-base">Automatic Approval Reminders</Label>
                  <p className="text-sm text-muted-foreground">Send reminders for pending approvals</p>
                </div>
                <Switch id="auto-reminders-approval" defaultChecked />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder-frequency">Reminder Frequency</Label>
                <Select defaultValue="3days">
                  <SelectTrigger id="reminder-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="2days">Every 2 Days</SelectItem>
                    <SelectItem value="3days">Every 3 Days</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveApprovalSettings}
                disabled={isApprovalSettingsSaving}
              >
                {isApprovalSettingsSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Approval Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Cadences Settings */}
        <TabsContent value="cadences" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                OKR Cadences
              </CardTitle>
              <CardDescription>
                Configure the frequency and timing patterns for OKR check-ins and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Check-in Cadence */}
              <div>
                <h3 className="text-lg font-medium mb-4">Check-in Cadence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-checkin-frequency">Default Check-in Frequency</Label>
                      <Select defaultValue="weekly">
                        <SelectTrigger id="default-checkin-frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preferred-checkin-day">Preferred Check-in Day</Label>
                      <Select defaultValue="monday">
                        <SelectTrigger id="preferred-checkin-day">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="auto-reminders">Automatic Reminders</Label>
                      <Select defaultValue="1-day">
                        <SelectTrigger id="auto-reminders">
                          <SelectValue placeholder="Select reminder timing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="same-day">Same day (morning)</SelectItem>
                          <SelectItem value="1-day">1 day before</SelectItem>
                          <SelectItem value="2-days">2 days before</SelectItem>
                          <SelectItem value="3-days">3 days before</SelectItem>
                          <SelectItem value="none">No reminders</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="auto-escalation" className="text-base">Automatic Escalation</Label>
                        <p className="text-sm text-gray-500">Notify managers about missed check-ins</p>
                      </div>
                      <Switch id="auto-escalation" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t my-6"></div>
              
              {/* Review Cadence */}
              <div>
                <h3 className="text-lg font-medium mb-4">Review Cadence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-review-cadence">Team Review Frequency</Label>
                      <Select defaultValue="biweekly">
                        <SelectTrigger id="team-review-cadence">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company-review-cadence">Company-wide Review Frequency</Label>
                      <Select defaultValue="monthly">
                        <SelectTrigger id="company-review-cadence">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="auto-schedule-reviews" className="text-base">Auto-schedule Reviews</Label>
                        <p className="text-sm text-gray-500">Automatically create calendar events</p>
                      </div>
                      <Switch id="auto-schedule-reviews" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <div>
                        <Label htmlFor="include-stakeholders" className="text-base">Include Stakeholders</Label>
                        <p className="text-sm text-gray-500">Automatically include relevant stakeholders</p>
                      </div>
                      <Switch id="include-stakeholders" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="flex items-center gap-2"
                onClick={handleSaveCadenceSettings}
                disabled={isCadenceSettingsSaving}
              >
                {isCadenceSettingsSaving ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Cadence Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Cycles Settings */}
        <TabsContent value="cycles" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  OKR Cycles
                </CardTitle>
                <CardDescription>
                  Configure time periods for tracking objectives and key results
                </CardDescription>
              </div>
              <CycleCreateDialog />
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-neutral-600">
                  Cycles help you organize OKRs into specific time periods. Most companies use quarterly OKR cycles, 
                  but you can create monthly, yearly, or custom cycles as needed.
                </p>
              </div>
              <CyclesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Connect with other tools and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-md p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108c-1.3136-2.3365-3.8857-3.1816-6.0223-1.931-2.4523-1.9584-6.1182-.3718-7.6027 2.6692-2.5416-.4451-4.7559 1.7565-4.7599 4.3684l-.0003.0349c0 2.9077 2.3804 5.289 5.2877 5.289l-.0027.0002c.0481 0 .0961-.0016.1441-.0032 5.5264-.1313 10.7797-1.3682 14.9148-3.5031 1.1869-.6125 1.2928-2.306.2027-3.0647z" fill="#2684FF" />
                  <path d="M14.0923 8.4243c-.4574.0218-.743.0682-1.0989.1881-1.2692.43-1.8199 1.9439-1.2352 3.1632.2941.6127.8263 1.0781 1.4721 1.3165.7099.2625 1.5119.2892 2.3078.0764 1.4466-.3892 2.1954-1.979 1.6542-3.3894-.335-.875-1.1703-1.4401-2.1-1.4548z" fill="url(#slack-icon-gradient)" />
                  <defs>
                    <linearGradient id="slack-icon-gradient" x1="82.8361" y1="30.7012" x2="51.8462" y2="58.8581" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#156BB1" />
                      <stop offset="1" stopColor="#2684FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Slack</h3>
                <p className="text-sm text-neutral-500">Not connected</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={handleSlackConnect}
                disabled={isSlackConnecting}
              >
                {isSlackConnecting ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    Connecting...
                  </>
                ) : "Connect"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M0 12C0 5.373 5.373 0 12 0c4.127 0 7.786 2.036 10 5.166V0h2v12H12V9.977h7.935C18.27 6.082 15.474 3 12 3a9 9 0 0 0-9 9c0 4.962 4.037 9 9 9 3.298 0 6.193-1.777 7.749-4.432l2.257 1.305A12 12 0 0 1 12 24C5.373 24 0 18.627 0 12z" fill="#5865F2" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Google Calendar</h3>
                <p className="text-sm text-neutral-500">Not connected</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={handleGoogleCalendarConnect}
                disabled={isGoogleCalendarConnecting}
              >
                {isGoogleCalendarConnecting ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    Connecting...
                  </>
                ) : "Connect"}
              </Button>
            </div>
            
            <div className="border rounded-md p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-100 rounded-md flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M10.9042 2.1001C12.8639 2.1001 15.156 2.53351 16.5776 3.72255C19.5948 6.0085 19.5466 10.9648 19.5466 14.0023C19.5466 17.0398 19.5948 21.9961 16.5776 24.282C15.156 25.4711 12.8639 25.9045 10.9042 25.9045C8.93844 25.9045 6.63846 25.4711 5.217 24.282C2.19994 21.9961 2.24827 17.0398 2.24827 14.0023C2.24827 10.9648 2.19994 6.0085 5.217 3.72255C6.63846 2.53351 8.93844 2.1001 10.9042 2.1001Z" fill="#3074F0" />
                  <path d="M16.1924 7.65722C16.6151 7.65722 16.9663 8.00844 16.9663 8.43112C16.9663 8.8538 16.6151 9.20502 16.1924 9.20502C15.7697 9.20502 15.4185 8.8538 15.4185 8.43112C15.4185 8.00844 15.7697 7.65722 16.1924 7.65722Z" fill="white" />
                  <path d="M7.69781 12.3999C7.69781 10.6266 9.13088 9.19354 10.9042 9.19354C12.6775 9.19354 14.1105 10.6266 14.1105 12.3999C14.1105 14.1732 12.6775 15.6063 10.9042 15.6063C9.13088 15.6063 7.69781 14.1732 7.69781 12.3999Z" fill="white" />
                  <path d="M7.62506 19.2935C7.37236 19.2935 7.12545 19.1877 6.95096 18.9981C6.63387 18.6503 6.66127 18.1145 7.00906 17.7974C7.68618 17.1814 9.29666 16.2446 10.9041 16.2446C12.5115 16.2446 14.1219 17.1814 14.7991 17.7974C15.1469 18.1145 15.1743 18.6503 14.8572 18.9981C14.5401 19.3459 14.0043 19.3733 13.6565 19.0562C13.142 18.5853 11.8946 17.8184 10.9041 17.8184C9.9136 17.8184 8.66612 18.5853 8.15162 19.0562C7.99902 19.2137 7.81307 19.2935 7.62506 19.2935Z" fill="white" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium">Jira</h3>
                <p className="text-sm text-neutral-500">Not connected</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={handleJiraConnect}
                disabled={isJiraConnecting}
              >
                {isJiraConnecting ? (
                  <>
                    <span className="animate-spin mr-1">⟳</span>
                    Connecting...
                  </>
                ) : "Connect"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
