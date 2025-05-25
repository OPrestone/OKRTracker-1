import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import TenantOnboardingWizard from "@/components/tenant/tenant-onboarding-wizard";
import { 
  Loader2, 
  Target, 
  BarChart3, 
  Layers, 
  Rocket, 
  CheckCircle2, 
  ArrowRight, 
  Trophy,
  Users 
} from "lucide-react";

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

  // Show completely redesigned onboarding page
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto py-12 px-4 md:px-6 lg:px-8 max-w-screen-xl">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4">
              Welcome to Your OKR Journey
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
              Set up your organization and get ready to achieve your most ambitious goals with our powerful OKR platform.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Left Column - Feature Highlights */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Why Teams Love Our Platform</h2>
                  
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">Simple Goal Tracking</h3>
                        <p className="text-slate-600 text-sm">Set clear objectives and track progress with intuitive tools</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">Real-Time Analytics</h3>
                        <p className="text-slate-600 text-sm">Get instant insights into team performance and goal progress</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">Team Alignment</h3>
                        <p className="text-slate-600 text-sm">Keep everyone focused on the same strategic priorities</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium text-primary">3 default teams</span> created automatically
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              
              {/* Testimonial Card */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-2 mb-3 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-slate-800 font-medium mb-3">
                  "This OKR platform transformed how our teams collaborate. Setting up was simple and the results were immediate."
                </blockquote>
                <div className="text-slate-600 text-sm">
                  Sarah Chen, Product Director at Acme Inc.
                </div>
              </div>
            </div>
            
            {/* Right Column - Onboarding Form */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Organization Setup</h2>
                <p className="text-sm text-slate-600">Complete these steps to get started with your OKR journey</p>
              </div>
              
              <div className="p-6">
                <TenantOnboardingWizard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}