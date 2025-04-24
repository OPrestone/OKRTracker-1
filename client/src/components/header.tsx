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
  LogOut
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
    <header className="bg-background border-b shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Search */}
          <SearchDialog />
          
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Get Started Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="hidden md:flex items-center gap-1.5 bg-primary/5 hover:bg-primary/10 border-none"
            onClick={() => onboarding.toggleGetStartedMenu()}
          >
            <Rocket className="h-4 w-4 text-primary" />
            <span>Get Started</span>
          </Button>
          
          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary/20">
                  <AvatarImage src="/assets/avatar.png" alt={user?.firstName || 'User'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || user?.username}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Help */}
          <HelpTooltip
            id={dashboardHelp.id}
            title={dashboardHelp.title}
            description={dashboardHelp.description}
          >
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </HelpTooltip>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-6 py-2 bg-muted/10 border-b flex items-center text-sm">
        <Link href="/" className="text-primary hover:underline">Home</Link>
        <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
        <span className="text-muted-foreground">{title}</span>
      </div>
    </header>
  );
};

export default Header;
