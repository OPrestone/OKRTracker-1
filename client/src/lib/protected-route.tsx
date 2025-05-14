import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useUserPermissions } from "@/hooks/use-user-permissions";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { saveRedirectPath } from "./redirect-service";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
  requireTenant = true,
}: {
  path: string;
  component: () => React.JSX.Element;
  requireTenant?: boolean;
}) {
  const { user, isLoading, hasTenantsAccess } = useAuth();
  const { currentTenant, isLoading: tenantLoading } = useTenantContext();
  const { isAdminOrOwner, isAdminOrOwnerOfTenant } = useUserPermissions();
  const [location] = useLocation();
  
  // Check if this is a direct organization URL path (like /:id([A-Z0-9]{26})/home)
  const isDirectOrgPath = path.includes(':id([A-Z0-9]{26})');
  const isOrgPath = path.includes(':organisation') || path.includes('/organization/');
  const isTenantRelatedPath = isOrgPath || isDirectOrgPath || (requireTenant && !path.includes('/tenant-onboarding'));

  // Save the current location as a redirect path when user is not authenticated
  useEffect(() => {
    if (!isLoading && !user && location.startsWith(path)) {
      saveRedirectPath(location);
    }
  }, [user, isLoading, location, path]);

  // Show loading indicator while checking authentication
  if (isLoading || tenantLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            {isLoading ? "Checking authentication..." : "Loading tenant information..."}
          </span>
        </div>
      </Route>
    );
  }

  // Redirect to login page if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  // For direct org URLs, use the current tenant's permissions
  // This will be enhanced in a future update to check specific tenant access rights
  if (isDirectOrgPath && location !== '/tenants' && currentTenant) {
    // Check if user has admin rights to the current tenant
    const hasAccess = isAdminOrOwner();
    
    if (!hasAccess) {
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-red-500">
              You don't have admin access to this organization.
            </p>
            <button
              onClick={() => window.location.href = '/tenants'}
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Return to Organizations
            </button>
          </div>
        </Route>
      );
    }
  }

  // If tenant is required for this route but user has no tenants, redirect to onboarding
  if (isTenantRelatedPath && !hasTenantsAccess) {
    return (
      <Route path={path}>
        <Redirect to="/tenant-onboarding" />
      </Route>
    );
  }

  // If tenant is required but no tenant is selected, check if we have a saved tenant ID before redirecting
  if (isTenantRelatedPath && !currentTenant) {
    // Check if we have a stored tenant ID in session storage
    const storedTenantId = sessionStorage.getItem('currentTenantId');
    
    if (storedTenantId) {
      // If we have a stored tenant ID but tenant context hasn't loaded it yet,
      // render loading state instead of redirecting to tenant selection
      return (
        <Route path={path}>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">
              Restoring tenant session...
            </span>
          </div>
        </Route>
      );
    } else {
      // If no stored tenant ID, then redirect to tenant selection
      return (
        <Route path={path}>
          <Redirect to="/tenants" />
        </Route>
      );
    }
  }

  // Render the protected component if user is authenticated
  return <Route path={path} component={Component} />;
}