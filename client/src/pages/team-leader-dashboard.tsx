import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  CheckSquare, 
  Calendar, 
  Target, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare,
  Edit,
  ChevronRight,
  User,
  Users
} from "lucide-react";

// Types for our team leader dashboard
interface KeyResult {
  id: number;
  title: string;
  progress: number;
  dueDate?: string;
}

interface Objective {
  id: number;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  keyResults: KeyResult[];
  owner: {
    name: string;
    initials: string;
  };
}

interface CheckIn {
  id: number;
  objective: string;
  user: {
    name: string;
    initials: string;
  };
  date: string;
  notes: string;
}

interface Task {
  id: number;
  title: string;
  status: "pending" | "completed";
  dueDate: string;
  priority: "low" | "medium" | "high";
}

// Generate placeholder data
const myObjectives: Objective[] = [
  {
    id: 1,
    title: "Improve team collaboration effectiveness",
    description: "Implement tools and processes to enhance cross-functional collaboration",
    progress: 65,
    dueDate: "September 30, 2023",
    owner: {
      name: "Alex Johnson",
      initials: "AJ"
    },
    keyResults: [
      { id: 101, title: "Conduct 5 cross-team workshops", progress: 80 },
      { id: 102, title: "Implement new project management system", progress: 55 },
      { id: 103, title: "Achieve 90% attendance in team meetings", progress: 60 }
    ]
  },
  {
    id: 2,
    title: "Reduce customer support response time",
    description: "Optimize support processes to improve response times",
    progress: 42,
    dueDate: "October 15, 2023",
    owner: {
      name: "Sarah Chen",
      initials: "SC"
    },
    keyResults: [
      { id: 201, title: "Implement ticket prioritization system", progress: 90 },
      { id: 202, title: "Reduce average response time from 24h to 4h", progress: 30 },
      { id: 203, title: "Increase first-contact resolution rate to 75%", progress: 20 }
    ]
  },
  {
    id: 3,
    title: "Launch new product feature set",
    description: "Complete development and release of Q3 feature priorities",
    progress: 88,
    dueDate: "September 15, 2023",
    owner: {
      name: "Michael Brown",
      initials: "MB"
    },
    keyResults: [
      { id: 301, title: "Complete feature development", progress: 100 },
      { id: 302, title: "Conduct user acceptance testing", progress: 85 },
      { id: 303, title: "Prepare marketing materials for launch", progress: 80 }
    ]
  }
];

const recentCheckIns: CheckIn[] = [
  {
    id: 1,
    objective: "Improve team collaboration effectiveness",
    user: {
      name: "Chris Wilson",
      initials: "CW"
    },
    date: "Today, 10:30 AM",
    notes: "Completed the third workshop with design team. Great progress on alignment!"
  },
  {
    id: 2,
    objective: "Launch new product feature set",
    user: {
      name: "Jasmine Lee",
      initials: "JL"
    },
    date: "Yesterday, 3:45 PM",
    notes: "User testing complete with 92% positive feedback. Ready for final review."
  },
  {
    id: 3,
    objective: "Reduce customer support response time",
    user: {
      name: "Tom Harris",
      initials: "TH"
    },
    date: "August 25, 2023",
    notes: "New ticket system implemented. Training scheduled for next week."
  }
];

const pendingTasks: Task[] = [
  {
    id: 1,
    title: "Review Q3 objectives progress",
    status: "pending",
    dueDate: "Today",
    priority: "high"
  },
  {
    id: 2,
    title: "Prepare department budget report",
    status: "pending",
    dueDate: "Tomorrow",
    priority: "high"
  },
  {
    id: 3,
    title: "Meet with marketing team about campaign",
    status: "pending",
    dueDate: "Sep 2, 2023",
    priority: "medium"
  },
  {
    id: 4,
    title: "Conduct performance reviews",
    status: "pending",
    dueDate: "Sep 10, 2023",
    priority: "medium"
  }
];

const activeTasks: Task[] = [
  {
    id: 5,
    title: "Finalize product roadmap",
    status: "pending",
    dueDate: "Sep 5, 2023",
    priority: "high"
  },
  {
    id: 6,
    title: "Review support team metrics",
    status: "pending",
    dueDate: "Sep 3, 2023",
    priority: "medium"
  },
  {
    id: 7,
    title: "Update team OKRs",
    status: "pending",
    dueDate: "Sep 8, 2023",
    priority: "high"
  }
];

export default function TeamLeaderDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Helper function to determine progress color based on value
  const getProgressColorClass = (progress: number): string => {
    if (progress >= 76) return "text-green-600";
    if (progress >= 51) return "text-yellow-600";
    if (progress >= 26) return "text-orange-600";
    return "text-red-600";
  };

  // Helper function to determine border color for cards
  const getCardBorderClass = (progress: number): string => {
    if (progress >= 76) return "border-l-green-500";
    if (progress >= 51) return "border-l-yellow-500";
    if (progress >= 26) return "border-l-orange-500";
    return "border-l-red-500";
  };

  // Helper function for priority badges
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title="Team Leader Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Overview</h1>
        <p className="text-muted-foreground">
          Track your team's performance, progress, and pending tasks
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="objectives">
            <Target className="h-4 w-4 mr-2" />
            Objectives
          </TabsTrigger>
          <TabsTrigger value="checkins">
            <CheckSquare className="h-4 w-4 mr-2" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <Calendar className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{myObjectives.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {myObjectives.filter(obj => obj.progress >= 75).length} on track
                </p>
                <div className="mt-4 flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs">On track</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">At risk</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <span className="text-xs">Behind</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingTasks.filter(task => task.priority === "high").length} high priority
                </p>
                <div className="mt-4 flex items-center">
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    <Clock className="h-3 w-3 mr-1 text-amber-500" />
                    View all tasks
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Check-ins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recentCheckIns.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last check-in: {recentCheckIns[0].date}
                </p>
                <div className="mt-4 flex items-center">
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    <MessageSquare className="h-3 w-3 mr-1 text-blue-500" />
                    View all check-ins
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">
                  6 active this week
                </p>
                <div className="mt-4 flex items-center">
                  <Button variant="ghost" size="sm" className="text-xs p-0 h-auto">
                    <Users className="h-3 w-3 mr-1 text-indigo-500" />
                    View team
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* My Objectives */}
            <Card className="col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>My Objectives</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <CardDescription>Track your current objectives and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myObjectives.map((objective) => (
                    <div 
                      key={objective.id} 
                      className={`p-4 border-l-4 ${getCardBorderClass(objective.progress)} rounded-md bg-white shadow-sm`}
                    >
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-sm">{objective.title}</h4>
                        <span className={`font-semibold text-sm ${getProgressColorClass(objective.progress)}`}>
                          {objective.progress}%
                        </span>
                      </div>
                      <Progress value={objective.progress} className="h-2 mb-3" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">{objective.owner.initials}</AvatarFallback>
                          </Avatar>
                          <span>{objective.owner.name}</span>
                        </div>
                        <span>Due: {objective.dueDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Check-ins */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Recent Check-ins</CardTitle>
                <CardDescription>Latest progress updates from your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-1">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">{checkIn.user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{checkIn.user.name}</p>
                          <p className="text-xs text-gray-500 mb-1">{checkIn.date}</p>
                          <p className="text-xs font-medium text-indigo-600 mb-1">{checkIn.objective}</p>
                          <p className="text-xs">{checkIn.notes}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Pending Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Tasks</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <CardDescription>Your upcoming tasks and deadlines</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-300" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Active Tasks</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
                <CardDescription>Tasks currently in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Objectives</CardTitle>
              <CardDescription>All objectives you own or are responsible for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {myObjectives.map((objective) => (
                  <div key={objective.id} className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{objective.title}</h3>
                        <p className="text-sm text-gray-600">{objective.description}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getProgressColorClass(objective.progress)}`}>
                          {objective.progress}%
                        </div>
                        <div className="text-xs text-gray-500">Due: {objective.dueDate}</div>
                      </div>
                    </div>
                    <Progress value={objective.progress} className="h-2" />
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="font-medium text-sm mb-3">Key Results</h4>
                      <div className="space-y-4">
                        {objective.keyResults.map((kr) => (
                          <div key={kr.id} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="text-sm">{kr.title}</div>
                              <div className={`text-sm ${getProgressColorClass(kr.progress)}`}>
                                {kr.progress}%
                              </div>
                            </div>
                            <Progress value={kr.progress} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Check-in
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </div>
                    
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest updates and progress reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentCheckIns.map((checkIn) => (
                  <div key={checkIn.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start gap-4 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{checkIn.user.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <h3 className="font-medium">{checkIn.user.name}</h3>
                          <span className="text-xs text-gray-500">{checkIn.date}</span>
                        </div>
                        <p className="text-sm font-medium text-indigo-600 mb-2">
                          {checkIn.objective}
                        </p>
                        <p className="text-sm">{checkIn.notes}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="ghost" size="sm">Comment</Button>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Tasks</CardTitle>
                <CardDescription>Tasks awaiting completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-300" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Tasks currently in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}