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
  Buildings,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { TenantSwitcher } from "@/components/tenant/tenant-switcher";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const [location] = useLocation();

  // Check if any submenu paths are currently active to auto-expand parent menus
  const isOkrPathActive = [
    "/my-okrs",
    "/draft-okrs",
    "/approved-okrs",
    "/company-okrs",
  ].includes(location);
  const isUserManagementPathActive = [
    "/teams",
    "/all-users",
    "/users",
  ].includes(location);
  const isReportPathActive = [
    "/activity-report",
    "/alignment-report",
    "/completion-report",
    "/progress-report",
  ].includes(location);
  const isConfigPathActive = [
    "/configure",
    "/system-settings",
    "/integrations",
    "/billing-settings",
    "/security-settings",
  ].includes(location);

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
  const { user, logoutMutation } = useAuth();

  // Calculate initials for avatar
  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user?.username?.[0] || "?";

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.reload(); // Reload the page after successful logout
      },
    });
  };

  // Check if any tenant management paths are active to auto-expand organization menu
  const isTenantPathActive = ["/tenants", "/tenants/"].some(
    (path) => location === path || location.startsWith(path)
  );
  const [tenantsExpanded, setTenantsExpanded] = useState(isTenantPathActive);

  // Update expanded states when location changes
  useEffect(() => {
    setTenantsExpanded(isTenantPathActive);
  }, [location, isTenantPathActive]);
  
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0f172a] text-gray-200 shadow-xl">
      <div className="p-5 border-b border-slate-800/70 bg-[#1e293b]">
        <h1 className="text-xl font-semibold flex items-center">
          <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <Target className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold tracking-wide">
            Pinnacle OKR{" "}
          </span>
        </h1>
        
        {/* Tenant Switcher */}
        <div className="mt-3">
          <TenantSwitcher />
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2 pb-4">
        <div className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center">
          <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full shadow-sm shadow-indigo-500/50 me-2"></span>
          Core Features
        </div>

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/quick-start-guide"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href="/quick-start-guide" className="flex items-center w-full">
            <Rocket className="h-4 w-4 mr-3" />
            <span>Quick Start Guide</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/home"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href="/home" className="flex items-center w-full">
            <Home className="h-4 w-4 mr-3" />
            <span>Home</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href="/" className="flex items-center w-full">
            <BarChart3 className="h-4 w-4 mr-3" />
            <span>Dashboards</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/team-leader-dashboard"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link
            href="/team-leader-dashboard"
            className="flex items-center w-full"
          >
            <LayoutDashboard className="h-4 w-4 mr-3" />
            <span>Team Leader Dashboard</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center mx-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
            location === "/mission"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-300 hover:bg-slate-800 hover:text-white",
          )}
        >
          <Link href="/mission" className="flex items-center w-full">
            <Compass className="h-4 w-4 mr-3" />
            <span>Mission & Values</span>
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
          <Link href="/strategy-map" className="flex items-center w-full">
            <Flag className="h-4 w-4 mr-3" />
            <span>Strategy Map</span>
          </Link>
        </div>

        {/* Manage OKRs Menu */}
        <button
          onClick={() => setOkrsExpanded(!okrsExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/my-okrs" ||
              location === "/draft-okrs" ||
              location === "/approved-okrs" ||
              location === "/company-okrs"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Flag className="mr-3 h-5 w-5 text-indigo-400" />
          <span>Manage OKRs</span>
          {okrsExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          )}
        </button>

        {okrsExpanded && (
          <div className="pl-11 mt-1 mb-1">
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/my-okrs"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/my-okrs" className="w-full">
                My OKRs
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/draft-okrs"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/draft-okrs" className="w-full">
                Draft OKRs
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/approved-okrs"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/approved-okrs" className="w-full">
                Approved OKRs
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/company-okrs"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/company-okrs" className="w-full">
                Company OKRs
              </Link>
            </div>
          </div>
        )}

        {/* User Management Menu */}
        <button
          onClick={() => setUserManagementExpanded(!userManagementExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/teams" ||
              location === "/users" ||
              location === "/all-users"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Users className="mr-3 h-5 w-5 text-indigo-400" />
          <span>User Management</span>
          {userManagementExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          )}
        </button>

        {userManagementExpanded && (
          <div className="pl-11 mt-1 mb-1">
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/teams"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/teams" className="w-full">
                Teams
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/all-users"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/all-users" className="w-full">
                Users
              </Link>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/checkins"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/checkins" className="flex items-center w-full">
            <CalendarCheck className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Check-ins</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/one-on-one-meetings"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link
            href="/one-on-one-meetings"
            className="flex items-center w-full"
          >
            <Users className="mr-3 h-5 w-5 text-indigo-400" />
            <span>1:1 Meetings</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/chat"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/chat" className="flex items-center w-full">
            <MessageSquare className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Chat</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/feedback-wall"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/feedback-wall" className="flex items-center w-full">
            <Award className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Feedback Wall</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/wellness-pulse"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/wellness-pulse" className="flex items-center w-full">
            <Activity className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Wellness Pulse</span>
          </Link>
        </div>
        
        {/* Organizations Menu */}
        <button
          onClick={() => setTenantsExpanded(!tenantsExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/tenants" || location.startsWith("/tenants/")
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Buildings className="mr-3 h-5 w-5 text-indigo-400" />
          <span>Organizations</span>
          {tenantsExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          )}
        </button>

        {tenantsExpanded && (
          <div className="pl-11 mt-1 mb-1">
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/tenants"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/tenants" className="w-full">
                All Organizations
              </Link>
            </div>
            
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location.startsWith("/tenants/") && location.includes("/subscription")
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/tenants/default/subscription" className="w-full">
                Subscription
              </Link>
            </div>
          </div>
        )}

        {/* Drag & Drop Section */}
        <div className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center">
          <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full mr-2 shadow-sm shadow-indigo-500/50"></span>
          Drag & Drop Interfaces
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/project-kanban"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/project-kanban" className="flex items-center w-full">
            <LayoutDashboard className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Project Kanban</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/objectives-organizer"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link
            href="/objectives-organizer"
            className="flex items-center w-full"
          >
            <Target className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Objectives Organizer</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/timeline-editor"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/timeline-editor" className="flex items-center w-full">
            <Calendar className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Timeline Editor</span>
          </Link>
        </div>

        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/custom-dashboard"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/custom-dashboard" className="flex items-center w-full">
            <BarChart3 className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Custom Dashboard</span>
          </Link>
        </div>

        {/* Reports Menu */}
        <button
          onClick={() => setReportsExpanded(!reportsExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/reports" ||
              location === "/okr-reports" ||
              location === "/export-reports" ||
              location === "/team-performance" ||
              location === "/ai-recommendations"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <PieChart className="mr-3 h-5 w-5 text-indigo-400" />
          <span>Reports & Analytics</span>
          {reportsExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          )}
        </button>

        {reportsExpanded && (
          <div className="pl-11 mt-1 mb-1">
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/reports"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/reports" className="w-full">
                Overview Dashboard
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/okr-reports"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/okr-reports" className="w-full">
                OKR Performance
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/export-reports"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/export-reports" className="w-full flex items-center">
                <FileOutput className="mr-2 h-4 w-4 text-indigo-400" />
                Export Reports
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/team-performance"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link href="/team-performance" className="w-full">
                Team Performance
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/ai-recommendations"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href="/ai-recommendations"
                className="w-full flex items-center"
              >
                <Brain className="mr-2 h-4 w-4 text-indigo-400" />
                Smart Recommendations
              </Link>
            </div>

            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/import-financial"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href="/import-financial"
                className="w-full flex items-center"
              >
                <BarChart3 className="mr-2 h-4 w-4 text-indigo-400" />
                Import Financial Data
              </Link>
            </div>
          </div>
        )}

        <div className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center">
          <span className="bg-indigo-500 h-1.5 w-1.5 rounded-full mr-2 shadow-sm shadow-indigo-500/50"></span>
          Administration
        </div>
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location === "/configure"
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Link href="/configure" className="flex items-center w-full">
            <MessageSquare className="mr-3 h-5 w-5 text-indigo-400" />
            <span>Configurations</span>
          </Link>
        </div>

        <button
          onClick={() => setConfigExpanded(!configExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-2.5 text-sm font-medium transition-colors duration-200",
            location.includes("/configuration/")
              ? "bg-indigo-900/30 text-white border-l-2 border-indigo-500"
              : "text-gray-300 hover:bg-indigo-900/20 hover:text-white",
          )}
        >
          <Settings className="mr-3 h-5 w-5 text-indigo-400" />
          <span>Configure</span>
          {configExpanded ? (
            <ChevronUp className="ml-auto h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="ml-auto h-4 w-4 text-gray-400" />
          )}
        </button>

        {configExpanded && (
          <div className="pl-11 mt-1 mb-1">
            <div
              className={cn(
                "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200 rounded-sm",
                location === "/configuration/general"
                  ? "text-white font-medium bg-indigo-900/40"
                  : "text-gray-400 hover:text-white hover:bg-indigo-900/30",
              )}
            >
              <Link
                href="/configuration/general"
                className="w-full flex items-center"
              >
                <Settings className="h-4 w-4 mr-2 text-indigo-400" />
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
                href="/configuration/teams"
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
                href="/configuration/users-permissions"
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
                href="/configuration/access-groups"
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
                href="/configuration/integrations"
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
                href="/configuration/status-settings"
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
                href="/configuration/cadences"
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
                href="/configuration/timeframes"
                className="w-full flex items-center"
              >
                <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                Timeframes
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-800/70 p-4 mt-auto bg-[#1e293b] shadow-inner">
        <div className="flex items-center">
          <Link href="/user-profile">
            <Avatar className="h-10 w-10 mr-3 border-2 border-indigo-500/20 hover:border-indigo-500/60 transition-colors shadow-sm">
              <AvatarImage src="" alt="User profile" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href="/user-profile"
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
