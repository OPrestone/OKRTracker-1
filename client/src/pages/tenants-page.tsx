import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Building, 
  Loader2, 
  PlusCircle, 
  Settings, 
  Users,
  Sparkles, 
  ChevronRight 
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateTenantDialog from "@/components/tenant/create-tenant-dialog";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Tenant = {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  userRole: string;
  isDefault?: boolean;
  plan?: string;
  status?: string;
};

export default function TenantsPage() {
  const { user } = useAuth();
  const [showNewTenantDialog, setShowNewTenantDialog] = useState(false);
  const [_, navigate] = useLocation();

  // Fetch the tenants for the current user
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['/api/tenants'],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="container py-6 max-w-7xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
              <p className="text-muted-foreground mt-1">
                {user?.role === 'admin' 
                  ? "Create and manage organizations for your users."
                  : "View and access your organizations."}
              </p>
            </div>
            {user?.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowNewTenantDialog(true)}>
                    <Building className="h-4 w-4 mr-2" />
                    <span>Quick Create</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/tenant-onboarding")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span>Guided Setup</span>
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center bg-muted/40 rounded-lg py-12">
              <Building className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Organizations</h2>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                {user?.role === 'admin' 
                  ? "You haven't created any organizations yet. Create your first organization to get started."
                  : "You don't have access to any organizations yet. An administrator needs to give you access."}
              </p>
              {user?.role === 'admin' && (
                <div className="flex flex-col gap-3 items-center">
                  <Button 
                    onClick={() => navigate("/tenant-onboarding")}
                    className="bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Guided Setup (Recommended)
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewTenantDialog(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Quick Create
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant: Tenant) => (
                <Card key={tenant.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate">{tenant.displayName || tenant.name}</CardTitle>
                      {tenant.isDefault && (
                        <Badge variant="outline">Default</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span className="capitalize">{tenant.userRole} Access</span>
                      {tenant.plan && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span className="capitalize">{tenant.plan} Plan</span>
                        </>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <Link href={`/tenants/${tenant.id}/users`}>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2" />
                        Members
                      </Button>
                    </Link>
                    <Link href={`/tenants/${tenant.id}`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTenantDialog 
        open={showNewTenantDialog} 
        onOpenChange={setShowNewTenantDialog} 
      />
    </>
  );
}