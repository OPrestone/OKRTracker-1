import { useState } from "react";
import { QuickStats } from "@/components/dashboard/quick-stats";
import { GetStartedGuide } from "@/components/quick-start/get-started-guide";
import { SetupWorkflow } from "@/components/quick-start/setup-workflow";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { TeamPerformance } from "@/components/dashboard/team-performance";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings"; 
import { ResourcesSection } from "@/components/dashboard/resources-section";
import { AdditionalResources } from "@/components/resources/additional-resources";
import { MissionStatement } from "@/components/mission-statement";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Sparkles, FileEdit, Menu } from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <DashboardLayout title="Dashboard" subtitle="Manage your objectives and key results">
    <div className="flex h-screen overflow-hidden bg-[#f9fafb] text-[#495057]">
   
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 pb-24">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Welcome to your OKR Dashboard</h1>
              <p className="text-neutral-600">Track your objectives and key results in one place</p>
            </div>
            <div className="flex gap-3">
              <SetupWorkflow />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create OKR
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/create-objective">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      <span>Create OKRs Manually</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/create-okr-ai">
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span>Create OKRs with AI</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href="/create-draft-okr">
                      <FileEdit className="mr-2 h-4 w-4" />
                      <span>Create Draft OKRs</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Quick Get Started Guide */}
          <GetStartedGuide />

          {/* Recent Progress Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ProgressChart />
            <TeamPerformance />
            <UpcomingMeetings />
          </div>

          {/* Mission Statement Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Company Mission</h2>
            <MissionStatement />
          </div>
 

          {/* Resources Section */}
          <ResourcesSection />

          {/* Additional Resources Section */}
          <AdditionalResources />
          
          {/* Footer */}
          <footer className="border-t border-gray-200 bg-white py-4 px-6 text-center text-sm text-gray-600 mt-8">
            <p>OKR Management Platform © {new Date().getFullYear()} - Powered by 
 Pinnacle</p>
          </footer>
        </div>
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
    </DashboardLayout>
  );
}
