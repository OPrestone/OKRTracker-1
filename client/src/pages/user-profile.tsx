import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Building, 
  Target, 
  Calendar, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Clock
} from "lucide-react";

// Types for the profile
interface KeyResult {
  id: number;
  title: string;
  progress: number;
}

interface Objective {
  id: number;
  title: string;
  description: string;
  timeframe: string;
  progress: number;
  status: string;
  keyResults: KeyResult[];
}

// Sample data for profile
const userProfile = {
  name: "Alex Johnson",
  position: "Product Manager",
  email: "alex.johnson@company.com",
  department: "Product Development",
  joinDate: "March 2020",
  avatarUrl: "",
  avatarInitials: "AJ",
  bio: "Experienced product manager focused on user-centered design and agile methodologies. Passionate about creating products that solve real user problems."
};

const userObjectives: Objective[] = [
  {
    id: 1,
    title: "Launch mobile app redesign",
    description: "Complete redesign and release of our mobile application with improved user experience",
    timeframe: "Q3 2023",
    progress: 85,
    status: "on_track",
    keyResults: [
      { id: 101, title: "Complete UI design revisions", progress: 100 },
      { id: 102, title: "Implement backend API changes", progress: 90 },
      { id: 103, title: "Reach 95% test coverage", progress: 80 },
      { id: 104, title: "Execute beta testing program", progress: 70 }
    ]
  },
  {
    id: 2,
    title: "Improve user retention metrics",
    description: "Increase user retention through targeted improvements to the core user experience",
    timeframe: "Q3 2023",
    progress: 60,
    status: "at_risk",
    keyResults: [
      { id: 201, title: "Increase 30-day retention from 25% to 40%", progress: 50 },
      { id: 202, title: "Reduce first-week churn by 15%", progress: 40 },
      { id: 203, title: "Increase daily active users by 25%", progress: 90 }
    ]
  },
  {
    id: 3,
    title: "Establish customer feedback program",
    description: "Create structured process for collecting and acting on customer feedback",
    timeframe: "Q3 2023",
    progress: 35,
    status: "behind",
    keyResults: [
      { id: 301, title: "Implement in-app feedback mechanism", progress: 80 },
      { id: 302, title: "Conduct 20 customer interviews", progress: 25 },
      { id: 303, title: "Create feedback analysis dashboard", progress: 10 }
    ]
  },
  {
    id: 4,
    title: "Optimize feature development process",
    description: "Streamline the process from feature ideation to delivery",
    timeframe: "Q4 2023",
    progress: 15,
    status: "behind",
    keyResults: [
      { id: 401, title: "Reduce average development cycle by 20%", progress: 10 },
      { id: 402, title: "Implement automated testing for all new features", progress: 30 },
      { id: 403, title: "Document and standardize feature implementation process", progress: 5 }
    ]
  }
];

// Statistics for the profile
const userStats = [
  { name: "Objectives", value: userObjectives.length },
  { name: "On Track", value: userObjectives.filter(obj => obj.progress >= 70).length },
  { name: "At Risk", value: userObjectives.filter(obj => obj.progress >= 40 && obj.progress < 70).length },
  { name: "Behind", value: userObjectives.filter(obj => obj.progress < 40).length }
];

export default function UserProfile() {
  const [, navigate] = useLocation();

  // Helper function to determine progress color class based on value
  const getProgressColorClass = (progress: number): string => {
    if (progress >= 76) return "text-green-600";
    if (progress >= 51) return "text-yellow-600";
    if (progress >= 26) return "text-orange-600";
    return "text-red-600";
  };

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch(status) {
      case "on_track": return "bg-green-100 text-green-800";
      case "at_risk": return "bg-amber-100 text-amber-800";
      case "behind": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status text
  const getStatusText = (status: string): string => {
    switch(status) {
      case "on_track": return "On Track";
      case "at_risk": return "At Risk";
      case "behind": return "Behind";
      case "completed": return "Completed";
      default: return "Unknown";
    }
  };

  // Navigate to objective detail page
  const handleViewObjective = (id: number) => {
    navigate(`/objective-detail/${id}`);
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-5xl mx-auto">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <Avatar className="h-24 w-24">
                  {userProfile.avatarUrl ? (
                    <AvatarImage src={userProfile.avatarUrl} alt={userProfile.name} />
                  ) : (
                    <AvatarFallback className="text-2xl">{userProfile.avatarInitials}</AvatarFallback>
                  )}
                </Avatar>
              </div>
              <CardTitle>{userProfile.name}</CardTitle>
              <CardDescription>{userProfile.position}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{userProfile.email}</span>
                </div>
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">{userProfile.department}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Joined {userProfile.joinDate}</span>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">About</h4>
                  <p className="text-sm text-gray-600">{userProfile.bio}</p>
                </div>
                
                <Separator />
                
                {/* Stats */}
                <div>
                  <h4 className="text-sm font-medium mb-2">OKR Statistics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {userStats.map((stat, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded-md text-center">
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardFooter>
          </Card>

          {/* Content Area */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OKR Summary</CardTitle>
                <CardDescription>Your objectives and key results at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {userObjectives.map((objective) => (
                    <div 
                      key={objective.id} 
                      className="p-4 border rounded-md hover:shadow-sm cursor-pointer transition-all"
                      onClick={() => handleViewObjective(objective.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{objective.title}</h3>
                            <Badge className={getStatusColor(objective.status)}>
                              {getStatusText(objective.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{objective.description}</p>
                        </div>
                        <div className={`text-lg font-bold ${getProgressColorClass(objective.progress)}`}>
                          {objective.progress}%
                        </div>
                      </div>

                      <div className="mb-4">
                        <Progress value={objective.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Key Results ({objective.keyResults.length})</span>
                          <span className="text-gray-500">{objective.timeframe}</span>
                        </div>
                        
                        <div className="grid gap-2">
                          {objective.keyResults.slice(0, 2).map((kr) => (
                            <div key={kr.id} className="text-sm">
                              <div className="flex justify-between items-center">
                                <div className="truncate">{kr.title}</div>
                                <div className={getProgressColorClass(kr.progress)}>
                                  {kr.progress}%
                                </div>
                              </div>
                              <Progress value={kr.progress} className="h-1.5 mt-1" />
                            </div>
                          ))}
                        </div>
                        
                        {objective.keyResults.length > 2 && (
                          <Button variant="ghost" size="sm" className="w-full mt-2">
                            View all {objective.keyResults.length} key results
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest updates and check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completed key result</p>
                      <p className="text-sm text-gray-600">Complete UI design revisions</p>
                      <p className="text-xs text-gray-500">2 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Objective at risk</p>
                      <p className="text-sm text-gray-600">Improve user retention metrics</p>
                      <p className="text-xs text-gray-500">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-green-100 p-2 rounded-full">
                      <BarChart3 className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Progress update</p>
                      <p className="text-sm text-gray-600">Launch mobile app redesign (85% → 90%)</p>
                      <p className="text-xs text-gray-500">5 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Added new objective</p>
                      <p className="text-sm text-gray-600">Optimize feature development process</p>
                      <p className="text-xs text-gray-500">1 week ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}