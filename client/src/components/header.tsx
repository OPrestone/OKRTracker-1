import { 
  HelpCircle, 
  Menu,
  ChevronRight,
  Moon,
  Sun,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SearchDialog } from "@/components/search/search-dialog";
import { HelpTooltip } from "@/components/help/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { dashboardHelp } from "@/components/help/help-content";
import NotificationDropdown from "@/components/notifications/notification-dropdown";

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ title, subtitle, sidebarOpen, setSidebarOpen }: HeaderProps) => {
  return (
    <header className="bg-background border-b border-border shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-4">
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
        
        <div className="flex items-center space-x-4">
          <SearchDialog />
          
          <NotificationDropdown />
          
          <ThemeToggle />
          
          <HelpTooltip
            id={dashboardHelp.id}
            title={dashboardHelp.title}
            description={dashboardHelp.description}
          >
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </HelpTooltip>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center text-sm">
        <Link href="/" className="text-primary hover:underline">Home</Link>
        <ChevronRight className="h-3 w-3 mx-2 text-muted-foreground" />
        <span className="text-muted-foreground">{title}</span>
      </div>
    </header>
  );
};

export default Header;
