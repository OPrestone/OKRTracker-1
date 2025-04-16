import { useState } from "react";
import { 
  Bell, 
  Search, 
  HelpCircle, 
  Menu,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  title: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header = ({ title, sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const [searchValue, setSearchValue] = useState("");

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
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              className="w-64 bg-gray-100 text-sm focus:bg-white"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" />
          </div>
          
          <Button variant="ghost" size="icon" className="text-gray-500 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-gray-500">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center text-sm">
        <Link href="/">
          <a className="text-primary hover:underline">Home</a>
        </Link>
        <ChevronRight className="h-3 w-3 mx-2 text-gray-400" />
        <span className="text-gray-500">{title}</span>
      </div>
    </header>
  );
};

export default Header;
