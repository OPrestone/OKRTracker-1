import { QuickStats } from "@/components/dashboard/quick-stats";
import { GetStartedGuide } from "@/components/quick-start/get-started-guide";
import { SetupWorkflow } from "@/components/quick-start/setup-workflow";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { TeamPerformance } from "@/components/dashboard/team-performance";
import { UpcomingMeetings } from "@/components/dashboard/upcoming-meetings";
import { StrategyMap } from "@/components/dashboard/strategy-map";
import { ResourcesSection } from "@/components/dashboard/resources-section";
import { AdditionalResources } from "@/components/resources/additional-resources";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { PlusCircle, Sparkles, FileEdit } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div>
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

      {/* Strategy Map Preview */}
      <StrategyMap />

      {/* Resources Section */}
      <ResourcesSection />

      {/* Additional Resources Section */}
      <AdditionalResources />
    </div>
  );
}
