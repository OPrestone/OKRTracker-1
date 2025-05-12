import { useAuth } from "@/hooks/use-auth";
import { useTenantContext } from "@/hooks/use-tenant-context";
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
  const [location] = useLocation();
  const isOrgPath = path.includes(':organisation') || path.includes('/organization/');
  const isTenantRelatedPath = isOrgPath || (requireTenant && !path.includes('/tenant-onboarding'));

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

  // If tenant is required for this route but user has no tenants, redirect to onboarding
  if (isTenantRelatedPath && !hasTenantsAccess) {
    return (
      <Route path={path}>
        <Redirect to="/tenant-onboarding" />
      </Route>
    );
  }

  // If tenant is required but no tenant is selected, redirect to tenant selection
  if (isTenantRelatedPath && !currentTenant) {
    return (
      <Route path={path}>
        <Redirect to="/tenants" />
      </Route>
    );
  }

  // Render the protected component if user is authenticated
  return <Route path={path} component={Component} />;
}