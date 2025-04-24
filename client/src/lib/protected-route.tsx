import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { saveRedirectPath } from "./redirect-service";
import { useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Save the current location as a redirect path when user is not authenticated
  useEffect(() => {
    if (!isLoading && !user && location.startsWith(path)) {
      saveRedirectPath(location);
    }
  }, [user, isLoading, location, path]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Checking authentication...</span>
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

  // Render the protected component if user is authenticated
  return <Route path={path} component={Component} />;
}