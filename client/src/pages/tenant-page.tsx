import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, Settings, Users } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantSettings } from "@/components/tenant/tenant-settings";
import { TenantUsers } from "@/components/tenant/tenant-users";
import { TenantSubscription } from "@/components/tenant/tenant-subscription";

export default function TenantPage() {
  const { id } = useParams<{ id: string }>();
  const tenantId = parseInt(id);
  const { user } = useAuth();

  // Fetch the tenant
  const { data: tenant, isLoading: loadingTenant } = useQuery<any>({
    queryKey: ['/api/tenants', tenantId],
    enabled: !!tenantId && !!user,
  });

  // Fetch user's role in this tenant
  const { data: tenantUsers = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ['/api/tenants', tenantId, 'users'],
    enabled: !!tenantId && !!user?.id,
  });

  const currentUserRole = tenantUsers.find(tu => tu.id === user?.id)?.userRole;
  const isOwnerOrAdmin = 
    currentUserRole === "owner" || 
    currentUserRole === "admin" || 
    user?.role === "admin";

  const isLoading = loadingTenant || loadingUsers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
        <p className="text-muted-foreground">
          The organization you're looking for doesn't exist or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.displayName || tenant.name}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization settings, users, and subscription.
          </p>
        </div>

        <Tabs defaultValue="settings">
          <TabsList className="mb-8">
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            {isOwnerOrAdmin && (
              <TabsTrigger value="subscription">
                <Users className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="settings">
            <TenantSettings tenantId={tenantId} />
          </TabsContent>
          
          <TabsContent value="users">
            <TenantUsers tenantId={tenantId} />
          </TabsContent>
          
          {isOwnerOrAdmin && (
            <TabsContent value="subscription">
              <TenantSubscription tenantId={tenantId} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}