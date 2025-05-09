import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { TenantUsers } from "./tenant-users";

interface TenantSettingsProps {
  tenantId: number;
}

const updateTenantSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  displayName: z.string().min(3, "Display name must be at least 3 characters"),
});

type UpdateTenantFormValues = z.infer<typeof updateTenantSchema>;

export function TenantSettings({ tenantId }: TenantSettingsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the tenant
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['/api/tenants', tenantId],
    enabled: !!tenantId,
  });

  // Fetch user's role in this tenant
  const { data: tenantUsers = [] } = useQuery({
    queryKey: ['/api/tenants', tenantId, 'users'],
    enabled: !!tenantId && !!user?.id,
  });

  const currentUserRole = tenantUsers.find((tu: any) => tu.id === user?.id)?.userRole;
  const canEditTenant = 
    currentUserRole === "owner" || 
    currentUserRole === "admin" || 
    user?.role === "admin";

  const form = useForm<UpdateTenantFormValues>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: tenant?.name || "",
      displayName: tenant?.displayName || "",
    },
    values: {
      name: tenant?.name || "",
      displayName: tenant?.displayName || "",
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: UpdateTenantFormValues) => {
      const response = await apiRequest("PATCH", `/api/tenants/${tenantId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization updated",
        description: "Organization settings have been updated successfully.",
      });
      
      // Invalidate tenant queries
      queryClient.invalidateQueries({ queryKey: ['/api/tenants', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants/default'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update organization",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  async function onSubmit(data: UpdateTenantFormValues) {
    setIsSubmitting(true);
    updateTenantMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Update your organization settings.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="acme-inc" 
                        {...field} 
                        disabled={!canEditTenant}
                      />
                    </FormControl>
                    <FormDescription>
                      This is your organization's unique identifier.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Acme Inc." 
                        {...field} 
                        disabled={!canEditTenant}
                      />
                    </FormControl>
                    <FormDescription>
                      This is how your organization will be displayed throughout the application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            {canEditTenant && (
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !form.formState.isDirty}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {!isSubmitting && <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>

      <TenantUsers tenantId={tenantId} />
    </div>
  );
}