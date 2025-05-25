import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import TenantOnboardingWizard from "@/components/tenant/tenant-onboarding-wizard";
import { 
  Loader2, 
  CheckCircle,
  BarChart4, 
  Users,
  Target,
  ArrowRight,
  LightbulbIcon,
  Sparkles,
  Award,
  ChevronRight
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

  // Show completely redesigned onboarding page with appealing cover
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Cover Design */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.15),transparent_70%)]"></div>
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillOpacity="0.1" fill="white" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        
        <div className="relative h-full flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Target className="h-7 w-7" />
              <span className="text-xl font-bold">OKR Master</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight mb-4">Create your organization in minutes</h1>
            <p className="text-white/80 text-lg mb-8">Join thousands of teams using our platform to achieve their most ambitious goals.</p>
          </div>
          
          <div className="space-y-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-medium">Simple setup process</h3>
              </div>
              <p className="text-white/70 pl-14">Get started in minutes with our streamlined onboarding</p>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-medium">Teams ready to go</h3>
              </div>
              <p className="text-white/70 pl-14">Default teams created automatically to jumpstart your journey</p>
            </div>
            
            <div>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4">
                  <BarChart4 className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-medium">Instant insights</h3>
              </div>
              <p className="text-white/70 pl-14">Beautiful dashboards to track progress and performance</p>
            </div>
          </div>
          
          <div className="mt-8 bg-white/10 rounded-lg p-6 border border-white/20">
            <div className="flex items-start">
              <div className="mr-4 mt-1">
                <Award className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <blockquote className="text-lg font-medium mb-2">
                  "This platform transformed how we track performance. We achieved 32% more goals in just one quarter."
                </blockquote>
                <div className="text-white/60 text-sm">
                  — Michael Chen, VP of Product at Innovate Inc.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header (Visible on small screens) */}
        <div className="md:hidden bg-primary text-white p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-6 w-6" />
            <span className="text-lg font-bold">OKR Master</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Create your organization</h1>
          <p className="text-white/80">Join thousands of teams achieving their goals</p>
        </div>
        
        {/* Signup Form */}
        <div className="flex-1 p-6 md:p-12 overflow-auto">
          <div className="max-w-xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get started with OKR Master</h2>
              <p className="text-gray-600">Fill out the information below to create your organization.</p>
            </div>
            
            {/* Featured Benefits (Mobile) */}
            <div className="md:hidden mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-50 flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">3 teams created automatically</h3>
                    <p className="text-gray-600 text-sm">Marketing, Sales, and Engineering</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Ready-to-use dashboards</h3>
                    <p className="text-gray-600 text-sm">Track progress with visual analytics</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-50 flex items-center justify-center mr-3">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Free 14-day trial</h3>
                    <p className="text-gray-600 text-sm">Experience all premium features</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Wizard Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <TenantOnboardingWizard />
            </div>
            
            {/* Help Text */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Need help setting up your organization? <a href="#" className="text-primary font-medium">Contact support</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}