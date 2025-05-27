import React, { useState } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { HelpTooltip } from "@/components/help/tooltip";
import { dashboardHelp } from "@/components/help/help-content";
import { Menu, Building } from "lucide-react";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Badge } from "@/components/ui/badge";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title = "Dashboard",
  subtitle
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentTenant } = useTenantContext();

  // Create tenant-aware title that shows organization context
  const tenantDisplay = currentTenant 
    ? `${title} - ${currentTenant.display_name || currentTenant.name}`
    : title;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] text-[#495057]">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto relative">
        <Header 
          title={tenantDisplay}
          subtitle={subtitle}
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        
        {/* Organization context banner */}
        {currentTenant && (
          <div className="bg-primary/10 border-b border-primary/20 px-6 py-2 flex items-center">
            <Building className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary mr-2">Current Organization:</span>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {currentTenant.display_name || currentTenant.name}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">ID: {currentTenant.id}</span>
          </div>
        )}
        <div className="px-6 py-6 pb-24">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-sm text-gray-600">
          <p>OKR Management Platform © {new Date().getFullYear()} - Powered by 
 Pinnacle</p>
        </footer>
      </main>

      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="bg-indigo-600 text-white rounded-full p-3 shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

export default DashboardLayout;
