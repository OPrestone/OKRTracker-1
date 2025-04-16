import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, ChevronRight, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample data
const approvedObjectives = [
  {
    id: 1,
    title: "Increase Monthly Active Users by 30%",
    description: "Focus on user acquisition and retention to grow our active user base",
    owner: { firstName: "Chris", lastName: "Parker" },
    status: "on_track",
    progress: 75,
    dueDate: "2023-12-15",
    assignedTeam: "Product Team",
    keyResults: [
      { title: "Launch 3 new user engagement features", progress: 100, status: "completed" },
      { title: "Reduce churn rate to under 5%", progress: 60, status: "on_track" },
      { title: "Increase sign-up conversion by 15%", progress: 65, status: "on_track" }
    ]
  },
  {
    id: 2,
    title: "Improve Platform Stability and Performance",
    description: "Enhance system reliability and response times across all services",
    owner: { firstName: "Taylor", lastName: "Reed" },
    status: "at_risk",
    progress: 42,
    dueDate: "2023-11-30",
    assignedTeam: "Engineering Team",
    keyResults: [
      { title: "Reduce server downtime to <0.1%", progress: 85, status: "on_track" },
      { title: "Decrease page load time by 40%", progress: 30, status: "at_risk" },
      { title: "Implement automated performance testing", progress: 15, status: "behind" }
    ]
  },
  {
    id: 3,
    title: "Launch Premium Subscription Tier",
    description: "Develop and release premium features to drive revenue growth",
    owner: { firstName: "Jordan", lastName: "Casey" },
    status: "completed",
    progress: 100,
    dueDate: "2023-09-30",
    assignedTeam: "Cross-Functional",
    keyResults: [
      { title: "Define premium feature set", progress: 100, status: "completed" },
      { title: "Implement payment processing system", progress: 100, status: "completed" },
      { title: "Achieve 500 premium subscribers in first month", progress: 100, status: "completed" }
    ]
  },
  {
    id: 4,
    title: "Expand International Presence",
    description: "Enter new markets in Asia and Europe with localized product offerings",
    owner: { firstName: "Morgan", lastName: "Zhang" },
    status: "behind",
    progress: 35,
    dueDate: "2023-12-31",
    assignedTeam: "Growth Team",
    keyResults: [
      { title: "Launch in 3 new European countries", progress: 66, status: "on_track" },
      { title: "Complete Asian market research", progress: 40, status: "at_risk" },
      { title: "Implement full localization support", progress: 0, status: "behind" }
    ]
  },
  {
    id: 5,
    title: "Enhance Security Compliance",
    description: "Achieve industry-standard security certifications",
    owner: { firstName: "Alex", lastName: "Johnson" },
    status: "on_track",
    progress: 70,
    dueDate: "2023-11-15",
    assignedTeam: "Security Team",
    keyResults: [
      { title: "Complete SOC 2 Type II audit", progress: 80, status: "on_track" },
      { title: "Implement enhanced encryption", progress: 90, status: "on_track" },
      { title: "Conduct comprehensive penetration testing", progress: 40, status: "at_risk" }
    ]
  }
];

export default function ApprovedOKRs() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on_track":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "at_risk":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "behind":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_track":
        return "bg-green-100 text-green-800";
      case "at_risk":
        return "bg-yellow-100 text-yellow-800";
      case "behind":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <DashboardLayout title="Approved OKRs">
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approved OKRs</h1>
          <p className="text-gray-600">Track and manage approved objectives and key results</p>
        </div>
        
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({approvedObjectives.length})</TabsTrigger>
          <TabsTrigger value="on_track">On Track ({approvedObjectives.filter(o => o.status === "on_track").length})</TabsTrigger>
          <TabsTrigger value="at_risk">At Risk ({approvedObjectives.filter(o => o.status === "at_risk").length})</TabsTrigger>
          <TabsTrigger value="behind">Behind ({approvedObjectives.filter(o => o.status === "behind").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({approvedObjectives.filter(o => o.status === "completed").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <ScrollArea className="h-[calc(100vh-230px)]">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-6">
              {approvedObjectives.map((objective) => (
                <Card key={objective.id} className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className={getStatusColor(objective.status)}>
                        <span className="flex items-center">
                          {getStatusIcon(objective.status)}
                          <span className="ml-1">{getStatusText(objective.status)}</span>
                        </span>
                      </Badge>
                      <span className="text-xs text-gray-500">Due: {objective.dueDate}</span>
                    </div>
                    <CardTitle className="mt-2 text-lg">{objective.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {objective.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-0">
                    <div className="flex items-center gap-1.5 mt-1 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{`${objective.owner.firstName[0]}${objective.owner.lastName[0]}`}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{objective.owner.firstName} {objective.owner.lastName}</span>
                      <span className="text-xs text-gray-400 mx-1">•</span>
                      <span className="text-xs text-gray-600">{objective.assignedTeam}</span>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Progress</span>
                        <span>{objective.progress}%</span>
                      </div>
                      <Progress value={objective.progress} className="h-2" />
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Key Results</h4>
                      <ul className="space-y-2">
                        {objective.keyResults.map((kr, idx) => (
                          <li key={idx} className="text-sm">
                            <div className="flex items-center gap-1.5 mb-1">
                              {getStatusIcon(kr.status)}
                              <span className="text-gray-700">{kr.title}</span>
                            </div>
                            <Progress value={kr.progress} className="h-1.5 bg-gray-100" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <div className="px-6 pt-2 pb-4 mt-auto">
                    <Button size="sm" variant="ghost" className="w-full text-sm">
                      View Details <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {["on_track", "at_risk", "behind", "completed"].map(status => (
          <TabsContent key={status} value={status} className="mt-0">
            <ScrollArea className="h-[calc(100vh-230px)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-6">
                {approvedObjectives
                  .filter(obj => obj.status === status)
                  .map((objective) => (
                    <Card key={objective.id} className="h-full flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <Badge className={getStatusColor(objective.status)}>
                            <span className="flex items-center">
                              {getStatusIcon(objective.status)}
                              <span className="ml-1">{getStatusText(objective.status)}</span>
                            </span>
                          </Badge>
                          <span className="text-xs text-gray-500">Due: {objective.dueDate}</span>
                        </div>
                        <CardTitle className="mt-2 text-lg">{objective.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {objective.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 pb-0">
                        <div className="flex items-center gap-1.5 mt-1 mb-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{`${objective.owner.firstName[0]}${objective.owner.lastName[0]}`}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600">{objective.owner.firstName} {objective.owner.lastName}</span>
                          <span className="text-xs text-gray-400 mx-1">•</span>
                          <span className="text-xs text-gray-600">{objective.assignedTeam}</span>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Progress</span>
                            <span>{objective.progress}%</span>
                          </div>
                          <Progress value={objective.progress} className="h-2" />
                        </div>
                        
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Key Results</h4>
                          <ul className="space-y-2">
                            {objective.keyResults.map((kr, idx) => (
                              <li key={idx} className="text-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                  {getStatusIcon(kr.status)}
                                  <span className="text-gray-700">{kr.title}</span>
                                </div>
                                <Progress value={kr.progress} className="h-1.5 bg-gray-100" />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                      <div className="px-6 pt-2 pb-4 mt-auto">
                        <Button size="sm" variant="ghost" className="w-full text-sm">
                          View Details <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </DashboardLayout>
  );
}
