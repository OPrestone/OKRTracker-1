import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import TenantOnboardingWizard from "@/components/tenant/tenant-onboarding-wizard";
import { Loader2 } from "lucide-react";

export default function TenantOnboardingPage() {
  const { user, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  // Check if user has any tenants (organizations) already set up
  const { data: tenants, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    enabled: !!user,
  });

  // Redirect logic
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }

    // Redirect to dashboard if user already has an organization set up
    if (user && tenants && tenants.length > 0 && !isLoadingTenants) {
      // User already has at least one tenant, redirect to dashboard
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate, tenants, isLoadingTenants]);

  // Show loading state while checking authentication or tenant status
  if (isLoading || isLoadingTenants) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Will redirect to auth
  if (!user) {
    return null;
  }

  // Will redirect to dashboard if user has tenants
  if (tenants && tenants.length > 0) {
    return null;
  }

  // Show onboarding wizard only for authenticated users without any organizations
  return <TenantOnboardingWizard />;
}