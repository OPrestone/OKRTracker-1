import { 
  Bell, 
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

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ title, subtitle, sidebarOpen, setSidebarOpen }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-gray-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <SearchDialog />
          
          <Button variant="ghost" size="icon" className="text-gray-500 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          
          <ThemeToggle />
          
          <HelpTooltip
            id={dashboardHelp.id}
            title={dashboardHelp.title}
            description={dashboardHelp.description}
          >
            <Button variant="ghost" size="icon" className="text-gray-500">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </HelpTooltip>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center text-sm">
        <Link href="/" className="text-primary hover:underline">Home</Link>
        <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
        <span className="text-gray-500">{title}</span>
      </div>
    </header>
  );
};

export default Header;
