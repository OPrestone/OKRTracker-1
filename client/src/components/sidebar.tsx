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
  UserCog,
  Shield,
  PanelLeftOpen,
  CheckCircle,
  Clock
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Sidebar = ({ open, onOpenChange }: SidebarProps) => {
  const [location] = useLocation();
  const [configExpanded, setConfigExpanded] = useState(false);
  const [okrsExpanded, setOkrsExpanded] = useState(false);
  const [companyObjectivesExpanded, setCompanyObjectivesExpanded] = useState(false);
  const [userManagementExpanded, setUserManagementExpanded] = useState(false);
  const [reportsExpanded, setReportsExpanded] = useState(false);

  // Temporary user info while auth is being fixed
  const user = {
    firstName: "Demo",
    lastName: "User",
    username: "demo",
    role: "Admin"
  };
  
  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.username?.[0] || '?';

  const handleLogout = () => {
    // Will be implemented when auth is fixed
    console.log("Logout clicked");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <h1 className="text-xl font-semibold flex items-center">
          <img src="/src/assets/logo.png" alt="OKR System" className="h-8 w-8 mr-2" />
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">OKR System</span>
        </h1>
      </div>
      
      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/quick-start-guide" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/quick-start-guide" className="flex items-center w-full">
            <Rocket className="mr-3 h-5 w-5 text-emerald-500" />
            <span className="font-medium">Quick Start Guide</span>
          </Link>
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/" className="flex items-center w-full">
            <BarChart3 className="mr-3 h-5 w-5 text-indigo-500" />
            Dashboard
          </Link>
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/home" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/home" className="flex items-center w-full">
            <Home className="mr-3 h-5 w-5 text-teal-500" />
            Home
          </Link>
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/mission" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/mission" className="flex items-center w-full">
            <Compass className="mr-3 h-5 w-5 text-blue-600" />
            Mission & Values
          </Link>
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/company-strategy" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/company-strategy" className="flex items-center w-full">
            <Flag className="mr-3 h-5 w-5 text-red-500" />
            Company Strategy
          </Link>
        </div>
        
        {/* Manage OKRs Menu */}
        <button 
          onClick={() => setOkrsExpanded(!okrsExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200",
            (location === "/my-okrs" || location === "/draft-okrs" || location === "/approved-okrs" || location === "/company-okrs")
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Flag className="mr-3 h-5 w-5 text-orange-500" />
          Manage OKRs
          {okrsExpanded ? (
            <ChevronUp className="ml-auto h-5 w-5" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5" />
          )}
        </button>
        
        {okrsExpanded && (
          <div className="pl-10">
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/my-okrs" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/my-okrs" className="w-full">
                My OKRs
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/draft-okrs" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/draft-okrs" className="w-full">
                Draft OKRs
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/approved-okrs" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/approved-okrs" className="w-full">
                Approved OKRs
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/company-okrs" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
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
            "w-full flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200",
            (location === "/teams" || location === "/users" || location === "/all-users")
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Users className="mr-3 h-5 w-5 text-blue-500" />
          User Management
          {userManagementExpanded ? (
            <ChevronUp className="ml-auto h-5 w-5" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5" />
          )}
        </button>
        
        {userManagementExpanded && (
          <div className="pl-10">
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/teams" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/teams" className="w-full">
                Teams
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/all-users" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/all-users" className="w-full">
                Users
              </Link>
            </div>
          </div>
        )}
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/checkins" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/checkins" className="flex items-center w-full">
            <CalendarCheck className="mr-3 h-5 w-5 text-teal-600" />
            Check-ins
          </Link>
        </div>
        
        <div
          className={cn(
            "flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200", 
            location === "/one-on-one-meetings" 
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Link href="/one-on-one-meetings" className="flex items-center w-full">
            <Users className="mr-3 h-5 w-5 text-indigo-500" />
            1:1 Meetings
          </Link>
        </div>
        
        {/* Reports Menu */}
        <button 
          onClick={() => setReportsExpanded(!reportsExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200",
            (location === "/reports" || location === "/okr-reports" || location === "/export-reports" || location === "/team-performance" || location === "/ai-recommendations")
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <PieChart className="mr-3 h-5 w-5 text-purple-500" />
          Reports & Analytics
          {reportsExpanded ? (
            <ChevronUp className="ml-auto h-5 w-5" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5" />
          )}
        </button>
        
        {reportsExpanded && (
          <div className="pl-10">
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/reports" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/reports" className="w-full">
                Overview Dashboard
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/okr-reports" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/okr-reports" className="w-full">
                OKR Performance
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/export-reports" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/export-reports" className="w-full flex items-center">
                <FileOutput className="mr-2 h-4 w-4 text-green-600" />
                Export Reports
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/team-performance" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/team-performance" className="w-full">
                Team Performance
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/ai-recommendations" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/ai-recommendations" className="w-full flex items-center">
                <Brain className="mr-2 h-4 w-4 text-amber-500" />
                Smart Recommendations
              </Link>
            </div>
          </div>
        )}
        
        <div className="px-4 mt-6 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Administration
        </div>
        
        <button 
          onClick={() => setConfigExpanded(!configExpanded)}
          className={cn(
            "w-full flex items-center pl-4 pr-4 py-3 text-sm font-medium transition-colors duration-200",
            (location.includes("/configuration/"))
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary" 
              : "text-gray-600 hover:bg-muted"
          )}
        >
          <Settings className="mr-3 h-5 w-5 text-gray-500" />
          Configure
          {configExpanded ? (
            <ChevronUp className="ml-auto h-5 w-5" />
          ) : (
            <ChevronDown className="ml-auto h-5 w-5" />
          )}
        </button>
        
        {configExpanded && (
          <div className="pl-10">
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/general" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/general" className="w-full flex items-center">
                <Settings className="h-4 w-4 mr-2 text-gray-500" />
                General Settings
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/teams" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/teams" className="w-full flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-500" />
                Team Management
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/users-permissions" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/users-permissions" className="w-full flex items-center">
                <UserCog className="h-4 w-4 mr-2 text-indigo-500" />
                Users Management
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/access-groups" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/access-groups" className="w-full flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-500" />
                Access Groups
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/integrations" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/integrations" className="w-full flex items-center">
                <PanelLeftOpen className="h-4 w-4 mr-2 text-purple-500" />
                Integrations
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/status-settings" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/status-settings" className="w-full flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-orange-500" />
                Status Settings
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/cadences" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/cadences" className="w-full flex items-center">
                <CalendarCheck className="h-4 w-4 mr-2 text-teal-500" />
                Cadences
              </Link>
            </div>
            
            <div className={cn(
              "flex items-center pl-4 pr-4 py-2 text-sm transition-colors duration-200", 
              location === "/configuration/timeframes" 
                ? "text-primary font-medium" 
                : "text-gray-600 hover:text-gray-900"
            )}>
              <Link href="/configuration/timeframes" className="w-full flex items-center">
                <Clock className="h-4 w-4 mr-2 text-red-500" />
                Timeframes
              </Link>
            </div>
          </div>
        )}
      </nav>
      
      {/* User Profile */}
      <div className="border-t border-border p-4 bg-muted/30">
        <div className="flex items-center">
          <Avatar className="h-9 w-9 mr-3 border-2 border-primary/20">
            <AvatarImage src="" alt="User profile" />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <div className="ml-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="text-gray-400 hover:text-gray-500 hover:bg-muted transition-colors duration-200"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-background border-r border-border h-full shadow-sm">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-72 border-r-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
