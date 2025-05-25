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

  // Show onboarding wizard with sleek, modern design
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-stretch gap-8 max-w-7xl">
        {/* Cover Design - Left Side */}
        <div className="hidden md:flex flex-col rounded-xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white md:w-5/12 p-10 shadow-xl">
          <div className="mb-auto">
            <h1 className="text-4xl font-bold mb-4">Get Started with OKR Master</h1>
            <div className="w-20 h-1.5 bg-white/60 rounded-full mb-6"></div>
            <p className="text-white/90 text-lg mb-12 leading-relaxed">
              The most intuitive platform for tracking objectives and key results that drive your business forward.
            </p>
          </div>
          
          <div className="space-y-10">
            <div className="flex items-start space-x-5">
              <div className="bg-white/20 p-3.5 rounded-lg shadow-inner">
                <Target className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Set Clear Objectives</h3>
                <p className="text-white/80">Define measurable goals that align with your organization's mission</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-5">
              <div className="bg-white/20 p-3.5 rounded-lg shadow-inner">
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Track Key Results</h3>
                <p className="text-white/80">Monitor progress with quantifiable metrics that drive success</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-5">
              <div className="bg-white/20 p-3.5 rounded-lg shadow-inner">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Real-time Analytics</h3>
                <p className="text-white/80">Get powerful insights with customizable dashboards and reports</p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-12">
            <div className="flex items-center space-x-3 bg-white/10 p-4 rounded-lg border border-white/20">
              <Rocket className="h-6 w-6 text-white" />
              <p className="font-medium">Let's set up your organization in just a few simple steps</p>
            </div>
          </div>
        </div>
        
        {/* Mobile header - visible only on smaller screens */}
        <div className="md:hidden bg-primary text-white p-6 rounded-xl mb-4 shadow-md">
          <h1 className="text-2xl font-bold mb-2">OKR Master Onboarding</h1>
          <p className="text-white/90">Let's set up your organization to get started</p>
        </div>
        
        {/* Onboarding Wizard - Right Side */}
        <div className="flex-1 bg-white rounded-xl shadow-md p-6 md:p-8">
          <TenantOnboardingWizard />
        </div>
      </div>
    </div>
  );
}