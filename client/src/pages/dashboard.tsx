import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import StatsCard from "@/components/dashboard/stats-card";
import ObjectiveCard from "@/components/dashboard/objective-card";
import TeamCard from "@/components/dashboard/team-card";
import CheckInTable from "@/components/dashboard/check-in-table";
import { HelpTooltip } from "@/components/help/tooltip";
import { useHelp } from "@/hooks/use-help-context";
import { 
  dashboardHelp,
  objectivesHelp,
  teamsHelp,
  checkInsHelp,
  newObjectiveHelp
} from "@/components/help/help-content";
import { CreateObjectiveForm } from "@/components/objectives/create-objective-form";

import { 
  Target, 
  CheckCircle,
  Users,
  User,
  Building,
  Code,
  LineChart,
  ChevronDown,
  Calendar,
  Download,
  Plus,
  PlusCircle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

const Dashboard = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [timeframeFilter, setTimeframeFilter] = useState("Q3 2023");
  const [teamFilter, setTeamFilter] = useState("All Teams");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [isNewObjectiveOpen, setIsNewObjectiveOpen] = useState(false);
  
  // Access the help context
  const { markOverviewSeen } = useHelp();
  
  // Mark the dashboard overview as seen when the component mounts
  useEffect(() => {
    markOverviewSeen();
  }, [markOverviewSeen]);
  
  // Stats data
  const stats = [
    {
      title: "Total Objectives",
      value: 24,
      icon: <Target className="text-xl text-primary" />,
      iconClass: "bg-blue-100",
      change: {
        value: "12%",
        type: "increase" as const,
        label: "vs last quarter"
      }
    },
    {
      title: "Key Results",
      value: 86,
      icon: <CheckCircle className="text-xl text-green-500" />,
      iconClass: "bg-green-100",
      change: {
        value: "8%",
        type: "increase" as const,
        label: "vs last quarter"
      }
    },
    {
      title: "Teams",
      value: 8,
      icon: <Users className="text-xl text-amber-500" />,
      iconClass: "bg-amber-100",
      change: {
        value: "2",
        type: "increase" as const,
        label: "new this quarter"
      }
    },
    {
      title: "Active Users",
      value: 42,
      icon: <User className="text-xl text-indigo-500" />,
      iconClass: "bg-indigo-100",
      change: {
        value: "3%",
        type: "decrease" as const,
        label: "activity drop"
      }
    }
  ];
  
  // Objectives data
  const objectives = [
    {
      id: 1,
      title: "Expand global market presence",
      description: "Focus on establishing a strong presence in key international markets through localized products and strategic partnerships.",
      type: "Company",
      status: "On Track",
      owner: {
        name: "Sarah Johnson",
        role: "CEO"
      },
      timeframe: "Q3 2023",
      progress: 75,
      keyResults: [
        {
          id: 1,
          title: "Grow website traffic from international users by 40%",
          progress: 80,
          status: "on_track",
          color: "#10B981"
        },
        {
          id: 2,
          title: "Launch product in 3 new international markets",
          progress: 66,
          status: "on_track",
          color: "#F59E0B"
        },
        {
          id: 3,
          title: "Establish 5 new strategic partnerships",
          progress: 60,
          status: "on_track",
          color: "#3B82F6"
        }
      ]
    },
    {
      id: 2,
      title: "Improve customer experience and satisfaction",
      description: "Enhance the overall customer journey across all digital platforms to improve retention and satisfaction metrics.",
      type: "Company",
      status: "At Risk",
      owner: {
        name: "Michael Chen",
        role: "CXO"
      },
      timeframe: "Q3 2023",
      progress: 45,
      keyResults: [
        {
          id: 4,
          title: "Increase Net Promoter Score from 50 to 70",
          progress: 70,
          status: "on_track",
          color: "#10B981"
        },
        {
          id: 5,
          title: "Reduce average customer support response time from 24 hours to 6 hours",
          progress: 30,
          status: "behind",
          color: "#EF4444"
        },
        {
          id: 6,
          title: "Increase customer retention rate from 80% to 90%",
          progress: 50,
          status: "at_risk",
          color: "#F59E0B"
        }
      ]
    }
  ];
  
  // Teams data
  const teams = [
    {
      id: 1,
      name: "Marketing Team",
      memberCount: 8,
      progress: 72,
      icon: <Building className="text-lg text-primary" />,
      iconBgColor: "#EFF6FF",
      iconColor: "#3B82F6",
      objectives: [
        {
          id: 1,
          title: "Increase brand awareness",
          progress: 85,
          status: "on_track"
        },
        {
          id: 2,
          title: "Launch new content strategy",
          progress: 60,
          status: "at_risk"
        },
        {
          id: 3,
          title: "Improve social engagement",
          progress: 78,
          status: "on_track"
        }
      ]
    },
    {
      id: 2,
      name: "Product Team",
      memberCount: 12,
      progress: 65,
      icon: <Code className="text-lg text-purple-500" />,
      iconBgColor: "#F3F4F6",
      iconColor: "#8B5CF6",
      objectives: [
        {
          id: 4,
          title: "Launch new mobile app",
          progress: 90,
          status: "on_track"
        },
        {
          id: 5,
          title: "Reduce load time by 30%",
          progress: 35,
          status: "behind"
        },
        {
          id: 6,
          title: "Improve user retention",
          progress: 48,
          status: "at_risk"
        }
      ]
    },
    {
      id: 3,
      name: "Sales Team",
      memberCount: 6,
      progress: 89,
      icon: <LineChart className="text-lg text-green-500" />,
      iconBgColor: "#ECFDF5",
      iconColor: "#10B981",
      objectives: [
        {
          id: 7,
          title: "Increase quarterly revenue",
          progress: 92,
          status: "on_track"
        },
        {
          id: 8,
          title: "Expand customer base",
          progress: 85,
          status: "on_track"
        },
        {
          id: 9,
          title: "Optimize sales process",
          progress: 75,
          status: "on_track"
        }
      ]
    }
  ];
  
  // Check-ins data
  const checkIns = [
    {
      id: 1,
      user: {
        name: "Emily Chen",
        role: "Marketing Lead",
        initials: "EC"
      },
      team: "Marketing",
      objective: "Increase brand awareness in key markets",
      progress: 78,
      date: "Aug 25, 2023"
    },
    {
      id: 2,
      user: {
        name: "Alex Rodriguez",
        role: "Product Manager",
        initials: "AR"
      },
      team: "Product",
      objective: "Launch mobile application with core functionality",
      progress: 65,
      date: "Aug 24, 2023"
    },
    {
      id: 3,
      user: {
        name: "David Kim",
        role: "Sales Director",
        initials: "DK"
      },
      team: "Sales",
      objective: "Increase quarterly revenue by 25%",
      progress: 92,
      date: "Aug 23, 2023"
    }
  ];

  const handleViewObjective = (id: number) => {
    toast({
      title: "Viewing Objective",
      description: `You're viewing objective #${id}`,
    });
  };

  const handleEditObjective = (id: number) => {
    toast({
      title: "Editing Objective",
      description: `You're editing objective #${id}`,
    });
  };

  const handleViewTeam = (id: number) => {
    navigate(`/teams`);
  };

  const handleViewCheckIn = (id: number) => {
    navigate(`/checkins`);
  };

  const handleExport = () => {
    toast({
      title: "Exporting Data",
      description: "Your data is being exported.",
    });
  };

  return (
    <DashboardLayout title="Dashboard">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconClass={stat.iconClass}
            change={stat.change}
          />
        ))}
      </div>
      
      {/* Filters / Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Q3 2023">Timeframe: Q3 2023</SelectItem>
                  <SelectItem value="Q4 2023">Timeframe: Q4 2023</SelectItem>
                  <SelectItem value="Annual 2023">Timeframe: Annual 2023</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="min-w-[180px]">
                <SelectValue placeholder="Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="All Teams">Teams: All Teams</SelectItem>
                  <SelectItem value="Marketing">Teams: Marketing</SelectItem>
                  <SelectItem value="Product">Teams: Product</SelectItem>
                  <SelectItem value="Sales">Teams: Sales</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="All">Status: All</SelectItem>
                  <SelectItem value="On Track">Status: On Track</SelectItem>
                  <SelectItem value="At Risk">Status: At Risk</SelectItem>
                  <SelectItem value="Behind">Status: Behind</SelectItem>
                  <SelectItem value="Completed">Status: Completed</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <div className="flex items-center gap-2">
              <Dialog open={isNewObjectiveOpen} onOpenChange={setIsNewObjectiveOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Objective
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Objective</DialogTitle>
                    <DialogDescription>
                      Create a new objective with key results to track your progress.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <CreateObjectiveForm 
                      onSuccess={() => setIsNewObjectiveOpen(false)}
                      onCancel={() => setIsNewObjectiveOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
              
              <HelpTooltip
                id={newObjectiveHelp.id}
                title={newObjectiveHelp.title}
                description={newObjectiveHelp.description}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* OKR Overview Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Company Objectives Overview</h2>
          <HelpTooltip 
            id={objectivesHelp.id}
            title={objectivesHelp.title}
            description={objectivesHelp.description}
          />
        </div>
        
        {objectives.map((objective) => (
          <ObjectiveCard
            key={objective.id}
            id={objective.id}
            title={objective.title}
            description={objective.description}
            type={objective.type}
            status={objective.status}
            owner={objective.owner}
            timeframe={objective.timeframe}
            progress={objective.progress}
            keyResults={objective.keyResults}
            onView={handleViewObjective}
            onEdit={handleEditObjective}
          />
        ))}
      </div>
      
      {/* Team Performance */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Team Performance</h2>
            <HelpTooltip 
              id={teamsHelp.id}
              title={teamsHelp.title}
              description={teamsHelp.description}
            />
          </div>
          <Button variant="link" onClick={() => navigate("/teams")}>
            View All Teams
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              id={team.id}
              name={team.name}
              memberCount={team.memberCount}
              progress={team.progress}
              icon={team.icon}
              iconBgColor={team.iconBgColor}
              iconColor={team.iconColor}
              objectives={team.objectives}
              onViewDetails={handleViewTeam}
            />
          ))}
        </div>
      </div>
      
      {/* Recent Check-ins */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Recent Check-ins</h2>
            <HelpTooltip 
              id={checkInsHelp.id}
              title={checkInsHelp.title}
              description={checkInsHelp.description}
            />
          </div>
          <Button variant="link" onClick={() => navigate("/checkins")}>
            View All Check-ins
          </Button>
        </div>
        
        <CheckInTable
          checkIns={checkIns}
          totalCount={18}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onViewCheckIn={handleViewCheckIn}
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
