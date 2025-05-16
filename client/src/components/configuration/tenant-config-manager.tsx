import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Define schema for tenant config form
const configFormSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  valueType: z.enum(["string", "number", "boolean", "json"]),
  isSecret: z.boolean().default(false),
  description: z.string().optional(),
});

type ConfigFormValues = z.infer<typeof configFormSchema>;

export function TenantConfigManager() {
  const { toast } = useToast();
  const { currentTenant } = useTenantContext();
  const { user } = useAuth();
  const [showNewConfigDialog, setShowNewConfigDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Check if user is admin or owner
  const isAdmin = 
    currentTenant?.userRole === "admin" || 
    currentTenant?.userRole === "owner" ||
    user?.role === "admin";

  // Form for adding/editing configuration
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      key: "",
      value: "",
      valueType: "string",
      isSecret: false,
      description: "",
    },
  });
  
  // Get configurations for the current tenant
  const { data: configs = {}, isLoading } = useQuery({
    queryKey: ['/api/tenant-config', currentTenant?.id],
    enabled: !!currentTenant?.id,
  });
  
  // Mutation for adding a new configuration
  const addConfigMutation = useMutation({
    mutationFn: async (data: ConfigFormValues) => {
      return await apiRequest("POST", "/api/tenant-config", data);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Added",
        description: "The configuration setting has been added successfully.",
      });
      setShowNewConfigDialog(false);
      form.reset();
      // Invalidate the query to refresh the configurations
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-config', currentTenant?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Configuration",
        description: error.message || "Failed to add configuration setting.",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a configuration
  const deleteConfigMutation = useMutation({
    mutationFn: async (key: string) => {
      return await apiRequest("DELETE", `/api/tenant-config/${key}`);
    },
    onSuccess: () => {
      toast({
        title: "Configuration Deleted",
        description: "The configuration setting has been deleted successfully.",
      });
      // Invalidate the query to refresh the configurations
      queryClient.invalidateQueries({ queryKey: ['/api/tenant-config', currentTenant?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Configuration",
        description: error.message || "Failed to delete configuration setting.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ConfigFormValues) => {
    addConfigMutation.mutate(data);
  };
  
  // Handle configuration deletion
  const handleDeleteConfig = (key: string) => {
    if (confirm(`Are you sure you want to delete configuration '${key}'?`)) {
      deleteConfigMutation.mutate(key);
    }
  };
  
  // Toggle visibility of secret values
  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Format value based on type
  const formatValue = (value: any, type: string, isSecret: boolean, key: string) => {
    if (isSecret && !showSecrets[key]) {
      return "••••••••••••";
    }
    
    if (type === "json") {
      try {
        return JSON.stringify(typeof value === "string" ? JSON.parse(value) : value, null, 2);
      } catch (e) {
        return String(value);
      }
    }
    
    return String(value);
  };
  
  // Get badge color for type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "string": return "bg-blue-100 text-blue-800 border-blue-200";
      case "number": return "bg-green-100 text-green-800 border-green-200";
      case "boolean": return "bg-purple-100 text-purple-800 border-purple-200";
      case "json": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!currentTenant) {
    return (
      <div className="text-center py-8 text-gray-500">
        Please select a tenant to manage configurations.
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Organization Configuration Settings</CardTitle>
        {isAdmin && (
          <Dialog open={showNewConfigDialog} onOpenChange={setShowNewConfigDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Configuration Setting</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input placeholder="feature.enabled" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="valueType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select value type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value</FormLabel>
                        <FormControl>
                          {form.watch("valueType") === "boolean" ? (
                            <Select
                              onValueChange={(val) => field.onChange(val)}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select value" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            form.watch("valueType") === "json" ? (
                              <Textarea
                                placeholder='{"key": "value"}'
                                className="font-mono text-sm"
                                rows={5}
                                {...field}
                              />
                            ) : (
                              <Input
                                placeholder={form.watch("valueType") === "number" ? "123" : "Value"}
                                {...field}
                              />
                            )
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isSecret"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Sensitive Information</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Mark this setting as sensitive (will be masked in the UI)
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe what this configuration does..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addConfigMutation.isPending}
                    >
                      {addConfigMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save Configuration
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(configs).length === 0 ? (
          <div className="text-center py-8 text-gray-500 border rounded-md">
            No configuration settings found for this organization.
            {isAdmin && (
              <p className="mt-2">
                Click "Add Setting" to create your first configuration.
              </p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(configs).map(([key, config]: [string, any]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono">
                        {formatValue(config.value, config.type, config.isSecret, key)}
                      </code>
                      
                      {config.isSecret && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleSecretVisibility(key)}
                        >
                          {showSecrets[key] ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`${getTypeBadge(config.type)} font-normal`}
                    >
                      {config.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {config.description || "-"}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteConfig(key)}
                        disabled={deleteConfigMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}