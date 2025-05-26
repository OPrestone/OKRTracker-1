import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Home,
  Flag,
  Users,
  User,
  CalendarCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  PieChart,
  LineChart,
  AreaChart,
  Lightbulb,
  Brain,
  BookOpen,
  Rocket,
  Compass,
  MessageSquare,
  UserCog,
  Shield,
  PanelLeftOpen,
  CheckCircle,
  Clock,
  FilePlus2 as FileOutput,
  LayoutDashboard,
  Target,
  Menu,
  Building,
  LogOut,
  Calendar,
  Award,
  Activity,
  Crown,
  Briefcase,
  /* Buildings, */
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";
import { useTeamLeader } from "@/hooks/use-team-leader";
import { Separator } from "@/components/ui/separator";
import TenantSwitcher from "@/components/tenant/tenant-switcher";
import { Tenant } from "@/hooks/use-tenant-context";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { isTeamLeader } = useTeamLeader();

  // Determine which dashboard to show based on user role
  const getDashboardInfo = () => {
    if (userRole === 'ceo') {
      return {
        path: '/ceo-dashboard',
        label: 'CEO Dashboard',
        icon: Crown
      };
    } else if (userRole === 'management') {
      return {
        path: '/management-dashboard',
        label: 'Management Dashboard',
        icon: Briefcase
      };
    } else if (isTeamLeader) {
      return {
        path: '/team-leader-dashboard',
        label: 'Team Leader Dashboard',
        icon: LayoutDashboard
      };
    }
    return null;
  };

  const dashboardInfo = getDashboardInfo();

  // Check if any submenu paths are currently active to auto-expand parent menus
  // Use regex patterns to match both direct paths and organization-prefixed paths
  const okrPaths = [
    "my-okrs",
    "draft-okrs",
    "approved-okrs",
    "company-okrs",
  ];
  const userManagementPaths = [
    "teams",
    "all-users",
    "users",
  ];
  const reportPaths = [
    "activity-report",
    "alignment-report",
    "completion-report",
    "progress-report",
  ];
  const configPaths = [
    "configure",
    "system-settings",
    "integrations",
    "billing-settings",
  ];
  
  // Ensure location is treated as string for proper matching
  const locationPath = location.toString();
  
  // Check if location contains any of these paths, whether directly or after organization prefix
  const isOkrPathActive = okrPaths.some(path => 
    locationPath === `/${path}` || locationPath.includes(`/organization/`) && locationPath.includes(`/${path}`)
  );
  const isUserManagementPathActive = userManagementPaths.some(path => 
    locationPath === `/${path}` || locationPath.includes(`/organization/`) && locationPath.includes(`/${path}`)
  );
  const isReportPathActive = reportPaths.some(path => 
    locationPath === `/${path}` || locationPath.includes(`/organization/`) && locationPath.includes(`/${path}`)
  );
  const isConfigPathActive = configPaths.some(path => 
    locationPath === `/${path}` || locationPath.includes(`/organization/`) && locationPath.includes(`/${path}`)
  );

  // Initialize expanded states based on current location
  const [configExpanded, setConfigExpanded] = useState(isConfigPathActive);
  const [okrsExpanded, setOkrsExpanded] = useState(isOkrPathActive);
  const [companyObjectivesExpanded, setCompanyObjectivesExpanded] =
    useState(false);
  const [userManagementExpanded, setUserManagementExpanded] = useState(
    isUserManagementPathActive,
  );
  const [reportsExpanded, setReportsExpanded] = useState(isReportPathActive);

  // Update expanded states when location changes
  useEffect(() => {
    // Check if any submenu paths are active and update expanded states
    setOkrsExpanded(isOkrPathActive);
    setUserManagementExpanded(isUserManagementPathActive);
    setReportsExpanded(isReportPathActive);
    setConfigExpanded(isConfigPathActive);
  }, [
    location,
    isOkrPathActive,
    isUserManagementPathActive,
    isReportPathActive,
    isConfigPathActive,
  ]);

  // Get authenticated user and logout mutation from useAuth hook
  const { logoutMutation } = useAuth();

  // Calculate initials for avatar
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.username?.[0] || "?";
      
  // Function to check if current user is an admin for the selected tenant
  const isCurrentUserAdmin = () => {
    if (!user || !selectedTenant) return false;
    
    // Check if user has admin privileges in this tenant
    const userRole = user.tenants?.find(t => t.id === selectedTenant.id)?.userRole;
    return userRole === 'owner' || userRole === 'admin';
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.reload(); // Reload the page after successful logout
      },
    });
  };

  // Check if any tenant management paths are active to auto-expand organization menu
  const isTenantPathActive = ["/tenants", "/tenants/"].some(
    (path) => locationPath === path || locationPath.startsWith(path)
  );
  const [tenantsExpanded, setTenantsExpanded] = useState(isTenantPathActive);
  
  // Fetch the current tenant list
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });
  
  // Get selected tenant from location
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Find and set the current tenant based on URL path
  useEffect(() => {
    if (!tenants || tenants.length === 0) return;
    
    // Use locationPath for matching to avoid type issues
    
    // Check for numeric tenant ID in /tenants/{id}
    const numericMatch = locationPath.match(/\/tenants\/(\d+)/);
    if (numericMatch) {
      const tenantId = parseInt(numericMatch[1]);
      const matchedTenant = tenants.find(t => parseInt(t.id) === tenantId);
      if (matchedTenant) {
        setSelectedTenant(matchedTenant);
        return;
      }
    }
    
    // Check for ULID tenant ID in /tenants/{id} - ULIDs are 26 characters
    const ulidMatch = locationPath.match(/\/tenants\/([A-Z0-9]{26})/);
    if (ulidMatch) {
      const tenantId = ulidMatch[1];
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setSelectedTenant(matchedTenant);
        return;
      }
    }
    
    // Check for direct ULID path /{id}
    const ulidDirectMatch = locationPath.match(/^\/([A-Z0-9]{26})/);
    if (ulidDirectMatch) {
      const tenantId = ulidDirectMatch[1];
      const matchedTenant = tenants.find(t => t.id === tenantId);
      if (matchedTenant) {
        setSelectedTenant(matchedTenant);
        return;
      }
    }
    
    // Legacy: Check for organization slug in /organization/{slug}
    const orgMatch = locationPath.match(/\/organization\/([^/]+)/);
    if (orgMatch) {
      const urlSlug = orgMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setSelectedTenant(matchedTenant);
        return;
      }
    }
    
    // Check for legacy tenant slug in /tenants/{slug}
    const tenantMatch = locationPath.match(/\/tenants\/([^/]+)/);
    if (tenantMatch && !numericMatch && !ulidDirectMatch) { // Ensure we're not matching a numeric ID or ULID again
      const urlSlug = tenantMatch[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) {
        setSelectedTenant(matchedTenant);
        return;
      }
    }
    
    // Otherwise, use default tenant or first one
    const defaultTenant = tenants.find(t => t.isDefault) || tenants[0];
    setSelectedTenant(defaultTenant);
  }, [tenants, locationPath]);

  // Update expanded states when location changes
  useEffect(() => {
    setTenantsExpanded(isTenantPathActive);
  }, [locationPath, isTenantPathActive]);
  
  // Helper function to generate links with tenant context if available
  const getLink = (path: string) => {
    if (!selectedTenant) return path;
    return `/${selectedTenant.id}${path}`;
  };
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f172a] text-gray-200 shadow-xl">
      <div className="p-5 border-b border-slate-800/70 bg-gradient-to-r from-blue-950 to-indigo-950">
        <h1 className="text-xl font-semibold flex items-center">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            <Target className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">
            Pinnacle OKR
          </span>
        </h1>
        
        {/* Tenant Switcher */}
        <div className="mt-4">
          <TenantSwitcher />
        </div>
        
        {/* Current Tenant Display */}
        {selectedTenant && (
          <div className="mt-3 px-3 py-2 text-sm font-medium text-indigo-100 flex items-center bg-indigo-900/30 rounded-lg border border-indigo-800/50">
            <Building className="h-4 w-4 mr-2 text-indigo-300" />
            <span className="truncate">{selectedTenant.displayName || selectedTenant.name}</span>
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-5 py-2 text-xs font-semibold text-indigo-300 uppercase tracking-wide flex items-center">
          <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full shadow-sm shadow-indigo-500/50 me-2"></span>
          Core Features
        </div>

        {/* Home & Dashboards (Always at the top) */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/")} className="flex items-center w-full">
            <BarChart3 className="h-4 w-4 mr-3" />
            <span>Dashboards</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/home"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/home")} className="flex items-center w-full">
            <Home className="h-4 w-4 mr-3" />
            <span>Home</span>
          </Link>
        </div>

        {/* Role-based Dashboard Link */}
        {dashboardInfo && (
          <div
            className={cn(
              "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              location === dashboardInfo.path
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
            )}
          >
            <Link
              href={getLink(dashboardInfo.path)}
              className="flex items-center w-full"
            >
              <dashboardInfo.icon className="h-4 w-4 mr-3" />
              <span>{dashboardInfo.label}</span>
            </Link>
          </div>
        )}

        {/* Strategy & Mission */}
        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/mission"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href={getLink("/mission")} className="flex items-center w-full">
            <Compass className="h-4 w-4 mr-3" />
            <span>Mission & Values</span>
          </Link>
        </div>

        {/* Onboarding Resources */}
        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/quick-start-guide"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href={getLink("/quick-start-guide")} className="flex items-center w-full">
            <Rocket className="h-4 w-4 mr-3" />
            <span>Quick Start Guide</span>
          </Link>
        </div>
        {/*         
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200", 
            location === "/company-mission" 
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500" 
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white"
          )}
        >
          <Link href="/company-mission" className="flex items-center w-full">
            <Building className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Company Mission</span>
          </Link>
        </div> */}

        {/* <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200", 
            location === "/company-strategy" 
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500" 
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white"
          )}
        >
          <Link href="/company-strategy" className="flex items-center w-full">
            <Flag className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Company Strategy</span>
          </Link>
        </div> */}

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/strategy-map"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href={getLink("/strategy-map")} className="flex items-center w-full">
            <Flag className="h-4 w-4 mr-3" />
            <span>Strategy Map</span>
          </Link>
        </div>

        {/* Manage OKRs Menu */}
        <button
          onClick={() => setOkrsExpanded(!okrsExpanded)}
          className={cn(
            "w-full flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            isOkrPathActive
              ? "bg-indigo-950 text-white shadow-sm border border-indigo-800/50"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Flag className="mr-3 h-4 w-4 text-indigo-400" />
          <span>Manage OKRs</span>
          {okrsExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-indigo-300" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-indigo-300" />
          )}
        </button>

        {okrsExpanded && (
          <div className="pl-8 mt-1 mb-1 space-y-1 py-1 ml-4 mr-4 bg-indigo-950/30 rounded-lg">
            {/* Organization Level First */}
            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/company-okrs"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/company-okrs")} className="w-full">
                Company OKRs
              </Link>
            </div>

            {/* Personal Level */}
            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/my-okrs"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/my-okrs")} className="w-full">
                My OKRs
              </Link>
            </div>

            {/* Workflow-based Items */}
            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/draft-okrs"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/draft-okrs")} className="w-full">
                Draft OKRs
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/approved-okrs"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/approved-okrs")} className="w-full">
                Approved OKRs
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/progress-dashboard"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/progress-dashboard")} className="w-full">
                Progress Tracker
              </Link>
            </div>
          </div>
        )}

        {/* User Management Menu */}
        <button
          onClick={() => setUserManagementExpanded(!userManagementExpanded)}
          className={cn(
            "w-full flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            isUserManagementPathActive
              ? "bg-indigo-950 text-white shadow-sm border border-indigo-800/50"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Users className="mr-3 h-4 w-4 text-indigo-400" />
          <span>User Management</span>
          {userManagementExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-indigo-300" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-indigo-300" />
          )}
        </button>

        {userManagementExpanded && (
          <div className="pl-8 mt-1 mb-1 space-y-1 py-1 ml-4 mr-4 bg-indigo-950/30 rounded-lg">
            {/* Organization Structure */}
            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/teams"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/teams")} className="w-full">
                Teams
              </Link>
            </div>
            
            {/* User Management */}
            <div
              className={cn(
                "flex items-center mx-2 px-3 py-2 text-sm transition-all duration-200 rounded-md",
                location === "/all-users"
                  ? "text-white font-medium bg-indigo-900/60 shadow-sm"
                  : "text-indigo-200 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/all-users")} className="w-full">
                Users
              </Link>
            </div>
          </div>
        )}

        {/* Team Engagement Menu */}
        <div className="px-5 pt-5 pb-2 text-xs font-semibold text-indigo-300 uppercase tracking-wide flex items-center">
          <span className="bg-indigo-400 h-1.5 w-1.5 rounded-full mr-2 shadow-sm shadow-indigo-400/50"></span>
          Team Engagement
        </div>
        
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/checkins" || location.includes("/checkins")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/checkins")} className="flex items-center w-full">
            <CalendarCheck className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Check-ins</span>
          </Link>
        </div>

        {/* One-on-One Meetings */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/one-on-one-meetings" || location.includes("/one-on-one-meetings")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link
            href={getLink("/one-on-one-meetings")}
            className="flex items-center w-full"
          >
            <Users className="mr-3 h-4 w-4 text-indigo-200" />
            <span>1:1 Meetings</span>
          </Link>
        </div>

        {/* Team Communication */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/chat" || location.includes("/chat")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/chat")} className="flex items-center w-full">
            <MessageSquare className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Chat</span>
          </Link>
        </div>

        {/* Team Feedback */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/feedback-wall" || location.includes("/feedback-wall")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/feedback-wall")} className="flex items-center w-full">
            <Award className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Feedback Wall</span>
          </Link>
        </div>

        {/* Team Wellness */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/wellness-pulse" || location.includes("/wellness-pulse")
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/wellness-pulse")} className="flex items-center w-full">
            <Activity className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Wellness Pulse</span>
          </Link>
        </div>
        
        {/* Administrative Section - Always visible to admins/owners in the tenant */}
        {(isCurrentUserAdmin() || user?.isAdmin) && (
          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center">
            <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full mr-2 shadow-sm shadow-indigo-500/50"></span>
            Administration
          </div>
        )}

        {/* Organizations Menu - Always visible to admins/owners in the tenant */}
        {(isCurrentUserAdmin() || user?.isAdmin) && (
          <button
            onClick={() => setTenantsExpanded(!tenantsExpanded)}
            className={cn(
              "w-full flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              location === "/tenants" || location.startsWith("/tenants/") || location.includes("/organization/")
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
            )}
          >
            <Building className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Organizations</span>
            {tenantsExpanded ? (
              <ChevronUp className="ml-auto h-4 w-4 text-indigo-200" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 text-indigo-200" />
            )}
          </button>
        )}

        {tenantsExpanded && (isCurrentUserAdmin() || user?.isAdmin) && (
          <div className="pl-11 mt-1 mb-1">
            {/* Organization Management Section */}
            <div className="mb-2">
              <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-1">
                Organization Management
              </div>
            {/* Global Organization Management */}
            <div
              className={cn(
                "flex items-center py-2 px-3 text-sm transition-all duration-200 rounded-md mb-1",
                location === "/tenants"
                  ? "text-white font-medium bg-indigo-800/60 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href="/tenants" className="w-full">
                All Organizations
              </Link>
            </div>
            
            </div>

            {/* Current Organization Settings - Only show for organization admins */}
            {selectedTenant && (isCurrentUserAdmin() || user?.isAdmin) && (
              <div className="mb-2">
                <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-1">
                  {selectedTenant.name}
                </div>
                <div
                  className={cn(
                    "flex items-center py-2 px-3 text-sm transition-all duration-200 rounded-md mb-1",
                    (location.startsWith(`/${selectedTenant.id}`) && !location.includes("/subscription"))
                      ? "text-white font-medium bg-indigo-800/60 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
                  )}
                >
                  <Link href={`/${selectedTenant.id}`} className="w-full">
                    Organization Settings
                  </Link>
                </div>
                
                {/* Billing & Subscription */}
                <div
                  className={cn(
                    "flex items-center py-2 px-3 text-sm transition-all duration-200 rounded-md mb-1",
                    location.includes("/subscription")
                      ? "text-white font-medium bg-indigo-800/60 shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
                  )}
                >
                  <Link href={`/${selectedTenant.id}/subscription`} className="w-full">
                    Subscription
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drag & Drop Section */}
        <div className="px-5 pt-5 pb-2 text-xs font-semibold text-slate-300 uppercase tracking-wide flex items-center">
          <div className="h-4 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 mr-2.5 shadow-sm"></div>
          Drag & Drop Interfaces
        </div>

        {/* Project Management */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/project-kanban"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/project-kanban")} className="flex items-center w-full">
            <LayoutDashboard className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Project Kanban</span>
          </Link>
        </div>

        {/* OKR Management */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/objectives-organizer"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link
            href={getLink("/objectives-organizer")}
            className="flex items-center w-full"
          >
            <Target className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Objectives Organizer</span>
          </Link>
        </div>

        {/* Time-based Management */}
        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/timeline-editor"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/timeline-editor")} className="flex items-center w-full">
            <Calendar className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Timeline Editor</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/custom-dashboard"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <Link href={getLink("/custom-dashboard")} className="flex items-center w-full">
            <BarChart3 className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Custom Dashboard</span>
          </Link>
        </div>

        {/* Reports Menu */}
        <button
          onClick={() => setReportsExpanded(!reportsExpanded)}
          className={cn(
            "w-full flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            location === "/reports" ||
              location === "/okr-reports" ||
              location === "/export-reports" ||
              location === "/team-performance" ||
              location === "/ai-recommendations"
              ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
          )}
        >
          <PieChart className="mr-3 h-4 w-4 text-indigo-200" />
          <span>Reports & Analytics</span>
          {reportsExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-indigo-200" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-indigo-200" />
          )}
        </button>

        {reportsExpanded && (
          <div className="pl-10 pr-4 mt-2 mb-2 space-y-1">
            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/reports"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/reports")} className="w-full">
                Overview Dashboard
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/okr-reports"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/okr-reports")} className="w-full">
                OKR Performance
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/export-reports"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/export-reports")} className="w-full flex items-center">
                <FileOutput className="mr-2 h-3 w-3 text-indigo-300" />
                Export Reports
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/team-performance"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link href={getLink("/team-performance")} className="w-full">
                Team Performance
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/ai-recommendations"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link
                href={getLink("/ai-recommendations")}
                className="w-full flex items-center"
              >
                <Brain className="mr-2 h-3 w-3 text-indigo-300" />
                Smart Recommendations
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center px-3 py-1.5 text-xs font-medium transition-all duration-200 rounded-md",
                location === "/import-financial"
                  ? "text-white bg-indigo-900/60 shadow-sm shadow-indigo-900/30"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link
                href={getLink("/import-financial")}
                className="w-full flex items-center"
              >
                <BarChart3 className="mr-2 h-3 w-3 text-indigo-300" />
                Import Financial Data
              </Link>
            </div>
          </div>
        )}

        {/* Admin section - Only visible to admins/owners */}
        {(isCurrentUserAdmin() || user?.isAdmin) && (
          <div className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center">
            <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full mr-2 shadow-sm shadow-indigo-500/50"></span>
            Administration
          </div>
        )}
        {/* Configurations link - Only visible to admins/owners */}
        {(isCurrentUserAdmin() || user?.isAdmin) && (
          <div
            className={cn(
              "flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              location === "/configure"
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
            )}
          >
            <Link href={getLink("/configure")} className="flex items-center w-full">
              <MessageSquare className="mr-3 h-4 w-4 text-indigo-200" />
              <span>Configurations</span>
            </Link>
          </div>
        )}

        {/* Configure button - Only visible to admins/owners */}
        {(isCurrentUserAdmin() || user?.isAdmin) && (
          <button
            onClick={() => setConfigExpanded(!configExpanded)}
            className={cn(
              "w-full flex items-center mx-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              location.includes("/configuration/")
                ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-200 hover:bg-indigo-900/30 hover:text-white",
            )}
          >
            <Settings className="mr-3 h-4 w-4 text-indigo-200" />
            <span>Configure</span>
            {configExpanded ? (
              <ChevronUp className="ml-auto h-4 w-4 text-indigo-200" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 text-indigo-200" />
            )}
          </button>
        )}

        {/* Configuration submenu - Only for admins/owners */}
        {configExpanded && (isCurrentUserAdmin() || user?.isAdmin) && (
          <div className="pl-8 mt-1 mb-1 space-y-1">
            <div
              className={cn(
                "flex items-center py-2 text-sm transition-all duration-200 rounded-md mx-2 px-3",
                location === "/configuration/general"
                  ? "text-white font-medium bg-indigo-800/50 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-indigo-900/40",
              )}
            >
              <Link
                href={getLink("/configuration/general")}
                className="w-full flex items-center"
              >
                <Settings className="h-3 w-3 mr-2 text-indigo-300" />
                General Settings
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/teams"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/teams")}
                className="w-full flex items-center"
              >
                <Users className="h-4 w-4 mr-2 text-indigo-400" />
                Team Management
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/users-permissions"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/users-permissions")}
                className="w-full flex items-center"
              >
                <UserCog className="h-4 w-4 mr-2 text-indigo-400" />
                Users Management
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/access-groups"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/access-groups")}
                className="w-full flex items-center"
              >
                <Shield className="h-4 w-4 mr-2 text-indigo-400" />
                Access Groups
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/integrations"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/integrations")}
                className="w-full flex items-center"
              >
                <PanelLeftOpen className="h-4 w-4 mr-2 text-indigo-400" />
                Integrations
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/status-settings"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/status-settings")}
                className="w-full flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-indigo-400" />
                Status Settings
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/cadences"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/cadences")}
                className="w-full flex items-center"
              >
                <CalendarCheck className="h-4 w-4 mr-2 text-indigo-400" />
                Cadences
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/timeframes"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/timeframes")}
                className="w-full flex items-center"
              >
                <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                Timeframes
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location.includes("/configuration/system-settings")
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href={getLink("/configuration/system-settings")}
                className="w-full flex items-center"
              >
                <Settings className="h-4 w-4 mr-2 text-indigo-400" />
                System Settings
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-800/70 p-4 mt-auto bg-[#1e293b] shadow-inner">
        <div className="flex items-center">
          <Link href={getLink("/user-profile")}>
            <Avatar className="h-10 w-10 mr-3 border-2 border-indigo-500/20 hover:border-indigo-500/60 transition-colors shadow-sm">
              <AvatarImage src="" alt="User profile" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={getLink("/user-profile")}
              className="hover:text-white transition-colors"
            >
              <p className="text-sm font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400">
                {user?.role || "Team Member"}
              </p>
            </Link>
          </div>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 rounded-lg"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#0f172a] h-full shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-72 border-r-0 bg-[#0f172a]">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
