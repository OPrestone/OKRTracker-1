import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

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

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is authenticated, redirect to home
  if (user) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // If not authenticated, render the component
  return <Route path={path} component={Component} />;
}