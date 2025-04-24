import { 
  HelpCircle, 
  Menu,
  ChevronRight,
  Moon,
  Sun,
  Laptop,
  Rocket,
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  MessageSquare,
  Inbox,
  Home
} from "lucide-react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SearchDialog } from "@/components/search/search-dialog";
import { HelpTooltip } from "@/components/help/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { dashboardHelp } from "@/components/help/help-content";
import NotificationDropdown from "@/components/notifications/notification-dropdown";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ title, subtitle, sidebarOpen, setSidebarOpen }: HeaderProps) => {
  // Get the onboarding context at the component level
  const onboarding = useOnboarding();
  const { user } = useAuth();
  
  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.username?.[0] || '?';
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative mr-1">
            <SearchDialog />
          </div>
          
          {/* Get Started Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex items-center gap-1.5 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 mr-1"
            onClick={() => onboarding.toggleGetStartedMenu()}
          >
            <Rocket className="h-4 w-4" />
            <span>Get Started</span>
          </Button>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Notifications</span>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                    Mark all as read
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="flex items-start py-3 px-4 hover:bg-gray-50">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-700">New comment on your objective</p>
                    <p className="text-xs text-gray-500">Sarah mentioned you in a comment</p>
                    <p className="text-xs text-gray-400">2 min ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start py-3 px-4 hover:bg-gray-50">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-gray-700">Key result achieved</p>
                    <p className="text-xs text-gray-500">Increase user engagement by 25%</p>
                    <p className="text-xs text-gray-400">1 hour ago</p>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-gray-700 hover:bg-gray-100">
            <Inbox className="h-5 w-5" />
          </Button>
          
          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1">
                <Avatar className="h-9 w-9 border border-gray-200">
                  <AvatarImage src="/assets/avatar.png" alt={user?.firstName || 'User'} />
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="px-4 py-3 border-b border-gray-100">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-gray-800">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email || user?.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <div className="py-2">
                <DropdownMenuItem className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <User className="mr-3 h-4 w-4 text-gray-500" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <MessageSquare className="mr-3 h-4 w-4 text-gray-500" />
                  <span>Messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Settings className="mr-3 h-4 w-4 text-gray-500" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="border-t border-gray-100 my-0" />
              <div className="py-2">
                <DropdownMenuItem className="px-4 py-2 text-gray-700 hover:bg-gray-50 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Help */}
          <HelpTooltip
            id={dashboardHelp.id}
            title={dashboardHelp.title}
            description={dashboardHelp.description}
          >
            <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 ml-1">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </HelpTooltip>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-6 py-2.5 border-b border-gray-200 flex items-center text-sm bg-gray-50">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
          <Home className="h-3.5 w-3.5 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
        <span className="text-gray-500 font-medium">{title}</span>
      </div>
    </header>
  );
};

export default Header;
