import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { getRedirectPath } from "./redirect-service";

/**
 * AuthGuard prevents authenticated users from accessing a route 
 * like the auth page when they're already logged in
 */
export function AuthGuard({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Checking session status...</span>
        </div>
      </Route>
    );
  }

  // If user is authenticated, redirect to the saved path or home
  if (user) {
    const redirectPath = getRedirectPath("/");
    return (
      <Route path={path}>
        <Redirect to={redirectPath} />
      </Route>
    );
  }

  // If not authenticated, render the component (like the login page)
  return <Route path={path} component={Component} />;
}