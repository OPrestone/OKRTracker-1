import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import TenantOnboardingWizard from "@/components/tenant/tenant-onboarding-wizard";
import { Loader2, Target, BarChart3, Layers, Rocket } from "lucide-react";

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

    // Redirect to tenant-specific dashboard if user already has an organization set up
    if (user && tenants && tenants.length > 0 && !isLoadingTenants) {
      // User already has at least one tenant, redirect to tenant dashboard
      const tenantId = tenants[0].id; // Use the first tenant's ID
      navigate(`/${tenantId}/`);
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

  // Show onboarding wizard with beautiful cover design
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Cover Design - Left Side */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white w-full md:w-1/3 p-8 flex flex-col justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-6">Welcome to OKR Master</h1>
          <p className="text-white/90 mb-8">
            Set up your organization and start achieving your objectives with our powerful OKR management platform.
          </p>
        </div>
        
        <div className="space-y-8">
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Set Clear Objectives</h3>
              <p className="text-white/80 text-sm">Define measurable goals that align with your organization's mission</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Track Key Results</h3>
              <p className="text-white/80 text-sm">Monitor progress with quantifiable metrics that drive success</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="bg-white/20 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">Visualize Progress</h3>
              <p className="text-white/80 text-sm">Get insights with real-time dashboards and performance analytics</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-white/90" />
            <p className="text-sm font-medium">Let's get started with your organization setup</p>
          </div>
        </div>
      </div>
      
      {/* Onboarding Wizard - Right Side */}
      <div className="flex-1 p-4 md:p-0">
        <TenantOnboardingWizard />
      </div>
    </div>
  );
}