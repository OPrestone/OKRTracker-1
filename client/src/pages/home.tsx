import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  PlusCircle, 
  Target, 
  AlertTriangle, 
  Users, 
  CheckCircle, 
  Flag, 
  Rocket, 
  Award, 
  BarChart3, 
  Clock, 
  Zap, 
  ChevronRight, 
  MessageSquare, 
  Calendar, 
  ArrowUpRight, 
  BarChart2, 
  ArrowRight, 
  ListChecks, 
  Eye, 
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Objective, KeyResult } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const Home = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch user's objectives
  const { data: userObjectives, isLoading: objectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/users", user?.id, "objectives"],
    enabled: !!user,
  });

  // Fetch team objectives if user has a team
  const { data: teamObjectives, isLoading: teamObjectivesLoading } = useQuery<Objective[]>({
    queryKey: ["/api/teams", user?.teamId, "objectives"],
    enabled: !!user?.teamId,
  });

  // Fetch key results for the first objective (for demonstration)
  const { data: keyResults, isLoading: keyResultsLoading } = useQuery<KeyResult[]>({
    queryKey: ["/api/objectives", userObjectives?.[0]?.id, "key-results"],
    enabled: !!(userObjectives && userObjectives.length > 0),
  });

  // Fetch recent check-ins
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ["/api/check-ins"],
  });
  
  // Helper for greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <DashboardLayout title="Home">
      {/* Welcome Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{getGreeting()}, {user?.firstName || 'there'}!</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              View Calendar
            </Button>
            <Button size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Create Objective
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Dashboard Navigation */}
      <Tabs defaultValue="dashboard" onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-4 h-12 items-stretch">
          <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
            <span className="sm:hidden">Home</span>
          </TabsTrigger>
          <TabsTrigger value="okrs" className="flex items-center justify-center gap-2">
            <Target className="h-4 w-4" />
            <span>OKRs</span>
          </TabsTrigger>
          <TabsTrigger value="checkins" className="flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Check-ins</span>
            <span className="sm:hidden">Updates</span>
          </TabsTrigger>
          <TabsTrigger value="mission" className="flex items-center justify-center gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">Company Vision</span>
            <span className="sm:hidden">Vision</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab Content */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Status summary cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary-50 to-white border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium tracking-tight text-muted-foreground">My Objectives</h3>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">
                    {userObjectives?.length || 0}
                  </div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    active
                  </div>
                  <span className="ml-auto text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    On Track
                  </span>
                </div>
                <Separator className="my-3 bg-primary/10" />
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {userObjectives && userObjectives.length > 0
                      ? Math.round(userObjectives.reduce((sum, obj) => sum + obj.progress, 0) / userObjectives.length)
                      : 0}%
                  </span>
                </div>
                <Progress className="h-1.5 mt-2" value={userObjectives && userObjectives.length > 0
                      ? Math.round(userObjectives.reduce((sum, obj) => sum + obj.progress, 0) / userObjectives.length)
                      : 0} />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Team Objectives</h3>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">
                    {teamObjectives?.length || 0}
                  </div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    active
                  </div>
                  <span className="ml-auto text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    At Risk
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Overall Progress</span>
                  <span className="font-medium">
                    {teamObjectives && teamObjectives.length > 0
                      ? Math.round(teamObjectives.reduce((sum, obj) => sum + obj.progress, 0) / teamObjectives.length)
                      : 0}%
                  </span>
                </div>
                <Progress className="h-1.5 mt-2" value={teamObjectives && teamObjectives.length > 0
                      ? Math.round(teamObjectives.reduce((sum, obj) => sum + obj.progress, 0) / teamObjectives.length)
                      : 0} />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Key Results</h3>
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">
                    {keyResults?.length || 0}
                  </div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    total
                  </div>
                  <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    On Track
                  </span>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>Progress This Week</span>
                  <span className="font-medium text-green-600">+12%</span>
                </div>
                <Progress className="h-1.5 mt-2" value={70} />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="text-sm font-medium tracking-tight text-muted-foreground">Recent Check-ins</h3>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold">
                    {checkIns?.length || 0}
                  </div>
                  <div className="ml-2 text-sm text-muted-foreground">
                    this week
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Last check-in</span>
                    <span className="font-medium">
                      {checkIns && checkIns.length > 0 
                       ? new Date(checkIns[0].createdAt).toLocaleDateString() 
                       : 'N/A'}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-4 h-8 text-xs" asChild>
                  <Link to="/check-ins">
                    <Eye className="mr-2 h-3 w-3" />
                    View All Check-ins
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Middle row with my objectives and team activity */}
          <div className="grid gap-6 md:grid-cols-7">
            {/* Objectives column */}
            <Card className="md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-medium">My Progress</CardTitle>
                  <CardDescription>Your active objectives and their current status</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/my-okrs">View All</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {objectivesLoading ? (
                  <div className="p-6 flex justify-center">
                    <div className="animate-pulse space-y-4 w-full">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded"></div>
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  </div>
                ) : userObjectives && userObjectives.length > 0 ? (
                  <div className="divide-y">
                    {userObjectives.slice(0, 3).map((objective) => (
                      <div key={objective.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="space-y-1">
                            <Link to={`/objectives/${objective.id}`} className="font-medium hover:underline">
                              {objective.title}
                            </Link>
                            <div className="flex gap-2 items-center">
                              <Badge variant={
                                objective.status === 'On Track' ? 'default' : 
                                objective.status === 'At Risk' ? 'warning' : 
                                objective.status === 'Behind' ? 'destructive' : 
                                objective.status === 'Completed' ? 'success' : 'outline'
                              } className="text-[10px] font-normal px-2 py-0 h-5">
                                {objective.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Q2 2024
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-medium">{objective.progress}%</span>
                        </div>
                        <Progress value={objective.progress} className="h-1.5" />
                      </div>
                    ))}
                    {userObjectives.length > 3 && (
                      <div className="p-3 text-center">
                        <Button variant="link" size="sm" asChild>
                          <Link to="/my-okrs">
                            View all {userObjectives.length} objectives
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No objectives yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Create your first objective to start tracking progress</p>
                    <Button size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Objective
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Team Activity column */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-medium">Team Activity</CardTitle>
                  <CardDescription>Recent updates from your team</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {checkIns && Array.isArray(checkIns) && checkIns.length > 0 ? (
                    <>
                      {checkIns.slice(0, 4).map((checkIn: any, index: number) => (
                        <div key={checkIn.id || index} className="flex items-start gap-3 p-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {checkIn.userId ? "US" : "UK"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="text-sm">
                              <span className="font-medium">User {checkIn.userId}</span>
                              {' updated '}
                              {checkIn.objectiveId ? "objective" : "key result"} progress to {' '}
                              <span className="font-medium">{checkIn.progress}%</span>
                            </p>
                            {checkIn.notes && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{checkIn.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {checkIn.createdAt ? new Date(checkIn.createdAt).toLocaleString() : 'Recent'}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div className="p-3 text-center">
                        <Button variant="link" size="sm" asChild>
                          <Link to="/checkins">
                            View all check-ins
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                      <div className="rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">No recent activity</h3>
                      <p className="text-sm text-muted-foreground mb-4">Team updates will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Bottom row with quick links and upcoming items */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/company-okrs">
                    <Target className="h-5 w-5 mb-1 text-primary" />
                    Company OKRs
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/quick-start-guide">
                    <Rocket className="h-5 w-5 mb-1 text-primary" />
                    Quick Start Guide
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/reports">
                    <BarChart2 className="h-5 w-5 mb-1 text-primary" />
                    Reports
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/one-on-one-meetings">
                    <UserCircle className="h-5 w-5 mb-1 text-primary" />
                    1:1 Meetings
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/ai-recommendations">
                    <Zap className="h-5 w-5 mb-1 text-primary" />
                    AI Suggestions
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-1 font-normal" asChild>
                  <Link to="/team-performance">
                    <Award className="h-5 w-5 mb-1 text-primary" />
                    Team Performance
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            {/* Upcoming Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upcoming</CardTitle>
                  <CardDescription>Approaching deadlines and events</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/40 rounded-lg p-3 border border-border/70">
                    <div className="flex gap-4 items-start">
                      <div className="bg-primary/15 text-primary rounded p-2 w-10 h-10 flex items-center justify-center font-medium text-sm">
                        15
                        <span className="text-[10px] ml-0.5">MAY</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Q2 OKR Planning Session</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Review and finalize Q2 objectives</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4">10:00 AM</Badge>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Users className="h-3 w-3" />
                            Team Meeting
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200/70">
                    <div className="flex gap-4 items-start">
                      <div className="bg-yellow-100 text-yellow-700 rounded p-2 w-10 h-10 flex items-center justify-center font-medium text-sm">
                        22
                        <span className="text-[10px] ml-0.5">MAY</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-yellow-800">Objective Deadline</h4>
                        <p className="text-xs text-yellow-700/80 mt-0.5">Increase user engagement by 25%</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="bg-yellow-100 border-yellow-200 text-yellow-800 text-[10px] font-normal px-1.5 py-0 h-4">Critical</Badge>
                          <span className="flex items-center gap-1 text-[10px] text-yellow-700/70">
                            <Clock className="h-3 w-3" />
                            3 days remaining
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full">
                    View All Upcoming Items
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mission Tab */}
        <TabsContent value="mission" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-600">
                  Our mission is to create excellent products that delight our customers, 
                  while fostering a collaborative and innovative work environment.
                </p>
                <h3 className="text-lg font-medium mt-6">Company Pillars</h3>
                <ul className="mt-4 space-y-2">
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Customer-centricity in all decisions</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Innovation and continuous improvement</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Data-driven strategy and execution</span>
                  </li>
                  <li className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-2"></span>
                    <span>Collaboration across all teams</span>
                  </li>
                </ul>

                <div className="mt-8">
                  <Button variant="outline">Edit Mission</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OKRs Tab */}
        <TabsContent value="okrs" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">My Objectives</h2>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Objective
            </Button>
          </div>

          {objectivesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : userObjectives && userObjectives.length > 0 ? (
            <div className="space-y-4">
              {userObjectives.map((objective) => (
                <Card key={objective.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium">{objective.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm font-medium">{objective.progress}%</span>
                          </div>
                          <Progress value={objective.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="bg-primary-50 text-primary rounded-full px-3 py-1 text-xs font-medium">
                        {objective.status}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertTitle>No objectives found</AlertTitle>
              <AlertDescription>
                You don't have any objectives assigned yet. Create a new objective to get started.
              </AlertDescription>
            </Alert>
          )}

          {user?.teamId && (
            <>
              <h2 className="text-xl font-medium mt-8 mb-4">Team Objectives</h2>
              {teamObjectivesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                    <div className="flex-1 space-y-6 py-1">
                      <div className="h-2 bg-slate-200 rounded"></div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                          <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                        </div>
                        <div className="h-2 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : teamObjectives && teamObjectives.length > 0 ? (
                <div className="space-y-4">
                  {teamObjectives.map((objective) => (
                    <Card key={objective.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium">{objective.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{objective.description}</p>
                            
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">Progress</span>
                                <span className="text-sm font-medium">{objective.progress}%</span>
                              </div>
                              <Progress value={objective.progress} className="h-2" />
                            </div>
                          </div>
                          <div className="bg-primary-50 text-primary rounded-full px-3 py-1 text-xs font-medium">
                            {objective.status}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>No team objectives found</AlertTitle>
                  <AlertDescription>
                    Your team doesn't have any objectives yet.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </TabsContent>

        {/* Check-ins Tab */}
        <TabsContent value="checkins" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Check-ins</h2>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Check-in
            </Button>
          </div>

          {checkInsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-slate-200 h-10 w-10"></div>
                <div className="flex-1 space-y-6 py-1">
                  <div className="h-2 bg-slate-200 rounded"></div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                      <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                    </div>
                    <div className="h-2 bg-slate-200 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : checkIns && checkIns.length > 0 ? (
            <div className="space-y-4">
              {checkIns.map((checkIn: any) => (
                <Card key={checkIn.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {checkIn.objectiveId ? 'Objective Check-in' : 'Key Result Check-in'}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {checkIn.notes || 'No notes provided'}
                        </p>
                        
                        {checkIn.progress !== undefined && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm font-medium">{checkIn.progress}%</span>
                            </div>
                            <Progress value={checkIn.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(checkIn.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No check-ins found</AlertTitle>
              <AlertDescription>
                You haven't recorded any check-ins yet. Create a new check-in to track your progress.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.teamId ? (
                <div className="space-y-4">
                  {/* Team members would be fetched and displayed here */}
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      JD
                    </div>
                    <div>
                      <h3 className="font-medium">John Doe</h3>
                      <p className="text-sm text-gray-500">Product Manager</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      JS
                    </div>
                    <div>
                      <h3 className="font-medium">Jane Smith</h3>
                      <p className="text-sm text-gray-500">Designer</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 hover:bg-gray-50 rounded-md">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium mr-3">
                      RJ
                    </div>
                    <div>
                      <h3 className="font-medium">Robert Johnson</h3>
                      <p className="text-sm text-gray-500">Developer</p>
                    </div>
                    <div className="ml-auto text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        On Leave
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>No team assigned</AlertTitle>
                  <AlertDescription>
                    You are not currently assigned to any team. Contact your administrator to join a team.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Home;
