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

  const { user } = useAuth();
  
  const handleLogout = () => {
    console.log("Logout clicked");
  };

  const initials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}` 
    : user?.username?.[0] || '?';
  
  return (
    <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-indigo-900/20 shadow-md sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-indigo-300 hover:text-white hover:bg-indigo-800/30"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-indigo-300/80">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative mr-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-indigo-300 hover:text-white hover:bg-indigo-800/30 rounded-full"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-indigo-300 hover:text-white hover:bg-indigo-800/30 rounded-full">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-[#1f1f3a] border border-indigo-900/50 shadow-xl" align="end">
              <DropdownMenuLabel className="font-normal border-b border-indigo-900/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Notifications</span>
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-300 hover:text-white hover:bg-indigo-800/30">
                    Mark all as read
                  </Button>
                </div>
              </DropdownMenuLabel>
              <div className="max-h-80 overflow-y-auto">
                <DropdownMenuItem className="flex items-start py-3 px-4 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-900/70 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-indigo-300" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-indigo-100">New comment on your objective</p>
                    <p className="text-xs text-indigo-300/80">Sarah mentioned you in a comment</p>
                    <p className="text-xs text-indigo-400/60">2 min ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start py-3 px-4 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer">
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-purple-900/70 flex items-center justify-center">
                      <Rocket className="h-4 w-4 text-purple-300" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-indigo-100">Key result achieved</p>
                    <p className="text-xs text-indigo-300/80">Increase user engagement by 25%</p>
                    <p className="text-xs text-indigo-400/60">1 hour ago</p>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="border-t border-indigo-900/20" />
              <DropdownMenuItem className="text-center p-2 text-indigo-300 hover:text-white hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative text-indigo-300 hover:text-white hover:bg-indigo-800/30 rounded-full">
            <Inbox className="h-5 w-5" />
          </Button>
          
          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ml-1">
                <Avatar className="h-9 w-9 border-2 border-indigo-500/40 shadow-md">
                  <AvatarImage src="/assets/avatar.png" alt={user?.firstName || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-[#1f1f3a] border border-indigo-900/50 shadow-xl" align="end" forceMount>
              <DropdownMenuLabel className="px-4 py-3 border-b border-indigo-900/20 bg-gradient-to-r from-indigo-900/40 to-purple-900/30">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-indigo-300/80">
                    {user?.email || user?.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <div className="py-2">
                <DropdownMenuItem 
                  className="px-4 py-2 text-indigo-100 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer"
                  onClick={() => window.location.href = '/user-profile'}
                >
                  <User className="mr-3 h-4 w-4 text-indigo-300" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="px-4 py-2 text-indigo-100 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer"
                  onClick={() => window.location.href = '/chat'}
                >
                  <MessageSquare className="mr-3 h-4 w-4 text-indigo-300" />
                  <span>Messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="px-4 py-2 text-indigo-100 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer"
                  onClick={() => window.location.href = '/settings'}
                >
                  <Settings className="mr-3 h-4 w-4 text-indigo-300" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="border-t border-indigo-900/20 my-0" />
              <div className="py-2">
                <DropdownMenuItem className="px-4 py-2 text-indigo-100 hover:bg-indigo-900/20 focus:bg-indigo-900/30 cursor-pointer" onClick={handleLogout}>
                  <LogOut className="mr-3 h-4 w-4 text-indigo-300" />
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
            <Button variant="ghost" size="icon" className="text-indigo-300 hover:text-white hover:bg-indigo-800/30 rounded-full ml-1">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </HelpTooltip>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-6 py-2.5 border-b border-indigo-900/10 flex items-center text-sm bg-[#1c2144]/40 backdrop-blur-sm">
        <Link href="/" className="text-indigo-400 hover:text-white font-medium flex items-center transition-colors duration-200">
          <Home className="h-3.5 w-3.5 mr-1" />
          Home
        </Link>
        <ChevronRight className="h-3 w-3 mx-2 text-indigo-600" />
        <span className="text-indigo-200 font-medium">{title}</span>
      </div>
    </header>
  );
};

export default Header;
